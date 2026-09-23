// RUN PHASE — R3 "Generation layer: mock + REAL"
//
// The run engine's only doorway into "what does this node produce". Two
// exports, per PLAN.md R3.1:
//   generate(req)      — async generator, yields TEXT CHUNKS (callers stream
//                         them into `data.output.content` as they arrive).
//   generationMode()   — 'real' | 'demo', a snapshot of which path is live.
//
// `req` shape (the runner's call sites, PLAN.md "Graph run schema"):
//   { kind: 'task' | 'output', node, upstream? }
// `node` is the full React Flow node object (so its `.data` — instructions/
// agent/ask/description/format — is available). `upstream` is whatever
// upstream context the runner has on hand when it calls this; this module
// stays deliberately loose about its exact shape (an upstream NODE, an array
// of them, an already-extracted output object, or a plain string all work —
// see `extractUpstreamTexts` below) since engine.js (R1, not this seam)
// mints the actual call sites and nothing else here depends on one specific
// shape. Whatever is readable, this reads `.data.output.content` off each
// item (the run schema's `output: { format, content } | null`) and falls
// back to that item's own brief if it hasn't produced output yet.
//
// Mode selection: on module load, probe GET /__claude/health once (200 =
// real available) and cache the result — `generate()` awaits that same
// probe before its first real/demo branch, so even a call that lands before
// the probe resolves still gets a correct answer instead of racing it. A
// production build never has this endpoint (the dev-only proxy in
// server/claude-dev-proxy.js only registers under `vite dev`), so the probe
// 404s and every deploy is demo-only automatically.
//
// REAL mode POSTs { system, prompt } to /__claude and re-chunks the single
// `{ text }` response into word-cadence pieces client-side (~30ms/chunk) —
// the proxy itself is not streaming, this is purely for the same "typing
// out" feel demo mode has. Any failure (non-200, network error, empty text)
// falls back to DEMO mode for that call only and logs one console.info —
// it does not permanently downgrade `generationMode()`, since a slow/odd
// single call shouldn't quietly disable real mode for the rest of the
// session.
//
// DEMO mode never leaves the browser: small format-aware template
// generators grounded in the node's own instructions/agent/ask/description
// (+ upstream text, when present) so the fake copy reads as if it came from
// the agent actually named on the card, not a generic placeholder. Light
// Math.random() variation keeps repeated runs from feeling canned.
//
// `parseMarkdownTable` is exported for R2's RunPreview modal: PLAN.md R3.1
// specifically calls out that a Spreadsheet output's markdown table is
// "which generate.js parses to cells" — both real and demo Spreadsheet
// content are plain markdown-table text (one shared representation), and
// this is the one place that knows how to turn that into { headers, rows }
// for an actual <table>.
//
// FINAL QUEUE — FQ-A "REAL ADAPTERS (local-only truth)" (PLAN.md
// "### FQ-A"). This is now adapters.claudeLocal, gated by the SAME REAL_MODE
// flag adapters.pollinations (src/run/pollinations.js) uses: the probe below
// is only even ATTEMPTED when REAL_MODE is true (dev build AND `?real=1`) —
// never on a production build (an unconditional probe there would still 404
// SAFELY, same as always, but that 404 is still a network REQUEST, which
// fails this queue item's own "assert zero requests to pollinations/claude
// paths" proof against the built dist), and never in an ordinary dev session
// either, so running `npm run dev` with the local `claude` CLI authenticated
// stays byte-identical to today's deterministic/seeded build unless someone
// deliberately opts in with `?real=1`. REAL_TIMEOUT_MS also drops from the
// proxy's own ~90s backstop to PLAN.md's own "20s text" graceful-fallback
// window — a live demo should never sit that long before silently
// recovering to a demo-mode result.
import { REAL_MODE } from '../run/realMode.js'

