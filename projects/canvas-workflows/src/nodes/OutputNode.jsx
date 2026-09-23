// Seam C — Nodes

import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useReactFlow, useUpdateNodeInternals } from '@xyflow/react';
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
  Paperclip,
} from '@phosphor-icons/react';
import {
  CardEyebrow,
  FieldLabel,
  GenerationBox,
  NodeActionsToolbar,
  RunStamp,
  RunCornerTicks,
  useRunFinale,
  QuietRow,
  InHandle,
  OutHandle,
} from './shared.jsx';
import Reveal from './Reveal.jsx';
// HANDED OFF (PLAN.md "## HANDED OFF") — the on-card VersionStepper import
// retired along with the meta row it drove (RunPreview.jsx still exports
// it — ResultsNode.jsx's own matrix section header uses it verbatim, per
// that file's own import). RunPreview itself (the lightbox) stays: the
// Results Sheet's plain-row click bridge (state.jsx openDeliverable ->
// `cw:open-artifact`) still opens THIS card's own instance below — see the
// listener further down this file for why that stays load-bearing.
import RunPreview from '../components/RunPreview.jsx';
// RESULTS SHEET (PLAN.md "## RESULTS SHEET — the frame springs from the
// output node") — `resultsAnchorId` (which card, if any, is the terminal
// delivered output) comes straight off context; `useResultsSheetMeta`/
// `ResultsSheetBody` (ResultsNode.jsx, retired as a node component this
// phase) supply the sheet's own width metadata + rendered content. See
// this file's own `isResultsAnchor`/`resultsSheetMounted` below for how
// they're used.
import { useFlowState } from '../state.jsx';
import { ResultsSheetBody, useResultsSheetMeta } from './ResultsNode.jsx';
// ANDREW ROUND — C3 "the develop tray" (PLAN.md "### C — THE DARKROOM").
import Artifact, { artifactAspect, artifactRatio, isTextFormat } from '../run/artifacts.jsx';
// VARIANT STUDIO — state.jsx's cw:mint-output listener stamps a freshly
// minted Output(Graphic) node's `data.output.poster = true` so "-> Output...
// mints a wired Output(Graphic) node carrying that artifact" (PLAN.md part 2)
// is literally true: without this, the mint would carry only the seed and
// this card would still paint a DIFFERENT (run/artifacts.jsx) picture than
// the RIDGELINE ROAST poster the variant card actually showed. Every
// pre-existing Output node (every format, every sample/demo/template) never
// sets this flag, so the branch below is a no-op for all of them.
import Poster, { POSTER_ASPECT, POSTER_RATIO } from '../run/posters.jsx';
// DELIVERABLE DOWNLOADS' on-card download chip retired with HANDED OFF (the
// card's own View/Download actions are gone; downloads now happen only in
// the results sheet's own rows/tiles, run/download.js's other callers) — no
// import needed here anymore.

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

