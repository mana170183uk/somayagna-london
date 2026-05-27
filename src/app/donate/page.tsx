import Link from 'next/link';
import Image from 'next/image';
import { OmGlyph, Mandala, Diya, LotusBorder } from '@/components/ui/Ornaments';
import DonateClient from '@/components/donate/DonateClient';
import { ENABLED_PROVIDERS, EVENT } from '@/lib/constants';
import { MATERIALS } from '@/lib/materials';
import { HERO, QUOTES, WHERE_IT_GOES, ASSURANCES } from '@/lib/donation-copy';

export const metadata = {
  title: `Donate · ${EVENT.name}`,
  description: 'Support the SomaYagna London programme — ghee, prasad, sacred wood, annadana and more.'
};

export default function DonatePage() {
  const featuredQuote = QUOTES[0];

  return (
    <div className="min-h-screen bg-ivory-50">
      <Header />

      <main>
        {/* ───── Hero ───── */}
        <section className="relative overflow-hidden bg-gradient-to-b from-maroon-800 via-maroon-700 to-maroon-900 text-ivory-50">
          <Mandala className="absolute -right-32 -top-32 w-[520px] text-gold-400 opacity-40 animate-slow-spin" />
          <Mandala className="absolute -left-44 -bottom-44 w-[480px] text-gold-300 opacity-25 animate-slow-spin" />
          <div className="relative container-tight pt-16 pb-20 md:pt-24 md:pb-28">
            <p className="eyebrow text-gold-200 mb-6">{HERO.eyebrow}</p>
            <h1 className="h-display text-5xl md:text-7xl text-ivory-50 max-w-3xl">{HERO.title}</h1>
            <p className="mt-5 text-lg md:text-xl text-ivory-100/85 max-w-2xl leading-relaxed">{HERO.subtitle}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#offerings" className="btn-primary">Choose an offering →</a>
              <a href="#custom" className="btn-secondary !bg-ivory-50/10 !text-ivory-50 !border-ivory-50/30 hover:!bg-ivory-50/20">Donate any amount</a>
            </div>
          </div>
          <LotusBorder className="absolute bottom-0 left-0 w-full text-gold-300/60" />
        </section>

        {/* ───── Featured quote ───── */}
        <section className="bg-temple-gradient py-14 md:py-20">
          <div className="container-tight max-w-3xl text-center">
            <div className="text-saffron-600 inline-block divider-om mb-6" />
            <blockquote className="h-display text-2xl md:text-3xl text-maroon-800 leading-snug italic">
              “{featuredQuote.text}”
            </blockquote>
            <p className="text-sm text-maroon-700/70 mt-4">{featuredQuote.attribution}</p>
          </div>
        </section>

        {/* ───── Material offerings + custom ───── */}
        <section id="offerings" className="section bg-ivory-100">
          <div className="container-tight">
            <div className="max-w-2xl mb-10">
              <p className="eyebrow mb-3">Offerings</p>
              <h2 className="h-display text-4xl md:text-5xl text-maroon-800">Dedicate your gift</h2>
              <p className="mt-3 text-maroon-900/75">
                Choose a specific material to sponsor, or give a free amount toward the programme as a whole. Every contribution is treated with equal care.
              </p>
            </div>

            <DonateClient
              materials={MATERIALS}
              enabledProviders={ENABLED_PROVIDERS}
            />
          </div>
        </section>

        {/* ───── Where does it go ───── */}
        <section className="section bg-temple-gradient">
          <div className="container-tight grid md:grid-cols-2 gap-12">
            <div>
              <p className="eyebrow mb-3">Transparency</p>
              <h2 className="h-display text-4xl md:text-5xl text-maroon-800">Where your gift goes</h2>
              <p className="mt-4 text-maroon-900/80 leading-relaxed">
                Every penny is used for the ritual, the people who serve it, and the community that gathers around it. Unity in Divinity reports its activities and finances to the Charity Commission for England and Wales.
              </p>
            </div>
            <ul className="space-y-4">
              {WHERE_IT_GOES.map(([title, body]) => (
                <li key={title} className="card p-5">
                  <div className="h-display text-xl text-maroon-800">{title}</div>
                  <p className="text-sm text-maroon-900/70 mt-1">{body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ───── Assurances ───── */}
        <section className="section bg-ivory-100">
          <div className="container-tight">
            <div className="max-w-2xl mx-auto text-center mb-10">
              <p className="eyebrow mb-3">Held with care</p>
              <h2 className="h-display text-4xl md:text-5xl text-maroon-800">Your gift, treated with reverence</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {ASSURANCES.map(([title, body]) => (
                <div key={title} className="card p-5">
                  <div className="h-display text-lg text-maroon-800">{title}</div>
                  <p className="text-xs text-maroon-900/70 mt-1.5 leading-relaxed">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ───── QR + Share section ───── */}
        <section className="section bg-maroon-900 text-ivory-50 relative overflow-hidden">
          <Mandala className="absolute -left-32 -bottom-32 w-[420px] text-gold-400 opacity-25 animate-slow-spin" />
          <div className="container-tight grid md:grid-cols-2 gap-10 items-center relative">
            <div>
              <p className="eyebrow text-gold-200 mb-3">Share the seva</p>
              <h2 className="h-display text-4xl md:text-5xl">Scan to donate. Share to multiply.</h2>
              <p className="mt-5 text-ivory-100/85 leading-relaxed max-w-md">
                Print this QR code on programme cards, screens, and venue signage. Anyone can scan it with their phone camera to open this donate page directly — no typing of URLs.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a href="/qr/donate-qr.png" download className="btn-primary !from-gold-400 !to-gold-600 !text-maroon-900">Download PNG</a>
                <a href="/qr/donate-qr.svg" download className="btn-secondary !bg-ivory-50/10 !text-ivory-50 !border-ivory-50/30 hover:!bg-ivory-50/20">Download SVG</a>
                <Link href="/qr" className="btn-ghost text-ivory-100/80 hover:text-ivory-50">Site QR →</Link>
              </div>
              <p className="text-xs text-ivory-100/55 mt-5">
                The QR resolves to <code className="font-mono">{`${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://somayagna.unityindivinity.com'}/donate`}</code>
              </p>
            </div>
            <div className="bg-ivory-50 rounded-3xl p-6 md:p-8 shadow-altar mx-auto max-w-sm">
              <Image
                src="/qr/donate-qr.png"
                alt="QR code linking to the SomaYagna London donate page"
                width={600}
                height={600}
                className="w-full h-auto"
                priority
              />
              <p className="text-center text-xs text-maroon-700/70 mt-4 tracking-widest uppercase">Scan to donate</p>
            </div>
          </div>
        </section>

        {/* ───── Other quotes ───── */}
        <section className="section bg-temple-gradient">
          <div className="container-tight max-w-3xl space-y-10">
            {QUOTES.slice(1).map((q) => (
              <figure key={q.text} className="text-center">
                <div className="text-saffron-600 inline-block divider-om mb-4" />
                <blockquote className="h-display text-xl md:text-2xl text-maroon-800 italic">“{q.text}”</blockquote>
                <figcaption className="text-sm text-maroon-700/70 mt-3">{q.attribution}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-ivory-50/85 border-b border-gold-200/40">
      <div className="container-tight flex items-center justify-between py-3">
        <Link href="/" className="flex items-center gap-3 group">
          <span className="text-maroon-700"><OmGlyph className="w-8 h-8" /></span>
          <span className="h-display text-xl md:text-2xl text-maroon-800 leading-none">
            SomaYagna <span className="text-saffron-600">London</span>
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-5 text-sm text-maroon-800/80">
          <Link href="/" className="hover:text-maroon-700">Home</Link>
          <Link href="/#timeline" className="hover:text-maroon-700">Programme</Link>
          <Link href="/#pricing" className="hover:text-maroon-700">Seva offerings</Link>
          <Link href="/donate" className="text-maroon-800 font-medium">Donate</Link>
        </nav>
        <Link href="/book" className="btn-primary !py-2.5 !px-5 !text-sm">Book a Yagna</Link>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="bg-maroon-900 text-ivory-100/70 border-t border-gold-300/20">
      <div className="container-tight py-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-gold-300"><OmGlyph className="w-5 h-5" /></span>
          © {new Date().getFullYear()} Unity in Divinity (UK Registered Charity 1215528)
        </div>
        <div className="flex gap-4">
          <Link href="/" className="hover:text-ivory-50">Home</Link>
          <Link href="/book" className="hover:text-ivory-50">Book</Link>
          <Link href="/qr" className="hover:text-ivory-50">QR codes</Link>
          <Link href="/admin" className="hover:text-ivory-50">Organiser</Link>
        </div>
      </div>
    </footer>
  );
}
