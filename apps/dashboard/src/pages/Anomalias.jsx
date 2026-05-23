import { Card, CardBody, CardHeader, KPI, StatusPill, Table, TableHeader, TableRow, TableCell } from '@vertiche/design-system';
import { anomalias, getProveedorById, ETAPA_COLORS } from '@vertiche/mock-data';

export function Anomalias() {
  const unresolved = anomalias.filter((a) => !a.resuelto);
  const resolved = anomalias.filter((a) => a.resuelto);

  // Group by type
  const byType = anomalias.reduce((acc, a) => {
    acc[a.tipo_error] = (acc[a.tipo_error] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      <div className="mb-8">
        <div className="label-industrial text-ink-400 mb-2">Calidad operativa</div>
        <h1 className="font-display font-bold text-3xl text-ink-700 tracking-tight">
          Anomalías
        </h1>
        <p className="text-sm text-ink-400 mt-1">
          Eventos fuera de patrón detectados por el sistema RFID.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardBody>
            <KPI
              label="Sin resolver"
              value={unresolved.length}
              size="lg"
              status={unresolved.length > 2 ? 'attention' : 'flow'}
            />
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <KPI label="Resueltas hoy" value={resolved.length} size="lg" />
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <KPI label="Total semana" value={anomalias.length} size="lg" />
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <KPI
              label="Tasa global"
              value="1.4"
              unit="%"
              size="lg"
              status="flow"
            />
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        {Object.entries(byType).map(([type, count]) => (
          <Card key={type}>
            <CardBody>
              <div className="label-industrial text-ink-400 mb-2">{type}</div>
              <div className="flex items-baseline gap-2">
                <span className="font-display font-bold text-3xl text-ink-700 tabular">
                  {count}
                </span>
                <span className="text-xs text-ink-400">incidencias</span>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader label="Detalle">Eventos registrados</CardHeader>
        <Table className="!rounded-t-none !border-t-0">
          <TableHeader>
            <TableCell header>EPC</TableCell>
            <TableCell header>Tipo</TableCell>
            <TableCell header>Etapa</TableCell>
            <TableCell header>Proveedor</TableCell>
            <TableCell header>Descripción</TableCell>
            <TableCell header>Estado</TableCell>
          </TableHeader>
          <tbody>
            {anomalias.map((a) => {
              const proveedor = getProveedorById(a.proveedor_id);
              return (
                <TableRow key={a.id}>
                  <TableCell>
                    <span className="font-mono font-semibold">{a.epc}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs font-display font-semibold text-ink-700">
                      {a.tipo_error}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className="label-industrial"
                      style={{ color: ETAPA_COLORS[a.etapa] }}
                    >
                      {a.etapa}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs">{proveedor?.nombre}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-ink-500">
                      {a.descripcion}
                    </span>
                  </TableCell>
                  <TableCell>
                    {a.resuelto ? (
                      <StatusPill status="flow">RESUELTA</StatusPill>
                    ) : (
                      <StatusPill status="attention">PENDIENTE</StatusPill>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}