const HEALTH_URL = '/__claude/health'
const GENERATE_URL = '/__claude'
const HEALTH_TIMEOUT_MS = 4000 // localhost + cached server-side; anything slower means "not there"
const REAL_TIMEOUT_MS = 20000 // PLAN.md FQ-A: "any error/timeout (... 20s text)" graceful-fallback window
const REAL_CHUNK_MS = 30 // PLAN.md R3.1 "~30ms cadence"
const DEMO_TOTAL_MS = [600, 1400] // PLAN.md R3.1 "600–1400ms total"
const MAX_SYSTEM_CHARS = 6000 // generous local guard; the proxy applies the authoritative 32KB byte cap per field
const MAX_UPSTREAM_ITEM_CHARS = 600

async function fetchWithTimeout(url, options, timeoutMs) {
  if (typeof fetch !== 'function') throw new Error('fetch unavailable')
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

function probeHealth() {
  return fetchWithTimeout(HEALTH_URL, { method: 'GET' }, HEALTH_TIMEOUT_MS)
    .then(async (res) => {
      // Status alone is a trap: Vite dev (pre-plugin) AND any static deploy
      // answer unknown GETs with the SPA fallback — 200 + index.html — which
      // would flip us to "real" against a server that has no proxy at all.
      // Demand the proxy's actual JSON contract ({ ok: true }).
      if (!res.ok) return 'demo'
      if (!(res.headers.get('content-type') || '').includes('application/json')) return 'demo'
      const body = await res.json().catch(() => null)
      return body && body.ok === true ? 'real' : 'demo'
    })
    .catch(() => 'demo')
}

let mode = 'demo'
// Kicked off once at module evaluation ("on module load, probe..." — PLAN.md
// R3.1). Guarded for non-browser evaluation (e.g. a node-side import in a
// test/build tool) so this file never throws just from being imported.
//
// FINAL QUEUE — FQ-A — ALSO guarded on REAL_MODE now (see this file's header
// comment on the const above): without `?real=1` in a dev build, or in any
// production build, this resolves straight to 'demo' with zero fetch ever
// attempted — the probe only fires once someone has explicitly opted in.
const readyPromise =
  typeof window !== 'undefined' && REAL_MODE
    ? probeHealth().then((m) => {
        mode = m
        return m
      })
    : Promise.resolve('demo')

export function generationMode() {
  return mode
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Splits on whitespace but keeps each match's trailing whitespace attached,
// so joining every yielded chunk back together reconstructs the original
// text exactly — callers just append chunk-by-chunk into `data.output.content`.
function splitWords(text) {
  if (!text) return []
  return text.match(/\S+\s*/g) || [text]
}

async function* streamFixedCadence(text, chunkMs = REAL_CHUNK_MS) {
  for (const part of splitWords(text)) {
    yield part
    if (chunkMs > 0) await sleep(chunkMs)
  }
}

async function* streamDemoCadence(text) {
  const parts = splitWords(text)
  if (!parts.length) return
  const [min, max] = DEMO_TOTAL_MS
  const targetTotal = min + Math.random() * (max - min)
  // Per-word delay clamped to a natural typing feel (12-90ms/word) — but for
  // very short strings (a couple of words), even 90ms/word can't reach the
  // 600ms floor on its own (measured live: a 2-word demo line streamed in
  // ~180ms without this). A trailing wait-out-the-remainder makes the floor
  // hold regardless of text length; the ceiling stays a soft target only —
  // a long artifact is allowed to take a bit over 1400ms, that still reads
  // as normal "generation" pacing.
  const perChunk = clamp(targetTotal / parts.length, 12, 90)
  const start = Date.now()
  for (const part of parts) {
    yield part
    await sleep(perChunk)
  }
  const remaining = targetTotal - (Date.now() - start)
  if (remaining > 0) await sleep(remaining)
}

function clamp(n, lo, hi) {
  return Math.min(Math.max(n, lo), hi)
}

function truncate(s, n) {
  const str = String(s ?? '')
  return str.length > n ? `${str.slice(0, n - 1).trimEnd()}…` : str
}

function firstLine(text) {
  return String(text ?? '')
    .split('\n')
    .find((l) => l.trim()) || ''
}

// ---------------------------------------------------------------------------
// Upstream context — shared by real-mode prompt assembly and demo templates.
// See the file header for the accepted shapes.
// ---------------------------------------------------------------------------
function extractUpstreamTexts(upstream) {
  if (!upstream) return []
  const list = Array.isArray(upstream) ? upstream : [upstream]
  return list
    .map((item) => {
      if (!item) return ''
      if (typeof item === 'string') return item.trim()
      const out = item.data?.output ?? item.output
      const content = typeof out === 'string' ? out : out?.content
      if (content) return String(content).trim()
      // Upstream node hasn't produced output yet — fall back to its own
      // brief so context is never just silently empty mid-run.
      return String(item.data?.instructions || item.data?.description || item.data?.ask || '').trim()
    })
    .filter(Boolean)
}

function upstreamContextBlock(upstream) {
  return extractUpstreamTexts(upstream)
    .map((t) => truncate(t, MAX_UPSTREAM_ITEM_CHARS))
    .join('\n---\n')
}

function upstreamSummary(upstream) {
  const texts = extractUpstreamTexts(upstream)
  if (!texts.length) return ''
  return truncate(firstLine(texts[texts.length - 1]), 90)
}

// ===========================================================================
// REAL mode
// ===========================================================================
const DEFAULT_WORD_CAP = 180

function formatDirective(req) {
  if (req.kind !== 'output') {
    return `Keep the result under ${DEFAULT_WORD_CAP} words. Plain text only — no headers, no preamble, no markdown fences.`
  }
  switch (req.node?.data?.format) {
    case 'Presentation':
      return 'Produce exactly 5 lines, one per slide, each formatted as "N. Slide Title — one-line description." Nothing else.'
    case 'Spreadsheet':
      return `Produce ONLY a small markdown table (max 6 rows including the header, max 4 columns) — no prose before or after it.`
    case 'Email':
      return `Produce an email: a "Subject: " line, then a blank line, then the body. Keep the body under ${DEFAULT_WORD_CAP} words.`
    default:
      return `Keep the result under ${DEFAULT_WORD_CAP} words. Plain text only — no headers, no preamble, no markdown fences.`
  }
}

function buildPrompt(req) {
  const node = req.node || {}
  const data = node.data || {}
  const agent = data.agent || (req.kind === 'output' ? 'the OMNI workflow' : 'an AI agent')
  const brief = String(data.instructions || data.description || data.ask || '').trim()
  const upstreamBlock = upstreamContextBlock(req.upstream)

  const systemParts = [
    `You are ${agent} inside an OMNI workflow builder demo. Produce ONLY the artifact — no preamble, no explanation, no markdown code fences around it.`,
  ]
  if (brief) systemParts.push(`Instructions for this step: ${brief}`)
  if (upstreamBlock) systemParts.push(`Context carried from earlier steps:\n${upstreamBlock}`)
  systemParts.push(formatDirective(req))

  const system = truncate(systemParts.join('\n\n'), MAX_SYSTEM_CHARS)
  const prompt = req.kind === 'output' ? `Generate the ${data.format || 'Text'} artifact now.` : 'Produce the result now.'
  return { system, prompt }
}

async function* generateReal(req) {
  const { system, prompt } = buildPrompt(req)
  const res = await fetchWithTimeout(
    GENERATE_URL,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ system, prompt }),
    },
    REAL_TIMEOUT_MS,
  )
  if (!res.ok) throw new Error(`/__claude responded ${res.status}`)
  const data = await res.json()
  const text = String(data?.text || '').trim()
  if (!text) throw new Error('empty response')
  yield* streamFixedCadence(text)
}

