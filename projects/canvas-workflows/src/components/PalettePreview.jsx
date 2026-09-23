// Seam B — App core (LIBRARY PASS, PLAN.md "## LIBRARY PASS — folders +
// hover previews in the palette", "### 2 — Hover preview")
//
// Bryan, on Comfy's node library: "can we do the thing that comfy does...
// you see a preview of the node on hover." This file owns that preview
// card end to end: the shared hover-intent timer (so walking rows re-
// anchors ONE panel instead of flickering), the portal + workspace-clamped
// positioning (same family as BlockPicker.jsx's own computePosition — read
// there, not imported: that function's ghost/edge-rect side-anchoring math
// is specific to its own callers), and the two content renderers (a block's
// mini node facsimile + ports table, a template's kind-dot strip + port
// line).
//
// Trigger API — Palette.jsx / TemplateList.jsx call these from a row's own
// mouse events; neither file needs to know anything about timers or the
// portal. `key` uniquely identifies the row ('block:<id>' / 'template:<id>')
// so a stale leave from a row the pointer already left can never close a
// DIFFERENT row's freshly-opened preview (see previewHoverEnd's own note).
//   previewHoverStart(kind, data, key, rect)
//   previewHoverEnd(key)
//   previewCloseNow()   — palette-leave / drag-start / scroll: no grace.
// Host — Palette.jsx mounts <PalettePreview/> exactly once, as a sibling of
// its collapse-handle portal.

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
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
  Sparkle,
  NotePencil,
  SlidersHorizontal,
  // WAVE 1 — THE VERB EXPANSION. Gather/A-B Split's own palette-row icons
  // (data/blocks.js's 'gather'/'split' items).
  ArrowsInSimple,
  Percent,
  // WAVE 2 — THE VERB EXPANSION. Source/Audience/Measure's own palette-row
  // icons (data/blocks.js's 'source'/'audience'/'measure' items).
  Database,
  UsersThree,
  Target,
  // WAVE 3 — THE VERB EXPANSION. Style Reference / Remix / Compare's own
  // palette-row icons (data/blocks.js's 'style'/'remix'/'compare' items).
  Swatches,
  Shuffle,
  Ranking,
  // WAVE 4 — THE VERB EXPANSION. Handoff/Localize/Optimize/Run
  // workflow/Guardrail's own palette-row icons (data/blocks.js's
  // 'handoff'/'localize'/'optimize'/'run-workflow'/'guardrail' items).
  UserSwitch,
  Translate,
  TrendUp,
  FlowArrow,
  ShieldCheck,
} from '@phosphor-icons/react'

import { PALETTE_SECTIONS, BRANCH_HANDLE_SAMPLES } from '../data/blocks.js'
// WAVE 3 — THE VERB EXPANSION. Style Reference's own default seed
// (data/blocks.js's 'style' item makeData()) — same neither-B-nor-C-
// exclusive module every seed-touching file in this app already reads it
// from (GenerateNode.jsx, state.jsx, run/engine.js).
import { DEFAULT_GENERATE_SEED } from '../data/models.js'

/* ---------------------------------------------------------------------- */
/* Hover-intent store — plain module state, not React state: any row in    */
/* Palette.jsx/TemplateList.jsx (including inside search results) can call  */
/* the exported functions directly without a context provider, mirroring   */
/* this codebase's other cross-row singletons (e.g. Palette.jsx's own drag- */
/* ghost helpers). Session-local by construction — a page refresh just      */
/* re-inits these module bindings, nothing to reset by hand.                */
/* ---------------------------------------------------------------------- */
let current = null // { kind: 'block'|'template', data, key, rect } | null
let pendingOpenKey = null
let openTimer = null
let closeTimer = null
const listeners = new Set()

