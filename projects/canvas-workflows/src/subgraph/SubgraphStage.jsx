// SUBGRAPHS — full spec (PLAN.md "## SUBGRAPHS — full spec (the closing
// flagship)", held to "## DESIGN BAR" + "## MODEL-AGNOSTIC POSTURE"). The
// "Enter / surface" theater: a task's card visually BECOMES a full-viewport
// internal stage showing its steps, and mirrors itself exactly in reverse
// on the way out.
//
// Two components:
//   SubgraphStage  — owns the theatrical shell only: the FLIP transition
//     (measures the real card's on-screen rect, animates this stage's own
//     surface from that rect to full-viewport and back — same "two explicit
//     style assignments + a forced reflow" idiom shared.jsx's own
//     animateCollapse already established, not a new animation technique),
//     the scrim, the ghost/content crossfade, and Esc/mount lifecycle.
//     Portaled straight to #workflow-root, `position:fixed` + a z-index
//     above every other layer in the builder (see the root rule's own
//     comment in subgraph.css for the exact number and why) — this is what
//     makes "the parent's chrome hides during the subview" true without
//     touching App.jsx/Palette.jsx/CompiledPanel.jsx at all: it's simply
//     opaque and covers all of it, full stop.
//   SubgraphCanvas — everything step-shaped: its OWN <ReactFlowProvider>/
//     <ReactFlow> over StepNode.jsx, the breadcrumb, the minimal rail, the
//     "Add step" mini picker, and every CRUD action, all funneled through
//     state.jsx's patchTaskSteps (checkpointed) or patchNodeData (raw, for
//     drag's own live in-between frames — same drag-vs-commit split the
//     MAIN canvas's trackedOnNodesChange already established, reapplied
//     here rather than reinvented).
//
// Mounted by FlowCanvas.jsx (its own listener on cw:enter-steps) with
// {taskId, entryRect, onClose} — `entryRect` is captured BEFORE this
// mounts (and before enterTaskSteps may seed the trio), so the FLIP's start
// point is the card exactly as the user clicked it, never a frame where a
// freshly-seeded chip has already grown the card taller.

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Background,
  BackgroundVariant,
  ControlButton,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  ViewportPortal,
  useReactFlow,
  useStore,
} from '@xyflow/react';
import { CaretLeft, CornersOut, Minus, Plus as PlusIcon } from '@phosphor-icons/react';
import { useFlowState, STEP_CARD_W, STEP_PITCH_X } from '../state.jsx';
import StepNode from './StepNode.jsx';

const stepNodeTypes = { step: StepNode };

// --cw-d-3 / --cw-e-out literal values (motion.css) — a plain inline-style
// choreography (see the header comment) can't read a CSS custom property,
// same reason App.jsx's own RUN_CONTROLS_CSS keeps literal fallbacks next
// to every var() it uses.
const ENTER_MS = 420;
const EASE_OUT = 'cubic-bezier(0.22, 1, 0.36, 1)';
// --cw-e-inout literal (motion.css) — used for the ghost/content crossfade
// specifically; see playFlip's own comment on why --cw-e-out (right for the
// transform) is the wrong curve for a fade.
const EASE_INOUT = 'cubic-bezier(0.65, 0, 0.35, 1)';

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

function queryCardRect(taskId) {
  const el = document.querySelector(`#workflow-root .react-flow__node[data-id="${CSS.escape(taskId)}"] .cw-node`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: r.x, y: r.y, width: r.width, height: r.height };
}

