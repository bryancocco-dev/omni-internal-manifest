// Seam B — App core
//
// Entry point mounted by index.html's `<script type="module" src="/src/main.jsx">`
// (agent A) into `<div id="workflow-root">` inside the `.workflow-overlay`
// host (also agent A). CSS import order matches the cross-seam contract:
// React Flow base styles → B's theme-token roster → D's flow theme → B's
// app chrome. cw-tokens.css must load before flow.css/app.css/nodes.css so
// every `--cw-*` var they consume is already defined (THEMES PHASE).
//
// MOTION PHASE (M3 item 8): motion.css imports LAST among these four, so any
// equal-specificity tie against flow.css's own rules (its global handle
// animations extend) resolves in motion.css's favor. nodes.css/edges-
// motion.css load after all of these regardless, pulled in transitively via
// the App.jsx import below — that's fine, their selector families don't
// overlap motion.css's by design (see motion.css's own header comment), and
// `var()` custom-property lookups resolve against the final cascade rather
// than import order, so which file *defines* `--cw-e-*`/`--cw-d-*` relative
// to who *reads* them was never load-order-sensitive to begin with.

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ReactFlowProvider } from '@xyflow/react'

import '@xyflow/react/dist/style.css'
import './styles/cw-tokens.css'
import './styles/flow.css'
import './styles/app.css'
import './styles/search.css'
import './comments/comments.css'
import './styles/motion.css'
import './styles/darkroom.css'
// SUBGRAPHS — imported LAST (PLAN.md file grant: "+ main.jsx import at
// end"), after every other stylesheet in this chain, so its own selectors
// (all #workflow-root-scoped, matching every file above) never lose a tie
// against an earlier rule of equal specificity.
import './styles/subgraph.css'

import { FlowStateProvider } from './state.jsx'
import App from './App.jsx'
// BATCH MATRIX (PLAN.md "## BATCH MATRIX") — imported AFTER App.jsx on
// purpose: App's own import chain is what pulls in nodes/index.js's
// './nodes.css' (see this file's own header comment — "nodes.css/edges-
// motion.css load after all of these regardless, pulled in transitively via
// the App.jsx import below"), so placing this import textually after that
// one guarantees results-matrix.css's own module evaluation — and with it
// every CSS rule inside — is scheduled AFTER nodes.css in the bundled
// output. That's what lets its one deliberate out-specification
// (`.cw-node--results-matrix`, same specificity as nodes.css's own
// `.cw-node--results`) win the cascade tie without editing that file's own
// bytes — see results-matrix.css's own header comment for the full reasoning.
import './styles/results-matrix.css'

const container = document.getElementById('workflow-root')

if (container) {
  // Idempotent root: Vite HMR re-executes this entry module on full-chain
  // updates, and a second createRoot() on the same container STACKS a whole
  // second app (own provider state — the window-event listeners then all
  // double-fire and the canvas renders N overlapping stages). Stash the root
  // on the container so re-executions re-render the one app instead.
  const root = container.__cwRoot ?? (container.__cwRoot = createRoot(container))
  root.render(
    <StrictMode>
      <ReactFlowProvider>
        <FlowStateProvider>
          <App />
        </FlowStateProvider>
      </ReactFlowProvider>
    </StrictMode>,
  )
}
