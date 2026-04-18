import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './AppContext';
import { NotificationProvider } from './NotificationContext';
import Toast from './components/Toast';
import Layout from './Layout';
import Splash from './pages/Splash';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import Setup2FA from './pages/Setup2FA';
import Verify2FA from './pages/Verify2FA';
import Overview from './pages/Overview';
import Transactions from './pages/Transactions';
import Spending from './pages/Spending';
import Budget from './pages/Budget';
import Bills from './pages/Bills';
import Goals from './pages/Goals';
import Portfolio from './pages/Portfolio';
import Settings from './pages/Settings';

function AppRoutes() {
  const { user, authLoading, passwordRecovery, prefsLoaded, preferences, twoFactorVerified } = useApp();
  const isAuthenticated = Boolean(user);
  const needsTwoFactor = isAuthenticated && preferences.twoFactorEnabled && !twoFactorVerified;

  if (authLoading || (isAuthenticated && !prefsLoaded)) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center transition-colors">
        <p className="text-sm text-gray-400">Loading…</p>
      </div>
    );
  }

  if (needsTwoFactor) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/verify-2fa" element={<Verify2FA />} />
          <Route path="*" element={<Navigate to="/verify-2fa" replace />} />
        </Routes>
      </BrowserRouter>
    );
  }

  if (!isAuthenticated || passwordRecovery) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Splash />} />
          <Route path="/welcome" element={<Splash />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/setup-2fa" element={<Setup2FA />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    );
  }

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
        <Route path="/login" element={<Navigate to="/overview" replace />} />
        <Route path="/forgot-password" element={<Navigate to="/overview" replace />} />
        <Route path="/setup-2fa" element={<Navigate to="/overview" replace />} />
        <Route path="/verify-2fa" element={<Navigate to="/overview" replace />} />
        <Route path="*" element={<Navigate to="/overview" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <NotificationProvider>
      <AppProvider>
        <AppRoutes />
        <Toast />
      </AppProvider>
    </NotificationProvider>
  );
}
