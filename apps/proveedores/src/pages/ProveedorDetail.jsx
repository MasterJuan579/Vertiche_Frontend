import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  CardBody,
  CardHeader,
  KPI,
  StatusPill,
  Button,
  Modal,
  Table,
  TableHeader,
  TableRow,
  TableCell,
  EmptyState,
} from '@vertiche/design-system';
import {
  getProveedorById,
  getAnomaliasByProveedor,
  ordenes,
  ETAPA_COLORS,
} from '@vertiche/mock-data';

const NIVEL_STATUS = {
  PREFERENTE: 'flow',
  REGULAR: 'neutral',
  OBSERVACION: 'attention',
};

export function ProveedorDetail() {
  const { proveedorId } = useParams();
  const navigate = useNavigate();
  const proveedor = getProveedorById(Number(proveedorId));
  const [qaModalOpen, setQaModalOpen] = useState(false);

  if (!proveedor) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <EmptyState
          title="Proveedor no encontrado"
          action={
            <Button variant="primary" onClick={() => navigate('/proveedores')}>
              Volver
            </Button>
          }
        />
      </div>
    );
  }

  const ordenesDelProveedor = ordenes.filter(
    (o) => o.proveedor_id === proveedor.id
  );
  const anomaliasDelProveedor = getAnomaliasByProveedor(proveedor.id);

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      <Link
        to="/proveedores"
        className="inline-flex items-center gap-1.5 text-xs font-display font-semibold text-ink-400 hover:text-ink-700 uppercase tracking-industrial mb-4"
      >
        ← Volver
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-6 mb-8">
        <div className="flex items-start gap-5">
          <div
            className="w-20 h-20 rounded-card flex items-center justify-center font-display font-bold text-white text-2xl"
            style={{ background: proveedor.color }}
          >
            {proveedor.nombre.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <StatusPill status={NIVEL_STATUS[proveedor.nivel]} className="mb-2">
              {proveedor.nivel}
            </StatusPill>
            <h1 className="font-display font-bold text-3xl text-ink-700 tracking-tight">
              {proveedor.nombre}
            </h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-ink-500">
              <span className="font-mono">{proveedor.codigo}</span>
              <span className="text-ink-300">·</span>
              <span>{proveedor.contacto}</span>
              <span className="text-ink-300">·</span>
              <span className="font-mono text-xs">{proveedor.email}</span>
            </div>
          </div>
        </div>
        <Button variant="primary" onClick={() => setQaModalOpen(true)}>
          Registrar inspección QA
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card accent={proveedor.color}>
          <CardBody>
            <KPI
              label="Rating"
              value={proveedor.rating.toFixed(1)}
              unit="/ 5.0"
              size="xl"
              status="flow"
            />
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <KPI
              label="QA aprobación"
              value={`${proveedor.tasa_qa_aprobado}`}
              unit="%"
              size="xl"
              status={
                proveedor.tasa_qa_aprobado >= 95
                  ? 'flow'
                  : proveedor.tasa_qa_aprobado >= 90
                  ? 'attention'
                  : 'anomaly'
              }
            />
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <KPI
              label="Tasa anomalía"
              value={`${proveedor.tasa_anomalia}`}
              unit="%"
              size="xl"
              status={
                proveedor.tasa_anomalia <= 1
                  ? 'flow'
                  : proveedor.tasa_anomalia <= 3
                  ? 'attention'
                  : 'anomaly'
              }
            />
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <KPI
              label="Volumen total"
              value={proveedor.total_recibido.toLocaleString()}
              unit="prepacks"
              size="xl"
            />
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        {/* Recent orders */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader
              label="Pedidos del proveedor"
              action={
                <span className="font-mono text-xs text-ink-400">
                  {ordenesDelProveedor.length} órdenes
                </span>
              }
            >
              Órdenes activas
            </CardHeader>
            <Table className="!rounded-t-none !border-t-0">
              <TableHeader>
                <TableCell header>Orden</TableCell>
                <TableCell header>Producto</TableCell>
                <TableCell header>Estadio</TableCell>
                <TableCell header align="right">
                  Recibidos
                </TableCell>
              </TableHeader>
              <tbody>
                {ordenesDelProveedor.map((o) => (
                  <TableRow key={o.orden_id}>
                    <TableCell>
                      <span className="font-mono text-xs font-semibold">
                        {o.orden_id}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="font-display font-medium text-ink-700 text-sm">
                        {o.nombre_producto}
                      </div>
                      <div className="text-[11px] text-ink-400 font-mono">
                        {o.modelo}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className="label-industrial"
                        style={{ color: ETAPA_COLORS[o.estado] }}
                      >
                        {o.estado}
                      </span>
                    </TableCell>
                    <TableCell align="right">
                      <span className="font-mono tabular text-ink-700">
                        {o.total_recibidos}/{o.total_esperados}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </tbody>
            </Table>
          </Card>
        </div>

        {/* Performance card */}
        <div>
          <Card>
            <CardHeader label="Rendimiento">Indicadores</CardHeader>
            <CardBody>
              <div className="space-y-4">
                <PerfRow
                  label="Tiempo de respuesta"
                  value={`${proveedor.tiempo_respuesta_dias} días`}
                  good={proveedor.tiempo_respuesta_dias <= 3}
                />
                <PerfRow
                  label="QA Aprobación"
                  value={`${proveedor.tasa_qa_aprobado}%`}
                  good={proveedor.tasa_qa_aprobado >= 95}
                />
                <PerfRow
                  label="Tasa de anomalía"
                  value={`${proveedor.tasa_anomalia}%`}
                  good={proveedor.tasa_anomalia <= 1.5}
                />
                <PerfRow
                  label="Nivel comercial"
                  value={proveedor.nivel}
                  good={proveedor.nivel === 'PREFERENTE'}
                />
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Anomalies */}
      {anomaliasDelProveedor.length > 0 && (
        <Card>
          <CardHeader
            label="Historial QA"
            action={
              <StatusPill status="anomaly">
                {anomaliasDelProveedor.length} eventos
              </StatusPill>
            }
          >
            Anomalías registradas
          </CardHeader>
          <Table className="!rounded-t-none !border-t-0">
            <TableHeader>
              <TableCell header>EPC</TableCell>
              <TableCell header>Tipo</TableCell>
              <TableCell header>Descripción</TableCell>
              <TableCell header>Fecha</TableCell>
              <TableCell header>Estado</TableCell>
            </TableHeader>
            <tbody>
              {anomaliasDelProveedor.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>
                    <span className="font-mono font-semibold">{a.epc}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs font-display font-semibold">
                      {a.tipo_error}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-ink-500">{a.descripcion}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs font-mono text-ink-400">
                      {a.timestamp}
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
              ))}
            </tbody>
          </Table>
        </Card>
      )}

      <QaInspectionModal
        open={qaModalOpen}
        onClose={() => setQaModalOpen(false)}
        proveedor={proveedor}
      />
    </div>
  );
}

