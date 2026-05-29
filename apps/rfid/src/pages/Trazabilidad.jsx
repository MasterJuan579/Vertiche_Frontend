import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ETAPA_LABELS,
  ETAPA_COLORS,
  getColorCSS,
  esColorClaro,
} from '../data/etapas.js';
import { formatHora, epcCorto } from '../utils/format.js';
import { realApi } from '../services/realApi.js';
import { onSocket } from '../services/socketClient.js';

const ETAPAS_ORDEN = ['PREREGISTRO', 'QA', 'REGISTRO', 'SORTER', 'BAHIA', 'AUDITORIA', 'ENVIO'];

/**
 * Mapeo de la etapa del EventoLectura del backend (RECEPCION, QA, SORTING, PACKING, SALIDA)
 * al label del Gantt visual (PREREGISTRO, QA, REGISTRO, SORTER, BAHIA, AUDITORIA, ENVIO).
 */
const ETAPA_BACKEND_TO_GANTT = {
  RECEPCION: 'PREREGISTRO',
  QA:        'QA',
  SORTING:   'SORTER',
  PACKING:   'BAHIA',
  SALIDA:    'ENVIO',
};

export function Trazabilidad() {
  const { epc: urlEpc } = useParams();
  const navigate = useNavigate();

  const [tipoBusqueda, setTipoBusqueda] = useState('epc');
  const [busqueda, setBusqueda] = useState(urlEpc || '');
  const [resultado, setResultado] = useState(null);
  const [resultadoLista, setResultadoLista] = useState(null);
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (urlEpc) {
      setBusqueda(urlEpc);
      setTipoBusqueda('epc');
      buscarEpc(urlEpc);
    }
  }, [urlEpc]);

  // Tiempo real: si estamos viendo un EPC y llega una lectura/cambio de ese
  // mismo EPC, recargamos el detalle.
  useEffect(() => {
    if (!resultado?.tag?.epc) return;
    const activo = resultado.tag.epc;
    const onEv = (ev) => { if (ev?.epc === activo) buscarEpc(activo); };
    const offLectura = onSocket('lectura', onEv);
    const offTag = onSocket('tag', onEv);
    const offAnomalia = onSocket('anomalia', onEv);
    return () => { offLectura(); offTag(); offAnomalia(); };
  }, [resultado?.tag?.epc]);

  async function buscarEpc(epc) {
    setError(null);
    setResultado(null);
    setResultadoLista(null);
    setCargando(true);

    try {
      const tag = await realApi.getTagByEpc(epc);
      if (!tag) {
        setError(`No se encontró ningún prepack con EPC "${epc}".`);
        setCargando(false);
        return;
      }

      const timeline = buildTimelineFromTag(tag);
      const ocOwner = tag.orden_id ? { ordenId: tag.orden_id } : null;
      setResultado({ tag, timeline, ocOwner });
    } catch (err) {
      setError(`Error al buscar: ${err.message}`);
    } finally {
      setCargando(false);
    }
  }

  async function buscarSku(sku) {
    setError(null);
    setResultado(null);
    setResultadoLista(null);
    setCargando(true);

    try {
      const tags = await realApi.buscarTagsPorSku(sku);
      const lista = (tags || []).map((t) => ({ ...t, ordenId: t.orden_id }));
      setResultadoLista(lista);
      if (lista.length === 0) {
        setError(`Sin coincidencias para SKU "${sku}".`);
      }
    } catch (err) {
      setError(`Error al buscar: ${err.message}`);
    } finally {
      setCargando(false);
    }
  }

  /**
   * Construye el timeline real de un tag a partir de sus lecturas y anomalías.
   * Reglas:
   *   - PRE-REGISTRO siempre aparece (timestamp = tag.registrado_en).
   *   - Cada lectura se ubica en su etapa visual (mapa ETAPA_BACKEND_TO_GANTT).
   *   - Si una lectura tiene anomalía pendiente con el mismo lector_id y
   *     timestamp dentro de ±3 segundos, se marca como anómala (rojo + tipo).
   */
  function buildTimelineFromTag(tag) {
    const lecturas = tag.ultimas_lecturas || [];
    const anomalias = tag.anomalias_pendientes || [];

    // Helper: encuentra anomalía asociada a una lectura
    const anomaliaParaLectura = (l) => {
      const ts = new Date(l.timestamp).getTime();
      return anomalias.find((a) => {
        if (a.lector_id !== l.lector_id) return false;
        const dt = Math.abs(new Date(a.timestamp).getTime() - ts);
        return dt <= 3000;
      });
    };

    const entries = [];

    // Siempre: PRE-REGISTRO desde tag.registrado_en
    entries.push({
      tipo: 'REGISTRO',
      etapa: 'PREREGISTRO',
      detalle: 'Tag dado de alta',
      tiempo: tag.registrado_en || tag.createdAt,
      lector: 'SISTEMA',
      bahia: tag.tienda?.bahia_asignada || null,
      sistema: true,
    });

    // Por cada lectura física, busca su anomalía y construye entry
    for (const l of lecturas) {
      const anom = anomaliaParaLectura(l);
      entries.push({
        tipo: 'LECTURA',
        etapa: ETAPA_BACKEND_TO_GANTT[l.etapa] || l.etapa,
        detalle: ETAPA_BACKEND_TO_GANTT[l.etapa] || l.etapa,
        tiempo: l.timestamp,
        lector: l.lector_id,
        bahia: l.bahia,
        rssi: l.rssi,
        es_duplicado: l.es_duplicado,
        anomaliaTipo: anom?.tipo_error || null,
        anomaliaDesc: anom?.descripcion || null,
      });
    }

    return entries.sort((a, b) => new Date(a.tiempo) - new Date(b.tiempo));
  }

  function buscar(epcOverride, skuOverride) {
    const query = epcOverride || skuOverride || busqueda.trim();
    const tipo = epcOverride ? 'epc' : skuOverride ? 'sku' : tipoBusqueda;
    if (!query) return;

    if (tipo === 'epc') {
      buscarEpc(query);
      navigate(`/rfid/trazabilidad/${query}`, { replace: true });
    } else {
      buscarSku(query);
    }
  }

  const verDetalle = (epc) => {
    setBusqueda(epc);
    setTipoBusqueda('epc');
    buscarEpc(epc);
    navigate(`/rfid/trazabilidad/${epc}`, { replace: true });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 items-start">

      <div className="space-y-4">
        <Panel title="Buscar Prepack">
          <div className="p-4 space-y-2.5">
            <div className="flex rounded-card overflow-hidden border border-ink-100 dark:border-ink-500">
              {['epc', 'sku'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTipoBusqueda(t)}
                  className={`flex-1 py-1.5 text-[12px] font-medium uppercase tracking-[0.04em] transition-colors ${
                    tipoBusqueda === t
                      ? 'bg-rfid text-white'
                      : 'bg-white text-ink-500 hover:bg-ink-50 dark:bg-ink-700 dark:text-ink-300 dark:hover:bg-ink-600'
                  }`}
                >
                  {t.toUpperCase()}
                </button>
              ))}
            </div>

            <input
              type="text"
              placeholder={tipoBusqueda === 'epc' ? 'E001A o EPC-SIM-000…' : 'BLU-S, AZU-M…'}
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && buscar()}
              className="w-full px-3 py-2 rounded-card text-[13px] outline-none bg-white border border-ink-100 text-ink-700 placeholder:text-ink-400 focus:border-rfid dark:bg-ink-700 dark:border-ink-500 dark:text-ink-100"
            />

            <button
              type="button"
              onClick={() => buscar()}
              disabled={!busqueda.trim() || cargando}
              className={`w-full py-2 rounded-card text-[13px] font-semibold transition-colors ${
                busqueda.trim() && !cargando
                  ? 'bg-rfid text-white hover:bg-blue-700'
                  : 'bg-ink-100 text-ink-400 cursor-not-allowed'
              }`}
            >
              {cargando ? 'Buscando...' : 'Buscar'}
            </button>
          </div>
        </Panel>
      </div>

      <div className="space-y-4">
        {!resultado && !resultadoLista && !error && !cargando && (
          <Panel>
            <div className="px-6 py-12 text-center">
              <div className="text-2xl mb-2">🔍</div>
              <div className="text-[13px] text-ink-400">
                Ingresa un EPC o SKU para buscar un prepack
              </div>
            </div>
          </Panel>
        )}

        {cargando && (
          <Panel>
            <div className="px-6 py-12 text-center text-ink-400">Cargando...</div>
          </Panel>
        )}

        {error && (
          <Panel error>
            <div className="px-4 py-3 text-[13px] text-anomaly dark:text-anomaly-ring">{error}</div>
          </Panel>
        )}

        {resultadoLista && resultadoLista.length > 0 && (
          <Panel title={`Coincidencias (${resultadoLista.length})`}>
            {resultadoLista.map((tag) => (
              <SkuMatchRow key={tag.epc} tag={tag} onVer={verDetalle} />
            ))}
          </Panel>
        )}

        {resultado?.tag && (
          <>
            <PrepackInfoCard tag={resultado.tag} ocOwner={resultado.ocOwner} />
            <TimelineCard tag={resultado.tag} timeline={resultado.timeline} />
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Subcomponentes
// ============================================================

function Panel({ title, error = false, children }) {
  return (
    <div className={`rounded-card border shadow-card overflow-hidden ${
      error
        ? 'bg-anomaly-bg border-anomaly-ring/40 dark:bg-anomaly/15 dark:border-anomaly-ring/40'
        : 'bg-white border-ink-100 dark:bg-ink-700 dark:border-ink-600'
    }`}>
      {title && (
        <div className="px-4 py-2.5 border-b border-ink-100 dark:border-ink-600 font-mono text-[11px] font-bold uppercase tracking-industrial text-ink-400">
          {title}
        </div>
      )}
      {children}
    </div>
  );
}

function SkuMatchRow({ tag, onVer }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-ink-100 dark:border-ink-600">
      <div>
        <div className="font-mono text-[13px] text-ink-700 dark:text-ink-100 mb-1">{tag.epc}</div>
        <div className="text-[12px] text-ink-500 dark:text-ink-300">SKU: {tag.sku} · {tag.cantidad_piezas} pzas</div>
      </div>
      <button onClick={() => onVer(tag.epc)} className="shrink-0 px-3 py-1.5 rounded-card text-[12px] font-semibold bg-rfid text-white hover:bg-blue-700">
        Ver historial
      </button>
    </div>
  );
}

function PrepackInfoCard({ tag, ocOwner }) {
  const colorCSS = getColorCSS(tag.color || '');
  const esClaro = esColorClaro(tag.color || '');
  const etapaColor = ETAPA_COLORS[tag.etapa_actual] || '#94A3B8';

  return (
    <Panel title="Información del prepack">
      <div className="p-4 grid grid-cols-1 sm:grid-cols-[64px_1fr] gap-4">
        <div className="w-16 h-16 rounded-lg flex items-center justify-center shadow-card" style={{ background: colorCSS, border: esClaro ? '2px solid #E2E8F0' : 'none' }}>
          <span className="text-[10px] font-bold" style={{ color: esClaro ? '#1E293B' : 'white' }}>{tag.cantidad_piezas || 1}p</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <InfoField label="EPC" value={tag.epc} mono span={3} />
          <InfoField label="SKU" value={tag.sku} />
          <InfoField label="Talla" value={tag.talla} />
          <InfoField label="Color" value={tag.color} />
          <InfoField label="Piezas" value={tag.cantidad_piezas} />
          <InfoField label="Tienda" value={tag.tienda?.nombre || tag.tienda_id} />
          <InfoField label="Etapa actual" value={ETAPA_LABELS[tag.etapa_actual] || tag.etapa_actual} valueStyle={{ color: etapaColor }} />
          {ocOwner && <InfoField label="Orden" value={ocOwner.ordenId} mono span={2} />}
        </div>
      </div>
    </Panel>
  );
}

function InfoField({ label, value, mono = false, span = 1, valueStyle }) {
  return (
    <div style={{ gridColumn: span > 1 ? `span ${span}` : undefined }}>
      <div className="font-mono text-[9px] font-bold uppercase tracking-industrial text-ink-400 mb-0.5">{label}</div>
      <div className={`text-[13px] text-ink-700 dark:text-ink-100 break-all ${mono ? 'font-mono' : ''}`} style={valueStyle}>{value || '—'}</div>
    </div>
  );
}

function TimelineCard({ tag, timeline }) {
  const etapas = ETAPAS_ORDEN.map((etapa) => {
    // Todas las entries de esta etapa (puede haber varias lecturas QA, varias BAHIA, etc.)
    const enEtapa = (timeline || []).filter((e) => e.etapa === etapa);
    // Prioridad de display: anomalía > duplicado > ok. Si hay alguna anómala, esa gana.
    const ev =
      enEtapa.find((e) => e.anomaliaTipo) ||
      enEtapa.find((e) => e.es_duplicado) ||
      enEtapa[0];
    return {
      nombre: etapa,
      completada: !!ev,
      timestamp: ev?.tiempo,
      lector: ev?.lector,
      bahia: ev?.bahia,
      anomaliaTipo: ev?.anomaliaTipo || null,
      anomaliaDesc: ev?.anomaliaDesc || null,
      es_duplicado: ev?.es_duplicado || false,
      sistema: ev?.sistema || false,
      total: enEtapa.length,
    };
  });

  return (
    <Panel title="Recorrido del prepack">
      <div className="p-6 overflow-x-auto">
        <div className="flex items-start min-w-max gap-4">
          {etapas.map((etapa) => {
            const conAnom = !!etapa.anomaliaTipo;
            const conDup = etapa.es_duplicado && !conAnom;
            // Color del círculo:
            //   anomalía → rojo  | duplicado → ámbar  | ok → verde  | vacío → gris
            const cls = conAnom
              ? 'bg-anomaly text-white'
              : conDup
                ? 'bg-attention text-white'
                : etapa.completada
                  ? 'bg-flow text-white'
                  : 'bg-ink-100 text-ink-400 dark:bg-ink-600 dark:text-ink-300';
            const icono = conAnom ? '!' : conDup ? '≡' : etapa.completada ? '✓' : '○';
            return (
              <div key={etapa.nombre} className="flex flex-col items-center gap-2 min-w-[90px]" title={etapa.anomaliaDesc || ''}>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold ${cls}`}>
                  {icono}
                </div>
                <div className="text-center">
                  <div className="text-[10px] font-semibold uppercase dark:text-ink-100">{ETAPA_LABELS[etapa.nombre]}</div>
                  {etapa.timestamp && <div className="font-mono text-[9px] text-ink-400">{formatHora(etapa.timestamp)}</div>}
                  {etapa.lector && <div className="font-mono text-[8px] text-ink-400 mt-0.5">{etapa.lector}</div>}
                  {conAnom && (
                    <div className="font-mono text-[8px] font-bold uppercase text-anomaly dark:text-anomaly-ring mt-1">
                      ⚠ {etapa.anomaliaTipo}
                    </div>
                  )}
                  {conDup && (
                    <div className="font-mono text-[8px] font-bold uppercase text-attention dark:text-attention-ring mt-1">
                      DUPLICADA
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {(!timeline || timeline.length === 0) && (
          <div className="mt-4 text-center text-[12px] text-ink-400">
            Sin lecturas registradas para este prepack.
          </div>
        )}
      </div>
    </Panel>
  );
}
