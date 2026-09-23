// Seam B — App core
//
// Canned graphs. `default` and `audience` are exact-content ports of
// refs/shot-1.jpg and refs/shot-2.jpg (§Samples in PLAN.md) — node positions
// are a left-to-right stagger like the shots, not a pixel-for-pixel
// reproduction; "Tidy up" re-lays out with dagre on demand anyway. `blank` is
// the trigger-only graph used by both the `?flow=blank` boot param and the
// toolbar's Clear action. `empty` (CANVAS TABS PHASE) is the fully bare
// zero-node/zero-edge canvas behind the `?flow=empty` boot param and the
// topnav canvas_2 tab — see state.jsx's `omni:canvas-tab` listener.
//
// Each export is a FACTORY (not a shared object literal) so every caller gets
// its own fresh nodes/edges arrays — safe to load the same sample twice
// (e.g. clicking "Load from instructions" more than once) without any risk of
// two call sites accidentally sharing — and mutating — the same node objects.
//
// DEMO TOUR — DEFAULT_MODEL/DEFAULT_GENERATE_SEED are the same neither-seam
// data/models.js constants src/nodes/GenerateNode.jsx's own default data
// shape uses (data/blocks.js's palette makeData()), reused here so the
// studio/wall generate nodes below stay byte-consistent with a freshly
// palette-dropped one.
import { DEFAULT_MODEL, DEFAULT_GENERATE_SEED } from './models.js'

// LANE PITCH — the one number every hand-authored position below has to
// respect. THE REVEAL made a DELIVERED output card the dominant mass on the
// card (the artifact IS the payoff now), so a lane's vertical pitch has to be
// sized off the card's GROWN height, never its resting one — the same
// discipline data/templates/builder.js's own EST_HEIGHT/RUN_GROWTH notes
// apply to spawned nodes, applied here to hand-placed ones. A delivered card
// is 374.5px of chrome plus its stage frame, and the frame is
// `max(200px, contentWidth * formatAspect)` (nodes.css .cw-stage-frame's
// min-height + OutputNode.jsx's stageAspect), so:
//
//   floored formats  Text/Email/Teams/Doc/Presentation/Video/Spreadsheet/
//                    Audio — aspect is shorter than the 200px floor, so all
//                    of them deliver at 574.5px       -> pitch 660
//   Graphic          4:5 poster or 1:1 social (seed picks), clears the floor
//                    at ~670px                        -> pitch 800
//   Templated Output 300x424 doc shape, the tallest at ~708px
//                                                     -> pitch 840
//
// (All CDP-measured off the built app after a real run — same harness
// builder.js's own measured buckets came from.) Pitches leave ~85px of air,
// matching the gap the studio flow's own fix landed on. A RUN task card runs
// ~850px and a run-grown one in a lane needs the same treatment (see
// makeLaunchFlow's task-fallback and makeBrokenFlow's logic-foreach).

function triggerNode(overrides = {}) {
  return {
    id: 'trigger-1',
    type: 'trigger',
    position: { x: 0, y: 140 },
    data: { mode: 'manual', autoStart: false },
    ...overrides,
  }
}

export function makeBlankFlow() {
  return {
    nodes: [triggerNode()],
    edges: [],
  }
}

// CANVAS TABS PHASE — canvas_2's bare canvas: truly nothing, not even a
// trigger (contrast `blank` above). The palette's ACTIONS/LOGIC/OUTPUTS rows
// never include a trigger, so a user can never reconstruct the `blank`
// state by dropping blocks here — this and `blank` stay reachable by
// different, non-overlapping paths (FlowCanvas.jsx's zero-node instructions
// card vs. the trigger-only ghost hint).
export function makeEmptyFlow() {
  return {
    nodes: [],
    edges: [],
  }
}

function makeDefaultFlow() {
  return {
    nodes: [
      triggerNode(),
      {
        id: 'task-1',
        type: 'task',
        position: { x: 420, y: 60 },
        data: { number: 1, title: 'Draft', instructions: '', agent: null, repeat: 'once' },
      },
      {
        id: 'output-1',
        type: 'output',
        position: { x: 880, y: 140 },
        data: { format: 'Text', description: '' },
      },
    ],
    edges: [
      { id: 'e-trigger-task-1', source: 'trigger-1', sourceHandle: 'out', target: 'task-1', targetHandle: 'in', type: 'omni' },
      { id: 'e-task-1-output-1', source: 'task-1', sourceHandle: 'out', target: 'output-1', targetHandle: 'in', type: 'omni' },
    ],
  }
}

function makeAudienceFlow() {
  return {
    nodes: [
      triggerNode({ position: { x: 0, y: 160 } }),
      {
        id: 'task-1',
        type: 'task',
        position: { x: 340, y: 40 },
        data: {
          number: 1,
          title: 'Task / Action',
          instructions: 'List available audiences',
          agent: 'Omni Audience Agent',
          repeat: 'once',
        },
      },
      {
        id: 'human-2',
        type: 'human',
        position: { x: 760, y: 160 },
        data: { number: 2, ask: 'What audience do you want to target?', responseType: 'free', options: [] },
      },
      {
        id: 'human-3',
        type: 'human',
        position: { x: 1090, y: 160 },
        data: {
          number: 3,
          ask: 'What output format are you looking for?',
          responseType: 'choice',
          options: [
            { id: 'powerpoint', label: 'PowerPoint' },
            { id: 'worddoc', label: 'Word Doc' },
          ],
        },
      },
      {
        id: 'output-ppt',
        type: 'output',
        position: { x: 1440, y: 20 },
        data: { format: 'Presentation', description: '6 slides.' },
      },
      {
        id: 'output-doc',
        type: 'output',
        // 680, not 300: this lane's pitch was under even the IDLE card height
        // (291px) — the two cards overlapped by 11px at rest, and by 295px
        // once THE REVEAL made a delivered one ~575px tall. 660 is the pitch
        // a delivered floor-height output needs (575 + the same ~85 gap the
        // studio flow's own note cites), off output-ppt's y of 20.
        position: { x: 1440, y: 680 },
        data: { format: 'Doc', description: '2 pages maximum' },
      },
    ],
    edges: [
      { id: 'e-trigger-task-1', source: 'trigger-1', sourceHandle: 'out', target: 'task-1', targetHandle: 'in', type: 'omni' },
      { id: 'e-task-1-human-2', source: 'task-1', sourceHandle: 'out', target: 'human-2', targetHandle: 'in', type: 'omni' },
      { id: 'e-human-2-human-3', source: 'human-2', sourceHandle: 'out', target: 'human-3', targetHandle: 'in', type: 'omni' },
      { id: 'e-human-3-ppt', source: 'human-3', sourceHandle: 'opt-powerpoint', target: 'output-ppt', targetHandle: 'in', type: 'omni' },
      { id: 'e-human-3-doc', source: 'human-3', sourceHandle: 'opt-worddoc', target: 'output-doc', targetHandle: 'in', type: 'omni' },
    ],
  }
}

// DEMO WORKFLOWS (2026-08-11, Bryan) — three teaching flows exercising every
// node type/branch shape, loadable from the header title dropdown's DEMOS
// section (App.jsx's loadSample) and `?flow=social|brief|launch` deep-links
// (state.jsx's FLOW_PARAMS). Node content below is FINAL COPY per PLAN.md
// "## DEMO WORKFLOWS" — verbatim, not paraphrased; it doubles as the
// generation seed for demo/real runs. Positions are hand-authored (not
// dagre) with generous rank/lane spacing so nothing overlaps at 100% zoom —
// "Tidy up" re-lays out on demand like every other sample.

