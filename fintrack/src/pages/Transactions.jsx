import { useState } from 'react';
import TransactionRow from '../components/TransactionRow';
import { txns } from '../data';

const allCats = ['all', ...new Set(txns.map((t) => t.cat))];

export default function Transactions() {
  const [activeFilter, setActiveFilter] = useState('all');
  const filtered = activeFilter === 'all' ? txns : txns.filter((t) => t.cat === activeFilter);

  return (
    <>
      <div className="flex gap-1.5 mb-3.5 flex-wrap">
        {allCats.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveFilter(cat)}
            className="text-xs px-3 py-1 rounded-full cursor-pointer whitespace-nowrap"
            style={{
              background: activeFilter === cat ? '#111' : 'transparent',
              color: activeFilter === cat ? '#fff' : '#888',
              border: activeFilter === cat ? '1px solid #111' : '1px solid #ccc',
            }}
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
