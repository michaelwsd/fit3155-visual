'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { SimplexStep } from '@/lib/simplex-types';

interface Props {
  step: SimplexStep;
}

function gcd(a: number, b: number): number {
  a = Math.abs(a); b = Math.abs(b);
  while (b) { [a, b] = [b, a % b]; }
  return a;
}

function fmt(n: number): string {
  if (Math.abs(n) < 1e-10) return '0';
  if (Math.abs(n - Math.round(n)) < 1e-9) return Math.round(n).toString();
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  for (let d = 2; d <= 100; d++) {
    const num = Math.round(abs * d);
    if (Math.abs(abs - num / d) < 1e-9) {
      const g = gcd(num, d);
      return `${sign}${num / g}/${d / g}`;
    }
  }
  const r = Math.round(n * 100) / 100;
  if (Math.abs(r - Math.round(r)) < 0.001) return Math.round(r).toString();
  return r.toFixed(2);
}

export default function SimplexVisualization({ step }: Props) {
  const { tableau, basicVars, numVars, numConstraints, varNames, pivotRow, pivotCol, ratios, rule } = step;
  const totalVars = numVars + numConstraints;

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
  }, [fitToView, numVars, numConstraints]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsPanning(true);
      panStart.current = { x: e.clientX, y: e.clientY, tx: transform.x, ty: transform.y };
    }
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setTransform((t) => ({ ...t, x: panStart.current.tx + (e.clientX - panStart.current.x), y: panStart.current.ty + (e.clientY - panStart.current.y) }));
  };
  const handleMouseUp = () => setIsPanning(false);
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setTransform((t) => ({ ...t, scale: Math.max(0.2, Math.min(3, t.scale * delta)) }));
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

  const showRatios = rule === 'ratio_test' && ratios.length > 0;
  const zRowIdx = numConstraints;

  function cellBg(row: number, col: number): string {
    const isZRow = row === zRowIdx;
    const isPivotCell = row === pivotRow && col === pivotCol;
    const isPivotRowCell = row === pivotRow && pivotRow >= 0;
    const isPivotColCell = col === pivotCol && pivotCol >= 0;

    if (isPivotCell && (rule === 'ratio_test' || rule === 'pivot')) {
      return 'bg-cyan-500/40 ring-cyan-400';
    }
    if (rule === 'select_pivot_col' && isPivotColCell && !isZRow) {
      return 'bg-cyan-500/15 ring-cyan-500/30';
    }
    if (rule === 'select_pivot_col' && isPivotColCell && isZRow) {
      return 'bg-cyan-500/30 ring-cyan-400/50';
    }
    if ((rule === 'ratio_test' || rule === 'pivot') && isPivotRowCell) {
      return 'bg-cyan-500/20 ring-cyan-500/30';
    }
    if ((rule === 'ratio_test' || rule === 'pivot') && isPivotColCell) {
      return 'bg-cyan-500/10 ring-cyan-500/20';
    }
    if (rule === 'check_optimal' && isZRow && col < totalVars) {
      const val = tableau[zRowIdx][col];
      if (val < -1e-10) return 'bg-red-500/20 ring-red-500/30';
      return 'bg-emerald-500/10 ring-emerald-500/20';
    }
    if (isZRow) return 'bg-slate-700/40 ring-slate-600/30';
    return 'bg-slate-800/60 ring-transparent';
  }

  function cellText(row: number, col: number): string {
    const isZRow = row === zRowIdx;
    const isPivotCell = row === pivotRow && col === pivotCol;

    if (isPivotCell && (rule === 'ratio_test' || rule === 'pivot')) {
      return 'text-cyan-300 font-bold';
    }
    if (rule === 'check_optimal' && isZRow && col < totalVars) {
      const val = tableau[zRowIdx][col];
      if (val < -1e-10) return 'text-red-300 font-bold';
      return 'text-emerald-300';
    }
    if (isZRow) return 'text-slate-300';
    if (Math.abs(tableau[row][col]) < 1e-10) return 'text-slate-500';
    return 'text-slate-200';
  }

  const cols = totalVars + numConstraints;
  const cellW = cols <= 6 ? 'w-16' : cols <= 8 ? 'w-14' : 'w-12';
  const cellH = 'h-10';
  const fontSize = cols <= 6 ? 'text-sm' : 'text-xs';

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
          className="inline-flex flex-col gap-0 origin-top-left"
          style={{ transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`, transition: isPanning ? 'none' : 'transform 0.3s ease' }}
        >
          {/* Column headers */}
          <div className="flex items-end gap-px mb-1">
            <div className={`w-14 ${cellH} flex items-center justify-center`}>
              <span className="text-[10px] font-bold text-slate-500 uppercase">BV</span>
            </div>
            {varNames.map((name, j) => (
              <div
                key={j}
                className={`${cellW} ${cellH} flex items-center justify-center rounded-t transition-all duration-300 ${
                  pivotCol === j && (rule === 'select_pivot_col' || rule === 'ratio_test' || rule === 'pivot')
                    ? 'bg-cyan-500/20 text-cyan-300'
                    : j < numVars ? 'text-cyan-400/80' : 'text-indigo-400/80'
                }`}
              >
                <span className={`font-mono font-bold ${fontSize}`}>{name}</span>
              </div>
            ))}
            <div className={`${cellW} ${cellH} flex items-center justify-center`}>
              <span className={`font-mono font-bold ${fontSize} text-amber-400/80`}>RHS</span>
            </div>
            {showRatios && (
              <div className={`${cellW} ${cellH} flex items-center justify-center`}>
                <span className={`font-mono font-bold ${fontSize} text-indigo-400/80`}>θ</span>
              </div>
            )}
          </div>

          {/* Constraint rows */}
          {tableau.slice(0, numConstraints).map((row, i) => (
            <div key={i} className="flex items-center gap-px mb-px">
              <div className={`w-14 ${cellH} flex items-center justify-center font-mono font-bold text-xs transition-all duration-300 rounded-l ${
                pivotRow === i && (rule === 'ratio_test' || rule === 'pivot')
                  ? 'text-cyan-300 bg-cyan-500/15'
                  : basicVars[i] < numVars ? 'text-cyan-400/80' : 'text-indigo-400/80'
              }`}>
                {varNames[basicVars[i]]}
              </div>
              {row.slice(0, totalVars).map((val, j) => (
                <div
                  key={j}
                  className={`${cellW} ${cellH} flex items-center justify-center font-mono font-semibold ${fontSize} rounded ring-1 ring-inset transition-all duration-300 ${cellBg(i, j)} ${cellText(i, j)}`}
                >
                  {fmt(val)}
                </div>
              ))}
              <div className={`${cellW} ${cellH} flex items-center justify-center font-mono font-semibold ${fontSize} rounded ring-1 ring-inset transition-all duration-300 bg-amber-500/10 ring-amber-500/20 text-amber-300`}>
                {fmt(row[totalVars])}
              </div>
              {showRatios && (
                <div className={`${cellW} ${cellH} flex items-center justify-center font-mono font-semibold ${fontSize} rounded ring-1 ring-inset transition-all duration-300 ${
                  ratios[i] !== null && ratios[i] !== undefined
                    ? i === pivotRow
                      ? 'bg-cyan-500/25 ring-cyan-400/50 text-cyan-300 font-bold'
                      : 'bg-indigo-500/10 ring-indigo-500/20 text-indigo-300'
                    : 'bg-slate-800/30 ring-transparent text-slate-600'
                }`}>
                  {ratios[i] !== null && ratios[i] !== undefined ? fmt(ratios[i]!) : '—'}
                </div>
              )}
            </div>
          ))}

          {/* Separator */}
          <div className="flex items-center gap-px my-1">
            <div className="w-14 h-px" />
            {Array.from({ length: totalVars + 1 + (showRatios ? 1 : 0) }, (_, i) => (
              <div key={i} className={`${cellW} h-px bg-slate-600/50`} />
            ))}
          </div>

          {/* Z-row */}
          <div className="flex items-center gap-px">
            <div className={`w-14 ${cellH} flex items-center justify-center font-mono font-bold text-xs text-emerald-400/80`}>
              z
            </div>
            {tableau[zRowIdx].slice(0, totalVars).map((val, j) => (
              <div
                key={j}
                className={`${cellW} ${cellH} flex items-center justify-center font-mono font-semibold ${fontSize} rounded ring-1 ring-inset transition-all duration-300 ${cellBg(zRowIdx, j)} ${cellText(zRowIdx, j)}`}
              >
                {fmt(val)}
              </div>
            ))}
            <div className={`${cellW} ${cellH} flex items-center justify-center font-mono font-bold ${fontSize} rounded ring-1 ring-inset transition-all duration-300 bg-emerald-500/15 ring-emerald-500/30 text-emerald-300`}>
              {fmt(tableau[zRowIdx][totalVars])}
            </div>
            {showRatios && (
              <div className={`${cellW} ${cellH}`} />
            )}
          </div>
        </div>
      </div>

      {/* Zoom controls */}
      <div className="absolute bottom-3 right-3 flex flex-col gap-1.5">
        <button onClick={zoomIn} className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-lg font-bold flex items-center justify-center backdrop-blur-sm transition-colors" aria-label="Zoom in">+</button>
        <button onClick={zoomOut} className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-lg font-bold flex items-center justify-center backdrop-blur-sm transition-colors" aria-label="Zoom out">&minus;</button>
        <button onClick={fitToView} className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 text-xs font-bold flex items-center justify-center backdrop-blur-sm transition-colors" aria-label="Fit to view" title="Center & fit">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <rect x="3" y="3" width="10" height="10" rx="1" />
            <path d="M1 5V2a1 1 0 011-1h3M11 1h3a1 1 0 011 1v3M15 11v3a1 1 0 01-1 1h-3M5 15H2a1 1 0 01-1-1v-3" />
          </svg>
        </button>
      </div>
    </div>
  );
}
