// Template builder — the shared spine for every workflow template.
//
// A template is authored as a flat list of steps plus edges between step keys.
// This file turns that into the real {nodes, edges} graph shape the builder
// consumes (PLAN.md §Graph schema), including:
//   - FRESH ids on every call, so inserting the same template twice can never
//     collide with itself or with nodes already on the canvas;
//   - automatic layout from each step's `col` (rank, left→right) and optional
//     `row` (lane hint within that column) — no template ever hardcodes pixel
//     positions, so adding a step can't silently overlap a neighbour;
//   - `measured: {}` on every node (see state.jsx's normalizeNodes — React
//     Flow wipes handle bounds on nodes without it, which silently kills edges).
//
// Authoring shape:
//   template({
//     id: 'blog-to-social',
//     name: 'Blog post → social kit',
//     category: 'Content',
//     blurb: 'One post becomes a week of channel-ready posts.',
//     steps: {
//       t:   { type: 'trigger', col: 0, mode: 'manual' },
//       read:{ type: 'task', col: 1, title: 'Read the source post',
//              instructions: '…', agent: 'Omni Research Agent' },
//       out: { type: 'output', col: 2, format: 'Text', description: '…' },
//     },
//     edges: [['t', 'read'], ['read', 'out']],
//   })
//
// Edge forms: ['a','b'] (plain out→in) or ['a','b','true'] where the third
// entry is the SOURCE handle id ('true'|'false'|'try'|'catch'|'case-0'|
// 'opt-<id>') — same handle vocabulary as the rest of the app.

// WAVE 5 — THE VERB EXPANSION. Only import this file's own buildData() case
// for `generate` needs — the same default-model/-variants/-seed triple
// data/blocks.js's own 'generate' palette makeData() already draws from, so
// a templated Generate step with no explicit `model`/`variants`/`seed`
// lands on the identical defaults a palette-add would.
import { DEFAULT_MODEL, DEFAULT_VARIANTS, DEFAULT_GENERATE_SEED } from '../models.js'

// Column pitch: widest card (task, 340px) plus generous air, so long titles
// and the edge +/× controls never crowd the next rank.
const COL_PITCH = 440
// Vertical gap between stacked cards in the same column.
const ROW_GAP = 56

