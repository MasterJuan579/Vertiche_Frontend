import { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { BAY_COLORS, CAJA_COUNT } from '../data/demoData.js';
import { listTagsCompletos } from '../api/tags.js';
import { listTiendas } from '../api/tiendas.js';
import { connectRealtime } from '../api/rfid.js';
import { IconScan, IconCheck, IconX } from '../components/Icons.jsx';

function parseBahia(s) {
  if (!s) return null;
  const m = String(s).match(/(\d+)\s*$/);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return Number.isFinite(n) && n >= 1 ? n : null;
}

function scanToPrepack(payload) {
  return {
    ...payload,
    id: `${payload.epc}-${payload.timestamp || Date.now()}`,
    scannedAt: payload.timestamp ? new Date(payload.timestamp).getTime() : Date.now(),
    correctBay: payload.bahiaActual,
    bayNumber: payload.bahiaActual,
    orden_id: payload.orden_id,
    producto: payload.producto,
  };
}

export function OperatorScreen() {
  const { id } = useParams();
  const cajaId = parseInt(id, 10);
  const validCaja =
    Number.isFinite(cajaId) && cajaId >= 1 && cajaId <= CAJA_COUNT;

  const [activeBays, setActiveBays] = useState([1]);
  const [selectedBay, setSelectedBay] = useState(1);
  const [current, setCurrent] = useState(null);
  const [totalMine, setTotalMine] = useState(0);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([listTiendas(), listTagsCompletos()])
      .then(([tiendas, tags]) => {
        if (cancelled) return;
        const bays = new Set([1]);
        for (const tienda of Array.isArray(tiendas) ? tiendas : []) {
          const bay = parseBahia(tienda.bahia_asignada);
          if (bay) bays.add(bay);
        }
        for (const tag of Array.isArray(tags) ? tags : []) {
          const bay = parseBahia(tag.tienda?.bahia_asignada);
          if (bay) bays.add(bay);
        }
        const sorted = [...bays].sort((a, b) => a - b);
        setActiveBays(sorted);
        setSelectedBay((prev) => sorted.includes(prev) ? prev : sorted[0]);
      })
      .catch(() => {
        if (!cancelled) setActiveBays([1]);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let socket;
    let cancelled = false;
    connectRealtime({
      connect: () => { if (!cancelled) setConnected(true); },
      disconnect: () => { if (!cancelled) setConnected(false); },
      'sorter-caja-scan': (payload) => {
        if (cancelled) return;
        const scan = scanToPrepack(payload);
        setCurrent(scan);
        if (scan.bahiaActual === selectedBay && scan.cajaDestino === cajaId) {
          setTotalMine((n) => n + 1);
        }
      },
    }).then((s) => { socket = s; }).catch(() => setConnected(false));
    return () => {
      cancelled = true;
      if (socket) socket.disconnect();
    };
  }, [cajaId, selectedBay]);

  if (!validCaja) {
    return <Navigate to="/sorter/caja/1" replace />;
  }

  const shouldPick =
    current?.bahiaActual === selectedBay && current?.cajaDestino === cajaId;
  const bayColor = BAY_COLORS[selectedBay] || '#6b7280';
  const destinationColor = current
    ? BAY_COLORS[current.bahiaActual] || '#6b7280'
    : bayColor;

  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden bg-ink-50 dark:bg-ink-900">
      <header className="flex flex-wrap items-center gap-3 px-4 sm:px-6 py-3 sm:py-4 border-b border-ink-100 bg-white shrink-0 dark:bg-ink-700 dark:border-ink-600">
        <div
          className="w-10 h-10 sm:w-12 sm:h-12 rounded-card flex items-center justify-center font-mono text-lg sm:text-xl font-bold text-white shrink-0 shadow-card"
          style={{ background: bayColor }}
        >
          {cajaId}
        </div>

        <div className="flex-1 min-w-0">
          <div className="font-display text-base sm:text-lg font-bold text-ink-700 dark:text-ink-100">
            Bahia {selectedBay} - Caja {cajaId}
          </div>
          <div className="font-mono text-[11px] text-ink-400 truncate">
            {totalMine} tomado{totalMine !== 1 ? 's' : ''} para esta caja
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 shrink-0">
          <span className="w-2 h-2 rounded-full bg-flow-ring animate-pulse" />
          <span className="font-mono text-[10px] uppercase tracking-industrial text-flow dark:text-flow-ring">
            {connected ? 'RFID vivo' : 'Conectando'}
          </span>
        </div>
      </header>

      <div className="px-4 sm:px-6 py-2.5 sm:py-3 border-b border-ink-100 bg-white/80 shrink-0 dark:bg-ink-800 dark:border-ink-700">
        <div className="flex items-center gap-2 overflow-x-auto">
          <span className="font-mono text-[10px] uppercase tracking-industrial text-ink-400 shrink-0">
            Bahia de esta caja
          </span>
          {activeBays.map((bay) => {
            const active = bay === selectedBay;
            return (
              <button
                key={bay}
                type="button"
                onClick={() => {
                  setSelectedBay(bay);
                  setCurrent(null);
                  setTotalMine(0);
                }}
                className={
                  'w-9 h-8 rounded-card border font-mono text-[12px] font-bold shrink-0 transition-colors ' +
                  (active
                    ? 'text-white border-transparent'
                    : 'text-ink-500 border-ink-100 bg-white hover:bg-ink-50 dark:text-ink-300 dark:border-ink-600 dark:bg-ink-700 dark:hover:bg-ink-600')
                }
                style={active ? { background: BAY_COLORS[bay] || '#6b7280' } : undefined}
              >
                {bay}
              </button>
            );
          })}
        </div>
      </div>

      <main
        className="flex-1 min-h-0 overflow-y-auto flex flex-col items-center justify-start sm:justify-center px-4 sm:px-8 py-5 sm:py-8 text-center"
        style={{
          backgroundImage: current
            ? `radial-gradient(ellipse at top, ${shouldPick ? '#10b981' : '#64748b'}26 0%, transparent 60%)`
            : `radial-gradient(ellipse at top, ${bayColor}18 0%, transparent 58%)`,
        }}
      >
        {!current ? (
          <WaitingState />
        ) : (
          <PickState
            current={current}
            shouldPick={shouldPick}
            selectedBay={selectedBay}
            cajaId={cajaId}
            destinationColor={destinationColor}
          />
        )}
      </main>

      <footer className="shrink-0 flex justify-center px-4 sm:px-6 py-3 sm:py-4 border-t border-ink-100 bg-white dark:bg-ink-700 dark:border-ink-600">
        <button
          type="button"
          disabled
          className={
            'w-full sm:w-auto justify-center ' +
            'inline-flex items-center gap-2.5 px-6 sm:px-8 py-3 sm:py-3.5 rounded-card border-2 ' +
            'font-display text-xs font-bold uppercase tracking-industrial shadow-card-hover transition-all ' +
            'bg-ink-50 border-ink-100 text-ink-400 cursor-not-allowed dark:bg-ink-600 dark:border-ink-500'
          }
        >
          <IconScan size={17} color="#5C6878" />
          Esperando RFID real
        </button>
      </footer>
    </div>
  );
}

