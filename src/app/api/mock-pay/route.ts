import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { registrationSchema } from '@/lib/zodSchemas';
import { confirmBookingFromHold, InventoryError } from '@/lib/inventory';
import { isProviderEnabled } from '@/lib/constants';
import { sendConfirmationEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  if (!isProviderEnabled('mock')) return NextResponse.json({ error: 'MOCK_DISABLED' }, { status: 400 });
  const parsed = registrationSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'INVALID', issues: parsed.error.issues }, { status: 400 });

  try {
    const booking = await confirmBookingFromHold({
      holdId: parsed.data.holdId,
      primaryName: parsed.data.primaryName,
      relation: parsed.data.relation,
      email: parsed.data.email,
      phone: parsed.data.phone,
      secondParticipantName: parsed.data.secondParticipantName ?? null,
      donationPence: parsed.data.donationPence,
      payment: { provider: 'MOCK', status: 'SUCCEEDED', providerRef: `mock_${Date.now()}` }
    });

    // Fire-and-forget email (don't await long network calls in route)
    const full = await prisma.booking.findUnique({ where: { id: booking.id }, include: { session: { include: { eventDay: true } } } });
    if (full) {
      await sendConfirmationEmail({
        to: full.email, primaryName: full.primaryName, reference: full.reference,
        date: full.session.eventDay.date, startTime: full.session.startTime,
        yagnaType: full.session.eventDay.title, kundNumber: full.kundNumber,
        positions: full.positions, bookingType: full.bookingType, amountPence: full.amountPence,
        donationPence: full.donationPence
      }).catch(console.error);
    }

    return NextResponse.json({ bookingId: booking.id, reference: booking.reference });
  } catch (e) {
    if (e instanceof InventoryError) return NextResponse.json({ error: e.code, message: e.message }, { status: 409 });
    console.error(e);
    return NextResponse.json({ error: 'INTERNAL' }, { status: 500 });
  }
}