// Rendered card heights vary hugely by type (a task with an agent sub-card is
// ~560px; a stop block is ~140px). Layout packs each column using these
// estimates rather than one flat row pitch, which would either overlap the
// tall cards or strand the short ones in acres of space. Values are measured
// from the live app, rounded up.
const EST_HEIGHT = {
  trigger: 220,
  task: 560,
  human: 300,
  humanChoice: 430,
  // THE SPLIT (PLAN.md "## THE SPLIT") — the old `humanChat: 560` bucket
  // retires here: NODE SHEET already moved the transcript/chat-hat/composer
  // out of the CARD into a satellite sheet that reserves no layout column
  // of its own ("the sheet is a satellite, it reserves nothing" — PLAN.md),
  // so a chat node's rest-state footprint was never actually 560 anymore —
  // that number dated from HITL MICRO-CHAT, before NODE SHEET shipped, and
  // this phase is the first one told to go fix it (NODE SHEET's own
  // "builder.js... DO NOT touch this phase" deferred exactly this tidy).
  // `checkin` is the compact card CheckinNode.jsx actually renders now —
  // same footing as `human`/`humanChoice` just above, own bucket since its
  // resting width (440, colX's own hasCheckin branch below) differs from
  // the classic gate's 250.
  checkin: 300,
  output: 260,
  logic: 150,
  logicOptions: 300,
  wait: 170,
  stop: 140,
  // COMFY ROUND (CP2) — no template ever spawns a note or a params node, but
  // nodeBox()/addNodeFromPalette (state.jsx) run this same estimate for
  // EVERY palette add regardless of source, so both need a sane pre-measure
  // fallback too.
  note: 150,
  params: 280,
  // WAVE 1 — THE VERB EXPANSION (out-of-seam, minimal fix): nodeBox() —
  // exported from this file, consumed directly by state.jsx's own live
  // palette-add/ghost-add/wire-drop collision placement, not just template
  // building — needs a real number for Split too, or a freshly-dropped one
  // gets placed using the plain `logic` estimate (150), noticeably short of
  // its real height (caption + FieldLabel + budget-row stepper + 2 handle
  // rows), risking a visible overlap with whatever lands right below it
  // before Split's first real measurement corrects it. CDP-measured off the
  // live card (250px), rounded up per this file's own convention. No
  // template references gather/split yet (Wave 5's job), so 'gather' needs
  // no entry here — the plain `logic` bucket (150) already matches its
  // resting caption-only content.
  logicSplit: 260,
  // WAVE 4 — THE VERB EXPANSION (out-of-seam, minimal fix, same "nodeBox()
  // needs a real number for every live palette-add/ghost-add/wire-drop
  // placement too" reasoning WAVE 1's own comment on logicSplit gives).
  // Guardrail's own checks row (3 chips, often wrapping onto 2 lines inside
  // .cw-node--logic's 230px width) + 2 named handle rows runs noticeably
  // taller than the plain `logic` bucket's 150 — CDP-measured off the live
  // card, rounded up.
  // WAVE 5 — THE VERB EXPANSION (integrated QA catch): re-measured headless
  // off the live card (wired, resting, all 3 default checks selected) —
  // came back 335px, 55px past this bucket's original 280. Corrected to a
  // real number; the original 280 would have under-reserved every Guardrail
  // placement, this wave's own "Launch with guardrails" template included.
  logicGuardrail: 340,
  // Own-type estimates — Handoff (owner combo + due chip + note field, same
  // multi-field footing as `human`/`humanChoice` above), Localize (one
  // toggle-chip row, closer to `params`' own single-row shape), Optimize
  // (one stepper row, closer to `wait`), Run workflow (one combo row, closer
  // to `wait`) — CDP-measured off the live cards, rounded up.
  // WAVE 5 — THE VERB EXPANSION (integrated QA catch): `handoff` was
  // measured too short — a real headless-Chrome reading off the live card
  // (owner ComboBox + due chip + note field, wired, resting) came back
  // 373px, 33px past this bucket's old 340. Corrected to a real
  // CDP-measured number (see this file's own RUN_GROWTH comment below for
  // the harness), rounded up. localize/optimize/runworkflow's own resting
  // readings (196/207/204) all came in UNDER their existing buckets here —
  // already safe, left unchanged.
  handoff: 380,
  localize: 220,
  optimize: 210,
  runworkflow: 210,
  // WAVE 5 — THE VERB EXPANSION. Own-type estimates for the three types no
  // template (nor, for signal/remix, any live palette-add's own layout
  // math) had ever exercised before this wave — nodeBox()'s fallback
  // (`EST_HEIGHT[step.type] ?? 260`) was silently substituting a flat 260
  // for all of them, wildly short for `generate` in particular (a real
  // resting Generate card — prompt textarea, image-input row, model +
  // variant-count fields — measures 569px, more than DOUBLE the fallback).
  // CDP-measured off the live cards (empty prompt / zero image inputs / 6
  // variants, each type's own default resting state), rounded up. `signal`
  // itself has NO entry here — its four kinds differ enough in body shape
  // (Source's one ref chip vs. Style's image-input row + seed + swatches)
  // that estimateHeight() below branches on `step.kind` the same way it
  // already does for `logic`, reading signalSource/signalAudience/
  // signalMeasure/signalStyle instead of a flat `signal` bucket.
  signalSource: 260,
  signalAudience: 260,
  signalMeasure: 330,
  signalStyle: 320,
  remix: 230,
  generate: 580,
  // WAVE 5 — THE VERB EXPANSION. Compare is a `logic` kind never templated
  // before this wave (same "no template touched this yet" gap the
  // Gather/Split comments above already flag for their own kinds) — its
  // resting card (criteria ComboBox + the live upstream echo row a wired
  // fan-in candidate shows) measures 220px, well past the plain `logic`
  // bucket's 150. CDP-measured wired-but-idle (2 Generate candidates in,
  // matching this wave's own "A/B the launch" template shape), rounded up.
  logicCompare: 230,
}

// Card widths, from nodes.css's per-type rules. Used only as a fallback for
// nodes React Flow hasn't measured yet (a freshly-built template's nodes all
// carry `measured: {}`), so placement maths never treats a 340px task card as
// a zero-width point.
const EST_WIDTH = {
  trigger: 260,
  task: 340,
  human: 250,
  // THE SPLIT — CheckinNode.jsx's own resting width (nodes.css
  // `.cw-node--checkin`, formerly `.cw-node--human-chat`).
  checkin: 440,
  output: 270,
  logic: 230,
  wait: 230,
  stop: 230,
  // COMFY ROUND (CP2) — note's fixed v1 width (NoteNode.jsx/nodes.css) and
  // params' card width (ParamsNode.jsx/nodes.css).
  note: 300,
  params: 260,
  // WAVE 4 — THE VERB EXPANSION. Own-type card widths, from nodes.css's own
  // per-type rules (same convention every entry above already follows).
  // Guardrail needs no entry — it's a `logic` kind, already covered by the
  // `logic` bucket above (width is per-TYPE in this table, not per-kind).
  handoff: 260,
  localize: 260,
  optimize: 230,
  runworkflow: 270,
  // WAVE 5 — THE VERB EXPANSION. `signal` (one rule covers all four kinds —
  // nodes.css's own .cw-node--signal is likewise kind-agnostic, width is
  // fixed regardless of Source/Audience/Measure/Style), `remix`, and
  // `generate` — the three types nodeBox()'s `?? 280` fallback was silently
  // covering until this wave (no template, and for signal/remix no other
  // live-add path either, had ever exercised them). Straight from
  // nodes.css's own per-type width rules (same source every entry above
  // already cites), not measured — width is fixed by CSS, not content.
  signal: 260,
  remix: 300,
  generate: 320,
}

