import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAdminFromCookies } from '@/lib/auth';
import { audit } from '@/lib/audit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const bodySchema = z.object({ confirm: z.literal('UNBLOCK-ALL') });

export async function POST(req: NextRequest) {
  const admin = await getAdminFromCookies();
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'CONFIRM_REQUIRED', message: 'Send { "confirm": "UNBLOCK-ALL" } to perform this action.' },
      { status: 400 }
    );
  }

  const result = await prisma.kundPosition.updateMany({
    where: { blocked: true },
    data: { blocked: false, blockReason: null, blockedAt: null, blockedBy: null }
  });

  await audit({
    actor: admin.email,
    action: 'UNBLOCK_ALL_POSITIONS',
    meta: { unblocked: result.count },
    req
  });

  return NextResponse.json({ ok: true, unblocked: result.count });
}
