import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../AppContext';

const inputStyle = { background: '#0d0d0d', border: '1px solid #2a2a2a', color: '#ffffff' };

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { user, passwordRecovery, resetPassword, updatePassword } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user && !passwordRecovery) {
      navigate('/overview', { replace: true });
    }
  }, [navigate, user, passwordRecovery]);

  async function handleSendLink(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    setBusy(true);
    try {
      await resetPassword(email);
      setSuccess('Check your inbox — link expires in 24 hours');
      setEmail('');
    } catch (err) {
      setError(err?.message || 'Unable to send reset link');
    } finally {
      setBusy(false);
    }
  }

  async function handleUpdatePassword(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setBusy(true);
    try {
      await updatePassword(password);
      setSuccess('Password updated — you can now sign in.');
      navigate('/login', { replace: true });
    } catch (err) {
      setError(err?.message || 'Unable to update password');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-[24px] border border-[#1f1f1f] bg-[#1f1f1f] p-8 shadow-[0_40px_80px_rgba(0,0,0,0.35)]">
        <div className="flex flex-col items-center gap-3 mb-8 text-center">
          <div className="w-16 h-16 flex items-center justify-center bg-[#27AE60]" style={{ borderRadius: '10px 3px 10px 3px' }}>
            <span className="text-2xl font-semibold">N</span>
          </div>
          <h1 className="text-2xl font-semibold">Forgot password</h1>
          <p className="text-sm text-gray-400">Enter your email to receive a reset link.</p>
        </div>

        {error && (
          <div className="mb-4 rounded-2xl border border-[#4f1d1d] bg-[#3c1515] px-4 py-3 text-sm text-[#ffd7d7]">{error}</div>
        )}
        {success && (
          <div className="mb-4 rounded-2xl border border-[#204d22] bg-[#0f2811] px-4 py-3 text-sm text-[#a8f2b6]">{success}</div>
        )}

        {passwordRecovery ? (
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <label className="text-[11px] uppercase tracking-[.16em] text-gray-500 mb-2 block">New password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-[20px] px-4 py-3 text-white outline-none"
                style={inputStyle}
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-[.16em] text-gray-500 mb-2 block">Confirm password</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full rounded-[20px] px-4 py-3 text-white outline-none"
                style={inputStyle}
                placeholder="Confirm password"
              />
            </div>
            <button type="submit" disabled={busy} className="w-full rounded-[20px] bg-[#27AE60] py-3 text-sm font-semibold text-[#0d0d0d] transition hover:bg-emerald-500 disabled:opacity-60">
              Update password
            </button>
            <button type="button" onClick={() => navigate('/login')} className="w-full rounded-[20px] border border-[#2a2a2a] py-3 text-sm font-semibold text-white transition hover:border-[#3a3a3a]">
              Back to sign in
            </button>
          </form>
        ) : (
          <form onSubmit={handleSendLink} className="space-y-4">
            <div>
              <label className="text-[11px] uppercase tracking-[.16em] text-gray-500 mb-2 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-[20px] px-4 py-3 text-white outline-none"
                style={inputStyle}
                placeholder="you@example.com"
              />
            </div>
            <button type="submit" disabled={busy} className="w-full rounded-[20px] bg-[#27AE60] py-3 text-sm font-semibold text-[#0d0d0d] transition hover:bg-emerald-500 disabled:opacity-60">
              Send reset link
            </button>
            <button type="button" onClick={() => navigate('/login')} className="w-full rounded-[20px] border border-[#2a2a2a] py-3 text-sm font-semibold text-white transition hover:border-[#3a3a3a]">
              Back to sign in
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
