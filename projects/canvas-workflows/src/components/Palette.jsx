// Seam B — App core

import React, { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import {
  Power,
  ClipboardText,
  User,
  Hourglass,
  StopCircle,
  GitBranch,
  ArrowsSplit,
  Repeat,
  ShieldWarning,
  EnvelopeSimple,
  ChatsCircle,
  TextT,
  Image,
  VideoCamera,
  Waveform,
  PresentationChart,
  FileDoc,
  Table,
  Layout,
  MagnifyingGlass,
  Sparkle,
  NotePencil,
  SlidersHorizontal,
  // LIBRARY PASS — CaretRight for the folder-tree chevron (PLAN.md's
  // literal spec: "chevron (CaretRight 10, rotates 90° open, --cw-d-1)"),
  // BookmarkSimple for the hover-reveal bookmark flag.
  CaretRight,
  BookmarkSimple,
  // PLATFORM CHROME — the Templates tab's "Browse all" link icon.
  ArrowUpRight,
  // WAVE 1 — THE VERB EXPANSION (out-of-seam, minimal fix: this file's own
  // icon map is a hand-duplicated mirror of PalettePreview.jsx's — see that
  // file's own header note on why it can't just import one shared map —
  // and needs the same two new entries so the Gather/A-B Split palette
  // rows this wave adds to data/blocks.js don't render with a blank tile).
  ArrowsInSimple,
  Percent,
  // WAVE 2 — THE VERB EXPANSION (same hand-duplicated-mirror precedent as
  // the WAVE 1 note above) — Source/Audience/Measure's own palette-row
  // icons.
  Database,
  UsersThree,
  Target,
  // WAVE 3 — THE VERB EXPANSION (out-of-seam, minimal fix: this file's icon
  // map never picked up Style Reference/Remix/Compare's own three icons,
  // so all three rendered a blank palette tile — closed incidentally while
  // adding Wave 4's own icons just below, same hand-duplicated-mirror map).
  Swatches,
  Shuffle,
  Ranking,
  // WAVE 4 — THE VERB EXPANSION (same hand-duplicated-mirror precedent) —
  // Handoff/Localize/Optimize/Run workflow/Guardrail's own palette-row
  // icons.
  UserSwitch,
  Translate,
  TrendUp,
  FlowArrow,
  ShieldCheck,
  // FILES TAB — the one consistent workflow-ish glyph every file row draws
  // (never kind-colored: a saved project isn't a "kind" the way a block
  // is). Phosphor's TreeStructure reads as "a graph you once built."
  TreeStructure,
} from '@phosphor-icons/react'

import { PALETTE_SECTIONS } from '../data/blocks.js'
import { TEMPLATES } from '../data/templates/index.js'
// FILES ON THE CANVAS — the tab's two live session stores: canvasFiles.js
// (everything attached via the composer's + menu — the tab's PRIMARY
// content per Bryan's redefinition) and files.js's runtime saves (the Save
// panel's own list, shown in a quiet section below). Both are the same
// external-store shape as this file's bookmark sets below; the old seeded
// "Recent projects" import is retired.
import { useSavedFiles } from '../data/files.js'
import { useCanvasFiles } from '../data/canvasFiles.js'
import { useFlowState } from '../state.jsx'
import TemplateList, { TemplateRow } from './TemplateList.jsx'
import PalettePreview, { previewHoverStart, previewHoverEnd, previewCloseNow } from './PalettePreview.jsx'
// PLATFORM CHROME (PLAN.md "## PLATFORM CHROME" -> "### 1 — Templates
// browser modal") — "palette Templates tab gains a quiet 'Browse all ↗'
// link at its top."
import { openBrowser } from './BrowserModal.jsx'

// Native drag-image replacement: a pre-loaded transparent pixel. Chrome's
// setDragImage rasterisation of DOM nodes proved unreliable (off-viewport
// parking, async capture races, row-dependent failures) — so the native
// image is blanked entirely and the card ghost below follows the cursor
// manually via document-level dragover. Deterministic on every row.
const EMPTY_DRAG_IMG = typeof window !== 'undefined' ? new window.Image(1, 1) : null
if (EMPTY_DRAG_IMG) {
  EMPTY_DRAG_IMG.src =
    'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
}

export function attachManualDragGhost(ghost, grabX, grabY, sourceEl) {
  const move = (e) => {
    if (typeof e.clientX !== 'number' || (e.clientX === 0 && e.clientY === 0)) return
    ghost.style.left = `${e.clientX - grabX}px`
    ghost.style.top = `${e.clientY - grabY}px`
  }
  const cleanup = () => {
    document.removeEventListener('dragover', move)
    ghost.remove()
  }
  document.addEventListener('dragover', move)
  sourceEl.addEventListener('dragend', cleanup, { once: true })
}

// MOTION PHASE item 3 (PLAN.md "### M3"): "Palette drag sets a styled
// drag-image (small tilted card ghost) instead of the default snapshot."
// `setDragImage` needs a real, attached (if off-screen) element to snapshot
// at the moment `dragstart` fires; built with the DOM API rather than
// innerHTML since there's no user input involved. Removed a frame later —
// the browser has already captured its image by then.
function buildDragGhost(item, rowEl, event) {
  // The ghost carries THE ENTIRE ROW (Bryan): the real icon tile (cloned,
  // glyph included), the label, and the caption — inside the card container.
  // No box-shadow: Chrome rasterises the drag image, and a large soft shadow
  // bakes into the bitmap as a smeared grey plate around the card.
  const el = document.createElement('div')
  el.className = 'cw-drag-ghost'
  el.style.setProperty('--cw-ghost-accent', item.accent)

  const head = document.createElement('span')
  head.className = 'cw-drag-ghost-head'

  // The clone gets its critical paint inlined — the ghost lives on
  // document.body, outside #workflow-root's token scope, so it must not
  // depend on any stylesheet reach for the icon to show (Bryan: "the icon
  // is not traveling").
  const realTile = rowEl?.querySelector?.('.cw-tile')
  const tile = realTile ? realTile.cloneNode(true) : document.createElement('span')
  tile.className = 'cw-tile'
  Object.assign(tile.style, {
    background: item.accent,
    width: '24px',
    height: '24px',
    flex: '0 0 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '7px',
    color: '#ffffff',
  })
  head.appendChild(tile)

  const text = document.createElement('span')
  text.className = 'cw-drag-ghost-text'
  const label = document.createElement('span')
  label.className = 'cw-drag-ghost-label'
  label.textContent = item.label
  text.appendChild(label)
  if (item.caption) {
    const cap = document.createElement('span')
    cap.className = 'cw-drag-ghost-caption'
    cap.textContent = item.caption
    text.appendChild(cap)
  }
  head.appendChild(text)
  el.appendChild(head)

  // Chrome refuses to rasterise a fully off-viewport element for
  // setDragImage (the old top:-9999px parking produced a fallback snapshot
  // of just the text). Mount it AT the cursor for the capture frame — the
  // real drag bitmap replaces it before the next paint.
  el.style.left = `${Math.max(0, (event?.clientX ?? 0) - 60)}px`
  el.style.top = `${Math.max(0, (event?.clientY ?? 0) - 26)}px`
  // Mount INSIDE #workflow-root: every .cw-drag-ghost style leans on --cw-*
  // tokens, which are scoped to that root — on document.body they all
  // resolve to nothing and the card renders as a transparent text block
  // (exactly the bug Bryan screenshotted). position:fixed keeps it
  // viewport-anchored regardless of the parent.
  ;(document.getElementById('workflow-root') || document.body).appendChild(el)
  return el
}

// Explicit (not wildcard) icon imports above keep this seam's bundle to only
// the glyphs the palette actually draws. PalettePreview.jsx (LIBRARY PASS)
// mirrors this map with its own explicit imports rather than importing it
// from here — same precedent as BlockPicker.jsx's own icon map — since a
// module-top-level `{...ICONS}` spread across the Palette.jsx <->
// PalettePreview.jsx circular import (Palette.jsx mounts <PalettePreview/>,
// so the edge runs both ways once PalettePreview also imports FROM here)
// would read this binding before it's finished initializing.
const ICONS = {
  Power,
  ClipboardText,
  User,
  Hourglass,
  StopCircle,
  GitBranch,
  ArrowsSplit,
  Repeat,
  ShieldWarning,
  EnvelopeSimple,
  ChatsCircle,
  TextT,
  Image,
  VideoCamera,
  Waveform,
  PresentationChart,
  FileDoc,
  Table,
  Layout,
  // VARIANT STUDIO — GENERATE's palette-row icon.
  Sparkle,
  // COMFY ROUND (CP2, item 1) — NOTE's palette-row icon.
  NotePencil,
  // COMFY ROUND (CP2, item 5) — PARAMS' palette-row icon.
  SlidersHorizontal,
  // WAVE 1 — THE VERB EXPANSION — GATHER/A-B SPLIT's own palette-row icons.
  ArrowsInSimple,
  Percent,
  // WAVE 2 — THE VERB EXPANSION — SOURCE/AUDIENCE/MEASURE's own palette-row
  // icons.
  Database,
  UsersThree,
  Target,
  // WAVE 3 — THE VERB EXPANSION (out-of-seam, minimal fix — see the import
  // list's own comment above).
  Swatches,
  Shuffle,
  Ranking,
  // WAVE 4 — THE VERB EXPANSION — HANDOFF/LOCALIZE/OPTIMIZE/RUN
  // WORKFLOW/GUARDRAIL's own palette-row icons.
  UserSwitch,
  Translate,
  TrendUp,
  FlowArrow,
  ShieldCheck,
}

/* ---------------------------------------------------------------------- */
/* Bookmarks — LIBRARY PASS ("### 1", "BOOKMARKED section pinned at top").  */
/* Session-local module state (same singleton-store shape as               */
/* PalettePreview.jsx's hover controller, just below): any row — including  */
/* TemplateList.jsx's, including a search result's — can read/toggle        */
/* without a context provider, and a page refresh simply re-inits these     */
/* bindings, satisfying "SESSION-LOCAL only" for free (nothing to persist,  */
/* nothing to clear by hand). Two independent sets rather than one keyed by */
/* a compound string: blocks' and templates' id spaces are unrelated, and   */
/* this way neither renderer has to know the other's id shape.              */
/* ---------------------------------------------------------------------- */
let bookmarkedBlocks = new Set()
let bookmarkedTemplates = new Set()
const bookmarkListeners = new Set()
function emitBookmarks() {
  bookmarkListeners.forEach((fn) => fn())
}
function subscribeBookmarks(fn) {
  bookmarkListeners.add(fn)
  return () => bookmarkListeners.delete(fn)
}
export function toggleBlockBookmark(id) {
  const next = new Set(bookmarkedBlocks)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  bookmarkedBlocks = next
  emitBookmarks()
}
export function toggleTemplateBookmark(id) {
  const next = new Set(bookmarkedTemplates)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  bookmarkedTemplates = next
  emitBookmarks()
}
export function useBookmarkedBlockIds() {
  return useSyncExternalStore(subscribeBookmarks, () => bookmarkedBlocks)
}
export function useBookmarkedTemplateIds() {
  return useSyncExternalStore(subscribeBookmarks, () => bookmarkedTemplates)
}

// Hover-reveal flag (BookmarkSimple 12) — "hover any block/template row ->
// a small bookmark flag... fades in right-aligned; click toggles" (PLAN.md).
// Reveal itself is pure CSS (:hover opacity, app.css), matching this file's
// established E1/PALETTE HOVER PHASE convention of CSS-only row affordances
// rather than JS hover state. `draggable={false}` + stopping the row's own
// native drag at mousedown is what keeps pressing THIS button from also
// starting the row's drag-out gesture; stopPropagation on click keeps it
// from also click-inserting the block/template underneath it.
export function BookmarkFlag({ active, onToggle, label }) {
  return (
    <button
      type="button"
      className={`cw-bookmark-flag${active ? ' is-active' : ''}`}
      aria-pressed={active}
      aria-label={active ? `Remove ${label} from bookmarks` : `Bookmark ${label}`}
      draggable={false}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation()
        e.preventDefault()
        onToggle()
      }}
    >
      <BookmarkSimple size={12} weight={active ? 'fill' : 'regular'} />
    </button>
  )
}

