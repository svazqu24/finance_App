const ACCENT = {
  income: '#27AE60',
  saved:  '#27AE60',
  spent:  '#f87171',
};

export default function StatCard({ label, value, sub, valueStyle = {} }) {
  const accent = ACCENT[label] || '#27AE60';
  return (
    <div
      className="bg-[#f5f5f3] dark:bg-nero-surface rounded-lg px-3.5 py-3 transition-colors"
      style={{ borderLeft: `3px solid ${accent}` }}
    >
      <p className="text-[11px] uppercase tracking-[.08em] text-gray-400 m-0 mb-1.5">{label}</p>
      <p className="text-[21px] font-medium tabular-nums m-0 text-gray-900 dark:text-white" style={valueStyle}>{value}</p>
      <p className="text-[11px] text-gray-500 mt-1 m-0">{sub}</p>
    </div>
  );
}
