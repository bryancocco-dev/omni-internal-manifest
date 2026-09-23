// Seam D — Edges/layout/flow-theme
//
// WIRE FEEL (PLAN.md "## WIRE FEEL — extends WIRE GEOMETRY"). Bryan: "the
// absolute best smoothest version... thinner... gorgeous and feel smooth
// and ease in and out of place so its almost tactile... nobody pays close
// attention to the way those connection points actually feel as the user
// drags them around the page - i want it to feel fun."
//
// This file is the custom `connectionLineComponent` (wired onto
// <ReactFlow> via ONE authorized additive prop line in FlowCanvas.jsx —
// see that file's own comment at the prop) PLUS two module-level,
// always-on mechanisms that can't live inside a component only mounted
// while a drag is actually in progress (RF unmounts this component the
// INSTANT the drag ends, before any of items 4/5/6 below have anything
// left to animate FROM):
//   - "the wire that waits" (item 5) — a plain vanilla-DOM SVG overlay,
//     appended to document.body, driven by window `cw:wire-hold`/
//     `cw:wire-release` events (dispatched from FlowCanvas.jsx's
//     onConnectEnd / the picker's onClose / handlePickBlock — the
//     AUTHORIZED "minimal event dispatches... for hold/release"). Vanilla
//     DOM rather than a React portal because there is no always-mounted
//     component in this seam to own it from, and because React never
//     touches document.body's children outside its own mounted roots, so
//     an externally-managed node there is completely safe from
//     reconciliation surprises.
//   - "port grab" (item 6) — a document-level, capture-phase
//     pointerdown/up listener (registered once at module load, same
//     "harmless no-op while the overlay is closed" posture OmniEdge.jsx's
//     own module-level ?wire= read already established) that WAAPI-
//     animates whichever `.react-flow__handle` was actually grabbed. WAAPI
//     rather than a persisted className for the SAME reason FlowCanvas.jsx
//     already documents on its own PORT_REFUSE animation: RF re-renders
//     handles mid-gesture (their connectingfrom/connectionindicator
//     classes are store-derived) and a plain class add from outside React
//     can lose that race; a WAAPI animation lives outside class/style
//     entirely, so it can't be clobbered that way.
//
// Everything else (the living spring-lag drag line, magnetic ease onto a
// valid port, velocity-responsive tension) lives in the default-exported
// component below, using OmniEdge.jsx's own exported geometry primitives
// (cubicWirePath, wireStubDx, positionUnit, EDGE_KIND_COLORS, ...) so the
// drag previews the SAME curve family the real, dropped edge will use —
// never a second, competing geometry the eye would catch as "different
// material" mid-gesture. The one deliberate simplification: the LIVE drag
// always renders via the forward cubic family, even when hovering a
// target that would ultimately route backward — PLAN.md's own item 4
// already carves the backward route a simpler, separate settle treatment
// (a 120ms crossfade, OmniEdge.jsx) rather than a morph, so a live preview
// of a detour it's about to abandon anyway isn't worth the extra
// complexity; the crossfade is where a backward connection's true shape
// actually reveals itself.

import { useEffect, useRef } from 'react'
import { Position } from '@xyflow/react'
import {
  EDGE_KIND_COLORS,
  TINT_HEX,
  WIRE_STUB,
  wireStubDx,
  positionUnit,
  clamp,
  cubicWirePath,
  prefersReducedMotion,
} from './OmniEdge.jsx'

// ---------------------------------------------------------------------------
// WIRE FEEL item 7 — "the fun gate... name the final constants." These are
// that name, tuned by eye against recorded drag sequences (see the report
// this dispatch ships with for the frame-sampling note).
// ---------------------------------------------------------------------------

// The living drag (item 2) — critically-damped follow, expressed as
// exponential smoothing (position += (target-position) * (1-exp(-dt/tau)))
// rather than a literal mass-spring-damper integrator: for a pure "chase
// and settle, never overshoot" feel this is the same critically-damped
// RESULT with far less code and no tuning trap where an under-tuned
// damping ratio rings. tau is the SETTLE constant PLAN.md names directly.
const DRAG_TAU_MS = 26 // "~90ms settle" — settle read as ~99% arrived by 5*tau
const MAGNETIC_TAU_MS = 15 // "eases onto the port centre (80ms)" — tighter follow once locked on

