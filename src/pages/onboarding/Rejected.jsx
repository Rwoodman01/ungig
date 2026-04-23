import { useAuth } from '../../contexts/AuthContext.jsx';

export default function Rejected() {
  const { signOutUser } = useAuth();
  return (
    <div className="screen px-6 py-10">
      <div className="flex-1 flex flex-col justify-center text-center gap-4">
        <h1 className="text-2xl font-display font-bold text-ink-50">
          Application not accepted
        </h1>
        <p className="text-ink-300 max-w-sm mx-auto">
          We weren't able to approve your membership this time. If you believe
          this is a mistake, reach out to the team.
        </p>
      </div>
      <button
        type="button"
        onClick={signOutUser}
        className="btn-secondary w-full mt-6"
      >
        Sign out
      </button>
    </div>
  );
}
