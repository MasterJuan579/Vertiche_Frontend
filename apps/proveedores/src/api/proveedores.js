/**
 * Cliente fetch para el recurso "proveedores" del backend de Vertiche.
 *
 * La URL base se lee de VITE_API_URL (configurada en apps/web/.env).
 * Backend desplegado en EC2.
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export async function fetchProveedores() {
  const res = await fetch(`${API_URL}/Proveedor/listarProveedores`);
  if (!res.ok) {
    throw new Error(`Error ${res.status} al obtener proveedores`);
  }
  return res.json();
}

/**
 * Lista cuántas revisiones le quedan a cada proveedor en el turno actual.
 * Cada item: { proveedor_id, nombre, codigo, stars, level, color, origin,
 *              cuota, inspeccionados_hoy, restantes }
 */
export async function fetchPendientes() {
  const res = await fetch(`${API_URL}/PlanQA/pendientes`);
  if (!res.ok) {
    throw new Error(`Error ${res.status} al obtener pendientes`);
  }
  return res.json();
}

/**
 * Pregunta al backend si un prepack (por su EPC) debe inspeccionarse o no.
 * El backend responde "REVISAR" o "PASA". Aceptamos tanto la respuesta como
 * string crudo o como objeto envolvente para mantener flexibilidad.
 */
export async function escanearPrepack(epc) {
  const res = await fetch(`${API_URL}/PlanQA/escanear`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ epc }),
  });
  if (!res.ok) {
    let detail = '';
    try {
      const body = await res.text();
      detail = body ? ` — ${body}` : '';
    } catch {}
    console.error('escanearPrepack response:', res.status, detail);
    throw new Error(`Error ${res.status} al escanear prepack${detail}`);
  }
  return res.json();
}

/**
 * Catálogo de tipos de defecto con criticidad y penalización.
 * Permite que backend ajuste penalizaciones sin necesidad de redesplegar el frontend.
 * Cada item: { id, nombre, criticidad, penalizacion, activo }
 */
export async function fetchCatalogoDefectos() {
  const res = await fetch(`${API_URL}/CatalogoDefecto/listar`);
  if (!res.ok) {
    throw new Error(`Error ${res.status} al obtener catálogo de defectos`);
  }
  return res.json();
}

/**
 * Registra una inspección QA (un siniestro reportado contra un prepack).
 *
 * Payload esperado:
 *   tag_epc, proveedor_id, operador_id, resultado ('APROBADO' | 'OBSERVADO' | 'RECHAZADO'),
 *   defectos (string[]), observacion, fecha (ISO string)
 */
export async function crearInspeccion(payload) {
  const res = await fetch(`${API_URL}/InspeccionQA/crearInspeccion`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    // Intenta extraer el mensaje del backend para diagnosticar
    let detail = '';
    try {
      const body = await res.text();
      detail = body ? ` — ${body}` : '';
    } catch {
      // si no se puede leer el body, seguimos con el status nada más
    }
    console.error('crearInspeccion payload:', payload);
    console.error('crearInspeccion response:', res.status, detail);
    throw new Error(`Error ${res.status} al registrar inspección${detail}`);
  }
  return res.json();
}
