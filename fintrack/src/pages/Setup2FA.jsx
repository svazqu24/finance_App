import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../AppContext';

export default function Setup2FA() {
  const navigate = useNavigate();
  const { user, preferences, updatePreference } = useApp();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
    }
    if (preferences.twoFactorEnabled) {
      navigate('/overview', { replace: true });
    }
  }, [navigate, user, preferences.twoFactorEnabled]);

  async function handleContinue() {
    setBusy(true);
    await updatePreference('twoFactorEnabled', true);
    navigate('/overview', { replace: true });
    setBusy(false);
  }

  async function handleSkip() {
    setBusy(true);
    await updatePreference('twoFactorSkipped', true);
    navigate('/overview', { replace: true });
    setBusy(false);
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-3xl rounded-[24px] border border-[#1f1f1f] bg-[#1f1f1f] p-8 shadow-[0_40px_80px_rgba(0,0,0,0.35)]">
        <div className="flex flex-col items-center gap-4 mb-8 text-center">
          <div className="w-16 h-16 flex items-center justify-center bg-[#27AE60]" style={{ borderRadius: '10px 3px 10px 3px' }}>
            <span className="text-2xl font-semibold">N</span>
          </div>
          <h1 className="text-3xl font-semibold">Set up 2FA</h1>
          <p className="max-w-lg text-sm text-gray-400">
            Add an extra layer of security to your Nero account. You can skip this for now and come back later.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <div className="rounded-[20px] border border-[#222] bg-[#111] p-6">
            <p className="text-sm uppercase tracking-[.2em] text-gray-500 mb-4">Authenticator</p>
            <div className="rounded-3xl bg-[#0d0d0d] border border-[#222] p-6 flex items-center justify-center text-center text-sm text-gray-400 h-48">
              QR code placeholder
            </div>
            <div className="mt-4 text-sm text-gray-400">
              Scan the QR code with your authenticator app, or use the manual entry code.
            </div>
          </div>
          <div className="rounded-[20px] border border-[#222] bg-[#111] p-6">
            <div className="text-sm uppercase tracking-[.2em] text-gray-500 mb-4">Manual code</div>
            <div className="rounded-3xl bg-[#0d0d0d] border border-[#222] p-4 text-sm text-gray-300">
              NERO-2FA-XXXX
            </div>
            <div className="mt-6 space-y-4">
              <button
                type="button"
                onClick={handleContinue}
                disabled={busy}
                className="w-full rounded-[20px] bg-[#27AE60] py-3 text-sm font-semibold text-[#0d0d0d] transition hover:bg-emerald-500 disabled:opacity-60"
              >
                I&apos;ve scanned it — continue
              </button>
              <button
                type="button"
                onClick={handleSkip}
                disabled={busy}
                className="w-full rounded-[20px] border border-[#2a2a2a] py-3 text-sm font-semibold text-white transition hover:border-[#3a3a3a] disabled:opacity-60"
              >
                Skip for now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
