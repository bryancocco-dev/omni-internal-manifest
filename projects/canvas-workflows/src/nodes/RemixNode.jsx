// Seam C — Nodes
// WAVE 3 — THE VERB EXPANSION (PLAN.md master contract, "### WAVE 3 —
// CREATIVE CHAIN (Style Reference, Remix, Compare)").
//
// "Remix (accent, eyebrow REMIX): in + out; op ComboBox (Translate to
// market, Resize 1:1 → 9:16, Tighten copy, Recolor to style). Engine:
// consumes upstreamOutputs' first artifact, produces a DERIVED artifact
// (same poster family, op-stamped meta line; text ops transform the real
// text) — darkroom develop; lands in deliverables record (panel + shelf)
// like any artifact-bearing done."
//
// Architecture call (own node type, not a kind on an existing one — stated
// here per the dispatch's "your call, state it" instruction for Style
// Reference, and the same reasoning applies here): unlike Style Reference
// (which slots cleanly into SignalNode's existing "value carrier" kind
// family) or Compare (which slots into LogicNode's existing "fan-in
// decision" kind family), Remix has no genuine anatomical sibling among
// this app's existing kind-switched types — it isn't a branch/join
// structural node (LogicNode's family) and it isn't a pure value source
// (SignalNode's family); it's a content-transforming action with its own
// op field and its own darkroom develop tray, the same footing OutputNode/
// GenerateNode already occupy as STANDALONE files despite sharing the
// --cw-accent color family with each other. Reuses their established
// pieces wholesale instead (the develop tray + version history + cw:open-
// artifact + RunPreview integration from OutputNode.jsx, the seed/artifact
// plumbing from run/posters.jsx and run/artifacts.jsx) rather than
// forking new ones.
//
// This file mutates only its OWN node data (updateNodeData) per the
// cross-seam contract — the actual op transform/derived-seed math and the
// deliverables registration (data.versions, the cw:artifact dispatch) live
// entirely in run/engine.js's own 'remix' beat; this component only RENDERS
// whatever that beat last wrote, the same read-only-render posture every
// other run-driven card in this app already takes toward its own engine
// case.

import { memo, useEffect, useState } from 'react';
import { useReactFlow } from '@xyflow/react';
import { Shuffle } from '@phosphor-icons/react';
import {
  CardEyebrow,
  FieldLabel,
  NodeActionsToolbar,
  RunStamp,
  RunCornerTicks,
  useRunFinale,
  GenerationBox,
  InHandle,
  OutHandle,
  UpstreamEchoRow,
} from './shared.jsx';
import ComboBox from './ComboBox.jsx';
import Reveal from './Reveal.jsx';
import RunPreview from '../components/RunPreview.jsx';
import Poster, { POSTER_ASPECT } from '../run/posters.jsx';
// HANDED OFF (PLAN.md "## HANDED OFF") — "OUTPUT CARDS (OutputNode +
// RemixNode — same artifact-stage family)... View/Download actions ALL
// retire from the card." This file's own on-card DownloadChip/"View
// {format}" QuietRow (and their downloadArtifact/Eye/DownloadSimple/
// QuietRow-icon plumbing) retired with them — see this file's own
// DeliveredLine, below, for the one quiet replacement. RunPreview.jsx's
// modal itself stays wired (the results sheet's row-click bridge still
// opens it — this file's own `cw:open-artifact` listener below).
import { useFlowState } from '../state.jsx';

