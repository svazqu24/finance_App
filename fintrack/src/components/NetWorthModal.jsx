import { useState, useEffect } from 'react';
import { useApp } from '../AppContext';

const inputCls =
  'w-full border border-gray-200 dark:border-nero-border rounded-xl px-4 py-3 text-sm ' +
  'bg-white dark:bg-nero-bg text-gray-900 dark:text-white placeholder:text-gray-400 ' +
  'outline-none focus:border-gray-400 dark:focus:border-nero-green transition-colors';

const labelCls = 'text-[11px] uppercase tracking-[.08em] text-gray-400 block mb-1';

export default function NetWorthModal({ open, onClose }) {
  const { saveNetWorthEntry, netWorthEntries, transactions, creditCardsData } = useApp();
  const [accounts, setAccounts] = useState([]);

  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

  useEffect(() => {
    if (!open) return;

    // Pre-fill with existing data if available
    const existingEntry = netWorthEntries.find(entry => entry.month === currentMonth);
    if (existingEntry) {
      setAccounts(existingEntry.accounts);
    } else {
      // Pre-fill with checking accounts from transactions and credit cards
      const checkingAccounts = [...new Set(transactions.map(t => t.account).filter(Boolean))].map(account => ({
        id: `checking-${account}`,
        name: account,
        balance: 0,
        type: 'asset',
        category: 'checking',
      }));

      const creditCardAccounts = creditCardsData.map(card => ({
        id: `liability-${card.id}`,
        name: card.name,
        balance: card.balance || 0,
        type: 'liability',
        category: 'credit_card',
      }));

      const defaultAccounts = [
        ...checkingAccounts,
        { id: 'savings', name: 'Savings Account', balance: 0, type: 'asset', category: 'savings' },
        { id: 'investments', name: 'Investments (401k, IRA, Brokerage)', balance: 0, type: 'asset', category: 'investments' },
        { id: 'other-assets', name: 'Other Assets (Car, Property, etc.)', balance: 0, type: 'asset', category: 'other_assets' },
        ...creditCardAccounts,
        { id: 'student-loans', name: 'Student Loans', balance: 0, type: 'liability', category: 'student_loans' },
        { id: 'car-loans', name: 'Car Loans', balance: 0, type: 'liability', category: 'car_loans' },
        { id: 'other-debts', name: 'Other Debts', balance: 0, type: 'liability', category: 'other_debts' },
      ];

      setAccounts(defaultAccounts);
    }
  }, [open, currentMonth, netWorthEntries, transactions, creditCardsData]);

  useEffect(() => {
    if (!open) return;

    const lockBodyScroll = () => {
      const count = (window.__neroModalOpenCount ?? 0) + 1;
      window.__neroModalOpenCount = count;
      if (count === 1) document.body.style.overflow = 'hidden';
    };
    const unlockBodyScroll = () => {
      const count = Math.max(0, (window.__neroModalOpenCount ?? 1) - 1);
      window.__neroModalOpenCount = count;
      if (count === 0) document.body.style.overflow = '';
    };

    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };

    lockBodyScroll();
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      unlockBodyScroll();
    };
  }, [open, onClose]);

  function updateAccount(id, field, value) {
    setAccounts(accounts.map(acc => acc.id === id ? { ...acc, [field]: value } : acc));
  }

  function addAccount(type, category) {
    const newId = `${type}-${Date.now()}`;
    const newAccount = {
      id: newId,
      name: '',
      balance: 0,
      type,
      category,
    };
    setAccounts([...accounts, newAccount]);
  }

  function removeAccount(id) {
    setAccounts(accounts.filter(acc => acc.id !== id));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    await saveNetWorthEntry(currentMonth, accounts);
    onClose();
  }

  const assets = accounts.filter(acc => acc.type === 'asset');
  const liabilities = accounts.filter(acc => acc.type === 'liability');
  const totalAssets = assets.reduce((sum, acc) => sum + Number(acc.balance), 0);
  const totalLiabilities = liabilities.reduce((sum, acc) => sum + Number(acc.balance), 0);
  const netWorth = totalAssets - totalLiabilities;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/60 transition-opacity duration-200"
        style={{ opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none' }}
        onClick={onClose}
      />

      <div
        className="fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ease-out bg-white dark:bg-nero-surface rounded-t-2xl max-w-[680px] mx-auto px-5 pt-4 shadow-2xl border-t border-transparent dark:border-nero-border max-h-[90vh] overflow-y-auto"
        style={{
          transform: open ? 'translateY(0)' : 'translateY(100%)',
          paddingBottom: 'calc(2rem + env(safe-area-inset-bottom, 0px))'
        }}
      >
        <div className="w-10 h-1 bg-gray-200 dark:bg-nero-border rounded-full mx-auto mb-4" />

        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-[15px] font-semibold text-gray-900 dark:text-white">
              Update Net Worth
            </p>
            <p className="text-xs text-gray-400 m-0">
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

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Assets Section */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Assets</h3>
            <div className="space-y-3">
              {assets.map((account) => (
                <div key={account.id} className="flex gap-3 items-center">
                  <input
                    type="text"
                    value={account.name}
                    onChange={(e) => updateAccount(account.id, 'name', e.target.value)}
                    placeholder="Account name"
                    className={`${inputCls} flex-1`}
                  />
                  <input
                    type="number"
                    step="0.01"
                    value={account.balance}
                    onChange={(e) => updateAccount(account.id, 'balance', e.target.value)}
                    placeholder="0.00"
                    className={`${inputCls} w-24`}
                  />
                  <button
                    type="button"
                    onClick={() => removeAccount(account.id)}
                    className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
                    aria-label="Remove account"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m5 0V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
                      <line x1="10" y1="11" x2="10" y2="17" />
                      <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addAccount('asset', 'other_assets')}
                className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                + Add asset
              </button>
            </div>
          </div>

          {/* Liabilities Section */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Liabilities</h3>
            <div className="space-y-3">
              {liabilities.map((account) => (
                <div key={account.id} className="flex gap-3 items-center">
                  <input
                    type="text"
                    value={account.name}
                    onChange={(e) => updateAccount(account.id, 'name', e.target.value)}
                    placeholder="Account name"
                    className={`${inputCls} flex-1`}
                  />
                  <input
                    type="number"
                    step="0.01"
                    value={account.balance}
                    onChange={(e) => updateAccount(account.id, 'balance', e.target.value)}
                    placeholder="0.00"
                    className={`${inputCls} w-24`}
                  />
                  <button
                    type="button"
                    onClick={() => removeAccount(account.id)}
                    className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
                    aria-label="Remove account"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m5 0V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
                      <line x1="10" y1="11" x2="10" y2="17" />
                      <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addAccount('liability', 'other_debts')}
                className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                + Add liability
              </button>
            </div>
          </div>

          {/* Totals */}
          <div className="bg-gray-50 dark:bg-nero-bg rounded-xl p-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600 dark:text-gray-400">Assets:</span>
              <span className="font-medium text-gray-900 dark:text-white">${totalAssets.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600 dark:text-gray-400">Liabilities:</span>
              <span className="font-medium text-gray-900 dark:text-white">${totalLiabilities.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm font-semibold border-t border-gray-200 dark:border-nero-border pt-2">
              <span className="text-gray-900 dark:text-white">Net Worth:</span>
              <span className={netWorth >= 0 ? 'text-green-600' : 'text-red-600'}>${netWorth.toLocaleString()}</span>
            </div>
          </div>

          <div className="flex gap-2.5 mt-1">
            <button
              type="submit"
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
        </form>
      </div>
    </>
  );
}