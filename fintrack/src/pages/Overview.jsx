import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import TransactionRow from '../components/TransactionRow';
import { useApp } from '../AppContext';
import { filterMonth, currentMonthAbbr } from '../utils';
import { budgets as DEFAULT_BUDGETS } from '../data';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import NetWorthModal from '../components/NetWorthModal';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

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
  const { transactions, loading, openAddModal, openCsvModal, preferences, budgetOverrides, billsData, creditCardsData, netWorthEntries, getNetWorthHistory } = useApp();
  const twoCol = preferences.layoutStyle === 'two-column';
  const isEmpty = !loading && transactions.length === 0;

  // Net worth modal state
  const [netWorthModalOpen, setNetWorthModalOpen] = useState(false);
  const [netWorthMilestone, setNetWorthMilestone] = useState('');

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
      .map(([cat, spent]) => {
        const limit = budgetMap[cat] ?? 0;
        return { cat, spent, over: limit > 0 ? spent - limit : 0 };
      })
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

    // Warning: credit cards due in the next 7 days (not yet paid this month)
    const creditCardsDueSoon = creditCardsData.filter((card) => {
      if (card.paid_month === currentMonthStr) return false;
      const dueDate = new Date(today.getFullYear(), today.getMonth(), card.due_day);
      const daysUntil = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
      return daysUntil <= 7 && daysUntil >= 0;
    });

    for (const card of creditCardsDueSoon) {
      const dueDate = new Date(today.getFullYear(), today.getMonth(), card.due_day);
      const daysUntil = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
      allAlerts.push({
        id: `cc-${card.id}`,
        type: 'warning',
        text: `${card.name} due in ${daysUntil} day${daysUntil === 1 ? '' : 's'} — $${card.minimum_payment} minimum`,
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

  // ── Net worth data ───────────────────────────────────────────────────────
  const netWorthHistory = useMemo(() => getNetWorthHistory(), [netWorthEntries]);
  const currentNetWorth = netWorthHistory.length > 0 ? netWorthHistory[netWorthHistory.length - 1].net_worth : 0;
  const previousNetWorth = netWorthHistory.length > 1 ? netWorthHistory[netWorthHistory.length - 2].net_worth : 0;
  const monthOverMonthChange = currentNetWorth - previousNetWorth;

  // Net worth milestones
  useEffect(() => {
    if (currentNetWorth <= 0) return;
    const milestones = [1000, 5000, 10000, 25000, 50000, 100000];
    const crossedMilestone = milestones.find(m => currentNetWorth >= m && previousNetWorth < m);
    if (crossedMilestone) {
      const milestoneKey = `net-worth-milestone-${crossedMilestone}`;
      const alreadySeen = localStorage.getItem(milestoneKey);
      if (!alreadySeen) {
        localStorage.setItem(milestoneKey, '1');
        setNetWorthMilestone(`You hit $${crossedMilestone.toLocaleString()} net worth! Keep going.`);
        const timeout = setTimeout(() => setNetWorthMilestone(''), 5000);
        return () => clearTimeout(timeout);
      }
    }
    return undefined;
  }, [currentNetWorth, previousNetWorth]);

  const chartData = useMemo(() => ({
    labels: netWorthHistory.map(entry => {
      const [year, month] = entry.month.split('-');
      return new Date(year, month - 1).toLocaleDateString('en-US', { month: 'short' });
    }),
    datasets: [{
      label: 'Net Worth',
      data: netWorthHistory.map(entry => entry.net_worth),
      borderColor: '#27AE60',
      backgroundColor: 'rgba(39, 174, 96, 0.1)',
      tension: 0.4,
      pointRadius: 4,
      pointHoverRadius: 6,
    }],
  }), [netWorthHistory]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => `$${context.parsed.y.toLocaleString()}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#9CA3AF' },
      },
      y: {
        grid: { color: '#374151', lineWidth: 0.5 },
        ticks: {
          color: '#9CA3AF',
          callback: (value) => `$${value.toLocaleString()}`,
        },
      },
    },
  };

  return (
    <>
      {/* Net Worth Section */}
      {netWorthHistory.length > 0 ? (
        <div className="mb-6 rounded-xl p-4" style={{ background: '#111827', border: '0.5px solid #1f2937' }}>
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Net Worth</p>
              <p className="text-2xl font-bold text-gray-100 tabular-nums">
                ${currentNetWorth.toLocaleString()}
              </p>
              {monthOverMonthChange !== 0 && (
                <p className="text-sm font-medium" style={{ color: monthOverMonthChange > 0 ? '#27AE60' : '#f87171' }}>
                  {monthOverMonthChange > 0 ? '+' : ''}${monthOverMonthChange.toLocaleString()} this month
                </p>
              )}
            </div>
            <button
              onClick={() => setNetWorthModalOpen(true)}
              className="text-sm font-semibold text-white rounded-full px-4 py-2"
              style={{ background: '#27AE60' }}
            >
              + Update this month
            </button>
          </div>

          {netWorthMilestone && (
            <div className="rounded-full px-3 py-2 mb-3 text-sm font-medium" style={{ background: 'rgba(39,174,96,0.12)', color: '#34d399' }}>
              {netWorthMilestone}
            </div>
          )}

          <div className="h-32">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>
      ) : (
        <div className="mb-4 flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: '#111827', border: '0.5px solid #1f2937' }}>
          <span className="text-xs uppercase tracking-wide text-gray-500 font-medium">Net Worth</span>
          <span className="text-xs text-gray-400">·</span>
          <span className="text-sm font-semibold text-white tabular-nums">$0</span>
          <button
            onClick={() => setNetWorthModalOpen(true)}
            className="ml-auto text-xs font-medium px-3 py-1 rounded-full"
            style={{ background: 'rgba(39,174,96,0.12)', color: '#27AE60' }}
          >
            + Update this month
          </button>
        </div>
      )}

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
              <p className="text-xs text-gray-400 mt-0.5 m-0">Latest transaction updates</p>
            </div>
            <Link to="/transactions" className="text-xs no-underline" style={{ color: '#27AE60' }}>
              All →
            </Link>
          </div>
          {twoCol ? (
            <div className="grid grid-cols-2 gap-2">
              {transactions.slice(0, 6).map((t) => (
                <TransactionRow key={t.id} txn={t} />
              ))}
            </div>
          ) : (
            transactions.slice(0, 5).map((t) => (
              <TransactionRow key={t.id} txn={t} />
            ))
          )}
        </>
      )}
      <NetWorthModal open={netWorthModalOpen} onClose={() => setNetWorthModalOpen(false)} />
    </>
  );
}
