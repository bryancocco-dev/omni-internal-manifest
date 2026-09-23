// Seam B — App core
//
// Single context provider that owns the graph: nodes/edges live here via
// React Flow's useNodesState/useEdgesState, plus everything derived from
// them (block numbering, issues, the compiled-panel counts) and every
// mutating action (palette add, toolbar buttons, the cw:* window events C/D
// dispatch). Nodes/edges themselves are the shared contract data described in
// PLAN.md §Graph schema — C's node components mutate their own node's `data`
// directly via `useReactFlow().updateNodeData(id, patch)`, which (in
// controlled mode, which is what this file sets up) flows back through
// `onNodesChange` below, so nothing further is required on this end to pick
// those edits up.
//
// MOTION PHASE (M3 — "Choreography + chrome"; see PLAN.md "## MOTION PHASE"
// -> "### M3"). What's new in this file, item by item:
//   2. animated Tidy up — `animatePositions` rAF-tweens node positions from
//      their current spot to dagre's target layout instead of snapping;
//   3/4/5. `cw:ripple` is dispatched here for the cw:add-from spawn case
//      (FlowCanvas.jsx owns the other two ripple sources — palette drop,
//      onNodeDragStop — plus the pointer spotlight and its own listener for
//      this event); `swapKey` forces FlowCanvas's inner stage to remount on
//      Load-from-instructions/Clear so the materialize cascade always
//      replays, even though the sample graphs reuse stable node ids;
//   7. `cw:surge` (`{ detail: { source, target, sourceHandle } }`) fires
//      after onConnect / cw:add-from / cw:edge-insert mint a new edge — a
//      0ms setTimeout defers each dispatch one tick so the new OmniEdge
//      instance has mounted its own listener first (same reasoning as the
//      pre-existing setTimeout(...,60) calls below, waiting for React Flow's
//      store to catch up before an imperative read). `data.seq` (BFS order,
//      ALL node types) is injected in the same renumber() pass as `number`.
//
// RUN PHASE (R1 — "Run engine + history"; see PLAN.md "## RUN PHASE" ->
// "### R1"). What's new in this file:
//   - `runWorkflow`/`stopRun`/`continueHuman`/`chatWithHuman`/`runState` wrap
//     a single long-lived `createRunner` instance (./run/engine.js) in a ref
//     (`chatWithHuman` is HITL MICRO-CHAT, PLAN.md "## HITL MICRO-CHAT" — a
//     later, additive wrap of the exact same instance, same one-line-forward
//     shape as `continueHuman`) — the
//     runner walks the graph and calls back into `patchNodeData` (merges
//     into a node's `data`, exactly like C's `updateNodeData` pattern) and
//     `dispatchRunEdge` (turns each traversed edge into the `cw:run-edge`
//     window event M1's OmniEdge listens for). `runState` itself is derived
//     — not a separate flag — from scanning `rawNodes` for any `paused` /
//     `queued`|`running` node, so it can never drift out of sync with what
//     the runner actually did to the graph.
//   - Connect/drop are the only graph edits blocked mid-run (PLAN.md: "block
//     graph edits while running ... simplest guard") — everything else
//     (delete, tidy, load/clear) stays available.
//   - `onReconnect` (dragging an existing edge's end to re-plug it — R4's
//     contract addition, PLAN.md R4.2) reuses RF's own `reconnectEdge`
//     utility and snapshots history exactly like `onConnect` does.
//   - Undo/redo: `undoStackRef`/`redoStackRef` hold structural-only
//     snapshots (node/edge data with the run fields stripped — see
//     `stripRunFields`) pushed before every checkpoint-worthy action (PLAN.md
//     R1.3's list). Node drags are the one subtlety: React Flow's
//     `onNodesChange` streams position deltas continuously while dragging,
//     so a snapshot taken AT drag-stop would only undo the last pixel of
//     movement — `dragSnapshotRef` instead caches the pre-drag snapshot the
//     moment a drag *starts* and pushes that cached snapshot at drag-stop.
//     Delete (Backspace/Delete, or the edge "x" control) and drag-stop both
//     route through the wrapped `trackedOnNodesChange`/`trackedOnEdgesChange`
//     below — the *same* functions FlowCanvas.jsx already calls unmodified
//     as `onNodesChange`/`onEdgesChange`, so this needed no change to that
//     file. `cw:add-from`/`cw:edge-insert`/`cw:edge-cut`/`cw:wire-add` also
//     each push a checkpoint even though PLAN.md's trigger list names "node
//     add" and "node/edge delete" generically rather than these specific
//     window events by name — they create/remove nodes and edges exactly
//     like the named triggers do, so leaving them out would just be a
//     confusing gap in what Undo covers.

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useNodesState, useEdgesState, addEdge, reconnectEdge, useReactFlow } from '@xyflow/react'

import { tidyLayout } from './layout/tidy.js'
import { samples } from './data/samples.js'
import { nodeDisplayTitle, makeTaskData, paletteItemById, MOCK_AGENTS } from './data/blocks.js'
import { createRunner } from './run/engine.js'
import { TEMPLATES } from './data/templates/index.js'
import { placeAt, graphBounds, nodeBox } from './data/templates/builder.js'
// VARIANT STUDIO (PLAN.md "## VARIANT STUDIO") — seeding the grid's cards
// with the SAME deterministic mulberry32/FNV scheme run/engine.js already
// uses for Output artifacts, so "no Math.random" holds for this feature too.
import { makeSeed } from './run/artifacts.jsx'
import { posterLayoutIndex, POSTER_LAYOUT_COUNT } from './run/posters.jsx'
// COMFY ROUND (CP2, item 3) — "SEED DISCIPLINE" fallback for a generate node
// somehow missing its own data.seed (a legacy/duplicated node, say).
// MODEL-AGNOSTIC POSTURE (PLAN.md "### QUEUED PHASE — MODEL FABRIC") —
// AUTO_MODEL_VALUE distinguishes an untouched Task MODEL field from an
// explicit pick (computeCompiledCounts' MODELS row only counts the latter);
// runCostForModels prices the RUN METER by tier, provider-aware.
import { DEFAULT_GENERATE_SEED, AUTO_MODEL_VALUE, runCostForModels } from './data/models.js'
// PLATFORM CHROME (PLAN.md "## PLATFORM CHROME" -> "### 3 — Session
// Workflows library") — "thumb: <same mini-graph renderer as templates>".
// Computed ONCE at save time (saveWorkflow below) and stored on the record,
// same "compute once, cache" posture miniGraph.js's own template cache uses
// for the other half of this shared renderer.
import { computeMiniGraph } from './run/miniGraph.js'

const FLOW_PARAMS = [
  'audience', 'default', 'blank', 'empty', 'social', 'brief', 'launch', 'global',
  // DEMO TOUR (PLAN.md "## DEMO TOUR") — the four staged states; see
  // data/samples.js for their content and TOUR_FIT_PARAMS below for their
  // one-time boot fitView.
  'studio', 'wall', 'broken', 'meeting',
]

// COMMENTS PHASE — single-user prototype (PLAN.md "## COMMENTS PHASE"):
// "Current user = 'Bryan' (matches the shell's profile chip)." Exported so
// CommentsLayer.jsx can stamp the same name on a still-unposted draft pin.
export const CURRENT_USER = 'Bryan'

const FlowStateContext = createContext(null)

function genId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

// RESULTS ON THE BOARD's own free-standing `results` node — and with it the
// RESULTS_COL_PITCH/RESULTS_HEIGHT_EST position-math constants that used to
// live here — retired by RESULTS SHEET (PLAN.md "## RESULTS SHEET — the
// frame springs from the output node"): "the free-standing end-of-road
// `results` NODE retires; the results surface becomes a tethered SATELLITE
// of the terminal output node." See `resultsAnchorId` further down for its
// replacement (no spawn/position math at all — the sheet mounts as a plain
// absolutely-positioned child of whichever OutputNode.jsx card is already
// the terminal delivered output, the same way HumanNode.jsx's own chat
// sheet mounts off its node).

// ---------------------------------------------------------------------------
// VARIANT STUDIO — grid geometry (PLAN.md "## VARIANT STUDIO" -> "### 2 —
// the variant GRID"). Pixel constants, not measured: a variant card's whole
// point is to be "minimal" and fixed-size (nodes.css `.cw-node--variant`
// carries the SAME numbers as a plain CSS rule, matching the established
// data/templates/builder.js EST_WIDTH/EST_HEIGHT precedent for "JS needs to
// know a CSS-defined card size"), so there's nothing to wait on React Flow
// to measure before laying the grid out. "2 rows × ceil(N/2) cols" (PLAN.md)
// — VARIANTS is always one of data/models.js's VARIANT_COUNTS (4/6/10
// whenever a grid spawns at all; 1 never spawns one), each of which divides
// evenly into exactly 2 rows.
// ---------------------------------------------------------------------------
const VARIANT_CARD_W = 200
const VARIANT_CARD_H = 322
const VARIANT_GAP = 18
const VARIANT_PAD_X = 20
// PRODUCTION CLARITY PASS (PLAN.md) — was 46; the frame's head grew a second
// line (a "Pick a take..." caption under the provenance eyebrow, FrameNode.
// jsx), so the header band needs more clearance before the first row of
// cards starts. Tuned against the actual rendered head height (screenshot-
// measured), not guessed. NOTE: samples.js's makeWallFlow() hand-computes
// its own frame height + card Y offsets against these constants (was left
// on the old 46 by this pass's file grant; synced to 64 + frame height 746
// in a follow-up) — keep that fixture in step if these move again.
const VARIANT_PAD_TOP = 64
const VARIANT_PAD_BOTTOM = 20
const VARIANT_GROUP_GAP = 140 // generate node -> grid horizontal air
// Matches run/engine.js's OWN GENERATE_DEVELOP_MS (independent constant,
// same value on purpose) — the manual RUN MODEL button below has no access
// to that file's module scope, so a full-flow run and a manual run still
// feel identically paced even though only one of them goes through engine.js.
const GENERATE_DEVELOP_MS = 1500

function gridGeometry(count) {
  const cols = Math.max(1, Math.ceil(count / 2))
  const rows = Math.ceil(count / cols)
  const width = VARIANT_PAD_X * 2 + cols * VARIANT_CARD_W + (cols - 1) * VARIANT_GAP
  const height = VARIANT_PAD_TOP + rows * VARIANT_CARD_H + (rows - 1) * VARIANT_GAP + VARIANT_PAD_BOTTOM
  return { cols, rows, width, height }
}
function gridSlotPosition(index, cols) {
  const row = Math.floor(index / cols)
  const col = index % cols
  return {
    x: VARIANT_PAD_X + col * (VARIANT_CARD_W + VARIANT_GAP),
    y: VARIANT_PAD_TOP + row * (VARIANT_CARD_H + VARIANT_GAP),
  }
}

// A parented (grid-child) node's own `position` is RELATIVE to its parent
// (React Flow's own semantics — verified against the installed
// @xyflow/system package). Every placement/collision/jump helper in this
// file (nodeBox, slideClear, graphBounds, ...) reads `.position` as an
// ABSOLUTE canvas coordinate — true for every node type that existed before
// this phase, no longer true for a 'variant' card. Exported so
// FlowCanvas.jsx's own delete-boom/search-ripple code (nodeBox on whatever
// node a user just deleted or searched to, which COULD be a grid child) can
// resolve the same absolute box instead of duplicating this lookup.
export function resolveNodeBox(node, nodesById) {
  const box = nodeBox(node)
  if (!node.parentId) return box
  const parent = nodesById.get(node.parentId)
  if (!parent) return box
  return { x: parent.position.x + box.x, y: parent.position.y + box.y, w: box.w, h: box.h }
}

// CANVAS-NATIVE DELIVERABLES — the bounding box of several resolveNodeBox()
// boxes at once, for the completion glide's "FIT THE OUTPUT NODES that
// produced versions this run" (PLAN.md "### 2"), which can span more than
// one node scattered anywhere on the canvas.
function unionBoxes(boxes) {
  if (!boxes.length) return null
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  boxes.forEach((b) => {
    minX = Math.min(minX, b.x)
    minY = Math.min(minY, b.y)
    maxX = Math.max(maxX, b.x + b.w)
    maxY = Math.max(maxY, b.y + b.h)
  })
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY }
}

// Every node object handed to <ReactFlow> must carry a `measured` key (even
// empty). @xyflow/system's parseHandles wipes a node's stored handleBounds on
// every adoptUserNodes pass while `userNode.measured` is falsy — and since
// numbering mints fresh node objects per state change, un-keyed nodes get
// their measurements/handle bounds erased as fast as React Flow (or the
// FlowCanvas heal pass) writes them, which leaves every edge silently
// unrendered. A truthy `measured` flips parseHandles to preserve-mode.
function normalizeNodes(nodes) {
  return nodes.map((n) => (n.measured ? n : { ...n, measured: {} }))
}

// ---------------------------------------------------------------------------
// RUN PHASE — undo/redo history (R1.3). Snapshots are STRUCTURAL only: the
// four fields the run engine writes (`runState`, `output`, `answer`,
// `takenHandle`) are stripped from every node's `data` before it goes on the
// stack, so undoing/redoing never resurrects a stale mid-run visual state or
// a half-streamed generation — exactly PLAN.md's "snapshot {nodes,edges}
// (structural only — strip runState/output)".
// ---------------------------------------------------------------------------
const MAX_HISTORY = 50
const RUN_DATA_KEYS = ['runState', 'output', 'answer', 'takenHandle']

// COMFY ROUND (CP2, item 2) — RUN METER session budget (PLAN.md: "12
// runs/session"). Module scope, matching every other tunable constant in
// this file; the live counter itself is real component state (see
// FlowStateProvider's own runsRemaining block) so it can reset per mount.
const MAX_RUNS = 12

function stripRunFields(data) {
  if (!data) return data
  const next = { ...data }
  for (const key of RUN_DATA_KEYS) delete next[key]
  return next
}

function snapshotGraph(nodes, edges) {
  return {
    nodes: nodes.map((n) => ({ ...n, position: { ...n.position }, data: stripRunFields(n.data) })),
    edges: edges.map((e) => ({ ...e })),
  }
}

// ---------------------------------------------------------------------------
// NODE TOOLBAR V2 — "Run from here" (PLAN.md "## NODE TOOLBAR V2", item 5).
// Forward BFS over edges from `startId` (inclusive) — the exact set of nodes
// engine.runFrom's own walk can ever reach, since `advance` only ever
// follows OUTGOING edges. `runFromNode` below resets just this set to
// idle/null before kicking the engine off, so every node the walk actually
// revisits gets a fresh queued/running/done beat (same as a full run) while
// everything upstream — the whole reason "Run from here" is useful — keeps
// whatever output it already has, never blanked.
// ---------------------------------------------------------------------------
function computeDownstreamSet(startId, edges) {
  const outAdjacency = new Map()
  edges.forEach((e) => {
    if (!outAdjacency.has(e.source)) outAdjacency.set(e.source, [])
    outAdjacency.get(e.source).push(e.target)
  })
  const seen = new Set([startId])
  const queue = [startId]
  while (queue.length) {
    const id = queue.shift()
    for (const targetId of outAdjacency.get(id) || []) {
      if (!seen.has(targetId)) {
        seen.add(targetId)
        queue.push(targetId)
      }
    }
  }
  return seen
}

// ---------------------------------------------------------------------------
// Boot: `?flow=` picks a sample, else the shot-1 default. NO persistence —
// refreshing the page always resets to a clean flow (Bryan, 2026-08-11).
// The theme system keeps its own localStorage persistence; that's separate
// and intentional.
// ---------------------------------------------------------------------------
function getInitialFlow() {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search)
    // GATEWAY RUN Phase Q (canvas-workflows half, own PLAN.md documents the
    // contract) — `?template=<id>` boots a REAL TEMPLATES registry entry
    // (the exact `{id, build()}` TemplateList.jsx/insertTemplate already
    // use), for a workflow-editor deep link to hand a live run into. Checked
    // BEFORE `?flow=` below (own param, own precedence) but falls through to
    // it — and then to the empty default — on a missing/unknown id, so a
    // stale or mistyped `?template=` never breaks the boot.
    const templateParam = params.get('template')
    if (templateParam) {
      const tpl = TEMPLATES.find((t) => t.id === templateParam)
      if (tpl) {
        const built = tpl.build()
        return { flow: { nodes: normalizeNodes(built.nodes), edges: built.edges } }
      }
    }
    const flowParam = params.get('flow')
    if (flowParam && FLOW_PARAMS.includes(flowParam)) {
      const s = samples[flowParam]()
      return { flow: { nodes: normalizeNodes(s.nodes), edges: s.edges } }
    }
  }
  // Boot = bare canvas + the manifest overlay (Bryan): the builder opens on
  // the "here's how this works, start here" moment, not a pre-made 3-node
  // flow. `?flow=` still overrides for demos/deep-links.
  const e = samples.empty()
  return { flow: { nodes: normalizeNodes(e.nodes), edges: e.edges } }
}

// ---------------------------------------------------------------------------
// DEMO TOUR (PLAN.md "## DEMO TOUR", item 4) — "?flow=meeting" seeds 3
// placed comment threads on boot: "one resolved, one open on a node, one
// open with a reply" ... "reuse comment store shape" ... "seed via the same
// boot path — executor judges, no persistence." Mirrors getInitialFlow's own
// `?flow=` read exactly, but feeds FlowStateProvider's comments useState
// (below) instead of the node/edge boot — the comment store is this file's
// own concern (COMMENTS PHASE: "State — src/state.jsx"), entirely separate
// from the graph samples.js owns, so this stays here rather than in that
// file. Same {id,x,y,author,text,at,resolved,replies:[{id,author,text,at}]}
// shape addComment/addReply already write (below), just pre-populated
// instead of user-authored — `x`/`y` are FLOW coordinates chosen to sit near
// the studio-flow node each thread is "about" (?flow=meeting is the studio
// graph plus one note — see data/samples.js's makeMeetingFlow). `at`
// timestamps are computed at BOOT time (now-minus-an-offset) rather than a
// hardcoded past date, so the seeded threads always read as "N ago" relative
// to whenever the link is actually opened, never visibly stale.
const DEMO_COMMENT_AUTHOR_A = 'Mara Lindqvist (Omnicom)'
const DEMO_COMMENT_AUTHOR_B = 'Owen Reilly (Omnicom)'
function demoAgo(ms) {
  return new Date(Date.now() - ms).toISOString()
}
function getInitialComments() {
  if (typeof window === 'undefined') return []
  const params = new URLSearchParams(window.location.search)
  if (params.get('flow') !== 'meeting') return []
  const MIN = 60 * 1000
  const HOUR = 60 * MIN
  return [
    {
      // Resolved — pinned near generate-1 (data/samples.js: {x:1500,y:260}).
      id: 'demo-comment-generate',
      x: 1650,
      y: 210,
      author: DEMO_COMMENT_AUTHOR_A,
      text: 'These are on-brand and the fall palette reads warm without tipping into pumpkin-spice cliché. Approved from my side.',
      at: demoAgo(3 * HOUR + 12 * MIN),
      resolved: true,
      replies: [],
    },
    {
      // Open, on a node — pinned near human-signoff ({x:2060,y:320}).
      id: 'demo-comment-signoff',
      x: 2170,
      y: 280,
      author: DEMO_COMMENT_AUTHOR_B,
      text: 'Can we see a 7th variant before this goes to sign-off, or are we locked at 6 for this round?',
      at: demoAgo(41 * MIN),
      resolved: false,
      replies: [],
    },
    {
      // Open, with a reply — pinned near task-research ({x:460,y:300}).
      id: 'demo-comment-research',
      x: 610,
      y: 250,
      author: DEMO_COMMENT_AUTHOR_A,
      text: 'Should the research pull competitive spend too, or just our own campaign history?',
      at: demoAgo(2 * HOUR + 5 * MIN),
      resolved: false,
      replies: [
        {
          id: 'demo-comment-research-reply-1',
          author: DEMO_COMMENT_AUTHOR_B,
          text: 'Just ours for the first pass — keep it tight. We can widen the lens later if we need to.',
          at: demoAgo(1 * HOUR + 48 * MIN),
        },
      ],
    },
  ]
}

// ---------------------------------------------------------------------------
// BFS numbering from the trigger — only `task`/`human` nodes get a number,
// in the order a run would actually reach them. This is a pure display-layer
// transform (never written back into the raw node state) so it can never
// create a setState feedback loop; see `numberedNodes` below.
//
// MOTION PHASE: the same BFS pass also stamps `data.seq` (int) on EVERY node
// type — the cross-seam entrance-cascade contract (PLAN.md "Cross-seam
// contracts": node components expose it as `style={{'--cw-seq': data.seq}}`
// so mount animations stagger in flow order). Nodes the BFS never reaches
// (no trigger yet, or a disconnected island) still get a stable value —
// appended after the reached set, in existing array order — so a freshly
// palette-dropped node always has *some* seq to animate in with.
// ---------------------------------------------------------------------------
function renumber(nodes, edges) {
  // Multi-trigger (Bryan): every trigger seeds the BFS, in array order, so
  // numbering follows reachability from ANY entry point.
  const triggers = nodes.filter((n) => n.type === 'trigger')
  const order = []
  const seen = new Set()
  if (triggers.length) {
    const outAdjacency = new Map()
    edges.forEach((e) => {
      if (!outAdjacency.has(e.source)) outAdjacency.set(e.source, [])
      outAdjacency.get(e.source).push(e.target)
    })
    triggers.forEach((t) => {
      seen.add(t.id)
      order.push(t.id)
    })
    const queue = triggers.map((t) => t.id)
    while (queue.length) {
      const id = queue.shift()
      for (const targetId of outAdjacency.get(id) || []) {
        if (!seen.has(targetId)) {
          seen.add(targetId)
          order.push(targetId)
          queue.push(targetId)
        }
      }
    }
  }
  nodes.forEach((n) => {
    if (!seen.has(n.id)) order.push(n.id)
  })
  const seqById = new Map(order.map((id, i) => [id, i]))

  // COMFY ROUND (CP2, item 5) — "PARAM NODE": 'params' joins the SAME
  // numbering pool task/human already share (not a separate counter) — one
  // unified "the Nth thing in the flow" vocabulary, so the receiving card's
  // "PARAMS · from 04" echo chip (shared.jsx) can point at a number the
  // reader already recognizes from elsewhere on the canvas, rather than
  // inventing a second numbering scheme. Same caveat that already applies
  // to task/human: inserting a params node upstream can shift a downstream
  // task's number — no different from inserting a new Task doing the same
  // today.
  // PRODUCTION CLARITY PASS (PLAN.md) — 'generate' joins the SAME numbering
  // pool ("node number = the same number the source Generate card wears").
  // Before this, a Generate card was the one action type with no number of
  // its own, so a spawned grid had nothing honest to cite as its
  // provenance; now it wears "NN · Generate" on its own eyebrow (Generate
  // Node.jsx) exactly like every other numbered card, and FrameNode.jsx's
  // "FROM NN ·" label just reads that same value back off the source node
  // (copied onto the frame's own data at spawn time, spawnOrReplaceGrid
  // below — this function only touches the LIVE node it's numbering).
  // Downstream numbers shift by one wherever a generate node sits upstream
  // of them — no different from inserting any other numbered block.
  // WAVE 2 — THE VERB EXPANSION. 'signal' (source/audience/measure) joins
  // the SAME numbering pool — same reasoning as params/generate's own
  // comments just above: it's what lets a receiving card's echo chip say
  // "AUDIENCE · from 04" using a number the reader already recognizes
  // elsewhere on the canvas.
  const numberMap = new Map()
  let n = 1
  order.forEach((id) => {
    const node = nodes.find((x) => x.id === id)
    if (
      node &&
      // THE SPLIT — 'checkin' joins the SAME numbering pool 'human' already
      // sits in: a check-in is a real step in the flow's own progression
      // (CheckinNode.jsx's eyebrow reads "NN · Agent Check-in · Chats"
      // exactly like the gate always has), not a decoration.
      (node.type === 'task' ||
        node.type === 'human' ||
        node.type === 'checkin' ||
        node.type === 'params' ||
        node.type === 'generate' ||
        node.type === 'signal')
    )
      numberMap.set(id, n++)
  })

  return nodes.map((node) => {
    const data = { ...node.data, seq: seqById.get(node.id) ?? 0 }
    if (
      node.type === 'task' ||
      node.type === 'human' ||
      node.type === 'checkin' ||
      node.type === 'params' ||
      node.type === 'generate' ||
      node.type === 'signal'
    ) {
      data.number = numberMap.has(node.id) ? numberMap.get(node.id) : null
    }
    return { ...node, data }
  })
}

