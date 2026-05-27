import Link from 'next/link';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getAdminFromCookies } from '@/lib/auth';
import { formatDateLong, formatGBP, formatTime } from '@/lib/constants';
import { Mandala } from '@/components/ui/Ornaments';
import { paletteForDate, paletteForSession } from '@/lib/dayColors';
import { SessionIcon } from '@/components/ui/SessionIcon';
import SessionToggle from '@/components/admin/SessionToggle';
import WipeBookingsButton from '@/components/admin/WipeBookingsButton';

export const dynamic = 'force-dynamic';

export default async function AdminHome() {
  const admin = await getAdminFromCookies();
  if (!admin) redirect('/admin/login');

  const [days, totals, recent, byProvider, donationsByMaterial] = await Promise.all([
    prisma.eventDay.findMany({
      orderBy: { date: 'asc' },
      include: {
        yagnaInstances: {
          orderBy: { yagnaType: 'asc' },
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
      prisma.bookingHold.count({ where: { expiresAt: { gt: new Date() }, booking: null } }),
      // Donations (standalone, via /donate)
      prisma.donation.count({ where: { status: 'COMPLETED' } }),
      prisma.donation.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amountPence: true }
      }),
      prisma.donation.aggregate({
        where: { status: 'COMPLETED', giftAid: true },
        _sum: { amountPence: true }
      })
    ]),
    prisma.booking.findMany({
      where: { status: 'CONFIRMED' },
      orderBy: { confirmedAt: 'desc' },
      take: 8,
      select: {
        id: true, reference: true, primaryName: true, kundNumber: true, positions: true,
        amountPence: true, donationPence: true, confirmedAt: true,
        session: {
          select: {
            startTime: true,
            yagnaInstance: { select: { title: true, eventDay: { select: { date: true } } } }
          }
        },
        payment: { select: { provider: true } }
      }
    }),
    prisma.payment.groupBy({
      by: ['provider'],
      where: { status: 'SUCCEEDED' },
      _count: { _all: true },
      _sum: { amountPence: true }
    }),
    // Donation breakdown by material (for table at bottom of admin)
    prisma.donation.groupBy({
      by: ['materialLabel'],
      where: { status: 'COMPLETED' },
      _sum: { amountPence: true },
      _count: { _all: true }
    })
  ]);

  const [bookingCount, sums, giftAidCount, holdCount, donationCount, donationSums, giftAidDonationSums] = totals;
  const revenuePence = sums._sum.amountPence ?? 0;
  const donationPence = sums._sum.donationPence ?? 0;
  const standaloneDonationPence = donationSums._sum.amountPence ?? 0;
  const giftAidDonationPence = giftAidDonationSums._sum.amountPence ?? 0;

  // Per-yagna capacity (Pitru 9×3, others 11×3). Sum across all enabled sessions.
  const totalCapacity = days.reduce(
    (acc, d) => acc + d.yagnaInstances.reduce(
      (a, y) => a + y.sessions.filter((s) => s.enabled).length * y.kundCount * 3, 0
    ), 0
  );
  const totalTaken = days.reduce(
    (acc, d) => acc + d.yagnaInstances.reduce(
      (a, y) => a + y.sessions.reduce((x, s) => x + s.bookings.reduce((c, b) => c + b.positions.length, 0), 0), 0
    ), 0
  );
  const fillPct = totalCapacity > 0 ? Math.round((totalTaken / totalCapacity) * 100) : 0;

  return (
    <div>
      <header className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-maroon-800 via-maroon-700 to-maroon-900 text-ivory-50 p-7 md:p-9 shadow-altar">
        <Mandala className="absolute -right-20 -top-20 w-72 text-gold-400 opacity-20 animate-slow-spin pointer-events-none" />
        <Mandala className="absolute -left-24 -bottom-28 w-64 text-gold-300 opacity-15 animate-slow-spin pointer-events-none" />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow text-gold-200 mb-2">Organiser Dashboard</p>
            <h1 className="h-display text-3xl md:text-4xl text-ivory-50">SomaYagna London — Live</h1>
            <p className="text-sm text-ivory-100/85 mt-1">Signed in as {admin.email}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <a href="/api/admin/export" className="btn-secondary !bg-ivory-50/15 !text-ivory-50 !border-ivory-50/30 hover:!bg-ivory-50/25">↓ Bookings CSV</a>
            <a href="/api/admin/donations" className="btn-secondary !bg-ivory-50/15 !text-ivory-50 !border-ivory-50/30 hover:!bg-ivory-50/25">↓ Donations CSV</a>
            <WipeBookingsButton />
            <Link href="/" className="btn-ghost !text-ivory-100 hover:!bg-ivory-50/10">View site</Link>
          </div>
        </div>

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

      {/* Standalone donations (via /donate) ─ separate from booking-attached donations */}
      {(donationCount > 0 || donationsByMaterial.length > 0) && (
        <section className="mt-6 card p-5">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div>
              <h2 className="h-display text-xl text-maroon-800">Donations</h2>
              <p className="text-xs text-maroon-700 mt-0.5">Direct giving via /donate (separate from booking add-ons).</p>
            </div>
            <a href="/api/admin/donations" className="btn-ghost !py-1 !px-3 !text-xs">↓ Export donations CSV</a>
          </div>
          <div className="grid sm:grid-cols-3 gap-3 mb-4">
            <div className="rounded-lg border border-gold-200 bg-ivory-100 p-3">
              <div className="text-[10px] uppercase tracking-widest text-maroon-700">Completed donations</div>
              <div className="h-display text-2xl text-maroon-800 mt-0.5">{donationCount}</div>
            </div>
            <div className="rounded-lg border border-gold-200 bg-ivory-100 p-3">
              <div className="text-[10px] uppercase tracking-widest text-maroon-700">Direct giving</div>
              <div className="h-display text-2xl text-maroon-800 mt-0.5">{formatGBP(standaloneDonationPence)}</div>
              <div className="text-[10px] text-maroon-700/85 mt-0.5">+ {formatGBP(donationPence)} via bookings</div>
            </div>
            <div className="rounded-lg border border-gold-200 bg-ivory-100 p-3">
              <div className="text-[10px] uppercase tracking-widest text-maroon-700">Gift Aid eligible</div>
              <div className="h-display text-2xl text-maroon-800 mt-0.5">{formatGBP(giftAidDonationPence)}</div>
              <div className="text-[10px] text-saffron-700 mt-0.5">+25% claimable from HMRC = {formatGBP(Math.round(giftAidDonationPence * 0.25))}</div>
            </div>
          </div>
          {donationsByMaterial.length > 0 && (
            <div className="rounded-lg border border-gold-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-temple-gradient">
                  <tr>
                    <th className="text-left px-4 py-2 text-xs uppercase tracking-widest text-maroon-700">Dedicated to</th>
                    <th className="text-right px-4 py-2 text-xs uppercase tracking-widest text-maroon-700">Donations</th>
                    <th className="text-right px-4 py-2 text-xs uppercase tracking-widest text-maroon-700">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gold-100 bg-ivory-50">
                  {donationsByMaterial.map((r) => (
                    <tr key={r.materialLabel ?? 'general'}>
                      <td className="px-4 py-3 text-maroon-900">{r.materialLabel ?? 'General donation'}</td>
                      <td className="px-4 py-3 text-right text-maroon-700/85">{r._count._all}</td>
                      <td className="px-4 py-3 text-right text-maroon-900 tabular-nums">{formatGBP(r._sum.amountPence ?? 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {recent.length > 0 && (
        <section className="mt-6 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="h-display text-xl text-maroon-800">Latest confirmations</h2>
            <span className="text-xs text-maroon-700 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-saffron-500 animate-flicker" /> live
            </span>
          </div>
          <ul className="divide-y divide-gold-100">
            {recent.map((b) => {
              const dayPalette = paletteForDate(b.session.yagnaInstance.eventDay.date);
              return (
                <li key={b.id} className="py-2.5 grid grid-cols-12 gap-3 items-center text-sm">
                  <span className="col-span-2 font-mono text-[11px] text-maroon-700">{b.reference}</span>
                  <span className="col-span-3 text-maroon-900 font-medium truncate">{b.primaryName}</span>
                  <span className="col-span-3 inline-flex items-center gap-2 truncate">
                    <span className={`inline-block w-2.5 h-2.5 rounded-full flex-shrink-0 ${dayPalette.border.replace('border-', 'bg-')}`} title={dayPalette.name} />
                    <span className="text-maroon-900 font-medium truncate">{formatDateLong(b.session.yagnaInstance.eventDay.date)}</span>
                  </span>
                  <span className="col-span-2 text-maroon-700/90 truncate">
                    {b.session.yagnaInstance.title.replace(' Yagna', '')} · K{b.kundNumber} · {b.positions.join(',')} · {formatTime(b.session.startTime)}
                  </span>
                  <span className="col-span-1 text-maroon-900 tabular-nums text-right">
                    {formatGBP(b.amountPence + b.donationPence)}
                    {b.donationPence > 0 && <span className="text-saffron-700 text-[10px] ml-1">+♥</span>}
                  </span>
                  <span className="col-span-1 text-right text-[10px] tracking-widest text-maroon-700/80 uppercase">{b.payment?.provider ?? ''}</span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Per-day cards — each day now has multiple yagnas */}
      <h2 className="h-display text-xl text-maroon-800 mt-8 mb-3">Days, yagnas & sessions</h2>
      <div className="space-y-6">
        {days.map((d) => {
          const palette = paletteForDate(d.date);
          const dayTaken = d.yagnaInstances.reduce(
            (acc, y) => acc + y.sessions.reduce((a, s) => a + s.bookings.reduce((x, b) => x + b.positions.length, 0), 0), 0
          );
          const dayCap = d.yagnaInstances.reduce(
            (acc, y) => acc + y.sessions.filter((s) => s.enabled).length * y.kundCount * 3, 0
          );
          const dayRev = d.yagnaInstances.reduce(
            (acc, y) => acc + y.sessions.reduce((a, s) => a + s.bookings.reduce((x, b) => x + b.amountPence, 0), 0), 0
          );
          const dayDon = d.yagnaInstances.reduce(
            (acc, y) => acc + y.sessions.reduce((a, s) => a + s.bookings.reduce((x, b) => x + b.donationPence, 0), 0), 0
          );
          const dayPct = dayCap > 0 ? Math.round((dayTaken / dayCap) * 100) : 0;
          return (
            <section key={d.id} className={`card overflow-hidden border-l-4 ${palette.border}`}>
              <div className={`px-5 py-4 border-b border-gold-200 flex flex-wrap justify-between items-baseline gap-2 ${palette.bg}`}>
                <div>
                  <div className={`text-xs tracking-widest uppercase ${palette.accentText}`}>
                    {d.yagnaInstances.map((y) => y.title).join(' · ')}
                  </div>
                  <div className="h-display text-2xl text-maroon-800">{formatDateLong(d.date)}</div>
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

              {/* Each yagna runs as a sub-section */}
              <div className="divide-y divide-gold-200/60 mt-2">
                {d.yagnaInstances.map((y) => {
                  const yTaken = y.sessions.reduce((a, s) => a + s.bookings.reduce((x, b) => x + b.positions.length, 0), 0);
                  const yCap = y.sessions.filter((s) => s.enabled).length * y.kundCount * 3;
                  const yRev = y.sessions.reduce((a, s) => a + s.bookings.reduce((x, b) => x + b.amountPence, 0), 0);
                  return (
                    <div key={y.id}>
                      <div className="px-5 py-2.5 bg-ivory-100/60 flex items-baseline justify-between">
                        <div className="flex items-baseline gap-3">
                          <span className="text-[10px] tracking-widest uppercase font-semibold text-maroon-800">{y.title}</span>
                          <span className="text-xs text-maroon-700">{y.kundCount} Kunds · {y.sessions.length} session{y.sessions.length === 1 ? '' : 's'}</span>
                        </div>
                        <span className="text-xs text-maroon-700 tabular-nums">
                          {yTaken}/{yCap} · {formatGBP(yRev)}
                        </span>
                      </div>
                      <div className="divide-y divide-gold-100">
                        {y.sessions.map((s) => {
                          const taken = s.bookings.reduce((acc, b) => acc + b.positions.length, 0);
                          const sCap = y.kundCount * 3;
                          const remaining = sCap - taken;
                          const revenue = s.bookings.reduce((acc, b) => acc + b.amountPence, 0);
                          const donations = s.bookings.reduce((acc, b) => acc + b.donationPence, 0);
                          const sPct = sCap > 0 ? Math.round((taken / sCap) * 100) : 0;
                          const sPalette = paletteForSession(s.startTime);
                          return (
                            <div key={s.id} className={`relative grid grid-cols-12 gap-3 items-center px-5 py-4 group ${s.enabled ? 'hover:bg-ivory-100' : 'opacity-60'} transition`}>
                              <span className={`absolute left-0 top-0 bottom-0 w-1 ${sPalette.border.replace('border-', 'bg-')}`} />
                              <Link href={`/admin/session/${s.id}`} className="col-span-3 flex items-center gap-2.5">
                                <span className={`inline-flex items-center justify-center w-9 h-9 rounded-full ${sPalette.bg} ${sPalette.accentText}`}>
                                  <SessionIcon kind={sPalette.icon} className="w-5 h-5" />
                                </span>
                                <div>
                                  <div className={`text-[10px] uppercase tracking-widest font-semibold ${sPalette.accentText}`}>
                                    {sPalette.label}
                                    {s.optional && <span className="ml-2 text-maroon-700">· optional</span>}
                                  </div>
                                  <div className="h-display text-lg text-maroon-800 group-hover:text-saffron-700 transition leading-none">{formatTime(s.startTime)}</div>
                                </div>
                              </Link>
                              <div className="col-span-2 text-sm text-maroon-900">
                                <div className="font-medium text-maroon-800">{taken}<span className="text-maroon-700/80">/{sCap}</span> taken</div>
                                <div className="text-xs text-maroon-700">{remaining} free</div>
                              </div>
                              <div className="col-span-3">
                                <ProgressBar pct={sPct} compact />
                              </div>
                              <div className="col-span-2 text-sm text-maroon-900 tabular-nums text-right">
                                {formatGBP(revenue)}
                                {donations > 0 && <div className="text-[10px] text-saffron-700">+ {formatGBP(donations)} ♥</div>}
                              </div>
                              <div className="col-span-2 flex items-center justify-end gap-2">
                                {s.optional && <SessionToggle id={s.id} enabled={s.enabled} />}
                                <Link href={`/admin/session/${s.id}`} className="text-saffron-700">→</Link>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
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
