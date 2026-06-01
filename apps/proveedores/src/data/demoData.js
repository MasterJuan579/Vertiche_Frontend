/**
 * Local fixtures for the proveedores (QA inspector) module.
 *
 * Kept here rather than in @vertiche/mock-data because these structures —
 * defect types, cargo scenarios, EPC pools — are specific to the QA workflow
 * and don't make sense for the other three modules.
 *
 * Supplier IDs and PO numbers are aligned with rfid/FlujoCEDIS so that when
 * the backend is wired, the same PROV-001 / OC-018 referenced here matches
 * the seed data on the backend.
 */

export const SUPPLIERS_INITIAL = [
  { id: 1, codigo: 'PROV-001', name: 'Textiles Monterrey SA',  stars: 4.8, level: 'ELITE', color: 'ba', origin: 'Monterrey, NL' },
  { id: 2, codigo: 'PROV-002', name: 'Confecciones del Norte', stars: 4.2, level: 'MEDIA', color: 'bb', origin: 'Monterrey, NL' },
  { id: 3, codigo: 'PROV-003', name: 'Moda Express MX',        stars: 4.5, level: 'ELITE', color: 'ba', origin: 'Guadalajara, JAL' },
  { id: 4, codigo: 'PROV-004', name: 'ActiveWear CDMX',        stars: 4.6, level: 'ELITE', color: 'ba', origin: 'CDMX' },
  { id: 5, codigo: 'PROV-005', name: 'Diseños Guadalajara',    stars: 3.8, level: 'MEDIA', color: 'bb', origin: 'Guadalajara, JAL' },
  { id: 6, codigo: 'PROV-006', name: 'Estampados MX',          stars: 2.1, level: 'BAJA',  color: 'bc', origin: 'Puebla, PUE' },
  { id: 7, codigo: 'PROV-007', name: 'Urban Trends MX',        stars: 1.9, level: 'BAJA',  color: 'bc', origin: 'León, GTO' },
];

