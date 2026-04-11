const ABBRS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// ── CSV parsing ───────────────────────────────────────────────────────────────

/** Parse raw CSV text into an array of string arrays (rows of cells).
 *  Handles quoted fields, embedded commas, and CRLF/LF line endings.
 */
export function parseCSV(text) {
  // Strip UTF-8 BOM if present
  text = text.replace(/^\uFEFF/, '');
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim().split('\n');
  return lines.filter((l) => l.trim()).map(parseLine);
}

function parseLine(line) {
  const result = [];
  let cur = '';
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      // escaped double-quote inside a quoted field
      if (inQuote && line[i + 1] === '"') { cur += '"'; i++; }
      else inQuote = !inQuote;
    } else if (ch === ',' && !inQuote) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  result.push(cur.trim());
  return result;
}

// ── Column detection ──────────────────────────────────────────────────────────

const DATE_PATTERNS  = ['date', 'transaction date', 'trans date', 'posted date', 'posting date', 'trans.date'];
const DESC_PATTERNS  = ['description', 'memo', 'payee', 'merchant', 'name', 'narrative',
                        'original description', 'transaction description', 'details'];
const AMT_PATTERNS   = ['amount', 'transaction amount', 'amt', 'net amount'];
const DEBIT_PATTERNS = ['debit', 'debit amount', 'withdrawal', 'withdrawal amount', 'debit/credit'];
const CREDIT_PATTERNS= ['credit', 'credit amount', 'deposit', 'deposit amount'];

function matchIdx(headers, patterns) {
  const lc = headers.map((h) => h.toLowerCase().trim());
  // Exact match first
  for (const p of patterns) {
    const i = lc.indexOf(p);
    if (i !== -1) return i;
  }
  // Partial/contains match
  for (const p of patterns) {
    const i = lc.findIndex((h) => h.includes(p));
    if (i !== -1) return i;
  }
  return -1;
}

/**
 * Returns a partial mapping object.
 * Caller can tell auto-detect succeeded when dateCol, descCol, and either
 * amtCol != -1 (single mode) or both debitCol+creditCol != -1 (debitcredit mode).
 */
export function detectColumns(headers) {
  const dateCol  = matchIdx(headers, DATE_PATTERNS);
  const descCol  = matchIdx(headers, DESC_PATTERNS);
  const amtCol   = matchIdx(headers, AMT_PATTERNS);
  const debitCol = matchIdx(headers, DEBIT_PATTERNS);
  const creditCol= matchIdx(headers, CREDIT_PATTERNS);

  const hasDebitCredit = debitCol !== -1 && creditCol !== -1;
  const amtMode = hasDebitCredit && amtCol === -1 ? 'debitcredit' : 'single';
  const resolvedAmtCol = amtMode === 'single' ? (amtCol !== -1 ? amtCol : -1) : -1;

  return {
    dateCol,
    descCol,
    amtMode,
    amtCol:  resolvedAmtCol,
    debitCol: hasDebitCredit ? debitCol : -1,
    creditCol: hasDebitCredit ? creditCol : -1,
    signConvention: 'negative-expense',
  };
}

export function isAutoDetectComplete(mapping) {
  if (mapping.dateCol === -1 || mapping.descCol === -1) return false;
  if (mapping.amtMode === 'single')      return mapping.amtCol !== -1;
  if (mapping.amtMode === 'debitcredit') return mapping.debitCol !== -1 && mapping.creditCol !== -1;
  return false;
}

// ── Amount parsing ────────────────────────────────────────────────────────────

