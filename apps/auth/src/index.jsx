// The auth "module" is just two public pages. The shell mounts them directly
// at "/" and "/select-role" — no need for internal routing here.
export { LoginPage } from './pages/LoginPage.jsx';
export { RolePickerPage } from './pages/RolePickerPage.jsx';
