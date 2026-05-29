import { useState, useEffect } from 'react';
import { haceCuanto, epcCorto } from '../utils/format.js';
import { realApi } from '../services/realApi.js';

const FORM_INIT = {
  epc: '',
  sku: '',
  talla: 'M',
  color: '',
  cantidad_piezas: 12,
  tienda_id: '',
  proveedor_id: '',
  palet_id: '',
};

export function Vinculacion() {
  const [form, setForm] = useState(FORM_INIT);
  const [mensaje, setMensaje] = useState(null);
  const [tagsRecientes, setTagsRecientes] = useState([]);
  const [tiendas, setTiendas] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [palets, setPalets] = useState([]);
  const [cargandoCatalogos, setCargandoCatalogos] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [errorCatalogos, setErrorCatalogos] = useState(null);
  const [modalNuevaOC, setModalNuevaOC] = useState(false);

  useEffect(() => {
    cargarCatalogos();
    cargarTagsRecientes();
  }, []);

  async function cargarCatalogos() {
    setCargandoCatalogos(true);
    setErrorCatalogos(null);
    try {
      const [tiendasData, proveedoresData, paletsData] = await Promise.all([
        realApi.getTiendas(),
        realApi.getProveedores(),
        realApi.getPalets(),
      ]);
      setTiendas(tiendasData || []);
      setProveedores(proveedoresData || []);
      setPalets(paletsData || []);
      if (proveedoresData?.length > 0) {
        setForm((prev) => ({ ...prev, proveedor_id: proveedoresData[0].id }));
      }
    } catch (err) {
      setErrorCatalogos(err.message);
    } finally {
      setCargandoCatalogos(false);
    }
  }

  async function cargarTagsRecientes() {
    try {
      const tags = await realApi.getTagsRecientes(10);
      setTagsRecientes(tags || []);
    } catch (err) {
      console.error('Error cargando tags recientes:', err.message);
    }
  }

  const set = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  function validarFormulario() {
    const errores = [];
    if (!form.epc.trim()) errores.push('EPC');
    if (!form.sku.trim()) errores.push('SKU');
    if (!form.tienda_id) errores.push('Tienda');
    if (!form.proveedor_id) errores.push('Proveedor');
    if (!form.palet_id) errores.push('Palet / OC');
    return errores;
  }

  const handleSubmit = async () => {
    const faltantes = validarFormulario();
    if (faltantes.length > 0) {
      setMensaje({
        tipo: 'error',
        texto: `Campos requeridos: ${faltantes.join(', ')}.`,
      });
      return;
    }

    setEnviando(true);
    setMensaje(null);

    try {
      const payload = {
        epc: form.epc.trim(),
        sku: form.sku.trim(),
        talla: form.talla,
        color: form.color.trim() || null,
        cantidad_piezas: form.cantidad_piezas,
        tienda_id: form.tienda_id,
        proveedor_id: parseInt(form.proveedor_id, 10),
        palet_id: form.palet_id || null,
        tipo_flujo: 'CROSS_DOCK',
      };

      await realApi.crearTag(payload);

      setMensaje({
        tipo: 'exito',
        texto: `Tag ${epcCorto(payload.epc)} registrado correctamente.`,
      });
      setForm({
        ...FORM_INIT,
        proveedor_id: proveedores[0]?.id || '',
        palet_id: form.palet_id, // mantiene el palet seleccionado para registros sucesivos
      });
      await cargarTagsRecientes();
      setTimeout(() => setMensaje(null), 4000);
    } catch (err) {
      setMensaje({
        tipo: 'error',
        texto: traducirError(err),
      });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[440px_1fr] gap-4 items-start">

      {/* FORMULARIO */}
      <Panel title="Registrar Tag RFID">
        <div className="px-5 py-5 space-y-3.5">

          {errorCatalogos && (
            <div className="px-3.5 py-2.5 rounded-card border text-[13px] bg-anomaly-bg border-anomaly-ring/40 text-anomaly dark:bg-anomaly/20 dark:border-anomaly-ring/40 dark:text-anomaly-ring">
              <strong className="font-semibold mr-1">⚠</strong>
              No se pudieron cargar tiendas/proveedores: {errorCatalogos}
              <button onClick={cargarCatalogos} className="ml-2 underline">Reintentar</button>
            </div>
          )}

          {mensaje && (
            <div className={`px-3.5 py-2.5 rounded-card border text-[13px] ${
              mensaje.tipo === 'exito'
                ? 'bg-flow-bg border-flow-ring/40 text-flow dark:bg-flow/20 dark:border-flow-ring/40 dark:text-flow-ring'
                : 'bg-anomaly-bg border-anomaly-ring/40 text-anomaly dark:bg-anomaly/20 dark:border-anomaly-ring/40 dark:text-anomaly-ring'
            }`}>
              <strong className="font-semibold mr-1">{mensaje.tipo === 'exito' ? '✓' : '✗'}</strong>
              {mensaje.texto}
            </div>
          )}

          <FormField label="EPC del Tag" required>
            <input
              type="text"
              placeholder="RFID001"
              value={form.epc}
              onChange={(e) => set('epc', e.target.value)}
              className="w-full px-3 py-2 rounded-card text-[12px] font-mono outline-none bg-white border border-ink-100 text-ink-700 placeholder:text-ink-400 focus:border-rfid dark:bg-ink-700 dark:border-ink-500 dark:text-ink-100"
            />
          </FormField>

          <FormField label="SKU del Producto" required>
            <input
              type="text"
              placeholder="PLAYERA-001"
              value={form.sku}
              onChange={(e) => set('sku', e.target.value)}
              className="w-full px-3 py-2 rounded-card text-[13px] outline-none bg-white border border-ink-100 text-ink-700 placeholder:text-ink-400 focus:border-rfid dark:bg-ink-700 dark:border-ink-500 dark:text-ink-100"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Talla">
              <select value={form.talla} onChange={(e) => set('talla', e.target.value)} className="w-full px-3 py-2 rounded-card text-[13px] outline-none bg-white border border-ink-100 text-ink-700 focus:border-rfid dark:bg-ink-700 dark:border-ink-500 dark:text-ink-100">
                {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </FormField>
            <FormField label="Color">
              <input type="text" placeholder="Azul" value={form.color} onChange={(e) => set('color', e.target.value)} className="w-full px-3 py-2 rounded-card text-[13px] outline-none bg-white border border-ink-100 text-ink-700 placeholder:text-ink-400 focus:border-rfid dark:bg-ink-700 dark:border-ink-500 dark:text-ink-100" />
            </FormField>
          </div>

          <FormField label="Piezas por Prepack">
            <select value={form.cantidad_piezas} onChange={(e) => set('cantidad_piezas', parseInt(e.target.value, 10))} className="w-full px-3 py-2 rounded-card text-[13px] outline-none bg-white border border-ink-100 text-ink-700 focus:border-rfid dark:bg-ink-700 dark:border-ink-500 dark:text-ink-100">
              <option value={6}>6 piezas</option>
              <option value={12}>12 piezas</option>
              <option value={24}>24 piezas</option>
              <option value={48}>48 piezas</option>
            </select>
          </FormField>

          <FormField label="Tienda Destino" required>
            <select
              value={form.tienda_id}
              onChange={(e) => set('tienda_id', e.target.value)}
              disabled={cargandoCatalogos || tiendas.length === 0}
              className="w-full px-3 py-2 rounded-card text-[13px] outline-none bg-white border border-ink-100 text-ink-700 focus:border-rfid disabled:opacity-50 dark:bg-ink-700 dark:border-ink-500 dark:text-ink-100"
            >
              <option value="">{cargandoCatalogos ? 'Cargando...' : 'Seleccionar tienda...'}</option>
              {tiendas.map(t => <option key={t.tienda_id} value={t.tienda_id}>{t.tienda_id} — {t.nombre}</option>)}
            </select>
          </FormField>

          <FormField label="Proveedor" required>
            <select
              value={form.proveedor_id}
              onChange={(e) => set('proveedor_id', e.target.value)}
              disabled={cargandoCatalogos || proveedores.length === 0}
              className="w-full px-3 py-2 rounded-card text-[13px] outline-none bg-white border border-ink-100 text-ink-700 focus:border-rfid disabled:opacity-50 dark:bg-ink-700 dark:border-ink-500 dark:text-ink-100"
            >
              <option value="">{cargandoCatalogos ? 'Cargando...' : 'Seleccionar proveedor...'}</option>
              {proveedores.map(p => <option key={p.id} value={p.id}>{p.codigo} — {p.nombre}</option>)}
            </select>
          </FormField>

          <FormField label="Palet / Orden de Compra" required>
            <div className="flex gap-2">
              <select
                value={form.palet_id}
                onChange={(e) => set('palet_id', e.target.value)}
                disabled={cargandoCatalogos}
                className="flex-1 px-3 py-2 rounded-card text-[13px] outline-none bg-white border border-ink-100 text-ink-700 focus:border-rfid disabled:opacity-50 dark:bg-ink-700 dark:border-ink-500 dark:text-ink-100"
              >
                <option value="">{cargandoCatalogos ? 'Cargando...' : 'Seleccionar palet / OC...'}</option>
                {palets.map(p => (
                  <option key={p.palet_id} value={p.palet_id}>
                    {p.palet_id}
                    {p.OrdenCompra?.nombre_producto ? ` — ${p.OrdenCompra.nombre_producto} (${p.OrdenCompra.orden_id})` : ''}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setModalNuevaOC(true)}
                disabled={cargandoCatalogos || proveedores.length === 0}
                title="Crear nueva orden de compra"
                className="px-3 rounded-card text-[13px] font-semibold bg-rfid/10 text-rfid border border-rfid/30 hover:bg-rfid/20 disabled:opacity-50 dark:bg-rfid/20 dark:text-blue-300 dark:border-rfid/40"
              >
                + Nueva OC
              </button>
            </div>
          </FormField>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={enviando || cargandoCatalogos}
            className="w-full px-3 py-2.5 mt-1 rounded-card font-display text-[14px] font-semibold transition-colors bg-rfid text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {enviando ? 'Registrando...' : 'Registrar Tag'}
          </button>
        </div>
      </Panel>

      {/* LISTA DE ÚLTIMOS REGISTROS */}
      <Panel title="Últimos Registros">
        {tagsRecientes.length === 0 ? (
          <div className="px-6 py-8 text-center text-[13px] text-ink-400">
            No hay tags registrados aún.
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-[160px_100px_1fr_90px] gap-2 items-center px-4 py-2 border-b border-ink-100 bg-ink-50 font-mono text-[10px] font-bold uppercase tracking-industrial text-ink-400 dark:border-ink-600 dark:bg-ink-800">
              <span>EPC</span><span>SKU</span><span>Tienda</span><span>Registro</span>
            </div>
            {tagsRecientes.map((tag, i) => (
              <div key={tag.epc} className={`grid grid-cols-[160px_100px_1fr_90px] gap-2 items-center px-4 py-2.5 border-b border-ink-100 text-[13px] dark:border-ink-600 ${i % 2 === 0 ? 'bg-white dark:bg-ink-700' : 'bg-ink-50/40 dark:bg-ink-800/40'}`}>
                <span className="font-mono text-[11px] text-ink-700 dark:text-ink-100 truncate">{epcCorto(tag.epc)}</span>
                <span className="text-ink-700 dark:text-ink-100">{tag.sku}</span>
                <span><span className="inline-block px-2 py-0.5 rounded text-[11px] bg-rfid/10 border border-rfid/30 text-rfid dark:bg-rfid/20 dark:text-blue-300">{tag.tienda_id || '—'}</span></span>
                <span className="text-[11px] text-ink-400">{haceCuanto(tag.registrado_en || tag.createdAt || new Date())}</span>
              </div>
            ))}
          </div>
        )}
      </Panel>

      {modalNuevaOC && (
        <ModalNuevaOC
          proveedores={proveedores}
          onClose={() => setModalNuevaOC(false)}
          onCreada={async (palet_id) => {
            await cargarCatalogos();
            setForm((prev) => ({ ...prev, palet_id }));
            setModalNuevaOC(false);
            setMensaje({ tipo: 'exito', texto: `Nueva OC creada y seleccionada (${palet_id}).` });
            setTimeout(() => setMensaje(null), 4000);
          }}
        />
      )}
    </div>
  );
}

/**
 * Modal para crear OC + Pedido + Palet en un solo paso.
 * Pega a POST /rfid/orden-compra.
 */
function ModalNuevaOC({ proveedores, onClose, onCreada }) {
  const [form, setForm] = useState({
    proveedor_id: proveedores[0]?.id || '',
    nombre_producto: '',
    modelo: '',
    total_esperados: 10,
  });
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleCrear = async () => {
    setError(null);
    if (!form.proveedor_id || !form.nombre_producto.trim() || !form.total_esperados) {
      setError('Proveedor, nombre del producto y total son requeridos.');
      return;
    }
    setEnviando(true);
    try {
      const res = await realApi.crearOrdenCompra({
        proveedor_id: parseInt(form.proveedor_id, 10),
        nombre_producto: form.nombre_producto.trim(),
        modelo: form.modelo.trim() || null,
        total_esperados: parseInt(form.total_esperados, 10),
      });
      await onCreada(res.palet.palet_id);
    } catch (err) {
      setError(err.message || 'Error al crear la OC');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-[460px] max-w-[92vw] rounded-card border bg-white border-ink-100 shadow-xl dark:bg-ink-700 dark:border-ink-600"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-ink-100 dark:border-ink-600">
          <div className="font-display text-[14px] font-bold text-ink-700 dark:text-ink-100">
            Crear nueva orden de compra
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded flex items-center justify-center text-lg text-ink-400 hover:bg-ink-50 dark:hover:bg-ink-600"
          >
            ×
          </button>
        </div>

        <div className="px-5 py-4 space-y-3">
          {error && (
            <div className="px-3 py-2 rounded-card border text-[13px] bg-anomaly-bg border-anomaly-ring/40 text-anomaly dark:bg-anomaly/20 dark:border-anomaly-ring/40 dark:text-anomaly-ring">
              {error}
            </div>
          )}

          <FormField label="Proveedor" required>
            <select
              value={form.proveedor_id}
              onChange={(e) => set('proveedor_id', e.target.value)}
              className="w-full px-3 py-2 rounded-card text-[13px] outline-none bg-white border border-ink-100 text-ink-700 focus:border-rfid dark:bg-ink-700 dark:border-ink-500 dark:text-ink-100"
            >
              <option value="">Seleccionar...</option>
              {proveedores.map((p) => (
                <option key={p.id} value={p.id}>{p.codigo} — {p.nombre}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Nombre del producto" required>
            <input
              type="text"
              placeholder="Playera básica algodón"
              value={form.nombre_producto}
              onChange={(e) => set('nombre_producto', e.target.value)}
              className="w-full px-3 py-2 rounded-card text-[13px] outline-none bg-white border border-ink-100 text-ink-700 placeholder:text-ink-400 focus:border-rfid dark:bg-ink-700 dark:border-ink-500 dark:text-ink-100"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Modelo">
              <input
                type="text"
                placeholder="PLAYERA-V1"
                value={form.modelo}
                onChange={(e) => set('modelo', e.target.value)}
                className="w-full px-3 py-2 rounded-card text-[13px] outline-none bg-white border border-ink-100 text-ink-700 placeholder:text-ink-400 focus:border-rfid dark:bg-ink-700 dark:border-ink-500 dark:text-ink-100"
              />
            </FormField>
            <FormField label="Total esperado" required>
              <input
                type="number"
                min="1"
                value={form.total_esperados}
                onChange={(e) => set('total_esperados', e.target.value)}
                className="w-full px-3 py-2 rounded-card text-[13px] outline-none bg-white border border-ink-100 text-ink-700 focus:border-rfid dark:bg-ink-700 dark:border-ink-500 dark:text-ink-100"
              />
            </FormField>
          </div>

          <div className="text-[11px] text-ink-400 dark:text-ink-300 mt-1">
            Se generarán automáticamente: pedido, orden de compra y palet con IDs únicos.
          </div>
        </div>

        <div className="flex gap-2 px-5 py-3 border-t border-ink-100 dark:border-ink-600">
          <button
            type="button"
            onClick={onClose}
            disabled={enviando}
            className="flex-1 px-3 py-2 rounded-card text-[13px] font-semibold bg-ink-50 text-ink-500 hover:bg-ink-100 disabled:opacity-50 dark:bg-ink-600 dark:text-ink-200 dark:hover:bg-ink-500"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleCrear}
            disabled={enviando}
            className="flex-1 px-3 py-2 rounded-card text-[13px] font-semibold bg-rfid text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {enviando ? 'Creando...' : 'Crear OC'}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Traduce los códigos de error del backend a mensajes amables.
 * El backend manda { error: "epc_duplicado", message: "...", detalle: "..." }
 * y realApi lo convierte en Error con err.message (humano) y err.code (codigo).
 */
function traducirError(err) {
  const code = err.code || '';
  const msg = err.message || 'Error desconocido';
  switch (code) {
    case 'epc_duplicado':
      return 'Ya existe un tag con ese EPC. Usa uno distinto.';
    case 'fk_invalida':
      return `Referencia inválida: ${err.detalle || msg}. Verifica que la tienda/proveedor existan.`;
    case 'campos_requeridos':
      return `Faltan campos: ${Array.isArray(err.detalle) ? err.detalle.join(', ') : msg}.`;
    case 'validacion':
      return `Datos inválidos: ${msg}.`;
    default:
      return msg;
  }
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

function FormField({ label, required, children }) {
  return (
    <div>
      <label className="block font-mono text-[10px] font-bold uppercase tracking-industrial text-ink-400 mb-1.5">
        {label}
        {required && <span className="text-anomaly ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}