function makeSocialFlow() {
  return {
    nodes: [
      triggerNode({ position: { x: 0, y: 160 }, data: { mode: 'scheduled', autoStart: true } }),
      {
        id: 'task-post',
        type: 'task',
        position: { x: 420, y: 40 },
        data: {
          number: 1,
          title: "Write today's post",
          instructions:
            'Write one social post for today from the brand calendar. Keep it under 40 words, match the brand voice, end with one clear CTA.',
          agent: 'Omni Creative Agent',
          repeat: 'once',
          attachments: [{ id: 'a1', name: 'Brand Guidelines', kind: 'Knowledge base' }],
        },
      },
      {
        id: 'output-post',
        type: 'output',
        position: { x: 900, y: 160 },
        data: { format: 'Teams', description: 'Post the finished copy to the #social-drafts channel for same-day review.' },
      },
    ],
    edges: [
      { id: 'e-trigger-task-post', source: 'trigger-1', sourceHandle: 'out', target: 'task-post', targetHandle: 'in', type: 'omni' },
      { id: 'e-task-post-output-post', source: 'task-post', sourceHandle: 'out', target: 'output-post', targetHandle: 'in', type: 'omni' },
    ],
  }
}

// MEDIUM: human choice-gate + parallel delivery. `human-gate`'s two option
// handles (opt-approve/opt-changes) and `task-revise`'s plain `out` handle
// both feed output-doc AND task-summary — the run engine's `visited` set
// (src/run/engine.js) already guarantees either path only executes each
// downstream node once, exactly matching "either path delivers".
function makeBriefFlow() {
  return {
    nodes: [
      triggerNode({ position: { x: 0, y: 320 } }),
      {
        id: 'task-brief',
        type: 'task',
        position: { x: 440, y: 320 },
        data: {
          number: 1,
          title: 'Draft campaign brief',
          instructions:
            'Draft a campaign brief for the Q4 lease push: objective, insight, single-minded proposition, three support points, and media considerations.',
          agent: 'Omni Research Agent',
          repeat: 'once',
          attachments: [
            { id: 'a1', name: 'Market Insights', kind: 'Knowledge base' },
            { id: 'a2', name: 'web_search', kind: 'Tool' },
          ],
        },
      },
      {
        id: 'human-gate',
        type: 'human',
        position: { x: 880, y: 320 },
        data: {
          number: 2,
          ask: 'Does the draft brief hold up?',
          responseType: 'choice',
          options: [
            { id: 'approve', label: 'Approve' },
            { id: 'changes', label: 'Request changes' },
          ],
        },
      },
      {
        id: 'task-revise',
        type: 'task',
        position: { x: 1320, y: 0 },
        data: {
          number: 3,
          title: 'Revise per feedback',
          instructions: 'Apply the requested changes to the brief. Tighten the proposition, keep everything else stable.',
          agent: 'Omni Research Agent',
          repeat: 'once',
        },
      },
      {
        id: 'output-doc',
        type: 'output',
        position: { x: 1760, y: 320 },
        data: { format: 'Doc', description: 'The approved brief as a clean 2-page document.' },
      },
      {
        id: 'task-summary',
        type: 'task',
        // 980, not 900 (and output-email moves with it, same rank): a
        // delivered output-doc above ends at 894.5, which left this card 5px
        // of air. Same 660 pitch the studio flow's own note derives.
        position: { x: 1760, y: 980 },
        data: {
          number: 4,
          title: 'Summarize for leadership',
          instructions:
            'Compress the approved brief into three bullets a CMO can read in ten seconds: the bet, the audience, the spend logic.',
          agent: 'Omni Media Agent',
          repeat: 'once',
        },
      },
      {
        id: 'output-email',
        type: 'output',
        // Moves with task-summary above — this pair is one rank, kept level.
        position: { x: 2200, y: 980 },
        data: { format: 'Email', description: 'Subject + three-bullet summary addressed to the leadership list.' },
      },
    ],
    edges: [
      { id: 'e-trigger-task-brief', source: 'trigger-1', sourceHandle: 'out', target: 'task-brief', targetHandle: 'in', type: 'omni' },
      { id: 'e-task-brief-human-gate', source: 'task-brief', sourceHandle: 'out', target: 'human-gate', targetHandle: 'in', type: 'omni' },
      { id: 'e-human-gate-task-revise', source: 'human-gate', sourceHandle: 'opt-changes', target: 'task-revise', targetHandle: 'in', type: 'omni' },
      { id: 'e-human-gate-output-doc', source: 'human-gate', sourceHandle: 'opt-approve', target: 'output-doc', targetHandle: 'in', type: 'omni' },
      { id: 'e-human-gate-task-summary', source: 'human-gate', sourceHandle: 'opt-approve', target: 'task-summary', targetHandle: 'in', type: 'omni' },
      { id: 'e-task-revise-output-doc', source: 'task-revise', sourceHandle: 'out', target: 'output-doc', targetHandle: 'in', type: 'omni' },
      { id: 'e-task-revise-task-summary', source: 'task-revise', sourceHandle: 'out', target: 'task-summary', targetHandle: 'in', type: 'omni' },
      { id: 'e-task-summary-output-email', source: 'task-summary', sourceHandle: 'out', target: 'output-email', targetHandle: 'in', type: 'omni' },
    ],
  }
}

