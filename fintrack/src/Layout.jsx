import { Outlet, NavLink } from 'react-router-dom';
import StatCard from './components/StatCard';

const tabs = [
  { path: 'overview', label: 'Overview' },
  { path: 'transactions', label: 'Transactions' },
  { path: 'spending', label: 'Spending' },
  { path: 'budget', label: 'Budget' },
  { path: 'goals', label: 'Goals' },
  { path: 'portfolio', label: 'Portfolio' },
];

export default function Layout() {
  return (
    <div className="py-6 px-4 font-sans max-w-[680px] mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <p className="text-[11px] tracking-[.1em] uppercase text-gray-400 mb-1.5 m-0">net worth</p>
          <div className="flex items-baseline gap-3 flex-wrap">
            <span className="text-[36px] font-medium tabular-nums leading-[1.15]">$47,840</span>
            <span
              className="text-xs font-medium px-2.5 py-[3px] rounded-full"
              style={{ color: '#27500A', background: '#C8EBB4' }}
            >
              +$1,240 this month
            </span>
          </div>
        </div>
        <p className="text-xs text-gray-400 pt-2 m-0">April 2026</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        <StatCard label="income" value="$5,200" sub="this month" />
        <StatCard label="spent" value="$3,640" sub="this month" />
        <StatCard label="saved" value="30%" sub="of income" valueStyle={{ color: '#3B6D11' }} />
      </div>

      {/* Tab nav */}
      <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
        {tabs.map((tab) => (
          <NavLink
            key={tab.path}
            to={`/${tab.path}`}
            className={({ isActive }) =>
              `no-underline flex-shrink-0 px-3 pt-2 pb-[9px] text-[13px] border-b-2 whitespace-nowrap -mb-px ${
                isActive
                  ? 'border-gray-900 text-gray-900 font-medium'
                  : 'border-transparent text-gray-400 font-normal'
              }`
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </div>

      {/* Page content */}
      <Outlet />
    </div>
  );
}
