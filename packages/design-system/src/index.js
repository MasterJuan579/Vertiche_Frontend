export { Card, CardHeader, CardBody } from './components/Card.jsx';
export { Button } from './components/Button.jsx';
export { StatusDot } from './components/StatusDot.jsx';
export { StatusPill } from './components/StatusPill.jsx';
export { KPI } from './components/KPI.jsx';
export { AppShell } from './components/AppShell.jsx';
export { Modal } from './components/Modal.jsx';
export { Table, TableHeader, TableRow, TableCell } from './components/Table.jsx';
export { SearchInput } from './components/SearchInput.jsx';
export { TabBar } from './components/TabBar.jsx';
export { EmptyState } from './components/EmptyState.jsx';
export { ThemeToggle } from './components/ThemeToggle.jsx';

// Auth exports — React-context API
export {
  AuthProvider,
  useAuth,
  RequireRole,
  ROLE_HOMES,
} from './auth.jsx';

// Theme exports — dark/light mode
export { ThemeProvider, useTheme } from './theme.jsx';

// Cognito client — raw-fetch auth actions
export {
  initiateAuth,
  respondToNewPasswordChallenge,
  globalSignOut,
  refreshTokens,
  sendEmailVerificationCode,
  verifyEmailAttribute,
  cognitoConfig,
} from './cognito.js';

// Authenticated backend client
export { apiFetch, apiGet, apiPost, apiDelete } from './api.js';
