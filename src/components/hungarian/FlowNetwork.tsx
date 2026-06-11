'use client';

import { HungarianStep } from '@/lib/hungarian-types';

interface Props {
  step: HungarianStep;
}

const C = {
  purple: '#c4b5fd',
  purpleBright: '#a78bfa',
  amber: '#fbbf24',
  amberStroke: '#f59e0b',
  rose: '#fb7185',
  txt: '#e2e8f0',
  txtDim: '#94a3b8',
  txtMuted: '#64748b',
  edge: '#334155',
  nodeFill: '#1e293b',
  nodeBorder: '#475569',
  reachFill: 'rgba(167,139,250,0.10)',
};

function clipLine(x1: number, y1: number, r1: number, x2: number, y2: number, r2: number) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const d = Math.sqrt(dx * dx + dy * dy) || 1;
  const ux = dx / d;
  const uy = dy / d;
  return {
    x1: x1 + ux * r1,
    y1: y1 + uy * r1,
    x2: x2 - ux * r2,
    y2: y2 - uy * r2,
  };
}

export default function FlowNetwork({ step }: Props) {
  const { matrix, assignments, markedRows, markedCols, coveredRows, coveredCols, n, rule } = step;

  const showReach = rule === 'mark' || rule === 'cover';
  const showCover = rule === 'cover';

  const r = n <= 3 ? 14 : n <= 5 ? 12 : 10;
  const bigR = r + 3;
  const gap = n <= 3 ? 52 : n <= 5 ? 44 : n <= 6 ? 38 : 32;
  const top = 46;
  const bot = 48;

  const ny = (i: number) => top + i * gap;
  const h = top + (n - 1) * gap + bot;
  const mid = top + ((n - 1) * gap) / 2;

  const sX = bigR + 8;
  const rX = sX + bigR + 36;
  const cX = rX + (n <= 4 ? 120 : n <= 6 ? 110 : 100);
  const tX = cX + 36 + bigR;
  const w = tX + bigR + 8;

  const mSet = new Set(assignments.map(([i, j]) => `${i},${j}`));
  const mRows = new Set(assignments.map(([i]) => i));
  const mCols = new Set(assignments.map(([, j]) => j));

  const zeros: [number, number][] = [];
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++)
      if (matrix[i][j] === 0) zeros.push([i, j]);

  const reachR = (i: number) => showReach && markedRows[i];
  const reachC = (j: number) => showReach && markedCols[j];
  const covR = (i: number) => showCover && coveredRows[i];
  const covC = (j: number) => showCover && coveredCols[j];

  const fs = n <= 4 ? 9 : n <= 6 ? 8 : 7;

  let subtitle = '';
  if (rule === 'mark') {
    subtitle = !markedCols.some(Boolean)
      ? 'Mark unassigned rows (reachable from S)'
      : 'Propagate along alternating paths';
  } else if (rule === 'cover') {
    subtitle = 'Min-cut: cover unreachable rows, reachable cols';
  }

  function rFill(i: number) { return covR(i) ? C.amber : reachR(i) ? C.purple : C.txt; }
  function cFill(j: number) { return covC(j) ? C.amber : reachC(j) ? C.purple : C.txt; }

  const pad = 2;

  return (
    <svg width={w} height={h} className="shrink-0" style={{ minWidth: w }}>
      {/* Title */}
      <text x={w / 2} y={13} textAnchor="middle"
        style={{ fontSize: 10, fontWeight: 700, fill: C.txtDim }}>
        Flow Network
      </text>
      {subtitle && (
        <text x={w / 2} y={25} textAnchor="middle"
          style={{ fontSize: 8, fontWeight: 500, fill: C.txtMuted }}>
          {subtitle}
        </text>
      )}

      {/* ── Background edges (very subtle) ── */}

      {/* S → unmatched rows */}
      {Array.from({ length: n }, (_, i) => {
        if (mRows.has(i)) return null;
        const on = reachR(i);
        const cl = clipLine(sX, mid, bigR + pad, rX, ny(i), r + pad);
        return (
          <line key={`sr${i}`} {...cl}
            stroke={on ? C.purpleBright : C.edge}
            strokeWidth={on ? 1 : 0.5} opacity={on ? 0.4 : 0.08} />
        );
      })}

      {/* Non-matching zero edges */}
      {zeros.map(([i, j]) => {
        if (mSet.has(`${i},${j}`)) return null;
        const on = reachR(i) && reachC(j);
        const cl = clipLine(rX, ny(i), r + pad, cX, ny(j), r + pad);
        return (
          <line key={`z${i}-${j}`} {...cl}
            stroke={on ? C.purpleBright : C.edge}
            strokeWidth={on ? 1 : 0.75}
            opacity={on ? 0.45 : 0.18}
            strokeDasharray="4,3" />
        );
      })}

      {/* Unmatched col → T */}
      {Array.from({ length: n }, (_, j) => {
        if (mCols.has(j)) return null;
        const on = reachC(j);
        const cl = clipLine(cX, ny(j), r + pad, tX, mid, bigR + pad);
        return (
          <line key={`ct${j}`} {...cl}
            stroke={on ? C.purpleBright : C.edge}
            strokeWidth={on ? 1 : 0.5} opacity={on ? 0.4 : 0.08} />
        );
      })}

      {/* ── Matching edges (prominent) ── */}

      {/* S → matched rows */}
      {Array.from({ length: n }, (_, i) => {
        if (!mRows.has(i)) return null;
        const cl = clipLine(sX, mid, bigR + pad, rX, ny(i), r + pad);
        return (
          <line key={`sr-m${i}`} {...cl}
            stroke={C.rose} strokeWidth={1.5} opacity={0.5} />
        );
      })}

      {/* Matching row↔col — curved, clipped at endpoints */}
      {assignments.map(([i, j]) => {
        const cl1 = clipLine(rX, ny(i), r + pad, cX, ny(j), 0);
        const cl2 = clipLine(rX, ny(i), 0, cX, ny(j), r + pad);
        const sx = cl1.x1, sy = cl1.y1;
        const ex = cl2.x2, ey = cl2.y2;
        const midX = (rX + cX) / 2 + (i - j) * 6;
        const midY = (ny(i) + ny(j)) / 2 + (i - j) * 4;
        return (
          <path key={`m${i}-${j}`}
            d={`M${sx},${sy} Q${midX},${midY} ${ex},${ey}`}
            fill="none" stroke={C.rose} strokeWidth={2} opacity={0.7} />
        );
      })}

      {/* Matched col → T */}
      {Array.from({ length: n }, (_, j) => {
        if (!mCols.has(j)) return null;
        const cl = clipLine(cX, ny(j), r + pad, tX, mid, bigR + pad);
        return (
          <line key={`ct-m${j}`} {...cl}
            stroke={C.rose} strokeWidth={1.5} opacity={0.5} />
        );
      })}

      {/* ── Nodes ── */}

      {/* S */}
      <circle cx={sX} cy={mid} r={bigR}
        fill={C.nodeFill} stroke={showReach ? C.purpleBright : C.nodeBorder} strokeWidth={showReach ? 1.5 : 1} />
      <text x={sX} y={mid + 1} textAnchor="middle" dominantBaseline="middle"
        style={{ fontSize: fs + 1, fontWeight: 700, fill: showReach ? C.purple : C.txt }}>S</text>

      {/* T */}
      <circle cx={tX} cy={mid} r={bigR}
        fill={C.nodeFill} stroke={C.nodeBorder} strokeWidth={1} />
      <text x={tX} y={mid + 1} textAnchor="middle" dominantBaseline="middle"
        style={{ fontSize: fs + 1, fontWeight: 700, fill: C.txt }}>T</text>

      {/* Row nodes */}
      {Array.from({ length: n }, (_, i) => {
        const on = reachR(i);
        const cv = covR(i);
        return (
          <g key={`rn${i}`}>
            {cv && (
              <circle cx={rX} cy={ny(i)} r={r + 4}
                fill="none" stroke={C.amberStroke} strokeWidth={1.5} opacity={0.45}
                strokeDasharray="3,2" />
            )}
            <circle cx={rX} cy={ny(i)} r={r}
              fill={on ? C.reachFill : C.nodeFill}
              stroke={cv ? C.amberStroke : on ? C.purpleBright : C.nodeBorder}
              strokeWidth={on || cv ? 1.5 : 1} />
            <text x={rX} y={ny(i) + 1} textAnchor="middle" dominantBaseline="middle"
              style={{ fontSize: fs, fontWeight: 600, fill: rFill(i) }}>
              R{i + 1}
            </text>
          </g>
        );
      })}

      {/* Col nodes */}
      {Array.from({ length: n }, (_, j) => {
        const on = reachC(j);
        const cv = covC(j);
        return (
          <g key={`cn${j}`}>
            {cv && (
              <circle cx={cX} cy={ny(j)} r={r + 4}
                fill="none" stroke={C.amberStroke} strokeWidth={1.5} opacity={0.45}
                strokeDasharray="3,2" />
            )}
            <circle cx={cX} cy={ny(j)} r={r}
              fill={on ? C.reachFill : C.nodeFill}
              stroke={cv ? C.amberStroke : on ? C.purpleBright : C.nodeBorder}
              strokeWidth={on || cv ? 1.5 : 1} />
            <text x={cX} y={ny(j) + 1} textAnchor="middle" dominantBaseline="middle"
              style={{ fontSize: fs, fontWeight: 600, fill: cFill(j) }}>
              C{j + 1}
            </text>
          </g>
        );
      })}

      {/* ── Legend (centered, evenly spaced) ── */}
      {(() => {
        const items: { kind: 'line' | 'circ'; color: string; dash?: string; lbl: string; w: number }[] = [
          { kind: 'line', color: C.rose, lbl: 'Matching', w: 52 },
          { kind: 'line', color: C.edge, dash: '3,2', lbl: 'Zero', w: 34 },
        ];
        if (showReach) items.push({ kind: 'circ', color: C.purpleBright, lbl: 'Reachable', w: 52 });
        if (showCover) items.push({ kind: 'circ', color: C.amberStroke, dash: '2,1', lbl: 'Cover', w: 40 });

        const iconW = 14;
        const itemGap = 12;
        const tw = items.reduce((s, it) => s + iconW + it.w, 0) + itemGap * (items.length - 1);
        let cx = (w - tw) / 2;
        const ly = h - 10;

        return items.map((it) => {
          const x0 = cx;
          cx += iconW + it.w + itemGap;
          return (
            <g key={it.lbl} transform={`translate(${x0}, ${ly})`}>
              {it.kind === 'line' ? (
                <line x1="0" y1="0" x2="10" y2="0"
                  stroke={it.color} strokeWidth={it.dash ? 1 : 2}
                  strokeDasharray={it.dash} />
              ) : (
                <circle cx={5} cy={0} r={3.5}
                  fill={it.dash ? 'none' : C.reachFill}
                  stroke={it.color} strokeWidth={1.5}
                  strokeDasharray={it.dash} />
              )}
              <text x={iconW} y="1" dominantBaseline="middle"
                style={{ fontSize: 7, fill: C.txtMuted }}>{it.lbl}</text>
            </g>
          );
        });
      })()}
    </svg>
  );
}
