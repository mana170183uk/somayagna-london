/**
 * Lightweight PayPal REST helper — no SDK required.
 * Uses Orders v2 (create + capture) which is the standard for Smart Buttons / Checkout.
 */
const SANDBOX = 'https://api-m.sandbox.paypal.com';
const LIVE = 'https://api-m.paypal.com';

function baseUrl() {
  return (process.env.PAYPAL_MODE ?? 'sandbox') === 'live' ? LIVE : SANDBOX;
}

async function accessToken() {
  const id = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!id || !secret) throw new Error('PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET not set');
  const auth = Buffer.from(`${id}:${secret}`).toString('base64');
  const res = await fetch(`${baseUrl()}/v1/oauth2/token`, {
    method: 'POST',
    headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials'
  });
  if (!res.ok) throw new Error(`PayPal token failed: ${res.status}`);
  const json = await res.json() as { access_token: string };
  return json.access_token;
}

export async function createPaypalOrder(args: { holdId: string; amountPence: number; description: string; returnUrl: string; cancelUrl: string }) {
  const token = await accessToken();
  const value = (args.amountPence / 100).toFixed(2);
  const res = await fetch(`${baseUrl()}/v2/checkout/orders`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{
        custom_id: args.holdId,
        description: args.description,
        amount: { currency_code: 'GBP', value }
      }],
      application_context: {
        brand_name: 'SomaYagna London',
        user_action: 'PAY_NOW',
        return_url: args.returnUrl,
        cancel_url: args.cancelUrl
      }
    })
  });
  if (!res.ok) throw new Error(`PayPal order create failed: ${res.status} ${await res.text()}`);
  const json = await res.json() as { id: string; links: Array<{ rel: string; href: string }> };
  const approve = json.links.find((l) => l.rel === 'approve' || l.rel === 'payer-action');
  if (!approve) throw new Error('PayPal returned no approval link');
  return { orderId: json.id, approveUrl: approve.href };
}

export async function capturePaypalOrder(orderId: string) {
  const token = await accessToken();
  const res = await fetch(`${baseUrl()}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error(`PayPal capture failed: ${res.status} ${await res.text()}`);
  return res.json();
}
