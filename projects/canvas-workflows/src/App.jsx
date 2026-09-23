// Seam B — App core
//
// Builder chrome: the 44px header bar (title + Tidy up / Load from
// instructions / Clear) over the 3-column grid (Palette | FlowCanvas |
// CompiledPanel) — see PLAN.md "## App shell inside the overlay (B)".
//
// RUN PHASE (R4 — "RF functionality pack + run controls", see PLAN.md
// "## RUN PHASE" -> "### R4"). What's new here: the Run/Stop cluster on the
// header bar's right side (`RunControls` below), reading `runState` /
// `runWorkflow` / `stopRun` off R1's context contract. Its styling lives in
// a scoped <style> block inside `RunControls` itself rather than app.css —
// this seam's file grant for this phase is App.jsx/FlowCanvas.jsx/edges/**
// only, so new chrome rules stay local here instead of reaching into B's
// stylesheet. The title dropdown (Tidy up / Load from instructions / Clear)
// is untouched.

import React, { useEffect, useRef, useState } from 'react'
import {
  CaretDown,
  PencilSimple,
  ClipboardText,
  DownloadSimple,
  Globe,
  Megaphone,
  Play,
  RocketLaunch,
  Stop,
  TrashSimple,
  SquaresFour,
  Brain,
  FloppyDisk,
  FolderOpen,
} from '@phosphor-icons/react'

import Palette from './components/Palette.jsx'
import FlowCanvas from './components/FlowCanvas.jsx'
import CompiledPanel from './components/CompiledPanel.jsx'
import { useFlowState } from './state.jsx'
// SAVE PANEL (PLAN.md "## SAVE PANEL — saving a workflow is a moment, not a
// rename") — the runtime-additions store the Files tab (Palette.jsx) reads.
import { addRuntimeFile } from './data/files.js'
// PLATFORM CHROME (PLAN.md "## PLATFORM CHROME — Templates browser, Model
// library, session Workflows"). Each is mounted exactly once, here, and
// independently asks the shared BrowserModal.jsx singleton whether IT is
// the currently-open one — same "mounted once, renders null until asked"
// shape PalettePreview.jsx already established (Palette.jsx mounts that one
// exactly once too).
import TemplatesBrowser from './components/TemplatesBrowser.jsx'
import ModelLibrary from './components/ModelLibrary.jsx'
import WorkflowsLibrary from './components/WorkflowsLibrary.jsx'
import { openBrowser } from './components/BrowserModal.jsx'

// React Flow only ever mounts while the overlay is actually open. Mounting it
// closed — even with visibility:hidden keeping real geometry — wedges its
// measurement pipeline nondeterministically (the initial ResizeObserver
// delivery races the store's domNode registration, and un-measured user nodes
// get their handleBounds re-wiped on every adopt pass), which leaves edges
// permanently unrendered with zero warnings. A fresh mount per open measures
// visible nodes correctly every time; graph state survives in
// FlowStateProvider above, and the per-open fitView is the wanted behavior.
function useOverlayOpen() {
  const [open, setOpen] = useState(() =>
    typeof document !== 'undefined'
      ? !!document.getElementById('workflowOverlay')?.classList.contains('is-open')
      : false,
  )
  useEffect(() => {
    const onToggle = (e) => setOpen(!!e.detail?.open)
    window.addEventListener('omni:workflow-toggle', onToggle)
    return () => window.removeEventListener('omni:workflow-toggle', onToggle)
  }, [])
  return open
}

