import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromCookies } from '@/lib/auth';
import { adminCreateBookingSchema } from '@/lib/zodSchemas';
import { adminCreateConfirmedBooking, InventoryError } from '@/lib/inventory';

export async function POST(req: NextRequest) {
  const admin = getAdminFromCookies();
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const parsed = adminCreateBookingSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'INVALID', issues: parsed.error.issues }, { status: 400 });
  try {
    const booking = await adminCreateConfirmedBooking({
      ...parsed.data,
      positions: parsed.data.positions as ('A'|'B'|'C')[],
      secondParticipantName: parsed.data.secondParticipantName ?? null,
      actor: admin.email
    });
    return NextResponse.json({ bookingId: booking.id, reference: booking.reference });
  } catch (e) {
    if (e instanceof InventoryError) return NextResponse.json({ error: e.code, message: e.message }, { status: 409 });
    console.error(e);
    return NextResponse.json({ error: 'INTERNAL' }, { status: 500 });
  }
}
