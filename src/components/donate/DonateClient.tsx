'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { classNames } from '@/lib/utils';
import { GIFT_AID_DECLARATION } from '@/lib/donation-copy';

interface MaterialPalette {
  bg: string;
  border: string;
  ring: string;
  accent: string;
  activeBg: string;
  activeText: string;
}

interface Material {
  key: string;
  label: string;
  shortLabel: string;
  blurb: string;
  amountPence: number;
  emoji: string;
  palette: MaterialPalette;
}

type Provider = 'mock' | 'stripe' | 'paypal';

const gbp = (p: number) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: p % 100 ? 2 : 0 }).format(p / 100);

const QUICK_CUSTOM = [1100, 2100, 5100, 10100, 25100];

export default function DonateClient({ materials, enabledProviders }: { materials: Material[]; enabledProviders: string[] }) {
  const router = useRouter();
  const [mode, setMode] = useState<'MATERIAL' | 'GENERAL'>('MATERIAL');
  const [materialKey, setMaterialKey] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState<string>('51');
  const [donor, setDonor] = useState({
    donorName: '', donorEmail: '', donorPhone: '',
    donorAddress: '', donorPostcode: '',
    message: '', anonymous: false,
    giftAid: false
  });
  const [provider, setProvider] = useState<Provider>(() => (enabledProviders[0] as Provider) ?? 'mock');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const selectedMaterial = useMemo(() => materials.find((m) => m.key === materialKey) ?? null, [materials, materialKey]);

  const amountPence = mode === 'MATERIAL'
    ? selectedMaterial?.amountPence ?? 0
    : Math.round((parseFloat(customAmount) || 0) * 100);

  const giftAidPence = donor.giftAid ? Math.round(amountPence * 0.25) : 0;

  const canDonate =
    amountPence >= 100 &&
    donor.donorName.trim().length >= 2 &&
    /\S+@\S+\.\S+/.test(donor.donorEmail) &&
    donor.donorAddress.trim().length > 0 &&
    donor.donorPostcode.trim().length > 0;

  async function submit() {
    setBusy(true); setErr(null);
    try {
      const body = {
        type: mode,
        materialKey: mode === 'MATERIAL' ? materialKey : null,
        amountPence,
        donorName: donor.donorName,
        donorEmail: donor.donorEmail,
        donorPhone: donor.donorPhone || null,
        donorAddress: donor.donorAddress,
        donorPostcode: donor.donorPostcode,
        message: donor.message || null,
        anonymous: donor.anonymous,
        giftAid: donor.giftAid,
        provider
      };
      const endpoint = provider === 'mock' ? '/api/donations/mock' : '/api/donations/checkout';
      const r = await fetch(endpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
      const data = await r.json();
      if (!r.ok) throw new Error(data.message || data.error || 'Donation could not start.');
      if (provider === 'mock') router.push(`/donate/${data.donationId}`);
      else window.location.href = data.url;
    } catch (e: any) { setErr(e.message); }
    finally { setBusy(false); }
  }

  return (
    <div className="grid lg:grid-cols-12 gap-6">
      <div className="lg:col-span-8 space-y-6">
        {/* Toggle: material vs general */}
        <div className="flex gap-2">
          <ToggleButton active={mode === 'MATERIAL'} onClick={() => setMode('MATERIAL')}>Dedicate to a material</ToggleButton>
          <ToggleButton active={mode === 'GENERAL'} onClick={() => setMode('GENERAL')}>Any amount</ToggleButton>
        </div>

        {/* Material grid */}
        {mode === 'MATERIAL' && (
          <div className="grid sm:grid-cols-2 gap-3">
            {materials.map((m) => {
              const active = materialKey === m.key;
              return (
                <button key={m.key} type="button" onClick={() => setMaterialKey(m.key)}
                  aria-pressed={active}
                  className={classNames(
                    'text-left rounded-2xl p-5 border-2 transition shadow-sm hover:shadow-soft-gold hover:-translate-y-0.5',
                    active
                      ? `${m.palette.activeBg} ${m.palette.border} ${m.palette.activeText} shadow-soft-gold ring-2 ${m.palette.ring}`
                      : `${m.palette.bg} ${m.palette.border} ${m.palette.accent}`
                  )}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span aria-hidden className="text-2xl leading-none">{m.emoji}</span>
                      <div className="h-display text-lg leading-tight">{m.label}</div>
                    </div>
                    <div className="h-display text-2xl whitespace-nowrap">{gbp(m.amountPence)}</div>
                  </div>
                  <p className={classNames('text-xs mt-2 leading-relaxed', active ? 'text-ivory-50/90' : 'text-maroon-900/70')}>
                    {m.blurb}
                  </p>
                </button>
              );
            })}
          </div>
        )}

        {/* Custom amount */}
        {mode === 'GENERAL' && (
          <div id="custom" className="card p-6">
            <div className="text-xs tracking-widest uppercase text-maroon-700/70">Custom amount</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {QUICK_CUSTOM.map((p) => (
                <button key={p} type="button" onClick={() => setCustomAmount(String(p / 100))}
                  className={classNames(
                    'px-4 py-2 rounded-full text-sm border transition',
                    Math.round(parseFloat(customAmount) * 100) === p
                      ? 'bg-saffron-500 border-saffron-500 text-ivory-50'
                      : 'bg-ivory-50 border-gold-300/50 hover:border-saffron-400'
                  )}
                >{gbp(p)}</button>
              ))}
            </div>
            <label className="block mt-5">
              <span className="text-sm text-maroon-800 font-medium">Or enter an amount (£)</span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="h-display text-3xl text-maroon-700">£</span>
                <input
                  type="number" min="1" step="1" inputMode="decimal"
                  value={customAmount} onChange={(e) => setCustomAmount(e.target.value)}
                  className="h-display text-3xl text-maroon-900 w-32 border-b border-gold-400 bg-transparent focus:outline-none focus:border-saffron-500"
                  aria-label="Donation amount in pounds"
                />
              </div>
            </label>
          </div>
        )}

        {/* Donor details */}
        <div className="card p-6">
          <div className="text-xs tracking-widest uppercase text-maroon-700/70 mb-3">Your details</div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Full name" required>
              <input className="dinput" value={donor.donorName} onChange={(e) => setDonor({ ...donor, donorName: e.target.value })} required />
            </Field>
            <Field label="Email address" required>
              <input type="email" className="dinput" value={donor.donorEmail} onChange={(e) => setDonor({ ...donor, donorEmail: e.target.value })} required />
            </Field>
            <Field label="Phone (optional)">
              <input type="tel" className="dinput" value={donor.donorPhone} onChange={(e) => setDonor({ ...donor, donorPhone: e.target.value })} />
            </Field>
            <Field label="Display as anonymous?">
              <div className="mt-1.5">
                <label className="inline-flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={donor.anonymous} onChange={(e) => setDonor({ ...donor, anonymous: e.target.checked })} className="accent-saffron-500 w-4 h-4" />
                  <span className="text-maroon-900/75">Keep my name private in any list of donors</span>
                </label>
              </div>
            </Field>
            <Field label="Address" required full>
              <input className="dinput" value={donor.donorAddress} onChange={(e) => setDonor({ ...donor, donorAddress: e.target.value })} placeholder="House / flat, street, town" required />
            </Field>
            <Field label="Postcode" required>
              <input className="dinput uppercase" value={donor.donorPostcode} onChange={(e) => setDonor({ ...donor, donorPostcode: e.target.value.toUpperCase() })} required />
            </Field>
            <Field label="A short dedication or message (optional)" full>
              <textarea rows={3} maxLength={500} className="dinput" placeholder="In memory of… / for the well-being of…"
                value={donor.message} onChange={(e) => setDonor({ ...donor, message: e.target.value })} />
            </Field>
          </div>
        </div>

        {/* Gift Aid */}
        <div className="card p-6 bg-gradient-to-br from-gold-100 to-ivory-100 border-gold-300">
          <div className="flex items-start gap-3">
            <input type="checkbox" id="giftaid"
              checked={donor.giftAid}
              onChange={(e) => setDonor({ ...donor, giftAid: e.target.checked })}
              className="accent-saffron-600 w-5 h-5 mt-1" />
            <label htmlFor="giftaid" className="text-sm text-maroon-900">
              <span className="h-display text-xl text-maroon-800 block">Add 25% with Gift Aid</span>
              <span className="block mt-1 text-maroon-900/80">{GIFT_AID_DECLARATION}</span>
              <span className="block mt-2 text-xs text-maroon-700/80">
                HMRC will use the address and postcode above to verify your declaration.
              </span>
            </label>
          </div>
        </div>

        {/* Provider + submit */}
        <div className="card p-6">
          <div className="text-xs tracking-widest uppercase text-maroon-700/70 mb-3">Payment</div>
          <div className="grid sm:grid-cols-3 gap-2">
            {(['stripe','paypal','mock'] as Provider[]).filter((p) => enabledProviders.includes(p)).map((p) => (
              <button key={p} type="button" onClick={() => setProvider(p)}
                className={classNames(
                  'rounded-xl border p-4 text-left transition',
                  provider === p ? 'bg-saffron-500 text-ivory-50 border-saffron-500 shadow-soft-gold' : 'bg-ivory-50 border-gold-300/50 hover:border-saffron-400'
                )}
              >
                <div className="h-display text-lg">{p === 'stripe' ? 'Card (Stripe)' : p === 'paypal' ? 'PayPal' : 'Demo mode'}</div>
                <div className="text-xs opacity-80 mt-0.5">
                  {p === 'stripe' ? 'Secure GBP card payment' : p === 'paypal' ? 'PayPal balance or linked card' : 'Local-only test confirmation'}
                </div>
              </button>
            ))}
          </div>
          {err && <div role="alert" className="mt-4 rounded-lg border border-maroon-300 bg-maroon-50/60 text-maroon-800 px-4 py-3 text-sm">{err}</div>}
        </div>
      </div>

      {/* Summary */}
      <aside className="lg:col-span-4">
        <div className="card p-6 sticky top-24">
          <div className="text-xs tracking-widest uppercase text-maroon-700/70">Your gift</div>
          <div className="h-display text-2xl text-maroon-800 mt-1">Summary</div>
          <dl className="mt-4 space-y-2 text-sm">
            <Row k="For" v={mode === 'MATERIAL' ? (selectedMaterial?.shortLabel ?? '—') : 'General donation'} />
            <Row k="Amount" v={amountPence ? gbp(amountPence) : '—'} />
            {donor.giftAid && amountPence > 0 && <Row k="Gift Aid" v={`+ ${gbp(giftAidPence)} to charity`} accent />}
          </dl>
          <div className="mt-5 pt-5 border-t border-gold-200">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-maroon-700/80">Charity receives</span>
              <span className="h-display text-3xl text-saffron-700">{gbp(amountPence + giftAidPence)}</span>
            </div>
            <p className="text-[11px] text-maroon-900/55 mt-2">You pay {gbp(amountPence)}{donor.giftAid ? ` · HMRC adds ${gbp(giftAidPence)} via Gift Aid` : ''}.</p>
          </div>
          <button
            onClick={submit}
            disabled={!canDonate || busy}
            className="btn-primary w-full mt-6"
          >
            {busy
              ? 'Processing…'
              : provider === 'mock'
                ? `Confirm ${gbp(amountPence)} (demo)`
                : provider === 'stripe'
                  ? `Donate ${gbp(amountPence)} with card`
                  : `Donate ${gbp(amountPence)} with PayPal`}
          </button>
          <p className="text-[11px] text-maroon-900/55 mt-3 leading-relaxed text-center">
            Held in trust by Unity in Divinity. No card details are stored on this site.
          </p>
        </div>
      </aside>

      <style jsx global>{`
        .dinput {
          width: 100%; padding: 11px 13px; border-radius: 10px;
          background: white; border: 1px solid rgba(185,135,36,0.4);
          color: #2C0A0A; font-size: 15px;
        }
        .dinput:focus { outline: none; border-color: #E97B11; box-shadow: 0 0 0 4px rgba(255,184,92,0.3); }
        textarea.dinput { font-family: inherit; resize: vertical; }
      `}</style>
    </div>
  );
}

function ToggleButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      className={classNames(
        'px-4 py-2 rounded-full text-sm transition border',
        active ? 'bg-maroon-800 text-ivory-50 border-maroon-800 shadow-soft-gold/40' : 'bg-ivory-50 border-gold-300/50 text-maroon-800 hover:border-maroon-600'
      )}
    >{children}</button>
  );
}

function Field({ label, required, full, children }: { label: string; required?: boolean; full?: boolean; children: React.ReactNode }) {
  return (
    <label className={classNames('block text-sm', full && 'sm:col-span-2')}>
      <span className="text-maroon-800 font-medium">{label}{required && <span className="text-saffron-600 ml-0.5">*</span>}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

function Row({ k, v, accent }: { k: string; v: string; accent?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-maroon-700/70">{k}</dt>
      <dd className={classNames('text-right', accent ? 'text-saffron-700 font-medium' : 'text-maroon-900')}>{v}</dd>
    </div>
  );
}
