import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import TransactionRow from '../components/TransactionRow';
import { useApp } from '../AppContext';
import { filterMonth, currentMonthAbbr, groupExpensesByCategory } from '../utils';
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

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const DEFAULT_BUDGET_MAP = Object.fromEntries(DEFAULT_BUDGETS.map((b) => [b.cat, b.budget]));

const CAT_EMOJI = {
  Dining: '🍽', Groceries: '🛒', Shopping: '🛍', Transport: '🚗',
  Health: '💊', Subscriptions: '🎵', Housing: '🏠', Utilities: '⚡',
  Insurance: '🛡', Travel: '✈', Entertainment: '🎬', Income: '💵',
  Transfer: '🔄', Other: '📦',
};

const ALERT_STYLES = {
  warning:  { border: '#d97706', bg: 'rgba(217,119,6,0.08)',  dot: '#f59e0b', darkText: '#fcd34d' },
  info:     { border: '#3b82f6', bg: 'rgba(59,130,246,0.08)', dot: '#60a5fa', darkText: '#93c5fd' },
  positive: { border: '#27AE60', bg: 'rgba(39,174,96,0.08)',  dot: '#4ade80', darkText: '#86efac' },
};

function fmt(n) {
  return '$' + Math.abs(Number(n)).toLocaleString('en-US', { maximumFractionDigits: 0 });
}

