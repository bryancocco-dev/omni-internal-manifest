// TOMBSTONE — BATCH MATRIX (PLAN.md "## BATCH MATRIX — 25 at a time,
// results grow up, shelf dies"): "the bottom deliverables panel is still
// firing open, that thing should be killed entirely because the outputs
// panel on the canvas does that job now" (Bryan). This component renders
// null unconditionally now, for every flow/template, with no exceptions —
// the RESULTS ON THE BOARD phase's own `hasResultsNode` gate (this file's
// prior version, still visible in git history / PLAN.md's own "## RESULTS
// ON THE BOARD" section above) is retired along with it: that gate only
// ever hid the shelf WHILE a results frame existed; this phase's own
// "FRAME DEFAULT-ON" contract makes a results frame spawn on every
// completed run with ≥1 delivered output, so the two conditions have
// converged — there is no longer a reachable moment where this shelf would
// have shown anyway.
//
// Successor: src/nodes/ResultsNode.jsx — the canvas-native results frame is
// now the ONE surface for the delivered-outputs record (uniform artifact
// rows for plain deliverables, matrix sections for batch outputs), plus its
// own header's Download-all/Clear. Nothing else in this app still imports
// from this file's own exports (it never had any — this was always a
// default-export, self-mounting drawer) or reads `shelfOpen`/`deliverables`
// expecting THIS component to be listening; state.jsx may still carry
// `shelfOpen` state and the `deliverables` selector for other readers (this
// seam's own file grant doesn't extend to state.jsx — see PLAN.md's own
// note: "shelfOpen state may stay if other code reads it — check, don't
// assume").
//
// Left as a real component (not deleted outright) — FlowCanvas.jsx still
// mounts `<DeliverablesShelf />` and that file is out of this seam's grant
// (the NODE SHEET executor may be live in it this same phase); an
// unconditional `return null` here is a harmless, zero-cost mount for
// whoever else is touching that file concurrently, exactly per PLAN.md's
// own instruction: "Do NOT edit FlowCanvas.jsx's mount... the dead mount is
// harmless."
export default function DeliverablesShelf() {
  return null
}
