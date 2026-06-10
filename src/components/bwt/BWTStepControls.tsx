'use client';

import React from 'react';
import { BWTStep, BWTStepRule } from '@/lib/bwt-types';

interface Props {
  currentIndex: number;
  totalSteps: number;
  step: BWTStep;
  onPrev: () => void;
  onNext: () => void;
  onPrevPhase: () => void;
  onNextPhase: () => void;
  onReset: () => void;
  onGoToEnd: () => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
}

function RuleBadge({ rule }: { rule: BWTStepRule }) {
  const map: Record<BWTStepRule, { label: string; color: string }> = {
    init: { label: 'Initialization', color: 'bg-slate-500/20 text-slate-300 ring-slate-500/30' },
    suffix_array: { label: 'Suffix Array', color: 'bg-purple-500/20 text-purple-300 ring-purple-500/30' },
    bwt_built: { label: 'BWT Built', color: 'bg-purple-500/20 text-purple-300 ring-purple-500/30' },
    rank_built: { label: 'Rank Array', color: 'bg-purple-500/20 text-purple-300 ring-purple-500/30' },
    occ_built: { label: 'Occ Table', color: 'bg-purple-500/20 text-purple-300 ring-purple-500/30' },
    search_start: { label: 'Search Start', color: 'bg-amber-500/20 text-amber-300 ring-amber-500/30' },
    search_step: { label: 'Search Step', color: 'bg-blue-500/20 text-blue-300 ring-blue-500/30' },
    search_fail: { label: 'No Match', color: 'bg-rose-500/20 text-rose-300 ring-rose-500/30' },
    search_done: { label: 'Match Found!', color: 'bg-emerald-500/20 text-emerald-300 ring-emerald-500/30' },
    complete: { label: 'Complete', color: 'bg-emerald-500/20 text-emerald-300 ring-emerald-500/30' },
  };
  const info = map[rule] || { label: rule, color: 'bg-slate-700 text-slate-300' };
  return (
    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ring-1 ${info.color}`}>
      {info.label}
    </span>
  );
}

export default function BWTStepControls({
  currentIndex,
  totalSteps,
  step,
  onPrev,
  onNext,
  onPrevPhase,
  onNextPhase,
  onReset,
  onGoToEnd,
  isPlaying,
  onTogglePlay,
  speed,
  onSpeedChange,
}: Props) {
  const isSearch = step.sp >= 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="bg-slate-800 rounded-lg px-3 py-1.5">
          <span className="text-xs text-slate-500">Range </span>
          <span className="text-sm font-bold text-purple-400">
            {isSearch ? `[${step.sp}, ${step.ep}]` : '—'}
          </span>
        </div>
        <RuleBadge rule={step.rule} />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={onReset}
          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
        >
          Reset
        </button>
        <button
          onClick={onPrevPhase}
          disabled={currentIndex === 0}
          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 text-xs font-medium transition-colors"
        >
          Prev Phase
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
          onClick={onNextPhase}
          disabled={currentIndex >= totalSteps - 1}
          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 text-xs font-medium transition-colors"
        >
          Next Phase
        </button>
        <button
          onClick={onGoToEnd}
          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
        >
          End
        </button>
      </div>

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
                className="h-full bg-purple-500/60 rounded-full transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / totalSteps) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
