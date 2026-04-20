import { NavLink } from 'react-router-dom';
import { useApp } from '../AppContext';

const tabs = [
  { path: 'overview',      label: 'Overview',  icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  )},
  { path: 'transactions',  label: 'Txns',      icon: <span className="text-lg leading-none">💳</span> },
  { path: 'budget',        label: 'Budget',    icon: <span className="text-lg leading-none">📊</span> },
  { path: 'goals',         label: 'Goals',     icon: <span className="text-lg leading-none">🎯</span> },
  { path: 'bills',         label: 'Bills',     icon: <span className="text-lg leading-none">📅</span> },
];

export default function BottomNav() {
  const { preferences } = useApp();
  const { navPosition } = preferences;

  if (navPosition === 'left' || navPosition === 'right') return null;

  const visibilityCls = navPosition === 'bottom' ? '' : 'sm:hidden';

  return (
    <nav
      className={`${visibilityCls} fixed bottom-0 left-0 right-0 z-30 border-t transition-colors`}
      style={{
        background: '#0a0e1a',
        borderColor: '#1f2937',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div className="flex max-w-[680px] mx-auto">
        {tabs.map((tab) => (
          <NavLink
            key={tab.path}
            to={`/${tab.path}`}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] transition-colors ${
                isActive ? 'text-[#27AE60]' : 'text-[#6b7280]'
              }`
            }
          >
            {tab.icon}
            <span className="text-[10px] font-medium leading-none">{tab.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
