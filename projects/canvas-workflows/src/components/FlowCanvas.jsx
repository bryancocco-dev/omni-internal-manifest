// Seam B — App core
//
// The React Flow wrapper: canvas chrome (Background/Controls/MiniMap) plus
// palette drag-and-drop (per the RF "Drag and Drop" example — palette rows
// set an `application/reactflow` payload, drop resolves it via
// `screenToFlowPosition`) and the red issues pill from shot-1. Visual theming
// of the RF chrome + edges lives in D's styles/flow.css; node visuals in C's
// nodes.css — this file only renders the tree and wires behavior.
//
// MOTION PHASE (M3 — see PLAN.md "## MOTION PHASE" -> "### M3"). What's new
// here, item by item:
//   3. landing ripples — spawned on palette drop, on a `cw:ripple` window
//      event (state.jsx dispatches it for the cw:add-from case), and on
//      onNodeDragStop; rendered through <ViewportPortal> so they live in
//      flow-space and pan/zoom with the graph (see motion.css for the visual);
//   4. (pointer spotlight — removed 2026-08-12 at Bryan's ask);
//   5. the inner "stage" wrapping <ReactFlow> is keyed on state.jsx's
//      `swapKey`, so Load-from-instructions/Clear force a full remount —
//      every node/edge freshly mounts and its entrance animation replays,
//      which a same-id reconcile (the samples reuse stable ids) wouldn't do;
//   6. the issues pill now animates in/out (PLAN.md item 6) instead of
//      popping — a short local presence state machine holds it mounted
//      through its exit animation, and its count "pops" via a `key` remount
//      of just the count text whenever the number changes while visible.
//
// UI ELEVATION PHASE (E3 — "Canvas layer", see PLAN.md "## UI ELEVATION
// PHASE" -> "### E3"). What's new here, item by item:
//   1. a second, coarser <Background> (gap 110/size 2) layered over the
//      existing fine grid — flow.css scopes its pattern color via a
//      dedicated className so the fine grid is untouched;
//   2. `nodeBorderRadius` on <MiniMap> — the one part of item 2 that's a
//      React prop rather than a CSS var (the node-rect fill color lives in
//      flow.css);
//   4. a trigger-only empty-state ghost card, rendered through the same
//      <ViewportPortal> as the landing ripples — active only while the
//      graph is exactly one (trigger) node and no edges, and it fades out
//      (not an abrupt unmount) on the first added node/edge via the same
//      mount/closing local state machine the issues pill already uses.
// Item 3 (handle sizing) is flow.css-only and doesn't touch this file.
// Frozen, unchanged: defaultViewport's zoom-1 boot (no fitView prop below),
// the measurement heal pass, and ZoomReadout.
//
// CANVAS TABS PHASE (see PLAN.md "## CANVAS TABS PHASE", React seam item 4)
// / INSTRUCTIONS CARD REDESIGN (see PLAN.md "## INSTRUCTIONS CARD REDESIGN"):
// <InstructionsCard> (./InstructionsCard.jsx, its own file since the
// redesign) renders canvas_2's closeable "how this works" card whenever the
// graph is fully empty (`nodes.length === 0` — state.jsx's `omni:canvas-tab`
// listener loads samples.empty() for that tab). It's a plain sibling of
// .cw-flow-stage below, deliberately NOT a <ViewportPortal>
// child like the empty-state ghost hint above — this card must stay fixed
// over the canvas, never pan/zoom with the graph. It's keyed on `swapKey` by
// this call site so a tab switch (which bumps swapKey) always remounts it
// fresh, resetting any user dismissal — "reappears naturally on remount" per
// the plan. The component owns its own presence machine (materialize-in/
// fade-out, mirroring the issues pill's below) internally.
//
// RUN PHASE (R4 — "RF functionality pack + run controls", see PLAN.md
// "## RUN PHASE" -> "### R4"). What's new here, item by item:
//   2. `onReconnect` (from R1's context contract) is wired straight onto
//      <ReactFlow> — dragging an edge's end re-plugs it. `edgesReconnectable`
//      is left at React Flow's own default (true, verified against the
//      installed package) rather than set here — the library only turns on
//      an edge's reconnect anchors once `onReconnect` itself is defined, so
//      nothing else was "needed" per PLAN.md's "edges/index as needed" hedge;
//   3. cmd/ctrl+Z undo, shift+cmd/ctrl+Z redo — a keydown listener scoped to
//      this component's own mounted lifetime (i.e. while the overlay is
//      open, per the mount-on-open contract above), skipped while the event
//      target is a text field so it never hijacks a native input's own undo;
//   4. a snap-to-grid ControlButton (GridFour) under the zoom readout,
//      default OFF — inline `order:-1` (matching ZoomReadout's own flow.css
//      rule) rather than a flow.css edit, since flow.css is outside this
//      seam's file grant for this phase;
//   6. delete-middle-node heal — React Flow's own "Delete Middle Node"
//      example, adapted to preserve named handles (branch/option outputs)
//      instead of the stock example's plain node-to-node bridge. Skipped for
//      human nodes with multiple-choice options (ambiguous which option
//      would map to which surviving outgoer) per PLAN.md.
// Item 1 (header Run/Stop cluster) lives in App.jsx; item 5 (run-edge surge)
// lives in edges/** — neither touches this file.
//
// NODE BOOM PHASE (see PLAN.md "## NODE BOOM PHASE" — "blow up a node when
// you trash it"). Ghost effect only, per that section's own "Mechanism": the
// real delete is untouched (React Flow's own deleteElements has already
// removed the node from the store by the time onNodesDelete's callback body
// runs below — same reason the delete-middle-node heal above only ever ADDS
// bridge edges), this just spawns a short-lived overlay burst at the node's
// LAST position. Same local-array + <ViewportPortal> technique as the
// landing ripples above — the node itself is never held in state to animate
// it. Hooks onto that SAME onNodesDelete prop (one prop, both entry points:
// toolbar trash and keyboard Backspace/Delete both route through
// deleteElements; undo/redo/Clear call setRawNodes directly in state.jsx, so
// they never reach here and never boom — verified by inspection, matches
// "NO boom on the undo"). Multi-delete is capped at 6 and staggered 40ms
// apart; geometry comes from builder.js's `nodeBox` (measured size with the
// same EST fallbacks state.jsx itself relies on) rather than this file's own
// `cardSize` table above, which only covers the simpler palette-drop case.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  ControlButton,
  MiniMap,
  ViewportPortal,
  getConnectedEdges,
  useUpdateNodeInternals,
  useReactFlow,
  useStore,
} from '@xyflow/react'
import {
  ArrowUUpLeft,
  ArrowUUpRight,
  CornersIn,
  CaretDown,
  CaretUp,
  ChatTeardropDots,
  CornersOut,
  LinkBreak,
  MagicWand,
  MagnifyingGlass,
  MapTrifold,
  Minus,
  Plus,
  Scissors,
  Selection,
} from '@phosphor-icons/react'

import { nodeTypes } from '../nodes/index.js'
import { edgeTypes } from '../edges/index.js'
// WIRE FEEL (PLAN.md "## WIRE FEEL") — AUTHORIZED additive import, part of
// "(a) the connectionLineComponent prop line" below; ConnectionLine.jsx is
// edges/** (D's own seam), not a new cross-seam dependency.
import ConnectionLine from '../edges/ConnectionLine.jsx'
import { useFlowState, resolveNodeBox } from '../state.jsx'
import { nodeDisplayTitle, paletteItemById } from '../data/blocks.js'
import { nodeBox } from '../data/templates/builder.js'
// WAVE 4 — THE VERB EXPANSION. Run Workflow's own searchHaystack field
// (below) needs the real template NAME behind a card's stored templateId
// slug — same data-layer import precedent this file's own `nodeBox` line
// just above already establishes for data/templates/*.
import { TEMPLATES } from '../data/templates/index.js'
// NODE TOOLBAR V2 — toggleNodeCollapse is the shared entry point the
// toolbar button itself uses (shared.jsx); double-clicking a card's head is
// its "other entry point" (PLAN.md item 3), wired below via onNodeDoubleClick.
// TINT_SWATCHES is the one source of truth for which `data.tint` values are
// real (shared.jsx's swatch row is the only writer) — read here so
// displayNodes never manufactures a `cw-tint-<garbage>` className off a
// value nothing actually offers.
// CONTEXT & CLIPBOARD — NodeCommandMenu is "the full command menu... same
// component as the right-click menu" (PLAN.md amendment); this file mounts
// it a second way (its `anchor` prop) for the new node/multi-select
// right-click surfaces, alongside shared.jsx's own toolbar-anchored mount.
// SKIP_HIDDEN_TYPES/isSkipDisabled are the SAME rules that gate the S
// hotkey's row visibility inside that menu — imported rather than
// re-declared so the hotkey and the menu row can never silently disagree
// about which node types Skip applies to. (WAVE 2 — THE VERB EXPANSION:
// isSkipDisabled replaces the old flat SKIP_DISABLED_TYPES Set import — it
// needs `data` too now, since 'signal' splits skip-eligibility by
// data.kind rather than by type alone; see shared.jsx's own header comment
// on that function.)
import { toggleNodeCollapse, TINT_SWATCHES, NodeCommandMenu, SKIP_HIDDEN_TYPES, isSkipDisabled } from '../nodes/shared.jsx'
import InstructionsCard from './InstructionsCard.jsx'
import ViewportGlide from './ViewportGlide.jsx'
import CommentsLayer from '../comments/CommentsLayer.jsx'
import BlockPicker from './BlockPicker.jsx'
// SUBGRAPHS — full spec (PLAN.md "## SUBGRAPHS"). This file owns the stage
// MOUNT POINT + the chrome hide/show + the Esc precedence extension; the
// theater itself (the FLIP transition, the internal mini-flow, its own
// CRUD) lives entirely inside SubgraphStage.jsx — see that file's own
// header comment for why "chrome hides" needs no App.jsx/Palette.jsx/
// CompiledPanel.jsx edits at all (the stage is simply opaque and covers
// them, full stop).
import SubgraphStage from '../subgraph/SubgraphStage.jsx'
// DELIVERABLES A+C — "C (new): the gallery shelf... mounted from FlowCanvas
// (portal to #workflow-root like the old dock)" (PLAN.md). Mounted
// unconditionally below, same convention as InstructionsCard just above —
// the component owns its own presence machine (open/closed, entrance/exit)
// internally; see that file's own header comment.
import DeliverablesShelf from './DeliverablesShelf.jsx'

// Zoom stepping (Bryan: the rail showed "99%"). React Flow's own zoomIn/Out
// multiply the scale by 1.2, which lands on values like 0.99 / 1.19 — the
// readout can only ever round those to odd numbers. These step to the next
// multiple of 10% in the direction of travel instead, so every zoom action
// (buttons OR the +/- keys) leaves the readout on a clean figure.
const ZOOM_MIN = 0.25
const ZOOM_MAX = 2

export function nextZoomStep(current, dir) {
  const pct = Math.round(current * 100)
  const stepped = dir > 0 ? (Math.floor(pct / 10) + 1) * 10 : (Math.ceil(pct / 10) - 1) * 10
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, stepped / 100))
}

// Rail tooltip. A real element rather than the `content: attr(data-tooltip)`
// pseudo it started as, because a pseudo-element can only carry a single run
// of text — and these now have to print a keycap next to the label (Bryan:
// "show hot keys for all of these"). aria-hidden: each button keeps its own
// aria-label, so this is decoration, not the accessible name.
function RailTip({ label, hotkey }) {
  return (
    <span className="cw-rail-tip-pop" aria-hidden="true">
      <span className="cw-rail-tip-label">{label}</span>
      {hotkey ? <kbd className="cw-rail-kbd">{hotkey}</kbd> : null}
    </span>
  )
}

// Zoom readout — lives inside <Controls> as an extra ControlButton and jumps
// to the top of the pill via CSS `order:-1` (flow.css). Subscribes to just
// the zoom component of the viewport transform so pans don't re-render it.
// Click snaps back to 100%.
function ZoomReadout() {
  const zoom = useStore((s) => s.transform[2])
  const { zoomTo } = useReactFlow()
  return (
    <ControlButton
      className="cw-zoom-readout cw-rail-tip"
      onClick={() => zoomTo(1, { duration: 250 })}
      aria-label="Zoom level — click to reset to 100%"
    >
      <RailTip label="Reset zoom to 100%" hotkey="⇧0" />
      {Math.round(zoom * 100)}%
    </ControlButton>
  )
}

// Ripple ids only need to be unique within one mounted session of this
// component — a plain module-level counter is cheaper than Date.now()/
// Math.random() for something spawned on discrete user actions, not a loop.
let rippleSeq = 0
function nextRippleId() {
  rippleSeq += 1
  return `ripple-${rippleSeq}`
}

// RUN PHASE (R4 item 4) — a stable array reference for <ReactFlow snapGrid>.
// Module-level (not created fresh per render) since React Flow re-derives
// internal state whenever this prop's identity changes, not just its
// contents.
const SNAP_GRID = [14, 14]

// Card footprints per node type (nodes.css widths, builder.js height
// estimates) — used to size the drop shockwave to the card it just created,
// before React Flow has measured the real element.
const CARD_SIZE = {
  trigger: { w: 260, h: 220 },
  task: { w: 340, h: 560 },
  human: { w: 250, h: 300 },
  output: { w: 270, h: 260 },
  logic: { w: 230, h: 150 },
  wait: { w: 230, h: 170 },
  stop: { w: 230, h: 140 },
  // COMFY ROUND (CP2, item 1) — NoteNode.jsx's fixed v1 width + a plausible
  // rest height (short title + a couple of body lines) for boom/ripple
  // sizing before React Flow has measured the real, auto-height card.
  note: { w: 300, h: 150 },
  // COMFY ROUND (CP2, item 5) — ParamsNode.jsx's card footprint.
  params: { w: 260, h: 280 },
  // WAVE 4 — THE VERB EXPANSION. Own-type card footprints, matching each
  // one's nodes.css width rule + a plausible rest height (CDP-checked
  // against the built cards). Guardrail needs no entry — it's a `logic`
  // kind, already covered by the plain `logic` bucket above via
  // builder.js's own per-kind estimateHeight (nodeBox, not this table).
  handoff: { w: 260, h: 340 },
  localize: { w: 260, h: 220 },
  optimize: { w: 230, h: 210 },
  runworkflow: { w: 270, h: 210 },
}
function cardSize(type) {
  return CARD_SIZE[type] || { w: 280, h: 220 }
}

// NODE BOOM PHASE — boom ids only need to be unique within one mounted
// session, same reasoning as rippleSeq/nextRippleId above.
let boomSeq = 0
function nextBoomId() {
  boomSeq += 1
  return `boom-${boomSeq}`
}

// Multi-delete stagger/cap (PLAN.md "Multi-delete"): 40ms between each
// boom's start, no more than 6 get one — past that the rest just take RF's
// own plain removal, no boom, nothing logged (it's motion, not data).
const BOOM_STAGGER_MS = 40
const BOOM_MAX = 6

// Shard trajectories — computed ONCE at module load, never per-boom or
// per-render (PLAN.md: "fixed per-index angles (30° steps + a deterministic
// index-based jitter — NO Math.random at render time)"). Every boom's burst
// reuses this exact set of 12 vectors, just re-centred on wherever the
// deleted card was. dx/dy are each shard's final resting offset in px — a
// full circle in 30° steps with a small ±6° wobble so the ring doesn't read
// as a mechanical spoke pattern; rot is its spin; delay staggers the crackle
// WITHIN one burst (separate from BOOM_STAGGER_MS, which staggers whole
// booms against each other in a multi-delete); size and tint cycle through
// the three fill colors PLAN.md calls for.
const BOOM_SHARD_COUNT = 12
const BOOM_TINTS = ['cw-boom-tint-a', 'cw-boom-tint-b', 'cw-boom-tint-c']
const BOOM_SHARDS = Array.from({ length: BOOM_SHARD_COUNT }, (_, i) => {
  const jitterDeg = ((i * 47) % 13) - 6 // deterministic -6..+6 wobble
  const angleRad = ((i * 30 + jitterDeg) * Math.PI) / 180
  const dist = 60 + ((i * 19) % 51) // deterministic 60-110px
  const spin = 90 + ((i * 31) % 171) // deterministic 90-260deg
  return {
    dx: Math.round(Math.cos(angleRad) * dist),
    dy: Math.round(Math.sin(angleRad) * dist),
    rot: i % 2 === 0 ? spin : -spin,
    delay: (i * 11) % 61, // deterministic 0-60ms
    size: 6 + (i % 5), // deterministic 6-10px
    tint: BOOM_TINTS[i % BOOM_TINTS.length],
  }
})

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

