import { useState, useEffect, useCallback, memo } from 'react';
import { useApp } from '../AppContext';

const inputCls =
  'w-full border border-gray-200 dark:border-nero-border rounded-xl px-3 py-2.5 text-sm ' +
  'bg-white dark:bg-nero-bg text-gray-900 dark:text-white placeholder:text-gray-400 ' +
  'outline-none focus:border-gray-400 dark:focus:border-nero-green transition-colors';

function LeafIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 flex-shrink-0">
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m5 0V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}

const ASSET_SECTIONS = [
  {
    label: 'Checking & Savings',
    categories: ['checking', 'savings'],
    addCategory: 'checking',
  },
  {
    label: 'Investments',
    categories: ['investments'],
    addCategory: 'investments',
  },
  {
    label: 'Property & Other',
    categories: ['property', 'other_assets'],
    addCategory: 'other_assets',
  },
];

const LIABILITY_SECTIONS = [
  {
    label: 'Credit Cards',
    categories: ['credit_card'],
    addCategory: 'credit_card',
  },
  {
    label: 'Loans & Other',
    categories: ['student_loans', 'car_loans', 'other_debts'],
    addCategory: 'other_debts',
  },
];

// Defined at module level so React never sees a new component type on re-render.
// memo prevents re-rendering rows whose props haven't changed.
const AccountRow = memo(function AccountRow({ account, onUpdate, onRemove }) {
  return (
    <div className="flex items-center gap-2">
      <LeafIcon />
      <input
        type="text"
        value={account.name}
        onChange={(e) => onUpdate(account.id, 'name', e.target.value)}
        placeholder="Account name"
        className={`${inputCls} flex-1 min-w-0`}
      />
      <div className="relative flex-shrink-0 w-28">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">$</span>
        <input
          type="number"
          step="1"
          min="0"
          value={account.balance || ''}
          onChange={(e) => onUpdate(account.id, 'balance', e.target.value)}
          placeholder="0"
          className={`${inputCls} pl-6`}
        />
      </div>
      <button
        type="button"
        onClick={() => onRemove(account.id)}
        className="w-7 h-7 flex items-center justify-center text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
        aria-label="Remove"
      >
        <TrashIcon />
      </button>
    </div>
  );
});

