// Seam C — Nodes

import { memo, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useUpdateNodeInternals, useReactFlow } from '@xyflow/react';
import { User, Sparkle, CaretDown, MagicWand, ArrowRight } from '@phosphor-icons/react';
import {
  CardEyebrow,
  FieldLabel,
  NodeActionsToolbar,
  RunStamp,
  RunCornerTicks,
  useRunFinale,
  Segmented,
  OptionsEditor,
  HandleLabelRows,
  InHandle,
  OutHandle,
  // PLUS IS ATTACH (PLAN.md "## PLUS IS ATTACH") — the ONE shared attach-
  // menu component plus its chip/card pieces (shared.jsx's own header
  // comment on that section has the full contract).
  AttachMenu,
  AttachChip,
  AttachCard,
  attachmentLabel,
  encodeChatAttachment,
} from './shared.jsx';
import Reveal from './Reveal.jsx';
import ComboBox from './ComboBox.jsx';
import { TASK_MODEL_OPTIONS } from '../data/models.js';
// FIT + VERSION STEPPER's own re-measure heal, imported rather than forked —
// OutputNode.jsx already exports it precisely so a second node file can
// reuse it instead of duplicating the transitionend/fallback-timer dance
// (GenerateNode.jsx is the existing precedent for this exact import). THE
// GATE NEGOTIATES needs the identical thing for a different trigger: this
// card's own width swap on pause (below), not OutputNode's stage-sized one.
import { useStageWidthHeal } from './OutputNode.jsx';
import { useFlowState } from '../state.jsx';

// THE SPLIT (PLAN.md "## THE SPLIT — two human nodes: the Gate and the
// Check-in") — this node REVERTS to the pre-merge gate: Free text /
// Multiple choice ONLY, a compact card, the classic paused UI (in-card free
// input + Continue, or choice buttons), option handles that branch. Every
// chat-era addition (the chat faces, `chatCapable` stamping, the
// roomy/chat-wide card, the satellite sheet + tether/port, spring-open,
// two-faces Edit toggle) moved WHOLESALE to the new CheckinNode.jsx — see
// that file's own header comment. "A GATE decides and can BRANCH; a
// CHECK-IN discusses and never branches" (PLAN.md) is the functional line:
// this file only ever needs to know about `free`/`choice`.
//
// THE GATE NEGOTIATES (PLAN.md "## THE GATE NEGOTIATES") revisits ONLY the
// PAUSED presentation: "when you run this kind of node, the chat dialogue
// box/hat should pop out of it and let you negotiate something here." The
// REST face above (ask/segmented/options editor/handles) is untouched byte-
// for-byte — this phase's whole footprint is the block that used to render
// "Your response" while paused, further down. The gate is still a
// PROGRAMMED instrument (authored ask, authored options, real branches) —
// only the RUNTIME presentation borrows the check-in's chat-box shell.
//
// Shared component vs. local mirror (PLAN.md gave the executor's choice,
// commented either way): CheckinNode.jsx is READ-ONLY for this phase (off-
// limits to edit) and shared.jsx is outside this phase's file grant, so
// lifting the chat anatomy into a shared component was not an option here —
// this is a DISCIPLINED LOCAL MIRROR of CheckinNode.jsx's transcript/hat/
// composer JSX, reusing its exact `.cw-chat-*` CSS classes (nodes.css is
// untouched for all of that — those rules are already fully generic, never
// scoped under `.cw-node--checkin`) so the two surfaces render pixel-
// identical. The only genuinely NEW CSS this phase adds is the paused-width
// swap and a z-elevation rule, both additions (see nodes.css's own "THE GATE
// NEGOTIATES" section). What is NOT mirrored: the dormant/asleep state
// (checkin's `.cw-chat-box.is-dormant`) — "NO dormant chat box at rest on
// the gate... the surface exists only while paused; real entrance AND
// exit" — so the whole box lives inside ONE outer `<Reveal open={paused}>`
// instead of being permanently mounted, and there is no is-dormant class
// anywhere in this file. The reply/resolve machinery is NEVER forked: every
// negotiation turn below still calls the SAME `chatWithHuman` context
// function CheckinNode.jsx calls (run/engine.js's own single resolution
// point, now keyed to work for a paused GATE too — see that file's own
// comments near `chatWithHuman`), and every resolve still calls the SAME
// `continueHuman` this file always called.
//
// Stale data: an older session/template snapshot minted before this phase
// could still carry `data.responseType === 'chat'` on a plain `human` node
// (the value this app briefly wrote before the chat half got its own node
// type). Nothing below ever branches on `=== 'chat'` — every check here is
// either `=== 'choice'` (the one mode with real alternate behavior) or the
// implicit "anything else" free-text path, so a stale 'chat' node silently
// renders and behaves exactly like 'free' — including a working `out`
// handle (`responseType !== 'choice'` below, not `=== 'free'`) — never a
// crash, never a dangling wire.

// COACHING CHIPS (PLAN.md "## COACHING CHIPS — the gate's chips advise, the
// leaning decides") — Bryan, from a gate chip-row screenshot: "these should
// be reccos for how they could make the node better." This retires the
// hat body's old direct-resolve behavior: it used to map the AUTHORED
// `options` straight to filled decision chips, each click an immediate
// `continueHuman`. That row is now `data.chatOptions` — run/engine.js's own
// engine-seeded, per-reply-refreshed OPTION-IMPROVEMENT recos (never the
// bare option names) — rendered as the SAME neutral SEND-chip family
// CheckinNode.jsx's agent-offered row already uses: a click is a
// chatWithHuman negotiation turn like any typed message, never a resolve.
// The authored options are unchanged as data and unchanged as UI in one
// place — the branch exit rows (HandleLabelRows) stay exactly as they
// were. What's new is the ONLY resolve action left: "Approve & continue,"
// which now lands on the LEANED option (LIVE LEANING's `data.chatLeaning`)
// falling back to the first authored option — see `approveAndContinue`'s
// own comment. This button already existed for window-mode gates (WINDOW
// TETHER addendum); this phase both changes its resolution rule AND gives
// non-window gates their own in-card copy of it (further down, sibling to
// `chatBox`), since the chip click it replaces used to be that gate's own
// resolve path. Free-text gates are untouched everywhere in this phase.
//
// X25 B (PLAN.md "## X25 B — the floating chat window variant") — Bryan,
// re-reading an earlier sketch verbatim: "a container throws open on
// screen that has like a little shadow on it and you can x out of." One
// scoping flag, `data.chatSurface === 'window'`, set ONLY by part-a.js's
// 'Social batch ×25 B' gate step — every other human node in every other
// template never sets it, so `windowMode` below is `false` for them and
// this file's entire behavior is byte-identical to before THE GATE
// NEGOTIATES's own paused block, further down, is the ONLY place this ever
// branches. Re-hosts the exact SAME `.cw-chat-*` transcript/hat/composer
// JSX that block already builds (`chatSurface` never forks that mechanics —
// see `chatBox` below) into a portaled, viewport-fixed, draggable window
// instead of in-card, per "## THE GATE NEGOTIATES follow-up" comment above:
// the programming face still folds while paused, but a window-mode card
// shows ONLY its head plus a quiet strip/line here — never the chat itself.
const DEFAULT_CHAT_AGENT_LABEL = 'Omni Creative Agent';

