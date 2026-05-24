import { Routes, Route, Navigate } from 'react-router-dom';
import { RequireRole } from '@vertiche/design-system';

// Auth pages (login + demo role picker)
import { LoginPage, RolePickerPage } from 'auth';

// Per-role modules
import { RfidModule } from 'rfid';
import { SorterModule } from 'sorter';
import { DashboardModule } from 'dashboard';
import { ProveedoresModule } from 'proveedores';

export default function App() {
  return (
    <Routes>
      {/* Public auth routes */}
      <Route path="/" element={<LoginPage />} />
      <Route path="/select-role" element={<RolePickerPage />} />

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

      {/* Unknown paths bounce to login. */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