// Velocity -> tension (item 2 — "fast = taut/shorter tangents, slow =
// relaxed drape"). speed is measured in flow-px/ms of the RAW toX/toY
// target (the cursor's own reported speed, not the lagged head's — the
// head should react to how fast you're MOVING, not to its own lag).
const VELOCITY_REF = 1.6 // px/ms at which tension bottoms out at TAUT_FACTOR
const TAUT_FACTOR = 0.5
const RELAXED_FACTOR = 1.25
const DRAG_K = 0.5
const DRAG_MIN = 26
const DRAG_MAX = 230

// Magnetic ease-in (item 3). Distance-tuned offset (mirrors OmniEdge's own
// 'current' personality numbers) used once a VALID port is within range —
// the tension blend below crossfades DRAG_* -> these over MAGNETIC_TAU_MS
// via the same position-lag mechanism, not a hard cut.
const MAGNETIC_K = 0.52
const MAGNETIC_MIN = 42
const MAGNETIC_MAX = 248

// Head + stroke (item 1 — thinner; item 2 — "5px kind-colored comet-head").
const HEAD_RADIUS = 5
const LIVE_STROKE_WIDTH = 1.75

// Port-grab (item 6).
const GRAB_GROW_MS = 130
const GRAB_RELEASE_MS = 160
const GRAB_SCALE = 1.35

// The wire that waits (item 5).
const HOLD_RETRACT_MS = 140
const HOLD_COMPLETE_MS = 160

function lerp(a, b, t) {
  return a + (b - a) * t
}

// ---------------------------------------------------------------------------
// Port grab (item 6) — module-level, registered once. Capture phase, no
// preventDefault/stopPropagation: purely observational, RF's own handle
// mousedown/connection-start handling underneath is untouched.
// ---------------------------------------------------------------------------
if (typeof document !== 'undefined' && !document.__cwPortGrabWired) {
  document.__cwPortGrabWired = true
  let grabbedEl = null

  // Standalone `scale`, never `transform` (matches motion.css's own
  // cw-handle-breathe and FlowCanvas.jsx's PORT_REFUSE_SHAKE_FRAMES —
  // both leave this exact comment): RF's base stylesheet already puts
  // `transform: translate(...)` on every handle for its own left/right
  // centering, and WAAPI keyframing `transform` directly would overwrite
  // that positioning instead of composing with it. `scale` is its own
  // independent CSS property since CSS Transforms Level 2 and layers on
  // top of `transform` for free.
  const growFrames = (reduced) => (reduced ? [{ scale: '1' }, { scale: '1' }] : [{ scale: '1' }, { scale: String(GRAB_SCALE) }])
  const releaseFrames = (reduced) => (reduced ? [{ scale: '1' }, { scale: '1' }] : [{ scale: String(GRAB_SCALE) }, { scale: '1' }])

  document.addEventListener(
    'pointerdown',
    (event) => {
      const handle = event.target?.closest?.('.react-flow__handle')
      if (!handle) return
      grabbedEl = handle
      handle.getAnimations().forEach((a) => {
        if (a.id === 'cw-port-grab' || a.id === 'cw-port-release') a.cancel()
      })
      const reduced = prefersReducedMotion()
      handle.animate(growFrames(reduced), {
        id: 'cw-port-grab',
        duration: reduced ? 1 : GRAB_GROW_MS,
        easing: 'cubic-bezier(.34,1.56,.64,1)', // --cw-e-spring literal (WAAPI easing strings don't resolve var())
        fill: 'forwards',
      })
    },
    true,
  )

  const release = () => {
    if (!grabbedEl) return
    const el = grabbedEl
    grabbedEl = null
    el.getAnimations().forEach((a) => {
      if (a.id === 'cw-port-grab') a.cancel()
    })
    const reduced = prefersReducedMotion()
    el.animate(releaseFrames(reduced), {
      id: 'cw-port-release',
      duration: reduced ? 1 : GRAB_RELEASE_MS,
      easing: 'cubic-bezier(.22,1,.36,1)', // --cw-e-out literal
      fill: 'forwards',
    })
  }
  document.addEventListener('pointerup', release, true)
  document.addEventListener('pointercancel', release, true)

  // Exposed for the held-wire retract below (item 5's "small port absorb
  // pulse") — reuses the SAME grow/release pair rather than inventing a
  // second ring animation.
  document.__cwPulsePort = (nodeId, handleId) => {
    const el = document.querySelector(
      `#workflow-root .react-flow__handle[data-nodeid="${CSS.escape(nodeId)}"][data-handleid="${CSS.escape(handleId)}"]`,
    )
    if (!el) return
    const reduced = prefersReducedMotion()
    el.animate(growFrames(reduced), {
      duration: reduced ? 1 : GRAB_GROW_MS,
      easing: 'cubic-bezier(.34,1.56,.64,1)',
    }).finished
      .catch(() => {})
      .then(() => {
        el.animate(releaseFrames(reduced), {
          duration: reduced ? 1 : GRAB_RELEASE_MS,
          easing: 'cubic-bezier(.22,1,.36,1)',
        })
      })
  }
}

