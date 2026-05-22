import { NextRequest, NextResponse } from 'next/server';
import { getSessionAvailability } from '@/lib/inventory';

// Renamed dynamic segment is [date] for legacy reasons but it accepts a sessionId
export async function GET(_req: NextRequest, { params }: { params: { date: string } }) {
  const availability = await getSessionAvailability(params.date);
  if (!availability) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  return NextResponse.json(availability);
}
