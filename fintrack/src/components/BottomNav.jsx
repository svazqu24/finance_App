import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useApp } from '../AppContext';
import { NAV_ITEMS } from '../navItems';

const PRIMARY_PATHS = ['overview', 'transactions', 'budget', 'bills'];
const MORE_PATHS    = ['goals', 'spending', 'reports', 'accounts', 'portfolio', 'settings'];
const PRIMARY_LABELS = { overview: 'Home', transactions: 'Txns', budget: 'Budget', bills: 'Bills' };

const primaryTabs = NAV_ITEMS.filter(i => PRIMARY_PATHS.includes(i.path));
const moreItems   = NAV_ITEMS.filter(i => MORE_PATHS.includes(i.path));

export default function BottomNav() {
  const { preferences } = useApp();
  const { navPosition } = preferences;
  const [moreOpen, setMoreOpen] = useState(false);
  const location = useLocation();

  // Always show on mobile; on desktop only when navPosition === 'bottom'
  const visCls = navPosition === 'bottom' ? '' : 'sm:hidden';

  const moreIsActive = MORE_PATHS.some(p => location.pathname === `/${p}`);

  function closeMore() { setMoreOpen(false); }

  return (
    <>
      {/* Backdrop — closes the More drawer when tapping outside */}
      {moreOpen && (
        <div
          className={`${visCls} fixed inset-0 z-20`}
          onClick={closeMore}
        />
      )}

      {/* More drawer — slides up from above the tab bar */}
      <div
        className={`${visCls} fixed left-0 right-0 z-30 transition-transform duration-300 ease-out`}
        style={{
          background: '#0a0e1a',
          borderTop: '1px solid #1f2937',
          bottom: `calc(56px + env(safe-area-inset-bottom, 0px))`,
          transform: moreOpen ? 'translateY(0)' : 'translateY(110%)',
        }}
      >
        <div className="max-w-[680px] mx-auto px-4 pt-3 pb-2 grid grid-cols-5">
          {moreItems.map(item => (
            <NavLink
              key={item.path}
              to={`/${item.path}`}
              onClick={closeMore}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl transition-colors min-h-[56px] justify-center ${
                  isActive ? 'text-[#27AE60]' : 'text-[#6b7280]'
                }`
              }
            >
              {item.icon}
              <span className="text-[10px] font-medium leading-none mt-0.5">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </div>

      {/* Tab bar */}
      <nav
        className={`${visCls} fixed bottom-0 left-0 right-0 z-30 border-t transition-colors`}
        style={{
          background: '#0a0e1a',
          borderColor: '#1f2937',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <div className="flex max-w-[680px] mx-auto">
          {primaryTabs.map(tab => (
            <NavLink
              key={tab.path}
              to={`/${tab.path}`}
              onClick={closeMore}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] transition-colors ${
                  isActive ? 'text-[#27AE60]' : 'text-[#6b7280]'
                }`
              }
            >
              {tab.icon}
              <span className="text-[11px] font-medium leading-none">
                {PRIMARY_LABELS[tab.path] ?? tab.label}
              </span>
            </NavLink>
          ))}

          {/* More button */}
          <button
            onClick={() => setMoreOpen(v => !v)}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] transition-colors ${
              moreIsActive || moreOpen ? 'text-[#27AE60]' : 'text-[#6b7280]'
            }`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="5" cy="12" r="1.2" /><circle cx="12" cy="12" r="1.2" /><circle cx="19" cy="12" r="1.2" />
            </svg>
            <span className="text-[11px] font-medium leading-none">More</span>
          </button>
        </div>
      </nav>
    </>
  );
}
