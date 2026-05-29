/**
 * Vertiche SortFlow — Shared Mock Data
 *
 * All entities follow the actual backend schema (Proveedor, OrdenCompra, Pedido,
 * Palet, Tag, Tienda, Caja, InspeccionQA, Anomalia, PaletEtapaLog, EventoLectura).
 * Field names and enums match the Sequelize models exactly.
 *
 * Used by all four module apps so the data feels consistent across the system.
 */

// ─────────────────────────────────────────────────────────────
// ETAPAS — official 7-stage RFID flow
// ─────────────────────────────────────────────────────────────

export const ETAPAS = [
  'PREREGISTRO',
  'QA',
  'REGISTRO',
  'SORTER',
  'BAHIA',
  'AUDITORIA',
  'ENVIO',
];

export const ETAPA_COLORS = {
  PREREGISTRO: '#94A3B8',
  QA: '#A16207',
  REGISTRO: '#0F766E',
  SORTER: '#7C3AED',
  BAHIA: '#1E40AF',
  AUDITORIA: '#C2410C',
  ENVIO: '#15803D',
};

// ─────────────────────────────────────────────────────────────
// PROVEEDORES — 7 suppliers with rating, performance
// ─────────────────────────────────────────────────────────────

export const proveedores = [
  {
    id: 1,
    nombre: 'Textiles del Bajío',
    codigo: 'TXB-001',
    contacto: 'María Hernández',
    email: 'maria@textilesbajio.mx',
    rating: 4.8,
    nivel: 'PREFERENTE',
    total_recibido: 4820,
    tasa_qa_aprobado: 98.4,
    tasa_anomalia: 0.6,
    tiempo_respuesta_dias: 2.1,
    color: '#1E40AF',
  },
  {
    id: 2,
    nombre: 'Confecciones del Norte',
    codigo: 'CNF-002',
    contacto: 'Roberto Ávila',
    email: 'r.avila@confeccionesnorte.com',
    rating: 4.5,
    nivel: 'PREFERENTE',
    total_recibido: 3210,
    tasa_qa_aprobado: 96.1,
    tasa_anomalia: 1.4,
    tiempo_respuesta_dias: 3.0,
    color: '#0F766E',
  },
  {
    id: 3,
    nombre: 'Manufacturas Querétaro',
    codigo: 'MQR-003',
    contacto: 'Lucía Vega',
    email: 'lvega@mqro.com.mx',
    rating: 4.2,
    nivel: 'REGULAR',
    total_recibido: 2890,
    tasa_qa_aprobado: 93.7,
    tasa_anomalia: 2.8,
    tiempo_respuesta_dias: 3.4,
    color: '#7C3AED',
  },
  {
    id: 4,
    nombre: 'Maquilas del Pacífico',
    codigo: 'MPC-004',
    contacto: 'Carlos Salas',
    email: 'c.salas@maquilaspacifico.mx',
    rating: 3.9,
    nivel: 'REGULAR',
    total_recibido: 1980,
    tasa_qa_aprobado: 91.0,
    tasa_anomalia: 4.2,
    tiempo_respuesta_dias: 4.1,
    color: '#C2410C',
  },
  {
    id: 5,
    nombre: 'Hilos Industriales SA',
    codigo: 'HIN-005',
    contacto: 'Diana Romo',
    email: 'diana@hilosindustriales.mx',
    rating: 4.6,
    nivel: 'PREFERENTE',
    total_recibido: 3540,
    tasa_qa_aprobado: 97.2,
    tasa_anomalia: 1.0,
    tiempo_respuesta_dias: 2.5,
    color: '#A16207',
  },
  {
    id: 6,
    nombre: 'Textiles Reynosa',
    codigo: 'TXR-006',
    contacto: 'Adrián Cantú',
    email: 'a.cantu@textilesreynosa.mx',
    rating: 3.4,
    nivel: 'OBSERVACION',
    total_recibido: 1340,
    tasa_qa_aprobado: 86.5,
    tasa_anomalia: 7.8,
    tiempo_respuesta_dias: 5.3,
    color: '#B91C1C',
  },
  {
    id: 7,
    nombre: 'Diseños Mexicanos',
    codigo: 'DMX-007',
    contacto: 'Patricia Núñez',
    email: 'p.nunez@disenosmx.com',
    rating: 4.7,
    nivel: 'PREFERENTE',
    total_recibido: 4120,
    tasa_qa_aprobado: 97.9,
    tasa_anomalia: 0.8,
    tiempo_respuesta_dias: 2.0,
    color: '#15803D',
  },
];

