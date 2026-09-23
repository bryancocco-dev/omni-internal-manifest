/**
 * Comment store + affordances. No backend — comments persist to localStorage,
 * scoped by page slug + section id, so a reviewer's notes survive a reload.
 *
 * The store (top of file) is the single source of truth shared by three
 * presentations: the per-section margin pin + popover, the always-open CTA
 * composer, and the global right-side Comments panel (comments-panel.js).
 * Any mutation emits a document-level `comments:changed` event so every view
 * re-renders in sync.
 */
import { createComposer, filesToDataUrls } from './composer.js';

// Comments live in memory ONLY (no localStorage), so every page refresh resets
// the entire conversation back to the seed data — nothing a viewer adds
// persists across a reload.
const COMMENTS = new Map(); // `${pageSlug}::${sectionId}` → comments[]
const READ = new Map();     // pageSlug → read comment id[]
const NOTIFY = new Map();   // pageSlug → notify pref

// People roster used by the composer's @-mention autocomplete. Set once per
// page via setPeople(); shared by every composer instance.
let ROSTER = [];
export function setPeople(list) { ROSTER = list || []; }
export function getPeople() { return ROSTER; }

const memKey = (pageSlug, sectionId) => `${pageSlug}::${sectionId}`;

function emitChanged(pageSlug) {
  document.dispatchEvent(new CustomEvent('comments:changed', { detail: { pageSlug } }));
}

function normalizeReply(threadId, r, i) {
  return {
    id: r.id || `${threadId}::r${i}::${r.at}`,
    name: r.name,
    text: r.text,
    at: r.at,
    images: Array.isArray(r.images) ? r.images : [],
  };
}

function normalize(sectionId, c) {
  const id = c.id || `${sectionId}::${c.at}`;
  return {
    id,
    name: c.name,
    text: c.text,
    at: c.at,
    resolved: !!c.resolved,
    images: Array.isArray(c.images) ? c.images : [],
    replies: Array.isArray(c.replies) ? c.replies.map((r, i) => normalizeReply(id, r, i)) : [],
  };
}

/** All comments for one section (in-memory, else the seeded fallback), normalized. */
export function getComments(pageSlug, sectionId, seeded) {
  const arr = COMMENTS.get(memKey(pageSlug, sectionId)) || seeded || [];
  return arr.map((c) => normalize(sectionId, c));
}

function saveComments(pageSlug, sectionId, comments) {
  COMMENTS.set(memKey(pageSlug, sectionId), comments);
}

export function addComment(pageSlug, sectionId, { name, text, images }, seeded) {
  const next = [...getComments(pageSlug, sectionId, seeded), normalize(sectionId, { name, text, images, at: new Date().toISOString() })];
  saveComments(pageSlug, sectionId, next);
  emitChanged(pageSlug);
  return next;
}

export function setResolved(pageSlug, sectionId, commentId, resolved, seeded) {
  const next = getComments(pageSlug, sectionId, seeded).map((c) => (c.id === commentId ? { ...c, resolved } : c));
  saveComments(pageSlug, sectionId, next);
  emitChanged(pageSlug);
}

/** Append a reply to a thread (root comment) and persist it. */
export function addReply(pageSlug, sectionId, threadId, { name, text, images }, seeded) {
  const at = new Date().toISOString();
  const next = getComments(pageSlug, sectionId, seeded).map((c) => {
    if (c.id !== threadId) return c;
    const reply = { id: `${threadId}::r${c.replies.length}::${at}`, name, text, at, images: images || [] };
    return { ...c, replies: [...c.replies, reply] };
  });
  saveComments(pageSlug, sectionId, next);
  emitChanged(pageSlug);
}

/** Latest activity on a thread — its newest reply, else the root's own time. */
export function threadLastAt(c) {
  return c.replies && c.replies.length ? c.replies[c.replies.length - 1].at : c.at;
}

/** Every comment across all sections, each tagged with its section id + label. */
export function getAllComments(pageSlug, sectionsMeta) {
  const out = [];
  sectionsMeta.forEach(({ id, label, seedComments }) => {
    getComments(pageSlug, id, seedComments).forEach((c) => out.push({ ...c, sectionId: id, sectionLabel: label }));
  });
  return out;
}

/* ── read-state + notification preference (in-memory, reset on refresh) ── */
export function getReadSet(pageSlug) {
  return new Set(READ.get(pageSlug) || []);
}
export function markRead(pageSlug, ids) {
  const set = getReadSet(pageSlug);
  ids.forEach((id) => set.add(id));
  READ.set(pageSlug, [...set]);
  emitChanged(pageSlug);
}
export function getNotifyPref(pageSlug) {
  return NOTIFY.get(pageSlug) || 'everything';
}
export function setNotifyPref(pageSlug, value) {
  NOTIFY.set(pageSlug, value);
}

export function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(diff / 3600000);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(diff / 86400000);
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function initials(name) {
  return name.replace(/\(.*\)/, '').trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase();
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
}

/** Escape a comment body, then chip any "@Name" that matches the people roster. */
export function formatBody(text) {
  let html = escapeHtml(text);
  ROSTER.forEach((p) => {
    const token = escapeHtml(`@${p.name}`);
    if (html.includes(token)) html = html.split(token).join(`<span class="doc-mention">@${escapeHtml(p.name)}</span>`);
  });
  return html;
}

/* ─────────────────────────────── inline widgets ─────────────────────────── */

