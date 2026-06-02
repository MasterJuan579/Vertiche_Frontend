import { useEffect, useState } from 'react';
import { useAuth } from '@vertiche/design-system';
import { OperatorBar } from '../components/OperatorBar.jsx';
import { NivelBadge } from '../components/NivelBadge.jsx';
import { Stars } from '../components/Stars.jsx';
import {
  crearInspeccion,
  escanearPrepack,
  fetchCatalogoDefectos,
  fetchPendientes,
} from '../api/proveedores.js';
import { DEFECT_ICONS, DEFECT_TYPES, MOCK_EPCS } from '../data/demoData.js';

// Mapea la decisión interna del UI al enum del backend.
const RESULTADO_BACKEND = {
  approve:   'APROBADO',
  retrabajo: 'RETRABAJO',
  reject:    'RECHAZADO',
};

// Máquina de estados:
//   idle     → mostrando input de escaneo
//   scanning → POST /PlanQA/escanear en vuelo
//   pasa     → backend dijo "PASA" (no se inspecciona)
//   inspect  → backend dijo "REVISAR" → formulario abierto automáticamente
//   submit   → POST /InspeccionQA/crearInspeccion en vuelo
const F_IDLE     = 'idle';
const F_SCANNING = 'scanning';
const F_PASA     = 'pasa';
const F_INSPECT  = 'inspect';
const F_SUBMIT   = 'submit';

