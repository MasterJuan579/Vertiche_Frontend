// rfid/src/services/realApi.js
// Cliente HTTP centralizado. Propaga errores con mensaje real del backend.

// Prioridad de variables: VITE_API_URL es la que usan los demás módulos del
// monorepo (shell, sorter, dashboard, design-system). VITE_API_BASE_URL queda
// como alias por compatibilidad con .env locales existentes.
const API_BASE =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:8080';

/**
 * Lee el token guardado por @vertiche/design-system (auth.jsx) en sessionStorage.
 * Cuando Cognito esté activo en backend, este header ya viaja automáticamente.
 */
function authHeader() {
  try {
    const raw = sessionStorage.getItem('vertiche.auth');
    if (!raw) return {};
    const { token } = JSON.parse(raw);
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

/**
 * Helper único de fetch.
 * - Pone Content-Type y Authorization.
 * - Si la respuesta no es 2xx, intenta leer JSON del backend y lanza Error con su `message` o `error`.
 * - 404 en GET por id devuelve null en vez de lanzar (para distinguir "no encontrado" de "error de red").
 */
async function request(path, opts = {}) {
  const { method = 'GET', body, allowNotFound = false, ...rest } = opts;
  const headers = {
    'Accept': 'application/json',
    ...(body ? { 'Content-Type': 'application/json' } : {}),
    ...authHeader(),
    ...(opts.headers || {}),
  };

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      ...rest,
    });
  } catch (networkErr) {
    throw new Error(`Sin conexión con el backend (${API_BASE}). ${networkErr.message}`);
  }

  if (res.status === 404 && allowNotFound) return null;

  const text = await res.text();
  const data = text ? safeParseJson(text) : null;

  if (!res.ok) {
    const message =
      (data && (data.message || data.error)) ||
      `HTTP ${res.status} ${res.statusText}`;
    const err = new Error(message);
    err.status = res.status;
    err.code = data?.error;
    err.detalle = data?.detalle;
    throw err;
  }

  return data;
}

function safeParseJson(text) {
  try { return JSON.parse(text); } catch { return text; }
}

export const realApi = {
  // ============================================
  // ÓRDENES DE COMPRA
  // ============================================
  getOrdenesCompra() {
    return request('/OrdenCompra/listarOrdenes');
  },

  // ============================================
  // LECTURAS RFID (EventoLectura)
  // ============================================
  getLecturas() {
    return request('/EventoLectura/listarLecturas');
  },

  // ============================================
  // ANOMALÍAS
  // ============================================
  getAnomalias({ soloAbiertas = true } = {}) {
    const qs = soloAbiertas ? '?resuelto=false' : '';
    return request(`/Anomalia/listarAnomalias${qs}`);
  },

  resolverAnomalia(id) {
    return request(`/Anomalia/${id}/resolver`, { method: 'PATCH' });
  },

  // ============================================
  // TAGS (PREPACKS)
  // ============================================
  getTags() {
    return request('/Tag/listarTags');
  },

  getTagsRecientes(limit = 10) {
    return request(`/Tag/listarTags?limit=${limit}&order=registrado_en:desc`);
  },

  crearTag(tagData) {
    return request('/Tag/crearTag', { method: 'POST', body: tagData });
  },

  getTagByEpc(epc) {
    return request(`/Tag/${encodeURIComponent(epc)}`, { allowNotFound: true });
  },

  buscarTagsPorSku(sku) {
    return request(`/Tag/buscarSku/${encodeURIComponent(sku)}`);
  },

  // ============================================
  // TIENDAS Y PROVEEDORES
  // ============================================
  getTiendas() {
    return request('/Tienda/listarTiendas');
  },

  getProveedores() {
    return request('/Proveedor/listarProveedores');
  },

  // ============================================
  // PALETS (para asociar tags a OC en Vinculación)
  // ============================================
  getPalets() {
    return request('/Palet/listarPalets');
  },

  // ============================================
  // CREAR OC completa: Pedido + OC + N Palets + M DetalleOrden + Tags placeholder
  // (endpoint del módulo RFID)
  // ============================================
  crearOrdenCompra({ proveedor_id, nombre_producto, modelo, numero_palets, detalles, agruparOC = false }) {
    return request('/rfid/orden-compra', {
      method: 'POST',
      body: { proveedor_id, nombre_producto, modelo, numero_palets, detalles, agruparOC },
    });
  },

  // Lista de prepacks (pendientes + asignados) de una OC.
  getPrepacksDeOrden(orden_id) {
    return request(`/rfid/orden/${encodeURIComponent(orden_id)}/prepacks`);
  },

  // Asigna el EPC real a un prepack placeholder.
  asignarEpc({ epc_placeholder, epc_real }) {
    return request('/rfid/asignar-epc', {
      method: 'POST',
      body: { epc_placeholder, epc_real },
    });
  },

  // ============================================
  // CHIP MAESTRO (OrdenAgrupador) — opcional por OC
  // ============================================
  // Si la OC se creo sin el flag agruparOC, este endpoint permite activarlo
  // despues. Bloqueado por el backend si hay tags fuera de REGISTRADO.
  crearAgrupador(orden_id) {
    return request('/rfid/orden-agrupador', {
      method: 'POST',
      body: { orden_id },
    });
  },

  // Asigna el EPC real del chip maestro tras escanearlo en el lector de registro.
  asignarEpcAgrupador({ orden_id, epc_real }) {
    return request('/rfid/asignar-epc-agrupador', {
      method: 'POST',
      body: { orden_id, epc_real },
    });
  },

  // Devuelve el agrupador de una OC (o null) + total_prepacks.
  getAgrupador(orden_id) {
    return request(`/rfid/orden/${encodeURIComponent(orden_id)}/agrupador`);
  },

  // Elimina el agrupador (util para corregir si se equivoca el supervisor).
  deleteAgrupador(orden_id) {
    return request(`/rfid/orden-agrupador/${encodeURIComponent(orden_id)}`, {
      method: 'DELETE',
    });
  },

  // ============================================
  // ÓRDENES DE COMPRA listar (atajo a OrdenCompra/listarOrdenes)
  // ============================================
  getOrdenes() {
    return request('/OrdenCompra/listarOrdenes');
  },

  // ============================================
  // KPI del CEDIS para la barra superior de FlujoCEDIS
  // ============================================
  getKpi() {
    return request('/rfid/kpi');
  },
};