// RUN SHOW A3 — minimap heartbeat. <MiniMap nodeColor> (RF v12) calls this
// PER NODE on every minimap re-render — hot during a run, since node.data
// patches stream in constantly. PLAN.md warns that resolving a color via
// getComputedStyle in here is "too hot" and asks for a per-theme cache.
// Verified against the installed @xyflow/react source instead of assumed
// (node_modules/@xyflow/react/dist/esm/index.js, MiniMapNodeComponent):
// this return value lands on the minimap rect's own INLINE `style.fill`,
// not a raw SVG attribute — so a bare CSS custom-property string resolves
// through the normal cascade at PAINT time, live, per-theme, with nothing
// to compute or invalidate here at all. That sidesteps the "hot" cost
// outright (zero style reads) rather than amortizing it with a cache, which
// is why there's no getComputedStyle/cache machinery below.
// `undefined` for the default bucket makes the library's own
// `fill = color || background || backgroundColor` fall through to nothing,
// so React omits the inline style and the EXISTING base rule
// (`.react-flow__minimap-node { fill: var(--xy-minimap-node-background-
// color...) }`, themed by flow.css) applies untouched — "idle -> current
// default" by deferring to it rather than duplicating its formula.
const MINIMAP_DONE_TINT = 'color-mix(in srgb, var(--cw-accent) 45%, transparent)'
// NODE TOOLBAR V2 — validates a `data.tint` value against shared.jsx's own
// TINT_SWATCHES roster (the swatch row is the only writer of this field) so
// a bad/legacy value can never resolve to a nonexistent `--cw-tint-<x>` var.
const TINT_ID_SET = new Set(TINT_SWATCHES.map((t) => t.id))
function minimapNodeColor(node) {
  const state = node?.data?.runState
  if (state === 'running') return 'var(--cw-accent)'
  if (state === 'paused') return 'var(--cw-warn-text)'
  if (state === 'done') return MINIMAP_DONE_TINT
  // "the minimap rect takes the tint as its idle fill (run-state colors
  // still win during runs)" — PLAN.md item 2. Only reached once none of the
  // three run-state buckets above matched, i.e. genuinely idle.
  if (node?.data?.tint && TINT_ID_SET.has(node.data.tint)) return `var(--cw-tint-${node.data.tint})`
  return undefined
}

// issueKindColor + its ISSUE_NODE_KIND_COLOR map were retired 2026-08-14 —
// the popover mark was their only consumer (Bryan removed it; the subject
// text carries --cw-danger now).

