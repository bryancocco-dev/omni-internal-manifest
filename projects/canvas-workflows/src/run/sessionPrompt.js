// FQ-C item 2 (PLAN.md "## FINAL QUEUE" -> "### FQ-C — OPEN ASKS") —
// "Copy prompt" composes the session prompt "from the graph the same way
// the panel's counts are derived: agents, KBs, tools, skills, params,
// models, plus each task's instructions in run order, as readable plain
// text." The five roster lines below are literally CompiledPanel.jsx's own
// SUBAGENTS/KNOWLEDGE BASES/TOOLS/SKILLS/MODELS/PARAMETERS sections restated
// as text — same `counts` object (state.jsx's computeCompiledCounts), no
// re-derivation, so this can never drift from what the panel already shows.
// FILES is deliberately left out (an attachment roster, not prompt
// material — the spec's own list never names it) and Generate nodes' own
// `prompt` field is deliberately left out too (the spec says "each TASK's
// instructions", not every node that carries a prompt-shaped field).
//
// New file — a sibling to engine.js/download.js/etc., not an edit to any of
// them (engine.js is a different dispatch's seam this run).
//
// `nodes` is expected to be state.jsx's `numberedNodes` (what useFlowState()
// exposes as `nodes`) — already stamped with `data.seq` (BFS rank from every
// trigger, "the order a run would actually reach them" per state.jsx's own
// renumber() header comment) and `data.number` (the same 1-based label the
// task's own card wears). Sorting by `seq` here reproduces run order without
// re-implementing state.jsx's BFS a second time; reading `number` for the
// label keeps the prompt's task headers pointing at the exact same number
// you'd find by looking at the canvas.

import { headlineCase } from '../nodes/shared.jsx'

function rosterLine(label, items) {
  return `${label}: ${items && items.length ? items.join(', ') : '—'}`
}

function parametersBlock(params) {
  if (!params || !params.length) return 'Parameters: —'
  return `Parameters:\n${params.map((p) => `- ${p}`).join('\n')}`
}

function taskEntry(node) {
  const title = headlineCase(node.data?.title || 'Task / Action')
  const label = Number.isFinite(node.data?.number) ? `Task ${node.data.number}` : 'Task'
  const agent = node.data?.agent ? `Agent: ${node.data.agent}` : 'Agent: none assigned'
  const instructions = (node.data?.instructions || '').trim() || 'No instructions set.'
  return `${label} — ${title} (${agent})\n${instructions}`
}

// Pure: no clipboard/DOM access here (CompiledPanel.jsx owns the
// navigator.clipboard.writeText call + the Copied-state timer) — this
// function only ever turns (nodes, counts) into the text.
export function composeSessionPrompt(nodes, counts) {
  const tasks = (nodes || [])
    .filter((n) => n.type === 'task')
    .slice()
    .sort((a, b) => (a.data?.seq ?? 0) - (b.data?.seq ?? 0))

  return [
    'SESSION PROMPT',
    '',
    rosterLine('Subagents', counts.subagents),
    rosterLine('Knowledge bases', counts.knowledgeBases),
    rosterLine('Tools', counts.tools),
    rosterLine('Skills', counts.skills),
    rosterLine('Models', counts.models),
    parametersBlock(counts.params),
    '',
    'TASKS (run order)',
    '',
    tasks.length ? tasks.map(taskEntry).join('\n\n') : 'No tasks in this workflow.',
  ].join('\n')
}
