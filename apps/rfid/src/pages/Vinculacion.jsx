import { useState } from 'react';
import { haceCuanto, epcCorto } from '../utils/format.js';

/**
 * Form for registering a new RFID tag. With the API layer dropped, submission
 * is purely client-side: the new tag pushes onto a local "recent" list and
 * the form clears. The right column shows the last 10 registered tags from
 * this session.
 *
 * In production, handleSubmit would POST to /api/tags and then re-fetch the
 * recent list.
 */

const TIENDAS_DEMO = [
  { tienda_id: 'TDA-007', nombre: 'Vértice Monterrey Centro' },
  { tienda_id: 'TDA-008', nombre: 'Vértice Monterrey Sur' },
  { tienda_id: 'TDA-015', nombre: 'Vértice San Pedro' },
  { tienda_id: 'TDA-029', nombre: 'Vértice Guadalajara' },
  { tienda_id: 'TDA-033', nombre: 'Vértice CDMX Polanco' },
  { tienda_id: 'TDA-044', nombre: 'Vértice Puebla' },
  { tienda_id: 'TDA-048', nombre: 'Vértice Hermosillo' },
  { tienda_id: 'TDA-051', nombre: 'Vértice Cancún' },
];

const PROVEEDORES_DEMO = [
  { id: 1, codigo: 'PROV-001', nombre: 'Textiles Monterrey SA' },
  { id: 2, codigo: 'PROV-002', nombre: 'Confecciones del Norte' },
  { id: 3, codigo: 'PROV-003', nombre: 'Moda Express MX' },
  { id: 4, codigo: 'PROV-004', nombre: 'ActiveWear CDMX' },
];

const ORDENES_DEMO = [
  'OC-001', 'OC-002', 'OC-003', 'OC-004', 'OC-005',
];

const FORM_INIT = {
  epc: '',
  sku: '',
  talla: 'M',
  color: '',
  cantidad_piezas: 12,
  tienda_id: '',
  proveedor_id: 1,
  orden_id: '',
};