// One imperative choreography for BOTH directions — 'in' (mount) and 'out'
// (close), literally the reverse of each other ("reverse transition mirrors
// entry exactly" — PLAN.md), driven off the SAME `rect`. Same two-step
// style-assignment + forced-reflow idiom as shared.jsx's animateCollapse:
// freeze the FROM state, force a reflow so the browser has something real
// to interpolate FROM, then assign the TO state under a real `transition`.
function playFlip({ surfaceEl, scrimEl, ghostEl, contentEl, rect, direction, onSettle }) {
  const winW = window.innerWidth || 1;
  const winH = window.innerHeight || 1;
  const sx = rect.width / winW;
  const sy = rect.height / winH;
  const smallTransform = `translate(${rect.x}px, ${rect.y}px) scale(${sx}, ${sy})`;
  const fullTransform = 'translate(0px, 0px) scale(1, 1)';
  const opening = direction === 'in';

  if (prefersReducedMotion()) {
    surfaceEl.style.transition = 'none';
    surfaceEl.style.transform = opening ? fullTransform : smallTransform;
    surfaceEl.style.borderRadius = opening ? '0px' : '14px';
    if (scrimEl) scrimEl.style.opacity = opening ? '1' : '0';
    if (ghostEl) ghostEl.style.opacity = opening ? '0' : '1';
    if (contentEl) contentEl.style.opacity = opening ? '1' : '0';
    onSettle();
    return () => {};
  }

  surfaceEl.style.transition = 'none';
  surfaceEl.style.transform = opening ? smallTransform : fullTransform;
  surfaceEl.style.borderRadius = opening ? '14px' : '0px';
  if (scrimEl) {
    scrimEl.style.transition = 'none';
    scrimEl.style.opacity = opening ? '0' : '1';
  }
  if (ghostEl) {
    ghostEl.style.transition = 'none';
    ghostEl.style.opacity = opening ? '1' : '0';
  }
  if (contentEl) {
    contentEl.style.transition = 'none';
    contentEl.style.opacity = opening ? '0' : '1';
  }

  // eslint-disable-next-line no-unused-expressions
  surfaceEl.offsetWidth; // force reflow — the FROM values above must actually paint once before the TO assignment below can be interpolated toward.

  surfaceEl.style.transition = `transform ${ENTER_MS}ms ${EASE_OUT}, border-radius ${ENTER_MS}ms ${EASE_OUT}`;
  surfaceEl.style.transform = opening ? fullTransform : smallTransform;
  surfaceEl.style.borderRadius = opening ? '0px' : '14px';
  if (scrimEl) {
    scrimEl.style.transition = `opacity 260ms ${EASE_OUT}`;
    scrimEl.style.opacity = opening ? '1' : '0';
  }
  // Ghost <-> content crossfade — CDP-found bug (frame-sampling this exact
  // transition, per the verify list): --cw-e-out is heavily front-loaded
  // (built for POSITION/SCALE settling, not fades), so a ghost fade-out
  // timed with it reads as done by ~120ms of its own declared 200ms — and
  // with content's arrival delayed to 140ms, the two left a real ~70ms
  // window where BOTH sat under 10% opacity, a blank flash across the
  // whole viewport (screenshots confirmed it, not just a hunch: computed
  // opacity sampled every rAF frame during the transition). --cw-e-inout
  // (symmetric, "layout glides") replaces --cw-e-out on JUST these two
  // opacity transitions — same shared token vocabulary, just the one
  // already built for a smooth in-AND-out curve rather than a hard arrival
  // — with content starting only 70ms behind ghost (both ~280ms) so the
  // two overlap across their whole middle stretch instead of handing off
  // near either end. Re-verified after this fix: combined opacity never
  // drops below ~0.7 at any sampled frame.
  if (ghostEl) {
    ghostEl.style.transition = `opacity 280ms ${EASE_INOUT}`;
    ghostEl.style.opacity = opening ? '0' : '1';
  }
  if (contentEl) {
    contentEl.style.transition = `opacity 280ms ${EASE_INOUT} ${opening ? '70ms' : '0ms'}`;
    contentEl.style.opacity = opening ? '1' : '0';
  }

  let done = false;
  const fallback = setTimeout(finish, ENTER_MS + 160);
  function finish() {
    if (done) return;
    done = true;
    surfaceEl.removeEventListener('transitionend', onEnd);
    clearTimeout(fallback);
    onSettle();
  }
  function onEnd(e) {
    if (e.target !== surfaceEl || e.propertyName !== 'transform') return;
    finish();
  }
  surfaceEl.addEventListener('transitionend', onEnd);
  return () => {
    surfaceEl.removeEventListener('transitionend', onEnd);
    clearTimeout(fallback);
  };
}

