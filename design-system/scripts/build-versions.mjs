/* Reads `git log --tags` from each sibling project repo and emits
 * public/versions.html — a single static page that lists every project,
 * its tags, and its recent commits. Re-run on every build.
 *
 * Self-contained: no deps outside node:* core + child_process.
 */

import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');   // /TINKER

const PROJECTS = [
  { slug: 'omni-system',                   label: 'OMNI System (this site)' },
  { slug: 'omni-dashboard',                label: 'OMNI Dashboard (manifest)' },
  { slug: 'agents-store',                  label: 'Agents Store' },
  { slug: 'chat-hat',                      label: 'Chat Hat' },
  { slug: 'persona-subnav',                label: 'Persona' },
  { slug: 'omni-agent-builder',            label: 'Agent Builder' },
  { slug: 'lease-campaign-brief-handoff',  label: 'Brief' },
  { slug: 'gawdtable',                     label: 'Gawdtable' },
  { slug: 'media',                         label: 'Media' },
  { slug: 'lease-campaign',                label: 'Lease Campaign (Brief/Gawdtable/Media source)' }
];

function git(cwd, args) {
  try {
    return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
  } catch (_) {
    return '';
  }
}

function readProject({ slug, label }) {
  const cwd = join(ROOT, slug);
  if (!existsSync(join(cwd, '.git'))) {
    return { slug, label, error: 'no git repo found' };
  }
  const tags = git(cwd, ['for-each-ref', '--sort=-creatordate', '--format=%(refname:short)|%(creatordate:iso8601)|%(subject)', 'refs/tags'])
    .split('\n').filter(Boolean).map(line => {
      const [tag, date, subject] = line.split('|');
      return { tag, date, subject };
    });
  const commits = git(cwd, ['log', '--pretty=format:%h|%ai|%s', '-n', '20'])
    .split('\n').filter(Boolean).map(line => {
      const [hash, date, subject] = line.split('|');
      return { hash, date, subject };
    });
  const head = git(cwd, ['rev-parse', '--short', 'HEAD']);
  return { slug, label, head, tags, commits };
}

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function render(projects) {
  const generated = new Date().toISOString();
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Versions — OMNI System</title>
<style>
  :root {
    --bg: #F8F4E9; --surface: #FFF; --border: #D4D4D4;
    --text: #0B0B0B; --muted: #737373; --accent: #1858EE;
    --mono: ui-monospace, SFMono-Regular, Menlo, monospace;
    --sans: ui-sans-serif, system-ui, -apple-system, sans-serif;
  }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--text); font: 14px/1.5 var(--sans); }
  .wrap { max-width: 1100px; margin: 0 auto; padding: 48px 32px; }
  h1 { font-size: 32px; letter-spacing: -.02em; margin: 0 0 8px; }
  .meta { color: var(--muted); font-size: 13px; margin-bottom: 32px; }
  .project { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; margin-bottom: 16px; padding: 20px 24px; }
  .project header { display: flex; align-items: baseline; gap: 14px; flex-wrap: wrap; margin-bottom: 12px; }
  .project h2 { font-size: 18px; margin: 0; }
  .slug { font: 12px/1 var(--mono); color: var(--muted); }
  .head { font: 12px/1 var(--mono); color: var(--accent); margin-left: auto; }
  .row  { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 2fr); gap: 24px; }
  .col h3 { font-size: 11px; letter-spacing: .1em; text-transform: uppercase; color: var(--muted); margin: 0 0 8px; font-weight: 600; }
  .tag, .commit { font: 12px/1.5 var(--mono); padding: 4px 0; border-bottom: 1px dotted var(--border); }
  .tag:last-child, .commit:last-child { border-bottom: none; }
  .tag .name { color: var(--accent); font-weight: 600; }
  .commit .h  { color: var(--accent); }
  .date { color: var(--muted); margin-left: 6px; }
  .empty { color: var(--muted); font-style: italic; }
  .error { color: #B0001A; font-family: var(--mono); font-size: 12px; }
  a { color: var(--accent); text-decoration: none; }
  a:hover { text-decoration: underline; }
  .back { display: inline-block; margin-bottom: 24px; font-family: var(--mono); font-size: 12px; }
</style>
</head>
<body>
<div class="wrap">
  <a class="back" href="/">&larr; back to OMNI System</a>
  <h1>Versions</h1>
  <div class="meta">Generated ${esc(generated)} · ${projects.length} projects tracked</div>
  ${projects.map(p => `
    <section class="project">
      <header>
        <h2>${esc(p.label)}</h2>
        <span class="slug">${esc(p.slug)}</span>
        ${p.head ? `<span class="head">@ ${esc(p.head)}</span>` : ''}
      </header>
      ${p.error ? `<div class="error">${esc(p.error)}</div>` : `
        <div class="row">
          <div class="col">
            <h3>Tags</h3>
            ${p.tags?.length ? p.tags.map(t => `
              <div class="tag"><span class="name">${esc(t.tag)}</span><span class="date">${esc(t.date?.slice(0, 10))}</span><div>${esc(t.subject)}</div></div>
            `).join('') : '<div class="empty">no tags yet</div>'}
          </div>
          <div class="col">
            <h3>Recent commits</h3>
            ${p.commits?.length ? p.commits.slice(0, 20).map(c => `
              <div class="commit"><span class="h">${esc(c.hash)}</span><span class="date">${esc(c.date?.slice(0, 10))}</span> ${esc(c.subject)}</div>
            `).join('') : '<div class="empty">no commits yet</div>'}
          </div>
        </div>
      `}
    </section>
  `).join('')}
</div>
</body>
</html>`;
}

const projects = PROJECTS.map(readProject);
const out = join(__dirname, '..', 'public', 'versions.html');
const okCount = projects.filter(p => !p.error).length;
// Vercel builds from GitHub, where the sibling project repos don't exist.
// Reading none of them would overwrite the committed page with empty
// placeholders — so keep the existing page when there's nothing to read.
if (okCount === 0 && existsSync(out)) {
  console.log(`versions.html kept as committed (no sibling repos available here) → ${out}`);
  process.exit(0);
}
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, render(projects), 'utf8');
console.log(`versions.html written for ${okCount}/${projects.length} projects → ${out}`);
