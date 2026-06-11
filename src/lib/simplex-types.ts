export type SimplexStepRule =
  | 'init'
  | 'check_optimal'
  | 'select_pivot_col'
  | 'ratio_test'
  | 'pivot'
  | 'optimal'
  | 'unbounded';

export interface SimplexStep {
  rule: SimplexStepRule;
  tableau: number[][];
  basicVars: number[];
  numVars: number;
  numConstraints: number;
  varNames: string[];
  pivotRow: number;
  pivotCol: number;
  ratios: (number | null)[];
  objectiveValue: number;
  solution: number[];
  iteration: number;
  explanation: string;
}