export default function SubgraphStage({ taskId, entryRect, onClose }) {
  const [phase, setPhase] = useState('entering'); // 'entering' | 'open' | 'exiting'
  const surfaceRef = useRef(null);
  const scrimRef = useRef(null);
  const ghostRef = useRef(null);
  const contentRef = useRef(null);
  const closingRef = useRef(false);
  const { nodes } = useFlowState();
  const task = useMemo(() => nodes.find((n) => n.id === taskId), [nodes, taskId]);

  useLayoutEffect(() => {
    const rect = entryRect || queryCardRect(taskId);
    if (!rect) {
      setPhase('open');
      return undefined;
    }
    return playFlip({
      surfaceEl: surfaceRef.current,
      scrimEl: scrimRef.current,
      ghostEl: ghostRef.current,
      contentEl: contentRef.current,
      rect,
      direction: 'in',
      onSettle: () => setPhase('open'),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const requestClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    const rect = queryCardRect(taskId) || entryRect;
    if (!rect || !surfaceRef.current) {
      onClose();
      return;
    }
    setPhase('exiting');
    playFlip({
      surfaceEl: surfaceRef.current,
      scrimEl: scrimRef.current,
      ghostEl: ghostRef.current,
      contentEl: contentRef.current,
      rect,
      direction: 'out',
      onSettle: onClose,
    });
  }, [taskId, entryRect, onClose]);

  // Defensive — the task itself vanishing out from under this view (e.g. an
  // undo that reaches back past its creation) is the one case that should
  // force an exit; ordinary internal edits never remove the task, so this
  // never fires for the common "⌘Z inside the subview stays inside" path
  // (PLAN.md Verify) — it only guards the genuine edge case where staying
  // open would mean rendering a task that no longer exists.
  useEffect(() => {
    if (!task) requestClose();
  }, [task, requestClose]);

  const rootClass = `cw-subgraph-root${phase !== 'open' ? ' is-transitioning' : ''}`;

  const stage = (
    <div className={rootClass}>
      <div className="cw-subgraph-scrim" ref={scrimRef} />
      <div className="cw-subgraph-surface" ref={surfaceRef}>
        <div className="cw-subgraph-ghost" ref={ghostRef} aria-hidden="true">
          <span className="cw-subgraph-ghost-title">{task?.data?.title || 'Task / Action'}</span>
        </div>
        <div className="cw-subgraph-content" ref={contentRef}>
          {task ? (
            <ReactFlowProvider>
              <SubgraphCanvas task={task} taskId={taskId} onRequestClose={requestClose} />
            </ReactFlowProvider>
          ) : null}
        </div>
      </div>
    </div>
  );

  const target = document.getElementById('workflow-root');
  return target ? createPortal(stage, target) : null;
}

// ---------------------------------------------------------------------------
// Minimal rail (PLAN.md: "own minimal rail (zoom readout, +/-, fit) and
// nothing else") — same visual language as FlowCanvas.jsx's own Controls
// rail (identical class family, so flow.css's ALREADY-SHIPPED styling for
// `.react-flow__controls`/ControlButton picks this nested instance up for
// free — #workflow-root scoping isn't specific to one <ReactFlow>). Zoom
// helpers duplicated in miniature rather than imported from FlowCanvas.jsx
// (avoids a circular import — that file would need to import THIS one for
// the mount point below); small enough that a pointer comment is the
// established convention for this, not a shared module (see e.g. shared.
// jsx's own SKIP_DISABLED_TYPES).
// ---------------------------------------------------------------------------
const ZOOM_MIN = 0.4;
const ZOOM_MAX = 2;
function nextZoomStep(current, dir) {
  const pct = Math.round(current * 100);
  const stepped = dir > 0 ? (Math.floor(pct / 10) + 1) * 10 : (Math.ceil(pct / 10) - 1) * 10;
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, stepped / 100));
}

