import { useState } from 'react';
import { useApp } from '../AppContext';
import { fmtDollars } from '../utils';

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

// ── Export helper ──────────────────────────────────────────────────────────────
function exportCSV(transactions) {
  const header = 'Date,Description,Category,Amount';
  const rows = transactions.map((t) =>
    `"${t.date}","${t.name.replace(/"/g, '""')}","${t.cat}","${t.amt.toFixed(2)}"`
  );
  const csv = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `nero-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
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

  const { layoutStyle, navPosition } = preferences;

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
            onClick={() => exportCSV(transactions)}
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
    </>
  );
}
