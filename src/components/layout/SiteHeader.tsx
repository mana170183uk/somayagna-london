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
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Link
            href="/donate"
            aria-current={activeHref === '/donate' ? 'page' : undefined}
            className="inline-flex items-center justify-center gap-1 rounded-full bg-maroon-700 text-ivory-50 px-2.5 py-2 text-xs sm:px-4 sm:py-2.5 sm:text-sm font-medium hover:bg-maroon-800 transition shadow-altar whitespace-nowrap"
          >
            <span aria-hidden>♥</span>
            <span className="sm:hidden">Donate</span>
            <span className="hidden sm:inline">Donate or Seva</span>
          </Link>
          <Link
            href="/book"
            aria-current={activeHref === '/book' ? 'page' : undefined}
            className="btn-primary !px-3 !py-2 !text-xs sm:!px-5 sm:!py-2.5 sm:!text-sm whitespace-nowrap"
          >
            Book a Yagna
          </Link>
        </div>
      </div>
    </header>
  );
}
