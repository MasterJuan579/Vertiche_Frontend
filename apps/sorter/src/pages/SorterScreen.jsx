import { useEffect, useRef, useState } from 'react';
import { BAY_COLORS } from '../data/demoData.js';
import { connectRealtime } from '../api/rfid.js';
import { PrepackDetailBar } from '../components/PrepackDetailBar.jsx';
import { ScanHistory } from '../components/ScanHistory.jsx';
import {
  IconAntenna,
  IconScan,
  IconBolt,
  IconSigma,
  IconWarning,
  IconArrow,
} from '../components/Icons.jsx';

function parseBahia(s) {
  if (!s) return null;
  const m = String(s).match(/(\d+)\s*$/);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return Number.isFinite(n) && n >= 1 ? n : null;
}

function lecturaToPrepack(payload) {
  const tag = payload.tag || {};
  const actualBay = parseBahia(payload.bahia);
  const correctBay = parseBahia(tag.tienda?.bahia_asignada) || actualBay || 1;
  const bayNumber = actualBay || correctBay;
  const cantidad = tag.cantidad_piezas || 1;

  return {
    id: `${payload.id || payload.epc}-${payload.timestamp || Date.now()}`,
    epc: payload.epc,
    scannedAt: payload.timestamp ? new Date(payload.timestamp).getTime() : Date.now(),
    bayNumber,
    correctBay,
    cajaDestino: null,
    isMisrouted: !!actualBay && actualBay !== correctBay,
    orden_id: tag.orden_id || null,
    producto: tag.producto || tag.sku || 'Prepack RFID',
    proveedor: tag.proveedor?.nombre || null,
    tienda: tag.tienda || tag.Tienda || null,
    color: tag.color || null,
    talla: tag.talla || null,
    cantidad_piezas: cantidad,
    prendas: [{ color: tag.color || 'N/D', talla: tag.talla || 'N/D', cantidad }],
    qa_fallido: tag.qa_fallido || false,
    tipo_flujo: tag.tipo_flujo || 'CROSS_DOCK',
  };
}

export function SorterScreen() {
  const [current, setCurrent] = useState(null);
  const [history, setHistory] = useState([]);
  const [scanRate, setScanRate] = useState(0);
  const [totalScanned, setTotalScanned] = useState(0);
  const [selected, setSelected] = useState(null);
  const [connected, setConnected] = useState(false);

  const scanTimesRef = useRef([]);

  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now();
      scanTimesRef.current = scanTimesRef.current.filter((t) => now - t < 60000);
      setScanRate(scanTimesRef.current.length);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let socket;
    let cancelled = false;
    connectRealtime({
      connect: () => { if (!cancelled) setConnected(true); },
      disconnect: () => { if (!cancelled) setConnected(false); },
      lectura: (payload) => {
        if (cancelled || !payload?.epc) return;
        const etapa = String(payload.etapa || '').toUpperCase();
        if (etapa && etapa !== 'SORTING') return;
        const scan = lecturaToPrepack(payload);
        scanTimesRef.current.push(Date.now());
        setTotalScanned((p) => p + 1);
        setCurrent(scan);
        setSelected(scan);
        setHistory((prev) => [scan, ...prev].slice(0, 20));
      },
    }).then((s) => { socket = s; }).catch(() => setConnected(false));
    return () => {
      cancelled = true;
      if (socket) socket.disconnect();
    };
  }, []);

  const bayColor = current
    ? BAY_COLORS[current.bayNumber] || '#6b7280'
    : '#6b7280';
  const correctBayColor = current
    ? BAY_COLORS[current.correctBay] || '#4caf50'
    : '#4caf50';

  return (
    <div className="grid grid-rows-[auto_1fr] h-[calc(100vh-0px)] overflow-hidden">
      <header className="flex items-center px-6 h-14 border-b border-ink-100 shrink-0 bg-white dark:bg-ink-700 dark:border-ink-600">
        <div className="flex-1 font-display text-sm font-semibold text-ink-700 dark:text-ink-100">
          Sorter existente - Prepack a Bahia
        </div>

        <div className="flex items-center gap-5">
          <Metric icon={<IconSigma size={14} color="currentColor" />} colorCls="text-flow dark:text-flow-ring">
            <span className="font-mono text-base font-bold leading-none">{totalScanned}</span>
            <span className="font-mono text-[8px] uppercase tracking-industrial text-ink-400 block mt-0.5">Escaneados</span>
          </Metric>

          <Metric icon={<IconBolt size={14} color="currentColor" />} colorCls="text-rfid dark:text-blue-300">
            <span className="font-mono text-base font-bold leading-none inline-block">
              {scanRate}
            </span>
            <span className="font-mono text-[8px] uppercase tracking-industrial text-ink-400 block mt-0.5">PQ/Min</span>
          </Metric>

          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-flow-ring animate-[blink_1.5s_ease-in-out_infinite]" />
            <span className="font-mono text-[10px] uppercase tracking-industrial text-flow dark:text-flow-ring">
              {connected ? 'Activo' : 'Conectando'}
            </span>
          </div>
        </div>
      </header>

      <div className="flex overflow-hidden min-h-0">
        <div className="flex-1 flex flex-col overflow-hidden relative min-w-0">
          {!current ? (
            <EmptyState />
          ) : current.isMisrouted ? (
            <MisroutedView
              current={current}
              selected={selected}
              bayColor={bayColor}
              correctBayColor={correctBayColor}
            />
          ) : (
            <NormalView
              current={current}
              selected={selected}
              bayColor={bayColor}
            />
          )}

          <button
            disabled
            className={
              'absolute bottom-5 left-1/2 -translate-x-1/2 z-10 ' +
              'inline-flex items-center gap-2.5 px-8 py-3.5 rounded-card border-2 ' +
              'font-display text-xs font-bold uppercase tracking-industrial ' +
              'shadow-card-hover transition-all ' +
              'bg-ink-50 border-ink-100 text-ink-400 cursor-not-allowed dark:bg-ink-600 dark:border-ink-500'
            }
          >
            <IconScan size={17} color="#5C6878" />
            Esperando RFID real
          </button>
        </div>

        <ScanHistory
          history={history}
          total={totalScanned}
          onClickItem={(item) => setSelected(item)}
        />
      </div>
    </div>
  );
}

