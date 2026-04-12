import { useState, useEffect } from 'react';
import { useApp } from '../AppContext';

const inputCls =
  'w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-500 ' +
  'outline-none transition-colors';

const labelCls = 'text-[11px] uppercase tracking-[.08em] text-gray-500 block mb-1.5';

function NeroMark({ size = 56 }) {
  return (
    <div
      className="flex items-center justify-center text-white font-semibold flex-shrink-0"
      style={{
        width: size, height: size,
        background: '#27AE60',
        borderRadius: `${Math.round(size * 0.36)}px ${Math.round(size * 0.054)}px ${Math.round(size * 0.36)}px ${Math.round(size * 0.054)}px`,
        fontSize: size * 0.46,
        letterSpacing: '-0.02em',
        fontFamily: 'Geist, system-ui, sans-serif',
      }}
    >
      N
    </div>
  );
}

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
          setNotice('Check your email and click the confirmation link to continue.');
        }
      } else if (mode === 'forgot') {
        await resetPassword(email);
        setNotice('Password reset link sent — check your inbox.');
        setEmail('');
      } else if (mode === 'reset') {
        if (password !== confirm) { setError('Passwords do not match.'); return; }
        await updatePassword(password);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const submitLabel = {
    login:  busy ? '…' : 'Sign in',
    signup: busy ? '…' : 'Create account',
    forgot: busy ? '…' : 'Send reset link',
    reset:  busy ? '…' : 'Update password',
  };

  const border = '1px solid #2a2a2a';
  const inputStyle = { background: '#1a1a1a', border };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 font-sans"
      style={{ background: '#141414' }}
    >
      <div className="w-full max-w-sm">

        {/* Logo + headline */}
        <div className="flex flex-col items-center mb-8 text-center">
          <NeroMark size={56} />
          <h1 className="text-[26px] font-semibold text-white mt-5 mb-1.5 tracking-tight"
              style={{ fontFamily: 'Geist, system-ui, sans-serif' }}>
            {mode === 'login'  ? 'Welcome to Nero'    :
             mode === 'signup' ? 'Create your account' :
             mode === 'forgot' ? 'Reset password'      :
                                 'Set new password'}
          </h1>
          {(mode === 'login' || mode === 'signup') && (
            <p className="text-sm" style={{ color: '#6b7280' }}>
              From <em>dinero</em> — your money, your way.
            </p>
          )}
        </div>

        {/* Card */}
        <div className="rounded-2xl p-6" style={{ background: '#1f1f1f', border }}>

          {notice && (
            <div className="text-sm rounded-xl px-4 py-3 mb-4 leading-relaxed"
                 style={{ background: '#1a2a1a', color: '#4ade80', border: '1px solid #2a3a2a' }}>
              {notice}
            </div>
          )}

          {error && (
            <div className="text-sm rounded-xl px-4 py-3 mb-4"
                 style={{ background: '#2a1a1a', color: '#f87171', border: '1px solid #3a2a2a' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {mode !== 'reset' && (
              <div>
                <label className={labelCls}>Email</label>
                <input
                  type="email" value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputCls} style={inputStyle}
                  autoComplete="email" placeholder="you@example.com" required
                />
              </div>
            )}

            {(mode === 'login' || mode === 'signup' || mode === 'reset') && (
              <div>
                <label className={labelCls}>
                  {mode === 'reset' ? 'New password' : 'Password'}
                </label>
                <input
                  type="password" value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputCls} style={inputStyle}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  placeholder="Min. 6 characters"
                  minLength={6} required
                />
              </div>
            )}

            {mode === 'reset' && (
              <div>
                <label className={labelCls}>Confirm new password</label>
                <input
                  type="password" value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className={inputCls} style={inputStyle}
                  autoComplete="new-password" placeholder="Repeat new password"
                  minLength={6} required
                />
              </div>
            )}

            {mode === 'login' && (
              <div className="flex justify-end -mt-1">
                <button type="button" onClick={() => goTo('forgot')}
                  className="text-xs transition-colors" style={{ color: '#6b7280' }}>
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full text-white text-sm font-semibold py-3 rounded-xl mt-1 transition-opacity disabled:opacity-50"
              style={{ background: '#27AE60' }}
            >
              {submitLabel[mode]}
            </button>
          </form>

          <div className="mt-5 text-center">
            {mode === 'login' && (
              <p className="text-xs" style={{ color: '#6b7280' }}>
                Don't have an account?{' '}
                <button type="button" onClick={() => goTo('signup')}
                  className="font-medium hover:underline underline-offset-2"
                  style={{ color: '#27AE60' }}>
                  Sign up free
                </button>
              </p>
            )}
            {mode === 'signup' && (
              <p className="text-xs" style={{ color: '#6b7280' }}>
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
                className="text-xs transition-colors" style={{ color: '#6b7280' }}>
                ← Back to sign in
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
