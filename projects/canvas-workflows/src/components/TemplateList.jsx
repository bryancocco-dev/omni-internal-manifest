// Seam B — App core (TEMPLATES PHASE, TP1)
//
// Templates tab of the palette's Blocks|Templates switch (Palette.jsx owns
// the switch itself). Reads the built catalog from ../data/templates/
// index.js — TP2/TP3 own that file's contents: an array of `template({...})`
// results per data/templates/builder.js's contract (id/name/category/blurb/
// size/build()). This file only groups + renders + wires insertion; it never
// touches builder.js or index.js.
//
// Rows are BOTH draggable (drop payload mime `application/reactflow-template`
// = the template id, consumed by FlowCanvas.jsx's onDrop alongside the
// existing block path) and click-to-insert (state.jsx's `insertTemplate`) —
// same dual affordance PaletteRow already gives block rows.

import React from 'react'

import { TEMPLATES } from '../data/templates/index.js'
import { useFlowState } from '../state.jsx'
import {
  attachManualDragGhost,
  Folder,
  BookmarkFlag,
  toggleTemplateBookmark,
  useBookmarkedTemplateIds,
} from './Palette.jsx'
import { previewHoverStart, previewHoverEnd, previewCloseNow } from './PalettePreview.jsx'

// Category display order (PLAN.md "## TEMPLATES PHASE" -> "### TP1" item 2)
// — fixed, not alphabetical and not first-appearance order. A template whose
// `category` doesn't match one of these six (shouldn't happen — TP2/TP3
// author against the same spec text) still renders, grouped under its own
// literal category name and appended after the known sections, so a casing
// slip loses nothing silently.
const CATEGORY_ORDER = ['Quick start', 'Content', 'Research', 'Approvals', 'Data', 'Operations']

function groupByCategory(templates) {
  const groups = new Map()
  for (const cat of CATEGORY_ORDER) groups.set(cat, [])
  for (const tpl of templates) {
    if (!groups.has(tpl.category)) groups.set(tpl.category, [])
    groups.get(tpl.category).push(tpl)
  }
  return [...groups.entries()].filter(([, items]) => items.length > 0)
}

// TP1 spec: "Drag ghost: reuse buildDragGhost's treatment with the template
// name." Same construction/CSS classes Palette.jsx's buildDragGhost uses for
// block rows (.cw-drag-ghost/-tile/-label, already styled in app.css) — kept
// as a sibling copy rather than an import so this file and Palette.jsx (which
// imports TemplateList for the Templates tab) don't form an import cycle.
function buildTemplateDragGhost(name, event) {
  const el = document.createElement('div')
  el.className = 'cw-drag-ghost'
  const tile = document.createElement('span')
  tile.className = 'cw-drag-ghost-tile'
  tile.style.background = 'var(--cw-accent)'
  const label = document.createElement('span')
  label.className = 'cw-drag-ghost-label'
  label.textContent = name
  el.appendChild(tile)
  el.appendChild(label)
  el.style.left = `${Math.max(0, (event?.clientX ?? 0) - 60)}px`
  el.style.top = `${Math.max(0, (event?.clientY ?? 0) - 20)}px`
  ;(document.getElementById('workflow-root') || document.body).appendChild(el)
  return el
}

