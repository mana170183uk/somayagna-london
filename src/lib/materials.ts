/**
 * Materials catalogue — items a devotee can dedicate a donation toward.
 *
 * Amounts follow the Vedic tradition of "shubh" (auspicious) totals ending in 1
 * (£21, £51, £101, £201, £501, £1001). All copy is dignified, descriptive, and
 * makes no theological claims about outcomes.
 */
export interface Material {
  key: string;
  label: string;
  shortLabel: string;
  blurb: string;
  amountPence: number;
  emoji?: string;            // small inline ornament (optional)
}

export const MATERIALS: Material[] = [
  {
    key: 'ghee',
    label: 'Ghee for the sacred fire',
    shortLabel: 'Ghee',
    blurb: 'Pure cow’s ghee, offered as ahuti into the homakund — the most traditional of all yagna offerings.',
    amountPence: 2100,
  },
  {
    key: 'samagri',
    label: 'Samagri — herbal offering mix',
    shortLabel: 'Samagri',
    blurb: 'The blended mix of sacred herbs, grains and woods that accompanies each mantra.',
    amountPence: 5100,
  },
  {
    key: 'flowers',
    label: 'Flowers & garlands',
    shortLabel: 'Flowers',
    blurb: 'Fresh flowers and garlands for the altar, the priests and the daily decoration of the mandap.',
    amountPence: 5100,
  },
  {
    key: 'prasad',
    label: 'Prasad for the devotees',
    shortLabel: 'Prasad',
    blurb: 'Sacred food prepared with care, blessed in the yagna and shared with everyone who attends.',
    amountPence: 10100,
  },
  {
    key: 'samidha',
    label: 'Sacred wood (samidha)',
    shortLabel: 'Sacred wood',
    blurb: 'Specially-selected wood that sustains the sacred fire across all eight days of the programme.',
    amountPence: 20100,
  },
  {
    key: 'ritvik',
    label: 'Sponsor a Ritvik priest',
    shortLabel: 'Sponsor a Ritvik',
    blurb: 'Support one of the seventeen trained Brahmin priests who conduct the rituals each day.',
    amountPence: 50100,
  },
  {
    key: 'annadana',
    label: 'Annadana — community meal',
    shortLabel: 'Annadana',
    blurb: 'Sponsor a full community meal for attendees. In the Vedic tradition, annadana — the gift of food — is held as the highest gift.',
    amountPence: 100100,
  }
];

export function findMaterial(key: string): Material | undefined {
  return MATERIALS.find((m) => m.key === key);
}