// COMPLEX: the full instrument — foreach -> if/else -> try/catch, plus a
// side-branch (output-matrix, straight off the foreach's task lane) and a
// terminal stop. Three vertically-separated lanes fan out from the trunk
// (trigger -> ... -> logic-if): TRUE runs high (task-ads/logic-try/
// output-graphic/stop, with task-fallback peeling off logic-try's catch just
// below it), FALSE runs low (wait/human/output-playbook).
function makeLaunchFlow() {
  return {
    nodes: [
      triggerNode({ position: { x: 0, y: 900 }, data: { mode: 'scheduled', autoStart: false } }),
      {
        id: 'task-positioning',
        type: 'task',
        position: { x: 420, y: 880 },
        data: {
          number: 1,
          title: 'Pull launch positioning',
          instructions:
            'Assemble the launch positioning for the new EV trim: price point, hero features, target launch markets, and the one-line promise.',
          agent: 'Omni Media Agent',
          repeat: 'once',
          attachments: [{ id: 'a1', name: 'plan_mcp', kind: 'Tool' }],
        },
      },
      {
        id: 'logic-foreach',
        type: 'logic',
        position: { x: 840, y: 900 },
        data: { kind: 'foreach' },
      },
      {
        id: 'task-tailor',
        type: 'task',
        position: { x: 1260, y: 880 },
        data: {
          number: 2,
          title: 'Tailor the angle per segment',
          instructions:
            'For the current audience segment, adapt the launch promise into a segment-specific angle with one proof point and one objection to pre-empt.',
          agent: 'Omni Audience Agent',
          repeat: 'once',
          attachments: [],
        },
      },
      {
        id: 'logic-if',
        type: 'logic',
        position: { x: 1680, y: 900 },
        data: { kind: 'if' },
      },
      {
        id: 'output-matrix',
        type: 'output',
        position: { x: 1680, y: 1550 },
        data: { format: 'Spreadsheet', description: 'Master matrix: one row per segment — angle, readiness, ad status, owner.' },
      },
      {
        id: 'task-ads',
        type: 'task',
        position: { x: 2100, y: 150 },
        data: {
          number: 3,
          title: 'Draft performance ads',
          instructions: 'Write three ad variants for this segment: one rational, one emotional, one social-proof. 25 words max each.',
          agent: 'Omni Creative Agent',
          repeat: 'once',
        },
      },
      {
        id: 'wait-nurture',
        type: 'wait',
        // The nurture rank drops 250 with the catch rank above it: a RUN
        // task-fallback measures ~850px, so it needs the room. Whole rank
        // moves together so the three cards stay level.
        position: { x: 2100, y: 1900 },
        data: { amount: '48', unit: 'hours' },
      },
      {
        id: 'logic-try',
        type: 'logic',
        position: { x: 2520, y: 150 },
        data: { kind: 'try' },
      },
      {
        id: 'human-nurture',
        type: 'human',
        // Moves with the nurture rank — see wait-nurture's note.
        position: { x: 2520, y: 1900 },
        data: {
          number: 4,
          ask: 'Add nurture notes for this segment before the playbook is compiled',
          responseType: 'free',
          options: [],
        },
      },
      {
        id: 'output-graphic',
        type: 'output',
        position: { x: 2940, y: 150 },
        data: { format: 'Graphic', description: 'Hero image concept board for the winning variant.' },
      },
      {
        id: 'task-fallback',
        type: 'task',
        // 950, not 650 (output-stockart, its own rank partner, moves with
        // it): output-graphic above is a GRAPHIC — the one format whose stage
        // frame clears THE REVEAL's 200px floor (4:5 poster aspect), so it
        // delivers ~670px tall, not the ~575px every floored format lands on.
        // 800 is that format's pitch here, the way 660 is the floored one's.
        position: { x: 2940, y: 950 },
        data: {
          number: 5,
          title: 'Fallback stock-art brief',
          instructions:
            'Image generation failed — write a precise stock-photography search brief instead: subject, mood, palette, three reference searches.',
          agent: 'Omni Creative Agent',
          repeat: 'once',
        },
      },
      {
        id: 'output-playbook',
        type: 'output',
        // Moves with the nurture rank — see wait-nurture's note.
        position: { x: 2940, y: 1900 },
        data: {
          format: 'Presentation',
          description: 'Segment playbook: 6 slides — angle, proof, ads, media plan, nurture notes, next steps.',
        },
      },
      {
        id: 'stop-1',
        type: 'stop',
        position: { x: 3360, y: 150 },
        data: {},
      },
      {
        id: 'output-stockart',
        type: 'output',
        // Moves with task-fallback above — one rank, kept level.
        position: { x: 3360, y: 950 },
        data: { format: 'Doc', description: 'One-page stock-art sourcing brief.' },
      },
    ],
    edges: [
      { id: 'e-trigger-task-positioning', source: 'trigger-1', sourceHandle: 'out', target: 'task-positioning', targetHandle: 'in', type: 'omni' },
      { id: 'e-task-positioning-logic-foreach', source: 'task-positioning', sourceHandle: 'out', target: 'logic-foreach', targetHandle: 'in', type: 'omni' },
      { id: 'e-logic-foreach-task-tailor', source: 'logic-foreach', sourceHandle: 'out', target: 'task-tailor', targetHandle: 'in', type: 'omni' },
      { id: 'e-task-tailor-logic-if', source: 'task-tailor', sourceHandle: 'out', target: 'logic-if', targetHandle: 'in', type: 'omni' },
      { id: 'e-task-tailor-output-matrix', source: 'task-tailor', sourceHandle: 'out', target: 'output-matrix', targetHandle: 'in', type: 'omni' },
      { id: 'e-logic-if-task-ads', source: 'logic-if', sourceHandle: 'true', target: 'task-ads', targetHandle: 'in', type: 'omni' },
      { id: 'e-logic-if-wait-nurture', source: 'logic-if', sourceHandle: 'false', target: 'wait-nurture', targetHandle: 'in', type: 'omni' },
      { id: 'e-task-ads-logic-try', source: 'task-ads', sourceHandle: 'out', target: 'logic-try', targetHandle: 'in', type: 'omni' },
      { id: 'e-logic-try-output-graphic', source: 'logic-try', sourceHandle: 'try', target: 'output-graphic', targetHandle: 'in', type: 'omni' },
      { id: 'e-logic-try-task-fallback', source: 'logic-try', sourceHandle: 'catch', target: 'task-fallback', targetHandle: 'in', type: 'omni' },
      { id: 'e-output-graphic-stop', source: 'output-graphic', sourceHandle: 'out', target: 'stop-1', targetHandle: 'in', type: 'omni' },
      { id: 'e-task-fallback-output-stockart', source: 'task-fallback', sourceHandle: 'out', target: 'output-stockart', targetHandle: 'in', type: 'omni' },
      { id: 'e-wait-nurture-human-nurture', source: 'wait-nurture', sourceHandle: 'out', target: 'human-nurture', targetHandle: 'in', type: 'omni' },
      { id: 'e-human-nurture-output-playbook', source: 'human-nurture', sourceHandle: 'out', target: 'output-playbook', targetHandle: 'in', type: 'omni' },
    ],
  }
}