// FQ-B (PLAN.md "## FINAL QUEUE" -> "### FQ-B — VARIANT GRID OVERLAP") — a
// column containing a Generate step needs a much bigger gap after it than
// COL_PITCH gives every other rank. spawnOrReplaceGrid (state.jsx) drops the
// variant grid VARIANT_GROUP_GAP (140px) to the right of the generate card's
// own EST_WIDTH.generate (320px), and the grid itself is wide — gridGeometry
// (count) for the default variant count (models.js DEFAULT_VARIANTS=6) comes
// out to 676px (VARIANT_PAD_X*2 + 3 cols*VARIANT_CARD_W(200) + 2*VARIANT_GAP
// (18), all state.jsx constants). Under the flat COL_PITCH every other rank
// uses, a Generate at column N reaches N*440 + 320 + 140 + 676 = N*440+1136
// — hundreds of pixels past the next column's own start at (N+1)*440 — which
// is the structural cause of the Wave 5 residual bug: "A/B the launch" runs
// two Generates side by side and both grids land on top of the downstream
// Compare/Output cards. Reserving the real space here means the common case
// (default variant count) never depends on spawnOrReplaceGrid's slideClear
// pushing the grid out of the way of cards it should never have been near
// in the first place. Mirrored by hand (not imported — state.jsx imports
// FROM this file, so the reverse import would cycle); if VARIANT_CARD_W/
// VARIANT_GAP/VARIANT_PAD_X/VARIANT_GROUP_GAP/DEFAULT_VARIANTS ever move,
// keep this in step. The extra +120 breathing gap matches the app's other
// standard "clear" spacing (PLACEMENT_GAP in state.jsx) rather than
// COL_PITCH's own tighter implicit air (440 - task's 340px width = 100).
const GENERATE_GRID_COLS = Math.ceil(DEFAULT_VARIANTS / 2) // state.jsx gridGeometry()
const GENERATE_GRID_WIDTH = 20 * 2 + GENERATE_GRID_COLS * 200 + (GENERATE_GRID_COLS - 1) * 18 // VARIANT_PAD_X/CARD_W/GAP
const GENERATE_GRID_GROUP_GAP = 140 // state.jsx VARIANT_GROUP_GAP
const GENERATE_COL_PITCH = EST_WIDTH.generate + GENERATE_GRID_GROUP_GAP + GENERATE_GRID_WIDTH + 120

// Real bounding box for a LIVE graph node (not an authored step): prefer React
// Flow's own measurement once it exists, fall back to the type estimate.
//
// FQ-B — `node.data?.width`/`height` is checked before the per-TYPE estimate:
// a variantgroup frame (state.jsx spawnOrReplaceGrid) is the one node whose
// real size varies per-instance (it depends on the source generate node's
// live variant count — 4/6/10 all render at different widths/heights, see
// gridGeometry) rather than being fixed by its type the way every other
// card's CSS is, so a flat EST_WIDTH/EST_HEIGHT bucket can never be right
// for it. state.jsx sets data.width/height to the EXACT rendered size at
// spawn time (FrameNode.jsx reads the same two fields for its own inline
// style), so this gives every collision check in this file — and in
// state.jsx, which imports this function — the frame's true box immediately,
// even before React Flow's own measurement pass has landed. Without this, an
// unmeasured grid fell back to the generic 280x280-ish default (no
// 'variantgroup' entry exists in EST_WIDTH/EST_HEIGHT on purpose — a flat
// number would be wrong for whichever variant count wasn't the one it was
// tuned against), which is how a second concurrent grid — or any other
// placement — could think a 676x746 grid was still mostly empty canvas.
export function nodeBox(node) {
  const w = node.measured?.width || node.data?.width || EST_WIDTH[node.type] || 280
  const h =
    node.measured?.height ||
    node.data?.height ||
    estimateHeight({ type: node.type, responseType: node.data?.responseType, kind: node.data?.kind })
  return { x: node.position.x, y: node.position.y, w, h }
}

