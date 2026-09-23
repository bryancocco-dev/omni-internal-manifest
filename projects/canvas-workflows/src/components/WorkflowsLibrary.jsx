// PLATFORM CHROME (PLAN.md "## PLATFORM CHROME" -> "### 3 — Session
// Workflows library"). Thin data adapter over BrowserModal.jsx's shared
// shell — same chrome as TemplatesBrowser.jsx, two data sources instead of
// one: `savedWorkflows` (state.jsx, session-only, never localStorage) and
// Wave 5's four showcase templates surfaced as "Starter workflows" (NOT the
// hidden ?flow= easter eggs — those stay hidden per the no-visible-demo-
// switchers doctrine; this is the real, always-in-catalog template roster).
//
// Every card in this modal — saved OR starter — LOADS (replaces the whole
// canvas), never inserts/merges: that's the one behavior this library is
// for, and applying it uniformly means a user never has to remember which
// kind of card in the same grid does which thing. Templates browser keeps
// the separate insert-and-merge behavior for the SAME four templates when
// reached from there instead — two different libraries, two different
// verbs, by design.

import { useEffect, useRef, useState } from 'react'
import { FolderOpen, FloppyDisk } from '@phosphor-icons/react'

import { TEMPLATES } from '../data/templates/index.js'
import { getTemplateMiniGraph, MiniGraphThumb } from '../run/miniGraph.js'
import { useFlowState } from '../state.jsx'
import BrowserModal, { useBrowserKind, closeBrowser } from './BrowserModal.jsx'

// Wave 5's own four showcase templates (PLAN.md "### WAVE 5 — SHOWCASE +
// INTEGRATED VERIFY" template pack), by their stable ids (data/templates/
// part-a.js). Hand-picked literal list rather than a data-file flag — these
// four are named explicitly in the spec and nowhere else in the catalog
// marks itself "showcase," so this is the one true source for the set.
const SHOWCASE_IDS = ['launch-with-guardrails', 'localize-and-gather', 'measure-and-optimize', 'ab-the-launch']
const STARTER_TEMPLATES = TEMPLATES.filter((tpl) => SHOWCASE_IDS.includes(tpl.id))

function relativeTime(ms) {
  const diff = Math.max(0, Date.now() - ms)
  const min = Math.round(diff / 60000)
  if (min < 1) return 'just now'
  if (min === 1) return '1m ago'
  if (min < 60) return `${min}m ago`
  const hr = Math.round(min / 60)
  if (hr < 24) return `${hr}h ago`
  return `${Math.round(hr / 24)}d ago`
}

