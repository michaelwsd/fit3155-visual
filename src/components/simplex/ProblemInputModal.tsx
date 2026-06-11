'use client';

import React, { useState } from 'react';

interface Props {
  initialObjective: number[];
  initialConstraints: { coeffs: number[]; rhs: number }[];
  onRun: (objective: number[], constraints: { coeffs: number[]; rhs: number }[]) => void;
  onClose: () => void;
}

export default function ProblemInputModal({ initialObjective, initialConstraints, onRun, onClose }: Props) {
  const [numVars, setNumVars] = useState(initialObjective.length);
  const [objective, setObjective] = useState<number[]>([...initialObjective]);
  const [constraints, setConstraints] = useState<{ coeffs: number[]; rhs: number }[]>(
    initialConstraints.map((c) => ({ coeffs: [...c.coeffs], rhs: c.rhs })),
  );
  const [error, setError] = useState('');

  const resize = (n: number) => {
    setNumVars(n);
    setObjective((prev) => {
      const next = new Array(n).fill(0);
      for (let i = 0; i < Math.min(prev.length, n); i++) next[i] = prev[i];
      return next;
    });
    setConstraints((prev) =>
      prev.map((c) => {
        const next = new Array(n).fill(0);
        for (let i = 0; i < Math.min(c.coeffs.length, n); i++) next[i] = c.coeffs[i];
        return { coeffs: next, rhs: c.rhs };
      }),
    );
  };

  const addConstraint = () => {
    if (constraints.length >= 8) return;
    setConstraints([...constraints, { coeffs: new Array(numVars).fill(0), rhs: 0 }]);
  };

  const removeConstraint = (idx: number) => {
    if (constraints.length <= 1) return;
    setConstraints(constraints.filter((_, i) => i !== idx));
  };

  const setObjCoeff = (idx: number, val: string) => {
    const num = val === '' || val === '-' ? 0 : parseFloat(val);
    setObjective((prev) => { const n = [...prev]; n[idx] = isNaN(num) ? 0 : num; return n; });
  };

  const setConstraintCoeff = (ci: number, vi: number, val: string) => {
    const num = val === '' || val === '-' ? 0 : parseFloat(val);
    setConstraints((prev) => prev.map((c, i) => i === ci ? { ...c, coeffs: c.coeffs.map((v, j) => j === vi ? (isNaN(num) ? 0 : num) : v) } : c));
  };

  const setConstraintRhs = (ci: number, val: string) => {
    const num = val === '' || val === '-' ? 0 : parseFloat(val);
    setConstraints((prev) => prev.map((c, i) => i === ci ? { ...c, rhs: isNaN(num) ? 0 : num } : c));
  };

  const handleRun = () => {
    for (const c of constraints) {
      if (c.rhs < 0) {
        setError('All RHS values must be non-negative (standard form).');
        return;
      }
    }
    if (objective.every((v) => v === 0)) {
      setError('Objective function cannot be all zeros.');
      return;
    }
    setError('');
    onRun(objective, constraints);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in-up [animation-duration:200ms]" />
      <div
        className="relative bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl shadow-black/40 max-w-2xl w-full p-6 animate-fade-in-up [animation-duration:300ms] max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
          aria-label="Close"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M4 4l8 8M12 4l-8 8" />
          </svg>
        </button>

        <h2 className="text-lg font-bold text-slate-100 mb-5">Linear Programming Problem</h2>

        {/* Number of variables */}
        <div className="flex items-center gap-3 mb-5">
          <span className="text-sm text-slate-400">Decision Variables:</span>
          <div className="flex items-center gap-1">
            {[2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => resize(n)}
                className={`w-8 h-8 rounded-lg text-sm font-bold transition-colors ${
                  numVars === n
                    ? 'bg-cyan-500/25 text-cyan-300 ring-1 ring-cyan-500/40'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-300'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <span className="text-xs text-slate-500">
            ({Array.from({ length: numVars }, (_, i) => `x${i + 1}`).join(', ')} {'≥'} 0)
          </span>
        </div>

        {/* Objective function */}
        <div className="mb-5">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Maximize</h3>
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-sm text-emerald-400 font-bold mr-1">z =</span>
            {Array.from({ length: numVars }, (_, i) => (
              <div key={i} className="flex items-center gap-1">
                {i > 0 && <span className="text-sm text-slate-500">+</span>}
                <input
                  type="number"
                  value={objective[i] || ''}
                  onChange={(e) => setObjCoeff(i, e.target.value)}
                  className="w-16 h-8 rounded-lg bg-slate-800 border border-slate-700 text-center text-sm font-mono text-slate-200 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
                  placeholder="0"
                />
                <span className="text-sm font-mono text-cyan-400">x{i + 1}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Constraints */}
        <div className="mb-5">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Subject to</h3>
          <div className="space-y-2">
            {constraints.map((c, ci) => (
              <div key={ci} className="flex items-center gap-1 flex-wrap">
                {Array.from({ length: numVars }, (_, vi) => (
                  <div key={vi} className="flex items-center gap-1">
                    {vi > 0 && <span className="text-sm text-slate-500">+</span>}
                    <input
                      type="number"
                      value={c.coeffs[vi] || ''}
                      onChange={(e) => setConstraintCoeff(ci, vi, e.target.value)}
                      className="w-16 h-8 rounded-lg bg-slate-800 border border-slate-700 text-center text-sm font-mono text-slate-200 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
                      placeholder="0"
                    />
                    <span className="text-sm font-mono text-cyan-400">x{vi + 1}</span>
                  </div>
                ))}
                <span className="text-sm text-slate-400 mx-1">{'≤'}</span>
                <input
                  type="number"
                  value={c.rhs || ''}
                  onChange={(e) => setConstraintRhs(ci, e.target.value)}
                  className="w-16 h-8 rounded-lg bg-slate-800 border border-slate-700 text-center text-sm font-mono text-amber-300 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
                  placeholder="0"
                />
                <button
                  onClick={() => removeConstraint(ci)}
                  disabled={constraints.length <= 1}
                  className="ml-1 w-7 h-7 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-500 hover:text-red-400 disabled:opacity-30 flex items-center justify-center transition-colors"
                  aria-label="Remove constraint"
                >
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M4 8h8" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
          {constraints.length < 8 && (
            <button
              onClick={addConstraint}
              className="mt-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs font-medium transition-colors flex items-center gap-1.5"
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M8 4v8M4 8h8" />
              </svg>
              Add Constraint
            </button>
          )}
        </div>

        {error && (
          <p className="text-sm text-red-400 mb-4">{error}</p>
        )}

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleRun}
            className="px-5 py-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-sm font-bold transition-colors ring-1 ring-cyan-500/30"
          >
            Run Simplex
          </button>
        </div>
      </div>
    </div>
  );
}
