import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../AppContext';
import { fmtDollars } from '../utils';

const CAT_EMOJI = {
  Dining:        '🍽️',
  Groceries:     '🛒',
  Shopping:      '🛍️',
  Transport:     '🚗',
  Health:        '💊',
  Subscriptions: '🎵',
  Housing:       '🏠',
  Utilities:     '⚡',
  Insurance:     '🛡️',
  Travel:        '✈️',
  Entertainment: '🎬',
  Income:        '💵',
  Transfer:      '🔄',
  Other:         '📦',
};

const MONTH_ABBRS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const NOW_ABBR = MONTH_ABBRS[new Date().getMonth()];

function getAccountType(accountName, transactions, creditCardsData) {
  const name = (accountName || '').toLowerCase();

  // Check if this account matches a known credit card (by last-four or name substring)
  if (creditCardsData?.length) {
    for (const card of creditCardsData) {
      const last4 = card.last_four || card.lastFour || '';
      const cardName = (card.name || '').toLowerCase();
      if (last4 && name.includes(last4)) return 'credit';
      if (cardName && name.includes(cardName.slice(0, 6))) return 'credit';
    }
  }
  // Credit-card-like keywords
  if (/credit|visa|mastercard|amex|discover|chase|citi|barclays/.test(name)) return 'credit';

  // Savings: mostly income
  const acctTxns = transactions.filter((t) => t.account === accountName);
  const income = acctTxns.filter((t) => t.amt > 0).reduce((s, t) => s + t.amt, 0);
  const expenses = acctTxns.filter((t) => t.amt < 0).reduce((s, t) => s + Math.abs(t.amt), 0);
  if (income > expenses * 1.5 || /saving|savings|hsa|ira|401/.test(name)) return 'savings';

  return 'checking';
}

const TYPE_META = {
  credit:   { label: 'Credit',   badge: 'bg-[#451a03] text-[#fbbf24]' },
  savings:  { label: 'Savings',  badge: 'bg-[#064e3b] text-[#34d399]' },
  checking: { label: 'Checking', badge: 'bg-[#0c1a2e] text-[#60a5fa]' },
};

const ACCOUNT_ICONS = {
  credit:   '💳',
  savings:  '🏦',
  checking: '🏧',
};

function last4(name) {
  const m = name.match(/\d{4}$/);
  return m ? `•••• ${m[0]}` : null;
}

function topCategory(txns) {
  const map = {};
  txns.filter((t) => t.amt < 0 && t.cat !== 'Transfer').forEach((t) => {
    map[t.cat] = (map[t.cat] || 0) + Math.abs(t.amt);
  });
  const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]);
  return sorted[0] ? sorted[0][0] : null;
}

// ── Account Card ──────────────────────────────────────────────────────────────
function AccountCard({ account, onClick, selected }) {
  const { name, type, spentThisMonth, txnCount, allTimeTxns, totalSpent } = account;
  const meta = TYPE_META[type];
  const icon = ACCOUNT_ICONS[type];
  const digits = last4(name);
  const cardStyle = {
    background: selected ? '#0d1f14' : '#111827',
    borderColor: selected ? '#27AE60' : '#1f2937',
  };
  const iconStyle = { background: '#0d1117' };

  return (
    <button
      onClick={onClick}
      className="text-left w-full rounded-2xl border p-4 transition-all hover:shadow-sm"
      style={cardStyle}
    >
      {/* Header row */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={iconStyle}>
            {icon}
          </div>
          <div>
            <p className="text-sm font-semibold text-[#f9fafb] leading-tight truncate max-w-[130px]">
              {name}
            </p>
            {digits && <p className="text-[11px] text-[#6b7280] mt-0.5">{digits}</p>}
          </div>
        </div>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${meta.badge}`}>
          {meta.label}
        </span>
      </div>

      {/* Stats */}
      <div className="flex justify-between items-end mb-2.5">
        <div>
          <p className="text-[11px] text-[#6b7280]">Spent this month</p>
          <p className="text-base font-semibold text-[#f9fafb]" style={{ letterSpacing: '-0.5px' }}>
            {fmtDollars(spentThisMonth)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-[#6b7280]">{txnCount} transactions</p>
        </div>
      </div>

      {/* Mini spend bar */}
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#1f2937' }}>
        <div
          className="h-full rounded-full"
          style={{
            width: totalSpent > 0 ? `${Math.min((spentThisMonth / totalSpent) * 100, 100)}%` : '0%',
            background: '#34d399',
          }}
        />
      </div>
    </button>
  );
}

// ── Account List Row ──────────────────────────────────────────────────────────
function AccountListRow({ account, onClick }) {
  const { name, type, spentThisMonth, txnCount } = account;
  const meta = TYPE_META[type];
  const icon = ACCOUNT_ICONS[type];
  const digits = last4(name);

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3.5 border last:border-b-0 transition-colors text-left"
      style={{ background: '#111827', border: '0.5px solid #1f2937' }}
    >
      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ background: '#0d1117' }}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-[#f9fafb] truncate">{name}</p>
          {digits && <p className="text-[11px] text-[#6b7280] flex-shrink-0">{digits}</p>}
        </div>
        <p className="text-xs text-[#6b7280]">{txnCount} transactions</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-semibold text-[#f9fafb]">{fmtDollars(spentThisMonth)}</p>
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${meta.badge}`}>
          {meta.label}
        </span>
      </div>
    </button>
  );
}

