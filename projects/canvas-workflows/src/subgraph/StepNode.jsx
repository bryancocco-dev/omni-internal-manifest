// SUBGRAPHS — full spec (PLAN.md "## SUBGRAPHS" -> "### Step-cards"). One
// compact node type for the internal stage's OWN nested <ReactFlow>
// instance (SubgraphStage.jsx) — never registered in src/nodes/index.js's
// nodeTypes map. Steps are a task's internal DATA (task.data.steps), never
// real nodes on the main canvas, so this intentionally lives outside seam
// C's own node registry and file grant.
//
// "240px wide: small glyph tile (kindTag's color if present, else the
// parent task's), mono step number (01, 02...), editable title, in/out
// ports (typed-port rings in parent task's kind), NodeToolbar with only
// trash + rename." The parent task's own kind IS always --cw-accent (every
// task/output/generate card routes through that one token today — see
// nodes.css's per-`.cw-node--*` `--accent` roster), so "typed-port rings in
// parent task's kind" needs no per-task lookup at all: nodes.css's own
// `.react-flow__node-step { --cw-port: var(--cw-accent); }` rule (this
// folder's styles/subgraph.css sibling) is all that's needed for flow.css's
// ALREADY-SHIPPED CP1 port-ring rules (`var(--cw-port, ...)`) to pick this
// type up automatically — zero edits to that off-limits file, and zero
// edits to flow.css's base `.react-flow__handle` sizing/hover rules either:
// both are scoped `#workflow-root .react-flow__handle`/`...node-<type>`,
// which apply to ANY React Flow instance rendered inside #workflow-root,
// this nested one included.
//
// Callbacks arrive as plain functions on `data` (onRename/onDelete/
// onGhostAdd) rather than a window-event/context round trip — steps are
// entirely local to SubgraphStage's own component tree, never touching
// state.jsx directly from here, so there is no cross-seam bus to join.

import { memo, useEffect, useRef, useState } from 'react';
import { Handle, NodeToolbar, Position, useNodeConnections } from '@xyflow/react';
import { PencilSimple, Plus, TrashSimple } from '@phosphor-icons/react';
import { RunStamp } from '../nodes/shared.jsx';
import { stepKindMeta } from './stepKind.js';

function StepGhost({ side, label, onAdd }) {
  return (
    <button
      type="button"
      className={`cw-ghost cw-ghost--${side} nodrag nopan`}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onAdd(e.currentTarget.getBoundingClientRect());
      }}
    >
      <Plus weight="bold" size={10} />
    </button>
  );
}

function StepNode({ id, data = {}, selected }) {
  const { title = '', kindTag, number, runState, onRename, onDelete, onGhostAdd } = data;
  const [draft, setDraft] = useState(title);
  const inputRef = useRef(null);
  // CDP-found bug (verifying this exact card's Escape-cancels-itself path):
  // `setDraft(title)` followed immediately by `.blur()` looked right but
  // wasn't — `setDraft` is a React state update (batched/async), so the
  // `blur` -> `commit()` call this triggers SYNCHRONOUSLY still reads the
  // OLD `draft` closure (the pre-Escape text, not yet reverted), and
  // happily "commits" it right back. This ref sidesteps the batching
  // entirely: Escape sets it before blurring, `commit()` checks it FIRST
  // and bails without touching `onRename`/`draft` at all when it's set —
  // the `setDraft(title)` call's own (now unopposed) re-render is what
  // actually shows the reverted text.
  const cancelingRef = useRef(false);
  // External rename (undo, or another instance of this same step re-synced
  // after an outside edit) must overwrite an untouched draft — but never
  // stomp text the user is actively mid-edit on. Simplest safe rule: sync
  // whenever the field isn't currently focused (mirrors the rest of this
  // app's "local draft state, commit on blur" inputs — e.g. shared.jsx's
  // own NodeCommandMenu rename input never has to solve this because it
  // mounts fresh per open; this one persists across renders instead).
  useEffect(() => {
    if (document.activeElement !== inputRef.current) setDraft(title);
  }, [title]);

  const inConn = useNodeConnections({ id, handleType: 'target', handleId: 'in' });
  const outConn = useNodeConnections({ id, handleType: 'source', handleId: 'out' });

  const meta = stepKindMeta(kindTag);
  const Icon = meta.icon;

  function commit() {
    if (cancelingRef.current) {
      cancelingRef.current = false;
      return;
    }
    const next = draft.trim();
    if (next && next !== title) onRename(next);
    else setDraft(title);
  }

  return (
    <div
      className={`cw-step-card${selected ? ' is-selected' : ''}`}
      data-run-state={runState && runState !== 'idle' ? runState : undefined}
      style={{ '--step-accent': meta.color }}
    >
      {/* "NodeToolbar with only trash + rename" (PLAN.md) — same RF
          <NodeToolbar> convention shared.jsx's own NodeActionsToolbar uses
          for real nodes: visible exactly while this card is the sole
          selection, no extra visibility bookkeeping needed. */}
      <NodeToolbar nodeId={id} position={Position.Top} offset={8} className="cw-step-toolbar nodrag nopan">
        <button
          type="button"
          className="cw-step-toolbar-btn"
          aria-label="Rename step"
          onClick={() => {
            inputRef.current?.focus();
            inputRef.current?.select();
          }}
        >
          <PencilSimple weight="regular" size={12} />
        </button>
        <button
          type="button"
          className="cw-step-toolbar-btn cw-step-toolbar-btn--danger"
          aria-label="Delete step"
          onClick={onDelete}
        >
          <TrashSimple weight="regular" size={12} />
        </button>
      </NodeToolbar>

      <Handle type="target" position={Position.Left} id="in" className="cw-handle" />
      {!inConn.length ? (
        <StepGhost side="left" label="Add a step before this step" onAdd={(rect) => onGhostAdd('left', rect)} />
      ) : null}

      <div className="cw-step-head">
        <span className="cw-step-glyph" aria-hidden="true">
          <Icon weight="regular" size={12} />
        </span>
        <span className="cw-step-number">{String((number ?? 0) + 1).padStart(2, '0')}</span>
        <RunStamp runState={runState} />
      </div>
      <input
        ref={inputRef}
        type="text"
        className="cw-step-title nodrag nopan"
        value={draft}
        placeholder="Step title..."
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur();
          if (e.key === 'Escape') {
            // Cancel just THIS field — SubgraphStage's own Esc listener
            // already skips typing targets so it never races this, but
            // stopPropagation is what keeps the same keypress from also
            // bubbling to index.html's "Escape closes the whole builder"
            // listener once this field blurs. cancelingRef (see commit's
            // own comment) is what makes the revert actually stick rather
            // than the blur's own commit() re-saving the pre-Escape text.
            e.stopPropagation();
            cancelingRef.current = true;
            setDraft(title);
            e.currentTarget.blur();
          }
        }}
      />

      <Handle type="source" position={Position.Right} id="out" className="cw-handle" />
      {!outConn.length ? (
        <StepGhost side="right" label="Add a step after this step" onAdd={(rect) => onGhostAdd('right', rect)} />
      ) : null}
    </div>
  );
}

export default memo(StepNode);
