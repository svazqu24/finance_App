import { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useApp } from './AppContext';
import { currentMonthAbbr, filterMonth, fmtDollars } from './utils';
import StatCard from './components/StatCard';
import AddTransactionModal from './components/AddTransactionModal';

const tabs = [
  { path: 'overview', label: 'Overview' },
  { path: 'transactions', label: 'Transactions' },
  { path: 'spending', label: 'Spending' },
  { path: 'budget', label: 'Budget' },
  { path: 'goals', label: 'Goals' },
  { path: 'portfolio', label: 'Portfolio' },
];

const monthLabel = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

function SunIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export default function Layout() {
  const { transactions, loading, darkMode, toggleDark, user, signOut } = useApp();
  const [modalOpen, setModalOpen] = useState(false);

  // Stat cards show current-month figures only
  const monthTxns = filterMonth(transactions, currentMonthAbbr());
  const income   = monthTxns.filter((t) => t.amt > 0).reduce((s, t) => s + t.amt, 0);
  const spent    = monthTxns.filter((t) => t.amt < 0).reduce((s, t) => s + Math.abs(t.amt), 0);
  const savedPct = income > 0 ? Math.max(0, Math.round(((income - spent) / income) * 100)) : 0;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-200">
      <div className="py-6 px-4 font-sans max-w-[680px] mx-auto">

        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-[11px] tracking-[.1em] uppercase text-gray-400 mb-1.5 m-0">net worth</p>
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="text-[36px] font-medium tabular-nums leading-[1.15] text-gray-900 dark:text-white">
                $47,840
              </span>
              <span
                className="text-xs font-medium px-2.5 py-[3px] rounded-full"
                style={{ color: '#27500A', background: '#C8EBB4' }}
              >
                +$1,240 this month
              </span>
            </div>
          </div>

          {/* Right side: controls + user */}
          <div className="flex flex-col items-end gap-2 pt-1">
            {/* Row 1: dark toggle · date · sign out */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleDark}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                aria-label="Toggle dark mode"
              >
                {darkMode ? <SunIcon /> : <MoonIcon />}
              </button>
              <p className="text-xs text-gray-400 m-0">{monthLabel}</p>
              <button
                onClick={signOut}
                className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                Sign out
              </button>
            </div>
            {/* Row 2: user email · add button */}
            <div className="flex items-center gap-2">
              {user?.email && (
                <span className="text-[11px] text-gray-400 truncate max-w-[160px]">
                  {user.email}
                </span>
              )}
              <button
                onClick={() => setModalOpen(true)}
                className="text-xs font-medium px-3 py-1.5 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 transition-colors whitespace-nowrap"
              >
                + Add Transaction
              </button>
            </div>
          </div>
        </div>

        {/* Summary stats — computed from live transactions */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          <StatCard label="income" value={loading ? '—' : fmtDollars(income)} sub="this month" />
          <StatCard label="spent"  value={loading ? '—' : fmtDollars(spent)}  sub="this month" />
          <StatCard label="saved"  value={loading ? '—' : `${savedPct}%`}      sub="of income" valueStyle={{ color: '#3B6D11' }} />
        </div>

        {/* Tab nav */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6 overflow-x-auto transition-colors">
          {tabs.map((tab) => (
            <NavLink
              key={tab.path}
              to={`/${tab.path}`}
              className={({ isActive }) =>
                `no-underline flex-shrink-0 px-3 pt-2 pb-[9px] text-[13px] border-b-2 whitespace-nowrap -mb-px transition-colors ${
                  isActive
                    ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white font-medium'
                    : 'border-transparent text-gray-400 font-normal'
                }`
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </div>

        {/* Page content */}
        <Outlet />
      </div>

      <AddTransactionModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
