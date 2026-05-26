import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAdminFromCookies } from '@/lib/auth';

const bodySchema = z.object({ enabled: z.boolean() });

/**
 * Enable/disable a session. Used for optional ('if there is demand') sessions
 * that admins switch on when capacity is needed. Disabled sessions are hidden
 * from the public /book flow but their data is preserved.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminFromCookies();
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const { id } = await params;
  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'INVALID' }, { status: 400 });

  // Refuse to disable a session that has confirmed bookings (would orphan them)
  if (!parsed.data.enabled) {
    const bookingCount = await prisma.booking.count({
      where: { sessionId: id, status: 'CONFIRMED' }
    });
    if (bookingCount > 0) {
      return NextResponse.json({
        error: 'CONFLICT',
        message: `Cannot disable: ${bookingCount} confirmed booking${bookingCount === 1 ? '' : 's'} on this session.`
      }, { status: 409 });
    }
  }

  await prisma.session.update({ where: { id }, data: { enabled: parsed.data.enabled } });
  await prisma.auditLog.create({
    data: {
      actor: admin.email,
      action: parsed.data.enabled ? 'SESSION_ENABLE' : 'SESSION_DISABLE',
      target: id
    }
  });

  return NextResponse.json({ ok: true, enabled: parsed.data.enabled });
}
