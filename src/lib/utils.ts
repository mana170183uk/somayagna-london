import { POSITION_LABELS, PositionLabel } from './constants';

export function isPositionLabel(s: string): s is PositionLabel {
  return (POSITION_LABELS as readonly string[]).includes(s);
}

let counter = 0;
export function bookingReference(year: string) {
  // SY-2026-XXXXXX — sortable, human-readable
  counter = (counter + 1) % 1_000_000;
  const ts = Date.now().toString(36).slice(-4).toUpperCase();
  const rnd = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `SY-${year}-${ts}${rnd}`;
}

export function safeJson<T>(v: T) {
  return JSON.parse(JSON.stringify(v));
}

export function classNames(...xs: (string | false | null | undefined)[]) {
  return xs.filter(Boolean).join(' ');
}