// ─────────────────────────────────────────────────────────────
// TIENDAS — 20 destination stores
// ─────────────────────────────────────────────────────────────

export const tiendas = [
  { tienda_id: 'CDMX-POL', nombre: 'CDMX Polanco', ciudad: 'CDMX', region: 'Centro', bahia_asignada: 'B1', estado_rep: 'NORMAL' },
  { tienda_id: 'CDMX-INS', nombre: 'CDMX Insurgentes', ciudad: 'CDMX', region: 'Centro', bahia_asignada: 'B2', estado_rep: 'NORMAL' },
  { tienda_id: 'CDMX-SAN', nombre: 'CDMX Santa Fe', ciudad: 'CDMX', region: 'Centro', bahia_asignada: 'B3', estado_rep: 'NORMAL' },
  { tienda_id: 'MTY-CTR', nombre: 'Monterrey Centro', ciudad: 'Monterrey', region: 'Norte', bahia_asignada: 'B4', estado_rep: 'NORMAL' },
  { tienda_id: 'MTY-SP', nombre: 'San Pedro Garza', ciudad: 'Monterrey', region: 'Norte', bahia_asignada: 'B5', estado_rep: 'NORMAL' },
  { tienda_id: 'GDL-PRV', nombre: 'GDL Providencia', ciudad: 'Guadalajara', region: 'Bajío', bahia_asignada: 'B6', estado_rep: 'ALERTA' },
  { tienda_id: 'GDL-AND', nombre: 'GDL Andares', ciudad: 'Guadalajara', region: 'Bajío', bahia_asignada: 'B7', estado_rep: 'NORMAL' },
  { tienda_id: 'PUE-CTR', nombre: 'Puebla Centro', ciudad: 'Puebla', region: 'Centro', bahia_asignada: 'B8', estado_rep: 'NORMAL' },
  { tienda_id: 'QRO-ANT', nombre: 'Querétaro Antea', ciudad: 'Querétaro', region: 'Bajío', bahia_asignada: 'B1', estado_rep: 'NORMAL' },
  { tienda_id: 'LEN-CTR', nombre: 'León Centro Max', ciudad: 'León', region: 'Bajío', bahia_asignada: 'B2', estado_rep: 'NORMAL' },
  { tienda_id: 'TIJ-NTE', nombre: 'Tijuana Norte', ciudad: 'Tijuana', region: 'Norte', bahia_asignada: 'B3', estado_rep: 'NORMAL' },
  { tienda_id: 'CUN-MAL', nombre: 'Cancún Malecón', ciudad: 'Cancún', region: 'Sureste', bahia_asignada: 'B4', estado_rep: 'NORMAL' },
  { tienda_id: 'MER-GAL', nombre: 'Mérida Galerías', ciudad: 'Mérida', region: 'Sureste', bahia_asignada: 'B5', estado_rep: 'NORMAL' },
  { tienda_id: 'SLP-CTR', nombre: 'San Luis Potosí', ciudad: 'SLP', region: 'Centro', bahia_asignada: 'B6', estado_rep: 'NORMAL' },
  { tienda_id: 'AGS-CTR', nombre: 'Aguascalientes', ciudad: 'Aguascalientes', region: 'Bajío', bahia_asignada: 'B7', estado_rep: 'NORMAL' },
  { tienda_id: 'TOL-MET', nombre: 'Toluca Metepec', ciudad: 'Toluca', region: 'Centro', bahia_asignada: 'B8', estado_rep: 'NORMAL' },
  { tienda_id: 'VRZ-PTO', nombre: 'Veracruz Puerto', ciudad: 'Veracruz', region: 'Sureste', bahia_asignada: 'B1', estado_rep: 'NORMAL' },
  { tienda_id: 'CHI-CTR', nombre: 'Chihuahua Centro', ciudad: 'Chihuahua', region: 'Norte', bahia_asignada: 'B2', estado_rep: 'NORMAL' },
  { tienda_id: 'HER-CTR', nombre: 'Hermosillo Centro', ciudad: 'Hermosillo', region: 'Norte', bahia_asignada: 'B3', estado_rep: 'NORMAL' },
  { tienda_id: 'OAX-CTR', nombre: 'Oaxaca Centro', ciudad: 'Oaxaca', region: 'Sureste', bahia_asignada: 'B4', estado_rep: 'NORMAL' },
];

// ─────────────────────────────────────────────────────────────
// ORDENES DE COMPRA — 25 active
// ─────────────────────────────────────────────────────────────

