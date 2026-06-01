import { useCallback, useState } from 'react';
import {
  BAY_COLORS,
  DEMO_BAY_ID,
  getPrepacksForDemoBay,
} from '../data/demoData.js';
import { IconScan, IconSigma, IconBolt } from '../components/Icons.jsx';

function fmtTime(ts) {
  const d = new Date(ts);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function CajaSorterScreen() {
  const demoPrepacks = getPrepacksForDemoBay();
  const [current, setCurrent] = useState(null);
  const [history, setHistory] = useState([]);
  const [cursor, setCursor] = useState(0);
  const [scanning, setScanning] = useState(false);

  const handleScan = useCallback(() => {
    if (scanning) return;
    setScanning(true);
    const prepack = demoPrepacks[cursor % demoPrepacks.length];
    const scan = {
      ...prepack,
      id: `${prepack.epc}-${Date.now()}`,
      scannedAt: Date.now(),
    };
    setCurrent(scan);
    setHistory((prev) => [scan, ...prev].slice(0, 18));
    setCursor((c) => c + 1);
    setTimeout(() => setScanning(false), 300);
  }, [cursor, demoPrepacks, scanning]);

  const bayColor = current
    ? BAY_COLORS[current.correctBay] || '#6b7280'
    : '#6b7280';

  return (
    <div className="grid grid-rows-[auto_1fr_auto] h-[calc(100vh-0px)] overflow-hidden">
      <header className="flex flex-wrap items-center gap-3 px-4 sm:px-6 py-3 min-h-14 border-b border-ink-100 shrink-0 bg-white dark:bg-ink-700 dark:border-ink-600">
        <div className="flex-1 min-w-0">
          <div className="font-display text-sm font-semibold text-ink-700 dark:text-ink-100">
            Arco RFID post-sorter - Bahia {DEMO_BAY_ID} a Caja
          </div>
          <div className="font-mono text-[10px] uppercase tracking-industrial text-ink-400 truncate">
            Demo fija: el prepack ya cayo en Bahia {DEMO_BAY_ID}; este arco decide la caja
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-5">
          <Metric icon={<IconSigma size={14} color="currentColor" />} colorCls="text-flow dark:text-flow-ring">
            <span className="font-mono text-base font-bold leading-none">{history.length}</span>
            <span className="font-mono text-[8px] uppercase tracking-industrial text-ink-400 block mt-0.5">Escaneados</span>
          </Metric>

          <Metric icon={<IconBolt size={14} color="currentColor" />} colorCls="text-rfid dark:text-blue-300">
            <span className="font-mono text-base font-bold leading-none">Demo</span>
            <span className="font-mono text-[8px] uppercase tracking-industrial text-ink-400 block mt-0.5">RFID</span>
          </Metric>

          <div className="hidden sm:flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-flow-ring animate-pulse" />
            <span className="font-mono text-[10px] uppercase tracking-industrial text-flow dark:text-flow-ring">
              En vivo
            </span>
          </div>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row overflow-hidden min-h-0">
        <main
          className="flex-1 min-h-0 overflow-y-auto flex flex-col items-center justify-start sm:justify-center gap-5 sm:gap-7 px-4 sm:px-8 py-5 sm:py-8 bg-ink-50 dark:bg-ink-900"
          style={{
            backgroundImage: current
              ? `radial-gradient(ellipse at top, ${bayColor}24 0%, transparent 60%)`
              : 'none',
          }}
        >
          {!current ? (
            <EmptyState />
          ) : (
            <CurrentCaja current={current} bayColor={bayColor} />
          )}
        </main>

        <CajaHistory history={history} />
      </div>

      <footer className="shrink-0 flex justify-center px-4 sm:px-6 py-3 sm:py-4 border-t border-ink-100 bg-white dark:bg-ink-700 dark:border-ink-600">
        <button
          type="button"
          onClick={handleScan}
          disabled={scanning}
          className={
            'w-full sm:w-auto justify-center ' +
            'inline-flex items-center gap-2.5 px-6 sm:px-8 py-3 sm:py-3.5 rounded-card border-2 ' +
            'font-display text-xs font-bold uppercase tracking-industrial shadow-card-hover transition-all ' +
            (scanning
              ? 'bg-ink-50 border-ink-100 text-ink-400 cursor-not-allowed dark:bg-ink-600 dark:border-ink-500'
              : 'bg-rfid border-rfid text-white hover:bg-blue-700 dark:hover:bg-blue-600')
          }
        >
          <IconScan size={17} color={scanning ? '#5C6878' : '#fff'} />
          {scanning ? 'Escaneando...' : 'Escaneo arco RFID'}
        </button>
      </footer>
    </div>
  );
}

function Metric({ icon, colorCls, children }) {
  return (
    <div className={'flex items-center gap-1.5 ' + colorCls}>
      <span className="shrink-0">{icon}</span>
      <div className="text-right leading-none">{children}</div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center text-center gap-4">
      <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full flex items-center justify-center bg-white border border-ink-100 dark:bg-ink-700 dark:border-ink-600">
        <IconScan size={40} color="#1E40AF" />
      </div>
      <div>
        <p className="font-display text-[clamp(30px,8vw,36px)] font-black text-ink-700 dark:text-white">
          Esperando arco RFID
        </p>
        <p className="mt-2 font-mono text-xs uppercase tracking-industrial text-ink-400">
          Post-sorter: asignacion a caja
        </p>
      </div>
    </div>
  );
}

function CurrentCaja({ current, bayColor }) {
  return (
    <div className="w-full flex flex-col items-center gap-5 sm:gap-7 animate-[fadeIn_.3s_ease]">
      <p className="font-mono text-xs uppercase tracking-industrial text-ink-400">
        En Bahia {current.correctBay}, llevar a
      </p>

      <div
        className="flex items-center justify-center rounded-full font-mono font-black animate-[glow-bay_2.4s_ease-in-out_infinite] shrink-0"
        style={{
          width: 'min(30vh, 280px)',
          height: 'min(30vh, 280px)',
          border: `8px solid ${bayColor}`,
          color: bayColor,
          fontSize: 'min(10vh, 96px)',
        }}
      >
        C{current.cajaDestino}
      </div>

      <div className="text-center">
        <p className="font-display text-2xl sm:text-3xl font-black text-ink-700 dark:text-white">
          Caja {current.cajaDestino}
        </p>
        <p className="mt-2 text-sm text-ink-500 dark:text-ink-300">
          Bahia {current.correctBay} · {current.tienda?.nombre || 'Sin tienda'}
        </p>
      </div>

      <div className="inline-flex flex-wrap justify-center items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3 rounded-card border border-ink-100 bg-white dark:bg-ink-700 dark:border-ink-600 max-w-full">
        <SmallValue label="RFID" value={`...${current.epc?.slice(-6) || '---'}`} color="#1E40AF" />
        <div className="hidden sm:block w-px h-8 bg-ink-100 dark:bg-ink-600" />
        <SmallValue label="Orden" value={current.orden_id || '---'} color={bayColor} />
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

function CajaHistory({ history }) {
  return (
    <aside className="w-full lg:w-72 h-44 lg:h-auto shrink-0 flex flex-col overflow-hidden bg-white border-t lg:border-t-0 lg:border-l border-ink-100 dark:bg-ink-700 dark:border-ink-600">
      <div className="px-4 pt-4 pb-3 border-b border-ink-100 dark:border-ink-600 shrink-0">
        <p className="font-mono text-[10px] uppercase tracking-industrial text-ink-400">
          Historial caja
        </p>
        <p className="mt-0.5 font-mono text-xl font-bold text-rfid dark:text-blue-300">
          {history.length}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {history.length === 0 && (
          <div className="px-4 py-10 text-center text-[11px] text-ink-400">
            Sin escaneos aun
          </div>
        )}

        {history.map((scan) => {
          const bayColor = BAY_COLORS[scan.correctBay] || '#6b7280';
          return (
            <div
              key={scan.id}
              className="flex items-start gap-2.5 px-3 py-2.5 border-b border-ink-100 dark:border-ink-600"
            >
              <div
                className="shrink-0 mt-0.5 w-9 h-9 rounded-md flex items-center justify-center font-mono text-[11px] font-bold text-white"
                style={{ background: bayColor }}
              >
                C{scan.cajaDestino}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px] font-bold text-rfid dark:text-blue-300 truncate">
                    ...{scan.epc?.slice(-6)}
                  </span>
                  <span className="font-mono text-[9px] text-ink-400 shrink-0">
                    {fmtTime(scan.scannedAt)}
                  </span>
                </div>
                <div className="mt-0.5 text-[11px] text-ink-700 dark:text-ink-100 font-medium truncate">
                  Bahia {scan.correctBay} · Caja {scan.cajaDestino}
                </div>
                <div className="mt-0.5 text-[10px] text-ink-400 truncate">
                  {scan.tienda?.nombre || 'Sin tienda'}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
