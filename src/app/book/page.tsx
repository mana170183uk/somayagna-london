import BookingWizard from '@/components/booking/BookingWizard';
import { prisma } from '@/lib/prisma';
import { ENABLED_PROVIDERS } from '@/lib/constants';
import Link from 'next/link';
import { OmGlyph } from '@/components/ui/Ornaments';

export const dynamic = 'force-dynamic';

export default async function BookPage() {
  const days = await prisma.eventDay.findMany({
    orderBy: { date: 'asc' },
    include: { sessions: { orderBy: { startTime: 'asc' } } }
  });

  const initial = days.map((d) => ({
    id: d.id,
    date: d.date.toISOString().slice(0, 10),
    title: d.title,
    yagnaType: d.yagnaType,
    isActive: d.isActive,
    sessions: d.sessions.map((s) => ({ id: s.id, startTime: s.startTime, label: s.label }))
  }));

  return (
    <div className="min-h-screen bg-ivory-100">
      <header className="sticky top-0 z-30 bg-ivory-50/90 backdrop-blur border-b border-gold-200/60">
        <div className="container-tight flex items-center justify-between py-3">
          <Link href="/" className="flex items-center gap-2 text-maroon-800">
            <OmGlyph className="w-6 h-6 text-maroon-700" />
            <span className="h-display text-xl">SomaYagna London</span>
          </Link>
          <Link href="/" className="btn-ghost">← Back</Link>
        </div>
      </header>
      <main className="container-tight py-8 md:py-14">
        <div className="mb-8">
          <p className="eyebrow mb-2">Reserve a seva</p>
          <h1 className="h-display text-3xl md:text-5xl text-maroon-800">Book your seat at the Yagna</h1>
          <p className="mt-2 text-maroon-900/70 max-w-2xl">
            Select a day, time, Kund and position. Your seat is held for ten minutes while you complete payment.
          </p>
        </div>
        <BookingWizard
          initialDays={initial}
          enabledProviders={ENABLED_PROVIDERS}
        />
      </main>
    </div>
  );
}