export const ordenes = [
  { orden_id: 'OC-2026-001', proveedor_id: 1, modelo: 'Camisa OXF-2026', nombre_producto: 'Camisa Oxford Premium', estado: 'ENVIO', total_esperados: 240, total_recibidos: 240, fecha_creacion: '2026-05-14' },
  { orden_id: 'OC-2026-002', proveedor_id: 1, modelo: 'Blusa SLK-2026', nombre_producto: 'Blusa Seda Print', estado: 'BAHIA', total_esperados: 180, total_recibidos: 180, fecha_creacion: '2026-05-15' },
  { orden_id: 'OC-2026-003', proveedor_id: 2, modelo: 'Pantalón CLS-26', nombre_producto: 'Pantalón Vestir Slim', estado: 'SORTER', total_esperados: 300, total_recibidos: 298, fecha_creacion: '2026-05-15' },
  { orden_id: 'OC-2026-004', proveedor_id: 3, modelo: 'Falda PLT-26', nombre_producto: 'Falda Plisada Midi', estado: 'QA', total_esperados: 160, total_recibidos: 160, fecha_creacion: '2026-05-16' },
  { orden_id: 'OC-2026-005', proveedor_id: 4, modelo: 'Vestido ELG-26', nombre_producto: 'Vestido Elegante Wrap', estado: 'REGISTRO', total_esperados: 120, total_recibidos: 118, fecha_creacion: '2026-05-16' },
  { orden_id: 'OC-2026-006', proveedor_id: 5, modelo: 'Saco BLZ-26', nombre_producto: 'Saco Blazer Corte', estado: 'AUDITORIA', total_esperados: 90, total_recibidos: 90, fecha_creacion: '2026-05-17' },
  { orden_id: 'OC-2026-007', proveedor_id: 7, modelo: 'Chaleco CHL-26', nombre_producto: 'Chaleco Acolchado', estado: 'PREREGISTRO', total_esperados: 110, total_recibidos: 0, fecha_creacion: '2026-05-18' },
  { orden_id: 'OC-2026-008', proveedor_id: 2, modelo: 'Camisa LIN-26', nombre_producto: 'Camisa Lino Verano', estado: 'BAHIA', total_esperados: 220, total_recibidos: 220, fecha_creacion: '2026-05-18' },
  { orden_id: 'OC-2026-009', proveedor_id: 6, modelo: 'Jeans STR-26', nombre_producto: 'Jeans Stretch Skinny', estado: 'QA', total_esperados: 280, total_recibidos: 280, fecha_creacion: '2026-05-18' },
  { orden_id: 'OC-2026-010', proveedor_id: 1, modelo: 'Camisa LIN-26', nombre_producto: 'Camisa Lino Marina', estado: 'SORTER', total_esperados: 200, total_recibidos: 200, fecha_creacion: '2026-05-19' },
  { orden_id: 'OC-2026-011', proveedor_id: 7, modelo: 'Vestido CKT-26', nombre_producto: 'Vestido Cóctel Encaje', estado: 'REGISTRO', total_esperados: 140, total_recibidos: 140, fecha_creacion: '2026-05-19' },
  { orden_id: 'OC-2026-012', proveedor_id: 3, modelo: 'Blusa CSL-26', nombre_producto: 'Blusa Casual Manga 3/4', estado: 'BAHIA', total_esperados: 195, total_recibidos: 195, fecha_creacion: '2026-05-19' },
  { orden_id: 'OC-2026-013', proveedor_id: 5, modelo: 'Suéter PNT-26', nombre_producto: 'Suéter Punto Trenza', estado: 'PREREGISTRO', total_esperados: 130, total_recibidos: 0, fecha_creacion: '2026-05-20' },
  { orden_id: 'OC-2026-014', proveedor_id: 4, modelo: 'Falda LAP-26', nombre_producto: 'Falda Lápiz Cintura', estado: 'PREREGISTRO', total_esperados: 110, total_recibidos: 0, fecha_creacion: '2026-05-20' },
  { orden_id: 'OC-2026-015', proveedor_id: 2, modelo: 'Saco TRZ-26', nombre_producto: 'Saco Tweed Clásico', estado: 'QA', total_esperados: 75, total_recibidos: 75, fecha_creacion: '2026-05-20' },
  { orden_id: 'OC-2026-016', proveedor_id: 6, modelo: 'Camisa DNM-26', nombre_producto: 'Camisa Denim Vintage', estado: 'AUDITORIA', total_esperados: 165, total_recibidos: 159, fecha_creacion: '2026-05-20' },
  { orden_id: 'OC-2026-017', proveedor_id: 1, modelo: 'Pantalón CHN-26', nombre_producto: 'Pantalón Chino Slim', estado: 'ENVIO', total_esperados: 250, total_recibidos: 250, fecha_creacion: '2026-05-21' },
  { orden_id: 'OC-2026-018', proveedor_id: 7, modelo: 'Vestido VRN-26', nombre_producto: 'Vestido Verano Estampado', estado: 'BAHIA', total_esperados: 175, total_recibidos: 175, fecha_creacion: '2026-05-21' },
  { orden_id: 'OC-2026-019', proveedor_id: 3, modelo: 'Blusa VRN-26', nombre_producto: 'Blusa Verano Florales', estado: 'SORTER', total_esperados: 210, total_recibidos: 209, fecha_creacion: '2026-05-21' },
  { orden_id: 'OC-2026-020', proveedor_id: 5, modelo: 'Saco PRM-26', nombre_producto: 'Saco Premium Lana', estado: 'REGISTRO', total_esperados: 65, total_recibidos: 65, fecha_creacion: '2026-05-21' },
  { orden_id: 'OC-2026-021', proveedor_id: 2, modelo: 'Camisa STG-26', nombre_producto: 'Camisa Stretch Gris', estado: 'PREREGISTRO', total_esperados: 240, total_recibidos: 0, fecha_creacion: '2026-05-22' },
  { orden_id: 'OC-2026-022', proveedor_id: 4, modelo: 'Pantalón LIN-26', nombre_producto: 'Pantalón Lino Tropical', estado: 'PREREGISTRO', total_esperados: 145, total_recibidos: 0, fecha_creacion: '2026-05-22' },
  { orden_id: 'OC-2026-023', proveedor_id: 1, modelo: 'Vestido EJL-26', nombre_producto: 'Vestido Ejecutiva Lápiz', estado: 'QA', total_esperados: 95, total_recibidos: 95, fecha_creacion: '2026-05-22' },
  { orden_id: 'OC-2026-024', proveedor_id: 7, modelo: 'Falda PRD-26', nombre_producto: 'Falda Pradera Larga', estado: 'BAHIA', total_esperados: 130, total_recibidos: 130, fecha_creacion: '2026-05-22' },
  { orden_id: 'OC-2026-025', proveedor_id: 6, modelo: 'Camisa CTL-26', nombre_producto: 'Camisa Cuello Italia', estado: 'AUDITORIA', total_esperados: 185, total_recibidos: 182, fecha_creacion: '2026-05-22' },
];