// THE REVEAL (PLAN.md "## THE REVEAL — the deliverable becomes the point of
// the card") — "the arrival settle fires... only on the developing->done
// transition, never on re-render (guard it like the finale roll-call does)."
// shared.jsx's useRunFinale gets that guarantee off a GLOBAL cw:run-complete
// event (dispatched once per whole-graph run finishing naturally); that
// event never fires for a Generate card's own standalone "Run Model" beat
// (state.jsx's onRunGenerate completes without the graph ever running at
// all), so this takes the other half of that hook's own idea instead — a
// fresh comparison against the PREVIOUS render's value, at the exact moment
// it changes — as a small local ref rather than a global event. Same
// guarantees either way: mounting already-delivered (a pre-seeded demo node,
// a minted variant born with runState:'done') never fires it, browsing old
// versions never fires it (done never actually changes), and a genuine
// re-run replays it every time (engine.js always cycles every node through
// queued/running before done, even a re-run of an already-done card — see
// this file's own header-comment research). No reduced-motion branch here
// either, matching useRunFinale's own reasoning verbatim: nodes.css's media
// block neutralizes the settle/sweep/meta-in keyframes directly, so nothing
// here needs to know which mode it's in.
function useArrivalSettle(delivered) {
  const [justArrived, setJustArrived] = useState(false);
  const wasDeliveredRef = useRef(delivered);
  useEffect(() => {
    const was = wasDeliveredRef.current;
    wasDeliveredRef.current = delivered;
    if (delivered && !was) {
      setJustArrived(true);
      const t = setTimeout(() => setJustArrived(false), 640);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [delivered]);
  return justArrived;
}

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

// RESULTS SHEET — the satellite's own mount/enter/exit presence. Duplicated
// locally from HumanNode.jsx's own `useSheetPresence` idiom rather than
// imported or shared — that file is this phase's own HARD OFF-LIMITS
// ("never refactor or share-by-editing the chat sheet's own code"; PLAN.md
// file grant). Same reasoning verbatim: `.cw-results-sheet` is already
// fully self-sized by CSS (width/height, no unknown-height problem the way
// a normal-flow Reveal row has), so a plain opacity+transform transition
// covers the "spring open" beat — this hook only tracks WHEN to mount/
// unmount it, staying mounted through the whole close transition
// (approve/dismiss/run-stop equivalents here: Clear, or a different node
// overtaking as the terminal anchor) so the exit actually gets to play,
// same "stay mounted through the whole close, unmount only once it's
// actually finished" discipline Reveal.jsx's own handle-clip fix
// established first.
function useResultsSheetPresence(open) {
  const [mounted, setMounted] = useState(open);
  const [entered, setEntered] = useState(false);
  const mountedRef = useRef(open);
  useEffect(() => {
    if (open) {
      mountedRef.current = true;
      setMounted(true);
      const raf = requestAnimationFrame(() => setEntered(true));
      return () => cancelAnimationFrame(raf);
    }
    setEntered(false);
    if (!mountedRef.current) return undefined;
    if (prefersReducedMotion()) {
      mountedRef.current = false;
      setMounted(false);
      return undefined;
    }
    // Matches .cw-results-sheet's own transform/opacity transition duration
    // (nodes.css, --cw-d-3 ≈ 420ms) — belt-and-braces fallback timer, no
    // transitionend listener to race, same as HumanNode.jsx's own mirrored
    // hook.
    const t = setTimeout(() => {
      mountedRef.current = false;
      setMounted(false);
    }, 420);
    return () => clearTimeout(t);
  }, [open]);
  return { mounted, entered };
}

// BATCH MATRIX's own `parseAspectRatio` (the batch asset's engine-stated
// "W / H" parse) retired with HANDED OFF — the on-card firstAsset+×N stage
// it fed is gone; the full matrix (with its own per-asset ratios) lives
// entirely in the results sheet now (ResultsNode.jsx).

// FIT + VERSION STEPPER, part A — "React Flow must re-measure after the
// width changes (updateNodeInternals on delivery — the app's existing heal
// pattern) so handles/edges stay pinned." Mirrors Reveal.jsx's own heal
// idiom verbatim (a transitionend listener plus a reduced-motion-aware
// fallback timer, in case the transition never fires or this browser skips
// it) — but keyed to THIS card's own root `width` transition (nodes.css's
// `.cw-node--stage-sized` swap) instead of a Reveal row's `grid-template-
// rows` one. The two are genuinely independent: Reveal's own heal already
// fires off the SAME hasArtifact/output flip (since that's what opens the
// ArtifactStage's Reveal in the same render), but it only listens on ITS
// OWN row element for ITS OWN property — it has no way to also catch a
// resize on this outer card element, a different node in the tree entirely.
// Exported so GenerateNode.jsx shares this instead of forking a second copy
// (same "one component/hook, not two" reasoning ArtifactStage's own header
// comment gives).
export function useStageWidthHeal(id, active) {
  const updateNodeInternals = useUpdateNodeInternals();
  const cardRef = useRef(null);
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return undefined;
    // Reduced motion: nodes.css still transitions `width` (a plain state
    // change, not an ambient/entrance motion — same category as every other
    // hover/focus transition this file already leaves un-guarded), so
    // transitionend keeps firing normally; this fallback only matters if a
    // browser coalesces the transition into a no-op (width already at its
    // target) and the event never fires at all.
    function heal() {
      updateNodeInternals(id);
    }
    function onTransitionEnd(e) {
      if (e.target !== el || e.propertyName !== 'width') return;
      clearTimeout(fallback);
      heal();
    }
    el.addEventListener('transitionend', onTransitionEnd);
    const fallback = setTimeout(heal, prefersReducedMotion() ? 0 : 400);
    return () => {
      el.removeEventListener('transitionend', onTransitionEnd);
      clearTimeout(fallback);
    };
    // `active` is the trigger this effect re-arms for (hasArtifact/!!output
    // flipping is what changes the width in the first place) — not read
    // inside, just what makes a fresh heal cycle run on every transition.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, active, updateNodeInternals]);
  return cardRef;
}

// THE REVEAL — meta row action (move 4: "actions right as icon+label
// buttons... with real hover states — not the current quiet-row
// afterthought"). `nodrag nopan` — same reasoning every interactive card
// control in this app gives (mounts inside a draggable node card).
export function StageAction({ icon: Icon, label, onClick }) {
  return (
    <button type="button" className="cw-stage-action nodrag nopan" onClick={onClick}>
      <Icon weight="regular" size={13} />
      <span>{label}</span>
    </button>
  );
}

// (The on-card VersionChip/VersionStepper meta row retired with HANDED OFF
// — see this file's own DeliveredLine, further down, for its replacement.)

// THE REVEAL — the shared presentation shell itself (non-negotiable: "same
// treatment for Generate's own preview and Output's artifact — one
// component, not two"). Exported so GenerateNode.jsx composes the IDENTICAL
// banner/frame/arrival/meta-row chrome around its own poster preview, rather
// than forking a second copy. Deliberately NOT a rework of the existing
// .cw-artifact-frame/.cw-artifact-sheet rules themselves — RemixNode.jsx
// renders those same two classes verbatim for its own develop tray (a WAVE 3
// node outside this dispatch's seam, confirmed by grep before touching
// anything), so this composes a second, uniquely-named `.cw-stage-*` layer
// around whatever art the caller hands it instead of repainting shared
// classes out from under a card this dispatch can't also update. The develop
// blur-in / scan sweep themselves stay exactly what they always were — pure
// CSS, "mounting is the trigger," untouched (non-negotiable: "the darkroom
// develop animation is untouched — this is what happens AFTER it") — this
// only wraps a bigger, floated stage around wherever that art already lives,
// plus the one-shot arrival settle on top once `delivered` flips true.
export function ArtifactStage({ format, delivered, sheet, aspect, children, metaLeft, metaCenter, metaRight }) {
  const justArrived = useArrivalSettle(delivered);
  const bannerLabel = delivered ? `Delivered · ${format}` : 'Generated';
  const hasMeta = delivered && (metaLeft || metaCenter || metaRight);
  return (
    <div className="cw-stage">
      {/* Move 2 — "GENERATED -> a mono micro-eyebrow ABOVE the frame reading
          'DELIVERED · <FORMAT>'... with a hairline rule running from the
          label to the card edge." Keyed on the label text so the
          developing->delivered swap replays the SAME slide-in every other
          label transition in this app already uses (RunStamp/Run Model's own
          button label — DESIGN BAR "reuse, don't invent"). */}
      <div className={`cw-stage-banner${delivered ? ' is-delivered' : ''}`}>
        <span key={bannerLabel} className="cw-stage-banner-text cw-label-swap-in">
          {bannerLabel}
        </span>
        <span className="cw-stage-banner-rule" aria-hidden="true" />
      </div>
      {/* Move 1 — full-bleed, taller, shadow-floated frame. Move 3 — the
          arrival settle (scale 0.96->1 spring + a top-edge sweep), gated
          entirely on `justArrived` so it plays exactly once per delivery. */}
      <div
        className={`cw-stage-frame${sheet ? ' cw-stage-frame--sheet' : ''}${justArrived ? ' cw-stage-arrive' : ''}`}
        style={sheet ? undefined : { aspectRatio: aspect }}
      >
        {children}
        {justArrived ? <span className="cw-stage-sweep" aria-hidden="true" /> : null}
      </div>
      {/* Move 4 — version chip left / pager centered / actions right, ONE
          row. Fades up 80ms behind the settle (animation-delay, CSS) — only
          while `justArrived` (an already-settled card keeps this row at its
          plain, fully-visible resting state, no replay on re-render). */}
      {hasMeta ? (
        <div className={`cw-stage-meta${justArrived ? ' cw-stage-meta--in' : ''}`}>
          <div className="cw-stage-meta-left">{metaLeft}</div>
          <div className="cw-stage-meta-center">{metaCenter}</div>
          <div className="cw-stage-meta-right">{metaRight}</div>
        </div>
      ) : null}
    </div>
  );
}

// HANDED OFF (PLAN.md "## HANDED OFF — output cards never hold the
// deliverable") — "Post-delivery the card shows its spec fields + the DONE
// stamp + ONE quiet delivered line, banner-family, kind-colored."
// Deliberately reuses THE REVEAL's own banner language
// (`.cw-stage-banner-text`'s mono/uppercase/kind-tint, `.cw-stage-banner-
// rule`'s hairline-to-edge) rather than inventing a new label style — see
// nodes.css's own `.cw-delivered-line*` rules, styled directly off that
// same family (DESIGN BAR "reuse, don't invent").
// QUIET DELIVERED (Bryan: "i dont think this needs to be a button, and we
// can get rid of the text – IN RESULTS with arrow") — a plain static status
// line now: dot + DELIVERED + hairline, no click, no glide, no arrow.
function DeliveredLine() {
  return (
    <div className="cw-delivered-line">
      <span className="cw-delivered-line-dot" aria-hidden="true" />
      <span className="cw-delivered-line-text">Delivered</span>
      <span className="cw-delivered-line-rule" aria-hidden="true" />
    </div>
  );
}

function OutputNode({ id, data = {}, selected }) {
  const [instructionsOpen, setInstructionsOpen] = useState(() => !!data.outputInstructions);
  const { updateNodeData } = useReactFlow();
  const format = data.format || 'Text';
  const description = data.description || '';
  const Icon = FORMAT_ICONS[format] || TextT;

  // RESULTS SHEET — "the results sheet mounts from the TERMINAL DELIVERED
  // output node." `resultsAnchorId` is computed ONCE in state.jsx (off
  // `deliveryOrder`, sticky across a re-run — see that value's own header
  // comment for why) and simply compared to this card's own `id` here —
  // every Output card runs this same cheap check, only the one match ever
  // mounts the sheet below. `useResultsSheetMeta()` is called unconditionally
  // too (Rules of Hooks) so the wrapper's width class is ready the instant
  // this card BECOMES the anchor, with no extra render lag.
  // (HANDED OFF's clickable glide via `focusIssue` retired with QUIET
  // DELIVERED — the line is a static status now; the anchor id itself is
  // still what decides which card mounts the sheet below.)
  const { resultsAnchorId } = useFlowState();
  const isResultsAnchor = resultsAnchorId === id;
  const resultsMeta = useResultsSheetMeta();
  const { mounted: resultsSheetMounted, entered: resultsSheetEntered } = useResultsSheetPresence(isResultsAnchor);

  // RUN PHASE (R2 items 1/3) — see TriggerNode.jsx for the idle/'idle' note.
  const runState = data.runState && data.runState !== 'idle' ? data.runState : undefined;
  const running = data.runState === 'running';
  const done = data.runState === 'done';
  const hasGeneration = running || !!data.output?.content;
  const [previewOpen, setPreviewOpen] = useState(false);
  // VERSION HISTORY IN THE OVERLAY — which index RunPreview should open on.
  // HANDED OFF retired the card's own on-card "View" button (the only
  // caller that used to pass a specific browsed index here), so the sole
  // remaining caller is the `cw:open-artifact` listener below — it always
  // passes an explicit versionIndex, or `null` for "latest," matching
  // state.jsx's `openDeliverable` bridge the results sheet's own rows use.
  const [previewIndex, setPreviewIndex] = useState(null);
  const openPreview = useCallback((idx) => {
    setPreviewIndex(idx);
    setPreviewOpen(true);
  }, []);
  // RUN SHOW B4 — see shared.jsx useRunFinale.
  const finale = useRunFinale(data.runState, data.seq);

  // ANDREW ROUND — C3 "the develop tray". `output` carries engine.js's C2
  // additions once a run reaches this node: `developing` (true from the
  // node's own run-beat through the moment it's done) and `seed` (stable
  // for the whole node's run, minted once per nodeId+runCount). Text-family
  // formats (Text/Email/Teams/Doc — run/artifacts.jsx's isTextFormat) keep
  // their EXISTING real-streamed-text body untouched; every other format
  // grows the bespoke SVG artifact frame instead. `hasArtifact` mirrors
  // `hasGeneration`'s own "running || content" shape but off `output` being
  // non-null at all — for artifact formats the frame should appear the
  // instant `developing:true` lands (before any text has streamed), not
  // wait for streamed content the way the plain genbox path always has.
  const output = data.output || null;
  const seed = output?.seed ?? 0;
  const textFormat = isTextFormat(format);
  const hasArtifact = !textFormat && !!output;
  // HANDED OFF (PLAN.md "## HANDED OFF") — "MID-RUN THEATER STAYS... but on
  // delivery it EXITS (Reveal close, real exit)." `isDeveloping` is the
  // develop tray's own open/closed gate: true for the exact same window
  // `hasGeneration`/`hasArtifact` already covered (running, or an artifact
  // format's `output` landing before any content has streamed), minus
  // `done` — the instant engine.js's own patch flips `runState:'done'`
  // (the SAME tick `output.developing` flips false, this file's own header
  // comment on why), the tray closes for good on THIS delivery. A card that
  // mounts already-delivered (a pre-seeded demo, `runState:'done'` from the
  // start) has `isDeveloping` false on its very first render, so Reveal
  // below never opens at all — no flash of a tray that would just have to
  // immediately close again.
  // Bryan ("dont show the output image in here first"): IMAGE-family
  // formats no longer open the develop tray at all — the artwork's debut
  // is the results sheet, full stop; mid-run the card shows only its run
  // furniture (gauge/stamp/ticks). Text formats keep their streaming body
  // (words developing are run theater; a picture appearing is the payoff,
  // and the payoff happens in Results).
  const isDeveloping = !done && textFormat && hasGeneration;
  // FIT + VERSION STEPPER, part A — see this file's own useStageWidthHeal
  // comment + nodes.css's `.cw-node--stage-sized` comment for the full
  // diagnosis/fix. Gated on `isDeveloping` (not the old, delivery-spanning
  // `hasArtifact`) — HANDED OFF: the card no longer stays stage-widened
  // once delivered, it shrinks back to its normal spec-field width the
  // instant the develop tray closes, same "heal on the transition either
  // direction" reasoning this hook already documents.
  const cardRef = useStageWidthHeal(id, isDeveloping);

  // CANVAS-NATIVE DELIVERABLES (PLAN.md "### 1 — Output versioning") — the
  // node's own on-canvas run history. HANDED OFF retired the on-card
  // version browsing UI (the stepper/meta row it drove is gone), so this is
  // now just the two reads still needed: `latestIndex` for the
  // `cw:open-artifact` listener's fallback below, and `versions` for
  // RunPreview's own multi-version pager once that modal opens. The
  // per-card `browseIndex`/lite-replay machinery this used to carry is
  // gone with it — nothing on the card itself still browses old takes.
  const versions = data.versions || [];
  const latestIndex = versions.length - 1;
  // THE REVEAL — the stage frame's own aspect-ratio style (move 1: "its true
  // aspect"). Mirrors the exact per-branch value each artifact body already
  // rendered inline before this phase (photo -> artifactAspect, VARIANT
  // STUDIO poster -> POSTER_ASPECT, everything else -> artifactAspect).
  // Unused (undefined) for text formats, which never had an aspect-ratio
  // style either. HANDED OFF: read off the LIVE `output` only now — the
  // develop tray this feeds never renders past delivery, so there is no
  // "visible browsed version" concept left to size for (BATCH MATRIX's own
  // firstAsset sizing retired with the batch stage it fed — see the render
  // below).
  const stageAspect = textFormat
    ? undefined
    : !output?.imageUrl && output?.poster
      ? POSTER_ASPECT
      : artifactAspect(format, seed);
  // FIT + VERSION STEPPER, part A — the numeric twin of stageAspect, same
  // branch shape, fed to nodes.css's `--cw-stage-ratio` (a plain calc() can't
  // parse the `"w / h"` string above) — see that rule's own header comment.
  const stageRatio = textFormat
    ? undefined
    : !output?.imageUrl && output?.poster
      ? POSTER_RATIO
      : artifactRatio(format, seed);

  // Filmstrip.jsx no longer exists (CANVAS-NATIVE DELIVERABLES deleted it —
  // the canvas itself is the record now), but RunPreview.jsx still opens
  // this way from any surface that only knows a nodeId (e.g. a future
  // cross-node jump), so the listener stays: it dispatches this event
  // instead so the node that actually owns the click-target artifact opens
  // ITS OWN RunPreview off ITS OWN live data, keeping content ownership
  // local (never duplicated into another component's state).
  // VERSION HISTORY IN THE OVERLAY — state.jsx's openDeliverable now says
  // explicitly which version it means in the SAME event detail
  // (`versionIndex: null` == "open on latest," that file's own comment);
  // `??` still covers a plain `{ nodeId }` from any other caller of this
  // same bridge that hasn't been taught the new field, falling back to
  // latest exactly as this listener always effectively meant to.
  useEffect(() => {
    function onOpenArtifact(e) {
      if (e.detail?.nodeId !== id) return;
      openPreview(e.detail?.versionIndex ?? latestIndex);
    }
    window.addEventListener('cw:open-artifact', onOpenArtifact);
    return () => window.removeEventListener('cw:open-artifact', onOpenArtifact);
  }, [id, latestIndex, openPreview]);

  return (
    // MOTION PHASE (M2 item 1) — see TriggerNode.jsx for the --cw-seq note.
    <div
      ref={cardRef}
      className={`cw-node cw-node--output${isDeveloping ? ' cw-node--stage-sized' : ''}${selected ? ' is-selected' : ''}${finale ? ' cw-node--finale' : ''}`}
      style={{ '--cw-seq': data.seq, ...(isDeveloping ? { '--cw-stage-ratio': stageRatio } : null) }}
      data-run-state={runState}
    >
      {/* RUN PHASE (R2 item 4) */}
      <NodeActionsToolbar nodeId={id} />
      {/* RUN SHOW B2 */}
      <RunCornerTicks />
      <div className="cw-card-head">
        {/* The format qualifier moved from a bold accent tag in the title
            corner into the eyebrow's quiet caps (Bryan: the corner stacked
            "Presentation" over "DONE ✓" — "so close together, bolded, and
            colored its sort of confusing"). The corner now belongs to the
            run stamp alone; identity qualifiers ride the eyebrow. */}
        <CardEyebrow icon={Icon} kind={`Output · ${format}`} />
        {/* RUN SHOW B3 */}
        <RunStamp runState={data.runState} />
        <div className="cw-card-title-row">
          <span className="cw-title">Output</span>
        </div>
      </div>

      <FieldLabel>Describe the output</FieldLabel>
      <textarea
        className="cw-textarea nodrag nopan"
        placeholder="e.g. a 500-word blog post with a hero image"
        rows={3}
        value={description}
        onChange={(e) => updateNodeData(id, { description: e.target.value })}
      />

      <QuietRow icon={Paperclip}>Attach a template</QuietRow>
      {/* Integrated-sweep FAIL C2 — dead affordance made real; mirrors
          TaskNode's agent-guidance reveal, persisted per node. */}
      <QuietRow onClick={() => setInstructionsOpen((v) => !v)}>
        {instructionsOpen ? 'Hide instructions' : 'Add instructions'}
      </QuietRow>
      <Reveal open={instructionsOpen}>
        <textarea
          className="cw-textarea nodrag nopan"
          placeholder="Extra guidance for this output..."
          rows={2}
          value={data.outputInstructions || ''}
          onChange={(e) => updateNodeData(id, { outputInstructions: e.target.value })}
        />
      </Reveal>

      {/* RUN PHASE (R2 item 3) / ANDREW ROUND C3 — text-family formats keep
          the streamed artifact preview exactly as R2 built it (plain scroll,
          not clamped), just re-grounded as a paper "sheet" (nodes.css).
          Every other format grows the bespoke SVG develop tray instead —
          same Reveal-wrapped slot, so the card breathes open identically
          either way (NODE BREATHE PHASE). The run engine still owns
          `runState`/`data.output`; this only decides how to SHOW it.
          HANDED OFF (PLAN.md "## HANDED OFF") — "MID-RUN THEATER STAYS...
          but on delivery it EXITS (Reveal close, real exit)": this Reveal
          now gates on `isDeveloping` (closes for good the instant `done`
          lands) instead of the old delivery-spanning condition, and
          ArtifactStage is always called with `delivered={false}` — the
          card never shows the "Delivered · <FORMAT>" banner/arrival-settle/
          meta row anymore (that whole presentation, plus the version
          chip/stepper, View/Download actions, and the batch first-asset +
          ×N stage, retired to the results sheet). What's left is exactly
          the pre-delivery "Generated" develop tray — unchanged look,
          shorter life. */}
      <Reveal open={isDeveloping}>
        <ArtifactStage format={format} delivered={false} sheet={textFormat} aspect={stageAspect}>
          {textFormat ? (
            <div className="cw-genbox-develop">
              <GenerationBox content={output?.content || ''} streaming={running} />
            </div>
          ) : output?.imageUrl ? (
            // FINAL QUEUE — FQ-A "REAL ADAPTERS". Same art/scan pairing as
            // the SVG paths below — only the art itself changes — so a real
            // photo drops into the SAME stage with zero layout shift either
            // way.
            <>
              <img src={output.imageUrl} alt="" className="cw-artifact-art cw-artifact-art--photo" />
              <span className="cw-artifact-scan" aria-hidden="true" />
            </>
          ) : output?.poster ? (
            // VARIANT STUDIO — this artifact came from the generate grid;
            // see this file's import comment.
            <>
              <Poster seed={seed} className="cw-artifact-art" />
              <span className="cw-artifact-scan" aria-hidden="true" />
            </>
          ) : (
            <>
              <Artifact format={format} seed={seed} className="cw-artifact-art" />
              <span className="cw-artifact-scan" aria-hidden="true" />
            </>
          )}
        </ArtifactStage>
      </Reveal>

      {/* HANDED OFF — the retirement's own replacement: once delivered, the
          develop tray above is closed for good and this quiet line takes
          its place instead, in the SAME breathing Reveal slot (one closes
          exactly as the other opens — DESIGN BAR "state changes animate the
          delta"). QUIET DELIVERED: purely a status line now, no glide. */}
      <Reveal open={done}>
        <DeliveredLine />
      </Reveal>

      {/* RESULTS SHEET — the satellite panel, in the node's OWN coordinate
          space: an absolutely positioned child of THIS card wrapper (not a
          React Flow node of its own), so it pans/zooms/drags WITH the node
          — mirrors HumanNode.jsx's own chat sheet's mounting shape (see
          useResultsSheetPresence's own header comment), never that file's
          code. `resultsSheetMounted` (not `isResultsAnchor` directly) gates
          whether this renders at all — it stays mounted for the whole close
          transition, so Clear/anchor-handoff both get a real exit instead of
          vanishing. */}
      {resultsSheetMounted && (
        <>
          <div className={`cw-results-tether${resultsSheetEntered ? ' is-entered' : ''}`} aria-hidden="true">
            <svg className="cw-results-tether-svg" width="3" height="72" viewBox="0 0 3 72">
              <line className="cw-results-tether-line" x1="1.5" y1="0" x2="1.5" y2="72" pathLength="100" />
              <line className="cw-results-tether-shimmer" x1="1.5" y1="0" x2="1.5" y2="72" pathLength="100" />
            </svg>
            <span className="cw-results-port">
              <span className="cw-results-port-glow" />
              <span className="cw-results-port-pulse" />
              <span className="cw-results-port-ring" />
              <span className="cw-results-port-dot" />
            </span>
          </div>
          <div
            className={`cw-results-sheet${resultsMeta.hasMatrix ? ' cw-results-sheet--matrix' : ''}${resultsSheetEntered ? ' is-entered' : ''}`}
          >
            <ResultsSheetBody />
          </div>
        </>
      )}

      <InHandle nodeId={id} />
      <OutHandle nodeId={id} />

      <RunPreview
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        format={format}
        content={output?.content || ''}
        seed={seed}
        poster={!!output?.poster}
        nodeId={id}
        seq={data.seq}
        imageUrl={output?.imageUrl}
        imageMime={output?.imageMime}
        // VERSION HISTORY IN THE OVERLAY — the node's full record + which
        // index THIS open asked for (openPreview's own comment above); the
        // flat props just above stay as the single-version fallback
        // RunPreview.jsx already documents for a card with only one take.
        // HANDED OFF: `previewIndex` now falls back straight to
        // `latestIndex` (this card no longer tracks a separately-browsed
        // "visible" index of its own — see this file's own `isDeveloping`
        // comment on why that whole browse concept retired).
        versions={versions}
        versionIndex={previewIndex ?? latestIndex}
      />
    </div>
  );
}

export default memo(OutputNode);