// Union box of a node list. Returns null for an empty graph so callers can
// distinguish "nothing there" from "a box at the origin".
export function graphBounds(nodes) {
  if (!nodes.length) return null
  const boxes = nodes.map(nodeBox)
  const minX = Math.min(...boxes.map((b) => b.x))
  const minY = Math.min(...boxes.map((b) => b.y))
  const maxX = Math.max(...boxes.map((b) => b.x + b.w))
  const maxY = Math.max(...boxes.map((b) => b.y + b.h))
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY }
}

function estimateHeight(step) {
  // THE SPLIT — 'checkin' no longer branches through 'human' at all (that
  // was HITL MICRO-CHAT's `responseType === 'chat'` special case, retired
  // with the `humanChat` bucket above); it falls straight to the generic
  // `EST_HEIGHT[step.type]` lookup at the bottom of this function, same as
  // every other own-type entry (output/wait/stop/...).
  if (step.type === 'human') {
    return step.responseType === 'choice' ? EST_HEIGHT.humanChoice : EST_HEIGHT.human
  }
  if (step.type === 'logic') {
    if (step.kind === 'switch') return EST_HEIGHT.logicOptions
    if (step.kind === 'split') return EST_HEIGHT.logicSplit // WAVE 1
    if (step.kind === 'guardrail') return EST_HEIGHT.logicGuardrail // WAVE 4
    if (step.kind === 'compare') return EST_HEIGHT.logicCompare // WAVE 5
    return EST_HEIGHT.logic
  }
  // WAVE 5 — THE VERB EXPANSION. `signal`'s four kinds differ enough in body
  // shape (Source's one ref chip vs. Style's image-input row + seed +
  // swatches) that one flat bucket would either overlap Measure/Style or
  // strand Source/Audience in acres of air — same "kind changes the
  // estimate" reasoning `logic` above already established. Falls through to
  // signalSource for the default/unset kind, matching SignalNode.jsx's own
  // `data.kind || 'source'` default.
  if (step.type === 'signal') {
    if (step.kind === 'measure') return EST_HEIGHT.signalMeasure
    if (step.kind === 'style') return EST_HEIGHT.signalStyle
    if (step.kind === 'audience') return EST_HEIGHT.signalAudience
    return EST_HEIGHT.signalSource
  }
  return EST_HEIGHT[step.type] ?? 260
}

