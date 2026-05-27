import { NextRequest, NextResponse } from 'next/server';
import { donationCheckoutSchema } from '@/lib/zodSchemas';
import { createPendingDonation, DonationError } from '@/lib/donations';
import { isProviderEnabled } from '@/lib/constants';
import { createStripeCheckoutSession } from '@/lib/stripe';
import { createPaypalOrder } from '@/lib/paypal';

export async function POST(req: NextRequest) {
  const parsed = donationCheckoutSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'INVALID', issues: parsed.error.issues }, { status: 400 });
  const data = parsed.data;
  if (!isProviderEnabled(data.provider)) return NextResponse.json({ error: 'PROVIDER_DISABLED' }, { status: 400 });

  try {
    const donation = await createPendingDonation(data as any);
    const site = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
    const desc = donation.type === 'MATERIAL' && donation.materialLabel
      ? `Donation toward: ${donation.materialLabel}`
      : 'Donation to SomaYagna London';

    if (data.provider === 'stripe') {
      // We re-use the existing Stripe helper but encode donationId in metadata via the "holdId" param,
      // prefixed with "donation:" so the webhook can route it correctly.
      const session = await createStripeCheckoutSession({
        holdId: `donation:${donation.id}`,
        amountPence: donation.amountPence,
        email: donation.donorEmail,
        description: desc,
        successUrl: `${site}/donate/${donation.id}?provider=stripe&session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${site}/donate?cancelled=1`
      });
      return NextResponse.json({ url: session.url });
    } else {
      const { approveUrl } = await createPaypalOrder({
        holdId: `donation:${donation.id}`,
        amountPence: donation.amountPence,
        description: desc,
        returnUrl: `${site}/donate/${donation.id}?provider=paypal`,
        cancelUrl: `${site}/donate?cancelled=1`
      });
      return NextResponse.json({ url: approveUrl });
    }
  } catch (e) {
    if (e instanceof DonationError) return NextResponse.json({ error: e.code, message: e.message }, { status: 400 });
    console.error(e);
    return NextResponse.json({ error: 'INTERNAL' }, { status: 500 });
  }
}
