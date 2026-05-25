/**
 * Local fixtures for the rfid module — 25 purchase orders (OCs) spread across
 * the 7 CEDIS stages so the supervisor sees real-looking flow in the Gantt.
 *
 * Each OC has prepacks (RFID tags), each prepack has multiple garments with
 * color+size combinations. Stage logs record entry/exit timestamps for
 * computing durations.
 *
 * Two OCs (OC-006, OC-011, OC-019, OC-024) include `mkPrepackError` entries
 * and anomaly flags on their stage logs — these drive the red anomaly state
 * in the Gantt cells.
 *
 * Store IDs (TDA-007 etc) and PO numbers (OC-001 etc) match the proveedores
 * and sorter modules so cross-module references stay consistent.
 */

export const ETAPAS_FLUJO = [
  { id: 'PREREGISTRO', label: 'Pre-reg',   short: 'PRE'  },
  { id: 'QA',          label: 'QA',        short: 'QA'   },
  { id: 'REGISTRO',    label: 'Registro',  short: 'REG'  },
  { id: 'SORTER',      label: 'Sorter',    short: 'SORT' },
  { id: 'BAHIA',       label: 'Bahías',    short: 'BAH'  },
  { id: 'AUDITORIA',   label: 'Auditoría', short: 'AUD'  },
  { id: 'ENVIO',       label: 'Envío',     short: 'ENV'  },
];

export const ETAPA_IDX = Object.fromEntries(ETAPAS_FLUJO.map((e, i) => [e.id, i]));

/**
 * Per-stage accent colors. These differ from the design-system module accents
 * because each stage of the CEDIS flow has its own identity in the Gantt.
 * The supervisor learns the color/stage mapping by repeated exposure.
 */
export const ETAPA_COLORS = {
  PREREGISTRO: '#2563EB',
  QA:          '#059669',
  REGISTRO:    '#D97706',
  SORTER:      '#7C3AED',
  BAHIA:       '#0891B2',
  AUDITORIA:   '#DB2777',
  ENVIO:       '#16A34A',
};

export const ETAPA_LABELS = {
  PREREGISTRO: 'Pre-registro',
  QA:          'QA',
  REGISTRO:    'Registro',
  SORTER:      'Sorter',
  BAHIA:       'Bahía',
  AUDITORIA:   'Auditoría',
  ENVIO:       'Envío',
};

const TIENDAS = {
  MTY_CENTRO:  { nombre: 'Vértice Monterrey Centro',  ciudad: 'Monterrey',       estado: 'NL',   bahia_asignada: 'BAHIA-1' },
  MTY_SUR:     { nombre: 'Vértice Monterrey Sur',     ciudad: 'Monterrey',       estado: 'NL',   bahia_asignada: 'BAHIA-1' },
  SAN_PEDRO:   { nombre: 'Vértice San Pedro',         ciudad: 'San Pedro',       estado: 'NL',   bahia_asignada: 'BAHIA-2' },
  SALTILLO:    { nombre: 'Vértice Saltillo',          ciudad: 'Saltillo',        estado: 'COAH', bahia_asignada: 'BAHIA-2' },
  GUADALAJARA: { nombre: 'Vértice Guadalajara',       ciudad: 'Guadalajara',     estado: 'JAL',  bahia_asignada: 'BAHIA-3' },
  ZAPOPAN:     { nombre: 'Vértice Zapopan',           ciudad: 'Zapopan',         estado: 'JAL',  bahia_asignada: 'BAHIA-3' },
  CDMX_POL:    { nombre: 'Vértice CDMX Polanco',      ciudad: 'CDMX',            estado: 'CDMX', bahia_asignada: 'BAHIA-4' },
  CDMX_ROM:    { nombre: 'Vértice CDMX Roma',         ciudad: 'CDMX',            estado: 'CDMX', bahia_asignada: 'BAHIA-4' },
  PUEBLA:      { nombre: 'Vértice Puebla',            ciudad: 'Puebla',          estado: 'PUE',  bahia_asignada: 'BAHIA-5' },
  QUERETARO:   { nombre: 'Vértice Querétaro',         ciudad: 'Querétaro',       estado: 'QRO',  bahia_asignada: 'BAHIA-5' },
  SLP:         { nombre: 'Vértice San Luis Potosí',   ciudad: 'San Luis Potosí', estado: 'SLP',  bahia_asignada: 'BAHIA-6' },
  AGUASC:      { nombre: 'Vértice Aguascalientes',    ciudad: 'Aguascalientes',  estado: 'AGS',  bahia_asignada: 'BAHIA-6' },
  HERMOSILLO:  { nombre: 'Vértice Hermosillo',        ciudad: 'Hermosillo',      estado: 'SON',  bahia_asignada: 'BAHIA-7' },
  CULIACAN:    { nombre: 'Vértice Culiacán',          ciudad: 'Culiacán',        estado: 'SIN',  bahia_asignada: 'BAHIA-7' },
  TIJUANA:     { nombre: 'Vértice Tijuana',           ciudad: 'Tijuana',         estado: 'BC',   bahia_asignada: 'BAHIA-8' },
  MEXICALI:    { nombre: 'Vértice Mexicali',          ciudad: 'Mexicali',        estado: 'BC',   bahia_asignada: 'BAHIA-8' },
  MERIDA:      { nombre: 'Vértice Mérida',            ciudad: 'Mérida',          estado: 'YUC',  bahia_asignada: 'BAHIA-9' },
  CANCUN:      { nombre: 'Vértice Cancún',            ciudad: 'Cancún',          estado: 'QROO', bahia_asignada: 'BAHIA-9' },
  CHIHUAHUA:   { nombre: 'Vértice Chihuahua',         ciudad: 'Chihuahua',       estado: 'CHIH', bahia_asignada: 'BAHIA-10' },
  JUAREZ:      { nombre: 'Vértice Ciudad Juárez',     ciudad: 'Cd. Juárez',      estado: 'CHIH', bahia_asignada: 'BAHIA-10' },
};

