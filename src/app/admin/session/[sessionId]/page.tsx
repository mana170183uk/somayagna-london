import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getAdminFromCookies } from '@/lib/auth';
import { formatDateLong, formatGBP, formatTime } from '@/lib/constants';
import AdminSessionPanel from '@/components/admin/AdminSessionPanel';
import { paletteForDate, paletteForSession } from '@/lib/dayColors';
import { SessionIcon } from '@/components/ui/SessionIcon';

export const dynamic = 'force-dynamic';

export default async function SessionDetail({ params }: { params: Promise<{ sessionId: string }> }) {
  const admin = await getAdminFromCookies();
  if (!admin) redirect('/admin/login');

  const { sessionId } = await params;
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      yagnaInstance: { include: { eventDay: true } },
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
  const capacity = session.yagnaInstance.kundCount * 3;
  const dayPalette = paletteForDate(session.yagnaInstance.eventDay.date);
  const sessionPalette = paletteForSession(session.startTime);

  return (
    <div>
      <Link href="/admin" className="btn-ghost text-sm">← All days</Link>
      <header className={`mt-2 rounded-2xl border-l-4 px-5 py-4 ${dayPalette.bg} ${dayPalette.border}`}>
        <p className={`eyebrow mb-2 ${dayPalette.accentText}`}>{session.yagnaInstance.title}</p>
        <h1 className="h-display text-3xl text-maroon-800">
          {formatDateLong(session.yagnaInstance.eventDay.date)}
        </h1>
        <div className={`inline-flex items-center gap-2 mt-3 px-4 py-1.5 rounded-full border-2 ${sessionPalette.bg} ${sessionPalette.border} ${sessionPalette.accentText}`}>
          <SessionIcon kind={sessionPalette.icon} className="w-5 h-5" />
          <span className="text-sm font-semibold uppercase tracking-widest">{sessionPalette.label}</span>
          <span className="h-display text-lg">{formatTime(session.startTime)}</span>
        </div>
        <p className="text-sm text-maroon-700 mt-3">
          {taken}/{capacity} positions taken · {capacity - taken} remaining · {session.yagnaInstance.kundCount} Kunds
        </p>
        {session.optional && (
          <p className="text-xs text-maroon-700 mt-1">
            <strong>Optional session</strong> — enabled by admin. Disable in the main admin view to hide from public.
          </p>
        )}
      </header>

      <AdminSessionPanel
        sessionId={session.id}
        kunds={session.kunds.map((k) => ({
          id: k.id, number: k.number,
          positions: k.positions.map((p) => ({
            id: p.id, label: p.label as 'A'|'B'|'C',
            blocked: p.blocked,
            blockReason: p.blockReason,
            blockedBy: p.blockedBy,
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