function emit() {
  listeners.forEach((fn) => fn())
}
function subscribe(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
function getSnapshot() {
  return current
}

const OPEN_DELAY = 320 // PLAN.md: "Hovering a palette/template row 320ms"
const CLOSE_GRACE = 150 // PLAN.md: "leaves on row-leave (150ms grace)"

export function previewHoverStart(kind, data, key, rect) {
  clearTimeout(closeTimer)
  closeTimer = null
  if (current) {
    // Already showing (or mid re-anchor) — "moving to the next row
    // re-anchors the SAME panel, no exit/enter flicker": update in place,
    // no fresh delay.
    clearTimeout(openTimer)
    openTimer = null
    pendingOpenKey = null
    current = { kind, data, key, rect }
    emit()
    return
  }
  clearTimeout(openTimer)
  pendingOpenKey = key
  openTimer = setTimeout(() => {
    openTimer = null
    pendingOpenKey = null
    current = { kind, data, key, rect }
    emit()
  }, OPEN_DELAY)
}

export function previewHoverEnd(key) {
  // A pending OPEN belongs to whichever row started it — only that row's
  // own leave may cancel it (a later row's hover already replaced it, see
  // above, so an old leave arriving after that has nothing left to cancel).
  if (pendingOpenKey === key) {
    clearTimeout(openTimer)
    openTimer = null
    pendingOpenKey = null
  }
  if (!current || current.key !== key) return // someone else already owns the panel — not this row's call to close it
  clearTimeout(closeTimer)
  closeTimer = setTimeout(() => {
    closeTimer = null
    if (current?.key === key) {
      current = null
      emit()
    }
  }, CLOSE_GRACE)
}

export function previewCloseNow() {
  clearTimeout(openTimer)
  openTimer = null
  pendingOpenKey = null
  clearTimeout(closeTimer)
  closeTimer = null
  if (current) {
    current = null
    emit()
  }
}

function usePreviewTarget() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

/* ---------------------------------------------------------------------- */
/* Icons — the facsimile's glyph tile draws the SAME icon each item's own   */
/* PALETTE_SECTIONS row draws (item.icon is the shared key both this file   */
/* and Palette.jsx's own ICONS map read). Mirrors that map with its own     */
/* explicit imports rather than importing it — same precedent as            */
/* BlockPicker.jsx's own icon map, and needed here regardless:              */
/* Palette.jsx mounts <PalettePreview/>, so importing FROM Palette.jsx      */
/* back would make the edge circular, and a module-top-level object spread  */
/* across that cycle can read the other side's binding before it's          */
/* finished initializing (which icon map's module happens to finish first   */
/* is load-order-dependent, not something to build on).                     */
/* ---------------------------------------------------------------------- */
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
  Sparkle,
  NotePencil,
  SlidersHorizontal,
  // WAVE 1 — THE VERB EXPANSION.
  ArrowsInSimple,
  Percent,
  // WAVE 2 — THE VERB EXPANSION.
  Database,
  UsersThree,
  Target,
  // WAVE 3 — THE VERB EXPANSION.
  Swatches,
  Shuffle,
  Ranking,
  // WAVE 4 — THE VERB EXPANSION.
  UserSwitch,
  Translate,
  TrendUp,
  FlowArrow,
  ShieldCheck,
}

/* ---------------------------------------------------------------------- */
/* Real-source reflection for the mini facsimile + ports table. Every       */
/* string below is transcribed from the actual node file it credits (never  */
/* invented) — see blocks.js's BRANCH_HANDLE_SAMPLES for the fuller note on  */
/* why this pass hand-transcribes rather than imports: nodes/*.jsx is this   */
/* phase's read-only research, not a writable seam, and none of this is     */
/* data those files export (it's inline JSX literals) or components this    */
/* portal could safely mount (no ReactFlow context out here).               */
/* ---------------------------------------------------------------------- */