// DEMO 4 — "Global campaign command" (2026-08-12, Bryan). The stress test:
// every logic type (switch nested inside if/else), four parallel phase
// lanes, three human gates, two waits, a schedule + a times repeat, and
// terminal stops on every dead-end branch. Node content is copied verbatim
// from PLAN.md "## DEMO 4" — where the spec gives a task only an agent (no
// quoted instructions sentence), `instructions` is left `''` rather than
// invented, matching makeDefaultFlow's task-1 convention; where a Human
// node is named with a short label instead of a `{ask:'...'}` question
// (unlike audience/brief/launch's human nodes), that label is copied
// verbatim into `ask` since Human has no separate title field to hold it.
//
// Layout: one shared trunk (trigger -> task-market -> the Campaign-phase
// switch) feeds four lanes on case-0..case-3 (Launch/Sustain/Rescue/
// Wind-down, in that option order). Each lane gets its own vertical BAND
// spaced 4000-5000px from its neighbors' trunks (Lane A trunk y=0, B=4000,
// C=8000, D=13000) — since no two lanes' y-ranges ever overlap at all, two
// nodes in different lanes can never collide regardless of which x-column
// they land in, which turns "40 nodes, no overlaps" into a much smaller
// per-lane problem (verified for real via getBoundingClientRect(), per
// PLAN.md's "not estimates" instruction — see the batch's verification
// notes). Within a lane, x advances ~460px per BFS level (comfortably over
// every node width, max 340px for a task card) and siblings that fan out at
// the same level sit >=500px apart in y. No cycles: every edge only ever
// points to a later (or equal, for same-rank fan-outs) x-level than its
// source, and every leaf is an Output or a Stop.
function makeGlobalFlow() {
  return {
    nodes: [
      triggerNode({ id: 'trigger-1', position: { x: 0, y: 6300 }, data: { mode: 'scheduled', autoStart: true } }),
      {
        id: 'task-market',
        type: 'task',
        position: { x: 460, y: 6300 },
        data: {
          number: 1,
          title: 'Read the market',
          instructions:
            "Pull last week's performance across every live market and channel. Flag anomalies against plan, and name the single biggest mover.",
          agent: 'Omni Media Agent',
          repeat: 'schedule',
          attachments: [
            { id: 'a1', name: 'plan_mcp', kind: 'Tool' },
            { id: 'a2', name: 'web_search', kind: 'Tool' },
          ],
        },
      },
      {
        id: 'logic-phase',
        type: 'logic',
        position: { x: 920, y: 6300 },
        data: {
          kind: 'switch',
          options: [
            { id: 'launch', label: 'Launch' },
            { id: 'sustain', label: 'Sustain' },
            { id: 'rescue', label: 'Rescue' },
            { id: 'winddown', label: 'Wind-down' },
          ],
        },
      },

      // ---- Lane A — LAUNCH (case-0), trunk y=0 ---------------------------
      {
        id: 'task-narrative',
        type: 'task',
        position: { x: 1380, y: 0 },
        data: {
          number: 2,
          title: 'Build launch narrative',
          instructions:
            'Write the launch narrative: the promise, the three proof points, and the line that has to survive translation.',
          agent: 'Omni Creative Agent',
          repeat: 'once',
          attachments: [{ id: 'a1', name: 'Brand Guidelines', kind: 'Knowledge base' }],
        },
      },
      { id: 'logic-heroassets', type: 'logic', position: { x: 1840, y: 0 }, data: { kind: 'try' } },
      {
        id: 'task-visuals',
        type: 'task',
        position: { x: 2300, y: -850 },
        data: { number: 6, title: 'Generate hero visuals', instructions:
            'Generate the hero key visual in every required ratio, holding the launch narrative’s promise in frame.', agent: 'Omni Creative Agent', repeat: 'once' },
      },
      {
        id: 'task-alternatives',
        type: 'task',
        position: { x: 2300, y: 950 },
        data: { number: 7, title: 'Source licensed alternatives', instructions:
            'Generation failed — find licensed stock that carries the same promise, and note the licence terms for each frame.', agent: 'Omni Research Agent', repeat: 'once' },
      },
      {
        id: 'output-herographic',
        type: 'output',
        position: { x: 2760, y: -1100 },
        data: { format: 'Graphic', description: 'Hero key visual set — 6 ratios, master plus social crops.' },
      },
      {
        id: 'human-legalsignoff',
        type: 'human',
        position: { x: 2760, y: -300 },
        data: {
          number: 10,
          ask: 'Does this clear legal and brand?',
          responseType: 'choice',
          options: [
            { id: 'approved', label: 'Approved' },
            { id: 'needschanges', label: 'Needs changes' },
            { id: 'blocked', label: 'Blocked' },
          ],
        },
      },
      {
        id: 'output-stocksourcing',
        type: 'output',
        position: { x: 2760, y: 950 },
        data: { format: 'Doc', description: 'Stock sourcing brief — 12 candidate frames with licence terms.' },
      },
      { id: 'wait-embargo', type: 'wait', position: { x: 3220, y: -650 }, data: { amount: '24', unit: 'hours' } },
      {
        id: 'task-reworkclaims',
        type: 'task',
        position: { x: 3220, y: 150 },
        data: {
          number: 14,
          title: 'Rework the claims',
          instructions: 'Revise every claim flagged by legal, keeping the promise intact.',
          agent: 'Omni Creative Agent',
          repeat: 'once',
        },
      },
      { id: 'stop-legal', type: 'stop', position: { x: 3220, y: 1000 }, data: {} },
      {
        id: 'output-launchdeck',
        type: 'output',
        position: { x: 3680, y: -1000 },
        data: { format: 'Presentation', description: '18-slide launch deck for market leads.' },
      },
      {
        id: 'output-launchbrief',
        type: 'output',
        // -340/320 (was -350/150): this lane stacks three delivered outputs,
        // and 500 was under the ~575px a delivered floored-format card runs
        // to — launchbrief drew 75px into reworkeddoc. Both now sit on the
        // same 660 pitch off output-launchdeck's -1000.
        position: { x: 3680, y: -340 },
        data: { format: 'Email', description: 'Launch-day brief to every market lead.' },
      },
      {
        id: 'output-reworkeddoc',
        type: 'output',
        // See output-launchbrief above — same 660 pitch.
        position: { x: 3680, y: 320 },
        data: { format: 'Doc', description: 'Revised claims, redlined against the original.' },
      },

      // ---- Lane B — SUSTAIN (case-1), trunk y=4000 -----------------------
      { id: 'logic-livemarkets', type: 'logic', position: { x: 1380, y: 4000 }, data: { kind: 'foreach' } },
      {
        id: 'task-localize',
        type: 'task',
        position: { x: 1840, y: 4000 },
        data: {
          number: 4,
          title: 'Localize weekly cutdowns',
          instructions: 'For each live market, cut the hero film to local length and swap in local proof points.',
          agent: 'Omni Media Agent',
          repeat: 'times',
          attachments: [{ id: 'a1', name: 'plan_mcp', kind: 'Tool' }],
        },
      },
      { id: 'logic-engagement', type: 'logic', position: { x: 2300, y: 4000 }, data: { kind: 'if' } },
      {
        id: 'task-scalewinners',
        type: 'task',
        position: { x: 2760, y: 3500 },
        data: { number: 11, title: 'Scale the winners', instructions:
            'Take the variants beating plan and rebuild the budget split around them, market by market.', agent: 'Omni Media Agent', repeat: 'once' },
      },
      {
        id: 'task-diagnosedropoff',
        type: 'task',
        position: { x: 2760, y: 4500 },
        data: {
          number: 12,
          title: 'Diagnose the drop-off',
          instructions:
            'Find where engagement fell away — which market, which channel, which day — and say whether spend or creative is to blame.',
          agent: 'Omni Research Agent',
          repeat: 'once',
          attachments: [{ id: 'a1', name: 'Market Insights', kind: 'Knowledge base' }],
        },
      },
      {
        id: 'output-budgetmatrix',
        type: 'output',
        position: { x: 3220, y: 3500 },
        data: { format: 'Spreadsheet', description: 'Budget shift matrix — market, channel, delta, expected lift.' },
      },
      {
        id: 'human-budgetapproval',
        type: 'human',
        position: { x: 3220, y: 4500 },
        data: {
          number: 15,
          ask: 'Shift budget away from the underperformers?',
          responseType: 'choice',
          options: [
            { id: 'shift', label: 'Shift budget' },
            { id: 'hold', label: 'Hold' },
          ],
        },
      },
      {
        id: 'output-changenote',
        type: 'output',
        position: { x: 3680, y: 4250 },
        data: { format: 'Teams', description: 'Change note to the pod: what moved, and why.' },
      },
      { id: 'stop-budget', type: 'stop', position: { x: 3680, y: 4950 }, data: {} },

      // ---- Lane C — RESCUE (case-2), trunk y=8000 ------------------------
      {
        id: 'task-diagnoseunderperf',
        type: 'task',
        position: { x: 1380, y: 8000 },
        data: {
          number: 3,
          title: 'Diagnose underperformance',
          instructions:
            'Find why the campaign is missing plan. Separate creative problems from delivery problems before recommending anything.',
          agent: 'Omni Research Agent',
          repeat: 'once',
          attachments: [
            { id: 'a1', name: 'web_search', kind: 'Tool' },
            { id: 'a2', name: 'Market Insights', kind: 'Knowledge base' },
          ],
        },
      },
      { id: 'logic-creativefatigue', type: 'logic', position: { x: 1840, y: 8000 }, data: { kind: 'if' } },
      {
        id: 'task-refreshcreative',
        type: 'task',
        position: { x: 2300, y: 7700 },
        data: { number: 8, title: 'Refresh the creative', instructions:
            'Cut fresh executions from existing footage — new opening frames, new hooks, same claims.', agent: 'Omni Creative Agent', repeat: 'once' },
      },
      {
        id: 'logic-deliveryrootcause',
        type: 'logic',
        position: { x: 2300, y: 8500 },
        data: {
          kind: 'switch',
          options: [
            { id: 'targeting', label: 'Targeting' },
            { id: 'bidding', label: 'Bidding' },
            { id: 'landingpage', label: 'Landing page' },
          ],
        },
      },
      {
        id: 'output-refreshvideo',
        type: 'output',
        position: { x: 2760, y: 7700 },
        data: { format: 'Video', description: 'Three 15s refresh cuts from existing footage.' },
      },
      {
        id: 'output-audienceremap',
        type: 'output',
        // 8360, not 8200 — 660 off output-refreshvideo's 7700 (Video floors
        // at the 200px stage minimum like every other non-Graphic format).
        position: { x: 2760, y: 8360 },
        data: { format: 'Templated Output', description: 'Audience remap spec.' },
      },
      {
        id: 'output-bidcorrections',
        type: 'output',
        // 9200, not 8800: the card above is a TEMPLATED OUTPUT — the tallest
        // format on the board (300x424 doc shape, well past THE REVEAL's
        // 200px floor), delivering ~708px. 840 is that format's pitch, the
        // way 800 is Graphic's and 660 every floored format's.
        position: { x: 2760, y: 9200 },
        data: { format: 'Spreadsheet', description: 'Bid and pacing corrections by market.' },
      },
      {
        id: 'output-landingfixlist',
        type: 'output',
        // 9860 — 660 off output-bidcorrections' 9200 (Spreadsheet floors).
        position: { x: 2760, y: 9860 },
        data: { format: 'Doc', description: 'Landing-page fix list, ranked by expected lift.' },
      },

      // ---- Lane D — WIND-DOWN (case-3), trunk y=13000 --------------------
      { id: 'wait-finalwindow', type: 'wait', position: { x: 1380, y: 13000 }, data: { amount: '72', unit: 'hours' } },
      {
        id: 'task-postmortem',
        type: 'task',
        position: { x: 1840, y: 13000 },
        data: {
          number: 5,
          title: 'Compile the post-mortem',
          instructions:
            "Pull the full-flight numbers and write what actually drove the result — including what we'd stop doing.",
          agent: 'Omni Research Agent',
          repeat: 'once',
          attachments: [{ id: 'a1', name: 'Market Insights', kind: 'Knowledge base' }],
        },
      },
      {
        id: 'human-confirmarchive',
        type: 'human',
        position: { x: 2300, y: 13000 },
        data: {
          number: 9,
          ask: 'Archive the campaign, or extend the flight?',
          responseType: 'choice',
          options: [
            { id: 'archive', label: 'Archive' },
            { id: 'extend', label: 'Extend' },
          ],
        },
      },
      {
        id: 'output-postmortemreadout',
        type: 'output',
        position: { x: 2760, y: 12600 },
        data: { format: 'Presentation', description: 'Post-mortem readout for the client.' },
      },
      {
        id: 'output-learningslibrary',
        type: 'output',
        position: { x: 2760, y: 13300 },
        data: { format: 'Doc', description: 'Learnings library entry, tagged by market and channel.' },
      },
      {
        id: 'task-extensionplan',
        type: 'task',
        position: { x: 2760, y: 14000 },
        data: {
          number: 13,
          title: 'Draft the extension plan',
          instructions:
            'Draft the extension: added flight dates, the budget it needs, and the lift it should return.',
          agent: 'Omni Media Agent',
          repeat: 'once',
          attachments: [{ id: 'a1', name: 'plan_mcp', kind: 'Tool' }],
        },
      },
      {
        id: 'output-extensionproposal',
        type: 'output',
        position: { x: 3220, y: 14000 },
        data: { format: 'Email', description: 'Extension proposal — budget, flight dates, expected lift.' },
      },
    ],
    edges: [
      // Spine
      { id: 'e-trigger-task-market', source: 'trigger-1', sourceHandle: 'out', target: 'task-market', targetHandle: 'in', type: 'omni' },
      { id: 'e-task-market-logic-phase', source: 'task-market', sourceHandle: 'out', target: 'logic-phase', targetHandle: 'in', type: 'omni' },
      { id: 'e-logic-phase-task-narrative', source: 'logic-phase', sourceHandle: 'case-0', target: 'task-narrative', targetHandle: 'in', type: 'omni' },
      { id: 'e-logic-phase-logic-livemarkets', source: 'logic-phase', sourceHandle: 'case-1', target: 'logic-livemarkets', targetHandle: 'in', type: 'omni' },
      { id: 'e-logic-phase-task-diagnoseunderperf', source: 'logic-phase', sourceHandle: 'case-2', target: 'task-diagnoseunderperf', targetHandle: 'in', type: 'omni' },
      { id: 'e-logic-phase-wait-finalwindow', source: 'logic-phase', sourceHandle: 'case-3', target: 'wait-finalwindow', targetHandle: 'in', type: 'omni' },

      // Lane A — LAUNCH
      { id: 'e-task-narrative-logic-heroassets', source: 'task-narrative', sourceHandle: 'out', target: 'logic-heroassets', targetHandle: 'in', type: 'omni' },
      { id: 'e-logic-heroassets-task-visuals', source: 'logic-heroassets', sourceHandle: 'try', target: 'task-visuals', targetHandle: 'in', type: 'omni' },
      { id: 'e-logic-heroassets-task-alternatives', source: 'logic-heroassets', sourceHandle: 'catch', target: 'task-alternatives', targetHandle: 'in', type: 'omni' },
      { id: 'e-task-visuals-output-herographic', source: 'task-visuals', sourceHandle: 'out', target: 'output-herographic', targetHandle: 'in', type: 'omni' },
      { id: 'e-task-visuals-human-legalsignoff', source: 'task-visuals', sourceHandle: 'out', target: 'human-legalsignoff', targetHandle: 'in', type: 'omni' },
      { id: 'e-task-alternatives-output-stocksourcing', source: 'task-alternatives', sourceHandle: 'out', target: 'output-stocksourcing', targetHandle: 'in', type: 'omni' },
      { id: 'e-human-legalsignoff-wait-embargo', source: 'human-legalsignoff', sourceHandle: 'opt-approved', target: 'wait-embargo', targetHandle: 'in', type: 'omni' },
      { id: 'e-human-legalsignoff-task-reworkclaims', source: 'human-legalsignoff', sourceHandle: 'opt-needschanges', target: 'task-reworkclaims', targetHandle: 'in', type: 'omni' },
      { id: 'e-human-legalsignoff-stop-legal', source: 'human-legalsignoff', sourceHandle: 'opt-blocked', target: 'stop-legal', targetHandle: 'in', type: 'omni' },
      { id: 'e-wait-embargo-output-launchdeck', source: 'wait-embargo', sourceHandle: 'out', target: 'output-launchdeck', targetHandle: 'in', type: 'omni' },
      { id: 'e-wait-embargo-output-launchbrief', source: 'wait-embargo', sourceHandle: 'out', target: 'output-launchbrief', targetHandle: 'in', type: 'omni' },
      { id: 'e-task-reworkclaims-output-reworkeddoc', source: 'task-reworkclaims', sourceHandle: 'out', target: 'output-reworkeddoc', targetHandle: 'in', type: 'omni' },

      // Lane B — SUSTAIN
      { id: 'e-logic-livemarkets-task-localize', source: 'logic-livemarkets', sourceHandle: 'out', target: 'task-localize', targetHandle: 'in', type: 'omni' },
      { id: 'e-task-localize-logic-engagement', source: 'task-localize', sourceHandle: 'out', target: 'logic-engagement', targetHandle: 'in', type: 'omni' },
      { id: 'e-logic-engagement-task-scalewinners', source: 'logic-engagement', sourceHandle: 'true', target: 'task-scalewinners', targetHandle: 'in', type: 'omni' },
      { id: 'e-logic-engagement-task-diagnosedropoff', source: 'logic-engagement', sourceHandle: 'false', target: 'task-diagnosedropoff', targetHandle: 'in', type: 'omni' },
      { id: 'e-task-scalewinners-output-budgetmatrix', source: 'task-scalewinners', sourceHandle: 'out', target: 'output-budgetmatrix', targetHandle: 'in', type: 'omni' },
      { id: 'e-task-diagnosedropoff-human-budgetapproval', source: 'task-diagnosedropoff', sourceHandle: 'out', target: 'human-budgetapproval', targetHandle: 'in', type: 'omni' },
      { id: 'e-human-budgetapproval-output-changenote', source: 'human-budgetapproval', sourceHandle: 'opt-shift', target: 'output-changenote', targetHandle: 'in', type: 'omni' },
      { id: 'e-human-budgetapproval-stop-budget', source: 'human-budgetapproval', sourceHandle: 'opt-hold', target: 'stop-budget', targetHandle: 'in', type: 'omni' },

      // Lane C — RESCUE
      { id: 'e-task-diagnoseunderperf-logic-creativefatigue', source: 'task-diagnoseunderperf', sourceHandle: 'out', target: 'logic-creativefatigue', targetHandle: 'in', type: 'omni' },
      { id: 'e-logic-creativefatigue-task-refreshcreative', source: 'logic-creativefatigue', sourceHandle: 'true', target: 'task-refreshcreative', targetHandle: 'in', type: 'omni' },
      { id: 'e-task-refreshcreative-output-refreshvideo', source: 'task-refreshcreative', sourceHandle: 'out', target: 'output-refreshvideo', targetHandle: 'in', type: 'omni' },
      { id: 'e-logic-creativefatigue-logic-deliveryrootcause', source: 'logic-creativefatigue', sourceHandle: 'false', target: 'logic-deliveryrootcause', targetHandle: 'in', type: 'omni' },
      { id: 'e-logic-deliveryrootcause-output-audienceremap', source: 'logic-deliveryrootcause', sourceHandle: 'case-0', target: 'output-audienceremap', targetHandle: 'in', type: 'omni' },
      { id: 'e-logic-deliveryrootcause-output-bidcorrections', source: 'logic-deliveryrootcause', sourceHandle: 'case-1', target: 'output-bidcorrections', targetHandle: 'in', type: 'omni' },
      { id: 'e-logic-deliveryrootcause-output-landingfixlist', source: 'logic-deliveryrootcause', sourceHandle: 'case-2', target: 'output-landingfixlist', targetHandle: 'in', type: 'omni' },

      // Lane D — WIND-DOWN
      { id: 'e-wait-finalwindow-task-postmortem', source: 'wait-finalwindow', sourceHandle: 'out', target: 'task-postmortem', targetHandle: 'in', type: 'omni' },
      { id: 'e-task-postmortem-human-confirmarchive', source: 'task-postmortem', sourceHandle: 'out', target: 'human-confirmarchive', targetHandle: 'in', type: 'omni' },
      { id: 'e-human-confirmarchive-output-postmortemreadout', source: 'human-confirmarchive', sourceHandle: 'opt-archive', target: 'output-postmortemreadout', targetHandle: 'in', type: 'omni' },
      { id: 'e-human-confirmarchive-output-learningslibrary', source: 'human-confirmarchive', sourceHandle: 'opt-archive', target: 'output-learningslibrary', targetHandle: 'in', type: 'omni' },
      { id: 'e-human-confirmarchive-task-extensionplan', source: 'human-confirmarchive', sourceHandle: 'opt-extend', target: 'task-extensionplan', targetHandle: 'in', type: 'omni' },
      { id: 'e-task-extensionplan-output-extensionproposal', source: 'task-extensionplan', sourceHandle: 'out', target: 'output-extensionproposal', targetHandle: 'in', type: 'omni' },
    ],
  }
}