// ANDREW ROUND (PLAN.md "### A — PALETTE TYPE-AHEAD") — exported so
// Palette.jsx's type-ahead can render matching templates through the SAME
// row (drag ghost, click-insert, size chip included) instead of a
// search-only copy. groupByCategory/CATEGORY_ORDER stay local: search
// groups templates under one flat "TEMPLATES" bucket, not by category.
// `rowIndex` is optional (LIBRARY PASS's `--r` swap-cascade stagger, same
// contract as Palette.jsx's own PaletteRow) — search's flat rendering
// doesn't pass it, this file's own Folder-nested rendering below does.
export function TemplateRow({ tpl, rowIndex }) {
  const { insertTemplate } = useFlowState()
  const bookmarked = useBookmarkedTemplateIds().has(tpl.id)
  const previewKey = `template:${tpl.id}`

  const handleDragStart = (event) => {
    previewCloseNow()
    event.dataTransfer.setData('application/reactflow-template', tpl.id)
    try {
      const img = new window.Image(1, 1)
      img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
      event.dataTransfer.setDragImage(img, 0, 0)
    } catch {}
    event.dataTransfer.effectAllowed = 'move'
    const ghost = buildTemplateDragGhost(tpl.name)
    attachManualDragGhost(ghost, 26, 18, event.currentTarget)
    const row = event.currentTarget
    row.classList.add('is-drag-source')
    row.addEventListener('dragend', () => row.classList.remove('is-drag-source'), { once: true })
  }

  return (
    // Div, not <button>: Chrome refuses to start a native HTML5 drag from a
    // form control, which left draggable={true} silently inert here (the same
    // bug as Palette.jsx's block rows). role/tabIndex/keys keep it a button.
    <div
      role="button"
      tabIndex={0}
      className="cw-palette-row cw-template-row"
      style={rowIndex != null ? { '--r': rowIndex } : undefined}
      draggable
      onDragStart={handleDragStart}
      onClick={() => insertTemplate(tpl.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          insertTemplate(tpl.id)
        }
      }}
      // LIBRARY PASS ("### 2 — Hover preview") — same shared hover-intent
      // controller PaletteRow uses (Palette.jsx), so a walk from a block row
      // straight onto a template row (or back) still re-anchors ONE panel.
      onMouseEnter={(e) => previewHoverStart('template', tpl, previewKey, e.currentTarget.getBoundingClientRect())}
      onMouseLeave={() => previewHoverEnd(previewKey)}
    >
      <span className="cw-row-text">
        <span className="cw-row-label">{tpl.name}</span>
        <span className="cw-row-caption cw-template-blurb">{tpl.blurb}</span>
      </span>
      <span className="cw-template-size" title={`${tpl.size} nodes`}>
        {tpl.size}
      </span>
      <BookmarkFlag active={bookmarked} onToggle={() => toggleTemplateBookmark(tpl.id)} label={tpl.name} />
    </div>
  )
}

// LIBRARY PASS ("### 1 — Folder tree", "Templates tab: category groups
// become the same collapsible folders") — same BOOKMARKED-pinned-above-
// everything-else + running-`--r`-counter shape as Palette.jsx's own
// BlocksFolderTree; category groups never nest further (unlike OUTPUTS), so
// this is the flat half of that same pattern. `collapsedIds`/`onToggleFolder`
// come from Palette.jsx — ONE Set covers folder ids across both tabs (see
// that file's own comment on its `collapsedIds` state).
export default function TemplateList({ collapsedIds, onToggleFolder }) {
  const groups = groupByCategory(TEMPLATES)
  const bookmarkedIds = useBookmarkedTemplateIds()
  const bookmarkedGroup = bookmarkedIds.size ? ['Bookmarked', TEMPLATES.filter((tpl) => bookmarkedIds.has(tpl.id))] : null
  const allGroups = bookmarkedGroup ? [bookmarkedGroup, ...groups] : groups

  let r = 0
  return allGroups.map(([category, items], i) => {
    const folderId = category === 'Bookmarked' ? 'bookmarked-templates' : `templates-${category}`
    return (
      <div key={category} className="cw-palette-section" style={{ '--i': i }}>
        <Folder
          id={folderId}
          // CSS (.cw-section-label's own text-transform:uppercase, app.css)
          // handles the visual caps — pass the label through exactly as the
          // original bare-div rendering did, category casing included, so
          // the DOM text content matches what it always has.
          label={category === 'Bookmarked' ? 'BOOKMARKED' : category}
          collapsed={collapsedIds.has(folderId)}
          onToggle={onToggleFolder}
          index={r++}
        >
          {items.map((tpl) => (
            <TemplateRow key={tpl.id} tpl={tpl} rowIndex={r++} />
          ))}
        </Folder>
      </div>
    )
  })
}
