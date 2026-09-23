// Seam C — Nodes
// WAVE 2 — THE VERB EXPANSION (PLAN.md master contract, "### WAVE 2 —
// SOURCES & SIGNALS (Source, Audience, Measure)").
//
// Architecture call (asked for explicitly in this wave's dispatch — stated
// here AND in the executor report): Source, Audience, and Measure ship as
// three KINDS of ONE node type ('signal'), not three separate files/types —
// same economy LogicNode.jsx already banked for Gather/A-B Split (WAVE 1),
// which is precedent for exactly this call: Gather (many-in, a LIVE run
// readout) and if/switch (1-in, static branch rows, zero configurable
// fields) already sit under one `logic` type with genuinely different
// anatomies, differentiated by a `kind` switch in the body + handles. The
// master's own "Color discipline" bullet also treats Source/Audience/
// Measure/Style-Reference as ONE family sharing ONE new token
// (--cw-kind-signal) — "things that feed the flow truth" — which is the
// same framing that keeps Gather/Split inside `logic`'s "one purple family"
// rather than minting new kind colors.
//
// The one genuine wrinkle Logic's kinds never had: Source/Audience render
// NO target handle at all (0-in, out-only — the same "value carrier" shape
// as ParamsNode.jsx) while Measure renders BOTH (1-in, 1-out, a real run
// participant with a seeded reading). Every place in this app that used to
// key a rule off a flat `node.type` Set (the 'unused' vs 'disconnected'
// issue split, skip-eligibility, the starter-node list) can't do that for
// THIS type anymore — those call sites (state.jsx, run/engine.js,
// nodes/shared.jsx) now branch on `data.kind !== 'measure'` alongside the
// old type-level check, same `kind`-aware idiom PORT_DESCRIBERS/
// findPaletteItem already use for logic/output. Every render-time anatomy
// choice (ports, body fields, numbering eligibility, echo-ability) below is
// therefore driven by `data.kind`, never a second node type.

import { memo } from 'react';
import { useReactFlow } from '@xyflow/react';
import { Database, UsersThree, Target, Minus, Plus, X, Swatches, DiceFive } from '@phosphor-icons/react';
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
  QuietRow,
  // WAVE 3 — THE VERB EXPANSION. Style Reference's own "image-input chips
  // (reuse Generate's)" (master contract) — the roster + row/chip pair
  // GenerateNode.jsx used to own alone, now shared via shared.jsx (see that
  // file's own header comment on the move).
  IMG_INPUT_FORMATS,
  ImageInputRow,
} from './shared.jsx';
import ComboBox from './ComboBox.jsx';
import Reveal from './Reveal.jsx';
// WAVE 3 — THE VERB EXPANSION. `colorwayForSeed` is the SAME pure step
// run/posters.jsx's own Poster component uses to actually LOCK a receiving
// Generate's colorway (GenerateNode.jsx) — reading it here too is what lets
// this card's "3 mini swatches derived from its seed" (master contract)
// preview the EXACT colorway a locked Generate downstream will paint,
// without the two ever sharing state.
import { colorwayForSeed } from '../run/posters.jsx';
import { nextImageInputName, DEFAULT_GENERATE_SEED } from '../data/models.js';

const SIGNAL_META = {
  source: { icon: Database, title: 'Source' },
  audience: { icon: UsersThree, title: 'Audience' },
  measure: { icon: Target, title: 'Measure' },
  // WAVE 3 — THE VERB EXPANSION. "eyebrow STYLE" (master contract) — plain
  // short-form, unlike the card's own headline-case TITLE ("Style
  // Reference"); every other kind's eyebrow is just its bare `title` (see
  // `eyebrowKind` below), so this is the one kind that needs its own
  // override rather than reusing `title` verbatim.
  style: { icon: Swatches, title: 'Style Reference', eyebrow: 'Style' },
};

