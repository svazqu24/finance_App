import { useState, useEffect } from 'react';
import { useApp } from '../AppContext';

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
  const { deleteTransaction, setEditTxn, getCategorySty } = useApp();
  const [confirming, setConfirming] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const s = getCategorySty(txn.cat);
  const pos = txn.amt > 0;

  useEffect(() => {
    if (!confirming) return;
    const t = setTimeout(() => setConfirming(false), 3000);
    return () => clearTimeout(t);
  }, [confirming]);

  function handleRowClick(e) {
    if (e.target.closest('[data-delete]')) return;
    setEditTxn(txn);
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2 py-2.5 border-b border-gray-200 dark:border-nero-border transition-colors">
        <p className="flex-1 text-sm text-gray-600 dark:text-gray-300 m-0">
          Delete <span className="font-medium">{txn.name}</span>?
        </p>
        <button
          data-delete="true"
          onClick={() => deleteTransaction(txn.id)}
          className="text-xs font-medium px-3 py-1.5 rounded-[20px] text-white transition-colors"
          style={{ background: '#f87171' }}
        >
          Delete
        </button>
        <button
          data-delete="true"
          onClick={() => setConfirming(false)}
          className="text-xs font-medium px-3 py-1.5 rounded-[20px] border border-gray-200 dark:border-nero-border text-gray-600 dark:text-gray-300 transition-colors"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-2.5 py-2.5 border-b border-gray-200 dark:border-nero-border transition-colors cursor-pointer active:bg-gray-50 dark:active:bg-nero-surface/50 rounded-sm"
      onClick={handleRowClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className="w-9 h-9 flex items-center justify-center flex-shrink-0"
        style={{ background: s.bg, borderRadius: '10px 3px 10px 3px' }}
      >
        <span className="text-[11px] font-medium" style={{ color: s.fg }}>
          {txn.cat.slice(0, 2).toUpperCase()}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="m-0 text-sm font-medium truncate text-gray-900 dark:text-white">{txn.name}</p>
        <p className="m-0 text-xs text-gray-400">{txn.cat} · {txn.date}</p>
      </div>
      <span
        className="text-sm font-medium tabular-nums flex-shrink-0"
        style={{ color: pos ? '#27AE60' : '#f87171' }}
      >
        {pos ? '+' : '-'}${Math.abs(txn.amt).toFixed(2)}
      </span>
      {isHovered && (
        <button
          data-delete="true"
          onClick={(e) => { e.stopPropagation(); setConfirming(true); }}
          className="ml-1 flex-shrink-0 w-8 h-8 flex items-center justify-center text-gray-300 hover:text-red-400 dark:text-gray-600 dark:hover:text-red-400 transition-colors"
          aria-label="Delete transaction"
        >
          <TrashIcon />
        </button>
      )}
    </div>
  );
}