export const SUPPLIER_PROFILES = {
  1: {
    rfc: 'TMO920314AB1', contact: 'Carlos Mendez', phone: '+52 81 2244 5566', email: 'cmendez@textilesmty.mx',
    address: 'Blvd. Díaz Ordaz 1200, Monterrey NL', category: 'Playera / Polo / Camiseta',
    since: '2019-03', paymentTerms: 'Net 30', deliveries: 142, approval: 98, defects: 2, leadtime: 3,
    sparkData: [4, 4, 5, 5, 4, 5, 5, 4, 5, 5, 5, 5],
    history: [
      { date: '10/04/2026', po: 'OC-006', desc: 'Polo Piqué Hombre · 2 prepacks',          result: 'warn', note: '1 prepack con costura floja' },
      { date: '05/04/2026', po: 'OC-011', desc: 'Camiseta Básica Pack · 2 prepacks',       result: 'warn', note: '1 rechazado en QA' },
      { date: '28/03/2026', po: 'OC-018', desc: 'Playera Básica Premium · 3 prepacks',     result: 'ok',   note: 'Sin defectos' },
      { date: '14/03/2026', po: 'OC-001', desc: 'Playera Básica Manga Corta · 3 prepacks', result: 'ok',   note: 'Entrega adelantada' },
    ],
  },
  2: {
    rfc: 'CDN881122XY2', contact: 'Ana Torres', phone: '+52 81 3300 7788', email: 'atorres@confnorte.mx',
    address: 'Av. Gonzalitos 450, Monterrey NL', category: 'Pantalón / Jeans',
    since: '2020-05', paymentTerms: 'Net 45', deliveries: 98, approval: 93, defects: 8, leadtime: 4,
    sparkData: [4, 4, 4, 3, 4, 4, 4, 4, 4, 4, 4, 4],
    history: [
      { date: '09/04/2026', po: 'OC-019', desc: 'Pantalón Vestir Slim · 2 prepacks',       result: 'warn', note: 'Anomalía en auditoría' },
      { date: '30/03/2026', po: 'OC-009', desc: 'Pantalón Chino Slim Fit · 2 prepacks',    result: 'ok',   note: 'OK' },
      { date: '20/03/2026', po: 'OC-002', desc: 'Pantalón Cargo Denim Slim · 2 prepacks',  result: 'warn', note: '1 faltante en OC' },
    ],
  },
  3: {
    rfc: 'MEX210218MN3', contact: 'Luis Vargas', phone: '+52 33 4411 2200', email: 'lvargas@modaexpress.mx',
    address: 'Av. Vallarta 5500, Zapopan JAL', category: 'Blusa / Falda',
    since: '2021-02', paymentTerms: 'Net 30', deliveries: 76, approval: 96, defects: 4, leadtime: 3,
    sparkData: [4, 4, 4, 4, 5, 4, 5, 4, 5, 5, 4, 5],
    history: [
      { date: '08/04/2026', po: 'OC-020', desc: 'Blusa Casual Rayas · 2 prepacks',         result: 'ok', note: 'OK' },
      { date: '30/03/2026', po: 'OC-012', desc: 'Blusa Campesina Bordada · 3 prepacks',    result: 'ok', note: 'Sin observaciones' },
      { date: '15/03/2026', po: 'OC-003', desc: 'Blusa Fluida Manga Larga · 2 prepacks',   result: 'ok', note: 'Entrega en tiempo' },
    ],
  },
  4: {
    rfc: 'AWC180722BC4', contact: 'Patricia Soto', phone: '+52 55 1133 4455', email: 'psoto@activewearcdmx.mx',
    address: 'Eje Central 780, CDMX', category: 'Deportivo / Athletic',
    since: '2018-07', paymentTerms: 'Net 30', deliveries: 128, approval: 97, defects: 5, leadtime: 3,
    sparkData: [4, 4, 5, 5, 4, 5, 5, 5, 4, 5, 5, 5],
    history: [
      { date: '12/04/2026', po: 'OC-022', desc: 'Pantalón Jogger Tech · 3 prepacks',       result: 'ok', note: 'Óptimo' },
      { date: '30/03/2026', po: 'OC-025', desc: 'Short Gym Hombre · 2 prepacks',           result: 'ok', note: 'OK' },
      { date: '15/03/2026', po: 'OC-014', desc: 'Playera Polo Sport · 2 prepacks',         result: 'ok', note: 'Adelantado 1 día' },
      { date: '25/02/2026', po: 'OC-007', desc: 'Short Deportivo Running · 2 prepacks',    result: 'ok', note: 'OK' },
    ],
  },
  5: {
    rfc: 'DGD220905DE5', contact: 'Roberto Jiménez', phone: '+52 33 7722 8899', email: 'rjimenez@disenosgdl.mx',
    address: 'Av. López Mateos 1500, Guadalajara JAL', category: 'Vestido / Jeans mujer',
    since: '2022-09', paymentTerms: 'Net 45', deliveries: 54, approval: 89, defects: 12, leadtime: 5,
    sparkData: [4, 4, 3, 4, 3, 4, 4, 3, 4, 4, 3, 4],
    history: [
      { date: '14/04/2026', po: 'OC-023', desc: 'Vestido Formal Noche · 2 prepacks',       result: 'ok',   note: 'Sin defectos' },
      { date: '01/04/2026', po: 'OC-013', desc: 'Jean Skinny Mujer · 2 prepacks',          result: 'warn', note: 'Talla inconsistente' },
      { date: '20/03/2026', po: 'OC-005', desc: 'Vestido Casual Verano · 3 prepacks',      result: 'warn', note: 'Color fuera de spec' },
      { date: '05/03/2026', po: 'OC-016', desc: 'Falda Midi Plisada · 2 prepacks',         result: 'ok',   note: 'OK' },
    ],
  },
  6: {
    rfc: 'EMX240201FF6', contact: 'Diana Torres', phone: '+52 22 5544 3322', email: 'dtorres@estampadosmx.com',
    address: 'Av. Juárez 2200, Puebla PUE', category: 'Playera estampada / Shorts',
    since: '2024-02', paymentTerms: 'Net 60', deliveries: 28, approval: 72, defects: 24, leadtime: 7,
    sparkData: [3, 2, 3, 2, 2, 2, 2, 1, 2, 2, 2, 2],
    history: [
      { date: '07/04/2026', po: 'OC-015', desc: 'Shorts Playa Tropical · 3 prepacks',          result: 'warn', note: 'Estampado desalineado' },
      { date: '25/03/2026', po: 'OC-008', desc: 'Playera Estampada Temporada · 3 prepacks',    result: 'fail', note: 'Color incorrecto' },
      { date: '10/03/2026', po: 'OC-015', desc: 'Shorts Playa · 3 prepacks',                   result: 'warn', note: 'Revisión manual' },
      { date: '20/02/2026', po: 'OC-008', desc: 'Playera Estampada · 3 prepacks',              result: 'fail', note: 'Estampado incompleto' },
    ],
  },
  7: {
    rfc: 'UTM250110GH7', contact: 'Miguel Herrera', phone: '+52 47 3322 1100', email: 'mherrera@urbantrends.mx',
    address: 'Blvd. Aeropuerto 980, León GTO', category: 'Sudadera / Chamarra urbana',
    since: '2025-01', paymentTerms: 'Net 60', deliveries: 15, approval: 62, defects: 38, leadtime: 9,
    sparkData: [3, 2, 2, 1, 2, 2, 1, 2, 2, 1, 2, 2],
    history: [
      { date: '06/04/2026', po: 'OC-021', desc: 'Sudadera Crew Neck · 2 prepacks',         result: 'fail', note: 'Costuras abiertas' },
      { date: '22/03/2026', po: 'OC-010', desc: 'Sudadera Hoodie Oversize · 2 prepacks',   result: 'fail', note: 'Tela delgada' },
      { date: '08/03/2026', po: 'OC-017', desc: 'Chamarra Denim Oversize · 2 prepacks',    result: 'warn', note: 'Cierre defectuoso' },
      { date: '18/02/2026', po: 'OC-010', desc: 'Sudadera Hoodie · 2 prepacks',            result: 'fail', note: 'Color fuera de spec' },
    ],
  },
};

