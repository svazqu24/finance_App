import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../AppContext';

function buildArray(count) {
  return Array.from({ length: count }, () => '');
}

export default function Verify2FA() {
  const navigate = useNavigate();
  const { user, preferences, twoFactorVerified, setTwoFactorVerified } = useApp();
  const [codes, setCodes] = useState(buildArray(6));
  const [activeIndex, setActiveIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(30);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const inputsRef = useRef([]);

  useEffect(() => {
    if (!user || !preferences.twoFactorEnabled) {
      navigate('/login', { replace: true });
      return;
    }
    if (twoFactorVerified) {
      navigate('/overview', { replace: true });
      return;
    }
  }, [navigate, user, preferences.twoFactorEnabled, twoFactorVerified]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const codeValue = useMemo(() => codes.join(''), [codes]);
  const progress = useMemo(() => `${(secondsLeft / 30) * 100}%`, [secondsLeft]);

  const handleChange = (index, value) => {
    if (!/^[0-9]?$/.test(value)) return;
    const next = [...codes];
    next[index] = value;
    setCodes(next);
    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus();
      setActiveIndex(index + 1);
    }
  };

  const handleKeyDown = (index, event) => {
    if (event.key === 'Backspace' && !codes[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
      setActiveIndex(index - 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (codeValue.length !== 6) {
      setError('Enter the 6-digit code from your authenticator app.');
      return;
    }
    setBusy(true);
    setError('');
    // Placeholder verification logic for UI flow.
    await new Promise((resolve) => setTimeout(resolve, 500));
    setTwoFactorVerified(true);
    navigate('/overview', { replace: true });
    setBusy(false);
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-xl rounded-[24px] border border-[#1f1f1f] bg-[#1f1f1f] p-8 shadow-[0_40px_80px_rgba(0,0,0,0.35)]">
        <div className="flex flex-col items-center gap-4 mb-8 text-center">
          <div className="w-16 h-16 flex items-center justify-center bg-[#27AE60]" style={{ borderRadius: '10px 3px 10px 3px' }}>
            <span className="text-2xl font-semibold">N</span>
          </div>
          <h1 className="text-3xl font-semibold">Verify 2FA</h1>
          <p className="max-w-lg text-sm text-gray-400">
            Enter the one-time code from your authenticator app to continue.
          </p>
        </div>

        <div className="rounded-[20px] border border-[#222] bg-[#111] p-6 mb-6">
          <div className="mb-4 text-sm text-gray-400">Code expires in</div>
          <div className="h-2 rounded-full bg-[#222] overflow-hidden">
            <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: progress }} />
          </div>
          <div className="mt-3 text-sm text-gray-300">{secondsLeft}s remaining</div>
        </div>

        {error && (
          <div className="mb-4 rounded-2xl border border-[#4f1d1d] bg-[#3c1515] px-4 py-3 text-sm text-[#ffd7d7]">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-6 gap-2">
            {codes.map((value, index) => (
              <input
                key={index}
                ref={(el) => (inputsRef.current[index] = el)}
                type="text"
                maxLength={1}
                value={value}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="h-14 w-full rounded-[16px] border border-[#2a2a2a] bg-[#0d0d0d] text-center text-xl font-semibold text-white outline-none"
              />
            ))}
          </div>

          <button type="submit" disabled={busy} className="w-full rounded-[20px] bg-[#27AE60] py-3 text-sm font-semibold text-[#0d0d0d] transition hover:bg-emerald-500 disabled:opacity-60">
            Confirm code
          </button>
        </form>

        <div className="mt-6 flex items-center justify-between text-sm text-gray-400">
          <button type="button" onClick={() => navigate('/forgot-password')} className="text-emerald-400 hover:text-emerald-300">
            Use a backup code
          </button>
          <button type="button" onClick={() => navigate('/login')} className="text-gray-500 hover:text-white">
            Back to sign in
          </button>
        </div>
      </div>
    </div>
  );
}
