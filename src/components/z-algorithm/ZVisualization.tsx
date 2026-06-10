'use client';

import React, { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import { ZAlgorithmStep } from '@/lib/z-algorithm-types';

interface Props {
  step: ZAlgorithmStep;
  prevStep: ZAlgorithmStep | null;
}

export default function ZVisualization({ step }: Props) {
  const { combined, pattern, zArray, position: k, l, r, rule, k1 } = step;
  const patLen = pattern.length;

  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, tx: 0, ty: 0 });

  const showZBox = rule !== 'init' && rule !== 'complete' && l <= r && r > 0;

  const comparisonRange = useMemo(() => {
    if (rule !== 'scan' && rule !== 'match') return null;
    const zk = zArray[k];
    if (zk <= 0) return null;
    return { prefixEnd: zk, kStart: k, kEnd: k + zk };
  }, [rule, zArray, k]);

  const STRIDE = 39;

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
  }, [fitToView, combined]);

  useEffect(() => {
    fitToView();
  }, [fitToView, step]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsPanning(true);
      panStart.current = {
        x: e.clientX,
        y: e.clientY,
        tx: transform.x,
        ty: transform.y,
      };
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
    startDist: number;
    startScale: number;
    startX: number;
    startY: number;
    tx: number;
    ty: number;
    fingers: number;
  }>({ startDist: 0, startScale: 1, startX: 0, startY: 0, tx: 0, ty: 0, fingers: 0 });

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchRef.current = {
        ...touchRef.current,
        fingers: 1,
        startX: e.touches[0].clientX,
        startY: e.touches[0].clientY,
        tx: transform.x,
        ty: transform.y,
      };
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchRef.current = {
        ...touchRef.current,
        fingers: 2,
        startDist: Math.sqrt(dx * dx + dy * dy),
        startScale: transform.scale,
        startX: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        startY: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        tx: transform.x,
        ty: transform.y,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 1 && touchRef.current.fingers === 1) {
      const dx = e.touches[0].clientX - touchRef.current.startX;
      const dy = e.touches[0].clientY - touchRef.current.startY;
      setTransform((t) => ({
        ...t,
        x: touchRef.current.tx + dx,
        y: touchRef.current.ty + dy,
      }));
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

  const zoomIn = () =>
    setTransform((t) => ({ ...t, scale: Math.min(3, t.scale * 1.3) }));
  const zoomOut = () =>
    setTransform((t) => ({ ...t, scale: Math.max(0.2, t.scale / 1.3) }));

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
          <div className="space-y-10">
            {/* ─── Combined String ─── */}
            <div>
              <div className="flex items-center gap-4 mb-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Combined String
                </h3>
                <div className="flex items-center gap-3 text-[10px] text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/25 border border-emerald-500/40" />
                    Pattern
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-slate-800 border border-slate-600" />
                    Text
                  </span>
                </div>
              </div>

              <div className="inline-flex gap-[3px]">
                {combined.split('').map((ch, idx) => {
                  const isPattern = idx < patLen;
                  const isSeparator = idx === patLen;
                  const isCurrentK =
                    idx === k && rule !== 'init' && rule !== 'complete';
                  const isInZBox = showZBox && idx >= l && idx <= r;
                  const isComparePrefix =
                    comparisonRange !== null && idx < comparisonRange.prefixEnd;
                  const isCompareK =
                    comparisonRange !== null &&
                    idx >= comparisonRange.kStart &&
                    idx < comparisonRange.kEnd;
                  const isMirrorK1 =
                    k1 !== null &&
                    (rule === 'case_inside' || rule === 'copy') &&
                    idx === k1;

                  let bg = isPattern
                    ? 'bg-emerald-500/10'
                    : isSeparator
                      ? 'bg-slate-700/40'
                      : 'bg-slate-800/70';
                  let textColor = isPattern
                    ? 'text-emerald-400'
                    : isSeparator
                      ? 'text-slate-500'
                      : 'text-slate-300';
                  let border = 'border border-slate-700/50';

                  if (isInZBox) {
                    bg = 'bg-indigo-500/15';
                    border = 'border border-indigo-400/50';
                    textColor = 'text-indigo-300';
                  }
                  if (isComparePrefix || isCompareK) {
                    bg = 'bg-blue-500/20';
                    border = 'border border-blue-400/50';
                    textColor = 'text-blue-300';
                  }
                  if (isMirrorK1) {
                    bg = 'bg-cyan-500/15';
                    border = 'border border-cyan-400/50';
                    textColor = 'text-cyan-300';
                  }
                  if (isCurrentK) {
                    bg = 'bg-amber-500/20';
                    border = 'border-2 border-amber-400/80';
                    textColor = 'text-amber-300';
                  }

                  return (
                    <div key={idx} className="flex flex-col items-center w-9">
                      <span
                        className={`w-9 h-9 flex items-center justify-center rounded-md font-mono text-sm font-bold ${bg} ${textColor} ${border} transition-all duration-300`}
                      >
                        {ch}
                      </span>
                      <span
                        className={`text-[10px] mt-1 font-mono ${
                          isCurrentK
                            ? 'text-amber-400 font-bold'
                            : 'text-slate-500'
                        }`}
                      >
                        {idx}
                      </span>
                      {/* Z-box bracket segment — always rendered for stable layout */}
                      <div
                        className={`w-full h-2.5 mt-2 transition-all duration-300 ${
                          showZBox && idx >= l && idx <= r
                            ? `border-indigo-400 border-b-2 ${
                                idx === l ? 'border-l-2 rounded-bl' : ''
                              } ${idx === r ? 'border-r-2 rounded-br' : ''}`
                            : ''
                        }`}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Z-box label — always-height container for stable layout */}
              <div className="h-5">
                {showZBox && (
                  <div
                    className="text-[10px] text-indigo-400 font-mono font-bold text-center transition-all duration-300"
                    style={{
                      marginLeft: `${l * STRIDE}px`,
                      width: `${(r - l) * STRIDE + 36}px`,
                    }}
                  >
                    Z-box [{l}, {r}]
                  </div>
                )}
              </div>
            </div>

            {/* ─── Z Array ─── */}
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
                Z Array
              </h3>
              <div className="inline-flex gap-[3px]">
                {zArray.map((val, idx) => {
                  const isProcessed = idx > 0 && idx <= k;
                  const isCurrent =
                    idx === k && rule !== 'init' && rule !== 'complete';
                  const isMatch = val === patLen && idx > patLen;

                  return (
                    <div key={idx} className="flex flex-col items-center w-9">
                      <span
                        className={`w-9 h-8 flex items-center justify-center rounded-md font-mono text-xs font-bold transition-all duration-300 ${
                          isCurrent
                            ? 'bg-amber-500/20 text-amber-300 border-2 border-amber-400/80'
                            : isMatch
                              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-400/50'
                              : isProcessed
                                ? 'bg-slate-800/70 text-slate-300 border border-slate-700/50'
                                : 'bg-slate-800/30 text-slate-600 border border-slate-700/20'
                        }`}
                      >
                        {idx === 0 ? '—' : isProcessed ? val : '·'}
                      </span>
                      <span
                        className={`text-[10px] mt-1 font-mono ${
                          isCurrent
                            ? 'text-amber-400 font-bold'
                            : 'text-slate-500'
                        }`}
                      >
                        {idx}
                      </span>
                    </div>
                  );
                })}
              </div>

            </div>

            {/* ─── Match Results ─── */}
            {step.matchPositions.length > 0 && (
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  Matches found:
                </span>
                {step.matchPositions.map((pos) => (
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
        >
          +
        </button>
        <button
          onClick={zoomOut}
          className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-lg font-bold flex items-center justify-center backdrop-blur-sm transition-colors"
          aria-label="Zoom out"
        >
          &minus;
        </button>
        <button
          onClick={fitToView}
          className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 text-xs font-bold flex items-center justify-center backdrop-blur-sm transition-colors"
          aria-label="Fit to view"
          title="Center & fit"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            <rect x="3" y="3" width="10" height="10" rx="1" />
            <path d="M1 5V2a1 1 0 011-1h3M11 1h3a1 1 0 011 1v3M15 11v3a1 1 0 01-1 1h-3M5 15H2a1 1 0 01-1-1v-3" />
          </svg>
        </button>
      </div>
    </div>
  );
}