// ===========================================================================
// DEMO mode — plausible marketing-flavored copy, grounded in the node's own
// fields + upstream text. Kept intentionally light: a handful of phrase
// banks plus format-aware assembly, not a full template engine.
// ===========================================================================
const AUDIENCE_SEGMENTS = [
  'Eco-conscious commuters',
  'Urban young professionals',
  'Growing families',
  'Weekend adventurers',
  'Luxury-minded upgraders',
  'Tech-forward early adopters',
  'Budget-savvy first-time buyers',
  'Loyal repeat customers',
]
const ANGLES = [
  'built for the way you actually drive',
  'more range, less range anxiety',
  'the smarter way to lease',
  'designed around your commute',
  'your next upgrade, without the wait',
  'proof this brand gets it',
]
const CTAS = ['See the offer', 'Book a test drive', 'Explore trims', 'Get pre-qualified', 'Talk to a specialist']
const SLIDE_TITLES = ['The Opportunity', 'The Audience', 'The Message', 'The Plan', 'What Success Looks Like']

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function shuffle(arr) {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function randInt(min, max) {
  return Math.floor(min + Math.random() * (max - min + 1))
}

function randPct() {
  return randInt(58, 94)
}

function cap(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s
}

function demoTask(req) {
  const { node, upstream } = req
  const agent = node?.data?.agent
  const brief = String(node?.data?.instructions || '').trim()
  const ctx = upstreamSummary(upstream)

  if (agent === 'Omni Audience Agent') {
    const picks = shuffle(AUDIENCE_SEGMENTS).slice(0, 4)
    return [
      brief ? `Audience scan complete for: "${brief}".` : 'Audience scan complete.',
      '',
      ...picks.map((seg, i) => `${i + 1}. ${seg} — ${randPct()}% match, ${randInt(8, 42)}K reachable.`),
    ].join('\n')
  }
  if (agent === 'Omni Research Agent') {
    return [
      brief ? `Research pass on "${brief}":` : 'Research pass complete:',
      `- Category search volume up ${randPct()}% quarter-over-quarter.`,
      `- Top competitor messaging leans on "${pick(ANGLES)}".`,
      `- Sentiment skews positive (${randInt(60, 88)}/100) across recent mentions.`,
      ctx ? `- Builds on: ${ctx}` : null,
    ]
      .filter(Boolean)
      .join('\n')
  }
  if (agent === 'Omni Creative Agent') {
    return [
      brief ? `Creative options for "${brief}":` : 'Creative options:',
      ...shuffle(ANGLES)
        .slice(0, 3)
        .map((a, i) => `${i + 1}. "${cap(a)}" — headline angle.`),
    ].join('\n')
  }
  if (agent === 'Omni Media Agent') {
    return [
      brief ? `Media plan for "${brief}":` : 'Media plan:',
      `- Paid social: ${randPct()}% of budget, ${pick(AUDIENCE_SEGMENTS)} priority.`,
      '- Search: always-on, brand + competitor terms.',
      '- CTV: flighted around key dates.',
    ].join('\n')
  }
  return brief
    ? `Done: ${brief}${ctx ? ` (building on ${ctx})` : ''}.`
    : 'Task complete — no instructions were given, so this is a placeholder result.'
}

function shortSlideLine(i, desc, seg, angle, ctx) {
  const options = [
    desc || 'Where the growth is.',
    `Meet ${seg}.`,
    `${cap(angle)}.`,
    'Media, creative, and timing — aligned.',
    ctx ? `Grounded in: ${ctx}` : 'Ready to launch.',
  ]
  return options[i % options.length]
}

function demoOutput(req) {
  const { node, upstream } = req
  const format = node?.data?.format || 'Text'
  const desc = String(node?.data?.description || '').trim()
  const ctx = upstreamSummary(upstream)
  const seg = pick(AUDIENCE_SEGMENTS)
  const angle = pick(ANGLES)

  switch (format) {
    case 'Email':
      return [
        `Subject: ${cap(angle)} — built for ${seg.toLowerCase()}`,
        '',
        'Hi there,',
        '',
        desc || `Here's what's new: ${angle}.`,
        ctx ? `\n${ctx}` : '',
        '',
        `${pick(CTAS)} →`,
      ]
        .filter((l) => l !== '')
        .join('\n')
    case 'Teams':
      return `**Draft ready** — ${desc || angle}.${ctx ? ` Referencing: ${ctx}.` : ''} Thoughts before this goes out?`
    case 'Presentation':
      return SLIDE_TITLES.map((t, i) => `${i + 1}. ${t} — ${shortSlideLine(i, desc, seg, angle, ctx)}`).join('\n')
    case 'Spreadsheet': {
      const rows = shuffle(AUDIENCE_SEGMENTS).slice(0, 4)
      return ['| Segment | Reach | Match |', '| --- | --- | --- |', ...rows.map((r) => `| ${r} | ${randInt(8, 60)}K | ${randPct()}% |`)].join(
        '\n',
      )
    }
    case 'Doc':
      return [`# ${cap(desc || angle)}`, '', ctx ? `${ctx}\n` : '', `${cap(angle)}. Positioned for ${seg.toLowerCase()}, this draft leads with the offer and closes with a clear next step.`, '', `${pick(CTAS)}.`]
        .filter((l) => l !== undefined)
        .join('\n')
    case 'Graphic':
      return `[Graphic concept] "${desc || angle}" — hero shot, ${seg.toLowerCase()} in frame, bold headline overlay, single CTA badge.`
    case 'Video':
      return `[Video concept] 15s cutdown. Open on ${seg.toLowerCase()}, VO: "${cap(angle)}." Close on logo + ${pick(CTAS).toLowerCase()}.`
    case 'Audio':
      return `[Audio concept] :30 spot. VO angle: "${cap(angle)}." Tag: ${pick(CTAS)}.`
    case 'Templated Output':
      return `Template filled: {{headline}} → "${cap(angle)}"; {{audience}} → "${seg}"; {{cta}} → "${pick(CTAS)}".`
    case 'Text':
    default:
      return desc ? `${cap(desc)}\n\n${cap(angle)} — ${pick(CTAS).toLowerCase()}.` : `${cap(angle)}. Made for ${seg.toLowerCase()}. ${pick(CTAS)}.`
  }
}

async function* generateDemo(req) {
  const text = req.kind === 'output' ? demoOutput(req) : demoTask(req)
  yield* streamDemoCadence(text)
}

// ===========================================================================
// Public entry point
// ===========================================================================
export async function* generate(req) {
  const currentMode = await readyPromise
  if (currentMode === 'real') {
    try {
      yield* generateReal(req)
      return
    } catch (err) {
      // Per-call fallback only — does not flip generationMode() for the rest
      // of the session (PLAN.md R3.2: "client falls back to demo silently,
      // logs one console.info").
      console.info('[canvas-workflows] real generation unavailable for this call, using demo output:', err?.message || err)
    }
  }
  yield* generateDemo(req)
}

// ---------------------------------------------------------------------------
// Spreadsheet helper for R2's RunPreview (PLAN.md R3.1: "spreadsheet = small
// markdown table which generate.js parses to cells"). Both real and demo
// Spreadsheet output are plain markdown-table text; this turns that text
// into { headers, rows } for an actual <table>. Tolerant of a leading
// separator-less table and stray blank lines; returns { headers: [], rows: [] }
// for anything that isn't table-shaped.
// ---------------------------------------------------------------------------
export function parseMarkdownTable(text) {
  const lines = String(text ?? '')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.startsWith('|'))
  if (!lines.length) return { headers: [], rows: [] }

  const toCells = (line) =>
    line
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map((c) => c.trim())

  const isSeparatorRow = (line) => /^\|?[\s:|-]+\|?$/.test(line) && line.includes('-')

  const [headerLine, ...rest] = lines
  const headers = toCells(headerLine)
  const rows = rest.filter((l) => !isSeparatorRow(l)).map(toCells)
  return { headers, rows }
}
