'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { OmGlyph } from '@/components/ui/Ornaments';

export default function AdminLogin() {
  const r = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPw] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    const res = await fetch('/api/admin/login', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    setBusy(false);
    if (!res.ok) { setErr('Invalid email or password.'); return; }
    r.push('/admin');
  }

  return (
    <div className="min-h-screen bg-temple-gradient flex items-center justify-center px-6">
      <form onSubmit={submit} className="card p-8 w-full max-w-sm">
        <Link href="/" className="inline-flex items-center gap-2 text-maroon-800">
          <OmGlyph className="w-5 h-5 text-maroon-700" />
          <span className="h-display text-lg">SomaYagna · Admin</span>
        </Link>
        <h1 className="h-display text-2xl mt-4 text-maroon-800">Organiser sign in</h1>
        <div className="mt-6 space-y-4">
          <label className="block text-sm">
            <span className="text-maroon-800 font-medium">Email</span>
            <input className="input mt-1" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label className="block text-sm">
            <span className="text-maroon-800 font-medium">Password</span>
            <input className="input mt-1" type="password" value={password} onChange={(e) => setPw(e.target.value)} required />
          </label>
        </div>
        {err && <div role="alert" className="mt-4 text-sm text-maroon-700">{err}</div>}
        <button disabled={busy} className="btn-primary mt-6 w-full">{busy ? 'Signing in…' : 'Sign in'}</button>
        <style jsx>{`
          .input {
            width: 100%; padding: 12px 14px; border-radius: 10px; background: white;
            border: 1px solid rgba(185,135,36,0.35); color: #2C0A0A; font-size: 16px;
          }
          .input:focus { outline: none; border-color: #E97B11; box-shadow: 0 0 0 4px rgba(255,184,92,0.35); }
        `}</style>
      </form>
    </div>
  );
}
