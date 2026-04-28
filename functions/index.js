const {
  onDocumentCreated,
  onDocumentDeleted,
  onDocumentWritten,
} = require('firebase-functions/v2/firestore');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getMessaging } = require('firebase-admin/messaging');
const { recalculateGiftedScore } = require('./giftedScore.js');

initializeApp();

const db = getFirestore();

const POST_FLAG_HIDE_THRESHOLD = 3;

function isObject(x) {
  return x && typeof x === 'object' && !Array.isArray(x);
}

function pick(obj, keys) {
  const out = {};
  keys.forEach((k) => {
    out[k] = obj?.[k];
  });
  return out;
}

function shallowChanged(a, b, keys) {
  const left = pick(a, keys);
  const right = pick(b, keys);
  return keys.some((k) => JSON.stringify(left[k]) !== JSON.stringify(right[k]));
}

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

// Gifted Score ────────────────────────────────────────────────────────────────
//
// Keep `users/{uid}.giftedScore` up to date based on activity and profile data.
// Breakdown is written privately to `users/{uid}/giftedScoreMeta/breakdown`.

exports.onReviewForScoreWritten = onDocumentWritten(
  'reviews/{reviewId}',
  async (event) => {
    const after = event.data?.after;
    if (!after?.exists) return;
    const review = after.data();
    const uid = review.revieweeId;
    if (!uid) return;
    await recalculateGiftedScore(db, uid);
  },
);

exports.onDealForScoreWritten = onDocumentWritten(
  'deals/{dealId}',
  async (event) => {
    const before = event.data?.before?.exists ? event.data.before.data() : null;
    const after = event.data?.after?.exists ? event.data.after.data() : null;
    if (!after) return;

    // Set proposalFirstResponseAt exactly once: first time a deal leaves 'requested'.
    const leftRequested =
      before?.status === 'requested'
      && after.status
      && after.status !== 'requested'
      && !after.proposalFirstResponseAt;

    if (leftRequested) {
      await db.doc(`deals/${event.params.dealId}`).set(
        {
          proposalFirstResponseAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    }

    const participants = Array.isArray(after.participantIds) ? after.participantIds : [];
    const initiatorId = after.initiatorId;
    const receiverId = after.receiverId;
    const uids = Array.from(new Set([...participants, initiatorId, receiverId].filter(Boolean)));
    if (!uids.length) return;

    // Recalc on create, completion, dispute changes, or first-response timestamp.
    const isCreate = !before && Boolean(after);
    const relevant = !before || shallowChanged(before, after, [
      'status',
      'completedAt',
      'disputeStatus',
      'proposalFirstResponseAt',
    ]);

    if (isCreate || relevant) {
      await Promise.all(uids.map((uid) => recalculateGiftedScore(db, uid)));
    }
  },
);

exports.onUserForScoreWritten = onDocumentWritten(
  'users/{uid}',
  async (event) => {
    const before = event.data?.before?.exists ? event.data.before.data() : null;
    const after = event.data?.after?.exists ? event.data.after.data() : null;
    if (!after) return;

    // Avoid feedback loops: ignore writes that only touch score bookkeeping.
    if (before && !shallowChanged(before, after, [
      'photoURL',
      'profilePhotoPath',
      'bio',
      'location',
      'talentsOffered',
      'servicesNeeded',
      'giftedScore',
      'giftedScoreUpdatedAt',
    ])) {
      return;
    }

    const changedProfileFields = !before || shallowChanged(before, after, [
      'photoURL',
      'profilePhotoPath',
      'bio',
      'location',
      'talentsOffered',
      'servicesNeeded',
    ]);

    const changedOnlyScoreFields = before && !changedProfileFields
      && shallowChanged(before, after, ['giftedScore', 'giftedScoreUpdatedAt'])
      && !shallowChanged(before, after, [
        'photoURL',
        'profilePhotoPath',
        'bio',
        'location',
        'talentsOffered',
        'servicesNeeded',
      ]);

    if (changedOnlyScoreFields) return;

    if (changedProfileFields) {
      await recalculateGiftedScore(db, event.params.uid);
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
