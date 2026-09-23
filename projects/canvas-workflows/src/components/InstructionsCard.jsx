// INSTRUCTIONS CARD REDESIGN (2026-08-11, Bryan) — see PLAN.md
// "## INSTRUCTIONS CARD REDESIGN — 'the feature manifest'".
//
// Canvas_2's zero-node empty state, redesigned from the CANVAS TABS PHASE's
// wall-of-text card into a product-page moment: overline + headline +
// subhead, then four feature rows, each paired with a bespoke inline-SVG
// mini-diagram in the project's technical-illustration language (hairline
// wireframe, graphite ink + sparing accent color — never a stock icon for
// these four; they're small schematics of the actual product, not
// decoration). The one stock glyph in this whole card is the footer's
// Phosphor CaretLeft, called out explicitly in the spec as the exception.
//
// Ownership: this file + ./styles/instructions.css are new and
// self-contained (css imported directly below — same convention as
// ChatHat.jsx/chathat.css). FlowCanvas.jsx's call site is a surgical swap
// only: same `key`/`empty` contract, same presence mechanics (mount/
// fade-out on the 'empty' gate, swapKey remount reset owned by the caller)
// as the inline version this replaces — this file owns exactly the
// CONTENT/visuals rendered while that gate is active.
//
// Copy below is verbatim from PLAN.md — every string is the spec; nothing
// here is invented or rephrased.
//
// MANIFEST CARD FINAL PASS (2026-08-12) — layout-only pass on top of the
// above: the vertical row list becomes a 2x2 grid, and each vignette gets
// wrapped in a `.cw-instructions-stage` box (instructions.css) so it reads
// as a staged illustration instead of marginalia. No copy/geometry/
// animation/presence/gating changed — see PLAN.md "MANIFEST CARD FINAL
// PASS" for the full spec this satisfies.

import React, { useEffect, useRef, useState } from 'react'
import '../styles/instructions.css'

// ---- vignettes -------------------------------------------------------------
// Four bespoke 56x40 mini-diagrams, one per row, drawn in the same "hairline
// wireframe + sparing accent" language as the rest of the technical-
// illustration system (see CLAUDE.md/PLAN.md's design-system notes): base
// ink is --cw-text-3 at .55 opacity, stroke-width 1.25 and round caps are
// set once on each <svg> root and inherited by every child shape (SVG's own
// presentation-attribute inheritance — cheaper than repeating them per
// element). Every accent routes through the shared --cw-* roster (or the
// same FIXED chip hex values the real attachment chips use, see
// EquipTaskVignette below) so the vignettes track the shell theme exactly
// like every other themed pixel in the builder.
//
// All motion is opacity / transform(scale) / stroke-dashoffset only (never
// layout, never filter) — instructions.css owns every keyframe/duration;
// this file only ever sets STATIC geometry + color, plus the `cw-ic-*`
// classNames that opt an element into one of those animations. Durations
// sit in the spec's 3.5-5s ambient band. Every loop's animation-delay also
// carries `--cw-seq` (the same per-row index InstructionsRow below sets for
// its own entrance cascade) via a CSS custom-property inherited straight
// from the row wrapper down into the <svg> — so the four vignettes' loops
// don't beat in sync with each other on mount, without this file having to
// thread an extra prop through.
const VIGNETTE_PROPS = {
  viewBox: '0 0 56 40',
  width: 56,
  height: 40,
  fill: 'none',
  strokeWidth: 1.25,
  strokeLinecap: 'round',
  'aria-hidden': true,
}

const INK = { stroke: 'var(--cw-text-3)', opacity: 0.55 }

