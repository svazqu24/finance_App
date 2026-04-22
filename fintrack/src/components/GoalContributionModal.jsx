import { useState, useEffect } from 'react';

const inputCls =
  'w-full border rounded-xl px-4 py-3 text-sm bg-[#1f1f1f] border-[#2a2a2a] text-white placeholder:text-gray-500 ' +
  'outline-none focus:border-[#27ae60] focus:ring-2 focus:ring-emerald-500/20 transition-colors';

const labelCls = 'text-[11px] uppercase tracking-[.08em] text-gray-400 block mb-1';

export default function GoalContributionModal({ open, goal, onClose, onSave }) {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  useEffect(() => {
    if (!open) return;
    setAmount('');
    setNote('');
    setDate(new Date().toISOString().slice(0, 10));
  }, [open, goal]);

  useEffect(() => {
    if (!open) return;

    const lockBodyScroll = () => {
      const count = (window.__neroModalOpenCount ?? 0) + 1;
      window.__neroModalOpenCount = count;
      if (count === 1) document.body.style.overflow = 'hidden';
    };
    const unlockBodyScroll = () => {
      const count = Math.max(0, (window.__neroModalOpenCount ?? 1) - 1);
      window.__neroModalOpenCount = count;
      if (count === 0) document.body.style.overflow = '';
    };

    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };

    lockBodyScroll();
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      unlockBodyScroll();
    };
  }, [open, onClose]);

  function handleSubmit(event) {
    event.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!goal || isNaN(parsedAmount) || parsedAmount <= 0) return;
    onSave({ amount: parsedAmount, note: note.trim(), date });
  }

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/60 transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      <div
        className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ease-out ${open ? 'translate-y-0' : 'translate-y-full'}`}
      >
        <div
          className="rounded-t-2xl max-w-[680px] mx-auto px-5 pt-4 shadow-2xl border-t border-[#2a2a2a] max-h-[90vh] overflow-y-auto"
          style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom, 0px))', background: '#1f1f1f' }}
        >
          <div className="w-10 h-1 bg-gray-200 dark:bg-nero-border rounded-full mx-auto mb-4" />

          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-[15px] font-semibold text-gray-900 dark:text-white">
                Contribute to {goal?.name ?? 'goal'}
              </p>
              {goal && (
                <p className="text-xs text-gray-400 m-0">Target ${goal.target.toLocaleString()}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-11 h-11 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              aria-label="Close"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className={labelCls}>Amount</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0.01"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="25.00"
                  className={`${inputCls} pl-10`}
                  required
                />
              </div>
            </div>

            <div>
              <label className={labelCls}>Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={inputCls}
                required
              />
            </div>

            <div>
              <label className={labelCls}>Note</label>
              <textarea
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Tax refund, birthday money, etc."
                className={inputCls}
              />
            </div>

            <div className="flex gap-2.5 mt-1">
              <button
                type="submit"
                className="flex-1 text-white text-sm font-medium py-3 rounded-[20px] transition-colors"
                style={{ background: '#27AE60' }}
              >
                Save contribution
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 border border-gray-200 dark:border-nero-border text-sm font-medium py-3 rounded-[20px] text-gray-700 dark:text-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