function PaletteRow({ item, singleLine, rowIndex }) {
  const { addNodeFromPalette, nodes } = useFlowState()
  const Icon = ICONS[item.icon]
  const disabled = false // multi-trigger is legal (Bryan, 2026-08-12)
  const bookmarked = useBookmarkedBlockIds().has(item.id)
  const previewKey = `block:${item.id}`

  const handleDragStart = (event) => {
    previewCloseNow()
    event.dataTransfer.setData('application/reactflow', JSON.stringify(item))
    // Belt-and-braces: some drag paths only surface text/plain on drop.
    event.dataTransfer.setData('text/plain', JSON.stringify(item))
    event.dataTransfer.effectAllowed = 'move'
    if (EMPTY_DRAG_IMG) event.dataTransfer.setDragImage(EMPTY_DRAG_IMG, 0, 0)
    const ghost = buildDragGhost(item, event.currentTarget, event)
    attachManualDragGhost(ghost, 60, 26, event.currentTarget)
    // Dim the source row while its block is in flight — the row staying
    // fully lit while "its" card travels read as a glitch (Bryan).
    const row = event.currentTarget
    row.classList.add('is-drag-source')
    row.addEventListener('dragend', () => row.classList.remove('is-drag-source'), { once: true })
  }

  return (
    // A <button> cannot initiate a native HTML5 drag in Chrome — mousedown on
    // a form control is claimed as a click gesture, so `dragstart` never fires
    // and draggable={true} is silently inert. Divs drag correctly; role +
    // tabIndex + key handling keep it a real button for keyboard/AT.
    <div
      role="button"
      tabIndex={0}
      className={`cw-palette-row${singleLine ? ' is-single' : ''}${disabled ? ' is-disabled' : ''}`}
      // LIBRARY PASS — rows nested inside a <Folder> no longer sit at a
      // fixed nth-child position app.css's swap-cascade rules can read (they
      // live inside the folder's Reveal wrapper now), so the row's own
      // stagger index rides in directly, same idea as each section's `--i`
      // above it. Search's flat rendering doesn't pass this — those rows
      // keep resolving `--r` from the existing nth-child ladder (app.css),
      // untouched.
      style={rowIndex != null ? { '--r': rowIndex } : undefined}
      draggable={!disabled}
      aria-disabled={disabled || undefined}
      onDragStart={disabled ? undefined : handleDragStart}
      onClick={disabled ? undefined : () => addNodeFromPalette(item)}
      onKeyDown={(e) => {
        if (disabled) return
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          addNodeFromPalette(item)
        }
      }}
      // LIBRARY PASS ("### 2 — Hover preview") — shared hover-intent timer,
      // not local state: PalettePreview.jsx owns the 320ms open-delay/150ms
      // close-grace/re-anchor logic so walking rows never flickers.
      onMouseEnter={(e) => previewHoverStart('block', item, previewKey, e.currentTarget.getBoundingClientRect())}
      onMouseLeave={() => previewHoverEnd(previewKey)}
    >
      <span className="cw-tile" style={{ background: item.accent }}>
        {/* E1 item 2 — tiles shrank 28->24px; glyph follows, 17->16. */}
        {Icon ? <Icon size={16} weight="regular" /> : null}
      </span>
      <span className="cw-row-text">
        <span className="cw-row-label">{item.label}</span>
        {!singleLine && item.caption ? (
          <span className="cw-row-caption">{disabled ? 'Already on the canvas' : item.caption}</span>
        ) : null}
      </span>
      <BookmarkFlag active={bookmarked} onToggle={() => toggleBlockBookmark(item.id)} label={item.label} />
    </div>
  )
}

