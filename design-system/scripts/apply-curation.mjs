/* Applies stories/_extract/curation.js to the story files.
 *
 * Storybook 8's sidebar index is built by static AST analysis of each story
 * file's exports — there is no runtime way to hide a story from it. So an
 * "archived" entry in curation.js (a project's version of a component TYPE
 * marked as a deprecated duplicate of another project's version) has to be
 * removed from the FILE, not just flagged in data.
 *
 * This script does that removal mechanically and reversibly: it comments out
 * the matching `export const … = { ...s('<project>', …) }` line(s) in
 * stories/Components/<Type>.stories.js and replaces them with a
 * `registerArchived('<project>', '<Type>', <snip-expr>)` call — a plain
 * statement, not a named export, so Storybook's index never sees it, but it
 * still runs at module-eval time and hands the archived version's verbatim
 * snippet data to _extract/lib.js so the winning story's Archive drawer can
 * render it.
 *
 * Reconciling, not one-directional: every run re-derives each file's state
 * from the CURRENT contents of curation.js. Entries present get archived (if
 * not already); marker-commented exports whose entry has been REMOVED from
 * curation.js get automatically restored. Running twice with no manifest
 * change is a no-op (idempotent).
 *
 * Usage:
 *   node scripts/apply-curation.mjs            reconcile story files to curation.js
 *   node scripts/apply-curation.mjs --restore   ignore curation.js; uncomment
 *                                               every ARCHIVED-marked export
 *                                               (full rollback / escape hatch)
 */

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const STORIES_DIR = join(ROOT, 'stories', 'Components');
const CURATION_PATH = join(ROOT, 'stories', '_extract', 'curation.js');

const MARKER =
  '// ARCHIVED — see the Archive drawer on the primary story. Restore by uncommenting; entry in _extract/curation.js';

