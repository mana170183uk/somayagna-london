import Link from 'next/link';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getAdminFromCookies } from '@/lib/auth';
import { formatDateLong, formatGBP, formatTime, SESSION_CAPACITY } from '@/lib/constants';
import { Mandala } from '@/components/ui/Ornaments';

export const dynamic = 'force-dynamic';

export default async function AdminHome() {
  const admin = await getAdminFromCookies();
  if (!admin) redirect('/admin/login');

  const [days, totals, recent, byProvider] = await Promise.all([
    prisma.eventDay.findMany({
      orderBy: { date: 'asc' },
      where: { isActive: true },
      include: {
        sessions: {
          orderBy: { startTime: 'asc' },
          include: {
            bookings: {
              where: { status: 'CONFIRMED' },
              select: { positions: true, amountPence: true, donationPence: true, giftAid: true }
            }
          }
        }
      }
    }),
    Promise.all([
      prisma.booking.count({ where: { status: 'CONFIRMED' } }),
      prisma.booking.aggregate({
        where: { status: 'CONFIRMED' },
        _sum: { amountPence: true, donationPence: true }
      }),
      prisma.booking.count({ where: { status: 'CONFIRMED', giftAid: true } }),
      prisma.bookingHold.count({ where: { expiresAt: { gt: new Date() }, booking: null } })
    ]),
    prisma.booking.findMany({
      where: { status: 'CONFIRMED' },
      orderBy: { confirmedAt: 'desc' },
      take: 8,
      select: {
        id: true, reference: true, primaryName: true, kundNumber: true, positions: true,
        amountPence: true, donationPence: true, confirmedAt: true,
        session: { select: { startTime: true, eventDay: { select: { date: true, title: true } } } },
        payment: { select: { provider: true } }
      }
    }),
    prisma.payment.groupBy({
      by: ['provider'],
      where: { status: 'SUCCEEDED' },
      _count: { _all: true },
      _sum: { amountPence: true }
    })
  ]);

  const [bookingCount, sums, giftAidCount, holdCount] = totals;
  const revenuePence = sums._sum.amountPence ?? 0;
  const donationPence = sums._sum.donationPence ?? 0;
  const totalCapacity = days.length * 3 * SESSION_CAPACITY; // 7 * 3 * 33 = 693
  const totalTaken = days.reduce(
    (acc, d) => acc + d.sessions.reduce((a, s) => a + s.bookings.reduce((x, b) => x + b.positions.length, 0), 0),
    0
  );
  const fillPct = totalCapacity > 0 ? Math.round((totalTaken / totalCapacity) * 100) : 0;

  return (
    <div>
      {/* Hero header */}
      <header className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-maroon-800 via-maroon-700 to-maroon-900 text-ivory-50 p-7 md:p-9 shadow-altar">
        <Mandala className="absolute -right-20 -top-20 w-72 text-gold-400 opacity-20 animate-slow-spin pointer-events-none" />
        <Mandala className="absolute -left-24 -bottom-28 w-64 text-gold-300 opacity-15 animate-slow-spin pointer-events-none" />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow text-gold-200 mb-2">Organiser Dashboard</p>
            <h1 className="h-display text-3xl md:text-4xl text-ivory-50">SomaYagna London — Live</h1>
            <p className="text-sm text-ivory-100/85 mt-1">Signed in as {admin.email}</p>
          </div>
          <div className="flex gap-2">
            <a href="/api/admin/export" className="btn-secondary !bg-ivory-50/15 !text-ivory-50 !border-ivory-50/30 hover:!bg-ivory-50/25">↓ Export CSV</a>
            <Link href="/" className="btn-ghost !text-ivory-100 hover:!bg-ivory-50/10">View site</Link>
          </div>
        </div>

        {/* Big number — overall fill */}
        <div className="relative mt-7 grid md:grid-cols-12 items-center gap-6">
          <div className="md:col-span-5">
            <div className="text-[11px] tracking-widest uppercase text-gold-200/90">Programme fill</div>
            <div className="flex items-baseline gap-3 mt-1">
              <span className="h-display text-6xl md:text-7xl text-gold-200">{fillPct}%</span>
              <span className="text-ivory-100/90">{totalTaken} / {totalCapacity} seats</span>
            </div>
            <ProgressBar pct={fillPct} />
          </div>

          <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <HeroStat label="Confirmed" value={String(bookingCount)} accent="saffron" />
            <HeroStat label="Revenue" value={formatGBP(revenuePence)} accent="gold" />
            <HeroStat label="Donations" value={formatGBP(donationPence)} accent="saffron" sub={`${giftAidCount} Gift Aided`} />
            <HeroStat label="Active holds" value={String(holdCount)} accent="amber" sub={holdCount > 0 ? 'live now' : '—'} live={holdCount > 0} />
          </div>
        </div>
      </header>

      {/* Payment provider breakdown */}
      {byProvider.length > 0 && (
        <section className="mt-6 grid sm:grid-cols-3 gap-3">
          {byProvider.map((p) => (
            <div key={p.provider} className="card p-4 flex items-center justify-between">
              <div>
                <div className="text-xs tracking-widest uppercase text-maroon-700">{p.provider}</div>
                <div className="h-display text-2xl text-maroon-800 mt-1">{formatGBP(p._sum.amountPence ?? 0)}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-maroon-700">{p._count._all} payment{p._count._all === 1 ? '' : 's'}</div>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Recent confirmations */}
      {recent.length > 0 && (
        <section className="mt-6 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="h-display text-xl text-maroon-800">Latest confirmations</h2>
            <span className="text-xs text-maroon-700 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-saffron-500 animate-flicker" /> live
            </span>
          </div>
          <ul className="divide-y divide-gold-100">
            {recent.map((b) => (
              <li key={b.id} className="py-2.5 grid grid-cols-12 gap-3 items-center text-sm">
                <span className="col-span-3 font-mono text-xs text-maroon-700">{b.reference}</span>
                <span className="col-span-3 text-maroon-900 font-medium truncate">{b.primaryName}</span>
                <span className="col-span-3 text-maroon-700/90 truncate">
                  Kund {b.kundNumber} · {b.positions.join(',')} · {formatTime(b.session.startTime)}
                </span>
                <span className="col-span-2 text-maroon-900 tabular-nums">
                  {formatGBP(b.amountPence + b.donationPence)}
                  {b.donationPence > 0 && <span className="text-saffron-700 text-[10px] ml-1">+♥</span>}
                </span>
                <span className="col-span-1 text-right text-[10px] tracking-widest text-maroon-700/80 uppercase">{b.payment?.provider ?? ''}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Per-day cards */}
      <h2 className="h-display text-xl text-maroon-800 mt-8 mb-3">Days & sessions</h2>
      <div className="space-y-6">
        {days.map((d) => {
          const dayTaken = d.sessions.reduce((acc, s) => acc + s.bookings.reduce((x, b) => x + b.positions.length, 0), 0);
          const dayRev = d.sessions.reduce((acc, s) => acc + s.bookings.reduce((x, b) => x + b.amountPence, 0), 0);
          const dayDon = d.sessions.reduce((acc, s) => acc + s.bookings.reduce((x, b) => x + b.donationPence, 0), 0);
          const dayCap = d.sessions.length * SESSION_CAPACITY;
          const dayPct = dayCap > 0 ? Math.round((dayTaken / dayCap) * 100) : 0;
          return (
            <section key={d.id} className="card overflow-hidden">
              <div className="px-5 py-4 bg-temple-gradient border-b border-gold-200 flex flex-wrap justify-between items-baseline gap-2">
                <div>
                  <div className="text-xs tracking-widest uppercase text-maroon-700">{d.yagnaType.replace('_', ' ')}</div>
                  <div className="h-display text-2xl text-maroon-800">{formatDateLong(d.date)} — {d.title}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs uppercase tracking-widest text-maroon-700">Day total</div>
                  <div className="h-display text-xl text-saffron-700">{formatGBP(dayRev + dayDon)}</div>
                  <div className="text-[11px] text-maroon-700/85">{dayTaken}/{dayCap} seats · {dayPct}%</div>
                </div>
              </div>
              <div className="px-5 pt-3">
                <ProgressBar pct={dayPct} compact />
              </div>
              <div className="divide-y divide-gold-100 mt-2">
                {d.sessions.map((s) => {
                  const taken = s.bookings.reduce((acc, b) => acc + b.positions.length, 0);
                  const remaining = SESSION_CAPACITY - taken;
                  const revenue = s.bookings.reduce((acc, b) => acc + b.amountPence, 0);
                  const donations = s.bookings.reduce((acc, b) => acc + b.donationPence, 0);
                  const sPct = Math.round((taken / SESSION_CAPACITY) * 100);
                  return (
                    <Link
                      key={s.id} href={`/admin/session/${s.id}`}
                      className="grid grid-cols-12 gap-3 items-center px-5 py-4 hover:bg-ivory-100 transition group"
                    >
                      <div className="col-span-2 h-display text-xl text-maroon-800 group-hover:text-saffron-700 transition">{formatTime(s.startTime)}</div>
                      <div className="col-span-3 text-sm text-maroon-900">
                        <div className="font-medium text-maroon-800">{taken}<span className="text-maroon-700/80">/{SESSION_CAPACITY}</span> taken</div>
                        <div className="text-xs text-maroon-700">{remaining} free</div>
                      </div>
                      <div className="col-span-4">
                        <ProgressBar pct={sPct} compact />
                      </div>
                      <div className="col-span-2 text-sm text-maroon-900 tabular-nums text-right">
                        {formatGBP(revenue)}
                        {donations > 0 && <div className="text-[10px] text-saffron-700">+ {formatGBP(donations)} ♥</div>}
                      </div>
                      <div className="col-span-1 text-right text-saffron-700 group-hover:translate-x-0.5 transition">→</div>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function HeroStat({
  label, value, accent = 'gold', sub, live = false
}: { label: string; value: string; accent?: 'gold' | 'saffron' | 'amber'; sub?: string; live?: boolean }) {
  const accents = {
    gold: 'text-gold-200',
    saffron: 'text-saffron-200',
    amber: 'text-saffron-300'
  };
  return (
    <div className="rounded-xl bg-ivory-50/10 border border-ivory-50/15 px-4 py-3 backdrop-blur-sm">
      <div className="text-[10px] tracking-widest uppercase text-ivory-100/85 flex items-center gap-1.5">
        {label}
        {live && <span className="w-1.5 h-1.5 rounded-full bg-saffron-300 animate-flicker" />}
      </div>
      <div className={`h-display text-2xl mt-0.5 ${accents[accent]}`}>{value}</div>
      {sub && <div className="text-[10px] text-ivory-100/80">{sub}</div>}
    </div>
  );
}

function ProgressBar({ pct, compact = false }: { pct: number; compact?: boolean }) {
  const safe = Math.min(100, Math.max(0, pct));
  return (
    <div className={`relative ${compact ? 'h-1.5' : 'h-2.5 mt-3'} bg-maroon-900/15 rounded-full overflow-hidden`}>
      <div
        className="absolute inset-y-0 left-0 bg-gradient-to-r from-saffron-400 via-saffron-500 to-saffron-700 rounded-full transition-all duration-700"
        style={{ width: `${safe}%` }}
      />
    </div>
  );
}
