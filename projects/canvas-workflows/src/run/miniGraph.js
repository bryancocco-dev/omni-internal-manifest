// PLATFORM CHROME (PLAN.md "## PLATFORM CHROME — Templates browser, Model
// library, session Workflows"). "ONE mini-graph renderer... serving BOTH
// template cards and saved-workflow cards — real node positions scaled into
// a small SVG, kind-colored rects, thin curved edges." This file is that
// renderer: a pure geometry function (`computeMiniGraph`) that turns any
// `{nodes, edges}` graph — a built template OR a saved-workflow snapshot,
// identical shape either way (PLAN.md §Graph schema) — into thumbnail data,
// plus one small React component that paints it.
//
// Plain `.js`, not `.jsx` (matches this directory's own convention —
// run/engine.js, run/download.js are pure-JS; run/artifacts.jsx,
// run/posters.jsx carry JSX and wear the extension for it): vite.config.js
// runs no esbuild loader override for `.js`, so JSX syntax here would fail
// to parse. `MiniGraphThumb` below is written with `React.createElement`
// for exactly that reason — still a normal function component, just spelled
// without the JSX sugar.
//
// Reuses `nodeBox`/`graphBounds` from data/templates/builder.js (already
// exported for precisely this "real box geometry, not raw position" need —
// see that file's own header comment) rather than re-deriving size
// estimates: `nodeBox` prefers React Flow's own `measured` when present
// (always true for a saved-workflow snapshot, whose nodes were live-
// rendered before being captured) and falls back to the same per-type
// estimate table a freshly-built template's un-measured nodes already lean
// on everywhere else in this app. One function, correct for both inputs.
import React from 'react'
import { nodeBox, graphBounds } from '../data/templates/builder.js'

// Kind -> fill color. Duplicated as literal var()-with-hex-fallback rather
// than imported — the same cross-seam convention src/edges/OmniEdge.jsx's
// own EDGE_KIND_COLORS documents and flow.css's port-ring rules mirror by
// hand (see OmniEdge.jsx's header comment on that export): this file lives
// in run/, needs the SAME 13-entry node-type roster edges/ already keys off
// node.type, and importing a component-heavy edge-rendering module just for
// a color map would be the wrong kind of coupling. Keep both lists in sync
// by hand if a kind is ever added/renamed (OmniEdge.jsx's own instruction).
// Two entries beyond that roster: `variantgroup`/`variant` (VARIANT STUDIO
// fan-out frames — can appear in a saved-workflow snapshot if the user had
// an active grid on canvas at save time) and `note`/`params` (COMFY ROUND
// annotate blocks — never appear in an authored template, but a saved
// workflow snapshot is whatever the user actually built, so both need a
// real color rather than falling through to the gray default).
const KIND_FILL = {
  trigger: 'var(--cw-kind-trigger, #10B981)',
  task: 'var(--cw-accent, #1858EE)',
  human: 'var(--cw-kind-human, #F59E0B)',
  output: 'var(--cw-accent, #1858EE)',
  logic: 'var(--cw-kind-logic, #8B5CF6)',
  wait: 'var(--cw-kind-wait, #64748B)',
  stop: 'var(--cw-kind-stop, #DC2626)',
  generate: 'var(--cw-accent, #1858EE)',
  signal: 'var(--cw-kind-signal, #0EA5E9)',
  remix: 'var(--cw-accent, #1858EE)',
  handoff: 'var(--cw-kind-human, #F59E0B)',
  localize: 'var(--cw-accent, #1858EE)',
  optimize: 'var(--cw-accent, #1858EE)',
  runworkflow: 'var(--cw-accent, #1858EE)',
  variantgroup: 'var(--cw-accent, #1858EE)',
  variant: 'var(--cw-accent, #1858EE)',
  note: 'var(--cw-warn-text, #92400E)',
  params: 'var(--cw-text-3, #6B7280)',
}
// Exported — TemplatesBrowser.jsx's "Contains" filter chips and its card's
// kind-dot strip both need the SAME type->color mapping this renderer uses
// for its own rects (so a chip/dot reads as the identical color a matching
// node draws in the thumbnail above it), rather than a second hand-kept copy.
export function fillForType(type) {
  return KIND_FILL[type] || 'var(--cw-text-3, #6B7280)'
}

// "~160x100 box" (PLAN.md, verbatim) — the default; callers may override for
// a differently-proportioned card slot, but every current caller uses the
// default so thumbnails are visually comparable across templates AND
// workflows in the same grid.
const VIEW_W = 160
const VIEW_H = 100
const PAD = 7
// A dense template (Wave 5's largest run ~9-10 nodes) can scale a card down
// to a few px on a side — floor both dimensions so every node stays a
// legible, distinct mark rather than disappearing (PLAN.md's own bar: "reads
// as that template's shape," which requires every shape to still be THERE).
const MIN_W = 9
const MIN_H = 6
const RADIUS = 1.6

