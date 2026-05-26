'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Toggle button for optional sessions on the admin dashboard.
 * Calls POST /api/admin/sessions/[id]/toggle.
 *
 * Disabling a session that has confirmed bookings is rejected by the API.
 */
export default function SessionToggle({ id, enabled }: { id: string; enabled: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function toggle() {
    setBusy(true); setErr(null);
    const r = await fetch(`/api/admin/sessions/${id}/toggle`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ enabled: !enabled })
    });
    setBusy(false);
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      setErr(j.message || j.error || 'Failed');
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end">
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        title={enabled ? 'Hide this optional session from public booking' : 'Enable this optional session for public booking'}
        className={`text-[10px] tracking-widest uppercase font-semibold px-2.5 py-1 rounded-full border transition ${
          enabled
            ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
            : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
        }`}
      >
        {busy ? '…' : enabled ? 'Live · click to hide' : 'Hidden · click to enable'}
      </button>
      {err && <span className="text-[10px] text-maroon-700 mt-1">{err}</span>}
    </div>
  );
}