export default function WorkflowsLibrary() {
  const open = useBrowserKind() === 'workflows'
  const { savedWorkflows, loadWorkflowRecord } = useFlowState()
  const [search, setSearch] = useState('')
  const [section, setSection] = useState('all') // 'all' | 'saved' | 'starter'
  const [confirmRecord, setConfirmRecord] = useState(null)
  const tickRef = useRef(0)
  const [, setTick] = useState(0)

  // "saved Xm ago via a session clock" (PLAN.md) — re-render on an interval
  // while the modal is open so the relative-time strings stay fresh without
  // needing their own per-card timers.
  useEffect(() => {
    if (!open) return undefined
    const id = setInterval(() => {
      tickRef.current += 1
      setTick(tickRef.current)
    }, 30000)
    return () => clearInterval(id)
  }, [open])

  const q = search.trim().toLowerCase()
  const filteredSaved = savedWorkflows.filter((w) => !q || w.name.toLowerCase().includes(q))
  const filteredStarter = STARTER_TEMPLATES.filter(
    (tpl) => !q || tpl.name.toLowerCase().includes(q) || tpl.blurb.toLowerCase().includes(q),
  )
  const showSaved = section !== 'starter'
  const showStarter = section !== 'saved'

  function confirmLoad() {
    if (confirmRecord) loadWorkflowRecord(confirmRecord)
    setConfirmRecord(null)
    closeBrowser()
  }

  const rail = (
    <>
      <button type="button" className={`cw-bmodal-rail-cat${section === 'all' ? ' is-active' : ''}`} onClick={() => setSection('all')}>
        <span>All</span>
        <span className="cw-bmodal-rail-count">{savedWorkflows.length + STARTER_TEMPLATES.length}</span>
      </button>
      <button type="button" className={`cw-bmodal-rail-cat${section === 'saved' ? ' is-active' : ''}`} onClick={() => setSection('saved')}>
        <span>Saved</span>
        <span className="cw-bmodal-rail-count">{savedWorkflows.length}</span>
      </button>
      <button type="button" className={`cw-bmodal-rail-cat${section === 'starter' ? ' is-active' : ''}`} onClick={() => setSection('starter')}>
        <span>Starter workflows</span>
        <span className="cw-bmodal-rail-count">{STARTER_TEMPLATES.length}</span>
      </button>
    </>
  )

  return (
    <BrowserModal
      open={open}
      onClose={closeBrowser}
      icon={FolderOpen}
      title="Workflows"
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search workflows..."
      rail={rail}
      ariaLabel="Workflows"
    >
      {showSaved ? (
        <>
          <div className="cw-section-label">Saved ({savedWorkflows.length})</div>
          {savedWorkflows.length === 0 && !q ? (
            // "the ONLY exception to normal empty-state absence rules"
            // (PLAN.md) — a first-run affordance, not a data section.
            <div className="cw-bmodal-empty">
              <p>No saved workflows yet.</p>
              <button
                type="button"
                className="cw-bmodal-empty-cta"
                onClick={() => {
                  closeBrowser()
                  window.dispatchEvent(new CustomEvent('cw:open-save-workflow'))
                }}
              >
                <FloppyDisk size={13} weight="regular" />
                Save workflow as…
              </button>
            </div>
          ) : filteredSaved.length ? (
            <div className="cw-bmodal-grid">
              {filteredSaved.map((w) => (
                <button key={w.id} type="button" className="cw-bcard" onClick={() => setConfirmRecord(w)}>
                  <span className="cw-bcard-thumb">
                    <MiniGraphThumb data={w.thumb} />
                  </span>
                  <span className="cw-bcard-title">{w.name}</span>
                  <span className="cw-bcard-meta">
                    <span className="cw-bcard-count">{relativeTime(w.savedAt)}</span>
                    <span className="cw-bcard-count">{w.nodeCount} blocks</span>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <p className="cw-bmodal-empty">No saved workflows match "{search}".</p>
          )}
        </>
      ) : null}

      {showStarter && filteredStarter.length ? (
        <>
          <div className="cw-section-label">Starter workflows ({filteredStarter.length})</div>
          <div className="cw-bmodal-grid">
            {filteredStarter.map((tpl) => {
              const thumb = getTemplateMiniGraph(tpl)
              return (
                <button
                  key={tpl.id}
                  type="button"
                  className="cw-bcard"
                  // Fresh build() at click time, not the cached thumbnail's
                  // graph — that object is a shared, memoized, session-long
                  // singleton (miniGraph.js's own template cache); loading it
                  // directly would hand React Flow's live store a reference
                  // it can mutate (measured/position), corrupting the
                  // "pristine starter" on a later re-open. insertTemplate
                  // elsewhere in this app already rebuilds fresh per call for
                  // the identical reason.
                  onClick={() => setConfirmRecord({ id: tpl.id, name: tpl.name, snapshot: tpl.build() })}
                >
                  <span className="cw-bcard-thumb">
                    <MiniGraphThumb data={thumb} />
                  </span>
                  <span className="cw-bcard-title">{tpl.name}</span>
                  <span className="cw-bcard-blurb">{tpl.blurb}</span>
                  <span className="cw-bcard-meta">
                    <span className="cw-bcard-count">{tpl.size} blocks</span>
                  </span>
                </button>
              )
            })}
          </div>
        </>
      ) : null}

      {showSaved && showStarter && !filteredSaved.length && !filteredStarter.length && q && savedWorkflows.length ? (
        <p className="cw-bmodal-empty">No workflows match "{search}".</p>
      ) : null}

      {confirmRecord ? (
        <div
          className="cw-confirm-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={`Load "${confirmRecord.name}"?`}
          onClick={() => setConfirmRecord(null)}
        >
          <div className="cw-confirm-card" onClick={(e) => e.stopPropagation()}>
            <h2 className="cw-confirm-title">Load "{confirmRecord.name}"?</h2>
            <p className="cw-confirm-body">
              This replaces everything on the canvas. You can undo it with Cmd&nbsp;+&nbsp;Z.
            </p>
            <div className="cw-confirm-actions">
              <button type="button" className="cw-btn-quiet" onClick={() => setConfirmRecord(null)}>
                Cancel
              </button>
              <button type="button" className="cw-btn-quiet cw-confirm-go" onClick={confirmLoad}>
                Load workflow
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </BrowserModal>
  )
}
