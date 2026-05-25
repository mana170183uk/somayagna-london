import Link from 'next/link';
import { EVENT, formatGBP, PRICE_FULL_KUND_PENCE, PRICE_SINGLE_PENCE } from '@/lib/constants';
import { Mandala, Diya, OmGlyph, LotusBorder } from '@/components/ui/Ornaments';
import { Logo } from '@/components/ui/Logo';
import StickyCTA from '@/components/landing/StickyCTA';
import { paletteForDate } from '@/lib/dayColors';

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <SpiritualIntro />
        <Timeline />
        <PurshotamSection />
        <VishnuGopalSection />
        <HowBookingWorks />
        <KundExplainer />
        <Pricing />
        <DailySchedule />
        <FAQ />
        <Contact />
      </main>
      <Footer />
      <StickyCTA />
    </>
  );
}

/* ─────────────────────────  HEADER ───────────────────────── */

function Header() {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-ivory-50/80 border-b border-gold-200/40">
      <div className="container-tight flex items-center justify-between py-3">
        <Link href="/" className="group" aria-label="SomaYagna London — home">
          <Logo size="md" />
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm text-maroon-800">
          <a href="#timeline" className="hover:text-maroon-700">Programme</a>
          <a href="#booking" className="hover:text-maroon-700">How to book</a>
          <a href="#pricing" className="hover:text-maroon-700">Seva offerings</a>
          <a href="#schedule" className="hover:text-maroon-700">Schedule</a>
          <a href="#faq" className="hover:text-maroon-700">FAQ</a>
        </nav>
        <Link href="/book" className="btn-primary !py-2.5 !px-5 !text-sm">Book a Seva</Link>
      </div>
    </header>
  );
}

/* ─────────────────────────  HERO ───────────────────────── */

function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* layered background */}
      <div className="absolute inset-0 bg-gradient-to-b from-maroon-800 via-maroon-700 to-maroon-900" />
      <div className="absolute inset-0 bg-hero-glow opacity-90" />
      <div className="absolute inset-0 paper-texture opacity-30" />
      {/* slow-rotating mandala */}
      <Mandala className="absolute -right-32 -top-32 w-[640px] text-gold-400 animate-slow-spin opacity-50" />
      <Mandala className="absolute -left-44 -bottom-44 w-[560px] text-gold-300 animate-slow-spin opacity-30" />

      <div className="relative container-tight pt-16 pb-24 md:pt-24 md:pb-32 text-ivory-50">
        <p className="eyebrow text-gold-200 mb-8">A sacred Vedic offering · London {EVENT.year}</p>

        <h1 className="h-display text-5xl md:text-7xl lg:text-[88px] text-ivory-50 max-w-4xl">
          SomaYagna <span className="text-gold-300">London</span>
        </h1>
        <p className="h-display text-2xl md:text-3xl text-ivory-100/90 mt-4 max-w-3xl italic">
          An eight-day sacred Yagna programme
        </p>

        <div className="mt-8 flex flex-col md:flex-row md:items-end md:gap-12 gap-6 text-ivory-100">
          <div>
            <div className="text-xs uppercase tracking-[0.32em] text-gold-200 mb-2">When</div>
            <div className="h-display text-3xl md:text-4xl">
              {EVENT.startDate} – {EVENT.endDate}
              <span className="text-gold-300 ml-2">{EVENT.year}</span>
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-[0.32em] text-gold-200 mb-2">Where</div>
            <div className="h-display text-2xl md:text-3xl">{EVENT.venueName}</div>
            <div className="text-sm text-ivory-100/90">{EVENT.venueAddress}</div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <span className="rounded-full border border-gold-300/40 px-4 py-1.5 text-xs tracking-wider uppercase text-gold-200">Purshotam Yagna</span>
          <span className="rounded-full border border-gold-300/40 px-4 py-1.5 text-xs tracking-wider uppercase text-gold-200">Vishnu Gopal Maha Yagna</span>
          <span className="rounded-full border border-gold-300/40 px-4 py-1.5 text-xs tracking-wider uppercase text-gold-200">Pitru Yagna</span>
          <span className="rounded-full border border-gold-300/40 px-4 py-1.5 text-xs tracking-wider uppercase text-gold-200">11 Kunds · 33 seats / session</span>
        </div>

        <div className="mt-10 flex flex-col sm:flex-row gap-3">
          <Link href="/book" className="btn-primary">
            Book a Seva / Slot
            <span aria-hidden>→</span>
          </Link>
          <a href="#schedule" className="btn-secondary !bg-ivory-50/10 !text-ivory-50 !border-ivory-50/30 hover:!bg-ivory-50/20">
            View Schedule
          </a>
        </div>

        <div className="mt-12 flex items-center gap-6 text-ivory-100/85 text-xs">
          <span className="flex items-center gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-gold-300 animate-flicker" />
            Live availability updates
          </span>
          <span>Secure payment in £ GBP</span>
          <span className="hidden md:inline">Hosted by {EVENT.organizer}</span>
        </div>
      </div>

      <LotusBorder className="absolute bottom-0 left-0 w-full text-gold-300/60" />
    </section>
  );
}

