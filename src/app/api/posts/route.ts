import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { postSchema } from '@/lib/validation';

const prisma = new PrismaClient();

export async function GET() {
  const posts = await prisma.post.findMany({
    where: { status: 'ACTIVE' },
    include: { author: { select: { username: true, avatarUrl: true } }, _count: { select: { comments: true, helpOffers: true } } },
    orderBy: { createdAt: 'desc' }, take: 30
  });
  return NextResponse.json({ posts });
}

export async function POST(request: Request) {
  return NextResponse.json({ error: 'Authentication middleware is required before publishing posts.' }, { status: 501 });
}