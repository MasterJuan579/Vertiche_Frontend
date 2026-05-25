/**
 * Builds a color×size matrix table from a prepack's garment list.
 *
 * Returns:
 *   {
 *     colores:  ['Azul', 'Blanco'],
 *     tallas:   ['S', 'M', 'L'],       // sorted by canonical order
 *     conteo:   (color, talla) => count,
 *     totColor: color => total per color,
 *     totTalla: talla => total per size,
 *     gran:     grand total,
 *   }
 *
 * Used by ModalOC (per-prepack tables) and Trazabilidad (prepack detail).
 */

const ORDEN_TALLAS = [
  'XS', 'S', 'CH', 'M', 'G', 'L', 'XL', 'XXL',
  '25', '27', '28', '29', '30', '31', '32', '34', '36',
];

export function buildTablaPrepack(tag) {
  const prendas = tag?.prendas;

  if (prendas && prendas.length > 0) {
    const colores = [...new Set(prendas.map((p) => p.color))].sort();
    const tallas = [...new Set(prendas.map((p) => p.talla))].sort((a, b) => {
      const ia = ORDEN_TALLAS.indexOf(a);
      const ib = ORDEN_TALLAS.indexOf(b);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });
    return {
      colores,
      tallas,
      conteo: (c, t) => prendas.filter((p) => p.color === c && p.talla === t).length,
      totColor: (c) => prendas.filter((p) => p.color === c).length,
      totTalla: (t) => prendas.filter((p) => p.talla === t).length,
      gran: prendas.length,
    };
  }

  // Fallback for prepacks without per-garment detail.
  const piezas = tag?.cantidad_piezas || 1;
  return {
    colores: [tag?.color || '—'],
    tallas: [tag?.talla || '—'],
    conteo: (c, t) => (c === tag?.color && t === tag?.talla) ? piezas : 0,
    totColor: (c) => c === tag?.color ? piezas : 0,
    totTalla: (t) => t === tag?.talla ? piezas : 0,
    gran: piezas,
  };
}
