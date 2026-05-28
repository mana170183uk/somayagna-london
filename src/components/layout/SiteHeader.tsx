import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';

interface SiteHeaderProps {
  activeHref?: '/' | '/donate' | '/book';
}

export default function SiteHeader({ activeHref }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-ivory-50/80 border-b border-gold-200/40">
      <div className="container-tight flex items-center justify-between py-3">
        <Link href="/" className="group" aria-label="SomaYagna London — home">
          <Logo size="md" />
        </Link>
        <nav className="hidden lg:flex items-center gap-5 text-sm text-maroon-800 whitespace-nowrap">
          <a href="/#timeline" className="hover:text-maroon-700">Programme</a>
          <a href="/#booking" className="hover:text-maroon-700">How to book</a>
          <a href="/#pricing" className="hover:text-maroon-700">Seva offerings</a>
          <a href="/#schedule" className="hover:text-maroon-700">Schedule</a>
          <a href="/#faq" className="hover:text-maroon-700">FAQ</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/donate"
            aria-current={activeHref === '/donate' ? 'page' : undefined}
            className="hidden sm:inline-flex items-center justify-center gap-1.5 rounded-full bg-maroon-700 text-ivory-50 px-4 py-2.5 text-sm font-medium hover:bg-maroon-800 transition shadow-altar whitespace-nowrap"
          >
            <span aria-hidden>♥</span> Donate or Seva
          </Link>
          <Link
            href="/book"
            aria-current={activeHref === '/book' ? 'page' : undefined}
            className="btn-primary !py-2.5 !px-5 !text-sm whitespace-nowrap"
          >
            Book a Yagna
          </Link>
        </div>
      </div>
    </header>
  );
}
