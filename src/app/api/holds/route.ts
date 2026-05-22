import { NextRequest, NextResponse } from 'next/server';
import { createHold, InventoryError } from '@/lib/inventory';
import { createHoldSchema } from '@/lib/zodSchemas';

export async function POST(req: NextRequest) {
  const parsed = createHoldSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'INVALID_REQUEST', issues: parsed.error.issues }, { status: 400 });
  try {
    const { hold, amountPence, expiresAt } = await createHold({
      sessionId: parsed.data.sessionId,
      bookingType: parsed.data.bookingType,
      kundNumber: parsed.data.kundNumber,
      positions: parsed.data.positions as ('A'|'B'|'C')[],
      email: parsed.data.email,
      primaryName: parsed.data.primaryName
    });
    return NextResponse.json({ holdId: hold.id, amountPence, expiresAt });
  } catch (e) {
    if (e instanceof InventoryError) return NextResponse.json({ error: e.code, message: e.message }, { status: 409 });
    console.error(e);
    return NextResponse.json({ error: 'INTERNAL' }, { status: 500 });
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