// "op ComboBox (Translate to market, Resize 1:1 → 9:16, Tighten copy,
// Recolor to style)" (master, verbatim options/order). VALUE strings are
// mirrored in run/engine.js's own REMIX_OP_STAMPS (that file's copy of
// this SAME small enum, pointer-commented) — same small-table duplication
// convention SignalNode.jsx's SOURCE_KIND_OPTIONS/run/engine.js's
// SOURCE_KIND_INGEST already established, since engine.js (Seam-neutral
// run/*) never imports a node component's own local constants.
const REMIX_OP_OPTIONS = [
  { value: 'translate', label: 'Translate to market' },
  { value: 'resize', label: 'Resize 1:1 → 9:16' },
  { value: 'tighten', label: 'Tighten copy' },
  { value: 'recolor', label: 'Recolor to style' },
];
// The op-stamped meta line's own text — read here purely for DISPLAY (the
// engine's own version of this table drives the actual derived content);
// duplicated rather than round-tripped through `data.output` so that
// object stays the same {format, content, developing, seed, poster}
// shape every other artifact-bearing node already writes, per the
// deliverables record's own shared contract.
const REMIX_OP_STAMPS = {
  translate: 'TRANSLATED',
  resize: 'RESIZED 9:16',
  tighten: 'TIGHTENED',
  recolor: 'RECOLORED',
};

// HANDED OFF (PLAN.md "## HANDED OFF") — local copy of OutputNode.jsx's own
// DeliveredLine, same duplicate-locally convention this file's own header
// comment (DownloadChip, now retired) and DeliverablesShelf.jsx already
// establish for a tiny presentational piece used in two places — not worth
// a cross-file export/import between two sibling node files. Byte-identical
// markup/classes to OutputNode.jsx's own copy (nodes.css's `.cw-delivered-
// line*` rules are unprefixed and already drive both).
// QUIET DELIVERED (Bryan: "i dont think this needs to be a button, and we
// can get rid of the text – IN RESULTS with arrow") — static status line.
function DeliveredLine() {
  return (
    <div className="cw-delivered-line">
      <span className="cw-delivered-line-dot" aria-hidden="true" />
      <span className="cw-delivered-line-text">Delivered</span>
      <span className="cw-delivered-line-rule" aria-hidden="true" />
    </div>
  );
}

