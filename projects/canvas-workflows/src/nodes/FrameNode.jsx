// Seam C — Nodes
// VARIANT STUDIO — "2 — the variant GRID (the money shot)" (PLAN.md
// "## VARIANT STUDIO"). Two node types share this one file since they're two
// halves of a single concept — a React Flow group/parent node (default
// export, type 'variantgroup') and its per-slot child (named export
// VariantCard, type 'variant', `parentId` + `extent:'parent'`) — mirroring
// how e.g. LogicNode.jsx already renders four related sub-kinds from one
// component. state.jsx computes and owns every pixel of BOTH nodes'
// geometry at spawn/replace time (frame width/height, each card's grid slot
// position) — these components are pure presentation over whatever
// `data`/`position`/`style` they're handed, per the cross-seam contract
// ("C's node components... no imports from B needed"). Neither type ever
// wires an edge — "NO wires to results (Weave doesn't wire them; the group
// frame carries the relationship)" — so neither renders a Handle at all.
//
// PRODUCTION CLARITY PASS (PLAN.md, 2026-08-19) — "the grid is the choosing
// surface, and it says so." Two changes to FrameNode itself:
//   1. The head's label goes provenance-first: a mono eyebrow reading
//      "FROM NN · TITLE · N TAKES" (NN/title spawn-time-copied from the
//      source generate card by state.jsx's spawnOrReplaceGrid, TAKES read
//      live off `data.count`) plus a quiet caption underneath explaining
//      what the two actions on each card actually do.
//   2. A hairline TETHER — drawn in flow space via <ViewportPortal>, live
//      off both nodes' actual positions (useStore/nodeLookup, the exact
//      idiom OmniEdge.jsx already uses for its own two endpoints) — leads
//      from the source generate card's right edge back to this frame's own
//      label. It draws in once on mount (a plain CSS animation naturally
//      only plays once, since a REPLACE keeps this same frame identity —
//      see spawnOrReplaceGrid's own comment) then settles to a quiet 25%
//      and stays for as long as both nodes exist. Deliberately NOT an edge:
//      no handles, never hit-tested, thinner than the thinnest wire ink
//      (WIRE FEEL's edges idle at 1.25px) — it reads as annotation, a
//      leader line pointing back at its source, not a connection.

import { memo, useState } from 'react';
import { useReactFlow, useStore, ViewportPortal } from '@xyflow/react';
import { ArrowClockwise, Check, DownloadSimple, SquaresFour, TrashSimple } from '@phosphor-icons/react';
import { downloadArtifact } from '../run/download.js';
import { QuietRow } from './shared.jsx';
import Poster, { POSTER_ASPECT } from '../run/posters.jsx';

function hex4(seed) {
  return (Math.abs(seed) % 0xffff).toString(16).toUpperCase().padStart(4, '0');
}
// "Gemini 3.1 Flash (Nano Banana 2)" -> "Gemini 3.1 Flash" — the full roster
// label (data/models.js) is too long for a card this small; the meta line
// only needs enough to tell variants apart at a glance.
function shortModel(model) {
  return String(model || '').split(' (')[0];
}

// Frame-local pixel target the tether's far end points at — roughly the
// provenance chip's left edge, vertically centered on it (`.cw-variantgroup-
// head`/`.cw-variantgroup-chip`, nodes.css: head top:12px left:14px, a ~24px
// tall pill). A tuned constant, not measured — same "JS needs to know a
// CSS-defined size" precedent state.jsx's own VARIANT_CARD_W/H already
// documents, just living on this side of the seam since it's this
// component's own head layout being described.
const TETHER_TARGET_X = 18;
const TETHER_TARGET_Y = 24;
// Generate cards are a fixed 320px wide (nodes.css `.cw-node--generate`);
// height varies with content, so this is only a fallback for the ~one frame
// where the store hasn't measured it yet (see hasTether below — position is
// what actually gates rendering, this just keeps the very first paint from
// aiming at a wrong Y before a real `measured` height lands).
const GENERATE_FALLBACK_W = 320;
const GENERATE_FALLBACK_H = 480;

