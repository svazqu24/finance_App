import { useState, useEffect } from 'react';
import { useApp } from '../AppContext';

const inputCls =
  'w-full border border-gray-200 dark:border-nero-border rounded-lg px-3 py-3 text-sm ' +
  'bg-white dark:bg-nero-bg text-gray-900 dark:text-white placeholder:text-gray-400 ' +
  'outline-none focus:border-gray-400 dark:focus:border-nero-green transition-colors';

const labelCls = 'text-[11px] uppercase tracking-[.08em] text-gray-400 block mb-1';

const BLANK = {
  name: '',
  last_four: '',
  credit_limit: '',
  current_balance: '',
  statement_balance: '',
  minimum_payment: '',
  due_day: ''
};

export default function CreditCardModal({ open, onClose }) {
  const { addCreditCard, updateCreditCard, deleteCreditCard, editCreditCard } = useApp();
  const [form, setForm] = useState(BLANK);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isEditing = !!editCreditCard;

  useEffect(() => {
    if (!open) { setConfirmDelete(false); return; }
    if (editCreditCard) {
      setForm({
        name: editCreditCard.name,
        last_four: editCreditCard.last_four || '',
        credit_limit: String(editCreditCard.credit_limit || ''),
        current_balance: String(editCreditCard.current_balance || ''),
        statement_balance: String(editCreditCard.statement_balance || ''),
        minimum_payment: String(editCreditCard.minimum_payment || ''),
        due_day: String(editCreditCard.due_day),
      });
    } else {
      setForm(BLANK);
    }
    setConfirmDelete(false);
  }, [open, editCreditCard]);

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

  function setField(key, val) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const credit_limit = form.credit_limit ? parseFloat(form.credit_limit) : null;
    const current_balance = parseFloat(form.current_balance) || 0;
    const statement_balance = parseFloat(form.statement_balance) || 0;
    const minimum_payment = parseFloat(form.minimum_payment) || 0;
    const due_day = parseInt(form.due_day, 10);

    if (!form.name.trim()) return;
    if (isNaN(due_day) || due_day < 1 || due_day > 31) return;
    if (credit_limit !== null && (isNaN(credit_limit) || credit_limit <= 0)) return;

    const payload = {
      name: form.name.trim(),
      last_four: form.last_four.trim() || null,
      credit_limit,
      current_balance,
      statement_balance,
      minimum_payment,
      due_day,
      paid_month: null, // Reset when editing
    };

    if (isEditing) {
      updateCreditCard(editCreditCard.id, payload);
    } else {
      addCreditCard(payload);
    }
    onClose();
  }

  function handleDelete() {
    if (!editCreditCard) return;
    deleteCreditCard(editCreditCard.id);
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-md bg-white dark:bg-nero-surface rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-nero-border">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {isEditing ? 'Edit credit card' : 'Add credit card'}
          </h2>
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

        <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-3">
          <div>
            <label className={labelCls}>Card name</label>
            <input
              type="text"
              placeholder="e.g. Chase Sapphire"
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              className={inputCls}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Last 4 digits</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="1234"
                maxLength="4"
                value={form.last_four}
                onChange={(e) => setField('last_four', e.target.value.replace(/\D/g, ''))}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Due day (1–31)</label>
              <input
                type="number"
                inputMode="numeric"
                min="1"
                max="31"
                placeholder="15"
                value={form.due_day}
                onChange={(e) => setField('due_day', e.target.value)}
                className={inputCls}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Credit limit</label>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                placeholder="5000.00"
                value={form.credit_limit}
                onChange={(e) => setField('credit_limit', e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Current balance</label>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={form.current_balance}
                onChange={(e) => setField('current_balance', e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Statement balance</label>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={form.statement_balance}
                onChange={(e) => setField('statement_balance', e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Minimum payment</label>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={form.minimum_payment}
                onChange={(e) => setField('minimum_payment', e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              className="flex-1 text-sm font-medium py-3 rounded-[20px] text-white transition-colors"
              style={{ background: '#27AE60' }}
            >
              {isEditing ? 'Update card' : 'Add card'}
            </button>
            {isEditing && (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="px-4 py-3 text-sm font-medium rounded-[20px] border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 transition-colors"
              >
                Delete
              </button>
            )}
          </div>
        </form>

        {/* Delete confirmation */}
        {confirmDelete && (
          <div className="p-4 border-t border-gray-200 dark:border-nero-border">
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
              Are you sure you want to delete this credit card? This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                className="flex-1 text-sm font-medium py-2 rounded-[20px] bg-red-500 text-white transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 text-sm font-medium py-2 rounded-[20px] border border-gray-300 dark:border-nero-border text-gray-600 dark:text-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}