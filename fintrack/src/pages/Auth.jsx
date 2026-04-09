import { useState } from 'react';
import { useApp } from '../AppContext';

const inputCls =
  'w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm ' +
  'bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 ' +
  'outline-none focus:border-gray-400 dark:focus:border-gray-400 transition-colors';

const labelCls = 'text-[11px] uppercase tracking-[.08em] text-gray-400 block mb-1';

export default function Auth() {
  const { signIn, signUp } = useApp();
  const [mode, setMode]         = useState('login');   // 'login' | 'signup'
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [notice, setNotice]     = useState('');
  const [busy, setBusy]         = useState(false);

  function switchMode(next) {
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
        // onAuthStateChange in AppContext drives navigation — nothing else needed
      } else {
        const data = await signUp(email, password);
        if (!data.session) {
          // Supabase email confirmation is enabled — user must verify first
          setNotice('Check your email for a confirmation link, then sign in.');
          switchMode('login');
        }
        // If session exists, onAuthStateChange will log the user in automatically
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center px-4 transition-colors">
      <div className="w-full max-w-sm">

        {/* Logo / title */}
        <div className="mb-8">
          <h1 className="text-2xl font-medium text-gray-900 dark:text-white mb-1">FinTrack</h1>
          <p className="text-sm text-gray-400">
            {mode === 'login' ? 'Sign in to your account' : 'Create your account'}
          </p>
        </div>

        {/* Notice banner */}
        {notice && (
          <div
            className="text-sm rounded-lg px-4 py-3 mb-4"
            style={{ background: '#C8EBB4', color: '#27500A' }}
          >
            {notice}
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div
            className="text-sm rounded-lg px-4 py-3 mb-4"
            style={{ background: '#F7C1C1', color: '#791F1F' }}
          >
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className={labelCls}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputCls}
              autoComplete="email"
              required
            />
          </div>

          <div>
            <label className={labelCls}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputCls}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              minLength={6}
              required
            />
            {mode === 'signup' && (
              <p className="text-[11px] text-gray-400 mt-1">Minimum 6 characters</p>
            )}
          </div>

          <button
            type="submit"
            disabled={busy}
            className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium py-2.5 rounded-lg mt-1 transition-colors disabled:opacity-50"
          >
            {busy ? '…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        {/* Mode toggle */}
        <p className="text-xs text-gray-400 text-center mt-5">
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            type="button"
            onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
            className="text-gray-900 dark:text-white font-medium underline-offset-2 hover:underline"
          >
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>

      </div>
    </div>
  );
}
