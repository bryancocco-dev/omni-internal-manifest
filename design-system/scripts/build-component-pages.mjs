/* Emits public/components/<project>--<key>.html — a small, self-contained,
 * PUBLIC permalink page for every ACTIVE (non-archived) component snippet in
 * the catalog. Each page links the project's real font/preconnect tags and
 * its published CSS (public/library/<project>.css, from build:components),
 * then renders the verbatim snippet markup — so the page looks exactly like
 * it does inside the Storybook iframe, standalone, with a real shareable URL.
 *
 * Mirrors the loading pattern in scripts/build-components-json.mjs: it walks
 * every stories/_extract/snippets/<slug>.js module and skips anything
 * flagged archived in stories/_extract/curation.js. Run AFTER build:components
 * (needs public/library/<project>.css to already exist, and follows the same
 * active/archived rules) — wired into `build` as build:component-pages.
 *
 * Also emits public/components/index.json — [{ project, key, note, url }]
 * for every page, so a page can be looked up or linked to programmatically.
 *
 * Run: npm run build:component-pages
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join, basename } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { ARCHIVED } from '../stories/_extract/curation.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SNIP_DIR = join(ROOT, 'stories', '_extract', 'snippets');
const EXTRACT_DIR = join(ROOT, 'stories', '_extract');
const OUT_DIR = join(ROOT, 'public', 'components');
const BASE = 'https://omni-system-hazel.vercel.app';

// Same project → display-label map as scripts/build-components-json.mjs
// (kept in sync by hand — both scripts source labels from the same
// stories/_extract/projects.js register() calls).
const LABELS = {
  'agents-store': 'Agents Store',
  'chat-hat': 'Chat Hat',
  'persona-subnav': 'Persona',
  'omni-agent-builder': 'Agent Builder',
  'media': 'Media',
  'gawdtable': 'Gawdtable',
  'lease-campaign-brief-handoff': 'Brief',
  'themes': 'Themes',
  'canvas-qa': 'QA',
  'publish-to-workspace': 'Publish',
  'copy-request-access': 'Access',
  'translations': 'Translations',
  'switching-canvas': 'Switching',
  'canvas-share-demos': 'Share Demos',
  'admin': 'Admin',
  'canvas-book-ends': 'Book Ends',
  'canvas-collab': 'Collab',
  'canvas-exports': 'Exports',
  'canvas-pdf-tables': 'PDF Tables',
  'media-skills': 'Media Skills',
  'canvas-workflows': 'Workflows',
  'gateway-v2': 'Gateway',
  'canvas-graphics': 'Graphics',
  'copy-agent': 'Copy Agent',
  'omni-manifest': 'Manifest'
};

const archivedByKey = new Map(Object.entries(ARCHIVED).map(([k, v]) => [k.toLowerCase(), v]));

mkdirSync(OUT_DIR, { recursive: true });

const snippetFiles = readdirSync(SNIP_DIR)
  .filter(f => f.endsWith('.js') && !f.startsWith('_'))
  .sort();

const index = [];
let emitted = 0;
let skippedArchived = 0;

for (const file of snippetFiles) {
  const slug = basename(file, '.js');
  const label = LABELS[slug] || slug;
  const headPath = join(EXTRACT_DIR, `${slug}.head.html`);
  const headHtml = existsSync(headPath) ? readFileSync(headPath, 'utf8').trim() : '';

  const mod = (await import(pathToFileURL(join(SNIP_DIR, file)).href)).default;

  for (const [key, entry] of Object.entries(mod)) {
    if (!entry || !entry.html) continue;
    if (archivedByKey.has(`${slug}/${key}`.toLowerCase())) { skippedArchived++; continue; }

    const note = entry.note || '';
    const fileName = `${slug}--${key}.html`;
    const url = `${BASE}/components/${fileName}`;

    const commentLines = [
      `  OMNI component: ${key}`,
      `  Project: ${label}`,
      ...(note ? [`  Note: ${note}`] : []),
      '',
      '  Part of the OMNI design system — restyle with var(--omni-*), see /CLAUDE.md'
    ];

    const page = `<!doctype html>
<!--
${commentLines.join('\n')}
-->
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(label)} — ${escapeHtml(key)} · OMNI</title>
${headHtml}
<link rel="stylesheet" href="${BASE}/library/${slug}.css">
<style>
  body { background: var(--omni-page-bg, #fff); margin: 0; }
</style>
</head>
<body${entry.bodyClass ? ` class="${escapeHtml(entry.bodyClass)}"` : ''}>
${entry.html}
</body>
</html>
`;

    writeFileSync(join(OUT_DIR, fileName), page, 'utf8');
    index.push({ project: slug, key, note, url });
    emitted++;
  }
}

writeFileSync(join(OUT_DIR, 'index.json'), JSON.stringify(index, null, 2), 'utf8');

console.log(`component-pages: ${emitted} pages → public/components/ (+${skippedArchived} archived skipped), index.json written`);

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