// CardEyebrow's own `kind` text per node (src/nodes/*.jsx, each file's own
// <CardEyebrow kind="..."/> call) — item.label matches it for every type
// EXCEPT human (adds "· Pauses") and output (format moves out of the title
// and becomes "Output · <format>" here instead).
function facsimileEyebrow(item) {
  if (item.nodeType === 'human') return 'Human Intervention · Pauses'
  if (item.nodeType === 'output') return `Output · ${item.label}`
  // WAVE 2 — THE VERB EXPANSION. Matches SignalNode.jsx's own real-card
  // eyebrow ("eyebrow SOURCE · <KIND>", master contract) — its default
  // kind on a fresh drop (data/blocks.js's 'source' item makeData()).
  // Audience/Measure need no override: item.label already reads
  // "Audience"/"Measure", identical to the real card's plain-title eyebrow.
  if (item.id === 'source') return 'Source · Brief'
  // WAVE 3 — THE VERB EXPANSION. Matches SignalNode.jsx's own real-card
  // eyebrow override ("eyebrow STYLE", master contract) — the card's TITLE
  // stays the full "Style Reference" (facsimileTitle below, unchanged: only
  // Output diverges from item.label), just like the real card splits the
  // two the same way (SIGNAL_META.style.eyebrow vs. .title).
  if (item.id === 'style') return 'Style'
  return item.label
}

// Real <span className="cw-title"> text per node. Only Output's literal
// title ("Output" — the format lives in the eyebrow, not the title, on the
// real card) diverges from the palette's own item.label.
function facsimileTitle(item) {
  return item.nodeType === 'output' ? 'Output' : item.label
}

// 1-2 signature fields, transcribed from each node's own <FieldLabel> text
// + its real input `placeholder` (or, where a field has no label on the
// real card — Wait's amount/unit row — the real default VALUE instead of a
// fabricated label). Kept intentionally short: PLAN.md asks for "2-3
// signature fields greeked or labeled," not the full card.
const FACSIMILE_FIELDS = {
  trigger: [{ label: 'How it starts', value: 'Manual' }], // TriggerNode.jsx Segmented, default data.mode
  task: [
    { label: 'Model', value: 'Select a model...' },
    { label: 'Task instructions', value: 'Guidance for this whole task...' },
  ],
  generate: [
    { label: 'Model', value: 'Select a model...' },
    { label: 'Prompt', value: 'Describe the creative...' },
  ],
  params: [
    { label: 'Markets', value: '—' },
    { label: 'Budget', value: '$50,000' }, // ParamsNode default data.budget, formatted like ParamsEchoContent does
  ],
  human: [
    { label: 'Ask the user for', value: 'What do you need from the user?' },
    { label: 'Response type', value: 'Free text' },
  ],
  wait: [{ label: null, value: '10 · minutes' }], // WaitNode default data.amount/unit — no FieldLabel on the real row
  stop: [],
  note: [
    { label: null, value: 'Untitled note' },
    { label: null, value: 'Type a note...' },
  ],
  if: [],
  switch: [],
  foreach: [],
  try: [],
  // WAVE 1 — THE VERB EXPANSION. Nothing to greek for Gather (its content
  // is the live run-time counter, not a static field). Split's own real
  // signature control — LogicNode.jsx's SplitBody FieldLabel + its default
  // data.percentA (data/blocks.js's 'split' item makeData()).
  gather: [],
  split: [{ label: 'Split ratio', value: 'A 70% · B 30%' }],
  output: [{ label: 'Describe the output', value: 'e.g. a 500-word blog post with a hero image' }],
  // WAVE 2 — THE VERB EXPANSION. Transcribed from SignalNode.jsx's own
  // default field values (data/blocks.js's 'source'/'audience'/'measure'
  // makeData()) — same "real default, not fabricated" rule this whole
  // table follows.
  source: [
    { label: 'Kind', value: 'Brief' },
    { label: 'Reference', value: 'Q4_brief.pdf' },
  ],
  audience: [{ label: 'Segments', value: 'Urban commuters 25-34, Weekend brunchers' }],
  measure: [
    { label: 'KPI', value: 'CTR' },
    { label: 'Target', value: '≥ 1.2%' },
  ],
  // WAVE 3 — THE VERB EXPANSION. Transcribed from each new node's own
  // default field values (data/blocks.js's 'style'/'remix'/'compare'
  // makeData()) — same "real default, not fabricated" rule this whole
  // table follows.
  style: [{ label: 'Seed', value: String(DEFAULT_GENERATE_SEED) }],
  remix: [{ label: 'Operation', value: 'Translate to market' }],
  compare: [{ label: 'Criteria', value: 'Brand fit' }],
  // WAVE 4 — THE VERB EXPANSION. Transcribed from each new node's own
  // default field values (data/blocks.js's own makeData() for each item) —
  // same "real default, not fabricated" rule this whole table follows.
  // 'guardrail' is keyed by item.id (facsimileFields' own 'logic' branch,
  // same as 'compare' above); the other four by nodeType (own types).
  handoff: [{ label: 'Owner', value: 'Mara Lindqvist' }],
  localize: [{ label: 'Markets', value: 'DE, FR, JP, MX' }],
  optimize: [{ label: 'Cycles', value: '2 cycles' }],
  runworkflow: [{ label: 'Template', value: 'Ask and answer' }],
  guardrail: [{ label: 'Checks', value: 'Legal Playbook, Brand Guidelines, Claims register' }],
}

