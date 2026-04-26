const {
  onDocumentCreated,
  onDocumentDeleted,
  onDocumentWritten,
} = require('firebase-functions/v2/firestore');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getMessaging } = require('firebase-admin/messaging');

initializeApp();

const db = getFirestore();

const POST_FLAG_HIDE_THRESHOLD = 3;

function matchIdFor(a, b) {
  return [a, b].sort().join('_');
}

async function getDisplayName(uid) {
  const snap = await db.doc(`users/${uid}`).get();
  return snap.exists ? (snap.data().displayName || 'Someone') : 'Someone';
}

async function writeNotification({ recipientId, fromUid, otherName, matchId }) {
  await db.collection(`users/${recipientId}/notifications`).add({
    type: 'match',
    message: `It's a match with ${otherName}! Giff thinks you two would trade well together.`,
    link: '/matches',
    recipientId,
    fromUid,
    matchId,
    readAt: null,
    createdAt: FieldValue.serverTimestamp(),
  });
}

exports.onSwipeWritten = onDocumentWritten('users/{uid}/swipes/{targetUid}', async (event) => {
  const { uid, targetUid } = event.params;
  const after = event.data?.after;
  if (!after?.exists) return;

  const swipe = after.data();
  if (uid === targetUid || swipe.direction !== 'right') return;

  const reciprocalSnap = await db.doc(`users/${targetUid}/swipes/${uid}`).get();
  if (!reciprocalSnap.exists || reciprocalSnap.data().direction !== 'right') return;

  const matchId = matchIdFor(uid, targetUid);
  const matchRef = db.doc(`matches/${matchId}`);

  let created = false;
  await db.runTransaction(async (tx) => {
    const existing = await tx.get(matchRef);
    if (existing.exists) return;
    const [userA, userB] = [uid, targetUid].sort();
    tx.set(matchRef, {
      participantIds: [userA, userB],
      userA,
      userB,
      status: 'active',
      createdFrom: 'swipe',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      lastActionAt: FieldValue.serverTimestamp(),
    });
    created = true;
  });

  if (!created) return;

  const [uidName, targetName] = await Promise.all([
    getDisplayName(uid),
    getDisplayName(targetUid),
  ]);

  await Promise.all([
    writeNotification({ recipientId: uid, fromUid: targetUid, otherName: targetName, matchId }),
    writeNotification({ recipientId: targetUid, fromUid: uid, otherName: uidName, matchId }),
  ]);
});

// Push notifications ──────────────────────────────────────────────────────────
//
// Single function that fans out a Web Push message for every notification doc
// created anywhere in  users/{uid}/notifications/{nid}.  This covers ALL
// notification types automatically — matches, trades, reviews, bulletin posts —
// without per-event wiring.  Stale FCM tokens are cleaned up automatically.

exports.onNotificationCreated = onDocumentCreated(
  'users/{uid}/notifications/{nid}',
  async (event) => {
    const { uid, nid } = event.params;
    const notification = event.data?.data();
    if (!notification) return;

    // Fetch all FCM tokens stored for this user (one per device).
    const tokensSnap = await db
      .collection(`users/${uid}/fcmTokens`)
      .get();

    if (tokensSnap.empty) return;

    const tokenDocs = tokensSnap.docs;
    const tokens = tokenDocs.map((d) => d.data().token).filter(Boolean);
    if (!tokens.length) return;

    const message = {
      notification: {
        title: 'Gifted',
        body: notification.message ?? 'You have a new notification.',
      },
      data: {
        link: notification.link ?? '/',
        notificationId: nid,
      },
      webpush: {
        fcmOptions: {
          // Clicking the notification navigates here (Chrome / Edge).
          link: notification.link ?? '/',
        },
      },
      tokens,
    };

    let response;
    try {
      response = await getMessaging().sendEachForMulticast(message);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[Gifted] FCM sendEachForMulticast error', err);
      return;
    }

    // Remove any tokens the browser has invalidated (user cleared site data,
    // revoked permission, etc.) to avoid sending to dead registrations.
    const staleIds = [];
    response.responses.forEach((r, i) => {
      if (
        !r.success &&
        (r.error?.code === 'messaging/registration-token-not-registered' ||
          r.error?.code === 'messaging/invalid-registration-token')
      ) {
        staleIds.push(tokenDocs[i].id);
      }
    });

    if (staleIds.length) {
      const batch = db.batch();
      staleIds.forEach((id) => {
        batch.delete(db.doc(`users/${uid}/fcmTokens/${id}`));
      });
      await batch.commit();
    }
  },
);

// Bulletin board ─────────────────────────────────────────────────────────────
//
// Aggregate counts and auto-hide on flag pile-ups. The client never writes to
// posts.flagCount / posts.interestCount directly; rules block that.

exports.onBulletinFlagWritten = onDocumentCreated(
  'posts/{postId}/flags/{flagId}',
  async (event) => {
    const { postId } = event.params;
    const postRef = db.doc(`posts/${postId}`);

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(postRef);
      if (!snap.exists) return;
      const flagsSnap = await db.collection(`posts/${postId}/flags`).count().get();
      const flagCount = flagsSnap.data().count ?? 0;
      const update = {
        flagCount,
        updatedAt: FieldValue.serverTimestamp(),
      };
      if (flagCount >= POST_FLAG_HIDE_THRESHOLD && snap.data().status === 'active') {
        update.status = 'hidden';
      }
      tx.update(postRef, update);
    });
  },
);

exports.onBulletinInterestWritten = onDocumentWritten(
  'posts/{postId}/interests/{uid}',
  async (event) => {
    const { postId } = event.params;
    const before = event.data?.before;
    const after = event.data?.after;
    const becameNew = !before?.exists && after?.exists;
    const wasDeleted = before?.exists && !after?.exists;
    if (!becameNew && !wasDeleted) return;

    const interestSnap = await db.collection(`posts/${postId}/interests`).count().get();
    await db.doc(`posts/${postId}`).set(
      {
        interestCount: interestSnap.data().count ?? 0,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  },
);

// Keep aggregate counts honest if a moderator deletes a flag manually.
exports.onBulletinFlagDeleted = onDocumentDeleted(
  'posts/{postId}/flags/{flagId}',
  async (event) => {
    const { postId } = event.params;
    const postRef = db.doc(`posts/${postId}`);
    const snap = await postRef.get();
    if (!snap.exists) return;
    const flagsSnap = await db.collection(`posts/${postId}/flags`).count().get();
    await postRef.set(
      {
        flagCount: flagsSnap.data().count ?? 0,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  },
);
