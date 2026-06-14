import { NextRequest, NextResponse } from 'next/server';
import { confirmBookingFromHold, cancelHold } from '@/lib/inventory';
import { completeDonation, failDonation } from '@/lib/donations';
import { prisma } from '@/lib/prisma';
import { sendAndAuditBookingConfirmation } from '@/lib/email';

export async function POST(req: NextRequest) {
  const event = await req.json();

  // NOTE: For production, verify with PayPal's /v1/notifications/verify-webhook-signature endpoint
  // using PAYPAL_WEBHOOK_ID. We accept the event here and rely on capture status as truth.

  if (event.event_type === 'CHECKOUT.ORDER.APPROVED' || event.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
    const resource = event.resource;
    const orderId = resource?.id ?? resource?.supplementary_data?.related_ids?.order_id;
    const holdId = resource?.purchase_units?.[0]?.custom_id ?? resource?.custom_id;
    if (!holdId) return NextResponse.json({ ok: true });

    // Branch: standalone donations carry a 'donation:<id>' prefix.
    if (typeof holdId === 'string' && holdId.startsWith('donation:')) {
      const donationId = holdId.slice('donation:'.length);
      try {
        await completeDonation({ donationId, provider: 'PAYPAL', providerRef: orderId, raw: event });
      } catch (e) { console.error('Donation confirm failed (PayPal)', e); }
      return NextResponse.json({ received: true });
    }

    const hold = await prisma.bookingHold.findUnique({ where: { id: holdId } });
    if (!hold) return NextResponse.json({ ok: true });

    const log = await prisma.auditLog.findFirst({
      where: { action: 'PAYPAL_ORDER_CREATED', target: holdId },
      orderBy: { createdAt: 'desc' }
    });
    const reg = (log?.meta as any)?.registration ?? {};

    const donationPence = Number(reg.donationPence ?? 0) || 0;

    try {
      const booking = await confirmBookingFromHold({
        holdId,
        primaryName: reg.primaryName ?? hold.primaryName,
        relation: reg.relation ?? 'INDIVIDUAL',
        email: reg.email ?? hold.email ?? null,
        phone: reg.phone ?? '',
        whatsappNumber: reg.whatsappNumber ?? null,
        secondParticipantName: reg.secondParticipantName ?? null,
        addressLine1: reg.addressLine1 ?? null,
        town: reg.town ?? null,
        postcode: reg.postcode ?? null,
        giftAid: !!reg.giftAid,
        donationPence,
        payment: { provider: 'PAYPAL', providerRef: orderId, status: 'SUCCEEDED', raw: event }
      });
      await sendAndAuditBookingConfirmation({
        bookingId: booking.id,
        actor: 'paypal-webhook',
        trigger: 'INITIAL'
      });
    } catch (e) { console.error('PayPal confirm failed', e); }
  }

  if (event.event_type === 'CHECKOUT.ORDER.VOIDED' || event.event_type === 'PAYMENT.CAPTURE.DENIED') {
    const holdId = event.resource?.purchase_units?.[0]?.custom_id ?? event.resource?.custom_id;
    if (holdId) {
      if (typeof holdId === 'string' && holdId.startsWith('donation:')) {
        await failDonation(holdId.slice('donation:'.length), event).catch(console.error);
      } else {
        await cancelHold(holdId).catch(console.error);
      }
    }
  }

  return NextResponse.json({ received: true });
}