// TEMPLATES PHASE (TP1) — Blocks|Templates switch, sitting just under the
// ANDREW ROUND search field (Palette() renders search first, this second)
// inside .cw-palette-inner, so both still fade/slide with the rest of the
// panel's content on collapse. Same sliding-thumb technique as
// nodes/shared.jsx's <Segmented> (nodes.css's .cw-segmented) — reimplemented
// locally with palette-scoped class names (app.css) instead of imported,
// since nodes.css/shared.jsx belong to another seam.
function PaletteSwitch({ mode, onChange, dimmed }) {
  const options = [
    { value: 'blocks', label: 'Blocks' },
    { value: 'templates', label: 'Templates' },
    // FILES TAB item 1 — "a plain third segment" (the ONE-WAY door rule
    // that gates other new UI behind a hidden switcher explicitly does NOT
    // apply here, per the plan — this is real, visible UI). The thumb-width
    // formula below (.cw-palette-switch-thumb, app.css) already reads
    // `--cw-seg-n` from `options.length`, so a third segment costs nothing
    // there.
    { value: 'files', label: 'Files' },
  ]
  const activeIndex = Math.max(0, options.findIndex((opt) => opt.value === mode))
  return (
    <div
      className={`cw-palette-switch${dimmed ? ' is-dimmed' : ''}`}
      role="radiogroup"
      aria-label="Palette content"
      style={{ '--cw-seg-n': options.length, '--cw-seg-i': activeIndex }}
    >
      <span className="cw-palette-switch-thumb" aria-hidden="true" />
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="radio"
          aria-checked={mode === opt.value}
          className={`cw-palette-switch-btn${mode === opt.value ? ' is-active' : ''}`}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

// PALETTE TYPE-AHEAD ROUND (PLAN.md "### A — PALETTE TYPE-AHEAD") — comment on
// the live build: "need a type ahead search for these tabs." A live query
// searches BOTH tabs at once, independent of whichever one is active —
// case-insensitive substring over each block's label+caption and each
// template's name+blurb — grouped ACTIONS / LOGIC / OUTPUTS / TEMPLATES
// (PALETTE_SECTIONS is already in that order; Templates is appended last).
// Shape matches what Palette()'s render loop already reads off
// PALETTE_SECTIONS (`{id, label, singleLine, items}`), so rendering search
// results is the same map, just over a different source array.
function searchPalette(query) {
  const q = query.toLowerCase()
  const hit = (...fields) => fields.some((f) => f && f.toLowerCase().includes(q))

  const blockGroups = PALETTE_SECTIONS.map((section) => ({
    id: section.id,
    label: section.label,
    singleLine: section.singleLine,
    items: section.items.filter((item) => hit(item.label, item.caption)),
  })).filter((section) => section.items.length > 0)

  const templateHits = TEMPLATES.filter((tpl) => hit(tpl.name, tpl.blurb))

  return templateHits.length
    ? [...blockGroups, { id: 'templates', label: 'TEMPLATES', items: templateHits }]
    : blockGroups
}

// The quiet search field pinned above the switch (Palette() renders it as
// .cw-palette-inner's first child — see that component below). A plain
// controlled input, not a <form>: nothing here should ever submit/reload.
function PaletteSearch({ value, onChange }) {
  const inputRef = useRef(null)
  return (
    <div className="cw-palette-search">
      <MagnifyingGlass size={13} weight="regular" className="cw-palette-search-icon" aria-hidden="true" />
      <input
        ref={inputRef}
        type="text"
        // FILES TAB item 1 — spec allows keeping this generic rather than
        // literally naming all three tabs: "Search blocks, templates,
        // files..." clips mid-word at this field's width (ends up reading
        // as a stray period, not an ellipsis) since it runs 4 characters
        // longer than the original — kept as-is rather than trading a
        // legible placeholder for a technically-more-complete one.
        className="cw-palette-search-input"
        placeholder="Search blocks and templates..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          // First Escape clears the query; only once it's already empty does
          // the key fall through to the shell's own overlay-close listener
          // (index.html, document-level) — stopPropagation is what keeps a
          // "just clear my search" Escape from also dumping the user out of
          // the builder.
          if (e.key === 'Escape' && value) {
            e.preventDefault()
            e.stopPropagation()
            onChange('')
          }
        }}
        aria-label="Search blocks, templates, and files"
      />
      {value ? (
        <button
          type="button"
          className="cw-palette-search-clear"
          aria-label="Clear search"
          onClick={() => {
            onChange('')
            inputRef.current?.focus()
          }}
        >
          {/* Drawn, not Phosphor's X — same hand-built-SVG convention as the
              panel's own collapse chevron further down this file. */}
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
        </button>
      ) : null}
    </div>
  )
}

