# FIT3155 Algorithm Visualizer

Interactive web-based visualizer for algorithms covered in FIT3155. Built for students — step through each algorithm, watch the state evolve, and see how key variables change in real time.

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8)

## Algorithms

### Z Algorithm
Linear-time pattern matching using the Z-array. Step through the construction of the Z-array for a concatenated `pattern$text` string and see pattern occurrences highlighted in the text.

### Boyer-Moore
String search with bad character and good suffix heuristics. Watch the pattern slide across the text, see which heuristic fires at each mismatch, and how the shift is computed.

### Burrows-Wheeler Transform
BWT construction, inverse BWT, and pattern search using the last-to-first mapping. Step through the rotation matrix, see the BWT string built, and watch backward search narrow the match range character by character.

### Ukkonen's Suffix Tree
Online suffix tree construction. Walk through every phase and extension, see the tree grow as an SVG with suffix links, and watch the active point, rules, and internal node creation in real time. Includes DFS traversal and suffix array extraction from the completed tree.

### Hungarian Algorithm
Optimal assignment for cost matrices. Visualizes row/column reduction, line covering, and augmenting path adjustments step by step, with a bipartite flow network graph showing the current matching.

### Simplex Method (Linear Programming)
Tableau-based LP solver. Watch the simplex algorithm pivot through basic feasible solutions, with educational annotations showing c_j/c_B coefficients, row operations, z-row derivations (dot product breakdowns), and objective value computation at each iteration. Supports custom objective functions and constraints.

## Features

- **Step-by-step execution** with forward/backward navigation and phase jumping
- **SVG tree visualization** (Ukkonen) with pan, zoom, and auto-fit
- **Variable state panel** with live updates and change highlighting
- **Rule/heuristic annotations** with color-coded badges
- **Plain-English explanations** describing what happened at each step and why
- **Autoplay** with adjustable speed (slow / normal / fast)
- **Dark / light theme** persisted in localStorage
- **Custom input** — enter your own pattern and text strings
- **Keyboard shortcuts**:
  - `Arrow Left` / `h` — previous step
  - `Arrow Right` / `l` — next step
  - `Arrow Up` / `k` — previous phase
  - `Arrow Down` / `j` — next phase
  - `Space` — play / pause

## Getting Started

```bash
cd visualizer
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
visualizer/
├── src/
│   ├── app/
│   │   ├── page.tsx                  # Landing page — algorithm picker
│   │   ├── layout.tsx                # Root layout with theme and nav
│   │   ├── z-algorithm/page.tsx      # Z Algorithm visualizer
│   │   ├── boyer-moore/page.tsx      # Boyer-Moore visualizer
│   │   ├── bwt/page.tsx              # Burrows-Wheeler visualizer
│   │   ├── ukkonen/page.tsx          # Ukkonen's suffix tree visualizer
│   │   ├── hungarian/page.tsx        # Hungarian Algorithm visualizer
│   │   ├── simplex/page.tsx          # Simplex Method visualizer
│   │   └── api/
│   │       ├── z-algorithm/route.ts  # Z Algorithm step computation
│   │       ├── boyer-moore/route.ts  # Boyer-Moore step computation
│   │       ├── bwt/route.ts          # BWT step computation
│   │       ├── build-steps/route.ts  # Ukkonen step computation
│   │       ├── hungarian/route.ts    # Hungarian step computation
│   │       └── simplex/route.ts      # Simplex step computation
│   ├── components/
│   │   ├── AlgorithmNav.tsx           # Algorithm switcher dropdown
│   │   ├── ScreenGate.tsx             # Minimum screen size gate
│   │   ├── ThemeProvider.tsx          # Dark/light theme context
│   │   ├── TreeVisualization.tsx      # SVG suffix tree with pan/zoom
│   │   ├── VariablePanel.tsx          # Ukkonen variable state display
│   │   ├── StepControls.tsx           # Ukkonen step navigation
│   │   ├── StringDisplay.tsx          # String with phase/suffix highlighting
│   │   ├── z-algorithm/              # Z Algorithm components
│   │   ├── boyer-moore/              # Boyer-Moore components
│   │   ├── bwt/                      # BWT components
│   │   ├── hungarian/                # Hungarian Algorithm components
│   │   └── simplex/                  # Simplex Method components
│   └── lib/
│       ├── ukkonen.ts                # Ukkonen algorithm + step snapshots
│       ├── z-algorithm.ts            # Z Algorithm + step snapshots
│       ├── boyer-moore.ts            # Boyer-Moore + step snapshots
│       ├── bwt.ts                    # BWT + step snapshots
│       ├── hungarian.ts              # Hungarian algorithm + step snapshots
│       ├── simplex.ts                # Simplex method + step snapshots
│       ├── layout.ts                 # Tree layout computation
│       ├── types.ts                  # Ukkonen types
│       ├── z-algorithm-types.ts      # Z Algorithm types
│       ├── boyer-moore-types.ts      # Boyer-Moore types
│       ├── bwt-types.ts              # BWT types
│       ├── hungarian-types.ts        # Hungarian types
│       └── simplex-types.ts          # Simplex types
├── scripts/
│   └── verify.ts                     # Ukkonen correctness tests
└── package.json
```

## How It Works

Each algorithm is implemented in TypeScript under `src/lib/` and instrumented to capture a snapshot of the full state at every step. Each snapshot records the data structures, variables, which rule or heuristic was applied, and what changed. The visualizer replays these snapshots, rendering the state and providing plain-English explanations of each step.

API routes under `src/app/api/` accept input via POST, run the instrumented algorithm, and return the array of step snapshots to the client.

## Verification

The Ukkonen implementation includes a verification harness:

```bash
npm run verify
```

This checks step-by-step correctness against a reference example, validates suffix arrays against brute-force, and verifies suffix link invariants.
