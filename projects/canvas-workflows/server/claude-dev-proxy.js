// RUN PHASE — R3 "Generation layer: mock + REAL"
//
// Dev-only Vite plugin. Adds two middleware routes to the Vite dev server:
//   GET  /__claude/health  -> { ok: boolean }              (cheap, cached)
//   POST /__claude         -> { text } | 503 { error }     (shells the CLI)
//
// This is the ONLY file that touches a child process. It shells Bryan's
// local `claude` CLI via execFile with an ARGS ARRAY — never a shell string
// — so nothing in `system`/`prompt` (including anything echoed back from an
// upstream node's output, which is untrusted-ish content by the time it
// reaches here) can break out into shell syntax. There is no shell in this
// path at all.
//
// THIS NEVER SHIPS: `configureServer` is a dev-server-only Vite plugin hook.
// `vite build` never calls it, so a production bundle has no `/__claude`
// endpoint at all — the client's health probe 404s there and generate.js
// falls back to demo mode on any deploy, automatically, with no flag to
// remember to flip.
//
// Flags actually used below were verified against THIS machine's installed
// CLI via `claude --help` + a live smoke test (see PLAN.md R3) before being
// wired in — in particular `--max-turns` does NOT exist on this CLI version
// (checked, absent from --help), so cost/turn-capping instead comes from
// `--tools ""` (real, disables all built-in tools — "Use \"\" to disable
// all tools" per --help) + `--strict-mcp-config` (real, and since we never
// pass --mcp-config this yields zero MCP servers too — otherwise every
// generation call would try to boot this workspace's entire MCP roster
// before producing a token). Together those leave nothing for the model to
// call, so "one call per node run" is structural, not just a convention.
// `--system-prompt` (not --append-system-prompt) REPLACES Claude Code's
// default system-prompt construction rather than layering onto it — per
// --help, `--exclude-dynamic-system-prompt-sections` "only applies with the
// default system prompt (ignored with --system-prompt)" — so this project's
// own CLAUDE.md never bleeds into a generation call. `--bare` was
// considered and rejected: its own --help text says it forces
// ANTHROPIC_API_KEY/apiKeyHelper auth and never reads OAuth/keychain, which
// would break Bryan's "zero API keys" local CLI auth entirely.

import { execFile } from 'node:child_process'

const CLAUDE_BIN = 'claude' // resolved via PATH, same as a human typing it
const GENERATE_TIMEOUT_MS = 90_000 // PLAN.md R3.2
const HEALTH_TIMEOUT_MS = 5_000 // `--version` is local/instant; this just bounds a wedged spawn
const MAX_BODY_BYTES = 128 * 1024 // generous envelope around two capped fields + JSON overhead
const MAX_ARG_BYTES = 32 * 1024 // "32KB stdin-safe prompt via arg" (PLAN.md R3.2), applied to system + prompt independently

// ---------------------------------------------------------------------------
// Byte-safe cap. `str.length` counts UTF-16 code units, not bytes, and the
// safety property we actually care about is "small enough to be a safe argv
// entry" — so measure/cut in UTF-8 bytes. A cut can land mid-codepoint at the
// boundary; for a length-capped LLM prompt that's a cosmetic edge case, not a
// correctness one (worst case one trailing char renders oddly).
// ---------------------------------------------------------------------------
function capBytes(str, maxBytes) {
  const buf = Buffer.from(str, 'utf8')
  if (buf.length <= maxBytes) return str
  return buf.subarray(0, maxBytes).toString('utf8')
}

function readJsonBody(req, maxBytes = MAX_BODY_BYTES) {
  return new Promise((resolve, reject) => {
    let data = ''
    let bytes = 0
    req.on('data', (chunk) => {
      bytes += chunk.length
      if (bytes > maxBytes) {
        reject(new Error('request body too large'))
        req.destroy()
        return
      }
      data += chunk
    })
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {})
      } catch (err) {
        reject(err)
      }
    })
    req.on('error', reject)
  })
}

function sendJson(res, status, body) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

