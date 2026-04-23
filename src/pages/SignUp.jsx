import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import Wordmark from '../components/brand/Wordmark.jsx';
import AuthFooter from '../components/brand/AuthFooter.jsx';

export default function SignUp() {
  const { user, signUpWithEmail, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (user) {
    const to = location.state?.from?.pathname ?? '/';
    return <Navigate to={to} replace />;
  }

  const handleEmail = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await signUpWithEmail(email.trim(), password, displayName.trim());
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message?.replace('Firebase: ', '') ?? 'Sign up failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setBusy(true);
    setError('');
    try {
      await signInWithGoogle();
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message ?? 'Google sign-in failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="screen px-6 py-10">
      <Wordmark size="lg" />
      <h1 className="text-3xl mt-4 text-silver">Start your escape</h1>
      <p className="text-silver-300 mt-1 text-sm">
        Create your account to request membership.
      </p>

      <form onSubmit={handleEmail} className="mt-8 space-y-3">
        <input
          className="input"
          placeholder="Your name"
          autoComplete="name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
        />
        <input
          className="input"
          placeholder="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="input"
          placeholder="Password (min 8 chars)"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          required
        />
        {error ? <p className="text-red-400 text-sm">{error}</p> : null}
        <button className="btn-primary w-full" disabled={busy}>
          {busy ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3 text-ink-300 text-xs uppercase tracking-wider">
        <span className="flex-1 h-px bg-navy-800" />
        or
        <span className="flex-1 h-px bg-navy-800" />
      </div>

      <button
        type="button"
        onClick={handleGoogle}
        className="btn-secondary w-full"
        disabled={busy}
      >
        Continue with Google
      </button>

      <p className="mt-8 text-center text-sm text-silver-300">
        Already a member?{' '}
        <Link to="/signin" className="text-lilac font-medium">
          Sign in
        </Link>
      </p>

      <AuthFooter className="mt-10" />
    </div>
  );
}