/* ==========================================================================
   LIBRARY PASS ("### 1 — Folder tree"). Bryan, on Comfy's node library:
   "can we do the thing that comfy does where your nodes can be nested in
   folder." <Folder> is the one collapsible-section primitive both this
   file's Blocks tab AND TemplateList.jsx's category groups render through
   (exported — TemplateList.jsx already imports attachManualDragGhost from
   this file, so importing Folder too follows the same established
   direction, not a new cycle). Collapse state itself is NOT owned here —
   callers pass `collapsed`/`onToggle` so one Set (Palette.jsx's own
   `collapsedIds` state, below) covers every folder id across BOTH tabs
   without either tab needing to know about the other's.
   ========================================================================== */

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

// Reveal-style grid-rows collapse (nodes/Reveal.jsx's own header comment
// explains the mechanism this reuses: a single `fr` track animates to an
// UNKNOWN height with zero JS measurement). Written fresh rather than
// imported — Reveal.jsx pulls in `useNodeId`/`useUpdateNodeInternals` from
// ReactFlow for its own node-card handle bookkeeping, neither of which
// means anything for a palette folder, and it lives in seam C's read-only
// file grant for this pass regardless. No "settled" unclamp layer either
// (nodes.css's own reason for that third layer was letting a node's
// handles hang past the card edge once open — nothing in a folder ever
// needs to paint outside its own box), so this is the plain 2-transition
// version of the same idea.
function FolderReveal({ open, children }) {
  const [mounted, setMounted] = useState(open)
  const timerRef = useRef(null)

  useEffect(() => {
    if (open) {
      clearTimeout(timerRef.current)
      setMounted(true)
      return undefined
    }
    if (prefersReducedMotion()) {
      setMounted(false)
      return undefined
    }
    timerRef.current = setTimeout(() => setMounted(false), 340)
    return () => clearTimeout(timerRef.current)
  }, [open])

  return (
    <div className={`cw-folder-body${open ? ' is-open' : ''}`}>
      <div className="cw-folder-body-inner">
        {mounted ? <div className={`cw-folder-body-content${open ? ' is-open' : ''}`}>{children}</div> : null}
      </div>
    </div>
  )
}

