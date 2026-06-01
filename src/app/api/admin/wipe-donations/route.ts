import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAdminFromCookies } from '@/lib/auth';
import { clientIp, userAgent } from '@/lib/audit';

const bodySchema = z.object({ confirm: z.literal('WIPE-ALL-DONATIONS') });

export async function POST(req: NextRequest) {
  const admin = await getAdminFromCookies();
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'CONFIRM_REQUIRED', message: 'Send { "confirm": "WIPE-ALL-DONATIONS" } to perform this destructive action.' },
      { status: 400 }
    );
  }

  const deleted = await prisma.donation.deleteMany({});

  await prisma.auditLog.create({
    data: {
      actor: admin.email,
      action: 'WIPE_ALL_DONATIONS',
      ipAddress: clientIp(req),
      userAgent: userAgent(req),
      meta: { deletedDonations: deleted.count }
    }
  });

  return NextResponse.json({ ok: true, deletedDonations: deleted.count });
}
