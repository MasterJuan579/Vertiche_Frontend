import { useCallback, useEffect, useState } from 'react';
import {
  Button,
  Modal,
  StatusDot,
  EmptyState,
  Table,
  TableHeader,
  TableRow,
  TableCell,
  useAuth,
  apiGet,
  apiPost,
  apiDelete,
} from '@vertiche/design-system';

// Role identity: label for the dropdown + accent for the badge. Accents reuse
// each module's brand tone (admin = slate) so a role is recognizable at a glance.
const ROLE_META = {
  ADMIN: { label: 'Administrador', short: 'Admin', accent: '#475569' },
  SUPERVISOR: { label: 'Supervisor CEDIS', short: 'Supervisor', accent: '#1E40AF' },
  BAY_OPERATOR: { label: 'Operador de Bahía', short: 'Op. Bahía', accent: '#7C3AED' },
  OPS_MANAGER: { label: 'Gerente de Operaciones', short: 'Gerente Ops', accent: '#0F766E' },
  QA_INSPECTOR: { label: 'Inspector de Calidad', short: 'Inspector QA', accent: '#C2410C' },
};
const ROLE_KEYS = Object.keys(ROLE_META);

const inputClass =
  'w-full px-3 py-2.5 bg-white border border-ink-200 rounded-card text-sm text-ink-700 placeholder-ink-300 focus:outline-none focus:border-ink-400 focus:ring-2 focus:ring-ink-100 disabled:opacity-60 disabled:cursor-not-allowed';

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

function timeAgo(iso) {
  if (!iso) return '—';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '—';
  const diff = Date.now() - then;
  const min = Math.floor(diff / 60000);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);
  if (day > 0) return `hace ${day} día${day > 1 ? 's' : ''}`;
  if (hr > 0) return `hace ${hr} h`;
  if (min > 0) return `hace ${min} min`;
  return 'hace un momento';
}

function createErrorMessage(err) {
  switch (err && err.error) {
    case 'invalid_email':
      return 'El correo no es válido.';
    case 'missing_fields':
      return 'Faltan campos obligatorios.';
    case 'invalid_role':
      return 'El rol seleccionado no es válido.';
    case 'email_already_exists':
      return 'Ya existe un usuario con ese correo.';
    case 'cognito_create_failed':
      return 'No se pudo crear el usuario en Cognito. Intenta de nuevo.';
    default:
      return 'No se pudo crear el usuario. Intenta de nuevo.';
  }
}

// --------------------------------------------------------------------------
// Sub-components (inline — tightly coupled, not reused elsewhere)
// --------------------------------------------------------------------------

function RoleBadge({ role }) {
  const meta = ROLE_META[role] || { short: role, accent: '#64748B' };
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-pill text-[10px] font-display font-semibold uppercase tracking-industrial text-white"
      style={{ background: meta.accent }}
    >
      {meta.short}
    </span>
  );
}

