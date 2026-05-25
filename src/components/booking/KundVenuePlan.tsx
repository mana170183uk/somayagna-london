'use client';

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
  startTime: string;     // raw "10:15" — used to colour the session
  yagnaTitle: string;
  onSelect: (kund: number, positions: ('A' | 'B' | 'C')[]) => void;
}

// Right-column grid order matches the venue diagram:
//   row1: 10 | 11
//   row2: 8  | 9
//   row3: 6  | 7
//   row4: 4  | 5
//   row5: 3  | 2
const RIGHT_GRID_ORDER = [10, 11, 8, 9, 6, 7, 4, 5, 3, 2];

export default function KundVenuePlan({
  availability, bookingType, selectedKund, selectedPositions,
  dateLabel, timeLabel, startTime, yagnaTitle, onSelect
}: Props) {
  const byNumber = new Map(availability.kunds.map((k) => [k.number, k]));
  const kund1 = byNumber.get(1);
  const session = paletteForSession(startTime);

  return (
    <div>
      {/* Header */}
      <div className="text-center pb-5">
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
        <p className="text-sm text-maroon-900/85 mt-3">
          Venue plan view · {availability.remaining} of {availability.capacity} seats remain
        </p>
      </div>

      {/* The plan */}
      <div className="relative mx-auto bg-ivory-50 border border-gold-300/50 rounded-2xl p-4 md:p-6 shadow-altar" style={{ maxWidth: 760 }}>
        {/* Parikrama Marg border labels */}
        <ParikramaLabel position="top" />
        <ParikramaLabel position="bottom" />
        <ParikramaLabel position="left" />
        <ParikramaLabel position="right" />

        {/* Dashed inner border representing the seating area perimeter */}
        <div className="relative mx-8 my-7 border border-dashed border-gold-500/50 rounded-xl p-2 md:p-3 bg-gradient-to-br from-ivory-50 to-ivory-100">
          {/* Seatings labels */}
          <SeatingLabel position="top" />
          <SeatingLabel position="bottom" />

          {/* Main grid: SOM YAGYA (left) + Kunds 2-11 (right) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 px-2 md:px-3 py-4">
            {/* SOM YAGYA central altar */}
            <div className="md:col-span-7 relative">
              <SomYagyaPanel />
            </div>

            {/* Right side: 2×5 grid of Kunds 10,11,8,9,6,7,4,5,3,2 */}
            <div className="md:col-span-5">
              <div className="grid grid-cols-2 gap-2 md:gap-2.5">
                {RIGHT_GRID_ORDER.map((n) => {
                  const k = byNumber.get(n);
                  if (!k) return null;
                  return (
                    <VenueKundTile
                      key={k.id}
                      kund={k}
                      bookingType={bookingType}
                      selected={selectedKund === k.number}
                      selectedPositions={selectedKund === k.number ? selectedPositions : []}
                      onSelect={onSelect}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* Bottom row: Kund 1 (Shree Vishnu Gopal Peeth Stapan) */}
          <div className="px-2 md:px-3 pb-3">
            {kund1 && (
              <Kund1Panel
                kund={kund1}
                bookingType={bookingType}
                selected={selectedKund === kund1.number}
                selectedPositions={selectedKund === kund1.number ? selectedPositions : []}
                onSelect={onSelect}
              />
            )}
          </div>
        </div>

        {/* Bottom kalash icon (Shree Som Kalash Stapan) */}
        <div className="flex flex-col items-center -mt-2 mb-1">
          <KalashIcon />
          <span className="text-[10px] tracking-widest uppercase text-maroon-700 mt-1">Shree Som Kalash Stapan</span>
        </div>
      </div>

      {/* Selection summary */}
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

/* ─────────────────  PIECES  ───────────────── */

function SomYagyaPanel() {
  return (
    <div className="relative rounded-xl bg-gradient-to-br from-maroon-900 via-maroon-800 to-maroon-700 text-ivory-50 overflow-hidden h-full min-h-[320px] md:min-h-[420px] shadow-altar">
      {/* Background mandala */}
      <svg viewBox="0 0 400 400" className="absolute inset-0 w-full h-full text-gold-400 opacity-25 animate-slow-spin" aria-hidden="true">
        <circle cx="200" cy="200" r="190" fill="none" stroke="currentColor" strokeWidth="0.4" />
        <circle cx="200" cy="200" r="150" fill="none" stroke="currentColor" strokeWidth="0.3" />
        {Array.from({ length: 24 }).map((_, i) => {
          const a = (i * 360) / 24;
          return <line key={i} x1="200" y1="200" x2="200" y2="20" stroke="currentColor" strokeWidth="0.25" transform={`rotate(${a} 200 200)`} />;
        })}
      </svg>

      <div className="relative h-full flex flex-col items-center justify-between p-4 md:p-6">
        {/* Dimension label */}
        <div className="self-start text-[10px] tracking-widest uppercase text-gold-200">60 ft</div>

        {/* Big fire altar */}
        <div className="flex-1 flex items-center justify-center w-full">
          <BigFireAltar />
        </div>

        {/* Label */}
        <div className="text-center">
          <div className="h-display text-2xl md:text-3xl text-saffron-200 tracking-wider">SOM YAGYA</div>
          <div className="text-[10px] tracking-[0.4em] uppercase text-gold-200 mt-1">120 × 60</div>
        </div>
      </div>
    </div>
  );
}

function BigFireAltar() {
  return (
    <svg viewBox="0 0 280 240" className="w-full max-w-[260px]" aria-hidden="true">
      <defs>
        <radialGradient id="bigGlow" cx="50%" cy="60%" r="55%">
          <stop offset="0%" stopColor="#FFE08A" stopOpacity="0.9" />
          <stop offset="40%" stopColor="#FB9A2C" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#561414" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="bigFlame" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFE08A" />
          <stop offset="35%" stopColor="#FFB85C" />
          <stop offset="70%" stopColor="#E97B11" />
          <stop offset="100%" stopColor="#8B2727" />
        </linearGradient>
        <linearGradient id="bigBrick" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#9A480A" />
          <stop offset="60%" stopColor="#561414" />
          <stop offset="100%" stopColor="#2C0A0A" />
        </linearGradient>
      </defs>

      {/* Halo */}
      <ellipse cx="140" cy="150" rx="120" ry="110" fill="url(#bigGlow)" className="animate-glow-pulse" style={{ transformOrigin: '140px 150px' }} />

      {/* Square altar base — stepped */}
      <g>
        <rect x="50" y="155" width="180" height="70" rx="4" fill="url(#bigBrick)" stroke="#2C0A0A" strokeWidth="1.5" />
        <rect x="60" y="145" width="160" height="20" rx="3" fill="url(#bigBrick)" stroke="#2C0A0A" strokeWidth="1" />
        {/* Brick lines */}
        <line x1="50" y1="180" x2="230" y2="180" stroke="#2C0A0A" strokeWidth="0.5" opacity="0.6" />
        <line x1="50" y1="205" x2="230" y2="205" stroke="#2C0A0A" strokeWidth="0.5" opacity="0.6" />
        {Array.from({ length: 7 }).map((_, i) => (
          <line key={i} x1={50 + i * 30} y1="155" x2={50 + i * 30} y2="225" stroke="#2C0A0A" strokeWidth="0.4" opacity="0.5" />
        ))}
        {/* Top rim */}
        <rect x="60" y="148" width="160" height="10" fill="#400F0F" />
      </g>

      {/* Multi-layer flames */}
      <g className="animate-flicker" style={{ transformOrigin: '140px 150px' }}>
        {/* Outermost soft flame */}
        <path d="M140 30 Q190 80 180 140 Q170 180 140 180 Q110 180 100 140 Q90 80 140 30 Z" fill="url(#bigFlame)" opacity="0.6" />
        {/* Middle flame */}
        <path d="M140 50 Q175 90 170 140 Q160 170 140 170 Q120 170 110 140 Q105 90 140 50 Z" fill="url(#bigFlame)" opacity="0.85" />
        {/* Inner bright flame */}
        <path d="M140 75 Q160 100 158 135 Q150 158 140 158 Q130 158 122 135 Q120 100 140 75 Z" fill="#FFE08A" opacity="0.9" />
        {/* Core white-hot */}
        <ellipse cx="140" cy="135" rx="7" ry="14" fill="#FFFCF6" />
      </g>

      {/* Sparks rising */}
      <g>
        {[0, 1, 2, 3].map((i) => (
          <circle key={i} cx={130 + (i % 2) * 20} cy={120 - i * 10} r={1.5 + (i % 2) * 0.5} fill="#FFE08A" opacity="0" className="animate-ember-rise" style={{ animationDelay: `${i * 0.7}s` }} />
        ))}
      </g>
    </svg>
  );
}

function VenueKundTile({
  kund, bookingType, selected, selectedPositions, onSelect
}: {
  kund: KundView;
  bookingType: 'SINGLE_POSITION' | 'FULL_KUND';
  selected: boolean;
  selectedPositions: ('A' | 'B' | 'C')[];
  onSelect: (kund: number, positions: ('A' | 'B' | 'C')[]) => void;
}) {
  const bookedCount = kund.positions.filter((p) => p.state === 'BOOKED').length;
  const allBooked = bookedCount === 3;
  const fullKundDisabled = bookingType === 'FULL_KUND' && !kund.fullyFree;

  return (
    <div
      className={classNames(
        'relative rounded-lg border bg-ivory-100 p-2 transition-all',
        selected ? 'border-saffron-500 shadow-soft-gold ring-2 ring-saffron-300/40' : 'border-gold-400/40',
        allBooked && 'opacity-65',
        fullKundDisabled && 'opacity-50'
      )}
    >
      {/* Kund number + mini flame */}
      <div className="flex items-center justify-between mb-1.5">
        <span className="h-display text-base text-maroon-800">{kund.number}</span>
        <MiniFlame booked={allBooked} />
      </div>

      {/* Position dots */}
      <div className="grid grid-cols-3 gap-1">
        {kund.positions.map((p) => {
          const isPicked = selected && selectedPositions.includes(p.label);
          const free = p.state === 'FREE';
          return (
            <button
              key={p.id}
              type="button"
              disabled={!free || fullKundDisabled}
              aria-label={`Kund ${kund.number} position ${p.label} ${p.state.toLowerCase()}`}
              onClick={() => {
                if (bookingType === 'SINGLE_POSITION' && free) onSelect(kund.number, [p.label]);
                if (bookingType === 'FULL_KUND' && kund.fullyFree) onSelect(kund.number, ['A', 'B', 'C']);
              }}
              className={classNames(
                'aspect-square rounded text-[10px] font-semibold border flex items-center justify-center transition',
                p.state === 'BOOKED' && 'bg-maroon-700 text-ivory-50 border-maroon-800 cursor-not-allowed',
                p.state === 'BLOCKED' && 'bg-slate-600 text-slate-100 border-slate-700 cursor-not-allowed',
                p.state === 'HELD' && 'bg-saffron-200 text-saffron-900 border-saffron-400 cursor-not-allowed',
                p.state === 'FREE' && !isPicked && !fullKundDisabled && 'bg-ivory-50 text-maroon-800 border-gold-400/50 hover:border-saffron-500 hover:bg-saffron-50',
                isPicked && 'bg-saffron-500 text-ivory-50 border-saffron-700 shadow-soft-gold'
              )}
            >
              {p.state === 'HELD' ? '◷' : p.state === 'BLOCKED' ? '🔒' : p.label}
            </button>
          );
        })}
      </div>

      {/* "FAMILY 2" tag — matches spec image */}
      <div className="mt-1.5 text-center text-[8px] tracking-widest uppercase text-maroon-700/85">FAMILY 2</div>

      {/* Full kund affordance */}
      {bookingType === 'FULL_KUND' && (
        <button
          type="button"
          disabled={!kund.fullyFree}
          onClick={() => onSelect(kund.number, ['A', 'B', 'C'])}
          className={classNames(
            'w-full mt-1.5 rounded text-[10px] font-medium py-1 transition',
            kund.fullyFree
              ? selected
                ? 'bg-saffron-600 text-ivory-50'
                : 'bg-saffron-100 text-saffron-800 hover:bg-saffron-200'
              : 'bg-ivory-200 text-maroon-900/40 cursor-not-allowed'
          )}
        >
          {kund.fullyFree ? 'Reserve' : '—'}
        </button>
      )}
    </div>
  );
}

function Kund1Panel({
  kund, bookingType, selected, selectedPositions, onSelect
}: {
  kund: KundView;
  bookingType: 'SINGLE_POSITION' | 'FULL_KUND';
  selected: boolean;
  selectedPositions: ('A' | 'B' | 'C')[];
  onSelect: (kund: number, positions: ('A' | 'B' | 'C')[]) => void;
}) {
  const bookedCount = kund.positions.filter((p) => p.state === 'BOOKED').length;
  const allBooked = bookedCount === 3;
  const fullKundDisabled = bookingType === 'FULL_KUND' && !kund.fullyFree;

  return (
    <div className={classNames(
      'relative rounded-lg border bg-gradient-to-br from-ivory-100 to-ivory-200 p-3 md:p-4 transition-all',
      selected ? 'border-saffron-500 shadow-soft-gold ring-2 ring-saffron-300/40' : 'border-gold-400/40'
    )}>
      <div className="flex items-center gap-4 flex-wrap">
        {/* Mini fire on the side */}
        <div className="flex-shrink-0">
          <MiniFlame size={42} booked={allBooked} />
        </div>

        {/* Number + label */}
        <div className="flex-shrink-0">
          <div className="h-display text-3xl text-maroon-800">Kund {kund.number}</div>
          <div className="text-[10px] tracking-widest uppercase text-maroon-700 mt-1">Shree Vishnu Gopal Peeth Stapan</div>
          <div className="text-[10px] tracking-widest uppercase text-maroon-700/85">120 × 40</div>
        </div>

        {/* Position dots */}
        <div className="flex-1 min-w-[140px]">
          <div className="grid grid-cols-3 gap-2">
            {kund.positions.map((p) => {
              const isPicked = selected && selectedPositions.includes(p.label);
              const free = p.state === 'FREE';
              return (
                <button
                  key={p.id}
                  type="button"
                  disabled={!free || fullKundDisabled}
                  aria-label={`Kund 1 position ${p.label} ${p.state.toLowerCase()}`}
                  onClick={() => {
                    if (bookingType === 'SINGLE_POSITION' && free) onSelect(kund.number, [p.label]);
                    if (bookingType === 'FULL_KUND' && kund.fullyFree) onSelect(kund.number, ['A', 'B', 'C']);
                  }}
                  className={classNames(
                    'aspect-square rounded text-sm font-semibold border flex items-center justify-center transition',
                    p.state === 'BOOKED' && 'bg-maroon-700 text-ivory-50 border-maroon-800 cursor-not-allowed',
                    p.state === 'HELD' && 'bg-saffron-200 text-saffron-900 border-saffron-400 cursor-not-allowed',
                    p.state === 'FREE' && !isPicked && !fullKundDisabled && 'bg-ivory-50 text-maroon-800 border-gold-400/50 hover:border-saffron-500',
                    isPicked && 'bg-saffron-500 text-ivory-50 border-saffron-700 shadow-soft-gold'
                  )}
                >
                  {p.state === 'HELD' ? '◷' : p.state === 'BLOCKED' ? '🔒' : p.label}
                </button>
              );
            })}
          </div>
          {bookingType === 'FULL_KUND' && (
            <button
              type="button"
              disabled={!kund.fullyFree}
              onClick={() => onSelect(kund.number, ['A', 'B', 'C'])}
              className={classNames(
                'w-full mt-2 rounded text-xs font-medium py-1.5 transition',
                kund.fullyFree
                  ? selected
                    ? 'bg-saffron-600 text-ivory-50'
                    : 'bg-saffron-100 text-saffron-800 hover:bg-saffron-200'
                  : 'bg-ivory-200 text-maroon-900/40 cursor-not-allowed'
              )}
            >
              {kund.fullyFree ? 'Reserve entire Kund' : 'Not fully free'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function MiniFlame({ size = 24, booked = false }: { size?: number; booked?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <defs>
        <linearGradient id={`mf-${size}-${booked}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFE08A" />
          <stop offset="55%" stopColor="#FB9A2C" />
          <stop offset="100%" stopColor="#8B2727" />
        </linearGradient>
      </defs>
      {!booked ? (
        <g className="animate-flicker" style={{ transformOrigin: '12px 16px' }}>
          <path d="M12 3 Q18 9 16 16 Q14 20 12 20 Q10 20 8 16 Q6 9 12 3 Z" fill={`url(#mf-${size}-${booked})`} />
          <ellipse cx="12" cy="15" rx="1.5" ry="3" fill="#FFFCF6" opacity="0.8" />
        </g>
      ) : (
        <circle cx="12" cy="16" r="3" fill="#561414" opacity="0.5" />
      )}
    </svg>
  );
}

function ParikramaLabel({ position }: { position: 'top' | 'bottom' | 'left' | 'right' }) {
  const baseCls = 'absolute text-[9px] tracking-[0.3em] uppercase text-maroon-700/85 pointer-events-none';
  const cls = {
    top: 'top-1 left-1/2 -translate-x-1/2',
    bottom: 'bottom-1 left-1/2 -translate-x-1/2',
    left: 'left-1 top-1/2 -translate-y-1/2 -rotate-90 origin-center',
    right: 'right-1 top-1/2 -translate-y-1/2 rotate-90 origin-center'
  }[position];
  return <div className={`${baseCls} ${cls}`}>↔ Parikrama Marg ↔</div>;
}

function SeatingLabel({ position }: { position: 'top' | 'bottom' }) {
  return (
    <div className={classNames(
      'absolute text-[9px] tracking-[0.4em] uppercase text-maroon-700/40 left-1/2 -translate-x-1/2 pointer-events-none',
      position === 'top' && '-top-1',
      position === 'bottom' && '-bottom-1'
    )}>
      Seatings
    </div>
  );
}

function KalashIcon() {
  return (
    <svg viewBox="0 0 40 50" width="32" height="40" aria-hidden="true">
      <defs>
        <linearGradient id="kalashG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#CFA13B" />
          <stop offset="100%" stopColor="#7A5712" />
        </linearGradient>
      </defs>
      {/* Coconut on top */}
      <ellipse cx="20" cy="8" rx="4" ry="5" fill="#9A480A" />
      {/* Mango leaves */}
      <path d="M14 12 Q12 8 16 7 Q18 11 14 12 Z" fill="#557139" />
      <path d="M26 12 Q28 8 24 7 Q22 11 26 12 Z" fill="#557139" />
      <path d="M20 11 Q20 6 22 7 Q22 11 20 11 Z" fill="#7A8B41" />
      {/* Kalash body */}
      <path d="M10 18 Q10 13 20 13 Q30 13 30 18 L28 30 Q28 40 20 42 Q12 40 12 30 Z" fill="url(#kalashG)" stroke="#5B2A0B" strokeWidth="0.5" />
      <line x1="10" y1="22" x2="30" y2="22" stroke="#5B2A0B" strokeWidth="0.4" opacity="0.6" />
    </svg>
  );
}
