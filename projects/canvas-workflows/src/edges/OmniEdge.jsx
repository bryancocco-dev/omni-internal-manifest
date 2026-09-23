// Seam D — Edges/layout/flow-theme
//
// The one custom edge type used everywhere (`defaultEdgeOptions={{ type: 'omni' }}`
// in B's FlowCanvas). Renders a smoothstep path with a solid arrowhead, and —
// on hover or selection — two small round buttons at the path midpoint:
// "+" opens a block picker to insert between source and target, "x" cuts the
// connection. Both just fire window CustomEvents; B's state.jsx owns the
// actual graph mutation (per the cross-seam contract, D never imports from B).
//
// COMFY ROUND (CP0 — "EDGE + OPENS THE PICKER", PLAN.md "## COMFY ROUND" ->
// "### CP0"). Bryan: "the plus button always seems to introduce a new task or
// action, what happened to me being able to choose from the list" — the "+"
// below used to dispatch `cw:edge-insert` directly (always a hardcoded Task).
// It now hands its own screen rect to FlowCanvas.jsx via the SAME
// `cw:add-picker` contract the node-side ghost + already uses (see
// src/nodes/shared.jsx's dispatchAddPicker / BlockPicker.jsx's own header
// comment for the GHOST + PICKER precedent this mirrors) — just with an
// `edgeId` in the detail instead of `nodeId`/`side`; FlowCanvas.jsx tells the
// two variants apart. Picking a row is what finally dispatches
// `cw:edge-insert`, now carrying an `itemId` (state.jsx's onEdgeInsert
// resolves it via paletteItemById, the exact pattern onAddFrom already uses).
// The splice logic itself (edgeA/edgeB, the new node landing at the
// midpoint) is UNTOUCHED — only what TYPE of node gets minted changed.
//
// MOTION PHASE (M1 — "Edges alive", src/edges/** only; see PLAN.md
// "## MOTION PHASE" -> "### M1"). What's new here, item by item:
//   1. an ambient "current" pulse dash loops source->target under the main
//      path, quickening/brightening on hover or selection;
//   2. a `cw:surge` window-event match plays a one-shot brighter traversal;
//   3. the main path draws itself in on mount (fresh each overlay open);
//   4. the "x" button delays its `cw:edge-cut` dispatch one short beat so
//      the edge can visibly retract first;
//   5. the +/x controls arrive with a spring scale and press-feedback;
//   6. the pulse layer (1+2) is gated by a perf guard, see PULSE_MAX_EDGES.
// All new rules live in ./edges-motion.css (flow.css stays frozen). Easing
// comes from M3's motion.css `--cw-e-*` tokens via var() — with literal
// fallbacks matching PLAN.md, since seams build concurrently.
//
// RUN PHASE (R4 — "RF functionality pack + run controls", src/edges/**
// only; see PLAN.md "## RUN PHASE" -> "### R4"). What's new here:
//   - a `cw:run-edge` window-event match ({ source, target, sourceHandle },
//     same shape as `cw:surge`) plays a one-shot surge brighter (.95) and
//     faster (360ms) than the connect-time surge — fired by the run engine
//     (R1's state.jsx) as control actually traverses this edge live.
//
// RUN SHOW PHASE — HALF A only (src/edges/**, FlowCanvas.jsx, motion.css;
// see PLAN.md "## RUN SHOW ..." -> "### HALF A"). Bryan: push the "press
// Run" moment further. A1 lives entirely here:
//   - on the SAME `cw:run-edge` match that plays the brighter/faster dash
//     surge above, also mount a short-lived comet — small circles riding
//     the edge's own path via `offset-path`/`offset-distance` (0% -> 100%,
//     420ms `--cw-e-out`), the trailing two dimmer and slightly delayed so
//     they read as a fading tail, not three separate dots. The dash surge
//     above is untouched; the comet rides ON TOP of it.
//   - capped at COMET_MAX_CONCURRENT in flight across the WHOLE graph (a
//     module-level counter, not per-edge — the verify table's 40-node run
//     can surge many edges close together, and PLAN.md calls for a silent
//     cap past 8 rather than degrading every comet's legibility) and OFF
//     entirely under prefers-reduced-motion, where the existing
//     `is-run-surging` pulse-layer opacity blink (edges-motion.css) already
//     reads as "a simple opacity blink on the edge" (PLAN.md A4) — nothing
//     extra needs to render there.
//   - deliberately NOT gated by PULSE_MAX_EDGES below: that guard exists
//     because the AMBIENT pulse is a standing infinite loop (cost scales
//     with edge COUNT); a comet is a rare one-shot bounded by CONCURRENCY —
//     a different cost shape entirely. See the 40-node verify row, which
//     expects comets to keep appearing past that count, just capped.
//
// WIRE GEOMETRY (PLAN.md "## WIRE GEOMETRY — choosing our wires'
// skeleton"). Bryan: "is there any reason the lines have to look and move
// the way they do?" — replaced getSmoothStepPath's RF-default routing
// (which used to run BETWEEN the two 10px escapes above) with this file's
// own distance-adaptive cubic bezier (forward) / rounded-orthogonal
// detour (backward) skeleton, behind a hidden ?wire=taut|current|soft
// personality param. See the geometry functions' own comments below
// (buildWirePath and everything it calls) for the how/why.
//
// WIRE FEEL (PLAN.md "## WIRE FEEL — extends WIRE GEOMETRY"). Bryan wants
// "the absolute best smoothest version... thinner... gorgeous and feel
// smooth... i want it to feel fun." Three things landed HERE (the rest —
// the living spring-lag drag line, magnetic ease, the wire-that-waits, and
// port-grab — live in the new sibling ./ConnectionLine.jsx, which imports
// several of this file's geometry primitives, now exported, to stay on
// the SAME curve family as the real thing rather than inventing a second
// one the eye would catch as "different material" mid-gesture):
//   1. thinner core ink (coreWidth below, item 1);
//   2. `cubicWirePath` split out of buildForwardPath as an EXPLICIT-offset
//      primitive (item 4's "control-point interpolation") so ConnectionLine
//      can drive the identical curve builder with a velocity-tuned offset
//      instead of the distance-tuned one buildForwardPath itself uses;
//   3. the connect-settle morph + landing wobble (item 4) and the
//      cw:wire-connected match that triggers them, right after the
//      existing cw:surge listener below (same one-shot-state shape).
//
// QA FIX-WAVE (F15, PLAN.md "## QA FINDINGS LEDGER" — J5's DESIGN AUDIT:
// "Wire ink at 25% zoom fails in LIGHT theme (sub-physical-pixel vs dot
// grid)"). coreWidth below is one literal user-space number regardless of
// zoom, so the viewport's own scale(zoom) transform shrinks it right along
// with everything else on the canvas — correct "shrink-together instrument
// language" (DESIGN BAR) at rest, but at 25% zoom 1.25 user-space units
// paints under a physical screen pixel, antialiased down to nothing against
// the dot grid. Fix is a FLOOR in SCREEN space (effectiveCoreWidth below),
// not `vector-effect="non-scaling-stroke"` — that would freeze the wire's
// screen width forever, including back up at 150-200% where it's supposed
// to keep thickening with everything else; this floor only ever engages
// below the zoom where the proportional width would already have dropped
// under it, and is a no-op (returns coreWidth exactly) above that point.
// The moat (item 3 below) reads the SAME effective value + 2 — still always
// 2px wider than the ink, same "widen in lockstep" contract WIRE FEEL item
// 1 established. Comet dots, the signal/pulse layers, and the identity
// gradient are untouched — none of them go sub-pixel the way a single hairline
// stroke does, and PLAN.md never flagged them.

import { useCallback, useEffect, useLayoutEffect, useId, useMemo, useRef, useState } from 'react'
import { BaseEdge, EdgeLabelRenderer, Position, useStore } from '@xyflow/react'

// THEMES PHASE: no JS hex constants — both states resolve through the
// builder's own --cw-* roster (src/styles/cw-tokens.css) so the edge
// follows the shell theme with zero JS state.
const COLOR_IDLE = 'var(--cw-edge)'
const COLOR_ACTIVE = 'var(--cw-edge-active)'

