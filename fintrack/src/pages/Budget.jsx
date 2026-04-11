import { useApp } from '../AppContext';
import StatCard from '../components/StatCard';
import BudgetBar from '../components/BudgetBar';
import BillRow from '../components/BillRow';
import { budgets, bills } from '../data';
import {
  currentMonthAbbr, filterMonth, groupExpensesByCategory, fmtDollars,
} from '../utils';

export default function Budget() {
  const { transactions, budgetOverrides } = useApp();

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
    </>
  );
}
