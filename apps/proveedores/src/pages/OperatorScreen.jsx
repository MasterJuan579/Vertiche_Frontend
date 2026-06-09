import { useCallback, useEffect, useRef, useState } from 'react';
import { OperatorBar } from '../components/OperatorBar.jsx';
import { NivelBadge } from '../components/NivelBadge.jsx';
import { Stars } from '../components/Stars.jsx';
import {
  crearInspeccion,
  fetchPendientes,
} from '../api/proveedores.js';
import { DEFECT_TYPES } from '../data/demoData.js';
import { useScanSocket } from '../lib/useScanSocket.js';

// Tiempo (ms) que se muestra el banner "NO SE ESCANEA" antes de regresar a idle.
const PASA_AUTO_DISMISS_MS = 3000;

// Tiempo (ms) que se muestra el banner "BLOQUEADO" (proveedor con rechazo total).
// Más largo que PASA porque el mensaje requiere lectura del operador.
const BLOCKED_AUTO_DISMISS_MS = 4500;

// Máximo de escaneos que mantenemos en el historial visible.
// Las entradas NUNCA se eliminan por su propio estado (inspeccionado, pasa,
// bloqueado) — solo se "rotan" las más viejas cuando llegamos a este cap.
// Lo dejamos amplio para que un turno completo quepa sin perder nada.
const MAX_HISTORY = 500;

// ID del operador a usar en el payload de inspección.
// Hardcodeado mientras no haya Cognito integrado. El backend espera UUID.
const OPERADOR_ID_HARDCODED = 'a1b2c3d4-2222-4444-aaaa-000000000002';

// Máquina de estados:
//   idle    → a la espera de una lectura RFID (pantalla pasiva)
//   pasa    → backend dijo "PASA" (no se inspecciona)
//   blocked → backend dijo "RECHAZADO_TOTAL" (proveedor bloqueado hoy)
//   inspect → backend dijo "REVISAR" → formulario abierto automáticamente
//   submit  → POST /InspeccionQA/crearInspeccion en vuelo
//   success → backend confirmó la inspección; mostramos su veredicto unos segundos
const F_IDLE    = 'idle';
const F_PASA    = 'pasa';
const F_BLOCKED = 'blocked';
const F_INSPECT = 'inspect';
const F_SUBMIT  = 'submit';
const F_SUCCESS = 'success';

// Tiempo (ms) que se muestra el banner de éxito antes de regresar a idle.
const SUCCESS_AUTO_DISMISS_MS = 3500;

/**
 * Vista previa del resultado en función de cuántos defectos lleva marcados
 * el inspector. La lógica real la corre el backend al guardar; esto es solo
 * para feedback visual mientras llena el formulario.
 */
function previsualizarResultado(count) {
  if (count === 0) return { resultado: 'APROBADO',  stars: 5, tone: 'flow',      icon: '✓'  };
  if (count === 1) return { resultado: 'APROBADO',  stars: 4, tone: 'flow',      icon: '✓'  };
  if (count <= 4) return  { resultado: 'RETRABAJO', stars: 3, tone: 'attention', icon: '🔧' };
  return                  { resultado: 'RECHAZADO', stars: 1, tone: 'anomaly',   icon: '✕'  };
}

