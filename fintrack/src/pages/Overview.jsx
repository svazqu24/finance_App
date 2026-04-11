import { Link } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import TransactionRow from '../components/TransactionRow';
import { useApp } from '../AppContext';

const netWorthData = {
  labels: ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'],
  datasets: [
    {
      data: [38200, 40100, 41500, 42800, 44900, 46600, 47840],
      borderColor: '#185FA5',
      backgroundColor: 'rgba(24,95,165,.07)',
      fill: true,
      tension: 0.4,
      pointRadius: 3,
      pointBackgroundColor: '#185FA5',
      borderWidth: 2,
    },
  ],
};

const netWorthOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: {
      grid: { color: 'rgba(0,0,0,.05)' },
      ticks: { color: '#888', font: { size: 11 } },
    },
    y: {
      grid: { color: 'rgba(0,0,0,.05)' },
      ticks: {
        color: '#888',
        font: { size: 11 },
        callback: (v) => '$' + (v / 1000).toFixed(0) + 'k',
      },
    },
  },
};

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
      {/* Net worth chart — shown for everyone */}
      <p className="text-xs text-gray-400 mb-2">Net worth — last 7 months</p>
      <div className="relative h-40 mb-6">
        <Line data={netWorthData} options={netWorthOptions} />
      </div>

      {isEmpty ? (
        /* ── Empty state ── */
        <div className="bg-[#f5f5f3] dark:bg-gray-800 rounded-2xl px-6 py-10 text-center transition-colors">
          <p className="text-[15px] font-semibold text-gray-900 dark:text-white mb-1.5">
            Welcome to FinTrack
          </p>
          <p className="text-sm text-gray-400 leading-relaxed mb-6 max-w-[280px] mx-auto">
            Add your first transaction manually or import a CSV from your bank to get started.
          </p>
          <div className="flex gap-2.5 justify-center flex-wrap">
            <button
              onClick={openAddModal}
              className="flex items-center gap-1.5 text-sm font-medium px-4 py-2.5 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 transition-colors"
            >
              <PlusIcon />
              Add transaction
            </button>
            <button
              onClick={openCsvModal}
              className="flex items-center gap-1.5 text-sm font-medium px-4 py-2.5 rounded-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400 transition-colors"
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
            <Link to="/transactions" className="text-xs no-underline" style={{ color: '#185FA5' }}>
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
