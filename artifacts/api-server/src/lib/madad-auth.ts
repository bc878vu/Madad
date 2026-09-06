import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import type { Request, Response } from "express";
import { and, eq } from "drizzle-orm";
import { db, sessions, users, type MadadUser } from "@workspace/db";

export const SESSION_COOKIE = "madad_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const derived = scryptSync(password, salt, 64);
  const saved = Buffer.from(hash, "hex");
  return derived.length === saved.length && timingSafeEqual(derived, saved);
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  await db.insert(sessions).values({
    id: randomBytes(16).toString("hex"),
    tokenHash: hashToken(token),
    userId,
    expiresAt: new Date(Date.now() + SESSION_TTL_SECONDS * 1000),
  });
  return token;
}

export async function getCurrentUser(req: Request): Promise<MadadUser | null> {
  const token = req.cookies?.[SESSION_COOKIE] as string | undefined;
  if (!token) return null;

  const result = await db
    .select({ session: sessions, user: users })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.tokenHash, hashToken(token)))
    .limit(1);

  const current = result[0];
  if (!current) return null;
  if (current.session.expiresAt <= new Date()) {
    await db.delete(sessions).where(eq(sessions.id, current.session.id));
    return null;
  }
  return current.user;
}

export async function revokeCurrentSession(req: Request): Promise<void> {
  const token = req.cookies?.[SESSION_COOKIE] as string | undefined;
  if (token) {
    await db.delete(sessions).where(eq(sessions.tokenHash, hashToken(token)));
  }
}

export function setSessionCookie(res: Response, token: string): void {
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS * 1000,
  });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(SESSION_COOKIE, { httpOnly: true, sameSite: "lax", path: "/" });
}

export function publicUser(user: MadadUser) {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
    emailVerified: user.emailVerified,
  };
}

export function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export function isUniqueViolation(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: string }).code === "23505",
  );
}