/* ─────────────────────────  SPIRITUAL INTRO ───────────────────────── */

function SpiritualIntro() {
  return (
    <section className="section bg-temple-gradient relative">
      <div className="container-tight grid md:grid-cols-12 gap-12 items-start">
        <div className="md:col-span-5 relative">
          <span className="text-maroon-700/30"><Mandala className="absolute -top-10 -left-10 w-72" /></span>
          <div className="relative">
            <p className="eyebrow mb-4">What is a Yagna?</p>
            <h2 className="h-display text-4xl md:text-5xl text-maroon-800 leading-tight">
              A sacred offering<br/>into the eternal fire.
            </h2>
          </div>
        </div>
        <div className="md:col-span-7 space-y-5 text-lg leading-relaxed text-maroon-900/85">
          <p>
            In the Vedic tradition, a <em>yajña</em> is a ritual offering made to Agni, the sacred fire,
            who carries our prayers and oblations to the gods. Performed for thousands of years and
            preceded by precise mantras, the yajña is at the heart of Sanatan Dharma — an act of
            gratitude, surrender, and divine communion.
          </p>
          <p>
            The <strong className="text-maroon-700">Soma Yagna</strong> is among the most revered of the
            great Vedic rites. Conducted by a Yagnacharya with the support of trained Brahmin priests,
            it invokes blessings of health, harmony, and well-being for all who participate.
          </p>
          <p className="text-maroon-700 italic">
            “Through rhythmic chants and sacred offerings, the Yajna seeks to harmonise the cosmos
            and nurture the well-being of all beings.”
          </p>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────  TIMELINE ───────────────────────── */

const TIMELINE = [
  { iso: '2026-06-14', date: '14 Jun', label: 'Purshotam · Pitru Yagna', type: 'purshotam', desc: 'Programme welcome & opening rites. Purshotam Yagna and Pitru Yagna.' },
  { iso: '2026-06-15', date: '15 Jun', label: 'Purshotam · Pitru Yagna', type: 'purshotam', desc: 'Active booking begins. Purshotam Yagna and Pitru Yagna throughout the day.' },
  { iso: '2026-06-16', date: '16 Jun', label: 'Vishnu Gopal · Pitru', type: 'vishnu', desc: 'Daily Vishnu Gopal Yagna alongside Pitru Yagna sessions.' },
  { iso: '2026-06-17', date: '17 Jun', label: 'Vishnu Gopal · Pitru', type: 'vishnu', desc: 'Daily Vishnu Gopal Yagna alongside Pitru Yagna sessions.' },
  { iso: '2026-06-18', date: '18 Jun', label: 'Vishnu Gopal · Pitru', type: 'vishnu', desc: 'Daily Vishnu Gopal Yagna alongside Pitru Yagna sessions.' },
  { iso: '2026-06-19', date: '19 Jun', label: 'Vishnu Gopal · Pitru', type: 'vishnu', desc: 'Daily Vishnu Gopal Yagna alongside Pitru Yagna sessions.' },
  { iso: '2026-06-20', date: '20 Jun', label: 'Vishnu Gopal · Pitru', type: 'vishnu', desc: 'Extended Saturday programme — five sessions.' },
  { iso: '2026-06-21', date: '21 Jun', label: 'Vishnu Gopal · Pitru', type: 'vishnu', desc: 'Concluding day, finishes around 15:00.' }
];

function Timeline() {
  return (
    <section id="timeline" className="section bg-ivory-100 relative">
      <div className="container-tight">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <p className="eyebrow mb-3">The Programme</p>
          <h2 className="h-display text-4xl md:text-5xl text-maroon-800">Eight days of sacred ritual</h2>
          <p className="mt-4 text-maroon-900/90">
            From the inaugural welcome on 14 June through the concluding day on 21 June, each day carries its own significance.
          </p>
        </div>

        <ol className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {TIMELINE.map((t) => {
            const palette = paletteForDate(t.iso);
            return (
              <li key={t.date} className={`relative overflow-hidden rounded-2xl border p-4 shadow-soft-gold/30 ${palette.bg} ${palette.border}`}>
                <div className={`text-xs tracking-wider uppercase mb-1 ${palette.accentText}`}>
                  {t.date}
                </div>
                <div className="h-display text-lg leading-tight text-maroon-900">{t.label}</div>
                <p className="text-xs text-maroon-900 mt-2">{t.desc}</p>
                <div className={`absolute inset-x-0 bottom-0 h-1 ${palette.border.replace('border-', 'bg-')}`} />
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

/* ─────────────────────────  PURSHOTAM ───────────────────────── */

function PurshotamSection() {
  return (
    <section className="section bg-temple-gradient">
      <div className="container-tight grid md:grid-cols-2 gap-14 items-center">
        <div className="relative">
          <div className="aspect-[4/5] rounded-3xl bg-gradient-to-br from-saffron-400 via-saffron-600 to-maroon-700 shadow-altar relative overflow-hidden">
            <Mandala className="absolute inset-0 m-auto w-full text-gold-200 opacity-40" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-gold-100 text-center px-6">
                <div className="text-xs tracking-[0.4em] uppercase opacity-80">Day 1 · 15 June</div>
                <div className="h-display text-4xl mt-2">Purshotam<br/>Yagna</div>
                <div className="mt-6 inline-block px-4 py-1 rounded-full border border-gold-100/40 text-xs">The opening rite</div>
              </div>
            </div>
            <Diya className="absolute bottom-6 left-1/2 -translate-x-1/2 w-16 text-saffron-800" />
          </div>
        </div>
        <div>
          <p className="eyebrow mb-3">15 June · Day One</p>
          <h2 className="h-display text-4xl md:text-5xl text-maroon-800">Purshotam Yagna</h2>
          <p className="mt-5 text-lg leading-relaxed text-maroon-900/80">
            The opening yagna of the programme honours <em>Purushottama</em> — the Supreme Being —
            invoking grace, purity, and an auspicious beginning for the days that follow.
            Active seva booking opens on this day with three sessions: morning, mid-afternoon and late-afternoon.
          </p>
          <ul className="mt-6 space-y-3 text-maroon-900/85">
            {[
              ['Three sessions', '10:15 AM · 2:15 PM · 4:15 PM'],
              ['Capacity', '11 Kunds × 3 positions = 33 seats per session'],
              ['Open to', 'Couples, siblings, families and individual devotees']
            ].map(([k, v]) => (
              <li key={k} className="flex gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-saffron-500 shrink-0" />
                <div><strong className="text-maroon-800">{k}.</strong> <span className="text-maroon-900/90">{v}</span></div>
              </li>
            ))}
          </ul>
          <Link href="/book?day=1" className="btn-primary mt-8">Reserve a seat on 15 June</Link>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────  VISHNU GOPAL ───────────────────────── */

function VishnuGopalSection() {
  return (
    <section className="section bg-maroon-800 text-ivory-50 relative overflow-hidden">
      <Mandala className="absolute -left-32 top-1/2 -translate-y-1/2 w-[520px] text-gold-400 opacity-25" />
      <Mandala className="absolute -right-40 -bottom-40 w-[420px] text-gold-300 opacity-25" />

      <div className="container-tight grid md:grid-cols-2 gap-14 items-center relative">
        <div className="order-2 md:order-1">
          <p className="eyebrow text-gold-200 mb-3">16 – 21 June · Six days</p>
          <h2 className="h-display text-4xl md:text-5xl">Vishnu Gopal Maha Yagna</h2>
          <p className="mt-5 text-lg leading-relaxed text-ivory-100/90">
            From the second day onwards, devotees gather daily for the Vishnu Gopal Yagna —
            invoking the grace of Lord Vishnu in his beloved Gopal form. Each day mirrors the same
            three-session structure, allowing families to participate on the day most meaningful to them.
          </p>
          <ul className="mt-6 grid sm:grid-cols-2 gap-3">
            {['16 June','17 June','18 June','19 June','20 June','21 June'].map((d) => (
              <li key={d} className="rounded-xl border border-gold-300/30 bg-ivory-50/5 px-4 py-3">
                <div className="text-xs text-gold-200 tracking-widest uppercase">Day</div>
                <div className="h-display text-xl">{d}</div>
              </li>
            ))}
          </ul>
          <Link href="/book" className="btn-primary mt-8 !from-gold-400 !to-gold-600 !text-maroon-900">Choose your day & seat</Link>
        </div>
        <div className="order-1 md:order-2 relative">
          <div className="aspect-square rounded-full bg-gradient-to-br from-gold-300/30 to-transparent border border-gold-300/30 flex items-center justify-center">
            <div className="text-center p-8">
              <Diya className="mx-auto w-20 text-saffron-700" />
              <div className="h-display text-3xl mt-4">Daily Yagna</div>
              <div className="text-ivory-100/90 mt-2">Six consecutive days</div>
              <div className="mt-6 inline-flex items-center gap-2 text-xs tracking-widest uppercase text-gold-200">
                Morning · Afternoon · Late Afternoon
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────  HOW BOOKING WORKS ───────────────────────── */

const STEPS = [
  ['Choose a date', 'Pick any active day between 15 – 21 June.'],
  ['Choose a session', 'Three timings each day: 10:15 AM, 2:15 PM or 4:15 PM.'],
  ['Pick a Kund & position', 'See live availability of all 11 Kunds and positions A, B, C.'],
  ['Register & pay', 'Provide your details and pay securely in GBP. Your seat is held for 10 minutes during checkout.']
];

function HowBookingWorks() {
  return (
    <section id="booking" className="section bg-ivory-100">
      <div className="container-tight">
        <div className="max-w-3xl mb-12">
          <p className="eyebrow mb-3">How booking works</p>
          <h2 className="h-display text-4xl md:text-5xl text-maroon-800">Reserve your seva in four simple steps</h2>
        </div>
        <ol className="grid md:grid-cols-4 gap-4">
          {STEPS.map(([title, body], i) => (
            <li key={title} className="card p-6 relative">
              <div className="text-gold-500 text-sm tracking-widest">STEP {String(i + 1).padStart(2, '0')}</div>
              <div className="h-display text-xl mt-2 text-maroon-800">{title}</div>
              <p className="mt-2 text-sm text-maroon-900/90">{body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ─────────────────────────  KUND EXPLAINER ───────────────────────── */

function KundExplainer() {
  return (
    <section className="section bg-temple-gradient">
      <div className="container-tight grid md:grid-cols-2 gap-12 items-center">
        <div>
          <p className="eyebrow mb-3">Inventory at a glance</p>
          <h2 className="h-display text-4xl md:text-5xl text-maroon-800">11 Kunds. 3 positions each. 33 seats per session.</h2>
          <p className="mt-5 text-lg text-maroon-900/80 leading-relaxed">
            Each <strong>Kund</strong> is a sacred fire altar, built with precise geometry to mirror cosmic
            order. Around each Kund sit three participants in positions <strong>A</strong>, <strong>B</strong>,
            and <strong>C</strong>. You may reserve a single seat — ideal for a couple or siblings — or you
            may dedicate an entire Kund for your family.
          </p>
          <p className="mt-3 text-maroon-900/90">
            The booking grid updates in real time. Held seats are reserved for ten minutes while another
            family completes their payment; if they don’t, the seat returns to availability automatically.
          </p>
        </div>
        <KundVisual />
      </div>
    </section>
  );
}

function KundVisual() {
  return (
    <div className="card p-8 relative">
      <div className="text-xs tracking-widest uppercase text-maroon-700/90 mb-2">A single Kund</div>
      <div className="h-display text-2xl text-maroon-800 mb-6">Three sacred positions</div>
      <div className="relative aspect-square max-w-sm mx-auto">
        {/* central altar */}
        <div className="absolute inset-1/4 rounded-full bg-gradient-to-br from-saffron-400 to-maroon-700 shadow-altar flex items-center justify-center">
          <Diya className="w-16 text-saffron-800" />
        </div>
        {/* three positions */}
        {['A', 'B', 'C'].map((pos, i) => {
          const angle = i * 120 - 90;
          const r = 42; // percent
          const x = 50 + r * Math.cos((angle * Math.PI) / 180);
          const y = 50 + r * Math.sin((angle * Math.PI) / 180);
          return (
            <div
              key={pos}
              className="absolute -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-ivory-50 border-2 border-gold-400 flex items-center justify-center h-display text-2xl text-maroon-800 shadow-soft-gold"
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              {pos}
            </div>
          );
        })}
        {/* connecting ring */}
        <div className="absolute inset-[18%] rounded-full border border-dashed border-gold-400/50" />
      </div>
      <div className="mt-6 grid grid-cols-3 gap-2 text-center">
        {[
          ['Free', 'bg-ivory-50 border-gold-300 text-maroon-800'],
          ['Held', 'bg-saffron-100 border-saffron-400 text-saffron-800'],
          ['Booked', 'bg-maroon-700 border-maroon-700 text-ivory-50']
        ].map(([label, cls]) => (
          <div key={label} className={`rounded-lg border ${cls} text-xs py-2 font-medium`}>{label}</div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────  PRICING ───────────────────────── */

function Pricing() {
  return (
    <section id="pricing" className="section bg-ivory-100">
      <div className="container-tight">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="eyebrow mb-3">Seva offerings</p>
          <h2 className="h-display text-4xl md:text-5xl text-maroon-800">Two ways to participate</h2>
          <p className="mt-3 text-maroon-900/90">All offerings are inclusive — every yajamana receives the same blessings.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <PriceCard
            title="Single Position"
            subtitle="For a couple or siblings"
            price={PRICE_SINGLE_PENCE}
            features={[
              'One seat at a Kund of your choice',
              'Position A, B or C',
              'Suitable for couples & sibling pairs',
              'Real-time availability shown at booking'
            ]}
            cta="Book a Single Position"
            href="/book?type=SINGLE_POSITION"
          />
          <PriceCard
            title="Full Kund"
            subtitle="A complete altar for your family"
            price={PRICE_FULL_KUND_PENCE}
            features={[
              'All three positions A, B and C reserved together',
              'A discounted package rate',
              'Available only when all three positions are free',
              'Recommended for families'
            ]}
            cta="Book a Full Kund"
            href="/book?type=FULL_KUND"
            highlight
          />
        </div>
      </div>
    </section>
  );
}

function PriceCard({ title, subtitle, price, features, cta, href, highlight = false }: {
  title: string; subtitle: string; price: number; features: string[]; cta: string; href: string; highlight?: boolean;
}) {
  return (
    <div className={`relative card p-8 ${highlight ? 'bg-gradient-to-br from-maroon-700 to-maroon-900 text-ivory-50 border-gold-400 shadow-altar' : ''}`}>
      {highlight && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold-400 text-maroon-900 text-xs tracking-widest uppercase px-3 py-1 rounded-full">
          Discounted package
        </span>
      )}
      <div className={`text-xs tracking-widest uppercase ${highlight ? 'text-gold-200' : 'text-maroon-700/90'}`}>{subtitle}</div>
      <div className={`h-display text-3xl mt-1 ${highlight ? '' : 'text-maroon-800'}`}>{title}</div>
      <div className="mt-6 flex items-baseline gap-2">
        <span className={`h-display text-5xl ${highlight ? 'text-gold-200' : 'text-saffron-700'}`}>{formatGBP(price)}</span>
      </div>
      <ul className={`mt-6 space-y-2 text-sm ${highlight ? 'text-ivory-100/90' : 'text-maroon-900/90'}`}>
        {features.map((f) => (
          <li key={f} className="flex gap-2">
            <span className={`mt-1 h-1.5 w-1.5 rounded-full shrink-0 ${highlight ? 'bg-gold-300' : 'bg-saffron-500'}`} />
            {f}
          </li>
        ))}
      </ul>
      <Link href={href} className={`mt-8 ${highlight ? 'btn-primary !from-gold-400 !to-gold-600 !text-maroon-900' : 'btn-primary'} w-full`}>
        {cta}
      </Link>
    </div>
  );
}

/* ─────────────────────────  DAILY SCHEDULE ───────────────────────── */

function DailySchedule() {
  return (
    <section id="schedule" className="section bg-temple-gradient">
      <div className="container-tight">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <p className="eyebrow mb-3">Daily Schedule</p>
          <h2 className="h-display text-4xl md:text-5xl text-maroon-800">Three sessions, every active day</h2>
          <p className="mt-3 text-maroon-900/90">15 June onwards — same timings every day.</p>
        </div>
        <div className="grid sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
          {[
            ['Morning', '10:15 AM'],
            ['Afternoon I', '2:15 PM'],
            ['Afternoon II', '4:15 PM']
          ].map(([label, time]) => (
            <div key={label} className="card p-6 text-center">
              <div className="text-xs tracking-widest uppercase text-saffron-700">{label}</div>
              <div className="h-display text-3xl mt-2 text-maroon-800">{time}</div>
              <div className="text-xs text-maroon-900/85 mt-2">33 seats · 11 Kunds</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────  FAQ ───────────────────────── */

const FAQS = [
  ['What does it mean to "book a seva"?',
    'A seva is a devotional offering. Reserving a seat at a Kund means you take part as a yajamana (sacrificer) — the priests perform the ritual on your behalf, and the spiritual merit is dedicated to you and your family.'],
  ['Who can attend?',
    'All are welcome — devotees, families, children, elders, and visitors of every background. Single positions are well-suited to a couple or two siblings; a full Kund is ideal for families.'],
  ['What should I wear and bring?',
    'Modest, comfortable clothing is recommended. Please arrive 20 minutes before your session. We will email your booking reference; please bring it on your phone or printed.'],
  ['Is there a fee for the 14 June welcome?',
    'No. The inauguration on 14 June is open to all without booking. The active booked sessions begin on 15 June.'],
  ['Can I book just one seat for myself?',
    'Yes. A "Single Position" booking (£201) reserves one seat. It is described as ideal for a couple or siblings but anyone may book it.'],
  ['When does my seat become final?',
    'Your selection is held for 10 minutes while you complete payment. Once payment succeeds, you receive an immediate confirmation email; if payment fails, the seat is automatically released.'],
  ['Can I get a refund or change my booking?',
    'Please contact the organisers directly using the details below — we will do our best to help.']
];

function FAQ() {
  return (
    <section id="faq" className="section bg-ivory-100">
      <div className="container-tight max-w-3xl">
        <p className="eyebrow mb-3">Questions, gently answered</p>
        <h2 className="h-display text-4xl md:text-5xl text-maroon-800">Frequently asked</h2>
        <div className="mt-10 divide-y divide-gold-200">
          {FAQS.map(([q, a]) => (
            <details key={q} className="group py-5">
              <summary className="cursor-pointer list-none flex justify-between items-start gap-6">
                <span className="h-display text-xl text-maroon-800">{q}</span>
                <span className="text-saffron-600 text-2xl leading-none mt-1 transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-maroon-900/90 leading-relaxed">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────  CONTACT ───────────────────────── */

function Contact() {
  return (
    <section className="section bg-maroon-900 text-ivory-50 relative overflow-hidden">
      <Mandala className="absolute -right-32 -top-32 w-[420px] text-gold-400 opacity-20 animate-slow-spin" />
      <div className="container-tight grid md:grid-cols-2 gap-12 relative">
        <div>
          <p className="eyebrow text-gold-200 mb-3">Organiser support</p>
          <h2 className="h-display text-4xl md:text-5xl">We are here to help</h2>
          <p className="mt-4 text-ivory-100 max-w-md">
            For booking changes, group reservations, or any question about your participation, please reach the
            programme team.
          </p>
        </div>
        <div className="space-y-5 text-ivory-100">
          <ContactRow label="Organising charity" value={EVENT.organizer} />
          <ContactRow label="Email" value={EVENT.contactEmail} href={`mailto:${EVENT.contactEmail}`} />
          <ContactRow label="Phone" value={EVENT.contactPhone} href={`tel:${EVENT.contactPhone.replace(/\s/g, '')}`} />
          <ContactRow label="Venue" value={`${EVENT.venueName}, ${EVENT.venueAddress}`} />
        </div>
      </div>
    </section>
  );
}

function ContactRow({ label, value, href }: { label: string; value: string; href?: string }) {
  return (
    <div className="border-b border-gold-300/20 pb-3">
      <div className="text-xs uppercase tracking-widest text-gold-200">{label}</div>
      {href ? (
        <a href={href} className="h-display text-2xl hover:text-gold-200 transition">{value}</a>
      ) : (
        <div className="h-display text-2xl">{value}</div>
      )}
    </div>
  );
}

/* ─────────────────────────  FOOTER ───────────────────────── */

function Footer() {
  return (
    <footer className="bg-maroon-900 text-ivory-100/90 border-t border-gold-300/20">
      <div className="container-tight py-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-gold-300"><OmGlyph className="w-5 h-5" /></span>
          © {new Date().getFullYear()} {EVENT.organizer}
        </div>
        <div className="flex gap-4">
          <a href="#" className="hover:text-ivory-50">Privacy</a>
          <a href="#" className="hover:text-ivory-50">Refund policy</a>
          <Link href="/admin" className="hover:text-ivory-50">Organiser login</Link>
        </div>
      </div>
    </footer>
  );
}
