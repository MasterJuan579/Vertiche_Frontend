import { useEffect, useState } from 'react';
import { BAY_COLORS } from '../data/demoData.js';
import { connectRealtime } from '../api/rfid.js';
import { IconScan, IconSigma, IconBolt } from '../components/Icons.jsx';

function fmtTime(ts) {
  const d = new Date(ts);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
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

export function CajaSorterScreen() {
  const [current, setCurrent] = useState(null);
  const [history, setHistory] = useState([]);
  const [connected, setConnected] = useState(false);

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
        setHistory((prev) => [scan, ...prev].slice(0, 18));
      },
    }).then((s) => { socket = s; }).catch(() => setConnected(false));
    return () => {
      cancelled = true;
      if (socket) socket.disconnect();
    };
  }, []);

  const bayColor = current
    ? BAY_COLORS[current.bahiaActual] || '#6b7280'
    : '#6b7280';

  return (
    <div className="grid grid-rows-[auto_1fr_auto] h-[calc(100vh-0px)] overflow-hidden">
      <header className="flex flex-wrap items-center gap-3 px-4 sm:px-6 py-3 min-h-14 border-b border-ink-100 shrink-0 bg-white dark:bg-ink-700 dark:border-ink-600">
        <div className="flex-1 min-w-0">
          <div className="font-display text-sm font-semibold text-ink-700 dark:text-ink-100">
            Arco RFID post-sorter - Bahia a Caja
          </div>
          <div className="font-mono text-[10px] uppercase tracking-industrial text-ink-400 truncate">
            El backend recibe el EPC y resuelve la caja destino
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-5">
          <Metric icon={<IconSigma size={14} color="currentColor" />} colorCls="text-flow dark:text-flow-ring">
            <span className="font-mono text-base font-bold leading-none">{history.length}</span>
            <span className="font-mono text-[8px] uppercase tracking-industrial text-ink-400 block mt-0.5">Escaneados</span>
          </Metric>

          <Metric icon={<IconBolt size={14} color="currentColor" />} colorCls="text-rfid dark:text-blue-300">
            <span className="font-mono text-base font-bold leading-none">{connected ? 'Live' : 'Off'}</span>
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
        En Bahia {current.bahiaActual}, llevar a
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
          Bahia {current.bahiaActual} - {current.tienda?.nombre || 'Sin tienda'}
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
          const bayColor = BAY_COLORS[scan.bahiaActual] || '#6b7280';
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
                  Bahia {scan.bahiaActual} - Caja {scan.cajaDestino}
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
