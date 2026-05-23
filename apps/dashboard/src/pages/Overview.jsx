import { Card, CardBody, CardHeader, KPI, StatusDot, StatusPill } from '@vertiche/design-system';
import { kpis, ETAPAS, ETAPA_COLORS, palets, getAnomaliasUnresolved } from '@vertiche/mock-data';

export function Overview() {
  const unresolvedAnomalias = getAnomaliasUnresolved();
  const maxWeekDay = Math.max(...kpis.semana.map((d) => d.procesados));

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      <div className="flex items-end justify-between mb-8">
        <div>
          <div className="label-industrial text-ink-400 mb-2">
            Vista ejecutiva · {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
          <h1 className="font-display font-bold text-3xl text-ink-700 tracking-tight">
            Overview
          </h1>
          <p className="text-sm text-ink-400 mt-1">
            Estado operativo del CEDIS en tiempo real.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusDot status="flow" size="md" pulse />
          <span className="label-industrial text-flow">Sistema operativo</span>
        </div>
      </div>

      {/* Hero KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card accent="#0F766E">
          <CardBody>
            <KPI
              label="Tiempo de ciclo"
              value={kpis.hoy.tiempo_ciclo_promedio_min}
              unit="min"
              trend={-kpis.hoy.mejora_pct}
              trendLabel="vs manual"
              status="flow"
              size="xl"
            />
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <KPI
              label="Palets procesados"
              value={kpis.hoy.palets_procesados}
              unit={`/ ${kpis.hoy.palets_meta}`}
              size="xl"
            />
            <div className="mt-3">
              <ProgressBar
                value={kpis.hoy.palets_procesados}
                max={kpis.hoy.palets_meta}
                color="#0F766E"
              />
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <KPI
              label="QA aprobación"
              value={`${kpis.hoy.qa_aprobacion_pct}`}
              unit="%"
              status="flow"
              size="xl"
            />
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <KPI
              label="Tasa anomalía"
              value={`${kpis.hoy.tasa_anomalia_pct}`}
              unit="%"
              status={kpis.hoy.tasa_anomalia_pct > 3 ? 'attention' : 'flow'}
              size="xl"
            />
          </CardBody>
        </Card>
      </div>

      {/* Two-column lower section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        {/* Week chart */}
        <Card>
          <CardHeader label="Esta semana">Palets procesados</CardHeader>
          <CardBody>
            <div className="flex items-end justify-between gap-3 h-40">
              {kpis.semana.map((d) => {
                const height = (d.procesados / maxWeekDay) * 100;
                return (
                  <div key={d.dia} className="flex-1 flex flex-col items-center">
                    <div className="font-mono text-xs tabular text-ink-500 mb-1.5">
                      {d.procesados}
                    </div>
                    <div className="relative w-full bg-ink-50 rounded-t overflow-hidden flex-1 flex items-end">
                      <div
                        className="w-full bg-dashboard rounded-t transition-all"
                        style={{ height: `${height}%` }}
                      />
                      {d.anomalias > 0 && (
                        <div className="absolute top-2 left-1/2 -translate-x-1/2">
                          <span className="status-dot bg-anomaly-ring" />
                        </div>
                      )}
                    </div>
                    <div className="label-industrial text-ink-400 mt-2">
                      {d.dia}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 text-xs text-ink-400 flex items-center gap-2">
              <span className="status-dot bg-anomaly-ring" />
              <span>Días con anomalías registradas</span>
            </div>
          </CardBody>
        </Card>

        {/* Stages distribution */}
        <Card>
          <CardHeader label="Distribución por estadio">Estado actual</CardHeader>
          <CardBody>
            <div className="space-y-2.5">
              {ETAPAS.map((etapa) => {
                const count = palets.filter((p) => p.etapa_actual === etapa).length;
                const max = palets.length;
                return (
                  <div key={etapa} className="flex items-center gap-3">
                    <div
                      className="label-industrial w-24 flex-shrink-0"
                      style={{ color: ETAPA_COLORS[etapa] }}
                    >
                      {etapa}
                    </div>
                    <div className="flex-1 h-6 bg-ink-50 rounded-sm overflow-hidden relative">
                      <div
                        className="h-full transition-all"
                        style={{
                          width: `${(count / max) * 100}%`,
                          background: ETAPA_COLORS[etapa],
                        }}
                      />
                    </div>
                    <span className="font-mono tabular font-bold text-ink-700 w-8 text-right">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Critical alerts */}
      {unresolvedAnomalias.length > 0 && (
        <Card>
          <CardHeader
            label="Atención requerida"
            action={
              <StatusPill status="attention">
                {unresolvedAnomalias.length} pendientes
              </StatusPill>
            }
          >
            Anomalías sin resolver
          </CardHeader>
          <CardBody>
            <div className="space-y-2">
              {unresolvedAnomalias.slice(0, 4).map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between p-3 bg-attention-bg/30 rounded-card border border-attention/20"
                >
                  <div className="flex items-center gap-3">
                    <StatusDot status="anomaly" size="md" />
                    <div>
                      <div className="font-display font-semibold text-ink-700 text-sm">
                        {a.tipo_error} — {a.epc}
                      </div>
                      <div className="text-xs text-ink-400 mt-0.5">
                        {a.descripcion}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs font-mono text-ink-400">
                    {a.timestamp}
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

function ProgressBar({ value, max, color }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-ink-100 rounded-pill overflow-hidden">
        <div
          className="h-full rounded-pill"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="font-mono text-[10px] text-ink-400 tabular">
        {Math.round(pct)}%
      </span>
    </div>
  );
}
