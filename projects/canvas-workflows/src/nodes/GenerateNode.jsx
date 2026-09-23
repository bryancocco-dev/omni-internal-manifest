// Seam C — Nodes
// VARIANT STUDIO — "1 — the GENERATE node" (PLAN.md "## VARIANT STUDIO").
//
// An action node that produces media: model + prompt + optional decorative
// reference images, a variant-count dial, and a RUN MODEL button that (a)
// develops this card's OWN artifact frame (the darkroom pipeline OutputNode
// already established — same classes, same 1.6s blur-in) and (b), when
// VARIANTS > 1, fans a grid of result cards out to the right (FrameNode.jsx
// owns the group + its children). Per the cross-seam contract this file
// mutates only its OWN node data via updateNodeData; the grid spawn/replace
// itself is a whole-graph mutation only state.jsx can do, so RUN MODEL just
// dispatches a window event (cw:run-generate) — the exact same pattern
// shared.jsx's dispatchAddFrom/dispatchAddPicker already use for the same
// reason.

import { memo, useState } from 'react';
import { useReactFlow } from '@xyflow/react';
import { Plus, Sparkle, Play, LockSimple, LockSimpleOpen, DiceFive, Eye, DownloadSimple } from '@phosphor-icons/react';
import {
  CardEyebrow,
  FieldLabel,
  NodeActionsToolbar,
  RunStamp,
  RunCornerTicks,
  useRunFinale,
  Segmented,
  QuietRow,
  InHandle,
  OutHandle,
  headlineCase,
  EditableTitle,
  UpstreamEchoRow,
  // WAVE 3 — THE VERB EXPANSION. `IMG_INPUT_FORMATS`/`ImageInputRow` moved
  // out of this file into shared.jsx so SignalNode.jsx's Style Reference
  // body can compose the SAME roster/row/chip — see shared.jsx's own header
  // comment on the move. `useUpstreamStyleSeed` is this wave's new
  // colorway-lock plumbing (below).
  IMG_INPUT_FORMATS,
  ImageInputRow,
  useUpstreamStyleSeed,
} from './shared.jsx';
import Reveal from './Reveal.jsx';
import ComboBox from './ComboBox.jsx';
import Poster, { POSTER_ASPECT, POSTER_RATIO } from '../run/posters.jsx';
import RunPreview from '../components/RunPreview.jsx';
import { downloadArtifact } from '../run/download.js';
// THE REVEAL (PLAN.md "## THE REVEAL") — non-negotiable: "same treatment for
// Generate's own preview and Output's artifact (one component, not two)".
// ArtifactStage/StageAction are defined in OutputNode.jsx (that file's own
// header comment on why) and imported here rather than forked.
import { ArtifactStage, StageAction, useStageWidthHeal } from './OutputNode.jsx';
import { MODEL_OPTIONS, VARIANT_COUNTS, nextImageInputName, DEFAULT_GENERATE_SEED, modelGroup } from '../data/models.js';
// COMFY ROUND (CP2, item 2) — RUN METER gates "Run Model" the same way it
// gates the header Run button and the toolbar's "Run from here" (App.jsx /
// shared.jsx). Cross-seam read, same established precedent as shared.jsx's
// own NodeActionsToolbar importing useFlowState.
import { useFlowState } from '../state.jsx';
// PLATFORM CHROME — the model ComboBox's "Browse all models ↗" footer link
// (ComboBox.jsx's own onBrowseAll prop) opens the shared Model Library modal
// the same way App.jsx's title-dropdown entry does.
import { openBrowser } from '../components/BrowserModal.jsx';

const VARIANT_OPTIONS = VARIANT_COUNTS.map((n) => ({ value: n, label: String(n) }));