// ---------------------------------------------------------------------------
// Issues — one row per offending node (see PLAN.md §CompiledPanel). Iterating
// nodes in array order naturally reproduces shot-1's exact order (agent issue
// before the output-description issue) since that's the node array order.
//
// ISSUES POPOVER V2 (PLAN.md "## ISSUES POPOVER V2") — each issue now also
// carries:
//   - `nodeType`: the offending node's own type. (Its original consumer —
//     the popover row's kind-colored mark — was retired 2026-08-14; the
//     subject text carries --cw-danger now. Kept on the issue object since
//     it is cheap and still names the offender.)
//   - `hint`: one static plain-English sentence per KIND (consequence + what
//     Fix does) — see ISSUE_HINTS below.
//   - `subject` is richer: only task/human nodes ever carry a `data.number`
//     (renumber() above numbers every one of them, connected or not — see
//     its own header comment), so those two types were already uniquely
//     discriminated. Every OTHER type used to render a bare, un-discriminated
//     title — two disconnected Outputs both just read "Output" (Fable, from
//     his screenshot: "unconnected nodes have no flow number, so two broken
//     Outputs render as identical rows"). Outputs now read "Output (<format>)";
//     Task/Logic already discriminate via nodeDisplayTitle (their own title /
//     kind label).
// `text` is kept, unchanged in SHAPE, for the compiled panel (CompiledPanel.
// jsx reads issue.text directly and is out of this phase's file grant) — it's
// still built as `${subject} — ...`, so it inherits the same
// richer/disambiguated subject for free, same template as before.
// ---------------------------------------------------------------------------
// Every issue names the card it belongs to, numbered exactly as the card's
// own header reads ("2. Task / Action") — two Tasks both missing an agent
// used to render as two identical lines, which read as a duplicate bug
// rather than two problems (Bryan). The rows are jump-links, so the number
// is also the wayfinding: it matches what you land on.
function issueSubject(node) {
  const n = node.data?.number
  if (n) return `${n}. ${nodeDisplayTitle(node)}`
  if (node.type === 'output') return `Output (${node.data?.format || 'Text'})`
  return nodeDisplayTitle(node) // Task/Logic already discriminate; Wait/Stop are fixed single labels
}

const ISSUE_HINTS = {
  agent: 'No one is assigned to do this work. Fix assigns the Omni Research Agent.',
  description: "The run doesn't know what this should produce. Fix writes a short brief for its format.",
  disconnected: 'Nothing flows into this block, so it will never run. Fix wires it to the nearest block on its left.',
  // VARIANT STUDIO — "generate node with empty prompt -> issue ('no prompt',
  // Fix fills a plausible one)" (PLAN.md "### 4 — integration").
  prompt: "There's nothing to generate from. Fix writes a plausible creative prompt.",
  // WAVE 1 shared infra — the 'unused' issue's own hint (see
  // UNUSED_CHECK_TYPES above for the full spec citation).
  unused: 'This produces a value nothing downstream reads yet. Fix wires it to the nearest free in-port on its right.',
}

// VARIANT STUDIO — node types the disconnected check never flags. `generate`
// is the one PLAN.md calls out by name ("Disconnected generate nodes are
// LEGAL — Weave style: it can stand alone — exempt them from the
// disconnected check"); `variantgroup`/`variant` are exempted for a
// structural reason the plan doesn't need to spell out because they didn't
// exist yet when it was written — neither type ever carries an edge at all
// ("NO wires to results" — the group frame carries the relationship, not a
// wire), so without this exemption EVERY spawned grid would flood the
// issues pill with one false "not connected" row per card.
// COMFY ROUND (CP2) — 'note' has no handles at all (never a valid edge
// TARGET, structurally), so the plain "nothing points at me" check would
// flag every note on the canvas; 'params' has an out-port only (PARAM NODE,
// item 5) — same reasoning as trigger, it's a legitimate source with no
// incoming edge by design, not a broken one missing its wiring.
// RESULTS ON THE BOARD — 'results' is portless BY CONTRACT (PLAN.md: "NO
// ports/handles"), so like 'note' it can never be validly wired; without
// this exemption every completed content-engine run raised a spurious
// "results — not connected to the flow" pill (both seam executors flagged
// it independently).
const NEVER_DISCONNECTED_TYPES = new Set(['trigger', 'generate', 'variantgroup', 'variant', 'note', 'params', 'results'])

// WAVE 1 — THE VERB EXPANSION (PLAN.md master contract, "### Shared
// infrastructure" -> "The 'unused' issue"): "Nodes with no IN-port
// (source-family + params) are exempt from 'not connected' but gain its
// mirror: zero OUTGOING edges -> issue." Deliberately NARROWER than
// NEVER_DISCONNECTED_TYPES just above — 'generate'/'variantgroup'/'variant'/
// 'note' are exempted from the LEFT-side check for other reasons (a
// legal-to-stand-alone action, or no ports at all) that don't imply "and
// also flag it if nothing's downstream of it" — 'trigger' most of all,
// since a workflow's very first block is, by definition, momentarily
// unwired on this side the instant it's dropped; flagging that would make
// "add a Trigger" itself the first issue on every fresh canvas. Only
// genuine produce-only "value source" blocks belong here. 'params' is the
// only one that exists yet — "W1 stubs the check generically... test with
// params" (PLAN.md) — Source/Audience/Style Reference (Wave 2/3) join this
// set for free the moment those waves add their own type, with no change
// needed to computeIssues/applySingleFix below.
const UNUSED_CHECK_TYPES = new Set(['params'])

// WAVE 2 — THE VERB EXPANSION. Source/Audience join the exact family
// UNUSED_CHECK_TYPES' own header comment predicted ("Source/Audience/Style
// Reference (Wave 2/3) join this set for free the moment those waves add
// their own type") — except they DON'T get their own type, they join
// `params`'s EXISTING signal-family treatment as a `data.kind` split
// within the shared 'signal' type (see SignalNode.jsx's header comment).
// Measure does NOT join it — it has a real in-port, so the NORMAL
// disconnected check applies to it instead, same footing as task/output/
// wait. A flat type Set can't express that split for one type, so both
// checks below (and the unused-fix's own target-exclusion list further
// down) route 'signal' through this predicate instead of Set membership.
function isSignalSourceFamily(node) {
  return node.type === 'signal' && (node.data?.kind || 'source') !== 'measure'
}

// Valid source-handle set for nodes whose handles are DYNAMIC — a Human's
// per-option handles (choice mode) and a Switch's per-case handles. Static
// kinds (task/trigger/wait/output, if/else, try/catch, for-each) can't
// dangle, so they return null (= don't prune). Kept next to computeIssues
// since both are pure derivations over the same graph.
function validSourceHandles(node) {
  if (node.type === 'human') {
    if ((node.data?.responseType || 'free') === 'choice') {
      const opts = Array.isArray(node.data?.options) ? node.data.options : []
      return new Set(opts.map((o) => `opt-${o.id}`))
    }
    return new Set(['out'])
  }
  if (node.type === 'logic' && node.data?.kind === 'switch') {
    const opts = Array.isArray(node.data?.options) ? node.data.options : []
    return new Set(opts.map((_, i) => `case-${i}`))
  }
  return null
}

function computeIssues(nodes, edges) {
  const targets = new Set(edges.map((e) => e.target))
  // WAVE 1 shared infra — the 'unused' check's own membership test (mirror
  // of `targets` above, opposite direction).
  const sources = new Set(edges.map((e) => e.source))
  const issues = []
  for (const node of nodes) {
    const subject = issueSubject(node)
    // NODE TOOLBAR V2 — "skipped nodes' issues stay listed but rows show a
    // 'skipped' tag" (PLAN.md): the issue itself is untouched (a skipped
    // task with no agent is still a real gap the moment it's un-skipped),
    // this just rides along so FlowCanvas.jsx's popover row can render the
    // tag without re-deriving node state from nodeId.
    const skipped = !!node.data?.skipped
    if (node.type === 'task' && !node.data?.agent) {
      issues.push({
        id: `${node.id}:agent`,
        nodeId: node.id,
        nodeType: node.type,
        kind: 'agent',
        subject,
        hint: ISSUE_HINTS.agent,
        text: `${subject} — no agent selected.`,
        skipped,
      })
    }
    if (node.type === 'output' && !String(node.data?.description || '').trim()) {
      issues.push({
        id: `${node.id}:description`,
        nodeId: node.id,
        nodeType: node.type,
        kind: 'description',
        subject,
        hint: ISSUE_HINTS.description,
        text: `${subject} — no description.`,
        skipped,
      })
    }
    // VARIANT STUDIO
    if (node.type === 'generate' && !String(node.data?.prompt || '').trim()) {
      issues.push({
        id: `${node.id}:prompt`,
        nodeId: node.id,
        nodeType: node.type,
        kind: 'prompt',
        subject,
        hint: ISSUE_HINTS.prompt,
        text: `${subject} — no prompt.`,
        skipped,
      })
    }
    if (!NEVER_DISCONNECTED_TYPES.has(node.type) && !isSignalSourceFamily(node) && !targets.has(node.id)) {
      issues.push({
        id: `${node.id}:disconnected`,
        nodeId: node.id,
        nodeType: node.type,
        kind: 'disconnected',
        subject,
        hint: ISSUE_HINTS.disconnected,
        text: `${subject} — not connected to the flow.`,
        skipped,
      })
    }
    // WAVE 1 shared infra — mirror of the check just above, for nodes with
    // NO in-port at all (exempt from "not connected" by
    // NEVER_DISCONNECTED_TYPES for that exact reason): the only way THESE
    // can be structurally wrong is the opposite direction.
    if ((UNUSED_CHECK_TYPES.has(node.type) || isSignalSourceFamily(node)) && !sources.has(node.id)) {
      issues.push({
        id: `${node.id}:unused`,
        nodeId: node.id,
        nodeType: node.type,
        kind: 'unused',
        subject,
        hint: ISSUE_HINTS.unused,
        text: `${subject} — not feeding anything.`,
        skipped,
      })
    }
  }
  return dedupeIssueSubjects(issues)
}

// Two issues can still land on the identical (subject, kind) pair — e.g. two
// disconnected Output nodes that are both "Text" format share the exact same
// discriminator. Suffix every collision after the first, in encounter order
// (' — 2', ' — 3', ...); `text` is rebuilt off the (possibly suffixed)
// subject so the compiled panel disambiguates too, for free, in the same
// string shape as before (subject + the kind-specific tail unchanged).
function dedupeIssueSubjects(issues) {
  const seen = new Map()
  return issues.map((issue) => {
    const key = `${issue.kind} ${issue.subject}`
    const count = (seen.get(key) || 0) + 1
    seen.set(key, count)
    if (count === 1) return issue
    const subject = `${issue.subject} — ${count}`
    const tail = issue.text.slice(issue.subject.length) // " — no agent selected." etc.
    return { ...issue, subject, text: `${subject}${tail}` }
  })
}

// Auto-fix defaults (issues popover): plausible campaign-ops fill-ins, per
// output format, plus the default agent for orphaned Task blocks.
const AUTOFIX_AGENT = 'Omni Research Agent'
const AUTOFIX_DESCRIPTIONS = {
  Text: 'A 300-word summary.',
  Email: 'A short internal email with three bullet takeaways.',
  Teams: 'A two-paragraph Teams update.',
  Graphic: 'One 1080x1350 key visual.',
  Video: 'A 30-second cutdown script.',
  Audio: 'A 20-second voiceover script.',
  Presentation: '6 slides.',
  Doc: '2 pages maximum.',
  Spreadsheet: 'One tab, columns by channel.',
  'Templated Output': 'Filled template, all fields.',
}
// VARIANT STUDIO — plausible fill for an empty GENERATE prompt, same
// campaign-ops register as the descriptions above.
const AUTOFIX_PROMPT = 'A bold key visual for the campaign — clean composition, on-brand palette, one confident focal subject.'

// ---------------------------------------------------------------------------
// ISSUES POPOVER V2 (PLAN.md "### 3 — Per-issue Fix + Fix all") — the single-
// issue patch (agent fill / description fill / wire-from-nearest-left),
// extracted to a pure function so both `fixIssue` (one issue, called per
// row's Fix button) and `autoFixIssues` (every current issue, "Fix all")
// share the exact same repair logic and can never drift apart. Takes/returns
// plain {nodes, edges} — no state reads/writes of its own — so the caller
// decides how many pushHistory() checkpoints the whole operation costs (one
// per fixIssue() call; exactly one total for the autoFixIssues loop, same as
// before this refactor). `newEdge` is the freshly-minted wire (or null) so
// the caller can fire the same cw:surge follow-up the original inline
// disconnected-fix loop did.
//
// `applied` (CDP-found edge case) — a disconnected node can have NO valid
// wiring candidate at all (e.g. a single Wait/Delay block dropped on an
// otherwise empty canvas — nothing else exists to wire it FROM), in which
// case this bails out having changed nothing, same as the original inline
// loop's own `if (!src) continue`. Every early-exit path returns the SAME
// nodes/edges references it was given (never a copy) precisely so `applied`
// can also be read as "did the reference change" — but an explicit flag
// keeps that contract obvious at call sites rather than relying on callers
// to know that convention. fixIssue uses this to keep the popover open (and
// skip a pointless history checkpoint) when a click genuinely couldn't fix
// anything, instead of trusting "was this the last row" blindly.
// ---------------------------------------------------------------------------
// WAVE 1 shared infra — valid TARGET candidates for the 'unused' fix below:
// every type that renders a real 'in' Handle. Trigger has none (graph
// schema); note/variantgroup/variant carry no edges at all (their own
// exemption comments on NEVER_DISCONNECTED_TYPES above explain why);
// UNUSED_CHECK_TYPES itself (params) never renders one either — spread in
// here so the SAME future taxonomy growth that extends the issue check
// above also, automatically, keeps this fix from ever wiring INTO one of
// those. WAVE 2 — Source/Audience joined the identical "no in-port"
// family, but as a `data.kind` split within the shared 'signal' type
// (isSignalSourceFamily, above) rather than a flat type Set entry — the
// unused-fix's own candidate filter checks that predicate directly
// alongside this Set instead, since Measure (the type's third kind) DOES
// have an in-port and must stay a legal wire-into target.
const NO_IN_PORT_TYPES = new Set(['trigger', 'note', 'variantgroup', 'variant', ...UNUSED_CHECK_TYPES])

function applySingleFix(issue, nodes, edges) {
  if (issue.kind === 'agent') {
    return {
      nodes: nodes.map((n) => (n.id === issue.nodeId ? { ...n, data: { ...n.data, agent: AUTOFIX_AGENT } } : n)),
      edges,
      newEdge: null,
      applied: true,
    }
  }
  if (issue.kind === 'description') {
    return {
      nodes: nodes.map((n) => {
        if (n.id !== issue.nodeId) return n
        const format = n.data?.format || 'Text'
        return { ...n, data: { ...n.data, description: AUTOFIX_DESCRIPTIONS[format] || 'One concise deliverable.' } }
      }),
      edges,
      newEdge: null,
      applied: true,
    }
  }
  // VARIANT STUDIO
  if (issue.kind === 'prompt') {
    return {
      nodes: nodes.map((n) => (n.id === issue.nodeId ? { ...n, data: { ...n.data, prompt: AUTOFIX_PROMPT } } : n)),
      edges,
      newEdge: null,
      applied: true,
    }
  }
  if (issue.kind === 'disconnected') {
    const node = nodes.find((n) => n.id === issue.nodeId)
    if (!node) return { nodes, edges, newEdge: null, applied: false }
    const targets = new Set(edges.map((e) => e.target))
    if (targets.has(node.id)) return { nodes, edges, newEdge: null, applied: false } // already wired (stale issue id)
    const usedOut = new Set(edges.map((e) => `${e.source}:${e.sourceHandle ?? 'out'}`))
    const candidates = nodes
      .filter((src) => src.id !== node.id && src.type !== 'stop' && !usedOut.has(`${src.id}:out`))
      .sort((a, b) => {
        // prefer sources to the LEFT, nearest first; then any free out
        const aLeft = a.position.x <= node.position.x ? 0 : 1
        const bLeft = b.position.x <= node.position.x ? 0 : 1
        if (aLeft !== bLeft) return aLeft - bLeft
        return Math.abs(node.position.x - a.position.x) - Math.abs(node.position.x - b.position.x)
      })
    const src = candidates[0]
    if (!src) return { nodes, edges, newEdge: null, applied: false } // nothing on the canvas to wire FROM
    const newEdge = { id: genId('edge'), source: src.id, sourceHandle: 'out', target: node.id, targetHandle: 'in', type: 'omni' }
    return { nodes, edges: [...edges, newEdge], newEdge, applied: true }
  }
  // WAVE 1 shared infra — mirror of the 'disconnected' branch just above:
  // wire OUT to the nearest free in-port on the RIGHT instead of in FROM
  // the left. "Free" here just means "has a real in-port to receive it" —
  // unlike a source's plain 'out' (capped at one edge, this function's own
  // `usedOut` bookkeeping above), a target's 'in' has no such cap (many-in
  // is legal throughout this app — this wave's own Gather is the clearest
  // example), so there's no equivalent "already used" set to build here.
  if (issue.kind === 'unused') {
    const node = nodes.find((n) => n.id === issue.nodeId)
    if (!node) return { nodes, edges, newEdge: null, applied: false }
    const sources = new Set(edges.map((e) => e.source))
    if (sources.has(node.id)) return { nodes, edges, newEdge: null, applied: false } // already wired (stale issue id)
    const candidates = nodes
      .filter((tgt) => tgt.id !== node.id && !NO_IN_PORT_TYPES.has(tgt.type) && !isSignalSourceFamily(tgt))
      .sort((a, b) => {
        // prefer targets to the RIGHT, nearest first — mirror of the
        // disconnected fix's own "prefer sources to the LEFT" ordering.
        const aRight = a.position.x >= node.position.x ? 0 : 1
        const bRight = b.position.x >= node.position.x ? 0 : 1
        if (aRight !== bRight) return aRight - bRight
        return Math.abs(a.position.x - node.position.x) - Math.abs(b.position.x - node.position.x)
      })
    const tgt = candidates[0]
    if (!tgt) return { nodes, edges, newEdge: null, applied: false } // nothing on the canvas to wire INTO
    const newEdge = { id: genId('edge'), source: node.id, sourceHandle: 'out', target: tgt.id, targetHandle: 'in', type: 'omni' }
    return { nodes, edges: [...edges, newEdge], newEdge, applied: true }
  }
  return { nodes, edges, newEdge: null, applied: false }
}

// ---------------------------------------------------------------------------
// Compiled-panel counts. SUBAGENTS is the distinct set of agents selected
// across Task nodes. KNOWLEDGE BASES / TOOLS / SKILLS / FILES fold in TWO
// sources per Task, as of COMPILED PANEL TRUTH PASS (PLAN.md):
//   1. chip-attachments the Task collected via its own +Knowledge base/
//      +Skill/+Tool/+File row (`data.attachments` isn't in PLAN's node-data
//      contract, so this reads it defensively and simply yields "—"
//      wherever a task hasn't set one);
//   2. the SELECTED AGENT's own declared `uses` (data/blocks.js MOCK_AGENTS,
//      READ-ONLY reference; kinds there are the uppercase TOOL/KNOWLEDGE/
//      SKILL tags — a different, C-local lowercase copy drives the AGENT
//      sub-card's own on-card "Uses" rows and never reaches here).
// The original cut deliberately left (2) out to match shot-2's reference
// panel pixel-for-pixel (KNOWLEDGE BASES/TOOLS/SKILLS all read 0 there even
// though its one selected agent has a TOOL use) — but Fable's audit called
// that out as the panel LYING BY OMISSION: pick "Omni Media Agent" and its
// own card shows a plan_mcp USES row while TOOLS sits at 0 two feet to the
// right. This is the "what will this session actually use" view (Bryan), so
// an agent's implied uses now count exactly like a manually-attached chip.
// Both sources land in the SAME Set per kind, so a use and a chip sharing a
// name — or two Tasks sharing an agent — still count once each
// ("distinct-by-name", same as the chip-only cut before it).
// ---------------------------------------------------------------------------
// COMFY ROUND (CP2, item 5) — "PARAM NODE": "params fold into a PARAMETERS
// row" (PLAN.md). One human-readable summary chip per params node on the
// canvas (not an aggregate across all of them — each node's own market/
// budget/window combo is a distinct set of values, so merging would blur
// which markets belong to which budget). Missing fields drop out of the
// join gracefully, mirroring FlowCanvas.jsx's own searchHaystack precedent
// for "most fields are usually empty on a fresh node."
function paramsSummaryText(data) {
  const parts = []
  if (data?.markets?.length) parts.push(data.markets.join(', '))
  if (data?.budget != null) parts.push(`$${Number(data.budget).toLocaleString()}`)
  const { start, end } = data?.window || {}
  if (start || end) parts.push(`${start || '—'}–${end || '—'}`)
  return parts.length ? parts.join(' · ') : 'No values set'
}

function computeCompiledCounts(nodes) {
  const subagents = new Set()
  const knowledgeBases = new Set()
  const tools = new Set()
  const skills = new Set()
  const files = new Set()
  // MODEL-AGNOSTIC POSTURE (PLAN.md "### QUEUED PHASE — MODEL FABRIC") —
  // "Compiled panel: MODELS row (distinct, from tasks' explicit picks +
  // generates)". A Task still on the default AUTO_MODEL_VALUE hasn't
  // "explicitly picked" anything, so it's excluded — same distinct-by-name
  // Set pattern as subagents/knowledgeBases/etc. above.
  const models = new Set()
  const params = []

  for (const node of nodes) {
    if (node.type === 'params') {
      params.push(paramsSummaryText(node.data))
      continue
    }
    // Generate nodes always carry a concrete model (no Auto concept for
    // them — see data/models.js), so every one of them contributes.
    if (node.type === 'generate') {
      if (node.data?.model) models.add(node.data.model)
      continue
    }
    if (node.type !== 'task') continue
    if (node.data?.model && node.data.model !== AUTO_MODEL_VALUE) models.add(node.data.model)
    if (node.data?.agent) {
      subagents.add(node.data.agent)
      const agent = MOCK_AGENTS.find((a) => a.name === node.data.agent)
      for (const use of agent?.uses || []) {
        if (!use?.name) continue
        if (use.kind === 'KNOWLEDGE') knowledgeBases.add(use.name)
        else if (use.kind === 'TOOL') tools.add(use.name)
        else if (use.kind === 'SKILL') skills.add(use.name)
      }
    }
    const attachments = Array.isArray(node.data?.attachments) ? node.data.attachments : []
    for (const a of attachments) {
      if (!a?.name) continue
      if (a.kind === 'Knowledge base') knowledgeBases.add(a.name)
      else if (a.kind === 'Tool') tools.add(a.name)
      else if (a.kind === 'Skill') skills.add(a.name)
      else if (a.kind === 'File') files.add(a.name)
    }
  }

  return {
    subagents: [...subagents],
    knowledgeBases: [...knowledgeBases],
    tools: [...tools],
    skills: [...skills],
    files: [...files],
    models: [...models],
    params,
  }
}

// ---------------------------------------------------------------------------
// MOTION PHASE — animated Tidy up (M3 item 2). `animatePositions` is a pure
// rAF tween: given the CURRENT nodes and dagre's TARGET layout (already
// computed by tidyLayout — this never re-runs dagre mid-animation), it
// interpolates every node's `position` from its current spot to its target,
// staggered by ascending target-x rank ("the machine organizes itself" —
// left-to-right, like the flow), and hands a fresh nodes array to `onFrame`
// every animation frame. `onDone` fires once every node has settled exactly
// on its target position (the final onFrame call snaps precisely, so no
// float-drift is left behind for later dagre/measurement passes to see).
// ---------------------------------------------------------------------------
function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2
}