export function OperatorScreen() {
  const { session } = useAuth();

  // ─── Catálogo de defectos (cargado desde backend, fallback a DEFECT_TYPES) ───
  const [availableDefects, setAvailableDefects] = useState(DEFECT_TYPES);

  useEffect(() => {
    fetchCatalogoDefectos()
      .then((data) => {
        setAvailableDefects(
          data
            .filter((d) => d.activo)
            .map((d) => ({ cat: d.nombre, icon: DEFECT_ICONS[d.nombre] || '⚠️' }))
        );
      })
      .catch(() => {
        // Backend no disponible → se mantiene DEFECT_TYPES hardcodeado
      });
  }, []);

  // ─── Pendientes ────────────────────────────────────
  const [pendientes, setPendientes] = useState([]);
  const [pendientesLoading, setPendientesLoading] = useState(true);

  const loadPendientes = () => {
    fetchPendientes()
      .then((data) => setPendientes(Array.isArray(data) ? data : []))
      .catch((err) => console.error('Error al cargar pendientes:', err))
      .finally(() => setPendientesLoading(false));
  };
  useEffect(() => { loadPendientes(); }, []);

  // ─── Flujo de escaneo ──────────────────────────────
  const [flow, setFlow]             = useState(F_IDLE);
  const [scanInput, setScanInput]   = useState('');
  const [scanError, setScanError]   = useState(null);
  const [scanData, setScanData]     = useState(null);

  // ─── Captura de inspección ─────────────────────────
  const [defectTypes, setDefectTypes] = useState([]);
  const [otherText, setOtherText]     = useState('');
  const [notes, setNotes]             = useState('');
  const [submitError, setSubmitError] = useState(null);

  const [counter, setCounter] = useState(1);

  // ─── Acciones ──────────────────────────────────────
  const reset = () => {
    setFlow(F_IDLE);
    setScanInput('');
    setScanData(null);
    setScanError(null);
    setDefectTypes([]);
    setOtherText('');
    setNotes('');
    setSubmitError(null);
  };

  const doScan = async (epc) => {
    setFlow(F_SCANNING);
    setScanError(null);
    try {
      const data = await escanearPrepack(epc);
      const decision = String(data?.accion || '').toUpperCase();

      setScanData(data);

      if (decision === 'PASA') {
        setFlow(F_PASA);
      } else if (decision === 'REVISAR') {
        // Automático: abrimos el formulario de inspección directo.
        setFlow(F_INSPECT);
      } else {
        console.warn('Respuesta inesperada de /PlanQA/escanear:', data);
        setScanError(`Respuesta inesperada del servidor: ${JSON.stringify(data)}`);
        setFlow(F_IDLE);
      }
    } catch (err) {
      console.error('Error al escanear:', err);
      setScanError(err.message);
      setFlow(F_IDLE);
    }
  };

  const handleSimulate = () => {
    const epc = MOCK_EPCS[(counter - 1) % MOCK_EPCS.length];
    setScanInput(epc);
    doScan(epc);
  };
  const handleManual = () => {
    const epc = scanInput.trim();
    if (epc) doScan(epc);
  };
  const handleScanNext = () => {
    setCounter((c) => c + 1);
    reset();
  };

  const toggleDefect = (cat) => {
    setDefectTypes((d) => (
      d.includes(cat) ? d.filter((t) => t !== cat) : [...d, cat]
    ));
  };

  const handleSubmit = async (decision) => {
    setFlow(F_SUBMIT);
    setSubmitError(null);

    const isApproved = decision === 'approve';
    let defectos    = [];
    let observacion = null;

    if (!isApproved) {
      defectos = defectTypes.map((t) =>
        t === 'Otro (especificar)' && otherText ? otherText : t
      );
      // El texto libre de "Otro" también va en observacion para trazabilidad en backend.
      observacion = notes.trim() || (otherText.trim() ? otherText.trim() : null);
    }

    const payload = {
      tag_epc:      scanData?.epc,
      proveedor_id: scanData?.proveedor_id ?? null,
      operador_id:  session?.user?.sub,
      resultado:    RESULTADO_BACKEND[decision],
      defectos,
      observacion,
      fecha:        new Date().toISOString(),
    };

    try {
      await crearInspeccion(payload);
      loadPendientes(); // el backend ya decrementó el contador
      setCounter((c) => c + 1);
      reset();
    } catch (err) {
      console.error('Error al registrar inspección:', err);
      setSubmitError(err.message);
      setFlow(F_INSPECT);
    }
  };

  // ─── Render ────────────────────────────────────────
  return (
    <div className="px-8 py-5 max-w-[1400px] mx-auto">
      <OperatorBar counterLabel="Escaneo" counterValue={counter} />

      {(flow === F_IDLE || flow === F_SCANNING) && (
        <PendientesPanel loading={pendientesLoading} pendientes={pendientes} />
      )}

      {flow === F_IDLE && (
        <ScanCard
          input={scanInput}
          setInput={setScanInput}
          onSimulate={handleSimulate}
          onManual={handleManual}
          error={scanError}
        />
      )}

      {flow === F_SCANNING && <ScanningCard epc={scanInput} />}

      {flow === F_PASA && (
        <PasaResult data={scanData} onScanNext={handleScanNext} />
      )}

      {(flow === F_INSPECT || flow === F_SUBMIT) && (
        <RevisarFlow
          data={scanData}
          availableDefects={availableDefects}
          defectTypes={defectTypes}
          onToggleDefect={toggleDefect}
          otherText={otherText}
          setOtherText={setOtherText}
          notes={notes}
          setNotes={setNotes}
          onSubmit={handleSubmit}
          onCancel={handleScanNext}
          submitting={flow === F_SUBMIT}
          error={submitError}
        />
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// PENDIENTES PANEL
// ════════════════════════════════════════════════════════════════════

function PendientesPanel({ loading, pendientes }) {
  return (
    <div className="mb-4 bg-white border border-ink-100 rounded-card p-4 shadow-card dark:bg-ink-700 dark:border-ink-600">
      <div className="text-[10px] font-display font-medium uppercase tracking-industrial text-ink-400 mb-3">
        Revisiones pendientes por proveedor · Turno actual
      </div>

      {loading && (
        <div className="text-center py-3 text-xs text-ink-400">Cargando pendientes…</div>
      )}

      {!loading && pendientes.length === 0 && (
        <div className="text-center py-3 text-xs text-ink-400">
          No hay revisiones pendientes hoy.
        </div>
      )}

      {!loading && pendientes.map((p, idx) => {
        const isLast = idx === pendientes.length - 1;
        const countCls =
          p.restantes === 0
            ? 'bg-flow-bg text-flow border-flow-ring/40 dark:bg-flow/20 dark:text-flow-ring dark:border-flow-ring/40'
            : p.restantes > 5
            ? 'bg-anomaly-bg text-anomaly border-anomaly-ring/40 dark:bg-anomaly/20 dark:text-anomaly-ring dark:border-anomaly-ring/40'
            : 'bg-attention-bg text-attention border-attention-ring/40 dark:bg-attention/20 dark:text-attention-ring dark:border-attention-ring/40';
        return (
          <div
            key={p.proveedor_id}
            className={
              'flex items-center justify-between gap-3 py-2.5 ' +
              (isLast ? '' : 'border-b border-ink-100 dark:border-ink-600')
            }
          >
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-medium text-ink-700 dark:text-ink-100 truncate">
                {p.nombre}
              </div>
              <div className="text-[11px] text-ink-400 mt-0.5">
                {p.inspeccionados_hoy} de {p.cuota} inspeccionados · {p.codigo}
              </div>
            </div>

            {p.level && p.color && <NivelBadge level={p.level} color={p.color} />}

            <div className="text-right shrink-0 min-w-[110px]">
              <div className="text-[10px] font-display font-medium uppercase tracking-industrial text-ink-400 mb-0.5">
                Pendientes
              </div>
              <span className={
                'inline-flex items-center justify-center px-2.5 py-0.5 rounded-md border font-mono text-base font-semibold ' +
                countCls
              }>
                {p.restantes}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// SCAN CARD — input + simulate (estado idle)
// ════════════════════════════════════════════════════════════════════

function ScanCard({ input, setInput, onSimulate, onManual, error }) {
  return (
    <div className={
      'p-10 text-center rounded-card border border-ink-100 shadow-card ' +
      'bg-white dark:bg-ink-700 dark:border-ink-600 ' +
      'animate-[fadeIn_.4s_ease]'
    }>
      <div className={
        'w-[90px] h-[90px] mx-auto mb-5 rounded-full flex items-center justify-center ' +
        'bg-blue-50 border-2 border-rfid ' +
        'dark:bg-rfid/20 dark:border-rfid'
      }>
        <span className="text-4xl">📡</span>
      </div>
      <p className="text-base font-display font-medium text-ink-700 dark:text-ink-100 mb-1.5">
        Escanea un prepack
      </p>
      <p className="text-xs text-ink-400 mb-5">
        El sistema decidirá automáticamente si se inspecciona o pasa directo
      </p>

      <div className="max-w-[420px] mx-auto">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') onManual(); }}
          placeholder="EPC del prepack…"
          className={
            'w-full px-3 py-2.5 mb-2.5 rounded-card text-[13px] text-center outline-none font-mono ' +
            'bg-ink-50 border border-ink-100 text-ink-700 placeholder:text-ink-400 ' +
            'focus:border-rfid ' +
            'dark:bg-ink-600 dark:border-ink-500 dark:text-ink-100'
          }
        />
        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={onManual}
            disabled={!input.trim()}
            className={
              'px-4 py-3 rounded-card font-display text-sm font-semibold transition-colors ' +
              'bg-ink-100 text-ink-700 hover:bg-ink-200 disabled:opacity-50 disabled:cursor-not-allowed ' +
              'dark:bg-ink-600 dark:text-ink-100 dark:hover:bg-ink-500'
            }
          >
            Escanear EPC
          </button>
          <button
            onClick={onSimulate}
            className={
              'px-4 py-3 rounded-card font-display text-sm font-semibold text-white ' +
              'bg-rfid hover:bg-blue-700 transition-colors dark:hover:bg-blue-600'
            }
          >
            Simular lectura
          </button>
        </div>
      </div>

      {error && (
        <div className={
          'max-w-[420px] mx-auto mt-4 p-3 rounded-card text-xs ' +
          'bg-anomaly-bg border border-anomaly-ring text-anomaly ' +
          'dark:bg-anomaly/15 dark:border-anomaly-ring dark:text-anomaly-ring'
        }>
          {error}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// SCANNING CARD — feedback durante el POST
// ════════════════════════════════════════════════════════════════════

function ScanningCard({ epc }) {
  return (
    <div className={
      'p-10 text-center rounded-card border border-ink-100 shadow-card ' +
      'bg-white dark:bg-ink-700 dark:border-ink-600'
    }>
      <div className={
        'w-[90px] h-[90px] mx-auto mb-5 rounded-full flex items-center justify-center ' +
        'bg-blue-50 border-2 border-rfid animate-pulse ' +
        'dark:bg-rfid/20 dark:border-rfid'
      }>
        <span className="text-4xl">📡</span>
      </div>
      <p className="text-base font-display font-medium text-ink-700 dark:text-ink-100 mb-1.5">
        Consultando con el sistema…
      </p>
      <p className="font-mono text-xs text-ink-400">{epc}</p>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// SHARED — Tarjetas pequeñas con info del prepack y proveedor
// ════════════════════════════════════════════════════════════════════

function PrepackInfoCard({ data }) {
  return (
    <div className="bg-white border border-ink-100 rounded-card p-4 shadow-card dark:bg-ink-700 dark:border-ink-600">
      <div className="text-[10px] font-display font-semibold uppercase tracking-industrial text-ink-400 mb-2">
        Prepack escaneado
      </div>
      <div className="font-mono text-[13px] text-ink-700 dark:text-ink-100 mb-3 truncate">
        {data?.epc}
      </div>
      <div className="grid grid-cols-3 gap-2">
        <KpiMini label="SKU"   value={data?.sku   || '—'} mono />
        <KpiMini label="Talla" value={data?.talla || '—'} />
        <KpiMini label="Color" value={data?.color || '—'} />
      </div>
    </div>
  );
}

function SupplierInfoCard({ data }) {
  return (
    <div className="bg-white border border-ink-100 rounded-card p-4 shadow-card dark:bg-ink-700 dark:border-ink-600">
      <div className="text-[10px] font-display font-semibold uppercase tracking-industrial text-ink-400 mb-2">
        Proveedor
      </div>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-display text-sm font-semibold text-ink-700 dark:text-ink-100 truncate">
            {data?.proveedor_nombre || '—'}
          </div>
          <div className="font-mono text-[11px] text-ink-400 mt-0.5">
            {data?.proveedor_codigo || ''}
          </div>
        </div>
        <div className="shrink-0 text-right">
          {data?.level && (
            <NivelBadge level={data.level} color={inferColor(data.level)} />
          )}
          <div className="flex items-center gap-1.5 mt-1.5 justify-end">
            <span className="font-mono text-base font-semibold text-amber-500 dark:text-amber-400 leading-none">
              {data?.stars != null ? Number(data.stars).toFixed(1) : '—'}
            </span>
            {data?.stars != null && <Stars rating={data.stars} size={11} />}
          </div>
        </div>
      </div>
    </div>
  );
}

// Si el backend no envía `color` (legacy code 'ba'|'bb'|'bc'|'bn'), lo derivamos del level
function inferColor(level) {
  switch (String(level || '').toUpperCase()) {
    case 'ELITE': return 'ba';
    case 'MEDIA': return 'bb';
    case 'BAJA':  return 'bc';
    default:      return 'bn';
  }
}

function KpiMini({ label, value, mono }) {
  return (
    <div className="px-2.5 py-2 rounded-card bg-ink-50 dark:bg-ink-600">
      <div className="text-[9px] font-display font-medium uppercase tracking-industrial text-ink-400 mb-0.5">
        {label}
      </div>
      <div className={
        'text-[13px] font-semibold text-ink-700 dark:text-ink-100 truncate ' +
        (mono ? 'font-mono' : 'font-body')
      }>
        {value}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// PASA RESULT — "NO SE ESCANEA" + info del prepack/proveedor + siguiente
// ════════════════════════════════════════════════════════════════════

function PasaResult({ data, onScanNext }) {
  return (
    <div className="animate-[fadeIn_.3s_ease]">
      {/* Alerta GRANDE */}
      <div className={
        'p-10 text-center rounded-card border-4 shadow-card mb-4 ' +
        'bg-flow-bg border-flow-ring ' +
        'dark:bg-flow/15 dark:border-flow-ring'
      }>
        <div className="text-7xl mb-1 leading-none">✓</div>
        <div className="font-display text-6xl font-bold tracking-tight leading-none mb-2 text-flow dark:text-flow-ring">
          NO SE ESCANEA
        </div>
        <div className="text-sm font-display font-medium text-ink-700 dark:text-ink-100 mb-1">
          Este prepack pasa directo al flujo
        </div>
        {data?.mensaje && (
          <div className="text-xs text-ink-500 dark:text-ink-300">{data.mensaje}</div>
        )}
      </div>

      {/* Info en dos columnas */}
      <div className="grid grid-cols-2 gap-3.5 mb-4">
        <PrepackInfoCard data={data} />
        <SupplierInfoCard data={data} />
      </div>

      {/* Cuota completada */}
      <div className={
        'p-4 mb-4 rounded-card border ' +
        'bg-flow-bg border-flow-ring/40 ' +
        'dark:bg-flow/10 dark:border-flow-ring/40'
      }>
        <div className="text-[10px] font-display font-semibold uppercase tracking-industrial text-flow dark:text-flow-ring mb-1">
          Cuota completada
        </div>
        <div className="text-sm text-ink-700 dark:text-ink-100">
          <span className="font-mono font-semibold">{data?.inspeccionados_hoy ?? '—'}</span> de{' '}
          <span className="font-mono font-semibold">{data?.cuota ?? '—'}</span> inspecciones ·{' '}
          <span className="font-mono font-semibold">{data?.restantes ?? 0}</span> restantes
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={onScanNext}
        className={
          'w-full px-8 py-3.5 rounded-card font-display text-sm font-semibold text-white ' +
          'bg-rfid border border-rfid hover:bg-blue-700 transition-colors ' +
          'dark:hover:bg-blue-600'
        }
      >
        Escanear siguiente prepack →
      </button>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// REVISAR FLOW — "SE ESCANEA" + info + formulario de inspección
// ════════════════════════════════════════════════════════════════════

function RevisarFlow({
  data, availableDefects, defectTypes, onToggleDefect, otherText, setOtherText, notes, setNotes,
  onSubmit, onCancel, submitting, error,
}) {
  const hasOther   = defectTypes.includes('Otro (especificar)');
  const hasDefects = defectTypes.length > 0;

  return (
    <div className="animate-[fadeIn_.3s_ease]">
      {/* Alerta GRANDE */}
      <div className={
        'p-10 text-center rounded-card border-4 shadow-card mb-4 ' +
        'bg-attention-bg border-attention-ring ' +
        'dark:bg-attention/15 dark:border-attention-ring'
      }>
        <div className="text-7xl mb-1 leading-none">🔍</div>
        <div className="font-display text-6xl font-bold tracking-tight leading-none mb-2 text-attention dark:text-attention-ring">
          SE ESCANEA
        </div>
        <div className="text-sm font-display font-medium text-ink-700 dark:text-ink-100">
          Este prepack requiere inspección manual
        </div>
        {data?.restantes_antes != null && data?.restantes_despues != null && (
          <div className="text-xs text-ink-500 dark:text-ink-300 mt-2">
            Pendientes: <span className="font-mono font-semibold">{data.restantes_antes}</span>
            {' → '}
            <span className="font-mono font-semibold text-attention dark:text-attention-ring">{data.restantes_despues}</span>
            {' '}al confirmar
          </div>
        )}
      </div>

      {/* Info en dos columnas */}
      <div className="grid grid-cols-2 gap-3.5 mb-4">
        <PrepackInfoCard data={data} />
        <SupplierInfoCard data={data} />
      </div>

      {/* Formulario */}
      <div className={
        'bg-white border border-ink-100 rounded-card p-5 shadow-card ' +
        'dark:bg-ink-700 dark:border-ink-600'
      }>
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-ink-100 dark:border-ink-600">
          <div className="text-[10px] font-display font-semibold uppercase tracking-industrial text-attention dark:text-attention-ring">
            Captura de inspección
          </div>
          <button
            onClick={onCancel}
            disabled={submitting}
            className={
              'text-xs px-3 py-1.5 rounded-card transition-colors ' +
              'bg-ink-50 border border-ink-100 text-ink-500 hover:bg-ink-100 ' +
              'disabled:opacity-50 ' +
              'dark:bg-ink-600 dark:border-ink-500 dark:text-ink-300 dark:hover:bg-ink-500'
            }
          >
            ← Cancelar
          </button>
        </div>

        {/* Defect types */}
        <div className="mb-4">
          <div className="text-[10px] font-display font-medium uppercase tracking-industrial text-ink-400 mb-2">
            Tipos de defecto (déjalo vacío si la inspección sale OK)
          </div>
          <div className="grid grid-cols-4 gap-2">
            {availableDefects.map((d) => {
              const selected = defectTypes.includes(d.cat);
              return (
                <button
                  key={d.cat}
                  type="button"
                  onClick={() => onToggleDefect(d.cat)}
                  disabled={submitting}
                  className={
                    'flex flex-col items-center gap-1.5 px-2.5 py-3 rounded-card border text-xs font-medium transition-colors ' +
                    'disabled:opacity-50 ' +
                    (selected
                      ? 'bg-anomaly-bg border-anomaly-ring text-anomaly dark:bg-anomaly/20 dark:border-anomaly-ring dark:text-anomaly-ring'
                      : 'bg-ink-50 border-ink-100 text-ink-500 hover:border-ink-200 ' +
                        'dark:bg-ink-600 dark:border-ink-500 dark:text-ink-300 dark:hover:border-ink-400')
                  }
                >
                  <span className="text-xl">{d.icon}</span>
                  <span className="text-center leading-tight">{d.cat}</span>
                </button>
              );
            })}
          </div>
        </div>

        {hasOther && (
          <div className="mb-4 animate-[fadeIn_.25s_ease]">
            <label className="block text-[10px] font-display font-medium uppercase tracking-industrial text-ink-400 mb-1">
              Describe el otro defecto
            </label>
            <textarea
              value={otherText}
              onChange={(e) => setOtherText(e.target.value)}
              disabled={submitting}
              placeholder="Ej: pintura corrida en logo frontal…"
              rows={2}
              className={
                'w-full px-3 py-2.5 rounded-card text-[13px] outline-none resize-y ' +
                'bg-ink-50 border border-ink-100 text-ink-700 placeholder:text-ink-400 ' +
                'focus:border-rfid ' +
                'dark:bg-ink-600 dark:border-ink-500 dark:text-ink-100'
              }
            />
          </div>
        )}

        <div className="mb-5">
          <label className="block text-[10px] font-display font-medium uppercase tracking-industrial text-ink-400 mb-1">
            Observaciones (opcional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={submitting}
            placeholder="Ubicación del defecto, severidad, condiciones…"
            rows={3}
            className={
              'w-full px-3 py-2.5 rounded-card text-[13px] outline-none resize-y ' +
              'bg-ink-50 border border-ink-100 text-ink-700 placeholder:text-ink-400 ' +
              'focus:border-rfid ' +
              'dark:bg-ink-600 dark:border-ink-500 dark:text-ink-100'
            }
          />
        </div>

        {error && (
          <div className={
            'mb-4 p-3 rounded-card text-xs ' +
            'bg-anomaly-bg border border-anomaly-ring text-anomaly ' +
            'dark:bg-anomaly/15 dark:border-anomaly-ring dark:text-anomaly-ring'
          }>
            {error}
          </div>
        )}

        {/* Decisión final */}
        <div className="grid grid-cols-3 gap-3">
          <DecisionButton
            icon="✓"
            label="Aprobar"
            hint="Sin defectos"
            tone="flow"
            onClick={() => onSubmit('approve')}
            disabled={submitting}
          />
          <DecisionButton
            icon="🔧"
            label="Retrabajo"
            hint="Requiere ajuste"
            tone="attention"
            onClick={() => onSubmit('retrabajo')}
            disabled={submitting || !hasDefects}
          />
          <DecisionButton
            icon="✕"
            label="Rechazar"
            hint="No entra al flujo"
            tone="anomaly"
            onClick={() => onSubmit('reject')}
            disabled={submitting || !hasDefects}
          />
        </div>

        {submitting && (
          <div className="mt-4 text-center text-xs text-ink-400 animate-pulse">
            Registrando inspección…
          </div>
        )}
      </div>
    </div>
  );
}

function DecisionButton({ icon, label, hint, tone, onClick, disabled }) {
  const toneCls = {
    flow:      'border-flow-ring/40 hover:bg-flow-bg dark:border-flow-ring/40 dark:hover:bg-flow/20',
    attention: 'border-attention-ring/40 hover:bg-attention-bg dark:border-attention-ring/40 dark:hover:bg-attention/20',
    anomaly:   'border-anomaly-ring/40 hover:bg-anomaly-bg dark:border-anomaly-ring/40 dark:hover:bg-anomaly/20',
  }[tone];
  const textCls = {
    flow:      'text-flow dark:text-flow-ring',
    attention: 'text-attention dark:text-attention-ring',
    anomaly:   'text-anomaly dark:text-anomaly-ring',
  }[tone];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={
        'p-5 text-center rounded-card border-2 transition-colors ' +
        'bg-white dark:bg-ink-600 ' +
        toneCls + ' ' +
        'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-ink-600'
      }
    >
      <div className="text-3xl mb-1">{icon}</div>
      <div className={'font-display text-sm font-semibold ' + textCls}>{label}</div>
      <div className="text-[10px] text-ink-400 mt-0.5">{hint}</div>
    </button>
  );
}