// Catálogo de productos — coincide con los nombres de las OCs del RFID
export const PRODUCT_CATALOG = [
  { id: 'playera-basica',    name: 'Playera Básica Manga Corta', colors: ['Azul', 'Negro', 'Blanco', 'Rojo'] },
  { id: 'pantalon-cargo',    name: 'Pantalón Cargo Denim Slim',  colors: ['Azul', 'Negro', 'Café'] },
  { id: 'blusa-fluida',      name: 'Blusa Fluida Manga Larga',   colors: ['Blanco', 'Rosa', 'Azul'] },
  { id: 'chamarra-sport',    name: 'Chamarra Impermeable Sport', colors: ['Negro', 'Gris', 'Azul'] },
  { id: 'vestido-casual',    name: 'Vestido Casual Verano',      colors: ['Verde', 'Amarillo', 'Azul', 'Blanco', 'Rosa'] },
  { id: 'polo-pique',        name: 'Polo Piqué Hombre',          colors: ['Azul', 'Blanco', 'Negro'] },
  { id: 'short-running',     name: 'Short Deportivo Running',    colors: ['Negro', 'Azul', 'Rojo'] },
  { id: 'playera-estampada', name: 'Playera Estampada Temporada', colors: ['Blanco', 'Gris', 'Verde', 'Azul', 'Rojo'] },
  { id: 'pantalon-chino',    name: 'Pantalón Chino Slim Fit',    colors: ['Beige', 'Verde', 'Azul', 'Café'] },
  { id: 'sudadera-hoodie',   name: 'Sudadera Hoodie Oversize',   colors: ['Negro', 'Gris', 'Azul', 'Blanco'] },
  { id: 'camiseta-basica',   name: 'Camiseta Básica Pack',       colors: ['Blanco', 'Negro', 'Gris'] },
  { id: 'blusa-campesina',   name: 'Blusa Campesina Bordada',    colors: ['Blanco', 'Rosa', 'Azul', 'Verde'] },
  { id: 'jean-skinny',       name: 'Jean Skinny Mujer',          colors: ['Azul Oscuro', 'Negro', 'Gris'] },
  { id: 'polo-sport',        name: 'Playera Polo Sport',         colors: ['Blanco', 'Azul', 'Negro', 'Gris'] },
  { id: 'shorts-playa',      name: 'Shorts Playa Tropical',      colors: ['Azul', 'Verde', 'Naranja', 'Rojo', 'Blanco'] },
  { id: 'falda-midi',        name: 'Falda Midi Plisada',         colors: ['Rosa', 'Beige', 'Negro'] },
  { id: 'chamarra-denim',    name: 'Chamarra Denim Oversize',    colors: ['Azul', 'Negro', 'Blanco', 'Gris'] },
  { id: 'playera-premium',   name: 'Playera Básica Premium',     colors: ['Blanco', 'Negro', 'Gris', 'Azul'] },
  { id: 'pantalon-vestir',   name: 'Pantalón Vestir Slim',       colors: ['Negro', 'Gris', 'Azul'] },
  { id: 'blusa-rayas',       name: 'Blusa Casual Rayas',         colors: ['Azul', 'Rojo', 'Blanco'] },
  { id: 'sudadera-crew',     name: 'Sudadera Crew Neck Básica',  colors: ['Gris', 'Negro', 'Azul'] },
  { id: 'jogger-tech',       name: 'Pantalón Jogger Tech',       colors: ['Negro', 'Gris', 'Azul', 'Verde'] },
  { id: 'vestido-formal',    name: 'Vestido Formal Noche',       colors: ['Negro', 'Rojo', 'Azul Marino'] },
  { id: 'short-gym',         name: 'Short Gym Hombre',           colors: ['Negro', 'Azul', 'Gris'] },
];

