'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { HungarianStep, HungarianStepRule } from '@/lib/hungarian-types';
import HungarianVisualization from '@/components/hungarian/HungarianVisualization';
import HungarianVariablePanel from '@/components/hungarian/HungarianVariablePanel';
import HungarianStepControls from '@/components/hungarian/HungarianStepControls';
import MatrixInputModal from '@/components/hungarian/MatrixInputModal';
import { useTheme } from '@/components/ThemeProvider';

const DEFAULT_MATRIX = [
  [11, 7, 10, 17, 10],
  [13, 21, 7, 11, 13],
  [13, 13, 15, 13, 14],
  [18, 10, 13, 16, 14],
  [12, 8, 16, 19, 10],
];


const ITER_STARTS: HungarianStepRule[] = ['init', 'assign', 'complete'];

export default function HungarianPage() {
  const [showModal, setShowModal] = useState(false);
  const [matrix, setMatrix] = useState(DEFAULT_MATRIX);
  const [steps, setSteps] = useState<HungarianStep[]>([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1000);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { theme, toggle: toggleTheme } = useTheme();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch('/api/hungarian', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matrix }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          setSteps(data.steps);
          setStepIndex(0);
          setTimeout(() => { if (!cancelled) setLoading(false); }, 600);
        }
      })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [matrix]);

  const step: HungarianStep | null = steps[stepIndex] ?? null;
  const prevStep: HungarianStep | null = stepIndex > 0 ? steps[stepIndex - 1] : null;

  const goTo = useCallback(
    (idx: number) => setStepIndex(Math.max(0, Math.min(steps.length - 1, idx))),
    [steps.length],
  );

  const nextStep = useCallback(() => {
    setStepIndex((prev) => {
      if (prev >= steps.length - 1) { setIsPlaying(false); return prev; }
      return prev + 1;
    });
  }, [steps.length]);

  const prevStepFn = useCallback(() => goTo(stepIndex - 1), [goTo, stepIndex]);

  const nextPhase = useCallback(() => {
    const currentIter = step?.iteration ?? 0;
    const idx = steps.findIndex((s, i) => i > stepIndex && ITER_STARTS.includes(s.rule) && s.iteration > currentIter);
    goTo(idx >= 0 ? idx : steps.length - 1);
  }, [step, stepIndex, steps, goTo]);

  const prevPhase = useCallback(() => {
    const currentIter = step?.iteration ?? 0;
    const targetIter = currentIter > 1 ? currentIter - 1 : 0;
    let target = -1;
    for (let i = stepIndex - 1; i >= 0; i--) {
      if (ITER_STARTS.includes(steps[i].rule) && steps[i].iteration <= targetIter) {
        target = i;
        break;
      }
    }
    goTo(target >= 0 ? target : 0);
  }, [step, stepIndex, steps, goTo]);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (isPlaying) timerRef.current = setInterval(nextStep, speed);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isPlaying, speed, nextStep]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowRight' || e.key === 'l') nextStep();
      else if (e.key === 'ArrowLeft' || e.key === 'h') prevStepFn();
      else if (e.key === 'ArrowUp' || e.key === 'k') prevPhase();
      else if (e.key === 'ArrowDown' || e.key === 'j') nextPhase();
      else if (e.key === ' ') { e.preventDefault(); setIsPlaying((p) => !p); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [nextStep, prevStepFn, nextPhase, prevPhase]);

  const handleRunMatrix = (m: number[][]) => {
    setMatrix(m);
    setStepIndex(0);
    setIsPlaying(false);
    setShowModal(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-6">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="animate-spin-slow">
          <circle cx="24" cy="24" r="20" stroke="#334155" strokeWidth="3" />
          <path d="M24 4a20 20 0 0 1 20 20" stroke="url(#h-loading-grad)" strokeWidth="3" strokeLinecap="round" />
          <defs>
            <linearGradient id="h-loading-grad" x1="24" y1="4" x2="44" y2="24">
              <stop stopColor="#f43f5e" />
              <stop offset="1" stopColor="#e11d48" />
            </linearGradient>
          </defs>
        </svg>
        <div className="flex flex-col items-center gap-2">
          <p className="text-slate-300 text-sm font-medium">Running Hungarian Algorithm</p>
          <div className="flex gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500/80 animate-bounce [animation-delay:0ms]" />
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500/80 animate-bounce [animation-delay:150ms]" />
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500/80 animate-bounce [animation-delay:300ms]" />
          </div>
        </div>
      </div>
    );
  }

  if (!step) return null;

  return (
    <div className="min-h-screen lg:h-screen bg-slate-950 text-slate-200 flex flex-col overflow-x-hidden overflow-y-auto lg:overflow-hidden">
      <header className="border-b border-slate-800 px-6 py-4">
        <div className="max-w-400 mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="ml-12">
            <h1 className="text-lg font-bold text-slate-100">Hungarian Algorithm</h1>
            <p className="text-xs text-slate-500 mt-0.5">Arrow keys to navigate, Space to play/pause</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowModal(true)}
              className="group px-4 py-1.5 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 text-sm font-bold transition-all flex items-center gap-2"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="opacity-60 group-hover:opacity-100 transition-opacity">
                <rect x="2" y="2" width="12" height="12" rx="1.5" />
                <path d="M2 6h12M6 2v12" />
              </svg>
              Edit Matrix
            </button>
            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
              aria-label="Toggle theme"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row lg:overflow-hidden">
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 min-h-75 relative">
            <HungarianVisualization step={step} />
          </div>
          <div className="px-6 py-4 border-t border-slate-800">
            <HungarianStepControls
              currentIndex={stepIndex}
              totalSteps={steps.length}
              step={step}
              onPrev={prevStepFn}
              onNext={nextStep}
              onPrevPhase={prevPhase}
              onNextPhase={nextPhase}
              onReset={() => { goTo(0); setIsPlaying(false); }}
              onGoToEnd={() => { goTo(steps.length - 1); setIsPlaying(false); }}
              isPlaying={isPlaying}
              onTogglePlay={() => setIsPlaying((p) => !p)}
              speed={speed}
              onSpeedChange={setSpeed}
            />
          </div>
        </div>

        <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col">
          <div className="p-5 flex-1 overflow-y-auto space-y-6">
            <HungarianVariablePanel step={step} prevStep={prevStep} />
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Explanation</h3>
              <p className="text-sm text-slate-300 leading-relaxed">{step.explanation}</p>
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Legend</h3>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-rose-500/25 ring-1 ring-inset ring-rose-500/50" />
                  <span className="text-slate-400">Assigned Cell</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-slate-800/30 text-slate-600 flex items-center justify-center text-[8px] line-through">0</span>
                  <span className="text-slate-400">Crossed Out</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-amber-500/35 ring-1 ring-inset ring-amber-500/40" />
                  <span className="text-slate-400">Covered (Vertex Cover)</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400">
                    <path d="M2 8.5l4 4 8-8" />
                  </svg>
                  <span className="text-slate-400">Marked</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-emerald-500/25 ring-1 ring-inset ring-emerald-400/60" />
                  <span className="text-slate-400">θ (Min Uncovered)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <MatrixInputModal
          initialMatrix={matrix}
          onRun={handleRunMatrix}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
