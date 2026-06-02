import { EVENT } from '@/lib/constants';
import SiteHeader from '@/components/layout/SiteHeader';
import SiteFooter from '@/components/layout/SiteFooter';
import ContactForm from '@/components/contact/ContactForm';
import { Mandala } from '@/components/ui/Ornaments';

export const metadata = {
  title: `Contact · ${EVENT.name}`,
  description: 'Get in touch about bookings, donations, seva or to request a change to an existing reservation.'
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-ivory-50">
      <SiteHeader />

      <main>
        <section className="relative overflow-hidden bg-gradient-to-b from-maroon-800 via-maroon-700 to-maroon-900 text-ivory-50">
          <Mandala className="absolute -right-32 -top-32 w-[480px] text-gold-400 opacity-35 animate-slow-spin" />
          <div className="container-tight relative pt-12 pb-16 md:pt-16 md:pb-20">
            <p className="eyebrow text-gold-200 mb-3">— Get in touch —</p>
            <h1 className="h-display text-4xl md:text-6xl text-ivory-50">How can we help?</h1>
            <p className="mt-3 text-ivory-100/85 max-w-2xl">
              Send us a message about a booking, a donation, a seva, or any other question. We aim to reply within 24 hours.
            </p>
          </div>
        </section>

        <section className="section">
          <div className="container-tight grid lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7">
              <ContactForm />
            </div>

            <aside className="lg:col-span-5">
              <div className="card p-6 sticky top-24">
                <p className="eyebrow mb-3">Direct line</p>
                <h2 className="h-display text-2xl text-maroon-800">Prefer to reach us directly?</h2>
                <ul className="mt-4 space-y-3 text-sm text-maroon-900/85">
                  <li>
                    <div className="text-xs uppercase tracking-widest text-maroon-700/70">Email</div>
                    <a className="text-saffron-700 hover:text-saffron-800" href={`mailto:${EVENT.contactEmail}`}>{EVENT.contactEmail}</a>
                  </li>
                  <li>
                    <div className="text-xs uppercase tracking-widest text-maroon-700/70">Phone / WhatsApp</div>
                    <a className="text-saffron-700 hover:text-saffron-800" href={`tel:${EVENT.contactPhone.replace(/\s/g, '')}`}>{EVENT.contactPhone}</a>
                  </li>
                  <li>
                    <div className="text-xs uppercase tracking-widest text-maroon-700/70">Venue</div>
                    <div>{EVENT.venueName}<br/>{EVENT.venueAddress}</div>
                    <a
                      className="inline-flex items-center gap-1 text-xs uppercase tracking-widest text-saffron-700 hover:text-saffron-800 mt-1"
                      href={EVENT.venueMapLink}
                      target="_blank"
                      rel="noopener noreferrer"
                    >📍 Open in Google Maps</a>
                  </li>
                </ul>
                <hr className="border-gold-200 my-5" />
                <p className="text-xs text-maroon-900/70 leading-relaxed">
                  To request a change to a booking — different date, session or position — pick <strong>Change an existing booking</strong> below and include your booking reference (SY-…).
                </p>
              </div>
            </aside>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