function Metric({ icon, colorCls, children }) {
  return (
    <div className={'flex items-center gap-1.5 ' + colorCls}>
      <span className="shrink-0">{icon}</span>
      <div className="text-right leading-none">
        {children}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 bg-ink-50 dark:bg-ink-900">
      <div className="w-[90px] h-[90px] rounded-full flex items-center justify-center bg-white border border-ink-100 dark:bg-ink-700 dark:border-ink-600">
        <IconAntenna size={40} color="#1E40AF" />
      </div>
      <p className="font-mono text-sm text-ink-500 dark:text-ink-300">
        Esperando escaneo
      </p>
      <p className="text-[11px] text-ink-400">
        El sorter fisico debe mandar POST /rfid/lectura
      </p>
    </div>
  );
}

function NormalView({ current, selected, bayColor }) {
  return (
    <div
      className="flex-1 flex flex-col items-center gap-4 px-6 pt-4 pb-24 overflow-auto animate-[fadeIn_.4s_ease] bg-ink-50 dark:bg-ink-900"
      style={{
        backgroundImage: `radial-gradient(ellipse at top, ${bayColor}1c 0%, transparent 55%)`,
      }}
    >
      <p className="font-mono text-xs uppercase tracking-industrial text-ink-400 mt-1">
        Llevar a
      </p>

      <div
        className="flex items-center justify-center rounded-full font-mono font-bold animate-[glow-bay_2.4s_ease-in-out_infinite] shrink-0"
        style={{
          width: 'min(26vh, 225px)',
          height: 'min(26vh, 225px)',
          border: `4px solid ${bayColor}`,
          color: bayColor,
          fontSize: 'min(14vh, 120px)',
        }}
      >
        {current.bayNumber}
      </div>

      <div className="text-center">
        <p className="text-base font-display font-bold text-ink-700 dark:text-ink-100">
          Bahia {current.bayNumber}
        </p>
        <p className="text-[12px] text-ink-400 mt-0.5">
          {current.tienda?.nombre} {current.tienda?.ciudad ? `- ${current.tienda.ciudad}` : ''}
        </p>
      </div>

      <QuickInfo current={current} bayColor={bayColor} />

      <div className="w-full flex justify-center">
        <PrepackDetailBar prepack={selected} />
      </div>
    </div>
  );
}

