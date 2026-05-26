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
  proveedor_id: null,
};

export function Vinculacion() {
  const [form, setForm] = useState(FORM_INIT);
  const [mensaje, setMensaje] = useState(null);
  const [tagsRecientes, setTagsRecientes] = useState([]);
  const [tiendas, setTiendas] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    cargarCatalogos();
    cargarTagsRecientes();
  }, []);

  async function cargarCatalogos() {
    try {
      const [tiendasData, proveedoresData] = await Promise.all([
        realApi.getTiendas(),
        realApi.getProveedores()
      ]);
      setTiendas(tiendasData);
      setProveedores(proveedoresData);
      if (proveedoresData.length > 0 && !form.proveedor_id) {
        setForm(prev => ({ ...prev, proveedor_id: proveedoresData[0].id }));
      }
    } catch (error) {
      console.error('Error cargando catálogos:', error);
    }
  }

  async function cargarTagsRecientes() {
    try {
      const tags = await realApi.getTags();
      setTagsRecientes(tags.slice(0, 10));
    } catch (error) {
      console.error('Error cargando tags:', error);
    }
  }

  const set = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    if (!form.epc || !form.sku || !form.tienda_id) {
      setMensaje({ tipo: 'error', texto: 'EPC, SKU y Tienda destino son requeridos.' });
      return;
    }

    setCargando(true);

    try {
      await realApi.crearTag({
        epc: form.epc,
        sku: form.sku,
        talla: form.talla,
        color: form.color,
        cantidad_piezas: form.cantidad_piezas,
        tienda_id: form.tienda_id,
        proveedor_id: form.proveedor_id,
        tipo_flujo: 'CROSS_DOCK'
      });

      setMensaje({ tipo: 'exito', texto: `Tag ${epcCorto(form.epc)} registrado correctamente.` });
      setForm(FORM_INIT);
      if (proveedores.length > 0) {
        setForm(prev => ({ ...prev, proveedor_id: proveedores[0].id }));
      }
      await cargarTagsRecientes();

      setTimeout(() => setMensaje(null), 4000);
    } catch (error) {
      setMensaje({ tipo: 'error', texto: `Error al registrar: ${error.message || 'Intenta de nuevo'}` });
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[440px_1fr] gap-4 items-start">

      {/* FORMULARIO */}
      <Panel title="Registrar Tag RFID">
        <div className="px-5 py-5 space-y-3.5">

          {mensaje && (
            <div className={`px-3.5 py-2.5 rounded-card border text-[13px] ${
              mensaje.tipo === 'exito'
                ? 'bg-flow-bg border-flow-ring/40 text-flow'
                : 'bg-anomaly-bg border-anomaly-ring/40 text-anomaly'
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
            <select value={form.cantidad_piezas} onChange={(e) => set('cantidad_piezas', parseInt(e.target.value))} className="w-full px-3 py-2 rounded-card text-[13px] outline-none bg-white border border-ink-100 text-ink-700 focus:border-rfid dark:bg-ink-700 dark:border-ink-500 dark:text-ink-100">
              <option value={6}>6 piezas</option>
              <option value={12}>12 piezas</option>
              <option value={24}>24 piezas</option>
              <option value={48}>48 piezas</option>
            </select>
          </FormField>

          <FormField label="Tienda Destino" required>
            <select value={form.tienda_id} onChange={(e) => set('tienda_id', e.target.value)} className="w-full px-3 py-2 rounded-card text-[13px] outline-none bg-white border border-ink-100 text-ink-700 focus:border-rfid dark:bg-ink-700 dark:border-ink-500 dark:text-ink-100">
              <option value="">Seleccionar tienda...</option>
              {tiendas.map(t => <option key={t.tienda_id} value={t.tienda_id}>{t.tienda_id} — {t.nombre}</option>)}
            </select>
          </FormField>

          <FormField label="Proveedor">
            <select value={form.proveedor_id || ''} onChange={(e) => set('proveedor_id', parseInt(e.target.value))} className="w-full px-3 py-2 rounded-card text-[13px] outline-none bg-white border border-ink-100 text-ink-700 focus:border-rfid dark:bg-ink-700 dark:border-ink-500 dark:text-ink-100">
              {proveedores.map(p => <option key={p.id} value={p.id}>{p.codigo} — {p.nombre}</option>)}
            </select>
          </FormField>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={cargando}
            className="w-full px-3 py-2.5 mt-1 rounded-card font-display text-[14px] font-semibold transition-colors bg-rfid text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {cargando ? 'Registrando...' : 'Registrar Tag'}
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
            <div className="grid grid-cols-[160px_100px_1fr_90px] gap-2 items-center px-4 py-2 border-b border-ink-100 bg-ink-50 font-mono text-[10px] font-bold uppercase tracking-industrial text-ink-400">
              <span>EPC</span><span>SKU</span><span>Tienda</span><span>Registro</span>
            </div>
            {tagsRecientes.map((tag, i) => (
              <div key={tag.epc} className={`grid grid-cols-[160px_100px_1fr_90px] gap-2 items-center px-4 py-2.5 border-b border-ink-100 text-[13px] ${i % 2 === 0 ? 'bg-white' : 'bg-ink-50/40'}`}>
                <span className="font-mono text-[11px] text-ink-700 truncate">{epcCorto(tag.epc)}</span>
                <span className="text-ink-700">{tag.sku}</span>
                <span><span className="inline-block px-2 py-0.5 rounded text-[11px] bg-rfid/10 border border-rfid/30 text-rfid">{tag.tienda_id || '—'}</span></span>
                <span className="text-[11px] text-ink-400">{haceCuanto(tag.registrado_en || new Date())}</span>
              </div>
            ))}
          </div>
        )}
      </Panel>
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