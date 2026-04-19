import { useState, useMemo } from 'react';
import { Doughnut, Bar } from 'react-chartjs-2';
import { useApp } from '../AppContext';
import { catClr } from '../data';
import { filterMonth, groupExpensesByCategory } from '../utils';
import { sendNotification } from '../NotificationContext';

// ── Constants ─────────────────────────────────────────────────────────────────
const ABBRS       = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const FULL_MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const CAT_CLR_DEF = '#888780';

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n) =>
  '$' + Math.abs(Number(n)).toLocaleString('en-US', { maximumFractionDigits: 0 });

function getMonthsEndingAt(year, month, n) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(year, month - (n - 1 - i), 1);
    return {
      abbr:  ABBRS[d.getMonth()],
      label: ABBRS[d.getMonth()] + ' ' + String(d.getFullYear()).slice(2),
    };
  });
}

// ── Tiny icons ────────────────────────────────────────────────────────────────
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

// ── Sub-components ────────────────────────────────────────────────────────────
function MerchantAvatar({ name, cat }) {
  const bg = catClr[cat] ?? CAT_CLR_DEF;
  return (
    <div
      className="w-9 h-9 flex items-center justify-center flex-shrink-0 text-[11px] font-bold text-white"
      style={{ background: bg, borderRadius: '10px 3px 10px 3px' }}
    >
      {(name || '?').slice(0, 2).toUpperCase()}
    </div>
  );
}

function SortPill({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`text-[11px] px-2.5 py-1 rounded-full transition-colors ${
        active
          ? 'bg-gray-200 dark:bg-nero-border text-gray-900 dark:text-white font-medium'
          : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
      }`}
    >
      {label}
    </button>
  );
}

function InsightCard({ text, type }) {
  const cls =
    type === 'good'    ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40' :
    type === 'warn'    ? 'bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30' :
                         'bg-[#f5f5f3] dark:bg-nero-surface border border-gray-100 dark:border-nero-border';
  const dot =
    type === 'good' ? '#22c55e' :
    type === 'warn' ? '#f87171' :
    '#27AE60';
  return (
    <div className={`rounded-xl px-4 py-3 flex gap-3 items-start transition-colors ${cls}`}>
      <div className="mt-1 w-2 h-2 rounded-full flex-shrink-0" style={{ background: dot }} />
      <p className="text-sm leading-relaxed text-gray-900 dark:text-white">{text}</p>
    </div>
  );
}

// ── Chart options ─────────────────────────────────────────────────────────────
const donutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '68%',
  plugins: { legend: { display: false }, tooltip: {
    callbacks: { label: (ctx) => ` ${ctx.label}: $${ctx.parsed.toLocaleString()}` },
  }},
};

const barOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { display: false }, ticks: { color: '#9CA3AF', font: { size: 10 } } },
    y: {
      grid: { color: 'rgba(128,128,128,.10)' },
      ticks: { color: '#9CA3AF', font: { size: 10 }, callback: (v) => '$' + v.toLocaleString() },
    },
  },
};

