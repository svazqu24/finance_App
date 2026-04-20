import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../AppContext';
import { fmtDollars } from '../utils';

const CAT_EMOJI = {
  Dining:        '🍽',
  Groceries:     '🛒',
  Shopping:      '🛍',
  Transport:     '🚗',
  Health:        '💊',
  Subscriptions: '🎵',
  Housing:       '🏠',
  Utilities:     '⚡',
  Insurance:     '🛡',
  Travel:        '✈',
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
  credit:   { label: 'Credit',   badge: 'bg-amber-100 text-amber-700  dark:bg-amber-900/30 dark:text-amber-400' },
  savings:  { label: 'Savings',  badge: 'bg-green-100  text-green-700  dark:bg-green-900/30  dark:text-green-400'  },
  checking: { label: 'Checking', badge: 'bg-blue-100   text-blue-700   dark:bg-blue-900/30   dark:text-blue-400'   },
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
function AccountCard({ account, onClick }) {
  const { name, type, spentThisMonth, txnCount, allTimeTxns, totalSpent } = account;
  const meta = TYPE_META[type];
  const icon = ACCOUNT_ICONS[type];
  const digits = last4(name);
  const maxSpend = spentThisMonth; // bar is always 100% for now (relative to self)

  return (
    <button
      onClick={onClick}
      className="text-left w-full rounded-2xl border border-gray-200 dark:border-nero-border bg-white dark:bg-nero-surface p-4 hover:border-gray-300 dark:hover:border-gray-500 transition-all hover:shadow-sm"
    >
      {/* Header row */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg bg-gray-50 dark:bg-nero-bg">
            {icon}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight truncate max-w-[130px]">
              {name}
            </p>
            {digits && <p className="text-[11px] text-gray-400 mt-0.5">{digits}</p>}
          </div>
        </div>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${meta.badge}`}>
          {meta.label}
        </span>
      </div>

      {/* Stats */}
      <div className="flex justify-between items-end mb-2.5">
        <div>
          <p className="text-[11px] text-gray-400">Spent this month</p>
          <p className="text-base font-bold text-gray-900 dark:text-white">
            {fmtDollars(spentThisMonth)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-gray-400">{txnCount} transactions</p>
        </div>
      </div>

      {/* Mini spend bar */}
      <div className="h-1.5 rounded-full bg-gray-100 dark:bg-nero-bg overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: totalSpent > 0 ? `${Math.min((spentThisMonth / totalSpent) * 100, 100)}%` : '0%',
            background: '#27AE60',
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
      className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-gray-100 dark:border-nero-border last:border-b-0 hover:bg-gray-50 dark:hover:bg-nero-bg transition-colors text-left"
    >
      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg bg-gray-50 dark:bg-nero-bg flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{name}</p>
          {digits && <p className="text-[11px] text-gray-400 flex-shrink-0">{digits}</p>}
        </div>
        <p className="text-xs text-gray-400">{txnCount} transactions</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">{fmtDollars(spentThisMonth)}</p>
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
        className="w-full sm:max-w-md bg-white dark:bg-nero-surface rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100 dark:border-nero-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-gray-50 dark:bg-nero-bg">
              {ACCOUNT_ICONS[type]}
            </div>
            <div>
              <p className="text-[15px] font-semibold text-gray-900 dark:text-white">{name}</p>
              {digits && <p className="text-xs text-gray-400">{digits}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${meta.badge}`}>
              {meta.label}
            </span>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                   strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-0 border-b border-gray-100 dark:border-nero-border">
          {[
            { label: 'Spent', value: fmtDollars(spentThisMonth) },
            { label: 'Income', value: fmtDollars(incomeThisMonth) },
            { label: 'Top cat', value: topCat ? `${CAT_EMOJI[topCat] || '📦'} ${topCat}` : '—' },
          ].map(({ label, value }, i) => (
            <div key={i} className={`px-4 py-3.5 ${i < 2 ? 'border-r border-gray-100 dark:border-nero-border' : ''}`}>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{value}</p>
            </div>
          ))}
        </div>

        {/* Last 5 transactions */}
        <div className="overflow-y-auto" style={{ maxHeight: 280 }}>
          <p className="text-[11px] uppercase tracking-wide text-gray-400 px-5 pt-4 pb-2">Recent transactions</p>
          {last5.length === 0 ? (
            <p className="text-sm text-gray-400 px-5 pb-4">No transactions</p>
          ) : last5.map((t) => (
            <div key={t.id} className="flex items-center justify-between px-5 py-2.5 border-b border-gray-50 dark:border-nero-border last:border-b-0">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[200px]">{t.name}</p>
                <p className="text-[11px] text-gray-400">{t.date} · {CAT_EMOJI[t.cat] || '📦'} {t.cat}</p>
              </div>
              <p className={`text-sm font-semibold ${t.amt >= 0 ? 'text-green-500' : 'text-gray-900 dark:text-white'}`}>
                {t.amt >= 0 ? '+' : ''}{fmtDollars(Math.abs(t.amt))}
              </p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 dark:border-nero-border">
          <button
            onClick={() => { onClose(); navigate('/transactions'); }}
            className="w-full text-sm font-medium py-2.5 rounded-xl border border-gray-200 dark:border-nero-border text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-nero-bg transition-colors"
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
    <div>
      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        {[
          { label: 'Accounts',     value: activeAccounts },
          { label: 'Spent (mo)',   value: fmtDollars(totalSpent) },
          { label: 'Income (mo)',  value: fmtDollars(totalIncome) },
        ].map(({ label, value }) => (
          <div key={label}
               className="rounded-2xl border border-gray-200 dark:border-nero-border bg-white dark:bg-nero-surface px-3 py-3 text-center">
            <p className="text-[11px] text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
            <p className="text-base font-bold text-gray-900 dark:text-white">{value}</p>
          </div>
        ))}
      </div>

      {accounts.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">💳</p>
          <p className="text-sm">No accounts found.</p>
          <p className="text-xs mt-1">Import transactions to see your accounts.</p>
        </div>
      ) : accountStyle === 'list' ? (
        <div className="rounded-2xl border border-gray-200 dark:border-nero-border bg-white dark:bg-nero-surface overflow-hidden">
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
  );
}
