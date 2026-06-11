export type BMStepRule =
  | 'init'
  | 'align'
  | 'compare_match'
  | 'compare_mismatch'
  | 'skip'
  | 'full_match'
  | 'complete';

export interface BMStep {
  rule: BMStepRule;
  text: string;
  pattern: string;
  textPos: number;
  patPos: number;
  explanation: string;
  matchPositions: number[];
  matchedIndices: number[];
  mismatchIndex: number;
  bcShift: number;
  gsShift: number;
  appliedShift: number;
  badCharTable: number[][];
  zSuffix: number[];
  goodSuffix: number[];
  matchedPrefix: number[];
  uniqueChars: string[];
}
