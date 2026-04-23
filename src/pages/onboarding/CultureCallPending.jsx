import { useAuth } from '../../contexts/AuthContext.jsx';

// Onboarding step 2: "Culture Call Pending".
// An admin reviews and flips status to approved/rejected from the dashboard.
export default function CultureCallPending() {
  const { user, signOutUser } = useAuth();
  return (
    <div className="screen px-6 py-10">
      <div className="flex-1 flex flex-col justify-center text-center gap-4">
        <div className="mx-auto h-20 w-20 rounded-full bg-gold-500/15 flex items-center justify-center text-gold-400 text-3xl">
          ⏳
        </div>
        <h1 className="text-3xl font-display font-bold text-gold-400">
          Culture Call Pending
        </h1>
        <p className="text-ink-300 max-w-sm mx-auto">
          Thanks for joining. A community steward will reach out for a short
          culture call. Once approved, you'll be able to complete your profile
          and browse the member directory.
        </p>
        <p className="text-ink-300 text-sm">
          You'll get an email at <span className="text-ink-50">{user?.email}</span>.
        </p>
      </div>
      <button
        type="button"
        onClick={signOutUser}
        className="btn-ghost w-full mt-6 text-sm"
      >
        Sign out
      </button>
    </div>
  );
}
