export type ZStepRule =
  | 'init'
  | 'case_outside'
  | 'case_inside'
  | 'scan'
  | 'copy'
  | 'match'
  | 'complete';

export interface ZAlgorithmStep {
  position: number;
  l: number;
  r: number;
  zArray: number[];
  combined: string;
  pattern: string;
  text: string;
  rule: ZStepRule;
  explanation: string;
  k1: number | null;
  matchPositions: number[];
}
