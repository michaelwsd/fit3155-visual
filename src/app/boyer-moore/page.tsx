'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { BMStep } from '@/lib/boyer-moore-types';
import BMVisualization from '@/components/boyer-moore/BMVisualization';
import BMVariablePanel from '@/components/boyer-moore/BMVariablePanel';
import BMStepControls from '@/components/boyer-moore/BMStepControls';
import { useTheme } from '@/components/ThemeProvider';

export default function BoyerMoorePage() {
  const [inputPattern, setInputPattern] = useState('abca');
  const [inputText, setInputText] = useState('aaxbcabcaaxabcabc');
  const [pattern, setPattern] = useState('abca');
  const [text, setText] = useState('aaxbcabcaaxabcabc');
  const [steps, setSteps] = useState<BMStep[]>([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1000);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { theme, toggle: toggleTheme } = useTheme();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch('/api/boyer-moore', {
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

  const step: BMStep | null = steps[stepIndex] ?? null;
  const prevStep: BMStep | null = stepIndex > 0 ? steps[stepIndex - 1] : null;

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

  const nextAlign = useCallback(() => {
    const currentPos = step?.textPos ?? -1;
    const idx = steps.findIndex(
      (s, i) => i > stepIndex && s.rule === 'align' && s.textPos > currentPos,
    );
    goTo(idx >= 0 ? idx : steps.length - 1);
  }, [step, stepIndex, steps, goTo]);

  const prevAlign = useCallback(() => {
    let target = -1;
    for (let i = stepIndex - 1; i >= 0; i--) {
      if (steps[i].rule === 'align') {
        if (steps[i].textPos < (step?.textPos ?? 0)) {
          target = i;
          break;
        }
        if (i < stepIndex - 1 && steps[i].textPos === step?.textPos) {
          target = i;
          break;
        }
      }
    }
    goTo(target >= 0 ? target : 0);
  }, [step, stepIndex, steps, goTo]);

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
      else if (e.key === 'ArrowUp' || e.key === 'k') prevAlign();
      else if (e.key === 'ArrowDown' || e.key === 'j') nextAlign();
      else if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying((p) => !p);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [nextStep, prevStepFn, nextAlign, prevAlign]);

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
          <path d="M24 4a20 20 0 0 1 20 20" stroke="url(#bm-loading-grad)" strokeWidth="3" strokeLinecap="round" />
          <defs>
            <linearGradient id="bm-loading-grad" x1="24" y1="4" x2="44" y2="24">
              <stop stopColor="#3b82f6" />
              <stop offset="1" stopColor="#2563eb" />
            </linearGradient>
          </defs>
        </svg>
        <div className="flex flex-col items-center gap-2">
          <p className="text-slate-300 text-sm font-medium">Preprocessing pattern</p>
          <div className="flex gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500/80 animate-bounce [animation-delay:0ms]" />
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500/80 animate-bounce [animation-delay:150ms]" />
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500/80 animate-bounce [animation-delay:300ms]" />
          </div>
        </div>
      </div>
    );
  }

  if (!step) return null;

  return (
    <div className="h-screen bg-slate-950 text-slate-200 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="border-b border-slate-800 px-6 py-4">
        <div className="max-w-400 mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="ml-12">
            <h1 className="text-lg font-bold text-slate-100">
              Boyer-Moore — Step-by-Step Visualizer
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
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm font-mono text-slate-200 w-28 focus:outline-none focus:ring-1 focus:ring-blue-500/50 placeholder:text-slate-600"
              maxLength={20}
            />
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="Text"
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm font-mono text-slate-200 w-40 focus:outline-none focus:ring-1 focus:ring-blue-500/50 placeholder:text-slate-600"
              maxLength={30}
            />
            <button
              onClick={handleSubmit}
              className="px-4 py-1.5 rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 text-sm font-bold transition-colors"
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

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left: Visualization + controls */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 min-h-75 relative">
            <BMVisualization step={step} />
          </div>
          <div className="px-6 py-4 border-t border-slate-800">
            <BMStepControls
              currentIndex={stepIndex}
              totalSteps={steps.length}
              step={step}
              onPrev={prevStepFn}
              onNext={nextStep}
              onPrevAlign={prevAlign}
              onNextAlign={nextAlign}
              onReset={() => { goTo(0); setIsPlaying(false); }}
              onGoToEnd={() => { goTo(steps.length - 1); setIsPlaying(false); }}
              isPlaying={isPlaying}
              onTogglePlay={() => setIsPlaying((p) => !p)}
              speed={speed}
              onSpeedChange={setSpeed}
            />
          </div>
        </div>

        {/* Right: Variable panel + explanation */}
        <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col">
          <div className="p-5 flex-1 overflow-y-auto space-y-6">
            <BMVariablePanel step={step} prevStep={prevStep} />

            {/* Explanation */}
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Explanation
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                {step.explanation}
              </p>
            </div>

            {/* Legend */}
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Legend
              </h3>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-amber-900/60 ring-1 ring-amber-500/70" />
                  <span className="text-slate-400">Current Comparison</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-emerald-900/40 ring-1 ring-emerald-500/50" />
                  <span className="text-slate-400">Matched Character</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-rose-900/50 ring-1 ring-rose-500/50" />
                  <span className="text-slate-400">Mismatch</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-slate-800 ring-1 ring-slate-600/50" />
                  <span className="text-slate-400">Not Yet Compared</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