/** Parse a currency string to a float. Returns 0 for empty/null. */
export function parseAmount(str) {
  if (str === null || str === undefined || str === '') return 0;
  // Handle accounting negative: (123.45) → -123.45
  const s = String(str).trim().replace(/\((.+)\)/, '-$1').replace(/[$,\s]/g, '');
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

/**
 * Compute the signed app amount from a row given the column mapping.
 * App convention: negative = expense, positive = income.
 */
export function computeAmount(cells, mapping) {
  if (mapping.amtMode === 'debitcredit') {
    const debit  = parseAmount(cells[mapping.debitCol]);
    const credit = parseAmount(cells[mapping.creditCol]);
    // Debit column = money going out (expense), Credit = money coming in (income)
    if (debit > 0)  return -Math.abs(debit);
    if (credit > 0) return  Math.abs(credit);
    return 0;
  }
  // Single amount column
  const raw = parseAmount(cells[mapping.amtCol]);
  return mapping.signConvention === 'positive-expense' ? -raw : raw;
}

// ── Date parsing ─────────────────────────────────────────────────────────────

/** Parse a date string in common bank formats and return a JS Date, or null. */
export function parseDate(str) {
  if (!str) return null;
  const s = String(str).trim().replace(/['"]/g, '');

  // ISO: 2026-04-11
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3]);

  // MM/DD/YYYY or MM/DD/YY
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (m) {
    const yr = m[3].length === 2 ? 2000 + +m[3] : +m[3];
    return new Date(yr, +m[1] - 1, +m[2]);
  }

  // MM-DD-YYYY
  m = s.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (m) return new Date(+m[3], +m[1] - 1, +m[2]);

  // "April 11, 2026" or "Apr 11, 2026"
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

/** Convert a JS Date to the app's stored format: 'Apr 11' */
export function dateToAppFmt(d) {
  if (!d) return '';
  return `${ABBRS[d.getMonth()]} ${d.getDate()}`;
}

// ── Category guessing ─────────────────────────────────────────────────────────

const CATEGORY_RULES = [
  { re: /walmart|trader joe|whole foods|kroger|safeway|aldi|publix|wegmans|sprouts|h-e-b|ralph|vons|jewel|food lion|giant|market basket|grocery|supermarket/i, cat: 'Groceries' },
  { re: /netflix|spotify|hulu|disney\+?|peacock|paramount\+?|apple\.com\/bill|apple\.com\/us|prime video|youtube premium|hbo|subscription|t-mobile|verizon|at&t|comcast|xfinity|spectrum|wireless/i, cat: 'Subscriptions' },
  { re: /doordash|grubhub|uber eats|postmates|instacart|seamless|chipotle|mcdonald|burger king|wendy|taco bell|chick.fil|panera|subway|starbucks|dunkin|peet|coffee|restaurant|dining|pizza|sushi|thai|noodle|bbq|cafe|bar |tavern|eatery/i, cat: 'Dining' },
  { re: /uber(?! eats)|lyft|cta |ventra|mta |bart |metro |transit|amtrak|greyhound|shell|bp |exxon|chevron|sunoco|mobil|speedway|casey|marathon |fuel|gas station|parking|divvy|bird |lime /i, cat: 'Transport' },
  { re: /delta air|united air|american air|southwest|jetblue|spirit air|frontier|allegiant|airbnb|vrbo|marriott|hilton|hyatt|sheraton|westin|holiday inn|expedia|booking\.com|hotels\.com|kayak/i, cat: 'Travel' },
  { re: /walgreen|cvs|rite aid|pharmacy|rx|dental|dentist|optometry|doctor|physician|hospital|urgent care|health|medical|anthem|cigna|blue cross|kaiser|gym|planet fitness|la fitness|equinox|ymca/i, cat: 'Health' },
  { re: /amazon|ebay|etsy|shopify|best buy|apple store|nordstrom|macy|bloomingdale|saks|neiman|gap|old navy|banana republic|h&m|zara|uniqlo|tj maxx|ross dress|marshalls|target(?! pharmacy)/i, cat: 'Shopping' },
  { re: /comed|pg&e|con ed|national grid|duke energy|dominion|dte |consumers energy|electric|water (?:bill|co|company|dept)|sewage|utility|utilities/i, cat: 'Utilities' },
  { re: /geico|progressive|state farm|allstate|liberty mutual|nationwide|usaa|travelers |insurance|aaa /i, cat: 'Insurance' },
  { re: /rent |mortgage|hoa |homeowner|lease |landlord|property management/i, cat: 'Housing' },
  { re: /salary|payroll|direct dep|paycheck|employer|w-2|1099|freelance|invoice|consulting|dividend|interest income|refund/i, cat: 'Income' },
];

/** Guess a category from a merchant/description string. Defaults to 'Shopping'. */
export function guessCategory(desc) {
  if (!desc) return 'Shopping';
  for (const { re, cat } of CATEGORY_RULES) {
    if (re.test(desc)) return cat;
  }
  return 'Shopping';
}

// ── Row building ──────────────────────────────────────────────────────────────

/**
 * Convert raw CSV data rows (string[][]) into preview rows using the column mapping.
 * @param {string[][]} rows - data rows (no header)
 * @param {object} mapping
 * @returns {{ name, date, amt, cat, _key }[]}
 */
export function buildRows(rows, mapping) {
  const result = [];
  for (let i = 0; i < rows.length; i++) {
    const cells = rows[i];
    const name = String(cells[mapping.descCol] || '').trim();
    const rawDate = cells[mapping.dateCol] || '';
    const parsed  = parseDate(rawDate);
    const date    = parsed ? dateToAppFmt(parsed) : rawDate;
    const amt     = computeAmount(cells, mapping);
    // Skip rows with no name or zero amount
    if (!name || amt === 0) continue;
    const cat = amt > 0 ? 'Income' : guessCategory(name);
    result.push({ _key: i, name, date, amt, cat });
  }
  return result;
}