// DEMO TOUR (PLAN.md "## DEMO TOUR — staged states that tell the story", plus
// the "## BATCH ORDER (revised...)" amendment folding in the newer features:
// "a note card + a tinted card group + one collapsed card in the relevant
// states, a params node feeding two tasks in ?flow=studio, and the studio
// flow's research task carries 3 INTERNAL STEPS so the subgraph chip shows").
// Hidden `?flow=` deep links only — no visible switcher (feedback_no_visible_
// demo_switchers). Every node below is wired clean with every required field
// filled (agent/description/prompt) so `studio`/`wall`/`meeting` land at ZERO
// issues on boot — `broken` is the one deliberate exception, see its own
// comment. state.jsx seeds a one-time fitView for these four params (search
// "DEMO TOUR" there) since they're wider than the frozen zoom-1/x60,y40 boot
// viewport was ever sized for.

// ---------------------------------------------------------------------------
// ?flow=studio — "the one-click cinematic run": Trigger -> Research (3
// internal steps, so the "n steps ↗" subgraph chip shows) -> Draft -> Generate
// (variants:6, prompt filled) -> Human sign-off (Approve / Needs changes) ->
// Approve fans to two Outputs, Needs changes loops through a Revise task to a
// third. A Params node feeds BOTH tasks (PARAM NODE's documented fan-out).
// The two Approve-branch outputs share one organizational tint ("a tinted
// card group"); the Revise task boots pre-collapsed ("one collapsed card") —
// it's the road not taken on a clean Approve run, so tucking it away reads as
// intentional rather than unfinished. Positions are hand-authored with very
// generous rank/lane spacing (matching the DEMO WORKFLOWS convention) so
// nothing overlaps at 100% zoom before the boot fitView settles; the live
// variant grid (spawned mid-run by the existing spawnGenerateGrid/slideClear
// machinery, untouched by this file) self-avoids collisions with whatever's
// already on the canvas, so it needs no pre-planned clearance here.
function makeStudioFlow() {
  return {
    nodes: [
      triggerNode({ position: { x: 0, y: 380 } }),
      {
        id: 'params-1',
        type: 'params',
        position: { x: 0, y: 900 },
        data: { markets: ['US', 'UK', 'DE'], budget: 180000, window: { start: 'Sep 1', end: 'Nov 30' } },
      },
      {
        id: 'task-research',
        type: 'task',
        position: { x: 460, y: 300 },
        data: {
          number: 1,
          title: 'Research the fall audience',
          instructions:
            "Profile who's actively shopping the fall lineup this quarter: what's pulling them toward a decision, which channels they trust most right now, and anything that's shifted since last quarter worth acting on.",
          agent: 'Omni Research Agent',
          repeat: 'once',
          // SUBGRAPHS — "a task with steps subdivides its beat evenly across
          // steps in topological order" (run/engine.js); same {nodes,edges}
          // shape seedTaskSteps() mints on first manual "Enter steps" (state.
          // jsx), hand-authored here so the chip + subgraph stage both have
          // real content from boot instead of the generic Gather/Draft/Check
          // placeholder trio. x positions mirror state.jsx's own STEP_PITCH_X
          // (240 card + 110 gap = 350) — kept in sync by hand, same
          // "JS needs to know a card size" precedent as data/templates/
          // builder.js's EST_WIDTH/EST_HEIGHT.
          steps: {
            nodes: [
              { id: 'step-research-1', title: 'Pull category data', position: { x: 0, y: 0 } },
              { id: 'step-research-2', title: 'Synthesize signals', position: { x: 350, y: 0 } },
              { id: 'step-research-3', title: 'Summarize findings', position: { x: 700, y: 0 } },
            ],
            edges: [
              { id: 'stepedge-research-1', source: 'step-research-1', target: 'step-research-2' },
              { id: 'stepedge-research-2', source: 'step-research-2', target: 'step-research-3' },
            ],
          },
        },
      },
      {
        id: 'task-draft',
        type: 'task',
        position: { x: 980, y: 300 },
        data: {
          number: 2,
          title: 'Draft the campaign brief',
          instructions:
            'Turn the audience findings into a one-page brief: objective, single-minded proposition, three support points, and the tone the fall lineup creative should hit.',
          agent: 'Omni Copy Agent',
          repeat: 'once',
        },
      },
      {
        id: 'generate-1',
        type: 'generate',
        position: { x: 1500, y: 260 },
        data: {
          title: 'Key visuals — fall lineup',
          model: DEFAULT_MODEL,
          prompt:
            "Fall lineup hero visuals — warm autumn palette, product-forward composition, confident typography carrying the brief's proposition.",
          imageInputs: [],
          variants: 6,
          runState: 'idle',
          output: null,
          seed: DEFAULT_GENERATE_SEED,
          seedLocked: false,
          groupId: null,
        },
      },
      {
        id: 'human-signoff',
        type: 'human',
        position: { x: 2060, y: 320 },
        data: {
          number: 3,
          ask: 'Are the fall lineup visuals ready to move forward?',
          responseType: 'choice',
          options: [
            { id: 'approve', label: 'Approve' },
            { id: 'changes', label: 'Needs changes' },
          ],
        },
      },
      {
        id: 'output-deck',
        type: 'output',
        position: { x: 2560, y: 0 },
        data: { format: 'Presentation', description: 'Campaign deck, 8 slides.', tint: 'teal' },
      },
      {
        id: 'output-brief-email',
        type: 'output',
        // 660, not 420: THE REVEAL made a DELIVERED output card ~575px tall
        // (the artifact is the card's dominant mass now), so the old pitch
        // overlapped once the run finished — caught by that phase's own QA.
        // Pitched on the grown height + the standard gap, same discipline
        // builder.js's RUN_GROWTH uses for templates.
        position: { x: 2560, y: 660 },
        data: {
          format: 'Email',
          description: 'Subject line and the finished deck link, sent to the media and creative leads for final review.',
          tint: 'teal',
        },
      },
      {
        id: 'task-revise',
        type: 'task',
        position: { x: 2560, y: 1320 },
        data: {
          number: 4,
          title: 'Revise',
          instructions:
            'Apply the feedback from creative sign-off. Keep the proposition intact — tighten whatever specifically drew the "needs changes" call.',
          agent: 'Omni Copy Agent',
          repeat: 'once',
          collapsed: true,
        },
      },
      {
        id: 'output-revised-doc',
        type: 'output',
        position: { x: 3040, y: 900 },
        data: { format: 'Doc', description: 'The revised brief and creative notes, as a clean one-page document.' },
      },
    ],
    edges: [
      { id: 'e-trigger-research', source: 'trigger-1', sourceHandle: 'out', target: 'task-research', targetHandle: 'in', type: 'omni' },
      { id: 'e-params-research', source: 'params-1', sourceHandle: 'out', target: 'task-research', targetHandle: 'in', type: 'omni' },
      { id: 'e-params-draft', source: 'params-1', sourceHandle: 'out', target: 'task-draft', targetHandle: 'in', type: 'omni' },
      { id: 'e-research-draft', source: 'task-research', sourceHandle: 'out', target: 'task-draft', targetHandle: 'in', type: 'omni' },
      { id: 'e-draft-generate', source: 'task-draft', sourceHandle: 'out', target: 'generate-1', targetHandle: 'in', type: 'omni' },
      { id: 'e-generate-human', source: 'generate-1', sourceHandle: 'out', target: 'human-signoff', targetHandle: 'in', type: 'omni' },
      { id: 'e-human-deck', source: 'human-signoff', sourceHandle: 'opt-approve', target: 'output-deck', targetHandle: 'in', type: 'omni' },
      { id: 'e-human-email', source: 'human-signoff', sourceHandle: 'opt-approve', target: 'output-brief-email', targetHandle: 'in', type: 'omni' },
      { id: 'e-human-revise', source: 'human-signoff', sourceHandle: 'opt-changes', target: 'task-revise', targetHandle: 'in', type: 'omni' },
      { id: 'e-revise-doc', source: 'task-revise', sourceHandle: 'out', target: 'output-revised-doc', targetHandle: 'in', type: 'omni' },
    ],
  }
}