function PerfRow({ label, value, good }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-ink-500">{label}</span>
      <span
        className={`font-mono font-semibold text-sm ${
          good ? 'text-flow' : 'text-attention'
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function QaInspectionModal({ open, onClose, proveedor }) {
  const [epc, setEpc] = useState('');
  const [resultado, setResultado] = useState('APROBADO');
  const [observaciones, setObservaciones] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    alert(
      `Inspección registrada (mock):\nEPC: ${epc}\nResultado: ${resultado}\nProveedor: ${proveedor.nombre}`
    );
    setEpc('');
    setObservaciones('');
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      label="Inspección QA"
      title={`Registrar inspección · ${proveedor.nombre}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            Registrar
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label-industrial text-ink-400 mb-1.5 block">
            EPC inspeccionado
          </label>
          <input
            value={epc}
            onChange={(e) => setEpc(e.target.value)}
            placeholder="E001A"
            className="w-full px-3 py-2 bg-white border border-ink-200 rounded-card text-sm font-mono text-ink-700 placeholder-ink-300 focus:outline-none focus:border-ink-400 focus:ring-2 focus:ring-ink-100"
          />
        </div>

        <div>
          <label className="label-industrial text-ink-400 mb-1.5 block">
            Resultado
          </label>
          <div className="grid grid-cols-2 gap-2">
            {['APROBADO', 'FALLIDO'].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setResultado(r)}
                className={`px-4 py-2.5 rounded-card text-sm font-display font-semibold border-2 transition-colors ${
                  resultado === r
                    ? r === 'APROBADO'
                      ? 'border-flow bg-flow-bg text-flow'
                      : 'border-anomaly bg-anomaly-bg text-anomaly'
                    : 'border-ink-200 bg-white text-ink-500'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label-industrial text-ink-400 mb-1.5 block">
            Observaciones
          </label>
          <textarea
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            rows={3}
            placeholder="Detalles del defecto encontrado..."
            className="w-full px-3 py-2 bg-white border border-ink-200 rounded-card text-sm text-ink-700 placeholder-ink-300 focus:outline-none focus:border-ink-400 focus:ring-2 focus:ring-ink-100 resize-none"
          />
        </div>
      </form>
    </Modal>
  );
}
