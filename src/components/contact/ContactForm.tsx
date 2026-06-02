'use client';

import { useState } from 'react';
import { classNames } from '@/lib/utils';

type Subject = 'SLOT_BOOKING' | 'DONATION' | 'SEVA' | 'CHANGE_BOOKING' | 'OTHER';

const SUBJECT_OPTIONS: Array<{ value: Subject; label: string; hint: string; emoji: string }> = [
  { value: 'SLOT_BOOKING',   label: 'Slot booking',           hint: 'Help with a new booking or availability',  emoji: '🪔' },
  { value: 'CHANGE_BOOKING', label: 'Change an existing booking', hint: 'Different date, session or position',    emoji: '✏️' },
  { value: 'DONATION',       label: 'Donation',               hint: 'A question about a gift or Gift Aid',      emoji: '🌿' },
  { value: 'SEVA',           label: 'Seva',                   hint: 'Offerings such as ghee, prasad, samidha',  emoji: '🕉' },
  { value: 'OTHER',          label: 'Other',                  hint: 'Anything else',                            emoji: '✉️' }
];

export default function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [bookingReference, setBookingReference] = useState('');
  const [subject, setSubject] = useState<Subject>('SLOT_BOOKING');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const canSubmit =
    name.trim().length >= 2 &&
    /\S+@\S+\.\S+/.test(email) &&
    message.trim().length >= 10;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true); setErr(null);
    try {
      const r = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name, email,
          phone: phone || undefined,
          bookingReference: bookingReference || undefined,
          subject, message
        })
      });
      const data = await r.json();
      if (!r.ok) {
        setErr(data.message ?? data.error ?? `HTTP ${r.status}`);
        return;
      }
      setDone(true);
      setName(''); setEmail(''); setPhone(''); setBookingReference(''); setSubject('SLOT_BOOKING'); setMessage('');
    } catch (e: any) {
      setErr(e?.message ?? 'Could not send your message.');
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="card p-8 text-center">
        <div className="text-5xl">🙏</div>
        <h2 className="h-display text-3xl text-maroon-800 mt-3">Message received</h2>
        <p className="text-maroon-900/80 mt-3 max-w-md mx-auto">
          Thank you. We have your enquiry and will reply by email within 24 hours. If it's urgent, please call us directly.
        </p>
        <button
          type="button"
          onClick={() => setDone(false)}
          className="btn-secondary mt-6"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="card p-6 md:p-8 space-y-5" autoComplete="on">
      <div>
        <div className="text-xs tracking-widest uppercase text-maroon-700/70 mb-3">What is your enquiry about?</div>
        <div className="grid sm:grid-cols-2 gap-2">
          {SUBJECT_OPTIONS.map((opt) => {
            const active = subject === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSubject(opt.value)}
                className={classNames(
                  'text-left rounded-xl p-3 border-2 transition',
                  active
                    ? 'bg-saffron-100 border-saffron-500 shadow-soft-gold'
                    : 'bg-ivory-50 border-gold-200 hover:border-saffron-400'
                )}
              >
                <div className="flex items-baseline gap-2">
                  <span aria-hidden>{opt.emoji}</span>
                  <div className="h-display text-base text-maroon-800">{opt.label}</div>
                </div>
                <div className="text-xs text-maroon-900/65 mt-0.5">{opt.hint}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Your name" required>
          <input className="cinput" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
        </Field>
        <Field label="Email" required>
          <input type="email" className="cinput" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </Field>
        <Field label="Phone (optional)">
          <input type="tel" className="cinput" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
        </Field>
        <Field
          label="Booking reference"
          hint={subject === 'CHANGE_BOOKING' ? 'Required for booking changes — find it on your confirmation email (SY-…).' : 'Optional — if your enquiry is about an existing booking.'}
        >
          <input className="cinput uppercase" value={bookingReference} onChange={(e) => setBookingReference(e.target.value.toUpperCase())} placeholder="SY-…" />
        </Field>
      </div>

      <Field label="Your message" required hint="Min 10 characters.">
        <textarea
          rows={6}
          className="cinput"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={2000}
          required
          placeholder={
            subject === 'CHANGE_BOOKING'
              ? 'Tell us which date / session / kund / position you would like instead, and your reason.'
              : 'How can we help?'
          }
        />
      </Field>

      {err && (
        <div role="alert" className="rounded-lg border border-rose-300 bg-rose-100 text-rose-800 px-3 py-2 text-sm">
          {err}
        </div>
      )}

      <button
        type="submit"
        disabled={!canSubmit || busy}
        className="btn-primary w-full sm:w-auto"
      >
        {busy ? 'Sending…' : 'Send message'}
      </button>

      <p className="text-xs text-maroon-900/55">
        We only use your details to reply to this enquiry. By submitting, you agree to receive a reply by email.
      </p>

      <style jsx global>{`
        .cinput {
          width: 100%; padding: 11px 13px; border-radius: 10px;
          background: white; border: 1px solid rgba(185,135,36,0.4);
          color: #2C0A0A; font-size: 15px;
        }
        .cinput:focus { outline: none; border-color: #E97B11; box-shadow: 0 0 0 4px rgba(255,184,92,0.3); }
        textarea.cinput { font-family: inherit; resize: vertical; }
      `}</style>
    </form>
  );
}

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="text-maroon-800 font-medium">
        {label}{required && <span className="text-saffron-600 ml-0.5">*</span>}
      </span>
      <div className="mt-1.5">{children}</div>
      {hint && <div className="mt-1 text-[11px] text-maroon-700/70">{hint}</div>}
    </label>
  );
}
