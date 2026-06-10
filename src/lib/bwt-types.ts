export type BWTStepRule =
  | 'init'
  | 'suffix_array'
  | 'bwt_built'
  | 'rank_built'
  | 'occ_built'
  | 'search_start'
  | 'search_step'
  | 'search_fail'
  | 'search_done'
  | 'complete';

export interface BWTStep {
  rule: BWTStepRule;
  text: string;
  textWithSentinel: string;
  pattern: string;
  explanation: string;

  suffixArray: number[];
  bwtString: string;
  firstColumn: string;
  suffixes: string[];

  rank: number[];
  occTable: number[][];
  uniqueChars: string[];

  sp: number;
  ep: number;
  prevSp: number;
  prevEp: number;
  patPos: number;
  currentChar: string;
  matchPositions: number[];
}
