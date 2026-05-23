import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Card,
  CardBody,
  KPI,
  StatusPill,
  SearchInput,
} from '@vertiche/design-system';
import { proveedores } from '@vertiche/mock-data';

const NIVEL_STATUS = {
  PREFERENTE: 'flow',
  REGULAR: 'neutral',
  OBSERVACION: 'attention',
};

export function ProveedorList() {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('rating');

  const filtered = useMemo(() => {
    let list = proveedores;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.nombre.toLowerCase().includes(q) ||
          p.codigo.toLowerCase().includes(q)
      );
    }
    list = [...list].sort((a, b) => {
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'qa') return b.tasa_qa_aprobado - a.tasa_qa_aprobado;
      if (sortBy === 'anomalia') return a.tasa_anomalia - b.tasa_anomalia;
      if (sortBy === 'volume') return b.total_recibido - a.total_recibido;
      return 0;
    });
    return list;
  }, [search, sortBy]);

  const preferentes = proveedores.filter((p) => p.nivel === 'PREFERENTE').length;
  const enObservacion = proveedores.filter((p) => p.nivel === 'OBSERVACION').length;
  const avgRating = (
    proveedores.reduce((s, p) => s + p.rating, 0) / proveedores.length
  ).toFixed(1);

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      <div className="flex items-end justify-between mb-8 gap-4">
        <div>
          <div className="label-industrial text-ink-400 mb-2">
            Calificación de proveedores
          </div>
          <h1 className="font-display font-bold text-3xl text-ink-700 tracking-tight">
            Proveedores activos
          </h1>
          <p className="text-sm text-ink-400 mt-1">
            {proveedores.length} proveedores · ranking por desempeño QA
          </p>
        </div>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar por nombre o código..."
          className="w-80"
        />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardBody>
            <KPI label="Total" value={proveedores.length} unit="proveedores" size="lg" />
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <KPI
              label="Preferentes"
              value={preferentes}
              size="lg"
              status="flow"
            />
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <KPI
              label="En observación"
              value={enObservacion}
              size="lg"
              status={enObservacion > 0 ? 'attention' : undefined}
            />
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <KPI
              label="Rating promedio"
              value={avgRating}
              unit="/ 5.0"
              size="lg"
              status="flow"
            />
          </CardBody>
        </Card>
      </div>

      {/* Sort tabs */}
      <div className="flex items-center gap-1 mb-4 bg-white rounded-card border border-ink-200 p-1 w-fit">
        {[
          { id: 'rating', label: 'Rating' },
          { id: 'qa', label: 'QA aprobación' },
          { id: 'anomalia', label: 'Anomalías' },
          { id: 'volume', label: 'Volumen' },
        ].map((opt) => (
          <button
            key={opt.id}
            onClick={() => setSortBy(opt.id)}
            className={`px-3 py-1.5 text-xs font-display font-semibold uppercase tracking-industrial rounded transition-colors ${
              sortBy === opt.id
                ? 'bg-ink-700 text-white'
                : 'text-ink-400 hover:text-ink-700'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Provider cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map((p, i) => (
          <Link key={p.id} to={`/${p.id}`}>
            <Card accent={p.color}>
              <CardBody>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-mono text-xs text-ink-400">
                        #{i + 1}
                      </span>
                      <StatusPill status={NIVEL_STATUS[p.nivel]}>
                        {p.nivel}
                      </StatusPill>
                    </div>
                    <h3 className="font-display font-bold text-lg text-ink-700 truncate">
                      {p.nombre}
                    </h3>
                    <div className="text-xs text-ink-400 font-mono mt-0.5">
                      {p.codigo} · {p.contacto}
                    </div>
                  </div>
                  <RatingStars value={p.rating} />
                </div>

                <div className="grid grid-cols-3 gap-3 pt-3 border-t border-ink-100">
                  <Metric
                    label="QA Aprob."
                    value={`${p.tasa_qa_aprobado}%`}
                    status={p.tasa_qa_aprobado < 90 ? 'attention' : 'flow'}
                  />
                  <Metric
                    label="Anomalía"
                    value={`${p.tasa_anomalia}%`}
                    status={p.tasa_anomalia > 3 ? 'attention' : 'flow'}
                  />
                  <Metric
                    label="Volumen"
                    value={p.total_recibido}
                  />
                </div>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

function RatingStars({ value }) {
  return (
    <div className="flex flex-col items-end">
      <div className="font-display font-bold text-2xl tabular text-ink-700">
        {value.toFixed(1)}
      </div>
      <div className="flex gap-0.5 mt-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <span
            key={s}
            className={`text-sm leading-none ${
              s <= Math.round(value) ? 'text-attention' : 'text-ink-200'
            }`}
          >
            ★
          </span>
        ))}
      </div>
    </div>
  );
}

function Metric({ label, value, status }) {
  const color =
    status === 'attention'
      ? 'text-attention'
      : status === 'flow'
      ? 'text-flow'
      : 'text-ink-700';
  return (
    <div>
      <div className="text-[10px] text-ink-400 uppercase tracking-industrial font-display font-medium mb-1">
        {label}
      </div>
      <div className={`font-mono tabular font-semibold ${color}`}>
        {value}
      </div>
    </div>
  );
}
