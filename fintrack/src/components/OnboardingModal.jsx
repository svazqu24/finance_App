import { useState, useEffect } from 'react';
import { useApp } from '../AppContext';

function NeroMark({ size = 52 }) {
  return (
    <div
      className="flex items-center justify-center text-white font-semibold mx-auto"
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

function SpendingIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6"  y1="20" x2="6"  y2="14" />
    </svg>
  );
}

function BudgetIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4l3 3" />
    </svg>
  );
}

function GoalIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

function Slide1() {
  return (
    <div className="flex flex-col items-center text-center px-2">
      <NeroMark size={64} />
      <h2 className="text-[22px] font-semibold text-white mt-6 mb-2 tracking-tight">
        Welcome to Nero
      </h2>
      <p className="text-sm leading-relaxed" style={{ color: '#9ca3af' }}>
        Track every dollar, build real wealth.<br />
        From <em>dinero</em> — your money, your way.
      </p>
    </div>
  );
}

function Slide2() {
  const features = [
    {
      icon: <SpendingIcon />,
      color: '#f97316',
      bg: '#2a1a10',
      title: 'Track Spending',
      desc: 'See exactly where every dollar goes with automatic categorization.',
    },
    {
      icon: <BudgetIcon />,
      color: '#facc15',
      bg: '#2a2a1a',
      title: 'Set Budgets',
      desc: 'Stay on track with smart monthly limits and live progress bars.',
    },
    {
      icon: <GoalIcon />,
      color: '#27AE60',
      bg: '#1a2a1a',
      title: 'Reach Goals',
      desc: 'Save toward what matters — vacations, funds, big purchases.',
    },
  ];

  return (
    <div className="flex flex-col gap-3 w-full">
      <h2 className="text-[18px] font-semibold text-white mb-1 text-center">Everything you need</h2>
      {features.map((f) => (
        <div
          key={f.title}
          className="flex items-start gap-3.5 rounded-xl p-3.5"
          style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}
        >
          <div
            className="flex items-center justify-center flex-shrink-0 rounded-lg"
            style={{ width: 40, height: 40, background: f.bg, color: f.color, borderRadius: '10px 3px 10px 3px' }}
          >
            {f.icon}
          </div>
          <div>
            <p className="text-[13px] font-semibold text-white leading-tight mb-0.5">{f.title}</p>
            <p className="text-xs leading-relaxed" style={{ color: '#9ca3af' }}>{f.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function Slide3({ onImportCSV, onAddTransaction }) {
  return (
    <div className="flex flex-col items-center text-center px-2">
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center mb-5"
        style={{ background: '#1a2a1a' }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#27AE60" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <h2 className="text-[22px] font-semibold text-white mb-2 tracking-tight">You're all set!</h2>
      <p className="text-sm leading-relaxed mb-6" style={{ color: '#9ca3af' }}>
        Start by adding your first transaction or importing a bank CSV.
      </p>
      <div className="flex flex-col gap-2.5 w-full">
        <button
          onClick={onAddTransaction}
          className="w-full text-white text-sm font-semibold py-3 rounded-xl transition-opacity"
          style={{ background: '#27AE60' }}
        >
          + Add first transaction
        </button>
        <button
          onClick={onImportCSV}
          className="w-full text-sm font-medium py-3 rounded-xl transition-colors"
          style={{ background: '#1a1a1a', color: '#d1d5db', border: '1px solid #2a2a2a' }}
        >
          Import from CSV
        </button>
      </div>
    </div>
  );
}

export default function OnboardingModal() {
  const { updatePreference, openAddModal, openCsvModal } = useApp();
  const [slide, setSlide] = useState(0);
  const TOTAL = 3;

  useEffect(() => {
    const lockBodyScroll = () => {
      const count = (window.__neroModalOpenCount ?? 0) + 1;
      window.__neroModalOpenCount = count;
      if (count === 1) document.body.style.overflow = 'hidden';
    };
    const unlockBodyScroll = () => {
      const count = Math.max(0, (window.__neroModalOpenCount ?? 1) - 1);
      window.__neroModalOpenCount = count;
      if (count === 0) document.body.style.overflow = '';
    };

    const onKeyDown = (event) => {
      if (event.key === 'Escape') dismiss();
    };

    lockBodyScroll();
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      unlockBodyScroll();
    };
  }, []);

  function dismiss() {
    updatePreference('onboardingComplete', true);
  }

  function next() {
    if (slide < TOTAL - 1) setSlide((s) => s + 1);
    else dismiss();
  }

  function handleAddTransaction() {
    dismiss();
    openAddModal();
  }

  function handleImportCSV() {
    dismiss();
    openCsvModal();
  }

  const isLast = slide === TOTAL - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
         style={{ background: 'rgba(0,0,0,0.75)' }}>
      <div
        className="w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-6 flex flex-col max-h-[90vh] overflow-y-auto"
        style={{ background: '#141414', border: '1px solid #2a2a2a' }}
      >
        {/* Skip button */}
        <div className="flex justify-end mb-4">
          <button
            onClick={dismiss}
            className="text-xs transition-colors"
            style={{ color: '#6b7280' }}
          >
            Skip
          </button>
        </div>

        {/* Slide content */}
        <div className="min-h-[220px] flex items-center justify-center">
          {slide === 0 && <Slide1 />}
          {slide === 1 && <Slide2 />}
          {slide === 2 && (
            <Slide3
              onAddTransaction={handleAddTransaction}
              onImportCSV={handleImportCSV}
            />
          )}
        </div>

        {/* Dots + next (not shown on last slide — slide 3 has its own CTAs) */}
        {!isLast && (
          <div className="flex items-center justify-between mt-6">
            <div className="flex gap-1.5">
              {Array.from({ length: TOTAL }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-full transition-all"
                  style={{
                    width: i === slide ? 16 : 6,
                    height: 6,
                    background: i === slide ? '#27AE60' : '#2a2a2a',
                  }}
                />
              ))}
            </div>
            <button
              onClick={next}
              className="text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-opacity"
              style={{ background: '#27AE60' }}
            >
              Next →
            </button>
          </div>
        )}

        {/* On last slide, show dots only */}
        {isLast && (
          <div className="flex justify-center gap-1.5 mt-5">
            {Array.from({ length: TOTAL }).map((_, i) => (
              <div
                key={i}
                className="rounded-full"
                style={{
                  width: i === slide ? 16 : 6,
                  height: 6,
                  background: i === slide ? '#27AE60' : '#2a2a2a',
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
