import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import Wordmark from '../components/brand/Wordmark.jsx';
import AuthFooter from '../components/brand/AuthFooter.jsx';

export default function SignIn() {
  const { user, signInWithEmail, signInWithGoogle, resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  if (user) {
    const to = location.state?.from?.pathname ?? '/';
    return <Navigate to={to} replace />;
  }

  const handleEmail = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    setInfo('');
    try {
      await signInWithEmail(email.trim(), password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message?.replace('Firebase: ', '') ?? 'Sign in failed.');
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

  const handleReset = async () => {
    if (!email) {
      setError('Enter your email above first, then tap Forgot password.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await resetPassword(email.trim());
      setInfo('Check your inbox for a password reset link.');
    } catch (err) {
      setError(err.message ?? 'Unable to send reset email.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="screen px-6 py-10">
      <Wordmark size="lg" />
      <h1 className="text-3xl mt-4 text-silver">Welcome back</h1>
      <p className="text-silver-300 mt-1 text-sm">Sign in to continue.</p>

      <form onSubmit={handleEmail} className="mt-8 space-y-3">
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
          placeholder="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error ? <p className="text-red-400 text-sm">{error}</p> : null}
        {info ? <p className="text-emerald-400 text-sm">{info}</p> : null}
        <button className="btn-primary w-full" disabled={busy}>
          {busy ? 'Signing in...' : 'Sign in'}
        </button>
        <button
          type="button"
          className="text-sm text-ink-300 w-full text-center mt-2"
          onClick={handleReset}
        >
          Forgot password?
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
        New here?{' '}
        <Link to="/signup" className="text-lilac font-medium">
          Create an account
        </Link>
      </p>

      <AuthFooter className="mt-10" />
    </div>
  );
}
