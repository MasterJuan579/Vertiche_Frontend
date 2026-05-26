import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { EventoRow } from '../components/EventoRow.jsx';
import { AnomaliaAlert } from '../components/AnomaliaAlert.jsx';
import { realApi } from '../services/realApi.js';
import { cargarLecturasReales, LECTURAS_INICIALES, ANOMALIAS_INICIALES, getContadores } from '../data/demoLecturas.js';

export function Bitacora() {
  const navigate = useNavigate();
  const [filtroEtapa, setFiltroEtapa] = useState('TODAS');
  const [eventos, setEventos] = useState([]);
  const [anomalias, setAnomalias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [etapasDisponibles, setEtapasDisponibles] = useState([]);

  useEffect(() => {
    cargarDatos();
    const interval = setInterval(cargarDatos, 8000);
    return () => clearInterval(interval);
  }, []);

  async function cargarDatos() {
    try {
      setError(null);
      await cargarLecturasReales();
      
      // Actualizar estados con los datos cargados
      setEventos([...LECTURAS_INICIALES]);
      setAnomalias([...ANOMALIAS_INICIALES]);
      
      // Extraer etapas únicas
      const etapas = [...new Set(LECTURAS_INICIALES.map(l => l.etapa).filter(Boolean))];
      setEtapasDisponibles(etapas);
    } catch (err) {
      console.error('Error cargando bitácora:', err);
      setError('No se pudieron cargar los datos. ¿El backend está corriendo?');
    } finally {
      setCargando(false);
    }
  }

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

  const dismissAnomaly = async (id) => {
    try {
      await realApi.resolverAnomalia?.(id);
      setAnomalias(prev => prev.filter(a => a.id !== id));
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const FILTROS = ['TODAS', ...etapasDisponibles];

  // Estado de carga
  if (cargando) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-2xl mb-2">📡</div>
          <div className="text-ink-400">Cargando bitácora...</div>
          <div className="text-xs text-ink-300 mt-2">Conectando con {import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}</div>
        </div>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-2xl mb-2">⚠️</div>
          <div className="text-anomaly">{error}</div>
          <button 
            onClick={() => { setCargando(true); cargarDatos(); }}
            className="mt-4 px-4 py-2 bg-rfid text-white rounded-card text-sm"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 items-start">

      {/* EVENT STREAM */}
      <Panel>
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-ink-100 dark:border-ink-600">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] font-bold uppercase tracking-industrial text-ink-400">
              Bitácora de lecturas
            </span>
            <span className="text-[9px] font-bold uppercase tracking-industrial px-1.5 py-0.5 rounded bg-attention-bg text-attention border border-attention-ring/40">
              En Vivo
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-flow-ring animate-pulse" />
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
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
                filtroEtapa === e
                  ? 'bg-rfid text-white border border-rfid'
                  : 'bg-white text-ink-500 border border-ink-100 hover:bg-ink-50 dark:bg-ink-700 dark:text-ink-300 dark:border-ink-500 dark:hover:bg-ink-600'
              }`}
            >
              {e === 'TODAS' ? 'TODAS' : (e === 'PREREGISTRO' ? 'PRE-REG' : e)}
            </button>
          ))}
          <span className="ml-auto self-center text-[11px] text-ink-400">
            {eventosFiltrados.length} filtrados
          </span>
        </div>

        {/* Table header */}
        <div className="grid grid-cols-[80px_1fr_120px_110px_60px] gap-2 items-center px-3 py-2 border-b border-ink-100 dark:border-ink-600 bg-ink-50 dark:bg-ink-800 font-mono text-[10px] font-bold uppercase tracking-industrial text-ink-400">
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
            <div className="text-xs mt-2">Asegúrate de que el backend tenga datos en EventoLectura</div>
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

      {/* RIGHT SIDEBAR */}
      <div className="space-y-4">
        <Panel title="Contadores del turno">
          <div className="grid grid-cols-2 gap-px bg-ink-100 dark:bg-ink-600">
            {statCards.map((s) => (
              <div key={s.label} className="px-4 py-3 bg-white dark:bg-ink-700">
                <div className={`text-[24px] font-bold leading-none ${s.accent}`}>
                  {s.valor}
                </div>
                <div className="text-[10px] uppercase tracking-industrial text-ink-400 mt-1">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title={`Anomalías recientes (${anomalias.length})`}>
          <div className="p-3 space-y-2">
            {anomalias.length === 0 ? (
              <div className="px-4 py-4 text-center text-[13px] text-ink-400">
                Sin anomalías recientes
              </div>
            ) : (
              anomalias.map((a) => (
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

function Panel({ title, children }) {
  return (
    <div className="rounded-card border shadow-card overflow-hidden bg-white border-ink-100 dark:bg-ink-700 dark:border-ink-600">
      {title && (
        <div className="px-4 py-2.5 border-b border-ink-100 dark:border-ink-600 font-mono text-[11px] font-bold uppercase tracking-industrial text-ink-400">
          {title}
        </div>
      )}
      {children}
    </div>
  );
}