// Creates the `claude` plugin's plugin-local state (the health cache) fresh
// per plugin instance, so two separate vite.config.js setups (e.g. build vs
// dev, or a test harness) never share a cache across processes by accident.
export function claudeDevProxy() {
  // Memoized after the FIRST probe, for the lifetime of this dev-server
  // process — "health checks `claude --version` once and caches" (PLAN.md
  // R3.2). A restart (the only way this plugin activates anyway, per the
  // standing rule) gets a fresh check.
  let healthPromise = null

  function checkHealth() {
    if (!healthPromise) {
      healthPromise = new Promise((resolve) => {
        const child = execFile(CLAUDE_BIN, ['--version'], { timeout: HEALTH_TIMEOUT_MS }, (err) => {
          if (err) {
            console.info(
              '[claude-dev-proxy] `claude` CLI not reachable — real generation stays off, demo mode only:',
              err.message,
            )
          }
          resolve(!err)
        })
        closeChildStdin(child)
      })
    }
    return healthPromise
  }

  return {
    name: 'claude-dev-proxy',
    configureServer(server) {
      // Registered BEFORE the broader '/__claude' route below: Vite's
      // middleware stack (connect) matches by path PREFIX, so
      // '/__claude/health' would otherwise also satisfy a '/__claude'
      // matcher registered first. Order here is load-bearing. Each handler
      // also double-checks method + exact path itself and calls next() on a
      // mismatch, so a future reorder fails safe instead of silently
      // misrouting.
      server.middlewares.use('/__claude/health', async (req, res, next) => {
        if (req.method !== 'GET') return next()
        const ok = await checkHealth()
        sendJson(res, ok ? 200 : 503, { ok })
      })

      server.middlewares.use('/__claude', async (req, res, next) => {
        if (req.method !== 'POST') return next()
        if (req.url && req.url !== '/' && req.url !== '') return next() // e.g. a stray '/__claude/foo'

        const ok = await checkHealth()
        if (!ok) {
          sendJson(res, 503, { error: 'claude CLI unavailable' })
          return
        }

        let body
        try {
          body = await readJsonBody(req)
        } catch (err) {
          sendJson(res, 400, { error: `invalid request body: ${err.message}` })
          return
        }

        const system = capBytes(String(body?.system || ''), MAX_ARG_BYTES)
        const prompt = capBytes(String(body?.prompt || ''), MAX_ARG_BYTES)
        if (!prompt.trim()) {
          sendJson(res, 400, { error: 'missing prompt' })
          return
        }

        // Args array only — execFile never spawns a shell, so nothing in
        // `system`/`prompt` is interpreted as shell syntax no matter what
        // it contains.
        const args = ['-p', prompt]
        if (system.trim()) args.push('--system-prompt', system)
        args.push(
          '--model', 'sonnet',
          '--output-format', 'text',
          '--tools', '', // real flag — "Use \"\" to disable all tools" (--help)
          '--strict-mcp-config', // no --mcp-config passed alongside -> zero MCP servers loaded
          '--no-session-persistence', // one-shot generation call; nothing worth resuming
        )

        const child = execFile(
          CLAUDE_BIN,
          args,
          { timeout: GENERATE_TIMEOUT_MS, maxBuffer: 10 * 1024 * 1024 },
          (err, stdout) => {
            if (err) {
              // Covers: CLI absent, timeout, non-zero exit (including an
              // expired/missing OAuth session — verified live on this
              // machine while building this file). Any of these is exactly
              // the "Errors/absent CLI -> 503" case; the client falls back
              // to demo mode silently and logs one console.info.
              console.info('[claude-dev-proxy] generation call failed, client will fall back to demo mode:', err.message)
              sendJson(res, 503, { error: 'generation failed' })
              return
            }
            sendJson(res, 200, { text: stdout.trim() })
          },
        )
        closeChildStdin(child)
      })
    },
  }
}

// The prompt travels entirely via argv — nothing is ever piped in — but
// execFile's `stdio` OPTION does not reliably close the child's stdin (that
// override was tried and measured to have no effect: a child spawned this
// way still blocked on stdin until execFile's own `timeout` killed it).
// Explicitly ending the ChildProcess's own `.stdin` stream immediately after
// spawn is what actually works — confirmed live, this drops each call's
// dead time from ~3-4s (the CLI sniffing for piped input that will never
// arrive) to near-zero.
function closeChildStdin(child) {
  child.stdin?.end()
}
