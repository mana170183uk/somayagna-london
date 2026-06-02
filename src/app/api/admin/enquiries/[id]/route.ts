import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAdminFromCookies } from '@/lib/auth';
import { audit } from '@/lib/audit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const patchSchema = z.object({
  status: z.enum(['NEW', 'IN_PROGRESS', 'RESOLVED']),
  resolutionNotes: z.string().max(1000).nullable().optional()
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminFromCookies();
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const { id } = await params;
  const parsed = patchSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'INVALID', issues: parsed.error.issues }, { status: 400 });

  const updated = await prisma.enquiry.update({
    where: { id },
    data: {
      status: parsed.data.status,
      handledBy: parsed.data.status === 'RESOLVED' ? admin.email : null,
      handledAt: parsed.data.status === 'RESOLVED' ? new Date() : null,
      resolutionNotes: parsed.data.resolutionNotes ?? null
    }
  });

  await audit({
    actor: admin.email,
    action: 'UPDATE_ENQUIRY',
    target: id,
    meta: { newStatus: parsed.data.status, notes: parsed.data.resolutionNotes ?? null },
    req
  });

  return NextResponse.json({ ok: true, status: updated.status });
}
