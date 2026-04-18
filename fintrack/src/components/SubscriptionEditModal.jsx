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

export default function SubscriptionEditModal({ open, onClose, subscription, isAutoDetected, onSave }) {
  const { updateBill, dismissSubscription, undismissSubscription, deleteBill } = useApp();
  const [form, setForm]       = useState({});
  const [saving, setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!open || !subscription) return;

    if (isAutoDetected) {
      // Auto-detected: in-memory only, no DB fields
      setForm({
        name:     subscription.name,
        amount:   subscription.amt.toString(),
        frequency: subscription.frequency,
      });
    } else {
      // Manual: from bills table
      setForm({
        name:           subscription.name,
        amount:         subscription.amount.toString(),
        frequency:      subscription.frequency || 'monthly',
        next_due_date:  subscription.next_due_date || '',
        cat:            subscription.cat || 'Subscriptions',
      });
    }
    setSaving(false);
    setDeleting(false);
  }, [open, subscription, isAutoDetected]);

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

  async function handleSave(e) {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    if (!form.name.trim() || isNaN(amount) || amount <= 0) return;

    setSaving(true);

    if (isAutoDetected) {
      // For auto-detected, call onSave callback with updated data
      if (onSave) {
        onSave({
          name: form.name.trim(),
          amount: form.amount,
          frequency: form.frequency,
        });
      }
    } else {
      // Update existing manual subscription
      await updateBill(subscription.id, {
        name:            form.name.trim(),
        amount,
        frequency:       form.frequency,
        next_due_date:   form.next_due_date || null,
        cat:             form.cat,
        is_subscription: true,
      });
    }

    setSaving(false);
    onClose();
  }

  async function handleDelete() {
    if (isAutoDetected) {
      // Dismiss auto-detected subscription
      await dismissSubscription(subscription.name);
    } else {
      // Delete manual subscription
      setDeleting(true);
      await deleteBill(subscription.id);
      setDeleting(false);
    }
    onClose();
  }

  if (!subscription) return null;

  const isMobile = window.innerWidth < 768;

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/60 transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      <div
        className={`fixed z-50 transition-transform duration-300 ease-out ${
          isMobile
            ? 'bottom-0 left-0 right-0 translate-y-0'
            : 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
        }`}
      >
        <div
          className={`${
            isMobile
              ? 'bg-white dark:bg-[#1f1f1f] rounded-t-2xl max-w-none mx-auto px-5 pt-4 shadow-2xl border-t border-transparent dark:border-[#2a2a2a] max-h-[90vh] overflow-y-auto'
              : 'bg-[#1f1f1f] rounded-2xl max-w-[680px] mx-auto p-6 shadow-2xl border border-[#2a2a2a] max-h-[90vh] overflow-y-auto'
          }`}
          style={{
            paddingBottom: isMobile ? 'calc(2rem + env(safe-area-inset-bottom, 0px))' : undefined,
          }}
        >
          {isMobile && (
            <div className="w-10 h-1 bg-gray-200 dark:bg-nero-border rounded-full mx-auto mb-4" />
          )}

          <div className="flex justify-between items-center mb-4">
            <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white">
              {isAutoDetected ? 'Edit Auto-Detected Subscription' : 'Edit Subscription'}
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

          <form onSubmit={handleSave} className="flex flex-col gap-3">
            <div>
              <label className={labelCls}>Name</label>
              <input
                type="text"
                placeholder="e.g. Netflix, Spotify"
                value={form.name || ''}
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
                  value={form.amount || ''}
                  onChange={(e) => setField('amount', e.target.value)}
                  className={inputCls}
                  required
                />
              </div>
              {!isAutoDetected && (
                <div>
                  <label className={labelCls}>Next due date</label>
                  <input
                    type="date"
                    value={form.next_due_date || ''}
                    onChange={(e) => setField('next_due_date', e.target.value)}
                    className={inputCls}
                  />
                </div>
              )}
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

            {!isAutoDetected && (
              <div>
                <label className={labelCls}>Category</label>
                <input
                  type="text"
                  placeholder="e.g. Entertainment, Utilities"
                  value={form.cat || ''}
                  onChange={(e) => setField('cat', e.target.value)}
                  className={inputCls}
                />
              </div>
            )}

            <div className="flex gap-2.5 mt-1">
              <button
                type="submit"
                disabled={saving || !form.name?.trim() || !form.amount}
                className="flex-1 text-white text-sm font-medium py-2.5 rounded-[20px] disabled:opacity-40 transition-colors"
                style={{
                  background: '#27AE60',
                  clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 50%, calc(100% - 8px) 100%, 0 100%)',
                }}
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 border border-gray-200 dark:border-nero-border text-sm font-medium py-2.5 rounded-[20px] text-gray-700 dark:text-gray-300 transition-colors"
                style={{ background: '#6b7280' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 text-white text-sm font-medium py-2.5 rounded-[20px] disabled:opacity-40 transition-colors"
                style={{
                  background: '#f87171',
                  clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 50%, calc(100% - 8px) 100%, 0 100%)',
                }}
              >
                {deleting ? 'Deleting…' : isAutoDetected ? 'Dismiss' : 'Delete'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}