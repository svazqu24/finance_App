import { useState, useEffect, useRef } from 'react';
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

export default function GoalCard({ g, contributions = [], onContribute, onDeleteContribution }) {
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
    if (next > previousMilestone.current && next > 0) {
      const milestoneKey = `goal-milestone-${g.id}-${next}`;
      const alreadySeen = window.localStorage.getItem(milestoneKey);
      if (!alreadySeen) {
        window.localStorage.setItem(milestoneKey, '1');
        previousMilestone.current = next;
        setMilestone(`You're ${next}% of the way to ${g.name}!`);
        const timeout = setTimeout(() => setMilestone(''), 4000);
        return () => clearTimeout(timeout);
      }
    }
    return undefined;
  }, [pct, g.id, g.name]);

  const visibleContributions = showAll ? contributions : contributions.slice(0, 3);

  const projectionText = (() => {
    if (contributions.length === 0) return null;
    const sorted = [...contributions].sort((a, b) => new Date(a.date) - new Date(b.date));
    const total = sorted.reduce((sum, item) => sum + item.amount, 0);
    const start = new Date(sorted[0].date);
    const end = new Date(sorted[sorted.length - 1].date);
    const monthSpan = Math.max(1, (end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth() + 1);
    const average = total / monthSpan;
    if (average <= 0 || rem <= 0) return null;
    const monthsToGoal = Math.ceil(rem / average);
    const projected = new Date();
    projected.setMonth(projected.getMonth() + monthsToGoal);
    return projected.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  })();

  return (
    <div className="rounded-xl px-4 py-3.5 mb-2.5" style={{ background: '#111827', border: '0.5px solid #1f2937' }}>
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
        <div className="rounded-full px-3 py-2 mb-3 text-sm font-medium" style={{ background: 'rgba(39,174,96,0.12)', color: '#34d399' }}>
          {milestone}
        </div>
      )}

      <div className="flex flex-col gap-3 mb-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onContribute}
            className="text-sm font-semibold text-white rounded-full px-3 py-2 transition-opacity hover:opacity-90"
            style={{ background: '#27AE60' }}
          >
            + Contribute
          </button>
          <span className="text-xs text-gray-500">{contributions.length} contribution{contributions.length === 1 ? '' : 's'}</span>
        </div>

        {contributions.length > 0 && (
          <div className="space-y-2">
            {visibleContributions.map((entry) => (
              <div key={entry.id} className="group rounded-xl p-3 relative" style={{ background: '#0a0e1a', border: '0.5px solid #1f2937' }}>
                <div className="flex justify-between gap-3 items-start">
                  <div>
                    <p className="text-xs text-gray-500">{new Date(entry.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    {entry.note && <p className="mt-1 text-xs text-gray-400">{entry.note}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold" style={{ color: '#34d399' }}>+${entry.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    {onDeleteContribution && (
                      <button
                        type="button"
                        onClick={() => onDeleteContribution(entry.id, entry.amount)}
                        className="opacity-50 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-colors"
                        aria-label="Delete contribution"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m5 0V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
                          <line x1="10" y1="11" x2="10" y2="17" />
                          <line x1="14" y1="11" x2="14" y2="17" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {contributions.length > 3 && (
              <button
                type="button"
                onClick={() => setShowAll((prev) => !prev)}
                className="text-xs font-medium transition-colors"
                style={{ color: '#27AE60' }}
              >
                {showAll ? 'Show less' : `View all ${contributions.length} contribution${contributions.length === 1 ? '' : 's'}`}
              </button>
            )}
          </div>
        )}
      </div>
      <div className="h-[7px] rounded overflow-hidden mb-1.5" style={{ background: '#1f2937' }}>
        <div className="h-full rounded" style={{ width: `${pct}%`, background: g.clr }} />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-xs text-gray-400">${rem.toLocaleString()} to go</span>
        {projectionText ? (
          <span className="text-xs font-medium text-gray-900 dark:text-white">At this rate — on track for {projectionText}</span>
        ) : (
          <span className="text-xs text-gray-400">Add contributions to see your projection</span>
        )}
      </div>
    </div>
  );
}
