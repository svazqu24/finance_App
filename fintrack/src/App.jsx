import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './AppContext';
import Layout from './Layout';
import Auth from './pages/Auth';
import Overview from './pages/Overview';
import Transactions from './pages/Transactions';
import Spending from './pages/Spending';
import Budget from './pages/Budget';
import Goals from './pages/Goals';
import Portfolio from './pages/Portfolio';

// Rendered inside AppProvider so it can read auth state from context
function AppRoutes() {
  const { user, authLoading } = useApp();

  // Hold render until the initial Supabase session check resolves —
  // prevents a flash of the Auth page on refresh when already logged in
  if (authLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center transition-colors">
        <p className="text-sm text-gray-400">Loading…</p>
      </div>
    );
  }

  if (!user) return <Auth />;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/overview" replace />} />
          <Route path="overview"     element={<Overview />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="spending"     element={<Spending />} />
          <Route path="budget"       element={<Budget />} />
          <Route path="goals"        element={<Goals />} />
          <Route path="portfolio"    element={<Portfolio />} />
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
