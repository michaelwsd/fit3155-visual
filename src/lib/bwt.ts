import { BWTStep, BWTStepRule } from './bwt-types';

function suffixArray(str: string): number[] {
  const indices = Array.from({ length: str.length }, (_, i) => i);
  indices.sort((a, b) => {
    const sa = str.slice(a);
    const sb = str.slice(b);
    return sa < sb ? -1 : sa > sb ? 1 : 0;
  });
  return indices;
}

function constructBWT(str: string, sa: number[]): string {
  return sa.map(s => (s === 0 ? '$' : str[s - 1])).join('');
}

function buildRank(bwt: string): number[] {
  const LENGTH = 256;
  const freq = new Array(LENGTH).fill(0);
  for (const c of bwt) freq[c.charCodeAt(0)]++;

  const rank = new Array(LENGTH).fill(-1);
  let curr = 0;
  for (let i = 0; i < LENGTH; i++) {
    if (freq[i] > 0) {
      rank[i] = curr;
      curr += freq[i];
    }
  }
  return rank;
}

function buildOccurrence(bwt: string): number[][] {
  const LENGTH = 256;
  const occ: number[][] = [];
  const curr = new Array(LENGTH).fill(0);
  for (const c of bwt) {
    occ.push([...curr]);
    curr[c.charCodeAt(0)]++;
  }
  return occ;
}

function getUniqueChars(str: string): string[] {
  return [...new Set(str)].sort();
}