// ─────────────────────────────────────────────────────────────
// PALETS — 18 cargamentos in different stages
// ─────────────────────────────────────────────────────────────

export const palets = [
  { palet_id: 'PAL-001', orden_id: 'OC-2026-001', pedido_id: 'PED-001', estado: 'ENVIADO',     etapa_actual: 'ENVIO',       total_prepacks: 32, timestamp_llegada: '2026-05-14 07:30', tiempo_ciclo_min: 184 },
  { palet_id: 'PAL-002', orden_id: 'OC-2026-002', pedido_id: 'PED-002', estado: 'EN_BAHIA',    etapa_actual: 'BAHIA',       total_prepacks: 24, timestamp_llegada: '2026-05-15 08:15', tiempo_ciclo_min: 142 },
  { palet_id: 'PAL-003', orden_id: 'OC-2026-003', pedido_id: 'PED-003', estado: 'EN_SORTER',   etapa_actual: 'SORTER',      total_prepacks: 40, timestamp_llegada: '2026-05-15 09:00', tiempo_ciclo_min: 95 },
  { palet_id: 'PAL-004', orden_id: 'OC-2026-004', pedido_id: 'PED-004', estado: 'EN_QA',       etapa_actual: 'QA',          total_prepacks: 22, timestamp_llegada: '2026-05-16 08:45', tiempo_ciclo_min: 58 },
  { palet_id: 'PAL-005', orden_id: 'OC-2026-005', pedido_id: 'PED-005', estado: 'EN_REGISTRO', etapa_actual: 'REGISTRO',    total_prepacks: 16, timestamp_llegada: '2026-05-16 10:30', tiempo_ciclo_min: 71 },
  { palet_id: 'PAL-006', orden_id: 'OC-2026-006', pedido_id: 'PED-006', estado: 'EN_AUDITORIA',etapa_actual: 'AUDITORIA',   total_prepacks: 12, timestamp_llegada: '2026-05-17 07:50', tiempo_ciclo_min: 156 },
  { palet_id: 'PAL-007', orden_id: 'OC-2026-008', pedido_id: 'PED-008', estado: 'EN_BAHIA',    etapa_actual: 'BAHIA',       total_prepacks: 28, timestamp_llegada: '2026-05-18 08:20', tiempo_ciclo_min: 138 },
  { palet_id: 'PAL-008', orden_id: 'OC-2026-009', pedido_id: 'PED-009', estado: 'EN_QA',      etapa_actual: 'QA',           total_prepacks: 36, timestamp_llegada: '2026-05-18 09:15', tiempo_ciclo_min: 42 },
  { palet_id: 'PAL-009', orden_id: 'OC-2026-010', pedido_id: 'PED-010', estado: 'EN_SORTER',   etapa_actual: 'SORTER',      total_prepacks: 26, timestamp_llegada: '2026-05-19 08:00', tiempo_ciclo_min: 88 },
  { palet_id: 'PAL-010', orden_id: 'OC-2026-011', pedido_id: 'PED-011', estado: 'EN_REGISTRO', etapa_actual: 'REGISTRO',    total_prepacks: 18, timestamp_llegada: '2026-05-19 10:45', tiempo_ciclo_min: 65 },
  { palet_id: 'PAL-011', orden_id: 'OC-2026-012', pedido_id: 'PED-012', estado: 'EN_BAHIA',    etapa_actual: 'BAHIA',       total_prepacks: 25, timestamp_llegada: '2026-05-19 11:20', tiempo_ciclo_min: 127 },
  { palet_id: 'PAL-012', orden_id: 'OC-2026-015', pedido_id: 'PED-015', estado: 'EN_QA',       etapa_actual: 'QA',          total_prepacks: 10, timestamp_llegada: '2026-05-20 08:30', tiempo_ciclo_min: 48 },
  { palet_id: 'PAL-013', orden_id: 'OC-2026-016', pedido_id: 'PED-016', estado: 'EN_AUDITORIA',etapa_actual: 'AUDITORIA',   total_prepacks: 22, timestamp_llegada: '2026-05-20 09:00', tiempo_ciclo_min: 145 },
  { palet_id: 'PAL-014', orden_id: 'OC-2026-017', pedido_id: 'PED-017', estado: 'ENVIADO',     etapa_actual: 'ENVIO',       total_prepacks: 33, timestamp_llegada: '2026-05-21 07:45', tiempo_ciclo_min: 178 },
  { palet_id: 'PAL-015', orden_id: 'OC-2026-018', pedido_id: 'PED-018', estado: 'EN_BAHIA',    etapa_actual: 'BAHIA',       total_prepacks: 23, timestamp_llegada: '2026-05-21 08:30', tiempo_ciclo_min: 122 },
  { palet_id: 'PAL-016', orden_id: 'OC-2026-019', pedido_id: 'PED-019', estado: 'EN_SORTER',   etapa_actual: 'SORTER',      total_prepacks: 28, timestamp_llegada: '2026-05-21 09:15', tiempo_ciclo_min: 92 },
  { palet_id: 'PAL-017', orden_id: 'OC-2026-020', pedido_id: 'PED-020', estado: 'EN_REGISTRO', etapa_actual: 'REGISTRO',    total_prepacks: 9,  timestamp_llegada: '2026-05-21 10:00', tiempo_ciclo_min: 68 },
  { palet_id: 'PAL-018', orden_id: 'OC-2026-024', pedido_id: 'PED-024', estado: 'EN_BAHIA',    etapa_actual: 'BAHIA',       total_prepacks: 17, timestamp_llegada: '2026-05-22 08:00', tiempo_ciclo_min: 41 },
];

