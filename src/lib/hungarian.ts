import { HungarianStep, HungarianStepRule, CellStatus } from './hungarian-types';

export function buildHungarianSteps(costMatrix: number[][]): HungarianStep[] {
  const steps: HungarianStep[] = [];
  const n = costMatrix.length;
  const original = costMatrix.map(r => [...r]);
  const matrix = costMatrix.map(r => [...r]);
  const u = new Array(n).fill(0);
  const v = new Array(n).fill(0);

  function makeCellStatus(): CellStatus[][] {
    return Array.from({ length: n }, () => new Array(n).fill('normal') as CellStatus[]);
  }

  function obj() {
    return u.reduce((a, b) => a + b, 0) + v.reduce((a, b) => a + b, 0);
  }

  function snap(rule: HungarianStepRule, overrides: Partial<HungarianStep>) {
    steps.push({
      rule,
      matrix: matrix.map(r => [...r]),
      originalMatrix: original,
      u: [...u],
      v: [...v],
      assignments: [],
      cellStatus: makeCellStatus(),
      markedRows: new Array(n).fill(false),
      markedCols: new Array(n).fill(false),
      coveredRows: new Array(n).fill(false),
      coveredCols: new Array(n).fill(false),
      highlightCells: [],
      highlightRow: -1,
      highlightCol: -1,
      theta: 0,
      matchingSize: 0,
      n,
      iteration: 0,
      objective: obj(),
      explanation: '',
      ...overrides,
    });
  }

  snap('init', {
    explanation:
      `Original ${n}×${n} cost matrix. Goal: find a perfect matching (one assignment per row and column) that minimizes total cost.`,
  });

  // Step 1: Row reduction
  for (let i = 0; i < n; i++) {
    const rowMin = Math.min(...matrix[i]);
    u[i] = rowMin;
    for (let j = 0; j < n; j++) matrix[i][j] -= rowMin;
    snap('row_reduce', {
      highlightRow: i,
      explanation:
        `Step 1: Row ${i + 1} minimum = ${rowMin}. Subtract from all cells in row. Set u${i + 1} = ${rowMin}.`,
    });
  }

  // Step 2: Column reduction
  for (let j = 0; j < n; j++) {
    let colMin = Infinity;
    for (let i = 0; i < n; i++) colMin = Math.min(colMin, matrix[i][j]);
    v[j] = colMin;
    for (let i = 0; i < n; i++) matrix[i][j] -= colMin;
    snap('col_reduce', {
      highlightCol: j,
      explanation:
        `Step 2: Column ${j + 1} minimum = ${colMin}. Subtract from all cells in column. Set v${j + 1} = ${v[j]}.`,
    });
  }

  let iteration = 1;
  const MAX_ITERATIONS = 50;

  while (iteration <= MAX_ITERATIONS) {
    // Step 3: Assignment
    const cellStatus = makeCellStatus();
    const assignments: [number, number][] = [];
    const assignedRows = new Set<number>();
    const assignedCols = new Set<number>();

    function doAssign(i: number, j: number) {
      assignments.push([i, j]);
      assignedRows.add(i);
      assignedCols.add(j);
      cellStatus[i][j] = 'assigned';
      for (let ii = 0; ii < n; ii++) {
        if (ii !== i && matrix[ii][j] === 0 && cellStatus[ii][j] !== 'assigned') {
          cellStatus[ii][j] = 'crossed';
        }
      }
      for (let jj = 0; jj < n; jj++) {
        if (jj !== j && matrix[i][jj] === 0 && cellStatus[i][jj] !== 'assigned') {
          cellStatus[i][jj] = 'crossed';
        }
      }
    }

    let changed = true;
    while (changed) {
      changed = false;

      // Step 3.1: Row scan
      for (let i = 0; i < n; i++) {
        if (assignedRows.has(i)) continue;
        const zeros: number[] = [];
        for (let j = 0; j < n; j++) {
          if (matrix[i][j] === 0 && cellStatus[i][j] !== 'crossed' && !assignedCols.has(j)) {
            zeros.push(j);
          }
        }
        if (zeros.length === 1) {
          doAssign(i, zeros[0]);
          changed = true;
          snap('assign', {
            assignments: assignments.map(a => [...a] as [number, number]),
            cellStatus: cellStatus.map(r => [...r] as CellStatus[]),
            matchingSize: assignments.length,
            iteration,
            highlightRow: i,
            explanation:
              `Step 3.1: Row ${i + 1} has one available zero at column ${zeros[0] + 1}. Assign (${i + 1},${zeros[0] + 1}). |M| = ${assignments.length}.`,
          });
        }
      }

      // Step 3.2: Column scan
      for (let j = 0; j < n; j++) {
        if (assignedCols.has(j)) continue;
        const zeros: number[] = [];
        for (let i = 0; i < n; i++) {
          if (matrix[i][j] === 0 && cellStatus[i][j] !== 'crossed' && !assignedRows.has(i)) {
            zeros.push(i);
          }
        }
        if (zeros.length === 1) {
          doAssign(zeros[0], j);
          changed = true;
          snap('assign', {
            assignments: assignments.map(a => [...a] as [number, number]),
            cellStatus: cellStatus.map(r => [...r] as CellStatus[]),
            matchingSize: assignments.length,
            iteration,
            highlightCol: j,
            explanation:
              `Step 3.2: Column ${j + 1} has one available zero at row ${zeros[0] + 1}. Assign (${zeros[0] + 1},${j + 1}). |M| = ${assignments.length}.`,
          });
        }
      }
    }

    // Arbitrary assignment for unresolved zeros
    let hasUnresolved = true;
    while (hasUnresolved) {
      hasUnresolved = false;
      for (let i = 0; i < n && !hasUnresolved; i++) {
        if (assignedRows.has(i)) continue;
        for (let j = 0; j < n && !hasUnresolved; j++) {
          if (assignedCols.has(j)) continue;
          if (matrix[i][j] === 0 && cellStatus[i][j] === 'normal') {
            doAssign(i, j);
            hasUnresolved = true;
            snap('assign', {
              assignments: assignments.map(a => [...a] as [number, number]),
              cellStatus: cellStatus.map(r => [...r] as CellStatus[]),
              matchingSize: assignments.length,
              iteration,
              explanation:
                `Multiple zeros available. Arbitrarily assign (${i + 1},${j + 1}). |M| = ${assignments.length}.`,
            });
          }
        }
      }

      if (hasUnresolved) {
        let innerChanged = true;
        while (innerChanged) {
          innerChanged = false;
          for (let i = 0; i < n; i++) {
            if (assignedRows.has(i)) continue;
            const zeros: number[] = [];
            for (let j = 0; j < n; j++) {
              if (matrix[i][j] === 0 && cellStatus[i][j] !== 'crossed' && !assignedCols.has(j)) {
                zeros.push(j);
              }
            }
            if (zeros.length === 1) {
              doAssign(i, zeros[0]);
              innerChanged = true;
            }
          }
          for (let j = 0; j < n; j++) {
            if (assignedCols.has(j)) continue;
            const zeros: number[] = [];
            for (let i = 0; i < n; i++) {
              if (matrix[i][j] === 0 && cellStatus[i][j] !== 'crossed' && !assignedRows.has(i)) {
                zeros.push(i);
              }
            }
            if (zeros.length === 1) {
              doAssign(zeros[0], j);
              innerChanged = true;
            }
          }
        }
      }
    }

    const matchingSize = assignments.length;

    // Check matching
    if (matchingSize === n) {
      let totalCost = 0;
      for (const [i, j] of assignments) totalCost += original[i][j];
      const sorted = [...assignments].sort((a, b) => a[0] - b[0]);

      snap('complete', {
        assignments: sorted.map(a => [...a] as [number, number]),
        cellStatus: cellStatus.map(r => [...r] as CellStatus[]),
        matchingSize,
        iteration,
        explanation:
          `Perfect matching found! |M| = ${n}. ` +
          `Assignments: ${sorted.map(([i, j]) => `(${i + 1},${j + 1})`).join(', ')}. ` +
          `Minimum cost = ${totalCost}. Σu + Σv = ${obj()}.`,
      });
      break;
    }

    snap('check', {
      assignments: assignments.map(a => [...a] as [number, number]),
      cellStatus: cellStatus.map(r => [...r] as CellStatus[]),
      matchingSize,
      iteration,
      explanation:
        `|M| = ${matchingSize} < ${n}. Not a perfect matching. Find minimum vertex cover.`,
    });

    // Step 3.3: Minimum vertex cover
    const markedRows = new Array(n).fill(false);
    const markedCols = new Array(n).fill(false);

    for (let i = 0; i < n; i++) {
      if (!assignedRows.has(i)) markedRows[i] = true;
    }

    const unassignedRowList = markedRows.map((m: boolean, i: number) => m ? (i + 1) : null).filter(Boolean).join(', ');
    snap('mark', {
      assignments: assignments.map(a => [...a] as [number, number]),
      cellStatus: cellStatus.map(r => [...r] as CellStatus[]),
      markedRows: [...markedRows],
      markedCols: [...markedCols],
      matchingSize,
      iteration,
      explanation:
        `Step 3.3: Mark unassigned rows: {${unassignedRowList}}. ` +
        `In the flow network, these rows are directly reachable from source S (no matching edge saturates the S → R capacity).`,
    });

    let markChanged = true;
    while (markChanged) {
      markChanged = false;
      for (let i = 0; i < n; i++) {
        if (!markedRows[i]) continue;
        for (let j = 0; j < n; j++) {
          if (matrix[i][j] === 0 && !markedCols[j]) {
            markedCols[j] = true;
            markChanged = true;
          }
        }
      }
      for (let j = 0; j < n; j++) {
        if (!markedCols[j]) continue;
        for (const [ai, aj] of assignments) {
          if (aj === j && !markedRows[ai]) {
            markedRows[ai] = true;
            markChanged = true;
          }
        }
      }
    }

    const markedRowList = markedRows.map((m: boolean, i: number) => m ? (i + 1) : null).filter(Boolean).join(', ') || 'none';
    const markedColList = markedCols.map((m: boolean, j: number) => m ? (j + 1) : null).filter(Boolean).join(', ') || 'none';
    snap('mark', {
      assignments: assignments.map(a => [...a] as [number, number]),
      cellStatus: cellStatus.map(r => [...r] as CellStatus[]),
      markedRows: [...markedRows],
      markedCols: [...markedCols],
      matchingSize,
      iteration,
      explanation:
        `Propagate along alternating paths in the residual graph. ` +
        `From marked rows, follow non-matching zero edges to mark columns; from marked columns, follow matching edges backwards to mark rows. ` +
        `Marked rows: {${markedRowList}}. Marked columns: {${markedColList}}.`,
    });

    const coveredRows = markedRows.map((m: boolean) => !m);
    const coveredCols = [...markedCols];
    const coverCount = coveredRows.filter(Boolean).length + coveredCols.filter(Boolean).length;

    const covRowList = coveredRows.map((c: boolean, i: number) => c ? (i + 1) : null).filter(Boolean).join(', ');
    const covColList = coveredCols.map((c: boolean, j: number) => c ? (j + 1) : null).filter(Boolean).join(', ');
    snap('cover', {
      assignments: assignments.map(a => [...a] as [number, number]),
      cellStatus: cellStatus.map(r => [...r] as CellStatus[]),
      markedRows: [...markedRows],
      markedCols: [...markedCols],
      coveredRows: [...coveredRows],
      coveredCols: [...coveredCols],
      matchingSize,
      iteration,
      explanation:
        `Cover unreachable rows {${covRowList}} and reachable columns {${covColList}}. ` +
        `Total cover lines = ${coverCount} = |M|. ` +
        `This corresponds to the min-cut in the flow network separating S from T.`,
    });

    // Step 4: Find theta
    let theta = Infinity;
    const thetaCells: [number, number][] = [];
    for (let i = 0; i < n; i++) {
      if (coveredRows[i]) continue;
      for (let j = 0; j < n; j++) {
        if (coveredCols[j]) continue;
        if (matrix[i][j] < theta) {
          theta = matrix[i][j];
          thetaCells.length = 0;
          thetaCells.push([i, j]);
        } else if (matrix[i][j] === theta) {
          thetaCells.push([i, j]);
        }
      }
    }

    snap('theta', {
      assignments: assignments.map(a => [...a] as [number, number]),
      cellStatus: cellStatus.map(r => [...r] as CellStatus[]),
      coveredRows: [...coveredRows],
      coveredCols: [...coveredCols],
      highlightCells: thetaCells.map(c => [...c] as [number, number]),
      theta,
      matchingSize,
      iteration,
      explanation:
        `Step 4: θ = minimum uncovered value = ${theta}. Found at cell${thetaCells.length > 1 ? 's' : ''} ${thetaCells.map(([i, j]) => `(${i + 1},${j + 1})`).join(', ')}.`,
    });

    // Update duals and matrix
    for (let i = 0; i < n; i++) {
      if (!coveredRows[i]) u[i] += theta;
    }
    for (let j = 0; j < n; j++) {
      if (coveredCols[j]) v[j] -= theta;
    }
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (!coveredRows[i] && !coveredCols[j]) {
          matrix[i][j] -= theta;
        } else if (coveredRows[i] && coveredCols[j]) {
          matrix[i][j] += theta;
        }
      }
    }

    snap('update', {
      coveredRows: [...coveredRows],
      coveredCols: [...coveredCols],
      theta,
      matchingSize,
      iteration,
      explanation:
        `Subtract θ=${theta} from uncovered cells, add θ to doubly-covered cells. ` +
        `Σu + Σv = ${obj()}. Repeat step 3.`,
    });

    iteration++;
  }

  return steps;
}
