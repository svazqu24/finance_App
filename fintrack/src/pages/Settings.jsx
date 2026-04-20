import { useState } from 'react';
import { useApp } from '../AppContext';
import { sendNotification } from '../NotificationContext';
import { fmtDollars } from '../utils';
import { catSty } from '../data';
import { supabase } from '../supabaseClient';

// ── Toggle switch ──────────────────────────────────────────────────────────────
function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none"
      style={{ background: checked ? '#27AE60' : '#D1D5DB' }}
    >
      <span
        className="inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200"
        style={{ transform: checked ? 'translateX(20px)' : 'translateX(0)' }}
      />
    </button>
  );
}

// ── Section wrapper ────────────────────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <div className="mb-8">
      <p className="text-[11px] uppercase tracking-[.08em] text-gray-400 mb-3">{title}</p>
      <div className="rounded-xl border border-gray-200 dark:border-nero-border overflow-hidden bg-white dark:bg-nero-surface">
        {children}
      </div>
    </div>
  );
}

// ── Row inside a section ───────────────────────────────────────────────────────
function Row({ label, sub, children, last }) {
  return (
    <div className={`flex items-center justify-between px-4 py-3.5 ${!last ? 'border-b border-gray-100 dark:border-nero-border' : ''}`}>
      <div>
        <p className="text-sm font-medium text-gray-900 dark:text-white leading-tight">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
      {children}
    </div>
  );
}

// ── Mini layout preview ────────────────────────────────────────────────────────
function LayoutPreview({ type }) {
  const bar = (w, h = 6) => (
    <div className="rounded-sm bg-gray-300 dark:bg-gray-600" style={{ width: `${w}%`, height: h }} />
  );

  if (type === 'single') {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {bar(100)} {bar(90)} {bar(95)} {bar(85)}
      </div>
    );
  }
  if (type === 'two-column') {
    return (
      <div className="grid grid-cols-2 gap-1.5 w-full">
        {bar(100)} {bar(100)}
        {bar(80)}  {bar(90)}
        {bar(100)} {bar(75)}
      </div>
    );
  }
  if (type === 'date-grouped') {
    return (
      <div className="flex flex-col gap-1 w-full">
        <div className="rounded-sm bg-nero-green/40" style={{ width: '45%', height: 5 }} />
        {bar(95)} {bar(85)}
        <div className="rounded-sm bg-nero-green/40 mt-1" style={{ width: '40%', height: 5 }} />
        {bar(90)}
      </div>
    );
  }
  return null;
}

// ── Mini nav preview ───────────────────────────────────────────────────────────
function NavPreview({ type }) {
  const dot = (active) => (
    <div className={`rounded-sm ${active ? 'bg-nero-green' : 'bg-gray-300 dark:bg-gray-600'}`}
         style={{ width: 14, height: 5 }} />
  );
  const vdot = (active) => (
    <div className={`rounded-sm ${active ? 'bg-nero-green' : 'bg-gray-300 dark:bg-gray-600'}`}
         style={{ width: 5, height: 14 }} />
  );

  if (type === 'top') return (
    <div className="flex flex-col gap-1.5 w-full">
      <div className="flex gap-1 pb-1 border-b border-gray-200 dark:border-gray-600">
        {dot(true)}{dot(false)}{dot(false)}{dot(false)}
      </div>
      <div className="flex flex-col gap-1 mt-0.5">
        <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded w-full" />
        <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded w-4/5" />
        <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded w-full" />
      </div>
    </div>
  );

  if (type === 'bottom') return (
    <div className="flex flex-col gap-1.5 w-full">
      <div className="flex flex-col gap-1 mb-0.5">
        <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded w-full" />
        <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded w-4/5" />
        <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded w-full" />
      </div>
      <div className="flex gap-1 pt-1 border-t border-gray-200 dark:border-gray-600 justify-center">
        {dot(false)}{dot(true)}{dot(false)}{dot(false)}{dot(false)}
      </div>
    </div>
  );

  if (type === 'left') return (
    <div className="flex gap-1.5 w-full">
      <div className="flex flex-col gap-1 pr-1 border-r border-gray-200 dark:border-gray-600">
        {vdot(true)}{vdot(false)}{vdot(false)}{vdot(false)}{vdot(false)}
      </div>
      <div className="flex flex-col gap-1 flex-1">
        <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded w-full" />
        <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded w-4/5" />
        <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded w-full" />
      </div>
    </div>
  );

  if (type === 'right') return (
    <div className="flex gap-1.5 w-full">
      <div className="flex flex-col gap-1 flex-1">
        <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded w-full" />
        <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded w-4/5" />
        <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded w-full" />
      </div>
      <div className="flex flex-col gap-1 pl-1 border-l border-gray-200 dark:border-gray-600">
        {vdot(false)}{vdot(true)}{vdot(false)}{vdot(false)}{vdot(false)}
      </div>
    </div>
  );

  return null;
}

