// RUN PHASE — R1 "Run engine + history"
//
// A dependency-injected async graph walker. `createRunner` takes accessors
// for the live node/edge arrays, a way to patch one node's `data`, a
// callback fired every time control crosses an edge, and a generation
// function — and returns `{ run, runFrom, stop, continueHuman, chatWithHuman }`,
// the primitives state.jsx's `runWorkflow` / `runFrom` / `stopRun` /
// `continueHuman` / `chatWithHuman` context functions forward straight into
// (`runFrom` is NODE TOOLBAR V2's "Run from here" — PLAN.md "## NODE TOOLBAR
// V2"; `chatWithHuman` is HITL MICRO-CHAT — PLAN.md "## HITL MICRO-CHAT" —
// see its own comment near `continueHuman` below; both are additions on top
// of the original R1 trio).
// See PLAN.md "## RUN PHASE" -> "### R1" for the full R1 behavior spec; this
// file implements it node type by node type. Nothing here touches the DOM
// or React state directly — every side
// effect goes through the four/five injected callbacks, so state.jsx (the
// only caller) stays the single source of truth for the node/edge arrays and
// owns translating `onEdgePass` into the `cw:run-edge` window event M1's
// OmniEdge listens for (PLAN.md "Graph run schema").
//
// `generate` defaults to the real R3 module (imported directly, per the
// import path handed to this file) but stays a param too, exactly matching
// PLAN's documented factory shape `createRunner({ getNodes, getEdges,
// patchNode, onEdgePass, generate })` — callers never have to pass it, but
// could override it (tests, alternates) without touching this file.
//
// Traversal model: starting at the trigger, each node is walked by the
// recursive `runNode`. A node's own behavior decides which outgoing *handle*
// is "taken" (plain nodes always take `out`; branching nodes — logic
// if/try/switch, and human in choice mode — take exactly one, recorded as
// `data.takenHandle`); `advance` fires `onEdgePass` for the taken handle's
// edges and recurses into them concurrently (`Promise.all` — the "siblings
// run concurrently" fan-out PLAN.md asks for). A `visited` set (reset on
// every `run()` call) guarantees a node fed by multiple incoming edges still
// executes exactly once.
//
// QA FINDINGS LEDGER F4 fix — predecessor-join barrier, dead-branch-aware.
// `advance` also marks every outgoing edge it did NOT just fire as DEAD (the
// untaken side of a branch — or literally every outgoing edge, when the node
// itself never ran at all) and still recurses into those, so DEAD cascades
// downstream exactly like FIRED does. A node with incoming edges now waits
// for every one of them (scoped to this run — see `computeReachable`) to
// settle FIRED-or-DEAD before its own beat starts, and if every one settles
// DEAD, the node never beats at all — it propagates DEAD to its own outgoing
// edges in turn instead. That propagation is what lets a branch-merge node
// resolve instead of hanging forever on a sibling path that was never going
// to fire (`brief`'s human-gate -> {task-revise, output-doc} -> output-doc
// is exactly this shape). It's also what fixes the ordering bug the barrier
// was built for: `studio`'s task-draft, fed by both params-1 (instant) and
// task-research (a real generation beat), now genuinely waits for BOTH to
// settle instead of starting on whichever fires first. `runFrom` (below)
// still never waits on anything upstream of its own scoped entry node — see
// `computeReachable`'s comment for the mechanism that preserves that.
//
// Content-bearing upstream: `generate.js`'s `upstream` contract (PLAN.md
// R3.1) reads `.data.output.content`, falling back to `.data.instructions /
// .description / .ask`. Human nodes only carry `.data.answer` per the run
// schema, which that fallback chain never reads — so left alone, an output
// fed directly by a human node (exactly the audience sample's shape) would
// only ever see the human's *question*, never what the person actually
// answered. Rather than special-case that inside generate.js (R3's file,
// out of this seam), a completed human node also gets a small synthetic
// `data.output = { format:'Text', content: <plain-English answer> }`
// alongside its canonical `data.answer` — same shape task/output nodes
// already produce, so it flows through generate.js's existing extraction
// with no changes there.
//
// ANDREW ROUND — C2 "engine: production events" (PLAN.md "### C — THE
// DARKROOM"). An OUTPUT node's `data.output` gains two fields alongside its
// existing `{format, content}`: `developing` (true the instant the node's
// run-beat starts, false the instant it's done) and `seed` (a deterministic
// number, minted once per node per RUN — see `runCount`/`makeSeed` below —
// that OutputNode.jsx/RunPreview.jsx hand to run/artifacts.jsx to paint the
// same bespoke SVG artifact everywhere it's shown). Both ride piggyback on
// `streamOutput`'s existing per-chunk `output` patches (an `extra` param
// merged into every write) rather than a separate patchNode call, so a fast
// demo generation can never race ahead of "developing:true" landing first —
// `streamOutput`'s very first write, before any await, IS "when the output
// node's beat starts". `cw:artifact` (nodeId, format, seed, number) fires
// once per completed OUTPUT node — `number` is this RUN's 1-based artifact-
// completion order (Output nodes carry no BFS `data.number` per the Graph
// schema, so this is a fresh, more useful count), not a graph position.
// state.jsx's own run-delivered accumulator (CANVAS-NATIVE DELIVERABLES,
// below) is this event's listener now — Filmstrip.jsx, its original and
// only consumer, is gone.
//
// CANVAS-NATIVE DELIVERABLES (PLAN.md "## CANVAS-NATIVE DELIVERABLES") —
// "the canvas IS the record": an OUTPUT node's completion no longer
// REPLACES `data.output`, it APPENDS to `data.versions` too (see the
// 'output' case below) — `data.output` stays the CURRENT-version pointer
// (every existing reader of it keeps working unchanged), `data.versions`
// is the node's own on-canvas run history, capped at 8, that OutputNode.jsx's
// new version rail renders and browses.
//
// BATCH MATRIX (PLAN.md "## BATCH MATRIX") — a batch-flagged output node
// (`data.batchCount: N`, template-set — today only part-a.js's 'Social
// batch ×25') delivers `data.output.assets = [N items]` instead of a single
// artifact, each item seeded off (nodeId, index, runCount) and versioned as
// a WHOLE BATCH per re-run, same append-to-`versions` shape as above — see
// the 'output' case's own BATCH MATRIX comment block for the mechanics.
// That phase also took the results frame off its template-scoped trigger
// flag (default-on for every completed run with ≥1 delivered output); a
// later phase, RESULTS SHEET, retired the free-standing `results` node
// itself along with this file's own `spawnResultsFrame` runner option — see
// createRunner's own header comment further down.
//
// PAIRED DELIVERABLES (PLAN.md "## PAIRED DELIVERABLES") — each batch
// asset item above grows one more field, `copy` (a 1-2 sentence social
// caption, seeded off that same item's own seed), so `assets[i]` is now
// `{seed, aspect, imageUrl?, imageMime?, copy}`. See BATCH_CAPTION_BANK/
// pickBatchCopy/directionFlavor near BATCH_ASPECT_RATIOS and the 'output'
// case's own PAIRED DELIVERABLES comment for the mechanics.

// MODEL-AGNOSTIC POSTURE (PLAN.md "## MODEL-AGNOSTIC POSTURE") — imported
// under `localAdapter` now, not `defaultGenerate`: this IS "adapters.local
// (the dev claude proxy)" per that section's own naming — see the `adapters`
// object below, right where it's put to use. `generationMode` (HITL
// MICRO-CHAT's own addition to this import) is a plain read of gen/
// generate.js's already-resolved real/demo probe — reused, not
// re-implemented, so chatWithHuman's own real-vs-demo branch (below) never
// needs a second probe of its own.
import { generate as localAdapter, generationMode } from '../gen/generate.js'
import { makeSeed, artifactKind } from './artifacts.jsx'
// COMFY ROUND (CP2, item 3) — "SEED DISCIPLINE" fallback, same as state.jsx's
// identical import (data/models.js is the shared, neither-B-nor-C-exclusive
// home for GENERATE's defaults — see that file's own header comment).
import { DEFAULT_GENERATE_SEED } from '../data/models.js'
// FINAL QUEUE — FQ-A "REAL ADAPTERS (local-only truth)" (PLAN.md
// "### FQ-A"). REAL_MODE (src/run/realMode.js) is the single gate both real
// providers this phase adds share; adapters.pollinations
// (src/run/pollinations.js) is the new one this file wires in directly (the
// OTHER real provider, adapters.claudeLocal, is gen/generate.js's own
// existing probe-then-real text path — already reached via `runAdapter`
// below, no new import needed here for it). `artifactKind` is the SAME
// format+seed -> {poster|social|video|deck|...} bucketing run/artifacts.jsx
// already uses to pick which SVG study to draw — reused (not duplicated)
// here so a real photo's requested aspect always agrees with whichever kind
// the SVG fallback would have drawn for the exact same format+seed.
import { REAL_MODE } from './realMode.js'
import { fetchPollinationsImage } from './pollinations.js'
// WAVE 4 — THE VERB EXPANSION. Run workflow's own beat needs the REAL
// template catalog to derive its "N steps, M deliverables" line off the
// actually-selected template's real graph — same neither-B-nor-C-exclusive
// data-module precedent DEFAULT_GENERATE_SEED just above already is (this
// file already reads data/* directly; data/templates/index.js is no
// different).
import { TEMPLATES } from '../data/templates/index.js'

const BASE_BEAT_MS = 300 // every node's queued -> running beat (PLAN.md R1.1)
const CONSIDER_MS = 700 // if/try's "considering" pause before branching
const WAIT_MS = 1200 // wait node's fixed demo countdown, regardless of configured amount
// NODE TOOLBAR V2 — "Skip (bypass)": types the run treats as instant pass-
// through when `data.skipped` is set. Logic/trigger are deliberately absent
// (the toolbar's own Skip button is disabled for both — shared.jsx's
// SKIP_DISABLED_TYPES, duplicated with a pointer comment, matching this
// codebase's own established convention for a small cross-file constant
// that isn't worth a shared module — see e.g. GENERATE_DEVELOP_MS above)
// so this set never needs a branch-routing story for either.
// WAVE 3 — THE VERB EXPANSION. Remix joins the same "real beat, real
// content, genuinely bypassable" family — an ordinary in+out action node
// on the same footing as task/generate/wait/output above, not a structural
// join/branch node like Compare (which stays excluded via the SAME 'logic'
// blanket rule Gather/Split already inherit — shared.jsx's own
// SKIP_DISABLED_TYPES comment: "routing ambiguity is worse than the
// limitation," applied to the whole `logic` type, not just branchy kinds).
// WAVE 4 — THE VERB EXPANSION. Handoff joins for the reason the master
// spells out explicitly ("Skip allowed") — it's a pause, not a branch, so
// there's no routing ambiguity to worry about (same single 'out' either
// way). Localize/Optimize/Run workflow join the identical "ordinary in+out
// action, genuinely bypassable" family Remix just established — none of the
// three are structural/branching, and none are "always instant pass-
// through" like params/source/audience, so the same default applies.
// Guardrail stays excluded via the SAME blanket 'logic' rule (it's a new
// `kind` on that type, not a new type of its own — shared.jsx's own comment
// above still holds unchanged).
const SKIPPABLE_TYPES = new Set(['task', 'generate', 'wait', 'output', 'remix', 'handoff', 'localize', 'optimize', 'runworkflow'])
// WAVE 2 — THE VERB EXPANSION. Mirrors shared.jsx's own isSkipDisabled
// split: Measure (signal kind 'measure') is a real run participant like
// task/generate/wait/output above, so it can be skipped exactly like those;
// source/audience (the OTHER two 'signal' kinds) stay excluded — same
// "always passes through" reasoning as params, which was never added here
// either. SKIPPABLE_TYPES can't express a kind-level split by itself since
// all three share node.type 'signal'.
function isSkippable(node) {
  if (node.type === 'signal') return (node.data?.kind || 'source') === 'measure'
  return SKIPPABLE_TYPES.has(node.type)
}
// VARIANT STUDIO — how long a GENERATE node's own poster "develops" before
// the beat completes; close to (not tied to) run/posters.jsx's 1.6s CSS
// blur-in so the runState:'done' stamp lands roughly when the art settles.
const GENERATE_DEVELOP_MS = 1500
const ABORTED = Symbol('aborted') // waitForHuman's abort sentinel — distinguishes "stopped" from a real answer

// SUBGRAPHS — full spec (PLAN.md "## SUBGRAPHS" -> "### Run integration"):
// "a task with steps subdivides its beat evenly across steps in topological
// order... via the adapter-agnostic beat, no adapter contact." STEP_TOTAL_MS
// is a FIXED window this cascade always spans, independent of how long the
// task's own real content stream (runAdapter, below) actually takes — steps
// carry no generation of their own to time against, so they get their own
// self-contained rhythm instead of trying to slave to a stream length that
// isn't known until it's over. Chosen close to gen/generate.js's own
// DEMO_TOTAL_MS window (600-1400ms) so a step cascade and the task's real
// content typically settle around the same moment without the two ever
// needing to literally coordinate.
const STEP_TOTAL_MS = 900
const STEP_MIN_SLICE_MS = 220 // floor so a task with many steps never flickers past legibility

// Kahn's-algorithm topological order over a steps mini-graph (task.data.
// steps — PLAN.md "### Model"). Steps are authored as a simple line in v1
// (the seed trio, and every ghost-add extends one end of it), but this
// still resolves a sane order for a hypothetical branchier one instead of
// assuming exactly one predecessor per step: nodes with no unresolved
// incoming edge are appended as they free up, same "process what's ready"
// shape `advance`'s own BFS-ish walk above already uses for the main graph.
// Any node the walk never reaches (disconnected, or a cycle no real UI here
// can author) is still appended once, in authored array order, so this is
// always a total order over every step — no step silently skipped.
function topoOrderSteps(steps) {
  const nodes = steps?.nodes || []
  const edges = steps?.edges || []
  const inDegree = new Map(nodes.map((n) => [n.id, 0]))
  const outAdjacency = new Map(nodes.map((n) => [n.id, []]))
  edges.forEach((e) => {
    if (!outAdjacency.has(e.source) || !inDegree.has(e.target)) return
    outAdjacency.get(e.source).push(e.target)
    inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1)
  })
  const queue = nodes.filter((n) => (inDegree.get(n.id) || 0) === 0).map((n) => n.id)
  const order = []
  const seen = new Set()
  while (queue.length) {
    const id = queue.shift()
    if (seen.has(id)) continue
    seen.add(id)
    order.push(id)
    for (const nextId of outAdjacency.get(id) || []) {
      inDegree.set(nextId, (inDegree.get(nextId) || 0) - 1)
      if (inDegree.get(nextId) <= 0 && !seen.has(nextId)) queue.push(nextId)
    }
  }
  nodes.forEach((n) => {
    if (!seen.has(n.id)) {
      seen.add(n.id)
      order.push(n.id)
    }
  })
  return order
}

// Runs the queued/running/done cascade across a task's own steps, patching
// `data.steps.nodes[i].runState` on the OWNING TASK (never a standalone
// node of its own — steps aren't real graph nodes) — "each step gets
// runState queued/running/done patched into steps.nodes... parent gauge/
// stamps unchanged" (PLAN.md). `patchNode` is this file's own adapter-
// agnostic injected callback (same one every other case in runNode already
// uses); nothing here ever calls `runAdapter`/`generate` — "no adapter
// contact" holds structurally, not just by convention. "Steps NEVER pause"
// (PLAN.md) — no branch here ever awaits a human/external signal, every
// step just walks its own fixed-duration sub-beat regardless of kindTag.
async function runTaskStepBeats(nodeId, initialSteps, patchNode, signal) {
  const order = topoOrderSteps(initialSteps)
  if (!order.length) return
  const slice = Math.max(STEP_MIN_SLICE_MS, Math.round(STEP_TOTAL_MS / order.length))
  let working = initialSteps.nodes.map((n) => ({ ...n, runState: 'idle' }))
  const commit = () => patchNode(nodeId, { steps: { ...initialSteps, nodes: working } })
  const setState = (stepId, runState) => {
    working = working.map((n) => (n.id === stepId ? { ...n, runState } : n))
    commit()
  }
  commit()
  for (const stepId of order) {
    if (signal.aborted) return
    setState(stepId, 'queued')
    await delay(Math.round(slice * 0.35), signal)
    if (signal.aborted) return
    setState(stepId, 'running')
    await delay(Math.round(slice * 0.65), signal)
    if (signal.aborted) return
    setState(stepId, 'done')
  }
}

// Timer that also resolves (early, without rejecting) if `signal` aborts
// mid-wait, and cleans its own listener up either way.
function delay(ms, signal) {
  if (signal.aborted) return Promise.resolve()
  return new Promise((resolve) => {
    let timer
    const onAbort = () => {
      clearTimeout(timer)
      resolve()
    }
    timer = setTimeout(() => {
      signal.removeEventListener('abort', onAbort)
      resolve()
    }, ms)
    signal.addEventListener('abort', onAbort, { once: true })
  })
}

