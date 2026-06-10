import { NextRequest, NextResponse } from 'next/server';
import { buildBMSteps } from '@/lib/boyer-moore';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const pattern = typeof body.pattern === 'string' ? body.pattern.slice(0, 20) : '';
  const text = typeof body.text === 'string' ? body.text.slice(0, 30) : '';

  if (pattern.length === 0 || text.length === 0) {
    return NextResponse.json(
      { error: 'Both pattern and text are required' },
      { status: 400 },
    );
  }

  const steps = buildBMSteps(pattern, text);
  return NextResponse.json({ steps });
}
