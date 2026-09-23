// Seam B — App core
//
// Static mock data owned by this seam: the left palette's rows, the 4 mock
// agents a Task can select, and small display helpers used by state.jsx.
//
// NOTE per the cross-seam contract: C's node components (src/nodes/*) cannot
// import this file, so anything C's UI needs at render time (the agent list
// inside a Task's AGENT sub-card, per-format output icons, etc.) is necessarily
// duplicated over there from the same PLAN.md spec. This copy exists for B's
// own consumption — the palette, and the compiled-panel's aggregation.

// VARIANT STUDIO — GENERATE's default model/variant-count, shared with
// src/nodes/GenerateNode.jsx's ComboBox/Segmented via the standalone
// data/models.js module (neither seam's own file — see that file's header).
// COMFY ROUND (CP2, item 3) — DEFAULT_GENERATE_SEED, same sharing precedent.
import { DEFAULT_MODEL, DEFAULT_VARIANTS, DEFAULT_GENERATE_SEED } from './models.js'

// The mock agents a Task can select, and what each one "uses". `kind` mirrors
// the exact caps tag shot-2's AGENT sub-card renders on each uses-row.
// Grown from 4 to 28 (Bryan: "add a ton of agents in the combo boxes") — the
// original four stay FIRST and byte-identical: demo flows pick them by name
// and state.jsx's AUTOFIX_AGENT is 'Omni Research Agent'. Uses draw from a
// shared pool of tools/knowledge/skills so the compiled panel's distinct-set
// counting stays interesting across multi-agent flows.
export const MOCK_AGENTS = [
  {
    name: 'Omni Audience Agent',
    uses: [{ name: 'audience_mcp', kind: 'TOOL' }],
  },
  {
    name: 'Omni Research Agent',
    uses: [
      { name: 'web_search', kind: 'TOOL' },
      { name: 'Market Insights', kind: 'KNOWLEDGE' },
    ],
  },
  {
    name: 'Omni Creative Agent',
    uses: [{ name: 'Brand Guidelines', kind: 'KNOWLEDGE' }],
  },
  {
    name: 'Omni Media Agent',
    uses: [{ name: 'plan_mcp', kind: 'TOOL' }],
  },
  {
    name: 'Omni Brand Agent',
    uses: [
      { name: 'Brand Guidelines', kind: 'KNOWLEDGE' },
      { name: 'Tone of Voice', kind: 'KNOWLEDGE' },
    ],
  },
  {
    name: 'Omni Copy Agent',
    uses: [
      { name: 'Tone of Voice', kind: 'KNOWLEDGE' },
      { name: 'Headline Craft', kind: 'SKILL' },
    ],
  },
  {
    name: 'Omni Social Agent',
    uses: [
      { name: 'social_scheduler', kind: 'TOOL' },
      { name: 'Channel Benchmarks', kind: 'KNOWLEDGE' },
    ],
  },
  {
    name: 'Omni Email Agent',
    uses: [
      { name: 'mail_engine', kind: 'TOOL' },
      { name: 'CRM Segments', kind: 'KNOWLEDGE' },
    ],
  },
  {
    name: 'Omni SEO Agent',
    uses: [
      { name: 'seo_toolkit', kind: 'TOOL' },
      { name: 'web_search', kind: 'TOOL' },
    ],
  },
  {
    name: 'Omni Search Ads Agent',
    uses: [
      { name: 'ad_server', kind: 'TOOL' },
      { name: 'Channel Benchmarks', kind: 'KNOWLEDGE' },
    ],
  },
  {
    name: 'Omni Programmatic Agent',
    uses: [
      { name: 'dsp_bridge', kind: 'TOOL' },
      { name: 'media_mix', kind: 'TOOL' },
    ],
  },
  {
    name: 'Omni Analytics Agent',
    uses: [
      { name: 'analytics_mcp', kind: 'TOOL' },
      { name: 'sql_runner', kind: 'TOOL' },
    ],
  },
  {
    name: 'Omni Data Science Agent',
    uses: [
      { name: 'sql_runner', kind: 'TOOL' },
      { name: 'Model Registry', kind: 'KNOWLEDGE' },
    ],
  },
  {
    name: 'Omni Insights Agent',
    uses: [
      { name: 'trend_scan', kind: 'TOOL' },
      { name: 'Market Insights', kind: 'KNOWLEDGE' },
    ],
  },
  {
    name: 'Omni Strategy Agent',
    uses: [
      { name: 'Campaign Archive', kind: 'KNOWLEDGE' },
      { name: 'Story Framing', kind: 'SKILL' },
    ],
  },
  {
    name: 'Omni Planning Agent',
    uses: [
      { name: 'plan_mcp', kind: 'TOOL' },
      { name: 'media_mix', kind: 'TOOL' },
    ],
  },
  {
    name: 'Omni Budget Agent',
    uses: [
      { name: 'budget_mcp', kind: 'TOOL' },
      { name: 'Pricing Sheets', kind: 'KNOWLEDGE' },
    ],
  },
  {
    name: 'Omni Commerce Agent',
    uses: [
      { name: 'commerce_feed', kind: 'TOOL' },
      { name: 'Retail Calendars', kind: 'KNOWLEDGE' },
    ],
  },
  {
    name: 'Omni Retail Media Agent',
    uses: [
      { name: 'retail_network', kind: 'TOOL' },
      { name: 'Retail Calendars', kind: 'KNOWLEDGE' },
    ],
  },
  {
    name: 'Omni Influencer Agent',
    uses: [
      { name: 'creator_match', kind: 'TOOL' },
      { name: 'Channel Benchmarks', kind: 'KNOWLEDGE' },
    ],
  },
  {
    name: 'Omni PR Agent',
    uses: [
      { name: 'press_wire', kind: 'TOOL' },
      { name: 'Media List', kind: 'KNOWLEDGE' },
    ],
  },
  {
    name: 'Omni Events Agent',
    uses: [
      { name: 'venue_book', kind: 'TOOL' },
      { name: 'Run of Show', kind: 'SKILL' },
    ],
  },
  {
    name: 'Omni Video Agent',
    uses: [
      { name: 'asset_mcp', kind: 'TOOL' },
      { name: 'Cutdown Craft', kind: 'SKILL' },
    ],
  },
  {
    name: 'Omni Design Agent',
    uses: [
      { name: 'dam_search', kind: 'TOOL' },
      { name: 'Creative Library', kind: 'KNOWLEDGE' },
    ],
  },
  {
    name: 'Omni Production Agent',
    uses: [
      { name: 'asset_mcp', kind: 'TOOL' },
      { name: 'Spec Sheets', kind: 'KNOWLEDGE' },
    ],
  },
  {
    name: 'Omni Localization Agent',
    uses: [
      { name: 'translate_mcp', kind: 'TOOL' },
      { name: 'Market Glossaries', kind: 'KNOWLEDGE' },
    ],
  },
  {
    name: 'Omni Compliance Agent',
    uses: [
      { name: 'policy_check', kind: 'TOOL' },
      { name: 'Legal Playbook', kind: 'KNOWLEDGE' },
    ],
  },
  {
    name: 'Omni CRM Agent',
    uses: [
      { name: 'crm_mcp', kind: 'TOOL' },
      { name: 'CRM Segments', kind: 'KNOWLEDGE' },
    ],
  },
]

