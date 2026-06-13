import { SimplexStep, SimplexStepRule, PivotOperation } from './simplex-types';

function gcd(a: number, b: number): number {
  a = Math.abs(a); b = Math.abs(b);
  while (b) { [a, b] = [b, a % b]; }
  return a;
}

function fmt(n: number): string {
  if (Math.abs(n) < 1e-10) return '0';
  if (Math.abs(n - Math.round(n)) < 1e-9) return Math.round(n).toString();
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  for (let d = 2; d <= 100; d++) {
    const num = Math.round(abs * d);
    if (Math.abs(abs - num / d) < 1e-9) {
      const g = gcd(num, d);
      return `${sign}${num / g}/${d / g}`;
    }
  }
  const r = Math.round(n * 100) / 100;
  if (Math.abs(r - Math.round(r)) < 0.001) return Math.round(r).toString();
  return r.toFixed(2);
}

export function buildSimplexSteps(
  objective: number[],
  constraints: { coeffs: number[]; rhs: number }[],
): SimplexStep[] {
  const steps: SimplexStep[] = [];
  const numVars = objective.length;
  const numConstraints = constraints.length;
  const totalVars = numVars + numConstraints;

  const varNames: string[] = [];
  for (let i = 0; i < numVars; i++) varNames.push(`x${i + 1}`);
  for (let i = 0; i < numConstraints; i++) varNames.push(`s${i + 1}`);

  const tableau: number[][] = [];
  for (let i = 0; i < numConstraints; i++) {
    const row = new Array(totalVars + 1).fill(0);
    for (let j = 0; j < numVars; j++) row[j] = constraints[i].coeffs[j];
    row[numVars + i] = 1;
    row[totalVars] = constraints[i].rhs;
    tableau.push(row);
  }
  const zRow = new Array(totalVars + 1).fill(0);
  for (let j = 0; j < numVars; j++) zRow[j] = -objective[j];
  tableau.push(zRow);

  const basicVars = Array.from({ length: numConstraints }, (_, i) => numVars + i);

  function snap(): number[][] {
    return tableau.map((r) => r.map((v) => (Math.abs(v) < 1e-10 ? 0 : v)));
  }

  function getSolution(): number[] {
    const sol = new Array(totalVars).fill(0);
    for (let i = 0; i < numConstraints; i++) {
      sol[basicVars[i]] = Math.abs(tableau[i][totalVars]) < 1e-10 ? 0 : tableau[i][totalVars];
    }
    return sol;
  }

  function objVal(): number {
    const v = tableau[numConstraints][totalVars];
    return Math.abs(v) < 1e-10 ? 0 : v;
  }

  function makeZCalcTerms() {
    const sol = getSolution();
    return objective.map((c, i) => ({ varName: varNames[i], coeff: c, value: sol[i] }));
  }

  function make(rule: SimplexStepRule, pivotRow: number, pivotCol: number, ratios: (number | null)[], iteration: number, explanation: string, pivotOps: PivotOperation[] = []): SimplexStep {
    return { rule, tableau: snap(), basicVars: [...basicVars], numVars, numConstraints, varNames: [...varNames], pivotRow, pivotCol, ratios, objectiveValue: objVal(), solution: getSolution(), iteration, explanation, pivotOperations: pivotOps, zCalcTerms: makeZCalcTerms() };
  }

  const slackList = varNames.slice(numVars).join(', ');
  const bfsEntries = basicVars.map((v, i) => `${varNames[v]} = ${fmt(tableau[i][totalVars])}`).join(', ');
  steps.push(make('init', -1, -1, [], 0,
    `Set up the initial simplex tableau. Slack variables (${slackList}) convert ≤ constraints into equalities. Initial basic feasible solution: ${bfsEntries}. All decision variables are non-basic (= 0). Objective z = ${fmt(objVal())}.`));

  let iteration = 0;
  const maxIter = 50;

  while (iteration < maxIter) {
    iteration++;

    const zCoeffs = tableau[numConstraints].slice(0, totalVars);
    const isOptimal = zCoeffs.every((c) => c >= -1e-10);

    if (isOptimal) {
      steps.push(make('check_optimal', -1, -1, [], iteration,
        `Examine the z-row coefficients: [${zCoeffs.map(fmt).join(', ')}]. All are non-negative (≥ 0), so the current basic feasible solution is optimal.`));
      const solParts = [];
      for (let i = 0; i < numVars; i++) {
        const sol = getSolution();
        solParts.push(`${varNames[i]} = ${fmt(sol[i])}`);
      }
      steps.push(make('optimal', -1, -1, [], iteration,
        `Optimal solution found! ${solParts.join(', ')} with maximum objective value z = ${fmt(objVal())}.`));
      break;
    }

    const negEntries = zCoeffs
      .map((c, j) => (c < -1e-10 ? `${varNames[j]} (${fmt(c)})` : null))
      .filter(Boolean)
      .join(', ');
    steps.push(make('check_optimal', -1, -1, [], iteration,
      `Examine the z-row coefficients: [${zCoeffs.map(fmt).join(', ')}]. Negative entries found: ${negEntries}. The current solution is NOT optimal.`));

    let pivotCol = 0;
    for (let j = 1; j < totalVars; j++) {
      if (zCoeffs[j] < zCoeffs[pivotCol]) pivotCol = j;
    }

    steps.push(make('select_pivot_col', -1, pivotCol, [], iteration,
      `Select the entering variable: the most negative z-row coefficient is ${fmt(zCoeffs[pivotCol])} at column ${varNames[pivotCol]}. Variable ${varNames[pivotCol]} enters the basis.`));

    const ratios: (number | null)[] = [];
    let pivotRow = -1;
    let minRatio = Infinity;
    for (let i = 0; i < numConstraints; i++) {
      if (tableau[i][pivotCol] > 1e-10) {
        const ratio = tableau[i][totalVars] / tableau[i][pivotCol];
        ratios.push(ratio);
        if (ratio < minRatio - 1e-10) {
          minRatio = ratio;
          pivotRow = i;
        }
      } else {
        ratios.push(null);
      }
    }

    if (pivotRow === -1) {
      steps.push(make('ratio_test', -1, pivotCol, ratios, iteration,
        `Minimum ratio test: no positive entries in the ${varNames[pivotCol]} column. Cannot determine a leaving variable.`));
      steps.push(make('unbounded', -1, pivotCol, [], iteration,
        `The problem is unbounded. The objective function can increase without limit along the ${varNames[pivotCol]} direction.`));
      break;
    }

    const ratioDetails = ratios
      .map((r, i) => `Row ${i + 1} (${varNames[basicVars[i]]}): ${r !== null ? `${fmt(tableau[i][totalVars])} / ${fmt(tableau[i][pivotCol])} = ${fmt(r)}` : 'skip (non-positive entry)'}`)
      .join('. ');
    steps.push(make('ratio_test', pivotRow, pivotCol, ratios, iteration,
      `Minimum ratio test for entering variable ${varNames[pivotCol]}. ${ratioDetails}. Minimum ratio = ${fmt(minRatio)} at row ${pivotRow + 1}. Variable ${varNames[basicVars[pivotRow]]} leaves the basis.`));

    const pivotElement = tableau[pivotRow][pivotCol];
    const pivotRowLabel = `R${pivotRow + 1}`;
    const pivotOps: PivotOperation[] = [
      { rowLabel: pivotRowLabel, type: 'normalize', value: pivotElement, pivotRowLabel },
    ];
    for (let i = 0; i <= numConstraints; i++) {
      if (i === pivotRow) continue;
      const factor = tableau[i][pivotCol];
      if (Math.abs(factor) < 1e-10) continue;
      const label = i === numConstraints ? 'z' : `R${i + 1}`;
      pivotOps.push({ rowLabel: label, type: 'eliminate', value: factor, pivotRowLabel });
    }

    for (let j = 0; j <= totalVars; j++) tableau[pivotRow][j] /= pivotElement;
    for (let i = 0; i <= numConstraints; i++) {
      if (i === pivotRow) continue;
      const factor = tableau[i][pivotCol];
      if (Math.abs(factor) < 1e-10) continue;
      for (let j = 0; j <= totalVars; j++) tableau[i][j] -= factor * tableau[pivotRow][j];
    }

    const oldBasic = varNames[basicVars[pivotRow]];
    basicVars[pivotRow] = pivotCol;

    const newBfs = basicVars.map((v, i) => `${varNames[v]} = ${fmt(tableau[i][totalVars])}`).join(', ');
    steps.push(make('pivot', pivotRow, pivotCol, [], iteration,
      `Pivot on row ${pivotRow + 1}, column ${varNames[pivotCol]} (element = ${fmt(pivotElement)}). ${oldBasic} leaves, ${varNames[pivotCol]} enters the basis. Updated BFS: ${newBfs}. Objective z = ${fmt(objVal())}.`,
      pivotOps));
  }

  return steps;
}
