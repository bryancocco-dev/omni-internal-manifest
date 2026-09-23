// Inertial pan + eased zoom (Bryan: "buttery smooth, eases into place")
//
// React Flow's own pan is 1:1 with the pointer and stops dead on release;
// its wheel zoom steps per tick. This adds a physics layer ON TOP without
// touching RF's input handling:
//
//   PAN  — track pointer velocity while dragging the pane, and on release
//          glide the viewport along that velocity with exponential decay
//          (the trackpad/native-scroll feel: fast flick = long coast, slow
//          release = no coast at all).
//   ZOOM — swallow the wheel event and drive our own critically-damped
//          approach toward a target zoom, anchored at the cursor so the
//          point under the pointer stays put (RF's own anchoring math).
//
// Implementation notes:
//   * Everything runs on ONE rAF loop that owns the viewport while it's
//     animating and yields the moment it settles, so RF's own interactions
//     (node drags, connection drags, minimap, fitView, the zoom readout)
//     are never fighting a timer.
//   * Any pointerdown/RF-driven viewport jump cancels an in-flight glide —
//     the user's hand always wins.
//   * prefers-reduced-motion disables both (RF's stock behavior returns).

import { useEffect, useRef } from 'react'
import { useReactFlow, useStore } from '@xyflow/react'

const FRICTION = 0.92 // per-frame velocity decay for the pan coast
const MIN_VELOCITY = 0.05 // px/frame — below this the glide ends
const MAX_VELOCITY = 45 // px/frame — clamp so a violent flick stays sane
const ZOOM_EASE = 0.18 // fraction of remaining zoom distance per frame
const ZOOM_EPSILON = 0.0008
const WHEEL_SENSITIVITY = 0.0016

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

export default function ViewportGlide() {
  const { getViewport, setViewport } = useReactFlow()
  const domNode = useStore((s) => s.domNode)
  const minZoom = useStore((s) => s.minZoom)
  const maxZoom = useStore((s) => s.maxZoom)

  const raf = useRef(0)
  const state = useRef({
    // pan
    tracking: false,
    lastX: 0,
    lastY: 0,
    vx: 0,
    vy: 0,
    coasting: false,
    // zoom
    targetZoom: null,
    anchor: { x: 0, y: 0 },
  })

  useEffect(() => {
    if (!domNode || prefersReducedMotion()) return

    const s = state.current
    const pane = domNode.querySelector('.react-flow__pane') || domNode

    const stop = () => {
      s.coasting = false
      s.targetZoom = null
      s.vx = 0
      s.vy = 0
      cancelAnimationFrame(raf.current)
      raf.current = 0
    }

    const tick = () => {
      raf.current = 0
      const vp = getViewport()
      let next = { ...vp }
      let busy = false

      // ---- zoom easing (cursor-anchored) --------------------------------
      if (s.targetZoom != null) {
        const diff = s.targetZoom - vp.zoom
        if (Math.abs(diff) < ZOOM_EPSILON) {
          s.targetZoom = null
        } else {
          const zoom = vp.zoom + diff * ZOOM_EASE
          // Keep the flow-space point under the cursor pinned: solve the
          // new translate from the invariant  (anchor - x) / zoom = const.
          const k = zoom / vp.zoom
          next = {
            zoom,
            x: s.anchor.x - (s.anchor.x - vp.x) * k,
            y: s.anchor.y - (s.anchor.y - vp.y) * k,
          }
          busy = true
        }
      }

      // ---- pan coast ----------------------------------------------------
      if (s.coasting) {
        s.vx *= FRICTION
        s.vy *= FRICTION
        if (Math.hypot(s.vx, s.vy) < MIN_VELOCITY) {
          s.coasting = false
        } else {
          next = { ...next, x: next.x + s.vx, y: next.y + s.vy }
          busy = true
        }
      }

      if (busy) {
        setViewport(next)
        raf.current = requestAnimationFrame(tick)
      }
    }

    const ensureLoop = () => {
      if (!raf.current) raf.current = requestAnimationFrame(tick)
    }

    // ---- pan tracking ---------------------------------------------------
    const onPointerDown = (e) => {
      stop() // the hand always wins
      // Only track drags that start on the pane itself (not on a node,
      // handle, edge control, or any chrome) — those are RF's to own.
      if (e.target !== pane && !e.target.classList?.contains('react-flow__pane')) return
      s.tracking = true
      s.lastX = e.clientX
      s.lastY = e.clientY
      s.vx = 0
      s.vy = 0
    }

    const onPointerMove = (e) => {
      if (!s.tracking) return
      const dx = e.clientX - s.lastX
      const dy = e.clientY - s.lastY
      s.lastX = e.clientX
      s.lastY = e.clientY
      // Smooth the sample so a single jittery frame can't define the throw.
      s.vx = s.vx * 0.6 + dx * 0.4
      s.vy = s.vy * 0.6 + dy * 0.4
    }

    const onPointerUp = () => {
      if (!s.tracking) return
      s.tracking = false
      const speed = Math.hypot(s.vx, s.vy)
      if (speed < MIN_VELOCITY * 4) return // a placement, not a throw
      const scale = Math.min(1, MAX_VELOCITY / speed)
      s.vx *= scale
      s.vy *= scale
      s.coasting = true
      ensureLoop()
    }

    // ---- wheel zoom ------------------------------------------------------
    const onWheel = (e) => {
      // Pinch-zoom and ctrl+wheel arrive as ctrlKey wheels; plain wheel is
      // RF's zoom by default (zoomOnScroll) — we take over both so the
      // easing is consistent, but leave shift+wheel (horizontal pan) alone.
      if (e.shiftKey) return
      // Marquee tool active (FlowCanvas's select toggle): left-drag belongs to
      // RF's selection rect, so don't track it for an inertial pan.
      if (pane.closest('.cw-select-mode')) return
      e.preventDefault()
      e.stopPropagation()

      const vp = getViewport()
      const rect = domNode.getBoundingClientRect()
      s.anchor = { x: e.clientX - rect.left, y: e.clientY - rect.top }

      const base = s.targetZoom ?? vp.zoom
      // Exponential response keeps each notch feeling equal at any scale.
      const next = base * Math.exp(-e.deltaY * WHEEL_SENSITIVITY)
      s.targetZoom = Math.min(maxZoom, Math.max(minZoom, next))
      s.coasting = false // a zoom cancels a coast; one intent at a time

      // We've swallowed RF's own zoom, so easing must never be the ONLY path
      // to a zoom change: rAF is frozen in a hidden/background document, and
      // without this the wheel would silently do nothing there. Apply the
      // target immediately in that case instead of queueing a loop.
      if (typeof document !== 'undefined' && document.hidden) {
        const k = s.targetZoom / vp.zoom
        setViewport({
          zoom: s.targetZoom,
          x: s.anchor.x - (s.anchor.x - vp.x) * k,
          y: s.anchor.y - (s.anchor.y - vp.y) * k,
        })
        s.targetZoom = null
        return
      }
      ensureLoop()
    }

    pane.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    // Capture phase + non-passive so we can preempt RF's own zoom handler.
    domNode.addEventListener('wheel', onWheel, { passive: false, capture: true })

    return () => {
      stop()
      pane.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      domNode.removeEventListener('wheel', onWheel, { capture: true })
    }
  }, [domNode, getViewport, setViewport, minZoom, maxZoom])

  return null
}