// PREMIUM WIRE PASS item 1 — identity gradient ink (PLAN.md "the connections
// get the instrument treatment"). Bryan: "make the lines... look cooler/more
// premium." Every node TYPE already carries a fixed identity color
// throughout nodes.css — the card-head tick / hover glow all key off
// styles/cw-tokens.css's --cw-kind-trigger/-human/-logic/-wait/-stop, with
// task + output riding the workspace --cw-accent instead (nodes.css's own
// comment: "FIXED --cw-kind-* tokens... only the primary/accent color
// (task, output) does [change with the brand]"). That existing 6-value
// roster (5 fixed + 1 accent, task/output sharing it) is what "source
// node's kind color" can only mean for an EDGE, since an edge connects NODE
// to NODE and every node has a `type` — NOT the other export also named
// KIND_COLORS in nodes/shared.jsx (agent/knowledge/skill/tool/file), which
// keys the TASK card's attachment CHIPS, an unrelated axis no node.type
// ever matches; wiring an edge's ends to THAT map would silently miss on
// every edge and flatten every wire to idle gray. Values duplicated here
// (not imported — src/nodes/** is another executor's seam right now, and
// per PLAN.md D never imports a component from C even at rest) as literal
// var()-with-hex-fallback, matching this file's own COLOR_IDLE/COLOR_ACTIVE
// convention above.
//
// COMFY ROUND (CP1 — "TYPED COLOR PORTS", PLAN.md "## COMFY ROUND" ->
// "### CP1"). Exported so this stays the ONE roster if a future JS
// consumer ever needs it (flow.css's port-ring colors are the first,
// but CSS can't `import` — that file duplicates these same 7 values as
// literal var()-with-fallback tokens, pointer-commented back to here;
// keep both lists in sync by hand if a kind is ever added/renamed).
export const EDGE_KIND_COLORS = {
  trigger: 'var(--cw-kind-trigger, #10B981)',
  task: 'var(--cw-accent, #1858EE)',
  human: 'var(--cw-kind-human, #F59E0B)',
  output: 'var(--cw-accent, #1858EE)',
  logic: 'var(--cw-kind-logic, #8B5CF6)',
  wait: 'var(--cw-kind-wait, #64748B)',
  stop: 'var(--cw-kind-stop, #DC2626)',
  // WAVE 2 — THE VERB EXPANSION. One entry covers all three SignalNode.jsx
  // kinds (source/audience/measure) — this roster keys off node TYPE, same
  // "for free" note as flow.css's own mirrored line. Style Reference (Wave
  // 3) joins this SAME 'signal' type, so it needs no line of its own either.
  signal: 'var(--cw-kind-signal, #0EA5E9)',
  // WAVE 3 — THE VERB EXPANSION. Remix is a NEW node type (not a kind on an
  // existing one — RemixNode.jsx's own header comment) — "accent" per the
  // master's color discipline, same family as task/output/generate above.
  remix: 'var(--cw-accent, #1858EE)',
  // WAVE 4 — THE VERB EXPANSION. Handoff/Localize/Optimize/Run workflow are
  // each their own new node type (see each file's own header comment) —
  // Handoff joins the human-amber family (reuses HumanNode's pause
  // machinery); the other three join the accent family, same footing as
  // task/output/generate/remix above. Guardrail joins 'logic' (a new `kind`,
  // same as Gather/Split/Compare) and needs no entry of its own.
  handoff: 'var(--cw-kind-human, #F59E0B)',
  localize: 'var(--cw-accent, #1858EE)',
  optimize: 'var(--cw-accent, #1858EE)',
  runworkflow: 'var(--cw-accent, #1858EE)',
}

// Tint hexes duplicated from cw-tokens.css's --cw-tint-* roster (edges/
// can't import from nodes/ or styles/ at runtime for SVG stop colors —
// same pointer-comment convention as EDGE_KIND_COLORS' own values). A
// node's data.tint names one of these; when present it IS the node's
// identity color for wire purposes (Bryan: gradients "should match the
// color of the chip at the top... also when the user switches color").
export const TINT_HEX = {
  slate: '#0EA5E9',
  wine: '#E11D48',
  rust: '#F97316',
  forest: '#16A34A',
  indigo: '#4F46E5',
  teal: '#0D9488',
  plum: '#9333EA',
  olive: '#D97706',
}

const GRADIENT_MIX_IDLE = 35 // PLAN.md item 1 — "~35% into var(--cw-edge)"
const GRADIENT_MIX_ACTIVE = 70 // PLAN.md item 1 — "richens to ~70% kind color"

// LIVE LEANING (PLAN.md "## LIVE LEANING — the agent reads the branches,
// the wires follow the talk") — "the leaned edge takes the accent-emphasis
// treatment... the others drop to a quiet dimmed weight." The leaned half
// of that is deliberately NOT a new constant — it reuses `active`'s own
// existing hover/selected treatment wholesale (gradient richens, coreWidth
// steps to 1.75, the signal comet quickens) exactly per PLAN.md's "the
// existing directional-flow motion vocabulary from the premium wire pass."
// These two constants are only the SIBLING side: a further width step-down
// and an opacity dip, applied to a paused choice gate's non-leaned option
// edges. Numbers tuned by eye (PLAN.md item 5, "the gate") against the
// verify screenshots — quiet enough to read as "not this one" next to the
// bright leaned wire without going invisible against the dot grid.
const LEANING_DIM_WIDTH = 0.8 // coreWidth multiplier — quieter than idle's plain 1.25
const LEANING_DIM_OPACITY = 0.4 // whole-wire (moat + ink + signal/comet) opacity

// MOTION PHASE — perf guard (item 6). The ambient/surge pulse is a second
// animated <path> per edge — cheap alone, but N infinite SVG dash loops add
// up on a very large graph. Past this count every edge bails to a plain
// static path (no pulse layer at all) rather than degrade quality; draw-on
// and the edge controls stay on regardless since those are one-shot /
// interaction-driven, not standing loops.
const PULSE_MAX_EDGES = 40

// SIGNAL COMET PASS item 1 — the comet's 4 layers, back-to-front (array
// order = paint order in the .map() below, so `tail-3` sits under `head`).
// Falloff opacities "~0.9 / 0.45 / 0.18" and the head's "~10px, stroke
// width 3... 0.95 opacity" are PLAN.md's own numbers; the width taper
// across the 3 tail layers is this file's own read of "exponential tail"
// extended past opacity alone (not separately spec'd), confirmed by eye in
// the verify screenshots. `lagMs` is consumed where these render, further
// down — see that comment for why a small positive delay, not a
// dashoffset shift, is what staggers the tail behind the head.
const SIGNAL_LAYERS = [
  { mod: 'tail-3', peakOpacity: 0.18, width: 1.4, lagMs: 84 },
  { mod: 'tail-2', peakOpacity: 0.45, width: 1.9, lagMs: 56 },
  { mod: 'tail-1', peakOpacity: 0.9, width: 2.4, lagMs: 28 },
  { mod: 'head', peakOpacity: 0.95, width: 3, lagMs: 0 },
]

// SIGNAL COMET PASS item 4 — "travel quickens (~1.0s)... the existing
// duration-only-change trick so the animation never phase-jumps." That
// trick (a plain CSS class swapping `animation-duration`) turns out NOT to
// deliver on "never phase-jumps" for this keyframe — verified empirically
// while building this: a running CSS animation's `currentTime` (elapsed
// ms) survives a duration change untouched, but PROGRESS = currentTime /
// duration does not, so the comet visibly teleported tens of px on the
// very frame `.is-active` landed (confirmed by dense frame-sampling: a
// clean ~30-unit dashoffset snap in a single ~16ms tick, exactly aligned
// with the class change). The actual fix lives in the `useLayoutEffect`
// below, using these two durations — CSS keeps `omni-edge-signal-travel`
// at a flat 4.4s (edges-motion.css); JS is what re-times it live. Kept as
// named constants (not re-derived from edges-motion.css, which JS has no
// access to) so the ~36.36% travel fraction math in that file's own
// comment and this one stay obviously in sync if either changes.
const SIGNAL_PERIOD_MS = 4400
const SIGNAL_ACTIVE_MS = 2750 // travel * (4400/2750) ~= 1.0s at the SAME 36.36% fraction

// MOTION PHASE — cheap, deterministic per-edge "randomness" so the ambient
// shimmer (item 1) and the draw-on stagger (item 3) don't beat in sync
// across the graph. Edges have no `data.seq` to key off (unlike nodes, see
// the cross-seam contract) so a hash of the stable edge id stands in.
function hashId(id) {
  let h = 0
  for (let i = 0; i < id.length; i += 1) h = (h * 31 + id.charCodeAt(i)) | 0
  return Math.abs(h)
}

// PREMIUM WIRE PASS item 2 — circuit escapes. Bryan: "make the lines...
// look cooler/more premium" -> a wire should leave its pin dead straight for
// a short, FIXED run before it's allowed to bend — the PCB-trace "escape"
// that reads as engineered, not doodled — rather than trust the incidental
// lead-in `getSmoothStepPath`'s own internal `offset` (20px, baked into its
// own corner-rounding math, not guaranteed straight in every source/target
// geometry) happens to produce today.
export const WIRE_STUB = 10

// Every handle in this app's schema is Left (target `in`) or Right (source
// `out`/branch — see PLAN.md "Graph schema": human choice opt-*, logic
// true/false/case-*, try/catch are all right-side sources same as plain
// `out`) — a stub only ever makes sense escaping straight out from the node
// in the direction the handle already faces. Top/Bottom get none rather
// than escaping sideways into a corner nothing here was designed for
// (PLAN.md item 2: "skip stubs for non-horizontal handles").
export function wireStubDx(position) {
  if (position === Position.Right) return WIRE_STUB
  if (position === Position.Left) return -WIRE_STUB
  return 0
}

// WIRE GEOMETRY — choosing our wires' skeleton (PLAN.md "## WIRE
// GEOMETRY"). Bryan: "is there any reason the lines have to look and move
// the way they do?" — until now the curve BETWEEN the two 10px escapes
// above was whatever getSmoothStepPath produced (RF default skeleton, our
// paint on top of it). This block is the replacement skeleton: a
// distance-adaptive cubic bezier when the target is ahead of the source
// (taut up close, relaxed at range — never RF's fixed curvature), and a
// deliberate rounded-orthogonal detour — NOT RF's own wide S-loop — when
// the target sits behind the source. `getSmoothStepPath` is gone from
// this file entirely; every path (main, moat, signal layers, hit target,
// comet offset-path) still reads the single `edgePath` string these
// functions build, so nothing downstream needed to change.
//
// Personality (?wire=taut|current|soft, default 'current') — hidden,
// read once at module load exactly like state.jsx's `?flow=` FLOW_PARAMS
// boot-time read (see state.jsx's getInitialFlow), but living HERE:
// state.jsx is outside this seam (PLAN.md's own seam line for this spec),
// and the personality only ever feeds this module's own path math, so a
// local read avoids threading a prop/context through files neither seam
// otherwise touches. No live re-read on URL change — same "boot decides,
// reload to change it" contract ?flow= already established.
const WIRE_PARAM_VALUES = ['taut', 'current', 'soft']

function resolveWirePersonality() {
  if (typeof window === 'undefined' || typeof window.location === 'undefined') return 'current'
  const raw = new URLSearchParams(window.location.search).get('wire')
  return raw && WIRE_PARAM_VALUES.includes(raw) ? raw : 'current'
}

const WIRE_PERSONALITY = resolveWirePersonality()

