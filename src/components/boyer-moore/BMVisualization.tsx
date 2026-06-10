'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { BMStep } from '@/lib/boyer-moore-types';

interface Props {
  step: BMStep;
}

export default function BMVisualization({ step }: Props) {
  const { text, pattern, textPos, patPos, matchedIndices, mismatchIndex, matchPositions, rule } = step;
  const n = text.length;
  const m = pattern.length;

  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, tx: 0, ty: 0 });

  const matchedSet = new Set(matchedIndices);
  const showAlignmentInfo = rule !== 'init' && rule !== 'complete';

  const fitToView = useCallback(() => {
    if (!containerRef.current || !contentRef.current) return;
    const cRect = containerRef.current.getBoundingClientRect();
    const natW = contentRef.current.scrollWidth;
    const natH = contentRef.current.scrollHeight;
    const padding = 50;
    const scaleX = (cRect.width - padding * 2) / Math.max(natW, 1);
    const scaleY = (cRect.height - padding * 2) / Math.max(natH, 1);
    const scale = Math.min(scaleX, scaleY, 1.5);
    const finalScale = Math.max(scale, 0.3);
    const contentW = natW * finalScale;
    const contentH = natH * finalScale;
    setTransform({
      x: (cRect.width - contentW) / 2,
      y: (cRect.height - contentH) / 2,
      scale: finalScale,
    });
  }, []);

  useEffect(() => {
    requestAnimationFrame(fitToView);
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(() => fitToView());
    observer.observe(container);
    return () => observer.disconnect();
  }, [fitToView, text, pattern]);

  useEffect(() => {
    fitToView();
  }, [fitToView, step]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsPanning(true);
      panStart.current = { x: e.clientX, y: e.clientY, tx: transform.x, ty: transform.y };
    }
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setTransform((t) => ({
      ...t,
      x: panStart.current.tx + (e.clientX - panStart.current.x),
      y: panStart.current.ty + (e.clientY - panStart.current.y),
    }));
  };
  const handleMouseUp = () => setIsPanning(false);
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setTransform((t) => ({
      ...t,
      scale: Math.max(0.2, Math.min(3, t.scale * delta)),
    }));
  };

  const touchRef = useRef<{
    startDist: number; startScale: number;
    startX: number; startY: number; tx: number; ty: number; fingers: number;
  }>({ startDist: 0, startScale: 1, startX: 0, startY: 0, tx: 0, ty: 0, fingers: 0 });

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchRef.current = {
        ...touchRef.current, fingers: 1,
        startX: e.touches[0].clientX, startY: e.touches[0].clientY,
        tx: transform.x, ty: transform.y,
      };
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchRef.current = {
        ...touchRef.current, fingers: 2,
        startDist: Math.sqrt(dx * dx + dy * dy), startScale: transform.scale,
        startX: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        startY: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        tx: transform.x, ty: transform.y,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 1 && touchRef.current.fingers === 1) {
      const dx = e.touches[0].clientX - touchRef.current.startX;
      const dy = e.touches[0].clientY - touchRef.current.startY;
      setTransform((t) => ({ ...t, x: touchRef.current.tx + dx, y: touchRef.current.ty + dy }));
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const ratio = dist / (touchRef.current.startDist || 1);
      const newScale = Math.max(0.2, Math.min(3, touchRef.current.startScale * ratio));
      const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      setTransform({
        x: touchRef.current.tx + (midX - touchRef.current.startX),
        y: touchRef.current.ty + (midY - touchRef.current.startY),
        scale: newScale,
      });
    }
  };

  const zoomIn = () => setTransform((t) => ({ ...t, scale: Math.min(3, t.scale * 1.3) }));
  const zoomOut = () => setTransform((t) => ({ ...t, scale: Math.max(0.2, t.scale / 1.3) }));

  function getPatternCellStyle(patIdx: number) {
    if (mismatchIndex === patIdx) {
      return {
        bg: 'bg-rose-500/20',
        border: 'border-2 border-rose-400/80',
        text: 'text-rose-300',
      };
    }
    if (patIdx === patPos && rule !== 'full_match' && rule !== 'complete') {
      return {
        bg: 'bg-amber-500/20',
        border: 'border-2 border-amber-400/80',
        text: 'text-amber-300',
      };
    }
    if (matchedSet.has(patIdx)) {
      return {
        bg: 'bg-emerald-500/15',
        border: 'border border-emerald-400/50',
        text: 'text-emerald-300',
      };
    }
    return {
      bg: 'bg-slate-800/50',
      border: 'border border-slate-600/40',
      text: 'text-slate-400',
    };
  }

  function getTextCellStyle(col: number) {
    const patIdx = col - textPos;
    const inRange = patIdx >= 0 && patIdx < m;

    if (inRange && mismatchIndex === patIdx) {
      return { bg: 'bg-rose-500/10', border: 'border border-rose-400/40', text: 'text-rose-300' };
    }
    if (inRange && patIdx === patPos && rule !== 'full_match' && rule !== 'complete') {
      return { bg: 'bg-amber-500/10', border: 'border border-amber-400/40', text: 'text-amber-300' };
    }
    if (inRange && matchedSet.has(patIdx)) {
      return { bg: 'bg-emerald-500/10', border: 'border border-emerald-400/30', text: 'text-emerald-300' };
    }
    if (matchPositions.some(pos => col >= pos && col < pos + m)) {
      return { bg: 'bg-emerald-500/8', border: 'border border-emerald-500/20', text: 'text-emerald-200' };
    }
    return { bg: 'bg-slate-800/70', border: 'border border-slate-700/50', text: 'text-slate-300' };
  }

  function getConnectorColor(patIdx: number) {
    if (mismatchIndex === patIdx) return 'bg-rose-400/60';
    if (patIdx === patPos && rule !== 'full_match' && rule !== 'complete') return 'bg-amber-400/60';
    if (matchedSet.has(patIdx)) return 'bg-emerald-400/40';
    return '';
  }

  return (
    <div className="absolute inset-0">
      <div
        ref={containerRef}
        className="w-full h-full bg-slate-950 overflow-hidden cursor-grab active:cursor-grabbing select-none touch-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
      >
        <div
          ref={contentRef}
          className="inline-block p-10"
          style={{
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
            transformOrigin: '0 0',
            transition: isPanning ? 'none' : 'transform 0.3s ease',
          }}
        >
          <div className="space-y-2">
            {/* Text Row */}
            <div>
              <div className="flex items-center gap-4 mb-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Text
                </h3>
              </div>
              <div className="inline-flex gap-[3px]">
                {text.split('').map((ch, col) => {
                  const style = getTextCellStyle(col);
                  return (
                    <div key={col} className="flex flex-col items-center w-9">
                      <span
                        className={`w-9 h-9 flex items-center justify-center rounded-md font-mono text-sm font-bold ${style.bg} ${style.text} ${style.border} transition-all duration-300`}
                      >
                        {ch}
                      </span>
                      <span className="text-[10px] mt-1 font-mono text-slate-500">{col}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Connectors */}
            <div className="inline-flex gap-[3px]">
              {Array.from({ length: n }).map((_, col) => {
                const patIdx = col - textPos;
                const inRange = patIdx >= 0 && patIdx < m;
                const color = inRange && showAlignmentInfo ? getConnectorColor(patIdx) : '';
                return (
                  <div key={col} className="flex flex-col items-center w-9">
                    <div className={`h-5 w-px mx-auto transition-all duration-300 ${color}`} />
                  </div>
                );
              })}
            </div>

            {/* Pattern Row */}
            <div>
              <div className="flex items-center gap-4 mb-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Pattern
                  {showAlignmentInfo && (
                    <span className="ml-2 text-slate-600 normal-case font-normal">
                      aligned at position {textPos}
                      <span className="ml-2 text-blue-400/60">← scanning right to left</span>
                    </span>
                  )}
                </h3>
              </div>
              <div className="inline-flex gap-[3px]">
                {Array.from({ length: n }).map((_, col) => {
                  const patIdx = col - textPos;
                  const inRange = patIdx >= 0 && patIdx < m;

                  if (!inRange) {
                    return (
                      <div key={col} className="flex flex-col items-center w-9">
                        <span className="w-9 h-9 flex items-center justify-center rounded-md" />
                        <span className="text-[10px] mt-1 font-mono text-transparent">0</span>
                      </div>
                    );
                  }

                  const style = getPatternCellStyle(patIdx);
                  return (
                    <div key={col} className="flex flex-col items-center w-9">
                      <span
                        className={`w-9 h-9 flex items-center justify-center rounded-md font-mono text-sm font-bold ${style.bg} ${style.text} ${style.border} transition-all duration-300`}
                      >
                        {pattern[patIdx]}
                      </span>
                      <span
                        className={`text-[10px] mt-1 font-mono ${
                          patIdx === patPos ? 'text-amber-400 font-bold' : 'text-slate-500'
                        }`}
                      >
                        {patIdx}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Match Results */}
            {matchPositions.length > 0 && (
              <div className="flex items-center gap-3 flex-wrap pt-4">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  Matches found:
                </span>
                {matchPositions.map((pos) => (
                  <span
                    key={pos}
                    className="px-2.5 py-1 rounded-md bg-emerald-500/15 text-emerald-300 text-xs font-mono font-bold border border-emerald-400/30"
                  >
                    text[{pos}]
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Zoom controls */}
      <div className="absolute bottom-3 right-3 flex flex-col gap-1.5">
        <button
          onClick={zoomIn}
          className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-lg font-bold flex items-center justify-center backdrop-blur-sm transition-colors"
          aria-label="Zoom in"
        >+</button>
        <button
          onClick={zoomOut}
          className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-lg font-bold flex items-center justify-center backdrop-blur-sm transition-colors"
          aria-label="Zoom out"
        >&minus;</button>
        <button
          onClick={fitToView}
          className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 text-xs font-bold flex items-center justify-center backdrop-blur-sm transition-colors"
          aria-label="Fit to view"
          title="Center & fit"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <rect x="3" y="3" width="10" height="10" rx="1" />
            <path d="M1 5V2a1 1 0 011-1h3M11 1h3a1 1 0 011 1v3M15 11v3a1 1 0 01-1 1h-3M5 15H2a1 1 0 01-1-1v-3" />
          </svg>
        </button>
      </div>
    </div>
  );
}
