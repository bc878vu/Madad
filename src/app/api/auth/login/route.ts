import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createSessionToken, SESSION_COOKIE, verifyPassword } from '@/lib/auth';
import { loginSchema } from '@/lib/validation';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { email, password } = loginSchema.parse(await request.json());
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user || !user.passwordHash || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }
    if (user.status !== 'ACTIVE') return NextResponse.json({ error: 'This account is currently restricted.' }, { status: 403 });
    const token = createSessionToken();
    const response = NextResponse.json({ user: { id: user.id, username: user.username, email: user.email } });
    response.cookies.set(SESSION_COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 7 });
    return response;
  } catch {
    return NextResponse.json({ error: 'Invalid login request.' }, { status: 400 });
  }
}