// Chip-row dot colors for a Task's +Agent / +Knowledge base / +Skill / +Tool /
// +File row (§Graph schema "Chip dots"). Kept here for reference/reuse even
// though C's TaskNode renders the actual chips.
export const CHIP_TYPES = [
  { kind: 'Agent', color: 'var(--cw-accent, #1858EE)' },
  { kind: 'Knowledge base', color: '#0EA5E9' },
  { kind: 'Skill', color: '#8B5CF6' },
  { kind: 'Tool', color: '#F59E0B' },
  { kind: 'File', color: '#64748B' },
]

// Output node formats in the exact order shot-1's OUTPUTS section lists them,
// each with the Phosphor icon name the plan's OUTPUT node spec calls for.
export const OUTPUT_FORMATS = [
  { format: 'Email', icon: 'EnvelopeSimple' },
  { format: 'Teams', icon: 'ChatsCircle' },
  { format: 'Text', icon: 'TextT' },
  { format: 'Graphic', icon: 'Image' },
  { format: 'Video', icon: 'VideoCamera' },
  { format: 'Audio', icon: 'Waveform' },
  { format: 'Presentation', icon: 'PresentationChart' },
  { format: 'Doc', icon: 'FileDoc' },
  { format: 'Spreadsheet', icon: 'Table' },
  { format: 'Templated Output', icon: 'Layout' },
]

const slug = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

