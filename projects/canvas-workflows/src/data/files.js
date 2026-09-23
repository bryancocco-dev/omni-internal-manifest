// FILES TAB, redefined (Bryan: "i think files was supposed to be for files
// added to the canvas not recent projects") — the 13-row seeded
// "Recent projects" fixture this file used to open with is GONE: the tab's
// primary content is now the canvas-files store (data/canvasFiles.js,
// everything attached via the composer's + menu), and this file keeps only
// what was always real — the runtime store for workflows the user saves
// through the Save panel this session, which the tab lists in its own
// quiet section below the canvas files.

import { useSyncExternalStore } from 'react'

// SAVE PANEL (PLAN.md "## SAVE PANEL — saving a workflow is a moment, not a
// rename") — "extend files.js's list with runtime-added entries." Same
// singleton external-store shape Palette.jsx already established for its own
// session-local bookmark sets (that file's own header comment on
// `bookmarkedBlocks`/`bookmarkedTemplates`): a plain module-scope array plus
// a subscribe/notify pair, read through `useSyncExternalStore` so the Files
// tab re-renders the instant a save lands with no context plumbing added to
// state.jsx. Module-scope, not localStorage — a refresh empties this array
// like every other session store in the app ("refresh resets, per the
// standing doctrine — no persistence").
let runtimeFiles = []
let runtimeSeq = 0
const listeners = new Set()

function emit() {
  listeners.forEach((fn) => fn())
}

function subscribe(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

// SAVED FILES REOPEN (PLAN.md "## SAVED FILES REOPEN — a saved workflow
// opens as itself") — follow-up to SAVE PANEL's own flagged gap: "a
// runtime-saved Files row has no templateId, so clicking it no-ops. A
// history entry you cannot reopen isn't a history entry." addRuntimeFile now
// also captures a SNAPSHOT — "keep data verbatim EXCEPT live runState fields
// reset to idle and chat/leaning transients cleared, so a reopened file is
// the PROGRAM, not a mid-run freeze; delivered output/versions MAY stay —
// that's the file's own record." `data.runState` covers every executed node
// type (task/human/checkin/generate/logic/signal/params/output all pass
// through it — run/engine.js's own patchNode calls); `data.steps.nodes[].
// runState` is the SAME field one level down, on a SUBGRAPH's own inner
// step list (run/engine.js's own comment: "`data.steps.nodes[i].runState`
// on the OWNING TASK") — reset there too, same reasoning, so an expanded
// subgraph doesn't come back mid-step either.
const CHAT_TRANSIENT_KEYS = ['chatLog', 'chatOptions', 'chatLeaning']

function programSnapshot(nodes, edges) {
  // "a deep-cloned {nodes, edges} of the canvas at save time" (PLAN.md,
  // literal) — structuredClone first so every later normalization mutates an
  // isolated copy, never the live canvas's own node/edge objects still
  // referenced elsewhere (context state, the undo stack, ...).
  const snap = structuredClone({ nodes, edges })
  snap.nodes.forEach((n) => {
    const data = n.data || {}
    if ('runState' in data) data.runState = 'idle'
    for (const key of CHAT_TRANSIENT_KEYS) delete data[key]
    if (data.steps && Array.isArray(data.steps.nodes)) {
      data.steps.nodes.forEach((s) => {
        if (s.runState) s.runState = 'idle'
      })
    }
  })
  return snap
}

// Called once by App.jsx's SAVE PANEL on Save. New entry always lands at
// the front — "a NEW entry appears at the TOP of the palette's Files tab
// list" — ahead of every seed row AND every earlier runtime save (each
// unshift pushes the last save down one). `templateId` is intentionally
// absent: a runtime save isn't a catalog template — Palette.jsx's FileRow
// instead routes a row carrying `snapshot` (below) through state.jsx's
// insertSnapshot, the SAVED FILES REOPEN counterpart to insertTemplate.
// `nodes`/`edges` are optional — omitting them (App.jsx's pre-SAVED-FILES-
// REOPEN call shape) still adds a row with no snapshot, same safe-no-op
// click posture the old comment here described, so nothing upstream breaks
// if this is ever called without the live graph.
export function addRuntimeFile({ name, description, meta, nodes, edges }) {
  runtimeSeq += 1
  const snapshot = nodes && edges ? programSnapshot(nodes, edges) : undefined
  runtimeFiles = [{ id: `runtime-file-${runtimeSeq}`, name, description, meta, snapshot }, ...runtimeFiles]
  emit()
}

function getRuntimeSnapshot() {
  return runtimeFiles
}

// The one read Palette.jsx uses — session saves only now (most-recent
// first); the seeded catalog it used to append is retired (header comment).
export function useSavedFiles() {
  return useSyncExternalStore(subscribe, getRuntimeSnapshot)
}
