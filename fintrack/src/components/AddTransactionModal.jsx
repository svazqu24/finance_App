import { useState } from 'react';
import { useApp } from '../AppContext';

const CATS = [
  'Income', 'Housing', 'Groceries', 'Dining', 'Subscriptions',
  'Travel', 'Transport', 'Health', 'Shopping', 'Utilities', 'Insurance',
];

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function fmtDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const inputCls =
  'w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm ' +
  'bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 ' +
  'outline-none focus:border-gray-400 dark:focus:border-gray-400 transition-colors';

const labelCls = 'text-[11px] uppercase tracking-[.08em] text-gray-400 block mb-1';

export default function AddTransactionModal({ open, onClose }) {
  const { addTransaction } = useApp();
  const [form, setForm] = useState({ name: '', amt: '', cat: 'Income', date: todayISO() });

  function set(key, val) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim() || form.amt === '') return;
    addTransaction({
      name: form.name.trim(),
      cat: form.cat,
      amt: parseFloat(form.amt),
      date: fmtDate(form.date),
    });
    setForm({ name: '', amt: '', cat: 'Income', date: todayISO() });
    onClose();
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Slide-up drawer */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ease-out ${open ? 'translate-y-0' : 'translate-y-full'}`}
      >
        <div className="bg-white dark:bg-gray-800 rounded-t-2xl max-w-[680px] mx-auto px-5 pt-4 pb-8 shadow-2xl">
          {/* Handle */}
          <div className="w-10 h-1 bg-gray-200 dark:bg-gray-600 rounded-full mx-auto mb-4" />

          <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white mb-4">
            Add Transaction
          </h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div>
              <label className={labelCls}>Description</label>
              <input
                type="text"
                placeholder="e.g. Coffee shop"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                className={inputCls}
                required
              />
            </div>

            <div>
              <label className={labelCls}>Amount</label>
              <input
                type="number"
                step="0.01"
                placeholder="positive = income, negative = expense"
                value={form.amt}
                onChange={(e) => set('amt', e.target.value)}
                className={inputCls}
                required
              />
            </div>

            <div>
              <label className={labelCls}>Category</label>
              <select
                value={form.cat}
                onChange={(e) => set('cat', e.target.value)}
                className={inputCls}
              >
                {CATS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelCls}>Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => set('date', e.target.value)}
                className={inputCls}
              />
            </div>

            <div className="flex gap-2.5 mt-1">
              <button
                type="submit"
                className="flex-1 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium py-2.5 rounded-lg transition-colors"
              >
                Add Transaction
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 border border-gray-200 dark:border-gray-600 text-sm font-medium py-2.5 rounded-lg text-gray-700 dark:text-gray-300 transition-colors"
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
