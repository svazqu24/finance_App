import { useState, useMemo } from 'react';
import { useApp } from '../AppContext';
import { filterMonth, currentMonthAbbr } from '../utils';
import SankeyChart from '../components/SankeyChart';

const ABBRS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const FULL_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const CAT_COLOR = {
  Dining: '#f97316', Shopping: '#a78bfa', Groceries: '#34d399',
  Transport: '#60a5fa', Health: '#f472b6', Subscriptions: '#818cf8',
  Utilities: '#2dd4bf', Housing: '#fbbf24', Insurance: '#60a5fa',
  Travel: '#38bdf8', Entertainment: '#e879f9', Other: '#9ca3af',
};

// ── Icons ─────────────────────────────────────────────────────────────────
function ChevLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function ChevRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function StatCard({ label, value, color = '#27AE60', trend = null }) {
  return (
    <div
      className="rounded-xl px-4 py-3.5 flex-1"
      style={{
        background: '#111827',
        border: '0.5px solid #1f2937',
      }}
    >
      <p className="text-[10px] uppercase tracking-[0.1em] text-[#4b5563] mb-0.5">{label}</p>
      <div className="flex items-baseline gap-2">
        <p className="text-2xl font-bold" style={{ color }}>{value}</p>
        {trend && (
          <p className={`text-xs ${trend > 0 ? 'text-red-400' : 'text-green-400'}`}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(0)}%
          </p>
        )}
      </div>
    </div>
  );
}

