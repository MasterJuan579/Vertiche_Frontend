import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LECTURAS_INICIALES,
  ANOMALIAS_INICIALES,
  getContadores,
  STAGES,
} from '../data/demoLecturas.js';
import { EventoRow } from '../components/EventoRow.jsx';
import { AnomaliaAlert } from '../components/AnomaliaAlert.jsx';

const FILTROS = ['TODAS', ...STAGES];

/**
 * Reading log (bitácora) for the supervisor. Originally was "Lecturas en
 * Vivo" with a Socket.io feed; renamed to reflect that without sockets this
 * is a static snapshot of the most recent reads.
 *
 * Sections:
 *   - Header strip with filter pills + total count + "snapshot" badge
 *   - Left column: event stream (filterable by stage)
 *   - Right column: 4 KPI counters + recent anomalies
 *
 * Clicking an EPC navigates to /rfid/trazabilidad/:epc.
 */
export function Bitacora() {
  const navigate = useNavigate();
  const [filtroEtapa, setFiltroEtapa] = useState('TODAS');
  const [anomaliasShown, setAnomaliasShown] = useState(ANOMALIAS_INICIALES);

  const eventos = LECTURAS_INICIALES;
  const eventosFiltrados = filtroEtapa === 'TODAS'
    ? eventos
    : eventos.filter((e) => e.etapa === filtroEtapa);

  const contadores = getContadores();

  const statCards = [
    { label: 'Lecturas Pre-Reg', valor: contadores.preregistro, accent: 'text-rfid dark:text-blue-300' },
    { label: 'Lecturas Bahía',   valor: contadores.bahia,       accent: 'text-flow dark:text-flow-ring' },
    { label: 'Anomalías',        valor: contadores.anomalias,   accent: 'text-anomaly dark:text-anomaly-ring' },
    { label: 'Duplicados',       valor: contadores.duplicados,  accent: 'text-attention dark:text-attention-ring' },
  ];

  const handleClickEpc = (epc) => {
    if (epc && epc !== '—') {
      navigate(`/rfid/trazabilidad/${epc}`);
    }
  };

  const dismissAnomaly = (id) => {
    setAnomaliasShown((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 items-start">

      {/* ════════════ EVENT STREAM ════════════ */}
      <Panel>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-ink-100 dark:border-ink-600">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] font-bold uppercase tracking-industrial text-ink-400">
              Bitácora de lecturas
            </span>
            <span className={
              'text-[9px] font-bold uppercase tracking-industrial px-1.5 py-0.5 rounded ' +
              'bg-attention-bg text-attention border border-attention-ring/40 ' +
              'dark:bg-attention/20 dark:text-attention-ring dark:border-attention-ring/40'
            }>
              Snapshot
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-flow-ring animate-[blink_1.5s_ease-in-out_infinite]" />
            <span className="text-[11px] font-medium text-flow dark:text-flow-ring">
              {eventos.length} eventos
            </span>
          </div>
        </div>

        {/* Stage filter chips */}
        <div className="flex gap-1.5 px-4 py-2.5 border-b border-ink-100 dark:border-ink-600 flex-wrap">
          {FILTROS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setFiltroEtapa(e)}
              className={
                'px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ' +
                (filtroEtapa === e
                  ? 'bg-rfid text-white border border-rfid'
                  : 'bg-white text-ink-500 border border-ink-100 hover:bg-ink-50 dark:bg-ink-700 dark:text-ink-300 dark:border-ink-500 dark:hover:bg-ink-600')
              }
            >
              {e}
            </button>
          ))}
          <span className="ml-auto self-center text-[11px] text-ink-400">
            {eventosFiltrados.length} filtrados
          </span>
        </div>

        {/* Table header row */}
        <div className={
          'grid grid-cols-[80px_1fr_120px_110px_60px] gap-2 items-center ' +
          'px-3 py-2 border-b border-ink-100 dark:border-ink-600 ' +
          'bg-ink-50 dark:bg-ink-800 ' +
          'font-mono text-[10px] font-bold uppercase tracking-industrial text-ink-400'
        }>
          <span>Hora</span>
          <span>EPC</span>
          <span>Lector</span>
          <span>Etapa</span>
          <span>OK</span>
        </div>

        {/* Stream */}
        {eventosFiltrados.length === 0 ? (
          <div className="px-6 py-8 text-center text-[13px] text-ink-400">
            Sin lecturas para la etapa <strong>{filtroEtapa}</strong>.
          </div>
        ) : (
          <div>
            {eventosFiltrados.map((e, i) => (
              <EventoRow
                key={e.id}
                evento={e}
                striped={i % 2 === 1}
                onClickEpc={handleClickEpc}
              />
            ))}
          </div>
        )}
      </Panel>

      {/* ════════════ RIGHT SIDEBAR ════════════ */}
      <div className="space-y-4">

        {/* KPI counters */}
        <Panel title="Contadores del turno">
          <div className="grid grid-cols-2 gap-px bg-ink-100 dark:bg-ink-600">
            {statCards.map((s) => (
              <div
                key={s.label}
                className="px-4 py-3 bg-white dark:bg-ink-700"
              >
                <div className={'text-[24px] font-bold leading-none ' + s.accent}>
                  {s.valor}
                </div>
                <div className="text-[10px] uppercase tracking-industrial text-ink-400 mt-1">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </Panel>

        {/* Anomalies */}
        <Panel title={`Anomalías recientes (${anomaliasShown.length})`}>
          <div className="p-3 space-y-2">
            {anomaliasShown.length === 0 ? (
              <div className="px-4 py-4 text-center text-[13px] text-ink-400">
                Sin anomalías recientes
              </div>
            ) : (
              anomaliasShown.map((a) => (
                <AnomaliaAlert
                  key={a.id}
                  anomalia={a}
                  onDismiss={() => dismissAnomaly(a.id)}
                />
              ))
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// Helpers
// ════════════════════════════════════════════════════════════════════

function Panel({ title, children }) {
  return (
    <div className={
      'rounded-card border shadow-card overflow-hidden ' +
      'bg-white border-ink-100 ' +
      'dark:bg-ink-700 dark:border-ink-600'
    }>
      {title && (
        <div className="px-4 py-2.5 border-b border-ink-100 dark:border-ink-600 font-mono text-[11px] font-bold uppercase tracking-industrial text-ink-400">
          {title}
        </div>
      )}
      {children}
    </div>
  );
}
