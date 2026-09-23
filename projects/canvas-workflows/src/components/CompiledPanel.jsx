// Seam B — App core
//
// Only the slim top of the right panel —
// header, Apply button, issues, and the count sections (SUBAGENTS/KNOWLEDGE
// BASES/TOOLS/SKILLS/FILES). SYSTEM_PROMPT/WORKFLOW_JSON are intentionally
// never rendered here.
//
// COMPILED PANEL TRUTH PASS (PLAN.md) — FILES is new: Tasks can attach kind
// 'File' via their own +File chip, and this panel had nowhere to show it.
// Appended last (same CountSection, same "—" empty state as every other
// section) — see state.jsx's computeCompiledCounts for where files, and
// agent-implied uses, actually get folded into these arrays.
//
// MOTION PHASE item 6 (PLAN.md "### M3" -> chrome physics): the Apply
// button's label lives in its own <span> keyed on `applied` so toggling it
// remounts that span — replaying app.css's slide-in mount animation, i.e.
// the "label slide-swap" — and its accent ring pulse is a plain `.is-applied`
// class driving a ::after in app.css. Count-section chip pop-in needs no
// JS at all: CountSection already keys each <span> on its own name, so a
// brand-new chip mounting fresh is what replays app.css's pop keyframe.

import React, { useEffect, useRef, useState } from 'react'
import { DownloadSimple, SquaresFour } from '@phosphor-icons/react'
import { useFlowState, deliverableDescriptor, nodeNumberToken, deliverableName } from '../state.jsx'
// DELIVERABLES IN THE PANEL (PLAN.md "## DELIVERABLES IN THE PANEL") — "a
// 34px artifact thumb (same SVG renderers...)" for every row, whatever the
// output's format — artifacts.jsx's own header comment establishes that even
// TEXT_FORMATS (Text/Email/Teams/Doc, which the live OutputNode card shows as
// real streamed text) get one of these for THEIR thumbnail, since a tiny
// thumb of literal paragraph text is illegible; `poster` (VARIANT STUDIO's
// Ridgeline Roast mints) is the one split, same as OutputNode.jsx's own
// `output?.poster` branch. Downloads reuse DELIVERABLE DOWNLOADS' own
// pure-function pipeline verbatim — no fork.
import Artifact from '../run/artifacts.jsx'
import Poster from '../run/posters.jsx'
import { downloadArtifact, downloadAllArtifacts } from '../run/download.js'
// FQ-C item 2 (PLAN.md "### FQ-C — OPEN ASKS") — "Copy prompt"/"Copy
// workflow", the two quiet text actions under Apply to session. Prompt
// composition is its own pure helper (new file, sessionPrompt.js — see its
// header comment); the JSON side needs no helper, it's `{nodes, edges}`
// pretty-printed, the same {nodes,edges} shape state.jsx's own
// captureSnapshot/saveWorkflow already treat as "the graph".
import { composeSessionPrompt } from '../run/sessionPrompt.js'

