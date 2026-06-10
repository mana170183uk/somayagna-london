import Link from 'next/link';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getAdminFromCookies } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const YAGNA_LABEL: Record<string, string> = {
  PURSHOTAM: 'Purshotam',
  VISHNU_GOPAL: 'Vishnu Gopal',
  PITRU: 'Pitru'
};

const fmtDate = (d: Date) => new Intl.DateTimeFormat('en-GB', {
  weekday: 'short', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/London'
}).format(d);

type Source = 'BOOKING' | 'BLOCK';

type Row = {
  source: Source;
  date: Date;
  yagna: string;
  yagnaTitle: string;
  sessionLabel: string;
  startTime: string;
  kundNumber: number;
  positionLabel: string;
  name: string | null;
  secondName: string | null;
  phone: string | null;
  email: string | null;
  reference: string | null;     // booking ref or null for blocks
  blockedBy: string | null;     // admin email for blocks
};

export default async function AdminAttendance() {
  const admin = await getAdminFromCookies();
  if (!admin) redirect('/admin/login');

  const positions = await prisma.kundPosition.findMany({
    where: {
      OR: [
        { blocked: true },
        { booking: { is: { status: 'CONFIRMED' } } }
      ]
    },
    select: {
      label: true,
      blocked: true,
      blockReason: true,
      blockedBy: true,
      booking: {
        select: {
          reference: true,
          primaryName: true,
          secondParticipantName: true,
          phone: true,
          email: true,
          status: true
        }
      },
      kund: {
        select: {
          number: true,
          session: {
            select: {
              label: true,
              startTime: true,
              yagnaInstance: {
                select: {
                  yagnaType: true,
                  title: true,
                  eventDay: { select: { date: true } }
                }
              }
            }
          }
        }
      }
    }
  });

  const rows: Row[] = positions
    .filter((p) => p.blocked || (p.booking && p.booking.status === 'CONFIRMED'))
    .map((p) => {
      const isBooking = !!p.booking && p.booking.status === 'CONFIRMED';
      return {
        source: isBooking ? ('BOOKING' as const) : ('BLOCK' as const),
        date: p.kund.session.yagnaInstance.eventDay.date,
        yagna: p.kund.session.yagnaInstance.yagnaType,
        yagnaTitle: p.kund.session.yagnaInstance.title,
        sessionLabel: p.kund.session.label,
        startTime: p.kund.session.startTime,
        kundNumber: p.kund.number,
        positionLabel: p.label,
        name: isBooking ? p.booking!.primaryName : p.blockReason,
        secondName: isBooking ? p.booking!.secondParticipantName : null,
        phone: isBooking ? p.booking!.phone : null,
        email: isBooking ? p.booking!.email : null,
        reference: isBooking ? p.booking!.reference : null,
        blockedBy: isBooking ? null : p.blockedBy
      };
    });

  rows.sort((a, b) => {
    const d = a.date.getTime() - b.date.getTime();
    if (d !== 0) return d;
    if (a.yagna !== b.yagna) return a.yagna.localeCompare(b.yagna);
    if (a.startTime !== b.startTime) return a.startTime.localeCompare(b.startTime);
    if (a.kundNumber !== b.kundNumber) return a.kundNumber - b.kundNumber;
    return a.positionLabel.localeCompare(b.positionLabel);
  });

  const bookingCount = rows.filter((r) => r.source === 'BOOKING').length;
  const blockCount = rows.filter((r) => r.source === 'BLOCK').length;

  // Group: date → yagna instance (yagna + session) → rows
  const byDate = new Map<string, Map<string, Row[]>>();
  for (const r of rows) {
    const dateKey = r.date.toISOString().slice(0, 10);
    const yKey = `${r.yagna}__${r.sessionLabel}__${r.startTime}`;
    if (!byDate.has(dateKey)) byDate.set(dateKey, new Map());
    const yMap = byDate.get(dateKey)!;
    if (!yMap.has(yKey)) yMap.set(yKey, []);
    yMap.get(yKey)!.push(r);
  }

  return (
    <div className="min-h-screen bg-ivory-100">
      <header className="bg-gradient-to-b from-maroon-800 to-maroon-900 text-ivory-50 border-b border-gold-300/20">
        <div className="container-tight py-6 flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="eyebrow text-gold-200 mb-1">Report</p>
            <h1 className="h-display text-2xl md:text-3xl text-ivory-50">Attendance list</h1>
            <p className="text-xs text-ivory-100/85 mt-1">
              {rows.length} total · {bookingCount} online booking{bookingCount === 1 ? '' : 's'} · {blockCount} manually blocked · across {byDate.size} day{byDate.size === 1 ? '' : 's'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a href="/api/admin/attendance/export" className="btn-primary">Download CSV</a>
            <Link href="/admin" className="btn-ghost !text-ivory-100 hover:!bg-ivory-50/10">← Dashboard</Link>
          </div>
        </div>
      </header>

      <main className="container-tight py-8 space-y-6">
        {rows.length === 0 ? (
          <div className="card p-6 text-center text-maroon-800">
            No bookings or blocked positions yet.
          </div>
        ) : Array.from(byDate.entries()).map(([dateKey, yMap]) => {
          const firstRow = yMap.values().next().value![0];
          return (
            <section key={dateKey} className="card p-5">
              <h2 className="h-display text-xl text-maroon-900 mb-3">
                {fmtDate(firstRow.date)}
              </h2>
              <div className="space-y-4">
                {Array.from(yMap.values()).map((items, idx) => {
                  const head = items[0];
                  const bookings = items.filter((i) => i.source === 'BOOKING').length;
                  const blocks = items.filter((i) => i.source === 'BLOCK').length;
                  return (
                    <div key={idx}>
                      <div className="flex items-baseline justify-between gap-3 mb-2">
                        <h3 className="font-semibold text-maroon-800">
                          {YAGNA_LABEL[head.yagna] ?? head.yagnaTitle}
                          <span className="text-sm font-normal text-slate-600 ml-2">
                            — {head.sessionLabel} ({head.startTime})
                          </span>
                        </h3>
                        <span className="text-xs text-slate-600">
                          {items.length} taken
                          <span className="ml-1 text-slate-500">({bookings} booked, {blocks} blocked)</span>
                        </span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-left text-xs uppercase tracking-wide text-slate-600 border-b border-slate-200">
                              <th className="py-1.5 pr-3">Source</th>
                              <th className="py-1.5 pr-3">Kund</th>
                              <th className="py-1.5 pr-3">Pos</th>
                              <th className="py-1.5 pr-3">Name</th>
                              <th className="py-1.5 pr-3">2nd person</th>
                              <th className="py-1.5 pr-3">Phone</th>
                              <th className="py-1.5 pr-3">Ref / blocked by</th>
                            </tr>
                          </thead>
                          <tbody>
                            {items.map((r, i) => (
                              <tr key={i} className="border-b border-slate-100 last:border-0">
                                <td className="py-1.5 pr-3">
                                  {r.source === 'BOOKING' ? (
                                    <span className="inline-block px-1.5 py-0.5 text-[11px] rounded bg-emerald-100 text-emerald-800 border border-emerald-300">Booked</span>
                                  ) : (
                                    <span className="inline-block px-1.5 py-0.5 text-[11px] rounded bg-amber-100 text-amber-800 border border-amber-300">Blocked</span>
                                  )}
                                </td>
                                <td className="py-1.5 pr-3 font-medium">{r.kundNumber}</td>
                                <td className="py-1.5 pr-3">{r.positionLabel}</td>
                                <td className="py-1.5 pr-3">{r.name || <span className="text-slate-400 italic">—</span>}</td>
                                <td className="py-1.5 pr-3 text-slate-700">{r.secondName ?? '—'}</td>
                                <td className="py-1.5 pr-3 text-slate-700">{r.phone ?? '—'}</td>
                                <td className="py-1.5 pr-3 text-xs text-slate-600">
                                  {r.reference ?? r.blockedBy ?? '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </main>
    </div>
  );
}