// ── Picker card ────────────────────────────────────────────────────────────────
function PickerCard({ label, active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all text-center"
      style={active
        ? { borderColor: '#27AE60', background: 'rgba(39,174,96,0.06)' }
        : { borderColor: 'transparent', background: 'transparent' }
      }
    >
      <div className="w-full rounded-lg p-2 bg-gray-50 dark:bg-nero-bg" style={{ minHeight: 52 }}>
        {children}
      </div>
      <span className="text-[11px] font-medium text-gray-700 dark:text-gray-300">{label}</span>
      {active && (
        <span
          className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center"
          style={{ background: '#27AE60' }}
        >
          <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
            <polyline points="2 6 5 9 10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      )}
    </button>
  );
}

// ── Budget style preview ───────────────────────────────────────────────────────
function BudgetStylePreview({ type }) {
  if (type === 'bars') {
    return (
      <div className="flex flex-col gap-1.5 w-full py-0.5">
        {[70, 90, 45].map((pct, i) => (
          <div key={i} className="flex flex-col gap-0.5">
            <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-nero-green" style={{ width: `${pct}%` }} />
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (type === 'circles') {
    const rings = [
      { pct: 60, clr: '#34d399' },
      { pct: 88, clr: '#fbbf24' },
      { pct: 110, clr: '#f87171' },
    ];
    const R = 12, SW = 3, C = R + SW;
    const circumference = 2 * Math.PI * R;
    return (
      <div className="flex gap-2 justify-center items-center py-0.5">
        {rings.map(({ pct, clr }, i) => {
          const filled = Math.min(pct / 100, 1);
          return (
            <svg key={i} width={C * 2} height={C * 2} viewBox={`0 0 ${C * 2} ${C * 2}`}>
              <circle cx={C} cy={C} r={R} fill="none" stroke="#374151" strokeWidth={SW} />
              <circle
                cx={C} cy={C} r={R} fill="none"
                stroke={clr} strokeWidth={SW}
                strokeDasharray={`${circumference * filled} ${circumference}`}
                strokeLinecap="round"
                transform={`rotate(-90 ${C} ${C})`}
              />
            </svg>
          );
        })}
      </div>
    );
  }
  return null;
}

// ── Category color picker ──────────────────────────────────────────────────────
function CategoryColorItem({ cat, bgColor, fgColor, onBgChange, onFgChange, onReset }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100 dark:border-nero-border last:border-b-0">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-900 dark:text-white">{cat}</p>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex gap-1">
          <input
            type="color"
            value={bgColor}
            onChange={(e) => onBgChange(e.target.value)}
            className="w-8 h-8 rounded cursor-pointer border border-gray-200 dark:border-nero-border"
            title="Background color"
          />
          <input
            type="color"
            value={fgColor}
            onChange={(e) => onFgChange(e.target.value)}
            className="w-8 h-8 rounded cursor-pointer border border-gray-200 dark:border-nero-border"
            title="Foreground color"
          />
        </div>
        <button
          onClick={onReset}
          className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 px-2 py-1.5 rounded transition-colors"
        >
          Reset
        </button>
      </div>
    </div>
  );
}

// ── Export helper ──────────────────────────────────────────────────────────────
function exportCSV(transactions, sendNotification) {
  const header = 'Date,Merchant,Category,Amount,Account';
  const rows = transactions.map((t) =>
    `"${t.date}","${t.name.replace(/"/g, '""')}","${t.cat}","${t.amt.toFixed(2)}","${t.account || ''}"`
  );
  const csv = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  a.download = `nero-transactions-${month}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  sendNotification(`${transactions.length} transactions exported`);
}

// ── Main Settings page ─────────────────────────────────────────────────────────
export default function Settings() {
  const {
    preferences, updatePreference,
    transactions, resetPassword, deleteAccount, user,
  } = useApp();

  // Change password state
  const [pwdBusy,    setPwdBusy]    = useState(false);
  const [pwdNotice,  setPwdNotice]  = useState('');
  const [pwdError,   setPwdError]   = useState('');

  // Delete account state
  const [deleteStep,  setDeleteStep]  = useState(0); // 0=idle 1=confirm
  const [deleteBusy,  setDeleteBusy]  = useState(false);

  // Data management state
  const [resetTxnModal, setResetTxnModal] = useState(false);
  const [resetAllModal, setResetAllModal] = useState(false);
  const [resetAllConfirm, setResetAllConfirm] = useState('');
  const [resetBusy, setResetBusy] = useState(false);

  function handleUpdateCategoryColor(cat, field, value) {
    const updated = { ...preferences.categoryColors };
    if (!updated[cat]) updated[cat] = { ...catSty[cat] };
    updated[cat][field] = value;
    updatePreference('categoryColors', updated);
  }

  function handleResetCategoryColor(cat) {
    const updated = { ...preferences.categoryColors };
    delete updated[cat];
    updatePreference('categoryColors', updated);
  }

  async function handleSendResetEmail() {
    if (!user?.email) return;
    setPwdError('');
    setPwdNotice('');
    setPwdBusy(true);
    try {
      await resetPassword(user.email);
      setPwdNotice('Reset link sent — check your inbox.');
    } catch (err) {
      setPwdError(err.message);
    } finally {
      setPwdBusy(false);
    }
  }

  async function handleDeleteAccount() {
    if (deleteStep === 0) { setDeleteStep(1); return; }
    setDeleteBusy(true);
    try {
      await deleteAccount();
    } finally {
      setDeleteBusy(false);
    }
  }

  async function handleResetTransactions() {
    if (!user) return;
    setResetBusy(true);
    try {
      const { error } = await supabase.from('transactions').delete().eq('user_id', user.id);
      if (error) throw error;
      sendNotification(`${transactions.length} transactions deleted`);
      // Reload transactions
      window.location.reload(); // Simple way to reload data
    } catch (err) {
      console.error('Reset transactions failed:', err);
    } finally {
      setResetBusy(false);
      setResetTxnModal(false);
    }
  }

  async function handleResetAllData() {
    if (!user || resetAllConfirm !== 'DELETE') return;
    setResetBusy(true);
    try {
      await Promise.all([
        supabase.from('transactions').delete().eq('user_id', user.id),
        supabase.from('goal_contributions').delete().eq('user_id', user.id),
        supabase.from('goals').delete().eq('user_id', user.id),
        supabase.from('bills').delete().eq('user_id', user.id),
        supabase.from('budgets').delete().eq('user_id', user.id),
        supabase.from('user_preferences').delete().eq('user_id', user.id),
        supabase.from('credit_cards').delete().eq('user_id', user.id),
        supabase.from('net_worth_entries').delete().eq('user_id', user.id),
        supabase.from('watchlist').delete().eq('user_id', user.id),
        supabase.from('holdings').delete().eq('user_id', user.id),
      ]);
      sendNotification('All data deleted');
      // Sign out
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Reset all data failed:', err);
    } finally {
      setResetBusy(false);
      setResetAllModal(false);
    }
  }

  const { layoutStyle, navPosition, budgetStyle } = preferences;

  return (
    <>
      {/* ── Appearance ── */}
      <Section title="Appearance">
        <Row label="Dark mode" sub="Use dark theme across the app">
          <Toggle
            checked={preferences.darkMode}
            onChange={(val) => updatePreference('darkMode', val)}
          />
        </Row>
        <Row label="Compact view" sub="Reduce padding for a denser layout" last>
          <Toggle
            checked={preferences.compactView}
            onChange={(val) => updatePreference('compactView', val)}
          />
        </Row>
      </Section>

      {/* ── Layout style ── */}
      <Section title="Layout style">
        <div className="p-4 grid grid-cols-3 gap-3">
          {[
            { key: 'single',       label: 'Single column' },
            { key: 'two-column',   label: 'Two column'    },
            { key: 'date-grouped', label: 'Date grouped'  },
          ].map(({ key, label }) => (
            <PickerCard
              key={key}
              label={label}
              active={layoutStyle === key}
              onClick={() => updatePreference('layoutStyle', key)}
            >
              <LayoutPreview type={key} />
            </PickerCard>
          ))}
        </div>
      </Section>

      {/* ── Navigation position ── */}
      <Section title="Navigation position">
        <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { key: 'top',    label: 'Top tabs'     },
            { key: 'bottom', label: 'Bottom bar'   },
            { key: 'left',   label: 'Left sidebar' },
            { key: 'right',  label: 'Right sidebar'},
          ].map(({ key, label }) => (
            <PickerCard
              key={key}
              label={label}
              active={navPosition === key}
              onClick={() => updatePreference('navPosition', key)}
            >
              <NavPreview type={key} />
            </PickerCard>
          ))}
        </div>
      </Section>

      {/* ── Budget display style ── */}
      <Section title="Budget display style">
        <div className="p-4 grid grid-cols-2 gap-3">
          {[
            { key: 'bars',    label: 'Bars'    },
            { key: 'circles', label: 'Circles' },
          ].map(({ key, label }) => (
            <PickerCard
              key={key}
              label={label}
              active={budgetStyle === key}
              onClick={() => updatePreference('budgetStyle', key)}
            >
              <BudgetStylePreview type={key} />
            </PickerCard>
          ))}
        </div>
      </Section>

      {/* ── Category colors ── */}
      <Section title="Category colors">
        <div className="rounded-xl border border-gray-200 dark:border-nero-border overflow-hidden bg-white dark:bg-nero-surface">
          {Object.keys(catSty).map((cat) => {
            const custom = preferences.categoryColors?.[cat];
            const colors = custom || catSty[cat];
            return (
              <CategoryColorItem
                key={cat}
                cat={cat}
                bgColor={colors.bg}
                fgColor={colors.fg}
                onBgChange={(val) => handleUpdateCategoryColor(cat, 'bg', val)}
                onFgChange={(val) => handleUpdateCategoryColor(cat, 'fg', val)}
                onReset={() => handleResetCategoryColor(cat)}
              />
            );
          })}
        </div>
      </Section>

      {/* ── Account ── */}
      <Section title="Account">
        <Row label="Currency" sub="Used for display formatting">
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {preferences.currency}
          </span>
        </Row>

        <Row label="Change password" sub={pwdNotice || pwdError || user?.email}>
          <button
            onClick={handleSendResetEmail}
            disabled={pwdBusy}
            className="text-xs font-medium px-3 py-1.5 rounded-[20px] border border-gray-200 dark:border-nero-border text-gray-700 dark:text-gray-300 disabled:opacity-50 transition-colors"
          >
            {pwdBusy ? '…' : 'Send reset link'}
          </button>
        </Row>

        <Row label="Export my data" sub={`${transactions.length} transactions`}>
          <button
            onClick={() => exportCSV(transactions, sendNotification)}
            disabled={transactions.length === 0}
            className="text-xs font-medium px-3 py-1.5 rounded-[20px] border border-gray-200 dark:border-nero-border text-gray-700 dark:text-gray-300 disabled:opacity-40 transition-colors"
          >
            Download CSV
          </button>
        </Row>

        <Row label="Delete account" sub="Deletes all your data permanently" last>
          {deleteStep === 0 ? (
            <button
              onClick={() => setDeleteStep(1)}
              className="text-xs font-medium px-3 py-1.5 rounded-[20px] border transition-colors"
              style={{ borderColor: '#f87171', color: '#f87171' }}
            >
              Delete
            </button>
          ) : (
            <div className="flex gap-2 items-center">
              <span className="text-xs text-gray-400">Are you sure?</span>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteBusy}
                className="text-xs font-medium px-3 py-1.5 rounded-[20px] text-white disabled:opacity-50 transition-colors"
                style={{ background: '#f87171' }}
              >
                {deleteBusy ? '…' : 'Confirm'}
              </button>
              <button
                onClick={() => setDeleteStep(0)}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </Row>
      </Section>

      {/* ── Data management ── */}
      <Section title="Data management">
        <Row label="Export transactions" sub="Download all transactions as CSV">
          <button
            onClick={() => exportCSV(transactions, sendNotification)}
            disabled={transactions.length === 0}
            className="text-xs font-medium px-3 py-1.5 rounded-[20px] text-white transition-colors"
            style={{ background: '#27AE60' }}
          >
            Export
          </button>
        </Row>
        <Row label="Reset transactions" sub="Delete all transactions permanently">
          <button
            onClick={() => setResetTxnModal(true)}
            className="text-xs font-medium px-3 py-1.5 rounded-[20px] text-white transition-colors"
            style={{ background: '#f87171' }}
          >
            Reset
          </button>
        </Row>
        <Row label="Reset all data" sub="Delete everything permanently" last>
          <button
            onClick={() => setResetAllModal(true)}
            className="text-xs font-medium px-3 py-1.5 rounded-[20px] text-white transition-colors"
            style={{ background: '#dc2626' }}
          >
            Reset all
          </button>
        </Row>
      </Section>

      {/* Confirmation modals */}
      {resetTxnModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-[#1f1f1f] rounded-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-white mb-2">Delete all transactions?</h3>
            <p className="text-sm text-gray-400 mb-6">This cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setResetTxnModal(false)}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleResetTransactions}
                disabled={resetBusy}
                className="px-4 py-2 text-sm text-white rounded-lg transition-colors"
                style={{ background: '#f87171' }}
              >
                {resetBusy ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {resetAllModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-[#1f1f1f] rounded-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-white mb-2">Permanently delete everything</h3>
            <p className="text-sm text-gray-400 mb-4">Type "DELETE" to confirm:</p>
            <input
              type="text"
              value={resetAllConfirm}
              onChange={(e) => setResetAllConfirm(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white mb-6"
              placeholder="DELETE"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setResetAllModal(false); setResetAllConfirm(''); }}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleResetAllData}
                disabled={resetBusy || resetAllConfirm !== 'DELETE'}
                className="px-4 py-2 text-sm text-white rounded-lg transition-colors"
                style={{ background: '#dc2626' }}
              >
                {resetBusy ? 'Deleting...' : 'Delete everything'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
