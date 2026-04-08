import { Doughnut, Bar } from 'react-chartjs-2';
import { spendCats } from '../data';

const donutData = {
  labels: spendCats.map((s) => s.label),
  datasets: [
    {
      data: spendCats.map((s) => s.amt),
      backgroundColor: spendCats.map((s) => s.clr),
      borderWidth: 0,
    },
  ],
};

const donutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '65%',
  plugins: { legend: { display: false } },
};

const barData = {
  labels: ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'],
  datasets: [
    {
      data: [3920, 4280, 5100, 3650, 3480, 3640],
      backgroundColor: 'rgba(24,95,165,.7)',
      borderRadius: 3,
    },
  ],
};

const barOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: '#888', font: { size: 11 } },
    },
    y: {
      grid: { color: 'rgba(0,0,0,.05)' },
      ticks: {
        color: '#888',
        font: { size: 11 },
        callback: (v) => '$' + v.toLocaleString(),
      },
    },
  },
};

export default function Spending() {
  return (
    <>
      <div className="grid gap-5 mb-6" style={{ gridTemplateColumns: '160px 1fr' }}>
        <div>
          <p className="text-xs text-gray-400 mb-1.5">By category</p>
          <div className="relative h-40">
            <Doughnut data={donutData} options={donutOptions} />
          </div>
        </div>
        <div className="mt-5">
          {spendCats.map((s) => (
            <div
              key={s.label}
              className="flex justify-between items-center py-[5px] border-b border-gray-200"
            >
              <span className="flex items-center gap-1.5 text-xs">
                <span
                  className="w-2 h-2 rounded-[2px] inline-block"
                  style={{ background: s.clr }}
                />
                {s.label}
              </span>
              <span className="text-xs tabular-nums text-gray-400">${s.amt}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-gray-400 mb-2">Monthly spending</p>
      <div className="relative h-[140px] mb-4">
        <Bar data={barData} options={barOptions} />
      </div>

      <div className="bg-[#f5f5f3] rounded-lg p-3.5">
        <p className="text-[11px] uppercase tracking-[.08em] text-gray-400 m-0 mb-1.5">
          April insight
        </p>
        <p className="text-sm m-0 leading-relaxed">
          Dining spend dropped 18% vs. March. Housing is your largest category at 40% of monthly
          expenses.
        </p>
      </div>
    </>
  );
}