// LIBRARY PASS ("## LIBRARY PASS — folders + hover previews in the palette")
// — computed once, ahead of PALETTE_SECTIONS, so the 'outputs' section's
// flat `items` (unchanged shape — picker/search still read exactly this,
// per the phase's own "verify neither regresses") and its new `children`
// sub-folders (Documents/Media/Data) point at the SAME item objects rather
// than parallel copies. One source; `children` is purely a second, grouped
// VIEW over it.
const OUTPUT_ITEMS = OUTPUT_FORMATS.map(({ format, icon }) => ({
  id: `output-${slug(format)}`,
  nodeType: 'output',
  icon,
  accent: 'var(--cw-accent)',
  label: format,
  makeData: () => ({ format, description: '' }),
}))

// Left-rail palette: one row per draggable/click-to-add block kind, grouped
// into the three sections shot-1 shows. `nodeType` must be a key of the
// `nodeTypes` map C's ./nodes/index.js exports. `makeData()` returns a fresh
// `data` object matching §Graph schema for a brand-new node of that kind.
//
// THEMES PHASE: `accent` is a CSS color VALUE (var(--cw-...) string or a
// literal), applied inline by Palette.jsx's `style={{ background: item.accent }}`
// — so each row's tile traces to the same --cw-kind-*/--cw-accent tokens its
// rendered node card uses (nodes/nodes.css), staying in sync across brand
// themes. (`wait` previously used a lighter #D1D5DB two-tone tile; since
// tile glyphs went white per Bryan 2026-08-11, it now uses its node's own
// --cw-kind-wait slate so the white glyph keeps contrast.)
export const PALETTE_SECTIONS = [
  {
    // WAVE 1 — THE VERB EXPANSION (PLAN.md master contract, "### Shared
    // infrastructure" -> "Taxonomy"): "blocks.js sections become: SOURCES
    // (Source, Audience, Style Reference, Params — Params MOVES here),
    // ACTIONS (...), LOGIC (...), OUTPUTS (unchanged), ANNOTATE." Params is
    // the only row that exists yet (Source/Audience land in Wave 2, Style
    // Reference in Wave 3) — this section is created now, in taxonomy
    // position, so later waves only ever ADD an item here rather than also
    // having to invent the section itself.
    id: 'sources',
    label: 'SOURCES',
    items: [
      // WAVE 2 — THE VERB EXPANSION (PLAN.md "### WAVE 2 — SOURCES &
      // SIGNALS"). Source/Audience/Measure share ONE node type ('signal',
      // see nodes/SignalNode.jsx's own header comment for the full
      // reasoning) — `id` matches `data.kind` one-for-one, same convention
      // logic's six kinds already use. Ordered to match the master
      // contract's own taxonomy listing ("SOURCES (Source, Audience, Style
      // Reference, Params...)"): the two new out-only value sources first,
      // Measure right after (introduced in the same wave header, "SOURCES &
      // SIGNALS"), Params trailing per "Params MOVES here."
      {
        id: 'source',
        nodeType: 'signal',
        icon: 'Database',
        accent: 'var(--cw-kind-signal)',
        label: 'Source',
        caption: 'Pulls in a brief, folder, sheet, or feed',
        makeData: () => ({ kind: 'source', sourceKind: 'brief', ref: 'Q4_brief.pdf' }),
      },
      {
        id: 'audience',
        nodeType: 'signal',
        icon: 'UsersThree',
        accent: 'var(--cw-kind-signal)',
        label: 'Audience',
        caption: 'Defines who this flow is for',
        makeData: () => ({
          kind: 'audience',
          segments: [
            { id: 'seg-1', label: 'Urban commuters 25-34' },
            { id: 'seg-2', label: 'Weekend brunchers' },
          ],
        }),
      },
      {
        id: 'measure',
        nodeType: 'signal',
        icon: 'Target',
        accent: 'var(--cw-kind-signal)',
        label: 'Measure',
        caption: 'Checks a live reading against a target',
        makeData: () => ({ kind: 'measure', kpi: 'CTR', target: '≥ 1.2%', windowDays: 7 }),
      },
      {
        // WAVE 3 — THE VERB EXPANSION (PLAN.md "### WAVE 3 — CREATIVE
        // CHAIN"). Fourth 'signal' kind — see nodes/SignalNode.jsx's own
        // header comment for the "why one type" reasoning shared by every
        // kind on this type. Placed right after Measure (Wave 2's own
        // last-landed signal) and still ahead of Params, matching the
        // master's own taxonomy bullet naming Style Reference as a SOURCES
        // row and "Params trailing" as the one ordering rule it actually
        // enforces.
        id: 'style',
        nodeType: 'signal',
        icon: 'Swatches',
        accent: 'var(--cw-kind-signal)',
        label: 'Style Reference',
        caption: 'Locks a look — colorway, references',
        makeData: () => ({ kind: 'style', imageInputs: [], seed: DEFAULT_GENERATE_SEED }),
      },
      {
        // COMFY ROUND (CP2, item 5) — "PARAM NODE". MOVED here from ACTIONS
        // (WAVE 1 taxonomy pass) — it was always a value SOURCE, not a
        // workflow step with its own behavior; this section makes that
        // explicit instead of grouping it with the things it feeds. Neutral
        // kind color unchanged (no new --cw-kind-* token — DESIGN BAR item 1
        // still holds: --cw-kind-signal belongs to the three rows above,
        // Params keeps the plain-value-carrier neutral it always had).
        id: 'params',
        nodeType: 'params',
        icon: 'SlidersHorizontal',
        accent: 'var(--cw-text-3)',
        label: 'Params',
        caption: 'Campaign values for Tasks to use',
        makeData: () => ({ markets: [], budget: 50000, window: { start: '', end: '' } }),
      },
    ],
  },
  {
    id: 'actions',
    label: 'ACTIONS',
    items: [
      {
        // The builder boots onto an EMPTY canvas now, so the palette must be
        // able to start a flow — Trigger is a first-class block (green, like
        // its token in the manifest copy). Single-instance: state.jsx ignores
        // adds while one exists, and Palette.jsx dims this row.
        id: 'trigger',
        nodeType: 'trigger',
        icon: 'Power',
        accent: 'var(--cw-kind-trigger, #10B981)',
        label: 'Trigger',
        caption: 'Starts the workflow',
        makeData: () => ({ mode: 'manual', autoStart: false }),
      },
      {
        id: 'task',
        nodeType: 'task',
        icon: 'ClipboardText',
        accent: 'var(--cw-accent)',
        label: 'Task / Action',
        caption: 'Runs once, or on repeat',
        makeData: () => ({ number: null, title: 'Task / Action', instructions: '', agent: null, repeat: 'once' }),
      },
      {
        // VARIANT STUDIO (PLAN.md "## VARIANT STUDIO" -> "### 4 —
        // integration") — "GENERATE block row in ACTIONS (after Task)".
        // Kind color is --cw-accent ("it's an action that produces media"),
        // same family as Task/Output, not a new fixed --cw-kind-* token.
        id: 'generate',
        nodeType: 'generate',
        icon: 'Sparkle',
        accent: 'var(--cw-accent)',
        label: 'Generate',
        caption: 'Produces media from a prompt',
        makeData: () => ({
          title: 'Generate key visuals',
          model: DEFAULT_MODEL,
          prompt: '',
          imageInputs: [],
          variants: DEFAULT_VARIANTS,
          runState: 'idle',
          output: null,
          // COMFY ROUND (CP2, item 3) — "SEED DISCIPLINE". `seed` replaces
          // the old bare `runCount`'s role as the actual makeSeed() epoch
          // (state.jsx/run/engine.js); `seedLocked` false is the default —
          // "always fresh" preserves today's pre-existing behavior until a
          // user explicitly locks the padlock.
          seed: DEFAULT_GENERATE_SEED,
          seedLocked: false,
          groupId: null,
        }),
      },
      {
        // WAVE 3 — THE VERB EXPANSION (PLAN.md "### WAVE 3 — CREATIVE
        // CHAIN"). Own node type — see nodes/RemixNode.jsx's own header
        // comment for why. Taxonomy position matches the master bullet's
        // explicit ordering verbatim: "Trigger, Task, Generate, Remix,
        // ... Human Intervention" — right after Generate.
        id: 'remix',
        nodeType: 'remix',
        icon: 'Shuffle',
        accent: 'var(--cw-accent)',
        label: 'Remix',
        caption: 'Transforms an upstream artifact',
        makeData: () => ({ op: 'translate', output: null }),
      },
      {
        // WAVE 4 — THE VERB EXPANSION (PLAN.md "### WAVE 4 — OPS & META").
        // Own node type — see nodes/LocalizeNode.jsx's own header comment.
        // Taxonomy position matches the master bullet's explicit ordering
        // verbatim: "...Remix, Localize, Optimize, Run workflow, Human
        // Intervention..." — right after Remix.
        id: 'localize',
        nodeType: 'localize',
        icon: 'Translate',
        accent: 'var(--cw-accent)',
        label: 'Localize',
        caption: 'Adapts the work for each selected market',
        makeData: () => ({ markets: ['DE', 'FR', 'JP', 'MX'] }),
      },
      {
        // WAVE 4 — THE VERB EXPANSION. Own node type — see
        // nodes/OptimizeNode.jsx's own header comment.
        id: 'optimize',
        nodeType: 'optimize',
        icon: 'TrendUp',
        accent: 'var(--cw-accent)',
        label: 'Optimize',
        caption: 'Runs improvement cycles over the work',
        makeData: () => ({ cycles: 2 }),
      },
      {
        // WAVE 4 — THE VERB EXPANSION. Own node type — see
        // nodes/RunWorkflowNode.jsx's own header comment. `templateId`
        // defaults to the roster's first/simplest entry (data/templates/
        // part-a.js's 'ask-answer', "Quick start" category) — same
        // "first-in-roster default" convention DEFAULT_MODEL (data/
        // models.js) already established, rather than importing the whole
        // TEMPLATES catalog into this file just for a default literal.
        id: 'run-workflow',
        nodeType: 'runworkflow',
        icon: 'FlowArrow',
        accent: 'var(--cw-accent)',
        label: 'Run Workflow',
        caption: 'Runs a whole template as one step',
        makeData: () => ({ templateId: 'ask-answer' }),
      },
      {
        id: 'human',
        nodeType: 'human',
        icon: 'User',
        accent: 'var(--cw-kind-human)',
        label: 'Human Intervention',
        caption: 'Waits for a person',
        makeData: () => ({ number: null, ask: '', responseType: 'free', options: [] }),
      },
      {
        // THE SPLIT (PLAN.md "## THE SPLIT — two human nodes: the Gate and
        // the Check-in") — the chat half of the old dual-identity human
        // node is now its own type/palette block, right next to Human
        // Intervention per the contract's own placement note. `icon:
        // 'ChatsCircle'` reuses the SAME glyph the Teams output format
        // already wears (below, in the Outputs section) rather than adding
        // a new Phosphor import name to the palette's own hand-duplicated
        // icon maps (Palette.jsx/PalettePreview.jsx/BlockPicker.jsx — all
        // out of this seam's file grant) that don't carry one yet.
        // `responseType: 'chat'` in makeData is NOT a UI control (Checkin
        // Node.jsx renders none — no Segmented, no tab) — it's a data-only
        // breadcrumb kept purely so FlowCanvas.jsx's existing chat-pause
        // camera glide (`chatPausedKey`, out of this seam's grant) keeps
        // recognizing a paused check-in the same way it always has; nothing
        // in CheckinNode.jsx or run/engine.js's own pause path reads it —
        // both key on node TYPE now (see CheckinNode.jsx's own header note).
        id: 'checkin',
        nodeType: 'checkin',
        icon: 'ChatsCircle',
        accent: 'var(--cw-kind-human)',
        label: 'Agent Check-in',
        caption: 'Opens a live chat with a person, then continues',
        makeData: () => ({ number: null, ask: '', options: [], responseType: 'chat' }),
      },
      {
        // WAVE 4 — THE VERB EXPANSION. Own node type (reuses HumanNode's
        // pause machinery, not its own kind on it) — see
        // nodes/HandoffNode.jsx's own header comment for the full "kind vs.
        // own type" call. Taxonomy position matches the master bullet's
        // explicit ordering verbatim: "...Human Intervention, Handoff,
        // Wait, Stop" — right after Human Intervention.
        id: 'handoff',
        nodeType: 'handoff',
        icon: 'UserSwitch',
        accent: 'var(--cw-kind-human)',
        label: 'Handoff',
        caption: 'Pauses the run and hands this step to a person',
        makeData: () => ({ owner: 'Mara Lindqvist', due: 'Fri · EOD', note: '' }),
      },
      {
        id: 'wait',
        nodeType: 'wait',
        icon: 'Hourglass',
        accent: 'var(--cw-kind-wait)',
        label: 'Wait / Delay',
        caption: 'Pauses for a set time',
        makeData: () => ({ amount: '10', unit: 'minutes' }),
      },
      {
        id: 'stop',
        nodeType: 'stop',
        icon: 'StopCircle',
        accent: 'var(--cw-kind-stop)',
        label: 'Stop',
        caption: 'Ends the run here',
        makeData: () => ({}),
      },
    ],
  },
  {
    id: 'logic',
    label: 'LOGIC',
    items: [
      {
        id: 'if',
        nodeType: 'logic',
        icon: 'GitBranch',
        accent: 'var(--cw-kind-logic)',
        label: 'If / Else',
        caption: 'Branch on a condition',
        makeData: () => ({ kind: 'if' }),
      },
      {
        id: 'switch',
        nodeType: 'logic',
        icon: 'ArrowsSplit',
        accent: 'var(--cw-kind-logic)',
        label: 'Switch / Case',
        caption: 'Branch on a value',
        makeData: () => ({ kind: 'switch', options: [] }),
      },
      {
        id: 'foreach',
        nodeType: 'logic',
        icon: 'Repeat',
        accent: 'var(--cw-kind-logic)',
        label: 'For Each',
        caption: 'Repeat over a list',
        makeData: () => ({ kind: 'foreach' }),
      },
      {
        id: 'try',
        nodeType: 'logic',
        icon: 'ShieldWarning',
        accent: 'var(--cw-kind-logic)',
        label: 'Try / Catch',
        caption: 'Branch on failure',
        makeData: () => ({ kind: 'try' }),
      },
      {
        // WAVE 1 — THE VERB EXPANSION. Many-in fan-in, one plain out
        // (LogicNode.jsx) — no configurable fields, so makeData() is just
        // the kind tag, same shape as if/foreach/try above.
        id: 'gather',
        nodeType: 'logic',
        icon: 'ArrowsInSimple',
        accent: 'var(--cw-kind-logic)',
        label: 'Gather',
        caption: 'Waits for every incoming branch, then bundles them.',
        makeData: () => ({ kind: 'gather' }),
      },
      {
        // WAVE 1 — THE VERB EXPANSION. `percentA` is the ONE stored field —
        // B is always the 100-complement (LogicNode.jsx's SplitBody), so the
        // pair can never drift out of sync.
        id: 'split',
        nodeType: 'logic',
        icon: 'Percent',
        accent: 'var(--cw-kind-logic)',
        label: 'A/B Split',
        caption: 'Splits into two weighted arms.',
        makeData: () => ({ kind: 'split', percentA: 70 }),
      },
      {
        // WAVE 3 — THE VERB EXPANSION. Fan-in like Gather (same 'logic'
        // type reuse — see LogicNode.jsx's own LOGIC_META comment); scores
        // + nominates a winner rather than bundling. Taxonomy position
        // matches the master bullet's own ordering: "...Gather, A/B Split,
        // Compare, Guardrail" — right after A/B Split.
        id: 'compare',
        nodeType: 'logic',
        icon: 'Ranking',
        accent: 'var(--cw-kind-logic)',
        label: 'Compare',
        caption: 'Scores incoming candidates and picks a winner.',
        makeData: () => ({ kind: 'compare', criteria: 'Brand fit' }),
      },
      {
        // WAVE 4 — THE VERB EXPANSION (PLAN.md "### WAVE 4 — OPS & META").
        // Joins LogicNode.jsx's existing `logic` type as a new `kind` — same
        // "try/catch anatomy" reuse Try/Catch itself already established
        // (two named branch handles, PASS/FLAG here vs. Try/Catch's
        // try/catch), logic purple per the master's own color discipline.
        // Taxonomy position matches the master bullet's explicit ordering
        // verbatim: "...Gather, A/B Split, Compare, Guardrail" — last.
        id: 'guardrail',
        nodeType: 'logic',
        icon: 'ShieldCheck',
        accent: 'var(--cw-kind-logic)',
        label: 'Guardrail',
        caption: 'Checks the work against a set of rules.',
        makeData: () => ({ kind: 'guardrail', checks: ['Legal Playbook', 'Brand Guidelines', 'Claims register'] }),
      },
    ],
  },
  {
    id: 'outputs',
    label: 'OUTPUTS',
    singleLine: true,
    items: OUTPUT_ITEMS,
    // LIBRARY PASS — "OUTPUTS earns real nesting — sub-folders indented
    // 14px: Documents (...), Media (...), Data (...)" (PLAN.md, verbatim
    // list). That list names 9 of the 10 formats; Presentation is the one
    // it leaves out. Filed under Documents here — an office file in the
    // Text/Doc/Email/Teams family, not a raw media asset (Media) or a
    // tabular/structured export (Data).
    children: [
      {
        id: 'outputs-documents',
        label: 'Documents',
        items: OUTPUT_ITEMS.filter((item) => ['Text', 'Doc', 'Email', 'Teams', 'Presentation'].includes(item.label)),
      },
      {
        id: 'outputs-media',
        label: 'Media',
        items: OUTPUT_ITEMS.filter((item) => ['Graphic', 'Video', 'Audio'].includes(item.label)),
      },
      {
        id: 'outputs-data',
        label: 'Data',
        items: OUTPUT_ITEMS.filter((item) => ['Spreadsheet', 'Templated Output'].includes(item.label)),
      },
    ],
  },
  {
    // COMFY ROUND (CP2, item 1) — "new ANNOTATE palette section (last)".
    // Kept as its own section rather than folding into ACTIONS/OUTPUTS: a
    // note carries no handles and never runs, so it isn't really either of
    // those families. BlockPicker.jsx filters this whole section out (same
    // precedent as its Trigger exclusion) — nothing here can be wired, so it
    // has no business in a "splice a connected block" menu.
    id: 'annotate',
    label: 'ANNOTATE',
    items: [
      {
        id: 'note',
        nodeType: 'note',
        icon: 'NotePencil',
        accent: 'var(--cw-warn-text)',
        label: 'Note',
        caption: 'A comment on the canvas',
        makeData: () => ({ title: '', body: '' }),
      },
    ],
  },
]

