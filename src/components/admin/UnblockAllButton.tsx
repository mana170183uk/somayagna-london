'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Clears the `blocked` flag on every KundPosition in the system.
 * Reversible — admins can re-block individual positions afterward.
 * Audited as UNBLOCK_ALL_POSITIONS with the actor's IP.
 */
export default function UnblockAllButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onClick() {
    const typed = window.prompt(
      'This will clear ALL admin blocks across every session.\nBookings are NOT affected.\n\nType UNBLOCK to confirm.'
    );
    if (typed !== 'UNBLOCK') return;

    setBusy(true);
    try {
      const r = await fetch('/api/admin/unblock-all', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ confirm: 'UNBLOCK-ALL' })
      });
      const data = await r.json();
      if (!r.ok) {
        alert(`Failed: ${data.message ?? data.error ?? r.status}`);
        return;
      }
      alert(`✓ Unblocked ${data.unblocked} position(s).`);
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
      className="btn-secondary !bg-ivory-50/15 !text-ivory-50 !border-ivory-50/30 hover:!bg-ivory-50/25"
      title="Clear every admin block in one tap. Bookings are not affected."
    >
      {busy ? 'Unblocking…' : '🔓 Unblock all'}
    </button>
  );
}