function facsimileFields(item) {
  // WAVE 2 — THE VERB EXPANSION. 'signal' joins 'logic' here — both are one
  // node TYPE hosting several kinds keyed by item.id (blocks.js's own
  // `id === data.kind` convention), so the greeked fields need the SAME
  // per-kind lookup, not a per-type one.
  const key = item.nodeType === 'logic' || item.nodeType === 'signal' ? item.id : item.nodeType
  return FACSIMILE_FIELDS[key] || []
}

// Ports table — "IN · flow" / "OUT · flow" for a plain pass-through handle,
// or the real named branch handles for logic/human (BRANCH_HANDLE_SAMPLES,
// blocks.js). Verified against src/nodes/shared.jsx's InHandle/OutHandle
// usage per node file (each node's own <InHandle>/<OutHandle> call sites)
// and LogicNode.jsx/HumanNode.jsx's branch wiring — see blocks.js's own
// sourcing note for the full citation.
function portsForItem(item) {
  const type = item.nodeType
  if (type === 'note') return { in: null, out: null } // "a note carries no handles and never runs" (blocks.js)
  if (type === 'trigger' || type === 'params') return { in: null, out: [{ label: 'flow' }] } // OutHandle only
  if (type === 'stop') return { in: [{ label: 'flow' }], out: null } // InHandle only
  if (type === 'human') return { in: [{ label: 'flow' }], out: BRANCH_HANDLE_SAMPLES.humanChoice }
  if (type === 'logic') {
    if (item.id === 'if') return { in: [{ label: 'flow' }], out: BRANCH_HANDLE_SAMPLES.if }
    if (item.id === 'try') return { in: [{ label: 'flow' }], out: BRANCH_HANDLE_SAMPLES.try }
    if (item.id === 'switch') return { in: [{ label: 'flow' }], out: BRANCH_HANDLE_SAMPLES.switch }
    // WAVE 1 — THE VERB EXPANSION. Gather — plain InHandle/OutHandle, same
    // shape as foreach below (many-in is a cardinality note, not a NAMED
    // port, so it doesn't change this table's in/out shape). Split — named
    // A/B outs, real (not illustrative) values straight off
    // BRANCH_HANDLE_SAMPLES.split.
    if (item.id === 'gather') return { in: [{ label: 'flow' }], out: [{ label: 'flow' }] }
    if (item.id === 'split') return { in: [{ label: 'flow' }], out: BRANCH_HANDLE_SAMPLES.split }
    // WAVE 4 — THE VERB EXPANSION. Guardrail — named Pass/Flag outs, real
    // values off BRANCH_HANDLE_SAMPLES.guardrail (same "real, not
    // illustrative" footing as Split's own A/B row just above). Compare
    // needs no entry — it renders a plain InHandle/OutHandle (many-in is a
    // cardinality note, not a named port), already covered by this
    // function's own default return just below.
    if (item.id === 'guardrail') return { in: [{ label: 'flow' }], out: BRANCH_HANDLE_SAMPLES.guardrail }
    return { in: [{ label: 'flow' }], out: [{ label: 'flow' }] } // foreach — plain OutHandle, no branch rows
  }
  // WAVE 2 — THE VERB EXPANSION. Source/audience are pure value carriers —
  // same 0-in shape as trigger/params above (OutHandle only); measure has
  // both, same plain unnamed shape as task/generate/wait/output below.
  if (type === 'signal') {
    if (item.id === 'measure') return { in: [{ label: 'flow' }], out: [{ label: 'flow' }] }
    return { in: null, out: [{ label: 'flow' }] }
  }
  // task / generate / wait / output — InHandle + OutHandle, unnamed.
  return { in: [{ label: 'flow' }], out: [{ label: 'flow' }] }
}

