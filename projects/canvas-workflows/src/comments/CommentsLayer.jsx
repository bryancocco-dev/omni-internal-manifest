// COMMENTS PHASE — Figma-style canvas comments (PLAN.md "## COMMENTS PHASE").
//
// The pin layer, the open thread card, and the new-pin composer — all in one
// file per the plan. Pins anchor to FLOW coordinates (state.jsx's `comments`
// array), rendered through <ViewportPortal> exactly as the plan specifies, so
// they pan/zoom with the graph and counter-scale by 1/zoom (transform-origin
// at the pin's own tip) to hold constant screen size — Figma's behaviour.
//
// The CARD (thread + composer) is a deliberate departure from a literal
// nested-ViewportPortal reading of "same counter-scale for the open thread
// card": verified live (headless Chrome, see the build report) that content
// inside <ViewportPortal> lives inside .react-flow__renderer (z-index 4 in
// React Flow's OWN base stylesheet), which sits BELOW .react-flow__panel —
// Controls and MiniMap, z-index 5 — regardless of any z-index set on our own
// nested elements; a card opened near either panel was rendering partially
// underneath it, buttons and all. RunPreview.jsx already establishes the fix
// for exactly this class of problem in this codebase (its own header
// comment: "escapes React Flow's pan/zoom transform + .cw-canvas-wrap's
// overflow:hidden clip, stays inside the theme scope" via createPortal to
// #workflow-root) — the card follows that precedent instead: portaled to
// #workflow-root, positioned with `flowToScreenPosition` (recomputed every
// render, since this component subscribes to the live viewport transform) so
// it still tracks its pin 1:1 through every pan and zoom. The OBSERVABLE
// result is identical to the spec'd behaviour — constant screen size,
// glued to the pin — just computed in screen space instead of nested
// flow-space transforms, and it no longer loses a z-index fight it structurally
// cannot win. Pins themselves are untouched and stay exactly as specified.
//
// Visual language is PORTED (not imported — different codebase, vanilla JS)
// from canvas-share-demos/shared/components/comment-affordance.js +
// comments-panel.js: the deterministic AVATAR_COLORS hash, initials(),
// timeAgo(), and the thread shape (root + replies + resolved). Re-cut here
// entirely in --cw-* tokens (comments.css) per the plan's non-negotiables.
//
// `draftPin`/`onDraftCancel`/`onDraftPosted`/`onDraftClose` come from
// FlowCanvas.jsx, which owns the transient "where did the user just click
// while in comment mode" UI state (mirrors how it already owns
// dismissedKey/issuesOpen/selectMode/ripples) — state.jsx's context contract
// is exactly the list PLAN.md names (comments, commentMode, addComment,
// ...), so the not-yet-posted draft never enters global state; `addComment`
// only gets called once the user actually submits, which is also what makes
// Esc-cancels-the-draft free (nothing was ever added, so there's nothing to
// remove — see FlowCanvas.jsx's capture-phase Escape handler for the full
// cancel/close/exit-mode precedence). `onDraftClose` is the DRAFT COMPOSER
// ×'s handler (Bryan: "add an x in here that removes the comment box and
// exits the user from comment mode") — a deliberately bigger hammer than
// Esc: it cancels the draft the same way `onDraftCancel` does AND turns
// comment mode off, where Esc on a draft only cancels and leaves comment
// mode running (unchanged, see that same Escape handler).

import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ViewportPortal, useReactFlow, useStore } from '@xyflow/react'
import { ChatTeardropDots, Check, PaperPlaneRight, TrashSimple } from '@phosphor-icons/react'

import { useFlowState, CURRENT_USER } from '../state.jsx'

// Ported from comments-panel.js: a small OMNI-family palette, hashed
// deterministically per author name so a person keeps their colour across
// renders without a monotone wall of one blue. This — and nowhere else in
// this file — is the sanctioned hardcoded-hex exception (PLAN.md
// non-negotiables: "no hardcoded hex except the avatar palette").
const AVATAR_COLORS = ['#1858ee', '#6069f5', '#8b5cf6', '#0e8f9a', '#1f9d6b', '#c2506e']
function avatarColor(name) {
  let h = 0
  for (let i = 0; i < name.length; i += 1) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return AVATAR_COLORS[h % AVATAR_COLORS.length]
}

// Ported from comment-affordance.js's initials() — strips a trailing
// "(...)" qualifier, takes up to the first two words' initials. The single
// current user is 'Bryan' (PLAN.md), so this yields "B" today; the function
// itself stays general so it's not silently wrong the day a full name shows
// up.
function initials(name) {
  return name.replace(/\(.*\)/, '').trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase()
}

// Ported verbatim from comment-affordance.js's timeAgo().
function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(diff / 3600000)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(diff / 86400000)
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

// The pin wrapper's transform: place the flow-space point at the viewport's
// local origin, then counter-scale so screen size stays constant regardless
// of zoom. `transformOrigin: '0 0'` is what makes the scale pivot around the
// anchor point rather than the wrapper's (invisible, zero-size) box center.
function anchorStyle(x, y, zoom) {
  return { transform: `translate(${x}px, ${y}px) scale(${1 / zoom})`, transformOrigin: '0 0' }
}

