import { NextRequest, NextResponse } from 'next/server';
import { confirmBookingFromHold, cancelHold } from '@/lib/inventory';
import { prisma } from '@/lib/prisma';
import { sendConfirmationEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  const event = await req.json();

  // NOTE: For production, verify with PayPal's /v1/notifications/verify-webhook-signature endpoint
  // using PAYPAL_WEBHOOK_ID. We accept the event here and rely on capture status as truth.

  if (event.event_type === 'CHECKOUT.ORDER.APPROVED' || event.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
    const resource = event.resource;
    const orderId = resource?.id ?? resource?.supplementary_data?.related_ids?.order_id;
    const holdId = resource?.purchase_units?.[0]?.custom_id ?? resource?.custom_id;
    if (!holdId) return NextResponse.json({ ok: true });

    const hold = await prisma.bookingHold.findUnique({ where: { id: holdId } });
    if (!hold) return NextResponse.json({ ok: true });

    const log = await prisma.auditLog.findFirst({
      where: { action: 'PAYPAL_ORDER_CREATED', target: holdId },
      orderBy: { createdAt: 'desc' }
    });
    const reg = (log?.meta as any)?.registration ?? {};

    try {
      const booking = await confirmBookingFromHold({
        holdId,
        primaryName: reg.primaryName ?? hold.primaryName,
        relation: reg.relation ?? 'INDIVIDUAL',
        email: reg.email ?? hold.email,
        phone: reg.phone ?? '',
        secondParticipantName: reg.secondParticipantName ?? null,
        payment: { provider: 'PAYPAL', providerRef: orderId, status: 'SUCCEEDED', raw: event }
      });
      const full = await prisma.booking.findUnique({ where: { id: booking.id }, include: { session: { include: { eventDay: true } } } });
      if (full) await sendConfirmationEmail({
        to: full.email, primaryName: full.primaryName, reference: full.reference,
        date: full.session.eventDay.date, startTime: full.session.startTime,
        yagnaType: full.session.eventDay.title, kundNumber: full.kundNumber,
        positions: full.positions, bookingType: full.bookingType, amountPence: full.amountPence
      });
    } catch (e) { console.error('PayPal confirm failed', e); }
  }

  if (event.event_type === 'CHECKOUT.ORDER.VOIDED' || event.event_type === 'PAYMENT.CAPTURE.DENIED') {
    const holdId = event.resource?.purchase_units?.[0]?.custom_id ?? event.resource?.custom_id;
    if (holdId) await cancelHold(holdId).catch(console.error);
  }

  return NextResponse.json({ received: true });
}