export function Vinculacion() {
  const [form, setForm] = useState(FORM_INIT);
  const [mensaje, setMensaje] = useState(null);
  const [tagsRecientes, setTagsRecientes] = useState([]);

  const set = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = () => {
    if (!form.epc || !form.sku || !form.tienda_id) {
      setMensaje({
        tipo: 'error',
        texto: 'EPC, SKU y Tienda destino son requeridos.',
      });
      return;
    }

    // Mock submission — push to local recent list, clear form.
    const tienda = TIENDAS_DEMO.find((t) => t.tienda_id === form.tienda_id);
    const newTag = {
      epc: form.epc,
      sku: form.sku,
      talla: form.talla,
      color: form.color,
      cantidad_piezas: form.cantidad_piezas,
      tienda: tienda || { tienda_id: form.tienda_id, nombre: form.tienda_id },
      registrado_en: new Date().toISOString(),
    };

    setTagsRecientes((prev) => [newTag, ...prev].slice(0, 10));
    setMensaje({
      tipo: 'exito',
      texto: `Tag ${epcCorto(form.epc)} registrado correctamente.`,
    });
    setForm(FORM_INIT);

    // Clear success message after 4s
    setTimeout(() => setMensaje(null), 4000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[440px_1fr] gap-4 items-start">

      {/* ════════════ FORM ════════════ */}
      <Panel title="Registrar Tag RFID">
        <div className="px-5 py-5 space-y-3.5">

          {/* Message banner */}
          {mensaje && (
            <div className={
              'px-3.5 py-2.5 rounded-card border text-[13px] ' +
              (mensaje.tipo === 'exito'
                ? 'bg-flow-bg border-flow-ring/40 text-flow dark:bg-flow/20 dark:border-flow-ring/40 dark:text-flow-ring'
                : 'bg-anomaly-bg border-anomaly-ring/40 text-anomaly dark:bg-anomaly/20 dark:border-anomaly-ring/40 dark:text-anomaly-ring')
            }>
              <strong className="font-semibold mr-1">
                {mensaje.tipo === 'exito' ? 'Registrado:' : 'Error:'}
              </strong>
              {mensaje.texto}
            </div>
          )}

          <FormField label="EPC del Tag" required>
            <input
              type="text"
              placeholder="EPC-SIM-0000000000000101"
              value={form.epc}
              onChange={(e) => set('epc', e.target.value)}
              className={
                'w-full px-3 py-2 rounded-card text-[12px] font-mono outline-none ' +
                'bg-white border border-ink-100 text-ink-700 placeholder:text-ink-400 ' +
                'focus:border-rfid ' +
                'dark:bg-ink-700 dark:border-ink-500 dark:text-ink-100'
              }
            />
          </FormField>

          <FormField label="SKU del Producto" required>
            <input
              type="text"
              placeholder="BLU-F-M-001"
              value={form.sku}
              onChange={(e) => set('sku', e.target.value)}
              className={
                'w-full px-3 py-2 rounded-card text-[13px] outline-none ' +
                'bg-white border border-ink-100 text-ink-700 placeholder:text-ink-400 ' +
                'focus:border-rfid ' +
                'dark:bg-ink-700 dark:border-ink-500 dark:text-ink-100'
              }
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Talla">
              <select
                value={form.talla}
                onChange={(e) => set('talla', e.target.value)}
                className={
                  'w-full px-3 py-2 rounded-card text-[13px] outline-none ' +
                  'bg-white border border-ink-100 text-ink-700 ' +
                  'focus:border-rfid ' +
                  'dark:bg-ink-700 dark:border-ink-500 dark:text-ink-100'
                }
              >
                {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </FormField>

            <FormField label="Color">
              <input
                type="text"
                placeholder="Ej. Azul"
                value={form.color}
                onChange={(e) => set('color', e.target.value)}
                className={
                  'w-full px-3 py-2 rounded-card text-[13px] outline-none ' +
                  'bg-white border border-ink-100 text-ink-700 placeholder:text-ink-400 ' +
                  'focus:border-rfid ' +
                  'dark:bg-ink-700 dark:border-ink-500 dark:text-ink-100'
                }
              />
            </FormField>
          </div>

          <FormField label="Piezas por Prepack">
            <select
              value={form.cantidad_piezas}
              onChange={(e) => set('cantidad_piezas', parseInt(e.target.value))}
              className={
                'w-full px-3 py-2 rounded-card text-[13px] outline-none ' +
                'bg-white border border-ink-100 text-ink-700 ' +
                'focus:border-rfid ' +
                'dark:bg-ink-700 dark:border-ink-500 dark:text-ink-100'
              }
            >
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
              className={
                'w-full px-3 py-2 rounded-card text-[13px] outline-none ' +
                'bg-white border border-ink-100 text-ink-700 ' +
                'focus:border-rfid ' +
                'dark:bg-ink-700 dark:border-ink-500 dark:text-ink-100'
              }
            >
              <option value="">Seleccionar tienda...</option>
              {TIENDAS_DEMO.map((t) => (
                <option key={t.tienda_id} value={t.tienda_id}>
                  {t.tienda_id} — {t.nombre}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Orden de Compra (opcional)">
            <select
              value={form.orden_id}
              onChange={(e) => set('orden_id', e.target.value)}
              className={
                'w-full px-3 py-2 rounded-card text-[13px] outline-none ' +
                'bg-white border border-ink-100 text-ink-700 ' +
                'focus:border-rfid ' +
                'dark:bg-ink-700 dark:border-ink-500 dark:text-ink-100'
              }
            >
              <option value="">Sin OC asignada</option>
              {ORDENES_DEMO.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Proveedor">
            <select
              value={form.proveedor_id}
              onChange={(e) => set('proveedor_id', parseInt(e.target.value))}
              className={
                'w-full px-3 py-2 rounded-card text-[13px] outline-none ' +
                'bg-white border border-ink-100 text-ink-700 ' +
                'focus:border-rfid ' +
                'dark:bg-ink-700 dark:border-ink-500 dark:text-ink-100'
              }
            >
              {PROVEEDORES_DEMO.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.codigo} — {p.nombre}
                </option>
              ))}
            </select>
          </FormField>

          <button
            type="button"
            onClick={handleSubmit}
            className={
              'w-full px-3 py-2.5 mt-1 rounded-card font-display text-[14px] font-semibold transition-colors ' +
              'bg-rfid text-white hover:bg-blue-700 ' +
              'dark:hover:bg-blue-600'
            }
          >
            Registrar Tag
          </button>
        </div>
      </Panel>

      {/* ════════════ RECENT REGISTRATIONS ════════════ */}
      <Panel title="Últimos Registros">
        {tagsRecientes.length === 0 ? (
          <div className="px-6 py-8 text-center text-[13px] text-ink-400">
            No hay tags registrados aún. Usa el formulario de la izquierda para registrar tu primer tag.
          </div>
        ) : (
          <div>
            {/* Header row */}
            <div className={
              'grid grid-cols-[160px_100px_1fr_90px] gap-2 items-center ' +
              'px-4 py-2 border-b border-ink-100 dark:border-ink-600 ' +
              'bg-ink-50 dark:bg-ink-800 ' +
              'font-mono text-[10px] font-bold uppercase tracking-industrial text-ink-400'
            }>
              <span>EPC</span>
              <span>SKU</span>
              <span>Tienda</span>
              <span>Registro</span>
            </div>
            {tagsRecientes.map((tag, i) => (
              <div
                key={`${tag.epc}-${i}`}
                className={
                  'grid grid-cols-[160px_100px_1fr_90px] gap-2 items-center ' +
                  'px-4 py-2.5 border-b border-ink-100 dark:border-ink-600 text-[13px] ' +
                  (i % 2 === 0
                    ? 'bg-white dark:bg-ink-700'
                    : 'bg-ink-50/40 dark:bg-ink-800/40')
                }
              >
                <span
                  className="font-mono text-[11px] text-ink-700 dark:text-ink-100 truncate"
                  title={tag.epc}
                >
                  {epcCorto(tag.epc)}
                </span>
                <span className="text-ink-700 dark:text-ink-100">{tag.sku}</span>
                <span>
                  <span className={
                    'inline-block px-2 py-0.5 rounded text-[11px] ' +
                    'bg-rfid/10 border border-rfid/30 text-rfid ' +
                    'dark:bg-rfid/20 dark:border-rfid/40 dark:text-blue-300'
                  }>
                    {tag.tienda?.nombre || tag.tienda_id || '—'}
                  </span>
                </span>
                <span className="text-[11px] text-ink-400">
                  {haceCuanto(tag.registrado_en)}
                </span>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// Sub-components
// ════════════════════════════════════════════════════════════════════

function Panel({ title, children }) {
  return (
    <div className={
      'rounded-card border shadow-card overflow-hidden ' +
      'bg-white border-ink-100 ' +
      'dark:bg-ink-700 dark:border-ink-600'
    }>
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
        {required && <span className="text-anomaly dark:text-anomaly-ring ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}
