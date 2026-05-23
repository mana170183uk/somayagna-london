import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/passwords';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const existing = await prisma.adminUser.count();
  if (existing > 0) {
    return NextResponse.json({ status: 'ALREADY_BOOTSTRAPPED' }, { status: 403 });
  }

  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    return NextResponse.json({ status: 'MISSING_ENV' }, { status: 500 });
  }

  await prisma.adminUser.create({
    data: { email, passwordHash: hashPassword(password), name: 'Organizer' }
  });
  return NextResponse.json({ status: 'CREATED', email });
}
