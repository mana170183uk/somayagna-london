import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminFromCookies } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const YAGNA_LABEL: Record<string, string> = {
  PURSHOTAM: 'Purshotam',
  VISHNU_GOPAL: 'Vishnu Gopal',
  PITRU: 'Pitru'
};

const fmtDate = (d: Date) => new Intl.DateTimeFormat('en-GB', {
  day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Europe/London'
}).format(d);

const fmtDateTime = (d: Date) => new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/London'
}).format(d);

// RFC-4180: quote a field if it contains comma, quote, CR or LF; escape " as ""
function csv(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return '';
  const s = String(v);
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET() {
  const admin = await getAdminFromCookies();
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const blocked = await prisma.kundPosition.findMany({
    where: { blocked: true },
    select: {
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

  const rows = blocked
    .map((p) => ({
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
    }))
    .sort((a, b) => {
      const d = a.date.getTime() - b.date.getTime();
      if (d !== 0) return d;
      if (a.yagna !== b.yagna) return a.yagna.localeCompare(b.yagna);
      if (a.startTime !== b.startTime) return a.startTime.localeCompare(b.startTime);
      if (a.kundNumber !== b.kundNumber) return a.kundNumber - b.kundNumber;
      return a.positionLabel.localeCompare(b.positionLabel);
    });

  const header = ['Date', 'Yagna', 'Session', 'Start time', 'Kund', 'Position', 'Devotee name / note', 'Blocked by', 'Blocked at'];
  const lines = [header.map(csv).join(',')];
  for (const r of rows) {
    lines.push([
      csv(fmtDate(r.date)),
      csv(YAGNA_LABEL[r.yagna] ?? r.yagnaTitle),
      csv(r.sessionLabel),
      csv(r.startTime),
      csv(r.kundNumber),
      csv(r.positionLabel),
      csv(r.name),
      csv(r.blockedBy),
      csv(r.blockedAt ? fmtDateTime(r.blockedAt) : '')
    ].join(','));
  }
  const body = lines.join('\r\n') + '\r\n';

  const today = new Date().toISOString().slice(0, 10);
  return new NextResponse(body, {
    status: 200,
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="blocked-positions-${today}.csv"`,
      'cache-control': 'no-store'
    }
  });
}
