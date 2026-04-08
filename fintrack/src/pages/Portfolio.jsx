import { Doughnut } from 'react-chartjs-2';
import { portfolio } from '../data';

const portTotal = portfolio.reduce((s, p) => s + p.val, 0);

const chartData = {
  labels: portfolio.map((p) => p.name),
  datasets: [
    {
      data: portfolio.map((p) => p.val),
      backgroundColor: portfolio.map((p) => p.clr),
      borderWidth: 0,
    },
  ],
};

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '60%',
  plugins: { legend: { display: false } },
};

export default function Portfolio() {
  return (
    <>
      <div className="grid grid-cols-3 gap-2 mb-6">
        {portfolio.map((p) => (
          <div key={p.name} className="bg-[#f5f5f3] rounded-lg px-3.5 py-3">
            <p className="text-[11px] uppercase tracking-[.08em] text-gray-400 m-0 mb-1">{p.name}</p>
            <p className="text-[20px] font-medium tabular-nums m-0">${p.val.toLocaleString()}</p>
            <p className="text-xs mt-0.5 m-0" style={{ color: '#3B6D11' }}>+{p.chg}% YTD</p>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-400 mb-2">Allocation</p>
      <div className="relative h-[180px] mb-2.5">
        <Doughnut data={chartData} options={chartOptions} />
      </div>

      <div className="flex gap-3.5 flex-wrap text-xs text-gray-400 mb-6">
        {portfolio.map((p) => (
          <span key={p.name} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-[2px] inline-block" style={{ background: p.clr }} />
            {p.name} — {((p.val / portTotal) * 100).toFixed(1)}%
          </span>
        ))}
      </div>

      <div className="bg-[#f5f5f3] rounded-xl p-4">
        <div className="flex justify-between items-center mb-2.5">
          <div>
            <p className="text-[11px] uppercase tracking-[.08em] text-gray-400 m-0 mb-0.5">
              milestone
            </p>
            <p className="text-base font-medium m-0">$50,000 net worth</p>
          </div>
          <span className="text-sm font-medium" style={{ color: '#3B6D11' }}>95.7%</span>
        </div>
        <div className="h-1.5 bg-gray-200 rounded overflow-hidden mb-2">
          <div className="h-full rounded" style={{ width: '95.7%', background: '#185FA5' }} />
        </div>
        <p className="text-xs text-gray-400 m-0">$2,160 away — you're almost there!</p>
      </div>
    </>
  );
}