// Forward-path tangent tuning per personality — PLAN.md's own starting
// numbers, then tuned by eye against this build's own screenshots (per
// the dispatch: "tune constants by eye... not just the spec's starting
// numbers"). k scales the control-point offset by the escapes' own
// horizontal span; min/max clamp it so close pairs stay taut (no floppy
// sag) and far pairs stay relaxed (no piano-wire straightness).
//   taut    — cabling under tension, Comfy-adjacent: short leash even at range.
//   current — today's ribbon feel, just with the adaptive clamp fixing
//             the close-range sag the old fixed-curvature default had.
//   soft    — long lazy drape, Weave-adjacent: bows generously at range.
const WIRE_TUNING = {
  taut: { k: 0.3, min: 22, max: 118 },
  current: { k: 0.52, min: 42, max: 248 },
  soft: { k: 0.66, min: 60, max: 328 },
}[WIRE_PERSONALITY]

// Backward-detour geometry — PLAN.md's own numbers, held FIXED across all
// three personalities (the spec varies only the forward tangent feel; the
// escape-and-go-around mechanics read as one consistent "how this app
// draws a backward wire" idiom regardless of which forward personality is
// active). DETOUR_HEIGHT_FALLBACK is this file's own addition: a node's
// `measured` height can be briefly unset on first paint (before the
// ResizeObserver/heal pass reports in) — a mid-range guess keeps the
// clearance math sane for that one frame instead of collapsing toward 0.
export const DETOUR_RADIUS = 16
export const DETOUR_CLEARANCE = 24
export const DETOUR_HEIGHT_FALLBACK = 96

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

// QA FIX-WAVE F15 — the zoom-aware minimum's floor, in actual SCREEN
// pixels (not user-space/graph units, which is what coreWidth itself is
// specified in). ~0.9px per J5's own recommendation: enough to stay a
// crisp, clearly-intentional hairline against the dot grid at any zoom
// without reading as a fattened/blurred line once it's holding the floor
// (verify note: 25% zoom is the known failure case, both themes; 60% is
// the existing WIRE FEEL item 1 checkpoint and lands right around where
// idle vs. active cross from floored back to proportional, worth eyeballing
// too).
const WIRE_MIN_SCREEN_PX = 0.9

// Screen-space floor, expressed back in the user-space units SVG stroke
// attributes actually take: below the crossover zoom (where
// baseWidth * zoom would already clear WIRE_MIN_SCREEN_PX on its own) this
// returns baseWidth completely unchanged — Math.max is a no-op there, so
// 100% zoom (and everything above it) renders byte-identical to before
// this fix. `zoom || 1` guards the one frame zoom can be transiently 0/
// undefined before the store's first measurement, same idiom this app's
// own getZoom() || 1 callers already use (state.jsx, Filmstrip.jsx) —
// ZOOM_MIN is 0.25 in normal operation (FlowCanvas.jsx), never actually 0.
function zoomFloorStrokeWidth(baseWidth, zoom) {
  return Math.max(baseWidth, WIRE_MIN_SCREEN_PX / (zoom || 1))
}

// Unit vector a handle's wire travels along leaving/entering the node,
// keyed off the SAME `Position` enum wireStubDx already switches on. Only
// Left/Right are ever real in this app's schema (see wireStubDx's own
// comment) — Top/Bottom resolve to a sane default rather than {0,0} so a
// future non-horizontal handle degrades to "acts like Right" instead of a
// zero-length, direction-less tangent.
export function positionUnit(position) {
  if (position === Position.Left) return { x: -1, y: 0 }
  if (position === Position.Top) return { x: 0, y: -1 }
  if (position === Position.Bottom) return { x: 0, y: 1 }
  return { x: 1, y: 0 }
}

function dist(a, b) {
  return Math.hypot(b.x - a.x, b.y - a.y)
}

// Point `amount` units from `corner` toward `neighbor`, clamped so it
// never overshoots past `neighbor` itself (a short adjacent segment just
// yields a smaller step, same graceful-degradation idea getSmoothStepPath
// itself uses for its own corner rounding).
function pullback(corner, neighbor, amount) {
  const d = dist(corner, neighbor)
  if (d <= 0.0001) return { x: corner.x, y: corner.y }
  const t = Math.min(amount, d) / d
  return { x: corner.x + (neighbor.x - corner.x) * t, y: corner.y + (neighbor.y - corner.y) * t }
}

// De Casteljau point at parameter `t` on the cubic p0-c1-c2-p3 — used only
// to place the edge-controls label at the curve's own visual middle
// (t=0.5), not the straight chord's midpoint, since a relaxed/soft
// personality's control offset can bow the curve well off that chord at
// range.
function cubicPointAt(p0, c1, c2, p3, t) {
  const u = 1 - t
  const x = u * u * u * p0.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * p3.x
  const y = u * u * u * p0.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * p3.y
  return { x, y }
}

// Straight segments through `points`, with a rounded corner (quadratic
// bezier, control = the corner vertex itself) at every INTERIOR point.
// Corner "size" clamps to half of whichever adjacent segment is shorter —
// the same degradation getSmoothStepPath's own internal corner-rounding
// uses — so a short segment (e.g. this app's 10px escape stubs, when they
// land as interior points of a backward detour) shrinks its effective
// radius instead of overshooting past its neighbor. Returns ONE path
// string including the leading `M` for points[0] — draw-on/comet/hit-path
// all need a single continuous subpath, never a second `M`.
function roundedPolylinePath(points, radius) {
  let d = `M${points[0].x} ${points[0].y}`
  for (let i = 1; i < points.length - 1; i += 1) {
    const prev = points[i - 1]
    const corner = points[i]
    const next = points[i + 1]
    const size = Math.min(radius, dist(prev, corner) / 2, dist(corner, next) / 2)
    if (size <= 0.5) {
      d += `L${corner.x} ${corner.y}`
      continue
    }
    const a = pullback(corner, prev, size)
    const b = pullback(corner, next, size)
    d += `L${a.x} ${a.y}Q${corner.x} ${corner.y} ${b.x} ${b.y}`
  }
  const last = points[points.length - 1]
  d += `L${last.x} ${last.y}`
  return d
}

// Forward case (target ahead of source): distance-adaptive cubic bezier
// between the two escape points. control-point offset = clamp(dx * k,
// min, max) — dx is the escapes' own horizontal span, so a close pair
// (small dx) clamps to `min` (taut, no floppy sag right at the pins) and
// a far pair clamps to `max` (relaxed, no piano-wire straightness). c1/c2
// sit along each end's own outward handle direction (positionUnit) —
// same tangent-continuity idiom RF's own getBezierPath uses, which is why
// this reads as a natural continuation of the straight escape stub rather
// than a kink at p0/p3.
// WIRE FEEL (PLAN.md "## WIRE FEEL" item 4 — "control-point interpolation")
// pulled the actual C-command builder out to its own EXPLICIT-offset
// primitive, exported, so edges/ConnectionLine.jsx's live drag (velocity-
// tuned offset, not distance-tuned) and the settle-morph it plays into a
// freshly-connected OmniEdge can build the IDENTICAL curve family the real
// personality tuning below uses — one geometry, two different offset
// SOURCES, never two competing curve shapes for the user to notice as
// "different materials" mid-gesture.
// `perpOffset` (WIRE FEEL item 4 — landing wobble) nudges BOTH control
// points sideways, perpendicular to the p0->p3 span, by the same signed
// amount — the whole curve's belly shifts as one piece rather than
// twisting, which is what reads as a physical wire settling rather than a
// glitch. Optional/defaulted so every existing forward-path call site
// (the plain distance-tuned case, ConnectionLine.jsx's velocity-tuned
// drag) is unaffected — only the connect-settle wobble below passes it.
export function cubicWirePath(source, target, p0, p3, sourcePosition, targetPosition, sourceStubDx, targetStubDx, offset, perpOffset = 0) {
  const sDir = positionUnit(sourcePosition)
  const tDir = positionUnit(targetPosition)
  let c1 = { x: p0.x + sDir.x * offset, y: p0.y + sDir.y * offset }
  let c2 = { x: p3.x + tDir.x * offset, y: p3.y + tDir.y * offset }
  if (perpOffset) {
    const dx = p3.x - p0.x
    const dy = p3.y - p0.y
    const len = Math.hypot(dx, dy) || 1
    const px = -dy / len
    const py = dx / len
    c1 = { x: c1.x + px * perpOffset, y: c1.y + py * perpOffset }
    c2 = { x: c2.x + px * perpOffset, y: c2.y + py * perpOffset }
  }
  const path =
    `M${source.x} ${source.y}` +
    (sourceStubDx ? `L${p0.x} ${p0.y}` : '') +
    `C${c1.x} ${c1.y} ${c2.x} ${c2.y} ${p3.x} ${p3.y}` +
    (targetStubDx ? `L${target.x} ${target.y}` : '')
  const mid = cubicPointAt(p0, c1, c2, p3, 0.5)
  return { path, labelX: mid.x, labelY: mid.y, c1, c2 }
}

// WIRE FEEL item 4 — connect-settle tuning. Named per "## WIRE FEEL" item
// 7's own instruction ("name the final constants") — these ARE that name.
const CONNECT_MORPH_MS = 180 // "180ms, --cw-e-out, control-point interpolation"
const CONNECT_MORPH_START_FRACTION = 0.52 // drag-shape approximation — starts noticeably tighter than the routed offset, tuned by eye
const CONNECT_WOBBLE_MS = 240 // "2 oscillations, 240ms"
const CONNECT_WOBBLE_AMP = 1.5 // "midpoint +/-1.5px perpendicular"
const CONNECT_WOBBLE_CYCLES = 2
const CONNECT_WOBBLE_DECAY_TAU = 68 // exp decay time-constant — ~0.03 of the original amplitude left by 240ms
const CONNECT_CROSSFADE_MS = 120 // backward route — "120ms crossfade instead"