export const PALETTE_FOOTER_TEXT =
  'Map the flow that produces your Output. The Trigger starts the workflow — wire it to Actions and Outputs, branch with Logic blocks, and add Agents, knowledge bases, tools, and skills from inside a Task. Click an empty + on a block to add a Task off that side, or use the controls on a connection to drop a Task between two blocks or cut the connection. Anything left unconnected ends the workflow at that point.'

// Human-readable "title" per node — used only for the "isn't connected" issue
// message (state.jsx), mirroring the word(s) each card's own header renders.
export function nodeDisplayTitle(node) {
  switch (node.type) {
    case 'trigger':
      return 'Trigger'
    case 'task':
      return node.data?.title || 'Task / Action'
    case 'human':
      return 'Human Intervention'
    // THE SPLIT — fixed display name (no editable title field, same footing
    // as Handoff/Remix above), reached by issueSubject's own disconnected-
    // check text if a check-in is ever dropped with nothing wired into it.
    case 'checkin':
      return 'Agent Check-in'
    case 'output':
      return 'Output'
    case 'wait':
      return 'Wait / Delay'
    case 'stop':
      return 'Stop'
    case 'logic': {
      // WAVE 1/3/4 — THE VERB EXPANSION.
      const labels = {
        if: 'If / Else',
        switch: 'Switch / Case',
        foreach: 'For Each',
        try: 'Try / Catch',
        gather: 'Gather',
        split: 'A/B Split',
        compare: 'Compare',
        guardrail: 'Guardrail',
      }
      return labels[node.data?.kind] || 'Logic'
    }
    // VARIANT STUDIO — reached by computeIssues' "no prompt" check
    // (state.jsx); the group/variant types never enter issueSubject at all
    // (both exempted from every issue kind), so they need no case here.
    case 'generate':
      return node.data?.title || 'Generate'
    // COMFY ROUND (CP2) — 'note' never reaches issueSubject (exempted from
    // every issue kind, same as generate/trigger), but IS read directly by
    // FlowCanvas.jsx's on-canvas search (searchHaystack), so a note with no
    // title still needs a sane fallback rather than falling through to the
    // generic `node.type` string below.
    case 'note':
      return node.data?.title || 'Note'
    // COMFY ROUND (CP2, item 5) — fixed display name (no editable title
    // field, same footing as Wait/Stop above); reached by issueSubject's
    // `${n}. ${nodeDisplayTitle(node)}` pattern if a params node ever DID
    // carry an issue (it never does today — no checks reference 'params' in
    // computeIssues — but this keeps the function total rather than falling
    // through to the generic `node.type` string below).
    case 'params':
      return 'Campaign Params'
    // WAVE 2/3 — THE VERB EXPANSION. Mirrors the 'logic' case's own
    // kind-keyed label lookup just above — source/audience/measure/style
    // share node.type 'signal', discriminated by data.kind.
    case 'signal': {
      const labels = { source: 'Source', audience: 'Audience', measure: 'Measure', style: 'Style Reference' }
      return labels[node.data?.kind] || 'Signal'
    }
    // WAVE 3 — THE VERB EXPANSION. Fixed display name (no editable title
    // field — unlike task/generate/note, RemixNode.jsx's own card always
    // reads "Remix"), reached by issueSubject's own disconnected-check text
    // if a Remix is ever dropped with nothing wired into it.
    case 'remix':
      return 'Remix'
    // WAVE 4 — THE VERB EXPANSION. Fixed display names — none of these four
    // types carry an editable title field (matching Remix's own footing
    // just above), reached by issueSubject's own disconnected-check text if
    // one is ever dropped with nothing wired into it.
    case 'handoff':
      return 'Handoff'
    case 'localize':
      return 'Localize'
    case 'optimize':
      return 'Optimize'
    case 'runworkflow':
      return 'Run Workflow'
    default:
      return node.type || 'Block'
  }
}

