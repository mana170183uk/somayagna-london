import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromCookies } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { adminEditBookingSchema } from '@/lib/zodSchemas';
import { cancelBooking } from '@/lib/inventory';
import { audit } from '@/lib/audit';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminFromCookies();
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const { id } = await params;
  const parsed = adminEditBookingSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'INVALID' }, { status: 400 });
  await prisma.booking.update({ where: { id }, data: parsed.data });
  await audit({ actor: admin.email, action: 'EDIT_BOOKING', target: id, meta: parsed.data, req });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminFromCookies();
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const { id } = await params;
  const { reason } = (await req.json().catch(() => ({}))) as { reason?: string };
  await cancelBooking(id, reason ?? 'Admin cancellation', admin.email);
  await audit({ actor: admin.email, action: 'CANCEL_BOOKING', target: id, meta: { reason: reason ?? 'Admin cancellation' }, req });
  return NextResponse.json({ ok: true });
}
