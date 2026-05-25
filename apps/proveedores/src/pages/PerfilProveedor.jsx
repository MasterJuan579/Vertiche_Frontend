import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { NivelBadge } from '../components/NivelBadge.jsx';
import { Stars } from '../components/Stars.jsx';
import { Sparkline } from '../components/Sparkline.jsx';
import {
  SUPPLIERS_INITIAL,
  SUPPLIER_PROFILES,
  accionSistema,
} from '../data/demoData.js';

/**
 * Supplier detail page. The supplier ID comes from the URL:
 *   /proveedores/:proveedorId
 *
 * Picking a different supplier from the dropdown navigates to that supplier's
 * URL — the route IS the state. This makes the page shareable and back-button
 * friendly.
 */

const ACTION_BOX = {
  elite: {
    box:    'bg-flow-bg border-flow-ring/40 dark:bg-flow/15 dark:border-flow-ring/50',
    text:   'text-flow dark:text-flow-ring',
    icon:   '✅',
  },
  media: {
    box:    'bg-attention-bg border-attention-ring/40 dark:bg-attention/15 dark:border-attention-ring/50',
    text:   'text-attention dark:text-attention-ring',
    icon:   '⚠️',
  },
  baja: {
    box:    'bg-anomaly-bg border-anomaly-ring/40 dark:bg-anomaly/15 dark:border-anomaly-ring/50',
    text:   'text-anomaly dark:text-anomaly-ring',
    icon:   '🚨',
  },
  nuevo: {
    box:    'bg-blue-50 border-rfid/40 dark:bg-rfid/15 dark:border-rfid/50',
    text:   'text-rfid dark:text-blue-300',
    icon:   '🆕',
  },
};

const RESULT_PILL = {
  ok:   { cls: 'bg-flow-bg text-flow border-flow-ring/30 dark:bg-flow/20 dark:text-flow-ring dark:border-flow-ring/40',          label: 'Aprobado'  },
  warn: { cls: 'bg-attention-bg text-attention border-attention-ring/30 dark:bg-attention/20 dark:text-attention-ring dark:border-attention-ring/40', label: 'Observado' },
  fail: { cls: 'bg-anomaly-bg text-anomaly border-anomaly-ring/30 dark:bg-anomaly/20 dark:text-anomaly-ring dark:border-anomaly-ring/40',             label: 'Rechazado' },
};

const KPI_COLOR_CLS = {
  default: 'text-ink-700 dark:text-ink-100',
  green:   'text-flow dark:text-flow-ring',
  red:     'text-anomaly dark:text-anomaly-ring',
  blue:    'text-rfid dark:text-blue-300',
};

