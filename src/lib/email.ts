/**
 * Resend integration with a console fallback for local dev.
 *
 * The email includes the exact fields the brief requires:
 *   Date, Time, Yagna Type, Kund Number, Position Allocation.
 */
import { EVENT, formatDateLong, formatGBP, formatTime } from './constants';

interface ConfirmEmailInput {
  to: string;
  primaryName: string;
  reference: string;
  date: Date;
  startTime: string;
  yagnaType: string;
  kundNumber: number;
  positions: string[];
  bookingType: 'SINGLE_POSITION' | 'FULL_KUND';
  amountPence: number;
  donationPence?: number;
}

export async function sendConfirmationEmail(i: ConfirmEmailInput): Promise<void> {
  const subject = `Your ${EVENT.name} reservation — ${i.reference}`;
  const html = renderHtml(i);
  const text = renderText(i);

  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.log('\n────── EMAIL (dev mode — no RESEND_API_KEY) ──────');
    console.log('To:', i.to);
    console.log('Subject:', subject);
    console.log(text);
    console.log('──────────────────────────────────────────────────\n');
    return;
  }

  const from = process.env.EMAIL_FROM ?? `${EVENT.name} <no-reply@${(process.env.NEXT_PUBLIC_SITE_URL ?? 'somayagnalondon.org').replace(/^https?:\/\//, '')}>`;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: [i.to],
      subject,
      html,
      text,
      reply_to: EVENT.contactEmail
    })
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error(`[email] Resend failed ${res.status} for booking ${i.reference} -> ${i.to}; from="${from}"; body=${body}`);
    return;
  }
  const json = await res.json().catch(() => null) as { id?: string } | null;
  console.log(`[email] sent confirmation for ${i.reference} to ${i.to} (resend id=${json?.id ?? 'unknown'})`);
}

function renderHtml(i: ConfirmEmailInput) {
  const positions = i.positions.join(', ');
  const typeLabel = i.bookingType === 'FULL_KUND' ? 'Full Kund (positions A, B & C)' : `Single Position (${positions})`;
  return `<!doctype html>
<html><body style="margin:0;background:#FBF5E7;font-family:Georgia,serif;color:#400F0F;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#FBF5E7;padding:32px 0;">
<tr><td align="center">
  <table width="560" cellpadding="0" cellspacing="0" style="background:#FFFCF6;border-radius:12px;overflow:hidden;border:1px solid #EFD68C;">
    <tr><td style="background:linear-gradient(180deg,#8B2727,#561414);color:#F8EBC4;padding:28px 32px;text-align:center;">
      <div style="font-size:14px;letter-spacing:.3em;text-transform:uppercase;opacity:.85;">SomaYagna London</div>
      <div style="font-size:24px;margin-top:8px;">Your seat is reserved</div>
    </td></tr>
    <tr><td style="padding:28px 32px 8px 32px;font-size:16px;line-height:1.55;">
      Namaste ${escapeHtml(i.primaryName)},<br><br>
      Thank you for joining us. Your booking has been confirmed. Please find your details below.
    </td></tr>
    <tr><td style="padding:8px 32px;">
      <table width="100%" cellpadding="6" cellspacing="0" style="border-collapse:collapse;font-size:15px;">
        <tr><td style="color:#7A380D;width:40%;">Reference</td><td><strong>${i.reference}</strong></td></tr>
        <tr><td style="color:#7A380D;">Yagna</td><td>${escapeHtml(i.yagnaType)}</td></tr>
        <tr><td style="color:#7A380D;">Date</td><td>${formatDateLong(i.date)}</td></tr>
        <tr><td style="color:#7A380D;">Time</td><td>${formatTime(i.startTime)}</td></tr>
        <tr><td style="color:#7A380D;">Kund</td><td>Kund ${i.kundNumber}</td></tr>
        <tr><td style="color:#7A380D;">Position</td><td>${typeLabel}</td></tr>
        <tr><td style="color:#7A380D;">Seva amount</td><td>${formatGBP(i.amountPence)}</td></tr>
        ${i.donationPence && i.donationPence > 0 ? `<tr><td style="color:#7A380D;">Donation</td><td>${formatGBP(i.donationPence)} <span style="color:#7A5712;font-size:12px;">(to Unity in Divinity charity)</span></td></tr>
        <tr><td style="color:#7A380D;font-weight:bold;">Total paid</td><td style="font-weight:bold;">${formatGBP(i.amountPence + i.donationPence)}</td></tr>` : ''}
        <tr><td style="color:#7A380D;">Venue</td><td>${escapeHtml(EVENT.venueName)}, ${escapeHtml(EVENT.venueAddress)}</td></tr>
      </table>
    </td></tr>
    <tr><td style="padding:24px 32px 32px 32px;font-size:14px;line-height:1.55;color:#561414;">
      Please arrive 20 minutes before your session and bring this email (printed or on your phone).
      Modest, comfortable clothing is recommended. If you need to update your booking, contact
      <a href="mailto:${EVENT.contactEmail}" style="color:#8B2727;">${EVENT.contactEmail}</a>.
      <br><br>
      With devotion,<br>The ${escapeHtml(EVENT.organizer)} team
    </td></tr>
  </table>
</td></tr></table>
</body></html>`;
}

function renderText(i: ConfirmEmailInput) {
  const positions = i.positions.join(', ');
  const typeLabel = i.bookingType === 'FULL_KUND' ? 'Full Kund (positions A, B & C)' : `Single Position (${positions})`;
  const donationLines = i.donationPence && i.donationPence > 0
    ? `\nDonation:      ${formatGBP(i.donationPence)} (to Unity in Divinity charity)\nTotal paid:    ${formatGBP(i.amountPence + i.donationPence)}\n`
    : '';
  return `Namaste ${i.primaryName},

Your booking for ${EVENT.name} is confirmed.

Reference:     ${i.reference}
Yagna:         ${i.yagnaType}
Date:          ${formatDateLong(i.date)}
Time:          ${formatTime(i.startTime)}
Kund:          Kund ${i.kundNumber}
Position:      ${typeLabel}
Seva amount:   ${formatGBP(i.amountPence)}${donationLines}
Venue:         ${EVENT.venueName}, ${EVENT.venueAddress}

Please arrive 20 minutes before your session and bring this email
(printed or on your phone). Modest, comfortable clothing is recommended.

If you need to update your booking, reply to this email or contact us at
${EVENT.contactEmail}.

With devotion,
The ${EVENT.organizer} team
`;
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}