function MisroutedView({ current, selected, correctBayColor }) {
  return (
    <div
      className="flex-1 flex flex-col items-center gap-3 px-6 pt-4 pb-24 overflow-auto animate-[fadeIn_.4s_ease] bg-ink-50 dark:bg-ink-900"
      style={{
        backgroundImage:
          'radial-gradient(ellipse at top, rgba(239,68,68,0.22) 0%, rgba(239,68,68,0.05) 40%, transparent 70%)',
      }}
    >
      <div className="flex items-center gap-3.5 mt-2 animate-[blink_1.4s_ease-in-out_infinite]">
        <IconWarning size={26} color="#ef4444" />
        <p className="font-mono text-base font-extrabold tracking-[0.3em] uppercase text-anomaly dark:text-anomaly-ring">
          Error de Sorter
        </p>
        <IconWarning size={26} color="#ef4444" />
      </div>

      <div className="flex items-center gap-[min(5vh,40px)] mt-1">
        <div className="flex flex-col items-center gap-2">
          <div className="font-mono text-[10px] uppercase tracking-[2px] font-bold text-anomaly dark:text-anomaly-ring">
            Esta en
          </div>
          <div
            className="flex items-center justify-center rounded-full font-mono font-bold line-through opacity-55 shrink-0"
            style={{
              width: 'min(22vh, 180px)',
              height: 'min(22vh, 180px)',
              border: '3px solid #ef4444',
              color: '#ef4444',
              fontSize: 'min(12vh, 100px)',
            }}
          >
            {current.bayNumber}
          </div>
        </div>

        <div className="animate-[blink_1s_ease-in-out_infinite] shrink-0">
          <IconArrow size={60} color="#ef4444" />
        </div>

        <div className="flex flex-col items-center gap-2">
          <div
            className="font-mono text-[10px] uppercase tracking-[2px] font-bold"
            style={{ color: correctBayColor }}
          >
            Llevar a
          </div>
          <div
            className="flex items-center justify-center rounded-full font-mono font-bold animate-[glow-bay_2.4s_ease-in-out_infinite] shrink-0"
            style={{
              width: 'min(26vh, 225px)',
              height: 'min(26vh, 225px)',
              border: `4px solid ${correctBayColor}`,
              color: correctBayColor,
              fontSize: 'min(14vh, 120px)',
            }}
          >
            {current.correctBay}
          </div>
        </div>
      </div>

      <div className="text-center mt-1">
        <p className="text-lg font-display font-extrabold text-ink-700 dark:text-white leading-tight">
          Redirigir a <span style={{ color: correctBayColor }}>Bahia {current.correctBay}</span>
        </p>
        <p className="text-[13px] text-ink-500 dark:text-ink-300 mt-1">
          {current.tienda?.nombre} {current.tienda?.ciudad ? `- ${current.tienda.ciudad}` : ''}
        </p>
      </div>

      <QuickInfo current={current} bayColor={correctBayColor} compact />

      <div className="w-full flex justify-center" style={{ transform: 'scale(0.78)', transformOrigin: 'top center', opacity: 0.9 }}>
        <PrepackDetailBar prepack={selected} />
      </div>
    </div>
  );
}

function QuickInfo({ current, bayColor, compact = false }) {
  const sizeCls = compact ? 'gap-3 px-3.5 py-1.5' : 'gap-4 px-4 py-2.5';
  const labelCls = compact
    ? 'font-mono text-[8px] uppercase tracking-industrial text-ink-400'
    : 'font-mono text-[9px] uppercase tracking-industrial text-ink-400';
  const valueCls = compact ? 'text-[10px] mt-0.5' : 'text-xs mt-0.5';

  return (
    <div className={'flex items-stretch ' + sizeCls + ' rounded-card border bg-white border-ink-100 dark:bg-ink-700 dark:border-ink-600'}>
      <div>
        <div className={labelCls}>RFID</div>
        <div className={'font-mono font-bold text-rfid dark:text-blue-300 ' + valueCls}>
          ...{current.epc?.slice(-6)}
        </div>
      </div>
      <div className="w-px bg-ink-100 dark:bg-ink-600 mx-1" />
      <div>
        <div className={labelCls}>Producto</div>
        <div className={'font-semibold text-ink-700 dark:text-ink-100 truncate max-w-[180px] ' + valueCls}>
          {current.producto}
        </div>
      </div>
      <div className="w-px bg-ink-100 dark:bg-ink-600 mx-1" />
      <div>
        <div className={labelCls}>Orden</div>
        <div className={'font-mono font-bold ' + valueCls} style={{ color: bayColor }}>
          {current.orden_id || '---'}
        </div>
      </div>
    </div>
  );
}
