import { useState } from 'react';
import TransactionRow from '../components/TransactionRow';
import { useApp } from '../AppContext';

export default function Transactions() {
  const { transactions } = useApp();
  const [activeFilter, setActiveFilter] = useState('all');

  const allCats = ['all', ...new Set(transactions.map((t) => t.cat))];
  const filtered = activeFilter === 'all' ? transactions : transactions.filter((t) => t.cat === activeFilter);

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

      {filtered.map((t, i) => (
        <TransactionRow key={i} txn={t} />
      ))}
    </>
  );
}
