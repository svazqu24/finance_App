import { useState } from 'react';
import { useApp } from '../AppContext';
import StatCard from '../components/StatCard';
import BudgetBar from '../components/BudgetBar';
import BillRow from '../components/BillRow';
import SubscriptionModal from '../components/SubscriptionModal';
import SubscriptionEditModal from '../components/SubscriptionEditModal';
import { budgets, bills } from '../data';
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

function PencilIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

export default function Budget() {
  const {
    transactions, loading,
    budgetOverrides, openAddModal, openCsvModal,
    billsData, deleteBill, preferences,
  } = useApp();

  const [subModalOpen, setSubModalOpen] = useState(false);
  const [editSubModalOpen, setEditSubModalOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState(null);
  const [isEditingAutoDetected, setIsEditingAutoDetected] = useState(false);
  const [autoSubsOverrides, setAutoSubsOverrides] = useState({}); // { name: { name, amt, frequency } }
  const [historyMonths, setHistoryMonths] = useState(3);

  function openEditSubscription(subscription, isAutoDetected = false) {
    setEditingSubscription(subscription);
    setIsEditingAutoDetected(isAutoDetected);
    setEditSubModalOpen(true);
  }

  function handleSaveSubscriptionEdits(updatedSub) {
    if (isEditingAutoDetected) {
      // Save to in-memory overrides
      setAutoSubsOverrides((prev) => ({
        ...prev,
        [editingSubscription.name]: {
          name: updatedSub.name,
          amt: parseFloat(updatedSub.amount),
          frequency: updatedSub.frequency,
        },
      }));
    }
    // Manual subscriptions are saved by the modal itself
  }

  // Compute this month's spending per category from real transactions
  const currExpenses = groupExpensesByCategory(
    filterMonth(transactions, currentMonthAbbr())
  );

  const budgetMap = Object.fromEntries(budgets.map((b) => [b.cat, b.budget]));
  const missingBudgetCats = Object.keys(currExpenses)
    .filter((cat) => cat !== 'Transfer' && !budgetMap[cat]);

  // Merge hardcoded budget limits with user overrides + live spent amounts
  const liveBudgets = [
    ...budgets.map((b) => ({
      ...b,
      budget: budgetOverrides[b.cat] ?? b.budget,
      spent:  Math.round((currExpenses[b.cat] || 0) * 100) / 100,
    })),
    ...missingBudgetCats.map((cat) => ({
      cat,
      budget: budgetOverrides[cat] ?? 0,
      spent: Math.round((currExpenses[cat] || 0) * 100) / 100,
    })),
  ];

  // Summary totals
  const totalBudgeted = budgets.reduce((s, b) => s + b.budget, 0);
  const totalSpent    = liveBudgets.reduce((s, b) => s + b.spent, 0);
  const remaining     = totalBudgeted - totalSpent;

  // Status badge counts
  const overBudget = liveBudgets.filter((b) => b.spent > b.budget).length;
  const approaching = liveBudgets.filter((b) => {
    const pct = b.budget > 0 ? b.spent / b.budget : 0;
    return pct >= 0.85 && pct < 1;
  }).length;
  const onTrack = liveBudgets.length - overBudget - approaching;
  const hasTransactions = transactions.length > 0;

  // Auto-detected subscriptions (filter out dismissed, apply overrides)
  const rawAutoSubs = detectSubscriptions(transactions);
  const autoSubs = rawAutoSubs
    .filter((s) => !preferences.dismissedSubscriptions?.includes(s.name))
    .map((s) => autoSubsOverrides[s.name] ? { ...s, ...autoSubsOverrides[s.name] } : s);

  // Manual subscriptions from bills table
  const manualSubs = billsData.filter((b) => b.is_subscription);

  // Monthly cost estimate
  const freqToMonthly = (s) => {
    if (s.frequency === 'weekly')   return s.amount * 4;
    if (s.frequency === 'biweekly') return s.amount * 2;
    if (s.frequency === 'yearly')   return s.amount / 12;
    return s.amount; // monthly
  };

  const autoMonthly   = autoSubs.filter((s) => s.frequency === 'monthly').reduce((sum, s) => sum + s.amt, 0)
                      + autoSubs.filter((s) => s.frequency === 'weekly').reduce((sum, s) => sum + s.amt * 4, 0)
                      + autoSubs.filter((s) => s.frequency === 'biweekly').reduce((sum, s) => sum + s.amt * 2, 0);
  const manualMonthly = manualSubs.reduce((sum, s) => sum + freqToMonthly(s), 0);
  const totalMonthlySubCost = autoMonthly + manualMonthly;

  const hasAnySubs = autoSubs.length > 0 || manualSubs.length > 0;

  // Budget history calculation
  const monthLabels = getLastNMonthLabels(historyMonths);
  const budgetHistory = [];
  const monthTotals = new Array(historyMonths).fill(0);

  // Get all categories that have budgets or have had spending
  const allCats = new Set([...budgets.map(b => b.cat), ...Object.keys(currExpenses)]);
  
  for (const cat of allCats) {
    if (cat === 'Transfer') continue;
    const months = [];
    for (let i = 0; i < historyMonths; i++) {
      const monthTxns = filterMonth(transactions, monthLabels[i].abbr);
      const spent = groupExpensesByCategory(monthTxns)[cat] || 0;
      months.push({ spent });
      monthTotals[i] += spent;
    }
    // Only include categories with spending in at least one month
    if (months.some((m) => m.spent > 0)) {
      budgetHistory.push({ cat, months });
    }
  }

  // Sort by current month spending (descending)
  budgetHistory.sort((a, b) => b.months[historyMonths - 1].spent - a.months[historyMonths - 1].spent);

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
            style={{ background: '#27AE60', borderRadius: '10px 3px 10px 3px', fontFamily: 'Geist, system-ui, sans-serif', fontSize: 18 }}
          >
            N
          </div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Set your first budget limit</p>
          <p className="text-xs text-gray-400 mb-4 leading-relaxed max-w-[240px] mx-auto">
            Add transactions to see live spending vs. your budget limits.
          </p>
          <div className="flex gap-2 justify-center">
            <button onClick={openAddModal}
              className="text-xs font-medium px-3 py-2 rounded-[20px] text-white transition-colors" style={{ background: '#27AE60' }}>
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
          You have spending in {missingBudgetCats.join(', ')} with no budget set yet. Set a target to track these categories.
        </div>
      )}

      {/* Budget progress bars */}
      {liveBudgets.map((b) => (
        <BudgetBar key={b.cat} b={b} />
      ))}

      {/* Budget history */}
      {hasTransactions && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[13px] font-medium text-gray-900 dark:text-white">
              Budget history
            </p>
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
                        const budget = budgetMap[row.cat] || 0;
                        const isOver = budget > 0 && month.spent > budget;
                        const isNear = budget > 0 && month.spent > budget * 0.85 && month.spent <= budget;
                        return (
                          <td key={i} className="text-center py-2 tabular-nums" style={{ color: isOver ? '#f87171' : isNear ? '#f59e0b' : '#27AE60' }}>
                            ${month.spent.toFixed(0)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  {/* Summary row */}
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

      <p className="text-[13px] font-medium mt-6 mb-2.5 text-gray-900 dark:text-white">
        Upcoming bills
      </p>
      {bills.map((b) => (
        <BillRow key={b.name} b={b} />
      ))}

      {/* Subscriptions section — auto-detected + manual */}
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
          {/* Auto-detected */}
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
                {/* Edit icon */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openEditSubscription(s, true);
                  }}
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-all"
                  aria-label="Edit subscription"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
                {/* Dismiss icon */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // This will be handled by the edit modal
                    openEditSubscription(s, true);
                  }}
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-400 transition-all"
                  aria-label="Dismiss subscription"
                >
                  <TrashIcon />
                </button>
              </div>
            </div>
          ))}

          {/* Manual subscriptions */}
          {manualSubs.map((s) => (
            <div
              key={s.id}
              onClick={() => openEditSubscription(s, false)}
              className="group flex items-center justify-between px-3 py-2.5 rounded-xl bg-[#f5f5f3] dark:bg-nero-surface transition-colors cursor-pointer hover:bg-gray-100 dark:hover:bg-nero-border"
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-[13px] font-medium text-gray-900 dark:text-white leading-tight">
                    {s.name}
                  </p>
                  <span
                    className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                    style={{ background: '#C8EBB4', color: '#27500A' }}
                  >
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
                {/* Edit icon */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openEditSubscription(s, false);
                  }}
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-all"
                  aria-label="Edit subscription"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
                {/* Delete icon */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openEditSubscription(s, false);
                  }}
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-400 transition-all"
                  aria-label="Delete subscription"
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
    </>
  );
}
