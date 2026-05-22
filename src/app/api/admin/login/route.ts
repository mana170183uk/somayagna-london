import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { adminLoginSchema } from '@/lib/zodSchemas';
import { ADMIN_COOKIE, signSession, verifyPassword } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const parsed = adminLoginSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'INVALID' }, { status: 400 });
  const user = await prisma.adminUser.findUnique({ where: { email: parsed.data.email } });
  if (!user || !verifyPassword(parsed.data.password, user.passwordHash)) {
    return NextResponse.json({ error: 'INVALID_CREDENTIALS' }, { status: 401 });
  }
  const token = signSession(user.email);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, token, { httpOnly: true, sameSite: 'lax', path: '/', secure: process.env.NODE_ENV === 'production', maxAge: 60 * 60 * 8 });
  return res;
}
