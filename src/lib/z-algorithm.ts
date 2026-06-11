import { ZAlgorithmStep } from './z-algorithm-types';

export function buildZAlgorithmSteps(pattern: string, text: string): ZAlgorithmStep[] {
  const steps: ZAlgorithmStep[] = [];
  const combined = pattern.length > 0 ? pattern + '$' + text : text;
  const n = combined.length;
  const patLen = pattern.length;
  const zArray: number[] = new Array(n).fill(0);
  let l = 0;
  let r = 0;
  const matchPositions: number[] = [];

  function snap(
    position: number,
    rule: ZAlgorithmStep['rule'],
    explanation: string,
    k1: number | null = null,
  ) {
    steps.push({
      position,
      l,
      r,
      zArray: [...zArray],
      combined,
      pattern,
      text,
      rule,
      explanation,
      k1,
      matchPositions: [...matchPositions],
    });
  }

  snap(0, 'init',
    pattern.length > 0
      ? `Combined string: "${pattern}" + "$" + "${text}" = "${combined}" (length ${n}). ` +
        `The Z-array stores, for each position k, the length of the longest substring starting at k ` +
        `that matches a prefix of the combined string. Z[0] is 0 by convention.`
      : `Running Z-algorithm on text "${text}" (length ${n}). No pattern — computing Z-array directly. ` +
        `Z[k] = length of the longest substring starting at k that matches a prefix of the string. Z[0] is 0 by convention.`
  );

  for (let k = 1; k < n; k++) {
    if (k > r) {
      snap(k, 'case_outside',
        `Position ${k}: '${combined[k]}'. Since k=${k} > r=${r}, we are outside the current Z-box. ` +
        `Starting naive character-by-character comparison from position ${k} against the prefix.`
      );

      l = r = k;
      while (r < n && combined[r] === combined[r - l]) {
        r++;
      }
      zArray[k] = r - l;
      r--;

      snap(k, 'scan',
        zArray[k] > 0
          ? `Matched ${zArray[k]} character${zArray[k] !== 1 ? 's' : ''}: ` +
            `"${combined.slice(k, k + zArray[k])}" matches prefix "${combined.slice(0, zArray[k])}". ` +
            `Z[${k}] = ${zArray[k]}. Z-box updated to [${l}, ${r}].`
          : `No match: '${combined[k]}' ≠ '${combined[0]}'. Z[${k}] = 0.`
      );
    } else {
      const k1 = k - l;
      const remainingBox = r - k + 1;

      snap(k, 'case_inside',
        `Position ${k}: '${combined[k]}'. Since k=${k} ≤ r=${r}, we are inside the Z-box [${l}, ${r}]. ` +
        `Mirror position: k1 = k − l = ${k} − ${l} = ${k1}. Z[k1] = Z[${k1}] = ${zArray[k1]}. ` +
        `Remaining Z-box from k to r: ${remainingBox}.`,
        k1,
      );

      if (zArray[k1] < remainingBox) {
        zArray[k] = zArray[k1];

        snap(k, 'copy',
          `Z[${k1}] = ${zArray[k1]} < remaining box ${remainingBox}, so the match doesn't reach the ` +
          `Z-box boundary. Safely copy: Z[${k}] = Z[${k1}] = ${zArray[k]}. Z-box unchanged [${l}, ${r}].`,
          k1,
        );
      } else {
        const oldR = r;
        l = k;
        while (r < n && combined[r] === combined[r - l]) {
          r++;
        }
        zArray[k] = r - l;
        r--;

        const extended = r - oldR;
        snap(k, 'scan',
          `Z[${k1}] = ${zArray[k1]} ≥ remaining box ${remainingBox}, ` +
          `so the match reaches or exceeds the Z-box boundary. ` +
          (extended > 0
            ? `Extended ${extended} position${extended !== 1 ? 's' : ''} beyond old boundary. `
            : `No extension beyond the boundary. `) +
          `Z[${k}] = ${zArray[k]}. Z-box updated to [${l}, ${r}].`,
          k1,
        );
      }
    }

    if (patLen > 0 && zArray[k] === patLen && k >= patLen + 1) {
      const textPos = k - patLen - 1;
      matchPositions.push(textPos);

      snap(k, 'match',
        `Z[${k}] = ${patLen} = length of pattern! ` +
        `The substring starting at position ${k} in the combined string matches the entire pattern "${pattern}". ` +
        `This corresponds to text index ${textPos}. Pattern found at text[${textPos}].`
      );
    }
  }

  snap(n - 1, 'complete',
    patLen === 0
      ? `Algorithm complete. Z-array computed for "${text}".`
      : matchPositions.length > 0
        ? `Algorithm complete. Pattern "${pattern}" found at ${matchPositions.length} ` +
          `position${matchPositions.length !== 1 ? 's' : ''} in the text: ` +
          `[${matchPositions.join(', ')}].`
        : `Algorithm complete. Pattern "${pattern}" was not found in the text "${text}".`
  );

  return steps;
}
