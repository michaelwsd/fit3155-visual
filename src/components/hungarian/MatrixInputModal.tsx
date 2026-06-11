'use client';

import { useState, useRef, useEffect } from 'react';

const DEFAULT_MATRIX = [
  [11, 7, 10, 17, 10],
  [13, 21, 7, 11, 13],
  [13, 13, 15, 13, 14],
  [18, 10, 13, 16, 14],
  [12, 8, 16, 19, 10],
];

interface Props {
  initialMatrix: number[][];
  onRun: (matrix: number[][]) => void;
  onClose: () => void;
}

function makeEmpty(n: number): string[][] {
  return Array.from({ length: n }, () => Array.from({ length: n }, () => ''));
}

function matrixToStrings(m: number[][]): string[][] {
  return m.map((row) => row.map((v) => String(v)));
}

function randomMatrix(n: number): string[][] {
  return Array.from({ length: n }, () =>
    Array.from({ length: n }, () => String(Math.floor(Math.random() * 30) + 1)),
  );
}

export default function MatrixInputModal({ initialMatrix, onRun, onClose }: Props) {
  const [n, setN] = useState(initialMatrix.length);
  const [cells, setCells] = useState<string[][]>(matrixToStrings(initialMatrix));
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const changeSize = (newN: number) => {
    setN(newN);
    setCells((prev) => {
      const next = makeEmpty(newN);
      for (let i = 0; i < Math.min(prev.length, newN); i++) {
        for (let j = 0; j < Math.min(prev[i].length, newN); j++) {
          next[i][j] = prev[i][j];
        }
      }
      return next;
    });
  };

  const updateCell = (i: number, j: number, val: string) => {
    setCells((prev) => {
      const next = prev.map((row) => [...row]);
      next[i][j] = val;
      return next;
    });
  };

  const handleRun = () => {
    const matrix = cells.map((row) =>
      row.map((v) => {
        const num = Number(v);
        return Number.isFinite(num) ? num : 0;
      }),
    );
    onRun(matrix);
  };

  const handleExample = () => {
    setN(DEFAULT_MATRIX.length);
    setCells(matrixToStrings(DEFAULT_MATRIX));
  };

  const handleRandom = () => {
    setCells(randomMatrix(n));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, i: number, j: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleRun();
      return;
    }
    let nextI = i;
    let nextJ = j;
    if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault();
      nextJ = j + 1;
      if (nextJ >= n) { nextJ = 0; nextI = i + 1; }
      if (nextI >= n) { handleRun(); return; }
    } else if (e.key === 'Tab' && e.shiftKey) {
      e.preventDefault();
      nextJ = j - 1;
      if (nextJ < 0) { nextJ = n - 1; nextI = i - 1; }
      if (nextI < 0) return;
    } else if (e.key === 'ArrowDown') {
      nextI = Math.min(i + 1, n - 1);
    } else if (e.key === 'ArrowUp') {
      nextI = Math.max(i - 1, 0);
    } else if (e.key === 'ArrowRight' && (e.target as HTMLInputElement).selectionStart === (e.target as HTMLInputElement).value.length) {
      nextJ = Math.min(j + 1, n - 1);
    } else if (e.key === 'ArrowLeft' && (e.target as HTMLInputElement).selectionStart === 0) {
      nextJ = Math.max(j - 1, 0);
    } else {
      return;
    }
    const input = gridRef.current?.querySelector(`[data-cell="${nextI}-${nextJ}"]`) as HTMLInputElement | null;
    input?.focus();
    input?.select();
  };

  const isValid = cells.every((row) => row.every((v) => v.trim() !== '' && Number.isFinite(Number(v))));

  const inputSize = n <= 4 ? 'w-14 h-11 text-sm' : n <= 6 ? 'w-11 h-9 text-xs' : 'w-9 h-8 text-[10px]';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl shadow-black/40 max-w-lg w-full p-6 animate-fade-in-up [animation-duration:200ms]"
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

        <h2 className="text-lg font-bold text-slate-100 mb-5">Cost Matrix</h2>

        {/* Dimension selector */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs text-slate-400 font-medium">Size</span>
          <div className="flex items-center gap-1">
            {[2, 3, 4, 5, 6, 7, 8].map((sz) => (
              <button
                key={sz}
                onClick={() => changeSize(sz)}
                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                  n === sz
                    ? 'bg-rose-500/20 text-rose-300 ring-1 ring-rose-500/30'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                }`}
              >
                {sz}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <button
              onClick={handleExample}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs font-medium transition-colors"
            >
              Example
            </button>
            <button
              onClick={handleRandom}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs font-medium transition-colors"
            >
              Random
            </button>
          </div>
        </div>

        {/* Matrix grid */}
        <div ref={gridRef} className="flex flex-col items-center gap-1 mb-5">
          {/* Column labels */}
          <div className="flex gap-1" style={{ marginLeft: n <= 6 ? '2rem' : '1.5rem' }}>
            {Array.from({ length: n }, (_, j) => (
              <div key={j} className={`${inputSize} flex items-center justify-center text-[10px] text-slate-600 font-mono`}>
                {j + 1}
              </div>
            ))}
          </div>
          {cells.map((row, i) => (
            <div key={i} className="flex items-center gap-1">
              <span className="w-6 text-[10px] text-slate-600 font-mono text-right mr-0.5">{i + 1}</span>
              {row.map((val, j) => (
                <input
                  key={j}
                  data-cell={`${i}-${j}`}
                  type="text"
                  inputMode="numeric"
                  value={val}
                  onChange={(e) => updateCell(i, j, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, i, j)}
                  onFocus={(e) => e.target.select()}
                  className={`${inputSize} rounded-lg bg-slate-800 border border-slate-700/50 text-center font-mono text-slate-200 focus:outline-none focus:ring-1 focus:ring-rose-500/50 focus:border-rose-500/30 transition-all placeholder:text-slate-700`}
                  placeholder="0"
                />
              ))}
            </div>
          ))}
        </div>

        {/* Run button */}
        <button
          onClick={handleRun}
          disabled={!isValid}
          className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all ${
            isValid
              ? 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 cursor-pointer'
              : 'bg-slate-800/50 text-slate-600 cursor-not-allowed'
          }`}
        >
          Run Algorithm
        </button>
      </div>
    </div>
  );
}
