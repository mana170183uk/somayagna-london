// Read-only DB health audit. Runs a series of integrity checks against
// the live database via the Prisma client. No writes, no schema changes.
// Usage:  node --env-file=.env scripts/db-health.mjs
//
// Reports go to stdout. Anything tagged [FAIL] is worth investigating;
// anything tagged [WARN] is informational; [OK] means the check passed.

import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

const out = [];
const push = (tag, msg, extra) => out.push({ tag, msg, extra });

function fmt() {
  for (const r of out) {
    const tag = r.tag.padEnd(6);
    console.log(`${tag} ${r.msg}`);
    if (r.extra && r.extra.length) {
      for (const e of r.extra.slice(0, 10)) {
        console.log(`        · ${typeof e === 'string' ? e : JSON.stringify(e)}`);
      }
      if (r.extra.length > 10) console.log(`        … and ${r.extra.length - 10} more`);
    }
  }
}

try {
  // 1. Connectivity
  const [{ now: serverNow }] = await db.$queryRaw`SELECT NOW() AS now`;
  push('[OK]', `Connected to Neon. Server time: ${new Date(serverNow).toISOString()}`);

  // 2. Table presence (sample expected tables)
  const tables = await db.$queryRaw`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' ORDER BY tablename
  `;
  const have = new Set(tables.map((t) => t.tablename));
  const want = [
    'EventDay', 'YagnaInstance', 'Session', 'Kund', 'KundPosition',
    'Booking', 'BookingHold', 'AdminUser', 'AuditLog', 'Enquiry', 'Donation', 'Payment'
  ];
  const missing = want.filter((t) => !have.has(t));
  if (missing.length === 0) push('[OK]', `All ${want.length} expected tables present (${have.size} total in schema).`);
  else push('[FAIL]', `Missing tables: ${missing.join(', ')}`);

  // 3. Inventory shape — each YagnaInstance should have kundCount kunds
  const yi = await db.yagnaInstance.findMany({
    select: { id: true, yagnaType: true, kundCount: true, eventDay: { select: { date: true } }, kunds: { select: { id: true, positions: { select: { id: true } } } } }
  });
  const shapeMismatches = [];
  for (const y of yi) {
    if (y.kunds.length !== y.kundCount) {
      shapeMismatches.push(`${y.eventDay.date.toISOString().slice(0,10)} ${y.yagnaType}: ${y.kunds.length} kunds (expected ${y.kundCount})`);
    }
    for (const k of y.kunds) {
      if (k.positions.length !== 3) {
        shapeMismatches.push(`${y.eventDay.date.toISOString().slice(0,10)} ${y.yagnaType} kund ${k.id}: ${k.positions.length} positions (expected 3)`);
      }
    }
  }
  if (shapeMismatches.length === 0) push('[OK]', `Inventory shape correct across ${yi.length} yagna instances. Each kund has 3 positions.`);
  else push('[FAIL]', `Inventory shape mismatches:`, shapeMismatches);

  // 4. Position status sanity — should never have both bookingId AND blocked
  const conflictBookedBlocked = await db.kundPosition.findMany({
    where: { blocked: true, bookingId: { not: null } },
    select: { id: true, label: true, kund: { select: { number: true, session: { select: { yagnaInstance: { select: { yagnaType: true, eventDay: { select: { date: true } } } } } } } } }
  });
  if (conflictBookedBlocked.length === 0) push('[OK]', 'No positions are both booked AND blocked.');
  else push('[FAIL]', `${conflictBookedBlocked.length} positions are both booked AND blocked:`,
    conflictBookedBlocked.map((p) => `${p.kund.session.yagnaInstance.eventDay.date.toISOString().slice(0,10)} ${p.kund.session.yagnaInstance.yagnaType} kund ${p.kund.number}/${p.label}`));

  // 5. Held AND booked at the same time
  const conflictHeldBooked = await db.kundPosition.findMany({
    where: { holdId: { not: null }, bookingId: { not: null } },
    select: { id: true, label: true, kund: { select: { number: true } } }
  });
  if (conflictHeldBooked.length === 0) push('[OK]', 'No positions have both an active hold AND a confirmed booking.');
  else push('[FAIL]', `${conflictHeldBooked.length} positions are both held and booked.`,
    conflictHeldBooked.map((p) => `kund ${p.kund.number}/${p.label}`));

  // 6. Stale holds (expired but still attached)
  const now = new Date();
  const staleHolds = await db.bookingHold.findMany({
    where: { expiresAt: { lt: now }, status: 'ACTIVE' },
    select: { id: true, expiresAt: true, email: true }
  });
  if (staleHolds.length === 0) push('[OK]', 'No expired holds still marked ACTIVE.');
  else push('[WARN]', `${staleHolds.length} holds are past their expiresAt but still ACTIVE (cleanup job lagging or absent).`,
    staleHolds.map((h) => `${h.id} expired ${h.expiresAt.toISOString()} (${h.email})`));

  // 7. Bookings without positions (would mean booking owns nothing)
  const orphanBookings = await db.booking.findMany({
    where: { status: 'CONFIRMED', positionsOwned: { none: {} } },
    select: { id: true, reference: true, primaryName: true }
  }).catch(() => null);
  if (orphanBookings === null) {
    // relation name might differ — fall back to manual check
    const confirmed = await db.booking.findMany({ where: { status: 'CONFIRMED' }, select: { id: true, reference: true, primaryName: true } });
    const positionsOwned = await db.kundPosition.groupBy({ by: ['bookingId'], where: { bookingId: { not: null } }, _count: { _all: true } });
    const owned = new Set(positionsOwned.map((p) => p.bookingId));
    const orphans = confirmed.filter((b) => !owned.has(b.id));
    if (orphans.length === 0) push('[OK]', `All ${confirmed.length} confirmed bookings own at least one position.`);
    else push('[FAIL]', `${orphans.length} CONFIRMED bookings own NO positions:`,
      orphans.map((b) => `${b.reference} (${b.primaryName})`));
  } else {
    if (orphanBookings.length === 0) push('[OK]', 'All confirmed bookings own at least one position.');
    else push('[FAIL]', `${orphanBookings.length} CONFIRMED bookings own no positions.`, orphanBookings.map((b) => b.reference));
  }

  // 8. Position count per booking vs declared positions array
  const bookings = await db.booking.findMany({
    where: { status: 'CONFIRMED' },
    select: { id: true, reference: true, primaryName: true, positions: true }
  });
  const ownedCounts = await db.kundPosition.groupBy({
    by: ['bookingId'],
    where: { bookingId: { not: null } },
    _count: { _all: true }
  });
  const ownedMap = new Map(ownedCounts.map((o) => [o.bookingId, o._count._all]));
  const declaredMismatch = [];
  for (const b of bookings) {
    const declared = b.positions.length;
    const actual = ownedMap.get(b.id) ?? 0;
    if (declared !== actual) declaredMismatch.push(`${b.reference} (${b.primaryName}): declared ${declared} positions, actually owns ${actual}`);
  }
  if (declaredMismatch.length === 0) push('[OK]', `All ${bookings.length} confirmed bookings own exactly the declared number of positions.`);
  else push('[FAIL]', `Position-count mismatches:`, declaredMismatch);

  // 9. Blocked positions must have a blockedAt + blockedBy
  const incompleteBlocks = await db.kundPosition.findMany({
    where: { blocked: true, OR: [{ blockedAt: null }, { blockedBy: null }] },
    select: { id: true, label: true, blockReason: true }
  });
  if (incompleteBlocks.length === 0) push('[OK]', 'Every blocked position has blockedAt + blockedBy metadata.');
  else push('[WARN]', `${incompleteBlocks.length} blocked positions missing blockedAt or blockedBy (likely legacy):`,
    incompleteBlocks.map((p) => `${p.id} reason="${p.blockReason ?? ''}"`));

  // 10. AuditLog growth + most recent entry
  const auditCount = await db.auditLog.count();
  const recent = await db.auditLog.findFirst({ orderBy: { createdAt: 'desc' }, select: { action: true, actor: true, createdAt: true } });
  if (recent) push('[OK]', `${auditCount} audit-log entries. Most recent: ${recent.action} by ${recent.actor} at ${recent.createdAt.toISOString()}.`);
  else push('[WARN]', 'AuditLog is empty.');

  // 11. Counts summary
  const [eventDays, sessions, kunds, positions, totalBookings, confirmedBookings, pendingBookings, holdsActive, donations, enquiries] = await Promise.all([
    db.eventDay.count(), db.session.count(), db.kund.count(), db.kundPosition.count(),
    db.booking.count(), db.booking.count({ where: { status: 'CONFIRMED' } }), db.booking.count({ where: { status: 'PENDING_PAYMENT' } }),
    db.bookingHold.count({ where: { status: 'ACTIVE', expiresAt: { gt: now } } }),
    db.donation.count({ where: { status: 'COMPLETED' } }), db.enquiry.count()
  ]);
  push('[OK]', 'Snapshot counts:', [
    `EventDays: ${eventDays}`, `Sessions: ${sessions}`, `Kunds: ${kunds}`, `KundPositions: ${positions}`,
    `Bookings total: ${totalBookings} (confirmed ${confirmedBookings}, pending ${pendingBookings})`,
    `Active holds (live): ${holdsActive}`,
    `Successful donations: ${donations}`, `Enquiries: ${enquiries}`
  ]);

  // 12. Inventory utilisation per event day
  const positionsByDay = await db.$queryRaw`
    SELECT
      ed.date::date AS day,
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
  push('[OK]', 'Per-day utilisation (total / booked / blocked):',
    positionsByDay.map((d) => `${d.day.toISOString().slice(0,10)}: ${d.total} total, ${d.booked} booked, ${d.blocked} blocked`));
} catch (err) {
  push('[FAIL]', `Audit aborted with error: ${err.message}`);
} finally {
  fmt();
  await db.$disconnect();
}
