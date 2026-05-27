/**
 * Materials catalogue — items a devotee can dedicate a donation toward.
 *
 * Amounts follow the Vedic tradition of "shubh" (auspicious) totals ending in 1
 * (£21, £51, £101, £201, £501, £1001). All copy is dignified, descriptive, and
 * makes no theological claims about outcomes.
 */
export interface MaterialPalette {
  bg: string;
  border: string;
  ring: string;
  accent: string;
  activeBg: string;     // class for the selected/active state
  activeText: string;
}

export interface Material {
  key: string;
  label: string;
  shortLabel: string;
  blurb: string;
  amountPence: number;
  emoji: string;
  palette: MaterialPalette;
}

export const MATERIALS: Material[] = [
  {
    key: 'ghee',
    label: 'Ghee for the sacred fire',
    shortLabel: 'Ghee',
    blurb: 'Pure cow’s ghee, offered as ahuti into the homakund — the most traditional of all yagna offerings.',
    amountPence: 2100,
    emoji: '🪔',
    palette: { bg: 'bg-amber-100', border: 'border-amber-400', ring: 'ring-amber-400', accent: 'text-amber-800', activeBg: 'bg-amber-500', activeText: 'text-ivory-50' }
  },
  {
    key: 'samagri',
    label: 'Samagri — herbal offering mix',
    shortLabel: 'Samagri',
    blurb: 'The blended mix of sacred herbs, grains and woods that accompanies each mantra.',
    amountPence: 5100,
    emoji: '🌿',
    palette: { bg: 'bg-emerald-100', border: 'border-emerald-400', ring: 'ring-emerald-400', accent: 'text-emerald-800', activeBg: 'bg-emerald-600', activeText: 'text-ivory-50' }
  },
  {
    key: 'flowers',
    label: 'Flowers & garlands',
    shortLabel: 'Flowers',
    blurb: 'Fresh flowers and garlands for the altar, the priests and the daily decoration of the mandap.',
    amountPence: 5100,
    emoji: '🌸',
    palette: { bg: 'bg-pink-100', border: 'border-pink-400', ring: 'ring-pink-400', accent: 'text-pink-800', activeBg: 'bg-pink-500', activeText: 'text-ivory-50' }
  },
  {
    key: 'prasad',
    label: 'Prasad for the devotees',
    shortLabel: 'Prasad',
    blurb: 'Sacred food prepared with care, blessed in the yagna and shared with everyone who attends.',
    amountPence: 10100,
    emoji: '🍚',
    palette: { bg: 'bg-orange-100', border: 'border-orange-400', ring: 'ring-orange-400', accent: 'text-orange-800', activeBg: 'bg-orange-500', activeText: 'text-ivory-50' }
  },
  {
    key: 'samidha',
    label: 'Sacred wood (samidha)',
    shortLabel: 'Sacred wood',
    blurb: 'Specially-selected wood that sustains the sacred fire across all eight days of the programme.',
    amountPence: 20100,
    emoji: '🪵',
    palette: { bg: 'bg-rose-100', border: 'border-rose-400', ring: 'ring-rose-400', accent: 'text-rose-800', activeBg: 'bg-rose-600', activeText: 'text-ivory-50' }
  },
  {
    key: 'ritvik',
    label: 'Sponsor a Ritvik priest',
    shortLabel: 'Sponsor a Ritvik',
    blurb: 'Support one of the seventeen trained Brahmin priests who conduct the rituals each day.',
    amountPence: 50100,
    emoji: '🕉',
    palette: { bg: 'bg-violet-100', border: 'border-violet-400', ring: 'ring-violet-400', accent: 'text-violet-800', activeBg: 'bg-violet-600', activeText: 'text-ivory-50' }
  },
  {
    key: 'annadana',
    label: 'Annadana — community meal',
    shortLabel: 'Annadana',
    blurb: 'Sponsor a full community meal for attendees. In the Vedic tradition, annadana — the gift of food — is held as the highest gift.',
    amountPence: 100100,
    emoji: '🍛',
    palette: { bg: 'bg-yellow-100', border: 'border-yellow-400', ring: 'ring-yellow-400', accent: 'text-yellow-800', activeBg: 'bg-yellow-600', activeText: 'text-ivory-50' }
  }
];

export function findMaterial(key: string): Material | undefined {
  return MATERIALS.find((m) => m.key === key);
}
