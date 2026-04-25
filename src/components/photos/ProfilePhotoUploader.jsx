import Avatar from '../ui/Avatar.jsx';
import PhotoUploader from './PhotoUploader.jsx';

export default function ProfilePhotoUploader({ uid, photoURL, displayName, onUploaded }) {
  return (
    <div>
      <label className="text-sm font-medium text-ink-secondary mb-2 block">
        Profile photo
      </label>
      <div className="flex items-center gap-4">
        <PhotoUploader
          context="profile"
          uid={uid}
          buttonLabel={photoURL ? 'Replace photo' : 'Upload photo'}
          onUploaded={onUploaded}
          className="shrink-0"
        >
          <Avatar src={photoURL} name={displayName} size="xl" className="cursor-pointer" />
        </PhotoUploader>
        <div className="flex-1">
          <PhotoUploader
            context="profile"
            uid={uid}
            buttonLabel={photoURL ? 'Replace photo' : 'Upload photo'}
            onUploaded={onUploaded}
          />
          <p className="text-xs text-ink-muted mt-2">
            Tap the photo or button to upload. We resize it before saving.
          </p>
        </div>
      </div>
    </div>
  );
}
