import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { registrationSchema } from '@/lib/zodSchemas';
import { createStripeCheckoutSession } from '@/lib/stripe';
import { isProviderEnabled } from '@/lib/constants';

export async function POST(req: NextRequest) {
  if (!isProviderEnabled('stripe')) return NextResponse.json({ error: 'STRIPE_DISABLED' }, { status: 400 });
  const parsed = registrationSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'INVALID', issues: parsed.error.issues }, { status: 400 });

  const hold = await prisma.bookingHold.findUnique({
    where: { id: parsed.data.holdId },
    include: { session: { include: { eventDay: true } } }
  });
  if (!hold) return NextResponse.json({ error: 'HOLD_NOT_FOUND' }, { status: 404 });
  if (hold.expiresAt < new Date()) return NextResponse.json({ error: 'HOLD_EXPIRED' }, { status: 410 });

  // Update the hold with the latest contact details (in case user changed them)
  await prisma.bookingHold.update({
    where: { id: hold.id },
    data: { primaryName: parsed.data.primaryName, email: parsed.data.email }
  });

  // Stash the full registration (relation, phone, second participant) so the
  // webhook can confirm without asking the user to re-enter anything.
  await prisma.auditLog.create({
    data: { actor: 'system', action: 'STRIPE_REGISTRATION', target: hold.id, meta: { registration: parsed.data } }
  });

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const desc = `${hold.session.eventDay.title} — Kund ${hold.kundNumber} (${hold.positions.join(',')})`;
  const session = await createStripeCheckoutSession({
    holdId: hold.id,
    amountPence: hold.amountPence,
    donationPence: parsed.data.donationPence,
    email: parsed.data.email,
    description: desc,
    successUrl: `${site}/confirmation/pending?holdId=${hold.id}&provider=stripe&session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${site}/book?cancelled=1`
  });

  return NextResponse.json({ url: session.url, provider: 'stripe' });
}