function animatePositions(fromNodes, toNodes, { duration = 450, stagger = 25 } = {}, onFrame, onDone) {
  if (!toNodes.length) {
    onFrame(toNodes)
    onDone?.()
    return () => {}
  }

  const fromPositionById = new Map(fromNodes.map((n) => [n.id, n.position]))
  const rankedIds = toNodes
    .slice()
    .sort((a, b) => a.position.x - b.position.x)
    .map((n) => n.id)
  const delayById = new Map(rankedIds.map((id, i) => [id, i * stagger]))
  const totalDuration = (rankedIds.length - 1) * stagger + duration

  const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now())
  const start = now()
  let rafId = null

  function tick() {
    const elapsed = now() - start
    const frame = toNodes.map((target) => {
      const from = fromPositionById.get(target.id) ?? target.position
      const delay = delayById.get(target.id) ?? 0
      const local = Math.min(Math.max(elapsed - delay, 0), duration)
      const t = easeInOutCubic(duration === 0 ? 1 : local / duration)
      return {
        ...target,
        position: {
          x: from.x + (target.position.x - from.x) * t,
          y: from.y + (target.position.y - from.y) * t,
        },
      }
    })
    onFrame(frame)
    if (elapsed < totalDuration) {
      rafId = requestAnimationFrame(tick)
    } else {
      onFrame(toNodes) // exact final positions — no accumulated float drift
      onDone?.()
    }
  }

  rafId = requestAnimationFrame(tick)
  return () => {
    if (rafId != null) cancelAnimationFrame(rafId)
  }
}

// CONTEXT & CLIPBOARD (PLAN.md "## CONTEXT & CLIPBOARD — the last Comfy-menu
// gaps", item 1 — "Copy / Paste / Duplicate hotkeys"). VARIANT STUDIO's grid
// (a `variantgroup` frame + its `variant` children) is excluded from every
// clone path below: "variant FRAME copies as the generate node only (grids
// re-spawn on run — copying a live wall is scope creep, note in report)".
// The simplest sound reading of that line is implemented here — a
// variantgroup/variant caught up in a copy/duplicate is just DROPPED from
// the clone set entirely (the originating 'generate' node, if it's ALSO
// selected, still clones normally on its own merits; the grid it owns
// re-spawns from a real Run, same as today). Reported as a deviation.
const NON_CLONEABLE_TYPES = new Set(['variantgroup', 'variant'])

// Shared clone core for both Duplicate (⌘D — offset in place) and Paste
// (⌘V — offset to the viewport centre band, with cascade): fresh ids per
// node, INTERNAL wiring preserved ("edges where both ends are in the
// selection"), run residue stripped exactly like the old single-node
// cw:duplicate handler already did (this supersedes that handler — see its
// removal below). `computePosition(originalNode) -> {x,y}` lets each caller
// supply its own placement math without duplicating the id-remap/edge-
// filter logic twice.
function cloneNodesWithInternalEdges(nodeList, edgeList, computePosition) {
  const idMap = new Map()
  const clones = nodeList.map((n) => {
    const newId = genId(n.type)
    idMap.set(n.id, newId)
    const { runState: _rs, output: _out, answer: _ans, takenHandle: _th, ...cleanData } = n.data || {}
    return {
      id: newId,
      type: n.type,
      position: computePosition(n),
      data: structuredClone(cleanData),
      measured: {},
      selected: true, // the new copies become the active selection (Figma/Comfy convention) — drag them away immediately, or chain another ⌘D/⌘V off them.
    }
  })
  const clonedEdges = edgeList
    .filter((e) => idMap.has(e.source) && idMap.has(e.target))
    .map((e) => ({ ...e, id: genId('edge'), source: idMap.get(e.source), target: idMap.get(e.target) }))
  return { clones, clonedEdges }
}

// ---------------------------------------------------------------------------
// SUBGRAPHS — full spec (PLAN.md "## SUBGRAPHS — full spec (the closing
// flagship)"). Model: `task.data.steps = { nodes:[{id,title,kindTag?,
// sourceData?,position,runState?}], edges:[{id,source,target}] }` — a
// lightweight internal mini-flow that never touches the main React Flow
// node/edge arrays until Expand puts it back. Model-only helpers live here
// (module scope, next to slideClear/resolvePlacement below, which
// expandStepsToCanvas reuses); the context actions that call them live
// further down inside FlowStateProvider.
//
// "Convert to subgraph... not on triggers/notes/frames" — 'frame' is this
// schema's variantgroup/variant pair (VARIANT STUDIO's auto-generated grid
// furniture) — the identical exclusion NON_CLONEABLE_TYPES above already
// applies to copy/duplicate for the same structural reason, plus trigger/
// note (a subgraph's steps are workflow WORK; a trigger has nowhere to sit
// inside one — it's the thing that starts flows, never a step in one — and
// a note carries no handles/behavior to fold in).
export const SUBGRAPH_EXCLUDED_TYPES = new Set(['trigger', 'note', 'variantgroup', 'variant'])

// "240px wide" (PLAN.md "### Step-cards") — the seed trio's own line-layout
// pitch; SubgraphStage.jsx's ghost-add reuses this same constant so a
// manually-added step lands the identical distance from its neighbor.
export const STEP_CARD_W = 240
export const STEP_GAP_X = 110
export const STEP_PITCH_X = STEP_CARD_W + STEP_GAP_X

// "First entry into a stepless task seeds three editable steps wired in a
// line: Gather -> Draft -> Check (plausible defaults, board-content voice),
// one checkpoint." Fresh ids every call (genId, this file's own generator)
// so seeding two different tasks — or re-seeding after every step was
// deleted back to zero — can never collide.
function seedTaskSteps() {
  const gatherId = genId('step')
  const draftId = genId('step')
  const checkId = genId('step')
  return {
    nodes: [
      { id: gatherId, title: 'Gather', position: { x: 0, y: 0 } },
      { id: draftId, title: 'Draft', position: { x: STEP_PITCH_X, y: 0 } },
      { id: checkId, title: 'Check', position: { x: STEP_PITCH_X * 2, y: 0 } },
    ],
    edges: [
      { id: genId('stepedge'), source: gatherId, target: draftId },
      { id: genId('stepedge'), source: draftId, target: checkId },
    ],
  }
}

// Expand's per-step node minting ("from sourceData when present, else
// minted by kindTag/task-default" — PLAN.md "### Convert / expand"). A step
// only ever carries a kindTag WITHOUT sourceData if something outside this
// file's own convertToSubgraph ever mints one that way (it never does today
// — the two fields are always written together there) — this still
// resolves a sane default node for that case defensively, the same posture
// applySingleFix/resolveNodeBox take elsewhere in this file rather than
// trusting an invariant blindly.
const KIND_TAG_TO_PALETTE_ID = {
  task: 'task',
  human: 'human',
  // THE SPLIT — same defensive footing as `human` just above, for the new
  // dialogue type (data/blocks.js's own 'checkin' palette id).
  checkin: 'checkin',
  output: 'output-text',
  logic: 'if',
  wait: 'wait',
  stop: 'stop',
  generate: 'generate',
  note: 'note',
  params: 'params',
}

function defaultNodeForStep(step) {
  if (step.sourceData) {
    return { type: step.kindTag || 'task', data: structuredClone(step.sourceData) }
  }
  const item = paletteItemById(KIND_TAG_TO_PALETTE_ID[step.kindTag] || 'task')
  const data = item ? item.makeData() : makeTaskData()
  if (step.title && 'title' in data) data.title = step.title
  return { type: item?.nodeType || 'task', data }
}

// DELIVERABLES A+C (PLAN.md "## DELIVERABLES A+C — the record and its
// gallery") — "two surfaces may only exist as TWO VIEWS OF ONE RECORD —
// same store, same language, mutual awareness — never two things that both
// 'show outputs'" (the filmstrip-death lesson, PLAN.md verbatim). These two
// pure helpers used to live only in CompiledPanel.jsx (view A); moved here,
// alongside `resolveNodeBox` above, so view A (CompiledPanel.jsx) and view C
// (DeliverablesShelf.jsx) both import the SAME row-shape logic instead of
// each carrying its own copy that could silently drift. Unlike download.js's
// own private `nodeNumberToken` mirror (that file's header comment: a tiny
// per-seam helper is fine to duplicate rather than export across a SEAM
// boundary) — CompiledPanel.jsx and DeliverablesShelf.jsx are not different
// seams, they're the two views of this one feature, so this dispatch's own
// "share, do not fork" instruction wins over that general precedent.
export function nodeNumberToken(seq) {
  const n = Number.isFinite(seq) ? seq + 1 : 1
  return String(Math.max(1, n)).padStart(2, '0')
}

// Gallery captions name the THING, not the node that made it (Bryan: "i dont
// like how these are being labeled in the deliverables panel its confusing").
// Two faults in the old `NN · Format` caption:
//   1. The leading step number is canvas bookkeeping. In a row of thumbs it
//      reads as a count or a quantity ("12 · Graphic  14 · Teams" scans like
//      a tally), and it is the first thing the eye hits — so the label opens
//      on the least meaningful token it carries.
//   2. OUTPUT_FORMATS mixes vocabularies: Graphic/Video/Doc are artifact
//      KINDS while Teams/Email are DESTINATIONS. Side by side in one column
//      they look like the same category and aren't, which is the actual
//      confusion.
// This maps every format to one consistent noun phrase — what you'd call the
// file when you handed it to someone — so the whole column reads as things.
// Unlisted/custom formats pass through unchanged rather than being forced
// into a name this map never anticipated.
const DELIVERABLE_NAMES = {
  Email: 'Email',
  Teams: 'Teams post',
  Text: 'Copy',
  Graphic: 'Graphic',
  Video: 'Video',
  Audio: 'Audio',
  Presentation: 'Deck',
  Doc: 'Document',
  Spreadsheet: 'Spreadsheet',
  'Templated Output': 'Templated output',
}

export function deliverableName(format) {
  return DELIVERABLE_NAMES[format] || format || 'Deliverable'
}

// One descriptor shape, fed to a row/thumb's own download button AND the
// head row's "Download all" in EITHER view — same object download.js's
// `downloadArtifact`/`downloadAllArtifacts` already expect, built straight
// off the node's CURRENT version pointer (`data.output`, never a browsed/
// older one — that concept only exists on OutputNode's own card).
export function deliverableDescriptor(node) {
  const output = node.data?.output || {}
  return {
    nodeId: node.id,
    format: output.format || node.data?.format,
    content: output.content || '',
    seed: output.seed ?? 0,
    poster: !!output.poster,
    seq: node.data?.seq,
    // BATCH MATRIX (PLAN.md "## BATCH MATRIX") — a batch output's `data.
    // output.assets` (run/engine.js's `case 'output':`, N seeded
    // `{seed, aspect, imageUrl?, imageMime?}` items) forwarded through
    // undefined-safe, exactly like every other optional field here — a
    // non-batch output's descriptor is byte-identical to before this
    // phase. The matrix-mode UI (ResultsNode.jsx) reads this to render the
    // grid + "N images" volume line instead of the plain single-row shape.
    assets: output.assets,
  }
}

