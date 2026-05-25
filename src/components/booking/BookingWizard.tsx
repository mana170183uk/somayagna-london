'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { classNames } from '@/lib/utils';
import KundMandala from './KundMandala';
import KundVenuePlan from './KundVenuePlan';

interface SessionLite { id: string; startTime: string; label: string; }
interface DayLite {
  id: string; date: string; title: string;
  yagnaType: 'WELCOME' | 'PURSHOTAM' | 'VISHNU_GOPAL';
  isActive: boolean; sessions: SessionLite[];
}
interface PositionView { id: string; label: 'A' | 'B' | 'C'; state: 'FREE' | 'HELD' | 'BOOKED'; bookedBy?: string; }
interface KundView { id: string; number: number; positions: PositionView[]; fullyFree: boolean; }
interface Availability {
  sessionId: string; date: string; startTime: string;
  remaining: number; capacity: number; kunds: KundView[];
}

type BookingType = 'SINGLE_POSITION' | 'FULL_KUND';
type Provider = 'mock' | 'stripe' | 'paypal';

const PRICE_SINGLE = 20100;
const PRICE_FULL = 50100;

function gbp(p: number) { return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(p / 100); }

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(iso));
}
function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number);
  const d = new Date(); d.setHours(h, m, 0, 0);
  return new Intl.DateTimeFormat('en-GB', { hour: 'numeric', minute: '2-digit' }).format(d);
}

const yagnaLabel: Record<DayLite['yagnaType'], string> = {
  WELCOME: 'Welcome',
  PURSHOTAM: 'Purshotam Yagna',
  VISHNU_GOPAL: 'Vishnu Gopal Yagna'
};