function WaitingState() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 sm:gap-5">
      <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full flex items-center justify-center bg-white border border-ink-100 dark:bg-ink-700 dark:border-ink-600">
        <IconScan size={40} color="#1E40AF" />
      </div>
      <div>
        <p className="font-display text-[clamp(36px,10vw,48px)] font-black text-ink-700 dark:text-white">
          EN ESPERA
        </p>
        <p className="mt-3 font-mono text-sm uppercase tracking-industrial text-ink-400">
          Sin prepack activo
        </p>
      </div>
    </div>
  );
}

function PickState({ current, shouldPick, selectedBay, cajaId, destinationColor }) {
  return (
    <div className="w-full flex flex-col items-center gap-4 sm:gap-5 animate-[fadeIn_.25s_ease]">
      <div
        className={
          'w-[min(24vh,220px)] h-[min(24vh,220px)] sm:w-[min(30vh,260px)] sm:h-[min(30vh,260px)] rounded-full flex items-center justify-center border-[7px] sm:border-[8px] shadow-card-hover shrink-0 ' +
          (shouldPick
            ? 'bg-flow-bg border-flow text-flow dark:bg-flow/20 dark:border-flow-ring dark:text-flow-ring'
            : 'bg-ink-100 border-ink-300 text-ink-500 dark:bg-ink-700 dark:border-ink-500 dark:text-ink-300')
        }
      >
        {shouldPick ? (
          <IconCheck size={76} color="currentColor" />
        ) : (
          <IconX size={76} color="currentColor" />
        )}
      </div>

      <div>
        <p
          className={
            'font-display text-[clamp(42px,12vw,96px)] leading-none font-black uppercase break-words ' +
            (shouldPick
              ? 'text-flow dark:text-flow-ring'
              : 'text-ink-500 dark:text-ink-300')
          }
        >
          {shouldPick ? 'Agarrar' : 'No agarrar'}
        </p>

        <p className="mt-4 sm:mt-5 text-base sm:text-lg font-display font-bold text-ink-700 dark:text-white">
          {shouldPick
            ? `Bahia ${selectedBay} - Caja ${cajaId}`
            : `Destino: Bahia ${current.bahiaActual} - Caja ${current.cajaDestino}`}
        </p>

        <div className="mt-4 sm:mt-5 inline-flex flex-wrap justify-center items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3 rounded-card border border-ink-100 bg-white dark:bg-ink-700 dark:border-ink-600 max-w-full">
          <SmallValue label="RFID" value={`...${current.epc?.slice(-6) || '---'}`} color="#1E40AF" />
          <div className="hidden sm:block w-px h-8 bg-ink-100 dark:bg-ink-600" />
          <SmallValue label="Orden" value={current.orden_id || '---'} color={destinationColor} />
        </div>
      </div>
    </div>
  );
}

function SmallValue({ label, value, color }) {
  return (
    <div className="text-left">
      <div className="font-mono text-[9px] uppercase tracking-industrial text-ink-400">
        {label}
      </div>
      <div className="mt-0.5 font-mono text-base font-bold" style={{ color }}>
        {value}
      </div>
    </div>
  );
}
