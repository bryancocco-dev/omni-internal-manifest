// GHOST + PICKER (PLAN.md "## GHOST + PICKER — the node-side + opens a block
// picker"). Bryan: the + off a node "always makes a task/action node" ->
// approved swapping that for a real picker: "do it."
//
// FlowCanvas.jsx owns WHETHER a picker is open and WHICH node/side it's for
// (it's the thing that also has to dispatch the eventual cw:add-from); this
// component only owns the popover itself — where it sits on screen, and the
// two ways it dismisses without picking anything (outside click, Esc). Rows
// come straight from data/blocks.js's PALETTE_SECTIONS — the SAME source of
// truth the real palette renders from — with Trigger filtered out: a
// mid-flow trigger from a node's + makes no sense, so it stays a
// palette-only block on both the left and right side of this menu.
//
// Portaled to #workflow-root rather than nested under the clicked node, for
// the exact reason RunPreview.jsx and CommentsLayer.jsx's thread card
// already are (see either file's own header comment): anything inside
// React Flow's pan/zoom transform sits under .cw-app's overflow:hidden clip
// and below .react-flow__panel's z-index, so a popover opened near an edge
// of the canvas would get clipped or buried under Controls/MiniMap. Screen
// position is computed once from the ghost +'s own getBoundingClientRect
// (handed in by shared.jsx's dispatchAddPicker via FlowCanvas.jsx), the same
// "compute in the render body" approach CommentsLayer's CardPortal already
// uses for its flowToScreenPosition call — no measure-then-reposition effect
// needed since this popover's footprint is fixed (width + max-height below
// are both constants, never content-measured).
//
// COMFY ROUND (CP0 + CP0+, PLAN.md "## COMFY ROUND" -> "### CP0"/"### CP0+").
// FlowCanvas.jsx now opens this same popover from THREE places (a node's
// ghost +, an edge's wire +, and CP0+'s drag-to-empty-pane gesture) — this
// component itself only grew what CP0+ actually asked for:
//   1. a type-ahead search field, always present ("every picker entry point
//      gets this for free"), reusing the palette search's own predicate
//      (see filterSections below — Palette.jsx's searchPalette isn't
//      exported and pulls in TEMPLATES this popover never offers, so this is
//      the SAME "duplicate the algorithm, not import it" convention
//      OmniEdge.jsx's EDGE_KIND_COLORS/this file's own PICKER_SECTIONS
//      already use for cross-seam reuse without a cross-seam import);
//   2. `connectionFilter="feed"` — the wire-drop gesture's dragged-from-an-
//      in-port variant, which additionally hides blocks with no plain 'out'
//      handle by default (see NO_DEFAULT_OUT below);
//   3. `fromLabel` — the small mono "FROM 02 · out" head chip identifying
//      the dragged port, wire-drop only;
//   4. arrow-key/Enter navigation over whatever's currently visible.
// FlowCanvas.jsx keys this component fresh on every distinct picker-open
// (pickerKeyOf), so all of the state below can just initialize once and
// never has to reset itself mid-life for a different opener.

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
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
  Sparkle,
  MagnifyingGlass,
  // WAVE 2 — THE VERB EXPANSION. Measure's picker-row icon — the ONLY new
  // Wave-2 icon this file needs: Source/Audience are excluded from the
  // picker entirely (see PICKER_SECTIONS' own item-id filter below), same
  // footing as trigger/params, so their icons would never be looked up here.
  Target,
  // WAVE 3 — THE VERB EXPANSION (out-of-seam, minimal fix: Remix/Compare's
  // own picker-row icons — both are legal picker offerings, Compare has a
  // real default 'out' per NO_DEFAULT_OUT's own comment above — but this
  // file's icon map never picked up either import, so both rendered a blank
  // tile in this popover; closed incidentally while adding Wave 4's own
  // icons just below, same file/same map).
  Shuffle,
  Ranking,
  // WAVE 4 — THE VERB EXPANSION. Handoff/Localize/Optimize/Run
  // workflow/Guardrail's own picker-row icons.
  UserSwitch,
  Translate,
  TrendUp,
  FlowArrow,
  ShieldCheck,
} from '@phosphor-icons/react'

