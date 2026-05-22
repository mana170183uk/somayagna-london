import './globals.css';
import type { Metadata } from 'next';
import { Cormorant_Garamond, Inter } from 'next/font/google';
import { EVENT } from '@/lib/constants';

const display = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-display',
  display: 'swap'
});
const sans = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });

export const metadata: Metadata = {
  title: `${EVENT.name} — Sacred Yagna Programme, ${EVENT.startDate}–${EVENT.endDate} ${EVENT.year}`,
  description: 'An eight-day sacred Vedic Yagna in London — Purshotam Yagna and Vishnu Gopal Maha Yagna. Reserve your seat (Seva) at a Kund.',
  openGraph: {
    title: `${EVENT.name} — ${EVENT.startDate}–${EVENT.endDate} ${EVENT.year}`,
    description: 'Eight days of sacred Vedic ritual in London. Reserve a Kund position.',
    type: 'website'
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body className="font-sans bg-ivory-50 text-maroon-900 antialiased">
        {children}
      </body>
    </html>
  );
}
