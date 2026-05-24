import { Link } from 'react-router-dom';
import {
  Card,
  CardBody,
  KPI,
  StatusDot,
  StatusPill,
} from '@vertiche/design-system';
import { tiendas, palets, tags } from '@vertiche/mock-data';

const BAHIAS = [1, 2, 3, 4, 5, 6, 7, 8];

export function SorterOverview() {
  const onSorter = palets.filter((p) => p.etapa_actual === 'SORTER').length;
  const onBahia = palets.filter((p) => p.etapa_actual === 'BAHIA').length;
  const pendingTags = tags.filter((t) => t.etapa_actual === 'SORTER').length;

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      <div className="mb-8">
        <div className="label-industrial text-ink-400 mb-2">Operación de bahía</div>
        <h1 className="font-display font-bold text-3xl text-ink-700 tracking-tight">
          Sorter en operación
        </h1>
        <p className="text-sm text-ink-400 mt-1">
          Flujo de palets desde el sorter hacia las ocho bahías de empaque.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardBody>
            <KPI label="En sorter" value={onSorter} unit="palets" size="lg" status="flow" />
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <KPI label="En bahías" value={onBahia} unit="palets" size="lg" />
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <KPI label="Tags pendientes" value={pendingTags} unit="prepacks" size="lg" />
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <KPI label="Bahías activas" value={BAHIAS.length} unit="de 8" size="lg" />
          </CardBody>
        </Card>
      </div>

      {/* Sorter conveyor visualization */}
      <Card className="mb-6 overflow-visible">
        <CardBody className="!p-8">
          <div className="label-industrial text-ink-400 mb-4">Vista del sorter</div>
          <div className="relative bg-ink-50 rounded-card p-8 border border-ink-100">
            {/* Conveyor belt visual */}
            <div className="relative h-16 mx-12 mb-8">
              <div className="absolute inset-0 bg-gradient-to-r from-ink-200 via-ink-300 to-ink-200 rounded-card overflow-hidden">
                {/* Belt stripes */}
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute top-0 bottom-0 w-1 bg-ink-700/10"
                    style={{ left: `${i * 12.5}%` }}
                  />
                ))}
                {/* Moving prepack items */}
                {[15, 45, 75].map((pos, i) => (
                  <div
                    key={i}
                    className="absolute top-1/2 -translate-y-1/2 w-10 h-10 bg-white border-2 border-sorter rounded-sm shadow-md flex items-center justify-center"
                    style={{ left: `${pos}%` }}
                  >
                    <span className="font-mono text-[9px] font-bold text-sorter">
                      ▣
                    </span>
                  </div>
                ))}
              </div>
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-sorter text-white text-[10px] font-display font-bold uppercase tracking-industrial rounded">
                Loop conveyor
              </div>
            </div>

            {/* Chute arrows to bays */}
            <div className="grid grid-cols-8 gap-2">
              {BAHIAS.map((bn) => {
                const t = tiendas.find((x) => x.bahia_asignada === `B${bn}`);
                const isAlert = t?.estado_rep === 'ALERTA';
                return (
                  <Link
                    key={bn}
                    to={`/bahias/B${bn}`}
                    className="group block"
                  >
                    <div className="flex flex-col items-center">
                      <div className="text-ink-300 group-hover:text-ink-700 transition-colors text-xl mb-1">
                        ↓
                      </div>
                      <div className="w-full bg-white border border-ink-200 rounded-card p-3 text-center group-hover:border-sorter transition-colors">
                        <div className="font-display font-bold text-ink-700 text-lg">
                          B{bn}
                        </div>
                        <div className="text-[10px] text-ink-400 truncate mt-0.5">
                          {t?.nombre || '—'}
                        </div>
                        <div className="mt-2 flex justify-center">
                          <StatusDot
                            status={isAlert ? 'attention' : 'flow'}
                            size="sm"
                            pulse={!isAlert}
                          />
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Quick action */}
      <div className="flex items-center justify-between p-5 bg-ink-700 rounded-card text-white">
        <div>
          <div className="label-industrial text-ink-300 mb-1">Operador</div>
          <div className="font-display font-semibold">
            Selecciona una bahía para ver el detalle de la estación
          </div>
        </div>
        <Link
          to="/sorter/bahias"
          className="px-4 py-2 bg-white text-ink-700 rounded-card text-sm font-display font-semibold hover:bg-ink-50 transition-colors"
        >
          Ir a Bahías →
        </Link>
      </div>
    </div>
  );
}
