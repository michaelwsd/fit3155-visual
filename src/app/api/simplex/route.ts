import { NextRequest, NextResponse } from 'next/server';
import { buildSimplexSteps } from '@/lib/simplex';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { objective, constraints } = body as {
    objective: number[];
    constraints: { coeffs: number[]; rhs: number }[];
  };

  if (
    !Array.isArray(objective) ||
    objective.length < 1 ||
    objective.length > 5 ||
    !objective.every((v) => typeof v === 'number' && Number.isFinite(v))
  ) {
    return NextResponse.json({ error: 'Invalid objective. Must be 1-6 finite coefficients.' }, { status: 400 });
  }

  if (
    !Array.isArray(constraints) ||
    constraints.length < 1 ||
    constraints.length > 8 ||
    !constraints.every(
      (c) =>
        Array.isArray(c.coeffs) &&
        c.coeffs.length === objective.length &&
        c.coeffs.every((v) => typeof v === 'number' && Number.isFinite(v)) &&
        typeof c.rhs === 'number' &&
        Number.isFinite(c.rhs) &&
        c.rhs >= 0,
    )
  ) {
    return NextResponse.json(
      { error: 'Invalid constraints. Each must have matching coefficients and non-negative RHS.' },
      { status: 400 },
    );
  }

  const steps = buildSimplexSteps(objective, constraints);
  return NextResponse.json({ steps });
}