function SkeletonRows() {
  return (
    <>
      {[0, 1, 2, 3].map((i) => (
        <TableRow key={i}>
          {[0, 1, 2, 3, 4, 5].map((c) => (
            <TableCell key={c}>
              <div className="h-3 rounded bg-ink-100 animate-pulse" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

function UserRow({ user, isSelf, onDelete }) {
  return (
    <TableRow>
      <TableCell className="font-medium dark:text-ink-100">{user.email}</TableCell>
      <TableCell className="dark:text-ink-200">{user.nombre}</TableCell>
      <TableCell>
        <RoleBadge role={user.rol} />
      </TableCell>
      <TableCell>
        <span className="inline-flex items-center gap-2">
          <StatusDot status={user.activo ? 'flow' : 'idle'} />
          <span className="text-xs text-ink-500 dark:text-ink-300">
            {user.activo ? 'Activo' : 'Inactivo'}
          </span>
        </span>
      </TableCell>
      <TableCell className="text-ink-500 dark:text-ink-300">
        {timeAgo(user.createdAt)}
      </TableCell>
      <TableCell align="right">
        <button
          onClick={() => onDelete(user)}
          disabled={isSelf}
          title={isSelf ? 'No puedes eliminar tu propia cuenta' : 'Eliminar usuario'}
          className="text-ink-400 hover:text-anomaly disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Eliminar usuario"
        >
          🗑
        </button>
      </TableCell>
    </TableRow>
  );
}

function TempPasswordDisplay({ created, onClose }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(created.temporary_password);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-flow">
        <StatusDot status="flow" />
        <span className="font-display font-semibold">Usuario creado</span>
      </div>
      <p className="text-sm text-ink-500">
        Comparte esta contraseña temporal con <strong>{created.nombre}</strong>.
        La necesitará en su primer inicio de sesión y deberá cambiarla.
      </p>
      <div className="p-4 bg-ink-50 border border-ink-200 rounded-card">
        <div className="label-industrial text-ink-400 mb-1">
          Contraseña temporal
        </div>
        <div className="flex items-center justify-between gap-3">
          <code className="font-mono text-base text-ink-700 break-all">
            {created.temporary_password}
          </code>
          <Button variant="secondary" size="sm" onClick={copy}>
            {copied ? 'Copiado ✓' : 'Copiar al portapapeles'}
          </Button>
        </div>
      </div>
      <div className="flex justify-end">
        <Button variant="primary" onClick={onClose}>
          Entendido
        </Button>
      </div>
    </div>
  );
}

function CreateUserModal({ open, onClose, onCreated }) {
  const [email, setEmail] = useState('');
  const [nombre, setNombre] = useState('');
  const [rol, setRol] = useState('SUPERVISOR');
  const [tempPassword, setTempPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState(null); // success payload (may hold temp pw)

  function reset() {
    setEmail('');
    setNombre('');
    setRol('SUPERVISOR');
    setTempPassword('');
    setSubmitting(false);
    setError('');
    setCreated(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const body = { email, nombre, rol };
      if (tempPassword) body.temporary_password = tempPassword;
      const result = await apiPost('/Auth/registrar', body);
      onCreated(); // refresh the list in the background
      if (result && result.temporary_password) {
        setCreated(result); // show the generated password
      } else {
        handleClose();
      }
    } catch (err) {
      setError(createErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      label="Administración"
      title={created ? 'Usuario creado' : 'Crear usuario'}
      size="md"
    >
      {created ? (
        <TempPasswordDisplay created={created} onClose={handleClose} />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="cu-email" className="label-industrial text-ink-400 mb-1.5 block">
              Correo
            </label>
            <input
              id="cu-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
              required
              placeholder="nombre@vertiche.mx"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="cu-nombre" className="label-industrial text-ink-400 mb-1.5 block">
              Nombre
            </label>
            <input
              id="cu-nombre"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              disabled={submitting}
              required
              placeholder="Nombre completo"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="cu-rol" className="label-industrial text-ink-400 mb-1.5 block">
              Rol
            </label>
            <select
              id="cu-rol"
              value={rol}
              onChange={(e) => setRol(e.target.value)}
              disabled={submitting}
              className={inputClass}
            >
              {ROLE_KEYS.map((key) => (
                <option key={key} value={key}>
                  {ROLE_META[key].label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="cu-pw" className="label-industrial text-ink-400 mb-1.5 block">
              Contraseña temporal (opcional)
            </label>
            <input
              id="cu-pw"
              type="text"
              value={tempPassword}
              onChange={(e) => setTempPassword(e.target.value)}
              disabled={submitting}
              placeholder="Se genera automáticamente si se deja vacío"
              className={inputClass}
            />
          </div>

          {error && (
            <div className="p-3 bg-anomaly-bg border border-anomaly/20 rounded-card text-sm text-anomaly">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={handleClose} disabled={submitting}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Creando...' : 'Crear usuario'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

// --------------------------------------------------------------------------
// Page
// --------------------------------------------------------------------------

export function Usuarios() {
  const { session } = useAuth();
  const selfSub = session?.user?.sub;

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [createOpen, setCreateOpen] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiGet('/Auth/listarUsuarios');
      setUsers(Array.isArray(data) ? data : []);
    } catch {
      setError('No se pudieron cargar los usuarios. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await apiDelete(`/Auth/${deleteTarget.cognito_sub}`);
      setDeleteTarget(null);
      load();
    } catch (err) {
      if (err && (err.status === 403 || err.error === 'cannot_delete_self')) {
        setDeleteError('No puedes eliminar tu propia cuenta.');
      } else {
        setDeleteError('No se pudo eliminar el usuario. Intenta de nuevo.');
      }
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="label-industrial text-ink-400 mb-1">Administración</div>
          <h1 className="font-display font-bold text-2xl text-ink-700 dark:text-ink-100">
            Gestión de usuarios
          </h1>
        </div>
        <Button variant="primary" onClick={() => setCreateOpen(true)}>
          Crear usuario
        </Button>
      </div>

      {/* List error */}
      {error && (
        <div className="mb-4 p-3 bg-anomaly-bg border border-anomaly/20 rounded-card text-sm text-anomaly">
          {error}
        </div>
      )}

      {/* Table / states */}
      {loading ? (
        <Table>
          <TableHeader>
            <TableCell header>Email</TableCell>
            <TableCell header>Nombre</TableCell>
            <TableCell header>Rol</TableCell>
            <TableCell header>Estado</TableCell>
            <TableCell header>Creado</TableCell>
            <TableCell header align="right">
              Acciones
            </TableCell>
          </TableHeader>
          <tbody>
            <SkeletonRows />
          </tbody>
        </Table>
      ) : users.length === 0 && !error ? (
        <EmptyState
          icon="👤"
          title="Aún no hay usuarios"
          description="Crea el primer usuario para darle acceso al sistema."
          action={
            <Button variant="primary" onClick={() => setCreateOpen(true)}>
              Crear usuario
            </Button>
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableCell header>Email</TableCell>
            <TableCell header>Nombre</TableCell>
            <TableCell header>Rol</TableCell>
            <TableCell header>Estado</TableCell>
            <TableCell header>Creado</TableCell>
            <TableCell header align="right">
              Acciones
            </TableCell>
          </TableHeader>
          <tbody>
            {users.map((u) => (
              <UserRow
                key={u.cognito_sub}
                user={u}
                isSelf={u.cognito_sub === selfSub}
                onDelete={setDeleteTarget}
              />
            ))}
          </tbody>
        </Table>
      )}

      {/* Create modal */}
      <CreateUserModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={load}
      />

      {/* Delete confirmation */}
      <Modal
        open={!!deleteTarget}
        onClose={() => {
          setDeleteTarget(null);
          setDeleteError('');
        }}
        label="Confirmar"
        title="Eliminar usuario"
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setDeleteTarget(null);
                setDeleteError('');
              }}
              disabled={deleting}
            >
              Cancelar
            </Button>
            <Button variant="danger" onClick={confirmDelete} disabled={deleting}>
              {deleting ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-600">
          ¿Eliminar a <strong>{deleteTarget?.nombre}</strong>? Esta acción no se
          puede deshacer.
        </p>
        {deleteError && (
          <div className="mt-3 p-3 bg-anomaly-bg border border-anomaly/20 rounded-card text-sm text-anomaly">
            {deleteError}
          </div>
        )}
      </Modal>
    </div>
  );
}
