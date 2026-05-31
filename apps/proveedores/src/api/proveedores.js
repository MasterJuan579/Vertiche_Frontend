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