// Plain-English gloss of a human/checkin node's answer — see the file header
// note on content-bearing upstream. THE SPLIT — checkin gets its own gloss
// (a check-in never branches, so there's no "chose" case to consider);
// choice mode reports the option's label (falling back to the raw id) on a
// classic gate; free text is reported as-is on either.
// THE AGENT ASKS (PLAN.md "## THE AGENT ASKS", item 1: "data.ask: ignored
// everywhere") — a check-in's own gloss no longer quotes `node.data.ask` (it
// has nothing authoritative to quote any more; the agent's opener already
// carries the real question, and re-reading it here would just echo stale
// template/loaded data). The classic GATE below is untouched — it still
// keeps its own authored `ask`.
function humanAnswerContent(node, value) {
  if (node.type === 'checkin') {
    return `Checked in — ${value}`.trim()
  }
  const ask = node.data?.ask ? `"${node.data.ask}" — ` : ''
  const isChoice = node.data?.responseType === 'choice'
  if (isChoice) {
    const option = (node.data?.options || []).find((o) => o.id === value)
    return `Human chose: ${option?.label || value}`
  }
  return `Human answered ${ask}${value}`.trim()
}

// HITL MICRO-CHAT (PLAN.md "## HITL MICRO-CHAT") — originally scoped to
// data/templates/part-b.js's always-on-engine `review` node as the ONLY
// human node this ever fired for (Bryan's own scope guard, PLAN.md
// verbatim: "i only want to apply it to the always on content engine
// template to start"). BATCH MATRIX (PLAN.md "## BATCH MATRIX") widened
// that by ONE: part-a.js's 'Social batch ×25' template also authored a
// `responseType: 'chat'` human step ("a HITL step (demos the node sheet)"
// — its own contract, verbatim). THE SPLIT (PLAN.md "## THE SPLIT") gave
// this whole dialogue path its own node TYPE instead — both of those steps
// are now `type: 'checkin'`, and the branch point below is `case
// 'checkin':` (this file's own switch, keyed on node.type), not a
// `data.responseType === 'chat'` read anymore. See `chatWithHuman` further
// down for the live conversation itself.
//
// CHAT_OPENER_TEXT is the LAST-RESORT opener — seeded into `chatLog`
// verbatim the instant a check-in node pauses, when nothing more specific is
// available (PLAN.md "## HITL MICRO-CHAT": "seed chatLog with ONE agent
// opener referencing the draft"). It never runs through chatDemoReply below
// since there's no user turn yet to acknowledge — a fixed line is exactly
// right here, the same footing humanAnswerContent's own fixed "Human
// answered" prefix already holds just above.
//
// THE AGENT ASKS (PLAN.md "## THE AGENT ASKS", item 2) retired the OLD
// two-tier "data.chatOpener override, else this fixed default" story in
// favor of a real priority chain — see `checkinOpener`/`checkinSourceText`
// (closure functions, below `upstreamOf`, since they need live edge/node
// lookups this module scope doesn't have): data.guidance -> the nearest
// upstream node's own instructions/title -> data.chatOpener -> THIS fixed
// line, in that order. An AUTHORED `chatOpener` still wins outright over a
// derived guess (item 3: "chatOpener stays — it IS the agent's question") —
// it just no longer sits ahead of guidance/upstream context, which are
// closer to "what's actually happening in this run" than a line written at
// template-authoring time ever could be.
const CHAT_OPENER_TEXT = "Draft's in — want to adjust anything before it queues?"

// AGENT-LED CHIPS (PLAN.md "## AGENT-LED CHIPS — the check-in offers, the
// builder never authors") — "the CHECK-IN's chips are the AGENT's own
// proposals," not a builder-authored row. THE AGENT ASKS (PLAN.md
// "## THE AGENT ASKS", item 2) re-sourced what text feeds this: no more
// `data.ask` (retired outright — item 1, "ignored everywhere"). The keyword
// match itself is unchanged, just fed by `checkinSourceText`'s priority
// chain instead of a single static field (a real provider adapter would
// generate opener + options live off actual run context; the demo derives
// both from the same keyword bank, so the seam stays honest either way).
// Each entry also carries its own `opener` line — THE AGENT ASKS' "the
// opener... can shape... lightly" reuses the SAME bank rather than
// maintaining a second one. THE SPLIT's authored `data.options` editor is
// gone from CheckinNode.jsx's rest face — there is nothing left to exclude,
// so the old `exclude` param and its authoredOptionLabels() helper stay
// retired.
const CHECKIN_INTENT_BANK = [
  {
    test: /direction|tone|style/,
    trio: ['Punchy and bold', 'Clean and minimal', 'Warm and human'],
    opener: 'Before this moves forward — what direction should it take?',
  },
  {
    test: /review|draft|queue/,
    trio: ['Ship it as-is', 'Punch up the headline', 'Swap the asset'],
    opener: "Here's where the draft stands — anything to adjust before it queues?",
  },
  {
    test: /brief|scope|plan/,
    trio: ['Tighten the scope', 'Expand the brief', 'Keep it as planned'],
    opener: "Let's confirm the scope before this kicks off — sound right?",
  },
]
// The chat hat's own suggestion chips (PLAN.md: "seed chatOptions (3-4,
// contextual)... refreshes after each agent reply"). The generic bank below
// is FALLBACK/FILLER only now — it tops the intent-derived trio up to
// `count` (or stands in alone when no intent matches), picked
// deterministically off a seed via the SAME "no Math.random, plain modulo
// pick" idiom REMIX_MARKETS/OPTIMIZE_ACTIONS/GUARDRAIL_CHECK_OPTIONS already
// use above.
const CHAT_OPTION_BANK = [
  'Looks good — approve it',
  'Tighten the headline',
  'Make it warmer',
  'Show me an alternative',
  'Make it punchier',
  'Trim the copy down',
  'Add a stronger CTA',
  'Try a different angle',
]
// Keyword-matches `text` against CHECKIN_INTENT_BANK (first match wins — the
// bank's entries are deliberately non-overlapping vocabulary); returns null
// when nothing matches so callers fall through to their own next tier (a
// generic trio-less chip fill for pickChatOptions, CHAT_OPENER_TEXT for
// checkinOpener).
function checkinIntentEntry(text) {
  const lower = String(text || '').toLowerCase()
  return CHECKIN_INTENT_BANK.find((e) => e.test.test(lower)) || null
}
function pickChatOptions(seed, sourceText, count = 4) {
  const trio = checkinIntentEntry(sourceText)?.trio || []
  const pool = CHAT_OPTION_BANK.filter((opt) => !trio.includes(opt))
  const out = [...trio]
  for (let i = 0; out.length < count && i < pool.length; i++) {
    const opt = pool[(seed + i) % pool.length]
    if (!out.includes(opt)) out.push(opt)
  }
  return out.slice(0, count)
}

// LIVE LEANING (PLAN.md "## LIVE LEANING — the agent reads the branches,
// the wires follow the talk") — "OPENER READS THE SETUP: a choice gate's
// opener acknowledges the AUTHORED options BY NAME and offers a seeded
// recommendation beat... Works for 2..N options, any labels (compose from
// data.options, never hardcode the batch trio)." Everything below is
// template-agnostic on purpose — no reference to Punchy/Clean/Warm or any
// other authored label, only to `node.data.options` at call time.
//
// English list-join, Oxford comma at 3+ ("A, B, and C"; "A and B" at
// exactly two) — the same shape the contract's own example line uses.
function joinLabels(labels) {
  if (labels.length <= 1) return labels[0] || ''
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`
  return `${labels.slice(0, -1).join(', ')}, and ${labels[labels.length - 1]}`
}
const COUNT_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten']
function countWord(n) {
  return COUNT_WORDS[n] || String(n)
}

// The seeded recommendation bank — "a small bank... references one or two
// options concretely." Every entry is a `(lead, other) => string` template;
// some only ever use `lead` (a single-option callout), the rest use both —
// PLAN.md's own example line ("{A} tends to earn the tap first; {C} wears
// better across a week...") is entry 0 here, near-verbatim. `lead`/`other`
// are always two DISTINCT labels off the gate's own `data.options` (see
// composeChoiceOpener below) — never the literal batch trio, so this reads
// naturally against a 2-option gate or a 5-option one exactly the same way.
const CHOICE_RECO_BANK = [
  (lead, other) => `${lead} tends to earn the tap first; ${other} wears better across a week — worth leading ${lead} and keeping ${other} for the follow-ups?`,
  (lead, other) => `Early read: ${lead} probably earns the most attention out of the gate — worth leading with it and holding ${other} in reserve?`,
  (lead, other) => `${lead} is the safer opener; if it stalls, ${other} is the natural pivot to try next.`,
  (lead, other) => `Between these, ${lead} edges it for a cold audience — keep ${other} close for the A/B.`,
  (lead) => `${lead} feels like the one to lead with here — want to weight the batch toward it?`,
  (lead, other) => `My instinct: open with ${lead}, then let ${other} carry the retarget wave.`,
  // The "drop one, run it separately" shape (Bryan: "recco the human drop
  // clean and minimal from this one and try it in another run") — the
  // agent sometimes advises SHRINKING this run rather than just ordering
  // it: pull an option out here and give it a clean read of its own.
  (lead, other) => `Honest take: ${other} might muddy this batch — worth dropping it from this one and trying it in a separate run where it can get a clean read?`,
  (lead, other) => `${lead} and ${other} are pulling in different directions here. I'd drop ${other} from this run and spin it up on its own next time.`,
]

// "template-agnostic composition, e.g. 'You've set this up three ways —
// {A}, {B}, {C}. {reco}'" — the whole opener, seeded off (nodeId, runCount)
// exactly like every other per-node-per-run pick in this file (makeSeed).
// Falls back to the plain authored `ask` (THE GATE NEGOTIATES' own
// contract, untouched) whenever there's nothing to compose from — fewer
// than 2 labeled options, or no ask either.
function composeChoiceOpener(ask, options, seed) {
  const labels = (options || []).map((o) => (o?.label || '').trim()).filter(Boolean)
  const trimmedAsk = (ask || '').trim()
  if (labels.length < 2) return trimmedAsk || 'Which way should this go?'
  const leadIdx = Math.floor(seed / CHOICE_RECO_BANK.length) % labels.length
  const otherIdx = (leadIdx + 1) % labels.length
  const reco = CHOICE_RECO_BANK[seed % CHOICE_RECO_BANK.length](labels[leadIdx], labels[otherIdx])
  const setup = `You've set this up ${countWord(labels.length)} ways — ${joinLabels(labels)}. ${reco}`
  return trimmedAsk ? `${trimmedAsk} ${setup}` : setup
}