// ── Detail Panel ──────────────────────────────────────────────────────────────
function AccountDetail({ account, onClose }) {
  const navigate = useNavigate();
  const { name, type, spentThisMonth, incomeThisMonth, txnCount, allTimeTxns, monthTxns } = account;
  const meta = TYPE_META[type];
  const digits = last4(name);
  const topCat = topCategory(allTimeTxns);
  const last5 = [...allTimeTxns].sort((a, b) => {
    const ai = MONTH_ABBRS.findIndex((m) => a.date?.startsWith(m));
    const bi = MONTH_ABBRS.findIndex((m) => b.date?.startsWith(m));
    return bi - ai || (b.id > a.id ? 1 : -1);
  }).slice(0, 5);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm"
         onClick={onClose}>
      <div
        className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{ background: '#111827', border: '0.5px solid #1f2937' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b" style={{ borderColor: '#1f2937' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: '#0d1117' }}>
              {ACCOUNT_ICONS[type]}
            </div>
            <div>
              <p className="text-[15px] font-semibold text-[#f9fafb]">{name}</p>
              {digits && <p className="text-xs text-[#6b7280]">{digits}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${meta.badge}`}>
              {meta.label}
            </span>
            <button onClick={onClose} className="text-[#6b7280] hover:text-[#f9fafb] p-1">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                   strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-3">
          {[
            { label: 'Spent', value: fmtDollars(spentThisMonth) },
            { label: 'Income', value: fmtDollars(incomeThisMonth) },
            { label: 'Top cat', value: topCat ? `${CAT_EMOJI[topCat] || '📦'} ${topCat}` : '—' },
          ].map(({ label, value }, i) => (
            <div key={i} className="px-4 py-3.5 rounded-[8px]" style={{ background: '#0d1117' }}>
              <p className="text-[10px] uppercase tracking-[0.1em] text-[#4b5563] mb-0.5">{label}</p>
              <p className="text-sm font-semibold text-[#f9fafb] truncate" style={{ letterSpacing: '-0.5px' }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Last 5 transactions */}
        <div className="overflow-y-auto" style={{ maxHeight: 280 }}>
            <p className="text-[10px] uppercase tracking-[0.1em] text-[#4b5563] px-5 pt-4 pb-2">Recent transactions</p>
            {last5.length === 0 ? (
              <p className="text-sm text-[#6b7280] px-5 pb-4">No transactions</p>
            ) : last5.map((t) => {
              const style = {
                Dining:        { bg: '#1a0a00', color: '#f97316', emoji: '🍽️' },
                Groceries:     { bg: '#001a0a', color: '#34d399', emoji: '🛒' },
                Shopping:      { bg: '#1a001a', color: '#c084fc', emoji: '🛍️' },
                Transport:     { bg: '#001020', color: '#60a5fa', emoji: '🚗' },
                Health:        { bg: '#1a001a', color: '#f472b6', emoji: '💊' },
                Subscriptions: { bg: '#0a001a', color: '#818cf8', emoji: '🎵' },
                Housing:       { bg: '#0a001a', color: '#818cf8', emoji: '🏠' },
                Utilities:     { bg: '#001a10', color: '#2dd4bf', emoji: '⚡' },
                Insurance:     { bg: '#001020', color: '#60a5fa', emoji: '🛡️' },
                Travel:        { bg: '#00101a', color: '#38bdf8', emoji: '✈️' },
                Entertainment: { bg: '#1a0010', color: '#e879f9', emoji: '🎬' },
                Income:        { bg: '#001a0a', color: '#34d399', emoji: '💵' },
                Transfer:      { bg: '#111827', color: '#6b7280', emoji: '🔄' },
                Other:         { bg: '#0f0f0f', color: '#9ca3af', emoji: '📦' },
              }[t.cat] || { bg: '#0f0f0f', color: '#9ca3af', emoji: '📦' };
              return (
                <div key={t.id} className="flex items-center justify-between px-5 py-2.5 border-b last:border-b-0" style={{ borderColor: '#1f2937' }}>
                  <div className="flex items-center gap-3">
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: '8px 2px 8px 2px',
                      background: style.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 14,
                      flexShrink: 0,
                      userSelect: 'none',
                    }}>
                      {style.emoji}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#f9fafb] truncate max-w-[160px]">{t.name}</p>
                      <p className="text-[11px] text-[#6b7280]">{t.date} · {t.cat}</p>
                    </div>
                  </div>
                  <p className={`text-sm font-semibold flex-shrink-0 ${t.amt >= 0 ? 'text-[#34d399]' : 'text-[#f9fafb]'}`}>
                    {t.amt >= 0 ? '+' : ''}{fmtDollars(Math.abs(t.amt))}
                  </p>
                </div>
              );
            })}
        </div>

        {/* Footer */}
        <div className="px-5 py-4" style={{ borderTop: '0.5px solid #1f2937' }}>
          <button
            onClick={() => { onClose(); navigate('/transactions'); }}
            style={{ background: '#1f2937', border: '1px solid #374151' }}
          >
            View all transactions →
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Accounts() {
  const { transactions, creditCardsData, preferences } = useApp();
  const [selectedAccount, setSelectedAccount] = useState(null);
  const { accountStyle } = preferences;

  const accounts = useMemo(() => {
    if (!transactions.length) return [];

    // Group by account label
    const groups = {};
    transactions.forEach((t) => {
      const key = t.account || 'Unknown';
      if (!groups[key]) groups[key] = [];
      groups[key].push(t);
    });

    // Build account objects
    const list = Object.entries(groups).map(([name, txns]) => {
      const type = getAccountType(name, txns, creditCardsData);
      const monthTxns = txns.filter((t) => t.date?.startsWith(NOW_ABBR));
      const spentThisMonth = monthTxns.filter((t) => t.amt < 0 && t.cat !== 'Transfer')
        .reduce((s, t) => s + Math.abs(t.amt), 0);
      const incomeThisMonth = monthTxns.filter((t) => t.amt > 0)
        .reduce((s, t) => s + t.amt, 0);
      return {
        name,
        type,
        spentThisMonth,
        incomeThisMonth,
        txnCount: txns.length,
        allTimeTxns: txns,
        monthTxns,
      };
    });

    // Total spent across all accounts (for relative bar sizing)
    const totalSpent = list.reduce((s, a) => s + a.spentThisMonth, 0);
    return list.map((a) => ({ ...a, totalSpent }))
      .sort((a, b) => b.spentThisMonth - a.spentThisMonth);
  }, [transactions, creditCardsData]);

  const totalSpent     = accounts.reduce((s, a) => s + a.spentThisMonth, 0);
  const totalIncome    = accounts.reduce((s, a) => s + a.incomeThisMonth, 0);
  const activeAccounts = accounts.length;

  const selected = selectedAccount
    ? accounts.find((a) => a.name === selectedAccount)
    : null;

  return (
    <div className="min-h-screen text-[#f9fafb]" style={{ background: '#0a0e1a' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5">
        {/* Summary bar */}
        <div className="grid grid-cols-3 gap-2 mb-6">
        {[
          { label: 'Accounts',     value: activeAccounts },
          { label: 'Spent (mo)',   value: fmtDollars(totalSpent) },
          { label: 'Income (mo)',  value: fmtDollars(totalIncome) },
        ].map(({ label, value }) => (
          <div key={label}
               className="rounded-2xl px-3 py-3 text-center"
               style={{ background: '#0d1f14', border: '0.5px solid #27AE60' }}>
            <p className="text-[10px] uppercase tracking-[0.1em] text-[#4b5563] mb-0.5">{label}</p>
            <p className="text-base font-semibold" style={{ color: '#34d399', letterSpacing: '-0.5px' }}>{value}</p>
          </div>
        ))}
      </div>

      {accounts.length === 0 ? (
        <div className="text-center py-16" style={{ color: '#6b7280' }}>
          <p className="text-4xl mb-3">💳</p>
          <p className="text-sm">No accounts found.</p>
          <p className="text-xs mt-1">Import transactions to see your accounts.</p>
        </div>
      ) : accountStyle === 'list' ? (
        <div className="rounded-2xl overflow-hidden" style={{ background: '#111827', border: '0.5px solid #1f2937' }}>
          {accounts.map((acct) => (
            <AccountListRow
              key={acct.name}
              account={acct}
              onClick={() => setSelectedAccount(acct.name)}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {accounts.map((acct) => (
            <AccountCard
              key={acct.name}
              account={acct}
              selected={selectedAccount === acct.name}
              onClick={() => setSelectedAccount(acct.name)}
            />
          ))}
        </div>
      )}

      {selected && (
        <AccountDetail
          account={selected}
          onClose={() => setSelectedAccount(null)}
        />
      )}
      </div>
    </div>
  );
}