// 1. "Wire the current" — three mini-cards joined by a wire; a short bright
// dash travels left->right on loop, the SAME grammar (pathLength=100 +
// animated stroke-dashoffset) as the real OmniEdge ambient pulse.
function WireCurrentVignette() {
  const cards = [
    { x: 2, accent: 'var(--cw-kind-trigger)' },
    { x: 22, accent: 'var(--cw-accent)' },
    { x: 42, accent: 'var(--cw-accent)' },
  ]
  // One compound path (two disjoint subpaths, one per gap) so a single
  // pathLength=100 dash-drift hops both gaps in sequence — "travels
  // left->right" across the whole row from one animated element.
  const wireD = 'M14,20 L22,20 M34,20 L42,20'
  return (
    <svg {...VIGNETTE_PROPS} className="cw-instructions-vignette cw-ic-v1">
      <path d={wireD} style={INK} />
      <path d={wireD} pathLength="100" className="cw-ic-dash" strokeWidth={1.5} style={{ stroke: 'var(--cw-accent)' }} />
      {cards.map((c) => (
        <React.Fragment key={c.x}>
          <rect x={c.x} y="15.5" width="12" height="9" rx="2" style={INK} />
          {/* Accent top edge — same "colored top-bar" grammar as a real
              node card's kind accent, inset off the rounded corners. */}
          <line x1={c.x + 2} y1="15.5" x2={c.x + 10} y2="15.5" strokeWidth={1.75} style={{ stroke: c.accent }} />
        </React.Fragment>
      ))}
    </svg>
  )
}

// 2. "Branch the logic" — one mini-card forking into two via smooth elbows;
// the two branch wires glint alternately, offset half-period; the source
// card gets a tiny --cw-kind-logic accent (the only accent color in this
// vignette — the wires themselves stay graphite and glint via opacity only,
// "sparing accent" per the design language).
function BranchLogicVignette() {
  return (
    <svg {...VIGNETTE_PROPS} className="cw-instructions-vignette cw-ic-v2">
      <rect x="2" y="15.5" width="12" height="9" rx="2" style={INK} />
      <line x1="4" y1="15.5" x2="12" y2="15.5" strokeWidth={1.75} style={{ stroke: 'var(--cw-kind-logic)' }} />
      <path d="M14,20 C22,20 22,10 30,10 L48,10" className="cw-ic-branch cw-ic-branch-a" style={{ stroke: 'var(--cw-text-3)' }} />
      <path d="M14,20 C22,20 22,30 30,30 L48,30" className="cw-ic-branch cw-ic-branch-b" style={{ stroke: 'var(--cw-text-3)' }} />
      <circle cx="48" cy="10" r="1.5" stroke="none" style={{ fill: 'var(--cw-text-3)', opacity: 0.55 }} />
      <circle cx="48" cy="30" r="1.5" stroke="none" style={{ fill: 'var(--cw-text-3)', opacity: 0.55 }} />
    </svg>
  )
}

// 3. "Equip every task" — one center card; four dots at NE/E/SE/S in the
// real chip colors, hairline spokes in to the card, breathing in sequence.
// Color-per-position mirrors the app's own fixed-vs-themed chip convention
// exactly (THEMES PHASE note): the Agent dot (NE) is the one that follows
// the theme's primary accent, the other three are fixed semantic hex values
// same as the real attachment chips (Knowledge base/Skill/Tool).
function EquipTaskVignette() {
  const dots = [
    { cls: 'cw-ic-dot-1', cx: 39, cy: 9, color: 'var(--cw-accent)', ax: 34, ay: 16 }, // NE — Agent
    { cls: 'cw-ic-dot-2', cx: 44, cy: 20, color: '#0EA5E9', ax: 34, ay: 20 }, // E — Knowledge base
    { cls: 'cw-ic-dot-3', cx: 39, cy: 31, color: '#8B5CF6', ax: 34, ay: 24 }, // SE — Skill
    { cls: 'cw-ic-dot-4', cx: 28, cy: 35, color: '#F59E0B', ax: 28, ay: 24.5 }, // S — Tool
  ]
  return (
    <svg {...VIGNETTE_PROPS} className="cw-instructions-vignette cw-ic-v3">
      {dots.map((d) => (
        <line key={`spoke-${d.cls}`} x1={d.ax} y1={d.ay} x2={d.cx} y2={d.cy} style={INK} />
      ))}
      <rect x="22" y="15.5" width="12" height="9" rx="2" style={INK} />
      {dots.map((d) => (
        <circle key={d.cls} className={`cw-ic-dot ${d.cls}`} cx={d.cx} cy={d.cy} r="1.5" stroke="none" style={{ fill: d.color }} />
      ))}
    </svg>
  )
}

