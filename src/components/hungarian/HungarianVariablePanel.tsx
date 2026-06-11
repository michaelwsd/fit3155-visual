'use client';

import React from 'react';
import { HungarianStep } from '@/lib/hungarian-types';

interface Props {
  step: HungarianStep;
  prevStep: HungarianStep | null;
}

function Var({ label, value, changed, color = 'text-slate-200' }: { label: string; value: string | number; changed: boolean; color?: string }) {
  return (
    <div className={`flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-500 ${changed ? 'bg-amber-500/15 ring-1 ring-amber-500/40' : 'bg-slate-800/60'}`}>
      <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">{label}</span>
      <span className={`font-mono text-sm font-semibold ${changed ? 'text-amber-400' : color} transition-colors duration-500`}>{value}</span>
    </div>
  );
}

function DualArray({ label, values, color }: { label: string; values: number[]; color: string }) {
  return (
    <div>
      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">{label}</h4>
      <div className="flex gap-px flex-wrap">
        {values.map((val, i) => (
          <div key={i} className="flex flex-col items-center">
            <span className={`w-8 h-6 flex items-center justify-center text-[10px] font-mono font-bold rounded bg-slate-800/60 ${color}`}>
              {val}
            </span>
            <span className="text-[8px] font-mono text-slate-600 mt-0.5">{i + 1}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HungarianVariablePanel({ step, prevStep }: Props) {
  const p = prevStep;

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Algorithm State</h3>
        <Var label="Iteration" value={step.iteration || '—'} changed={!!p && step.iteration !== p.iteration} color="text-rose-300" />
        <Var label="|M| (Matching)" value={step.matchingSize} changed={!!p && step.matchingSize !== p.matchingSize} color="text-amber-300" />
        <Var label="Σu + Σv" value={step.objective} changed={!!p && step.objective !== p.objective} color="text-emerald-300" />
        {step.theta > 0 && (
          <Var label="θ" value={step.theta} changed={!!p && step.theta !== p.theta} color="text-cyan-300" />
        )}
      </div>

      <DualArray label="Row duals (u)" values={step.u} color="text-cyan-400" />
      <DualArray label="Column duals (v)" values={step.v} color="text-indigo-400" />

      {step.assignments.length > 0 && (
        <div>
          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Assignments</h4>
          <div className="flex gap-1.5 flex-wrap">
            {[...step.assignments].sort((a, b) => a[0] - b[0]).map(([i, j], idx) => (
              <span key={idx} className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/30">
                ({i + 1},{j + 1})
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
