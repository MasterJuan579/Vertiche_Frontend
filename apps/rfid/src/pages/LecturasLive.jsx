import { useEffect, useState } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  KPI,
  StatusDot,
  StatusPill,
  Table,
  TableHeader,
  TableRow,
  TableCell,
} from '@vertiche/design-system';
import { tags, ETAPAS, ETAPA_COLORS } from '@vertiche/mock-data';

// Generate a stream of mock read events on a timer
function buildEvent(now) {
  const tag = tags[Math.floor(Math.random() * tags.length)];
  const etapa = ETAPAS[Math.floor(Math.random() * ETAPAS.length)];
  return {
    id: `${now}-${Math.random()}`,
    timestamp: new Date(now),
    epc: tag.epc,
    sku: tag.sku,
    etapa,
    lector_id: `RFID-${etapa}-1`,
    rssi: -50 - Math.floor(Math.random() * 25),
  };
}

export function LecturasLive() {
  const [events, setEvents] = useState(() =>
    Array.from({ length: 8 }, (_, i) => buildEvent(Date.now() - i * 2000))
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setEvents((prev) => [buildEvent(Date.now()), ...prev].slice(0, 30));
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const last5min = events.filter(
    (e) => Date.now() - e.timestamp.getTime() < 5 * 60 * 1000
  );
  const last1min = events.filter(
    (e) => Date.now() - e.timestamp.getTime() < 60 * 1000
  );

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="label-industrial text-ink-400">En vivo</div>
          <StatusDot status="flow" size="sm" pulse />
        </div>
        <h1 className="font-display font-bold text-3xl text-ink-700 tracking-tight">
          Lecturas RFID
        </h1>
        <p className="text-sm text-ink-400 mt-1">
          Stream en tiempo real desde todos los lectores del CEDIS.
        </p>
      </div>

      {/* Live KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardBody>
            <KPI label="Último minuto" value={last1min.length} unit="lecturas" size="lg" />
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <KPI label="Últimos 5 min" value={last5min.length} unit="lecturas" size="lg" />
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <KPI
              label="Lectores activos"
              value={new Set(events.map((e) => e.lector_id)).size}
              unit="de 9"
              size="lg"
              status="flow"
            />
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <KPI
              label="RSSI promedio"
              value={Math.round(
                events.reduce((s, e) => s + e.rssi, 0) / events.length
              )}
              unit="dBm"
              size="lg"
            />
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader label="Stream">Lecturas recientes</CardHeader>
        <Table className="!rounded-t-none !border-t-0">
          <TableHeader>
            <TableCell header>Hora</TableCell>
            <TableCell header>EPC</TableCell>
            <TableCell header>Estadio</TableCell>
            <TableCell header>Lector</TableCell>
            <TableCell header align="right">
              RSSI
            </TableCell>
          </TableHeader>
          <tbody>
            {events.map((e, i) => (
              <TableRow key={e.id} className={i === 0 ? 'bg-flow-bg/40' : ''}>
                <TableCell>
                  <span className="font-mono text-xs text-ink-500 tabular">
                    {e.timestamp.toLocaleTimeString('es-MX')}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="font-mono font-semibold text-ink-700">
                    {e.epc}
                  </span>
                  <div className="text-[11px] text-ink-400 font-mono">
                    {e.sku}
                  </div>
                </TableCell>
                <TableCell>
                  <StatusPill status="neutral">
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: ETAPA_COLORS[e.etapa] }}
                    />
                    {e.etapa}
                  </StatusPill>
                </TableCell>
                <TableCell>
                  <span className="font-mono text-xs">{e.lector_id}</span>
                </TableCell>
                <TableCell align="right">
                  <span className="font-mono tabular text-ink-500">
                    {e.rssi} dBm
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}