// ── Main component ─────────────────────────────────────────────────────────────
export default function Spending() {
  const { transactions, loading, openAddModal, openCsvModal } = useApp();

  const today = new Date();
  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [sortBy,    setSortBy]    = useState('amount');

  const viewAbbr      = ABBRS[viewMonth];
  const prevAbbr      = ABBRS[(viewMonth + 11) % 12];
  const prevMonthName = FULL_MONTHS[(viewMonth + 11) % 12];
  const isCurrentMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth();

  function goPrev() {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
    else setViewMonth((m) => m - 1);
  }
  function goNext() {
    if (isCurrentMonth) return;
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
    else setViewMonth((m) => m + 1);
  }

  // ── Filtered slices ──────────────────────────────────────────────────────
  const viewTxns = useMemo(
    () => filterMonth(transactions, viewAbbr).filter((t) => t.cat !== 'Transfer'),
    [transactions, viewAbbr]
  );
  const prevTxns = useMemo(
    () => filterMonth(transactions, prevAbbr).filter((t) => t.cat !== 'Transfer'),
    [transactions, prevAbbr]
  );
  const viewExpenses = useMemo(() => viewTxns.filter((t) => t.amt < 0), [viewTxns]);
  const prevExpenses = useMemo(() => prevTxns.filter((t) => t.amt < 0), [prevTxns]);

  const viewTotal = useMemo(() => viewExpenses.reduce((s, t) => s + Math.abs(t.amt), 0), [viewExpenses]);
  const prevTotal = useMemo(() => prevExpenses.reduce((s, t) => s + Math.abs(t.amt), 0), [prevExpenses]);
  const totalDiff = viewTotal - prevTotal;

  // ── Category rows ────────────────────────────────────────────────────────
  const currCatMap = useMemo(() => groupExpensesByCategory(viewTxns), [viewTxns]);
  const prevCatMap = useMemo(() => groupExpensesByCategory(prevTxns), [prevTxns]);

  const categoryRows = useMemo(() => {
    const rows = Object.entries(currCatMap).map(([cat, amt]) => ({
      cat, amt,
      prev: prevCatMap[cat] ?? 0,
      diff: amt - (prevCatMap[cat] ?? 0),
      pct:  viewTotal > 0 ? (amt / viewTotal) * 100 : 0,
      clr:  catClr[cat] ?? CAT_CLR_DEF,
    }));
    if (sortBy === 'amount') return rows.sort((a, b) => b.amt - a.amt);
    if (sortBy === 'change') return rows.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));
    return rows.sort((a, b) => a.cat.localeCompare(b.cat));
  }, [currCatMap, prevCatMap, viewTotal, sortBy]);

  const topCat = categoryRows[0] ?? null;

  // ── Top merchants (grouped by name) ─────────────────────────────────────
  const topMerchants = useMemo(() => {
    const map = {};
    for (const t of viewExpenses) {
      if (!map[t.name]) map[t.name] = { name: t.name, total: 0, count: 0, cat: t.cat };
      map[t.name].total += Math.abs(t.amt);
      map[t.name].count++;
    }
    return Object.values(map).sort((a, b) => b.total - a.total).slice(0, 8);
  }, [viewExpenses]);

  // ── Biggest purchases ────────────────────────────────────────────────────
  const biggestPurchases = useMemo(
    () => [...viewExpenses].sort((a, b) => Math.abs(b.amt) - Math.abs(a.amt)).slice(0, 5),
    [viewExpenses]
  );

  // ── Bar chart: last 6 months ending at view month ────────────────────────
  const last6 = useMemo(
    () => getMonthsEndingAt(viewYear, viewMonth, 6),
    [viewYear, viewMonth]
  );
  const barAmounts = useMemo(
    () => last6.map(({ abbr }) =>
      Math.round(
        filterMonth(transactions, abbr)
          .filter((t) => t.amt < 0 && t.cat !== 'Transfer')
          .reduce((s, t) => s + Math.abs(t.amt), 0)
      )
    ),
    [last6, transactions]
  );

  // ── Auto-generated insights ──────────────────────────────────────────────
  const insights = useMemo(() => {
    if (viewTotal === 0) return [];
    const result = [];

    // 1. MoM total
    if (prevTotal > 0) {
      const pct = Math.round((Math.abs(totalDiff) / prevTotal) * 100);
      if (totalDiff > 1) {
        result.push({ text: `You spent ${pct}% more than ${prevMonthName} — ${fmt(Math.abs(totalDiff))} over last month's total.`, type: 'warn' });
      } else if (totalDiff < -1) {
        result.push({ text: `You spent ${pct}% less than ${prevMonthName}. You kept ${fmt(Math.abs(totalDiff))} in your pocket vs last month.`, type: 'good' });
      } else {
        result.push({ text: `Your total spending is nearly the same as ${prevMonthName}. Very consistent!`, type: 'neutral' });
      }
    } else if (topCat) {
      result.push({ text: `${topCat.cat} is your top spending category this month at ${fmt(topCat.amt)} (${Math.round(topCat.pct)}% of total).`, type: 'neutral' });
    }

    // 2. Biggest expense day
    const dayTotals = {};
    for (const t of viewExpenses) {
      dayTotals[t.date] = (dayTotals[t.date] ?? 0) + Math.abs(t.amt);
    }
    const bigDay = Object.entries(dayTotals).sort((a, b) => b[1] - a[1])[0];
    if (bigDay) {
      const count = viewExpenses.filter((t) => t.date === bigDay[0]).length;
      result.push({ text: `Your biggest expense day was ${bigDay[0]} — ${fmt(bigDay[1])} across ${count} transaction${count > 1 ? 's' : ''}.`, type: 'neutral' });
    }

    // 3. Most-changed category vs last month
    const changed = categoryRows
      .filter((r) => r.prev > 0 && Math.abs(r.diff) >= 10)
      .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));
    if (changed.length > 0) {
      const top = changed[0];
      const pct = Math.round((Math.abs(top.diff) / top.prev) * 100);
      if (top.diff > 0) {
        result.push({ text: `You spent ${pct}% more on ${top.cat} than last month (+${fmt(top.diff)}).`, type: 'warn' });
      } else {
        result.push({ text: `${top.cat} is down ${pct}% vs last month — you trimmed ${fmt(Math.abs(top.diff))} there.`, type: 'good' });
      }
    } else if (categoryRows.length > 1) {
      const second = categoryRows[1];
      result.push({ text: `${second.cat} is your #2 category at ${Math.round(second.pct)}% of spending this month.`, type: 'neutral' });
    }

    return result.slice(0, 3);
  }, [viewTotal, prevTotal, totalDiff, prevMonthName, viewExpenses, categoryRows, topCat]);

  // ── Chart data ───────────────────────────────────────────────────────────
  const donutData = useMemo(() => ({
    labels: categoryRows.map((r) => r.cat),
    datasets: [{
      data:            categoryRows.map((r) => r.amt),
      backgroundColor: categoryRows.map((r) => r.clr),
      borderWidth: 0,
    }],
  }), [categoryRows]);

  const barData = useMemo(() => ({
    labels: last6.map((m) => m.label),
    datasets: [{
      data:            barAmounts,
      backgroundColor: '#27AE6088',
      borderRadius:    4,
    }],
  }), [last6, barAmounts]);

  // ── Empty state ──────────────────────────────────────────────────────────
  if (!loading && transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <div
          className="w-12 h-12 flex items-center justify-center text-white font-semibold text-xl mx-auto mb-4"
          style={{ background: '#27AE60', borderRadius: '10px 3px 10px 3px' }}
        >
          N
        </div>
        <p className="text-[15px] font-semibold text-gray-900 dark:text-white mb-1.5">
          Add transactions to see your breakdown
        </p>
        <p className="text-sm text-gray-400 mb-6 leading-relaxed max-w-[260px] mx-auto">
          Your spending by category will appear here once you have transactions.
        </p>
        <div className="flex gap-2.5 justify-center flex-wrap">
          <button onClick={openAddModal}
            className="text-sm font-medium px-4 py-2.5 rounded-[20px] text-white"
            style={{ background: '#27AE60' }}>
            + Add transaction
          </button>
          <button onClick={openCsvModal}
            className="text-sm font-medium px-4 py-2.5 rounded-[20px] border border-gray-300 dark:border-nero-border text-gray-600 dark:text-gray-300">
            Import CSV
          </button>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── 1. Month selector ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={goPrev}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          aria-label="Previous month"
        >
          <ChevLeft />
        </button>
        <p className="text-[15px] font-semibold text-gray-900 dark:text-white">
          {FULL_MONTHS[viewMonth]} {viewYear}
        </p>
        <button
          onClick={goNext}
          disabled={isCurrentMonth}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors disabled:opacity-30"
          aria-label="Next month"
        >
          <ChevRight />
        </button>
      </div>

      {/* ── 2. Summary row ─────────────────────────────────────────────── */}
      <div className="bg-[#f5f5f3] dark:bg-nero-surface rounded-xl p-4 mb-5 transition-colors">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-0.5">
              Total Spent
            </p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white tabular-nums">
              {fmt(viewTotal)}
            </p>
            {prevTotal > 0 && (
              <p
                className="text-xs mt-1 font-medium"
                style={{ color: totalDiff > 0 ? '#f87171' : '#22c55e' }}
              >
                {totalDiff > 0 ? '▲' : '▼'} {fmt(Math.abs(totalDiff))} {totalDiff > 0 ? 'more' : 'less'} than {prevMonthName}
              </p>
            )}
          </div>

          {topCat && (
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">
                Top Category
              </p>
              <div className="flex items-center gap-1.5 justify-end mb-0.5">
                <span className="w-2 h-2 rounded-[2px] flex-shrink-0" style={{ background: topCat.clr }} />
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{topCat.cat}</p>
              </div>
              <p className="text-xs text-gray-400 tabular-nums">
                {fmt(topCat.amt)} · {Math.round(topCat.pct)}%
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── 3. Category breakdown ──────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-2.5">
        <p className="text-[13px] font-medium text-gray-900 dark:text-white">By category</p>
        <div className="flex gap-0.5">
          <SortPill label="Amount" active={sortBy === 'amount'} onClick={() => setSortBy('amount')} />
          <SortPill label="Change" active={sortBy === 'change'} onClick={() => setSortBy('change')} />
          <SortPill label="Name"   active={sortBy === 'name'}   onClick={() => setSortBy('name')} />
        </div>
      </div>

      <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: '152px 1fr' }}>
        {/* Donut */}
        <div className="relative self-center">
          {categoryRows.length > 0 ? (
            <>
              <div className="h-[152px]">
                <Doughnut data={donutData} options={donutOptions} />
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-[10px] text-gray-400 leading-none mb-0.5">spent</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white tabular-nums leading-tight">
                  {fmt(viewTotal)}
                </p>
              </div>
            </>
          ) : (
            <div className="h-[152px] flex items-center justify-center">
              <p className="text-xs text-gray-400 text-center leading-relaxed">
                No spending<br />this month
              </p>
            </div>
          )}
        </div>

        {/* Category list */}
        <div className="flex flex-col justify-center overflow-hidden">
          {categoryRows.length > 0 ? (
            categoryRows.map((r) => (
              <div
                key={r.cat}
                className="flex items-center gap-2 py-[5px] border-b border-gray-100 dark:border-nero-border transition-colors last:border-0"
              >
                <span
                  className="w-2 h-2 rounded-[2px] flex-shrink-0"
                  style={{ background: r.clr }}
                />
                <span className="text-xs text-gray-700 dark:text-gray-300 flex-1 min-w-0 truncate">
                  {r.cat}
                </span>
                <div className="text-right flex-shrink-0 min-w-[60px]">
                  <p className="text-xs font-medium tabular-nums text-gray-900 dark:text-white">
                    {fmt(r.amt)}
                  </p>
                  {r.prev > 0 && (
                    <p
                      className="text-[10px] tabular-nums leading-tight"
                      style={{ color: r.diff > 0 ? '#f87171' : '#22c55e' }}
                    >
                      {r.diff > 0 ? '▲' : '▼'} {fmt(Math.abs(r.diff))}
                    </p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-gray-400">No expenses this month.</p>
          )}
        </div>
      </div>

      {/* ── 4. Month-over-month bar chart ──────────────────────────────── */}
      <p className="text-[13px] font-medium text-gray-900 dark:text-white mb-2.5">
        Monthly spending
      </p>
      <div className="relative h-[140px] mb-6">
        <Bar data={barData} options={barOptions} />
      </div>

      {/* ── 5. Top merchants ───────────────────────────────────────────── */}
      {topMerchants.length > 0 && (
        <div className="mb-6">
          <p className="text-[13px] font-medium text-gray-900 dark:text-white mb-2.5">
            Where your money goes
          </p>
          <div className="flex flex-col">
            {topMerchants.map((m) => (
              <button
                key={m.name}
                onClick={() =>
                  sendNotification(`Showing transactions for ${m.name}`, {
                    type: 'success',
                    duration: 2000,
                  })
                }
                className="flex items-center gap-2.5 py-2.5 border-b border-gray-100 dark:border-nero-border last:border-0 transition-colors text-left"
              >
                <MerchantAvatar name={m.name} cat={m.cat} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate leading-tight">
                    {m.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {m.count} visit{m.count > 1 ? 's' : ''}
                  </p>
                </div>
                <p className="text-sm font-semibold tabular-nums text-gray-900 dark:text-white flex-shrink-0">
                  {fmt(m.total)}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── 6. Biggest purchases ───────────────────────────────────────── */}
      {biggestPurchases.length > 0 && (
        <div className="mb-6">
          <p className="text-[13px] font-medium text-gray-900 dark:text-white mb-2.5">
            Biggest purchases
          </p>
          <div className="flex flex-col">
            {biggestPurchases.map((t, i) => {
              const clr = catClr[t.cat] ?? CAT_CLR_DEF;
              return (
                <div
                  key={t.id ?? i}
                  className="flex items-center gap-2.5 py-2.5 border-b border-gray-100 dark:border-nero-border last:border-0"
                >
                  <div
                    className="w-1 h-8 rounded-full flex-shrink-0"
                    style={{ background: clr }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate leading-tight">
                      {t.name}
                    </p>
                    <p className="text-xs text-gray-400">{t.date}</p>
                  </div>
                  <span
                    className="text-[10px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0"
                    style={{ background: clr + '22', color: clr }}
                  >
                    {t.cat}
                  </span>
                  <p className="text-sm font-semibold tabular-nums text-gray-900 dark:text-white flex-shrink-0 ml-1">
                    {fmt(Math.abs(t.amt))}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 7. Spending insights ───────────────────────────────────────── */}
      {insights.length > 0 && (
        <div className="mb-2">
          <p className="text-[13px] font-medium text-gray-900 dark:text-white mb-2.5">
            {FULL_MONTHS[viewMonth]} insights
          </p>
          <div className="flex flex-col gap-2">
            {insights.map((ins, i) => (
              <InsightCard key={i} text={ins.text} type={ins.type} />
            ))}
          </div>
        </div>
      )}
    </>
  );
}
