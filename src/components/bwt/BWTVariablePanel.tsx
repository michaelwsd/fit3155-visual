'use client';

import React from 'react';
import { BWTStep } from '@/lib/bwt-types';

interface Props {
  step: BWTStep;
  prevStep: BWTStep | null;
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

export default function BWTVariablePanel({ step, prevStep: p }: Props) {
  const {
    rule,
    suffixArray: sa,
    bwtString,
    rank,
    occTable,
    uniqueChars,
    sp,
    ep,
    patPos,
    currentChar,
  } = step;

  const isSearch = sp >= 0;
  const rangeSize = isSearch && sp <= ep ? ep - sp + 1 : 0;

  return (
    <div className="space-y-5">
      {/* Algorithm State */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
          Algorithm State
        </h3>
        <Var
          label="sp"
          value={isSearch ? sp : '—'}
          changed={!!p && sp !== p.sp}
          color="text-purple-300"
        />
        <Var
          label="ep"
          value={isSearch ? ep : '—'}
          changed={!!p && ep !== p.ep}
          color="text-purple-300"
        />
        <Var
          label="Range Size"
          value={isSearch ? (sp <= ep ? rangeSize : 0) : '—'}
          changed={!!p && rangeSize !== (p.sp >= 0 && p.sp <= p.ep ? p.ep - p.sp + 1 : 0)}
          color="text-blue-300"
        />
        <Var
          label="Pattern Pos (i)"
          value={patPos >= 0 ? patPos : '—'}
          changed={!!p && patPos !== p.patPos}
          color="text-amber-300"
        />
        <Var
          label="Current Char"
          value={currentChar || '—'}
          changed={!!p && currentChar !== p.currentChar}
          color="text-amber-300"
        />
      </div>

      {/* Suffix Array */}
      {sa.length > 0 && (
        <div>
          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Suffix Array
          </h4>
          <div className="flex gap-px flex-wrap">
            {sa.map((val, i) => {
              const inRange = isSearch && i >= sp && i <= ep && sp <= ep;
              return (
                <div key={i} className="flex flex-col items-center">
                  <span
                    className={`w-7 h-6 flex items-center justify-center text-[10px] font-mono font-bold rounded transition-all duration-300 ${
                      inRange
                        ? 'bg-purple-500/25 text-purple-300 ring-1 ring-purple-500/50'
                        : 'bg-slate-800/60 text-slate-400'
                    }`}
                  >
                    {val}
                  </span>
                  <span className="text-[8px] font-mono text-slate-600 mt-0.5">{i}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* BWT String */}
      {bwtString.length > 0 && (
        <div>
          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            BWT String (L)
          </h4>
          <div className="flex gap-px flex-wrap">
            {bwtString.split('').map((ch, i) => {
              const inRange = isSearch && i >= sp && i <= ep && sp <= ep;
              const isCurrentChar = isSearch && ch === currentChar && inRange;
              return (
                <div key={i} className="flex flex-col items-center">
                  <span
                    className={`w-7 h-6 flex items-center justify-center text-[10px] font-mono font-bold rounded transition-all duration-300 ${
                      isCurrentChar
                        ? 'bg-amber-500/25 text-amber-300 ring-1 ring-amber-500/50'
                        : inRange
                          ? 'bg-purple-500/15 text-purple-300'
                          : 'bg-slate-800/60 text-slate-400'
                    }`}
                  >
                    {ch}
                  </span>
                  <span className="text-[8px] font-mono text-slate-600 mt-0.5">{i}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Rank / C Array */}
      {rank.length > 0 && (
        <div>
          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Rank Array
          </h4>
          <div className="overflow-x-auto">
            <table className="border-collapse">
              <thead>
                <tr>
                  <th className="w-7 h-6 text-[10px] font-mono text-slate-600 text-center">char</th>
                  {uniqueChars.map(ch => (
                    <th
                      key={ch}
                      className={`w-7 h-6 text-[10px] font-mono font-bold text-center ${
                        isSearch && ch === currentChar
                          ? 'text-amber-300'
                          : 'text-purple-300'
                      }`}
                    >
                      {ch === '$' ? '$' : ch}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="w-7 h-6 text-[10px] font-mono text-slate-600 text-center">rank</td>
                  {rank.map((val, i) => (
                    <td
                      key={i}
                      className={`w-7 h-6 text-center text-[10px] font-mono font-bold rounded transition-all duration-300 ${
                        isSearch && uniqueChars[i] === currentChar
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'text-slate-400'
                      }`}
                    >
                      {val}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Occurrence Table */}
      {occTable.length > 0 && (
        <div>
          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Occurrence Table
          </h4>
          <div className="overflow-x-auto max-h-48 overflow-y-auto">
            <table className="border-collapse">
              <thead className="sticky top-0 bg-slate-950">
                <tr>
                  <th className="w-7 h-6 text-[10px] font-mono text-slate-600 text-right pr-1">i</th>
                  {uniqueChars.map(ch => (
                    <th
                      key={ch}
                      className={`w-7 h-6 text-[10px] font-mono font-bold text-center ${
                        isSearch && ch === currentChar
                          ? 'text-amber-300'
                          : 'text-purple-300'
                      }`}
                    >
                      {ch === '$' ? '$' : ch}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {occTable.map((row, i) => {
                  const isSp = isSearch && i === sp && sp <= ep;
                  const isEp = isSearch && i === ep && sp <= ep;
                  const inRange = isSearch && i >= sp && i <= ep && sp <= ep;
                  return (
                    <tr key={i}>
                      <td
                        className={`w-7 h-6 text-[10px] font-mono text-right pr-1 ${
                          isSp || isEp
                            ? 'text-purple-400 font-bold'
                            : inRange
                              ? 'text-purple-400/60'
                              : 'text-slate-600'
                        }`}
                      >
                        {i}
                        {isSp ? '→' : isEp ? '→' : ''}
                      </td>
                      {row.map((val, ci) => {
                        const isCharCol = isSearch && uniqueChars[ci] === currentChar;
                        return (
                          <td
                            key={ci}
                            className={`w-7 h-6 text-center text-[10px] font-mono font-bold transition-all duration-300 ${
                              (isSp || isEp) && isCharCol
                                ? 'bg-amber-500/25 text-amber-300 rounded'
                                : isSp || isEp
                                  ? 'bg-purple-500/15 text-purple-300 rounded'
                                  : inRange
                                    ? 'text-purple-300/60'
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
    </div>
  );
}
