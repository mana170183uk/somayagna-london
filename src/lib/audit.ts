import type { NextRequest } from 'next/server';
import { prisma } from './prisma';

/**
 * Extract the client IP from common reverse-proxy headers. On Vercel the
 * client IP is in x-forwarded-for (first entry of the comma list); we fall
 * back to x-real-ip and x-vercel-forwarded-for in case one is set differently.
 */
export function clientIp(req: NextRequest): string | null {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return req.headers.get('x-real-ip')
      ?? req.headers.get('x-vercel-forwarded-for')
      ?? null;
}

export function userAgent(req: NextRequest): string | null {
  const ua = req.headers.get('user-agent');
  return ua ? ua.slice(0, 500) : null;
}

interface AuditArgs {
  actor: string;
  action: string;
  target?: string | null;
  meta?: Record<string, unknown> | null;
  req?: NextRequest;
}

/**
 * Records an audit entry with optional IP/user-agent capture when a request
 * is provided. Safe to call outside a transaction; non-blocking failures
 * are swallowed so a logging glitch never breaks the user-visible action.
 */
export async function audit({ actor, action, target, meta, req }: AuditArgs) {
  try {
    await prisma.auditLog.create({
      data: {
        actor,
        action,
        target: target ?? null,
        meta: (meta as any) ?? undefined,
        ipAddress: req ? clientIp(req) : null,
        userAgent: req ? userAgent(req) : null
      }
    });
  } catch (e) {
    console.error('[audit] failed to record', { action, target }, e);
  }
}
