import { useState, useEffect } from 'react';
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

            {ocActiva && (
              <div className="text-[12px] text-ink-500 dark:text-ink-300 space-y-1">
                <div><strong>Producto:</strong> {ocActiva.nombre_producto}</div>
                {ocActiva.modelo && <div><strong>Modelo:</strong> {ocActiva.modelo}</div>}
                <div><strong>Estado:</strong> {ocActiva.estado}</div>
              </div>
            )}

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
      <div className="font-mono text-[10px] text-ink-700 dark:text-ink-100 truncate mb-1" title={prepack.epc}>
        {pendiente ? <span className="text-ink-400 italic">sin EPC</span> : epcCorto(prepack.epc)}
      </div>
      <div className="text-[11px] text-ink-700 dark:text-ink-100 mb-0.5 font-semibold">
        {prepack.sku}
      </div>
      <div className="text-[10px] text-ink-500 dark:text-ink-300">
        {prepack.talla} · {prepack.color || '—'} · {prepack.cantidad_piezas} pzs
      </div>
      <div className="text-[10px] text-ink-400 mt-1 truncate">
        {prepack.Tienda?.nombre || prepack.tienda_id}
      </div>
    </button>
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

  const handle = async () => {
    setError(null);
    if (!epc.trim()) {
      setError('Captura el EPC del tag físico.');
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
            <div className="text-[11px] text-ink-500 dark:text-ink-300 mb-1">
              {prepack.talla} · {prepack.color || '—'} · {prepack.cantidad_piezas} pzs
            </div>
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
              placeholder="Ej: E2806894…"
              value={epc}
              onChange={(e) => setEpc(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handle()}
              autoFocus
              className="w-full px-3 py-2 rounded-card text-[12px] font-mono outline-none bg-white border border-ink-100 text-ink-700 placeholder:text-ink-400 focus:border-rfid dark:bg-ink-700 dark:border-ink-500 dark:text-ink-100"
            />
          </FormField>
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
  const [renglones, setRenglones] = useState([
    { sku: '', talla: 'M', color: '', piezas_por_prepack: 12, cantidad: 1, tienda_id: tiendas[0]?.tienda_id || '' },
  ]);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const setReng = (idx, k, v) => setRenglones((arr) => arr.map((r, i) => i === idx ? { ...r, [k]: v } : r));
  const addReng = () => setRenglones((arr) => [
    ...arr,
    { sku: '', talla: 'M', color: '', piezas_por_prepack: 12, cantidad: 1, tienda_id: tiendas[0]?.tienda_id || '' },
  ]);
  const delReng = (idx) => setRenglones((arr) => arr.length <= 1 ? arr : arr.filter((_, i) => i !== idx));

  const totalPrepacks = renglones.reduce((acc, r) => acc + (Number(r.cantidad) || 0), 0);
  const totalPiezas = renglones.reduce((acc, r) => acc + (Number(r.cantidad) || 0) * (Number(r.piezas_por_prepack) || 0), 0);

  const handle = async () => {
    setError(null);
    if (!form.proveedor_id || !form.nombre_producto.trim()) {
      setError('Proveedor y nombre del producto son requeridos.');
      return;
    }
    for (const [i, r] of renglones.entries()) {
      if (!r.sku.trim() || !r.tienda_id || Number(r.cantidad) <= 0 || Number(r.piezas_por_prepack) <= 0) {
        setError(`Renglón ${i + 1}: SKU, tienda, cantidad y piezas son requeridos.`);
        return;
      }
    }
    setEnviando(true);
    try {
      const res = await realApi.crearOrdenCompra({
        proveedor_id: parseInt(form.proveedor_id, 10),
        nombre_producto: form.nombre_producto.trim(),
        modelo: form.modelo.trim() || null,
        numero_palets: parseInt(form.numero_palets, 10),
        detalles: renglones.map((r) => ({
          sku: r.sku.trim(),
          talla: r.talla,
          color: r.color.trim() || null,
          piezas_por_prepack: parseInt(r.piezas_por_prepack, 10),
          cantidad: parseInt(r.cantidad, 10),
          tienda_id: r.tienda_id,
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

          {/* Renglones */}
          <div className="border-t border-ink-100 dark:border-ink-600 pt-3">
            <div className="flex items-center justify-between mb-2">
              <div className="font-mono text-[10px] font-bold uppercase tracking-industrial text-ink-400">
                Desglose de prepacks ({renglones.length} renglón{renglones.length !== 1 ? 'es' : ''})
              </div>
              <button type="button" onClick={addReng} className="px-2 py-1 rounded-card text-[11px] font-semibold bg-rfid/10 text-rfid border border-rfid/30 hover:bg-rfid/20 dark:bg-rfid/20 dark:text-blue-300">
                + Agregar renglón
              </button>
            </div>

            <div className="space-y-2">
              {renglones.map((r, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_60px_80px_70px_70px_1fr_28px] gap-2 items-end p-2 rounded-card bg-ink-50 dark:bg-ink-800">
                  <FormField label={idx === 0 ? 'SKU' : null} compact required>
                    <input type="text" placeholder="PLY-001" value={r.sku} onChange={(e) => setReng(idx, 'sku', e.target.value)} className="w-full px-2 py-1.5 rounded text-[12px] outline-none bg-white border border-ink-100 text-ink-700 focus:border-rfid dark:bg-ink-700 dark:border-ink-500 dark:text-ink-100" />
                  </FormField>
                  <FormField label={idx === 0 ? 'Talla' : null} compact>
                    <select value={r.talla} onChange={(e) => setReng(idx, 'talla', e.target.value)} className="w-full px-2 py-1.5 rounded text-[12px] outline-none bg-white border border-ink-100 text-ink-700 focus:border-rfid dark:bg-ink-700 dark:border-ink-500 dark:text-ink-100">
                      {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </FormField>
                  <FormField label={idx === 0 ? 'Color' : null} compact>
                    <input type="text" placeholder="Azul" value={r.color} onChange={(e) => setReng(idx, 'color', e.target.value)} className="w-full px-2 py-1.5 rounded text-[12px] outline-none bg-white border border-ink-100 text-ink-700 placeholder:text-ink-400 focus:border-rfid dark:bg-ink-700 dark:border-ink-500 dark:text-ink-100" />
                  </FormField>
                  <FormField label={idx === 0 ? 'Pzs/prepack' : null} compact required>
                    <input type="number" min="1" value={r.piezas_por_prepack} onChange={(e) => setReng(idx, 'piezas_por_prepack', e.target.value)} className="w-full px-2 py-1.5 rounded text-[12px] outline-none bg-white border border-ink-100 text-ink-700 focus:border-rfid dark:bg-ink-700 dark:border-ink-500 dark:text-ink-100" />
                  </FormField>
                  <FormField label={idx === 0 ? '# Prepacks' : null} compact required>
                    <input type="number" min="1" value={r.cantidad} onChange={(e) => setReng(idx, 'cantidad', e.target.value)} className="w-full px-2 py-1.5 rounded text-[12px] outline-none bg-white border border-ink-100 text-ink-700 focus:border-rfid dark:bg-ink-700 dark:border-ink-500 dark:text-ink-100" />
                  </FormField>
                  <FormField label={idx === 0 ? 'Tienda destino' : null} compact required>
                    <select value={r.tienda_id} onChange={(e) => setReng(idx, 'tienda_id', e.target.value)} className="w-full px-2 py-1.5 rounded text-[12px] outline-none bg-white border border-ink-100 text-ink-700 focus:border-rfid dark:bg-ink-700 dark:border-ink-500 dark:text-ink-100">
                      <option value="">Seleccionar...</option>
                      {tiendas.map((t) => <option key={t.tienda_id} value={t.tienda_id}>{t.tienda_id}</option>)}
                    </select>
                  </FormField>
                  <button type="button" onClick={() => delReng(idx)} disabled={renglones.length <= 1} className="w-7 h-7 rounded flex items-center justify-center text-anomaly hover:bg-anomaly/15 disabled:opacity-30 dark:text-anomaly-ring dark:hover:bg-anomaly/25 mb-1">
                    ×
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-3 px-3 py-2 rounded-card bg-rfid/5 border border-rfid/20 text-[12px] text-ink-700 dark:bg-rfid/15 dark:text-ink-100 dark:border-rfid/30">
              <strong>Total a crear:</strong> {totalPrepacks} prepacks ({totalPiezas} piezas) distribuidos en {form.numero_palets} palet{form.numero_palets > 1 ? 's' : ''}.
            </div>
          </div>
        </div>

        <div className="flex gap-2 px-5 py-3 border-t border-ink-100 dark:border-ink-600 sticky bottom-0 bg-white dark:bg-ink-700">
          <button type="button" onClick={onClose} disabled={enviando} className="flex-1 px-3 py-2 rounded-card text-[13px] font-semibold bg-ink-50 text-ink-500 hover:bg-ink-100 disabled:opacity-50 dark:bg-ink-600 dark:text-ink-200 dark:hover:bg-ink-500">
            Cancelar
          </button>
          <button type="button" onClick={handle} disabled={enviando} className="flex-1 px-3 py-2 rounded-card text-[13px] font-semibold bg-rfid text-white hover:bg-blue-700 disabled:opacity-50">
            {enviando ? 'Creando...' : `Crear OC con ${totalPrepacks} prepacks`}
          </button>
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