// `index` seeds the swap-cascade's `--r` stagger (app.css "Palette tab
// swap") the same way each row already does — set inline here rather than
// via CSS nth-child so nesting (OUTPUTS' sub-folders, OptionsEditor-style)
// doesn't need a second hand-maintained selector ladder.
export function Folder({ id, label, depth = 0, collapsed, onToggle, index, children }) {
  return (
    <div className={`cw-folder${depth ? ' cw-folder--sub' : ''}`}>
      <button
        type="button"
        className="cw-folder-head"
        style={{ '--r': index }}
        aria-expanded={!collapsed}
        onClick={() => onToggle(id)}
      >
        <CaretRight size={10} weight="bold" className={`cw-folder-chevron${collapsed ? '' : ' is-open'}`} aria-hidden="true" />
        <span className="cw-section-label cw-folder-label">{label}</span>
      </button>
      <FolderReveal open={!collapsed}>{children}</FolderReveal>
    </div>
  )
}

// CANVAS TABS PHASE item 1 — the footer explainer that used to close this
// nav is gone; its copy now lives verbatim in FlowCanvas.jsx's zero-node
// instructions card (canvas_2's bare-canvas state) instead of running
// permanently under the palette on every tab.
// Hide/reveal (Bryan): the whole panel collapses to a slim white strip. The
// grid column responds in app.css via `.cw-body:has(.cw-palette.is-collapsed)`
// driving --cw-palette-w, so the canvas (and anything anchored on the var)
// glides with one shared transition. The collapse control is structural —
// a chevron in the panel's own header row, and the collapsed strip itself
// is one big reveal button.
// Eased wheel scrolling (Bryan: "the smooth scrolling vertical effect") —
// CSS scroll-behavior only smooths programmatic scrolls; wheel input still
// jumps in steps. This accumulates wheel deltas into a target and lerps the
// scroller toward it each frame — the palette equivalent of the canvas's
// inertial glide. Reduced-motion users keep native scrolling untouched.
function useGlideScroll(ref) {
  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined

    let target = el.scrollTop
    let raf = null

    // CSS scroll-behavior:smooth would re-animate every per-frame write below
    // (double smoothing — the "way too slow" bug). The lerp IS the smoothing;
    // programmatic writes must land instantly.
    const prevBehavior = el.style.scrollBehavior
    el.style.scrollBehavior = 'auto'

    const step = () => {
      raf = null
      const max = el.scrollHeight - el.clientHeight
      target = Math.max(0, Math.min(target, max))
      const delta = target - el.scrollTop
      if (Math.abs(delta) < 0.5) {
        el.scrollTop = target
        return
      }
      el.scrollTop += delta * 0.3
      raf = requestAnimationFrame(step)
    }

    const onWheel = (e) => {
      // Only vertical intent; let horizontal or zoom gestures through.
      if (e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return
      e.preventDefault()
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? el.clientHeight : 1
      target = Math.max(0, Math.min(target + e.deltaY * unit, el.scrollHeight - el.clientHeight))
      if (raf == null) raf = requestAnimationFrame(step)
    }

    // Direct interactions re-sync the target so the lerp never fights them.
    const resync = () => {
      target = el.scrollTop
    }

    // ...and so does any change to what's IN the panel. Blocks and Templates
    // are wildly different heights, so switching tabs re-clamps scrollTop
    // while `target` keeps the old, taller list's number — and the next wheel
    // resolves against a position the panel isn't at any more, which reads as
    // "the scroll is broken / the glide is gone" (Bryan, on Templates).
    // Clicking the Blocks|Templates switch happened to paper over this (it's
    // inside the scroller, so it fires the pointerdown resync above), but the
    // instructions card switches tabs through the `cw:palette-mode` event
    // with no pointer anywhere near the panel — that path had nothing to
    // resync it. Watching the content box covers every route in and out.
    const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(resync) : null
    if (ro && el.firstElementChild) ro.observe(el.firstElementChild)

    el.addEventListener('wheel', onWheel, { passive: false })
    el.addEventListener('pointerdown', resync)
    el.addEventListener('keydown', resync)
    return () => {
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('pointerdown', resync)
      el.removeEventListener('keydown', resync)
      ro?.disconnect()
      if (raf != null) cancelAnimationFrame(raf)
      el.style.scrollBehavior = prevBehavior
    }
  }, [ref])
}

