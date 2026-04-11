import { useState } from 'react';
import TransactionRow from '../components/TransactionRow';
import { useApp } from '../AppContext';

function UploadIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 16 12 12 8 16" />
      <line x1="12" y1="12" x2="12" y2="21" />
      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
    </svg>
  );
}

export default function Transactions() {
  const { transactions, loading, openAddModal, openCsvModal } = useApp();
  const [activeFilter, setActiveFilter] = useState('all');

  const allCats = ['all', ...new Set(transactions.map((t) => t.cat))];
  const filtered = activeFilter === 'all' ? transactions : transactions.filter((t) => t.cat === activeFilter);

  if (!loading && transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sm font-medium text-gray-900 dark:text-white mb-1.5">No transactions yet</p>
        <p className="text-xs text-gray-400 mb-6 leading-relaxed">
          Add a transaction manually or import a CSV export from your bank.
        </p>
        <div className="flex gap-2.5 justify-center flex-wrap">
          <button
            onClick={openAddModal}
            className="text-xs font-medium px-4 py-2 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 transition-colors"
          >
            + Add transaction
          </button>
          <button
            onClick={openCsvModal}
            className="flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-full border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-gray-400 transition-colors"
          >
            <UploadIcon />
            Import from CSV
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex gap-1.5 mb-3.5 flex-wrap">
        {allCats.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveFilter(cat)}
            className={`text-xs px-3 py-1 rounded-full cursor-pointer whitespace-nowrap border transition-colors ${
              activeFilter === cat
                ? 'bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900 dark:border-white'
                : 'bg-transparent text-gray-500 dark:text-gray-400 border-gray-300 dark:border-gray-600'
            }`}
          >
            {cat === 'all' ? 'All' : cat}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">
          No {activeFilter} transactions.
        </p>
      ) : (
        filtered.map((t, i) => <TransactionRow key={i} txn={t} />)
      )}
    </>
  );
}
