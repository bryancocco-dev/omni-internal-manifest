// FINAL QUEUE — FQ-A "REAL ADAPTERS (local-only truth)" (PLAN.md
// "### FQ-A"). adapters.pollinations — the one real IMAGE provider behind
// engine.js's image-adapter resolution point (that file's own
// runImageAdapter). Keyless, no account, no API key: verified live
// 2026-08-19 (this file's own header note in PLAN.md), independently
// re-verified while building this — a plain GET against
// https://image.pollinations.ai/prompt/<urlencoded prompt>?width&height
// &nologo=true&seed=<seed> returns a real JPEG in ~1-2s with
// `access-control-allow-origin: *` (curl-verified headers), so a plain
// browser `fetch()` from this app's own origin needs no proxy, no server
// route, nothing in server/** — unlike the claude-local text path, this
// provider is reachable directly from the client.
//
// Contract: fetchPollinationsImage(req) -> Promise<{url, mime, width,
// height}>, REJECTING on any non-2xx response, timeout, network error, or a
// response that doesn't actually look like an image. engine.js's own
// runImageAdapter is the ONE place that catches that rejection and falls
// back to the seeded SVG poster/artifact ("Failure is graceful and SILENT
// to the demo" — PLAN.md) — this file never has to know about "demo mode"
// at all, the same real/fake separation gen/generate.js already keeps (this
// module IS the "real" half only, no fallback logic of its own).
//
// REAL_MODE gating lives one level up (engine.js checks it before ever
// calling in here — see that file's runImageAdapter) — this file always
// attempts the fetch when called, no internal flag of its own, so there is
// exactly ONE place in the codebase that decides "are we even allowed to do
// this," matching realMode.js's own single-source-of-truth framing.
//
// The returned `url` is a same-origin `blob:` object URL (not the bare
// pollinations URL) — the reachability fetch below already downloads the
// real bytes to confirm success, and handing back an object URL means every
// consumer (a live <img>, RunPreview's hero, a shelf thumb, and
// run/download.js's PNG-passthrough save) reuses those SAME bytes with zero
// further network dependency, rather than each independently re-fetching
// (and re-trusting) a cross-origin URL. Never revoked in this session — a
// handful of demo-session images is a few MB at most, an accepted trade-off
// documented here rather than adding blob-URL lifecycle tracking across
// every surface that might still be showing an older run's version history
// (OutputNode's own VersionRail can browse back to any of the last 8).

const TIMEOUT_MS = 4000 // PLAN.md FQ-A: "any error/timeout (4s image, ...)"

// Width/height per the three shapes FQ-A names, matching run/artifacts.jsx's
// OWN pixel aspect ratios for the SAME kind strings (poster 320/400 = 4:5,
// social 320/320 = 1:1, video 400/225 = 16:9) scaled up to a sane real-photo
// resolution — engine.js picks `kind` via that exact file's own
// artifactKind(format, seed), so a real photo always drops into the exact
// frame the SVG fallback would have sized itself to (OutputNode.jsx /
// GenerateNode.jsx never change their own `aspectRatio` CSS between the two
// paths — zero layout shift either way).
const DIMENSIONS = {
  poster: { width: 768, height: 960 }, // 4:5
  social: { width: 896, height: 896 }, // 1:1
  video: { width: 960, height: 540 }, // 16:9
}

// A blank/empty brief (Generate's own `prompt`, or an Output's own
// `description`) shouldn't produce a broken or embarrassing call — same
// "honest demo fake" bar this app's other generators hold (gen/generate.js's
// own demo templates always have SOMETHING plausible to say even with zero
// input). One fallback per shape, on-voice with the format it stands in for.
const FALLBACK_PROMPTS = {
  poster: 'abstract brand key visual, editorial studio photography, no text, no watermark',
  social: 'lifestyle brand photo, social media crop, natural light, no text, no watermark',
  video: 'cinematic establishing shot, film still, shallow depth of field, no text, no watermark',
}

export async function fetchPollinationsImage({ prompt, kind = 'poster', seed = 0, signal } = {}) {
  const { width, height } = DIMENSIONS[kind] || DIMENSIONS.poster
  const cleanPrompt = String(prompt || '').trim().slice(0, 500) || FALLBACK_PROMPTS[kind] || FALLBACK_PROMPTS.poster
  const src = `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanPrompt)}?width=${width}&height=${height}&nologo=true&seed=${encodeURIComponent(Math.abs(Math.trunc(Number(seed) || 0)))}`

  // Own timeout controller, ALSO wired to the caller's run-abort signal
  // (Stop mid-run) — same abort-early shape every cancellable beat in
  // engine.js already uses (delay/waitForHuman/edgeSettled), so a real image
  // fetch in flight when someone hits Stop dies immediately instead of
  // resolving into a node that's no longer running.
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  const onCallerAbort = () => controller.abort()
  if (signal) {
    if (signal.aborted) controller.abort()
    else signal.addEventListener('abort', onCallerAbort, { once: true })
  }

  try {
    const res = await fetch(src, { signal: controller.signal, mode: 'cors' })
    if (!res.ok) throw new Error(`pollinations responded ${res.status}`)
    const blob = await res.blob()
    // A real photo is never this small and always carries an image/* type —
    // catches a same-origin-shaped error PAGE (some failure modes return a
    // 200 with an HTML/JSON body instead of pixels) that would otherwise
    // silently become a broken <img>.
    if (!blob || blob.size < 1024 || !blob.type.startsWith('image/')) {
      throw new Error('pollinations returned a non-image response')
    }
    return { url: URL.createObjectURL(blob), mime: blob.type, width, height }
  } finally {
    clearTimeout(timer)
    if (signal) signal.removeEventListener('abort', onCallerAbort)
  }
}
