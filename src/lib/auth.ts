import crypto from 'node:crypto';
import { cookies } from 'next/headers';

export { hashPassword, verifyPassword } from './passwords';

const SECRET = process.env.ADMIN_SESSION_SECRET ?? 'dev-only-insecure-secret-change-me';

function sign(payload: string): string {
  return crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
}

export function signSession(email: string): string {
  const exp = Date.now() + 1000 * 60 * 60 * 8; // 8h
  const payload = `${email}.${exp}`;
  return `${Buffer.from(payload).toString('base64url')}.${sign(payload)}`;
}

export function verifySession(token: string | undefined): { email: string } | null {
  if (!token) return null;
  const [b64, sig] = token.split('.');
  if (!b64 || !sig) return null;
  const payload = Buffer.from(b64, 'base64url').toString();
  if (sign(payload) !== sig) return null;
  const [email, expStr] = payload.split('.');
  if (Number(expStr) < Date.now()) return null;
  return { email };
}

export function getAdminFromCookies(): { email: string } | null {
  const token = cookies().get('sy_admin')?.value;
  return verifySession(token);
}

export const ADMIN_COOKIE = 'sy_admin';