// RUN PHASE (R4 item 1) — header Run/Stop cluster. `--cw-*` / `--cw-e-*` /
// `--cw-d-*` tokens keep it on-theme (cw-tokens.css / motion.css); literal
// fallbacks match their current Omni Light values in case this ever paints
// before those files finish loading. Entrance (`cw-run-pop`) is transform-
// only and the shimmer's ambient breathe (`cw-run-shimmer-breathe`) is
// opacity-only, deliberately disjoint properties — two `animation`s on the
// SAME property here would hand off with a visible jump the instant the
// one-shot entrance ends, which either the composition order or a delay
// value would only paper over, not fix at the root.
const RUN_CONTROLS_CSS = `
/* Full-height vertical hairline between Share and Run (Bryan). The cluster
   stretches to the header's own height so the rule spans edge to edge without
   hardcoding 64px — change the header height and this still reaches. Buttons
   stay centred via the cluster's own align-items. */
#workflow-root .cw-run-cluster {
  align-self: stretch;
}
#workflow-root .cw-header-rule {
  align-self: stretch;
  flex: 0 0 auto;
  width: var(--cw-hairline-w, .5px);
  background: var(--cw-border-soft, rgba(0, 0, 0, .08));
  margin: 0 4px;
}
#workflow-root .cw-run-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  /* Same box as the Share button (Bryan): 32px tall, radius 8, 16px pads,
     13.5px label. */
  height: 32px;
  padding: 0 16px;
  border: 0 solid transparent;
  border-radius: 8px;
  font-size: 13.5px;
  font-weight: 650;
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  animation: cw-run-pop var(--cw-d-2, 240ms) var(--cw-e-spring, cubic-bezier(.34, 1.56, .64, 1)) both;
  transition:
    transform var(--cw-d-1, 140ms) var(--cw-e-out, cubic-bezier(.22, 1, .36, 1)),
    box-shadow var(--cw-d-1, 140ms) var(--cw-e-out, cubic-bezier(.22, 1, .36, 1)),
    background var(--cw-d-1, 140ms) var(--cw-e-out, cubic-bezier(.22, 1, .36, 1));
}
#workflow-root .cw-run-btn:hover { transform: translateY(-1px); }
#workflow-root .cw-run-btn:active { transform: translateY(0) scale(.96); }
/* White pill, blue icon + label (Bryan) — Share keeps the accent fill as the
   header's one filled button; Run reads as its confident sibling rather than
   a second competing block of blue. */
#workflow-root .cw-run-btn--run {
  background: var(--cw-surface, #fff);
  color: var(--cw-accent, #1858EE);
  border: var(--cw-hairline-w, .5px) solid color-mix(in srgb, var(--cw-accent, #1858EE) 28%, transparent);
  box-shadow: 0 1px 2px rgba(16, 24, 40, .05);
}
#workflow-root .cw-run-btn--run svg { color: var(--cw-accent, #1858EE); }
#workflow-root .cw-run-btn--run:hover {
  background: color-mix(in srgb, var(--cw-accent, #1858EE) 6%, var(--cw-surface, #fff));
  border-color: color-mix(in srgb, var(--cw-accent, #1858EE) 45%, transparent);
}
#workflow-root .cw-run-btn--stop {
  /* --cw-danger-fill, not --cw-danger: white-on-fill needs the
     theme-invariant chip red (the R1 token split) — dark's brightened
     text-red put this button at ~3.4:1 (final-verifier catch, same
     defect class as the issues pill). */
  background: var(--cw-danger-fill, #DC2626);
  color: var(--cw-on-danger-fill, #fff);
  box-shadow: 0 2px 8px color-mix(in srgb, var(--cw-danger-fill, #DC2626) 35%, transparent);
}
#workflow-root .cw-run-btn--stop:hover {
  background: color-mix(in srgb, var(--cw-danger-fill, #DC2626) 85%, black);
}
#workflow-root .cw-run-status {
  display: inline-block;
  font-size: 11.5px;
  font-weight: 650;
  white-space: nowrap;
  animation: cw-run-pop var(--cw-d-2, 240ms) var(--cw-e-spring, cubic-bezier(.34, 1.56, .64, 1)) both;
}
#workflow-root .cw-run-status--paused { color: var(--cw-warn-text, #92400E); }
#workflow-root .cw-run-shimmer {
  color: var(--cw-text-3, #6B7280);
  animation:
    cw-run-pop var(--cw-d-2, 240ms) var(--cw-e-spring, cubic-bezier(.34, 1.56, .64, 1)) both,
    cw-run-shimmer-breathe 1.4s var(--cw-e-inout, cubic-bezier(.65, 0, .35, 1)) infinite;
}
@keyframes cw-run-pop {
  from { transform: scale(.9); }
  to { transform: scale(1); }
}
@keyframes cw-run-shimmer-breathe {
  0%, 100% { opacity: .55; }
  50% { opacity: 1; }
}
/* Out-of-runs — "floor 0 disables all run affordances" (PLAN.md). Same
   dimmed, inert treatment shared.jsx's own ToolbarButton[disabled] uses. */
#workflow-root .cw-run-btn:disabled {
  opacity: 0.5;
  cursor: default;
  pointer-events: none;
}
@media (prefers-reduced-motion: reduce) {
  #workflow-root .cw-run-btn,
  #workflow-root .cw-run-status,
  #workflow-root .cw-run-shimmer {
    animation: none;
  }
  #workflow-root .cw-run-btn:hover,
  #workflow-root .cw-run-btn:active {
    transform: none;
  }
}
`

