import { useApp } from '../AppContext';
import StatCard from '../components/StatCard';
import BudgetBar from '../components/BudgetBar';
import BillRow from '../components/BillRow';
import { budgets, bills } from '../data';
import {
  currentMonthAbbr, filterMonth, groupExpensesByCategory, fmtDollars, detectSubscriptions,
} from '../utils';

export default function Budget() {
  const { transactions, loading, budgetOverrides, openAddModal, openCsvModal } = useApp();

  // Compute this month's spending per category from real transactions
  const currExpenses = groupExpensesByCategory(
    filterMonth(transactions, currentMonthAbbr())
  );

  // Merge hardcoded budget limits with user overrides + live spent amounts
  const liveBudgets = budgets.map((b) => ({
    ...b,
    budget: budgetOverrides[b.cat] ?? b.budget,
    spent:  Math.round((currExpenses[b.cat] || 0) * 100) / 100,
  }));

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

  // Subscription detector
  const subs = detectSubscriptions(transactions);
  const monthlySubTotal = subs
    .filter((s) => s.frequency === 'monthly')
    .reduce((sum, s) => sum + s.amt, 0);
  const weeklySubTotal = subs
    .filter((s) => s.frequency === 'weekly')
    .reduce((sum, s) => sum + s.amt * 4, 0);
  const biweeklySubTotal = subs
    .filter((s) => s.frequency === 'biweekly')
    .reduce((sum, s) => sum + s.amt * 2, 0);
  const totalMonthlySubCost = monthlySubTotal + weeklySubTotal + biweeklySubTotal;

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
          valueStyle={{ color: remaining < 0 ? '#E24B4A' : '#3B6D11' }}
        />
      </div>

      {/* Status badges — only render badges with count > 0 */}
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
                style={{ color: '#791F1F', background: '#F7C1C1' }}>
            {overBudget} over budget
          </span>
        )}
      </div>

      {/* No-transactions hint */}
      {!loading && !hasTransactions && (
        <div className="bg-[#f5f5f3] dark:bg-gray-800 rounded-xl px-4 py-3.5 mb-5 flex items-center justify-between gap-3 transition-colors">
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed m-0">
            No transactions yet. Add one or import a CSV to track spending against these limits.
          </p>
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={openAddModal}
              className="text-xs font-medium px-2.5 py-1.5 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 whitespace-nowrap transition-colors">
              + Add
            </button>
            <button onClick={openCsvModal}
              className="text-xs font-medium px-2.5 py-1.5 rounded-full border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 whitespace-nowrap transition-colors">
              Import
            </button>
          </div>
        </div>
      )}

      {/* Budget progress bars with live spent amounts */}
      {liveBudgets.map((b) => (
        <BudgetBar key={b.cat} b={b} />
      ))}

      <p className="text-[13px] font-medium mt-6 mb-2.5 text-gray-900 dark:text-white">
        Upcoming bills
      </p>
      {bills.map((b) => (
        <BillRow key={b.name} b={b} />
      ))}

      {/* Subscription detector */}
      {subs.length > 0 && (
        <>
          <div className="flex items-center justify-between mt-6 mb-2.5">
            <p className="text-[13px] font-medium text-gray-900 dark:text-white">
              Detected subscriptions
            </p>
            <span className="text-[11px] text-gray-400">
              ~{fmtDollars(totalMonthlySubCost)}/mo
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {subs.map((s) => (
              <div
                key={s.name}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-[#f5f5f3] dark:bg-gray-800 transition-colors"
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
                <span className="text-[13px] font-semibold tabular-nums text-gray-900 dark:text-white">
                  {fmtDollars(s.amt)}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