// "NEGOTIATION STEERS A LEANING: ...the engine keyword-matches the message
// against the option LABELS (word-piece, case-insensitive)". A "word piece"
// is any label word of >=3 letters minus a short stopword list (so "Warm
// AND Human" never spuriously matches on "and"); a hit is a plain
// lowercased substring test — deliberately loose enough that "actually
// warmer" still matches the "Warm and human" piece "warm" (substring, not
// whole-word), same looseness PLAN.md's own two verify turns ("lets go
// punchy" / "actually warmer") rely on. First option (in authored order)
// with any matching piece wins — deterministic, no seed needed here since
// this reads the user's own real text, not a demo pick.
const LEANING_STOPWORDS = new Set(['and', 'the', 'a', 'an', 'or', 'for', 'with', 'to', 'in', 'on', 'of', 'is', 'it'])
function labelPieces(label) {
  return String(label || '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 3 && !LEANING_STOPWORDS.has(w))
}
function matchLeaningOption(text, options) {
  const lower = String(text || '').toLowerCase()
  for (const opt of options || []) {
    if (labelPieces(opt?.label).some((piece) => lower.includes(piece))) return opt.id
  }
  return null
}

// COACHING CHIPS (PLAN.md "## COACHING CHIPS — the gate's chips advise, the
// leaning decides") — "the gate's chip row stops parroting the authored
// options (they're already the branches AND named in the opener) and
// becomes the agent's IMPROVEMENT recommendations." A second, DISTINCT bank
// from CHOICE_RECO_BANK above: that one voices the OPENER's single
// scene-setting line; this one voices a ROW of independently-clickable
// suggestions, each composed to be sent as its own chatWithHuman turn (never
// a resolve action — HumanNode.jsx wires these as neutral SEND chips, same
// family as the check-in's own agent-offered row). Amendment (1), Bryan,
// "the options that is": every entry here addresses the OPTION SET itself —
// drop / lead-and-hold / tighten / split / defer / merge / reorder / call
// out a missing direction — never vague per-node advice, and never the
// bare option names the old decision chips repeated. `lead`/`other` are
// always two DISTINCT authored labels (composeChoiceOpener's own precedent)
// — generic on purpose, so this reads naturally against a 2-option gate or
// a 5-option one alike; `labels` (the full authored list) is passed too for
// the couple of shapes that reason about the SET's size rather than any one
// pair.
const CHIP_RECO_BANK = [
  (lead, other) => `Drop ${other} — give it its own run.`,
  (lead, other) => `Lead with ${lead}, hold ${other} for retargets.`,
  (lead, other, labels) =>
    labels.length > 2 ? `Tighten to two directions — drop ${other}.` : `Tighten this to one clear lead — ${lead}.`,
  (lead, other) => `Split ${other} into its own A/B.`,
  (lead, other) => `Swap ${other} in only for the follow-up wave.`,
  (lead, other) => `Merge ${lead} and ${other} — they're reading the same.`,
  (lead, other) => `Reorder — put ${other} first, ${lead} second.`,
  (lead, other) => `Defer ${other} to a later wave — it's not pulling weight yet.`,
  (lead, other, labels) =>
    labels.length <= 2 ? `This could use a third direction — worth adding one?` : `Missing a direction here? Worth adding a fourth before you run this.`,
]

// Composes the chip ROW itself — "seeded + refreshed after each reply,
// never duplicating the opener's own reco verbatim (vary by seed offset)."
// Both call sites (the pause-seed in `case 'human':` and the per-turn
// refresh in `chatWithHuman`, below) mint `seed` off a KEY DISTINCT from
// whatever composeChoiceOpener used on the same beat (a `:coaching` /
// `:coaching:${turnIndex}` suffix vs. the opener's bare nodeId/turn key) —
// that alone guarantees this walks CHIP_RECO_BANK at a different offset
// than the opener walked CHOICE_RECO_BANK, and since the two banks are
// entirely separate arrays of differently-shaped strings, there is no
// literal-duplication path even when both seeds land on nominally
// "the same" index. The `seen` set below is a second, cheap pass against
// duplicates WITHIN the row itself — offset-stepping through nine bank
// entries rarely repeats, but a 2-option gate's tiny (lead, other) pool can
// still land the same entry twice on an unlucky seed.
function pickCoachingChips(seed, options, count = 3) {
  const labels = (options || []).map((o) => (o?.label || '').trim()).filter(Boolean)
  if (labels.length < 2) return []
  const out = []
  const seen = new Set()
  for (let i = 0; out.length < count && i < CHIP_RECO_BANK.length; i++) {
    const idx = (seed + i) % CHIP_RECO_BANK.length
    const leadIdx = Math.floor((seed + i) / CHIP_RECO_BANK.length) % labels.length
    const otherIdx = (leadIdx + 1) % labels.length
    const text = CHIP_RECO_BANK[idx](labels[leadIdx], labels[otherIdx], labels)
    if (!seen.has(text)) {
      seen.add(text)
      out.push(text)
    }
  }
  return out
}

// COACHING CHIPS amendment 3 (PLAN.md "### COACHING CHIPS amendment 3") —
// Bryan: "make it in the chat show what it will look like after its
// updated in its replys." A structured AFTER-preview riding on the SAME
// reply a drop/merge/split/reorder-shaped coaching-chip turn already gets
// (chatWithHuman, below) — HumanNode.jsx renders it as a quiet mini-panel
// inside that agent bubble. `detectProposalKind` matches straight off the
// INCOMING message's literal wording, copied verbatim from CHIP_RECO_BANK's
// own template output above (never a second hand-authored wording) — "the
// reco text and the proposal must agree" is true BY CONSTRUCTION this way,
// not by keeping two sources in sync by hand. Only the four named shapes
// (drop / merge / split / lead-reorder) ever produce a proposal — the
// "Tighten to two directions" branch of CHIP_RECO_BANK's own tighten entry
// literally says "drop" and folds into that bucket; its <=2-option sibling
// branch ("Tighten this to one clear lead") is its own `keep-only` shape
// (drops every OTHER option instead of one named one). Swap-in-for-the-
// follow-up, Defer, and the missing-direction callout are deliberately
// EXCLUDED — none of the four named categories, so they stay a plain lean
// acknowledgment with no panel; so does any organic typed message, since
// none of these prefixes occur in ordinary reviewer text.
function detectProposalKind(text) {
  if (/^Tighten this to one clear lead — /.test(text)) return 'keep-only'
  if (/^Merge /.test(text)) return 'merge'
  if (/^(Lead with |Reorder — put )/.test(text)) return 'reorder'
  if (/^(Drop |Tighten to two directions — drop |Split )/.test(text)) return 'drop'
  return null
}

// Builds `{ options, removed }` — both arrays of LABELS — off whichever
// authored labels the message text actually mentions, ordered by where
// each FIRST APPEARS IN THE TEXT (not authored order), so 'merge'/
// 'reorder' can tell which mentioned label reads first grammatically
// ("Lead with {lead}..." vs. "Reorder — put {other} first..." both resolve
// correctly off text position alone, no template-specific branching
// needed here). Returns null when the kind's own minimum mention count
// isn't met (defensive — every CHIP_RECO_BANK shape that reaches here
// always mentions enough labels in practice, since it minted this exact
// text from `options` in the first place).
function buildProposal(kind, text, options) {
  const labels = (options || []).map((o) => (o?.label || '').trim()).filter(Boolean)
  const mentioned = labels
    .map((label) => ({ label, at: text.indexOf(label) }))
    .filter((m) => m.at !== -1)
    .sort((a, b) => a.at - b.at)
    .map((m) => m.label)
  if (!mentioned.length) return null
  if (kind === 'drop') {
    const removed = [mentioned[0]]
    return { options: labels.filter((l) => l !== removed[0]), removed }
  }
  if (kind === 'keep-only') {
    const kept = mentioned[0]
    return { options: [kept], removed: labels.filter((l) => l !== kept) }
  }
  if (kind === 'merge') {
    if (mentioned.length < 2) return null
    const removed = [mentioned[1]]
    return { options: labels.filter((l) => l !== removed[0]), removed }
  }
  if (kind === 'reorder') {
    if (mentioned.length < 2) return null
    const rest = labels.filter((l) => !mentioned.includes(l))
    return { options: [...mentioned, ...rest], removed: [] }
  }
  return null
}

// PLUS IS ATTACH (PLAN.md "## PLUS IS ATTACH — the composer's + opens the
// attach menu") — the far side of nodes/shared.jsx's `encodeChatAttachment`
// bridge (that file's own header comment on `CW_ATTACH_MARKER` has the full
// reasoning: state.jsx's `chatWithHuman` wrapper is a fixed two-arg
// pass-through off this phase's file grant, so the attach menu's picked
// attachment rides inside the `text` string itself, behind a marker
// character no organic reply starts with). Duplicated here rather than
// imported — a "pure" run-engine module pulling in a component file would
// be backwards; same marker string, same disciplined-mirror call shared.jsx
// itself documents.
const CW_ATTACH_MARKER = '␞'
function decodeChatAttachment(raw) {
  if (!raw.startsWith(CW_ATTACH_MARKER)) return { text: raw, attachment: null }
  const rest = raw.slice(CW_ATTACH_MARKER.length)
  const end = rest.indexOf(CW_ATTACH_MARKER)
  if (end === -1) return { text: raw, attachment: null }
  try {
    return { text: rest.slice(end + CW_ATTACH_MARKER.length), attachment: JSON.parse(rest.slice(0, end)) }
  } catch {
    return { text: raw, attachment: null }
  }
}

// Item 3 — "engine reply ACKNOWLEDGES the specific attachment (seeded per
// kind — 'Got the reference — pulling palette and pacing from it'; run-
// asset: references its number)." Two banks, template functions same shape
// as every other seeded bank in this file (CHIP_RECO_BANK etc.) — picked
// deterministically off (nodeId, turnIndex, runCount), never Math.random.
const ATTACH_UPLOAD_ACK_BANK = {
  Image: [
    (name) => `Got the reference — pulling palette and pacing from ${name}.`,
    (name) => `Nice pull — keeping ${name} in frame while I work.`,
    (name) => `Thanks — using ${name} as the visual anchor here.`,
  ],
  File: [
    (name) => `Got ${name} — pulling structure and tone from it.`,
    (name) => `Thanks, reading through ${name} now.`,
    (name) => `Got it — folding ${name} into the brief.`,
  ],
}
const ATTACH_RUN_ACK_BANK = [
  (numLabel) => `Referencing ${numLabel} — I'll keep pace with its direction here.`,
  (numLabel) => `Got it — pulling cues from ${numLabel}.`,
  (numLabel) => `Working off ${numLabel} from here on.`,
]
// `attachmentLabel` — same "07 · Graphic" formula as shared.jsx's own
// export of the identical name (duplicated for the same reason
// decodeChatAttachment is: no import across the engine/component boundary).
function attachmentLabel(attachment) {
  return attachment.kind === 'run' ? `${String(attachment.number).padStart(2, '0')} · ${attachment.format}` : attachment.name
}
function composeAttachmentAck(seed, attachment, leanLabel) {
  let base
  if (attachment.kind === 'run') {
    base = ATTACH_RUN_ACK_BANK[seed % ATTACH_RUN_ACK_BANK.length](attachmentLabel(attachment))
  } else {
    const bank = ATTACH_UPLOAD_ACK_BANK[attachment.subKind] || ATTACH_UPLOAD_ACK_BANK.File
    base = bank[seed % bank.length](attachment.name || 'the file')
  }
  // Item 4 — the cheap leaning nudge, woven into the SAME reply rather than
  // a second bolted-on sentence with its own voice.
  return leanLabel ? `${base} Leaning ${leanLabel} to match it — say the word if you want to switch.` : base
}

// DEMO mode's own scripted replies (PLAN.md, verbatim: "Demo replies:
// seeded (node seed + turn index), 1-3 sentences, they ACKNOWLEDGE the
// user's ask concretely — never generic filler"). Keyword-matched against
// the reviewer's own lowercased text first, so a recognizable creative
// direction ("make it warmer", "tighten this up") gets a reply that
// genuinely engages with it; `seed` only breaks ties when more than one
// intent phrase matches the same message, so a re-run of the identical
// conversation stays fully deterministic — same non-negotiable every other
// demo generator in this file already holds.
//
// THE AGENT ASKS (PLAN.md "## THE AGENT ASKS", item 4 — "the robotic-repeat
// nit, ## THE CHAT BOX NODE report") — each entry now carries TWO reply
// lines instead of one. `chatDemoReply` picks between them off `turnIndex`
// itself (not `seed`, which already folds turnIndex into a hash and isn't
// guaranteed to alternate): consecutive user turns always carry consecutive
// integer indices, and consecutive integers land on different array slots
// under any modulo >= 2, so two back-to-back turns matching the SAME intent
// can never read the identical line twice in a row. Still fully
// deterministic (no Math.random) — a re-run of the identical conversation
// picks the identical variant at the identical turn, same non-negotiable
// every other demo generator here holds.
const CHAT_INTENT_BANK = [
  { test: /warm|friendl|casual|human(ize)?|softer/, replies: [
    () => "Warmer, got it — I'll soften the tone and make it read more conversational.",
    () => "Even warmer this round — I'll keep easing the tone on the next pass.",
  ] },
  { test: /tight|short|trim|cut|concise|shorten/, replies: [
    () => "Tightening it up — I'll cut the padding and get straight to the point.",
    () => "Trimming it further — I'll keep cutting until it's lean.",
  ] },
  { test: /punch|energ|bold|stronger|pop/, replies: [
    () => "More punch, noted — I'll sharpen the verbs and raise the energy.",
    () => "Pushing the energy further — I'll raise the pace again this pass.",
  ] },
  { test: /headline|title|hook/, replies: [
    () => "On the headline — I'll try a sharper hook and bring you a couple of options.",
    () => "Another pass on the headline — here's a different angle on the hook.",
  ] },
  { test: /alternative|different|another|option|variant|version/, replies: [
    () => "Sure — I'll draft an alternative take so you've got something to compare.",
    () => "Another alternative coming up — I'll keep this one distinct from the last.",
  ] },
  { test: /cta|call.to.action|link|button/, replies: [
    () => "Good catch — I'll make the call-to-action clearer and easier to spot.",
    () => "Sharpening the CTA again — I'll make it even harder to miss.",
  ] },
  { test: /approve|good|great|ship|perfect|go ahead|queue it|as.is/, replies: [
    () => "Great — I'll leave it as-is and queue it for the next step.",
    () => "Confirmed — holding it steady and moving it along.",
  ] },
  // HITL SPRING-OPEN — covers the authored "Swap the asset" chip
  // (part-b.js's always-on-engine review node) concretely; nothing above
  // matches "swap"/"asset" on their own.
  { test: /swap|asset|stock|different (image|photo|graphic)/, replies: [
    () => "Swapping the asset — I'll source an alternative that fits the post.",
    () => "Swapping again — I'll bring in a fresh option that fits better.",
  ] },
]
// Falls through here when the reviewer's text matches none of the intents
// above — still concrete (quotes what they actually typed, and notes it's
// going into the draft) rather than a deflecting "got your message" filler
// line. `turnIndex` picks the reply VARIANT within whichever intent `seed`
// selects (see the bank's own header comment above).
function chatDemoReply(draftText, userText, seed, turnIndex) {
  const text = String(userText || '').trim()
  const lower = text.toLowerCase()
  const matches = CHAT_INTENT_BANK.filter((entry) => entry.test.test(lower))
  if (matches.length) {
    const entry = matches[seed % matches.length]
    return entry.replies[turnIndex % entry.replies.length]()
  }
  const quote = text.length > 70 ? `${text.slice(0, 69)}…` : text
  // Avoid a doubled-up terminator ('...instead?.') when the reviewer's own
  // text already ends in sentence punctuation — the closing quote mark is
  // enough on its own in that case.
  const quotePunct = /[.!?…]$/.test(quote) ? '' : '.'
  const draftNote = draftText ? " I'll work it into the draft now." : ' I\'ll fold that in on the next pass.'
  return quote ? `Got it — "${quote}${quotePunct}"${draftNote}` : `Noted.${draftNote}`
}

// REAL mode's own small prompt assembly — used only when runChatAdapter
// (below, inside createRunner) finds the dev claude proxy actually
// reachable (`generationMode() === 'real'`). Mirrors gen/generate.js's own
// `buildPrompt` shape (a synthetic node's `data.instructions` carries this,
// so that file's existing `data.instructions || data.description ||
// data.ask` brief-extraction reads it completely unchanged — no edit to
// that file needed) but folds in the last few chat turns so the proxy
// answers the ACTUAL conversation, not just a static field.
//
// THE AGENT ASKS item 1 retired `data.ask` — `openerText` (the caller's own
// `chatLog[0].text`, already resolved through checkinOpener's own priority
// chain at pause time) stands in as the "what's this conversation actually
// about" framing instead.
function chatRealPrompt(node, chatLog, openerText) {
  const opener = openerText || 'Review the draft before it queues.'
  const recent = chatLog
    .slice(-6)
    .map((m) => `${m.role === 'user' ? 'Reviewer' : 'Agent'}: ${m.text}`)
    .join('\n')
  return `You are reviewing a draft with a human editor. Opening question: "${opener}".\n\nConversation so far:\n${recent}\n\nRespond to the reviewer's latest message directly and concretely, in 1-3 sentences — no preamble.`
}

// WAVE 2 — THE VERB EXPANSION. Plain-English content per signal kind, same
// "gloss" precedent as humanAnswerContent just above. Keyed on the SAME
// `sourceKind` value strings SignalNode.jsx's own SOURCE_KIND_OPTIONS
// defines (duplicated here with a pointer comment, not imported — this
// file has no reach into nodes/*, per the cross-seam contract) — reads the
// LIVE data.ref (whatever the user has it set to right now), not the
// kind's own static default, so an edited reference shows up in the run
// narrative exactly like it shows on the card.
const SOURCE_KIND_INGEST = {
  brief: (ref) => `Loaded brief "${ref}".`,
  'asset-folder': (ref) => `Indexed assets in ${ref}.`,
  sheet: (ref) => `Synced rows from ${ref}.`,
  'trend-feed': (ref) => `Pulled signals from ${ref}.`,
  'meeting-notes': (ref) => `Summarized ${ref}.`,
}
function sourceIngestLine(data) {
  const kind = data?.sourceKind || 'brief'
  const ref = data?.ref || 'source'
  const fn = SOURCE_KIND_INGEST[kind] || SOURCE_KIND_INGEST.brief
  return fn(ref)
}
function audienceSummaryLine(data) {
  const segments = Array.isArray(data?.segments) ? data.segments.map((s) => s.label).filter(Boolean) : []
  if (!segments.length) return 'No segments defined.'
  return `Audience: ${segments.join(', ')}.`
}
// WAVE 3 — THE VERB EXPANSION. Style Reference's own "instant beat" content
// line (same "one plausible ingest line per kind" treatment source/audience
// already get above) — cites the same seed a receiving Generate's poster
// colorway LOCKS to, so the run narrative and the visible effect agree.
function styleReferenceLine(data) {
  const n = Array.isArray(data?.imageInputs) ? data.imageInputs.length : 0
  const seed = data?.seed ?? DEFAULT_GENERATE_SEED
  return `Loaded style reference${n ? ` (${n} image${n === 1 ? '' : 's'})` : ''} — seed ${seed}.`
}

// WAVE 3 — THE VERB EXPANSION. Remix's own small tables. VALUE strings
// mirror src/nodes/RemixNode.jsx's REMIX_OP_OPTIONS (that file's UI copy of
// this SAME four-op enum) — same small-table duplication convention as
// SOURCE_KIND_INGEST vs. SignalNode.jsx's SOURCE_KIND_OPTIONS just above.
const REMIX_OP_STAMPS = {
  translate: 'TRANSLATED',
  resize: 'RESIZED 9:16',
  tighten: 'TIGHTENED',
  recolor: 'RECOLORED',
}
// "Translate to market" has no real market FIELD on Remix (only the op
// ComboBox) — a market is picked deterministically off this beat's own
// seed instead, same small invented-but-plausible roster Wave 4's Localize
// will later use for real (this file's own header note applies: honest
// demo fake, not real NLP).
const REMIX_MARKETS = ['DE', 'FR', 'JP', 'MX']

// "text ops transform the real text" (master) — genuine, deterministic
// (seeded, no Math.random) transforms of the ACTUAL upstream string, not a
// canned replacement. Tighten actually shortens it (a real word-count cut);
// Translate augments it with a market note while leaving the original
// fully intact — both keep the reader able to see what they started from.
function tightenText(text, seed) {
  const words = text.trim().split(/\s+/).filter(Boolean)
  if (words.length <= 6) return text.trim() || '(nothing to tighten yet)'
  const ratio = 0.5 + ((seed % 21) / 100) // 0.50–0.70, deterministic per seed
  const keep = Math.max(6, Math.round(words.length * ratio))
  const cut = words.slice(0, keep).join(' ')
  return /[.!?]$/.test(cut) ? cut : `${cut}…`
}
function translateText(text, seed) {
  const market = REMIX_MARKETS[seed % REMIX_MARKETS.length]
  const src = text.trim() || '(nothing to translate yet)'
  return `${src} — localized for ${market}.`
}

// WAVE 3 — THE VERB EXPANSION. Compare's own ranked-row citation — reads
// straight off the candidate's live node object (this file already has the
// full node, not just its id) rather than importing data/blocks.js's
// nodeDisplayTitle: engine.js is a run/* file neither B nor C exclusively
// owns, but blocks.js is explicitly B's own (§Seam ownership table) — a
// plain number/type fallback here avoids reaching across that boundary for
// what only needs to be "recognizable," not the card's exact title.
function candidateLabel(node) {
  if (node.data?.number != null) return `Node ${String(node.data.number).padStart(2, '0')}`
  const t = node.type || 'node'
  return t.charAt(0).toUpperCase() + t.slice(1)
}

// WAVE 4 — THE VERB EXPANSION. Guardrail's own small tables. VALUE strings
// mirror src/nodes/LogicNode.jsx's GUARDRAIL_CHECK_OPTIONS (that file's own
// UI copy of this SAME closed 3-item roster) — same small-table duplication
// convention SOURCE_KIND_INGEST vs. SignalNode.jsx's SOURCE_KIND_OPTIONS
// already use above. GUARDRAIL_NOTES supplies the ONE flagged check's
// plausible note text — "1 note: soften 'guaranteed'" (master, verbatim) is
// exactly Legal Playbook's own entry here, reached whenever the seeded roll
// misses and the seed happens to point at that check.
const GUARDRAIL_CHECK_OPTIONS = ['Legal Playbook', 'Brand Guidelines', 'Claims register']
const GUARDRAIL_NOTES = {
  'Legal Playbook': "soften 'guaranteed'",
  'Brand Guidelines': 'tone drifts off-voice in one line',
  'Claims register': 'one claim needs a citation',
}

// WAVE 4 — THE VERB EXPANSION. Localize's own small tables. VALUE strings
// mirror src/nodes/LocalizeNode.jsx's LOCALIZE_MARKET_OPTIONS (same
// duplication convention as GUARDRAIL_CHECK_OPTIONS just above).
const LOCALIZE_MARKET_OPTIONS = ['DE', 'FR', 'JP', 'MX']
const LOCALIZE_MARKET_NAMES = { DE: 'Germany', FR: 'France', JP: 'Japan', MX: 'Mexico' }
// "content = per-market lines" (master) — a real derived word count when
// real upstream text exists (same "genuine, not fabricated" bar Remix's own
// tightenText/translateText hold just above), a plain "ready" line
// otherwise. `srcText` is null both when nothing is wired in AND when the
// immediate upstream is a Generate-shaped poster (no real text to cite —
// same discriminator Remix's own isPoster check uses).
function localizeLine(market, srcText) {
  const name = LOCALIZE_MARKET_NAMES[market] || market
  if (!srcText) return `${market} · ${name} — ready to localize once copy arrives.`
  const words = srcText.trim().split(/\s+/).filter(Boolean).length
  return `${market} · ${name} — localized (${words} word${words === 1 ? '' : 's'}).`
}

// WAVE 4 — THE VERB EXPANSION. Optimize's own small table — plausible
// per-cycle action phrases, cycled deterministically off this beat's own
// seed (no Math.random) so a re-run genuinely varies which actions get
// cited, same "honest demo fake" bar Remix's REMIX_MARKETS pick already
// holds. "Cycle 1: sharpened hook · Cycle 2: tightened CTA" (master,
// verbatim) is exactly what a seed landing on index 0 produces.
const OPTIMIZE_ACTIONS = [
  'sharpened hook',
  'tightened CTA',
  'clarified the offer',
  'reordered for impact',
  'cut filler copy',
  'strengthened the close',
]

// BATCH MATRIX (PLAN.md "## BATCH MATRIX") — a batch output tile's own
// FRAME shape, independent of run/artifacts.jsx's `artifactKind`/GEO table
// (which only ever splits Graphic into poster 4:5 / social 1:1 — no 9:16
// entry exists there, and adding one is out of this seam's file grant:
// artifacts.jsx belongs to run/posters.jsx's neighbor, not engine.js).
// "ratio can vary per item on a seeded pick of 1:1/4:5/9:16 so the matrix
// reads like a real channel batch" (contract) is satisfied here instead, as
// an explicit per-item override string in the SAME `"w / h"` CSS
// aspect-ratio format Remix's own `data.output.aspect` field already
// established (run/engine.js's 'remix' case, POSTER MODE branch) — the
// matrix UI sizes each tile's frame off `assets[i].aspect` directly rather
// than re-deriving one from format+seed.
const BATCH_ASPECT_RATIOS = ['1 / 1', '4 / 5', '9 / 16']

// PAIRED DELIVERABLES (PLAN.md "## PAIRED DELIVERABLES") — "each batch
// asset gains `copy` — a 1-2 sentence social caption, seeded-deterministic
// per asset (a demo bank of ~10-14 caption lines in campaign voice, varied
// by seed)." Adapter-seam-honest, same posture translateText/tightenText/
// REMIX_MARKETS already hold above: a real provider adapter would write
// these live off the actual brief text via `runAdapter`/`adapters.local`;
// this fixed bank stands in for that call without pretending to BE a
// generation call itself — no network, pure function of the item's own
// seed. Each line is tagged with the direction(s) it reads naturally
// under (`directionFlavorOf`/`pickBatchCopy` below) — campaign-ops
// register, no invented client/brand names, no emoji, matching this
// project's own established demo-copy voice (see samples.js/part-a.js).
/* Length VARIETY is deliberate (Bryan: "can you vary the copy length up
   more") — each flavor spans a two-word punch through a two-sentence beat,
   so a 25-batch's caption column reads like a real channel calendar (some
   posts are a jab, some carry the argument) instead of twelve same-sized
   lines. The seeded pick distributes lengths naturally. */
const BATCH_CAPTION_BANK = [
  { text: 'Big move.', tags: ['punchy'] },
  { text: 'Stop scrolling — this is the one worth a second look.', tags: ['punchy'] },
  { text: 'Bold move, bigger payoff — see it live now.', tags: ['punchy'] },
  { text: "This isn't a maybe. This is the moment.", tags: ['punchy'] },
  { text: 'Turn heads first, ask questions later.', tags: ['punchy'] },
  {
    text: "We didn't come this far to blend in. The new drop lands loud, and it isn't waiting around for a second opinion.",
    tags: ['punchy'],
  },
  { text: 'Enough said.', tags: ['minimal'] },
  { text: 'Simple, considered, ready when you are.', tags: ['minimal'] },
  { text: 'Less noise, more clarity — see for yourself.', tags: ['minimal'] },
  { text: 'Built with intention, shown without excess.', tags: ['minimal'] },
  { text: 'Quietly better. Look closer.', tags: ['minimal'] },
  {
    text: 'No headline gymnastics today. Just the work, photographed honestly, doing what it was designed to do.',
    tags: ['minimal'],
  },
  { text: 'For you.', tags: ['warm'] },
  { text: 'Made for the moments that matter to you.', tags: ['warm'] },
  { text: 'Come as you are — this one was made with you in mind.', tags: ['warm'] },
  { text: 'A little more warmth in your feed today.', tags: ['warm'] },
  { text: 'Because the best things are shared, not just seen.', tags: ['warm'] },
  {
    text: "Some things you plan, some things just happen on the road. This one's for everyone who knows the difference — and packs for both.",
    tags: ['warm'],
  },
]

// Keyword match against the checkin/gate's own resolved answer text
// (CHECKIN_INTENT_BANK's own trio labels — 'Punchy and bold', 'Clean and
// minimal', 'Warm and human' — match here on their own lead word, same
// lightweight regex-bank idiom CHECKIN_INTENT_BANK/DIRECTION_FLAVOR_BANK's
// neighbors already use throughout this file). Free text that never
// mentions any of these ('approved', a genuinely unrelated reply, or the
// Approve chip's own no-turn-yet fallback) simply matches nothing, same as
// no answer at all.
const DIRECTION_FLAVOR_BANK = [
  { test: /punchy|bold/i, flavor: 'punchy' },
  { test: /minimal|clean|simple/i, flavor: 'minimal' },
  { test: /warm|human|friendly/i, flavor: 'warm' },
]
function directionFlavorOf(answerText) {
  return DIRECTION_FLAVOR_BANK.find((e) => e.test.test(String(answerText || '')))?.flavor || null
}

// Deterministic per-item pick: a detected flavor narrows the pool to its
// OWN tagged subset (contract: "FLAVOR the pick toward a matching subset
// when cheap") so a punchy-direction batch draws only punchy lines; no
// flavor (or an empty pool — defensive, can't currently happen) falls back
// to the FULL bank so every item still gets a genuinely varied, seed-driven
// line ("else generic"). Pure/synchronous — no Math.random, same plain-
// modulo idiom REMIX_MARKETS/OPTIMIZE_ACTIONS/GUARDRAIL_CHECK_OPTIONS
// already use — so a fixed seed always resolves to the exact same line.
function pickBatchCopy(itemSeed, flavor) {
  const pool = flavor ? BATCH_CAPTION_BANK.filter((line) => line.tags.includes(flavor)) : BATCH_CAPTION_BANK
  const bank = pool.length > 0 ? pool : BATCH_CAPTION_BANK
  return bank[itemSeed % bank.length].text
}

// VARIANT STUDIO — `spawnGenerateGrid` is the one piece of this beat that
// can't live in this file: it appends whole new nodes (a variantgroup frame
// + its variant children) to the graph, which only state.jsx's setRawNodes
// can do (this file only ever merge-patches ONE node's data via `patchNode`,
// by design — see the file header). state.jsx's own wrapper already encodes
// PLAN.md's "does NOT spawn/replace grids unless it has none" gate before
// calling through, so this file just calls it unconditionally and reacts to
// whatever comes back (`null` = nothing spawned, already had one or
// variants<=1) — no policy decision made here. Optional (defaults to a
// no-op) so a caller that doesn't care about GENERATE nodes at all (tests,
// alternates — same reasoning `generate` itself defaults) never has to know
// this parameter exists.
// RESULTS SHEET (PLAN.md "## RESULTS SHEET — the frame springs from the
// output node") — the `spawnResultsFrame` runner option this comment block
// used to document is retired along with the free-standing `results` node
// it used to spawn: the results surface is now a plain satellite of
// whichever OutputNode.jsx card is already the terminal delivered output
// (state.jsx's `resultsAnchorId`), rendered/mounted entirely on the C side
// with no graph-shape change (no new node, nothing for this file to spawn)
// — so there is nothing left for this file's own run-completion beat to
// call. See state.jsx's own header comment (where RESULTS_COL_PITCH/
// RESULTS_HEIGHT_EST and spawnResultsFrame itself used to live) for the
// full retirement note.
export function createRunner({
  getNodes,
  getEdges,
  patchNode,
  onEdgePass,
  generate = localAdapter,
  spawnGenerateGrid = () => null,
}) {
  let controller = null
  let running = false
  let visited = new Set()
  // F4 FIX — predecessor-join barrier state, all reset fresh every run (see
  // executeRun) exactly like `visited` above. `edgeState` is every edge's
  // settled fate (true = FIRED, false = DEAD) once known; `edgeWaiters` holds
  // pending `edgeSettled()` callers still waiting on an edge that hasn't
  // settled yet; `reachable` is this run's own starter set's forward
  // closure, computed once — see computeReachable's comment below.
  let edgeState = new Map()
  let edgeWaiters = new Map()
  let reachable = new Set()
  const pendingHumans = new Map() // nodeId -> resolve(value)

  // ---------------------------------------------------------------------
  // MODEL-AGNOSTIC POSTURE (PLAN.md "## MODEL-AGNOSTIC POSTURE") — "One
  // adapter seam in the engine. All generation flows through a single
  // contract — adapters.demo (today's generators), adapters.local (the dev
  // claude proxy) — so a real provider adapter (OpenAI/Gemini/Bedrock/local)
  // is a drop-in file, never a rewrite. engine.js carries the contract
  // comment; no beat/pause/branch logic may touch an adapter directly."
  //
  // Contract: `adapter(req) -> AsyncGenerator<string>` yielding text chunks
  // — unchanged shape gen/generate.js's own `generate` already had (PLAN.md
  // "Graph run schema"; req = `{ kind: 'task' | 'output', node, upstream? }`).
  //
  //   adapters.local — the dev-only claude proxy path: gen/generate.js's
  //     `generate` export, injected here as this factory's own `generate`
  //     param (the EXACT SAME dependency-injection seam this file already
  //     had — tests/alternates still override it the same way, unchanged).
  //     That module already probes once for the proxy and resolves
  //     transparently to real generation when it's reachable, silently
  //     falling back to its own demo-mode templates otherwise (any
  //     production build, or a single failed call — see gen/generate.js's
  //     header comment). From this engine's side, that whole resolved
  //     pipeline (probe, then real-or-demo) IS "the local adapter."
  //   adapters.demo — reserved name for a standalone, network-free adapter.
  //     Resolves to the SAME function today: gen/generate.js is out of this
  //     phase's file grant (SEAM: engine.js only) and has no separate
  //     always-demo export — only the combined probe-then-fallback one
  //     above — so duplicating its private demo templates here would both
  //     break this phase's own "pure refactor, zero behavior change" bar
  //     (verified via a before/after run-sequence diff) and DESIGN BAR's
  //     "reuse, don't invent." The name exists now so a real third provider
  //     (OpenAI/Gemini/Bedrock/a distinct local model) — or a future split
  //     of gen/generate.js's private demo templates into their own export —
  //     is a new/changed entry in this one object, never a rewrite of
  //     runNode's switch below.
  const adapters = { local: generate, demo: generate }
  // The engine's ONE resolution point — every beat below that needs
  // generated content calls THIS, never `adapters.*` by name or the bare
  // `generate` param directly ("no beat/pause/branch logic may touch an
  // adapter directly"). Picking 'local' here is the only wiring decision a
  // real provider swap will ever require; runNode's task/output cases never
  // change.
  function runAdapter(req) {
    return adapters.local(req)
  }

  // FINAL QUEUE — FQ-A. A second, parallel resolution point for
  // IMAGE-producing beats (the 'generate' node's own preview, and
  // Graphic/Video-format 'output' nodes below) — structurally different
  // from runAdapter above (resolves to a single {url,mime} or null, not an
  // async chunk stream), so it gets its own entry rather than overloading
  // that one's contract. Every case below just calls THIS, never
  // `imageAdapters.*`/REAL_MODE/fetchPollinationsImage directly — same "one
  // adapter seam, no beat/pause/branch logic touches an adapter directly"
  // discipline runAdapter's own comment states.
  const imageAdapters = { pollinations: fetchPollinationsImage }
  async function runImageAdapter(req) {
    if (!REAL_MODE) return null
    try {
      return await imageAdapters.pollinations(req)
    } catch (err) {
      // "Failure is graceful and SILENT to the demo" (PLAN.md FQ-A) — falls
      // back to the seeded SVG poster/artifact the caller already had a
      // plan for; one console.info, never a console.error or a broken tile.
      console.info('[canvas-workflows] real image unavailable for this beat, using seeded artifact:', err?.message || err)
      return null
    }
  }

  // HITL MICRO-CHAT (PLAN.md "## HITL MICRO-CHAT") — chat mode's OWN single
  // resolution point, same "no beat/pause/branch logic touches an adapter
  // directly" discipline runAdapter/runImageAdapter already hold above;
  // `chatWithHuman` (below, near `continueHuman`) calls THIS, never
  // `runAdapter`/`generationMode`/`generate` directly. Real mode
  // (`generationMode() === 'real'` — the dev claude proxy actually
  // reachable) forwards through `runAdapter` itself ("local adapter =
  // existing claude proxy path" per PLAN.md, verbatim) with a synthetic
  // node carrying the live chat prompt (chatRealPrompt above) so the proxy
  // answers the real back-and-forth, not the node's static `ask`. Demo mode
  // (the default for every build without a running proxy, and any per-call
  // real failure — same graceful per-call fallback runImageAdapter's own
  // comment above describes) resolves to `chatDemoReply` above instead of
  // gen/generate.js's generic task/output templates: those have no notion
  // of a chat turn and would read as exactly the "generic filler" PLAN.md
  // rules out, so this file's own small scripted-reply generator (seeded
  // per node+run+turn, PLAN.md's own spec) stands in, matching the
  // established precedent that most of this file's demo content (REMIX,
  // LOCALIZE, GUARDRAIL, OPTIMIZE, human free-text answers, source/audience
  // lines) is authored directly here rather than routed through gen/
  // generate.js, which only ever handles the 'task'/'output' kinds.
  async function runChatAdapter(node, userText, chatLog, turnIndex, signal) {
    const draftText = upstreamOutputs(node.id)[0]?.output?.content || ''
    // THE AGENT ASKS item 1 retired `data.ask` — `chatLog[0]` is the opener
    // ALREADY resolved (checkinOpener, seeded at pause) through this same
    // node's own priority chain, so it's the honest "what's this about" line
    // to hand the real prompt, no re-derivation needed.
    const openerText = chatLog[0]?.text || CHAT_OPENER_TEXT
    if (generationMode() === 'real') {
      try {
        const chatNode = { ...node, data: { ...node.data, instructions: chatRealPrompt(node, chatLog, openerText) } }
        let content = ''
        for await (const chunk of runAdapter({ kind: 'chat', node: chatNode, upstream: draftText })) {
          if (signal.aborted) break
          content += chunk
        }
        if (!signal.aborted && content.trim()) return content.trim()
      } catch (err) {
        // Per-call fallback only, same shape gen/generate.js's own real->demo
        // catch already uses — does not disable real mode for later turns.
        console.info('[canvas-workflows] real chat reply unavailable for this turn, using scripted reply:', err?.message || err)
      }
    }
    if (signal.aborted) return ''
    const seed = makeSeed(`${node.id}:chat:${turnIndex}`, runCount)
    return chatDemoReply(draftText, userText, seed, turnIndex)
  }
  // ---------------------------------------------------------------------

  // ANDREW ROUND C2 — "a run counter exists or add one (NO Math.random)".
  // Lives here (not state.jsx, out of this seam) since this closure is
  // already the one long-lived object per FlowStateProvider instance.
  // `runCount` feeds makeSeed(nodeId, runCount) so the SAME node paints a
  // freshly-seeded artifact on every re-run, still fully deterministic;
  // `artifactCount` is the run-local 1-based order artifacts finish in, for
  // the filmstrip's own mono tag (`cw:artifact`'s `number` field).
  let runCount = 0
  let artifactCount = 0

  function findNode(id) {
    return getNodes().find((n) => n.id === id)
  }

  function upstreamOf(nodeId) {
    const byId = new Map(getNodes().map((n) => [n.id, n]))
    return getEdges()
      .filter((e) => e.target === nodeId)
      .map((e) => byId.get(e.source))
      .filter(Boolean)
  }

  // THE AGENT ASKS (PLAN.md "## THE AGENT ASKS", item 2) — "UPSTREAM CONTEXT
  // (the nearest incoming node's instructions/title text...)". Only the
  // single nearest predecessor is consulted — `upstreamOf(nodeId)[0]`, the
  // same "first predecessor" precedent `upstreamOutputs(nodeId)[0]` already
  // leans on elsewhere in this file for a single-value read. A checkin with
  // no incoming edge at all (a bare palette drop, or the scoped entry point
  // of a `runFrom`) simply has no upstream text to offer and falls through
  // to the next tier.
  function upstreamCheckinText(nodeId) {
    const up = upstreamOf(nodeId)[0]
    return up?.data?.instructions || up?.data?.title || ''
  }

  // THE AGENT ASKS item 2 — "the opener + chip derivation re-source, in
  // priority: data.guidance ... -> UPSTREAM CONTEXT ... -> template
  // data.chatOpener / generic defaults." Both derivations share ONE source
  // string in that order; `data.ask` is never consulted anywhere in this
  // chain (stale safety — item 1, "data.ask: ignored everywhere"). Feeds
  // `pickChatOptions` directly; `checkinOpener` (just below) reads the SAME
  // guidance/upstream slice of this chain, but treats an authored
  // `chatOpener` as its own separate, higher-priority case (see that
  // function's own comment).
  function checkinSourceText(node, nodeId) {
    return node.data?.guidance || upstreamCheckinText(nodeId) || node.data?.chatOpener || ''
  }

  // An AUTHORED `chatOpener` always wins outright (item 3: "chatOpener
  // stays — it IS the agent's question") — a template author's specific
  // line is more authoritative than a derived guess, so it's checked FIRST
  // and short-circuits the rest of this function entirely. Absent one (a
  // bare palette drop, or a template step that never set it), guidance/
  // upstream context — if either matched a known intent — gets that
  // intent's own on-topic opener line instead of the flat generic default;
  // otherwise CHAT_OPENER_TEXT, unchanged from before this phase.
  function checkinOpener(node, nodeId) {
    if (node.data?.chatOpener) return node.data.chatOpener
    const source = node.data?.guidance || upstreamCheckinText(nodeId)
    return checkinIntentEntry(source)?.opener || CHAT_OPENER_TEXT
  }

  // WAVE 1 — THE VERB EXPANSION (PLAN.md master contract, "### Shared
  // infrastructure" -> "Artifact hand-off across edges"): "A consuming node
  // (Remix, Compare) reads its upstream node's data.output descriptor via
  // edge lookup at beat time — engine provides one helper (upstreamOutputs
  // (nodeId))... no node reaches into the store directly." Same edge lookup
  // as upstreamOf just above, but hands back each predecessor's OWN
  // data.output descriptor (the {format, content, ...} shape every
  // content-bearing node already writes — task/output/generate, and
  // human's synthetic one, see this file's header note on "Content-bearing
  // upstream") instead of the raw node, paired with that predecessor's id
  // so a multi-input consumer (Compare's ranked list, Wave 3) can still
  // cite WHICH upstream block an artifact came from. Entries with no
  // output yet (upstream hasn't run, or produced nothing) are dropped —
  // "consumes upstreamOutputs' first artifact" (Remix, Wave 3) and "scores
  // each incoming artifact" (Compare, Wave 3) both mean the real ones,
  // never a placeholder null. Unused by THIS wave's own two node kinds
  // (Gather/A-B Split are structural join/fork nodes, not content
  // consumers) — built now so later waves' new `case` branches in the
  // switch below can call it directly, exactly like they'll call
  // upstreamOf.
  // WAVE 3 — THE VERB EXPANSION. Extended per this wave's own instruction
  // ("extend upstreamOutputs semantics if needed, document"): "out carries
  // the winner's artifact (Remix/Output downstream receive it)" (master,
  // Compare). A Compare predecessor forwards its WINNER's own output
  // descriptor here instead of its own ranked-list summary text — every
  // OTHER predecessor forwards its own `data.output` completely unchanged,
  // exactly as before this wave. `nodeId` in the returned entry stays the
  // Compare node's OWN id (this function's existing "paired with that
  // predecessor's id" contract, literally) — only the `output` PAYLOAD
  // swaps; a Compare with no winner yet (hasn't run, or scored zero
  // candidates) falls through to its own plain `data.output` (the ranked-
  // list text, or nothing) like any other not-yet-forwarding predecessor.
  function upstreamOutputs(nodeId) {
    return upstreamOf(nodeId)
      .map((n) => {
        const compareWinner = n.type === 'logic' && n.data?.kind === 'compare' ? n.data?.winner : null
        const output = compareWinner ? compareWinner.output : n.data?.output
        return { nodeId: n.id, output: output || null }
      })
      .filter((entry) => entry.output != null)
  }

  // PAIRED DELIVERABLES — "if the run's chat answer carried a direction
  // intent... the data is on the checkin/gate answer upstream" (contract).
  // A batch Output's immediate predecessor is a task node (part-a.js's
  // 'Produce the batch' — the checkin sits ONE HOP further back), so this
  // walks upstream breadth-first off the SAME `upstreamOf` edge lookup
  // upstreamCheckinText/upstreamOutputs already use above — just repeated a
  // few hops, capped defensively so a pathological chain can't spin (cheap:
  // every real call this phase makes resolves in 1-2 hops). THE SPLIT
  // (PLAN.md) — both a `checkin` and a `human` (gate) node write their
  // resolved pick to `data.answer` on the SAME `case 'checkin'`/`case
  // 'human'` patchNode calls above; either one counts as "the checkin/gate
  // answer," first one found wins (nearest predecessor, same precedent
  // upstreamOf(nodeId)[0] reads everywhere else in this file).
  function upstreamDirectionAnswer(nodeId) {
    const seen = new Set([nodeId])
    let frontier = [nodeId]
    for (let hop = 0; hop < 5 && frontier.length > 0; hop++) {
      const next = []
      for (const id of frontier) {
        for (const up of upstreamOf(id)) {
          if (seen.has(up.id)) continue
          seen.add(up.id)
          if ((up.type === 'checkin' || up.type === 'human') && up.data?.answer) {
            return String(up.data.answer)
          }
          next.push(up.id)
        }
      }
      frontier = next
    }
    return ''
  }
  function directionFlavor(nodeId) {
    return directionFlavorOf(upstreamDirectionAnswer(nodeId))
  }

  function incomingEdges(nodeId) {
    return getEdges().filter((e) => e.target === nodeId)
  }

  // F4 FIX — predecessor-join barrier plumbing. Every edge settles exactly
  // once, to `true` (FIRED — its source actually traversed it) or `false`
  // (DEAD — its source took a different handle, or never ran at all);
  // `resolveEdge` is idempotent so it's safe however many times it's called
  // (it isn't — `advance` below is the only caller, once per edge — but the
  // guard costs nothing and keeps "an edge's fate is decided exactly once"
  // structurally true, not just true by convention).
  function resolveEdge(edgeId, alive) {
    if (edgeState.has(edgeId)) return
    edgeState.set(edgeId, alive)
    const waiters = edgeWaiters.get(edgeId)
    if (!waiters) return
    edgeWaiters.delete(edgeId)
    waiters.forEach((wake) => wake())
  }

  // Resolves once `edgeId` has a settled fate — or immediately if `signal`
  // is already aborted / aborts while still pending, the same abort-early
  // shape `delay`/`waitForHuman` above already use, so a Stop mid-run can
  // never leave a downstream barrier waiting forever on an edge whose source
  // got cut off before it could fire or die.
  function edgeSettled(edgeId, signal) {
    if (edgeState.has(edgeId) || signal.aborted) return Promise.resolve()
    return new Promise((resolve) => {
      const wake = () => {
        signal.removeEventListener('abort', wake)
        resolve()
      }
      if (!edgeWaiters.has(edgeId)) edgeWaiters.set(edgeId, new Set())
      edgeWaiters.get(edgeId).add(wake)
      signal.addEventListener('abort', wake, { once: true })
    })
  }

  // Forward reachability from this run's starter id(s), ignoring handles
  // entirely — a static graph-topology BFS, not a runtime one (it can't know
  // yet which branch a logic/human node will take). Computed once per
  // `executeRun` and used to SCOPE the barrier: a node's incoming edge only
  // counts toward its join if the edge's source is in this set. That's the
  // whole trick behind `runFrom` still working — "nothing upstream of nodeId
  // is ever visited or touched" (its own comment further below): a
  // `runFrom` starter's incoming edges have sources that are, by
  // construction, never forward-reachable FROM that starter (barring a cycle
  // this editor can't author), so they're excluded from its barrier and it
  // proceeds immediately — exactly like the trigger/params starters of a
  // full run always have (zero incoming edges of their own, full stop).
  // Same reasoning, same shape as state.jsx's own computeDownstreamSet (the
  // "reset outputs first" scope for Run-from-here) — this is that pattern's
  // mirror image, forward reachability used to SCOPE a barrier instead of a
  // reset.
  function computeReachable(starterIds) {
    const adjacency = new Map()
    for (const edge of getEdges()) {
      if (!adjacency.has(edge.source)) adjacency.set(edge.source, [])
      adjacency.get(edge.source).push(edge.target)
    }
    const seen = new Set(starterIds)
    const queue = [...starterIds]
    while (queue.length) {
      const id = queue.shift()
      for (const nextId of adjacency.get(id) || []) {
        if (!seen.has(nextId)) {
          seen.add(nextId)
          queue.push(nextId)
        }
      }
    }
    return seen
  }

  // Streams an async generator's chunks into `data.output`, re-patching the
  // accumulated string on every chunk so R2's node cards can render it live
  // (PLAN.md R2.3 — "streaming text, caret blink while running"). A
  // generation failure is swallowed here — a bad demo/real call shouldn't
  // wedge the whole run, it just leaves that node with whatever content
  // streamed before the failure (possibly none).
  //
  // `extra` (ANDREW ROUND C2) rides along on EVERY patch, not just the
  // first — `output` is a single object patchNodeData replaces wholesale
  // (state.jsx: `{...n.data, ...patch}`, a shallow merge), so if only the
  // very first write carried `{developing:true, seed}` the next content-only
  // chunk would silently erase them again. Callers that don't pass it (the
  // 'task' case, unchanged) get the exact same two-key `{format, content}`
  // object this function always wrote.
  async function streamOutput(nodeId, format, iterable, signal, extra = {}) {
    let content = ''
    patchNode(nodeId, { output: { format, content, ...extra } })
    try {
      for await (const chunk of iterable) {
        if (signal.aborted) break
        content += chunk
        patchNode(nodeId, { output: { format, content, ...extra } })
      }
    } catch {
      // demo-grade resilience — see above.
    }
    return content
  }

  // Resolves when `continueHuman(nodeId, value)` delivers a value, OR when
  // `signal` aborts (stopRun mid-pause) — the latter resolves to the ABORTED
  // sentinel rather than hanging forever so `run()` can unwind cleanly.
  function waitForHuman(nodeId, signal) {
    if (signal.aborted) return Promise.resolve(ABORTED)
    return new Promise((resolve) => {
      pendingHumans.set(nodeId, resolve)
      signal.addEventListener(
        'abort',
        () => {
          if (pendingHumans.get(nodeId) === resolve) {
            pendingHumans.delete(nodeId)
            resolve(ABORTED)
          }
        },
        { once: true },
      )
    })
  }

  // `handle` is the ONE outgoing handle this node actually took (e.g. 'out',
  // 'true', 'opt-approve') — or `null` when the node took NO handle at all
  // because it never ran to begin with (see the F4 barrier in runNode below:
  // a node whose every incoming edge settles DEAD is itself dead). EVERY one
  // of the node's outgoing edges gets a settled fate here, not just the
  // taken ones: edges matching `handle` are FIRED (onEdgePass + recurse
  // normally); every other edge — the untaken branch(es) of an if/switch/
  // human-choice, or literally all of them when `handle` is null — is
  // marked DEAD and still recursed into, just without onEdgePass (nothing
  // visually traverses a path that was never taken). Recursing into dead
  // edges too, instead of just returning, is what lets DEAD cascade
  // downstream through runNode's own barrier, all the way to wherever a
  // live branch rejoins it.
  async function advance(node, handle, signal) {
    if (signal.aborted) return
    const allOut = getEdges().filter((e) => e.source === node.id)
    if (!allOut.length) return
    // WAVE 1 — A/B Split fires BOTH its 'a' and 'b' arms unconditionally
    // ("the audience divides, both run" — marketing semantics, not a real
    // branch decision like if/switch/try). `handle` stays a single string
    // (or null) for every OTHER caller, unchanged — passing an ARRAY is the
    // one new shape, read as a SET of simultaneously-alive handles rather
    // than exactly one.
    const takenHandles = Array.isArray(handle) ? new Set(handle) : null
    await Promise.all(
      allOut.map(async (edge) => {
        const sourceHandle = edge.sourceHandle ?? 'out'
        const alive = takenHandles ? takenHandles.has(sourceHandle) : handle != null && sourceHandle === handle
        resolveEdge(edge.id, alive)
        if (alive) {
          // "Fire onEdgePass per traversed edge right before the target
          // starts" (PLAN.md R1.1) — state.jsx's implementation turns this
          // into the `cw:run-edge` window event M1's OmniEdge matches
          // against. Dead edges never fire this — they were never traversed.
          onEdgePass({ source: edge.source, target: edge.target, sourceHandle })
        }
        await runNode(edge.target, signal)
      }),
    )
  }

  async function runNode(nodeId, signal) {
    if (signal.aborted || visited.has(nodeId)) return
    visited.add(nodeId)

    const node = findNode(nodeId)
    if (!node) return

    // F4 FIX — predecessor-join barrier, dead-branch-aware. Runs for EVERY
    // node (ahead of skip/params pass-through too, so those can't race a
    // still-running sibling predecessor either): wait for every incoming
    // edge THIS RUN cares about (see computeReachable above) to settle
    // FIRED or DEAD before doing anything visible. `incoming.length === 0`
    // covers both real starters (trigger/params — no in-port at all) and a
    // `runFrom` scope's own entry node (its incoming edges exist in the
    // graph, but their sources aren't in `reachable`, so the filter empties
    // the list) — either way, no barrier, run immediately, exactly as
    // before this fix.
    //
    // If every incoming edge settles DEAD, this node never actually ran —
    // it can't take a handle it never reached — so it's dead too:
    // `advance(node, null, signal)` marks every one of ITS OWN outgoing
    // edges DEAD in turn (see `advance`'s comment for why `null` means
    // "nothing taken"), cascading the dead-ness downstream instead of
    // leaving some later join waiting forever on an edge that can now never
    // fire. THAT cascade is what keeps a branch-merge node from
    // deadlocking: the untaken side of an if/switch/human-choice doesn't
    // just stop silently, it actively tells everything downstream "this
    // path is dead" so a join fed by both the taken and untaken side can
    // still resolve.
    const incoming = incomingEdges(nodeId).filter((e) => reachable.has(e.source))
    if (incoming.length) {
      await Promise.all(incoming.map((e) => edgeSettled(e.id, signal)))
      if (signal.aborted) return
      const anyFired = incoming.some((e) => edgeState.get(e.id) === true)
      if (!anyFired) {
        await advance(node, null, signal)
        return
      }
    }

    // NODE TOOLBAR V2 — "Skip (bypass)": pass through BEFORE the shared
    // queued/running beat even starts (PLAN.md: "no beat, no artifact") —
    // this node never visibly runs at all, it's just a clear pipe to
    // whatever's downstream. `output` is reset to null (not left stale) so
    // a re-run that unskips this node later doesn't show last run's leftover
    // content for the instant before its own beat overwrites it.
    if (node.data?.skipped && isSkippable(node)) {
      patchNode(nodeId, { runState: 'done', output: null })
      await advance(node, 'out', signal)
      return
    }

    // COMFY ROUND (CP2, item 5) — "PARAM NODE": "params nodes pass through
    // instantly (no beat animation, marked done)" (PLAN.md, verbatim) — same
    // "before the shared beat even starts" treatment as a skipped node just
    // above, unconditional (not gated on data.skipped — a params node has no
    // "work" a user could meaningfully bypass, so Skip is disabled for it
    // entirely on the toolbar; shared.jsx SKIP_DISABLED_TYPES).
    if (node.type === 'params') {
      patchNode(nodeId, { runState: 'done' })
      await advance(node, 'out', signal)
      return
    }

    // WAVE 2 — THE VERB EXPANSION. Source/Audience get the IDENTICAL
    // instant-pass-through treatment as params just above ("Engine: instant
    // beat" — master contract, verbatim for Source; Audience follows the
    // same "in-portless value carrier" footing) — except WITH real content,
    // unlike params' bare done-flag: "content = one plausible ingest line
    // per kind." Measure does NOT take this path — it has a real in-port
    // (so it must sit through the predecessor-join barrier above like any
    // other node) and a real seeded reading, so it falls through to the
    // normal queued/running beat and its own `case 'signal'` below.
    if (node.type === 'signal' && (node.data?.kind || 'source') !== 'measure') {
      // WAVE 3 — THE VERB EXPANSION. Style Reference joins this SAME
      // instant-pass-through path (it's a fourth "in-portless value
      // carrier" kind on the shared 'signal' type — SignalNode.jsx's own
      // header comment) with its own content line.
      const content =
        node.data?.kind === 'audience'
          ? audienceSummaryLine(node.data)
          : node.data?.kind === 'style'
            ? styleReferenceLine(node.data)
            : sourceIngestLine(node.data)
      patchNode(nodeId, { output: { format: 'Text', content }, runState: 'done' })
      await advance(node, 'out', signal)
      return
    }

    // Every node type shares the same entry beat before its own behavior:
    // "set queued -> running (300ms beat), then per type: ..." (PLAN.md
    // R1.1). Trigger goes through this too — it's the run's first visible
    // "activation" beat, matching the Motion phase's "energy enters at the
    // Trigger" framing.
    patchNode(nodeId, { runState: 'queued' })
    await delay(BASE_BEAT_MS, signal)
    if (signal.aborted) return
    patchNode(nodeId, { runState: 'running' })

    switch (node.type) {
      case 'trigger': {
        patchNode(nodeId, { runState: 'done' })
        await advance(node, 'out', signal)
        return
      }

      case 'task': {
        // SUBGRAPHS — "a task with steps subdivides its beat evenly across
        // steps... parent gauge/stamps unchanged" — the step cascade runs
        // CONCURRENTLY with the task's own real content stream (never
        // gating it, never gated by it) and is simply awaited alongside it,
        // so by the moment this task reports 'done' its steps already read
        // fully 'done' too rather than flashing a stale in-progress count.
        const stepsSnapshot = node.data?.steps
        const hasSteps = stepsSnapshot && Array.isArray(stepsSnapshot.nodes) && stepsSnapshot.nodes.length > 0
        const stepsPromise = hasSteps ? runTaskStepBeats(nodeId, stepsSnapshot, patchNode, signal) : null
        const content = await streamOutput(nodeId, 'Text', runAdapter({ kind: 'task', node }), signal)
        if (stepsPromise) await stepsPromise
        if (signal.aborted) return
        patchNode(nodeId, { output: { format: 'Text', content }, runState: 'done' })
        await advance(node, 'out', signal)
        return
      }

      // THE SPLIT (PLAN.md "## THE SPLIT — two human nodes: the Gate and
      // the Check-in") — reverted to the pre-merge gate: pauses, resolves
      // to free text or (in choice mode) the picked option's own branch
      // handle. waitForHuman/continueHuman/branching/dead-branch settle are
      // ALL untouched by THE GATE NEGOTIATES below — the only thing that
      // changed is what patchNode seeds the instant this node pauses. A
      // stale `responseType: 'chat'` left over on an old human node
      // (pre-THE SPLIT data) still can't reach any special path either:
      // `isChoice` reads false for anything that isn't literally 'choice',
      // so it resolves the same free-text 'out' handle a plain free-text
      // node would.
      //
      // THE GATE NEGOTIATES (PLAN.md "## THE GATE NEGOTIATES") — "the same
      // chat-box surface the checkin wakes, with negotiation allowed before
      // the decision." HumanNode.jsx now renders that surface while paused,
      // seeded here with the AUTHORED `ask` as the opener verbatim ("the
      // gate's ask is authored on purpose — that stays"). A fresh pause
      // always reseeds chatLog to this ONE opener entry, same "reseeds on a
      // fresh run" contract the check-in already holds — negotiation turns
      // (chatWithHuman, below) grow it from there for choice mode only.
      //
      // LIVE LEANING (PLAN.md "## LIVE LEANING") — "OPENER READS THE
      // SETUP." Choice mode's opener is no longer the bare authored `ask`;
      // composeChoiceOpener leads with it (THE GATE NEGOTIATES' own
      // "that stays" honored) and appends the options-by-name + seeded reco
      // beat. Free-text mode is UNTOUCHED — this whole phase is scoped to
      // "CHOICE gates' chat surface" only. `chatLeaning` seeds to null here
      // ("the opener starts with none") — chatWithHuman, below, is the only
      // place that ever writes a non-null value, and only while THIS same
      // pause is still live (paused-only, never survives resolve — OmniEdge
      // itself also stops reading it the instant runState leaves 'paused').
      //
      // COACHING CHIPS (PLAN.md "## COACHING CHIPS") — this is the ONE place
      // that flips: choice mode NOW also seeds `chatOptions` here, same
      // field `case 'checkin':` just below already seeds, but drawn from
      // pickCoachingChips/CHIP_RECO_BANK (option-IMPROVEMENT recos) instead
      // of pickChatOptions/CHAT_OPTION_BANK (the check-in's own generic
      // bank) — HumanNode.jsx's hat body renders this row as neutral SEND
      // chips now, never a resolve action; the authored `options` remain
      // exactly what they always were, the node's own branch exit rows
      // (HandleLabelRows), never a second chip listing. Seeded off a
      // `:coaching`-suffixed key so this walks CHIP_RECO_BANK at a
      // different offset than composeChoiceOpener's own walk through
      // CHOICE_RECO_BANK just above (see pickCoachingChips's own comment).
      // Free mode still never gets this field — no chips render for it.
      case 'human': {
        const isChoice = node.data?.responseType === 'choice'
        patchNode(nodeId, {
          runState: 'paused',
          chatLog: [
            {
              role: 'agent',
              text: isChoice
                ? composeChoiceOpener(node.data?.ask, node.data?.options, makeSeed(nodeId, runCount))
                : node.data?.ask?.trim() || 'What do you need from me?',
            },
          ],
          ...(isChoice
            ? {
                chatLeaning: null,
                chatOptions: pickCoachingChips(makeSeed(`${nodeId}:coaching`, runCount), node.data?.options, 3),
              }
            : {}),
        })
        const value = await waitForHuman(nodeId, signal)
        if (signal.aborted || value === ABORTED) return
        const takenHandle = isChoice ? `opt-${value}` : 'out'
        patchNode(nodeId, {
          answer: value,
          takenHandle,
          output: { format: 'Text', content: humanAnswerContent(node, value) },
          runState: 'done',
        })
        await advance(node, takenHandle, signal)
        return
      }

      // THE SPLIT — the dialogue pause path (HITL MICRO-CHAT's own opener
      // seed, HITL SPRING-OPEN's authored-option exclusion, chatWithHuman/
      // approve-resolve) lifted wholesale off `case 'human':` into its own
      // case, keyed on node TYPE (`checkin`) rather than a responseType
      // flag — a check-in node is ALWAYS a dialogue, so there's no longer
      // an isChat branch to take. ONE out handle, never branches — no
      // isChoice read here at all, `takenHandle` is unconditionally 'out'.
      case 'checkin': {
        // THE AGENT ASKS — both the seeded opener and the seeded chip trio
        // now come off checkinOpener/checkinSourceText's shared priority
        // chain (data.guidance -> nearest upstream node's instructions/
        // title -> data.chatOpener -> generic default); see those functions'
        // own comments, near upstreamOf, for the full reasoning.
        patchNode(nodeId, {
          runState: 'paused',
          chatLog: [{ role: 'agent', text: checkinOpener(node, nodeId) }],
          chatOptions: pickChatOptions(makeSeed(nodeId, runCount), checkinSourceText(node, nodeId), 4),
        })
        const value = await waitForHuman(nodeId, signal)
        if (signal.aborted || value === ABORTED) return
        patchNode(nodeId, {
          answer: value,
          takenHandle: 'out',
          output: { format: 'Text', content: humanAnswerContent(node, value) },
          runState: 'done',
        })
        await advance(node, 'out', signal)
        return
      }

      // WAVE 4 — THE VERB EXPANSION. "Engine: PAUSES (reuses pause
      // machinery + breathing ring/stamp... resume button 'Mark returned')"
      // (master). Identical shape to 'human' just above — same
      // patchNode(paused)/waitForHuman/ABORTED dance — minus the choice-vs-
      // free branching: Handoff always resolves to its one plain 'out', the
      // resumed value ('returned', from HandoffNode.jsx's own button) is
      // never inspected beyond unblocking the wait.
      case 'handoff': {
        patchNode(nodeId, { runState: 'paused' })
        const value = await waitForHuman(nodeId, signal)
        if (signal.aborted || value === ABORTED) return
        const owner = node.data?.owner || 'Mara Lindqvist'
        const due = node.data?.due ? ` (due ${node.data.due})` : ''
        patchNode(nodeId, {
          output: { format: 'Text', content: `Returned by ${owner}${due}.` },
          runState: 'done',
        })
        await advance(node, 'out', signal)
        return
      }

      case 'logic': {
        const kind = node.data?.kind || 'if'
        if (kind === 'if' || kind === 'try') {
          // "700ms 'considering' then take TRUE/TRY" (PLAN.md R1.1).
          await delay(CONSIDER_MS, signal)
          if (signal.aborted) return
          const takenHandle = kind === 'if' ? 'true' : 'try'
          patchNode(nodeId, { takenHandle, runState: 'done' })
          await advance(node, takenHandle, signal)
        } else if (kind === 'switch') {
          // "switch -> first case" — no extra considering beat (PLAN.md R1.1).
          const options = node.data?.options || []
          const takenHandle = options.length ? 'case-0' : null
          patchNode(nodeId, { takenHandle, runState: 'done' })
          // F4 FIX — always advance, even with takenHandle:null (a
          // freshly-dropped switch starts with zero options —
          // data/blocks.js's makeData: () => ({kind:'switch', options:[]})).
          // This used to just skip advance() entirely, harmless with no
          // join barrier; now it must still resolve any stray case-N edge
          // (e.g. authored, then its option later removed) DEAD, or a
          // downstream join could wait on it forever. advance(node, null,
          // signal) does exactly that — see its own comment.
          await advance(node, takenHandle, signal)
        } else if (kind === 'gather') {
          // WAVE 1 — THE VERB EXPANSION. "The engine ALREADY waits (F4
          // FIX's own predecessor-join barrier, above this switch) — this
          // node gives it a face." By the time execution reaches here,
          // every incoming edge this run cares about has already settled
          // FIRED or DEAD (and at least one FIRED — the barrier itself
          // would have marked this node dead and returned BEFORE this
          // switch otherwise, same as any other node type — see the
          // `anyFired` check above). Counts FIRED predecessors only,
          // scoped to `reachable` exactly like the barrier's own check — a
          // lone Run-from-here entered directly at this node (no upstream
          // in scope) correctly reports 0.
          const incoming = incomingEdges(nodeId).filter((e) => reachable.has(e.source))
          const arrivedCount = incoming.filter((e) => edgeState.get(e.id) === true).length
          patchNode(nodeId, {
            output: {
              format: 'Text',
              content: `Gathered ${arrivedCount} input${arrivedCount === 1 ? '' : 's'} into one bundle.`,
            },
            runState: 'done',
          })
          await advance(node, 'out', signal)
        } else if (kind === 'split') {
          // WAVE 1 — THE VERB EXPANSION. "BOTH arms fire (marketing
          // semantics — the audience divides, both run)". No CONSIDER_MS
          // beat (nothing to weigh, unlike if/try's real branch decision) —
          // same immediate-advance shape as switch/foreach. The percent
          // split (data.percentA) is a purely visual/labeling value
          // (LogicNode.jsx) the engine never reads — it doesn't change
          // WHICH arms fire, only their displayed weight.
          patchNode(nodeId, { takenHandle: ['a', 'b'], runState: 'done' })
          await advance(node, ['a', 'b'], signal)
        } else if (kind === 'compare') {
          // WAVE 3 — THE VERB EXPANSION. "fan-in; criteria ComboBox...
          // scores each incoming artifact (seeded), content = ranked mono
          // list, data.winner set" (master). Candidates are every FIRED
          // predecessor with a real output — same FIRED-vs-DEAD read
          // Gather's own arrivedCount uses just above (branch-aware: an
          // untaken if/switch/human-choice arm feeding this Compare is
          // correctly excluded, never scored as a phantom 0-value entry).
          const incoming = incomingEdges(nodeId).filter((e) => reachable.has(e.source))
          const candidates = incoming
            .filter((e) => edgeState.get(e.id) === true)
            .map((e) => findNode(e.source))
            .filter(Boolean)
          const criteria = node.data?.criteria || 'Brand fit'
          const scored = candidates
            .map((n) => ({
              nodeId: n.id,
              label: candidateLabel(n),
              // Seeded per (this Compare node, the candidate, this run) —
              // same makeSeed(nodeId, runCount) primitive Measure/Output/
              // Generate all already mint their own determinism from, just
              // keyed on a compound string so two different Compare nodes
              // scoring the SAME candidate (or a re-run re-scoring it)
              // never collide.
              score: (makeSeed(`${nodeId}:${n.id}`, runCount) % 1000) / 10,
              output: n.data?.output || null,
            }))
            .sort((a, b) => b.score - a.score)
          const winner = scored[0] || null
          const content = scored.length
            ? `${criteria} — ranked:\n${scored.map((r, i) => `${i + 1}. ${r.label} — ${r.score.toFixed(1)}`).join('\n')}`
            : 'No candidates arrived to compare.'
          patchNode(nodeId, {
            output: { format: 'Text', content },
            ranked: scored,
            winner: winner ? { nodeId: winner.nodeId, output: winner.output } : null,
            runState: 'done',
          })
          await advance(node, 'out', signal)
        } else if (kind === 'guardrail') {
          // WAVE 4 — THE VERB EXPANSION. "checks multi-chips... Named outs
          // PASS / FLAG (try/catch anatomy). Engine: seeded ~75% pass;
          // content '2 checks passed · 1 note: soften \'guaranteed\'.'; FLAG
          // arm fires only on miss (single-arm routing like if/else)"
          // (master, verbatim). ONE seeded roll per (node, run) decides
          // PASS/FLAG for the WHOLE check set — same makeSeed(nodeId,
          // runCount)-driven single roll Measure's own ~60% pass reading
          // already uses (WAVE 2) — not independent per-check rolls: a
          // Guardrail either clears or it doesn't, same binary shape as any
          // other try/catch node's own single branch decision.
          const seed = makeSeed(nodeId, runCount)
          const pass = seed % 100 < 75
          const checks =
            Array.isArray(node.data?.checks) && node.data.checks.length ? node.data.checks : GUARDRAIL_CHECK_OPTIONS
          let content
          let takenHandle
          if (!checks.length) {
            content = 'No checks selected.'
            takenHandle = 'pass'
          } else if (pass) {
            content = `${checks.length} check${checks.length === 1 ? '' : 's'} passed.`
            takenHandle = 'pass'
          } else {
            // A second, independent-looking derived value (a different
            // bit-slice of the SAME seed) picks WHICH check misses — no
            // second RNG stream needed, same "derived offset" precedent the
            // 'signal' case's own jitter uses below.
            const flagIdx = Math.floor(seed / 100) % checks.length
            const flagged = checks[flagIdx]
            const note = GUARDRAIL_NOTES[flagged] || 'needs a second look'
            const passedCount = checks.length - 1
            content = `${passedCount} check${passedCount === 1 ? '' : 's'} passed · 1 note: ${note}.`
            takenHandle = 'flag'
          }
          patchNode(nodeId, { output: { format: 'Text', content }, takenHandle, runState: 'done' })
          await advance(node, takenHandle, signal)
        } else {
          // foreach — single `out` source, nothing to branch on (LogicNode.jsx).
          patchNode(nodeId, { runState: 'done' })
          await advance(node, 'out', signal)
        }
        return
      }

      case 'wait': {
        await delay(WAIT_MS, signal) // fixed demo beat, any configured amount (PLAN.md R1.1)
        if (signal.aborted) return
        patchNode(nodeId, { runState: 'done' })
        await advance(node, 'out', signal)
        return
      }

      case 'stop': {
        patchNode(nodeId, { runState: 'done' })
        return // no source handle — this branch ends here (PLAN.md node spec)
      }

      // WAVE 2 — THE VERB EXPANSION. Only 'measure' ever reaches this case —
      // source/audience (the OTHER two 'signal' kinds) were already
      // intercepted above as an instant params-style pass-through, since
      // they have no in-port to wait on and no real "reading" to compute.
      // Measure has both ports and a genuine seeded reading, so it takes
      // the normal queued/running/done beat like task/output/wait.
      case 'signal': {
        // "seeded reading around the target (deterministic per
        // nodeId+runCount, ~60% pass)" (master) — same makeSeed(nodeId,
        // runCount) precedent the 'output' case below and state.jsx's
        // variant-grid seeding both already use ("no Math.random" — R1
        // header note). A second, independent-looking derived value (a
        // different bit-slice of the SAME seed) drives the reading's own
        // jitter — no second RNG stream needed for one derived offset.
        const seed = makeSeed(nodeId, runCount)
        const pass = seed % 100 < 60
        const kpi = node.data?.kpi || 'CTR'
        const target = node.data?.target || '≥ 1.2%'
        const lowerIsBetter = /≤|<=/.test(target) // CPM's own default target ("≤ $18.00") is the one KPI where a SMALLER reading is the pass
        const isDollar = /\$/.test(target)
        const targetMatch = String(target).match(/-?\d+(?:\.\d+)?/)
        const targetNum = targetMatch ? parseFloat(targetMatch[0]) : 1
        const jitter = 0.05 + (Math.floor(seed / 97) % 25) / 100
        const above = lowerIsBetter ? !pass : pass
        const reading = above ? targetNum + jitter : Math.max(0, targetNum - jitter)
        const readingStr = isDollar ? `$${reading.toFixed(2)}` : `${reading.toFixed(2)}%`
        const content = `${kpi} ${readingStr} vs ${target} — ${pass ? 'ON TARGET' : 'UNDER'}`
        patchNode(nodeId, { output: { format: 'Text', content }, measurePass: pass, runState: 'done' })
        await advance(node, 'out', signal)
        return
      }

      case 'output': {
        // ANDREW ROUND C2 — the develop tray's whole timeline pivots on
        // `seed` staying IDENTICAL from this first patch through the `done`
        // one (run/artifacts.jsx's Artifact draws deterministically off it),
        // so it's minted exactly once here and threaded through every
        // streamOutput patch via `extra`, never recomputed.
        const format = node.data?.format
        const upstream = upstreamOf(nodeId)

        // BATCH MATRIX (PLAN.md "## BATCH MATRIX") — "an output node may
        // carry `data.batchCount: N` (template-set). On delivery the engine
        // writes `data.output.assets = [N items]`... `versions` snapshots
        // whole batches (a re-run = v2 with 25 fresh assets), exactly like
        // single outputs." Template-set only (today: part-a.js's 'Social
        // batch ×25' Graphic output) — every other output node has no
        // `data.batchCount` at all, so `batchCount` is 0 and this whole
        // branch is skipped, falling straight through to the single-asset
        // path below byte-identical to before this phase.
        const rawBatchCount = node.data?.batchCount
        const batchCount = Number.isFinite(rawBatchCount) && rawBatchCount > 0 ? Math.floor(rawBatchCount) : 0
        if (batchCount > 0) {
          // Per-item seeds are pure/synchronous (no network) — "seeded
          // deterministically off the node seed + index" (contract), the
          // SAME compound-key makeSeed(`${nodeId}:${i}`, runCount) idiom
          // Compare's own per-candidate score and chatWithHuman's own
          // per-turn seed already use above, just keyed on this item's
          // index instead of a candidate id/turn number — so item 0 of THIS
          // node's THIS run never collides with item 0 of any other batch
          // node, or the same node's item 0 on a re-run (runCount changes).
          const itemSeeds = Array.from({ length: batchCount }, (_, i) => makeSeed(`${nodeId}:${i}`, runCount))
          // `anchorSeed` (item 0's own seed) is what the streaming patch's
          // `extra.seed` carries below — "OutputNode: a batch output's
          // in-card stage shows the FIRST asset" (contract, Seam UI) is
          // free once this node's own top-level `output.seed`/`imageUrl`
          // ARE asset 0's, rather than a separate batch-anchor value the
          // in-card single-preview path would have to special-case.
          const anchorSeed = itemSeeds[0] ?? makeSeed(nodeId, runCount)
          // Real photography reuses run/artifacts.jsx's OWN format+seed ->
          // kind bucketing (imported above, same `artifactKind` the single-
          // asset path below already calls) so a real fetch's requested
          // aspect always agrees with whichever kind the seeded SVG/CAR_
          // PHOTOS backdrop (run/artifacts.jsx, run/posters.jsx — "the SAME
          // generators/real-photo pool the single-artifact path uses",
          // contract) would draw for this exact format+seed — every item's
          // OWN seed feeds that same Artifact-component draw downstream, so
          // 25 distinct seeds naturally spread the pick across the whole
          // CAR_PHOTOS pool instead of repeating one photo 25 times.
          const imagesPromise = Promise.all(
            itemSeeds.map((itemSeed) => {
              const kind = artifactKind(format, itemSeed)
              const wantsRealImage = kind === 'poster' || kind === 'social' || kind === 'video'
              return wantsRealImage
                ? runImageAdapter({ prompt: node.data?.description, kind, seed: itemSeed, signal })
                : Promise.resolve(null)
            }),
          )
          const [content, images] = await Promise.all([
            streamOutput(nodeId, format, runAdapter({ kind: 'output', node, upstream }), signal, {
              developing: true,
              seed: anchorSeed,
            }),
            imagesPromise,
          ])
          if (signal.aborted) return
          // PAIRED DELIVERABLES — resolved ONCE per batch (not per item):
          // "the run's chat answer" is one decision covering the whole
          // batch, so every asset draws from the SAME flavored pool rather
          // than each re-walking the graph independently.
          const flavor = directionFlavor(nodeId)
          const assets = itemSeeds.map((itemSeed, i) => ({
            seed: itemSeed,
            aspect: BATCH_ASPECT_RATIOS[itemSeed % BATCH_ASPECT_RATIOS.length],
            imageUrl: images[i]?.url,
            imageMime: images[i]?.mime,
            copy: pickBatchCopy(itemSeed, flavor),
          }))
          artifactCount += 1
          // CANVAS-NATIVE DELIVERABLES parity — append a version snapshot of
          // the WHOLE batch, same append-cap-8 shape the single-asset path
          // below already holds (`versions` browsing a batch node replays
          // that run's own 25 items, not just its narrated text/seed).
          const priorVersions = findNode(nodeId)?.data?.versions || []
          const versions = [...priorVersions, { content, seed: anchorSeed, format, runSeq: runCount, assets }].slice(-8)
          patchNode(nodeId, {
            output: {
              format,
              content,
              developing: false,
              seed: anchorSeed,
              imageUrl: assets[0]?.imageUrl,
              imageMime: assets[0]?.imageMime,
              assets,
            },
            versions,
            runState: 'done',
          })
          window.dispatchEvent(new CustomEvent('cw:artifact', { detail: { nodeId, format, seed: anchorSeed, number: artifactCount } }))
          await advance(node, 'out', signal)
          return
        }

        // WAVE 3 — THE VERB EXPANSION. "out carries the winner's artifact
        // (Remix/Output downstream receive it)" (master, Compare) — the
        // SAME upstreamOutputs() helper Remix consumes, read here too. When
        // the immediate upstream is a bare Generate-shaped poster (no
        // `.format` on its descriptor — only a Generate, or a Compare
        // forwarding one, ever looks like that) and this Output's own
        // format is the one that actually PAINTS a poster (Graphic —
        // matching state.jsx's own onMintOutput, which always mints
        // Graphic on a variant-grid pick), this Output visually INHERITS
        // that same artwork instead of minting an unrelated one — the
        // winner really does travel downstream, not just in the data
        // model. Every other case (a text-family upstream, a non-Graphic
        // format, no upstream at all) is untouched: seed/content generation
        // stays byte-identical to before this wave, and this Output still
        // streams its own real narrated text either way — only which
        // ARTWORK the develop tray paints ever changes.
        const inheritedCandidate = format === 'Graphic' ? upstreamOutputs(nodeId)[0] : null
        const inheritsPoster = !!inheritedCandidate && !inheritedCandidate.output.format
        const seed = inheritsPoster ? inheritedCandidate.output.seed ?? makeSeed(nodeId, runCount) : makeSeed(nodeId, runCount)
        // FINAL QUEUE — FQ-A. Real images only ever apply to the two shapes
        // PLAN.md names (Graphic's poster/social split, Video's 16:9 frame)
        // — `imageKind` reuses run/artifacts.jsx's OWN format+seed -> kind
        // bucketing (imported above) so a real photo's requested aspect
        // always agrees with whichever kind the SVG fallback would have
        // drawn for this exact format+seed; every other format (Text,
        // Presentation, Spreadsheet, ...) never matches and this whole
        // branch is a no-op for them, byte-identical to before this phase.
        // An inherited poster PASSES THROUGH its source Generate's own
        // imageUrl (if that beat got one) instead of fetching a second,
        // unrelated photo — "the winner really does travel downstream"
        // (this file's own WAVE 3 comment, above `upstreamOutputs`) applies
        // to a real photo exactly like it already does to seed/content.
        const imageKind = artifactKind(format, seed)
        const wantsRealImage = imageKind === 'poster' || imageKind === 'social' || imageKind === 'video'
        const inheritedImageUrl = inheritsPoster ? inheritedCandidate.output.imageUrl : null
        const inheritedImageMime = inheritsPoster ? inheritedCandidate.output.imageMime : null
        const imagePromise =
          !inheritedImageUrl && wantsRealImage
            ? runImageAdapter({ prompt: node.data?.description, kind: imageKind, seed, signal })
            : Promise.resolve(null)
        const [content, fetchedImage] = await Promise.all([
          streamOutput(
            nodeId,
            format,
            runAdapter({ kind: 'output', node, upstream }),
            signal,
            { developing: true, seed, poster: inheritsPoster || undefined },
          ),
          imagePromise,
        ])
        if (signal.aborted) return
        const imageUrl = inheritedImageUrl || fetchedImage?.url
        const imageMime = inheritedImageUrl ? inheritedImageMime : fetchedImage?.mime
        artifactCount += 1
        // CANVAS-NATIVE DELIVERABLES (PLAN.md "### 1 — Output versioning") —
        // APPEND a version instead of just overwriting `data.output`. Read
        // the node FRESH via findNode (not the `node` var captured at the
        // top of runNode, a stale snapshot from before this beat's own
        // queued/running delay) so this always builds on whatever versions
        // genuinely exist right now — a prior run's history, or none yet.
        // Capped at 8, oldest dropped; `runSeq` is this engine instance's
        // own per-boot `runCount` (never Date.now — versions must stay
        // fully deterministic/serializable data, PLAN.md's own "no Date.now
        // in data"), which also happens to be exactly what a locked re-run
        // needs to prove two versions are genuinely different beats.
        // FQ-A: `imageUrl`/`imageMime` ride along on the version entry too,
        // undefined-safe — a version that never got a real photo (REAL_MODE
        // off, or that beat's own fetch failed) browses back to the SAME
        // seeded SVG it always would have, exactly like every field here
        // already behaved before this phase.
        const priorVersions = findNode(nodeId)?.data?.versions || []
        const versions = [...priorVersions, { content, seed, format, runSeq: runCount, imageUrl, imageMime }].slice(-8)
        patchNode(nodeId, {
          output: { format, content, developing: false, seed, poster: inheritsPoster || undefined, imageUrl, imageMime },
          versions,
          runState: 'done',
        })
        // state.jsx's run-delivered accumulator (CANVAS-NATIVE DELIVERABLES
        // — the completion glide + the header's "N DELIVERED" stamp) is
        // this event's one listener now; fired after the patch above so any
        // listener re-reading node data via a ref/effect on this same tick
        // already sees the settled `done` output+versions, not a stale
        // 'developing' one.
        window.dispatchEvent(new CustomEvent('cw:artifact', { detail: { nodeId, format, seed, number: artifactCount } }))
        await advance(node, 'out', signal) // terminal by default, but HAS an out source (dev may chain)
        return
      }

      // VARIANT STUDIO — "Full-flow Run: engine treats a wired generate node
      // as a task-like beat (runs, develops its own frame, does NOT spawn/
      // replace grids unless it has none — first full-run spawns the grid
      // too)" (PLAN.md "### 4 — integration"). Seed keys off the NODE'S OWN
      // `data.seed` (not this run's shared `runCount` closure var, which is
      // 'output' node seeding's concern) — the standalone "Run Model" button
      // (state.jsx's cw:run-generate listener) advances that exact same
      // field with no access to this closure at all, so a card's seed
      // sequence stays coherent across manual runs AND full-flow runs.
      //
      // COMFY ROUND (CP2, item 3) — "SEED DISCIPLINE": locked reuses
      // data.seed as-is ("Re-run/Run Model reproduce identical variant
      // set"); unlocked (default) advances it by the same deterministic +1
      // step the dice button / state.jsx's onRunGenerate both use, so a
      // full-flow run and a manual Run Model stay behaviorally identical.
      case 'generate': {
        const currentSeed = node.data?.seed ?? DEFAULT_GENERATE_SEED
        const nextSeed = node.data?.seedLocked ? currentSeed : currentSeed + 1
        const seed = makeSeed(nodeId, nextSeed)
        patchNode(nodeId, { output: { developing: true, seed }, seed: nextSeed })
        // FINAL QUEUE — FQ-A. The real fetch runs CONCURRENTLY with the
        // fixed develop delay, and this beat waits for BOTH — "the develop
        // animation covers real latency" (PLAN.md): GENERATE_DEVELOP_MS is a
        // FLOOR now, not a fixed duration, whenever a real image is slower
        // than the CSS blur-in. runImageAdapter already resolves to `null`
        // whenever REAL_MODE is off (or the fetch fails/times out), so
        // `image?.url` below is simply undefined and this patch is
        // byte-identical to before this phase in every one of those cases.
        // Generate's own preview has no `format` of its own (only OUTPUT
        // nodes do) — it's always the fixed 4:5 'poster' shape, matching
        // run/posters.jsx's own single POSTER_ASPECT.
        const imagePromise = runImageAdapter({ prompt: node.data?.prompt, kind: 'poster', seed, signal })
        const [, image] = await Promise.all([delay(GENERATE_DEVELOP_MS, signal), imagePromise])
        if (signal.aborted) return
        patchNode(nodeId, {
          output: { developing: false, seed, imageUrl: image?.url, imageMime: image?.mime },
          runState: 'done',
        })
        // "does NOT spawn/replace grids unless it has none" — the gate
        // itself lives in state.jsx's wrapper (see createRunner's own param
        // comment); this just reacts to whatever it decided.
        //
        // PRODUCTION CLARITY PASS (PLAN.md "Dock = the record of what the
        // run DELIVERED, and only that") — this used to also fire one
        // cw:artifact per spawned card (`groupId`/`poster`, capped+grouped
        // by Filmstrip.jsx into a "+N more" pill). Deleted: "Generate
        // variants no longer push thumbs or the '+N more' pill... they live
        // in their grid." The grid itself (FrameNode.jsx) is now the only
        // surface that shows a take until it's picked — a card only ever
        // reaches the filmstrip by being minted into a real Output node
        // (state.jsx's onMintOutput fires the SAME cw:artifact contract the
        // 'output' case above does, so the dock can't tell the two apart —
        // by design, both are equally "delivered"). FQ-A note: the grid's
        // OWN cards (FrameNode.jsx's VariantCard) stay seeded-SVG-only —
        // they're minted by state.jsx's spawnOrReplaceGrid (out of this
        // dispatch's file grant), not this beat, so a real image never
        // threads into them; only this card's own single preview goes real.
        spawnGenerateGrid(nodeId)
        await advance(node, 'out', signal) // wireable like a Task — legal to leave disconnected too (PLAN.md)
        return
      }

      // WAVE 3 — THE VERB EXPANSION. "in + out; ... consumes
      // upstreamOutputs' first artifact, produces a DERIVED artifact (same
      // poster family, op-stamped meta line; text ops transform the real
      // text) — darkroom develop; lands in deliverables record (panel +
      // shelf) like any artifact-bearing done" (master). Mode split on the
      // SAME shape test this app already implies elsewhere: a Generate
      // node's own `data.output` never carries a `format` (only `seed` —
      // see the 'generate' case just above), while every other content-
      // bearing node's does — no `.format` on the upstream descriptor means
      // it came from a Generate, so this derives a NEW poster; any
      // `.format` means real text to transform. Registration mirrors the
      // 'output' case above byte-for-byte (append-to-`versions`, the SAME
      // `cw:artifact` dispatch) — state.jsx's own `deliverables` selector is
      // the one place that had to learn a second node TYPE can deliver.
      case 'remix': {
        const upstream = upstreamOutputs(nodeId)[0] || null
        const op = node.data?.op || 'translate'
        const stamp = REMIX_OP_STAMPS[op] || REMIX_OP_STAMPS.translate
        const isPoster = !!upstream && !upstream.output.format
        const format = isPoster ? 'Graphic' : upstream?.output.format || 'Text'
        let content
        let seed
        let aspect = null // '9 / 16' only for a poster-mode Resize; null = the card's own default aspect

        if (!upstream) {
          seed = makeSeed(nodeId, runCount)
          content = `${stamp} — nothing upstream to remix yet.`
        } else if (isPoster) {
          // POSTER MODE — "same poster family" (master): a genuinely
          // DERIVED seed, tied to (this node, the chosen op, the
          // upstream's CURRENT seed) via the same FNV primitive every
          // artifact seed in this app already uses — re-wiring to a
          // different upstream, picking a different op, or the upstream
          // itself re-generating all visibly reshuffle this card's own
          // take, never Math.random. Only Resize actually changes the
          // FRAME's aspect — every other op still paints a genuinely
          // different derived poster (new layout/colorway/headline off the
          // new seed) even though its frame stays the family's normal 4:5.
          const upstreamSeed = upstream.output.seed ?? 0
          seed = makeSeed(`${nodeId}:${op}`, upstreamSeed)
          content = `${stamp} — derived from ${upstream.nodeId}.`
          if (op === 'resize') aspect = '9 / 16'
        } else {
          // TEXT MODE — "text ops transform the real text" (master):
          // translate/tighten genuinely rewrite the REAL upstream string;
          // resize/recolor (poster-oriented ops with no real meaning on
          // text) pass the real text through untouched — the op-stamped
          // meta line is still what documents which op ran.
          seed = makeSeed(nodeId, runCount)
          const src = upstream.output.content || ''
          content = op === 'translate' ? translateText(src, seed) : op === 'tighten' ? tightenText(src, seed) : src
        }

        patchNode(nodeId, { output: { format, content, developing: true, seed, poster: isPoster, aspect } })
        await delay(GENERATE_DEVELOP_MS, signal)
        if (signal.aborted) return
        artifactCount += 1
        // CANVAS-NATIVE DELIVERABLES parity — append a version exactly like
        // the 'output' case above, so this card's own history and the
        // shared panel/shelf "vN" badge both grow across re-runs.
        const priorVersions = findNode(nodeId)?.data?.versions || []
        const versions = [...priorVersions, { content, seed, format, runSeq: runCount }].slice(-8)
        patchNode(nodeId, {
          output: { format, content, developing: false, seed, poster: isPoster, aspect },
          versions,
          runState: 'done',
        })
        window.dispatchEvent(new CustomEvent('cw:artifact', { detail: { nodeId, format, seed, number: artifactCount } }))
        await advance(node, 'out', signal)
        return
      }

      // WAVE 4 — THE VERB EXPANSION. "markets multi-chips... content =
      // per-market lines; single out" (master). Reads the same
      // upstreamOutputs() helper Remix consumes — a real text upstream gets
      // genuinely word-counted per market (localizeLine, above), same
      // "honest, not fabricated" bar Remix's own text ops hold; a
      // Generate-shaped poster upstream (no `.format`) or nothing wired in
      // at all falls back to a plain "ready" line per market instead of
      // fabricating a word count that isn't real.
      case 'localize': {
        const markets =
          Array.isArray(node.data?.markets) && node.data.markets.length ? node.data.markets : LOCALIZE_MARKET_OPTIONS
        const upstream = upstreamOutputs(nodeId)[0] || null
        const srcText = upstream && upstream.output.format ? upstream.output.content : null
        const content = markets.length ? markets.map((m) => localizeLine(m, srcText)).join('\n') : 'No markets selected.'
        patchNode(nodeId, { output: { format: 'Text', content }, runState: 'done' })
        await advance(node, 'out', signal)
        return
      }

      // WAVE 4 — THE VERB EXPANSION. "cycles stepper (×2), in + out. Engine:
      // content 'Cycle 1: sharpened hook · Cycle 2: tightened CTA —
      // projected lift +18%.' (Agentic flourish, honest demo fake.)"
      // (master, verbatim shape). Seeded (no Math.random) per (node, run) —
      // same makeSeed(nodeId, runCount) precedent every other beat's own
      // determinism already comes from; a second bit-slice of the SAME seed
      // drives the "projected lift" number, same "derived offset, no second
      // RNG stream" precedent the 'signal'/'guardrail' cases already use.
      case 'optimize': {
        const seed = makeSeed(nodeId, runCount)
        const cycles = Math.max(1, Math.min(OPTIMIZE_ACTIONS.length, node.data?.cycles ?? 2))
        const start = seed % OPTIMIZE_ACTIONS.length
        const parts = []
        for (let i = 0; i < cycles; i += 1) {
          parts.push(`Cycle ${i + 1}: ${OPTIMIZE_ACTIONS[(start + i) % OPTIMIZE_ACTIONS.length]}`)
        }
        const lift = 8 + (Math.floor(seed / 7) % 21) // deterministic 8-28%
        const content = `${parts.join(' · ')} — projected lift +${lift}%.`
        patchNode(nodeId, { output: { format: 'Text', content }, runState: 'done' })
        await advance(node, 'out', signal)
        return
      }

      // WAVE 4 — THE VERB EXPANSION. "template ComboBox (the real template
      // catalog, grouped by category). Engine: one beat, content 'Ran
      // 'Social blast' — 8 steps, 6 deliverables.' + mono step-count chip.
      // (Honest fake — no recursive engine; the subgraph phase owns real
      // nesting later.)" (master, verbatim). `steps`/`deliverables` are REAL
      // numbers off the actually-selected template's own graph — `tpl.size`
      // is that template's own authored step count (data/templates/
      // builder.js's `template()`, computed once at module load), and
      // `tpl.build()` (the SAME pure builder PalettePreview.jsx's own
      // TemplatePreviewBody already calls for an identical "count the
      // output nodes" read) gives the real deliverable count — 'social-
      // blast' genuinely IS 8 steps/6 deliverables (verified against
      // data/templates/part-a.js), so this isn't an invented pair, it's
      // what the chosen template actually contains. No recursive run: this
      // never walks the built graph, only counts it.
      case 'runworkflow': {
        const tpl = TEMPLATES.find((t) => t.id === node.data?.templateId) || TEMPLATES[0]
        const steps = tpl.size
        const deliverables = tpl.build().nodes.filter((n) => n.type === 'output').length
        const content = `Ran '${tpl.name}' — ${steps} step${steps === 1 ? '' : 's'}, ${deliverables} deliverable${deliverables === 1 ? '' : 's'}.`
        patchNode(nodeId, { output: { format: 'Text', content }, steps, deliverables, runState: 'done' })
        await advance(node, 'out', signal)
        return
      }

      default: {
        patchNode(nodeId, { runState: 'done' })
        await advance(node, 'out', signal)
      }
    }
  }

  // Shared setup/teardown for both entry points below — a fresh
  // AbortController + visited set + run/artifact counters, running the
  // supplied starter ids concurrently (`Promise.all`, same "siblings run
  // concurrently" fan-out `advance` itself already uses one level down).
  async function executeRun(starterIds) {
    if (running || !starterIds.length) return
    controller = new AbortController()
    visited = new Set()
    // F4 FIX — fresh predecessor-join state every run, same lifecycle as
    // `visited` right above: a re-run must not inherit a previous run's edge
    // fates, and `reachable` is THIS run's own starter set's forward closure
    // (full run: every trigger/params; runFrom: just the one scoped entry
    // node) — see computeReachable's own comment for why that's what makes
    // runFrom's upstream-blind contract hold under the barrier.
    edgeState = new Map()
    edgeWaiters = new Map()
    reachable = computeReachable(starterIds)
    pendingHumans.clear()
    running = true
    runCount += 1 // ANDREW ROUND C2 — a real run is starting; re-seed every artifact
    artifactCount = 0
    try {
      await Promise.all(starterIds.map((id) => runNode(id, controller.signal)))
      // RESULTS SHEET (PLAN.md) — this used to be where the free-standing
      // `results` node's completion-time spawn/reuse call lived
      // (spawnResultsFrame — see this file's own createRunner header
      // comment for the retirement note). The sheet needs no such beat
      // anymore: `resultsAnchorId`/the sheet's own row content (state.jsx,
      // ResultsNode.jsx) are both derived straight off each output node's
      // OWN `data.output`/`data.versions`/`deliveryOrder`, which this run's
      // own `patchNode` calls have already been writing throughout —
      // nothing to append to the graph, nothing to reposition, nothing to
      // race against React's commit timing the way the old synchronous
      // spawnResultsFrame() call at this exact point once did (this
      // comment block used to document a whole CDP-found "reads nodesRef
      // before the last patchNode commits" bug here; it no longer applies
      // since there is no longer a spawn call to race).
    } catch (err) {
      // Defensive — both callers below are fired-and-forgotten by state.jsx,
      // so an uncaught rejection here would otherwise surface as an
      // unhandled promise rejection in the console.
      console.error('[canvas-workflows] run engine error', err)
    } finally {
      running = false
    }
  }

  async function run() {
    // Multiple triggers are legal (Bryan) — several entry points can start
    // the same graph, exactly like multi-trigger flows in n8n/Make. All of
    // them fire together; downstream visited-tracking already dedupes any
    // shared paths.
    //
    // COMFY ROUND (CP2, item 5) — "PARAM NODE": params nodes join the
    // starter set alongside triggers. They have an out-port but NO in-port
    // (ParamsNode.jsx never renders InHandle) — `advance` only ever follows
    // OUTGOING edges, so nothing can traverse INTO a handle-less node, which
    // means nothing would ever reach one by ordinary edge-walking. Without
    // seeding them here, a params node (and everything wired from it) would
    // sit dead — no beat, no pass-through, no value ever reaching the tasks
    // it feeds — on every full-flow Run.
    // WAVE 2 — THE VERB EXPANSION. Source/Audience join for the identical
    // structural reason (0-in, same as params) — Measure is deliberately
    // excluded, it HAS an in-port and reaches the graph by ordinary
    // edge-walking like any other node.
    const starters = getNodes().filter(
      (n) => n.type === 'trigger' || n.type === 'params' || (n.type === 'signal' && (n.data?.kind || 'source') !== 'measure'),
    )
    await executeRun(starters.map((t) => t.id))
  }

  // NODE TOOLBAR V2 — "Run from here": walk starts at nodeId instead of the
  // trigger(s), downstream only. This is just `runNode` entered at a
  // different id — `advance` only ever follows OUTGOING edges, so nothing
  // upstream of nodeId is ever visited or touched, which is what leaves
  // "its upstream outputs used if present" true for free: upstream nodes'
  // `data.output` is whatever it already was (a prior full run, or nothing —
  // generate.js's own upstream fallback chain, PLAN.md R3.1, already reads
  // a not-yet-run node's instructions/description/ask as a placeholder, so
  // there's no separate "else placeholders" branch to write here). state.jsx
  // resets nodeId + everything downstream of it to idle/null before calling
  // this, so every node this walk actually reaches still gets its normal
  // fresh queued/running/done beat — same as a full run, just scoped.
  async function runFrom(nodeId) {
    const node = getNodes().find((n) => n.id === nodeId)
    if (!node) return
    await executeRun([nodeId])
  }

  // Aborts any in-flight run (unblocking a paused human's wait) and resets
  // every non-idle node's runState back to idle — outputs stay (PLAN.md
  // R1.1: "stopRun aborts ... and resets all runStates to idle (outputs
  // kept)").
  function stop() {
    if (!controller) return
    controller.abort()
    for (const node of getNodes()) {
      if (node.data?.runState && node.data.runState !== 'idle') {
        patchNode(node.id, { runState: 'idle' })
      }
    }
  }

  function continueHuman(nodeId, value) {
    const resolve = pendingHumans.get(nodeId)
    if (!resolve) return
    pendingHumans.delete(nodeId)
    resolve(value)
  }

  // HITL MICRO-CHAT (PLAN.md "## HITL MICRO-CHAT") — state.jsx's own
  // chatWithHuman context fn forwards straight into this, the same shape
  // continueHuman just above already has. Only meaningful while nodeId is
  // the run's CURRENTLY-paused chat node: `pendingHumans.has(nodeId)` is
  // this function's own "is there still a pause to talk into" guard,
  // checked both BEFORE and AFTER the reply await, so a stray call after
  // the node's already resumed (its own "Approve & continue") or after
  // stopRun is a silent no-op rather than a stale patch landing on a node
  // that has moved on. `controller` (this closure's live AbortController,
  // reassigned fresh every run — see executeRun) doubles as "is a run even
  // active"; chatWithHuman is never reachable outside one, since a chat
  // node can only be pausing because a run put it there.
  //
  // THE GATE NEGOTIATES (PLAN.md "## THE GATE NEGOTIATES") — this same
  // function now ALSO serves a paused choice-mode GATE's negotiation turns
  // (HumanNode.jsx's composer, wired for choice mode only — free mode
  // resolves straight through continueHuman and never calls this at all).
  // "Do not fork engine reply machinery, key the existing chatWithHuman/
  // reply path for paused gate nodes" (PLAN.md) — no new function, just the
  // `isChoiceGate`/`node.type === 'checkin'` branches right where each
  // node kind's own chatOptions bank gets picked (COACHING CHIPS below):
  // a checkin refreshes off pickChatOptions/CHAT_OPTION_BANK, a choice gate
  // off pickCoachingChips/CHIP_RECO_BANK — different bank, same "refresh
  // every turn" mechanics.
  //
  // The reviewer's message is appended immediately and optimistically — the
  // composer never waits on the agent's reply to show what was just typed —
  // then ONE reply is resolved through runChatAdapter (this file's own
  // single resolution point for chat, see its own comment above), bound to
  // THIS run's `controller.signal` exactly like waitForHuman/streamOutput
  // already are: a `stopRun` mid-generation aborts the signal, runChatAdapter
  // stops accumulating chunks on its own next per-chunk check (the same
  // "no dangling promise" shape streamOutput's abort-checked loop already
  // holds for task/output beats), and this function's own guards below skip
  // patching a reply that arrives after the pause is gone.
  async function chatWithHuman(nodeId, text) {
    // PLUS IS ATTACH — decode.jsx first (see `decodeChatAttachment`'s own
    // header comment for the full bridge): `attachment` is null for every
    // pre-existing caller (typed replies, coaching/agent-offered chip
    // clicks with nothing staged) — this whole function is byte-identical
    // to before this phase whenever it is.
    const { text: visible, attachment } = decodeChatAttachment(String(text ?? ''))
    const trimmed = visible.trim()
    // An attachment-only send carries no typed text — allowed through
    // exactly like canvas-attach's own "attachments allow a text-free
    // send."
    if ((!trimmed && !attachment) || !controller || !pendingHumans.has(nodeId)) return
    const node = findNode(nodeId)
    if (!node) return
    const signal = controller.signal
    const priorLog = Array.isArray(node.data?.chatLog) ? node.data.chatLog : []
    const withUser = [...priorLog, { role: 'user', text: trimmed, ...(attachment ? { attachment } : {}) }]
    patchNode(nodeId, { chatLog: withUser })
    if (signal.aborted) return
    const turnIndex = withUser.filter((m) => m.role === 'user').length

    // LIVE LEANING (PLAN.md "## LIVE LEANING") — "NEGOTIATION STEERS A
    // LEANING: after each user turn... the engine keyword-matches the
    // message against the option LABELS... and writes `data.chatLeaning`
    // in the same patch as the reply; replies acknowledge the lean when
    // one is found." Checked BEFORE runChatAdapter (not after) so a
    // matched lean short-circuits straight to the contract's own literal
    // acknowledgment line instead of ALSO running the turn through the
    // generic demo/real reply machinery — one deterministic ack, exactly
    // what both of PLAN.md's own verify turns ("lets go punchy" / "actually
    // warmer") expect. An AMBIGUOUS turn (no keyword hit) leaves `reply`
    // unset and `leaningPatch` empty — it falls through to the SAME generic
    // reply path a checkin negotiation always has, and omitting
    // `chatLeaning` from the patch entirely is exactly how "the previous
    // leaning untouched" (PLAN.md) is honored: patchNode only ever merges
    // in fields a patch actually carries.
    const isChoiceGate = node.type === 'human' && node.data?.responseType === 'choice'
    let reply
    let leaningPatch = {}
    // COACHING CHIPS amendment 3 — computed off the INCOMING text (a
    // coaching-chip click's own wording, almost always — see
    // detectProposalKind's own comment), independently of whether the
    // leaning match above found anything, and carried on whichever reply
    // ends up going out below (the canned lean-ack or the generic
    // adapter's own line): the panel rides the AGENT's turn, but what it
    // shows is entirely a function of what the reviewer's message asked
    // for.
    let proposal = null
    if (isChoiceGate) {
      const matchedId = matchLeaningOption(trimmed, node.data?.options)
      if (matchedId != null) {
        leaningPatch = { chatLeaning: matchedId }
        const label = (node.data?.options || []).find((o) => o.id === matchedId)?.label || matchedId
        reply = `Leaning ${label} then — I'll weight the batch that way unless you switch.`
      }
      const proposalKind = detectProposalKind(trimmed)
      if (proposalKind) proposal = buildProposal(proposalKind, trimmed, node.data?.options)
    }

    // PLUS IS ATTACH items 3/4 — an attachment is this turn's headline: it
    // always earns its own seeded, SPECIFIC acknowledgment (composeAttachment
    // Ack, above) rather than the generic reply adapter OR the bare lean-ack
    // literal just above (which never names what was actually attached).
    // Item 4's cheap leaning nudge only ever attempts a match when the
    // TEXT itself didn't already supply one (`leaningPatch.chatLeaning`
    // still unset) — a typed lean always wins — and only for a run-asset
    // off a genuine BATCH node: `directionFlavor` is the SAME existing
    // upstream-answer derivation `pickBatchCopy` already relies on (no
    // second graph walk invented here), but a single delivery or an
    // upload carries no flavor signal to cheaply read at all, so those
    // simply never attempt the match — "flag if not cheaply derivable and
    // skip" is this `attachment.isBatch` guard, structurally.
    if (attachment) {
      let leanLabel = null
      if (isChoiceGate) {
        if (leaningPatch.chatLeaning != null) {
          leanLabel = (node.data?.options || []).find((o) => o.id === leaningPatch.chatLeaning)?.label || null
        } else if (attachment.kind === 'run' && attachment.isBatch) {
          const flavor = directionFlavor(attachment.nodeId)
          const matchedId = flavor ? matchLeaningOption(flavor, node.data?.options) : null
          if (matchedId != null) {
            leaningPatch = { chatLeaning: matchedId }
            leanLabel = (node.data?.options || []).find((o) => o.id === matchedId)?.label || null
          }
        }
      }
      reply = composeAttachmentAck(makeSeed(`${nodeId}:attach:${turnIndex}`, runCount), attachment, leanLabel)
    } else if (reply === undefined) {
      reply = await runChatAdapter(node, trimmed, withUser, turnIndex, signal)
    }
    if (signal.aborted || !pendingHumans.has(nodeId)) return
    const agentMsg = { role: 'agent', text: reply, ...(proposal ? { proposal } : {}) }
    const patch = { chatLog: [...withUser, agentMsg], ...leaningPatch }
    // "refreshes chatOptions" (PLAN.md) — a fresh, independently-seeded pick
    // every turn (own string key, not the reply's own seed) so the chip
    // offer and the reply text vary independently of each other. THE AGENT
    // ASKS — the intent-derived trio (if any) is re-applied every refresh
    // too, off the SAME checkinSourceText priority chain the initial pause
    // seeded from (guidance/upstream/chatOpener, never `data.ask`) — it's a
    // property of that source text, not the turn, so it stays constant
    // across turns while the filler picks reshuffle.
    //
    // COACHING CHIPS — a paused choice GATE now refreshes its OWN chip row
    // too, off pickCoachingChips/CHIP_RECO_BANK instead of a checkin's
    // pickChatOptions/CHAT_OPTION_BANK: "seeded + refreshed after each
    // reply" (PLAN.md). Own `:coaching:${turnIndex}` key, distinct from the
    // leaning match's own text above and from the pause-seed `case
    // 'human':` used, so the row reshuffles independently of whether this
    // particular turn also happened to move the leaning.
    if (node.type === 'checkin') {
      patch.chatOptions = pickChatOptions(
        makeSeed(`${nodeId}:chat:${turnIndex}:options`, runCount),
        checkinSourceText(node, nodeId),
        4,
      )
    } else if (isChoiceGate) {
      patch.chatOptions = pickCoachingChips(
        makeSeed(`${nodeId}:coaching:${turnIndex}`, runCount),
        node.data?.options,
        3,
      )
    }
    patchNode(nodeId, patch)
  }

  return { run, runFrom, stop, continueHuman, chatWithHuman }
}
