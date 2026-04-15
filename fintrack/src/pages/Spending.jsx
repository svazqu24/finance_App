import { Doughnut, Bar } from 'react-chartjs-2';
import { useApp } from '../AppContext';
import { catClr } from '../data';
import {
  currentMonthAbbr, prevMonthAbbr,
  filterMonth, groupExpensesByCategory, getLastNMonthLabels,
} from '../utils';

// ── Chart options (static) ────────────────────────────────────────────────────
const donutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '65%',
  plugins: { legend: { display: false } },
};

const barOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: '#888', font: { size: 11 } },
    },
    y: {
      grid: { color: 'rgba(128,128,128,.15)' },
      ticks: {
        color: '#888',
        font: { size: 11 },
        callback: (v) => '$' + v.toLocaleString(),
      },
    },
  },
};

// ── Dynamic insight text ──────────────────────────────────────────────────────
// currExpenses and prevExpenses already have Transfer excluded.
function buildInsight(currExpenses, prevExpenses, income, monthLabel) {
  const currTotal = Object.values(currExpenses).reduce((a, b) => a + b, 0);
  if (currTotal === 0 && income === 0) return `No activity recorded in ${monthLabel} yet.`;
  if (currTotal === 0) return `No expenses recorded in ${monthLabel} yet.`;

  const sorted = Object.entries(currExpenses).sort((a, b) => b[1] - a[1]);
  const [topCat, topAmt] = sorted[0];
  const topPct = Math.round((topAmt / currTotal) * 100);
  const savedPct = income > 0 ? Math.round(((income - currTotal) / income) * 100) : null;

  // Spending exceeded income
  if (income > 0 && currTotal > income) {
    return `You spent more than you earned this month. Your top real expense was ${topCat} at ${topPct}%.`;
  }

  // Great savings month (≥20%)
  if (savedPct !== null && savedPct >= 20) {
    let text = `Great month! You saved ${savedPct}% of your income.`;
    const prevAmt = prevExpenses[topCat] || 0;
    if (prevAmt > 0) {
      const change = Math.round(((topAmt - prevAmt) / prevAmt) * 100);
      if (Math.abs(change) >= 5) {
        text += ` ${topCat} is ${change > 0 ? 'up' : 'down'} ${Math.abs(change)}% vs last month.`;
      }
    }
    return text;
  }

  // Low savings nudge (<10%)
  if (savedPct !== null && savedPct < 10) {
    return `You saved ${Math.max(0, savedPct)}% this month. Small wins add up! Your top expense was ${topCat} at ${topPct}%.`;
  }

  // Default: top category + MoM change + second category
  let text = `${topCat} is your largest expense at ${topPct}% of ${monthLabel} spending.`;
  const prevAmt = prevExpenses[topCat] || 0;
  if (prevAmt > 0) {
    const changeAmt = Math.round(topAmt - prevAmt);
    if (Math.abs(changeAmt) >= 10) {
      text += ` ${topCat} is ${changeAmt > 0 ? 'up' : 'down'} $${Math.abs(changeAmt)} vs last month.`;
    }
  }
  if (sorted.length > 1) {
    const secondCat = sorted[1][0];
    const secondPct = Math.round((sorted[1][1] / currTotal) * 100);
    text += ` ${secondCat} follows at ${secondPct}%.`;
  }
  return text;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function Spending() {
  const { transactions, loading, openAddModal, openCsvModal } = useApp();

  const currAbbr   = currentMonthAbbr();
  const prevAbbr   = prevMonthAbbr();
  const monthLabel = new Date().toLocaleDateString('en-US', { month: 'long' });

  // Exclude Transfer from all spending views
  const currMonthTxns = filterMonth(transactions, currAbbr).filter((t) => t.cat !== 'Transfer');
  const prevMonthTxns = filterMonth(transactions, prevAbbr).filter((t) => t.cat !== 'Transfer');
  const currExpenses  = groupExpensesByCategory(currMonthTxns);
  const prevExpenses  = groupExpensesByCategory(prevMonthTxns);

  // Income is all positive transactions this month (includes transfers in — correct)
  const income = filterMonth(transactions, currAbbr)
    .filter((t) => t.amt > 0)
    .reduce((s, t) => s + t.amt, 0);

  const spendCats = Object.entries(currExpenses)
    .sort((a, b) => b[1] - a[1])
    .map(([label, amt]) => ({ label, amt, clr: catClr[label] || '#888780' }));

  // Last 6 months for bar chart — exclude Transfer, show "Mon YY" labels
  const last6      = getLastNMonthLabels(6);
  const barAmounts = last6.map(({ abbr }) =>
    Math.round(
      filterMonth(transactions, abbr)
        .filter((t) => t.amt < 0 && t.cat !== 'Transfer')
        .reduce((s, t) => s + Math.abs(t.amt), 0)
    )
  );

  const donutData = {
    labels: spendCats.map((s) => s.label),
    datasets: [{
      data:            spendCats.map((s) => s.amt),
      backgroundColor: spendCats.map((s) => s.clr),
      borderWidth: 0,
    }],
  };

  const barData = {
    labels: last6.map((m) => m.label),   // "Nov 24", "Dec 24", "Jan 25" …
    datasets: [{
      data:            barAmounts,
      backgroundColor: 'rgba(24,95,165,.7)',
      borderRadius:    3,
    }],
  };

  const insight = buildInsight(currExpenses, prevExpenses, income, monthLabel);
  const hasAnyTransactions = transactions.length > 0;

  if (!loading && !hasAnyTransactions) {
    return (
      <div className="text-center py-12">
        <div
          className="w-12 h-12 flex items-center justify-center text-white font-semibold text-xl mx-auto mb-4"
          style={{ background: '#27AE60', borderRadius: '10px 3px 10px 3px', fontFamily: 'Geist, system-ui, sans-serif' }}
        >
          N
        </div>
        <p className="text-[15px] font-semibold text-gray-900 dark:text-white mb-1.5">Add transactions to see your breakdown</p>
        <p className="text-sm text-gray-400 mb-6 leading-relaxed max-w-[260px] mx-auto">
          Your spending by category will appear here once you have transactions.
        </p>
        <div className="flex gap-2.5 justify-center flex-wrap">
          <button onClick={openAddModal}
            className="text-sm font-medium px-4 py-2.5 rounded-[20px] text-white transition-colors" style={{ background: '#27AE60' }}>
            + Add transaction
          </button>
          <button onClick={openCsvModal}
            className="text-sm font-medium px-4 py-2.5 rounded-[20px] border border-gray-300 dark:border-nero-border text-gray-600 dark:text-gray-300 hover:border-gray-400 transition-colors">
            Import CSV
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Donut + legend */}
      <div className="grid gap-5 mb-6" style={{ gridTemplateColumns: '160px 1fr' }}>
        <div>
          <p className="text-xs text-gray-400 mb-1.5">By category</p>
          {spendCats.length > 0 ? (
            <div className="relative h-40">
              <Doughnut data={donutData} options={donutOptions} />
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center">
              <p className="text-xs text-gray-400 text-center leading-relaxed">
                No spending<br />this month yet
              </p>
            </div>
          )}
        </div>

        <div className="mt-5">
          {spendCats.length > 0 ? (
            spendCats.map((s) => (
              <div
                key={s.label}
                className="flex justify-between items-center py-[5px] border-b border-gray-200 dark:border-nero-border transition-colors"
              >
                <span className="flex items-center gap-1.5 text-xs text-gray-900 dark:text-white">
                  <span className="w-2 h-2 rounded-[2px] inline-block" style={{ background: s.clr }} />
                  {s.label}
                </span>
                <span className="text-xs tabular-nums text-gray-400">
                  ${s.amt.toFixed(2)}
                </span>
              </div>
            ))
          ) : (
            <p className="text-xs text-gray-400 mt-2 leading-relaxed">
              Expenses you record will appear here.
            </p>
          )}
        </div>
      </div>

      {/* Monthly bar chart */}
      <p className="text-xs text-gray-400 mb-2">Monthly spending</p>
      <div className="relative h-[140px] mb-4">
        <Bar data={barData} options={barOptions} />
      </div>

      {/* Dynamic insight */}
      <div className="bg-[#f5f5f3] dark:bg-nero-surface rounded-lg p-3.5 transition-colors">
        <p className="text-[11px] uppercase tracking-[.08em] text-gray-400 m-0 mb-1.5">
          {monthLabel} insight
        </p>
        <p className="text-sm m-0 leading-relaxed text-gray-900 dark:text-white">
          {insight}
        </p>
      </div>
    </>
  );
}
