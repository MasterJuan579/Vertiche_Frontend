import { Route, Routes, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage.jsx';
import { RolePickerPage } from './pages/RolePickerPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/select-role" element={<RolePickerPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