// Escenarios de carga — cada uno es una OC real del demo RFID
export const CARGO_SCENARIOS = [
  // Proveedor Elite: Textiles Monterrey (OC-018)
  { supplierId: 1, po: 'OC-018', qty: 3, composition: [
    { productId: 'playera-premium', color: 'Blanco', talla: 'S', qty: 1 },
    { productId: 'playera-premium', color: 'Blanco', talla: 'M', qty: 1 },
    { productId: 'playera-premium', color: 'Negro',  talla: 'L', qty: 1 },
  ]},
  // Moda Express: Blusa Campesina (OC-012)
  { supplierId: 3, po: 'OC-012', qty: 3, composition: [
    { productId: 'blusa-campesina', color: 'Blanco', talla: 'S', qty: 1 },
    { productId: 'blusa-campesina', color: 'Rosa',   talla: 'M', qty: 1 },
    { productId: 'blusa-campesina', color: 'Azul',   talla: 'M', qty: 1 },
  ]},
  // ActiveWear CDMX: Jogger Tech (OC-022)
  { supplierId: 4, po: 'OC-022', qty: 3, composition: [
    { productId: 'jogger-tech', color: 'Negro', talla: 'S', qty: 1 },
    { productId: 'jogger-tech', color: 'Gris',  talla: 'L', qty: 1 },
    { productId: 'jogger-tech', color: 'Azul',  talla: 'M', qty: 1 },
  ]},
  // Diseños Guadalajara: Vestido Casual (OC-005)
  { supplierId: 5, po: 'OC-005', qty: 3, composition: [
    { productId: 'vestido-casual', color: 'Verde',    talla: 'S', qty: 1 },
    { productId: 'vestido-casual', color: 'Amarillo', talla: 'M', qty: 1 },
    { productId: 'vestido-casual', color: 'Azul',     talla: 'M', qty: 1 },
  ]},
  // Estampados MX (baja): Playera Estampada (OC-008)
  { supplierId: 6, po: 'OC-008', qty: 3, composition: [
    { productId: 'playera-estampada', color: 'Blanco', talla: 'S', qty: 1 },
    { productId: 'playera-estampada', color: 'Gris',   talla: 'L', qty: 1 },
    { productId: 'playera-estampada', color: 'Verde',  talla: 'S', qty: 1 },
  ]},
  // Confecciones del Norte: Pantalón Chino (OC-009)
  { supplierId: 2, po: 'OC-009', qty: 2, composition: [
    { productId: 'pantalon-chino', color: 'Beige', talla: '30', qty: 1 },
    { productId: 'pantalon-chino', color: 'Azul',  talla: '32', qty: 1 },
  ]},
  // Urban Trends MX (baja): Sudadera Hoodie (OC-010)
  { supplierId: 7, po: 'OC-010', qty: 2, composition: [
    { productId: 'sudadera-hoodie', color: 'Negro', talla: 'S',  qty: 1 },
    { productId: 'sudadera-hoodie', color: 'Azul',  talla: 'XL', qty: 1 },
  ]},
];

