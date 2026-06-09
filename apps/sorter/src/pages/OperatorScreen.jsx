import { Navigate, useParams } from 'react-router-dom';
import { BAY_COLORS, BAY_COUNT, CAJA_COUNT } from '../data/demoData.js';
import { IconScan, IconCheck, IconX } from '../components/Icons.jsx';

export function OperatorScreen({ realtime }) {
  const { id } = useParams();
  const rawCajaId = id || '';
  const routeBay = /bahia/i.test(rawCajaId) ? parseBayNumber(rawCajaId) : null;
  const cajaId = parseCajaNumber(rawCajaId);
  const validCaja =
    Number.isFinite(cajaId) && cajaId >= 1 && cajaId <= CAJA_COUNT;
  const selectedBay = routeBay || 1;

  const current = realtime.caja.current;
  const liveStatus = realtime.liveStatus;
  const totalMine = realtime.caja.history.filter((scan) => {
    const scanBay = scan.correctBay || scan.bahiaActual;
    return scanBay === selectedBay && scan.cajaDestino === cajaId;
  }).length;

  if (!validCaja) {
    return <Navigate to="/sorter/caja/1" replace />;
  }

  const currentBay = current?.correctBay || current?.bahiaActual;
  const shouldPick =
    (!!current?.caja_id && current.caja_id === rawCajaId) ||
    (currentBay === selectedBay && current?.cajaDestino === cajaId);
  const displayBay = current?.correctBay || selectedBay;
  const bayColor = BAY_COLORS[displayBay] || '#6b7280';
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
            {liveStatus === 'live'
              ? `Lecturas del arco en vivo · ${totalMine} tomado${totalMine !== 1 ? 's' : ''}`
              : `Caja ${cajaId} lista · ${totalMine} tomado${totalMine !== 1 ? 's' : ''}`}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className={
              'w-2 h-2 rounded-full animate-pulse ' +
              (liveStatus === 'live' ? 'bg-flow-ring' : 'bg-attention')
            }
          />
          <span
            className={
              'font-mono text-[10px] uppercase tracking-industrial ' +
              (liveStatus === 'live'
                ? 'text-flow dark:text-flow-ring'
                : 'text-attention dark:text-attention-ring')
            }
          >
            {liveStatus === 'live' ? 'RFID live' : liveStatus === 'demo' ? 'RFID demo' : 'Conectando'}
          </span>
        </div>
      </header>

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
            key={current.scanId}
            current={current}
            shouldPick={shouldPick}
            selectedBay={displayBay}
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

function parseBayNumber(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return null;
  const match = value.match(/BAHIA-(\d+)|\b(\d+)\b/i);
  if (!match) return null;
  const n = Number(match[1] || match[2]);
  return Number.isFinite(n) && n >= 1 && n <= BAY_COUNT ? n : null;
}

function parseCajaNumber(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return null;
  const cajaMatch = value.match(/CAJA-(\d+)/i);
  if (cajaMatch) return Number(cajaMatch[1]);
  const compactMatch = value.match(/\bC(\d+)\b/i);
  if (compactMatch) return Number(compactMatch[1]);
  const numberMatch = value.match(/\b(\d+)\b/);
  if (!numberMatch) return null;
  const n = Number(numberMatch[1]);
  return Number.isFinite(n) ? n : null;
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
  const isDuplicate = current.isDuplicatePrepack;

  return (
    <div className="w-full flex flex-col items-center gap-4 sm:gap-5 animate-[fadeIn_.25s_ease]">
      <div
        className={
          'flex flex-wrap items-center justify-center gap-x-4 gap-y-1 px-5 py-2.5 rounded-card border-2 bg-white shadow-card dark:bg-ink-700 ' +
          (isDuplicate
            ? 'border-anomaly dark:border-anomaly-ring'
            : shouldPick
            ? 'border-flow dark:border-flow-ring'
            : 'border-ink-300 dark:border-ink-500')
        }
      >
        <span
          className={
            'font-display text-base font-black uppercase tracking-industrial ' +
            (isDuplicate
              ? 'text-anomaly dark:text-anomaly-ring'
              : shouldPick
              ? 'text-flow dark:text-flow-ring'
              : 'text-ink-600 dark:text-ink-200')
          }
        >
          {isDuplicate
            ? 'Ya escaneado - escanee otro'
            : `Nueva carga #${String(current.loadNumber || 1).padStart(3, '0')}`}
        </span>
        <span className="font-mono text-xs font-bold text-rfid dark:text-blue-300">
          EPC: ...{current.epc?.slice(-6) || '---'}
        </span>
      </div>

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