// Shared factory for a brand-new Task node's data — reused by state.jsx for
// the ghost add-buttons (cw:add-from) and the edge +insert control
// (cw:edge-insert), which both always spawn a plain Task.
export function makeTaskData() {
  return PALETTE_SECTIONS.find((s) => s.id === 'actions').items.find((i) => i.id === 'task').makeData()
}


// Lookup by id — the drag payload is JSON, and JSON.stringify silently drops
// functions, so a dropped item arrives WITHOUT its makeData(). Resolving the
// live entry by id is what makes drag-and-drop equivalent to click-to-add.
export function paletteItemById(id) {
  for (const section of PALETTE_SECTIONS) {
    const hit = section.items.find((i) => i.id === id)
    if (hit) return hit
  }
  return null
}

// LIBRARY PASS — "logic/human list their REAL named handles (TRUE/FALSE,
// CASE 1…, per-option) — pull from the same definitions the nodes use,
// never hand-copied" (PLAN.md). The real source is C's seam: LogicNode.jsx
// renders `if`'s True/False and `try`'s Try/Catch as literal inline
// `HandleLabelRows` arrays, and switch/HumanNode's choice mode both build
// their handle list from a live `options` array (via OptionsEditor) that
// only exists once a node is actually on the canvas — none of that is
// exported data C's files hand out, and PalettePreview.jsx can't mount the
// real node components (no ReactFlow context outside the canvas, per the
// phase's own note). This table is the one hand-transcription this pass
// allows: nodes/LogicNode.jsx and nodes/HumanNode.jsx are read-only research
// for this phase, not a writable seam, so there is no export to import
// instead. If either file's branch handles ever change, update this table
// to match. `if`/`try` are verbatim (fixed, always exactly these two);
// `switch`/`humanChoice` are illustrative SAMPLE rows (switch/choice start
// with zero options until a user adds them — these numbered placeholders
// exist only to preview the pattern a real instance would grow into).
export const BRANCH_HANDLE_SAMPLES = {
  if: [
    { handleId: 'true', label: 'True' },
    { handleId: 'false', label: 'False' },
  ],
  try: [
    { handleId: 'try', label: 'Try' },
    { handleId: 'catch', label: 'Catch' },
  ],
  switch: [
    { handleId: 'case-0', label: 'Case 1' },
    { handleId: 'case-1', label: 'Case 2' },
  ],
  humanChoice: [
    { handleId: 'opt-1', label: 'Option 1' },
    { handleId: 'opt-2', label: 'Option 2' },
  ],
  // WAVE 1 — THE VERB EXPANSION. Unlike switch/humanChoice, this ISN'T a
  // placeholder sample — A/B Split always has exactly these two handles;
  // only the percentages (LogicNode.jsx's own data.percentA, defaulted to
  // 70 by this file's own 'split' palette item makeData()) ever change.
  split: [
    { handleId: 'a', label: 'A · 70%' },
    { handleId: 'b', label: 'B · 30%' },
  ],
  // WAVE 4 — THE VERB EXPANSION. Verbatim, fixed (same footing as if/try
  // above) — Guardrail always has exactly these two named outs.
  guardrail: [
    { handleId: 'pass', label: 'Pass' },
    { handleId: 'flag', label: 'Flag' },
  ],
}
