/**
 * Comments panel — a fixed, right-side panel that aggregates every comment
 * left on the page, modeled on Figma's Comments sidebar but rendered in the
 * OMNI light palette (not Figma's dark chrome).
 *
 * Header (title + collapse), a search field, a sort/filter menu, and a
 * more-options menu. The list shows every comment across sections (deep-links
 * to the section on click, resolve on hover). Hide/reveal via the collapse
 * control, the "Hide comments" menu item, a ⇧C shortcut, and a floating
 * reveal button. Reads/writes the same store as the inline affordances
 * (comment-affordance.js) and re-renders on the `comments:changed` event.
 */
import {
  getAllComments, getReadSet, markRead, addReply, threadLastAt,
  getPeople, formatBody, timeAgo, initials,
} from './comment-affordance.js';
import { createComposer, filesToDataUrls } from './composer.js';
import { smoothScrollElement } from './smooth-scroll.js';

const OPEN_KEY = 'canvas-share:comments-open';
const PANEL_W = 340; // keep in sync with --comments-w in comments-panel.css
const SHIFT_BREAKPOINT = 900; // below this the panel overlays instead of shifting

// A refined OMNI-family palette for avatars — deterministic per name so a
// person keeps their colour, but the list isn't a monotone wall of one blue.
const AVATAR_COLORS = ['#1858ee', '#6069f5', '#8b5cf6', '#0e8f9a', '#1f9d6b', '#c2506e'];
export function avatarColor(name) {
  let h = 0;
  for (let i = 0; i < name.length; i += 1) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

const ICONS = {
  search: `<svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="5" stroke="currentColor" stroke-width="1.5"/><path d="M10.5 10.5L14 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  // sliders / adjustments — reads clearly as a sort + filter control
  sort: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M4 7h9M17.5 7H20"/><circle cx="15" cy="7" r="2.3"/><path d="M4 17h9M17.5 17H20"/><circle cx="15" cy="17" r="2.3"/><path d="M4 12h3M11 12h9"/><circle cx="9" cy="12" r="2.3"/></svg>`,
  more: `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><circle cx="3.5" cy="8" r="1.4"/><circle cx="8" cy="8" r="1.4"/><circle cx="12.5" cy="8" r="1.4"/></svg>`,
  collapse: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 3.5 10.5 8 6 12.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  bubble: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  bubbleEmpty: `<svg width="30" height="30" viewBox="0 0 24 24" fill="none"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  check: `<svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M3.5 8.5 6.5 11.5 12.5 5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  reply: `<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M7 3.5 3 7l4 3.5M3.5 7H9a3.5 3.5 0 0 1 3.5 3.5V12" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  caret: `<svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
};

export function initCommentsPanel(root, { pageSlug, sections, docRoot }) {
  const state = {
    query: '',
    sort: 'date', // 'date' | 'unread'
    showResolved: false,
    onlyYours: false,
  };

  const panel = document.createElement('aside');
  panel.className = 'comments-panel';
  panel.setAttribute('aria-label', 'Comments');
  panel.innerHTML = `
    <header class="comments-panel__head">
      <div class="comments-panel__title-row">
        <span class="comments-panel__title-group">
          <span class="comments-panel__title">Comments</span>
          <span class="comments-panel__count" hidden></span>
        </span>
        <button class="comments-panel__collapse" type="button" aria-label="Hide comments" title="Hide comments (⇧C)">${ICONS.collapse}</button>
      </div>
      <div class="comments-panel__controls">
        <label class="comments-panel__search">
          <span class="comments-panel__search-ico">${ICONS.search}</span>
          <input type="search" placeholder="Search" aria-label="Search comments" />
        </label>
        <button class="comments-panel__tool comments-panel__sort" type="button" aria-label="Sort and filter">${ICONS.sort}</button>
      </div>
    </header>
    <div class="comments-panel__body"></div>`;

  root.appendChild(panel);

  const body = panel.querySelector('.comments-panel__body');
  smoothScrollElement(body); // glide like the page, not hard native scroll
  const searchInput = panel.querySelector('.comments-panel__search input');
  const sortBtn = panel.querySelector('.comments-panel__sort');
  const collapseBtn = panel.querySelector('.comments-panel__collapse');

  // Reveal control lives on a fixed right-side rail — a hairline inset from the
  // browser edge with the comments trigger sitting on it (not the top nav).
  const rail = document.createElement('div');
  rail.className = 'doc-rail';
  rail.innerHTML = `
    <span class="doc-rail__line" aria-hidden="true"></span>
    <button class="doc-rail__btn" type="button" aria-label="Comments" title="Comments (⇧C)">
      ${ICONS.bubble}
      <span class="doc-rail__count" hidden></span>
    </button>`;
  document.body.appendChild(rail);
  const railBtn = rail.querySelector('.doc-rail__btn');

  /* ── open / close ──────────────────────────────────────────────────────── */
  function isOpen() { return window.localStorage.getItem(`${OPEN_KEY}:${pageSlug}`) !== 'false'; }

  // The content shift narrows .doc to free the panel's width on the right.
  // Uses max-width, not width: on this width:100% element the engine ignores
  // an inline `width` entirely, but honors `max-width` (verified). On narrow
  // screens the panel overlays instead, so no shift.
  function applyShift() {
    if (!docRoot) return;
    const wide = window.innerWidth > SHIFT_BREAKPOINT;
    // Both states must be interpolatable lengths for the .doc max-width
    // transition to fire (none → calc can't animate, so the column would jump).
    // calc(100% - 0px) ↔ calc(100% - 340px) interpolates → the column glides
    // from centre to left as the panel slides in.
    const inset = isOpen() && wide ? PANEL_W : 0;
    docRoot.style.maxWidth = `calc(100% - ${inset}px)`;
  }

  function setOpen(open) {
    window.localStorage.setItem(`${OPEN_KEY}:${pageSlug}`, String(open));
    document.body.classList.toggle('comments-open', open);
    panel.classList.toggle('is-open', open);
    railBtn.classList.toggle('is-active', open);
    applyShift();
  }
  collapseBtn.addEventListener('click', () => setOpen(false));
  railBtn.addEventListener('click', () => setOpen(!isOpen()));
  window.addEventListener('resize', applyShift);

  // ⇧C toggles the panel (ignored while typing in a field).
  document.addEventListener('keydown', (e) => {
    const t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
    if (e.shiftKey && (e.key === 'C' || e.key === 'c')) { e.preventDefault(); setOpen(!isOpen()); }
  });

  /* ── menus ─────────────────────────────────────────────────────────────── */
  let openMenu = null;
  function closeMenus() { if (openMenu) { openMenu.remove(); openMenu = null; } }
  document.addEventListener('click', closeMenus);

  function menuItem({ label, checked = false, shortcut = '', disabled = false, onClick }) {
    const btn = document.createElement('button');
    btn.type = 'button';
    // No check icon — the active choice reads via accent colour instead.
    btn.className = `comments-menu__item${checked ? ' is-active' : ''}${disabled ? ' is-disabled' : ''}`;
    btn.disabled = disabled;
    btn.innerHTML = `<span class="comments-menu__label">${label}</span>${shortcut ? `<span class="comments-menu__shortcut">${shortcut}</span>` : ''}`;
    if (!disabled && onClick) btn.addEventListener('click', (e) => { e.stopPropagation(); onClick(); });
    return btn;
  }

  function openMenuUnder(btn, build) {
    const wasOpen = openMenu && openMenu.dataset.owner === btn.className;
    closeMenus();
    if (wasOpen) return;
    const menu = document.createElement('div');
    menu.className = 'comments-menu';
    menu.dataset.owner = btn.className;
    menu.addEventListener('click', (e) => e.stopPropagation());
    build(menu);
    panel.appendChild(menu);
    const br = btn.getBoundingClientRect();
    const pr = panel.getBoundingClientRect();
    menu.style.top = `${br.bottom - pr.top + 6}px`;
    menu.style.right = `${pr.right - br.right}px`;
    openMenu = menu;
  }


  sortBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    openMenuUnder(sortBtn, (menu) => {
      menu.appendChild(menuItem({ label: 'Sort by date', checked: state.sort === 'date', onClick: () => { state.sort = 'date'; closeMenus(); render(); } }));
      menu.appendChild(menuItem({ label: 'Sort by unread', checked: state.sort === 'unread', onClick: () => { state.sort = 'unread'; closeMenus(); render(); } }));
    });
  });

  searchInput.addEventListener('input', () => { state.query = searchInput.value.trim().toLowerCase(); render(); });

  /* ── list rendering ────────────────────────────────────────────────────── */
  function scrollToSection(sectionId) {
    const target = (docRoot || document).querySelector(`[data-comment-target="${sectionId}"]`);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // Threads whose replies are collapsed. Default = expanded (the whole
  // conversation shows), so a thread only appears here once explicitly folded.
  const collapsed = new Set();

  // Which thread (if any) currently has its reply composer open, tracked in
  // state so it survives the re-renders that markRead()/addReply() trigger —
  // otherwise the freshly-opened composer gets rebuilt away. focusReplyOnRender
  // fires focus() only on the open action, not on every subsequent render.
  let replyOpenFor = null;
  let focusReplyOnRender = false;

  function buildReplyComposer(c) {
    const { root: composer, focus } = createComposer({
      placeholder: `Reply to ${c.name.replace(/\s*\(.*\)/, '')}…`,
      people: getPeople(),
      onSubmit: async (text, attachments) => {
        const images = await filesToDataUrls(attachments);
        if (!text && !images.length) return;
        replyOpenFor = null;
        addReply(pageSlug, c.sectionId, c.id, { name: 'You', text, images }, sectionSeed(c.sectionId));
      },
    });
    composer.classList.add('comments-thread__composer');
    composer.addEventListener('click', (ev) => ev.stopPropagation());
    // Escape closes the reply box without posting.
    composer.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape') { ev.stopPropagation(); replyOpenFor = null; render(); }
    });
    if (focusReplyOnRender) { focusReplyOnRender = false; requestAnimationFrame(() => focus()); }
    return composer;
  }

  // Build one message row (root or reply) — avatar + name + time + body.
  function messageRow(m, kind) {
    const row = document.createElement('div');
    row.className = `comments-panel__msg comments-panel__msg--${kind}`;
    const text = m.text ? `<p class="comments-panel__text">${formatBody(m.text)}</p>` : '';
    const imgs = (m.images && m.images.length)
      ? `<div class="comments-panel__imgs">${m.images.map((u) => `<img class="comments-panel__img" src="${u}" alt="attachment" loading="lazy" />`).join('')}</div>` : '';
    row.innerHTML = `
      <span class="comments-panel__avatar" style="--avatar: ${avatarColor(m.name)}">${initials(m.name)}</span>
      <div class="comments-panel__msg-main">
        <div class="comments-panel__msg-head">
          <span class="comments-panel__name">${m.name}</span>
          <span class="comments-panel__time">${timeAgo(m.at)}</span>
        </div>
        ${text}${imgs}
      </div>`;
    return row;
  }

  // Build a full thread card: root message, replies (foldable), reply affordance.
  function buildThread(c) {
    const item = document.createElement('div');
    item.className = `comments-panel__item comments-thread${c.unread ? ' is-unread' : ''}`;

    item.appendChild(messageRow(c, 'root'));

    const replies = c.replies || [];
    if (replies.length) {
      const isFolded = collapsed.has(c.id);
      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = `comments-thread__toggle${isFolded ? ' is-folded' : ''}`;
      toggle.innerHTML = `<span class="comments-thread__toggle-ico">${ICONS.caret}</span>${isFolded ? `Show ${replies.length} ${replies.length === 1 ? 'reply' : 'replies'}` : `Hide ${replies.length === 1 ? 'reply' : 'replies'}`}`;
      toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        if (collapsed.has(c.id)) collapsed.delete(c.id); else collapsed.add(c.id);
        render();
      });
      item.appendChild(toggle);

      if (!isFolded) {
        const replyWrap = document.createElement('div');
        replyWrap.className = 'comments-thread__replies';
        replies.forEach((r) => replyWrap.appendChild(messageRow(r, 'reply')));
        item.appendChild(replyWrap);
      }
    }

    // Reply affordance — the expanded composer if this thread is being replied
    // to (state-tracked so it survives re-renders), else a compact trigger.
    if (replyOpenFor === c.id) {
      item.appendChild(buildReplyComposer(c));
    } else {
      const foot = document.createElement('div');
      foot.className = 'comments-thread__foot';
      const trigger = document.createElement('button');
      trigger.type = 'button';
      trigger.className = 'comments-thread__reply-trigger';
      trigger.innerHTML = `<span class="comments-thread__reply-ico">${ICONS.reply}</span>Reply`;
      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        replyOpenFor = c.id;
        focusReplyOnRender = true;
        markRead(pageSlug, [c.id]); // emits comments:changed → render() shows the composer expanded
      });
      foot.appendChild(trigger);
      item.appendChild(foot);
    }

    // Clicking the card body (not a control) marks it read and jumps to the
    // section — but not while its own reply box is open (would rebuild it away).
    item.addEventListener('click', () => {
      if (replyOpenFor === c.id) { scrollToSection(c.sectionId); return; }
      markRead(pageSlug, [c.id]);
      scrollToSection(c.sectionId);
    });
    return item;
  }

  function render() {
    const readSet = getReadSet(pageSlug);
    let items = getAllComments(pageSlug, sections).map((c) => ({ ...c, unread: !readSet.has(c.id) }));
    const total = items.length;

    if (!state.showResolved) items = items.filter((c) => !c.resolved);
    if (state.onlyYours) items = items.filter((c) => c.name === 'You');
    if (state.query) {
      const q = state.query;
      items = items.filter((c) =>
        c.text.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        (c.sectionLabel || '').toLowerCase().includes(q) ||
        (c.replies || []).some((r) => r.text.toLowerCase().includes(q) || r.name.toLowerCase().includes(q)));
    }
    items.sort((a, b) =>
      (state.sort === 'unread' ? (Number(b.unread) - Number(a.unread)) : 0) ||
      (new Date(threadLastAt(b)) - new Date(threadLastAt(a))));

    const allOpen = getAllComments(pageSlug, sections).filter((c) => !c.resolved);
    const unreadCount = allOpen.filter((c) => !readSet.has(c.id)).length;
    const badge = railBtn.querySelector('.doc-rail__count');
    if (badge) { badge.textContent = unreadCount; badge.hidden = unreadCount === 0; }
    const titleCount = panel.querySelector('.comments-panel__count');
    if (titleCount) { titleCount.textContent = allOpen.length; titleCount.hidden = allOpen.length === 0; }

    body.innerHTML = '';
    if (!items.length) {
      const empty = document.createElement('div');
      empty.className = 'comments-panel__empty';
      empty.innerHTML = `
        <span class="comments-panel__empty-ico">${ICONS.bubbleEmpty}</span>
        <p>${total && !state.showResolved
          ? 'No open comments here. Adjust the filters, or leave a new one on any section.'
          : 'Give feedback, ask a question, or just leave a note of appreciation. Use the comment button on any section to leave a comment.'}</p>`;
      body.appendChild(empty);
      return;
    }

    items.forEach((c) => body.appendChild(buildThread(c)));
  }

  const sectionSeed = (id) => (sections.find((s) => s.id === id) || {}).seedComments;

  document.addEventListener('comments:changed', (e) => { if (e.detail?.pageSlug === pageSlug) render(); });

  // Start closed so the rail is the entry point; the viewer opens it from there.
  setOpen(false);
  render();
}
