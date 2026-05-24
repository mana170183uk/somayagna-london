import Stripe from 'stripe';

let _stripe: Stripe | null = null;
export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set');
  _stripe = new Stripe(key, { apiVersion: '2025-02-24.acacia' });
  return _stripe;
}

interface CreateCheckoutArgs {
  holdId: string;
  amountPence: number;
  donationPence?: number;
  email: string;
  description: string;
  successUrl: string;
  cancelUrl: string;
}

export async function createStripeCheckoutSession(a: CreateCheckoutArgs) {
  const stripe = getStripe();
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [{
    quantity: 1,
    price_data: {
      currency: 'gbp',
      unit_amount: a.amountPence,
      product_data: { name: a.description }
    }
  }];
  if (a.donationPence && a.donationPence > 0) {
    lineItems.push({
      quantity: 1,
      price_data: {
        currency: 'gbp',
        unit_amount: a.donationPence,
        product_data: { name: 'Donation to Unity in Divinity (UK registered charity)' }
      }
    });
  }
  return stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: a.email,
    line_items: lineItems,
    metadata: { holdId: a.holdId, donationPence: String(a.donationPence ?? 0) },
    payment_intent_data: { metadata: { holdId: a.holdId, donationPence: String(a.donationPence ?? 0) } },
    success_url: a.successUrl,
    cancel_url: a.cancelUrl,
    expires_at: Math.floor(Date.now() / 1000) + 30 * 60
  });
}
