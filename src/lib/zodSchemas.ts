import { z } from 'zod';
import { POSITION_LABELS } from './constants';

export const positionLabelSchema = z.enum(POSITION_LABELS as unknown as [string, ...string[]]);

export const createHoldSchema = z.object({
  sessionId: z.string().min(1),
  bookingType: z.enum(['SINGLE_POSITION', 'FULL_KUND']),
  kundNumber: z.number().int().min(1).max(11),
  positions: z.array(positionLabelSchema).min(1).max(3),
  email: z.string().email(),
  primaryName: z.string().min(2)
});
export type CreateHoldInput = z.infer<typeof createHoldSchema>;

export const registrationSchema = z.object({
  holdId: z.string().min(1),
  primaryName: z.string().min(2).max(120),
  relation: z.enum(['COUPLE', 'SIBLING', 'INDIVIDUAL']),
  email: z.string().email(),
  phone: z.string().min(5).max(40),
  secondParticipantName: z.string().max(120).optional().nullable(),
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
  kundNumber: z.number().int().min(1).max(11),
  positions: z.array(positionLabelSchema).min(1).max(3),
  primaryName: z.string().min(2),
  relation: z.enum(['COUPLE', 'SIBLING', 'INDIVIDUAL']),
  email: z.string().email(),
  phone: z.string().min(5),
  secondParticipantName: z.string().nullable().optional()
});
