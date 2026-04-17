/**
 * Financial Modeling Prep market data service
 * Base URL: https://financialmodelingprep.com/api/v3/
 * All responses cached for 5 minutes in memory.
 */

const BASE_URL = 'https://financialmodelingprep.com/api/v3';
const API_KEY  = import.meta.env.VITE_FMP_API_KEY;

// ── In-memory cache ────────────────────────────────────────────────────────────
const cache = new Map(); // key → { data, expiresAt }
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCached(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { cache.delete(key); return null; }
  return entry.data;
}

function setCached(key, data) {
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL });
}

// ── Core fetch wrapper ─────────────────────────────────────────────────────────
async function apiFetch(path, params = {}) {
  if (!API_KEY) throw new Error('VITE_FMP_API_KEY is not set');

  const cacheKey = path + JSON.stringify(params);
  const cached = getCached(cacheKey);
  if (cached !== null) return cached;

  const url = new URL(`${BASE_URL}${path}`);
  url.searchParams.set('apikey', API_KEY);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url.toString());

  if (res.status === 429) {
    const err = new Error('RATE_LIMITED');
    err.code = 429;
    throw err;
  }
  if (!res.ok) throw new Error(`FMP API error ${res.status}`);

  const json = await res.json();
  setCached(cacheKey, json);
  return json;
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Get a real-time quote for one or more symbols (comma-separated).
 * v3: /quote/{symbol} — returns array of { symbol, name, price, change, changesPercentage, ... }
 */
export async function getQuote(symbol) {
  const data = await apiFetch(`/quote/${encodeURIComponent(symbol)}`);
  return Array.isArray(data) ? data : [];
}

/**
 * Search by company name or ticker.
 * v3: /search?query={query}&limit=10 — returns array of { symbol, name, exchangeShortName, ... }
 */
export async function searchSymbol(query) {
  const data = await apiFetch('/search', { query, limit: 10 });
  return Array.isArray(data) ? data.slice(0, 10) : [];
}

/**
 * Full company profile (sector, description, exchange, logo, etc.)
 * v3: /profile/{symbol}
 */
export async function getCompanyProfile(symbol) {
  const data = await apiFetch(`/profile/${encodeURIComponent(symbol)}`);
  return Array.isArray(data) ? data[0] ?? null : null;
}

/**
 * Market movers — returns { gainers, losers }, each an array of quotes.
 * v3: /stock_market/gainers and /stock_market/losers
 */
export async function getMarketMovers() {
  const [gainers, losers] = await Promise.all([
    apiFetch('/stock_market/gainers').catch(() => []),
    apiFetch('/stock_market/losers').catch(() => []),
  ]);
  return {
    gainers: Array.isArray(gainers) ? gainers.slice(0, 5) : [],
    losers:  Array.isArray(losers)  ? losers.slice(0, 5)  : [],
  };
}

/**
 * Major Forex pairs.
 * v3: /fx — returns all pairs; we filter for the ones we need.
 * Each item: { ticker, bid, ask, open, low, high, changes, date }
 * We normalise to { symbol, price, change, changesPercentage } to match the quote shape.
 */
export async function getExchangeRates() {
  const WANTED = new Set(['EUR/USD', 'GBP/USD', 'JPY/USD', 'MXN/USD', 'CAD/USD']);
  const data   = await apiFetch('/fx');
  if (!Array.isArray(data)) return [];
  return data
    .filter((r) => WANTED.has(r.ticker))
    .map((r) => ({
      // Normalise to the same shape Portfolio.jsx expects from quote objects
      symbol:            r.ticker.replace('/', ''),   // "EURUSD"
      price:             r.ask ?? r.bid ?? 0,
      change:            r.changes ?? 0,
      changesPercentage: r.open > 0 ? ((r.changes ?? 0) / r.open) * 100 : 0,
    }));
}

/**
 * Quotes for the three major index ETFs used as market overview.
 * v3: /quote/SPY,QQQ,DIA
 */
export async function getIndexQuotes() {
  const data = await apiFetch('/quote/SPY,QQQ,DIA');
  return Array.isArray(data) ? data : [];
}

/** Clear the full cache (e.g. on manual refresh). */
export function clearCache() {
  cache.clear();
}
