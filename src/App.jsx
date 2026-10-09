import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { loadCurrencySettings, useCurrencySettings } from './utils/currency';
import { getStoredToken } from './utils/auth';
import ClientsPage from './pages/ClientsPage';
import DashboardPage from './pages/DashboardPage';
import InventoryPage from './pages/InventoryPage';
import SuppliersPage from './pages/SuppliersPage';
import InvoicesPage from './pages/InvoicesPage';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import PaymentsPage from './pages/PaymentsPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import AuditLogsPage from './pages/AuditLogsPage';
import UsersRolesPage from './pages/UsersRolesPage';
import PrivateRoute from './components/routes/PrivateRoute';
import PublicRoute from './components/routes/PublicRoute';

function App() {
  // Currency & Region settings drive every money/date format; re-render on change.
  useCurrencySettings();
  useEffect(() => {
    if (getStoredToken()) loadCurrencySettings();
    // After login the token is stored right after the auth event fires.
    const onAuth = () => window.setTimeout(() => getStoredToken() && loadCurrencySettings(), 0);
    window.addEventListener('auth-changed', onAuth);
    return () => window.removeEventListener('auth-changed', onAuth);
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Public routes — accessible without auth. Logged-in users get bounced to /dashboard. */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PublicRoute>
              <ForgotPasswordPage />
            </PublicRoute>
          }
        />

        {/* Private routes — require an authenticated user. */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute module="dashboard">
              <DashboardPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/clients"
          element={
            <PrivateRoute module="clients">
              <ClientsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/clients/add"
          element={
            <PrivateRoute module="clients">
              <ClientsPage initialAction="add" />
            </PrivateRoute>
          }
        />
        <Route
          path="/suppliers"
          element={
            <PrivateRoute module="suppliers">
              <SuppliersPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/inventory"
          element={
            <PrivateRoute module="inventory">
              <InventoryPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/items/add"
          element={
            <PrivateRoute module="inventory">
              <InventoryPage initialAction="add" />
            </PrivateRoute>
          }
        />
        <Route
          path="/invoices"
          element={
            <PrivateRoute module="invoices">
              <InvoicesPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/invoices/add"
          element={
            <PrivateRoute module="invoices">
              <InvoicesPage initialAction="add" />
            </PrivateRoute>
          }
        />
        <Route
          path="/payments"
          element={
            <PrivateRoute module="payments">
              <PaymentsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/payments/add"
          element={
            <PrivateRoute module="payments">
              <PaymentsPage initialAction="add" />
            </PrivateRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <PrivateRoute module="reports">
              <ReportsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/users-roles"
          element={
            <PrivateRoute module="users">
              <UsersRolesPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <PrivateRoute>
              <SettingsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/audit-logs"
          element={
            <PrivateRoute module="auditLogs">
              <AuditLogsPage />
            </PrivateRoute>
          }
        />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