// ---------------------------------------------------------------------------
// FrameNode — the group (default export, type 'variantgroup'). A
// translucent, oversized card the N result cards visually sit inside;
// dragging/selecting/deleting it carries every child along automatically
// (React Flow's own parentId mechanics — a child's position is stored
// RELATIVE to its parent, and deleteElements/getElementsToRemove cascades to
// any node whose parentId matches one being removed — both verified against
// the installed @xyflow/system package, not assumed). `.cw-node` stays the
// base class (same materialize-in cascade, same is-selected corner ticks as
// every other card) with a `--variantgroup` modifier repainting it
// translucent instead of opaque; width/height come from `data` (computed
// once by state.jsx at spawn/replace time — the DOM box this sets is also
// what React Flow measures for extent:'parent' clamping on the children).
// ---------------------------------------------------------------------------
function FrameNodeImpl({ id, data = {}, selected }) {
  const { deleteElements } = useReactFlow();
  const width = data.width || 320;
  const height = data.height || 300;
  const sourceId = data.sourceId;

  // PRODUCTION CLARITY PASS — the tether's two live endpoints. Narrow scalar
  // selectors (one value each), matching OmniEdge.jsx's own established
  // discipline for this exact lookup: each only re-renders THIS component
  // when that particular number actually changes, not on every store tick
  // (e.g. an unrelated node's drag). Absolute coordinates (not `.position`)
  // on purpose — a frame is always top-level so the two happen to agree
  // here, but reading the same field OmniEdge.jsx does keeps the idiom
  // identical rather than "correct by coincidence".
  const genX = useStore((s) => s.nodeLookup.get(sourceId)?.internals?.positionAbsolute?.x);
  const genY = useStore((s) => s.nodeLookup.get(sourceId)?.internals?.positionAbsolute?.y);
  const genW = useStore((s) => s.nodeLookup.get(sourceId)?.measured?.width);
  const genH = useStore((s) => s.nodeLookup.get(sourceId)?.measured?.height);
  const frameX = useStore((s) => s.nodeLookup.get(id)?.internals?.positionAbsolute?.x);
  const frameY = useStore((s) => s.nodeLookup.get(id)?.internals?.positionAbsolute?.y);

  // Gates on POSITION only (no sane fallback exists for "where is it") —
  // true the instant both nodes have registered into the store, which in
  // practice is always before this ever mounts (the generate node has to
  // already exist, measured, before a grid can spawn from it at all). Also
  // doubles as "both exist" (PLAN.md "STAYS as a persistent tether while
  // both exist"): if the source generate node is ever deleted out from
  // under an orphaned grid, its store entry disappears and this simply
  // stops rendering — no dangling line pointing at nothing.
  const hasTether = !!sourceId && genX != null && genY != null && frameX != null && frameY != null;
  let tether = null;
  if (hasTether) {
    const fromX = genX + (genW ?? GENERATE_FALLBACK_W);
    const fromY = genY + (genH ?? GENERATE_FALLBACK_H) / 2;
    const toX = frameX + TETHER_TARGET_X;
    const toY = frameY + TETHER_TARGET_Y;
    const left = Math.min(fromX, toX);
    const top = Math.min(fromY, toY);
    const w = Math.max(1, Math.abs(toX - fromX));
    const h = Math.max(1, Math.abs(toY - fromY));
    tether = (
      <ViewportPortal>
        <svg className="cw-frame-tether" width={w} height={h} style={{ transform: `translate(${left}px, ${top}px)` }}>
          <line
            className="cw-frame-tether-line"
            x1={fromX - left}
            y1={fromY - top}
            x2={toX - left}
            y2={toY - top}
            pathLength={100}
          />
        </svg>
      </ViewportPortal>
    );
  }

  // "FROM 03 · KEY VISUALS — FALL LINEUP · 6 TAKES" (PLAN.md, verbatim
  // example) — the CSS forces the whole eyebrow uppercase (nodes.css
  // .cw-variantgroup-eyebrow), so `title` rides through in its own natural
  // case, same as every other eyebrow in this app (CardEyebrow, shared.jsx).
  // `sourceNumber`/`count` are spawn-time reads off state.jsx's own object
  // (see spawnOrReplaceGrid's comment) — absent gracefully drops the "FROM
  // NN ·" prefix rather than printing "FROM null".
  const sourceNumber = data.sourceNumber;
  const title = data.title || 'Generate key visuals';
  const count = data.count ?? 0;
  const eyebrow = `${sourceNumber != null ? `FROM ${String(sourceNumber).padStart(2, '0')} · ` : ''}${title} · ${count} TAKE${count === 1 ? '' : 'S'}`;

  return (
    <>
      {tether}
      <div
        className={`cw-node cw-node--variantgroup${selected ? ' is-selected' : ''}`}
        style={{ '--cw-seq': data.seq, width, height }}
      >
        <div className="cw-variantgroup-head">
          <div className="cw-variantgroup-label">
            <span className="cw-variantgroup-chip">
              <SquaresFour weight="regular" size={12} />
              <span className="cw-variantgroup-eyebrow">{eyebrow}</span>
            </span>
            {/* PLAN.md — "no dismiss UI, it's a caption, not a coach mark":
                plain static text, quieter than the chip above it, always
                present rather than something to acknowledge and lose. */}
            <span className="cw-variantgroup-caption">Pick a take — Re-run rerolls it, Keep saves it as an Output.</span>
          </div>
          <button
            type="button"
            className="cw-variantgroup-delete nodrag nopan"
            aria-label="Delete variant grid"
            title="Delete grid"
            onClick={() => deleteElements({ nodes: [{ id }] })}
          >
            <TrashSimple weight="regular" size={13} />
          </button>
        </div>
      </div>
    </>
  );
}
export default memo(FrameNodeImpl);

