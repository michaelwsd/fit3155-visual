'use client';

import React from 'react';
import { SimplexStep } from '@/lib/simplex-types';

interface Props {
  step: SimplexStep;
  prevStep: SimplexStep | null;
}

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

function Var({ label, value, changed, color = 'text-slate-200' }: { label: string; value: string | number; changed: boolean; color?: string }) {
  return (
    <div className={`flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-500 ${changed ? 'bg-amber-500/15 ring-1 ring-amber-500/40' : 'bg-slate-800/60'}`}>
      <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">{label}</span>
      <span className={`font-mono text-sm font-semibold ${changed ? 'text-amber-400' : color} transition-colors duration-500`}>{value}</span>
    </div>
  );
}

export default function SimplexVariablePanel({ step, prevStep }: Props) {
  const p = prevStep;
  const { numVars, varNames, solution, basicVars, numConstraints } = step;

  const basicSet = new Set(basicVars);
  const nonBasicVars = varNames.filter((_, i) => !basicSet.has(i));

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Algorithm State</h3>
        <Var label="Iteration" value={step.iteration || '—'} changed={!!p && step.iteration !== p.iteration} color="text-cyan-300" />
        <Var label="Objective (z)" value={fmt(step.objectiveValue)} changed={!!p && Math.abs(step.objectiveValue - p.objectiveValue) > 1e-10} color="text-emerald-300" />
      </div>

      <div>
        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Decision Variables</h4>
        <div className="space-y-1">
          {Array.from({ length: numVars }, (_, i) => {
            const val = solution[i];
            const prevVal = p ? p.solution[i] : null;
            const changed = prevVal !== null && Math.abs(val - prevVal) > 1e-10;
            return (
              <div key={i} className={`flex items-center justify-between px-3 py-1.5 rounded-lg transition-all duration-500 ${changed ? 'bg-amber-500/15 ring-1 ring-amber-500/40' : 'bg-slate-800/60'}`}>
                <span className="text-xs font-mono font-medium text-cyan-400">{varNames[i]}</span>
                <span className={`font-mono text-sm font-semibold ${changed ? 'text-amber-400' : 'text-slate-200'} transition-colors duration-500`}>{fmt(val)}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Slack Variables</h4>
        <div className="space-y-1">
          {Array.from({ length: numConstraints }, (_, i) => {
            const idx = numVars + i;
            const val = solution[idx];
            const prevVal = p ? p.solution[idx] : null;
            const changed = prevVal !== null && Math.abs(val - prevVal) > 1e-10;
            return (
              <div key={idx} className={`flex items-center justify-between px-3 py-1.5 rounded-lg transition-all duration-500 ${changed ? 'bg-amber-500/15 ring-1 ring-amber-500/40' : 'bg-slate-800/60'}`}>
                <span className="text-xs font-mono font-medium text-indigo-400">{varNames[idx]}</span>
                <span className={`font-mono text-sm font-semibold ${changed ? 'text-amber-400' : 'text-slate-200'} transition-colors duration-500`}>{fmt(val)}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Basic Variables</h4>
        <div className="flex gap-1.5 flex-wrap">
          {basicVars.map((v, i) => (
            <span key={i} className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-500/30">
              {varNames[v]}
            </span>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Non-Basic Variables</h4>
        <div className="flex gap-1.5 flex-wrap">
          {nonBasicVars.map((name, i) => (
            <span key={i} className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-700/50 text-slate-400 ring-1 ring-slate-600/30">
              {name} = 0
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
