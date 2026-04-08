import { projectedDate } from '../data';

export default function GoalCard({ g }) {
  const pct = Math.min((g.saved / g.target) * 100, 100);
  const rem = g.target - g.saved;
  const initials = g.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="bg-[#f5f5f3] dark:bg-gray-800 rounded-xl px-4 py-3.5 mb-2.5 transition-colors">
      <div className="flex justify-between items-start mb-2.5">
        <div className="flex gap-2.5 items-center">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: g.bg }}
          >
            <span className="text-[11px] font-medium" style={{ color: g.fg }}>{initials}</span>
          </div>
          <div>
            <p className="text-sm font-medium m-0 text-gray-900 dark:text-white">{g.name}</p>
            <p className="text-xs text-gray-400 m-0">Target: ${g.target.toLocaleString()}</p>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-[15px] font-medium m-0 tabular-nums text-gray-900 dark:text-white">${g.saved.toLocaleString()}</p>
          <p className="text-xs text-gray-400 m-0">{pct.toFixed(0)}%</p>
        </div>
      </div>
      <div className="h-[7px] bg-gray-200 dark:bg-gray-700 rounded overflow-hidden mb-1.5 transition-colors">
        <div
          className="h-full rounded"
          style={{ width: `${pct}%`, background: g.clr }}
        />
      </div>
      <div className="flex justify-between">
        <span className="text-xs text-gray-400">${rem.toLocaleString()} to go · +${g.monthly}/mo</span>
        <span className="text-xs font-medium text-gray-900 dark:text-white">{projectedDate(g)}</span>
      </div>
    </div>
  );
}
