import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  CardBody,
  StatusPill,
  Button,
  SearchInput,
  EmptyState,
} from '@vertiche/design-system';
import {
  getTagByEpc,
  getProveedorById,
  getTiendaById,
  getPaletById,
  ETAPAS,
  ETAPA_COLORS,
} from '@vertiche/mock-data';

export function Trazabilidad() {
  const { epc: paramEpc } = useParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState(paramEpc || '');
  const [tag, setTag] = useState(paramEpc ? getTagByEpc(paramEpc) : null);

  useEffect(() => {
    if (paramEpc) {
      setQuery(paramEpc);
      setTag(getTagByEpc(paramEpc));
    }
  }, [paramEpc]);

  function handleSearch(e) {
    e?.preventDefault();
    const found = getTagByEpc(query.trim().toUpperCase());
    if (found) {
      navigate(`/rfid/trazabilidad/${found.epc}`);
    } else {
      setTag(null);
    }
  }

  const quickEpcs = ['E001A', 'E009B', 'E014B', 'E020A'];

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      <div className="mb-8">
        <div className="label-industrial text-ink-400 mb-2">Trazabilidad</div>
        <h1 className="font-display font-bold text-3xl text-ink-700 tracking-tight">
          Búsqueda por EPC
        </h1>
        <p className="text-sm text-ink-400 mt-1">
          Localiza un tag y revisa su recorrido completo en los siete estadios.
        </p>
      </div>

      <Card className="mb-6">
        <CardBody>
          <form onSubmit={handleSearch} className="flex gap-3">
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Escribe un EPC (ej. E001A)..."
              className="flex-1"
            />
            <Button type="submit" variant="primary">
              Buscar
            </Button>
          </form>
          <div className="mt-3 flex items-center gap-2 text-xs text-ink-400">
            <span className="label-industrial">Atajos:</span>
            {quickEpcs.map((e) => (
              <button
                key={e}
                onClick={() => navigate(`/rfid/trazabilidad/${e}`)}
                className="font-mono text-rfid hover:underline"
              >
                {e}
              </button>
            ))}
          </div>
        </CardBody>
      </Card>

      {!tag && paramEpc && (
        <EmptyState
          icon="?"
          title="EPC no encontrado"
          description={`No se encontró el tag "${paramEpc}". Revisa el formato e intenta de nuevo.`}
        />
      )}

      {!tag && !paramEpc && (
        <EmptyState
          icon="⌕"
          title="Sin búsqueda activa"
          description="Ingresa un EPC arriba o usa uno de los atajos para ver su trazabilidad completa."
        />
      )}

      {tag && <TagDetail tag={tag} />}
    </div>
  );
}

function TagDetail({ tag }) {
  const proveedor = getProveedorById(tag.proveedor_id);
  const tienda = getTiendaById(tag.tienda_id);
  const palet = getPaletById(tag.palet_id);
  const etapaIndex = ETAPAS.indexOf(tag.etapa_actual);

  return (
    <>
      <Card className="mb-6">
        <CardBody>
          <div className="flex items-start justify-between gap-6 mb-6">
            <div>
              <div className="label-industrial text-ink-400 mb-1">Tag</div>
              <div className="font-mono text-3xl font-bold text-ink-700">
                {tag.epc}
              </div>
              <div className="mt-2 text-sm text-ink-500">
                {tag.sku} · {tag.color} · Talla {tag.talla} ·{' '}
                {tag.cantidad_piezas} pzs
              </div>
            </div>
            {tag.qa_fallido ? (
              <StatusPill status="anomaly" className="!text-sm">
                QA FALLIDO
              </StatusPill>
            ) : (
              <StatusPill status="flow" className="!text-sm">
                EN FLUJO NORMAL
              </StatusPill>
            )}
          </div>

          {/* 7-stage timeline horizontal */}
          <div className="grid grid-cols-7 gap-2">
            {ETAPAS.map((etapa, i) => {
              const done = i <= etapaIndex;
              const current = i === etapaIndex;
              return (
                <div key={etapa} className="text-center">
                  <div
                    className="h-2 rounded-full mb-2"
                    style={{
                      background: done ? ETAPA_COLORS[etapa] : '#E5EAF0',
                    }}
                  />
                  <div
                    className="label-industrial"
                    style={{
                      color: done ? ETAPA_COLORS[etapa] : '#9AA5B5',
                    }}
                  >
                    {etapa}
                  </div>
                  {current && (
                    <div className="mt-1 text-[10px] font-mono text-ink-700">
                      ACTUAL
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <InfoCard
          label="Proveedor"
          title={proveedor?.nombre}
          subtitle={proveedor?.codigo}
          accent={proveedor?.color}
        />
        <InfoCard
          label="Destino"
          title={tienda?.nombre}
          subtitle={`${tienda?.ciudad} · Bahía ${tienda?.bahia_asignada}`}
        />
        <InfoCard
          label="Palet asignado"
          title={palet?.palet_id}
          subtitle={`${palet?.total_prepacks} prepacks · ${palet?.tiempo_ciclo_min} min`}
        />
      </div>
    </>
  );
}

function InfoCard({ label, title, subtitle, accent }) {
  return (
    <Card accent={accent}>
      <CardBody>
        <div className="label-industrial text-ink-400 mb-2">{label}</div>
        <div className="font-display font-bold text-ink-700">{title}</div>
        <div className="text-xs text-ink-400 font-mono mt-1">{subtitle}</div>
      </CardBody>
    </Card>
  );
}
