import { Link } from 'react-router-dom';
import { Card, CardBody, StatusPill, StatusDot } from '@vertiche/design-system';
import { tiendas, tags } from '@vertiche/mock-data';

const BAHIAS = [1, 2, 3, 4, 5, 6, 7, 8];

export function BahiaList() {
  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      <div className="mb-8">
        <div className="label-industrial text-ink-400 mb-2">
          Estaciones de empaque
        </div>
        <h1 className="font-display font-bold text-3xl text-ink-700 tracking-tight">
          Bahías
        </h1>
        <p className="text-sm text-ink-400 mt-1">
          Ocho bahías, una tienda asignada por bahía. Selecciona para ver la
          estación.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {BAHIAS.map((bn) => {
          const tienda = tiendas.find((t) => t.bahia_asignada === `B${bn}`);
          const tagsAsignados = tags.filter(
            (t) => t.tienda_id === tienda?.tienda_id && t.etapa_actual === 'BAHIA'
          );
          const isAlert = tienda?.estado_rep === 'ALERTA';

          return (
            <Card key={bn} accent={isAlert ? '#A16207' : '#7C3AED'} onClick={() => {}}>
              <Link to={`/bahias/B${bn}`} className="block">
                <CardBody>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-display font-bold text-4xl text-ink-700 tabular">
                        B{bn}
                      </div>
                      <div className="text-xs text-ink-400 font-display font-medium uppercase tracking-industrial mt-1">
                        Bahía {bn}
                      </div>
                    </div>
                    <StatusDot
                      status={isAlert ? 'attention' : 'flow'}
                      size="lg"
                      pulse={!isAlert}
                    />
                  </div>

                  <div className="space-y-1.5 mb-4">
                    <div className="font-display font-semibold text-ink-700">
                      {tienda?.nombre}
                    </div>
                    <div className="text-xs text-ink-400 font-mono">
                      {tienda?.tienda_id} · {tienda?.ciudad}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-ink-100">
                    <div>
                      <div className="font-mono tabular font-bold text-xl text-ink-700">
                        {tagsAsignados.length}
                      </div>
                      <div className="text-[10px] text-ink-400 uppercase tracking-industrial font-display font-medium">
                        prepacks
                      </div>
                    </div>
                    <StatusPill status={isAlert ? 'attention' : 'flow'}>
                      {tienda?.estado_rep || 'NORMAL'}
                    </StatusPill>
                  </div>
                </CardBody>
              </Link>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
