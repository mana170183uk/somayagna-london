'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { classNames } from '@/lib/utils';

interface BookingLite {
  id: string; reference: string; primaryName: string; email: string | null; phone: string;
  bookingType: 'SINGLE_POSITION' | 'FULL_KUND'; status: string; amountPence: number;
  paymentStatus: string | null; paymentProvider: string | null;
}
interface PositionLite {
  id: string; label: 'A' | 'B' | 'C'; booking: BookingLite | null;
  blocked: boolean; blockReason: string | null; blockedBy: string | null;
}
interface KundLite { id: string; number: number; positions: PositionLite[]; }

const gbp = (p: number) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(p / 100);

export default function AdminSessionPanel({ sessionId, kunds }: { sessionId: string; kunds: KundLite[] }) {
  const router = useRouter();
  const [adding, setAdding] = useState<{ kund: number; positions: ('A'|'B'|'C')[] } | null>(null);
  const [editing, setEditing] = useState<BookingLite | null>(null);
  const [moving, setMoving] = useState<{ booking: BookingLite; currentKund: number; currentPositions: ('A'|'B'|'C')[] } | null>(null);
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

  async function setBlocked(positionIds: string[], block: boolean, reasonPrompt = true) {
    let reason: string | undefined;
    if (block && reasonPrompt) {
      // Required: devotee/family name so we can print a per-day attendance list.
      // Admins can append a note after a dash, e.g. "Ramesh Patel — VIP".
      const input = window.prompt('Devotee / family name (required) — e.g. "Ramesh Patel":', '');
      if (input === null) return; // cancelled
      const trimmed = input.trim();
      if (!trimmed) {
        setErr('A devotee name is required to block a position.');
        return;
      }
      reason = trimmed;
    }
    setBusy(true); setErr(null);
    const r = await fetch('/api/admin/positions/block', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ positionIds, block, reason })
    });
    setBusy(false);
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      setErr(j.message || j.error || `Could not ${block ? 'block' : 'unblock'}.`);
      return;
    }
    router.refresh();
  }

  return (
    <div className="mt-6 space-y-6">
      {err && <div role="alert" className="rounded-lg border border-maroon-300 bg-maroon-50 text-maroon-800 px-4 py-3 text-sm">{err}</div>}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {kunds.map((k) => {
          const allFree = k.positions.every((p) => !p.booking && !p.blocked);
          const allUnblockable = k.positions.every((p) => !p.booking);
          const allBlocked = k.positions.every((p) => p.blocked);
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
                    p.booking ? 'border-maroon-200 bg-ivory-100' :
                    p.blocked ? 'border-slate-400 bg-slate-100' : 'border-gold-300/50'
                  )}>
                    <div className="flex justify-between items-baseline">
                      <span className="h-display text-base text-maroon-800">Position {p.label}</span>
                      {p.booking ? (
                        <span className="text-[10px] uppercase tracking-widest text-saffron-700">{p.booking.bookingType === 'FULL_KUND' ? 'Full Kund' : 'Single'}</span>
                      ) : p.blocked ? (
                        <span className="text-[10px] uppercase tracking-widest text-slate-700 flex items-center gap-1">
                          🔒 Blocked
                        </span>
                      ) : <span className="text-xs text-maroon-700/85">Free</span>}
                    </div>
                    {p.booking ? (
                      <div className="mt-1">
                        <div className="text-maroon-900">{p.booking.primaryName}</div>
                        <div className="text-xs text-maroon-700/90">{p.booking.email ?? '(no email)'}</div>
                        <div className="text-xs text-maroon-700/90">{p.booking.reference} · {gbp(p.booking.amountPence)} · {p.booking.paymentStatus ?? '—'}</div>
                        <div className="mt-2 flex gap-2 flex-wrap">
                          <button className="btn-ghost !py-1 !px-2 !text-xs" onClick={() => setEditing(p.booking!)}>Edit</button>
                          <button
                            className="btn-ghost !py-1 !px-2 !text-xs"
                            onClick={() => {
                              const positionsForBooking = k.positions
                                .filter((x) => x.booking?.id === p.booking!.id)
                                .map((x) => x.label) as ('A'|'B'|'C')[];
                              setMoving({ booking: p.booking!, currentKund: k.number, currentPositions: positionsForBooking });
                            }}
                          >Move…</button>
                          <button disabled={busy} className="btn-ghost !py-1 !px-2 !text-xs text-maroon-700" onClick={() => cancel(p.booking!.id)}>Cancel</button>
                        </div>
                      </div>
                    ) : p.blocked ? (
                      <div className="mt-1">
                        <div className="text-xs text-slate-700">{p.blockReason ?? 'Reserved'}</div>
                        {p.blockedBy && <div className="text-[11px] text-slate-600">by {p.blockedBy}</div>}
                        <button
                          disabled={busy}
                          className="btn-ghost !py-1 !px-2 !text-xs text-slate-700 mt-2"
                          onClick={() => setBlocked([p.id], false, false)}
                        >Unblock</button>
                      </div>
                    ) : (
                      <button
                        disabled={busy}
                        className="btn-ghost !py-1 !px-2 !text-xs text-slate-600 mt-2"
                        onClick={() => setBlocked([p.id], true)}
                      >🔒 Block</button>
                    )}
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex flex-wrap gap-2">
                {k.positions.filter((p) => !p.booking && !p.blocked).map((p) => (
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
                {allUnblockable && !allBlocked && (
                  <button disabled={busy} className="btn-ghost !py-1 !px-3 !text-xs text-slate-700"
                          onClick={() => setBlocked(k.positions.filter((p) => !p.blocked).map((p) => p.id), true)}>
                    🔒 Block whole Kund
                  </button>
                )}
                {allBlocked && (
                  <button disabled={busy} className="btn-ghost !py-1 !px-3 !text-xs text-slate-700"
                          onClick={() => setBlocked(k.positions.map((p) => p.id), false, false)}>
                    Unblock whole Kund
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

      {moving && (
        <MoveModal
          booking={moving.booking}
          currentKund={moving.currentKund}
          currentPositions={moving.currentPositions}
          kunds={kunds}
          onClose={() => setMoving(null)}
          onSaved={() => { setMoving(null); router.refresh(); }}
        />
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
  const [form, setForm] = useState({ primaryName: booking.primaryName, email: booking.email ?? '', phone: booking.phone });
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

function MoveModal({
  booking, currentKund, currentPositions, kunds, onClose, onSaved
}: {
  booking: BookingLite;
  currentKund: number;
  currentPositions: ('A'|'B'|'C')[];
  kunds: KundLite[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isFullKund = booking.bookingType === 'FULL_KUND';
  const positionsNeeded = currentPositions.length;

  // For SINGLE_POSITION: list every free position in the session as an option.
  // For FULL_KUND: list every kund where ALL 3 positions are either free
  // or owned by THIS booking (i.e. moving to itself shouldn't count as taken).
  const singleOptions: { kund: number; label: 'A'|'B'|'C' }[] = [];
  const fullKundOptions: number[] = [];
  for (const k of kunds) {
    if (isFullKund) {
      const ok = k.positions.every(
        (p) => (!p.booking && !p.blocked) || p.booking?.id === booking.id
      );
      if (ok) fullKundOptions.push(k.number);
    } else {
      for (const p of k.positions) {
        const isMine = p.booking?.id === booking.id;
        const free = !p.booking && !p.blocked;
        if (free || isMine) singleOptions.push({ kund: k.number, label: p.label });
      }
    }
  }

  const initialKey = isFullKund
    ? String(currentKund)
    : `${currentKund}:${currentPositions[0]}`;
  const [pick, setPick] = useState(initialKey);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    let targetKundNumber: number;
    let targetPositions: ('A'|'B'|'C')[];
    if (isFullKund) {
      targetKundNumber = Number(pick);
      targetPositions = ['A', 'B', 'C'];
    } else {
      const [kStr, label] = pick.split(':');
      targetKundNumber = Number(kStr);
      targetPositions = [label as 'A'|'B'|'C'];
    }
    setBusy(true); setErr(null);
    const r = await fetch(`/api/admin/bookings/${booking.id}/move`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ targetKundNumber, targetPositions })
    });
    const data = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) {
      setErr(data.message || data.error || 'Could not move booking.');
      return;
    }
    onSaved();
  }

  return (
    <Modal title={`Move booking ${booking.reference}`} onClose={onClose}>
      <form onSubmit={save} className="space-y-3">
        <div className="rounded-lg bg-ivory-100 border border-maroon-200 px-3 py-2 text-sm text-maroon-900">
          <div><span className="text-maroon-700/85">Devotee:</span> <b>{booking.primaryName}</b></div>
          <div><span className="text-maroon-700/85">Currently at:</span> Kund {currentKund} / {currentPositions.join(', ')} ({isFullKund ? 'Full Kund' : 'Single'}) </div>
          <div className="text-xs text-maroon-700/85 mt-1">Moves stay in the same session ({positionsNeeded} position{positionsNeeded === 1 ? '' : 's'}). Only available targets are shown.</div>
        </div>

        {isFullKund ? (
          fullKundOptions.length === 0 ? (
            <p className="text-sm text-maroon-700">No other kund has all three positions free in this session.</p>
          ) : (
            <FormField label="Move to which Kund?">
              <select className="ainput" value={pick} onChange={(e) => setPick(e.target.value)}>
                {fullKundOptions.map((n) => (
                  <option key={n} value={String(n)}>
                    Kund {n}{n === currentKund ? ' (current — no change)' : ''}
                  </option>
                ))}
              </select>
            </FormField>
          )
        ) : (
          singleOptions.length === 0 ? (
            <p className="text-sm text-maroon-700">No free positions available in this session.</p>
          ) : (
            <FormField label="Move to which Kund / Position?">
              <select className="ainput" value={pick} onChange={(e) => setPick(e.target.value)}>
                {singleOptions.map((o) => {
                  const isCurrent = o.kund === currentKund && currentPositions.includes(o.label);
                  return (
                    <option key={`${o.kund}:${o.label}`} value={`${o.kund}:${o.label}`}>
                      Kund {o.kund} / Position {o.label}{isCurrent ? ' (current)' : ''}
                    </option>
                  );
                })}
              </select>
            </FormField>
          )
        )}

        {err && <div className="text-sm text-maroon-700">{err}</div>}
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button
            disabled={busy || (isFullKund ? fullKundOptions.length === 0 : singleOptions.length === 0)}
            className="btn-primary"
          >{busy ? 'Moving…' : 'Move booking'}</button>
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
