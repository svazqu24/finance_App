import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../AppContext';

const BG      = '#0a0e1a';
const SURFACE = '#111827';
const BORDER  = '#1f2937';

const featureItems = [
  { icon: '📥', label: 'Chase CSV import',        desc: 'Import your transactions in seconds.'   },
  { icon: '💳', label: 'Credit card due dates',   desc: 'Never miss a payment again.'            },
  { icon: '🔒', label: 'Bank-level security',     desc: 'Your data is encrypted and private.'   },
];

const strengthLabels = [
  { label: 'Weak',   color: '#ef4444' },
  { label: 'Fair',   color: '#f59e0b' },
  { label: 'Good',   color: '#22c55e' },
  { label: 'Strong', color: '#10b981' },
];

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getPasswordStrength(password) {
  let score = 0;
  if (password.length >= 8)       score += 1;
  if (/[A-Z]/.test(password))     score += 1;
  if (/[0-9]/.test(password))     score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return Math.min(score, 4);
}

export default function Login() {
  const navigate = useNavigate();
  const { user, signIn, signUp, signInWithGoogle, resetPassword, passwordRecovery } = useApp();

  const [mode,         setMode]         = useState('login');
  const [name,         setName]         = useState('');
  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [confirm,      setConfirm]      = useState('');
  const [rememberMe,   setRememberMe]   = useState(() => {
    try {
      return localStorage.getItem('rememberMe') === 'true';
    } catch {
      return false;
    }
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error,        setError]        = useState('');
  const [fieldError,   setFieldError]   = useState('');
  const [success,      setSuccess]      = useState('');
  const [busy,         setBusy]         = useState(false);

  useEffect(() => {
    if (user) navigate('/overview', { replace: true });
  }, [navigate, user]);

  const emailValid       = validateEmail(email);
  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);
  const strength         = strengthLabels[Math.max(0, passwordStrength - 1)] ?? strengthLabels[0];

  useEffect(() => {
    if (error)      setError('');
    if (fieldError) setFieldError('');
    if (success)    setSuccess('');
  }, [email, password, confirm, name]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!emailValid)  { setFieldError('Please enter a valid email address'); return; }
    if (!password)    { setFieldError('Password is required');               return; }

    setBusy(true);
    try {
      if (mode === 'login') {
        await signIn(email, password, { persistSession: rememberMe });
        navigate('/overview', { replace: true });
      } else {
        if (password.length < 6)    { setFieldError('Password must be at least 6 characters'); return; }
        if (password !== confirm)   { setFieldError('Passwords do not match');                 return; }
        const data = await signUp(email, password, name);
        if (data.session) {
          navigate('/setup-2fa');
        } else {
          setSuccess('Check your email for a confirmation link to continue.');
          setMode('login');
        }
      }
    } catch (err) {
      const message = err?.message || 'Something went wrong';
      if      (/invalid email|email/i.test(message))        setFieldError('Please enter a valid email address');
      else if (/password/i.test(message))                   setError(message);
      else if (/too many requests|rate limit/i.test(message)) setError('Too many attempts — try again in 10 minutes');
      else    setError(/invalid login credentials/i.test(message) ? 'Wrong email or password' : message);
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setBusy(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err?.message || 'Google sign-in failed');
    } finally {
      setBusy(false);
    }
  }

  const inputCls = 'w-full rounded-[20px] px-4 py-3 text-white outline-none border border-[#2a2a2a] focus:border-[#27AE60] transition-colors text-sm';
  const inputSty = { background: BG, color: '#ffffff' };

  return (
    <div className="min-h-screen text-white flex items-center justify-center px-4 py-10"
         style={{ background: BG }}>
      <div
        className="w-full max-w-5xl rounded-[24px] overflow-hidden shadow-[0_40px_120px_rgba(0,0,0,0.5)] grid lg:grid-cols-[0.95fr_1.05fr]"
        style={{ border: `0.5px solid ${BORDER}`, background: BG }}
      >
        {/* ── Left panel ── */}
        <div
          className="hidden lg:flex flex-col justify-center gap-8 p-10"
          style={{ background: BG, borderRight: `0.5px solid ${BORDER}` }}
        >
          <div className="flex flex-col gap-4">
            <div
              className="w-16 h-16 flex items-center justify-center"
              style={{ background: '#27AE60', borderRadius: '10px 3px 10px 3px' }}
            >
              <span className="text-2xl font-semibold">N</span>
            </div>
            <div>
              <h2 className="text-3xl font-semibold" style={{ color: '#f9fafb' }}>nero</h2>
              <p className="mt-2 text-sm" style={{ color: '#6b7280' }}>
                Secure money tracking with a darker, simpler experience.
              </p>
            </div>
          </div>
          <div className="space-y-3">
            {featureItems.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl p-4 flex items-start gap-3"
                style={{ background: SURFACE, border: `0.5px solid ${BORDER}` }}
              >
                <span className="text-xl mt-0.5 flex-shrink-0">{item.icon}</span>
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#f9fafb' }}>{item.label}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#6b7280' }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right panel (form) ── */}
        <div className="p-8 sm:p-10" style={{ background: SURFACE }}>
          {/* Logo row (mobile only) */}
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 flex items-center justify-center"
              style={{ background: '#27AE60', borderRadius: '10px 3px 10px 3px' }}
            >
              <span className="text-lg font-semibold">N</span>
            </div>
            <div>
              <p className="text-base font-semibold" style={{ color: '#f9fafb' }}>nero</p>
              <p className="text-xs" style={{ color: '#6b7280' }}>
                {mode === 'login' ? 'Sign in to your account' : 'Create your account'}
              </p>
            </div>
          </div>

          {/* Tab switcher */}
          <div
            className="mb-6 rounded-[20px] p-1.5 flex items-center text-sm"
            style={{ background: BG, border: `0.5px solid ${BORDER}` }}
          >
            {[
              { key: 'login',  label: 'Sign in'        },
              { key: 'signup', label: 'Create account' },
            ].map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setMode(key)}
                className="flex-1 rounded-[18px] py-2.5 text-sm font-medium transition-all"
                style={
                  mode === key
                    ? { background: 'rgba(39,174,96,0.12)', color: '#27AE60' }
                    : { color: '#6b7280' }
                }
              >
                {label}
              </button>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div
              className="mb-4 rounded-2xl px-4 py-3 text-sm"
              style={{ background: '#3c1515', border: '1px solid #4f1d1d', color: '#ffd7d7' }}
            >
              {error}
              {error.includes('Wrong email or password') && (
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  className="ml-2 font-semibold underline"
                  style={{ color: '#4ade80' }}
                >
                  Reset it
                </button>
              )}
            </div>
          )}

          {/* Success */}
          {success && (
            <div
              className="mb-4 rounded-2xl px-4 py-3 text-sm"
              style={{ background: '#0f2811', border: '1px solid #204d22', color: '#a8f2b6' }}
            >
              {success}
            </div>
          )}

          {/* Google */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={busy}
            className="w-full rounded-[20px] py-3 text-sm font-semibold text-white transition-colors mb-4 disabled:opacity-50"
            style={{ background: '#1f2937', border: `0.5px solid #2a2a2a` }}
          >
            <span className="flex items-center justify-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </span>
          </button>

          <div className="flex items-center gap-3 text-xs mb-5" style={{ color: '#4b5563' }}>
            <div className="h-px flex-1" style={{ background: BORDER }} />
            <span>or</span>
            <div className="h-px flex-1" style={{ background: BORDER }} />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="text-[11px] uppercase tracking-[.16em] mb-2 block" style={{ color: '#6b7280' }}>
                  Name (optional)
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputCls}
                  style={inputSty}
                  placeholder="Jane Doe"
                />
              </div>
            )}

            <div>
              <label className="text-[11px] uppercase tracking-[.16em] mb-2 block" style={{ color: '#6b7280' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`${inputCls} ${email && !emailValid ? 'border-red-500' : ''}`}
                style={inputSty}
                placeholder="you@example.com"
              />
              {email && !emailValid && (
                <p className="mt-1.5 text-xs text-red-400">Please enter a valid email address</p>
              )}
            </div>

            <div>
              <label className="text-[11px] uppercase tracking-[.16em] mb-2 block" style={{ color: '#6b7280' }}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputCls} ${fieldError.includes('Password') ? 'border-red-500' : ''}`}
                  style={inputSty}
                  placeholder={mode === 'login' ? 'Enter your password' : 'Create a password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs"
                  style={{ color: '#6b7280' }}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {mode === 'signup' && (
              <div>
                <label className="text-[11px] uppercase tracking-[.16em] mb-2 block" style={{ color: '#6b7280' }}>
                  Confirm password
                </label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className={`${inputCls} ${fieldError.includes('match') ? 'border-red-500' : ''}`}
                  style={inputSty}
                  placeholder="Confirm your password"
                />
                <div className="mt-2 flex items-center gap-2 text-xs" style={{ color: '#6b7280' }}>
                  <div className="h-2 w-2 rounded-full" style={{ background: strength.color }} />
                  <span>{strength.label}</span>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-sm" style={{ color: '#6b7280' }}>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setRememberMe(checked);
                    try { localStorage.setItem('rememberMe', String(checked)); } catch {}
                  }}
                  className="h-4 w-4 rounded focus:ring-0"
                  style={{ accentColor: '#27AE60' }}
                />
                Remember me
              </label>
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="text-left transition-colors"
                style={{ color: '#27AE60' }}
              >
                Forgot password?
              </button>
            </div>

            {fieldError && <p className="text-sm text-red-400">{fieldError}</p>}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-[20px] py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ background: '#27AE60' }}
            >
              {mode === 'login' ? 'Sign in to Nero' : 'Create my Nero account'}
            </button>
          </form>

          <div className="mt-6 pt-4 text-xs" style={{ borderTop: `0.5px solid ${BORDER}`, color: '#4b5563' }}>
            {mode === 'signup' ? (
              <p>
                By creating an account, you agree to our{' '}
                <button type="button" className="underline" style={{ color: '#27AE60' }}>Terms</button>
                {' '}and{' '}
                <button type="button" className="underline" style={{ color: '#27AE60' }}>Privacy</button>.
              </p>
            ) : (
              <p>
                New to Nero?{' '}
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className="underline"
                  style={{ color: '#27AE60' }}
                >
                  Create account
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
