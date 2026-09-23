// Seam A — Nodes
//
// RESULTS SHEET (PLAN.md "## RESULTS SHEET — the frame springs from the
// output node"). Was a free-standing canvas-native FRAME node (RESULTS ON
// THE BOARD / BATCH MATRIX, git history) — the frame retires as its own
// node type; this file now exports the CONTENT only (head row + matrix
// sections + list rows + the shared asset lightbox), consumed by
// OutputNode.jsx as a satellite SHEET tethered to the terminal delivered
// output node — the exact "conversation moves out of the card" vocabulary
// HumanNode.jsx's own chat sheet established (## NODE SHEET / V2), mirrored
// here in the ACCENT (blue) family rather than refactored/shared with that
// file (this phase's own HARD OFF-LIMITS). OutputNode.jsx owns the sheet's
// outer positioning box (`.cw-results-sheet`, nodes.css) plus the tether/
// port; this file owns everything INSIDE it.
//
// 1:1 (the ORIGINAL brief this content still serves): "you get to
// the end of the nodes, sounds like the end of the road, but it's not" —
// his three jobs for this card: 1 "did it work at all", 2 "review — is it
// the cat in the hat or the dog in the hat", 3 "reflect volume somehow...
// spreadsheet with ten thousand rows vs one line of copy." Bryan's own
// framing: "they all look the same, clicking into it shows you the whole
// thing" — every row below is the SAME uniform anatomy regardless of
// format, and a click always opens the real thing.
//
// `useResultsSheetMeta()` — a light hook (id/hasMatrix only, no JSX) that
// OutputNode.jsx calls unconditionally to decide the sheet wrapper's width
// class, independent of whether THIS particular card ends up hosting it.
// `ResultsSheetBody()` — the actual content, mounted by OutputNode.jsx only
// on the anchor card. Its own rows are DERIVED at render time straight off
// `useFlowState().nodes` (never a second copy of the delivered data) —
// filtered to whichever output/remix nodes have actually delivered
// (`data.output` present) and sorted by `data.seq`, the BFS "flow order"
// state.jsx's renumber() already stamps on every node. This is a DELIBERATE
// departure from the DeliverablesShelf/CompiledPanel's own `deliverables`
// selector (state.jsx), which orders by first-COMPLETED order — that
// selector is a session-wide roll call; this content answers for the graph's
// own end-of-flow order instead. "CONTENT: unchanged" (PLAN.md contract) —
// zero delivered outputs → renders nothing (`return null`); WHICH card hosts
// it (state.jsx's `resultsAnchorId`) is a separate, sticky concern that
// never touches this derivation.
//
// Row click / Download / Clear all reuse state.jsx's existing shared
// handlers VERBATIM — `openDeliverable` (the same glide+cw:open-artifact
// bridge OutputNode.jsx/RemixNode.jsx already listen for) and
// `resetDeliveryOrder` (the sheet head's own armed-Clear confirm target) —
// never forked, per DeliverablesShelf.jsx's own "share, do not fork"
// precedent for the two views of one record (that component is now a
// tombstone; this file is its successor). `deliverableDescriptor`/
// `deliverableName` (state.jsx) and the `Artifact`/`Poster` thumb renderers
// (run/artifacts.jsx, run/posters.jsx) are the same trio every other
// artifact-bearing surface in this app already draws from.

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  PresentationChart,
  FileDoc,
  TextT,
  EnvelopeSimple,
  ChatsCircle,
  Image as ImageIcon,
  VideoCamera,
  Waveform,
  Table,
  Layout,
  DownloadSimple,
  Check,
  X,
} from '@phosphor-icons/react';
import { useFlowState, deliverableDescriptor, deliverableName } from '../state.jsx';
import Artifact, { artifactAspect } from '../run/artifacts.jsx';
import Poster, { POSTER_ASPECT } from '../run/posters.jsx';
import { parseMarkdownTable } from '../gen/generate.js';
import { downloadArtifact, downloadAllArtifacts } from '../run/download.js';
// BATCH MATRIX (PLAN.md "## BATCH MATRIX — 25 at a time, results grow up,
// shelf dies") — a batch output's own asset-by-asset lightbox reuses
// RunPreview.jsx VERBATIM rather than forking it — same "reuse, don't
// invent" precedent OutputNode.jsx's own import comment on RunPreview
// already documents. Styling for every new class this phase adds lives in
// the NEW styles/results-matrix.css (main.jsx import, loaded AFTER
// nodes.css so its same-specificity selectors win any tie — see that
// file's own header comment) — nodes.css itself is untouched (the NODE
// SHEET executor owns it live right now, per this phase's own file grant).
// ACCUMULATING BATCHES — the named VersionStepper import this section head
// used for its now-retired "v{n}" browse control is gone too (per-section
// browsing retired, see ResultsMatrixSection's own comment); RunPreview's
// OWN internal version stepper (list rows' single-artifact lightbox,
// unaffected by this change) is unrelated and stays reachable through the
// default export alone.
import RunPreview from '../components/RunPreview.jsx';

// Self-contained duplicate of OutputNode.jsx's own FORMAT_ICONS (RunPreview.
// jsx keeps its own copy too, per that file's own header comment on why a
// small per-seam lookup is fine to duplicate rather than export across a
// seam boundary — nodes.css classes only, no logic drift possible).
const FORMAT_ICONS = {
  Presentation: PresentationChart,
  Doc: FileDoc,
  Text: TextT,
  Email: EnvelopeSimple,
  Teams: ChatsCircle,
  Graphic: ImageIcon,
  Video: VideoCamera,
  Audio: Waveform,
  Spreadsheet: Table,
  'Templated Output': Layout,
};

