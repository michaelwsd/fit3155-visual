import { NextRequest, NextResponse } from 'next/server';
import { buildBWTSteps } from '@/lib/bwt';

export async function POST(req: NextRequest) {
  const { text, pattern } = await req.json();
  const steps = buildBWTSteps(text ?? '', pattern ?? '');
  return NextResponse.json({ steps });
}
