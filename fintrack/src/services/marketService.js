/**
 * Financial Modeling Prep market data service
 * Base URL: https://financialmodelingprep.com/stable/
 * All responses cached for 5 minutes in memory.
 */

const BASE_URL = 'https://financialmodelingprep.com/stable';
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
 * Returns array of quote objects.
 */
export async function getQuote(symbol) {
  const data = await apiFetch('/quote', { symbol });
  return Array.isArray(data) ? data : [];
}

/**
 * Search by company name or ticker. Returns array of { symbol, name, ... }.
 */
export async function searchSymbol(query) {
  const data = await apiFetch('/search-name', { query });
  return Array.isArray(data) ? data.slice(0, 10) : [];
}

/**
 * Full company profile (sector, description, exchange, logo, etc.)
 */
export async function getCompanyProfile(symbol) {
  const data = await apiFetch('/profile', { symbol });
  return Array.isArray(data) ? data[0] ?? null : null;
}

/**
 * Market movers — returns { gainers, losers }, each an array of quotes.
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
 * Major Forex pairs. FMP uses e.g. EURUSD, GBPUSD, etc.
 * Returns array of { symbol, price, changesPercentage, change }.
 */
export async function getExchangeRates() {
  const pairs = ['EURUSD', 'GBPUSD', 'JPYUSD', 'MXNUSD', 'CADUSD'];
  const data  = await apiFetch('/quote', { symbol: pairs.join(',') });
  return Array.isArray(data) ? data : [];
}

/**
 * Quotes for the three major index ETFs used as market overview.
 */
export async function getIndexQuotes() {
  const data = await apiFetch('/quote', { symbol: 'SPY,QQQ,DIA' });
  return Array.isArray(data) ? data : [];
}

/** Clear the full cache (e.g. on manual refresh). */
export function clearCache() {
  cache.clear();
}
