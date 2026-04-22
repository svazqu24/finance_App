import { useState, useEffect } from 'react';
import { useApp } from '../AppContext';
import { GOAL_COLORS } from '../data';

const inputCls =
  'w-full border border-gray-200 dark:border-nero-border rounded-lg px-3 py-3 text-sm ' +
  'bg-white dark:bg-nero-bg text-gray-900 dark:text-white placeholder:text-gray-400 ' +
  'outline-none focus:border-gray-400 dark:focus:border-nero-green transition-colors';

const labelCls = 'text-[11px] uppercase tracking-[.08em] text-gray-400 block mb-1';

const BLANK = { name: '', target: '', saved: '', monthly: '', color: GOAL_COLORS[0].clr };

export default function GoalModal({ open, onClose }) {
  const { addGoal, updateGoal, deleteGoal, editGoal, setEditGoal } = useApp();
  const [form, setForm] = useState(BLANK);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isEditing = !!editGoal;

  useEffect(() => {
    if (!open) { setConfirmDelete(false); return; }
    if (editGoal) {
      setForm({
        name:    editGoal.name,
        target:  String(editGoal.target),
        saved:   String(editGoal.saved),
        monthly: String(editGoal.monthly),
        color:   editGoal.clr,
      });
    } else {
      setForm(BLANK);
    }
    setConfirmDelete(false);
  }, [open, editGoal]);

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
    const target  = parseFloat(form.target);
    const saved   = parseFloat(form.saved) || 0;
    const monthly = parseFloat(form.monthly) || 0;
    if (!form.name.trim() || isNaN(target) || target <= 0) return;
    const payload = { name: form.name.trim(), target, saved, monthly, color: form.color };
    if (isEditing) {
      updateGoal(editGoal.id, payload);
    } else {
      addGoal(payload);
    }
    onClose();
  }

  function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    deleteGoal(editGoal.id);
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
          className="bg-white dark:bg-nero-surface rounded-t-2xl max-w-[680px] mx-auto px-5 pt-4 shadow-2xl border-t border-transparent dark:border-nero-border max-h-[90vh] overflow-y-auto"
          style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom, 0px))' }}
        >
          <div className="w-10 h-1 bg-gray-200 dark:bg-nero-border rounded-full mx-auto mb-4" />

          <div className="flex justify-between items-center mb-4">
            <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white">
              {isEditing ? 'Edit Goal' : 'New Goal'}
            </h2>
            <div className="flex items-center gap-2">
              {isEditing && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="text-xs font-medium px-3 py-1.5 rounded-[20px] transition-colors"
                  style={confirmDelete
                    ? { background: '#f87171', color: '#fff' }
                    : { color: '#f87171' }
                  }
                >
                  {confirmDelete ? 'Confirm delete' : 'Delete goal'}
                </button>
              )}
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
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div>
              <label className={labelCls}>Goal name</label>
              <input
                type="text"
                placeholder="e.g. Emergency fund"
                value={form.name}
                onChange={(e) => setField('name', e.target.value)}
                className={inputCls}
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className={labelCls}>Target ($)</label>
                <input
                  type="number" inputMode="decimal" min="1" step="any" placeholder="10000"
                  value={form.target}
                  onChange={(e) => setField('target', e.target.value)}
                  className={inputCls} required
                />
              </div>
              <div>
                <label className={labelCls}>Saved ($)</label>
                <input
                  type="number" inputMode="decimal" min="0" step="any" placeholder="0"
                  value={form.saved}
                  onChange={(e) => setField('saved', e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Monthly ($)</label>
                <input
                  type="number" inputMode="decimal" min="0" step="any" placeholder="200"
                  value={form.monthly}
                  onChange={(e) => setField('monthly', e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>

            <div>
              <label className={labelCls}>Color</label>
              <div className="flex gap-2 flex-wrap">
                {GOAL_COLORS.map((c) => (
                  <button
                    key={c.clr}
                    type="button"
                    onClick={() => setField('color', c.clr)}
                    className="w-9 h-9 rounded-full transition-transform flex items-center justify-center"
                    style={{
                      background: c.clr,
                      outline: form.color === c.clr ? `3px solid ${c.clr}` : 'none',
                      outlineOffset: '2px',
                      transform: form.color === c.clr ? 'scale(1.15)' : 'scale(1)',
                    }}
                    aria-label={c.clr}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-2.5 mt-1">
              <button
                type="submit"
                className="flex-1 text-white text-sm font-medium py-2.5 rounded-[20px] transition-colors"
                style={{ background: form.color }}
              >
                {isEditing ? 'Save Changes' : 'Add Goal'}
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
