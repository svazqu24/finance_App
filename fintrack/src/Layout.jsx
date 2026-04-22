import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useApp } from './AppContext';
import { useState, useEffect, useRef } from 'react';
import { fmtDollars, filterByDateRange, dateRangeLabel } from './utils';
import StatCard from './components/StatCard';
import AddTransactionModal from './components/AddTransactionModal';
import CsvImportModal from './components/CsvImportModal';
import CreditCardModal from './components/CreditCardModal';
import OnboardingModal from './components/OnboardingModal';
import BottomNav from './components/BottomNav';
import { NAV_PRIMARY, NAV_SECONDARY, NAV_SETTINGS, NAV_ITEMS, GearIcon } from './navItems';

const TOP_TABS = [
  'overview','transactions','spending','budget','bills','goals','accounts','portfolio',
];

const monthLabel = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

function NeroMark({ size = 28 }) {
  return (
    <div
      className="flex items-center justify-center flex-shrink-0 text-white font-semibold"
      style={{
        width: size, height: size,
        background: '#27AE60',
        borderRadius: '10px 3px 10px 3px',
        fontSize: size * 0.5,
        letterSpacing: '-0.02em',
        fontFamily: 'Geist, system-ui, sans-serif',
      }}
    >
      N
    </div>
  );
}

function SunIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
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