// LIBRARY PASS ("### 1 — Folder tree", Blocks tab) — builds the flat
// BOOKMARKED section (hidden entirely when empty, per spec) and renders
// PALETTE_SECTIONS through <Folder>, OUTPUTS' `children` becoming real
// nested sub-folders (Documents/Media/Data). `r` is a closure counter
// shared across the WHOLE tree — not per-section — so the swap-cascade's
// stagger still reads as one continuous sweep top to bottom regardless of
// nesting depth, the same effect the old nth-child ladder produced for a
// flat list.
function BlocksFolderTree({ collapsedIds, onToggleFolder }) {
  const bookmarkedIds = useBookmarkedBlockIds()
  const bookmarkedSection = bookmarkedIds.size
    ? {
        id: 'bookmarked-blocks',
        label: 'BOOKMARKED',
        items: PALETTE_SECTIONS.flatMap((s) => s.items).filter((item) => bookmarkedIds.has(item.id)),
      }
    : null
  const sections = bookmarkedSection ? [bookmarkedSection, ...PALETTE_SECTIONS] : PALETTE_SECTIONS

  let r = 0
  return sections.map((section, i) => (
    <div key={section.id} className="cw-palette-section" style={{ '--i': i }}>
      <Folder
        id={section.id}
        label={section.label}
        collapsed={collapsedIds.has(section.id)}
        onToggle={onToggleFolder}
        index={r++}
      >
        {section.children
          ? section.children.map((sub) => (
              <Folder
                key={sub.id}
                id={sub.id}
                label={sub.label}
                depth={1}
                collapsed={collapsedIds.has(sub.id)}
                onToggle={onToggleFolder}
                index={r++}
              >
                {sub.items.map((item) => (
                  <PaletteRow key={item.id} item={item} singleLine={section.singleLine} rowIndex={r++} />
                ))}
              </Folder>
            ))
          : section.items.map((item) => (
              <PaletteRow key={item.id} item={item} singleLine={section.singleLine} rowIndex={r++} />
            ))}
      </Folder>
    </div>
  ))
}

/* ==========================================================================
   FILES TAB, redefined (Bryan: "i think files was supposed to be for files
   added to the canvas not recent projects") — the tab now lists the FILES
   ON THIS CANVAS: everything attached through the chat composer's + menu
   (run assets and real external uploads, data/canvasFiles.js), newest
   first, with the session's own Save-panel saves in a quiet second section
   below. The 13-row seeded "past projects" fixture is gone entirely.
   ========================================================================== */

// A couple of seeded files land on exactly 1 deliverable (a single approval
// gate, a single landscape report) — "1 deliverables" would read as a typo
// on an otherwise real-work-voiced list, so the count agrees with its noun.
function countLabel(n, noun) {
  return `${n} ${noun}${n === 1 ? '' : 's'}`
}

// One row per past project. Reuses .cw-palette-row wholesale — "Hover state
// = the palette's existing row hover family" (spec item 3) — and only adds
// what's files-specific: a single consistent glyph tile (never kind-
// colored, unlike a block's) and a mono meta line under the name instead of
// a caption or trailing size chip.
//
// SAVED FILES REOPEN (PLAN.md "## SAVED FILES REOPEN") — click now branches
// on which kind of row this is: a SEEDED row (file.templateId, no snapshot)
// keeps insertTemplate verbatim, the exact path TemplateRow's own click
// handler uses ("opening a past project" really does land a real graph,
// FILES TAB spec item 4); a RUNTIME row (files.js's addRuntimeFile captured
// a live-canvas snapshot at save time) routes to insertSnapshot instead —
// "runtime rows (snapshot present) route to insertSnapshot; seeded rows keep
// insertTemplate unchanged" (PLAN.md, literal). `file.snapshot` is the one
// signal that tells the two apart; a runtime row from BEFORE this phase
// (shouldn't exist in practice, but matches files.js's own optional-nodes/
// edges posture) has neither and safely no-ops, same as the old bare
// insertTemplate(undefined) did.
function FileRow({ file, tpl }) {
  const { insertTemplate, insertSnapshot } = useFlowState()
  const previewKey = `file:${file.id}`
  const open = () => {
    if (file.snapshot) insertSnapshot(file.snapshot)
    else insertTemplate(file.templateId)
  }

  return (
    <div
      role="button"
      tabIndex={0}
      className="cw-palette-row cw-file-row"
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          open()
        }
      }}
      // Spec item 3: "if cheap, reuse the Templates tab's hover-preview
      // machinery pointed at the mapped template." previewHoverStart's
      // 'template' branch (PalettePreview.jsx) already renders straight off
      // a real TEMPLATES entry (calls tpl.build() itself) — pointing it at
      // the file's mapped template needs no change over there at all.
      // SAVED FILES REOPEN — "hover preview for runtime rows: skip silently
      // (no template to preview)": a runtime row's `tpl` prop is already
      // undefined (FilesList below looks it up by `file.templateId`, which a
      // runtime row never has), so this `tpl &&` guard already covers it —
      // no separate branch needed.
      onMouseEnter={(e) => tpl && previewHoverStart('template', tpl, previewKey, e.currentTarget.getBoundingClientRect())}
      onMouseLeave={() => previewHoverEnd(previewKey)}
    >
      <span className="cw-tile cw-file-tile">
        <TreeStructure size={15} weight="regular" />
      </span>
      <span className="cw-row-text">
        <span className="cw-row-label">{file.name}</span>
        {/* SIMPLIFIED META (Bryan: "can you simplify this in files tab" on
            the old "9 nodes · 6 deliverables" / "Aug 18" two-liner) — ONE
            short line, node count + date; the deliverables count (always
            illustrative, data/files.js) is gone, which also retires the
            two-sub-line wrap workaround the long "deliverables" word used
            to force. */}
        <span className="cw-row-caption cw-file-meta">
          {countLabel(file.meta.nodes, 'node')} · {file.meta.saved}
        </span>
      </span>
    </div>
  )
}

