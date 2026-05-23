import { NextResponse } from 'next/server';
import { getAdminFromCookies } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const admin = await getAdminFromCookies();
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const bookings = await prisma.booking.findMany({
    orderBy: [{ createdAt: 'desc' }],
    include: { session: { include: { eventDay: true } }, payment: true }
  });

  const header = ['Reference','Status','Date','Time','Yagna','Kund','Positions','BookingType','Amount (GBP)','PaymentStatus','PaymentProvider','PrimaryName','Relation','Email','Phone','SecondParticipant','CreatedAt'];
  const rows = bookings.map((b) => [
    b.reference, b.status,
    b.session.eventDay.date.toISOString().slice(0,10), b.session.startTime,
    b.session.eventDay.title, b.kundNumber, b.positions.join('|'),
    b.bookingType, (b.amountPence/100).toFixed(2),
    b.payment?.status ?? '', b.payment?.provider ?? '',
    b.primaryName, b.relation, b.email, b.phone, b.secondParticipantName ?? '',
    b.createdAt.toISOString()
  ]);
  const csv = [header, ...rows].map((r) => r.map(escapeCsv).join(',')).join('\n');

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="somayagna-bookings-${new Date().toISOString().slice(0,10)}.csv"`
    }
  });
}

function escapeCsv(v: unknown) {
  const s = String(v ?? '');
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