// Reads R1's context contract (runState/runWorkflow/stopRun — see PLAN.md
// "RUN PHASE" -> "Context additions"); state.jsx itself is out of this
// seam's file grant for this phase, so this only ever consumes, never
// defines, that contract. idle -> a single accent "Run" pill; running -> a
// danger "Stop" pill + a breathing "Running…" label; paused (a human node is
// waiting on input) -> the same "Stop" pill stays available (aborts the
// whole run) next to a static amber "Waiting for you" label. The status
// span is keyed on `runState` so the running<->paused swap replays the pop.
function RunControls() {
  const { runState, runWorkflow, stopRun, runsRemaining } = useFlowState()
  const paused = runState === 'paused'
  const active = runState === 'running' || paused
  const outOfRuns = runsRemaining <= 0

  return (
    <div className="cw-header-actions cw-run-cluster">
      <style>{RUN_CONTROLS_CSS}</style>
      {/* Share + presence (Bryan) — the shell's own pattern, verbatim: a live
          green dot + collaborator count, a facepile that reveals on hover of
          the actions cluster, and the accent-filled primary Share button. The
          workflow is a document like any other canvas, so it carries the same
          affordance. Same three collaborators as the shell's topnav. */}
      <div className="cw-presence" title="3 collaborators in this canvas">
        <div className="cw-presence-stack" aria-hidden="true">
          <span className="cw-pa cw-pa--bc">BC</span>
          <span
            className="cw-pa cw-pa--img"
            style={{ backgroundImage: "url('https://i.pravatar.cc/80?img=47')" }}
          />
          <span
            className="cw-pa cw-pa--img"
            style={{ backgroundImage: "url('https://i.pravatar.cc/80?img=33')" }}
          />
        </div>
        <span className="cw-presence-count">3</span>
      </div>
      <button type="button" className="cw-share-btn">
        Share
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M11.5 5.5L6 8.5M11.5 10.5L6 7.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          <circle cx="12.5" cy="4" r="1.6" stroke="currentColor" strokeWidth="1.2" />
          <circle cx="3.5" cy="8" r="1.6" stroke="currentColor" strokeWidth="1.2" />
          <circle cx="12.5" cy="12" r="1.6" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      </button>
      <span className="cw-header-rule" aria-hidden="true" />
      {active ? (
        <>
          <button type="button" className="cw-run-btn cw-run-btn--stop" onClick={stopRun}>
            <Stop size={13} weight="fill" />
            Stop
          </button>
          <span
            key={runState}
            className={`cw-run-status${paused ? ' cw-run-status--paused' : ' cw-run-shimmer'}`}
            aria-live="polite"
          >
            {paused ? 'Waiting for you' : 'Running…'}
          </span>
        </>
      ) : (
        <button
          type="button"
          className="cw-run-btn cw-run-btn--run"
          onClick={runWorkflow}
          disabled={outOfRuns}
          title={outOfRuns ? 'Out of runs — refresh the demo' : undefined}
        >
          <Play size={13} weight="fill" />
          Run
        </button>
      )}
    </div>
  )
}