// ---------------------------------------------------------------------------
// ?flow=wall — the Weave money shot, zero clicks: a Generate node with its
// 10-variant grid ALREADY spawned, plus one variant already minted to a wired
// Output. Every seed below is the exact output of state.jsx's real
// spawnOrReplaceGrid/mint algorithm (mulberry32 posterLayoutIndex reject-
// sampling + artifacts.jsx's makeSeed FNV-1a hash) run by hand for
// generateNodeId 'generate-1' at the untouched default seed epoch (1000) —
// i.e. this is BYTE-IDENTICAL to what a fresh "Run Model" click with
// variants:10 actually produces, not a hand-picked approximation, so it's
// guaranteed to read as a real 10-comp creative wall (all 10 Ridgeline Roast
// layouts distinct, verified — see run/posters.jsx's LAYOUTS/posterLayoutIndex).
// Grid geometry (frame width/height, each card's slot position) mirrors
// state.jsx's own VARIANT_CARD_W/H, VARIANT_GAP, VARIANT_PAD_* constants —
// kept in sync by hand, same precedent as the studio flow's step-pitch note
// above.
function makeWallFlow() {
  const variantSeeds = [
    3834433555, 2520565630, 3703616233, 2452839948, 396751103,
    3628581639, 1010440965, 1165544216, 797583364, 2613666764,
  ]
  const cols = 5 // ceil(10/2)
  const cardW = 200
  const cardH = 322
  const gap = 18
  const padX = 20
  // 64 matches state.jsx's VARIANT_PAD_TOP after the clarity pass grew the
  // frame header (label + caption) — 46 left the first card row ~18px under it.
  const padTop = 64
  const variants = variantSeeds.map((seed, index) => ({
    id: `variant-${index}`,
    type: 'variant',
    parentId: 'frame-1',
    extent: 'parent',
    position: {
      x: padX + (index % cols) * (cardW + gap),
      y: padTop + Math.floor(index / cols) * (cardH + gap),
    },
    data: { generateNodeId: 'generate-1', index, model: DEFAULT_MODEL, seed },
    draggable: false,
    selectable: false,
    style: { pointerEvents: 'auto' },
  }))

  return {
    nodes: [
      triggerNode({ position: { x: 0, y: 300 } }),
      {
        id: 'generate-1',
        type: 'generate',
        position: { x: 420, y: 40 },
        data: {
          title: 'Generate key visuals — Ridgeline Roast',
          model: DEFAULT_MODEL,
          prompt:
            "Print and social ad concepts for Ridgeline Roast's new fall single-origin lineup — bold typography-led layouts, warm paper tones, sparing brand-blue accents, one confident focal statement per comp.",
          imageInputs: [],
          variants: 10,
          seed: 1000,
          seedLocked: false,
          groupId: 'frame-1',
          runState: 'done',
          output: { developing: false, seed: 1703422939 },
        },
      },
      {
        id: 'frame-1',
        type: 'variantgroup',
        position: { x: 960, y: 0 },
        data: { sourceId: 'generate-1', title: 'Generate key visuals — Ridgeline Roast', width: 1112, height: 746, count: 10 },
      },
      ...variants,
      {
        id: 'output-pick',
        type: 'output',
        position: { x: 2212, y: 46 },
        data: {
          format: 'Graphic',
          description: 'The selected variant, picked from the generate grid.',
          output: { format: 'Graphic', content: '', developing: false, seed: variantSeeds[3], poster: true },
          runState: 'done',
        },
      },
    ],
    edges: [
      { id: 'e-trigger-generate', source: 'trigger-1', sourceHandle: 'out', target: 'generate-1', targetHandle: 'in', type: 'omni' },
      { id: 'e-generate-pick', source: 'generate-1', sourceHandle: 'out', target: 'output-pick', targetHandle: 'in', type: 'omni' },
    ],
  }
}