// ---------------------------------------------------------------------------
// The wire that waits (item 5) — module-level vanilla DOM overlay. Screen-
// space (position:fixed), not flow-space: it's a brief, modal-adjacent
// snapshot (the picker is open and has focus) rather than a standing
// canvas citizen, so not tracking a pan/zoom that happens mid-picker is an
// accepted, documented simplification — see file header.
// ---------------------------------------------------------------------------
let heldOverlay = null

function getHandleScreenCenter(nodeId, handleId) {
  const el = document.querySelector(
    `#workflow-root .react-flow__handle[data-nodeid="${CSS.escape(nodeId)}"][data-handleid="${CSS.escape(handleId)}"]`,
  )
  if (!el) return null
  const r = el.getBoundingClientRect()
  return { x: r.x + r.width / 2, y: r.y + r.height / 2 }
}

function ensureHeldOverlay() {
  if (heldOverlay) return heldOverlay
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('class', 'cw-held-wire')
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  path.setAttribute('class', 'cw-held-wire-path')
  path.setAttribute('fill', 'none')
  path.setAttribute('pathLength', '100')
  svg.appendChild(path)
  document.body.appendChild(svg)
  heldOverlay = { svg, path, fromNodeId: null, fromHandleId: null }
  return heldOverlay
}

function teardownHeldOverlay() {
  if (!heldOverlay) return
  heldOverlay.svg.remove()
  heldOverlay = null
}

if (typeof window !== 'undefined' && !window.__cwWireHoldWired) {
  window.__cwWireHoldWired = true

  window.addEventListener('cw:wire-hold', (event) => {
    const { fromNodeId, fromHandleId, fromHandleType, clientX, clientY } = event.detail || {}
    if (typeof clientX !== 'number' || typeof clientY !== 'number') return
    const handleId = fromHandleId || 'out'
    const fromPt = getHandleScreenCenter(fromNodeId, handleId)
    if (!fromPt) return
    const { svg, path } = ensureHeldOverlay()
    heldOverlay.fromNodeId = fromNodeId
    heldOverlay.fromHandleId = handleId
    heldOverlay.fromHandleType = fromHandleType
    // Frozen at release shape — a plain straight line, screen space
    // (source-handle center -> drop point). Nothing here needs the full
    // wire-personality curve treatment: it's about to be REPLACED by a
    // real routed edge (on pick) or vanish (on dismiss), never rendered
    // long enough to read as "the wrong curve shape."
    path.setAttribute('d', `M${fromPt.x} ${fromPt.y} L${clientX} ${clientY}`)
    path.style.strokeDasharray = '100'
    path.style.strokeDashoffset = '0'
    svg.classList.remove('is-releasing', 'is-completing')
    // Force a reflow so the class re-add below always restarts the CSS
    // transition (holding twice in a row without ever releasing shouldn't
    // happen, but this keeps the visual state honest if it somehow does).
    void svg.offsetWidth
    svg.classList.add('is-held')
  })

  window.addEventListener('cw:wire-release', (event) => {
    if (!heldOverlay) return
    const reason = event.detail?.reason // 'pick' | 'dismiss'
    const { svg, path, fromNodeId, fromHandleId } = heldOverlay
    svg.classList.remove('is-held')
    if (reason === 'pick') {
      // "completes with the settle morph on pick" — the morph is the REAL
      // edge's own job (OmniEdge.jsx, cw:wire-connected) once state.jsx
      // mints it; this overlay just needs to get out of the way cleanly.
      svg.classList.add('is-completing')
      setTimeout(teardownHeldOverlay, HOLD_COMPLETE_MS + 40)
    } else {
      // "retracts INTO the source port... + a small port absorb pulse".
      path.style.strokeDashoffset = '100'
      svg.classList.add('is-releasing')
      if (fromNodeId) document.__cwPulsePort?.(fromNodeId, fromHandleId)
      setTimeout(teardownHeldOverlay, HOLD_RETRACT_MS + 40)
    }
  })
}