function MiniRail() {
  const zoom = useStore((s) => s.transform[2]);
  const { zoomTo, fitView } = useReactFlow();
  return (
    <Controls position="bottom-left" showZoom={false} showInteractive={false} showFitView={false}>
      <ControlButton
        className="cw-zoom-readout"
        onClick={() => zoomTo(1, { duration: 250 })}
        aria-label="Zoom level — click to reset to 100%"
      >
        {Math.round(zoom * 100)}%
      </ControlButton>
      <ControlButton
        className="react-flow__controls-zoomin"
        onClick={() => zoomTo(nextZoomStep(zoom, 1), { duration: 220 })}
        aria-label="Zoom in"
      >
        <PlusIcon size={13} weight="bold" />
      </ControlButton>
      <ControlButton
        className="react-flow__controls-zoomout"
        onClick={() => zoomTo(nextZoomStep(zoom, -1), { duration: 220 })}
        aria-label="Zoom out"
      >
        <Minus size={13} weight="bold" />
      </ControlButton>
      <ControlButton
        className="react-flow__controls-fitview"
        onClick={() => fitView({ duration: 320, padding: 0.3, maxZoom: 1 })}
        aria-label="Fit view"
      >
        <CornersOut size={13} weight="regular" />
      </ControlButton>
    </Controls>
  );
}

