@AGENTS.md

# FIT3155 Algorithm Visualizer

Next.js 16 app with React 19, TypeScript 5, and Tailwind CSS 4. Visualizes six algorithms: Z Algorithm, Boyer-Moore, Burrows-Wheeler Transform, Ukkonen's suffix tree, Hungarian Algorithm, and Simplex Method.

## Commands

- `npm run dev` — start dev server (http://localhost:3000)
- `npm run build` — production build
- `npm run lint` — ESLint
- `npm run verify` — run Ukkonen correctness tests (suffix array + suffix link invariants)

## Architecture

Each algorithm follows the same pattern:
1. **Algorithm engine** (`src/lib/<algorithm>.ts`) — instrumented to capture step-by-step snapshots
2. **Types** (`src/lib/<algorithm>-types.ts`) — TypeScript types for steps and state
3. **API route** (`src/app/api/<algorithm>/route.ts`) — POST endpoint that runs the engine and returns step snapshots
4. **Page** (`src/app/<algorithm>/page.tsx`) — client component with step navigation, autoplay, and input controls
5. **Visualization components** (`src/components/<algorithm>/`) — rendering, variable panel, and step controls

Shared components: `AlgorithmNav` (algorithm switcher), `ThemeProvider` (dark/light), `ScreenGate` (minimum viewport).

The Simplex page also has `SimplexCalculations.tsx` (z-row derivation, row operations, objective value) and `ProblemInputModal.tsx` (custom LP input). The Hungarian page has `FlowNetwork.tsx` (bipartite graph SVG) and `MatrixInputModal.tsx` (custom cost matrix input).

## Conventions

- All algorithm computation happens server-side in API routes; the client replays snapshots
- Each algorithm page manages its own state (steps, stepIndex, playing, speed)
- Step snapshots capture the complete algorithm state at every step for deterministic replay
- SVG-based tree visualization (Ukkonen only) with pan/zoom via `TreeVisualization.tsx`
- Layout computation for the suffix tree lives in `src/lib/layout.ts`
- Simplex visualization includes c_j/c_B coefficient annotations in the tableau and educational calculation panels (row operations, z-row derivation, objective value dot product)
- Hungarian visualization includes a cost matrix with step highlights and a bipartite flow network graph
- Uses CSS variable overrides for light/dark mode — do NOT use `dark:` Tailwind prefixes
