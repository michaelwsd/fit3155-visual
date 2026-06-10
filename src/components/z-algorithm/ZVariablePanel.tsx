'use client';

import React from 'react';
import { ZAlgorithmStep } from '@/lib/z-algorithm-types';

interface Props {
  step: ZAlgorithmStep;
  prevStep: ZAlgorithmStep | null;
}

function Var({
  label,
  value,
  changed,
  color = 'text-slate-200',
}: {
  label: string;
  value: string | number;
  changed: boolean;
  color?: string;
}) {
  return (
    <div
      className={`flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-500 ${
        changed ? 'bg-amber-500/15 ring-1 ring-amber-500/40' : 'bg-slate-800/60'
      }`}
    >
      <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
        {label}
      </span>
      <span
        className={`font-mono text-sm font-semibold ${
          changed ? 'text-amber-400' : color
        } transition-colors duration-500`}
      >
        {value}
      </span>
    </div>
  );
}

export default function ZVariablePanel({ step, prevStep }: Props) {
  const p = prevStep;
  const isActive = step.rule !== 'init' && step.rule !== 'complete';

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
        Algorithm State
      </h3>
      <Var
        label="Position (k)"
        value={isActive ? step.position : '—'}
        changed={!!p && step.position !== p.position}
        color="text-amber-300"
      />
      <Var
        label="Z-box Left (l)"
        value={step.l}
        changed={!!p && step.l !== p.l}
        color="text-indigo-300"
      />
      <Var
        label="Z-box Right (r)"
        value={step.r}
        changed={!!p && step.r !== p.r}
        color="text-indigo-300"
      />
      <Var
        label="Z[k]"
        value={isActive && step.position > 0 ? step.zArray[step.position] : '—'}
        changed={!!p && isActive && step.zArray[step.position] !== (p.zArray[step.position] ?? 0)}
        color="text-emerald-300"
      />
      {step.k1 !== null && (
        <Var
          label="Mirror (k1)"
          value={step.k1}
          changed={!!p && step.k1 !== p.k1}
          color="text-cyan-300"
        />
      )}
      {step.k1 !== null && (
        <Var
          label="Z[k1]"
          value={step.zArray[step.k1]}
          changed={false}
          color="text-cyan-300"
        />
      )}
    </div>
  );
}