import { PALETTE_SECTIONS } from '../data/blocks.js'

// Explicit imports (mirrors Palette.jsx's own ICONS map) — Power/Trigger's
// icon is deliberately absent, since PICKER_SECTIONS below never renders it.
const ICONS = {
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
  // VARIANT STUDIO — GENERATE's picker-row icon.
  Sparkle,
  // WAVE 2 — THE VERB EXPANSION — Measure's picker-row icon.
  Target,
  // WAVE 3 — THE VERB EXPANSION (out-of-seam, minimal fix — see the import
  // list's own comment above).
  Shuffle,
  Ranking,
  // WAVE 4 — THE VERB EXPANSION.
  UserSwitch,
  Translate,
  TrendUp,
  FlowArrow,
  ShieldCheck,
}

// "skip the Trigger item ... keep Trigger OUT of the picker entirely on
// both sides" (PLAN.md) — computed once at module scope since
// PALETTE_SECTIONS is static; the ACTIONS section is the only one that ever
// carries it. COMFY ROUND (CP2, item 1) — the whole ANNOTATE section is
// excluded too, same reasoning: this popover only ever offers blocks that
// can be WIRED into the splice it's completing, and a note has no handles
// at all to wire. COMFY ROUND (CP2, item 5) — 'params' joins the item-level
// exclusion alongside 'trigger': it has an out-port but NO in-port (same
// shape as Trigger), and the RIGHT-side splice path always wires
// `existing.out -> newNode.in` unconditionally (no defaultSourceHandle-style
// guard exists for the TARGET side) — picking Params there would mint an
// edge into a handle that's never rendered, the exact silently-dead-edge bug
// the CP0 comment elsewhere in this app describes for the opposite
// direction. Simplest correct fix, matching Trigger's own precedent: keep
// it palette-only rather than build asymmetric per-side filtering here.
// WAVE 1 — THE VERB EXPANSION (out-of-seam, minimal fix): 'params' MOVED out
// of the 'actions' section into its own new 'sources' section this wave
// (data/blocks.js taxonomy pass) — gating this exclusion on `section.id ===
// 'actions'` would have silently stopped catching it, letting it back into
// this picker (the exact silently-dead-edge bug this whole filter exists to
// prevent — see the comment above). Applying the id-level filter to EVERY
// section instead of just one is a harmless no-op wherever neither id is
// present, and keeps today's exact exclusion behavior intact regardless of
// which section either one lives in from here on. The new 'sources'
// section carries ONLY params today, so filtering IT out entirely empties
// the section — CDP-verified: without the trailing `.filter`, the picker
// rendered a bare "SOURCES" header with zero rows under it. Mirrors
// PICKER_SECTIONS_FEED's own identical emptiness filter just below.
// WAVE 2 — THE VERB EXPANSION (out-of-seam, minimal fix, same precedent as
// the WAVE 1 comment above it): 'source'/'audience' join 'params' in this
// SAME exclusion — both are 0-in value carriers (SignalNode.jsx), the
// identical shape that got params excluded in the first place ("the
// RIGHT-side splice path always wires existing.out -> newNode.in
// unconditionally... picking [an in-portless block] there would mint an
// edge into a handle that's never rendered"). Measure is NOT excluded — it
// has a real in-port and is a perfectly legal picker offering on either
// side, same footing as task/output/wait.
// WAVE 5 — THE VERB EXPANSION (integrated QA catch, out-of-seam minimal
// fix): 'style' belongs in this SAME exclusion — Style Reference is a
// FOURTH 0-in 'signal' kind (SignalNode.jsx only renders InHandle for
// kind==='measure'; source/audience/style all render none), but Wave 3
// never added it here when it landed. Left uncaught, picking "Style
// Reference" from the ghost-+ RIGHT side (state.jsx onAddFrom, side:
// 'right') or from a wire dragged out of a SOURCE port and released on
// empty pane (onWireAdd, handleType !== 'target') both hardcode
// `targetHandle: 'in'` on the new node with no defaultSourceHandle-style
// guard for the target side (same gap this file's own WAVE 1/2 comments
// already name) — CDP-verified: the edge mints in data but never draws,
// since Style Reference's card has no `id="in"` Handle to resolve. Style
// Reference stays fully reachable via palette-click and search (both read
// PALETTE_SECTIONS directly, never this filtered list) and via pane-
// right-click's own "insert-at-point, no wiring" path already tolerates
// losing 0-in types the identical way it already does for source/audience
// today — this fix only changes the two paths that were actually broken.
const PICKER_SECTIONS = PALETTE_SECTIONS.filter((section) => section.id !== 'annotate')
  .map((section) => ({
    ...section,
    items: section.items.filter(
      (item) =>
        item.id !== 'trigger' && item.id !== 'params' && item.id !== 'source' && item.id !== 'audience' && item.id !== 'style',
    ),
  }))
  .filter((section) => section.items.length > 0)

