import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  CardBody,
  CardHeader,
  KPI,
  StatusDot,
  StatusPill,
  Button,
  EmptyState,
  Table,
  TableHeader,
  TableRow,
  TableCell,
} from '@vertiche/design-system';
import {
  tiendas,
  tags,
  getProveedorById,
  getOrdenById,
} from '@vertiche/mock-data';

export function StationScreen() {
  const { bahiaId } = useParams();
  const navigate = useNavigate();
  const tienda = tiendas.find((t) => t.bahia_asignada === bahiaId);

  // 3 terminals × 4 prepack slots per terminal
  const [pickedSlots, setPickedSlots] = useState(new Set());

  // Reset picks when bahia changes
  useEffect(() => {
    setPickedSlots(new Set());
  }, [bahiaId]);

  if (!tienda) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <EmptyState
          title="Bahía no encontrada"
          description={`No existe una bahía con ID ${bahiaId}.`}
          action={
            <Button variant="primary" onClick={() => navigate('/bahias')}>
              Volver
            </Button>
          }
        />
      </div>
    );
  }

  // Assign tags to virtual terminals/slots
  const tagsAsignados = tags.filter(
    (t) => t.tienda_id === tienda.tienda_id && t.etapa_actual === 'BAHIA'
  );
  const terminals = buildTerminalLayout(tagsAsignados);

  const allSlots = terminals.flatMap((t) =>
    t.slots.map((s) => `${t.id}-${s.position}`)
  );
  const allOccupied = allSlots.filter((slotId) => {
    const [tid, pos] = slotId.split('-');
    const term = terminals.find((t) => t.id === tid);
    return term?.slots.find((s) => s.position === pos && s.tag);
  });
  const completed = allOccupied.filter((s) => pickedSlots.has(s));
  const next = allOccupied.find((s) => !pickedSlots.has(s));
  const isComplete = allOccupied.length > 0 && completed.length === allOccupied.length;

  function togglePick(slotId) {
    setPickedSlots((prev) => {
      const next = new Set(prev);
      if (next.has(slotId)) next.delete(slotId);
      else next.add(slotId);
      return next;
    });
  }

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      <Link
        to="/bahias"
        className="inline-flex items-center gap-1.5 text-xs font-display font-semibold text-ink-400 hover:text-ink-700 uppercase tracking-industrial mb-4"
      >
        ← Volver a Bahías
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-6 mb-8">
        <div className="flex items-start gap-5">
          <div className="w-20 h-20 bg-sorter rounded-card flex items-center justify-center text-white font-display font-bold text-3xl">
            {bahiaId}
          </div>
          <div>
            <div className="label-industrial text-ink-400 mb-1">Estación</div>
            <h1 className="font-display font-bold text-3xl text-ink-700 tracking-tight">
              {tienda.nombre}
            </h1>
            <div className="flex items-center gap-3 mt-2 text-sm text-ink-500">
              <span className="font-mono">{tienda.tienda_id}</span>
              <span className="text-ink-300">·</span>
              <span>{tienda.ciudad}</span>
              <span className="text-ink-300">·</span>
              <span>Región {tienda.region}</span>
            </div>
          </div>
        </div>
        <StatusPill
          status={isComplete ? 'flow' : 'neutral'}
          className="!text-sm !px-3 !py-1.5"
        >
          {isComplete ? 'BAHÍA COMPLETA' : 'EN OPERACIÓN'}
        </StatusPill>
      </div>

      {/* What's next callout */}
      {next && !isComplete && <NextActionPanel slotId={next} terminals={terminals} />}
      {isComplete && <CompletedPanel />}

      {/* Progress KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardBody>
            <KPI
              label="Progreso"
              value={`${completed.length}/${allOccupied.length}`}
              size="lg"
              status={isComplete ? 'flow' : undefined}
            />
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <KPI
              label="Terminales"
              value={terminals.length}
              unit="activos"
              size="lg"
            />
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <KPI
              label="Prepacks asignados"
              value={tagsAsignados.length}
              size="lg"
            />
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <KPI
              label="Piezas totales"
              value={tagsAsignados.reduce((s, t) => s + t.cantidad_piezas, 0)}
              size="lg"
            />
          </CardBody>
        </Card>
      </div>

      {/* Terminals visualization */}
      <section className="mb-8">
        <div className="label-industrial text-ink-400 mb-3">
          Terminales · 3 unidades × 4 ranuras
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {terminals.map((terminal) => (
            <TerminalCard
              key={terminal.id}
              terminal={terminal}
              pickedSlots={pickedSlots}
              onTogglePick={togglePick}
              nextSlot={next}
            />
          ))}
        </div>
      </section>

      {/* Manifest table */}
      {tagsAsignados.length > 0 && (
        <section>
          <div className="label-industrial text-ink-400 mb-3">
            Manifiesto completo
          </div>
          <Card>
            <Table>
              <TableHeader>
                <TableCell header>EPC</TableCell>
                <TableCell header>SKU</TableCell>
                <TableCell header>Color / Talla</TableCell>
                <TableCell header>Proveedor</TableCell>
                <TableCell header align="right">
                  Piezas
                </TableCell>
              </TableHeader>
              <tbody>
                {tagsAsignados.map((t) => {
                  const orden = getOrdenById(
                    // tags don't link directly to orden; use a fake mapping via palet
                    null
                  );
                  const proveedor = getProveedorById(t.proveedor_id);
                  return (
                    <TableRow key={t.epc}>
                      <TableCell>
                        <span className="font-mono font-semibold text-ink-700">
                          {t.epc}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-ink-500 text-xs">
                          {t.sku}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-ink-700">{t.color}</span>
                        <span className="text-ink-400"> · Talla </span>
                        <span className="font-display font-semibold">
                          {t.talla}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className="inline-block w-1.5 h-4 rounded-sm mr-2 align-middle"
                          style={{ background: proveedor?.color }}
                        />
                        <span className="text-ink-500 text-xs">
                          {proveedor?.nombre}
                        </span>
                      </TableCell>
                      <TableCell align="right">
                        <span className="font-mono tabular font-semibold">
                          {t.cantidad_piezas}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </tbody>
            </Table>
          </Card>
        </section>
      )}

      {tagsAsignados.length === 0 && (
        <EmptyState
          icon="◉"
          title="Sin prepacks pendientes"
          description="Esta bahía no tiene cargamentos asignados en este momento."
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────

function NextActionPanel({ slotId, terminals }) {
  const [tid, pos] = slotId.split('-');
  const term = terminals.find((t) => t.id === tid);
  const slot = term?.slots.find((s) => s.position === pos);
  if (!slot?.tag) return null;
  const tag = slot.tag;

  return (
    <Card className="mb-6 !shadow-card-hover border-sorter/30">
      <div className="bg-sorter px-6 py-3">
        <div className="label-industrial text-white">
          Siguiente acción · Terminal {term.label} · Ranura {slot.position}
        </div>
      </div>
      <CardBody className="!p-6">
        <div className="flex items-start justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-baseline gap-3 mb-2">
              <span className="font-mono font-bold text-2xl text-ink-700">
                {tag.epc}
              </span>
              <StatusPill status="attention">PRÓXIMO</StatusPill>
            </div>
            <div className="text-ink-500 mb-4">
              <span className="font-mono text-sm">{tag.sku}</span>
              <span className="text-ink-300 mx-2">·</span>
              <span>{tag.color}</span>
              <span className="text-ink-300 mx-2">·</span>
              <span>Talla <strong>{tag.talla}</strong></span>
              <span className="text-ink-300 mx-2">·</span>
              <span><strong>{tag.cantidad_piezas}</strong> piezas</span>
            </div>
          </div>
          <div className="flex items-center justify-center w-32 h-32 bg-ink-50 rounded-card border-2 border-sorter/30">
            <div className="text-center">
              <div className="font-display font-bold text-4xl text-sorter">
                {term.label}{slot.position}
              </div>
              <div className="text-[10px] uppercase tracking-industrial text-ink-400 mt-1">
                Ubicación
              </div>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

function CompletedPanel() {
  return (
    <Card className="mb-6 bg-flow-bg border-flow/20">
      <CardBody>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-flow flex items-center justify-center text-white font-bold text-xl">
            ✓
          </div>
          <div className="flex-1">
            <div className="font-display font-bold text-flow text-lg">
              Bahía completa
            </div>
            <div className="text-sm text-ink-500 mt-1">
              Todos los prepacks han sido procesados. La estación está lista para
              cierre.
            </div>
          </div>
          <Button variant="flow">Marcar enviada</Button>
        </div>
      </CardBody>
    </Card>
  );
}

function TerminalCard({ terminal, pickedSlots, onTogglePick, nextSlot }) {
  return (
    <Card>
      <CardHeader
        label={`Terminal ${terminal.label}`}
        action={
          <span className="font-mono text-xs text-ink-400">
            {terminal.slots.filter((s) => s.tag).length} / 4
          </span>
        }
      >
        Estación {terminal.label}
      </CardHeader>
      <CardBody>
        <div className="grid grid-cols-2 gap-2">
          {terminal.slots.map((slot) => {
            const slotId = `${terminal.id}-${slot.position}`;
            const isPicked = pickedSlots.has(slotId);
            const isNext = nextSlot === slotId;
            const hasTag = !!slot.tag;
            return (
              <button
                key={slot.position}
                onClick={() => hasTag && onTogglePick(slotId)}
                disabled={!hasTag}
                className={`relative rounded-card border-2 p-3 text-left transition-all min-h-[120px] ${
                  !hasTag
                    ? 'border-dashed border-ink-200 bg-ink-50/40 cursor-not-allowed'
                    : isPicked
                    ? 'border-flow bg-flow-bg/40'
                    : isNext
                    ? 'border-sorter bg-white shadow-card-hover'
                    : 'border-ink-200 bg-white hover:border-ink-400'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="label-industrial text-ink-400">
                    {terminal.label}{slot.position}
                  </span>
                  {isPicked && (
                    <span className="w-5 h-5 rounded-full bg-flow text-white flex items-center justify-center text-[10px] font-bold">
                      ✓
                    </span>
                  )}
                  {isNext && !isPicked && (
                    <span className="status-dot bg-sorter pulse-flow" />
                  )}
                </div>
                {hasTag ? (
                  <>
                    <div className="font-mono font-bold text-ink-700 text-sm">
                      {slot.tag.epc}
                    </div>
                    <div className="text-[11px] text-ink-500 mt-1 leading-tight">
                      {slot.tag.color} · {slot.tag.talla}
                    </div>
                    <div className="mt-2 font-mono text-[10px] text-ink-400">
                      {slot.tag.cantidad_piezas} pzs
                    </div>
                  </>
                ) : (
                  <div className="text-[10px] text-ink-300 italic">Vacía</div>
                )}
              </button>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
}

// Helper — distribute tags across 3 terminals × 4 slots
function buildTerminalLayout(tagsList) {
  const terminals = [
    { id: 'T1', label: 'A', slots: [] },
    { id: 'T2', label: 'B', slots: [] },
    { id: 'T3', label: 'C', slots: [] },
  ];

  // Initialize empty slots
  terminals.forEach((t) => {
    for (let i = 1; i <= 4; i++) {
      t.slots.push({ position: String(i), tag: null });
    }
  });

  // Distribute tags round-robin into available slots
  tagsList.slice(0, 12).forEach((tag, i) => {
    const terminalIdx = i % 3;
    const slotIdx = Math.floor(i / 3);
    if (terminals[terminalIdx] && terminals[terminalIdx].slots[slotIdx]) {
      terminals[terminalIdx].slots[slotIdx].tag = tag;
    }
  });

  return terminals;
}
