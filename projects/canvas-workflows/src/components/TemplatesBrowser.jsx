// PLATFORM CHROME (PLAN.md "## PLATFORM CHROME" -> "### 1 — Templates
// browser modal"). Thin data adapter over BrowserModal.jsx's shared shell:
// this file owns category grouping, the "Contains" kind filter, search, and
// the click-to-insert action; the modal chrome itself (portal, backdrop,
// header, search field wiring, Esc/outside-click) lives entirely in
// BrowserModal.jsx.
//
// Entry points wire in from elsewhere: Palette.jsx's "Browse all" link and
// App.jsx's title-dropdown "Browse templates" item both just call
// `openBrowser('templates')` — this component is mounted once (App.jsx) and
// renders itself open/closed by asking `useBrowserKind()`.

import { useMemo, useState } from 'react'
import { SquaresFour } from '@phosphor-icons/react'

import { TEMPLATES } from '../data/templates/index.js'
import { getTemplateMiniGraph, MiniGraphThumb, fillForType } from '../run/miniGraph.js'
import { useFlowState } from '../state.jsx'
import BrowserModal, { useBrowserKind, closeBrowser } from './BrowserModal.jsx'

// Duplicated from TemplateList.jsx's own (unexported) CATEGORY_ORDER — same
// "fixed display order, not alphabetical" list, same cross-file duplication
// convention this app already uses everywhere a second file needs a
// sibling's local constant (BlockPicker.jsx's own header comment names the
// precedent: "duplicate the algorithm, not import it"). Keep both in sync by
// hand if a template category is ever added.
const CATEGORY_ORDER = ['Quick start', 'Content', 'Research', 'Approvals', 'Data', 'Operations']

// Kind labels for the "Contains" filter — one entry per NAMED kind, not just
// per node TYPE (PLAN.md's own example list names "Guardrail" and "Measure"
// specifically, both `kind`s on the shared `logic`/`signal` types, not types
// of their own) — same `type==='logic'||'signal' ? data.kind : type` split
// PalettePreview.jsx's facsimileFields/portsForItem already use for the
// identical reason (LIBRARY PASS's own hover-preview kind-aware lookups).
const KIND_LABELS_LOGIC = {
  if: 'If / Else',
  switch: 'Switch / Case',
  foreach: 'For Each',
  try: 'Try / Catch',
  gather: 'Gather',
  split: 'A/B Split',
  compare: 'Compare',
  guardrail: 'Guardrail',
}
const KIND_LABELS_SIGNAL = { source: 'Source', audience: 'Audience', measure: 'Measure', style: 'Style Reference' }
const TYPE_LABELS = {
  trigger: 'Trigger',
  task: 'Task',
  generate: 'Generate',
  remix: 'Remix',
  handoff: 'Handoff',
  localize: 'Localize',
  optimize: 'Optimize',
  runworkflow: 'Run Workflow',
  human: 'Human',
  wait: 'Wait',
  stop: 'Stop',
  output: 'Output', // structural bucket, not per-format — "ours are structural, not media-type based" (PLAN.md)
  params: 'Params',
  note: 'Note',
}

function kindOf(node) {
  if (node.type === 'logic') {
    const k = node.data?.kind || 'if'
    return { key: `logic:${k}`, label: KIND_LABELS_LOGIC[k] || 'Logic' }
  }
  if (node.type === 'signal') {
    const k = node.data?.kind || 'source'
    return { key: `signal:${k}`, label: KIND_LABELS_SIGNAL[k] || 'Signal' }
  }
  return { key: node.type, label: TYPE_LABELS[node.type] || node.type }
}

// Computed once at module load (TEMPLATES is static data) — reuses
// getTemplateMiniGraph's own cached `build()` call (its own header comment:
// "the built graph itself rides along on the cache entry... so
// TemplatesBrowser.jsx's Contains filter can reuse the SAME build() call")
// rather than minting a second throwaway id set per template just to look
// at node types.
const TEMPLATE_KINDS = new Map() // tpl.id -> [{key,label}] in first-seen order
const CONTAINS_LABEL = new Map() // key -> label, deduped across every template
for (const tpl of TEMPLATES) {
  const { graph } = getTemplateMiniGraph(tpl)
  const kinds = []
  const seen = new Set()
  for (const node of graph.nodes) {
    if (node.parentId) continue
    const { key, label } = kindOf(node)
    if (!seen.has(key)) {
      seen.add(key)
      kinds.push({ key, label })
    }
    if (!CONTAINS_LABEL.has(key)) CONTAINS_LABEL.set(key, label)
  }
  TEMPLATE_KINDS.set(tpl.id, kinds)
}
const CONTAINS_OPTIONS = [...CONTAINS_LABEL.entries()]
  .map(([key, label]) => ({ key, label }))
  .sort((a, b) => a.label.localeCompare(b.label))

