'use client';

import React from 'react';
import { BMStep } from '@/lib/boyer-moore-types';

interface Props {
  step: BMStep;
  prevStep: BMStep | null;
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

function ArrayDisplay({
  label,
  values,
  highlightIdx,
  startIdx = 0,
}: {
  label: string;
  values: number[];
  highlightIdx: number;
  startIdx?: number;
}) {
  return (
    <div>
      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
        {label}
      </h4>
      <div className="flex gap-px flex-wrap">
        {values.map((val, i) => {
          const idx = startIdx + i;
          const isHighlighted = idx === highlightIdx;
          return (
            <div key={idx} className="flex flex-col items-center">
              <span
                className={`w-7 h-6 flex items-center justify-center text-[10px] font-mono font-bold rounded transition-all duration-300 ${
                  isHighlighted
                    ? 'bg-amber-500/25 text-amber-300 ring-1 ring-amber-500/50'
                    : 'bg-slate-800/60 text-slate-400'
                }`}
              >
                {val}
              </span>
              <span className="text-[8px] font-mono text-slate-600 mt-0.5">{idx}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function BMVariablePanel({ step, prevStep }: Props) {
  const p = prevStep;
  const isActive = step.rule !== 'init' && step.rule !== 'complete';
  const { badCharTable, zSuffix, goodSuffix, matchedPrefix, uniqueChars, patPos, mismatchIndex } = step;

  const gsHighlight = mismatchIndex >= 0 ? mismatchIndex + 1 : -1;
  const mpHighlight = mismatchIndex >= 0 ? mismatchIndex + 1 : -1;

  return (
    <div className="space-y-5">
      {/* Algorithm State */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
          Algorithm State
        </h3>
        <Var
          label="Alignment (i)"
          value={isActive ? step.textPos : '—'}
          changed={!!p && step.textPos !== p.textPos}
          color="text-blue-300"
        />
        <Var
          label="Pattern Pos (j)"
          value={isActive && patPos >= 0 ? patPos : '—'}
          changed={!!p && step.patPos !== p.patPos}
          color="text-amber-300"
        />
        <Var
          label="Bad Char Shift"
          value={step.bcShift > 0 ? step.bcShift : '—'}
          changed={!!p && step.bcShift !== p.bcShift && step.bcShift > 0}
          color="text-orange-300"
        />
        <Var
          label="Good Suffix Shift"
          value={step.gsShift > 0 ? step.gsShift : '—'}
          changed={!!p && step.gsShift !== p.gsShift && step.gsShift > 0}
          color="text-indigo-300"
        />
        <Var
          label="Applied Shift"
          value={step.appliedShift > 0 ? step.appliedShift : '—'}
          changed={!!p && step.appliedShift !== p.appliedShift && step.appliedShift > 0}
          color="text-emerald-300"
        />
      </div>

      {/* Bad Character Table */}
      {badCharTable.length > 0 && (
        <div>
          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Bad Character Table
          </h4>
          <div className="overflow-x-auto">
            <table className="border-collapse">
              <thead>
                <tr>
                  <th className="w-7 h-6 text-[10px] font-mono text-slate-600 text-right pr-1">j</th>
                  {uniqueChars.map((ch) => (
                    <th key={ch} className="w-7 h-6 text-[10px] font-mono font-bold text-blue-300 text-center">
                      {ch}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {badCharTable.map((row, j) => {
                  const isCurrentRow = j === mismatchIndex;
                  return (
                    <tr key={j}>
                      <td className={`w-7 h-6 text-[10px] font-mono text-right pr-1 ${isCurrentRow ? 'text-amber-400 font-bold' : 'text-slate-600'}`}>
                        {j}
                      </td>
                      {row.map((val, ci) => {
                        const isMismatchChar = isCurrentRow && mismatchIndex >= 0 &&
                          step.text[step.textPos + mismatchIndex] !== undefined &&
                          uniqueChars[ci] === step.text[step.textPos + mismatchIndex];
                        return (
                          <td
                            key={ci}
                            className={`w-7 h-6 text-center text-[10px] font-mono font-bold transition-all duration-300 ${
                              isMismatchChar
                                ? 'bg-rose-500/25 text-rose-300 rounded'
                                : isCurrentRow
                                  ? 'bg-amber-500/10 text-amber-300 rounded'
                                  : 'text-slate-500'
                            }`}
                          >
                            {val}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Z-Suffix Array */}
      {zSuffix.length > 0 && (
        <ArrayDisplay
          label="Z-Suffix (Zs)"
          values={zSuffix}
          highlightIdx={-1}
        />
      )}

      {/* Good Suffix Array */}
      {goodSuffix.length > 0 && (
        <ArrayDisplay
          label="Good Suffix (gs)"
          values={goodSuffix}
          highlightIdx={gsHighlight}
        />
      )}

      {/* Matched Prefix Array */}
      {matchedPrefix.length > 0 && (
        <ArrayDisplay
          label="Matched Prefix (mp)"
          values={matchedPrefix}
          highlightIdx={mpHighlight}
        />
      )}
    </div>
  );
}
