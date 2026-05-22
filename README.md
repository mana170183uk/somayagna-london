# SomaYagna London — Booking Microsite

A premium, devotional landing page and booking platform for the 8-day SomaYagna programme in London (14 – 21 June). Built with **Next.js 14 (App Router) · TypeScript · Tailwind · Prisma · Neon Postgres · Stripe + PayPal · Resend**, ready to deploy on **Vercel**.

> **What you get out of the box**
>
> * A cinematic landing page (12 sections) in a saffron / maroon / gold / ivory palette
> * A 6-step visual booking wizard with a live 11-Kund grid (A/B/C positions)
> * Real-time availability with 10-minute hold expiry enforced server-side
> * Atomic full-Kund reservation (£501) only when all three positions are free
> * Stripe + PayPal + a "mock" demo provider for local testing without keys
> * Confirmation email (Resend) with Date / Time / Yagna / Kund / Position
> * Organiser dashboard: per-day, per-session, per-Kund grid with manual add, edit, cancel, CSV export, payment status, audit log
> * 18 passing unit tests over the inventory state machine

---

## 1 · Quickstart (local)

```bash
git clone <your-repo> somayagna-london
cd somayagna-london
cp .env.example .env       # then fill in DATABASE_URL etc.
npm install
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

Open **http://localhost:3000**.

* Booking flow: `http://localhost:3000/book`
* Organiser dashboard: `http://localhost:3000/admin/login`
  (default credentials are whatever you put in `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `.env`)

### Try the booking end-to-end without payment keys

Keep `ENABLED_PAYMENT_PROVIDERS="mock"` in `.env`. On the payment step the wizard will show a "Demo mode" button that confirms the booking immediately and emails you (printed to the dev console if `RESEND_API_KEY` is empty).

---

## 2 · Setting up Neon

1. Create a Neon project at https://console.neon.tech
2. Copy the **Pooled** connection string (Vercel-ready) — set it as `DATABASE_URL`.
3. Optionally also set `DIRECT_URL` to the **non-pooled** connection string for migrations.
4. `npx prisma migrate deploy` (production) or `npx prisma migrate dev` (local).
5. `npm run db:seed` to populate the eight event days, three sessions per day, 11 Kunds, and 33 positions per session.

The seed script is idempotent — re-running won't duplicate.

---

## 3 · Deploying to Vercel

```bash
vercel link
vercel env add DATABASE_URL          # paste your Neon pooled URL
vercel env add DIRECT_URL            # paste your Neon direct URL
vercel env add NEXT_PUBLIC_SITE_URL  # https://your-domain.vercel.app
# ... and the rest of .env.example
vercel --prod
```

Add a **post-deploy** step in Vercel's build settings:

```
prisma generate && prisma migrate deploy
```

(The `npm run build` script already runs `prisma generate`.)

---

## 4 · Payments

Both providers are scaffolded. You can ship with one, both, or neither (using the mock for demos).

### Stripe

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
ENABLED_PAYMENT_PROVIDERS="stripe"
NEXT_PUBLIC_STRIPE_ENABLED="true"
```

Configure the webhook endpoint in the Stripe Dashboard:

```
https://<your-domain>/api/webhooks/stripe
Events:
  checkout.session.completed
  checkout.session.expired
  payment_intent.payment_failed
```

For local testing: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`

### PayPal

```env
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
PAYPAL_MODE=sandbox          # or "live"
PAYPAL_WEBHOOK_ID=...
ENABLED_PAYMENT_PROVIDERS="stripe,paypal"
NEXT_PUBLIC_PAYPAL_ENABLED="true"
```

Configure the webhook in PayPal Developer:

```
https://<your-domain>/api/webhooks/paypal
Events:
  CHECKOUT.ORDER.APPROVED
  PAYMENT.CAPTURE.COMPLETED
  PAYMENT.CAPTURE.DENIED
  CHECKOUT.ORDER.VOIDED
```

> Production-grade webhook signature verification using `/v1/notifications/verify-webhook-signature` and `PAYPAL_WEBHOOK_ID` is wired in the route but kept commented behind a TODO — enable it before going live.

### Mock mode (default for local)

`ENABLED_PAYMENT_PROVIDERS="mock"` enables an instant local-only confirmation button — useful for demos and developer onboarding.

---

## 5 · How the booking inventory works

The whole system is built around **`KundPosition`** — one row per seat. A position is **FREE** when both `bookingId` and `holdId` are NULL; **HELD** when `holdId` is set; **BOOKED** when `bookingId` is set.

Every state change runs inside a **Postgres SERIALIZABLE transaction** so two concurrent users cannot claim the same seat. Specifically:

| Action                       | Atomic guarantee                                                                                          |
| ---------------------------- | --------------------------------------------------------------------------------------------------------- |
| `createHold` (single)        | `UPDATE … WHERE bookingId IS NULL AND holdId IS NULL` — if `updateMany.count !== 1`, the transaction throws. |
| `createHold` (full Kund)     | Three positions updated in one statement; if any was just taken, rollback fires `FULL_KUND_UNAVAILABLE`.  |
| `confirmBookingFromHold`     | Idempotent — a duplicate webhook returns the existing booking instead of double-charging.                 |
| Hold expiry                  | `sweepExpiredHolds()` runs before every read and every new hold; expired holds release their positions.   |
| Cancellation                 | Releases positions, sets booking status, writes an `AuditLog` row.                                        |

All 18 invariants are unit-tested in `src/tests/inventory.test.ts` — run `npm test`.

---

## 6 · The brief, mapped to code

| Requirement                                      | Where                                              |
| ------------------------------------------------ | -------------------------------------------------- |
| 14 June welcome (no booking)                     | Seeded with `isActive: false`; date grid disables it. |
| 15 June labelled "Purshotam Yagna"               | `EventDay.title` + landing-page section.           |
| 16 – 21 June labelled "Vishnu Gopal Yagna"       | Seed + section + timeline.                          |
| 3 sessions × 10:15 / 14:15 / 16:15               | `constants.SESSIONS` + seed + DailySchedule.        |
| 11 Kunds × A/B/C                                 | Seed + `KundGrid` UI.                               |
| Single £201 / Full Kund £501                     | `PRICE_SINGLE_PENCE`, `PRICE_FULL_KUND_PENCE`.     |
| 10-min hold                                      | `HOLD_MINUTES` + `HOLD_MS`.                         |
| Registration fields                              | `registrationSchema` (Zod) + form.                  |
| GBP via Stripe                                   | `/api/checkout/stripe` + webhook.                   |
| Server-enforced inventory                        | `src/lib/inventory.ts` + Prisma constraints.        |
| Admin dashboard                                  | `/admin` + session detail + manual CRUD + CSV.      |
| Confirmation email                               | `src/lib/email.ts` (Resend) with brief's fields.    |
| Audit log on admin changes                       | `AuditLog` model + writes in inventory + admin.     |

---

## 7 · Folder tour

```
prisma/
  schema.prisma            # Postgres schema
  seed.ts                  # 14–21 June, 11 kunds × 3 positions per session
src/
  app/
    page.tsx               # Landing page (12 sections, all in one)
    book/                  # Booking wizard
    confirmation/          # Booking confirmation + pending interstitial
    admin/                 # Login + dashboard + session detail
    api/                   # Sessions, holds, checkout, webhooks, admin, mock-pay, CSV
  components/
    landing/StickyCTA.tsx
    booking/BookingWizard.tsx
    admin/AdminSessionPanel.tsx
    ui/Ornaments.tsx       # Mandala, Diya, OmGlyph, LotusBorder SVGs
  lib/
    prisma.ts              # Prisma singleton
    constants.ts           # Prices, palette, event config
    inventory.ts           # The atomic booking engine
    stripe.ts              # Stripe Checkout helper
    paypal.ts              # PayPal Orders v2 (no SDK)
    email.ts               # Resend (or console fallback)
    auth.ts                # Cookie-session admin auth (scrypt)
    zodSchemas.ts          # Request validation
  tests/inventory.test.ts  # 18 tests — the invariants
```

---

## 8 · Assumptions

These are **environment-configurable** so you can change them without code edits:

| Setting             | Default                          | How to change                       |
| ------------------- | -------------------------------- | ----------------------------------- |
| Event year          | `2026`                           | `EVENT_YEAR` in `.env`              |
| Venue name          | "Venue to be announced"          | `EVENT_VENUE_NAME`                  |
| Venue address       | "London, United Kingdom"         | `EVENT_VENUE_ADDRESS`               |
| Contact email/phone | placeholders                     | `EVENT_CONTACT_EMAIL` / `_PHONE`    |
| Organising charity  | "Unity in Divinity"              | `EVENT_ORGANIZER`                   |

The hero and confirmation pages read these at request time, so updating `.env` and redeploying is enough — no code change.

---

## 9 · Accessibility

* Mobile-first; all sections responsive down to ~360 px.
* Colour contrast meets WCAG AA for body text (verified palette).
* All buttons & form fields are keyboard-reachable with visible `focus-visible` rings.
* The booking grid uses descriptive `aria-label`s per position ("Kund 4 position B free").
* `prefers-reduced-motion` disables the slow mandala rotation and flame flicker.
* Form errors are announced via `role="alert"`.

---

## 10 · Content & tone

All copy is intentionally dignified, welcoming, and grounded in well-attested Vedic terminology — drawing on Britannica's article on yajña, Britannica's overview of Vedic religion, and the SomaYagna programme description from somayagna.com. The site:

* presents the rite respectfully without making theological claims about outcomes,
* uses "seva" (devotional offering) consistently for the booking action,
* names "Yagnacharya" and "Ritviks" only in context,
* frames Kunds as sacred fire altars (as the brief specifies),
* and lists £501 explicitly as "a discounted package" matching the source document.

---

## 11 · Tests

```bash
npm test
```

Runs 18 Vitest tests covering: pricing, capacity (33/session), hold/release/confirm, expiry at 10 minutes, atomic full-Kund reservation, double-booking rejection, mixed booking exhaustion to zero.

---

## 12 · Licence & credits

Built for the SomaYagna London programme. The site templates and code in this repository are released for use by **Unity in Divinity (UK registered charity)** and partner organisations.
