import { useState } from 'react';
import { useApp } from '../AppContext';
import { CategoryAvatar } from '../utils/categoryStyle';

function PencilIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

export default function BudgetBar({ b }) {
  const { saveBudgetLimit } = useApp();
  const [editing, setEditing]       = useState(false);
  const [draftLimit, setDraftLimit] = useState('');

  const hasBudget = b.budget > 0;
  const pct       = hasBudget ? (b.spent / b.budget) * 100 : 0;
  const over      = hasBudget && b.spent > b.budget;
  const near      = hasBudget && pct >= 85 && pct <= 100;
  const barClr    = over ? '#f87171' : near ? '#F59E0B' : hasBudget ? '#27AE60' : '#888780';
  const diff      = hasBudget ? Math.abs(b.budget - b.spent) : b.spent;

  function startEdit() {
    setDraftLimit(String(b.budget));
    setEditing(true);
  }

  function commitEdit() {
    const val = parseFloat(draftLimit);
    if (!isNaN(val) && val > 0 && val !== b.budget) {
      saveBudgetLimit(b.cat, Math.round(val * 100) / 100);
    }
    setEditing(false);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') commitEdit();
    if (e.key === 'Escape') setEditing(false);
  }

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1.5">
        <div className="flex items-center gap-2">
          <CategoryAvatar category={b.cat} size={28} />
          <span className="text-sm font-medium text-[#f9fafb]">{b.cat}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[13px] tabular-nums text-[#f9fafb]">
            ${b.spent.toFixed(0)}
            <span className="text-[#6b7280]"> / </span>
          </span>
          {editing ? (
            <input
              type="number"
              min="1"
              step="1"
              value={draftLimit}
              onChange={(e) => setDraftLimit(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={handleKeyDown}
              autoFocus
              className="w-20 text-[13px] tabular-nums rounded px-1.5 py-0.5 bg-[#111827] text-[#f9fafb] outline-none"
              style={{ border: '1px solid #1f2937' }}
            />
          ) : (
            <button
              onClick={startEdit}
              className="flex items-center gap-1 group"
              aria-label={`Edit ${b.cat} budget limit`}
            >
              <span className="text-[13px] tabular-nums text-[#6b7280]">${b.budget.toFixed(0)}</span>
              <span className="text-[#6b7280] group-hover:text-[#f9fafb] transition-colors">
                <PencilIcon />
              </span>
            </button>
          )}
        </div>
      </div>

      <div className="h-[7px] rounded overflow-hidden mb-1 transition-colors" style={{ background: '#1f2937' }}>
        <div
          className="h-full rounded transition-all duration-300"
          style={{ width: `${Math.min(pct, 100)}%`, background: barClr }}
        />
      </div>

      <div className="flex justify-between">
        <span className="text-[11px]" style={{ color: over ? '#f87171' : '#6b7280' }}>
          {hasBudget ? (over ? `$${diff.toFixed(0)} over budget` : `$${diff.toFixed(0)} remaining`) : 'No budget set'}
        </span>
        <span className="text-[11px] text-[#6b7280]">{hasBudget ? `${pct.toFixed(0)}%` : 'Set budget'}</span>
      </div>
    </div>
  );
}