export default function BookingWizard({ initialDays, enabledProviders }: { initialDays: DayLite[]; enabledProviders: string[]; }) {
  const search = useSearchParams();
  const router = useRouter();

  // Steps: 1 date · 2 time · 3 type · 4 kund/position · 5 register · 6 pay
  const [step, setStep] = useState(1);

  const activeDays = useMemo(() => initialDays.filter((d) => d.isActive), [initialDays]);
  const [dayId, setDayId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [bookingType, setBookingType] = useState<BookingType>(() =>
    (search.get('type') as BookingType) || 'SINGLE_POSITION'
  );
  const [kundNumber, setKundNumber] = useState<number | null>(null);
  const [positions, setPositions] = useState<('A'|'B'|'C')[]>([]);
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [loadingAvail, setLoadingAvail] = useState(false);

  // Hold + checkout
  const [holdId, setHoldId] = useState<string | null>(null);
  const [holdExpires, setHoldExpires] = useState<number | null>(null);
  const [registration, setRegistration] = useState({
    primaryName: '', relation: 'INDIVIDUAL' as 'COUPLE'|'SIBLING'|'INDIVIDUAL',
    email: '', phone: '', whatsappNumber: '',
    secondParticipantName: '',
    addressLine1: '', town: '', postcode: '', giftAid: false
  });
  const [donationEnabled, setDonationEnabled] = useState(false);
  const [donationPence, setDonationPence] = useState(5100); // default suggestion: £51
  const [provider, setProvider] = useState<Provider>(() => (enabledProviders[0] as Provider) ?? 'mock');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [layoutMode, setLayoutMode] = useState<'venue' | 'mandala'>('venue');

  // Reload availability whenever session changes
  useEffect(() => {
    if (!sessionId) { setAvailability(null); return; }
    let alive = true;
    const fetchAvail = async () => {
      setLoadingAvail(true);
      try {
        const r = await fetch(`/api/sessions/${sessionId}`);
        if (!r.ok) throw new Error('Failed to load availability');
        const data = (await r.json()) as Availability;
        if (alive) setAvailability(data);
      } catch (e: any) { if (alive) setError(e.message); }
      finally { if (alive) setLoadingAvail(false); }
    };
    fetchAvail();
    const t = setInterval(fetchAvail, 15000); // gentle live refresh
    return () => { alive = false; clearInterval(t); };
  }, [sessionId]);

  // Reset kund/positions when type/session changes
  useEffect(() => { setKundNumber(null); setPositions([]); }, [bookingType, sessionId]);

  // Pre-select day from ?day= param (1-indexed against activeDays)
  useEffect(() => {
    const d = search.get('day');
    if (d && activeDays[Number(d) - 1]) setDayId(activeDays[Number(d) - 1].id);
  }, [search, activeDays]);

  const selectedDay = activeDays.find((d) => d.id === dayId) ?? null;
  const selectedSession = selectedDay?.sessions.find((s) => s.id === sessionId) ?? null;

  const basePence = bookingType === 'FULL_KUND' ? PRICE_FULL : PRICE_SINGLE * positions.length;
  const activeDonationPence = donationEnabled ? donationPence : 0;
  const totalPence = basePence + activeDonationPence;

  const canProceedFromType = bookingType === 'SINGLE_POSITION' || bookingType === 'FULL_KUND';
  const canProceedFromKund =
    kundNumber !== null && positions.length === (bookingType === 'FULL_KUND' ? 3 : 1);

  /* ─────────────  Create hold + go to payment  ────────────── */

  async function createHold() {
    if (!sessionId || kundNumber == null) return;
    setError(null);
    const r = await fetch('/api/holds', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        sessionId, bookingType, kundNumber,
        positions: bookingType === 'FULL_KUND' ? ['A','B','C'] : positions,
        email: registration.email || 'pending@somayagnalondon.invalid',
        primaryName: registration.primaryName || 'Pending'
      })
    });
    const data = await r.json();
    if (!r.ok) { setError(data.message || data.error || 'Could not hold this seat. Please try again.'); return false; }
    setHoldId(data.holdId);
    setHoldExpires(new Date(data.expiresAt).getTime());
    return true;
  }

  async function releaseHold() {
    if (!holdId) return;
    await fetch('/api/holds', {
      method: 'DELETE', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ holdId })
    });
    setHoldId(null); setHoldExpires(null);
  }

  async function submitPayment() {
    if (!holdId) return;
    setSubmitting(true); setError(null);
    try {
      const body = { ...registration, holdId, provider, donationPence: activeDonationPence };
      const endpoint = provider === 'stripe' ? '/api/checkout/stripe'
                     : provider === 'paypal' ? '/api/checkout/paypal'
                     : '/api/mock-pay';
      const r = await fetch(endpoint, {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body)
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.message || data.error || 'Payment could not start.');
      if (provider === 'mock') {
        router.push(`/confirmation/${data.bookingId}`);
      } else {
        // Redirect to external provider
        window.location.href = data.url;
      }
    } catch (e: any) { setError(e.message); }
    finally { setSubmitting(false); }
  }

  return (
    <div className="grid lg:grid-cols-12 gap-8">
      <div className="lg:col-span-8 space-y-6">
        <Steps step={step} onJump={(s) => s < step && setStep(s)} />

        {step === 1 && (
          <StepCard title="Select a date" subtitle="Active days are 15 – 21 June.">
            <DateGrid days={initialDays} value={dayId} onChange={(id) => { setDayId(id); setSessionId(null); setStep(2); }} />
          </StepCard>
        )}

        {step === 2 && selectedDay && (
          <StepCard title="Select a session" subtitle={`${formatDate(selectedDay.date)} · ${selectedDay.title}`}>
            <SessionGrid sessions={selectedDay.sessions} value={sessionId} onChange={(id) => { setSessionId(id); setStep(3); }} />
            <BackButton onClick={() => setStep(1)} />
          </StepCard>
        )}

        {step === 3 && (
          <StepCard title="Choose a booking type" subtitle="Both offerings receive the same blessings.">
            <BookingTypeGrid value={bookingType} onChange={setBookingType} />
            <div className="flex justify-between mt-6">
              <BackButton onClick={() => setStep(2)} />
              <button className="btn-primary" disabled={!canProceedFromType} onClick={() => setStep(4)}>Continue</button>
            </div>
          </StepCard>
        )}

        {step === 4 && (
          <StepCard
            title={bookingType === 'FULL_KUND' ? 'Select an available Kund' : 'Select Kund & position'}
            subtitle={availability ? `${availability.remaining} of ${availability.capacity} seats available` : 'Loading availability…'}
          >
            {loadingAvail && <div className="text-maroon-700/90 text-sm py-6">Loading availability…</div>}
            {availability && selectedDay && selectedSession && (
              <>
                <LayoutToggle value={layoutMode} onChange={setLayoutMode} />
                {layoutMode === 'venue' ? (
                  <KundVenuePlan
                    availability={availability}
                    bookingType={bookingType}
                    selectedKund={kundNumber}
                    selectedPositions={positions}
                    dateLabel={formatDate(selectedDay.date)}
                    timeLabel={formatTime(selectedSession.startTime)}
                    yagnaTitle={selectedDay.title}
                    onSelect={(k, ps) => { setKundNumber(k); setPositions(ps); }}
                  />
                ) : (
                  <KundMandala
                    availability={availability}
                    bookingType={bookingType}
                    selectedKund={kundNumber}
                    selectedPositions={positions}
                    dateLabel={formatDate(selectedDay.date)}
                    timeLabel={formatTime(selectedSession.startTime)}
                    yagnaTitle={selectedDay.title}
                    onSelect={(k, ps) => { setKundNumber(k); setPositions(ps); }}
                  />
                )}
              </>
            )}
            <div className="flex justify-between mt-6">
              <BackButton onClick={() => setStep(3)} />
              <button className="btn-primary" disabled={!canProceedFromKund} onClick={() => setStep(5)}>Continue</button>
            </div>
          </StepCard>
        )}

        {step === 5 && (
          <StepCard title="Your details" subtitle="We will send your confirmation here.">
            <RegistrationForm value={registration} onChange={setRegistration} />
            <DonationSection
              enabled={donationEnabled}
              pence={donationPence}
              onToggle={setDonationEnabled}
              onChange={setDonationPence}
              registration={registration}
              setRegistration={setRegistration}
            />
            <div className="flex justify-between mt-6">
              <BackButton onClick={() => setStep(4)} />
              <button
                className="btn-primary"
                disabled={
                  !registration.primaryName ||
                  !registration.phone ||
                  !registration.whatsappNumber ||
                  !registration.addressLine1 ||
                  !registration.town ||
                  !registration.postcode
                }
                onClick={async () => { const ok = await createHold(); if (ok) setStep(6); }}
              >
                Continue to payment
              </button>
            </div>
            {error && <ErrorBox>{error}</ErrorBox>}
          </StepCard>
        )}

        {step === 6 && holdId && (
          <StepCard title="Payment" subtitle={`Total ${gbp(totalPence)} · ${bookingType === 'FULL_KUND' ? 'Full Kund' : `${positions.length} position(s)`}`}>
            <HoldCountdown expires={holdExpires} onExpire={() => { releaseHold(); setStep(4); setError('Your hold expired. Please choose again.'); }} />
            <ProviderPicker enabled={enabledProviders} value={provider} onChange={setProvider} />
            <div className="flex justify-between mt-6">
              <button className="btn-ghost" disabled={submitting} onClick={async () => { await releaseHold(); setStep(5); }}>← Back</button>
              <button className="btn-primary" disabled={submitting} onClick={submitPayment}>
                {submitting ? 'Processing…' : provider === 'mock' ? `Pay ${gbp(totalPence)} (demo)` : `Pay with ${provider === 'stripe' ? 'Card (Stripe)' : 'PayPal'}`}
              </button>
            </div>
            {error && <ErrorBox>{error}</ErrorBox>}
          </StepCard>
        )}
      </div>

      <aside className="lg:col-span-4">
        <SummaryCard
          day={selectedDay}
          session={selectedSession}
          bookingType={bookingType}
          kundNumber={kundNumber}
          positions={positions}
          basePence={basePence}
          donationPence={activeDonationPence}
          totalPence={totalPence}
        />
      </aside>
    </div>
  );
}

