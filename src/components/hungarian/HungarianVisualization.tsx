'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { HungarianStep } from '@/lib/hungarian-types';
import FlowNetwork from './FlowNetwork';

interface Props {
  step: HungarianStep;
}

export default function HungarianVisualization({ step }: Props) {
  const { matrix, u, v, n, cellStatus, coveredRows, coveredCols, highlightCells, highlightRow, highlightCol, markedRows, markedCols, rule } = step;

  const showFlowNetwork = rule === 'mark' || rule === 'cover';

  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, tx: 0, ty: 0 });

  const scaleRef = useRef(1);
  scaleRef.current = transform.scale;

  const fitToView = useCallback(() => {
    if (!containerRef.current || !contentRef.current) return;
    const container = containerRef.current.getBoundingClientRect();
    const content = contentRef.current.getBoundingClientRect();
    const currentScale = scaleRef.current || 1;
    const realW = content.width / currentScale;
    const realH = content.height / currentScale;
    const padding = 40;
    const scaleX = (container.width - padding * 2) / Math.max(realW, 1);
    const scaleY = (container.height - padding * 2) / Math.max(realH, 1);
    const scale = Math.min(scaleX, scaleY, 2);
    const finalScale = Math.max(scale, 0.3);
    setTransform({
      x: (container.width - realW * finalScale) / 2,
      y: (container.height - realH * finalScale) / 2,
      scale: finalScale,
    });
  }, []);

  useEffect(() => {
    requestAnimationFrame(fitToView);
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container) return;
    const observer = new ResizeObserver(() => fitToView());
    observer.observe(container);
    if (content) observer.observe(content);
    return () => observer.disconnect();
  }, [fitToView, n, showFlowNetwork]);

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

  const touchRef = useRef<{ startDist: number; startScale: number; startX: number; startY: number; tx: number; ty: number; fingers: number }>({
    startDist: 0, startScale: 1, startX: 0, startY: 0, tx: 0, ty: 0, fingers: 0,
  });
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchRef.current = { ...touchRef.current, fingers: 1, startX: e.touches[0].clientX, startY: e.touches[0].clientY, tx: transform.x, ty: transform.y };
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchRef.current = {
        ...touchRef.current, fingers: 2, startDist: Math.sqrt(dx * dx + dy * dy), startScale: transform.scale,
        startX: (e.touches[0].clientX + e.touches[1].clientX) / 2, startY: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        tx: transform.x, ty: transform.y,
      };
    }
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 1 && touchRef.current.fingers === 1) {
      setTransform((t) => ({ ...t, x: touchRef.current.tx + (e.touches[0].clientX - touchRef.current.startX), y: touchRef.current.ty + (e.touches[0].clientY - touchRef.current.startY) }));
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const newScale = Math.max(0.2, Math.min(3, touchRef.current.startScale * (dist / (touchRef.current.startDist || 1))));
      const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      setTransform({ x: touchRef.current.tx + (midX - touchRef.current.startX), y: touchRef.current.ty + (midY - touchRef.current.startY), scale: newScale });
    }
  };

  const zoomIn = () => setTransform((t) => ({ ...t, scale: Math.min(3, t.scale * 1.3) }));
  const zoomOut = () => setTransform((t) => ({ ...t, scale: Math.max(0.2, t.scale / 1.3) }));

  const highlightSet = new Set(highlightCells.map(([i, j]) => `${i},${j}`));

  function cellBg(i: number, j: number): string {
    const status = cellStatus[i]?.[j] ?? 'normal';
    const isHighlight = highlightSet.has(`${i},${j}`);
    const rowCov = coveredRows[i];
    const colCov = coveredCols[j];

    if (isHighlight) return 'bg-emerald-500/25 ring-emerald-400/60';
    if (status === 'assigned') return 'bg-rose-500/25 ring-rose-500/50';
    if (status === 'crossed') {
      if (rowCov && colCov) return 'bg-amber-500/30 ring-amber-500/40';
      if (rowCov || colCov) return 'bg-amber-500/20 ring-amber-500/30';
      return 'bg-slate-800/30 ring-transparent';
    }
    if (rowCov && colCov) return 'bg-amber-500/35 ring-amber-500/40';
    if (rowCov || colCov) return 'bg-amber-500/25 ring-amber-500/30';
    return 'bg-slate-800/60 ring-transparent';
  }

  function cellText(i: number, j: number): string {
    const status = cellStatus[i]?.[j] ?? 'normal';
    if (highlightSet.has(`${i},${j}`)) return 'text-emerald-300 font-bold';
    if (status === 'assigned') return 'text-rose-300 font-bold';
    if (status === 'crossed') return 'text-slate-500';
    if (matrix[i][j] === 0) return 'text-amber-300 font-bold';
    return 'text-slate-200';
  }

  const cellSize = n <= 3 ? 'w-14 h-12 text-base' : n <= 5 ? 'w-11 h-10 text-sm' : 'w-9 h-8 text-xs';
  const cellHeight = n <= 3 ? 'h-12' : n <= 5 ? 'h-10' : 'h-8';
  const dualSize = n <= 3 ? 'w-14 h-8 text-xs' : n <= 5 ? 'w-11 h-7 text-[10px]' : 'w-9 h-6 text-[9px]';

  return (
    <div className="absolute inset-0">
      <div
        ref={containerRef}
        className="w-full h-full overflow-hidden cursor-grab active:cursor-grabbing select-none touch-none"
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
          className="inline-flex items-center gap-8 origin-top-left"
          style={{ transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`, transition: isPanning ? 'none' : 'transform 0.3s ease' }}
        >
          <div className="inline-flex flex-col items-center gap-1">
            {/* Column headers: v values */}
            <div className="flex items-end gap-px">
              <div className={`${dualSize} mr-1 invisible`} />
              {v.map((val, j) => (
                <div
                  key={j}
                  className={`${dualSize} flex flex-col items-center justify-end font-mono font-bold rounded-t transition-all duration-300 ${
                    highlightCol === j ? 'text-indigo-300 bg-indigo-500/15' : coveredCols[j] ? 'text-amber-400' : 'text-indigo-400/80'
                  }`}
                >
                  <span className="text-[8px] text-slate-500 font-normal">v{j + 1}</span>
                  <span>{val}</span>
                </div>
              ))}
              <div className="w-6" />
            </div>

            {/* Matrix rows */}
            {matrix.map((row, i) => (
              <div key={i} className="flex items-center gap-px">
                <div
                  className={`${dualSize} flex flex-col items-center justify-center font-mono font-bold rounded-l mr-1 transition-all duration-300 ${
                    highlightRow === i ? 'text-cyan-300 bg-cyan-500/15' : coveredRows[i] ? 'text-amber-400' : 'text-cyan-400/80'
                  }`}
                >
                  <span className="text-[8px] text-slate-500 font-normal">u{i + 1}</span>
                  <span>{u[i]}</span>
                </div>

                {row.map((val, j) => {
                  const status = cellStatus[i]?.[j] ?? 'normal';
                  return (
                    <div
                      key={j}
                      className={`${cellSize} flex items-center justify-center font-mono font-semibold rounded ring-1 ring-inset transition-all duration-300 ${cellBg(i, j)} ${cellText(i, j)}`}
                    >
                      {status === 'crossed' ? (
                        <span className="line-through decoration-slate-500">{val}</span>
                      ) : (
                        val
                      )}
                    </div>
                  );
                })}

                <div className={`w-6 ${cellHeight} flex items-center justify-center`}>
                  {markedRows[i] && (
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400">
                      <path d="M2 8.5l4 4 8-8" />
                    </svg>
                  )}
                  {coveredRows[i] && !markedRows.some(Boolean) && (
                    <div className="w-2 h-7 rounded-full bg-amber-500/60" />
                  )}
                </div>
              </div>
            ))}

            {/* Column mark / cover indicators */}
            <div className="flex gap-px">
              <div className={`${dualSize} mr-1 invisible`} />
              {Array.from({ length: n }, (_, j) => (
                <div key={j} className={`${n <= 3 ? 'w-14' : n <= 5 ? 'w-11' : 'w-9'} h-6 flex items-center justify-center`}>
                  {markedCols[j] && (
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400">
                      <path d="M2 8.5l4 4 8-8" />
                    </svg>
                  )}
                  {coveredCols[j] && !markedCols.some(Boolean) && (
                    <div className="h-2 w-7 rounded-full bg-amber-500/60" />
                  )}
                </div>
              ))}
              <div className="w-6" />
            </div>
          </div>

          {showFlowNetwork && <FlowNetwork step={step} />}
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
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <rect x="3" y="3" width="10" height="10" rx="1" />
            <path d="M1 5V2a1 1 0 011-1h3M11 1h3a1 1 0 011 1v3M15 11v3a1 1 0 01-1 1h-3M5 15H2a1 1 0 01-1-1v-3" />
          </svg>
        </button>
      </div>
    </div>
  );
}