function renderImages(images, cls) {
  if (!images || !images.length) return '';
  return `<div class="${cls}">${images.map((u) => `<img class="${cls}-item" src="${u}" alt="attachment" loading="lazy" />`).join('')}</div>`;
}

function renderMessageRow(m, extraClass) {
  const text = m.text ? `<p>${formatBody(m.text)}</p>` : '';
  return `
    <div class="doc-comment${extraClass ? ` ${extraClass}` : ''}">
      <div class="doc-comment__avatar">${initials(m.name)}</div>
      <div class="doc-comment__body">
        <div class="doc-comment__meta"><strong>${m.name}</strong><span>${timeAgo(m.at)}</span></div>
        ${text}${renderImages(m.images, 'doc-comment__imgs')}
      </div>
    </div>`;
}

function renderComment(c) {
  const node = document.createElement('div');
  node.className = 'doc-comment-thread';
  const replies = (c.replies || []).map((r) => renderMessageRow(r, 'doc-comment--reply')).join('');
  node.innerHTML = renderMessageRow(c) + (replies ? `<div class="doc-comment-thread__replies">${replies}</div>` : '');
  return node;
}

/** Builds a {list, composer} pair wired to the shared store; callers decide layout. */
function buildCommentWidget(pageSlug, id, seedComments, { emptyText, placeholder }) {
  const list = document.createElement('div');
  list.className = 'doc-comment-list';

  const { root: composer } = createComposer({
    placeholder,
    people: ROSTER,
    onSubmit: async (text, attachments) => {
      const images = await filesToDataUrls(attachments);
      if (text || images.length) addComment(pageSlug, id, { name: 'You', text, images }, seedComments);
    },
  });

  const current = () => getComments(pageSlug, id, seedComments);

  function renderList() {
    const comments = current();
    list.innerHTML = '';
    if (!comments.length) {
      const empty = document.createElement('p');
      empty.className = 'doc-comment-empty';
      empty.textContent = emptyText;
      list.appendChild(empty);
    } else {
      comments.forEach((c) => list.appendChild(renderComment(c)));
    }
  }

  // Re-render whenever anything (this widget, another widget, the panel) changes the store.
  document.addEventListener('comments:changed', (e) => {
    if (e.detail?.pageSlug === pageSlug) renderList();
  });

  // Pin count = total messages in this section's conversation (roots + replies),
  // so a lively debate reads as "10", not "1".
  const messageCount = () => current().reduce((n, c) => n + 1 + (c.replies ? c.replies.length : 0), 0);

  renderList();
  return { list, composer, getCount: messageCount };
}

function closeAllPopovers(except) {
  document.querySelectorAll('.doc-comment-pin.is-open').forEach((pin) => {
    if (pin === except) return;
    pin.classList.remove('is-open');
    pin.nextElementSibling?.classList.remove('is-open');
  });
}

document.addEventListener('click', () => closeAllPopovers());

const PIN_ICON = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

/**
 * Margin pin + popover, used on every report section.
 * @param {HTMLElement} section - the .doc-section element (positioned relative)
 * @param {{id:string, pageSlug:string, seedComments?:Array}} opts
 */
export function attachCommentAffordance(section, opts) {
  const { id, pageSlug, seedComments } = opts;
  const { list, composer, getCount } = buildCommentWidget(pageSlug, id, seedComments, {
    emptyText: 'No comments yet — be the first to share a thought.',
    placeholder: 'Add a comment…',
  });

  const pin = document.createElement('button');
  pin.type = 'button';
  pin.className = 'doc-comment-pin';
  pin.setAttribute('aria-label', 'Leave a comment on this section');

  const popover = document.createElement('div');
  popover.className = 'doc-comment-popover';
  popover.appendChild(list);
  popover.appendChild(composer);
  popover.addEventListener('click', (e) => e.stopPropagation());

  function refreshPin() {
    const count = getCount();
    pin.classList.toggle('has-count', count > 0);
    pin.innerHTML = `${PIN_ICON}${count ? `<span class="doc-comment-pin__count">${count}</span>` : ''}`;
  }

  pin.addEventListener('click', (e) => {
    e.stopPropagation();
    const opening = !pin.classList.contains('is-open');
    closeAllPopovers(pin);
    pin.classList.toggle('is-open', opening);
    popover.classList.toggle('is-open', opening);
  });

  document.addEventListener('comments:changed', (e) => {
    if (e.detail?.pageSlug === pageSlug) refreshPin();
  });
  refreshPin();

  section.style.position = 'relative';
  section.appendChild(pin);
  section.appendChild(popover);
}

/**
 * Always-open composer for the closing CTA — the "clear call to comment."
 * @param {HTMLElement} mount
 * @param {{id:string, pageSlug:string, seedComments?:Array}} opts
 */
export function renderInlineComposer(mount, opts) {
  const { id, pageSlug, seedComments } = opts;
  const { list, composer } = buildCommentWidget(pageSlug, id, seedComments, {
    emptyText: 'No thoughts yet — this is a good place to start the conversation.',
    placeholder: 'Share your thoughts on this brief…',
  });
  const box = document.createElement('div');
  box.className = 'doc-comment-inline';
  box.appendChild(list);
  box.appendChild(composer);
  mount.appendChild(box);
}

export function initComments(root, pageSlug, sectionsMeta) {
  sectionsMeta.forEach(({ id, seedComments }) => {
    const section = root.querySelector(`[data-comment-target="${id}"]`);
    if (section) attachCommentAffordance(section, { id, pageSlug, seedComments });
  });
}
