import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { db } from '../firebase.js';

const queueCol = (uid) => collection(db, 'users', uid, 'reviewQueue');

/** Participant (or self) can create a pending review row when an exchange completes. */
export async function setReviewQueueEntry(userId, dealId) {
  await setDoc(doc(db, 'users', userId, 'reviewQueue', dealId), {
    dealId,
    completedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  });
}

export async function clearReviewQueueEntry(userId, dealId) {
  await deleteDoc(doc(db, 'users', userId, 'reviewQueue', dealId));
}

export function subscribeReviewQueue(userId, onData) {
  return onSnapshot(queueCol(userId), (snap) => {
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    onData(items);
  });
}

export async function fetchReviewQueue(userId) {
  const snap = await getDocs(query(queueCol(userId)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
