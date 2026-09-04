import { cookies } from 'next/headers';
import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'crypto';

const SESSION_COOKIE = 'madad_session';

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const derived = scryptSync(password, salt, 64);
  return timingSafeEqual(derived, Buffer.from(hash, 'hex'));
}

export function createSessionToken() {
  return createHash('sha256').update(randomBytes(32)).digest('hex');
}

export async function getSessionToken() {
  return (await cookies()).get(SESSION_COOKIE)?.value ?? null;
}

export { SESSION_COOKIE };