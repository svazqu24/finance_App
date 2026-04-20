const ACCENT = {
  income: '#27AE60',
  saved:  '#27AE60',
  spent:  '#f87171',
};

export default function StatCard({ label, value, sub, valueStyle = {} }) {
  const accent = ACCENT[label] || '#27AE60';
  return (
    <div
      className="rounded-lg px-3.5 py-3 transition-colors"
      style={{
        borderLeft: `3px solid ${accent}`,
        background: '#111827',
      }}
    >
      <p className="text-[10px] uppercase tracking-[0.1em] text-[#4b5563] m-0 mb-1.5">{label}</p>
      <p
        className="text-[21px] font-semibold tabular-nums m-0"
        style={{ color: '#f9fafb', letterSpacing: '-0.5px', ...valueStyle }}
      >
        {value}
      </p>
      <p className="text-[11px] text-[#6b7280] mt-1 m-0">{sub}</p>
    </div>
  );
}
