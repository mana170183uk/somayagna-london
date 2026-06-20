import Link from 'next/link';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getAdminFromCookies } from '@/lib/auth';

export const dynamic = 'force-dynamic';

type Tag = 'OK' | 'WARN' | 'FAIL';
type Check = { tag: Tag; title: string; detail?: string; items?: string[] };

const TONES: Record<Tag, string> = {
  OK:   'bg-emerald-50 border-emerald-300 text-emerald-900',
  WARN: 'bg-amber-50 border-amber-300 text-amber-900',
  FAIL: 'bg-rose-50 border-rose-400 text-rose-900'
};
const BADGE: Record<Tag, string> = {
  OK:   'bg-emerald-600 text-white',
  WARN: 'bg-amber-500 text-white',
  FAIL: 'bg-rose-600 text-white'
};

async function runChecks(): Promise<Check[]> {
  const results: Check[] = [];
  const now = new Date();

  // 1. Connectivity + server time
  try {
    const rows = await prisma.$queryRaw<{ now: Date }[]>`SELECT NOW() AS now`;
    results.push({
      tag: 'OK',
      title: 'Database connectivity',
      detail: `Connected to Neon. Server time: ${rows[0].now.toISOString()}`
    });
  } catch (e: unknown) {
    results.push({
      tag: 'FAIL',
      title: 'Database connectivity',
      detail: (e as Error).message
    });
    return results;
  }

  // 2. Table presence
  const tables = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename
  `;
  const have = new Set(tables.map((t) => t.tablename));
  const want = ['EventDay', 'YagnaInstance', 'Session', 'Kund', 'KundPosition',
    'Booking', 'BookingHold', 'AdminUser', 'AuditLog', 'Enquiry', 'Donation', 'Payment'];
  const missing = want.filter((t) => !have.has(t));
  results.push(missing.length === 0
    ? { tag: 'OK', title: 'Schema tables', detail: `All ${want.length} expected tables present (${have.size} total).` }
    : { tag: 'FAIL', title: 'Schema tables', detail: `Missing: ${missing.join(', ')}` });

  // 3. Inventory shape — kunds live on Session, not directly on YagnaInstance.
  // Every Session inside a YagnaInstance should have exactly that yagna's kundCount,
  // and every Kund should have exactly 3 positions.
  const yi = await prisma.yagnaInstance.findMany({
    select: {
      yagnaType: true,
      kundCount: true,
      eventDay: { select: { date: true } },
      sessions: {
        select: {
          startTime: true,
          kunds: { select: { number: true, positions: { select: { id: true } } } }
        }
      }
    }
  });
  const shapeIssues: string[] = [];
  let sessionCount = 0;
  for (const y of yi) {
    const d = y.eventDay.date.toISOString().slice(0, 10);
    for (const s of y.sessions) {
      sessionCount++;
      if (s.kunds.length !== y.kundCount) {
        shapeIssues.push(`${d} ${y.yagnaType} ${s.startTime}: ${s.kunds.length} kunds (expected ${y.kundCount})`);
      }
      for (const k of s.kunds) {
        if (k.positions.length !== 3) {
          shapeIssues.push(`${d} ${y.yagnaType} ${s.startTime} kund ${k.number}: ${k.positions.length} positions (expected 3)`);
        }
      }
    }
  }
  results.push(shapeIssues.length === 0
    ? { tag: 'OK', title: 'Inventory shape', detail: `${yi.length} yagna instances · ${sessionCount} sessions; every kund has exactly 3 positions.` }
    : { tag: 'FAIL', title: 'Inventory shape', items: shapeIssues });

  // 4. Position status sanity — booked AND blocked
  const bookedAndBlocked = await prisma.kundPosition.findMany({
    where: { blocked: true, bookingId: { not: null } },
    select: {
      label: true,
      kund: { select: { number: true, session: { select: { yagnaInstance: { select: { yagnaType: true, eventDay: { select: { date: true } } } } } } } }
    }
  });
  results.push(bookedAndBlocked.length === 0
    ? { tag: 'OK', title: 'Booked + blocked conflict', detail: 'No positions are both booked AND blocked.' }
    : { tag: 'FAIL', title: 'Booked + blocked conflict',
        items: bookedAndBlocked.map((p) => `${p.kund.session.yagnaInstance.eventDay.date.toISOString().slice(0,10)} ${p.kund.session.yagnaInstance.yagnaType} kund ${p.kund.number}/${p.label}`) });

  // 5. Held + booked at same time
  const heldAndBooked = await prisma.kundPosition.findMany({
    where: { holdId: { not: null }, bookingId: { not: null } },
    select: { label: true, kund: { select: { number: true } } }
  });
  results.push(heldAndBooked.length === 0
    ? { tag: 'OK', title: 'Held + booked conflict', detail: 'No positions have both an active hold and a confirmed booking.' }
    : { tag: 'FAIL', title: 'Held + booked conflict', items: heldAndBooked.map((p) => `kund ${p.kund.number}/${p.label}`) });

  // 6. Stale holds (expired but still attached to positions)
  const expiredHoldsWithPositions = await prisma.bookingHold.findMany({
    where: { expiresAt: { lt: now }, heldPositions: { some: {} } },
    select: { id: true, expiresAt: true, email: true, heldPositions: { select: { id: true } } }
  });
  results.push(expiredHoldsWithPositions.length === 0
    ? { tag: 'OK', title: 'Expired holds', detail: 'No expired holds are still attached to positions.' }
    : { tag: 'WARN', title: 'Expired holds still attached',
        detail: `${expiredHoldsWithPositions.length} expired hold(s) still occupy positions. Inventory may show as taken incorrectly.`,
        items: expiredHoldsWithPositions.map((h) => `${h.id}: expired ${h.expiresAt.toISOString()} (${h.email}) — ${h.heldPositions.length} position(s)`) });

  // 7. Confirmed bookings own positions matching their declared count
  const bookings = await prisma.booking.findMany({
    where: { status: 'CONFIRMED' },
    select: { id: true, reference: true, primaryName: true, positions: true }
  });
  const ownedCounts = await prisma.kundPosition.groupBy({
    by: ['bookingId'], where: { bookingId: { not: null } }, _count: { _all: true }
  });
  const ownedMap = new Map(ownedCounts.map((o) => [o.bookingId!, o._count._all]));
  const mismatch: string[] = [];
  for (const b of bookings) {
    const actual = ownedMap.get(b.id) ?? 0;
    if (b.positions.length !== actual) {
      mismatch.push(`${b.reference} (${b.primaryName}): declared ${b.positions.length}, owns ${actual}`);
    }
  }
  results.push(mismatch.length === 0
    ? { tag: 'OK', title: 'Booking ↔ position consistency', detail: `${bookings.length} confirmed booking(s); position counts all match declared.` }
    : { tag: 'FAIL', title: 'Booking ↔ position mismatch', items: mismatch });

  // 8. Blocked positions have blockedAt + blockedBy
  const incompleteBlocks = await prisma.kundPosition.findMany({
    where: { blocked: true, OR: [{ blockedAt: null }, { blockedBy: null }] },
    select: { id: true, blockReason: true }
  });
  results.push(incompleteBlocks.length === 0
    ? { tag: 'OK', title: 'Block metadata', detail: 'Every blocked position has blockedAt + blockedBy filled.' }
    : { tag: 'WARN', title: 'Blocks missing metadata',
        detail: 'Likely legacy rows from before audit fields were enforced.',
        items: incompleteBlocks.map((p) => `${p.id} reason="${p.blockReason ?? ''}"`) });

  // 9. Audit log activity
  const auditCount = await prisma.auditLog.count();
  const lastAudit = await prisma.auditLog.findFirst({ orderBy: { createdAt: 'desc' }, select: { action: true, actor: true, createdAt: true } });
  results.push(lastAudit
    ? { tag: 'OK', title: 'Audit log', detail: `${auditCount} entries. Most recent: ${lastAudit.action} by ${lastAudit.actor} at ${lastAudit.createdAt.toISOString()}.` }
    : { tag: 'WARN', title: 'Audit log', detail: 'AuditLog is empty — no admin activity has been recorded.' });

  // 10. Snapshot counts
  const [eventDays, sessions, kunds, positions, totalBookings, confirmedBookings,
         pendingBookings, cancelledBookings, holdsActive, donations, enquiries] = await Promise.all([
    prisma.eventDay.count(),
    prisma.session.count(),
    prisma.kund.count(),
    prisma.kundPosition.count(),
    prisma.booking.count(),
    prisma.booking.count({ where: { status: 'CONFIRMED' } }),
    prisma.booking.count({ where: { status: 'PENDING_PAYMENT' } }),
    prisma.booking.count({ where: { status: 'CANCELLED' } }),
    prisma.bookingHold.count({ where: { expiresAt: { gt: now } } }),
    prisma.donation.count({ where: { status: 'SUCCEEDED' } }),
    prisma.enquiry.count()
  ]);
  results.push({
    tag: 'OK',
    title: 'Snapshot counts',
    items: [
      `Event days: ${eventDays}`,
      `Sessions: ${sessions}`,
      `Kunds: ${kunds}`,
      `Kund positions: ${positions}`,
      `Bookings — total: ${totalBookings} (confirmed ${confirmedBookings}, pending ${pendingBookings}, cancelled ${cancelledBookings})`,
      `Active holds (not expired): ${holdsActive}`,
      `Successful donations: ${donations}`,
      `Enquiries: ${enquiries}`
    ]
  });

  // 11. Per-day utilisation
  const perDay = await prisma.$queryRaw<{ day: Date; total: number; booked: number; blocked: number }[]>`
    SELECT
      ed.date AS day,
      COUNT(p.id)::int AS total,
      COUNT(p.id) FILTER (WHERE p."bookingId" IS NOT NULL)::int AS booked,
      COUNT(p.id) FILTER (WHERE p.blocked = true)::int AS blocked
    FROM "EventDay" ed
    JOIN "YagnaInstance" yi ON yi."eventDayId" = ed.id
    JOIN "Session" s ON s."yagnaInstanceId" = yi.id
    JOIN "Kund" k ON k."sessionId" = s.id
    JOIN "KundPosition" p ON p."kundId" = k.id
    GROUP BY ed.date
    ORDER BY ed.date
  `;
  results.push({
    tag: 'OK',
    title: 'Per-day utilisation',
    items: perDay.map((d) => {
      const free = d.total - d.booked - d.blocked;
      return `${d.day.toISOString().slice(0,10)} — ${d.total} total · ${d.booked} booked · ${d.blocked} blocked · ${free} free`;
    })
  });

  return results;
}

export default async function HealthPage() {
  const admin = await getAdminFromCookies();
  if (!admin) redirect('/admin/login');

  let checks: Check[] = [];
  let fatal: string | null = null;
  try {
    checks = await runChecks();
  } catch (e: unknown) {
    fatal = (e as Error).message;
  }

  const counts = checks.reduce(
    (acc, c) => { acc[c.tag]++; return acc; },
    { OK: 0, WARN: 0, FAIL: 0 } as Record<Tag, number>
  );

  return (
    <div className="min-h-screen bg-ivory-100">
      <header className="bg-gradient-to-b from-maroon-800 to-maroon-900 text-ivory-50 border-b border-gold-300/20">
        <div className="container-tight py-6 flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="eyebrow text-gold-200 mb-1">Diagnostic</p>
            <h1 className="h-display text-2xl md:text-3xl text-ivory-50">Database health</h1>
            <p className="text-xs text-ivory-100/85 mt-1">
              {counts.OK} ok · {counts.WARN} warning{counts.WARN === 1 ? '' : 's'} · {counts.FAIL} failure{counts.FAIL === 1 ? '' : 's'}
            </p>
          </div>
          <Link href="/admin" className="btn-ghost !text-ivory-100 hover:!bg-ivory-50/10">← Dashboard</Link>
        </div>
      </header>

      <main className="container-tight py-8 space-y-3">
        {fatal && (
          <div className="card p-5 border-2 border-rose-400 bg-rose-50 text-rose-900">
            <h2 className="font-semibold mb-1">Audit aborted</h2>
            <p className="text-sm">{fatal}</p>
          </div>
        )}
        {checks.map((c, i) => (
          <article key={i} className={`rounded-2xl border-2 p-4 ${TONES[c.tag]}`}>
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="font-semibold">{c.title}</h2>
              <span className={`inline-block px-2 py-0.5 text-[11px] rounded ${BADGE[c.tag]} font-semibold tracking-wide`}>
                {c.tag}
              </span>
            </div>
            {c.detail && <p className="text-sm mt-1">{c.detail}</p>}
            {c.items && c.items.length > 0 && (
              <ul className="mt-2 text-xs space-y-0.5 font-mono">
                {c.items.map((it, j) => (
                  <li key={j} className="before:content-['·_'] before:opacity-60">{it}</li>
                ))}
              </ul>
            )}
          </article>
        ))}
      </main>
    </div>
  );
}