// ---------------------------------------------------------------------------
// Volume stat — Job 3 lives entirely here. Graphic/Video read their aspect
// off the SAME artifactAspect()/POSTER_ASPECT the card's own stage frame
// already draws from, so the ratio printed here can never disagree with the
// thumb sitting right next to it. Presentation/Spreadsheet reuse generate.
// js's own line-per-slide and markdown-table conventions (RunPreview.jsx's
// parseSlides/parseMarkdownTable read the identical shapes) rather than
// re-deriving a second parser. Every remaining format — the contract's own
// Text/Email/Teams/Doc, plus anything it doesn't name (Audio, Templated
// Output) — falls back to a plain word count.
// ---------------------------------------------------------------------------
function gcd(a, b) {
  a = Math.abs(Math.round(a));
  b = Math.abs(Math.round(b));
  while (b) {
    [a, b] = [b, a % b];
  }
  return a || 1;
}
function ratioLabel(aspect) {
  const [w, h] = String(aspect)
    .split('/')
    .map((n) => parseFloat(n.trim()));
  if (!(w > 0) || !(h > 0)) return '';
  const d = gcd(w, h);
  return `${Math.round(w / d)}:${Math.round(h / d)}`;
}
function wordCount(text) {
  return String(text || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}
function lineCount(text) {
  return String(text || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean).length;
}
function pluralize(n, word) {
  return `${n} ${word}${n === 1 ? '' : 's'}`;
}
function volumeStat({ format, content, seed, poster }) {
  if (format === 'Graphic' || format === 'Video') {
    const aspect = poster ? POSTER_ASPECT : artifactAspect(format, seed);
    const ratio = ratioLabel(aspect);
    const noun = format === 'Graphic' ? 'image' : 'video';
    return ratio ? `1 ${noun} · ${ratio}` : `1 ${noun}`;
  }
  if (format === 'Presentation') return pluralize(lineCount(content), 'slide');
  if (format === 'Spreadsheet') return pluralize(parseMarkdownTable(content).rows.length, 'row');
  return pluralize(wordCount(content), 'word');
}

// ---------------------------------------------------------------------------
// BATCH MATRIX — the section head's own volume line: "v{n} · {N} images"
// (PLAN.md, verbatim wording). A plain count, not the single-row
// volumeStat()'s "1 image · ratio" shape above — a 25-tile grid already
// SHOWS every ratio at a glance, so repeating them in the count would just
// be noise (Job 3, PLAN.md "## RESULTS ON THE BOARD": "reflect volume
// somehow" — the number alone already does that job here).
//
// ACCUMULATING BATCHES (Bryan, live addendum to PAIRED DELIVERABLES —
// "running the nodes again should add the same amount of assets to the
// output panels... it doesn't overwrite, it just adds a full other batch
// of assets"). The "v{n}" prefix retires along with per-section browsing
// (ResultsMatrixSection's own comment) — there is no longer a single
// "current version" to label, every run's assets show at once. `count` is
// now the FULL accumulated total across every run; `runs` (1 by default,
// the no-re-run case) only ever shows once there's something to be honest
// ABOUT — a single run reads exactly as it always has, plain "{N} images".
// ---------------------------------------------------------------------------
function batchVolumeStat(format, count, runs = 1) {
  const base = pluralize(count, format === 'Video' ? 'video' : 'image');
  return runs > 1 ? `${base} · ${pluralize(runs, 'run')}` : base;
}

// (assetAspect() retired by the RULED SHEET — no CSS frame carries an
// asset's ratio any more: a photo <img> shows at its own native ratio and
// a drawn Artifact sizes off its viewBox's true proportions, both contained
// inside the equal ruled cell, results-matrix.css.)

// Tile entrance stagger — ORDERED BUILD-IN (Bryan: "can you make it look
// like the images build in in order"): the old ~16-tile cap (which landed
// tiles 17+ all at once) retires — every tile in a batch now takes its own
// strict turn, 01 → 02 → 03 … left-to-right down the ruled sheet, a ~1.1s
// sweep for a 25-batch. The cadence stays the app's shared 40ms family
// (ResultsRow/ShelfThumb), nudged to 45ms so the sweep reads as a build,
// not a blur.
const TILE_STAGGER_MS = 45;
function tileDelay(index) {
  return index * TILE_STAGGER_MS;
}

// ---------------------------------------------------------------------------
// One tile = one batch asset. `onOpen` hands back (node, asset, format) so
// the parent ResultsNode can mount ONE shared RunPreview instance for
// whichever tile — across however many matrix sections — was clicked last,
// rather than every section/tile owning its own modal (see this file's own
// header comment on why the frame stays the single source for the lightbox
// bridge, same "one component, not N" spirit OutputNode.jsx's ArtifactStage
// already documents).
//
// BATCHES STAY, NEWEST FIRST — two indices now, not one: `displayIndex` is
// the STABLE chronological number (contract item 2 — "so download 07 always
// means the same asset"), computed once across every run in delivery order
// and never touched by which run-group the tile happens to be VISUALLY
// grouped under; `localIndex` is this tile's position WITHIN its own run's
// group (0..N-1 every run), which is what the entrance stagger keys off —
// a global index would leave every run after the first entirely past
// TILE_STAGGER_CAP (run 2's items sit at global 25-49), i.e. no stagger at
// all for any arriving batch after the very first one.
// ---------------------------------------------------------------------------
function ResultsTile({ node, asset, displayIndex, localIndex, format, onOpen, isSelected, onToggleSelect }) {
  const hasPhoto = !!asset.imageUrl;
  // ARRIVAL ANIMATION — "the IMAGES themselves fade in on their own load
  // event... no pop-in of half-loaded photos" (contract item 3). A real
  // photo's <img> starts at opacity:0 (results-matrix.css) and crosses to 1
  // only once its own load event fires — independent of the TILE's own
  // materialize entrance, which is about the tile's position/scale, not
  // whether its pixels have actually arrived yet. `imgRef.current.complete`
  // covers the case a browser served this exact URL from cache and fired
  // `load` before React ever attached the handler (a stale-closed `onLoad`
  // that never fires would otherwise leave the image permanently at
  // opacity:0).
  const [imgLoaded, setImgLoaded] = useState(false);
  const imgRef = useRef(null);
  // ORDERED BUILD-IN (Bryan: "make it look like the images build in in
  // order") — a photo's own load event fires in NETWORK order, which
  // scrambled the sequence (asset 14's pixels could bloom before asset
  // 03's). `turnReached` is this tile's place in the strict sweep: media
  // only reveals once BOTH its bytes have arrived AND its turn has come, so
  // an early-loading photo waits its turn and the sheet reads 01 → 02 → 03…
  // Drawn SVG tiles (no load event, ready instantly) gate on the turn
  // alone. Mount-once by design: stable keys keep prior runs' tiles from
  // ever remounting (the run-group comment below), so a settled tile never
  // replays its reveal when a fresh batch lands.
  const [turnReached, setTurnReached] = useState(false);
  useEffect(() => {
    if (imgRef.current?.complete) setImgLoaded(true);
    const t = setTimeout(() => setTurnReached(true), tileDelay(localIndex));
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const open = () => onOpen(node, asset, format);
  const handleDownload = (e) => {
    e.stopPropagation();
    downloadArtifact({
      nodeId: node.id,
      format,
      content: '',
      seed: asset.seed ?? 0,
      poster: false,
      seq: node.data?.seq,
      imageUrl: asset.imageUrl,
      imageMime: asset.imageMime,
    });
  };

  // SELECTED DOWNLOADS (Bryan: "make it so i can select multiple images and
  // batch download those that are selected") — the tick control toggles this
  // tile in/out of the sheet-wide selection (state lives in ResultsSheetBody,
  // where "Download selected" reads it); stopPropagation keeps a select
  // click from ALSO opening the lightbox, same guard the download chip
  // already uses.
  const toggleSelect = (e) => {
    e.stopPropagation();
    onToggleSelect?.();
  };

  return (
    <div
      role="button"
      tabIndex={0}
      className={`cw-results-tile nodrag nopan${isSelected ? ' is-selected' : ''}`}
      style={{ animationDelay: `${tileDelay(localIndex)}ms` }}
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open();
        }
      }}
      title={`Show image ${displayIndex + 1}`}
    >
      {/* RULED SHEET (Bryan: "make the images different sizes like they
          were before, separate everything with a hairline ... so they all
          sit in equal sized spaces") — the CELL is the fixed, equal unit
          (art zone + caption reservoir, results-matrix.css); the artwork
          inside it renders CONTAINED at its own native ratio, so a 9:16
          story reads tall and a 1:1 post reads square within identical
          ruled spaces, gallery-style. */}
      <div className="cw-results-tile-art">
        {hasPhoto ? (
          <img
            ref={imgRef}
            src={asset.imageUrl}
            alt=""
            className={`cw-results-tile-img${imgLoaded && turnReached ? ' is-loaded' : ''}`}
            onLoad={() => setImgLoaded(true)}
          />
        ) : (
          // A drawn SVG composition has no load event to wait on — ready
          // instantly, so ORDERED BUILD-IN gates it on its turn alone
          // (`is-revealed`), keeping it in step with the photos' sweep. Its
          // viewBox carries the drawing's TRUE ratio, which is what sizes
          // it inside the ruled cell (results-matrix.css: height-driven,
          // width auto).
          <Artifact
            format={format}
            seed={asset.seed ?? 0}
            className={`cw-results-tile-svg${turnReached ? ' is-revealed' : ''}`}
          />
        )}
        <button
          type="button"
          className={`cw-results-tile-select nodrag nopan${isSelected ? ' is-selected' : ''}`}
          onClick={toggleSelect}
          aria-pressed={isSelected}
          aria-label={isSelected ? `Deselect image ${displayIndex + 1}` : `Select image ${displayIndex + 1}`}
          title={isSelected ? 'Deselect' : 'Select'}
        >
          {isSelected ? <Check weight="bold" size={11} /> : null}
        </button>
        <button
          type="button"
          className="cw-results-tile-dl nodrag nopan"
          onClick={handleDownload}
          aria-label={`Download image ${displayIndex + 1}`}
          title="Download"
        >
          <DownloadSimple weight="bold" size={12} />
        </button>
      </div>
      {/* Bryan: "make the asset number and text not appear on the asset...
          i want the copy to appear outside of the asset container" — the
          index badge left the artwork; number + copy now live together in
          one caption line BELOW the art card, Figma-frame-label style
          (the outer tile is borderless — the art box above is the only
          drawn container). Full copy stays one click away in the lightbox. */}
      <p className="cw-results-tile-caption">
        <span className="cw-results-tile-capnum" aria-hidden="true">
          {String(displayIndex + 1).padStart(2, '0')}
        </span>
        {asset.copy || ''}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// One matrix section = one batch output/remix node (`data.output.assets`
// present + non-empty).
//
// ACCUMULATING BATCHES (Bryan, live addendum to PAIRED DELIVERABLES —
// "running the nodes again should add the same amount of assets to the
// output panels... it doesn't overwrite, it just adds a full other batch
// of assets"). Per-section version BROWSING retired — there is nothing to
// browse when every run's own batch shows at once. `versions` is already
// engine.js's own whole-batch-per-run snapshot list (PLAN.md contract:
// "`versions` snapshots whole batches... exactly like single outputs",
// capped at 8 runs same as every other node's version history), each entry
// carrying its OWN full `assets[]` — including PAIRED DELIVERABLES' `copy`
// field, since that was written directly into the per-item asset objects
// the batch beat builds BEFORE the version snapshot is taken (run/engine.js
// 'output' case).
//
// BATCHES STAY, NEWEST FIRST — "concatenated in run order" above now means
// concatenated for NUMBERING only (accumulatedRunGroups, oldest-first, so
// tile IDs stay stable) — for DISPLAY the section renders one sub-group per
// run, newest run's group painted first, each with its own quiet "RUN N"
// divider once there's more than one to distinguish (see the render below).
//
// RESULTS BEAUTIFICATION (PLAN.md "## RESULTS BEAUTIFICATION" — "why do we
// have download all twice... consolidate the header to one thing") — this
// section's own head now has two shapes, chosen by the caller
// (ResultsSheetBody) off the sheet's overall row count:
//   `headerMode="solo"` — the sheet holds exactly ONE section and it's this
//   one. There is nothing above it to be a "second header," so this head
//   STANDS IN for the sheet's own `.cw-results-head` entirely — same
//   `.cw-results-matrix-head` markup as before, with the sheet-level
//   Download-all/Clear pair folded into its own right side (`onDownloadAll`/
//   `onClear`, both handed down by the caller) rather than each existing as
//   its own separate band. Exactly one header, exactly one "Download all."
//   `headerMode="divider"` (default) — the sheet's own head above already
//   carries RESULTS + total + the actions, so this section demotes to a
//   quiet inline divider (mono label + trailing hairline, the SAME
//   `.cw-results-run-divider` family below) — visibly subordinate, never a
//   second full header — with its own batch download shrunk to a small
//   icon-only button instead of a text "Download all" twin.
// ---------------------------------------------------------------------------
function ResultsMatrixSection({ node, onOpenAsset, headerMode = 'divider', onDownloadAll, onClear, selection }) {
  const output = node.data?.output || {};
  const format = output.format || node.data?.format || 'Graphic';
  const Icon = FORMAT_ICONS[format] || ImageIcon;
  const name = deliverableName(format);

  // BATCHES STAY, NEWEST FIRST — `accumulatedRunGroups` is the ONE
  // chronological derivation (oldest run first, tile numbers stamped in
  // that fixed order); `displayGroups` is just that same array shown
  // BACKWARDS so run 2's group paints above run 1's — the numbers inside
  // each group were already assigned before this reverse, so they read
  // 26-50 on top / 01-25 below, never renumbered by display order.
  const groups = accumulatedRunGroups(node);
  const displayGroups = groups.slice().reverse();
  const totalCount = groups.reduce((sum, g) => sum + g.assets.length, 0);
  const runCount = Math.max(1, groups.length);
  const volume = batchVolumeStat(format, totalCount, runCount);

  // Still needed in `divider` mode, where this section's own icon-only
  // download button is the only way to grab just THIS batch (the sheet-wide
  // Download all — `onDownloadAll` — covers every section at once, `solo`
  // mode's own header button IS that sheet-wide one, so this local handler
  // is unused/unreached in that mode).
  const handleBatchDownload = () =>
    downloadAllArtifacts(
      accumulatedBatchAssets(node).map((asset) => ({
        nodeId: node.id,
        format,
        content: '',
        seed: asset.seed ?? 0,
        poster: false,
        seq: node.data?.seq,
        imageUrl: asset.imageUrl,
        imageMime: asset.imageMime,
      })),
    );

  return (
    <div className="cw-results-matrix-section">
      {headerMode === 'solo' ? (
        <div className="cw-results-matrix-head">
          <span className="cw-card-glyph cw-results-glyph" aria-hidden="true">
            <Icon weight="regular" size={13} className="cw-card-icon" />
          </span>
          <span className="cw-results-copy">
            <span className="cw-results-name">{name}</span>
            <span className="cw-results-meta">{volume}</span>
          </span>
          <span className="cw-results-matrix-head-right">
            {selection ? <SelectionActions selection={selection} /> : null}
            <button type="button" className="cw-results-dlall nodrag nopan" onClick={onDownloadAll}>
              Download all
            </button>
            <ResultsClearButton onConfirm={onClear} />
          </span>
        </div>
      ) : (
        <div className="cw-results-matrix-divider">
          <span className="cw-results-matrix-divider-label">
            {name} · {volume}
          </span>
          <span className="cw-results-matrix-divider-line" aria-hidden="true" />
          <button
            type="button"
            className="cw-results-matrix-divider-dl nodrag nopan"
            onClick={handleBatchDownload}
            aria-label={`Download all ${name}`}
            title="Download all"
          >
            <DownloadSimple weight="bold" size={11} />
          </button>
        </div>
      )}
      {/* One `.cw-results-run-group` per run, newest first. The wrapper's
          key is the run's own stable number (1-based, chronological — NOT
          its display position), so an already-painted run never remounts
          when a fresh run pushes it down the list: React matches the old
          key to the new one and just MOVES the existing DOM subtree, which
          is exactly what keeps its tiles' own cw-materialize entrance from
          replaying (contract item 3, "prior batches do NOT replay... key
          them stably") — only a genuinely NEW key (a run that didn't exist
          in the tree a moment ago) triggers a real mount. The divider only
          earns its keep once there's more than one run to distinguish — a
          single run reads exactly as it always has, no "RUN 1" noise. */}
      {displayGroups.map((group) => (
        <div className="cw-results-run-group" key={group.runNumber}>
          {runCount > 1 ? (
            <div className="cw-results-run-divider">
              <span className="cw-results-run-label">RUN {group.runNumber}</span>
            </div>
          ) : null}
          {/* `is-selecting` (SELECTED DOWNLOADS) — once anything anywhere on
              the sheet is selected, every tile's tick control shows faintly
              (not just on hover), so continuing a selection never means
              hunting for invisible controls. */}
          <div className={`cw-results-matrix-grid${selection?.keys?.size > 0 ? ' is-selecting' : ''}`}>
            {group.assets.map(({ asset, displayIndex }, i) => (
              <ResultsTile
                key={asset.seed ?? `${group.runNumber}-${i}`}
                node={node}
                asset={asset}
                displayIndex={displayIndex}
                localIndex={i}
                format={format}
                onOpen={onOpenAsset}
                isSelected={!!selection?.keys?.has(`${node.id}:${displayIndex}`)}
                onToggleSelect={selection ? () => selection.onToggle(`${node.id}:${displayIndex}`) : undefined}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// SELECTED DOWNLOADS (Bryan: "make it so i can select multiple images and
// batch download those that are selected in addition to individual downloads
// and download all") — the header-side readout for an active selection: a
// mono count, a "Download selected" action in the same quiet text-button
// voice as its "Download all" neighbor, and a small × that just empties the
// selection. Renders nothing at zero selected — the header reads exactly as
// it always has until a first tick is made.
// ---------------------------------------------------------------------------
function SelectionActions({ selection }) {
  const count = selection.keys.size;
  if (count === 0) return null;
  return (
    <span className="cw-results-selbar">
      <button type="button" className="cw-results-dlall cw-results-seldl nodrag nopan" onClick={selection.onDownload}>
        Download {count} selected
      </button>
      <button
        type="button"
        className="cw-results-selclear nodrag nopan"
        onClick={selection.onClearSelection}
        aria-label="Clear selection"
        title="Clear selection"
      >
        <X weight="bold" size={10} />
      </button>
    </span>
  );
}

// ---------------------------------------------------------------------------
// Armed two-step Clear — DeliverablesShelf.jsx's own ShelfClearButton,
// duplicated locally rather than exported across the seam boundary (that
// file is Seam B's; small interactive pieces are the established
// duplicate-locally precedent this whole app already leans on — see this
// file's own header comment / nodes/shared.jsx's file-header note). Same
// first-click-arms/second-click-confirms/auto-disarm shape, wired to the
// SAME `resetDeliveryOrder` the shelf's own Clear calls.
// ---------------------------------------------------------------------------
const ARM_TIMEOUT_MS = 3200;

function ResultsClearButton({ onConfirm }) {
  const [armed, setArmed] = useState(false);
  const timerRef = useRef(null);
  const btnRef = useRef(null);

  const disarm = () => {
    clearTimeout(timerRef.current);
    setArmed(false);
  };

  useEffect(() => () => clearTimeout(timerRef.current), []);

  useEffect(() => {
    if (!armed) return undefined;
    function onPointerDown(e) {
      if (!btnRef.current?.contains(e.target)) disarm();
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [armed]);

  return (
    <button
      ref={btnRef}
      type="button"
      className={`cw-results-clear nodrag nopan${armed ? ' is-armed' : ''}`}
      onClick={() => {
        if (armed) {
          disarm();
          onConfirm();
          return;
        }
        setArmed(true);
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(disarm, ARM_TIMEOUT_MS);
      }}
      onBlur={disarm}
      aria-label={armed ? 'Confirm: clear all results' : 'Clear all results'}
    >
      {armed ? 'Clear all?' : 'Clear'}
    </button>
  );
}

// ---------------------------------------------------------------------------
// One row = one delivered output node, the uniform artifact card (PLAN.md,
// verbatim anatomy): format glyph tile (.cw-card-glyph — the existing
// kind-tile family, reused byte-for-byte rather than a new tile class) ·
// deliverableName · meta line "v{n} · {volume stat}" · small fixed-size thumb
// (Artifact/Poster — the SAME renderers the shelf/OutputNode's own stage use,
// so a text format's "sheet motif" and an image format's real art both fall
// out for free) · a download icon-button. Click anywhere on the row opens
// that node's own RunPreview via `onOpen` (state.jsx's `openDeliverable`) —
// never a preview this component renders itself.
// ---------------------------------------------------------------------------
function ResultsRow({ node, index, onOpen }) {
  const descriptor = deliverableDescriptor(node);
  const output = node.data?.output || {};
  const versions = node.data?.versions || [];
  const format = descriptor.format || 'Text';
  const Icon = FORMAT_ICONS[format] || TextT;
  const versionN = Math.max(1, versions.length);
  const stat = volumeStat(descriptor);
  const name = deliverableName(format);

  const open = () => onOpen(node.id);
  const handleDownload = (e) => {
    // Row click (open) must not ALSO fire — same guard as every other
    // click-to-open row's own download button in this app.
    e.stopPropagation();
    downloadArtifact({ ...descriptor, imageUrl: output.imageUrl, imageMime: output.imageMime });
  };

  return (
    <div
      role="button"
      tabIndex={0}
      className="cw-results-row nodrag nopan"
      style={{ animationDelay: `${index * 40}ms` }}
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open();
        }
      }}
      title={`Show ${name}`}
    >
      <span className="cw-card-glyph cw-results-glyph" aria-hidden="true">
        <Icon weight="regular" size={13} className="cw-card-icon" />
      </span>
      <span className="cw-results-copy">
        <span className="cw-results-name">{name}</span>
        <span className="cw-results-meta">
          v{versionN} · {stat}
        </span>
      </span>
      <span className="cw-results-thumb" aria-hidden="true">
        {output.imageUrl ? (
          <img src={output.imageUrl} alt="" className="cw-results-thumb-img" />
        ) : descriptor.poster ? (
          <Poster seed={descriptor.seed} compact className="cw-results-thumb-svg" />
        ) : (
          <Artifact format={format} seed={descriptor.seed} compact className="cw-results-thumb-svg" />
        )}
      </span>
      <button
        type="button"
        className="cw-results-dl nodrag nopan"
        onClick={handleDownload}
        aria-label={`Download ${name}`}
        title="Download"
      >
        <DownloadSimple weight="bold" size={12} />
      </button>
    </div>
  );
}

// BATCH MATRIX — a row carries assets[] the instant its batch has delivered
// (contract: "an output node may carry `data.batchCount`... on delivery the
// engine writes `data.output.assets = [N items]`"). Read defensively (an
// Array check, not a truthy `batchCount`) so this renders correctly whether
// the engine seam's own patch has landed yet or not — "code against that
// shape with safe defaults so landing order doesn't matter" (PLAN.md).
function isBatchRow(node) {
  const assets = node.data?.output?.assets;
  return Array.isArray(assets) && assets.length > 0;
}

// ACCUMULATING BATCHES (Bryan, live addendum to PAIRED DELIVERABLES —
// "running the nodes again should add the same amount of assets to the
// output panels... it doesn't overwrite, it just adds a full other batch
// of assets"). `data.versions` is engine.js's own whole-batch-per-run
// snapshot list (each entry already carrying its OWN full `assets[]`,
// PAIRED DELIVERABLES' `copy` field included since that's written into the
// per-item asset objects BEFORE the version snapshot is taken) — flattening
// it in array order is the complete, oldest-run-first accumulated set,
// nothing dropped, no engine change needed. Falls back to `output.assets`
// only for the pathological case a node predates `versions` entirely
// (defensive — "code against that shape with safe defaults").
//
// BATCHES STAY, NEWEST FIRST — this is now the ONE grouped derivation
// (`accumulatedBatchAssets` below is just its flattened form), returned
// oldest-run-first (run 1 at index 0) so `displayIndex` — stamped here,
// once, in this fixed chronological order — is what makes tile numbering
// stay stable across runs regardless of which order a caller later choses
// to DISPLAY the groups in (ResultsMatrixSection reverses the returned
// array for paint order; the numbers inside each group are already frozen
// by then). Shared by ResultsMatrixSection's own grid AND
// ResultsSheetBody's sheet-wide "Download all" below, so there is exactly
// one place "every run's batch, in order" is computed, not two drifting
// copies.
function accumulatedRunGroups(node) {
  const versions = node.data?.versions || [];
  const liveAssets = node.data?.output?.assets;
  const source = versions.length > 0 ? versions : Array.isArray(liveAssets) && liveAssets.length > 0 ? [{ assets: liveAssets }] : [];
  let counter = 0;
  return source.map((v, i) => ({
    runNumber: i + 1,
    assets: (v.assets || []).map((asset) => ({ asset, displayIndex: counter++ })),
  }));
}

function accumulatedBatchAssets(node) {
  return accumulatedRunGroups(node).flatMap((group) => group.assets.map(({ asset }) => asset));
}

// BATCHES STAY, NEWEST FIRST — mid-run persistence. DIAGNOSIS (contract
// item 1's own "diagnose FIRST" ask): state.jsx's runWorkflow/runFromNode
// ("Re-run: reset outputs first", PLAN.md R1.2 — that file is this phase's
// own HARD OFF-LIMITS) bulk-patches EVERY node's `data.output` to `null`
// the instant Run fires, before the engine's first beat even lands, and
// leaves it `{developing:true, ...}` (no `assets` yet) for the remainder of
// whichever node is currently mid-turn. `data.versions` is NEVER touched by
// that reset or by the developing beat — only the final settled patch
// appends to it — so it is already the durable record (accumulatedRunGroups
// above reads it directly and was never the problem). The actual drop was
// one level up: `deriveResultsRows`'s own `!!n.data?.output` gate reads that
// same live, transiently-null field, so the INSTANT a node's `output` blinks
// to null or to a still-cooking `developing` stub, its entire row — matrix
// section included, every prior run's tiles with it — fell out of `rows`
// for the whole beat. Not the anchor (state.jsx's `resultsAnchorId`, also
// off-limits): the anchor stays put the whole run, it's the ROW CONTENT
// underneath it that was blinking.
//
// FIX (kept entirely inside this derivation, no engine.js/state.jsx edit
// needed): freeze `data.output` per node at its last SETTLED value
// (`developing` falsy) in a ref, and swap that frozen value back in for
// exactly the beat(s) the live field is null or still-developing. A node
// that has never delivered before has nothing to freeze to, so it renders
// exactly as it always did (the normal first-ever "developing" reveal is
// untouched) — this only ever smooths over a RE-delivery of a node that
// already has a completed run on record.
function useStableResultsNodes(nodes) {
  const lastSettledRef = useRef(new Map());
  return useMemo(() => {
    let changed = false;
    const next = nodes.map((n) => {
      if (n.type !== 'output' && n.type !== 'remix') return n;
      const live = n.data?.output;
      if (live && !live.developing) {
        lastSettledRef.current.set(n.id, live);
        return n;
      }
      const frozen = lastSettledRef.current.get(n.id);
      if (!frozen) return n;
      changed = true;
      return { ...n, data: { ...n.data, output: frozen } };
    });
    return changed ? next : nodes;
  }, [nodes]);
}

// RESULTS SHEET — the ONE row-derivation shared by both exports below:
// `useResultsSheetMeta()` (a cheap id/hasMatrix-only read every OutputNode.
// jsx card calls unconditionally to size its own sheet wrapper) and
// `ResultsSheetBody()` (the actual content, mounted only on the anchor
// card). Kept as one pure function rather than two independent derivations
// so the two can never drift on what counts as a "row" or a "matrix row".
// "DERIVED at render time... flow order — never a duplicated copy of that
// data" (PLAN.md, verbatim). Deliberately NOT the shared `deliverables`
// selector (state.jsx) — that one orders by first-completed (a session-wide
// roll call for the panel); this content is a graph object sitting at the
// physical end of THIS flow, so it reads flow/BFS order instead — see this
// file's own header comment for the full reasoning. Admits both 'output'
// and 'remix' nodes (the same two types the shared selector admits, WAVE 3
// — THE VERB EXPANSION), gated on `data.output` presence (the contract's
// own "data.output present" test) rather than `versions?.length` — a node
// can carry a live `output` one tick before its `versions` array grows to
// match (engine.js patches both in the same beat, but this reads whichever
// field the contract actually names). "mixed frames stack: matrix sections
// first, then the list rows" (PLAN.md, verbatim) — a stable partition
// (Array.filter twice over the SAME already-flow-ordered array) keeps each
// group's own internal order exactly the flow order established above —
// this only ever regroups, never re-sorts.
function deriveResultsRows(nodes) {
  const rows = nodes
    .filter((n) => (n.type === 'output' || n.type === 'remix') && !!n.data?.output)
    .sort((a, b) => (a.data?.seq ?? 0) - (b.data?.seq ?? 0));
  const matrixRows = rows.filter(isBatchRow);
  const listRows = rows.filter((n) => !isBatchRow(n));
  return { rows, matrixRows, listRows, hasMatrix: matrixRows.length > 0 };
}

// RESULTS SHEET — the lightweight metadata read. OutputNode.jsx calls this
// on EVERY Output card (not just the anchor) so the wrapper's width class
// (`.cw-results-sheet--matrix`, results-matrix.css) is ready the instant a
// card becomes the anchor, with no extra render lag — cheap: no JSX, no
// lightbox state, just the same `deriveResultsRows` a real content mount
// would also run.
export function useResultsSheetMeta() {
  const { nodes } = useFlowState();
  const stableNodes = useStableResultsNodes(nodes);
  return useMemo(() => deriveResultsRows(stableNodes), [stableNodes]);
}

// RESULTS SHEET — the content. Mounted by OutputNode.jsx inside its own
// `.cw-results-sheet` wrapper (nodes.css) only when that card is the
// current `resultsAnchorId` (state.jsx). No outer positioning/tether/port
// here — OutputNode.jsx owns the satellite box itself, mirroring how
// HumanNode.jsx's chat sheet is structured (that file owns its box, its
// OWN transcript/hat/composer render inside it) without importing from or
// editing that file (this phase's own HARD OFF-LIMITS).
export function ResultsSheetBody() {
  const { nodes, openDeliverable, resetDeliveryOrder } = useFlowState();
  const stableNodes = useStableResultsNodes(nodes);
  const { rows, matrixRows, listRows } = useMemo(() => deriveResultsRows(stableNodes), [stableNodes]);

  // BATCH MATRIX — the tile lightbox. ONE shared instance for the whole
  // sheet (every section's own ResultsTile hands its click back up here via
  // `onOpenAsset`) rather than a modal per section — same "one component,
  // not N" precedent OutputNode.jsx's own ArtifactStage documents. This is
  // deliberately a LOCAL RunPreview mount, not state.jsx's cross-component
  // `openDeliverable`/`cw:open-artifact` bridge that ResultsRow (below)
  // still uses for its plain rows: that bridge addresses a whole NODE's
  // current/browsed version, and has no notion of "asset 14 of 25 inside
  // this node's own batch" — forcing the bridge to carry that would mean
  // teaching OutputNode.jsx's own listener a new field it has no other use
  // for. RunPreview.jsx is already designed to be mounted per-caller exactly
  // like this (OutputNode/GenerateNode/RemixNode each own their own
  // instance), so this is that same pattern, once, for the sheet.
  const [assetPreview, setAssetPreview] = useState(null);
  const openAsset = (node, asset, format) => setAssetPreview({ node, asset, format });
  const closeAsset = () => setAssetPreview(null);

  // SELECTED DOWNLOADS — ONE selection for the whole sheet (keys are
  // `${nodeId}:${displayIndex}`, displayIndex being BATCHES STAY, NEWEST
  // FIRST's stable chronological number, so a key never re-points at a
  // different asset when a fresh run lands). Stale keys after a Clear-all
  // are harmless — the download walk below simply finds nothing for them —
  // but Clear-all empties the selection anyway so the header never claims
  // "N selected" over an empty sheet.
  const [selectedKeys, setSelectedKeys] = useState(() => new Set());
  const toggleSelected = (key) =>
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  const clearSelection = () => setSelectedKeys(new Set());

  // "Zero delivered outputs → the sheet renders nothing visible" (PLAN.md,
  // verbatim) — OutputNode.jsx's own `.cw-results-sheet:empty` CSS rule
  // (nodes.css) collapses the now-childless wrapper's own padding/border/
  // shadow to nothing when this happens, so there is no stray empty box
  // floating on the canvas. This is now genuinely the ZERO-rows case only
  // (a flow that has never delivered anything) — BATCHES STAY, NEWEST
  // FIRST's `useStableResultsNodes` above means a re-run of an anchor that
  // already has a completed delivery on record no longer blinks this
  // content empty for the beat `data.output` sits null/developing; only a
  // node's genuinely first-ever delivery still shows its normal fresh
  // "developing" reveal, same as before this phase.
  if (rows.length === 0) return null;

  // BATCH MATRIX — "Download all" now covers every asset in a batch row too,
  // not just one descriptor per node: a sheet-level bulk action should mean
  // "every deliverable this sheet holds," and for a matrix row that's N real
  // images, not the node's own (empty, for a pure-batch Output) top-level
  // content/seed. Every non-batch row keeps the exact single-descriptor
  // shape this already sent before this phase.
  //
  // ACCUMULATING BATCHES — "every deliverable this sheet holds" now means
  // every RUN'S worth for a batch row (accumulatedBatchAssets — the SAME
  // flattened-versions set ResultsMatrixSection's own grid renders), not
  // just the latest 25; a sheet-wide bulk download that only grabbed the
  // most recent run would silently disagree with what's on screen.
  const handleDownloadAll = () =>
    downloadAllArtifacts(
      rows.flatMap((node) => {
        if (isBatchRow(node)) {
          const format = node.data?.output?.format || node.data?.format || 'Graphic';
          return accumulatedBatchAssets(node).map((asset) => ({
            nodeId: node.id,
            format,
            content: '',
            seed: asset.seed ?? 0,
            poster: false,
            seq: node.data?.seq,
            imageUrl: asset.imageUrl,
            imageMime: asset.imageMime,
          }));
        }
        return [{ ...deliverableDescriptor(node), imageUrl: node.data?.output?.imageUrl, imageMime: node.data?.output?.imageMime }];
      }),
    );

  // SELECTED DOWNLOADS — same descriptor shape and downloadAllArtifacts
  // plumbing as the sheet-wide handler above, filtered to just the ticked
  // keys; the walk runs over the SAME accumulatedRunGroups derivation the
  // grids render from, so what downloads is exactly what reads as selected.
  const handleDownloadSelected = () =>
    downloadAllArtifacts(
      matrixRows.flatMap((node) => {
        const format = node.data?.output?.format || node.data?.format || 'Graphic';
        return accumulatedRunGroups(node)
          .flatMap((group) => group.assets)
          .filter(({ displayIndex }) => selectedKeys.has(`${node.id}:${displayIndex}`))
          .map(({ asset }) => ({
            nodeId: node.id,
            format,
            content: '',
            seed: asset.seed ?? 0,
            poster: false,
            seq: node.data?.seq,
            imageUrl: asset.imageUrl,
            imageMime: asset.imageMime,
          }));
      }),
    );

  const selection = {
    keys: selectedKeys,
    onToggle: toggleSelected,
    onDownload: handleDownloadSelected,
    onClearSelection: clearSelection,
  };
  const handleClearAll = () => {
    clearSelection();
    resetDeliveryOrder();
  };

  // ONE HEADER (PLAN.md "## RESULTS BEAUTIFICATION") — a sheet holding
  // exactly one section, and that section a batch, folds the generic
  // `.cw-results-head` into that section's OWN head (ResultsMatrixSection's
  // `solo` mode) instead of stacking two header bands with two "Download
  // all"s side by side. Any other shape — more than one row, whether that's
  // several batches, a batch plus plain rows, or several plain rows (the
  // content-engine case) — keeps this sheet-level head and, if any matrix
  // sections exist alongside it, demotes each one to a quiet divider
  // (`headerMode="divider"`, the section's own default) instead of a second
  // full header.
  const isSolo = matrixRows.length === 1 && listRows.length === 0;

  return (
    <>
      {isSolo ? (
        <ResultsMatrixSection
          node={matrixRows[0]}
          onOpenAsset={openAsset}
          headerMode="solo"
          onDownloadAll={handleDownloadAll}
          onClear={handleClearAll}
          selection={selection}
        />
      ) : (
        <>
          <div className="cw-results-head">
            <span className="cw-results-label">
              RESULTS · <span className="cw-results-count">{rows.length}</span>
            </span>
            <span className="cw-results-head-right">
              <SelectionActions selection={selection} />
              <button type="button" className="cw-results-dlall nodrag nopan" onClick={handleDownloadAll}>
                Download all
              </button>
              <ResultsClearButton onConfirm={handleClearAll} />
            </span>
          </div>
          {matrixRows.map((node) => (
            <ResultsMatrixSection key={node.id} node={node} onOpenAsset={openAsset} selection={selection} />
          ))}
          {listRows.length > 0 ? (
            <div className="cw-results-body">
              {listRows.map((node, i) => (
                <ResultsRow key={node.id} node={node} index={i} onOpen={openDeliverable} />
              ))}
            </div>
          ) : null}
        </>
      )}
      {/* BATCH MATRIX — the one shared asset lightbox; see this component's
          own `assetPreview` comment above. No `versions`/`versionIndex`
          passed — this opens on THAT ONE ASSET, never the node's own
          multi-version history (a different browsing act entirely). */}
      <RunPreview
        open={!!assetPreview}
        onClose={closeAsset}
        format={assetPreview?.format || 'Graphic'}
        seed={assetPreview?.asset?.seed ?? 0}
        nodeId={assetPreview?.node?.id}
        seq={assetPreview?.node?.data?.seq}
        imageUrl={assetPreview?.asset?.imageUrl}
        imageMime={assetPreview?.asset?.imageMime}
        // PAIRED DELIVERABLES — "the tile's lightbox (RunPreview) shows the
        // FULL copy via its existing caption slot" (contract). RunPreview's
        // ArtifactHero already turns a Graphic/Video/Audio `content` prop
        // into its caption paragraph (stripConceptTag — a no-op here since
        // this text never carries a "[X concept]" prefix); no change to
        // RunPreview.jsx itself, just feeding its existing slot the asset's
        // own copy instead of leaving it empty like every other batch-tile
        // preview did before this phase.
        content={assetPreview?.asset?.copy || ''}
      />
    </>
  );
}