/** Sidebar used for left / right nav positions */
function Sidebar({ side }) {
  const { signOut, user } = useApp();
  return (
    <aside
      className="hidden sm:flex flex-shrink-0 flex-col bg-[#0a0e1a] border-[#1f2937] h-screen sticky top-0 overflow-y-auto"
      style={{
        width: 220,
        borderRight: side === 'left'  ? '1px solid' : undefined,
        borderLeft:  side === 'right' ? '1px solid' : undefined,
        borderColor: 'inherit',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-5" style={{ borderBottom: '1px solid #1f2937' }}>
        <NeroMark size={28} />
        <span className="text-[18px] font-semibold text-[#f9fafb] tracking-tight">Nero</span>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-2 py-3 flex flex-col gap-0.5 overflow-y-auto">
        {/* Primary section */}
        <p className="px-3 pt-1 pb-1.5 select-none" style={{ fontSize: 9, letterSpacing: '0.12em', color: '#374151', textTransform: 'uppercase' }}>
          Main
        </p>
        {NAV_PRIMARY.map((item) => (
          <NavLink key={item.path} to={`/${item.path}`}
            className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors no-underline ${isActive ? 'text-[#27AE60]' : 'text-[#6b7280] hover:bg-[#1f2937]'}`}
            style={({ isActive }) => isActive ? { background: '#0d1f14' } : {}}
          >
            {({ isActive }) => (
              <>
                <span className="flex-shrink-0" style={isActive ? { color: '#27AE60' } : {}}>{item.icon}</span>
                {item.label}
              </>
            )}
          </NavLink>
        ))}

        {/* Divider */}
        <div className="mx-3 my-2 border-t" style={{ borderColor: '#1f2937' }} />

        {/* Secondary section */}
        <p className="px-3 pb-1.5 select-none" style={{ fontSize: 9, letterSpacing: '0.12em', color: '#374151', textTransform: 'uppercase' }}>
          More
        </p>
        {NAV_SECONDARY.map((item) => (
          <NavLink key={item.path} to={`/${item.path}`}
            className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors no-underline ${isActive ? 'text-[#27AE60]' : 'text-[#6b7280] hover:bg-[#1f2937]'}`}
            style={({ isActive }) => isActive ? { background: '#0d1f14' } : {}}
          >
            {({ isActive }) => (
              <>
                <span className="flex-shrink-0" style={isActive ? { color: '#27AE60' } : {}}>{item.icon}</span>
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer: settings + sign out + email */}
      <div className="px-2 py-2 flex-shrink-0" style={{ borderTop: '1px solid #1f2937' }}>
        <NavLink to={`/${NAV_SETTINGS.path}`}
          className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors no-underline ${isActive ? 'text-[#27AE60]' : 'text-[#6b7280] hover:bg-[#1f2937]'}`}
          style={({ isActive }) => isActive ? { background: '#0d1f14' } : {}}
        >
          {({ isActive }) => (
            <>
              <span className="flex-shrink-0" style={isActive ? { color: '#27AE60' } : {}}>{NAV_SETTINGS.icon}</span>
              {NAV_SETTINGS.label}
            </>
          )}
        </NavLink>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium text-[#6b7280] hover:bg-[#1f2937] transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Sign out
        </button>
        {user?.email && (
          <p className="px-3 pt-1 pb-2 text-[11px] truncate" style={{ color: '#4b5563' }}>{user.email}</p>
        )}
      </div>
    </aside>
  );
}

/** Header row used inside the main content area */
function Header({ compact }) {
  const {
    user, signOut,
    setCsvModalOpen, setAddModalOpen,
  } = useApp();
  const navigate = useNavigate();

  return (
    <div className={`flex justify-between items-start ${compact ? 'mb-3' : 'mb-6'}`}>
      <div className="flex items-center gap-2.5">
        <NeroMark size={32} />
        <p className="text-[26px] font-semibold leading-tight text-gray-900 dark:text-white tracking-tight">
          Nero
        </p>
      </div>

      <div className="flex flex-col items-end gap-2 pt-1">
        <div className="flex items-center gap-2">
          <p className="text-xs text-gray-400 m-0">{monthLabel}</p>
          <button
            onClick={() => navigate('/settings')}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            aria-label="Settings"
          >
            <GearIcon />
          </button>
          <button
            onClick={signOut}
            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            Sign out
          </button>
        </div>
        {user?.email && (
          <span className="hidden sm:inline text-[11px] text-gray-400 truncate max-w-[200px]">
            {user.email}
          </span>
        )}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setCsvModalOpen(true)}
            className="flex-1 sm:flex-none text-xs font-medium px-3 min-h-[44px] rounded-[20px] border border-gray-300 dark:border-[#1f2937] text-gray-600 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 transition-colors whitespace-nowrap"
          >
            Import CSV
          </button>
          <button
            onClick={() => setAddModalOpen(true)}
            className="flex-1 sm:flex-none text-xs font-medium px-3 min-h-[44px] rounded-[20px] text-white transition-colors whitespace-nowrap"
            style={{ background: '#27AE60' }}
          >
            + Add Transaction
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Layout() {
  const {
    transactions, loading,
    preferences, prefsLoaded,
    editTxn, setEditTxn,
    addModalOpen, setAddModalOpen,
    csvModalOpen, setCsvModalOpen,
    creditCardModalOpen, setCreditCardModalOpen,
    editCreditCard, setEditCreditCard,
    txnDateRange, txnCustomFrom, txnCustomTo,
  } = useApp();
  const navigate = useNavigate();

  const { navPosition, compactView } = preferences;
  const compact = compactView;

  const rangeTxns  = filterByDateRange(transactions, txnDateRange, txnCustomFrom, txnCustomTo);
  const rangeLabel = dateRangeLabel(txnDateRange);
  const income     = rangeTxns.filter((t) => t.amt > 0).reduce((s, t) => s + t.amt, 0);
  const spent      = rangeTxns.filter((t) => t.amt < 0).reduce((s, t) => s + Math.abs(t.amt), 0);
  // Exclude Transfer from savings rate — transfers aren't real spending
  const realSpent  = rangeTxns.filter((t) => t.amt < 0 && t.cat !== 'Transfer').reduce((s, t) => s + Math.abs(t.amt), 0);
  const savedPct   = income > 0 ? Math.max(0, Math.round(((income - realSpent) / income) * 100)) : 0;

  // Animation state for stat numbers
  const [animIncome, setAnimIncome] = useState(0);
  const [animSpent, setAnimSpent] = useState(0);
  const [animSaved, setAnimSaved] = useState(0);
  const animInitialRef = useRef({ hasAnimated: false, prevTxnCount: 0 });

  // Animate numbers on first load after transactions are populated
  useEffect(() => {
    if (loading || transactions.length === 0) return;

    const isFirstPopulation = !animInitialRef.current.hasAnimated && animInitialRef.current.prevTxnCount === 0;
    if (!isFirstPopulation) {
      // Already animated or was already populated, just show final values
      setAnimIncome(income);
      setAnimSpent(realSpent);
      setAnimSaved(savedPct);
      return;
    }

    animInitialRef.current.hasAnimated = true;

    const DURATION = 800; // ms
    const START = performance.now();

    const animate = (now) => {
      const elapsed = now - START;
      const progress = Math.min(elapsed / DURATION, 1);
      // Ease-out: 1 - (1-progress)^3
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      setAnimIncome(income * easeProgress);
      setAnimSpent(realSpent * easeProgress);
      setAnimSaved(savedPct * easeProgress);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
    animInitialRef.current.prevTxnCount = transactions.length;
  }, [transactions, loading, income, realSpent, savedPct]);

  // Update displayed values when final values change (not animating)
  useEffect(() => {
    if (animInitialRef.current.hasAnimated) {
      setAnimIncome(income);
      setAnimSpent(spent);
      setAnimSaved(savedPct);
    }
  }, [income, realSpent, savedPct]);

  const modals = (
    <>
      <CsvImportModal
        open={csvModalOpen}
        onClose={() => setCsvModalOpen(false)}
        onViewTransactions={() => navigate('/transactions')}
        onCreateCreditCard={(accountInfo) => {
          setEditCreditCard({
            name: accountInfo.name,
            last_four: accountInfo.lastFour,
            credit_limit: '',
            current_balance: '',
            minimum_payment: '',
            due_day: '',
          });
          setCreditCardModalOpen(true);
          navigate('/bills');
        }}
      />
      <AddTransactionModal
        open={addModalOpen || !!editTxn}
        onClose={() => { setAddModalOpen(false); setEditTxn(null); }}
      />
      <CreditCardModal
        open={creditCardModalOpen}
        onClose={() => { setCreditCardModalOpen(false); setEditCreditCard(null); }}
      />
      {prefsLoaded && !preferences.onboardingComplete && (
        <>
          {console.log('[layout] Showing onboarding modal, onboardingComplete:', preferences.onboardingComplete)}
          <OnboardingModal />
        </>
      )}
    </>
  );

  const statsRow = (
    <div className={`grid grid-cols-1 sm:grid-cols-3 gap-2 ${compact ? 'mb-3' : 'mb-6'}`}>
      <StatCard label="income" value={loading ? '—' : fmtDollars(animIncome)} sub={rangeLabel} />
      <StatCard label="spent"  value={loading ? '—' : fmtDollars(realSpent)}  sub={rangeLabel} />
      <StatCard
        label="saved"
        value={loading ? '—' : `${Math.round(animSaved)}%`}
        sub="of income"
        valueStyle={
          savedPct > 5
            ? { color: '#27AE60' }
            : income > 0 && realSpent > income
              ? { color: '#d97706' }
              : undefined
        }
      />
    </div>
  );

  const topTabs = (
    <div className={`hidden sm:flex border-b border-gray-200 dark:border-[#1f2937] ${compact ? 'mb-3' : 'mb-6'} overflow-x-auto transition-colors`}>
      {TOP_TABS.map((path) => (
        <NavLink
          key={path}
          to={`/${path}`}
          className={({ isActive }) =>
            `no-underline flex-shrink-0 px-3 pt-2 pb-[9px] text-[13px] border-b-2 whitespace-nowrap -mb-px transition-colors capitalize ${
              isActive
                ? 'border-gray-900 dark:border-[#27AE60] text-gray-900 dark:text-[#27AE60] font-medium'
                : 'border-transparent text-gray-400 font-normal'
            }`
          }
        >
          {path.charAt(0).toUpperCase() + path.slice(1)}
        </NavLink>
      ))}
    </div>
  );

  // ── Sidebar layouts ──────────────────────────────────────────────────────────
  if (navPosition === 'left' || navPosition === 'right') {
    return (
      <div className="flex min-h-screen bg-white dark:bg-[#0a0e1a] transition-colors duration-200 overflow-x-hidden">
        {navPosition === 'left' && <Sidebar side="left" />}

        <div className="flex-1 min-w-0 py-4 px-4 sm:py-6 sm:px-5 overflow-y-auto">
          {/* Action buttons row */}
          <div className="flex justify-end items-center gap-2 mb-4">
            <button
              onClick={() => setCsvModalOpen(true)}
              className="text-xs font-medium px-3 min-h-[44px] rounded-[20px] border border-gray-300 dark:border-[#1f2937] text-gray-600 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 transition-colors whitespace-nowrap"
            >
              Import CSV
            </button>
            <button
              onClick={() => setAddModalOpen(true)}
              className="text-xs font-medium px-3 min-h-[44px] rounded-[20px] text-white transition-colors whitespace-nowrap"
              style={{ background: '#27AE60' }}
            >
              + Add Transaction
            </button>
          </div>
          {statsRow}
          <div className={compact ? 'pb-20 sm:pb-4' : 'pb-24 sm:pb-8'}>
            <Outlet />
          </div>
        </div>

        {navPosition === 'right' && <Sidebar side="right" />}
        <BottomNav />
        {modals}
      </div>
    );
  }

  // ── Top / Bottom layouts (centered, max-width) ───────────────────────────────
  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0e1a] transition-colors duration-200 overflow-x-hidden">
      <div className={`${compact ? 'py-3' : 'py-6'} px-4 font-sans max-w-[680px] mx-auto`}>

        <Header compact={compact} />
        {statsRow}

        {/* Top tabs — hidden when navPosition is 'bottom' or on mobile */}
        {navPosition !== 'bottom' && topTabs}

        <div className={navPosition === 'bottom' ? 'pb-24' : 'pb-24 sm:pb-0'}>
          <Outlet />
        </div>
      </div>

      {/* BottomNav: always on mobile; also on sm+ when navPosition=bottom */}
      <BottomNav />

      {modals}
    </div>
  );
}
