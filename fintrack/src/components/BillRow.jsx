import { catSty } from '../data';

export default function BillRow({ b }) {
  const s = catSty[b.cat] || { bg: '#DDDBD3', fg: '#444441' };
  const urgent = b.due.includes('Apr') && parseInt(b.due.split(' ')[1]) <= 15;

  return (
    <div className="flex items-center gap-2.5 py-[9px] border-b border-gray-200 dark:border-nero-border transition-colors">
      <div
        className="w-8 h-8 flex items-center justify-center flex-shrink-0"
        style={{ background: s.bg, borderRadius: '10px 3px 10px 3px' }}
      >
        <span className="text-[11px] font-medium" style={{ color: s.fg }}>
          {b.cat.slice(0, 2).toUpperCase()}
        </span>
      </div>
      <div className="flex-1">
        <p className="m-0 text-sm font-medium text-gray-900 dark:text-white">{b.name}</p>
        <p className="m-0 text-xs" style={{ color: urgent ? '#F59E0B' : '#888' }}>
          Due {b.due}{urgent ? ' · soon' : ''}
        </p>
      </div>
      <span className="text-sm font-medium tabular-nums text-gray-900 dark:text-white">${b.amt.toFixed(2)}</span>
    </div>
  );
}
