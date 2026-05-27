import { NextRequest, NextResponse } from 'next/server';
import { donationCheckoutSchema } from '@/lib/zodSchemas';
import { createPendingDonation, completeDonation, DonationError } from '@/lib/donations';
import { isProviderEnabled } from '@/lib/constants';

export async function POST(req: NextRequest) {
  if (!isProviderEnabled('mock')) return NextResponse.json({ error: 'MOCK_DISABLED' }, { status: 400 });
  const parsed = donationCheckoutSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'INVALID', issues: parsed.error.issues }, { status: 400 });
  try {
    const d = await createPendingDonation(parsed.data as any);
    const completed = await completeDonation({ donationId: d.id, provider: 'MOCK', providerRef: `mock_${Date.now()}` });
    return NextResponse.json({ donationId: completed.id, reference: completed.reference });
  } catch (e) {
    if (e instanceof DonationError) return NextResponse.json({ error: e.code, message: e.message }, { status: 400 });
    console.error(e);
    return NextResponse.json({ error: 'INTERNAL' }, { status: 500 });
  }
}
