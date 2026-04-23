import { useRef, useState } from 'react';
import clsx from 'clsx';
import { uploadUserFile } from '../../lib/storage.js';

// Single-photo uploader (avatar) or multi-photo grid (proof photos).
// Uploads immediately to Firebase Storage and hands the parent back the URL.
export default function PhotoUploader({
  uid,
  kind = 'photos',           // folder under users/{uid}/...
  value,                     // string URL (single) OR string[] (multi)
  onChange,
  multi = false,
  max = 6,
  label,
}) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const urls = multi ? Array.isArray(value) ? value : [] : [];
  const singleUrl = !multi ? value || '' : '';

  const handleFiles = async (files) => {
    if (!files?.length || !uid) return;
    setBusy(true);
    setError('');
    try {
      if (multi) {
        const slots = Math.max(0, max - urls.length);
        const toUpload = Array.from(files).slice(0, slots);
        const uploaded = [];
        for (const f of toUpload) {
          const { url } = await uploadUserFile(uid, kind, f);
          uploaded.push(url);
        }
        onChange([...urls, ...uploaded]);
      } else {
        const { url } = await uploadUserFile(uid, kind, files[0]);
        onChange(url);
      }
    } catch (err) {
      setError(err.message ?? 'Upload failed.');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  if (!multi) {
    return (
      <div>
        {label ? (
          <label className="text-sm font-medium text-ink-100 mb-2 block">
            {label}
          </label>
        ) : null}
        <div className="flex items-center gap-4">
          <div
            className={clsx(
              'h-20 w-20 rounded-full overflow-hidden bg-navy-800',
              'border border-navy-700 flex items-center justify-center text-ink-300',
            )}
          >
            {singleUrl ? (
              <img src={singleUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-xs">No photo</span>
            )}
          </div>
          <div className="flex-1 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="btn-secondary text-sm"
              disabled={busy}
            >
              {busy ? 'Uploading...' : singleUrl ? 'Replace photo' : 'Upload photo'}
            </button>
            {singleUrl ? (
              <button
                type="button"
                onClick={() => onChange('')}
                className="text-xs text-ink-300 text-left"
              >
                Remove
              </button>
            ) : null}
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        {error ? <p className="text-red-400 text-xs mt-2">{error}</p> : null}
      </div>
    );
  }

  return (
    <div>
      {label ? (
        <label className="text-sm font-medium text-ink-100 mb-2 block">
          {label}
          <span className="text-ink-300 text-xs ml-2">
            {urls.length}/{max}
          </span>
        </label>
      ) : null}
      <div className="grid grid-cols-3 gap-2">
        {urls.map((url) => (
          <div key={url} className="relative aspect-square rounded-lg overflow-hidden bg-navy-800 border border-navy-700">
            <img src={url} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(urls.filter((u) => u !== url))}
              className="absolute top-1 right-1 bg-navy-950/70 text-ink-50 rounded-full h-6 w-6 text-xs"
              aria-label="Remove photo"
            >
              ×
            </button>
          </div>
        ))}
        {urls.length < max ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="aspect-square rounded-lg border border-dashed border-navy-700 text-ink-300 text-sm hover:bg-navy-800"
          >
            {busy ? '...' : '+ Add'}
          </button>
        ) : null}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      {error ? <p className="text-red-400 text-xs mt-2">{error}</p> : null}
    </div>
  );
}
