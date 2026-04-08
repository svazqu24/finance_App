import { catSty } from '../data';

export default function BudgetBar({ b }) {
  const pct = (b.spent / b.budget) * 100;
  const over = b.spent > b.budget;
  const near = pct >= 85 && pct <= 100;
  const barClr = over ? '#E24B4A' : near ? '#BA7517' : '#639922';
  const diff = Math.abs(b.budget - b.spent);
  const s = catSty[b.cat] || { bg: '#DDDBD3', fg: '#444441' };

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1.5">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{ background: s.bg }}
          >
            <span className="text-[11px] font-medium" style={{ color: s.fg }}>
              {b.cat.slice(0, 2).toUpperCase()}
            </span>
          </div>
          <span className="text-sm font-medium">{b.cat}</span>
        </div>
        <span className="text-[13px] tabular-nums">
          ${b.spent} <span style={{ color: '#aaa' }}>/ ${b.budget}</span>
        </span>
      </div>
      <div className="h-[7px] bg-gray-200 rounded overflow-hidden mb-1">
        <div
          className="h-full rounded"
          style={{ width: `${Math.min(pct, 100)}%`, background: barClr }}
        />
      </div>
      <div className="flex justify-between">
        <span className="text-[11px]" style={{ color: over ? '#E24B4A' : '#888' }}>
          {over ? `$${diff} over budget` : `$${diff} remaining`}
        </span>
        <span className="text-[11px]" style={{ color: '#aaa' }}>{pct.toFixed(0)}%</span>
      </div>
    </div>
  );
}
