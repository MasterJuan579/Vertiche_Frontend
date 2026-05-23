import { Card, CardBody, CardHeader, KPI } from '@vertiche/design-system';
import { kpis } from '@vertiche/mock-data';

export function Throughput() {
  const maxThroughput = Math.max(...kpis.throughputHoy.map((h) => h.prepacks));
  const totalToday = kpis.throughputHoy.reduce((s, h) => s + h.prepacks, 0);
  const peak = kpis.throughputHoy.reduce((p, h) =>
    h.prepacks > p.prepacks ? h : p
  );
  const avgPerHour = Math.round(totalToday / kpis.throughputHoy.length);

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      <div className="mb-8">
        <div className="label-industrial text-ink-400 mb-2">Productividad</div>
        <h1 className="font-display font-bold text-3xl text-ink-700 tracking-tight">
          Throughput de hoy
        </h1>
        <p className="text-sm text-ink-400 mt-1">
          Prepacks procesados hora por hora.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardBody>
            <KPI label="Total hoy" value={totalToday} unit="prepacks" size="lg" />
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <KPI
              label="Hora pico"
              value={peak.hora}
              unit={`${peak.prepacks} prepacks`}
              size="lg"
              status="flow"
            />
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <KPI label="Promedio/hora" value={avgPerHour} size="lg" />
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <KPI
              label="Mejora vs manual"
              value={`${kpis.hoy.mejora_pct}`}
              unit="%"
              size="lg"
              status="flow"
            />
          </CardBody>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader label="Por hora">Prepacks procesados</CardHeader>
        <CardBody>
          <div className="flex items-end justify-between gap-2 h-64">
            {kpis.throughputHoy.map((h) => {
              const height = (h.prepacks / maxThroughput) * 100;
              const isPeak = h.hora === peak.hora;
              return (
                <div key={h.hora} className="flex-1 flex flex-col items-center">
                  <div className="font-mono text-xs tabular text-ink-700 font-semibold mb-2">
                    {h.prepacks}
                  </div>
                  <div className="relative w-full bg-ink-50 rounded-t overflow-hidden flex-1 flex items-end">
                    <div
                      className={`w-full rounded-t transition-all relative ${
                        isPeak ? 'bg-dashboard' : 'bg-dashboard/60'
                      }`}
                      style={{ height: `${height}%` }}
                    >
                      {isPeak && (
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                          <span className="px-1.5 py-0.5 bg-ink-700 text-white text-[9px] font-display font-bold uppercase tracking-industrial rounded">
                            PICO
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="font-mono text-xs text-ink-400 mt-2 tabular">
                    {h.hora}
                  </div>
                </div>
              );
            })}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
