// Seam D — Edges/layout/flow-theme
//
// Cross-seam contract: B imports `{ edgeTypes }` from here. Keep this file
// to just the map — OmniEdge.jsx owns the actual rendering.
//
// MOTION PHASE (M1): edges-motion.css is new this phase (flow.css is
// frozen) — imported here, same pattern as nodes/index.js importing
// nodes.css, so it evaluates after flow.css/app.css in the module graph.

import './edges-motion.css'

import OmniEdge from './OmniEdge.jsx'

export const edgeTypes = {
  omni: OmniEdge,
}