// One canvas file's display label — derived locally from the stored
// attachment (canvasFiles.js keeps it verbatim), matching the attach
// popover's own row language for run assets ("01 · Graphic") and the
// file's real name for uploads.
export function canvasFileLabel(att) {
  if (att.kind === 'run') return `${String(att.number).padStart(2, '0')} · ${att.format}${att.isBatch ? ' batch' : ''}`
  return att.name || att.subKind
}

// One row per file on the canvas. Reuses the .cw-palette-row / file-tile
// anatomy wholesale; INERT by design — this is a record of what's been
// added, not a control (nothing sensible to insert/open from here yet).
// An image with real pixels (an uploaded image's object-URL, a run asset's
// photo) shows them as the tile; everything else keeps a quiet glyph.
function CanvasFileRow({ entry }) {
  const att = entry.attachment
  const hasThumb = !!att.imageUrl
  const Icon = att.kind === 'run' || att.subKind === 'Image' ? Image : FileDoc
  return (
    <div className="cw-palette-row cw-file-row cw-canvasfile-row">
      <span className="cw-tile cw-file-tile">
        {hasThumb ? <img src={att.imageUrl} alt="" className="cw-file-thumb-img" /> : <Icon size={15} weight="regular" />}
      </span>
      <span className="cw-row-text">
        <span className="cw-row-label">{canvasFileLabel(att)}</span>
        <span className="cw-row-caption cw-file-meta">
          {att.kind === 'run' ? 'Run asset' : att.subKind === 'Image' ? 'Image upload' : 'File upload'}
        </span>
      </span>
    </div>
  )
}

// Flat sections, no folders — same bare `.cw-palette-section` +
// `.cw-section-label` shape the cross-tab search branch below already uses,
// which is what lets these rows pick up the swap cascade's nth-child `--r`
// stagger (app.css "Palette tab swap") for free. Canvas files first (the
// tab's identity now), the session's saved workflows below; either section
// hides entirely when empty, and a canvas with neither shows one quiet
// empty-state line instead of a dead header.
function FilesList({ canvasFiles, savedFiles, query }) {
  if (canvasFiles.length === 0 && savedFiles.length === 0) {
    return (
      <p className="cw-palette-empty">
        {query ? `No matches for "${query}"` : 'Files you add to the canvas will show up here.'}
      </p>
    )
  }
  return (
    <>
      {canvasFiles.length > 0 && (
        <div className="cw-palette-section" style={{ '--i': 0 }}>
          <div className="cw-section-label">On this canvas</div>
          {canvasFiles.map((entry) => (
            <CanvasFileRow key={entry.id} entry={entry} />
          ))}
        </div>
      )}
      {savedFiles.length > 0 && (
        <div className="cw-palette-section" style={{ '--i': canvasFiles.length > 0 ? 1 : 0 }}>
          <div className="cw-section-label">Saved workflows</div>
          {savedFiles.map((file) => (
            <FileRow key={file.id} file={file} tpl={TEMPLATES.find((t) => t.id === file.templateId)} />
          ))}
        </div>
      )}
    </>
  )
}