// ── Mini sparkline SVG ────────────────────────────────────────────────────────
function Sparkline({ points, color }) {
  if (!points || points.length < 2) return null;
  const max = Math.max(...points, 1);
  const W = 140; const H = 36;
  const step = W / (points.length - 1);
  const pts = points
    .map((v, i) => `${i * step},${H - (v / max) * (H - 4) - 2}`)
    .join(' ');
  return (
    <svg width={W} height={H} style={{ overflow: 'visible' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

// ── Card wrapper ──────────────────────────────────────────────────────────────
function Card({ children, className = '' }) {
  return (
    <div
      className={`rounded-[10px] ${className}`}
      style={{ background: '#111827', border: '0.5px solid #1f2937' }}
    >
      {children}
    </div>
  );
}

function CardHeader({ label, linkTo, linkLabel }) {
  return (
    <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
      <p className="font-medium" style={{ fontSize: 12, color: '#f9fafb' }}>{label}</p>
      {linkTo && (
        <Link to={linkTo} className="no-underline" style={{ fontSize: 11, color: '#27AE60' }}>
          {linkLabel ?? 'View all →'}
        </Link>
      )}
    </div>
  );
}

// ── Attention panel ───────────────────────────────────────────────────────────
function AttentionPanel({ alerts, onDismiss }) {
  if (alerts.length === 0) return null;
  return (
    <div className="flex flex-col gap-2 mb-3">
      {alerts.map((alert) => {
        const sty = ALERT_STYLES[alert.type];
        return (
          <div
            key={alert.id}
            className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl border"
            style={{ background: sty.bg, borderColor: sty.border + '44', borderLeft: `3px solid ${sty.border}` }}
          >
            <span className="w-2 h-2 rounded-full flex-shrink-0 mt-[5px]" style={{ background: sty.dot }} />
            <span className="flex-1 leading-snug" style={{ color: sty.darkText, fontSize: 13 }}>{alert.text}</span>
            <button
              onClick={() => onDismiss(alert.id)}
              className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded transition-opacity opacity-50 hover:opacity-100"
              style={{ color: sty.dot }}
              aria-label="Dismiss"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Overview() {
  const {
    transactions, loading, openAddModal, openCsvModal,
    budgetOverrides, billsData, creditCardsData,
    netWorthEntries, getNetWorthHistory,
    displayName,
  } = useApp();

  const isEmpty = !loading && transactions.length === 0;

  const [netWorthModalOpen, setNetWorthModalOpen] = useState(false);
  const [netWorthMilestone, setNetWorthMilestone] = useState('');
  const [dismissed, setDismissed] = useState(new Set());
  const dismiss = (id) => setDismissed((prev) => new Set([...prev, id]));

  // ── Greeting ─────────────────────────────────────────────────────────────
  const hour     = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const greetEmoji = hour < 12 ? '☀️' : hour < 17 ? '👋' : '🌙';
  const today    = new Date();
  const dayLabel = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const monthLabel = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // ── Current month data ────────────────────────────────────────────────────
  const abbr       = currentMonthAbbr();
  const monthTxns  = useMemo(() => filterMonth(transactions, abbr), [transactions, abbr]);
  const expenses   = useMemo(() => monthTxns.filter((t) => t.amt < 0 && t.cat !== 'Transfer'), [monthTxns]);
  const catSpend   = useMemo(() => groupExpensesByCategory(monthTxns), [monthTxns]);

  // ── Budget data ────────────────────────────────────────────────────────────
  const budgetMap  = useMemo(() => ({ ...DEFAULT_BUDGET_MAP, ...budgetOverrides }), [budgetOverrides]);

  // Top 3 categories by spend
  const topCatRows = useMemo(() =>
    Object.entries(catSpend)
      .map(([cat, spent]) => ({ cat, spent, limit: budgetMap[cat] ?? 0 }))
      .sort((a, b) => b.spent - a.spent)
      .slice(0, 3),
    [catSpend, budgetMap]
  );

  const totalBudget = useMemo(
    () => Object.values(budgetMap).reduce((s, v) => s + v, 0),
    [budgetMap]
  );
  const totalSpent = useMemo(
    () => Object.values(catSpend).reduce((s, v) => s + v, 0),
    [catSpend]
  );

  // ── Spending sparkline — daily cumulative this month ───────────────────────
  const sparkPoints = useMemo(() => {
    const currentDay = today.getDate();
    const daily = Array(currentDay).fill(0);
    for (const t of expenses) {
      const parts = t.date?.split(' ');
      const dayNum = parts?.length === 2 ? parseInt(parts[1], 10) : NaN;
      if (!isNaN(dayNum) && dayNum >= 1 && dayNum <= currentDay) {
        daily[dayNum - 1] += Math.abs(t.amt);
      }
    }
    return daily.reduce((acc, d) => { acc.push((acc.at(-1) ?? 0) + d); return acc; }, []);
  }, [expenses]);

  const sparkColor = totalSpent > totalBudget && totalBudget > 0 ? '#f87171' : '#34d399';

  // ── Top cat emojis for spending card ──────────────────────────────────────
  const topCatEmojis = topCatRows.slice(0, 4).map((r) => CAT_EMOJI[r.cat] ?? '📦');

  // ── Alerts ────────────────────────────────────────────────────────────────
  const alerts = useMemo(() => {
    if (transactions.length === 0) return [];
    const allAlerts = [];
    const spending = catSpend;
    const overBudget = Object.entries(spending)
      .map(([cat, spent]) => ({ cat, spent, over: (budgetMap[cat] ?? 0) > 0 ? spent - budgetMap[cat] : 0 }))
      .filter((x) => x.over > 0)
      .sort((a, b) => b.over - a.over);
    for (const { cat, over } of overBudget) {
      allAlerts.push({ id: `over-${cat}`, type: 'warning', text: `${cat} is $${Math.round(over)} over budget this month` });
    }

    const todayObj   = new Date();
    const todayDay   = todayObj.getDate();
    const in7Day     = new Date(todayObj.getFullYear(), todayObj.getMonth(), todayDay + 7).getDate();
    const crossMonth = new Date(todayObj.getFullYear(), todayObj.getMonth(), todayDay + 7).getMonth() !== todayObj.getMonth();
    const currentMonthStr = todayObj.toLocaleString('en-US', { month: 'short' }) + ' ' + todayObj.getFullYear();

    const dueSoon = billsData.filter((b) => {
      if (b.paid_month === currentMonthStr) return false;
      if (crossMonth) return b.due_day >= todayDay || b.due_day <= in7Day;
      return b.due_day >= todayDay && b.due_day <= todayDay + 7;
    });
    if (dueSoon.length > 0) {
      allAlerts.push({ id: 'bills-due', type: 'info', text: `${dueSoon.length} bill${dueSoon.length === 1 ? '' : 's'} due in the next 7 days` });
    }

    const ccDueSoon = creditCardsData.filter((card) => {
      if (card.paid_month === currentMonthStr) return false;
      const dueDate  = new Date(todayObj.getFullYear(), todayObj.getMonth(), card.due_day);
      const daysUntil = Math.ceil((dueDate - todayObj) / 86400000);
      return daysUntil <= 7 && daysUntil >= 0;
    });
    for (const card of ccDueSoon) {
      const daysUntil = Math.ceil((new Date(todayObj.getFullYear(), todayObj.getMonth(), card.due_day) - todayObj) / 86400000);
      allAlerts.push({ id: `cc-${card.id}`, type: 'warning', text: `${card.name} due in ${daysUntil} day${daysUntil === 1 ? '' : 's'} — $${card.minimum_payment} minimum` });
    }

    const underBudgetCats = Object.keys(budgetMap).filter((cat) => {
      const spent = spending[cat] || 0;
      const limit = budgetMap[cat];
      return limit > 0 && spent > 0 && spent < limit;
    });
    if (underBudgetCats.length >= 2) {
      allAlerts.push({ id: 'under-budget', type: 'positive', text: `You're under budget in ${underBudgetCats.length} categories this month` });
    }

    const typeOrder = { warning: 0, info: 1, positive: 2 };
    return allAlerts.sort((a, b) => typeOrder[a.type] - typeOrder[b.type]).filter((a) => !dismissed.has(a.id)).slice(0, 3);
  }, [transactions, catSpend, budgetMap, billsData, creditCardsData, dismissed]);

  // ── Net worth ─────────────────────────────────────────────────────────────
  const netWorthHistory   = useMemo(() => getNetWorthHistory(), [netWorthEntries]);
  const currentNetWorth   = netWorthHistory.length > 0 ? netWorthHistory.at(-1).net_worth : 0;
  const previousNetWorth  = netWorthHistory.length > 1 ? netWorthHistory.at(-2).net_worth : 0;
  const monthOverMonthChange = currentNetWorth - previousNetWorth;

  useEffect(() => {
    if (currentNetWorth <= 0) return;
    const milestones = [1000, 5000, 10000, 25000, 50000, 100000];
    const crossed    = milestones.find((m) => currentNetWorth >= m && previousNetWorth < m);
    if (!crossed) return;
    const key = `net-worth-milestone-${crossed}`;
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, '1');
    setNetWorthMilestone(`You hit $${crossed.toLocaleString()} net worth! Keep going.`);
    const t = setTimeout(() => setNetWorthMilestone(''), 5000);
    return () => clearTimeout(t);
  }, [currentNetWorth, previousNetWorth]);

  const chartData = useMemo(() => ({
    labels: netWorthHistory.map((e) => {
      const [yr, mo] = e.month.split('-');
      return new Date(yr, mo - 1).toLocaleDateString('en-US', { month: 'short' });
    }),
    datasets: [{ label: 'Net Worth', data: netWorthHistory.map((e) => e.net_worth),
      borderColor: '#27AE60', backgroundColor: 'rgba(39,174,96,0.1)',
      tension: 0.4, pointRadius: 4, pointHoverRadius: 6 }],
  }), [netWorthHistory]);

  const chartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => `$${c.parsed.y.toLocaleString()}` } } },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#9CA3AF' } },
      y: { grid: { color: '#374151', lineWidth: 0.5 }, ticks: { color: '#9CA3AF', callback: (v) => `$${v.toLocaleString()}` } },
    },
  };

  // ── Upcoming bills ────────────────────────────────────────────────────────
  const upcomingBills = useMemo(() => {
    const todayObj = new Date();
    const currentMonthStr = todayObj.toLocaleString('en-US', { month: 'short' }) + ' ' + todayObj.getFullYear();
    return [...billsData]
      .filter((b) => b.paid_month !== currentMonthStr)
      .sort((a, b) => a.due_day - b.due_day)
      .slice(0, 3);
  }, [billsData]);

  // ── Empty state ────────────────────────────────────────────────────────────
  if (isEmpty) {
    return (
      <>
        {/* Greeting */}
        <div className="mb-5">
          <p style={{ fontSize: 18, fontWeight: 500, color: '#f9fafb' }}>{greeting}, {displayName} {greetEmoji}</p>
          <p style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>{dayLabel} · {monthLabel}</p>
        </div>
        <div className="text-center py-12">
          <div className="w-12 h-12 flex items-center justify-center text-white font-semibold text-xl mx-auto mb-4"
               style={{ background: '#27AE60', borderRadius: '10px 3px 10px 3px' }}>N</div>
          <p className="text-[15px] font-semibold text-gray-900 dark:text-white mb-1.5">Start tracking your money</p>
          <p className="text-sm text-gray-400 leading-relaxed mb-6 max-w-[260px] mx-auto">
            Add your first transaction or import a CSV from your bank.
          </p>
          <div className="flex gap-2.5 justify-center flex-wrap">
            <button onClick={openAddModal} className="text-sm font-medium px-4 py-2.5 rounded-[20px] text-white" style={{ background: '#27AE60' }}>
              + Add transaction
            </button>
            <button onClick={openCsvModal} className="text-sm font-medium px-4 py-2.5 rounded-[20px] border border-gray-300 dark:border-[#1f2937] text-gray-700 dark:text-gray-300">
              Import CSV
            </button>
          </div>
        </div>
        <NetWorthModal open={netWorthModalOpen} onClose={() => setNetWorthModalOpen(false)} />
      </>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Greeting ── */}
      <div className="mb-5">
        <p style={{ fontSize: 18, fontWeight: 500, color: '#f9fafb', lineHeight: 1.3 }}>
          {greeting}, {displayName} {greetEmoji}
        </p>
        <p style={{ fontSize: 13, color: '#6b7280', marginTop: 3 }}>{dayLabel} · {monthLabel}</p>
      </div>

      {/* ── Two-column grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">

        {/* ─── Left column ─── */}
        <div className="flex flex-col gap-4">

          {/* Budget snapshot */}
          <Card>
            <CardHeader label="Budget snapshot" linkTo="/budget" />
            <div className="px-4 pb-4 flex flex-col gap-2.5">
              {topCatRows.length === 0 ? (
                <p style={{ fontSize: 12, color: '#6b7280' }}>No spending this month yet.</p>
              ) : (
                topCatRows.map(({ cat, spent, limit }) => {
                  const pct     = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
                  const overBudget = limit > 0 && spent > limit;
                  const barColor = overBudget ? '#f87171' : '#27AE60';
                  return (
                    <div key={cat}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <span style={{ fontSize: 13 }}>{CAT_EMOJI[cat] ?? '📦'}</span>
                          <span style={{ fontSize: 12, color: '#d1d5db', fontWeight: 500 }}>{cat}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span style={{ fontSize: 11, color: overBudget ? '#f87171' : '#9ca3af', fontVariantNumeric: 'tabular-nums' }}>
                            {fmt(spent)}{limit > 0 ? ` / ${fmt(limit)}` : ''}
                          </span>
                          {overBudget && <span style={{ fontSize: 10, color: '#f87171' }}>over</span>}
                        </div>
                      </div>
                      {limit > 0 && (
                        <div className="h-1 rounded-full overflow-hidden" style={{ background: '#1f2937' }}>
                          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: barColor }} />
                        </div>
                      )}
                    </div>
                  );
                })
              )}
              {topCatRows.length > 0 && totalBudget > 0 && (
                <div className="flex items-center justify-between pt-1" style={{ borderTop: '0.5px solid #1f2937' }}>
                  <span style={{ fontSize: 10, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Total</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: totalSpent > totalBudget ? '#f87171' : '#27AE60', fontVariantNumeric: 'tabular-nums' }}>
                    {fmt(totalSpent)} / {fmt(totalBudget)}
                  </span>
                </div>
              )}
            </div>
          </Card>

          {/* Spending snapshot */}
          <Card>
            <CardHeader label="Spending this month" linkTo="/spending" />
            <div className="px-4 pb-4">
              <div className="flex items-end justify-between gap-3 mb-2">
                <div>
                  <p style={{ fontSize: 22, fontWeight: 600, color: '#f9fafb', letterSpacing: '-0.5px', fontVariantNumeric: 'tabular-nums' }}>
                    {fmt(totalSpent)}
                  </p>
                  {totalBudget > 0 && (
                    <p style={{ fontSize: 11, color: totalSpent > totalBudget ? '#f87171' : '#34d399', marginTop: 2 }}>
                      {totalSpent > totalBudget
                        ? `${fmt(totalSpent - totalBudget)} over budget`
                        : `${fmt(totalBudget - totalSpent)} remaining`}
                    </p>
                  )}
                </div>
                <Sparkline points={sparkPoints} color={sparkColor} />
              </div>
              {topCatEmojis.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  {topCatEmojis.map((emoji, i) => (
                    <span key={i} className="w-7 h-7 flex items-center justify-center rounded-lg text-sm"
                          style={{ background: '#1f2937' }}>
                      {emoji}
                    </span>
                  ))}
                  <span style={{ fontSize: 11, color: '#4b5563', marginLeft: 2 }}>
                    top categories
                  </span>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* ─── Right column ─── */}
        <div className="flex flex-col gap-4">

          {/* Alerts */}
          {alerts.length > 0 && (
            <AttentionPanel alerts={alerts} onDismiss={dismiss} />
          )}

          {/* Recent activity + upcoming bills */}
          <Card>
            <CardHeader label="Recent activity" linkTo="/transactions" />
            <div className="px-0">
              {transactions.slice(0, 5).map((t) => (
                <div key={t.id} className="px-4">
                  <TransactionRow txn={t} />
                </div>
              ))}
            </div>

            {upcomingBills.length > 0 && (
              <>
                <div className="mx-4 mt-2 mb-0" style={{ borderTop: '0.5px solid #1f2937' }} />
                <div className="px-4 pt-2.5 pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <p style={{ fontSize: 11, fontWeight: 500, color: '#f9fafb' }}>Upcoming bills</p>
                    <Link to="/bills" className="no-underline" style={{ fontSize: 11, color: '#27AE60' }}>All →</Link>
                  </div>
                  {upcomingBills.map((b) => (
                    <div key={b.id} className="flex items-center justify-between py-1.5">
                      <div className="flex items-center gap-2">
                        <span style={{ fontSize: 14 }}>{CAT_EMOJI[b.cat] ?? '📅'}</span>
                        <span style={{ fontSize: 12, color: '#d1d5db' }}>{b.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span style={{ fontSize: 11, color: '#6b7280' }}>Due {b.due_day}</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#f9fafb', fontVariantNumeric: 'tabular-nums' }}>${b.amount}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Card>
        </div>
      </div>

      {/* ── Net worth (full width) ── */}
      {netWorthHistory.length > 0 ? (
        <Card className="mb-4">
          <div className="px-4 pt-3.5 pb-2 flex justify-between items-start">
            <div>
              <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#4b5563' }}>Net Worth</p>
              <p style={{ fontSize: 22, fontWeight: 600, color: '#f9fafb', letterSpacing: '-0.5px', fontVariantNumeric: 'tabular-nums', marginTop: 2 }}>
                ${currentNetWorth.toLocaleString()}
              </p>
              {monthOverMonthChange !== 0 && (
                <p style={{ fontSize: 12, fontWeight: 500, color: monthOverMonthChange > 0 ? '#27AE60' : '#f87171', marginTop: 2 }}>
                  {monthOverMonthChange > 0 ? '+' : ''}${monthOverMonthChange.toLocaleString()} this month
                </p>
              )}
            </div>
            <button onClick={() => setNetWorthModalOpen(true)} className="text-sm font-semibold text-white rounded-full px-4 py-2" style={{ background: '#27AE60' }}>
              + Update
            </button>
          </div>
          {netWorthMilestone && (
            <div className="mx-4 mb-2 rounded-full px-3 py-1.5 text-sm font-medium" style={{ background: 'rgba(39,174,96,0.12)', color: '#34d399' }}>
              {netWorthMilestone}
            </div>
          )}
          <div className="px-4 pb-4 h-32">
            <Line data={chartData} options={chartOptions} />
          </div>
        </Card>
      ) : (
        <div className="mb-4 flex items-center gap-3 px-3 py-2.5 rounded-[10px]" style={{ background: '#111827', border: '0.5px solid #1f2937' }}>
          <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#4b5563', fontWeight: 500 }}>Net Worth</span>
          <span style={{ fontSize: 12, color: '#374151' }}>·</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#f9fafb', fontVariantNumeric: 'tabular-nums' }}>$0</span>
          <button onClick={() => setNetWorthModalOpen(true)} className="ml-auto text-xs font-medium px-3 py-1 rounded-full"
                  style={{ background: 'rgba(39,174,96,0.12)', color: '#27AE60' }}>
            + Update this month
          </button>
        </div>
      )}

      <NetWorthModal open={netWorthModalOpen} onClose={() => setNetWorthModalOpen(false)} />
    </>
  );
}
