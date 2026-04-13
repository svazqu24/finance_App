import { useState, useEffect } from 'react';
import { useApp } from '../AppContext';

const FREQUENCIES = [
  { value: 'weekly',   label: 'Weekly' },
  { value: 'biweekly', label: 'Biweekly' },
  { value: 'monthly',  label: 'Monthly' },
  { value: 'yearly',   label: 'Yearly' },
];

const inputCls =
  'w-full border border-gray-200 dark:border-nero-border rounded-lg px-3 py-3 text-sm ' +
  'bg-white dark:bg-nero-bg text-gray-900 dark:text-white placeholder:text-gray-400 ' +
  'outline-none focus:border-gray-400 dark:focus:border-nero-green transition-colors';

const labelCls = 'text-[11px] uppercase tracking-[.08em] text-gray-400 block mb-1';

const BLANK = { name: '', amount: '', frequency: 'monthly', next_due_date: '' };

export default function SubscriptionModal({ open, onClose }) {
  const { addBill } = useApp();
  const [form, setForm]       = useState(BLANK);
  const [saving, setSaving]   = useState(false);

  useEffect(() => {
    if (!open) { setForm(BLANK); setSaving(false); }
  }, [open]);

  function setField(key, val) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    if (!form.name.trim() || isNaN(amount) || amount <= 0) return;
    setSaving(true);
    await addBill({
      name:            form.name.trim(),
      amount,
      due_day:         form.next_due_date ? new Date(form.next_due_date).getDate() : 1,
      cat:             'Subscriptions',
      is_subscription: true,
      frequency:       form.frequency,
      next_due_date:   form.next_due_date || null,
    });
    setSaving(false);
    onClose();
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
          className="bg-white dark:bg-nero-surface rounded-t-2xl max-w-[680px] mx-auto px-5 pt-4 shadow-2xl border-t border-transparent dark:border-nero-border"
          style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom, 0px))' }}
        >
          <div className="w-10 h-1 bg-gray-200 dark:bg-nero-border rounded-full mx-auto mb-4" />

          <div className="flex justify-between items-center mb-4">
            <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white">
              Add Subscription
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              aria-label="Close"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div>
              <label className={labelCls}>Name</label>
              <input
                type="text"
                placeholder="e.g. Netflix, Spotify"
                value={form.name}
                onChange={(e) => setField('name', e.target.value)}
                className={inputCls}
                required
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Amount</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={form.amount}
                  onChange={(e) => setField('amount', e.target.value)}
                  className={inputCls}
                  required
                />
              </div>
              <div>
                <label className={labelCls}>Next due date</label>
                <input
                  type="date"
                  value={form.next_due_date}
                  onChange={(e) => setField('next_due_date', e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>

            <div>
              <label className={labelCls}>Frequency</label>
              <div className="grid grid-cols-4 gap-1.5">
                {FREQUENCIES.map(({ value, label }) => {
                  const active = form.frequency === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setField('frequency', value)}
                      className="py-2 text-xs font-medium rounded-lg border transition-colors"
                      style={active
                        ? { background: '#27AE60', color: '#fff', borderColor: '#27AE60' }
                        : { background: 'transparent', color: '#888', borderColor: '#D1D5DB' }
                      }
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-2.5 mt-1">
              <button
                type="submit"
                disabled={saving || !form.name.trim() || !form.amount}
                className="flex-1 text-white text-sm font-medium py-2.5 rounded-[20px] disabled:opacity-40 transition-colors"
                style={{ background: '#27AE60' }}
              >
                {saving ? 'Saving…' : 'Add Subscription'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 border border-gray-200 dark:border-nero-border text-sm font-medium py-2.5 rounded-[20px] text-gray-700 dark:text-gray-300 transition-colors"
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
