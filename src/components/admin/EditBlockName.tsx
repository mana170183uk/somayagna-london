'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function EditBlockName({ id, initialName }: { id: string; initialName: string | null }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(initialName ?? '');
  const [name, setName] = useState(initialName);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    const trimmed = value.trim();
    if (!trimmed) {
      setErr('Name is required.');
      return;
    }
    setBusy(true);
    setErr(null);
    const r = await fetch(`/api/admin/blocks/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: trimmed })
    });
    setBusy(false);
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      setErr(j.message || j.error || 'Could not save.');
      return;
    }
    setName(trimmed);
    setEditing(false);
    router.refresh();
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => { setValue(name ?? ''); setErr(null); setEditing(true); }}
        className="text-left text-sm hover:underline hover:text-maroon-700"
        title="Click to edit"
      >
        {name || <span className="text-slate-400 italic">click to add name</span>}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1">
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); save(); }
            if (e.key === 'Escape') { setEditing(false); setErr(null); }
          }}
          placeholder="e.g. Ramesh Patel"
          className="px-2 py-1 text-sm border border-slate-300 rounded bg-white min-w-[180px]"
          disabled={busy}
        />
        <button
          type="button"
          onClick={save}
          disabled={busy}
          className="px-2 py-1 text-xs bg-maroon-700 text-ivory-50 rounded hover:bg-maroon-800 disabled:opacity-50"
        >
          {busy ? '…' : 'Save'}
        </button>
        <button
          type="button"
          onClick={() => { setEditing(false); setErr(null); }}
          disabled={busy}
          className="px-2 py-1 text-xs text-slate-600 hover:text-slate-900"
        >
          Cancel
        </button>
      </div>
      {err && <p className="text-xs text-rose-700">{err}</p>}
    </div>
  );
}