// ─── Helpers for building data ──────────────────────────────────────────

function ts(horaBase, minutosOffset = 0) {
  const d = new Date();
  d.setHours(Math.floor(horaBase), (horaBase % 1) * 60 + minutosOffset, 0, 0);
  return d.toISOString();
}

function mkLog(etapa, hE, hS = null, pE = 0, pS = null) {
  return {
    etapa,
    timestamp_entrada: ts(hE),
    timestamp_salida: hS !== null ? ts(hS) : null,
    prepacks_entrada: pE,
    prepacks_salida: pS !== null ? pS : pE,
    tiene_anomalia: false,
    notas: '',
  };
}

function mkPrepack(epc, etapa, tienda, prendas) {
  const colores = [...new Set(prendas.map((p) => p.color))];
  const tallas = [...new Set(prendas.map((p) => p.talla))];
  return {
    epc,
    etapa_actual: etapa,
    qa_fallido: false,
    anomalias: [],
    prendas,
    tienda,
    colores,
    tallas,
    total_prendas: prendas.length,
    cantidad_piezas: prendas.length,
    color: colores[0],
    talla: tallas.join('/'),
    tipo_flujo: 'CROSS_DOCK',
    sku: `${(colores[0] || 'X').substring(0, 3).toUpperCase()}-${tallas[0] || 'X'}`,
  };
}

function mkPrepackError(epc, etapa, tienda, prendas) {
  return {
    ...mkPrepack(epc, etapa, tienda, prendas),
    qa_fallido: true,
    qa_motivo_fallo: 'Prenda defectuosa',
  };
}

function mkOC(id, nom, prov, etapas, extra = {}) {
  const tagsPorEtapa = {
    PREREGISTRO: [], QA: [], REGISTRO: [], SORTER: [],
    BAHIA: [], AUDITORIA: [], ENVIO: [], COMPLETADO: [],
  };
  Object.entries(etapas).forEach(([e, prepacks]) => { tagsPorEtapa[e] = prepacks; });
  const allTags = Object.values(tagsPorEtapa).flat();
  const etapasActivas = ETAPAS_FLUJO.map((e) => e.id).filter((e) => tagsPorEtapa[e]?.length > 0);
  const idxMin = etapasActivas.length > 0
    ? Math.min(...etapasActivas.map((e) => ETAPA_IDX[e] ?? 99))
    : 0;
  const idxMax = etapasActivas.length > 0
    ? Math.max(...etapasActivas.map((e) => ETAPA_IDX[e] ?? 0))
    : 0;
  const comp = allTags.filter((t) => ['ENVIO', 'COMPLETADO'].includes(t.etapa_actual)).length;
  return {
    ordenId: id,
    nombre: nom,
    nombre_producto: nom,
    proveedor: prov,
    totalPrepacks: allTags.length,
    pct: allTags.length > 0 ? (comp / allTags.length) * 100 : 0,
    hasErr: allTags.some((t) => t.qa_fallido),
    tags: allTags,
    tagsPorEtapa,
    etapasActivas,
    idxMin,
    idxMax,
    etapa_logs: extra.etapa_logs || [],
    total_esperados: extra.total_esperados || allTags.length,
    total_recibidos: extra.total_recibidos || allTags.length,
    faltantes: extra.faltantes || 0,
    orden: { orden_id: id, nombre_producto: nom, foto_url: null },
    pedido: { pedido_id: 'PED-DEMO', proveedor: { nombre: prov } },
    pedido_id: 'PED-DEMO',
    palet_id: id,
    estado: comp === allTags.length && allTags.length > 0 ? 'DESPACHADO' : 'ACTIVO',
  };
}

// ─── KPI ─────────────────────────────────────────────────────────────────