// Two markers, one for each half of the gesture (Bryan):
//
//   DRAFT — while you're placing and typing, the mark is the SAME glyph as
//   the rail's comment tool and the comment-mode cursor, so the tool you
//   picked, the cursor you're dragging around, and the thing you just put
//   down are all visibly one object. Its tail is at the bottom-left.
//
//   POSTED — once the comment exists it becomes a pin carrying the author's
//   initials, so a canvas full of threads tells you at a glance who left
//   what. Single-path teardrop, viewBox 0 0 26 30, tip at (13, 29).
//
// `.cw-comment-pin-btn` (comments.css) offsets each badge so the part that
// POINTS — the bubble's tail, the teardrop's tip — lands on the clicked
// point; the two glyphs have different geometry, so `.is-draft` carries its
// own offsets there.
function DraftMark() {
  return <ChatTeardropDots className="cw-comment-pin-mark" size={24} weight="fill" aria-hidden="true" />
}

// Redesigned off the map-pin teardrop (Bryan: "i dont like the design of
// these") into the Figma-marker family, our voice: a paper chip with three
// round corners and ONE squared tail corner (bottom-left — the corner that
// sits on the anchor point), carrying the author's avatar dot in their
// deterministic color. The chip is chrome, the avatar is the identity —
// same split every card head already uses (paper + colored tile).
function PinMark({ author }) {
  return (
    <span className="cw-comment-pin-chip">
      <span className="cw-comment-pin-avatar" style={{ background: avatarColor(author) }}>
        {initials(author)}
      </span>
    </span>
  )
}

// Self-contained: manages its own draft text (so a reply box keyed by thread
// id resets cleanly when the active thread changes, and a composer never
// needs its parent to babysit a text value it only cares about at submit
// time). Enter posts; Shift+Enter inserts a newline; Cmd/Ctrl+Enter also
// posts since it satisfies the same "Enter, no Shift" check (PLAN.md: "Enter
// or Cmd/Ctrl+Enter posts").
function ComposerRow({ placeholder, autoFocus, reply, onSubmit }) {
  const [value, setValue] = useState('')
  const submit = () => {
    const trimmed = value.trim()
    if (!trimmed) return
    onSubmit(trimmed)
    setValue('')
  }
  return (
    <div className={`cw-comment-composer${reply ? ' cw-comment-composer--reply' : ''}`}>
      <textarea
        className="cw-comment-composer-input"
        rows={reply ? 1 : 2}
        placeholder={placeholder}
        autoFocus={autoFocus}
        value={value}
        aria-label={placeholder}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            submit()
          }
        }}
      />
      <button type="button" className="cw-comment-send" onClick={submit} disabled={!value.trim()} aria-label="Post">
        <PaperPlaneRight size={13} weight="fill" />
      </button>
    </div>
  )
}

// Portals its children to #workflow-root, positioned at the given SCREEN
// point (already converted from flow space by the caller via
// `flowToScreenPosition`, which stays theme/zoom-correct since it reads the
// live transform on every call). See this file's header comment for why the
// card needs this instead of nesting in the pin's own ViewportPortal anchor.
function CardPortal({ screenPos, children }) {
  const target = typeof document !== 'undefined' ? document.getElementById('workflow-root') : null
  if (!target || !screenPos) return null
  return createPortal(
    <div className="cw-comment-card-portal" style={{ left: screenPos.x, top: screenPos.y }}>
      {children}
    </div>,
    target,
  )
}