// ---------------------------------------------------------------------------
// VariantCard (named export, type 'variant') — one result slot. Deliberately
// minimal (PLAN.md: "each result card: minimal"): the poster, a Fira Code
// meta line, Re-run (redevelops THIS card only, seed++), and "-> Output"
// (mints a wired Output(Graphic)). Non-draggable/non-selectable (state.jsx
// sets draggable:false/selectable:false at creation) — the WHOLE grid moves
// as the frame; individual slots stay put so the wall never gets scrambled
// by an accidental drag. `stopPropagation` on both buttons is defensive —
// these aren't draggable/selectable, but a stray pointerdown bubbling to the
// pane (e.g. closing an open popover elsewhere) shouldn't ride along with a
// button click.
// ---------------------------------------------------------------------------
function VariantCardImpl({ id, data = {} }) {
  const [minted, setMinted] = useState(false);
  const seed = data.seed ?? 0;
  const index = data.index ?? 0;

  function rerun(e) {
    e.stopPropagation();
    window.dispatchEvent(new CustomEvent('cw:rerun-variant', { detail: { nodeId: id } }));
  }
  function mintOutput(e) {
    e.stopPropagation();
    window.dispatchEvent(new CustomEvent('cw:mint-output', { detail: { nodeId: id } }));
    setMinted(true);
    setTimeout(() => setMinted(false), 1400);
  }

  return (
    <div className="cw-node cw-node--variant" style={{ '--cw-variant-delay': `${index * 90}ms` }}>
      {/* `key` on the seed forces a fresh mount on Re-run, replaying the
          develop keyframes exactly like GenerateNode's own frame does. */}
      {/* cw-dl-host — the same hover-download contract every artifact surface
          carries (Bryan: "why cant i download these from here"): the chip
          saves THIS take as a PNG without minting anything. */}
      <div key={seed} className="cw-variant-frame cw-dl-host" style={{ aspectRatio: POSTER_ASPECT }}>
        <Poster seed={seed} compact className="cw-variant-art" />
        <span className="cw-variant-scan" aria-hidden="true" />
        <button
          type="button"
          className="cw-dl-chip nodrag nopan"
          aria-label="Download this take"
          title="Download this take (PNG)"
          onClick={(e) => {
            e.stopPropagation();
            downloadArtifact({ nodeId: id, format: 'Graphic', seed, poster: true, seq: index + 1 });
          }}
        >
          <DownloadSimple size={12} weight="bold" />
        </button>
      </div>
      <div className="cw-variant-meta">
        {shortModel(data.model)} · {hex4(seed)}
      </div>
      <div className="cw-variant-actions">
        <QuietRow icon={ArrowClockwise} onClick={rerun}>
          Re-run
        </QuietRow>
        {/* PLAN.md — "'-> Output' button gains tooltip 'Keep this take —
            creates a wired Output block'. Label unchanged." QuietRow
            (shared.jsx, a different seam this pass) doesn't forward a
            `title` prop, so it's carried on a `display:contents` wrapper
            instead of forking that component — invisible to layout, but the
            native tooltip lookup still walks up to it from the button. */}
        {/* "✓ Keep" (Bryan: share glyph + arrow + "Output" was "a lot going
            on... kinda confusing") — one icon, one verb, mirroring Re-run's
            anatomy; the mechanics live in the tooltip. */}
        <span className="cw-variant-mint-tip" title="Keep this take — creates a wired Output block">
          <QuietRow icon={Check} onClick={mintOutput}>
            <span key={minted ? 'added' : 'mint'} className="cw-label-swap-in">
              {minted ? 'Kept' : 'Keep'}
            </span>
          </QuietRow>
        </span>
      </div>
    </div>
  );
}
export const VariantCard = memo(VariantCardImpl);
