import { Routes, Route, Navigate } from 'react-router-dom';
import { RequireRole } from '@vertiche/design-system';

// Auth pages (login + first-login password change + password recovery)
import {
  LoginPage,
  NewPasswordPage,
  ForgotPasswordPage,
  ConfirmForgotPasswordPage,
} from 'auth';

// Per-role modules
import { RfidModule } from 'rfid';
import { SorterModule } from 'sorter';
import { DashboardModule } from 'dashboard';
import { ProveedoresModule } from 'proveedores';
import { AdminModule } from 'admin';

export default function App() {
  return (
    <Routes>
      {/* Public auth routes */}
      <Route path="/" element={<LoginPage />} />
      <Route path="/nueva-contrasena" element={<NewPasswordPage />} />
      <Route path="/recuperar-contrasena" element={<ForgotPasswordPage />} />
      <Route
        path="/recuperar-contrasena/confirmar"
        element={<ConfirmForgotPasswordPage />}
      />

      {/* Role-gated modules. The "/*" wildcard lets each module own its
          internal routing. RequireRole redirects to login if no session,
          or to the user's own module if their role doesn't match. */}
      <Route
        path="/rfid/*"
        element={
          <RequireRole role="SUPERVISOR">
            <RfidModule />
          </RequireRole>
        }
      />
      <Route
        path="/sorter/*"
        element={
          <RequireRole role="BAY_OPERATOR">
            <SorterModule />
          </RequireRole>
        }
      />
      <Route
        path="/dashboard/*"
        element={
          <RequireRole role="OPS_MANAGER">
            <DashboardModule />
          </RequireRole>
        }
      />
      <Route
        path="/proveedores/*"
        element={
          <RequireRole role="QA_INSPECTOR">
            <ProveedoresModule />
          </RequireRole>
        }
      />
      <Route
        path="/admin/*"
        element={
          <RequireRole role="ADMIN">
            <AdminModule />
          </RequireRole>
        }
      />

      {/* Unknown paths bounce to login. */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