// A presence machine for the portal window's own mount/unmount, mirroring
// Reveal.jsx's "stay mounted through the CLOSE animation, unmount only once
// it's actually finished" strategy — that component's grid-track trick is
// for a document-flow row animating an unknown height, which doesn't apply
// to a viewport-fixed panel animating its own scale/translate/opacity, so
// this is a disciplined local mirror of the STRATEGY, not the component
// (same "shared vs. mirror" call this file's header comment already makes
// for the chat anatomy itself). `active` is `windowMode && paused &&
// winOpen` — every reason the window should be on screen, collapsed to one
// boolean by the caller.
function useWindowPresence(active) {
  const [mounted, setMounted] = useState(active);
  const [closing, setClosing] = useState(false);
  const mountedRef = useRef(active);
  const timerRef = useRef(null);
  useEffect(() => {
    if (active) {
      clearTimeout(timerRef.current);
      mountedRef.current = true;
      setMounted(true);
      setClosing(false);
      return undefined;
    }
    if (!mountedRef.current) return undefined;
    setClosing(true);
    const ms = prefersReducedMotion() ? 0 : 260;
    timerRef.current = setTimeout(() => {
      mountedRef.current = false;
      setMounted(false);
      setClosing(false);
    }, ms);
    return () => clearTimeout(timerRef.current);
  }, [active]);
  return { mounted, closing };
}

// Local mirror — SubgraphStage.jsx (the portal precedent this phase's own
// dispatch points at) keeps an identical duplicate rather than importing one
// from a shared file that isn't in this seam's grant either.
function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

// Spawn position — "centered-ish (offset from the node if cheap)" (PLAN.md).
// Reads the card's own on-screen rect (cardRef, already measured for the
// FIT + VERSION STEPPER width heal below) and offers a spot just clear of
// it, clamped into the viewport with an 8px margin; falls back to a fixed
// centered-ish spot if the card isn't measurable yet. A rough 420px height
// guess is enough for this first placement — the layout effect below
// re-clamps against the window's REAL rendered size the instant it mounts.
function spawnPosition(cardEl) {
  const winW = 460;
  const winH = 420;
  const vw = window.innerWidth || 1200;
  const vh = window.innerHeight || 800;
  let left;
  let top;
  const rect = cardEl?.getBoundingClientRect();
  if (rect) {
    // BELOW the node, left-aligned to it (Bryan: "have this popup below
    // the node, not to the right of it") — the vertical stack matches the
    // check-in's own below-the-card vocabulary and keeps the tether short;
    // if the space under the card can't fit the window, fall UP above it
    // rather than sideways.
    left = rect.left;
    top = rect.bottom + 28;
    if (top + winH > vh - 8) top = rect.top - winH - 28;
  } else {
    left = (vw - winW) / 2;
    top = vh * 0.18;
  }
  left = Math.min(Math.max(8, left), Math.max(8, vw - winW - 8));
  top = Math.min(Math.max(8, top), Math.max(8, vh - winH - 8));
  return { left: Math.round(left), top: Math.round(top) };
}

