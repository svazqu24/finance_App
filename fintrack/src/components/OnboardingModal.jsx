import { useState, useEffect } from 'react';
import { useApp } from '../AppContext';

const SURFACE = '#111827';
const BORDER  = '#1f2937';
const BG      = '#0a0e1a';

function NeroMark({ size = 64 }) {
  return (
    <div
      className="flex items-center justify-center text-white font-bold mx-auto"
      style={{
        width: size, height: size,
        background: '#27AE60',
        borderRadius: `${Math.round(size * 0.36)}px ${Math.round(size * 0.054)}px ${Math.round(size * 0.36)}px ${Math.round(size * 0.054)}px`,
        fontSize: size * 0.46,
        letterSpacing: '-0.02em',
        fontFamily: 'Geist, system-ui, sans-serif',
        boxShadow: '0 0 32px rgba(39,174,96,0.35)',
      }}
    >
      N
    </div>
  );
}

function SpendingIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
         strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6"  y1="20" x2="6"  y2="14" />
    </svg>
  );
}

function BudgetIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
         strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4l3 3" />
    </svg>
  );
}

function GoalIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
         strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

function Slide1() {
  return (
    <div className="flex flex-col items-center text-center px-2 gap-5">
      <NeroMark size={72} />
      <div>
        <h2 style={{ color: '#f9fafb', fontSize: 18, fontWeight: 500, marginBottom: 8 }}>
          Welcome to Nero
        </h2>
        <p style={{ color: '#9ca3af', fontSize: 13, lineHeight: 1.6 }}>
          Track every dollar, build real wealth.<br />
          From <em>dinero</em> — your money, your way.
        </p>
      </div>
    </div>
  );
}

function Slide2() {
  const features = [
    {
      icon: <SpendingIcon />,
      color: '#f97316',
      bg:    'rgba(249,115,22,0.15)',
      title: 'Track Spending',
      desc:  'See exactly where every dollar goes with automatic categorization.',
    },
    {
      icon: <BudgetIcon />,
      color: '#facc15',
      bg:    'rgba(250,204,21,0.15)',
      title: 'Set Budgets',
      desc:  'Stay on track with smart monthly limits and live progress bars.',
    },
    {
      icon: <GoalIcon />,
      color: '#27AE60',
      bg:    'rgba(39,174,96,0.15)',
      title: 'Reach Goals',
      desc:  'Save toward what matters — vacations, funds, big purchases.',
    },
  ];

  return (
    <div className="flex flex-col gap-3 w-full">
      <h2
        className="text-center mb-1"
        style={{ color: '#f9fafb', fontSize: 18, fontWeight: 500 }}
      >
        Everything you need
      </h2>
      {features.map((f) => (
        <div
          key={f.title}
          className="flex items-start gap-3.5 rounded-xl p-3.5"
          style={{ background: BG, border: `0.5px solid ${BORDER}` }}
        >
          <div
            className="flex items-center justify-center flex-shrink-0"
            style={{
              width: 40, height: 40,
              background: f.bg, color: f.color,
              borderRadius: '10px 3px 10px 3px',
            }}
          >
            {f.icon}
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#f9fafb', marginBottom: 2 }}>{f.title}</p>
            <p style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.5 }}>{f.desc}</p>
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
        style={{ background: 'rgba(39,174,96,0.15)' }}
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
             stroke="#27AE60" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <h2 style={{ color: '#f9fafb', fontSize: 18, fontWeight: 500, marginBottom: 8 }}>
        You're all set!
      </h2>
      <p style={{ color: '#9ca3af', fontSize: 13, lineHeight: 1.6, marginBottom: 24 }}>
        Start by adding your first transaction or importing a bank CSV.
      </p>
      <div className="flex flex-col gap-2.5 w-full">
        <button
          onClick={onAddTransaction}
          className="w-full text-white text-sm font-semibold py-3 rounded-xl transition-opacity hover:opacity-90"
          style={{ background: '#27AE60' }}
        >
          + Add first transaction
        </button>
        <button
          onClick={onImportCSV}
          className="w-full text-sm font-medium py-3 rounded-xl transition-colors"
          style={{ background: BORDER, color: '#9ca3af', border: `0.5px solid ${BORDER}` }}
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
    const lock = () => {
      const n = (window.__neroModalOpenCount ?? 0) + 1;
      window.__neroModalOpenCount = n;
      if (n === 1) document.body.style.overflow = 'hidden';
    };
    const unlock = () => {
      const n = Math.max(0, (window.__neroModalOpenCount ?? 1) - 1);
      window.__neroModalOpenCount = n;
      if (n === 0) document.body.style.overflow = '';
    };
    const onKey = (e) => { if (e.key === 'Escape') dismiss(); };

    lock();
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); unlock(); };
  }, []);

  function dismiss() { updatePreference('onboardingComplete', true); }
  function next() { if (slide < TOTAL - 1) setSlide((s) => s + 1); else dismiss(); }

  function handleAddTransaction() { dismiss(); openAddModal(); }
  function handleImportCSV()      { dismiss(); openCsvModal(); }

  const isLast   = slide === TOTAL - 1;
  const progress = ((slide + 1) / TOTAL) * 100;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl flex flex-col max-h-[92vh] overflow-hidden"
        style={{ background: SURFACE, border: `0.5px solid ${BORDER}` }}
      >
        {/* Progress bar */}
        <div className="h-0.5 w-full" style={{ background: BORDER }}>
          <div
            className="h-full transition-all duration-500"
            style={{ width: `${progress}%`, background: '#27AE60' }}
          />
        </div>

        <div className="p-6 flex flex-col flex-1 overflow-y-auto">
          {/* Skip */}
          <div className="flex justify-end mb-5">
            <button
              onClick={dismiss}
              className="text-xs px-3 py-1.5 rounded-lg transition-colors"
              style={{ background: BORDER, color: '#6b7280' }}
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

          {/* Dots + Next */}
          {!isLast && (
            <div className="flex items-center justify-between mt-6">
              <div className="flex gap-1.5 items-center">
                {Array.from({ length: TOTAL }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-full transition-all duration-300"
                    style={{
                      width: i === slide ? 18 : 6,
                      height: 6,
                      background: i === slide ? '#27AE60' : BORDER,
                    }}
                  />
                ))}
              </div>
              <button
                onClick={next}
                className="text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-opacity hover:opacity-90"
                style={{ background: '#27AE60' }}
              >
                Next →
              </button>
            </div>
          )}

          {isLast && (
            <div className="flex justify-center gap-1.5 mt-5">
              {Array.from({ length: TOTAL }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-full transition-all duration-300"
                  style={{
                    width: i === slide ? 18 : 6,
                    height: 6,
                    background: i === slide ? '#27AE60' : BORDER,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
