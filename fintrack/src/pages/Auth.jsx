import { useState, useEffect } from 'react';
import { useApp } from '../AppContext';

const inputCls =
  'w-full border border-gray-200 dark:border-nero-border rounded-lg px-3 py-2 text-sm ' +
  'bg-white dark:bg-nero-surface text-gray-900 dark:text-white placeholder:text-gray-400 ' +
  'outline-none focus:border-gray-400 dark:focus:border-nero-green transition-colors';

const labelCls = 'text-[11px] uppercase tracking-[.08em] text-gray-400 block mb-1';

export default function Auth() {
  const { signIn, signUp, signOut, resetPassword, updatePassword, passwordRecovery } = useApp();

  const [mode, setMode]         = useState(passwordRecovery ? 'reset' : 'login');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [error, setError]       = useState('');
  const [notice, setNotice]     = useState('');
  const [busy, setBusy]         = useState(false);

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
      } else if (mode === 'signup') {
        const data = await signUp(email, password);
        if (!data.session) {
          setMode('login');
          setPassword('');
          setError('');
          setNotice('Check your email and click the confirmation link to continue.');
        }
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
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

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
    <div className="min-h-screen bg-white dark:bg-nero-bg flex items-center justify-center px-4 transition-colors">
      <div className="w-full max-w-sm">

        {/* Nero logo mark + wordmark */}
        <div className="mb-8">
          <div className="flex items-center gap-2.5 mb-3">
            <div
              className="flex items-center justify-center text-white font-semibold"
              style={{
                width: 36,
                height: 36,
                background: '#27AE60',
                borderRadius: '10px 3px 10px 3px',
                fontSize: 18,
                fontFamily: 'Geist, system-ui, sans-serif',
              }}
            >
              N
            </div>
            <span className="text-[26px] font-semibold text-gray-900 dark:text-white tracking-tight"
                  style={{ fontFamily: 'Geist, system-ui, sans-serif' }}>
              Nero
            </span>
          </div>
          <p className="text-sm text-gray-400">{titles[mode]}</p>
        </div>

        {notice && (
          <div className="text-sm rounded-lg px-4 py-3 mb-4 leading-relaxed"
               style={{ background: '#D1FAE5', color: '#065F46' }}>
            {notice}
          </div>
        )}

        {error && (
          <div className="text-sm rounded-lg px-4 py-3 mb-4"
               style={{ background: '#FEE2E2', color: '#991B1B' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">

          {mode !== 'reset' && (
            <div>
              <label className={labelCls}>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className={inputCls} autoComplete="email" required />
            </div>
          )}

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

          {mode === 'reset' && (
            <div>
              <label className={labelCls}>Confirm new password</label>
              <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
                className={inputCls} autoComplete="new-password" minLength={6} required />
            </div>
          )}

          {mode === 'login' && (
            <div className="flex justify-end -mt-1">
              <button type="button" onClick={() => goTo('forgot')}
                className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                Forgot password?
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="text-white text-sm font-medium py-2.5 rounded-[20px] mt-1 transition-colors disabled:opacity-50"
            style={{ background: '#27AE60' }}
          >
            {submitLabel[mode]}
          </button>
        </form>

        <div className="mt-5 text-center">
          {mode === 'login' && (
            <p className="text-xs text-gray-400">
              Don't have an account?{' '}
              <button type="button" onClick={() => goTo('signup')}
                className="font-medium hover:underline underline-offset-2"
                style={{ color: '#27AE60' }}>
                Sign up
              </button>
            </p>
          )}

          {mode === 'signup' && (
            <p className="text-xs text-gray-400">
              Already have an account?{' '}
              <button type="button" onClick={() => goTo('login')}
                className="font-medium hover:underline underline-offset-2"
                style={{ color: '#27AE60' }}>
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