export function PerfilProveedor() {
  const { proveedorId } = useParams();
  const navigate = useNavigate();

  const id = parseInt(proveedorId, 10);
  const supplier = SUPPLIERS_INITIAL.find((s) => s.id === id);

  // Unknown ID → bounce to the list. Could also render a 404 page; the
  // list is friendlier for now.
  if (!supplier) {
    return <Navigate to="/proveedores/resumen" replace />;
  }

  const profile = SUPPLIER_PROFILES[id] || SUPPLIER_PROFILES[1];
  const acc = accionSistema(supplier.stars);
  const actionStyle = ACTION_BOX[acc.cls] || ACTION_BOX.nuevo;

  const kpis = [
    { label: 'Entregas YTD',       value: profile.deliveries,         color: 'default' },
    { label: 'Tasa de aprobación', value: `${profile.approval}%`,     color: 'green'   },
    { label: 'Defectos detectados', value: profile.defects,           color: 'red'     },
    { label: 'Lead time promedio', value: `${profile.leadtime} días`, color: 'blue'    },
  ];

  const commercialFields = [
    { label: 'Categoría',        value: profile.category },
    { label: 'Proveedor desde',  value: profile.since,    mono: true },
    { label: 'Contacto',         value: profile.contact },
    { label: 'Teléfono',         value: profile.phone,    mono: true },
    { label: 'Email',            value: profile.email,    mono: true },
    { label: 'Términos de pago', value: profile.paymentTerms },
  ];

  return (
    <div className="px-8 py-5 max-w-[1400px] mx-auto">

      {/* Supplier picker — navigates instead of setting state */}
      <div className="mb-4 p-4 bg-white border border-ink-100 rounded-card flex items-center gap-3 shadow-card dark:bg-ink-700 dark:border-ink-600">
        <div className="text-[11px] font-display font-medium uppercase tracking-industrial text-ink-400">
          Proveedor:
        </div>
        <select
          value={id}
          onChange={(e) => navigate(`/proveedores/${e.target.value}`)}
          className={
            'max-w-xs px-3 py-2 rounded-card text-[13px] outline-none ' +
            'bg-ink-50 border border-ink-100 text-ink-700 ' +
            'dark:bg-ink-600 dark:border-ink-500 dark:text-ink-100'
          }
        >
          {SUPPLIERS_INITIAL.map((x) => (
            <option key={x.id} value={x.id}>{x.name}</option>
          ))}
        </select>
      </div>

      {/* Header card */}
      <div className={
        'mb-4 p-6 rounded-card border border-ink-100 shadow-card flex items-center gap-5 ' +
        'bg-gradient-to-br from-white to-ink-50 ' +
        'dark:from-ink-700 dark:to-ink-600 dark:border-ink-600'
      }>
        <div className={
          'shrink-0 w-[72px] h-[72px] rounded-card flex items-center justify-center text-3xl ' +
          'bg-ink-50 border-2 border-ink-100 ' +
          'dark:bg-ink-600 dark:border-ink-500'
        }>
          🏭
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-display text-[26px] font-semibold text-ink-700 dark:text-ink-100 mb-1">
            {supplier.name}
          </div>
          <div className="font-mono text-[13px] text-ink-400 mb-2 truncate">
            {profile.rfc} · {supplier.origin}
          </div>
          <NivelBadge level={supplier.level} color={supplier.color} />
        </div>
        <div className="shrink-0 text-right">
          <div className="font-mono text-[36px] font-semibold text-amber-500 dark:text-amber-400 leading-none">
            {supplier.stars.toFixed(1)}
          </div>
          <div className="mt-1.5 flex justify-end">
            <Stars rating={supplier.stars} size={14} />
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        {kpis.map((k) => (
          <div
            key={k.label}
            className="bg-white border border-ink-100 rounded-card p-4 shadow-card dark:bg-ink-700 dark:border-ink-600"
          >
            <div className="text-[10px] font-display font-medium uppercase tracking-industrial text-ink-400 mb-1.5">
              {k.label}
            </div>
            <div className={'font-mono text-kpi-md font-semibold leading-none ' + (KPI_COLOR_CLS[k.color] || KPI_COLOR_CLS.default)}>
              {k.value}
            </div>
          </div>
        ))}
      </div>

      {/* Commercial info + Action box */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        {/* Commercial info — takes 2/3 */}
        <div className="col-span-2 bg-white border border-ink-100 rounded-card p-4 shadow-card dark:bg-ink-700 dark:border-ink-600">
          <div className="text-[10px] font-display font-medium uppercase tracking-industrial text-ink-400 mb-3">
            Información comercial
          </div>
          <div className="grid grid-cols-2">
            {commercialFields.map((f) => (
              <div
                key={f.label}
                className="py-2.5 border-b border-ink-100 dark:border-ink-600"
              >
                <div className="text-[10px] font-display font-medium uppercase tracking-industrial text-ink-400 mb-1">
                  {f.label}
                </div>
                <div className={
                  'text-[13px] font-medium text-ink-700 dark:text-ink-100 ' +
                  (f.mono ? 'font-mono' : 'font-body')
                }>
                  {f.value}
                </div>
              </div>
            ))}
            <div className="py-2.5 col-span-2">
              <div className="text-[10px] font-display font-medium uppercase tracking-industrial text-ink-400 mb-1">
                Dirección
              </div>
              <div className="text-[13px] font-medium text-ink-700 dark:text-ink-100">
                {profile.address}
              </div>
            </div>
          </div>
        </div>

        {/* Action box — takes 1/3 */}
        <div className="bg-white border border-ink-100 rounded-card p-4 shadow-card dark:bg-ink-700 dark:border-ink-600">
          <div className="text-[10px] font-display font-medium uppercase tracking-industrial text-ink-400 mb-3">
            Acción del sistema QA
          </div>
          <div className={
            'p-4 rounded-card border-2 text-center ' + actionStyle.box
          }>
            <div className="text-3xl mb-2">{actionStyle.icon}</div>
            <div className={'text-sm font-display font-semibold mb-1 ' + actionStyle.text}>
              {acc.label}
            </div>
            <div className="text-[11px] text-ink-500 dark:text-ink-300">
              {acc.hint}
            </div>
          </div>
        </div>
      </div>

      {/* Sparkline */}
      <div className="mb-4 bg-white border border-ink-100 rounded-card p-4 shadow-card dark:bg-ink-700 dark:border-ink-600">
        <div className="text-[10px] font-display font-medium uppercase tracking-industrial text-ink-400 mb-2">
          Tendencia de calificación · Últimas 12 entregas
        </div>
        <Sparkline data={profile.sparkData} height={60} />
        <div className="flex justify-between font-mono text-[10px] text-ink-400 mt-1">
          <span>hace 12</span>
          <span>actual</span>
        </div>
      </div>

      {/* History list */}
      <div className="bg-white border border-ink-100 rounded-card p-4 shadow-card dark:bg-ink-700 dark:border-ink-600">
        <div className="text-[10px] font-display font-medium uppercase tracking-industrial text-ink-400 mb-3">
          Historial reciente de inspecciones
        </div>
        {profile.history.map((h, i) => {
          const pill = RESULT_PILL[h.result] || RESULT_PILL.ok;
          const isLast = i === profile.history.length - 1;
          return (
            <div
              key={i}
              className={
                'flex items-center gap-3 py-2.5 text-xs ' +
                (isLast ? '' : 'border-b border-ink-100 dark:border-ink-600')
              }
            >
              <span className="font-mono text-ink-400 min-w-[90px]">{h.date}</span>
              <span className="font-mono text-ink-500 dark:text-ink-300 min-w-[110px]">{h.po}</span>
              <span className="flex-1 text-ink-700 dark:text-ink-100">
                {h.desc}
                <span className="text-ink-400 text-[11px]"> · {h.note}</span>
              </span>
              <span className={
                'text-[11px] font-semibold px-2 py-0.5 rounded-md border uppercase tracking-wide shrink-0 ' +
                pill.cls
              }>
                {pill.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
