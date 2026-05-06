// Ukkonen's suffix tree algorithm — server-side only, not bundled to client

import { TreeNode, StepSnapshot, RuleApplied } from './types';

function cloneNodes(nodes: InternalNode[]): TreeNode[] {
  return nodes.map((n) => ({
    id: n.id,
    children: [...n.children],
    start: n.start,
    end: n.end === null ? 'leaf' : n.end,
    isLeaf: n.isLeaf,
    suffixIndex: n.suffixIndex,
    suffixLink: n.suffixLink,
  }));
}

interface InternalNode {
  id: number;
  children: (number | null)[];
  start: number;
  end: number | null; // null means leaf (uses global leafEnd)
  isLeaf: boolean;
  suffixIndex: number;
  suffixLink: number | null;
}

export function buildSteps(txt: string): StepSnapshot[] {
  const steps: StepSnapshot[] = [];
  const nodes: InternalNode[] = [];
  let nextId = 0;
  let leafEnd = -1;

  function makeNode(
    start: number,
    end: number | null,
    suffixIndex: number,
    isLeaf: boolean
  ): InternalNode {
    const node: InternalNode = {
      id: nextId++,
      children: new Array(128).fill(null),
      start,
      end,
      isLeaf,
      suffixIndex,
      suffixLink: null,
    };
    nodes.push(node);
    return node;
  }

  function getEnd(node: InternalNode): number {
    return node.end === null ? leafEnd : node.end;
  }

  function getLength(node: InternalNode): number {
    return getEnd(node) - node.start + 1;
  }

  // Create root
  const root = makeNode(-1, -1, -1, false);
  root.suffixLink = root.id;

  let activeNode = root.id;
  let activeEdge = -1;
  let activeLength = 0;
  let lastj = 0;

  // Helper: describe remainder — the characters implicitly matched in previous phases
  function remStr(phase: number, len: number): string {
    if (len <= 0) return 'none';
    const start = phase - len;
    const end = phase - 1;
    if (start < 0 || end < 0 || end >= txt.length) return 'none';
    return `"${txt.slice(start, end + 1)}" [${start}, ${end}]`;
  }

  function nodeLabel(id: number): string {
    if (id === root.id) return 'root';
    const node = nodes[id];
    if (node.isLeaf) return `L${node.suffixIndex}`;
    return `N${id}`;
  }

  function snap(
    phase: number,
    extension: number,
    rule: RuleApplied,
    explanation: string,
    newNodeIds: number[] = [],
    highlightEdge: [number, number] | null = null,
    slFrom: number | null = null,
    slTo: number | null = null,
  ) {
    steps.push({
      phase,
      extension,
      txt,
      leafEnd,
      activeNodeId: activeNode,
      activeEdge,
      activeLength,
      lastj,
      lastNewNodeId: lastNewNode,
      rule,
      explanation,
      nodes: cloneNodes(nodes),
      newNodeIds,
      highlightEdge,
      suffixLinkFrom: slFrom,
      suffixLinkTo: slTo,
    });
  }

  let lastNewNode: number | null = null;

  for (let i = 0; i < txt.length; i++) {
    // Rule 1: extend all leaves
    const prevLeafEnd = leafEnd;
    leafEnd++;

    lastNewNode = null;

    snap(i, -1, 'rule1',
      `Phase ${i + 1}: Processing character '${txt[i]}' (index ${i}). ` +
      `Leaf end incremented from ${prevLeafEnd} to ${leafEnd} — all existing leaf edges now include '${txt[i]}'. ` +
      `Remainder is ${remStr(i, activeLength)}. ` +
      `Extensions ${1}..${lastj} are handled by Rule 1 (leaf extension). ` +
      `We need to explicitly process extensions ${lastj + 1}..${i + 1}.`
    );

    while (lastj <= i) {
      const edgeChar =
        activeLength === 0 ? txt.charCodeAt(i) : txt.charCodeAt(activeEdge);
      const edgeNodeId = nodes[activeNode].children[edgeChar];

      if (edgeNodeId === null) {
        // Rule 2 Case 1: no outgoing edge — create new leaf
        const newLeaf = makeNode(i, null, lastj, true);
        nodes[activeNode].children[edgeChar] = newLeaf.id;

        const slFrom = lastNewNode;
        if (lastNewNode !== null) {
          nodes[lastNewNode].suffixLink = activeNode;
        }
        const prevLastNewNode = lastNewNode;
        lastNewNode = null;

        const lookupChar = String.fromCharCode(edgeChar);
        snap(i, lastj, 'rule2case1',
          `Extension ${lastj + 1}: Trying to insert suffix "${txt.slice(lastj, i + 1)}" (indices [${lastj}, ${i}]). ` +
          `Active node is ${nodeLabel(activeNode)}, remainder is ${remStr(i, activeLength)}. ` +
          `No outgoing edge starting with '${lookupChar}' from ${nodeLabel(activeNode)}. ` +
          `Created new leaf L${lastj} with edge label starting at index ${i}. ` +
          `Rule 2, Case 1 (Alternate) applied.` +
          (prevLastNewNode !== null ? ` Suffix link set: ${nodeLabel(prevLastNewNode)} → ${nodeLabel(activeNode)}.` : ''),
          [newLeaf.id],
          [activeNode, newLeaf.id],
          slFrom,
          slFrom !== null ? activeNode : null,
        );
      } else {
        const edgeNode = nodes[edgeNodeId];
        const edgeLength = getLength(edgeNode);

        // Skip/count
        if (activeLength >= edgeLength) {
          const prevAN = activeNode;
          const prevAL = activeLength;
          activeNode = edgeNodeId;
          activeEdge += edgeLength;
          activeLength -= edgeLength;

          const edgeLabelStr = txt.slice(edgeNode.start, getEnd(edgeNode) + 1);
          snap(i, lastj, 'skipcount',
            `Extension ${lastj + 1}: Walking down the tree (Skip/Count). ` +
            `Remainder ${remStr(i, prevAL)} is longer than edge "${edgeLabelStr}" (length ${edgeLength}). ` +
            `Moved active node from ${nodeLabel(prevAN)} to ${nodeLabel(activeNode)}. ` +
            `Remainder updated: ${remStr(i, prevAL)} → ${remStr(i, activeLength)}. ` +
            `Continuing to walk down from the new active node.`
          );
          continue;
        }

        // Rule 3: character already exists
        if (txt[i] === txt[edgeNode.start + activeLength]) {
          const slFrom = lastNewNode;
          const slTo = lastNewNode !== null ? activeNode : null;
          if (lastNewNode !== null) {
            nodes[lastNewNode].suffixLink = activeNode;
          }
          const prevLastNewNode = lastNewNode;
          lastNewNode = null;

          snap(i, lastj, 'rule3',
            `Extension ${lastj + 1}: Character '${txt[i]}' (index ${i}) already exists on the edge to ${nodeLabel(edgeNodeId)} ` +
            `at position ${edgeNode.start + activeLength}. Showstopper — Rule 3 applied. ` +
            `Remainder grows: ${remStr(i, activeLength)} → ${remStr(i, activeLength + 1)}. ` +
            `All remaining extensions ${lastj + 2}..${i + 1} are implicit (already in the tree). ` +
            `Phase ${i + 1} ends here.` +
            (prevLastNewNode !== null ? ` Suffix link set: ${nodeLabel(prevLastNewNode)} → ${nodeLabel(activeNode)}.` : ''),
            [],
            [activeNode, edgeNodeId],
            slFrom,
            slTo,
          );

          activeLength++;
          activeEdge = edgeNode.start;
          break;
        }

        // Rule 2 Case 2: split edge, create internal node + new leaf
        const start = edgeNode.start;
        const splitLabel = txt.slice(start, start + activeLength);
        const remainingLabel = txt.slice(start + activeLength, getEnd(edgeNode) + 1);
        edgeNode.start += activeLength;

        const newInternal = makeNode(start, start + activeLength - 1, -1, false);
        // Suffix link will be set correctly by a subsequent extension (Rule 2 or Rule 3).
        // If no subsequent extension resolves it, we set it to root after the loop.

        const newLeaf = makeNode(i, null, lastj, true);

        newInternal.children[txt.charCodeAt(i)] = newLeaf.id;
        newInternal.children[txt.charCodeAt(edgeNode.start)] = edgeNodeId;
        nodes[activeNode].children[txt.charCodeAt(start)] = newInternal.id;

        let slFrom: number | null = null;
        let slTo: number | null = null;
        if (lastNewNode !== null) {
          nodes[lastNewNode].suffixLink = newInternal.id;
          slFrom = lastNewNode;
          slTo = newInternal.id;
        }
        const prevLastNewNode = lastNewNode;
        lastNewNode = newInternal.id;

        snap(i, lastj, 'rule2case2',
          `Extension ${lastj + 1}: Trying to insert suffix "${txt.slice(lastj, i + 1)}" (indices [${lastj}, ${i}]). ` +
          `Active node is ${nodeLabel(activeNode)}, remainder is ${remStr(i, activeLength)}. ` +
          `Character '${txt[i]}' differs from '${txt[edgeNode.start]}' mid-edge. ` +
          `Split edge: "${splitLabel}" becomes internal node N${newInternal.id}, ` +
          `"${remainingLabel}" continues to old node, and new leaf L${lastj} added for '${txt[i]}'. ` +
          `Rule 2, Case 2 (Regular) applied.` +
          (prevLastNewNode !== null ? ` Suffix link set: ${nodeLabel(prevLastNewNode)} → N${newInternal.id}.` : '') +
          ` Last new internal node is now N${newInternal.id}.`,
          [newInternal.id, newLeaf.id],
          [activeNode, newInternal.id],
          slFrom,
          slTo,
        );
      }

      lastj++;

      // Active point traversal — record as a separate step
      if (activeNode === root.id && activeLength > 0) {
        const prevAL = activeLength;
        activeLength--;
        activeEdge++;

        snap(i, lastj, 'rootadjust',
          `Active point adjustment at root: Since active node is root, we remove the leading character from the remainder. ` +
          `Remainder updated: ${remStr(i, prevAL)} → ${remStr(i, activeLength)}. ` +
          `This shifts from suffix "${txt.slice(lastj - 1, i + 1)}" to suffix "${txt.slice(lastj, i + 1)}" for the next extension.`
        );
      } else if (activeNode !== root.id) {
        const prevAN = activeNode;
        activeNode = nodes[activeNode].suffixLink!;

        snap(i, lastj, 'suffixlink',
          `Follow suffix link: Active node moves from ${nodeLabel(prevAN)} to ${nodeLabel(activeNode)}. ` +
          `Remainder stays ${remStr(i, activeLength)}. ` +
          `This positions us to process the next shorter suffix "${txt.slice(lastj, i + 1)}".`
        );
      }
    }

    // If the last internal node created in this phase never had its suffix link
    // resolved by a subsequent extension, it correctly points to root.
    if (lastNewNode !== null && nodes[lastNewNode].suffixLink === null) {
      nodes[lastNewNode].suffixLink = root.id;
    }
  }

  return steps;
}
