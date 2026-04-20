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
const CAT_PATTERNS   = ['category', 'transaction category', 'spend category'];

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
  const catCol   = matchIdx(headers, CAT_PATTERNS);

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
    catCol,
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

// ── Merchant name aliases ─────────────────────────────────────────────────────
// Maps lowercased cleaned names → correctly-formatted display names.
// Use this for: apostrophes that can't be inferred, brand capitalization,
// and Chipotle payroll codes (CHIPGRIL = Chipotle's ACH payroll descriptor).
const MERCHANT_ALIASES = {
  "ellys brunch":       "Elly's Brunch",
  "ellys":              "Elly's",
  'chipgril':           'Chipotle Payroll',
  'chipgril payments':  'Chipotle Payroll',
  'chipotle payroll':   'Chipotle Payroll',
  "mcdonalds":          "McDonald's",
  "wendy's":            "Wendy's",
  "wendys":             "Wendy's",
  "chick-fil-a":        'Chick-fil-A',
  "chick fil a":        'Chick-fil-A',
  "chickfila":          'Chick-fil-A',
  "trader joe's":       "Trader Joe's",
  "trader joes":        "Trader Joe's",
  "mcdonald's":         "McDonald's",
  "denny's":            "Denny's",
  "dennys":             "Denny's",
  "peet's coffee":      "Peet's Coffee",
  "peets coffee":       "Peet's Coffee",
  "ruth's chris":       "Ruth's Chris",
  "arby's":             "Arby's",
  "arbys":              "Arby's",
  "hardee's":           "Hardee's",
  "hardees":            "Hardee's",
  "hbomax.com ny":      "HBO Max",
  "help.hbomax.com hbomax.com ny": "HBO Max",
  "hbomax":             "HBO Max",
  "help.max.com":       "Max",
  "culver's":           "Culver's",
  "culvers":            "Culver's",
  "whataburger":        'Whataburger',
  "moe's southwest":    "Moe's Southwest Grill",
  "papa john's":        "Papa John's",
  "papa johns":         "Papa John's",
  "marco's pizza":      "Marco's Pizza",
  "applebee's":         "Applebee's",
  "applebees":          "Applebee's",
  "chili's":            "Chili's",
  "chilis":             "Chili's",
  "dine brands":        'Dine Brands',
  "help.hbomax.com hbomax.com ny": "HBO Max",
  "sezzle inc sezzle": "Sezzle",
  "sezzle inc":        "Sezzle",
  "sezzle":            "Sezzle",
};

// Bank transfer descriptions — short-circuit when matched at start of string.
const TRANSFER_PATTERNS = [
  [/^online\s+transfer\b/i,    'Online Transfer'],
  [/^wire\s+transfer\b/i,      'Wire Transfer'],
  [/^ach\s+transfer\b/i,       'ACH Transfer'],   // "ach transfer" only — not "ach credit/debit" (may be payroll)
  [/^internal\s+transfer\b/i,  'Internal Transfer'],
  [/^zelle\b/i,                'Zelle Payment'],
  [/^direct\s+deposit\b/i,     'Direct Deposit'],
  [/^mobile\s+(?:check\s+)?deposit\b/i, 'Mobile Deposit'],
];

/**
 * Clean a raw bank description into a human-readable merchant name.
 *
 *   "PANERA BREAD #606393 K CHICAGO IL 04/09"              → "Panera Bread"
 *   "TST* STARBUCKS #123"                                  → "Starbucks"
 *   "SQ *LOCAL COFFEE SHOP"                                → "Local Coffee Shop"
 *   "PANERA BREAD 773-342-2804"                            → "Panera Bread"
 *   "MCDONALDS 6298"                                       → "Mcdonalds"
 *   "PAYPAL *MICROSOFT"                                    → "Paypal Microsoft"
 *   "Online Transfer From Chk ...8601 Transaction#: 123"  → "Online Transfer"
 *   "NETFLIX.COM 04/09"                                    → "Netflix"
 */