export function buildBWTSteps(text: string, pattern: string): BWTStep[] {
  const steps: BWTStep[] = [];
  const textWithSentinel = text + '$';
  const n = textWithSentinel.length;
  const uniqueChars = getUniqueChars(textWithSentinel);

  function makeStep(
    partial: Partial<BWTStep> & { rule: BWTStepRule; explanation: string },
  ): BWTStep {
    return {
      text,
      textWithSentinel,
      pattern,
      suffixArray: [],
      bwtString: '',
      firstColumn: '',
      suffixes: [],
      rank: [],
      occTable: [],
      uniqueChars,
      sp: -1,
      ep: -1,
      prevSp: -1,
      prevEp: -1,
      patPos: -1,
      currentChar: '',
      matchPositions: [],
      ...partial,
    };
  }

  // init
  steps.push(
    makeStep({
      rule: 'init',
      explanation: `Starting BWT preprocessing for text "${text}" with pattern "${pattern}". First, append sentinel '$' to get "${textWithSentinel}".`,
    }),
  );

  // Build suffix array
  const sa = suffixArray(textWithSentinel);
  const suffixes = sa.map(i => textWithSentinel.slice(i));
  const firstCol = suffixes.map(s => s[0]).join('');

  steps.push(
    makeStep({
      rule: 'suffix_array',
      suffixArray: sa,
      suffixes,
      firstColumn: firstCol,
      explanation: `Built suffix array by sorting all ${n} suffixes of "${textWithSentinel}" lexicographically. SA = [${sa.join(', ')}].`,
    }),
  );

  // Build BWT
  const bwt = constructBWT(textWithSentinel, sa);

  steps.push(
    makeStep({
      rule: 'bwt_built',
      suffixArray: sa,
      suffixes,
      firstColumn: firstCol,
      bwtString: bwt,
      explanation: `Constructed BWT string "${bwt}" from the suffix array. For each suffix at SA[i] = s, BWT[i] = text[s−1], or '$' if s = 0. BWT is the last column (L) of the sorted suffix matrix.`,
    }),
  );

  // Build rank
  const fullRank = buildRank(bwt);
  const compactRank: number[] = uniqueChars.map(c => fullRank[c.charCodeAt(0)]);

  steps.push(
    makeStep({
      rule: 'rank_built',
      suffixArray: sa,
      suffixes,
      firstColumn: firstCol,
      bwtString: bwt,
      rank: compactRank,
      explanation: `Built rank array (C array). rank[c] = first position of c in the first column F. ${uniqueChars.map((c, i) => `'${c}':${compactRank[i]}`).join(', ')}.`,
    }),
  );

  // Build occurrence table
  const fullOcc = buildOccurrence(bwt);
  const compactOcc = fullOcc.map(row =>
    uniqueChars.map(c => row[c.charCodeAt(0)]),
  );

  steps.push(
    makeStep({
      rule: 'occ_built',
      suffixArray: sa,
      suffixes,
      firstColumn: firstCol,
      bwtString: bwt,
      rank: compactRank,
      occTable: compactOcc,
      explanation: `Built occurrence table. occ[i][c] = count of character c in BWT[0..i−1]. Enables O(1) range narrowing during backward search.`,
    }),
  );

  // Backward search
  let sp = 0;
  let ep = n - 1;
  const m = pattern.length;
  let patPos = m - 1;

  const baseSearchStep: Partial<BWTStep> = {
    suffixArray: sa,
    suffixes,
    firstColumn: firstCol,
    bwtString: bwt,
    rank: compactRank,
    occTable: compactOcc,
  };

  steps.push(
    makeStep({
      ...baseSearchStep,
      rule: 'search_start',
      sp,
      ep,
      patPos,
      currentChar: pattern[patPos],
      explanation: `Begin backward search. Range [sp, ep] = [0, ${ep}] covers all suffixes. Scan pattern "${pattern}" right-to-left starting at position ${patPos} (char '${pattern[patPos]}').`,
    }),
  );

  while (patPos >= 0 && sp <= ep) {
    const c = pattern[patPos];
    const code = c.charCodeAt(0);
    const prevSp = sp;
    const prevEp = ep;

    if (fullRank[code] === -1) {
      sp = 1;
      ep = 0;
      steps.push(
        makeStep({
          ...baseSearchStep,
          rule: 'search_fail',
          sp,
          ep,
          prevSp,
          prevEp,
          patPos,
          currentChar: c,
          explanation: `Character '${c}' at pattern[${patPos}] does not exist in the text. Pattern "${pattern}" not found.`,
        }),
      );
      break;
    }

    const occSp = fullOcc[prevSp][code];
    const occEp = fullOcc[prevEp][code];
    const bwtMatch = bwt[prevEp] === c ? 1 : 0;

    sp = fullRank[code] + occSp;
    ep = fullRank[code] + occEp + bwtMatch - 1;

    if (sp > ep) {
      steps.push(
        makeStep({
          ...baseSearchStep,
          rule: 'search_fail',
          sp,
          ep,
          prevSp,
          prevEp,
          patPos,
          currentChar: c,
          explanation: `'${c}' at pattern[${patPos}]: sp = rank['${c}'] + occ[${prevSp}]['${c}'] = ${fullRank[code]} + ${occSp} = ${sp}, ep = rank['${c}'] + occ[${prevEp}]['${c}'] + ${bwtMatch} − 1 = ${ep}. sp > ep → pattern "${pattern}" not found.`,
        }),
      );
      break;
    }

    steps.push(
      makeStep({
        ...baseSearchStep,
        rule: 'search_step',
        sp,
        ep,
        prevSp,
        prevEp,
        patPos,
        currentChar: c,
        explanation: `'${c}' at pattern[${patPos}]: sp = rank['${c}'] + occ[${prevSp}]['${c}'] = ${fullRank[code]} + ${occSp} = ${sp}, ep = rank['${c}'] + occ[${prevEp}]['${c}'] + ${bwtMatch} − 1 = ${ep}. Range [${sp}, ${ep}] → ${ep - sp + 1} matching suffix(es).`,
      }),
    );

    patPos--;
  }

  if (sp <= ep) {
    const matchPositions: number[] = [];
    for (let i = sp; i <= ep; i++) matchPositions.push(sa[i]);
    matchPositions.sort((a, b) => a - b);

    steps.push(
      makeStep({
        ...baseSearchStep,
        rule: 'search_done',
        sp,
        ep,
        patPos: -1,
        currentChar: '',
        matchPositions,
        explanation: `All pattern characters processed. Range [${sp}, ${ep}] → ${matchPositions.length} match(es). Pattern "${pattern}" found at position(s): ${matchPositions.join(', ')}.`,
      }),
    );
  }

  const last = steps[steps.length - 1];
  const finalMatches = last.matchPositions;

  steps.push(
    makeStep({
      ...baseSearchStep,
      rule: 'complete',
      sp: last.sp,
      ep: last.ep,
      patPos: -1,
      currentChar: '',
      matchPositions: finalMatches,
      explanation:
        finalMatches.length > 0
          ? `Search complete. Found ${finalMatches.length} occurrence(s) of "${pattern}" in "${text}" at position(s): ${finalMatches.join(', ')}.`
          : `Search complete. Pattern "${pattern}" does not occur in "${text}".`,
    }),
  );

  return steps;
}
