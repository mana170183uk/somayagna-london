'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function BulkResendEmailButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    try {
      // Step 1 — preview
      const previewRes = await fetch('/api/admin/bookings/bulk-resend-email', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ confirm: false })
      });
      const preview = await previewRes.json();
      if (!previewRes.ok) {
        alert(preview.message || preview.error || 'Could not load preview.');
        return;
      }
      const count = preview.eligibleCount as number;
      if (count === 0) {
        alert('Nothing to send. Every confirmed booking with an email already has a recorded EMAIL_SENT entry.');
        return;
      }

      const sample = (preview.sample as string[] | undefined) ?? [];
      const sampleLine = sample.length
        ? `\n\nFirst ${sample.length}:\n${sample.map((s) => '  • ' + s).join('\n')}`
        : '';
      const cap = preview.cappedAt as number;
      const capLine = count > cap
        ? `\n\nThis run will send ${cap}; another ${count - cap} will remain — click again afterwards to continue.`
        : '';

      const ok = confirm(
        `Send the confirmation email to ${count} past CONFIRMED booking(s) ` +
        `that don't yet have a recorded EMAIL_SENT audit entry.` +
        sampleLine + capLine +
        `\n\nProceed?`
      );
      if (!ok) return;

      // Step 2 — actually send
      const sendRes = await fetch('/api/admin/bookings/bulk-resend-email', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ confirm: true })
      });
      const result = await sendRes.json();
      if (!sendRes.ok) {
        alert(result.message || result.error || 'Bulk send failed.');
        return;
      }
      const { attempted, sent, skipped, failed, remaining } = result;
      alert(
        `Done.\n\n` +
        `Attempted: ${attempted}\n` +
        `Sent:      ${sent}\n` +
        `Skipped:   ${skipped}\n` +
        `Failed:    ${failed}\n` +
        (remaining > 0 ? `\n${remaining} remaining — click the button again to send the next batch.` : '') +
        `\n\nSee Audit log for per-booking entries.`
      );
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={run}
      disabled={busy}
      className="btn-secondary !bg-ivory-50/15 !text-ivory-50 !border-ivory-50/30 hover:!bg-ivory-50/25 disabled:opacity-50"
      title="Send confirmation emails to past confirmed bookings that don't yet have an EMAIL_SENT audit entry"
    >
      {busy ? '✉ Working…' : '✉ Backfill emails'}
    </button>
  );
}
