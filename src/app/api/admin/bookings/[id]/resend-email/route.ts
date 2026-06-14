import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromCookies } from '@/lib/auth';
import { sendAndAuditBookingConfirmation } from '@/lib/email';

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminFromCookies();
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const { id } = await params;
  const outcome = await sendAndAuditBookingConfirmation({
    bookingId: id,
    actor: admin.email,
    trigger: 'RESEND'
  });

  if (outcome.status === 'SENT') {
    return NextResponse.json({ ok: true, status: 'SENT', to: outcome.to, providerId: outcome.providerId });
  }
  if (outcome.status === 'SKIPPED') {
    return NextResponse.json({ ok: false, status: 'SKIPPED', message: outcome.reason }, { status: 400 });
  }
  return NextResponse.json({ ok: false, status: 'FAILED', message: outcome.reason }, { status: 502 });
}
