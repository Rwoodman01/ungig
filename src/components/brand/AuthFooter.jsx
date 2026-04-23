import { AUTH_FOOTER_LINE } from '../../lib/constants';

/**
 * Brand-mandated footer line for every auth-adjacent surface
 * (Landing, SignIn, SignUp, onboarding intros).
 *   "Escape ordinary. Build extraordinary."
 */
export default function AuthFooter({ className = '' }) {
  return (
    <div className={`auth-footer text-center ${className}`}>
      {AUTH_FOOTER_LINE}
    </div>
  );
}
