import { NavLink } from 'react-router-dom';
import { useApp } from '../AppContext';

const tabs = [
  { path: 'overview', label: 'Home', icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  )},
  { path: 'transactions', label: 'Txns', icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  )},
  { path: 'budget', label: 'Budget', icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
      <line x1="2" y1="20" x2="22" y2="20" />
    </svg>
  )},
  { path: 'goals', label: 'Goals', icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  )},
  { path: 'bills', label: 'Bills', icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )},
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
