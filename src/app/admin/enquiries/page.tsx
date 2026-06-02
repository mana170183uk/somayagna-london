import Link from 'next/link';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getAdminFromCookies } from '@/lib/auth';
import EnquiryActions from '@/components/admin/EnquiryActions';

export const dynamic = 'force-dynamic';

const SUBJECT_LABEL: Record<string, string> = {
  SLOT_BOOKING:    'Slot booking',
  CHANGE_BOOKING:  'Change booking',
  DONATION:        'Donation',
  SEVA:            'Seva',
  OTHER:           'Other'
};

const STATUS_TONES: Record<string, string> = {
  NEW:         'bg-rose-100 border-rose-400 text-rose-800',
  IN_PROGRESS: 'bg-amber-100 border-amber-400 text-amber-800',
  RESOLVED:    'bg-emerald-100 border-emerald-400 text-emerald-800'
};

const fmt = (d: Date) => new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/London'
}).format(d);

export default async function AdminEnquiries() {
  const admin = await getAdminFromCookies();
  if (!admin) redirect('/admin/login');

  const enquiries = await prisma.enquiry.findMany({
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    take: 200
  });
  const counts = await prisma.enquiry.groupBy({
    by: ['status'],
    _count: { _all: true }
  });
  const byStatus = Object.fromEntries(counts.map((c) => [c.status, c._count._all]));

  return (
    <div className="min-h-screen bg-ivory-100">
      <header className="bg-gradient-to-b from-maroon-800 to-maroon-900 text-ivory-50 border-b border-gold-300/20">
        <div className="container-tight py-6 flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="eyebrow text-gold-200 mb-1">Inbox</p>
            <h1 className="h-display text-2xl md:text-3xl text-ivory-50">Enquiries</h1>
            <p className="text-xs text-ivory-100/85 mt-1">
              {byStatus.NEW ?? 0} new · {byStatus.IN_PROGRESS ?? 0} in progress · {byStatus.RESOLVED ?? 0} resolved
            </p>
          </div>
          <Link href="/admin" className="btn-ghost !text-ivory-100 hover:!bg-ivory-50/10">← Dashboard</Link>
        </div>
      </header>

      <main className="container-tight py-8 space-y-4">
        {enquiries.length === 0 ? (
          <div className="card p-6 text-center text-maroon-800">No enquiries yet.</div>
        ) : enquiries.map((e) => (
          <article key={e.id} className={`rounded-2xl border-2 bg-ivory-50 p-5 ${STATUS_TONES[e.status] ?? 'border-slate-200'}`}>
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium border-2 ${STATUS_TONES[e.status]}`}>{e.status.replace('_', ' ')}</span>
                  <span className="text-xs uppercase tracking-widest text-maroon-700/70">{SUBJECT_LABEL[e.subject] ?? e.subject}</span>
                </div>
                <h2 className="h-display text-xl text-maroon-800 mt-1">{e.name}</h2>
                <div className="text-xs text-maroon-700/80">
                  <a className="text-saffron-700 hover:text-saffron-800" href={`mailto:${e.email}`}>{e.email}</a>
                  {e.phone && <> · <a href={`tel:${e.phone.replace(/\s/g, '')}`}>{e.phone}</a></>}
                  {e.bookingReference && <> · ref <strong>{e.bookingReference}</strong></>}
                </div>
                <div className="text-[11px] text-maroon-700/60 mt-1">
                  {fmt(e.createdAt)}
                  {e.ipAddress && <> · IP {e.ipAddress}</>}
                </div>
              </div>
              <EnquiryActions id={e.id} status={e.status} email={e.email} />
            </div>
            <p className="mt-3 text-sm text-maroon-900/85 whitespace-pre-wrap">{e.message}</p>
            {e.handledBy && e.handledAt && (
              <p className="mt-3 text-[11px] text-maroon-700/65 border-t border-gold-200 pt-2">
                Resolved by {e.handledBy} on {fmt(e.handledAt)}
                {e.resolutionNotes && <> — “{e.resolutionNotes}”</>}
              </p>
            )}
          </article>
        ))}
      </main>
    </div>
  );
}
