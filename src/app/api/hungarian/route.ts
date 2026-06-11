import { NextRequest, NextResponse } from 'next/server';
import { buildHungarianSteps } from '@/lib/hungarian';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const matrix: number[][] = body.matrix;

  if (
    !Array.isArray(matrix) ||
    matrix.length < 2 ||
    matrix.length > 8 ||
    !matrix.every(
      (row) => Array.isArray(row) && row.length === matrix.length && row.every((v) => typeof v === 'number' && Number.isFinite(v)),
    )
  ) {
    return NextResponse.json({ error: 'Invalid matrix. Must be a square NxN matrix (2-8) of numbers.' }, { status: 400 });
  }

  const steps = buildHungarianSteps(matrix);
  return NextResponse.json({ steps });
}
