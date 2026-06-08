import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAdminFromCookies } from '@/lib/auth';
import { clientIp, userAgent } from '@/lib/audit';

const bodySchema = z.object({
  name: z.string().trim().min(1, 'name required').max(200)
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminFromCookies();
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const { id } = await params;

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'INVALID', issues: parsed.error.issues }, { status: 400 });
  }

  const existing = await prisma.kundPosition.findUnique({
    where: { id },
    select: { blocked: true, blockReason: true }
  });
  if (!existing) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  if (!existing.blocked) {
    return NextResponse.json({ error: 'NOT_BLOCKED', message: 'Position is not blocked.' }, { status: 409 });
  }

  await prisma.kundPosition.update({
    where: { id },
    data: { blockReason: parsed.data.name }
  });

  await prisma.auditLog.create({
    data: {
      actor: admin.email,
      action: 'EDIT_BLOCK_NAME',
      target: id,
      ipAddress: clientIp(req),
      userAgent: userAgent(req),
      meta: { from: existing.blockReason, to: parsed.data.name }
    }
  });

  return NextResponse.json({ ok: true, name: parsed.data.name });
}