export const DEMO_KPI = {
  mejora_porcentaje: 30.6,
  objetivo_mejora_pct: 32,
  tiempo_promedio_hoy_min: 125,
  palets_activos: 25,
  palets_completados_hoy: 8,
};

// ─── The 25 OCs ──────────────────────────────────────────────────────────

export const DEMO_OCS = [
  // ── PRE-REGISTRO ────────────────────────────────────────────────────
  mkOC('OC-001', 'Playera Básica Manga Corta', 'Textiles Monterrey SA', {
    PREREGISTRO: [
      mkPrepack('E001A', 'PREREGISTRO', TIENDAS.MTY_CENTRO,  [{ color: 'Azul', talla: 'S' }, { color: 'Azul', talla: 'M' }, { color: 'Negro', talla: 'S' }, { color: 'Negro', talla: 'L' }]),
      mkPrepack('E001B', 'PREREGISTRO', TIENDAS.SAN_PEDRO,   [{ color: 'Blanco', talla: 'XS' }, { color: 'Blanco', talla: 'S' }, { color: 'Rojo', talla: 'M' }, { color: 'Rojo', talla: 'L' }]),
      mkPrepack('E001C', 'PREREGISTRO', TIENDAS.GUADALAJARA, [{ color: 'Verde', talla: 'S' }, { color: 'Verde', talla: 'M' }, { color: 'Azul', talla: 'XL' }]),
    ],
  }, { etapa_logs: [mkLog('PREREGISTRO', 9.5, null, 3, null)] }),

  mkOC('OC-002', 'Pantalón Cargo Denim Slim', 'Confecciones del Norte', {
    PREREGISTRO: [
      mkPrepack('E002A', 'PREREGISTRO', TIENDAS.HERMOSILLO, [{ color: 'Azul', talla: '28' }, { color: 'Azul', talla: '30' }, { color: 'Negro', talla: '32' }, { color: 'Negro', talla: '34' }]),
      mkPrepack('E002B', 'PREREGISTRO', TIENDAS.TIJUANA,    [{ color: 'Café', talla: '30' }, { color: 'Café', talla: '32' }, { color: 'Azul', talla: '36' }]),
    ],
  }, { total_esperados: 3, total_recibidos: 2, faltantes: 1, etapa_logs: [mkLog('PREREGISTRO', 9.75, null, 2, null)] }),

  mkOC('OC-003', 'Blusa Fluida Manga Larga', 'Moda Express MX', {
    PREREGISTRO: [
      mkPrepack('E003A', 'PREREGISTRO', TIENDAS.CDMX_POL, [{ color: 'Blanco', talla: 'S' }, { color: 'Blanco', talla: 'M' }, { color: 'Rosa', talla: 'S' }, { color: 'Rosa', talla: 'M' }]),
      mkPrepack('E003B', 'PREREGISTRO', TIENDAS.PUEBLA,   [{ color: 'Azul', talla: 'L' }, { color: 'Azul', talla: 'XL' }, { color: 'Blanco', talla: 'L' }]),
    ],
  }, { etapa_logs: [mkLog('PREREGISTRO', 10.0, null, 2, null)] }),

  mkOC('OC-004', 'Chamarra Impermeable Sport', 'ActiveWear CDMX', {
    PREREGISTRO: [
      mkPrepack('E004A', 'PREREGISTRO', TIENDAS.MTY_SUR,  [{ color: 'Negro', talla: 'M' }, { color: 'Negro', talla: 'L' }, { color: 'Gris', talla: 'M' }, { color: 'Gris', talla: 'XL' }]),
      mkPrepack('E004B', 'PREREGISTRO', TIENDAS.SALTILLO, [{ color: 'Azul', talla: 'S' }, { color: 'Azul', talla: 'M' }, { color: 'Negro', talla: 'XL' }]),
    ],
  }, { etapa_logs: [mkLog('PREREGISTRO', 10.25, null, 2, null)] }),

  // ── QA ──────────────────────────────────────────────────────────────
  mkOC('OC-005', 'Vestido Casual Verano', 'Diseños Guadalajara', {
    PREREGISTRO: [
      mkPrepack('E005A', 'PREREGISTRO', TIENDAS.MTY_CENTRO, [{ color: 'Verde', talla: 'S' }, { color: 'Verde', talla: 'M' }, { color: 'Amarillo', talla: 'S' }]),
    ],
    QA: [
      mkPrepack('E005B', 'QA', TIENDAS.GUADALAJARA, [{ color: 'Amarillo', talla: 'M' }, { color: 'Azul', talla: 'S' }, { color: 'Azul', talla: 'M' }, { color: 'Blanco', talla: 'L' }]),
      mkPrepack('E005C', 'QA', TIENDAS.ZAPOPAN,     [{ color: 'Blanco', talla: 'S' }, { color: 'Rosa', talla: 'M' }, { color: 'Rosa', talla: 'L' }]),
    ],
  }, { etapa_logs: [mkLog('PREREGISTRO', 8.5, 9.0, 3, 3), mkLog('QA', 9.0, null, 2, null)] }),

  mkOC('OC-006', 'Polo Piqué Hombre', 'Textiles Monterrey SA', {
    QA: [
      mkPrepackError('E006A', 'QA', TIENDAS.HERMOSILLO, [{ color: 'Azul', talla: 'M' }, { color: 'Azul', talla: 'L' }, { color: 'Blanco', talla: 'S' }]),
      mkPrepack('E006B', 'QA', TIENDAS.CULIACAN,        [{ color: 'Blanco', talla: 'M' }, { color: 'Negro', talla: 'L' }, { color: 'Negro', talla: 'XL' }]),
    ],
  }, { total_esperados: 3, total_recibidos: 2, faltantes: 1, etapa_logs: [mkLog('PREREGISTRO', 8.25, 8.75, 2, 2), { ...mkLog('QA', 8.75, null, 2, null), tiene_anomalia: true }] }),

  mkOC('OC-007', 'Short Deportivo Running', 'ActiveWear CDMX', {
    QA: [
      mkPrepack('E007A', 'QA', TIENDAS.SAN_PEDRO, [{ color: 'Negro', talla: 'S' }, { color: 'Negro', talla: 'M' }, { color: 'Azul', talla: 'S' }, { color: 'Azul', talla: 'M' }]),
      mkPrepack('E007B', 'QA', TIENDAS.SALTILLO,  [{ color: 'Rojo', talla: 'L' }, { color: 'Rojo', talla: 'XL' }, { color: 'Negro', talla: 'L' }]),
    ],
  }, { etapa_logs: [mkLog('PREREGISTRO', 8.75, 9.25, 2, 2), mkLog('QA', 9.25, null, 2, null)] }),

  // ── REGISTRO ────────────────────────────────────────────────────────
  mkOC('OC-008', 'Playera Estampada Temporada', 'Estampados MX', {
    QA: [
      mkPrepack('E008A', 'QA', TIENDAS.GUADALAJARA, [{ color: 'Blanco', talla: 'S' }, { color: 'Blanco', talla: 'M' }, { color: 'Gris', talla: 'L' }]),
    ],
    REGISTRO: [
      mkPrepack('E008B', 'REGISTRO', TIENDAS.SLP,        [{ color: 'Gris', talla: 'XL' }, { color: 'Verde', talla: 'S' }, { color: 'Verde', talla: 'M' }, { color: 'Azul', talla: 'L' }]),
      mkPrepack('E008C', 'REGISTRO', TIENDAS.QUERETARO,  [{ color: 'Azul', talla: 'XS' }, { color: 'Rojo', talla: 'S' }, { color: 'Rojo', talla: 'M' }]),
    ],
  }, { etapa_logs: [mkLog('PREREGISTRO', 7.5, 8.0, 3, 3), mkLog('QA', 8.0, 8.5, 3, 3), mkLog('REGISTRO', 8.5, null, 2, null)] }),

  mkOC('OC-009', 'Pantalón Chino Slim Fit', 'Confecciones del Norte', {
    REGISTRO: [
      mkPrepack('E009A', 'REGISTRO', TIENDAS.MTY_CENTRO, [{ color: 'Beige', talla: '30' }, { color: 'Beige', talla: '32' }, { color: 'Verde', talla: '30' }, { color: 'Verde', talla: '34' }]),
      mkPrepack('E009B', 'REGISTRO', TIENDAS.CDMX_POL,   [{ color: 'Azul', talla: '32' }, { color: 'Azul', talla: '36' }, { color: 'Café', talla: '30' }]),
    ],
  }, { etapa_logs: [mkLog('PREREGISTRO', 7.75, 8.25, 2, 2), mkLog('QA', 8.25, 8.75, 2, 2), mkLog('REGISTRO', 8.75, null, 2, null)] }),

  mkOC('OC-010', 'Sudadera Hoodie Oversize', 'Urban Trends MX', {
    REGISTRO: [
      mkPrepack('E010A', 'REGISTRO', TIENDAS.CDMX_ROM, [{ color: 'Negro', talla: 'S' }, { color: 'Negro', talla: 'M' }, { color: 'Gris', talla: 'M' }, { color: 'Gris', talla: 'L' }]),
      mkPrepack('E010B', 'REGISTRO', TIENDAS.PUEBLA,   [{ color: 'Azul', talla: 'XL' }, { color: 'Azul', talla: 'XXL' }, { color: 'Blanco', talla: 'S' }, { color: 'Blanco', talla: 'M' }]),
    ],
  }, { etapa_logs: [mkLog('PREREGISTRO', 7.25, 7.75, 2, 2), mkLog('QA', 7.75, 8.25, 2, 2), mkLog('REGISTRO', 8.25, null, 2, null)] }),

  mkOC('OC-011', 'Camiseta Básica Pack', 'Textiles Monterrey SA', {
    REGISTRO: [
      mkPrepackError('E011A', 'REGISTRO', TIENDAS.MERIDA, [{ color: 'Blanco', talla: 'S' }, { color: 'Blanco', talla: 'M' }, { color: 'Negro', talla: 'S' }]),
      mkPrepack('E011B', 'REGISTRO', TIENDAS.CANCUN,      [{ color: 'Negro', talla: 'M' }, { color: 'Gris', talla: 'L' }, { color: 'Gris', talla: 'XL' }]),
    ],
  }, { total_esperados: 3, total_recibidos: 2, faltantes: 1, etapa_logs: [mkLog('PREREGISTRO', 8.0, 8.5, 2, 2), mkLog('QA', 8.5, 9.0, 2, 2), { ...mkLog('REGISTRO', 9.0, null, 2, null), tiene_anomalia: true }] }),

  // ── SORTER ──────────────────────────────────────────────────────────
  mkOC('OC-012', 'Blusa Campesina Bordada', 'Moda Express MX', {
    REGISTRO: [
      mkPrepack('E012A', 'REGISTRO', TIENDAS.MTY_CENTRO, [{ color: 'Blanco', talla: 'S' }, { color: 'Blanco', talla: 'M' }, { color: 'Rosa', talla: 'S' }, { color: 'Rosa', talla: 'M' }]),
    ],
    SORTER: [
      mkPrepack('E012B', 'SORTER', TIENDAS.SALTILLO,  [{ color: 'Azul', talla: 'S' }, { color: 'Azul', talla: 'M' }, { color: 'Verde', talla: 'L' }, { color: 'Verde', talla: 'XL' }]),
      mkPrepack('E012C', 'SORTER', TIENDAS.CHIHUAHUA, [{ color: 'Rojo', talla: 'S' }, { color: 'Rojo', talla: 'M' }, { color: 'Blanco', talla: 'L' }]),
    ],
  }, { etapa_logs: [mkLog('PREREGISTRO', 6.5, 7.0, 3, 3), mkLog('QA', 7.0, 7.5, 3, 3), mkLog('REGISTRO', 7.5, 8.0, 3, 3), mkLog('SORTER', 8.0, null, 2, null)] }),

  mkOC('OC-013', 'Jean Skinny Mujer', 'Diseños Guadalajara', {
    SORTER: [
      mkPrepack('E013A', 'SORTER', TIENDAS.GUADALAJARA, [{ color: 'Azul Oscuro', talla: '25' }, { color: 'Azul Oscuro', talla: '27' }, { color: 'Negro', talla: '25' }, { color: 'Negro', talla: '27' }]),
      mkPrepack('E013B', 'SORTER', TIENDAS.ZAPOPAN,     [{ color: 'Gris', talla: '29' }, { color: 'Gris', talla: '31' }, { color: 'Negro', talla: '29' }]),
    ],
  }, { etapa_logs: [mkLog('PREREGISTRO', 6.75, 7.25, 2, 2), mkLog('QA', 7.25, 7.75, 2, 2), mkLog('REGISTRO', 7.75, 8.25, 2, 2), mkLog('SORTER', 8.25, null, 2, null)] }),

  mkOC('OC-014', 'Playera Polo Sport', 'ActiveWear CDMX', {
    SORTER: [
      mkPrepack('E014A', 'SORTER', TIENDAS.HERMOSILLO, [{ color: 'Blanco', talla: 'M' }, { color: 'Blanco', talla: 'L' }, { color: 'Azul', talla: 'S' }, { color: 'Azul', talla: 'M' }]),
    ],
    BAHIA: [
      mkPrepack('E014B', 'BAHIA', TIENDAS.TIJUANA, [{ color: 'Negro', talla: 'XL' }, { color: 'Negro', talla: 'XXL' }, { color: 'Gris', talla: 'L' }]),
    ],
  }, { etapa_logs: [mkLog('PREREGISTRO', 6.25, 6.75, 2, 2), mkLog('QA', 6.75, 7.25, 2, 2), mkLog('REGISTRO', 7.25, 7.75, 2, 2), mkLog('SORTER', 7.75, null, 1, null), mkLog('BAHIA', 8.5, null, 1, null)] }),

  // ── BAHÍAS ──────────────────────────────────────────────────────────
  mkOC('OC-015', 'Shorts Playa Tropical', 'Estampados MX', {
    BAHIA: [
      mkPrepack('E015A', 'BAHIA', TIENDAS.MTY_CENTRO,  [{ color: 'Azul', talla: 'S' }, { color: 'Azul', talla: 'M' }, { color: 'Verde', talla: 'S' }, { color: 'Verde', talla: 'M' }]),
      mkPrepack('E015B', 'BAHIA', TIENDAS.GUADALAJARA, [{ color: 'Naranja', talla: 'L' }, { color: 'Naranja', talla: 'XL' }, { color: 'Rojo', talla: 'M' }]),
      mkPrepack('E015C', 'BAHIA', TIENDAS.CDMX_POL,    [{ color: 'Azul', talla: 'L' }, { color: 'Verde', talla: 'XL' }, { color: 'Blanco', talla: 'S' }]),
    ],
  }, { etapa_logs: [mkLog('PREREGISTRO', 6.0, 6.5, 3, 3), mkLog('QA', 6.5, 7.0, 3, 3), mkLog('REGISTRO', 7.0, 7.5, 3, 3), mkLog('SORTER', 7.5, 8.0, 3, 3), mkLog('BAHIA', 8.0, null, 3, null)] }),

  mkOC('OC-016', 'Falda Midi Plisada', 'Diseños Guadalajara', {
    SORTER: [
      mkPrepack('E016A', 'SORTER', TIENDAS.CDMX_ROM, [{ color: 'Rosa', talla: 'S' }, { color: 'Rosa', talla: 'M' }, { color: 'Beige', talla: 'S' }]),
    ],
    BAHIA: [
      mkPrepack('E016B', 'BAHIA', TIENDAS.SLP, [{ color: 'Beige', talla: 'M' }, { color: 'Negro', talla: 'L' }, { color: 'Negro', talla: 'XL' }]),
    ],
  }, { etapa_logs: [mkLog('PREREGISTRO', 6.25, 6.75, 2, 2), mkLog('QA', 6.75, 7.25, 2, 2), mkLog('REGISTRO', 7.25, 7.75, 2, 2), mkLog('SORTER', 7.75, null, 1, null), mkLog('BAHIA', 8.25, null, 1, null)] }),

  mkOC('OC-017', 'Chamarra Denim Oversize', 'Urban Trends MX', {
    BAHIA: [
      mkPrepack('E017A', 'BAHIA', TIENDAS.MEXICALI,  [{ color: 'Azul', talla: 'S' }, { color: 'Azul', talla: 'M' }, { color: 'Negro', talla: 'L' }, { color: 'Negro', talla: 'XL' }]),
      mkPrepack('E017B', 'BAHIA', TIENDAS.CHIHUAHUA, [{ color: 'Blanco', talla: 'M' }, { color: 'Blanco', talla: 'L' }, { color: 'Gris', talla: 'XL' }]),
    ],
  }, { etapa_logs: [mkLog('PREREGISTRO', 5.75, 6.25, 2, 2), mkLog('QA', 6.25, 6.75, 2, 2), mkLog('REGISTRO', 6.75, 7.25, 2, 2), mkLog('SORTER', 7.25, 7.75, 2, 2), mkLog('BAHIA', 7.75, null, 2, null)] }),

  // ── AUDITORÍA ───────────────────────────────────────────────────────
  mkOC('OC-018', 'Playera Básica Premium', 'Textiles Monterrey SA', {
    BAHIA: [
      mkPrepack('E018A', 'BAHIA', TIENDAS.MTY_CENTRO, [{ color: 'Blanco', talla: 'S' }, { color: 'Blanco', talla: 'M' }, { color: 'Negro', talla: 'L' }, { color: 'Negro', talla: 'XL' }]),
    ],
    AUDITORIA: [
      mkPrepack('E018B', 'AUDITORIA', TIENDAS.SAN_PEDRO,  [{ color: 'Gris', talla: 'S' }, { color: 'Gris', talla: 'M' }, { color: 'Azul', talla: 'S' }]),
      mkPrepack('E018C', 'AUDITORIA', TIENDAS.QUERETARO,  [{ color: 'Azul', talla: 'L' }, { color: 'Blanco', talla: 'XL' }, { color: 'Negro', talla: 'M' }]),
    ],
  }, { etapa_logs: [mkLog('PREREGISTRO', 5.0, 5.5, 3, 3), mkLog('QA', 5.5, 6.0, 3, 3), mkLog('REGISTRO', 6.0, 6.5, 3, 3), mkLog('SORTER', 6.5, 7.0, 3, 3), mkLog('BAHIA', 7.0, null, 3, null), mkLog('AUDITORIA', 7.75, null, 2, null)] }),

  mkOC('OC-019', 'Pantalón Vestir Slim', 'Confecciones del Norte', {
    AUDITORIA: [
      mkPrepackError('E019A', 'AUDITORIA', TIENDAS.GUADALAJARA, [{ color: 'Negro', talla: '30' }, { color: 'Negro', talla: '32' }, { color: 'Gris', talla: '30' }]),
      mkPrepack('E019B', 'AUDITORIA', TIENDAS.PUEBLA,           [{ color: 'Gris', talla: '34' }, { color: 'Azul', talla: '32' }, { color: 'Azul', talla: '36' }]),
    ],
  }, { total_esperados: 3, total_recibidos: 2, faltantes: 1, etapa_logs: [mkLog('PREREGISTRO', 5.25, 5.75, 2, 2), mkLog('QA', 5.75, 6.25, 2, 2), mkLog('REGISTRO', 6.25, 6.75, 2, 2), mkLog('SORTER', 6.75, 7.25, 2, 2), mkLog('BAHIA', 7.25, 7.75, 2, 2), { ...mkLog('AUDITORIA', 7.75, null, 2, null), tiene_anomalia: true }] }),

  mkOC('OC-020', 'Blusa Casual Rayas', 'Moda Express MX', {
    AUDITORIA: [
      mkPrepack('E020A', 'AUDITORIA', TIENDAS.HERMOSILLO, [{ color: 'Azul', talla: 'S' }, { color: 'Azul', talla: 'M' }, { color: 'Rojo', talla: 'S' }, { color: 'Rojo', talla: 'M' }]),
      mkPrepack('E020B', 'AUDITORIA', TIENDAS.MERIDA,     [{ color: 'Blanco', talla: 'L' }, { color: 'Blanco', talla: 'XL' }, { color: 'Azul', talla: 'L' }]),
    ],
  }, { etapa_logs: [mkLog('PREREGISTRO', 5.5, 6.0, 2, 2), mkLog('QA', 6.0, 6.5, 2, 2), mkLog('REGISTRO', 6.5, 7.0, 2, 2), mkLog('SORTER', 7.0, 7.5, 2, 2), mkLog('BAHIA', 7.5, 8.0, 2, 2), mkLog('AUDITORIA', 8.0, null, 2, null)] }),

  mkOC('OC-021', 'Sudadera Crew Neck Básica', 'Urban Trends MX', {
    AUDITORIA: [
      mkPrepack('E021A', 'AUDITORIA', TIENDAS.MTY_CENTRO, [{ color: 'Gris', talla: 'S' }, { color: 'Gris', talla: 'M' }, { color: 'Negro', talla: 'S' }]),
    ],
    ENVIO: [
      mkPrepack('E021B', 'ENVIO', TIENDAS.GUADALAJARA, [{ color: 'Negro', talla: 'M' }, { color: 'Azul', talla: 'L' }, { color: 'Azul', talla: 'XL' }]),
    ],
  }, { etapa_logs: [mkLog('PREREGISTRO', 4.75, 5.25, 2, 2), mkLog('QA', 5.25, 5.75, 2, 2), mkLog('REGISTRO', 5.75, 6.25, 2, 2), mkLog('SORTER', 6.25, 6.75, 2, 2), mkLog('BAHIA', 6.75, 7.25, 2, 2), mkLog('AUDITORIA', 7.25, null, 1, null), mkLog('ENVIO', 7.75, null, 1, null)] }),

  // ── ENVÍO ───────────────────────────────────────────────────────────
  mkOC('OC-022', 'Pantalón Jogger Tech', 'ActiveWear CDMX', {
    ENVIO: [
      mkPrepack('E022A', 'ENVIO', TIENDAS.HERMOSILLO, [{ color: 'Negro', talla: 'S' }, { color: 'Negro', talla: 'M' }, { color: 'Gris', talla: 'L' }, { color: 'Gris', talla: 'XL' }]),
      mkPrepack('E022B', 'ENVIO', TIENDAS.TIJUANA,    [{ color: 'Azul', talla: 'M' }, { color: 'Azul', talla: 'L' }, { color: 'Verde', talla: 'S' }]),
      mkPrepack('E022C', 'ENVIO', TIENDAS.MEXICALI,   [{ color: 'Verde', talla: 'M' }, { color: 'Negro', talla: 'XL' }, { color: 'Gris', talla: 'M' }]),
    ],
  }, { etapa_logs: [mkLog('PREREGISTRO', 4.0, 4.5, 3, 3), mkLog('QA', 4.5, 5.0, 3, 3), mkLog('REGISTRO', 5.0, 5.5, 3, 3), mkLog('SORTER', 5.5, 6.0, 3, 3), mkLog('BAHIA', 6.0, 6.75, 3, 3), mkLog('AUDITORIA', 6.75, 7.25, 3, 3), mkLog('ENVIO', 7.25, null, 3, null)] }),

  mkOC('OC-023', 'Vestido Formal Noche', 'Diseños Guadalajara', {
    ENVIO: [
      mkPrepack('E023A', 'ENVIO', TIENDAS.MTY_CENTRO, [{ color: 'Negro', talla: 'S' }, { color: 'Negro', talla: 'M' }, { color: 'Rojo', talla: 'S' }, { color: 'Rojo', talla: 'M' }]),
      mkPrepack('E023B', 'ENVIO', TIENDAS.CDMX_POL,   [{ color: 'Azul Marino', talla: 'L' }, { color: 'Azul Marino', talla: 'XL' }, { color: 'Negro', talla: 'XL' }]),
    ],
  }, { etapa_logs: [mkLog('PREREGISTRO', 4.25, 4.75, 2, 2), mkLog('QA', 4.75, 5.25, 2, 2), mkLog('REGISTRO', 5.25, 5.75, 2, 2), mkLog('SORTER', 5.75, 6.25, 2, 2), mkLog('BAHIA', 6.25, 7.0, 2, 2), mkLog('AUDITORIA', 7.0, 7.5, 2, 2), mkLog('ENVIO', 7.5, 8.0, 2, 2)] }),

  mkOC('OC-024', 'Playera Manga Larga UV', 'Textiles Monterrey SA', {
    ENVIO: [
      mkPrepack('E024A', 'ENVIO', TIENDAS.QUERETARO, [{ color: 'Blanco', talla: 'S' }, { color: 'Blanco', talla: 'M' }, { color: 'Azul', talla: 'S' }]),
      mkPrepackError('E024B', 'ENVIO', TIENDAS.AGUASC, [{ color: 'Azul', talla: 'M' }, { color: 'Negro', talla: 'L' }, { color: 'Negro', talla: 'XL' }]),
    ],
  }, { total_esperados: 3, total_recibidos: 2, faltantes: 1, etapa_logs: [mkLog('PREREGISTRO', 3.75, 4.25, 2, 2), mkLog('QA', 4.25, 4.75, 2, 2), mkLog('REGISTRO', 4.75, 5.25, 2, 2), mkLog('SORTER', 5.25, 5.75, 2, 2), mkLog('BAHIA', 5.75, 6.5, 2, 2), mkLog('AUDITORIA', 6.5, 7.0, 2, 2), { ...mkLog('ENVIO', 7.0, null, 2, null), tiene_anomalia: true }] }),

  mkOC('OC-025', 'Short Gym Hombre', 'ActiveWear CDMX', {
    AUDITORIA: [
      mkPrepack('E025A', 'AUDITORIA', TIENDAS.MERIDA, [{ color: 'Negro', talla: 'S' }, { color: 'Negro', talla: 'M' }, { color: 'Azul', talla: 'S' }, { color: 'Azul', talla: 'M' }]),
    ],
    ENVIO: [
      mkPrepack('E025B', 'ENVIO', TIENDAS.CANCUN, [{ color: 'Gris', talla: 'L' }, { color: 'Gris', talla: 'XL' }, { color: 'Negro', talla: 'L' }]),
    ],
  }, { etapa_logs: [mkLog('PREREGISTRO', 4.5, 5.0, 2, 2), mkLog('QA', 5.0, 5.5, 2, 2), mkLog('REGISTRO', 5.5, 6.0, 2, 2), mkLog('SORTER', 6.0, 6.5, 2, 2), mkLog('BAHIA', 6.5, 7.0, 2, 2), mkLog('AUDITORIA', 7.0, null, 1, null), mkLog('ENVIO', 7.5, null, 1, null)] }),
];

