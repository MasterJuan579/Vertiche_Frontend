// The auth "module" is just the public auth pages. The shell mounts them
// directly at "/" and "/nueva-contrasena" — no need for internal routing here.
export { LoginPage } from './pages/LoginPage.jsx';
export { NewPasswordPage } from './pages/NewPasswordPage.jsx';
