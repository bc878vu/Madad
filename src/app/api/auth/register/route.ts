import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { hashPassword, createSessionToken, SESSION_COOKIE } from '@/lib/auth';
import { registerSchema } from '@/lib/validation';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = registerSchema.parse(await request.json());
    const email = body.email.toLowerCase();
    const existing = await prisma.user.findFirst({ where: { OR: [{ email }, { username: body.username }] } });
    if (existing) return NextResponse.json({ error: 'Email or username is already in use.' }, { status: 409 });
    const user = await prisma.user.create({ data: { email, username: body.username, passwordHash: hashPassword(body.password) } });
    const token = createSessionToken();
    const response = NextResponse.json({ user: { id: user.id, username: user.username, email: user.email } }, { status: 201 });
    response.cookies.set(SESSION_COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 7 });
    return response;
  } catch {
    return NextResponse.json({ error: 'Invalid registration data.' }, { status: 400 });
  }
}