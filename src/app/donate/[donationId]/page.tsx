import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { EVENT, formatGBP } from '@/lib/constants';
import { Mandala, Diya, OmGlyph } from '@/components/ui/Ornaments';

export const dynamic = 'force-dynamic';

export default async function DonationConfirmation({ params }: { params: { donationId: string } }) {
  const d = await prisma.donation.findUnique({ where: { id: params.donationId } });
  if (!d) notFound();

  const giftAidPence = d.giftAid ? Math.round(d.amountPence * 0.25) : 0;
  const charityReceives = d.amountPence + giftAidPence;

  return (
    <div className="min-h-screen bg-gradient-to-b from-maroon-800 to-maroon-900 text-ivory-50 relative overflow-hidden">
      <Mandala className="absolute -top-40 -right-40 w-[640px] text-gold-400 opacity-25 animate-slow-spin" />
      <Mandala className="absolute -bottom-32 -left-32 w-[480px] text-gold-300 opacity-20 animate-slow-spin" />

      <header className="relative container-tight py-6">
        <Link href="/" className="inline-flex items-center gap-2 text-ivory-100 hover:text-gold-200 transition">
          <OmGlyph className="w-5 h-5" />
          <span className="h-display text-xl">SomaYagna London</span>
        </Link>
      </header>

      <main className="relative container-tight pb-16">
        <div className="max-w-2xl mx-auto bg-ivory-50 text-maroon-900 rounded-3xl shadow-altar overflow-hidden">
          <div className="bg-gradient-to-b from-saffron-500 to-maroon-700 text-ivory-50 px-8 py-10 text-center">
            <Diya className="mx-auto w-16 text-saffron-800" />
            <div className="text-xs tracking-[0.4em] uppercase text-gold-200 mt-4">With deep gratitude</div>
            <h1 className="h-display text-4xl md:text-5xl mt-2">Your gift has been received</h1>
            <p className="text-gold-100/90 mt-2">Reference {d.reference}</p>
          </div>

          <div className="p-8 md:p-10 space-y-4">
            <Row k="From" v={d.anonymous ? 'Anonymous donor' : d.donorName} />
            {d.type === 'MATERIAL' && d.materialLabel && <Row k="Dedicated to" v={d.materialLabel} />}
            <Row k="Amount" v={formatGBP(d.amountPence)} />
            {d.giftAid && (
              <>
                <Row k="Gift Aid (HMRC)" v={`+ ${formatGBP(giftAidPence)}`} />
                <Row k="Total to charity" v={formatGBP(charityReceives)} highlight />
              </>
            )}
            {d.message && (
              <div className="pt-3">
                <div className="text-xs uppercase tracking-widest text-maroon-700/70">Your message</div>
                <p className="mt-1 italic text-maroon-800">“{d.message}”</p>
              </div>
            )}

            <hr className="border-gold-200 my-4" />
            <p className="text-sm text-maroon-900/75 leading-relaxed">
              A receipt is on its way to <strong>{d.donorEmail}</strong>. Unity in Divinity holds your gift in trust and will use it for the rituals, the priests, and the community gathered around the yagna.
              {d.giftAid && ' We will claim Gift Aid on your behalf from HMRC.'}
            </p>
            <div className="flex gap-3 pt-2">
              <Link href="/donate" className="btn-secondary">Give again</Link>
              <Link href="/" className="btn-ghost">Return home</Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function Row({ k, v, highlight }: { k: string; v: string; highlight?: boolean }) {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-1 border-b border-gold-100 pb-3">
      <dt className="text-xs uppercase tracking-widest text-maroon-700/70">{k}</dt>
      <dd className={`h-display text-xl ${highlight ? 'text-saffron-700' : 'text-maroon-900'}`}>{v}</dd>
    </div>
  );
}
