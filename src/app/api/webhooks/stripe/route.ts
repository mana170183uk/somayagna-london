import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { confirmBookingFromHold, cancelHold } from '@/lib/inventory';
import { prisma } from '@/lib/prisma';
import { sendConfirmationEmail } from '@/lib/email';

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
      const full = await prisma.booking.findUnique({ where: { id: booking.id }, include: { session: { include: { eventDay: true } } } });
      if (full && full.email) {
        await sendConfirmationEmail({
          to: full.email, primaryName: full.primaryName, reference: full.reference,
          date: full.session.eventDay.date, startTime: full.session.startTime,
          yagnaType: full.session.eventDay.title, kundNumber: full.kundNumber,
          positions: full.positions, bookingType: full.bookingType, amountPence: full.amountPence,
          donationPence: full.donationPence
        });
      } else if (full) {
        console.log(`[email] skipped for ${full.reference} — no email address (WhatsApp: ${full.whatsappNumber ?? 'also missing'})`);
      }
    } catch (e) { console.error('Stripe confirm failed', e); }
  }

  if (event.type === 'checkout.session.expired' || event.type === 'payment_intent.payment_failed') {
    const holdId = (event.data.object as any).metadata?.holdId;
    if (holdId) await cancelHold(holdId).catch(console.error);
  }

  return NextResponse.json({ received: true });
}
