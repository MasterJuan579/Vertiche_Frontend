import { useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  CardHeader,
  CardBody,
  KPI,
  StatusPill,
  Button,
  Table,
  TableHeader,
  TableRow,
  TableCell,
  EmptyState,
} from '@vertiche/design-system';
import {
  getPaletById,
  getTagsByPalet,
  getOrdenById,
  getProveedorById,
  getTiendaById,
  paletEtapaLog,
  ETAPAS,
  ETAPA_COLORS,
} from '@vertiche/mock-data';

export function DetallePalet() {
  const { paletId } = useParams();
  const navigate = useNavigate();
  const palet = getPaletById(paletId);

  if (!palet) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <EmptyState
          title="Palet no encontrado"
          description={`No existe un palet con ID ${paletId}.`}
          action={
            <Button variant="primary" onClick={() => navigate('/pedidos')}>
              Volver al listado
            </Button>
          }
        />
      </div>
    );
  }

  const orden = getOrdenById(palet.orden_id);
  const proveedor = getProveedorById(orden?.proveedor_id);
  const tags = getTagsByPalet(palet.palet_id);
  const log = paletEtapaLog.filter((l) => l.palet_id === palet.palet_id);

  // Build the Excel-style summary (rows = colors, columns = sizes)
  const { sizes, colors, matrix, totalsByColor, totalsBySize, grandTotal } =
    useMemo(() => buildMatrix(tags), [tags]);

  // Group by destination store
  const byTienda = useMemo(() => {
    const map = {};
    tags.forEach((t) => {
      if (!map[t.tienda_id]) map[t.tienda_id] = [];
      map[t.tienda_id].push(t);
    });
    return map;
  }, [tags]);

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      <Link
        to="/pedidos"
        className="inline-flex items-center gap-1.5 text-xs font-display font-semibold text-ink-400 hover:text-ink-700 uppercase tracking-industrial mb-4"
      >
        ← Volver a Pedidos
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-6 mb-8">
        <div>
          <div className="label-industrial text-ink-400 mb-2">Cargamento</div>
          <h1 className="font-display font-bold text-3xl text-ink-700 tracking-tight">
            {orden?.nombre_producto || palet.palet_id}
          </h1>
          <div className="flex items-center gap-4 mt-2 text-sm text-ink-500">
            <span className="font-mono">{palet.palet_id}</span>
            <span className="text-ink-300">·</span>
            <span className="font-mono">{palet.orden_id}</span>
            <span className="text-ink-300">·</span>
            <span>{proveedor?.nombre}</span>
          </div>
        </div>
        <StatusPill
          status={
            palet.etapa_actual === 'ENVIO'
              ? 'flow'
              : palet.etapa_actual === 'QA'
              ? 'attention'
              : 'neutral'
          }
          className="!text-sm !px-3 !py-1.5"
        >
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: ETAPA_COLORS[palet.etapa_actual] }}
          />
          {palet.etapa_actual}
        </StatusPill>
      </div>

      {/* Section 1: Excel-style summary */}
      <section className="mb-8">
        <SectionHeader
          label="Sección 1 / 5"
          title="Resumen por color y talla"
          subtitle="Tabla maestra del cargamento — filas: color · columnas: talla"
        />
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-ink-50 border-b border-ink-100">
                  <th className="px-4 py-3 text-left label-industrial text-ink-400">
                    Color
                  </th>
                  {sizes.map((s) => (
                    <th
                      key={s}
                      className="px-4 py-3 text-center label-industrial text-ink-400"
                    >
                      {s}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-right label-industrial text-ink-700 bg-ink-50">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {colors.map((c) => (
                  <tr key={c} className="border-b border-ink-100 last:border-b-0">
                    <td className="px-4 py-3 font-display font-medium text-ink-700">
                      {c}
                    </td>
                    {sizes.map((s) => (
                      <td
                        key={s}
                        className="px-4 py-3 text-center font-mono tabular text-ink-700"
                      >
                        {matrix[c]?.[s] ? (
                          matrix[c][s]
                        ) : (
                          <span className="text-ink-200">—</span>
                        )}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-right font-mono tabular font-semibold text-ink-700 bg-ink-50/40">
                      {totalsByColor[c]}
                    </td>
                  </tr>
                ))}
                <tr className="bg-ink-50 border-t-2 border-ink-200">
                  <td className="px-4 py-3 font-display font-bold text-ink-700 uppercase tracking-industrial text-xs">
                    Total
                  </td>
                  {sizes.map((s) => (
                    <td
                      key={s}
                      className="px-4 py-3 text-center font-mono tabular font-bold text-ink-700"
                    >
                      {totalsBySize[s]}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right font-mono tabular font-bold text-lg text-ink-900">
                    {grandTotal}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      {/* Section 2: KPIs */}
      <section className="mb-8">
        <SectionHeader label="Sección 2 / 5" title="Métricas del cargamento" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardBody>
              <KPI
                label="Total prepacks"
                value={palet.total_prepacks}
                size="lg"
              />
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <KPI
                label="Piezas totales"
                value={grandTotal}
                unit="unidades"
                size="lg"
              />
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <KPI
                label="Tiempo de ciclo"
                value={palet.tiempo_ciclo_min}
                unit="min"
                size="lg"
                status="flow"
              />
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <KPI
                label="Tiendas destino"
                value={Object.keys(byTienda).length}
                size="lg"
              />
            </CardBody>
          </Card>
        </div>
      </section>

      {/* Section 3: Distribution by store */}
      <section className="mb-8">
        <SectionHeader
          label="Sección 3 / 5"
          title="Distribución por tienda"
          subtitle="Tags asignados a cada destino"
        />
        <Card>
          <Table>
            <TableHeader>
              <TableCell header>Tienda</TableCell>
              <TableCell header>Ciudad</TableCell>
              <TableCell header>Bahía</TableCell>
              <TableCell header align="right">
                Tags asignados
              </TableCell>
              <TableCell header align="right">
                Piezas
              </TableCell>
            </TableHeader>
            <tbody>
              {Object.entries(byTienda).map(([tiendaId, list]) => {
                const tienda = getTiendaById(tiendaId);
                const pieces = list.reduce((s, t) => s + t.cantidad_piezas, 0);
                return (
                  <TableRow key={tiendaId}>
                    <TableCell>
                      <div className="font-display font-medium text-ink-700">
                        {tienda?.nombre || tiendaId}
                      </div>
                      <div className="text-[11px] text-ink-400 font-mono">
                        {tiendaId}
                      </div>
                    </TableCell>
                    <TableCell>{tienda?.ciudad || '—'}</TableCell>
                    <TableCell>
                      <span className="font-display font-semibold text-ink-700">
                        {tienda?.bahia_asignada || '—'}
                      </span>
                    </TableCell>
                    <TableCell align="right">
                      <span className="font-mono tabular text-ink-700">
                        {list.length}
                      </span>
                    </TableCell>
                    <TableCell align="right">
                      <span className="font-mono tabular font-semibold text-ink-700">
                        {pieces}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </tbody>
          </Table>
        </Card>
      </section>

      {/* Section 4: Stage timeline */}
      <section className="mb-8">
        <SectionHeader
          label="Sección 4 / 5"
          title="Histórico de etapas"
          subtitle="Recorrido del palet a través de los siete estadios"
        />
        <Card>
          <CardBody>
            <Timeline log={log} currentEtapa={palet.etapa_actual} />
          </CardBody>
        </Card>
      </section>

      {/* Section 5: Tag list */}
      <section>
        <SectionHeader
          label="Sección 5 / 5"
          title="Listado de tags"
          subtitle={`${tags.length} EPC vinculados a este palet`}
        />
        <Card>
          <Table>
            <TableHeader>
              <TableCell header>EPC</TableCell>
              <TableCell header>SKU</TableCell>
              <TableCell header>Talla</TableCell>
              <TableCell header>Color</TableCell>
              <TableCell header align="right">
                Piezas
              </TableCell>
              <TableCell header>Destino</TableCell>
              <TableCell header>QA</TableCell>
            </TableHeader>
            <tbody>
              {tags.map((t) => (
                <TableRow key={t.epc}>
                  <TableCell>
                    <Link
                      to={`/trazabilidad/${t.epc}`}
                      className="font-mono font-semibold text-rfid hover:underline"
                    >
                      {t.epc}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-ink-500 text-xs">{t.sku}</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-display font-semibold">{t.talla}</span>
                  </TableCell>
                  <TableCell>{t.color}</TableCell>
                  <TableCell align="right">
                    <span className="font-mono tabular">{t.cantidad_piezas}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs font-mono">{t.tienda_id}</span>
                  </TableCell>
                  <TableCell>
                    {t.qa_fallido ? (
                      <StatusPill status="anomaly">FALLIDO</StatusPill>
                    ) : (
                      <StatusPill status="flow">OK</StatusPill>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </tbody>
          </Table>
        </Card>
      </section>
    </div>
  );
}

function SectionHeader({ label, title, subtitle }) {
  return (
    <div className="mb-3">
      <div className="label-industrial text-ink-400">{label}</div>
      <div className="flex items-baseline gap-3 mt-1">
        <h2 className="font-display font-bold text-xl text-ink-700">{title}</h2>
        {subtitle && <span className="text-sm text-ink-400">· {subtitle}</span>}
      </div>
    </div>
  );
}

function Timeline({ log, currentEtapa }) {
  return (
    <div className="space-y-0">
      {ETAPAS.map((etapa, i) => {
        const entry = log.find((l) => l.etapa === etapa);
        const isCurrent = etapa === currentEtapa;
        const isPast = !!entry?.timestamp_salida;
        const isDone = entry && (isPast || isCurrent);

        return (
          <div key={etapa} className="flex gap-4 relative">
            {/* Vertical line */}
            {i < ETAPAS.length - 1 && (
              <div
                className="absolute left-[11px] top-7 bottom-0 w-0.5"
                style={{
                  background: isDone ? ETAPA_COLORS[etapa] : '#E5EAF0',
                }}
              />
            )}

            {/* Dot */}
            <div
              className="w-6 h-6 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center"
              style={{
                background: isDone ? ETAPA_COLORS[etapa] : '#E5EAF0',
              }}
            >
              {isDone && (
                <span className="text-white text-[10px] font-bold">✓</span>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 pb-6">
              <div className="flex items-center gap-3">
                <span
                  className="label-industrial"
                  style={{
                    color: isDone ? ETAPA_COLORS[etapa] : '#9AA5B5',
                  }}
                >
                  {etapa}
                </span>
                {isCurrent && (
                  <StatusPill status="flow" className="!text-[10px]">
                    EN CURSO
                  </StatusPill>
                )}
              </div>
              {entry ? (
                <div className="text-xs text-ink-400 mt-1 font-mono">
                  Entrada: {entry.timestamp_entrada}
                  {entry.timestamp_salida && (
                    <>
                      {' · '}
                      Salida: {entry.timestamp_salida}
                    </>
                  )}
                </div>
              ) : (
                <div className="text-xs text-ink-300 mt-1 italic">
                  Pendiente
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function buildMatrix(tags) {
  const matrix = {};
  const totalsByColor = {};
  const totalsBySize = {};
  let grandTotal = 0;
  const sizeSet = new Set();
  const colorSet = new Set();

  tags.forEach((t) => {
    sizeSet.add(t.talla);
    colorSet.add(t.color);
    if (!matrix[t.color]) matrix[t.color] = {};
    matrix[t.color][t.talla] =
      (matrix[t.color][t.talla] || 0) + t.cantidad_piezas;
    totalsByColor[t.color] =
      (totalsByColor[t.color] || 0) + t.cantidad_piezas;
    totalsBySize[t.talla] =
      (totalsBySize[t.talla] || 0) + t.cantidad_piezas;
    grandTotal += t.cantidad_piezas;
  });

  return {
    sizes: Array.from(sizeSet),
    colors: Array.from(colorSet),
    matrix,
    totalsByColor,
    totalsBySize,
    grandTotal,
  };
}
