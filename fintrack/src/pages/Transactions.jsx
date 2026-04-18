import { useState } from 'react';
import TransactionRow from '../components/TransactionRow';
import { useApp } from '../AppContext';
import { filterByDateRange } from '../utils';

function groupByDate(txns) {
  const groups = [];
  const seen = new Map();
  for (const t of txns) {
    if (!seen.has(t.date)) {
      seen.set(t.date, []);
      groups.push({ date: t.date, items: seen.get(t.date) });
    }
    seen.get(t.date).push(t);
  }
  return groups;
}

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

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

const DATE_RANGE_OPTIONS = [
  { value: 'this-month',    label: 'This month' },
  { value: 'last-month',    label: 'Last month' },
  { value: 'last-3-months', label: 'Last 3 months' },
  { value: 'last-6-months', label: 'Last 6 months' },
  { value: 'this-year',     label: 'This year' },
  { value: 'all',           label: 'All time' },
  { value: 'custom',        label: 'Custom range' },
];

export default function Transactions() {
  const {
    transactions, loading,
    openAddModal, openCsvModal,
    preferences,
    txnDateRange,  setTxnDateRange,
    txnCustomFrom, setTxnCustomFrom,
    txnCustomTo,   setTxnCustomTo,
  } = useApp();

  const dateGrouped = preferences.layoutStyle === 'date-grouped';
  const [activeFilter, setActiveFilter]   = useState('all');
  const [activeAccount, setActiveAccount] = useState('all');
  const [search, setSearch]               = useState('');

  // ── Date range filter ──────────────────────────────────────────────────────
  const dateFiltered = filterByDateRange(transactions, txnDateRange, txnCustomFrom, txnCustomTo);

  // ── Search filter ──────────────────────────────────────────────────────────
  const searchLower = search.trim().toLowerCase();
  const searched = searchLower
    ? dateFiltered.filter((t) => {
        const amtStr = Math.abs(t.amt).toFixed(2);
        return (
          t.name.toLowerCase().includes(searchLower) ||
          t.cat.toLowerCase().includes(searchLower) ||
          amtStr.includes(searchLower)
        );
      })
    : dateFiltered;

  // ── Category filter ────────────────────────────────────────────────────────
  const allCats = ['all', ...new Set(dateFiltered.map((t) => t.cat))];
  const catFiltered = activeFilter === 'all'
    ? searched
    : searched.filter((t) => t.cat === activeFilter);

  // ── Account filter ─────────────────────────────────────────────────────────
  const allAccounts = [...new Set(dateFiltered.map((t) => t.account).filter(Boolean))];
  const filtered = activeAccount === 'all'
    ? catFiltered
    : catFiltered.filter((t) => t.account === activeAccount);

  const showAccountPills = allAccounts.length >= 2;

  if (!loading && transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <div
          className="w-12 h-12 flex items-center justify-center text-white font-semibold text-xl mx-auto mb-4"
          style={{ background: '#27AE60', borderRadius: '10px 3px 10px 3px', fontFamily: 'Geist, system-ui, sans-serif' }}
        >
          N
        </div>
        <p className="text-[15px] font-semibold text-gray-900 dark:text-white mb-1.5">No transactions yet</p>
        <p className="text-sm text-gray-400 mb-6 leading-relaxed max-w-[260px] mx-auto">
          Add one manually or import a CSV export from your bank.
        </p>
        <div className="flex gap-2.5 justify-center flex-wrap">
          <button
            onClick={openAddModal}
            className="text-sm font-medium px-4 py-2.5 rounded-[20px] text-white transition-colors" style={{ background: '#27AE60' }}
          >
            + Add transaction
          </button>
          <button
            onClick={openCsvModal}
            className="flex items-center gap-1.5 text-sm font-medium px-4 py-2.5 rounded-[20px] border border-gray-300 dark:border-nero-border text-gray-600 dark:text-gray-300 hover:border-gray-400 transition-colors"
          >
            <UploadIcon />
            Import CSV
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ── Search + date range row ── */}
      <div className="flex gap-2 mb-2.5">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <SearchIcon />
          </span>
          <input
            type="text"
            placeholder="Search by name, category, or amount…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-8 py-2 text-sm rounded-lg border border-gray-200 dark:border-nero-border bg-white dark:bg-nero-surface text-gray-900 dark:text-white placeholder:text-gray-400 outline-none focus:border-gray-400 dark:focus:border-nero-green transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              aria-label="Clear search"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        {/* Date range dropdown */}
        <select
          value={txnDateRange}
          onChange={(e) => {
            setTxnDateRange(e.target.value);
            if (e.target.value !== 'custom') { setTxnCustomFrom(''); setTxnCustomTo(''); }
          }}
          className="text-xs px-2.5 py-2 rounded-lg border border-gray-200 dark:border-nero-border bg-white dark:bg-nero-surface text-gray-700 dark:text-gray-300 outline-none focus:border-gray-400 dark:focus:border-nero-green transition-colors flex-shrink-0"
        >
          {DATE_RANGE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Custom date inputs */}
      {txnDateRange === 'custom' && (
        <div className="flex gap-2 mb-2.5">
          <div className="flex-1">
            <label className="text-[10px] uppercase tracking-wider text-gray-400 block mb-1">From</label>
            <input
              type="date"
              value={txnCustomFrom}
              onChange={(e) => setTxnCustomFrom(e.target.value)}
              className="w-full text-sm px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-nero-border bg-white dark:bg-nero-surface text-gray-900 dark:text-white outline-none focus:border-gray-400 transition-colors"
            />
          </div>
          <div className="flex-1">
            <label className="text-[10px] uppercase tracking-wider text-gray-400 block mb-1">To</label>
            <input
              type="date"
              value={txnCustomTo}
              onChange={(e) => setTxnCustomTo(e.target.value)}
              className="w-full text-sm px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-nero-border bg-white dark:bg-nero-surface text-gray-900 dark:text-white outline-none focus:border-gray-400 transition-colors"
            />
          </div>
        </div>
      )}

      {/* Category filter pills */}
      <div className="flex gap-1.5 mb-2 flex-wrap">
        {allCats.map((cat) => {
          const isActive = activeFilter === cat;
          return (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              className="text-xs px-3 py-1 rounded-[20px] cursor-pointer whitespace-nowrap border transition-colors"
              style={isActive
                ? { background: '#27AE60', color: '#fff', borderColor: '#27AE60' }
                : { background: 'transparent', color: '#888', borderColor: '#D1D5DB' }
              }
            >
              {cat === 'all' ? 'All' : cat}
            </button>
          );
        })}
      </div>

      {/* Account filter pills — only when multiple accounts present */}
      {showAccountPills && (
        <div className="flex gap-1.5 mb-3.5 flex-wrap">
          <button
            onClick={() => setActiveAccount('all')}
            className="text-xs px-3 py-1 rounded-[20px] cursor-pointer whitespace-nowrap border transition-colors"
            style={activeAccount === 'all'
              ? { background: '#60a5fa', color: '#fff', borderColor: '#60a5fa' }
              : { background: 'transparent', color: '#888', borderColor: '#D1D5DB' }
            }
          >
            All accounts
          </button>
          {allAccounts.map((acct) => (
            <button
              key={acct}
              onClick={() => setActiveAccount(acct)}
              className="text-xs px-3 py-1 rounded-[20px] cursor-pointer whitespace-nowrap border transition-colors"
              style={activeAccount === acct
                ? { background: '#60a5fa', color: '#fff', borderColor: '#60a5fa' }
                : { background: 'transparent', color: '#888', borderColor: '#D1D5DB' }
              }
            >
              {acct}
            </button>
          ))}
        </div>
      )}

      {/* No separator row between cat + account when account pills hidden */}
      {!showAccountPills && <div className="mb-1.5" />}

      {/* Transaction list */}
      {filtered.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-sm text-gray-400">
            {search ? `No results for "${search}"` : 'No transactions in this range.'}
          </p>
          {search && (
            <button
              onClick={() => setSearch('')}
              className="mt-3 text-xs text-gray-400 underline underline-offset-2"
            >
              Clear search
            </button>
          )}
        </div>
      ) : dateGrouped ? (
        groupByDate(filtered).map(({ date, items }, idx) => (
          <div key={date} className={`mb-4 ${idx > 0 ? 'pt-4 border-t border-gray-200 dark:border-nero-border' : ''}`}>
            <p className="text-xs uppercase tracking-[.08em] text-gray-500 dark:text-gray-400 mb-2 px-0.5">{date}</p>
            {items.map((t) => <TransactionRow key={t.id} txn={t} />)}
          </div>
        ))
      ) : (
        filtered.map((t) => <TransactionRow key={t.id} txn={t} />)
      )}
    </>
  );
}
