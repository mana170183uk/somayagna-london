import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { enquirySchema } from '@/lib/zodSchemas';
import { clientIp, userAgent } from '@/lib/audit';
import { EVENT } from '@/lib/constants';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SUBJECT_LABELS: Record<string, string> = {
  SLOT_BOOKING:    'Slot booking enquiry',
  DONATION:        'Donation enquiry',
  SEVA:            'Seva enquiry',
  CHANGE_BOOKING:  'Change to an existing booking',
  OTHER:           'Other enquiry'
};

export async function POST(req: NextRequest) {
  const parsed = enquirySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'INVALID', message: parsed.error.issues.map((i) => i.message).join(' ') },
      { status: 400 }
    );
  }
  const d = parsed.data;

  const enquiry = await prisma.enquiry.create({
    data: {
      name: d.name,
      email: d.email,
      phone: d.phone || null,
      bookingReference: d.bookingReference || null,
      subject: d.subject,
      message: d.message,
      ipAddress: clientIp(req),
      userAgent: userAgent(req)
    }
  });

  // Notify admin via Resend (best-effort; failure to send shouldn't lose the enquiry)
  await sendAdminNotification(enquiry.id, d).catch((e) =>
    console.error('[enquiry] admin email failed', enquiry.id, e)
  );

  return NextResponse.json({ ok: true, enquiryId: enquiry.id });
}

async function sendAdminNotification(
  id: string,
  d: { name: string; email: string; phone?: string | null; bookingReference?: string | null; subject: string; message: string }
) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.log('\n────── ENQUIRY (dev mode — no RESEND_API_KEY) ──────');
    console.log('id:', id);
    console.log('from:', d.name, '<' + d.email + '>');
    console.log('subject:', d.subject);
    console.log('message:', d.message);
    console.log('───────────────────────────────────────────────────\n');
    return;
  }
  const from = process.env.EMAIL_FROM ?? `${EVENT.name} <no-reply@${(process.env.NEXT_PUBLIC_SITE_URL ?? 'somayagnalondon.org').replace(/^https?:\/\//, '')}>`;
  const subjectLabel = SUBJECT_LABELS[d.subject] ?? d.subject;
  const html = `<!doctype html>
<html><head><meta charset="utf-8"><meta name="color-scheme" content="light only"></head>
<body style="margin:0;background:#FBF5E7;font-family:Georgia,serif;color:#400F0F;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0;background:#FBF5E7;">
<tr><td align="center">
  <table width="560" cellpadding="0" cellspacing="0" style="background:#FFFCF6;border-radius:12px;overflow:hidden;border:1px solid #EFD68C;">
    <tr><td style="background:#8B2727;color:#FFFFFF;padding:20px 24px;">
      <div style="font-size:12px;letter-spacing:.3em;text-transform:uppercase;color:#FFE08A;">SomaYagna London · New enquiry</div>
      <div style="font-size:20px;margin-top:6px;color:#FFFFFF;font-weight:bold;">${escapeHtml(subjectLabel)}</div>
    </td></tr>
    <tr><td style="padding:20px 24px;font-size:15px;line-height:1.55;">
      <table width="100%" cellpadding="6" cellspacing="0" style="border-collapse:collapse;font-size:14px;">
        <tr><td style="color:#7A380D;width:35%;">Name</td><td>${escapeHtml(d.name)}</td></tr>
        <tr><td style="color:#7A380D;">Email</td><td><a href="mailto:${escapeHtml(d.email)}" style="color:#8B2727;">${escapeHtml(d.email)}</a></td></tr>
        ${d.phone ? `<tr><td style="color:#7A380D;">Phone</td><td>${escapeHtml(d.phone)}</td></tr>` : ''}
        ${d.bookingReference ? `<tr><td style="color:#7A380D;">Booking ref</td><td><strong>${escapeHtml(d.bookingReference)}</strong></td></tr>` : ''}
      </table>
      <div style="margin-top:14px;padding:12px 14px;background:#FBF5E7;border-radius:8px;border:1px solid #EFD68C;">
        <div style="font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:#7A380D;margin-bottom:6px;">Message</div>
        <div style="white-space:pre-wrap;color:#400F0F;">${escapeHtml(d.message)}</div>
      </div>
    </td></tr>
    <tr><td style="padding:14px 24px 22px 24px;font-size:12px;color:#7A380D;border-top:1px solid #EFD68C;">
      Reply to the email above to contact the enquirer directly. Manage this enquiry in the admin dashboard.
    </td></tr>
  </table>
</td></tr></table>
</body></html>`;

  const text = `New enquiry — ${subjectLabel}

From: ${d.name} <${d.email}>
${d.phone ? `Phone: ${d.phone}\n` : ''}${d.bookingReference ? `Booking ref: ${d.bookingReference}\n` : ''}
Message:
${d.message}
`;

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: [EVENT.contactEmail],
      subject: `[Enquiry] ${subjectLabel} — ${d.name}`,
      html,
      text,
      reply_to: d.email
    })
  });
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}