// ─────────────────────────────────────────────────────────────
// TAGS / EPCs — prepack-level data
// ─────────────────────────────────────────────────────────────

export const tags = [
  { epc: 'E001A', sku: 'OXF-26-M-AZL', talla: 'M', color: 'Azul Marino', cantidad_piezas: 6, proveedor_id: 1, tienda_id: 'CDMX-POL', palet_id: 'PAL-001', pedido_id: 'PED-001', etapa_actual: 'ENVIO',     qa_fallido: false },
  { epc: 'E002A', sku: 'OXF-26-L-AZL', talla: 'L', color: 'Azul Marino', cantidad_piezas: 6, proveedor_id: 1, tienda_id: 'CDMX-POL', palet_id: 'PAL-001', pedido_id: 'PED-001', etapa_actual: 'ENVIO',     qa_fallido: false },
  { epc: 'E003A', sku: 'OXF-26-M-BLN', talla: 'M', color: 'Blanco',      cantidad_piezas: 6, proveedor_id: 1, tienda_id: 'MTY-CTR',  palet_id: 'PAL-001', pedido_id: 'PED-001', etapa_actual: 'ENVIO',     qa_fallido: false },
  { epc: 'E004A', sku: 'SLK-26-S-RSA', talla: 'S', color: 'Rosa Pastel', cantidad_piezas: 4, proveedor_id: 1, tienda_id: 'GDL-PRV',  palet_id: 'PAL-002', pedido_id: 'PED-002', etapa_actual: 'BAHIA',     qa_fallido: false },
  { epc: 'E005A', sku: 'SLK-26-M-RSA', talla: 'M', color: 'Rosa Pastel', cantidad_piezas: 4, proveedor_id: 1, tienda_id: 'GDL-PRV',  palet_id: 'PAL-002', pedido_id: 'PED-002', etapa_actual: 'BAHIA',     qa_fallido: false },
  { epc: 'E006A', sku: 'CLS-26-32-NGR', talla: '32', color: 'Negro',     cantidad_piezas: 5, proveedor_id: 2, tienda_id: 'MTY-SP',  palet_id: 'PAL-003', pedido_id: 'PED-003', etapa_actual: 'SORTER',    qa_fallido: false },
  { epc: 'E007A', sku: 'CLS-26-34-NGR', talla: '34', color: 'Negro',     cantidad_piezas: 5, proveedor_id: 2, tienda_id: 'MTY-SP',  palet_id: 'PAL-003', pedido_id: 'PED-003', etapa_actual: 'SORTER',    qa_fallido: false },
  { epc: 'E008A', sku: 'PLT-26-M-VRD', talla: 'M', color: 'Verde Olivo', cantidad_piezas: 4, proveedor_id: 3, tienda_id: 'PUE-CTR', palet_id: 'PAL-004', pedido_id: 'PED-004', etapa_actual: 'QA',        qa_fallido: false },
  { epc: 'E009B', sku: 'PLT-26-L-VRD', talla: 'L', color: 'Verde Olivo', cantidad_piezas: 4, proveedor_id: 3, tienda_id: 'PUE-CTR', palet_id: 'PAL-004', pedido_id: 'PED-004', etapa_actual: 'QA',        qa_fallido: true },
  { epc: 'E010A', sku: 'ELG-26-S-VIN', talla: 'S', color: 'Vino',        cantidad_piezas: 3, proveedor_id: 4, tienda_id: 'CDMX-INS',palet_id: 'PAL-005', pedido_id: 'PED-005', etapa_actual: 'REGISTRO',  qa_fallido: false },
  { epc: 'E011A', sku: 'BLZ-26-M-GRS', talla: 'M', color: 'Gris Oxford', cantidad_piezas: 3, proveedor_id: 5, tienda_id: 'CDMX-POL',palet_id: 'PAL-006', pedido_id: 'PED-006', etapa_actual: 'AUDITORIA', qa_fallido: false },
  { epc: 'E012A', sku: 'LIN-26-M-CRD', talla: 'M', color: 'Crudo',       cantidad_piezas: 6, proveedor_id: 2, tienda_id: 'CUN-MAL', palet_id: 'PAL-007', pedido_id: 'PED-008', etapa_actual: 'BAHIA',     qa_fallido: false },
  { epc: 'E013A', sku: 'STR-26-28-AZL', talla: '28', color: 'Azul Indigo',cantidad_piezas: 8, proveedor_id: 6, tienda_id: 'TIJ-NTE',palet_id: 'PAL-008', pedido_id: 'PED-009', etapa_actual: 'QA',        qa_fallido: false },
  { epc: 'E014B', sku: 'STR-26-30-AZL', talla: '30', color: 'Azul Indigo',cantidad_piezas: 8, proveedor_id: 6, tienda_id: 'TIJ-NTE',palet_id: 'PAL-008', pedido_id: 'PED-009', etapa_actual: 'QA',        qa_fallido: true },
  { epc: 'E015A', sku: 'LIN-26-L-MRN', talla: 'L', color: 'Azul Marino', cantidad_piezas: 5, proveedor_id: 1, tienda_id: 'MER-GAL', palet_id: 'PAL-009', pedido_id: 'PED-010', etapa_actual: 'SORTER',    qa_fallido: false },
  { epc: 'E016A', sku: 'CKT-26-M-NGR', talla: 'M', color: 'Negro',       cantidad_piezas: 4, proveedor_id: 7, tienda_id: 'CDMX-SAN',palet_id: 'PAL-010', pedido_id: 'PED-011', etapa_actual: 'REGISTRO',  qa_fallido: false },
  { epc: 'E017A', sku: 'CSL-26-M-CRL', talla: 'M', color: 'Coral',       cantidad_piezas: 5, proveedor_id: 3, tienda_id: 'QRO-ANT', palet_id: 'PAL-011', pedido_id: 'PED-012', etapa_actual: 'BAHIA',     qa_fallido: false },
  { epc: 'E018A', sku: 'TRZ-26-S-GRS', talla: 'S', color: 'Gris Topo',   cantidad_piezas: 2, proveedor_id: 2, tienda_id: 'LEN-CTR', palet_id: 'PAL-012', pedido_id: 'PED-015', etapa_actual: 'QA',        qa_fallido: false },
  { epc: 'E019A', sku: 'DNM-26-M-AZL', talla: 'M', color: 'Azul Vintage',cantidad_piezas: 6, proveedor_id: 6, tienda_id: 'CHI-CTR', palet_id: 'PAL-013', pedido_id: 'PED-016', etapa_actual: 'AUDITORIA', qa_fallido: false },
  { epc: 'E020A', sku: 'CHN-26-32-BGE',talla: '32', color: 'Beige Arena',cantidad_piezas: 7, proveedor_id: 1, tienda_id: 'AGS-CTR', palet_id: 'PAL-014', pedido_id: 'PED-017', etapa_actual: 'ENVIO',     qa_fallido: false },
];

