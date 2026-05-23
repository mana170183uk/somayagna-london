import { NextRequest, NextResponse } from 'next/server';
import { getSessionAvailability } from '@/lib/inventory';

// Renamed dynamic segment is [date] for legacy reasons but it accepts a sessionId
export async function GET(_req: NextRequest, { params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  const availability = await getSessionAvailability(date);
  if (!availability) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  return NextResponse.json(availability);
}
