import { useState, useEffect } from 'react';
import { useApp } from '../AppContext';

const EXPENSE_CATS = [
  'Housing', 'Groceries', 'Dining', 'Subscriptions',
  'Travel', 'Transport', 'Health', 'Shopping', 'Utilities', 'Insurance', 'Transfer',
];

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function fmtDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** Convert a stored date string like 'Apr 1' back to an ISO date input value */
function txnDateToISO(dateStr) {
  if (!dateStr) return todayISO();
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const parts = dateStr.trim().split(' ');
  if (parts.length < 2) return todayISO();
  const mIdx = MONTHS.indexOf(parts[0]);
  if (mIdx === -1) return todayISO();
  const day = parseInt(parts[1], 10);
  const year = new Date().getFullYear();
  return `${year}-${String(mIdx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

const inputCls =
  'w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm ' +
  'bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 ' +
  'outline-none focus:border-gray-400 dark:focus:border-gray-400 transition-colors';

const labelCls = 'text-[11px] uppercase tracking-[.08em] text-gray-400 block mb-1';

const BLANK = { name: '', amt: '', cat: 'Housing', date: todayISO(), type: 'expense' };

export default function AddTransactionModal({ open, onClose }) {
  const { addTransaction, updateTransaction, editTxn } = useApp();
  const [form, setForm] = useState(BLANK);

  const isEditing = !!editTxn;

  // Re-initialize form whenever modal opens or editTxn changes
  useEffect(() => {
    if (!open) return;
    if (editTxn) {
      const isIncome = editTxn.amt > 0;
      setForm({
        name: editTxn.name,
        amt:  String(Math.abs(editTxn.amt)),
        cat:  editTxn.cat,
        date: txnDateToISO(editTxn.date),
        type: isIncome ? 'income' : 'expense',
      });
    } else {
      setForm({ ...BLANK, date: todayISO() });
    }
  }, [open, editTxn]);

  function setField(key, val) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  function setType(t) {
    setForm((f) => ({
      ...f,
      type: t,
      cat: t === 'income' ? 'Income' : (f.cat === 'Income' ? 'Housing' : f.cat),
    }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const raw = parseFloat(form.amt);
    if (!form.name.trim() || isNaN(raw) || raw <= 0) return;
    const payload = {
      name: form.name.trim(),
      cat:  form.cat,
      amt:  form.type === 'expense' ? -raw : raw,
      date: fmtDate(form.date),
    };
    if (isEditing) {
      updateTransaction(editTxn.id, payload);
    } else {
      addTransaction(payload);
    }
    onClose();
  }

  const isExpense = form.type === 'expense';
  const previewAmt = parseFloat(form.amt) || 0;

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

          {/* Header row: title + amount preview */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white">
              {isEditing ? 'Edit Transaction' : 'Add Transaction'}
            </h2>
            {previewAmt > 0 && (
              <span
                className="text-[15px] font-semibold tabular-nums"
                style={{ color: isExpense ? '#E24B4A' : '#3B6D11' }}
              >
                {isExpense ? '-' : '+'}${previewAmt.toFixed(2)}
              </span>
            )}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">

            {/* Expense / Income toggle */}
            <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
              <button
                type="button"
                onClick={() => setType('expense')}
                className="flex-1 py-2 text-sm font-medium transition-colors"
                style={isExpense
                  ? { background: '#E24B4A', color: '#fff' }
                  : { background: 'transparent', color: '#888' }
                }
              >
                Expense
              </button>
              <button
                type="button"
                onClick={() => setType('income')}
                className="flex-1 py-2 text-sm font-medium transition-colors border-l border-gray-200 dark:border-gray-600"
                style={!isExpense
                  ? { background: '#3B6D11', color: '#fff' }
                  : { background: 'transparent', color: '#888' }
                }
              >
                Income
              </button>
            </div>

            <div>
              <label className={labelCls}>Description</label>
              <input
                type="text"
                placeholder="e.g. Coffee shop"
                value={form.name}
                onChange={(e) => setField('name', e.target.value)}
                className={inputCls}
                required
              />
            </div>

            <div>
              <label className={labelCls}>Amount</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={form.amt}
                onChange={(e) => setField('amt', e.target.value)}
                className={inputCls}
                required
              />
            </div>

            <div>
              <label className={labelCls}>Category</label>
              <select
                value={form.cat}
                onChange={(e) => setField('cat', e.target.value)}
                className={inputCls}
              >
                {(isExpense ? EXPENSE_CATS : ['Income']).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelCls}>Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setField('date', e.target.value)}
                className={inputCls}
              />
            </div>

            <div className="flex gap-2.5 mt-1">
              <button
                type="submit"
                className="flex-1 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
                style={{ background: isExpense ? '#E24B4A' : '#3B6D11' }}
              >
                {isEditing ? 'Save Changes' : `Add ${isExpense ? 'Expense' : 'Income'}`}
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
