import Link from 'next/link';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getAdminFromCookies } from '@/lib/auth';
import { formatDateLong, formatGBP, formatTime, SESSION_CAPACITY } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export default async function AdminHome() {
  const admin = await getAdminFromCookies();
  if (!admin) redirect('/admin/login');

  const days = await prisma.eventDay.findMany({
    orderBy: { date: 'asc' },
    where: { isActive: true },
    include: {
      sessions: {
        orderBy: { startTime: 'asc' },
        include: {
          bookings: { where: { status: 'CONFIRMED' }, select: { positions: true, amountPence: true } }
        }
      }
    }
  });

  const totals = {
    bookings: await prisma.booking.count({ where: { status: 'CONFIRMED' } }),
    revenuePence: (await prisma.booking.aggregate({
      where: { status: 'CONFIRMED' }, _sum: { amountPence: true }
    }))._sum.amountPence ?? 0,
    holds: await prisma.bookingHold.count({ where: { expiresAt: { gt: new Date() }, booking: null } })
  };

  return (
    <div>
      <header className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <p className="eyebrow mb-2">Organiser Dashboard</p>
          <h1 className="h-display text-3xl text-maroon-800">All bookings, at a glance</h1>
          <p className="text-sm text-maroon-700">Signed in as {admin.email}</p>
        </div>
        <div className="flex gap-2">
          <a href="/api/admin/export" className="btn-secondary">Export CSV</a>
          <Link href="/" className="btn-ghost">View site</Link>
        </div>
      </header>

      <div className="grid sm:grid-cols-3 gap-3 mt-6">
        <Stat label="Confirmed bookings" value={String(totals.bookings)} />
        <Stat label="Revenue (GBP)" value={formatGBP(totals.revenuePence)} />
        <Stat label="Active holds" value={String(totals.holds)} />
      </div>

      <div className="mt-8 space-y-6">
        {days.map((d) => (
          <section key={d.id} className="card overflow-hidden">
            <div className="px-5 py-4 bg-temple-gradient border-b border-gold-200 flex justify-between items-baseline flex-wrap gap-2">
              <div>
                <div className="text-xs tracking-widest uppercase text-maroon-700">{d.yagnaType.replace('_', ' ')}</div>
                <div className="h-display text-2xl text-maroon-800">{formatDateLong(d.date)} — {d.title}</div>
              </div>
            </div>
            <div className="divide-y divide-gold-100">
              {d.sessions.map((s) => {
                const taken = s.bookings.reduce((acc, b) => acc + b.positions.length, 0);
                const remaining = SESSION_CAPACITY - taken;
                const revenue = s.bookings.reduce((acc, b) => acc + b.amountPence, 0);
                return (
                  <Link
                    key={s.id} href={`/admin/session/${s.id}`}
                    className="grid grid-cols-12 gap-3 items-center px-5 py-4 hover:bg-ivory-100"
                  >
                    <div className="col-span-3 h-display text-xl text-maroon-800">{s.label}</div>
                    <div className="col-span-2 h-display text-lg text-saffron-700">{formatTime(s.startTime)}</div>
                    <div className="col-span-3 text-sm text-maroon-900/90">
                      <span className="font-medium text-maroon-800">{taken}</span>/{SESSION_CAPACITY} taken
                      <span className="ml-3 text-maroon-700">{remaining} free</span>
                    </div>
                    <div className="col-span-3 text-sm text-maroon-900/90 tabular-nums">{formatGBP(revenue)}</div>
                    <div className="col-span-1 text-right text-saffron-700">→</div>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-5">
      <div className="text-xs tracking-widest uppercase text-maroon-700/90">{label}</div>
      <div className="h-display text-3xl text-maroon-800 mt-1">{value}</div>
    </div>
  );
}
