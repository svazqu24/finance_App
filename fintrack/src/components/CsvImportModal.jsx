import { useState, useEffect, useRef } from 'react';
import { useApp } from '../AppContext';
import {
  parseCSV, detectColumns, isAutoDetectComplete,
  buildRows, computeAmount, parseAmount,
  cleanDescription, CHASE_CC_CATEGORY_MAP,
} from '../utils/csvParser';

// ── Constants ─────────────────────────────────────────────────────────────────

const ALL_CATS = [
  'Housing', 'Groceries', 'Dining', 'Subscriptions', 'Travel',
  'Transport', 'Health', 'Shopping', 'Utilities', 'Insurance', 'Income', 'Transfer',
];

const inputCls =
  'w-full border border-gray-200 dark:border-nero-border rounded-lg px-3 py-2 text-sm ' +
  'bg-white dark:bg-nero-bg text-gray-900 dark:text-white ' +
  'outline-none focus:border-gray-400 dark:focus:border-gray-400 transition-colors';

const labelCls = 'text-[11px] uppercase tracking-[.08em] text-gray-400 block mb-1';

const DEFAULT_MAPPING = {
  dateCol: -1,
  descCol: -1,
  amtMode: 'single',
  amtCol: -1,
  debitCol: -1,
  creditCol: -1,
  catCol: -1,
  signConvention: 'negative-expense',
};

// ── Helper components ─────────────────────────────────────────────────────────

function ColSelect({ label, value, onChange, headers, placeholder = '— select —' }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <select value={value} onChange={(e) => onChange(Number(e.target.value))} className={inputCls}>
        <option value={-1}>{placeholder}</option>
        {headers.map((h, i) => (
          <option key={i} value={i}>{h || `Column ${i + 1}`}</option>
        ))}
      </select>
    </div>
  );
}

function UploadIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300 dark:text-gray-600">
      <polyline points="16 16 12 12 8 16" />
      <line x1="12" y1="12" x2="12" y2="21" />
      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#27AE60"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function SummaryRow({ icon, label, value, highlight }) {
  return (
    <div
      className="flex items-center justify-between px-4 py-3 border-b border-gray-50 dark:border-nero-border last:border-b-0"
      style={highlight ? { background: 'rgba(39,174,96,0.06)' } : {}}
    >
      <div className="flex items-center gap-2.5">
        <span className="text-base leading-none w-4 text-center">{icon}</span>
        <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
      </div>
      <span
        className="text-sm font-semibold tabular-nums"
        style={{ color: highlight ? '#27AE60' : undefined }}
      >
        {value}
      </span>
    </div>
  );
}

// ── Account detection ─────────────────────────────────────────────────────────

/** Extract account label purely from filename, without needing the format. */
function detectAccountFromFile(filename) {
  if (!filename) return null;
  const lower = filename.toLowerCase().replace(/\.(csv)$/i, '');
  const digits4 = lower.match(/\b(\d{4})\b/);
  const last4 = digits4 ? digits4[1] : null;
  if (lower.includes('chase')) {
    const isCredit = lower.includes('credit') || lower.includes(' cc') || lower.includes('card');
    if (isCredit) return last4 ? `Chase Credit ···${last4}` : 'Chase Credit';
    return last4 ? `Chase ···${last4}` : 'Chase Checking';
  }
  return null;
}

// ── Chase format detection ────────────────────────────────────────────────────

function isChaseFormat(hdrs) {
  const lc = new Set(hdrs.map((h) => h.toLowerCase().trim()));
  return (
    lc.has('details') &&
    lc.has('posting date') &&
    lc.has('description') &&
    lc.has('amount') &&
    lc.has('type') &&
    lc.has('balance')
  );
}

