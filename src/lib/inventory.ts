/**
 * Inventory engine — the only place where seat availability changes.
 *
 * Truth lives in KundPosition: a position is FREE when both bookingId and
 * holdId are NULL. Every mutation runs inside a serializable Postgres
 * transaction so two concurrent users cannot claim the same seat.
 *
 * Public API:
 *   - getSessionAvailability(sessionId)  → grid the UI renders
 *   - sweepExpiredHolds()                → releases expired holds (idempotent)
 *   - createHold(...)                    → 10-min reservation
 *   - confirmBookingFromHold(...)        → called by payment webhooks
 *   - cancelHold(holdId)                 → user abandoned / payment failed
 *   - cancelBooking(bookingId, reason)   → admin action
 *   - adminCreateConfirmedBooking(...)   → manual add (skips payment)
 */
import { Prisma, BookingStatus, BookingType, PaymentProvider, PaymentStatus, Relation } from '@prisma/client';
import { prisma } from './prisma';
import { HOLD_MS, POSITION_LABELS, PRICE_FULL_KUND_PENCE, PRICE_SINGLE_PENCE, PositionLabel, SESSION_CAPACITY } from './constants';
import { bookingReference } from './utils';

export type PositionState = 'FREE' | 'HELD' | 'BOOKED';
export interface PositionView {
  id: string;
  label: PositionLabel;
  state: PositionState;
  bookingRef?: string;
  bookedBy?: string;
}
export interface KundView {
  id: string;
  number: number;
  positions: PositionView[];
  fullyFree: boolean;       // all A/B/C are FREE → "Full Kund" selectable
}
export interface SessionAvailability {
  sessionId: string;
  date: string;             // ISO yyyy-mm-dd
  startTime: string;        // "10:15"
  remaining: number;        // free positions
  capacity: number;         // 33
  kunds: KundView[];
}

/* ───────────────────────── Reads ───────────────────────── */

export async function getSessionAvailability(sessionId: string): Promise<SessionAvailability | null> {
  await sweepExpiredHolds();

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      eventDay: true,
      kunds: {
        orderBy: { number: 'asc' },
        include: {
          positions: {
            orderBy: { label: 'asc' },
            include: {
              booking: { select: { reference: true, primaryName: true } }
            }
          }
        }
      }
    }
  });
  if (!session) return null;

  let remaining = 0;
  const kunds: KundView[] = session.kunds.map((k) => {
    const positions: PositionView[] = k.positions.map((p) => {
      let state: PositionState = 'FREE';
      if (p.bookingId) state = 'BOOKED';
      else if (p.holdId) state = 'HELD';
      if (state === 'FREE') remaining++;
      return {
        id: p.id,
        label: p.label as PositionLabel,
        state,
        bookingRef: p.booking?.reference,
        bookedBy: p.booking?.primaryName
      };
    });
    return {
      id: k.id,
      number: k.number,
      positions,
      fullyFree: positions.every((p) => p.state === 'FREE')
    };
  });

  return {
    sessionId: session.id,
    date: session.eventDay.date.toISOString().slice(0, 10),
    startTime: session.startTime,
    remaining,
    capacity: SESSION_CAPACITY,
    kunds
  };
}

/* ───────────────────────── Hold ───────────────────────── */

export class InventoryError extends Error {
  constructor(public code: 'SESSION_NOT_FOUND' | 'POSITIONS_TAKEN' | 'FULL_KUND_UNAVAILABLE' | 'INVALID_REQUEST' | 'HOLD_EXPIRED' | 'HOLD_NOT_FOUND' | 'BOOKING_NOT_FOUND', message: string) {
    super(message);
  }
}

interface CreateHoldArgs {
  sessionId: string;
  bookingType: BookingType;
  kundNumber: number;
  positions: PositionLabel[];     // if FULL_KUND, callers can pass ["A","B","C"] or [] — we normalise
  email: string;
  primaryName: string;
}

