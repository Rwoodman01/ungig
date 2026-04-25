import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase.js';
import { PHOTO_LIMITS, deletePhotoObject } from '../../lib/photos.js';
import PhotoGrid from './PhotoGrid.jsx';
import PhotoUploader from './PhotoUploader.jsx';

export default function DealCompletionPhotoManager({ deal, uid, otherName }) {
  const myPhotos = deal?.completionPhotos?.[uid] ?? [];
  const canAdd = myPhotos.length < PHOTO_LIMITS.DEAL_COMPLETION_MAX;

  const deletePhoto = async (photo) => {
    const next = myPhotos.filter((p) => p.path !== photo.path);
    if (photo.path) await deletePhotoObject(photo.path);
    await updateDoc(doc(db, 'deals', deal.id), {
      [`completionPhotos.${uid}`]: next,
      updatedAt: serverTimestamp(),
    });
  };

  const participantPhotoGroups = Object.entries(deal?.completionPhotos ?? {})
    .filter(([, photos]) => photos?.length);

  return (
    <section className="card p-4 space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-ink-primary">Completion photos</h2>
        <p className="text-xs text-ink-muted mt-1">
          Upload up to {PHOTO_LIMITS.DEAL_COMPLETION_MAX} proof photos from your completed exchange.
        </p>
      </div>

      {canAdd ? (
        <PhotoUploader
          context="dealCompletion"
          uid={uid}
          dealId={deal.id}
          buttonLabel="Add completion photo"
        />
      ) : (
        <p className="text-xs text-ink-muted">You have uploaded all 3 completion photos.</p>
      )}

      {participantPhotoGroups.length ? (
        <div className="space-y-4">
          {participantPhotoGroups.map(([participantId, photos]) => (
            <div key={participantId} className="space-y-2">
              <h3 className="text-xs font-semibold text-ink-secondary">
                {participantId === uid ? 'Your photos' : `${otherName ?? 'Their'} photos`}
              </h3>
              <PhotoGrid
                photos={photos}
                editable={participantId === uid}
                onDelete={deletePhoto}
                emptyText=""
              />
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
