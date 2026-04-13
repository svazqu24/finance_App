const ABBRS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export const currentMonthAbbr = () => ABBRS[new Date().getMonth()];
export const prevMonthAbbr    = () => ABBRS[(new Date().getMonth() + 11) % 12];

/** Extract 3-letter month from a date string like 'Apr 1' or 'Mar 25' */
export const txnMonthAbbr = (dateStr) => (dateStr || '').slice(0, 3);

/** Filter transactions to those whose date starts with monthAbbr ('Apr', 'Mar', …) */
export function filterMonth(transactions, monthAbbr) {
  return transactions.filter((t) => txnMonthAbbr(t.date) === monthAbbr);
}

/**
 * Returns { [category]: totalAbsoluteSpend } for expense (negative) transactions.
 * Amounts are absolute values (positive numbers).
 */
export function groupExpensesByCategory(transactions) {
  const map = {};
  for (const t of transactions) {
    if (t.amt < 0) {
      map[t.cat] = (map[t.cat] || 0) + Math.abs(t.amt);
    }
  }
  return map;
}

/**
 * Returns the last n months as objects { abbr, label } where
 * abbr = 'Apr' (used for filterMonth) and label = 'Apr 25' (used for chart x-axis).
 */
export function getLastNMonthLabels(n = 6) {
  const now = new Date();
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (n - 1) + i, 1);
    const abbr = ABBRS[d.getMonth()];
    const yr   = String(d.getFullYear()).slice(2);
    return { abbr, label: `${abbr} ${yr}` };
  });
}

/** '$1,234' formatter — absolute value, zero decimals */
export function fmtDollars(n) {
  return '$' + Math.abs(n).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

// ── Subscription detection ────────────────────────────────────────────────────

const MONTH_IDX = { Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11 };

/**
 * Scan all transactions and return auto-detected recurring charges.
 * Detection criteria:
 *   • Same merchant name (case-insensitive)
 *   • All charges within 15% of the group median amount
 *   • Minimum amount: $3 (ignore tiny charges)
 *   • Minimum 3 occurrences (4 for Dining merchants)
 *   • Monthly: charges in 3+ distinct calendar months
 *   • Weekly / biweekly: 3+ charges in the same month with ~7 or ~14 day gaps
 *   • Last charge must be within 60 days (otherwise skip entirely)
 *   • "Possibly cancelled" only when last charge was 45–60 days ago
 * Transactions are assumed to be sorted newest-first (Supabase default).
 */
export function detectSubscriptions(transactions) {
  const now = new Date();

  // Group expenses by lowercase merchant name
  const groups = {};
  for (const t of transactions) {
    if (t.amt >= 0) continue;
    const key = t.name.toLowerCase().trim();
    (groups[key] = groups[key] || []).push(t);
  }

  const subs = [];
  for (const txns of Object.values(groups)) {
    if (txns.length < 3) continue;

    // Check amount similarity — all within 15% of the median
    const amts = txns.map((t) => Math.abs(t.amt)).sort((a, b) => a - b);
    const med = amts[Math.floor(amts.length / 2)];
    // Skip if too cheap to be a real subscription or amounts aren't similar
    if (med < 3 || !amts.every((a) => Math.abs(a - med) / med <= 0.15)) continue;

    // Dining merchants need 4+ occurrences to avoid flagging restaurant visits
    const cat = txns[0].cat || '';
    const minCount = cat === 'Dining' ? 4 : 3;
    if (txns.length < minCount) continue;

    // Determine frequency
    const uniqueMonths = new Set(txns.map((t) => (t.date || '').slice(0, 3)));
    let frequency = null;

    if (uniqueMonths.size >= 3) {
      frequency = 'monthly';
    } else if (uniqueMonths.size <= 2) {
      // Check day spacing within the same month for weekly / biweekly
      const days = txns
        .map((t) => parseInt((t.date || '').split(' ')[1]) || 0)
        .sort((a, b) => a - b);
      const gaps = days.slice(1).map((d, i) => d - days[i]);
      const avgGap = gaps.reduce((s, g) => s + g, 0) / (gaps.length || 1);
      if (avgGap >= 6 && avgGap <= 8)        frequency = 'weekly';
      else if (avgGap >= 12 && avgGap <= 16) frequency = 'biweekly';
    }

    if (!frequency) continue;

    // Most recent transaction (array is newest-first from Supabase)
    const latest = txns[0];
    const [latestMon, latestDayStr] = (latest.date || '').split(' ');
    const latestMonIdx = MONTH_IDX[latestMon] ?? now.getMonth();
    const latestDay = parseInt(latestDayStr) || 1;

    // Approximate days since last charge (assumes current year; adjusts for past-year dates)
    const latestDate = new Date(now.getFullYear(), latestMonIdx, latestDay);
    if (latestDate > now) latestDate.setFullYear(now.getFullYear() - 1);
    const daysSince = Math.round((now - latestDate) / 86400000);

    // Skip entirely if no charge in the last 60 days — probably cancelled long ago
    if (daysSince > 60) continue;

    subs.push({
      name: txns[0].name,
      amt: med,
      frequency,
      lastCharged: latest.date,
      // Only flag as possibly cancelled if 45–60 days since last charge
      possibleCancelled: daysSince > 45,
    });
  }

  // Highest cost first
  return subs.sort((a, b) => b.amt - a.amt);
}