/* ─────────────────────────  STEP UI  ───────────────────────── */

function Steps({ step, onJump }: { step: number; onJump: (s: number) => void }) {
  const labels = ['Date', 'Time', 'Type', 'Kund & seat', 'Your details', 'Payment'];
  return (
    <ol className="flex flex-wrap gap-2 text-xs">
      {labels.map((l, i) => {
        const n = i + 1;
        const isActive = step === n;
        const isDone = step > n;
        return (
          <li key={l}>
            <button
              type="button"
              onClick={() => isDone && onJump(n)}
              className={classNames(
                'px-3 py-1.5 rounded-full border transition',
                isActive && 'bg-saffron-500 border-saffron-500 text-ivory-50 shadow-soft-gold',
                isDone && 'bg-ivory-50 border-saffron-400 text-saffron-700 hover:bg-saffron-50',
                !isActive && !isDone && 'bg-ivory-50 border-gold-300/40 text-maroon-900/50'
              )}
            >
              <span className="mr-1 tabular-nums">{n}</span>{l}
            </button>
          </li>
        );
      })}
    </ol>
  );
}

function StepCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="card p-6 md:p-8">
      <h2 className="h-display text-2xl text-maroon-800">{title}</h2>
      {subtitle && <p className="text-sm text-maroon-900/85 mt-1">{subtitle}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

function BackButton({ onClick }: { onClick: () => void }) { return <button onClick={onClick} className="btn-ghost">← Back</button>; }

function LayoutToggle({ value, onChange }: { value: 'venue' | 'mandala'; onChange: (v: 'venue' | 'mandala') => void }) {
  return (
    <div className="flex justify-center mb-2">
      <div className="inline-flex rounded-full border border-gold-300/60 bg-ivory-100 p-1 text-xs">
        <button
          type="button"
          onClick={() => onChange('venue')}
          className={classNames(
            'px-4 py-1.5 rounded-full transition',
            value === 'venue' ? 'bg-saffron-500 text-ivory-50 shadow-soft-gold' : 'text-maroon-800 hover:bg-ivory-50'
          )}
        >
          Venue plan
        </button>
        <button
          type="button"
          onClick={() => onChange('mandala')}
          className={classNames(
            'px-4 py-1.5 rounded-full transition',
            value === 'mandala' ? 'bg-saffron-500 text-ivory-50 shadow-soft-gold' : 'text-maroon-800 hover:bg-ivory-50'
          )}
        >
          Mandala
        </button>
      </div>
    </div>
  );
}
function ErrorBox({ children }: { children: React.ReactNode }) {
  return <div role="alert" className="mt-4 rounded-lg border border-maroon-300 bg-maroon-50/60 text-maroon-800 px-4 py-3 text-sm">{children}</div>;
}

/* ─────────────────────────  STEP COMPONENTS  ───────────────────────── */

function DateGrid({ days, value, onChange }: { days: DayLite[]; value: string | null; onChange: (id: string) => void }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {days.map((d) => {
        const isWelcome = d.yagnaType === 'WELCOME';
        const isPurshotam = d.yagnaType === 'PURSHOTAM';
        return (
          <button
            key={d.id}
            type="button"
            disabled={!d.isActive}
            onClick={() => onChange(d.id)}
            className={classNames(
              'rounded-2xl p-4 text-left border transition relative overflow-hidden',
              !d.isActive && 'opacity-60 cursor-not-allowed bg-ivory-50 border-gold-200',
              d.isActive && value === d.id && 'bg-saffron-500 text-ivory-50 border-saffron-500 shadow-soft-gold',
              d.isActive && value !== d.id && 'bg-ivory-50 border-gold-300/50 hover:border-saffron-400 hover:shadow-soft-gold/50'
            )}
          >
            <div className="text-xs uppercase tracking-widest opacity-80">{formatDate(d.date)}</div>
            <div className="h-display text-lg mt-1">{yagnaLabel[d.yagnaType]}</div>
            {isWelcome && <span className="absolute top-2 right-2 text-[10px] tracking-widest uppercase px-2 py-0.5 rounded-full bg-gold-200 text-maroon-800">Info only</span>}
            {isPurshotam && value !== d.id && <span className="absolute top-2 right-2 text-[10px] tracking-widest uppercase px-2 py-0.5 rounded-full bg-saffron-100 text-saffron-800">Day 1</span>}
          </button>
        );
      })}
    </div>
  );
}

