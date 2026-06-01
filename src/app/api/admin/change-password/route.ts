import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAdminFromCookies, hashPassword, verifyPassword } from '@/lib/auth';
import { audit } from '@/lib/audit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string()
    .min(10, 'New password must be at least 10 characters.')
    .max(200)
});

export async function POST(req: NextRequest) {
  const admin = await getAdminFromCookies();
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'INVALID', message: parsed.error.issues.map((i) => i.message).join(' ') },
      { status: 400 }
    );
  }

  const user = await prisma.adminUser.findUnique({ where: { email: admin.email } });
  if (!user || !verifyPassword(parsed.data.currentPassword, user.passwordHash)) {
    await audit({ actor: admin.email, action: 'ADMIN_CHANGE_PASSWORD_FAILED', req });
    return NextResponse.json({ error: 'INVALID_CURRENT_PASSWORD', message: 'Current password is incorrect.' }, { status: 401 });
  }

  if (parsed.data.newPassword === parsed.data.currentPassword) {
    return NextResponse.json({ error: 'SAME_PASSWORD', message: 'New password must differ from the current one.' }, { status: 400 });
  }

  await prisma.adminUser.update({
    where: { email: admin.email },
    data: { passwordHash: hashPassword(parsed.data.newPassword) }
  });

  await audit({ actor: admin.email, action: 'ADMIN_CHANGE_PASSWORD', req });
  return NextResponse.json({ ok: true });
}
