import { useState, useEffect } from 'react';
import { useApp } from '../AppContext';

const BILL_CATS = [
  'Housing', 'Utilities', 'Insurance', 'Subscriptions',
  'Transport', 'Health', 'Shopping', 'Dining', 'Other',
];

const inputCls =
  'w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm ' +
  'bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 ' +
  'outline-none focus:border-gray-400 dark:focus:border-gray-400 transition-colors';

const labelCls = 'text-[11px] uppercase tracking-[.08em] text-gray-400 block mb-1';

const BLANK = { name: '', amount: '', due_day: '', cat: 'Utilities' };

export default function BillModal({ open, onClose }) {
  const { addBill, updateBill, deleteBill, editBill } = useApp();
  const [form, setForm] = useState(BLANK);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isEditing = !!editBill;

  useEffect(() => {
    if (!open) { setConfirmDelete(false); return; }
    if (editBill) {
      setForm({
        name:    editBill.name,
        amount:  String(editBill.amount),
        due_day: String(editBill.due_day),
        cat:     editBill.cat,
      });
    } else {
      setForm(BLANK);
    }
    setConfirmDelete(false);
  }, [open, editBill]);

  function setField(key, val) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    const due_day = parseInt(form.due_day, 10);
    if (!form.name.trim() || isNaN(amount) || amount <= 0) return;
    if (isNaN(due_day) || due_day < 1 || due_day > 31) return;
    const payload = { name: form.name.trim(), amount, due_day, cat: form.cat };
    if (isEditing) {
      updateBill(editBill.id, payload);
    } else {
      addBill(payload);
    }
    onClose();
  }

  function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    deleteBill(editBill.id);
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

          <div className="flex justify-between items-center mb-4">
            <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white">
              {isEditing ? 'Edit Bill' : 'Add Bill'}
            </h2>
            {isEditing && (
              <button
                type="button"
                onClick={handleDelete}
                className="text-xs font-medium px-3 py-1.5 rounded-full transition-colors"
                style={confirmDelete
                  ? { background: '#E24B4A', color: '#fff' }
                  : { color: '#E24B4A', border: '1px solid #E24B4A' }
                }
              >
                {confirmDelete ? 'Confirm delete' : 'Delete'}
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div>
              <label className={labelCls}>Bill name</label>
              <input
                type="text"
                placeholder="e.g. Netflix"
                value={form.name}
                onChange={(e) => setField('name', e.target.value)}
                className={inputCls}
                required
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
                <label className={labelCls}>Due day (1–31)</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  placeholder="e.g. 15"
                  value={form.due_day}
                  onChange={(e) => setField('due_day', e.target.value)}
                  className={inputCls}
                  required
                />
              </div>
            </div>

            <div>
              <label className={labelCls}>Category</label>
              <select
                value={form.cat}
                onChange={(e) => setField('cat', e.target.value)}
                className={inputCls}
              >
                {BILL_CATS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="flex gap-2.5 mt-1">
              <button
                type="submit"
                className="flex-1 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
                style={{ background: '#185FA5' }}
              >
                {isEditing ? 'Save Changes' : 'Add Bill'}
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
