const {
  onDocumentCreated,
  onDocumentDeleted,
  onDocumentWritten,
} = require('firebase-functions/v2/firestore');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

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
