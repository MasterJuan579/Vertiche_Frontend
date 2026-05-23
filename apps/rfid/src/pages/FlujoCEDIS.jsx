import { useMemo, useState } from 'react';
import { Card, CardBody, KPI, StatusDot, StatusPill } from '@vertiche/design-system';
import { palets, ETAPAS, ETAPA_COLORS, tiendas, kpis } from '@vertiche/mock-data';

const MODE_LINE = 'linea';
const MODE_MAP = 'mapa';

export function FlujoCEDIS() {
  const [mode, setMode] = useState(MODE_LINE);

  const paletsByEtapa = useMemo(() => {
    const grouped = {};
    ETAPAS.forEach((e) => (grouped[e] = []));
    palets.forEach((p) => grouped[p.etapa_actual]?.push(p));
    return grouped;
  }, []);

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      <PageHeader mode={mode} onModeChange={setMode} />

      {/* Top KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardBody>
            <KPI
              label="Palets en proceso"
              value={palets.filter((p) => p.estado !== 'ENVIADO').length}
              unit="activos"
              size="lg"
              accent="#1E40AF"
            />
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <KPI
              label="Procesados hoy"
              value={kpis.hoy.palets_procesados}
              unit={`/ ${kpis.hoy.palets_meta} meta`}
              size="lg"
              status="flow"
            />
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <KPI
              label="Tiempo de ciclo"
              value={`${kpis.hoy.tiempo_ciclo_promedio_min}`}
              unit="min"
              size="lg"
              trend={-kpis.hoy.mejora_pct}
              trendLabel="vs proceso manual"
              status="flow"
            />
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <KPI
              label="Tasa de anomalía"
              value={`${kpis.hoy.tasa_anomalia_pct}`}
              unit="%"
              size="lg"
              status={kpis.hoy.tasa_anomalia_pct > 3 ? 'attention' : 'flow'}
            />
          </CardBody>
        </Card>
      </div>

      {mode === MODE_LINE ? (
        <LineMode paletsByEtapa={paletsByEtapa} />
      ) : (
        <MapMode paletsByEtapa={paletsByEtapa} />
      )}
    </div>
  );
}

function PageHeader({ mode, onModeChange }) {
  return (
    <div className="flex items-end justify-between mb-8 gap-4">
      <div>
        <div className="label-industrial text-ink-400 mb-2">Vista general</div>
        <h1 className="font-display font-bold text-3xl text-ink-700 tracking-tight">
          Flujo CEDIS
        </h1>
        <p className="text-sm text-ink-400 mt-1">
          Estado en tiempo real de los siete estadios del proceso RFID.
        </p>
      </div>

      <div className="inline-flex rounded-card bg-white border border-ink-200 p-1">
        {[
          { id: MODE_LINE, label: 'Línea' },
          { id: MODE_MAP, label: 'Mapa' },
        ].map((m) => (
          <button
            key={m.id}
            onClick={() => onModeChange(m.id)}
            className={`px-4 py-1.5 text-xs font-display font-semibold uppercase tracking-industrial rounded transition-colors ${
              mode === m.id
                ? 'bg-ink-700 text-white'
                : 'text-ink-400 hover:text-ink-700'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function LineMode({ paletsByEtapa }) {
  return (
    <Card>
      <CardBody className="!p-6">
        <div className="grid grid-cols-7 gap-3">
          {ETAPAS.map((etapa) => {
            const list = paletsByEtapa[etapa] || [];
            return (
              <div
                key={etapa}
                className="rounded-card border border-ink-100 bg-ink-50/50 overflow-hidden"
              >
                <div
                  className="px-3 py-2 flex items-center justify-between"
                  style={{ background: `${ETAPA_COLORS[etapa]}14` }}
                >
                  <div className="flex items-center gap-2">
                    <StatusDot
                      status={list.length > 4 ? 'attention' : 'flow'}
                      size="sm"
                    />
                    <span
                      className="label-industrial"
                      style={{ color: ETAPA_COLORS[etapa] }}
                    >
                      {etapa}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-base text-ink-700 tabular">
                    {list.length}
                  </span>
                </div>
                <div className="p-2 space-y-1.5 min-h-[200px]">
                  {list.slice(0, 6).map((p) => (
                    <div
                      key={p.palet_id}
                      className="bg-white border border-ink-100 rounded p-2 text-[11px]"
                    >
                      <div className="font-mono text-ink-700 font-semibold">
                        {p.palet_id}
                      </div>
                      <div className="text-ink-400 mt-0.5">
                        {p.total_prepacks} prepacks
                      </div>
                    </div>
                  ))}
                  {list.length > 6 && (
                    <div className="text-[10px] text-ink-400 px-1">
                      + {list.length - 6} más
                    </div>
                  )}
                  {list.length === 0 && (
                    <div className="text-[10px] text-ink-300 italic px-1">
                      Vacío
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
}

function MapMode({ paletsByEtapa }) {
  return (
    <Card>
      <CardBody className="!p-8 bg-ink-50/40">
        <div className="text-center mb-6">
          <div className="label-industrial text-ink-400 mb-1">CEDIS — Planta operativa</div>
          <div className="font-display font-semibold text-ink-500 text-sm">
            Recorrido físico de izquierda a derecha
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 items-stretch">
          {ETAPAS.map((etapa, i) => {
            const count = paletsByEtapa[etapa]?.length || 0;
            const isLast = i === ETAPAS.length - 1;
            return (
              <div key={etapa} className="relative flex flex-col">
                <Zone etapa={etapa} count={count} color={ETAPA_COLORS[etapa]} />
                {!isLast && (
                  <div className="absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                    <span className="text-ink-300 font-mono text-lg">→</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bahias row */}
        <div className="mt-6">
          <div className="label-industrial text-ink-400 mb-3">
            Bahías de empaque · {tiendas.length} tiendas asignadas
          </div>
          <div className="grid grid-cols-4 lg:grid-cols-8 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((bn) => {
              const t = tiendas.find((x) => x.bahia_asignada === `B${bn}`);
              return (
                <div
                  key={bn}
                  className="bg-white border border-ink-100 rounded-card p-3 text-center"
                >
                  <div className="font-display font-bold text-ink-700 text-lg">
                    B{bn}
                  </div>
                  <div className="text-[10px] text-ink-400 truncate mt-1">
                    {t?.nombre || '—'}
                  </div>
                  <div className="mt-2">
                    <StatusPill
                      status={t?.estado_rep === 'ALERTA' ? 'attention' : 'flow'}
                    >
                      {t?.estado_rep || 'NORMAL'}
                    </StatusPill>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

function Zone({ etapa, count, color }) {
  return (
    <div
      className="relative rounded-card border-2 p-4 flex flex-col items-center justify-center min-h-[160px] bg-white"
      style={{ borderColor: `${color}33` }}
    >
      <StatusDot status={count > 4 ? 'attention' : 'flow'} size="lg" pulse />
      <div className="font-mono tabular font-bold text-3xl text-ink-700 mt-2">
        {count}
      </div>
      <div className="text-[10px] text-ink-400 mt-1">en tránsito</div>
      <div
        className="absolute bottom-0 left-0 right-0 px-2 py-1.5 text-center"
        style={{ background: `${color}` }}
      >
        <span className="label-industrial text-white">{etapa}</span>
      </div>
    </div>
  );
}