// Drawn-SVG × (DESIGN BAR's "× lesson") — the same 8x8 stroke-cross markup
// FlowCanvas.jsx's CrossIcon and CommentsLayer.jsx's own copy already carry;
// a third port here, neither of those files being in this seam's grant.
function CrossIcon() {
  return (
    <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden="true">
      <path d="M1 1L7 7M7 1L1 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

// COACHING CHIPS amendment 3 (PLAN.md "### COACHING CHIPS amendment 3") —
// the quiet AFTER-preview riding inside an agent turn that proposed a
// drop/merge/split/reorder (run/engine.js's `proposal: { options, removed
// }`, attached only to turns that earned one — see chatWithHuman there).
// "tiny mono eyebrow... over the resulting option rows drawn in the
// node's own exit-row voice (mono uppercase label + the small arrow, same
// family as HandleLabelRows' rendering), removed options shown struck-
// through at the end." nodes.css is off-limits this phase, so every class
// below is an EXISTING one borrowed verbatim rather than a new rule:
// `.cw-stage-banner-text` (OutputNode's own mono/uppercase eyebrow
// treatment — THE REVEAL's "DELIVERED · <FORMAT>" banner) for the
// eyebrow, and shared.jsx's own `.cw-handle-rows`/`.cw-handle-row`/
// `.cw-handle-row-label`/`.cw-handle-row-arrow` (HandleLabelRows' exact
// family, imported above) for the rows — just without a real `<Handle>`
// dot, since this lives inside a chat bubble, not the node's own DOM
// subtree, and a stray Handle here would mint a bogus connection point.
// The strike-through/dim on removed rows and the panel's own top margin
// are inline styles for the same reason (no CSS file in this seam to add
// a class to) — everything else is inherited straight off the borrowed
// classes.
function ProposalPreview({ proposal }) {
  const kept = proposal?.options || [];
  const removed = proposal?.removed || [];
  if (!kept.length && !removed.length) return null;
  return (
    <div style={{ marginTop: 8 }}>
      <span className="cw-stage-banner-text">After this change</span>
      <div className="cw-handle-rows" style={{ marginTop: 6 }}>
        {kept.map((label) => (
          <div className="cw-handle-row" key={`kept-${label}`}>
            <span className="cw-handle-row-label">{label}</span>
            <ArrowRight weight="bold" size={11} className="cw-handle-row-arrow" />
          </div>
        ))}
        {removed.map((label) => (
          <div className="cw-handle-row" key={`removed-${label}`}>
            <span className="cw-handle-row-label" style={{ textDecoration: 'line-through', opacity: 0.5 }}>
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// WINDOW TETHER (PLAN.md "## WINDOW TETHER — B's floating window visibly
// ties to its node") — Bryan, from a screenshot: "when this thing spawns
// ... lets have a new node line connecting to it rather than it being
// completely disconnected from the node its tied to." A screen-space
// connector between the paused gate card and the floating window, drawn as
// a full-viewport SVG portaled ALONGSIDE the window (same target, same
// presence machine — see the render block below): one gentle bezier from
// whichever edge of the card faces the window to whichever edge of the
// window faces the card, each anchor pinned to that edge's MIDPOINT (a
// fixed, non-jittery port rather than a point that slides along the border
// as the two rects nudge past each other mid-drag).
//
// `edgeAnchor(fromRect, toRect)` picks the anchor on `fromRect`: whichever
// axis has the larger center-to-center delta decides whether it's a
// left/right-facing (axis 'x') or top/bottom-facing (axis 'y') edge, and
// `dir` (+1/-1) records WHICH side of that axis got picked (right/bottom
// vs. left/top) — carried through explicitly rather than re-derived from
// the anchor points themselves below, since the window sits close enough
// beside the card in practice that the two anchors can end up only a few
// px apart on their shared axis even while their RECTS are hundreds of px
// apart (a floating ~460px-tall window beside a ~250px-wide card) — a sign
// re-derived from that tiny anchor-to-anchor gap could disagree with the
// direction the edge was actually chosen for.
function edgeAnchor(fromRect, toRect) {
  const fc = { x: fromRect.left + fromRect.width / 2, y: fromRect.top + fromRect.height / 2 };
  const tc = { x: toRect.left + toRect.width / 2, y: toRect.top + toRect.height / 2 };
  const dx = tc.x - fc.x;
  const dy = tc.y - fc.y;
  if (Math.abs(dx) >= Math.abs(dy)) {
    const dir = dx >= 0 ? 1 : -1;
    return { x: dir > 0 ? fromRect.right : fromRect.left, y: fc.y, axis: 'x', dir };
  }
  const dir = dy >= 0 ? 1 : -1;
  return { x: fc.x, y: dir > 0 ? fromRect.bottom : fromRect.top, axis: 'y', dir };
}

// A gentle S-curve ("gentle bezier, not a straight wire" — PLAN.md) —
// leaves each anchor perpendicular to its own edge (each control point
// pushed out along its OWN anchor's axis/direction, never the other's),
// the same shape this app's own wire edges read. Bowed by a fraction of
// the two anchors' straight-line DISTANCE, not just their delta on the
// shared axis — the window and card can sit close on that axis while far
// apart on the other (a window spawned beside a short card but reaching
// well below it), where an axis-delta-only bend collapses to its own
// floor and reads as a cramped elbow instead of a real curve; distance
// keeps the sweep proportional to how far the line actually travels.
// `pathLength={100}` on the <path> elements below (JSX) normalizes the
// stroke-dasharray/-dashoffset math regardless of the curve's real
// on-screen length — the same trick FrameNode.jsx's own tether and
// OutputNode.jsx's results tether already use, just on a <path> here
// instead of a straight <line>.
function tetherPathD(nodeRect, winRect) {
  const from = edgeAnchor(nodeRect, winRect);
  const to = edgeAnchor(winRect, nodeRect);
  const dist = Math.hypot(to.x - from.x, to.y - from.y);
  const bend = Math.min(Math.max(dist * 0.4, 40), 170);
  const c1x = from.axis === 'x' ? from.x + from.dir * bend : from.x;
  const c1y = from.axis === 'y' ? from.y + from.dir * bend : from.y;
  const c2x = to.axis === 'x' ? to.x + to.dir * bend : to.x;
  const c2y = to.axis === 'y' ? to.y + to.dir * bend : to.y;
  return { d: `M${from.x},${from.y} C${c1x},${c1y} ${c2x},${c2y} ${to.x},${to.y}`, from };
}

// HITL SPRING-OPEN's one-shot card-emphasis hook, mirrored from
// CheckinNode.jsx (not exported there, and that file is off-limits to edit
// this phase — see this file's own header comment on the shared-vs-mirror
// choice). Identical shape: fires only on the false->true edge of `active`,
// replays on every fresh pause, no reduced-motion branching needed here
// either (nodes.css's own media block neutralizes `.cw-spring-open`
// directly).
function useSpringOpen(active) {
  const [springing, setSpringing] = useState(false);
  const wasActiveRef = useRef(active);
  useEffect(() => {
    const was = wasActiveRef.current;
    wasActiveRef.current = active;
    if (active && !was) {
      setSpringing(true);
      const t = setTimeout(() => setSpringing(false), 640);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [active]);
  return springing;
}

function HumanNode({ id, data = {}, selected }) {
  const { updateNodeData } = useReactFlow();
  const updateNodeInternals = useUpdateNodeInternals();
  // RUN PHASE (R2 item 2) — continueHuman(nodeId, value) is R1's context
  // addition (state.jsx); optional-chained on call so this never throws
  // even if a caller lands ahead of that in an integration/build. THE GATE
  // NEGOTIATES adds chatWithHuman — HITL MICRO-CHAT's own context fn,
  // already fully generic per-nodeId (see run/engine.js) — for negotiation
  // turns on a paused choice-mode gate.
  const { continueHuman, changeResponseType, chatWithHuman } = useFlowState();

  const number = data.number;
  const ask = data.ask || '';
  const responseType = data.responseType || 'free';
  const isChoice = responseType === 'choice';
  const options = data.options || [];
  // RUN PHASE (R2 items 1/2) — see TriggerNode.jsx for the idle/'idle' note.
  const runState = data.runState && data.runState !== 'idle' ? data.runState : undefined;
  const paused = data.runState === 'paused';
  // RUN SHOW B4 — see shared.jsx useRunFinale.
  const finale = useRunFinale(data.runState, data.seq);
  // X25 B — the one scoping flag (see this file's own header comment on it,
  // above). Stable per node in practice (template-authored, never edited at
  // runtime), so branching render paths on it below never mid-flight swaps
  // out from under a live pause.
  const windowMode = data.chatSurface === 'window';

  // Handle count/id changes whenever responseType flips or an option is
  // added/removed — React Flow needs to know so it can re-measure and keep
  // edges glued to the right spot (see useUpdateNodeInternals docs).
  useEffect(() => {
    updateNodeInternals(id);
  }, [id, responseType, options.length, updateNodeInternals]);

  // THE GATE NEGOTIATES — chatLog/chatOptions mirror CheckinNode.jsx's own
  // defensive defaulting. COACHING CHIPS (PLAN.md "## COACHING CHIPS")
  // retires the old "chatOptions is read nowhere in this file" rule: the
  // hat body below now renders run/engine.js's engine-seeded option-
  // IMPROVEMENT recos (pickCoachingChips) as neutral SEND chips, the same
  // family CheckinNode.jsx's own agent-offered row already uses — the
  // authored `options` stay exactly what they always were, this node's own
  // branch exit rows (HandleLabelRows further down), never a second
  // listing.
  const chatLog = data.chatLog || [];
  const chatOptions = data.chatOptions || [];

  // FIT + VERSION STEPPER's re-measure heal (imported above) — this card's
  // OWN width swap is the trigger here (nodes.css: `.cw-node--human[data-
  // run-state='paused']`), not OutputNode's stage-sized one; `paused` is
  // exactly the flip that fires it.
  const cardRef = useStageWidthHeal(id, paused);

  // HITL SPRING-OPEN item 1 — one-shot card-emphasis flag, true for a beat
  // right as this gate's chat newly pops open.
  const springOpen = useSpringOpen(paused);

  // HITL MICRO-CHAT-shaped local state — the composer's own draft, the
  // agent-reply-pending flag (negotiation turns only — free text resolves
  // synchronously, never sets this), and the hat's open/closed toggle
  // (choice mode only; free mode never renders a hat at all — "no decision
  // chips, no smart chips"). Reset on every FRESH pause so a stale draft or
  // a hat a user collapsed on a PRIOR pause never carries into the next one.
  const [answer, setAnswer] = useState('');
  const [pending, setPending] = useState(false);
  const [hatOpen, setHatOpen] = useState(true);
  // PLUS IS ATTACH — the composer's own staged pick, one at a time ("v1"
  // per PLAN.md). Local, never persisted — a SENT attachment lives on in
  // `data.chatLog[i].attachment` instead (run/engine.js), same "draft vs.
  // record" split `answer`/`chatLog` already draw.
  const [attachment, setAttachment] = useState(null);
  // HAT-TOGGLE HEIGHT LOCK — same fix as CheckinNode.jsx's toggleHat (that
  // file's comment carries the full reasoning; Bryan: the hat toggle
  // "should not resize the node"): first collapse of a pause pins the chat
  // box's height, the transcript absorbs the difference (.is-locked,
  // nodes.css), released when the pause ends. Applies to BOTH hosts of
  // this gate's chat surface — the in-card box and the B window.
  const chatBoxRef = useRef(null);
  const [boxLockHeight, setBoxLockHeight] = useState(null);
  useEffect(() => {
    if (!paused) setBoxLockHeight(null);
  }, [paused]);
  function toggleHat() {
    if (paused && boxLockHeight == null && chatBoxRef.current) {
      setBoxLockHeight(Math.round(chatBoxRef.current.getBoundingClientRect().height));
    }
    setHatOpen((v) => !v);
  }
  const transcriptRef = useRef(null);
  const textareaRef = useRef(null);
  // X25 B — "a fresh pause always spawns the window open" (PLAN.md). Reset
  // alongside every other fresh-pause reset just below.
  const [winOpen, setWinOpen] = useState(false);
  useEffect(() => {
    if (paused) {
      setAnswer('');
      setHatOpen(true);
      setPending(false);
      setAttachment(null);
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
      if (windowMode) setWinOpen(true);
    } else {
      // PLUS IS ATTACH — a staged-but-never-sent pick must not survive
      // into the dormant/resolved state (this component instance persists
      // across pause<->resolve, unlike chatLog which run/engine.js owns).
      setAttachment(null);
    }
  }, [paused, windowMode]);

  // Auto-scroll to the newest turn — same trigger shape as CheckinNode.jsx
  // (fresh message OR the typing indicator mounting).
  useEffect(() => {
    const el = transcriptRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [chatLog.length, pending]);

  // X25 B — the window is on screen exactly when it's a window-mode gate,
  // the run is actually paused here, AND the user hasn't closed it (the ×)
  // since. `useWindowPresence` keeps the portal mounted through the close
  // spring so it can animate OUT instead of vanishing (DESIGN BAR item 4).
  //
  // GLIDE-SETTLED GATE (Bryan: "it pops in up top, and teleports to below
  // the node. It should animate in below the node, not teleport") — the
  // pause camera-glide moves the node AFTER the pause lands, so a window
  // mounted immediately springs in at the node's PRE-glide spot and then
  // has to jump. Instead the window waits for the viewport transform to
  // hold still (3 consecutive stable frames, 1000ms hard cap), THEN mounts
  // — camera first, surface second, one entrance in the right place. The
  // flag stays true for the rest of the pause (a strip-respawn opens
  // instantly; the glide only ever runs at the pause's start) and resets
  // when the pause ends.
  const [glideSettled, setGlideSettled] = useState(false);
  useEffect(() => {
    if (!(windowMode && paused)) {
      setGlideSettled(false);
      return undefined;
    }
    const vp = document.querySelector('#workflow-root .react-flow__viewport');
    if (!vp) {
      setGlideSettled(true);
      return undefined;
    }
    let raf = 0;
    let last = vp.style.transform;
    let stable = 0;
    const started = performance.now();
    const tick = () => {
      const now = vp.style.transform;
      stable = now === last ? stable + 1 : 0;
      last = now;
      const elapsed = performance.now() - started;
      // 300ms grace BEFORE stability can count: the glide starts a beat
      // after the pause lands, so "stable" in the first frames just means
      // it hasn't begun yet (the first gate fix shipped exactly that bug —
      // the window mounted pre-glide and got dragged out from under).
      if ((stable >= 3 && elapsed > 300) || elapsed > 1100) {
        setGlideSettled(true);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [windowMode, paused]);
  const winActive = windowMode && paused && winOpen && glideSettled;
  const { mounted: winMounted, closing: winClosing } = useWindowPresence(winActive);
  const winRef = useRef(null);
  const [winPos, setWinPos] = useState(null);
  const wasWinActiveRef = useRef(false);
  // Spawn placement — fires once per OPEN edge (a fresh pause's auto-open,
  // or a respawn click after the user closed it), never on every render;
  // cheap first guess off the card's own on-screen rect (spawnPosition,
  // above).
  const winDraggedRef = useRef(false);
  useEffect(() => {
    if (winActive && !wasWinActiveRef.current) {
      wasWinActiveRef.current = true;
      winDraggedRef.current = false;
      // One placement, once: winActive is now gated on the camera glide
      // having SETTLED (see glideSettled above), so the card's rect here
      // is its final resting spot — the window springs in below it and
      // never has to move (the old post-glide second-pass reposition,
      // which read as a teleport, is gone with the gate).
      setWinPos(spawnPosition(cardRef.current));
    }
    wasWinActiveRef.current = winActive;
    return undefined;
  }, [winActive]);
  // Re-clamp against the window's REAL rendered size the instant it mounts
  // (spawnPosition's own height is a guess — a short opener + a tall hat
  // full of long option labels can render taller or shorter than that).
  // Viewport-bounded, same 8px margin `spawnPosition`/the drag handler use.
  useLayoutEffect(() => {
    if (!winMounted) return;
    const el = winRef.current;
    if (!el || !winPos) return;
    const rect = el.getBoundingClientRect();
    const maxLeft = Math.max(8, window.innerWidth - rect.width - 8);
    const maxTop = Math.max(8, window.innerHeight - rect.height - 8);
    const left = Math.min(Math.max(8, winPos.left), maxLeft);
    const top = Math.min(Math.max(8, winPos.top), maxTop);
    if (left !== winPos.left || top !== winPos.top) setWinPos({ left, top });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [winMounted]);

  // WINDOW TETHER — the connector's own per-frame tracker. Refs (not React
  // state) so a drag/pan doesn't re-render the whole card 60x/sec: the path
  // `d` and port position are written straight to the DOM, exactly the
  // "cheap — two getBoundingClientRect calls" the contract calls for. Runs
  // for the tether's WHOLE mounted lifetime (not just while dragging) —
  // "the line follows continuously through window drags, node drags, and
  // canvas pan/zoom," none of which fire an event this file can listen for
  // (canvas pan/zoom especially — "no event-plumbing into FlowCanvas" is
  // the contract's own reasoning for rAF over wiring one up). Gated on
  // `winMounted`, the SAME flag the window portal itself mounts on, so the
  // loop starts and stops with the tether's own presence — never ticks
  // while there is nothing to draw.
  const tetherLineRef = useRef(null);
  const tetherShimmerRef = useRef(null);
  const tetherPortRef = useRef(null);
  useEffect(() => {
    if (!(windowMode && winMounted)) return undefined;
    let rafId;
    function updateFrame() {
      const nodeEl = cardRef.current;
      const winEl = winRef.current;
      if (nodeEl && winEl) {
        const nodeRect = nodeEl.getBoundingClientRect();
        const winRect = winEl.getBoundingClientRect();
        const { d, from } = tetherPathD(nodeRect, winRect);
        if (tetherLineRef.current) tetherLineRef.current.setAttribute('d', d);
        if (tetherShimmerRef.current) tetherShimmerRef.current.setAttribute('d', d);
        if (tetherPortRef.current) {
          tetherPortRef.current.style.left = `${from.x}px`;
          tetherPortRef.current.style.top = `${from.y}px`;
        }
      }
      rafId = requestAnimationFrame(updateFrame);
    }
    updateFrame();
    return () => cancelAnimationFrame(rafId);
  }, [windowMode, winMounted]);

  // Draggable-by-header — plain mouse events (not React Flow's own drag,
  // which this portal sits entirely outside of): pointer stays glued to
  // where it grabbed the header, position clamped to the viewport every
  // move. Ignores the × (its own click handles the close) and non-primary
  // buttons. Local state only, per the contract — never persisted, never
  // synced to data, refresh-resets.
  function onWindowHeaderMouseDown(e) {
    if (e.button !== 0) return;
    if (e.target.closest('.cw-gate-window-close')) return;
    const el = winRef.current;
    if (!el) return;
    e.preventDefault();
    const rect = el.getBoundingClientRect();
    const grabX = e.clientX - rect.left;
    const grabY = e.clientY - rect.top;
    function onMove(ev) {
      const maxLeft = Math.max(8, window.innerWidth - rect.width - 8);
      const maxTop = Math.max(8, window.innerHeight - rect.height - 8);
      setWinPos({
        left: Math.min(maxLeft, Math.max(8, ev.clientX - grabX)),
        top: Math.min(maxTop, Math.max(8, ev.clientY - grabY)),
      });
    }
    function onUp() {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }

  // FREE TEXT — "the typed message IS the answer... resolves via
  // continueHuman as today — one exchange, no negotiation loop." Bypasses
  // chatWithHuman entirely; identical shape to this file's old
  // submitAnswer(), just fired from the chat-box composer instead of the
  // retired `.cw-human-live` input.
  function submitAnswer() {
    if (!paused) return;
    const value = answer.trim();
    // PLUS IS ATTACH — free text resolves in ONE shot, straight through
    // continueHuman (no chatWithHuman negotiation loop exists for this
    // mode — "the typed message IS the answer," unchanged). There is no
    // engine reply to acknowledge an attachment here, so a staged pick
    // folds into the resolved VALUE itself as plain, honest text instead
    // of silently vanishing.
    if (!value && !attachment) return;
    setAnswer('');
    const note = attachment ? attachmentLabel(attachment) : null;
    setAttachment(null);
    continueHuman?.(id, note ? `${value}${value ? ' — ' : ''}attached ${note}` : value);
  }

  // MULTIPLE CHOICE — "typed composer messages are NEGOTIATION turns...
  // that never resolve." (THE GATE NEGOTIATES' own words: "the decision
  // chips are the only exits" — COACHING CHIPS retires those chips; "Approve
  // & continue," below, is the only exit now.) Calls the SAME chatWithHuman
  // run/engine.js already exposes for the check-in — no forked reply
  // machinery; a coaching-chip click (chatBox's hat body) is just another
  // caller of this same function.
  async function sendNegotiation(text) {
    const value = (text || '').trim();
    // PLUS IS ATTACH — a staged attachment allows a text-free send (the
    // SAME "attachments allow a text-free send" rule canvas-attach's own
    // composer already holds), and rides whichever turn actually fires
    // next — a typed message, OR a coaching-chip click while a pick is
    // still staged (see the composer's own attach-menu comment below).
    if ((!value && !attachment) || pending || !paused) return;
    setAnswer('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    const outgoing = encodeChatAttachment(value, attachment);
    setAttachment(null);
    setPending(true);
    try {
      await chatWithHuman?.(id, outgoing);
    } finally {
      setPending(false);
    }
  }

  function sendComposer() {
    if (isChoice) sendNegotiation(answer);
    else submitAnswer();
  }

  // WINDOW TETHER addendum — "Approve & continue," a full-width resolve
  // action below the composer. COACHING CHIPS supersedes this button's own
  // CHOICE-mode resolution rule (the old "always the FIRST authored
  // option" default): the old direct-resolve decision chips retire (their
  // row is now the neutral coaching-chip advisory below), so this button —
  // and its in-card equivalent, rendered further down for a non-window
  // gate — becomes the ONLY resolve action a choice gate has. "Approve &
  // continue" now resolves the LEANED option (`data.chatLeaning`, written
  // by run/engine.js's chatWithHuman the instant a negotiation turn names
  // one) — "the leaning IS the choice" — falling back to the FIRST
  // authored option only when the conversation never leaned anywhere (a
  // fresh pause, or every turn so far stayed ambiguous). Free-text gate:
  // unchanged — resolves with whatever's in the composer, or the literal
  // string 'approved' if it's empty, the same "typed message IS the
  // answer" resolve `submitAnswer` uses, just with a fallback value
  // instead of a no-op when there's nothing typed.
  function approveAndContinue() {
    if (!paused) return;
    if (isChoice) {
      const leaned = data.chatLeaning != null ? options.find((o) => o.id === data.chatLeaning) : null;
      const target = leaned || options[0];
      if (!target) return;
      continueHuman?.(id, target.id);
    } else {
      const value = answer.trim();
      setAnswer('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
      // PLUS IS ATTACH — same fold as submitAnswer's own comment: no
      // engine reply exists on this path, so a staged pick rides along as
      // plain text in the resolved value instead of quietly disappearing.
      const note = attachment ? attachmentLabel(attachment) : null;
      setAttachment(null);
      continueHuman?.(id, note ? `${value}${value ? ' — ' : ''}attached ${note}` : value || 'approved');
    }
  }

  function autoGrowComposer(el) {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 72)}px`;
  }

  // THE CHAT BOX NODE item 3 — the hat only ever reads "open" while this
  // node is actually paused; choice mode only (free mode renders no hat).
  const hatLive = isChoice && paused && hatOpen;

  const chatAgentLabel = data.agent || DEFAULT_CHAT_AGENT_LABEL;
  const chatModelOptions = [{ value: chatAgentLabel, label: chatAgentLabel }, ...TASK_MODEL_OPTIONS];
  const chatModelValue = data.chatModel || chatAgentLabel;

  // X25 B — the SAME chat-box JSX THE GATE NEGOTIATES built, lifted into a
  // variable so it can be re-hosted verbatim into the floating window below
  // instead of forked: one definition, mounted in exactly one of two spots
  // per render (in-card Reveal for a plain gate, the portal window for a
  // window-mode one — see the return block below), never both.
  const chatBox = (
    <div
      ref={chatBoxRef}
      className={`cw-chat-box${boxLockHeight ? ' is-locked' : ''}`}
      style={boxLockHeight ? { height: `${boxLockHeight}px` } : undefined}
    >
      <div className="cw-chat-transcript" ref={transcriptRef}>
        {chatLog.map((m, i) => {
          const isUser = m.role === 'user';
          return (
            <div key={i} className={`cw-chat-msg cw-chat-msg--${isUser ? 'user' : 'agent'}`}>
              {!isUser && (
                <span className="cw-chat-avatar" aria-hidden="true">
                  <Sparkle weight="fill" size={9} />
                </span>
              )}
              <div className="cw-chat-msg-col">
                {!isUser && <span className="cw-chat-msg-name">Agent</span>}
                {/* PLUS IS ATTACH — "attachments allow a text-free send"
                    (canvas-attach's own precedent): an attachment-only turn
                    carries no caption, so the bubble paragraph is skipped
                    rather than rendering empty. */}
                {m.text ? <p className="cw-chat-bubble">{m.text}</p> : null}
                {isUser && m.attachment && <AttachCard attachment={m.attachment} />}
                {!isUser && m.proposal && <ProposalPreview proposal={m.proposal} />}
              </div>
            </div>
          );
        })}
        {pending && (
          <div className="cw-chat-msg cw-chat-msg--agent">
            <span className="cw-chat-avatar" aria-hidden="true">
              <Sparkle weight="fill" size={9} />
            </span>
            <div className="cw-chat-msg-col">
              <span className="cw-chat-msg-name">Agent</span>
              <div className="cw-chat-typing" role="status" aria-label="Agent is typing">
                <span className="cw-chat-typing-dot" />
                <span className="cw-chat-typing-dot" />
                <span className="cw-chat-typing-dot" />
              </div>
            </div>
          </div>
        )}
        {!chatLog.length && !pending && (
          <p className="cw-caption cw-chat-empty">Waiting on the agent's opener…</p>
        )}
      </div>

      {/* COACHING CHIPS (PLAN.md "## COACHING CHIPS") — the hat body no
          longer maps AUTHORED options to direct-resolve decision chips
          (`cw-gate-decision-chip` dies with them — nothing in this file
          applies that class any more). It renders run/engine.js's own
          `chatOptions` — option-IMPROVEMENT recos, engine-seeded, refreshed
          after every reply — as the SAME neutral SEND-chip family
          CheckinNode.jsx's agent-offered row already uses: a click is a
          normal chatWithHuman negotiation turn (sendNegotiation, never a
          resolve). The authored options never disappear — they're still
          the node's own branch exit rows just below (HandleLabelRows),
          always visible while paused; "Approve & continue" (below the
          composer) is now the only click that actually resolves this
          gate. */}
      {isChoice && (
        <div className={`cw-chat-hat${hatLive ? ' is-open' : ''}`}>
          <button
            type="button"
            className="cw-chat-hat-head nodrag nopan"
            onClick={toggleHat}
            aria-expanded={hatLive}
          >
            <span className="cw-chat-hat-title">
              <span className="cw-chat-hat-dot" aria-hidden="true" />
              <span className="cw-chat-hat-title-text">Choose an option or chat</span>
            </span>
            <CaretDown weight="bold" size={10} className="cw-chat-hat-caret" />
          </button>
          <Reveal open={hatLive}>
            <div className="cw-chat-hat-body">
              {chatOptions.map((opt, i) => (
                <button
                  key={`chip-${i}`}
                  type="button"
                  className="cw-chat-hat-chip nodrag nopan"
                  disabled={pending}
                  onClick={() => sendNegotiation(opt)}
                >
                  <span>{opt}</span>
                </button>
              ))}
            </div>
          </Reveal>
        </div>
      )}

      <div className="cw-chat-composer">
        {/* PLUS IS ATTACH item 2 — the staged chip lives as the composer's
            own first child, above the field (canvas-attach's own placement,
            "first content child of .composer"). Reveal wraps it (never a
            bare `{attachment && ...}`) so removing it — the × or a
            successful send — animates out instead of vanishing (DESIGN BAR
            item 4). */}
        <Reveal open={!!attachment}>
          {attachment ? <AttachChip attachment={attachment} onRemove={() => setAttachment(null)} /> : null}
        </Reveal>
        <textarea
          ref={textareaRef}
          className="cw-chat-composer-input nodrag nopan"
          placeholder={isChoice ? 'Reply to the agent…' : 'Type your response…'}
          rows={1}
          value={answer}
          onChange={(e) => {
            setAnswer(e.target.value);
            autoGrowComposer(e.target);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              sendComposer();
            }
          }}
        />
        <div className="cw-chat-composer-actions">
          <div className="cw-chat-composer-tools">
            {/* PLUS IS ATTACH item 1/5 — the ONE shared menu component
                (shared.jsx), mounted identically here (in-card gate) and in
                the B window below (same `chatBox` var, two hosts) and in
                CheckinNode.jsx's own box. */}
            <AttachMenu nodeId={id} disabled={!paused} attachment={attachment} onAttach={setAttachment} />
            {/* PLUS IS ATTACH — "the wand stays inert" (PLAN.md), unchanged
                from before this phase: no handler, no `disabled` attr
                added either — its rest-state look stays exactly as it was. */}
            <button type="button" className="cw-chat-composer-tool nodrag nopan" aria-label="Creative tools">
              <MagicWand weight="regular" size={13} />
            </button>
          </div>
          <div className="cw-chat-composer-right">
            {/* MODEL-AGNOSTIC POSTURE — the EXISTING ComboBox, never a
                native select. COACHING CHIPS amendment 2 — the popover
                lists models FLAT (no provider section headers; the
                per-row provider marks alone carry recognition), so
                `groupOf` is gone here same as CheckinNode/TaskNode/
                GenerateNode. */}
            <ComboBox
              value={chatModelValue}
              options={chatModelOptions}
              placeholder="Select a model..."
              onChange={(v) => updateNodeData(id, { chatModel: v || null })}
              ariaLabel="Chat model"
              className="cw-chat-model-combo"
            />
            <button
              type="button"
              className="cw-chat-send nodrag nopan"
              disabled={(!answer.trim() && !attachment) || (isChoice && pending) || !paused}
              onClick={sendComposer}
              aria-label="Send"
            >
              {/* Drawn SVG four-point sparkle (the shell's own send-button
                  glyph), never the paper-plane icon. */}
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M9 5 L10.6 11.4 L17 13 L10.6 14.6 L9 21 L7.4 14.6 L1 13 L7.4 11.4 Z" />
                <path d="M17 3 L17.7 5.3 L20 6 L17.7 6.7 L17 9 L16.3 6.7 L14 6 L16.3 5.3 Z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // X25 B — the window header's own eyebrow voice, CardEyebrow's exact text
  // formula mirrored (that component isn't reused directly — a slim window
  // header isn't the two-line card head it renders).
  const windowEyebrowText =
    number != null ? `${String(number).padStart(2, '0')} · Human Intervention · Pauses` : 'Human Intervention · Pauses';
  const windowTarget = typeof document !== 'undefined' ? document.getElementById('workflow-root') : null;

  return (
    // MOTION PHASE (M2 item 1) — see TriggerNode.jsx for the --cw-seq note.
    <div
      ref={cardRef}
      className={`cw-node cw-node--human${selected ? ' is-selected' : ''}${finale ? ' cw-node--finale' : ''}${springOpen ? ' cw-spring-open' : ''}`}
      style={{ '--cw-seq': data.seq }}
      data-run-state={runState}
      // X25 B — read by nodes.css to keep a window-mode gate's card at its
      // REST width through a pause (the in-card 460px swap is scoped
      // `:not([data-chat-surface='window'])` for exactly this reason).
      data-chat-surface={windowMode ? 'window' : undefined}
    >
      {/* RUN PHASE (R2 item 4) */}
      <NodeActionsToolbar nodeId={id} />
      {/* RUN SHOW B2 */}
      <RunCornerTicks />
      <div className="cw-card-head">
        {/* "pause" left the title corner for the eyebrow (same cleanup as
            OutputNode's format tag — the corner is the run stamp's alone). */}
        <CardEyebrow icon={User} number={number} kind="Human Intervention · Pauses" />
        {/* RUN SHOW B3 */}
        <RunStamp runState={data.runState} />
        <div className="cw-card-title-row">
          <span className="cw-title">Human Intervention</span>
        </div>
      </div>

      {/* THE GATE NEGOTIATES follow-up (Fable, from the integrated eyeball):
          the PROGRAMMING face folds away while paused — with the chat box
          below, keeping it visible doubled everything (the ask as input AND
          opener, the options as editor rows AND decision chips): the exact
          both-faces-at-once confusion ## HITL TWO FACES already litigated.
          One face at a time; the run face is the chat. HandleLabelRows
          stays OUTSIDE this fold (below) — the branch wires must keep
          their labeled exit rows while the run is deciding through them. */}
      <Reveal open={!paused}>
        <>
          <FieldLabel>Ask the user for</FieldLabel>
          <input
            type="text"
            className="cw-input nodrag nopan"
            placeholder="What do you need from the user?"
            value={ask}
            onChange={(e) => updateNodeData(id, { ask: e.target.value })}
          />

          <FieldLabel>Response type</FieldLabel>
          <Segmented
            ariaLabel="Response type"
            value={responseType}
            onChange={(v) => changeResponseType(id, v)}
            options={[
              { value: 'free', label: 'Free text' },
              { value: 'choice', label: 'Multiple choice' },
            ]}
          />

          {/* NODE BREATHE PHASE — "the per-response-type body... when the
              type changes" (PLAN.md). Reveal unconditional; its `open`
              replaces the old `responseType === 'choice' &&` guard, same
              reasoning as TaskNode's attachments block (see that file). */}
          <Reveal open={isChoice}>
            <>
              <FieldLabel>Options → next step</FieldLabel>
              <OptionsEditor options={options} onChange={(next) => updateNodeData(id, { options: next })} />
              <p className="cw-caption">Connect each option handle on the right to the step it should lead to.</p>
            </>
          </Reveal>
        </>
      </Reveal>

      {/* Option handles live OUTSIDE the programming fold — "they stay laid
          out (just clipped) through the collapse rather than display:none,
          which is exactly what keeps them trackable mid-animation" (NODE
          BREATHE), and during a pause they are the visible exit rows this
          gate resolves through — COACHING CHIPS routes that resolve via
          "Approve & continue" (below) landing on the LEANED option's
          handle, rather than a direct per-option chip click. */}
      <Reveal open={isChoice}>
        <HandleLabelRows
          nodeId={id}
          items={options.map((o) => ({ handleId: `opt-${o.id}`, label: o.label || 'Option' }))}
        />
      </Reveal>

      {/* THE GATE NEGOTIATES (PLAN.md "## THE GATE NEGOTIATES") — the SAME
          chat-box surface CheckinNode.jsx wakes: transcript (opener seeded
          by run/engine.js from the AUTHORED `ask`) + composer, plus (choice
          mode only) a hat housing engine-seeded option-improvement recos as
          neutral chips (COACHING CHIPS — see `chatBox`'s own hat-body
          comment above; the authored options are never re-listed here,
          they're the branch exit rows just above). "NO dormant chat box at
          rest on the gate... the surface exists only while paused; real
          entrance AND exit" — nothing here is ever permanently mounted.
          X25 B — a window-mode gate NEVER renders `chatBox` in-card (built
          above; re-hosted into the floating window instead, just below) —
          this Reveal shows only the quiet status line/strip the contract
          calls for. Every non-window gate keeps the original
          `<Reveal open={paused}>{chatBox}</Reveal>`, now joined by
          COACHING CHIPS' own in-card "Approve & continue" — the decision
          chips it replaces used to BE this gate's resolve action, so a
          non-window choice gate needs its own equivalent of the window's
          resolve button (same `approveAndContinue`/`.cw-chat-approve-
          button`, same "leaned option, else the first" rule — see that
          function's own comment). Free-text mode gets no such button
          in-card, unchanged — the composer/Enter resolve it exactly as
          before. */}
      {windowMode ? (
        <Reveal open={paused}>
          <div className="cw-gate-window-status">
            {winOpen ? (
              <p className="cw-gate-window-line">
                <span className="cw-gate-window-dot" aria-hidden="true" />
                In conversation…
              </p>
            ) : (
              // WINDOW TETHER addendum 3 — "losing it right now" (Bryan): this
              // is the ONE strip that has to read as a stopped-on-you call to
              // action, not a quiet status line — nodes.css recuts it into the
              // paused-amber family. The dot upgrades from a plain span to the
              // same breathing-port anatomy the tether's own NODE-end port
              // uses (glow/pulse/dot — no static ring here, the strip is too
              // compact a row for a fourth layer to read as anything but
              // noise), same 2.8s clock, same `--cw-kind-human` ink.
              <button type="button" className="cw-gate-window-strip nodrag nopan" onClick={() => setWinOpen(true)}>
                <span className="cw-gate-window-strip-port" aria-hidden="true">
                  <span className="cw-gate-window-strip-port-glow" />
                  <span className="cw-gate-window-strip-port-pulse" />
                  <span className="cw-gate-window-strip-port-dot" />
                </span>
                Waiting on you — open chat
              </button>
            )}
          </div>
        </Reveal>
      ) : (
        <>
          <Reveal open={paused}>{chatBox}</Reveal>
          {isChoice && (
            <Reveal open={paused}>
              <button
                type="button"
                className="cw-chat-approve-button nodrag nopan"
                onClick={approveAndContinue}
                disabled={!paused || options.length === 0}
              >
                Approve &amp; continue
              </button>
            </Reveal>
          )}
        </>
      )}

      {/* X25 B — the floating window: portaled to #workflow-root (the
          SubgraphStage.jsx precedent — `position: fixed`, escapes React
          Flow's pan/zoom viewport entirely, "screen-space is the point of
          B"). `winMounted` (useWindowPresence, above) keeps it alive through
          its own close spring instead of vanishing on the ×; that click
          only flips `setWinOpen(false)` — a real exit, the run stays
          paused.
          WINDOW TETHER — the connector portals ALONGSIDE the window, same
          target, same `winMounted` gate ("Enters/exits WITH the window
          (same presence machine)" — PLAN.md), so the two mount/unmount as
          one unit: absent whenever the card shows the strip (winOpen
          false), back the instant a respawn remounts the window. `d` starts
          empty and is written per-frame by the rAF effect above — nothing
          to draw until the first measured frame, avoiding a stray line to
          the origin on mount. */}
      {windowMode &&
        winMounted &&
        windowTarget &&
        createPortal(
          <>
            <div className={`cw-gate-tether${winClosing ? ' is-closing' : ''}`} aria-hidden="true">
              <svg className="cw-gate-tether-svg">
                <path ref={tetherLineRef} className="cw-gate-tether-line" pathLength={100} d="" />
                <path ref={tetherShimmerRef} className="cw-gate-tether-shimmer" pathLength={100} d="" />
              </svg>
              {/* Port dot at the NODE end only — "so the origin reads"
                  (PLAN.md). Same glow/pulse/ring/dot anatomy the results
                  tether's own port uses, recolored into the amber paused
                  family (--cw-kind-human) instead of that one's accent
                  blue — "blue = delivered for you" vs. "amber = waiting on
                  you" (RESULTS SHEET's own color rule, mirrored here). */}
              <div ref={tetherPortRef} className="cw-gate-tether-port">
                <span className="cw-gate-tether-port-glow" />
                <span className="cw-gate-tether-port-pulse" />
                <span className="cw-gate-tether-port-ring" />
                <span className="cw-gate-tether-port-dot" />
              </div>
            </div>
            <div
              ref={winRef}
              className={`cw-gate-window${winClosing ? ' is-closing' : ''}`}
              style={winPos ? { left: winPos.left, top: winPos.top } : { left: -9999, top: -9999 }}
              role="dialog"
              aria-label={ask || 'Human intervention'}
            >
              <div className="cw-gate-window-head nodrag nopan" onMouseDown={onWindowHeaderMouseDown}>
                <span className="cw-gate-window-eyebrow">{windowEyebrowText}</span>
                <button
                  type="button"
                  className="cw-gate-window-close nodrag nopan"
                  onClick={() => setWinOpen(false)}
                  aria-label="Close"
                >
                  <CrossIcon />
                </button>
              </div>
              <div className="cw-gate-window-body">
                {chatBox}
                {/* WINDOW TETHER addendum — the window's own full-width
                    resolve action, below the composer (see
                    `approveAndContinue` above for the per-mode
                    resolution rule). `.cw-chat-approve-button` — the
                    SHARED class addendum 2 also puts on CheckinNode.jsx's
                    own relocated approve action (nodes.css). Disabled
                    once there is nothing it could resolve with: a choice
                    gate authored with zero options (defensive —
                    OptionsEditor always seeds one in practice). */}
                <button
                  type="button"
                  className="cw-chat-approve-button nodrag nopan"
                  onClick={approveAndContinue}
                  disabled={!paused || (isChoice && options.length === 0)}
                >
                  Approve &amp; continue
                </button>
              </div>
            </div>
          </>,
          windowTarget
        )}

      <InHandle nodeId={id} />
      {/* Free text (and any stale non-choice value, e.g. a leftover 'chat'
          stamp) gets the plain out handle; choice mode's per-option handles
          (HandleLabelRows above) are the only outs when branching. */}
      {responseType !== 'choice' && <OutHandle nodeId={id} />}
    </div>
  );
}

export default memo(HumanNode);