// Tipos de defecto para el flujo de siniestro
export const DEFECT_TYPES = [
  { cat: 'Mala calidad en la tela', icon: '🧵' },
  { cat: 'Ruptura o rasgadura',     icon: '✂️' },
  { cat: 'Mancha o suciedad',       icon: '🟤' },
  { cat: 'Costura defectuosa',      icon: '🪡' },
  { cat: 'Etiqueta incorrecta',     icon: '🏷️' },
  { cat: 'Cantidad faltante',       icon: '📉' },
  { cat: 'SKU equivocado',          icon: '🔢' },
  { cat: 'Otro (especificar)',      icon: '✏️' },
];

// EPCs reales seedeados en la tabla Tag del backend (DEV).
// Se eligen de aquí en orden secuencial cuando el inspector simula una
// lectura RFID, por lo que cada uno debe existir como fila en `Tag.epc`
// para que la FK de InspeccionQA.tag_epc resuelva sin romper.
export const MOCK_EPCS = [
  'E2801160200000000000A001',
  'E2801160200000000000A002',
  'E2801160200000000000A003',
  'E2801160200000000000A004',
  'E2801160200000000000A005',
  'E2801160200000000000B001',
  'E2801160200000000000B002',
  'E2801160200000000000B003',
  'E2801160200000000000B004',
  'E2801160200000000000C003',
  'E2801160200000000000D001',
  'E2801160200000000000D002',
  'E2801160200000000000D003',
  'E2801160200000000000D004',
  'E2801160200000000000D005',
  'E2801160200000000000E001',
  'E2801160200000000000E002',
  'E2801160200000000000E003',
  'E2801160200000000000F001',
];

/**
 * Cuántos prepacks revisar según rating y cantidad total.
 *   Elite (≥4.5): 34% (mínimo 1, máximo qty)
 *   Media (≥2.5): 67%
 *   Baja  (>0):   100%
 *   Nuevo (=0):   50%
 */
export function calcSampleSize(stars, qty) {
  const pct = stars >= 4.5 ? 0.34 : stars >= 2.5 ? 0.67 : stars > 0 ? 1 : 0.5;
  return Math.max(1, Math.min(qty, Math.ceil(qty * pct)));
}

export function sampleHint(stars) {
  if (stars >= 4.5) return 'Muestreo 34% (1 de 3) · reputación ELITE · inspección rápida';
  if (stars >= 2.5) return 'Muestreo 67% (2 de 3) · reputación MEDIA · inspección normal';
  if (stars > 0)    return 'Muestreo 100% · reputación BAJA · inspección reforzada';
  return 'Muestreo 50% · proveedor sin historial (nuevo)';
}

export function accionSistema(stars) {
  if (stars >= 4.5) return { label: 'FLUJO LIBRE',      hint: 'Muestreo 34% · Inspección rápida sin retención', cls: 'elite' };
  if (stars >= 2.5) return { label: 'STOP ALEATORIO',   hint: 'Muestreo 67% · Retención preventiva',            cls: 'media' };
  if (stars > 0)    return { label: 'STOP OBLIGATORIO', hint: 'Inspección 100% manual · Riesgo alto',           cls: 'baja'  };
  return              { label: 'PROVEEDOR NUEVO',       hint: 'Período de evaluación · 50% inspección',         cls: 'nuevo' };
}

// Mapa de colores (alineado con rfid y sorter)
export const COLOR_MAP = {
  blanco: '#f8fafc', negro: '#1e293b', azul: '#3b82f6', rosa: '#ec4899',
  rojo: '#ef4444', gris: '#94a3b8', 'café': '#92400e', cafe: '#92400e',
  beige: '#d4b896', naranja: '#f97316', verde: '#22c55e',
  amarillo: '#eab308', morado: '#a855f7', violeta: '#8b5cf6',
  'azul oscuro': '#1e3a8a', 'azul marino': '#1e3a8a',
};