// ---------------------------------------------------------------------------
// "Add step" mini picker (PLAN.md: "ghost + on step... sides opens a MINI
// picker (rows: Step... v1 the mini picker is just 'Add step')"). Not
// portaled — the stage root already establishes its own stacking context
// (position:fixed + z-index, subgraph.css), so a plain `position:fixed`
// descendant only has to out-rank OTHER descendants of that same root,
// never the outer app's z-index roster at all.
// ---------------------------------------------------------------------------
function AddStepPopover({ rect, side, onAdd, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    function onDown(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [onClose]);

  const top = Math.min(Math.max(rect.top, 12), window.innerHeight - 60);
  const leftBase = side === 'right' ? rect.right + 8 : rect.left - 8 - 168;
  const left = Math.min(Math.max(leftBase, 12), window.innerWidth - 176);

  return (
    <div ref={ref} className="cw-header-menu cw-substage-add-popover" style={{ top, left }} role="menu" aria-label="Add step">
      <button type="button" role="menuitem" className="cw-menu-item" onClick={onAdd}>
        <PlusIcon weight="bold" size={13} />
        Add step
      </button>
    </div>
  );
}

let stepSeq = 0;
function nextStepId(prefix) {
  stepSeq += 1;
  return `${prefix}-${Date.now().toString(36)}-${stepSeq}`;
}

function Breadcrumb({ selected, onExit }) {
  return (
    <div className="cw-substage-breadcrumb">
      <button type="button" className="cw-substage-crumb cw-substage-crumb--exit" onClick={onExit}>
        <CaretLeft weight="bold" size={11} />
        ALL STEPS
      </button>
      {selected ? (
        <>
          <span className="cw-substage-crumb-sep" aria-hidden="true">
            ·
          </span>
          <span className="cw-substage-crumb-num">{String(selected.number + 1).padStart(2, '0')}</span>
          <span className="cw-substage-crumb-sep" aria-hidden="true">
            ·
          </span>
          <span className="cw-substage-crumb-title">{(selected.title || 'Untitled step').toUpperCase()}</span>
        </>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// SubgraphCanvas — the actual internal mini-flow. Lives inside its OWN
// <ReactFlowProvider> (SubgraphStage above), so this is where useReactFlow/
// useStore-dependent pieces (MiniRail, fitView-on-mount) can live.
// ---------------------------------------------------------------------------
function SubgraphCanvas({ task, taskId, onRequestClose }) {
  const { patchNodeData, patchTaskSteps } = useFlowState();
  const { fitView } = useReactFlow();
  const steps = task?.data?.steps || { nodes: [], edges: [] };

  const [selectedStepId, setSelectedStepId] = useState(null);
  const [addPopover, setAddPopover] = useState(null); // { stepId, side, rect } | null
  const [miniBooms, setMiniBooms] = useState([]);
  const miniBoomTimersRef = useRef(new Map());
  const miniBoomSeqRef = useRef(0);

  useEffect(() => {
    const timers = miniBoomTimersRef.current;
    return () => {
      timers.forEach((t) => clearTimeout(t));
      timers.clear();
    };
  }, []);

  const spawnMiniBoom = useCallback((x, y) => {
    miniBoomSeqRef.current += 1;
    const id = `mb-${miniBoomSeqRef.current}`;
    setMiniBooms((bs) => [...bs, { id, cx: x, cy: y }]);
    const timer = setTimeout(() => {
      setMiniBooms((bs) => bs.filter((b) => b.id !== id));
      miniBoomTimersRef.current.delete(id);
    }, 260);
    miniBoomTimersRef.current.set(id, timer);
  }, []);

  // One-time frame, before the crossfade reveals this canvas — no visible
  // camera jump (mirrors the outer builder's own "no fit-on-open" posture:
  // arrival is already decided by the time anyone can see it).
  useLayoutEffect(() => {
    fitView({ padding: 0.35, duration: 0, maxZoom: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRenameStep = useCallback(
    (stepId, nextTitle) => {
      const nextNodes = steps.nodes.map((s) => (s.id === stepId ? { ...s, title: nextTitle } : s));
      patchTaskSteps(taskId, { ...steps, nodes: nextNodes });
    },
    [steps, taskId, patchTaskSteps],
  );

  // NODE BOOM PHASE precedent, reapplied at this stage's own scale (PLAN.md
  // "Materialize/boom/reveal motion inherited"): the real delete is
  // INSTANT — never held in local state to animate — a short silhouette
  // flash (motion.css's existing cw-boom-silhouette keyframe, unedited)
  // spawns separately at the step's last position via <ViewportPortal>.
  // Same "RF consistency first" reasoning that file's own header comment
  // gives for why the outer canvas's boom works this way, not Reveal's
  // stay-mounted-through-the-close approach — this array is CONTROLLED
  // (fully derived from task.data.steps every render, not RF's own
  // uncontrolled internal state), so holding a "closing" step alive here
  // risks exactly the drift that convention exists to avoid.
  const handleDeleteStep = useCallback(
    (stepId) => {
      const removed = steps.nodes.find((s) => s.id === stepId);
      if (!removed) return;
      const nextNodes = steps.nodes.filter((s) => s.id !== stepId);
      const nextEdges = steps.edges.filter((e) => e.source !== stepId && e.target !== stepId);
      patchTaskSteps(taskId, { nodes: nextNodes, edges: nextEdges });
      setSelectedStepId((cur) => (cur === stepId ? null : cur));
      const pos = removed.position || { x: 0, y: 0 };
      spawnMiniBoom(pos.x + STEP_CARD_W / 2, pos.y + 55);
    },
    [steps, taskId, patchTaskSteps, spawnMiniBoom],
  );

  const handleGhostAdd = useCallback((stepId, side, rect) => {
    setAddPopover((cur) => (cur?.stepId === stepId && cur.side === side ? null : { stepId, side, rect }));
  }, []);

  const commitAddStep = useCallback(
    (anchorStepId, side, atPosition) => {
      const newId = nextStepId('step');
      let position = atPosition;
      let newEdges = steps.edges;
      if (!position) {
        const anchor = steps.nodes.find((s) => s.id === anchorStepId);
        const anchorPos = anchor?.position || { x: 0, y: 0 };
        position = { x: anchorPos.x + (side === 'right' ? STEP_PITCH_X : -STEP_PITCH_X), y: anchorPos.y };
        const newEdge =
          side === 'right'
            ? { id: nextStepId('stepedge'), source: anchorStepId, target: newId }
            : { id: nextStepId('stepedge'), source: newId, target: anchorStepId };
        newEdges = [...steps.edges, newEdge];
      }
      const newStep = { id: newId, title: '', position };
      patchTaskSteps(taskId, { nodes: [...steps.nodes, newStep], edges: newEdges });
      setSelectedStepId(newId);
      setAddPopover(null);
    },
    [steps, taskId, patchTaskSteps],
  );

  // Drag persistence: live intermediate frames go through the RAW,
  // uncheckpointed patch (patchNodeData — same primitive Collapse/Skip/
  // Rename already use for exactly this reason, see state.jsx's own header
  // comment on it); only drag-STOP checkpoints, one per whole gesture — the
  // identical split the main canvas's trackedOnNodesChange already
  // established for its own node drags, reapplied here rather than
  // reinvented.
  //
  // CDP-found bug (verifying real clicks against this exact nested
  // instance): `onSelectionChange` — this file's ORIGINAL selection source
  // — lands a full interaction cycle late here (confirmed via console
  // instrumentation: a single click's own 'select' change arrives on
  // onNodesChange IMMEDIATELY, but the matching onSelectionChange call
  // doesn't fire until the NEXT pointer interaction), so a card's first-
  // ever click looked like it did nothing — no toolbar, no breadcrumb,
  // selection only "caught up" a click later. `onNodesChange`'s own
  // 'select' changes are the ones that are actually synchronous with the
  // gesture, so this now reads selection off THEM directly; the
  // onSelectionChange handoff below is kept as a backup (harmless if it
  // re-applies the same id a tick later, never removed since it could only
  // make behavior MORE robust, never regress it).
  const handleStepNodesChange = useCallback(
    (changes) => {
      const selectChanges = changes.filter((c) => c.type === 'select');
      if (selectChanges.length) {
        const selectedNow = selectChanges.filter((c) => c.selected).map((c) => c.id);
        setSelectedStepId(selectedNow.length === 1 ? selectedNow[0] : null);
      }
      const positionChanges = changes.filter((c) => c.type === 'position' && c.position);
      if (!positionChanges.length) return;
      const byId = new Map(positionChanges.map((c) => [c.id, c.position]));
      const nextNodes = steps.nodes.map((s) => (byId.has(s.id) ? { ...s, position: byId.get(s.id) } : s));
      const nextSteps = { ...steps, nodes: nextNodes };
      const dragStopping = positionChanges.some((c) => c.dragging === false);
      if (dragStopping) patchTaskSteps(taskId, nextSteps);
      else patchNodeData(taskId, { steps: nextSteps });
    },
    [steps, taskId, patchTaskSteps, patchNodeData],
  );

  const handleConnect = useCallback(
    (connection) => {
      if (!connection.source || !connection.target || connection.source === connection.target) return;
      const exists = steps.edges.some((e) => e.source === connection.source && e.target === connection.target);
      if (exists) return;
      const newEdge = { id: nextStepId('stepedge'), source: connection.source, target: connection.target };
      patchTaskSteps(taskId, { ...steps, edges: [...steps.edges, newEdge] });
    },
    [steps, taskId, patchTaskSteps],
  );

  const isValidStepConnection = useCallback(
    (conn) => {
      if (!conn.source || !conn.target || conn.source === conn.target) return false;
      return !steps.edges.some((e) => e.source === conn.source && e.target === conn.target);
    },
    [steps],
  );

  // Backup path — see handleStepNodesChange's own comment on why the
  // PRIMARY selection source moved to onNodesChange's 'select' changes.
  // Harmless to keep wired: in the case where this and the primary path
  // ever disagree for a tick, this just re-applies the same eventual
  // answer.
  const handleSelectionChange = useCallback(({ nodes: sel }) => {
    setSelectedStepId(sel.length === 1 ? sel[0].id : null);
  }, []);

  const rfNodes = useMemo(
    () =>
      steps.nodes.map((s, i) => ({
        id: s.id,
        type: 'step',
        position: s.position || { x: i * STEP_PITCH_X, y: 0 },
        selected: selectedStepId === s.id,
        measured: {},
        data: {
          title: s.title || '',
          kindTag: s.kindTag,
          number: i,
          runState: s.runState,
          onRename: (next) => handleRenameStep(s.id, next),
          onDelete: () => handleDeleteStep(s.id),
          onGhostAdd: (side, rect) => handleGhostAdd(s.id, side, rect),
        },
      })),
    [steps.nodes, selectedStepId, handleRenameStep, handleDeleteStep, handleGhostAdd],
  );
  const rfEdges = useMemo(() => steps.edges.map((e) => ({ id: e.id, source: e.source, target: e.target })), [steps.edges]);

  const selectedStep = selectedStepId ? rfNodes.find((n) => n.id === selectedStepId)?.data : null;

  // Esc precedence within the subview (PLAN.md "Esc surfaces (precedence:
  // any open menu/composer first — extend the existing Esc matrix)"): the
  // mini picker first, exit second. Typing targets (the step title field)
  // are skipped entirely so its OWN onKeyDown can cancel just itself — see
  // StepNode.jsx's own Escape handling, which stopPropagation()s so the
  // SAME keypress can never also fall through to index.html's bubble-phase
  // "Escape closes the whole builder" listener.
  useEffect(() => {
    function onKeyCapture(e) {
      if (e.key !== 'Escape') return;
      const tag = e.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target?.isContentEditable) return;
      e.stopPropagation();
      if (addPopover) {
        setAddPopover(null);
        return;
      }
      onRequestClose();
    }
    document.addEventListener('keydown', onKeyCapture, true);
    return () => document.removeEventListener('keydown', onKeyCapture, true);
  }, [addPopover, onRequestClose]);

  return (
    <div className="cw-subgraph-canvas-root">
      <Breadcrumb selected={selectedStep} onExit={onRequestClose} />
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        nodeTypes={stepNodeTypes}
        onNodesChange={handleStepNodesChange}
        onConnect={handleConnect}
        isValidConnection={isValidStepConnection}
        onSelectionChange={handleSelectionChange}
        onNodesDelete={(deleted) => deleted.forEach((n) => handleDeleteStep(n.id))}
        deleteKeyCode={['Backspace', 'Delete']}
        defaultEdgeOptions={{ type: 'default' }}
        proOptions={{ hideAttribution: true }}
        minZoom={ZOOM_MIN}
        maxZoom={ZOOM_MAX}
      >
        <Background variant={BackgroundVariant.Dots} gap={14} size={2} className="cw-substage-dots" />
        <MiniRail />
        <ViewportPortal>
          {miniBooms.map((b) => (
            <div key={b.id} className="cw-boom cw-substage-boom" style={{ transform: `translate(${b.cx}px, ${b.cy}px)` }}>
              <div className="cw-boom-silhouette" />
            </div>
          ))}
        </ViewportPortal>
      </ReactFlow>
      {rfNodes.length === 0 ? (
        <div className="cw-substage-empty">
          <p>No steps yet.</p>
          <button type="button" className="cw-quiet-row" onClick={() => commitAddStep(null, 'right', { x: 0, y: 0 })}>
            <PlusIcon weight="regular" size={13} />
            Add a step
          </button>
        </div>
      ) : null}
      {addPopover ? (
        <AddStepPopover
          rect={addPopover.rect}
          side={addPopover.side}
          onAdd={() => commitAddStep(addPopover.stepId, addPopover.side)}
          onClose={() => setAddPopover(null)}
        />
      ) : null}
    </div>
  );
}