// ---------------------------------------------------------------------------
// ?flow=broken — the repair story: EXACTLY 4 staged issues, one per node,
// each otherwise properly wired so none of them ALSO trips the disconnected
// check (that would silently inflate the count past 4). task-noagent has
// real instructions but no agent (the "agent" issue); output-a/output-b are
// both format Text with an empty description (the "description" issue
// twice-over — same (kind, subject) pair, so state.jsx's
// dedupeIssueSubjects renames the second row "Output (Text) — 2", the
// discriminator the spec calls out by name); logic-foreach carries no
// incoming edge at all (the "disconnected" issue — logic is not in
// NEVER_DISCONNECTED_TYPES, unlike generate/note/params/trigger).
function makeBrokenFlow() {
  return {
    nodes: [
      triggerNode({ position: { x: 0, y: 260 } }),
      {
        id: 'task-noagent',
        type: 'task',
        position: { x: 420, y: 220 },
        data: {
          number: 1,
          title: "Summarize this week's creative review",
          instructions: 'Pull the top three takeaways from this week\'s creative review and flag who owns each follow-up.',
          agent: null,
          repeat: 'once',
        },
      },
      {
        id: 'output-a',
        type: 'output',
        position: { x: 900, y: 40 },
        data: { format: 'Text', description: '' },
      },
      {
        id: 'output-b',
        type: 'output',
        // 700, not 420 — the 660 delivered-output pitch off output-a's y of
        // 40. Both cards deliver here (this flow's whole point is that ONE
        // step fails, not the outputs), so they were overlapping by 195px.
        position: { x: 900, y: 700 },
        data: { format: 'Text', description: '' },
      },
      {
        // Deliberately UNWIRED — the 4th staged issue. Positioned off the
        // main spine so it visibly reads as "dropped but never connected"
        // rather than a stray layout accident.
        //
        // QA FINDINGS LEDGER F12 fix — was y:620, which put its rendered
        // card body right under task-noagent's (y:220): task-noagent's REAL
        // rendered height (model row, instructions textarea, agent subcard
        // with its combobox+caption, chip row, repeat segmented) measures
        // ~610px at rest (DOM-measured via getBoundingClientRect at 100%
        // zoom — a plain visual estimate undershot this badly), so the
        // 400px gap that left overlapped, and even y:720 alone would still
        // have overlapped by ~90px. Respaced to y:900 — clears
        // task-noagent's true card bottom (~830, from position.y:220 +
        // ~610 height) with ~70px of real margin to spare, verified via
        // headless DOM measurement in light+dark (theme never changes
        // layout height here, only color tokens).
        id: 'logic-foreach',
        type: 'logic',
        // 1080, not 900: task-noagent above measures ~762px once it has RUN
        // (a resting task is much shorter), so the old pitch put this card
        // 82px inside it mid-run. Same "pitch off the grown height, not the
        // resting one" discipline the output lanes below use.
        position: { x: 420, y: 1080 },
        data: { kind: 'foreach' },
      },
    ],
    edges: [
      { id: 'e-trigger-noagent', source: 'trigger-1', sourceHandle: 'out', target: 'task-noagent', targetHandle: 'in', type: 'omni' },
      { id: 'e-noagent-a', source: 'task-noagent', sourceHandle: 'out', target: 'output-a', targetHandle: 'in', type: 'omni' },
      { id: 'e-noagent-b', source: 'task-noagent', sourceHandle: 'out', target: 'output-b', targetHandle: 'in', type: 'omni' },
    ],
  }
}

