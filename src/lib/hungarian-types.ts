export type HungarianStepRule =
  | 'init'
  | 'row_reduce'
  | 'col_reduce'
  | 'assign'
  | 'check'
  | 'mark'
  | 'cover'
  | 'theta'
  | 'update'
  | 'complete';

export type CellStatus = 'normal' | 'assigned' | 'crossed';

export interface HungarianStep {
  rule: HungarianStepRule;
  matrix: number[][];
  originalMatrix: number[][];
  u: number[];
  v: number[];
  assignments: [number, number][];
  cellStatus: CellStatus[][];
  markedRows: boolean[];
  markedCols: boolean[];
  coveredRows: boolean[];
  coveredCols: boolean[];
  highlightCells: [number, number][];
  highlightRow: number;
  highlightCol: number;
  theta: number;
  matchingSize: number;
  n: number;
  iteration: number;
  objective: number;
  explanation: string;
}
