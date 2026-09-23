// VARIANT STUDIO — model-node fan-out grids (PLAN.md "## VARIANT STUDIO").
// MODEL-AGNOSTIC POSTURE (PLAN.md "## MODEL-AGNOSTIC POSTURE" -> "### QUEUED
// PHASE — MODEL FABRIC") — this file grew from a single image/video roster
// into the shared provider-shaped schema every model picker in the app now
// reads from: `{ id, label, provider, modality, tier }`. Still a small,
// standalone data module (like run/artifacts.jsx) rather than living inside
// data/blocks.js — src/nodes/GenerateNode.jsx AND src/nodes/TaskNode.jsx
// (seam C) both need these rows for their own ComboBox, and the cross-seam
// contract forbids C importing from B's blocks.js. This file belongs to
// neither seam exclusively, matching the existing src/run/* precedent
// (already imported from both B's state.jsx-adjacent code and C's node
// components).
//
// Mock roster only — no model actually runs; a Task's own generation always
// goes through run/engine.js's adapter contract (demo templates / the local
// dev proxy) regardless of which row is selected here, and RUN MODEL just
// develops a seeded RIDGELINE ROAST poster (src/run/posters.jsx). Picking a
// model is entirely about the STORY (provider-aware grouping, tiered run
// pricing) — see MODEL-AGNOSTIC POSTURE's own header in PLAN.md: "nothing
// hardcodes a provider name in logic — only in data."
//
// `value`/`label` on every derived {value,label} option pair below are the
// SAME string on purpose (never `id`, which stays a stable internal slug) —
// this matches the convention every other ComboBox roster in this codebase
// already uses (TaskNode's AGENT_OPTIONS, WaitNode's UNIT_OPTIONS) and, more
// importantly, keeps `data.model` a plain human-readable string exactly like
// it always was (GenerateNode.jsx's pre-existing `Gemini 3.1 Flash (Nano
// Banana 2)` etc.) — zero behavior change for anything already storing one.
export const PROVIDERS = ['Anthropic', 'OpenAI', 'Google', 'Meta', 'Mistral', 'Local']

// ~14 models across the 6 providers (PLAN.md: "invented-but-plausible
// current names, incl. 'Local · On-prem Llama'"). Order matters: within a
// given modality slice, entries are grouped contiguously by provider in
// PROVIDERS order — ComboBox.jsx's grouped rendering (MODEL-AGNOSTIC POSTURE
// item 3) trusts the SOURCE array's order for section boundaries rather than
// re-sorting, so this array IS the section order every picker renders.
//
// The five image/video entries are VARIANT STUDIO's original roster,
// UNCHANGED in identity and relative order (just tagged with a provider +
// tier here) — "Generate keeps its image/video roster, regrouped by
// provider" (PLAN.md). Gemini stays first among them so MODEL_OPTIONS[0]
// (DEFAULT_MODEL, below) is byte-identical to before this phase.
export const MODELS = [
  // Anthropic
  { id: 'claude-opus-4.6', label: 'Claude Opus 4.6', provider: 'Anthropic', modality: 'text', tier: 'frontier' },
  { id: 'claude-sonnet-4.6', label: 'Claude Sonnet 4.6', provider: 'Anthropic', modality: 'text', tier: 'fast' },
  // OpenAI
  { id: 'gpt-5.2', label: 'GPT-5.2', provider: 'OpenAI', modality: 'text', tier: 'frontier' },
  { id: 'gpt-5.2-mini', label: 'GPT-5.2 Mini', provider: 'OpenAI', modality: 'text', tier: 'fast' },
  // Google
  { id: 'gemini-3-pro', label: 'Gemini 3 Pro', provider: 'Google', modality: 'text', tier: 'frontier' },
  { id: 'gemini-3-flash', label: 'Gemini 3 Flash', provider: 'Google', modality: 'text', tier: 'fast' },
  { id: 'gemini-3.1-flash-nano-banana-2', label: 'Gemini 3.1 Flash (Nano Banana 2)', provider: 'Google', modality: 'image', tier: 'fast' },
  // Meta
  { id: 'llama-4.2-maverick', label: 'Llama 4.2 Maverick', provider: 'Meta', modality: 'text', tier: 'frontier' },
  // Mistral
  { id: 'mistral-large-3', label: 'Mistral Large 3', provider: 'Mistral', modality: 'text', tier: 'frontier' },
  // Local
  { id: 'local-onprem-llama', label: 'Local · On-prem Llama', provider: 'Local', modality: 'text', tier: 'fast' },
  { id: 'flux-1.1-pro', label: 'Flux 1.1 Pro', provider: 'Local', modality: 'image', tier: 'fast' },
  { id: 'ideogram-3', label: 'Ideogram 3', provider: 'Local', modality: 'image', tier: 'fast' },
  { id: 'recraft-v3', label: 'Recraft V3', provider: 'Local', modality: 'image', tier: 'fast' },
  { id: 'sdxl-turbo', label: 'SDXL Turbo', provider: 'Local', modality: 'image', tier: 'fast' },
]