// ISSUES POPOVER V2 item 1 — a drawn cross instead of a text "×" glyph: the
// multiplication-sign character sits low in the em-box at small sizes and
// can't be reliably centred inside a flex box (Bryan: "the x is optically
// misaligned in its circle"); an 8x8 stroke path centres exactly. Plain SVG,
// not a Phosphor import — PLAN.md asks for this specific mark, not a library
// glyph. Reused as-is by the comments composer's own close button
// (src/comments/CommentsLayer.jsx), which had the identical droop.
function CrossIcon() {
  return (
    <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden="true">
      <path d="M1 1L7 7M7 1L1 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

// CONTEXT & CLIPBOARD (item 4) — "on an EDGE -> small menu: Insert block
// (opens picker in splice mode), Cut wire". Deliberately its OWN small
// component rather than another NodeCommandMenu mode: the amended spec only
// says the NODE right-click reuses "the same component" as the ⋯ overflow —
// the edge menu is described as its own "small menu", different content,
// never type-aware over a node. Same portal/clamp/dismiss shape as
// NodeCommandMenu's own floating mode (shared.jsx) — small, deliberate
// duplication of that pattern rather than a forced shared abstraction across
// two components with otherwise nothing in common (this file's own
// established convention — see pickerKeyOf/computePosition-style helpers
// elsewhere in this app for the same call).
const EDGE_MENU_W = 200
const EDGE_MENU_H_EST = 96
function clampEdgeMenuPosition(x, y) {
  const root = typeof document !== 'undefined' ? document.getElementById('workflow-root') : null
  const headerBottom = root?.querySelector('.cw-header')?.getBoundingClientRect().bottom ?? 0
  const paletteRight = root?.querySelector('.cw-palette')?.getBoundingClientRect().right ?? 0
  const winW = typeof window !== 'undefined' ? window.innerWidth : 0
  const winH = typeof window !== 'undefined' ? window.innerHeight : 0
  const panelLeft = root?.querySelector('.cw-panel')?.getBoundingClientRect().left ?? winW
  const minLeft = paletteRight + 8
  const maxLeft = Math.max(minLeft, panelLeft - 8 - EDGE_MENU_W)
  const minTop = headerBottom + 8
  const maxTop = Math.max(minTop, winH - 8 - EDGE_MENU_H_EST)
  return { left: Math.min(Math.max(x, minLeft), maxLeft), top: Math.min(Math.max(y, minTop), maxTop) }
}

function EdgeContextMenu({ edgeId, x, y, onInsert, onClose }) {
  const ref = useRef(null)
  useEffect(() => {
    function onDown(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    function onKeyCapture(e) {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      onClose()
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKeyCapture, true)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKeyCapture, true)
    }
  }, [onClose])
  const target = typeof document !== 'undefined' ? document.getElementById('workflow-root') : null
  if (!target) return null
  const pos = clampEdgeMenuPosition(x, y)
  return createPortal(
    <div
      ref={ref}
      className="cw-header-menu cw-node-command-menu cw-node-command-menu--floating"
      style={pos}
      role="menu"
      aria-label="Connection actions"
    >
      <div className="cw-menu-view">
        <button
          type="button"
          role="menuitem"
          className="cw-menu-item"
          onClick={(e) => {
            // Splice mode — the EXACT cw:add-picker contract OmniEdge.jsx's
            // own hover + button dispatches (edgeId + a screen rect); here
            // the rect is a zero-size point AT the click, same convention
            // onPaneContextMenu/onConnectEnd's wire-drop already use for "no
            // real button to anchor off, just a point".
            const rect = { left: x, right: x, top: y, bottom: y, height: 0 }
            onInsert(edgeId, rect)
            onClose()
          }}
        >
          <Plus weight="regular" size={14} />
          Insert block
        </button>
        <button
          type="button"
          role="menuitem"
          className="cw-menu-item cw-menu-item--danger"
          onClick={() => {
            window.dispatchEvent(new CustomEvent('cw:edge-cut-request', { detail: { edgeId } }))
            onClose()
          }}
        >
          <Scissors weight="regular" size={14} />
          Cut wire
        </button>
      </div>
    </div>,
    target,
  )
}

// ---- ON-CANVAS SEARCH (ANDREW ROUND -> "B — ON-CANVAS SEARCH", PLAN.md) --
// Comment left on the live build, on the zoom rail: "Add on canvas search."
// Match text is node title + type label + agent name + format + description
// (PLAN.md's own field list). `nodeDisplayTitle` (data/blocks.js, already a
// read-only import here) resolves a Task's own custom title but folds the
// bare type name INTO that string for every other kind — searching "task"
// would miss a retitled Task card if that were the only source, so this
// keeps its own small, TYPE-ONLY table beside it rather than making one
// function answer two different questions. blocks.js itself is out of this
// seam's file grant (owned by A this round), so this is a short static
// duplicate of nodeDisplayTitle's logic-kind switch, not an export from it.
const SEARCH_TYPE_LABELS = {
  trigger: 'Trigger',
  task: 'Task / Action',
  human: 'Human Intervention',
  output: 'Output',
  wait: 'Wait / Delay',
  stop: 'Stop',
  // COMFY ROUND (CP2, item 1) — "searchable (note text indexed)".
  note: 'Note',
  // WAVE 3 — THE VERB EXPANSION. Remix is its own type (not a kind), so it
  // needs a direct entry here rather than one of the per-kind maps below.
  remix: 'Remix',
  // WAVE 4 — THE VERB EXPANSION. Handoff/Localize/Optimize/Run workflow are
  // each their own type (same "direct entry, not a per-kind map" footing as
  // Remix above). Guardrail needs none — it's a `logic` kind, covered by
  // SEARCH_LOGIC_LABELS just below.
  handoff: 'Handoff',
  localize: 'Localize',
  optimize: 'Optimize',
  runworkflow: 'Run Workflow',
}
// WAVE 1 — THE VERB EXPANSION (out-of-seam, minimal fix): mirrors
// data/blocks.js's own nodeDisplayTitle logic-kind switch, per this
// function's own header comment above ("this is a short static duplicate
// of nodeDisplayTitle's logic-kind switch") — kept in sync by hand, same as
// that comment already establishes.
const SEARCH_LOGIC_LABELS = {
  if: 'If / Else',
  switch: 'Switch / Case',
  foreach: 'For Each',
  try: 'Try / Catch',
  gather: 'Gather',
  split: 'A/B Split',
  // WAVE 3 — THE VERB EXPANSION (out-of-seam, minimal fix: same duplicate
  // convention this whole table already follows).
  compare: 'Compare',
  // WAVE 4 — THE VERB EXPANSION (same duplicate convention).
  guardrail: 'Guardrail',
}
// WAVE 2/3 — THE VERB EXPANSION (out-of-seam, minimal fix: same "short static
// duplicate of nodeDisplayTitle's kind switch" precedent as
// SEARCH_LOGIC_LABELS just above, kept in sync by hand).
const SEARCH_SIGNAL_LABELS = {
  source: 'Source',
  audience: 'Audience',
  measure: 'Measure',
  style: 'Style Reference',
}
function searchTypeLabel(node) {
  if (node.type === 'logic') return SEARCH_LOGIC_LABELS[node.data?.kind] || 'Logic'
  if (node.type === 'signal') return SEARCH_SIGNAL_LABELS[node.data?.kind] || 'Signal'
  return SEARCH_TYPE_LABELS[node.type] || node.type || 'Block'
}

// Missing fields just drop out of the join rather than printing "undefined"
// — most node kinds only ever populate 2 of the 5 (title/type only; a Task
// also has agent, an Output also has format+description). `node.data?.body`
// (COMFY ROUND CP2, item 1) is the note's own text — nodeDisplayTitle
// already covers its TITLE via the note case added there, so this is the
// one extra field a note contributes beyond every other kind.
// WAVE 2 — THE VERB EXPANSION. Signal's own primary content is likewise
// worth indexing: Source's ref (the filename/path a user would actually
// search for), Measure's kpi/target, Audience's segment labels (joined —
// same "extra field a note contributes" precedent, just three fields
// instead of one since a signal card's identifying text isn't one string).
// WAVE 3 — THE VERB EXPANSION. `node.data?.op`/`node.data?.criteria` join
// the same "index the card's own primary field, raw value not a resolved
// label" convention `ref`/`kpi`/`target` just below already established —
// Remix's op and Compare's criteria are both plain human-readable strings
// already (RemixNode.jsx's REMIX_OP_OPTIONS / LogicNode.jsx's
// COMPARE_CRITERIA_OPTIONS both store value===label), so there's no second
// lookup needed to make them searchable.
// WAVE 4 — THE VERB EXPANSION. Run Workflow's searchHaystack field wants the
// human-readable template NAME, not the stored `data.templateId` slug —
// same "index the card's own primary field" convention `ref`/`kpi`/`op`
// already established, just resolved through one lookup since a template
// picker's value is an id, not the label itself (unlike op/criteria, which
// store value===label — RemixNode.jsx/LogicNode.jsx's own comments on that).
const TEMPLATE_NAME_BY_ID = new Map(TEMPLATES.map((t) => [t.id, t.name]))

function searchHaystack(node) {
  const segmentsText = Array.isArray(node.data?.segments) ? node.data.segments.map((s) => s.label).join(' ') : null
  // WAVE 4 — THE VERB EXPANSION. Handoff's owner/due/note, Localize's
  // markets, Guardrail's checks — same "index the card's own primary
  // field(s)" convention every other kind's own entries above already
  // follow; markets/checks join like segmentsText just above (a plain array
  // of short strings, not one string).
  const marketsText = Array.isArray(node.data?.markets) ? node.data.markets.join(' ') : null
  const checksText = Array.isArray(node.data?.checks) ? node.data.checks.join(' ') : null
  return [
    nodeDisplayTitle(node),
    searchTypeLabel(node),
    node.data?.agent,
    node.data?.format,
    node.data?.description,
    node.data?.body,
    node.data?.ref,
    node.data?.kpi,
    node.data?.target,
    node.data?.op,
    node.data?.criteria,
    segmentsText,
    node.data?.owner,
    node.data?.due,
    node.data?.note,
    marketsText,
    checksText,
    node.data?.templateId ? TEMPLATE_NAME_BY_ID.get(node.data.templateId) : null,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

// ---- COMFY ROUND (CP1 — "TYPED COLOR PORTS") — invalid-drop refusal ------
// PLAN.md "## DESIGN BAR" -> item 3 ("motion vocabulary — reuse, don't
// invent"): duration/easing borrow --cw-d-1/--cw-e-spring rather than a
// bespoke shake timing, same literal-value-with-pointer-comment convention
// OmniEdge.jsx's own JS-side motion constants already use (COMET_TRAVEL_MS,
// SIGNAL_PERIOD_MS, ...) — a WAAPI `easing` STRING doesn't reliably resolve
// var() the way a plain CSS property value does, unlike the --cw-danger
// references inside the keyframes below, which do. --cw-e-spring reads as
// "arrivals, pops" in motion.css's own doc comment — a refused drop IS one,
// so it gets the same springy character as everything else in this app
// that pops in/lands, rather than a generic linear wobble. The calmer
// --cw-e-out glide is reserved for the reduced-motion read, which also
// drops the shake's `translate` keyframes entirely (kept to color/ring only
// — see PORT_REFUSE_STATIC_FRAMES).
const PORT_REFUSE_MS = 140 // --cw-d-1
const PORT_REFUSE_SPRING = 'cubic-bezier(0.34, 1.56, 0.64, 1)' // --cw-e-spring
const PORT_REFUSE_GLIDE = 'cubic-bezier(0.22, 1, 0.36, 1)' // --cw-e-out

// Standalone `translate`, never `transform` — the handle already uses
// `transform: translate(...)` for RF's OWN left/right centering (its base
// stylesheet, not this app's), same reasoning motion.css documents for
// animating `scale` instead of `transform` on these same elements. One
// WAAPI call covers both the shake AND the ring flash (not two animations)
// so this is intrinsically one clock/one `finish` event — no animationend
// race to manage the way a CSS-class version would need.
const PORT_REFUSE_SHAKE_FRAMES = [
  { translate: '0 0', borderColor: 'var(--cw-danger)', boxShadow: '0 0 0 0 color-mix(in srgb, var(--cw-danger) 60%, transparent)', offset: 0 },
  { translate: '-3px 0', offset: 0.2 },
  { translate: '3px 0', offset: 0.4 },
  { translate: '-3px 0', offset: 0.6 },
  { translate: '0 0', offset: 0.8 },
  { translate: '0 0', borderColor: 'var(--cw-danger)', boxShadow: '0 0 0 6px color-mix(in srgb, var(--cw-danger) 0%, transparent)', offset: 1 },
]
// Reduced motion (PLAN.md CP1: "no shake, static red flash") — a fixed-
// radius ring holds then fades rather than expanding, so the only thing
// moving is opacity/color, never position.
const PORT_REFUSE_STATIC_FRAMES = [
  { borderColor: 'var(--cw-danger)', boxShadow: '0 0 0 3px color-mix(in srgb, var(--cw-danger) 45%, transparent)', offset: 0 },
  { borderColor: 'var(--cw-danger)', boxShadow: '0 0 0 3px color-mix(in srgb, var(--cw-danger) 45%, transparent)', offset: 0.6 },
  { borderColor: 'var(--cw-danger)', boxShadow: '0 0 0 3px color-mix(in srgb, var(--cw-danger) 0%, transparent)', offset: 1 },
]

// ---- COMFY ROUND (CP0+ — "PICKER V2") ---------------------------------
// BlockPicker.jsx remounts fresh on every distinct picker-open (see the key
// below) rather than just receiving new props when the user moves from one
// opener to another — its own local search query/highlighted-row state
// would otherwise leak across, e.g. "sw" typed while a ghost-+ picker was
// open still showing when a DIFFERENT node's edge + opens next. Cheap and
// side-effect-free: every string here is already something this file reads
// off `picker` anyway, just joined into one identity.
function pickerKeyOf(p) {
  if (!p) return null
  if (p.kind === 'node') return `node:${p.nodeId}:${p.side}`
  if (p.kind === 'edge') return `edge:${p.edgeId}`
  if (p.kind === 'pane') return `pane:${Math.round(p.flowPoint?.x ?? 0)}:${Math.round(p.flowPoint?.y ?? 0)}`
  return `wire:${p.fromNodeId}:${p.fromHandleId}:${Math.round(p.flowX)}:${Math.round(p.flowY)}`
}

// The FROM chip's port half ("FROM 02 · out" — PLAN.md CP0+ item 2, "like
// Comfy's Input: MODEL chip"). The plain cases (out/in, true/false,
// try/catch) are already exactly what a user would call them; the two
// per-row branch kinds (Switch's case-<i>, Human choice's opt-<id>) resolve
// through the SAME `options` array HandleLabelRows itself reads
// (src/nodes/shared.jsx — another seam, so this is a small local read of
// `fromNode.data`, not an import) rather than surface the raw handle id,
// which would print as literally "case-2" or "opt-m4x7z2a".
function friendlyHandleLabel(fromNode, handleId) {
  if (!handleId || handleId === 'out' || handleId === 'in') return handleId || 'out'
  if (handleId === 'true' || handleId === 'false' || handleId === 'try' || handleId === 'catch') return handleId
  const options = fromNode?.data?.options
  if (handleId.startsWith('case-')) {
    const idx = Number(handleId.slice(5))
    return options?.[idx]?.label || `case ${idx + 1}`
  }
  if (handleId.startsWith('opt-')) {
    const opt = options?.find((o) => `opt-${o.id}` === handleId)
    return opt?.label || 'option'
  }
  return handleId
}

export default function FlowCanvas() {
  // +/- keyboard zoom + the stepped zoom buttons (Bryan) — see nextZoomStep.
  // HITL SPRING-OPEN item 1 — setCenter is this effect's own addition (the
  // camera glide below); FlowCanvas owns it directly rather than routing
  // through state.jsx's glideTo/glideToBox (out of this seam's grant) since
  // useReactFlow is already available right here.
  const { zoomTo, getZoom, fitView, setCenter } = useReactFlow()
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onReconnect,
    isValidConnection,
    addNodeFromPalette,
    insertTemplate,
    // RESULTS SHEET — which OutputNode.jsx card (if any) is currently the
    // satellite's host; see this effect's own "RESULTS SHEET — camera
    // glide" comment further down.
    resultsAnchorId,
    screenToFlowPosition,
    issues,
    focusIssue,
    autoFixIssues,
    fixIssue,
    swapKey,
    tidyUp,
    undo,
    redo,
    // NODE TOOLBAR V2 — double-click-the-head collapse entry point
    // (toggleNodeCollapse, shared.jsx) needs this straight from context, not
    // useReactFlow().updateNodeData — see patchNodeData's own header comment
    // in state.jsx for why.
    patchNodeData,
    // CONTEXT & CLIPBOARD — ⌘C/⌘V/⌘D hotkeys + the P/S bare-letter ones call
    // straight into these; the right-click menus' own rows call the same
    // functions from inside NodeCommandMenu (shared.jsx) via its own
    // useFlowState() — one source of truth for what each action does either way.
    copyNodes,
    pasteClipboard,
    duplicateNodes,
    setNodePinned,
    commentMode,
    setCommentMode,
    activeCommentId,
    setActiveCommentId,
    // SUBGRAPHS — "Enter steps" (chip/menu-row/hotkey all funnel into this
    // component's cw:enter-steps listener below, which calls this THEN
    // opens the visual stage — see that listener's own comment).
    enterTaskSteps,
  } = useFlowState()

  // ---- SUBGRAPHS — the theater's mount point (PLAN.md "## SUBGRAPHS" ->
  // "### Enter / surface"). `null` = closed; `{taskId, entryRect}` = open,
  // where entryRect is the task card's OWN getBoundingClientRect() captured
  // BEFORE enterTaskSteps runs (and before any first-entry seeding can grow
  // the card by a chip-row's worth of height) — SubgraphStage.jsx's FLIP
  // needs the card exactly as it looked the instant it was clicked, never a
  // frame later. -------------------------------------------------------
  const [subgraph, setSubgraph] = useState(null)
  useEffect(() => {
    const onEnterSteps = (event) => {
      const { taskId } = event.detail || {}
      if (!taskId) return
      const el = document.querySelector(`#workflow-root .react-flow__node[data-id="${CSS.escape(taskId)}"] .cw-node`)
      const r = el?.getBoundingClientRect()
      const entryRect = r ? { x: r.x, y: r.y, width: r.width, height: r.height } : null
      if (enterTaskSteps(taskId)) setSubgraph({ taskId, entryRect })
    }
    window.addEventListener('cw:enter-steps', onEnterSteps)
    return () => window.removeEventListener('cw:enter-steps', onEnterSteps)
  }, [enterTaskSteps])

  const [dismissedKey, setDismissedKey] = useState(null)
  // Issues error overlay (Bryan): the pill opens a popover listing every
  // problem, each row a jump-link, plus an Auto fix that repairs the lot.
  const [issuesOpen, setIssuesOpen] = useState(false)

  // ---- GHOST + PICKER (PLAN.md) — this component owns the picker's open/
  // closed state (which node/side/anchor-rect it's for); BlockPicker.jsx
  // itself only owns the popover's screen position + its own dismiss
  // behavior (outside click, Esc). `null` = closed.
  //
  // COMFY ROUND (CP0 + CP0+) added two more openers, told apart by
  // `picker.kind`:
  //   'node' — a card's ghost + (cw:add-picker {nodeId,side,rect})
  //   'edge' — CP0's wire + (OmniEdge.jsx, cw:add-picker {edgeId,rect})
  //   'wire' — CP0+'s drag-to-empty-pane gesture (onConnectEnd below sets
  //            this directly — no window event needed, the state already
  //            lives in this component)
  // CONTEXT & CLIPBOARD adds a fifth, set directly by onPaneContextMenu
  // below (no window event either — same reasoning as 'wire'):
  //   'pane' — right-click on empty canvas: "the BlockPicker at cursor
  //            (insert-at-point, no wiring — the Comfy add-node gesture
  //            without the drag)". Reuses this exact popover verbatim
  //            (same searchable list, same Esc/outside-click) — only
  //            `handlePickBlock` below needed a new branch, since picking a
  //            row here must NOT wire anything.
  // -------------------------------------------------------------------------
  const [picker, setPicker] = useState(null)
  // CONTEXT & CLIPBOARD (item 4 — "Right-click menus"). Node/multi-select
  // menu and the small edge menu each get their own tiny bit of state (which
  // one is open, at what screen point) — mutually exclusive with each other
  // AND with `picker` above (opening any one of the three closes the other
  // two), same "only one at a time" rule GHOST + PICKER already established.
  const [nodeMenu, setNodeMenu] = useState(null) // { ids: string[], x, y }
  const [edgeMenu, setEdgeMenu] = useState(null) // { edgeId, x, y }
  useEffect(() => {
    const onAddPicker = (event) => {
      const { nodeId, side, edgeId, rect } = event.detail || {}
      if (nodeId && side) {
        // "Dismiss: ... or clicking the + again." Re-clicking the SAME ghost
        // that's already open closes it instead of re-opening in place;
        // clicking any OTHER ghost (a different node, or the other side of
        // this one) just moves the single picker there — "only one picker
        // open at a time" falls out for free since this always replaces
        // rather than toggling a set.
        setPicker((cur) =>
          cur?.kind === 'node' && cur.nodeId === nodeId && cur.side === side ? null : { kind: 'node', nodeId, side, rect },
        )
        return
      }
      // CP0 — the SAME cw:add-picker contract, from OmniEdge.jsx's wire +
      // (edgeId instead of nodeId/side). Same toggle-close-on-repeat-click.
      if (edgeId) {
        setPicker((cur) => (cur?.kind === 'edge' && cur.edgeId === edgeId ? null : { kind: 'edge', edgeId, rect, side: 'right' }))
      }
    }
    window.addEventListener('cw:add-picker', onAddPicker)
    return () => window.removeEventListener('cw:add-picker', onAddPicker)
  }, [])
  // Picking a row replays EXACTLY the old cw:add-from contract for the node
  // ghost case, extended (CP0) with cw:edge-insert's own itemId, and (CP0+)
  // with a brand-new cw:wire-add for the drag-to-empty-pane case — see
  // state.jsx's onAddFrom/onEdgeInsert/onWireAdd respectively. Closes the
  // picker either way — pick or dismiss.
  const handlePickBlock = useCallback((itemId) => {
    setPicker((cur) => {
      if (cur?.kind === 'node') {
        window.dispatchEvent(new CustomEvent('cw:add-from', { detail: { nodeId: cur.nodeId, side: cur.side, itemId } }))
      } else if (cur?.kind === 'edge') {
        window.dispatchEvent(new CustomEvent('cw:edge-insert', { detail: { edgeId: cur.edgeId, itemId } }))
      } else if (cur?.kind === 'wire') {
        window.dispatchEvent(
          new CustomEvent('cw:wire-add', {
            detail: {
              nodeId: cur.fromNodeId,
              handleId: cur.fromHandleId,
              handleType: cur.fromHandleType,
              x: cur.flowX,
              y: cur.flowY,
              itemId,
            },
          }),
        )
        // WIRE FEEL item 5 — AUTHORIZED additive dispatch: "completes with
        // the settle morph on pick." A row was actually chosen, so the
        // held/frozen line (ConnectionLine.jsx) fades out clean rather than
        // retracting — the new edge's own connect-settle (cw:wire-connected,
        // fired the same way as a live drag once state.jsx mints it) takes
        // over the "arrives and settles" job.
        window.dispatchEvent(new CustomEvent('cw:wire-release', { detail: { reason: 'pick' } }))
      } else if (cur?.kind === 'pane') {
        // "insert-at-point, no wiring" — straight to addNodeFromPalette with
        // an explicit position, the SAME path a palette drag-drop already
        // uses (onDrop below); no window event needed since this component
        // already holds everything the mutation needs.
        const paletteItem = itemId ? paletteItemById(itemId) : null
        if (paletteItem) addNodeFromPalette(paletteItem, cur.flowPoint)
      }
      return null
    })
  }, [addNodeFromPalette])
  // Marquee tool (Bryan: "click and drag a bunch of nodes and move them as a
  // group"). Shift+drag already did this — RF's default selectionKeyCode —
  // but a hidden modifier isn't an affordance, so this toggle makes plain
  // left-drag draw a selection box instead of panning. Middle/right-drag
  // still pan while it's on, and Shift+drag still works when it's off.
  const [selectMode, setSelectMode] = useState(false)

  // + RAIL VIEW TOGGLES (PLAN.md, same dispatch as NODE TOOLBAR V2) —
  // Comfy's bottom-right pair. Both session-local UI preferences only, same
  // footing as selectMode/commentMode above — never part of the graph
  // schema, never persisted. Minimap defaults ON (Bryan: "these two
  // controls"), wires default visible (off = hidden is the non-default).
  const [minimapVisible, setMinimapVisible] = useState(true)
  const [wiresHidden, setWiresHidden] = useState(false)
  // FOCUS MODE (Bryan: "a hide the ui button... except the nodes
  // themselves so like no left rail, right rail, bottom rail, just the
  // thing in the screenshot and the share/run module") — a body-level
  // class is the honest mechanism: the surfaces being hidden are SIBLINGS
  // of this stage (palette, compiled panel, deliverables shelf, the shell's
  // own header/footer), not children, so no amount of local state could
  // reach them. Session-only, never persisted (refresh-resets doctrine).
  const [focusMode, setFocusMode] = useState(false)
  useEffect(() => {
    const root = document.getElementById('workflow-root')
    if (!root) return undefined
    root.classList.toggle('cw-focus-mode', focusMode)
    document.body.classList.toggle('cw-focus-mode', focusMode)
    return () => {
      root.classList.remove('cw-focus-mode')
      document.body.classList.remove('cw-focus-mode')
    }
  }, [focusMode])

  // F11 (QA FINDINGS LEDGER) — "Chromeless minimap bleeds card content AT
  // REST (hover-yield exists, rest doesn't)". flow.css's chromeless treatment
  // (Bryan: "no card, no mask wash") means the minimap has zero backing at
  // ALL times, not just while nothing's behind it — the existing yield
  // mechanism (minimapVisible's neighbor effect, further down) only ever
  // solves the POINTER case (a buried button stays clickable), never the
  // purely visual one (a card's own text/color showing straight through the
  // dots when the graph pans a node under that corner). Auto-frost: a quiet
  // backing appears ONLY while real content is actually there to hide,
  // fades in exactly like it faded out — never a hard toggle. `transform`
  // (full [x,y,zoom], not ZoomReadout's zoom-only slice above) so a PAN
  // alone re-checks too, not just a zoom.
  const [minimapFrosted, setMinimapFrosted] = useState(false)
  const minimapTransform = useStore((s) => s.transform)
  useEffect(() => {
    if (!minimapVisible) return
    const root = document.getElementById('workflow-root')
    const mapEl = root?.querySelector('.react-flow__minimap')
    if (!mapEl) return
    const mapRect = mapEl.getBoundingClientRect()
    if (mapRect.width === 0 || mapRect.height === 0) return
    let intersects = false
    for (const el of root.querySelectorAll('.react-flow__viewport .react-flow__node')) {
      const r = el.getBoundingClientRect()
      if (r.right > mapRect.left && r.left < mapRect.right && r.bottom > mapRect.top && r.top < mapRect.bottom) {
        intersects = true
        break
      }
    }
    setMinimapFrosted(intersects)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, minimapTransform, minimapVisible])

  // RUN PHASE (R4 item 4) — snap-to-grid toggle, default OFF (PLAN.md).
  // Local UI preference only, not part of the graph schema/undo history.

  // COMMENTS PHASE — the not-yet-posted pin's flow position (PLAN.md "##
  // COMMENTS PHASE"). Lives here (not in state.jsx's context) for the same
  // reason dismissedKey/issuesOpen/selectMode above do: it's transient
  // canvas-local UI state, never part of the graph or the comments list —
  // CommentsLayer.jsx only calls the context's `addComment` once the draft
  // is actually posted, so an abandoned draft never touches global state.
  const [draftPin, setDraftPin] = useState(null)

  // "Click empty canvas -> drop a pin there and open an inline composer"
  // (comment mode) / "Clicking elsewhere closes it" (any open thread card,
  // any mode) — React Flow only invokes onPaneClick for a click that lands
  // on the bare pane itself (verified against the installed package: Pane's
  // onClick is wrapped to require `event.target === paneEl`), so a click on
  // a pin, a node, or a card never reaches here to begin with.
  const onPaneClick = useCallback(
    (event) => {
      if (commentMode) {
        setDraftPin(screenToFlowPosition({ x: event.clientX, y: event.clientY }))
        setActiveCommentId(null)
      } else {
        setDraftPin(null)
        setActiveCommentId(null)
      }
    },
    [commentMode, screenToFlowPosition, setActiveCommentId],
  )

  // ---- CONTEXT & CLIPBOARD (PLAN.md item 4 — "Right-click menus") --------
  // Native contextmenu, one handler per RF surface. Every one of the four
  // starts the same way — preventDefault (suppresses the browser's own menu
  // "inside the builder only" — this app's canvas, not the palette/panel/
  // header chrome outside it, which these RF props don't cover to begin
  // with) and closes whichever OTHER of the three floating surfaces
  // (picker/nodeMenu/edgeMenu) might already be open, so only ever one is
  // up — then opens its own. Comment mode gets first refusal on all four: a
  // right-click while placing a pin shouldn't also pop a competing menu.
  const onNodeContextMenu = useCallback(
    (event, node) => {
      event.preventDefault()
      if (commentMode) return
      // FrameNode/VariantCard never render NodeActionsToolbar either (VARIANT
      // STUDIO's own "toolbar must NOT appear on variant cards" rule) — the
      // right-click menu honors the identical structural exclusion rather
      // than offering Copy/Pin/Skip/etc. on an auto-generated grid child.
      if (node.type === 'variantgroup' || node.type === 'variant') return
      const selectedIds = nodes.filter((n) => n.selected).map((n) => n.id)
      // "multi-select right-click scopes Copy/Duplicate/Delete to the
      // selection" — only when the RIGHT-CLICKED node is itself part of that
      // 2+ selection; right-clicking an unrelated, unselected node while
      // something else happens to be selected elsewhere acts on just the
      // node you clicked (no surprise reselection side effect from a
      // right-click alone).
      const ids = selectedIds.length > 1 && selectedIds.includes(node.id) ? selectedIds : [node.id]
      setPicker(null)
      setEdgeMenu(null)
      setNodeMenu({ ids, x: event.clientX, y: event.clientY })
    },
    [nodes, commentMode],
  )

  // RF's own onSelectionContextMenu — fires for a right-click on the
  // multi-select bounding-box overlay itself (the drag-the-whole-group
  // chrome), which can land off any individual node's own DOM. Defensive
  // completeness alongside onNodeContextMenu above: same reduced Copy/
  // Duplicate/Delete scoping, just a different RF entry point into it.
  const onSelectionContextMenu = useCallback(
    (event, selectedNodes) => {
      event.preventDefault()
      if (commentMode) return
      const ids = selectedNodes.filter((n) => n.type !== 'variantgroup' && n.type !== 'variant').map((n) => n.id)
      if (!ids.length) return
      setPicker(null)
      setEdgeMenu(null)
      setNodeMenu({ ids, x: event.clientX, y: event.clientY })
    },
    [commentMode],
  )

  const onEdgeContextMenu = useCallback(
    (event, edge) => {
      event.preventDefault()
      if (commentMode) return
      setPicker(null)
      setNodeMenu(null)
      setEdgeMenu({ edgeId: edge.id, x: event.clientX, y: event.clientY })
    },
    [commentMode],
  )

  // "on the PANE -> the BlockPicker at cursor (insert-at-point, no wiring —
  // the Comfy add-node gesture without the drag)." Reuses the picker's
  // existing 'pane' kind (handlePickBlock above) — a zero-size rect AT the
  // cursor is the exact same convention onConnectEnd's own wire-drop-to-
  // empty-pane case already uses for "open this popover at a bare point".
  const onPaneContextMenu = useCallback(
    (event) => {
      event.preventDefault()
      if (commentMode) return
      setNodeMenu(null)
      setEdgeMenu(null)
      const rect = { left: event.clientX, right: event.clientX, top: event.clientY, bottom: event.clientY, height: 0 }
      setPicker({
        kind: 'pane',
        rect,
        side: 'right',
        flowPoint: screenToFlowPosition({ x: event.clientX, y: event.clientY }),
      })
    },
    [commentMode, screenToFlowPosition],
  )

  // Measurement heal pass. Booting inside the shell overlay, React Flow's own
  // ResizeObserver pipeline can lose its one initial delivery (the internals
  // update races the store's domNode registration) — nodes then stay
  // unmeasured forever and every edge silently skips rendering, with no
  // warning. Re-measure explicitly via the public escape hatch on mount,
  // whenever the node set changes (palette drops, ghost-adds, edge-inserts),
  // and whenever the shell reopens the overlay.
  const updateNodeInternals = useUpdateNodeInternals()
  const nodeIdsRef = useRef([])
  nodeIdsRef.current = nodes.map((n) => n.id)
  const idSignature = nodeIdsRef.current.join(',')
  useEffect(() => {
    if (idSignature) updateNodeInternals(idSignature.split(','))
  }, [idSignature, updateNodeInternals])
  useEffect(() => {
    const heal = () => {
      if (nodeIdsRef.current.length) updateNodeInternals([...nodeIdsRef.current])
    }
    window.addEventListener('omni:workflow-toggle', heal)
    return () => window.removeEventListener('omni:workflow-toggle', heal)
  }, [updateNodeInternals])

  // NODE TOOLBAR V2 — "double-click card head ALSO toggles" (item 3), the
  // toolbar button's OTHER entry point. RF's own onNodeDoubleClick fires for
  // a double-click ANYWHERE on the node (a textarea, a chip, ...), so this
  // scopes to just the head via closest() — double-clicking a field to
  // select a word must never collapse the card out from under it. Reads the
  // node's live data straight off the `nodes` array (context) rather than
  // event.target, same source toggleNodeCollapse's other caller (shared.jsx)
  // reads off useNodesData.
  const onNodeDoubleClick = useCallback(
    (event, node) => {
      if (!event.target.closest?.('.cw-card-head')) return
      toggleNodeCollapse(node.id, !!node.data?.collapsed, patchNodeData, updateNodeInternals)
    },
    [patchNodeData, updateNodeInternals],
  )

  // Handle-alignment heal (Bryan's misaligned-connection bug): the materialize
  // entrance holds cards at scale(.96)/translate(6px) — with the cascade's
  // staggered delays, the id-signature heal above can capture handleBounds
  // from a mid-animation (or not-yet-started, `backwards`-filled) card, and
  // ResizeObserver never corrects it because transforms don't change layout
  // size. Re-measure each node the moment its entrance actually finishes.
  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return undefined
    let queue = new Set()
    let raf = null
    const flush = () => {
      raf = null
      if (queue.size) {
        updateNodeInternals([...queue])
        queue = new Set()
      }
    }
    const onAnimEnd = (e) => {
      if (e.animationName !== 'cw-materialize' && e.animationName !== 'cw-land') return
      const nodeEl = e.target.closest?.('.react-flow__node')
      const id = nodeEl?.getAttribute('data-id')
      if (!id) return
      queue.add(id)
      if (raf == null) raf = requestAnimationFrame(flush)
    }
    wrap.addEventListener('animationend', onAnimEnd)
    return () => {
      wrap.removeEventListener('animationend', onAnimEnd)
      if (raf != null) cancelAnimationFrame(raf)
    }
  }, [updateNodeInternals])

  // ---- MOTION PHASE item 3 — landing ripples ------------------------------
  const [ripples, setRipples] = useState([])
  const rippleTimersRef = useRef(new Map())

  // `w`/`h` optional: with them the shockwave expands from the dropped card's
  // whole outline (Bryan) rather than from the cursor point. `options.variant`
  // (RUN SHOW A2) tags the ripple for a CSS-only look change — motion.css
  // keys off `cw-ripple--<variant>` — without forking this function or
  // touching any of its three existing call sites, none of which pass a
  // 5th argument today.
  const spawnRipple = useCallback((x, y, w, h, options) => {
    const id = nextRippleId()
    const variant = options?.variant
    setRipples((rs) => [...rs, { id, x, y, w, h, variant }])
    const timer = setTimeout(() => {
      setRipples((rs) => rs.filter((r) => r.id !== id))
      rippleTimersRef.current.delete(id)
    }, 600)
    rippleTimersRef.current.set(id, timer)
  }, [])

  useEffect(() => {
    const timers = rippleTimersRef.current
    return () => {
      timers.forEach((t) => clearTimeout(t))
      timers.clear()
    }
  }, [])

  // state.jsx dispatches this for the cw:add-from spawn point (it has no DOM
  // to render into itself — see its own header comment).
  useEffect(() => {
    const onRippleEvent = (event) => {
      const { x, y, w, h } = event.detail || {}
      if (typeof x === 'number' && typeof y === 'number') spawnRipple(x, y, w, h)
    }
    window.addEventListener('cw:ripple', onRippleEvent)
    return () => window.removeEventListener('cw:ripple', onRippleEvent)
  }, [spawnRipple])

  // ---- RUN SHOW A2 — paused beacon ----------------------------------------
  // While a human node sits in runState 'paused' (run/engine.js's
  // waitForHuman — READ-ONLY reference, no engine changes here per PLAN.md),
  // ping a dim version of the existing box-ripple from its footprint every
  // 2.5s: "draws the eye to where input is needed on a big graph." Needs
  // each paused node's CURRENT box at every tick, not one captured when the
  // interval starts (a paused node dragged mid-wait should still ping from
  // where it actually is) — a plain ref mirrors the live `nodes` array for
  // that lookup, cheaper than re-deriving the interval effect on every
  // position tick.
  const nodesRef = useRef(nodes)
  nodesRef.current = nodes

  // RESULTS SHEET — same inline-synced-ref idiom as `nodesRef` just above,
  // for the SAME reason: the `cw:run-complete` listener further down fires
  // via requestAnimationFrame (state.jsx's onRunSettled) rather than a
  // render, so it needs a value that's guaranteed fresh at fire time rather
  // than whatever `resultsAnchorId` this closure happened to capture when
  // the effect was last (re)established.
  const resultsAnchorIdRef = useRef(resultsAnchorId)
  resultsAnchorIdRef.current = resultsAnchorId

  // Keyed on the SET of paused ids (a stable sorted/joined string), not the
  // raw `nodes` array — that array also changes on every unrelated drag
  // tick and streaming-output chunk, which would otherwise restart every
  // beacon's 2.5s phase on each one.
  const pausedKey = nodes
    .filter((n) => n.data?.runState === 'paused')
    .map((n) => n.id)
    .sort()
    .join(',')

  useEffect(() => {
    if (!pausedKey) return undefined
    if (prefersReducedMotion()) return undefined // A4 — beacon interval OFF entirely
    const ids = pausedKey.split(',')
    const timers = ids.map((id) =>
      setInterval(() => {
        // Re-check paused-ness at FIRE time, not just at effect-setup time —
        // `clearInterval` can't retract a tick the browser had already
        // queued the SAME moment `continueHuman` resolves this node
        // (verified against real timing: an answer landing right on a 2.5s
        // boundary let one already-queued tick through before cleanup ran).
        // Harmless either way (one extra dim ripple), but free to close off.
        const node = nodesRef.current.find((n) => n.id === id)
        if (!node || node.data?.runState !== 'paused') return
        const box = nodeBox(node)
        // "REUSE the existing box-ripple (spawnRipple) at low opacity"
        // (PLAN.md A2) — same mechanism as a card landing, just dimmer
        // (cw-ripple--beacon, motion.css) so it reads as a patient radar
        // ping, not an impact.
        spawnRipple(box.x, box.y, box.w, box.h, { variant: 'beacon' })
      }, 2500),
    )
    return () => timers.forEach((t) => clearInterval(t))
  }, [pausedKey, spawnRipple])

  // ---- HITL SPRING-OPEN item 1 — camera glide ------------------------------
  // "it should like spring open... could be just the node gets really big
  // and zooms you in" (PLAN.md "## HITL SPRING-OPEN"). Fires the
  // instant a CHAT-mode human node (part-b.js's always-on-engine review
  // node — same scope guard HumanNode.jsx's own `isChat` check uses; no
  // other human node ever sets responseType:'chat') ENTERS runState
  // 'paused'. Same "stable sorted/joined id string" idiom as `pausedKey`
  // just above, scoped further to chat+paused — diffed against a ref of the
  // PREVIOUSLY seen set (not the raw array) so this reacts to the actual
  // false->true TRANSITION, never a re-render that leaves the set
  // unchanged (a chat reply, a resize, a drag all leave chatPausedKey
  // byte-identical). A genuine fresh pause — a new run reaching this node
  // again after it already resolved once — always replays it, because the
  // id drops out of the tracked set the moment it stops being paused.
  // THE GATE NEGOTIATES — gates pop the same chat box on pause now, so the
  // glide covers BOTH conversational pauses: checkin nodes (their own type;
  // the legacy responseType==='chat' breadcrumb also matches stale data)
  // AND paused classic gates (type 'human' — free or choice, both present
  // the chat surface). The gate executor could not stamp responseType on
  // gates without breaking their live branching, so the filter widens here
  // instead (that phase's own flagged gap).
  const chatPausedKey = nodes
    .filter(
      (n) =>
        n.data?.runState === 'paused' &&
        (n.type === 'checkin' || n.type === 'human' || n.data?.responseType === 'chat'),
    )
    .map((n) => n.id)
    .sort()
    .join(',')
  const prevChatPausedRef = useRef(new Set())

  useEffect(() => {
    const currentIds = chatPausedKey ? chatPausedKey.split(',') : []
    const prevSet = prevChatPausedRef.current
    const newlyPaused = currentIds.filter((cid) => !prevSet.has(cid))
    prevChatPausedRef.current = new Set(currentIds)
    if (!newlyPaused.length) return undefined
    // Only ever one chat-capable human node in scope today (the SCOPE
    // GUARD), but written to generalize: the first newly-paused one wins,
    // same "first match wins" precedent this file's own ECHO_SOURCES/
    // handle-label helpers already use for a single-slot pick.
    const targetId = newlyPaused[0]
    // A tick of slack before reading the box — the chat shell mounts THIS
    // same render (Reveal's own open transition is only just starting), so
    // React Flow's `node.measured` may still reflect the PRE-chat-open
    // size for one frame; nodeBox (builder.js) already falls back to its
    // own estimate when `measured` is stale/absent either way, matching
    // glideTo/glideToBox's own 40ms precedent (state.jsx) for the identical
    // reason.
    const t = setTimeout(() => {
      const node = nodesRef.current.find((n) => n.id === targetId)
      if (!node) return
      const pane = document.querySelector('#workflow-root .react-flow')
      if (!pane) return
      const box = nodeBox(node)
      // NODE SHEET (PLAN.md "## NODE SHEET") — "camera glide unchanged but
      // target box = node + sheet union so BOTH land in view". The sheet is
      // a position:absolute child of the node's own card wrapper
      // (HumanNode.jsx/nodes.css `.cw-chat-sheet`), so it's invisible to
      // node.measured/nodeBox — an out-of-flow descendant never inflates
      // its ancestor's own layout box, only paints past it. This reads the
      // sheet's OWN rendered rect straight off the DOM (present the instant
      // it springs open, same fresh-pause timing this effect already waits
      // 40ms for) and unions it into the target box via screenToFlowPosition
      // (already in scope, pan/zoom-aware) — everything else below (panel
      // offset, zoom clamp) is untouched, still keyed to the union's own
      // center point instead of the node's alone.
      const sheetEl = document.querySelector(
        `#workflow-root .react-flow__node[data-id="${CSS.escape(targetId)}"] .cw-chat-sheet`,
      )
      let unionBox = box
      if (sheetEl) {
        const r = sheetEl.getBoundingClientRect()
        const topLeft = screenToFlowPosition({ x: r.left, y: r.top })
        const bottomRight = screenToFlowPosition({ x: r.right, y: r.bottom })
        const minX = Math.min(box.x, topLeft.x)
        const minY = Math.min(box.y, topLeft.y)
        const maxX = Math.max(box.x + box.w, bottomRight.x)
        const maxY = Math.max(box.y + box.h, bottomRight.y)
        unionBox = { x: minX, y: minY, w: maxX - minX, h: maxY - minY }
      }
      const root = document.getElementById('workflow-root')
      // Panel-offset correction — same reasoning/formula as state.jsx's
      // glideTo/glideToBox: the compiled panel floats over the pane's right
      // side, so centering on the raw midpoint parks the target partway
      // under the glass. Shifting right by half the panel (in flow units,
      // hence the /zoom) lands it in the middle of the band actually
      // visible past it.
      const panelW = root ? parseFloat(getComputedStyle(root).getPropertyValue('--cw-panel-w')) || 288 : 288
      // "zoom clamped into [current, 1.0] — never zoom OUT past current"
      // (PLAN.md). A node already comfortably in view at, say, 140% must
      // not get yanked back down to 100%; one currently zoomed way out
      // (25%, this file's own ZOOM_MIN) gets brought up to a genuinely
      // readable 100%, never further. `current` is always inside this
      // <ReactFlow> instance's own configured [ZOOM_MIN, ZOOM_MAX] range by
      // construction, and 1.0 always is too, so `targetZoom` can never fall
      // outside it either — the exact condition under which setCenter
      // silently no-ops the WHOLE transition (CDP-found, documented at
      // length in state.jsx's own glideToBox comment).
      const current = getZoom()
      const targetZoom = current >= 1 ? current : 1
      const point = { x: unionBox.x + unionBox.w / 2, y: unionBox.y + unionBox.h / 2 }
      setCenter(point.x + panelW / 2 / targetZoom, point.y, {
        zoom: targetZoom,
        duration: prefersReducedMotion() ? 0 : 650,
      })
    }, 40)
    return () => clearTimeout(t)
  }, [chatPausedKey, getZoom, setCenter, screenToFlowPosition])

  // ---- RESULTS SHEET — camera glide (PLAN.md "## RESULTS SHEET") ----------
  // "camera glide unchanged but target box = node + sheet union so BOTH land
  // in view" — the free-standing `results` frame node this glide used to
  // target is gone; the target is now the ANCHOR OutputNode.jsx card unioned
  // with its own `.cw-results-sheet` rect, the EXACT same union-box idiom
  // chatPausedKey's own effect above already uses for the chat sheet (measure
  // via `nodeBox`, union with the sheet's live getBoundingClientRect() via
  // screenToFlowPosition, panel-offset correction, zoom clamped into
  // [current, 1.0]).
  //
  // TRIGGER unchanged from the old frame-node version: `cw:run-complete`
  // (state.jsx's RUN SHOW B4 signal, dispatched by onRunSettled ONLY on a
  // clean settle — never on stopRun) rather than chatPausedKey's own
  // ref-diffed id-set, for the same reason documented there — "the run-done
  // transition" has no filtered array to diff, and an event listener is
  // already edge-triggered. Reusing it here also means a RE-RUN (which
  // reuses the SAME anchor card — "re-run: same sheet, versions bump," never
  // a fresh spawn) still gets its own fresh glide, one per completion.
  useEffect(() => {
    function onRunComplete() {
      // A tick of slack before reading the sheet's box — same reasoning as
      // chatPausedKey's own 40ms wait: `resultsAnchorId` flipping true is
      // itself a state update (state.jsx, off `deliveryOrder`) that has to
      // flow through a render before OutputNode.jsx's own useResultsSheetPresence
      // effect mounts `.cw-results-sheet` into the DOM; reading synchronously
      // inside this listener could race that by a frame. `resultsAnchorIdRef`/
      // `nodesRef` are read FRESH inside the timeout (not closed-over
      // `resultsAnchorId`/`nodes`) for the identical reason those two refs
      // exist at all.
      setTimeout(() => {
        const anchorId = resultsAnchorIdRef.current
        if (!anchorId) return
        const node = nodesRef.current.find((n) => n.id === anchorId)
        if (!node) return
        const pane = document.querySelector('#workflow-root .react-flow')
        if (!pane) return
        const box = nodeBox(node)
        // Union with the sheet's own live rect — verbatim idiom/comment as
        // chatPausedKey's own effect above (see that block for the full
        // "out-of-flow descendant never inflates node.measured" reasoning).
        const sheetEl = document.querySelector(
          `#workflow-root .react-flow__node[data-id="${CSS.escape(anchorId)}"] .cw-results-sheet`,
        )
        let unionBox = box
        if (sheetEl) {
          const r = sheetEl.getBoundingClientRect()
          const topLeft = screenToFlowPosition({ x: r.left, y: r.top })
          const bottomRight = screenToFlowPosition({ x: r.right, y: r.bottom })
          const minX = Math.min(box.x, topLeft.x)
          const minY = Math.min(box.y, topLeft.y)
          const maxX = Math.max(box.x + box.w, bottomRight.x)
          const maxY = Math.max(box.y + box.h, bottomRight.y)
          unionBox = { x: minX, y: minY, w: maxX - minX, h: maxY - minY }
        }
        const root = document.getElementById('workflow-root')
        // Panel-offset correction — identical formula/reasoning to
        // chatPausedKey's own effect above (state.jsx's glideTo/glideToBox
        // share it too): centering on the raw midpoint parks the target
        // partway under the compiled panel's glass, so shift right by half the
        // panel width (in flow units, hence the /zoom).
        const panelW = root ? parseFloat(getComputedStyle(root).getPropertyValue('--cw-panel-w')) || 288 : 288
        // Zoom clamped into [current, 1.0] — never zoom OUT past whatever the
        // user is already looking at; a node way zoomed out gets brought up to
        // a readable 100%, never further (same reasoning/comment as
        // chatPausedKey's own `targetZoom` above).
        const current = getZoom()
        const targetZoom = current >= 1 ? current : 1
        const point = { x: unionBox.x + unionBox.w / 2, y: unionBox.y + unionBox.h / 2 }
        setCenter(point.x + panelW / 2 / targetZoom, point.y, {
          zoom: targetZoom,
          duration: prefersReducedMotion() ? 0 : 650,
        })
      }, 40)
      // Not cleared on unmount — a component unmount mid-flight of this
      // one-shot 40ms window is the same accepted edge case state.jsx's own
      // onRunSettled 600ms post-completion timer already leaves unguarded.
    }
    window.addEventListener('cw:run-complete', onRunComplete)
    return () => window.removeEventListener('cw:run-complete', onRunComplete)
  }, [getZoom, setCenter, screenToFlowPosition])

  // (Trigger-only ghost hint removed per Bryan 2026-08-12.)

  // (Pointer spotlight removed per Bryan 2026-08-12 — the blurred accent glow
  // that tracked the cursor over the canvas.)
  const wrapRef = useRef(null)

  // ---- NODE BOOM PHASE — silhouette + shard burst on delete --------------
  const [booms, setBooms] = useState([])
  const boomTimersRef = useRef(new Map())

  // Mirrors spawnRipple above: insert now (so the burst appears the same
  // frame the node disappears), schedule its own removal, clean up the
  // timer map entry once it fires. `index` (this node's position in a
  // multi-delete batch, 0 for a single delete) becomes a per-boom CSS
  // animation-delay on the silhouette + every shard in the render below —
  // that's what actually produces the "staggered" crackle PLAN.md asks for;
  // the boom is still mounted immediately, it just doesn't start animating
  // right away. Also fires the existing box-ripple at the same box, per
  // PLAN.md item 3 ("prefer calling spawnRipple" over cloning its
  // keyframes).
  const spawnBoom = useCallback(
    (node, index) => {
      // VARIANT STUDIO — deleting a variant grid cascades onto its cards
      // (React Flow's own parentId semantics), and a card's `.position` is
      // relative to its frame, not the canvas — resolveNodeBox (state.jsx)
      // resolves the real absolute box so a card's boom doesn't burst near
      // the canvas origin instead of where the card actually was.
      const box = resolveNodeBox(node, new Map(nodesRef.current.map((n) => [n.id, n])))
      const id = nextBoomId()
      const delay = index * BOOM_STAGGER_MS
      setBooms((bs) => [...bs, { id, cx: box.x + box.w / 2, cy: box.y + box.h / 2, w: box.w, h: box.h, delay }])
      // 460ms longest shard animation + up to 60ms of its own internal
      // crackle delay + this boom's own stagger delay + a buffer — always
      // comfortably ahead of where the animationend cleanup below is
      // expected to fire in the common (motion-enabled) case.
      const timer = setTimeout(() => {
        setBooms((bs) => bs.filter((b) => b.id !== id))
        boomTimersRef.current.delete(id)
      }, 620 + delay)
      boomTimersRef.current.set(id, timer)
      spawnRipple(box.x, box.y, box.w, box.h)
    },
    [spawnRipple],
  )

  useEffect(() => {
    const timers = boomTimersRef.current
    return () => {
      timers.forEach((t) => clearTimeout(t))
      timers.clear()
    }
  }, [])

  // Primary cleanup path — remove a boom as soon as its own longest-running
  // piece (a shard's cw-boom-shard flight) actually finishes, rather than
  // always waiting out the fallback timer above. Delegated on wrapRef, same
  // technique as the handle-alignment heal below, but its own listener/
  // filter — that one only ever looks at card entrance animations, this one
  // only at booms, so the two stay easy to reason about separately. The
  // fallback timer above is what still catches it under
  // prefers-reduced-motion, where motion.css turns this animation off
  // entirely and no animationend ever fires here.
  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return undefined
    const onBoomAnimEnd = (e) => {
      if (e.animationName !== 'cw-boom-shard') return
      const id = e.target.closest?.('.cw-boom')?.getAttribute('data-boom-id')
      if (!id) return
      setBooms((bs) => bs.filter((b) => b.id !== id))
    }
    wrap.addEventListener('animationend', onBoomAnimEnd)
    return () => wrap.removeEventListener('animationend', onBoomAnimEnd)
  }, [])

  // ---- MINIMAP YIELD (CDP-found bug, 2026-08-13) --------------------------
  // flow.css strips the minimap to "chromeless" — transparent panel, only the
  // tiny node rects paint — but the PANEL still hit-tests as its full
  // rectangle: an invisible click shield over the bottom-right corner. Fit
  // the audience flow and Run it, and the second live human card's option
  // buttons can land under that shield — elementsFromPoint reports the
  // topmost hit as .react-flow__minimap-svg, the click dies silently, and
  // nothing LOOKS wrong because the card shows right through the transparent
  // panel. A blanket pointer-events:none would fix that but kill the
  // minimap's own deliberate pannable/zoomable affordance (flow.css even
  // grew grab cursors to advertise it), and a node can't be z-lifted above a
  // .react-flow__panel from inside the viewport's stacking context — so the
  // map yields POINT BY POINT instead: while the cursor rests where real
  // graph content sits beneath the panel, a class flips it to
  // pointer-events:none (+ a dim, flow.css) and events fall through to the
  // content; over beneath-empty spots it stays fully interactive. "Real
  // content" = anything inside .react-flow__viewport — nodes, edges + their
  // hover controls, comment pins; decorative layers (ripples, booms, ghost
  // hints) are pointer-events:none and never appear in elementsFromPoint.
  // Delegated on wrapRef, not the panel (the stage remounts on swapKey and
  // would silently drop panel-bound listeners); a drag that STARTS on the
  // minimap suppresses evaluation until pointerup, because a minimap pan
  // slides the graph's content under the cursor mid-drag and would
  // otherwise ghost the panel out from under its own drag.
  // Integrated-sweep FAIL B3/D3 widened this from minimap-only to BOTH
  // floating chrome surfaces — the compiled panel's 288px right dock was
  // silently eating clicks on any live control beneath it (a paused human's
  // Continue, a node toolbar's trash) at ordinary desktop widths. The two
  // yield under DIFFERENT rules, because the minimap is decoration but the
  // panel is a working surface with its own buttons:
  //   minimap — yields over ANY graph content beneath (as before);
  //   panel   — yields only when the buried thing is itself INTERACTIVE
  //             (a button/input inside the viewport), so hovering the
  //             panel's own Apply/Fix rows over a plain card body never
  //             ghosts the panel out from under its own controls.
  // Listener target moved from the stage wrap to #workflow-root: the panel
  // is a SIBLING of the stage, so the old wrap-scoped listener could never
  // see moves over it. Root outlives swapKey remounts, same reasoning the
  // original wrap delegation gave for not binding the panel itself.
  useEffect(() => {
    const root = document.getElementById('workflow-root')
    if (!root) return undefined
    const SURFACES = [
      { selector: '.react-flow__minimap', cls: 'cw-minimap-yield', interactiveOnly: false },
      { selector: '.cw-panel', cls: 'cw-panel-yield', interactiveOnly: true },
      // F8 (QA FINDINGS LEDGER) — the palette (left) never got this
      // treatment even though it's the exact same shape of problem as the
      // panel: a node toolbar (or the node itself) parked near the canvas's
      // left edge can render its floating pill/controls under the palette's
      // own rect, and elementFromPoint proves the palette wins the hit,
      // eating clicks — a Trigger near that edge had an unclickable Delete.
      // Same interactiveOnly:true rule as the panel (only yields over a
      // buried BUTTON/input, never just because a plain card body is back
      // there — the palette's own rows must stay fully live everywhere
      // else).
      { selector: '.cw-palette', cls: 'cw-palette-yield', interactiveOnly: true },
    ]
    let ghosted = null // { el, cls } of the surface currently yielding
    let surfaceDrag = false

    const restore = () => {
      if (!ghosted) return
      ghosted.el.classList.remove(ghosted.cls)
      ghosted = null
    }

    const surfaceAt = (event) => {
      if (ghosted) {
        const spec = SURFACES.find((sp) => ghosted.el.matches(sp.selector))
        return { el: ghosted.el, spec }
      }
      for (const spec of SURFACES) {
        const el = event.target.closest?.(spec.selector)
        if (el) return { el, spec }
      }
      return null
    }

    const onPointerDown = (event) => {
      if (SURFACES.some((sp) => event.target.closest?.(sp.selector))) surfaceDrag = true
    }
    const onPointerUp = () => {
      surfaceDrag = false
    }

    const onPointerMove = (event) => {
      if (surfaceDrag) return
      // A ghosted surface no longer receives events, so it can't be
      // re-derived from event.target while yielding — hold it until the
      // cursor leaves its rect. A swapKey remount detaches a held surface;
      // its rect reads 0x0 and the width guard below releases it.
      const hit = surfaceAt(event)
      if (!hit || !hit.spec) {
        restore()
        return
      }
      const { el, spec } = hit
      const rect = el.getBoundingClientRect()
      const inside =
        rect.width > 0 &&
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom
      if (!inside) {
        restore()
        return
      }
      // Skip the surface's descendants AND its ancestors: elementsFromPoint
      // lists a surface's wrapper chain right after the surface itself, so a
      // find() that only excluded descendants stopped on a meaningless
      // ancestor div and never reached the genuinely-buried element (the
      // palette hit this — its wrapper sits between it and the toolbar in
      // the stack; the panel's flatter ancestry just got lucky).
      const beneath = document
        .elementsFromPoint(event.clientX, event.clientY)
        .find((n) => !el.contains(n) && !n.contains(el))
      // Node toolbars render OUTSIDE .react-flow__viewport (RF puts them in
      // their own panel layer) — the final QA verifier proved a buried
      // toolbar under the palette never triggered the yield because this
      // test only looked for viewport content (F8 root cause). Toolbars
      // count as real content too.
      const content = beneath?.closest?.('.react-flow__viewport, .react-flow__node-toolbar')
      const overContent = spec.interactiveOnly
        ? Boolean(content && beneath.closest('button, [role="button"], input, textarea, select, .react-flow__handle'))
        : Boolean(content)
      if (overContent && !ghosted) {
        ghosted = { el, cls: spec.cls }
        el.classList.add(spec.cls)
      } else if (!overContent) {
        restore()
      }
    }

    const onPointerLeave = () => restore()

    root.addEventListener('pointerdown', onPointerDown)
    root.addEventListener('pointermove', onPointerMove)
    root.addEventListener('pointerleave', onPointerLeave)
    // pointerup on window, not root — a minimap pan keeps dragging (d3-zoom
    // listens on the window) even after the cursor exits the canvas.
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerUp)
    return () => {
      restore()
      root.removeEventListener('pointerdown', onPointerDown)
      root.removeEventListener('pointermove', onPointerMove)
      root.removeEventListener('pointerleave', onPointerLeave)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', onPointerUp)
    }
  }, [])

  // ---- ON-CANVAS SEARCH ---------------------------------------------------
  // A floating find bar (JSX + styles/search.css, both below/this file only)
  // that filters the live graph LIVE as you type. "Current result" reuses
  // two mechanisms this file already had rather than inventing new ones:
  // focusIssue (state.jsx, already destructured above) is the exact
  // select+glideTo pair the issues popover's jump-links already use —
  // glideTo there is state.jsx's own "the panel-aware glide" (its header
  // comment's own words, which is also PLAN.md's own phrase for this ask);
  // spawnRipple (MOTION PHASE item 3, above) is the existing accent
  // ring-bloom this file already reuses elsewhere for "draw the eye to a
  // node" (see the paused-beacon effect's note on reusing it at low
  // opacity). Neither state.jsx nor motion.css needed a single edit for
  // either half of "selected + glideTo + a one-shot ring pulse."
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  // -1 = no result visited yet for the CURRENT query. Typing alone only
  // narrows/dims (PLAN.md's own verify wording keeps these two separate:
  // "'budget' narrows, Enter walks hits with glides") — it never yanks the
  // camera on every keystroke; only Enter/the chevrons/arrow keys "walk".
  const [searchIndex, setSearchIndex] = useState(-1)
  // Bumped on every open request so the focus effect below re-fires even
  // when the bar was ALREADY open — ⌘F a second time just refocuses +
  // selects the existing query, same as a browser's own Find-again.
  const [searchFocusTick, setSearchFocusTick] = useState(0)
  const searchInputRef = useRef(null)

  const searchQueryNorm = searchQuery.trim().toLowerCase()

  const searchMatches = useMemo(() => {
    if (!searchQueryNorm) return []
    return nodes.filter((n) => searchHaystack(n).includes(searchQueryNorm)).map((n) => n.id)
  }, [nodes, searchQueryNorm])

  // An all-dimmed canvas reads as broken (PLAN.md Verify) — dimming only
  // switches on once there's BOTH a live query AND at least one hit; zero
  // matches instead flags the counter itself (is-warn, search.css) and
  // leaves every card at rest.
  const searchDimming = searchOpen && searchQueryNorm.length > 0 && searchMatches.length > 0
  const searchZeroResults = searchOpen && searchQueryNorm.length > 0 && searchMatches.length === 0

  const searchHitIds = useMemo(() => new Set(searchMatches), [searchMatches])

  // Decorated copy of `nodes`, for the <ReactFlow nodes={...}> prop only. A
  // per-node `className` is a plain @xyflow/react Node field (verified
  // against the installed package: NodeWrapper folds `node.className`
  // straight into the SAME div that already carries `react-flow__node`) —
  // that's how search.css's `.is-search-hit` rule reaches one specific card
  // without this seam touching nodes.css or any node component. Every OTHER
  // nodes.length/.map() read in this file below keeps using the plain
  // `nodes` from context.
  //
  // NODE TOOLBAR V2 — the SAME mechanism now also carries `cw-tint-<id>`
  // (item 2), `is-skipped` (item 4), and `is-collapsed` (item 3): nodes.css
  // needs a class on the `.react-flow__node` WRAPPER to reach the inner
  // `.cw-node` card's own background/visibility (this file's seam owns
  // FlowCanvas.jsx; nodes.css can't set a property on an ancestor it never
  // renders). `is-collapsed` specifically MUST be React-driven rather than
  // a DOM class shared.jsx's animateCollapse toggles by hand — CDP-found:
  // TaskNode/etc.'s own JSX recomputes `.cw-node`'s className every render
  // off `data`/`selected`, and any unrelated change to either (a different
  // node getting selected, say) makes React overwrite the WHOLE attribute,
  // silently discarding anything added outside its own render. Reading it
  // off `data.collapsed` here instead survives any re-render for free —
  // see shared.jsx's own comment on this exact bug for the full story.
  // `hasVisualFlags` short-circuits the whole `.map()` on the common case
  // (no search dimming, no tinted/skipped/collapsed/pinned node anywhere) —
  // same "bail out when nothing to do" this rule already followed before
  // any of these existed.
  //
  // CONTEXT & CLIPBOARD (item 2 — "Pin") joins the SAME mechanism: `is-
  // pinned` for nodes.css's PushPin badge (a `.cw-node` pseudo-element, same
  // wrapper-class precedent as tint/skip/collapse above — see this file's
  // header comment on why it has to live on the WRAPPER, not something
  // shared.jsx's own JSX could add), and a real per-node `draggable: false`
  // (an @xyflow/system NodeBase field, distinct from `className`) — "RF
  // gives draggable=false via wrapper" per spec. Only ever ADDED when
  // pinned, never explicitly set `true` otherwise: that would override the
  // GLOBAL `nodesDraggable={!commentMode}` prop below and silently
  // re-enable dragging during comment mode, which that prop exists
  // specifically to prevent.
  const hasVisualFlags = nodes.some((n) => n.data?.tint || n.data?.skipped || n.data?.collapsed || n.data?.pinned)
  const displayNodes = useMemo(() => {
    if (!searchDimming && !hasVisualFlags) return nodes
    return nodes.map((n) => {
      let className = n.className
      if (searchDimming && searchHitIds.has(n.id)) {
        className = className ? `${className} is-search-hit` : 'is-search-hit'
      }
      if (n.data?.tint && TINT_ID_SET.has(n.data.tint)) {
        className = className ? `${className} cw-tint-${n.data.tint}` : `cw-tint-${n.data.tint}`
      }
      if (n.data?.skipped) {
        className = className ? `${className} is-skipped` : 'is-skipped'
      }
      if (n.data?.collapsed) {
        className = className ? `${className} is-collapsed` : 'is-collapsed'
      }
      if (n.data?.pinned) {
        className = className ? `${className} is-pinned` : 'is-pinned'
      }
      const draggable = n.data?.pinned ? false : n.draggable
      return className !== n.className || draggable !== n.draggable ? { ...n, className, draggable } : n
    })
  }, [nodes, searchDimming, searchHitIds, hasVisualFlags])

  const visitSearchResult = useCallback(
    (nodeId) => {
      const node = nodes.find((n) => n.id === nodeId)
      if (!node) return
      focusIssue(nodeId) // select + the panel-aware glide
      // VARIANT STUDIO — search can match a grid child (e.g. its fallback
      // type label); resolveNodeBox keeps the ripple honest either way.
      const box = resolveNodeBox(node, new Map(nodes.map((n) => [n.id, n])))
      spawnRipple(box.x, box.y, box.w, box.h) // one-shot ring pulse — reuses the existing bloom
    },
    [nodes, focusIssue, spawnRipple],
  )

  const searchGoToNext = useCallback(() => {
    if (!searchMatches.length) return
    const next = searchIndex < 0 ? 0 : (searchIndex + 1) % searchMatches.length
    setSearchIndex(next)
    visitSearchResult(searchMatches[next])
  }, [searchMatches, searchIndex, visitSearchResult])

  const searchGoToPrev = useCallback(() => {
    if (!searchMatches.length) return
    const prev = searchIndex < 0 ? searchMatches.length - 1 : (searchIndex - 1 + searchMatches.length) % searchMatches.length
    setSearchIndex(prev)
    visitSearchResult(searchMatches[prev])
  }, [searchMatches, searchIndex, visitSearchResult])

  // A fresh query always starts unvisited — see searchIndex's own comment.
  useEffect(() => {
    setSearchIndex(-1)
  }, [searchQueryNorm])

  const openSearch = useCallback(() => {
    setSearchOpen(true)
    setSearchFocusTick((t) => t + 1)
  }, [])

  // "Esc closes ... keeps selection on the last-visited node" (PLAN.md) —
  // deliberately no setRawNodes call here; whichever node visitSearchResult
  // last selected just stays selected. Query/results are left alone too, so
  // reopening (⌘F or the rail button) picks the search back up where it
  // left off, same as a browser's own Find bar.
  const closeSearch = useCallback(() => {
    setSearchOpen(false)
  }, [])

  useEffect(() => {
    if (!searchOpen) return
    const el = searchInputRef.current
    if (!el) return
    el.focus()
    el.select()
  }, [searchOpen, searchFocusTick])

  // F6 (QA FINDINGS LEDGER) — search used to run its OWN capture-phase Esc
  // listener here, separate from the COMMENTS PHASE one further down. Two
  // independent `document`-level capture listeners both call
  // `stopPropagation` (which only blocks the event reaching OTHER elements,
  // never sibling listeners already registered on this SAME element) — so
  // with search open AND any comment-layer state active, one Esc press fired
  // BOTH handlers and collapsed two precedence levels at once. Search's own
  // Esc handling now lives inside that single merged handler (below,
  // "draft > thread > comment-mode > search > builder-close"), so exactly
  // one `document` listener ever contests an Escape keypress for this whole
  // matrix, not two racing each other.

  // Enter/↓/↑ only ever reach here — the global keydown effect below skips
  // every field it finds isTypingTarget on (this input included), the same
  // guard that already keeps 't'/'v'/'c' from firing while someone's
  // mid-query.
  const onSearchInputKeyDown = useCallback(
    (event) => {
      if (event.key === 'Enter') {
        event.preventDefault()
        if (event.shiftKey) searchGoToPrev()
        else searchGoToNext()
      } else if (event.key === 'ArrowDown') {
        event.preventDefault()
        searchGoToNext()
      } else if (event.key === 'ArrowUp') {
        event.preventDefault()
        searchGoToPrev()
      }
    },
    [searchGoToNext, searchGoToPrev],
  )

  const onDragOver = useCallback((event) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event) => {
      event.preventDefault()
      // TEMPLATES PHASE (TP1) — template rows (TemplateList.jsx) set a
      // SEPARATE mime (`application/reactflow-template` = the template id)
      // rather than reusing `application/reactflow`, so this branches first
      // and returns; the plain-block path below is completely untouched.
      // insertTemplate (state.jsx) fires its own cw:ripple at the drop
      // point, so this path doesn't call the local spawnRipple itself.
      const templateId = event.dataTransfer.getData('application/reactflow-template')
      if (templateId) {
        const dropPos = screenToFlowPosition({ x: event.clientX, y: event.clientY })
        insertTemplate(templateId, dropPos)
        return
      }
      const raw =
        event.dataTransfer.getData('application/reactflow') || event.dataTransfer.getData('text/plain')
      if (!raw) return
      let item
      try {
        item = JSON.parse(raw)
      } catch {
        return
      }
      // The payload is a JSON lookalike (no makeData) — swap in the live
      // palette entry before handing it on.
      const live = paletteItemById(item.id) || item
      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY })
      addNodeFromPalette(live, position)
      const box = cardSize(live.nodeType)
      spawnRipple(position.x, position.y, box.w, box.h)
    },
    [screenToFlowPosition, addNodeFromPalette, insertTemplate, spawnRipple],
  )

  // MOTION PHASE item 3 — third ripple source. `event` is the pointer event
  // RF hands onNodeDragStop; converting its screen position (rather than
  // using the settled node's own position) keeps all three ripple sources
  // anchored at the same kind of point — "where the cursor actually was".
  const onNodeDragStop = useCallback(
    (event, node) => {
      if (typeof event?.clientX !== 'number' || typeof event?.clientY !== 'number') return
      if (node?.measured?.width) {
        spawnRipple(node.position.x, node.position.y, node.measured.width, node.measured.height)
      } else {
        const p = screenToFlowPosition({ x: event.clientX, y: event.clientY })
        spawnRipple(p.x, p.y)
      }
      // Landing bounce — a transient class fires the cw-land squash keyframes
      // (nodes.css). Class-on-DOM rather than state: the node's card is RF's
      // DOM, one-shot, and self-cleans on animationend.
      if (node?.id) {
        const card = document.querySelector(`#workflow-root .react-flow__node[data-id="${node.id}"] .cw-node`)
        if (card) {
          card.classList.remove('cw-landed')
          void card.offsetWidth
          card.classList.add('cw-landed')
          card.addEventListener('animationend', function onEnd(e) {
            if (e.animationName === 'cw-land') {
              card.classList.remove('cw-landed')
              card.removeEventListener('animationend', onEnd)
            }
          })
        }
      }
    },
    [screenToFlowPosition, spawnRipple],
  )

  // ---- COMFY ROUND (CP1 — "TYPED COLOR PORTS", PLAN.md "## COMFY ROUND" ->
  // "### CP1") — invalid-drop rejection feedback -----------------------------
  // RF calls onConnectEnd once every connection drag releases, whether it
  // landed on a real handle or empty canvas (verified against the installed
  // @xyflow/system build: onPointerUp always fires it, not just on success).
  // `connectionState.toHandle` is only populated when the pointer actually
  // let go over a handle's DOM node; `isValid` is exactly what got fed to
  // isValidConnection above (already wired onto <ReactFlow>, from B's
  // state.jsx) for THIS attempt — this never re-derives that logic, it only
  // reacts to the verdict. A release over empty canvas (no toHandle) or a
  // connection that actually landed (isValid) has nothing to punish.
  //
  // WAAPI (`handleEl.animate`), not a CSS class — this started as this
  // file's own onNodeDragStop landing-bounce trick (add class, force
  // reflow, self-clear on animationend) and was CDP-verified to lose a
  // real race: the exact store update that fires onConnectEnd also flips
  // every handle's connectingfrom/connectionindicator classes back to
  // idle, and React re-renders every one of them on that SAME pass —
  // stomping a class this effect had just added a moment earlier from
  // outside React (confirmed via a MutationObserver: the class landed, then
  // was gone again 2ms later, nowhere near the animation's real duration).
  // onNodeDragStop's version doesn't hit this because nothing else
  // re-renders THAT node right after a drag-stop; here, a re-render of this
  // exact element is the guaranteed next thing to happen. A WAAPI animation
  // lives outside class/style entirely, so it can't be clobbered that way.
  // CSS.escape guards the attribute selector the same way any user-authored
  // id would need it (this schema's own genId() ids are plain alnum-dash,
  // but a future node type is one edit away from breaking that assumption).
  //
  // COMFY ROUND (CP0+ — "PICKER V2" item 2, "the gesture", PLAN.md "## COMFY
  // ROUND" -> "### CP0+"). Bryan, on Comfy's drag-to-empty add-node search:
  // "i like this feature - what is this and do we have it?" This function
  // already told a REFUSED drop (released on an incompatible HANDLE, above)
  // from every other release; the empty-pane case used to be exactly that
  // "nothing to punish" no-op the header comment describes. It composes
  // rather than replaces: the shake branch below is byte-for-byte the
  // original logic, still gated on `toHandle` being set — only the NEW
  // `else` arm (a release with NO toHandle at all, i.e. bare canvas) is
  // added, opening the SAME BlockPicker the node ghosts and edge + use,
  // pre-filtered to whatever the dragged port can actually connect to.
  const onConnectEnd = useCallback(
    (event, connectionState) => {
      const { isValid, toHandle, fromHandle, fromNode } = connectionState || {}
      if (isValid) {
        // WIRE FEEL (PLAN.md "## WIRE FEEL" item 4) — AUTHORIZED additive
        // dispatch. onConnectEnd fires on a successful live-drag connect
        // too (this branch used to be a plain no-op for that case — the
        // actual edge mint happens elsewhere, via RF's onConnect, already
        // wired by M3/state.jsx); this is purely a signal so the freshly-
        // minted OmniEdge instance (edges/OmniEdge.jsx, cw:wire-connected
        // match) can play its own connect-settle morph/wobble. Matched by
        // (source, target, sourceHandle) — the SAME shape state.jsx's own
        // cw:surge already uses for exactly this reason. `fromHandle.type`
        // can be 'target' (RF allows starting a drag from an input handle
        // too — this app doesn't forbid it) — swap the pair in that case so
        // "source"/"target" in the event always names the real edge ends,
        // not just which end the pointer happened to leave from.
        if (toHandle?.nodeId && fromNode?.id) {
          const fromIsSource = fromHandle?.type !== 'target'
          const sourceId = fromIsSource ? fromNode.id : toHandle.nodeId
          const targetId = fromIsSource ? toHandle.nodeId : fromNode.id
          const sourceHandleId = (fromIsSource ? fromHandle?.id : toHandle?.id) || 'out'
          window.dispatchEvent(
            new CustomEvent('cw:wire-connected', { detail: { source: sourceId, target: targetId, sourceHandle: sourceHandleId } }),
          )
        }
        return
      }
      if (toHandle) {
        const handleEl = document.querySelector(
          `#workflow-root .react-flow__handle[data-nodeid="${CSS.escape(toHandle.nodeId)}"][data-handleid="${CSS.escape(toHandle.id)}"]`,
        )
        if (!handleEl) return
        // A fast double mis-drop on the same port re-triggers cleanly instead
        // of layering two animations — only this effect's own `id` is ever
        // cancelled, never some unrelated animation the element might be
        // mid-flight on.
        handleEl.getAnimations().forEach((a) => {
          if (a.id === 'cw-port-refuse') a.cancel()
        })
        const reduced = prefersReducedMotion()
        handleEl.animate(reduced ? PORT_REFUSE_STATIC_FRAMES : PORT_REFUSE_SHAKE_FRAMES, {
          id: 'cw-port-refuse',
          duration: PORT_REFUSE_MS,
          easing: reduced ? PORT_REFUSE_GLIDE : PORT_REFUSE_SPRING,
        })
        return
      }
      // Bare canvas. `fromHandle`/`fromNode` are populated by RF the instant
      // a drag actually starts (verified against the installed
      // @xyflow/system build: onConnectEnd only ever fires once
      // `connectionStarted` flipped true, which is also the moment these are
      // first set) — this guard is therefore just defensive, never the
      // common path out.
      if (!fromHandle || !fromNode) return
      // Touch has no clientX/clientY on some browsers' pointerup — same
      // carve-out onNodeDragStop above already uses; no picker rather than
      // one anchored at (0,0).
      if (typeof event?.clientX !== 'number' || typeof event?.clientY !== 'number') return
      // RUN PHASE guard, same spirit as isValidConnection's own runState
      // check (state.jsx) — an ordinary connect is already blocked mid-run;
      // this gesture mints a node + edge too, so it stays blocked rather
      // than opening a picker whose pick would just silently no-op.
      const runActive = nodes.some((n) => n.data?.runState === 'running' || n.data?.runState === 'queued' || n.data?.runState === 'paused')
      if (runActive) return
      const rect = { left: event.clientX, right: event.clientX, top: event.clientY, bottom: event.clientY, height: 0 }
      const flowPoint = screenToFlowPosition({ x: event.clientX, y: event.clientY })
      const fromHandleType = fromHandle.type // 'source' | 'target'
      const numbered = fromNode.data?.number
      const head = numbered ? String(numbered).padStart(2, '0') : nodeDisplayTitle(fromNode)
      // WIRE FEEL (PLAN.md "## WIRE FEEL" item 5, "the wire that waits") —
      // AUTHORIZED additive dispatch. edges/ConnectionLine.jsx's own
      // module-level listener freezes/dims the in-flight line at this
      // exact release point while the picker (opened by setPicker below)
      // is up; handlePickBlock's wire branch / this picker's onClose fire
      // the matching cw:wire-release on pick/dismiss.
      window.dispatchEvent(
        new CustomEvent('cw:wire-hold', {
          detail: { fromNodeId: fromNode.id, fromHandleId: fromHandle.id || 'out', fromHandleType, clientX: event.clientX, clientY: event.clientY },
        }),
      )
      setPicker({
        kind: 'wire',
        rect,
        // Continues the flow's own reading direction: dragged from an
        // out-port -> the new block sits downstream, popover opens
        // rightward (same 'right' a node's own right ghost uses); dragged
        // from an in-port -> upstream, opens leftward.
        side: fromHandleType === 'source' ? 'right' : 'left',
        fromNodeId: fromNode.id,
        fromHandleId: fromHandle.id || 'out',
        fromHandleType,
        flowX: flowPoint.x,
        flowY: flowPoint.y,
        fromLabel: `FROM ${head} · ${friendlyHandleLabel(fromNode, fromHandle.id)}`,
      })
    },
    [nodes, screenToFlowPosition],
  )

  // ---- RUN PHASE (R4 item 3) — cmd/ctrl+Z undo, shift+cmd/ctrl+Z redo ----
  // Scoped to this component's own mounted lifetime — FlowCanvas only ever
  // mounts while the overlay is open (see App.jsx's useOverlayOpen), so this
  // listener can never fire while the builder itself is closed. Skipped
  // while the event target is a text field so it never steals a native
  // input/textarea/select's own undo.
  useEffect(() => {
    const isTypingTarget = (el) => {
      if (!el) return false
      const tag = el.tagName
      return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable
    }
    const onKeyDown = (event) => {
      if (isTypingTarget(event.target)) return

      // +/- zoom (Bryan). Accepts the unshifted keys too ('=' is the same
      // physical key as '+', '_' the same as '-') and the numpad variants, so
      // it works without reaching for shift. Duration matches ZoomReadout's
      // click-to-100% so every programmatic zoom in the app eases the same.
      //
      // SUBGRAPHS — this whole no-modifier block (every bare-letter rail
      // hotkey, Pin/Skip, and the new Enter-to-enter-steps below) is
      // skipped outright while the subview is open: its own chrome is
      // hidden behind the stage, so e.g. 'T' (Tidy up) would otherwise
      // silently rearrange the FROZEN outer canvas the user can't even
      // see. ⌘Z/⇧⌘Z stay live either way (falls through to the bottom of
      // this handler, past this whole block) — "⌘Z inside the subview
      // works against main history" (PLAN.md).
      if (!subgraph && !event.metaKey && !event.ctrlKey && !event.altKey) {
        if (event.key === '+' || event.key === '=' || event.code === 'NumpadAdd') {
          event.preventDefault()
          zoomTo(nextZoomStep(getZoom(), 1), { duration: 220 })
          return
        }
        if (event.key === '-' || event.key === '_' || event.code === 'NumpadSubtract') {
          event.preventDefault()
          zoomTo(nextZoomStep(getZoom(), -1), { duration: 220 })
          return
        }
        // COMMENTS PHASE — "Also the C key" (PLAN.md), toggling comment mode
        // both ways like the rail button does.
        if (event.key.toLowerCase() === 'c') {
          event.preventDefault()
          setCommentMode((v) => !v)
          return
        }
        // Every rail tool now answers to a key (Bryan: "show hot keys for all
        // of these") — the tooltips print these, so the two have to stay in
        // step. The zoom pair follows Figma's ⇧0 / ⇧1; `event.code` rather
        // than `event.key` because shift rewrites the digits to ) and ! on a
        // US layout (and to other glyphs elsewhere), while the physical key
        // is stable.
        if (event.shiftKey && event.code === 'Digit0') {
          event.preventDefault()
          zoomTo(1, { duration: 250 })
          return
        }
        if (event.shiftKey && event.code === 'Digit1') {
          event.preventDefault()
          fitView({ duration: 420, padding: 0.18 })
          return
        }
        if (!event.shiftKey && event.key.toLowerCase() === 't') {
          event.preventDefault()
          tidyUp()
          return
        }
        if (!event.shiftKey && event.key.toLowerCase() === 'v') {
          event.preventDefault()
          setSelectMode((v) => !v)
          return
        }
        // FOCUS MODE — F toggles; Escape leaves it (handled in the Escape
        // precedence chain so it never competes with a draft/menu/search).
        if (!event.shiftKey && event.key.toLowerCase() === 'f') {
          event.preventDefault()
          setFocusMode((v) => !v)
          return
        }
        // + RAIL VIEW TOGGLES — M (minimap) / W (hide wires), same
        // isTypingTarget guard as every other bare-letter hotkey above.
        if (!event.shiftKey && event.key.toLowerCase() === 'm') {
          event.preventDefault()
          setMinimapVisible((v) => !v)
          return
        }
        if (!event.shiftKey && event.key.toLowerCase() === 'w') {
          event.preventDefault()
          setWiresHidden((v) => !v)
          return
        }
        // CONTEXT & CLIPBOARD (item 2 — "Pin", item 3 — "Skip hotkey S").
        // Both act on the single currently-selected node — the same "exactly
        // one node selected" condition RF's own NodeToolbar already uses to
        // decide whether ITS Pin/Skip buttons are even on screen, so the
        // hotkey and the toolbar can never disagree about which node "the
        // current one" means. No-op with 0 or 2+ selected (ambiguous, or
        // nothing to act on) rather than guessing.
        if (!event.shiftKey && event.key.toLowerCase() === 'p') {
          event.preventDefault()
          const sel = nodes.filter((n) => n.selected)
          if (sel.length === 1 && sel[0].type !== 'variantgroup' && sel[0].type !== 'variant') {
            setNodePinned(sel[0].id, !sel[0].data?.pinned)
          }
          return
        }
        if (!event.shiftKey && event.key.toLowerCase() === 's') {
          event.preventDefault()
          const sel = nodes.filter((n) => n.selected)
          if (sel.length === 1 && !SKIP_HIDDEN_TYPES.has(sel[0].type) && !isSkipDisabled(sel[0].type, sel[0].data)) {
            patchNodeData(sel[0].id, { skipped: !sel[0].data?.skipped })
          }
          return
        }
        // SUBGRAPHS — "hotkey Enter on a selected task (isTypingTarget-
        // guarded)" (PLAN.md "### Enter / surface"). Same "exactly one
        // node selected" gate Pin/Skip just above already use, further
        // narrowed to task (the only type steps live on); dispatches the
        // SAME cw:enter-steps event the chip/menu-row use, so there is
        // exactly one seed+open code path regardless of entry point.
        if (event.key === 'Enter') {
          const sel = nodes.filter((n) => n.selected)
          if (sel.length === 1 && sel[0].type === 'task') {
            event.preventDefault()
            window.dispatchEvent(new CustomEvent('cw:enter-steps', { detail: { taskId: sel[0].id } }))
          }
          return
        }
      }

      // CONTEXT & CLIPBOARD (item 1 — "Copy / Paste / Duplicate hotkeys").
      // Real ⌘C/⌘V/⌘D — outside the no-modifiers block above (these NEED
      // metaKey/ctrlKey) but still gated by the SAME isTypingTarget return at
      // the top of this handler, exactly like ⌘F/⌘Z. Copy/Duplicate act on
      // the current selection (any size); Paste always pastes whatever's in
      // the clipboard regardless of what's currently selected.
      //
      // SUBGRAPHS — ⌘C/⌘V/⌘D/⌘F all act on (or open something over) the
      // OUTER canvas, which is frozen and hidden behind the stage while a
      // subview is open — wrapped in its OWN `!subgraph` block (rather than
      // an early `return`) since ⌘Z/⇧⌘Z below MUST stay reachable either
      // way: "⌘Z inside the subview works against main history" (PLAN.md).
      if (!subgraph) {
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'c') {
          event.preventDefault()
          const ids = nodes.filter((n) => n.selected).map((n) => n.id)
          if (ids.length) copyNodes(ids)
          return
        }
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'v') {
          event.preventDefault()
          pasteClipboard()
          return
        }
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'd') {
          event.preventDefault()
          const ids = nodes.filter((n) => n.selected).map((n) => n.id)
          if (ids.length) duplicateNodes(ids)
          return
        }

        // ON-CANVAS SEARCH — real ⌘F/Ctrl+F opens (or refocuses) the find
        // bar; preventDefault kills the browser's own Find dialog outright
        // instead of racing it. Outside the no-modifiers block above (this
        // one NEEDS metaKey/ctrlKey), but still gated by the SAME
        // isTypingTarget return at the top of this handler — "NOT while
        // typing in a field" (PLAN.md), the identical carve-out cmd/ctrl+Z
        // below already gets.
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'f') {
          event.preventDefault()
          openSearch()
          return
        }
      }

      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 'z') return
      event.preventDefault()
      if (event.shiftKey) redo()
      else undo()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [
    undo,
    redo,
    zoomTo,
    getZoom,
    fitView,
    tidyUp,
    setCommentMode,
    openSearch,
    nodes,
    copyNodes,
    pasteClipboard,
    duplicateNodes,
    setNodePinned,
    patchNodeData,
    subgraph,
  ])

  // ---- Esc precedence matrix (COMMENTS PHASE + F6 fix, QA FINDINGS
  // LEDGER) — draft > thread > comment-mode > search > builder-close
  // (PLAN.md: "Esc cancels [the composer] ... Esc with no composer open
  // exits comment mode"; the open-thread-card case isn't named explicitly
  // but falls out of the same "Esc is the universal cancel" logic; search
  // folded in here per F6 — see the removed effect's comment just above for
  // the bug this replaced). ONE `document` capture-phase listener for the
  // whole matrix — not one per level — is what makes "one Esc, one level"
  // structural rather than a convention two separate effects could each
  // forget: every keypress runs exactly one `if`/`else if` chain and acts on
  // the FIRST level that's actually active, so nothing downstream (search,
  // then the shell's own bubble-phase "Escape closes the builder" listener
  // in index.html) can ever also fire in the same pass. Registered only
  // while there's something in the matrix for Escape to do; `capture: true`
  // still runs this before that bubble-phase shell listener (capture always
  // precedes bubble for the same node), and `stopPropagation` still keeps
  // "cancel my draft" from also dumping the user out of the editor — same
  // protection as before, now guaranteed single-fire by construction.
  useEffect(() => {
    // SUBGRAPHS — same reasoning as before: comment mode's and search's own
    // chrome are both hidden behind the stage while it's open (comment
    // mode's rail toggle lives in the outer rail, which is covered; the
    // search bar is behind the stage's own opaque surface), so this stays
    // fully unregistered rather than racing SubgraphStage's own Esc
    // handling.
    if ((!commentMode && !activeCommentId && !draftPin && !searchOpen && !focusMode) || subgraph) return undefined
    const onEscapeCapture = (event) => {
      if (event.key !== 'Escape') return
      event.stopPropagation()
      if (draftPin) {
        setDraftPin(null)
        return
      }
      if (activeCommentId) {
        setActiveCommentId(null)
        return
      }
      if (commentMode) {
        setCommentMode(false)
        return
      }
      if (searchOpen) {
        closeSearch()
        return
      }
      // FOCUS MODE sits LAST in the chain — one Escape only leaves focus
      // once nothing else has a claim on it, so hiding the panels never
      // makes Escape stop cancelling the thing you're actually in.
      setFocusMode(false)
    }
    document.addEventListener('keydown', onEscapeCapture, true)
    return () => document.removeEventListener('keydown', onEscapeCapture, true)
  }, [commentMode, activeCommentId, draftPin, searchOpen, focusMode, setActiveCommentId, setCommentMode, closeSearch, subgraph])

  // ---- RUN PHASE (R4 item 6) — delete-middle-node heal --------------------
  // React Flow's own "Delete Middle Node" example, adapted for this schema's
  // named handles: reads (source, sourceHandle) off each surviving INCOMING
  // edge and (target, targetHandle) off each surviving OUTGOING edge, rather
  // than the stock example's node-only getIncomers/getOutgoers, so a bridge
  // across e.g. a deleted task preserves whatever handle its neighbors were
  // actually using (matters once branch/option handles are involved).
  // React Flow's own deleteElements already strips every edge connected to
  // the deleted node(s) via its own onEdgesChange('remove', ...) pass before
  // this callback ever runs (verified against the installed package), so
  // this only ever ADDS bridge edges — it never needs to remove anything.
  const onNodesDelete = useCallback(
    (deletedNodes) => {
      // NODE BOOM PHASE — same entry point the delete-middle-node heal below
      // already uses (toolbar trash + keyboard both route through RF's own
      // deleteElements into this one prop); capped/staggered per PLAN.md
      // "Multi-delete" — see spawnBoom above for what each one actually
      // spawns.
      deletedNodes.slice(0, BOOM_MAX).forEach((node, i) => spawnBoom(node, i))

      const deletedIds = new Set(deletedNodes.map((n) => n.id))
      const seen = new Set()
      const bridges = []

      for (const node of deletedNodes) {
        // Multiple-choice human nodes fan out over named opt-<id> handles —
        // which option would even map to which surviving outgoer is
        // ambiguous, so skip bridging entirely (PLAN.md "Skip for humans
        // with option handles"); the connected edges still get removed
        // normally, just with no replacement bridge.
        if (node.type === 'human' && node.data?.responseType === 'choice') continue

        const connected = getConnectedEdges([node], edges)
        const incoming = connected.filter((e) => e.target === node.id)
        const outgoing = connected.filter((e) => e.source === node.id)

        for (const inEdge of incoming) {
          // Both endpoints must survive this delete, or the bridge would
          // land on a node that's also disappearing (e.g. two adjacent
          // middle nodes removed in the same multi-select) — skip rather
          // than chase a chain of deletions.
          if (deletedIds.has(inEdge.source)) continue
          for (const outEdge of outgoing) {
            if (deletedIds.has(outEdge.target)) continue
            if (inEdge.source === outEdge.target) continue // no self-loops
            const key = `${inEdge.source}|${inEdge.sourceHandle ?? ''}|${outEdge.target}|${outEdge.targetHandle ?? ''}`
            if (seen.has(key)) continue
            seen.add(key)
            bridges.push({
              id: `bridge-${inEdge.source}-${outEdge.target}-${Math.random().toString(36).slice(2, 8)}`,
              source: inEdge.source,
              sourceHandle: inEdge.sourceHandle,
              target: outEdge.target,
              targetHandle: outEdge.targetHandle,
              type: 'omni',
            })
          }
        }
      }

      if (bridges.length) onEdgesChange(bridges.map((item) => ({ type: 'add', item })))
    },
    [edges, onEdgesChange, spawnBoom],
  )

  // ---- MOTION PHASE item 6 — issues pill enter/exit + count-pop ----------
  const issuesKey = issues.map((i) => i.id).join('|')
  const pillVisible = issues.length > 0 && dismissedKey !== issuesKey

  const [pillMounted, setPillMounted] = useState(pillVisible)
  const [pillClosing, setPillClosing] = useState(false)
  const pillMountedRef = useRef(pillVisible)
  const pillCloseTimerRef = useRef(null)

  useEffect(() => {
    if (pillVisible) {
      clearTimeout(pillCloseTimerRef.current)
      pillMountedRef.current = true
      setPillClosing(false)
      setPillMounted(true)
    } else if (pillMountedRef.current) {
      setPillClosing(true)
      pillCloseTimerRef.current = setTimeout(() => {
        pillMountedRef.current = false
        setPillMounted(false)
        setPillClosing(false)
      }, 240) // matches app.css's cw-pill-out duration (--cw-d-2)
    }
  }, [pillVisible])

  useEffect(() => () => clearTimeout(pillCloseTimerRef.current), [])

  // While closing, `issues` may already read empty/changed — freeze the
  // last-shown content during the exit animation instead of flashing it to
  // the new (about-to-be-unmounted) value. Mutating a ref during render is
  // safe here: it never triggers a re-render itself, just mirrors the value
  // renders need going forward.
  const lastIssuesRef = useRef(issues)
  if (pillVisible) lastIssuesRef.current = issues
  const displayedIssues = pillVisible ? issues : lastIssuesRef.current

  return (
    <div className="cw-canvas-wrap" ref={wrapRef}>
      {/* MOTION PHASE item 5 — keying on swapKey forces a full remount on
          Load-from-instructions/Clear (state.jsx bumps it there only), so
          every node/edge mounts fresh and its entrance animation plays even
          though the sample graphs reuse stable ids across each other. */}
      {/* Key is namespaced — InstructionsCard below also keys on swapKey, and
          two SIBLINGS sharing a key value scrambles React's reconciliation
          (old stages get retained, stacking a whole extra ReactFlow per
          graph swap — three canvases after two tab switches). */}
      <div
        className={`cw-flow-stage${selectMode ? ' cw-select-mode' : ''}${commentMode ? ' cw-comment-mode' : ''}${searchDimming ? ' cw-search-dim' : ''}${wiresHidden ? ' cw-wires-hidden' : ''}`}
        key={`stage-${swapKey}`}
      >
        <ReactFlow
          nodes={displayNodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onReconnect={onReconnect}
          onConnectEnd={onConnectEnd}
          onNodesDelete={onNodesDelete}
          onNodeDoubleClick={onNodeDoubleClick}
          isValidConnection={isValidConnection}
          defaultEdgeOptions={{ type: 'omni' }}
          connectionLineType="smoothstep"
          // WIRE FEEL (PLAN.md "## WIRE FEEL") — AUTHORIZED additive prop
          // (connectionLineType above is left in place, harmless once a
          // custom component is set, rather than removed — pure addition).
          connectionLineComponent={ConnectionLine}
          onDragOver={onDragOver}
          onDrop={onDrop}
          onNodeDragStop={onNodeDragStop}
          onPaneClick={onPaneClick}
          // CONTEXT & CLIPBOARD (item 4) — the three (plus RF's own
          // selection-box variant) right-click surfaces.
          onNodeContextMenu={onNodeContextMenu}
          onSelectionContextMenu={onSelectionContextMenu}
          onEdgeContextMenu={onEdgeContextMenu}
          onPaneContextMenu={onPaneContextMenu}
          defaultViewport={{ x: 60, y: 40, zoom: 1 }}
          selectionOnDrag={selectMode}
          panOnDrag={selectMode ? [1, 2] : true}
          /* E2E sweep (Journey B FAIL 2): the app's stepped-zoom ladder goes
             to ZOOM_MIN 0.25, but React Flow's own default minZoom is 0.5 —
             without these props the library silently clamped every zoomTo at
             50%. Both bounds stated so the pair can never half-drift again. */
          minZoom={ZOOM_MIN}
          maxZoom={ZOOM_MAX}
          selectionMode="partial"
          multiSelectionKeyCode={['Meta', 'Control']}
          proOptions={{ hideAttribution: true }}
          // SUBGRAPHS — while the subview is open, this outer instance is
          // frozen (covered, unreachable to the pointer) but React Flow's
          // OWN deleteKeyCode listener is a document-level keydown handler
          // that doesn't know that — a bare Backspace pressed while editing
          // a step's title (a DIFFERENT ReactFlow instance entirely) would
          // otherwise still delete whatever remains selected out here, e.g.
          // the very task the user is inside. `null` disables it outright
          // for exactly as long as the stage is up.
          deleteKeyCode={subgraph ? null : ['Backspace', 'Delete']}
          snapToGrid={false}
          snapGrid={SNAP_GRID}
          // COMMENTS PHASE — "nodes are not draggable or selectable ... so a
          // click can't grab a card; panning still works" (PLAN.md). Neither
          // prop touches panOnDrag above, so panning is unaffected.
          nodesDraggable={!commentMode}
          elementsSelectable={!commentMode}
        >
          {/* No `color` prop (THEMES PHASE): --xy-background-pattern-color in
              flow.css already routes to var(--cw-canvas-dot), so the dot grid
              follows the shell theme instead of being pinned here in JS. */}
          {/* Bryan (2026-08-11): tighter dot matrix, with PLUS marks as the
              landmark layer — fine dots every 14px, a cross at every 8th
              intersection (112 = 14 x 8 keeps the two grids registered). */}
          <Background variant={BackgroundVariant.Dots} gap={14} size={2} />
          {/* (The coarse plus/cross layer that used to sit over the fine grid
              was removed at Bryan's ask — one quiet dot matrix, nothing else.) */}
          {/* Inertial pan + eased zoom (Bryan). Renders nothing; must live
              INSIDE <ReactFlow> for useReactFlow/useStore to see this
              instance's own store. */}
          <ViewportGlide />
          <Controls position="top-left" showZoom={false} showInteractive={false} showFitView={false}>
            <ZoomReadout />
            {/* ON-CANVAS SEARCH — top of the rail, between the readout and
                the zoom pair. Inline `order:-4` TIES it with ZoomReadout's
                own flow.css `order:-4` rule; flex resolves order ties by
                source order (same trick this file's own snap-toggle comment
                already documents), and this button renders right after
                ZoomReadout in JSX, so the tie lands it exactly between the
                readout and zoom-in — no flow.css edit, which is outside
                this seam's file grant. Toggles like its select/comment
                siblings; ⌘F (below) only ever opens/refocuses, never closes
                — Esc and the bar's own × own that job. */}
            <ControlButton
              className="cw-search-btn cw-rail-tip"
              style={{ order: -4 }}
              onClick={() => (searchOpen ? closeSearch() : openSearch())}
              aria-label="Find on canvas"
              aria-pressed={searchOpen}
            >
              <RailTip label="Find on canvas" hotkey="⌘F" />
              <MagnifyingGlass size={13} weight="regular" />
            </ControlButton>
            {/* Own zoom pair (RF's built-ins are hidden via showZoom) so both
                the buttons and the +/- keys share one stepped ladder. */}
            <ControlButton
              className="react-flow__controls-zoomin cw-rail-tip"
              onClick={() => zoomTo(nextZoomStep(getZoom(), 1), { duration: 220 })}
              aria-label="Zoom in"
            >
              <RailTip label="Zoom in" hotkey="+" />
              <Plus size={13} weight="bold" />
            </ControlButton>
            <ControlButton
              className="react-flow__controls-zoomout cw-rail-tip"
              onClick={() => zoomTo(nextZoomStep(getZoom(), -1), { duration: 220 })}
              aria-label="Zoom out"
            >
              <RailTip label="Zoom out" hotkey="−" />
              <Minus size={13} weight="bold" />
            </ControlButton>
            {/* Our own fit button instead of RF's built-in (showFitView={false}):
                the built-in ships a hardcoded `title`, and a native tooltip
                would race the styled one below. Same class, so it keeps its
                place in the rail order. */}
            <ControlButton
              className="react-flow__controls-fitview cw-rail-tip"
              onClick={() => fitView({ duration: 420, padding: 0.18 })}
              aria-label="Fit view"
            >
              <RailTip label="Fit the whole flow on screen" hotkey="⇧1" />
              <CornersOut size={13} weight="regular" />
            </ControlButton>
            {/* Tidy up moved out of the title dropdown (Bryan) — it's a canvas
                action, so it belongs with the canvas tools, not in a menu. */}
            <ControlButton
              className="cw-tidy-btn cw-rail-tip"
              onClick={() => tidyUp()}
              aria-label="Tidy up the layout"
            >
              <RailTip label="Tidy up — auto-arrange the blocks" hotkey="T" />
              <MagicWand size={13} weight="regular" />
            </ControlButton>
            {/* RUN PHASE (R4 item 4) — snap-to-grid toggle, default OFF.
                Inline `order:-1` ties it with ZoomReadout's own flow.css
                `order:-1` rule so it renders directly under the readout
                (flex `order` ties resolve by source order) without needing
                a flow.css edit, which is outside this seam's file grant. */}
            <ControlButton
              className="cw-snap-toggle cw-select-toggle cw-rail-tip"
              style={{ color: selectMode ? 'var(--cw-accent)' : undefined }}
              onClick={() => setSelectMode((v) => !v)}
              aria-label="Toggle marquee select tool"
              aria-pressed={selectMode}
            >
              <RailTip
                label={selectMode ? 'Select tool on — drag to select blocks' : 'Select tool — drag to select several blocks'}
                hotkey="V"
              />
              <Selection size={13} weight={selectMode ? 'fill' : 'regular'} />
            </ControlButton>
            {/* COMMENTS PHASE — bottom of the rail (order 2: the zoom pair /
                fit / tidy / select group above tops out at order 1). Active
                state tints var(--cw-accent) exactly like cw-select-toggle
                above, per PLAN.md. */}
            <ControlButton
              className="cw-comment-toggle cw-rail-tip"
              style={{ color: commentMode ? 'var(--cw-accent)' : undefined }}
              onClick={() => setCommentMode((v) => !v)}
              aria-label="Toggle comment mode"
              aria-pressed={commentMode}
            >
              <RailTip label="Comment — click anywhere to leave a note" hotkey="C" />
              <ChatTeardropDots size={13} weight={commentMode ? 'fill' : 'regular'} />
            </ControlButton>
            {/* + RAIL VIEW TOGGLES (PLAN.md, "Comfy's bottom-right pair") —
                a NEW bottom group. Order (3/4, after the comment toggle's 2)
                and the hairline separator above it live in flow.css's own
                explicit rail-order list, same convention every other button
                here already follows — the rail's bottom-corner rounding
                moves with whichever of these two is now last
                (cw-wires-toggle; flow.css). */}
            <ControlButton
              className="cw-minimap-toggle cw-rail-tip"
              onClick={() => setMinimapVisible((v) => !v)}
              aria-label="Toggle minimap"
              aria-pressed={minimapVisible}
            >
              <RailTip label="Minimap" hotkey="M" />
              <MapTrifold size={13} weight={minimapVisible ? 'fill' : 'regular'} />
            </ControlButton>
            <ControlButton
              className="cw-wires-toggle cw-rail-tip"
              onClick={() => setWiresHidden((v) => !v)}
              aria-label="Hide wires"
              aria-pressed={wiresHidden}
            >
              <RailTip label="Hide wires" hotkey="W" />
              <LinkBreak size={13} weight={wiresHidden ? 'fill' : 'regular'} />
            </ControlButton>
            {/* History pair (Bryan: "lets add an undo button in here") — the
                same undo/redo the keyboard drives; always enabled, an
                empty-stack click is a quiet no-op (the stacks live in refs;
                a live disabled state isn't worth a render channel). */}
            <ControlButton
              className="cw-undo-btn cw-rail-tip"
              onClick={() => undo()}
              aria-label="Undo"
            >
              <RailTip label="Undo" hotkey="⌘Z" />
              <ArrowUUpLeft size={13} weight="regular" />
            </ControlButton>
            <ControlButton
              className="cw-redo-btn cw-rail-tip"
              onClick={() => redo()}
              aria-label="Redo"
            >
              <RailTip label="Redo" hotkey="⇧⌘Z" />
              <ArrowUUpRight size={13} weight="regular" />
            </ControlButton>
            {/* FOCUS MODE — the rail's own foot: everything but the canvas,
                this rail, and the Share/Run cluster steps out of the way. */}
            <ControlButton
              className="cw-focus-btn cw-rail-tip"
              style={{ color: focusMode ? 'var(--cw-accent)' : undefined }}
              onClick={() => setFocusMode((v) => !v)}
              aria-label="Toggle focus mode"
              aria-pressed={focusMode}
            >
              <RailTip label={focusMode ? 'Show the panels' : 'Focus — hide the panels'} hotkey="F" />
              <CornersIn size={13} weight={focusMode ? 'fill' : 'regular'} />
            </ControlButton>
          </Controls>
          {/* nodeBorderRadius: E3 item 2 — the one part of the minimap
              refinement that's a React prop, not a CSS var; the node-rect
              fill color is themed via --xy-minimap-node-background-color in
              flow.css. */}
          {/* RUN SHOW A3 — nodeColor tints running/paused/done during a run;
              see minimapNodeColor above for why this needs no getComputedStyle
              cache despite PLAN.md's warning that a naive per-node style read
              here would be "too hot". */}
          {/* + RAIL VIEW TOGGLES — stays mounted while hidden (flow.css's
              .cw-minimap-hidden fades+shrinks it, pointer-events:none), so
              the existing minimap-yield effect (below) never has to special-
              case "the panel doesn't exist right now": a pointer-events:none
              element can never become event.target/closest() for a real
              pointer event, which is the whole tolerance that effect needs. */}
          <MiniMap
            position="bottom-right"
            pannable
            zoomable
            nodeBorderRadius={2}
            nodeColor={minimapNodeColor}
            className={`${minimapVisible ? '' : 'cw-minimap-hidden'}${minimapFrosted ? ' cw-minimap-frosted' : ''}`}
          />

          <ViewportPortal>
            {ripples.map((r) => {
              // RUN SHOW A2 — the beacon variant is the SAME box-ripple,
              // just dimmed (motion.css); every other caller leaves
              // `variant` undefined and renders exactly as before.
              const variantClass = r.variant ? ` cw-ripple--${r.variant}` : ''
              return r.w && r.h ? (
                <div
                  key={r.id}
                  className={`cw-ripple cw-ripple--box${variantClass}`}
                  style={{
                    transform: `translate(${r.x}px, ${r.y}px)`,
                    '--cw-rw': `${r.w}px`,
                    '--cw-rh': `${r.h}px`,
                  }}
                />
              ) : (
                <div key={r.id} className={`cw-ripple${variantClass}`} style={{ transform: `translate(${r.x}px, ${r.y}px)` }} />
              )
            })}
            {/* NODE BOOM PHASE — silhouette + 12-shard burst at the deleted
                node's last footprint. Anchored at the node's CENTRE (unlike
                the box-ripple above, which anchors at its top-left corner)
                since the burst needs to radiate from the middle of the card
                — PLAN.md's own "Mechanism"/"The visual" sections. */}
            {booms.map((b) => (
              <div
                key={b.id}
                className="cw-boom"
                data-boom-id={b.id}
                style={{
                  transform: `translate(${b.cx}px, ${b.cy}px)`,
                  '--boom-w': `${b.w}px`,
                  '--boom-h': `${b.h}px`,
                }}
              >
                <div className="cw-boom-silhouette" style={{ animationDelay: `${b.delay}ms` }} />
                {BOOM_SHARDS.map((s, i) => (
                  <div
                    key={i}
                    className={`cw-boom-shard ${s.tint}`}
                    style={{
                      '--shard-dx': `${s.dx}px`,
                      '--shard-dy': `${s.dy}px`,
                      '--shard-rot': `${s.rot}deg`,
                      '--shard-size': `${s.size}px`,
                      animationDelay: `${b.delay + s.delay}ms`,
                    }}
                  />
                ))}
              </div>
            ))}
          </ViewportPortal>

          {/* COMMENTS PHASE — its own <ViewportPortal> (CommentsLayer.jsx);
              multiple ViewportPortal instances all portal into the same RF
              target div, so this is a clean sibling of the ripples one
              above, not a conflict. */}
          <CommentsLayer
            draftPin={draftPin}
            onDraftCancel={() => setDraftPin(null)}
            onDraftPosted={() => setDraftPin(null)}
            // DRAFT COMPOSER × (PLAN.md, Bryan) — unlike onDraftCancel/
            // onDraftPosted above (draft-only), this also flips commentMode
            // off; the rail toggle's aria-pressed, the .cw-comment-mode
            // class on cw-flow-stage (line ~769), and the pin cursor
            // (comments.css) all read that same piece of state, so clearing
            // it here is the whole fix — no extra DOM to touch.
            onDraftClose={() => {
              setDraftPin(null)
              setCommentMode(false)
            }}
          />
        </ReactFlow>
      </div>

      {/* ON-CANVAS SEARCH — floating find bar, top-center of the workspace
          band. A plain sibling of .cw-flow-stage (like InstructionsCard just
          below), NOT a <ViewportPortal> child, so it stays fixed over the
          canvas instead of panning/zooming with the graph. Horizontal
          centering (search.css) reuses InstructionsCard's own formula
          verbatim — clear of the palette because the wrap already starts
          past it, clear of the compiled panel by subtracting --cw-panel-w —
          rather than inventing a second version of the same math. */}
      {searchOpen ? (
        <div className="cw-search-bar" role="search">
          <MagnifyingGlass size={13} weight="regular" className="cw-search-bar-icon" aria-hidden="true" />
          <input
            ref={searchInputRef}
            type="text"
            className="cw-search-input"
            placeholder="Find on canvas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={onSearchInputKeyDown}
            aria-label="Find on canvas"
          />
          <span className={`cw-search-count${searchZeroResults ? ' is-warn' : ''}`}>
            {searchMatches.length ? Math.min(searchIndex + 1, searchMatches.length) : 0} of {searchMatches.length}
          </span>
          <div className="cw-search-nav">
            <button
              type="button"
              className="cw-search-nav-btn"
              onClick={searchGoToPrev}
              disabled={!searchMatches.length}
              aria-label="Previous match"
            >
              <CaretUp size={11} weight="bold" />
            </button>
            <button
              type="button"
              className="cw-search-nav-btn"
              onClick={searchGoToNext}
              disabled={!searchMatches.length}
              aria-label="Next match"
            >
              <CaretDown size={11} weight="bold" />
            </button>
          </div>
          {/* Drawn cross, not a text "×" glyph — the SAME CrossIcon the
              issues popover's dismiss button already reuses (see its own
              header comment above). */}
          <button type="button" className="cw-search-close" onClick={closeSearch} aria-label="Close find on canvas">
            <CrossIcon />
          </button>
        </div>
      ) : null}

      {/* CANVAS TABS PHASE item 4 — canvas-level, NOT inside <ReactFlow>'s
          <ViewportPortal>, so it never pans/zooms. Keyed on swapKey so tab
          switches (which bump it) always remount this fresh. */}
      <InstructionsCard key={`instructions-${swapKey}`} empty={nodes.length === 0} />

      {pillMounted ? (
        <div className={`cw-issues-wrap${pillClosing ? ' is-leaving' : ''}`}>
          {issuesOpen && displayedIssues.length > 0 ? (
            <div className="cw-issues-popover" role="dialog" aria-label="Workflow issues">
              <div className="cw-issues-popover-head">
                <span>
                  {displayedIssues.length} issue{displayedIssues.length === 1 ? '' : 's'}
                </span>
                <button
                  type="button"
                  className="cw-issues-autofix"
                  onClick={() => {
                    autoFixIssues()
                    setIssuesOpen(false)
                  }}
                >
                  <MagicWand size={12} weight="regular" />
                  Auto fix
                </button>
              </div>
              <div className="cw-issues-popover-list">
                {/* ISSUES POPOVER V2 (PLAN.md "### 4") — row anatomy rebuilt:
                    kind-colored mark, subject + hint copy column, per-row Fix.
                    The row itself can no longer be a <button> (it now wraps a
                    REAL nested <button> for Fix — buttons can't nest) — a div
                    with role="button" + keyboard handling instead, same
                    pattern Palette.jsx's own row already uses for the same
                    reason (draggable + click-to-add there; clickable + a
                    nested action here). */}
                {displayedIssues.map((issue) => (
                  <div
                    key={issue.id}
                    role="button"
                    tabIndex={0}
                    className="cw-issues-popover-row"
                    onClick={() => focusIssue(issue.nodeId)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        focusIssue(issue.nodeId)
                      }
                    }}
                    title="Show me"
                  >
                    {/* Bryan (2026-08-14): the kind-colored mark is gone and
                        the SUBJECT carries the issue color instead (red, the
                        pill's own danger token) — one signal, on the text
                        itself, instead of a dot competing with it. */}
                    <span className="cw-issues-popover-copy">
                      <span className="cw-issues-popover-subject">
                        {issue.subject}
                        {/* NODE TOOLBAR V2 — "skipped nodes' issues stay
                            listed but rows show a 'skipped' tag" (PLAN.md
                            item 4). Reuses app.css's existing outlined mono
                            badge verbatim (the header's own "mock" tag) —
                            zero new CSS for a small quiet label that already
                            has an established look in this file's chrome. */}
                        {issue.skipped ? <span className="cw-header-tag cw-issues-popover-skip-tag">Skipped</span> : null}
                      </span>
                      <span className="cw-issues-popover-hint">{issue.hint}</span>
                    </span>
                    <button
                      type="button"
                      className="cw-issues-popover-fix"
                      onClick={(e) => {
                        // Row click (focusIssue) must NOT also fire — Fix
                        // never jumps the canvas (PLAN.md Verify: "no jump on
                        // Fix — jump stays on row click only").
                        e.stopPropagation()
                        // CDP-found edge case: a disconnected node can have
                        // NO other node on the canvas to wire FROM (e.g. a
                        // lone Wait/Delay block on an otherwise empty
                        // canvas) — fixIssue no-ops and returns false rather
                        // than silently "fixing" nothing. Only close on a
                        // fix that actually landed AND was the last row —
                        // "popover closes itself when issues hit 0" (PLAN.md
                        // "### 4") means issues hit zero, not just "this was
                        // the last row before the click". Auto fix already
                        // closes unconditionally above (its own click
                        // handler, untouched by this).
                        const applied = fixIssue(issue.id)
                        if (applied && displayedIssues.length === 1) setIssuesOpen(false)
                      }}
                    >
                      Fix
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          <div className={`cw-issues-pill${issuesOpen ? ' is-open' : ''}`}>
            <button
              type="button"
              className="cw-issues-pill-main"
              aria-expanded={issuesOpen}
              onClick={() => setIssuesOpen((v) => !v)}
            >
              <span className="cw-issues-count" key={displayedIssues.length}>
                {displayedIssues.length} Issue{displayedIssues.length === 1 ? '' : 's'}
              </span>
            </button>
            <button
              type="button"
              className="cw-issues-dismiss"
              aria-label="Dismiss issues"
              onClick={() => {
                setIssuesOpen(false)
                setDismissedKey(issuesKey)
              }}
            >
              <CrossIcon />
            </button>
          </div>
        </div>
      ) : null}

      {/* GHOST + PICKER — portals itself to #workflow-root (see its own
          header comment for why), so its render position here is only about
          mounting it into the tree; the popover's actual screen placement
          comes entirely from `picker.rect` + `picker.side`. Keyed on
          pickerKeyOf (CP0+) so moving between two different openers always
          mounts a fresh instance — resets its own local search state instead
          of carrying a stale query/highlight over. `connectionFilter`/
          `fromLabel`/`autoFocusSearch` only ever have a real value on the
          'wire' variant; every other kind leaves them at their defaults. */}
      {picker ? (
        <BlockPicker
          key={pickerKeyOf(picker)}
          side={picker.side}
          rect={picker.rect}
          connectionFilter={picker.kind === 'wire' && picker.fromHandleType === 'target' ? 'feed' : null}
          fromLabel={picker.kind === 'wire' ? picker.fromLabel : null}
          autoFocusSearch={picker.kind === 'wire'}
          onPick={handlePickBlock}
          onClose={() => {
            // WIRE FEEL item 5 — AUTHORIZED additive dispatch: Esc/dismiss
            // (as opposed to an actual pick, which handlePickBlock above
            // already covers with its own cw:wire-release). Scoped to the
            // 'wire' kind only — the node/edge/pane picker variants never
            // had a held line to begin with.
            if (picker?.kind === 'wire') {
              window.dispatchEvent(new CustomEvent('cw:wire-release', { detail: { reason: 'dismiss' } }))
            }
            setPicker(null)
          }}
        />
      ) : null}

      {/* CONTEXT & CLIPBOARD (item 4) — the node/multi-select right-click
          menu. NodeCommandMenu (shared.jsx) portals + clamps itself once
          `anchor` is passed — this file only owns WHICH ids and WHERE.
          Keyed on the id list + open point so re-right-clicking a DIFFERENT
          node/selection always mounts fresh (mirrors GHOST + PICKER's own
          pickerKeyOf reasoning just above: a stale `view` — e.g. still
          showing Rename — must never carry over to a different node). */}
      {nodeMenu ? (
        <NodeCommandMenu
          key={`${nodeMenu.ids.join(',')}:${nodeMenu.x}:${nodeMenu.y}`}
          nodeIds={nodeMenu.ids}
          anchor={{ x: nodeMenu.x, y: nodeMenu.y }}
          onClose={() => setNodeMenu(null)}
        />
      ) : null}

      {/* CONTEXT & CLIPBOARD (item 4) — the small edge menu. "Insert block"
          hands off to the SAME splice-mode picker OmniEdge.jsx's own hover +
          button already opens (picker.kind 'edge') — one insert-a-block-
          into-a-wire code path, two ways to reach it. */}
      {edgeMenu ? (
        <EdgeContextMenu
          key={`${edgeMenu.edgeId}:${edgeMenu.x}:${edgeMenu.y}`}
          edgeId={edgeMenu.edgeId}
          x={edgeMenu.x}
          y={edgeMenu.y}
          onInsert={(edgeId, rect) => setPicker({ kind: 'edge', edgeId, rect, side: 'right' })}
          onClose={() => setEdgeMenu(null)}
        />
      ) : null}

      {/* SUBGRAPHS — the theater. Portals itself to #workflow-root (see its
          own header comment), so its render position here is only about
          mounting it into the tree, same convention as BlockPicker/
          NodeCommandMenu above. `entryRect` was already captured before
          `subgraph` was set (this component's own cw:enter-steps listener),
          so SubgraphStage never has to re-derive "where did this click
          happen" itself for the entrance half of the transition. */}
      {subgraph ? (
        <SubgraphStage
          key={subgraph.taskId}
          taskId={subgraph.taskId}
          entryRect={subgraph.entryRect}
          onClose={() => setSubgraph(null)}
        />
      ) : null}

      {/* DELIVERABLES A+C — the gallery shelf (view C). Unconditional mount:
          it portals to #workflow-root and renders null itself while closed/
          empty (own presence machine, mirroring the issues pill above). */}
      <DeliverablesShelf />
    </div>
  )
}
