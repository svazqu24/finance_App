import { Link } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import TransactionRow from '../components/TransactionRow';
import { txns } from '../data';

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

export default function Overview() {
  return (
    <>
      <p className="text-xs text-gray-400 mb-2">Net worth — last 7 months</p>
      <div className="relative h-40 mb-6">
        <Line data={netWorthData} options={netWorthOptions} />
      </div>

      <div className="flex justify-between items-center mb-2.5">
        <div>
          <p className="text-[13px] font-medium m-0">Recent activity</p>
          <p className="text-xs text-gray-400 mt-0.5 m-0">10-second fraud check</p>
        </div>
        <Link to="/transactions" className="text-xs no-underline" style={{ color: '#185FA5' }}>
          All →
        </Link>
      </div>

      {txns.slice(0, 5).map((t, i) => (
        <TransactionRow key={i} txn={t} />
      ))}
    </>
  );
}
