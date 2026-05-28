import Link from 'next/link';
import { OmGlyph } from '@/components/ui/Ornaments';
import { EVENT } from '@/lib/constants';

export default function SiteFooter() {
  return (
    <footer className="bg-maroon-900 text-ivory-100/90 border-t border-gold-300/20">
      <div className="container-tight py-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-gold-300"><OmGlyph className="w-5 h-5" /></span>
          © {new Date().getFullYear()} {EVENT.organizer}
        </div>
        <div className="flex flex-wrap gap-4">
          <Link href="/" className="hover:text-ivory-50">Home</Link>
          <Link href="/donate" className="hover:text-ivory-50">Donate or Seva</Link>
          <Link href="/book" className="hover:text-ivory-50">Book a Yagna</Link>
          <Link href="/qr" className="hover:text-ivory-50">QR codes</Link>
          <Link href="/admin" className="hover:text-ivory-50">Organiser login</Link>
        </div>
      </div>
      <div className="border-t border-gold-300/15">
        <div className="container-tight py-3 text-center text-xs text-ivory-100/60">
          Designed and Developed by{' '}
          <a
            href="https://totalcloudai.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold-300 hover:text-ivory-50 transition"
          >
            TotalCloudAI Ltd
          </a>
        </div>
      </div>
    </footer>
  );
}
