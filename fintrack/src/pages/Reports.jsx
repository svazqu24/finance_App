import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { sankey as d3Sankey, sankeyLinkHorizontal } from 'd3-sankey';
import { useApp } from '../AppContext';
import { filterMonth } from '../utils';
import { budgets as DEFAULT_BUDGETS } from '../data';

// ── Constants ─────────────────────────────────────────────────────────────────
const ABBRS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const FULL_MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

const CAT_COLORS = {
  Dining:        '#f97316',
  Shopping:      '#a78bfa',
  Groceries:     '#34d399',
  Transport:     '#60a5fa',
  Health:        '#f472b6',
  Subscriptions: '#818cf8',
  Utilities:     '#2dd4bf',
  Housing:       '#fbbf24',
  Insurance:     '#94a3b8',
  Travel:        '#38bdf8',
  Entertainment: '#e879f9',
  Other:         '#9ca3af',
};

const DEFAULT_BUDGET_MAP = Object.fromEntries(DEFAULT_BUDGETS.map((b) => [b.cat, b.budget]));
const fmt = (n) => '$' + Math.abs(Number(n)).toLocaleString('en-US', { maximumFractionDigits: 0 });

const CHART_H  = 420;
const NODE_W   = 18;
const NODE_PAD = 10;

// ── Chevrons ──────────────────────────────────────────────────────────────────
function ChevLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}
function ChevRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color }) {
  return (
    <div className="rounded-[10px] px-4 py-3.5" style={{ background: '#111827', border: '0.5px solid #1f2937' }}>
      <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9ca3af', marginBottom: 4 }}>
        {label}
      </p>
      <p style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.5px', color: color ?? '#f9fafb', fontVariantNumeric: 'tabular-nums', lineHeight: 1.2 }}>
        {value}
      </p>
      {sub && <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{sub}</p>}
    </div>
  );
}

