// Seam C — Nodes
//
// Small building blocks shared by every node component in this folder: the
// window-event dispatcher for the cw:add-from contract (§Node specs "ghost
// buttons"), the mock agent/chip data C needs to render (duplicated locally
// per the cross-seam contract — "C and D import nothing from B", so this
// cannot come from B's src/data/blocks.js), and the handle/ghost/options-row
// primitives every node type composes from.
//
// Class-name note: this file (and nodes.css) intentionally avoids the plain
// `cw-header` / `cw-chip` / `cw-chip-row` names — B's app.css already owns
// those for the builder's own header bar and the compiled-panel's pill
// chips, and CSS classes are global. Node-card equivalents here are named
// `cw-card-head` / `cw-card-chip` / `cw-card-chip-row` instead.

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Handle, NodeToolbar, Position, useNodeConnections, useNodesData, useReactFlow, useUpdateNodeInternals } from '@xyflow/react';
import {
  ArrowRight,
  ArrowsInSimple,
  ArrowsOutCardinal,
  ArrowsOutSimple,
  CaretDown,
  CaretUp,
  Copy,
  CopySimple,
  DotsThree,
  FilePdf,
  Image as ImageIcon,
  Info as InfoIcon,
  Palette as PaletteIcon,
  PencilSimple,
  Play,
  Plus,
  PushPinSimple,
  PushPinSimpleSlash,
  SkipForward,
  Stack,
  Steps as StepsIcon,
  TrashSimple,
  X,
} from '@phosphor-icons/react';
import Reveal from './Reveal.jsx';
import { useFlowState, SUBGRAPH_EXCLUDED_TYPES } from '../state.jsx';
// WAVE 3 — THE VERB EXPANSION (PLAN.md "### WAVE 3 — CREATIVE CHAIN"). The
// two artifact renderers this file's own ArtifactThumb below dispatches
// between (Compare's ranked-row thumbs) — same "C reads run/* directly"
// precedent GenerateNode.jsx/OutputNode.jsx already established (run/** is
// neither seam's exclusive file, see either of those files' own import
// comments).
import Artifact from '../run/artifacts.jsx';
import Poster from '../run/posters.jsx';
// COMFY ROUND (CP2, item 3) — "SEED DISCIPLINE" fallback, same precedent as
// every other file in this seam that imports this constant (GenerateNode.jsx).
// WAVE 3 — also Style Reference's own default seed (SignalNode.jsx) and this
// file's own ECHO_SOURCES 'style' summarizer just below — one shared origin
// point rather than three independent literal 1000s drifting apart.
import { DEFAULT_GENERATE_SEED } from '../data/models.js';
import { addCanvasFile } from '../data/canvasFiles.js';
// NODE TOOLBAR V2 — Info popover's "blurb from palette data" (PLAN.md item
// 6). Read-only cross-seam import, same precedent as MOCK_AGENTS just below
// (blocks.js is B's file; C reading its static data at render time has been
// the established exception to "C imports nothing from B" since RUN PHASE
// wired useFlowState() into HumanNode/TaskNode for the same reason — the
// mutation methods, not just data, now cross this seam routinely).
import { PALETTE_SECTIONS } from '../data/blocks.js';

/* ---------------------------------------------------------------------- */
/* cw:enter-steps — SUBGRAPHS (PLAN.md "## SUBGRAPHS", "### Enter / surface").
   One of the three entry points ("'Enter steps' in the ⋯/right-click
   command menu; the 'n steps ↗' chip; hotkey Enter on a selected task") —
   this file dispatches it from the first two (NodeCommandMenu's row below,
   TaskNode.jsx's chip); FlowCanvas.jsx owns the visual stage/transition and
   is the sole listener, same cross-seam window-event shape as cw:add-picker
   above (a node-ish component asking FlowCanvas to open a floating/full-
   screen thing it can't reach directly).                                  */
/* ---------------------------------------------------------------------- */
export function dispatchEnterSteps(taskId) {
  window.dispatchEvent(new CustomEvent('cw:enter-steps', { detail: { taskId } }));
}

/* ---------------------------------------------------------------------- */
/* cw:add-from — B's state.jsx listens on window and spawns a connected     */
/* node 380px to that side. Kept exported (GHOST + PICKER phase, PLAN.md)   */
/* in case anything besides the ghost buttons below ever wants "always a    */
/* Task, no picker" — nothing currently does, the ghosts moved to           */
/* dispatchAddPicker just under this.                                      */
/* ---------------------------------------------------------------------- */
export function dispatchAddFrom(nodeId, side) {
  window.dispatchEvent(new CustomEvent('cw:add-from', { detail: { nodeId, side } }));
}

/* ---------------------------------------------------------------------- */
/* cw:add-picker — GHOST + PICKER phase (PLAN.md). Bryan: the + off a node  */
/* "always makes a task/action node" -> approved a block picker instead:    */
/* "do it." The ghost no longer mints a Task itself; it hands the click's   */
/* own screen rect to FlowCanvas.jsx (which owns the picker's open/closed   */
/* state) so a <BlockPicker> can anchor off the exact button that opened    */
/* it. Picking a row is what finally dispatches cw:add-from, now carrying   */
/* an `itemId` (see state.jsx's onAddFrom).                                 */
/* ---------------------------------------------------------------------- */
export function dispatchAddPicker(nodeId, side, rect) {
  window.dispatchEvent(new CustomEvent('cw:add-picker', { detail: { nodeId, side, rect } }));
}

/* ---------------------------------------------------------------------- */
/* Mock data (§Graph schema "Mock agents"). Kept local to this seam.       */
/* ---------------------------------------------------------------------- */
export const KIND_COLORS = {
  // Agent-blue IS the primary accent semantically — follow the theme's
  // accent (dark cyan, brand colors) instead of pinning OMNI blue. The
  // other kinds are fixed status semantics and stay put across themes.
  agent: 'var(--cw-accent, #1858EE)',
  knowledge: '#0EA5E9',
  skill: '#8B5CF6',
  tool: '#F59E0B',
  file: '#64748B',
};

// data.attachments[].kind (Task chip-attachments) is read by B's state.jsx
// computeCompiledCounts, which matches on the exact chip-label strings
// ('Knowledge base' / 'Tool' / 'Skill') — so those mock rows use that same
// casing. The AGENT sub-card's "uses" rows never leave this component tree
// (never written to node.data), so they're free to use short lowercase kind
// keys instead; normalizeKind() below lets one Dot/tag renderer read either.
// Derived from data/blocks.js's MOCK_AGENTS array — the ONE roster (grown to
// 28 for Bryan's "add a ton of agents"). This file used to carry its own
// hand-written 4-entry copy, which silently diverged the moment the canonical
// list grew: the card's picker showed 4 agents while the compiled panel
// counted from 28. Kind keys are lowercased here because the AGENT sub-card's
// uses-rows historically use short lowercase keys (see normalizeKind below);
// blocks.js keeps the caps-tag casing the panel and cards RENDER.
import { MOCK_AGENTS as AGENT_ROSTER } from '../data/blocks.js';

export const AGENT_NAMES = AGENT_ROSTER.map((a) => a.name);

export const MOCK_AGENTS = Object.fromEntries(
  AGENT_ROSTER.map((a) => [
    a.name,
    { uses: a.uses.map((u) => ({ name: u.name, kind: u.kind.toLowerCase() })) },
  ]),
);

export const CHIP_MOCK_ATTACHMENTS = {
  knowledge: { name: 'Market Insights', kind: 'Knowledge base' },
  skill: { name: 'Data Analysis', kind: 'Skill' },
  tool: { name: 'web_search', kind: 'Tool' },
  file: { name: 'reference.pdf', kind: 'File' },
};

/* Headline case for card TITLES (Bryan: eyebrows stay ALL CAPS, "the bolded
   bigger text should always be sentence case... 'Scope the New Market' —
   the word The was left intentionally un-capitalized"): principal words
   capitalize, minor words (articles/short prepositions/conjunctions) stay
   down unless first or last, existing ALL-CAPS runs (acronyms) pass
   through untouched, and the rest of each word keeps its own casing so
   names like PowerPoint never get flattened. */
const MINOR_WORDS = new Set([
  'a', 'an', 'the', 'and', 'but', 'or', 'nor', 'for', 'so', 'yet',
  'as', 'at', 'by', 'in', 'of', 'on', 'to', 'up', 'via', 'with', 'from', 'into', 'over', 'per',
]);

export function headlineCase(text) {
  const words = String(text || '').split(' ');
  const last = words.length - 1;
  return words
    .map((w, i) => {
      if (!w) return w;
      if (/^[A-Z0-9]{2,}$/.test(w)) return w;
      const lower = w.toLowerCase();
      if (i !== 0 && i !== last && MINOR_WORDS.has(lower)) return lower;
      return w[0].toUpperCase() + w.slice(1);
    })
    .join(' ');
}

// Click-to-edit title (Bryan: "would be nice to just click to edit it —
// i like the fonts how they are now so no need to change the styling").
// Renders the exact `.cw-title` span every card already shows; a click
// swaps in an input carrying the SAME class (plus a UA-reset modifier,
// nodes.css `.cw-title--editing`) so the type never changes — the caret
// is the edit state. Commits on Enter/blur, cancels on Escape. Edits the
// RAW stored value (display re-applies headlineCase on commit) and writes
// through the SAME data.title the toolbar's 3-dot Rename already uses —
// two doors, one field. Only mounted by the RENAME_ELIGIBLE card types
// below (task/generate; note has its own input).
export function EditableTitle({ title, display, onCommit }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef(null);
  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);
  if (!editing) {
    return (
      <span
        className="cw-title cw-title--editable"
        title="Click to rename"
        onClick={() => {
          setDraft(title || '');
          setEditing(true);
        }}
      >
        {display}
      </span>
    );
  }
  const commit = () => {
    const next = draft.trim();
    if (next && next !== title) onCommit(next);
    setEditing(false);
  };
  return (
    <input
      ref={inputRef}
      type="text"
      className="cw-title cw-title--editing nodrag nopan"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') commit();
        if (e.key === 'Escape') setEditing(false);
      }}
    />
  );
}

function normalizeKind(kind) {
  return String(kind || '').toLowerCase().split(' ')[0];
}

/* ---------------------------------------------------------------------- */
/* Small shared visual atoms                                               */
/* ---------------------------------------------------------------------- */
/* INSTRUMENT PASS (PLAN.md "de-AI the node cards") — card head, item 2.
   Replaces the old pastel icon-chip (IconTile, formerly here) + bare "N."
   badge with a two-line head every node type composes the same way: a
   Fira Code eyebrow ("NN · KIND" — NN only when there's a number to show;
   state.jsx's renumber() still only stamps task/human, so this is reading
   that same unchanged source, not minting new numbering) with the node's
   own Phosphor glyph re-inked beside it — light weight, 15px, ink at
   --cw-text-3, no tinted box — sitting above the existing title row.
   nodes.css owns the border-bottom hairline + kind-color tick that closes
   out the head (the kind's identity now lives IN that rule, not as a top-
   of-card color sliver). */
export function CardEyebrow({ icon: Icon, number, kind }) {
  const text = number != null ? `${String(number).padStart(2, '0')} · ${kind}` : kind;
  return (
    <div className="cw-card-eyebrow-row">
      {/* Colored container back (Bryan) — the tile, not a bare glyph, is the
          card's kind identifier now; weight up from light so the icon holds
          its own on the tint. */}
      {Icon && (
        <span className="cw-card-glyph" aria-hidden="true">
          <Icon weight="regular" size={14} className="cw-card-icon" />
        </span>
      )}
      <span className="cw-card-eyebrow">{text}</span>
    </div>
  );
}

export function FieldLabel({ children }) {
  return <div className="cw-field-label">{children}</div>;
}

