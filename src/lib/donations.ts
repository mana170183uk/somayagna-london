import { Prisma, DonationStatus, DonationType, PaymentProvider } from '@prisma/client';
import { prisma } from './prisma';
import { findMaterial } from './materials';

let counter = 0;
function donationReference(year: string) {
  counter = (counter + 1) % 1_000_000;
  const ts = Date.now().toString(36).slice(-4).toUpperCase();
  const rnd = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `SY-DON-${year}-${ts}${rnd}`;
}

export class DonationError extends Error {
  constructor(public code: 'INVALID_AMOUNT' | 'INVALID_MATERIAL' | 'INVALID_REQUEST' | 'NOT_FOUND', message: string) {
    super(message);
  }
}

interface CreatePendingDonationArgs {
  type: DonationType;
  materialKey?: string;
  amountPence: number;
  donorName: string;
  donorEmail: string;
  donorPhone?: string | null;
  message?: string | null;
  anonymous?: boolean;
  giftAid?: boolean;
  giftAidAddress?: string | null;
  giftAidPostcode?: string | null;
}

const MIN_PENCE = 100;      // £1 minimum
const MAX_PENCE = 1_000_000_000; // £10,000,000 sanity ceiling

export async function createPendingDonation(a: CreatePendingDonationArgs) {
  if (!Number.isInteger(a.amountPence) || a.amountPence < MIN_PENCE || a.amountPence > MAX_PENCE) {
    throw new DonationError('INVALID_AMOUNT', `Donation must be between £${MIN_PENCE/100} and £${MAX_PENCE/100}.`);
  }
  let materialLabel: string | null = null;
  if (a.type === 'MATERIAL') {
    if (!a.materialKey) throw new DonationError('INVALID_MATERIAL', 'A material must be selected.');
    const m = findMaterial(a.materialKey);
    if (!m) throw new DonationError('INVALID_MATERIAL', `Unknown material: ${a.materialKey}`);
    materialLabel = m.label;
  }
  if (a.giftAid && (!a.giftAidAddress || !a.giftAidPostcode)) {
    throw new DonationError('INVALID_REQUEST', 'Gift Aid declaration requires a UK home address and postcode.');
  }

  return prisma.donation.create({
    data: {
      reference: donationReference(process.env.EVENT_YEAR ?? '2026'),
      type: a.type,
      materialKey: a.materialKey ?? null,
      materialLabel,
      amountPence: a.amountPence,
      donorName: a.donorName,
      donorEmail: a.donorEmail,
      donorPhone: a.donorPhone ?? null,
      message: a.message ?? null,
      anonymous: a.anonymous ?? false,
      giftAid: a.giftAid ?? false,
      giftAidAddress: a.giftAidAddress ?? null,
      giftAidPostcode: a.giftAidPostcode ?? null,
      status: 'PENDING_PAYMENT'
    }
  });
}

interface CompleteDonationArgs {
  donationId: string;
  provider: PaymentProvider;
  providerRef?: string;
  raw?: unknown;
}

export async function completeDonation(a: CompleteDonationArgs) {
  return prisma.donation.update({
    where: { id: a.donationId },
    data: {
      status: 'COMPLETED' as DonationStatus,
      paymentProvider: a.provider,
      paymentRef: a.providerRef ?? null,
      rawWebhook: (a.raw as Prisma.InputJsonValue) ?? undefined,
      completedAt: new Date()
    }
  });
}

export async function failDonation(donationId: string, raw?: unknown) {
  return prisma.donation.update({
    where: { id: donationId },
    data: {
      status: 'FAILED' as DonationStatus,
      rawWebhook: (raw as Prisma.InputJsonValue) ?? undefined
    }
  });
}
