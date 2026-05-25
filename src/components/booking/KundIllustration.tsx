'use client';

import { classNames } from '@/lib/utils';

export type PositionState = 'FREE' | 'HELD' | 'BOOKED' | 'BLOCKED';

export interface KundIllustrationProps {
  number: number;
  positions: { label: 'A' | 'B' | 'C'; state: PositionState }[];
  fullyFree: boolean;
  selected: boolean;
  selectedPositions: ('A' | 'B' | 'C')[];
  bookingType: 'SINGLE_POSITION' | 'FULL_KUND';
  onKundClick: () => void;
  onPositionClick: (label: 'A' | 'B' | 'C') => void;
  size?: number;
  center?: boolean;
}

const POS_ANGLES: Record<'A' | 'B' | 'C', number> = { A: -90, B: 30, C: 150 };

function posXY(angleDeg: number, r: number, cx: number, cy: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

export default function KundIllustration({
  number,
  positions,
  fullyFree,
  selected,
  selectedPositions,
  bookingType,
  onKundClick,
  onPositionClick,
  size = 140,
  center = false
}: KundIllustrationProps) {
  const bookedCount = positions.filter((p) => p.state === 'BOOKED').length;
  const allBooked = bookedCount === 3;
  const dim = allBooked ? 0.45 : 1;

  const fullKundDisabled = bookingType === 'FULL_KUND' && !fullyFree;
  const clickable = !fullKundDisabled;

  const w = size;
  const h = size;
  const cx = 100;
  const cy = 100;
  const baseR = 56;
  const posR = 78;

  const flameId = `flame-${number}`;
  const glowId = `glow-${number}`;
  const brickId = `brick-${number}`;

  return (
    <div
      className={classNames(
        'group relative inline-flex flex-col items-center transition-all duration-300',
        clickable ? 'cursor-pointer' : 'cursor-not-allowed',
        center && 'scale-110'
      )}
      style={{ width: w }}
      onClick={() => {
        if (bookingType === 'FULL_KUND' && fullyFree) onKundClick();
      }}
    >
      {/* Selection halo */}
      <div
        className={classNames(
          'absolute inset-0 rounded-full transition-all duration-500 pointer-events-none',
          selected ? 'bg-saffron-300/40 blur-2xl scale-125' : 'opacity-0'
        )}
      />

      <svg
        viewBox="0 0 200 200"
        width={w}
        height={h}
        className={classNames(
          'relative transition-transform duration-500',
          clickable && 'group-hover:scale-105',
          allBooked && 'grayscale-[0.3]'
        )}
        style={{ opacity: dim }}
        aria-label={`Kund ${number}, ${fullyFree ? 'all positions free' : allBooked ? 'fully booked' : `${3 - bookedCount} of 3 free`}`}
      >
        <defs>
          {/* Glow halo */}
          <radialGradient id={glowId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFB85C" stopOpacity={allBooked ? 0.1 : 0.7} />
            <stop offset="40%" stopColor="#E97B11" stopOpacity={allBooked ? 0.05 : 0.35} />
            <stop offset="100%" stopColor="#561414" stopOpacity="0" />
          </radialGradient>
          {/* Flame gradient */}
          <linearGradient id={flameId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFE08A" />
            <stop offset="45%" stopColor="#FB9A2C" />
            <stop offset="100%" stopColor="#8B2727" />
          </linearGradient>
          {/* Brick base gradient */}
          <linearGradient id={brickId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#9A480A" />
            <stop offset="50%" stopColor="#7A380D" />
            <stop offset="100%" stopColor="#400F0F" />
          </linearGradient>
        </defs>

        {/* Ambient halo */}
        <circle cx={cx} cy={cy} r="95" fill={`url(#${glowId})`} className={allBooked ? '' : 'animate-glow-pulse'} style={{ transformOrigin: `${cx}px ${cy}px` }} />

        {/* Sacred geometry: outer ring + 8-spoke decoration */}
        <g opacity={selected ? 0.85 : 0.45} className="transition-opacity">
          <circle cx={cx} cy={cy} r="82" fill="none" stroke="#B98724" strokeWidth="0.6" strokeDasharray="2 3" />
          <circle cx={cx} cy={cy} r="68" fill="none" stroke="#B98724" strokeWidth="0.4" />
        </g>

        {/* Brick altar base — square fire pit */}
        <g>
          <rect
            x={cx - baseR}
            y={cy - baseR}
            width={baseR * 2}
            height={baseR * 2}
            rx="6"
            fill={`url(#${brickId})`}
            stroke="#400F0F"
            strokeWidth="1.5"
          />
          {/* Brick stripes */}
          <line x1={cx - baseR} y1={cy - baseR / 2} x2={cx + baseR} y2={cy - baseR / 2} stroke="#400F0F" strokeWidth="0.6" opacity="0.5" />
          <line x1={cx - baseR} y1={cy + baseR / 2} x2={cx + baseR} y2={cy + baseR / 2} stroke="#400F0F" strokeWidth="0.6" opacity="0.5" />
          <line x1={cx - baseR / 2} y1={cy - baseR} x2={cx - baseR / 2} y2={cy + baseR} stroke="#400F0F" strokeWidth="0.6" opacity="0.5" />
          <line x1={cx + baseR / 2} y1={cy - baseR} x2={cx + baseR / 2} y2={cy + baseR} stroke="#400F0F" strokeWidth="0.6" opacity="0.5" />
          {/* Top rim */}
          <rect x={cx - baseR + 6} y={cy - baseR + 6} width={(baseR - 6) * 2} height={(baseR - 6) * 2} rx="3" fill="#2C0A0A" opacity="0.55" />
        </g>

        {/* Flames (only if not fully booked) */}
        {!allBooked && (
          <g
            className="animate-flicker"
            style={{ transformOrigin: `${cx}px ${cy + 10}px` }}
          >
            {/* Outer flame */}
            <path
              d={`M ${cx} ${cy - 35} Q ${cx + 22} ${cy - 5} ${cx + 14} ${cy + 22} Q ${cx} ${cy + 35} ${cx - 14} ${cy + 22} Q ${cx - 22} ${cy - 5} ${cx} ${cy - 35} Z`}
              fill={`url(#${flameId})`}
              opacity="0.92"
            />
            {/* Inner hotter flame */}
            <path
              d={`M ${cx} ${cy - 20} Q ${cx + 10} ${cy - 2} ${cx + 6} ${cy + 14} Q ${cx} ${cy + 22} ${cx - 6} ${cy + 14} Q ${cx - 10} ${cy - 2} ${cx} ${cy - 20} Z`}
              fill="#FFE08A"
              opacity="0.85"
            />
            {/* Hottest core */}
            <ellipse cx={cx} cy={cy + 6} rx="3.5" ry="6" fill="#FFFCF6" opacity="0.85" />
          </g>
        )}

        {/* Embers (subtle rising sparks for free Kunds) */}
        {fullyFree && (
          <g className="pointer-events-none">
            {[0, 1, 2].map((i) => (
              <circle
                key={i}
                cx={cx + (i - 1) * 8}
                cy={cy - 8}
                r="1.2"
                fill="#FFE08A"
                opacity="0"
                className="animate-ember-rise"
                style={{ animationDelay: `${i * 0.9}s`, transformOrigin: `${cx + (i - 1) * 8}px ${cy - 8}px` }}
              />
            ))}
          </g>
        )}

        {/* Position dots A/B/C — interactive */}
        {positions.map((p) => {
          const { x, y } = posXY(POS_ANGLES[p.label], posR, cx, cy);
          const isPicked = selected && selectedPositions.includes(p.label);
          const free = p.state === 'FREE';
          const fill =
            p.state === 'BOOKED' ? '#561414' :
            p.state === 'BLOCKED' ? '#475569' :
            p.state === 'HELD' ? '#FFB85C' :
            isPicked ? '#E97B11' : '#FFFCF6';
          const stroke = p.state === 'BOOKED' ? '#2C0A0A' : p.state === 'BLOCKED' ? '#1E293B' : isPicked ? '#9A480A' : '#9A480A';
          return (
            <g key={p.label}>
              <circle
                cx={x}
                cy={y}
                r="13"
                fill={fill}
                stroke={stroke}
                strokeWidth={isPicked ? 2.4 : 1.4}
                className={classNames(
                  'transition-all',
                  free && bookingType === 'SINGLE_POSITION' && !fullKundDisabled && 'cursor-pointer hover:r-15'
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  if (bookingType === 'SINGLE_POSITION' && free) onPositionClick(p.label);
                }}
                style={{ cursor: bookingType === 'SINGLE_POSITION' && free ? 'pointer' : 'default' }}
              />
              <text
                x={x}
                y={y + 4}
                textAnchor="middle"
                fontSize="13"
                fontWeight="600"
                fill={p.state === 'BOOKED' || isPicked ? '#FFFCF6' : '#400F0F'}
                pointerEvents="none"
              >
                {p.label}
              </text>
            </g>
          );
        })}

        {/* Kund number badge */}
        <g>
          <circle cx={cx} cy={cy + baseR + 16} r="14" fill="#FBF5E7" stroke="#B98724" strokeWidth="1.2" />
          <text x={cx} y={cy + baseR + 20} textAnchor="middle" fontSize="13" fontWeight="700" fill="#400F0F">
            {number}
          </text>
        </g>
      </svg>

      {/* Status pill below */}
      <div
        className={classNames(
          'mt-2 text-[10px] tracking-widest uppercase px-2 py-0.5 rounded-full transition',
          allBooked
            ? 'bg-maroon-100 text-maroon-700'
            : fullyFree
              ? 'bg-saffron-100 text-saffron-800'
              : 'bg-gold-100 text-maroon-800'
        )}
      >
        {allBooked ? 'Fully booked' : fullyFree ? 'All free' : `${3 - bookedCount} free`}
      </div>
    </div>
  );
}
