import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAdminFromCookies } from '@/lib/auth';
import { adminCreateOfflineBooking, InventoryError, OfflinePaymentMethod } from '@/lib/inventory';
import { parseCsv, rowsToObjects } from '@/lib/csv';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const rowSchema = z.object({
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'eventDate must be YYYY-MM-DD'),
  yagnaType: z.enum(['PURSHOTAM', 'VISHNU_GOPAL_MAHA', 'PITRU']),
  sessionStartTime: z.string().regex(/^\d{1,2}:\d{2}$/, 'sessionStartTime must be HH:MM'),
  bookingType: z.enum(['SINGLE_POSITION', 'FULL_KUND']),
  kundNumber: z.coerce.number().int().min(1).max(13),
  positions: z.string().min(1),
  primaryName: z.string().min(2).max(120),
  relation: z.enum(['COUPLE', 'SIBLING', 'INDIVIDUAL']),
  phone: z.string().min(5).max(40),
  whatsappNumber: z.string().min(0).max(40).optional().default(''),
  addressLine1: z.string().max(200).optional().default(''),
  town: z.string().max(100).optional().default(''),
  postcode: z.string().max(20).optional().default(''),
  email: z.string().optional().default(''),
  secondParticipantName: z.string().max(120).optional().default(''),
  giftAid: z.string().optional().default('FALSE'),
  donationGBP: z.string().optional().default('0'),
  amountPaidGBP: z.string().optional().default(''),
  paymentMethod: z.string().optional().default('ADMIN_MANUAL'),
  paymentRef: z.string().optional().default(''),
  paymentDate: z.string().optional().default(''),
  notes: z.string().optional().default('')
});

function parseBool(s: string): boolean {
  return /^(true|yes|y|1)$/i.test((s ?? '').trim());
}
function gbpToPence(s: string): number {
  const n = Number((s ?? '').trim());
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100);
}
function normaliseMethod(s: string): OfflinePaymentMethod {
  const v = (s ?? '').trim().toUpperCase();
  if (v === 'CASH' || v === 'BANK_TRANSFER' || v === 'CHEQUE') return v;
  return 'ADMIN_MANUAL';
}

const YAGNA_LABELS: Record<string, string> = {
  PURSHOTAM: 'Purshotam',
  VISHNU_GOPAL_MAHA: 'Vishnu Gopal Maha',
  PITRU: 'Pitru'
};

export async function POST(req: NextRequest) {
  const admin = await getAdminFromCookies();
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const text = await req.text();
  if (!text.trim()) {
    return NextResponse.json({ error: 'EMPTY_CSV', message: 'No CSV content received.' }, { status: 400 });
  }

  const rows = rowsToObjects(parseCsv(text));
  if (rows.length === 0) {
    return NextResponse.json({ error: 'NO_ROWS', message: 'CSV has a header but no data rows.' }, { status: 400 });
  }

  const results: Array<{ rowNumber: number; status: 'CREATED' | 'FAILED'; reference?: string; error?: string }> = [];

  for (let i = 0; i < rows.length; i++) {
    const rowNumber = i + 2; // header is row 1
    const raw = rows[i];

    const parsed = rowSchema.safeParse(raw);
    if (!parsed.success) {
      results.push({
        rowNumber,
        status: 'FAILED',
        error: parsed.error.issues.map((iss) => `${iss.path.join('.')}: ${iss.message}`).join('; ')
      });
      continue;
    }
    const r = parsed.data;

    try {
      // Resolve session by (date, yagnaType, startTime)
      const eventDay = await prisma.eventDay.findFirst({
        where: { date: new Date(`${r.eventDate}T00:00:00.000Z`) }
      });
      if (!eventDay) {
        results.push({ rowNumber, status: 'FAILED', error: `No event day for ${r.eventDate}` });
        continue;
      }
      const yagnaInstance = await prisma.yagnaInstance.findFirst({
        where: { eventDayId: eventDay.id, yagnaType: r.yagnaType }
      });
      if (!yagnaInstance) {
        results.push({ rowNumber, status: 'FAILED', error: `No ${YAGNA_LABELS[r.yagnaType]} Yagna on ${r.eventDate}` });
        continue;
      }
      const startTime = r.sessionStartTime.length === 4 ? `0${r.sessionStartTime}` : r.sessionStartTime;
      const session = await prisma.session.findFirst({
        where: { yagnaInstanceId: yagnaInstance.id, startTime }
      });
      if (!session) {
        results.push({ rowNumber, status: 'FAILED', error: `No session at ${startTime} for ${r.yagnaType} on ${r.eventDate}` });
        continue;
      }

      const positions = r.positions
        .split(',')
        .map((p) => p.trim().toUpperCase())
        .filter(Boolean) as ('A' | 'B' | 'C')[];

      if (r.bookingType === 'FULL_KUND' && positions.length !== 3) {
        results.push({ rowNumber, status: 'FAILED', error: `FULL_KUND requires positions A,B,C — got ${r.positions}` });
        continue;
      }
      if (r.bookingType === 'SINGLE_POSITION' && positions.length !== 1) {
        results.push({ rowNumber, status: 'FAILED', error: `SINGLE_POSITION requires one position — got ${r.positions}` });
        continue;
      }

      const booking = await adminCreateOfflineBooking({
        sessionId: session.id,
        bookingType: r.bookingType,
        kundNumber: r.kundNumber,
        positions,
        primaryName: r.primaryName,
        relation: r.relation,
        email: r.email,
        phone: r.phone,
        whatsappNumber: r.whatsappNumber || null,
        addressLine1: r.addressLine1 || null,
        town: r.town || null,
        postcode: r.postcode || null,
        secondParticipantName: r.secondParticipantName || null,
        giftAid: parseBool(r.giftAid),
        donationPence: gbpToPence(r.donationGBP),
        amountPaidPence: r.amountPaidGBP ? gbpToPence(r.amountPaidGBP) : undefined,
        paymentMethod: normaliseMethod(r.paymentMethod),
        paymentRef: r.paymentRef || null,
        actor: admin.email
      });

      results.push({ rowNumber, status: 'CREATED', reference: booking.reference });
    } catch (e) {
      if (e instanceof InventoryError) {
        results.push({ rowNumber, status: 'FAILED', error: `${e.code}: ${e.message}` });
      } else {
        console.error(`[import-bookings] row ${rowNumber} crashed`, e);
        results.push({ rowNumber, status: 'FAILED', error: 'Internal error' });
      }
    }
  }

  const created = results.filter((r) => r.status === 'CREATED').length;
  const failed = results.filter((r) => r.status === 'FAILED').length;
  return NextResponse.json({ ok: true, totalRows: results.length, created, failed, results });
}
