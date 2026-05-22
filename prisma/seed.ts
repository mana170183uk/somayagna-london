/**
 * Seeds the full event:
 *   14 Jun → WELCOME (info only, no booking)
 *   15 Jun → PURSHOTAM (3 sessions × 11 kunds × 3 positions)
 *   16–21 Jun → VISHNU_GOPAL (same shape)
 *
 * Also seeds a single admin user from ADMIN_EMAIL / ADMIN_PASSWORD env vars.
 *
 * Idempotent: re-running won't duplicate.
 */
import { PrismaClient, YagnaType } from '@prisma/client';
import { hashPassword } from '../src/lib/passwords';

const prisma = new PrismaClient();

const EVENT_YEAR = Number(process.env.EVENT_YEAR ?? '2026');

const SESSIONS = [
  { startTime: '10:15', label: 'Morning Session' },
  { startTime: '14:15', label: 'Afternoon Session I' },
  { startTime: '16:15', label: 'Afternoon Session II' }
];

const KUND_COUNT = 11;
const POSITION_LABELS = ['A', 'B', 'C'] as const;

interface DaySpec {
  date: Date;
  yagnaType: YagnaType;
  title: string;
  description: string;
  isActive: boolean;
}

function dayUTC(year: number, monthIndex: number, day: number) {
  return new Date(Date.UTC(year, monthIndex, day, 0, 0, 0, 0));
}

const DAYS: DaySpec[] = [
  {
    date: dayUTC(EVENT_YEAR, 5, 14),
    yagnaType: 'WELCOME',
    title: 'Programme Welcome & Inauguration',
    description: 'Opening ceremony and introduction. No booking required — all are welcome to attend.',
    isActive: false
  },
  {
    date: dayUTC(EVENT_YEAR, 5, 15),
    yagnaType: 'PURSHOTAM',
    title: 'Purshotam Yagna',
    description: 'The opening sacred fire ritual honouring the Supreme Being (Purushottama). Active booking begins today.',
    isActive: true
  },
  ...[16, 17, 18, 19, 20, 21].map<DaySpec>((d) => ({
    date: dayUTC(EVENT_YEAR, 5, d),
    yagnaType: 'VISHNU_GOPAL',
    title: 'Vishnu Gopal Yagna',
    description: 'Daily Vishnu Gopal Yagna invoking the grace of Lord Vishnu in his Gopal form.',
    isActive: true
  }))
];

async function seedDays() {
  for (const day of DAYS) {
    const eventDay = await prisma.eventDay.upsert({
      where: { date: day.date },
      update: { yagnaType: day.yagnaType, title: day.title, description: day.description, isActive: day.isActive },
      create: { date: day.date, yagnaType: day.yagnaType, title: day.title, description: day.description, isActive: day.isActive }
    });

    if (!day.isActive) continue; // 14 June has no sessions

    for (const s of SESSIONS) {
      const session = await prisma.session.upsert({
        where: { eventDayId_startTime: { eventDayId: eventDay.id, startTime: s.startTime } },
        update: { label: s.label },
        create: { eventDayId: eventDay.id, startTime: s.startTime, label: s.label }
      });

      for (let n = 1; n <= KUND_COUNT; n++) {
        const kund = await prisma.kund.upsert({
          where: { sessionId_number: { sessionId: session.id, number: n } },
          update: {},
          create: { sessionId: session.id, number: n }
        });

        for (const label of POSITION_LABELS) {
          await prisma.kundPosition.upsert({
            where: { kundId_label: { kundId: kund.id, label } },
            update: {},
            create: { kundId: kund.id, label }
          });
        }
      }
    }
    console.log(`✓ Seeded ${day.title} — ${day.date.toISOString().slice(0, 10)}`);
  }
}

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.warn('⚠ ADMIN_EMAIL / ADMIN_PASSWORD not set — skipping admin user creation.');
    return;
  }
  const passwordHash = hashPassword(password);
  await prisma.adminUser.upsert({
    where: { email },
    update: { passwordHash },
    create: { email, passwordHash, name: 'Organizer' }
  });
  console.log(`✓ Admin user ready: ${email}`);
}

async function main() {
  console.log(`\nSeeding SomaYagna London ${EVENT_YEAR}…\n`);
  await seedDays();
  await seedAdmin();
  const totalPositions = await prisma.kundPosition.count();
  const expected = 7 /* active days */ * 3 /* sessions */ * 11 /* kunds */ * 3 /* positions */;
  console.log(`\nTotal positions: ${totalPositions} (expected ${expected})\n`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