export function FlowStateProvider({ children }) {
  const [boot] = useState(getInitialFlow)
  const [rawNodes, setRawNodes, onNodesChange] = useNodesState(boot.flow.nodes)
  const [rawEdges, setEdges, onEdgesChange] = useEdgesState(boot.flow.edges)
  const { fitView, screenToFlowPosition, setCenter, getZoom, setViewport } = useReactFlow()

  // Flow-space coordinate currently at the centre of the visible canvas —
  // the landing spot for anything added without an explicit drop point.
  const viewportCentre = useCallback(() => {
    const pane = document.querySelector('#workflow-root .react-flow')
    if (!pane) return { x: 0, y: 0 }
    const r = pane.getBoundingClientRect()
    // Centre of the VISIBLE band, not of the pane. The compiled panel floats
    // over the pane's right side, so the pane's own midpoint sits ~144px
    // under the glass — a block landing there had its whole right edge, and
    // with it the source handle you connect from, hidden behind the panel
    // (Bryan: "how am I supposed to connect these two nodes?"). Same
    // --cw-panel-w the instructions card centres on, so both agree on where
    // the middle of the workspace is, open or collapsed.
    const root = document.getElementById('workflow-root')
    const panelW = root
      ? parseFloat(getComputedStyle(root).getPropertyValue('--cw-panel-w')) || 288
      : 288
    return screenToFlowPosition({ x: r.x + (r.width - panelW) / 2, y: r.y + r.height / 2 })
  }, [screenToFlowPosition])

  // Glide the board so `point` sits dead centre — used after a centre-add so
  // the new thing settles into the middle instead of appearing off to one side.
  // `setCenter` centres on the PANE, and the compiled panel floats over the
  // pane's right side — so a glide that looks centred actually parks its
  // target ~144px under the glass. Shifting the target right by half the
  // panel (in flow units, hence the /zoom) lands it in the middle of the
  // band you can actually see. Every centring path in the app now agrees on
  // that definition: this, viewportCentre above, and the instructions card.
  const glideTo = useCallback((point) => {
    setTimeout(() => {
      const zoom = getZoom() || 1
      const root = document.getElementById('workflow-root')
      const panelW = root
        ? parseFloat(getComputedStyle(root).getPropertyValue('--cw-panel-w')) || 288
        : 288
      setCenter(point.x + panelW / 2 / zoom, point.y, { zoom, duration: 420 })
    }, 40)
  }, [setCenter, getZoom])

  // CANVAS-NATIVE DELIVERABLES — "the camera then glides to FIT THE OUTPUT
  // NODES that produced versions this run (panel-aware fit, existing glide
  // language)" (PLAN.md "### 2"). glideTo's own panel-offset correction
  // (its comment just above) generalized from a single point to a whole
  // BOX: same target-shift math, plus a zoom computation so every delivered
  // output lands in view together, not just centred at whatever zoom
  // happened to be current. FILL (0.72) matches fitView's own padding:0.2
  // density (RF's `1/(1+2p)`) — the same fill fraction this file's DEMO
  // TOUR boot-fit above derives for the identical "real, panel-excluded
  // budget" reason; capped at zoom 1 (tidyUp/loadFlow's own maxZoom:1
  // precedent) so a single delivered output never gets punched in past
  // 100%. Reduced motion: an instant jump, never a skip outright — "the
  // GLIDE is skipped (jump cut)", not the reposition itself.
  const glideToBox = useCallback((box) => {
    if (!box || !(box.w > 0) || !(box.h > 0)) return
    setTimeout(() => {
      const pane = document.querySelector('#workflow-root .react-flow')
      if (!pane) return
      const r = pane.getBoundingClientRect()
      if (!(r.width > 0) || !(r.height > 0)) return
      const root = document.getElementById('workflow-root')
      const panelW = root
        ? parseFloat(getComputedStyle(root).getPropertyValue('--cw-panel-w')) || 288
        : 288
      // DELIVERABLES A+C — "Completion glide accounts for the shelf's
      // height when fitting delivered outputs (read the var)" (PLAN.md).
      // Generalizes this function's own panelW correction just above from a
      // RIGHT-edge obstruction to a SECOND, BOTTOM-edge one: the shelf
      // (when open) covers --cw-shelf-h px of the pane's bottom exactly
      // like the panel covers panelW px of its right, so the real fit
      // budget shrinks in BOTH dimensions and the target's vertical
      // component shifts by the same "+half-the-obstruction/zoom" shape the
      // horizontal one already uses (see that var's own comment for the
      // sign reasoning — this mirrors it exactly, top/bottom instead of
      // left/right). Reads 0 whenever the shelf is closed/never opened (the
      // custom property is unset), so a shelf-less run's own fit is
      // untouched byte-for-byte.
      const shelfH = root
        ? parseFloat(getComputedStyle(root).getPropertyValue('--cw-shelf-h')) || 0
        : 0
      const visibleW = r.width - panelW
      const visibleH = r.height - shelfH
      if (!(visibleW > 0) || !(visibleH > 0)) return
      const FILL = 0.72
      // CDP-found (verified against the production build, headless): React
      // Flow's setCenter silently no-ops the ENTIRE transition — viewport
      // left exactly where it was — when the target zoom falls outside the
      // <ReactFlow> instance's own configured minZoom/maxZoom (FlowCanvas.
      // jsx's ZOOM_MIN/ZOOM_MAX, 0.25/2), rather than clamping just the
      // zoom component. A spread-out delivered-outputs box (a template with
      // generous col/row spacing, e.g. Social blast's 6 outputs) can easily
      // compute well under 0.25 once --cw-shelf-h ALSO shrinks the fit
      // budget on top of --cw-panel-w — silently killing the whole glide,
      // not just cropping it tighter. Floored explicitly so the glide
      // ALWAYS actually moves; ZOOM_MIN mirrored as a local constant rather
      // than imported (FlowCanvas.jsx already imports FROM this file, so
      // importing back would be circular — same "small constant, fine to
      // duplicate" precedent download.js's own header comment documents).
      const ZOOM_MIN = 0.25
      const zoom = Math.max(ZOOM_MIN, Math.min(1, (visibleW * FILL) / box.w, (visibleH * FILL) / box.h))
      const point = { x: box.x + box.w / 2, y: box.y + box.h / 2 }
      setCenter(point.x + panelW / 2 / zoom, point.y + shelfH / 2 / zoom, { zoom, duration: prefersReducedMotion() ? 0 : 420 })
    }, 40)
  }, [setCenter])

  // ---------------------------------------------------------------------
  // DEMO TOUR — "land at sensible zoom/centre (fitView on boot for these)"
  // (PLAN.md "## DEMO TOUR"). Every OTHER `?flow=` deep-link (and a bare
  // open/refresh) keeps the FROZEN zoom-1 boot — `defaultViewport
  // {x:60,y:40,zoom:1}` on `<ReactFlow>`, no `fitView` prop (FlowCanvas.jsx,
  // "## UI ELEVATION PHASE" -> "### E3": "do not reintroduce fit-on-mount/
  // open"). These four staged states are wider than that fixed viewport was
  // ever sized for (?flow=wall's 10-card grid, ?flow=studio/meeting's
  // 10-node spine) — a plain zoom-1 boot would clip most of the story under
  // the palette/panel, which is exactly the "nothing clipped under panels"
  // failure the DESIGN BAR gate calls out. Scoped to these four params only;
  // every other flow's pixel-faithful zoom-1 boot is untouched.
  //
  // Fires once, off whichever of the two paths actually applies:
  //   - the common case: index.html's toggle IIFE (a synchronous CLASSIC
  //     <script>, runs during HTML parsing, well before this deferred
  //     module) has ALREADY added `is-open` to #workflowOverlay — and
  //     already dispatched `omni:workflow-toggle` — by the time this effect
  //     first runs. Same race `App.jsx`'s `useOverlayOpen()` reads around via
  //     its own lazy `useState` DOM check (see that function's comment) —
  //     mirrored here rather than trusting a `omni:workflow-toggle` listener
  //     alone, which would otherwise never fire again for an already-open
  //     overlay and silently skip every one of these four states.
  //   - the defensive fallback: if the overlay is somehow not open yet
  //     (future timing change, or this flow got here some other way), wait
  //     for the real toggle event instead.
  // Same deferred-settle-timer pattern (a wait before doing an imperative
  // viewport read/write) as every other fitView call in this file — here
  // with a longer buffer since this is a fresh mount racing FlowCanvas's
  // own mount-while-open + heal pass (Integration notes #1/#4), not an
  // in-session mutation of an already-measured graph.
  //
  // CDP-found bug (verified against the production build, headless, two
  // rounds): a bare `fitView()` fits nodes to the react-flow PANE's full
  // width — it has no idea the compiled panel (`.cw-panel`, 288px,
  // `--cw-panel-w`) is a translucent GLASS surface floating on TOP of the
  // pane's right edge (UI ELEVATION E1's "wings" chrome, `backdrop-filter:
  // blur(12px) saturate(1.15)`). Content landing there doesn't just get
  // clipped — it renders as a smeared, blurred ghost bleeding through the
  // glass. Round 1 tried "fitView, then pan left by panelW/2" (mirroring
  // viewportCentre/glideTo's own correction for a single POINT below) — but
  // fitView had already consumed most of its own padding fitting content to
  // the pane's FULL width, so a wide graph (?flow=wall's 10-card grid) had
  // no spare margin left to absorb a pan-only correction: capping the shift
  // to whatever margin actually existed (so it could never newly clip the
  // LEFT side) just left the right side still short. A pan can only ever
  // trade margin from one side to the other — when the content is wide
  // enough to want ALL of both sides' margin, only a SMALLER zoom creates
  // more of it. So this computes the fit from scratch against the true
  // visible band (pane width minus the panel), off REAL measured node
  // extents (top-level nodes only — a grid child's `.position` is relative
  // to its parent frame, not absolute, per resolveNodeBox's own comment;
  // the frame itself already carries the grid's full footprint via its own
  // measured `data.width/height`, so nothing is lost by skipping children).
  // FILL (0.72) reproduces fitView's own `padding:0.2` density — RF's
  // padding fraction `p` scales content by `1/(1+2p)` of the fit dimension,
  // and `1/(1+2*0.2) = 0.7142..` — same fit "feel" these four graphs were
  // designed against, just measured against the narrower real budget.
  // ---------------------------------------------------------------------
  const TOUR_FIT_PARAMS = useMemo(() => new Set(['studio', 'wall', 'broken', 'meeting']), [])
  useEffect(() => {
    if (typeof window === 'undefined') return undefined
    const bootParams = new URLSearchParams(window.location.search)
    const flowParam = bootParams.get('flow')
    // GATEWAY RUN Phase Q — a `?template=` boot (getInitialFlow above) is the
    // exact same shape of problem these four tour states solved: real
    // templates (9-node launch-with-guardrails, 7-node decide-and-direct)
    // are wider than the frozen zoom-1 boot was ever sized for. Same fix,
    // same settle math, zero new code below this line — just widening which
    // boots this effect fires for.
    if (!TOUR_FIT_PARAMS.has(flowParam) && !bootParams.has('template')) return undefined

    let cancelled = false
    let settleTimer = null
    function doFit() {
      // CDP-found bug (verified against the production build, headless): a
      // 150ms settle wait (this file's usual post-mutation buffer, e.g.
      // loadFlow's own fitView) still measured nodes MID materialize-in
      // (nodes.css: `animation-delay: calc(var(--cw-seq,0) * 55ms)`,
      // duration `--cw-d-3` 420ms) — a card that hasn't finished its
      // spring-scale entrance reports a smaller `getBoundingClientRect()`
      // than its settled size, so the fit computed below (real DOM
      // measurement, see its own comment) undershot the TRUE footprint by
      // exactly the still-animating margin, leaving the widest content
      // (?flow=wall's grid) still poking behind the panel once everything
      // actually finished landing. Worst case across these four graphs'
      // highest top-level `data.seq` (?flow=meeting, ~10) finishes at
      // 10*55 + 420 ≈ 970ms — 1100ms gives that comfortable headroom. A
      // slower boot-only settle for four hidden demo deep-links is a fair
      // trade for a fit that's actually correct once it lands.
      settleTimer = setTimeout(() => {
        if (cancelled) return
        const paneEl = document.querySelector('#workflow-root .react-flow')
        if (!paneEl) return
        const paneRect = paneEl.getBoundingClientRect()
        if (!paneRect.width || !paneRect.height) return

        const root = document.getElementById('workflow-root')
        const panelW = root
          ? parseFloat(getComputedStyle(root).getPropertyValue('--cw-panel-w')) || 288
          : 288

        // CDP-found bug (verified against the production build, headless):
        // sizing the box off `node.measured.width/height` (React Flow's own
        // ResizeObserver-synced bookkeeping) at this settle point undershot
        // the graph's TRUE rendered footprint for ?flow=wall by ~300 flow
        // units — enough that the resulting "fit" still ran the grid's right
        // edge behind the panel. Rather than chase exactly which node's
        // `measured` value lagged and by how long, this reads the ACTUAL
        // painted geometry straight off the DOM instead — authoritative by
        // construction, no ResizeObserver-timing question to get wrong.
        // Top-level node IDS still come from nodesRef (a node's `id` is
        // correct from its very first render, unlike its size) — filtered
        // exactly like the `measured`-based version was, and for the same
        // reason: a grid child's `.position` is relative to its parent
        // frame, not absolute (resolveNodeBox's own comment), so mixing its
        // real screen rect into the SAME bbox as top-level absolute-
        // positioned nodes would double-count the frame it already sits
        // inside of.
        const vpEl = document.querySelector('#workflow-root .react-flow__viewport')
        if (!vpEl) return
        const transformMatch = vpEl.style.transform.match(
          /translate\(([-\d.]+)px,\s*([-\d.]+)px\)\s*scale\(([-\d.]+)\)/,
        )
        const curX = transformMatch ? parseFloat(transformMatch[1]) : 0
        const curY = transformMatch ? parseFloat(transformMatch[2]) : 0
        const curZoom = transformMatch ? parseFloat(transformMatch[3]) : 1
        if (!curZoom) return

        const topLevelIds = new Set(nodesRef.current.filter((n) => !n.parentId).map((n) => n.id))
        if (!topLevelIds.size) return
        let minX = Infinity
        let minY = Infinity
        let maxX = -Infinity
        let maxY = -Infinity
        document.querySelectorAll('#workflow-root .react-flow__node').forEach((el) => {
          const id = el.getAttribute('data-id')
          if (!topLevelIds.has(id)) return
          const r = el.getBoundingClientRect()
          if (!r.width && !r.height) return
          // Screen rect -> flow space, via the CURRENT (known) viewport
          // transform — the exact inverse of how React Flow paints a node's
          // `position` in the first place.
          minX = Math.min(minX, (r.x - curX) / curZoom)
          minY = Math.min(minY, (r.y - curY) / curZoom)
          maxX = Math.max(maxX, (r.x + r.width - curX) / curZoom)
          maxY = Math.max(maxY, (r.y + r.height - curY) / curZoom)
        })
        if (!Number.isFinite(minX) || !Number.isFinite(maxX)) return
        const boxW = maxX - minX
        const boxH = maxY - minY
        if (!(boxW > 0) || !(boxH > 0)) return

        // FILL (0.72) reproduces fitView's own `padding:0.2` density — RF's
        // padding fraction `p` scales content to `1/(1+2p)` of the fit
        // dimension, and `1/(1+2*0.2) = 0.7142..` — same fit "feel" these
        // four graphs were designed against, just measured against the
        // narrower real (panel-excluded) budget.
        const FILL = 0.72
        const visibleW = paneRect.width - panelW
        const zoom = Math.min(1, (visibleW * FILL) / boxW, (paneRect.height * FILL) / boxH)

        // CDP-found bug (verified against the production build, headless):
        // `setViewport`'s `x`/`y` are relative to the PANE's own origin —
        // the `translate()` this ultimately becomes is on `.react-flow__
        // viewport`, a child of the pane, so the browser adds `paneRect.x/
        // y` on top of whatever's passed here automatically. Prefixing the
        // target with `paneRect.x`/`paneRect.y` (as if converting to page-
        // absolute screen coordinates, the convention `screenToFlowPosition
        // ` and `getBoundingClientRect()` both actually use) double-counted
        // the pane's own offset — every node landed paneRect.x too far
        // right and paneRect.y too far down, which is exactly the residual
        // panel overlap that survived both earlier fixes (the DOM-measured
        // box was correctly SIZED, just wrongly PLACED).
        const bboxCenterX = minX + boxW / 2
        const bboxCenterY = minY + boxH / 2
        const targetX = visibleW / 2 - bboxCenterX * zoom
        const targetY = paneRect.height / 2 - bboxCenterY * zoom

        setViewport({ x: targetX, y: targetY, zoom }, { duration: 300 })
      }, 1100)
    }

    const alreadyOpen = document.getElementById('workflowOverlay')?.classList.contains('is-open')
    if (alreadyOpen) {
      doFit()
      return () => {
        cancelled = true
        clearTimeout(settleTimer)
      }
    }

    function onToggle(e) {
      if (!e.detail?.open) return
      window.removeEventListener('omni:workflow-toggle', onToggle)
      doFit()
    }
    window.addEventListener('omni:workflow-toggle', onToggle)
    return () => {
      cancelled = true
      clearTimeout(settleTimer)
      window.removeEventListener('omni:workflow-toggle', onToggle)
    }
    // CDP-found bug (verified against the production build, headless): an
    // exhaustive [setViewport, TOUR_FIT_PARAMS] dep array re-ran this effect
    // on every one of FlowStateProvider's many renders in the first ~150ms
    // after mount (measurement/heal-pass settling triggers several) —
    // `useReactFlow()`'s returned functions are not reference-stable across
    // renders in this installed @xyflow/react version, so each re-run's
    // cleanup cancelled the PREVIOUS run's still-pending settle timer before
    // it ever fired, and the replacement timer got cancelled the same way by
    // the next render, on and on — the fit silently never happened. Empty-
    // array/boot-only is correct here on purpose: everything this effect
    // reads (`setViewport`, the DOM, `location.search`) is a stable-enough
    // imperative API for the life of this provider, and the whole point is
    // "once, at boot".
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Always-fresh reads for event-handler closures (avoids stale-closure bugs
  // without having to rebuild callbacks on every nodes/edges change).
  const nodesRef = useRef(rawNodes)
  const edgesRef = useRef(rawEdges)
  nodesRef.current = rawNodes
  edgesRef.current = rawEdges

  // ---- RUN PHASE — undo/redo history (R1.3) -------------------------------
  // Stacks live in refs (not state) since pushing one is never, by itself,
  // supposed to cause a render — every call site below pairs a push with a
  // real nodes/edges mutation that already triggers one, and `canUndo`/
  // `canRedo` are read straight off these refs during render (see the
  // `value` object), so they're always correct as of whatever render they're
  // read in without a dedicated force-update counter.
  const undoStackRef = useRef([])
  const redoStackRef = useRef([])
  // Caches the pre-drag snapshot the instant a drag starts (see the header
  // comment's note on why drag-stop can't just snapshot "current state").
  const dragSnapshotRef = useRef(null)

  const captureSnapshot = useCallback(() => snapshotGraph(nodesRef.current, edgesRef.current), [])

  const pushSnapshot = useCallback((snapshot) => {
    undoStackRef.current = [...undoStackRef.current, snapshot].slice(-MAX_HISTORY)
    redoStackRef.current = []
  }, [])

  // Call BEFORE mutating — captures "state as it is right now", which is
  // exactly what undo should restore to once this action lands.
  const pushHistory = useCallback(() => pushSnapshot(captureSnapshot()), [captureSnapshot, pushSnapshot])

  // Wraps the raw useNodesState/useEdgesState change handlers so drag-stop
  // and delete (Backspace/Delete, or any RF-internal removal) become history
  // checkpoints with ZERO changes to FlowCanvas.jsx — it already calls
  // `onNodesChange`/`onEdgesChange` straight from context, and these are
  // exposed under those exact same keys in the `value` object below.
  const trackedOnNodesChange = useCallback(
    (changes) => {
      const dragStarting =
        dragSnapshotRef.current === null && changes.some((c) => c.type === 'position' && c.dragging === true)
      if (dragStarting) dragSnapshotRef.current = captureSnapshot()

      if (changes.some((c) => c.type === 'remove')) pushHistory()

      onNodesChange(changes)

      const dragStopping = changes.some((c) => c.type === 'position' && c.dragging === false)
      if (dragStopping && dragSnapshotRef.current) {
        pushSnapshot(dragSnapshotRef.current)
        dragSnapshotRef.current = null
      }
    },
    [onNodesChange, captureSnapshot, pushHistory, pushSnapshot],
  )

  const trackedOnEdgesChange = useCallback(
    (changes) => {
      if (changes.some((c) => c.type === 'remove')) pushHistory()
      onEdgesChange(changes)
    },
    [onEdgesChange, pushHistory],
  )

  const undo = useCallback(() => {
    const stack = undoStackRef.current
    if (!stack.length) return
    const snapshot = stack[stack.length - 1]
    undoStackRef.current = stack.slice(0, -1)
    redoStackRef.current = [...redoStackRef.current, captureSnapshot()].slice(-MAX_HISTORY)
    setRawNodes(normalizeNodes(snapshot.nodes))
    setEdges(snapshot.edges)
  }, [captureSnapshot])

  const redo = useCallback(() => {
    const stack = redoStackRef.current
    if (!stack.length) return
    const snapshot = stack[stack.length - 1]
    redoStackRef.current = stack.slice(0, -1)
    undoStackRef.current = [...undoStackRef.current, captureSnapshot()].slice(-MAX_HISTORY)
    setRawNodes(normalizeNodes(snapshot.nodes))
    setEdges(snapshot.edges)
  }, [captureSnapshot])

  const canUndo = undoStackRef.current.length > 0
  const canRedo = redoStackRef.current.length > 0

  // ---------------------------------------------------------------------
  // COMMENTS PHASE — Figma-style canvas comments (PLAN.md "## COMMENTS
  // PHASE"). Pins anchor to FLOW coordinates (x/y), not to a node, and live
  // in THIS provider — mounted above the overlay gate in main.jsx — so a
  // thread survives closing/reopening the builder. No persistence (matches
  // the rest of the graph: a refresh always resets, by design). Deliberately
  // NOT touched by pushHistory/computeIssues/computeCompiledCounts: comments
  // are not part of undo history and don't affect the compiled panel.
  //
  // DEMO TOUR — lazy-initialized from getInitialComments() (above) instead of
  // a bare `[]`, so `?flow=meeting` boots with its 3 seeded threads already
  // placed; every other boot path (including every other `?flow=`) still
  // gets the untouched empty array that function returns for them.
  // ---------------------------------------------------------------------
  const [comments, setComments] = useState(getInitialComments)
  const [commentMode, setCommentMode] = useState(false)
  const [activeCommentId, setActiveCommentId] = useState(null)

  const addComment = useCallback(({ x, y, text }) => {
    const id = genId('comment')
    setComments((cs) => [
      ...cs,
      { id, x, y, author: CURRENT_USER, text, at: new Date().toISOString(), resolved: false, replies: [] },
    ])
    // The just-posted thread stays open (Figma keeps you looking at what you
    // wrote) — the composer that made this call clears itself separately.
    setActiveCommentId(id)
    return id
  }, [])

  const addReply = useCallback((id, text) => {
    const reply = { id: genId('reply'), author: CURRENT_USER, text, at: new Date().toISOString() }
    setComments((cs) => cs.map((c) => (c.id === id ? { ...c, replies: [...c.replies, reply] } : c)))
  }, [])

  // "Resolved threads: pin drops to a muted state and the thread card
  // collapses" (PLAN.md) — read as: toggling resolve always closes whatever
  // card is currently open for it; the (now muted, for resolve, or restored,
  // for reopen) pin is still there to click back open any time.
  const toggleResolved = useCallback((id) => {
    setComments((cs) => cs.map((c) => (c.id === id ? { ...c, resolved: !c.resolved } : c)))
    setActiveCommentId((cur) => (cur === id ? null : cur))
  }, [])

  const deleteComment = useCallback((id) => {
    setComments((cs) => cs.filter((c) => c.id !== id))
    setActiveCommentId((cur) => (cur === id ? null : cur))
  }, [])

  // MOTION PHASE — bumped by loadInstructions/clearFlow only (never by
  // ordinary edits). FlowCanvas.jsx keys its inner <ReactFlow> stage on this,
  // forcing a full remount so the materialize cascade (M2) and edge draw-on
  // (M1) always replay on a graph swap — needed because data/samples.js
  // reuses stable ids (e.g. `trigger-1`) across samples, which React would
  // otherwise just reconcile in place with no fresh mount to animate. Cancel
  // handle for any in-flight animated Tidy up, so a swap or a second Tidy up
  // click can't race a still-running tween.
  const [swapKey, setSwapKey] = useState(0)
  // PLATFORM CHROME ("### 3 — Session Workflows library") — "state.jsx gains
  // `savedWorkflows` (array, session ref/state — NEVER localStorage)". Plain
  // useState, not a ref: WorkflowsLibrary.jsx renders this list directly, so
  // it needs to be reactive the same way `swapKey`/`rawNodes` already are.
  // Gone on refresh by construction (nothing here ever touches storage) —
  // satisfies the standing refresh-resets doctrine for free.
  const [savedWorkflows, setSavedWorkflows] = useState([])
  const tidyAnimRef = useRef(null)
  const cancelTidyAnim = useCallback(() => {
    if (tidyAnimRef.current) {
      tidyAnimRef.current()
      tidyAnimRef.current = null
    }
  }, [])

  const numberedNodes = useMemo(() => renumber(rawNodes, rawEdges), [rawNodes, rawEdges])
  const issues = useMemo(() => computeIssues(numberedNodes, rawEdges), [numberedNodes, rawEdges])
  const counts = useMemo(() => computeCompiledCounts(numberedNodes), [numberedNodes])

  // ---- RUN PHASE — run engine wiring (R1.1/R1.2) --------------------------
  // Global tri-state is DERIVED, not a separate flag: 'paused' if any node is
  // currently waiting on a human, else 'running' if any node is mid-beat,
  // else 'idle'. Since every patch the runner makes goes through
  // `patchNodeData` (a real setRawNodes call), this can never drift out of
  // sync with what the engine actually did — "runState global derives from
  // engine" (PLAN.md R1.2).
  const runState = useMemo(() => {
    if (rawNodes.some((n) => n.data?.runState === 'paused')) return 'paused'
    if (rawNodes.some((n) => n.data?.runState === 'queued' || n.data?.runState === 'running')) return 'running'
    return 'idle'
  }, [rawNodes])
  const runStateRef = useRef(runState)
  runStateRef.current = runState

  // Graph run schema's other named event (PLAN.md "Events: ... `cw:run-state
  // {detail:{running:boolean}}`") — no seam currently listens for it (R4's
  // header controls read `runState` straight off context instead, which is
  // the more robust path within React-land), but it's part of the "all
  // seams" contract and cheap to keep honest for anything outside the tree
  // that might want it later. Fires only on an idle<->active transition, not
  // on every intermediate queued/running/paused/done tick.
  const runInFlight = runState !== 'idle'
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('cw:run-state', { detail: { running: runInFlight } }))
  }, [runInFlight])

  // ---------------------------------------------------------------------
  // COMFY ROUND (CP2, item 2) — RUN METER. Session-local run budget (PLAN.md:
  // "12 runs/session ... session-local, resets on refresh") — plain
  // useState, no persistence, matching this app's own "refresh always
  // resets" posture for the graph/comments/etc. (see this file's header
  // comment on getInitialFlow). `runsRemainingRef` mirrors it for the same
  // reason `runStateRef` exists just above: the cw:run-generate listener
  // further down lives inside an empty-deps useEffect, so it needs an
  // always-current read rather than a value closed over at mount.
  // `consumeRun` is called by all three run-shaped entry points — the
  // header Run button (runWorkflow), NODE TOOLBAR V2's "Run from here"
  // (runFromNode), and GenerateNode's per-card "Run Model" (the
  // cw:run-generate listener below) — each of which already early-returns
  // while busy or (now) while the meter reads empty, so every decrement here
  // corresponds to a run that is actually about to happen, never a
  // speculative one.
  // ---------------------------------------------------------------------
  const [runsRemaining, setRunsRemaining] = useState(MAX_RUNS)
  const runsRemainingRef = useRef(runsRemaining)
  runsRemainingRef.current = runsRemaining
  // MODEL-AGNOSTIC POSTURE (PLAN.md "### QUEUED PHASE — MODEL FABRIC") —
  // "Run meter... prices by tier: frontier runs decrement 2, fast 1... now
  // provider-aware." `cost` defaults to 1 (every prior call site — and any
  // future one that doesn't care about tiers) keeps its exact old behavior;
  // the three run-shaped entry points below now compute a real cost via
  // data/models.js's runCostForModel(s) before calling this.
  // RUN METER retired (Bryan: "get rid of the runs left thing") — the
  // header meter and RUNS row are gone and runs never deplete. consumeRun
  // stays as a no-op so the three run entry points that call it need no
  // edits; runsRemaining stays exported (pinned at MAX) so every
  // outOfRuns gate downstream is permanently false.
  const consumeRun = useCallback(() => {}, [])

  const patchNodeData = useCallback((id, patch) => {
    setRawNodes((nds) => nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...patch } } : n)))
  }, [])

  // Cross-seam contract (PLAN.md "Graph run schema"): `cw:run-edge
  // {detail:{source,target,sourceHandle}}` — the SAME shape `cw:surge`
  // already uses, so M1's OmniEdge can match against it with its existing
  // (source,target,sourceHandle) comparison, just a different event name.
  const dispatchRunEdge = useCallback((edge) => {
    window.dispatchEvent(new CustomEvent('cw:run-edge', { detail: edge }))
  }, [])

  // ---------------------------------------------------------------------
  // VARIANT STUDIO (PLAN.md "## VARIANT STUDIO" -> "### 2 — the variant
  // GRID"). `spawnOrReplaceGrid` is the one mutation both triggers (the
  // per-card RUN MODEL button's cw:run-generate listener further down, and
  // the full-flow engine's 'generate' beat via `spawnGenerateGrid` below)
  // funnel through — "Re-running the generate node REPLACES the group's
  // contents" (PLAN.md part 2) is implemented as tear-down-and-rebuild
  // rather than a partial diff: simpler, and it's what actually gives every
  // card a FRESH mount (so nodes.css's mount-triggered develop animation
  // replays on every card — "the grid ripples with fresh takes") rather
  // than needing a second remount mechanism layered on top of a diffed
  // update.
  // ---------------------------------------------------------------------
  const spawnOrReplaceGrid = useCallback((generateNodeId) => {
    const all = nodesRef.current
    const genNode = all.find((n) => n.id === generateNodeId)
    if (!genNode) return null
    const count = genNode.data?.variants || 1
    if (count <= 1) return null // "on a variants>1 run" (PLAN.md) — 1 stays a lone preview, no grid

    // PRODUCTION CLARITY PASS (PLAN.md) — `genNode` above comes from
    // nodesRef (mirrors RAW `rawNodes`); `.data.number` only ever exists on
    // the DERIVED `numberedNodes` array (the renumber() call in this
    // component's own render below, a useMemo that's never written back
    // into raw state) — so `genNode.data?.number` here is always
    // undefined, not stale-but-close. Re-deriving off the SAME pure
    // renumber() function this file already defines (cheap: only runs on a
    // real spawn/replace action, not per-render) reads the exact number the
    // card is showing on screen RIGHT NOW.
    const sourceNumber = renumber(all, edgesRef.current).find((n) => n.id === generateNodeId)?.data?.number ?? null

    const existingFrame = all.find((n) => n.type === 'variantgroup' && n.data?.sourceId === generateNodeId)
    const withoutOldGroup = existingFrame
      ? all.filter((n) => n.id !== existingFrame.id && n.parentId !== existingFrame.id)
      : all

    const { cols, width, height } = gridGeometry(count)
    // Placement via slideClear "so it never lands on existing content"
    // (PLAN.md) — top-level nodes only; a grid child's `.position` is
    // relative to ITS OWN frame, not this new one (see resolveNodeBox's own
    // comment for why every collision helper in this file needs the filter).
    //
    // FQ-B (PLAN.md "## FINAL QUEUE" -> "### FQ-B — VARIANT GRID OVERLAP") —
    // `safePlacementBox` (not plain `nodeBox`) sizes the OTHER nodes being
    // slid clear of: the frame being placed here is itself a real node with
    // a known size (`width`/`height` below, from gridGeometry — exact, not
    // estimated), so per PLAN.md's own instruction it "can participate" in
    // the SAME hardened collision math resolvePlacement already uses for
    // template drops, rather than the plain unpadded nodeBox this call used
    // before. This is what actually stops a Compare/Output card that hasn't
    // had its first React Flow measurement pass yet from under-reporting its
    // own footprint and letting the grid settle on top of it. builder.js's
    // own GENERATE_COL_PITCH now reserves native room so this rarely has to
    // slide at all for a template-authored Generate at the default variant
    // count — this stays as the dynamic safety net for everything else
    // (a live palette-added Generate, a bumped variant count, a dragged
    // canvas).
    const collisionNodes = withoutOldGroup.filter((n) => !n.parentId)
    const genBox = nodeBox(genNode)
    const origin = existingFrame
      ? slideClear(collisionNodes, { x: existingFrame.position.x, y: existingFrame.position.y }, width, height, safePlacementBox)
      : slideClear(
          collisionNodes,
          { x: genBox.x + genBox.w + VARIANT_GROUP_GAP, y: genBox.y + genBox.h / 2 - height / 2 },
          width,
          height,
          safePlacementBox,
        )

    // COMFY ROUND (CP2, item 3) — "SEED DISCIPLINE". `seed` is the epoch
    // driving every card below (replaces the old bare `runCount`'s identical
    // role); already resolved — reused as-is while locked, or advanced —
    // by the caller (onRunGenerate below / engine.js's 'generate' beat)
    // BEFORE this runs, so a locked re-run reaching this function twice in a
    // row hands it the SAME seedEpoch both times, which is what makes the
    // whole grid byte-identical on a locked re-run.
    const seedEpoch = genNode.data?.seed ?? DEFAULT_GENERATE_SEED
    // DESIGN BAR ("no layout jump on untouched siblings" / "seamless") —
    // on a REPLACE, keep the frame's own identity (id + its already-settled
    // `measured`/`--cw-seq`) instead of minting a fresh one: the CARDS are
    // what actually need a clean remount (their develop animation is a
    // mount-triggered one-shot, PLAN.md's own "ripples with fresh takes"),
    // but the CONTAINER popping out and back in on every re-run would read
    // as a bigger jolt than the refresh warrants. `measured` carries over so
    // it never re-enters the unmeasured-first-paint state a truly new node
    // would; nodes.css's own width/height transition (VARIANT STUDIO
    // section) smooths a variant-COUNT change into a resize instead of a
    // snap.
    const frameId = existingFrame?.id ?? genId('variantgroup')
    // PRODUCTION CLARITY PASS (PLAN.md) — `sourceNumber` is a spawn-time
    // copy of the generate card's own `data.number` (renumber() above now
    // numbers 'generate' too), read by FrameNode.jsx for its "FROM NN ·"
    // provenance eyebrow — same copy-at-spawn convention `title` already
    // uses on this same object, not a live subscription: the frame's
    // label is honest as of the moment it was (re)built, matching every
    // other value on this object (title/count) that also only refreshes
    // on a real spawn/replace, not on every keystroke elsewhere in the
    // graph. `null` (not omitted) when the generate node has none yet —
    // FrameNode.jsx's own render just drops the "FROM NN ·" prefix.
    const frameNode = {
      id: frameId,
      type: 'variantgroup',
      position: origin,
      data: {
        sourceId: generateNodeId,
        sourceNumber,
        title: genNode.data?.title || 'Generate key visuals',
        width,
        height,
        count,
      },
      measured: existingFrame?.measured ?? {},
    }
    // Reject-sample each card's seed against posterLayoutIndex (run/
    // posters.jsx) so ONE grid never repeats the same comp 3-4 times — a
    // plain independent draw per slot has a ~61% chance of it (see that
    // export's own comment). Still fully deterministic ("no Math.random"):
    // each retry just extends the hash INPUT string, never reaches for
    // real randomness. usedLayouts carries across the whole grid.
    // RETRY_CAP is generous ON PURPOSE, not "one try per remaining layout":
    // with 9 of 10 layouts already used, a fresh hash only lands on the ONE
    // that's left ~1/10 of the time, so a cap of just POSTER_LAYOUT_COUNT
    // (10) still has a ~35% chance of running out before the last card
    // finds it (measured — an earlier version of this comment overclaimed
    // "always lands on count DISTINCT layouts" on exactly that cap). 200
    // tries at worst-case 1-in-10 odds fails with probability ~1e-9.
    const usedLayouts = new Set()
    const RETRY_CAP = POSTER_LAYOUT_COUNT * 20 // generous headroom, not "one try per layout" — see above
    const cards = Array.from({ length: count }, (_, i) => {
      let seed = makeSeed(`${generateNodeId}:v${i}`, seedEpoch)
      let attempt = 0
      while (usedLayouts.has(posterLayoutIndex(seed)) && attempt < RETRY_CAP) {
        attempt += 1
        seed = makeSeed(`${generateNodeId}:v${i}:${attempt}`, seedEpoch)
      }
      usedLayouts.add(posterLayoutIndex(seed))
      return {
        id: genId('variant'),
        type: 'variant',
        parentId: frameId,
        extent: 'parent',
        // React Flow subflow requirement (verified against the installed
        // @xyflow/system package): children must appear AFTER their parent
        // in the nodes array — satisfied below by [...withoutOldGroup,
        // frameNode, ...cards], never reordered afterward by anything else
        // in this file (renumber/computeIssues/etc. all `.map()` in place).
        position: gridSlotPosition(i, cols),
        data: { generateNodeId, index: i, model: genNode.data?.model, seed },
        measured: {},
        draggable: false,
        selectable: false,
        // CDP-found bug: React Flow's own NodeWrapper computes
        // `pointerEvents: (isSelectable || isDraggable || onClick || ...) ?
        // 'all' : 'none'` (verified against the installed @xyflow/react
        // source) — with both false and no per-node handlers wired, a
        // card's ENTIRE wrapper silently stops being hit-testable, which
        // swallowed clicks on its own Re-run/-> Output buttons even though
        // they were visibly on top (z-index was correct; pointer-events
        // was not). `node.style` is spread AFTER that computed value in
        // the same style object, so this is RF's own documented escape
        // hatch, not a hack.
        style: { pointerEvents: 'auto' },
      }
    })

    // CDP-found bug (surfaced verifying SEED DISCIPLINE, pre-existing —
    // present since VARIANT STUDIO, not introduced by this phase): both
    // callers of this function (onRunGenerate's timeout below, and
    // engine.js's 'generate' beat) call `patchNodeData(id, {runState:'done',
    // ...})` immediately before calling THIS function, in the same
    // synchronous tick. React queues same-tick setState calls and applies
    // them in order — but only when EVERY call in the queue is a functional
    // updater; a plain VALUE (what this line used to pass) is applied as an
    // unconditional overwrite that ignores whatever earlier queued updaters
    // in the SAME tick computed. That silently reverted the just-applied
    // 'done' patch back to 'running' every single time a grid spawned or
    // replaced, permanently disabling Run Model (it reads runState==
    // 'running' as busy) after the first ever grid for a node. Recomputing
    // "withoutOldGroup" against the updater's own `current` argument (the
    // actually-current queued state, not the stale `all` snapshot captured
    // at the top of this function) keeps the preceding patch intact while
    // still folding in this function's own new frame + cards.
    const existingFrameId = existingFrame?.id ?? null
    setRawNodes((current) => {
      const freshWithoutOldGroup = existingFrameId
        ? current.filter((n) => n.id !== existingFrameId && n.parentId !== existingFrameId)
        : current
      return [...freshWithoutOldGroup, frameNode, ...cards]
    })
    patchNodeData(generateNodeId, { groupId: frameId })
    return { frameId, cards: cards.map((c) => ({ nodeId: c.id, seed: c.data.seed })) }
  }, [patchNodeData])

  // Engine-facing wrapper — "does NOT spawn/replace grids unless it has
  // none — first full-run spawns the grid too" (PLAN.md part 4). The manual
  // RUN MODEL button (further down) always replaces unconditionally; a
  // full-flow run only ever spawns the FIRST time this node is reached with
  // no grid yet, leaving an existing one exactly as the user left it (they
  // may have already picked a winner from it) on every subsequent
  // full-flow pass. One history checkpoint — but only when something was
  // actually spawned; an already-gridded node is a pure no-op, no
  // checkpoint wasted on it.
  const spawnGenerateGrid = useCallback(
    (generateNodeId) => {
      const already = nodesRef.current.some((n) => n.type === 'variantgroup' && n.data?.sourceId === generateNodeId)
      if (already) return null
      pushHistory()
      return spawnOrReplaceGrid(generateNodeId)
    },
    [spawnOrReplaceGrid, pushHistory],
  )

  // One runner instance for the life of this provider (lazy-init via ref, not
  // `useState`/`useMemo`, so it survives StrictMode's double-invoke and is
  // never silently rebuilt). `getNodes`/`getEdges` close over the always-
  // fresh refs above rather than the `rawNodes`/`rawEdges` state values
  // directly, so the runner never needs to be recreated when the graph
  // changes mid-run.
  const runnerRef = useRef(null)
  if (!runnerRef.current) {
    runnerRef.current = createRunner({
      getNodes: () => nodesRef.current,
      getEdges: () => edgesRef.current,
      patchNode: patchNodeData,
      onEdgePass: dispatchRunEdge,
      // VARIANT STUDIO — see spawnGenerateGrid's own comment above.
      spawnGenerateGrid,
      // RESULTS SHEET — no `spawnResultsFrame` option anymore; retired
      // along with the free-standing `results` node it used to spawn (see
      // this file's own header comment where RESULTS_COL_PITCH/
      // RESULTS_HEIGHT_EST used to live, and run/engine.js's own
      // createRunner header comment for the matching cleanup on that side).
    })
  }

  // RUN SHOW B4 — "finale roll call" completion signal (additive; PLAN.md's
  // own instruction, since no "run finished" event existed before this).
  // engine.js's run() (read-only) resolves its promise identically whether
  // every node finished naturally OR stopRun() aborted mid-flight — signal
  // aborts resolve rather than reject, so a bare "did the promise settle"
  // check can't tell the two apart on its own. runStoppedRef is the missing
  // bit: stopRun sets it the instant it's called; the run() .then() below
  // checks it once settled and skips the event entirely on a stop/abort per
  // PLAN.md B4 ("On stop/abort: no finale"). The dispatch itself waits one
  // rAF past that — engine.js's last patchNode() call for the final node is
  // still just a setRawNodes; a handful of microtasks separate that from
  // run()'s own promise resolving (nested async/await through
  // runNode->advance->Promise.all), which is not the same thing as React
  // having actually committed that 'done' write to nodesRef/props yet. One
  // frame is cheap insurance so every node's useRunFinale (shared.jsx) reads
  // a definitely-fresh `data.runState` rather than racing the last render.
  const runStoppedRef = useRef(false)

  // CANVAS-NATIVE DELIVERABLES — "the camera then glides to FIT THE OUTPUT
  // NODES that produced versions this run" (PLAN.md "### 2"). Every
  // completed Output artifact THIS run announces itself via the `cw:artifact`
  // event engine.js's 'output' case (and onMintOutput below) already
  // dispatch. Ref-only (no render-facing state) — nothing reads this for
  // rendering, only onRunSettled's synchronous snapshot below, so there's no
  // reason to pay for a re-render on every artifact.
  //
  // CDP-found bug (verified against the production build, headless): this
  // ref used to be kept fresh the "usual" way for this file (`ref.current =
  // state` inline in the render body — every other xRef in this file does
  // exactly that), but that only updates on FlowStateProvider's OWN next
  // render. `.then()` below fires as a microtask the INSTANT the engine's
  // run() promise settles — often before React has actually flushed a state
  // update from the last artifact's listener invocation — so the glide's own
  // synchronous snapshot of "this run's ids" could silently miss the very
  // last artifact (or, worse, ALL of them, if the last one settled the
  // promise on the same tick). The listener writes the ref directly and
  // synchronously instead, never waiting on a render to keep it honest.
  const runDeliveredIdsRef = useRef([])
  // DELIVERABLES IN THE PANEL (PLAN.md) — a SECOND accumulator fed by the
  // SAME listener, with the opposite lifetime. `runDeliveredIdsRef` above
  // resets at the START of every run (see resetRunDelivered's call sites) —
  // it only ever needs to answer "what did THIS run just deliver" for the
  // completion glide. `deliveryOrder` never resets on a run: it's the
  // session-wide, first-completed-order roll call CompiledPanel's own
  // DELIVERABLES section reads (PLAN.md "### 1" — "rows appear as outputs
  // complete DURING the run... re-runs bump version chips in place"). A
  // node's POSITION in this array is fixed the first time it ever delivers;
  // a later re-run of the same graph hits the `includes` guard below and
  // pushes nothing — the row stays exactly where it was, and its own
  // content (thumb/format/version count) simply reads live off `nodes`
  // elsewhere, so no second push is needed for it to visibly update. Reset
  // only by loadFlow's own resetDeliveryOrder call below — a real graph swap
  // (Clear/Load-from-instructions/demos/tab-switches) — never by a run
  // starting. This one DOES need to be real state, unlike the ref above: it
  // has to trigger CompiledPanel's re-render whenever a genuinely new output
  // joins the roll call.
  const deliveryOrderRef = useRef([])
  const [deliveryOrder, setDeliveryOrder] = useState([])
  // DELIVERABLES A+C — "session-local open state" (PLAN.md). Was ALSO
  // auto-opened on a run's first delivered output ("Appears: auto-opens
  // when a run's first output completes") until BATCH MATRIX (PLAN.md "##
  // BATCH MATRIX" — "the bottom deliverables panel is still firing open,
  // that thing should be killed entirely because the outputs panel on the
  // canvas does that job now"): that write is gone, this state stays (still
  // read/written by CompiledPanel.jsx's own Gallery toggle, and whatever
  // DeliverablesShelf.jsx keeps of its own toggle post-tombstone — this
  // provider only ever hands the pair out, it never assumed sole ownership
  // of the writes). Deliberately NOT ANDed with "has anything to show"
  // here — that derivation belongs to the CONSUMER, so a Clear (which
  // empties `deliveryOrder` below) closes the shelf for free with no extra
  // write here.
  const [shelfOpen, setShelfOpen] = useState(false)
  useEffect(() => {
    function onArtifact(e) {
      const nodeId = e.detail?.nodeId
      if (!nodeId) return
      // BATCH MATRIX — this used to also compute `isFirstOfRun` here and
      // call `setShelfOpen(true)` on it ("Appears: auto-opens..." above) —
      // that's exactly the "keeps firing open" Bryan flagged, now removed.
      // `runDeliveredIdsRef` itself stays: it's NOT shelf-only plumbing —
      // onRunSettled's own completion-glide snapshot (below) still reads it
      // to fit the camera on this run's delivered outputs, a RESULTS ON THE
      // BOARD-era need that predates and outlives the shelf entirely.
      if (!runDeliveredIdsRef.current.includes(nodeId)) {
        runDeliveredIdsRef.current = [...runDeliveredIdsRef.current, nodeId]
      }
      if (!deliveryOrderRef.current.includes(nodeId)) {
        deliveryOrderRef.current = [...deliveryOrderRef.current, nodeId]
        setDeliveryOrder(deliveryOrderRef.current)
      }
    }
    window.addEventListener('cw:artifact', onArtifact)
    return () => window.removeEventListener('cw:artifact', onArtifact)
  }, [])

  // Resets the synchronous ref immediately — the next run's own accumulation
  // starts writing to it right away, so this can't wait on a render.
  const resetRunDelivered = useCallback(() => {
    runDeliveredIdsRef.current = []
  }, [])

  // DELIVERABLES IN THE PANEL — "Clear/new-graph empties it" (PLAN.md
  // "### 1"). Deliberately NOT called from runWorkflow/runFromNode (unlike
  // resetRunDelivered just above) — a run starting must never blank the
  // panel's own roll call, only loadFlow's real graph swap does.
  // DELIVERABLES A+C — this is now ALSO the shelf's own "Clear" action
  // (PLAN.md: "the shelf gets the armed two-step Clear... which clears the
  // RECORD — both views"): resetting the one shared `deliveryOrder` record
  // empties CompiledPanel.jsx's DELIVERABLES section AND (via the derived
  // `shelfOpen && deliverables.length > 0` visibility) closes
  // DeliverablesShelf.jsx, with no second call needed.
  const resetDeliveryOrder = useCallback(() => {
    deliveryOrderRef.current = []
    setDeliveryOrder([])
    // RESULTS SHEET (PLAN.md) — "Clear (armed, in the sheet head) resets the
    // record exactly as today → the sheet EXITS (real exit)." Emptying
    // `deliveryOrder` above IS that exit now: `resultsAnchorId` (below) is
    // derived straight off `deliveryOrder`, so this alone takes it back to
    // null the instant Clear runs, which is what OutputNode.jsx's own
    // sheet-presence hook reads to animate the satellite away — no node to
    // delete anymore (the free-standing `results` type retired along with
    // spawnResultsFrame — see this file's own header comment). The
    // defensive `setRawNodes` filter below stays anyway: harmless
    // insurance against a genuinely stray `results`-typed node surviving
    // from before this phase (an undo-history entry, a saved-workflow
    // tab snapshot) — no template has ever authored one, and nodes/index.js
    // keeps a no-op registration for that type either way, so this is belt-
    // and-braces cleanup, not load-bearing.
    setRawNodes((current) => current.filter((n) => n.type !== 'results'))
  }, [])

  // DELIVERABLES A+C — the ONE selector both views join against `nodes`
  // (see nodeNumberToken/deliverableDescriptor's own header comment above
  // for why this moved out of CompiledPanel.jsx). `deliveryOrder`'s own
  // header comment (just above) explains why it only ever decides a row's
  // POSITION (append-only, first-delivered-wins), never its content — so a
  // node's thumb/format/version count always reads live off `numberedNodes`
  // as of THIS render. Gated on `versions?.length` (not merely `output`) —
  // "one per output node with ≥1 version" — so a VARIANT STUDIO mint
  // (poster:true, no versions array) never grows a row from this alone;
  // only a real run does.
  // WAVE 3 — THE VERB EXPANSION. "lands in deliverables record (panel +
  // shelf) like any artifact-bearing done" (master contract, Remix) — the
  // ONE type-check in this whole shared selector, extended to admit
  // Remix's OWN completed artifacts (run/engine.js's 'remix' beat appends
  // to `data.versions` exactly like the 'output' case does) alongside
  // Output's. CompiledPanel.jsx/DeliverablesShelf.jsx needed no changes at
  // all — both already render whatever this selector hands them via the
  // fully generic `deliverableDescriptor(node)`, keyed on `node.data`, never
  // `node.type`.
  const deliverables = useMemo(() => {
    const byId = new Map(numberedNodes.map((n) => [n.id, n]))
    return deliveryOrder
      .map((id) => byId.get(id))
      .filter((n) => n && (n.type === 'output' || n.type === 'remix') && n.data?.versions?.length > 0)
  }, [numberedNodes, deliveryOrder])

  // ---------------------------------------------------------------------
  // RESULTS SHEET (PLAN.md "## RESULTS SHEET — the frame springs from the
  // output node") — "the results sheet mounts from the TERMINAL DELIVERED
  // output node — the delivered output with the highest data.seq (fallback:
  // any delivered)." OutputNode.jsx reads this id straight off context and
  // compares it to its own `id` to decide whether IT hosts the satellite.
  //
  // Deliberately keyed off `deliveryOrder` (sticky, session-wide, append-
  // only — never reset by a run STARTING, only by resetDeliveryOrder/Clear
  // above) rather than each node's own LIVE `data.output` field: runWorkflow
  // (below) nulls every node's `data.output` the instant Run is clicked,
  // well before the engine's first beat lands, and the terminal output is
  // (by definition) usually the LAST node a run reaches — so a live-output
  // derivation would flip `resultsAnchorId` to null for the entire run
  // duration, unmounting-then-remounting the sheet's own tether/port/shadow
  // chrome on every single re-run. The contract is explicit that a re-run
  // should NOT replay that whole entrance: "re-run: same sheet, versions
  // bump." Reading `deliveryOrder` instead means the anchor id only ever
  // changes when a genuinely NEW node overtakes the old terminal (a "Run
  // from here" that reaches a further downstream output for the first
  // time) — the common case (the SAME node re-delivering) leaves this
  // value byte-identical across a re-run, so the sheet's own presence hook
  // (OutputNode.jsx) never even sees a transition. `data.seq` (renumber()'s
  // BFS stamp) is itself stable across a re-run too — it only changes if
  // the GRAPH shape changes, never from a run's own output/runState churn —
  // so "highest seq among ever-delivered" stays a reliable, non-flickering
  // pick. `rows`/the sheet's own CONTENT (ResultsNode.jsx) still reads live
  // `data.output` unchanged — only WHICH NODE HOSTS the sheet is sticky
  // here, not what the sheet currently shows.
  // ---------------------------------------------------------------------
  const lastResultsAnchorRef = useRef(null)
  const resultsAnchorId = useMemo(() => {
    const deliveredSet = new Set(deliveryOrder)
    let anchor = null
    for (const n of numberedNodes) {
      if (n.type !== 'output' || !deliveredSet.has(n.id)) continue
      if (!anchor || (n.data?.seq ?? -Infinity) > (anchor.data?.seq ?? -Infinity)) anchor = n
    }
    if (anchor) {
      lastResultsAnchorRef.current = anchor.id
      return anchor.id
    }
    // STICKY through a re-run (Bryan: "on rerun, dont have this thing
    // disappear") — the run-start reset empties deliveryOrder, which used
    // to null the anchor and unmount the whole results sheet for the
    // duration of every re-run (the row derivation already survives via
    // ResultsNode's own settled-output freeze; the ANCHOR was the last
    // flicker source). Hold the previous anchor as long as that node still
    // exists in the flow — a truly empty record renders nothing anyway
    // (ResultsSheetBody's own zero-rows null), so a held anchor after
    // Clear costs nothing; a deleted node or a flow swap releases it.
    const held = lastResultsAnchorRef.current
    if (held && numberedNodes.some((n) => n.id === held)) return held
    lastResultsAnchorRef.current = null
    return null
  }, [numberedNodes, deliveryOrder])

  // RUN SHOW B4 + CANVAS-NATIVE DELIVERABLES — the shared "a run just
  // finished naturally" tail, called from both runWorkflow's and
  // runFromNode's own `.then()` below (mirrors how both already share the
  // exact same runStoppedRef/cw:run-complete finale wiring — one shape, two
  // entry points). Dispatches the finale roll-call event first (unchanged
  // R1/B4 contract), then — PLAN.md "### 2" — glides to fit whichever
  // Output nodes actually delivered a version THIS run, ~600ms later so the
  // camera move never fights the roll-call's own sweep. `ids` is snapshotted
  // synchronously here (not read from the ref inside the timer) so a second
  // run started within that 600ms window — resetting the accumulator for
  // itself — can never steal or blank THIS run's own glide target.
  const onRunSettled = useCallback(() => {
    requestAnimationFrame(() => {
      window.dispatchEvent(new CustomEvent('cw:run-complete'))
    })
    const ids = runDeliveredIdsRef.current
    if (!ids.length) return
    setTimeout(() => {
      // RESULTS SHEET (PLAN.md) — "camera glides to the frame" (now: to the
      // anchor node + sheet union) is the ta-da for ANY flow that delivered
      // ≥1 Output-type node this run (FlowCanvas.jsx's own `cw:run-complete`
      // listener, fired above on the SAME tick as this timer's own
      // scheduling, owns that glide off `resultsAnchorId`). Without this
      // guard, THIS pre-existing "fit the delivered outputs" glide — timed
      // 600ms after the same event, so it starts fractionally later and
      // finishes last — would win the race and silently override the
      // sheet-centered camera with a zoomed-to-fit-raw-outputs one,
      // defeating "ta-da at completion." Checked fresh off nodesRef (not a
      // stale closure) — mirrors the OLD spawnResultsFrame's own "delivered.
      // length" gate verbatim (an Output node whose `data.output` has
      // actually settled, `developing:false`), just inlined here now that
      // there's no separate node to ask "does it exist" instead. `ids` can
      // still be non-empty with THIS false (e.g. a flow whose only delivery
      // this run was a Remix node, never an Output) — the plain fit-glide
      // below correctly owns that case, same as it always has.
      const hasDeliveredOutput = nodesRef.current.some(
        (n) => n.type === 'output' && n.data?.output && !n.data.output.developing,
      )
      if (hasDeliveredOutput) return
      const byId = new Map(nodesRef.current.map((n) => [n.id, n]))
      const boxes = ids.map((id) => byId.get(id)).filter(Boolean).map((n) => resolveNodeBox(n, byId))
      glideToBox(unionBoxes(boxes))
    }, 600)
  }, [glideToBox])

  // "Re-run: reset outputs first" (PLAN.md R1.2) — one bulk pass over every
  // node right before kicking the engine off, rather than leaving stale
  // output/runState from a previous run visible until the trigger happens to
  // revisit each node.
  const runWorkflow = useCallback(() => {
    if (runStateRef.current !== 'idle') return
    // RUN METER — "floor 0 disables all run affordances" (PLAN.md). The
    // header Run button already disables itself at 0 (App.jsx), but this
    // guard is what actually enforces it — belt-and-braces against any
    // other future caller of this same context function.
    if (runsRemainingRef.current <= 0) return
    // MODEL-AGNOSTIC POSTURE — a full-flow run prices at the priciest tier
    // among every task/generate node it's about to touch (runCostForModels
    // maxes across the list; Auto/unset/unrecognized all resolve to 'fast').
    const cost = runCostForModels(
      nodesRef.current.filter((n) => n.type === 'task' || n.type === 'generate').map((n) => n.data?.model),
    )
    consumeRun(cost)
    setRawNodes((nds) => nds.map((n) => ({ ...n, data: { ...n.data, runState: 'idle', output: null } })))
    resetRunDelivered() // CANVAS-NATIVE DELIVERABLES — "next run starts" clears the stamp
    runStoppedRef.current = false
    runnerRef.current.run().then(() => {
      if (runStoppedRef.current) return
      onRunSettled()
    })
  }, [consumeRun, onRunSettled, resetRunDelivered])

  // NODE TOOLBAR V2 — "Run from here" (item 5). Mirrors runWorkflow's own
  // "reset outputs first" precedent just above, scoped to nodeId + every
  // node downstream of it (computeDownstreamSet — a plain forward BFS over
  // edges) instead of the whole graph: upstream nodes keep whatever
  // output/runState they already have, which is the entire point ("its
  // upstream outputs used if present" — PLAN.md). Same idle-only guard,
  // same runStoppedRef/cw:run-complete finale wiring as runWorkflow, just
  // handed off to engine.js's new `runFrom` entry point instead of `run`.
  const runFromNode = useCallback((nodeId) => {
    if (runStateRef.current !== 'idle') return
    // RUN METER — same guard as runWorkflow above; shared.jsx's toolbar
    // button already disables itself at 0 (with the "Out of runs" tooltip),
    // this is the actual enforcement.
    if (runsRemainingRef.current <= 0) return
    const scope = computeDownstreamSet(nodeId, edgesRef.current)
    // MODEL-AGNOSTIC POSTURE — scoped to what THIS walk will actually touch
    // (computed before consumeRun so the cost reflects the real scope, not
    // the whole graph).
    const cost = runCostForModels(
      nodesRef.current.filter((n) => scope.has(n.id) && (n.type === 'task' || n.type === 'generate')).map((n) => n.data?.model),
    )
    consumeRun(cost)
    setRawNodes((nds) =>
      nds.map((n) => (scope.has(n.id) ? { ...n, data: { ...n.data, runState: 'idle', output: null } } : n)),
    )
    resetRunDelivered() // CANVAS-NATIVE DELIVERABLES — same reset as runWorkflow above
    runStoppedRef.current = false
    runnerRef.current.runFrom(nodeId).then(() => {
      if (runStoppedRef.current) return
      onRunSettled()
    })
  }, [consumeRun, onRunSettled, resetRunDelivered])

  const stopRun = useCallback(() => {
    runStoppedRef.current = true
    runnerRef.current.stop()
  }, [])

  const continueHuman = useCallback((nodeId, value) => runnerRef.current.continueHuman(nodeId, value), [])

  // HITL MICRO-CHAT (PLAN.md "## HITL MICRO-CHAT") — same one-line forward
  // as continueHuman just above; engine.js's own chatWithHuman (run/
  // engine.js, next to its continueHuman) does the actual work (appends the
  // reviewer's message, resolves one agent reply through its own adapter
  // seam, refreshes chatOptions) against the SAME runnerRef instance every
  // other run control here already shares — no new runner, no new state.
  const chatWithHuman = useCallback((nodeId, text) => runnerRef.current.chatWithHuman(nodeId, text), [])

  // GATEWAY RUN Phase Q (canvas-workflows half, own PLAN.md documents the
  // contract) — `?autorun=1` starts the REAL run engine on boot (only
  // meaningful alongside `?template=`, see getInitialFlow above): a gateway
  // deep-link hands over a LIVE run, not a static graph. `?from=<stepKey>`
  // scopes it to `runFromNode` — the exact same "Run from here" entry point
  // NODE TOOLBAR V2 already wired, just started programmatically instead of
  // from a click — resolving the step's AUTHORED key (builder.js now stamps
  // `data.stepKey` on every minted node, additive) to that node's actual
  // (randomly minted) id; no `from=` (or an unresolved one) runs the whole
  // graph from its trigger(s), same as the header Run button. Neither param
  // means anything to a bare load or an existing `?flow=` deep link — both
  // stay byte-identical. Boot-only (empty dep array, same posture as the
  // TOUR_FIT_PARAMS effect above) with a settle delay so the run's opening
  // beat fires once the overlay has actually finished materializing rather
  // than into a still-transitioning canvas.
  useEffect(() => {
    if (typeof window === 'undefined') return undefined
    const params = new URLSearchParams(window.location.search)
    if (params.get('autorun') !== '1') return undefined
    const fromKey = params.get('from')
    const timer = setTimeout(() => {
      if (fromKey) {
        const target = nodesRef.current.find((n) => n.data?.stepKey === fromKey)
        if (target) {
          runFromNode(target.id)
          return
        }
        // Unknown/stale step key — graceful fallback, not a dead run: same
        // "silent, one console.info" bar FQ-A's own adapter fallback sets
        // elsewhere in this file, rather than a thrown error or a no-op.
        console.info(
          '[canvas-workflows] ?from= step key not found on this template, running from the trigger instead:',
          fromKey,
        )
      }
      runWorkflow()
    }, 1200)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // (Graph persistence removed — refresh always resets; see getInitialFlow.)

  // (No fit-on-open: every open/refresh renders at exactly 100% — Bryan.
  // FlowCanvas remounts per open with defaultViewport {x:60, y:40, zoom:1},
  // so arrival is deterministic. Tidy/Load/Clear keep their explicit fits,
  // capped at maxZoom 1.)

  // ---- cw:add-from / cw:edge-insert / cw:edge-cut / cw:wire-add — dispatched
  // by C's node ghost "+" buttons, D's edge +/× controls, and (cw:wire-add)
  // this file's own FlowCanvas.jsx picking a row out of the CP0+ drag-to-
  // empty-pane picker. -----------------------------------------------------
  useEffect(() => {
    // COMFY ROUND (CP0) — the real default source handle for a freshly-
    // minted node when it has to be hardcoded as the SOURCE of a splice
    // (onAddFrom's LEFT side below, onEdgeInsert's downstream half further
    // down). Most palette defaults render a plain 'out' Handle, but Stop
    // never renders one at all, and Logic's if/switch/try kinds render ONLY
    // their branch-specific handles (true/false, case-N, try/catch) — never
    // 'out' — only kind:'foreach' does (verified against src/nodes/
    // LogicNode.jsx's own render, the same check BlockPicker.jsx's
    // NO_DEFAULT_OUT is built on). Picks the single most sensible
    // "continues" branch for if/try; switch has no canonical branch until
    // the user adds options, so a fresh one (or Stop, which has no source
    // at all) returns null — callers skip minting that edge rather than
    // reference a handle id with no matching DOM handle, which React Flow
    // silently fails to draw (confirmed via CDP: the edge existed in state,
    // zero rendered paths).
    function defaultSourceHandle(type, data) {
      if (type === 'stop') return null
      if (type === 'logic') {
        const kind = data?.kind || 'if'
        if (kind === 'foreach') return 'out'
        if (kind === 'if') return 'true'
        if (kind === 'try') return 'try'
        if (kind === 'switch') return data?.options?.length ? 'case-0' : null
        // WAVE 1 — THE VERB EXPANSION. Gather's sole source is its plain
        // 'out' (matches foreach's own line just above); Split has no plain
        // 'out' at all (LogicNode.jsx renders only its two named 'a'/'b'
        // rows), so its most sensible single "continues" branch is 'a' —
        // the primary/first arm, same "pick ONE sensible branch" call
        // if/try already make for their own two-branch shape (mirrored in
        // BlockPicker.jsx's own NO_DEFAULT_OUT, which is why 'split' —
        // unlike 'gather' — is also added there this wave).
        if (kind === 'gather') return 'out'
        if (kind === 'split') return 'a'
        // WAVE 3 — THE VERB EXPANSION (out-of-seam, minimal fix — closed
        // incidentally while wiring Guardrail's own entry just below, same
        // "pick ONE sensible branch" precedent this whole function already
        // follows). Compare mirrors Gather: a plain 'out' (LogicNode.jsx
        // renders it unconditionally for this kind, and BlockPicker.jsx's
        // own NO_DEFAULT_OUT already correctly excludes it from THAT list —
        // this function's own switch is what never got the matching line).
        if (kind === 'compare') return 'out'
        // WAVE 4 — THE VERB EXPANSION. "Named outs PASS / FLAG (try/catch
        // anatomy)" (master) — same two-branch shape as if/try above, so
        // this picks the same "continues" side those two already do (the
        // PASS/success arm, not the failure one).
        if (kind === 'guardrail') return 'pass'
        return null
      }
      return 'out'
    }

    const onAddFrom = (event) => {
      const { nodeId, side, itemId } = event.detail || {}
      const src = nodesRef.current.find((n) => n.id === nodeId)
      if (!src) return
      // RUN PHASE (R1.3) — not literally "node add" (that's the palette
      // path), but it creates a node + edge the same as one, so it gets the
      // same undo coverage; see the file header note.
      pushHistory()
      // GHOST + PICKER phase (PLAN.md) — `itemId` names which PALETTE_SECTIONS
      // row the user picked (BlockPicker.jsx, via FlowCanvas.jsx's cw:add-from
      // dispatch); resolve it to that item's own nodeType + makeData() so a
      // picked "If / Else" or "Email" lands as that block, not a Task. No
      // itemId (or an id lookup miss) falls back to the original hardcoded
      // Task — keeps this listener backwards-compatible with any other future
      // cw:add-from dispatcher that never learned about the picker.
      const paletteItem = itemId ? paletteItemById(itemId) : null
      const newType = paletteItem?.nodeType || 'task'
      const newData = paletteItem ? paletteItem.makeData() : makeTaskData()
      const newId = genId(newType)
      const position = { x: src.position.x + (side === 'right' ? 380 : -380), y: src.position.y }
      const newNode = { id: newId, type: newType, position, data: newData, measured: {} }
      // COMFY ROUND (CP0) fix, discovered while verifying CP0's OWN "pick
      // If/Else from a wire's +" case: the LEFT-side edge below makes the
      // NEW node the source — hardcoding sourceHandle:'out' silently minted
      // an edge to a handle that doesn't exist on a branch-only Logic kind
      // (if/switch/try never render a plain 'out' — see BlockPicker.jsx's
      // NO_DEFAULT_OUT for the CDP-verified breakdown) or on Stop (no source
      // handle at all) — the edge existed in DATA (so no "disconnected"
      // issue, undo still one step) but never drew, because React Flow
      // can't resolve a handle id with no matching DOM handle. Same picker
      // (PICKER_SECTIONS) offers those rows on this side too, so this was
      // reachable, not theoretical — defaultSourceHandle resolves the real
      // default handle (or null when there truly isn't a single sensible
      // one, e.g. a fresh Switch with zero options yet), and a null skips
      // minting that edge entirely rather than reference a phantom handle.
      const leftHandle = defaultSourceHandle(newType, newData)
      const newEdge =
        side === 'right'
          ? { id: genId('edge'), source: nodeId, sourceHandle: 'out', target: newId, targetHandle: 'in', type: 'omni' }
          : leftHandle
            ? { id: genId('edge'), source: newId, sourceHandle: leftHandle, target: nodeId, targetHandle: 'in', type: 'omni' }
            : null
      setRawNodes((nds) => [...nds, newNode])
      if (newEdge) setEdges((eds) => [...eds, newEdge])
      // MOTION PHASE item 7 (cw:surge) + item 3 (cw:ripple, FlowCanvas.jsx
      // listens) — deferred one tick so the new node/edge have mounted
      // their own listeners before the events go out (see header comment).
      setTimeout(() => {
        if (newEdge) {
          window.dispatchEvent(
            new CustomEvent('cw:surge', {
              detail: { source: newEdge.source, target: newEdge.target, sourceHandle: newEdge.sourceHandle },
            }),
          )
        }
        window.dispatchEvent(new CustomEvent('cw:ripple', { detail: { x: position.x, y: position.y } }))
      }, 0)
    }

    const onEdgeInsert = (event) => {
      // COMFY ROUND (CP0 — "EDGE + OPENS THE PICKER") — `itemId` names which
      // PALETTE_SECTIONS row the user picked from the wire's own "+" (now a
      // BlockPicker, OmniEdge.jsx/FlowCanvas.jsx), resolved exactly the way
      // onAddFrom's own itemId already is: real palette item -> its
      // nodeType + makeData(); no itemId (or a lookup miss) falls back to the
      // original hardcoded Task, so any other future cw:edge-insert
      // dispatcher without a picker stays backwards-compatible. Splice logic
      // below (edgeA/edgeB, midpoint placement, both getting a surge) is
      // otherwise UNCHANGED — edgeB's handle is the one exception, see
      // defaultSourceHandle's own comment above (onAddFrom) for why.
      const { edgeId, itemId } = event.detail || {}
      const edge = edgesRef.current.find((e) => e.id === edgeId)
      if (!edge) return
      const source = nodesRef.current.find((n) => n.id === edge.source)
      const target = nodesRef.current.find((n) => n.id === edge.target)
      if (!source || !target) return
      pushHistory() // RUN PHASE (R1.3) — see onAddFrom's note above.
      const paletteItem = itemId ? paletteItemById(itemId) : null
      const newType = paletteItem?.nodeType || 'task'
      const newData = paletteItem ? paletteItem.makeData() : makeTaskData()
      const newId = genId(newType)
      const position = { x: (source.position.x + target.position.x) / 2, y: (source.position.y + target.position.y) / 2 }
      const newNode = { id: newId, type: newType, position, data: newData, measured: {} }
      const edgeA = { id: genId('edge'), source: edge.source, sourceHandle: edge.sourceHandle, target: newId, targetHandle: 'in', type: 'omni' }
      const downstreamHandle = defaultSourceHandle(newType, newData)
      const edgeB = downstreamHandle
        ? { id: genId('edge'), source: newId, sourceHandle: downstreamHandle, target: edge.target, targetHandle: edge.targetHandle ?? 'in', type: 'omni' }
        : null
      setRawNodes((nds) => [...nds, newNode])
      setEdges((eds) => [...eds.filter((e) => e.id !== edgeId), edgeA, ...(edgeB ? [edgeB] : [])])
      // MOTION PHASE item 7 — both freshly-minted edges get their own surge
      // (no ripple here: item 3 only lists palette-drop/add-from/drag-stop).
      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent('cw:surge', {
            detail: { source: edgeA.source, target: edgeA.target, sourceHandle: edgeA.sourceHandle },
          }),
        )
        if (edgeB) {
          window.dispatchEvent(
            new CustomEvent('cw:surge', {
              detail: { source: edgeB.source, target: edgeB.target, sourceHandle: edgeB.sourceHandle },
            }),
          )
        }
      }, 0)
    }

    const onEdgeCut = (event) => {
      const { edgeId } = event.detail || {}
      pushHistory() // RUN PHASE (R1.3) — an edge delete, same as Backspace.
      setEdges((eds) => eds.filter((e) => e.id !== edgeId))
    }

    // COMFY ROUND (CP0+ — "PICKER V2" item 2, "the gesture") — a connection
    // dragged from any port and released on EMPTY pane. FlowCanvas.jsx's own
    // onConnectEnd already owns opening the picker for this (no window event
    // needed to get there — that state already lives in that component);
    // this is what fires once a row is actually picked. Mirrors onAddFrom
    // above (itemId -> real nodeType/makeData(), pushHistory, cw:surge +
    // cw:ripple), but the new node lands at the exact RELEASE point (slid
    // clear, same as every other node-creating action here) instead of a
    // fixed ±380px offset, and the wiring direction/handle come from
    // whichever port was actually dragged rather than an assumed 'out'/'in'.
    const onWireAdd = (event) => {
      const { nodeId, handleId, handleType, itemId, x, y } = event.detail || {}
      const src = nodesRef.current.find((n) => n.id === nodeId)
      if (!src || typeof x !== 'number' || typeof y !== 'number') return
      pushHistory()
      const paletteItem = itemId ? paletteItemById(itemId) : null
      const newType = paletteItem?.nodeType || 'task'
      const newData = paletteItem ? paletteItem.makeData() : makeTaskData()
      const newId = genId(newType)
      // Same not-yet-measured footprint estimate addNodeFromPalette already
      // leans on (nodeBox falls back to EST_WIDTH/EST_HEIGHT for an empty
      // `measured`) — "the block lands AT THE RELEASE POINT (slideClear'd)"
      // (PLAN.md), that point being the card's TOP-LEFT, the same convention
      // onDrop's screenToFlowPosition already places a palette-dragged card
      // at (addNodeFromPalette does NOT centre a caller-supplied position).
      const box = nodeBox({ type: newType, data: newData, measured: {}, position: { x: 0, y: 0 } })
      const collisionNodes = nodesRef.current.filter((n) => !n.parentId)
      const position = slideClear(collisionNodes, { x, y }, box.w, box.h)
      const newNode = { id: newId, type: newType, position, data: newData, measured: {} }
      // "wired from the dragged port (both directions handled)": a
      // target-side drag (handleType 'target' — always this schema's single
      // 'in') makes the NEW node the source, via its own plain 'out' (this is
      // exactly why BlockPicker.jsx's connection-aware filter excludes any
      // block whose default doesn't render one — NO_DEFAULT_OUT there); a
      // source-side drag keeps the EXACT originating handle id (out, or a
      // branch id like case-0/true/opt-x) rather than assuming 'out', since
      // that handle already exists on a real node, not a fresh one.
      const newEdge =
        handleType === 'target'
          ? { id: genId('edge'), source: newId, sourceHandle: 'out', target: nodeId, targetHandle: handleId || 'in', type: 'omni' }
          : { id: genId('edge'), source: nodeId, sourceHandle: handleId || 'out', target: newId, targetHandle: 'in', type: 'omni' }
      setRawNodes((nds) => [...nds, newNode])
      setEdges((eds) => [...eds, newEdge])
      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent('cw:surge', {
            detail: { source: newEdge.source, target: newEdge.target, sourceHandle: newEdge.sourceHandle },
          }),
        )
        window.dispatchEvent(new CustomEvent('cw:ripple', { detail: { x: position.x, y: position.y, w: box.w, h: box.h } }))
      }, 0)
    }

    window.addEventListener('cw:add-from', onAddFrom)
    window.addEventListener('cw:edge-insert', onEdgeInsert)
    window.addEventListener('cw:edge-cut', onEdgeCut)
    window.addEventListener('cw:wire-add', onWireAdd)
    return () => {
      window.removeEventListener('cw:add-from', onAddFrom)
      window.removeEventListener('cw:edge-insert', onEdgeInsert)
      window.removeEventListener('cw:edge-cut', onEdgeCut)
      window.removeEventListener('cw:wire-add', onWireAdd)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ---------------------------------------------------------------------
  // VARIANT STUDIO — window-event doorways for GenerateNode/VariantCard (C
  // seam node components can't import this file — cross-seam contract — so
  // they dispatch, exactly like every other node-triggered mutation in this
  // app: cw:add-from/cw:duplicate above, shared.jsx's dispatchAddFrom/
  // dispatchAddPicker/NodeActionsToolbar).
  // ---------------------------------------------------------------------
  useEffect(() => {
    // RUN MODEL (PLAN.md part 1) — "runs JUST this node": develops the
    // generate node's own frame, then unconditionally spawns/replaces its
    // grid (manual re-runs always REPLACE — engine.js's own 'generate' beat
    // is the only caller that gates on "unless it has none").
    const onRunGenerate = (event) => {
      const { nodeId } = event.detail || {}
      if (runStateRef.current !== 'idle') return // RUN PHASE guard — no manual runs mid full-flow-run
      const node = nodesRef.current.find((n) => n.id === nodeId)
      if (!node || node.type !== 'generate') return
      // RUN METER — "decrement per ... Run Model" (PLAN.md). GenerateNode.jsx
      // already disables the button itself at 0 (with the "Out of runs"
      // title), this is the actual enforcement — same belt-and-braces
      // pattern as runWorkflow/runFromNode above.
      if (runsRemainingRef.current <= 0) return
      // MODEL-AGNOSTIC POSTURE — single node, so runCostForModels([...one])
      // is just that one model's own tier price.
      consumeRun(runCostForModels([node.data?.model]))
      pushHistory() // one checkpoint for the whole develop+spawn/replace beat
      // SEED DISCIPLINE (CP2, item 3) — "locked = Re-run/Run Model reproduce
      // identical variant set": locked reuses data.seed AS-IS; unlocked
      // (default) auto-advances by the same deterministic +1 step the dice
      // button uses, preserving today's pre-existing "always fresh" feel
      // until a user opts into the padlock.
      const currentSeed = node.data?.seed ?? DEFAULT_GENERATE_SEED
      const nextSeed = node.data?.seedLocked ? currentSeed : currentSeed + 1
      const seed = makeSeed(nodeId, nextSeed)
      patchNodeData(nodeId, { runState: 'running', output: { developing: true, seed }, seed: nextSeed })
      setTimeout(() => {
        // Header Stop (RunControls, App.jsx) resets EVERY non-idle node's
        // runState back to 'idle' — including this one, since it's the
        // header's own `runState` derivation that put "Stop" on screen to
        // begin with. This standalone beat has no AbortController of its
        // own to cancel the pending timeout, so it has to notice the abort
        // the same indirect way: if this node isn't 'running' anymore when
        // the beat would complete, someone stopped it — bail out instead of
        // resurrecting the run a second late.
        const still = nodesRef.current.find((n) => n.id === nodeId)
        if (still?.data?.runState !== 'running') return
        patchNodeData(nodeId, { runState: 'done', output: { developing: false, seed } })
        spawnOrReplaceGrid(nodeId)
      }, GENERATE_DEVELOP_MS)
    }

    // Per-card Re-run (PLAN.md part 2) — "re-develops with seed++" (the
    // stored seed itself increments — no re-seed formula); this card only,
    // nothing else in the grid moves.
    const onRerunVariant = (event) => {
      const { nodeId } = event.detail || {}
      setRawNodes((nds) =>
        nds.map((n) => (n.id === nodeId && n.type === 'variant' ? { ...n, data: { ...n.data, seed: (n.data.seed + 1) >>> 0 } } : n)),
      )
    }

    // "-> Output" mint (PLAN.md part 2: "mints a wired Output(Graphic) node
    // carrying that artifact — the pick-the-winner beat"). Wired FROM the
    // generate node's own `out` handle (the thing that actually produced
    // it); positioned clear of the whole grid via the same slideClear every
    // other node-creating action in this file uses.
    const onMintOutput = (event) => {
      const { nodeId } = event.detail || {}
      const card = nodesRef.current.find((n) => n.id === nodeId && n.type === 'variant')
      if (!card) return
      const frame = nodesRef.current.find((n) => n.id === card.parentId)
      const genNode = nodesRef.current.find((n) => n.id === card.data.generateNodeId)
      pushHistory()
      const newId = genId('output')
      const OUT_W = 270
      const OUT_H = 260
      const frameBox = frame ? nodeBox(frame) : null
      const desired = frameBox
        ? { x: frameBox.x + frameBox.w + VARIANT_GROUP_GAP, y: frameBox.y + card.position.y }
        : { x: (genNode ? nodeBox(genNode).x : 0) + 400, y: genNode ? nodeBox(genNode).y : 0 }
      const collisionNodes = nodesRef.current.filter((n) => !n.parentId)
      const pos = slideClear(collisionNodes, desired, OUT_W, OUT_H)
      const newNode = {
        id: newId,
        type: 'output',
        position: pos,
        data: {
          format: 'Graphic',
          description: 'The selected variant, picked from the generate grid.',
          // `poster:true` — OutputNode.jsx/RunPreview.jsx's own small
          // conditional (their own header comments) so THIS artifact really
          // is "that artifact" (PLAN.md) rather than a mismatched re-roll
          // from run/artifacts.jsx's general set once it's minted here.
          output: { format: 'Graphic', content: '', developing: false, seed: card.data.seed, poster: true },
          runState: 'done',
        },
        measured: {},
      }
      const newEdge = genNode
        ? { id: genId('edge'), source: genNode.id, sourceHandle: 'out', target: newId, targetHandle: 'in', type: 'omni' }
        : null
      setRawNodes((nds) => [...nds, newNode])
      if (newEdge) setEdges((eds) => [...eds, newEdge])
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('cw:ripple', { detail: { x: pos.x, y: pos.y, w: OUT_W, h: OUT_H } }))
        if (newEdge) {
          window.dispatchEvent(
            new CustomEvent('cw:surge', {
              detail: { source: newEdge.source, target: newEdge.target, sourceHandle: newEdge.sourceHandle },
            }),
          )
        }
        // PRODUCTION CLARITY PASS (PLAN.md "Dock = the record of what the
        // run DELIVERED") — "A minted variant becomes an Output node, so it
        // reaches the dock the honest way": the SAME cw:artifact contract
        // engine.js's own 'output' case fires on a real run completion, so a
        // minted pick reaches the completion glide's own accumulator (this
        // file's runDeliveredIdsRef) exactly like any other delivered
        // output — no separate grouped/capped path (that whole mechanism is
        // gone; generate variants themselves no longer push thumbs at all,
        // PLAN.md part 2). DELIVERABLES IN THE PANEL's own roll call
        // (deliveryOrderRef) also receives this id, but never grows a panel
        // row from it alone — a mint carries no `versions` array of its own
        // (that's a real run's engine.js concern only), so both OutputNode's
        // version rail AND CompiledPanel's version-gated filter treat it as
        // nothing to browse/list — a card with exactly one take.
        // `number` is deliberately omitted — this isn't inside a run,
        // so there's no `artifactCount` to hand it. Delayed into this SAME
        // already-deferred callback (not the synchronous setRawNodes above)
        // so OutputNode.jsx has mounted and registered its own
        // cw:open-artifact listener before anything could try to open it.
        window.dispatchEvent(
          new CustomEvent('cw:artifact', { detail: { nodeId: newId, format: 'Graphic', seed: card.data.seed, poster: true } }),
        )
      }, 0)
    }

    window.addEventListener('cw:run-generate', onRunGenerate)
    window.addEventListener('cw:rerun-variant', onRerunVariant)
    window.addEventListener('cw:mint-output', onMintOutput)
    return () => {
      window.removeEventListener('cw:run-generate', onRunGenerate)
      window.removeEventListener('cw:rerun-variant', onRerunVariant)
      window.removeEventListener('cw:mint-output', onMintOutput)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ---- connections -------------------------------------------------------
  // RUN PHASE (R1.2) — "block graph edits while running (ignore connect/drop
  // during run)": rejecting every connection attempt outright while a run is
  // active is the more robust half of that guard (onConnect below no-ops
  // too, belt-and-braces).
  const isValidConnection = useCallback((connection) => {
    if (runStateRef.current !== 'idle') return false
    const { source, target, sourceHandle } = connection
    if (!source || !target || source === target) return false
    const targetNode = nodesRef.current.find((n) => n.id === target)
    if (!targetNode || targetNode.type === 'trigger') return false
    const handleId = sourceHandle ?? 'out'
    // COMFY ROUND (CP2, item 5) — "PARAM NODE": "one params node can feed
    // many tasks (fan-out legal)" is an explicit, named EXCEPTION to the
    // one-edge-per-source-handle rule every other block's plain `out`
    // obeys (§App shell "isValidConnection" spec) — every other source
    // handle in this app, including Trigger's own `out`, still caps at one.
    const sourceNode = nodesRef.current.find((n) => n.id === source)
    if (sourceNode?.type === 'params') return true
    // WAVE 2 — THE VERB EXPANSION. Source/Audience are structurally
    // identical to Params here (out-only value carriers a whole flow's
    // worth of downstream blocks would plausibly all want to read) — same
    // fan-out-legal exception, same reasoning. Measure is a normal in+out
    // node and stays capped at one edge per source handle like task/output.
    if (sourceNode?.type === 'signal' && (sourceNode?.data?.kind || 'source') !== 'measure') return true
    const alreadyUsed = edgesRef.current.some((e) => e.source === source && (e.sourceHandle ?? 'out') === handleId)
    return !alreadyUsed
  }, [])

  const onConnect = useCallback(
    (connection) => {
      if (runStateRef.current !== 'idle') return // RUN PHASE (R1.2) guard
      pushHistory()
      setEdges((eds) => addEdge({ ...connection, targetHandle: connection.targetHandle ?? 'in', type: 'omni' }, eds))
      // MOTION PHASE item 7 — cw:surge contract (PLAN.md "Cross-seam
      // contracts"). Deferred one tick; see header comment.
      const { source, target, sourceHandle } = connection
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('cw:surge', { detail: { source, target, sourceHandle } }))
      }, 0)
    },
    [setEdges, pushHistory],
  )

  // ---- palette --------------------------------------------------------
  // RUN PHASE (R1.2) — "ignore connect/drop during run"; drop (palette DnD
  // and click-to-add both funnel through here) simply no-ops mid-run.
  // Response-type switch is DESTRUCTIVE when leaving choice mode — the
  // per-option handles unmount and every edge wired to them must go too
  // (Bryan: "the nodes that were connected to the multiple choice thing
  // stay where they were"). One checkpoint covers the switch + the prune
  // (the prune effect below runs inside the same history frame), so a
  // single Cmd+Z brings back both the mode and its wiring.
  // THE SPLIT (PLAN.md "## THE SPLIT") — "changeResponseType loses its chat
  // stamping": the dialogue half of the old human node is CheckinNode.jsx
  // now, a separate type with no response-type control at all, so there is
  // no more third 'chat' tab this Segmented switch could ever leave — plain
  // free<->choice, byte-identical to pre-merge.
  const changeResponseType = useCallback((nodeId, next) => {
    pushHistory()
    setRawNodes((nds) =>
      nds.map((n) => {
        if (n.id !== nodeId) return n
        return {
          ...n,
          data: { ...n.data, responseType: next },
        }
      }),
    )
  }, [pushHistory])

  // NODE TOOLBAR V2 — Color chip (PLAN.md item 2): "Persisted in node data
  // (data.tint), undoable" — the one toolbar mutation this phase calls out
  // as undoable by name (collapse/skip below are plain data patches, same
  // footing as any other in-card field edit, which this app never
  // checkpoints — see changeResponseType's own comment for why THIS kind of
  // toggle gets pushHistory() instead: it's a step change a user would
  // reasonably want to walk back with Cmd+Z, not a keystroke). `tint` is
  // either one of shared.jsx's TINT_SWATCHES ids or `null` ("none").
  const setNodeTint = useCallback((nodeId, tint) => {
    pushHistory()
    setRawNodes((nds) => nds.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, tint: tint || null } } : n)))
  }, [pushHistory])

  // CONTEXT & CLIPBOARD (PLAN.md item 2 — "Pin"). "Undoable" is called out
  // explicitly (unlike Collapse/Skip just below, which never have been) —
  // same footing as setNodeTint just above: a toggle a user would expect
  // Cmd+Z to walk back.
  const setNodePinned = useCallback((nodeId, pinned) => {
    pushHistory()
    patchNodeData(nodeId, { pinned })
  }, [pushHistory, patchNodeData])

  // ---------------------------------------------------------------------
  // CONTEXT & CLIPBOARD (PLAN.md item 1 — "Copy / Paste / Duplicate
  // hotkeys"). Clipboard lives in a plain ref (module state, not the system
  // clipboard, per spec) — copying never needs to cause a render, only
  // pasting does (and that already mutates nodes/edges, which re-renders on
  // its own). `pasteCascadeRef` is the "+24px cascade on repeat pastes"
  // counter; a fresh Copy always restarts it, matching Comfy/Figma's own
  // "this is a NEW clipboard lineage" convention.
  // ---------------------------------------------------------------------
  const clipboardRef = useRef(null)
  const pasteCascadeRef = useRef(0)

  const copyNodes = useCallback((nodeIds) => {
    const idSet = new Set(nodeIds)
    const srcNodes = nodesRef.current.filter((n) => idSet.has(n.id) && !NON_CLONEABLE_TYPES.has(n.type))
    if (!srcNodes.length) return
    const keptIds = new Set(srcNodes.map((n) => n.id))
    const srcEdges = edgesRef.current.filter((e) => keptIds.has(e.source) && keptIds.has(e.target))
    clipboardRef.current = {
      nodes: srcNodes.map((n) => ({ id: n.id, type: n.type, position: { ...n.position }, data: structuredClone(n.data) })),
      edges: structuredClone(srcEdges),
    }
    pasteCascadeRef.current = 0
  }, [])

  const pasteClipboard = useCallback(() => {
    if (runStateRef.current !== 'idle') return // RUN PHASE guard — same posture as addNodeFromPalette below (graph-add blocked mid-run)
    const clip = clipboardRef.current
    if (!clip || !clip.nodes.length) return
    pushHistory()
    const xs = clip.nodes.map((n) => n.position.x)
    const ys = clip.nodes.map((n) => n.position.y)
    const groupCentreX = (Math.min(...xs) + Math.max(...xs)) / 2
    const groupCentreY = (Math.min(...ys) + Math.max(...ys)) / 2
    const centre = viewportCentre()
    const cascade = pasteCascadeRef.current * 24
    pasteCascadeRef.current += 1
    const { clones, clonedEdges } = cloneNodesWithInternalEdges(clip.nodes, clip.edges, (n) => ({
      x: n.position.x - groupCentreX + centre.x + cascade,
      y: n.position.y - groupCentreY + centre.y + cascade,
    }))
    setRawNodes((nds) => [...nds.map((n) => (n.selected ? { ...n, selected: false } : n)), ...clones])
    if (clonedEdges.length) setEdges((eds) => [...eds, ...clonedEdges])
    setTimeout(() => {
      clonedEdges.forEach((e) => {
        window.dispatchEvent(
          new CustomEvent('cw:surge', { detail: { source: e.source, target: e.target, sourceHandle: e.sourceHandle } }),
        )
      })
      window.dispatchEvent(new CustomEvent('cw:ripple', { detail: { x: centre.x + cascade, y: centre.y + cascade } }))
    }, 0)
  }, [pushHistory, viewportCentre])

  // ⌘D AND the overflow/right-click menu's "Duplicate" row both funnel
  // through this one function now (single id = the old per-node toolbar
  // button's job; 2+ ids = the new multi-select scoping — PLAN.md: "⌘D =
  // duplicate selection in place (+32px offset)"). Supersedes the old
  // single-node `cw:duplicate` window event/listener pair (+40/+40 offset)
  // — same conceptual action, and the amended spec assigns this exact
  // keycap to this exact menu row, so both paths now agree on +32px rather
  // than carrying two slightly different "duplicate" behaviors.
  const duplicateNodes = useCallback((nodeIds) => {
    const idSet = new Set(nodeIds)
    const srcNodes = nodesRef.current.filter((n) => idSet.has(n.id) && !NON_CLONEABLE_TYPES.has(n.type))
    if (!srcNodes.length) return
    pushHistory()
    const { clones, clonedEdges } = cloneNodesWithInternalEdges(srcNodes, edgesRef.current, (n) => ({
      x: n.position.x + 32,
      y: n.position.y + 32,
    }))
    setRawNodes((nds) => [...nds.map((n) => (n.selected ? { ...n, selected: false } : n)), ...clones])
    if (clonedEdges.length) setEdges((eds) => [...eds, ...clonedEdges])
    setTimeout(() => {
      clonedEdges.forEach((e) => {
        window.dispatchEvent(
          new CustomEvent('cw:surge', { detail: { source: e.source, target: e.target, sourceHandle: e.sourceHandle } }),
        )
      })
      const cx = clones.reduce((sum, c) => sum + c.position.x, 0) / clones.length
      const cy = clones.reduce((sum, c) => sum + c.position.y, 0) / clones.length
      window.dispatchEvent(new CustomEvent('cw:ripple', { detail: { x: cx, y: cy } }))
    }, 0)
  }, [pushHistory])

  // ---------------------------------------------------------------------
  // SUBGRAPHS — full spec (PLAN.md "## SUBGRAPHS — full spec"). Four
  // context actions:
  //   enterTaskSteps — "First entry into a stepless task seeds three
  //     editable steps... one checkpoint" — seeds ONLY when `data.steps` is
  //     still empty (re-entering an already-stepped task is a data no-op);
  //     FlowCanvas.jsx calls this THEN opens its own visual stage — this
  //     function only ever owns the DATA half of "Enter".
  //   patchTaskSteps — the one generic write path every CRUD edit inside
  //     the internal stage funnels through ("All edits patch task.data.
  //     steps via patchNodeData... each edit is one main-history
  //     checkpoint"): the caller (the subgraph stage component) computes
  //     the WHOLE next `{nodes,edges}` value (add/remove/rename/reposition)
  //     and hands it here, which just checkpoints + writes it exactly once
  //     per call — so the CALLER controls how many checkpoints a gesture
  //     costs (one per completed drag or committed rename, never one per
  //     keystroke/animation frame).
  //   convertToSubgraph — "selected nodes become steps... a new Task
  //     replaces them" (multi-select >= 1; single node = wrap into a Task,
  //     per the CONTEXT & CLIPBOARD amendment).
  //   expandStepsToCanvas — the inverse: "dissolves the task, places steps
  //     back as REAL nodes... slideClear placement" — reuses this file's
  //     own resolvePlacement/placeAt (below), the exact same "never land on
  //     top of existing content" machinery TEMPLATES PHASE already proved
  //     out, rather than inventing a second placement scheme.
  // ---------------------------------------------------------------------
  const enterTaskSteps = useCallback(
    (taskId) => {
      const node = nodesRef.current.find((n) => n.id === taskId)
      if (!node || node.type !== 'task') return false
      const hasSteps = Array.isArray(node.data?.steps?.nodes) && node.data.steps.nodes.length > 0
      if (!hasSteps) {
        pushHistory()
        const seeded = seedTaskSteps()
        setRawNodes((nds) => nds.map((n) => (n.id === taskId ? { ...n, data: { ...n.data, steps: seeded } } : n)))
      }
      return true
    },
    [pushHistory],
  )

  const patchTaskSteps = useCallback(
    (taskId, nextSteps) => {
      pushHistory()
      setRawNodes((nds) => nds.map((n) => (n.id === taskId ? { ...n, data: { ...n.data, steps: nextSteps } } : n)))
    },
    [pushHistory],
  )

  const convertToSubgraph = useCallback(
    (nodeIds) => {
      const idSet = new Set(nodeIds)
      const selected = nodesRef.current.filter((n) => idSet.has(n.id) && !SUBGRAPH_EXCLUDED_TYPES.has(n.type))
      if (!selected.length) return
      pushHistory()

      const minX = Math.min(...selected.map((n) => n.position.x))
      const minY = Math.min(...selected.map((n) => n.position.y))
      const stepIdByNodeId = new Map()
      const stepNodes = selected.map((n) => {
        const stepId = genId('step')
        stepIdByNodeId.set(n.id, stepId)
        return {
          id: stepId,
          title: (n.data && n.data.title) || nodeDisplayTitle(n),
          kindTag: n.type,
          // Round-trip fidelity (Convert -> Expand -> Convert byte-equal,
          // PLAN.md Verify) — run residue stripped exactly like undo
          // history's own snapshots (stripRunFields above), so a
          // re-materialized step never shows a stale runState/output left
          // over from before it was folded in.
          sourceData: structuredClone(stripRunFields(n.data || {})),
          position: { x: n.position.x - minX, y: n.position.y - minY },
        }
      })

      const selectedIds = new Set(selected.map((n) => n.id))
      const stepEdges = edgesRef.current
        .filter((e) => selectedIds.has(e.source) && selectedIds.has(e.target))
        .map((e) => ({ id: genId('stepedge'), source: stepIdByNodeId.get(e.source), target: stepIdByNodeId.get(e.target) }))

      const taskId = genId('task')
      const baseTitle = (selected[0].data && selected[0].data.title) || nodeDisplayTitle(selected[0])
      const extra = selected.length - 1
      const taskNode = {
        id: taskId,
        type: 'task',
        position: { x: minX, y: minY },
        data: {
          ...makeTaskData(),
          title: extra > 0 ? `${baseTitle} + ${extra} more` : baseTitle,
          steps: { nodes: stepNodes, edges: stepEdges },
        },
        measured: {},
      }

      // External wires reattach to the new task's single in/out (PLAN.md);
      // edges with BOTH ends in the selection became step edges above and
      // are dropped here rather than kept pointing at ids that no longer
      // exist on the main canvas.
      const nextEdges = edgesRef.current
        .filter((e) => !(selectedIds.has(e.source) && selectedIds.has(e.target)))
        .map((e) => {
          if (selectedIds.has(e.target)) return { ...e, target: taskId, targetHandle: 'in' }
          if (selectedIds.has(e.source)) return { ...e, source: taskId, sourceHandle: 'out' }
          return e
        })

      setRawNodes((nds) => [...nds.filter((n) => !selectedIds.has(n.id)), taskNode])
      setEdges(nextEdges)
    },
    [pushHistory],
  )

  const expandStepsToCanvas = useCallback(
    (taskId) => {
      const task = nodesRef.current.find((n) => n.id === taskId && n.type === 'task')
      const steps = task?.data?.steps
      if (!task || !steps || !Array.isArray(steps.nodes) || !steps.nodes.length) return
      pushHistory()

      const stepIdToNodeId = new Map()
      const newNodes = steps.nodes.map((step) => {
        const { type, data } = defaultNodeForStep(step)
        const nodeId = genId(type)
        stepIdToNodeId.set(step.id, nodeId)
        return { id: nodeId, type, position: { x: step.position?.x ?? 0, y: step.position?.y ?? 0 }, data, measured: {} }
      })
      const newEdges = (steps.edges || [])
        .map((e) => ({
          id: genId('edge'),
          source: stepIdToNodeId.get(e.source),
          sourceHandle: 'out',
          target: stepIdToNodeId.get(e.target),
          targetHandle: 'in',
          type: 'omni',
        }))
        .filter((e) => e.source && e.target)

      // Single entry/exit, mirroring the schema's own single in/out task
      // handles — "external wires reattach to entry/exit steps" (PLAN.md).
      const hasIncoming = new Set((steps.edges || []).map((e) => e.target))
      const hasOutgoing = new Set((steps.edges || []).map((e) => e.source))
      const entryStep = steps.nodes.find((s) => !hasIncoming.has(s.id)) || steps.nodes[0]
      const exitStep = steps.nodes.find((s) => !hasOutgoing.has(s.id)) || steps.nodes[steps.nodes.length - 1]
      const entryNodeId = stepIdToNodeId.get(entryStep.id)
      const exitNodeId = stepIdToNodeId.get(exitStep.id)

      const graph = { nodes: newNodes, edges: newEdges }
      const origin = resolvePlacement(nodesRef.current.filter((n) => n.id !== taskId), graph, task.position)
      const placed = placeAt(graph, origin)

      const untouchedEdges = edgesRef.current.filter((e) => e.source !== taskId && e.target !== taskId)
      const retargetedEdges = edgesRef.current
        .filter((e) => e.source === taskId || e.target === taskId)
        .map((e) =>
          e.target === taskId
            ? { ...e, target: entryNodeId, targetHandle: 'in' }
            : { ...e, source: exitNodeId, sourceHandle: 'out' },
        )

      setRawNodes((nds) => [...nds.filter((n) => n.id !== taskId), ...placed.nodes])
      setEdges([...untouchedEdges, ...retargetedEdges])
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('cw:ripple', { detail: { x: origin.x, y: origin.y } }))
      }, 0)
    },
    [pushHistory],
  )

  // NODE TOOLBAR V2 — Collapse (item 3), Skip (item 4), and Rename (item 6)
  // all patch node data straight from shared.jsx's toolbar, through
  // `patchNodeData` below (already defined further down for the run
  // engine's own use) exposed via context for exactly this purpose, rather
  // than a fresh `useReactFlow().updateNodeData()` call from that file.
  // Same direct setRawNodes path setNodeTint above already uses — one
  // fewer indirection (no dependency on @xyflow/react's own internal
  // update-batching) for three call sites verified under real interaction
  // during this phase. None of the three run through pushHistory (unlike
  // tint): PLAN.md only calls tint out as undoable by name; these stay
  // ordinary, uncheckpointed data patches, like any other in-card field
  // edit (e.g. HumanNode's own ask/options inputs, which DO still use
  // updateNodeData directly — untouched, out of this phase's scope).

  // Dangling-edge janitor: whenever a node's dynamic handle set shrinks
  // (mode switch, a choice option or switch case deleted), edges still
  // pointing at the departed sourceHandle would render from a stale
  // position, floating in space. Derived cleanup, NO checkpoint of its own —
  // it always rides whatever action caused the shrink. Undo restores nodes
  // and edges atomically from the same snapshot, so this never fights the
  // history machinery.
  useEffect(() => {
    const nodeById = new Map(rawNodes.map((n) => [n.id, n]))
    const invalid = rawEdges.filter((e) => {
      const src = nodeById.get(e.source)
      if (!src) return false
      const valid = validSourceHandles(src)
      return valid !== null && e.sourceHandle && !valid.has(e.sourceHandle)
    })
    if (invalid.length) {
      const ids = new Set(invalid.map((e) => e.id))
      setEdges((eds) => eds.filter((e) => !ids.has(e.id)))
    }
  }, [rawNodes, rawEdges])

  const addNodeFromPalette = useCallback((item, position) => {
    if (runStateRef.current !== 'idle') return
    pushHistory() // RUN PHASE (R1.3) — "node add"
    // Centre-of-screen landing (Bryan) — a click-added block appears where
    // you're looking, not off the right edge of the graph.
    const centred = !position
    const newNode = { id: genId(item.nodeType), type: item.nodeType, position: position ?? { x: 0, y: 0 }, data: item.makeData(), measured: {} }
    let pos = position ?? viewportCentre()
    let centre = pos
    if (centred) {
      // Centre the block's BOX on that point, not its top-left corner — a
      // 340px-wide card hung off the centre by its corner reached most of the
      // way to the panel — and then slide it clear of anything already there.
      // Clicking the same palette row twice used to stack two blocks at
      // exactly the same coordinates, which reads as one block you can't
      // connect to anything (and is the other half of Bryan's question).
      const box = nodeBox({ ...newNode, position: { x: 0, y: 0 } })
      pos = { x: pos.x - box.w / 2, y: pos.y - box.h / 2 }
      // VARIANT STUDIO — a grid child's `.position` is relative to its OWN
      // frame, not the canvas; collision math over the raw list would treat
      // that small offset as an absolute point. Only top-level nodes (which
      // includes every variantgroup frame — its own box already covers its
      // children spatially) are real collision candidates.
      pos = slideClear(nodesRef.current.filter((n) => !n.parentId), pos, box.w, box.h)
      centre = { x: pos.x + box.w / 2, y: pos.y + box.h / 2 }
    }
    newNode.position = pos
    setRawNodes((nds) => [...nds, newNode])
    // Glide to the block's CENTRE — gliding to its top-left corner hung the
    // whole card down-and-right of where you were looking, which is how the
    // source handle kept ending up behind the panel.
    if (centred) glideTo(centre)
  }, [pushHistory, viewportCentre, glideTo])

  // ---- templates (TEMPLATES PHASE — TP1) ---------------------------------
  // Same click-vs-drag shape as addNodeFromPalette above (optional
  // `position` = drag, via FlowCanvas.jsx's screenToFlowPosition; omitted =
  // click, computed clear of the existing graph below) but inserts a whole
  // template graph — data/templates/builder.js's `template({...}).build()` —
  // instead of a single node. RUN PHASE guard: "Blocked while runState !==
  // 'idle', same guard as connect/drop" (PLAN.md TP1 item 3).
  // ---- issues popover actions (Bryan) ------------------------------------
  // Jump-link: select the offending node and glide it to centre.
  const focusIssue = useCallback((nodeId) => {
    const node = nodesRef.current.find((n) => n.id === nodeId)
    if (!node) return
    setRawNodes((nds) => nds.map((n) => ({ ...n, selected: n.id === nodeId })))
    // VARIANT STUDIO — resolveNodeBox (not a raw nodeBox) since this is also
    // FlowCanvas.jsx's search-result jump-link path, and a search hit COULD
    // be a grid child (its `.position` is relative to its own frame).
    const box = resolveNodeBox(node, new Map(nodesRef.current.map((n) => [n.id, n])))
    glideTo({ x: box.x + box.w / 2, y: box.y + box.h / 2 })
  }, [glideTo])

  // DELIVERABLES A+C — "click = glide + preview (identical handlers to
  // panel rows — share them via state, do not fork)" (PLAN.md). ONE jump
  // handler for both views: focusIssue's own select+glide, then the SAME
  // `cw:open-artifact` window event OutputNode.jsx already listens for
  // (DELIVERABLE DOWNLOADS' RunPreview-reopen contract — see that file's
  // "Filmstrip.jsx no longer exists" comment) so the node that actually owns
  // the artifact opens ITS OWN RunPreview off ITS OWN live data. Issue rows
  // stay on plain `focusIssue` (an issue isn't an artifact to preview) —
  // this is only ever passed to a DELIVERABLE row/thumb's own click.
  // VERSION HISTORY IN THE OVERLAY — `versionIndex: null` extends this same
  // payload to say explicitly what this bridge always effectively meant:
  // the shelf's own thumb only ever shows the node's CURRENT version
  // (deliverableDescriptor above — "never a browsed/older one"), so opening
  // it should always land RunPreview on latest, even if that node's own
  // card happens to be mid-browse to an older take of itself right now.
  // `null` (rather than just omitting the field) makes that "always latest"
  // an explicit, self-documenting part of the event's own shape instead of
  // an assumption baked into whichever node happens to be listening.
  const openDeliverable = useCallback((nodeId) => {
    focusIssue(nodeId)
    window.dispatchEvent(new CustomEvent('cw:open-artifact', { detail: { nodeId, versionIndex: null } }))
  }, [focusIssue])

  // ISSUES POPOVER V2 (PLAN.md "### 3") — one issue, one checkpoint. Re-reads
  // `issues` fresh (rather than trusting a possibly-stale id from a prior
  // render) so a double-click or a race against Auto fix just no-ops on the
  // second call instead of throwing or double-wiring. Never calls
  // focusIssue/glideTo — "no jump on Fix — jump stays on row click only"
  // (PLAN.md Verify). Returns whether a fix actually landed (CDP-found edge
  // case: a disconnected node with NO other node on the canvas to wire FROM
  // can't be fixed at all — FlowCanvas.jsx's row uses this return value to
  // decide whether to auto-close the popover, rather than assuming "it was
  // the last row" always means "it's now fixed"). No-op (no checkpoint, no
  // setRawNodes/setEdges call) when nothing could be applied.
  const fixIssue = useCallback(
    (issueId) => {
      const current = computeIssues(nodesRef.current, edgesRef.current)
      const issue = current.find((i) => i.id === issueId)
      if (!issue) return false
      const { nodes, edges, newEdge, applied } = applySingleFix(issue, nodesRef.current, edgesRef.current)
      if (!applied) return false
      pushHistory()
      setRawNodes(nodes)
      setEdges(edges)
      if (newEdge) {
        // Same cw:surge on new wires as autoFixIssues' own wiring pass below
        // (PLAN.md "### 3": "same cw:surge on new wires") — same 60ms defer,
        // since this is the identical wire-from-nearest-left operation.
        setTimeout(() => {
          window.dispatchEvent(
            new CustomEvent('cw:surge', {
              detail: { source: newEdge.source, target: newEdge.target, sourceHandle: newEdge.sourceHandle },
            }),
          )
        }, 60)
      }
      return true
    },
    [pushHistory],
  )

  // Auto fix: agents + descriptions are filled with sensible defaults;
  // disconnected nodes get wired from the nearest free `out` handle to their
  // left (falling back to any free `out`). One undo checkpoint for the lot —
  // ISSUES POPOVER V2's refactor makes this a loop over applySingleFix (the
  // same per-issue patch fixIssue above uses), rather than its own separate
  // agent/description/wiring passes, so the two paths can't drift apart.
  const autoFixIssues = useCallback(() => {
    const current = computeIssues(nodesRef.current, edgesRef.current)
    if (!current.length) return
    pushHistory()

    let nodes = nodesRef.current
    let edges = edgesRef.current
    const newEdges = []
    for (const issue of current) {
      const result = applySingleFix(issue, nodes, edges)
      nodes = result.nodes
      edges = result.edges
      if (result.newEdge) newEdges.push(result.newEdge)
    }
    setRawNodes(nodes)
    setEdges(edges)
    newEdges.forEach((edge) => {
      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent('cw:surge', { detail: { source: edge.source, target: edge.target, sourceHandle: 'out' } }),
        )
      }, 60)
    })
  }, [pushHistory])

  const insertTemplate = useCallback(
    (templateId, position) => {
      if (runStateRef.current !== 'idle') return
      const tpl = TEMPLATES.find((t) => t.id === templateId)
      if (!tpl) return
      pushHistory() // TP1 — "pushHistory() first (undoable)"
      const graph = tpl.build()
      const centredInsert = !position
      let desired = position
      if (!desired) {
        // Centre the template's own bounds on the viewport centre.
        const c = viewportCentre()
        const b = graphBounds(graph.nodes)
        desired = b ? { x: c.x - b.w / 2, y: c.y - b.h / 2 } : c
      }
      // Both paths resolve: a drag honours the drop point unless it would
      // collide, in which case it slides straight down until clear.
      // VARIANT STUDIO — top-level only; see addNodeFromPalette's own note.
      const origin = resolvePlacement(nodesRef.current.filter((n) => !n.parentId), graph, desired)
      const placed = placeAt(graph, origin)
      setRawNodes((nds) => [...nds, ...placed.nodes])
      setEdges((eds) => [...eds, ...placed.edges])
      // Deferred like loadFlow's own fitView below — lets the just-appended
      // nodes register with React Flow's internal store before an
      // imperative read (same reasoning as this file's other
      // setTimeout(...,60) calls).
      setTimeout(() => {
        const b = graphBounds(placed.nodes)
        if (centredInsert && b) {
          // Glide to the template's centre rather than refitting the whole
          // graph — the new thing is what you want to be looking at.
          // Through glideTo, NOT raw setCenter (E2E sweep, Journey B FAIL 1):
          // setCenter centres on the pane, so every centred insert parked
          // exactly panelW/2 = 144px of the new template under the compiled
          // panel. glideTo is the one place that knows about the panel.
          glideTo({ x: b.x + b.w / 2, y: b.y + b.h / 2 })
        } else {
          fitView({ duration: 400, padding: 0.2, maxZoom: 1 })
        }
        window.dispatchEvent(
          new CustomEvent('cw:ripple', {
            // Whole-template footprint, so the shockwave frames everything
            // that just landed rather than a corner point.
            detail: b ? { x: b.x, y: b.y, w: b.w, h: b.h } : { x: origin.x, y: origin.y },
          }),
        )
      }, 60)
    },
    [fitView, pushHistory, viewportCentre, glideTo, setCenter, getZoom],
  )

  // SAVED FILES REOPEN (PLAN.md "## SAVED FILES REOPEN — a saved workflow
  // opens as itself") — Palette.jsx's FileRow click path for a RUNTIME file
  // (files.js's addRuntimeFile snapshot; seeded rows keep insertTemplate
  // above, which they already had). `snapshot` is the {nodes,edges} files.js
  // captured at save time (runState already reset to idle, chat/leaning
  // transients already cleared there — "the PROGRAM, not a mid-run freeze").
  //
  // Deliberately mirrors CONTEXT & CLIPBOARD's cloneNodesWithInternalEdges
  // (fresh genId per node, only edges with BOTH ends surviving the remint)
  // rather than template.build()'s mintId: a snapshot is a captured LIVE
  // graph, not an authored one, so — same as a copy/duplicate — it can carry
  // a VARIANT STUDIO grid. Same NON_CLONEABLE_TYPES drop that path already
  // uses ("grids re-spawn on run — copying a live wall is scope creep")
  // applies here for the identical reason; a happy side effect is that no
  // surviving node ever carries a parentId, so the plain placeAt/
  // resolvePlacement offset math below (byte-identical to insertTemplate's
  // own placement calls just above) never has to reconcile a child's
  // parent-relative position against the top-level offset.
  const insertSnapshot = useCallback(
    (snapshot, position) => {
      if (runStateRef.current !== 'idle') return
      if (!snapshot?.nodes?.length) return
      pushHistory() // same "pushHistory() first (undoable)" TP1 rule insertTemplate follows

      const idMap = new Map()
      const survivors = snapshot.nodes.filter((n) => !NON_CLONEABLE_TYPES.has(n.type))
      survivors.forEach((n) => idMap.set(n.id, genId(n.type)))
      const remintedNodes = survivors.map((n) => ({
        ...n,
        id: idMap.get(n.id),
        position: { ...n.position },
        data: structuredClone(n.data || {}),
        measured: {},
      }))
      const remintedEdges = (snapshot.edges || [])
        .filter((e) => idMap.has(e.source) && idMap.has(e.target))
        .map((e) => ({ ...e, id: genId('edge'), source: idMap.get(e.source), target: idMap.get(e.target) }))

      const graph = { nodes: remintedNodes, edges: remintedEdges }
      const centredInsert = !position
      let desired = position
      if (!desired) {
        const c = viewportCentre()
        const b = graphBounds(graph.nodes)
        desired = b ? { x: c.x - b.w / 2, y: c.y - b.h / 2 } : c
      }
      const origin = resolvePlacement(nodesRef.current.filter((n) => !n.parentId), graph, desired)
      const placed = placeAt(graph, origin)
      setRawNodes((nds) => [...nds, ...placed.nodes])
      setEdges((eds) => [...eds, ...placed.edges])
      // Same deferred glide/fitView + cw:ripple beat insertTemplate plays —
      // "same glide/landing behavior as template insert" (PLAN.md).
      setTimeout(() => {
        const b = graphBounds(placed.nodes)
        if (centredInsert && b) {
          glideTo({ x: b.x + b.w / 2, y: b.y + b.h / 2 })
        } else {
          fitView({ duration: 400, padding: 0.2, maxZoom: 1 })
        }
        window.dispatchEvent(
          new CustomEvent('cw:ripple', {
            detail: b ? { x: b.x, y: b.y, w: b.w, h: b.h } : { x: origin.x, y: origin.y },
          }),
        )
      }, 60)
    },
    [fitView, pushHistory, viewportCentre, glideTo],
  )

  // ---- toolbar ----------------------------------------------------------
  // MOTION PHASE item 2 — animated Tidy up. dagre's target layout is computed
  // once up front (tidyLayout is pure/synchronous); animatePositions then
  // owns tweening every node there frame-by-frame. Reduced motion: jump
  // straight to the target, no tween, no animated fitView.
  const tidyUp = useCallback(() => {
    pushHistory() // RUN PHASE (R1.3) — "tidy"; one checkpoint covers the whole tween.
    cancelTidyAnim()
    const current = nodesRef.current
    const target = tidyLayout(current, edgesRef.current)

    if (prefersReducedMotion()) {
      setRawNodes(target)
      fitView({ padding: 0.2, maxZoom: 1 })
      return
    }

    tidyAnimRef.current = animatePositions(
      current,
      target,
      { duration: 450, stagger: 25 },
      (frameNodes) => setRawNodes(frameNodes),
      () => {
        tidyAnimRef.current = null
        setTimeout(() => fitView({ duration: 400, padding: 0.2, maxZoom: 1 }), 60)
      },
    )
  }, [fitView, cancelTidyAnim, pushHistory])

  // MOTION PHASE item 5 — graph swaps. Bumping swapKey forces FlowCanvas's
  // inner stage to remount (fresh materialize cascade + edge draw-on); any
  // in-flight animated Tidy up is cancelled first so it can't fight a swap.
  //
  // CANVAS TABS PHASE item 3 — this is now also the shared path the topnav
  // canvas_1/canvas_2 tab listener below uses (samples.default / samples.empty),
  // per PLAN.md's "both through the same path Load-from-instructions/Clear
  // use." `fit:false` skips the fitView call outright rather than fitting an
  // empty node set (meaningless) — canvas_2's bare canvas just keeps the
  // frozen zoom-1 boot viewport (FlowCanvas.jsx's `defaultViewport`).
  const loadFlow = useCallback(
    (flowFactory, { fit = true } = {}) => {
      pushHistory() // RUN PHASE (R1.3) — "load/clear/tab-switch"
      cancelTidyAnim()
      const flow = flowFactory()
      setRawNodes(normalizeNodes(flow.nodes))
      setEdges(flow.edges)
      setSwapKey((k) => k + 1)
      // CANVAS-NATIVE DELIVERABLES — the completion glide's own per-run
      // accumulator; Clear/Load-from-instructions/demos/tab-switches all
      // funnel through this one shared path (this function's own header
      // comment), so resetting it here covers every one of those in a
      // single place.
      resetRunDelivered()
      // DELIVERABLES IN THE PANEL — "Clear/new-graph empties it" (PLAN.md
      // "### 1"): the SAME shared path, but this accumulator (unlike the one
      // above) is otherwise never reset by a run starting — see its own
      // header comment.
      resetDeliveryOrder()
      if (fit) {
        setTimeout(() => fitView({ duration: 300, padding: 0.2, maxZoom: 1 }), 60)
      }
    },
    [fitView, cancelTidyAnim, pushHistory, resetRunDelivered, resetDeliveryOrder],
  )

  const loadInstructions = useCallback(() => loadFlow(samples.audience), [loadFlow])
  // COMMENTS PHASE — "clearFlow also clears comments" (PLAN.md).
  const clearFlow = useCallback(() => {
    loadFlow(samples.blank)
    setComments([])
    setActiveCommentId(null)
  }, [loadFlow])

  // DEMO WORKFLOWS — App.jsx's title-dropdown DEMOS section calls this with
  // 'social'|'brief'|'launch' (also reachable via `?flow=`, see FLOW_PARAMS
  // above); reuses the exact same loadFlow path as Load-from-instructions/
  // Clear, so it gets the same swapKey remount + capped fitView for free.
  const loadSample = useCallback(
    (key) => {
      const factory = samples[key]
      if (factory) loadFlow(factory)
    },
    [loadFlow],
  )

  // PLATFORM CHROME ("### 3 — Session Workflows library"). `captureSnapshot`
  // (RUN PHASE R1.3, defined above) already gives exactly the shape this
  // needs — a structural {nodes,edges} copy with the four run-only data
  // fields stripped (runState/output/answer/takenHandle) — reused verbatim
  // rather than a second snapshot helper: a saved workflow reloading in a
  // "mid-run" visual state would be a stranger bug than reusing the same
  // posture the undo stack already takes. `thumb` computed once, here, at
  // save time (miniGraph.js's own header comment: "compute once, cache").
  const saveWorkflow = useCallback(
    (name) => {
      const snapshot = captureSnapshot()
      const nodeCount = snapshot.nodes.filter((n) => !n.parentId).length
      const record = {
        id: genId('wf'),
        name: name?.trim() || 'Untitled workflow',
        savedAt: Date.now(),
        nodeCount,
        snapshot,
        thumb: computeMiniGraph(snapshot),
      }
      setSavedWorkflows((prev) => [record, ...prev])
    },
    [captureSnapshot],
  )

  // Load path for BOTH a saved record and a starter-template stand-in
  // (WorkflowsLibrary.jsx builds the latter fresh at click time) — either
  // way it's just `{snapshot: {nodes, edges}}`, so this is loadFlow's own
  // shared path (pushHistory + swapKey bump + capped fitView + the two
  // per-run accumulator resets), same as Clear/Load-from-instructions/every
  // demo sample. WorkflowsLibrary.jsx's own confirm dialog (reusing the
  // Clear confirm's exact CSS/markup) already guards the call — same
  // unconditional-before-destructive-replace posture Clear itself uses, so
  // no separate dirty-check lives here.
  const loadWorkflowRecord = useCallback((record) => loadFlow(() => record.snapshot), [loadFlow])

  // RUN PHASE (R4.2 contract addition) — dragging an existing edge's end to
  // re-plug it. R4 wires `reconnectable`/`onReconnect` onto <ReactFlow>; this
  // is the "same path" onConnect already snapshots through (PLAN.md R4.2:
  // "R1 already snapshots on connect — call the same path on reconnect").
  const onReconnect = useCallback(
    (oldEdge, newConnection) => {
      pushHistory()
      setEdges((eds) => reconnectEdge(oldEdge, newConnection, eds))
    },
    [setEdges, pushHistory],
  )

  // CANVAS TABS PHASE — the shell (index.html) dispatches this while the
  // workflow overlay is open, when the topnav canvas_1/canvas_2 tabs are
  // clicked (see PLAN.md "## CANVAS TABS PHASE"). tab 1 = canvas_1 = the
  // builder exactly as it ships today; tab 2 = canvas_2 = a bare zero-node
  // canvas (FlowCanvas.jsx renders its closeable instructions card whenever

  const value = useMemo(
    () => ({
      nodes: numberedNodes,
      edges: rawEdges,
      // RUN PHASE (R1.3) — these are the history-tracking wrappers, not the
      // raw useNodesState/useEdgesState handlers; see the file header note.
      // Exposed under the SAME keys FlowCanvas.jsx already consumes, so it
      // needed no changes to pick up drag-stop/delete history tracking.
      onNodesChange: trackedOnNodesChange,
      onEdgesChange: trackedOnEdgesChange,
      onConnect,
      onReconnect,
      isValidConnection,
      addNodeFromPalette,
      insertTemplate,
      // SAVED FILES REOPEN — FileRow's other insert path, for runtime
      // (snapshot-carrying) Files rows.
      insertSnapshot,
      screenToFlowPosition,
      issues,
      focusIssue,
      changeResponseType,
      autoFixIssues,
      fixIssue,
      counts,
      tidyUp,
      loadInstructions,
      clearFlow,
      loadSample,
      swapKey,
      // PLATFORM CHROME ("### 3 — Session Workflows library").
      savedWorkflows,
      saveWorkflow,
      loadWorkflowRecord,
      // NODE TOOLBAR V2 — Color chip's undoable tint patch (item 2);
      // patchNodeData (defined above, originally for the run engine) is
      // ALSO the collapse/skip/rename patch path for items 3/4/6 — see its
      // own header comment above for why updateNodeData's queue isn't used
      // for any of these three instead.
      setNodeTint,
      patchNodeData,
      // CONTEXT & CLIPBOARD — Pin (undoable, own wrapper like setNodeTint)
      // and the Copy/Paste/Duplicate trio (shared clone core, above).
      setNodePinned,
      copyNodes,
      pasteClipboard,
      duplicateNodes,
      // SUBGRAPHS — enter/edit/convert/expand (PLAN.md "## SUBGRAPHS").
      enterTaskSteps,
      patchTaskSteps,
      convertToSubgraph,
      expandStepsToCanvas,
      // RUN PHASE (R1.2) — run controls + tri-state.
      runWorkflow,
      // NODE TOOLBAR V2 — "Run from here" (item 5).
      runFrom: runFromNode,
      stopRun,
      continueHuman,
      // HITL MICRO-CHAT — the review node's own micro-conversation.
      chatWithHuman,
      runState,
      // COMFY ROUND (CP2, item 2) — RUN METER. maxRuns is the constant
      // (module scope) exposed alongside the live counter so consumers never
      // have to import state.jsx's own internals to compute "how full".
      runsRemaining,
      maxRuns: MAX_RUNS,
      // DELIVERABLES IN THE PANEL (PLAN.md) — session-wide, first-completed
      // order of every output node id that has EVER delivered a version;
      // CompiledPanel.jsx joins this against `nodes` (above) to build its
      // DELIVERABLES rows. See deliveryOrderRef's own header comment for why
      // this is a separate accumulator from the completion glide's.
      deliveryOrder,
      // DELIVERABLES A+C — the shared selector (both views render this
      // directly instead of each re-deriving it), the shared jump+preview
      // handler, the shelf's own open/closed flag, and the shared Clear
      // action (resetDeliveryOrder — already used internally by loadFlow;
      // now ALSO the shelf's armed-Clear confirm). See each one's own
      // header comment above for why.
      deliverables,
      // RESULTS SHEET — which OutputNode.jsx card (if any) currently hosts
      // the satellite results sheet; see this value's own header comment
      // above for the full derivation/reasoning.
      resultsAnchorId,
      shelfOpen,
      setShelfOpen,
      openDeliverable,
      resetDeliveryOrder,
      // RUN PHASE (R1.3) — undo/redo.
      undo,
      redo,
      canUndo,
      canRedo,
      // COMMENTS PHASE — additive context (PLAN.md "### State — src/state.jsx").
      comments,
      commentMode,
      setCommentMode,
      addComment,
      addReply,
      toggleResolved,
      deleteComment,
      activeCommentId,
      setActiveCommentId,
    }),
    [
      numberedNodes,
      rawEdges,
      trackedOnNodesChange,
      trackedOnEdgesChange,
      onConnect,
      onReconnect,
      isValidConnection,
      addNodeFromPalette,
      insertTemplate,
      insertSnapshot,
      screenToFlowPosition,
      issues,
      focusIssue,
      changeResponseType,
      autoFixIssues,
      fixIssue,
      counts,
      tidyUp,
      loadInstructions,
      clearFlow,
      loadSample,
      swapKey,
      // PLATFORM CHROME ("### 3 — Session Workflows library").
      savedWorkflows,
      saveWorkflow,
      loadWorkflowRecord,
      setNodeTint,
      patchNodeData,
      setNodePinned,
      copyNodes,
      pasteClipboard,
      duplicateNodes,
      enterTaskSteps,
      patchTaskSteps,
      convertToSubgraph,
      expandStepsToCanvas,
      runWorkflow,
      runFromNode,
      stopRun,
      continueHuman,
      chatWithHuman,
      runState,
      runsRemaining,
      deliveryOrder,
      deliverables,
      resultsAnchorId,
      shelfOpen,
      openDeliverable,
      resetDeliveryOrder,
      undo,
      redo,
      canUndo,
      canRedo,
      comments,
      commentMode,
      addComment,
      addReply,
      toggleResolved,
      deleteComment,
      activeCommentId,
    ],
  )

  return <FlowStateContext.Provider value={value}>{children}</FlowStateContext.Provider>
}

