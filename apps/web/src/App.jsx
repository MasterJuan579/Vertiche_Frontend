import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Importación del flujo de Autenticación y Roles corporativos
import { LoginPage } from '../../auth/src/pages/LoginPage.jsx';
import { RolePickerPage } from '../../auth/src/pages/RolePickerPage.jsx';

// Importación de Módulos
import { DashboardModule } from '../../dashboard/src/index.jsx';
import { SorterModule } from '../../sorter/src/index.jsx';
import { RfidModule } from '../../rfid/src/index.jsx';
import { ProveedoresModule } from '../../proveedores/src/index.jsx';

// Importación de Layout / Shell global y Guard de autenticación
import { RequireRole } from '@vertiche/design-system';

export default function App() {
  return (
    <Routes>
      {/* Rutas públicas sin protección */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/select-role" element={<RolePickerPage />} />

      {/* Módulo RFID - Supervisión */}
      <Route
        path="/rfid/*"
        element={
          <RequireRole role="SUPERVISOR">
            <RfidModule />
          </RequireRole>
        }
      />

      {/* Módulo de Dashboard Protegido */}
      <Route
        path="/dashboard/*"
        element={
          <RequireRole role="OPS_MANAGER">
            <DashboardModule />
          </RequireRole>
        }
      />

      {/* Módulo de Sorter & Bahías Protegido */}
      <Route
        path="/sorter/*"
        element={
          <RequireRole role="BAY_OPERATOR">
            <SorterModule />
          </RequireRole>
        }
      />

      {/* Módulo Proveedores - Calidad QA */}
      <Route
        path="/proveedores/*"
        element={
          <RequireRole role="QA_INSPECTOR">
            <ProveedoresModule />
          </RequireRole>
        }
      />

      {/* Caída por defecto al entrar al dominio */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}