// ─────────────────────────────────────────────────────────────
// ANOMALIAS — recent issues
// ─────────────────────────────────────────────────────────────

export const anomalias = [
  { id: 1, epc: 'E009B', tipo_error: 'QA_FALLIDO', etapa: 'QA', lector_id: 'RFID-QA-1', bahia: 'ZONA-QA', proveedor_id: 3, timestamp: '2026-05-21 09:32', descripcion: 'Costura defectuosa en hombro', resuelto: false },
  { id: 2, epc: 'E014B', tipo_error: 'QA_FALLIDO', etapa: 'QA', lector_id: 'RFID-QA-1', bahia: 'ZONA-QA', proveedor_id: 6, timestamp: '2026-05-22 08:15', descripcion: 'Tono de color fuera de tolerancia', resuelto: false },
  { id: 3, epc: 'E007A', tipo_error: 'RUTEO_INCORRECTO', etapa: 'SORTER', lector_id: 'RFID-SORTER-1', bahia: 'ZONA-SORTER', proveedor_id: 2, timestamp: '2026-05-21 10:45', descripcion: 'Detectado en bahía B5, debería ser B4', resuelto: true },
  { id: 4, epc: 'E022C', tipo_error: 'LECTURA_DUPLICADA', etapa: 'PREREGISTRO', lector_id: 'RFID-RECEPCION-1', bahia: 'RAMPA-ENTRADA', proveedor_id: 4, timestamp: '2026-05-22 07:50', descripcion: 'Tag leído 3 veces en 4 segundos', resuelto: true },
  { id: 5, epc: 'E031D', tipo_error: 'NO_PERTENECE_A_OC', etapa: 'PREREGISTRO', lector_id: 'RFID-RECEPCION-1', bahia: 'RAMPA-ENTRADA', proveedor_id: 6, timestamp: '2026-05-22 09:10', descripcion: 'EPC no existe en orden de compra activa', resuelto: false },
];