function PortRow({ io, label, accent, named }) {
  return (
    <div className="cw-preview-port-row">
      <span className="cw-preview-port-dot" style={{ background: accent }} aria-hidden="true" />
      <span className="cw-preview-port-io">{io}</span>
      <span className="cw-preview-port-sep" aria-hidden="true">
        ·
      </span>
      <span className={`cw-preview-port-label${named ? ' is-named' : ''}`}>{label}</span>
    </div>
  )
}

function PortsTable({ item }) {
  const ports = portsForItem(item)
  if (!ports.in && !ports.out) {
    return <p className="cw-preview-ports-empty">No ports — annotation only, never runs</p>
  }
  return (
    <div className="cw-preview-ports">
      {(ports.in || []).map((p, i) => (
        <PortRow key={`in${i}`} io="IN" label={p.label} accent={item.accent} named={p.label !== 'flow'} />
      ))}
      {(ports.out || []).map((p, i) => (
        <PortRow key={`out${i}`} io="OUT" label={p.label} accent={item.accent} named={p.label !== 'flow'} />
      ))}
    </div>
  )
}

function BlockFacsimile({ item }) {
  const Icon = ICONS[item.icon]
  const fields = facsimileFields(item)
  return (
    <div className="cw-preview-facsimile" style={{ '--accent': item.accent }}>
      <div className="cw-preview-facsimile-band" aria-hidden="true" />
      <div className="cw-preview-facsimile-head">
        <span className="cw-preview-facsimile-glyph">{Icon ? <Icon size={12} weight="regular" /> : null}</span>
        <span className="cw-preview-facsimile-eyebrow">{facsimileEyebrow(item)}</span>
      </div>
      <div className="cw-preview-facsimile-title">{facsimileTitle(item)}</div>
      {fields.length ? (
        <div className="cw-preview-facsimile-fields">
          {fields.map((f, i) => (
            <div className="cw-preview-facsimile-field" key={i}>
              {f.label ? <span className="cw-preview-facsimile-field-label">{f.label}</span> : null}
              <span className="cw-preview-facsimile-field-value">{f.value}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function BlockPreviewBody({ item }) {
  return (
    <div className="cw-palette-preview-body">
      <BlockFacsimile item={item} />
      <div className="cw-preview-section-label">Ports</div>
      <PortsTable item={item} />
      {item.caption ? <p className="cw-preview-blurb">{item.caption}</p> : null}
    </div>
  )
}

/* ---------------------------------------------------------------------- */
/* Template preview — "name, blurb, 'N blocks' + a kind-dot strip of the    */
/* contained node types in order, and the port line 'starts at Trigger ·    */
/* ends at N outputs' derived from the graph data" (PLAN.md, verbatim).     */
/* `tpl.build()` is the SAME pure builder TemplateList.jsx's own            */
/* insertTemplate path runs — calling it here for a never-inserted preview  */
/* graph is side-effect-free (its id counter just advances a little faster; */
/* nothing reads or persists those ids) and is what makes this genuinely    */
/* "derived from the graph data" rather than eyeballed from the authored    */
/* steps.                                                                    */
/* ---------------------------------------------------------------------- */
const TYPE_LABEL = {
  trigger: 'Trigger',
  task: 'Task',
  human: 'Human Intervention',
  wait: 'Wait',
  stop: 'Stop',
  generate: 'Generate',
  params: 'Params',
  note: 'Note',
  output: 'Output',
  logic: 'Logic',
  // WAVE 2 — THE VERB EXPANSION. No Wave-2 template exists yet to exercise
  // this (templates are Wave 5's job) — a plain type-level fallback, not
  // per-kind, matching every OTHER multi-kind type's own entry here
  // (logic: 'Logic', not per-if/switch/... — this call site only ever has
  // the bare `type` string, not the node's data).
  signal: 'Signal',
  // WAVE 3 — THE VERB EXPANSION. Same "no template exists yet" footing as
  // 'signal' above — Remix is its own type, so it needs an entry here even
  // though nothing currently exercises it (Wave 5's job).
  remix: 'Remix',
  // WAVE 4 — THE VERB EXPANSION. Same "no template exists yet" footing —
  // Handoff/Localize/Optimize/Run workflow are each their own type, so all
  // four need an entry even though nothing currently exercises them (Wave
  // 5's job). Guardrail needs none — it's a `logic` kind, covered by the
  // plain type-level 'Logic' entry above like every other logic kind.
  handoff: 'Handoff',
  localize: 'Localize',
  optimize: 'Optimize',
  runworkflow: 'Run Workflow',
}
function typeLabel(type) {
  return TYPE_LABEL[type] || (type ? type[0].toUpperCase() + type.slice(1) : '—')
}

// First palette item whose nodeType matches — every type but logic/output
// carries exactly one accent for the whole type; logic's four kinds and
// output's ten formats all share one accent apiece too (verified in
// blocks.js), so "first match" is never ambiguous in practice.
function accentForType(nodeType) {
  for (const section of PALETTE_SECTIONS) {
    const hit = section.items.find((i) => i.nodeType === nodeType)
    if (hit) return hit.accent
  }
  return 'var(--cw-text-3)'
}

function TemplatePreviewBody({ tpl }) {
  const graph = useMemo(() => tpl.build(), [tpl])
  const ordered = useMemo(
    () => [...graph.nodes].sort((a, b) => a.position.x - b.position.x || a.position.y - b.position.y),
    [graph],
  )
  const outputCount = graph.nodes.filter((n) => n.type === 'output').length
  const startType = ordered[0]?.type

  return (
    <div className="cw-palette-preview-body cw-palette-preview-body--template">
      <div className="cw-preview-template-head">
        <span className="cw-preview-template-name">{tpl.name}</span>
        <span className="cw-template-size" title={`${tpl.size} nodes`}>
          {tpl.size}
        </span>
      </div>
      {tpl.blurb ? <p className="cw-preview-blurb">{tpl.blurb}</p> : null}
      <div className="cw-preview-section-label">Contains</div>
      <div className="cw-preview-kind-strip">
        {ordered.map((n) => (
          <span
            key={n.id}
            className="cw-preview-kind-dot"
            style={{ background: accentForType(n.type) }}
            title={typeLabel(n.type)}
          />
        ))}
      </div>
      <p className="cw-preview-port-line">
        Starts at {typeLabel(startType)} · Ends at {outputCount} output{outputCount === 1 ? '' : 's'}
      </p>
    </div>
  )
}

/* ---------------------------------------------------------------------- */
/* Positioning — "anchored at the palette's right edge + 10px, top-aligned  */
/* to the row, clamped to workspace" (PLAN.md). Same boundary-probe idiom   */
/* as BlockPicker.jsx's own computePosition (read there, not imported —     */
/* that function anchors off a ghost/edge rect's own side; this always      */
/* anchors off the PALETTE's right edge regardless of which row it is).     */
/* ---------------------------------------------------------------------- */
const PREVIEW_W = 250
const PREVIEW_H_EST = 360
const GAP = 10
const EDGE_MARGIN = 10

function computePreviewPosition(rect) {
  const root = typeof document !== 'undefined' ? document.getElementById('workflow-root') : null
  const paletteRect = root?.querySelector('.cw-palette')?.getBoundingClientRect()
  const headerBottom = root?.querySelector('.cw-header')?.getBoundingClientRect().bottom ?? 0
  const panelLeft = root?.querySelector('.cw-panel')?.getBoundingClientRect().left ?? window.innerWidth
  const winH = typeof window !== 'undefined' ? window.innerHeight : 0

  const rawLeft = (paletteRect?.right ?? rect.right) + GAP
  const maxLeft = Math.max(rawLeft, panelLeft - EDGE_MARGIN - PREVIEW_W)
  const minTop = headerBottom + EDGE_MARGIN
  const maxTop = Math.max(minTop, winH - EDGE_MARGIN - PREVIEW_H_EST)

  return {
    left: Math.min(rawLeft, maxLeft),
    top: Math.min(Math.max(rect.top, minTop), maxTop),
  }
}

/* ---------------------------------------------------------------------- */
/* Host — mounted once by Palette.jsx. Presence machine mirrors this        */
/* app's established "freeze last value, animate the delta" idiom           */
/* (nodes/shared.jsx's UpstreamEchoRow, nodes/Reveal.jsx's own mount timing): */
/* `display` keeps showing the last real target through the close fade so   */
/* there's real content to fade OUT, and `mounted` only flips false once    */
/* that fade has actually finished — which is also what keeps this to a     */
/* SINGLE DOM mount across an entire hover-walk (target changes constantly, */
/* `mounted`/`open` don't, so React never remounts the wrapper).            */
/* ---------------------------------------------------------------------- */
export default function PalettePreview() {
  const target = usePreviewTarget()
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const closeTimerRef = useRef(null)
  const rafRef = useRef(null)
  const lastTargetRef = useRef(null)
  if (target) lastTargetRef.current = target

  useEffect(() => {
    if (target) {
      clearTimeout(closeTimerRef.current)
      setMounted(true)
      // Mount closed, THEN flip open a frame later — a class present at
      // first paint never transitions (nothing to transition FROM).
      rafRef.current = requestAnimationFrame(() => setOpen(true))
      return () => cancelAnimationFrame(rafRef.current)
    }
    setOpen(false)
    if (prefersReducedMotion()) {
      setMounted(false)
      return undefined
    }
    closeTimerRef.current = setTimeout(() => setMounted(false), 160)
    return () => clearTimeout(closeTimerRef.current)
  }, [target])

  const display = target || lastTargetRef.current
  if (!mounted || !display) return null

  const workflowRoot = typeof document !== 'undefined' ? document.getElementById('workflow-root') : null
  if (!workflowRoot) return null

  const pos = computePreviewPosition(display.rect)

  return createPortal(
    <div
      className={`cw-palette-preview${open ? ' is-open' : ''}`}
      style={{ left: pos.left, top: pos.top }}
      role="tooltip"
    >
      {display.kind === 'template' ? <TemplatePreviewBody tpl={display.data} /> : <BlockPreviewBody item={display.data} />}
    </div>,
    workflowRoot,
  )
}
