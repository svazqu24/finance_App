/**
 * Alpha Vantage market data service
 * Base URL: https://www.alphavantage.co/query
 * All responses cached for 60 minutes in memory.
 * 25 requests/day limit — cache aggressively and warn at 20 requests.
 */

const BASE_URL = 'https://www.alphavantage.co/query';
const API_KEY  = import.meta.env.VITE_ALPHA_VANTAGE_KEY;

// ── In-memory cache ────────────────────────────────────────────────────────────
const cache = new Map(); // key → { data, expiresAt }
const CACHE_TTL = 60 * 60 * 1000; // 60 minutes

// ── Request counter ────────────────────────────────────────────────────────────
let requestCount = 0;

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
async function apiFetch(params = {}) {
  if (!API_KEY) throw new Error('VITE_ALPHA_VANTAGE_KEY is not set');

  const cacheKey = JSON.stringify(params);
  const cached = getCached(cacheKey);
  if (cached !== null) return cached;

  requestCount++;
  if (requestCount >= 20) {
    console.warn(`Alpha Vantage: ${requestCount} requests made today (25 limit)`);
  }

  const url = new URL(BASE_URL);
  url.searchParams.set('apikey', API_KEY);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url.toString());

  if (res.status === 429) {
    const err = new Error('RATE_LIMITED');
    err.code = 429;
    throw err;
  }
  if (!res.ok) throw new Error(`Alpha Vantage API error ${res.status}`);

  const json = await res.json();
  setCached(cacheKey, json);
  return json;
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Get a real-time quote for a symbol.
 * ?function=GLOBAL_QUOTE&symbol=AAPL&apikey=KEY
 * Returns { symbol, price, change, changePercent, open } or null
 */
export async function getQuote(symbol) {
  const data = await apiFetch({ function: 'GLOBAL_QUOTE', symbol });
  const quote = data['Global Quote'];
  if (!quote) return null;

  return {
    symbol: quote['01. symbol'],
    price: parseFloat(quote['05. price']),
    change: parseFloat(quote['09. change']),
    changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
    open: parseFloat(quote['02. open']),
  };
}

/**
 * Search by company name or ticker.
 * ?function=SYMBOL_SEARCH&keywords=apple&apikey=KEY
 * Returns array of { symbol, name }
 */
export async function searchSymbol(query) {
  const data = await apiFetch({ function: 'SYMBOL_SEARCH', keywords: query });
  const matches = data.bestMatches || [];
  return matches.slice(0, 10).map(match => ({
    symbol: match['1. symbol'],
    name: match['2. name'],
  }));
}

/**
 * Forex rates for EUR, GBP, JPY, MXN, CAD to USD.
 * Makes 5 sequential calls.
 * Returns array of { from, to, rate, bid }
 */
export async function getExchangeRates() {
  const currencies = ['EUR', 'GBP', 'JPY', 'MXN', 'CAD'];
  const results = [];

  for (const from of currencies) {
    const data = await apiFetch({
      function: 'CURRENCY_EXCHANGE_RATE',
      from_currency: from,
      to_currency: 'USD'
    });
    const rate = data['Realtime Currency Exchange Rate'];
    if (rate) {
      results.push({
        from,
        to: 'USD',
        rate: parseFloat(rate['5. Exchange Rate']),
        bid: parseFloat(rate['8. Bid Price']),
      });
    }
  }

  return results;
}

/**
 * Quotes for SPY, QQQ, DIA — market overview.
 * Makes 3 sequential calls with 500ms delay.
 * Returns array of quote objects
 */
export async function getIndexQuotes() {
  const symbols = ['SPY', 'QQQ', 'DIA'];
  const results = [];

  for (const symbol of symbols) {
    const quote = await getQuote(symbol);
    if (quote) results.push(quote);
    await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay
  }

  return results;
}

/** Clear the full cache (e.g. on manual refresh). */
export function clearCache() {
  cache.clear();
}
