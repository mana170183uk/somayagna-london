import { NextResponse } from 'next/server';
import { getAdminFromCookies } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const admin = getAdminFromCookies();
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const ds = await prisma.donation.findMany({ orderBy: { createdAt: 'desc' } });

  const header = ['Reference','Status','Type','Material','Amount (GBP)','GiftAid','GiftAidUplift (GBP)','DonorName','Anonymous','Email','Phone','Message','GiftAidAddress','Postcode','Provider','PaymentRef','CompletedAt','CreatedAt'];
  const rows = ds.map((d) => [
    d.reference, d.status, d.type, d.materialLabel ?? '',
    (d.amountPence / 100).toFixed(2),
    d.giftAid ? 'YES' : 'NO',
    d.giftAid ? (d.amountPence * 0.25 / 100).toFixed(2) : '',
    d.donorName, d.anonymous ? 'YES' : 'NO',
    d.donorEmail, d.donorPhone ?? '',
    d.message ?? '', d.giftAidAddress ?? '', d.giftAidPostcode ?? '',
    d.paymentProvider ?? '', d.paymentRef ?? '',
    d.completedAt?.toISOString() ?? '', d.createdAt.toISOString()
  ]);
  const csv = [header, ...rows].map((r) => r.map(esc).join(',')).join('\n');
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="somayagna-donations-${new Date().toISOString().slice(0, 10)}.csv"`
    }
  });
}

function esc(v: unknown) { const s = String(v ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; }
