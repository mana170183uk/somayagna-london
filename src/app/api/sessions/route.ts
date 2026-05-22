import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const days = await prisma.eventDay.findMany({
    orderBy: { date: 'asc' },
    include: { sessions: { orderBy: { startTime: 'asc' } } }
  });
  return NextResponse.json({
    days: days.map((d) => ({
      id: d.id,
      date: d.date.toISOString().slice(0, 10),
      title: d.title,
      yagnaType: d.yagnaType,
      isActive: d.isActive,
      sessions: d.sessions.map((s) => ({ id: s.id, startTime: s.startTime, label: s.label }))
    }))
  });
}
