import { NextRequest, NextResponse } from 'next/server';
import { getSessionAvailability } from '@/lib/inventory';

// Renamed dynamic segment is [date] for legacy reasons but it accepts a sessionId
export async function GET(_req: NextRequest, { params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  try {
    const availability = await getSessionAvailability(date);
    if (!availability) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
    return NextResponse.json(availability);
  } catch (e) {
    const msg = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
    console.error('[sessions] availability failed', msg, e);
    return NextResponse.json({ error: 'INTERNAL', message: msg }, { status: 500 });
  }
}
