import { useEffect, useState, useRef } from 'react';
import { getDownloadURL, ref } from 'firebase/storage';
import { storage } from '../firebase.js';

/**
 * Resolve a pose image from Storage at `giff-poses/{poseBase}-{variant}.png`.
 * Variant 1–3 is chosen once per mount. Falls back to local Giff on failure.
 */
export function useGiffPoseUrl(poseBase) {
  const variantRef = useRef(1 + Math.floor(Math.random() * 3));
  const [url, setUrl] = useState('/giff/face.png');

  useEffect(() => {
    if (!poseBase) return;
    let cancelled = false;
    const v = variantRef.current;
    const path = `giff-poses/${poseBase}-${v}.png`;
    getDownloadURL(ref(storage, path))
      .then((u) => {
        if (!cancelled) setUrl(u);
      })
      .catch(() => {
        if (!cancelled) setUrl('/giff/face.png');
      });
    return () => { cancelled = true; };
  }, [poseBase]);

  return url;
}
