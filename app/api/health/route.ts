import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'madad',
    timestamp: new Date().toISOString(),
  });
}
