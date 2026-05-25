/**
 * Garment size table builder. Given a list of garment entries (each with
 * { color, talla }), produces a normalized table:
 *
 *   {
 *     colores:  ['Azul', 'Blanco'],
 *     tallas:   ['S', 'M', 'L'],         // sorted by the canonical order below
 *     conteo:   (color, talla) => count,
 *     totColor: color => total per color,
 *     totTalla: talla => total per size,
 *     gran:     grand total
 *   }
 *
 * Used by PrepackDetailBar (horizontal layout) and PrepackDetailPanel
 * (vertical layout). Previously duplicated across three components.
 */

const ORDEN_TALLAS = [
  'XS', 'S', 'CH', 'M', 'G', 'L', 'XL', 'XXL',
  '25', '27', '28', '29', '30', '31', '32', '34', '36',
];

export function buildTabla(prendas) {
  const colores = [...new Set(prendas.map((p) => p.color))].sort();
  const tallas = [...new Set(prendas.map((p) => p.talla))].sort((a, b) => {
    const ia = ORDEN_TALLAS.indexOf(a);
    const ib = ORDEN_TALLAS.indexOf(b);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });
  const conteo   = (c, t) => prendas.filter((p) => p.color === c && p.talla === t).length;
  const totColor = (c) => prendas.filter((p) => p.color === c).length;
  const totTalla = (t) => prendas.filter((p) => p.talla === t).length;
  return { colores, tallas, conteo, totColor, totTalla, gran: prendas.length };
}
