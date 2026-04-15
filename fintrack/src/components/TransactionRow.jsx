import { useState, useRef, useEffect } from 'react';
import { useApp } from '../AppContext';
import { sendNotification } from '../NotificationContext';

const ALL_CATS = [
  'Housing', 'Groceries', 'Dining', 'Subscriptions', 'Travel',
  'Transport', 'Health', 'Shopping', 'Utilities', 'Insurance', 'Income', 'Transfer',
];

function TrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

export default function TransactionRow({ txn }) {
  const {
    deleteTransaction, setEditTxn, getCategorySty,
    updateTransaction, bulkRenameTransactions,
  } = useApp();

  const [isHovered, setIsHovered]     = useState(false);
  const [catOpen, setCatOpen]         = useState(false);
  const [catSearch, setCatSearch]     = useState('');
  const [savedFlash, setSavedFlash]   = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue]     = useState('');
  const [origName, setOrigName]       = useState('');

  const catDropRef  = useRef(null);
  const nameInputRef = useRef(null);

  const s   = getCategorySty(txn.cat);
  const pos = txn.amt > 0;

  // Close dropdown on outside click (desktop only — mobile uses backdrop)
  useEffect(() => {
    if (!catOpen) return;
    if (window.innerWidth < 640) return;
    function onOutside(e) {
      if (catDropRef.current && !catDropRef.current.contains(e.target)) {
        setCatOpen(false);
        setCatSearch('');
      }
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [catOpen]);

  // Auto-focus the name input when entering edit mode
  useEffect(() => {
    if (editingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [editingName]);

  function flash() {
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1400);
  }

  // ── Row click — open full edit modal unless clicking interactive sub-elements
  function handleRowClick(e) {
    if (e.target.closest('[data-no-modal]')) return;
    setEditTxn(txn);
  }

  // ── Category badge
  function handleBadgeClick(e) {
    e.stopPropagation();
    setCatOpen((v) => !v);
    setCatSearch('');
  }

  async function handleCatSelect(cat) {
    setCatOpen(false);
    setCatSearch('');
    if (cat === txn.cat) return;
    await updateTransaction(txn.id, { ...txn, cat }, { silent: true });
    flash();
  }

  // ── Merchant name
  function handleNameClick(e) {
    e.stopPropagation();
    setEditingName(true);
    setNameValue(txn.name);
    setOrigName(txn.name);
  }

  async function commitNameEdit() {
    const trimmed = nameValue.trim();
    setEditingName(false);
    if (!trimmed || trimmed === origName) return;
    await updateTransaction(txn.id, { ...txn, name: trimmed }, { silent: true });
    flash();
    sendNotification('Name saved — apply to all similar transactions?', {
      type: 'action',
      duration: 9000,
      onYes: () => bulkRenameTransactions(origName, trimmed),
      onNo:  () => {},
    });
  }

  function handleNameKeyDown(e) {
    if (e.key === 'Enter')  { e.preventDefault(); commitNameEdit(); }
    if (e.key === 'Escape') { setEditingName(false); setNameValue(txn.name); }
  }

  const filteredCats = catSearch
    ? ALL_CATS.filter((c) => c.toLowerCase().includes(catSearch.toLowerCase()))
    : ALL_CATS;

  const isMobileSheet = catOpen && window.innerWidth < 640;

  return (
    <>
      <div
        className="relative flex items-center gap-2.5 py-2.5 border-b border-gray-200 dark:border-nero-border transition-colors cursor-pointer active:bg-gray-50 dark:active:bg-nero-surface/50 rounded-sm"
        onClick={handleRowClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Saved flash */}
        {savedFlash && (
          <div
            className="absolute inset-0 rounded-sm pointer-events-none flex items-center justify-end pr-3 z-10"
            style={{ background: 'rgba(39,174,96,0.08)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#27AE60"
                 strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        )}

        {/* ── Category badge + dropdown wrapper ── */}
        <div ref={catDropRef} className="relative flex-shrink-0" data-no-modal="true">
          <button
            className="w-9 h-9 flex items-center justify-center hover:opacity-80 transition-opacity"
            style={{ background: s.bg, borderRadius: '10px 3px 10px 3px' }}
            onClick={handleBadgeClick}
            aria-label={`Change category (currently ${txn.cat})`}
          >
            <span className="text-[11px] font-medium" style={{ color: s.fg }}>
              {txn.cat.slice(0, 2).toUpperCase()}
            </span>
          </button>

          {/* Desktop dropdown */}
          {catOpen && window.innerWidth >= 640 && (
            <div className="absolute top-10 left-0 z-30 w-52 bg-white dark:bg-nero-surface border border-gray-200 dark:border-nero-border rounded-xl shadow-xl overflow-hidden">
              {/* Search */}
              <div className="p-2 border-b border-gray-100 dark:border-nero-border">
                <input
                  type="text"
                  placeholder="Search categories…"
                  value={catSearch}
                  onChange={(e) => setCatSearch(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg bg-gray-50 dark:bg-nero-bg text-gray-900 dark:text-white placeholder:text-gray-400 border border-gray-200 dark:border-nero-border outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors"
                  autoFocus
                />
              </div>
              {/* List */}
              <div className="max-h-52 overflow-y-auto py-1">
                {filteredCats.map((cat) => {
                  const cs = getCategorySty(cat);
                  return (
                    <button
                      key={cat}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-nero-bg transition-colors"
                      style={cat === txn.cat ? { background: 'rgba(39,174,96,0.08)' } : {}}
                      onClick={(e) => { e.stopPropagation(); handleCatSelect(cat); }}
                    >
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: cs.fg }}
                      />
                      <span className="text-xs text-gray-800 dark:text-gray-200">{cat}</span>
                      {cat === txn.cat && (
                        <svg className="ml-auto flex-shrink-0" width="12" height="12" viewBox="0 0 24 24"
                             fill="none" stroke="#27AE60" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>
                  );
                })}
                {filteredCats.length === 0 && (
                  <p className="px-3 py-2 text-xs text-gray-400">No match</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Name & sub-label ── */}
        <div className="flex-1 min-w-0" data-no-modal="true">
          {editingName ? (
            <input
              ref={nameInputRef}
              type="text"
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              onBlur={commitNameEdit}
              onKeyDown={handleNameKeyDown}
              onClick={(e) => e.stopPropagation()}
              className="w-full text-sm font-medium text-gray-900 dark:text-white bg-transparent border-b border-gray-400 dark:border-gray-500 outline-none py-0 leading-[1.4] caret-green-500"
            />
          ) : (
            <p
              className="m-0 text-sm font-medium truncate text-gray-900 dark:text-white cursor-text hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              onClick={handleNameClick}
              title="Click to rename"
            >
              {txn.name}
            </p>
          )}
          <p className="m-0 text-xs text-gray-400">{txn.cat} · {txn.date}</p>
        </div>

        {/* ── Amount ── */}
        <span
          className="text-sm font-medium tabular-nums flex-shrink-0"
          style={{ color: pos ? '#27AE60' : '#f87171' }}
        >
          {pos ? '+' : '-'}${Math.abs(txn.amt).toFixed(2)}
        </span>

        {/* ── Delete button ── */}
        {isHovered && !editingName && (
          <button
            data-no-modal="true"
            onClick={(e) => { e.stopPropagation(); deleteTransaction(txn.id); }}
            className="ml-1 flex-shrink-0 w-8 h-8 flex items-center justify-center text-gray-300 hover:text-red-400 dark:text-gray-600 dark:hover:text-red-400 transition-colors"
            aria-label="Delete transaction"
          >
            <TrashIcon />
          </button>
        )}
      </div>

      {/* ── Mobile bottom sheet ── */}
      {isMobileSheet && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => { setCatOpen(false); setCatSearch(''); }}
          />
          {/* Sheet */}
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-nero-surface rounded-t-2xl shadow-2xl safe-bottom">
            <div className="w-10 h-1 bg-gray-200 dark:bg-gray-600 rounded-full mx-auto mt-3 mb-0" />
            <div className="px-4 pt-3 pb-2 border-b border-gray-100 dark:border-nero-border">
              <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Select Category</p>
              <input
                type="text"
                placeholder="Search…"
                value={catSearch}
                onChange={(e) => setCatSearch(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-lg bg-gray-50 dark:bg-nero-bg text-gray-900 dark:text-white placeholder:text-gray-400 border border-gray-200 dark:border-nero-border outline-none"
                autoFocus
              />
            </div>
            <div className="max-h-64 overflow-y-auto py-1">
              {filteredCats.map((cat) => {
                const cs = getCategorySty(cat);
                return (
                  <button
                    key={cat}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left active:bg-gray-50 dark:active:bg-nero-bg transition-colors"
                    style={cat === txn.cat ? { background: 'rgba(39,174,96,0.08)' } : {}}
                    onClick={() => handleCatSelect(cat)}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ background: cs.fg }}
                    />
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{cat}</span>
                    {cat === txn.cat && (
                      <svg className="ml-auto flex-shrink-0" width="14" height="14" viewBox="0 0 24 24"
                           fill="none" stroke="#27AE60" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="h-6" />
          </div>
        </>
      )}
    </>
  );
}
