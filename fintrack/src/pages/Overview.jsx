import { Link } from 'react-router-dom';
import TransactionRow from '../components/TransactionRow';
import { useApp } from '../AppContext';

function UploadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 16 12 12 8 16" />
      <line x1="12" y1="12" x2="12" y2="21" />
      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

export default function Overview() {
  const { transactions, loading, openAddModal, openCsvModal } = useApp();

  const isEmpty = !loading && transactions.length === 0;

  return (
    <>
      {/* Net worth placeholder */}
      <div className="h-32 mb-6 rounded-xl bg-[#f5f5f3] dark:bg-nero-surface flex items-center justify-center transition-colors">
        <p className="text-xs text-gray-400 text-center leading-relaxed px-4">
          Net worth history will appear here once you start tracking your accounts.
        </p>
      </div>

      {isEmpty ? (
        /* ── Empty state ── */
        <div className="bg-[#f5f5f3] dark:bg-nero-surface rounded-2xl px-6 py-10 text-center transition-colors">
          <p className="text-[15px] font-semibold text-gray-900 dark:text-white mb-1.5">
            Welcome to Nero
          </p>
          <p className="text-sm text-gray-400 leading-relaxed mb-6 max-w-[280px] mx-auto">
            Add your first transaction manually or import a CSV from your bank to get started.
          </p>
          <div className="flex gap-2.5 justify-center flex-wrap">
            <button
              onClick={openAddModal}
              className="flex items-center gap-1.5 text-sm font-medium px-4 py-2.5 rounded-[20px] text-white transition-colors" style={{ background: '#27AE60' }}
            >
              <PlusIcon />
              Add transaction
            </button>
            <button
              onClick={openCsvModal}
              className="flex items-center gap-1.5 text-sm font-medium px-4 py-2.5 rounded-[20px] border border-gray-300 dark:border-nero-border text-gray-700 dark:text-gray-300 hover:border-gray-400 transition-colors"
            >
              <UploadIcon />
              Import from CSV
            </button>
          </div>
        </div>
      ) : (
        /* ── Recent activity ── */
        <>
          <div className="flex justify-between items-center mb-2.5">
            <div>
              <p className="text-[13px] font-medium m-0 text-gray-900 dark:text-white">Recent activity</p>
              <p className="text-xs text-gray-400 mt-0.5 m-0">10-second fraud check</p>
            </div>
            <Link to="/transactions" className="text-xs no-underline" style={{ color: '#27AE60' }}>
              All →
            </Link>
          </div>
          {transactions.slice(0, 5).map((t, i) => (
            <TransactionRow key={i} txn={t} />
          ))}
        </>
      )}
    </>
  );
}