// The pure core. `graph` is any `{nodes, edges}` pair — a template's
// `build()` output or a saved-workflow's stored snapshot, unchanged, no
// adapter needed. Top-level nodes only (VARIANT STUDIO children carry
// frame-relative positions, not canvas ones — same "top-level only" filter
// insertTemplate/addNodeFromPalette already apply for identical reasons);
// the parent `variantgroup` frame itself still draws, since ITS box already
// covers the grid's full footprint.
export function computeMiniGraph(graph, opts = {}) {
  const viewW = opts.viewW || VIEW_W
  const viewH = opts.viewH || VIEW_H
  const viewBox = `0 0 ${viewW} ${viewH}`
  const nodes = (graph?.nodes || []).filter((n) => !n.parentId)
  const edges = graph?.edges || []
  if (!nodes.length) return { viewBox, w: viewW, h: viewH, rects: [], paths: [] }

  const bounds = graphBounds(nodes) || { x: 0, y: 0, w: 1, h: 1 }
  const availW = viewW - PAD * 2
  const availH = viewH - PAD * 2
  // "Contain" scale (uniform, preserves relative proportions between a
  // 340px task card and a 230px logic card) rather than stretching each
  // axis independently — a template's own shape is exactly what a
  // distorted aspect ratio would erase.
  const scale = Math.min(availW / Math.max(bounds.w, 1), availH / Math.max(bounds.h, 1))
  const offsetX = PAD + (availW - bounds.w * scale) / 2
  const offsetY = PAD + (availH - bounds.h * scale) / 2

  const rectById = new Map()
  const rects = nodes.map((n) => {
    const box = nodeBox(n)
    const w = Math.max(MIN_W, box.w * scale)
    const h = Math.max(MIN_H, box.h * scale)
    const x = offsetX + (box.x - bounds.x) * scale
    const y = offsetY + (box.y - bounds.y) * scale
    const rect = { id: n.id, x, y, w, h, fill: fillForType(n.type) }
    rectById.set(n.id, rect)
    return rect
  })

  // Thin curved connectors, source right-mid -> target left-mid — a
  // miniature of OmniEdge's own smoothstep-ish S-curve (edges/OmniEdge.jsx),
  // simplified to one cubic bezier since there's no room at this scale for
  // more geometry than "the shape of the connection." Handle identity
  // (true/false/case-N/opt-*) doesn't matter here — every rank in this app
  // lays out strictly left-to-right, so "right side out, left side in" is
  // always correct regardless of which named handle an edge left from.
  const paths = edges
    .map((e) => {
      const s = rectById.get(e.source)
      const t = rectById.get(e.target)
      if (!s || !t) return null // dangling ref (shouldn't happen; skip rather than throw)
      const sx = s.x + s.w
      const sy = s.y + s.h / 2
      const tx = t.x
      const ty = t.y + t.h / 2
      const dx = Math.max(6, (tx - sx) / 2)
      const d = `M${sx.toFixed(1)} ${sy.toFixed(1)} C${(sx + dx).toFixed(1)} ${sy.toFixed(1)}, ${(tx - dx).toFixed(1)} ${ty.toFixed(1)}, ${tx.toFixed(1)} ${ty.toFixed(1)}`
      return { id: e.id, d }
    })
    .filter(Boolean)

  return { viewBox, w: viewW, h: viewH, rects, paths }
}

// Template thumbnails — "compute once, cache" (PLAN.md). Templates are
// static module data (data/templates/index.js), so a lazy, session-lifetime
// Map keyed by template id is a true "compute once" across the whole app,
// not just per mount: the first browser-modal open (or hover preview, or
// search result) that ever asks for a given template's thumbnail pays for
// `tpl.build()` + the geometry pass exactly once; every later ask — a
// re-open of the modal, a re-render of the grid, a different filter pass —
// reads the cached object. The built `graph` itself rides along on the
// cache entry too, so TemplatesBrowser.jsx's "Contains" filter (which needs
// to inspect every template's actual node types) can reuse the SAME build()
// call instead of minting a second throwaway id set for every template.
const templateCache = new Map()
export function getTemplateMiniGraph(tpl) {
  let entry = templateCache.get(tpl.id)
  if (!entry) {
    const graph = tpl.build()
    entry = { ...computeMiniGraph(graph), graph }
    templateCache.set(tpl.id, entry)
  }
  return entry
}

// Saved workflows compute their own thumbnail ONCE, at save time (state.jsx
// calls computeMiniGraph directly and stores the result on the record —
// PLAN.md's own data shape: "thumb: <same mini-graph renderer as
// templates>") — never recomputed on every render, satisfying "compute
// once, cache" for that path just as directly as the template Map above.

// Presentational-only: paints whatever `computeMiniGraph`/
// `getTemplateMiniGraph` produced. `React.createElement`, not JSX — see this
// file's own header comment for why (plain .js, no esbuild JSX loader).
export function MiniGraphThumb({ data, className }) {
  const viewBox = data?.viewBox || `0 0 ${VIEW_W} ${VIEW_H}`
  const children = []
  if (data) {
    for (const p of data.paths) {
      children.push(
        React.createElement('path', {
          key: `e-${p.id}`,
          d: p.d,
          fill: 'none',
          stroke: 'var(--cw-edge, #B6BCC8)',
          strokeWidth: 1.1,
          strokeLinecap: 'round',
        }),
      )
    }
    for (const r of data.rects) {
      children.push(
        React.createElement('rect', {
          key: `n-${r.id}`,
          x: r.x,
          y: r.y,
          width: r.w,
          height: r.h,
          rx: RADIUS,
          fill: r.fill,
        }),
      )
    }
  }
  return React.createElement(
    'svg',
    { className, viewBox, preserveAspectRatio: 'xMidYMid meet', 'aria-hidden': 'true' },
    children,
  )
}