// Cheap ease-out-cubic stand-in for --cw-e-out (cubic-bezier(.22,1,.36,1)):
// close enough by eye for a 180ms morph that a full bezier solve isn't
// worth doing per-frame here (unlike edges-motion.css's own CSS
// transitions, which get the real curve for free from the browser).
function easeOutCubic(t) {
  const u = 1 - t
  return 1 - u * u * u
}

function buildForwardPath(source, target, p0, p3, sourcePosition, targetPosition, sourceStubDx, targetStubDx) {
  const dx = Math.abs(p3.x - p0.x)
  const offset = clamp(dx * WIRE_TUNING.k, WIRE_TUNING.min, WIRE_TUNING.max)
  return { ...cubicWirePath(source, target, p0, p3, sourcePosition, targetPosition, sourceStubDx, targetStubDx, offset), kind: 'forward', offset }
}

// Backward case (target behind source): RF's default here is a wide
// S-loop (getSmoothStepPath doubling back on itself) — this instead
// composes escape -> tight radius toward whichever side needs the
// shorter hop ("the nearer card edge") -> horizontal run clearing both
// nodes' own measured boxes by DETOUR_CLEARANCE -> radius -> escape, one
// continuous rounded-orthogonal path (radius 16) via roundedPolylinePath
// above. sourceBox/targetBox are `{top, height}` in ABSOLUTE canvas
// coordinates (see the component's own useStore reads — nodeLookup's
// internals.positionAbsolute, not the plain possibly-parent-relative
// `.position`, so a card nested under a VARIANT STUDIO frame still clears
// correctly) or null before a node's first measure, in which case a
// fixed-height guess keeps the math sane for that one frame.
export function buildBackwardPath(source, target, p0, p3, sourceStubDx, targetStubDx, sourceBox, targetBox) {
  const sBox = sourceBox ?? { top: source.y - DETOUR_HEIGHT_FALLBACK / 2, height: DETOUR_HEIGHT_FALLBACK }
  const tBox = targetBox ?? { top: target.y - DETOUR_HEIGHT_FALLBACK / 2, height: DETOUR_HEIGHT_FALLBACK }
  const belowY = Math.max(sBox.top + sBox.height, tBox.top + tBox.height) + DETOUR_CLEARANCE
  const aboveY = Math.min(sBox.top, tBox.top) - DETOUR_CLEARANCE
  const midY = (p0.y + p3.y) / 2
  const useBelow = belowY - midY <= midY - aboveY
  const clearY = useBelow ? belowY : aboveY

  const p1 = { x: p0.x, y: clearY }
  const p2 = { x: p3.x, y: clearY }
  const path = roundedPolylinePath([source, p0, p1, p2, p3, target], DETOUR_RADIUS)
  return { path, labelX: (p1.x + p2.x) / 2, labelY: clearY, kind: 'backward' }
}

// Entry point — replaces the old getSmoothStepPath call + manual M-strip
// splice wholesale. p0/p3 are the same stub-shifted escape points the old
// code computed (WIRE_STUB/wireStubDx above, UNCHANGED); only what
// connects them is new. Guards a degenerate zero-length span (PLAN.md
// verify: "self-loops / same-node in-out... must not NaN") with a small
// fixed loop instead of feeding a zero span into a tangent/clamp calc
// that has no direction to resolve.
export function buildWirePath({ source, target, sourcePosition, targetPosition, sourceStubDx, targetStubDx, sourceBox, targetBox }) {
  const p0 = { x: source.x + sourceStubDx, y: source.y }
  const p3 = { x: target.x + targetStubDx, y: target.y }

  if (![p0.x, p0.y, p3.x, p3.y].every(Number.isFinite)) {
    const path = `M${source.x} ${source.y}L${target.x} ${target.y}`
    return { path, labelX: (source.x + target.x) / 2, labelY: (source.y + target.y) / 2, kind: 'degenerate' }
  }

  if (Math.abs(p3.x - p0.x) < 0.01 && Math.abs(p3.y - p0.y) < 0.01) {
    const loopR = 26
    const path =
      `M${source.x} ${source.y}` +
      (sourceStubDx ? `L${p0.x} ${p0.y}` : '') +
      `C${p0.x + loopR} ${p0.y - loopR} ${p0.x + loopR} ${p0.y + loopR} ${p0.x} ${p0.y + 0.02}` +
      (targetStubDx ? `L${target.x} ${target.y}` : '')
    return { path, labelX: p0.x + loopR, labelY: p0.y, kind: 'loop' }
  }

  if (target.x < source.x) {
    return buildBackwardPath(source, target, p0, p3, sourceStubDx, targetStubDx, sourceBox, targetBox)
  }
  return buildForwardPath(source, target, p0, p3, sourcePosition, targetPosition, sourceStubDx, targetStubDx)
}

// RUN SHOW A1 — traversal comet. A plain local re-implementation of the
// same matchMedia check FlowCanvas.jsx defines for A2/A4 (that file's
// `prefersReducedMotion`) — this component has no import path to it (D
// never imports from B, same cross-seam rule the file header states for
// window events already) and the check is five lines, not worth inventing
// a shared module neither seam's file grant covers.
export function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

// Verify-table cap ("if >8 concurrent, skip the extra comets — silent cap,
// log in code comment" — this is that comment): every edge is its own
// OmniEdge instance, so the only way to know "how many comets are in
// flight across the WHOLE graph right now" is a counter OUTSIDE any one
// instance. Module-level, not React state/context — comets are a rare,
// short-lived (<=490ms) visual with no other seam reading the count, so a
// plain mutable int (same pattern as FlowCanvas.jsx's `rippleSeq`) is
// simpler than threading a shared value through a seam boundary neither
// side needs otherwise. Each spawn increments exactly once and every exit
// path (animationend, the fallback timer, and unmount) releases exactly
// once — see `cometCountedRef` below.
const COMET_MAX_CONCURRENT = 8
let activeCometCount = 0

// Comet ids only need to be unique within one mounted edge instance (React
// `key`, to force a fresh animation on retraversal) — a module counter is
// cheaper than Date.now()/Math.random for a discrete, non-loop event,
// mirroring FlowCanvas.jsx's nextRippleId/nextBoomId.
let cometSeq = 0
function nextCometId() {
  cometSeq += 1
  return cometSeq
}

// A1: "a 6px accent dot with a short fading tail". Three circles share one
// `offset-distance: 0%->100%` keyframe (edges-motion.css) along the SAME
// `offset-path` as the edge itself; the two trailing ones start a beat
// LATER (positive animation-delay, not negative) so at any wall-clock
// moment they've covered less of the path than the head — a real spatial
// lag that stays correct around a smoothstep path's right-angle corners,
// not a rotation/blur trick. Bryan's own note on the ambient pulse layer
// below ("glow layer retired — the wide soft stroke read as a smear, not a
// particle") is why this stays small dots at fixed opacities instead of a
// blurred trail.
const COMET_TRAVEL_MS = 420 // PLAN.md A1 — "420ms ease-out"
const COMET_DOTS = [
  { r: 3, opacity: 1, delay: 0 },
  { r: 2.1, opacity: 0.5, delay: 34 },
  { r: 1.3, opacity: 0.22, delay: 68 },
]
const COMET_LAST_DELAY = COMET_DOTS[COMET_DOTS.length - 1].delay
// Fallback-timer ceiling: the longest-delayed dot's own full journey, plus
// a buffer — unlike the plain settle timers below, animationend is the
// PRIMARY cleanup path here, so this is only a safety net for browsers/
// tabs where that event doesn't fire.
const COMET_FALLBACK_MS = COMET_TRAVEL_MS + COMET_LAST_DELAY + 80

const edgeCountSelector = (s) => s.edges.length

