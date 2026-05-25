import { useState, useEffect, useRef, useCallback } from 'react';
import { DEMO_PREPACKS, BAY_COLORS } from '../data/demoData.js';
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

/**
 * Live scanner view. The bay operator sees one prepack at a time — the one
 * that just passed under the RFID arch. Two visual modes:
 *
 *   - Normal: big colored bay number circle, "Llevar a" label.
 *   - Misrouted (isMisrouted=true): red gradient background, "ERROR DE SORTER"
 *     banner, two bay circles side by side (wrong with strikethrough, correct
 *     with animated glow + arrow between).
 *
 * Without Socket.io, the operator manually cycles through DEMO_PREPACKS using
 * the bottom button. Demo includes 2 misrouted prepacks so the alert state
 * shows up during a normal walkthrough.
 *
 * The "PQ/MIN" rate counter slides over a 60-second window of scan
 * timestamps — gives a live-feel even with manual scanning.
 */
export function SorterScreen() {
  const [current, setCurrent] = useState(null);
  const [history, setHistory] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [scanRate, setScanRate] = useState(0);
  const [totalScanned, setTotalScanned] = useState(0);
  const [selected, setSelected] = useState(null);
  const [cursor, setCursor] = useState(0);

  const scanTimesRef = useRef([]);

  // Rate counter — recompute every second from the rolling 60s window.
  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now();
      scanTimesRef.current = scanTimesRef.current.filter((t) => now - t < 60000);
      setScanRate(scanTimesRef.current.length);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const processScan = useCallback((prepack) => {
    if (!prepack) return;
    const scan = {
      ...prepack,
      id: Date.now(),
      scannedAt: Date.now(),
    };
    scanTimesRef.current.push(Date.now());
    setTotalScanned((p) => p + 1);
    setCurrent(scan);
    setSelected(scan);
    setHistory((prev) => [scan, ...prev].slice(0, 20));
  }, []);

  const handleScan = useCallback(() => {
    if (scanning) return;
    setScanning(true);
    const next = DEMO_PREPACKS[cursor % DEMO_PREPACKS.length];
    processScan(next);
    setCursor((c) => c + 1);
    setTimeout(() => setScanning(false), 300);
  }, [scanning, cursor, processScan]);

  const bayColor = current
    ? BAY_COLORS[current.bayNumber] || '#6b7280'
    : '#6b7280';
  const correctBayColor = current
    ? BAY_COLORS[current.correctBay] || '#4caf50'
    : '#4caf50';

  return (
    <div className="grid grid-rows-[auto_1fr] h-[calc(100vh-0px)] overflow-hidden">

      {/* ───────────────────────── Header ───────────────────────── */}
      <header className={
        'flex items-center px-6 h-14 border-b border-ink-100 shrink-0 ' +
        'bg-white dark:bg-ink-700 dark:border-ink-600'
      }>
        <div className="flex-1 font-display text-sm font-semibold text-ink-700 dark:text-ink-100">
          Sorter — Conveyor Activo
        </div>

        {/* Right cluster: metrics + live indicator */}
        <div className="flex items-center gap-5">
          {/* Total scanned */}
          <Metric icon={<IconSigma size={14} color="currentColor" />} colorCls="text-flow dark:text-flow-ring">
            <span className="font-mono text-base font-bold leading-none">{totalScanned}</span>
            <span className="font-mono text-[8px] uppercase tracking-industrial text-ink-400 block mt-0.5">Escaneados</span>
          </Metric>

          {/* Scan rate */}
          <Metric icon={<IconBolt size={14} color="currentColor" />} colorCls="text-rfid dark:text-blue-300">
            <span
              key={scanRate}
              className="font-mono text-base font-bold leading-none inline-block animate-[pop_.3s_ease]"
            >
              {scanRate}
            </span>
            <span className="font-mono text-[8px] uppercase tracking-industrial text-ink-400 block mt-0.5">PQ/Min</span>
          </Metric>

          {/* Live dot */}
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-flow-ring animate-[blink_1.5s_ease-in-out_infinite]" />
            <span className="font-mono text-[10px] uppercase tracking-industrial text-flow dark:text-flow-ring">
              Activo
            </span>
          </div>
        </div>
      </header>

      {/* ───────────────────────── Body ───────────────────────── */}
      <div className="flex overflow-hidden min-h-0">

        {/* CENTER: bay number + detail + scan button */}
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

          {/* Scan button (absolute, bottom center) */}
          <button
            onClick={handleScan}
            disabled={scanning}
            className={
              'absolute bottom-5 left-1/2 -translate-x-1/2 z-10 ' +
              'inline-flex items-center gap-2.5 px-8 py-3.5 rounded-card border-2 ' +
              'font-display text-xs font-bold uppercase tracking-industrial ' +
              'shadow-card-hover transition-all ' +
              (scanning
                ? 'bg-ink-50 border-ink-100 text-ink-400 cursor-not-allowed dark:bg-ink-600 dark:border-ink-500'
                : 'bg-rfid border-rfid text-white hover:bg-blue-700 dark:hover:bg-blue-600')
            }
          >
            <IconScan size={17} color={scanning ? '#5C6878' : '#fff'} />
            {scanning ? 'Escaneando…' : 'Escaneo RFID'}
          </button>
        </div>

        {/* RIGHT: scan history */}
        <ScanHistory
          history={history}
          total={totalScanned}
          onClickItem={(item) => setSelected(item)}
        />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// HEADER METRIC
// ══════════════════════════════════════════════════════════════════

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

// ══════════════════════════════════════════════════════════════════
// EMPTY STATE
// ══════════════════════════════════════════════════════════════════

function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 bg-ink-50 dark:bg-ink-900">
      <div className={
        'w-[90px] h-[90px] rounded-full flex items-center justify-center ' +
        'bg-white border border-ink-100 ' +
        'dark:bg-ink-700 dark:border-ink-600'
      }>
        <IconAntenna size={40} color="#1E40AF" />
      </div>
      <p className="font-mono text-sm text-ink-500 dark:text-ink-300">
        Esperando escaneo
      </p>
      <p className="text-[11px] text-ink-400">
        Acerque la etiqueta RFID al lector
      </p>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// NORMAL VIEW — prepack scanned, correct bay
// ══════════════════════════════════════════════════════════════════

function NormalView({ current, selected, bayColor }) {
  return (
    <div
      className="flex-1 flex flex-col items-center gap-4 px-6 pt-4 pb-24 overflow-auto animate-[fadeIn_.4s_ease] bg-ink-50 dark:bg-ink-900"
      style={{
        backgroundImage: `radial-gradient(ellipse at top, ${bayColor}1c 0%, transparent 55%)`,
      }}
    >
      {/* "Llevar a" label */}
      <p className="font-mono text-xs uppercase tracking-industrial text-ink-400 mt-1">
        Llevar a
      </p>

      {/* Big bay circle */}
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

      {/* Store identity */}
      <div className="text-center">
        <p className="text-base font-display font-bold text-ink-700 dark:text-ink-100">
          Bahía {current.bayNumber}
        </p>
        <p className="text-[12px] text-ink-400 mt-0.5">
          {current.tienda?.nombre} · {current.tienda?.ciudad}
        </p>
      </div>

      {/* Quick info pills */}
      <QuickInfo current={current} bayColor={bayColor} />

      {/* Full detail bar */}
      <div className="w-full flex justify-center">
        <PrepackDetailBar prepack={selected} />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// MISROUTED VIEW — the dramatic alert state
// ══════════════════════════════════════════════════════════════════

function MisroutedView({ current, selected, bayColor, correctBayColor }) {
  return (
    <div
      className="flex-1 flex flex-col items-center gap-3 px-6 pt-4 pb-24 overflow-auto animate-[fadeIn_.4s_ease] bg-ink-50 dark:bg-ink-900"
      style={{
        backgroundImage:
          'radial-gradient(ellipse at top, rgba(239,68,68,0.22) 0%, rgba(239,68,68,0.05) 40%, transparent 70%)',
      }}
    >
      {/* "ERROR DE SORTER" banner */}
      <div className="flex items-center gap-3.5 mt-2 animate-[blink_1.4s_ease-in-out_infinite]">
        <IconWarning size={26} color="#ef4444" />
        <p className="font-mono text-base font-extrabold tracking-[0.3em] uppercase text-anomaly dark:text-anomaly-ring">
          Error de Sorter
        </p>
        <IconWarning size={26} color="#ef4444" />
      </div>

      {/* Two bay circles side by side */}
      <div className="flex items-center gap-[min(5vh,40px)] mt-1">
        {/* Wrong bay — struck through */}
        <div className="flex flex-col items-center gap-2">
          <div className="font-mono text-[10px] uppercase tracking-[2px] font-bold text-anomaly dark:text-anomaly-ring">
            Está en
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

        {/* Animated arrow */}
        <div className="animate-[blink_1s_ease-in-out_infinite] shrink-0">
          <IconArrow size={60} color="#ef4444" />
        </div>

        {/* Correct bay — animated glow */}
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

      {/* Redirect message */}
      <div className="text-center mt-1">
        <p className="text-lg font-display font-extrabold text-ink-700 dark:text-white leading-tight">
          Redirigir a{' '}
          <span style={{ color: correctBayColor }}>
            Bahía {current.correctBay}
          </span>
        </p>
        <p className="text-[13px] text-ink-500 dark:text-ink-300 mt-1">
          {current.tienda?.nombre} · {current.tienda?.ciudad}
        </p>
      </div>

      {/* Compact quick info */}
      <QuickInfo current={current} bayColor={correctBayColor} compact />

      {/* Detail bar — shrunk per original spec */}
      <div className="w-full flex justify-center" style={{ transform: 'scale(0.78)', transformOrigin: 'top center', opacity: 0.9 }}>
        <PrepackDetailBar prepack={selected} />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// QUICK INFO — 3 pills: RFID, Product, Order
// ══════════════════════════════════════════════════════════════════

function QuickInfo({ current, bayColor, compact = false }) {
  const sizeCls = compact ? 'gap-3 px-3.5 py-1.5' : 'gap-4 px-4 py-2.5';
  const labelCls = compact
    ? 'font-mono text-[8px] uppercase tracking-industrial text-ink-400'
    : 'font-mono text-[9px] uppercase tracking-industrial text-ink-400';
  const valueCls = compact ? 'text-[10px] mt-0.5' : 'text-xs mt-0.5';

  return (
    <div className={
      'flex items-stretch ' + sizeCls + ' ' +
      'rounded-card border ' +
      'bg-white border-ink-100 ' +
      'dark:bg-ink-700 dark:border-ink-600'
    }>
      <div>
        <div className={labelCls}>RFID</div>
        <div className={'font-mono font-bold text-rfid dark:text-blue-300 ' + valueCls}>
          ···{current.epc?.slice(-6)}
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
        <div
          className={'font-mono font-bold ' + valueCls}
          style={{ color: bayColor }}
        >
          {current.orden_id}
        </div>
      </div>
    </div>
  );
}