export function cleanDescription(raw) {
  if (!raw) return '';
  if (!cleanDescription.reimportNoteShown) {
    console.info('[fintrack] Re-import your CSVs to get updated merchant names');
    cleanDescription.reimportNoteShown = true;
  }

  let s = raw.trim();

  const reversalMatch = s.match(/^reversal:\s*(.+)$/i);
  if (reversalMatch) {
    return `Refund — ${cleanDescription(reversalMatch[1])}`;
  }

  // 0a. Strip POS terminal prefixes — must run BEFORE transfer pattern check so
  //     "TST* ONLINE TRANSFER" correctly triggers the transfer short-circuit.
  //     TST* = Toast POS, SQ* = Square, SPK* = Spark
  s = s.replace(/^(?:TST|SQ|SPK)\s*\*\s*/i, '');

  // 0a.1 Strip PP* payment descriptors without leaving the code behind.
  s = s.replace(/^pp\*\s*/i, '');

  // 0b. Strip ACH/PPD entry class descriptors Chase/banks append after merchant name
  //     e.g. "EMPLOYER NAME PPD ID: 123456" → "EMPLOYER NAME"
  s = s.replace(/\s+PPD\s+Id\b.*/i, '');

  // 0b. Short-circuit for verbose bank transfer descriptions
  for (const [re, label] of TRANSFER_PATTERNS) {
    if (re.test(s)) return label;
  }

  // 1. Strip transaction/confirmation reference tokens and account fragments
  s = s.replace(/\b(?:transaction|confirmation|reference|ref|conf)#?\s*:?\s*[\w-]+/gi, '');
  s = s.replace(/\b(?:chk|sav|acct|account)\s*\.{0,3}\s*\d+/gi, '');

  // 2. Strip trailing MM/DD date fragment Chase appends to every transaction
  s = s.replace(/\s+\d{2}\/\d{2}$/, '');

  // 3. Strip trailing city + state block (up to 2 preceding all-caps words + state)
  s = s.replace(TRAILING_LOCATION_RE, '');

  // 4. Strip phone numbers in NNN-NNN-NNNN, NNN.NNN.NNNN, or NNN NNN NNNN format
  s = s.replace(/\b\d{3}[.\-\s]\d{3}[.\-\s]\d{4}\b/g, '');

  // 5. Replace * with a space ("PAYPAL *MICROSOFT" → "PAYPAL MICROSOFT")
  s = s.replace(/\s*\*\s*/g, ' ');

  // 6. Strip store/reference numbers that follow # (e.g. "#606393")
  s = s.replace(/\s*#\d+/g, '');

  // 7. Strip long all-digit sequences (≥6 digits)
  s = s.replace(/\b\d{6,}\b/g, '');

  // 8. Strip trailing standalone short numbers (3–5 digits) — store location codes
  s = s.replace(/\s+\d{3,5}(?=\s|$)/g, '');

  // 9. Strip standalone single capital letters (Chase noise codes like "K")
  s = s.replace(/(?:^|\s)\b[A-Z]\b(?=\s|$)/g, ' ');

  // 9.1 Collapse repeated merchant tokens — e.g. "Max Max" → "Max".
  s = s.replace(/\b(\w+)(?:\s+\1\b)+/gi, '$1');

  // 10. Strip domain/URL fragments (e.g. "AMZN.COM/BI", ".COM") while preserving base tokens.
  s = s.replace(/\b([A-Z0-9-]+)(?:\.(?:com|net|org|io|co))(?:[\/\s]\S*)?/gi, '$1');

  // 10.1 Short-circuit known help domain patterns to the base merchant label.
  s = s.replace(/\bhelp\.(hbomax|max)(?:\.com)?\b/i, '$1');

  // 11. Strip trailing punctuation and separator characters left after cleanup
  s = s.replace(/[\s:.,#\-]+$/, '');

  // 12. Normalize whitespace
  s = s.replace(/\s+/g, ' ').trim();

  // Safety fallback: if everything was stripped, title-case first 3 words of original
  if (!s) return toTitleCase(raw.trim().split(/\s+/).slice(0, 3).join(' '));

  const titled = toTitleCase(s);
  return MERCHANT_ALIASES[titled.toLowerCase()] ?? titled;
}

// ── Chase credit card category mapping ───────────────────────────────────────

/** Map Chase credit card category labels → FinTrack categories. */
export const CHASE_CC_CATEGORY_MAP = {
  'food & drink':      'Dining',
  'shopping':          'Shopping',
  'travel':            'Travel',
  'bills & utilities': 'Utilities',
  'entertainment':     'Subscriptions',
  'health & wellness': 'Health',
  'groceries':         'Groceries',
  'gas':               'Transport',
  'home':              'Housing',
  'payment':           'Income',
  'transfer':          'Transfer',
};

// ── Merchant database ─────────────────────────────────────────────────────────
//
// Organized by category for easy expansion. Each entry is a lowercase substring
// matched against the cleaned, lowercased description.
// ORDER MATTERS: categories are checked in CATEGORY_ORDER below; first match wins.
// Place more-specific terms (e.g. "uber eats") before broader ones (e.g. "uber").
//
export const MERCHANT_DB = {

  // ── Transfers ────────────────────────────────────────────────────────────────
  // Checked first so transfers are never misclassified as Income or Shopping.
  Transfer: [
    'online transfer', 'wire transfer', 'ach transfer', 'internal transfer',
    'account transfer', 'bank transfer', 'funds transfer',
    'zelle', 'venmo', 'cash app', 'cashapp', 'cash.app',
  ],

  // ── Income ───────────────────────────────────────────────────────────────────
  Income: [
    'salary', 'payroll', 'direct deposit', 'mobile deposit', 'paycheck',
    'direct dep', 'ppd id', ' ppd ', 'freelance', 'consulting fee',
    'dividend', 'interest income', 'tax refund', 'reimbursement', '1099',
    'chipgril',  // Chipotle's ACH payroll descriptor
  ],

  // ── Groceries ────────────────────────────────────────────────────────────────
  // Checked before Dining so "instacart" and "amazon fresh" → Groceries.
  Groceries: [
    'walmart', 'trader joe', 'whole foods', 'wholefds',
    'kroger', 'safeway', 'aldi', 'publix', 'wegmans', 'sprouts',
    'h-e-b', 'heb store', "ralph's", 'ralphs', 'vons',
    'jewel-osco', 'jewel osco', 'food lion', 'market basket',
    'stop & shop', 'stop and shop', 'harris teeter', 'winn-dixie',
    'winco foods', 'save-a-lot', 'meijer', 'hy-vee', 'price chopper',
    'stater bros', 'piggly wiggly', 'food 4 less', 'smart & final',
    'hannaford', 'shoprite', 'king soopers', 'grocery outlet',
    'natural grocers', 'fresh thyme', 'earth fare', 'fresh market',
    "sam's club", 'costco', "bj's wholesale", 'bjs wholesale',
    'instacart', 'amazon fresh',
    'grocery', 'supermarket',
  ],

  // ── Dining ───────────────────────────────────────────────────────────────────
  // Checked before Transport so "uber eats" → Dining, not Transport.
  Dining: [
    // Delivery platforms
    'doordash', 'grubhub', 'uber eats', 'seamless', 'gopuff', 'caviar',
    // Coffee & bakeries
    'starbucks', 'dunkin', "peet's coffee", 'peets coffee', 'dutch bros',
    'tim horton', 'caribou coffee', 'einstein bagel', 'philz coffee',
    'blue bottle', 'the coffee bean', 'coffee beanery', "panera",
    // Fast food / QSR
    'mcdonald', 'burger king', "wendy's", 'wendys', 'taco bell',
    'chick-fil-a', 'chick fil a', 'chickfila',
    'popeyes', "popeye's", 'kfc', 'sonic drive',
    'jack in the box', "arby's", 'arbys', 'five guys',
    'in-n-out', 'whataburger', "hardee's", "carl's jr",
    'dairy queen', "culver's", 'steak n shake',
    'shake shack', 'smashburger', 'habit burger', 'portillo',
    'raising cane', "zaxby's", 'cookout',
    // Mexican
    'chipotle', 'qdoba', 'taco cabana', 'del taco', 'baja fresh',
    "moe's southwest", 'taqueria', 'taco ', 'burrito',
    // Pizza
    'domino', 'pizza hut', "papa john", 'little caesars', "papa murphy",
    "round table pizza", 'marco\'s pizza',
    // Subs & sandwiches
    'subway', 'jimmy john', 'jersey mike', 'firehouse sub',
    'potbelly', 'quiznos',
    // Casual / chain restaurants
    'noodles & company', "applebee's", "chili's", 'olive garden',
    'red lobster', 'ihop', "denny's", 'outback steakhouse',
    'texas roadhouse', 'cracker barrel', 'red robin', 'tgi friday',
    'bob evans', 'golden corral', 'buffalo wild wings', 'cheesecake factory',
    'pf chang', 'yard house', 'legal sea food', "ruth's chris",
    "bonefish grill", "longhorn steakhouse", "carrabba",
    'first watch', 'panda express', 'wingstop', 'raising cane',
    'el pollo loco', "dine brands",
    // Generic / keywords
    'restaurant', 'dining', 'sushi', 'ramen', 'pho ',
    'steakhouse', 'chophouse', 'trattoria', 'bistro', 'brasserie',
    'taproom', 'brewery', 'brew pub', 'eatery', 'pizzeria',
    'coffee', 'cafe', 'cantina', ' bar ', ' bar,',
    'grill', 'kitchen', 'bbq', 'noodle', 'thai food',
  ],

  // ── Transport ────────────────────────────────────────────────────────────────
  Transport: [
    // Ride share — "uber" after "uber eats" so Dining match wins for Uber Eats
    'uber', 'lyft',
    // Public transit
    'cta chicago', 'ventra', 'mta ', 'bart ', 'wmata', 'septa',
    'mbta', 'trimet', 'marta ', 'lacmta', 'njtransit', 'metra ',
    // Rail / bus
    'amtrak', 'greyhound', 'megabus',
    // Gas stations
    'shell ', 'bp ', 'exxon', 'chevron', 'sunoco', 'mobil ',
    'speedway', "casey's", 'marathon petro', 'kwik trip', 'kwiktrip',
    'wawa', 'sheetz', 'circle k', 'quiktrip', 'racetrac', 'valero',
    'arco ', 'citgo', "phillips 66", 'pilot flying j',
    "love's travel", 'holiday station',
    // Parking / tolls
    'parking', 'spothero', 'parkwhiz', 'parkmobile',
    'ipass', 'e-zpass', 'ezpass', 'sunpass', 'fastrak',
    // Bike & scooter share
    'divvy', 'bird ', 'lime ', 'citi bike', 'bluebikes', 'capital bikeshare',
    // Generic
    'fuel', 'gas station', 'auto fuel',
  ],

  // ── Travel ───────────────────────────────────────────────────────────────────
  Travel: [
    // Airlines
    'delta air', 'united air', 'american air', 'southwest air',
    'jetblue', 'spirit air', 'frontier airline', 'allegiant air',
    'alaska air', 'hawaiian air', 'sun country', 'breeze airways',
    // Hotels
    'airbnb', 'vrbo', 'marriott', 'hilton', 'hyatt', 'sheraton',
    'westin', 'holiday inn', 'hampton inn', 'courtyard marriott',
    'residence inn', 'fairfield inn', 'best western', 'motel 6',
    'super 8', 'days inn', 'wyndham', 'radisson', 'doubletree',
    'embassy suites', 'ritz carlton', 'four seasons',
    'kimpton', 'omni hotel', 'loews hotel',
    // Booking & OTAs
    'expedia', 'booking.com', 'hotels.com', 'kayak', 'priceline',
    'trivago', 'travelocity', 'orbitz', 'hotwire',
    // Car rental
    'hertz', 'avis ', 'budget car', 'enterprise rent',
    'national car rental', 'alamo rent', 'dollar rent', 'thrifty car',
  ],

  // ── Health ───────────────────────────────────────────────────────────────────
  Health: [
    // Pharmacy
    'walgreens', 'cvs', 'rite aid', 'duane reade', 'bartell drug', 'kinney drug',
    // Medical
    'pharmacy', 'dental', 'dentist', 'orthodont', 'optometry',
    'eye care', 'lenscrafters', 'visionworks', 'doctor', 'physician',
    'hospital', 'urgent care', 'emergency room', 'labcorp',
    'quest diagnostics', 'concentra', 'health clinic', 'health center',
    'healthcare', 'medical center',
    // Health insurance
    'anthem', 'cigna', 'blue cross', 'kaiser', 'united health',
    'aetna', 'humana', 'molina health', 'centene',
    // Fitness
    'planet fitness', 'la fitness', 'equinox', 'ymca',
    'anytime fitness', "gold's gym", '24 hour fitness',
    'orangetheory', 'orange theory', 'soulcycle', 'crunch fitness',
    'lifetime fitness', 'f45 training', 'classpass', 'peloton',
    'pure barre', "barry's bootcamp", 'solidcore',
    'gym ', ' gym',
  ],

  // ── Subscriptions ────────────────────────────────────────────────────────────
  Subscriptions: [
    // Video streaming
    'netflix', 'hulu', 'disney+', 'disney plus', 'peacock',
    'paramount+', 'paramount plus', 'hbo max', 'max.com',
    'prime video', 'amazon prime', 'apple tv+', 'apple tv plus',
    'crunchyroll', 'funimation', 'showtime', 'starz',
    'discovery+', 'espn+', 'fubo tv', 'sling tv', 'philo',
    // Music
    'spotify', 'youtube premium', 'youtube music', 'apple music',
    'tidal', 'pandora', 'amazon music', 'deezer',
    // Cloud / productivity
    'microsoft 365', 'office 365', 'google one', 'icloud storage',
    'dropbox', 'adobe creative', 'creative cloud', 'canva pro',
    // Reading / learning
    'audible', 'kindle unlimited', 'scribd', 'duolingo', 'babbel',
    // Wellness / apps
    'headspace', 'calm ', 'noom', 'calm app',
    // Mobile & internet carriers — after Utilities to avoid overlap
    't-mobile', 'verizon wireless', 'at&t wireless', 'comcast',
    'xfinity', 'spectrum', 'cox cable', 'optimum online',
    'frontier comm', 'google fi',
    // Generic
    'subscription', 'monthly plan',
  ],

  // ── Utilities ────────────────────────────────────────────────────────────────
  Utilities: [
    // Electric
    'comed', 'pg&e', 'pge ', 'con ed', 'coned', 'national grid',
    'duke energy', 'dominion energy', 'dte energy', 'consumers energy',
    'ameren', 'entergy', 'evergy', 'puget sound energy', 'pseg',
    'eversource', 'avangrid', 'firstenergy', 'xcel energy',
    'nv energy', 'hawaiian electric',
    // Gas utility (home heating/cooking)
    'nicor gas', 'peoples gas', 'atmos energy', 'spire energy',
    'columbia gas', 'centerpoint energy',
    // Water & sewer
    'water dept', 'water utility', 'water bill', 'sewage',
    // Trash
    'waste management', 'republic services', 'trash pickup',
    // Generic
    'electric bill', 'utilities',
  ],

  // ── Insurance ────────────────────────────────────────────────────────────────
  Insurance: [
    'geico', 'progressive', 'state farm', 'allstate',
    'liberty mutual', 'nationwide insurance', 'usaa', 'travelers ',
    'farmers insurance', 'american family insurance',
    'esurance', 'root insurance', 'metlife', 'new york life',
    'prudential', 'principal financial', 'guardian life',
    'aaa insurance', 'insurance',
  ],

  // ── Housing ──────────────────────────────────────────────────────────────────
  Housing: [
    'rent payment', 'rent ', 'mortgage', 'hoa dues', 'hoa ',
    'homeowner', 'lease payment', 'lease ', 'landlord',
    'property management', 'apartment fee',
  ],

  // ── Shopping (catch-all) ─────────────────────────────────────────────────────
  Shopping: [
    // E-commerce
    'amazon', 'ebay', 'etsy', 'shopify',
    // Electronics
    'best buy', 'apple store', 'microsoft store',
    'samsung store', 'b&h photo', 'adorama', 'newegg',
    // Department / apparel
    'nordstrom', "macy's", 'macys', 'bloomingdale', 'saks',
    'neiman marcus', 'gap', 'old navy', 'banana republic',
    'h&m', 'zara', 'uniqlo', 'forever 21', 'urban outfitters',
    'free people', 'anthropologie', 'j.crew',
    // Off-price
    'tj maxx', 'ross dress', 'marshalls', 'burlington coat',
    // Big box
    'target', "kohl's", 'kohls', 'jcpenney',
    "dick's sporting", 'academy sports',
    // Home improvement
    'home depot', "lowe's", 'lowes home', 'menards', 'ace hardware',
    // Home goods / furniture
    'ikea', 'wayfair', 'overstock', 'bed bath',
    'williams sonoma', 'crate and barrel', 'pottery barn', 'west elm',
    // Craft / hobby
    'michaels', 'hobby lobby', "jo-ann fabric",
    // Dollar / discount
    'dollar tree', 'dollar general', 'family dollar', 'five below',
    // Outdoor / sports
    'rei', 'bass pro', 'cabelas',
    // Fashion / athletic brands
    'nike', 'adidas', 'under armour', 'lululemon', 'patagonia',
    // Pet
    'chewy', 'petco', 'petsmart',
    // Auto parts
    'autozone', "o'reilly auto", 'advance auto', 'napa auto',
    // Books
    'barnes & noble',
  ],
};

// Categories are checked in this order — first match wins.
// Transfer and Income come first to avoid misclassifying known special transactions.
// Groceries before Dining (instacart = groceries), Dining before Transport (uber eats ≠ transport).
const CATEGORY_ORDER = [
  'Transfer', 'Income', 'Groceries', 'Dining', 'Transport',
  'Travel', 'Health', 'Subscriptions', 'Utilities', 'Insurance',
  'Housing', 'Shopping',
];

/** Guess a category from a cleaned merchant/description string. Defaults to 'Shopping'. */
export function guessCategory(desc) {
  if (!desc) return 'Shopping';
  const lc = desc.toLowerCase();
  for (const cat of CATEGORY_ORDER) {
    const terms = MERCHANT_DB[cat] || [];
    for (const term of terms) {
      if (lc.includes(term)) return cat;
    }
  }
  return 'Shopping';
}

// ── Account detection ─────────────────────────────────────────────────────────

/**
 * Detect account name from filename patterns.
 * Chase debit: filename contains 4-digit account number → "Chase ···XXXX"
 * Chase credit: filename contains specific patterns → { type: 'credit', name: 'Chase', lastFour: '8695' }
 */
export function detectAccount(filename) {
  if (!filename) return null;

  const name = filename.toLowerCase();

  // Chase debit account detection - look for 4-digit numbers in filename
  const chaseDebitMatch = name.match(/(\d{4})/);
  if (chaseDebitMatch && name.includes('chase')) {
    // Check if it's likely a debit file (not credit)
    if (!name.includes('credit') && !name.includes('cc') && !name.includes('card')) {
      return { type: 'checking', name: `Chase ···${chaseDebitMatch[1]}` };
    }
  }

  // Chase credit account detection - specific patterns
  if (name.includes('chase') && (name.includes('credit') || name.includes('cc') || name.includes('card'))) {
    // Look for 4-digit account ending (common pattern)
    const creditMatch = name.match(/(\d{4})/);
    if (creditMatch) {
      return { type: 'credit', name: 'Chase', lastFour: creditMatch[1] };
    }
    // Fallback for credit cards without visible account number
    return { type: 'credit', name: 'Chase Credit' };
  }

  return null;
}

// ── Row building ──────────────────────────────────────────────────────────────

/**
 * Convert raw CSV data rows (string[][]) into preview rows using the column mapping.
 * @param {string[][]} rows - data rows (no header)
 * @param {object} mapping
 * @param {object|null} categoryMap - optional map of raw category string → app category
 *   (used for Chase CC imports; applied as fallback for unrecognized merchants)
 * @param {string|null} filename - optional filename for account detection
 * @returns {{ name, date, amt, cat, account?, _key }[]}
 */
export function buildRows(rows, mapping, categoryMap = null, filename = null) {
  const accountInfo = detectAccount(filename);
  const account = accountInfo?.name || null;
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

    const guessed = guessCategory(name);
    let cat;

    if (guessed === 'Transfer') {
      // Transfers override amount-based heuristics (both directions are transfers)
      cat = 'Transfer';
    } else if (amt > 0) {
      // Positive amounts are always income after the transfer check
      cat = 'Income';
    } else {
      // Expense: use our merchant DB result if specific (not generic Shopping),
      // otherwise fall back to the Chase CC category column as a hint.
      if (guessed !== 'Shopping') {
        cat = guessed;
      } else if (categoryMap && mapping.catCol >= 0 && cells[mapping.catCol]) {
        const rawCat = String(cells[mapping.catCol]).toLowerCase().trim();
        cat = categoryMap[rawCat] || 'Shopping';
      } else {
        cat = 'Shopping';
      }
    }

    const row = { _key: i, name, date, amt, cat };
    if (account) row.account = account;
    result.push(row);
  }
  return { rows: result, accountInfo };
}
