'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { BWTStep } from '@/lib/bwt-types';

interface Props {
  step: BWTStep;
}

export default function BWTVisualization({ step }: Props) {
  const {
    text,
    textWithSentinel,
    pattern,
    suffixArray: sa,
    suffixes,
    firstColumn,
    bwtString,
    rule,
    sp,
    ep,
    patPos,
    currentChar,
    matchPositions,
  } = step;

  const m = pattern.length;
  const isSearch = sp >= 0;
  const hasBWT = bwtString.length > 0;
  const matchSet = new Set(matchPositions);

  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, tx: 0, ty: 0 });

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

  function getTextCellStyle(idx: number) {
    if (matchPositions.some(pos => idx >= pos && idx < pos + m)) {
      return { bg: 'bg-emerald-500/15', border: 'border border-emerald-400/40', text: 'text-emerald-300' };
    }
    return { bg: 'bg-slate-800/70', border: 'border border-slate-700/50', text: 'text-slate-300' };
  }

  function getPatternCellStyle(idx: number) {
    if (idx === patPos) {
      return { bg: 'bg-amber-500/20', border: 'border-2 border-amber-400/80', text: 'text-amber-300' };
    }
    if (patPos === -1 && isSearch) {
      return { bg: 'bg-emerald-500/15', border: 'border border-emerald-400/50', text: 'text-emerald-300' };
    }
    if (patPos >= 0 && idx > patPos) {
      return { bg: 'bg-emerald-500/15', border: 'border border-emerald-400/50', text: 'text-emerald-300' };
    }
    return { bg: 'bg-slate-800/50', border: 'border border-slate-600/40', text: 'text-slate-400' };
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
          <div className="flex gap-10 items-start">
            {/* Left: Text + Pattern */}
            <div className="space-y-6">
              {/* Text Row */}
              <div>
                <div className="flex items-center gap-4 mb-3">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Text
                  </h3>
                </div>
                <div className="inline-flex gap-[3px]">
                  {text.split('').map((ch, i) => {
                    const style = getTextCellStyle(i);
                    return (
                      <div key={i} className="flex flex-col items-center w-9">
                        <span
                          className={`w-9 h-9 flex items-center justify-center rounded-md font-mono text-sm font-bold ${style.bg} ${style.text} ${style.border} transition-all duration-300`}
                        >
                          {ch}
                        </span>
                        <span className="text-[10px] mt-1 font-mono text-slate-500">{i}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Pattern Row */}
              <div>
                <div className="flex items-center gap-4 mb-3">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Pattern
                    {isSearch && patPos >= 0 && (
                      <span className="ml-2 text-slate-600 normal-case font-normal">
                        scanning position {patPos}
                        <span className="ml-2 text-purple-400/60">← right to left</span>
                      </span>
                    )}
                  </h3>
                </div>
                <div className="inline-flex gap-[3px]">
                  {pattern.split('').map((ch, i) => {
                    const style = getPatternCellStyle(i);
                    return (
                      <div key={i} className="flex flex-col items-center w-9">
                        <span
                          className={`w-9 h-9 flex items-center justify-center rounded-md font-mono text-sm font-bold ${style.bg} ${style.text} ${style.border} transition-all duration-300`}
                        >
                          {ch}
                        </span>
                        <span
                          className={`text-[10px] mt-1 font-mono ${
                            i === patPos ? 'text-amber-400 font-bold' : 'text-slate-500'
                          }`}
                        >
                          {i}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Match Results */}
              {matchPositions.length > 0 && (
                <div className="flex items-center gap-3 flex-wrap pt-2">
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

            {/* Right: BWT Matrix */}
            {sa.length > 0 && (
              <div>
                <div className="flex items-center gap-4 mb-3">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Sorted Suffix Matrix
                    {isSearch && sp <= ep && (
                      <span className="ml-2 text-purple-400/60 normal-case font-normal">
                        range [{sp}, {ep}]
                      </span>
                    )}
                  </h3>
                </div>
                <table className="border-collapse">
                  <thead>
                    <tr>
                      <th className="px-2 py-1 text-[10px] font-mono text-slate-600 text-right">#</th>
                      <th className="px-2 py-1 text-[10px] font-mono text-purple-400 font-bold text-center">F</th>
                      <th className="px-3 py-1 text-[10px] font-mono text-slate-500 text-left">Suffix</th>
                      {hasBWT && (
                        <th className="px-2 py-1 text-[10px] font-mono text-blue-400 font-bold text-center">L</th>
                      )}
                      <th className="px-2 py-1 text-[10px] font-mono text-slate-600 text-center">SA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sa.map((saVal, row) => {
                      const inRange = isSearch && row >= sp && row <= ep && sp <= ep;
                      const isBoundary = isSearch && sp <= ep && (row === sp || row === ep);
                      const fChar = firstColumn[row];
                      const lChar = hasBWT ? bwtString[row] : '';
                      const fMatchesCurrent = isSearch && fChar === currentChar;
                      const lMatchesCurrent = isSearch && lChar === currentChar;
                      const isMatchRow = matchSet.has(saVal);

                      return (
                        <tr
                          key={row}
                          className={`transition-all duration-300 ${
                            inRange
                              ? isBoundary
                                ? 'bg-purple-500/20'
                                : 'bg-purple-500/10'
                              : ''
                          }`}
                        >
                          <td
                            className={`px-2 py-0.5 text-[11px] font-mono text-right ${
                              inRange ? 'text-purple-400 font-bold' : 'text-slate-600'
                            }`}
                          >
                            {row}
                          </td>
                          <td className="px-2 py-0.5 text-center">
                            <span
                              className={`inline-block w-6 h-6 leading-6 rounded text-[11px] font-mono font-bold text-center transition-all duration-300 ${
                                fMatchesCurrent && inRange
                                  ? 'bg-amber-500/25 text-amber-300 ring-1 ring-amber-500/50'
                                  : inRange
                                    ? 'text-purple-300'
                                    : 'text-slate-500'
                              }`}
                            >
                              {fChar}
                            </span>
                          </td>
                          <td
                            className={`px-3 py-0.5 text-[11px] font-mono whitespace-nowrap ${
                              isMatchRow && matchPositions.length > 0
                                ? 'text-emerald-300'
                                : inRange
                                  ? 'text-slate-300'
                                  : 'text-slate-600'
                            }`}
                          >
                            {suffixes[row]}
                          </td>
                          {hasBWT && (
                            <td className="px-2 py-0.5 text-center">
                              <span
                                className={`inline-block w-6 h-6 leading-6 rounded text-[11px] font-mono font-bold text-center transition-all duration-300 ${
                                  lMatchesCurrent && inRange
                                    ? 'bg-amber-500/25 text-amber-300 ring-1 ring-amber-500/50'
                                    : inRange
                                      ? 'text-blue-300'
                                      : 'text-slate-600'
                                }`}
                              >
                                {lChar}
                              </span>
                            </td>
                          )}
                          <td
                            className={`px-2 py-0.5 text-[11px] font-mono text-center ${
                              isMatchRow && matchPositions.length > 0
                                ? 'text-emerald-400 font-bold'
                                : inRange
                                  ? 'text-slate-300'
                                  : 'text-slate-600'
                            }`}
                          >
                            {saVal}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
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