// CP0+ item 2 — "dragged from an in-port -> show only blocks that can FEED
// it." The wire-drop gesture always wires the NEW node's plain 'out' handle
// into the existing in-port (mirrors onAddFrom's LEFT-side precedent,
// state.jsx's onWireAdd) — so only items whose default makeData() actually
// renders a generic 'out' Handle belong on this list. Verified against each
// node component's own handle rendering (src/nodes/*.jsx — another seam, so
// this is a hand-checked table, not an import or a guess):
//   - StopNode.jsx never renders OutHandle at all (InHandle only).
//   - LogicNode.jsx's if/switch/try kinds render ONLY their branch-specific
//     HandleLabelRows (true/false, case-N, try/catch) — never the plain
//     'out' — only kind:'foreach' does (its own line 96: `{kind ===
//     'foreach' && <OutHandle .../>}`). Switch's default `options:[]` means
//     a freshly-added one has ZERO source handles until the user adds one.
//   - Every OTHER default (Task, Generate, Human's default
//     responseType:'free', Wait, every Output format) renders OutHandle
//     unconditionally.
// This is exactly why PLAN.md CP0+'s own first-guess phrasing ("everything
// but Outputs") is wrong — Output nodes DO carry a source handle in this
// codebase — "verify against isValidConnection's actual rules rather than
// assuming" is what turned up this list instead (isValidConnection itself,
// state.jsx, never gates on source-side node type at all — the real
// constraint is structural: does the fresh node even RENDER an 'out' Handle).
// WAVE 1 — THE VERB EXPANSION (out-of-seam, minimal fix): A/B Split renders
// ONLY its two named 'a'/'b' rows (LogicNode.jsx SplitBody), never a plain
// 'out' — same branch-only shape as if/switch/try above, so it joins this
// set for the identical reason. Gather is NOT added: it renders a plain
// OutHandle unconditionally (LogicNode.jsx, mirrors foreach), so it already
// has a real default 'out' to offer here.
// WAVE 4 — THE VERB EXPANSION. Guardrail joins the same branch-only family —
// it renders ONLY its two named 'pass'/'flag' rows (LogicNode.jsx), never a
// plain 'out'. Compare is NOT added (same reasoning as Gather above): it
// renders a plain OutHandle unconditionally.
const NO_DEFAULT_OUT = new Set(['stop', 'if', 'switch', 'try', 'split', 'guardrail'])
const PICKER_SECTIONS_FEED = PICKER_SECTIONS.map((section) => ({
  ...section,
  items: section.items.filter((item) => !NO_DEFAULT_OUT.has(item.id)),
})).filter((section) => section.items.length > 0)