function computeRightOfRightmost(nodes) {
  if (!nodes.length) return { x: 0, y: 0 }
  const rightmost = nodes.reduce((a, b) => (a.position.x > b.position.x ? a : b))
  const width = rightmost.measured?.width ?? 320
  const avgY = nodes.reduce((sum, n) => sum + n.position.y, 0) / nodes.length
  return { x: rightmost.position.x + width + 120, y: avgY }
}

// TEMPLATES PHASE (TP1) — click-to-insert origin: "clear of existing nodes
// (rightmost node's x + 200, vertically centred on the existing graph;
// empty canvas -> {x:0,y:0})" (PLAN.md). Distinct from
// computeRightOfRightmost above (that one seeds a single new node's own
// position via average-Y; this one seeds `placeAt`'s TOP-LEFT anchor for a
// whole multi-node template graph, so it also has to read the freshly-built
// `graph`'s own vertical span and back it out — a flat average-Y would just
// stack the template with its OWN top edge at the existing graph's center,
// not its center there). Drag-insertion never calls this — a drop's
// screenToFlowPosition point is used as the origin directly, exactly like a
// plain palette-block drop.
// ---------------------------------------------------------------------------
// Template placement (Bryan: an inserted template must NEVER land on top of
// existing nodes).
//
// Everything here works in real box geometry — `nodeBox` prefers React Flow's
// own measurement and falls back to per-type estimates. The earlier version
// compared raw `position` values, which are a node's TOP-LEFT: it offset from
// the rightmost node's x by less than that card's own width (a task card is
// 340px), so a "clear" placement could still land inside it, and vertical
// centring ignored card heights entirely.
// ---------------------------------------------------------------------------
const PLACEMENT_GAP = 120

