import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { EVENT, formatDateLong, formatGBP, formatTime } from '@/lib/constants';
import { Mandala, Diya, OmGlyph } from '@/components/ui/Ornaments';

export const dynamic = 'force-dynamic';

export default async function Confirmation({ params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = await params;
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { session: { include: { yagnaInstance: { include: { eventDay: true } } } }, payment: true }
  });
  if (!booking) notFound();

  const typeLabel = booking.bookingType === 'FULL_KUND'
    ? 'Full Kund (positions A, B & C)'
    : `Single Position (${booking.positions.join(', ')})`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-maroon-800 to-maroon-900 text-ivory-50 relative overflow-hidden">
      <Mandala className="absolute -top-40 -right-40 w-[640px] text-gold-400 opacity-25 animate-slow-spin" />
      <Mandala className="absolute -bottom-32 -left-32 w-[480px] text-gold-300 opacity-20 animate-slow-spin" />

      <header className="relative container-tight py-6">
        <Link href="/" className="inline-flex items-center gap-2 text-ivory-100 hover:text-gold-200 transition">
          <OmGlyph className="w-5 h-5" />
          <span className="h-display text-xl">SomaYagna London</span>
        </Link>
      </header>

      <main className="relative container-tight pb-16">
        <div className="max-w-2xl mx-auto bg-ivory-50 text-maroon-900 rounded-3xl shadow-altar overflow-hidden">
          <div className="bg-gradient-to-b from-saffron-500 to-maroon-700 text-ivory-50 px-8 py-10 text-center">
            <Diya className="mx-auto w-16 text-saffron-800" />
            <div className="text-xs tracking-[0.4em] uppercase text-gold-200 mt-4">Booking confirmed</div>
            <h1 className="h-display text-4xl md:text-5xl mt-2">Your seat is reserved</h1>
            <p className="text-gold-100/90 mt-2">Reference {booking.reference}</p>
          </div>

          <div className="p-8 md:p-10 space-y-4">
            <Row k="Yagna" v={booking.session.yagnaInstance.title} />
            <Row k="Date" v={formatDateLong(booking.session.yagnaInstance.eventDay.date)} />
            <Row k="Session" v={`${booking.session.label} · ${formatTime(booking.session.startTime)}`} />
            <Row k="Kund" v={`Kund ${booking.kundNumber}`} />
            <Row k="Position" v={typeLabel} />
            <Row k="Seva amount" v={formatGBP(booking.amountPence)} />
            {booking.donationPence > 0 && (
              <Row k="Donation (charity)" v={formatGBP(booking.donationPence)} />
            )}
            {booking.donationPence > 0 && (
              <Row k="Total paid" v={formatGBP(booking.amountPence + booking.donationPence)} />
            )}
            <Row k="Venue" v={`${EVENT.venueName}, ${EVENT.venueAddress}`} />

            <div className="pt-2">
              <div className="text-xs uppercase tracking-widest text-maroon-700/90 mb-2">How to find us</div>
              <div className="rounded-2xl overflow-hidden border border-gold-200 shadow-soft-gold">
                <iframe
                  src={EVENT.venueMapEmbedUrl}
                  title={`Map of ${EVENT.venueName}, ${EVENT.venueAddress}`}
                  width="100%"
                  height="240"
                  style={{ border: 0 }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              </div>
              <a
                href={EVENT.venueMapLink}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary mt-3 inline-flex items-center gap-2"
              >
                <span aria-hidden>📍</span> Open directions in Google Maps
              </a>
            </div>

            <hr className="border-gold-200 my-4" />
            <p className="text-sm text-maroon-900/90 leading-relaxed">
              A confirmation email is on its way to <strong>{booking.email}</strong>.
              Please arrive 20 minutes before your session. Modest clothing is recommended.
              For any changes, contact us at{' '}
              <a className="text-saffron-700 underline" href={`mailto:${EVENT.contactEmail}`}>{EVENT.contactEmail}</a>.
            </p>

            <div className="flex gap-3 pt-2">
              <Link href="/book" className="btn-secondary">Book another seva</Link>
              <Link href="/" className="btn-ghost">Return home</Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-1 border-b border-gold-100 pb-3">
      <dt className="text-xs uppercase tracking-widest text-maroon-700/90">{k}</dt>
      <dd className="h-display text-xl text-maroon-900">{v}</dd>
    </div>
  );
}