function CountSection({ title, items }) {
  return (
    <div className="cw-count-section">
      {/* E1 item 4 — count right-aligned (tabular) instead of inline "(n)". */}
      <div className="cw-section-label cw-section-label--row">
        <span>{title}</span>
        <span className="cw-count-num">{items.length}</span>
      </div>
      {items.length === 0 ? (
        <div className="cw-dash">—</div>
      ) : (
        <div className="cw-chip-row">
          {items.map((name) => (
            <span className="cw-chip" key={name}>
              {name}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// DELIVERABLES A+C (PLAN.md "## DELIVERABLES A+C") — `deliverableDescriptor`/
// `nodeNumberToken` moved to state.jsx (imported above) so this view (A) and
// the new gallery shelf (C, DeliverablesShelf.jsx) share ONE copy instead of
// two that could drift — "share them via state, do not fork" (PLAN.md). See
// their own header comments there for the full rationale (download.js's own
// nodeNumberToken mirror is a DIFFERENT, deliberately-kept duplicate — a
// cross-SEAM one, not a same-feature fork).

// One row = one output node with real version history. Structured like
// FlowCanvas.jsx's own `.cw-issues-popover-row` (that file's header comment:
// "a DIV role=button... wraps a real nested <button>... buttons can't
// nest") — this row is ALSO a click-to-glide jump link that carries a real
// nested download <button>, so it borrows that exact shape rather than
// re-solving the same button-in-button problem a second way.
//
// DELIVERABLES A+C — `onOpen` is state.jsx's shared `openDeliverable`
// (glide + open RunPreview), not a bare focus/glide-only jump anymore —
// "click = glide + preview (identical handlers to panel rows — share them
// via state, do not fork)" (PLAN.md). DeliverablesShelf.jsx's own thumb
// calls the exact same function.
function DeliverableRow({ node, onOpen }) {
  const output = node.data?.output || {}
  const versions = node.data?.versions || []
  const format = output.format || node.data?.format || 'Text'
  const seed = output.seed ?? 0
  const description = node.data?.description?.trim() || 'No description yet'

  const open = () => onOpen(node.id)
  const handleDownload = (e) => {
    // Row click (the same focusIssue-style glide every other panel jump-link
    // uses) must not ALSO fire — same guard as the issues popover's own Fix
    // button beside its row click.
    e.stopPropagation()
    downloadArtifact(deliverableDescriptor(node))
  }

  return (
    <div
      role="button"
      tabIndex={0}
      className="cw-deliverable-row"
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          open()
        }
      }}
      title="Show me"
    >
      <span className="cw-deliverable-thumb" aria-hidden="true">
        {output.poster ? (
          <Poster seed={seed} compact className="cw-deliverable-thumb-art" />
        ) : (
          <Artifact format={format} seed={seed} compact className="cw-deliverable-thumb-art" />
        )}
      </span>
      <span className="cw-deliverable-copy">
        {/* Same naming as the shelf's caption — the two views of this one
            feature must not drift (see state.jsx's `deliverableName`). */}
        <span className="cw-deliverable-title">{deliverableName(format)}</span>
        <span className="cw-deliverable-desc">{description}</span>
      </span>
      <span className="cw-deliverable-side">
        {/* "hidden when v1 only" (PLAN.md) — versions.length IS the current/
            latest version number (engine.js appends the live take to BOTH
            `data.output` and `data.versions` in the same patch, so the two
            never disagree on "what's current"). Keyed on the count itself —
            a re-run that grows this array remounts just this chip, replaying
            its own pop-in ("re-runs bump version chips in place", PLAN.md)
            without touching the row's own stable identity/entrance below. */}
        {versions.length > 1 ? (
          <span className="cw-deliverable-version" key={versions.length}>
            v{versions.length}
          </span>
        ) : null}
        <button
          type="button"
          className="cw-deliverable-dl"
          onClick={handleDownload}
          aria-label={`Download ${format}`}
          title="Download"
        >
          <DownloadSimple weight="bold" size={12} />
        </button>
      </span>
    </div>
  )
}

// DELIVERABLES IN THE PANEL (PLAN.md "## DELIVERABLES IN THE PANEL — the
// roll-up finds its true home") — "the standing right panel is NAMED
// 'Compiled output' — the run's yield belongs in it." Same `.cw-count-
// section` rhythm (margin/hairline) as SUBAGENTS/KNOWLEDGE BASES/etc. below
// it, positioned directly under the issues block (CompiledPanel's own JSX
// order) — "the yield is the headline of a completed run; params read below
// it." Returns null outright when nothing has ever delivered — "absence is
// correct here; the panel returns to pure session-params reading" (no "—"
// dash unlike every OTHER section's empty state, which explicitly keeps its
// row visible).
// DELIVERABLES A+C — `shelfOpen`/`onToggleShelf` add the one new control
// this dispatch grants the panel: "a small GALLERY toggle (SquaresFour 13,
// quiet icon button beside Download all, aria-pressed) that opens/closes the
// shelf" (PLAN.md). Living INSIDE this same `if (!items.length) return null`
// gate is exactly "Empty record → shelf cannot open, toggle disabled
// quietly" — there's no separate disabled-but-visible state to build; the
// toggle simply doesn't exist yet, same "absence is correct here" posture
// this section's own empty state already established.
function DeliverablesSection({ items, onOpen, shelfOpen, onToggleShelf }) {
  if (!items.length) return null

  const handleDownloadAll = () => {
    downloadAllArtifacts(items.map(deliverableDescriptor))
  }

  return (
    <div className="cw-count-section">
      <div className="cw-section-label cw-section-label--row">
        <span>DELIVERABLES</span>
        <span className="cw-deliverables-head-right">
          <span className="cw-count-num">{items.length}</span>
          <button type="button" className="cw-deliverables-dlall" onClick={handleDownloadAll}>
            Download all
          </button>
          <button
            type="button"
            className="cw-deliverables-gallery"
            onClick={onToggleShelf}
            aria-pressed={shelfOpen}
            aria-label={shelfOpen ? 'Hide gallery' : 'Show gallery'}
            title={shelfOpen ? 'Hide gallery' : 'Show gallery'}
          >
            <SquaresFour weight={shelfOpen ? 'fill' : 'regular'} size={13} />
          </button>
        </span>
      </div>
      <div className="cw-deliverables-list">
        {items.map((node) => (
          // Keyed on nodeId alone (stable across re-runs) — this is the
          // "chip-pop entrance per row, the panel's existing keyed-mount
          // language" (PLAN.md): a row with an id never seen before mounts
          // fresh and plays app.css's cw-chip-pop; an id already on screen
          // re-renders the SAME element in place (new content, no remount,
          // no replayed entrance) exactly like CountSection's own chips.
          <DeliverableRow key={node.id} node={node} onOpen={onOpen} />
        ))}
      </div>
    </div>
  )
}

export default function CompiledPanel() {
  // DELIVERABLES A+C — `deliverables`/`shelfOpen`/`setShelfOpen`/
  // `openDeliverable` now come straight from state.jsx (the shared
  // selector + shelf toggle both views read/write — see that file's own
  // header comments) instead of this component deriving its own copy off
  // `nodes`/`deliveryOrder`; DeliverablesShelf.jsx reads the exact same
  // values off the exact same context.
  const { nodes, edges, issues, counts, focusIssue, deliverables, shelfOpen, setShelfOpen, openDeliverable } =
    useFlowState()
  const [applied, setApplied] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const timerRef = useRef(null)
  // FQ-C item 2 — same keyed-remount pattern as `applied`/`timerRef` above,
  // just two independent copies so copying one action's text never resets
  // the other's "Copied ✓" window mid-flight.
  const [copiedPrompt, setCopiedPrompt] = useState(false)
  const [copiedWorkflow, setCopiedWorkflow] = useState(false)
  const promptTimerRef = useRef(null)
  const workflowTimerRef = useRef(null)

  useEffect(
    () => () => {
      clearTimeout(timerRef.current)
      clearTimeout(promptTimerRef.current)
      clearTimeout(workflowTimerRef.current)
    },
    [],
  )

  // Publish the panel's effective width so anything anchored to its edge —
  // the chat hat's right offset, the minimap's clearance — slides with it
  // instead of stranding beside a hidden panel. One source of truth, set on
  // the same root every builder stylesheet already reads from.
  useEffect(() => {
    const root = document.getElementById('workflow-root')
    if (root) root.style.setProperty('--cw-panel-w', collapsed ? '38px' : '288px')
  }, [collapsed])

  const handleApply = () => {
    setApplied(true)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setApplied(false), 1500)
  }

  // FQ-C item 2 — "Copy prompt"/"Copy workflow": navigator.clipboard, then
  // the exact same 1.5s "Copied ✓" swap `handleApply` above already does.
  // The clipboard write only flips the label on success — a rejected/denied
  // write (no permission, no secure context) leaves the idle label up rather
  // than lying about what happened.
  const handleCopyPrompt = async () => {
    const text = composeSessionPrompt(nodes, counts)
    try {
      await navigator.clipboard.writeText(text)
    } catch (err) {
      console.error('Copy prompt failed', err)
      return
    }
    setCopiedPrompt(true)
    clearTimeout(promptTimerRef.current)
    promptTimerRef.current = setTimeout(() => setCopiedPrompt(false), 1500)
  }

  const handleCopyWorkflow = async () => {
    const text = JSON.stringify({ nodes, edges }, null, 2)
    try {
      await navigator.clipboard.writeText(text)
    } catch (err) {
      console.error('Copy workflow failed', err)
      return
    }
    setCopiedWorkflow(true)
    clearTimeout(workflowTimerRef.current)
    workflowTimerRef.current = setTimeout(() => setCopiedWorkflow(false), 1500)
  }

  return (
    <>
      <aside className={`cw-panel${collapsed ? ' is-collapsed' : ''}`} aria-label="Compiled output">
      <div className="cw-panel-headrow">
        <h2>Compiled output</h2>
        <span className="cw-mono-tag">switch_session_params</span>
      </div>

      <button
        type="button"
        className={`cw-apply-btn${applied ? ' is-applied' : ''}`}
        onClick={handleApply}
      >
        <span className="cw-apply-btn-label" key={applied ? 'applied' : 'idle'}>
          {applied ? 'Applied ✓' : 'Apply to session'}
        </span>
      </button>

      {/* FQ-C item 2 — "two quiet text buttons under Apply to session."
          Label spans reuse .cw-apply-btn-label verbatim (same slide-in
          keyframe, same reduced-motion override already scoped to that
          class) rather than a second copy of the same animation. */}
      <div className="cw-panel-copy-row">
        <button type="button" className="cw-panel-copy-btn" onClick={handleCopyPrompt}>
          <span className="cw-apply-btn-label" key={copiedPrompt ? 'copied' : 'idle'}>
            {copiedPrompt ? 'Copied ✓' : 'Copy prompt'}
          </span>
        </button>
        <button type="button" className="cw-panel-copy-btn" onClick={handleCopyWorkflow}>
          <span className="cw-apply-btn-label" key={copiedWorkflow ? 'copied' : 'idle'}>
            {copiedWorkflow ? 'Copied ✓' : 'Copy workflow'}
          </span>
        </button>
      </div>

      <div className="cw-hairline" />

      <div className="cw-issues">
        {issues.length === 0 ? (
          <div className="cw-issue-none">No issues detected.</div>
        ) : (
          issues.map((issue) => (
            <button
              type="button"
              className="cw-issue-row"
              key={issue.id}
              onClick={() => focusIssue(issue.nodeId)}
              title="Show me"
            >
              <span className="cw-issue-dot" aria-hidden="true" />
              <span>{issue.text}</span>
            </button>
          ))
        )}
      </div>

      {/* DELIVERABLES section removed (Bryan, 2026-08-20): the docked
          gallery shelf is now the ONE view of the delivered record — two
          views of one store collapsed to one after the shelf became a
          true always-available panel with its own handle. The shared
          handlers (openDeliverable, deliveryOrder) live on in state.jsx,
          consumed by the shelf alone. */}

      <CountSection title="SUBAGENTS" items={counts.subagents} />
      <CountSection title="KNOWLEDGE BASES" items={counts.knowledgeBases} />
      <CountSection title="TOOLS" items={counts.tools} />
      <CountSection title="SKILLS" items={counts.skills} />
      <CountSection title="FILES" items={counts.files} />
      {/* MODEL-AGNOSTIC POSTURE (PLAN.md "### QUEUED PHASE — MODEL FABRIC")
          — "Compiled panel: MODELS row (distinct, from tasks' explicit
          picks + generates), folds into the switch_session_params story."
          Same CountSection chrome as every section above; "—" when every
          Task is still on Auto and no Generate node exists. */}
      <CountSection title="MODELS" items={counts.models} />
      {/* COMFY ROUND (CP2, item 5) — "PARAM NODE": "params fold into a
          PARAMETERS row" (PLAN.md). Grouped with the other content-summary
          sections above. */}
      <CountSection title="PARAMETERS" items={counts.params} />
    </aside>

      {/* Same rail-handle pill as the palette's, mirrored onto this panel's
          hairline. Rendered OUTSIDE the panel so it stays reachable once the
          panel slides away. */}
      <button
        type="button"
        className="cw-panel-handle cw-panel-handle--right"
        style={{ right: collapsed ? 38 : 288 }}
        aria-label={collapsed ? 'Show compiled output' : 'Hide compiled output'}
        aria-expanded={!collapsed}
        title={collapsed ? 'Show compiled output' : 'Hide compiled output'}
        onClick={() => setCollapsed((v) => !v)}
      >
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </>
  )
}