// ---------------------------------------------------------------------------
// The living drag line — the actual connectionLineComponent.
// ---------------------------------------------------------------------------
export default function ConnectionLine({ fromX, fromY, fromPosition, toX, toY, toPosition, fromNode, toNode, toHandle, connectionStatus }) {
  const pathRef = useRef(null)
  const moatRef = useRef(null)
  const headRef = useRef(null)
  const gradRef = useRef({ start: null, end: null })
  const gradientId = useRef(`cw-drag-grad-${Math.random().toString(36).slice(2, 9)}`).current

  // Latest props, read fresh by the rAF loop below via refs (NOT effect
  // deps) — restarting the loop's own effect on every pointermove-driven
  // re-render would reset dt bookkeeping and cause visible stutter.
  const liveRef = useRef(null)
  liveRef.current = { fromX, fromY, fromPosition, toX, toY, toPosition, fromNode, toNode, toHandle, connectionStatus }

  const posRef = useRef({ x: fromX, y: fromY })
  const lastTargetRef = useRef({ x: toX, y: toY })
  const speedRef = useRef(0)
  const lastTsRef = useRef(null)
  const mountTsRef = useRef(null)

  useEffect(() => {
    // Grab-moment stub brighten (item 6, drag-line half) — a short decay
    // from mount, independent of the rAF position loop below so it reads
    // even on a dead-still first frame.
    mountTsRef.current = performance.now()

    const reduced = prefersReducedMotion()
    let raf

    const tick = (now) => {
      const live = liveRef.current
      const dt = lastTsRef.current ? Math.min(48, now - lastTsRef.current) : 16
      lastTsRef.current = now

      // Cursor speed (flow px / ms), lightly smoothed so a single jittery
      // frame can't spike the tension calc.
      const rawSpeed = Math.hypot(live.toX - lastTargetRef.current.x, live.toY - lastTargetRef.current.y) / Math.max(dt, 1)
      lastTargetRef.current = { x: live.toX, y: live.toY }
      speedRef.current += (rawSpeed - speedRef.current) * 0.35

      const magnetic = live.connectionStatus === 'valid' && !!live.toHandle
      const tauMs = reduced ? 0.001 : magnetic ? MAGNETIC_TAU_MS : DRAG_TAU_MS
      const alpha = reduced ? 1 : 1 - Math.exp(-dt / tauMs)
      posRef.current = {
        x: posRef.current.x + (live.toX - posRef.current.x) * alpha,
        y: posRef.current.y + (live.toY - posRef.current.y) * alpha,
      }

      // Tension: velocity-responsive in free drag, distance-tuned (matches
      // OmniEdge's own 'current' personality) once magnetically locked —
      // WIRE FEEL item 3's "the curve previews the final routed geometry."
      const p0 = { x: live.fromX + wireStubDx(live.fromPosition), y: live.fromY }
      const targetStubDx = wireStubDx(live.toPosition ?? Position.Left)
      const p3 = { x: posRef.current.x + targetStubDx, y: posRef.current.y }
      const dx = Math.abs(p3.x - p0.x)
      let offset
      if (magnetic) {
        offset = clamp(dx * MAGNETIC_K, MAGNETIC_MIN, MAGNETIC_MAX)
      } else {
        const speedNorm = clamp(speedRef.current / VELOCITY_REF, 0, 1)
        const tensionFactor = lerp(RELAXED_FACTOR, TAUT_FACTOR, speedNorm)
        offset = clamp(dx * DRAG_K * tensionFactor, DRAG_MIN, DRAG_MAX)
      }

      const { path, c1, c2 } = cubicWirePath(
        { x: live.fromX, y: live.fromY },
        { x: posRef.current.x, y: posRef.current.y },
        p0,
        p3,
        live.fromPosition,
        live.toPosition ?? Position.Left,
        wireStubDx(live.fromPosition),
        targetStubDx,
        offset,
      )

      // Grab-moment stub brighten — decays over GRAB_GROW_MS*2ish, purely
      // cosmetic on the moat's opacity, never the core ink (keeps the
      // gradient-driven core color the single source of truth for hue).
      const sinceMount = now - mountTsRef.current
      const grabGlow = reduced ? 0 : Math.max(0, 1 - sinceMount / 260)

      if (pathRef.current) pathRef.current.setAttribute('d', path)
      if (moatRef.current) {
        moatRef.current.setAttribute('d', path)
        moatRef.current.style.opacity = String(0.55 + grabGlow * 0.35)
      }
      if (headRef.current) {
        headRef.current.setAttribute('cx', String(posRef.current.x))
        headRef.current.setAttribute('cy', String(posRef.current.y))
      }

      // Kind-ink gradient (item 2 — "from the source port fading toward
      // the head"; item 3 — previews the TARGET's kind once magnetically
      // locked, same fade idiom OmniEdge's real gradient already uses).
      const sourceKind = live.fromNode?.type
      const targetKind = magnetic ? live.toNode?.type : null
      // Tint outranks kind — the drag comet wears the node's chip color
      // (same effective-identity rule the settled wires follow).
      const sourceTintHex = TINT_HEX[live.fromNode?.data?.tint]
      const targetTintHex = magnetic ? TINT_HEX[live.toNode?.data?.tint] : null
      const startColor = sourceTintHex || (sourceKind && EDGE_KIND_COLORS[sourceKind]) || 'var(--cw-edge-active)'
      const endColor = targetTintHex || (targetKind && EDGE_KIND_COLORS[targetKind] ? EDGE_KIND_COLORS[targetKind] : 'var(--cw-edge)')
      if (gradRef.current.start && (gradRef.current.start.getAttribute('stop-color') !== startColor)) {
        gradRef.current.start.setAttribute('stop-color', startColor)
      }
      if (gradRef.current.end && gradRef.current.end.getAttribute('stop-color') !== endColor) {
        gradRef.current.end.setAttribute('stop-color', endColor)
      }
      if (gradRef.current.grad) {
        gradRef.current.grad.setAttribute('x1', String(live.fromX))
        gradRef.current.grad.setAttribute('y1', String(live.fromY))
        gradRef.current.grad.setAttribute('x2', String(posRef.current.x))
        gradRef.current.grad.setAttribute('y2', String(posRef.current.y))
      }
      if (headRef.current) headRef.current.setAttribute('fill', magnetic ? endColor : startColor)

      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // Mount-once: see liveRef comment above for why this never re-runs on prop changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <defs>
        <linearGradient
          id={gradientId}
          gradientUnits="userSpaceOnUse"
          x1={fromX}
          y1={fromY}
          x2={toX}
          y2={toY}
          ref={(el) => {
            gradRef.current.grad = el
          }}
        >
          <stop
            offset="0"
            stopColor="var(--cw-edge-active)"
            ref={(el) => {
              gradRef.current.start = el
            }}
          />
          <stop
            offset="1"
            stopColor="var(--cw-edge)"
            ref={(el) => {
              gradRef.current.end = el
            }}
          />
        </linearGradient>
      </defs>
      {/* Moat first (paint order), same "etched into the canvas" idiom
          OmniEdge's real wires use — legibility for the now-thinner 1.75px
          core (WIRE FEEL item 1's own verify note). */}
      <path ref={moatRef} d="" fill="none" stroke="var(--cw-surface)" strokeWidth={LIVE_STROKE_WIDTH + 2} style={{ pointerEvents: 'none' }} />
      <path
        ref={pathRef}
        d=""
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth={LIVE_STROKE_WIDTH}
        strokeLinecap="round"
        style={{ pointerEvents: 'none' }}
      />
      {/* item 2 — "a 5px kind-colored comet-head". */}
      <circle ref={headRef} r={HEAD_RADIUS} fill="var(--cw-edge-active)" style={{ pointerEvents: 'none' }} />
    </>
  )
}