function GenerateNode({ id, data = {}, selected }) {
  const { updateNodeData } = useReactFlow();
  // RUN METER — see the import comment above.
  const { runsRemaining } = useFlowState();
  // THE REVEAL — View opens the SAME RunPreview modal Output's own "View"
  // action uses (components/RunPreview.jsx already renders any format's big
  // artifact hero, poster included — see that component's own header
  // comment); nothing new to build, just a second consumer.
  const [previewOpen, setPreviewOpen] = useState(false);

  const title = data.title || 'Generate key visuals';
  const model = data.model || MODEL_OPTIONS[0].value;
  const prompt = data.prompt || '';
  const imageInputs = data.imageInputs || [];
  const variants = data.variants || 6;
  const output = data.output || null;
  // FIT + VERSION STEPPER, part A — same hook OutputNode.jsx uses (that
  // file's own header comment on why this isn't forked), gated on the SAME
  // `!!output` that already opens this card's own ArtifactStage Reveal
  // below. Generate's stage is always the fixed 4:5 POSTER_ASPECT, which
  // never actually trips the min-height transferred-width bug in practice
  // (the diagnosis in nodes.css only fires for wide/landscape ratios) — this
  // stays wired for consistency with Output and so a future non-4:5 Generate
  // preview inherits the fit automatically, not because today's poster ever
  // grows past its own min-width.
  const cardRef = useStageWidthHeal(id, !!output);
  // COMFY ROUND (CP2, item 3) — "SEED DISCIPLINE". `seed` is the epoch
  // state.jsx/run/engine.js thread through makeSeed() for this card's own
  // preview AND every variant grid card; `seedLocked` gates whether RUNNING
  // (Run Model / a full-flow pass) advances it or reuses it as-is.
  const seed = data.seed ?? DEFAULT_GENERATE_SEED;
  const seedLocked = !!data.seedLocked;

  const runState = data.runState && data.runState !== 'idle' ? data.runState : undefined;
  const busy = data.runState === 'running' || data.runState === 'queued';
  // THE REVEAL — same `done` shape OutputNode.jsx computes, feeding
  // ArtifactStage's `delivered` prop.
  const done = data.runState === 'done';
  const outOfRuns = runsRemaining <= 0;
  const finale = useRunFinale(data.runState, data.seq);
  // WAVE 3 — THE VERB EXPANSION. "A Generate receiving [a Style Reference]:
  // ... its poster colorway LOCKS to the style's seed (visible, real
  // effect)" (master contract) — `undefined` when nothing style-shaped is
  // wired into 'in', which is exactly the value run/posters.jsx's own
  // `colorwaySeed` prop treats as "behave as before this wave."
  const styleSeed = useUpstreamStyleSeed(id);

  // Digits only — a stray letter mid-seed would just get discarded on the
  // next makeSeed() coercion anyway (template-literal string concat), but a
  // clean numeric field reads more honestly as "this IS the seed value".
  function setSeedFromInput(raw) {
    const digitsOnly = raw.replace(/[^0-9]/g, '');
    updateNodeData(id, { seed: digitsOnly === '' ? 0 : Number(digitsOnly) });
  }
  // Dice — "randomizes via the existing deterministic counter mechanism (no
  // Math.random — a click-counter seed step is fine)" (dispatch brief).
  // Always active regardless of lock: locking gates whether RUNNING moves
  // the seed on its own, not whether a deliberate user click can.
  function rollDice() {
    updateNodeData(id, { seed: seed + 1 });
  }
  function toggleLock() {
    updateNodeData(id, { seedLocked: !seedLocked });
  }

  function addImageInput() {
    const idx = imageInputs.length;
    const item = {
      id: `img${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
      name: nextImageInputName(idx),
      format: IMG_INPUT_FORMATS[idx % IMG_INPUT_FORMATS.length],
      // Deterministic (no Math.random) so a chip's thumb never re-rolls
      // itself on an unrelated re-render — same spirit as the run engine's
      // own "NO Math.random" seeding rule, just for a purely decorative row.
      seed: idx * 137 + 7,
    };
    updateNodeData(id, { imageInputs: [...imageInputs, item] });
  }
  function removeImageInput(itemId) {
    updateNodeData(id, { imageInputs: imageInputs.filter((i) => i.id !== itemId) });
  }

  // RUN MODEL — "runs JUST this node" (PLAN.md part 1). state.jsx owns the
  // actual develop timing + grid spawn/replace (a whole-graph mutation);
  // this only ever dispatches the request, mirroring dispatchAddFrom/
  // dispatchAddPicker's own reasoning in shared.jsx.
  function runModel() {
    if (busy || outOfRuns) return;
    window.dispatchEvent(new CustomEvent('cw:run-generate', { detail: { nodeId: id } }));
  }

  // THE REVEAL — Download, meta row right zone. Same run/download.js entry
  // point OutputNode.jsx's own VARIANT STUDIO branch already calls for a
  // minted poster (`format:'Graphic', poster:true`) — a Generate card's own
  // preview is always exactly that same shape (this file's own POSTER_ASPECT
  // import comment), real photo bytes passed through as-is when FQ-A's
  // REAL_MODE landed one. stopPropagation matches handleDownload's own
  // reasoning in OutputNode.jsx — this button sits inside a draggable card.
  function handleDownload(e) {
    e.stopPropagation();
    downloadArtifact({
      nodeId: id,
      format: 'Graphic',
      content: '',
      seed: output?.seed ?? 0,
      poster: true,
      seq: data.seq,
      imageUrl: output?.imageUrl,
      imageMime: output?.imageMime,
    });
  }

  return (
    // MOTION PHASE (M2 item 1) — see TriggerNode.jsx for the --cw-seq note.
    <div
      ref={cardRef}
      className={`cw-node cw-node--generate${output ? ' cw-node--stage-sized' : ''}${selected ? ' is-selected' : ''}${finale ? ' cw-node--finale' : ''}`}
      style={{ '--cw-seq': data.seq, ...(output ? { '--cw-stage-ratio': POSTER_RATIO } : null) }}
      data-run-state={runState}
    >
      <NodeActionsToolbar nodeId={id} />
      <RunCornerTicks />
      <div className="cw-card-head">
        {/* PRODUCTION CLARITY PASS (PLAN.md) — 'generate' now joins the
            shared BFS numbering pool (state.jsx renumber()), so this card
            wears "NN · Generate" like every other numbered type — the same
            number FrameNode.jsx's spawned grid cites in its own "FROM NN ·"
            provenance label (spawnOrReplaceGrid copies it across at spawn
            time). */}
        <CardEyebrow icon={Sparkle} number={data.number} kind="Generate" />
        <RunStamp runState={data.runState} />
        <div className="cw-card-title-row">
          <EditableTitle
            title={title}
            display={headlineCase(title)}
            onCommit={(next) => updateNodeData(id, { title: next })}
          />
        </div>
      </div>

      <FieldLabel>Model</FieldLabel>
      <ComboBox
        value={model}
        options={MODEL_OPTIONS}
        // MODEL-AGNOSTIC POSTURE item 3 — "Generate keeps its image/video
        // roster, regrouped by provider" (PLAN.md). Roster identity/order
        // unchanged (data/models.js); this only turns the popover's flat
        // list into provider sections.
        /* Flat list (Bryan: "just list the models in here no reason to call
           out anthroptic company name or whatever") — provider marks on the
           rows carry recognition; the section headers retire. */
        placeholder="Select a model..."
        onChange={(v) => updateNodeData(id, { model: v })}
        ariaLabel="Generation model"
        onBrowseAll={() => openBrowser('models')}
      />

      {/* COMFY ROUND (CP2, item 5) / WAVE 2 — read-only echo, above PROMPT
          for Generate (Prompt is this node's own "instructions" equivalent
          — see the spec's "above TASK INSTRUCTIONS" for Task). */}
      <UpstreamEchoRow nodeId={id} />

      <FieldLabel>Prompt</FieldLabel>
      <textarea
        className="cw-textarea nodrag nopan"
        placeholder="Describe the creative..."
        rows={3}
        value={prompt}
        onChange={(e) => updateNodeData(id, { prompt: e.target.value })}
      />

      <FieldLabel>Image inputs</FieldLabel>
      {/* Nested Reveal (outer: any chips at all; inner, per chip: this ONE
          chip's own remove) — same nesting Reveal.jsx's own header comment
          documents for HumanNode's choice block wrapping OptionsEditor. */}
      <Reveal open={imageInputs.length > 0}>
        <ImageInputRow imageInputs={imageInputs} onRemove={removeImageInput} />
      </Reveal>
      <QuietRow icon={Plus} onClick={addImageInput}>
        Add image input
      </QuietRow>

      <FieldLabel>Variants</FieldLabel>
      <Segmented
        ariaLabel="Variant count"
        value={variants}
        onChange={(v) => updateNodeData(id, { variants: v })}
        options={VARIANT_OPTIONS}
      />

      {/* COMFY ROUND (CP2, item 3) — "SEED DISCIPLINE": mono value + lock +
          dice, right above the run action it governs. */}
      <FieldLabel>Seed</FieldLabel>
      <div className="cw-seed-row">
        <input
          type="text"
          inputMode="numeric"
          className="cw-input cw-seed-input nodrag nopan"
          value={seed}
          onChange={(e) => setSeedFromInput(e.target.value)}
          aria-label="Seed"
        />
        <button
          type="button"
          className="cw-seed-btn nodrag nopan"
          aria-label={seedLocked ? 'Unlock seed' : 'Lock seed'}
          aria-pressed={seedLocked}
          title={seedLocked ? 'Locked — reruns reproduce this exact set' : 'Unlocked — reruns get a fresh set'}
          onClick={toggleLock}
        >
          {seedLocked ? <LockSimple weight="fill" size={13} /> : <LockSimpleOpen weight="regular" size={13} />}
        </button>
        <button
          type="button"
          className="cw-seed-btn nodrag nopan"
          aria-label="Randomize seed"
          title="Randomize seed"
          onClick={rollDice}
        >
          <DiceFive weight="regular" size={13} />
        </button>
      </div>

      <button
        type="button"
        className="cw-generate-run-btn nodrag nopan"
        onClick={runModel}
        disabled={busy || outOfRuns}
        title={outOfRuns ? 'Out of runs — refresh the demo' : undefined}
      >
        <Play weight="fill" size={12} />
        {/* DESIGN BAR — "state changes animate the delta, nothing pops":
            keyed on the label text so the idle<->busy swap remounts and
            replays nodes.css's cw-label-swap-in (the SAME reusable slide-in
            RunStamp already uses under a different class name — see that
            rule's own comment for why this file keeps its own class rather
            than reaching into app.css's original). */}
        <span key={busy ? 'running' : 'idle'} className="cw-label-swap-in">
          {busy ? 'Running…' : 'Run Model'}
        </span>
      </button>

      {/* THE REVEAL — the node's OWN develop tray, now the SAME ArtifactStage
          shell OutputNode.jsx's own Graphic frame uses (that file's own
          header comment: "one component, not two"), fed run/posters.jsx's
          brand pack instead of run/artifacts.jsx's general set. `key` on the
          seed still forces a fresh mount of the ART ITSELF (and so a fresh
          1.6s develop) on every run — `output` never goes back to null
          between runs the way a full workflow run resets Output nodes, so
          without the key neither the develop blur-in nor the accent scan
          would ever replay on a second Run Model click. ArtifactStage's own
          arrival settle needs no such key — it's driven by the `delivered`
          prop's actual value transitioning, which genuinely cycles
          running->done on every run regardless (state.jsx's onRunGenerate),
          so it replays correctly on repeat runs with zero remount. */}
      <Reveal open={!!output}>
        <ArtifactStage
          format="Graphic"
          delivered={done}
          aspect={POSTER_ASPECT}
          metaRight={
            <>
              <StageAction icon={Eye} label="View" onClick={() => setPreviewOpen(true)} />
              <StageAction icon={DownloadSimple} label="Download" onClick={handleDownload} />
            </>
          }
        >
          {/* FINAL QUEUE — FQ-A "REAL ADAPTERS". `output.imageUrl` only ever
              appears with `?real=1` on a dev server AND a successful
              pollinations fetch (src/run/engine.js's 'generate' case) —
              REAL_MODE off, a failed/timed-out fetch, or any production
              build all leave it undefined, rendering the exact same seeded
              Poster as before this phase. */}
          {output?.imageUrl ? (
            <img key={output?.seed ?? 0} src={output.imageUrl} alt="" className="cw-artifact-art cw-artifact-art--photo" />
          ) : (
            // WAVE 3 — THE VERB EXPANSION. `colorwaySeed` is the ONLY new
            // prop here — everything else about this frame (layout,
            // headline, jitter, the develop/scan chrome) still comes off
            // this card's OWN `output.seed`, untouched. See run/posters.jsx's
            // own Poster component comment for exactly which draw this
            // overrides.
            <Poster key={output?.seed ?? 0} seed={output?.seed ?? 0} colorwaySeed={styleSeed} className="cw-artifact-art" />
          )}
          <span key={`scan-${output?.seed ?? 0}`} className="cw-artifact-scan" aria-hidden="true" />
        </ArtifactStage>
        {/* Small honest signal that the lock is live (DESIGN BAR item 2 —
            "kind color as small honest signals, never floods") — a one-line
            mono caption, same voice as OutputNode's own cw-version-readout,
            so the real effect above isn't silent. Left exactly where it was
            (a plain sibling caption, not folded into the stage's own meta
            row) — this is a WAVE 3 feature outside THE REVEAL's own scope,
            and it reads regardless of develop/delivered state, unlike the
            stage's meta row which only ever shows once delivered. */}
        {styleSeed != null ? (
          <div className="cw-version-readout" style={{ marginTop: 6 }}>
            COLORWAY LOCKED · STYLE
          </div>
        ) : null}
      </Reveal>

      <InHandle nodeId={id} />
      <OutHandle nodeId={id} />

      <RunPreview
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        format="Graphic"
        content=""
        seed={output?.seed ?? 0}
        poster
        nodeId={id}
        seq={data.seq}
        imageUrl={output?.imageUrl}
        imageMime={output?.imageMime}
      />
    </div>
  );
}

export default memo(GenerateNode);
