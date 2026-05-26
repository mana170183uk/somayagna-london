/**
 * Seeds the SomaYagna London 2026 programme per the SM-commented spec doc.
 *
 *   Sun 14  Purshotam (11K) at 11:00, 13:00
 *             Pitru     (9K)  at 10:15, 11:45, 13:15, 14:45, 16:15, 17:45  + opt 08:30
 *   Mon 15  Purshotam (11K) at 11:00, 13:00                                + opt 09:00, 15:00
 *             Pitru     (9K)  at 10:15, 11:45, 13:15, 14:45, 16:15, 17:45  + opt 08:30
 *   Tue–Fri  Vishnu Gopal (11K) at 10:15, 12:15, 14:15                     + opt 08:30, 16:15
 *             Pitru     (9K)  at 10:15, 11:45, 13:15, 14:45, 16:15, 17:45  + opt 08:30
 *   Sat 20  Vishnu Gopal (11K) at 08:30, 10:15, 12:15, 14:15, 16:15        (all mandatory)
 *             Pitru     (9K)  at 10:15, 11:45, 13:15, 14:45, 16:15, 17:45  + opt 08:30
 *   Sun 21  Vishnu Gopal (11K) at 08:30, 10:15, 12:15  (programme ends ~15:00)
 *             Pitru     (9K)  at 10:15, 11:45, 13:15  (auto-trimmed to sessions ending before 15:00)
 *                                                                          + opt 08:30
 *
 * Optional sessions are seeded with optional=true, enabled=false. Admins flip
 * `enabled` to true via the admin dashboard when demand is confirmed; the
 * public booking page hides disabled sessions.
 *
 * Admin user is NOT seeded — bootstrap via /api/admin/bootstrap once.
 * Idempotent: re-running updates titles/labels but does not duplicate.
 */
import { PrismaClient, YagnaType } from '@prisma/client';

const prisma = new PrismaClient();
const EVENT_YEAR = Number(process.env.EVENT_YEAR ?? '2026');
const POSITION_LABELS = ['A', 'B', 'C'] as const;

interface SessionSpec { startTime: string; label: string; optional?: boolean }
interface YagnaSpec {
  type: YagnaType;
  title: string;
  kundCount: number;
  sessions: SessionSpec[];
}
interface DaySpec {
  date: Date;
  description: string;
  yagnas: YagnaSpec[];
}

function dayUTC(year: number, monthIndex: number, day: number) {
  return new Date(Date.UTC(year, monthIndex, day, 0, 0, 0, 0));
}

// Reused — Pitru's standard daily schedule
const PITRU_FULL: SessionSpec[] = [
  { startTime: '08:30', label: 'Early Morning', optional: true },
  { startTime: '10:15', label: 'Morning' },
  { startTime: '11:45', label: 'Late Morning' },
  { startTime: '13:15', label: 'Early Afternoon' },
  { startTime: '14:45', label: 'Afternoon' },
  { startTime: '16:15', label: 'Late Afternoon' },
  { startTime: '17:45', label: 'Evening' }
];
// Sun 21 ends ~15:00, so drop the late sessions
const PITRU_SUN21: SessionSpec[] = [
  { startTime: '08:30', label: 'Early Morning', optional: true },
  { startTime: '10:15', label: 'Morning' },
  { startTime: '11:45', label: 'Late Morning' },
  { startTime: '13:15', label: 'Early Afternoon' }
];

