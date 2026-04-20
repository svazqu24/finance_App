import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../AppContext';

const BG      = '#0a0e1a';
const SURFACE = '#111827';
const BORDER  = '#1f2937';

const CAT_STYLE = {
  Dining:        { emoji: '🍽', bg: 'rgba(248,113,113,0.12)',  color: '#f87171' },
  Income:        { emoji: '💵', bg: 'rgba(74,222,128,0.12)',   color: '#4ade80' },
  Subscriptions: { emoji: '🎵', bg: 'rgba(167,139,250,0.12)',  color: '#a78bfa' },
  Groceries:     { emoji: '🛒', bg: 'rgba(74,222,128,0.12)',   color: '#4ade80' },
  Transport:     { emoji: '🚗', bg: 'rgba(96,165,250,0.12)',   color: '#60a5fa' },
  Shopping:      { emoji: '🛍', bg: 'rgba(251,191,36,0.12)',   color: '#fbbf24' },
  Housing:       { emoji: '🏠', bg: 'rgba(96,165,250,0.12)',   color: '#60a5fa' },
};

function TxRow({ name, cat, amt, income }) {
  const sty = CAT_STYLE[cat] || { emoji: '📦', bg: 'rgba(156,163,175,0.12)', color: '#9ca3af' };
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 flex items-center justify-center rounded-xl text-base flex-shrink-0"
          style={{ background: sty.bg, color: sty.color }}
        >
          {sty.emoji}
        </div>
        <div>
          <p className="text-sm text-white leading-tight">{name}</p>
          <span
            className="text-[10px] px-2 py-0.5 rounded-full mt-0.5 inline-block"
            style={{ background: sty.bg, color: sty.color }}
          >
            {cat}
          </span>
        </div>
      </div>
      <span className={`text-sm font-semibold flex-shrink-0 ${income ? 'text-[#4ade80]' : 'text-[#f87171]'}`}>
        {income ? '+' : '-'}${Math.abs(amt).toFixed(2)}
      </span>
    </div>
  );
}

