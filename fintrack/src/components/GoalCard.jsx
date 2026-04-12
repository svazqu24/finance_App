import { projectedDate } from '../data';
import { useApp } from '../AppContext';

function PencilIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

export default function GoalCard({ g }) {
  const { setEditGoal } = useApp();
  const pct      = Math.min((g.saved / g.target) * 100, 100);
  const rem      = g.target - g.saved;
  const initials = g.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="bg-[#f5f5f3] dark:bg-nero-surface rounded-xl px-4 py-3.5 mb-2.5 transition-colors">
      <div className="flex justify-between items-start mb-2.5">
        <div className="flex gap-2.5 items-center">
          <div
            className="w-9 h-9 flex items-center justify-center flex-shrink-0"
            style={{ background: g.bg, borderRadius: '10px 3px 10px 3px' }}
          >
            <span className="text-[11px] font-medium" style={{ color: g.fg }}>{initials}</span>
          </div>
          <div>
            <p className="text-sm font-medium m-0 text-gray-900 dark:text-white">{g.name}</p>
            <p className="text-xs text-gray-400 m-0">Target: ${g.target.toLocaleString()}</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <div className="text-right">
            <p className="text-[15px] font-medium m-0 tabular-nums text-gray-900 dark:text-white">
              ${g.saved.toLocaleString()}
            </p>
            <p className="text-xs text-gray-400 m-0">{pct.toFixed(0)}%</p>
          </div>
          <button
            onClick={() => setEditGoal(g)}
            className="mt-0.5 text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 transition-colors"
            aria-label={`Edit ${g.name}`}
          >
            <PencilIcon />
          </button>
        </div>
      </div>
      <div className="h-[7px] bg-gray-200 dark:bg-nero-border rounded overflow-hidden mb-1.5 transition-colors">
        <div className="h-full rounded" style={{ width: `${pct}%`, background: g.clr }} />
      </div>
      <div className="flex justify-between">
        <span className="text-xs text-gray-400">${rem.toLocaleString()} to go · +${g.monthly}/mo</span>
        <span className="text-xs font-medium text-gray-900 dark:text-white">{projectedDate(g)}</span>
      </div>
    </div>
  );
}