// Matches both the live and already-commented form of a generated story
// export line: group 1 = leading "// " (present once archived), 2 = export
// ident, 3 = project slug, 4 = snippet-module alias, 5 = snippet property key.
const CONST_RE = /^(\/\/\s*)?export const (\w+) = \{ \.\.\.s\(\s*'([\w-]+)'\s*,\s*(\w+)\.(\w+)/;
const PLAIN_IMPORT_RE = /^import \{ storiesFor \} from '\.\.\/_extract\/lib\.js';$/;
const FULL_IMPORT_RE = /^import \{ storiesFor, registerArchived \} from '\.\.\/_extract\/lib\.js';$/;

const restoreOnly = process.argv.includes('--restore');

const { ARCHIVED } = await import(pathToFileURL(CURATION_PATH).href);

function ensureRegisterImport(rec) {
  for (let i = 0; i < rec.lines.length; i++) {
    if (FULL_IMPORT_RE.test(rec.lines[i])) return; // already present
    if (PLAIN_IMPORT_RE.test(rec.lines[i])) {
      rec.lines[i] = rec.lines[i].replace('{ storiesFor }', '{ storiesFor, registerArchived }');
      rec.dirty = true;
      return;
    }
  }
}

function maybeStripRegisterImport(rec) {
  if (rec.lines.some((l) => l.includes('registerArchived('))) return; // still used
  for (let i = 0; i < rec.lines.length; i++) {
    if (FULL_IMPORT_RE.test(rec.lines[i])) {
      rec.lines[i] = rec.lines[i].replace('{ storiesFor, registerArchived }', '{ storiesFor }');
      rec.dirty = true;
      return;
    }
  }
}

// Comments out every live export in `rec` whose s('<project>', …) call
// references `project`, replacing each with MARKER + commented line +
// registerArchived(...). Re-scans rec.lines fresh (safe to call repeatedly /
// after other edits to the same file).
function archiveInFile(rec, project, snipKey) {
  const idxs = [];
  for (let i = 0; i < rec.lines.length; i++) {
    const m = rec.lines[i].match(CONST_RE);
    if (m && !m[1] && m[3] === project && m[5].toLowerCase() === snipKey) idxs.push(i);
  }
  if (!idxs.length) return 0;
  ensureRegisterImport(rec);
  let count = 0;
  for (let k = idxs.length - 1; k >= 0; k--) {
    const i = idxs[k];
    const m = rec.lines[i].match(CONST_RE);
    const alias = m[4], propKey = m[5];
    const original = rec.lines[i];
    const registerLine = `registerArchived('${project}', '${propKey}', ${alias}.${propKey});`;
    rec.lines.splice(i, 1, MARKER, '// ' + original, registerLine);
    count++;
  }
  rec.dirty = true;
  return count;
}

function hasRegisteredArchive(recs, project, snipKey) {
  const needle = `registerArchived('${project}', '`;
  return recs.some((rec) => rec.lines.some((l) => {
    if (!l.includes(needle)) return false;
    const m = l.match(/registerArchived\('([\w-]+)',\s*'(\w+)'/);
    return m && m[1] === project && m[2].toLowerCase() === snipKey;
  }));
}

// Restores any MARKER-commented export in `rec` whose project/type is no
// longer a key in `archivedOrNull` (or unconditionally, when null — the
// --restore escape hatch).
function restoreStaleInFile(rec, archivedOrNull) {
  const idxs = [];
  for (let i = 0; i < rec.lines.length; i++) {
    if (rec.lines[i].trim() === MARKER) idxs.push(i);
  }
  if (!idxs.length) return 0;
  let count = 0;
  for (let k = idxs.length - 1; k >= 0; k--) {
    const i = idxs[k];
    const commentedLine = rec.lines[i + 1];
    const m = commentedLine && commentedLine.match(CONST_RE);
    if (!m || !m[1]) continue; // malformed / hand-edited — leave alone
    const project = m[3];
    const key = `${project}/${m[5]}`.toLowerCase();
    const stillArchived = archivedOrNull && Object.keys(archivedOrNull).some((k) => k.toLowerCase() === key);
    if (stillArchived) continue;
    const restored = commentedLine.replace(/^\/\/ /, '');
    // splice away MARKER + commented export + registerArchived line (3 lines)
    rec.lines.splice(i, 3, restored);
    count++;
  }
  if (count) { rec.dirty = true; maybeStripRegisterImport(rec); }
  return count;
}

const files = readdirSync(STORIES_DIR).filter((f) => f.endsWith('.stories.js')).sort();

const parsed = files.map((f) => {
  const path = join(STORIES_DIR, f);
  const src = readFileSync(path, 'utf8');
  const titleMatch = src.match(/title:\s*'Components\/([^']+)'/);
  return { file: f, path, lines: src.split('\n'), type: titleMatch ? titleMatch[1] : null, dirty: false };
});

const byType = new Map();
for (const p of parsed) {
  if (!p.type) continue;
  const key = p.type.toLowerCase();
  if (byType.has(key)) {
    console.warn(`apply-curation: WARNING multiple story files share type "${p.type}" (${byType.get(key).file}, ${p.file}) — using ${byType.get(key).file}`);
    continue;
  }
  byType.set(key, p);
}

let archivedTouched = 0;
let restoredTouched = 0;
const errors = [];

if (!restoreOnly) {
  for (const [key, val] of Object.entries(ARCHIVED)) {
    const slash = key.indexOf('/');
    if (slash < 0) { errors.push(`curation.js: malformed key "${key}" (expected "<project>/<snippetKey>")`); continue; }
    const project = key.slice(0, slash);
    const snipKey = key.slice(slash + 1).toLowerCase();
    let n = 0;
    for (const rec of parsed) n += archiveInFile(rec, project, snipKey);
    if (n > 1) errors.push(`curation.js: "${key}" matched ${n} exports across story files — expected exactly 1`);
    if (!n && !hasRegisteredArchive(parsed, project, snipKey)) {
      errors.push(`curation.js: "${key}" — no live export rendering snippet "${snipKey}" for project "${project}" found in any story file (and none already archived)`);
    }
    archivedTouched += n;
  }
}

for (const p of parsed) {
  restoredTouched += restoreStaleInFile(p, restoreOnly ? null : ARCHIVED);
}

if (!restoreOnly) {
  for (const [key, val] of Object.entries(ARCHIVED)) {
    const target = val && val.supersededBy;
    if (!target) { errors.push(`curation.js: "${key}" has no supersededBy`); continue; }
    const slash = target.indexOf('/');
    if (slash < 0) { errors.push(`curation.js: "${key}" supersededBy "${target}" is malformed`); continue; }
    const wProject = target.slice(0, slash);
    const wKey = target.slice(slash + 1).toLowerCase();
    const live = parsed.some((rec) => rec.lines.some((l) => {
      const m = l.match(CONST_RE);
      return m && !m[1] && m[3] === wProject && m[5].toLowerCase() === wKey;
    }));
    if (!live) errors.push(`curation.js: "${key}" supersededBy "${target}" has NO live export rendering that snippet — winner is missing`);
  }
}

let filesWritten = 0;
for (const p of parsed) {
  if (p.dirty) { writeFileSync(p.path, p.lines.join('\n'), 'utf8'); filesWritten++; }
}

console.log(
  `apply-curation: ${archivedTouched} export(s) archived, ${restoredTouched} export(s) restored, ${filesWritten} file(s) written` +
  (restoreOnly ? ' (--restore mode)' : '')
);
if (errors.length) {
  console.error(`apply-curation: ${errors.length} error(s):`);
  for (const e of errors) console.error('  - ' + e);
  process.exitCode = 1;
}