/* ---------------------------------------------------------------------- */
/* SOURCE — "kind ComboBox — Brief / Asset folder / Sheet / Trend feed /   */
/* Meeting notes — each with a mono ref chip... editable" (master).        */
/* `ref` values here are the exact plausible examples the master spec       */
/* names verbatim per kind; run/engine.js's own SOURCE_KIND_INGEST map      */
/* must stay keyed on these SAME `value` strings (duplicated there with a  */
/* pointer comment — engine.js is another read of this same taxonomy,      */
/* never an import, matching this codebase's established small-table       */
/* duplication convention, e.g. shared.jsx's own SKIP_DISABLED_TYPES vs.    */
/* engine.js's SKIPPABLE_TYPES).                                           */
/* ---------------------------------------------------------------------- */
const SOURCE_KIND_OPTIONS = [
  { value: 'brief', label: 'Brief', ref: 'Q4_brief.pdf' },
  { value: 'asset-folder', label: 'Asset folder', ref: '/assets/fall-lineup' },
  { value: 'sheet', label: 'Sheet', ref: 'GS:media-plan' },
  { value: 'trend-feed', label: 'Trend feed', ref: 'trends:coffee-culture' },
  { value: 'meeting-notes', label: 'Meeting notes', ref: 'notes:2026-08-12' },
];
const SOURCE_KIND_BY_VALUE = Object.fromEntries(SOURCE_KIND_OPTIONS.map((o) => [o.value, o]));
const SOURCE_COMBO_OPTIONS = SOURCE_KIND_OPTIONS.map(({ value, label }) => ({ value, label }));

function SourceBody({ id, data, updateNodeData }) {
  const sourceKind = data.sourceKind || 'brief';
  const ref = data.ref ?? SOURCE_KIND_BY_VALUE[sourceKind]?.ref ?? '';

  // Swap the ref chip to the NEW kind's own plausible example — but only
  // when the field still holds the PREVIOUS kind's default (or is empty).
  // A user who already typed their own reference keeps it across a kind
  // change; only an untouched field follows the combo, so switching kinds
  // never silently discards a real edit.
  function setSourceKind(v) {
    const prevDefault = SOURCE_KIND_BY_VALUE[sourceKind]?.ref;
    const patch = { sourceKind: v };
    if (!ref || ref === prevDefault) patch.ref = SOURCE_KIND_BY_VALUE[v]?.ref ?? '';
    updateNodeData(id, patch);
  }

  return (
    <>
      <FieldLabel>Kind</FieldLabel>
      <ComboBox
        value={sourceKind}
        options={SOURCE_COMBO_OPTIONS}
        placeholder="Select a source kind..."
        onChange={setSourceKind}
        ariaLabel="Source kind"
      />
      <FieldLabel>Reference</FieldLabel>
      <input
        type="text"
        className="cw-input cw-ref-chip nodrag nopan"
        placeholder={SOURCE_KIND_BY_VALUE[sourceKind]?.ref}
        value={ref}
        onChange={(e) => updateNodeData(id, { ref: e.target.value })}
        aria-label="Source reference"
        spellCheck={false}
      />
    </>
  );
}

