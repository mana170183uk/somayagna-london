import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Returns all yagnas + (enabled) sessions for a given event day.
 * Date param is the ISO yyyy-mm-dd string.
 *
 *   GET /api/days/2026-06-15
 *   → {
 *       date: '2026-06-15',
 *       description: '...',
 *       yagnas: [
 *         { id, type: 'PURSHOTAM', title: 'Purshotam Yagna', kundCount: 11,
 *           sessions: [{ id, startTime, label, optional, enabled }, ...] },
 *         { id, type: 'PITRU', title: 'Pitru Yagna', kundCount: 9, sessions: [...] }
 *       ]
 *     }
 */
export async function GET(_req: Request, { params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  try {
    const iso = date.slice(0, 10);
    const dayDate = new Date(`${iso}T00:00:00.000Z`);
    if (Number.isNaN(dayDate.getTime())) return NextResponse.json({ error: 'INVALID_DATE' }, { status: 400 });

    const eventDay = await prisma.eventDay.findUnique({
      where: { date: dayDate },
      include: {
        yagnaInstances: {
          orderBy: { yagnaType: 'asc' },
          include: {
            sessions: {
              where: { enabled: true },                  // hide admin-disabled / not-yet-enabled optional sessions
              orderBy: { startTime: 'asc' },
              select: { id: true, startTime: true, label: true, optional: true, enabled: true }
            }
          }
        }
      }
    });
    if (!eventDay) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });

    return NextResponse.json({
      date: iso,
      description: eventDay.description,
      yagnas: eventDay.yagnaInstances.map((y) => ({
        id: y.id, type: y.yagnaType, title: y.title, kundCount: y.kundCount,
        sessions: y.sessions
      }))
    });
  } catch (e) {
    const msg = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
    console.error('[days] failed', msg, e);
    return NextResponse.json({ error: 'INTERNAL', message: msg }, { status: 500 });
  }
}
