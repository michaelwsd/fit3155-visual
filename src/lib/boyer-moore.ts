import { BMStep, BMStepRule } from './boyer-moore-types';

function getZArray(str: string): number[] {
  const n = str.length;
  const z = new Array(n).fill(0);
  let l = 0, r = 0;

  for (let k = 1; k < n; k++) {
    if (k > r) {
      l = r = k;
      while (r < n && str[r] === str[r - l]) r++;
      z[k] = r - l;
      r--;
    } else {
      const k1 = k - l;
      if (z[k1] < r - k + 1) {
        z[k] = z[k1];
      } else {
        l = k;
        while (r < n && str[r] === str[r - l]) r++;
        z[k] = r - l;
        r--;
      }
    }
  }
  return z;
}

function reverseZArray(s: string): number[] {
  const reversed = s.split('').reverse().join('');
  const z = getZArray(reversed);
  return z.reverse();
}

function preprocessBadChar(pat: string): { table: number[][]; chars: string[] } {
  const m = pat.length;
  const charSet = [...new Set(pat)].sort();
  const charIndex = new Map<string, number>();
  charSet.forEach((c, i) => charIndex.set(c, i));

  const table: number[][] = [];
  const lastSeen = new Array(charSet.length).fill(0);

  for (let i = 0; i < m; i++) {
    table.push([...lastSeen]);
    const idx = charIndex.get(pat[i])!;
    lastSeen[idx] = i + 1;
  }

  return { table, chars: charSet };
}

function preprocessGoodSuffix(pat: string): number[] {
  const m = pat.length;
  const zSuffix = reverseZArray(pat);
  const gs = new Array(m + 1).fill(0);

  for (let p = 0; p < m - 1; p++) {
    const j = m - zSuffix[p];
    const charBefore = p - zSuffix[p];

    if (zSuffix[p] > 0 && (charBefore < 0 || pat[j - 1] !== pat[charBefore])) {
      gs[j] = p + 1;
    }

    if (pat[p] !== pat[m - 1]) {
      gs[m] = p + 1;
    }
  }

  return gs;
}

function preprocessMatchedPrefix(pat: string): number[] {
  const m = pat.length;
  const z = getZArray(pat);
  const mp = new Array(m + 1).fill(0);
  mp[0] = m;
  let longest = 0;

  for (let i = m - 1; i > 0; i--) {
    if (z[i] === m - i) {
      longest = Math.max(longest, z[i]);
    }
    mp[i] = longest;
  }

  return mp;
}

