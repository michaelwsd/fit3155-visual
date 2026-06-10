'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { BWTStep, BWTStepRule } from '@/lib/bwt-types';
import BWTVisualization from '@/components/bwt/BWTVisualization';
import BWTVariablePanel from '@/components/bwt/BWTVariablePanel';
import BWTStepControls from '@/components/bwt/BWTStepControls';
import { useTheme } from '@/components/ThemeProvider';

const PHASE_STARTS: BWTStepRule[] = ['init', 'search_start', 'search_done', 'search_fail', 'complete'];

export default function BWTPage() {
  const [inputPattern, setInputPattern] = useState('ana');
  const [inputText, setInputText] = useState('banana');
  const [pattern, setPattern] = useState('ana');
  const [text, setText] = useState('banana');
  const [steps, setSteps] = useState<BWTStep[]>([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1000);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { theme, toggle: toggleTheme } = useTheme();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch('/api/bwt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pattern, text }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          setSteps(data.steps);
          setStepIndex(0);
          setTimeout(() => {
            if (!cancelled) setLoading(false);
          }, 600);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [pattern, text]);

  const step: BWTStep | null = steps[stepIndex] ?? null;
  const prevStep: BWTStep | null = stepIndex > 0 ? steps[stepIndex - 1] : null;

  const goTo = useCallback(
    (idx: number) => setStepIndex(Math.max(0, Math.min(steps.length - 1, idx))),
    [steps.length],
  );

  const nextStep = useCallback(() => {
    setStepIndex((prev) => {
      if (prev >= steps.length - 1) {
        setIsPlaying(false);
        return prev;
      }
      return prev + 1;
    });
  }, [steps.length]);

  const prevStepFn = useCallback(() => goTo(stepIndex - 1), [goTo, stepIndex]);

  const nextPhase = useCallback(() => {
    const idx = steps.findIndex(
      (s, i) => i > stepIndex && PHASE_STARTS.includes(s.rule),
    );
    goTo(idx >= 0 ? idx : steps.length - 1);
  }, [stepIndex, steps, goTo]);

  const prevPhase = useCallback(() => {
    let target = -1;
    for (let i = stepIndex - 1; i >= 0; i--) {
      if (PHASE_STARTS.includes(steps[i].rule)) {
        target = i;
        break;
      }
    }
    goTo(target >= 0 ? target : 0);
  }, [stepIndex, steps, goTo]);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (isPlaying) {
      timerRef.current = setInterval(nextStep, speed);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isPlaying, speed, nextStep]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === 'ArrowRight' || e.key === 'l') nextStep();
      else if (e.key === 'ArrowLeft' || e.key === 'h') prevStepFn();
      else if (e.key === 'ArrowUp' || e.key === 'k') prevPhase();
      else if (e.key === 'ArrowDown' || e.key === 'j') nextPhase();
      else if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying((p) => !p);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [nextStep, prevStepFn, nextPhase, prevPhase]);

  const handleSubmit = () => {
    const p = inputPattern.trim();
    const t = inputText.trim();
    if (p.length > 0 && t.length > 0) {
      setPattern(p);
      setText(t);
      setStepIndex(0);
      setIsPlaying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-6">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="animate-spin-slow">
          <circle cx="24" cy="24" r="20" stroke="#334155" strokeWidth="3" />
          <path d="M24 4a20 20 0 0 1 20 20" stroke="url(#bwt-loading-grad)" strokeWidth="3" strokeLinecap="round" />
          <defs>
            <linearGradient id="bwt-loading-grad" x1="24" y1="4" x2="44" y2="24">
              <stop stopColor="#a855f7" />
              <stop offset="1" stopColor="#7c3aed" />
            </linearGradient>
          </defs>
        </svg>
        <div className="flex flex-col items-center gap-2">
          <p className="text-slate-300 text-sm font-medium">Building BWT</p>
          <div className="flex gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500/80 animate-bounce [animation-delay:0ms]" />
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500/80 animate-bounce [animation-delay:150ms]" />
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500/80 animate-bounce [animation-delay:300ms]" />
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
            <h1 className="text-lg font-bold text-slate-100">
              Burrows-Wheeler Transform — Step-by-Step Visualizer
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Arrow keys to navigate, Space to play/pause{' '}
              <span className="text-slate-400 ml-2">Built by Michael Wang</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={inputPattern}
              onChange={(e) => setInputPattern(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="Pattern"
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm font-mono text-slate-200 w-28 focus:outline-none focus:ring-1 focus:ring-purple-500/50 placeholder:text-slate-600"
              maxLength={20}
            />
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="Text"
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm font-mono text-slate-200 w-40 focus:outline-none focus:ring-1 focus:ring-purple-500/50 placeholder:text-slate-600"
              maxLength={30}
            />
            <button
              onClick={handleSubmit}
              className="px-4 py-1.5 rounded-lg bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 text-sm font-bold transition-colors"
            >
              Run
            </button>
            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
              aria-label="Toggle theme"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
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
            <BWTVisualization step={step} />
          </div>
          <div className="px-6 py-4 border-t border-slate-800">
            <BWTStepControls
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
            <BWTVariablePanel step={step} prevStep={prevStep} />

            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Explanation
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                {step.explanation}
              </p>
            </div>

            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Legend
              </h3>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-purple-900/60 ring-1 ring-purple-500/70" />
                  <span className="text-slate-400">Active Range [sp, ep]</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-amber-900/60 ring-1 ring-amber-500/70" />
                  <span className="text-slate-400">Current Character</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-emerald-900/40 ring-1 ring-emerald-500/50" />
                  <span className="text-slate-400">Match Position</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-slate-800 ring-1 ring-slate-600/50" />
                  <span className="text-slate-400">Inactive</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