// 4. "Build in place" — a horizontal wire with a small (+) riding its
// midpoint and a subtle (x) just right of it; the (+) pops once per 4s
// while the wire's dash drifts slowly. Same pathLength dash-drift technique
// as vignette 1, tuned to a slower duration ("drifts slowly").
function BuildInPlaceVignette() {
  return (
    <svg {...VIGNETTE_PROPS} className="cw-instructions-vignette cw-ic-v4">
      <line x1="4" y1="20" x2="52" y2="20" style={INK} />
      <line x1="4" y1="20" x2="52" y2="20" pathLength="100" className="cw-ic-dash" strokeWidth={1.5} style={{ stroke: 'var(--cw-accent)' }} />
      <line x1="38" y1="18" x2="42" y2="22" style={{ stroke: 'var(--cw-danger)', opacity: 0.5 }} />
      <line x1="42" y1="18" x2="38" y2="22" style={{ stroke: 'var(--cw-danger)', opacity: 0.5 }} />
      <g className="cw-ic-plus">
        <circle cx="28" cy="20" r="4" style={{ stroke: 'var(--cw-accent)', fill: 'var(--cw-surface)' }} />
        <line x1="28" y1="17.3" x2="28" y2="22.7" style={{ stroke: 'var(--cw-accent)' }} />
        <line x1="25.3" y1="20" x2="30.7" y2="20" style={{ stroke: 'var(--cw-accent)' }} />
      </g>
    </svg>
  )
}

// ---- copy — kind names highlighted in their blocks' own accents ----------
// Kind-token: an inline highlight whose tint IS the block's own accent, so
// the copy teaches the palette's color system while it explains it.
function Kt({ kind, children }) {
  return <em className={`cw-kt cw-kt--${kind}`}>{children}</em>
}

const ROWS = [
  {
    title: 'WIRE THE CURRENT',
    body: (
      <>
        The <Kt kind="trigger">Trigger</Kt> starts the run, and control flows along your connections — through{' '}
        <Kt kind="task">Actions</Kt>, into <Kt kind="output">Outputs</Kt>.
      </>
    ),
    Vignette: WireCurrentVignette,
  },
  {
    title: 'BRANCH THE LOGIC',
    body: (
      <>
        <Kt kind="logic">If/Else</Kt>, <Kt kind="logic">Switch</Kt>, <Kt kind="logic">For Each</Kt>,{' '}
        <Kt kind="logic">Try/Catch</Kt> — Logic blocks split the current across conditions, lists, and failure paths.
      </>
    ),
    Vignette: BranchLogicVignette,
  },
  {
    title: 'EQUIP EVERY TASK',
    body: (
      <>
        Open a <Kt kind="task">Task</Kt> to give it an <Kt kind="attach">Agent</Kt>,{' '}
        <Kt kind="attach">knowledge bases</Kt>, <Kt kind="attach">tools</Kt>, and <Kt kind="attach">skills</Kt> — it
        runs with exactly what you attach.
      </>
    ),
    Vignette: EquipTaskVignette,
  },
  {
    title: 'BUILD IN PLACE',
    body: (
      <>
        Click the{' '}
        <Kt kind="plus">
          <svg viewBox="0 0 10 10" width="10" height="10" aria-hidden="true">
            <path d="M5 1.4v7.2M1.4 5h7.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </Kt>{' '}
        beside any block to grow the flow, or use a connection's controls to drop a{' '}
        <Kt kind="task">Task</Kt> inline — or cut the wire. Anything left unconnected ends the run right there.
      </>
    ),
    Vignette: BuildInPlaceVignette,
  },
]

