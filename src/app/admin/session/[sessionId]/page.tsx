import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getAdminFromCookies } from '@/lib/auth';
import { formatDateLong, formatGBP, formatTime, SESSION_CAPACITY } from '@/lib/constants';
import AdminSessionPanel from '@/components/admin/AdminSessionPanel';

export const dynamic = 'force-dynamic';

export default async function SessionDetail({ params }: { params: Promise<{ sessionId: string }> }) {
  const admin = await getAdminFromCookies();
  if (!admin) redirect('/admin/login');

  const { sessionId } = await params;
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      eventDay: true,
      kunds: {
        orderBy: { number: 'asc' },
        include: {
          positions: {
            orderBy: { label: 'asc' },
            include: { booking: { select: { id: true, reference: true, primaryName: true, email: true, phone: true, bookingType: true, status: true, amountPence: true, payment: { select: { status: true, provider: true } } } } }
          }
        }
      }
    }
  });
  if (!session) notFound();

  const taken = session.kunds.reduce((acc, k) => acc + k.positions.filter((p) => p.bookingId).length, 0);

  return (
    <div>
      <Link href="/admin" className="btn-ghost text-sm">← All days</Link>
      <header className="mt-2">
        <p className="eyebrow mb-2">{session.eventDay.yagnaType.replace('_', ' ')}</p>
        <h1 className="h-display text-3xl text-maroon-800">
          {formatDateLong(session.eventDay.date)} — {formatTime(session.startTime)}
        </h1>
        <p className="text-sm text-maroon-700/80 mt-1">
          {taken}/{SESSION_CAPACITY} positions taken · {SESSION_CAPACITY - taken} remaining
        </p>
      </header>

      <AdminSessionPanel
        sessionId={session.id}
        kunds={session.kunds.map((k) => ({
          id: k.id, number: k.number,
          positions: k.positions.map((p) => ({
            id: p.id, label: p.label as 'A'|'B'|'C',
            booking: p.booking ? {
              id: p.booking.id, reference: p.booking.reference,
              primaryName: p.booking.primaryName, email: p.booking.email,
              phone: p.booking.phone, bookingType: p.booking.bookingType,
              status: p.booking.status, amountPence: p.booking.amountPence,
              paymentStatus: p.booking.payment?.status ?? null,
              paymentProvider: p.booking.payment?.provider ?? null
            } : null
          }))
        }))}
      />
    </div>
  );
}
