import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { epcCorto, haceCuanto } from '../utils/format.js';
import { realApi } from '../services/realApi.js';
import { onSocket } from '../services/socketClient.js';

/**
 * Registrar Tag — nueva versión.
 * Flujo nuevo: la OC pre-declara todos los prepacks que vienen. Al "registrar"
 * un tag, lo que haces es asignar el EPC físico a un prepack pendiente.
 *
 * Layout:
 *   Izquierda (320px):
 *     - Selector de OC activa
 *     - Barra de progreso (asignados/total)
 *     - Botón "+ Nueva OC"
 *   Derecha:
 *     - Grid de prepacks: pendientes (gris) primero, asignados (verde) abajo
 *     - Click en pendiente → modal pide EPC → al guardar pasa a verde
 */
export function Vinculacion() {
  const [ordenes, setOrdenes] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [tiendas, setTiendas] = useState([]);
  const [ordenSel, setOrdenSel] = useState('');
  const [prepacks, setPrepacks] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [modalNuevaOC, setModalNuevaOC] = useState(false);
  const [modalAsignar, setModalAsignar] = useState(null);
  const [mensaje, setMensaje] = useState(null);

  useEffect(() => {
    cargarCatalogos();
  }, []);

  useEffect(() => {
    if (ordenSel) cargarPrepacks(ordenSel);
    else setPrepacks(null);
  }, [ordenSel]);

  // Refresca el listado en vivo cuando se asigna un EPC desde otro lado.
  useEffect(() => {
    if (!ordenSel) return;
    const off = onSocket('prepack-asignado', () => cargarPrepacks(ordenSel));
    return off;
  }, [ordenSel]);

  async function cargarCatalogos() {
    setCargando(true);
    setError(null);
    try {
      const [ords, provs, tdas] = await Promise.all([
        realApi.getOrdenes(),
        realApi.getProveedores(),
        realApi.getTiendas(),
      ]);
      const ocsActivas = (ords || []).filter((o) => o.estado !== 'CANCELADA' && o.estado !== 'RECIBIDA');
      setOrdenes(ocsActivas);
      setProveedores(provs || []);
      setTiendas(tdas || []);
      if (ocsActivas.length > 0 && !ordenSel) {
        setOrdenSel(ocsActivas[0].orden_id);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  async function cargarPrepacks(orden_id) {
    try {
      const data = await realApi.getPrepacksDeOrden(orden_id);
      setPrepacks(data);
    } catch (err) {
      console.error(err);
      setPrepacks(null);
    }
  }

  const onPrepackClick = (prepack) => {
    setModalAsignar({ prepack });
  };

  const asignarEPC = async (epc_real) => {
    if (!modalAsignar?.prepack) return;
    try {
      await realApi.asignarEpc({
        epc_placeholder: modalAsignar.prepack.epc,
        epc_real: epc_real.trim(),
      });
      setMensaje({ tipo: 'exito', texto: `EPC ${epc_real} asignado al prepack.` });
      setTimeout(() => setMensaje(null), 4000);
      setModalAsignar(null);
      await cargarPrepacks(ordenSel);
    } catch (err) {
      // El modal muestra el error sin cerrarse
      throw err;
    }
  };

  const ocActiva = ordenes.find((o) => o.orden_id === ordenSel);
  const pendientes = prepacks?.pendientes || [];
  const asignados = prepacks?.asignados || [];

  if (cargando) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-ink-400">Cargando órdenes...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-2xl mb-2">⚠️</div>
          <div className="text-anomaly dark:text-anomaly-ring">{error}</div>
          <button onClick={cargarCatalogos} className="mt-4 px-4 py-2 bg-rfid text-white rounded-card text-sm">Reintentar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 items-start">

      {/* COLUMNA IZQUIERDA — selector + KPI + acciones */}
      <div className="space-y-4">
        <Panel title="Orden de compra activa">
          <div className="p-4 space-y-3">
            {mensaje && (
              <div className={`px-3 py-2 rounded-card border text-[12px] ${
                mensaje.tipo === 'exito'
                  ? 'bg-flow-bg border-flow-ring/40 text-flow dark:bg-flow/20 dark:border-flow-ring/40 dark:text-flow-ring'
                  : 'bg-anomaly-bg border-anomaly-ring/40 text-anomaly dark:bg-anomaly/20 dark:border-anomaly-ring/40 dark:text-anomaly-ring'
              }`}>
                {mensaje.texto}
              </div>
            )}

            <select
              value={ordenSel}
              onChange={(e) => setOrdenSel(e.target.value)}
              className="w-full px-3 py-2 rounded-card text-[13px] outline-none bg-white border border-ink-100 text-ink-700 focus:border-rfid dark:bg-ink-700 dark:border-ink-500 dark:text-ink-100"
            >
              <option value="">{ordenes.length === 0 ? 'Sin OCs activas' : 'Seleccionar OC...'}</option>
              {ordenes.map((o) => (
                <option key={o.orden_id} value={o.orden_id}>
                  {o.orden_id} — {o.nombre_producto}
                </option>
              ))}
            </select>

            {ocActiva && (() => {
              const provOc = proveedores.find((p) => p.id === ocActiva.proveedor_id);
              return (
                <div className="text-[12px] text-ink-500 dark:text-ink-300 space-y-1.5">
                  <div><strong>Producto:</strong> {ocActiva.nombre_producto}</div>
                  {ocActiva.modelo && <div><strong>Modelo:</strong> {ocActiva.modelo}</div>}
                  <div><strong>Estado:</strong> {ocActiva.estado}</div>
                  {provOc && (
                    <div className="pt-1.5 border-t border-ink-100 dark:border-ink-600">
                      <div className="text-[11px] text-ink-700 dark:text-ink-100 font-semibold truncate mb-1">
                        {provOc.nombre}
                      </div>
                      <ProveedorRatingChip proveedor={provOc} />
                    </div>
                  )}
                </div>
              );
            })()}

            {prepacks && (
              <div className="pt-3 border-t border-ink-100 dark:border-ink-600">
                <div className="font-mono text-[10px] font-bold uppercase tracking-industrial text-ink-400 mb-1.5">
                  Progreso de asignación
                </div>
                <ProgressBar asignados={asignados.length} total={prepacks.total} />
                <div className="flex justify-between mt-2 text-[12px]">
                  <span className="text-flow dark:text-flow-ring">✓ {asignados.length} asignados</span>
                  <span className="text-ink-400">○ {pendientes.length} pendientes</span>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setModalNuevaOC(true)}
              className="w-full px-3 py-2 mt-3 rounded-card font-display text-[13px] font-semibold bg-rfid text-white hover:bg-blue-700"
            >
              + Nueva orden de compra
            </button>
          </div>
        </Panel>

        {ocActiva && (
          <Panel title="Leyenda">
            <div className="p-3 space-y-2 text-[11px]">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-ink-100 dark:bg-ink-600 border border-ink-200 dark:border-ink-500" />
                <span className="text-ink-500 dark:text-ink-300">Prepack pendiente — sin EPC</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-flow border border-flow-ring" />
                <span className="text-ink-500 dark:text-ink-300">Prepack asignado — con EPC</span>
              </div>
            </div>
          </Panel>
        )}
      </div>

      {/* COLUMNA DERECHA — grid de prepacks */}
      <Panel title={prepacks ? `Prepacks de la OC (${prepacks.total})` : 'Prepacks'}>
        {!prepacks ? (
          <div className="px-6 py-12 text-center text-[13px] text-ink-400">
            Selecciona una OC para ver sus prepacks.
          </div>
        ) : prepacks.total === 0 ? (
          <div className="px-6 py-12 text-center text-[13px] text-ink-400">
            Esta OC no tiene prepacks declarados.
          </div>
        ) : (
          <div className="p-4">
            {/* Pendientes primero */}
            {pendientes.length > 0 && (
              <div className="mb-5">
                <div className="font-mono text-[10px] font-bold uppercase tracking-industrial text-ink-400 mb-2">
                  Pendientes ({pendientes.length}) — click para asignar EPC
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                  {pendientes.map((p) => (
                    <PrepackCell key={p.epc} prepack={p} estado="pendiente" onClick={() => onPrepackClick(p)} />
                  ))}
                </div>
              </div>
            )}

            {asignados.length > 0 && (
              <div>
                <div className="font-mono text-[10px] font-bold uppercase tracking-industrial text-ink-400 mb-2">
                  Asignados ({asignados.length})
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                  {asignados.map((p) => (
                    <PrepackCell key={p.epc} prepack={p} estado="asignado" />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Panel>

      {modalNuevaOC && (
        <ModalNuevaOC
          proveedores={proveedores}
          tiendas={tiendas}
          onClose={() => setModalNuevaOC(false)}
          onCreada={async ({ ordenCompra }) => {
            await cargarCatalogos();
            setOrdenSel(ordenCompra.orden_id);
            setModalNuevaOC(false);
            setMensaje({ tipo: 'exito', texto: `OC ${ordenCompra.orden_id} creada con ${ordenCompra.total_esperados} prepacks pendientes.` });
            setTimeout(() => setMensaje(null), 5000);
          }}
        />
      )}

      {modalAsignar && (
        <ModalAsignarEPC
          prepack={modalAsignar.prepack}
          onClose={() => setModalAsignar(null)}
          onAsignar={asignarEPC}
        />
      )}
    </div>
  );
}

// ============================================================
// COMPONENTES VISUALES
// ============================================================

function PrepackCell({ prepack, estado, onClick }) {
  const pendiente = estado === 'pendiente';
  const bg = pendiente
    ? 'bg-ink-50 hover:bg-rfid/5 border-ink-200 dark:bg-ink-800 dark:hover:bg-rfid/10 dark:border-ink-600'
    : 'bg-flow/10 border-flow-ring/40 dark:bg-flow/15 dark:border-flow-ring/40';

  const dotCls = pendiente ? 'bg-ink-300 dark:bg-ink-500' : 'bg-flow-ring';

  // Un prepack puede ser mixto: prendas = [{ talla, color }, ...]. Las
  // agrupamos por talla+color para mostrar "2 M Rojo · 3 S Verde · 2 L Azul".
  const prendas = Array.isArray(prepack.prendas) ? prepack.prendas : [];
  const esMixto = prendas.length > 0;
  const grupos = [];
  if (esMixto) {
    const mapa = new Map();
    for (const p of prendas) {
      const k = `${p.talla}__${p.color}`;
      mapa.set(k, (mapa.get(k) || 0) + 1);
    }
    for (const [k, n] of mapa) {
      const [talla, color] = k.split('__');
      grupos.push({ talla, color, n });
    }
  }
  const hexDe = (color) =>
    COLORES_PALETA.find((c) => normalizeColor(c.nombre) === normalizeColor(color))?.hex;
  const colorHex = hexDe(prepack.color);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!pendiente}
      className={`text-left rounded-card border p-3 transition-colors ${bg} ${pendiente ? 'cursor-pointer' : 'cursor-default'}`}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className={`w-2.5 h-2.5 rounded-full ${dotCls}`} />
        <span className={`font-mono text-[8px] font-bold uppercase tracking-industrial ${pendiente ? 'text-ink-400' : 'text-flow dark:text-flow-ring'}`}>
          {pendiente ? 'Pendiente' : '✓ Asignado'}
        </span>
      </div>
      <div className="flex items-center gap-2 mb-1">
        <div className="text-ink-500 dark:text-ink-300 shrink-0">
          <ProductIcon sku={prepack.sku} size={28} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] text-ink-700 dark:text-ink-100 font-semibold truncate">{prepack.sku}</div>
          <div className="font-mono text-[9px] text-ink-500 dark:text-ink-300 truncate" title={prepack.epc}>
            {pendiente ? <span className="italic text-ink-400">sin EPC</span> : epcCorto(prepack.epc)}
          </div>
        </div>
      </div>

      {esMixto && grupos.length > 1 ? (
        // Prepack surtido: lista cada talla+color con su cantidad.
        <div className="mb-1 space-y-0.5">
          {grupos.map((g, i) => {
            const hex = hexDe(g.color);
            return (
              <div key={i} className="flex items-center gap-1.5 text-[10px] text-ink-500 dark:text-ink-300">
                <span className="font-semibold tabular-nums">{g.n}</span>
                <span className="font-semibold">{g.talla}</span>
                {hex && <span className="w-2.5 h-2.5 rounded-full border border-ink-200 dark:border-ink-500" style={{ background: hex }} />}
                <span className="truncate">{g.color || '—'}</span>
              </div>
            );
          })}
          <div className="text-[9px] text-ink-400 pt-0.5">{prepack.cantidad_piezas} piezas en total</div>
        </div>
      ) : (
        // Prepack simple: una sola talla/color.
        <div className="flex items-center gap-1.5 text-[10px] text-ink-500 dark:text-ink-300 mb-1">
          <span className="font-semibold">{prepack.talla}</span>
          <span>·</span>
          {colorHex && <span className="w-2.5 h-2.5 rounded-full border border-ink-200 dark:border-ink-500" style={{ background: colorHex }} />}
          <span>{prepack.color || '—'}</span>
          <span>·</span>
          <span>{prepack.cantidad_piezas}p</span>
        </div>
      )}

      <div className="flex items-center gap-1 text-[10px] text-ink-400 truncate">
        <StoreIcon size={11} />
        <span className="truncate">{prepack.Tienda?.nombre || prepack.tienda_id}</span>
      </div>
    </button>
  );
}

/* ────────────────────────────────────────────────────────────────────────
 * Iconos SVG inline (Lucide-style). Reciben opcionalmente size.
 * ──────────────────────────────────────────────────────────────────────── */

function ProductIcon({ sku = '', category = '', size = 24 }) {
  const text = `${sku} ${category}`.toLowerCase();
  if (/playera|camis|polo|blusa|t-shirt|tshirt/.test(text)) return <IconCamiseta size={size} />;
  if (/jean|pantal|short/.test(text)) return <IconPantalon size={size} />;
  if (/vestid|falda/.test(text)) return <IconVestido size={size} />;
  if (/hoodie|sudader|jacket|abrigo|chamarr/.test(text)) return <IconChamarra size={size} />;
  if (/zapat|tenis|bota|sandalia/.test(text)) return <IconZapato size={size} />;
  if (/gorr|sombrer/.test(text)) return <IconGorra size={size} />;
  if (/bolsa|mochila/.test(text)) return <IconMochila size={size} />;
  return <IconPaquete size={size} />;
}

function svgProps(size) {
  return {
    width: size, height: size, viewBox: '0 0 24 24',
    fill: 'none', stroke: 'currentColor',
    strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round',
  };
}

function IconCamiseta({ size = 24 }) {
  return (
    <svg {...svgProps(size)} aria-hidden="true">
      <path d="M8 3 4 6l2 4 2-1v11h8V9l2 1 2-4-4-3-2 2a3 3 0 0 1-4 0L8 3Z" />
    </svg>
  );
}

function IconPantalon({ size = 24 }) {
  return (
    <svg {...svgProps(size)} aria-hidden="true">
      <path d="M5 3h14v3l-2 15h-4l-1-11-1 11H7L5 6V3Z" />
      <path d="M5 6h14" />
    </svg>
  );
}

function IconVestido({ size = 24 }) {
  return (
    <svg {...svgProps(size)} aria-hidden="true">
      <path d="M9 3h6l1 4-2 2v3l4 10H6l4-10V9L8 7l1-4Z" />
    </svg>
  );
}

function IconChamarra({ size = 24 }) {
  return (
    <svg {...svgProps(size)} aria-hidden="true">
      <path d="M8 3 4 6v14h6V3" />
      <path d="M16 3v17h4V6l-4-3" />
      <path d="M12 3v17" />
      <path d="M10 7l2 1 2-1" />
    </svg>
  );
}

function IconZapato({ size = 24 }) {
  return (
    <svg {...svgProps(size)} aria-hidden="true">
      <path d="M2 17a3 3 0 0 0 3 3h13a3 3 0 0 0 3-3v-1H2v1Z" />
      <path d="M5 16V8c0-1 1-2 2-2h2l2 3 4 1c1 0 2 1 2 2v4" />
    </svg>
  );
}

function IconGorra({ size = 24 }) {
  return (
    <svg {...svgProps(size)} aria-hidden="true">
      <path d="M3 16c1-7 6-10 9-10s8 3 9 10v1H3v-1Z" />
      <path d="M3 17c0 1.5 1.5 2 4 2h10c2.5 0 4-.5 4-2" />
    </svg>
  );
}

function IconMochila({ size = 24 }) {
  return (
    <svg {...svgProps(size)} aria-hidden="true">
      <path d="M6 8v12a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V8a4 4 0 0 0-4-4h-4a4 4 0 0 0-4 4Z" />
      <path d="M9 4V2h6v2" />
      <path d="M6 13h12" />
    </svg>
  );
}

function IconPaquete({ size = 24 }) {
  return (
    <svg {...svgProps(size)} aria-hidden="true">
      <path d="M3 7v10l9 4 9-4V7l-9-4-9 4Z" />
      <path d="M3 7l9 4 9-4M12 21V11" />
    </svg>
  );
}

function StoreIcon({ size = 14 }) {
  return (
    <svg {...svgProps(size)} aria-hidden="true">
      <path d="M3 9V6l2-3h14l2 3v3" />
      <path d="M3 9a2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0" />
      <path d="M5 9v12h14V9" />
      <path d="M10 21v-6h4v6" />
    </svg>
  );
}

function StarIcon({ size = 14, filled = true }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'} stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m12 2 3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7l3-7Z" />
    </svg>
  );
}

function StarRow({ value, size = 12 }) {
  const full = Math.floor(value);
  const half = value - full >= 0.5;
  return (
    <div className="flex items-center gap-0.5" title={`${value.toFixed(1)} / 5`}>
      {[0,1,2,3,4].map(i => (
        <span key={i} className={i < full || (i === full && half) ? 'text-amber-400' : 'text-ink-200 dark:text-ink-600'}>
          <StarIcon size={size} filled />
        </span>
      ))}
    </div>
  );
}

function ProveedorRatingChip({ proveedor }) {
  if (!proveedor) return null;
  const stars = Number(proveedor.stars || 0);
  const level = proveedor.level || 'NUEVO';
  const levelColor = {
    ELITE: 'bg-flow-bg text-flow border-flow-ring/40 dark:bg-flow/20 dark:text-flow-ring',
    MEDIA: 'bg-attention-bg text-attention border-attention-ring/40 dark:bg-attention/20 dark:text-attention-ring',
    BAJA:  'bg-anomaly-bg text-anomaly border-anomaly-ring/40 dark:bg-anomaly/20 dark:text-anomaly-ring',
    NUEVO: 'bg-ink-50 text-ink-500 border-ink-200 dark:bg-ink-700 dark:text-ink-300 dark:border-ink-500',
  }[level] || 'bg-ink-50 text-ink-500 border-ink-200';

  return (
    <div className="flex items-center gap-1.5 text-[11px]">
      <StarRow value={stars} size={11} />
      <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-industrial border ${levelColor}`}>
        {level}
      </span>
      {proveedor.approval_rate != null && (
        <span className="text-ink-400 dark:text-ink-300 font-mono">{proveedor.approval_rate}%</span>
      )}
    </div>
  );
}

function ProgressBar({ asignados, total }) {
  const pct = total > 0 ? Math.round((asignados / total) * 100) : 0;
  return (
    <div className="h-2 bg-ink-100 dark:bg-ink-600 rounded overflow-hidden">
      <div className="h-full bg-flow dark:bg-flow-ring transition-[width] duration-500" style={{ width: `${pct}%` }} />
    </div>
  );
}

// ============================================================
// MODAL — ASIGNAR EPC
// ============================================================

function ModalAsignarEPC({ prepack, onClose, onAsignar }) {
  const [epc, setEpc] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);
  const [autoDetectado, setAutoDetectado] = useState(false);

  // Mientras el modal está abierto, escucha el socket 'uid-detectado' que
  // emite el backend cuando el Lector 1 del ESP32 lee un chip nuevo.
  // Auto-rellena el campo y resalta visualmente.
  useEffect(() => {
    const off = onSocket('uid-detectado', (ev) => {
      if (ev?.uid) {
        setEpc(ev.uid);
        setAutoDetectado(true);
        setError(null);
        setTimeout(() => setAutoDetectado(false), 1500);
      }
    });
    return off;
  }, []);

  const handle = async () => {
    setError(null);
    if (!epc.trim()) {
      setError('Captura el EPC del tag físico (manual o con el lector ESP32).');
      return;
    }
    setEnviando(true);
    try {
      await onAsignar(epc.trim());
    } catch (err) {
      setError(err.message || 'Error al asignar EPC');
    } finally {
      setEnviando(false);
    }
    
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="w-[420px] max-w-[92vw] rounded-card border bg-white border-ink-100 shadow-xl dark:bg-ink-700 dark:border-ink-600" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-ink-100 dark:border-ink-600">
          <div className="font-display text-[14px] font-bold text-ink-700 dark:text-ink-100">
            Asignar EPC al prepack
          </div>
          <button type="button" onClick={onClose} className="w-7 h-7 rounded flex items-center justify-center text-lg text-ink-400 hover:bg-ink-50 dark:hover:bg-ink-600">×</button>
        </div>

        <div className="px-5 py-4 space-y-3">
          <div className="text-[12px] text-ink-500 dark:text-ink-300">
            Vas a etiquetar el siguiente prepack pre-declarado:
          </div>

          <div className="rounded-card border border-ink-100 dark:border-ink-600 bg-ink-50 dark:bg-ink-800 p-3">
            <div className="text-[12px] text-ink-700 dark:text-ink-100 font-semibold mb-1">{prepack.sku}</div>
            {Array.isArray(prepack.prendas) && prepack.prendas.length > 1 ? (
              <div className="text-[11px] text-ink-500 dark:text-ink-300 mb-1 space-y-0.5">
                {(() => {
                  const mapa = new Map();
                  for (const p of prepack.prendas) {
                    const k = `${p.talla}__${p.color}`;
                    mapa.set(k, (mapa.get(k) || 0) + 1);
                  }
                  return [...mapa.entries()].map(([k, n], i) => {
                    const [talla, color] = k.split('__');
                    return <div key={i}>{n} · {talla} · {color || '—'}</div>;
                  });
                })()}
                <div className="text-[10px] text-ink-400 pt-0.5">{prepack.cantidad_piezas} piezas en total</div>
              </div>
            ) : (
              <div className="text-[11px] text-ink-500 dark:text-ink-300 mb-1">
                {prepack.talla} · {prepack.color || '—'} · {prepack.cantidad_piezas} pzs
              </div>
            )}
            <div className="text-[11px] text-ink-400">
              Destino: {prepack.Tienda?.nombre || prepack.tienda_id}
            </div>
            <div className="text-[10px] font-mono text-ink-400 mt-1 truncate" title={prepack.epc}>
              Placeholder: {prepack.epc}
            </div>
          </div>

          {error && (
            <div className="px-3 py-2 rounded-card border text-[13px] bg-anomaly-bg border-anomaly-ring/40 text-anomaly dark:bg-anomaly/20 dark:border-anomaly-ring/40 dark:text-anomaly-ring">
              {error}
            </div>
          )}

          <FormField label="EPC real del tag físico" required>
            <input
              type="text"
              placeholder="Acerca un chip al lector o escribe el EPC…"
              value={epc}
              onChange={(e) => { setEpc(e.target.value); setAutoDetectado(false); }}
              onKeyDown={(e) => e.key === 'Enter' && handle()}
              autoFocus
              className={`w-full px-3 py-2 rounded-card text-[12px] font-mono outline-none border text-ink-700 placeholder:text-ink-400 focus:border-rfid dark:text-ink-100 transition-colors ${
                autoDetectado
                  ? 'bg-flow/10 border-flow-ring dark:bg-flow/20 dark:border-flow-ring'
                  : 'bg-white border-ink-100 dark:bg-ink-700 dark:border-ink-500'
              }`}
            />
          </FormField>

          <div className="flex items-center gap-2 text-[10px] text-ink-400 dark:text-ink-300">
            <span className="w-1.5 h-1.5 rounded-full bg-flow-ring animate-pulse" />
            <span>Esperando lectura del ESP32 (Lector 1 — Registro)…</span>
          </div>
        </div>

        <div className="flex gap-2 px-5 py-3 border-t border-ink-100 dark:border-ink-600">
          <button type="button" onClick={onClose} disabled={enviando} className="flex-1 px-3 py-2 rounded-card text-[13px] font-semibold bg-ink-50 text-ink-500 hover:bg-ink-100 disabled:opacity-50 dark:bg-ink-600 dark:text-ink-200 dark:hover:bg-ink-500">
            Cancelar
          </button>
          <button type="button" onClick={handle} disabled={enviando} className="flex-1 px-3 py-2 rounded-card text-[13px] font-semibold bg-rfid text-white hover:bg-blue-700 disabled:opacity-50">
            {enviando ? 'Asignando...' : 'Asignar EPC'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MODAL — NUEVA OC con renglones dinámicos
// ============================================================

function ModalNuevaOC({ proveedores, tiendas, onClose, onCreada }) {
  const [form, setForm] = useState({
    proveedor_id: proveedores[0]?.id || '',
    nombre_producto: '',
    modelo: '',
    numero_palets: 1,
  });

  // Un prepack = una tienda destino + N copias idénticas + un desglose de
  // líneas. Cada línea es (sku, talla, color, cantidad), de modo que un
  // prepack puede mezclar productos, tallas y colores. Ejemplo:
  //   Prepack → Tienda CDMX-POL → 2 playeras M rojas + 3 S verdes + 2 L azules
  // El `id` es solo para usar como React `key` estable — evita que un
  // PrepackCard pierda focus/estado cuando se inserta otro prepack arriba.
  const nuevaLinea = (sku = '') => ({ sku, talla: 'M', color: '', cantidad: 1 });
  const nuevoPrepack = () => ({
    id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `p-${Math.random().toString(36).slice(2)}`,
    tienda_id: tiendas[0]?.tienda_id || '',
    copias: 1,
    lineas: [nuevaLinea()],
  });

  const [prepacks, setPrepacks] = useState([nuevoPrepack()]);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  // ── Mutadores de prepacks ──────────────────────────────────
  const setPrepack = (pi, k, v) =>
    setPrepacks((arr) => arr.map((p, i) => (i === pi ? { ...p, [k]: v } : p)));
  // Prepacks nuevos se insertan al inicio para que el más reciente quede
  // visible sin tener que hacer scroll hasta el final del modal.
  const addPrepack = () => setPrepacks((arr) => [nuevoPrepack(), ...arr]);
  const delPrepack = (pi) =>
    setPrepacks((arr) => (arr.length <= 1 ? arr : arr.filter((_, i) => i !== pi)));

  // ── Mutadores de líneas dentro de un prepack ───────────────
  const setLinea = (pi, li, k, v) =>
    setPrepacks((arr) =>
      arr.map((p, i) =>
        i === pi
          ? { ...p, lineas: p.lineas.map((l, j) => (j === li ? { ...l, [k]: v } : l)) }
          : p
      )
    );
  const addLinea = (pi) =>
    setPrepacks((arr) =>
      arr.map((p, i) => {
        if (i !== pi) return p;
        const ultimoSku = p.lineas[p.lineas.length - 1]?.sku || '';
        return { ...p, lineas: [...p.lineas, nuevaLinea(ultimoSku)] };
      })
    );
  const delLinea = (pi, li) =>
    setPrepacks((arr) =>
      arr.map((p, i) =>
        i === pi && p.lineas.length > 1
          ? { ...p, lineas: p.lineas.filter((_, j) => j !== li) }
          : p
      )
    );

  // Piezas de un prepack = suma de cantidades de sus líneas.
  const piezasDe = (p) => p.lineas.reduce((acc, l) => acc + (Number(l.cantidad) || 0), 0);
  const totalPrepacks = prepacks.reduce((acc, p) => acc + (Number(p.copias) || 0), 0);
  const totalPiezas = prepacks.reduce(
    (acc, p) => acc + (Number(p.copias) || 0) * piezasDe(p),
    0
  );

  const handle = async () => {
    setError(null);
    if (!form.proveedor_id || !form.nombre_producto.trim()) {
      setError('Proveedor y nombre del producto son requeridos.');
      return;
    }
    for (const [i, p] of prepacks.entries()) {
      if (!p.tienda_id) {
        setError(`Prepack ${i + 1}: selecciona la tienda destino.`);
        return;
      }
      if (Number(p.copias) <= 0) {
        setError(`Prepack ${i + 1}: el número de copias debe ser al menos 1.`);
        return;
      }
      if (p.lineas.length === 0) {
        setError(`Prepack ${i + 1}: agrega al menos una línea (talla/color).`);
        return;
      }
      for (const [j, l] of p.lineas.entries()) {
        if (!l.sku.trim() || !l.talla || !l.color.trim() || Number(l.cantidad) <= 0) {
          setError(`Prepack ${i + 1}, línea ${j + 1}: SKU, talla, color y cantidad son requeridos.`);
          return;
        }
      }
    }
    setEnviando(true);
    try {
      const res = await realApi.crearOrdenCompra({
        proveedor_id: parseInt(form.proveedor_id, 10),
        nombre_producto: form.nombre_producto.trim(),
        modelo: form.modelo.trim() || null,
        numero_palets: parseInt(form.numero_palets, 10),
        // Cada prepack viaja con su tienda, copias y el desglose de líneas.
        detalles: prepacks.map((p) => ({
          tienda_id: p.tienda_id,
          cantidad: parseInt(p.copias, 10),
          lineas: p.lineas.map((l) => ({
            sku: l.sku.trim(),
            talla: l.talla,
            color: l.color.trim(),
            cantidad: parseInt(l.cantidad, 10),
          })),
        })),
      });
      await onCreada({ ordenCompra: res.ordenCompra });
    } catch (err) {
      setError(err.message || 'Error al crear la OC');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-[860px] max-w-full max-h-[92vh] overflow-y-auto rounded-card border bg-white border-ink-100 shadow-xl dark:bg-ink-700 dark:border-ink-600"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-ink-100 dark:border-ink-600 sticky top-0 bg-white dark:bg-ink-700 z-10">
          <div className="font-display text-[14px] font-bold text-ink-700 dark:text-ink-100">
            Nueva orden de compra
          </div>
          <button type="button" onClick={onClose} className="w-7 h-7 rounded flex items-center justify-center text-lg text-ink-400 hover:bg-ink-50 dark:hover:bg-ink-600">×</button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {error && (
            <div className="px-3 py-2 rounded-card border text-[13px] bg-anomaly-bg border-anomaly-ring/40 text-anomaly dark:bg-anomaly/20 dark:border-anomaly-ring/40 dark:text-anomaly-ring">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <FormField label="Proveedor" required>
              <select value={form.proveedor_id} onChange={(e) => set('proveedor_id', e.target.value)} className="w-full px-3 py-2 rounded-card text-[13px] outline-none bg-white border border-ink-100 text-ink-700 focus:border-rfid dark:bg-ink-700 dark:border-ink-500 dark:text-ink-100">
                <option value="">Seleccionar...</option>
                {proveedores.map((p) => <option key={p.id} value={p.id}>{p.codigo} — {p.nombre}</option>)}
              </select>
              {(() => {
                const provSel = proveedores.find((p) => String(p.id) === String(form.proveedor_id));
                if (!provSel) return null;
                return (
                  <div className="mt-1.5 px-2.5 py-1.5 rounded-card bg-ink-50 dark:bg-ink-800 border border-ink-100 dark:border-ink-600">
                    <ProveedorRatingChip proveedor={provSel} />
                  </div>
                );
              })()}
            </FormField>
            <FormField label="Nombre del producto" required>
              <input type="text" placeholder="Playera básica algodón" value={form.nombre_producto} onChange={(e) => set('nombre_producto', e.target.value)} className="w-full px-3 py-2 rounded-card text-[13px] outline-none bg-white border border-ink-100 text-ink-700 placeholder:text-ink-400 focus:border-rfid dark:bg-ink-700 dark:border-ink-500 dark:text-ink-100" />
            </FormField>
            <FormField label="Modelo">
              <input type="text" placeholder="PLY-V1" value={form.modelo} onChange={(e) => set('modelo', e.target.value)} className="w-full px-3 py-2 rounded-card text-[13px] outline-none bg-white border border-ink-100 text-ink-700 placeholder:text-ink-400 focus:border-rfid dark:bg-ink-700 dark:border-ink-500 dark:text-ink-100" />
            </FormField>
            <FormField label="Número de palets" required>
              <input type="number" min="1" max="20" value={form.numero_palets} onChange={(e) => set('numero_palets', e.target.value)} className="w-full px-3 py-2 rounded-card text-[13px] outline-none bg-white border border-ink-100 text-ink-700 focus:border-rfid dark:bg-ink-700 dark:border-ink-500 dark:text-ink-100" />
            </FormField>
          </div>

          {/* Prepacks */}
          <div className="border-t border-ink-100 dark:border-ink-600 pt-3">
            <div className="flex items-center justify-between mb-2">
              <div className="font-mono text-[10px] font-bold uppercase tracking-industrial text-ink-400">
                Prepacks ({prepacks.length})
              </div>
              <button type="button" onClick={addPrepack} className="px-2 py-1 rounded-card text-[11px] font-semibold bg-rfid/10 text-rfid border border-rfid/30 hover:bg-rfid/20 dark:bg-rfid/20 dark:text-blue-300">
                + Agregar prepack
              </button>
            </div>

            <div className="space-y-3">
              {prepacks.map((p, pi) => (
                <PrepackCard
                  key={p.id || pi}
                  index={pi}
                  prepack={p}
                  piezas={piezasDe(p)}
                  tiendas={tiendas}
                  puedeBorrar={prepacks.length > 1}
                  onChange={(k, v) => setPrepack(pi, k, v)}
                  onChangeLinea={(li, k, v) => setLinea(pi, li, k, v)}
                  onAddLinea={() => addLinea(pi)}
                  onDelLinea={(li) => delLinea(pi, li)}
                  onDelete={() => delPrepack(pi)}
                />
              ))}
            </div>

            <div className="mt-3 px-3 py-2 rounded-card bg-rfid/5 border border-rfid/20 text-[12px] text-ink-700 dark:bg-rfid/15 dark:text-ink-100 dark:border-rfid/30">
              <strong>Total a crear:</strong> {totalPrepacks} prepack{totalPrepacks !== 1 ? 's' : ''} ({totalPiezas} pieza{totalPiezas !== 1 ? 's' : ''}) distribuidos en {form.numero_palets} palet{form.numero_palets > 1 ? 's' : ''}.
            </div>
          </div>
        </div>

        <div className="flex gap-2 px-5 py-3 border-t border-ink-100 dark:border-ink-600 sticky bottom-0 bg-white dark:bg-ink-700">
          <button type="button" onClick={onClose} disabled={enviando} className="flex-1 px-3 py-2 rounded-card text-[13px] font-semibold bg-ink-50 text-ink-500 hover:bg-ink-100 disabled:opacity-50 dark:bg-ink-600 dark:text-ink-200 dark:hover:bg-ink-500">
            Cancelar
          </button>
          <button type="button" onClick={handle} disabled={enviando} className="flex-1 px-3 py-2 rounded-card text-[13px] font-semibold bg-rfid text-white hover:bg-blue-700 disabled:opacity-50">
            {enviando ? 'Creando...' : `Crear OC con ${totalPrepacks} prepack${totalPrepacks !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// PrepackCard — un prepack con tienda, copias y líneas mixtas
// ============================================================

const TALLAS_DISPONIBLES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

function PrepackCard({
  index,
  prepack,
  piezas,
  tiendas,
  puedeBorrar,
  onChange,
  onChangeLinea,
  onAddLinea,
  onDelLinea,
  onDelete,
}) {
  return (
    <div className="rounded-card border border-ink-200 dark:border-ink-600 bg-ink-50/60 dark:bg-ink-800/60 overflow-hidden">
      {/* Encabezado del prepack */}
      <div className="flex items-end gap-2 px-3 py-2.5 border-b border-ink-100 dark:border-ink-600 bg-white dark:bg-ink-700">
        <div className="w-7 h-7 shrink-0 rounded-card bg-rfid/10 text-rfid dark:bg-rfid/25 dark:text-blue-300 flex items-center justify-center font-mono text-[12px] font-bold mb-0.5">
          {index + 1}
        </div>
        <div className="flex-1">
          <FormField label="Tienda destino" compact required>
            <select value={prepack.tienda_id} onChange={(e) => onChange('tienda_id', e.target.value)} className="w-full px-2 py-1.5 rounded text-[12px] outline-none bg-white border border-ink-100 text-ink-700 focus:border-rfid dark:bg-ink-700 dark:border-ink-500 dark:text-ink-100">
              <option value="">Seleccionar...</option>
              {tiendas.map((t) => <option key={t.tienda_id} value={t.tienda_id}>{t.tienda_id}{t.nombre ? ` — ${t.nombre}` : ''}</option>)}
            </select>
          </FormField>
        </div>
        <div className="w-[90px]">
          <FormField label="Copias" compact required>
            <input type="number" min="1" value={prepack.copias} onChange={(e) => onChange('copias', e.target.value)} title="Cuántos prepacks idénticos crear" className="w-full px-2 py-1.5 rounded text-[12px] outline-none bg-white border border-ink-100 text-ink-700 focus:border-rfid dark:bg-ink-700 dark:border-ink-500 dark:text-ink-100" />
          </FormField>
        </div>
        <button type="button" onClick={onDelete} disabled={!puedeBorrar} title="Eliminar prepack" className="w-7 h-7 rounded flex items-center justify-center text-anomaly hover:bg-anomaly/15 disabled:opacity-30 dark:text-anomaly-ring dark:hover:bg-anomaly/25 mb-1">
          ×
        </button>
      </div>

      {/* Líneas del prepack */}
      <div className="px-3 py-2.5 space-y-2">
        {prepack.lineas.map((l, li) => (
          <div key={li} className="grid grid-cols-[1fr_72px_96px_72px_28px] gap-2 items-end">
            <FormField label={li === 0 ? 'SKU / Producto' : null} compact required>
              <input type="text" placeholder="PLY-001" value={l.sku} onChange={(e) => onChangeLinea(li, 'sku', e.target.value)} className="w-full px-2 py-1.5 rounded text-[12px] outline-none bg-white border border-ink-100 text-ink-700 focus:border-rfid dark:bg-ink-700 dark:border-ink-500 dark:text-ink-100" />
            </FormField>
            <FormField label={li === 0 ? 'Talla' : null} compact required>
              <select value={l.talla} onChange={(e) => onChangeLinea(li, 'talla', e.target.value)} className="w-full px-2 py-1.5 rounded text-[12px] outline-none bg-white border border-ink-100 text-ink-700 focus:border-rfid dark:bg-ink-700 dark:border-ink-500 dark:text-ink-100">
                {TALLAS_DISPONIBLES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </FormField>
            <FormField label={li === 0 ? 'Color' : null} compact required>
              <ColorPicker value={l.color} onChange={(v) => onChangeLinea(li, 'color', v)} />
            </FormField>
            <FormField label={li === 0 ? 'Cantidad' : null} compact required>
              <input type="number" min="1" value={l.cantidad} onChange={(e) => onChangeLinea(li, 'cantidad', e.target.value)} className="w-full px-2 py-1.5 rounded text-[12px] outline-none bg-white border border-ink-100 text-ink-700 focus:border-rfid dark:bg-ink-700 dark:border-ink-500 dark:text-ink-100" />
            </FormField>
            <button type="button" onClick={() => onDelLinea(li)} disabled={prepack.lineas.length <= 1} title="Eliminar línea" className="w-7 h-7 rounded flex items-center justify-center text-ink-400 hover:bg-anomaly/15 hover:text-anomaly disabled:opacity-30 dark:hover:bg-anomaly/25 mb-1">
              ×
            </button>
          </div>
        ))}

        <div className="flex items-center justify-between pt-1">
          <button type="button" onClick={onAddLinea} className="px-2 py-1 rounded text-[11px] font-semibold text-rfid hover:bg-rfid/10 dark:text-blue-300 dark:hover:bg-rfid/20">
            + Agregar línea
          </button>
          <div className="text-[11px] text-ink-400">
            {piezas} pieza{piezas !== 1 ? 's' : ''} por prepack
            {Number(prepack.copias) > 1 && (
              <span className="text-ink-500 dark:text-ink-300"> · ×{prepack.copias} copias</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Subcomponentes
// ============================================================

function Panel({ title, children }) {
  return (
    <div className="rounded-card border shadow-card overflow-hidden bg-white border-ink-100 dark:bg-ink-700 dark:border-ink-600">
      <div className="px-4 py-2.5 border-b border-ink-100 dark:border-ink-600 font-mono text-[11px] font-bold uppercase tracking-industrial text-ink-400">
        {title}
      </div>
      {children}
    </div>
  );
}

// Paleta cerrada de colores comunes. El valor que se guarda en BD es el
// `nombre` (siempre capitalizado, ej. "Azul") para que el matching sea
// consistente sin importar cómo lo tipee el usuario.
const COLORES_PALETA = [
  { nombre: 'Azul',    hex: '#3B82F6' },
  { nombre: 'Negro',   hex: '#1E293B' },
  { nombre: 'Blanco',  hex: '#F8FAFC' },
  { nombre: 'Rojo',    hex: '#EF4444' },
  { nombre: 'Verde',   hex: '#22C55E' },
  { nombre: 'Amarillo',hex: '#EAB308' },
  { nombre: 'Naranja', hex: '#F97316' },
  { nombre: 'Rosa',    hex: '#EC4899' },
  { nombre: 'Morado',  hex: '#8B5CF6' },
  { nombre: 'Gris',    hex: '#94A3B8' },
  { nombre: 'Beige',   hex: '#D4B896' },
  { nombre: 'Café',    hex: '#92400E' },
  { nombre: 'Navy',    hex: '#1E3A8A' },
  { nombre: 'Camel',   hex: '#C2956A' },
];

/**
 * Selector visual de color. Muestra la paleta cerrada como swatches y un
 * input libre para colores fuera de la lista. Normaliza el valor para que
 * "azul" / "AZUL" / "Azul" se guarden como "Azul" (Title Case).
 *
 * El popover se renderiza con `position: fixed` y coordenadas calculadas
 * desde el rect del trigger, así escapa del `overflow-y-auto` del modal
 * (antes se cortaba cuando el ColorPicker estaba cerca del fondo).
 * Auto-flip: si no cabe abajo abre arriba, si no cabe a la derecha
 * alinea por la derecha.
 */
function ColorPicker({ value, onChange }) {
  const [abierto, setAbierto] = useState(false);
  const [pos, setPos] = useState(null);
  const triggerRef = useRef(null);
  const seleccionado = COLORES_PALETA.find((c) => normalizeColor(c.nombre) === normalizeColor(value));
  const hex = seleccionado?.hex || '#94A3B8';

  const POPOVER_W = 220;
  const POPOVER_H = 200; // estimado: 3 filas swatches + input
  const MARGIN = 8;

  // Calcula coordenadas en `fixed` cada vez que se abre, y al hacer scroll/resize.
  useLayoutEffect(() => {
    if (!abierto) return;
    const recalc = () => {
      const el = triggerRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const cabeAbajo = r.bottom + POPOVER_H + MARGIN <= vh;
      const top = cabeAbajo ? r.bottom + 4 : Math.max(MARGIN, r.top - POPOVER_H - 4);
      const cabeDerecha = r.left + POPOVER_W <= vw - MARGIN;
      const left = cabeDerecha ? r.left : Math.max(MARGIN, r.right - POPOVER_W);
      setPos({ top, left });
    };
    recalc();
    window.addEventListener('scroll', recalc, true); // capture: atrapa scroll del modal interno
    window.addEventListener('resize', recalc);
    return () => {
      window.removeEventListener('scroll', recalc, true);
      window.removeEventListener('resize', recalc);
    };
  }, [abierto]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setAbierto((v) => !v)}
        className="w-full px-2 py-1.5 rounded text-[12px] outline-none bg-white border border-ink-100 text-ink-700 hover:border-rfid focus:border-rfid dark:bg-ink-700 dark:border-ink-500 dark:text-ink-100 flex items-center gap-2"
      >
        <span
          className="w-3.5 h-3.5 rounded-full border border-ink-200 dark:border-ink-500 shrink-0"
          style={{ background: hex }}
        />
        <span className="truncate flex-1 text-left">{value || 'Color...'}</span>
        <span className="text-[8px] opacity-60">▾</span>
      </button>

      {abierto && pos && (
        <>
          {/* Overlay para cerrar al click fuera */}
          <div
            className="fixed inset-0 z-[60]"
            onClick={() => setAbierto(false)}
          />
          {/* Popover en position: fixed con coords calculadas */}
          <div
            className="fixed z-[61] rounded-card border bg-white border-ink-100 shadow-xl dark:bg-ink-700 dark:border-ink-600 p-2"
            style={{ top: pos.top, left: pos.left, width: POPOVER_W }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="grid grid-cols-5 gap-1.5">
              {COLORES_PALETA.map((c) => {
                const activo = normalizeColor(c.nombre) === normalizeColor(value);
                return (
                  <button
                    key={c.nombre}
                    type="button"
                    onClick={() => { onChange(c.nombre); setAbierto(false); }}
                    title={c.nombre}
                    className={`w-9 h-9 rounded-full border-2 transition-transform hover:scale-110 ${activo ? 'border-rfid ring-2 ring-rfid/30' : 'border-ink-200 dark:border-ink-500'}`}
                    style={{ background: c.hex }}
                  />
                );
              })}
            </div>
            <div className="border-t border-ink-100 dark:border-ink-600 mt-2 pt-2">
              <input
                type="text"
                placeholder="Otro color..."
                value={value || ''}
                onChange={(e) => onChange(normalizeColor(e.target.value))}
                className="w-full px-2 py-1 rounded text-[11px] outline-none bg-ink-50 border border-ink-100 text-ink-700 focus:border-rfid dark:bg-ink-800 dark:border-ink-500 dark:text-ink-100"
              />
            </div>
          </div>
        </>
      )}
    </>
  );
}

// "azul", "AZUL", " Azul " → "Azul"
function normalizeColor(s) {
  if (!s) return '';
  const trimmed = s.trim().toLowerCase();
  if (!trimmed) return '';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function FormField({ label, required, compact, children }) {
  return (
    <div>
      {label && (
        <label className={`block font-mono ${compact ? 'text-[9px]' : 'text-[10px]'} font-bold uppercase tracking-industrial text-ink-400 mb-1`}>
          {label}
          {required && <span className="text-anomaly ml-0.5">*</span>}
        </label>
      )}
      {children}
    </div>
  );
}

