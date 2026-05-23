import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Card,
  CardBody,
  StatusPill,
  Table,
  TableHeader,
  TableRow,
  TableCell,
  SearchInput,
  TabBar,
} from '@vertiche/design-system';
import {
  palets,
  ETAPAS,
  ETAPA_COLORS,
  getProveedorById,
  getOrdenById,
} from '@vertiche/mock-data';

export function Pedidos() {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('todos');

  const counts = useMemo(() => {
    return ETAPAS.reduce(
      (acc, etapa) => {
        acc[etapa] = palets.filter((p) => p.etapa_actual === etapa).length;
        return acc;
      },
      { todos: palets.length }
    );
  }, []);

  const tabs = [
    { id: 'todos', label: 'Todos', badge: counts.todos },
    ...ETAPAS.map((e) => ({ id: e, label: e, badge: counts[e] })),
  ];

  const filtered = useMemo(() => {
    return palets.filter((p) => {
      if (tab !== 'todos' && p.etapa_actual !== tab) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      const orden = getOrdenById(p.orden_id);
      return (
        p.palet_id.toLowerCase().includes(q) ||
        p.orden_id.toLowerCase().includes(q) ||
        orden?.nombre_producto?.toLowerCase().includes(q)
      );
    });
  }, [tab, search]);

  return (
    <div>
      {/* Header */}
      <div className="px-8 pt-8 pb-6 max-w-[1400px] mx-auto w-full">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="label-industrial text-ink-400 mb-2">Logística</div>
            <h1 className="font-display font-bold text-3xl text-ink-700 tracking-tight">
              Pedidos & Palets
            </h1>
            <p className="text-sm text-ink-400 mt-1">
              Cargamentos activos · agrupados por estadio actual.
            </p>
          </div>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Palet, OC o producto..."
            className="w-80"
          />
        </div>
      </div>

      <TabBar tabs={tabs} activeId={tab} onSelect={setTab} accent="#1E40AF" />

      <div className="p-8 max-w-[1400px] mx-auto">
        <Card>
          <Table>
            <TableHeader>
              <TableCell header>Palet</TableCell>
              <TableCell header>Producto</TableCell>
              <TableCell header>Proveedor</TableCell>
              <TableCell header>Estadio</TableCell>
              <TableCell header align="right">
                Prepacks
              </TableCell>
              <TableCell header align="right">
                Ciclo (min)
              </TableCell>
              <TableCell header />
            </TableHeader>
            <tbody>
              {filtered.map((p) => {
                const orden = getOrdenById(p.orden_id);
                const proveedor = getProveedorById(orden?.proveedor_id);
                return (
                  <TableRow key={p.palet_id}>
                    <TableCell>
                      <div className="font-mono font-semibold text-ink-700">
                        {p.palet_id}
                      </div>
                      <div className="text-[11px] text-ink-400 font-mono">
                        {p.orden_id}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-display font-medium text-ink-700">
                        {orden?.nombre_producto || '—'}
                      </div>
                      <div className="text-[11px] text-ink-400 font-mono">
                        {orden?.modelo}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span
                          className="w-1.5 h-6 rounded-sm"
                          style={{ background: proveedor?.color }}
                        />
                        <div>
                          <div className="text-ink-700">{proveedor?.nombre}</div>
                          <div className="text-[11px] text-ink-400 font-mono">
                            {proveedor?.codigo}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusPill
                        status={
                          p.etapa_actual === 'ENVIO'
                            ? 'flow'
                            : p.etapa_actual === 'QA'
                            ? 'attention'
                            : 'neutral'
                        }
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{
                            background: ETAPA_COLORS[p.etapa_actual],
                          }}
                        />
                        {p.etapa_actual}
                      </StatusPill>
                    </TableCell>
                    <TableCell align="right">
                      <span className="font-mono font-semibold text-ink-700 tabular">
                        {p.total_prepacks}
                      </span>
                    </TableCell>
                    <TableCell align="right">
                      <span className="font-mono text-ink-500 tabular">
                        {p.tiempo_ciclo_min}
                      </span>
                    </TableCell>
                    <TableCell align="right">
                      <Link
                        to={`/pedidos/${p.palet_id}`}
                        className="text-xs font-display font-semibold text-rfid hover:underline uppercase tracking-industrial"
                      >
                        Ver →
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <div className="py-12 text-center text-ink-400 text-sm">
                      Sin palets para los filtros aplicados.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
