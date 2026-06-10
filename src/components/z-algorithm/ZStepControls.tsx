'use client';

import React from 'react';
import { ZAlgorithmStep, ZStepRule } from '@/lib/z-algorithm-types';

interface Props {
  currentIndex: number;
  totalSteps: number;
  step: ZAlgorithmStep;
  onPrev: () => void;
  onNext: () => void;
  onPrevPosition: () => void;
  onNextPosition: () => void;
  onReset: () => void;
  onGoToEnd: () => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
}

function RuleBadge({ rule }: { rule: ZStepRule }) {
  const map: Record<ZStepRule, { label: string; color: string }> = {
    init: {
      label: 'Initialization',
      color: 'bg-slate-500/20 text-slate-300 ring-slate-500/30',
    },
    case_outside: {
      label: 'Outside Z-box',
      color: 'bg-orange-500/20 text-orange-300 ring-orange-500/30',
    },
    case_inside: {
      label: 'Inside Z-box',
      color: 'bg-indigo-500/20 text-indigo-300 ring-indigo-500/30',
    },
    scan: {
      label: 'Scan Complete',
      color: 'bg-blue-500/20 text-blue-300 ring-blue-500/30',
    },
    copy: {
      label: 'Copy Z[k1]',
      color: 'bg-cyan-500/20 text-cyan-300 ring-cyan-500/30',
    },
    match: {
      label: 'Pattern Match!',
      color: 'bg-emerald-500/20 text-emerald-300 ring-emerald-500/30',
    },
    complete: {
      label: 'Complete',
      color: 'bg-emerald-500/20 text-emerald-300 ring-emerald-500/30',
    },
  };
  const info = map[rule] || { label: rule, color: 'bg-slate-700 text-slate-300' };

  return (
    <span
      className={`inline-block px-3 py-1 rounded-full text-xs font-bold ring-1 ${info.color}`}
    >
      {info.label}
    </span>
  );
}

export default function ZStepControls({
  currentIndex,
  totalSteps,
  step,
  onPrev,
  onNext,
  onPrevPosition,
  onNextPosition,
  onReset,
  onGoToEnd,
  isPlaying,
  onTogglePlay,
  speed,
  onSpeedChange,
}: Props) {
  return (
    <div className="space-y-4">
      {/* Position / Rule header */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="bg-slate-800 rounded-lg px-3 py-1.5">
          <span className="text-xs text-slate-500">Position </span>
          <span className="text-sm font-bold text-amber-400">
            {step.rule !== 'init' && step.rule !== 'complete'
              ? step.position
              : '—'}
          </span>
          <span className="text-xs text-slate-600"> / {step.combined.length - 1}</span>
        </div>
        <RuleBadge rule={step.rule} />
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={onReset}
          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
        >
          Reset
        </button>
        <button
          onClick={onPrevPosition}
          disabled={currentIndex === 0}
          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 text-xs font-medium transition-colors"
        >
          Prev Pos
        </button>
        <button
          onClick={onPrev}
          disabled={currentIndex === 0}
          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 text-xs font-medium transition-colors"
        >
          Prev
        </button>
        <button
          onClick={onTogglePlay}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            isPlaying
              ? 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30'
              : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
          }`}
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <button
          onClick={onNext}
          disabled={currentIndex >= totalSteps - 1}
          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 text-xs font-medium transition-colors"
        >
          Next
        </button>
        <button
          onClick={onNextPosition}
          disabled={currentIndex >= totalSteps - 1}
          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 text-xs font-medium transition-colors"
        >
          Next Pos
        </button>
        <button
          onClick={onGoToEnd}
          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
        >
          End
        </button>
      </div>

      {/* Speed + progress */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-500">Speed</span>
          {(
            [
              { label: 'Slow', ms: 2000 },
              { label: 'Normal', ms: 1000 },
              { label: 'Fast', ms: 400 },
            ] as const
          ).map((preset) => (
            <button
              key={preset.label}
              onClick={() => onSpeedChange(preset.ms)}
              className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                speed === preset.ms
                  ? 'bg-amber-500/25 text-amber-300 ring-1 ring-amber-500/40'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-300'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">
              Step {currentIndex + 1} / {totalSteps}
            </span>
            <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500/60 rounded-full transition-all duration-300"
                style={{
                  width: `${((currentIndex + 1) / totalSteps) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
