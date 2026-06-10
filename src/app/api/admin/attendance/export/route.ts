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

function csv(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return '';
  const s = String(v);
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET() {
  const admin = await getAdminFromCookies();
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

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
          whatsappNumber: true,
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

  const rows = positions
    .filter((p) => p.blocked || (p.booking && p.booking.status === 'CONFIRMED'))
    .map((p) => {
      const isBooking = !!p.booking && p.booking.status === 'CONFIRMED';
      return {
        source: isBooking ? 'Booked online' : 'Blocked manually',
        date: p.kund.session.yagnaInstance.eventDay.date,
        yagna: p.kund.session.yagnaInstance.yagnaType,
        yagnaTitle: p.kund.session.yagnaInstance.title,
        sessionLabel: p.kund.session.label,
        startTime: p.kund.session.startTime,
        kundNumber: p.kund.number,
        positionLabel: p.label,
        primaryName: isBooking ? p.booking!.primaryName : p.blockReason,
        secondName: isBooking ? p.booking!.secondParticipantName : null,
        phone: isBooking ? p.booking!.phone : null,
        whatsapp: isBooking ? p.booking!.whatsappNumber : null,
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

  const header = [
    'Source',
    'Date',
    'Yagna',
    'Session',
    'Start time',
    'Kund',
    'Position',
    'Primary name',
    '2nd participant',
    'Phone',
    'WhatsApp',
    'Email',
    'Booking ref',
    'Blocked by'
  ];
  const lines = [header.map(csv).join(',')];
  for (const r of rows) {
    lines.push([
      csv(r.source),
      csv(fmtDate(r.date)),
      csv(YAGNA_LABEL[r.yagna] ?? r.yagnaTitle),
      csv(r.sessionLabel),
      csv(r.startTime),
      csv(r.kundNumber),
      csv(r.positionLabel),
      csv(r.primaryName),
      csv(r.secondName),
      csv(r.phone),
      csv(r.whatsapp),
      csv(r.email),
      csv(r.reference),
      csv(r.blockedBy)
    ].join(','));
  }
  const body = lines.join('\r\n') + '\r\n';

  const today = new Date().toISOString().slice(0, 10);
  return new NextResponse(body, {
    status: 200,
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="attendance-${today}.csv"`,
      'cache-control': 'no-store'
    }
  });
}
