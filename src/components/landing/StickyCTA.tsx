'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function StickyCTA() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 800);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <div
      aria-hidden={!show}
      className={`fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 z-30 transition-all duration-500
                  ${show ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0 pointer-events-none'}`}
    >
      <div className="flex gap-2 justify-end">
        <Link
          href="/donate"
          className="btn-secondary !px-4 !py-4 !bg-ivory-50 !border-maroon-700/40 hover:!bg-ivory-100 hidden sm:inline-flex"
        >
          Donate
        </Link>
        <Link
          href="/book"
          className="btn-primary !px-6 !py-4 shadow-altar w-full sm:w-auto justify-center"
        >
          <span className="inline-block w-2 h-2 rounded-full bg-ivory-50 animate-flicker mr-1" />
          Book a Seva / Slot
          <span aria-hidden>→</span>
        </Link>
      </div>
    </div>
  );
}
