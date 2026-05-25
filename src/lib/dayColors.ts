/**
 * Per-day color palette — used across landing timeline, booking step 1,
 * and the admin dashboard so each event day has a consistent visual
 * identity that attendees and organisers can recognise at a glance.
 *
 * All palettes are LIGHT pastels designed to pair with maroon-900 text
 * on top, and to harmonise with the saffron/maroon/gold brand.
 */

export interface DayPalette {
  bg: string;          // Light background (Tailwind class)
  border: string;      // Subtle border (Tailwind class)
  ring: string;        // Stronger accent for selected/hover states
  accentText: string;  // Day-themed text for labels/pills
  swatch: string;      // Solid hex for icons / non-class contexts
  name: string;        // Human-readable colour name
}

const PALETTES: Record<string, DayPalette> = {
  // 14 June — Welcome / inauguration. Neutral, calm, ceremonial.
  '2026-06-14': { bg: 'bg-ivory-200',    border: 'border-maroon-300/35', ring: 'ring-maroon-300/40', accentText: 'text-maroon-700', swatch: '#F4EAD0', name: 'Ivory' },
  // 15 June — Purshotam Yagna — Day 1, opening. Marigold, the auspicious bloom.
  '2026-06-15': { bg: 'bg-amber-100',    border: 'border-amber-400',     ring: 'ring-amber-400',     accentText: 'text-amber-800',   swatch: '#FEF3C7', name: 'Marigold' },
  // 16–21 June — Vishnu Gopal Yagna, six days, each a different gentle pastel
  '2026-06-16': { bg: 'bg-rose-100',     border: 'border-rose-300',      ring: 'ring-rose-400',      accentText: 'text-rose-800',    swatch: '#FFE4E6', name: 'Rose' },
  '2026-06-17': { bg: 'bg-orange-100',   border: 'border-orange-300',    ring: 'ring-orange-400',    accentText: 'text-orange-800',  swatch: '#FFEDD5', name: 'Peach' },
  '2026-06-18': { bg: 'bg-emerald-100',  border: 'border-emerald-300',   ring: 'ring-emerald-400',   accentText: 'text-emerald-800', swatch: '#D1FAE5', name: 'Sage' },
  '2026-06-19': { bg: 'bg-violet-100',   border: 'border-violet-300',    ring: 'ring-violet-400',    accentText: 'text-violet-800',  swatch: '#EDE9FE', name: 'Lavender' },
  '2026-06-20': { bg: 'bg-yellow-100',   border: 'border-yellow-300',    ring: 'ring-yellow-400',    accentText: 'text-yellow-800',  swatch: '#FEF9C3', name: 'Lemon' },
  '2026-06-21': { bg: 'bg-pink-100',     border: 'border-pink-300',      ring: 'ring-pink-400',      accentText: 'text-pink-800',    swatch: '#FCE7F3', name: 'Coral' }
};

const DEFAULT_PALETTE = PALETTES['2026-06-14'];

export function paletteForDate(date: Date | string): DayPalette {
  const iso = typeof date === 'string' ? date.slice(0, 10) : date.toISOString().slice(0, 10);
  return PALETTES[iso] ?? DEFAULT_PALETTE;
}
