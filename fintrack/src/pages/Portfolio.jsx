import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useApp } from '../AppContext';
import { supabase } from '../supabaseClient';
import {
  getIndexQuotes, getExchangeRates, searchSymbol, getQuote, clearCache,
} from '../services/marketService';
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

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// ── Constants ─────────────────────────────────────────────────────────────────
const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes
const RETRY_AFTER_RATE_LIMIT = 60 * 1000; // 1 minute

const INDEX_META = {
  SPY: 'S&P 500',
  QQQ: 'NASDAQ',
  DIA: 'DOW',
};

const FOREX_META = {
  EURUSD: { base: 'EUR', quote: 'USD' },
  GBPUSD: { base: 'GBP', quote: 'USD' },
  JPYUSD: { base: 'JPY', quote: 'USD' },
  MXNUSD: { base: 'MXN', quote: 'USD' },
  CADUSD: { base: 'CAD', quote: 'USD' },
};

// ── Tiny helpers ──────────────────────────────────────────────────────────────
function clr(change) {
  if (change > 0) return '#27AE60';
  if (change < 0) return '#f87171';
  return '#9ca3af';
}

function arrow(change) {
  if (change > 0) return '▲';
  if (change < 0) return '▼';
  return '—';
}

function fmt(n, decimals = 2) {
  if (n == null || isNaN(n)) return '—';
  return Number(n).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

// ── Icons ─────────────────────────────────────────────────────────────────────
function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

// ── Skeleton loader ───────────────────────────────────────────────────────────
function Skeleton({ w = '100%', h = 16, rounded = 6 }) {
  return (
    <div
      className="animate-pulse bg-gray-200 dark:bg-[#1f2937]"
      style={{ width: w, height: h, borderRadius: rounded }}
    />
  );
}

// ── Market unavailable notice ─────────────────────────────────────────────────
function UnavailableNote({ rateLimited }) {
  return (
    <p className="text-xs text-gray-400 italic">
      Market data unavailable — resets daily
    </p>
  );
}

// ── Section heading ───────────────────────────────────────────────────────────
function SectionHead({ title, children }) {
  return (
    <div className="flex items-center justify-between mb-2.5">
      <p className="text-[13px] font-medium text-gray-900 dark:text-white">{title}</p>
      {children}
    </div>
  );
}

// ── Index strip card ──────────────────────────────────────────────────────────
function IndexCard({ quote, loading }) {
  const name = INDEX_META[quote?.symbol] ?? quote?.symbol ?? '—';
  const price = quote?.price;
  const change = quote?.change;
  const changePct = quote?.changePercent;
  const validPrice = price != null && !isNaN(price);

  return (
    <div className="rounded-xl px-3.5 py-3" style={{ background: '#111827', border: '0.5px solid #1f2937' }}>
      <p className="text-[11px] uppercase tracking-[.08em] text-gray-400 mb-1">{name}</p>
      {loading ? (
        <div className="flex flex-col gap-1.5 mt-1">
          <Skeleton h={20} w="70%" />
          <Skeleton h={12} w="50%" />
        </div>
      ) : (
        <>
          <p className="text-[18px] font-semibold tabular-nums text-gray-900 dark:text-white leading-tight">
            ${fmt(price)}
          </p>
          {validPrice && (
            <p className="text-xs tabular-nums mt-0.5" style={{ color: clr(change) }}>
              {arrow(change)} {fmt(Math.abs(change))} ({fmt(Math.abs(changePct), 2)}%)
            </p>
          )}
        </>
      )}
    </div>
  );
}

// ── Watchlist row ─────────────────────────────────────────────────────────────
function WatchlistRow({ item, onRemove }) {
  const [hovered, setHovered] = useState(false);
  const change = item.quote?.changesPercentage ?? null;

  return (
    <div
      className="flex items-center gap-2.5 py-2.5 border-b border-gray-200 dark:border-[#1f2937] transition-colors"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Ticker badge */}
      <div
        className="w-9 h-9 flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-white rounded-[8px_2px_8px_2px]"
        style={{ background: '#185FA5' }}
      >
        {item.symbol.slice(0, 4)}
      </div>

      {/* Name + symbol */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate leading-tight">
          {item.company_name || item.symbol}
        </p>
        <p className="text-xs text-gray-400">{item.symbol}</p>
      </div>

      {/* Price + change */}
      <div className="text-right flex-shrink-0">
        {item.quote == null ? (
          <Skeleton w={60} h={14} />
        ) : (
          <>
            <p className="text-sm font-semibold tabular-nums text-gray-900 dark:text-white">
              ${fmt(item.quote.price)}
            </p>
            <p className="text-xs tabular-nums" style={{ color: clr(change) }}>
              {arrow(change)} {fmt(Math.abs(change), 2)}%
            </p>
          </>
        )}
      </div>

      {/* Remove */}
      {hovered && (
        <button
          onClick={() => onRemove(item.symbol)}
          className="ml-1 flex-shrink-0 w-7 h-7 flex items-center justify-center text-gray-300 hover:text-red-400 dark:text-gray-600 dark:hover:text-red-400 transition-colors"
          aria-label={`Remove ${item.symbol} from watchlist`}
        >
          <TrashIcon />
        </button>
      )}
    </div>
  );
}

// ── Holding row ───────────────────────────────────────────────────────────────
function HoldingRow({ holding, onRemove }) {
  const [hovered, setHovered] = useState(false);
  const currentPrice = holding.quote?.price ?? null;
  const currentValue = currentPrice != null ? currentPrice * holding.shares : null;
  const costBasis    = holding.avg_buy_price * holding.shares;
  const gainLoss     = currentValue != null ? currentValue - costBasis : null;
  const gainLossPct  = costBasis > 0 && gainLoss != null ? (gainLoss / costBasis) * 100 : null;

  return (
    <div
      className="flex items-center gap-2.5 py-2.5 border-b border-gray-200 dark:border-[#1f2937] transition-colors"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Ticker badge */}
      <div
        className="w-9 h-9 flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-white rounded-[8px_2px_8px_2px]"
        style={{ background: '#27AE60' }}
      >
        {holding.symbol.slice(0, 4)}
      </div>

      {/* Name + shares */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate leading-tight">
          {holding.company_name || holding.symbol}
        </p>
        <p className="text-xs text-gray-400">
          {holding.shares} sh · avg ${fmt(holding.avg_buy_price)}
        </p>
      </div>

      {/* Value + gain/loss */}
      <div className="text-right flex-shrink-0">
        {currentValue == null ? (
          <Skeleton w={60} h={14} />
        ) : (
          <>
            <p className="text-sm font-semibold tabular-nums text-gray-900 dark:text-white">
              ${fmt(currentValue)}
            </p>
            {gainLoss != null && (
              <p className="text-xs tabular-nums" style={{ color: clr(gainLoss) }}>
                {gainLoss >= 0 ? '+' : '-'}${fmt(Math.abs(gainLoss))} ({fmt(Math.abs(gainLossPct), 1)}%)
              </p>
            )}
          </>
        )}
      </div>

      {/* Remove */}
      {hovered && (
        <button
          onClick={() => onRemove(holding.id)}
          className="ml-1 flex-shrink-0 w-7 h-7 flex items-center justify-center text-gray-300 hover:text-red-400 dark:text-gray-600 dark:hover:text-red-400 transition-colors"
          aria-label={`Remove ${holding.symbol}`}
        >
          <TrashIcon />
        </button>
      )}
    </div>
  );
}

// ── Add holding form ──────────────────────────────────────────────────────────
function AddHoldingForm({ onAdd, onCancel }) {
  const [symbol,   setSymbol]   = useState('');
  const [shares,   setShares]   = useState('');
  const [avgPrice, setAvgPrice] = useState('');
  const [query,    setQuery]    = useState('');
  const [results,  setResults]  = useState([]);
  const [searching, setSearching] = useState(false);
  const searchTimeout = useRef(null);

  function handleSymbolChange(e) {
    const val = e.target.value.toUpperCase();
    setSymbol(val);
    setQuery(val);
    clearTimeout(searchTimeout.current);
    if (val.length < 1) { setResults([]); return; }
    setSearching(true);
    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await searchSymbol(val);
        setResults(res.slice(0, 6));
      } catch { setResults([]); }
      setSearching(false);
    }, 350);
  }

  function pickResult(r) {
    setSymbol(r.symbol);
    setQuery(r.symbol);
    setResults([]);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const s = parseFloat(shares);
    const p = parseFloat(avgPrice);
    if (!symbol || isNaN(s) || isNaN(p) || s <= 0 || p < 0) return;
    await onAdd({ symbol: symbol.toUpperCase(), shares: s, avg_buy_price: p });
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl p-4 mb-3" style={{ background: '#111827', border: '0.5px solid #1f2937' }}>
      <p className="text-[13px] font-medium text-gray-900 dark:text-white mb-3">Add holding</p>
      <div className="relative mb-2.5">
        <input
          type="text"
          placeholder="Ticker symbol (e.g. AAPL)"
          value={query}
          onChange={handleSymbolChange}
          className="w-full text-sm px-3 py-2 rounded-lg border border-[#1f2937] bg-[#111827] text-white placeholder:text-[#6b7280] outline-none focus:border-[#27AE60] transition-colors"
          autoFocus
        />
        {results.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-[#111827] border border-[#1f2937] rounded-xl shadow-xl overflow-hidden max-h-48 overflow-y-auto">
            {results.map((r) => (
              <button
                key={r.symbol}
                type="button"
                onClick={() => pickResult(r)}
                className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-[#0a0e1a] transition-colors flex items-center gap-2"
              >
                <span className="text-xs font-semibold text-gray-900 dark:text-white w-14 flex-shrink-0">{r.symbol}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{r.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <input
          type="number"
          placeholder="Shares owned"
          value={shares}
          onChange={(e) => setShares(e.target.value)}
          min="0" step="any"
          className="text-sm px-3 py-2 rounded-lg border border-[#1f2937] bg-[#111827] text-white placeholder:text-[#6b7280] outline-none focus:border-[#27AE60] transition-colors"
        />
        <input
          type="number"
          placeholder="Avg buy price ($)"
          value={avgPrice}
          onChange={(e) => setAvgPrice(e.target.value)}
          min="0" step="any"
          className="text-sm px-3 py-2 rounded-lg border border-[#1f2937] bg-[#111827] text-white placeholder:text-[#6b7280] outline-none focus:border-[#27AE60] transition-colors"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={!symbol || !shares || !avgPrice}
          className="flex-1 text-sm font-medium py-2 rounded-[20px] text-white transition-colors disabled:opacity-40"
          style={{ background: '#27AE60' }}
        >
          Add holding
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-sm font-medium px-4 py-2 rounded-[20px] border border-gray-300 dark:border-[#1f2937] text-gray-600 dark:text-gray-300 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function Portfolio() {
  const { user, netWorthEntries, getNetWorthHistory } = useApp();

  const netWorthHistory = useMemo(() => getNetWorthHistory(), [netWorthEntries]);
  const latestEntry     = netWorthHistory.length > 0 ? netWorthHistory[netWorthHistory.length - 1] : null;
  const currentNetWorth = latestEntry?.net_worth ?? 0;

  const assetBreakdown = useMemo(() => {
    const accs = latestEntry?.accounts ?? [];
    return {
      checking:    accs.filter(a => a.category === 'checking').reduce((s, a) => s + Number(a.balance), 0),
      savings:     accs.filter(a => a.category === 'savings').reduce((s, a) => s + Number(a.balance), 0),
      investments: accs.filter(a => a.category === 'investments').reduce((s, a) => s + Number(a.balance), 0),
      otherAssets: accs.filter(a => a.type === 'asset' && !['checking', 'savings', 'investments'].includes(a.category))
                       .reduce((s, a) => s + Number(a.balance), 0),
      liabilities: accs.filter(a => a.type === 'liability').reduce((s, a) => s + Number(a.balance), 0),
    };
  }, [latestEntry]);

  const netWorthChartData = useMemo(() => ({
    labels: netWorthHistory.map(entry => {
      const [year, month] = entry.month.split('-');
      return new Date(Number(year), Number(month) - 1).toLocaleDateString('en-US', { month: 'short' });
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

  const netWorthChartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (ctx) => `$${ctx.parsed.y.toLocaleString()}` } },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#9CA3AF' } },
      y: {
        grid: { color: '#374151', lineWidth: 0.5 },
        ticks: { color: '#9CA3AF', callback: (v) => `$${Number(v).toLocaleString()}` },
      },
    },
  }), []);

  // ── Market data state ──────────────────────────────────────────────────────
  const [indexQuotes,   setIndexQuotes]   = useState([]);
  const [forexRates,    setForexRates]    = useState([]);
  const [marketLoading, setMarketLoading] = useState(true);
  const [marketError,   setMarketError]   = useState(null); // null | 'unavailable' | 'rate_limited'

  // ── Watchlist state ────────────────────────────────────────────────────────
  const [watchlist,        setWatchlist]        = useState([]);
  const [watchlistLoading, setWatchlistLoading] = useState(false);
  const [watchSearch,      setWatchSearch]      = useState('');
  const [watchResults,     setWatchResults]     = useState([]);
  const [watchSearching,   setWatchSearching]   = useState(false);
  const watchSearchTimeout = useRef(null);

  // ── Holdings state ─────────────────────────────────────────────────────────
  const [holdings,        setHoldings]        = useState([]);
  const [holdingsLoading, setHoldingsLoading] = useState(false);
  const [showAddHolding,  setShowAddHolding]  = useState(false);

  // ── Refresh countdown ──────────────────────────────────────────────────────
  const [lastRefreshed, setLastRefreshed] = useState(null);

  // ── Fetch market data ──────────────────────────────────────────────────────
  const fetchMarketData = useCallback(async ({ force = false } = {}) => {
    if (force) clearCache();
    setMarketLoading(true);
    setMarketError(null);
    try {
      const [idxData, fxData] = await Promise.all([
        getIndexQuotes(),
        getExchangeRates(),
      ]);
      setIndexQuotes(idxData);
      setForexRates(fxData);
      setLastRefreshed(new Date());
    } catch (err) {
      if (err.code === 429) setMarketError('rate_limited');
      else setMarketError('unavailable');
    } finally {
      setMarketLoading(false);
    }
  }, []);

  // Initial load + auto-refresh every 5 min
  useEffect(() => {
    console.log('Alpha Vantage key loaded:', !!import.meta.env.VITE_ALPHA_VANTAGE_KEY);
    fetchMarketData();
    const interval = setInterval(() => fetchMarketData(), REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchMarketData]);

  // Retry after rate limit
  useEffect(() => {
    if (marketError !== 'rate_limited') return;
    const t = setTimeout(() => fetchMarketData(), RETRY_AFTER_RATE_LIMIT);
    return () => clearTimeout(t);
  }, [marketError, fetchMarketData]);

  // ── Fetch watchlist from Supabase ──────────────────────────────────────────
  const fetchWatchlist = useCallback(async () => {
    if (!user) return;
    setWatchlistLoading(true);
    const { data, error } = await supabase
      .from('watchlist')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });
    if (error) { setWatchlistLoading(false); return; }

    // Batch fetch quotes for all watchlist symbols
    const quoteMap = {};
    for (const w of data) {
      try { const q = await getQuote(w.symbol); if (q) quoteMap[w.symbol] = q; } catch { /* ignore */ }
    }
    setWatchlist(data.map((w) => ({ ...w, quote: quoteMap[w.symbol] ?? null })));
    setWatchlistLoading(false);
  }, [user, supabase]);

  useEffect(() => { fetchWatchlist(); }, [fetchWatchlist]);

  // ── Watchlist search ───────────────────────────────────────────────────────
  function handleWatchSearch(e) {
    const val = e.target.value;
    setWatchSearch(val);
    clearTimeout(watchSearchTimeout.current);
    if (!val.trim()) { setWatchResults([]); return; }
    setWatchSearching(true);
    watchSearchTimeout.current = setTimeout(async () => {
      try {
        const res = await searchSymbol(val.trim());
        setWatchResults(res.slice(0, 6));
      } catch { setWatchResults([]); }
      setWatchSearching(false);
    }, 350);
  }

  async function addToWatchlist(symbol, companyName) {
    if (!user) return;
    const already = watchlist.some((w) => w.symbol === symbol);
    if (already) { setWatchSearch(''); setWatchResults([]); return; }
    const { data, error } = await supabase
      .from('watchlist')
      .insert({ user_id: user.id, symbol, company_name: companyName })
      .select()
      .single();
    if (error) return;
    let quote = null;
    try { quote = await getQuote(symbol); } catch { /* ignore */ }
    setWatchlist((prev) => [...prev, { ...data, quote }]);
    setWatchSearch('');
    setWatchResults([]);
  }

  async function removeFromWatchlist(symbol) {
    if (!user) return;
    await supabase.from('watchlist').delete().eq('user_id', user.id).eq('symbol', symbol);
    setWatchlist((prev) => prev.filter((w) => w.symbol !== symbol));
  }

  // ── Fetch holdings from Supabase ───────────────────────────────────────────
  const fetchHoldings = useCallback(async () => {
    if (!user) return;
    setHoldingsLoading(true);
    const { data, error } = await supabase
      .from('holdings')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });
    if (error) { setHoldingsLoading(false); return; }

    const symbols = data.map((h) => h.symbol);
    const quoteMap = {};
    for (const sym of symbols) {
      try { const q = await getQuote(sym); if (q) quoteMap[sym] = q; } catch { /* ignore */ }
    }
    setHoldings(data.map((h) => ({ ...h, quote: quoteMap[h.symbol] ?? null })));
    setHoldingsLoading(false);
  }, [user, supabase]);

  useEffect(() => { fetchHoldings(); }, [fetchHoldings]);

  async function addHolding({ symbol, shares, avg_buy_price }) {
    if (!user) return;
    // Get company name from Alpha Vantage
    let companyName = symbol;
    try {
      const results = await searchSymbol(symbol);
      const match = results.find((r) => r.symbol === symbol);
      if (match) companyName = match.name;
    } catch { /* ignore */ }

    const { data, error } = await supabase
      .from('holdings')
      .insert({ user_id: user.id, symbol, company_name: companyName, shares, avg_buy_price })
      .select()
      .single();
    if (error) return;

    let quote = null;
    try { quote = await getQuote(symbol); } catch { /* ignore */ }
    setHoldings((prev) => [...prev, { ...data, quote }]);
    setShowAddHolding(false);
  }

  async function removeHolding(id) {
    if (!user) return;
    await supabase.from('holdings').delete().eq('id', id);
    setHoldings((prev) => prev.filter((h) => h.id !== id));
  }

  // ── Derived totals ─────────────────────────────────────────────────────────
  const totalPortfolioValue = holdings.reduce((sum, h) => {
    const price = h.quote?.price ?? h.avg_buy_price;
    return sum + price * h.shares;
  }, 0);

  const totalCostBasis = holdings.reduce((sum, h) => sum + h.avg_buy_price * h.shares, 0);
  const totalGainLoss  = totalPortfolioValue - totalCostBasis;

  // Index map for rendering
  const indexMap = Object.fromEntries(indexQuotes.map((q) => [q.symbol, q]));
  const forexMap = Object.fromEntries(forexRates.map((r) => [r.from, r]));

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Net Worth History ────────────────────────────────────────────── */}
      <div className="mb-6 rounded-xl p-4" style={{ background: '#111827', border: '0.5px solid #1f2937' }}>
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Net Worth History</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">
              ${currentNetWorth.toLocaleString()}
            </p>
          </div>
        </div>
        {netWorthHistory.length > 0 ? (
          <div className="h-32 mb-4">
            <Line data={netWorthChartData} options={netWorthChartOptions} />
          </div>
        ) : (
          <div className="h-32 flex items-center justify-center mb-4">
            <p className="text-xs text-gray-400 text-center">
              Add net worth entries to see your history
            </p>
          </div>
        )}
        <div className="text-xs text-gray-500 space-y-1">
          <div className="flex justify-between">
            <span>Checking:</span>
            <span>${assetBreakdown.checking.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Savings:</span>
            <span>${assetBreakdown.savings.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Investments:</span>
            <span>${assetBreakdown.investments.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Other Assets:</span>
            <span>${assetBreakdown.otherAssets.toLocaleString()}</span>
          </div>
          <div className="flex justify-between border-t border-gray-200 dark:border-[#1f2937] pt-1 mt-1 text-gray-500 dark:text-gray-400">
            <span>Liabilities:</span>
            <span className="text-red-600">-${assetBreakdown.liabilities.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* ── Section 1: Market overview ───────────────────────────────────── */}
      <div className="flex items-center justify-between mb-2.5">
        <p className="text-[13px] font-medium text-gray-900 dark:text-white">Market overview</p>
        <div className="flex items-center gap-2">
          {lastRefreshed && (
            <span className="text-[10px] text-gray-400">
              Data as of {lastRefreshed.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
            </span>
          )}
          <button
            onClick={() => fetchMarketData({ force: true })}
            disabled={marketLoading}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-40"
            aria-label="Refresh market data"
          >
            <RefreshIcon />
          </button>
        </div>
      </div>

      {marketError ? (
        <div className="mb-5">
          <UnavailableNote rateLimited={marketError === 'rate_limited'} />
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2 mb-5">
          {['SPY', 'QQQ', 'DIA'].map((sym) => (
            <IndexCard
              key={sym}
              quote={indexMap[sym] ? { symbol: sym, ...indexMap[sym] } : { symbol: sym }}
              loading={marketLoading}
            />
          ))}
        </div>
      )}

      {/* ── Section 2: Watchlist ─────────────────────────────────────────── */}
      <SectionHead title="My watchlist" />

      {/* Search */}
      <div className="relative mb-2.5">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          <SearchIcon />
        </span>
        <input
          type="text"
          placeholder="Search stocks to add…"
          value={watchSearch}
          onChange={handleWatchSearch}
          className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-[#1f2937] bg-[#111827] text-white placeholder:text-[#6b7280] outline-none focus:border-[#27AE60] transition-colors"
        />
        {watchSearch && (
          <button
            onClick={() => { setWatchSearch(''); setWatchResults([]); }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
        {/* Search results dropdown */}
        {watchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-[#111827] border border-[#1f2937] rounded-xl shadow-xl overflow-hidden max-h-56 overflow-y-auto">
            {watchResults.map((r) => (
              <button
                key={r.symbol}
                onClick={() => addToWatchlist(r.symbol, r.name)}
                className="w-full text-left px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-[#0a0e1a] transition-colors flex items-center gap-2.5"
              >
                <span className="text-xs font-bold text-gray-900 dark:text-white w-14 flex-shrink-0">{r.symbol}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 truncate flex-1">{r.name}</span>
                <span className="text-[10px] text-gray-400 flex-shrink-0">{r.exchangeShortName ?? ''}</span>
                <span className="text-[10px] text-gray-400 ml-1 flex-shrink-0">+ Add</span>
              </button>
            ))}
          </div>
        )}
        {watchSearching && (
          <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-[#111827] border border-[#1f2937] rounded-xl px-3 py-2.5 shadow-xl">
            <p className="text-xs text-gray-400">Searching…</p>
          </div>
        )}
      </div>

      {watchlistLoading ? (
        <div className="flex flex-col gap-2 mb-5">
          {[1, 2, 3].map((i) => <Skeleton key={i} h={48} rounded={8} />)}
        </div>
      ) : watchlist.length === 0 ? (
        <p className="text-xs text-gray-400 mb-5 leading-relaxed">
          Search for a stock above to start tracking it here.
        </p>
      ) : (
        <div className="mb-5">
          {watchlist.map((item) => (
            <WatchlistRow key={item.symbol} item={item} onRemove={removeFromWatchlist} />
          ))}
        </div>
      )}

      {/* ── Section 3: Exchange rates ─────────────────────────────────────── */}
      <SectionHead title="Exchange rates" />
      <div className="rounded-xl overflow-hidden mb-5" style={{ background: '#111827', border: '0.5px solid #1f2937' }}>
        {marketError ? (
          <div className="px-4 py-3"><UnavailableNote rateLimited={marketError === 'rate_limited'} /></div>
        ) : marketLoading ? (
          <div className="px-4 py-3 flex flex-col gap-2">
            {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} h={18} />)}
          </div>
        ) : (
          ['EUR', 'GBP', 'JPY', 'MXN', 'CAD'].map((from, idx) => {
            const rate = forexMap[from];
            const symbol = from + 'USD';
            const meta = FOREX_META[symbol] ?? { base: from, quote: 'USD' };
            const isLast = idx === 4;
            return (
              <div
                key={symbol}
                className={`flex items-center justify-between px-4 py-2.5 ${!isLast ? 'border-b border-gray-200 dark:border-[#1f2937]' : ''}`}
              >
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {meta.base}<span className="text-gray-400 font-normal">/{meta.quote}</span>
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-sm tabular-nums text-gray-900 dark:text-white font-medium">
                    {rate ? fmt(rate.rate, 4) : '—'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Section 4: My holdings ────────────────────────────────────────── */}
      <SectionHead title="My holdings">
        <button
          onClick={() => setShowAddHolding((v) => !v)}
          className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-[20px] text-white transition-colors"
          style={{ background: '#27AE60' }}
        >
          <PlusIcon /> Add
        </button>
      </SectionHead>

      {/* Portfolio summary */}
      {holdings.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="rounded-xl px-3.5 py-3" style={{ background: '#111827', border: '0.5px solid #1f2937' }}>
            <p className="text-[11px] uppercase tracking-[.08em] text-gray-400 mb-1">Total value</p>
            <p className="text-base font-semibold tabular-nums text-gray-900 dark:text-white">${fmt(totalPortfolioValue)}</p>
          </div>
          <div className="rounded-xl px-3.5 py-3" style={{ background: '#111827', border: '0.5px solid #1f2937' }}>
            <p className="text-[11px] uppercase tracking-[.08em] text-gray-400 mb-1">Cost basis</p>
            <p className="text-base font-semibold tabular-nums text-gray-900 dark:text-white">${fmt(totalCostBasis)}</p>
          </div>
          <div className="rounded-xl px-3.5 py-3" style={{ background: '#111827', border: '0.5px solid #1f2937' }}>
            <p className="text-[11px] uppercase tracking-[.08em] text-gray-400 mb-1">Gain / loss</p>
            <p className="text-base font-semibold tabular-nums" style={{ color: clr(totalGainLoss) }}>
              {totalGainLoss >= 0 ? '+' : '-'}${fmt(Math.abs(totalGainLoss))}
            </p>
          </div>
        </div>
      )}

      {showAddHolding && (
        <AddHoldingForm onAdd={addHolding} onCancel={() => setShowAddHolding(false)} />
      )}

      {holdingsLoading ? (
        <div className="flex flex-col gap-2">
          {[1, 2].map((i) => <Skeleton key={i} h={48} rounded={8} />)}
        </div>
      ) : holdings.length === 0 && !showAddHolding ? (
        <p className="text-xs text-gray-400 leading-relaxed">
          Track your stock positions here — enter your shares and average buy price to see live gain/loss.
        </p>
      ) : (
        holdings.map((h) => (
          <HoldingRow key={h.id} holding={h} onRemove={removeHolding} />
        ))
      )}
    </>
  );
}
