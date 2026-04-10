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

/** Labels for the last n months, ending with the current month. */
export function getLastNMonthLabels(n = 6) {
  const now = new Date();
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (n - 1) + i, 1);
    return ABBRS[d.getMonth()];
  });
}

/** '$1,234' formatter — absolute value, zero decimals */
export function fmtDollars(n) {
  return '$' + Math.abs(n).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}