const DAYS: DaySpec[] = [
  // Sun 14 June — Purshotam + Pitru (no Vishnu Gopal yet)
  {
    date: dayUTC(EVENT_YEAR, 5, 14),
    description: 'Programme welcome. Purshotam Yagna at two sittings and Pitru Yagna throughout the day.',
    yagnas: [
      {
        type: 'PURSHOTAM', title: 'Purshotam Yagna', kundCount: 11,
        sessions: [
          { startTime: '11:00', label: 'Morning' },
          { startTime: '13:00', label: 'Afternoon' }
        ]
      },
      { type: 'PITRU', title: 'Pitru Yagna', kundCount: 9, sessions: PITRU_FULL }
    ]
  },
  // Mon 15 June — Purshotam + Pitru, with optional Purshotam sittings
  {
    date: dayUTC(EVENT_YEAR, 5, 15),
    description: 'Purshotam Yagna continues with optional early/late sittings. Pitru Yagna runs throughout the day.',
    yagnas: [
      {
        type: 'PURSHOTAM', title: 'Purshotam Yagna', kundCount: 11,
        sessions: [
          { startTime: '09:00', label: 'Early Morning', optional: true },
          { startTime: '11:00', label: 'Morning' },
          { startTime: '13:00', label: 'Afternoon' },
          { startTime: '15:00', label: 'Late Afternoon', optional: true }
        ]
      },
      { type: 'PITRU', title: 'Pitru Yagna', kundCount: 9, sessions: PITRU_FULL }
    ]
  },
  // Tue 16 - Fri 19 June — Vishnu Gopal + Pitru
  ...[16, 17, 18, 19].map<DaySpec>((d) => ({
    date: dayUTC(EVENT_YEAR, 5, d),
    description: 'Vishnu Gopal Yagna with three core sittings (optional dawn and late afternoon). Pitru Yagna alongside throughout the day.',
    yagnas: [
      {
        type: 'VISHNU_GOPAL', title: 'Vishnu Gopal Yagna', kundCount: 11,
        sessions: [
          { startTime: '08:30', label: 'Early Morning', optional: true },
          { startTime: '10:15', label: 'Morning' },
          { startTime: '12:15', label: 'Midday' },
          { startTime: '14:15', label: 'Afternoon' },
          { startTime: '16:15', label: 'Late Afternoon', optional: true }
        ]
      },
      { type: 'PITRU', title: 'Pitru Yagna', kundCount: 9, sessions: PITRU_FULL }
    ]
  })),
  // Sat 20 June — extended schedule, five Vishnu Gopal sittings all mandatory
  {
    date: dayUTC(EVENT_YEAR, 5, 20),
    description: 'Extended Saturday programme — five Vishnu Gopal sittings plus Pitru Yagna throughout.',
    yagnas: [
      {
        type: 'VISHNU_GOPAL', title: 'Vishnu Gopal Yagna', kundCount: 11,
        sessions: [
          { startTime: '08:30', label: 'Early Morning' },
          { startTime: '10:15', label: 'Morning' },
          { startTime: '12:15', label: 'Midday' },
          { startTime: '14:15', label: 'Afternoon' },
          { startTime: '16:15', label: 'Late Afternoon' }
        ]
      },
      { type: 'PITRU', title: 'Pitru Yagna', kundCount: 9, sessions: PITRU_FULL }
    ]
  },
  // Sun 21 June — concluding day, finishes ~15:00
  {
    date: dayUTC(EVENT_YEAR, 5, 21),
    description: 'Concluding day of the programme — finishes around 15:00.',
    yagnas: [
      {
        type: 'VISHNU_GOPAL', title: 'Vishnu Gopal Yagna', kundCount: 11,
        sessions: [
          { startTime: '08:30', label: 'Early Morning' },
          { startTime: '10:15', label: 'Morning' },
          { startTime: '12:15', label: 'Midday' }
        ]
      },
      { type: 'PITRU', title: 'Pitru Yagna', kundCount: 9, sessions: PITRU_SUN21 }
    ]
  }
];

async function seedDay(day: DaySpec) {
  const eventDay = await prisma.eventDay.upsert({
    where: { date: day.date },
    update: { description: day.description },
    create: { date: day.date, description: day.description }
  });

  for (const y of day.yagnas) {
    const instance = await prisma.yagnaInstance.upsert({
      where: { eventDayId_yagnaType: { eventDayId: eventDay.id, yagnaType: y.type } },
      update: { title: y.title, kundCount: y.kundCount },
      create: { eventDayId: eventDay.id, yagnaType: y.type, title: y.title, kundCount: y.kundCount }
    });

    for (const s of y.sessions) {
      const session = await prisma.session.upsert({
        where: { yagnaInstanceId_startTime: { yagnaInstanceId: instance.id, startTime: s.startTime } },
        update: { label: s.label, optional: !!s.optional, enabled: !s.optional },
        create: {
          yagnaInstanceId: instance.id,
          startTime: s.startTime,
          label: s.label,
          optional: !!s.optional,
          enabled: !s.optional   // optional sessions disabled by default; admin enables on demand
        }
      });

      for (let n = 1; n <= y.kundCount; n++) {
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
  }
  console.log(`✓ Seeded ${day.date.toISOString().slice(0, 10)} (${day.yagnas.map((y) => `${y.title} ${y.kundCount}K x ${y.sessions.length}s`).join(', ')})`);
}

async function main() {
  console.log(`\nSeeding SomaYagna London ${EVENT_YEAR}…\n`);
  for (const day of DAYS) await seedDay(day);

  const totalPositions = await prisma.kundPosition.count();
  // Expected positions:
  //   Sun 14:  Purshotam 11×3×2 = 66  + Pitru 9×3×7 = 189  = 255
  //   Mon 15:  Purshotam 11×3×4 = 132 + Pitru 9×3×7 = 189  = 321
  //   Tue–Fri (×4):  VG 11×3×5 = 165 + Pitru 9×3×7 = 189  = 354 each = 1416
  //   Sat 20:  VG 11×3×5 = 165 + Pitru 9×3×7 = 189  = 354
  //   Sun 21:  VG 11×3×3 = 99  + Pitru 9×3×4 = 108  = 207
  // Total = 255 + 321 + 1416 + 354 + 207 = 2553
  const expected = 2553;
  console.log(`\nTotal positions: ${totalPositions} (expected ${expected})\n`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
