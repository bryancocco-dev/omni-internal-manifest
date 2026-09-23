// Seam C — Nodes
//
// NODE BREATHE PHASE (PLAN.md "## NODE BREATHE PHASE") — Bryan: "the node
// smoothly expands open and closed with easing when you're adding stuff or
// removing it... really nice buttery smooth node animations." One shared
// primitive every node wraps its conditional sections in, instead of each
// hand-rolling its own show/hide.
//
// Mechanism — the CSS-only auto-height trick (no ResizeObserver, no measured
// pixel heights, per PLAN.md): an outer `display:grid` row transitions its
// OWN track size between `grid-template-rows: 0fr` (collapsed) and `1fr`
// (however tall the content wants to be). A single `fr` track on a single
// row resolves to the content's natural (max-content) height, so animating
// the fr value IS animating to an unknown height with zero JS measurement —
// nodes.css owns the actual transition/timing declarations; this file only
// toggles the `is-open` class and times the mount/unmount around it.
//
// The outer grid div is NEVER conditionally rendered by this component —
// every call site renders `<Reveal open={bool}>` UNCONDITIONALLY, every
// render, so the same div persists across an open/close cycle and its class
// swap is a real style CHANGE on an existing element (what a CSS transition
// needs to fire) rather than a value a freshly-created element would just
// paint directly with nothing to transition from. Callers must drop their
// old `{cond && <jsx/>}` guard and hand the jsx to Reveal unconditionally —
// wrapping the guard AROUND Reveal instead would unmount Reveal itself on
// close and reintroduce the exact snap this phase exists to kill.
//
// Presence machine (mirrors FlowCanvas.jsx's issues-pill mount/closing state
// machine — see that file's own comment for the sibling pattern this
// follows): children stay MOUNTED for the whole CLOSE transition and only
// unmount once it actually finishes (`transitionend`, with a ~400ms fallback
// timer for a transition that never fires — an ancestor going display:none
// mid-flight, etc.). `onExited` is an optional extra hook (not part of the
// PLAN.md API line, which is just `<Reveal open={bool}>{children}</Reveal>`)
// — OptionsEditor (this folder's shared.jsx) needs to know exactly when a
// removed row has finished collapsing before it actually splices the row out
// of `options`, and this is the one clean seam to tell it that.
//
// React Flow integrity (PLAN.md "React Flow integrity") — on every settle,
// open OR close, re-measure via `updateNodeInternals` so handles/edges never
// get stuck reading a mid-animation size. Mirrors FlowCanvas.jsx's own
// `animationend` heal for cw-materialize/cw-land, just keyed off
// `transitionend` + `useNodeId()` instead of a DOM `closest()` walk, since
// this runs from inside the node's own render tree already.

import { useEffect, useRef, useState } from 'react';
import { useNodeId, useUpdateNodeInternals } from '@xyflow/react';

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

export default function Reveal({ open, children, onExited }) {
  const nodeId = useNodeId();
  const updateNodeInternals = useUpdateNodeInternals();

  const [mounted, setMounted] = useState(open);
  // `settled` — the open transition has fully finished. The inner wrapper's
  // overflow:hidden is what makes the height animation clip cleanly, but
  // holding it FOREVER also clips anything that legitimately hangs past the
  // card edge — which is exactly where React Flow handles live. HumanNode's
  // choice block wraps its per-option handles in this component, and the
  // permanent clip made them invisible AND un-draggable (Bryan: "i cant
  // pull the nodes next to approved and needs changes"). Once settled, the
  // clip lifts (nodes.css `.is-settled`); it re-arms the moment `open`
  // changes in either direction so the animation itself always clips.
  const [settled, setSettled] = useState(open);
  const mountedRef = useRef(open);
  const rowRef = useRef(null);
  const closeTimerRef = useRef(null);
  const onExitedRef = useRef(onExited);
  onExitedRef.current = onExited;

  // Stable indirection so the two effects below can call "finish closing"
  // without needing each other (or onExited) in their dependency arrays.
  const finishCloseRef = useRef(null);
  finishCloseRef.current = () => {
    clearTimeout(closeTimerRef.current);
    if (!mountedRef.current) return;
    mountedRef.current = false;
    setMounted(false);
    onExitedRef.current?.();
  };

  useEffect(() => {
    if (open) {
      clearTimeout(closeTimerRef.current);
      mountedRef.current = true;
      setMounted(true);
      setSettled(false);
      // Settle fallback mirrors the close fallback below: reduced motion
      // never fires transitionend (transition is off), and a lost event
      // must not leave handles clipped forever.
      closeTimerRef.current = setTimeout(() => setSettled(true), prefersReducedMotion() ? 0 : 400);
      return () => clearTimeout(closeTimerRef.current);
    }
    setSettled(false);
    if (!mountedRef.current) return undefined;
    // Reduced motion: nodes.css turns the transition off below, so
    // `transitionend` never fires — unmount immediately instead of waiting
    // out the fallback timer (PLAN.md: "transitions off, instant
    // mount/unmount").
    if (prefersReducedMotion()) {
      finishCloseRef.current();
      return undefined;
    }
    // Belt-and-braces fallback (PLAN.md "~400ms") — the transitionend
    // listener below is the normal path and clears this before it fires;
    // this only matters for a transition that never completes for some
    // other reason (an ancestor toggling display:none mid-flight, ...).
    closeTimerRef.current = setTimeout(() => finishCloseRef.current(), 400);
    return () => clearTimeout(closeTimerRef.current);
  }, [open]);

  useEffect(() => {
    const el = rowRef.current;
    if (!el) return undefined;
    function onTransitionEnd(e) {
      // Nested Reveals (e.g. HumanNode's choice block wraps OptionsEditor,
      // whose own rows are each a Reveal) bubble their transitionend too —
      // only react to this instance's own row, not a descendant's.
      if (e.target !== el || e.propertyName !== 'grid-template-rows') return;
      if (!open) finishCloseRef.current();
      else setSettled(true);
      if (nodeId) updateNodeInternals(nodeId);
    }
    el.addEventListener('transitionend', onTransitionEnd);
    return () => el.removeEventListener('transitionend', onTransitionEnd);
  }, [open, nodeId, updateNodeInternals]);

  return (
    <div className={`cw-reveal${open ? ' is-open' : ''}${open && settled ? ' is-settled' : ''}`} ref={rowRef}>
      <div className="cw-reveal-inner">
        {mounted ? <div className={`cw-reveal-content${open ? ' is-open' : ''}`}>{children}</div> : null}
      </div>
    </div>
  );
}
