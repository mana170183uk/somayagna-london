'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ChangePasswordForm() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNew, setConfirmNew] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const canSubmit =
    currentPassword.length > 0 &&
    newPassword.length >= 10 &&
    newPassword === confirmNew &&
    newPassword !== currentPassword;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null); setOk(false);
    try {
      const r = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await r.json();
      if (!r.ok) {
        setErr(data.message ?? data.error ?? `HTTP ${r.status}`);
        return;
      }
      setOk(true);
      setCurrentPassword(''); setNewPassword(''); setConfirmNew('');
      router.refresh();
    } catch (e: any) {
      setErr(e?.message ?? 'Could not change password.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 space-y-4" autoComplete="off">
      <Field label="Current password">
        <input
          type="password"
          autoComplete="current-password"
          className="ainput"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
        />
      </Field>
      <Field label="New password" hint={
        newPassword.length > 0 && newPassword.length < 10
          ? 'Must be at least 10 characters.'
          : undefined
      }>
        <input
          type="password"
          autoComplete="new-password"
          className="ainput"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          minLength={10}
        />
      </Field>
      <Field label="Confirm new password" hint={
        confirmNew.length > 0 && confirmNew !== newPassword
          ? 'Passwords do not match.'
          : undefined
      }>
        <input
          type="password"
          autoComplete="new-password"
          className="ainput"
          value={confirmNew}
          onChange={(e) => setConfirmNew(e.target.value)}
          required
        />
      </Field>

      {err && (
        <div role="alert" className="rounded-lg border border-rose-300 bg-rose-100 text-rose-800 px-3 py-2 text-sm">
          {err}
        </div>
      )}
      {ok && (
        <div role="status" className="rounded-lg border border-emerald-300 bg-emerald-100 text-emerald-800 px-3 py-2 text-sm">
          Password updated. Existing sessions stay signed in until they expire (max 8h).
        </div>
      )}

      <button
        type="submit"
        disabled={!canSubmit || busy}
        className="btn-primary w-full"
      >
        {busy ? 'Updating…' : 'Update password'}
      </button>

      <style jsx global>{`
        .ainput { width: 100%; padding: 10px 12px; border-radius: 8px; border: 1px solid rgba(185,135,36,0.4); background: white; font-size: 15px; color: #2C0A0A; }
        .ainput:focus { outline: none; border-color: #E97B11; box-shadow: 0 0 0 4px rgba(255,184,92,0.25); }
      `}</style>
    </form>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="text-maroon-800 font-medium">{label}</span>
      <div className="mt-1.5">{children}</div>
      {hint && <div className="mt-1 text-xs text-rose-700">{hint}</div>}
    </label>
  );
}
