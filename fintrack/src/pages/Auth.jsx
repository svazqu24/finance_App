import { useState, useEffect } from 'react';
import { useApp } from '../AppContext';

const inputCls =
  'w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm ' +
  'bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 ' +
  'outline-none focus:border-gray-400 dark:focus:border-gray-400 transition-colors';

const labelCls = 'text-[11px] uppercase tracking-[.08em] text-gray-400 block mb-1';

// Possible modes:
//   'login'  — sign in form
//   'signup' — create account form
//   'forgot' — enter email to receive reset link
//   'reset'  — enter new password (reached via password-reset email link)

export default function Auth() {
  const { signIn, signUp, signOut, resetPassword, updatePassword, passwordRecovery } = useApp();

  const [mode, setMode]         = useState(passwordRecovery ? 'reset' : 'login');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [error, setError]       = useState('');
  const [notice, setNotice]     = useState('');
  const [busy, setBusy]         = useState(false);

  // If the PASSWORD_RECOVERY event arrives after mount (async), switch automatically
  useEffect(() => {
    if (passwordRecovery) setMode('reset');
  }, [passwordRecovery]);

  function goTo(next) {
    setMode(next);
    setError('');
    setNotice('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setNotice('');
    setBusy(true);

    try {
      if (mode === 'login') {
        await signIn(email, password);
        // onAuthStateChange in AppContext drives the rest — nothing to do here

      } else if (mode === 'signup') {
        const data = await signUp(email, password);
        if (!data.session) {
          // Email confirmation is required — show a clear message and go to login
          // (set fields individually so we control exactly what stays/clears)
          setMode('login');
          setPassword('');
          setError('');
          setNotice(
            'Check your email and click the confirmation link to continue.'
          );
        }
        // If data.session exists, onAuthStateChange logs the user in automatically

      } else if (mode === 'forgot') {
        await resetPassword(email);
        setNotice('Check your email for a password reset link.');
        setEmail('');

      } else if (mode === 'reset') {
        if (password !== confirm) {
          setError('Passwords do not match.');
          return;
        }
        await updatePassword(password);
        // passwordRecovery becomes false → App.jsx shows the dashboard
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  // ── Derived UI strings ────────────────────────────────────────────────────────
  const titles = {
    login:  'Sign in to your account',
    signup: 'Create your account',
    forgot: 'Reset your password',
    reset:  'Set a new password',
  };

  const submitLabel = {
    login:  busy ? '…' : 'Sign in',
    signup: busy ? '…' : 'Create account',
    forgot: busy ? '…' : 'Send reset link',
    reset:  busy ? '…' : 'Update password',
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center px-4 transition-colors">
      <div className="w-full max-w-sm">

        {/* Title */}
        <div className="mb-8">
          <h1 className="text-2xl font-medium text-gray-900 dark:text-white mb-1">FinTrack</h1>
          <p className="text-sm text-gray-400">{titles[mode]}</p>
        </div>

        {/* Notice banner */}
        {notice && (
          <div className="text-sm rounded-lg px-4 py-3 mb-4 leading-relaxed"
               style={{ background: '#C8EBB4', color: '#27500A' }}>
            {notice}
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div className="text-sm rounded-lg px-4 py-3 mb-4"
               style={{ background: '#F7C1C1', color: '#791F1F' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">

          {/* Email — shown on all modes except reset */}
          {mode !== 'reset' && (
            <div>
              <label className={labelCls}>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className={inputCls} autoComplete="email" required />
            </div>
          )}

          {/* Password — shown on login, signup, and reset */}
          {(mode === 'login' || mode === 'signup' || mode === 'reset') && (
            <div>
              <label className={labelCls}>
                {mode === 'reset' ? 'New password' : 'Password'}
              </label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className={inputCls}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                minLength={6} required />
              {(mode === 'signup' || mode === 'reset') && (
                <p className="text-[11px] text-gray-400 mt-1">Minimum 6 characters</p>
              )}
            </div>
          )}

          {/* Confirm password — reset only */}
          {mode === 'reset' && (
            <div>
              <label className={labelCls}>Confirm new password</label>
              <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
                className={inputCls} autoComplete="new-password" minLength={6} required />
            </div>
          )}

          {/* Forgot password link — login only */}
          {mode === 'login' && (
            <div className="flex justify-end -mt-1">
              <button type="button" onClick={() => goTo('forgot')}
                className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                Forgot password?
              </button>
            </div>
          )}

          <button type="submit" disabled={busy}
            className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium py-2.5 rounded-lg mt-1 transition-colors disabled:opacity-50">
            {submitLabel[mode]}
          </button>
        </form>

        {/* Footer links */}
        <div className="mt-5 text-center">
          {mode === 'login' && (
            <p className="text-xs text-gray-400">
              Don't have an account?{' '}
              <button type="button" onClick={() => goTo('signup')}
                className="text-gray-900 dark:text-white font-medium hover:underline underline-offset-2">
                Sign up
              </button>
            </p>
          )}

          {mode === 'signup' && (
            <p className="text-xs text-gray-400">
              Already have an account?{' '}
              <button type="button" onClick={() => goTo('login')}
                className="text-gray-900 dark:text-white font-medium hover:underline underline-offset-2">
                Sign in
              </button>
            </p>
          )}

          {(mode === 'forgot' || mode === 'reset') && (
            <button type="button" onClick={() => { signOut(); goTo('login'); }}
              className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
              ← Back to sign in
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
