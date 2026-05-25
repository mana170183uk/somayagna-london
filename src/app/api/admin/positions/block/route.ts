import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAdminFromCookies } from '@/lib/auth';

const bodySchema = z.object({
  positionIds: z.array(z.string().min(1)).min(1).max(50),
  block: z.boolean(),
  reason: z.string().max(200).optional()
});

export async function POST(req: NextRequest) {
  const admin = await getAdminFromCookies();
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'INVALID', issues: parsed.error.issues }, { status: 400 });

  const { positionIds, block, reason } = parsed.data;

  // Refuse to block positions that are already booked / held (would silently hide a real booking)
  if (block) {
    const conflicts = await prisma.kundPosition.findMany({
      where: { id: { in: positionIds }, OR: [{ bookingId: { not: null } }, { holdId: { not: null } }] },
      select: { id: true, label: true, kund: { select: { number: true } } }
    });
    if (conflicts.length > 0) {
      const labels = conflicts.map((c) => `Kund ${c.kund.number}/${c.label}`).join(', ');
      return NextResponse.json({ error: 'CONFLICT', message: `Cannot block ${labels} — they already have an active booking or hold.` }, { status: 409 });
    }
  }

  await prisma.kundPosition.updateMany({
    where: { id: { in: positionIds } },
    data: block
      ? { blocked: true, blockReason: reason ?? 'Reserved by admin', blockedAt: new Date(), blockedBy: admin.email }
      : { blocked: false, blockReason: null, blockedAt: null, blockedBy: null }
  });

  await prisma.auditLog.create({
    data: {
      actor: admin.email,
      action: block ? 'BLOCK_POSITIONS' : 'UNBLOCK_POSITIONS',
      target: positionIds.join(','),
      meta: { count: positionIds.length, reason: reason ?? null }
    }
  });

  return NextResponse.json({ ok: true, count: positionIds.length });
}
