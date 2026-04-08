export default function StatCard({ label, value, sub, valueStyle = {} }) {
  return (
    <div className="bg-[#f5f5f3] rounded-lg px-3.5 py-3">
      <p className="text-[11px] uppercase tracking-[.08em] text-gray-400 m-0 mb-1.5">{label}</p>
      <p className="text-[21px] font-medium tabular-nums m-0" style={valueStyle}>{value}</p>
      <p className="text-[11px] text-gray-500 mt-1 m-0">{sub}</p>
    </div>
  );
}
