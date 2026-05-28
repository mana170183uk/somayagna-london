export const KUND_COUNT = 11;
export const POSITION_LABELS = ['A', 'B', 'C'] as const;
export type PositionLabel = (typeof POSITION_LABELS)[number];
export const SESSION_CAPACITY = KUND_COUNT * POSITION_LABELS.length; // 33

export const PRICE_SINGLE_PENCE = 20100; // £201.00
export const PRICE_FULL_KUND_PENCE = 50100; // £501.00

export const HOLD_MINUTES = 10;
export const HOLD_MS = HOLD_MINUTES * 60 * 1000;

export const SESSIONS = [
  { startTime: '10:15', label: 'Morning Session' },
  { startTime: '14:15', label: 'Afternoon Session I' },
  { startTime: '16:15', label: 'Afternoon Session II' }
] as const;

export const EVENT = {
  name: 'SomaYagna London',
  year: process.env.EVENT_YEAR ?? '2026',
  startDate: '14 June',
  endDate: '21 June',
  organizer: process.env.EVENT_ORGANIZER ?? 'Unity in Divinity (UK Registered Charity)',
  venueName: process.env.EVENT_VENUE_NAME ?? 'Shree Swaminarayan Mandir',
  venueAddress: process.env.EVENT_VENUE_ADDRESS ?? 'Wood Lane, Stanmore HA7 4LF',
  venueMapEmbedUrl: process.env.EVENT_VENUE_MAP_EMBED_URL
    ?? 'https://www.google.com/maps?q=Shree+Swaminarayan+Mandir,+Wood+Lane,+Stanmore+HA7+4LF&output=embed',
  venueMapLink: process.env.EVENT_VENUE_MAP_LINK
    ?? 'https://www.google.com/maps/search/?api=1&query=Shree+Swaminarayan+Mandir+Wood+Lane+Stanmore+HA7+4LF',
  contactEmail: process.env.EVENT_CONTACT_EMAIL ?? 'info@somayagnalondon.org',
  contactPhone: process.env.EVENT_CONTACT_PHONE ?? '+44 20 0000 0000'
};

// Safety: when running with a LIVE Stripe key (sk_live_...), `mock` is
// forcibly excluded so Demo mode can never accidentally appear on a real
// production booking flow — even if ENABLED_PAYMENT_PROVIDERS env var is
// set incorrectly.
const _isLiveStripe = (process.env.STRIPE_SECRET_KEY ?? '').startsWith('sk_live_');
const _rawProviders = (process.env.ENABLED_PAYMENT_PROVIDERS ?? 'stripe')
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean) as Array<'stripe' | 'paypal' | 'mock'>;

export const ENABLED_PROVIDERS = _isLiveStripe
  ? _rawProviders.filter((p) => p !== 'mock')
  : _rawProviders;

export function isProviderEnabled(p: 'stripe' | 'paypal' | 'mock') {
  return ENABLED_PROVIDERS.includes(p);
}

export function formatGBP(pence: number) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(pence / 100);
}

export function formatTime(t: string /* "10:15" */) {
  const [h, m] = t.split(':').map(Number);
  const d = new Date(); d.setHours(h, m, 0, 0);
  return new Intl.DateTimeFormat('en-GB', { hour: 'numeric', minute: '2-digit' }).format(d);
}

export function formatDateLong(iso: string | Date) {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  return new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(d);
}

export function formatDateShort(iso: string | Date) {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(d);
}
