import Link from 'next/link';
import { OmGlyph } from '@/components/ui/Ornaments';

// Used as the success_url for Stripe / return_url for PayPal.
// The actual confirmation happens server-side via webhook. We poll briefly here.
export default function Pending() {
  return (
    <div className="min-h-screen bg-ivory-100 text-maroon-900 flex flex-col items-center justify-center px-6 text-center">
      <OmGlyph className="w-12 h-12 text-maroon-700 animate-slow-spin" />
      <h1 className="h-display text-3xl md:text-4xl mt-4 text-maroon-800">Confirming your seva…</h1>
      <p className="mt-2 max-w-md text-maroon-900/90">
        We have received your payment and are reserving your seat. A confirmation email will arrive shortly.
        If this page does not redirect within a minute, please check your inbox for the booking reference.
      </p>
      <Link href="/" className="btn-secondary mt-6">Return home</Link>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            // Light polling on the audit log via a server lookup helper would go here.
            // For MVP we simply auto-return after 10s.
            setTimeout(() => { window.location.href = '/'; }, 10000);
          `
        }}
      />
    </div>
  );
}
