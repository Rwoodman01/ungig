import { useRef, useState } from 'react';
import clsx from 'clsx';
import {
  replaceProfilePhoto,
  uploadDealCompletionPhoto,
  uploadPortfolioPhoto,
} from '../../lib/photos.js';

const ACCEPTED_IMAGE_TYPES = 'image/jpeg,image/png,image/webp,image/heic,image/heif';

export default function PhotoUploader({
  context,
  uid,
  dealId,
  disabled = false,
  children,
  buttonLabel = 'Upload photo',
  className = '',
  onUploaded,
}) {
  const inputRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleFiles = async (fileList) => {
    const file = fileList?.[0];
    if (!file || !uid) return;
    setBusy(true);
    setProgress(1);
    setError('');
    try {
      let uploaded;
      if (context === 'profile') {
        uploaded = await replaceProfilePhoto(uid, file, setProgress);
      } else if (context === 'portfolio') {
        uploaded = await uploadPortfolioPhoto(uid, file, setProgress);
      } else if (context === 'dealCompletion') {
        uploaded = await uploadDealCompletionPhoto({ dealId, uid, file, onProgress: setProgress });
      } else {
        throw new Error('Unknown photo upload context.');
      }
      onUploaded?.(uploaded);
    } catch (err) {
      setError(err.message ?? 'Upload failed. Please try again.');
    } finally {
      setBusy(false);
      setProgress(0);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES}
        className="sr-only"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <button
        type="button"
        disabled={disabled || busy}
        onClick={() => inputRef.current?.click()}
        className={clsx(
          'relative overflow-hidden',
          children ? 'block w-full text-left' : 'btn-secondary text-sm',
          disabled && 'opacity-60',
        )}
      >
        {children ?? (busy ? `Uploading ${progress}%` : buttonLabel)}
        {busy ? (
          <span className="absolute inset-x-0 bottom-0 h-1 bg-border">
            <span
              className="block h-full bg-green transition-all"
              style={{ width: `${progress}%` }}
            />
          </span>
        ) : null}
      </button>
      {error ? <p className="text-coral text-xs mt-2">{error}</p> : null}
    </div>
  );
}