export default function NetWorthModal({ open, onClose }) {
  const { saveNetWorthEntry, netWorthEntries, transactions, creditCardsData } = useApp();
  const [accounts, setAccounts] = useState([]);

  const currentMonth = new Date().toISOString().slice(0, 7);

  useEffect(() => {
    if (!open) return;

    const existingEntry = netWorthEntries.find(e => e.month === currentMonth);
    if (existingEntry) {
      // When loading a saved entry, patch any truncated account names by cross-referencing
      // the live transaction account names (which come from full CSV values).
      const txnAccounts = new Map();
      for (const t of transactions) {
        if (t.account) txnAccounts.set(t.account.toLowerCase(), t.account);
      }
      const patched = existingEntry.accounts.map(acc => {
        if (!acc.name) return acc;
        // If the stored name is a prefix of a known transaction account, use the full name.
        const full = txnAccounts.get(acc.name.toLowerCase());
        if (full) return acc; // exact match — already correct
        for (const [key, val] of txnAccounts) {
          if (key.startsWith(acc.name.toLowerCase()) || acc.name.toLowerCase().startsWith(key)) {
            return { ...acc, name: val };
          }
        }
        return acc;
      });
      setAccounts(patched);
      return;
    }

    // Build defaults from live transaction accounts (full names from CSV imports).
    const txnAccountNames = [...new Set(transactions.map(t => t.account).filter(Boolean))];
    const checkingAccounts = txnAccountNames.map((account, i) => ({
      id: `checking-${i}`,
      name: account,
      balance: 0,
      type: 'asset',
      category: 'checking',
    }));

    const creditCardAccounts = creditCardsData.map(card => ({
      id: `cc-${card.id}`,
      name: card.name,
      balance: card.balance || 0,
      type: 'liability',
      category: 'credit_card',
    }));

    const baseAssets = [
      ...(checkingAccounts.length > 0 ? checkingAccounts : [
        { id: 'chase-checking', name: 'Chase Checking', balance: 0, type: 'asset', category: 'checking' },
        { id: 'chase-savings',  name: 'Chase Savings',  balance: 0, type: 'asset', category: 'savings' },
      ]),
      { id: 'investments-401k',      name: '401(k)',    balance: 0, type: 'asset', category: 'investments' },
      { id: 'investments-brokerage', name: 'Brokerage', balance: 0, type: 'asset', category: 'investments' },
      { id: 'car',                   name: 'Car',       balance: 0, type: 'asset', category: 'property' },
    ];

    const baseLiabilities = [
      ...(creditCardAccounts.length > 0 ? creditCardAccounts : [
        { id: 'cc-chase', name: 'Chase Credit ···8695', balance: 0, type: 'liability', category: 'credit_card' },
      ]),
      { id: 'student-loans', name: 'Student Loans', balance: 0, type: 'liability', category: 'student_loans' },
      { id: 'car-loans',     name: 'Car Loans',     balance: 0, type: 'liability', category: 'car_loans' },
    ];

    setAccounts([...baseAssets, ...baseLiabilities]);
  }, [open, currentMonth, netWorthEntries, transactions, creditCardsData]);

  useEffect(() => {
    if (!open) return;
    const count = (window.__neroModalOpenCount ?? 0) + 1;
    window.__neroModalOpenCount = count;
    if (count === 1) document.body.style.overflow = 'hidden';
    const onKeyDown = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      const c = Math.max(0, (window.__neroModalOpenCount ?? 1) - 1);
      window.__neroModalOpenCount = c;
      if (c === 0) document.body.style.overflow = '';
    };
  }, [open, onClose]);

  // Stable callbacks — AccountRow memo can skip re-renders for unchanged rows.
  const updateAccount = useCallback((id, field, value) => {
    setAccounts(prev => prev.map(acc => acc.id === id ? { ...acc, [field]: value } : acc));
  }, []);

  const removeAccount = useCallback((id) => {
    setAccounts(prev => prev.filter(acc => acc.id !== id));
  }, []);

  const addAccount = useCallback((type, category) => {
    setAccounts(prev => [...prev, { id: `${type}-${Date.now()}`, name: '', balance: 0, type, category }]);
  }, []);

  async function handleSubmit(e) {
    e?.preventDefault();
    await saveNetWorthEntry(currentMonth, accounts);
    onClose();
  }

  const assets = accounts.filter(a => a.type === 'asset');
  const liabilities = accounts.filter(a => a.type === 'liability');
  const totalAssets = assets.reduce((s, a) => s + Number(a.balance || 0), 0);
  const totalLiabilities = liabilities.reduce((s, a) => s + Number(a.balance || 0), 0);
  const netWorth = totalAssets - totalLiabilities;

  const fmt = (n) => '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/60 transition-opacity duration-200"
        style={{ opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none' }}
        onClick={onClose}
      />

      <div
        className="fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ease-out bg-white dark:bg-nero-surface rounded-t-2xl max-w-[680px] mx-auto shadow-2xl border-t border-transparent dark:border-nero-border"
        style={{
          transform: open ? 'translateY(0)' : 'translateY(100%)',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Fixed header */}
        <div className="px-5 pt-4 pb-3 flex-shrink-0">
          <div className="w-10 h-1 bg-gray-200 dark:bg-nero-border rounded-full mx-auto mb-4" />
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[15px] font-semibold text-gray-900 dark:text-white">Update Net Worth</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              aria-label="Close"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-5 pb-2">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">

            {/* ── ASSETS ── */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0" />
                <h3 className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">Assets</h3>
              </div>

              {ASSET_SECTIONS.map(section => {
                const rows = assets.filter(a => section.categories.includes(a.category));
                return (
                  <div key={section.label} className="mb-4">
                    <p className="text-[11px] uppercase tracking-[.08em] text-gray-400 mb-2">{section.label}</p>
                    <div className="space-y-2">
                      {rows.map(acc => (
                        <AccountRow key={acc.id} account={acc} onUpdate={updateAccount} onRemove={removeAccount} />
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => addAccount('asset', section.addCategory)}
                      className="mt-2 text-xs text-gray-400 hover:text-emerald-500 transition-colors"
                    >
                      + Add {section.label.toLowerCase()}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* ── LIABILITIES ── */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 flex-shrink-0" />
                <h3 className="text-sm font-semibold text-red-500 dark:text-red-400 uppercase tracking-wide">Liabilities</h3>
              </div>

              {LIABILITY_SECTIONS.map(section => {
                const rows = liabilities.filter(a => section.categories.includes(a.category));
                return (
                  <div key={section.label} className="mb-4">
                    <p className="text-[11px] uppercase tracking-[.08em] text-gray-400 mb-2">{section.label}</p>
                    <div className="space-y-2">
                      {rows.map(acc => (
                        <AccountRow key={acc.id} account={acc} onUpdate={updateAccount} onRemove={removeAccount} />
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => addAccount('liability', section.addCategory)}
                      className="mt-2 text-xs text-gray-400 hover:text-red-400 transition-colors"
                    >
                      + Add {section.label.toLowerCase()}
                    </button>
                  </div>
                );
              })}
            </div>

          </form>
        </div>

        {/* Fixed footer — live totals + save */}
        <div className="px-5 pt-3 pb-5 flex-shrink-0 border-t border-gray-100 dark:border-nero-border" style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom, 0px))' }}>
          {/* Live totals */}
          <div className="bg-gray-50 dark:bg-nero-bg rounded-2xl px-4 py-3 mb-4">
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <div className="text-center">
                <p className="text-[10px] uppercase tracking-widest text-emerald-500 mb-0.5">Assets</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{fmt(totalAssets)}</p>
              </div>
              <span className="text-gray-300 dark:text-gray-600 text-xl font-light">−</span>
              <div className="text-center">
                <p className="text-[10px] uppercase tracking-widest text-red-400 mb-0.5">Liabilities</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{fmt(totalLiabilities)}</p>
              </div>
              <span className="text-gray-300 dark:text-gray-600 text-xl font-light">=</span>
              <div className="text-center">
                <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-0.5">Net Worth</p>
                <p className={`text-xl font-extrabold ${netWorth >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {netWorth < 0 ? '-' : ''}{fmt(netWorth)}
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={handleSubmit}
              className="flex-1 text-white text-sm font-medium py-3 rounded-[20px] transition-colors"
              style={{ background: '#27AE60' }}
            >
              Save for {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-200 dark:border-nero-border text-sm font-medium py-3 rounded-[20px] text-gray-700 dark:text-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