export async function createHold(args: CreateHoldArgs) {
  const positions: PositionLabel[] =
    args.bookingType === 'FULL_KUND' ? [...POSITION_LABELS] : args.positions;

  if (args.bookingType === 'SINGLE_POSITION' && positions.length !== 1) {
    throw new InventoryError('INVALID_REQUEST', 'Single position booking requires exactly one position.');
  }
  if (args.bookingType === 'FULL_KUND' && positions.length !== 3) {
    throw new InventoryError('INVALID_REQUEST', 'Full Kund booking requires all three positions.');
  }

  await sweepExpiredHolds();

  return prisma.$transaction(async (tx) => {
    const session = await tx.session.findUnique({
      where: { id: args.sessionId },
      include: { eventDay: true, kunds: { where: { number: args.kundNumber }, include: { positions: true } } }
    });
    if (!session) throw new InventoryError('SESSION_NOT_FOUND', 'Session not found.');
    if (!session.eventDay.isActive) throw new InventoryError('INVALID_REQUEST', 'This day is not open for booking.');

    const kund = session.kunds[0];
    if (!kund) throw new InventoryError('INVALID_REQUEST', `Kund ${args.kundNumber} does not exist in this session.`);

    const targetPositions = kund.positions.filter((p) => positions.includes(p.label as PositionLabel));
    if (targetPositions.length !== positions.length) {
      throw new InventoryError('INVALID_REQUEST', 'Some positions do not exist.');
    }

    const takenList = targetPositions.filter((p) => p.bookingId || p.holdId);
    if (args.bookingType === 'FULL_KUND' && takenList.length > 0) {
      throw new InventoryError('FULL_KUND_UNAVAILABLE', 'Full Kund booking is only available when all three positions are free.');
    }
    if (takenList.length > 0) {
      throw new InventoryError('POSITIONS_TAKEN', `Positions already taken: ${takenList.map((p) => p.label).join(', ')}.`);
    }

    const amountPence = args.bookingType === 'FULL_KUND' ? PRICE_FULL_KUND_PENCE : PRICE_SINGLE_PENCE * positions.length;
    const expiresAt = new Date(Date.now() + HOLD_MS);

    const hold = await tx.bookingHold.create({
      data: {
        sessionId: session.id,
        bookingType: args.bookingType,
        kundNumber: args.kundNumber,
        positions,
        amountPence,
        email: args.email,
        primaryName: args.primaryName,
        expiresAt
      }
    });

    const updated = await tx.kundPosition.updateMany({
      where: {
        id: { in: targetPositions.map((p) => p.id) },
        bookingId: null,
        holdId: null
      },
      data: { holdId: hold.id }
    });
    if (updated.count !== positions.length) {
      // someone raced us — rollback by throwing
      throw new InventoryError('POSITIONS_TAKEN', 'Selected positions were just taken. Please pick again.');
    }

    return { hold, amountPence, expiresAt };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

/* ───────────────────────── Confirm ───────────────────────── */

interface ConfirmFromHoldArgs {
  holdId: string;
  primaryName: string;
  relation: Relation;
  email: string;
  phone: string;
  secondParticipantName?: string | null;
  donationPence?: number;
  payment: { provider: PaymentProvider; providerRef?: string; status: PaymentStatus; raw?: unknown };
}

export async function confirmBookingFromHold(args: ConfirmFromHoldArgs) {
  return prisma.$transaction(async (tx) => {
    const hold = await tx.bookingHold.findUnique({
      where: { id: args.holdId },
      include: { heldPositions: true, session: { include: { eventDay: true } } }
    });
    if (!hold) throw new InventoryError('HOLD_NOT_FOUND', 'Hold no longer exists.');
    if (hold.expiresAt < new Date()) throw new InventoryError('HOLD_EXPIRED', 'Your reservation expired. Please book again.');

    const existing = await tx.booking.findUnique({ where: { holdId: hold.id } });
    if (existing) return existing; // idempotent — webhook may fire twice

    const donationPence = Math.max(0, args.donationPence ?? 0);
    const booking = await tx.booking.create({
      data: {
        reference: bookingReference(process.env.EVENT_YEAR ?? '2026'),
        sessionId: hold.sessionId,
        holdId: hold.id,
        bookingType: hold.bookingType,
        kundNumber: hold.kundNumber,
        positions: hold.positions,
        amountPence: hold.amountPence,
        donationPence,
        status: 'CONFIRMED' as BookingStatus,
        primaryName: args.primaryName,
        relation: args.relation,
        email: args.email,
        phone: args.phone,
        secondParticipantName: args.secondParticipantName ?? null,
        confirmedAt: new Date(),
        payment: {
          create: {
            provider: args.payment.provider,
            providerRef: args.payment.providerRef,
            amountPence: hold.amountPence + donationPence,
            status: args.payment.status,
            rawWebhook: (args.payment.raw as Prisma.InputJsonValue) ?? undefined
          }
        }
      }
    });

    await tx.kundPosition.updateMany({
      where: { holdId: hold.id },
      data: { bookingId: booking.id, holdId: null }
    });

    return booking;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

/* ───────────────────────── Cancel / Release ───────────────────────── */

export async function cancelHold(holdId: string) {
  return prisma.$transaction(async (tx) => {
    await tx.kundPosition.updateMany({ where: { holdId }, data: { holdId: null } });
    await tx.bookingHold.deleteMany({ where: { id: holdId, booking: null } });
  });
}

export async function cancelBooking(bookingId: string, reason: string, actor: string) {
  return prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new InventoryError('BOOKING_NOT_FOUND', 'Booking not found.');
    await tx.kundPosition.updateMany({ where: { bookingId }, data: { bookingId: null } });
    await tx.booking.update({
      where: { id: bookingId },
      data: { status: 'CANCELLED', cancelledAt: new Date(), cancelReason: reason }
    });
    await tx.auditLog.create({
      data: { actor, action: 'CANCEL_BOOKING', target: bookingId, meta: { reason } }
    });
  });
}

export async function sweepExpiredHolds() {
  const expired = await prisma.bookingHold.findMany({
    where: { expiresAt: { lt: new Date() }, booking: null },
    select: { id: true }
  });
  if (expired.length === 0) return 0;
  await prisma.$transaction(async (tx) => {
    const ids = expired.map((h) => h.id);
    await tx.kundPosition.updateMany({ where: { holdId: { in: ids } }, data: { holdId: null } });
    await tx.bookingHold.deleteMany({ where: { id: { in: ids } } });
  });
  return expired.length;
}

/* ───────────────────────── Admin manual booking ───────────────────────── */

interface AdminCreateArgs {
  sessionId: string;
  bookingType: BookingType;
  kundNumber: number;
  positions: PositionLabel[];
  primaryName: string;
  relation: Relation;
  email: string;
  phone: string;
  secondParticipantName?: string | null;
  actor: string;
}

export async function adminCreateConfirmedBooking(args: AdminCreateArgs) {
  // Re-use createHold + confirm in one transaction by skipping payment.
  const positions: PositionLabel[] =
    args.bookingType === 'FULL_KUND' ? [...POSITION_LABELS] : args.positions;
  const amountPence = args.bookingType === 'FULL_KUND' ? PRICE_FULL_KUND_PENCE : PRICE_SINGLE_PENCE * positions.length;

  return prisma.$transaction(async (tx) => {
    const kund = await tx.kund.findUnique({
      where: { sessionId_number: { sessionId: args.sessionId, number: args.kundNumber } },
      include: { positions: true }
    });
    if (!kund) throw new InventoryError('INVALID_REQUEST', `Kund ${args.kundNumber} not found.`);
    const targets = kund.positions.filter((p) => positions.includes(p.label as PositionLabel));
    const taken = targets.filter((p) => p.bookingId || p.holdId);
    if (taken.length > 0) throw new InventoryError('POSITIONS_TAKEN', `Already taken: ${taken.map((t) => t.label).join(', ')}`);

    const booking = await tx.booking.create({
      data: {
        reference: bookingReference(process.env.EVENT_YEAR ?? '2026'),
        sessionId: args.sessionId,
        bookingType: args.bookingType,
        kundNumber: args.kundNumber,
        positions,
        amountPence,
        status: 'CONFIRMED' as BookingStatus,
        primaryName: args.primaryName,
        relation: args.relation,
        email: args.email,
        phone: args.phone,
        secondParticipantName: args.secondParticipantName ?? null,
        confirmedAt: new Date(),
        payment: {
          create: {
            provider: 'ADMIN_MANUAL' as PaymentProvider,
            amountPence,
            status: 'SUCCEEDED' as PaymentStatus
          }
        }
      }
    });
    await tx.kundPosition.updateMany({
      where: { id: { in: targets.map((t) => t.id) } },
      data: { bookingId: booking.id }
    });
    await tx.auditLog.create({
      data: { actor: args.actor, action: 'ADMIN_CREATE_BOOKING', target: booking.id, meta: { positions, kund: args.kundNumber } }
    });
    return booking;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}