/* ---------------------------------------------------------------------- */
/* AUDIENCE — "segment chips editor (add/remove, ×; defaults 'Urban        */
/* commuters 25-34', 'Weekend brunchers')" (master). Free-text add (Enter   */
/* commits), inline pill remove — the closest existing shapes are          */
/* shared.jsx's OptionsEditor (label+× rows, but full-width STACKED rows,   */
/* not inline wrapping pills) and ParamsNode's MarketChips (inline pills,   */
/* but a fixed TOGGLE preset, never free-text add/remove) — neither is a    */
/* drop-in fit for a free-text, wrapping, removable pill list, so this is   */
/* a small new local control rather than a forced reuse of either.          */
/* ---------------------------------------------------------------------- */
function genSegmentId() {
  return `seg${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
}

function AudienceBody({ id, data, updateNodeData }) {
  const segments = data.segments || [];

  function addSegment(rawLabel) {
    const label = rawLabel.trim();
    if (!label) return '';
    updateNodeData(id, { segments: [...segments, { id: genSegmentId(), label }] });
    return '';
  }
  function removeSegment(segId) {
    updateNodeData(id, { segments: segments.filter((s) => s.id !== segId) });
  }

  return (
    <>
      <FieldLabel>Segments</FieldLabel>
      {segments.length ? (
        <div className="cw-segment-chip-row">
          {segments.map((s) => (
            <span key={s.id} className="cw-segment-chip">
              {s.label}
              <button
                type="button"
                className="cw-segment-chip-remove nodrag nopan"
                aria-label={`Remove ${s.label}`}
                onClick={() => removeSegment(s.id)}
              >
                <X weight="bold" size={9} />
              </button>
            </span>
          ))}
        </div>
      ) : null}
      <input
        type="text"
        className="cw-input nodrag nopan"
        placeholder="Add a segment..."
        onKeyDown={(e) => {
          if (e.key !== 'Enter') return;
          e.preventDefault();
          e.currentTarget.value = addSegment(e.currentTarget.value);
        }}
      />
    </>
  );
}

/* ---------------------------------------------------------------------- */
/* MEASURE — "KPI ComboBox (CTR, CPM, Spend pace, Engagement), target       */
/* field, window chip (7 days). In + out ports" (master). `target` default  */
/* text follows the SAME "swap only if untouched" rule as Source's ref      */
/* above; run/engine.js parses this SAME string back out at beat time (a $  */
/* sign -> dollar formatting, a ≤ -> "lower is better" direction) so the    */
/* card's own field IS the engine's only input — no second config surface.  */
/* Window reuses ParamsNode.jsx's own budget-row stepper classes verbatim   */
/* (same "reuse, don't invent" call LogicNode.jsx's SplitBody already made  */
/* for an unrelated numeric stepper) rather than a new control shape.       */
/* ---------------------------------------------------------------------- */
const MEASURE_KPI_OPTIONS = [
  { value: 'CTR', label: 'CTR', target: '≥ 1.2%' },
  { value: 'CPM', label: 'CPM', target: '≤ $18.00' },
  { value: 'Spend pace', label: 'Spend pace', target: '≥ 90%' },
  { value: 'Engagement', label: 'Engagement', target: '≥ 4.5%' },
];
const MEASURE_KPI_BY_VALUE = Object.fromEntries(MEASURE_KPI_OPTIONS.map((o) => [o.value, o]));
const MEASURE_KPI_COMBO_OPTIONS = MEASURE_KPI_OPTIONS.map(({ value, label }) => ({ value, label }));

const WINDOW_MIN_DAYS = 1;
const WINDOW_MAX_DAYS = 90;

function MeasureBody({ id, data, updateNodeData }) {
  const kpi = data.kpi || 'CTR';
  const target = data.target ?? MEASURE_KPI_BY_VALUE[kpi]?.target ?? '';
  const windowDays = data.windowDays ?? 7;

  function setKpi(v) {
    const prevDefault = MEASURE_KPI_BY_VALUE[kpi]?.target;
    const patch = { kpi: v };
    if (!target || target === prevDefault) patch.target = MEASURE_KPI_BY_VALUE[v]?.target ?? '';
    updateNodeData(id, patch);
  }
  function stepWindow(delta) {
    const next = Math.max(WINDOW_MIN_DAYS, Math.min(WINDOW_MAX_DAYS, windowDays + delta));
    updateNodeData(id, { windowDays: next });
  }

  return (
    <>
      <FieldLabel>KPI</FieldLabel>
      <ComboBox
        value={kpi}
        options={MEASURE_KPI_COMBO_OPTIONS}
        placeholder="Select a KPI..."
        onChange={setKpi}
        ariaLabel="KPI"
      />
      <FieldLabel>Target</FieldLabel>
      <input
        type="text"
        className="cw-input nodrag nopan"
        placeholder={MEASURE_KPI_BY_VALUE[kpi]?.target}
        value={target}
        onChange={(e) => updateNodeData(id, { target: e.target.value })}
        aria-label="Target"
      />
      <FieldLabel>Window</FieldLabel>
      <div className="cw-budget-row">
        <button
          type="button"
          className="cw-budget-btn nodrag nopan"
          aria-label="Decrease window"
          disabled={windowDays <= WINDOW_MIN_DAYS}
          onClick={() => stepWindow(-1)}
        >
          <Minus weight="bold" size={11} />
        </button>
        <span className="cw-budget-value">{`${windowDays} day${windowDays === 1 ? '' : 's'}`}</span>
        <button
          type="button"
          className="cw-budget-btn nodrag nopan"
          aria-label="Increase window"
          disabled={windowDays >= WINDOW_MAX_DAYS}
          onClick={() => stepWindow(1)}
        >
          <Plus weight="bold" size={11} />
        </button>
      </div>
    </>
  );
}

/* ---------------------------------------------------------------------- */
/* STYLE REFERENCE — "image-input chips (reuse Generate's), 3 mini swatches  */
/* derived from its seed, out port" (master). Seed governs the SAME          */
/* colorway pick run/posters.jsx's Poster component draws for itself (see    */
/* colorwayForSeed's own header comment) — no lock button here (unlike       */
/* Generate's SEED DISCIPLINE padlock): nothing auto-advances this seed on   */
/* a run the way Generate's own does, only an explicit edit or the dice      */
/* below ever changes it, so there's nothing to "lock" against.              */
/* ---------------------------------------------------------------------- */
function StyleBody({ id, data, updateNodeData }) {
  const imageInputs = data.imageInputs || [];
  const seed = data.seed ?? DEFAULT_GENERATE_SEED;
  const cw = colorwayForSeed(seed);

  function addImageInput() {
    const idx = imageInputs.length;
    const item = {
      id: `img${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
      name: nextImageInputName(idx),
      format: IMG_INPUT_FORMATS[idx % IMG_INPUT_FORMATS.length],
      // Deterministic (no Math.random) — same spirit as GenerateNode.jsx's
      // own identical decorative-chip seeding.
      seed: idx * 137 + 7,
    };
    updateNodeData(id, { imageInputs: [...imageInputs, item] });
  }
  function removeImageInput(itemId) {
    updateNodeData(id, { imageInputs: imageInputs.filter((i) => i.id !== itemId) });
  }
  function setSeedFromInput(raw) {
    const digitsOnly = raw.replace(/[^0-9]/g, '');
    updateNodeData(id, { seed: digitsOnly === '' ? 0 : Number(digitsOnly) });
  }
  function rollDice() {
    updateNodeData(id, { seed: seed + 1 });
  }

  return (
    <>
      <FieldLabel>Reference images</FieldLabel>
      <Reveal open={imageInputs.length > 0}>
        <ImageInputRow imageInputs={imageInputs} onRemove={removeImageInput} />
      </Reveal>
      <QuietRow icon={Plus} onClick={addImageInput}>
        Add image input
      </QuietRow>

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
          aria-label="Randomize seed"
          title="Randomize seed"
          onClick={rollDice}
        >
          <DiceFive weight="regular" size={13} />
        </button>
      </div>

      {/* "3 mini swatches derived from its seed" (master) — the SAME
          colorway a receiving Generate's poster LOCKS to (colorwayForSeed),
          previewed here so the effect is legible before it's even wired. */}
      <FieldLabel>Colorway</FieldLabel>
      <div className="cw-style-swatch-row" aria-hidden="true">
        <span className="cw-style-swatch" style={{ '--swatch-color': cw.bg }} title="Background" />
        <span className="cw-style-swatch" style={{ '--swatch-color': cw.accent }} title="Accent" />
        <span className="cw-style-swatch" style={{ '--swatch-color': cw.headlineInk }} title="Headline ink" />
      </div>
    </>
  );
}

