import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import ClientsPage from './pages/ClientsPage';
import DashboardPage from './pages/DashboardPage';
import InventoryPage from './pages/InventoryPage';
import InvoicesPage from './pages/InvoicesPage';
import LoginPage from './pages/LoginPage';
import PaymentsPage from './pages/PaymentsPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import AuditLogsPage from './pages/AuditLogsPage';
import SuppliersPage from './pages/SuppliersPage';
import UsersRolesPage from './pages/UsersRolesPage';
import { getStoredUser } from './utils/auth';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<RequireAuth><DashboardPage /></RequireAuth>} />
        <Route path="/clients" element={<RequireAuth><ClientsPage /></RequireAuth>} />
        <Route path="/clients/add" element={<RequireAuth><ClientsPage initialAction="add" /></RequireAuth>} />
        <Route path="/suppliers" element={<RequireAuth><SuppliersPage /></RequireAuth>} />
        <Route path="/inventory" element={<RequireAuth><InventoryPage /></RequireAuth>} />
        <Route path="/items/add" element={<RequireAuth><InventoryPage initialAction="add" /></RequireAuth>} />
        <Route path="/invoices" element={<RequireAuth><InvoicesPage /></RequireAuth>} />
        <Route path="/invoices/add" element={<RequireAuth><InvoicesPage initialAction="add" /></RequireAuth>} />
        <Route path="/payments" element={<RequireAuth><PaymentsPage /></RequireAuth>} />
        <Route path="/payments/add" element={<RequireAuth><PaymentsPage initialAction="add" /></RequireAuth>} />
        <Route path="/reports" element={<RequireAuth><ReportsPage /></RequireAuth>} />
        <Route path="/users-roles" element={<RequireAuth><UsersRolesPage /></RequireAuth>} />
        <Route path="/settings" element={<RequireAuth><SettingsPage /></RequireAuth>} />
        <Route path="/audit-logs" element={<RequireAuth><AuditLogsPage /></RequireAuth>} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

function RequireAuth({ children }) {
  const user = getStoredUser();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