export default function TemplatesBrowser() {
  const open = useBrowserKind() === 'templates'
  const { insertTemplate } = useFlowState()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [contains, setContains] = useState(() => new Set())

  const categoryCounts = useMemo(() => {
    const counts = new Map()
    for (const tpl of TEMPLATES) counts.set(tpl.category, (counts.get(tpl.category) || 0) + 1)
    return counts
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return TEMPLATES.filter((tpl) => {
      if (category !== 'All' && tpl.category !== category) return false
      if (contains.size) {
        const keys = new Set((TEMPLATE_KINDS.get(tpl.id) || []).map((k) => k.key))
        let hit = false
        for (const c of contains) {
          if (keys.has(c)) {
            hit = true
            break
          }
        }
        if (!hit) return false
      }
      if (q && !tpl.name.toLowerCase().includes(q) && !tpl.blurb.toLowerCase().includes(q)) return false
      return true
    })
  }, [search, category, contains])

  function toggleContains(key) {
    setContains((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function handlePick(tplId) {
    // "Click a card -> insertTemplate at viewport centre (existing path),
    // modal closes, existing ripple/glide fires" (PLAN.md) — no position arg
    // is exactly insertTemplate's own centred-insert branch.
    insertTemplate(tplId)
    closeBrowser()
  }

  const rail = (
    <>
      <button
        type="button"
        className={`cw-bmodal-rail-cat${category === 'All' ? ' is-active' : ''}`}
        onClick={() => setCategory('All')}
      >
        <span>All templates</span>
        <span className="cw-bmodal-rail-count">{TEMPLATES.length}</span>
      </button>
      {CATEGORY_ORDER.filter((cat) => categoryCounts.has(cat)).map((cat) => (
        <button
          key={cat}
          type="button"
          className={`cw-bmodal-rail-cat${category === cat ? ' is-active' : ''}`}
          onClick={() => setCategory(cat)}
        >
          <span>{cat}</span>
          <span className="cw-bmodal-rail-count">{categoryCounts.get(cat)}</span>
        </button>
      ))}
    </>
  )

  const toolbar = (
    <>
      <span className="cw-bmodal-toolbar-label">Contains</span>
      {CONTAINS_OPTIONS.map((opt) => (
        <button
          key={opt.key}
          type="button"
          className={`cw-bmodal-chip${contains.has(opt.key) ? ' is-active' : ''}`}
          onClick={() => toggleContains(opt.key)}
          aria-pressed={contains.has(opt.key)}
        >
          {opt.label}
        </button>
      ))}
    </>
  )

  return (
    <BrowserModal
      open={open}
      onClose={closeBrowser}
      icon={SquaresFour}
      title="Browse templates"
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search templates..."
      rail={rail}
      toolbar={toolbar}
      ariaLabel="Browse templates"
    >
      {filtered.length ? (
        <div className="cw-bmodal-grid">
          {filtered.map((tpl) => {
            const thumb = getTemplateMiniGraph(tpl)
            const kinds = TEMPLATE_KINDS.get(tpl.id) || []
            return (
              <button key={tpl.id} type="button" className="cw-bcard" onClick={() => handlePick(tpl.id)}>
                <span className="cw-bcard-thumb">
                  <MiniGraphThumb data={thumb} />
                </span>
                <span className="cw-bcard-title">{tpl.name}</span>
                <span className="cw-bcard-blurb">{tpl.blurb}</span>
                <span className="cw-bcard-meta">
                  <span className="cw-bcard-kinds">
                    {kinds.slice(0, 8).map((k) => (
                      <span key={k.key} className="cw-bcard-kind-dot" style={{ background: fillForType(k.key.split(':')[0]) }} title={k.label} />
                    ))}
                  </span>
                  <span className="cw-bcard-count" title={`${tpl.size} blocks`}>
                    {tpl.size}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      ) : (
        <p className="cw-bmodal-empty">No templates match{search ? ` "${search}"` : ''}.</p>
      )}
    </BrowserModal>
  )
}
