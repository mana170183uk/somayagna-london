import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { registrationSchema } from '@/lib/zodSchemas';
import { createPaypalOrder } from '@/lib/paypal';
import { isProviderEnabled } from '@/lib/constants';

export async function POST(req: NextRequest) {
  if (!isProviderEnabled('paypal')) return NextResponse.json({ error: 'PAYPAL_DISABLED' }, { status: 400 });
  const parsed = registrationSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'INVALID', issues: parsed.error.issues }, { status: 400 });

  const hold = await prisma.bookingHold.findUnique({ where: { id: parsed.data.holdId }, include: { session: { include: { eventDay: true } } } });
  if (!hold) return NextResponse.json({ error: 'HOLD_NOT_FOUND' }, { status: 404 });
  if (hold.expiresAt < new Date()) return NextResponse.json({ error: 'HOLD_EXPIRED' }, { status: 410 });

  await prisma.bookingHold.update({
    where: { id: hold.id },
    data: { primaryName: parsed.data.primaryName, email: parsed.data.email || hold.email }
  });

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const desc = `${hold.session.eventDay.title} — Kund ${hold.kundNumber} (${hold.positions.join(',')})`;

  const { orderId, approveUrl } = await createPaypalOrder({
    holdId: hold.id,
    amountPence: hold.amountPence,
    donationPence: parsed.data.donationPence,
    description: desc,
    returnUrl: `${site}/confirmation/pending?holdId=${hold.id}&provider=paypal`,
    cancelUrl: `${site}/book?cancelled=1`
  });

  // Stash registration + paypal order id in audit log for webhook reconciliation
  await prisma.auditLog.create({
    data: {
      actor: 'system',
      action: 'PAYPAL_ORDER_CREATED',
      target: hold.id,
      meta: {
        orderId,
        registration: parsed.data
      }
    }
  });

  return NextResponse.json({ url: approveUrl, orderId, provider: 'paypal' });
}
