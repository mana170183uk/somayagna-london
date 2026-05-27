import { z } from 'zod';
import { POSITION_LABELS } from './constants';

export const positionLabelSchema = z.enum(POSITION_LABELS as unknown as [string, ...string[]]);

export const createHoldSchema = z.object({
  sessionId: z.string().min(1),
  bookingType: z.enum(['SINGLE_POSITION', 'FULL_KUND']),
  kundNumber: z.number().int().min(1).max(13),   // server enforces real per-yagna cap (Pitru 9, Purshotam/Vishnu Gopal 11, optional 13)
  positions: z.array(positionLabelSchema).min(1).max(3),
  email: z.string().email(),
  primaryName: z.string().min(2)
});
export type CreateHoldInput = z.infer<typeof createHoldSchema>;

export const registrationSchema = z.object({
  holdId: z.string().min(1),
  primaryName: z.string().min(2).max(120),
  relation: z.enum(['COUPLE', 'SIBLING', 'INDIVIDUAL']),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().min(5).max(40),
  // WhatsApp number: must contain at least 10 digits and only +, digits, spaces, dashes, parens.
  // Common shapes accepted: +447123456789, 07123 456789, +44 7123 456-789.
  whatsappNumber: z.string()
    .min(10, 'WhatsApp number must include at least 10 digits.')
    .max(20, 'WhatsApp number is too long.')
    .regex(/^[+0-9\s\-()]+$/, 'WhatsApp number can only contain digits, +, spaces, dashes and parentheses.')
    .refine((s) => (s.match(/\d/g) ?? []).length >= 10, 'WhatsApp number must include at least 10 digits.'),
  secondParticipantName: z.string().max(120).optional().nullable(),
  addressLine1: z.string().min(1).max(200),
  town: z.string().min(1).max(100),
  postcode: z.string().min(1).max(20),
  giftAid: z.boolean().optional(),
  donationPence: z.number().int().min(0).max(10_000_00).optional(),
  provider: z.enum(['stripe', 'paypal', 'mock'])
});
export type RegistrationInput = z.infer<typeof registrationSchema>;

export const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const adminEditBookingSchema = z.object({
  primaryName: z.string().min(2).optional(),
  relation: z.enum(['COUPLE', 'SIBLING', 'INDIVIDUAL']).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(5).optional(),
  secondParticipantName: z.string().nullable().optional()
});

export const adminCreateBookingSchema = z.object({
  sessionId: z.string(),
  bookingType: z.enum(['SINGLE_POSITION', 'FULL_KUND']),
  kundNumber: z.number().int().min(1).max(13),    // server enforces real per-yagna cap
  positions: z.array(positionLabelSchema).min(1).max(3),
  primaryName: z.string().min(2),
  relation: z.enum(['COUPLE', 'SIBLING', 'INDIVIDUAL']),
  email: z.string().email(),
  phone: z.string().min(5),
  secondParticipantName: z.string().nullable().optional()
});

/* ─── Donations ─── */
import { MATERIALS } from './materials';

const materialKeys = MATERIALS.map((m) => m.key) as [string, ...string[]];

export const donationCheckoutSchema = z.object({
  type: z.enum(['GENERAL', 'MATERIAL']),
  materialKey: z.enum(materialKeys).optional().nullable(),
  amountPence: z.number().int().min(100).max(1_000_000_000),
  donorName: z.string().min(2).max(120),
  donorEmail: z.string().email(),
  donorPhone: z.string().max(40).optional().nullable(),
  donorAddress: z.string().min(3).max(200),
  donorPostcode: z.string().min(2).max(20),
  message: z.string().max(500).optional().nullable(),
  anonymous: z.boolean().optional(),
  giftAid: z.boolean().optional(),
  provider: z.enum(['stripe', 'paypal', 'mock'])
});
