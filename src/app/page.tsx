'use client';

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { StepSnapshot, TreeNode } from '@/lib/types';
import TreeVisualization from '@/components/TreeVisualization';
import VariablePanel from '@/components/VariablePanel';
import StringDisplay from '@/components/StringDisplay';
import StepControls from '@/components/StepControls';
import { useTheme } from '@/components/ThemeProvider';

interface DfsFrame {
  currentNodeId: number;
  currentEdge: [number, number] | null;
  trailEdges: [number, number][];
  suffixArray: number[];
}

function computeDfsFrames(nodes: TreeNode[], txt: string, leafEnd: number): DfsFrame[] {
  const nodeById = new Map<number, TreeNode>();
  for (const n of nodes) nodeById.set(n.id, n);
  const getEnd = (n: TreeNode) => (n.end === 'leaf' ? leafEnd : n.end);

  const frames: DfsFrame[] = [];
  const trailEdges: [number, number][] = [];
  const suffixArray: number[] = [];

  function dfs(nodeId: number, fromEdge: [number, number] | null) {
    const node = nodeById.get(nodeId)!;
    if (node.isLeaf) suffixArray.push(node.suffixIndex);

    frames.push({
      currentNodeId: nodeId,
      currentEdge: fromEdge,
      trailEdges: [...trailEdges],
      suffixArray: [...suffixArray],
    });

    if (fromEdge) trailEdges.push(fromEdge);

    const children = (node.children.filter((c) => c !== null) as number[]).sort((a, b) => {
      const ac = nodeById.get(a)!;
      const bc = nodeById.get(b)!;
      const aLabel = txt.slice(ac.start, getEnd(ac) + 1);
      const bLabel = txt.slice(bc.start, getEnd(bc) + 1);
      return aLabel < bLabel ? -1 : aLabel > bLabel ? 1 : 0;
    });

    for (const childId of children) {
      dfs(childId, [nodeId, childId]);
    }
  }

  dfs(0, null);
  return frames;
}