// How much taller each card gets when a RUN fills it (Bryan: templates must
// be "placed in such a way that when you run it, when the node grows to fit
// the new content, its not going to be overlapping another node"). Layout
// pitches on resting + growth, so the run inflates cards into air that was
// reserved for exactly that. Values measured off real completed runs at
// 2026-08 card widths, rounded up — generous beats colliding:
//   task    -> GENERATED clamp box (3 lines + Show more row + label)
//   output  -> the develop tray's own artifact frame/paper sheet (see
//              HANDED OFF re-measurement note just below — this is no
//              longer the permanently-delivered peak)
//   human   -> the ask echo + YOUR RESPONSE block after answering
//   generate-> its own GENERATED preview frame (Generate's own delivered
//              treatment is untouched by HANDED OFF — see that note)
// Everything else holds its resting size through a run.
//
// HANDED OFF (PLAN.md "## HANDED OFF — output cards never hold the
// deliverable", 2026-08-24) — "cards no longer grow PERMANENTLY on
// delivery; keep whatever transient growth the develop tray needs. Adjust
// estimates to the new resting delivered height." `output`'s old 380 dated
// from THE REVEAL/BATCH MATRIX (resting -> the delivered ArtifactStage:
// full-bleed frame + banner + version/meta row + View/Download row, held
// FOREVER after a run). That whole delivered presentation retired off the
// card this phase — post-delivery the card now COLLAPSES back down to a
// spec-fields-only body (description + DONE stamp + the one-line "Delivered
// — in Results" row, `.cw-delivered-line`), so the tallest the card ever
// gets is the transient MID-RUN develop tray itself (unchanged look, just a
// shorter life — Reveal closes for real the instant `done` lands), not the
// old held-forever state. Re-measured live (same CDP harness as the table
// below): a fresh Output(Text) card (`Ask and answer` template, no upstream)
// 290.9 idle -> 530.1 peak mid-stream (`data-run-state="running"`, tray
// open) -> 334.1 settled/delivered (compact + delivered line) — growth
// 239.2. An Output(Graphic) card (`Blog post -> social kit` template's
// `outGraphic` step) 290.9 idle -> 566.1 peak (the SVG develop frame at its
// own artifactAspect) -> 334.1 settled — growth 275.2. No template reaches
// 'Templated Output' (the tallest aspect per THE REVEAL's own REVEAL
// RESIDUAL note, ~708px OLD delivered vs Graphic's ~670px, a 38px spread)
// to measure directly; extrapolating that same spread onto the Graphic
// figure above (566 + 38 ≈ 604, growth ≈ 313) is the worst case this table
// has visibility into. 320 covers every measured format plus that
// extrapolation with headroom to spare — down from 380, but still
// deliberately NOT cut to the bare 275 measured maximum, same "rounded up,
// generous beats colliding" convention as every other entry here.
// `generate` stays 380, unchanged: GenerateNode.jsx's own preview keeps THE
// REVEAL's full delivered treatment forever (banner/frame/meta row, View/
// Download) — that file is untouched by this phase (HANDED OFF's contract
// scopes the retirement to "OUTPUT CARDS (OutputNode + RemixNode)" only),
// so its old growth number is still the correct one.
const RUN_GROWTH = {
  task: 210,
  output: 320,
  human: 150,
  generate: 380,
  // WAVE 5 — THE VERB EXPANSION (master contract, "### WAVE 5" — "check
  // RUN_GROWTH covers the new types and ADD entries for any Wave 1-4 type
  // that grows during runs but lacks one"). Every Wave 1-4 type gets its own
  // entry here now — not just the master's own named examples (Measure,
  // Remix, Localize, Optimize, Gather, Handoff) but every OTHER new type
  // that turned out to grow too once actually measured (Compare, Guardrail,
  // Run workflow) — "don't guess" cuts both ways: a type left OUT of this
  // table silently reads a 0 delta from the `?? 0` fallback below, which is
  // only correct if it genuinely doesn't grow. Split (`logic` kind) and
  // Source/Audience/Style (`signal` kinds) are covered by growthFor()'s own
  // kind-aware tables just below instead — a flat per-TYPE table here can't
  // express "gather/compare/guardrail grow, if/switch/foreach/try/split
  // don't" for the one `logic` type, or "measure grows more than
  // source/audience/style" for the one `signal` type.
  //
  // Measurement harness (all values below): headless Chrome via CDP
  // (websocket-client), built dist on a scratch port, real
  // Input.dispatchMouseEvent drags to wire each type from a Trigger (Compare
  // from two Generates, matching this wave's own "A/B the launch" shape;
  // Remix from a Task with real instructions text, so its translate/tighten
  // op has real content to transform), Run pressed, height read via
  // getBoundingClientRect() at 100% zoom (Shift+0) before and after the run
  // reaches its done/paused state — the delta is the real number below,
  // rounded up for headroom (a Guardrail FLAG note or a 4-market Localize
  // block can run a little longer than the exact sample measured).
  //   remix       — (HANDED OFF, 2026-08-24, re-measured — RUN_GROWTH's own
  //                 header note just above has the full diagnosis) the
  //                 220 -> 404 figure below this comment dated from the
  //                 permanently-delivered frame + op-stamp line + Download
  //                 chip + "View <format>" row THE VERB EXPANSION originally
  //                 measured; that whole delivered presentation retires off
  //                 the card now (Reveal closes for real on `done`, the
  //                 "Delivered — in Results" line takes its place). Re-run
  //                 same harness, no upstream wired (Trigger -> Remix
  //                 directly, real Input.dispatchMouseEvent drag): 219.8
  //                 idle -> 355.1 peak mid-run (`data-run-state="running"`,
  //                 tray open, default Translate op's fallback "nothing
  //                 upstream to remix yet" text) -> 263.0 settled/delivered
  //                 (compact + delivered line) — growth 135.3, rounded up.
  //   localize    — 4 default markets, no upstream text (fallback "ready to
  //                 localize" line per market): 196 -> 377, delta 181.
  //   optimize    — cycles:2 default: 207 -> 295, delta 88.
  //   handoff     — rest -> PAUSED (the "Mark returned" live action row) ->
  //                 DONE (the "Returned by NN" GenerationBox): 373 -> 405
  //                 (paused) -> 442 (done); layout must reserve for whichever
  //                 is taller mid-run, so this is the DONE delta, 69,
  //                 already the larger of the two.
  //   runworkflow — default templateId ('ask-answer'): 204 -> 295, delta 91.
  remix: 140,
  localize: 200,
  optimize: 100,
  handoff: 80,
  runworkflow: 105,
}

