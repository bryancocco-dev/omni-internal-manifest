// Seam C — Nodes
//
// COMFY ROUND (CP2, item 1) — "NOTE BLOCK" (PLAN.md "## COMFY ROUND" ->
// "### CP2"). Comfy's About card, translated: a free-floating annotation
// with no handles and zero run participation. It never appears in
// renumber()'s numbering (only task/human/params get one — state.jsx),
// never throws an issue ('note' is in NEVER_DISCONNECTED_TYPES, and no
// other check ever names it), and is invisible to computeCompiledCounts
// (that function only ever looks at `type === 'task'` nodes to begin with).
//
// Deliberately does NOT render <NodeActionsToolbar> — unlike every other
// node type (shared.jsx's own header comment calls that component
// "unconditional" on all eight original kinds; FrameNode/VariantCard are
// the one precedent for opting out entirely), a note has no run state, no
// collapse/skip/tint story, and "Run from here" or "Skip" on a pure
// annotation would be actively wrong rather than just unused. It gets its
// own minimal close affordance instead, via the exact same
// `deleteElements()` call the toolbar's own Trash button makes elsewhere —
// which is what keeps NODE BOOM PHASE's `onNodesDelete` hook (FlowCanvas.jsx)
// working here for free: that hook fires for any deletion routed through
// `deleteElements`/RF's delete-key handling, not specifically ones that
// went through the shared toolbar.
//
// Deliberately does NOT use the `.cw-card-head` class name FlowCanvas.jsx's
// double-click-to-collapse handler scopes to
// (`event.target.closest('.cw-card-head')`, see that file's onNodeDoubleClick) —
// collapse is a NODE TOOLBAR V2 concept this card opts out of entirely, so
// its own header wrapper is named `.cw-note-head` instead, which that
// selector simply never matches; double-clicking a note is a no-op, same as
// double-clicking anywhere that isn't a card head today.
//
// No <InHandle>/<OutHandle> — a note is not part of the graph, so nothing
// here can ever be wired to or from (React Flow needs a real DOM handle to
// start/end a connection; rendering none makes this structurally
// unconnectable rather than relying on a runtime check).

import { memo, useEffect, useRef } from 'react';
import { useReactFlow } from '@xyflow/react';
import { NotePencil, X as XIcon } from '@phosphor-icons/react';
import { CardEyebrow } from './shared.jsx';

// Auto-height (PLAN.md: "body textarea (auto-height)"). No ResizeObserver —
// just the standard reset-then-remeasure trick, run on every keystroke AND
// once on mount/data-load so a note that already has body text (e.g. a
// future ?flow= sample) opens at its real height instead of one collapsed
// row that then jumps taller on the first keystroke.
function autosize(el) {
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = `${el.scrollHeight}px`;
}

function NoteNode({ id, data = {}, selected }) {
  const { updateNodeData, deleteElements } = useReactFlow();
  const bodyRef = useRef(null);

  useEffect(() => {
    autosize(bodyRef.current);
  }, [data.body]);

  return (
    // No --cw-seq stagger opt-out needed — renumber() (state.jsx) stamps
    // data.seq on every node type unconditionally, notes included, so the
    // base .cw-node materialize entrance (nodes.css) already cascades this
    // card in with the rest of the graph for free. No data-run-state (ever)
    // is the literal, in-JSX expression of "zero run participation" — not
    // just an unmatched CSS selector.
    <div
      className={`cw-node cw-node--note${selected ? ' is-selected' : ''}`}
      style={{ '--cw-seq': data.seq }}
    >
      <div className="cw-note-head">
        <CardEyebrow icon={NotePencil} kind="Note" />
        <button
          type="button"
          className="cw-note-close nodrag nopan"
          aria-label="Delete note"
          onClick={() => deleteElements({ nodes: [{ id }] })}
        >
          <XIcon weight="bold" size={10} />
        </button>
      </div>

      <input
        type="text"
        className="cw-input cw-note-title nodrag nopan"
        placeholder="Untitled note"
        value={data.title || ''}
        onChange={(e) => updateNodeData(id, { title: e.target.value })}
      />
      <textarea
        ref={bodyRef}
        className="cw-textarea cw-note-body nodrag nopan"
        placeholder="Type a note..."
        rows={1}
        value={data.body || ''}
        onChange={(e) => {
          updateNodeData(id, { body: e.target.value });
          autosize(e.target);
        }}
      />
    </div>
  );
}

export default memo(NoteNode);
