import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { confirmBookingFromHold, cancelHold } from '@/lib/inventory';
import { completeDonation, failDonation } from '@/lib/donations';
import { prisma } from '@/lib/prisma';
import { sendAndAuditBookingConfirmation } from '@/lib/email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const stripe = getStripe();
  const sig = req.headers.get('stripe-signature');
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const raw = await req.text();
  if (!sig || !secret) return NextResponse.json({ error: 'NO_SIG' }, { status: 400 });

  let event;
  try { event = stripe.webhooks.constructEvent(raw, sig, secret); }
  catch (e) { return NextResponse.json({ error: 'BAD_SIG' }, { status: 400 }); }

  if (event.type === 'checkout.session.completed') {
    const s = event.data.object as any;
    const holdId = s.metadata?.holdId;
    if (!holdId) return NextResponse.json({ ok: true });

    // Branch: standalone donations (via /donate) carry a 'donation:<id>' prefix
    // in their checkout metadata.holdId. Bookings carry the raw hold id.
    if (typeof holdId === 'string' && holdId.startsWith('donation:')) {
      const donationId = holdId.slice('donation:'.length);
      try {
        await completeDonation({ donationId, provider: 'STRIPE', providerRef: s.id, raw: s });
      } catch (e) { console.error('Donation confirm failed', e); }
      return NextResponse.json({ received: true });
    }

    const hold = await prisma.bookingHold.findUnique({ where: { id: holdId } });
    if (!hold) return NextResponse.json({ ok: true });

    // Look up the registration we stashed when we created the checkout session
    const regLog = await prisma.auditLog.findFirst({
      where: { action: 'STRIPE_REGISTRATION', target: holdId },
      orderBy: { createdAt: 'desc' }
    });
    const reg = (regLog?.meta as any)?.registration ?? {};

    // Donation: prefer fresh value from Stripe session metadata, fall back to stashed registration
    const donationPence = Number(s.metadata?.donationPence ?? reg.donationPence ?? 0) || 0;

    try {
      const booking = await confirmBookingFromHold({
        holdId,
        primaryName: reg.primaryName ?? hold.primaryName,
        relation: reg.relation ?? 'INDIVIDUAL',
        email: reg.email ?? hold.email ?? null,
        phone: reg.phone ?? s.customer_details?.phone ?? '',
        whatsappNumber: reg.whatsappNumber ?? null,
        secondParticipantName: reg.secondParticipantName ?? null,
        addressLine1: reg.addressLine1 ?? null,
        town: reg.town ?? null,
        postcode: reg.postcode ?? null,
        giftAid: !!reg.giftAid,
        donationPence,
        payment: { provider: 'STRIPE', providerRef: s.id, status: 'SUCCEEDED', raw: s }
      });
      await sendAndAuditBookingConfirmation({
        bookingId: booking.id,
        actor: 'stripe-webhook',
        trigger: 'INITIAL'
      });
    } catch (e) { console.error('Stripe confirm failed', e); }
  }

  if (event.type === 'checkout.session.expired' || event.type === 'payment_intent.payment_failed') {
    const holdId = (event.data.object as any).metadata?.holdId as string | undefined;
    if (holdId) {
      if (holdId.startsWith('donation:')) {
        await failDonation(holdId.slice('donation:'.length), event.data.object).catch(console.error);
      } else {
        await cancelHold(holdId).catch(console.error);
      }
    }
  }

  return NextResponse.json({ received: true });
}