// ─────────────────────────────────────────────────────────────
// PALET ETAPA LOG — history of palet transitions
// ─────────────────────────────────────────────────────────────

export const paletEtapaLog = [
  { id: 1, palet_id: 'PAL-001', etapa: 'PREREGISTRO', timestamp_entrada: '2026-05-14 07:30', timestamp_salida: '2026-05-14 07:34', prepacks_entrada: 32, prepacks_salida: 32, tiene_anomalia: false },
  { id: 2, palet_id: 'PAL-001', etapa: 'QA',          timestamp_entrada: '2026-05-14 07:35', timestamp_salida: '2026-05-14 08:02', prepacks_entrada: 32, prepacks_salida: 32, tiene_anomalia: false },
  { id: 3, palet_id: 'PAL-001', etapa: 'REGISTRO',    timestamp_entrada: '2026-05-14 08:03', timestamp_salida: '2026-05-14 08:14', prepacks_entrada: 32, prepacks_salida: 32, tiene_anomalia: false },
  { id: 4, palet_id: 'PAL-001', etapa: 'SORTER',      timestamp_entrada: '2026-05-14 08:16', timestamp_salida: '2026-05-14 08:32', prepacks_entrada: 32, prepacks_salida: 32, tiene_anomalia: false },
  { id: 5, palet_id: 'PAL-001', etapa: 'BAHIA',       timestamp_entrada: '2026-05-14 08:35', timestamp_salida: '2026-05-14 09:48', prepacks_entrada: 32, prepacks_salida: 32, tiene_anomalia: false },
  { id: 6, palet_id: 'PAL-001', etapa: 'AUDITORIA',   timestamp_entrada: '2026-05-14 09:50', timestamp_salida: '2026-05-14 10:14', prepacks_entrada: 32, prepacks_salida: 32, tiene_anomalia: false },
  { id: 7, palet_id: 'PAL-001', etapa: 'ENVIO',       timestamp_entrada: '2026-05-14 10:16', timestamp_salida: '2026-05-14 10:34', prepacks_entrada: 32, prepacks_salida: 32, tiene_anomalia: false },
];