function RemixNode({ id, data = {}, selected }) {
  const { updateNodeData } = useReactFlow();
  const op = data.op || REMIX_OP_OPTIONS[0].value;
  const output = data.output || null;
  const runState = data.runState && data.runState !== 'idle' ? data.runState : undefined;
  const done = data.runState === 'done';
  // RUN SHOW B4 — see shared.jsx useRunFinale.
  const finale = useRunFinale(data.runState, data.seq);
  const [previewOpen, setPreviewOpen] = useState(false);

  const format = output?.format || 'Text';
  const seed = output?.seed ?? 0;
  const isPoster = !!output?.poster;
  const hasArtifact = !!output;
  // HANDED OFF (PLAN.md "## HANDED OFF") — "MID-RUN THEATER STAYS... but on
  // delivery it EXITS (Reveal close, real exit)." Same shape as
  // OutputNode.jsx's own `isDeveloping` (see that file's header comment):
  // the develop tray below is open while `output` exists and this run
  // hasn't landed `done` yet, and closes for good — real Reveal exit, not
  // an unmount — the instant it does. A card that mounts already-delivered
  // never opens it at all.
  const isDeveloping = hasArtifact && !done;
  const stampLabel = REMIX_OP_STAMPS[op] || '';

  // (HANDED OFF's clickable glide-to-results retired with QUIET DELIVERED —
  // DeliveredLine is a static status line now, no anchor lookup needed.)

  // Same "the node that actually owns the click-target artifact opens ITS
  // OWN RunPreview" pattern as OutputNode.jsx (see that file's own header
  // comment on this exact listener) — the DELIVERABLES panel/shelf's shared
  // `openDeliverable` only knows a nodeId, never which component owns it.
  // Stays wired post-HANDED OFF: the results sheet's own plain-row click
  // bridge is what fires this now (the on-card "View" QuietRow that used to
  // trigger it locally is retired).
  useEffect(() => {
    function onOpenArtifact(e) {
      if (e.detail?.nodeId === id) setPreviewOpen(true);
    }
    window.addEventListener('cw:open-artifact', onOpenArtifact);
    return () => window.removeEventListener('cw:open-artifact', onOpenArtifact);
  }, [id]);

  return (
    // MOTION PHASE (M2 item 1) — see TriggerNode.jsx for the --cw-seq note.
    <div
      className={`cw-node cw-node--remix${selected ? ' is-selected' : ''}${finale ? ' cw-node--finale' : ''}`}
      style={{ '--cw-seq': data.seq }}
      data-run-state={runState}
    >
      <NodeActionsToolbar nodeId={id} />
      <RunCornerTicks />
      <div className="cw-card-head">
        {/* "eyebrow REMIX" (master) — plain, no number: same footing as
            OutputNode's own eyebrow (this file's own header comment on why
            it follows Output's precedent, not Task/Generate's numbered
            one) — Remix isn't cited by any downstream echo, so there's no
            reader-facing reason to number it. */}
        <CardEyebrow icon={Shuffle} kind="Remix" />
        <RunStamp runState={data.runState} />
        <div className="cw-card-title-row">
          <span className="cw-title">Remix</span>
        </div>
      </div>
      <p className="cw-caption">Transforms the real upstream artifact with one operation.</p>

      {/* COMFY ROUND (CP2, item 5) / WAVE 2/3 — read-only echo, above the
          op field for the same reason Task/Generate show theirs above their
          own main field. Renders nothing when nothing echoable (Params/
          Audience/Style) is wired in directly — the ordinary case is a
          Generate or another content node feeding this. */}
      <UpstreamEchoRow nodeId={id} />

      <FieldLabel>Operation</FieldLabel>
      <ComboBox
        value={op}
        options={REMIX_OP_OPTIONS}
        placeholder="Select an operation..."
        onChange={(v) => updateNodeData(id, { op: v })}
        ariaLabel="Remix operation"
      />

      {/* The node's OWN develop tray — same darkroom classes OutputNode's/
          GenerateNode's own frames use, poster vs. plain-text branch keyed
          off `output.poster` exactly like OutputNode's own VARIANT-STUDIO
          branch. HANDED OFF: gated on `isDeveloping` now (mid-run theater
          only) instead of the old delivery-spanning `hasArtifact` — real
          Reveal close on delivery, no more held delivered frame/download
          chip (see this file's own `isDeveloping` comment above). `key` on
          the seed forces a fresh mount (and so a fresh develop) on every
          re-run, same reasoning GenerateNode's identical key comment
          gives. */}
      <Reveal open={isDeveloping}>
        <>
          <FieldLabel>Result</FieldLabel>
          {isPoster ? (
            <div key={seed} className="cw-artifact-frame" style={{ aspectRatio: output?.aspect || POSTER_ASPECT }}>
              <Poster seed={seed} className="cw-artifact-art" />
              <span className="cw-artifact-scan" aria-hidden="true" />
            </div>
          ) : (
            <div key={seed} className="cw-artifact-sheet">
              <GenerationBox content={output?.content || ''} streaming={data.runState === 'running'} />
            </div>
          )}
          {/* Op-stamped meta line (master: "op-stamped meta line") — a
              small honest signal naming which operation actually ran,
              same mono voice as OutputNode's own version readout. Retires
              with the rest of the develop tray on delivery — it documents
              THIS run's artifact, not a standing spec field. */}
          {stampLabel ? (
            <div className="cw-version-readout" style={{ marginTop: 6 }}>
              {stampLabel}
            </div>
          ) : null}
        </>
      </Reveal>

      {/* HANDED OFF — the retirement's own replacement, same breathing
          Reveal-swap handoff as OutputNode.jsx's own copy (that file's
          header comment on the identical pairing). */}
      <Reveal open={done && hasArtifact}>
        <DeliveredLine />
      </Reveal>

      <InHandle nodeId={id} />
      <OutHandle nodeId={id} />

      <RunPreview
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        format={format}
        content={output?.content || ''}
        seed={seed}
        poster={isPoster}
        nodeId={id}
        seq={data.seq}
      />
    </div>
  );
}

export default memo(RemixNode);
