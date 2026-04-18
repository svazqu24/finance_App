import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../AppContext';

const inputStyle = { background: '#0d0d0d', border: '1px solid #2a2a2a', color: '#ffffff' };

const featureItems = [
  'Chase CSV import',
  'Credit card due dates',
  'Bank-level security',
];

const strengthLabels = [
  { label: 'Weak', color: '#ef4444' },
  { label: 'Fair', color: '#f59e0b' },
  { label: 'Good', color: '#22c55e' },
  { label: 'Strong', color: '#10b981' },
];

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getPasswordStrength(password) {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return Math.min(score, 4);
}

export default function Login() {
  const navigate = useNavigate();
  const { user, signIn, signUp, signInWithGoogle, resetPassword, passwordRecovery } = useApp();
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/overview', { replace: true });
    }
  }, [navigate, user]);

  const emailValid = validateEmail(email);
  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);
  const strength = strengthLabels[Math.max(0, passwordStrength - 1)] ?? strengthLabels[0];

  useEffect(() => {
    if (error) setError('');
    if (fieldError) setFieldError('');
    if (success) setSuccess('');
  }, [email, password, confirm, name]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!emailValid) {
      setFieldError('Please enter a valid email address');
      return;
    }
    if (!password) {
      setFieldError('Password is required');
      return;
    }

    setBusy(true);
    try {
      if (mode === 'login') {
        await signIn(email, password);
        navigate('/overview', { replace: true });
      } else {
        if (password.length < 6) {
          setFieldError('Password must be at least 6 characters');
          return;
        }
        if (password !== confirm) {
          setFieldError('Passwords do not match');
          return;
        }
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
      if (/invalid email/i.test(message) || /email/i.test(message)) {
        setFieldError('Please enter a valid email address');
      } else if (/password/i.test(message)) {
        setError(message);
      } else if (/too many requests|rate limit/i.test(message)) {
        setError('Too many attempts — try again in 10 minutes');
      } else {
        setError(/invalid login credentials/i.test(message)
          ? 'Wrong email or password'
          : message);
      }
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

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-6xl rounded-[24px] overflow-hidden shadow-[0_40px_120px_rgba(0,0,0,0.4)] border border-[#1e1e1e] bg-[#0d0d0d] grid lg:grid-cols-[0.95fr_1.05fr]">
        <div className="hidden lg:flex flex-col justify-center gap-8 bg-[#0d0d0d] p-10 border-r border-[#1f1f1f]">
          <div className="flex flex-col gap-4">
            <div className="w-16 h-16 flex items-center justify-center bg-[#27AE60]" style={{ borderRadius: '10px 3px 10px 3px' }}>
              <span className="text-2xl font-semibold">N</span>
            </div>
            <div>
              <h2 className="text-3xl font-semibold">nero</h2>
              <p className="mt-3 text-gray-400">Secure money tracking with a darker, simpler experience.</p>
            </div>
          </div>
          <div className="space-y-4">
            {featureItems.map((item) => (
              <div key={item} className="rounded-3xl border border-[#202020] bg-[#111111] p-5">
                <p className="text-sm font-semibold text-white">{item}</p>
                <p className="mt-2 text-sm text-gray-400">Fast, clean, and always private.</p>
              </div>
            ))}
          </div>
        </div>

        <div className="p-8 sm:p-10">
          <div className="flex items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 flex items-center justify-center bg-[#27AE60]" style={{ borderRadius: '10px 3px 10px 3px' }}>
                <span className="text-2xl font-semibold">N</span>
              </div>
              <div>
                <p className="text-xl font-semibold">nero</p>
                <p className="text-sm text-gray-500">Login or create your account</p>
              </div>
            </div>
          </div>

          <div className="mb-6 rounded-[20px] bg-[#111111] border border-[#222222] p-1.5 flex items-center text-sm text-gray-400">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`flex-1 rounded-[18px] py-3 transition ${mode === 'login' ? 'bg-[#0d0d0d] text-white' : 'hover:text-white'}`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={`flex-1 rounded-[18px] py-3 transition ${mode === 'signup' ? 'bg-[#0d0d0d] text-white' : 'hover:text-white'}`}
            >
              Create account
            </button>
          </div>

          {error && (
            <div className="mb-4 rounded-2xl border border-[#4f1d1d] bg-[#3c1515] px-4 py-3 text-sm text-[#ffd7d7]">
              {error}
              {error.includes('Wrong email or password') && (
                <button type="button" onClick={() => navigate('/forgot-password')} className="ml-2 font-semibold text-emerald-300 underline">
                  Reset it
                </button>
              )}
            </div>
          )}

          {success && (
            <div className="mb-4 rounded-2xl border border-[#204d22] bg-[#0f2811] px-4 py-3 text-sm text-[#a8f2b6]">
              {success}
            </div>
          )}

          <button
            type="button"
            onClick={handleGoogle}
            disabled={busy}
            className="w-full rounded-[20px] bg-[#1f1f1f] border border-[#2a2a2a] py-3 text-sm font-semibold text-white hover:border-[#3a3a3a] transition mb-4"
          >
            Continue with Google
          </button>

          <div className="flex items-center gap-3 text-xs text-gray-500 mb-5">
            <div className="h-px flex-1 bg-[#2a2a2a]" />
            <span>or</span>
            <div className="h-px flex-1 bg-[#2a2a2a]" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="text-[11px] uppercase tracking-[.16em] text-gray-500 mb-2 block">Name (optional)</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-[20px] px-4 py-3 text-white outline-none"
                  style={inputStyle}
                  placeholder="Jane Doe"
                />
              </div>
            )}
            <div>
              <label className="text-[11px] uppercase tracking-[.16em] text-gray-500 mb-2 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full rounded-[20px] px-4 py-3 text-white outline-none ${email && !emailValid ? 'border-red-500' : ''}`}
                style={inputStyle}
                placeholder="you@example.com"
              />
              {email && !emailValid && (
                <p className="mt-2 text-xs text-red-400">Please enter a valid email address</p>
              )}
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-[.16em] text-gray-500 mb-2 block">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full rounded-[20px] px-4 py-3 text-white outline-none ${fieldError.includes('Password') ? 'border-red-500' : ''}`}
                  style={inputStyle}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
            {mode === 'signup' && (
              <div>
                <label className="text-[11px] uppercase tracking-[.16em] text-gray-500 mb-2 block">Confirm password</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className={`w-full rounded-[20px] px-4 py-3 text-white outline-none ${fieldError.includes('match') ? 'border-red-500' : ''}`}
                  style={inputStyle}
                  placeholder="Confirm password"
                />
                <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ background: strength.color }} />
                  <span>{strength.label}</span>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-sm text-gray-400">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-600 bg-[#0d0d0d] text-emerald-500 focus:ring-emerald-500"
                />
                Remember me
              </label>
              <button type="button" onClick={() => navigate('/forgot-password')} className="text-emerald-400 hover:text-emerald-300">
                Forgot password?
              </button>
            </div>

            {fieldError && <p className="text-sm text-red-400">{fieldError}</p>}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-[20px] bg-[#27AE60] py-3 text-sm font-semibold text-[#0d0d0d] transition hover:bg-emerald-500 disabled:opacity-60"
            >
              {mode === 'login' ? 'Sign in to Nero' : 'Create my Nero account'}
            </button>
          </form>

          <div className="mt-6 border-t border-[#222] pt-4 text-xs text-gray-500">
            {mode === 'signup' ? (
              <p>
                By creating an account, you agree to our <button type="button" className="text-emerald-400 underline">Terms</button> and <button type="button" className="text-emerald-400 underline">Privacy</button>.
              </p>
            ) : (
              <p>
                New to Nero? <button type="button" onClick={() => setMode('signup')} className="text-emerald-400 underline">Create account</button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