function SessionGrid({ sessions, value, onChange }: { sessions: SessionLite[]; value: string | null; onChange: (id: string) => void }) {
  return (
    <div className="grid sm:grid-cols-3 gap-3">
      {sessions.map((s) => (
        <button
          key={s.id} type="button" onClick={() => onChange(s.id)}
          className={classNames(
            'rounded-2xl p-5 border transition text-left',
            value === s.id
              ? 'bg-saffron-500 text-ivory-50 border-saffron-500 shadow-soft-gold'
              : 'bg-ivory-50 border-gold-300/50 hover:border-saffron-400'
          )}
        >
          <div className="text-xs uppercase tracking-widest opacity-80">{s.label}</div>
          <div className="h-display text-3xl mt-1">{formatTime(s.startTime)}</div>
          <div className="text-xs mt-1 opacity-70">11 Kunds · 33 seats</div>
        </button>
      ))}
    </div>
  );
}

function BookingTypeGrid({ value, onChange }: { value: BookingType; onChange: (t: BookingType) => void }) {
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      <button
        type="button"
        onClick={() => onChange('SINGLE_POSITION')}
        className={classNames(
          'rounded-2xl p-5 border text-left transition',
          value === 'SINGLE_POSITION' ? 'bg-saffron-500 text-ivory-50 border-saffron-500 shadow-soft-gold' : 'bg-ivory-50 border-gold-300/50 hover:border-saffron-400'
        )}
      >
        <div className="text-xs uppercase tracking-widest opacity-80">For couples or siblings</div>
        <div className="h-display text-2xl mt-1">Single Position</div>
        <div className="h-display text-3xl mt-2">£201</div>
        <div className="text-xs mt-2 opacity-80">One seat at any available Kund</div>
      </button>
      <button
        type="button"
        onClick={() => onChange('FULL_KUND')}
        className={classNames(
          'rounded-2xl p-5 border text-left transition',
          value === 'FULL_KUND' ? 'bg-maroon-800 text-ivory-50 border-maroon-800 shadow-altar' : 'bg-ivory-50 border-gold-300/50 hover:border-maroon-600'
        )}
      >
        <div className="text-xs uppercase tracking-widest opacity-80">For a family · discounted package</div>
        <div className="h-display text-2xl mt-1">Full Kund</div>
        <div className="h-display text-3xl mt-2">£501</div>
        <div className="text-xs mt-2 opacity-80">All three positions A, B & C together</div>
      </button>
    </div>
  );
}