// WAVE 5 — THE VERB EXPANSION. Kind-aware growth for the two kind-switched
// families (`logic`, `signal`) — see RUN_GROWTH's own header comment for
// the measurement harness these numbers share. Same-harness readings:
//   gather    (fan-in bundle line):         141 -> 211, delta  70.
//   compare   (2-candidate ranked list):    220 -> 290, delta  70.
//   guardrail (checks-passed/flag line):    335 -> 404, delta  69.
//   split     (no post-run content at all — LogicNode.jsx's SplitBody never
//              renders a GenerationBox): 250 -> 250, delta 0 — confirmed,
//              not just assumed; if/switch/foreach/try share the identical
//              "no growth" shape and were already correct with no entry.
//   source    (one ingest line):            253 -> 304, delta  51.
//   audience  (one summary line):           254 -> 323, delta  69.
//   measure   (one KPI-reading line):       323 -> 374, delta  51.
//   style     (one "loaded style ref" line):311 -> 352, delta  41.
const LOGIC_GROWTH = {
  gather: 85,
  compare: 90,
  guardrail: 85,
}
const SIGNAL_GROWTH = {
  source: 65,
  audience: 85,
  measure: 65,
  style: 55,
}

function growthFor(step) {
  if (step.type === 'logic') return LOGIC_GROWTH[step.kind] ?? 0
  if (step.type === 'signal') return SIGNAL_GROWTH[step.kind] ?? 0
  // THE SPLIT — 'checkin' has no RUN_GROWTH entry, so the fallback below
  // naturally gives it 0: NODE SHEET already moved the paused conversation
  // into a satellite sheet that reserves no card growth ("the sheet is a
  // satellite, it reserves nothing" — PLAN.md). RUN_GROWTH.human still
  // applies to the classic gate (the ask echo + answer block after it
  // resolves) exactly as it always has.
  return RUN_GROWTH[step.type] ?? 0
}

function estimateGrownHeight(step) {
  return estimateHeight(step) + growthFor(step)
}