function boxesOverlap(a, b, gap) {
  return (
    a.x < b.x + b.w + gap &&
    a.x + a.w + gap > b.x &&
    a.y < b.y + b.h + gap &&
    a.y + a.h + gap > b.y
  )
}

// F9 (QA FINDINGS LEDGER) — this file used to also carry a
// computeTemplateOrigin(nodes, graph) ("clear of the existing graph's true
// RIGHT EDGE, vertically centred on it" — TP1's original spec'd click-insert
// origin: rightmost node's x + gap). It was genuinely dead code — zero call
// sites — because insertTemplate's actual click path centres new content on
// the VIEWPORT instead (glideTo, "the new thing is what you want to be
// looking at"), a later, deliberate UX call that superseded the spec'd
// off-to-the-right placement without anyone deleting the function it
// replaced. Reviving it as a drop-in would just reintroduce the older,
// worse-feeling placement, so the actual fix here is the OTHER half of the
// finding: harden resolvePlacement itself (below).
//
// The real diagnosis: resolvePlacement's collision test compares boxes built
// by nodeBox(), which prefers React Flow's own `measured` reading and falls
// back to builder.js's flat per-TYPE estimate (EST_HEIGHT.task = 560, etc.)
// whenever a node hasn't been measured yet. Two things make that estimate
// routinely wrong by MORE than PLACEMENT_GAP (120px), not just occasionally:
//   1. `graph.nodes` — the template being inserted — is the output of
//      tpl.build() moments ago, so EVERY insert reads its own footprint
//      (`tpl` below) off 100% unmeasured nodes, always, not just in a race.
//      Measured against real running cards: a task with an agent sub-card
//      renders ~560->708px (+148), a switch/choice node with several
//      branches ~300->545px (+245) — both blow past the 120px gap on their
//      own.
//   2. A second template inserted before the FIRST one's nodes finish their
//      own React Flow measurement pass reads the same stale estimate for
//      "existing" content too.
// Either one alone can make a placement look clear at estimate-time and
// overlap once real measurements land. safePlacementBox pads exactly the
// unmeasured case (never a node RF has already measured for real), so a
// settled graph's placement math is byte-for-byte what it was before this
// fix — only the "just built, nothing measured yet" moment gets more
// conservative.
const PLACEMENT_SAFETY_PAD = { w: 60, h: 260 }
function safePlacementBox(node) {
  const box = nodeBox(node)
  if (node.measured?.height) return box
  return { x: box.x, y: box.y, w: box.w + PLACEMENT_SAFETY_PAD.w, h: box.h + PLACEMENT_SAFETY_PAD.h }
}
function safePlacementBounds(nodes) {
  if (!nodes.length) return null
  const boxes = nodes.map(safePlacementBox)
  const minX = Math.min(...boxes.map((b) => b.x))
  const minY = Math.min(...boxes.map((b) => b.y))
  const maxX = Math.max(...boxes.map((b) => b.x + b.w))
  const maxY = Math.max(...boxes.map((b) => b.y + b.h))
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY }
}

