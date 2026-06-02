'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function EnquiryActions({ id, status, email }: { id: string; status: string; email: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function update(next: 'IN_PROGRESS' | 'RESOLVED' | 'NEW') {
    let notes: string | undefined;
    if (next === 'RESOLVED') {
      notes = window.prompt('Resolution notes (optional):') ?? undefined;
    }
    setBusy(true);
    try {
      const r = await fetch(`/api/admin/enquiries/${id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status: next, resolutionNotes: notes ?? null })
      });
      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        alert(data.message ?? data.error ?? `HTTP ${r.status}`);
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-2 shrink-0">
      <a className="btn-ghost !py-1 !px-2 !text-xs" href={`mailto:${email}`}>Reply</a>
      {status !== 'IN_PROGRESS' && (
        <button disabled={busy} className="btn-ghost !py-1 !px-2 !text-xs" onClick={() => update('IN_PROGRESS')}>
          Mark in progress
        </button>
      )}
      {status !== 'RESOLVED' && (
        <button disabled={busy} className="btn-ghost !py-1 !px-2 !text-xs text-emerald-700" onClick={() => update('RESOLVED')}>
          Resolve
        </button>
      )}
      {status !== 'NEW' && (
        <button disabled={busy} className="btn-ghost !py-1 !px-2 !text-xs" onClick={() => update('NEW')}>
          Reopen
        </button>
      )}
    </div>
  );
}
