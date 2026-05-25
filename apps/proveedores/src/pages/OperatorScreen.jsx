import { useState } from 'react';
import { OperatorBar } from '../components/OperatorBar.jsx';
import { NivelBadge } from '../components/NivelBadge.jsx';
import { Stars } from '../components/Stars.jsx';
import {
  CARGO_SCENARIOS,
  PRODUCT_CATALOG,
  DEFECT_TYPES,
  MOCK_EPCS,
  COLOR_MAP,
  SUPPLIER_PROFILES,
  SUPPLIERS_INITIAL,
  calcSampleSize,
  sampleHint,
} from '../data/demoData.js';

/**
 * QA inspector's main screen. Cycles through CARGO_SCENARIOS to simulate
 * trucks arriving at the bay. For each scenario, the inspector reviews
 * sample-sized prepacks and reports "siniestros" (defects) for any that
 * fail QA.
 *
 * Siniestro capture is a 3-step sub-flow:
 *   1. Type → pick a defect category + add notes
 *   2. RFID → simulate or type the prepack's EPC
 *   3. Decide → reject the prepack or pass it with observation
 *
 * In production this would POST to /api/inspeccion-qa per siniestro and
 * PUT to /api/proveedores/:id/calificacion on finish. Currently mock-only.
 */

const SINIESTRO_IDLE   = 'idle';
const SINIESTRO_TYPE   = 'type';
const SINIESTRO_RFID   = 'rfid';
const SINIESTRO_DECIDE = 'decide';

const STEP_DOT_CLS = {
  blue:  'bg-rfid',
  amber: 'bg-attention-ring',
  red:   'bg-anomaly-ring',
};