const cards = [
  {
    title: 'Transactions',
    description: 'See every merchant, account label, and category in one clean feed.',
    content: (
      <div className="space-y-3.5">
        <TxRow name="Panera Bread"    cat="Dining"        amt={14.18}  income={false} />
        <TxRow name="Payroll Deposit" cat="Income"        amt={530.50} income={true}  />
        <TxRow name="Burger King"     cat="Dining"        amt={12.25}  income={false} />
        <TxRow name="Spotify"         cat="Subscriptions" amt={10.99}  income={false} />
        <TxRow name="Jewel Osco"      cat="Groceries"     amt={42.50}  income={false} />
      </div>
    ),
  },
  {
    title: 'Budget tracker',
    description: 'Animated bar fills and smart cards for income, spent, and saved.',
    content: (
      <div className="space-y-3">
        <div className="rounded-xl p-4" style={{ background: SURFACE, border: `0.5px solid ${BORDER}` }}>
          <div className="flex justify-between mb-3 text-sm">
            <span className="text-white">Monthly budget</span>
            <span className="font-semibold" style={{ color: '#27AE60' }}>61% used</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: BORDER }}>
            <div className="h-full rounded-full" style={{ width: '61%', background: '#27AE60' }} />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[['Income', '$5,200'], ['Spent', '$3,160'], ['Saved', '$2,040']].map(([label, val]) => (
            <div key={label} className="rounded-xl p-3 text-center" style={{ background: SURFACE, border: `0.5px solid ${BORDER}` }}>
              <p className="text-[10px] uppercase tracking-[.12em] text-gray-500">{label}</p>
              <p className="text-sm font-semibold text-white mt-1.5">{val}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    title: 'Bills & cards',
    description: 'Track due dates, balances, and card utilization at a glance.',
    content: (
      <div className="space-y-3">
        <div className="rounded-xl p-4" style={{ background: SURFACE, border: `0.5px solid ${BORDER}` }}>
          <p className="text-[10px] uppercase tracking-[.12em] text-gray-500 mb-3">Credit cards</p>
          <div className="space-y-3">
            {[['Visa •••• 1243', '67%', 67], ['Mastercard •••• 8391', '42%', 42]].map(([name, util, pct]) => (
              <div key={name} className="rounded-lg p-3" style={{ background: BG, border: `0.5px solid ${BORDER}` }}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-white text-[13px]">{name}</span>
                  <span className="text-[11px] font-semibold" style={{ color: '#27AE60' }}>{util}</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: BORDER }}>
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: '#27AE60' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl p-4" style={{ background: SURFACE, border: `0.5px solid ${BORDER}` }}>
          <p className="text-[10px] uppercase tracking-[.12em] text-gray-500 mb-2">Upcoming bills</p>
          <div className="space-y-2 text-sm text-white">
            <div className="flex justify-between">
              <span>Internet</span>
              <span className="text-xs text-gray-500">Due Apr 22</span>
            </div>
            <div className="flex justify-between">
              <span>Rent</span>
              <span className="text-xs text-gray-500">Due May 1</span>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: 'Goals',
    description: 'Visual goal tracking with progress and contribution history.',
    content: (
      <div className="space-y-3">
        <div className="rounded-xl p-4" style={{ background: SURFACE, border: `0.5px solid ${BORDER}` }}>
          <div className="flex justify-between items-center mb-2 text-sm">
            <span className="text-white">Japan Trip ✈️</span>
            <span className="font-semibold" style={{ color: '#27AE60' }}>52%</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: BORDER }}>
            <div className="h-full rounded-full" style={{ width: '52%', background: '#27AE60' }} />
          </div>
        </div>
        <div className="rounded-xl p-4 space-y-2" style={{ background: SURFACE, border: `0.5px solid ${BORDER}` }}>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">Apr 12</span>
            <span className="text-sm font-semibold text-[#4ade80]">+$120.00</span>
          </div>
          <p className="text-xs text-gray-500">Train tickets from last week.</p>
          <div className="flex justify-between items-center pt-1.5" style={{ borderTop: `0.5px solid ${BORDER}` }}>
            <span className="text-xs text-gray-500">Apr 3</span>
            <span className="text-sm font-semibold text-[#4ade80]">+$80.00</span>
          </div>
          <p className="text-xs text-gray-500">Hotel deposit</p>
        </div>
      </div>
    ),
  },
];

const FEATURES = [
  { emoji: '📊', label: 'Track',  desc: 'Every transaction' },
  { emoji: '🎯', label: 'Budget', desc: 'Monthly limits'    },
  { emoji: '📈', label: 'Grow',   desc: 'Reach your goals'  },
];

function FeatureCard({ emoji, label, desc }) {
  return (
    <div
      className="flex flex-col items-center gap-1.5 rounded-2xl py-4 px-3 text-center"
      style={{ background: SURFACE, border: `0.5px solid ${BORDER}` }}
    >
      <span className="text-xl">{emoji}</span>
      <p className="text-[13px] font-semibold text-white">{label}</p>
      <p className="text-[11px]" style={{ color: '#4b5563' }}>{desc}</p>
    </div>
  );
}

function Dot({ active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Preview slide"
      style={{
        height: 6,
        width: active ? 22 : 6,
        borderRadius: 999,
        background: active ? '#27AE60' : BORDER,
        transition: 'width 0.3s ease, background 0.3s ease',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        flexShrink: 0,
      }}
    />
  );
}

export default function Splash() {
  const navigate = useNavigate();
  const { user } = useApp();
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (user) { navigate('/overview', { replace: true }); return; }
    const timer = window.setInterval(() => setActive((prev) => (prev + 1) % cards.length), 3000);
    return () => window.clearInterval(timer);
  }, [navigate, user]);

  return (
    <div className="min-h-screen text-white px-4 py-10 sm:px-6 lg:px-8" style={{ background: BG }}>
      <div className="mx-auto max-w-6xl">

        {/* Hero */}
        <div className="flex flex-col items-center text-center gap-3 mb-8">
          <div
            className="w-14 h-14 flex items-center justify-center"
            style={{ background: '#27AE60', borderRadius: '10px 3px 10px 3px' }}
          >
            <span className="text-2xl font-semibold">N</span>
          </div>
          <p className="text-2xl font-semibold tracking-tight" style={{ color: '#f9fafb' }}>nero</p>
          <div>
            <h1
              className="text-4xl sm:text-5xl font-semibold tracking-tight"
              style={{ color: '#f9fafb' }}
            >
              Your money, finally clear
            </h1>
            <p className="mt-3 text-sm max-w-xl mx-auto" style={{ color: '#6b7280' }}>
              From <em>dinero</em> — the free Mint replacement. Import your bank CSV and get started in minutes.
            </p>
          </div>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-3 gap-3 mb-8 max-w-sm mx-auto sm:max-w-md">
          {FEATURES.map((f) => <FeatureCard key={f.label} {...f} />)}
        </div>

        {/* Main grid */}
        <div className="grid gap-5 lg:grid-cols-[1.35fr_0.95fr]">

          {/* Preview carousel */}
          <div
            className="relative overflow-hidden rounded-[24px] p-5 shadow-[0_20px_80px_rgba(0,0,0,0.5)]"
            style={{ background: SURFACE, border: `0.5px solid ${BORDER}` }}
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'linear-gradient(135deg, rgba(39,174,96,0.07) 0%, transparent 55%)' }}
            />
            <div className="relative z-10 space-y-4">
              {/* Slide container */}
              <div
                className="rounded-2xl"
                style={{ background: BG, border: `0.5px solid ${BORDER}`, minHeight: 340, position: 'relative' }}
              >
                {cards.map((card, idx) => (
                  <div
                    key={card.title}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      padding: 20,
                      opacity: idx === active ? 1 : 0,
                      transform: idx === active ? 'translateY(0)' : 'translateY(10px)',
                      transition: 'opacity 0.55s ease, transform 0.55s ease',
                      pointerEvents: idx === active ? 'auto' : 'none',
                    }}
                  >
                    <p className="text-sm mb-4" style={{ color: '#6b7280' }}>{card.description}</p>
                    {card.content}
                  </div>
                ))}
              </div>

              {/* Dots */}
              <div className="flex items-center justify-center gap-2">
                {cards.map((_, idx) => (
                  <Dot key={idx} active={idx === active} onClick={() => setActive(idx)} />
                ))}
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-4">

            {/* Stats */}
            <div
              className="rounded-[24px] p-6"
              style={{ background: SURFACE, border: `0.5px solid ${BORDER}` }}
            >
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { num: '1,100+', sub: 'Transactions' },
                  { num: '$0',     sub: 'Forever free' },
                  { num: '100%',   sub: 'Your data'    },
                ].map(({ num, sub }) => (
                  <div key={num}>
                    <p className="text-[28px] font-bold leading-tight" style={{ color: '#f9fafb' }}>{num}</p>
                    <p className="text-[11px] mt-1" style={{ color: '#6b7280' }}>{sub}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* CTAs */}
            <div
              className="rounded-[24px] p-5 space-y-3"
              style={{ background: SURFACE, border: `0.5px solid ${BORDER}` }}
            >
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="w-full rounded-[20px] py-3 text-sm font-semibold transition-opacity hover:opacity-90"
                style={{ background: '#27AE60', color: '#ffffff' }}
              >
                Get started free
              </button>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="w-full rounded-[20px] py-3 text-sm font-semibold transition-colors hover:border-gray-600"
                style={{ background: SURFACE, border: `0.5px solid ${BORDER}`, color: '#9ca3af' }}
              >
                Sign in
              </button>
            </div>

            {/* Trust badges */}
            <div
              className="rounded-[24px] p-5 grid gap-2.5"
              style={{ background: SURFACE, border: `0.5px solid ${BORDER}` }}
            >
              {[
                { icon: '🔒', text: 'Bank-level encryption'        },
                { icon: '🎉', text: 'Always free — no credit card' },
                { icon: '🚫', text: 'No ads, ever'                  },
                { icon: '📦', text: 'Your data stays yours'         },
              ].map(({ icon, text }) => (
                <div key={text} className="flex items-center gap-2.5">
                  <span className="text-sm">{icon}</span>
                  <span className="text-xs font-medium" style={{ color: '#4b5563' }}>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
