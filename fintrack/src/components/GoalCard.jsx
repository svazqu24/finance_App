import { useState, useEffect, useRef } from 'react';
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

export default function GoalCard({ g, contributions = [], onContribute }) {
  const { setEditGoal } = useApp();
  const [showAll, setShowAll] = useState(false);
  const [milestone, setMilestone] = useState('');
  const previousMilestone = useRef(0);
  const pct      = Math.min((g.saved / g.target) * 100, 100);
  const rem      = g.target - g.saved;
  const initials = g.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  useEffect(() => {
    const thresholds = [25, 50, 75, 100];
    const next = thresholds.slice().reverse().find((threshold) => pct >= threshold) || 0;
    if (next > previousMilestone.current) {
      previousMilestone.current = next;
      setMilestone(next === 0 ? '' : `🎯 ${next}% there!`);
      const timeout = setTimeout(() => setMilestone(''), 3000);
      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [pct]);

  const visibleContributions = showAll ? contributions : contributions.slice(0, 5);

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

      {milestone && (
        <div className="rounded-full px-3 py-2 mb-3 text-sm font-medium text-emerald-800 bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-200">
          {milestone}
        </div>
      )}

      <div className="flex flex-col gap-3 mb-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onContribute}
            className="text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors rounded-full px-3 py-2"
          >
            + Contribute
          </button>
          <span className="text-xs text-gray-500">{contributions.length} contribution{contributions.length === 1 ? '' : 's'}</span>
        </div>

        {contributions.length > 0 && (
          <div className="space-y-2">
            {visibleContributions.map((entry) => (
              <div key={entry.id} className="rounded-2xl border border-gray-200 dark:border-nero-border bg-white/80 dark:bg-nero-bg p-3">
                <div className="flex justify-between gap-3 items-center">
                  <span className="text-xs text-gray-500">{new Date(entry.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">+${entry.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                {entry.note && <p className="mt-1 text-xs text-gray-400">{entry.note}</p>}
              </div>
            ))}
            {contributions.length > 5 && (
              <button
                type="button"
                onClick={() => setShowAll((prev) => !prev)}
                className="text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                {showAll ? 'Show less' : `View all (${contributions.length})`}
              </button>
            )}
          </div>
        )}
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
