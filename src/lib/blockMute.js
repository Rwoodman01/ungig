// Block / mute helpers — mirror paths for server rules and Cloud Functions.

import {
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase.js';

export async function isPairBlocked(a, b) {
  if (!a || !b || a === b) return false;
  const [ab1, ab2, ba1, ba2] = await Promise.all([
    getDoc(doc(db, 'users', a, 'blocks', b)),
    getDoc(doc(db, 'users', a, 'blockedBy', b)),
    getDoc(doc(db, 'users', b, 'blocks', a)),
    getDoc(doc(db, 'users', b, 'blockedBy', a)),
  ]);
  return ab1.exists() || ab2.exists() || ba1.exists() || ba2.exists();
}

export async function recipientHasMutedSender(recipientId, senderId) {
  if (!recipientId || !senderId || recipientId === senderId) return false;
  const snap = await getDoc(doc(db, 'users', recipientId, 'mutes', senderId));
  return snap.exists();
}

export async function blockMember({ blockerUid, blockedUid }) {
  if (!blockerUid || !blockedUid || blockerUid === blockedUid) return;
  const batch = writeBatch(db);
  batch.set(doc(db, 'users', blockerUid, 'blocks', blockedUid), {
    blockedUid,
    createdAt: serverTimestamp(),
  });
  batch.set(doc(db, 'users', blockedUid, 'blockedBy', blockerUid), {
    blockerId: blockerUid,
    createdAt: serverTimestamp(),
  });
  await batch.commit();
}

export async function unblockMember({ blockerUid, blockedUid }) {
  if (!blockerUid || !blockedUid) return;
  const batch = writeBatch(db);
  batch.delete(doc(db, 'users', blockerUid, 'blocks', blockedUid));
  batch.delete(doc(db, 'users', blockedUid, 'blockedBy', blockerUid));
  await batch.commit();
}

export async function muteMember({ uid, mutedUid }) {
  if (!uid || !mutedUid || uid === mutedUid) return;
  await setDoc(
    doc(db, 'users', uid, 'mutes', mutedUid),
    { mutedUid, createdAt: serverTimestamp() },
    { merge: true },
  );
}

export async function unmuteMember({ uid, mutedUid }) {
  if (!uid || !mutedUid) return;
  await deleteDoc(doc(db, 'users', uid, 'mutes', mutedUid));
}
