import { NextRequest, NextResponse } from 'next/server';
import { createHold, InventoryError } from '@/lib/inventory';
import { createHoldSchema } from '@/lib/zodSchemas';

function isSerializationError(e: unknown): boolean {
  const msg = e instanceof Error ? `${e.message} ${(e as any).code ?? ''}` : String(e);
  return /40001|serialization|could not serialize/i.test(msg);
}

export async function POST(req: NextRequest) {
  const parsed = createHoldSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'INVALID_REQUEST', issues: parsed.error.issues }, { status: 400 });

  const attempt = async () => createHold({
    sessionId: parsed.data.sessionId,
    bookingType: parsed.data.bookingType,
    kundNumber: parsed.data.kundNumber,
    positions: parsed.data.positions as ('A'|'B'|'C')[],
    email: parsed.data.email,
    primaryName: parsed.data.primaryName
  });

  try {
    const { hold, amountPence, expiresAt } = await attempt();
    return NextResponse.json({ holdId: hold.id, amountPence, expiresAt });
  } catch (e) {
    // Retry once on Postgres serialization conflict (40001) — covers the race
    // where two concurrent bookings hit the same Kund.
    if (isSerializationError(e)) {
      try {
        await new Promise((r) => setTimeout(r, 120 + Math.random() * 180));
        const { hold, amountPence, expiresAt } = await attempt();
        return NextResponse.json({ holdId: hold.id, amountPence, expiresAt });
      } catch (e2) {
        if (e2 instanceof InventoryError) return NextResponse.json({ error: e2.code, message: e2.message }, { status: 409 });
        const msg = e2 instanceof Error ? `${e2.name}: ${e2.message}` : String(e2);
        console.error('[holds] INTERNAL after retry', msg, e2);
        return NextResponse.json({ error: 'BUSY', message: 'Just missed it — many people are booking right now. Please pick again.' }, { status: 503 });
      }
    }
    if (e instanceof InventoryError) return NextResponse.json({ error: e.code, message: e.message }, { status: 409 });
    const msg = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
    console.error('[holds] INTERNAL', msg, e);
    return NextResponse.json({ error: 'INTERNAL', message: msg }, { status: 500 });
  }
}

// DELETE /api/holds  → user cancels checkout
export async function DELETE(req: NextRequest) {
  const { holdId } = await req.json();
  if (!holdId) return NextResponse.json({ error: 'MISSING_HOLD' }, { status: 400 });
  const { cancelHold } = await import('@/lib/inventory');
  await cancelHold(holdId);
  return NextResponse.json({ ok: true });
}
