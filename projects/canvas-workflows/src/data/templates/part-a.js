// TEMPLATES PHASE — TP2 (PLAN.md "## TEMPLATES PHASE" / "### TP2 / TP3").
//
// This file owns 15 of the ~30 prebuilt templates: Quick start (3), Content
// (6), Research (6). Its sibling `part-b.js` (a different executor, same
// phase) owns Approvals / Data / Operations — `index.js` concatenates both.
//
// Every entry goes through the shared `template()` builder (`./builder.js`,
// already written — read, never modified): positions come ONLY from each
// step's `col`/`row`, ids are minted fresh per `build()` call, and
// `measured: {}` ships on every node. Copy follows PLAN.md's TP2/TP3 voice
// rule — campaign-ops register, imperative, specific, no invented
// client/brand names, no emoji — matching `../samples.js`'s demo flows.
//
// Every template here: starts at the trigger, ends every path in an Output
// or a Stop, wires every handle its logic/choice nodes declare, and leaves
// zero compiled-panel issues (state.jsx's `computeIssues`: every task has an
// agent, every output has a description, every non-trigger node has an
// incoming edge) — verified with a standalone script, see the report.
import { template } from './builder.js'

export default [
  // ---------------------------------------------------------------------
  // Quick start (3)
  // ---------------------------------------------------------------------
  template({
    id: 'ask-answer',
    name: 'Ask and answer',
    category: 'Quick start',
    blurb: 'The smallest flow: one trigger, one direct answer.',
    steps: {
      t: { type: 'trigger', col: 0 },
      out: { type: 'output', col: 1, format: 'Text', description: 'One direct answer to the prompt, delivered as plain text.' },
    },
    edges: [['t', 'out']],
  }),

  template({
    id: 'scheduled-digest',
    name: 'Scheduled digest',
    category: 'Quick start',
    blurb: 'Wakes on a schedule and sends a short status digest.',
    steps: {
      t: { type: 'trigger', col: 0, mode: 'scheduled', autoStart: true },
      digest: {
        type: 'task',
        col: 1,
        title: 'Draft the digest',
        instructions: 'Summarize the last 24 hours of activity into five bullets, ordered by importance.',
        agent: 'Omni Research Agent',
        repeat: 'schedule',
      },
      out: { type: 'output', col: 2, format: 'Email', description: 'Five-bullet digest, subject line included.' },
    },
    edges: [
      ['t', 'digest'],
      ['digest', 'out'],
    ],
  }),

  template({
    id: 'draft-with-review',
    name: 'Draft with a human check',
    category: 'Quick start',
    blurb: 'Drafts the copy, then pauses for a person to sign off.',
    steps: {
      t: { type: 'trigger', col: 0 },
      draft: {
        type: 'task',
        col: 1,
        title: 'Draft the copy',
        instructions: 'Write a first draft from the brief, and flag any open questions inline.',
        agent: 'Omni Creative Agent',
        repeat: 'once',
      },
      review: { type: 'human', col: 2, ask: 'Any changes before this goes out?', responseType: 'free' },
      out: { type: 'output', col: 3, format: 'Text', description: "Final copy, incorporating the reviewer's notes." },
    },
    edges: [
      ['t', 'draft'],
      ['draft', 'review'],
      ['review', 'out'],
    ],
  }),

  // ---------------------------------------------------------------------
  // Content (6)
  // ---------------------------------------------------------------------
  template({
    id: 'blog-to-social',
    name: 'Blog post → social kit',
    category: 'Content',
    blurb: 'Turns one blog post into channel-ready social copy and crops.',
    steps: {
      t: { type: 'trigger', col: 0 },
      pull: {
        type: 'task',
        col: 1,
        title: 'Pull the source post',
        instructions: 'Read the published blog post and pull out the three points most likely to work as standalone social posts.',
        agent: 'Omni Research Agent',
        repeat: 'once',
      },
      draft: {
        type: 'task',
        col: 2,
        title: 'Draft the social kit',
        instructions: 'Turn each pulled point into a platform-ready post: one X thread, one LinkedIn post, one Instagram caption.',
        agent: 'Omni Creative Agent',
        repeat: 'once',
        attachments: [{ name: 'Brand Guidelines', kind: 'Knowledge base' }],
      },
      outText: {
        type: 'output',
        col: 3,
        row: 0,
        format: 'Text',
        description: 'Three platform-ready posts: X thread, LinkedIn post, Instagram caption.',
      },
      outGraphic: { type: 'output', col: 3, row: 1, format: 'Graphic', description: 'One companion image crop sized for each platform.' },
    },
    edges: [
      ['t', 'pull'],
      ['pull', 'draft'],
      ['draft', 'outText'],
      ['draft', 'outGraphic'],
    ],
  }),

  template({
    id: 'social-blast',
    name: 'Social blast',
    category: 'Content',
    blurb: 'One brief, a full pack of platform-ready posts and art.',
    steps: {
      t: { type: 'trigger', col: 0 },
      brief: {
        type: 'task',
        col: 1,
        title: 'Draft the social pack',
        instructions:
          'Write the launch-week social pack for the fall lineup: every platform gets its own voice, one shared story.',
        agent: 'Omni Social Agent',
        repeat: 'once',
        attachments: [{ name: 'Tone of Voice', kind: 'Knowledge base' }],
      },
      outThread: {
        type: 'output',
        col: 2,
        row: 0,
        format: 'Text',
        description: 'An X thread — 5 posts, hook first, each under 280 characters.',
      },
      outLinkedIn: {
        type: 'output',
        col: 2,
        row: 1,
        format: 'Text',
        description: 'One LinkedIn post — professional voice, single CTA, no hashtag pile.',
      },
      outCaption: {
        type: 'output',
        col: 2,
        row: 2,
        format: 'Text',
        description: 'An Instagram caption — two lines, then the tags.',
      },
      outFeed: {
        type: 'output',
        col: 3,
        row: 0,
        format: 'Graphic',
        description: 'The 1:1 feed visual for launch day.',
      },
      outStory: {
        type: 'output',
        col: 3,
        row: 1,
        format: 'Graphic',
        description: 'The story-crop companion visual.',
      },
      outScript: {
        type: 'output',
        col: 3,
        row: 2,
        format: 'Video',
        description: 'A 20-second vertical video script — hook, three beats, sting.',
      },
    },
    edges: [
      ['t', 'brief'],
      ['brief', 'outThread'],
      ['brief', 'outLinkedIn'],
      ['brief', 'outCaption'],
      ['brief', 'outFeed'],
      ['brief', 'outStory'],
      ['brief', 'outScript'],
    ],
  }),

  template({
    id: 'webinar-repurpose',
    name: 'Repurpose a webinar',
    category: 'Content',
    blurb: 'Cuts one recorded webinar into every format the calendar needs.',
    steps: {
      t: { type: 'trigger', col: 0 },
      transcript: {
        type: 'task',
        col: 1,
        title: 'Pull the transcript',
        instructions: 'Pull the full webinar transcript and mark timestamps for the three strongest moments.',
        agent: 'Omni Research Agent',
        repeat: 'once',
      },
      loop: { type: 'logic', col: 2, kind: 'foreach' },
      variant: {
        type: 'task',
        col: 3,
        title: 'Draft the format variant',
        instructions: "For the current format, cut the marked moments into that format's shape and length.",
        agent: 'Omni Creative Agent',
        repeat: 'times',
        attachments: [{ name: 'Brand Guidelines', kind: 'Knowledge base' }],
      },
      outBlog: { type: 'output', col: 4, row: 0, format: 'Text', description: 'One recap blog post, 600 words, built from the transcript.' },
      outCards: { type: 'output', col: 4, row: 1, format: 'Graphic', description: 'Three quote cards, one per strongest moment.' },
      outClip: { type: 'output', col: 4, row: 2, format: 'Video', description: 'One 90-second highlight cut with captions.' },
      outNewsletter: { type: 'output', col: 4, row: 3, format: 'Email', description: 'Newsletter blurb linking out to the full recording.' },
    },
    edges: [
      ['t', 'transcript'],
      ['transcript', 'loop'],
      ['loop', 'variant'],
      ['variant', 'outBlog'],
      ['variant', 'outCards'],
      ['variant', 'outClip'],
      ['variant', 'outNewsletter'],
    ],
  }),

  template({
    id: 'campaign-localize',
    name: 'Localize a campaign',
    category: 'Content',
    blurb: 'Adapts a master campaign for every live market, one at a time.',
    steps: {
      t: { type: 'trigger', col: 0 },
      master: {
        type: 'task',
        col: 1,
        title: 'Pull the master campaign',
        instructions: 'Pull the master campaign assets and the claims each one carries.',
        agent: 'Omni Media Agent',
        repeat: 'once',
        attachments: [{ name: 'plan_mcp', kind: 'Tool' }],
      },
      loop: { type: 'logic', col: 2, kind: 'foreach' },
      localize: {
        type: 'task',
        col: 3,
        title: 'Localize the assets',
        instructions: 'For the current market, translate every asset and swap in local proof points and offer terms.',
        agent: 'Omni Media Agent',
        repeat: 'times',
      },
      signoff: {
        type: 'human',
        col: 4,
        ask: 'Ready to ship the localized kit in this market?',
        responseType: 'choice',
        options: [
          { id: 'approve', label: 'Approve' },
          { id: 'hold', label: 'Hold' },
        ],
      },
      out: { type: 'output', col: 5, row: 0, format: 'Presentation', description: 'Market-ready kit: localized assets plus a one-page claims summary.' },
      stop: { type: 'stop', col: 5, row: 1 },
    },
    edges: [
      ['t', 'master'],
      ['master', 'loop'],
      ['loop', 'localize'],
      ['localize', 'signoff'],
      ['signoff', 'out', 'opt-approve'],
      ['signoff', 'stop', 'opt-hold'],
    ],
  }),

  template({
    id: 'brand-safe-images',
    name: 'Brand-safe image set',
    category: 'Content',
    blurb: 'Generates on-brand imagery, with a licensed fallback if it fails.',
    steps: {
      t: { type: 'trigger', col: 0 },
      brief: {
        type: 'task',
        col: 1,
        title: 'Write the image brief',
        instructions: 'Write the generation brief: subject, mood, palette, and the brand elements that must appear.',
        agent: 'Omni Creative Agent',
        repeat: 'once',
        attachments: [{ name: 'Brand Guidelines', kind: 'Knowledge base' }],
      },
      gen: { type: 'logic', col: 2, kind: 'try' },
      outGraphic: { type: 'output', col: 3, row: 0, format: 'Graphic', description: 'Final image set, three sizes, brand-guideline compliant.' },
      fallback: {
        type: 'task',
        col: 3,
        row: 1,
        title: 'Source licensed alternatives',
        instructions: 'Generation failed — find licensed stock that matches the brief, and note the licence terms for each frame.',
        agent: 'Omni Research Agent',
        repeat: 'once',
      },
      outDoc: { type: 'output', col: 4, format: 'Doc', description: 'Stock sourcing brief — candidate frames with licence terms.' },
    },
    edges: [
      ['t', 'brief'],
      ['brief', 'gen'],
      ['gen', 'outGraphic', 'try'],
      ['gen', 'fallback', 'catch'],
      ['fallback', 'outDoc'],
    ],
  }),

  template({
    id: 'weekly-newsletter',
    name: 'Weekly newsletter',
    category: 'Content',
    blurb: "Pulls the week's top stories into a send-ready newsletter.",
    steps: {
      t: { type: 'trigger', col: 0, mode: 'scheduled', autoStart: true },
      pull: {
        type: 'task',
        col: 1,
        title: "Pull the week's highlights",
        instructions: "Pull the top five stories from this week's activity, ranked by relevance.",
        agent: 'Omni Research Agent',
        repeat: 'once',
      },
      draft: {
        type: 'task',
        col: 2,
        title: 'Draft the newsletter',
        instructions: 'Turn the five pulled stories into a newsletter: one-line intro, five short items, one CTA.',
        agent: 'Omni Creative Agent',
        repeat: 'once',
        attachments: [{ name: 'Brand Guidelines', kind: 'Knowledge base' }],
      },
      out: { type: 'output', col: 3, format: 'Email', description: 'Send-ready newsletter: intro, five items, one CTA.' },
    },
    edges: [
      ['t', 'pull'],
      ['pull', 'draft'],
      ['draft', 'out'],
    ],
  }),

  template({
    id: 'ad-variant-matrix',
    name: 'Ad variant matrix',
    category: 'Content',
    blurb: 'Drafts an ad variant per audience and rolls them into one matrix.',
    steps: {
      t: { type: 'trigger', col: 0 },
      brief: {
        type: 'task',
        col: 1,
        title: 'Write the ad brief',
        instructions: 'Write the core ad brief: the offer, the proof point, and the constraint every variant must respect.',
        agent: 'Omni Media Agent',
        repeat: 'once',
        attachments: [{ name: 'plan_mcp', kind: 'Tool' }],
      },
      loop: { type: 'logic', col: 2, kind: 'foreach' },
      variant: {
        type: 'task',
        col: 3,
        title: 'Draft the variant',
        instructions: 'For the current audience and platform, draft one ad variant against the brief, 25 words max.',
        agent: 'Omni Creative Agent',
        repeat: 'times',
        attachments: [{ name: 'Brand Guidelines', kind: 'Knowledge base' }],
      },
      outSheet: {
        type: 'output',
        col: 4,
        row: 0,
        format: 'Spreadsheet',
        description: 'Variant matrix: one row per audience/platform pair, with copy and status.',
      },
      outText: { type: 'output', col: 4, row: 1, format: 'Text', description: "Every variant's copy, plain text, ready to paste into ad manager." },
    },
    edges: [
      ['t', 'brief'],
      ['brief', 'loop'],
      ['loop', 'variant'],
      ['variant', 'outSheet'],
      ['variant', 'outText'],
    ],
  }),

  // BATCH MATRIX (PLAN.md "## BATCH MATRIX", 2026-08-24, Bryan) — "a new
  // template whose whole purpose is to generate a very high volume of
  // social post style assets like 25 at a time," with a HITL step that
  // demos the node sheet and a results frame that lays every version out
  // "in a way thats easy to see." The check-in step's `chatOpener` override
  // exists because engine.js's default chat opener ("Draft's in...")
  // would be factually wrong here — this conversation happens BEFORE the
  // batch is produced, not after a draft (see run/engine.js's
  // CHAT_OPENER_TEXT comment). `out`'s `batchCount: 25` is the one field
  // that turns run/engine.js's 'output' case into the batch-delivery path
  // (`data.output.assets = [25 items]`) instead of a single artifact —
  // everything else here is the same task/checkin/output vocabulary every
  // other template in this file already uses. THE SPLIT (PLAN.md
  // "## THE SPLIT") retyped `review` from `type: 'human', responseType:
  // 'chat'` to `type: 'checkin'` — no other field changed.
  //
  // AGENT-LED CHIPS (PLAN.md "## AGENT-LED CHIPS") — this step used to also
  // author `options: [Punchy and bold / Clean and minimal / Warm and
  // human]`, retired along with CheckinNode.jsx's options editor (the
  // builder never authors a check-in's chips now).
  //
  // THE AGENT ASKS (PLAN.md "## THE AGENT ASKS", item 3) — `review`'s own
  // `ask` retires too (never rendered, never read — the agent's own opener,
  // `chatOpener` just above, IS the question now). The direction trio still
  // has to surface at run time per that phase's own Verify block ("the
  // batch template's ... upstream must still surface the direction trio"):
  // run/engine.js's checkinSourceText reads (in priority) `data.guidance` ->
  // the nearest UPSTREAM node's own instructions/title -> `chatOpener`. This
  // step's true upstream is `brief` (the edge below is brief -> review), so
  // `brief`'s own instructions now say "creative direction" — that's what
  // resolves the trio, not `chatOpener` (which only gets consulted when
  // guidance AND upstream both come up empty).
  template({
    id: 'social-batch-25',
    name: 'Social batch ×25 A',
    category: 'Content',
    blurb: 'One brief in, twenty-five channel-ready graphics out — direction set in a live check-in.',
    steps: {
      t: { type: 'trigger', col: 0, mode: 'manual' },
      brief: {
        type: 'task',
        col: 1,
        title: 'Pull the campaign brief',
        instructions: 'Pull the campaign brief and the assets already on file, and confirm the creative direction and calendar slots this batch needs to fill.',
        agent: 'Omni Media Agent',
        repeat: 'once',
        attachments: [{ name: 'Brand Guidelines', kind: 'Knowledge base' }],
      },
      review: {
        type: 'checkin',
        col: 2,
        chatOpener: "Brief's in — what direction should this batch take?",
      },
      produce: {
        type: 'task',
        col: 3,
        title: 'Produce the batch',
        instructions: 'Produce 25 channel-ready social graphics against the brief and the agreed direction, one per calendar slot.',
        agent: 'Omni Creative Agent',
        repeat: 'once',
      },
      out: {
        type: 'output',
        col: 4,
        format: 'Graphic',
        batchCount: 25,
        description: '25 channel-ready social graphics, one per calendar slot.',
      },
    },
    edges: [
      ['t', 'brief'],
      ['brief', 'review'],
      ['review', 'produce'],
      ['produce', 'out'],
    ],
  }),

  // X25 B (PLAN.md "## X25 B — the floating chat window variant", 2026-08-25,
  // Bryan: "when the user runs the app, and gets to that node, a chat
  // dialogue box should appear as an overlay window i can move around the
  // page and close out... i think this version is more like andrews
  // original ask") — a deliberate A/B against the template just above: same
  // trigger/brief/produce/output(batchCount 25) flow, but the direction step
  // reverts to a CLASSIC GATE (type 'human', not 'checkin') so it pauses with
  // authored options rather than a talked-through check-in, and carries
  // `chatSurface: 'window'` — the one flag HumanNode.jsx reads to float its
  // paused chat in a draggable window instead of in-card. All three options
  // are genuinely equivalent next steps (three directions, one destination),
  // so all three route to the SAME `produce` step — legit multi-edge
  // convergence, the same shape a branching gate's distinct-target edges
  // already use elsewhere in this file, just pointed at one target three
  // times instead of two different ones.
  template({
    id: 'social-batch-25-b',
    name: 'Social batch ×25 B',
    category: 'Content',
    blurb: 'One brief in, twenty-five channel-ready graphics out — direction set in a floating chat window you can move around and close.',
    steps: {
      t: { type: 'trigger', col: 0, mode: 'manual' },
      brief: {
        type: 'task',
        col: 1,
        title: 'Pull the campaign brief',
        instructions: 'Pull the campaign brief and the assets already on file, and confirm the creative direction and calendar slots this batch needs to fill.',
        agent: 'Omni Media Agent',
        repeat: 'once',
        attachments: [{ name: 'Brand Guidelines', kind: 'Knowledge base' }],
      },
      gate: {
        type: 'human',
        col: 2,
        ask: 'Set the creative direction for this batch.',
        responseType: 'choice',
        chatSurface: 'window',
        options: [
          { id: 'punchy', label: 'Punchy and bold' },
          { id: 'clean', label: 'Clean and minimal' },
          { id: 'warm', label: 'Warm and human' },
        ],
      },
      produce: {
        type: 'task',
        col: 3,
        title: 'Produce the batch',
        instructions: 'Produce 25 channel-ready social graphics against the brief and the agreed direction, one per calendar slot.',
        agent: 'Omni Creative Agent',
        repeat: 'once',
      },
      out: {
        type: 'output',
        col: 4,
        format: 'Graphic',
        batchCount: 25,
        description: '25 channel-ready social graphics, one per calendar slot.',
      },
    },
    edges: [
      ['t', 'brief'],
      ['brief', 'gate'],
      ['gate', 'produce', 'opt-punchy'],
      ['gate', 'produce', 'opt-clean'],
      ['gate', 'produce', 'opt-warm'],
      ['produce', 'out'],
    ],
  }),

  // THE SPLIT (PLAN.md "## THE SPLIT — two human nodes: the Gate and the
  // Check-in", 2026-08-24) — the demo template Bryan asked for: "can you
  // build one out that shows [the contrast]... includes a demo template
  // carrying BOTH so the contrast is visible in one run." One run walks
  // through BOTH pause kinds back to back: `direction` is a check-in (talks
  // it through, never branches, resolves through its own satellite sheet)
  // and `gate` is the classic human node (decides, genuinely branches —
  // Approve skips straight to `out`; Needs changes detours through `revise`
  // first, same "gate skips a column, revise feeds the SAME output"
  // shape src/data/samples.js's own `brief` demo flow already establishes
  // for this exact pattern).
  //
  // AGENT-LED CHIPS (PLAN.md "## AGENT-LED CHIPS") — `direction`'s own
  // authored trio (Sharper/Softer/As planned) is retired along with
  // CheckinNode.jsx's options editor. `gate` (the classic human node just
  // below) keeps its authored `options` untouched — a GATE still programs
  // its own decision.
  //
  // THE AGENT ASKS (PLAN.md "## THE AGENT ASKS", item 3) — `direction`'s own
  // `ask` retires too, and this step never authors `chatOpener` either, so
  // run/engine.js's checkinOpener/checkinSourceText fall to their next
  // tier: the nearest UPSTREAM node's own instructions/title (`draft`,
  // whose instructions say "...ready for a quick direction check...") —
  // still surfaces the SAME Punchy/Clean/Warm trio (and now a genuinely
  // on-topic opener too, instead of the flat generic default) the batch
  // template's own review step gets — expected, not a bug: both are
  // genuinely about creative direction, so the agent proposes the same
  // on-topic set for both.
  template({
    id: 'decide-and-direct',
    name: 'Decide and direct',
    category: 'Content',
    blurb: 'Talk through the direction in a live check-in, then stop for a real yes-or-no before it ships — the two ways to keep a person in the loop, back to back.',
    steps: {
      t: { type: 'trigger', col: 0, mode: 'manual' },
      draft: {
        type: 'task',
        col: 1,
        title: 'Draft the concept',
        instructions: 'Draft the creative concept from the brief, ready for a quick direction check before it develops further.',
        agent: 'Omni Creative Agent',
        repeat: 'once',
      },
      direction: {
        type: 'checkin',
        col: 2,
      },
      apply: {
        type: 'task',
        col: 3,
        title: 'Apply the direction',
        instructions: 'Apply the agreed direction to the concept and prepare it for sign-off.',
        agent: 'Omni Creative Agent',
        repeat: 'once',
      },
      gate: {
        type: 'human',
        col: 4,
        ask: 'Ship this version?',
        responseType: 'choice',
        options: [
          { id: 'approve', label: 'Approve' },
          { id: 'changes', label: 'Needs changes' },
        ],
      },
      revise: {
        type: 'task',
        col: 5,
        title: 'Revise once',
        instructions: 'Apply one more revision pass to the concept based on the gate feedback, then hand it back for output.',
        agent: 'Omni Creative Agent',
        repeat: 'once',
      },
      out: {
        type: 'output',
        col: 6,
        format: 'Doc',
        description: 'Approved concept, ready to queue.',
      },
    },
    edges: [
      ['t', 'draft'],
      ['draft', 'direction'],
      ['direction', 'apply'],
      ['apply', 'gate'],
      ['gate', 'out', 'opt-approve'],
      ['gate', 'revise', 'opt-changes'],
      ['revise', 'out'],
    ],
  }),

  // ---------------------------------------------------------------------
  // Research (6)
  // ---------------------------------------------------------------------
  template({
    id: 'competitor-teardown',
    name: 'Competitor teardown',
    category: 'Research',
    blurb: 'Profiles a competitor set on positioning, pricing, and packaging.',
    steps: {
      t: { type: 'trigger', col: 0 },
      pull: {
        type: 'task',
        col: 1,
        title: 'Pull the competitor set',
        instructions: 'Pull the current competitor set and one representative asset from each.',
        agent: 'Omni Research Agent',
        repeat: 'once',
        attachments: [{ name: 'web_search', kind: 'Tool' }],
      },
      positioning: {
        type: 'task',
        col: 2,
        title: 'Analyze positioning',
        instructions: "Compare each competitor's stated positioning against what their assets actually show.",
        agent: 'Omni Research Agent',
        repeat: 'once',
        attachments: [{ name: 'Market Insights', kind: 'Knowledge base' }],
      },
      pricing: {
        type: 'task',
        col: 3,
        title: 'Analyze pricing and packaging',
        instructions: "Lay out each competitor's pricing tiers and packaging side by side.",
        agent: 'Omni Research Agent',
        repeat: 'once',
      },
      human: { type: 'human', col: 4, ask: 'Anything missing before this compiles?', responseType: 'free' },
      outDoc: { type: 'output', col: 5, row: 0, format: 'Doc', description: 'Full teardown, one section per competitor: positioning, pricing, packaging.' },
      outPresentation: { type: 'output', col: 5, row: 1, format: 'Presentation', description: 'Executive summary: 8 slides, one competitor per spread.' },
    },
    edges: [
      ['t', 'pull'],
      ['pull', 'positioning'],
      ['positioning', 'pricing'],
      ['pricing', 'human'],
      ['human', 'outDoc'],
      ['human', 'outPresentation'],
    ],
  }),

  template({
    id: 'audience-deep-dive',
    name: 'Audience deep-dive',
    category: 'Research',
    blurb: 'Segments the audience and sizes the opportunity in each group.',
    steps: {
      t: { type: 'trigger', col: 0 },
      pull: {
        type: 'task',
        col: 1,
        title: 'Pull the audience data',
        instructions: 'Pull the available audience data across every connected source.',
        agent: 'Omni Audience Agent',
        repeat: 'once',
        attachments: [{ name: 'audience_mcp', kind: 'Tool' }],
      },
      segment: {
        type: 'task',
        col: 2,
        title: 'Segment the audience',
        instructions: 'Cluster the audience into segments by behavior, not demographics alone.',
        agent: 'Omni Audience Agent',
        repeat: 'once',
      },
      human: { type: 'human', col: 3, ask: 'Any segments to prioritize or drop?', responseType: 'free' },
      outDoc: {
        type: 'output',
        col: 4,
        row: 0,
        format: 'Doc',
        description: 'Segment profiles: size, behavior, and the one insight that should drive targeting.',
      },
      outSheet: { type: 'output', col: 4, row: 1, format: 'Spreadsheet', description: 'Segment sizing sheet, ranked by opportunity.' },
    },
    edges: [
      ['t', 'pull'],
      ['pull', 'segment'],
      ['segment', 'human'],
      ['human', 'outDoc'],
      ['human', 'outSheet'],
    ],
  }),

  template({
    id: 'trend-scan',
    name: 'Trend scan → opportunity brief',
    category: 'Research',
    blurb: 'Scans for emerging trends and writes up the opportunity.',
    steps: {
      t: { type: 'trigger', col: 0 },
      scan: {
        type: 'task',
        col: 1,
        title: 'Scan for trends',
        instructions: 'Scan the category for emerging trends from the last 30 days.',
        agent: 'Omni Research Agent',
        repeat: 'once',
        attachments: [{ name: 'web_search', kind: 'Tool' }],
      },
      brief: {
        type: 'task',
        col: 2,
        title: 'Write the opportunity brief',
        instructions: 'Write a one-page brief on the strongest trend: the size of it, and the recommended move.',
        agent: 'Omni Research Agent',
        repeat: 'once',
      },
      human: { type: 'human', col: 3, ask: 'Anything to sharpen before this ships?', responseType: 'free' },
      outDoc: { type: 'output', col: 4, format: 'Doc', description: 'One-page opportunity brief: the trend, its size, and the recommended move.' },
    },
    edges: [
      ['t', 'scan'],
      ['scan', 'brief'],
      ['brief', 'human'],
      ['human', 'outDoc'],
    ],
  }),

  template({
    id: 'survey-themes',
    name: 'Survey open-ends → themes',
    category: 'Research',
    blurb: 'Clusters open-ended survey answers into named, sized themes.',
    steps: {
      t: { type: 'trigger', col: 0 },
      pull: {
        type: 'task',
        col: 1,
        title: 'Pull the open-ends',
        instructions: 'Pull every open-ended survey response from the current wave.',
        agent: 'Omni Research Agent',
        repeat: 'once',
      },
      cluster: {
        type: 'task',
        col: 2,
        title: 'Cluster into themes',
        instructions: 'Group the responses into named themes, each sized by share of respondents.',
        agent: 'Omni Research Agent',
        repeat: 'once',
        attachments: [{ name: 'Data Analysis', kind: 'Skill' }],
      },
      outDoc: { type: 'output', col: 3, format: 'Doc', description: 'Theme summary: each theme named, sized, and illustrated with two verbatim quotes.' },
    },
    edges: [
      ['t', 'pull'],
      ['pull', 'cluster'],
      ['cluster', 'outDoc'],
    ],
  }),

  template({
    id: 'category-landscape',
    name: 'Category landscape',
    category: 'Research',
    blurb: 'Profiles every competitor in the category and rolls it into one view.',
    steps: {
      t: { type: 'trigger', col: 0 },
      pull: {
        type: 'task',
        col: 1,
        title: 'Pull the category set',
        instructions: 'Pull the current competitor set for the category.',
        agent: 'Omni Research Agent',
        repeat: 'once',
        attachments: [{ name: 'web_search', kind: 'Tool' }],
      },
      loop: { type: 'logic', col: 2, kind: 'foreach' },
      profile: {
        type: 'task',
        col: 3,
        title: 'Profile the competitor',
        instructions: 'For the current competitor, profile positioning, pricing, and estimated share of voice.',
        agent: 'Omni Research Agent',
        repeat: 'times',
        attachments: [{ name: 'Market Insights', kind: 'Knowledge base' }],
      },
      rollup: {
        type: 'task',
        col: 4,
        row: 0,
        title: 'Roll up the landscape',
        instructions: 'Roll every competitor profile into one landscape view, ranked by threat level.',
        agent: 'Omni Research Agent',
        repeat: 'once',
        attachments: [{ name: 'Data Analysis', kind: 'Skill' }],
      },
      outMatrix: {
        type: 'output',
        col: 4,
        row: 1,
        format: 'Spreadsheet',
        description: 'Category matrix: one row per competitor — position, pricing, share of voice.',
      },
      human: { type: 'human', col: 5, ask: 'Anything to flag before this compiles?', responseType: 'free' },
      outDeck: { type: 'output', col: 6, row: 0, format: 'Presentation', description: 'Landscape deck: one spread per competitor plus a summary view.' },
      outDoc: { type: 'output', col: 6, row: 1, format: 'Doc', description: 'Full landscape write-up, one section per competitor.' },
    },
    edges: [
      ['t', 'pull'],
      ['pull', 'loop'],
      ['loop', 'profile'],
      ['profile', 'outMatrix'],
      ['profile', 'rollup'],
      ['rollup', 'human'],
      ['human', 'outDeck'],
      ['human', 'outDoc'],
    ],
  }),

  template({
    id: 'claims-substantiation',
    name: 'Claims substantiation',
    category: 'Research',
    blurb: 'Checks every claim against the evidence before it ships.',
    steps: {
      t: { type: 'trigger', col: 0 },
      check: {
        type: 'task',
        col: 1,
        title: 'Check the claims',
        instructions: 'Pull every claim in the current campaign and check each one against available evidence.',
        agent: 'Omni Research Agent',
        repeat: 'once',
        attachments: [
          { name: 'web_search', kind: 'Tool' },
          { name: 'Market Insights', kind: 'Knowledge base' },
        ],
      },
      logicIf: { type: 'logic', col: 2, kind: 'if' },
      outSub: { type: 'output', col: 3, row: 0, format: 'Doc', description: 'Substantiation file: each claim mapped to its supporting evidence.' },
      humanGate: {
        type: 'human',
        col: 3,
        row: 1,
        ask: 'How should this flag be handled?',
        responseType: 'choice',
        options: [
          { id: 'revise', label: 'Revise' },
          { id: 'escalate', label: 'Escalate' },
        ],
      },
      revise: {
        type: 'task',
        col: 4,
        row: 0,
        title: 'Revise the unsupported claims',
        instructions: 'Revise every claim that failed substantiation, keeping the core promise intact.',
        agent: 'Omni Creative Agent',
        repeat: 'once',
        attachments: [{ name: 'Brand Guidelines', kind: 'Knowledge base' }],
      },
      stop: { type: 'stop', col: 4, row: 1 },
      outRevised: { type: 'output', col: 5, format: 'Doc', description: 'Revised claims, redlined against the original, with unsupported lines removed.' },
    },
    edges: [
      ['t', 'check'],
      ['check', 'logicIf'],
      ['logicIf', 'outSub', 'true'],
      ['logicIf', 'humanGate', 'false'],
      ['humanGate', 'revise', 'opt-revise'],
      ['humanGate', 'stop', 'opt-escalate'],
      ['revise', 'outRevised'],
    ],
  }),

  // ---------------------------------------------------------------------
  // WAVE 5 — THE VERB EXPANSION, showcase pack (4). One template per verb
  // tier (PLAN.md master contract, "### WAVE 5 — SHOWCASE + INTEGRATED
  // VERIFY"), each wiring several of the 13 new node types from Waves 1-4
  // into a real, runnable graph — every one of these types had NEVER been
  // authored through `template()` before this wave (confirmed against
  // every step above), which is what surfaced builder.js's own buildData()/
  // EST_HEIGHT/RUN_GROWTH gaps this wave's own file header comments there
  // document and fix. Same voice/verify bar as every template above:
  // campaign-ops register, no invented client/brand names, every task has
  // an agent, every output a description, every generate a prompt, every
  // declared branch handle wired, zero compiled-panel issues at rest.
  // ---------------------------------------------------------------------

  // Source + Style Reference feed a Task -> Generate pair (Style locks the
  // poster's colorway — Wave 3's own showcase effect); Guardrail checks the
  // result, PASS hands off to a person, FLAG documents the fix needed.
  template({
    id: 'launch-with-guardrails',
    name: 'Launch with guardrails',
    category: 'Content',
    blurb: 'Sources the brief, locks a look, generates the key visual, and checks it before it ships.',
    steps: {
      t: { type: 'trigger', col: 0, row: 0, mode: 'manual' },
      src: { type: 'signal', col: 0, row: 1, kind: 'source', sourceKind: 'brief', ref: 'fall_launch_brief.pdf' },
      style: { type: 'signal', col: 0, row: 2, kind: 'style', imageInputs: [], seed: 4200 },
      draft: {
        type: 'task',
        col: 1,
        title: 'Draft the key visual brief',
        instructions:
          'Write the generation brief for the fall lineup launch: subject, mood, palette, and the one brand element that must appear.',
        agent: 'Omni Creative Agent',
        repeat: 'once',
        attachments: [{ name: 'Brand Guidelines', kind: 'Knowledge base' }],
      },
      gen: {
        type: 'generate',
        col: 2,
        title: 'Generate the launch key visual',
        prompt: 'A confident hero shot for the fall lineup launch — clean composition, on-brand palette, one focal product moment.',
      },
      guardrail: { type: 'logic', col: 3, kind: 'guardrail' },
      handoff: {
        type: 'handoff',
        col: 4,
        row: 0,
        owner: 'Elena Rios',
        due: 'Fri · EOD',
        note: 'Confirm the visual clears legal before it goes to media.',
      },
      outFlag: {
        type: 'output',
        col: 4,
        row: 1,
        format: 'Doc',
        description: 'Guardrail flag note — the specific line that needs a rewrite before this ships.',
      },
      outFinal: {
        type: 'output',
        col: 5,
        format: 'Graphic',
        description: 'Approved launch key visual, cleared by legal and brand, ready for media trafficking.',
      },
    },
    edges: [
      ['t', 'draft'],
      ['src', 'draft'],
      ['draft', 'gen'],
      ['style', 'gen'],
      ['gen', 'guardrail'],
      ['guardrail', 'handoff', 'pass'],
      ['guardrail', 'outFlag', 'flag'],
      ['handoff', 'outFinal'],
    ],
  }),

  // Localize fans out to one task per market (3, matching its own default
  // roster minus MX); Gather bundles all three back into one deck.
  template({
    id: 'localize-and-gather',
    name: 'Localize and gather',
    category: 'Content',
    blurb: 'Adapts the campaign for three markets in parallel, then bundles the results into one deck.',
    steps: {
      t: { type: 'trigger', col: 0, mode: 'manual' },
      loc: { type: 'localize', col: 1, markets: ['DE', 'FR', 'JP'] },
      taskDE: {
        type: 'task',
        col: 2,
        row: 0,
        title: 'Adapt assets for Germany',
        instructions: 'Localize the copy and swap in local proof points and offer terms for the German market.',
        agent: 'Omni Localization Agent',
        repeat: 'once',
      },
      taskFR: {
        type: 'task',
        col: 2,
        row: 1,
        title: 'Adapt assets for France',
        instructions: 'Localize the copy and swap in local proof points and offer terms for the French market.',
        agent: 'Omni Localization Agent',
        repeat: 'once',
      },
      taskJP: {
        type: 'task',
        col: 2,
        row: 2,
        title: 'Adapt assets for Japan',
        instructions: 'Localize the copy and swap in local proof points and offer terms for the Japanese market.',
        agent: 'Omni Localization Agent',
        repeat: 'once',
      },
      gather: { type: 'logic', col: 3, kind: 'gather' },
      outDeck: {
        type: 'output',
        col: 4,
        format: 'Presentation',
        description: 'Market-ready localization deck — one spread per market, adapted copy and offer terms.',
      },
    },
    edges: [
      ['t', 'loc'],
      ['loc', 'taskDE'],
      ['loc', 'taskFR'],
      ['loc', 'taskJP'],
      ['taskDE', 'gather'],
      ['taskFR', 'gather'],
      ['taskJP', 'gather'],
      ['gather', 'outDeck'],
    ],
  }),

  // A live Output feeds Measure (Output DOES carry a real out handle —
  // "terminal by default, but HAS an out source", run/engine.js's own
  // header note on that case); If always takes its true beat (an "honest
  // fake" considering pause, not a real read of the measure's pass/fail),
  // so the true arm is the template's own main payload — the false arm
  // still gets a clean Stop, matching every other if/else template's own
  // "every declared branch handle wired" bar.
  template({
    id: 'measure-and-optimize',
    name: 'Measure and optimize',
    category: 'Research',
    blurb: 'Checks the live asset against target, then runs an optimization pass on anything under plan.',
    steps: {
      t: { type: 'trigger', col: 0, mode: 'manual' },
      outLive: {
        type: 'output',
        col: 1,
        format: 'Graphic',
        description: 'Current live hero visual for the fall lineup, as trafficked this week.',
      },
      measure: { type: 'signal', col: 2, kind: 'measure', kpi: 'CTR', target: '≥ 1.2%', windowDays: 7 },
      gate: { type: 'logic', col: 3, kind: 'if' },
      optimize: { type: 'optimize', col: 4, row: 0, cycles: 2 },
      stop: { type: 'stop', col: 4, row: 1 },
      outOptimized: {
        type: 'output',
        col: 5,
        format: 'Doc',
        description: 'Optimization log — the cycles run and the projected lift, ready for the media team.',
      },
    },
    edges: [
      ['t', 'outLive'],
      ['outLive', 'measure'],
      ['measure', 'gate'],
      ['gate', 'optimize', 'true'],
      ['gate', 'stop', 'false'],
      ['optimize', 'outOptimized'],
    ],
  }),

  // Audience feeds Split (the echo Wave 2 named by example: "receiving
  // Task/Generate/Split echo 'AUDIENCE · from NN'"); each arm gets its own
  // Generate; Compare scores both and its OUT carries the winner's poster
  // straight through to a Graphic Output (Wave 3's own inherited-artwork
  // effect — engine.js's 'output' case: format==='Graphic' inherits the
  // immediate upstream's poster when it's a bare Generate-shaped one).
  template({
    id: 'ab-the-launch',
    name: 'A/B the launch',
    category: 'Research',
    blurb: 'Splits the audience, generates two distinct takes, and lets the winner carry through to the output.',
    steps: {
      t: { type: 'trigger', col: 0, row: 0, mode: 'manual' },
      aud: {
        type: 'signal',
        col: 0,
        row: 1,
        kind: 'audience',
        segments: [
          { id: 'seg-1', label: 'Urban commuters 25-34' },
          { id: 'seg-2', label: 'Weekend brunchers' },
        ],
      },
      split: { type: 'logic', col: 1, kind: 'split', percentA: 70 },
      genA: {
        type: 'generate',
        col: 2,
        row: 0,
        title: 'Generate visual — Variant A',
        prompt: 'A bold, high-energy hero visual for urban commuters — dynamic composition, saturated palette.',
      },
      genB: {
        type: 'generate',
        col: 2,
        row: 1,
        title: 'Generate visual — Variant B',
        prompt: 'A warm, relaxed hero visual for weekend brunchers — soft light, inviting composition.',
      },
      compare: { type: 'logic', col: 3, kind: 'compare', criteria: 'Energy' },
      outFinal: {
        type: 'output',
        col: 4,
        format: 'Graphic',
        description: 'Winning key visual from the A/B test, ready to traffic.',
      },
    },
    edges: [
      ['t', 'split'],
      ['aud', 'split'],
      ['split', 'genA', 'a'],
      ['split', 'genB', 'b'],
      ['genA', 'compare'],
      ['genB', 'compare'],
      ['compare', 'outFinal'],
    ],
  }),
]
