'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function WipeDonationsButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onClick() {
    const typed = window.prompt(
      'This will permanently delete ALL standalone donations (made via /donate).\n\nType WIPE to confirm.'
    );
    if (typed !== 'WIPE') return;

    setBusy(true);
    try {
      const r = await fetch('/api/admin/wipe-donations', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ confirm: 'WIPE-ALL-DONATIONS' })
      });
      const data = await r.json();
      if (!r.ok) {
        alert(`Failed: ${data.message ?? data.error ?? r.status}`);
        return;
      }
      alert(`Wipe complete: ${data.deletedDonations} donation(s) deleted.`);
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
      title="Permanently delete all standalone donations — use only for test data cleanup"
    >
      {busy ? 'Wiping…' : '🗑 Wipe test donations'}
    </button>
  );
}
