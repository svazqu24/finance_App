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

// Most-specific patterns come first so exact + partial matching
// always prefers the right column when a header like "Posting Date" exists
// alongside a more generic column that also contains the word "date".
const DATE_PATTERNS  = [
  'posting date',      // Chase checking  (most specific — must beat generic "date")
  'transaction date',  // Chase credit, Mint, many others
  'trans date',
  'posted date',
  'trans.date',
  'date',              // generic — kept last to avoid false positives
];
const DESC_PATTERNS  = [
  'description',
  'original description',
  'transaction description',
  'memo',
  'payee',
  'merchant',
  'narrative',
  'name',
  'details',           // kept last — Chase "Details" col is type, not description
];
const AMT_PATTERNS   = ['amount', 'transaction amount', 'amt', 'net amount'];
const DEBIT_PATTERNS = ['debit', 'debit amount', 'withdrawal', 'withdrawal amount', 'debit/credit'];
const CREDIT_PATTERNS= ['credit', 'credit amount', 'deposit', 'deposit amount'];

function matchIdx(headers, patterns) {
  const lc = headers.map((h) => h.toLowerCase().trim());
  // Exact match first (order of patterns matters)
  for (const p of patterns) {
    const i = lc.indexOf(p);
    if (i !== -1) return i;
  }
  // Partial/contains match (same priority order)
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

// ── Description cleaning ──────────────────────────────────────────────────────

// US state abbreviations used as an anchor to strip trailing city+state blocks.
// We match the state as a whole word at end-of-string so "SHELL OIL" (ends in
// "IL" but not " IL") and "HOLIDAY INN" (ends in "INN" not " IN") are safe.
const TRAILING_LOCATION_RE = new RegExp(
  String.raw`\s+(?:[A-Z]+\s+){0,2}` +
  String.raw`(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|` +
  String.raw`MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|` +
  String.raw`SD|TN|TX|UT|VT|VA|WA|WV|WI|WY|DC)$`
);

const SMALL_WORDS = new Set([
  'a','an','the','and','but','or','for','nor','on','at','to','by','in','of','up','as','is','it',
]);

function toTitleCase(s) {
  return s
    .toLowerCase()
    .split(' ')
    .map((w, i) => (!w || (i > 0 && SMALL_WORDS.has(w)))
      ? w
      : w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

// Verbose bank transfer descriptions — matched at the start of the raw string.
// When one matches, we short-circuit and return just the core label.
const TRANSFER_PATTERNS = [
  [/^online\s+transfer\b/i,               'Online Transfer'],
  [/^wire\s+transfer\b/i,                 'Wire Transfer'],
  [/^ach\s+(?:transfer|credit|debit)\b/i, 'ACH Transfer'],
  [/^internal\s+transfer\b/i,             'Internal Transfer'],
  [/^zelle\b/i,                           'Zelle Payment'],
  [/^direct\s+deposit\b/i,               'Direct Deposit'],
  [/^mobile\s+(?:check\s+)?deposit\b/i,   'Mobile Deposit'],
];

/**
 * Clean a raw bank description into a human-readable merchant name.
 *
 * Handles Chase-style suffixes and common bank noise:
 *   "PANERA BREAD #606393 K CHICAGO IL 04/09"              → "Panera Bread"
 *   "PANERA BREAD 773-342-2804"                             → "Panera Bread"
 *   "MCDONALDS 6298"                                        → "Mcdonalds"
 *   "PAYPAL *MICROSOFT"                                     → "Paypal Microsoft"
 *   "Online Transfer From Chk ...8601 Transaction#: 123"   → "Online Transfer"
 *   "NETFLIX.COM 04/09"                                     → "Netflix"
 */
export function cleanDescription(raw) {
  if (!raw) return '';
  let s = raw.trim();

  // 0. Short-circuit for verbose bank transfer descriptions
  for (const [re, label] of TRANSFER_PATTERNS) {
    if (re.test(s)) return label;
  }

  // 1. Strip transaction/confirmation reference tokens and account fragments
  //    "Transaction#: 20488335973"  →  gone
  //    "Chk ...8601", "Sav ...1234" →  gone
  s = s.replace(/\b(?:transaction|confirmation|reference|ref|conf)#?\s*:?\s*[\w-]+/gi, '');
  s = s.replace(/\b(?:chk|sav|acct|account)\s*\.{0,3}\s*\d+/gi, '');

  // 2. Strip trailing MM/DD date fragment Chase appends to every transaction
  s = s.replace(/\s+\d{2}\/\d{2}$/, '');

  // 3. Strip trailing city + state block (uses known state list as anchor)
  //    Removes up to 2 preceding all-caps words (city / noise code) + state.
  //    e.g. "K CHICAGO IL" → gone; "SAN FRANCISCO CA" → gone
  s = s.replace(TRAILING_LOCATION_RE, '');

  // 4. Strip phone numbers in NNN-NNN-NNNN, NNN.NNN.NNNN, or NNN NNN NNNN format
  s = s.replace(/\b\d{3}[.\-\s]\d{3}[.\-\s]\d{4}\b/g, '');

  // 5. Replace * with a space ("PAYPAL *MICROSOFT" → "PAYPAL MICROSOFT")
  //    Handles AMEX-style "UBER* EATS" and PayPal vendor asterisks.
  //    Note: step 6 still catches #DIGITS; this step handles * before text.
  s = s.replace(/\s*\*\s*/g, ' ');

  // 6. Strip store/reference numbers that follow # (e.g. "#606393")
  s = s.replace(/\s*#\d+/g, '');

  // 7. Strip long all-digit sequences (≥6 digits: account refs, confirmation numbers)
  s = s.replace(/\b\d{6,}\b/g, '');

  // 8. Strip trailing standalone short numbers (3–5 digits) — store location codes
  //    "MCDONALDS 6298" → "MCDONALDS"
  //    Runs after phone removal so remnants of stripped phone numbers are gone.
  s = s.replace(/\s+\d{3,5}(?=\s|$)/g, '');

  // 9. Strip standalone single capital letters (Chase noise codes like "K")
  s = s.replace(/(?:^|\s)\b[A-Z]\b(?=\s|$)/g, ' ');

  // 10. Strip domain/URL fragments (e.g. "AMZN.COM/BI", ".COM")
  s = s.replace(/\s*\S+\.(com|net|org|io|co)(\S*)?/gi, '');

  // 11. Strip trailing punctuation and separator characters left after cleanup
  s = s.replace(/[\s:.,#\-]+$/, '');

  // 12. Normalize whitespace
  s = s.replace(/\s+/g, ' ').trim();

  // Safety fallback: if everything was stripped, title-case first 3 words of original
  if (!s) return toTitleCase(raw.trim().split(/\s+/).slice(0, 3).join(' '));

  return toTitleCase(s);
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
    const name = cleanDescription(String(cells[mapping.descCol] || ''));
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