function InsightCard({ text }) {
  return (
    <div
      className="rounded-xl px-4 py-3 flex gap-3 items-start"
      style={{
        background: '#111827',
        border: `0.5px solid #1f2937`,
        borderLeft: `3px solid #27AE60`,
      }}
    >
      <p className="text-[13px] leading-relaxed text-[#9ca3af]">{text}</p>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export default function Reports() {
  const { transactions, loading, budgetOverrides } = useApp();

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [activeTab, setActiveTab] = useState('cashflow');

  const viewAbbr = ABBRS[viewMonth];
  const isCurrentMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth();

  function goPrev() {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function goNext() {
    if (isCurrentMonth) return;
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  // ── Filter transactions ───────────────────────────────────────────────
  const viewTxns = useMemo(
    () => filterMonth(transactions, viewAbbr).filter((t) => t.cat !== 'Transfer'),
    [transactions, viewAbbr]
  );

  // ── Calculate totals ─────────────────────────────────────────────────
  const income = useMemo(
    () => viewTxns.filter((t) => t.amt > 0).reduce((s, t) => s + t.amt, 0),
    [viewTxns]
  );

  const expenses = useMemo(
    () => viewTxns.filter((t) => t.amt < 0).reduce((s, t) => s + Math.abs(t.amt), 0),
    [viewTxns]
  );

  const netCashFlow = income - expenses;

  const savingsRate = income > 0 ? ((netCashFlow / income) * 100).toFixed(1) : 0;

  // ── Build Sankey data ────────────────────────────────────────────────
  const { nodes: sankeyNodes, links: sankeyLinks } = useMemo(() => {
    // Group spending by category (excluding Transfer)
    const spendingByCategory = {};
    for (const t of viewTxns) {
      if (t.cat !== 'Transfer' && t.amt < 0) {
        spendingByCategory[t.cat] = (spendingByCategory[t.cat] || 0) + Math.abs(t.amt);
      }
    }

    // Build nodes: [Income Source] -> [Total Income] -> [Spending Categories]
    const nodes = [
      { name: 'Payroll / Income' },
      { name: 'Total Income' },
      ...Object.keys(spendingByCategory).map((cat) => ({ name: cat })),
    ];

    // Build links
    const links = [];

    // Income source -> Total Income
    if (income > 0) {
      links.push({
        source: 0,
        target: 1,
        value: income,
      });
    }

    // Total Income -> Spending categories
    let categoryIndex = 2;
    for (const [cat, amount] of Object.entries(spendingByCategory)) {
      links.push({
        source: 1,
        target: categoryIndex,
        value: amount,
      });
      categoryIndex++;
    }

    return { nodes, links };
  }, [viewTxns, income]);

  // ── Insights ─────────────────────────────────────────────────────────
  const insight = useMemo(() => {
    if (income === 0) return 'No income recorded this month.';
    if (expenses === 0) return 'Great job! No expenses this month.';

    if (savingsRate >= 50) {
      return `Excellent savings rate of ${savingsRate}%! You\'re saving more than you spend.`;
    } else if (savingsRate >= 20) {
      return `Good savings rate of ${savingsRate}%. Keep building your emergency fund.`;
    } else if (savingsRate >= 0) {
      return `Savings rate of ${savingsRate}%. Consider adjusting your spending to increase savings.`;
    } else {
      return `You\'re spending ${Math.abs(savingsRate).toFixed(1)}% more than your income. Review your budget.`;
    }
  }, [income, expenses, savingsRate]);

  const isEmpty = viewTxns.length === 0;

  return (
    <div className="min-h-screen transition-colors" style={{ background: '#0a0e1a', color: '#f9fafb' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b" style={{ borderColor: '#1f2937' }}>
        <h1 className="text-2xl font-bold">Reports</h1>
      </div>

      {/* Month Selector */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b" style={{ borderColor: '#1f2937' }}>
        <button
          onClick={goPrev}
          className="p-2 hover:opacity-80 transition-opacity text-[#9ca3af]"
        >
          <ChevLeft />
        </button>
        <h2 className="text-lg font-semibold">{FULL_MONTHS[viewMonth]} {viewYear}</h2>
        <button
          onClick={goNext}
          disabled={isCurrentMonth}
          className={`p-2 transition-opacity ${
            isCurrentMonth ? 'opacity-40 cursor-not-allowed' : 'hover:opacity-80'
          } text-[#9ca3af]`}
        >
          <ChevRight />
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-4 sm:px-6 py-4">
        <StatCard label="Total Income" value={`$${income.toLocaleString('en-US', { maximumFractionDigits: 0 })}`} color="#34d399" />
        <StatCard label="Total Expenses" value={`$${expenses.toLocaleString('en-US', { maximumFractionDigits: 0 })}`} color="#ef4444" />
        <StatCard
          label="Net Cash Flow"
          value={`$${Math.abs(netCashFlow).toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
          color={netCashFlow >= 0 ? '#34d399' : '#ef4444'}
        />
        <StatCard label="Savings Rate" value={`${savingsRate}%`} color={savingsRate >= 0 ? '#34d399' : '#ef4444'} />
      </div>

      {/* Tab Row */}
      <div className="flex gap-4 px-4 sm:px-6 py-4 border-b" style={{ borderColor: '#1f2937' }}>
        {['cashflow', 'income', 'expenses'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`text-sm font-medium pb-2 border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-[#27AE60] text-[#27AE60]'
                : 'border-transparent text-[#6b7280] hover:text-[#9ca3af]'
            }`}
          >
            {tab === 'cashflow' ? 'Cash Flow' : tab === 'income' ? 'Income' : 'Expenses'}
          </button>
        ))}
      </div>

      {/* Chart Section */}
      <div className="px-4 sm:px-6 py-6">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-4xl mb-4">📊</p>
            <p className="text-[#9ca3af]">No transactions for this month — import a CSV to see your cash flow</p>
          </div>
        ) : (
          <>
            {activeTab === 'cashflow' && (
              <div className="bg-[#111827] rounded-xl border" style={{ borderColor: '#1f2937' }}>
                <SankeyChart nodes={sankeyNodes} links={sankeyLinks} width={1000} height={420} />
              </div>
            )}

            {activeTab === 'income' && (
              <div className="bg-[#111827] rounded-xl p-6 border" style={{ borderColor: '#1f2937' }}>
                <p className="text-[#9ca3af]">Income breakdown coming soon</p>
              </div>
            )}

            {activeTab === 'expenses' && (
              <div className="bg-[#111827] rounded-xl p-6 border" style={{ borderColor: '#1f2937' }}>
                <p className="text-[#9ca3af]">Expense breakdown coming soon</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Insight Card */}
      {!isEmpty && (
        <div className="px-4 sm:px-6 pb-6">
          <InsightCard text={insight} />
        </div>
      )}
    </div>
  );
}