export default function Home() {
  const [inputText, setInputText] = useState('abcabc$');
  const [text, setText] = useState('abcabc$');
  const [steps, setSteps] = useState<StepSnapshot[]>([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1000);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { theme, toggle: toggleTheme } = useTheme();

  const [dfsFrames, setDfsFrames] = useState<DfsFrame[]>([]);
  const [dfsIndex, setDfsIndex] = useState(-1);
  const [isDfsPlaying, setIsDfsPlaying] = useState(false);
  const dfsTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch steps from server API
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch('/api/build-steps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ txt: text }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          setSteps(data.steps);
          setStepIndex(0);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [text]);

  const step: StepSnapshot | null = steps[stepIndex] ?? null;
  const prevStep: StepSnapshot | null = stepIndex > 0 ? steps[stepIndex - 1] : null;

  const goTo = useCallback(
    (idx: number) => setStepIndex(Math.max(0, Math.min(steps.length - 1, idx))),
    [steps.length]
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
    const currentPhase = step?.phase ?? 0;
    const idx = steps.findIndex((s, i) => i > stepIndex && s.phase > currentPhase);
    goTo(idx >= 0 ? idx : steps.length - 1);
  }, [step, stepIndex, steps, goTo]);

  const prevPhase = useCallback(() => {
    const currentPhase = step?.phase ?? 0;
    const targetPhase = currentPhase - 1;
    if (targetPhase < 0) {
      goTo(0);
      return;
    }
    const idx = steps.findIndex((s) => s.phase === targetPhase);
    goTo(idx >= 0 ? idx : 0);
  }, [step, steps, goTo]);

  // Autoplay
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (isPlaying) {
      timerRef.current = setInterval(nextStep, speed);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, speed, nextStep]);

  // DFS autoplay
  useEffect(() => {
    if (dfsTimerRef.current) clearInterval(dfsTimerRef.current);
    if (isDfsPlaying && dfsFrames.length > 0) {
      dfsTimerRef.current = setInterval(() => {
        setDfsIndex((prev) => {
          if (prev >= dfsFrames.length - 1) {
            setIsDfsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, speed);
    }
    return () => { if (dfsTimerRef.current) clearInterval(dfsTimerRef.current); };
  }, [isDfsPlaying, speed, dfsFrames.length]);

  // Clear DFS when step changes
  useEffect(() => {
    setDfsFrames([]);
    setDfsIndex(-1);
    setIsDfsPlaying(false);
  }, [stepIndex]);

  const startDfs = useCallback(() => {
    if (!step) return;
    const frames = computeDfsFrames(step.nodes, step.txt, step.leafEnd);
    setDfsFrames(frames);
    setDfsIndex(0);
    setIsDfsPlaying(true);
  }, [step]);

  const dfsFrame = dfsIndex >= 0 && dfsIndex < dfsFrames.length ? dfsFrames[dfsIndex] : null;

  const dfsHighlight = useMemo(() => {
    if (!dfsFrame) return null;
    const trailEdgeSet = new Set<string>();
    const trailNodeSet = new Set<number>();
    trailNodeSet.add(0);
    for (const [from, to] of dfsFrame.trailEdges) {
      trailEdgeSet.add(`${from}-${to}`);
      trailNodeSet.add(from);
      trailNodeSet.add(to);
    }
    if (dfsFrame.currentEdge) {
      trailEdgeSet.add(`${dfsFrame.currentEdge[0]}-${dfsFrame.currentEdge[1]}`);
    }
    trailNodeSet.add(dfsFrame.currentNodeId);
    return {
      currentNodeId: dfsFrame.currentNodeId,
      currentEdge: dfsFrame.currentEdge,
      trailEdges: trailEdgeSet,
      trailNodes: trailNodeSet,
    };
  }, [dfsFrame]);

  // Keyboard shortcuts
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
    const val = inputText.trim();
    if (val.length > 0) {
      setText(val);
      setStepIndex(0);
      setIsPlaying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-slate-400 text-sm">Building suffix tree...</p>
      </div>
    );
  }

  if (!step) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 px-6 py-4">
        <div className="max-w-400 mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-lg font-bold text-slate-100">
              Ukkonen&apos;s Suffix Tree — Step-by-Step Visualizer
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Arrow keys to navigate, Space to play/pause <span className="text-slate-400 ml-2">Built by Michael Wang</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="Enter string (e.g. abcabc$)"
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm font-mono text-slate-200 w-52 focus:outline-none focus:ring-1 focus:ring-amber-500/50 placeholder:text-slate-600"
              maxLength={20}
            />
            <button
              onClick={handleSubmit}
              className="px-4 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-sm font-bold transition-colors"
            >
              Build
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
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
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
        {/* Left: Tree + controls */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* String display */}
          <div className="px-6 py-3 border-b border-slate-800/50">
            <StringDisplay step={step} />
          </div>

          {/* Tree */}
          <div className="flex-1 min-h-75 relative">
            <TreeVisualization step={step} prevStep={prevStep} dfsHighlight={dfsHighlight} />
          </div>

          {/* Controls */}
          <div className="px-6 py-4 border-t border-slate-800">
            <StepControls
              currentIndex={stepIndex}
              totalSteps={steps.length}
              step={step}
              onPrev={prevStepFn}
              onNext={nextStep}
              onPrevPhase={prevPhase}
              onNextPhase={nextPhase}
              onReset={() => {
                goTo(0);
                setIsPlaying(false);
              }}
              onGoToEnd={() => {
                goTo(steps.length - 1);
                setIsPlaying(false);
              }}
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
            <VariablePanel step={step} prevStep={prevStep} />

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
                  <span className="w-3 h-3 rounded-full bg-amber-500/40 ring-1 ring-amber-500" />
                  <span className="text-slate-400">Active Node</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500/40 ring-1 ring-emerald-500" />
                  <span className="text-slate-400">Newly Created Node</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-violet-500/40 ring-1 ring-violet-500" />
                  <span className="text-slate-400">Last New Internal Node</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-8 h-0.5 border-t-2 border-dashed border-blue-400" />
                  <span className="text-slate-400">Suffix Link</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-orange-500/40 ring-1 ring-orange-500" />
                  <span className="text-slate-400">DFS Traversal</span>
                </div>
              </div>
            </div>

            {/* Suffix Array */}
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Suffix Array
              </h3>
              {dfsFrames.length === 0 ? (
                <button
                  onClick={startDfs}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-orange-500/20 to-amber-500/20 text-orange-300 border border-orange-500/30 text-xs font-bold transition-all duration-200 hover:from-orange-500/30 hover:to-amber-500/30 hover:border-orange-500/50 hover:shadow-[0_0_12px_rgba(249,115,22,0.15)] hover:scale-[1.03] active:scale-[0.97]"
                >
                  Generate via DFS
                </button>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      onClick={() => {
                        if (dfsIndex >= dfsFrames.length - 1) {
                          setDfsIndex(0);
                          setIsDfsPlaying(true);
                        } else {
                          setIsDfsPlaying((p) => !p);
                        }
                      }}
                      className={`px-2.5 py-1 rounded text-xs font-bold transition-colors ${
                        isDfsPlaying
                          ? 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30'
                          : 'bg-orange-500/20 text-orange-300 hover:bg-orange-500/30'
                      }`}
                    >
                      {isDfsPlaying ? 'Pause' : dfsIndex >= dfsFrames.length - 1 ? 'Replay' : 'Play'}
                    </button>
                    <button
                      onClick={() => {
                        setIsDfsPlaying(false);
                        setDfsIndex((i) => Math.min(i + 1, dfsFrames.length - 1));
                      }}
                      disabled={dfsIndex >= dfsFrames.length - 1}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 text-xs font-medium transition-colors"
                    >
                      Step
                    </button>
                    <button
                      onClick={() => {
                        setDfsFrames([]);
                        setDfsIndex(-1);
                        setIsDfsPlaying(false);
                      }}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                    >
                      Clear
                    </button>
                    <span className="text-xs text-slate-500">
                      {dfsIndex + 1} / {dfsFrames.length}
                    </span>
                  </div>
                  {dfsFrame && (
                    <div className="flex flex-wrap gap-1">
                      {dfsFrame.suffixArray.map((si, i) => {
                        const isLatest = i === dfsFrame.suffixArray.length - 1 &&
                          (dfsIndex === 0 || dfsFrame.suffixArray.length !== dfsFrames[dfsIndex - 1]?.suffixArray.length);
                        return (
                          <span
                            key={i}
                            className={`inline-flex items-center justify-center w-7 h-7 rounded text-xs font-mono font-bold transition-all duration-300 ${
                              isLatest
                                ? 'bg-orange-500/30 text-orange-300 ring-1 ring-orange-500/50 scale-110'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {si}
                          </span>
                        );
                      })}
                    </div>
                  )}
                  {dfsIndex >= dfsFrames.length - 1 && dfsFrame && (
                    <p className="text-xs text-orange-300 font-semibold">
                      SA = [{dfsFrame.suffixArray.join(', ')}]
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
