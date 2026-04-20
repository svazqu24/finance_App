import { useState, useMemo } from 'react';
import { useApp } from '../AppContext';
import StatCard from '../components/StatCard';
import BudgetBar from '../components/BudgetBar';
import SubscriptionModal from '../components/SubscriptionModal';
import SubscriptionEditModal from '../components/SubscriptionEditModal';
import { budgets } from '../data';
import {
  currentMonthAbbr, filterMonth, groupExpensesByCategory, fmtDollars, detectSubscriptions,
  getLastNMonthLabels,
} from '../utils';

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  );
}

// ── Auto-budget bottom sheet ───────────────────────────────────────────────────
function AutoBudgetModal({ open, onClose, suggestions, values, onChange, onApply, saving }) {
  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/60 transition-opacity duration-200"
        style={{ opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none' }}
        onClick={onClose}
      />
      <div
        className="fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ease-out bg-white dark:bg-nero-surface rounded-t-2xl max-w-[680px] mx-auto shadow-2xl border-t border-transparent dark:border-nero-border"
        style={{
          transform: open ? 'translateY(0)' : 'translateY(100%)',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div className="px-5 pt-4 pb-3 flex-shrink-0">
          <div className="w-10 h-1 bg-gray-200 dark:bg-nero-border rounded-full mx-auto mb-4" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[15px] font-semibold text-gray-900 dark:text-white">
                ✨ Auto-budget
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Based on your average spending over the last 3 months + 10% buffer
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable rows */}
        <div className="overflow-y-auto flex-1 px-5">
          {suggestions.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">
              No spending data yet — add transactions first.
            </p>
          ) : (
            <div className="flex flex-col gap-3 pb-3">
              {suggestions.map((s) => (
                <div key={s.cat} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{s.cat}</p>
                    <p className="text-[11px] text-gray-400">Avg spent: {fmtDollars(s.avg)}/mo</p>
                  </div>
                  <div className="relative w-28 flex-shrink-0">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">$</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={values[s.cat] ?? ''}
                      onChange={(e) => onChange(s.cat, e.target.value)}
                      className="w-full border border-gray-200 dark:border-nero-border rounded-xl pl-6 pr-3 py-2.5 text-sm bg-white dark:bg-nero-bg text-gray-900 dark:text-white outline-none focus:border-gray-400 dark:focus:border-nero-green transition-colors"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pt-3 pb-5 flex-shrink-0 border-t border-gray-100 dark:border-nero-border"
             style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom, 0px))' }}>
          <div className="flex gap-2.5">
            <button
              onClick={onApply}
              disabled={saving || suggestions.length === 0}
              className="flex-1 text-white text-sm font-medium py-3 rounded-[20px] transition-colors disabled:opacity-40"
              style={{ background: '#27AE60' }}
            >
              {saving ? 'Saving…' : 'Apply all budgets'}
            </button>
            <button
              onClick={onClose}
              className="flex-1 border border-gray-200 dark:border-nero-border text-sm font-medium py-3 rounded-[20px] text-gray-700 dark:text-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function Budget() {
  const {
    transactions, loading,
    budgetOverrides, saveBudgetLimit,
    openAddModal, openCsvModal,
    billsData, preferences,
  } = useApp();

  const [subModalOpen,       setSubModalOpen]       = useState(false);
  const [editSubModalOpen,   setEditSubModalOpen]   = useState(false);
  const [editingSubscription, setEditingSubscription] = useState(null);
  const [isEditingAutoDetected, setIsEditingAutoDetected] = useState(false);
  const [autoSubsOverrides,  setAutoSubsOverrides]  = useState({});
  const [historyMonths,      setHistoryMonths]      = useState(3);
  const [autoBudgetOpen,     setAutoBudgetOpen]     = useState(false);
  const [autoBudgetValues,   setAutoBudgetValues]   = useState({});
  const [autoBudgetSaving,   setAutoBudgetSaving]   = useState(false);

  function openEditSubscription(subscription, isAutoDetected = false) {
    setEditingSubscription(subscription);
    setIsEditingAutoDetected(isAutoDetected);
    setEditSubModalOpen(true);
  }

  function handleSaveSubscriptionEdits(updatedSub) {
    if (isEditingAutoDetected) {
      setAutoSubsOverrides((prev) => ({
        ...prev,
        [editingSubscription.name]: {
          name:      updatedSub.name,
          amt:       parseFloat(updatedSub.amount),
          frequency: updatedSub.frequency,
        },
      }));
    }
  }

  // ── Spending data ─────────────────────────────────────────────────────────
  const currMonthAbbr = currentMonthAbbr();

  const currExpenses = useMemo(
    () => groupExpensesByCategory(filterMonth(transactions, currMonthAbbr)),
    [transactions, currMonthAbbr]
  );

  // Income this month (positive transactions)
  const incomeThisMonth = useMemo(
    () => filterMonth(transactions, currMonthAbbr)
            .filter((t) => t.amt > 0)
            .reduce((s, t) => s + t.amt, 0),
    [transactions, currMonthAbbr]
  );

  // ── Budget bars (Transfer excluded) ──────────────────────────────────────
  const budgetMap = Object.fromEntries(budgets.map((b) => [b.cat, b.budget]));

  const missingBudgetCats = Object.keys(currExpenses).filter(
    (cat) => cat !== 'Transfer' && !budgetMap[cat]
  );

  const liveBudgets = useMemo(() => [
    ...budgets
      .filter((b) => b.cat !== 'Transfer')
      .map((b) => ({
        ...b,
        budget: budgetOverrides[b.cat] ?? b.budget,
        spent:  Math.round((currExpenses[b.cat] || 0) * 100) / 100,
      })),
    ...missingBudgetCats.map((cat) => ({
      cat,
      budget: budgetOverrides[cat] ?? 0,
      spent:  Math.round((currExpenses[cat] || 0) * 100) / 100,
    })),
  ], [budgetOverrides, currExpenses, missingBudgetCats]);

  const totalBudgeted = liveBudgets.reduce((s, b) => s + b.budget, 0);
  const totalSpent    = liveBudgets.reduce((s, b) => s + b.spent,  0);
  const remaining     = totalBudgeted - totalSpent;

  const overBudget = liveBudgets.filter((b) => b.spent > b.budget).length;
  const approaching = liveBudgets.filter((b) => {
    const pct = b.budget > 0 ? b.spent / b.budget : 0;
    return pct >= 0.85 && pct < 1;
  }).length;
  const onTrack = liveBudgets.length - overBudget - approaching;
  const hasTransactions = transactions.length > 0;

  // ── Auto-budget suggestions (avg last 3 months × 1.1) ────────────────────
  const autoBudgetSuggestions = useMemo(() => {
    const last3 = getLastNMonthLabels(3);
    const totals = {};
    for (const { abbr } of last3) {
      const exp = groupExpensesByCategory(filterMonth(transactions, abbr));
      for (const [cat, amt] of Object.entries(exp)) {
        if (cat === 'Transfer') continue;
        totals[cat] = (totals[cat] ?? 0) + amt;
      }
    }
    return Object.entries(totals)
      .map(([cat, total]) => ({ cat, avg: total / 3, suggested: Math.ceil((total / 3) * 1.1) }))
      .sort((a, b) => b.avg - a.avg);
  }, [transactions]);

  function openAutoBudget() {
    const vals = {};
    for (const s of autoBudgetSuggestions) vals[s.cat] = String(s.suggested);
    setAutoBudgetValues(vals);
    setAutoBudgetOpen(true);
  }

  async function applyAutoBudgets() {
    setAutoBudgetSaving(true);
    for (const [cat, valStr] of Object.entries(autoBudgetValues)) {
      const val = parseFloat(valStr);
      if (!isNaN(val) && val >= 0) await saveBudgetLimit(cat, val);
    }
    setAutoBudgetSaving(false);
    setAutoBudgetOpen(false);
  }

  // ── Upcoming bills (real data) ────────────────────────────────────────────
  const today = new Date();
  const thisMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

  const upcomingBills = useMemo(
    () => [...billsData]
            .filter((b) => b.paid_month !== thisMonthStr)
            .sort((a, b) => a.due_day - b.due_day)
            .slice(0, 5),
    [billsData, thisMonthStr]
  );

  // ── Subscriptions ─────────────────────────────────────────────────────────
  const rawAutoSubs = detectSubscriptions(transactions);
  const autoSubs = rawAutoSubs
    .filter((s) => !preferences.dismissedSubscriptions?.includes(s.name))
    .map((s) => autoSubsOverrides[s.name] ? { ...s, ...autoSubsOverrides[s.name] } : s);

  const manualSubs = billsData.filter((b) => b.is_subscription);

  const freqToMonthly = (s) => {
    if (s.frequency === 'weekly')   return s.amount * 4;
    if (s.frequency === 'biweekly') return s.amount * 2;
    if (s.frequency === 'yearly')   return s.amount / 12;
    return s.amount;
  };

  const autoMonthly = autoSubs.filter((s) => s.frequency === 'monthly').reduce((sum, s) => sum + s.amt, 0)
                    + autoSubs.filter((s) => s.frequency === 'weekly').reduce((sum, s) => sum + s.amt * 4, 0)
                    + autoSubs.filter((s) => s.frequency === 'biweekly').reduce((sum, s) => sum + s.amt * 2, 0);
  const manualMonthly = manualSubs.reduce((sum, s) => sum + freqToMonthly(s), 0);
  const totalMonthlySubCost = autoMonthly + manualMonthly;
  const hasAnySubs = autoSubs.length > 0 || manualSubs.length > 0;

  // ── Budget history ────────────────────────────────────────────────────────
  const monthLabels = getLastNMonthLabels(historyMonths);
  const monthTotals = new Array(historyMonths).fill(0);
  const allCats = new Set([...budgets.map((b) => b.cat), ...Object.keys(currExpenses)]);
  const budgetHistory = [];

  for (const cat of allCats) {
    if (cat === 'Transfer') continue;
    const months = [];
    for (let i = 0; i < historyMonths; i++) {
      const spent = groupExpensesByCategory(filterMonth(transactions, monthLabels[i].abbr))[cat] || 0;
      months.push({ spent });
      monthTotals[i] += spent;
    }
    if (months.some((m) => m.spent > 0)) budgetHistory.push({ cat, months });
  }
  budgetHistory.sort((a, b) => b.months[historyMonths - 1].spent - a.months[historyMonths - 1].spent);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Summary stat cards */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <StatCard label="budgeted"  value={fmtDollars(totalBudgeted)} sub="this month" />
        <StatCard label="spent"     value={fmtDollars(totalSpent)}    sub="this month" />
        <StatCard
          label="remaining"
          value={fmtDollars(Math.abs(remaining))}
          sub={remaining < 0 ? 'over budget' : 'in budget'}
          valueStyle={{ color: remaining < 0 ? '#f87171' : '#27AE60' }}
        />
      </div>

      {/* Status badges */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {onTrack > 0 && (
          <span className="text-xs font-medium px-2.5 py-[3px] rounded-full"
                style={{ color: '#27500A', background: '#C8EBB4' }}>
            {onTrack} on track
          </span>
        )}
        {approaching > 0 && (
          <span className="text-xs font-medium px-2.5 py-[3px] rounded-full"
                style={{ color: '#633806', background: '#F5DEB0' }}>
            {approaching} approaching
          </span>
        )}
        {overBudget > 0 && (
          <span className="text-xs font-medium px-2.5 py-[3px] rounded-full"
                style={{ color: '#991B1B', background: '#FEE2E2' }}>
            {overBudget} over budget
          </span>
        )}
      </div>

      {/* No-transactions hint */}
      {!loading && !hasTransactions && (
        <div className="text-center py-8 mb-5">
          <div
            className="w-10 h-10 flex items-center justify-center text-white font-semibold mx-auto mb-3"
            style={{ background: '#27AE60', borderRadius: '10px 3px 10px 3px', fontSize: 18 }}
          >
            N
          </div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Set your first budget limit</p>
          <p className="text-xs text-gray-400 mb-4 leading-relaxed max-w-[240px] mx-auto">
            Add transactions to see live spending vs. your budget limits.
          </p>
          <div className="flex gap-2 justify-center">
            <button onClick={openAddModal}
              className="text-xs font-medium px-3 py-2 rounded-[20px] text-white transition-colors"
              style={{ background: '#27AE60' }}>
              + Add transaction
            </button>
            <button onClick={openCsvModal}
              className="text-xs font-medium px-3 py-2 rounded-[20px] border border-gray-300 dark:border-nero-border text-gray-600 dark:text-gray-300 transition-colors">
              Import CSV
            </button>
          </div>
        </div>
      )}

      {/* Budget prompt for categories with no budget set */}
      {missingBudgetCats.length > 0 && (
        <div className="mb-5 rounded-xl px-4 py-3 bg-[#f5f5f3] dark:bg-nero-surface text-sm text-gray-800 dark:text-gray-200">
          You have spending in {missingBudgetCats.join(', ')} with no budget set yet.
        </div>
      )}

      {/* ── Budget limits header + auto-budget button ── */}
      <div className="flex items-center justify-between mb-1">
        <p className="text-[13px] font-medium text-gray-900 dark:text-white">Budget limits</p>
        <button
          onClick={openAutoBudget}
          className="text-xs font-medium px-2.5 py-1 rounded-[20px] border border-gray-200 dark:border-nero-border text-gray-600 dark:text-gray-300 hover:border-gray-400 transition-colors"
        >
          ✨ Auto-budget
        </button>
      </div>

      {/* Income context line */}
      {incomeThisMonth > 0 && (
        <p className="text-[11px] text-gray-400 mb-3">
          Based on {fmtDollars(incomeThisMonth)} income this month
        </p>
      )}

      {/* Budget progress bars */}
      {liveBudgets.map((b) => {
        const incomePct = incomeThisMonth > 0 ? Math.round((b.spent / incomeThisMonth) * 100) : null;
        return (
          <div key={b.cat}>
            <BudgetBar b={b} />
            {incomePct !== null && incomePct > 0 && (
              <p className="text-[10px] text-gray-400 mb-2 -mt-1 pl-0.5">
                {fmtDollars(b.spent)} = {incomePct}% of income
              </p>
            )}
          </div>
        );
      })}

      {/* Budget history */}
      {hasTransactions && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[13px] font-medium text-gray-900 dark:text-white">Budget history</p>
            <button
              onClick={() => setHistoryMonths(historyMonths === 3 ? 6 : 3)}
              className="text-xs font-medium px-2.5 py-1 rounded-[20px] border border-gray-300 dark:border-nero-border text-gray-600 dark:text-gray-300 hover:border-gray-400 transition-colors"
            >
              {historyMonths === 3 ? 'Show 6 months' : 'Show 3 months'}
            </button>
          </div>
          <div className="bg-[#f5f5f3] dark:bg-nero-surface rounded-xl p-4">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-nero-border">
                    <th className="text-left py-2 font-medium text-gray-700 dark:text-gray-300">Category</th>
                    {monthLabels.map((month) => (
                      <th key={month.abbr} className="text-center py-2 font-medium text-gray-700 dark:text-gray-300 min-w-[60px]">
                        {month.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {budgetHistory.map((row) => (
                    <tr key={row.cat} className="border-b border-gray-100 dark:border-nero-border/50">
                      <td className="py-2 text-gray-900 dark:text-white font-medium">{row.cat}</td>
                      {row.months.map((month, i) => {
                        const budget  = budgetMap[row.cat] || 0;
                        const isOver  = budget > 0 && month.spent > budget;
                        const isNear  = budget > 0 && month.spent > budget * 0.85 && month.spent <= budget;
                        return (
                          <td key={i} className="text-center py-2 tabular-nums"
                              style={{ color: isOver ? '#f87171' : isNear ? '#f59e0b' : '#27AE60' }}>
                            ${month.spent.toFixed(0)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  <tr>
                    <td className="py-3 text-gray-900 dark:text-white font-semibold">Total spending</td>
                    {monthTotals.map((total, i) => (
                      <td key={i} className="text-center py-3 tabular-nums font-semibold text-gray-900 dark:text-white">
                        ${total.toFixed(0)}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Upcoming bills (real data) ── */}
      <p className="text-[13px] font-medium mt-6 mb-2.5 text-gray-900 dark:text-white">
        Upcoming bills
      </p>
      {upcomingBills.length === 0 ? (
        <p className="text-xs text-gray-400 leading-relaxed">
          No bills added yet — add them in the Bills tab.
        </p>
      ) : (
        <div className="flex flex-col">
          {upcomingBills.map((b) => (
            <div
              key={b.id}
              className="flex items-center gap-2.5 py-2.5 border-b border-gray-100 dark:border-nero-border last:border-0 transition-colors"
            >
              <div
                className="w-8 h-8 flex items-center justify-center flex-shrink-0 text-[11px] font-semibold text-white"
                style={{ background: '#27AE60', borderRadius: '8px 2px 8px 2px' }}
              >
                {(b.cat || 'B').slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate leading-tight">
                  {b.name}
                </p>
                <p className="text-xs text-gray-400">Due the {b.due_day}{ordinal(b.due_day)}</p>
              </div>
              <p className="text-sm font-semibold tabular-nums text-gray-900 dark:text-white flex-shrink-0">
                {fmtDollars(b.amount)}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ── Subscriptions ── */}
      <div className="flex items-center justify-between mt-6 mb-2.5">
        <div className="flex items-center gap-2">
          <p className="text-[13px] font-medium text-gray-900 dark:text-white">
            Detected subscriptions
          </p>
          {hasAnySubs && (
            <span className="text-[11px] text-gray-400">
              ~{fmtDollars(totalMonthlySubCost)}/mo
            </span>
          )}
        </div>
        <button
          onClick={() => setSubModalOpen(true)}
          className="text-xs font-medium px-2.5 py-1 rounded-[20px] text-white transition-colors"
          style={{ background: '#27AE60' }}
        >
          + Add
        </button>
      </div>

      {hasAnySubs ? (
        <div className="flex flex-col gap-2">
          {autoSubs.map((s) => (
            <div
              key={s.name}
              onClick={() => openEditSubscription(s, true)}
              className="group flex items-center justify-between px-3 py-2.5 rounded-xl bg-[#f5f5f3] dark:bg-nero-surface transition-colors cursor-pointer hover:bg-gray-100 dark:hover:bg-nero-border"
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-[13px] font-medium text-gray-900 dark:text-white leading-tight">
                    {s.name}
                  </p>
                  {s.possibleCancelled && (
                    <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                          style={{ background: '#FEF3C7', color: '#92400E' }}>
                      possibly cancelled
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-400 mt-0.5 capitalize">
                  {s.frequency} · last {s.lastCharged}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-semibold tabular-nums text-gray-900 dark:text-white">
                  {fmtDollars(s.amt)}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); openEditSubscription(s, true); }}
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-all"
                  aria-label="Edit"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); openEditSubscription(s, true); }}
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-400 transition-all"
                  aria-label="Dismiss"
                >
                  <TrashIcon />
                </button>
              </div>
            </div>
          ))}

          {manualSubs.map((s) => (
            <div
              key={s.id}
              onClick={() => openEditSubscription(s, false)}
              className="group flex items-center justify-between px-3 py-2.5 rounded-xl bg-[#f5f5f3] dark:bg-nero-surface transition-colors cursor-pointer hover:bg-gray-100 dark:hover:bg-nero-border"
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-[13px] font-medium text-gray-900 dark:text-white leading-tight">{s.name}</p>
                  <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                        style={{ background: '#C8EBB4', color: '#27500A' }}>
                    manual
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 mt-0.5 capitalize">
                  {s.frequency ?? 'monthly'}
                  {s.next_due_date && ` · due ${new Date(s.next_due_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-semibold tabular-nums text-gray-900 dark:text-white">
                  {fmtDollars(s.amount)}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); openEditSubscription(s, false); }}
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-all"
                  aria-label="Edit"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); openEditSubscription(s, false); }}
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-400 transition-all"
                  aria-label="Delete"
                >
                  <TrashIcon />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-400 leading-relaxed">
          Recurring charges with 3+ consistent payments will appear here automatically.
        </p>
      )}

      <SubscriptionModal open={subModalOpen} onClose={() => setSubModalOpen(false)} />
      <SubscriptionEditModal
        open={editSubModalOpen}
        onClose={() => setEditSubModalOpen(false)}
        subscription={editingSubscription}
        isAutoDetected={isEditingAutoDetected}
        onSave={handleSaveSubscriptionEdits}
      />
      <AutoBudgetModal
        open={autoBudgetOpen}
        onClose={() => setAutoBudgetOpen(false)}
        suggestions={autoBudgetSuggestions}
        values={autoBudgetValues}
        onChange={(cat, val) => setAutoBudgetValues((prev) => ({ ...prev, [cat]: val }))}
        onApply={applyAutoBudgets}
        saving={autoBudgetSaving}
      />
    </>
  );
}

// ── Tiny helper for ordinal suffixes ─────────────────────────────────────────
function ordinal(n) {
  const s = ['th','st','nd','rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}