function RegistrationForm({ value, onChange }: { value: any; onChange: (v: any) => void }) {
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      <Field label="Primary name" required>
        <input
          className="input" value={value.primaryName} required minLength={2}
          onChange={(e) => onChange({ ...value, primaryName: e.target.value })}
        />
      </Field>
      <Field label="Relation">
        <select className="input" value={value.relation} onChange={(e) => onChange({ ...value, relation: e.target.value })}>
          <option value="INDIVIDUAL">Individual</option>
          <option value="COUPLE">Couple</option>
          <option value="SIBLING">Sibling</option>
        </select>
      </Field>
      <Field label="WhatsApp number" required>
        <input
          type="tel" className="input" value={value.whatsappNumber} required
          placeholder="+44 7…"
          onChange={(e) => onChange({ ...value, whatsappNumber: e.target.value })}
        />
        <p className="text-[11px] text-maroon-700 mt-1">Booking confirmation will be sent here.</p>
      </Field>
      <Field label="Phone number" required>
        <input type="tel" className="input" value={value.phone} required onChange={(e) => onChange({ ...value, phone: e.target.value })} />
      </Field>
      <Field label="Email address (optional)" full>
        <input
          type="email" className="input" value={value.email}
          placeholder="For receipt — leave blank to skip"
          onChange={(e) => onChange({ ...value, email: e.target.value })}
        />
      </Field>
      <Field label="Name of second participant (optional)" full>
        <input className="input" value={value.secondParticipantName} onChange={(e) => onChange({ ...value, secondParticipantName: e.target.value })} />
      </Field>
      <Field label="Address line 1" required full>
        <input
          className="input" value={value.addressLine1} required
          placeholder="e.g. 12 Lotus Lane"
          onChange={(e) => onChange({ ...value, addressLine1: e.target.value })}
        />
      </Field>
      <Field label="Town / City" required>
        <input
          className="input" value={value.town} required
          placeholder="London"
          onChange={(e) => onChange({ ...value, town: e.target.value })}
        />
      </Field>
      <Field label="Postcode" required>
        <input
          className="input uppercase" value={value.postcode} required
          placeholder="SW1A 1AA"
          onChange={(e) => onChange({ ...value, postcode: e.target.value.toUpperCase() })}
        />
      </Field>
      <style jsx>{`
        .input {
          width: 100%; padding: 12px 14px; border-radius: 10px;
          background: white; border: 1px solid rgba(185,135,36,0.35);
          color: #2C0A0A; font-size: 16px; transition: border-color .15s;
        }
        .input:focus { outline: none; border-color: #E97B11; box-shadow: 0 0 0 4px rgba(255,184,92,0.35); }
      `}</style>
    </div>
  );
}

