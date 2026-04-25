import { useAuth } from '../../contexts/AuthContext.jsx';
import AuthFooter from '../../components/brand/AuthFooter.jsx';

export default function Rejected() {
  const { signOutUser } = useAuth();
  return (
    <div className="screen px-6 py-12">
      <div className="flex-1 flex flex-col justify-center text-center gap-4">
        <div className="mx-auto h-16 w-16 rounded-full bg-cream border border-border flex items-center justify-center text-ink-muted text-2xl">
          ✉
        </div>
        <h1 className="text-2xl font-display font-bold text-ink-primary">
          Not the right fit — yet
        </h1>
        <p className="text-ink-muted max-w-sm mx-auto leading-relaxed">
          We weren't able to approve your membership this time. If you believe
          this is a mistake, or you'd like to reapply, reach out to the team
          and we'll take another look.
        </p>
      </div>
      <button
        type="button"
        onClick={signOutUser}
        className="btn-secondary w-full mt-8"
      >
        Sign out
      </button>

      <AuthFooter className="mt-10" />
    </div>
  );
}