// ─── Convenience accessors ──────────────────────────────────────────────

/** Lookup OC by its ID (e.g., "OC-007"). Returns undefined if not found. */
export function getOC(ordenId) {
  return DEMO_OCS.find((oc) => oc.ordenId === ordenId);
}

/** All OCs that have at least one prepack in the given bay. */
export function getOCsInBay(numBahia, etapa) {
  const bahiaId = `BAHIA-${numBahia}`;
  return DEMO_OCS.filter((oc) =>
    (oc.tagsPorEtapa[etapa] || []).some(
      (t) => t.tienda?.bahia_asignada === bahiaId
    )
  );
}

/** Flatten all prepacks (tags) across all OCs — useful for Trazabilidad search. */
export function getAllPrepacks() {
  return DEMO_OCS.flatMap((oc) =>
    oc.tags.map((t) => ({ ...t, ordenId: oc.ordenId, ocNombre: oc.nombre, proveedor: oc.proveedor }))
  );
}

/** Find a prepack by EPC across all OCs. */
export function getPrepackByEpc(epc) {
  return getAllPrepacks().find((p) => p.epc === epc);
}

// ─── Color helpers (shared by ModalOC, ModalResumenOC, etc) ─────────────

const COLORES_CSS = {
  azul: '#3B82F6', rojo: '#EF4444', verde: '#22C55E', negro: '#1E293B',
  blanco: '#F8FAFC', amarillo: '#EAB308', rosa: '#EC4899', gris: '#94A3B8',
  'café': '#92400E', cafe: '#92400E', naranja: '#F97316',
  morado: '#8B5CF6', violeta: '#8B5CF6', beige: '#D4B896',
  'azul oscuro': '#1E3A8A', 'azul marino': '#1E3A8A',
};

export function getColorCSS(c) {
  return COLORES_CSS[(c || '').toLowerCase()] || '#94A3B8';
}

export function esColorClaro(c) {
  return ['blanco', 'white', 'beige', 'amarillo', 'yellow'].includes((c || '').toLowerCase());
}
