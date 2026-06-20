/**
 * Bulk-block every position in every session of a given yagna type on one or
 * more event days. Used for "the temple will allocate places in person on the
 * day" situations where the entire session should be off-limits to online
 * booking.
 *
 * Refuses to touch positions that already have a bookingId or active holdId
 * — those are real reservations and must be cancelled first.
 *
 * Modes:
 *   { confirm: false } → preview: returns counts (eligible / already-booked / etc.) without writing
 *   { confirm: true  } → actually blocks. Writes one AuditLog row per session block batch.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAdminFromCookies } from '@/lib/auth';
import { clientIp, userAgent } from '@/lib/audit';

const bodySchema = z.object({
  dates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).min(1).max(31),
  yagnaType: z.enum(['VISHNU_GOPAL', 'PITRU', 'PURSHOTAM']),
  name: z.string().trim().min(1).max(200),
  confirm: z.boolean().optional()
});

export async function POST(req: NextRequest) {
  const admin = await getAdminFromCookies();
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'INVALID', issues: parsed.error.issues }, { status: 400 });
  }
  const { dates, yagnaType, name, confirm } = parsed.data;
  const utcDates = dates.map((d) => new Date(`${d}T00:00:00.000Z`));

  // Resolve every matching session ID + count its positions.
  const sessions = await prisma.session.findMany({
    where: {
      yagnaInstance: {
        yagnaType,
        eventDay: { date: { in: utcDates } }
      }
    },
    select: {
      id: true,
      label: true,
      startTime: true,
      yagnaInstance: {
        select: {
          title: true,
          eventDay: { select: { date: true } }
        }
      },
      kunds: {
        select: {
          number: true,
          positions: {
            select: { id: true, label: true, bookingId: true, holdId: true, blocked: true }
          }
        }
      }
    }
  });

  // Flatten + classify
  type PositionInfo = { id: string; sessionId: string; sessionLabel: string; sessionDate: string; sessionTime: string; kund: number; label: string };
  const eligible: PositionInfo[] = [];
  const alreadyBooked: PositionInfo[] = [];
  const onHold: PositionInfo[] = [];
  const alreadyBlocked: PositionInfo[] = [];

  for (const s of sessions) {
    const dateIso = s.yagnaInstance.eventDay.date.toISOString().slice(0, 10);
    for (const k of s.kunds) {
      for (const p of k.positions) {
        const info: PositionInfo = {
          id: p.id, sessionId: s.id, sessionLabel: s.label, sessionDate: dateIso,
          sessionTime: s.startTime, kund: k.number, label: p.label
        };
        if (p.bookingId) alreadyBooked.push(info);
        else if (p.holdId) onHold.push(info);
        else if (p.blocked) alreadyBlocked.push(info);
        else eligible.push(info);
      }
    }
  }

  if (!confirm) {
    return NextResponse.json({
      mode: 'preview',
      sessionsFound: sessions.length,
      counts: {
        eligibleToBlock: eligible.length,
        alreadyBooked: alreadyBooked.length,
        onHold: onHold.length,
        alreadyBlocked: alreadyBlocked.length
      },
      conflictsToCancelFirst: alreadyBooked.slice(0, 20).map((c) => `${c.sessionDate} ${c.sessionTime} — Kund ${c.kund}/${c.label}`)
    });
  }

  if (eligible.length === 0) {
    return NextResponse.json({
      mode: 'noop',
      message: 'Nothing to block — every position in scope is either booked, held, or already blocked.',
      counts: {
        eligibleToBlock: 0,
        alreadyBooked: alreadyBooked.length,
        onHold: onHold.length,
        alreadyBlocked: alreadyBlocked.length
      }
    });
  }

  // Single updateMany — atomic, fast, and the `where` clause guards against a
  // race (someone booking in the window between our preview and write).
  const result = await prisma.kundPosition.updateMany({
    where: {
      id: { in: eligible.map((e) => e.id) },
      bookingId: null,
      holdId: null,
      blocked: false
    },
    data: {
      blocked: true,
      blockReason: name,
      blockedAt: new Date(),
      blockedBy: admin.email
    }
  });

  await prisma.auditLog.create({
    data: {
      actor: admin.email,
      action: 'BULK_BLOCK_SESSIONS',
      target: null,
      ipAddress: clientIp(req),
      userAgent: userAgent(req),
      meta: {
        dates,
        yagnaType,
        name,
        sessionsFound: sessions.length,
        blocked: result.count,
        alreadyBookedCount: alreadyBooked.length,
        onHoldCount: onHold.length,
        alreadyBlockedCount: alreadyBlocked.length
      }
    }
  });

  return NextResponse.json({
    mode: 'applied',
    sessionsFound: sessions.length,
    blocked: result.count,
    skipped: {
      alreadyBooked: alreadyBooked.length,
      onHold: onHold.length,
      alreadyBlocked: alreadyBlocked.length
    }
  });
}