export default function Palette() {
  const [collapsed, setCollapsed] = useState(false)
  // TEMPLATES PHASE (TP1) — local, defaults to Blocks (PLAN.md item 1).
  const [mode, setMode] = useState('blocks')
  const [pulse, setPulse] = useState(false)
  // ANDREW ROUND — search is orthogonal to `mode`: it never mutates which
  // tab is "active," it just temporarily replaces what's rendered, so
  // clearing the query always hands back the exact tab that was showing.
  const [query, setQuery] = useState('')
  // LIBRARY PASS — one Set of collapsed folder ids covers BOTH tabs (Blocks'
  // section/sub-folder ids and Templates' category names never collide) and
  // either tab's BOOKMARKED folder. `query` never touches this — search
  // renders its own flat branch below with no folder chrome to collapse at
  // all — so it survives a search open/close untouched, which is what
  // PLAN.md's "clearing restores the user's collapse states" asks for.
  const [collapsedIds, setCollapsedIds] = useState(() => new Set())
  const scrollerRef = useRef(null)
  useGlideScroll(scrollerRef)

  const toggleFolder = (id) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const trimmedQuery = query.trim()
  const isSearching = trimmedQuery.length > 0
  // FILES TAB item 1 — "the search filters file rows by name when Files is
  // active": a plain in-tab narrowing, distinct from Blocks/Templates'
  // existing cross-tab merged search (searchPalette, below) which stays
  // byte-identical for those two tabs — this branch only ever engages when
  // Files is the active mode, so `results`/searchPalette's own behavior for
  // Blocks/Templates never sees it.
  const isFilesSearch = isSearching && mode === 'files'
  const results = isSearching && !isFilesSearch ? searchPalette(trimmedQuery) : null
  // FILES ON THE CANVAS — both session stores, each narrowed by the same
  // in-tab name filter while a Files-scoped query is live.
  const savedFiles = useSavedFiles()
  const canvasFiles = useCanvasFiles()
  const q = trimmedQuery.toLowerCase()
  const visibleSavedFiles = isFilesSearch ? savedFiles.filter((f) => f.name.toLowerCase().includes(q)) : savedFiles
  const visibleCanvasFiles = isFilesSearch
    ? canvasFiles.filter((entry) => canvasFileLabel(entry.attachment).toLowerCase().includes(q))
    : canvasFiles

  // The manifest card's footer doors drive the palette here: switch mode,
  // un-collapse if hidden, and pulse briefly so the eye lands on it.
  React.useEffect(() => {
    const onMode = (e) => {
      const next = e.detail?.mode
      if (next !== 'blocks' && next !== 'templates') return
      setMode(next)
      setCollapsed(false)
      setPulse(true)
      setTimeout(() => setPulse(false), 900)
    }
    window.addEventListener('cw:palette-mode', onMode)
    return () => window.removeEventListener('cw:palette-mode', onMode)
  }, [])

  return (
    <>
    <nav
      ref={scrollerRef}
      className={`cw-palette${collapsed ? ' is-collapsed' : ''}${pulse ? ' is-pulsing' : ''}`}
      aria-label="Block palette"
      // LIBRARY PASS ("### 2 — Hover preview") — "leaves on... palette-leave
      // ... scroll." This <nav> IS the scroller (.cw-palette's own
      // overflow-y:auto, app.css) so onScroll needs no bubbling trick.
      onMouseLeave={() => previewCloseNow()}
      onScroll={() => previewCloseNow()}
    >
      <div className="cw-palette-inner" aria-hidden={collapsed}>
        {/* Switch first, search under it (Bryan) — the tabs are the primary
            choice and search narrows whatever you're looking at, so it reads
            top-down as pick-then-filter. */}
        {/* Files' own scoped filter leaves the switch undimmed — unlike the
            cross-tab search below, it never stops meaning "you're looking
            at Files, narrowed," so there's nothing to visually disclaim. */}
        <PaletteSwitch mode={mode} onChange={setMode} dimmed={isSearching && !isFilesSearch} />
        <PaletteSearch value={query} onChange={setQuery} />
        {isSearching && !isFilesSearch ? (
          // ANDREW ROUND — search results replace both tabs' content while a
          // query is live. Keyed on the query itself so the SAME swap
          // cascade below replays every keystroke, exactly like switching
          // Blocks<->Templates does (app.css "Palette tab swap"); rows are
          // the live PaletteRow/TemplateRow, never copies, so drag/click
          // insert keep working unchanged inside results. FILES TAB — this
          // branch never engages while Files is active (isFilesSearch routes
          // there instead, below), so Blocks/Templates keep this exact,
          // untouched behavior.
          <div key={`search:${trimmedQuery}`} className="cw-palette-swap cw-palette-swap--search">
            {results.length ? (
              results.map((section, i) => (
                <div key={section.id} className="cw-palette-section" style={{ '--i': i }}>
                  <div className="cw-section-label">{section.label}</div>
                  {section.id === 'templates'
                    ? section.items.map((tpl) => <TemplateRow key={tpl.id} tpl={tpl} />)
                    : section.items.map((item) => (
                        <PaletteRow key={item.id} item={item} singleLine={section.singleLine} />
                      ))}
                </div>
              ))
            ) : (
              <p className="cw-palette-empty">No matches for "{trimmedQuery}"</p>
            )}
          </div>
        ) : (
          /* Tab swap build-in (Bryan) — `key={mode}` remounts the list on every
             switch so the CSS cascade in app.css replays instead of the two
             lists hard-cutting. The direction is spatial rather than
             history-based: Templates is the RIGHT tab so its list always
             enters from the right, Blocks always from the left, whichever way
             you came. Sections carry their index as `--i`; the rows read it
             plus their own `--r` to cascade — LIBRARY PASS moved `--r` from
             CSS nth-child (still there, unchanged, for search's own flat
             branch above) to an inline value BlocksFolderTree/TemplateList
             set directly, since a folder's rows no longer sit at a fixed
             nth-child position once they're behind a collapsible Reveal.
             FILES TAB — Files' flat rendering (FilesList) is a bare
             `.cw-palette-section`, same shape as search's own flat branch
             above, so its rows pick up the nth-child `--r` stagger for free.
             A live Files-scoped query re-keys this div (`files-search:...`)
             so the cascade replays per keystroke exactly like the cross-tab
             search branch does — the same entrance, just narrower content. */
          <div
            key={isFilesSearch ? `files-search:${trimmedQuery}` : mode}
            className={`cw-palette-swap cw-palette-swap--${isFilesSearch ? 'files' : mode}`}
          >
            {mode === 'blocks' ? (
              <BlocksFolderTree collapsedIds={collapsedIds} onToggleFolder={toggleFolder} />
            ) : mode === 'templates' ? (
              <>
                <button type="button" className="cw-palette-browse-all" onClick={() => openBrowser('templates')}>
                  Browse all
                  <ArrowUpRight size={11} weight="bold" />
                </button>
                <TemplateList collapsedIds={collapsedIds} onToggleFolder={toggleFolder} />
              </>
            ) : (
              <FilesList
                canvasFiles={visibleCanvasFiles}
                savedFiles={visibleSavedFiles}
                query={isFilesSearch ? trimmedQuery : ''}
              />
            )}
          </div>
        )}
      </div>

    </nav>

      {/* LIBRARY PASS ("### 2 — Hover preview") — mounted once; portals its
          own card to #workflow-root and stays invisible (renders null) until
          some row's hover-intent timer actually opens it. */}
      <PalettePreview />

      {/* Collapse control — the shell's own rail-handle pill, straddling the
          panel's hairline in BOTH states. Portaled to #workflow-root because
          .cw-app clips overflow — inside it, a straddling pill loses its
          outer half at the boundary. */}
      {createPortal(
      <button
        type="button"
        className="cw-panel-handle cw-panel-handle--left"
        aria-label={collapsed ? 'Show blocks' : 'Hide blocks'}
        aria-expanded={!collapsed}
        title={collapsed ? 'Show blocks' : 'Hide blocks'}
        onClick={() => setCollapsed((v) => !v)}
      >
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>,
      document.getElementById('workflow-root'),
      )}
    </>
  )
}
