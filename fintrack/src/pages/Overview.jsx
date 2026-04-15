import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import TransactionRow from '../components/TransactionRow';
import { useApp } from '../AppContext';
import { filterMonth, currentMonthAbbr } from '../utils';
import { budgets as DEFAULT_BUDGETS } from '../data';

// Build a { cat: defaultBudget } lookup from the static data
const DEFAULT_BUDGET_MAP = Object.fromEntries(DEFAULT_BUDGETS.map((b) => [b.cat, b.budget]));

function UploadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 16 12 12 8 16" />
      <line x1="12" y1="12" x2="12" y2="21" />
      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

// ── Alert color tokens ──────────────────────────────────────────────────────
const ALERT_STYLES = {
  warning:  { border: '#d97706', bg: 'rgba(217,119,6,0.08)',  dot: '#f59e0b', text: '#92400e',  darkText: '#fcd34d' },
  info:     { border: '#3b82f6', bg: 'rgba(59,130,246,0.08)', dot: '#60a5fa', text: '#1e40af',  darkText: '#93c5fd' },
  positive: { border: '#27AE60', bg: 'rgba(39,174,96,0.08)',  dot: '#4ade80', text: '#14532d',  darkText: '#86efac' },
};

function AttentionPanel({ alerts, onDismiss }) {
  if (alerts.length === 0) return null;

  return (
    <div className="mb-4 flex flex-col gap-2">
      {alerts.map((alert) => {
        const sty = ALERT_STYLES[alert.type];
        return (
          <div
            key={alert.id}
            className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl border text-sm"
            style={{ background: sty.bg, borderColor: sty.border + '44' }}
          >
            <span
              className="w-2 h-2 rounded-full flex-shrink-0 mt-[5px]"
              style={{ background: sty.dot }}
            />
            <span
              className="flex-1 leading-snug dark:hidden"
              style={{ color: sty.text, fontSize: '13px' }}
            >
              {alert.text}
            </span>
            <span
              className="flex-1 leading-snug hidden dark:block"
              style={{ color: sty.darkText, fontSize: '13px' }}
            >
              {alert.text}
            </span>
            <button
              onClick={() => onDismiss(alert.id)}
              className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded transition-opacity opacity-50 hover:opacity-100"
              style={{ color: sty.dot }}
              aria-label="Dismiss"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default function Overview() {
  const { transactions, loading, openAddModal, openCsvModal, preferences, budgetOverrides, billsData } = useApp();
  const twoCol = preferences.layoutStyle === 'two-column';
  const isEmpty = !loading && transactions.length === 0;

  // ── Session-dismissed alert IDs ──────────────────────────────────────────
  const [dismissed, setDismissed] = useState(new Set());
  const dismiss = (id) => setDismissed((prev) => new Set([...prev, id]));

  // ── Build alerts ─────────────────────────────────────────────────────────
  const alerts = useMemo(() => {
    if (transactions.length === 0) return [];
    const monthTxns = filterMonth(transactions, currentMonthAbbr());
    const allAlerts = [];

    // Spending per category (expenses only, excluding Transfer)
    const spending = {};
    for (const t of monthTxns) {
      if (t.amt < 0 && t.cat !== 'Transfer') {
        spending[t.cat] = (spending[t.cat] || 0) + Math.abs(t.amt);
      }
    }

    // Budget limits = overrides + defaults
    const budgetMap = { ...DEFAULT_BUDGET_MAP, ...budgetOverrides };

    // Warning: over budget (most over first)
    const overBudget = Object.entries(spending)
      .map(([cat, spent]) => ({ cat, spent, over: spent - (budgetMap[cat] || 0) }))
      .filter((x) => x.over > 0)
      .sort((a, b) => b.over - a.over);

    for (const { cat, over } of overBudget) {
      allAlerts.push({
        id: `over-${cat}`,
        type: 'warning',
        text: `${cat} is $${Math.round(over)} over budget this month`,
      });
    }

    // Info: bills due in the next 7 days (not yet paid this month)
    const today    = new Date();
    const todayDay = today.getDate();
    const in7Day   = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7).getDate();
    const crossMonth = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7).getMonth() !== today.getMonth();
    const currentMonthStr = today.toLocaleString('en-US', { month: 'short' }) + ' ' + today.getFullYear();

    const dueSoon = billsData.filter((b) => {
      if (b.paid_month === currentMonthStr) return false;
      if (crossMonth) return b.due_day >= todayDay || b.due_day <= in7Day;
      return b.due_day >= todayDay && b.due_day <= todayDay + 7;
    });

    if (dueSoon.length > 0) {
      allAlerts.push({
        id: 'bills-due',
        type: 'info',
        text: `${dueSoon.length} bill${dueSoon.length === 1 ? '' : 's'} due in the next 7 days`,
      });
    }

    // Positive: under budget in N categories (only count cats with some spending)
    const underBudgetCats = Object.keys(budgetMap).filter((cat) => {
      const spent = spending[cat] || 0;
      const limit = budgetMap[cat];
      return limit > 0 && spent > 0 && spent < limit;
    });

    if (underBudgetCats.length >= 2) {
      allAlerts.push({
        id: 'under-budget',
        type: 'positive',
        text: `You're under budget in ${underBudgetCats.length} ${underBudgetCats.length === 1 ? 'category' : 'categories'} this month`,
      });
    }

    // Sort: warnings → info → positive, then filter dismissed, cap at 3
    const typeOrder = { warning: 0, info: 1, positive: 2 };
    return allAlerts
      .sort((a, b) => typeOrder[a.type] - typeOrder[b.type])
      .filter((a) => !dismissed.has(a.id))
      .slice(0, 3);
  }, [transactions, budgetOverrides, billsData, dismissed]);

  return (
    <>
      {/* Net worth placeholder */}
      <div className="h-32 mb-6 rounded-xl bg-[#f5f5f3] dark:bg-nero-surface flex items-center justify-center transition-colors">
        <p className="text-xs text-gray-400 text-center leading-relaxed px-4">
          Net worth history will appear here once you start tracking your accounts.
        </p>
      </div>

      {isEmpty ? (
        /* ── Empty state ── */
        <div className="text-center py-12">
          <div
            className="w-12 h-12 flex items-center justify-center text-white font-semibold text-xl mx-auto mb-4"
            style={{ background: '#27AE60', borderRadius: '10px 3px 10px 3px', fontFamily: 'Geist, system-ui, sans-serif' }}
          >
            N
          </div>
          <p className="text-[15px] font-semibold text-gray-900 dark:text-white mb-1.5">
            Start tracking your money
          </p>
          <p className="text-sm text-gray-400 leading-relaxed mb-6 max-w-[260px] mx-auto">
            Add your first transaction or import a CSV from your bank.
          </p>
          <div className="flex gap-2.5 justify-center flex-wrap">
            <button
              onClick={openAddModal}
              className="flex items-center gap-1.5 text-sm font-medium px-4 py-2.5 rounded-[20px] text-white transition-colors" style={{ background: '#27AE60' }}
            >
              <PlusIcon />
              Add transaction
            </button>
            <button
              onClick={openCsvModal}
              className="flex items-center gap-1.5 text-sm font-medium px-4 py-2.5 rounded-[20px] border border-gray-300 dark:border-nero-border text-gray-700 dark:text-gray-300 hover:border-gray-400 transition-colors"
            >
              <UploadIcon />
              Import CSV
            </button>
          </div>
        </div>
      ) : (
        /* ── Recent activity ── */
        <>
          {/* Attention panel — between stat cards and recent activity */}
          <AttentionPanel alerts={alerts} onDismiss={dismiss} />

          <div className="flex justify-between items-center mb-2.5">
            <div>
              <p className="text-[13px] font-medium m-0 text-gray-900 dark:text-white">Recent activity</p>
              <p className="text-xs text-gray-400 mt-0.5 m-0">10-second fraud check</p>
            </div>
            <Link to="/transactions" className="text-xs no-underline" style={{ color: '#27AE60' }}>
              All →
            </Link>
          </div>
          {twoCol ? (
            <div className="grid grid-cols-2 gap-2">
              {transactions.slice(0, 6).map((t, i) => (
                <TransactionRow key={i} txn={t} />
              ))}
            </div>
          ) : (
            transactions.slice(0, 5).map((t, i) => (
              <TransactionRow key={i} txn={t} />
            ))
          )}
        </>
      )}
    </>
  );
}