// CP0+ item 1 — "the palette search's filter logic reused." Identical
// predicate to Palette.jsx's own searchPalette (case-insensitive substring
// over label+caption, same PALETTE_SECTIONS grouping) — see this file's own
// header comment for why that's a local duplicate rather than an import.
// Applied to whichever section list the picker is currently showing
// (PICKER_SECTIONS, or its connection-filtered variant above) instead of
// the full catalog, and — unlike Palette's version — never touches
// TEMPLATES: this popover only ever offers blocks.
function filterSections(sections, query) {
  const q = query.toLowerCase()
  const hit = (...fields) => fields.some((f) => f && f.toLowerCase().includes(q))
  return sections
    .map((section) => ({ ...section, items: section.items.filter((item) => hit(item.label, item.caption)) }))
    .filter((section) => section.items.length > 0)
}

// Must match .cw-block-picker's own width/max-height in app.css — kept as
// JS constants (not read off the DOM) because the clamp math below needs
// them before the popover has ever painted a frame.
const POPOVER_W = 216
const POPOVER_MAX_H = 340
const ANCHOR_GAP = 8
const EDGE_MARGIN = 10

function clamp(value, min, max) {
  return Math.max(min, Math.min(value, max))
}

// Boundary rects come from the live DOM, not fixed layout numbers — the
// palette can be collapsed to a 40px strip or a full 248px, and the header/
// compiled panel are frosted-glass overlays rather than grid tracks, so
// "the workspace" only really exists as whatever these three currently
// render at (PLAN.md: "clamped to the workspace so it never runs under the
// header, palette, or compiled panel").
function computePosition(rect, side) {
  const root = typeof document !== 'undefined' ? document.getElementById('workflow-root') : null
  const headerBottom = root?.querySelector('.cw-header')?.getBoundingClientRect().bottom ?? 0
  const paletteRight = root?.querySelector('.cw-palette')?.getBoundingClientRect().right ?? 0
  const panelLeft = root?.querySelector('.cw-panel')?.getBoundingClientRect().left ?? window.innerWidth

  const minLeft = paletteRight + EDGE_MARGIN
  const maxLeft = Math.max(minLeft, panelLeft - EDGE_MARGIN - POPOVER_W)
  const minTop = headerBottom + EDGE_MARGIN
  const maxTop = Math.max(minTop, window.innerHeight - EDGE_MARGIN - POPOVER_MAX_H)

  // "opens toward the clicked side: right ghost -> popover's left edge at
  // the +, left ghost -> right edge" — anchored just off the button rather
  // than flush, so it clears the ghost's own hover/press scale. CP0+'s
  // wire-drop variant reuses this verbatim with a zero-size rect AT the
  // release point instead of a button's real rect — "right" opens
  // rightward of the cursor, "left" opens leftward, same formula either way.
  const rawLeft = side === 'right' ? rect.right + ANCHOR_GAP : rect.left - ANCHOR_GAP - POPOVER_W
  // "vertically centred on the +".
  const rawTop = rect.top + rect.height / 2 - POPOVER_MAX_H / 2

  return { left: clamp(rawLeft, minLeft, maxLeft), top: clamp(rawTop, minTop, maxTop) }
}

function PickerRow({ item, highlighted, showCaption, onPick, onHover, innerRef }) {
  const Icon = ICONS[item.icon]
  return (
    <button
      ref={innerRef}
      type="button"
      role="menuitem"
      className={`cw-picker-item${highlighted ? ' is-highlighted' : ''}`}
      onClick={() => onPick(item.id)}
      onMouseEnter={onHover}
    >
      {Icon ? <Icon size={15} weight="regular" style={{ color: item.accent }} /> : null}
      <span className="cw-picker-item-text">
        <span className="cw-picker-item-label">{item.label}</span>
        {/* CP0+ item 3 — "picker rows gain their palette blurb as a second
            line when the picker is search-open... so choosing is informed."
            Output rows have no `caption` in data/blocks.js at all, so this
            silently stays single-line for them even mid-search, matching
            the palette's own OUTPUTS treatment. */}
        {showCaption && item.caption ? <span className="cw-picker-item-caption">{item.caption}</span> : null}
      </span>
    </button>
  )
}