export function buildBMSteps(pattern: string, text: string): BMStep[] {
  const steps: BMStep[] = [];
  const m = pattern.length;
  const n = text.length;

  if (m === 0 || n === 0) {
    steps.push({
      rule: 'complete',
      text, pattern,
      textPos: 0, patPos: -1,
      explanation: 'Pattern or text is empty. No matches possible.',
      matchPositions: [], matchedIndices: [], mismatchIndex: -1,
      bcShift: 0, gsShift: 0, appliedShift: 0,
      badCharTable: [], zSuffix: [], goodSuffix: [], matchedPrefix: [], uniqueChars: [],
    });
    return steps;
  }

  const { table: bcTable, chars: uniqueChars } = preprocessBadChar(pattern);
  const zSuffix = reverseZArray(pattern);
  const gs = preprocessGoodSuffix(pattern);
  const mp = preprocessMatchedPrefix(pattern);

  const charIndex = new Map<string, number>();
  uniqueChars.forEach((c, i) => charIndex.set(c, i));

  function computeBCShift(j: number, char: string): number {
    const idx = charIndex.get(char);
    if (idx === undefined) return j + 1;
    if (bcTable[j][idx] === 0) return j + 1;
    return j - (bcTable[j][idx] - 1);
  }

  const matchPositions: number[] = [];
  let matchedSoFar: number[] = [];

  function snap(rule: BMStepRule, overrides: Partial<BMStep>) {
    steps.push({
      rule,
      text, pattern,
      textPos: 0,
      patPos: -1,
      explanation: '',
      matchPositions: [...matchPositions],
      matchedIndices: [...matchedSoFar],
      mismatchIndex: -1,
      bcShift: 0, gsShift: 0, appliedShift: 0,
      badCharTable: bcTable,
      zSuffix,
      goodSuffix: gs,
      matchedPrefix: mp,
      uniqueChars,
      ...overrides,
    });
  }

  snap('init', {
    explanation:
      `Preprocessed pattern "${pattern}" (length ${m}). ` +
      `Bad character table built for ${uniqueChars.length} unique character${uniqueChars.length !== 1 ? 's' : ''}: [${uniqueChars.join(', ')}]. ` +
      `Good suffix and matched prefix arrays computed. ` +
      `Boyer-Moore aligns the pattern with the text and compares right-to-left, ` +
      `using these tables to skip unnecessary comparisons on a mismatch.`,
  });

  if (m > n) {
    snap('complete', {
      explanation: `Pattern (length ${m}) is longer than text (length ${n}). No matches possible.`,
    });
    return steps;
  }

  let i = 0;
  let currentSkipStart = -1;
  let currentSkipLen = -1;

  while (i <= n - m) {
    matchedSoFar = [];

    snap('align', {
      textPos: i,
      patPos: m - 1,
      explanation:
        `Align pattern at text position ${i}. ` +
        `Compare right-to-left starting from pattern[${m - 1}]='${pattern[m - 1]}' vs text[${i + m - 1}]='${text[i + m - 1]}'.` +
        (currentSkipStart >= 0 && currentSkipLen > 0
          ? ` Galil skip active: pattern[${Math.max(0, currentSkipStart - currentSkipLen + 1)}..${currentSkipStart}] can be skipped.`
          : ''),
    });

    let j = m - 1;
    let localSkipStart = currentSkipStart;
    let localSkipLen = currentSkipLen;

    while (j >= 0 && pattern[j] === text[i + j]) {
      if (j === localSkipStart) {
        if (localSkipLen > 0) {
          const skipFrom = j;
          const skipTo = Math.max(0, j - localSkipLen + 1);
          for (let s = 0; s < localSkipLen; s++) {
            if (j - s >= 0) matchedSoFar.push(j - s);
          }

          snap('skip', {
            textPos: i,
            patPos: j,
            explanation:
              `Galil's optimization: skip pattern[${skipTo}..${skipFrom}] ` +
              `(${localSkipLen} position${localSkipLen !== 1 ? 's' : ''}). ` +
              `These characters were verified in a previous alignment.`,
          });
        }

        j -= localSkipLen;
        localSkipStart = localSkipLen = -1;
        continue;
      }

      matchedSoFar.push(j);

      snap('compare_match', {
        textPos: i,
        patPos: j,
        explanation:
          `pattern[${j}]='${pattern[j]}' = text[${i + j}]='${text[i + j]}': Match!` +
          (j === 0 ? ' All characters matched.' : ' Move left to the next character.'),
      });

      j--;
    }

    if (j < 0) {
      matchPositions.push(i);
      const shift = m - mp[1];
      currentSkipStart = mp[1] > 0 ? 0 : -1;
      currentSkipLen = mp[1];

      snap('full_match', {
        textPos: i,
        patPos: -1,
        appliedShift: shift,
        explanation:
          `Full match found at text position ${i}! ` +
          `Shift by ${shift} (matched prefix mp[1]=${mp[1]}).` +
          (mp[1] > 0 ? ` Next alignment can skip pattern[0..${mp[1] - 1}].` : ''),
      });

      i += shift;
    } else {
      const mismatchChar = text[i + j];
      const bc = computeBCShift(j, mismatchChar);

      const gsVal = gs[j + 1];
      const mpVal = mp[j + 1];
      let gsShift: number;
      let gsSkipStart: number;
      let gsSkipLen: number;
      let usedGs: boolean;

      if (gsVal > 0) {
        gsShift = m - gsVal;
        gsSkipStart = gsVal - 1;
        gsSkipLen = m - j - 1;
        usedGs = true;
      } else {
        gsShift = m - mpVal;
        gsSkipStart = mpVal > 0 ? mpVal - 1 : -1;
        gsSkipLen = mpVal;
        usedGs = false;
      }

      const shift = Math.max(bc, gsShift);

      let bcExpl: string;
      const charIdx = charIndex.get(mismatchChar);
      if (charIdx === undefined) {
        bcExpl = `'${mismatchChar}' not in pattern → shift ${bc}`;
      } else if (bcTable[j][charIdx] === 0) {
        bcExpl = `'${mismatchChar}' not seen before position ${j} → shift ${bc}`;
      } else {
        bcExpl = `'${mismatchChar}' last at position ${bcTable[j][charIdx] - 1} → shift ${bc}`;
      }

      const suffixLen = m - j - 1;
      let gsExpl: string;
      if (suffixLen === 0) {
        gsExpl = 'No suffix (mismatch at rightmost)';
        if (gsVal > 0) {
          gsExpl += `, gs[${j + 1}]=${gsVal} → shift ${gsShift}`;
        } else if (mpVal > 0) {
          gsExpl += `, mp[${j + 1}]=${mpVal} → shift ${gsShift}`;
        } else {
          gsExpl += ` → shift ${gsShift}`;
        }
      } else {
        const suffix = pattern.slice(j + 1);
        if (usedGs) {
          gsExpl = `Suffix "${suffix}" re-occurs ending at position ${gsVal - 1} → shift ${gsShift}`;
        } else if (mpVal > 0) {
          gsExpl = `No re-occurrence of "${suffix}". Matched prefix length ${mpVal} → shift ${gsShift}`;
        } else {
          gsExpl = `No re-occurrence of "${suffix}" and no matched prefix → shift ${gsShift}`;
        }
      }

      const winner = gsShift > bc
        ? 'Good suffix wins'
        : bc > gsShift
          ? 'Bad character wins'
          : 'Equal shifts';

      snap('compare_mismatch', {
        textPos: i,
        patPos: j,
        mismatchIndex: j,
        bcShift: bc,
        gsShift: gsShift,
        appliedShift: shift,
        explanation:
          `Mismatch: pattern[${j}]='${pattern[j]}' ≠ text[${i + j}]='${mismatchChar}'. ` +
          `Bad char: ${bcExpl}. ` +
          `Good suffix: ${gsExpl}. ` +
          `${winner} → shift by ${shift}.`,
      });

      if (gsShift > bc) {
        currentSkipStart = gsSkipStart;
        currentSkipLen = gsSkipLen;
      } else {
        currentSkipStart = -1;
        currentSkipLen = -1;
      }

      i += shift;
    }
  }

  snap('complete', {
    textPos: i,
    patPos: -1,
    explanation: matchPositions.length > 0
      ? `Algorithm complete. Pattern "${pattern}" found at ${matchPositions.length} ` +
        `position${matchPositions.length !== 1 ? 's' : ''}: [${matchPositions.join(', ')}].`
      : `Algorithm complete. Pattern "${pattern}" was not found in the text.`,
  });

  return steps;
}
