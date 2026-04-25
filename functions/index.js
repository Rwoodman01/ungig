const { onDocumentWritten } = require('firebase-functions/v2/firestore');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

initializeApp();

const db = getFirestore();

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