// SAVE PANEL — "saved date 'Aug 25'" (PLAN.md, literal). A static string,
// not Date.now() or a relative "just now" — same demoware posture as every
// `saved` value in data/files.js's seed list (that file's own header
// comment: "no persistence, no Date.now, no relative-time strings"). Flagged
// per the plan's own instruction to flag it: a real save-date would need a
// live clock read, deliberately out of scope here.
const SAVE_DATE_LABEL = 'Aug 25'

export default function App() {
  // (Tidy up moved to the canvas rail — FlowCanvas.jsx — so it's no longer here.)
  // SAVED FILES REOPEN (PLAN.md "## SAVED FILES REOPEN") — flagged one-line
  // addition per that phase's own note ("if App.jsx MUST pass the snapshot
  // itself... make the one-line change and flag it"): `edges` joins the
  // destructure so handleSavePanelSave below can hand addRuntimeFile the
  // live graph — data/files.js does the actual snapshot capture/normalize,
  // this file only forwards what it already reads from context.
  const { loadInstructions, clearFlow, loadSample, saveWorkflow, nodes, edges, deliverables } = useFlowState()
  const open = useOverlayOpen()

  // Canvas-style header (Bryan): eyebrow + title-with-caret, actions live in
  // the title dropdown — mirrors the brief headers (workspace eyebrow over a
  // document title) instead of a toolbar row. Menu closes on outside click
  // and Escape.
  const [menuOpen, setMenuOpen] = useState(false)
  // Title rename + a guard on the destructive action (Bryan).
  const [title, setTitle] = useState('Untitled Workflow')
  const [renaming, setRenaming] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)
  // SAVE PANEL (PLAN.md "## SAVE PANEL") — "Save workflow" now opens a real
  // panel (name + optional description + destination line + Cancel/accent-
  // Save) instead of the bare rename-field input this used to open.
  // `savingAs` still gates whether it's open — same trigger sites (menu
  // item, WorkflowsLibrary's empty-state CTA) — `saved` is the brief
  // post-Save confirmation beat (CompiledPanel.jsx's own "Applied ✓" label-
  // swap pattern, reused verbatim rather than inventing a second one).
  const [savingAs, setSavingAs] = useState(false)
  const [saved, setSaved] = useState(false)
  const menuRef = useRef(null)
  const saveNameRef = useRef(null)
  const saveDescRef = useRef(null)
  const saveTimerRef = useRef(null)

  useEffect(() => () => clearTimeout(saveTimerRef.current), [])

  // WorkflowsLibrary.jsx's empty-state "Save workflow as…" CTA closes that
  // modal and asks for this field the same way any other cross-component
  // trigger in this app does (mirrors omni:workflow-toggle/cw:palette-mode's
  // own window-event convention — no shared singleton needed for a single
  // one-shot request).
  useEffect(() => {
    const onOpenSaveWorkflow = () => setSavingAs(true)
    window.addEventListener('cw:open-save-workflow', onOpenSaveWorkflow)
    return () => window.removeEventListener('cw:open-save-workflow', onOpenSaveWorkflow)
  }, [])

  // SAVE PANEL — Esc closes from anywhere in the panel (both fields, both
  // buttons), not just while a single input has focus — same posture as
  // `menuOpen`'s own document-level Escape listener just below. Guarded
  // while the confirmation beat is playing (`saved`) so an Escape mid-beat
  // can't yank the panel out from under its own close timer.
  useEffect(() => {
    if (!savingAs) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape' && !saved) setSavingAs(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [savingAs, saved])

  function closeSavePanel() {
    if (saved) return // let the in-flight confirmation beat finish and self-close
    setSavingAs(false)
  }

  // SAVE PANEL — the actual "moment": update the doc title, keep feeding
  // WorkflowsLibrary's own "Saved" rail via saveWorkflow() exactly like the
  // old bare-rename path did, AND land a session-only row at the top of the
  // palette's Files tab (data/files.js's runtime store) with honest counts
  // read live off the current graph — `nodes`/`deliverables` straight from
  // context, no state.jsx changes needed. `!n.parentId` mirrors
  // saveWorkflow's own nodeCount math in state.jsx (subgraph children don't
  // count as top-level blocks).
  function handleSavePanelSave() {
    if (saved) return // one save per open; a second Enter/click during the beat is a no-op
    const name = saveNameRef.current?.value?.trim() || title
    const description = saveDescRef.current?.value?.trim() || ''
    const nodeCount = nodes.filter((n) => !n.parentId).length
    setTitle(name)
    saveWorkflow(name)
    addRuntimeFile({
      name,
      description,
      meta: { nodes: nodeCount, deliverables: deliverables.length, saved: SAVE_DATE_LABEL },
      // SAVED FILES REOPEN — the other flagged half of the one-line change:
      // without these two, addRuntimeFile still adds a row (files.js's own
      // optional-args posture) but it has no snapshot, so the row can never
      // reopen — this is the fix for exactly that gap.
      nodes,
      edges,
    })
    setSaved(true)
    clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      setSaved(false)
      setSavingAs(false)
    }, 900)
  }
  useEffect(() => {
    if (!menuOpen) return
    const onDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])
  const runAction = (fn) => () => {
    setMenuOpen(false)
    fn()
  }

  return (
    <div className="cw-app">
      <header className="cw-header">
        <div className="cw-header-left" ref={menuRef}>
          <div className="cw-header-eyebrow">
            Workflow builder
          </div>
          <button
            type="button"
            className="cw-header-titlebtn"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {title}
            <CaretDown size={13} weight="bold" className={menuOpen ? 'is-open' : ''} />
          </button>
          {menuOpen ? (
            <div className="cw-header-menu" role="menu">
              <button
                type="button"
                role="menuitem"
                className="cw-menu-item"
                onClick={() => {
                  setMenuOpen(false)
                  setRenaming(true)
                }}
              >
                <PencilSimple size={14} weight="regular" />
                Rename
              </button>
              <button type="button" role="menuitem" className="cw-menu-item" onClick={runAction(loadInstructions)}>
                <DownloadSimple size={14} weight="regular" />
                Load from instructions
              </button>
              <div className="cw-menu-divider" aria-hidden="true" />
              {/* PLATFORM CHROME — browse/library entry points. */}
              <button type="button" role="menuitem" className="cw-menu-item" onClick={runAction(() => openBrowser('templates'))}>
                <SquaresFour size={14} weight="regular" />
                Browse templates
              </button>
              <button type="button" role="menuitem" className="cw-menu-item" onClick={runAction(() => openBrowser('models'))}>
                <Brain size={14} weight="regular" />
                Browse models
              </button>
              <button
                type="button"
                role="menuitem"
                className="cw-menu-item"
                onClick={() => { setMenuOpen(false); setSavingAs(true) }}
              >
                <FloppyDisk size={14} weight="regular" />
                Save workflow as…
              </button>
              <button type="button" role="menuitem" className="cw-menu-item" onClick={runAction(() => openBrowser('workflows'))}>
                <FolderOpen size={14} weight="regular" />
                Workflows
              </button>
              <div className="cw-menu-divider" aria-hidden="true" />
              <button
                type="button"
                role="menuitem"
                className="cw-menu-item cw-menu-item--danger"
                onClick={() => { setMenuOpen(false); setConfirmClear(true) }}
              >
                <TrashSimple size={14} weight="regular" />
                Clear
              </button>
            </div>
          ) : null}
        </div>
        <RunControls />
      </header>

      {renaming ? (
        <div className="cw-rename-wrap">
          <input
            className="cw-rename-input"
            autoFocus
            defaultValue={title}
            onBlur={(e) => { setTitle(e.target.value.trim() || title); setRenaming(false) }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { setTitle(e.target.value.trim() || title); setRenaming(false) }
              if (e.key === 'Escape') setRenaming(false)
            }}
          />
        </div>
      ) : null}

      {/* SAVE PANEL (PLAN.md "## SAVE PANEL") — the app's modal family
          verbatim: .cw-confirm-overlay's backdrop + spring-in card (same
          shape Clear-canvas and Load-workflow already use), with its own
          .cw-save-card content since a name/description field stack needs
          more room than a one-line confirm question. Backdrop click cancels
          (stopPropagation on the card itself, same as WorkflowsLibrary's own
          confirm dialog); Esc handled by the document-level listener above;
          Enter in either field saves. */}
      {savingAs ? (
        <div className="cw-confirm-overlay" role="dialog" aria-modal="true" aria-label="Save workflow" onClick={closeSavePanel}>
          <div className="cw-save-card" onClick={(e) => e.stopPropagation()}>
            <div className="cw-save-header">
              <span className="cw-save-icon" aria-hidden="true">
                <FloppyDisk size={14} weight="regular" />
              </span>
              <h2 className="cw-confirm-title">Save workflow</h2>
            </div>

            <label className="cw-save-field">
              <span className="cw-save-label">Name</span>
              <input
                ref={saveNameRef}
                className="cw-save-input"
                autoFocus
                defaultValue={title}
                onFocus={(e) => e.target.select()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); handleSavePanelSave() }
                  if (e.key === 'Escape') closeSavePanel()
                }}
              />
            </label>

            <label className="cw-save-field">
              <span className="cw-save-label">
                Description <span className="cw-save-label-optional">(optional)</span>
              </span>
              <input
                ref={saveDescRef}
                className="cw-save-input"
                placeholder="What does this workflow do?"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); handleSavePanelSave() }
                  if (e.key === 'Escape') closeSavePanel()
                }}
              />
            </label>

            <p className="cw-save-destination">
              <FolderOpen size={12} weight="regular" aria-hidden="true" />
              Saves to your Files
            </p>

            <div className="cw-confirm-actions">
              <button type="button" className="cw-btn-quiet" onClick={closeSavePanel}>
                Cancel
              </button>
              <button
                type="button"
                className={`cw-apply-btn cw-save-go${saved ? ' is-applied' : ''}`}
                onClick={handleSavePanelSave}
              >
                <span className="cw-apply-btn-label" key={saved ? 'saved' : 'idle'}>
                  {saved ? 'Saved ✓' : 'Save'}
                </span>
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {confirmClear ? (
        <div className="cw-confirm-overlay" role="dialog" aria-modal="true" aria-label="Clear the canvas?">
          <div className="cw-confirm-card">
            <h2 className="cw-confirm-title">Clear the canvas?</h2>
            {/* No undo reassurance (Bryan: "this action should be
                considered permanent") — the softener invited casual
                clears. Deliberately silent about undo rather than
                claiming "can't be undone": Cmd+Z does still quietly
                work as an accident net, the dialog just stops
                advertising it. */}
            <p className="cw-confirm-body">
              This removes every block and connection on the canvas.
            </p>
            <div className="cw-confirm-actions">
              <button type="button" className="cw-btn-quiet" onClick={() => setConfirmClear(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="cw-btn-quiet cw-btn-quiet--danger cw-confirm-go"
                onClick={() => { clearFlow(); setConfirmClear(false) }}
              >
                <TrashSimple size={14} weight="regular" />
                Clear canvas
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* PLATFORM CHROME — mounted once; each renders null until its own
          `openBrowser(kind)` matches (see BrowserModal.jsx's own header
          comment on the shared open/close singleton). */}
      <TemplatesBrowser />
      <ModelLibrary />
      <WorkflowsLibrary />

      <div className="cw-body">
        <Palette />
        {open ? <FlowCanvas /> : <div className="cw-canvas-wrap" />}
        <CompiledPanel />
      </div>
    </div>
  )
}
