import Link from 'next/link';
import Image from 'next/image';
import { OmGlyph, Mandala } from '@/components/ui/Ornaments';

export const metadata = { title: 'Scan QR · SomaYagna London' };

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://somayagna.unityindivinity.com';

export default function QRPage() {
  return (
    <div className="min-h-screen bg-ivory-50">
      <header className="border-b border-gold-200 bg-ivory-50">
        <div className="container-tight flex items-center justify-between py-3">
          <Link href="/" className="flex items-center gap-2 text-maroon-800">
            <OmGlyph className="w-6 h-6 text-maroon-700" />
            <span className="h-display text-xl">SomaYagna London</span>
          </Link>
          <Link href="/" className="btn-ghost text-sm">← Home</Link>
        </div>
      </header>

      <main className="container-tight py-14 md:py-20">
        <div className="max-w-2xl mx-auto text-center">
          <p className="eyebrow mb-3">Share the website</p>
          <h1 className="h-display text-4xl md:text-5xl text-maroon-800">Scan to open SomaYagna London</h1>
          <p className="mt-3 text-maroon-900/70">
            Use this QR code on the unityindivinity.com site, on posters, programme cards, or any printed material. Anyone scanning it with their phone camera opens the SomaYagna London homepage directly.
          </p>
        </div>

        <div className="mt-10 max-w-md mx-auto bg-ivory-100 rounded-3xl p-6 md:p-8 shadow-altar relative overflow-hidden">
          <Mandala className="absolute -top-12 -right-12 w-40 text-gold-400 opacity-30 animate-slow-spin" />
          <Image
            src="/qr/site-qr.png"
            alt="QR code linking to the SomaYagna London homepage"
            width={1024}
            height={1024}
            className="w-full h-auto rounded-xl"
            priority
          />
          <p className="text-center text-xs text-maroon-700/70 mt-4 tracking-widest uppercase">{SITE_URL}</p>
        </div>

        <div className="mt-8 flex flex-wrap gap-3 justify-center">
          <a href="/qr/site-qr.png" download className="btn-primary">Download PNG (1024×1024)</a>
          <a href="/qr/site-qr.svg" download className="btn-secondary">Download SVG (vector)</a>
        </div>

        <div className="mt-16 grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          <div className="card p-6">
            <div className="text-xs tracking-widest uppercase text-maroon-700/70">Embed on another website</div>
            <h3 className="h-display text-xl text-maroon-800 mt-1">HTML snippet</h3>
            <pre className="mt-3 bg-maroon-900 text-ivory-100 rounded-lg p-3 text-xs overflow-x-auto"><code>{`<a href="${SITE_URL}/" aria-label="Open SomaYagna London">
  <img src="${SITE_URL}/qr/site-qr.png"
       alt="Scan to open SomaYagna London"
       width="240" height="240" />
</a>`}</code></pre>
          </div>

          <div className="card p-6">
            <div className="text-xs tracking-widest uppercase text-maroon-700/70">Also available</div>
            <h3 className="h-display text-xl text-maroon-800 mt-1">Donate page QR</h3>
            <p className="text-sm text-maroon-900/70 mt-1">A separate QR code resolves to <code className="text-saffron-700">/donate</code> — perfect for in-venue donation appeals.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/donate" className="btn-ghost text-sm">View donate page →</Link>
              <a href="/qr/donate-qr.png" download className="btn-ghost text-sm">PNG ↓</a>
              <a href="/qr/donate-qr.svg" download className="btn-ghost text-sm">SVG ↓</a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
