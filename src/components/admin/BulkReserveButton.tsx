'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * One-tap action used 20–21 June 2026: reserve every Vishnu Gopal position so
 * the temple team can allocate places to walk-in devotees on the day.
 *
 * Previews first — shows the count and any positions that are already booked
 * (which it will NOT overwrite) — then asks for explicit confirmation.
 */

const TARGET = {
  dates: ['2026-06-20', '2026-06-21'],
  yagnaType: 'VISHNU_GOPAL' as const,
  yagnaLabel: 'Vishnu Gopal',
  name: 'Temple allocation — in-person'
};

export default function BulkReserveButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    try {
      const previewRes = await fetch('/api/admin/sessions/bulk-block-by-date', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...TARGET, confirm: false })
      });
      const preview = await previewRes.json();
      if (!previewRes.ok) {
        alert(preview.message || preview.error || 'Could not load preview.');
        return;
      }

      const { sessionsFound, counts, conflictsToCancelFirst = [] } = preview;
      const eligible = counts.eligibleToBlock as number;
      const booked = counts.alreadyBooked as number;
      const held = counts.onHold as number;
      const already = counts.alreadyBlocked as number;

      if (eligible === 0) {
        alert(
          `Nothing to reserve.\n\n` +
          `${TARGET.yagnaLabel} on ${TARGET.dates.join(' + ')}:\n` +
          `  Sessions found: ${sessionsFound}\n` +
          `  Already booked: ${booked}\n` +
          `  On hold: ${held}\n` +
          `  Already blocked: ${already}\n` +
          `  Free to block: 0`
        );
        return;
      }

      const conflictsLine = booked > 0
        ? `\n\n⚠️ ${booked} position(s) are already booked online and will be LEFT ALONE.\n` +
          `First conflicts:\n${conflictsToCancelFirst.slice(0, 5).map((c: string) => '  • ' + c).join('\n')}` +
          (conflictsToCancelFirst.length > 5 ? `\n  …` : '')
        : '';

      const ok = confirm(
        `Reserve ALL free positions in ${sessionsFound} ${TARGET.yagnaLabel} session(s) ` +
        `across ${TARGET.dates.join(' + ')}.\n\n` +
        `This will block ${eligible} position(s) as:\n` +
        `  "${TARGET.name}"\n\n` +
        `Skipped:\n` +
        `  Already booked: ${booked}\n` +
        `  On hold: ${held}\n` +
        `  Already blocked: ${already}` +
        conflictsLine +
        `\n\nProceed?`
      );
      if (!ok) return;

      const sendRes = await fetch('/api/admin/sessions/bulk-block-by-date', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...TARGET, confirm: true })
      });
      const result = await sendRes.json();
      if (!sendRes.ok) {
        alert(result.message || result.error || 'Bulk-block failed.');
        return;
      }
      alert(
        `✓ Done.\n\n` +
        `Sessions: ${result.sessionsFound}\n` +
        `Blocked:  ${result.blocked}\n` +
        `Skipped — already booked: ${result.skipped.alreadyBooked}\n` +
        `Skipped — on hold:        ${result.skipped.onHold}\n` +
        `Skipped — already blocked: ${result.skipped.alreadyBlocked}\n\n` +
        `See the Audit log for the BULK_BLOCK_SESSIONS entry.`
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
      title={`Reserve every ${TARGET.yagnaLabel} position on ${TARGET.dates.join(' + ')} for in-person allocation`}
    >
      {busy ? '🪔 Reserving…' : '🪔 Reserve VG 20–21 Jun'}
    </button>
  );
}
