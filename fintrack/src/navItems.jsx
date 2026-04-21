/** Shared navigation item definitions used by Layout (sidebar) and BottomNav. */

export const NAV_ITEMS = [
  {
    path: 'overview',
    label: 'Overview',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  { path: 'transactions', label: 'Transactions', icon: <span className="text-base leading-none">💳</span> },
  { path: 'budget',       label: 'Budget',       icon: <span className="text-base leading-none">📊</span> },
  { path: 'bills',        label: 'Bills',        icon: <span className="text-base leading-none">📅</span> },
  { path: 'goals',        label: 'Goals',        icon: <span className="text-base leading-none">🎯</span> },
  { path: 'spending',     label: 'Spending',     icon: <span className="text-base leading-none">📈</span> },
  { path: 'accounts',     label: 'Accounts',     icon: <span className="text-base leading-none">🏦</span> },
  { path: 'portfolio',    label: 'Portfolio',    icon: <span className="text-base leading-none">📉</span> },
  { path: 'settings',     label: 'Settings',     icon: <span className="text-base leading-none">⚙️</span> },
];

export const NAV_PRIMARY   = NAV_ITEMS.filter(i => ['overview','transactions','budget','bills'].includes(i.path));
export const NAV_SECONDARY = NAV_ITEMS.filter(i => ['goals','spending','accounts','portfolio'].includes(i.path));
export const NAV_SETTINGS  = NAV_ITEMS.find(i => i.path === 'settings');

/** Gear icon for the header button (smaller) */
export function GearIcon({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}
