import Link from 'next/link';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getAdminFromCookies } from '@/lib/auth';
import EditBlockName from '@/components/admin/EditBlockName';

export const dynamic = 'force-dynamic';

const YAGNA_LABEL: Record<string, string> = {
  PURSHOTAM: 'Purshotam',
  VISHNU_GOPAL: 'Vishnu Gopal',
  PITRU: 'Pitru'
};

const fmtDate = (d: Date) => new Intl.DateTimeFormat('en-GB', {
  weekday: 'short', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/London'
}).format(d);

const fmtDateTime = (d: Date) => new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/London'
}).format(d);

type Row = {
  positionId: string;
  date: Date;
  yagna: string;
  yagnaTitle: string;
  sessionLabel: string;
  startTime: string;
  kundNumber: number;
  positionLabel: string;
  name: string | null;
  blockedBy: string | null;
  blockedAt: Date | null;
};

export default async function AdminBlocks() {
  const admin = await getAdminFromCookies();
  if (!admin) redirect('/admin/login');

  const blocked = await prisma.kundPosition.findMany({
    where: { blocked: true },
    select: {
      id: true,
      label: true,
      blockReason: true,
      blockedBy: true,
      blockedAt: true,
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

  const rows: Row[] = blocked.map((p) => ({
    positionId: p.id,
    date: p.kund.session.yagnaInstance.eventDay.date,
    yagna: p.kund.session.yagnaInstance.yagnaType,
    yagnaTitle: p.kund.session.yagnaInstance.title,
    sessionLabel: p.kund.session.label,
    startTime: p.kund.session.startTime,
    kundNumber: p.kund.number,
    positionLabel: p.label,
    name: p.blockReason,
    blockedBy: p.blockedBy,
    blockedAt: p.blockedAt
  }));

  rows.sort((a, b) => {
    const d = a.date.getTime() - b.date.getTime();
    if (d !== 0) return d;
    if (a.yagna !== b.yagna) return a.yagna.localeCompare(b.yagna);
    if (a.startTime !== b.startTime) return a.startTime.localeCompare(b.startTime);
    if (a.kundNumber !== b.kundNumber) return a.kundNumber - b.kundNumber;
    return a.positionLabel.localeCompare(b.positionLabel);
  });

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
            <h1 className="h-display text-2xl md:text-3xl text-ivory-50">Blocked positions</h1>
            <p className="text-xs text-ivory-100/85 mt-1">
              {rows.length} blocked position{rows.length === 1 ? '' : 's'} across {byDate.size} day{byDate.size === 1 ? '' : 's'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a href="/api/admin/blocks/export" className="btn-primary">Download CSV</a>
            <Link href="/admin" className="btn-ghost !text-ivory-100 hover:!bg-ivory-50/10">← Dashboard</Link>
          </div>
        </div>
      </header>

      <main className="container-tight py-8 space-y-6">
        {rows.length === 0 ? (
          <div className="card p-6 text-center text-maroon-800">
            No blocked positions yet. Use the session pages to reserve kunds for VIPs / off-line bookings.
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
                  return (
                    <div key={idx}>
                      <div className="flex items-baseline justify-between gap-3 mb-2">
                        <h3 className="font-semibold text-maroon-800">
                          {YAGNA_LABEL[head.yagna] ?? head.yagnaTitle}
                          <span className="text-sm font-normal text-slate-600 ml-2">
                            — {head.sessionLabel} ({head.startTime})
                          </span>
                        </h3>
                        <span className="text-xs text-slate-600">{items.length} position{items.length === 1 ? '' : 's'}</span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-left text-xs uppercase tracking-wide text-slate-600 border-b border-slate-200">
                              <th className="py-1.5 pr-3">Kund</th>
                              <th className="py-1.5 pr-3">Position</th>
                              <th className="py-1.5 pr-3">Name / note</th>
                              <th className="py-1.5 pr-3">Blocked by</th>
                              <th className="py-1.5 pr-3">When</th>
                            </tr>
                          </thead>
                          <tbody>
                            {items.map((r, i) => (
                              <tr key={i} className="border-b border-slate-100 last:border-0">
                                <td className="py-1.5 pr-3 font-medium">{r.kundNumber}</td>
                                <td className="py-1.5 pr-3">{r.positionLabel}</td>
                                <td className="py-1.5 pr-3">
                                  <EditBlockName id={r.positionId} initialName={r.name} />
                                </td>
                                <td className="py-1.5 pr-3 text-slate-600 text-xs">{r.blockedBy ?? '—'}</td>
                                <td className="py-1.5 pr-3 text-slate-600 text-xs">{r.blockedAt ? fmtDateTime(r.blockedAt) : '—'}</td>
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
