import imageCompression from 'browser-image-compression';
import {
  deleteObject,
  getDownloadURL,
  ref as storageRef,
  uploadBytesResumable,
} from 'firebase/storage';
import {
  arrayUnion,
  doc,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import { db, storage } from '../firebase.js';

export const PHOTO_LIMITS = Object.freeze({
  PROFILE_MAX: 1,
  PORTFOLIO_MAX: 9,
  DEAL_COMPLETION_MAX: 3,
});

const PRESETS = {
  profile: { maxSizeMB: 0.7, maxWidthOrHeight: 800 },
  portfolio: { maxSizeMB: 1.2, maxWidthOrHeight: 1200 },
  dealCompletion: { maxSizeMB: 1.2, maxWidthOrHeight: 1200 },
};

function randomId() {
  return Math.random().toString(36).slice(2, 10);
}

function safeName(prefix = 'photo') {
  return `${Date.now()}-${randomId()}-${prefix}.jpg`;
}

export function profilePhotoPath(uid) {
  return `users/${uid}/profile/avatar.jpg`;
}

export function portfolioPhotoPath(uid) {
  return `users/${uid}/portfolio/${safeName('portfolio')}`;
}

export function dealCompletionPhotoPath(dealId, uid) {
  return `deals/${dealId}/photos/${uid}/${safeName('completed-work')}`;
}

export async function compressPhoto(file, preset = 'portfolio') {
  const options = PRESETS[preset] ?? PRESETS.portfolio;
  try {
    return await imageCompression(file, {
      ...options,
      useWebWorker: true,
      fileType: 'image/jpeg',
      initialQuality: 0.82,
    });
  } catch (err) {
    throw new Error(
      err?.message?.includes('decode')
        ? 'This photo could not be processed. Please choose a JPG or PNG.'
        : 'This photo could not be compressed. Please try another image.',
    );
  }
}

export function uploadPhotoWithProgress({ path, file, onProgress }) {
  return new Promise((resolve, reject) => {
    const ref = storageRef(storage, path);
    const task = uploadBytesResumable(ref, file, {
      contentType: 'image/jpeg',
      cacheControl: 'public,max-age=31536000',
    });

    task.on(
      'state_changed',
      (snapshot) => {
        const pct = snapshot.totalBytes
          ? Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)
          : 0;
        onProgress?.(pct);
      },
      reject,
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        resolve({ url, path });
      },
    );
  });
}

export async function replaceProfilePhoto(uid, file, onProgress) {
  const compressed = await compressPhoto(file, 'profile');
  const path = profilePhotoPath(uid);
  const uploaded = await uploadPhotoWithProgress({ path, file: compressed, onProgress });
  await updateDoc(doc(db, 'users', uid), {
    photoURL: uploaded.url,
    profilePhotoPath: uploaded.path,
    updatedAt: serverTimestamp(),
  });
  return uploaded;
}

export async function uploadPortfolioPhoto(uid, file, onProgress) {
  const compressed = await compressPhoto(file, 'portfolio');
  const uploaded = await uploadPhotoWithProgress({
    path: portfolioPhotoPath(uid),
    file: compressed,
    onProgress,
  });
  const photo = {
    ...uploaded,
    createdAt: Timestamp.now(),
  };
  await updateDoc(doc(db, 'users', uid), {
    portfolioPhotos: arrayUnion(photo),
    updatedAt: serverTimestamp(),
  });
  return photo;
}

export async function deletePhotoObject(path) {
  if (!path) return;
  try {
    await deleteObject(storageRef(storage, path));
  } catch {
    // Missing objects should not strand Firestore cleanup.
  }
}

export async function uploadDealCompletionPhoto({ dealId, uid, file, onProgress }) {
  const compressed = await compressPhoto(file, 'dealCompletion');
  const uploaded = await uploadPhotoWithProgress({
    path: dealCompletionPhotoPath(dealId, uid),
    file: compressed,
    onProgress,
  });
  const photo = {
    ...uploaded,
    uploadedBy: uid,
    createdAt: Timestamp.now(),
  };
  await updateDoc(doc(db, 'deals', dealId), {
    [`completionPhotos.${uid}`]: arrayUnion(photo),
    updatedAt: serverTimestamp(),
  });
  return photo;
}