export default function OmniEdge({
  id,
  source,
  target,
  sourceHandleId,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  selected,
}) {
  const [hovered, setHovered] = useState(false)
  const [surging, setSurging] = useState(false)
  const [runSurging, setRunSurging] = useState(false)
  const [cutting, setCutting] = useState(false)
  const [cometKey, setCometKey] = useState(null) // A1 — null = no comet in flight on this edge
  // WIRE FEEL item 4 — connect-settle. `settling` toggles the rAF loop on;
  // `settleElapsedRef` is what that loop advances every frame (a ref, not
  // state, since 60 `setState` calls/sec would be wasteful — only the
  // dummy `settleTick` counter below needs to actually trigger a
  // re-render, the elapsed value itself is read straight off the ref at
  // render time).
  const [settling, setSettling] = useState(false)
  const settleElapsedRef = useRef(0)
  const [, bumpSettleTick] = useState(0)
  const rid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const markerId = `omni-arrow-${rid}`
  // PREMIUM WIRE PASS item 1 — this edge's own <linearGradient> id (see
  // <defs> below). Sharing `rid` with the arrowhead marker keeps both ids
  // stable across the edge's whole lifetime and unique per instance, same
  // reasoning as markerId above.
  const gradientId = `omni-edge-grad-${rid}`
  const cutTimeoutRef = useRef(null)
  const cometTimeoutRef = useRef(null)
  // Whether THIS instance currently holds one of the COMET_MAX_CONCURRENT
  // slots — not derived from `cometKey` state, because the unmount cleanup
  // effect below closes over refs fresh but state from its OWN render (a
  // `[]`-deps cleanup reading `cometKey` directly would see the value from
  // the FIRST render, not the latest — a classic stale-closure trap). Refs
  // sidestep that: `.current` is always read fresh at cleanup time.
  const cometCountedRef = useRef(false)
  // SIGNAL COMET PASS item 4 — one DOM node per rendered signal layer (the
  // 4 dash paths + the bloom circle), keyed by `mod` so re-registering on
  // every render (a fresh ref-callback closure each time, same pattern
  // React itself uses internally) just overwrites the same Map entries
  // rather than growing it. Fed to the retiming effect below; empty
  // whenever `pulseEnabled` is false (nothing ever registers), which that
  // effect's plain `for...of` handles for free — no separate guard needed.
  const signalElsRef = useRef(new Map())

  // item 1 (cont'd) — this edge's SOURCE node's TYPE, looked up reactively
  // (not a one-time getNode() snapshot) so a node that hasn't registered
  // into the store yet at first paint — e.g. the instant after
  // cw:edge-insert mints both a node and this edge together — still
  // resolves correctly on the very next store update instead of latching
  // the fallback gray forever. Moved up from its old spot just below the
  // gradient block (targetKind + the tint reads stayed there — see that
  // comment) because LIVE LEANING's `active` extension, right below, now
  // needs it before `active` itself is computed.
  const sourceKind = useStore((s) => s.nodeLookup.get(source)?.type)
  // LIVE LEANING (PLAN.md "## LIVE LEANING") — the SAME source-node store
  // read shape as sourceKind above, extended to the three fields a paused
  // choice GATE's negotiation needs: whether it's paused right now,
  // whether it's in choice mode at all, and which option (if any) the chat
  // has leaned toward. Narrow selectors, same discipline as sourceKind —
  // each only re-renders this edge when THAT value itself changes.
  const sourceRunState = useStore(
    (s) => s.nodeLookup.get(source)?.internals?.userNode?.data?.runState ?? s.nodeLookup.get(source)?.data?.runState,
  )
  const sourceResponseType = useStore(
    (s) =>
      s.nodeLookup.get(source)?.internals?.userNode?.data?.responseType ?? s.nodeLookup.get(source)?.data?.responseType,
  )
  const sourceChatLeaning = useStore(
    (s) => s.nodeLookup.get(source)?.internals?.userNode?.data?.chatLeaning ?? s.nodeLookup.get(source)?.data?.chatLeaning,
  )
  // This edge is one of a paused choice gate's OPTION handles only when its
  // own sourceHandleId carries HumanNode.jsx's `opt-${option.id}` shape
  // (that file's own HandleLabelRows call — the only place in the app that
  // ever mints an `opt-` handle, confirmed by grep) — a plain `out`/branch
  // handle on any other node type never matches this prefix, so it's
  // excluded for free. PAUSED-ONLY per the contract: the instant the gate
  // resolves, `sourceRunState` reads back to something other than
  // 'paused' and every leaning computation below collapses to false —
  // normal taken/dead-edge presentation (flow.css) takes back over with
  // zero residue, no separate "clear the lean" step needed anywhere.
  const isLeaningGate =
    sourceKind === 'human' &&
    sourceResponseType === 'choice' &&
    sourceRunState === 'paused' &&
    typeof sourceHandleId === 'string' &&
    sourceHandleId.startsWith('opt-')
  const leaningOptionId = isLeaningGate ? sourceHandleId.slice(4) : null
  const hasLeaning = isLeaningGate && sourceChatLeaning != null && sourceChatLeaning !== ''
  const isLeaned = hasLeaning && String(sourceChatLeaning) === String(leaningOptionId)
  const isLeaningDimmed = hasLeaning && !isLeaned

  // PREMIUM WIRE PASS item 1 — LIVE LEANING extends `active` (already the
  // hover/selected accent-emphasis trigger every treatment below reads —
  // gradient richness, stroke width, the signal comet's quickened travel
  // via the useLayoutEffect further down) with a THIRD trigger: a paused
  // choice gate's leaned option edge. This IS the entire implementation of
  // "the leaned edge takes the accent-emphasis treatment + the existing
  // directional-flow motion vocabulary from the premium wire pass" (PLAN.md)
  // — no new color/motion logic invented, the leaned edge simply reads as
  // "hovered" for every treatment that already keys off `active`.
  const active = hovered || Boolean(selected) || isLeaned
  const color = active ? COLOR_ACTIVE : COLOR_IDLE
  // PREMIUM WIRE PASS item 1 — core ink width, ORIGINALLY "1.5 -> 2" on
  // hover/select. WIRE FEEL item 1 (PLAN.md "## WIRE FEEL": "Thinner. Idle
  // stroke 1.5->1.25, attention 2->1.75; moat stays +2") thins both a
  // notch further — the moat below (item 3) still always rides 2px wider
  // than whatever this is, so the channel and the ink widen in lockstep
  // regardless of which two numbers this line holds. Legibility at this
  // thinner weight is carried by the moat (verified at 60% zoom,
  // light+dark, per that item's own verify note), not by the ink alone.
  // LIVE LEANING — a dimmed sibling option edge (hasLeaning true, this one
  // NOT the lean) drops a further notch below the idle width — its own
  // "quiet dimmed weight" half of the contract (the leaned edge's "stronger
  // stroke" half is already covered by `active` above; a no-op ×1 in every
  // other case).
  const coreWidth = (active ? 1.75 : 1.25) * (isLeaningDimmed ? LEANING_DIM_WIDTH : 1)

  // QA FIX-WAVE F15 — narrow scalar selector, same discipline as
  // sourceKind/targetKind/edgeCount below: only re-renders this edge when
  // the ZOOM number itself changes, not on every store tick (e.g. a plain
  // pan, which updates transform[0]/[1] but not [2]). Matches the existing
  // `s.transform[2]` idiom already used elsewhere for this exact value
  // (FlowCanvas.jsx's ZoomReadout, SubgraphStage.jsx).
  const zoom = useStore((s) => s.transform[2])
  // Effective ink width for THIS render — see zoomFloorStrokeWidth's own
  // comment above. Identical to coreWidth at 100% and above; only departs
  // from it once zoom has dropped low enough that the plain proportional
  // result would already be sub-pixel.
  const effectiveCoreWidth = zoomFloorStrokeWidth(coreWidth, zoom)

  // LIVE LEANING — the dimmed sibling's OTHER half: plain opacity, applied
  // below to the moat + main ink + signal/comet layers alike so the whole
  // wire (channel, ink, and its idle comet together) reads uniformly
  // quieter, not just thinner. 1 (no-op) whenever there's no leaning at
  // all, on the leaned edge itself, or on any plain non-gate edge —
  // `isLeaningDimmed` is false in all three of those cases. The transition
  // (DESIGN BAR item 4 — "state changes animate the delta") is the SAME
  // --cw-d-2/--cw-e-out roster the rest of this file's own inline
  // transitions already lean on (see the moat's own cutting fade below).
  const edgeOpacity = isLeaningDimmed ? LEANING_DIM_OPACITY : 1
  const edgeOpacityTransition = 'opacity var(--cw-d-2, 220ms) var(--cw-e-out, cubic-bezier(.22, 1, .36, 1))'

  // item 1 (cont'd) — this edge's TARGET node's TYPE (source's own read
  // moved up above, next to the leaning computations that need it before
  // `active`), looked up reactively (not a one-time getNode() snapshot) so
  // a node that hasn't registered into the store yet at first paint — e.g.
  // the instant after cw:edge-insert mints both a node and this edge
  // together — still resolves correctly on the very next store update
  // instead of latching the fallback gray forever. Same reasoning as the
  // `edgeCount` guard below: a plain scalar selector only ever triggers a
  // re-render when the resolved value itself actually changes, not on
  // every unrelated store update (e.g. a pan/zoom).
  const targetKind = useStore((s) => s.nodeLookup.get(target)?.type)
  // Selector returns the raw tint id string, so a re-tint re-renders this
  // edge and nothing else does.
  const sourceTint = useStore((s) => s.nodeLookup.get(source)?.internals?.userNode?.data?.tint ?? s.nodeLookup.get(source)?.data?.tint)
  const targetTint = useStore((s) => s.nodeLookup.get(target)?.internals?.userNode?.data?.tint ?? s.nodeLookup.get(target)?.data?.tint)
  const gradientMixPct = active ? GRADIENT_MIX_ACTIVE : GRADIENT_MIX_IDLE
  // Fallback (PLAN.md item 1): an end whose kind color is unavailable (type
  // not in the map, or the node hasn't registered yet) reads as plain
  // var(--cw-edge) at that stop instead of color-mixing `undefined`.
  const gradientStop = (kind) => {
    const kindColor = kind && EDGE_KIND_COLORS[kind]
    return kindColor ? `color-mix(in srgb, ${kindColor} ${gradientMixPct}%, var(--cw-edge))` : 'var(--cw-edge)'
  }
  // Tint outranks kind for the wire's identity (the head chip is the truth).
  const effectiveStop = (kind, tint) => {
    const tintHex = tint && TINT_HEX[tint]
    if (tintHex) return `color-mix(in srgb, ${tintHex} ${gradientMixPct}%, var(--cw-edge))`
    return gradientStop(kind)
  }
  const sourceStopColor = effectiveStop(sourceKind, sourceTint)
  const targetStopColor = effectiveStop(targetKind, targetTint)

  // WIRE GEOMETRY — node boxes for the backward detour's vertical
  // clearance (buildBackwardPath above). ABSOLUTE canvas coordinates via
  // internals.positionAbsolute, not the plain `.position` (verified
  // against the installed @xyflow/system types) — a card nested under a
  // VARIANT STUDIO frame has a `.position` relative to that frame, not
  // the canvas (see FlowCanvas.jsx's spawnBoom / resolveNodeBox, which
  // hits this exact same trap). Narrow scalar selectors, same discipline
  // as sourceKind/targetKind above: each only re-renders this edge when
  // THAT particular number actually changes, not on every store tick.
  const sourceBoxTop = useStore((s) => s.nodeLookup.get(source)?.internals?.positionAbsolute?.y)
  const sourceBoxHeight = useStore((s) => s.nodeLookup.get(source)?.measured?.height)
  const targetBoxTop = useStore((s) => s.nodeLookup.get(target)?.internals?.positionAbsolute?.y)
  const targetBoxHeight = useStore((s) => s.nodeLookup.get(target)?.measured?.height)
  const sourceBox = sourceBoxTop == null ? null : { top: sourceBoxTop, height: sourceBoxHeight ?? DETOUR_HEIGHT_FALLBACK }
  const targetBox = targetBoxTop == null ? null : { top: targetBoxTop, height: targetBoxHeight ?? DETOUR_HEIGHT_FALLBACK }

  // item 2 — circuit escapes, UNCHANGED (WIRE_STUB/wireStubDx above). WIRE
  // GEOMETRY replaces what used to connect the two escape points
  // (getSmoothStepPath) with buildWirePath's own distance-adaptive bezier
  // / rounded-orthogonal-detour skeleton — see that function's own header
  // comment. Every other consumer below (moat, main path, signal layers,
  // hit target, comet offset-path, edge-controls midpoint) still just
  // reads `edgePath`/`labelX`/`labelY`, so nothing downstream changed.
  const sourceStubDx = wireStubDx(sourcePosition)
  const targetStubDx = wireStubDx(targetPosition)
  const sourcePt = { x: sourceX, y: sourceY }
  const targetPt = { x: targetX, y: targetY }
  const wireResult = buildWirePath({
    source: sourcePt,
    target: targetPt,
    sourcePosition,
    targetPosition,
    sourceStubDx,
    targetStubDx,
    sourceBox,
    targetBox,
  })
  let { path: edgePath, labelX, labelY } = wireResult

  // WIRE FEEL item 4 — apply the connect-settle morph/wobble ON TOP of the
  // plain routed result above, only while `settling` is true and only for
  // the `forward` kind: cubicWirePath's control points are what both the
  // offset-interpolation morph and the perpendicular wobble need to nudge,
  // and only the forward path is built from a single cubic (the backward
  // detour is a multi-corner polyline with no equivalent single "control
  // point pair" to interpolate — PLAN.md's own item 4 calls that case out
  // for a plain 120ms crossfade instead, via the is-connect-crossfade
  // class below, no path recompute needed for it).
  if (settling && wireResult.kind === 'forward') {
    const t = settleElapsedRef.current
    const morphT = easeOutCubic(clamp(t / CONNECT_MORPH_MS, 0, 1))
    const startOffset = wireResult.offset * CONNECT_MORPH_START_FRACTION
    const blendedOffset = startOffset + (wireResult.offset - startOffset) * morphT
    const wobble =
      t < CONNECT_WOBBLE_MS
        ? CONNECT_WOBBLE_AMP *
          Math.exp(-t / CONNECT_WOBBLE_DECAY_TAU) *
          Math.sin((2 * Math.PI * CONNECT_WOBBLE_CYCLES * t) / CONNECT_WOBBLE_MS)
        : 0
    const p0 = { x: sourcePt.x + sourceStubDx, y: sourcePt.y }
    const p3 = { x: targetPt.x + targetStubDx, y: targetPt.y }
    const morphed = cubicWirePath(
      sourcePt,
      targetPt,
      p0,
      p3,
      sourcePosition,
      targetPosition,
      sourceStubDx,
      targetStubDx,
      blendedOffset,
      wobble,
    )
    edgePath = morphed.path
    labelX = morphed.labelX
    labelY = morphed.labelY
  }
  const connectCrossfading = settling && wireResult.kind === 'backward'

  // Perf guard (item 6) — see PULSE_MAX_EDGES above. `useStore` with a
  // length-only selector re-renders this edge when the edge COUNT changes,
  // not on every unrelated edge update (position, selection, ...).
  const edgeCount = useStore(edgeCountSelector)
  const pulseEnabled = edgeCount <= PULSE_MAX_EDGES

  // Ambient loop: a NEGATIVE delay so every edge is already mid-cycle at
  // mount (no synchronized start, no edges frozen waiting their turn).
  // Draw-on: a small POSITIVE delay (<=200ms per PLAN.md item 3) since it's
  // a one-shot entrance, not a loop — it needs an actual wait, not a phase
  // shift.
  const { ambientDelayMs, drawDelay } = useMemo(() => {
    const h = hashId(id)
    return {
      // SIGNAL COMET PASS — quantized to 8 phase-beats of the NEW 4.4s
      // signal period (550 = 4400/8 exactly; was 562 for the old 4.5s
      // pulse) — same "keep the existing... phase offsets" trick PLAN.md
      // asks for, recomputed for the new period so a busy canvas still
      // twinkles asynchronously instead of marching. Kept as a plain
      // number, not a pre-formatted "Nms" string like drawDelay below,
      // because each of the 4 signal layers adds its own small positive
      // lag on top of this before formatting (see SIGNAL_LAYERS' lagMs).
      ambientDelayMs: -((h % 8) * 550),
      drawDelay: `${h % 200}ms`,
    }
  }, [id])

  // SIGNAL COMET PASS item 4 — the actual "quickens, never phase-jumps"
  // mechanism (see SIGNAL_ACTIVE_MS's own comment above for why a plain
  // CSS class swap doesn't deliver that on its own). `useLayoutEffect`,
  // not `useEffect`: it must run — and finish correcting the timing —
  // BEFORE the browser paints the frame where `active` changed, or the
  // user would see one genuinely-jumped frame before the snap-back.
  //
  // Both directions (entering AND leaving hover/selection) run the SAME
  // correction: read this instant's progress under whatever duration is
  // CURRENTLY in effect (via the Web Animations API, not the CSS cascade
  // — nothing here ever reads/writes the `animation-duration` CSS
  // property), solve for the delay that reproduces that exact progress
  // under the NEW duration, and set both together in one `updateTiming`
  // call so no intermediate (wrong) frame is ever computed at all.
  useLayoutEffect(() => {
    const newDuration = active ? SIGNAL_ACTIVE_MS : SIGNAL_PERIOD_MS
    for (const el of signalElsRef.current.values()) {
      // Match by animation-name, not just "the first animation": a
      // surge/run-surge in flight on this same element is its own
      // deliberate one-shot restart (MOTION PHASE M1's distinct-name
      // trick) with no continuity promise to keep — leave it alone. The
      // next active-state flip after the surge ends re-times the
      // now-reverted ambient/bloom animation correctly; a hover that
      // starts and ends entirely within one brief surge is the only
      // (accepted) gap this leaves.
      const anim = el
        .getAnimations()
        .find((a) => a.animationName === 'omni-edge-signal-travel' || a.animationName === 'omni-edge-signal-bloom')
      if (!anim || !anim.effect) continue
      const progress = anim.effect.getComputedTiming().progress ?? 0
      const currentTime = anim.currentTime ?? 0
      // Solve (currentTime - delay) / newDuration === progress for delay.
      const newDelay = currentTime - progress * newDuration
      anim.effect.updateTiming({ duration: newDuration, delay: newDelay })
    }
  }, [active])

  const onEnter = useCallback(() => setHovered(true), [])
  const onLeave = useCallback(() => setHovered(false), [])

  // Surge on connect (item 2) — cross-seam contract: M3's state.jsx fires
  // `cw:surge` (`{ detail: { source, target, sourceHandle } }`) after
  // onConnect / cw:add-from / cw:edge-insert mint a new edge. Every
  // OmniEdge instance listens and only the one matching its own
  // (source, target, sourceHandle) plays the one-shot.
  useEffect(() => {
    const handle = sourceHandleId ?? 'out'
    const onSurge = (event) => {
      const detail = event.detail || {}
      const detailHandle = detail.sourceHandle ?? 'out'
      if (detail.source === source && detail.target === target && detailHandle === handle) {
        setSurging(true)
      }
    }
    window.addEventListener('cw:surge', onSurge)
    return () => window.removeEventListener('cw:surge', onSurge)
  }, [source, target, sourceHandleId])

  // Settle back into the ambient loop once the surge has had its ~480ms
  // moment. A plain timer (not `animationend`) so this resolves cleanly
  // even under prefers-reduced-motion, where the surge keyframe never
  // actually plays.
  useEffect(() => {
    if (!surging) return undefined
    const t = setTimeout(() => setSurging(false), 480)
    return () => clearTimeout(t)
  }, [surging])

  // WIRE FEEL item 4 — connect-settle. `cw:wire-connected` is a NEW event
  // (this phase), NOT a duplicate of `cw:surge` above — that one already
  // fires for a live onConnect too (per its own comment: "after onConnect
  // / cw:add-from / cw:edge-insert"), so the signal-pulse traversal this
  // edge just inherited for free needs no new wiring. This event exists
  // purely to drive the MAIN PATH's own shape settle (morph/wobble below),
  // which cw:surge's matching has nothing to do with. Dispatched from
  // FlowCanvas.jsx's onConnectEnd (an AUTHORIZED additive line there, per
  // PLAN.md "## WIRE FEEL"'s own FlowCanvas-coordination note) — same
  // (source, target, sourceHandle) match shape as cw:surge, so only the
  // one OmniEdge instance that just came into being reacts.
  useEffect(() => {
    const handle = sourceHandleId ?? 'out'
    const onWireConnected = (event) => {
      const detail = event.detail || {}
      const detailHandle = detail.sourceHandle ?? 'out'
      if (detail.source !== source || detail.target !== target || detailHandle !== handle) return
      if (prefersReducedMotion()) return // no morph/wobble — draw-on's own reduced-motion fade already covers the mount
      settleElapsedRef.current = 0
      setSettling(true)
    }
    window.addEventListener('cw:wire-connected', onWireConnected)
    return () => window.removeEventListener('cw:wire-connected', onWireConnected)
  }, [source, target, sourceHandleId])

  // The rAF loop itself — starts/stops on `settling` flipping, never on
  // every frame (a `bumpSettleTick` re-render mid-loop must NOT re-trigger
  // this effect, or it would cancel+reschedule its own rAF every frame and
  // never advance cleanly). Self-terminates by flipping `settling` back to
  // false once CONNECT_WOBBLE_MS has elapsed — the longer of the two
  // connect-settle windows (morph finishes inside it).
  useEffect(() => {
    if (!settling) return undefined
    let raf
    let last = performance.now()
    const tick = (now) => {
      const dt = now - last
      last = now
      settleElapsedRef.current += dt
      if (settleElapsedRef.current >= CONNECT_WOBBLE_MS) {
        setSettling(false)
        return
      }
      bumpSettleTick((n) => n + 1)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [settling])

  // RUN SHOW A1 — traversal comet helpers. `releaseCometSlot` is the ONLY
  // place that ever decrements `activeCometCount`; every exit path below
  // (animationend, the fallback timer, and the unmount effect) calls this
  // rather than touching the module counter directly, so one increment
  // always pairs with exactly one decrement no matter which path gets
  // there first.
  const releaseCometSlot = useCallback(() => {
    if (cometCountedRef.current) {
      cometCountedRef.current = false
      activeCometCount = Math.max(0, activeCometCount - 1)
    }
  }, [])

  const onCometEnd = useCallback(() => {
    if (cometTimeoutRef.current) {
      clearTimeout(cometTimeoutRef.current)
      cometTimeoutRef.current = null
    }
    releaseCometSlot()
    setCometKey(null)
  }, [releaseCometSlot])

  const spawnComet = useCallback(() => {
    // A4 — reduced motion: no traveling dot at all. The existing
    // `is-run-surging` pulse-layer reduced-motion rule (edges-motion.css)
    // already fades the wire to a brighter opacity once on this SAME
    // event — that IS "a simple opacity blink on the edge" PLAN.md asks
    // for, so there's nothing left for this function to do.
    if (prefersReducedMotion()) return
    // Re-triggering on an edge that's already mid-comet (a fast Stop-then-
    // Run) reuses its existing slot instead of counting twice — only a
    // FRESH slot checks the cap.
    if (!cometCountedRef.current) {
      if (activeCometCount >= COMET_MAX_CONCURRENT) return // silent cap (PLAN.md verify)
      activeCometCount += 1
      cometCountedRef.current = true
    }
    const key = nextCometId()
    setCometKey(key)
    if (cometTimeoutRef.current) clearTimeout(cometTimeoutRef.current)
    cometTimeoutRef.current = setTimeout(() => {
      cometTimeoutRef.current = null
      releaseCometSlot()
      setCometKey((cur) => (cur === key ? null : cur))
    }, COMET_FALLBACK_MS)
  }, [releaseCometSlot])

  // RUN PHASE (R4 item 5) — cw:run-edge. Same shape/match as cw:surge above
  // ({ source, target, sourceHandle }), fired by the run engine (R1's
  // state.jsx) as control actually traverses this edge during a live run.
  // Kept as its own state + class (`is-run-surging`, edges-motion.css)
  // rather than reusing `surging` so a run traversal reads distinctly
  // brighter/faster than an ordinary new-connection surge — see PLAN.md
  // "RUN PHASE" -> "R4". RUN SHOW A1 adds spawnComet() on the SAME match —
  // the dash surge above is untouched, the comet rides on top of it.
  useEffect(() => {
    const handle = sourceHandleId ?? 'out'
    const onRunEdge = (event) => {
      const detail = event.detail || {}
      const detailHandle = detail.sourceHandle ?? 'out'
      if (detail.source === source && detail.target === target && detailHandle === handle) {
        setRunSurging(true)
        spawnComet()
      }
    }
    window.addEventListener('cw:run-edge', onRunEdge)
    return () => window.removeEventListener('cw:run-edge', onRunEdge)
  }, [source, target, sourceHandleId, spawnComet])

  useEffect(() => {
    if (!runSurging) return undefined
    const t = setTimeout(() => setRunSurging(false), 360)
    return () => clearTimeout(t)
  }, [runSurging])

  // A1 unmount cleanup — mirrors the cutTimeoutRef effect below, plus
  // releasing this instance's concurrency slot (if any) so closing the
  // overlay mid-comet can never permanently leak COMET_MAX_CONCURRENT down
  // across the module's lifetime (this module persists across overlay
  // open/close — only a full page reload resets it).
  useEffect(
    () => () => {
      if (cometTimeoutRef.current) clearTimeout(cometTimeoutRef.current)
      releaseCometSlot()
    },
    [releaseCometSlot],
  )

  useEffect(
    () => () => {
      if (cutTimeoutRef.current) clearTimeout(cutTimeoutRef.current)
    },
    [],
  )

  const openInsertPicker = useCallback(
    (event) => {
      event.stopPropagation()
      window.dispatchEvent(
        new CustomEvent('cw:add-picker', { detail: { edgeId: id, rect: event.currentTarget.getBoundingClientRect() } }),
      )
    },
    [id],
  )

  // Cut dissolve (item 4) — the retract animation (`is-cutting`, in
  // edges-motion.css) plays first, THEN the event that actually removes
  // the edge from graph state fires, so it's never yanked out mid-frame.
  // Contract (`cw:edge-cut` / `{ detail: { edgeId } }`) is unchanged, only
  // delayed by the animation beat.
  //
  // CONTEXT & CLIPBOARD (PLAN.md item 4, "Right-click menus" -> "on an
  // EDGE") — split out of the button's onClick so the NEW edge context menu
  // (FlowCanvas.jsx, opened at the cursor rather than this component's own
  // hover-only +/x pair) can trigger the identical dissolve-then-remove
  // beat via `performCut` below, instead of a second, cruder "just remove
  // it" path that would skip the retract animation this button already
  // gets — "seamless means... exits for every unmount" (DESIGN BAR item 4)
  // applies just as much to a menu-triggered cut as a hover-button one.
  const performCut = useCallback(() => {
    if (cutting) return
    setCutting(true)
    cutTimeoutRef.current = setTimeout(() => {
      window.dispatchEvent(new CustomEvent('cw:edge-cut', { detail: { edgeId: id } }))
    }, 70)
  }, [id, cutting])

  const cutEdge = useCallback(
    (event) => {
      event.stopPropagation()
      performCut()
    },
    [performCut],
  )

  // `cw:edge-cut-request` — the context menu's own contract (`{ detail:
  // { edgeId } }`), matched by id like `cw:run-edge` above matches by
  // source/target/handle. A plain `cw:edge-cut` dispatch from outside would
  // skip this component's own retract animation entirely (it only plays
  // from INSIDE performCut, above); routing the menu through a request
  // event instead means only the one OmniEdge instance that actually owns
  // this id ever reacts, and it reacts through the exact same animated path
  // the hover button uses.
  useEffect(() => {
    const onCutRequest = (event) => {
      if (event.detail?.edgeId === id) performCut()
    }
    window.addEventListener('cw:edge-cut-request', onCutRequest)
    return () => window.removeEventListener('cw:edge-cut-request', onCutRequest)
  }, [id, performCut])

  // LIVE LEANING — `active` now ALSO fires from `isLeaned` (above), which is
  // deliberate for the color/width/motion treatment (the whole point of
  // reusing it) but wrong for the hover-only +/x edge controls: a leaning
  // wire isn't being hovered or selected, and floating an insert/cut pair
  // over it while the user is mid-negotiation would read as an accidental
  // interaction affordance, not a status signal. `showControls` stays keyed
  // to the genuine interaction pair only.
  const showControls = (hovered || Boolean(selected)) && !cutting

  return (
    <>
      {/* Self-contained arrowhead — colored per-instance so it tracks the
          same hover/selected state as the path, without needing edge.markerEnd
          data (the graph schema doesn't carry one). */}
      <defs>
        {/* Slim open chevron (Bryan: "smaller and more premium") — stroked,
            not a filled wedge; userSpaceOnUse keeps it zoom-stable. */}
        <marker
          id={markerId}
          markerWidth="8"
          markerHeight="8"
          viewBox="0 0 8 8"
          refX="6.4"
          refY="4"
          markerUnits="userSpaceOnUse"
          orient="auto-start-reverse"
        >
          <path
            d="M1.8,1.2 L6.2,4 L1.8,6.8"
            style={{ fill: 'none', stroke: color, strokeWidth: 1.3, strokeLinecap: 'round', strokeLinejoin: 'round' }}
          />
        </marker>

        {/* PREMIUM WIRE PASS item 1 — identity gradient ink. userSpaceOnUse
            + the edge's own TRUE source/target points (not the stub-shifted
            ones item 2 routes through) means this re-anchors to the real
            connection points on every render — dragging a node just tracks,
            no extra bookkeeping, since sourceX/Y and targetX/Y are already
            props this component re-renders with. Not applied to the
            arrowhead marker above: a userSpaceOnUse gradient sized for the
            whole edge would resolve inside the marker's own tiny local
            viewBox instead, reading as a flat sliver rather than a
            gradient — the marker keeps the plain flat `color` it already
            had. */}
        <linearGradient id={gradientId} gradientUnits="userSpaceOnUse" x1={sourceX} y1={sourceY} x2={targetX} y2={targetY}>
          <stop offset="0" stopColor={sourceStopColor} />
          <stop offset="1" stopColor={targetStopColor} />
        </linearGradient>
      </defs>

      {/* PREMIUM WIRE PASS item 3 — etched depth ("moat"). Same path, ONE
          under-stroke, painted BEFORE (=beneath) the ink below so the wire
          visually cuts a channel through the dot grid instead of fighting
          it — --cw-surface is the same paper the node cards themselves sit
          on, so a wire reads as embossed INTO the canvas the way a card
          sits ON it. 100% opaque, core+2 wide, no blur — NOT the retired
          glow (see the pulse layer's own "read as a smear" comment below).
          Fades on the same 70ms beat as the ink's own cut-retract so
          nothing lingers after it. QA FIX-WAVE F15 — core+2 off
          effectiveCoreWidth now, not the raw coreWidth, so the channel
          keeps riding exactly 2px wider than the ink at every zoom,
          floored together instead of drifting apart at low zoom. LIVE
          LEANING — `edgeOpacity` dips this to LEANING_DIM_OPACITY on a
          paused choice gate's non-leaned sibling option edges, cutting
          still wins outright (0 either way). */}
      <path
        d={edgePath}
        fill="none"
        stroke="var(--cw-surface)"
        strokeWidth={effectiveCoreWidth + 2}
        style={{
          pointerEvents: 'none',
          opacity: cutting ? 0 : edgeOpacity,
          transition: cutting ? 'opacity 70ms var(--cw-e-out, cubic-bezier(.22, 1, .36, 1))' : edgeOpacityTransition,
        }}
      />

      {/* Item 3 — draw-on: `pathLength=100` turns the whole path into one
          100-unit dash so `edges-motion.css` can animate it in via
          stroke-dashoffset. Item 4 — cut dissolve: `is-cutting` retraces
          the same trick in reverse before the edge actually leaves graph
          state. PREMIUM WIRE PASS item 1 — stroke is now this edge's own
          gradient (<defs> above) instead of a flat color; strokeWidth steps
          per `coreWidth` (WIRE FEEL item 1 thinned this to 1.25/1.75),
          shared with the moat above so both widen in lockstep. QA FIX-WAVE
          F15 — that width is effectiveCoreWidth now (coreWidth run through
          the zoom floor above): unchanged at 100%+ zoom, held at a legible
          screen-space minimum below the crossover instead of thinning into
          a sub-pixel hairline. WIRE FEEL item 4 — `is-connect-crossfade`
          plays the backward route's 120ms settle fade ON TOP of the SAME
          draw-on reveal (harmless overlap, see this file's own
          connectCrossfading comment above for why backward skips the
          morph/wobble treatment). */}
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={`url(#${markerId})`}
        interactionWidth={20}
        pathLength={100}
        className={`omni-edge-main-path${cutting ? ' is-cutting' : ''}${connectCrossfading ? ' is-connect-crossfade' : ''}`}
        style={{
          ...style,
          stroke: `url(#${gradientId})`,
          strokeWidth: effectiveCoreWidth,
          animationDelay: drawDelay,
          // LIVE LEANING — same edgeOpacity/transition the moat above uses;
          // is-cutting/is-connect-crossfade's own CSS animations (edges-
          // motion.css) win the cascade over this inline value whenever
          // either is active, so there's no conflict to guard against here.
          opacity: edgeOpacity,
          transition: edgeOpacityTransition,
        }}
      />

      {/* MOTION PHASE M1's ambient pulse -> SIGNAL COMET PASS (PLAN.md
          "## SIGNAL COMET PASS — the idle wire animation, elevated").
          Bryan: "make the animations running along the lines cooler...
          push what we can do here — it needs to look great, understated
          but noticeable." CD direction (Fable): the old `.omni-edge-pulse`
          pair (renamed `.omni-edge-signal` below — see edges-motion.css
          for the full why) read as a conveyor belt: constant speed,
          constant interval, a dash ALWAYS somewhere on the path. This is a
          comet instead — it launches, travels an eased ~1.6s, arrives,
          and the wire rests bare for the remaining ~2.8s of a 4.4s period.
          Still gated by the SAME PULSE_MAX_EDGES guard above (item 6) — a
          standing per-edge loop is the same cost shape the guard was
          already sized for, whether it draws one dash or four. */}
      {pulseEnabled
        ? (() => {
            const dashStateClasses = [
              active ? 'is-active' : '',
              surging ? 'is-surging' : '',
              runSurging ? 'is-run-surging' : '',
              cutting ? 'is-cutting' : '',
            ]
              .filter(Boolean)
              .join(' ')
            // The arrival bloom (below) only ever needs is-active (to stay
            // duration-synced with a quickened comet) and is-cutting (to
            // vanish with the rest of the edge) — never is-surging/
            // is-run-surging. A surge is a brief accelerated LAUNCH;
            // PLAN.md only asks the STANDING loop's own arrival to bloom,
            // so this deliberately stays on its own untouched cycle rather
            // than growing a second, unspec'd one-shot-bloom path.
            const bloomStateClasses = [active ? 'is-active' : '', cutting ? 'is-cutting' : '']
              .filter(Boolean)
              .join(' ')

            return (
              <>
                {SIGNAL_LAYERS.map((layer) => (
                  <path
                    key={layer.mod}
                    ref={(el) => {
                      if (el) signalElsRef.current.set(layer.mod, el)
                      else signalElsRef.current.delete(layer.mod)
                    }}
                    d={edgePath}
                    pathLength={100}
                    fill="none"
                    className={`omni-edge-signal omni-edge-signal--${layer.mod}${dashStateClasses ? ' ' + dashStateClasses : ''}`}
                    style={{
                      // Every layer travels the IDENTICAL source->target
                      // dashoffset span (edges-motion.css) on the SAME
                      // shared keyframes/duration — "sharing ONE animation
                      // timeline" per PLAN.md. The trailing read comes from
                      // this small POSITIVE per-layer delay stacked on this
                      // edge's own ambientDelayMs — same trick RUN SHOW
                      // A1's COMET_DOTS below already uses for ITS trailing
                      // dots (positive delay is a real spatial lag, not a
                      // jump — same reasoning as that block's own comment).
                      // A per-layer dashoffset SHIFT (this file's old,
                      // retired centered-bloom pulse used exactly that) was
                      // tried here first and rejected: dash+gap sum to
                      // exactly 100 (pathLength), so a shifted layer's own
                      // endpoints land it in the SAME split-boundary trap
                      // edges-motion.css's own comment works through in
                      // detail for the base 0/-97.4 span — a second, layer-
                      // specific offset would hit that trap at a DIFFERENT
                      // point per layer instead of avoiding it. A time lag
                      // never touches the offset value at all, so it can't
                      // wrap regardless.
                      animationDelay: `${ambientDelayMs + layer.lagMs}ms`,
                      // PREMIUM WIRE PASS item 4 extended to the whole
                      // comet, not just the head (that item predates this
                      // pass, back when the tail was invisible/retired and
                      // had nothing to tint) — every layer sits within a
                      // few path-units of the others at any instant, so all
                      // 4 sample nearly the same point on the gradient; the
                      // visible differentiation between them is opacity and
                      // width, not color.
                      stroke: `url(#${gradientId})`,
                      strokeWidth: layer.width,
                      // LIVE LEANING — the sibling dimmed edges' idle comet
                      // rides quieter too (same LEANING_DIM_OPACITY factor
                      // the wire's own opacity uses, reused rather than a
                      // second constant), so the whole wire — channel, ink,
                      // AND its traveling comet — reads as one consistently
                      // "quiet" object, not a dim wire with a full-brightness
                      // signal still racing across it.
                      '--sig-peak-o': layer.peakOpacity * (isLeaningDimmed ? LEANING_DIM_OPACITY : 1),
                    }}
                  />
                ))}

                {/* Item 3 — arrival bloom. A circle parked at the edge's
                    TRUE target point (not the stub-shifted splice point —
                    item 2's stub only reroutes the DRAWN path, the real
                    handle position is still targetX/Y) that flares once a
                    period, timed to the head's own arrival: the same
                    36.36% mark the travel keyframe arrives at
                    (edges-motion.css). Carries the SAME `omni-edge-signal`
                    base class as the dash layers above purely so it's a
                    member of the SAME retiming loop (the useLayoutEffect
                    above, keyed on `signalElsRef`) — that's what keeps it
                    duration-synced under hover/selection, not CSS; see
                    that effect's own comment for why a plain CSS class
                    can't do this safely. */}
                <circle
                  ref={(el) => {
                    if (el) signalElsRef.current.set('bloom', el)
                    else signalElsRef.current.delete('bloom')
                  }}
                  cx={targetX}
                  cy={targetY}
                  className={`omni-edge-signal omni-edge-signal-bloom${bloomStateClasses ? ' ' + bloomStateClasses : ''}`}
                  style={{ animationDelay: `${ambientDelayMs}ms`, fill: targetStopColor }}
                />
              </>
            )
          })()
        : null}

      {/* RUN SHOW A1 — traversal comet. Independent of `pulseEnabled` above
          (that guard exists for the AMBIENT loop's standing per-edge cost;
          a comet is a rare one-shot instead — its own module-level
          concurrency cap and the reduced-motion bail inside spawnComet are
          what keep THIS cheap). Not the same thing as the "comet current"
          nickname in the pulse layer's own comment above, which names the
          ambient dash — this is the literal moving dot PLAN.md's A1 asks
          for, riding on top of it. */}
      {cometKey != null
        ? COMET_DOTS.map((dot, i) => (
            <circle
              key={`${cometKey}-${i}`}
              className="omni-edge-comet-dot"
              r={dot.r}
              style={{
                offsetPath: `path("${edgePath}")`,
                animationDelay: `${dot.delay}ms`,
                '--comet-o': dot.opacity,
              }}
              onAnimationEnd={i === COMET_DOTS.length - 1 ? onCometEnd : undefined}
            />
          ))
        : null}

      {/* Wider invisible hit target, purely local to this component, so
          hover doesn't require B to wire onEdgeMouseEnter/Leave on <ReactFlow>. */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={24}
        style={{ pointerEvents: cutting ? 'none' : 'stroke' }}
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
      />

      <EdgeLabelRenderer>
        <div
          className={`omni-edge-controls nodrag nopan${showControls ? ' is-visible' : ''}`}
          style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}
          onMouseEnter={onEnter}
          onMouseLeave={onLeave}
        >
          <button
            type="button"
            className="omni-edge-btn omni-edge-btn-add nodrag nopan"
            title="Add a block"
            aria-label="Add a block on this connection"
            onClick={openInsertPicker}
          >
            {/* Drawn glyph, not the text character — text "+"/"×" sit on a
                baseline and read optically low in a circle (third time this
                lesson has come up; see the pill and composer ×). */}
            <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
              <path d="M5 1v8M1 5h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            </svg>
          </button>
          <button
            type="button"
            className="omni-edge-btn omni-edge-btn-cut nodrag nopan"
            title="Delete connection"
            aria-label="Delete this connection"
            onClick={cutEdge}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
              <path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            </svg>
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  )
}