export default function BlockPicker({ side, rect, connectionFilter, fromLabel, autoFocusSearch, onPick, onClose }) {
  const popRef = useRef(null)
  const searchInputRef = useRef(null)
  const rowElsRef = useRef(new Map())
  const [query, setQuery] = useState('')
  const [highlightIndex, setHighlightIndex] = useState(0)

  const baseSections = useMemo(() => (connectionFilter === 'feed' ? PICKER_SECTIONS_FEED : PICKER_SECTIONS), [connectionFilter])
  const trimmedQuery = query.trim()
  const isSearching = trimmedQuery.length > 0
  const sections = useMemo(() => (isSearching ? filterSections(baseSections, trimmedQuery) : baseSections), [baseSections, isSearching, trimmedQuery])
  const flatItems = useMemo(() => sections.flatMap((s) => s.items), [sections])

  // A fresh query (or the connection-aware filter itself) always restarts
  // the highlight at the top result — "Enter commits first/highlighted"
  // (PLAN.md) means the highlight should already BE "first" the instant new
  // results land, not wherever the previous, now-stale list left it. Also
  // clamps down if a shrinking result set left it past the new end.
  useEffect(() => {
    setHighlightIndex((i) => Math.max(0, Math.min(i, flatItems.length - 1)))
  }, [flatItems])
  useEffect(() => {
    setHighlightIndex(0)
  }, [trimmedQuery])

  // "autofocused when opened via keyboard/wire-drop" (PLAN.md item 1) — a
  // mouse-clicked ghost/edge + leaves focus alone (today's behaviour: click
  // a row directly), the wire-drop gesture focuses the field immediately
  // since there's no button click to have already placed focus anywhere.
  // Mount-only: FlowCanvas.jsx remounts this component fresh (via its own
  // `key`) any time WHICH picker is open changes, so there's never a later
  // prop change to react to here.
  useEffect(() => {
    if (autoFocusSearch) searchInputRef.current?.focus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Keeps the highlighted row in view as arrow keys walk past the visible
  // edge of the scrollable list.
  useEffect(() => {
    rowElsRef.current.get(flatItems[highlightIndex]?.id)?.scrollIntoView?.({ block: 'nearest' })
  }, [highlightIndex, flatItems])

  useEffect(() => {
    // "Click anywhere else ... dismiss[es]." A document-level pointerdown
    // listener (same pattern App.jsx's title-dropdown menu and
    // CommentsLayer's thread card both already use) covers every "elsewhere"
    // uniformly. Ghost + buttons and the edge's own wire + (CP0) are
    // explicitly excluded — same reasoning as CommentsLayer excluding
    // `.cw-comment-pin-btn` from ITS outside-click check: pointerdown always
    // fires before the click that dispatches cw:add-picker, so without this
    // exclusion, clicking either kind of + would close the picker here a
    // tick before FlowCanvas's/OmniEdge's own toggle/reopen logic ever got a
    // chance to run, breaking "clicking the + again" (should close) and
    // "click a different node's/edge's +" (should just move the picker).
    const onPointerDown = (event) => {
      if (popRef.current?.contains(event.target)) return
      if (event.target.closest?.('.cw-ghost')) return
      if (event.target.closest?.('.omni-edge-btn-add')) return
      onClose()
    }
    // Capture phase + stopPropagation, mirroring FlowCanvas.jsx's own
    // comment-mode Escape precedent (see that file's header comment): the
    // shell (index.html) owns a bubble-phase Escape listener that closes the
    // WHOLE workflow overlay, so without this the picker's Esc would also
    // dump the user out of the builder instead of just closing the menu.
    //
    // CP0+ item 1 — the SAME capture listener also owns ArrowUp/ArrowDown/
    // Enter now ("arrow keys walk results, Enter commits first/highlighted"):
    // capture + stopPropagation keeps these from ever reaching
    // FlowCanvas.jsx's own global shortcuts (zoom, undo, ⌘F...) regardless of
    // whether the search field happens to hold literal DOM focus — a
    // mouse-opened picker never autofocuses it (see the effect above), so
    // relying on the input's own onKeyDown would miss that case entirely.
    // Other keys (regular typing, arrow-left/right inside the query, ⌘Z...)
    // are never touched here and fall through untouched.
    const onKeyDownCapture = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onClose()
        return
      }
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        event.stopPropagation()
        setHighlightIndex((i) => Math.min(i + 1, flatItems.length - 1))
        return
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        event.stopPropagation()
        setHighlightIndex((i) => Math.max(i - 1, 0))
        return
      }
      if (event.key === 'Enter') {
        const item = flatItems[highlightIndex]
        if (!item) return
        event.preventDefault()
        event.stopPropagation()
        onPick(item.id)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDownCapture, true)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDownCapture, true)
    }
  }, [onClose, onPick, flatItems, highlightIndex])

  const target = typeof document !== 'undefined' ? document.getElementById('workflow-root') : null
  if (!target || !rect) return null

  const pos = computePosition(rect, side)
  const highlightedId = flatItems[highlightIndex]?.id

  return createPortal(
    <div
      ref={popRef}
      className="cw-block-picker"
      role="menu"
      aria-label="Add a block"
      style={{ left: pos.left, top: pos.top }}
    >
      {/* CP0+ item 2 — "a small chip in the picker head names the source
          ('FROM 02 · out', mono) like Comfy's Input: MODEL chip." Wire-drop
          only; the node-ghost/edge-+ openers pass no fromLabel. */}
      {fromLabel ? (
        <div className="cw-picker-head">
          <span className="cw-picker-head-chip">{fromLabel}</span>
        </div>
      ) : null}
      {/* CP0+ item 1 — reuses the palette search's own CSS classes verbatim
          (app.css's .cw-palette-search*, shared/global — not scoped to
          Palette.jsx) rather than forking a near-identical set of rules, so
          this reads as the exact same control, just smaller. */}
      <div className="cw-palette-search cw-picker-search">
        <MagnifyingGlass size={13} weight="regular" className="cw-palette-search-icon" aria-hidden="true" />
        <input
          ref={searchInputRef}
          type="text"
          className="cw-palette-search-input"
          placeholder="Search blocks..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search blocks"
        />
        {query ? (
          <button type="button" className="cw-palette-search-clear" aria-label="Clear search" onClick={() => setQuery('')}>
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
          </button>
        ) : null}
      </div>
      <div className="cw-picker-list">
        {flatItems.length ? (
          sections.map((section) => (
            <div key={section.id} className="cw-picker-section">
              <div className="cw-section-label">{section.label}</div>
              {section.items.map((item) => (
                <PickerRow
                  key={item.id}
                  item={item}
                  highlighted={item.id === highlightedId}
                  showCaption={isSearching}
                  onPick={onPick}
                  onHover={() => {
                    const idx = flatItems.findIndex((f) => f.id === item.id)
                    if (idx >= 0) setHighlightIndex(idx)
                  }}
                  innerRef={(el) => {
                    if (el) rowElsRef.current.set(item.id, el)
                    else rowElsRef.current.delete(item.id)
                  }}
                />
              ))}
            </div>
          ))
        ) : (
          <p className="cw-palette-empty cw-picker-empty">No matches for "{trimmedQuery}"</p>
        )}
      </div>
    </div>,
    target,
  )
}