// Given a desired origin (a drop point, or a computed candidate), slide the
// template DOWN until its box clears every existing node. Downward keeps the
// x the user chose — so a drag still lands in the column they aimed at, just
// below whatever is already there — and each step jumps past the lowest
// blocker rather than creeping, so this settles in a couple of passes even on
// a crowded canvas. The iteration cap is a guard, not the usual path.
// Single-node version of resolvePlacement below: drop DOWN past whatever is
// already in this column until the box is clear. Same rules (same gap, same
// jump-past-the-lowest-blocker step, same iteration guard) so a click-added
// block and a dropped template settle the same way.
//
// FQ-B — `boxFn` defaults to plain `nodeBox` (byte-identical behavior for
// every pre-existing caller: palette add, wire-add, mint-output, click-add).
// spawnOrReplaceGrid passes `safePlacementBox` instead (below) — the exact
// hardening resolvePlacement already applies for template drops ("the
// collision machinery already exists for templates" per PLAN.md's own FQ-B
// note) — so a not-yet-measured neighbor (a Compare/Output that hasn't had
// its first React Flow measurement pass yet) can't fool the grid into
// sliding to a spot that only LOOKS clear against an underestimated resting
// height.
function slideClear(nodes, desired, w, h, boxFn = nodeBox) {
  if (!nodes.length) return desired
  const boxes = nodes.map(boxFn)
  let origin = { ...desired }
  for (let pass = 0; pass < 24; pass += 1) {
    const box = { x: origin.x, y: origin.y, w, h }
    const hits = boxes.filter((b) => boxesOverlap(box, b, PLACEMENT_GAP))
    if (!hits.length) return origin
    origin = { x: origin.x, y: Math.max(...hits.map((b) => b.y + b.h)) + PLACEMENT_GAP }
  }
  return origin
}

function resolvePlacement(nodes, graph, desired) {
  const tpl = safePlacementBounds(graph.nodes)
  if (!tpl || !nodes.length) return desired
  const existingBoxes = nodes.map(safePlacementBox)
  let origin = { ...desired }

  for (let pass = 0; pass < 24; pass += 1) {
    const box = { x: origin.x, y: origin.y, w: tpl.w, h: tpl.h }
    const hits = existingBoxes.filter((b) => boxesOverlap(box, b, PLACEMENT_GAP))
    if (!hits.length) return origin
    const lowest = Math.max(...hits.map((b) => b.y + b.h))
    origin = { x: origin.x, y: lowest + PLACEMENT_GAP }
  }
  return origin
}

export function useFlowState() {
  const ctx = useContext(FlowStateContext)
  if (!ctx) throw new Error('useFlowState must be used within a FlowStateProvider')
  return ctx
}