export default function CommentsLayer({ draftPin, onDraftCancel, onDraftPosted, onDraftClose }) {
  // Subscribing to the whole transform (not just its zoom component) means
  // THIS component re-renders on every pan too, so the portaled card's
  // flowToScreenPosition call below stays glued to its pin during a pan, not
  // just a zoom.
  const transform = useStore((s) => s.transform)
  const zoom = transform[2]
  const { flowToScreenPosition } = useReactFlow()
  const { comments, activeCommentId, setActiveCommentId, addComment, addReply, toggleResolved, deleteComment } =
    useFlowState()

  const cardRef = useRef(null)

  // "Click a pin (in ANY mode) -> opens its thread card ... Clicking
  // elsewhere closes it." A document-level pointerdown listener (same
  // pattern App.jsx already uses for its title-dropdown menu) covers every
  // "elsewhere" uniformly — a node, the palette, the header — without this
  // component needing to know about any of those; pins are explicitly
  // excluded so switching straight from one open thread to another doesn't
  // flicker through a closed frame first.
  useEffect(() => {
    if (!activeCommentId) return undefined
    const onPointerDown = (event) => {
      if (cardRef.current?.contains(event.target)) return
      if (event.target.closest?.('.cw-comment-pin-btn')) return
      setActiveCommentId(null)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [activeCommentId, setActiveCommentId])

  const openThread = (id) => {
    onDraftCancel?.()
    setActiveCommentId(id)
  }

  const activeComment = comments.find((c) => c.id === activeCommentId) || null

  return (
    <>
      <ViewportPortal>
        {comments.map((c) => (
          <div key={c.id} className="cw-comment-anchor" style={anchorStyle(c.x, c.y, zoom)}>
            <button
              type="button"
              className={`cw-comment-pin-btn nodrag nopan${c.resolved ? ' is-resolved' : ''}${
                c.id === activeCommentId ? ' is-active' : ''
              }`}
              onClick={() => openThread(c.id)}
              aria-label={c.resolved ? `Resolved comment by ${c.author}` : `Comment by ${c.author}: ${c.text}`}
            >
              <PinMark author={c.author} />
            </button>
          </div>
        ))}

        {draftPin ? (
          <div className="cw-comment-anchor" style={anchorStyle(draftPin.x, draftPin.y, zoom)}>
            <div className="cw-comment-pin-btn is-active is-draft" aria-hidden="true">
              <DraftMark />
            </div>
          </div>
        ) : null}
      </ViewportPortal>

      {activeComment ? (
        <CardPortal screenPos={flowToScreenPosition({ x: activeComment.x, y: activeComment.y })}>
          <div
            className={`cw-comment-card cw-comment-card--thread${activeComment.resolved ? ' is-resolved' : ''}`}
            ref={cardRef}
          >
            <div className="cw-comment-thread-scroll">
              <div className="cw-comment-msg">
                <span className="cw-comment-avatar" style={{ '--cw-avatar': avatarColor(activeComment.author) }}>
                  {initials(activeComment.author)}
                </span>
                <div className="cw-comment-msg-main">
                  <div className="cw-comment-msg-head">
                    <span className="cw-comment-name">{activeComment.author}</span>
                    <span className="cw-comment-time">{timeAgo(activeComment.at)}</span>
                  </div>
                  <p className={`cw-comment-text${activeComment.resolved ? ' is-resolved' : ''}`}>
                    {activeComment.text}
                  </p>
                </div>
              </div>

              {activeComment.replies.length ? (
                <div className="cw-comment-replies">
                  {activeComment.replies.map((r) => (
                    <div className="cw-comment-msg cw-comment-msg--reply" key={r.id}>
                      <span className="cw-comment-avatar cw-comment-avatar--sm" style={{ '--cw-avatar': avatarColor(r.author) }}>
                        {initials(r.author)}
                      </span>
                      <div className="cw-comment-msg-main">
                        <div className="cw-comment-msg-head">
                          <span className="cw-comment-name">{r.author}</span>
                          <span className="cw-comment-time">{timeAgo(r.at)}</span>
                        </div>
                        <p className="cw-comment-text">{r.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <ComposerRow
              key={activeComment.id}
              reply
              placeholder="Reply..."
              onSubmit={(text) => addReply(activeComment.id, text)}
            />

            <div className="cw-comment-toolbar">
              <button
                type="button"
                className={`cw-comment-tool-btn${activeComment.resolved ? ' is-on' : ''}`}
                onClick={() => toggleResolved(activeComment.id)}
                aria-pressed={activeComment.resolved}
              >
                <Check size={12} weight={activeComment.resolved ? 'fill' : 'bold'} />
                {activeComment.resolved ? 'Reopen' : 'Resolve'}
              </button>
              <button
                type="button"
                className="cw-comment-tool-btn cw-comment-tool-btn--danger"
                onClick={() => deleteComment(activeComment.id)}
              >
                <TrashSimple size={12} weight="regular" />
                Delete
              </button>
            </div>
          </div>
        </CardPortal>
      ) : null}

      {draftPin ? (
        <CardPortal screenPos={flowToScreenPosition(draftPin)}>
          <div className="cw-comment-card cw-comment-card--composer">
            {/* DRAFT COMPOSER × (PLAN.md, Bryan) — a sibling of ComposerRow,
                not inside it, so a reply composer inside an open thread
                (same ComposerRow component, `reply` variant above) never
                grows this button; only the not-yet-posted draft card does. */}
            <button
              type="button"
              className="cw-comment-card-close"
              onClick={() => onDraftClose?.()}
              aria-label="Close and exit comment mode"
            >
              {/* ISSUES POPOVER V2 (PLAN.md item 1) — same droop as the
                  issues pill's dismiss ×, same fix: a drawn 8x8 cross instead
                  of a text glyph, which can't be reliably centred at this
                  size (FlowCanvas.jsx's CrossIcon, ported here rather than
                  imported — different seam/file, same tiny markup). */}
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden="true">
                <path d="M1 1L7 7M7 1L1 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
            <ComposerRow
              autoFocus
              placeholder="Leave a comment..."
              onSubmit={(text) => {
                addComment({ x: draftPin.x, y: draftPin.y, text })
                onDraftPosted?.()
              }}
            />
          </div>
        </CardPortal>
      ) : null}
    </>
  )
}
