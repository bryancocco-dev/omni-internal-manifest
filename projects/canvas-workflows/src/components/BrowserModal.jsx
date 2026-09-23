// PLATFORM CHROME (PLAN.md "## PLATFORM CHROME — Templates browser, Model
// library, session Workflows"). Three modals (Templates/Models/Workflows)
// share one shell rather than three forked ones — architecture call stated
// in the phase report: the three surfaces differ only in WHAT they browse
// (a category+Contains rail vs. provider folders vs. saved/starter
// sections) and HOW a card inserts, never in the chrome around that
// content — portal target, backdrop, card frame, header, search field,
// Esc/outside-click dismiss, and the optional rail+grid two-pane body are
// completely generic. `TemplatesBrowser.jsx`/`ModelLibrary.jsx`/
// `WorkflowsLibrary.jsx` are thin data adapters: each computes its own
// filtered/grouped rows and hands this component a `rail` node and grid
// `children`, nothing more.
//
// Chrome is a direct sibling of RunPreview.jsx's own modal (that file's own
// header/CSS comments explain the reasoning this one shares: portal to
// #workflow-root to escape React Flow's transform + .cw-canvas-wrap's clip
// while staying inside the --cw-* theme scope; the mount/closing local
// presence machine so a close always plays its exit instead of hard-
// unmounting — DESIGN BAR item 4, "exits for every unmount"). Two
// deliberate departures from RunPreview's own copy of that machine:
//   1. Esc is a document CAPTURE listener with stopPropagation (matching
//      BlockPicker.jsx/ComboBox.jsx's established convention for every OTHER
//      popover in this app) rather than a bubble listener — RunPreview's own
//      bubble listener never stops propagation, so an Esc that closes it
//      ALSO reaches the shell's (index.html) document-level overlay-close
//      listener and dumps the user out of the whole builder in the same
//      keystroke. Not this component's bug to inherit.
//   2. Outside-click closes via the overlay's own onClick (RunPreview's
//      exact approach) — correct here too, since a true modal has no
//      "ghost button" exceptions to carve out the way BlockPicker's popover
//      does.
//
// Open/close state — "which browser modal, if any, is open" — is a single
// module-level singleton, not React context: mirrors PalettePreview.jsx's
// own hover-intent store (useSyncExternalStore over plain module state) so
// any file can call `openBrowser('templates' | 'models' | 'workflows')`
// without a provider in the tree. The three adapters below are each mounted
// exactly once (App.jsx, alongside the existing rename/confirm-clear
// overlays) and independently ask `useBrowserKind()` whether THEY are the
// open one — same "mounted once, renders null until asked" shape
// PalettePreview.jsx already established for its own singleton-backed panel.

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import { MagnifyingGlass, X } from '@phosphor-icons/react'

import './../styles/browsermodal.css'

let currentKind = null
const kindListeners = new Set()
function emitKind() {
  kindListeners.forEach((fn) => fn())
}
function subscribeKind(fn) {
  kindListeners.add(fn)
  return () => kindListeners.delete(fn)
}
function getKindSnapshot() {
  return currentKind
}
export function openBrowser(kind) {
  currentKind = kind
  emitKind()
}
export function closeBrowser() {
  currentKind = null
  emitKind()
}
export function useBrowserKind() {
  return useSyncExternalStore(subscribeKind, getKindSnapshot, getKindSnapshot)
}

const CLOSE_MS = 220 // matches browsermodal.css's cw-bmodal-card-out duration

export default function BrowserModal({
  open,
  onClose,
  icon: Icon,
  title,
  tag,
  search,
  onSearchChange,
  searchPlaceholder = 'Search...',
  rail,
  toolbar,
  children,
  ariaLabel,
}) {
  const [mounted, setMounted] = useState(open)
  const [closing, setClosing] = useState(false)
  const mountedRef = useRef(open)
  const closeTimerRef = useRef(null)
  const searchRef = useRef(null)

  useEffect(() => {
    if (open) {
      clearTimeout(closeTimerRef.current)
      mountedRef.current = true
      setClosing(false)
      setMounted(true)
      // Autofocus search on open, one frame late (same reasoning
      // ComboBox.jsx's openCombo gives for its own post-render .select()) —
      // matches every other single-field search this app autofocuses.
      requestAnimationFrame(() => searchRef.current?.focus())
    } else if (mountedRef.current) {
      setClosing(true)
      closeTimerRef.current = setTimeout(() => {
        mountedRef.current = false
        setMounted(false)
        setClosing(false)
      }, CLOSE_MS)
    }
  }, [open])

  useEffect(() => () => clearTimeout(closeTimerRef.current), [])

  // Esc — capture + stopPropagation; see this file's own header comment for
  // why (RunPreview's bubble-only equivalent double-closes the builder).
  useEffect(() => {
    if (!mounted) return undefined
    const onKeyDownCapture = (event) => {
      if (event.key !== 'Escape') return
      event.stopPropagation()
      onClose?.()
    }
    document.addEventListener('keydown', onKeyDownCapture, true)
    return () => document.removeEventListener('keydown', onKeyDownCapture, true)
  }, [mounted, onClose])

  if (!mounted) return null
  const target = typeof document !== 'undefined' ? document.getElementById('workflow-root') : null
  if (!target) return null

  return createPortal(
    <div className={`cw-bmodal-overlay${closing ? ' is-leaving' : ''}`} onClick={onClose}>
      <div
        className="cw-bmodal-card"
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel || title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="cw-bmodal-head">
          {Icon ? (
            <span className="cw-bmodal-head-icon">
              <Icon weight="regular" size={15} />
            </span>
          ) : null}
          <span className="cw-bmodal-head-title">{title}</span>
          {tag ? <span className="cw-header-tag">{tag}</span> : null}
          <button type="button" className="cw-bmodal-close" aria-label="Close" onClick={onClose}>
            <X weight="bold" size={13} />
          </button>
        </div>

        {onSearchChange ? (
          <div className="cw-bmodal-search-wrap">
            <div className="cw-palette-search cw-bmodal-search">
              <MagnifyingGlass size={13} weight="regular" className="cw-palette-search-icon" aria-hidden="true" />
              <input
                ref={searchRef}
                type="text"
                className="cw-palette-search-input"
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                aria-label={searchPlaceholder}
              />
              {search ? (
                <button
                  type="button"
                  className="cw-palette-search-clear"
                  aria-label="Clear search"
                  onClick={() => onSearchChange('')}
                >
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                  </svg>
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        {toolbar ? <div className="cw-bmodal-toolbar">{toolbar}</div> : null}

        <div className="cw-bmodal-body">
          {rail ? <div className="cw-bmodal-rail">{rail}</div> : null}
          <div className="cw-bmodal-main">{children}</div>
        </div>
      </div>
    </div>,
    target,
  )
}