// ─────────────────────────────────────────────────────────────
// KPIs — for dashboard module
// ─────────────────────────────────────────────────────────────

export const kpis = {
  hoy: {
    palets_procesados: 18,
    palets_meta: 24,
    prepacks_totales: 420,
    prepacks_enviados: 287,
    tiempo_ciclo_promedio_min: 108,
    tiempo_ciclo_manual_min: 158,
    mejora_pct: 32,
    tasa_anomalia_pct: 1.4,
    qa_aprobacion_pct: 96.8,
  },
  semana: [
    { dia: 'Lun', procesados: 22, anomalias: 1 },
    { dia: 'Mar', procesados: 19, anomalias: 2 },
    { dia: 'Mié', procesados: 24, anomalias: 0 },
    { dia: 'Jue', procesados: 21, anomalias: 1 },
    { dia: 'Vie', procesados: 18, anomalias: 3 },
  ],
  throughputHoy: [
    { hora: '07:00', prepacks: 12 },
    { hora: '08:00', prepacks: 38 },
    { hora: '09:00', prepacks: 52 },
    { hora: '10:00', prepacks: 64 },
    { hora: '11:00', prepacks: 71 },
    { hora: '12:00', prepacks: 58 },
    { hora: '13:00', prepacks: 41 },
    { hora: '14:00', prepacks: 49 },
    { hora: '15:00', prepacks: 35 },
  ],
};

// ─────────────────────────────────────────────────────────────
// USERS — for mock authentication
// ─────────────────────────────────────────────────────────────

export const mockUsers = {
  ADMIN: {
    sub: 'user-admin-001',
    name: 'Admin del Sistema',
    email: 'admin@vertiche.mx',
    role: 'ADMIN',
    module: 'admin',
  },
  SUPERVISOR: {
    sub: 'user-supervisor-001',
    name: 'Moisés Falcón',
    email: 'moises@vertiche.mx',
    role: 'SUPERVISOR',
    module: 'rfid',
  },
  BAY_OPERATOR: {
    sub: 'user-operator-001',
    name: 'Ana Martínez',
    email: 'ana@vertiche.mx',
    role: 'BAY_OPERATOR',
    module: 'sorter',
  },
  OPS_MANAGER: {
    sub: 'user-manager-001',
    name: 'Roberto Cruz',
    email: 'roberto@vertiche.mx',
    role: 'OPS_MANAGER',
    module: 'dashboard',
  },
  QA_INSPECTOR: {
    sub: 'user-qa-001',
    name: 'Lucía Vega',
    email: 'lucia@vertiche.mx',
    role: 'QA_INSPECTOR',
    module: 'proveedores',
  },
};

// ─────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────

export function getProveedorById(id) {
  return proveedores.find((p) => p.id === id);
}

export function getTiendaById(id) {
  return tiendas.find((t) => t.tienda_id === id);
}

export function getPaletById(id) {
  return palets.find((p) => p.palet_id === id);
}

export function getTagByEpc(epc) {
  return tags.find((t) => t.epc === epc);
}

export function getOrdenById(id) {
  return ordenes.find((o) => o.orden_id === id);
}

export function getTagsByPalet(paletId) {
  return tags.filter((t) => t.palet_id === paletId);
}

export function getAnomaliasUnresolved() {
  return anomalias.filter((a) => !a.resuelto);
}

export function getAnomaliasByProveedor(proveedorId) {
  return anomalias.filter((a) => a.proveedor_id === proveedorId);
}
