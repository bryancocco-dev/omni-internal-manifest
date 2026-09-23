// FINAL QUEUE — FQ-A "REAL ADAPTERS (local-only truth)" (PLAN.md
// "### FQ-A"). "Gating (non-negotiable): a REAL_MODE flag that is false
// unless BOTH (a) import.meta.env.DEV and (b) ?real=1 in the URL." ONE flag,
// computed once, gates BOTH real providers this queue item adds:
//   - adapters.pollinations (src/run/pollinations.js), called from
//     src/run/engine.js's runImageAdapter.
//   - adapters.claudeLocal (gen/generate.js's existing probe-then-real
//     text path) — that file imports this SAME flag to gate whether it even
//     ATTEMPTS the /__claude/health probe at module load.
//
// Why gate the ALREADY-EXISTING claude-local path too, not just the new
// pollinations one: gen/generate.js's health probe used to fire
// unconditionally on import, in ANY environment — a production deploy 404s
// harmlessly (server/claude-dev-proxy.js's configureServer hook never runs
// outside `vite dev`), but "harmlessly" still means a network REQUEST left
// the page on every load, which fails this queue item's own zero-network
// production proof (CDP Network domain asserting ZERO requests to
// pollinations/claude paths — a 404 still shows up there). And in DEV
// without this flag, a demo running on a machine where the `claude` CLI
// happens to be authenticated would ALREADY get real text generation with
// no explicit ask — surprising, non-reproducible behavior for a client demo
// whose whole point is a deterministic, seeded build unless someone
// deliberately opts in. REAL_MODE makes "opted in" the only way either real
// provider is ever reachable, in every environment.
//
// `import.meta.env.DEV` is a Vite compile-time constant — `false` in any
// `vite build` output — so `if (REAL_MODE)` (and everything it guards)
// collapses to dead code under production minification, which is how this
// queue item's own verify step ("grep the production bundle for
// 'pollinations', expect it only inside a dev-guarded branch") is meant to
// pass. The `?real=1` half is a genuine runtime read (URL params aren't
// knowable at build time) and stays a live per-page-load check even in dev
// — never persisted (no localStorage), never inferred from CLI health,
// exactly mirroring how `?flow=` is read once at boot elsewhere in this app
// (state.jsx's own getInitialFlow) rather than watched reactively.
export const REAL_MODE =
  import.meta.env.DEV &&
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).get('real') === '1'