const MODEL_BY_VALUE = new Map(MODELS.map((m) => [m.label, m]))

// Generate's model row — unchanged image/video roster, same order as before
// this phase (see the MODELS comment above). DEFAULT_MODEL stays
// 'Gemini 3.1 Flash (Nano Banana 2)', "first/default per Bryan's reference
// shot" — untouched.
export const MODEL_OPTIONS = MODELS.filter((m) => m.modality !== 'text').map((m) => ({ value: m.label, label: m.label }))
export const DEFAULT_MODEL = MODEL_OPTIONS[0].value

// Task's new MODEL row (PLAN.md "### QUEUED PHASE — MODEL FABRIC": "Task
// cards gain a MODEL row... text-modality models, default 'Auto'... Auto is
// first row"). AUTO_MODEL_VALUE is not a real roster entry — no provider/
// tier of its own (modelGroup/modelTier below both treat it, and any other
// unrecognized value, as ungrouped + 'fast'-priced) — it means "the agent
// decides," so it costs nothing to leave alone and never surprises the RUN
// METER with a frontier price for a field nobody touched.
export const AUTO_MODEL_VALUE = 'Auto — the agent picks'
export const TASK_MODEL_OPTIONS = [
  { value: AUTO_MODEL_VALUE, label: AUTO_MODEL_VALUE },
  ...MODELS.filter((m) => m.modality === 'text').map((m) => ({ value: m.label, label: m.label })),
]

// MODEL-AGNOSTIC POSTURE item 3 — "combo-boxes group by provider (section
// labels in the popover, same cw-section-label voice) wherever models are
// picked." One helper for every picker's `groupOf` prop (ComboBox.jsx):
// returns null for anything not in the roster (AUTO_MODEL_VALUE, or a stray
// legacy value), which ComboBox renders with no header at all — exactly what
// "Auto is first row" wants: ungrouped, ahead of every provider section.
export function modelGroup(value) {
  return MODEL_BY_VALUE.get(value)?.provider || null
}

// RUN METER pricing (PLAN.md "### QUEUED PHASE — MODEL FABRIC": "Run meter
// ... prices by tier: frontier runs decrement 2, fast 1 — the 'costs
// something real' story, now provider-aware"). Unknown values (Auto, an
// unset field, a stray legacy string) resolve to 'fast' — the safe, cheap
// default described above.
export const RUN_COST_BY_TIER = { fast: 1, frontier: 2 }

export function modelTier(value) {
  return MODEL_BY_VALUE.get(value)?.tier || 'fast'
}

export function runCostForModel(value) {
  return RUN_COST_BY_TIER[modelTier(value)] || 1
}

// Highest cost among a list of model values — a run that touches several
// task/generate nodes prices at whatever its priciest one would alone
// (state.jsx: the header Run / "Run from here" scan every task+generate node
// the walk is about to touch). Empty/all-fast/all-Auto -> 1, never 0 — every
// run costs at least one credit.
export function runCostForModels(values) {
  return (values || []).reduce((max, v) => Math.max(max, runCostForModel(v)), 1)
}

// VARIANTS segmented control options (PLAN.md part 1: "segmented 1 / 4 / 6 /
// 10 (default 6)").
export const VARIANT_COUNTS = [1, 4, 6, 10]
export const DEFAULT_VARIANTS = 6

// COMFY ROUND (CP2, item 3) — "SEED DISCIPLINE". A fixed starting literal
// (not Math.random()) — "no Math.random" holds for the seed's own origin,
// not just its advancement (the dice button / auto-advance-while-unlocked
// both just add 1 to whatever this starts at). Shared between
// data/blocks.js (GenerateNode's makeData()), state.jsx (the manual "Run
// Model" handler + the variant grid spawner), and run/engine.js (the
// full-flow 'generate' beat) — same reasoning DEFAULT_MODEL/DEFAULT_VARIANTS
// above are already imported into both B and C from this neither-seam file.
export const DEFAULT_GENERATE_SEED = 1000

// Round-robin fake reference-image names for the "+ Add image input" chip
// row (PLAN.md part 1: "picks round-robin from the artifact studies as fake
// refs, named ref_01.jpg style, removable ×"). Purely decorative — no real
// files, no real thumbnails beyond a tiny seeded swatch the node renders.
export function nextImageInputName(existingCount) {
  return `ref_${String((existingCount % 12) + 1).padStart(2, '0')}.jpg`
}
