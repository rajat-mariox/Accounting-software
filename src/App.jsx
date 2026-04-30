import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import ClientsPage from './pages/ClientsPage';
import DashboardPage from './pages/DashboardPage';
import InventoryPage from './pages/InventoryPage';
import InvoicesPage from './pages/InvoicesPage';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import PaymentsPage from './pages/PaymentsPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import AuditLogsPage from './pages/AuditLogsPage';
import SuppliersPage from './pages/SuppliersPage';
import UsersRolesPage from './pages/UsersRolesPage';
import PrivateRoute from './components/routes/PrivateRoute';
import PublicRoute from './components/routes/PublicRoute';

function App() {
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
            <PrivateRoute>
              <DashboardPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/clients"
          element={
            <PrivateRoute>
              <ClientsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/clients/add"
          element={
            <PrivateRoute>
              <ClientsPage initialAction="add" />
            </PrivateRoute>
          }
        />
        <Route
          path="/suppliers"
          element={
            <PrivateRoute>
              <SuppliersPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/inventory"
          element={
            <PrivateRoute>
              <InventoryPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/items/add"
          element={
            <PrivateRoute>
              <InventoryPage initialAction="add" />
            </PrivateRoute>
          }
        />
        <Route
          path="/invoices"
          element={
            <PrivateRoute>
              <InvoicesPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/invoices/add"
          element={
            <PrivateRoute>
              <InvoicesPage initialAction="add" />
            </PrivateRoute>
          }
        />
        <Route
          path="/payments"
          element={
            <PrivateRoute>
              <PaymentsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/payments/add"
          element={
            <PrivateRoute>
              <PaymentsPage initialAction="add" />
            </PrivateRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <PrivateRoute>
              <ReportsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/users-roles"
          element={
            <PrivateRoute>
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
            <PrivateRoute>
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