function SignalNode({ id, data = {}, selected }) {
  const { updateNodeData } = useReactFlow();
  const kind = data.kind || 'source';
  const meta = SIGNAL_META[kind] || SIGNAL_META.source;
  const Icon = meta.icon;
  // RUN PHASE (R2 item 1) — see TriggerNode.jsx for the idle/'idle' note.
  const runState = data.runState && data.runState !== 'idle' ? data.runState : undefined;
  // RUN SHOW B4 — see shared.jsx useRunFinale.
  const finale = useRunFinale(data.runState, data.seq);

  // "eyebrow SOURCE · <KIND>" (master, Source only) — Audience/Measure's own
  // eyebrows stay the plain kind title, matching every other single-word
  // eyebrow in this app (Params, Trigger, ...). WAVE 3 — Style Reference
  // joins that same "plain" family via its own SHORTER `meta.eyebrow`
  // override ("Style", not the card title's headline-case "Style
  // Reference") rather than a third special case here.
  const eyebrowKind =
    kind === 'source' ? `Source · ${SOURCE_KIND_BY_VALUE[data.sourceKind || 'brief']?.label || 'Brief'}` : meta.eyebrow || meta.title;

  // "stamp reflects (DONE ✓ / amber note)" (master) — a PASS is the totally
  // ordinary 'done' stamp (no override at all); only a MISS gets a label/
  // tone override. `!data.skipped` matters: the generic Skip bypass
  // (run/engine.js) sets runState:'done' without touching a stale
  // data.measurePass from a PRIOR real run, so without this guard a
  // just-skipped Measure could flash last run's verdict instead of the
  // plain neutral "skipped-through" DONE every other skippable type shows.
  const isMiss = kind === 'measure' && data.runState === 'done' && !data.skipped && data.measurePass === false;

  return (
    // MOTION PHASE (M2 item 1) — see TriggerNode.jsx for the --cw-seq note.
    <div
      className={`cw-node cw-node--signal${selected ? ' is-selected' : ''}${finale ? ' cw-node--finale' : ''}`}
      style={{ '--cw-seq': data.seq }}
      data-run-state={runState}
    >
      <NodeActionsToolbar nodeId={id} />
      <RunCornerTicks />
      <div className="cw-card-head">
        <CardEyebrow icon={Icon} number={data.number} kind={eyebrowKind} />
        <RunStamp runState={data.runState} label={isMiss ? 'UNDER' : undefined} tone={isMiss ? 'warn' : undefined} />
        <div className="cw-card-title-row">
          <span className="cw-title">{meta.title}</span>
        </div>
      </div>

      {kind === 'source' && <SourceBody id={id} data={data} updateNodeData={updateNodeData} />}
      {kind === 'audience' && <AudienceBody id={id} data={data} updateNodeData={updateNodeData} />}
      {kind === 'measure' && <MeasureBody id={id} data={data} updateNodeData={updateNodeData} />}
      {kind === 'style' && <StyleBody id={id} data={data} updateNodeData={updateNodeData} />}

      {/* Ingest line / audience summary / measure reading — every kind's own
          engine beat writes data.output.content the same shape task/output
          already do, so one GenerationBox covers all three. */}
      {data.runState === 'done' && data.output?.content ? <GenerationBox content={data.output.content} /> : null}

      {/* Only Measure has a target handle — Source/Audience are pure value
          sources, same 0-in shape as ParamsNode.jsx (no InHandle call at
          all, not a hidden/disabled one). */}
      {kind === 'measure' && <InHandle nodeId={id} />}
      <OutHandle nodeId={id} />
    </div>
  );
}

export default memo(SignalNode);