// `empty` (nodes.length === 0, computed by the caller) drives visibility
// together with a plain local `dismissed` flag the × button sets — the
// same mount/closing presence machine the issues pill uses (materialize
// in, plain fade out on close — see instructions.css's cw-instructions-in/
// out) so a dismiss or a first drop always plays the exit transition
// instead of popping. The caller keys this component on `swapKey`, so a
// tab switch remounts it fresh and `dismissed` resets to false —
// "reappears naturally on remount" per the plan, with no extra effect
// needed here to arrange it.
// "Don't show again" (Bryan). Module-level, NOT localStorage: this card is
// keyed on swapKey by its call site, so a plain component flag would be wiped
// by the next tab switch or Clear and the card would march back in. Living
// out here it holds for the whole session — and dies with a refresh, which is
// the rule the whole app keeps ("refreshing the page should reset the page").
let suppressedForSession = false

export default function InstructionsCard({ empty }) {
  const [dismissed, setDismissed] = useState(suppressedForSession)
  const [never, setNever] = useState(suppressedForSession)
  const active = empty && !dismissed

  const [mounted, setMounted] = useState(active)
  const [closing, setClosing] = useState(false)
  const mountedRef = useRef(active)
  const closeTimerRef = useRef(null)

  useEffect(() => {
    if (active) {
      clearTimeout(closeTimerRef.current)
      mountedRef.current = true
      setClosing(false)
      setMounted(true)
    } else if (mountedRef.current) {
      setClosing(true)
      closeTimerRef.current = setTimeout(() => {
        mountedRef.current = false
        setMounted(false)
        setClosing(false)
      }, 240) // matches instructions.css's cw-instructions-out duration (--cw-d-2)
    }
  }, [active])

  useEffect(() => () => clearTimeout(closeTimerRef.current), [])

  if (!mounted) return null

  return (
    <div className={`cw-instructions-card${closing ? ' is-leaving' : ''}`}>
      <button
        type="button"
        className="cw-instructions-close"
        aria-label="Dismiss instructions"
        onClick={() => setDismissed(true)}
      >
        ×
      </button>

      <div className="cw-instructions-header">
        <p className="cw-instructions-overline">WORKFLOW BUILDER</p>
        <h2 className="cw-instructions-headline">Build the flow that produces your Output.</h2>
        <p className="cw-instructions-subhead">
          Start at the Trigger, end at an Output — everything between is yours to wire.
        </p>
      </div>

      <div className="cw-instructions-rows">
        {ROWS.map((row, i) => (
          // --cw-seq drives both this row's own entrance stagger (55ms per
          // step, same pattern as nodes' --cw-seq) and, inherited straight
          // through into the <svg> below, each vignette's ambient-loop
          // stagger (instructions.css multiplies it by a much larger step
          // for that purpose) — one variable, two independent consumers.
          <div className="cw-instructions-row" style={{ '--cw-seq': i }} key={row.title}>
            {/* Stage: pure layout wrapper (FINAL PASS) — the vignette
                component itself is untouched, this just gives it a
                background/radius box to sit centered in, sized up via CSS. */}
            <div className="cw-instructions-stage">
              <row.Vignette />
            </div>
            <div className="cw-instructions-row-body">
              <p className="cw-instructions-row-title">{row.title}</p>
              <p className="cw-instructions-row-text">{row.body}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="cw-instructions-footer">
        {/* A checkbox rather than a button (Bryan) — the dialog convention:
            you're setting a preference, not firing an action, even though
            ticking it also closes the card. `never` is held locally so the
            box paints checked for the moment before the card fades out;
            without it the tick would never be seen. */}
        <label className="cw-instructions-never">
          <input
            type="checkbox"
            checked={never}
            onChange={() => {
              setNever(true)
              suppressedForSession = true
              setDismissed(true)
            }}
          />
          <span>Don't show this again</span>
        </label>
      </div>
    </div>
  )
}
