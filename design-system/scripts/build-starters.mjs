/* Generates public/starters/canvas-base.zip — the "canvas base" starter kit:
 * a verbatim copy of the canvas-workflows OMNI+ Canvas shell — header, left
 * nav, profile/share, Untitled-Canvas dropdown, the Chat Hat (Graphics/Video/
 * Audio row + Creative Brief/Moodboard/Storyboard/Deep Research/Persona/
 * Mockups/Project Plan/Instagram Post chips), model selector, the rail-tool
 * icons + overlays — with the built-in persona-generation flow stubbed out
 * (clicking the Persona chip logs a placeholder instead) AND the React Flow
 * workflow builder fully excised: its rail-tool button, overlay host, and the
 * Vite `src/main.jsx` module entrypoint are all removed so the kit stays
 * 100% static with zero references into src/.
 *
 * Reads the sibling ../../canvas-workflows repo, so run LOCALLY (we deploy
 * prebuilt). Run: npm run build:starters   (standalone — re-run after
 * canvas-workflows changes)
 */

import { readFileSync, writeFileSync, mkdirSync, copyFileSync, rmSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SOURCE_DIR = join(ROOT, '..', 'canvas-workflows');
const OUT_DIR = join(ROOT, 'public', 'starters');
const STAGE = join('/tmp', 'omni-canvas-base');
const KIT = join(STAGE, 'canvas-base');

if (!existsSync(join(SOURCE_DIR, 'index.html'))) {
  console.error('canvas-workflows not found at', SOURCE_DIR, '— run locally where the sibling repo exists.');
  process.exit(1);
}

// ── 1. read + patch canvas-workflows ──────────────────────────────────────────
let html = readFileSync(join(SOURCE_DIR, 'index.html'), 'utf8');

// Patches below are TOLERANT: canvas-workflows already carries most of these
// fixes upstream (it was branched from an already-patched, already-de-branded
// shell), so most anchors are expected to be absent — that's not an error,
// just a no-op logged as a warning. Only the workflow-builder removal below is
// a hard requirement (this starter must never ship the React Flow builder).
function tryPatch(label, from, to) {
  if (html.includes(from)) { html = html.replace(from, to); return true; }
  console.warn('PATCH ANCHOR MISSING (skipped):', label, '—', JSON.stringify(from.slice(0, 60)));
  return false;
}
function tryReplaceAll(label, from, to) {
  if (html.includes(from)) { html = html.replaceAll(from, to); return true; }
  console.warn('PATCH ANCHOR MISSING (skipped):', label, '—', JSON.stringify(from));
  return false;
}

// stub the built-in persona-generation flow trigger
tryPatch('persona-flow trigger', "if (which === 'Persona') {",
  "if (false) { /* canvas-base starter: built-in persona flow removed — wire your own */");
// Persona-chip hint copy under the hat
tryPatch('persona-chip hint copy', 'try <strong>Persona</strong> to see the Chat Hat working end-to-end.',
  'wire up your own canvas flow here.');
// de-brand: the header breadcrumb above "Untitled Canvas"
tryPatch('workspace breadcrumb de-brand', '<span class="root">Build Submarines</span>',
  '<span class="root">My Workspace</span>');
// land on the clean canvas tab (swap canvas/graphics tab bindings — see the
// original chat-hat build script for the full rationale; canvas-workflows
// already lands on the clean canvas_1 by default, so this is expected to be
// a no-op there)
tryPatch('clean-canvas tab swap (1st tab)', '<div class="tab active" data-tab="canvas" role="button" tabindex="0">',
  '<div class="tab active" data-tab="graphics" role="button" tabindex="0">');
tryPatch('clean-canvas tab swap (3rd tab)', '<div class="tab" data-tab="graphics" role="button" tabindex="0">',
  '<div class="tab" data-tab="canvas" role="button" tabindex="0">');
tryPatch('brief-tab relabel', '      canvas_3\n    </div>', '      canvas_2\n    </div>');
// brief cover → the already-shipped OMNI bib-shape graphic
tryPatch('brief cover image swap', 'src="cover-roblox-racing.png"', 'src="bib-shape.png"');

// de-brand the demo content: scrub external brand NAMES from the Knowledge-tool
// document list + the (stubbed) ad-creative placeholders so only OMNI branding
// ships. Omnicom / OPMG is KEPT — OMNI is the Omnicom design system, so that's
// family branding, not an external brand.
tryReplaceAll('logo filename de-brand', 'build-submarines-logo.png', 'omni-logo.png');
tryReplaceAll('brand name de-brand', 'Build Submarines', 'Acme');
tryReplaceAll('brand name de-brand (concat)', 'BuildSubmarines', 'Acme');
tryReplaceAll('brand name de-brand (lower)', 'buildsubmarines', 'acme');
tryReplaceAll('brand name de-brand (upper)', 'BUILDSUBMARINES', 'ACME');
tryReplaceAll('campaign name de-brand', 'Wrap Competition', 'Sample Campaign');

// ── 1x. HARD REQUIREMENT — remove the React Flow workflow builder entirely ───
// canvas-workflows adds a 5th rail-tool button that opens a full-canvas
// overlay hosting a React Flow builder mounted at runtime by src/main.jsx.
// The starter must ship the shell WITHOUT it: zero rail button, zero overlay
// host, zero script references into src/.

// 1x-i. the Workflow rail-tool button (hard fail — this is the one visible
// affordance for the feature we're removing, it must not survive).
{
  const RAIL_BTN_RE = /\s*<button class="rail-tool rail-tool-workflow"[\s\S]*?<\/button>\n?/;
  if (!RAIL_BTN_RE.test(html)) {
    console.error('PATCH ANCHOR MISSING (hard fail): Workflow rail-tool button (.rail-tool-workflow) not found — cannot confirm it is excluded from the starter.');
    process.exit(1);
  }
  html = html.replace(RAIL_BTN_RE, '');
}

// 1x-ii. its dedicated hover-animation CSS (tolerant cleanup — dead CSS
// targeting a removed class is harmless, but strip it for a clean kit).
{
  const from = html.indexOf('  /* Workflow-builder tool — on hover a signal draws itself along the wire');
  const to = html.indexOf('  .rail-tool-agents svg {');
  if (from !== -1 && to !== -1 && to > from) html = html.slice(0, from) + html.slice(to);
  else console.warn('PATCH ANCHOR MISSING (skipped): .rail-tool-workflow hover-animation CSS block (cosmetic)');
}

// 1x-iii. tighten the rail-title bottom clearance now that the rail holds one
// fewer tool (56px) — cosmetic, tolerant.
tryPatch('rail-title clearance comment', 'Bottom clearance = 56*8 + 12 = 460 so the title clears the eight\n       tool buttons (56px tall each: Agents / Knowledge / Tools / Skills /\n       Instructions / Light Canvas / Canvas view / Workflow builder) plus',
  'Bottom clearance = 56*7 + 12 = 404 so the title clears the seven\n       tool buttons (56px tall each: Agents / Knowledge / Tools / Skills /\n       Instructions / Light Canvas / Canvas view) plus');
tryPatch('rail-title clearance value', 'top: 64px; bottom: 460px; left: 0; right: 0;', 'top: 64px; bottom: 404px; left: 0; right: 0;');

// 1x-iv. the overlay host container + #workflow-root mount node + its toggle
// scripts, "if present" per spec — tolerant, not a hard requirement on its
// own (the module-script removal below is what's actually mandatory).
{
  const OVERLAY_HOST_START = '<!-- Workflow builder overlay host';
  const MODULE_SCRIPT = '<script type="module" src="/src/main.jsx"></script>';
  const start = html.indexOf(OVERLAY_HOST_START);
  const moduleIdx = html.indexOf(MODULE_SCRIPT);
  if (start !== -1 && moduleIdx !== -1 && moduleIdx > start) {
    html = html.slice(0, start) + html.slice(moduleIdx);
  } else {
    console.warn('PATCH ANCHOR MISSING (skipped): workflow overlay host container / #workflow-root mount script (not present)');
  }
}

// 1x-v. the dead .workflow-overlay CSS block (tolerant cleanup).
{
  const from = html.indexOf('<style>\n  /* Workflow builder overlay — seam A/B contract');
  if (from !== -1) {
    const closeAt = html.indexOf('</style>', from);
    const to = closeAt !== -1 ? closeAt + '</style>'.length : -1;
    if (to !== -1) html = html.slice(0, from) + html.slice(to);
  } else {
    console.warn('PATCH ANCHOR MISSING (skipped): .workflow-overlay CSS block (cosmetic)');
  }
}

// 1x-vi. the Vite module-script entrypoint — HARD FAIL if missing. This is
// the actual live wire into src/; the kit is not "fully static" until it's gone.
{
  const MODULE_SCRIPT = '<script type="module" src="/src/main.jsx"></script>';
  if (!html.includes(MODULE_SCRIPT)) {
    console.error('PATCH ANCHOR MISSING (hard fail): <script type="module" src="/src/main.jsx"> not found — cannot confirm the React Flow builder entrypoint is excluded.');
    process.exit(1);
  }
  html = html.replaceAll(MODULE_SCRIPT, '');
}

// 1x-vii. belt & suspenders — fail loudly if any workflow-builder wiring
// (rail button, mount node, or a module/src reference) survived patching,
// rather than silently shipping a kit with dangling 404s.
{
  const leftovers = [];
  if (/class="rail-tool rail-tool-workflow"/.test(html)) leftovers.push('.rail-tool-workflow button');
  if (html.includes('id="workflow-root"')) leftovers.push('#workflow-root mount node');
  if (/type="module"[^>]*src=["']\/src\//.test(html)) leftovers.push('type="module" src="/src/..." script');
  if (leftovers.length) {
    console.error('PATCH FAILED — workflow-builder references survived patching, aborting to avoid a broken/404ing starter:', leftovers.join(', '));
    process.exit(1);
  }
}

// ── 2. stage the kit (patched index.html + only the referenced local assets
//       that actually exist + CLAUDE.md) ─────────────────────────────────────
rmSync(STAGE, { recursive: true, force: true });
mkdirSync(KIT, { recursive: true });
writeFileSync(join(KIT, 'index.html'), html, 'utf8');

// Scan the FINAL patched HTML for local (non-http, non-data-URI, non-src/)
// asset references — src=/href=/poster= attributes and CSS url(...) — and
// copy whichever of them actually exist in the source repo (checked at repo
// root and under public/, since this is a Vite project) next to index.html,
// preserving their relative path. Anything not found is left unreferenced —
// it 404s in the source project's own dev server too, so it's not a
// regression this build introduces. If nothing local is referenced (fully
// inline/data-URI shell), the kit ships as just index.html + CLAUDE.md.
function scanLocalAssetRefs(source) {
  const refs = new Set();
  const attrRe = /(?:src|href|poster)\s*=\s*["']([^"']+)["']/g;
  const urlRe = /url\(\s*(['"]?)([^'")]+)\1\s*\)/g;
  let m;
  while ((m = attrRe.exec(source))) refs.add(m[1]);
  while ((m = urlRe.exec(source))) refs.add(m[2]);
  return [...refs].filter((v) =>
    v &&
    !/^https?:\/\//.test(v) &&
    !v.startsWith('data:') &&
    !v.startsWith('#') &&
    !v.startsWith('mailto:') &&
    !v.startsWith('javascript:') &&
    !v.startsWith('/src/') &&
    !v.includes('${') &&        // template-literal interpolation, not a literal path
    !v.includes("' +") &&       // string-concatenation fragment, not a literal path
    !/^['"]/.test(v)
  );
}

const assetRefs = scanLocalAssetRefs(html);
const copiedAssets = [];
const missingAssets = [];
for (const ref of assetRefs) {
  const candidates = [join(SOURCE_DIR, ref), join(SOURCE_DIR, 'public', ref)];
  const src = candidates.find((p) => existsSync(p));
  if (src) {
    const dest = join(KIT, ref);
    mkdirSync(dirname(dest), { recursive: true });
    copyFileSync(src, dest);
    copiedAssets.push(ref);
  } else {
    missingAssets.push(ref);
  }
}
if (missingAssets.length) {
  console.warn('ASSETS referenced but not found in source (left unreferenced, not bundled):', missingAssets.join(', '));
}
console.log(copiedAssets.length
  ? `ASSETS copied (${copiedAssets.length}): ${copiedAssets.join(', ')}`
  : 'ASSETS: none found on disk — shell is fully inline/data-URI, shipping index.html + CLAUDE.md only.');

writeFileSync(join(KIT, 'CLAUDE.md'), claudeMd(), 'utf8');

// ── 3. zip → public/starters/canvas-base.zip ─────────────────────────────────
mkdirSync(OUT_DIR, { recursive: true });
const zipPath = join(OUT_DIR, 'canvas-base.zip');
rmSync(zipPath, { force: true });
execFileSync('zip', ['-r', '-q', zipPath, 'canvas-base'], { cwd: STAGE });
rmSync(STAGE, { recursive: true, force: true });

// ── 4. the SAME doc, fetchable standalone → public/starters/canvas-base.md ────
// This is the drop-in: a designer puts it in an empty project as CLAUDE.md,
// opens Claude Code, and the "Setup" section makes Claude pull the shell in.
// It's identical to the CLAUDE.md inside the zip, so the flow is idempotent —
// dropped solo it fetches the canvas; already-unzipped it just skips setup.
writeFileSync(join(OUT_DIR, 'canvas-base.md'), claudeMd(), 'utf8');

// ── 5. one-command scaffold → public/starters/new.sh ─────────────────────────
// The turnkey path: `curl … /starters/new.sh | sh -s my-canvas` makes the
// folder, unpacks the shell + CLAUDE.md into it, and prints the next step.
// No manual folder-making, no "rename this to CLAUDE.md" — one paste.
writeFileSync(join(OUT_DIR, 'new.sh'), newSh(), 'utf8');

const bytes = readFileSync(zipPath).length;
console.log(`canvas-base.zip → ${zipPath} (${(bytes / 1024 / 1024).toFixed(1)} MB)`);
console.log(`canvas-base.md  → ${join(OUT_DIR, 'canvas-base.md')} (drop-in starter)`);
console.log(`new.sh          → ${join(OUT_DIR, 'new.sh')} (one-command scaffold)`);

// ─────────────────────────────────────────────────────────────────────────────
function claudeMd() { return `# OMNI+ Canvas — prototype starter

## ⚠️ Rule #1 — everything you build comes from the OMNI design system

**This is the most important instruction in this file.** When the user asks you to add or change **anything**, pull from the live OMNI system **first** — all styling from its tokens (\`var(--omni-*)\` via \`tokens.css\`) and all components/patterns from its catalog (\`components.json\`). Never invent your own colours, type, spacing, or components when the system already has them. (Exact how-to in **"Use the OMNI design system"** below.)

**Override clause — when you may make something up:** if, and only if, the OMNI system genuinely has no token or component for what's needed, build that piece from scratch. Even then, style it entirely with \`var(--omni-*)\` tokens and match the system's visual language so it stays on-brand.

Build on the full **OMNI+ Canvas** shell: the top header (workspace + Untitled-Canvas dropdown, Share, profile), the left nav + rail, the chat panel, the **Chat Hat** prompt surface, the model selector, and the 4 bottom-left tool icons with their overlays. It's a verbatim copy of https://chat-hat.vercel.app/ with the built-in persona-generation flow removed, so you can wire your own.

---

## Claude — read this first

The canvas is **already set up in this folder** — \`index.html\` (the full working shell) and its assets are right here. There's nothing to install or fetch.

On your **first message**: open \`index.html\` so the user can see it running, tell them the canvas is ready, then **ask what they'd like to add or change.** Don't ask any setup or planning questions first — they already have the finished canvas; just help them build on it.

**When they tell you what to build, the OMNI design system is the source of truth — pull styles and components from it FIRST (see "Use the OMNI design system" below), before writing any UI of your own.**

> **Fallback (rare):** if \`index.html\` is somehow **not** in this folder, fetch it here first, then proceed — \`(curl -fsSL -o omni-canvas.zip https://omni-system-hazel.vercel.app/starters/canvas-base.zip || curl -fsSL -o omni-canvas.zip https://raw.githubusercontent.com/bryancocco-dev/omni-canvas-starter/main/canvas-base.zip) && unzip -oq omni-canvas.zip && cp -Rf canvas-base/. . && rm -rf canvas-base omni-canvas.zip\` — the second URL is a GitHub mirror that works even where the primary host is blocked (raw.githubusercontent.com is pre-allowed in sandboxed environments).
>
> **If BOTH downloads are blocked** (403 / \`host_not_allowed\` / sandbox denial), tell the user how to unblock it:
> - **Desktop / CLI:** approve the sandbox domain prompt for \`omni-system-hazel.vercel.app\` (or add it via \`/sandbox\`, or add \`{"sandbox":{"network":{"allowedDomains":["omni-system-hazel.vercel.app"]}}}\` to \`.claude/settings.json\`), then re-run the command.
> - **claude.ai/code (cloud):** no prompt appears — environment selector (cloud icon above the message box) → **Default environment settings → Network access → Custom** → add the domain, then retry in a new session.
> - **Last resort:** download https://omni-system-hazel.vercel.app/starters/canvas-base.zip in a browser and drag it into the chat.
>
> **Handed the zip in chat?** When the user drags \`canvas-base.zip\` into the conversation (usually because the download was blocked), don't ask anything — unzip it into **this folder** exactly like the curl path: \`unzip -oq <path-to-the-uploaded-zip> && cp -Rf canvas-base/. . && rm -rf canvas-base\` — no subfolder, no setup questions. Then do the normal first-message handover: open \`index.html\`, tell them the fresh blank canvas is ready, and ask what they'd like to build.

<!-- Mirror: https://github.com/bryancocco-dev/omni-canvas-starter — synced from the omni-system build; do not edit there. -->


## Use the OMNI design system — required for everything you build

When the user asks you to add or change **anything**, pull styles and components from the live OMNI system *first*. Do not invent your own colours, type, spacing, or components when the system already provides them — it is the single source of truth.

**1 · Styles → tokens.** Add this to the page \`<head>\`, then use \`var(--omni-*)\` for every colour, font, space, radius, shadow, and motion value. Never hardcode a hex/px where a token exists:
\`\`\`html
<link rel="stylesheet" href="https://omni-system-hazel.vercel.app/tokens.css">
\`\`\`
Support light + dark by setting \`data-theme="dark"\` on the page; every token flips automatically. (Machine-readable list: \`/tokens.json\`.)

**2 · Components → the verbatim catalog.** Reuse the real patterns (top-nav, tabs, side rail, cards, chips, modals, toasts, tables, avatars, hero, …) instead of building from scratch. Fetch:
\`\`\`
https://omni-system-hazel.vercel.app/components.json
\`\`\`
Each entry is \`{ project, projectLabel, type, note, html }\`; the CSS that styles a project's snippets is at \`https://omni-system-hazel.vercel.app/library/<project>.css\`. The snippets carry their **original hardcoded colours** — reuse the markup/structure, then re-skin with \`var(--omni-*)\` so new UI follows the live palette and themes.

**3 · Not in the system? Then make it up.** If the OMNI system genuinely has no token or component for what the user needs, build that piece from scratch — but still style it entirely with \`var(--omni-*)\` tokens and match the system's visual language, so even custom UI stays on-brand.

Browse it (humans): https://omni-system-hazel.vercel.app/?path=/docs/welcome--docs  (password-gated). Full conventions: https://omni-system-hazel.vercel.app/CLAUDE.md

The existing canvas shell keeps its own original styling — leave it as-is unless asked. The rules above are for the **new** UI you build on top.

## Deploy
Static — deploy to Vercel as-is. Add the standard Basic-Auth \`middleware.js\` if it needs gating (ask Claude).
`;
}

function newSh() { return `#!/bin/sh
# OMNI+ Canvas — one-command scaffold.
#   curl -fsSL https://omni-system-hazel.vercel.app/starters/new.sh | sh -s my-canvas
# Creates the folder, unpacks the working canvas shell + CLAUDE.md into it,
# and prints the next step. Then: cd <folder> && claude
set -e

DIR="\${1:-omni-canvas}"
BASE="https://omni-system-hazel.vercel.app/starters"
# GitHub mirror — raw.githubusercontent.com is pre-allowed in sandboxed
# environments (e.g. claude.ai/code cloud), so this works where BASE is blocked.
MIRROR="https://raw.githubusercontent.com/bryancocco-dev/omni-canvas-starter/main"

if [ -e "\$DIR" ] && [ -n "\$(ls -A "\$DIR" 2>/dev/null)" ]; then
  echo "✗ './\$DIR' already exists and isn't empty. Pick a fresh name:"
  echo "    curl -fsSL \$BASE/new.sh | sh -s my-canvas"
  exit 1
fi

echo "→ Scaffolding the OMNI+ Canvas into ./\$DIR …"
mkdir -p "\$DIR"
cd "\$DIR"
if ! curl -fsSL -o canvas-base.zip "\$BASE/canvas-base.zip"; then
  echo "→ Primary host blocked — trying the GitHub mirror…"
  if ! curl -fsSL -o canvas-base.zip "\$MIRROR/canvas-base.zip"; then
    echo "✗ Download blocked? Desktop/CLI: approve the sandbox domain prompt for omni-system-hazel.vercel.app (or add it via /sandbox), then re-run."
    echo "  claude.ai/code cloud: environment selector (cloud icon above the message box) → Default environment settings → Network access → Custom → add the domain, then retry in a new session."
    echo "  Last resort: download \$BASE/canvas-base.zip in a browser and drag it into the chat."
    exit 1
  fi
fi
unzip -oq canvas-base.zip
cp -Rf canvas-base/. .
rm -rf canvas-base canvas-base.zip

echo ""
echo "✓ Ready. Your full-quality canvas is in ./\$DIR"
echo ""
echo "  Next:"
echo "    cd \$DIR && claude"
echo "  …then just describe what to build — e.g."
echo "    \\"wire the Chat Hat's first chip to open a brief form\\""
echo ""
echo "  (Or open ./\$DIR/index.html in a browser to see the shell right now.)"
`;
}
