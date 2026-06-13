'use client';

import React from 'react';
import { SimplexStep, PivotOperation } from '@/lib/simplex-types';

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

interface Props {
  step: SimplexStep;
}

export default function SimplexCalculations({ step }: Props) {
  const { tableau, basicVars, numVars, numConstraints, varNames, zCalcTerms, pivotOperations, objectiveValue } = step;
  const totalVars = numVars + numConstraints;

  const cj = Array.from({ length: totalVars }, (_, j) => j < numVars ? zCalcTerms[j].coeff : 0);
  const cB = basicVars.map(v => cj[v]);

  const zj = Array.from({ length: totalVars + 1 }, (_, j) => {
    return cB.reduce((sum, cb, i) => sum + cb * tableau[i][j], 0);
  });

  const constraintOps = pivotOperations.filter(op => op.rowLabel !== 'z');

  return (
    <div className="space-y-5">
      {/* Row Operations */}
      {constraintOps.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Row Operations</h3>
          <div className="space-y-1">
            {constraintOps.map((op, i) => (
              <div key={i} className="font-mono text-xs px-3 py-1.5 rounded-lg bg-slate-800/60">
                <RowOp op={op} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Z-Row Calculation */}
      <div>
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Z-Row Calculation</h3>
        <div className="space-y-0.5">
          {Array.from({ length: totalVars }, (_, j) => {
            const colValues = Array.from({ length: numConstraints }, (_, i) => tableau[i][j]);
            const result = zj[j] - cj[j];

            return (
              <div key={j} className="font-mono text-xs px-2 py-0.5 rounded hover:bg-slate-800/40 transition-colors">
                <span className={`${j < numVars ? 'text-cyan-400' : 'text-indigo-400'} font-semibold`}>{varNames[j]}</span>
                <span className="text-slate-300">{': '}</span>
                {cB.map((cb, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <span className="text-slate-300">{cb >= 0 ? ' + ' : ' − '}</span>}
                    {i === 0 && cb < 0 && <span className="text-slate-300">{'−'}</span>}
                    <span className="text-slate-400">{i === 0 ? fmt(cb) : fmt(Math.abs(cb))}</span>
                    <span className="text-slate-300">{'('}</span>
                    <span className="text-slate-200">{fmt(colValues[i])}</span>
                    <span className="text-slate-300">{')'}</span>
                  </React.Fragment>
                ))}
                {Math.abs(cj[j]) > 1e-10 && (
                  <>
                    <span className="text-slate-300">{cj[j] > 0 ? ' − ' : ' + '}</span>
                    <span className="text-slate-400">{fmt(Math.abs(cj[j]))}</span>
                  </>
                )}
                <span className="text-slate-300">{' = '}</span>
                <span className={`font-semibold ${result < -1e-10 ? 'text-red-300' : 'text-slate-200'}`}>{fmt(result)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Objective Value (c_B · RHS) */}
      <div>
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Objective Value</h3>
        <div className="font-mono text-xs px-2">
          <span className="text-emerald-400">z</span>
          <span className="text-slate-300">{': '}</span>
          {cB.map((cb, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span className="text-slate-300">{cb >= 0 ? ' + ' : ' − '}</span>}
              {i === 0 && cb < 0 && <span className="text-slate-300">{'−'}</span>}
              <span className="text-slate-400">{i === 0 ? fmt(cb) : fmt(Math.abs(cb))}</span>
              <span className="text-slate-300">{'('}</span>
              <span className="text-slate-200">{fmt(tableau[i][totalVars])}</span>
              <span className="text-slate-300">{')'}</span>
            </React.Fragment>
          ))}
          <span className="text-slate-300">{' = '}</span>
          <span className="text-emerald-300 font-bold">{fmt(zj[totalVars])}</span>
        </div>
      </div>
    </div>
  );
}

function RowOp({ op }: { op: PivotOperation }) {
  const labelColor = 'text-cyan-300';
  if (op.type === 'normalize') {
    return (
      <>
        <span className={labelColor}>{op.rowLabel}</span>
        <span className="text-slate-300">{' ← '}</span>
        <span className={labelColor}>{op.rowLabel}</span>
        <span className="text-slate-300">{' / '}</span>
        <span className="text-slate-200">{fmt(op.value)}</span>
      </>
    );
  }
  const absFactor = Math.abs(op.value);
  const sign = op.value > 0 ? '−' : '+';
  const isOne = Math.abs(absFactor - 1) < 1e-10;
  return (
    <>
      <span className={labelColor}>{op.rowLabel}</span>
      <span className="text-slate-300">{' ← '}</span>
      <span className={labelColor}>{op.rowLabel}</span>
      <span className="text-slate-300">{` ${sign} `}</span>
      {!isOne && (
        <>
          <span className="text-slate-200">{fmt(absFactor)}</span>
          <span className="text-slate-300">{'·'}</span>
        </>
      )}
      <span className="text-cyan-300">{op.pivotRowLabel}</span>
    </>
  );
}