export function Segmented({ options, value, onChange, ariaLabel }) {
  // MOTION PHASE (M2 item 5) — sliding thumb. All current usages are
  // equal-width (every .cw-segmented-btn is `flex:1`), so --cw-seg-n/-i are
  // enough for the thumb's own width/position math (nodes.css).
  // INSTRUMENT PASS item 6 — the thumb element is reused wholesale as the
  // new editorial-tabs underline bar (nodes.css repaints it from a filled
  // pill into a 2px accent line riding the track's bottom hairline); same
  // measure-free n/i math, just a different shape painted at the end of it,
  // so nothing in this component needed to change.
  const activeIndex = Math.max(0, options.findIndex((opt) => opt.value === value));
  return (
    <div
      className="cw-segmented nodrag nopan"
      role="radiogroup"
      aria-label={ariaLabel}
      style={{ '--cw-seg-n': options.length, '--cw-seg-i': activeIndex }}
    >
      <span className="cw-segmented-thumb" aria-hidden="true" />
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="radio"
          aria-checked={value === opt.value}
          className={`cw-segmented-btn${value === opt.value ? ' is-active' : ''}`}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function Dot({ kind }) {
  return <span className="cw-dot" style={{ background: KIND_COLORS[normalizeKind(kind)] || '#9CA3AF' }} />;
}

export function Chip({ kind, label, onClick }) {
  // INSTRUMENT PASS item 5 — hover border/ink pick up the chip's OWN kind
  // color (same lookup <Dot> uses for its square mark), exposed as a custom
  // property so nodes.css can reach it without a second kind->color switch
  // living in CSS.
  const kindColor = KIND_COLORS[normalizeKind(kind)] || '#9CA3AF';
  return (
    <button
      type="button"
      className="cw-card-chip nodrag nopan"
      style={{ '--cw-chip-color': kindColor }}
      onClick={onClick}
    >
      <Plus weight="bold" size={9} className="cw-card-chip-plus" />
      <Dot kind={kind} />
      {label}
    </button>
  );
}

// F2 (QA FINDINGS LEDGER) — "× on attachment rows (hover-reveal, Reveal-
// staged removal — the machinery exists)". `onRemove` is optional: an
// agent's own read-only USES rows (TaskNode.jsx's `displayUses`, straight
// off MOCK_AGENTS reference data — nothing a user attached, nothing they
// can detach) still call this with no third argument and render exactly as
// before, byte-for-byte. Only a Task's own chip-attached rows pass one.
// nodes.css (Seam C, outside this dispatch's file grant) has no hover-reveal
// rule for this row shape, so that half is a local hover flag + inline
// style rather than a new stylesheet rule — same "this seam's file grant
// doesn't reach the stylesheet, so styling stays local" call App.jsx's own
// RunControls made (its header comment, verbatim). The button itself reuses
// `.cw-imginput-remove` as-is (already the right size/color/hover-to-danger
// treatment for a small chip ×, already shipped in nodes.css) rather than
// inventing a class this file can't back with CSS.
export function UsesRow({ name, kind, onRemove, removing }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="cw-uses-row"
      onMouseEnter={onRemove ? () => setHovered(true) : undefined}
      onMouseLeave={onRemove ? () => setHovered(false) : undefined}
    >
      <Dot kind={kind} />
      <span className="cw-uses-name">{name}</span>
      <span className="cw-uses-tag">{kind}</span>
      {onRemove ? (
        <button
          type="button"
          className="cw-imginput-remove nodrag nopan"
          aria-label={`Remove ${name}`}
          disabled={removing}
          onClick={onRemove}
          style={{
            marginLeft: 'auto',
            flexShrink: 0,
            opacity: hovered ? 1 : 0,
            transition: 'opacity 120ms ease',
          }}
        >
          <X weight="bold" size={9} />
        </button>
      ) : null}
    </div>
  );
}

// F2, cont'd — the staged-removal wrapper, same shape as GenerateNode.jsx's
// ImageInputRow / this file's own OptionsEditor just below: a row marked for
// removal stays mounted (still fully live/readable) and Reveal plays its
// close animation; the actual splice only happens once Reveal reports
// `onExited`, so nothing vanishes mid-collapse. `attachments` is the raw
// array straight off `data.attachments`; `onChange` gets the next array,
// exactly like OptionsEditor's own `onChange` contract, so TaskNode.jsx's
// call site is one line.
export function AttachmentsList({ attachments, onChange }) {
  const [removingIds, setRemovingIds] = useState(() => new Set());

  function requestRemove(id) {
    setRemovingIds((prev) => new Set(prev).add(id));
  }
  function settleRemove(id) {
    setRemovingIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    onChange(attachments.filter((a) => a.id !== id));
  }

  return (
    <div className="cw-attachments">
      {attachments.map((a) => {
        const removing = removingIds.has(a.id);
        return (
          <Reveal key={a.id} open={!removing} onExited={() => settleRemove(a.id)}>
            <UsesRow name={a.name} kind={a.kind} removing={removing} onRemove={() => requestRemove(a.id)} />
          </Reveal>
        );
      })}
    </div>
  );
}

export function QuietRow({ icon: Icon = Plus, children, onClick }) {
  return (
    <button type="button" className="cw-quiet-row nodrag nopan" onClick={onClick}>
      <Icon weight="regular" size={13} />
      <span>{children}</span>
    </button>
  );
}

/* ---------------------------------------------------------------------- */
/* Image-input chips — VARIANT STUDIO's original "+ Add image input" row     */
/* (GenerateNode.jsx: "picks round-robin from the artifact studies as fake   */
/* refs"). WAVE 3 — THE VERB EXPANSION generalizes it out of that file per   */
/* the master contract's own instruction for Style Reference ("image-input   */
/* chips (reuse Generate's)") — moved here so both GenerateNode.jsx AND      */
/* SignalNode.jsx's Style body compose the SAME row/chip/staged-removal      */
/* rather than one of them forking a second copy, the same "extract it W2"   */
/* precedent this file's own ECHO_SOURCES/UpstreamEchoRow comment already    */
/* documents for the identical Params -> Wave-2-generalization move.        */
/* ---------------------------------------------------------------------- */
export const IMG_INPUT_FORMATS = ['Graphic', 'Video', 'Presentation'];

function ImageInputChip({ item, onRemove }) {
  return (
    <span className="cw-imginput-chip">
      <span className="cw-imginput-thumb">
        <Artifact format={item.format} seed={item.seed} compact />
      </span>
      <span className="cw-imginput-name">{item.name}</span>
      <button type="button" className="cw-imginput-remove nodrag nopan" aria-label={`Remove ${item.name}`} onClick={onRemove}>
        <X weight="bold" size={9} />
      </button>
    </span>
  );
}

// DESIGN BAR ("exits for every unmount — nothing vanishes") — a chip
// collapses via Reveal before it actually leaves the caller's own array,
// mirroring this file's own OptionsEditor stage-then-splice pattern
// verbatim (same `removingIds` shape, same "onExited settles the real
// removal" contract). The new-chip "grow in" reuses nodes.css's EXISTING
// cw-row-in keyframe (OptionsEditor's own add-half) rather than inventing a
// second one — a vertical+fade entrance reads fine for a small chip too.
export function ImageInputRow({ imageInputs, onRemove }) {
  const [removingIds, setRemovingIds] = useState(() => new Set());

  function requestRemove(itemId) {
    setRemovingIds((prev) => new Set(prev).add(itemId));
  }
  function settleRemove(itemId) {
    setRemovingIds((prev) => {
      if (!prev.has(itemId)) return prev;
      const next = new Set(prev);
      next.delete(itemId);
      return next;
    });
    onRemove(itemId);
  }

  return (
    <div className="cw-imginput-row">
      {imageInputs.map((item) => {
        const removing = removingIds.has(item.id);
        return (
          <Reveal key={item.id} open={!removing} onExited={() => settleRemove(item.id)}>
            <ImageInputChip item={item} onRemove={() => requestRemove(item.id)} />
          </Reveal>
        );
      })}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* WAVE 3 — THE VERB EXPANSION. A small reusable "render whatever kind of    */
/* artifact this output descriptor is" thumb — Compare's own ranked row      */
/* (LogicNode.jsx) needs to show each candidate's REAL thumbnail regardless  */
/* of whether that candidate is a Generate node's poster (`output.seed`, no  */
/* `output.format` — see run/engine.js's own 'generate' beat) or any other   */
/* content-bearing node's run/artifacts.jsx artifact (`output.format` set).  */
/* Same discriminator DeliverableRow/ShelfThumb (CompiledPanel.jsx /          */
/* DeliverablesShelf.jsx) already use for the identical ambiguity — their     */
/* own explicit `output.poster` flag — reached here via the ABSENCE of        */
/* `.format` instead, since a raw upstreamOutputs() descriptor (engine.js)   */
/* never stamps that flag itself (only a MINTED/completed node ever does).   */
/* ---------------------------------------------------------------------- */
export function ArtifactThumb({ output, compact = true, className }) {
  if (!output) return null;
  if (!output.format) return <Poster seed={output.seed ?? 0} compact={compact} className={className} />;
  return <Artifact format={output.format} seed={output.seed ?? 0} compact={compact} className={className} />;
}

/* ==========================================================================
   PLUS IS ATTACH (PLAN.md "## PLUS IS ATTACH — the composer's + opens the
   attach menu") — the ONE shared attach-menu component (`AttachMenu`) plus
   the attachment-chip/card pieces (`AttachChip`, `AttachCard`) every chat
   surface in this app composes from: HumanNode.jsx's in-card gate AND its
   floating B window (one `chatBox` JSX var, two hosts — see that file's own
   header comment), and CheckinNode.jsx's box. One menu, one chip family,
   one card family, three mount points.

   Bridging the state.jsx bottleneck — `chatWithHuman(nodeId, text)` is a
   FIXED two-arg call all the way through: state.jsx's own wrapper
   (`const chatWithHuman = useCallback((nodeId, text) => runnerRef.current.
   chatWithHuman(nodeId, text), [])`) is off this phase's file grant, so a
   third real parameter can never reach run/engine.js's own chatWithHuman.
   `encodeChatAttachment` below smuggles the picked attachment through that
   one string instead, behind a marker character (U+241E, "SYMBOL FOR
   RECORD SEPARATOR" — not a character any organic typed reply is ever
   going to start with). engine.js carries a DUPLICATE decode of the exact
   same marker (its own header comment on `decodeChatAttachment` cross-
   references this one) rather than importing it from here — a "pure" run-
   engine module importing a component file would be backwards, the same
   "disciplined local mirror, not an import" call this app already makes
   elsewhere (HumanNode.jsx's own header comment on mirroring CheckinNode.
   jsx's chat-box JSX). ========================================================================== */

// Vanishingly unlikely inside real typed text — the whole point of picking
// a control character no keyboard emits directly.
export const CW_ATTACH_MARKER = '␞';

export function encodeChatAttachment(text, attachment) {
  if (!attachment) return text || '';
  return `${CW_ATTACH_MARKER}${JSON.stringify(attachment)}${CW_ATTACH_MARKER}${text || ''}`;
}

// One display label, shared by the popover row / staged chip / transcript
// card / engine.js's own reply composition (that file keeps its own literal
// copy of this exact formula for the same "no cross-seam import" reason as
// the marker above) — "07 · Graphic" for a run asset (its RANK among
// delivered nodes, see deriveRunAssets below, not the graph's own BFS
// `data.number` — output/remix nodes never receive one of those, state.jsx's
// renumber() only stamps task/human/checkin/params/generate/signal), or the
// seeded upload filename verbatim.
export function attachmentLabel(attachment) {
  if (!attachment) return '';
  return attachment.kind === 'run' ? `${String(attachment.number).padStart(2, '0')} · ${attachment.format}` : attachment.name;
}

// Believable, seeded, demoware — "no real picker" (PLAN.md). Bryan's own
// two example names, verbatim.

// "FROM THIS RUN: upstream delivered assets/deliverables with real thumbs +
// their numbers... derived the same way the results surfaces derive" —
// ResultsNode.jsx's own `deriveResultsRows`/`accumulatedBatchAssets` is the
// read being mirrored (that file is this phase's own HARD OFF-LIMITS, so
// this is a disciplined LOCAL COPY of the read, not an import — same
// mirror-not-import precedent this section's own header comment already
// cites). One row per DELIVERED NODE (never per batch tile — a batch's own
// per-asset numbering is a different, node-local concept from "which
// delivered node is this"), numbered by RANK among deliveries (1, 2, 3...
// in flow order) rather than the graph's BFS `data.number` — output/remix
// nodes never receive one of those (see attachmentLabel's own comment), so
// a popover number here is this list's own honest, internally-consistent
// rank, never a value claiming to match some other on-canvas label. A batch
// node's own top-level `output.imageUrl`/`seed`/`poster` are already
// asset-0's (run/engine.js's 'output' case mints them that way on purpose,
// "OutputNode: a batch output's in-card stage shows the FIRST asset") — the
// exact same three-way real-photo/poster/drawn-artifact branch ResultsRow's
// own thumb already uses reads correctly here with zero extra plumbing.
// Reads `data.versions` (run/engine.js's own append-only, capped-at-8
// history — never nulled by a fresh Run's own "reset outputs first" sweep)
// rather than the live `data.output` ResultsNode.jsx's ROW derivation
// reads: that field IS reset to `null`/`{developing:true}` for the couple
// of beats between a re-run starting and this node's own delivery landing
// again — exactly the transient blip ResultsNode.jsx's OWN `useStable
// ResultsNode` ref-freeze exists to smooth over for its always-mounted
// lightbox. This popover has no equivalent always-mounted instance to hang
// a ref off (HumanNode.jsx's copy of it un/remounts with the gate's own
// Reveal across separate runs — see this file's own header comment on why
// a local mirror was chosen over an import), so reading the durable field
// directly sidesteps the blip entirely rather than re-solving it with a
// second stabilization ref: "upstream delivered assets" (PLAN.md) means
// whatever this node's LAST delivery was, which `versions`' own final
// entry always answers correctly regardless of what `data.output` is
// doing on this exact tick of a re-run in progress.
function deriveRunAssets(nodes) {
  return (nodes || [])
    .filter((n) => (n.type === 'output' || n.type === 'remix') && Array.isArray(n.data?.versions) && n.data.versions.length > 0)
    .sort((a, b) => (a.data?.seq ?? 0) - (b.data?.seq ?? 0))
    .map((n, i) => {
      const versions = n.data.versions;
      const v = versions[versions.length - 1];
      const isBatch = Array.isArray(v.assets) && v.assets.length > 0;
      return {
        nodeId: n.id,
        number: i + 1,
        format: v.format || n.data?.format || 'Text',
        isBatch,
        // Batch versions carry no top-level imageUrl of their own — asset 0
        // is the representative thumb, same "anchor" convention run/
        // engine.js's own live `output.imageUrl` already uses for a batch
        // node's in-card stage.
        imageUrl: isBatch ? v.assets[0]?.imageUrl : v.imageUrl,
        poster: !!v.poster,
        seed: v.seed ?? 0,
      };
    });
}

// The real-thumb / poster / drawn-artifact three-way, shared by the popover
// row, the staged chip, and the transcript card — same discriminator
// ResultsRow's own thumb already uses (see deriveRunAssets' comment).
function RunAssetThumb({ attachment }) {
  if (attachment.imageUrl) return <img src={attachment.imageUrl} alt="" className="cw-attach-thumb-img" />;
  if (attachment.poster) return <Poster seed={attachment.seed ?? 0} compact className="cw-attach-thumb-svg" />;
  return <Artifact format={attachment.format} seed={attachment.seed ?? 0} compact className="cw-attach-thumb-svg" />;
}

function AttachGlyph({ attachment, size = 26 }) {
  const sizeVar = { '--cw-attach-size': `${size}px` };
  if (attachment.kind === 'run') {
    return (
      <span className="cw-attach-thumb" style={sizeVar} aria-hidden="true">
        <RunAssetThumb attachment={attachment} />
      </span>
    );
  }
  const Icon = attachment.subKind === 'Image' ? ImageIcon : FilePdf;
  return (
    <span className="cw-attach-badge" style={sizeVar} aria-hidden="true">
      <Icon weight="regular" size={Math.round(size * 0.46)} />
    </span>
  );
}

// Item 1 — "Click + → a small attach POPOVER... anchored to the + button,
// Esc/outside-click closes." Outside-click/Escape wiring mirrors this same
// file's own NodeCommandMenu (document pointerdown + a capture-phase
// keydown listener, stopPropagation so it wins ahead of the shell's own
// bubble-phase "Escape closes the whole builder" listener) — the same
// belt-and-braces pattern ComboBox.jsx/BlockPicker.jsx already use for
// every other popover in this app.
export function AttachMenu({ nodeId, disabled, attachment, onAttach }) {
  const { nodes } = useFlowState();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    function onDown(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    function onKeyCapture(e) {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      setOpen(false);
    }
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKeyCapture, true);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKeyCapture, true);
    };
  }, [open]);

  // Cheap enough to always derive; only actually read while the popover is
  // open, same "no cost while idle" spirit as every other lazy popover
  // content in this app.
  const runAssets = open ? deriveRunAssets(nodes) : EMPTY_RUN_ASSETS;

  function pick(next) {
    onAttach(next);
    // FILES ON THE CANVAS — every attach gesture (run asset or real upload)
    // also registers the file in the palette's Files tab store; this is the
    // ONE seam both popover paths already funnel through.
    addCanvasFile(next);
    setOpen(false);
  }

  return (
    <div className="cw-attach-menu-wrap" ref={wrapRef}>
      <button
        type="button"
        className="cw-chat-composer-tool nodrag nopan"
        aria-label="Add attachment"
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
      >
        <Plus weight="bold" size={13} />
      </button>
      {open && (
        <div className="cw-attach-popover nodrag nopan nowheel" role="menu">
          {/* "derived the same way the results surfaces derive... empty
              section hides" — no run deliverables yet (before any run) ->
              this whole section is absent, never an empty placeholder. */}
          {runAssets.length > 0 && (
            <div className="cw-attach-popover-section">
              <div className="cw-section-label">From this run</div>
              {runAssets.map((a) => {
                const rowAttachment = { kind: 'run', nodeId: a.nodeId, number: a.number, format: a.format, isBatch: a.isBatch, imageUrl: a.imageUrl, poster: a.poster, seed: a.seed };
                return (
                  <button
                    key={a.nodeId}
                    type="button"
                    role="menuitem"
                    className="cw-attach-popover-row"
                    onClick={() => pick(rowAttachment)}
                  >
                    <AttachGlyph attachment={rowAttachment} size={30} />
                    <span className="cw-attach-popover-name">
                      <span className="cw-attach-popover-num">{String(a.number).padStart(2, '0')}</span> · {a.format}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
          <div className="cw-attach-popover-section">
            <div className="cw-section-label">Upload</div>
            {/* A REAL file pick, not canned rows (Bryan: "this button should
                be add an external attachment not do whatever this does") —
                the hidden input opens the OS picker; the chosen file's own
                name (and, for images, a live object-URL preview) becomes
                the attachment. Session-only, nothing uploaded anywhere. */}
            <button
              type="button"
              role="menuitem"
              className="cw-attach-popover-row"
              onClick={() => fileInputRef.current?.click()}
            >
              <AttachGlyph attachment={{ kind: 'upload', subKind: 'File', name: '' }} size={30} />
              <span className="cw-attach-popover-name">Add an external attachment…</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              style={{ display: 'none' }}
              onChange={(e) => {
                const f = e.target.files && e.target.files[0];
                if (!f) return;
                const isImage = /^image\//.test(f.type);
                pick({
                  kind: 'upload',
                  subKind: isImage ? 'Image' : 'File',
                  name: f.name,
                  imageUrl: isImage ? URL.createObjectURL(f) : undefined,
                });
                e.target.value = '';
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
const EMPTY_RUN_ASSETS = [];

// Item 2 — "Picking one adds an ATTACHMENT CHIP above the composer (icon +
// name, the canvas-attach chip family; × removes)." `.cw-imginput-remove`
// (this file's own existing round hairless remove-button class, already
// used by UsesRow above) is reused verbatim for the × rather than a new
// class — same DESIGN BAR "reuse, don't invent" call this whole section
// makes throughout.
export function AttachChip({ attachment, onRemove }) {
  if (!attachment) return null;
  return (
    <div className="cw-attach-chip-row">
      <div className="cw-attach-chip">
        <AttachGlyph attachment={attachment} size={22} />
        <span className="cw-attach-chip-name">{attachmentLabel(attachment)}</span>
        <button
          type="button"
          className="cw-imginput-remove nodrag nopan"
          aria-label={`Remove ${attachmentLabel(attachment)}`}
          onClick={onRemove}
        >
          <X weight="bold" size={9} />
        </button>
      </div>
    </div>
  );
}

// Item 3 — "the transcript renders the message with a compact attachment
// card beneath it (thumb for run assets, doc icon for uploads)." Rendered
// by HumanNode.jsx/CheckinNode.jsx inside a USER turn's own `.cw-chat-msg-
// col` (already right-aligned for that role — this card inherits that
// alignment for free, no new CSS needed for it).
export function AttachCard({ attachment }) {
  if (!attachment) return null;
  const sub = attachment.kind === 'run' ? (attachment.isBatch ? 'From this run · batch' : 'From this run') : `Upload · ${attachment.subKind}`;
  return (
    <div className="cw-attach-card">
      <AttachGlyph attachment={attachment} size={30} />
      <span className="cw-attach-card-meta">
        <span className="cw-attach-card-name">{attachmentLabel(attachment)}</span>
        <span className="cw-attach-card-sub">{sub}</span>
      </span>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* WAVE 4 — THE VERB EXPANSION. Extracted from ParamsNode.jsx's own          */
/* MarketChips (COMFY ROUND CP2) — a fixed-roster, multi-select toggle chip  */
/* row: Params' own markets, Guardrail's checks (LogicNode.jsx), Localize's  */
/* markets (LocalizeNode.jsx) are all the SAME shape ("pick zero or more of  */
/* a small named preset, never free text" — unlike Audience's own free-text  */
/* add/remove segment editor above, a genuinely different shape that keeps   */
/* its own local component). Moved here the moment a SECOND consumer needed  */
/* it, the same "extract it" precedent ImageInputRow/IMG_INPUT_FORMATS       */
/* already set in Wave 3. `.cw-market-chip-row`/`.cw-market-chip` (nodes.    */
/* css) keep their original names rather than a generic rename, so this     */
/* ships with zero CSS changes anywhere. `options` is a flat string array —  */
/* every current/future caller's preset IS its own display label (Params'   */
/* 2-letter codes, Localize's market codes, Guardrail's check names), same   */
/* "value===label" convention this app's other small rosters already use.   */
/* ---------------------------------------------------------------------- */
export function ToggleChipRow({ options, selected, onToggle }) {
  return (
    <div className="cw-market-chip-row">
      {options.map((opt) => {
        const active = selected.includes(opt)
        return (
          <button
            key={opt}
            type="button"
            className={`cw-market-chip nodrag nopan${active ? ' is-active' : ''}`}
            aria-pressed={active}
            onClick={() => onToggle(opt)}
          >
            {opt}
          </button>
        )
      })}
    </div>
  )
}

/* ---------------------------------------------------------------------- */
/* Handles — §Graph schema: single target "in" on the left (trigger has     */
/* none); sources on the right, default id "out". Base handle size/color   */
/* theming lives in D's flow.css (#workflow-root .react-flow__handle, which */
/* outranks any class selector here) — this file only adds behavior        */
/* (ghost add-buttons) and, in nodes.css, the position override needed     */
/* when a handle is nested inside a labeled branch/option row.             */
/* ---------------------------------------------------------------------- */
export function InHandle({ nodeId, ghost = true }) {
  const connections = useNodeConnections({ id: nodeId, handleType: 'target', handleId: 'in' });
  const connected = connections.length > 0;
  return (
    <>
      <Handle type="target" position={Position.Left} id="in" className="cw-handle" />
      {ghost && !connected && (
        <button
          type="button"
          className="cw-ghost cw-ghost--left nodrag nopan"
          aria-label="Add a block before this block"
          onClick={(e) => {
            e.stopPropagation();
            dispatchAddPicker(nodeId, 'left', e.currentTarget.getBoundingClientRect());
          }}
        >
          <Plus weight="bold" size={10} />
        </button>
      )}
    </>
  );
}

export function OutHandle({ nodeId, ghost = true, id = 'out' }) {
  const connections = useNodeConnections({ id: nodeId, handleType: 'source', handleId: id });
  const connected = connections.length > 0;
  return (
    <>
      <Handle type="source" position={Position.Right} id={id} className="cw-handle" />
      {ghost && !connected && (
        <button
          type="button"
          className="cw-ghost cw-ghost--right nodrag nopan"
          aria-label="Add a block after this block"
          onClick={(e) => {
            e.stopPropagation();
            dispatchAddPicker(nodeId, 'right', e.currentTarget.getBoundingClientRect());
          }}
        >
          <Plus weight="bold" size={10} />
        </button>
      )}
    </>
  );
}

/* Editable option list — Human (choice) and Logic (switch) share this UI.
   NODE BREATHE PHASE — "choice-option rows on add/remove" (PLAN.md). Removal
   is the half that needs staging: `options` is fully owned by the caller via
   `onChange`, so a row marked for removal stays in that array (still reading
   its own live label — nothing to freeze) and is only ACTUALLY spliced out
   once its Reveal reports `onExited`, i.e. once it's visibly finished
   collapsing. `removingIds` is purely local UI state (which rows are mid-
   close), never written back through onChange. Addition doesn't need this
   staging — a brand-new row mounts once, so its "grow in" is a plain CSS
   `animation` on `.cw-option-row` (nodes.css, `cw-row-in`) rather than a
   Reveal: animations autoplay on mount with nothing to stage. */
export function OptionsEditor({ options, onChange, placeholder = 'Option label' }) {
  const [removingIds, setRemovingIds] = useState(() => new Set());

  function setLabel(idx, label) {
    const next = options.slice();
    next[idx] = { ...next[idx], label };
    onChange(next);
  }
  function requestRemove(id) {
    setRemovingIds((prev) => new Set(prev).add(id));
  }
  function settleRemove(id) {
    setRemovingIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    onChange(options.filter((o) => o.id !== id));
  }
  function add() {
    const id = `o${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
    onChange([...options, { id, label: '' }]);
  }
  return (
    <div className="cw-options-editor">
      {options.map((opt, idx) => {
        const removing = removingIds.has(opt.id);
        return (
          <Reveal key={opt.id} open={!removing} onExited={() => settleRemove(opt.id)}>
            <div className="cw-option-row">
              <input
                type="text"
                className="cw-input nodrag nopan"
                placeholder={placeholder}
                value={opt.label}
                disabled={removing}
                onChange={(e) => setLabel(idx, e.target.value)}
              />
              <button
                type="button"
                className="cw-option-remove nodrag nopan"
                aria-label="Remove option"
                disabled={removing}
                onClick={() => requestRemove(opt.id)}
              >
                <X weight="bold" size={12} />
              </button>
            </div>
          </Reveal>
        );
      })}
      <QuietRow onClick={add}>Add option</QuietRow>
    </div>
  );
}

/* Per-row source handles for branch/option outputs — human choice options,  */
/* logic switch cases, logic if true/false, logic try/catch. Label text is  */
/* plain-case; nodes.css uppercases it for the "TRUE →" / "POWERPOINT →"    */
/* display treatment.                                                       */
/* MOTION PHASE (M2 item 4) — "when an option handle is connected, its caps */
/* label does a tiny settle bounce". Needs a hook call (useNodeConnections) */
/* per row, which can't live in a .map() callback of a variable-length list */
/* without breaking the rules of hooks — so each row is its own component   */
/* instance instead, one hook call apiece, count-agnostic. `nodeId` is a    */
/* new required prop; both call sites (HumanNode/LogicNode) pass it.        */
function HandleLabelRow({ nodeId, item }) {
  const connections = useNodeConnections({ id: nodeId, handleType: 'source', handleId: item.handleId });
  const connected = connections.length > 0;
  return (
    <div className={`cw-handle-row${connected ? ' is-connected' : ''}`}>
      <span className="cw-handle-row-label">{item.label}</span>
      <ArrowRight weight="bold" size={11} className="cw-handle-row-arrow" />
      <Handle type="source" position={Position.Right} id={item.handleId} className="cw-handle" />
    </div>
  );
}

export function HandleLabelRows({ items, nodeId }) {
  return (
    <div className="cw-handle-rows">
      {items.map((item) => (
        <HandleLabelRow key={item.handleId} nodeId={nodeId} item={item} />
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* COMFY ROUND (CP2, item 5) / WAVE 2 (THE VERB EXPANSION) — the receiving   */
/* card's read-only echo. Originally a Params-only "ParamsEchoRow"; WAVE 2   */
/* generalizes it per the master contract's own instruction ("receiving     */
/* Task/Generate/Split echo 'AUDIENCE · from NN' (params-echo pattern,       */
/* shared component — extract it W2)") into a small registry of "upstream   */
/* kinds this app knows how to summarize as a chip" — adding a future one    */
/* (WAVE 3's Style Reference: "A Generate receiving it: 'STYLE · from NN'    */
/* echo") is one more ECHO_SOURCES entry, no call-site changes anywhere      */
/* this renders (TaskNode, GenerateNode, LogicNode's Split body). Still      */
/* exactly ONE row: if a receiving card somehow has more than one echoable   */
/* upstream wired into it directly, the first match in connection order      */
/* wins — same single-slot shape the original component always had.         */
/*                                                                           */
/* Shared by TaskNode (above TASK INSTRUCTIONS), GenerateNode (above         */
/* PROMPT), and LogicNode's Split body — all ordinary function components    */
/* in the SAME React Flow tree as whatever they're reading FROM, so this is  */
/* a plain reactive read via useNodeConnections + useNodesData (the exact    */
/* hooks InHandle/OutHandle and NodeActionsToolbar already use elsewhere in  */
/* this file) rather than a window-event round trip: it updates live the     */
/* instant a wire connects/disconnects OR the upstream node's own fields     */
/* change, with zero action needed from either node component.              */
/* ---------------------------------------------------------------------- */
const ECHO_SOURCES = [
  {
    match: (n) => n.type === 'params',
    label: 'PARAMS',
    summarize: (data) => {
      const { markets = [], budget, window: win } = data || {};
      const parts = [];
      if (markets.length) parts.push(markets.join(', '));
      if (budget != null) parts.push(`$${Number(budget).toLocaleString()}`);
      if (win?.start || win?.end) parts.push(`${win.start || '—'}–${win.end || '—'}`);
      return parts.join(' · ');
    },
  },
  {
    // WAVE 2 — THE VERB EXPANSION. Only the 'audience' signal kind is
    // echoable — Source/Measure were never asked for this treatment (their
    // own card IS the read of record; nothing downstream summarizes them).
    match: (n) => n.type === 'signal' && n.data?.kind === 'audience',
    label: 'AUDIENCE',
    summarize: (data) =>
      Array.isArray(data?.segments) ? data.segments.map((s) => s.label).filter(Boolean).join(', ') : '',
  },
  {
    // WAVE 3 — THE VERB EXPANSION. "A Generate receiving it: 'STYLE · from
    // NN' echo" (master contract) — this entry is only the read-only
    // summary chip every other echoable upstream gets; the colorway LOCK
    // itself is a separate, real mechanism (GenerateNode.jsx's own
    // useUpstreamStyleSeed below, threaded into run/posters.jsx's Poster).
    match: (n) => n.type === 'signal' && n.data?.kind === 'style',
    label: 'STYLE',
    summarize: (data) => {
      const n = Array.isArray(data?.imageInputs) ? data.imageInputs.length : 0;
      const seed = data?.seed ?? DEFAULT_GENERATE_SEED;
      return `${n ? `${n} image${n === 1 ? '' : 's'} · ` : ''}seed ${seed}`;
    },
  },
];

function UpstreamEchoContent({ sourceNode, entry }) {
  const num = sourceNode.data?.number;
  const label = num != null ? `${entry.label} · FROM ${String(num).padStart(2, '0')}` : entry.label;
  const values = entry.summarize(sourceNode.data);
  return (
    <div className="cw-echo">
      <span className="cw-echo-label">{label}</span>
      {values ? <span className="cw-echo-values">{values}</span> : null}
    </div>
  );
}

export function UpstreamEchoRow({ nodeId }) {
  const connections = useNodeConnections({ id: nodeId, handleType: 'target', handleId: 'in' });
  const sourceIds = connections.map((c) => c.source);
  const sourceNodesData = useNodesData(sourceIds);
  let match = null;
  for (const n of sourceNodesData || []) {
    if (!n) continue;
    const entry = ECHO_SOURCES.find((e) => e.match(n));
    if (entry) {
      match = { node: n, entry };
      break;
    }
  }
  // NODE BREATHE PHASE convention — freeze the last non-null value so the
  // row's own CONTENT survives visibly through Reveal's close animation
  // instead of blanking a tick before the collapse finishes (same
  // lastUsesRef pattern TaskNode.jsx already uses for its own agent-uses
  // list, see that file's own comment for the identical reasoning).
  const lastRef = useRef(match);
  if (match) lastRef.current = match;
  const display = match || lastRef.current;
  return (
    <Reveal open={!!match}>
      {display ? <UpstreamEchoContent sourceNode={display.node} entry={display.entry} /> : null}
    </Reveal>
  );
}

/* ---------------------------------------------------------------------- */
/* WAVE 3 — THE VERB EXPANSION. "A Generate receiving it: ... its poster     */
/* colorway LOCKS to the style's seed" (master contract) — same live-        */
/* reactive read as UpstreamEchoRow just above (useNodeConnections +         */
/* useNodesData, zero window-event round trip) but returns the raw NUMBER    */
/* a receiving card's own <Poster colorwaySeed=.../> needs, not a rendered   */
/* row. Kept beside ECHO_SOURCES/UpstreamEchoRow since it shares their       */
/* exact upstream-scanning shape; GenerateNode.jsx is this hook's only       */
/* caller today. Multiple Style References wired in: first match in         */
/* connection order wins — same "one slot" rule UpstreamEchoRow itself       */
/* already uses.                                                             */
/* ---------------------------------------------------------------------- */
export function useUpstreamStyleSeed(nodeId) {
  const connections = useNodeConnections({ id: nodeId, handleType: 'target', handleId: 'in' });
  const sourceIds = connections.map((c) => c.source);
  const sourceNodesData = useNodesData(sourceIds);
  for (const n of sourceNodesData || []) {
    if (n?.type === 'signal' && n.data?.kind === 'style') return n.data?.seed ?? DEFAULT_GENERATE_SEED;
  }
  return undefined;
}

/* ---------------------------------------------------------------------- */
/* RUN PHASE (R2) — streamed generation preview. Shared by TaskNode (the    */
/* "collapsed to 3 lines + Show more" variant, `clamp`) and OutputNode (the */
/* plain scrollable variant — the full artifact lives in RunPreview's modal */
/* once done, so the inline card copy only needs a sane height cap, not its */
/* own expand affordance). Reads whatever string it's handed — it has no    */
/* opinion on where `content` comes from (R1's engine streams word-by-word  */
/* into `data.output.content`, schema: {format, content}|null); the caret  */
/* only shows while the caller says the node is actively streaming.        */
/* ---------------------------------------------------------------------- */
export function GenerationBox({ content, streaming = false, clamp = false }) {
  const [expanded, setExpanded] = useState(false);
  if (!content && !streaming) return null;
  return (
    <div className="cw-genbox">
      <div className={`cw-genbox-text${clamp && !expanded ? ' is-clamped' : ''}`}>
        {content}
        {streaming && <span className="cw-genbox-caret" aria-hidden="true" />}
      </div>
      {clamp && content ? (
        <QuietRow icon={expanded ? CaretUp : CaretDown} onClick={() => setExpanded((v) => !v)}>
          {expanded ? 'Show less' : 'Show more'}
        </QuietRow>
      ) : null}
    </div>
  );
}

/* RUN SHOW B3 — status stamp at the head rule's right end (nodes.css
   .cw-run-stamp; the SAME rule's left end already carries the kind-tick,
   INSTRUMENT PASS item 1). Replaces RunDoneTick (formerly here — RUN PHASE
   R2 item 1's lone header checkmark) and the paused pause-tag's amber-pill
   promotion (formerly nodes.css `[data-run-state='paused'] .cw-pause-tag`):
   PLAN.md B3 calls for "ONE status voice", and both of those said exactly
   what this single stamp now says in text (a checkmark for done, a warm
   color for waiting). `error` has no entry on purpose, matching R2's own
   "unused for now" convention — this returns null for it exactly like
   RunDoneTick did. */
const RUN_STAMP_LABEL = {
  queued: 'QUEUED',
  running: 'RUNNING',
  paused: 'WAITING',
  done: 'DONE ✓',
};

// WAVE 2 — THE VERB EXPANSION. `label`/`tone` are optional overrides
// (Measure's "stamp reflects DONE ✓ / amber note" — master contract): a
// PASS is the plain, unmodified stamp below (no override at all, zero
// behavior change for every other caller); only a MISS passes
// `label="UNDER"` `tone="warn"`. Backward compatible — every existing
// `<RunStamp runState={...}/>` call site (seven node files) renders
// byte-identically since both new props default to undefined.
export function RunStamp({ runState, label: labelOverride, tone }) {
  const label = labelOverride ?? RUN_STAMP_LABEL[runState];
  if (!label) return null;
  // A `tone` override REPLACES the runState-derived modifier class (rather
  // than adding both) so the two color rules can never fight over cascade
  // order — see cw-run-stamp--warn (nodes.css) for the one tone this app
  // defines today.
  const stateClass = tone ? `cw-run-stamp--${tone}` : `cw-run-stamp--${runState}`;
  // Keyed on runState+label so a transition (e.g. running -> done, or a
  // re-run that flips PASS -> MISS) remounts a fresh span and replays
  // nodes.css's cw-stamp-in slide-in — the "existing label slide-swap
  // technique" PLAN.md B3 points at (CompiledPanel.jsx's Apply button
  // label, app.css .cw-apply-btn-label) — same trick, not a shared class
  // with it (that file is out of this pass's list).
  return (
    <span className={`cw-run-stamp ${stateClass}`} key={`${runState}-${label}`}>
      {label}
      {/* Paused gets the thinking-dots (Bryan: "add some animation to the
          waiting text") — squares, staggered, defined in nodes.css. */}
      {runState === 'paused' && (
        <span className="cw-stamp-dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
      )}
    </span>
  );
}

/* RUN SHOW B2 — calibration ticks double as run ticks. Four independent
   elements, not a repaint of .cw-node.is-selected::before's single
   8-gradient corner mark — a clockwise "staggered opacity" chase needs four
   independently-timed animations, and one pseudo-element's one `opacity`
   can't stagger per background-image layer. Always mounted (cheap: four
   empty, pointer-events:none spans); nodes.css gates all visibility/motion
   to `[data-run-state='running']:not(.is-selected)` — "selection wins" per
   PLAN.md B2 — so an idle or merely-selected card renders these inert. */
export function RunCornerTicks() {
  return (
    <>
      <span className="cw-run-corner cw-run-corner--tl" aria-hidden="true" />
      <span className="cw-run-corner cw-run-corner--tr" aria-hidden="true" />
      <span className="cw-run-corner cw-run-corner--br" aria-hidden="true" />
      <span className="cw-run-corner cw-run-corner--bl" aria-hidden="true" />
    </>
  );
}

/* RUN SHOW B4 — finale roll call. state.jsx dispatches `cw:run-complete`
   exactly once per run that finishes NATURALLY (never on Stop/abort — that
   file's runStoppedRef is what tells the two apart; this hook trusts the
   event unconditionally once it lands). Every node mounts this; only ones
   that actually finished (`runState === 'done'` at the moment the event
   fires) light up, each after its own `seq * 40ms` stagger — reusing the
   exact BFS order M2's materialize cascade already carries via `data.seq` —
   so the flash sweeps the graph in traversal order, "a fast sweep across the
   graph" per PLAN.md B4. `runState`/`seq` are read through refs kept fresh
   every render rather than the closed-over params, because the listener
   itself attaches exactly ONCE (empty deps — no reason to thrash a DOM
   listener on every data.* change); the refs are what let that one listener
   still always see the CURRENT values. No reduced-motion check needed here —
   nodes.css's own media block neutralizes the `.cw-node--finale` keyframe
   directly, the same way every other loop/one-shot in that file works. */
export function useRunFinale(runState, seq) {
  const [finale, setFinale] = useState(false);
  const runStateRef = useRef(runState);
  runStateRef.current = runState;
  const seqRef = useRef(seq);
  seqRef.current = seq;

  useEffect(() => {
    let inTimer;
    let outTimer;
    function onComplete() {
      if (runStateRef.current !== 'done') return;
      clearTimeout(inTimer);
      clearTimeout(outTimer);
      const stagger = Math.max(0, seqRef.current || 0) * 40;
      inTimer = setTimeout(() => setFinale(true), stagger);
      outTimer = setTimeout(() => setFinale(false), stagger + 340);
    }
    window.addEventListener('cw:run-complete', onComplete);
    return () => {
      window.removeEventListener('cw:run-complete', onComplete);
      clearTimeout(inTimer);
      clearTimeout(outTimer);
    };
  }, []);

  return finale;
}

/* ==========================================================================
   NODE TOOLBAR V2 — the Comfy context bar (PLAN.md "## NODE TOOLBAR V2").
   Replaces the plain Duplicate/Delete pill above (R2 item 4) with Bryan's
   full mapping: [ Trash | Color · Collapse · Skip | Run from here | ⋯ ].
   Kept as the SAME exported name/signature (`NodeActionsToolbar({nodeId})`)
   on purpose — all eight node components already render
   `<NodeActionsToolbar nodeId={id} />` unconditionally, and none of those
   files are in this dispatch's seam, so the only way to ship this without
   touching them is to keep swapping this one function's insides.
   ========================================================================== */

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

function nodeCardEl(nodeId) {
  return document.querySelector(
    `#workflow-root .react-flow__node[data-id="${CSS.escape(nodeId)}"] .cw-node`,
  );
}

/* Collapse (item 3) — no single wrapping element exists to hang Reveal's own
   grid-template-rows 0fr/1fr trick off (that needs ONE container per
   collapsible region; this has to shrink "everything after the head" across
   eight different node layouts without editing any of their JSX — out of
   this seam's file grant), so this measures real pixels instead: a forced
   reflow between two explicit `style.maxHeight` assignments is what makes
   the browser actually interpolate between them instead of snapping (a bare
   class toggle can't animate max-height's un-set "none" value — there's
   nothing numeric to tween FROM).

   CDP-found bug (verifying this exact phase, the hard way — twice):
   1. The REST state ("is the card collapsed") must be React-driven, not a
      DOM class this function toggles: TaskNode/etc.'s own JSX recomputes
      `.cw-node`'s ENTIRE className every render off `data`/`selected` (the
      SAME `data` object identity changes on nearly every graph edit, since
      renumber() rebuilds it for every node on every change) — and whenever
      that computed string differs from the DOM's current one for ANY
      reason (e.g. a completely unrelated node getting selected, which
      flips THIS card's own `is-selected` term), React overwrites the WHOLE
      className attribute, silently discarding anything added outside its
      own render (confirmed: select this node, collapse it, select a
      DIFFERENT node — the class vanishes, the stale inline max-height
      does NOT, and the card's real content — no longer display:none —
      spills out of the now-too-short box). So `.is-collapsed` lives on the
      `.react-flow__node` WRAPPER instead (FlowCanvas.jsx's displayNodes
      className decoration — the same mechanism item 2's tint and item 4's
      skip already use), driven straight from `data.collapsed` every
      render, immune to this. nodes.css's collapse rules read it from
      there; this function no longer touches that class at all.
   2. Measuring natural height via the real card's OWN `scrollHeight` reads
      as the (small, collapsed) height whenever `data.collapsed` is
      currently true — its children are display:none via the same rule
      above — so a naive re-measurement on EXPAND undercounts, animating
      to the wrong target (confirmed via direct measurement: 102px instead
      of the card's real ~540px). measureNaturalHeight below sidesteps it
      with a detached clone instead of ever touching the real element's
      own visibility.
   Exported: FlowCanvas.jsx's double-click-the-head handler is the toolbar
   button's other entry point ("Hook — one prop, both entry points" — same
   idiom NODE BOOM PHASE's own onNodesDelete already established for trash)
   and needs the identical tween, not a second implementation of it. */
function measureNaturalHeight(card) {
  const root = document.getElementById('workflow-root');
  if (!root) return card.scrollHeight;
  const clone = card.cloneNode(true);
  clone.style.position = 'absolute';
  clone.style.visibility = 'hidden';
  clone.style.pointerEvents = 'none';
  clone.style.left = '-9999px';
  clone.style.top = '0';
  clone.style.maxHeight = 'none';
  clone.style.width = `${card.getBoundingClientRect().width}px`;
  clone.classList.remove('is-collapsing');
  // Appended straight under #workflow-root — a sibling of the whole RF
  // tree, never inside the `.react-flow__node.is-collapsed` wrapper the
  // real card lives in — so nodes.css's collapsed-hide rule (scoped to
  // that ancestor) can't match the clone's children even while the real
  // card is currently collapsed, while #workflow-root's own --cw-* custom
  // properties still cascade into it correctly (unlike appending to
  // document.body, which would sit outside that scope entirely).
  root.appendChild(clone);
  const h = clone.scrollHeight;
  clone.remove();
  return h;
}

export function animateCollapse(nodeId, collapsed, updateNodeInternals) {
  const card = nodeCardEl(nodeId);
  if (!card) return;
  if (prefersReducedMotion()) {
    card.style.maxHeight = '';
    card.classList.remove('is-collapsing');
    updateNodeInternals?.(nodeId);
    return;
  }
  const head = card.querySelector('.cw-card-head');
  const cardStyle = getComputedStyle(card);
  const padTop = parseFloat(cardStyle.paddingTop) || 0;
  const padBottom = parseFloat(cardStyle.paddingBottom) || 0;
  const collapsedH = (head?.getBoundingClientRect().height || 40) + padTop + padBottom;
  const naturalH = measureNaturalHeight(card);

  card.classList.add('is-collapsing');
  card.style.maxHeight = `${collapsed ? naturalH : collapsedH}px`; // freeze at the CURRENT visual height first
  // eslint-disable-next-line no-unused-expressions
  card.offsetHeight; // force reflow so the next assignment is a real change to transition, not a coalesced no-op
  card.style.maxHeight = `${collapsed ? collapsedH : naturalH}px`; // then animate to the target

  const onEnd = (e) => {
    if (e.target !== card || e.propertyName !== 'max-height') return;
    card.removeEventListener('transitionend', onEnd);
    card.classList.remove('is-collapsing');
    if (!collapsed) card.style.maxHeight = '';
    updateNodeInternals?.(nodeId); // "handles/edges stay attached and aligned" — re-measure now that the box has actually settled
  };
  card.addEventListener('transitionend', onEnd);
}

// Shared entry point for both places Collapse can be triggered — the
// toolbar button below and FlowCanvas.jsx's double-click-the-head handler.
// `patchNodeData` (state.jsx context, NOT useReactFlow().updateNodeData) is
// what actually flips `data.collapsed` — see that function's own header
// comment in state.jsx for the CDP-found reason updateNodeData isn't used
// for this (or skip, or rename) here.
export function toggleNodeCollapse(nodeId, collapsed, patchNodeData, updateNodeInternals) {
  const next = !collapsed;
  animateCollapse(nodeId, next, updateNodeInternals);
  patchNodeData(nodeId, { collapsed: next });
}

// Color chip (item 2) — "8 muted swatches + none", the exact roster Comfy's
// own row carries. Hex values live in cw-tokens.css (--cw-tint-*) so a
// swatch never has to know its own color, only its id; nodes.css reads
// `data.tint` off the SAME id through a `.cw-tint-<id>` className FlowCanvas
// decorates the node with (mirrors the search-hit className precedent —
// this file can't reach `.cw-node`'s own background from here, see that
// file's own comment on why the wrapper carries it instead).
export const TINT_SWATCHES = [
  { id: 'slate', label: 'Slate' },
  { id: 'wine', label: 'Wine' },
  { id: 'rust', label: 'Rust' },
  { id: 'forest', label: 'Forest' },
  { id: 'indigo', label: 'Indigo' },
  { id: 'teal', label: 'Teal' },
  { id: 'plum', label: 'Plum' },
  { id: 'olive', label: 'Olive' },
];

// Skip (item 4) — disabled for logic ("routing ambiguity is worse than the
// limitation" — PLAN.md, verbatim), trigger (nothing upstream to pass
// through FROM), and params (COMFY ROUND CP2, item 5 — run/engine.js's own
// params fast-path fires UNCONDITIONALLY, not gated on data.skipped, so
// toggling this button would be a no-op the engine can't even observe).
// Mirrors run/engine.js's own SKIPPABLE_TYPES (that set's complement, for
// the kinds excluded from it) — duplicated with a pointer comment rather
// than a shared module, matching this codebase's established convention for
// a small cross-file constant not worth its own import (see e.g. that same
// file's GENERATE_DEVELOP_MS).
const SKIP_DISABLED_TYPES = new Set(['logic', 'trigger', 'params']);
const SKIP_DISABLED_REASON = {
  logic: "Logic blocks can't be skipped",
  trigger: "Triggers can't be skipped",
  params: 'Params always pass through',
  // WAVE 2 — THE VERB EXPANSION. Only shown when isSkipDisabled() below
  // actually returns true for a 'signal' node, which only happens for
  // source/audience — so this text never surfaces for a measure node even
  // though it shares the lookup key.
  signal: 'Sources always pass through',
};

// WAVE 2 — THE VERB EXPANSION. Source/Audience join the params reasoning
// (in-portless value carriers — "always pass through", skip is a no-op the
// engine can't observe); Measure does NOT (a real in+out run participant,
// same footing as task/output/wait/generate) — all three share node.type
// 'signal', so a flat Set can't express that split the way it does for
// every other type. Every other type's rule stays the exact plain Set
// membership it always was; only 'signal' needs `data.kind`. Exported so
// FlowCanvas.jsx's S-hotkey guard (the one other call site) shares the
// identical rule rather than re-deriving it.
function isSkipDisabled(type, data) {
  if (type === 'signal') return (data?.kind || 'source') !== 'measure';
  return SKIP_DISABLED_TYPES.has(type);
}
export { isSkipDisabled };

// CONTEXT & CLIPBOARD amendment (PLAN.md — "Skip S: hidden on trigger;
// disabled-with-tooltip on logic (existing rule)") — the toolbar's own icon
// (above) keeps showing a disabled Skip for trigger with its tooltip
// explaining why, unchanged: an icon-only strip reads a missing button as a
// layout glitch, and the tooltip already tells the story. The NEW full
// command menu (NodeCommandMenu, below) is text rows, where hiding a row
// that can never apply is the cleaner, spec-literal move — so it gets its
// OWN set, exported for FlowCanvas.jsx's S hotkey guard to share (a
// correctness-critical gate like this is worth a real import rather than
// this file's usual small-table duplication convention). 'note' joins
// trigger here for the identical reason NoteNode.jsx opts out of the whole
// toolbar: "zero run participation" (COMFY ROUND CP2 item 1) — there is
// nothing to skip, not just a toggle that happens to be a no-op.
export const SKIP_HIDDEN_TYPES = new Set(['trigger', 'note']);
export { SKIP_DISABLED_TYPES };

// Rename (item 6, overflow) — only task/generate/note actually READ
// data.title for their own displayed title (every other node type's card
// renders a fixed string — e.g. HumanNode.jsx's hardcoded "Human
// Intervention" title span); offering Rename anywhere else would let
// someone type a new name and watch nothing happen. NoteNode.jsx's own
// title input reads/writes `data.title` the identical way TaskNode/
// GenerateNode do (CONTEXT & CLIPBOARD amendment names it explicitly:
// "Rename: only types with editable titles (task/generate/note)").
// Omitted from the menu for every other type rather than shown-but-inert.
const RENAME_ELIGIBLE_TYPES = new Set(['task', 'generate', 'note']);

// Info popover (item 6) — "blurb from palette data": the ONE PALETTE_
// SECTIONS row that describes this exact node instance. Trivial for the
// 1:1 types (trigger/task/generate/human/wait/stop — one nodeType, one
// row); logic and output need a second key (data.kind / data.format)
// since several palette rows share the same nodeType. Read-only, never
// mutates PALETTE_SECTIONS.
function findPaletteItem(node) {
  if (!node) return null;
  for (const section of PALETTE_SECTIONS) {
    for (const item of section.items) {
      if (item.nodeType !== node.type) continue;
      if (node.type === 'logic') {
        if (item.id === (node.data?.kind || 'if')) return item;
        continue;
      }
      if (node.type === 'output') {
        if (item.label === (node.data?.format || 'Text')) return item;
        continue;
      }
      // WAVE 2 — THE VERB EXPANSION. blocks.js's three SOURCES rows use
      // `id === 'source'|'audience'|'measure'`, matching `data.kind`
      // one-for-one — same convention logic's `item.id === data.kind` just
      // above already established.
      if (node.type === 'signal') {
        if (item.id === (node.data?.kind || 'source')) return item;
        continue;
      }
      return item;
    }
  }
  return null;
}

const PORT_DESCRIBERS = {
  trigger: () => '0 in · 1 out',
  task: () => '1 in · 1 out',
  generate: () => '1 in · 1 out',
  wait: () => '1 in · 1 out',
  output: () => '1 in · 1 out',
  stop: () => '1 in · 0 out',
  human: (data) =>
    (data?.responseType || 'free') === 'choice'
      ? `1 in · ${(data?.options || []).length} out (choice)`
      : '1 in · 1 out',
  logic: (data) => {
    const kind = data?.kind || 'if';
    if (kind === 'if') return '1 in · 2 out (True, False)';
    if (kind === 'try') return '1 in · 2 out (Try, Catch)';
    if (kind === 'foreach') return '1 in · 1 out';
    // WAVE 1 — THE VERB EXPANSION.
    if (kind === 'gather') return '1 in (many) · 1 out';
    if (kind === 'split') return '1 in · 2 out (A, B)';
    // WAVE 4 — THE VERB EXPANSION.
    if (kind === 'guardrail') return '1 in · 2 out (Pass, Flag)';
    return `1 in · ${(data?.options || []).length} out (case)`; // switch
  },
  // WAVE 2 — THE VERB EXPANSION. Only 'measure' has an in-port — source/
  // audience are pure value carriers, same 0-in shape as params (which has
  // no entry in this table at all today; signal's IS listed since it needs
  // the kind-branch regardless).
  signal: (data) => ((data?.kind || 'source') === 'measure' ? '1 in · 1 out' : '0 in · 1 out'),
  // WAVE 4 — THE VERB EXPANSION. Own types, all plain 1 in · 1 out (no
  // branch handles — Guardrail is the only WAVE 4 node that branches, and it
  // joins 'logic' above instead of getting its own type).
  handoff: () => '1 in · 1 out',
  localize: () => '1 in · 1 out',
  optimize: () => '1 in · 1 out',
  runworkflow: () => '1 in · 1 out',
};
function describePorts(node) {
  const fn = node && PORT_DESCRIBERS[node.type];
  return fn ? fn(node.data) : '—';
}

const RUN_STATE_LABELS = { queued: 'Queued', running: 'Running', paused: 'Waiting', done: 'Done' };
function describeRunState(data) {
  return RUN_STATE_LABELS[data?.runState] || 'Idle';
}

function ToolbarButton({ icon: Icon, iconWeight = 'regular', label, active, danger, disabled, disabledLabel, onClick }) {
  return (
    <button
      type="button"
      className={`cw-node-toolbar-btn${danger ? ' cw-node-toolbar-btn--danger' : ''}${active ? ' is-active' : ''}`}
      aria-label={label}
      aria-pressed={typeof active === 'boolean' ? active : undefined}
      disabled={disabled}
      onClick={onClick}
    >
      <Icon weight={iconWeight} size={14} />
      <span className="cw-node-toolbar-tip" aria-hidden="true">
        {disabled && disabledLabel ? disabledLabel : label}
      </span>
    </button>
  );
}

/* ==========================================================================
   CONTEXT & CLIPBOARD (PLAN.md "## CONTEXT & CLIPBOARD — the last Comfy-menu
   gaps", including its "(amendment — ... in the 3 dot of every node there
   should be something like the above)" subsection). "The ⋯ overflow IS the
   full command menu on every node — same component as the right-click
   menu, one source of truth, type-aware."

   One component, two render modes, picked by whether `anchor` is passed:
     - INLINE (no `anchor`) — NodeActionsToolbar's own ⋯ button mounts this
       directly inside `.cw-node-toolbar-inner`; `.cw-header-menu`'s own
       `position:absolute; top:calc(100% + 8px); left:0` (app.css) resolves
       against that ancestor's `position:relative` (`.cw-node-toolbar`,
       nodes.css) — the exact anchor the old Duplicate/Rename/Info popover
       already used. Dismissal is the HOST's job (NodeActionsToolbar's own
       outside-click/Escape effect) — same as before this phase.
     - FLOATING (`anchor: {x,y}` in screen px) — the NEW node/multi-select
       right-click menus (FlowCanvas.jsx) portal this straight to
       #workflow-root and clamp it near the cursor, mirroring
       BlockPicker.jsx's own "portal escapes RF's pan/zoom transform +
       .cw-app's overflow clip" precedent (see that file's header comment).
       This mode owns its OWN outside-click/Escape dismissal since there is
       no toolbar wrapper to do it for it.

   Multi-select (`nodeIds.length > 1`, floating mode only — the toolbar
   never mounts this for more than one node, per RF's own NodeToolbar
   "visible exactly when this is the sole selection" default) renders the
   REDUCED set PLAN.md names explicitly: "multi-select right-click scopes
   Copy/Duplicate/Delete to the selection." Rename/Info have no single
   answer across a mixed selection, and Pin/Collapse/Skip/Color-across-many
   were never asked for — this stays literal rather than guessing further
   (noted in the dispatch report).
   ========================================================================== */
const MENU_W = 216; // matches BlockPicker.jsx's own POPOVER_W — one "floating popover" family, one width.
const MENU_H_EST = 340; // conservative clamp estimate (the row-list view is the tallest); a shorter view (rename/info) just leaves a little slack below rather than needing a real measurement before first paint.

// Screen-space clamp for FLOATING mode — the same workspace-bounds probe
// (real header/palette/panel rects) as BlockPicker.jsx's own
// computePosition, duplicated rather than imported: that function's
// left/right SIDE-anchoring math is specific to a ghost/wire button's own
// rect, whereas a context menu only ever needs "open near this point, kept
// on-screen" — same small cross-seam-duplication convention this file's own
// header comment already cites for MOCK_AGENTS/KIND_COLORS.
function clampMenuPosition(x, y) {
  const root = typeof document !== 'undefined' ? document.getElementById('workflow-root') : null;
  const headerBottom = root?.querySelector('.cw-header')?.getBoundingClientRect().bottom ?? 0;
  const paletteRight = root?.querySelector('.cw-palette')?.getBoundingClientRect().right ?? 0;
  const winW = typeof window !== 'undefined' ? window.innerWidth : 0;
  const winH = typeof window !== 'undefined' ? window.innerHeight : 0;
  const panelLeft = root?.querySelector('.cw-panel')?.getBoundingClientRect().left ?? winW;
  const minLeft = paletteRight + 8;
  const maxLeft = Math.max(minLeft, panelLeft - 8 - MENU_W);
  const minTop = headerBottom + 8;
  const maxTop = Math.max(minTop, winH - 8 - MENU_H_EST);
  return {
    left: Math.min(Math.max(x, minLeft), maxLeft),
    top: Math.min(Math.max(y, minTop), maxTop),
  };
}

export function NodeCommandMenu({ nodeIds, onClose, anchor }) {
  const { deleteElements } = useReactFlow();
  const updateNodeInternals = useUpdateNodeInternals();
  const {
    patchNodeData,
    setNodeTint,
    setNodePinned,
    copyNodes,
    duplicateNodes,
    // SUBGRAPHS — Convert/Expand are plain data mutations (no FlowCanvas
    // visual involvement needed, unlike Enter — see dispatchEnterSteps'
    // own header comment above), so this component calls them directly
    // through context exactly like copyNodes/duplicateNodes already do.
    convertToSubgraph,
    expandStepsToCanvas,
  } = useFlowState();
  // Only ever consumed in single-select mode below, but hooks can't be
  // called conditionally — cheap to always subscribe, the multi-select
  // branch just never reads the result.
  const nodeInfo = useNodesData(nodeIds[0]);
  // SUBGRAPHS — "Convert to subgraph" eligibility (SUBGRAPH_EXCLUDED_TYPES)
  // has to be checked across the WHOLE selection, not just the first id —
  // a second always-subscribed useNodesData call, same "cheap to always
  // subscribe" precedent as nodeInfo just above. Works identically for
  // single-select (a one-element array) and multi-select.
  const allNodesInfo = useNodesData(nodeIds);
  const convertEligible =
    allNodesInfo.length > 0 && allNodesInfo.every((n) => n && !SUBGRAPH_EXCLUDED_TYPES.has(n.type));
  const [view, setView] = useState('menu'); // 'menu' | 'rename' | 'info'
  const ref = useRef(null);

  useEffect(() => {
    if (!anchor) return undefined; // inline mode: NodeActionsToolbar's own effect owns this.
    function onDown(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    // Capture + stopPropagation — same reasoning as every other popover in
    // this app (NodeActionsToolbar's own effect just below, BlockPicker.jsx):
    // index.html owns a bubble-phase "Escape closes the whole builder"
    // listener that would otherwise also fire.
    function onKeyCapture(e) {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      onClose();
    }
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKeyCapture, true);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKeyCapture, true);
    };
  }, [anchor, onClose]);

  const isMulti = nodeIds.length > 1;
  if (!isMulti && !nodeInfo) return null; // defensive — id vanished (e.g. deleted) between open and paint.

  function doCopy(ids) {
    copyNodes(ids);
    onClose();
  }
  function doDuplicate(ids) {
    duplicateNodes(ids);
    onClose();
  }
  function doDelete(ids) {
    deleteElements({ nodes: ids.map((id) => ({ id })) });
    onClose();
  }
  // SUBGRAPHS — "Convert to subgraph" (command menu, multi-select >= 1, not
  // on triggers/notes/frames" — CONTEXT & CLIPBOARD amendment: "single node
  // = wrap into a Task; multi-select = collapse selection". Same function
  // either way (state.jsx's convertToSubgraph reads the ids itself).
  function doConvert(ids) {
    convertToSubgraph(ids);
    onClose();
  }
  function doExpand(id) {
    expandStepsToCanvas(id);
    onClose();
  }

  let content;
  if (isMulti) {
    content = (
      <div className="cw-menu-view" key="multi">
        <button type="button" role="menuitem" className="cw-menu-item" onClick={() => doCopy(nodeIds)}>
          <CopySimple weight="regular" size={14} />
          Copy
          <kbd className="cw-rail-kbd">⌘C</kbd>
        </button>
        <button type="button" role="menuitem" className="cw-menu-item" onClick={() => doDuplicate(nodeIds)}>
          <Copy weight="regular" size={14} />
          Duplicate
          <kbd className="cw-rail-kbd">⌘D</kbd>
        </button>
        {convertEligible ? (
          <button type="button" role="menuitem" className="cw-menu-item" onClick={() => doConvert(nodeIds)}>
            <Stack weight="regular" size={14} />
            Convert to subgraph
          </button>
        ) : null}
        <div className="cw-menu-divider" aria-hidden="true" />
        <button
          type="button"
          role="menuitem"
          className="cw-menu-item cw-menu-item--danger"
          onClick={() => doDelete(nodeIds)}
        >
          <TrashSimple weight="regular" size={14} />
          Delete
          <kbd className="cw-rail-kbd">⌫</kbd>
        </button>
      </div>
    );
  } else {
    const nodeId = nodeIds[0];
    const { type, data = {} } = nodeInfo;
    const collapsed = !!data.collapsed;
    const skipped = !!data.skipped;
    const pinned = !!data.pinned;
    const canRename = RENAME_ELIGIBLE_TYPES.has(type);
    const skipHidden = SKIP_HIDDEN_TYPES.has(type);
    const skipDisabled = isSkipDisabled(type, data);

    if (view === 'rename') {
      content = (
        <div className="cw-menu-view" key="rename">
          <input
            className="cw-rename-input nodrag nopan cw-menu-rename-input"
            autoFocus
            defaultValue={data.title || ''}
            onFocus={(e) => e.target.select()}
            onBlur={(e) => {
              const next = e.target.value.trim();
              if (next) patchNodeData(nodeId, { title: next });
              onClose();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.currentTarget.blur();
            }}
          />
        </div>
      );
    } else if (view === 'info') {
      const paletteItem = findPaletteItem({ type, data });
      content = (
        <div className="cw-menu-info" key="info">
          <div className="cw-node-info-row">
            <span className="cw-node-info-label">Kind</span>
            <span className="cw-node-info-value">{paletteItem?.label || type}</span>
          </div>
          {paletteItem?.caption ? <p className="cw-node-info-blurb">{paletteItem.caption}</p> : null}
          <div className="cw-node-info-row">
            <span className="cw-node-info-label">Ports</span>
            <span className="cw-node-info-value">{describePorts({ type, data })}</span>
          </div>
          <div className="cw-node-info-row">
            <span className="cw-node-info-label">Run state</span>
            <span className="cw-node-info-value">{describeRunState(data)}</span>
          </div>
        </div>
      );
    } else {
      content = (
        <div className="cw-menu-view" key="menu">
          <button type="button" role="menuitem" className="cw-menu-item" onClick={() => doCopy([nodeId])}>
            <CopySimple weight="regular" size={14} />
            Copy
            <kbd className="cw-rail-kbd">⌘C</kbd>
          </button>
          <button type="button" role="menuitem" className="cw-menu-item" onClick={() => doDuplicate([nodeId])}>
            <Copy weight="regular" size={14} />
            Duplicate
            <kbd className="cw-rail-kbd">⌘D</kbd>
          </button>
          {canRename ? (
            <button type="button" role="menuitem" className="cw-menu-item" onClick={() => setView('rename')}>
              <PencilSimple weight="regular" size={14} />
              Rename
            </button>
          ) : null}
          <button
            type="button"
            role="menuitem"
            className="cw-menu-item"
            onClick={() => {
              setNodePinned(nodeId, !pinned);
              onClose();
            }}
          >
            {pinned ? <PushPinSimpleSlash weight="regular" size={14} /> : <PushPinSimple weight="regular" size={14} />}
            {pinned ? 'Unpin' : 'Pin'}
            <kbd className="cw-rail-kbd">P</kbd>
          </button>
          {!skipHidden ? (
            <button
              type="button"
              role="menuitem"
              className="cw-menu-item"
              disabled={skipDisabled}
              title={skipDisabled ? SKIP_DISABLED_REASON[type] : undefined}
              onClick={() => {
                patchNodeData(nodeId, { skipped: !skipped });
                onClose();
              }}
            >
              <SkipForward weight="regular" size={14} />
              Skip
              <kbd className="cw-rail-kbd">S</kbd>
            </button>
          ) : null}
          <button
            type="button"
            role="menuitem"
            className="cw-menu-item"
            onClick={() => {
              toggleNodeCollapse(nodeId, collapsed, patchNodeData, updateNodeInternals);
              onClose();
            }}
          >
            {collapsed ? <ArrowsOutSimple weight="regular" size={14} /> : <ArrowsInSimple weight="regular" size={14} />}
            {collapsed ? 'Expand' : 'Collapse'}
          </button>
          {/* SUBGRAPHS — "Enter steps" is a Task-only row (the model
              — task.data.steps — only ever lives on that type); it seeds
              the trio on first entry the same way the chip/hotkey do (all
              three funnel into the same cw:enter-steps event, FlowCanvas.
              jsx's own listener owns the actual seed+open). */}
          {type === 'task' ? (
            <button
              type="button"
              role="menuitem"
              className="cw-menu-item"
              onClick={() => {
                dispatchEnterSteps(nodeId);
                onClose();
              }}
            >
              <StepsIcon weight="regular" size={14} />
              Enter steps
            </button>
          ) : null}
          {/* "Expand steps to canvas" only makes sense once there's
              something to dissolve back out. */}
          {type === 'task' && Array.isArray(data.steps?.nodes) && data.steps.nodes.length > 0 ? (
            <button type="button" role="menuitem" className="cw-menu-item" onClick={() => doExpand(nodeId)}>
              <ArrowsOutCardinal weight="regular" size={14} />
              Expand steps to canvas
            </button>
          ) : null}
          {/* CONTEXT & CLIPBOARD amendment — "single node = wrap into a
              Task" (this row's multi-select twin sits in the isMulti branch
              above; convertEligible already covers this single-id case via
              the SAME allNodesInfo/SUBGRAPH_EXCLUDED_TYPES check). */}
          {convertEligible ? (
            <button type="button" role="menuitem" className="cw-menu-item" onClick={() => doConvert([nodeId])}>
              <Stack weight="regular" size={14} />
              Convert to subgraph
            </button>
          ) : null}
          <div className="cw-menu-divider" aria-hidden="true" />
          <div className="cw-menu-swatch-row">
            <span className="cw-menu-swatch-label">
              <PaletteIcon weight="regular" size={12} />
              Color
            </span>
            <div className="cw-menu-swatches" role="menu" aria-label="Card tint">
              <button
                type="button"
                className={`cw-tint-swatch cw-tint-swatch--none${!data.tint ? ' is-active' : ''}`}
                aria-label="No tint"
                aria-pressed={!data.tint}
                onClick={() => {
                  setNodeTint(nodeId, null);
                  onClose();
                }}
              >
                <X weight="bold" size={8} />
              </button>
              {TINT_SWATCHES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`cw-tint-swatch${data.tint === t.id ? ' is-active' : ''}`}
                  style={{ '--swatch-color': `var(--cw-tint-${t.id})` }}
                  aria-label={t.label}
                  aria-pressed={data.tint === t.id}
                  onClick={() => {
                    setNodeTint(nodeId, t.id);
                    onClose();
                  }}
                />
              ))}
            </div>
          </div>
          <div className="cw-menu-divider" aria-hidden="true" />
          <button type="button" role="menuitem" className="cw-menu-item" onClick={() => setView('info')}>
            <InfoIcon weight="regular" size={14} />
            Info
          </button>
          <div className="cw-menu-divider" aria-hidden="true" />
          <button
            type="button"
            role="menuitem"
            className="cw-menu-item cw-menu-item--danger"
            onClick={() => doDelete([nodeId])}
          >
            <TrashSimple weight="regular" size={14} />
            Delete
            <kbd className="cw-rail-kbd">⌫</kbd>
          </button>
        </div>
      );
    }
  }

  const outerClass = `cw-header-menu cw-node-command-menu${anchor ? ' cw-node-command-menu--floating' : ''}`;
  const outerStyle = anchor ? clampMenuPosition(anchor.x, anchor.y) : undefined;
  const menuEl = (
    <div
      ref={ref}
      className={outerClass}
      style={outerStyle}
      role="menu"
      aria-label={isMulti ? `${nodeIds.length} blocks` : 'Block actions'}
    >
      {content}
    </div>
  );

  if (!anchor) return menuEl;
  const target = typeof document !== 'undefined' ? document.getElementById('workflow-root') : null;
  return target ? createPortal(menuEl, target) : null;
}

/* React Flow's own <NodeToolbar> portals + positions the whole thing above
   the card (pans/zooms with the viewport) and, since `isVisible` is left
   unset, defaults to "visible exactly when this node is the sole
   selection" — matching "selected-node only" (PLAN.md) including RF's own
   built-in multi-select declutter, so there's nothing to track by hand.
   FrameNode/VariantCard (VARIANT STUDIO's grid frame + its non-selectable
   children) never render this component at all — never did, still don't —
   so "toolbar must NOT appear on variant cards" holds structurally, not by
   a runtime check here. */
export function NodeActionsToolbar({ nodeId }) {
  const { deleteElements } = useReactFlow();
  const updateNodeInternals = useUpdateNodeInternals();
  // Collapse/skip/rename/tint all go through state.jsx's patchNodeData/
  // setNodeTint (setRawNodes-backed) rather than useReactFlow().
  // updateNodeData — see patchNodeData's own header comment in state.jsx.
  // COMFY ROUND (CP2, item 2) — RUN METER: runsRemaining gates "Run from
  // here" the same way it gates the header Run button and Generate's own
  // Run Model (App.jsx / GenerateNode.jsx).
  const { runState, runFrom, setNodeTint, patchNodeData, runsRemaining } = useFlowState();
  // Reactive read of just THIS node's {id,type,data} — useStore-backed
  // (@xyflow/react's own useNodesData), so tint/collapsed/skipped/title all
  // stay live off the SAME store render TaskNode/HumanNode/etc. itself just
  // read `data` from, rather than a getNode() snapshot that could read a
  // half-tick stale value relative to that render.
  const nodeInfo = useNodesData(nodeId);
  const type = nodeInfo?.type;
  const data = nodeInfo?.data || {};

  const [colorOpen, setColorOpen] = useState(false);
  // "Opens ABOVE the toolbar" (item 2) is the default, but a node selected
  // near the top of the canvas puts that spot behind the app's own 64px
  // header (z-index:7 in a stacking context this popover's own z-index
  // can't out-rank from inside React Flow's viewport) — CDP-found while
  // verifying against the default sample flow (its Task card sits close
  // enough to the top for exactly this). Flips to the SAME "below the
  // toolbar" position the other three popovers already use, measured just
  // like ComboBox.jsx's own openUp flip (real getBoundingClientRect right
  // before paint, not a CSS media query — the header's fixed 64px isn't
  // expressible as one).
  const [colorFlipDown, setColorFlipDown] = useState(false);
  const [overflowOpen, setOverflowOpen] = useState(false);
  const popRef = useRef(null);
  const rowRef = useRef(null);

  // One outside-click/Escape guard for both popovers — only ever one is
  // open at a time (each opener closes the other first), so a single ref
  // on the toolbar's own wrapper covers both.
  //
  // CONTEXT & CLIPBOARD — Rename/Info used to be two MORE local booleans
  // tracked (and dismissed) right here; they're now internal `view` state
  // inside NodeCommandMenu itself (below), which unmounts — discarding
  // whichever view it was showing — the instant `overflowOpen` goes false,
  // so this effect only needs to know about the two POPOVER-triggering
  // flags, not what's currently showing inside one of them.
  //
  // CDP-found bug (verifying an earlier phase): a bare bubble-phase Escape
  // listener here also reaches index.html's own bubble-phase "Escape closes
  // the whole builder" listener — closing a popover on Escape silently blew
  // away the entire workflow overlay with it. FlowCanvas.jsx's own search
  // bar and comments composer already solve this identical problem the same
  // way (see either one's own comment): a CAPTURE-phase document listener
  // with stopPropagation, so this handler runs and wins BEFORE the shell's
  // bubble-phase one ever sees the key.
  useEffect(() => {
    if (!colorOpen && !overflowOpen) return undefined;
    function closeAll() {
      setColorOpen(false);
      setOverflowOpen(false);
    }
    function onDown(e) {
      if (popRef.current && !popRef.current.contains(e.target)) closeAll();
    }
    function onKeyCapture(e) {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      closeAll();
    }
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKeyCapture, true);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKeyCapture, true);
    };
  }, [colorOpen, overflowOpen]);

  if (!nodeInfo) return null; // defensive — this only ever mounts for a real, currently-selected node

  const collapsed = !!data.collapsed;
  const skipped = !!data.skipped;
  // F7 (QA FINDINGS LEDGER) — this floating pill only ever checked
  // skipDisabled, so a Trigger (SKIP_HIDDEN_TYPES, not SKIP_DISABLED_TYPES)
  // rendered Skip disabled+tooltipped instead of gone; the overflow menu
  // below (its own copy of this same pair, see the `!skipHidden ?` branch
  // above) already got this right. Same two-flag read here now.
  const skipHidden = SKIP_HIDDEN_TYPES.has(type);
  const skipDisabled = isSkipDisabled(type, data);
  // RUN METER — "floor 0 disables all run affordances" (PLAN.md). Split into
  // two booleans (not one) so the tooltip below can name the RIGHT reason —
  // "finish the current run" and "out of runs" are different situations a
  // user would fix differently.
  const outOfRuns = runsRemaining <= 0;
  const canRunFrom = runState === 'idle' && !outOfRuns;

  function pickTint(tint) {
    setColorOpen(false);
    setNodeTint(nodeId, tint); // undoable (PLAN.md item 2) — the one toolbar mutation this phase calls out by name
  }
  // 64px header (app.css .cw-header) + a generous swatch-row footprint
  // (20px swatch + 12px padding + border/shadow headroom) + the 8px gap —
  // real numbers, not guesses (see the colorFlipDown state comment above).
  function toggleColor() {
    setOverflowOpen(false);
    if (!colorOpen) {
      const rect = rowRef.current?.getBoundingClientRect();
      setColorFlipDown(!!rect && rect.top - 64 < 44 + 8);
    }
    setColorOpen((v) => !v);
  }
  function handleRunFrom() {
    if (!canRunFrom) return;
    runFrom(nodeId);
  }

  // Edge-aware alignment (final-QA F8, true root cause): the canvas CLIPS at
  // its left boundary (the shell's grid puts the palette in its own column —
  // nothing renders "under" it on this side), so a centered toolbar on a
  // node hugging that edge had its leftmost buttons amputated, not buried:
  // they didn't paint OR hit-test. elementFromPoint at the void found the
  // palette, which read as occlusion and sent two executors chasing z-index
  // and hover-yield ghosts. The honest fix is Figma's: keep the toolbar
  // inside the room. When centering would cross the flow's left edge, align
  // to the node's start so the pill grows rightward instead.
  const toolbarAlign = (() => {
    const row = rowRef.current;
    const flowEl = typeof document !== 'undefined' && document.querySelector('#workflow-root .react-flow');
    if (!row || !flowEl) return 'center';
    const rowW = row.getBoundingClientRect().width || 230;
    const nodeEl = flowEl.querySelector(`.react-flow__node[data-id="${nodeId}"]`);
    if (!nodeEl) return 'center';
    const nr = nodeEl.getBoundingClientRect();
    const centeredLeft = nr.x + nr.width / 2 - rowW / 2;
    return centeredLeft < flowEl.getBoundingClientRect().left + 6 ? 'start' : 'center';
  })();

  return (
    <NodeToolbar nodeId={nodeId} position={Position.Top} offset={10} align={toolbarAlign} className="cw-node-toolbar nodrag nopan">
      {/* display:contents (nodes.css) — a plain outside-click boundary that
          never adds a box of its own; `.cw-node-toolbar` (the pill above)
          is what actually establishes the positioning context every
          popover below anchors against. */}
      <div className="cw-node-toolbar-inner" ref={popRef}>
        <div className="cw-node-toolbar-row" ref={rowRef}>
          <ToolbarButton
            icon={TrashSimple}
            label="Delete"
            danger
            onClick={() => deleteElements({ nodes: [{ id: nodeId }] })}
          />
          <span className="cw-node-toolbar-divider" aria-hidden="true" />
          <ToolbarButton icon={PaletteIcon} label="Color" active={colorOpen || !!data.tint} onClick={toggleColor} />
          <ToolbarButton
            icon={collapsed ? ArrowsOutSimple : ArrowsInSimple}
            label={collapsed ? 'Expand' : 'Collapse'}
            active={collapsed}
            onClick={() => toggleNodeCollapse(nodeId, collapsed, patchNodeData, updateNodeInternals)}
          />
          {!skipHidden ? (
            <ToolbarButton
              icon={SkipForward}
              label="Skip"
              active={skipped}
              disabled={skipDisabled}
              disabledLabel={SKIP_DISABLED_REASON[type]}
              onClick={() => patchNodeData(nodeId, { skipped: !skipped })}
            />
          ) : null}
          <span className="cw-node-toolbar-divider" aria-hidden="true" />
          <ToolbarButton
            icon={Play}
            iconWeight="fill"
            label="Run from here"
            disabled={!canRunFrom}
            disabledLabel={
              !canRunFrom
                ? outOfRuns
                  ? 'Out of runs — refresh the demo'
                  : 'Run from here — finish the current run first'
                : null
            }
            onClick={handleRunFrom}
          />
          <span className="cw-node-toolbar-divider" aria-hidden="true" />
          <ToolbarButton
            icon={DotsThree}
            iconWeight="bold"
            label="More"
            active={overflowOpen}
            onClick={() => {
              setColorOpen(false);
              setOverflowOpen((v) => !v);
            }}
          />
        </div>

        {colorOpen ? (
          <div className={`cw-tint-row${colorFlipDown ? ' cw-tint-row--down' : ''}`} role="menu" aria-label="Card tint">
            <button
              type="button"
              className={`cw-tint-swatch cw-tint-swatch--none${!data.tint ? ' is-active' : ''}`}
              aria-label="No tint"
              aria-pressed={!data.tint}
              onClick={() => pickTint(null)}
            >
              <X weight="bold" size={9} />
            </button>
            {TINT_SWATCHES.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`cw-tint-swatch${data.tint === t.id ? ' is-active' : ''}`}
                style={{ '--swatch-color': `var(--cw-tint-${t.id})` }}
                aria-label={t.label}
                aria-pressed={data.tint === t.id}
                onClick={() => pickTint(t.id)}
              />
            ))}
          </div>
        ) : null}

        {/* CONTEXT & CLIPBOARD amendment — "the ⋯ overflow IS the full
            command menu... same component as the right-click menu, one
            source of truth". Inline mode (no `anchor`): positions itself via
            `.cw-header-menu`'s own CSS against `.cw-node-toolbar`'s
            `position:relative` above, exactly like the old Duplicate/
            Rename/Info popover did; dismissal is this component's own
            outside-click/Escape effect just above (`overflowOpen` going
            false unmounts it, discarding any in-progress Rename/Info view
            for free). */}
        {overflowOpen ? <NodeCommandMenu nodeIds={[nodeId]} onClose={() => setOverflowOpen(false)} /> : null}
      </div>
    </NodeToolbar>
  );
}