export function OperatorScreen() {
  const [review, setReview]         = useState(null);
  const [siniestros, setSiniestros] = useState([]);
  const [sinStep, setSinStep]       = useState(SINIESTRO_IDLE);
  const [sinDraft, setSinDraft]     = useState({ type: null, notes: '', otherText: '', ppk: null });
  const [rfidInput, setRfidInput]   = useState('');
  const [rfidOk, setRfidOk]         = useState(false);
  const [cycleIdx, setCycleIdx]     = useState(0);
  const [cycleNum, setCycleNum]     = useState(1);

  const startReview = () => {
    const scenario = CARGO_SCENARIOS[cycleIdx % CARGO_SCENARIOS.length];
    const supplier = SUPPLIERS_INITIAL.find((s) => s.id === scenario.supplierId);
    const profile  = SUPPLIER_PROFILES[scenario.supplierId];
    setReview({
      supplier,
      profile,
      scenario,
      sampleSize: calcSampleSize(supplier.stars, scenario.qty),
    });
    setSiniestros([]);
    setSinStep(SINIESTRO_IDLE);
    setSinDraft({ type: null, notes: '', otherText: '', ppk: null });
    setRfidInput('');
    setRfidOk(false);
    setCycleIdx((i) => i + 1);
  };

  const finishReview = () => {
    if (!review) return;
    // In production: POST each siniestro, PUT updated rating.
    // For mock-only: just clear state and bump the cycle counter.
    setReview(null);
    setCycleNum((n) => n + 1);
  };

  const startSiniestro = () => {
    setSinDraft({ type: null, notes: '', otherText: '', ppk: null });
    setRfidInput('');
    setRfidOk(false);
    setSinStep(SINIESTRO_TYPE);
  };
  const selectType = (cat) => setSinDraft((d) => ({ ...d, type: cat }));
  const goToRfid = () => { if (sinDraft.type) setSinStep(SINIESTRO_RFID); };
  const simulateRfid = () => {
    const epc = MOCK_EPCS[siniestros.length % MOCK_EPCS.length];
    setRfidInput(epc);
    setRfidOk(true);
    setSinDraft((d) => ({ ...d, ppk: epc }));
  };
  const goToDecide = () => { if (rfidOk) setSinStep(SINIESTRO_DECIDE); };
  const finalizeSiniestro = (decision) => {
    const type = sinDraft.type === 'Otro (especificar)' && sinDraft.otherText
      ? sinDraft.otherText
      : sinDraft.type;
    setSiniestros((prev) => [
      ...prev,
      { id: Date.now(), type, notes: sinDraft.notes, ppk: sinDraft.ppk, decision },
    ]);
    setSinStep(SINIESTRO_IDLE);
  };
  const cancelSiniestro = () => setSinStep(SINIESTRO_IDLE);

  // ──────────────────────────────────────────────────────────────────
  // EMPTY STATE — waiting for next cargo
  // ──────────────────────────────────────────────────────────────────
  if (!review) {
    return (
      <div className="px-8 py-5 max-w-[1400px] mx-auto">
        <OperatorBar counterLabel="Revisión" counterValue={cycleNum} />

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
            <span className="text-4xl">📦</span>
          </div>
          <p className="text-base font-display font-medium text-ink-700 dark:text-ink-100 mb-1.5">
            Esperando siguiente carga
          </p>
          <p className="text-xs text-ink-400 mb-7">
            Presiona el botón cuando llegue un camión al andén
          </p>
          <button
            onClick={startReview}
            className={
              'px-8 py-3.5 rounded-card font-display text-sm font-semibold text-white ' +
              'bg-rfid border border-rfid hover:bg-blue-700 transition-colors ' +
              'dark:hover:bg-blue-600'
            }
          >
            Iniciar revisión — Siguiente carga
          </button>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────
  // ACTIVE REVIEW
  // ──────────────────────────────────────────────────────────────────
  const { supplier, profile, scenario } = review;
  const rejected = siniestros.filter((s) => s.decision === 'reject').length;
  const observed = siniestros.filter((s) => s.decision === 'pass').length;

  return (
    <div className="px-8 py-5 max-w-[1400px] mx-auto">
      <OperatorBar counterLabel="Revisión" counterValue={cycleNum} />

      <div className="grid grid-cols-2 grid-rows-[auto_auto] gap-3.5 mb-3.5">

        {/* ───── SECCIÓN 1 — Info del cargamento ───── */}
        <SectionCard step="1" label="Info del cargamento" dot="blue">
          {/* Supplier header */}
          <div className="flex items-start justify-between mb-3">
            <div className="min-w-0">
              <div className="font-display text-base font-semibold text-ink-700 dark:text-ink-100 mb-0.5">
                {supplier.name}
              </div>
              <div className="font-mono text-[11px] text-ink-400 mb-1.5 truncate">
                {profile?.rfc || '—'} · {supplier.origin} · {scenario.po}
              </div>
              <NivelBadge level={supplier.level} color={supplier.color} />
            </div>
            <div className="text-right shrink-0 ml-3">
              <div className="font-mono text-[28px] font-semibold text-amber-500 dark:text-amber-400 leading-none">
                {supplier.stars.toFixed(1)}
              </div>
              <div className="mt-1 flex justify-end">
                <Stars rating={supplier.stars} size={13} />
              </div>
            </div>
          </div>

          {/* Mini KPIs */}
          <div className="grid grid-cols-3 gap-2 mb-3.5">
            {[
              { label: 'Total prepacks',   value: scenario.qty },
              { label: 'Entregas previas', value: profile?.deliveries ?? '—' },
              { label: 'Aprobación hist.', value: profile ? `${profile.approval}%` : '—' },
            ].map((k) => (
              <div
                key={k.label}
                className="px-2.5 py-2 rounded-card bg-ink-50 dark:bg-ink-600"
              >
                <div className="text-[9px] font-display font-medium uppercase tracking-industrial text-ink-400 mb-0.5">
                  {k.label}
                </div>
                <div className="font-mono text-base font-semibold text-ink-700 dark:text-ink-100">
                  {k.value}
                </div>
              </div>
            ))}
          </div>

          {/* Cargo composition */}
          <div className="text-[10px] font-display font-medium uppercase tracking-industrial text-ink-400 mb-2">
            Contenido del cargamento
          </div>
          {scenario.composition.map((c, i) => {
            const p = PRODUCT_CATALOG.find((x) => x.id === c.productId) || { name: c.productId };
            const colorCSS = COLOR_MAP[(c.color || '').toLowerCase()] || '#a855f7';
            const esClaro = ['blanco', 'white', 'beige', 'amarillo'].includes((c.color || '').toLowerCase());
            const isLast = i === scenario.composition.length - 1;
            return (
              <div
                key={i}
                className={
                  'flex items-center gap-2.5 py-2 ' +
                  (isLast ? '' : 'border-b border-ink-100 dark:border-ink-600')
                }
              >
                <span
                  className={
                    'w-3.5 h-3.5 rounded-full shrink-0 border ' +
                    (esClaro ? 'border-ink-200' : 'border-white/10')
                  }
                  style={{ background: colorCSS }}
                />
                <span className="flex-1 text-[13px] text-ink-700 dark:text-ink-100">
                  {p.name}
                  <span className="text-ink-400"> · {c.color} · {c.talla}</span>
                </span>
                <span className="font-mono text-[13px] font-semibold text-amber-500 dark:text-amber-400">
                  {c.qty} prenda{c.qty !== 1 ? 's' : ''}
                </span>
              </div>
            );
          })}
        </SectionCard>

        {/* ───── SECCIÓN 2 — Muestreo requerido ───── */}
        <SectionCard step="2" label="Muestreo requerido" dot="amber">
          <div className="text-center pt-3 pb-4">
            <div className="font-mono text-[64px] font-semibold leading-none mb-1.5 text-attention dark:text-attention-ring">
              {review.sampleSize}
            </div>
            <div className="text-[13px] font-display font-medium text-ink-700 dark:text-ink-100 mb-1.5">
              prepacks a revisar
            </div>
            <div className="text-[11px] text-ink-400 max-w-[260px] mx-auto">
              {sampleHint(supplier.stars)}
            </div>
          </div>

          <hr className="border-ink-100 dark:border-ink-600 my-3" />

          <div className="text-[10px] font-display font-medium uppercase tracking-industrial text-ink-400 mb-2.5">
            Progreso
          </div>
          {[
            { label: 'Defectos reportados',    value: siniestros.length, cls: 'text-ink-700 dark:text-ink-100' },
            { label: 'Prepacks rechazados',    value: rejected,          cls: 'text-anomaly dark:text-anomaly-ring' },
            { label: 'Pasados con observación', value: observed,         cls: 'text-attention dark:text-attention-ring' },
          ].map((r, i, arr) => {
            const isLast = i === arr.length - 1;
            return (
              <div
                key={r.label}
                className={
                  'flex justify-between py-2 text-xs ' +
                  (isLast ? '' : 'border-b border-ink-100 dark:border-ink-600')
                }
              >
                <span className="text-ink-500 dark:text-ink-300">{r.label}</span>
                <span className={'font-mono text-[15px] font-semibold ' + r.cls}>{r.value}</span>
              </div>
            );
          })}

          <div className={
            'mt-3 px-3 py-2.5 rounded-card text-[11px] leading-relaxed ' +
            'bg-blue-50 border border-rfid/30 text-ink-500 ' +
            'dark:bg-rfid/10 dark:border-rfid/40 dark:text-ink-300'
          }>
            ⓘ Los prepacks sin reporte de siniestro se asumen como OK al finalizar la revisión.
          </div>
        </SectionCard>

        {/* ───── SECCIÓN 3 — Captura de siniestros (full width) ───── */}
        <div className="col-span-2">
          <SectionCard step="3" label="Captura de siniestros" dot="red"
            rightSlot={
              <span className="ml-auto font-mono text-[11px] text-ink-400">
                {siniestros.length} reportado(s)
              </span>
            }
          >
            {sinStep === SINIESTRO_IDLE && (
              <SiniestroIdle
                siniestros={siniestros}
                onStart={startSiniestro}
              />
            )}

            {sinStep === SINIESTRO_TYPE && (
              <SiniestroType
                sinDraft={sinDraft}
                setSinDraft={setSinDraft}
                onSelect={selectType}
                onBack={cancelSiniestro}
                onNext={goToRfid}
              />
            )}

            {sinStep === SINIESTRO_RFID && (
              <SiniestroRfid
                sinDraft={sinDraft}
                rfidInput={rfidInput}
                setRfidInput={setRfidInput}
                rfidOk={rfidOk}
                onBack={() => setSinStep(SINIESTRO_TYPE)}
                onSimulate={simulateRfid}
                onNext={goToDecide}
              />
            )}

            {sinStep === SINIESTRO_DECIDE && (
              <SiniestroDecide
                sinDraft={sinDraft}
                onBack={() => setSinStep(SINIESTRO_RFID)}
                onFinalize={finalizeSiniestro}
              />
            )}
          </SectionCard>
        </div>
      </div>

      {/* ───── Footer — finish review ───── */}
      <div className="flex items-center justify-between gap-5 px-4 py-3.5 bg-white border border-ink-100 rounded-card shadow-card dark:bg-ink-700 dark:border-ink-600">
        <p className="flex-1 text-xs text-ink-500 dark:text-ink-300">
          Cuando termines la inspección de la muestra, cierra la revisión para liberar la carga y actualizar la calificación del proveedor.
        </p>
        <button
          onClick={finishReview}
          className={
            'shrink-0 px-6 py-3 rounded-card font-display text-sm font-semibold text-white ' +
            'bg-flow hover:bg-green-700 transition-colors'
          }
        >
          Terminar revisión →
        </button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// SECTION CARD — wraps each of the 3 main sections
// ════════════════════════════════════════════════════════════════════

function SectionCard({ step, label, dot, rightSlot, children }) {
  return (
    <div className="bg-white border border-ink-100 rounded-card p-4 shadow-card dark:bg-ink-700 dark:border-ink-600">
      <div className="flex items-center gap-1.5 mb-3.5 pb-2.5 border-b border-ink-100 dark:border-ink-600">
        <span className={'w-2 h-2 rounded-full shrink-0 ' + (STEP_DOT_CLS[dot] || STEP_DOT_CLS.blue)} />
        <span className="text-[10px] font-display font-semibold uppercase tracking-industrial text-ink-400">
          {step}
        </span>
        <span className="text-[13px] font-display font-semibold text-ink-700 dark:text-ink-100">
          {label}
        </span>
        {rightSlot}
      </div>
      {children}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// SINIESTRO SUB-FLOW — 4 components for the 4 sub-states
// ════════════════════════════════════════════════════════════════════

function SiniestroIdle({ siniestros, onStart }) {
  return (
    <>
      <button
        onClick={onStart}
        className={
          'w-full p-6 text-center rounded-card transition-colors ' +
          'bg-anomaly-bg border-2 border-dashed border-anomaly-ring ' +
          'hover:bg-anomaly/15 ' +
          'dark:bg-anomaly/15 dark:border-anomaly-ring dark:hover:bg-anomaly/25'
        }
      >
        <div className="text-3xl mb-1">⚠️</div>
        <div className="font-display text-[15px] font-semibold text-ink-700 dark:text-ink-100">
          Reportar siniestro en prepack
        </div>
        <div className="text-[11px] text-ink-400 mt-1">
          Captura defectos, roturas, calidad, etc.
        </div>
      </button>

      {siniestros.length > 0 && (
        <div className="mt-3.5">
          <div className="text-[10px] font-display font-medium uppercase tracking-industrial text-ink-400 mb-2">
            Siniestros en esta carga
          </div>
          {siniestros.map((s) => {
            const isReject = s.decision === 'reject';
            const pillCls = isReject
              ? 'bg-anomaly-bg text-anomaly border-anomaly-ring dark:bg-anomaly/20 dark:text-anomaly-ring dark:border-anomaly-ring/50'
              : 'bg-attention-bg text-attention border-attention-ring dark:bg-attention/20 dark:text-attention-ring dark:border-attention-ring/50';
            return (
              <div
                key={s.id}
                className={
                  'flex items-center gap-2.5 px-3 py-2.5 mb-1.5 ' +
                  'bg-ink-50 border border-ink-100 rounded-card ' +
                  'dark:bg-ink-600 dark:border-ink-500'
                }
              >
                <span className="text-lg">{isReject ? '❌' : '⚠️'}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-xs font-semibold text-ink-700 dark:text-ink-100 truncate">
                    {s.ppk} · {s.type}
                  </div>
                  <div className="text-[11px] text-ink-400 mt-0.5 truncate">
                    {s.notes || 'Sin notas adicionales'}
                  </div>
                </div>
                <span className={
                  'text-[10px] font-display font-semibold px-2 py-0.5 rounded-md border uppercase tracking-wide ' +
                  pillCls
                }>
                  {isReject ? 'Rechazado' : 'Pasó c/ obs'}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

function SiniestroType({ sinDraft, setSinDraft, onSelect, onBack, onNext }) {
  return (
    <div className="animate-[fadeIn_.25s_ease]">
      <StepHeader onBack={onBack} text="Paso 1 de 3 · Tipo de defecto" />

      <div className="grid grid-cols-4 gap-2 mb-3">
        {DEFECT_TYPES.map((d) => {
          const selected = sinDraft.type === d.cat;
          return (
            <button
              key={d.cat}
              onClick={() => onSelect(d.cat)}
              className={
                'flex flex-col items-center gap-1.5 px-2.5 py-3 rounded-card border text-xs font-medium transition-colors ' +
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

      {sinDraft.type === 'Otro (especificar)' && (
        <div className="mb-3 animate-[fadeIn_.25s_ease]">
          <label className="block text-[10px] font-display font-medium uppercase tracking-industrial text-ink-400 mb-1">
            Describe el problema
          </label>
          <textarea
            value={sinDraft.otherText}
            onChange={(e) => setSinDraft((d) => ({ ...d, otherText: e.target.value }))}
            placeholder="Ej: pintura corrida en logo frontal..."
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

      <div className="mb-3">
        <label className="block text-[10px] font-display font-medium uppercase tracking-industrial text-ink-400 mb-1">
          Notas adicionales (opcional)
        </label>
        <textarea
          value={sinDraft.notes}
          onChange={(e) => setSinDraft((d) => ({ ...d, notes: e.target.value }))}
          placeholder="Ubicación del defecto, severidad..."
          rows={2}
          className={
            'w-full px-3 py-2.5 rounded-card text-[13px] outline-none resize-y ' +
            'bg-ink-50 border border-ink-100 text-ink-700 placeholder:text-ink-400 ' +
            'focus:border-rfid ' +
            'dark:bg-ink-600 dark:border-ink-500 dark:text-ink-100'
          }
        />
      </div>

      <button
        onClick={onNext}
        disabled={!sinDraft.type}
        className={
          'w-full px-3 py-3 rounded-card font-display text-[13px] font-semibold transition-colors ' +
          (sinDraft.type
            ? 'bg-rfid text-white hover:bg-blue-700 cursor-pointer'
            : 'bg-ink-100 text-ink-400 cursor-not-allowed dark:bg-ink-600 dark:text-ink-400')
        }
      >
        Continuar al escaneo RFID →
      </button>
    </div>
  );
}

function SiniestroRfid({ sinDraft, rfidInput, setRfidInput, rfidOk, onBack, onSimulate, onNext }) {
  return (
    <div className="animate-[fadeIn_.25s_ease]">
      <StepHeader onBack={onBack} text="Paso 2 de 3 · Identificar prepack" />

      <div className={
        'p-6 text-center rounded-card border ' +
        'bg-blue-50 border-rfid ' +
        'dark:bg-rfid/15 dark:border-rfid'
      }>
        <div className="text-4xl mb-2.5">📡</div>
        <div className="font-display text-[15px] font-semibold text-ink-700 dark:text-ink-100 mb-1">
          Escanea el prepack con defecto
        </div>
        <div className="text-xs text-ink-500 dark:text-ink-300 mb-4">
          Acerca el lector RFID al prepack que presenta:{' '}
          <span className="font-mono text-anomaly dark:text-anomaly-ring">{sinDraft.type}</span>
        </div>
        <div className="max-w-[340px] mx-auto">
          <input
            type="text"
            value={rfidInput}
            onChange={(e) => setRfidInput(e.target.value)}
            placeholder="Esperando lectura RFID..."
            className={
              'w-full px-3 py-2.5 rounded-card text-[13px] text-center outline-none font-mono ' +
              'bg-white border border-ink-100 text-ink-700 placeholder:text-ink-400 ' +
              'focus:border-rfid ' +
              'dark:bg-ink-700 dark:border-ink-500 dark:text-ink-100'
            }
          />
          <button
            onClick={onSimulate}
            className="mt-2.5 px-4 py-2 rounded-card font-display text-xs font-semibold text-white bg-rfid hover:bg-blue-700 transition-colors"
          >
            Simular lectura RFID
          </button>
        </div>
      </div>

      {rfidOk && (
        <div className="mt-3.5">
          <div className={
            'p-3.5 mb-3 text-center rounded-card border ' +
            'bg-flow-bg border-flow-ring ' +
            'dark:bg-flow/15 dark:border-flow-ring'
          }>
            <div className="text-xs font-display font-semibold text-flow dark:text-flow-ring mb-1">
              ✓ PREPACK IDENTIFICADO
            </div>
            <div className="font-mono text-lg text-ink-700 dark:text-ink-100">
              {sinDraft.ppk}
            </div>
          </div>
          <button
            onClick={onNext}
            className="w-full px-3 py-3 rounded-card font-display text-[13px] font-semibold text-white bg-rfid hover:bg-blue-700 transition-colors"
          >
            Continuar a decisión →
          </button>
        </div>
      )}
    </div>
  );
}

function SiniestroDecide({ sinDraft, onBack, onFinalize }) {
  return (
    <div className="animate-[fadeIn_.25s_ease]">
      <StepHeader onBack={onBack} text="Paso 3 de 3 · Decisión final" />

      <div className="px-3.5 py-3 mb-3 rounded-card bg-ink-50 border border-ink-100 dark:bg-ink-600 dark:border-ink-500">
        {[
          { label: 'Prepack', value: sinDraft.ppk,  mono: true },
          { label: 'Defecto', value: sinDraft.type, mono: false },
        ].map((r, i, arr) => {
          const isLast = i === arr.length - 1;
          return (
            <div
              key={r.label}
              className={
                'flex justify-between py-1.5 text-xs ' +
                (isLast ? '' : 'border-b border-ink-100 dark:border-ink-500')
              }
            >
              <span className="text-ink-400">{r.label}</span>
              <span className={
                'font-medium text-ink-700 dark:text-ink-100 ' +
                (r.mono ? 'font-mono' : 'font-body')
              }>
                {r.value}
              </span>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <button
          onClick={() => onFinalize('reject')}
          className={
            'p-4 text-center rounded-card border-2 transition-colors ' +
            'bg-white border-ink-100 hover:bg-anomaly-bg hover:border-anomaly-ring ' +
            'dark:bg-ink-600 dark:border-ink-500 dark:hover:bg-anomaly/20 dark:hover:border-anomaly-ring'
          }
        >
          <div className="text-2xl">❌</div>
          <div className="mt-1 font-display text-[13px] font-semibold text-anomaly dark:text-anomaly-ring">
            Rechazar
          </div>
          <div className="text-[10px] text-ink-400 mt-0.5">No entra al flujo</div>
        </button>

        <button
          onClick={() => onFinalize('pass')}
          className={
            'p-4 text-center rounded-card border-2 transition-colors ' +
            'bg-white border-ink-100 hover:bg-attention-bg hover:border-attention-ring ' +
            'dark:bg-ink-600 dark:border-ink-500 dark:hover:bg-attention/20 dark:hover:border-attention-ring'
          }
        >
          <div className="text-2xl">⚠️</div>
          <div className="mt-1 font-display text-[13px] font-semibold text-attention dark:text-attention-ring">
            Pasar con obs.
          </div>
          <div className="text-[10px] text-ink-400 mt-0.5">Entra con penalización</div>
        </button>
      </div>
    </div>
  );
}

function StepHeader({ onBack, text }) {
  return (
    <div className="flex items-center gap-2.5 mb-3.5 pb-2.5 border-b border-ink-100 dark:border-ink-600">
      <button
        onClick={onBack}
        className={
          'w-[30px] h-[30px] rounded-card flex items-center justify-center text-[15px] transition-colors ' +
          'bg-ink-50 border border-ink-100 text-ink-500 hover:bg-ink-100 ' +
          'dark:bg-ink-600 dark:border-ink-500 dark:text-ink-300 dark:hover:bg-ink-500'
        }
      >
        ←
      </button>
      <span className="text-[13px] font-display font-semibold text-ink-700 dark:text-ink-100">
        {text}
      </span>
    </div>
  );
}