function isChaseCCFormat(hdrs) {
  const lc = new Set(hdrs.map((h) => h.toLowerCase().trim()));
  return (
    lc.has('transaction date') &&
    lc.has('post date') &&
    lc.has('description') &&
    lc.has('category') &&
    lc.has('type') &&
    lc.has('amount')
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function CsvImportModal({ open, onClose, onViewTransactions }) {
  const { bulkInsertTransactions } = useApp();

  const [step, setStep]             = useState('upload');
  const [fileName, setFileName]     = useState('');
  const [pasteText, setPasteText]   = useState('');
  const [showPaste, setShowPaste]   = useState(false);
  const [parseError, setParseError] = useState('');
  const [headers, setHeaders]       = useState([]);
  const [dataRows, setDataRows]     = useState([]);  // string[][]
  const [mapping, setMapping]       = useState(DEFAULT_MAPPING);
  const [rows, setRows]             = useState([]);  // { _key, name, date, amt, cat }[]
  const [submitting, setSubmitting] = useState(false);
  const [importProgress, setImportProgress] = useState(null); // { current, total } | null
  const [importSummary, setImportSummary]   = useState(null); // { count, skipped, cleaned, subs }
  const [detectedFormat,  setDetectedFormat]  = useState(null); // 'chase' | 'chase-cc' | null
  const [detectedAccount, setDetectedAccount] = useState(null); // e.g. 'Chase ···1230'

  const fileRef = useRef(null);

  // Reset on open/close
  useEffect(() => {
    if (!open) {
      setStep('upload');
      setFileName('');
      setPasteText('');
      setShowPaste(false);
      setParseError('');
      setHeaders([]);
      setDataRows([]);
      setMapping(DEFAULT_MAPPING);
      setRows([]);
      setImportSummary(null);
      setSubmitting(false);
      setImportProgress(null);
      setDetectedFormat(null);
      setDetectedAccount(null);
    }
  }, [open]);

  // ── Parsing ───────────────────────────────────────────────────────────────

  function processText(text, name) {
    setParseError('');
    const allRows = parseCSV(text);
    if (allRows.length < 2) {
      setParseError('Could not find any rows. Make sure your CSV has a header row and at least one data row.');
      return;
    }
    const hdrs = allRows[0];
    const data = allRows.slice(1);
    const detected = detectColumns(hdrs);
    setHeaders(hdrs);
    setDataRows(data);
    setMapping(detected);
    setFileName(name || '');
    const fmt = isChaseFormat(hdrs) ? 'chase' : isChaseCCFormat(hdrs) ? 'chase-cc' : null;
    setDetectedFormat(fmt);
    // Account label: filename detection first, then format-based fallback
    const acctFromFile = detectAccountFromFile(name || '');
    const acct = acctFromFile ?? (fmt === 'chase-cc' ? 'Chase Credit' : fmt === 'chase' ? 'Chase Checking' : null);
    setDetectedAccount(acct);
    if (isAutoDetectComplete(detected)) {
      const catMap = fmt === 'chase-cc' ? CHASE_CC_CATEGORY_MAP : null;
      const built = buildRows(data, detected, catMap, name || fileName);
      if (built.length === 0) {
        setParseError('Columns were detected but no valid rows could be parsed. Check that dates and amounts are in expected formats.');
        return;
      }
      setRows(built);
      setStep('preview');
    } else {
      setStep('mapping');
    }
  }

  function handleFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => processText(e.target.result, file.name);
    reader.readAsText(file);
  }

  function handleDrop(e) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function handlePasteSubmit() {
    if (!pasteText.trim()) return;
    processText(pasteText, 'pasted text');
  }

  // ── Mapping step helpers ──────────────────────────────────────────────────

  function setMappingField(key, val) {
    setMapping((m) => ({ ...m, [key]: val }));
  }

  function applyMapping() {
    const catMap = detectedFormat === 'chase-cc' ? CHASE_CC_CATEGORY_MAP : null;
    const built = buildRows(dataRows, mapping, catMap, fileName);
    if (built.length === 0) {
      setParseError('No valid rows found with these column settings. Check your column assignments.');
      return;
    }
    setParseError('');
    setRows(built);
    setStep('preview');
  }

  const mappingComplete =
    mapping.dateCol !== -1 &&
    mapping.descCol !== -1 &&
    (mapping.amtMode === 'single'
      ? mapping.amtCol !== -1
      : mapping.debitCol !== -1 && mapping.creditCol !== -1);

  // ── Preview helpers ───────────────────────────────────────────────────────

  function setRowCat(key, cat) {
    setRows((prev) => prev.map((r) => (r._key === key ? { ...r, cat } : r)));
  }

  function toggleSkip(key) {
    setRows((prev) => prev.map((r) => (r._key === key ? { ...r, skip: !r.skip } : r)));
  }

  const activeRows = rows.filter((r) => !r.skip);

  async function handleImport() {
    if (activeRows.length === 0) return;
    setSubmitting(true);
    setImportProgress({ current: 0, total: activeRows.length });

    // Pre-compute stats from the active rows
    const subsCount = activeRows.filter((r) => r.cat === 'Subscriptions').length;
    // Count rows where cleanDescription changed the raw description
    let cleanedCount = 0;
    for (const row of activeRows) {
      const rawDesc = (dataRows[row._key]?.[mapping.descCol] ?? '').trim();
      if (rawDesc && rawDesc !== row.name) cleanedCount++;
    }

    // Apply format-based account fallback for rows that buildRows didn't label
    const rowsToImport = detectedAccount
      ? activeRows.map((r) => ({ ...r, account: r.account ?? detectedAccount }))
      : activeRows;

    const { count, skipped } = await bulkInsertTransactions(rowsToImport, {
      onProgress: (current, total) => setImportProgress({ current, total }),
    });
    setImportSummary({ count, skipped, cleaned: cleanedCount, subs: subsCount });
    setImportProgress(null);
    setSubmitting(false);
    setStep('success');
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Dialog card */}
      <div className="relative bg-white dark:bg-nero-surface w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl max-h-[92vh] flex flex-col shadow-2xl z-10">

        {/* ── Header ── */}
        <div className="px-5 pt-4 pb-3 border-b border-gray-100 dark:border-nero-border flex-shrink-0">
          {/* Handle (mobile) */}
          <div className="w-10 h-1 bg-gray-200 dark:bg-gray-600 rounded-full mx-auto mb-3 sm:hidden" />
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white">
                {step === 'upload'  && 'Import CSV'}
                {step === 'mapping' && 'Map Columns'}
                {step === 'preview' && `Preview — ${rows.length} row${rows.length !== 1 ? 's' : ''} detected`}
                {step === 'success' && 'Import Complete'}
              </h2>
              {step === 'preview' && (
                <p className="text-xs text-gray-400 mt-0.5">
                  {fileName && <span className="font-medium">{fileName} · </span>}
                  Review and adjust categories before importing
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1"
              aria-label="Close"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Step breadcrumb */}
          {step !== 'success' && (
            <div className="flex items-center gap-1.5 mt-2.5">
              {(detectedFormat
                ? ['upload', 'preview']
                : ['upload', 'mapping', 'preview']
              ).map((s, i, arr) => {
                const idx = arr.indexOf(step);
                const done = i < idx;
                const active = s === step;
                const labels = detectedFormat
                  ? ['Upload', 'Preview']
                  : ['Upload', 'Map columns', 'Preview'];
                return (
                  <div key={s} className="flex items-center gap-1.5">
                    <span className={`text-[11px] font-medium ${active ? 'text-gray-900 dark:text-white' : done ? 'text-gray-400' : 'text-gray-300 dark:text-gray-600'}`}>
                      {labels[i]}
                    </span>
                    {i < arr.length - 1 && <span className="text-gray-200 dark:text-gray-700">›</span>}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto">

          {/* ── Step: upload ── */}
          {step === 'upload' && (
            <div className="px-5 py-5 flex flex-col gap-4">
              {/* Drop zone */}
              <div
                className="border-2 border-dashed border-gray-200 dark:border-nero-border rounded-xl py-10 flex flex-col items-center gap-3 cursor-pointer hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                onClick={() => fileRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
              >
                <UploadIcon />
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Drop your CSV file here
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">or click to browse</p>
                </div>
                {fileName && (
                  <span className="text-xs font-medium px-3 py-1 bg-gray-100 dark:bg-nero-bg text-gray-600 dark:text-gray-300 rounded-full">
                    {fileName}
                  </span>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,text/csv,text/plain"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />

              {/* Paste option */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowPaste((v) => !v)}
                  className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex items-center gap-1"
                >
                  <span>{showPaste ? '▾' : '▸'}</span>
                  Or paste CSV text
                </button>
                {showPaste && (
                  <div className="mt-2 flex flex-col gap-2">
                    <textarea
                      value={pasteText}
                      onChange={(e) => setPasteText(e.target.value)}
                      placeholder={"Date,Description,Amount\n04/01/2026,Salary deposit,2600\n04/05/2026,Trader Joe's,-87.32"}
                      rows={6}
                      className={inputCls + ' font-mono text-xs resize-none mt-1'}
                    />
                    <button
                      onClick={handlePasteSubmit}
                      disabled={!pasteText.trim()}
                      className="self-end text-xs font-medium px-3 py-1.5 rounded-[20px] text-white disabled:opacity-40 transition-colors" style={{ background: '#27AE60' }}
                    >
                      Parse →
                    </button>
                  </div>
                )}
              </div>

              {parseError && (
                <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
                  {parseError}
                </p>
              )}

              {/* Format help */}
              <div className="bg-gray-50 dark:bg-nero-bg/50 rounded-lg px-3.5 py-3">
                <p className="text-[11px] uppercase tracking-[.08em] text-gray-400 mb-1.5">Supported formats</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  Chase, Bank of America, Wells Fargo, Capital One, Mint, AMEX, and most bank CSV exports.
                  Columns are detected automatically — you'll get a chance to review before anything is imported.
                </p>
              </div>
            </div>
          )}

          {/* ── Step: mapping ── */}
          {step === 'mapping' && (
            <div className="px-5 py-5 flex flex-col gap-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Columns couldn't be fully detected. Please assign the correct column for each field.
              </p>

              {/* Sample of first 2 data rows */}
              {dataRows.length > 0 && (
                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-nero-border">
                  <table className="min-w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-nero-bg/50">
                        {headers.map((h, i) => (
                          <th key={i} className="px-2.5 py-1.5 text-left text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">
                            {h || `Col ${i+1}`}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {dataRows.slice(0, 3).map((row, ri) => (
                        <tr key={ri} className="border-t border-gray-100 dark:border-nero-border">
                          {row.map((cell, ci) => (
                            <td key={ci} className="px-2.5 py-1.5 text-gray-700 dark:text-gray-300 whitespace-nowrap max-w-[120px] truncate">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <ColSelect label="Date column"        value={mapping.dateCol} onChange={(v) => setMappingField('dateCol', v)} headers={headers} />
              <ColSelect label="Description column" value={mapping.descCol} onChange={(v) => setMappingField('descCol', v)} headers={headers} />

              {/* Amount mode */}
              <div>
                <label className={labelCls}>Amount type</label>
                <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-nero-border">
                  {[['single','Single amount column'],['debitcredit','Debit / Credit columns']].map(([val, label]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setMappingField('amtMode', val)}
                      className="flex-1 py-2 text-xs font-medium transition-colors first:border-r border-gray-200 dark:border-nero-border"
                      style={mapping.amtMode === val
                        ? { background: '#1a1a1a', color: '#fff' }
                        : { background: 'transparent', color: '#888' }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {mapping.amtMode === 'single' && (
                <>
                  <ColSelect label="Amount column" value={mapping.amtCol} onChange={(v) => setMappingField('amtCol', v)} headers={headers} />
                  <div>
                    <label className={labelCls}>Sign convention</label>
                    <div className="flex flex-col gap-1.5">
                      {[['negative-expense','Negative values are expenses (most banks)'],['positive-expense','Positive values are expenses (AMEX, some cards)']].map(([val, label]) => (
                        <label key={val} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            checked={mapping.signConvention === val}
                            onChange={() => setMappingField('signConvention', val)}
                            className="accent-gray-900 dark:accent-white"
                          />
                          <span className="text-xs text-gray-700 dark:text-gray-300">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {mapping.amtMode === 'debitcredit' && (
                <div className="grid grid-cols-2 gap-3">
                  <ColSelect label="Debit column (expenses)"  value={mapping.debitCol}  onChange={(v) => setMappingField('debitCol', v)}  headers={headers} />
                  <ColSelect label="Credit column (income)"   value={mapping.creditCol} onChange={(v) => setMappingField('creditCol', v)} headers={headers} />
                </div>
              )}

              {parseError && (
                <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
                  {parseError}
                </p>
              )}
            </div>
          )}

          {/* ── Step: preview ── */}
          {step === 'preview' && (
            <div>
              {/* Detected mapping banner */}
              <div className="px-5 py-2.5 bg-gray-50 dark:bg-nero-bg/40 border-b border-gray-100 dark:border-nero-border flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-[11px] text-gray-400">
                    {activeRows.length} of {rows.length} rows selected
                  </p>
                  {detectedFormat && (
                    <span
                      className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                      style={{ background: '#C8EBB4', color: '#27500A' }}
                    >
                      {detectedFormat === 'chase-cc' ? 'Chase credit card detected' : 'Chase format detected'}
                    </span>
                  )}
                  {detectedAccount && (
                    <span
                      className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-nero-bg text-gray-500 dark:text-gray-400"
                    >
                      {detectedAccount}
                    </span>
                  )}
                </div>
                {!detectedFormat && (
                  <button
                    onClick={() => setStep('mapping')}
                    className="text-[11px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 underline transition-colors flex-shrink-0"
                  >
                    Edit column mapping
                  </button>
                )}
              </div>

              {/* Preview table */}
              {(() => {
                // Columns already represented by the parsed fields
                const usedCols = new Set(
                  [mapping.dateCol, mapping.descCol, mapping.amtCol,
                   mapping.debitCol, mapping.creditCol, mapping.catCol]
                    .filter((i) => i >= 0)
                );
                // Chase CC: only show the 4 primary columns (Date, Description, Amount, Category)
                // Chase checking: show all extra raw columns (Type, Balance, etc.)
                const extraCols = detectedFormat === 'chase-cc'
                  ? []
                  : headers
                      .map((h, i) => ({ h, i }))
                      .filter(({ i }) => !usedCols.has(i));

                return (
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-nero-border">
                        <th className="px-3 py-2 text-left text-gray-400 font-medium w-8"></th>
                        <th className="px-3 py-2 text-left text-gray-400 font-medium whitespace-nowrap">Date</th>
                        <th className="px-3 py-2 text-left text-gray-400 font-medium">Description</th>
                        <th className="px-3 py-2 text-right text-gray-400 font-medium whitespace-nowrap">Amount</th>
                        {extraCols.map(({ h, i }) => (
                          <th key={i} className="px-3 py-2 text-left text-gray-400 font-medium whitespace-nowrap">{h}</th>
                        ))}
                        <th className="px-3 py-2 text-left text-gray-400 font-medium">Category</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => (
                        <tr
                          key={row._key}
                          className={`border-b border-gray-50 dark:border-nero-border/50 ${row.skip ? 'opacity-40' : ''}`}
                        >
                          <td className="px-3 py-1.5">
                            <input
                              type="checkbox"
                              checked={!row.skip}
                              onChange={() => toggleSkip(row._key)}
                              className="accent-gray-900 dark:accent-white"
                            />
                          </td>
                          <td className="px-3 py-1.5 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                            {row.date}
                          </td>
                          <td className="px-3 py-1.5 text-gray-800 dark:text-gray-200 max-w-[180px] truncate" title={row.name}>
                            {row.name}
                          </td>
                          <td className="px-3 py-1.5 text-right tabular-nums font-medium whitespace-nowrap"
                              style={{ color: row.amt > 0 ? '#27AE60' : '#f87171' }}>
                            {row.amt > 0 ? '+' : '-'}${Math.abs(row.amt).toFixed(2)}
                          </td>
                          {extraCols.map(({ i }) => (
                            <td key={i} className="px-3 py-1.5 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                              {dataRows[row._key]?.[i] ?? ''}
                            </td>
                          ))}
                          <td className="px-3 py-1.5">
                            <select
                              value={row.cat}
                              onChange={(e) => setRowCat(row._key, e.target.value)}
                              className="text-xs border border-gray-200 dark:border-nero-border rounded px-1.5 py-0.5 bg-white dark:bg-nero-bg text-gray-800 dark:text-gray-200 outline-none focus:border-gray-400 transition-colors"
                              disabled={row.skip}
                            >
                              {ALL_CATS.map((c) => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                );
              })()}
            </div>
          )}

          {/* ── Step: success ── */}
          {step === 'success' && importSummary && (
            <div className="px-5 py-10 flex flex-col items-center gap-5">
              <CheckIcon />
              <div className="text-center">
                <p className="text-[17px] font-semibold text-gray-900 dark:text-white">
                  Import complete
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  Your transactions are ready to review.
                </p>
              </div>

              {/* Summary stats */}
              <div className="w-full max-w-xs rounded-xl border border-gray-100 dark:border-nero-border overflow-hidden">
                <SummaryRow
                  icon={<span style={{ color: '#27AE60' }}>↓</span>}
                  label="Transactions imported"
                  value={importSummary.count}
                  highlight
                />
                {importSummary.cleaned > 0 && (
                  <SummaryRow
                    icon={<span style={{ color: '#60a5fa' }}>✦</span>}
                    label="Merchant names cleaned"
                    value={importSummary.cleaned}
                  />
                )}
                {importSummary.subs > 0 && (
                  <SummaryRow
                    icon={<span style={{ color: '#a78bfa' }}>↺</span>}
                    label="Subscriptions detected"
                    value={importSummary.subs}
                  />
                )}
                {importSummary.skipped > 0 && (
                  <SummaryRow
                    icon={<span style={{ color: '#94a3b8' }}>⊘</span>}
                    label="Duplicates skipped"
                    value={importSummary.skipped}
                  />
                )}
              </div>
            </div>
          )}

        </div>{/* end scrollable body */}

        {/* ── Footer ── */}
        <div className="px-5 py-4 border-t border-gray-100 dark:border-nero-border flex-shrink-0 flex gap-2.5">
          {step === 'upload' && (
            <button onClick={onClose}
              className="flex-1 border border-gray-200 dark:border-nero-border text-sm font-medium py-2.5 rounded-lg text-gray-700 dark:text-gray-300 transition-colors">
              Cancel
            </button>
          )}

          {step === 'mapping' && (
            <>
              <button onClick={() => setStep('upload')}
                className="flex-1 border border-gray-200 dark:border-nero-border text-sm font-medium py-2.5 rounded-lg text-gray-700 dark:text-gray-300 transition-colors">
                ← Back
              </button>
              <button
                onClick={applyMapping}
                disabled={!mappingComplete}
                className="flex-1 text-white text-sm font-medium py-2.5 rounded-[20px] disabled:opacity-40 transition-colors" style={{ background: '#27AE60' }}
              >
                Preview →
              </button>
            </>
          )}

          {step === 'preview' && (
            <>
              <button onClick={() => setStep(detectedFormat ? 'upload' : 'mapping')}
                className="flex-1 border border-gray-200 dark:border-nero-border text-sm font-medium py-2.5 rounded-lg text-gray-700 dark:text-gray-300 transition-colors">
                ← Back
              </button>
              <button
                onClick={handleImport}
                disabled={activeRows.length === 0 || submitting}
                className="flex-1 text-white text-sm font-medium py-2.5 rounded-[20px] disabled:opacity-40 transition-colors" style={{ background: '#27AE60' }}
              >
                {submitting
                  ? importProgress && importProgress.total > 0
                    ? `Importing ${importProgress.current} of ${importProgress.total}…`
                    : 'Importing…'
                  : `Import ${activeRows.length} transaction${activeRows.length !== 1 ? 's' : ''}`}
              </button>
            </>
          )}

          {step === 'success' && (
            <>
              <button onClick={onClose}
                className="flex-1 border border-gray-200 dark:border-nero-border text-sm font-medium py-2.5 rounded-lg text-gray-700 dark:text-gray-300 transition-colors">
                Done
              </button>
              <button
                onClick={() => { onClose(); onViewTransactions?.(); }}
                className="flex-1 text-white text-sm font-medium py-2.5 rounded-[20px] transition-colors"
                style={{ background: '#27AE60' }}
              >
                View transactions →
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
