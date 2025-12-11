import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { AppLayout } from '@/components/layout/AppLayout';
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { AccountsPage } from '@/pages/finance/AccountsPage';
import { JournalEntriesPage } from '@/pages/finance/JournalEntriesPage';
import { InvoicesPage } from '@/pages/finance/InvoicesPage';
import { PaymentsPage } from '@/pages/finance/PaymentsPage';
import { VendorsPage } from '@/pages/finance/VendorsPage';
import { CustomersPage } from '@/pages/finance/CustomersPage';
import { FinancialStatementsPage } from '@/pages/finance/FinancialStatementsPage';
import { FinanceDashboardPage } from '@/pages/finance/FinanceDashboardPage';
import { ProjectsPage } from '@/pages/projects/ProjectsPage';
import { InsightsPage } from '@/pages/insights/InsightsPage';
import { UsersPage } from '@/pages/admin/UsersPage';
import { AuditLogsPage } from '@/pages/admin/AuditLogsPage';
import { RolesPage } from '@/pages/admin/RolesPage';
import { useAuthStore } from '@/store/auth.store';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  
  if (isAuthenticated) {
    return <Navigate to="/app/dashboard" replace />;
  }
  
  return <>{children}</>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Landing Page - Public, accessible to all */}
          <Route path="/" element={<LandingPage />} />

          {/* Public Routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <RegisterPage />
              </PublicRoute>
            }
          />

          {/* Protected Routes - App Section */}
          <Route
            path="/app"
            element={
              <PrivateRoute>
                <AppLayout />
              </PrivateRoute>
            }
          >
            <Route index element={<Navigate to="/app/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            
            {/* Finance Routes */}
            <Route path="finance">
              <Route index element={<Navigate to="/app/finance/dashboard" replace />} />
              <Route path="dashboard" element={<FinanceDashboardPage />} />
              <Route path="accounts" element={<AccountsPage />} />
              <Route path="journal-entries" element={<JournalEntriesPage />} />
              <Route path="invoices" element={<InvoicesPage />} />
              <Route path="payments" element={<PaymentsPage />} />
              <Route path="vendors" element={<VendorsPage />} />
              <Route path="customers" element={<CustomersPage />} />
              <Route path="reports" element={<FinancialStatementsPage />} />
            </Route>

            {/* Projects Routes */}
            <Route path="projects" element={<ProjectsPage />} />

            {/* AI Insights Routes */}
            <Route path="insights" element={<InsightsPage />} />

            {/* Admin Routes */}
            <Route path="admin">
              <Route index element={<Navigate to="/app/admin/users" replace />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="roles" element={<RolesPage />} />
              <Route path="audit-logs" element={<AuditLogsPage />} />
            </Route>
          </Route>

          {/* Legacy routes redirect to new /app paths */}
          <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
          <Route path="/finance/*" element={<Navigate to="/app/finance" replace />} />
          <Route path="/projects" element={<Navigate to="/app/projects" replace />} />
          <Route path="/insights" element={<Navigate to="/app/insights" replace />} />
          <Route path="/admin/*" element={<Navigate to="/app/admin" replace />} />

          {/* Catch all - redirect to landing */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </QueryClientProvider>
  );
}

export default App;