import { useCallback, useMemo, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import {
  BAY_COLORS,
  CAJA_COUNT,
  DEMO_BAY_ID,
  getPrepacksForDemoBay,
  getPrepacksForCaja,
} from '../data/demoData.js';
import { IconScan, IconCheck, IconX } from '../components/Icons.jsx';

export function OperatorScreen() {
  const { id } = useParams();
  const cajaId = parseInt(id, 10);
  const validCaja =
    Number.isFinite(cajaId) && cajaId >= 1 && cajaId <= CAJA_COUNT;

  const selectedBay = DEMO_BAY_ID;
  const demoPrepacks = useMemo(() => getPrepacksForDemoBay(), []);
  const [current, setCurrent] = useState(null);
  const [cursor, setCursor] = useState(0);
  const [scanning, setScanning] = useState(false);
  const [totalMine, setTotalMine] = useState(0);

  const assignedPrepacks = useMemo(
    () => (
      validCaja
        ? getPrepacksForCaja(selectedBay, cajaId)
        : []
    ),
    [cajaId, selectedBay, validCaja]
  );

  const handleScan = useCallback(() => {
    if (scanning) return;
    setScanning(true);
    const prepack = demoPrepacks[cursor % demoPrepacks.length];
    const scan = {
      ...prepack,
      id: `${prepack.epc}-${Date.now()}`,
      scannedAt: Date.now(),
    };
    const mine = scan.correctBay === selectedBay && scan.cajaDestino === cajaId;
    setCurrent(scan);
    if (mine) setTotalMine((n) => n + 1);
    setCursor((c) => c + 1);
    setTimeout(() => setScanning(false), 300);
  }, [cajaId, cursor, demoPrepacks, scanning, selectedBay]);

  if (!validCaja) {
    return <Navigate to="/sorter/caja/1" replace />;
  }

  const shouldPick =
    current?.correctBay === selectedBay && current?.cajaDestino === cajaId;
  const bayColor = BAY_COLORS[selectedBay] || '#6b7280';
  const destinationColor = current
    ? BAY_COLORS[current.correctBay] || '#6b7280'
    : bayColor;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-ink-50 dark:bg-ink-900">
      <header className="flex items-center gap-4 px-6 py-4 border-b border-ink-100 bg-white shrink-0 dark:bg-ink-700 dark:border-ink-600">
        <div
          className="w-12 h-12 rounded-card flex items-center justify-center font-mono text-xl font-bold text-white shrink-0 shadow-card"
          style={{ background: bayColor }}
        >
          {cajaId}
        </div>

        <div className="flex-1 min-w-0">
          <div className="font-display text-lg font-bold text-ink-700 dark:text-ink-100">
            Bahia {selectedBay} · Caja {cajaId}
          </div>
          <div className="font-mono text-[11px] text-ink-400 truncate">
            {assignedPrepacks.length} prepack{assignedPrepacks.length !== 1 ? 's' : ''} en cola · {totalMine} tomado{totalMine !== 1 ? 's' : ''}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="w-2 h-2 rounded-full bg-flow-ring animate-pulse" />
          <span className="font-mono text-[10px] uppercase tracking-industrial text-flow dark:text-flow-ring">
            RFID demo
          </span>
        </div>
      </header>

      <main
        className="flex-1 min-h-0 overflow-y-auto flex flex-col items-center justify-center px-8 py-8 text-center"
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

      <footer className="shrink-0 flex justify-center px-6 py-4 border-t border-ink-100 bg-white dark:bg-ink-700 dark:border-ink-600">
        <button
          type="button"
          onClick={handleScan}
          disabled={scanning}
          className={
            'mx-auto ' +
            'inline-flex items-center gap-2.5 px-8 py-3.5 rounded-card border-2 ' +
            'font-display text-xs font-bold uppercase tracking-industrial shadow-card-hover transition-all ' +
            (scanning
              ? 'bg-ink-50 border-ink-100 text-ink-400 cursor-not-allowed dark:bg-ink-600 dark:border-ink-500'
              : 'bg-rfid border-rfid text-white hover:bg-blue-700 dark:hover:bg-blue-600')
          }
        >
          <IconScan size={17} color={scanning ? '#5C6878' : '#fff'} />
          {scanning ? 'Escaneando...' : 'Simular RFID'}
        </button>
      </footer>
    </div>
  );
}

function WaitingState() {
  return (
    <div className="flex flex-col items-center justify-center gap-5">
      <div className="w-28 h-28 rounded-full flex items-center justify-center bg-white border border-ink-100 dark:bg-ink-700 dark:border-ink-600">
        <IconScan size={48} color="#1E40AF" />
      </div>
      <div>
        <p className="font-display text-5xl font-black text-ink-700 dark:text-white">
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
    <div className="w-full flex flex-col items-center gap-5 animate-[fadeIn_.25s_ease]">
      <div
        className={
          'w-[min(30vh,260px)] h-[min(30vh,260px)] rounded-full flex items-center justify-center border-[8px] shadow-card-hover shrink-0 ' +
          (shouldPick
            ? 'bg-flow-bg border-flow text-flow dark:bg-flow/20 dark:border-flow-ring dark:text-flow-ring'
            : 'bg-ink-100 border-ink-300 text-ink-500 dark:bg-ink-700 dark:border-ink-500 dark:text-ink-300')
        }
      >
        {shouldPick ? (
          <IconCheck size={92} color="currentColor" />
        ) : (
          <IconX size={92} color="currentColor" />
        )}
      </div>

      <div>
        <p
          className={
            'font-display text-[clamp(48px,8vw,96px)] leading-none font-black uppercase ' +
            (shouldPick
              ? 'text-flow dark:text-flow-ring'
              : 'text-ink-500 dark:text-ink-300')
          }
        >
          {shouldPick ? 'Agarrar' : 'No agarrar'}
        </p>

        <p className="mt-5 text-lg font-display font-bold text-ink-700 dark:text-white">
          {shouldPick
            ? `Bahia ${selectedBay} · Caja ${cajaId}`
            : `Destino: Bahia ${current.correctBay} · Caja ${current.cajaDestino}`}
        </p>

        <div className="mt-5 inline-flex items-center gap-4 px-5 py-3 rounded-card border border-ink-100 bg-white dark:bg-ink-700 dark:border-ink-600">
          <SmallValue label="RFID" value={`...${current.epc?.slice(-6) || '---'}`} color="#1E40AF" />
          <div className="w-px h-8 bg-ink-100 dark:bg-ink-600" />
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
