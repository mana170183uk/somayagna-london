import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getAdminFromCookies } from '@/lib/auth';
import { clientIp, userAgent } from '@/lib/audit';

const POSITION = z.enum(['A', 'B', 'C']);

const bodySchema = z.object({
  targetKundNumber: z.number().int().min(1).max(13),
  targetPositions: z.array(POSITION).min(1).max(3)
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminFromCookies();
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const { id } = await params;
  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'INVALID', issues: parsed.error.issues }, { status: 400 });
  }
  const { targetKundNumber, targetPositions } = parsed.data;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id },
        select: { id: true, sessionId: true, bookingType: true, kundNumber: true, positions: true, status: true, reference: true }
      });
      if (!booking) throw new Error('NOT_FOUND');
      if (booking.status !== 'CONFIRMED') throw new Error('NOT_CONFIRMED');

      // Booking-type integrity: target count must match the booking type
      if (booking.bookingType === 'FULL_KUND' && targetPositions.length !== 3) {
        throw new Error('FULL_KUND_NEEDS_3');
      }
      if (booking.bookingType === 'SINGLE_POSITION' && targetPositions.length !== booking.positions.length) {
        throw new Error('SIZE_MISMATCH');
      }

      // No-op move? Refuse with a clear message so admin doesn't think it worked.
      const sortedNew = [...targetPositions].sort().join(',');
      const sortedOld = [...booking.positions].sort().join(',');
      if (targetKundNumber === booking.kundNumber && sortedNew === sortedOld) {
        throw new Error('SAME_LOCATION');
      }

      // Target kund must exist in the SAME session
      const targetKund = await tx.kund.findUnique({
        where: { sessionId_number: { sessionId: booking.sessionId, number: targetKundNumber } },
        include: { positions: true }
      });
      if (!targetKund) throw new Error('TARGET_KUND_NOT_FOUND');

      const targets = targetKund.positions.filter((p) => targetPositions.includes(p.label as 'A' | 'B' | 'C'));
      if (targets.length !== targetPositions.length) throw new Error('TARGET_POSITION_NOT_FOUND');

      // Every target must be FREE — or already owned by THIS booking (lets a 2-of-3 booking
      // reshape within its own kund if ever needed). Reject if owned by anyone else,
      // held, or blocked.
      const conflicts = targets.filter(
        (p) => (p.bookingId && p.bookingId !== booking.id) || p.holdId || p.blocked
      );
      if (conflicts.length > 0) {
        throw new Error(`CONFLICT:${conflicts.map((c) => c.label).join(',')}`);
      }

      // Release the booking's current positions
      await tx.kundPosition.updateMany({
        where: { bookingId: booking.id },
        data: { bookingId: null }
      });
      // Claim the new positions atomically — guards against a race during the
      // brief window we just opened above.
      const claimed = await tx.kundPosition.updateMany({
        where: {
          id: { in: targets.map((t) => t.id) },
          bookingId: null,
          holdId: null,
          blocked: false
        },
        data: { bookingId: booking.id }
      });
      if (claimed.count !== targets.length) throw new Error('RACE_LOST');

      // Update the booking's own kundNumber + positions array (printed on emails/CSV)
      await tx.booking.update({
        where: { id: booking.id },
        data: { kundNumber: targetKundNumber, positions: targetPositions }
      });

      return {
        reference: booking.reference,
        from: { kundNumber: booking.kundNumber, positions: booking.positions },
        to:   { kundNumber: targetKundNumber, positions: targetPositions }
      };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    await prisma.auditLog.create({
      data: {
        actor: admin.email,
        action: 'MOVE_BOOKING',
        target: id,
        ipAddress: clientIp(req),
        userAgent: userAgent(req),
        meta: { reference: result.reference, from: result.from, to: result.to }
      }
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    const map: Record<string, { code: string; status: number; message: string }> = {
      NOT_FOUND:                 { code: 'NOT_FOUND', status: 404, message: 'Booking not found.' },
      NOT_CONFIRMED:             { code: 'NOT_CONFIRMED', status: 409, message: 'Only confirmed bookings can be moved.' },
      FULL_KUND_NEEDS_3:         { code: 'INVALID', status: 400, message: 'Full Kund booking must target all three positions (A, B, C).' },
      SIZE_MISMATCH:             { code: 'INVALID', status: 400, message: 'Number of target positions must match the booking.' },
      SAME_LOCATION:             { code: 'NO_CHANGE', status: 400, message: 'Booking is already at that kund and positions — nothing to move.' },
      TARGET_KUND_NOT_FOUND:     { code: 'INVALID', status: 400, message: 'Target kund does not exist in this session.' },
      TARGET_POSITION_NOT_FOUND: { code: 'INVALID', status: 400, message: 'One or more target positions do not exist.' },
      RACE_LOST:                 { code: 'CONFLICT', status: 409, message: 'Someone just claimed one of those positions. Please pick again.' }
    };
    if (msg.startsWith('CONFLICT:')) {
      return NextResponse.json({ error: 'CONFLICT', message: `Target positions unavailable: ${msg.slice(9)}.` }, { status: 409 });
    }
    if (map[msg]) {
      const m = map[msg];
      return NextResponse.json({ error: m.code, message: m.message }, { status: m.status });
    }
    console.error('[move-booking] INTERNAL', msg, e);
    return NextResponse.json({ error: 'INTERNAL', message: msg }, { status: 500 });
  }
}