function DonationSection({
  enabled, pence, onToggle, onChange, registration, setRegistration
}: {
  enabled: boolean; pence: number;
  onToggle: (v: boolean) => void;
  onChange: (p: number) => void;
  registration: any;
  setRegistration: (r: any) => void;
}) {
  const presets = [1100, 2100, 5100, 10100, 50100]; // £11, £21, £51, £101, £501

  return (
    <div className="mt-6 rounded-2xl border border-saffron-300/60 bg-gradient-to-br from-saffron-50 via-ivory-50 to-ivory-100 p-5">
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onToggle(e.target.checked)}
          className="mt-1 w-5 h-5 accent-saffron-600 cursor-pointer"
        />
        <div className="flex-1">
          <div className="h-display text-lg text-maroon-800">Add a charity donation</div>
          <div className="text-xs text-maroon-900/90 mt-0.5 leading-relaxed">
            100% of donations go to <strong>Unity in Divinity (UK Registered Charity)</strong>, the
            organising body of this programme. Your donation is collected together with your seva
            payment and will appear as a separate line on your receipt.
          </div>
        </div>
      </label>

      {enabled && (
        <div className="mt-4">
          <div className="text-[10px] uppercase tracking-widest text-maroon-700 mb-2">Choose an amount</div>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {presets.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => onChange(p)}
                className={classNames(
                  'rounded-lg border py-2 text-sm font-medium transition',
                  pence === p
                    ? 'bg-saffron-500 text-ivory-50 border-saffron-700 shadow-soft-gold'
                    : 'bg-ivory-50 border-gold-300/60 text-maroon-800 hover:border-saffron-400'
                )}
              >
                £{(p / 100).toFixed(0)}
              </button>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <label className="text-sm text-maroon-800 whitespace-nowrap">Or custom (£):</label>
            <input
              type="number"
              min={1}
              max={10000}
              step={1}
              value={pence > 0 ? Math.round(pence / 100) : ''}
              onChange={(e) => {
                const v = parseInt(e.target.value || '0', 10);
                onChange(Math.max(0, v) * 100);
              }}
              className="flex-1 rounded-lg bg-white border border-gold-300/40 px-3 py-2 text-maroon-900 focus:outline-none focus:border-saffron-500 focus:ring-2 focus:ring-saffron-200/60"
              placeholder="Custom amount"
            />
          </div>

          {/* Gift Aid — UK only, increases donation by 25% from HMRC */}
          <div className="mt-5 pt-4 border-t border-saffron-300/40">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={!!registration.giftAid}
                onChange={(e) => setRegistration({ ...registration, giftAid: e.target.checked })}
                className="mt-1 w-5 h-5 accent-saffron-600 cursor-pointer"
              />
              <div className="flex-1">
                <div className="font-medium text-maroon-800">Yes, claim Gift Aid (+25% from HMRC)</div>
                <div className="text-xs text-maroon-900/90 mt-0.5 leading-relaxed">
                  I confirm that I am a UK taxpayer and I understand that if I pay less Income Tax
                  and/or Capital Gains Tax than the amount of Gift Aid claimed on all my donations
                  in that tax year, it is my responsibility to pay any difference. The charity will
                  use the address you provided above to submit the Gift Aid claim to HMRC.
                </div>
              </div>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, required, full, children }: { label: string; required?: boolean; full?: boolean; children: React.ReactNode }) {
  return (
    <label className={classNames('block text-sm text-maroon-900', full && 'sm:col-span-2')}>
      <span className="font-medium text-maroon-800">{label}{required && <span aria-hidden className="text-saffron-600 ml-0.5">*</span>}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

function ProviderPicker({ enabled, value, onChange }: { enabled: string[]; value: Provider; onChange: (p: Provider) => void }) {
  const providers: { id: Provider; label: string; sub: string }[] = [
    { id: 'stripe', label: 'Card (Stripe)', sub: 'Secure GBP card payment' },
    { id: 'paypal', label: 'PayPal', sub: 'PayPal balance or linked card' },
    { id: 'mock', label: 'Demo mode', sub: 'Local-only test confirmation' }
  ];
  const visible = providers.filter((p) => enabled.includes(p.id));
  return (
    <div className="grid sm:grid-cols-3 gap-2 mt-2">
      {visible.map((p) => (
        <button
          key={p.id} type="button" onClick={() => onChange(p.id)}
          className={classNames(
            'rounded-xl border p-4 text-left transition',
            value === p.id ? 'bg-saffron-500 text-ivory-50 border-saffron-500 shadow-soft-gold' : 'bg-ivory-50 border-gold-300/50 hover:border-saffron-400'
          )}
        >
          <div className="h-display text-lg">{p.label}</div>
          <div className="text-xs opacity-80 mt-0.5">{p.sub}</div>
        </button>
      ))}
    </div>
  );
}

function HoldCountdown({ expires, onExpire }: { expires: number | null; onExpire: () => void }) {
  const [now, setNow] = useState(Date.now());
  const calledRef = useRef(false);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const remainingMs = Math.max(0, (expires ?? 0) - now);
  useEffect(() => {
    if (expires && remainingMs <= 0 && !calledRef.current) {
      calledRef.current = true;
      onExpire();
    }
  }, [remainingMs, expires, onExpire]);
  const m = Math.floor(remainingMs / 60000);
  const s = Math.floor((remainingMs / 1000) % 60);
  return (
    <div className="rounded-lg bg-saffron-100 border border-saffron-300 text-saffron-800 px-4 py-3 text-sm flex justify-between items-center">
      <span>Your seat is held while you complete payment.</span>
      <span className="h-display text-2xl tabular-nums">{m}:{s.toString().padStart(2, '0')}</span>
    </div>
  );
}

function SummaryCard({ day, session, bookingType, kundNumber, positions, basePence, donationPence, totalPence }: {
  day: DayLite | null; session: SessionLite | null; bookingType: BookingType;
  kundNumber: number | null; positions: ('A'|'B'|'C')[];
  basePence: number; donationPence: number; totalPence: number;
}) {
  return (
    <div className="card p-6 sticky top-24">
      <div className="text-xs tracking-widest uppercase text-maroon-700/90">Your seva</div>
      <div className="h-display text-2xl text-maroon-800 mt-1">Booking summary</div>
      <dl className="mt-4 space-y-2 text-sm">
        <Row k="Date" v={day ? formatDate(day.date) : '—'} />
        <Row k="Yagna" v={day ? day.title : '—'} />
        <Row k="Session" v={session ? `${session.label} · ${formatTime(session.startTime)}` : '—'} />
        <Row k="Type" v={bookingType === 'FULL_KUND' ? 'Full Kund' : 'Single Position'} />
        <Row k="Kund" v={kundNumber ? `Kund ${kundNumber}` : '—'} />
        <Row k="Positions" v={positions.length ? positions.join(', ') : '—'} />
      </dl>
      <div className="mt-5 pt-5 border-t border-gold-200 space-y-1.5 text-sm">
        <Row k="Seva" v={gbp(basePence)} />
        {donationPence > 0 && <Row k="Donation (charity)" v={gbp(donationPence)} />}
      </div>
      <div className="mt-3 pt-3 border-t border-gold-200 flex items-center justify-between">
        <span className="text-sm text-maroon-700">Total</span>
        <span className="h-display text-3xl text-saffron-700">{gbp(totalPence)}</span>
      </div>
      <p className="text-xs text-maroon-900/85 mt-3 leading-relaxed">
        Payment is processed in £ GBP. Your seat will be confirmed by email immediately after successful payment.
      </p>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-maroon-700/90">{k}</dt>
      <dd className="text-maroon-900 text-right">{v}</dd>
    </div>
  );
}
