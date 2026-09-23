// TEMPLATES PHASE — TP3 (2026-08-12)
//
// The 15 Approvals / Data / Operations templates (PLAN.md "## TEMPLATES
// PHASE", TP3 list). Built entirely on top of `template()` from builder.js
// (TP-owned, read-only — never edited here); `index.js` (TP2's job) is the
// only file that imports this one and merges it with part-a.js.
//
// Voice: campaign-ops register, imperative, specific — no invented
// client/brand names, no emoji. Agents only from the 4 mock agents
// (blocks.js); attachment kinds only Knowledge base / Tool / Skill, names
// only from the established set (web_search, audience_mcp, plan_mcp,
// Market Insights, Brand Guidelines, Data Analysis). Every template starts
// at a trigger, every path ends in an Output or a Stop, every declared
// branch handle (true/false, try/catch, case-N, opt-<id>) is wired, and
// every task has an agent + every output a non-empty description — so the
// compiled panel reports zero issues the moment one lands on the canvas.

import { template } from './builder.js'

export default [
  // ---------------------------------------------------------------------
  // Approvals (4)
  // ---------------------------------------------------------------------

  // 3-option human choice gate; the "blocked" branch is a clean Stop.
  template({
    id: 'legal-gate',
    name: 'Legal review gate',
    category: 'Approvals',
    blurb: 'Route a claim through legal and brand, with a clean stop for anything blocked.',
    steps: {
      t: { type: 'trigger', col: 0, mode: 'manual' },
      draft: {
        type: 'task',
        col: 1,
        title: 'Draft the claim',
        instructions: 'Write the claim exactly as it will run, with the specific proof point it depends on.',
        agent: 'Omni Creative Agent',
      },
      gate: {
        type: 'human',
        col: 2,
        ask: 'Does this claim clear legal and brand?',
        responseType: 'choice',
        options: [
          { id: 'approved', label: 'Approved' },
          { id: 'changes', label: 'Needs changes' },
          { id: 'blocked', label: 'Blocked' },
        ],
      },
      outApproved: { type: 'output', col: 3, row: 0, format: 'Doc', description: 'Approved claim, cleared to run.' },
      outChanges: { type: 'output', col: 3, row: 1, format: 'Doc', description: 'Redline notes on the claim, back to the writer.' },
      stopBlocked: { type: 'stop', col: 3, row: 2 },
    },
    edges: [
      ['t', 'draft'],
      ['draft', 'gate'],
      ['gate', 'outApproved', 'opt-approved'],
      ['gate', 'outChanges', 'opt-changes'],
      ['gate', 'stopBlocked', 'opt-blocked'],
    ],
  }),

  // Two sequential human gates; a reject at either stage stops that lane.
  template({
    id: 'two-stage-approval',
    name: 'Two-stage approval chain',
    category: 'Approvals',
    blurb: 'Two sequential sign-offs — creative, then legal — before anything ships.',
    steps: {
      t: { type: 'trigger', col: 0, mode: 'manual' },
      draft: {
        type: 'task',
        col: 1,
        title: 'Draft the creative concept',
        instructions: 'Draft the creative concept for its first-stage review.',
        agent: 'Omni Creative Agent',
      },
      gate1: {
        type: 'human',
        col: 2,
        ask: 'Does creative sign off on this concept?',
        responseType: 'choice',
        options: [
          { id: 'approve', label: 'Approve' },
          { id: 'reject', label: 'Reject' },
        ],
      },
      gate2: {
        type: 'human',
        col: 3,
        row: 0,
        ask: 'Does legal clear this concept for release?',
        responseType: 'choice',
        options: [
          { id: 'approve', label: 'Approve' },
          { id: 'reject', label: 'Reject' },
        ],
      },
      stopStage1: { type: 'stop', col: 3, row: 1 },
      output: { type: 'output', col: 4, row: 0, format: 'Doc', description: 'Concept cleared through both approval stages, ready for production.' },
      stopStage2: { type: 'stop', col: 4, row: 1 },
    },
    edges: [
      ['t', 'draft'],
      ['draft', 'gate1'],
      ['gate1', 'gate2', 'opt-approve'],
      ['gate1', 'stopStage1', 'opt-reject'],
      ['gate2', 'output', 'opt-approve'],
      ['gate2', 'stopStage2', 'opt-reject'],
    ],
  }),

  // Switch on severity; one lane (High -> Hold) ends in a Stop.
  template({
    id: 'crisis-response',
    name: 'Crisis response protocol',
    category: 'Approvals',
    blurb: 'Rate the severity, then route straight to the response the moment calls for.',
    steps: {
      t: { type: 'trigger', col: 0, mode: 'manual' },
      assess: {
        type: 'task',
        col: 1,
        title: 'Assess the situation',
        instructions: 'Assess the situation and rate its severity before routing the response.',
        agent: 'Omni Research Agent',
        attachments: [{ name: 'web_search', kind: 'Tool' }],
      },
      sev: {
        type: 'logic',
        col: 2,
        kind: 'switch',
        options: [
          { id: 'low', label: 'Low' },
          { id: 'medium', label: 'Medium' },
          { id: 'high', label: 'High' },
          { id: 'critical', label: 'Critical' },
        ],
      },
      outLow: { type: 'output', col: 3, row: 0, format: 'Text', description: 'One-line incident log entry — no further action needed.' },
      taskMedium: {
        type: 'task',
        col: 3,
        row: 1,
        title: 'Draft a monitoring note',
        instructions: 'Summarize the issue and flag it for the next standup.',
        agent: 'Omni Media Agent',
      },
      gateHigh: {
        type: 'human',
        col: 3,
        row: 2,
        ask: 'Notify leadership now?',
        responseType: 'choice',
        options: [
          { id: 'notify', label: 'Notify' },
          { id: 'hold', label: 'Hold' },
        ],
      },
      taskCritical: {
        type: 'task',
        col: 3,
        row: 3,
        title: 'Draft the crisis statement',
        instructions: "Write the holding statement: what we know, what we're doing, when we'll update next.",
        agent: 'Omni Creative Agent',
      },
      outMedium: { type: 'output', col: 4, row: 1, format: 'Teams', description: 'Monitoring note posted to the response channel.' },
      outHighNotify: { type: 'output', col: 4, row: 2, format: 'Email', description: 'Leadership alert: what happened, current status, and the next check-in time.' },
      stopHighHold: { type: 'stop', col: 4, row: 3 },
      outCritical: { type: 'output', col: 4, row: 4, format: 'Email', description: 'Crisis statement, cleared for immediate release to stakeholders.' },
    },
    edges: [
      ['t', 'assess'],
      ['assess', 'sev'],
      ['sev', 'outLow', 'case-0'],
      ['sev', 'taskMedium', 'case-1'],
      ['taskMedium', 'outMedium'],
      ['sev', 'gateHigh', 'case-2'],
      ['gateHigh', 'outHighNotify', 'opt-notify'],
      ['gateHigh', 'stopHighHold', 'opt-hold'],
      ['sev', 'taskCritical', 'case-3'],
      ['taskCritical', 'outCritical'],
    ],
  }),

  // Plain approve/deny gate on a budget shift.
  template({
    id: 'budget-change',
    name: 'Budget change request',
    category: 'Approvals',
    blurb: 'Request a budget shift with the pacing numbers attached, approve or deny.',
    steps: {
      t: { type: 'trigger', col: 0, mode: 'manual' },
      pullSpend: {
        type: 'task',
        col: 1,
        title: 'Pull current spend',
        instructions: 'Pull current pacing and spend by market before drafting the request.',
        agent: 'Omni Media Agent',
        attachments: [{ name: 'plan_mcp', kind: 'Tool' }],
      },
      request: {
        type: 'task',
        col: 2,
        title: 'Draft the budget change request',
        instructions: 'Draft the budget change request: amount, market, and the performance case for the shift.',
        agent: 'Omni Media Agent',
      },
      approval: {
        type: 'human',
        col: 3,
        ask: 'Approve the requested budget shift?',
        responseType: 'choice',
        options: [
          { id: 'approve', label: 'Approve' },
          { id: 'deny', label: 'Deny' },
        ],
      },
      outApprove: { type: 'output', col: 4, row: 0, format: 'Spreadsheet', description: 'Updated budget allocation, market by market.' },
      outDeny: { type: 'output', col: 4, row: 1, format: 'Teams', description: 'Budget change denied — note back to the requester with the reason.' },
    },
    edges: [
      ['t', 'pullSpend'],
      ['pullSpend', 'request'],
      ['request', 'approval'],
      ['approval', 'outApprove', 'opt-approve'],
      ['approval', 'outDeny', 'opt-deny'],
    ],
  }),

  // ---------------------------------------------------------------------
  // Data (5)
  // ---------------------------------------------------------------------

  // Scheduled digest, fanning out to two output formats.
  template({
    id: 'weekly-performance',
    name: 'Weekly performance digest',
    category: 'Data',
    blurb: "A scheduled read on the week's numbers, delivered by email and Teams.",
    steps: {
      t: { type: 'trigger', col: 0, mode: 'scheduled', autoStart: true },
      pull: {
        type: 'task',
        col: 1,
        title: 'Pull the week’s performance',
        instructions: "Pull the week's performance across every live channel and flag anything off plan.",
        agent: 'Omni Media Agent',
        repeat: 'schedule',
        attachments: [{ name: 'plan_mcp', kind: 'Tool' }],
      },
      summarize: {
        type: 'task',
        col: 2,
        title: 'Summarize the week',
        instructions: 'Turn the raw numbers into a three-bullet read: what moved, why, and what to watch next week.',
        agent: 'Omni Research Agent',
      },
      outEmail: { type: 'output', col: 3, row: 0, format: 'Email', description: 'Weekly performance digest — three bullets plus the numbers, to the marketing distribution list.' },
      outTeams: { type: 'output', col: 3, row: 1, format: 'Teams', description: 'Same digest posted to the #performance channel for same-day visibility.' },
    },
    edges: [
      ['t', 'pull'],
      ['pull', 'summarize'],
      ['summarize', 'outEmail'],
      ['summarize', 'outTeams'],
    ],
  }),

  // Simple if/else gate; only the anomalous path produces the Teams alert.
  template({
    id: 'anomaly-alert',
    name: 'Anomaly watch → alert',
    category: 'Data',
    blurb: "Scan for anomalies on a schedule, only escalate when something's actually off.",
    steps: {
      t: { type: 'trigger', col: 0, mode: 'scheduled', autoStart: true },
      scan: {
        type: 'task',
        col: 1,
        title: 'Scan for anomalies',
        instructions: 'Scan every live market and channel for performance more than one standard deviation off plan.',
        agent: 'Omni Media Agent',
        attachments: [{ name: 'plan_mcp', kind: 'Tool' }],
      },
      check: { type: 'logic', col: 2, kind: 'if' },
      diagnose: {
        type: 'task',
        col: 3,
        row: 0,
        title: 'Diagnose the anomaly',
        instructions: 'Diagnose the anomaly: which market, which channel, and the likely cause.',
        agent: 'Omni Research Agent',
        attachments: [{ name: 'Market Insights', kind: 'Knowledge base' }],
      },
      stop: { type: 'stop', col: 3, row: 1 },
      output: { type: 'output', col: 4, format: 'Teams', description: 'Anomaly alert posted to the response channel with the diagnosis.' },
    },
    edges: [
      ['t', 'scan'],
      ['scan', 'check'],
      ['check', 'diagnose', 'true'],
      ['diagnose', 'output'],
      ['check', 'stop', 'false'],
    ],
  }),

  // Findings + a human notes pass before either delivery path.
  template({
    id: 'campaign-postmortem',
    name: 'Campaign post-mortem',
    category: 'Data',
    blurb: "Turn flight results into a readout, with a notes pass before it's final.",
    steps: {
      t: { type: 'trigger', col: 0, mode: 'manual' },
      pullResults: {
        type: 'task',
        col: 1,
        title: 'Pull the flight results',
        instructions: 'Pull the full-flight results and line them up against the original plan.',
        agent: 'Omni Research Agent',
        attachments: [
          { name: 'Market Insights', kind: 'Knowledge base' },
          { name: 'Data Analysis', kind: 'Skill' },
        ],
      },
      draftFindings: {
        type: 'task',
        col: 2,
        title: 'Draft the findings',
        instructions: 'Write what actually drove the result, including what underperformed and why.',
        agent: 'Omni Research Agent',
      },
      review: {
        type: 'human',
        col: 3,
        ask: 'Does this read on the result hold up?',
        responseType: 'choice',
        options: [
          { id: 'approve', label: 'Approve' },
          { id: 'notes', label: 'Add notes' },
        ],
      },
      outReadout: { type: 'output', col: 4, row: 0, format: 'Presentation', description: "Post-mortem readout — what worked, what didn't, and what to change next time." },
      outLibrary: { type: 'output', col: 4, row: 1, format: 'Doc', description: 'Learnings library entry, filed by market and channel.' },
      addNotes: {
        type: 'task',
        col: 4,
        row: 2,
        title: 'Fold in review notes',
        instructions: 'Fold in the requested notes without softening the findings.',
        agent: 'Omni Research Agent',
      },
      outNotesDoc: { type: 'output', col: 5, format: 'Doc', description: 'Post-mortem write-up, requested notes folded in.' },
    },
    edges: [
      ['t', 'pullResults'],
      ['pullResults', 'draftFindings'],
      ['draftFindings', 'review'],
      ['review', 'outReadout', 'opt-approve'],
      ['review', 'outLibrary', 'opt-approve'],
      ['review', 'addNotes', 'opt-notes'],
      ['addNotes', 'outNotesDoc'],
    ],
  }),

  // For Each over markets, with a human check before the rollup ships.
  template({
    id: 'market-rollup',
    name: 'Multi-market rollup',
    category: 'Data',
    blurb: "Roll every market's numbers into one comparable view, checked before it goes out.",
    steps: {
      t: { type: 'trigger', col: 0, mode: 'scheduled', autoStart: true },
      foreach: { type: 'logic', col: 1, kind: 'foreach' },
      pullMarket: {
        type: 'task',
        col: 2,
        title: "Pull this market's numbers",
        instructions: 'For the current market, pull spend, delivery, and the top three performing assets.',
        agent: 'Omni Media Agent',
        repeat: 'times',
        attachments: [{ name: 'plan_mcp', kind: 'Tool' }],
      },
      rollup: {
        type: 'task',
        col: 3,
        title: 'Roll up every market',
        instructions: "Roll every market's numbers into one comparable view, flagging the best and worst performer.",
        agent: 'Omni Research Agent',
        attachments: [{ name: 'Market Insights', kind: 'Knowledge base' }],
      },
      review: {
        type: 'human',
        col: 4,
        ask: 'Does the rollup look right before it goes out?',
        responseType: 'choice',
        options: [
          { id: 'right', label: 'Looks right' },
          { id: 'repull', label: 'Needs a re-pull' },
        ],
      },
      outSpreadsheet: { type: 'output', col: 5, row: 0, format: 'Spreadsheet', description: 'Multi-market rollup — one row per market, ranked against plan.' },
      stop: { type: 'stop', col: 5, row: 1 },
    },
    edges: [
      ['t', 'foreach'],
      ['foreach', 'pullMarket'],
      ['pullMarket', 'rollup'],
      ['rollup', 'review'],
      ['review', 'outSpreadsheet', 'opt-right'],
      ['review', 'stop', 'opt-repull'],
    ],
  }),

  // if/else pacing check; the drifting path needs a human approval before it reallocates.
  template({
    id: 'pacing-reallocate',
    name: 'Pacing check → reallocate',
    category: 'Data',
    blurb: "Catch pacing drift early and get budget shifted to what's working.",
    steps: {
      t: { type: 'trigger', col: 0, mode: 'scheduled', autoStart: true },
      pace: {
        type: 'task',
        col: 1,
        title: 'Check pacing against plan',
        instructions: 'Check pacing against plan for every live channel this week.',
        agent: 'Omni Media Agent',
        attachments: [{ name: 'plan_mcp', kind: 'Tool' }],
      },
      onTrack: { type: 'logic', col: 2, kind: 'if' },
      outClear: { type: 'output', col: 3, row: 0, format: 'Teams', description: 'Pacing check clear — no action needed this week.' },
      diagnose: {
        type: 'task',
        col: 3,
        row: 1,
        title: 'Diagnose the pacing gap',
        instructions: 'Diagnose which channels are off pace and by how much.',
        agent: 'Omni Research Agent',
        attachments: [{ name: 'Market Insights', kind: 'Knowledge base' }],
      },
      approve: {
        type: 'human',
        col: 4,
        ask: 'Approve shifting budget to the channels pacing ahead of plan?',
        responseType: 'choice',
        options: [
          { id: 'reallocate', label: 'Reallocate' },
          { id: 'hold', label: 'Hold' },
        ],
      },
      outRealloc: { type: 'output', col: 5, row: 0, format: 'Spreadsheet', description: 'Reallocation plan — channel, delta, and the new weekly cap.' },
      stop: { type: 'stop', col: 5, row: 1 },
    },
    edges: [
      ['t', 'pace'],
      ['pace', 'onTrack'],
      ['onTrack', 'outClear', 'true'],
      ['onTrack', 'diagnose', 'false'],
      ['diagnose', 'approve'],
      ['approve', 'outRealloc', 'opt-reallocate'],
      ['approve', 'stop', 'opt-hold'],
    ],
  }),

  // ---------------------------------------------------------------------
  // Operations (6)
  // ---------------------------------------------------------------------

  // Switch on work type, three lanes to three distinct outputs.
  template({
    id: 'brief-intake',
    name: 'Brief intake → routing',
    category: 'Operations',
    blurb: 'Classify an incoming brief and route it straight to the right team.',
    steps: {
      t: { type: 'trigger', col: 0, mode: 'manual' },
      intake: {
        type: 'task',
        col: 1,
        title: 'Classify the incoming brief',
        instructions: "Read the incoming brief and classify the work it's asking for.",
        agent: 'Omni Research Agent',
      },
      route: {
        type: 'logic',
        col: 2,
        kind: 'switch',
        options: [
          { id: 'creative', label: 'Creative' },
          { id: 'media', label: 'Media' },
          { id: 'research', label: 'Research' },
        ],
      },
      taskCreative: {
        type: 'task',
        col: 3,
        row: 0,
        title: 'Scope the creative request',
        instructions: 'Turn the brief into a creative scope: deliverable, format, and the deadline that matters.',
        agent: 'Omni Creative Agent',
      },
      outMedia: { type: 'output', col: 3, row: 1, format: 'Spreadsheet', description: 'Media brief logged in the flighting tracker, ready for planning.' },
      taskResearch: {
        type: 'task',
        col: 3,
        row: 2,
        title: 'Scope the research ask',
        instructions: 'Turn the brief into a research scope: the question, the method, and the deadline.',
        agent: 'Omni Research Agent',
      },
      outCreative: { type: 'output', col: 4, row: 0, format: 'Doc', description: 'Creative scope, ready to assign.' },
      outResearch: { type: 'output', col: 4, row: 2, format: 'Doc', description: 'Research scope, ready to assign.' },
    },
    edges: [
      ['t', 'intake'],
      ['intake', 'route'],
      ['route', 'taskCreative', 'case-0'],
      ['taskCreative', 'outCreative'],
      ['route', 'outMedia', 'case-1'],
      ['route', 'taskResearch', 'case-2'],
      ['taskResearch', 'outResearch'],
    ],
  }),

  // if/else plus a Wait before the escalation fires.
  template({
    id: 'asset-expiry',
    name: 'Asset expiry sweep',
    category: 'Operations',
    blurb: 'Sweep for lapsing usage rights and escalate before anything goes dark.',
    steps: {
      t: { type: 'trigger', col: 0, mode: 'scheduled', autoStart: true },
      sweep: {
        type: 'task',
        col: 1,
        title: 'Sweep for expiring assets',
        instructions: 'Sweep every live asset for its licence or usage-rights expiry date.',
        agent: 'Omni Media Agent',
        attachments: [{ name: 'plan_mcp', kind: 'Tool' }],
      },
      expiring: { type: 'logic', col: 2, kind: 'if' },
      waitGrace: { type: 'wait', col: 3, row: 0, amount: '48', unit: 'hours' },
      outClear: { type: 'output', col: 3, row: 1, format: 'Teams', description: 'Expiry sweep clear — nothing lapsing in the next 14 days.' },
      outEscalate: { type: 'output', col: 4, format: 'Email', description: "Escalation notice — rights lapse within days and the asset hasn't been renewed." },
    },
    edges: [
      ['t', 'sweep'],
      ['sweep', 'expiring'],
      ['expiring', 'waitGrace', 'true'],
      ['waitGrace', 'outEscalate'],
      ['expiring', 'outClear', 'false'],
    ],
  }),

  // Sequential human gates + a Wait, the longest straight chain of the 15.
  template({
    id: 'market-onboarding',
    name: 'Onboarding a new market',
    category: 'Operations',
    blurb: 'Walk a new market through legal, localization, and media planning in order.',
    steps: {
      t: { type: 'trigger', col: 0, mode: 'manual' },
      scope: {
        type: 'task',
        col: 1,
        title: 'Scope the new market',
        instructions: 'Size the audience opportunity in this market and flag the regulatory basics that shape how we can reach them.',
        agent: 'Omni Audience Agent',
        attachments: [{ name: 'audience_mcp', kind: 'Tool' }],
      },
      legalGate: {
        type: 'human',
        col: 2,
        ask: 'Does legal clear entry into this market?',
        responseType: 'choice',
        options: [
          { id: 'cleared', label: 'Cleared' },
          { id: 'blocked', label: 'Blocked' },
        ],
      },
      stopLegal: { type: 'stop', col: 3, row: 0 },
      localize: {
        type: 'task',
        col: 3,
        row: 1,
        title: 'Localize the brand',
        instructions: "Localize the brand and core assets for this market's language and norms.",
        agent: 'Omni Creative Agent',
        attachments: [{ name: 'Brand Guidelines', kind: 'Knowledge base' }],
      },
      creativeGate: {
        type: 'human',
        col: 4,
        ask: 'Does the localized creative read right for this market?',
        responseType: 'choice',
        options: [
          { id: 'approved', label: 'Approved' },
          { id: 'needschanges', label: 'Needs changes' },
        ],
      },
      reviseLocalize: {
        type: 'task',
        col: 5,
        row: 0,
        title: 'Revise localized assets',
        instructions: "Apply the local reviewer's notes to the localized assets.",
        agent: 'Omni Creative Agent',
      },
      plan: {
        type: 'task',
        col: 5,
        row: 1,
        title: 'Build the media plan',
        instructions: 'Build the media plan for the launch window: channels, budget split, and flight dates.',
        agent: 'Omni Media Agent',
        attachments: [{ name: 'plan_mcp', kind: 'Tool' }],
      },
      outRevised: { type: 'output', col: 6, row: 0, format: 'Doc', description: 'Revised localized assets, ready for a second look.' },
      notifyTeam: { type: 'output', col: 6, row: 1, format: 'Teams', description: 'Media plan posted to the launch pod: channels, budget split, and flight dates.' },
      wait: { type: 'wait', col: 6, row: 2, amount: '14', unit: 'days' },
      launchReady: { type: 'output', col: 7, format: 'Presentation', description: 'Market launch readiness deck — scope, localized creative, media plan, and go date.' },
    },
    edges: [
      ['t', 'scope'],
      ['scope', 'legalGate'],
      ['legalGate', 'stopLegal', 'opt-blocked'],
      ['legalGate', 'localize', 'opt-cleared'],
      ['localize', 'creativeGate'],
      ['creativeGate', 'reviseLocalize', 'opt-needschanges'],
      ['reviseLocalize', 'outRevised'],
      ['creativeGate', 'plan', 'opt-approved'],
      ['plan', 'notifyTeam'],
      ['plan', 'wait'],
      ['wait', 'launchReady'],
    ],
  }),

  // Scheduled + For Each + if/else + try/catch, all four in one chain; three
  // terminal outputs converge into one shared log output.
  //
  // HITL MICRO-CHAT (PLAN.md "## HITL MICRO-CHAT") — Bryan's own scope guard
  // ("i only want to apply it to the always on content engine template to
  // start"): THIS is that one template, and `review` was the first node in
  // the whole app to ever set `responseType: 'chat'`. THE SPLIT (PLAN.md
  // "## THE SPLIT") gave the dialogue half its own node type — `review` is
  // `type: 'checkin'` now, no `responseType` authored at all (CheckinNode.jsx
  // stamps its own internal breadcrumb, never a template concern). Inserted
  // between `draft` and `quality` — every downstream step's `col` shifts by +1 to
  // make room (quality 5->6, assets/revise 6->7, genAsset/fallbackAsset/
  // outRevised 7->8, outAsset/outStock 8->9, logOutput 9->10), and the old
  // single `draft`->`quality` edge splits into `draft`->`review`->`quality`
  // so the chat sits on the SAME spine the quality gate used to feed from
  // directly. No other step's fields change.
  template({
    id: 'always-on-engine',
    name: 'Always-on content engine',
    category: 'Operations',
    blurb: 'A standing content engine that drafts, checks, and sources fallback assets.',
    steps: {
      // RESULTS ON THE BOARD (PLAN.md) — originally the trigger flag that
      // gated the end-of-run results frame to this ONE template. BATCH
      // MATRIX (PLAN.md "## BATCH MATRIX" — "FRAME DEFAULT-ON") removed
      // that gate from state.jsx's spawnResultsFrame: the frame now spawns
      // for every completed run with ≥1 delivered output, every flow, every
      // template. This field is INERT now (nothing reads it — see
      // spawnResultsFrame's own header comment) — left in place rather than
      // deleted since ripping out its buildData passthrough lives in
      // builder.js, out of this seam's file grant; a harmless no-op key on
      // this template's trigger data either way.
      t: { type: 'trigger', col: 0, mode: 'scheduled', autoStart: true, resultsFrame: true },
      pullCalendar: {
        type: 'task',
        col: 1,
        title: 'Pull the content calendar',
        instructions: "Pull this week's content calendar and confirm which slots are still open.",
        agent: 'Omni Media Agent',
        repeat: 'schedule',
        attachments: [{ name: 'plan_mcp', kind: 'Tool' }],
      },
      foreach: { type: 'logic', col: 2, kind: 'foreach' },
      claimSlot: {
        type: 'task',
        col: 3,
        title: 'Claim the next slot',
        instructions: 'Claim the next open slot and confirm its format and channel.',
        agent: 'Omni Media Agent',
      },
      draft: {
        type: 'task',
        col: 4,
        title: 'Draft the post',
        instructions: 'Draft the post for the current slot, matched to its format and channel.',
        agent: 'Omni Creative Agent',
        attachments: [{ name: 'Brand Guidelines', kind: 'Knowledge base' }],
      },
      // HITL MICRO-CHAT — the review node itself; engine.js's own
      // `case 'checkin':` (THE SPLIT) seeds chatLog's opener and chatOptions
      // live at pause — this step just needs to exist as the dialogue type.
      //
      // AGENT-LED CHIPS (PLAN.md "## AGENT-LED CHIPS") — this step used to
      // also author an `options` primary chip row (HITL SPRING-OPEN: "cat,
      // a hat, other" — Ship it as-is / Punch up the headline / Swap the
      // asset), retired along with CheckinNode.jsx's options editor.
      //
      // THE AGENT ASKS (PLAN.md "## THE AGENT ASKS", item 3) — this step's
      // own `ask` ("Review the draft with the agent before it queues.")
      // retires too, and no `chatOpener` is authored here either, so
      // run/engine.js's checkinOpener/checkinSourceText fall to their next
      // tier: the nearest UPSTREAM node's own instructions/title (`draft`,
      // whose instructions contain "Draft the post...") — still surfaces
      // the SAME Ship it as-is / Punch up the headline / Swap the asset
      // trio (and now an on-topic derived opener too, instead of the flat
      // generic default), byte-identical offer, just agent-derived from
      // upstream context instead of the retired ask.
      review: {
        type: 'checkin',
        col: 5,
      },
      quality: { type: 'logic', col: 6, kind: 'if' },
      assets: { type: 'logic', col: 7, row: 0, kind: 'try' },
      revise: {
        type: 'task',
        col: 7,
        row: 1,
        title: 'Revise for brand voice',
        instructions: 'Rewrite the draft to match brand voice before it queues.',
        agent: 'Omni Creative Agent',
      },
      genAsset: {
        type: 'task',
        col: 8,
        row: 0,
        title: 'Generate the supporting asset',
        instructions: 'Generate the supporting image or video for this post.',
        agent: 'Omni Creative Agent',
      },
      fallbackAsset: {
        type: 'task',
        col: 8,
        row: 1,
        title: 'Source a stock alternative',
        instructions: 'Source a licensed stock alternative that fits the post.',
        agent: 'Omni Research Agent',
      },
      outRevised: { type: 'output', col: 8, row: 2, format: 'Doc', description: 'Revised draft, back in the queue for the next pass.' },
      outAsset: { type: 'output', col: 9, row: 0, format: 'Graphic', description: 'Finished asset, sized for its destination channel.' },
      outStock: { type: 'output', col: 9, row: 1, format: 'Doc', description: 'Stock sourcing note — one candidate, licence confirmed.' },
      logOutput: { type: 'output', col: 10, format: 'Teams', description: "Weekly engine log — every slot's asset status, posted to the #content-engine channel." },
    },
    edges: [
      ['t', 'pullCalendar'],
      ['pullCalendar', 'foreach'],
      ['foreach', 'claimSlot'],
      ['claimSlot', 'draft'],
      // HITL MICRO-CHAT — draft->quality splits into draft->review->quality.
      ['draft', 'review'],
      ['review', 'quality'],
      ['quality', 'assets', 'true'],
      ['assets', 'genAsset', 'try'],
      ['genAsset', 'outAsset'],
      ['assets', 'fallbackAsset', 'catch'],
      ['fallbackAsset', 'outStock'],
      ['quality', 'revise', 'false'],
      ['revise', 'outRevised'],
      ['outAsset', 'logOutput'],
      ['outStock', 'logOutput'],
      ['outRevised', 'logOutput'],
    ],
  }),

  // 3-option human choice: accept / revise / reject-to-Stop.
  template({
    id: 'vendor-qa',
    name: 'Vendor deliverable QA',
    category: 'Operations',
    blurb: 'Accept, revise, or reject a vendor deliverable against the original brief.',
    steps: {
      t: { type: 'trigger', col: 0, mode: 'manual' },
      intake: {
        type: 'task',
        col: 1,
        title: 'Log the deliverable',
        instructions: 'Log the vendor deliverable against the brief it was scoped against.',
        agent: 'Omni Research Agent',
      },
      review: {
        type: 'human',
        col: 2,
        ask: 'How does this deliverable hold up against the brief?',
        responseType: 'choice',
        options: [
          { id: 'accept', label: 'Accept' },
          { id: 'revise', label: 'Revise' },
          { id: 'reject', label: 'Reject' },
        ],
      },
      outAccept: { type: 'output', col: 3, row: 0, format: 'Doc', description: 'Deliverable accepted — filed against the original brief.' },
      reviseTask: {
        type: 'task',
        col: 3,
        row: 1,
        title: 'Write revision notes',
        instructions: "Write the revision notes back to the vendor: what's missing and what needs to change.",
        agent: 'Omni Research Agent',
      },
      stop: { type: 'stop', col: 3, row: 2 },
      outRevise: { type: 'output', col: 4, format: 'Email', description: 'Revision request sent to the vendor with the specific notes.' },
    },
    edges: [
      ['t', 'intake'],
      ['intake', 'review'],
      ['review', 'outAccept', 'opt-accept'],
      ['review', 'reviseTask', 'opt-revise'],
      ['reviseTask', 'outRevise'],
      ['review', 'stop', 'opt-reject'],
    ],
  }),

  // Try/catch technical check, pass or a fix list.
  template({
    id: 'channel-launch-check',
    name: 'Pre-launch channel check',
    category: 'Operations',
    blurb: 'Run the pre-launch technical check, with a fix list ready if it fails.',
    steps: {
      t: { type: 'trigger', col: 0, mode: 'manual' },
      prep: {
        type: 'task',
        col: 1,
        title: 'Assemble launch settings',
        instructions: "Assemble every channel's launch settings for the technical check.",
        agent: 'Omni Media Agent',
        attachments: [{ name: 'plan_mcp', kind: 'Tool' }],
      },
      check: { type: 'logic', col: 2, kind: 'try' },
      outPass: { type: 'output', col: 3, row: 0, format: 'Doc', description: 'Pre-launch check passed — every channel cleared for the go-live.' },
      fix: {
        type: 'task',
        col: 3,
        row: 1,
        title: 'List the required fixes',
        instructions: 'List every failed check and the fix each one needs before the next attempt.',
        agent: 'Omni Media Agent',
      },
      outFail: { type: 'output', col: 4, format: 'Email', description: 'Pre-launch check failed — fixes required before the next attempt.' },
    },
    edges: [
      ['t', 'prep'],
      ['prep', 'check'],
      ['check', 'outPass', 'try'],
      ['check', 'fix', 'catch'],
      ['fix', 'outFail'],
    ],
  }),
]
