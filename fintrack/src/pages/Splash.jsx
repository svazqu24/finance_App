import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../AppContext';

const cards = [
  {
    title: 'Transactions',
    description: 'See every merchant, account label, and category pill in one clean feed.',
    content: (
      <div className="space-y-3">
        <div className="rounded-2xl bg-[#111111] p-4 border border-[#2a2a2a] min-h-[400px]">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 flex items-center justify-center rounded-[10px_3px_10px_3px] bg-[#f87171]/15 text-red-400 text-sm font-semibold">
                  P
                </div>
                <div>
                  <p className="text-sm text-white">Panera Bread</p>
                  <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-gray-400">
                    <span className="rounded-full border border-[#2a2a2a] px-2 py-1">Dining</span>
                  </div>
                </div>
              </div>
              <span className="text-sm font-semibold text-[#f87171]">-$14.18</span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 flex items-center justify-center rounded-[10px_3px_10px_3px] bg-[#4ade80]/15 text-emerald-400 text-sm font-semibold">
                  $
                </div>
                <div>
                  <p className="text-sm text-white">Payroll Deposit</p>
                  <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-gray-400">
                    <span className="rounded-full border border-[#2a2a2a] px-2 py-1">Income</span>
                  </div>
                </div>
              </div>
              <span className="text-sm font-semibold text-[#4ade80]">+$530.50</span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 flex items-center justify-center rounded-[10px_3px_10px_3px] bg-[#f87171]/15 text-red-400 text-sm font-semibold">
                  B
                </div>
                <div>
                  <p className="text-sm text-white">Burger King</p>
                  <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-gray-400">
                    <span className="rounded-full border border-[#2a2a2a] px-2 py-1">Dining</span>
                  </div>
                </div>
              </div>
              <span className="text-sm font-semibold text-[#f87171]">-$12.25</span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 flex items-center justify-center rounded-[10px_3px_10px_3px] bg-[#f87171]/15 text-red-400 text-sm font-semibold">
                  S
                </div>
                <div>
                  <p className="text-sm text-white">Spotify</p>
                  <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-gray-400">
                    <span className="rounded-full border border-[#2a2a2a] px-2 py-1">Subscriptions</span>
                  </div>
                </div>
              </div>
              <span className="text-sm font-semibold text-[#f87171]">-$10.99</span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 flex items-center justify-center rounded-[10px_3px_10px_3px] bg-[#4ade80]/15 text-emerald-400 text-sm font-semibold">
                  J
                </div>
                <div>
                  <p className="text-sm text-white">Jewel Osco</p>
                  <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-gray-400">
                    <span className="rounded-full border border-[#2a2a2a] px-2 py-1">Groceries</span>
                  </div>
                </div>
              </div>
              <span className="text-sm font-semibold text-[#f87171]">-$42.50</span>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: 'Budget tracker',
    description: 'Animated bar fills and smart cards for income, spent, and saved.',
    content: (
      <div className="space-y-3">
        <div className="rounded-2xl bg-[#111111] border border-[#2a2a2a] p-4">
          <div className="flex justify-between mb-3 text-sm text-white">
            <span>Budget</span>
            <span>61% used</span>
          </div>
          <div className="h-2 rounded-full bg-[#222] overflow-hidden">
            <div className="h-full rounded-full bg-emerald-500 transition-all duration-1000" style={{ width: '61%' }} />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-[11px] text-gray-400">
          <div className="rounded-2xl bg-[#111] p-3 text-white">
            <p className="text-[11px] uppercase tracking-[.16em]">Income</p>
            <p className="text-sm font-semibold mt-2">$5,200</p>
          </div>
          <div className="rounded-2xl bg-[#111] p-3 text-white">
            <p className="text-[11px] uppercase tracking-[.16em]">Spent</p>
            <p className="text-sm font-semibold mt-2">$3,160</p>
          </div>
          <div className="rounded-2xl bg-[#111] p-3 text-white">
            <p className="text-[11px] uppercase tracking-[.16em]">Saved</p>
            <p className="text-sm font-semibold mt-2">$2,040</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: 'Bills & cards',
    description: 'Track due dates, balances, and card utilization in one glance.',
    content: (
      <div className="space-y-3">
        <div className="rounded-2xl bg-[#111111] border border-[#2a2a2a] p-4">
          <p className="text-[11px] uppercase tracking-[.16em] text-gray-400">Credit cards</p>
          <div className="mt-3 space-y-3">
            <div className="rounded-2xl bg-[#141414] p-3 border border-[#232323]">
              <div className="flex justify-between text-sm text-white">
                <span>Visa •••• 1243</span>
                <span>67% UTIL</span>
              </div>
              <div className="h-2 rounded-full bg-[#222] mt-3 overflow-hidden">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: '67%' }} />
              </div>
            </div>
            <div className="rounded-2xl bg-[#141414] p-3 border border-[#232323]">
              <div className="flex justify-between text-sm text-white">
                <span>Mastercard •••• 8391</span>
                <span>42% UTIL</span>
              </div>
              <div className="h-2 rounded-full bg-[#222] mt-3 overflow-hidden">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: '42%' }} />
              </div>
            </div>
          </div>
        </div>
        <div className="rounded-2xl bg-[#111111] border border-[#2a2a2a] p-4">
          <p className="text-[11px] uppercase tracking-[.16em] text-gray-400">Upcoming bills</p>
          <div className="mt-3 space-y-2 text-sm text-white">
            <div className="flex justify-between">
              <span>Internet</span>
              <span className="text-gray-400">Due Apr 22</span>
            </div>
            <div className="flex justify-between">
              <span>Rent</span>
              <span className="text-gray-400">Due May 1</span>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: 'Goals',
    description: 'Visual goal tracking with progress and recent contribution history.',
    content: (
      <div className="space-y-3">
        <div className="rounded-2xl bg-[#111111] border border-[#2a2a2a] p-4">
          <div className="flex justify-between items-center text-white mb-2">
            <span>Japan Trip</span>
            <span className="text-xs text-green-300">52%</span>
          </div>
          <div className="h-2 rounded-full bg-[#222] overflow-hidden">
            <div className="h-full rounded-full bg-emerald-500" style={{ width: '52%' }} />
          </div>
        </div>
        <div className="rounded-2xl bg-[#111111] border border-[#2a2a2a] p-4 text-sm text-gray-300 space-y-2">
          <div className="flex justify-between">
            <span>Apr 12</span>
            <span className="text-emerald-400">+$120.00</span>
          </div>
          <p>Train tickets from last week.</p>
          <div className="flex justify-between">
            <span>Apr 3</span>
            <span className="text-emerald-400">+$80.00</span>
          </div>
          <p>Hotel deposit</p>
        </div>
      </div>
    ),
  },
];

function Dot({ active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-3 h-3 rounded-full transition-colors ${active ? 'bg-emerald-400' : 'bg-gray-600/40'}`}
      aria-label="Preview slide"
    />
  );
}

export default function Splash() {
  const navigate = useNavigate();
  const { user } = useApp();
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (user) {
      navigate('/overview', { replace: true });
      return;
    }
    const timer = window.setInterval(() => {
      setActive((prev) => (prev + 1) % cards.length);
    }, 3000);
    return () => window.clearInterval(timer);
  }, [navigate, user]);

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col items-center text-center gap-4 mb-10">
            <div
              className="w-14 h-14 flex items-center justify-center"
              style={{ background: '#27AE60', borderRadius: '10px 3px 10px 3px' }}
            >
              <span className="text-2xl font-semibold">N</span>
            </div>
            <div className="text-white text-3xl font-semibold">nero</div>
            <div>
              <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight">Your money, finally clear</h1>
              <p className="mt-3 text-sm text-gray-400 max-w-2xl mx-auto">
                From dinero — the free Mint replacement.
              </p>
            </div>
          </div>
        <div className="grid gap-6 lg:grid-cols-[1.35fr_0.95fr]">
          <div className="relative overflow-hidden rounded-[24px] bg-[#111111] border border-[#272727] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
            <div className="absolute inset-0 bg-gradient-to-br from-[#27ae60]/20 via-transparent to-transparent pointer-events-none" />
            <div className="space-y-5 relative z-10">
              <div className="overflow-hidden rounded-3xl bg-[#141414] p-6 border border-[#232323] min-h-[400px]">
                {cards.map((card, idx) => (
                  <div
                    key={card.title}
                    className={`transform transition-all duration-700 ${idx === active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 absolute inset-x-0 top-0'}`}
                  >
                    <p className="text-gray-400 mb-5">{card.description}</p>
                    {card.content}
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-center gap-2">
                {cards.map((_, idx) => (
                  <Dot key={idx} active={idx === active} onClick={() => setActive(idx)} />
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[24px] border border-[#232323] bg-[#111111] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
              <div className="grid gap-4 sm:grid-cols-3 text-center">
                <div>
                  <p className="text-2xl font-semibold">1,100+</p>
                  <p className="text-sm text-gray-400">Transactions imported</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold">$0</p>
                  <p className="text-sm text-gray-400">Forever free</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold">100%</p>
                  <p className="text-sm text-gray-400">Your data</p>
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-[#232323] bg-[#111111] p-6 space-y-4">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="w-full rounded-[20px] bg-[#27AE60] py-3 text-sm font-semibold text-[#0d0d0d] transition hover:bg-emerald-500"
              >
                Get started free
              </button>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="w-full rounded-[20px] border border-[#2a2a2a] py-3 text-sm font-semibold text-white transition hover:border-[#3a3a3a]"
              >
                Sign in
              </button>
            </div>

            <div className="rounded-[24px] border border-[#232323] bg-[#111111] p-6 grid gap-3 text-sm text-gray-300">
              <div className="flex items-center gap-3">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                Encrypted
              </div>
              <div className="flex items-center gap-3">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                Always free
              </div>
              <div className="flex items-center gap-3">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                No credit card
              </div>
              <div className="flex items-center gap-3">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                No ads ever
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
