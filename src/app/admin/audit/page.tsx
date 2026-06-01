import Link from 'next/link';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getAdminFromCookies } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const ACTION_LABELS: Record<string, { label: string; tone: 'rose' | 'amber' | 'sky' | 'emerald' | 'slate' }> = {
  ADMIN_LOGIN:           { label: 'Admin sign-in',          tone: 'emerald' },
  ADMIN_LOGIN_FAILED:    { label: 'Failed sign-in attempt', tone: 'rose'    },
  EDIT_BOOKING:          { label: 'Booking edited',         tone: 'amber'   },
  CANCEL_BOOKING:        { label: 'Booking cancelled',      tone: 'rose'    },
  ADMIN_CREATE_BOOKING:  { label: 'Manual booking added',   tone: 'sky'     },
  ADMIN_IMPORT_BOOKING:  { label: 'CSV-imported booking',   tone: 'sky'     },
  BLOCK_POSITIONS:       { label: 'Positions blocked',      tone: 'amber'   },
  UNBLOCK_POSITIONS:     { label: 'Positions unblocked',    tone: 'slate'   },
  WIPE_ALL_BOOKINGS:     { label: 'ALL bookings wiped',     tone: 'rose'    },
  WIPE_ALL_DONATIONS:    { label: 'ALL donations wiped',    tone: 'rose'    }
};

const TONE_CLASSES: Record<string, string> = {
  rose:    'bg-rose-100 text-rose-800 border-rose-300',
  amber:   'bg-amber-100 text-amber-800 border-amber-300',
  sky:     'bg-sky-100 text-sky-800 border-sky-300',
  emerald: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  slate:   'bg-slate-100 text-slate-800 border-slate-300'
};

const fmtDateTime = (d: Date) =>
  new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium', timeStyle: 'medium', timeZone: 'Europe/London'
  }).format(d);

export default async function AdminAuditLog() {
  const admin = await getAdminFromCookies();
  if (!admin) redirect('/admin/login');

  const entries = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 500
  });

  return (
    <div className="min-h-screen bg-ivory-100">
      <header className="bg-gradient-to-b from-maroon-800 to-maroon-900 text-ivory-50 border-b border-gold-300/20">
        <div className="container-tight py-6 flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="eyebrow text-gold-200 mb-1">Activity</p>
            <h1 className="h-display text-2xl md:text-3xl text-ivory-50">Audit log</h1>
            <p className="text-xs text-ivory-100/85 mt-1">
              Last 500 admin actions, newest first. Times shown in Europe/London.
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin" className="btn-ghost !text-ivory-100 hover:!bg-ivory-50/10">← Dashboard</Link>
          </div>
        </div>
      </header>

      <main className="container-tight py-8">
        {entries.length === 0 ? (
          <div className="card p-6 text-center text-maroon-800">
            No audit entries yet.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-gold-200 bg-ivory-50">
            <table className="w-full text-sm">
              <thead className="bg-maroon-900 text-ivory-100">
                <tr>
                  <th className="text-left px-3 py-2 text-xs uppercase tracking-widest">When</th>
                  <th className="text-left px-3 py-2 text-xs uppercase tracking-widest">Who</th>
                  <th className="text-left px-3 py-2 text-xs uppercase tracking-widest">What</th>
                  <th className="text-left px-3 py-2 text-xs uppercase tracking-widest">Target</th>
                  <th className="text-left px-3 py-2 text-xs uppercase tracking-widest">IP</th>
                  <th className="text-left px-3 py-2 text-xs uppercase tracking-widest">Detail</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => {
                  const def = ACTION_LABELS[e.action] ?? { label: e.action, tone: 'slate' as const };
                  return (
                    <tr key={e.id} className="border-t border-gold-200/60 align-top">
                      <td className="px-3 py-2 text-maroon-900 whitespace-nowrap">{fmtDateTime(e.createdAt)}</td>
                      <td className="px-3 py-2 text-maroon-900">{e.actor}</td>
                      <td className="px-3 py-2">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium border ${TONE_CLASSES[def.tone]}`}>
                          {def.label}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-maroon-900/80 font-mono text-xs">{e.target ?? '—'}</td>
                      <td className="px-3 py-2 text-maroon-900/80 font-mono text-xs">{e.ipAddress ?? '—'}</td>
                      <td className="px-3 py-2 text-maroon-900/75 text-xs">
                        {e.meta ? (
                          <details>
                            <summary className="cursor-pointer text-saffron-700 hover:text-saffron-800">View</summary>
                            <pre className="mt-1 whitespace-pre-wrap break-words max-w-md text-[11px]">
{JSON.stringify(e.meta, null, 2)}
                            </pre>
                            {e.userAgent && <div className="mt-1 text-[10px] text-maroon-700/70 break-all">UA: {e.userAgent}</div>}
                          </details>
                        ) : (
                          e.userAgent ? <span className="text-[10px] text-maroon-700/70 break-all">{e.userAgent}</span> : '—'
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