let seq = 0
function mintId(type) {
  seq += 1
  return `${type}-tpl${seq.toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

// Turn an authored step into the node `data` payload its component expects.
function buildData(step) {
  switch (step.type) {
    case 'trigger':
      return {
        mode: step.mode ?? 'manual',
        autoStart: step.autoStart ?? false,
        // RESULTS ON THE BOARD (PLAN.md) — pass-through so part-b.js's
        // one-line trigger flag actually reaches node.data; every other
        // template's trigger step never sets `resultsFrame`, so this stays
        // omitted (not `false`) for them, byte-identical to before.
        ...(step.resultsFrame ? { resultsFrame: true } : {}),
      }
    case 'task':
      return {
        title: step.title ?? 'Task / Action',
        instructions: step.instructions ?? '',
        agent: step.agent ?? null,
        repeat: step.repeat ?? 'once',
        ...(step.attachments ? { attachments: step.attachments.map((a, i) => ({ id: `att-${i}`, ...a })) } : {}),
      }
    // THE SPLIT (PLAN.md "## THE SPLIT") — reverted to the pre-merge shape:
    // just the classic gate's own three fields, no chatOpener pass-through
    // (that moved to `case 'checkin':` below, the only place it's ever
    // authored now).
    case 'human':
      return {
        ask: step.ask ?? '',
        responseType: step.responseType ?? 'free',
        options: step.options ?? [],
        // X25 B (PLAN.md "## X25 B — the floating chat window variant") —
        // same pass-through precedent as `batchCount`/`resultsFrame` above:
        // only part-a.js's 'Social batch ×25 B' gate step ever authors this;
        // every other template's human step never sets it, so it stays
        // omitted (not a stale default) for them, byte-identical to before.
        ...(step.chatSurface ? { chatSurface: step.chatSurface } : {}),
      }
    // THE SPLIT — the dialogue type's own data shape: no responseType
    // AUTHORING (a template step never sets `step.responseType` for a
    // checkin — there's nothing to author, it's always chat), just the
    // internal `responseType: 'chat'` breadcrumb stamped unconditionally
    // (see CheckinNode.jsx's own header note for why it still needs to
    // exist in the data at all — FlowCanvas.jsx's chat-pause camera glide,
    // out of this seam's grant, still keys on it). `chatOpener` carries the
    // SAME pass-through precedent HITL MICRO-CHAT/BATCH MATRIX established:
    // only part-a.js's 'Social batch ×25' check-in step ever authors it
    // (its own chat sits BEFORE a draft exists, so engine.js's default
    // "Draft's in..." opener would be wrong there — see run/engine.js's
    // CHAT_OPENER_TEXT comment); always-on-engine's own check-in never sets
    // it, so it stays omitted (not a stale default) there, byte-identical
    // to before.
    case 'checkin':
      return {
        ask: step.ask ?? '',
        options: step.options ?? [],
        responseType: 'chat',
        ...(step.chatOpener ? { chatOpener: step.chatOpener } : {}),
      }
    case 'output':
      return {
        format: step.format ?? 'Text',
        description: step.description ?? '',
        // BATCH MATRIX (PLAN.md "## BATCH MATRIX") — same pass-through
        // precedent again: only part-a.js's 'Social batch ×25' output step
        // sets this. run/engine.js's 'output' case reads `data.batchCount`
        // to switch into the batch-delivery path (`data.output.assets = [N
        // items]`); every other template's output step never sets it, so
        // this stays omitted for them, byte-identical to before.
        ...(step.batchCount ? { batchCount: step.batchCount } : {}),
      }
    case 'logic':
      return {
        kind: step.kind ?? 'if',
        ...(step.options ? { options: step.options } : {}),
        // WAVE 5 — THE VERB EXPANSION. Kind-specific fields for the three
        // Wave 1/3/4 `logic` kinds no template had ever authored before
        // this wave — SplitBody/CompareBody/GuardrailBody (LogicNode.jsx)
        // all already default these fields gracefully when absent
        // (`data.percentA ?? 70`, `data.criteria || 'Brand fit'`,
        // `Array.isArray(data.checks) ? data.checks : GUARDRAIL_CHECK_
        // OPTIONS`), so this pass-through isn't a correctness fix the way
        // the cases below are — it's what lets a template author a
        // SPECIFIC ratio/criteria/check-set instead of always landing on
        // the generic default, the same authoring control every other
        // step field in this switch already gets.
        ...(step.percentA != null ? { percentA: step.percentA } : {}),
        ...(step.criteria ? { criteria: step.criteria } : {}),
        ...(step.checks ? { checks: step.checks } : {}),
      }
    case 'wait':
      return { amount: step.amount ?? '10', unit: step.unit ?? 'minutes' }
    case 'stop':
      return {}
    // WAVE 5 — THE VERB EXPANSION (out-of-seam, minimal fix — the same
    // "growth-aware layout" mandate this wave's own EST_HEIGHT/RUN_GROWTH
    // work above answers). Every case below was MISSING entirely: this
    // switch's `default: return {}` silently swallowed every field a
    // template step author set for these seven types, landing each new node
    // with none of its own data — no source kind/ref, no segments, no
    // KPI/target, no owner/due/note, no markets, no cycles, no template id,
    // no prompt — and, in the process, none of the plausible board-content
    // copy this wave's own showcase templates need. No prior template had
    // ever authored a step of any of these types (confirmed against
    // part-a.js/part-b.js), so this gap was latent, not yet load-bearing,
    // until this wave's own four templates became the first to exercise it.
    case 'signal':
      return {
        kind: step.kind ?? 'source',
        ...(step.sourceKind ? { sourceKind: step.sourceKind } : {}),
        ...(step.ref !== undefined ? { ref: step.ref } : {}),
        ...(step.segments ? { segments: step.segments } : {}),
        ...(step.kpi ? { kpi: step.kpi } : {}),
        ...(step.target !== undefined ? { target: step.target } : {}),
        ...(step.windowDays != null ? { windowDays: step.windowDays } : {}),
        ...(step.imageInputs ? { imageInputs: step.imageInputs } : {}),
        ...(step.seed != null ? { seed: step.seed } : {}),
      }
    case 'remix':
      return { op: step.op ?? 'translate', output: null }
    case 'handoff':
      return { owner: step.owner ?? 'Mara Lindqvist', due: step.due ?? 'Fri · EOD', note: step.note ?? '' }
    case 'localize':
      return { markets: step.markets ?? ['DE', 'FR', 'JP', 'MX'] }
    case 'optimize':
      return { cycles: step.cycles ?? 2 }
    case 'runworkflow':
      return { templateId: step.templateId ?? 'ask-answer' }
    case 'generate':
      return {
        title: step.title ?? 'Generate key visuals',
        model: step.model ?? DEFAULT_MODEL,
        prompt: step.prompt ?? '',
        imageInputs: step.imageInputs ?? [],
        variants: step.variants ?? DEFAULT_VARIANTS,
        runState: 'idle',
        output: null,
        seed: step.seed ?? DEFAULT_GENERATE_SEED,
        seedLocked: false,
        groupId: null,
      }
    default:
      return {}
  }
}

// Lay a column out: sort by the author's row hint (ties keep authoring order),
// stack with ROW_GAP using per-type height estimates, then centre the stack on
// y=0 so ranks read as a balanced spine rather than everything hanging down
// from the top edge.
function layoutColumn(entries) {
  const sorted = [...entries].sort((a, b) => (a.step.row ?? 0) - (b.step.row ?? 0) || a.order - b.order)
  // Pitch on GROWN heights (RUN_GROWTH above): cards are placed where their
  // post-run size fits, so a run expands into reserved air instead of into
  // the neighbour below. (Re-applied 2026-08-19 after a concurrent
  // geometry-sync session overwrote this line — if you are that session:
  // estimateGrownHeight is deliberate, keep it.)
  const heights = sorted.map((e) => estimateGrownHeight(e.step))
  const total = heights.reduce((sum, h) => sum + h, 0) + ROW_GAP * Math.max(0, sorted.length - 1)
  let y = -total / 2
  sorted.forEach((entry, i) => {
    entry.y = y
    y += heights[i] + ROW_GAP
  })
  return sorted
}