// ── Sankey chart ──────────────────────────────────────────────────────────────
function SankeyChart({ income, categories, budgetMap }) {
  const containerRef = useRef(null);
  const [width, setWidth]         = useState(600);
  const [tooltip, setTooltip]     = useState(null);
  const [hoveredLink, setHoveredLink] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    setWidth(el.offsetWidth || 600);
    const ro = new ResizeObserver((entries) => setWidth(entries[0].contentRect.width || 600));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const sankeyData = useMemo(() => {
    if (income <= 0 && categories.length === 0) return null;
    const totalSpent = categories.reduce((s, c) => s + c.spent, 0);
    const savings    = Math.max(0, income - totalSpent);

    const rawNodes = [
      { name: 'Income',       nodeType: 'income'    },
      { name: 'Total Income', nodeType: 'aggregate' },
      ...categories.map((c) => ({ name: c.cat, nodeType: 'category', catData: c })),
    ];
    if (savings > 0.5) rawNodes.push({ name: 'Savings', nodeType: 'savings' });

    const rawLinks = [
      { source: 0, target: 1, value: income },
      ...categories.map((c, i) => ({ source: 1, target: 2 + i, value: c.spent })),
      ...(savings > 0.5 ? [{ source: 1, target: rawNodes.length - 1, value: savings }] : []),
    ];

    try {
      const layout = d3Sankey()
        .nodeWidth(NODE_W)
        .nodePadding(NODE_PAD)
        .extent([[100, 12], [Math.max(250, width - 160), CHART_H - 12]]);
      return layout({
        nodes: rawNodes.map((n) => ({ ...n })),
        links: rawLinks.map((l) => ({ ...l })),
      });
    } catch {
      return null;
    }
  }, [income, categories, width]);

  const linkPath = sankeyLinkHorizontal();

  const hideTooltip = useCallback(() => {
    setTooltip(null); setHoveredLink(null); setHoveredNode(null);
  }, []);

  function pointerPos(e) {
    const r = containerRef.current?.getBoundingClientRect() ?? { left: 0, top: 0 };
    return { x: e.clientX - r.left + 16, y: e.clientY - r.top - 12 };
  }

  function onLinkMove(e, i, link) {
    const { x, y } = pointerPos(e);
    const pct = income > 0 ? Math.round((link.value / income) * 100) : 0;
    setTooltip({ x, y, title: link.target.name, body: `${fmt(link.value)} · ${pct}% of income` });
    setHoveredLink(i);
    setHoveredNode(null);
  }

  function onNodeMove(e, node) {
    if (node.nodeType !== 'category' && node.nodeType !== 'savings') return;
    const { x, y } = pointerPos(e);
    const pct = income > 0 ? Math.round(((node.value ?? 0) / income) * 100) : 0;
    setTooltip({
      x, y,
      title: node.name,
      body: `${fmt(node.value ?? 0)} · ${pct}% of income`,
      merchants: node.catData?.merchants?.slice(0, 3),
    });
    setHoveredNode(node.name);
    setHoveredLink(null);
  }

  if (!sankeyData) return null;
  const { nodes, links } = sankeyData;
  const anyHov = hoveredLink !== null || hoveredNode !== null;

  function nodeColor(node) {
    if (node.nodeType === 'income')    return '#34d399';
    if (node.nodeType === 'aggregate') return '#27AE60';
    if (node.nodeType === 'savings')   return '#60a5fa';
    return CAT_COLORS[node.name] ?? '#9ca3af';
  }

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', minHeight: CHART_H }}>
      <svg
        width={width} height={CHART_H}
        style={{ overflow: 'visible', display: 'block' }}
        onMouseLeave={hideTooltip}
      >
        {/* Links */}
        {links.map((link, i) => {
          const color   = CAT_COLORS[link.target.name] ?? '#27AE60';
          const isHov   = hoveredLink === i;
          const opacity = anyHov ? (isHov ? 0.80 : 0.10) : 0.35;
          return (
            <path key={i} d={linkPath(link)}
              fill={color} fillOpacity={opacity} stroke="none"
              style={{ cursor: 'pointer', transition: 'fill-opacity 0.12s' }}
              onMouseMove={(e) => onLinkMove(e, i, link)}
            />
          );
        })}

        {/* Nodes */}
        {nodes.map((node, i) => {
          const color    = nodeColor(node);
          const midY     = (node.y0 + node.y1) / 2;
          const nodeH    = Math.max(node.y1 - node.y0, 4);
          const depth    = node.depth ?? 0;
          const isRight  = depth >= 2;
          const isHov    = hoveredNode === node.name;
          const pct      = income > 0 && (node.value ?? 0) > 0
            ? Math.round(((node.value ?? 0) / income) * 100) : null;
          const limit    = budgetMap[node.name] ?? 0;
          const overBdgt = node.nodeType === 'category' && limit > 0 && (node.value ?? 0) > limit;

          return (
            <g key={i}
               style={{ cursor: isRight ? 'pointer' : 'default' }}
               onMouseMove={(e) => onNodeMove(e, node)}
            >
              <rect
                x={node.x0} y={node.y0} width={NODE_W} height={nodeH} rx={3}
                fill={color} fillOpacity={isHov ? 1 : 0.9}
                stroke={isHov ? color : '#1f2937'} strokeWidth={1}
                style={{ transition: 'fill-opacity 0.12s' }}
              />
              {overBdgt && (
                <line x1={node.x1} y1={node.y0} x2={node.x1} y2={node.y1}
                      stroke="#f87171" strokeWidth={3} />
              )}

              {/* Left/middle column: label to the right of the node */}
              {depth <= 1 && (
                <text x={node.x1 + 8} y={midY}
                      textAnchor="start" dominantBaseline="middle"
                      style={{ fontSize: 12, fill: '#e5e7eb', fontWeight: depth === 0 ? 500 : 400, pointerEvents: 'none' }}>
                  {node.name}
                  {depth === 0 && (
                    <tspan style={{ fill: '#9ca3af', fontWeight: 400 }}>{' · '}{fmt(node.value ?? 0)}</tspan>
                  )}
                </text>
              )}

              {/* Right column: name left of node, amount+% right of node */}
              {isRight && (
                <>
                  <text x={node.x0 - 8} y={midY}
                        textAnchor="end" dominantBaseline="middle"
                        style={{ fontSize: 12, fill: isHov ? '#f9fafb' : '#e5e7eb', fontWeight: 500, pointerEvents: 'none', transition: 'fill 0.12s' }}>
                    {node.name}
                  </text>
                  <text x={node.x1 + 8} y={midY}
                        textAnchor="start" dominantBaseline="middle"
                        style={{ fontSize: 11, fill: overBdgt ? '#f87171' : '#9ca3af', pointerEvents: 'none' }}>
                    {fmt(node.value ?? 0)}{pct !== null ? ` · ${pct}%` : ''}
                  </text>
                </>
              )}
            </g>
          );
        })}
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div style={{
          position: 'absolute', left: tooltip.x, top: tooltip.y,
          background: '#1f2937', border: '0.5px solid #374151',
          borderRadius: 8, padding: '10px 14px',
          fontSize: 12, color: '#f9fafb',
          pointerEvents: 'none', zIndex: 50,
          whiteSpace: 'nowrap', minWidth: 140,
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
        }}>
          <p style={{ fontWeight: 600, marginBottom: 4 }}>{tooltip.title}</p>
          <p style={{ color: '#9ca3af' }}>{tooltip.body}</p>
          {tooltip.merchants?.length > 0 && (
            <div style={{ borderTop: '0.5px solid #374151', paddingTop: 6, marginTop: 6 }}>
              <p style={{ color: '#9ca3af', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                Top merchants
              </p>
              {tooltip.merchants.map((m) => (
                <p key={m.name} style={{ color: '#e5e7eb', marginBottom: 2 }}>
                  {m.name}<span style={{ color: '#9ca3af' }}> · {fmt(m.total)}</span>
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Reports() {
  const { transactions, loading, budgetOverrides } = useApp();

  const today = new Date();
  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [activeTab, setActiveTab] = useState('cashflow');

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

  const budgetMap = useMemo(() => ({ ...DEFAULT_BUDGET_MAP, ...budgetOverrides }), [budgetOverrides]);

  const abbr      = ABBRS[viewMonth];
  const monthTxns = useMemo(
    () => filterMonth(transactions, abbr).filter((t) => t.cat !== 'Transfer'),
    [transactions, abbr]
  );

  const totalIncome = useMemo(
    () => monthTxns.filter((t) => t.amt > 0).reduce((s, t) => s + t.amt, 0),
    [monthTxns]
  );

  const expenseTxns = useMemo(
    () => monthTxns.filter((t) => t.amt < 0 && t.cat !== 'Income'),
    [monthTxns]
  );

  const totalExpenses = useMemo(
    () => expenseTxns.reduce((s, t) => s + Math.abs(t.amt), 0),
    [expenseTxns]
  );

  const netCashFlow = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0
    ? Math.max(0, Math.round(((totalIncome - totalExpenses) / totalIncome) * 100))
    : 0;

  const categories = useMemo(() => {
    const map = {};
    for (const t of expenseTxns) {
      if (!map[t.cat]) map[t.cat] = { cat: t.cat, spent: 0, mMap: {} };
      map[t.cat].spent += Math.abs(t.amt);
      if (!map[t.cat].mMap[t.name]) map[t.cat].mMap[t.name] = { name: t.name, total: 0 };
      map[t.cat].mMap[t.name].total += Math.abs(t.amt);
    }
    return Object.values(map)
      .map((c) => ({
        cat: c.cat, spent: c.spent,
        merchants: Object.values(c.mMap).sort((a, b) => b.total - a.total),
      }))
      .filter((c) => c.spent > 0)
      .sort((a, b) => b.spent - a.spent);
  }, [expenseTxns]);

  const incomeSources = useMemo(() => {
    const map = {};
    for (const t of monthTxns.filter((t) => t.amt > 0)) {
      if (!map[t.name]) map[t.name] = { name: t.name, total: 0, count: 0 };
      map[t.name].total += t.amt;
      map[t.name].count++;
    }
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [monthTxns]);

  const insightText = useMemo(() => {
    if (categories.length === 0) return null;
    const top   = categories[0];
    const pct   = totalIncome > 0 ? Math.round((top.spent / totalIncome) * 100) : 0;
    const limit = budgetMap[top.cat] ?? 0;
    if (limit > 0 && top.spent > limit) {
      return `${top.cat} is your biggest expense at ${fmt(top.spent)} — ${fmt(top.spent - limit)} over budget this month.`;
    }
    return `${top.cat} is your top category at ${fmt(top.spent)}${totalIncome > 0 ? `, ${pct}% of income` : ''}.`;
  }, [categories, totalIncome, budgetMap]);

  const isEmpty = !loading && monthTxns.length === 0;

  return (
    <div>
      {/* Month selector */}
      <div className="flex items-center justify-between mb-5">
        <button onClick={goPrev} aria-label="Previous month"
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-200 transition-colors">
          <ChevLeft />
        </button>
        <p className="text-[15px] font-semibold text-gray-900 dark:text-white">
          {FULL_MONTHS[viewMonth]} {viewYear}
        </p>
        <button onClick={goNext} disabled={isCurrentMonth} aria-label="Next month"
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-200 transition-colors disabled:opacity-30">
          <ChevRight />
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <StatCard label="Total Income"   value={fmt(totalIncome)}   color="#34d399" />
        <StatCard label="Total Expenses" value={fmt(totalExpenses)} color="#f87171" />
        <StatCard
          label="Net Cash Flow"
          value={`${netCashFlow >= 0 ? '+' : '-'}${fmt(Math.abs(netCashFlow))}`}
          color={netCashFlow >= 0 ? '#34d399' : '#f87171'}
          sub={netCashFlow >= 0 ? 'surplus' : 'deficit'}
        />
        <StatCard
          label="Savings Rate"
          value={`${savingsRate}%`}
          color={savingsRate >= 20 ? '#34d399' : savingsRate > 0 ? '#fbbf24' : '#f87171'}
          sub="of income"
        />
      </div>

      {/* Tab row */}
      <div className="flex border-b mb-5" style={{ borderColor: '#1f2937' }}>
        {[
          { key: 'cashflow', label: 'Cash Flow' },
          { key: 'income',   label: 'Income'    },
          { key: 'expenses', label: 'Expenses'  },
        ].map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className="px-4 py-2.5 text-[13px] border-b-2 -mb-px transition-colors whitespace-nowrap"
            style={{
              borderBottomColor: activeTab === tab.key ? '#27AE60' : 'transparent',
              color:             activeTab === tab.key ? '#27AE60' : '#9ca3af',
              fontWeight:        activeTab === tab.key ? 500 : 400,
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      {isEmpty ? (
        <div className="text-center py-16">
          <p className="text-[15px] font-medium text-gray-900 dark:text-white mb-2">
            No transaction data for this month
          </p>
          <p className="text-sm text-gray-400">Import a CSV to see your cash flow</p>
        </div>
      ) : (
        <>
          {/* Cash Flow tab */}
          {activeTab === 'cashflow' && (
            <div className="rounded-[10px]" style={{ background: '#111827', border: '0.5px solid #1f2937' }}>
              <div className="px-4 pt-3.5 pb-2 flex items-center justify-between border-b" style={{ borderColor: '#1f2937' }}>
                <p style={{ fontSize: 12, fontWeight: 500, color: '#f9fafb' }}>
                  Cash flow · {FULL_MONTHS[viewMonth]} {viewYear}
                </p>
                <p style={{ fontSize: 11, color: '#9ca3af' }}>hover to explore</p>
              </div>
              <div className="p-4" style={{ overflowX: 'auto' }}>
                {totalIncome === 0 ? (
                  <p className="text-center py-10" style={{ fontSize: 13, color: '#9ca3af' }}>
                    No income transactions found — add income to see the full Sankey
                  </p>
                ) : (
                  <SankeyChart income={totalIncome} categories={categories} budgetMap={budgetMap} />
                )}
              </div>
            </div>
          )}

          {/* Income tab */}
          {activeTab === 'income' && (
            <div className="rounded-[10px]" style={{ background: '#111827', border: '0.5px solid #1f2937' }}>
              <div className="px-4 pt-3.5 pb-2 border-b" style={{ borderColor: '#1f2937' }}>
                <p style={{ fontSize: 12, fontWeight: 500, color: '#f9fafb' }}>
                  Income sources · {FULL_MONTHS[viewMonth]}
                </p>
              </div>
              {incomeSources.length === 0 ? (
                <p className="px-4 py-5" style={{ fontSize: 13, color: '#9ca3af' }}>No income this month.</p>
              ) : (
                incomeSources.map((src) => (
                  <div key={src.name} className="flex items-center justify-between px-4 py-3 border-b last:border-b-0" style={{ borderColor: '#1f2937' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                           style={{ background: 'rgba(52,211,153,0.12)' }}>💵</div>
                      <div>
                        <p style={{ fontSize: 13, color: '#f9fafb', fontWeight: 500 }}>{src.name}</p>
                        <p style={{ fontSize: 11, color: '#9ca3af' }}>{src.count} transaction{src.count !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#34d399', fontVariantNumeric: 'tabular-nums' }}>
                      +{fmt(src.total)}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Expenses tab */}
          {activeTab === 'expenses' && (
            <div className="rounded-[10px]" style={{ background: '#111827', border: '0.5px solid #1f2937' }}>
              <div className="px-4 pt-3.5 pb-2 border-b" style={{ borderColor: '#1f2937' }}>
                <p style={{ fontSize: 12, fontWeight: 500, color: '#f9fafb' }}>
                  Expenses by category · {FULL_MONTHS[viewMonth]}
                </p>
              </div>
              {categories.length === 0 ? (
                <p className="px-4 py-5" style={{ fontSize: 13, color: '#9ca3af' }}>No expenses this month.</p>
              ) : (
                categories.map((c) => {
                  const pct   = totalExpenses > 0 ? Math.round((c.spent / totalExpenses) * 100) : 0;
                  const limit = budgetMap[c.cat] ?? 0;
                  const over  = limit > 0 && c.spent > limit;
                  const barPct = limit > 0 ? Math.min((c.spent / limit) * 100, 100) : 0;
                  return (
                    <div key={c.cat} className="px-4 py-3 border-b last:border-b-0" style={{ borderColor: '#1f2937' }}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: CAT_COLORS[c.cat] ?? '#9ca3af' }} />
                          <span style={{ fontSize: 13, color: '#f9fafb', fontWeight: 500 }}>{c.cat}</span>
                          <span style={{ fontSize: 11, color: '#9ca3af' }}>{pct}%</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {over && <span style={{ fontSize: 10, color: '#f87171' }}>over budget</span>}
                          <span style={{ fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: over ? '#f87171' : '#f9fafb' }}>
                            {fmt(c.spent)}
                          </span>
                        </div>
                      </div>
                      {limit > 0 && (
                        <div className="h-1 rounded-full overflow-hidden" style={{ background: '#0a0e1a' }}>
                          <div className="h-full rounded-full transition-all"
                               style={{ width: `${barPct}%`, background: over ? '#f87171' : (CAT_COLORS[c.cat] ?? '#27AE60') }} />
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Insight card */}
          {insightText && (
            <div className="mt-4 rounded-[10px] px-4 py-3.5 flex gap-3 items-start"
                 style={{ background: '#111827', border: '0.5px solid #1f2937', borderLeft: '3px solid #60a5fa' }}>
              <span style={{ fontSize: 15, marginTop: 1, flexShrink: 0 }}>💡</span>
              <p style={{ fontSize: 13, color: '#9ca3af', lineHeight: 1.6 }}>{insightText}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
