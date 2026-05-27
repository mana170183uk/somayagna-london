'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Destructive admin action: wipes ALL bookings, payments, and holds.
 * Requires a typed confirmation prompt to prevent accidental clicks.
 * Calls POST /api/admin/wipe-bookings — schema and seed data are not touched.
 */
export default function WipeBookingsButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onClick() {
    const typed = window.prompt(
      'This will permanently delete ALL bookings, payments, and holds. Seats reset to free.\n\nType WIPE to confirm.'
    );
    if (typed !== 'WIPE') return;

    setBusy(true);
    try {
      const r = await fetch('/api/admin/wipe-bookings', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ confirm: 'WIPE-ALL-BOOKINGS' })
      });
      const data = await r.json();
      if (!r.ok) {
        alert(`Failed: ${data.message ?? data.error ?? r.status}`);
        return;
      }
      alert(
        `Wipe complete:\n` +
        `• ${data.deletedBookings} booking(s) deleted\n` +
        `• ${data.deletedPayments} payment(s) deleted\n` +
        `• ${data.deletedHolds} hold(s) deleted\n` +
        `• ${data.releasedPositions} position(s) released to FREE`
      );
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className="btn-secondary !bg-maroon-700/30 !text-ivory-50 !border-maroon-300/30 hover:!bg-maroon-700/50"
      title="Permanently delete all bookings — use only before go-live"
    >
      {busy ? 'Wiping…' : '🗑 Wipe test bookings'}
    </button>
  );
}
