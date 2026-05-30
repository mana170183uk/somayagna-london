'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

interface RowResult {
  rowNumber: number;
  status: 'CREATED' | 'FAILED';
  reference?: string;
  error?: string;
}
interface ImportResponse {
  ok: boolean;
  totalRows: number;
  created: number;
  failed: number;
  results: RowResult[];
}

export default function ImportBookingsCard() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ImportResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true); setErr(null); setResult(null);
    try {
      const text = await file.text();
      const r = await fetch('/api/admin/import-bookings', {
        method: 'POST',
        headers: { 'content-type': 'text/csv' },
        body: text
      });
      const data = await r.json();
      if (!r.ok) {
        setErr(data.message ?? data.error ?? `HTTP ${r.status}`);
        return;
      }
      setResult(data as ImportResponse);
      router.refresh();
    } catch (e: any) {
      setErr(e?.message ?? 'Upload failed');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className="rounded-2xl bg-ivory-50/10 border border-ivory-50/20 p-5 text-ivory-100">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="h-display text-lg text-ivory-50">Import offline bookings (CSV)</div>
          <p className="text-xs text-ivory-100/75 mt-1 max-w-xl">
            Upload a CSV of bookings paid offline (cash, bank transfer, cheque). Each row creates
            a CONFIRMED booking attributed to the named devotee, exactly as if booked online.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href="/templates/manual-bookings-template.csv"
            download
            className="btn-secondary !bg-ivory-50/15 !text-ivory-50 !border-ivory-50/30 hover:!bg-ivory-50/25 !text-xs"
          >
            ↓ Download template
          </a>
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="btn-primary !text-xs"
          >
            {busy ? 'Importing…' : '↑ Upload CSV'}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={onPick}
          />
        </div>
      </div>

      {err && (
        <div role="alert" className="mt-3 rounded-lg border border-rose-300/50 bg-rose-100/15 text-rose-100 px-3 py-2 text-xs">
          {err}
        </div>
      )}

      {result && (
        <div className="mt-4">
          <div className="text-xs text-ivory-100/85">
            <strong className="text-ivory-50">{result.created}</strong> created ·{' '}
            <strong className={result.failed > 0 ? 'text-rose-200' : 'text-ivory-50'}>{result.failed}</strong> failed ·{' '}
            {result.totalRows} total rows
          </div>
          {result.failed > 0 && (
            <details className="mt-2 text-xs">
              <summary className="cursor-pointer text-ivory-100/85 hover:text-ivory-50">Show errors</summary>
              <ul className="mt-2 space-y-1 max-h-48 overflow-auto bg-maroon-900/40 rounded p-2">
                {result.results.filter((r) => r.status === 'FAILED').map((r) => (
                  <li key={r.rowNumber} className="text-rose-200">
                    Row {r.rowNumber}: {r.error}
                  </li>
                ))}
              </ul>
            </details>
          )}
          {result.created > 0 && (
            <details className="mt-2 text-xs">
              <summary className="cursor-pointer text-ivory-100/85 hover:text-ivory-50">Show created references</summary>
              <ul className="mt-2 space-y-1 max-h-48 overflow-auto bg-maroon-900/40 rounded p-2">
                {result.results.filter((r) => r.status === 'CREATED').map((r) => (
                  <li key={r.rowNumber} className="text-emerald-200">
                    Row {r.rowNumber}: {r.reference}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
