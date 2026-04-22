import { useState, useEffect } from 'react';

const EMOJI_OPTIONS = [
  '🎯','🐕','🚀','🎮','🍕','☕','🎸','📚','💪','✈️',
  '🎁','💅','🏋️','🎨','🌮','👗','🏠','🌱','🐱','🎉',
];

const CAT_OPTIONS = [
  'Dining','Groceries','Shopping','Transport','Health',
  'Subscriptions','Housing','Utilities','Insurance','Travel','Entertainment','Other',
];

export default function CustomBudgetModal({ open, onClose, initial, onSave, saving }) {
  const [name,      setName]      = useState('');
  const [emoji,     setEmoji]     = useState('🎯');
  const [limit,     setLimit]     = useState('');
  const [matchType, setMatchType] = useState('category');
  const [matchValue,setMatchValue]= useState('');

  useEffect(() => {
    if (open) {
      setName(initial?.custom_name ?? '');
      setEmoji(initial?.custom_emoji ?? '🎯');
      setLimit(initial?.budget ? String(initial.budget) : '');
      setMatchType(initial?.match_type ?? 'category');
      setMatchValue(initial?.match_value ?? '');
    }
  }, [open, initial]);

  function handleSave() {
    const n = name.trim();
    const l = parseFloat(limit);
    const v = matchValue.trim();
    if (!n || isNaN(l) || l <= 0 || !v) return;
    onSave({ custom_name: n, custom_emoji: emoji, budget: l, match_type: matchType, match_value: v });
  }

  const valid = name.trim() && parseFloat(limit) > 0 && matchValue.trim();

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/60 transition-opacity duration-200"
        style={{ opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none' }}
        onClick={onClose}
      />
      <div
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl max-w-[680px] mx-auto shadow-2xl transition-transform duration-300 ease-out"
        style={{
          transform: open ? 'translateY(0)' : 'translateY(100%)',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          background: '#111827',
          borderTop: '0.5px solid #1f2937',
        }}
      >
        {/* Handle */}
        <div className="pt-4 pb-2 flex justify-center flex-shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: '#1f2937' }} />
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-5 pb-3">
          <p className="text-[15px] font-semibold text-[#f9fafb] mb-4">
            {initial ? 'Edit custom budget' : 'Create custom budget'}
          </p>

          {/* Name */}
          <div className="mb-4">
            <p className="text-[11px] uppercase tracking-[0.1em] text-[#9ca3af] mb-1.5">Budget name</p>
            <input
              type="text"
              placeholder="e.g. Date nights, Dog food, Side hustle"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl px-3 py-2.5 text-sm text-[#f9fafb] outline-none"
              style={{ background: '#0a0e1a', border: '1px solid #1f2937' }}
              onFocus={(e) => (e.target.style.borderColor = '#374151')}
              onBlur={(e)  => (e.target.style.borderColor = '#1f2937')}
            />
          </div>

          {/* Emoji picker */}
          <div className="mb-4">
            <p className="text-[11px] uppercase tracking-[0.1em] text-[#9ca3af] mb-1.5">Icon</p>
            <div className="grid grid-cols-10 gap-1">
              {EMOJI_OPTIONS.map((e) => (
                <button
                  key={e}
                  onClick={() => setEmoji(e)}
                  className="flex items-center justify-center rounded-lg transition-all"
                  style={{
                    height: 36, fontSize: 20,
                    background: emoji === e ? '#1f2937' : 'transparent',
                    border: emoji === e ? '1px solid #374151' : '1px solid transparent',
                  }}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Monthly limit */}
          <div className="mb-4">
            <p className="text-[11px] uppercase tracking-[0.1em] text-[#9ca3af] mb-1.5">Monthly limit</p>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none" style={{ color: '#9ca3af' }}>$</span>
              <input
                type="number"
                min="1"
                step="1"
                placeholder="200"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                className="w-full rounded-xl pl-6 pr-3 py-2.5 text-sm text-[#f9fafb] outline-none"
                style={{ background: '#0a0e1a', border: '1px solid #1f2937' }}
                onFocus={(e) => (e.target.style.borderColor = '#374151')}
                onBlur={(e)  => (e.target.style.borderColor = '#1f2937')}
              />
            </div>
          </div>

          {/* Match type toggle */}
          <div className="mb-4">
            <p className="text-[11px] uppercase tracking-[0.1em] text-[#9ca3af] mb-1.5">Match by</p>
            <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid #1f2937' }}>
              {['category', 'merchant'].map((t) => (
                <button
                  key={t}
                  onClick={() => { setMatchType(t); setMatchValue(''); }}
                  className="flex-1 py-2 text-xs font-medium capitalize transition-colors"
                  style={{
                    background: matchType === t ? '#1f2937' : 'transparent',
                    color: matchType === t ? '#f9fafb' : '#9ca3af',
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Match value */}
          <div className="mb-2">
            {matchType === 'category' ? (
              <>
                <p className="text-[11px] uppercase tracking-[0.1em] text-[#9ca3af] mb-1.5">Category</p>
                <select
                  value={matchValue}
                  onChange={(e) => setMatchValue(e.target.value)}
                  className="w-full rounded-xl px-3 py-2.5 text-sm text-[#f9fafb] outline-none appearance-none"
                  style={{ background: '#0a0e1a', border: '1px solid #1f2937' }}
                >
                  <option value="">Select a category…</option>
                  {CAT_OPTIONS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </>
            ) : (
              <>
                <p className="text-[11px] uppercase tracking-[0.1em] text-[#9ca3af] mb-1.5">Merchant keywords</p>
                <input
                  type="text"
                  placeholder="e.g. starbucks, coffee bean"
                  value={matchValue}
                  onChange={(e) => setMatchValue(e.target.value)}
                  className="w-full rounded-xl px-3 py-2.5 text-sm text-[#f9fafb] outline-none"
                  style={{ background: '#0a0e1a', border: '1px solid #1f2937' }}
                  onFocus={(e) => (e.target.style.borderColor = '#374151')}
                  onBlur={(e)  => (e.target.style.borderColor = '#1f2937')}
                />
                <p className="text-[10px] mt-1" style={{ color: '#6b7280' }}>
                  Comma-separated — transactions containing any keyword count toward this budget.
                </p>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pt-3 flex-shrink-0"
             style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom, 0px))', borderTop: '0.5px solid #1f2937' }}>
          <div className="flex gap-2.5">
            <button
              onClick={handleSave}
              disabled={!valid || saving}
              className="flex-1 text-white text-sm font-medium py-3 rounded-[20px] transition-colors disabled:opacity-40"
              style={{ background: '#27AE60' }}
            >
              {saving ? 'Saving…' : (initial ? 'Save changes' : 'Create budget')}
            </button>
            <button
              onClick={onClose}
              className="flex-1 text-sm font-medium py-3 rounded-[20px] text-[#f9fafb]"
              style={{ background: '#1f2937', border: '1px solid #374151' }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
