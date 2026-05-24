'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { classNames } from '@/lib/utils';

interface BookingLite {
  id: string; reference: string; primaryName: string; email: string; phone: string;
  bookingType: 'SINGLE_POSITION' | 'FULL_KUND'; status: string; amountPence: number;
  paymentStatus: string | null; paymentProvider: string | null;
}
interface PositionLite { id: string; label: 'A' | 'B' | 'C'; booking: BookingLite | null; }
interface KundLite { id: string; number: number; positions: PositionLite[]; }

const gbp = (p: number) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(p / 100);

export default function AdminSessionPanel({ sessionId, kunds }: { sessionId: string; kunds: KundLite[] }) {
  const router = useRouter();
  const [adding, setAdding] = useState<{ kund: number; positions: ('A'|'B'|'C')[] } | null>(null);
  const [editing, setEditing] = useState<BookingLite | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function cancel(bookingId: string) {
    if (!confirm('Cancel this booking and release the position(s)?')) return;
    setBusy(true); setErr(null);
    const r = await fetch(`/api/admin/bookings/${bookingId}`, { method: 'DELETE', body: JSON.stringify({ reason: 'Admin cancellation' }), headers: { 'content-type': 'application/json' } });
    setBusy(false);
    if (!r.ok) { setErr('Could not cancel.'); return; }
    router.refresh();
  }

  return (
    <div className="mt-6 space-y-6">
      {err && <div role="alert" className="rounded-lg border border-maroon-300 bg-maroon-50 text-maroon-800 px-4 py-3 text-sm">{err}</div>}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {kunds.map((k) => {
          const allFree = k.positions.every((p) => !p.booking);
          return (
            <div key={k.id} className="card p-4">
              <div className="flex justify-between items-center">
                <div className="text-xs tracking-widest uppercase text-maroon-700">Kund</div>
                <div className="h-display text-2xl text-maroon-800">{k.number}</div>
              </div>
              <ul className="mt-3 space-y-2">
                {k.positions.map((p) => (
                  <li key={p.id} className={classNames(
                    'rounded-md border px-3 py-2 text-sm',
                    p.booking ? 'border-maroon-200 bg-ivory-100' : 'border-gold-300/50'
                  )}>
                    <div className="flex justify-between items-baseline">
                      <span className="h-display text-base text-maroon-800">Position {p.label}</span>
                      {p.booking ? (
                        <span className="text-[10px] uppercase tracking-widest text-saffron-700">{p.booking.bookingType === 'FULL_KUND' ? 'Full Kund' : 'Single'}</span>
                      ) : <span className="text-xs text-maroon-700/85">Free</span>}
                    </div>
                    {p.booking ? (
                      <div className="mt-1">
                        <div className="text-maroon-900">{p.booking.primaryName}</div>
                        <div className="text-xs text-maroon-700/90">{p.booking.email}</div>
                        <div className="text-xs text-maroon-700/90">{p.booking.reference} · {gbp(p.booking.amountPence)} · {p.booking.paymentStatus ?? '—'}</div>
                        <div className="mt-2 flex gap-2">
                          <button className="btn-ghost !py-1 !px-2 !text-xs" onClick={() => setEditing(p.booking!)}>Edit</button>
                          <button disabled={busy} className="btn-ghost !py-1 !px-2 !text-xs text-maroon-700" onClick={() => cancel(p.booking!.id)}>Cancel</button>
                        </div>
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex gap-2">
                {k.positions.filter((p) => !p.booking).map((p) => (
                  <button key={p.id} className="btn-ghost !py-1 !px-3 !text-xs"
                          onClick={() => setAdding({ kund: k.number, positions: [p.label] })}>
                    + {p.label}
                  </button>
                ))}
                {allFree && (
                  <button className="btn-ghost !py-1 !px-3 !text-xs text-saffron-700"
                          onClick={() => setAdding({ kund: k.number, positions: ['A','B','C'] })}>
                    + Full Kund
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {adding && (
        <ManualAddModal
          sessionId={sessionId}
          kundNumber={adding.kund}
          positions={adding.positions}
          onClose={() => setAdding(null)}
          onSaved={() => { setAdding(null); router.refresh(); }}
        />
      )}

      {editing && (
        <EditModal booking={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); router.refresh(); }} />
      )}
    </div>
  );
}

function ManualAddModal({ sessionId, kundNumber, positions, onClose, onSaved }: {
  sessionId: string; kundNumber: number; positions: ('A'|'B'|'C')[]; onClose: () => void; onSaved: () => void;
}) {
  const [form, setForm] = useState({ primaryName: '', relation: 'INDIVIDUAL', email: '', phone: '', secondParticipantName: '' });
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const bookingType = positions.length === 3 ? 'FULL_KUND' : 'SINGLE_POSITION';

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    const r = await fetch('/api/admin/bookings', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ sessionId, bookingType, kundNumber, positions, ...form, secondParticipantName: form.secondParticipantName || null })
    });
    const data = await r.json();
    setBusy(false);
    if (!r.ok) { setErr(data.message || 'Could not save'); return; }
    onSaved();
  }

  return (
    <Modal onClose={onClose} title={`Manual booking — Kund ${kundNumber} · ${positions.join(', ')}`}>
      <form onSubmit={save} className="grid sm:grid-cols-2 gap-3">
        <FormField label="Primary name" required><input className="ainput" required value={form.primaryName} onChange={(e) => setForm({ ...form, primaryName: e.target.value })} /></FormField>
        <FormField label="Relation"><select className="ainput" value={form.relation} onChange={(e) => setForm({ ...form, relation: e.target.value })}>
          <option value="INDIVIDUAL">Individual</option><option value="COUPLE">Couple</option><option value="SIBLING">Sibling</option></select></FormField>
        <FormField label="Email" required><input type="email" className="ainput" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></FormField>
        <FormField label="Phone" required><input className="ainput" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></FormField>
        <FormField label="Second participant (optional)" full><input className="ainput" value={form.secondParticipantName} onChange={(e) => setForm({ ...form, secondParticipantName: e.target.value })} /></FormField>
        {err && <div className="sm:col-span-2 text-sm text-maroon-700">{err}</div>}
        <div className="sm:col-span-2 flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button disabled={busy} className="btn-primary">{busy ? 'Saving…' : 'Save booking'}</button>
        </div>
      </form>
    </Modal>
  );
}

function EditModal({ booking, onClose, onSaved }: { booking: BookingLite; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ primaryName: booking.primaryName, email: booking.email, phone: booking.phone });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    const r = await fetch(`/api/admin/bookings/${booking.id}`, {
      method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify(form)
    });
    setBusy(false);
    if (!r.ok) { setErr('Could not save'); return; }
    onSaved();
  }
  return (
    <Modal title={`Edit booking ${booking.reference}`} onClose={onClose}>
      <form onSubmit={save} className="space-y-3">
        <FormField label="Primary name"><input className="ainput" value={form.primaryName} onChange={(e) => setForm({ ...form, primaryName: e.target.value })} /></FormField>
        <FormField label="Email"><input type="email" className="ainput" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></FormField>
        <FormField label="Phone"><input className="ainput" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></FormField>
        {err && <div className="text-sm text-maroon-700">{err}</div>}
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button disabled={busy} className="btn-primary">{busy ? 'Saving…' : 'Save changes'}</button>
        </div>
      </form>
    </Modal>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-maroon-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="card p-6 w-full max-w-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="h-display text-xl text-maroon-800">{title}</h3>
          <button onClick={onClose} className="btn-ghost !px-2 !py-1 text-lg" aria-label="Close">×</button>
        </div>
        {children}
      </div>
      <style jsx global>{`
        .ainput { width: 100%; padding: 10px 12px; border-radius: 8px; border: 1px solid rgba(185,135,36,0.4); background: white; font-size: 15px; color: #2C0A0A; }
        .ainput:focus { outline: none; border-color: #E97B11; box-shadow: 0 0 0 4px rgba(255,184,92,0.25); }
      `}</style>
    </div>
  );
}

function FormField({ label, required, full, children }: { label: string; required?: boolean; full?: boolean; children: React.ReactNode }) {
  return (
    <label className={classNames('block text-sm', full && 'sm:col-span-2')}>
      <span className="text-maroon-800 font-medium">{label}{required && <span className="text-saffron-600 ml-0.5">*</span>}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
