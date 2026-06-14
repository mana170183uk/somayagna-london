import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromCookies } from '@/lib/auth';
import { adminCreateBookingSchema } from '@/lib/zodSchemas';
import { adminCreateConfirmedBooking, InventoryError } from '@/lib/inventory';
import { sendAndAuditBookingConfirmation } from '@/lib/email';

export async function POST(req: NextRequest) {
  const admin = await getAdminFromCookies();
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const parsed = adminCreateBookingSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'INVALID', issues: parsed.error.issues }, { status: 400 });
  try {
    const { sendEmail, ...bookingData } = parsed.data;
    const booking = await adminCreateConfirmedBooking({
      ...bookingData,
      positions: bookingData.positions as ('A'|'B'|'C')[],
      secondParticipantName: bookingData.secondParticipantName ?? null,
      actor: admin.email
    });

    let emailOutcome: 'SENT' | 'SKIPPED' | 'FAILED' | 'NOT_REQUESTED' = 'NOT_REQUESTED';
    let emailMessage: string | undefined;
    if (sendEmail) {
      const result = await sendAndAuditBookingConfirmation({
        bookingId: booking.id,
        actor: admin.email,
        trigger: 'ADMIN_MANUAL'
      });
      emailOutcome = result.status;
      if (result.status !== 'SENT') emailMessage = result.reason;
    }

    return NextResponse.json({
      bookingId: booking.id,
      reference: booking.reference,
      email: { outcome: emailOutcome, message: emailMessage }
    });
  } catch (e) {
    if (e instanceof InventoryError) return NextResponse.json({ error: e.code, message: e.message }, { status: 409 });
    console.error(e);
    return NextResponse.json({ error: 'INTERNAL' }, { status: 500 });
  }
}