export function template({ id, name, category, blurb, steps, edges = [] }) {
  return {
    id,
    name,
    category,
    blurb,
    // Node/edge count for the palette row — computed once at module load, not
    // per render, and never drifts from the actual graph the way a hand-typed
    // count would.
    size: Object.keys(steps).length,
    build() {
      const idByKey = {}
      const entries = Object.entries(steps).map(([key, step], order) => {
        idByKey[key] = mintId(step.type)
        return { key, step, order, id: idByKey[key] }
      })

      const byCol = new Map()
      for (const entry of entries) {
        const col = entry.step.col ?? 0
        if (!byCol.has(col)) byCol.set(col, [])
        byCol.get(col).push(entry)
      }
      for (const [, colEntries] of byCol) layoutColumn(colEntries)

      // FQ-B — per-column x offsets instead of a flat `col * COL_PITCH`:
      // every rank still gets the normal COL_PITCH UNLESS the column it's
      // leaving contains a Generate step, in which case it gets the wider
      // GENERATE_COL_PITCH instead (see that constant's own comment). A
      // template with no Generate step computes byte-identical x positions
      // to the old flat formula (every gap is COL_PITCH, same as `col *
      // COL_PITCH` naturally produces) — this only changes layouts that
      // actually have a Generate to reserve grid room after.
      const maxCol = Math.max(0, ...entries.map((e) => e.step.col ?? 0))
      const colX = new Map()
      let x = 0
      for (let col = 0; col <= maxCol; col += 1) {
        colX.set(col, x)
        const colSteps = byCol.get(col) || []
        const hasGenerate = colSteps.some((e) => e.step.type === 'generate')
        // HITL MICRO-CHAT — same reservation move as Generate, smaller
        // scale: the check-in card is 440px wide at rest (nodes.css
        // .cw-node--checkin), exactly COL_PITCH, so a flat pitch would
        // butt it against the next column with ZERO air (task cards get
        // 440-340 = 100). Reserve the card plus that same standard air.
        // THE SPLIT — was `hasChatHuman` (a `human` step with `responseType
        // === 'chat'`); the dialogue type is its own `checkin` type now, so
        // this is just a plain type check.
        const hasCheckin = colSteps.some((e) => e.step.type === 'checkin')
        x += hasGenerate ? GENERATE_COL_PITCH : hasCheckin ? 440 + 100 : COL_PITCH
      }

      const nodes = entries.map((entry) => ({
        id: entry.id,
        type: entry.step.type,
        position: { x: colX.get(entry.step.col ?? 0), y: Math.round(entry.y ?? 0) },
        // GATEWAY RUN Phase Q (canvas-workflows half, own PLAN.md documents
        // the contract) — `entry.key` is the step's AUTHORED key from the
        // template's `steps` object (e.g. 'handoff', 'gate') — stable across
        // every `.build()` call, unlike `entry.id` (mintId() above re-rolls a
        // fresh random id every build). Stamped onto `data` (additive; no
        // node component reads it, every existing consumer of `.build()` is
        // unaffected) purely so a `?from=<stepKey>` boot deep-link can find
        // "the real node the gateway run stood at" without needing to know
        // engine-minted ids, which don't exist until build() has already run.
        data: { ...buildData(entry.step), stepKey: entry.key },
        measured: {},
      }))

      const builtEdges = edges.map(([from, to, handle], i) => ({
        id: `edge-tpl${i}-${Math.random().toString(36).slice(2, 6)}`,
        source: idByKey[from],
        sourceHandle: handle ?? 'out',
        target: idByKey[to],
        targetHandle: 'in',
        type: 'omni',
      }))

      return { nodes, edges: builtEdges }
    },
  }
}

// Offset a built graph so it lands where the caller wants it (drop point, or
// clear of whatever is already on the canvas).
export function placeAt(graph, origin) {
  const minX = Math.min(...graph.nodes.map((n) => n.position.x))
  const minY = Math.min(...graph.nodes.map((n) => n.position.y))
  return {
    nodes: graph.nodes.map((n) => ({
      ...n,
      position: { x: n.position.x - minX + origin.x, y: n.position.y - minY + origin.y },
    })),
    edges: graph.edges,
  }
}
