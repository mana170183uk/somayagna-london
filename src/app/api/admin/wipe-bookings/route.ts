import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAdminFromCookies } from '@/lib/auth';

/**
 * One-time housekeeping endpoint: deletes ALL bookings, payments and holds,
 * and releases every Kund position back to FREE. Keeps the schema and
 * seed data (event days, yagnas, sessions, kunds, positions, admin users,
 * audit log) intact.
 *
 * Intended for use immediately before go-live, to clear test bookings
 * created during development.
 *
 * Requires:
 *   - Admin session cookie (signed in via /admin/login)
 *   - Body: { confirm: "WIPE-ALL-BOOKINGS" }   — typo-safe sentinel
 */
const bodySchema = z.object({ confirm: z.literal('WIPE-ALL-BOOKINGS') });

export async function POST(req: NextRequest) {
  const admin = await getAdminFromCookies();
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'CONFIRM_REQUIRED', message: 'Send { "confirm": "WIPE-ALL-BOOKINGS" } to perform this destructive action.' }, { status: 400 });

  const counts = await prisma.$transaction(async (tx) => {
    // 1. Release every Kund position
    const releasedPositions = await tx.kundPosition.updateMany({
      where: { OR: [{ bookingId: { not: null } }, { holdId: { not: null } }] },
      data: { bookingId: null, holdId: null }
    });

    // 2. Delete payments (cascade-from-booking would also do this, but explicit is clearer)
    const deletedPayments = await tx.payment.deleteMany({});

    // 3. Delete bookings
    const deletedBookings = await tx.booking.deleteMany({});

    // 4. Delete holds (both expired and active)
    const deletedHolds = await tx.bookingHold.deleteMany({});

    // 5. Audit log this destructive action
    await tx.auditLog.create({
      data: {
        actor: admin.email,
        action: 'WIPE_ALL_BOOKINGS',
        meta: {
          releasedPositions: releasedPositions.count,
          deletedPayments: deletedPayments.count,
          deletedBookings: deletedBookings.count,
          deletedHolds: deletedHolds.count
        }
      }
    });

    return {
      releasedPositions: releasedPositions.count,
      deletedPayments: deletedPayments.count,
      deletedBookings: deletedBookings.count,
      deletedHolds: deletedHolds.count
    };
  });

  return NextResponse.json({ ok: true, ...counts });
}
