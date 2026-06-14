/**
 * Bulk re-send of confirmation emails to past CONFIRMED bookings that have an
 * email on file. Designed for the one-off "the audit log started today, please
 * make sure everyone got a confirmation" backfill.
 *
 * Two modes via the JSON body:
 *   { confirm: false }   → preview only — counts eligible bookings, sends nothing
 *   { confirm: true }    → actually sends, one Resend call per booking
 *
 * "Eligible" = CONFIRMED + has email + no prior EMAIL_SENT audit entry for that
 * booking ID. So a second run skips everyone the first run already emailed.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminFromCookies } from '@/lib/auth';
import { sendAndAuditBookingConfirmation } from '@/lib/email';

// Hard caps so an accidental click can't fan out to thousands of sends.
const PER_CALL_LIMIT = 500;
const RESEND_BATCH_DELAY_MS = 120;

export async function POST(req: NextRequest) {
  const admin = await getAdminFromCookies();
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const body = await req.json().catch(() => ({})) as { confirm?: boolean };
  const confirm = body.confirm === true;

  // 1. All CONFIRMED bookings with an email on file.
  const eligibleAll = await prisma.booking.findMany({
    where: { status: 'CONFIRMED', email: { not: null } },
    select: { id: true, reference: true, primaryName: true, email: true }
  });

  // 2. Filter out ones that already have an EMAIL_SENT audit entry for their ID.
  //    A second run after a previous successful backfill therefore sees nothing.
  const sentTargets = await prisma.auditLog.findMany({
    where: { action: 'EMAIL_SENT', target: { in: eligibleAll.map((b) => b.id) } },
    select: { target: true }
  });
  const alreadySentIds = new Set(sentTargets.map((s) => s.target).filter((t): t is string => !!t));
  const eligible = eligibleAll.filter((b) => !alreadySentIds.has(b.id));

  if (!confirm) {
    return NextResponse.json({
      mode: 'preview',
      eligibleCount: eligible.length,
      sample: eligible.slice(0, 10).map((b) => `${b.reference} — ${b.primaryName} <${b.email}>`),
      cappedAt: PER_CALL_LIMIT
    });
  }

  // 3. Send. Sequential with a small inter-call delay so we don't trip Resend's
  //    short-window rate limits. Errors per row are captured by the helper as
  //    EMAIL_FAILED audit rows, and we keep going.
  const targets = eligible.slice(0, PER_CALL_LIMIT);
  let sent = 0, skipped = 0, failed = 0;
  for (const b of targets) {
    const outcome = await sendAndAuditBookingConfirmation({
      bookingId: b.id,
      actor: admin.email,
      trigger: 'BACKFILL'
    });
    if (outcome.status === 'SENT') sent++;
    else if (outcome.status === 'SKIPPED') skipped++;
    else failed++;
    if (RESEND_BATCH_DELAY_MS > 0) await new Promise((r) => setTimeout(r, RESEND_BATCH_DELAY_MS));
  }

  await prisma.auditLog.create({
    data: {
      actor: admin.email,
      action: 'EMAIL_BULK_BACKFILL',
      target: null,
      meta: {
        attempted: targets.length,
        sent,
        skipped,
        failed,
        totalEligibleAtStart: eligible.length,
        cappedAt: PER_CALL_LIMIT
      }
    }
  });

  return NextResponse.json({
    mode: 'sent',
    attempted: targets.length,
    sent,
    skipped,
    failed,
    remaining: eligible.length - targets.length
  });
}