// ---------------------------------------------------------------------------
// ?flow=meeting — collaboration state: the exact studio flow (so the run
// story still holds) plus a note card ("a note card in the relevant states"
// — BATCH ORDER). The 3 placed comment threads live in state.jsx's own
// comment store, not here (COMMENTS PHASE: pins are FLOW-coordinate
// annotations, not node data) — see state.jsx's getInitialComments.
function makeMeetingFlow() {
  const base = makeStudioFlow()
  return {
    nodes: [
      ...base.nodes,
      {
        id: 'note-walkthrough',
        type: 'note',
        position: { x: 460, y: -280 },
        data: {
          title: 'Walkthrough notes',
          body: 'Reviewing the fall lineup flow live with Mara + Tomas. Sign-off pending their call on variant count — see the comment on the sign-off step.',
        },
      },
    ],
    edges: base.edges,
  }
}

export const samples = {
  default: makeDefaultFlow,
  audience: makeAudienceFlow,
  blank: makeBlankFlow,
  empty: makeEmptyFlow,
  social: makeSocialFlow,
  brief: makeBriefFlow,
  launch: makeLaunchFlow,
  global: makeGlobalFlow,
  studio: makeStudioFlow,
  wall: makeWallFlow,
  broken: makeBrokenFlow,
  meeting: makeMeetingFlow,
}