export function OperatorScreen() {
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
  const [submitResponse, setSubmitResponse] = useState(null);

  const [counter, setCounter] = useState(1);

  // ─── Historial / cola de escaneos ───
  // Cada entrada conserva la respuesta completa del backend para poder
  // "retomar" un REVISAR que llegó mientras estábamos ocupados.
  //   { id, timestamp, source, status, data }
  //   status: 'pending'   → REVISAR sin inspeccionar todavía (clickeable)
  //           'completed' → ya inspeccionado, o un PASA (informativo)
  const [scanHistory, setScanHistory] = useState([]);

  const buildHistoryEntry = (data, source) => {
    const accion = String(data?.accion || '').toUpperCase();
    // Solo REVISAR queda en estado 'pending' (requiere inspección manual).
    // PASA y RECHAZADO_TOTAL son automáticos → 'completed'.
    return {
      id:        Date.now() + Math.random(),
      timestamp: new Date(),
      source,                                 // 'rfid' | 'manual'
      status:    accion === 'REVISAR' ? 'pending' : 'completed',
      data,                                   // shape de /PlanQA/escanear
    };
  };

  // Agrega una entrada al historial evitando duplicados por EPC.
  //
  // El backend emite dos eventos por un mismo escaneo RFID:
  //   1. `lectura`     → el front llama a /PlanQA/escanear y procesa la respuesta
  //   2. `qa-escaneo`  → el backend lo emite al terminar /PlanQA/escanear
  // Ambos terminan en este helper. Si un EPC ya existe en el historial, no se
  // agrega otro y, si fuera necesario, se actualiza la entrada existente con
  // los datos más recientes (el segundo payload a veces trae más info).
  const addHistoryEntry = (data, source) => {
    setScanHistory((h) => {
      const epc = data?.epc;
      if (epc) {
        const existing = h.find((e) => e.data?.epc === epc);
        if (existing) {
          console.log('[history] EPC ya está en historial, se ignora duplicado:', epc);
          // Enriquecemos el entry existente con datos que pudieran venir mejor
          // en el segundo evento (proveedor_nombre, sku, talla, color, etc.),
          // sin tocar su id, timestamp ni status.
          return h.map((e) => (
            e.id === existing.id
              ? { ...e, data: { ...e.data, ...data } }
              : e
          ));
        }
      }
      return [buildHistoryEntry(data, source), ...h].slice(0, MAX_HISTORY);
    });
  };

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
    setSubmitResponse(null);
  };

  const handleScanNext = () => {
    setCounter((c) => c + 1);
    reset();
  };

  // Click en una entrada pendiente del historial → la convierte en la inspección activa.
  const handlePickPending = (entry) => {
    if (!entry || entry.status !== 'pending') return;
    if (flow === F_SUBMIT) return; // no podemos cambiar a media transacción

    setScanData(entry.data);
    setScanInput(entry.data?.epc || '');
    setScanError(null);
    setDefectTypes([]);
    setOtherText('');
    setNotes('');
    setSubmitError(null);
    setSubmitResponse(null);
    setFlow(F_INSPECT);
  };

  // ─── WebSocket: escuchar escaneos en tiempo real ───
  // Usamos un ref para conocer el estado actual sin romper la identidad del
  // handler (que solo se crea una vez).
  const flowRef = useRef(flow);
  flowRef.current = flow;

  const handleSocketScan = useCallback((data) => {
    const current = flowRef.current;
    const decision = String(data?.accion || '').toUpperCase();

    // Siempre encolamos en el historial, aunque el inspector esté ocupado
    // con otro prepack. Los REVISAR pendientes podrán retomarse con click.
    // addHistoryEntry dedupea por EPC, así evitamos que el doble evento del
    // backend (`lectura` + `qa-escaneo` para el mismo escaneo) cree dos filas.
    addHistoryEntry(data, 'rfid');

    // Solo cambiamos la pantalla activa si estamos esperando un escaneo:
    // - F_IDLE: pantalla limpia, podemos abrir banner/formulario
    // - F_PASA / F_BLOCKED: ya hay un banner; lo reemplazamos con el nuevo evento
    // En cualquier otro estado (inspeccionando, enviando, success), solo encolamos.
    if (current !== F_IDLE && current !== F_PASA && current !== F_BLOCKED) {
      console.log('[socket] escaneo encolado (estado activo:', current + '):', data?.epc);
      return;
    }

    setScanData(data);
    setScanError(null);
    setScanInput(data?.epc || '');

    if (decision === 'PASA') {
      setFlow(F_PASA);
      // El banner verde se desvanece solo después de unos segundos.
      setTimeout(() => {
        setFlow((f) => (f === F_PASA ? F_IDLE : f));
        setScanData((prev) => (prev?.epc === data?.epc ? null : prev));
        setScanInput('');
        setCounter((c) => c + 1);
      }, PASA_AUTO_DISMISS_MS);
    } else if (decision === 'REVISAR') {
      setFlow(F_INSPECT);
    } else if (decision === 'RECHAZADO_TOTAL') {
      setFlow(F_BLOCKED);
      // El banner rojo también se desvanece solo, pero le damos más tiempo
      // porque el operador necesita leer el motivo del bloqueo.
      setTimeout(() => {
        setFlow((f) => (f === F_BLOCKED ? F_IDLE : f));
        setScanData((prev) => (prev?.epc === data?.epc ? null : prev));
        setScanInput('');
        setCounter((c) => c + 1);
      }, BLOCKED_AUTO_DISMISS_MS);
    } else {
      console.warn('[socket] decisión desconocida:', data);
      setScanError(`Respuesta inesperada del socket: ${JSON.stringify(data)}`);
      setFlow(F_IDLE);
    }
  }, []);

  const { connected: socketConnected } = useScanSocket(handleSocketScan);

  const toggleDefect = (cat) => {
    setDefectTypes((d) => (
      d.includes(cat) ? d.filter((t) => t !== cat) : [...d, cat]
    ));
  };

  const handleSubmit = async () => {
    setFlow(F_SUBMIT);
    setSubmitError(null);

    // Mandamos solo los defectos marcados. "Otro" se sustituye por el texto
    // libre cuando viene. El backend calcula resultado, score y stars.
    const defectos = defectTypes.map((t) =>
      t === 'Otro (especificar)' && otherText ? otherText : t
    );
    const observacion = notes.trim() || (otherText.trim() ? otherText.trim() : null);

    const payload = {
      tag_epc:      scanData?.epc,
      proveedor_id: scanData?.proveedor_id ?? null,
      operador_id:  OPERADOR_ID_HARDCODED,
      defectos,
      observacion,
      fecha:        new Date().toISOString(),
    };

    try {
      const response = await crearInspeccion(payload);
      console.log('[inspeccion] respuesta del backend:', response);
      setSubmitResponse(response);
      setFlow(F_SUCCESS);
      loadPendientes(); // refresca el contador de pendientes con el nuevo estado

      // Marca la entrada correspondiente del historial como completada
      // (solo el primer pendiente que matchee el EPC; podría haber duplicados
      // si llegó varias veces).
      const epcGuardado = scanData?.epc;
      if (epcGuardado) {
        setScanHistory((h) => {
          let alreadyMarked = false;
          return h.map((e) => {
            if (!alreadyMarked && e.status === 'pending' && e.data?.epc === epcGuardado) {
              alreadyMarked = true;
              return { ...e, status: 'completed', completedAt: new Date() };
            }
            return e;
          });
        });
      }

      // Volvemos solitos a idle tras unos segundos.
      setTimeout(() => {
        setFlow((f) => (f === F_SUCCESS ? F_IDLE : f));
        setSubmitResponse(null);
        setScanData(null);
        setScanInput('');
        setDefectTypes([]);
        setOtherText('');
        setNotes('');
        setCounter((c) => c + 1);
      }, SUCCESS_AUTO_DISMISS_MS);
    } catch (err) {
      console.error('Error al registrar inspección:', err);
      setSubmitError(err.message);
      setFlow(F_INSPECT);
    }
  };

  // ─── Render ────────────────────────────────────────
  return (
    <div className="px-8 py-5 max-w-[1400px] mx-auto">
      <SocketStatus connected={socketConnected} />
      <OperatorBar counterLabel="Escaneo" counterValue={counter} />

      {flow === F_IDLE && (
        <PendientesPanel loading={pendientesLoading} pendientes={pendientes} />
      )}

      {flow === F_IDLE && <ScanCard error={scanError} />}

      {flow === F_PASA && (
        <PasaResult data={scanData} onScanNext={handleScanNext} />
      )}

      {flow === F_BLOCKED && (
        <BlockedResult data={scanData} onScanNext={handleScanNext} />
      )}

      {/* Historial visible siempre excepto en el banner de éxito */}
      {flow !== F_SUCCESS && (
        <ScanHistoryPanel
          history={scanHistory}
          onPickPending={handlePickPending}
          canPick={flow === F_IDLE || flow === F_PASA || flow === F_BLOCKED}
        />
      )}

      {(flow === F_INSPECT || flow === F_SUBMIT) && (
        <RevisarFlow
          data={scanData}
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

      {flow === F_SUCCESS && (
        <SuccessResult response={submitResponse} scanData={scanData} onContinue={handleScanNext} />
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

function ScanCard({ error }) {
  return (
    <div className={
      'p-10 text-center rounded-card border border-ink-100 shadow-card ' +
      'bg-white dark:bg-ink-700 dark:border-ink-600 ' +
      'animate-[fadeIn_.4s_ease]'
    }>
      <div className={
        'w-[90px] h-[90px] mx-auto mb-5 rounded-full flex items-center justify-center ' +
        'bg-blue-50 border-2 border-rfid animate-pulse ' +
        'dark:bg-rfid/20 dark:border-rfid'
      }>
        <span className="text-4xl">📡</span>
      </div>
      <p className="text-base font-display font-medium text-ink-700 dark:text-ink-100 mb-1.5">
        A la espera de un prepack
      </p>
      <p className="text-xs text-ink-400">
        El sistema reaccionará automáticamente cuando el arco RFID detecte una lectura
      </p>

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
// BLOCKED RESULT — "BLOQUEADO" cuando el proveedor ya tuvo rechazo total hoy
// ════════════════════════════════════════════════════════════════════

function BlockedResult({ data, onScanNext }) {
  return (
    <div className="animate-[fadeIn_.3s_ease]">
      {/* Alerta GRANDE roja */}
      <div className={
        'p-10 text-center rounded-card border-4 shadow-card mb-4 ' +
        'bg-anomaly-bg border-anomaly-ring ' +
        'dark:bg-anomaly/15 dark:border-anomaly-ring'
      }>
        <div className="text-7xl mb-1 leading-none">🚫</div>
        <div className="font-display text-6xl font-bold tracking-tight leading-none mb-2 text-anomaly dark:text-anomaly-ring">
          BLOQUEADO
        </div>
        <div className="text-sm font-display font-semibold text-ink-700 dark:text-ink-100 mb-1">
          Proveedor bloqueado por rechazo total del día
        </div>
        {data?.proveedor_nombre && (
          <div className="text-sm font-display font-medium text-anomaly dark:text-anomaly-ring mt-1">
            {data.proveedor_nombre}
          </div>
        )}
        {data?.mensaje && (
          <div className="text-xs text-ink-500 dark:text-ink-300 mt-3 max-w-md mx-auto leading-relaxed">
            {data.mensaje}
          </div>
        )}
      </div>

      {/* Info en dos columnas */}
      <div className="grid grid-cols-2 gap-3.5 mb-4">
        <PrepackInfoCard data={data} />
        <SupplierInfoCard data={data} />
      </div>

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
  data, defectTypes, onToggleDefect, otherText, setOtherText, notes, setNotes,
  onSubmit, onCancel, submitting, error,
}) {
  const hasOther = defectTypes.includes('Otro (especificar)');

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

        {/* Defect checkboxes */}
        <div className="mb-4">
          <div className="text-[10px] font-display font-medium uppercase tracking-industrial text-ink-400 mb-2">
            Marca los defectos encontrados (déjalo vacío si la inspección sale OK)
          </div>
          <div className="grid grid-cols-2 gap-2">
            {DEFECT_TYPES.map((d) => {
              const selected = defectTypes.includes(d.cat);
              return (
                <label
                  key={d.cat}
                  className={
                    'flex items-center gap-2.5 px-3 py-2.5 rounded-card border cursor-pointer select-none transition-colors ' +
                    (submitting ? 'opacity-50 cursor-not-allowed ' : '') +
                    (selected
                      ? 'bg-anomaly-bg border-anomaly-ring dark:bg-anomaly/20 dark:border-anomaly-ring'
                      : 'bg-ink-50 border-ink-100 hover:border-ink-200 ' +
                        'dark:bg-ink-600 dark:border-ink-500 dark:hover:border-ink-400')
                  }
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => onToggleDefect(d.cat)}
                    disabled={submitting}
                    className="sr-only"
                  />
                  <span className={
                    'w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ' +
                    (selected
                      ? 'bg-anomaly-ring border-anomaly-ring text-white'
                      : 'bg-white border-ink-300 dark:bg-ink-700 dark:border-ink-400')
                  }>
                    {selected && <span className="text-[11px] font-bold leading-none">✓</span>}
                  </span>
                  <span className="text-base shrink-0">{d.icon}</span>
                  <span className={
                    'text-[13px] leading-tight ' +
                    (selected
                      ? 'text-anomaly font-semibold dark:text-anomaly-ring'
                      : 'text-ink-700 dark:text-ink-100')
                  }>
                    {d.cat}
                  </span>
                </label>
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

        {/* Vista previa del resultado + confirmar */}
        <ResultPreview count={defectTypes.length} />

        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting}
          className={
            'w-full mt-3 px-6 py-3.5 rounded-card font-display text-sm font-semibold text-white ' +
            'bg-attention border border-attention-ring hover:opacity-90 transition-opacity ' +
            'disabled:opacity-50 disabled:cursor-not-allowed'
          }
        >
          {submitting ? 'Registrando inspección…' : 'Confirmar inspección →'}
        </button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// RESULT PREVIEW — feedback en vivo del veredicto estimado
// ════════════════════════════════════════════════════════════════════

function ResultPreview({ count }) {
  const preview = previsualizarResultado(count);
  const toneCls = {
    flow:      'bg-flow-bg border-flow-ring/40 text-flow dark:bg-flow/15 dark:border-flow-ring/40 dark:text-flow-ring',
    attention: 'bg-attention-bg border-attention-ring/40 text-attention dark:bg-attention/15 dark:border-attention-ring/40 dark:text-attention-ring',
    anomaly:   'bg-anomaly-bg border-anomaly-ring/40 text-anomaly dark:bg-anomaly/15 dark:border-anomaly-ring/40 dark:text-anomaly-ring',
  }[preview.tone];

  return (
    <div className={'p-4 rounded-card border-2 ' + toneCls}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] font-display font-semibold uppercase tracking-industrial opacity-80">
            Resultado estimado
          </div>
          <div className="font-display text-2xl font-bold mt-0.5">
            {preview.icon} {preview.resultado}
          </div>
          <div className="text-[11px] opacity-70 mt-0.5">
            {count} {count === 1 ? 'defecto marcado' : 'defectos marcados'}
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono text-3xl font-bold leading-none">
            {preview.stars}<span className="text-base opacity-60">/5</span>
          </div>
          <div className="text-[11px] uppercase tracking-industrial opacity-70 mt-1">
            estrellas
          </div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// SUCCESS RESULT — confirmación del backend tras registrar la inspección
// ════════════════════════════════════════════════════════════════════

function SuccessResult({ response, scanData, onContinue }) {
  const resultado = response?.resultado || '—';
  const tone =
    resultado === 'APROBADO'  ? 'flow' :
    resultado === 'RETRABAJO' ? 'attention' :
    resultado === 'RECHAZADO' ? 'anomaly' : 'flow';

  const toneBox = {
    flow:      'bg-flow-bg border-flow-ring dark:bg-flow/15 dark:border-flow-ring',
    attention: 'bg-attention-bg border-attention-ring dark:bg-attention/15 dark:border-attention-ring',
    anomaly:   'bg-anomaly-bg border-anomaly-ring dark:bg-anomaly/15 dark:border-anomaly-ring',
  }[tone];
  const toneText = {
    flow:      'text-flow dark:text-flow-ring',
    attention: 'text-attention dark:text-attention-ring',
    anomaly:   'text-anomaly dark:text-anomaly-ring',
  }[tone];
  const icon = resultado === 'APROBADO' ? '✓' : resultado === 'RETRABAJO' ? '🔧' : resultado === 'RECHAZADO' ? '✕' : '✓';

  const starsBefore = response?.stars_anterior;
  const starsAfter  = response?.stars_nuevo;
  const starsDelta  = starsBefore != null && starsAfter != null ? starsAfter - starsBefore : null;

  return (
    <div className="animate-[fadeIn_.3s_ease]">
      {/* Banner grande con veredicto */}
      <div className={'p-10 text-center rounded-card border-4 shadow-card mb-4 ' + toneBox}>
        <div className="text-7xl mb-1 leading-none">{icon}</div>
        <div className={'font-display text-6xl font-bold tracking-tight leading-none mb-2 ' + toneText}>
          {resultado}
        </div>
        <div className="text-sm font-display font-medium text-ink-700 dark:text-ink-100">
          Inspección registrada · {response?.defectos_encontrados ?? 0} defecto(s)
        </div>
        <div className="text-xs text-ink-500 dark:text-ink-300 mt-2 space-x-1">
          {response?.score != null && (
            <span>Score: <span className="font-mono font-semibold">{response.score}</span></span>
          )}
          {starsBefore != null && starsAfter != null && (
            <span>
              · Proveedor pasó de{' '}
              <span className="font-mono font-semibold">{Number(starsBefore).toFixed(1)}</span>{' '}
              a{' '}
              <span className="font-mono font-semibold">{Number(starsAfter).toFixed(1)}</span>{' '}
              estrellas
            </span>
          )}
          {response?.inspeccion_id != null && (
            <span className="text-ink-400">· ID #{response.inspeccion_id}</span>
          )}
        </div>
      </div>

      {/* Detalle del proveedor con delta de stars */}
      {starsBefore != null && starsAfter != null && (
        <div className="bg-white border border-ink-100 rounded-card p-4 shadow-card mb-4 dark:bg-ink-700 dark:border-ink-600">
          <div className="text-[10px] font-display font-semibold uppercase tracking-industrial text-ink-400 mb-2">
            Calificación del proveedor — {scanData?.proveedor_nombre || '—'}
          </div>
          <div className="flex items-center justify-around gap-4">
            <div className="text-center">
              <div className="text-[10px] uppercase tracking-industrial text-ink-400 mb-1">Antes</div>
              <div className="font-mono text-3xl font-semibold text-ink-500 dark:text-ink-300">
                {Number(starsBefore).toFixed(1)}
              </div>
            </div>
            <div className="text-3xl text-ink-300">→</div>
            <div className="text-center">
              <div className="text-[10px] uppercase tracking-industrial text-ink-400 mb-1">Después</div>
              <div className={
                'font-mono text-3xl font-bold ' +
                (starsDelta > 0
                  ? 'text-flow dark:text-flow-ring'
                  : starsDelta < 0
                  ? 'text-anomaly dark:text-anomaly-ring'
                  : 'text-ink-700 dark:text-ink-100')
              }>
                {Number(starsAfter).toFixed(1)}
              </div>
              {starsDelta != null && starsDelta !== 0 && (
                <div className={
                  'text-[11px] font-mono mt-0.5 ' +
                  (starsDelta > 0 ? 'text-flow dark:text-flow-ring' : 'text-anomaly dark:text-anomaly-ring')
                }>
                  {starsDelta > 0 ? '+' : ''}{starsDelta.toFixed(2)}
                </div>
              )}
            </div>
            {response?.level_nuevo && (
              <>
                <div className="text-3xl text-ink-300">·</div>
                <div className="text-center">
                  <div className="text-[10px] uppercase tracking-industrial text-ink-400 mb-1">Nivel</div>
                  <NivelBadge level={response.level_nuevo} color={response.color_nuevo || 'bn'} />
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <button
        onClick={onContinue}
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
// SOCKET STATUS — pill indicando si estamos escuchando eventos en vivo
// ════════════════════════════════════════════════════════════════════

function SocketStatus({ connected }) {
  return (
    <div className="flex justify-end mb-2">
      <span className={
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border ' +
        'font-display text-[10px] font-semibold uppercase tracking-industrial ' +
        (connected
          ? 'bg-flow-bg text-flow border-flow-ring/40 dark:bg-flow/20 dark:text-flow-ring dark:border-flow-ring/40'
          : 'bg-ink-50 text-ink-400 border-ink-200 dark:bg-ink-600 dark:text-ink-300 dark:border-ink-500')
      }>
        <span className={
          'w-1.5 h-1.5 rounded-full ' +
          (connected
            ? 'bg-flow-ring shadow-[0_0_6px_rgba(34,197,94,0.6)] animate-pulse'
            : 'bg-ink-400')
        } />
        {connected ? 'Lectura en vivo' : 'Sin conexión en vivo'}
      </span>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// SCAN HISTORY PANEL — cola con los últimos prepacks detectados
// ════════════════════════════════════════════════════════════════════

function ScanHistoryPanel({ history, onPickPending, canPick }) {
  const totals = history.reduce(
    (acc, e) => {
      const accion = String(e.data?.accion || '').toUpperCase();
      if (accion === 'REVISAR') {
        if (e.status === 'pending') acc.pendientes += 1;
        else acc.inspeccionados += 1;
      } else if (accion === 'PASA') {
        acc.pasa += 1;
      } else if (accion === 'RECHAZADO_TOTAL') {
        acc.bloqueados += 1;
      }
      return acc;
    },
    { pendientes: 0, inspeccionados: 0, pasa: 0, bloqueados: 0 }
  );

  return (
    <div className="mt-4 bg-white border border-ink-100 rounded-card p-4 shadow-card dark:bg-ink-700 dark:border-ink-600">
      {/* Header con totales */}
      <div className="flex items-center justify-between mb-3 pb-3 border-b border-ink-100 dark:border-ink-600">
        <div>
          <div className="text-[10px] font-display font-medium uppercase tracking-industrial text-ink-400">
            Historial de escaneos
          </div>
          {totals.pendientes > 0 && (
            <div className="text-[11px] text-attention dark:text-attention-ring font-display font-semibold mt-0.5">
              {totals.pendientes} pendiente{totals.pendientes !== 1 ? 's' : ''} en cola
              {canPick ? ' · clic para inspeccionar' : ' · termina el actual primero'}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <HistoryStat label="Pendientes"     value={totals.pendientes}     tone="attention" pulse={totals.pendientes > 0} />
          <HistoryStat label="Inspeccionados" value={totals.inspeccionados} tone="ink" />
          <HistoryStat label="Pasaron"        value={totals.pasa}           tone="flow" />
          <HistoryStat label="Bloqueados"     value={totals.bloqueados}     tone="anomaly" />
          <HistoryStat label="Total"          value={history.length}        tone="ink" />
        </div>
      </div>

      {/* Lista */}
      {history.length === 0 ? (
        <div className="text-center py-6 text-xs text-ink-400">
          Aún no se ha escaneado ningún prepack en esta sesión.
        </div>
      ) : (
        <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1">
          {history.map((entry, idx) => (
            <HistoryRow
              key={entry.id}
              entry={entry}
              isLatest={idx === 0}
              canPick={canPick}
              onPick={() => onPickPending?.(entry)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function HistoryStat({ label, value, tone, pulse }) {
  const cls = {
    flow:      'text-flow dark:text-flow-ring',
    attention: 'text-attention dark:text-attention-ring',
    anomaly:   'text-anomaly dark:text-anomaly-ring',
    ink:       'text-ink-700 dark:text-ink-100',
  }[tone];
  return (
    <div className="text-right">
      <div className="text-[9px] font-display font-medium uppercase tracking-industrial text-ink-400">
        {label}
      </div>
      <div className={
        'font-mono text-base font-semibold leading-none ' + cls +
        (pulse ? ' animate-pulse' : '')
      }>
        {value}
      </div>
    </div>
  );
}

function HistoryRow({ entry, isLatest, canPick, onPick }) {
  const data = entry.data || {};
  const accion = String(data.accion || '').toUpperCase();
  const isRevisar  = accion === 'REVISAR';
  const isBlocked  = accion === 'RECHAZADO_TOTAL';
  const isPending  = entry.status === 'pending';
  const isClickable = isRevisar && isPending && canPick;

  // Pill del veredicto
  let verdictLabel;
  let verdictCls;
  if (isRevisar) {
    if (isPending) {
      verdictLabel = '⏳ PENDIENTE';
      verdictCls = 'bg-attention-bg text-attention border-attention-ring/50 dark:bg-attention/20 dark:text-attention-ring dark:border-attention-ring/50';
    } else {
      verdictLabel = '🔍 INSPECCIONADO';
      verdictCls = 'bg-ink-100 text-ink-500 border-ink-200 dark:bg-ink-500 dark:text-ink-200 dark:border-ink-400';
    }
  } else if (isBlocked) {
    verdictLabel = '🚫 BLOQUEADO';
    verdictCls = 'bg-anomaly-bg text-anomaly border-anomaly-ring/50 dark:bg-anomaly/20 dark:text-anomaly-ring dark:border-anomaly-ring/50';
  } else {
    verdictLabel = '✓ NO SE ESCANEA';
    verdictCls = 'bg-flow-bg text-flow border-flow-ring/50 dark:bg-flow/20 dark:text-flow-ring dark:border-flow-ring/50';
  }

  const sourceLabel = entry.source === 'rfid'
    ? 'RFID'
    : entry.source === 'manual'
    ? 'Manual'
    : entry.source === 'postman'
    ? 'Postman'
    : '—';

  const baseRowCls = isPending && isRevisar
    ? 'bg-attention-bg/50 border-attention-ring/40 dark:bg-attention/15 dark:border-attention-ring/40'
    : isBlocked
    ? 'bg-anomaly-bg/40 border-anomaly-ring/40 dark:bg-anomaly/10 dark:border-anomaly-ring/40'
    : isLatest
    ? 'bg-blue-50 border-rfid/40 dark:bg-rfid/15 dark:border-rfid/40 animate-[fadeIn_.3s_ease]'
    : 'bg-ink-50 border-ink-100 dark:bg-ink-600 dark:border-ink-500';

  const interactiveCls = isClickable
    ? 'cursor-pointer hover:border-attention-ring hover:shadow-md dark:hover:border-attention-ring transition-all'
    : isPending && isRevisar
    ? 'cursor-not-allowed opacity-90'
    : '';

  const content = (
    <>
      {/* Veredicto */}
      <span className={
        'inline-flex items-center px-2.5 py-1 rounded-md border font-display text-[11px] font-semibold uppercase tracking-industrial shrink-0 ' +
        verdictCls
      }>
        {verdictLabel}
      </span>

      {/* EPC + datos del producto */}
      <div className="flex-1 min-w-0">
        <div className="font-mono text-[12px] text-ink-700 dark:text-ink-100 truncate">
          {data.epc || '—'}
        </div>
        <div className="text-[11px] text-ink-400 truncate mt-0.5">
          {data.proveedor_nombre || 'Proveedor desconocido'}
          {data.sku   && (<> · <span className="font-mono">{data.sku}</span></>)}
          {data.talla && (<> · {data.talla}</>)}
          {data.color && (<> · {data.color}</>)}
        </div>
      </div>

      {/* Origen + hora + (CTA si pendiente clickeable) */}
      <div className="text-right shrink-0">
        <div className="text-[10px] uppercase tracking-industrial text-ink-400">
          {sourceLabel}
        </div>
        <div className="font-mono text-[11px] text-ink-500 dark:text-ink-300 mt-0.5">
          {formatTime(entry.timestamp)}
        </div>
        {isClickable && (
          <div className="text-[10px] font-display font-semibold text-attention dark:text-attention-ring mt-1 uppercase tracking-industrial">
            Inspeccionar →
          </div>
        )}
      </div>
    </>
  );

  const className = 'flex items-center gap-3 px-3 py-2.5 rounded-card border ' + baseRowCls + ' ' + interactiveCls;

  if (isClickable) {
    return (
      <button type="button" onClick={onPick} className={'w-full text-left ' + className}>
        {content}
      </button>
    );
  }
  return <div className={className}>{content}</div>;
}

function formatTime(date) {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
