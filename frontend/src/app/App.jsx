import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { AuthProvider, useAuth } from './providers/AuthContext';
import LoadingSpinner from '../shared/components/LoadingSpinner';
import ErrorBoundary from '../shared/components/ErrorBoundary';

const Layout = lazy(() => import('../shared/components/Layout'));
const LoginPage = lazy(() => import('../features/auth/LoginPage'));
const DashboardPage = lazy(() => import('../features/dashboard/DashboardPage'));
const BraceletsPage = lazy(() => import('../features/bracelets/BraceletsPage'));
const ProductsPage = lazy(() => import('../features/products/ProductsPage'));
const ComandaPage = lazy(() => import('../features/comandas/ComandaPage'));
const ReportsPage = lazy(() => import('../features/reports/ReportsPage'));
const InventoryPage = lazy(() => import('../features/products/InventoryPage'));
const ClientsPage = lazy(() => import('../features/clients/ClientsPage'));
const EventsPage = lazy(() => import('../features/events/EventsPage'));
const IntelligencePage = lazy(() => import('../features/intelligence/IntelligencePage'));
const DevicesPage = lazy(() => import('../features/devices/DevicesPage'));
const FinancePage = lazy(() => import('../features/finance/FinancePage'));
const BackupPage = lazy(() => import('../features/backup/BackupPage'));

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-white">Carregando...</div>;
  }
  return isAuthenticated ? children : <Navigate to="login" replace />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <HashRouter>
          <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-white"><LoadingSpinner /></div>}>
            <Routes>
              <Route path="login" element={<LoginPage />} />
              <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="bracelets" element={<BraceletsPage />} />
                <Route path="products" element={<ProductsPage />} />
                <Route path="inventory" element={<InventoryPage />} />
                <Route path="clients" element={<ClientsPage />} />
                <Route path="events" element={<EventsPage />} />
                <Route path="intelligence" element={<IntelligencePage />} />
                <Route path="devices" element={<DevicesPage />} />
                <Route path="finance" element={<FinancePage />} />
                <Route path="backup" element={<BackupPage />} />
                <Route path="comanda" element={<ComandaPage />} />
                <Route path="reports" element={<ReportsPage />} />
              </Route>
              <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Routes>
          </Suspense>
        </HashRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}
