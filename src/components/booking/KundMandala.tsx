'use client';

import KundIllustration from './KundIllustration';
import { Mandala } from '@/components/ui/Ornaments';
import { classNames } from '@/lib/utils';
import { paletteForSession } from '@/lib/dayColors';
import { SessionIcon } from '@/components/ui/SessionIcon';

interface PositionView { id: string; label: 'A' | 'B' | 'C'; state: 'FREE' | 'HELD' | 'BOOKED' | 'BLOCKED'; }
interface KundView { id: string; number: number; positions: PositionView[]; fullyFree: boolean; }
interface Availability {
  sessionId: string; date: string; startTime: string;
  remaining: number; capacity: number; kunds: KundView[];
}

interface Props {
  availability: Availability;
  bookingType: 'SINGLE_POSITION' | 'FULL_KUND';
  selectedKund: number | null;
  selectedPositions: ('A' | 'B' | 'C')[];
  dateLabel: string;
  timeLabel: string;
  startTime: string;
  yagnaTitle: string;
  onSelect: (kund: number, positions: ('A' | 'B' | 'C')[]) => void;
}

export default function KundMandala({
  availability,
  bookingType,
  selectedKund,
  selectedPositions,
  dateLabel,
  timeLabel,
  startTime,
  yagnaTitle,
  onSelect
}: Props) {
  const sorted = [...availability.kunds].sort((a, b) => a.number - b.number);
  const center = sorted.find((k) => k.number === 1);
  const outer = sorted.filter((k) => k.number !== 1);
  const session = paletteForSession(startTime);

  return (
    <div>
      {/* Header: yagna + date + time */}
      <div className="text-center pb-6">
        <p className="eyebrow justify-center mb-2">{yagnaTitle}</p>
        <h3 className="h-display text-2xl md:text-3xl text-maroon-800">{dateLabel}</h3>
        <div className={classNames(
          'inline-flex items-center gap-2 mt-3 px-4 py-1.5 rounded-full border-2',
          session.bg, session.border, session.accentText
        )}>
          <SessionIcon kind={session.icon} className="w-5 h-5" />
          <span className="text-sm font-semibold uppercase tracking-widest">{session.label}</span>
          <span className="h-display text-lg">{timeLabel}</span>
        </div>
        <p className="text-sm text-maroon-900/85 mt-1">
          {availability.remaining} of {availability.capacity} seats remain
          {bookingType === 'FULL_KUND' ? ' · choose a Kund with all positions free' : ' · click any free position (A · B · C)'}
        </p>
      </div>

      <Legend />

      {/* Mandala */}
      <div className="relative mx-auto mt-6" style={{ maxWidth: 680 }}>
        {/* Slow-spinning ornamental background */}
        <Mandala className="absolute inset-0 w-full h-full text-gold-400 opacity-25 animate-slow-spin pointer-events-none" />

        {/* Outer guide ring */}
        <svg viewBox="0 0 600 600" className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true">
          <circle cx="300" cy="300" r="240" fill="none" stroke="#B98724" strokeWidth="0.6" strokeDasharray="2 4" opacity="0.45" />
          <circle cx="300" cy="300" r="170" fill="none" stroke="#B98724" strokeWidth="0.5" opacity="0.35" />
          {/* Connecting spokes */}
          {Array.from({ length: 10 }).map((_, i) => {
            const a = (i * 360) / 10 - 90;
            const rad = (a * Math.PI) / 180;
            const x1 = 300 + 95 * Math.cos(rad);
            const y1 = 300 + 95 * Math.sin(rad);
            const x2 = 300 + 200 * Math.cos(rad);
            const y2 = 300 + 200 * Math.sin(rad);
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#B98724" strokeWidth="0.4" opacity="0.3" />;
          })}
        </svg>

        {/* Layout container with circular positions */}
        <div className="relative w-full" style={{ aspectRatio: '1 / 1' }}>
          {/* Center Kund (#1) */}
          {center && (
            <div className="absolute" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
              <KundIllustration
                number={center.number}
                positions={center.positions.map((p) => ({ label: p.label, state: p.state }))}
                fullyFree={center.fullyFree}
                selected={selectedKund === center.number}
                selectedPositions={selectedKund === center.number ? selectedPositions : []}
                bookingType={bookingType}
                onKundClick={() => onSelect(center.number, ['A', 'B', 'C'])}
                onPositionClick={(label) => onSelect(center.number, [label])}
                size={180}
                center
              />
            </div>
          )}

          {/* Outer 10 Kunds — placed on a circle */}
          {outer.map((k, i) => {
            const angle = (i * 360) / outer.length - 90;
            const rad = (angle * Math.PI) / 180;
            const radiusPct = 38; // % of container
            const x = 50 + radiusPct * Math.cos(rad);
            const y = 50 + radiusPct * Math.sin(rad);
            return (
              <div
                key={k.id}
                className="absolute"
                style={{ top: `${y}%`, left: `${x}%`, transform: 'translate(-50%, -50%)' }}
              >
                <KundIllustration
                  number={k.number}
                  positions={k.positions.map((p) => ({ label: p.label, state: p.state }))}
                  fullyFree={k.fullyFree}
                  selected={selectedKund === k.number}
                  selectedPositions={selectedKund === k.number ? selectedPositions : []}
                  bookingType={bookingType}
                  onKundClick={() => onSelect(k.number, ['A', 'B', 'C'])}
                  onPositionClick={(label) => onSelect(k.number, [label])}
                  size={110}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Below-mandala selection summary */}
      {selectedKund !== null && (
        <div className="mt-6 mx-auto max-w-md rounded-2xl bg-gradient-to-b from-maroon-700 to-maroon-900 text-ivory-50 p-5 shadow-altar text-center">
          <div className="text-xs tracking-widest uppercase text-gold-200">Your selection</div>
          <div className="h-display text-2xl mt-1">
            Kund {selectedKund} · {bookingType === 'FULL_KUND' ? 'All positions (A · B · C)' : `Position ${selectedPositions.join(', ')}`}
          </div>
          <div className="text-sm mt-1 text-gold-100">{dateLabel} · {timeLabel}</div>
        </div>
      )}
    </div>
  );
}

function Legend() {
  const items = [
    { label: 'Free', cls: 'bg-ivory-50 border border-gold-400' },
    { label: 'Held', cls: 'bg-saffron-300 border border-saffron-500' },
    { label: 'Booked', cls: 'bg-maroon-700 border border-maroon-900' },
    { label: 'Selected', cls: 'bg-saffron-500 border border-saffron-700' }
  ];
  return (
    <div className="flex items-center justify-center gap-4 text-xs text-maroon-900/90">
      {items.map((it) => (
        <span key={it.label} className="flex items-center gap-1.5">
          <span className={classNames('w-3 h-3 rounded-full', it.cls)} />
          {it.label}
        </span>
      ))}
    </div>
  );
}
