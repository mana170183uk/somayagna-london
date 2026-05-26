import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const days = await prisma.eventDay.findMany({
    orderBy: { date: 'asc' },
    include: {
      yagnaInstances: {
        orderBy: { yagnaType: 'asc' },
        include: {
          sessions: {
            where: { enabled: true },
            orderBy: { startTime: 'asc' },
            select: { id: true, startTime: true, label: true, optional: true }
          }
        }
      }
    }
  });
  return NextResponse.json({
    days: days.map((d) => ({
      id: d.id,
      date: d.date.toISOString().slice(0, 10),
      description: d.description,
      yagnas: d.yagnaInstances.map((y) => ({
        id: y.id, type: y.yagnaType, title: y.title, kundCount: y.kundCount,
        sessions: y.sessions
      }))
    }))
  });
}
