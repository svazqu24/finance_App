import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './AppContext';
import Layout from './Layout';
import Auth from './pages/Auth';
import Overview from './pages/Overview';
import Transactions from './pages/Transactions';
import Spending from './pages/Spending';
import Budget from './pages/Budget';
import Bills from './pages/Bills';
import Goals from './pages/Goals';
import Portfolio from './pages/Portfolio';
import Settings from './pages/Settings';

// Rendered inside AppProvider so it can read auth state from context
function AppRoutes() {
  const { user, authLoading, passwordRecovery } = useApp();

  // Hold render until the initial Supabase session check resolves —
  // prevents a flash of the Auth page on refresh when already logged in
  if (authLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-nero-bg flex items-center justify-center transition-colors">
        <p className="text-sm text-gray-400">Loading…</p>
      </div>
    );
  }

  // Show Auth when logged out, OR when arriving via a password-reset link
  // (passwordRecovery=true means the user has a recovery session but needs
  // to set a new password before accessing the dashboard)
  if (!user || passwordRecovery) return <Auth />;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/overview" replace />} />
          <Route path="overview"     element={<Overview />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="spending"     element={<Spending />} />
          <Route path="budget"       element={<Budget />} />
          <Route path="bills"        element={<Bills />} />
          <Route path="goals"        element={<Goals />} />
          <Route path="portfolio"    element={<Portfolio />} />
          <Route path="settings"     element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppRoutes />
    </AppProvider>
  );
}
