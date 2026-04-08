import { catSty } from '../data';

export default function TransactionRow({ txn }) {
  const s = catSty[txn.cat] || { bg: '#DDDBD3', fg: '#444441' };
  const pos = txn.amt > 0;

  return (
    <div className="flex items-center gap-2.5 py-2.5 border-b border-gray-200 dark:border-gray-700 transition-colors">
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: s.bg }}
      >
        <span className="text-[11px] font-medium" style={{ color: s.fg }}>
          {txn.cat.slice(0, 2).toUpperCase()}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="m-0 text-sm font-medium truncate text-gray-900 dark:text-white">{txn.name}</p>
        <p className="m-0 text-xs text-gray-400">{txn.cat} · {txn.date}</p>
      </div>
      <span
        className="text-sm font-medium tabular-nums flex-shrink-0"
        style={{ color: pos ? '#3B6D11' : '#E24B4A' }}
      >
        {pos ? '+' : '-'}${Math.abs(txn.amt).toFixed(2)}
      </span>
    </div>
  );
}
