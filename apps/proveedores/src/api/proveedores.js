/**
 * Cliente fetch para el recurso "proveedores" del backend de Vertiche.
 *
 * La URL base se lee de VITE_API_URL (configurada en apps/web/.env).
 * Backend desplegado en EC2.
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// Storage key + token field are owned by auth.jsx ('vertiche.auth' / idToken);
// mirror design-system/api.js — never introduce a second key/field.
const STORAGE_KEY = 'vertiche.auth';

function authHeader() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const { idToken } = JSON.parse(raw);
    return idToken ? { Authorization: `Bearer ${idToken}` } : {};
  } catch {
    return {};
  }
}

/**
 * Single authed fetch wrapper. Every backend call goes through this.
 * - Attaches Content-Type + Authorization (Cognito id token).
 * - On 401: clears the session and bounces to login.
 * - On other non-2xx: reads the response body for diagnostics and throws.
 */
async function req(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(),
      ...(options.headers || {}),
    },
  });

  if (res.status === 401) {
    sessionStorage.removeItem(STORAGE_KEY);
    window.location.href = '/';
    throw new Error('Sesión expirada');
  }

  if (!res.ok) {
    let detail = '';
    try {
      const body = await res.text();
      detail = body ? ` — ${body}` : '';
    } catch {
      // body ilegible — seguimos con el status nada más
    }
    console.error(`[proveedores] ${path} →`, res.status, detail);
    throw new Error(`Error ${res.status}${detail}`);
  }

  return res.json();
}

export async function fetchProveedores() {
  return req('/Proveedor/listarProveedores');
}

/**
 * Lista cuántas revisiones le quedan a cada proveedor en el turno actual.
 * Cada item: { proveedor_id, nombre, codigo, stars, level, color, origin,
 *              cuota, inspeccionados_hoy, restantes }
 */
export async function fetchPendientes() {
  return req('/PlanQA/pendientes');
}

/**
 * Pregunta al backend si un prepack (por su EPC) debe inspeccionarse o no.
 * El backend responde "REVISAR" o "PASA".
 */
export async function escanearPrepack(epc) {
  return req('/PlanQA/escanear', { method: 'POST', body: JSON.stringify({ epc }) });
}

/**
 * Catálogo de tipos de defecto con criticidad y penalización.
 * Permite que backend ajuste penalizaciones sin redesplegar el frontend.
 * Cada item: { id, nombre, criticidad, penalizacion, activo }
 */
export async function fetchCatalogoDefectos() {
  return req('/CatalogoDefecto/listar');
}

export async function fetchTurnoResumen() {
  return req('/Turno/resumen');
}

export async function fetchPerfilProveedor(id) {
  return req(`/Proveedor/${id}/perfil`);
}

/**
 * Registra una inspección QA (un siniestro reportado contra un prepack).
 *
 * Payload esperado:
 *   tag_epc, proveedor_id, operador_id, resultado ('APROBADO' | 'OBSERVADO' | 'RECHAZADO'),
 *   defectos (string[]), observacion, fecha (ISO string)
 */
export async function crearInspeccion(payload) {
  try {
    return await req('/InspeccionQA/crearInspeccion', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  } catch (err) {
    // Conserva el diagnóstico del payload que tenía la versión anterior.
    console.error('crearInspeccion payload:', payload);
    throw err;
  }
}
