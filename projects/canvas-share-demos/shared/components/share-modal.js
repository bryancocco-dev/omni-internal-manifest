/**
 * Share modal — the "Share this file" dialog, wired to the header Share button.
 * Two views inside one card: Invite (search a people directory, pick a role,
 * invite) and Collaborators (everyone with access + their role). Data-driven
 * from content.sharing; OMNI light palette. No backend — invites mutate an
 * in-memory collaborator list so the demo is fully interactive.
 *
 * Task E adds the transition layer: everything below marked "motion" is
 * additive choreography around the same behaviour — no copy, layout or
 * interaction changed. It reuses the page's house idiom (blur-resolve fades,
 * the --omni-transition-easing-snap/-smooth curves, and the toc.css rail
 * curve for anything that glides a size) rather than inventing new motion.
 */
import { initials } from './comment-affordance.js';
import { getPublishStatus, onPublishChange, publish, unpublish } from './publish-state.js';
import { getActiveBrand } from './themes.js';

// Same deterministic per-name palette the comments panel uses, so a given
// person keeps one colour across the whole page (comments + share).
const AVATAR_COLORS = ['#1858ee', '#6069f5', '#8b5cf6', '#0e8f9a', '#1f9d6b', '#c2506e'];
function avatarColor(name) {
  let h = 0;
  for (let i = 0; i < name.length; i += 1) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

const ROLES = ['Can edit', 'Can comment', 'Can view'];

const ICONS = {
  close: `<svg viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`,
  back: `<svg viewBox="0 0 24 24" fill="none"><path d="M15 5l-7 7 7 7" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  chevron: `<svg viewBox="0 0 24 24" fill="none"><path d="M9 5l7 7-7 7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  caret: `<svg viewBox="0 0 16 16" fill="none"><path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  invite: `<svg viewBox="0 0 24 24" fill="none"><circle cx="9" cy="8" r="3.3" stroke="currentColor" stroke-width="1.6"/><path d="M3.6 19a5.4 5.4 0 0 1 10.8 0" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M19 8v5M21.5 10.5h-5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`,
  users: `<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="10" r="2.8" stroke="currentColor" stroke-width="1.5"/><path d="M6.8 18.2a5.5 5.5 0 0 1 10.4 0" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  // Phosphor Light — buildings
  workspace: `<svg viewBox="0 0 256 256" fill="currentColor"><path d="M240,210H222V96a14,14,0,0,0-14-14H142V32a14,14,0,0,0-21.77-11.64l-80,53.33A14,14,0,0,0,34,85.34V210H16a6,6,0,0,0,0,12H240a6,6,0,0,0,0-12ZM208,94a2,2,0,0,1,2,2V210H142V94ZM46,85.34a2,2,0,0,1,.89-1.66l80-53.34A2,2,0,0,1,130,32V210H46ZM110,112v16a6,6,0,0,1-12,0V112a6,6,0,0,1,12,0Zm-32,0v16a6,6,0,0,1-12,0V112a6,6,0,0,1,12,0Zm0,56v16a6,6,0,0,1-12,0V168a6,6,0,0,1,12,0Zm32,0v16a6,6,0,0,1-12,0V168a6,6,0,0,1,12,0Z"/></svg>`,
  check: `<svg viewBox="0 0 16 16" fill="none"><path d="M3.5 8.5 6.5 11.5 12.5 5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  remove: `<svg viewBox="0 0 24 24" fill="none"><path d="M5 7h14M10 7V5.5A1.5 1.5 0 0 1 11.5 4h1A1.5 1.5 0 0 1 14 5.5V7M8 7l.7 11a1.5 1.5 0 0 0 1.5 1.4h3.6a1.5 1.5 0 0 0 1.5-1.4L16 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  publish: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M8 10.5v-8m0 0L4.5 6M8 2.5 11.5 6"/><path d="M2.5 10.5v2a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-2"/></svg>`,
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function nameFromEmail(email) {
  return email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
}

function avatarHtml(name, cls = '', pid = '') {
  return `<span class="share-avatar ${cls}" style="--av:${avatarColor(name)}"${pid ? ` data-pid="${pid}"` : ''}>${initials(name)}</span>`;
}

/* ── motion helpers (Task E) ───────────────────────────────────────────────
   Small, dependency-free utilities so every "content changed size/label"
   moment glides instead of snapping. The rail curve (cubic-bezier(0.32,
   0.72,0,1)) is lifted verbatim from toc.css for anything that resizes; the
   snap/smooth curves are the existing --omni-transition-easing-* tokens.
   Every helper checks prefers-reduced-motion and, on that path, jumps
   straight to the end state — never leaves anything mid-fade. ───────────── */
const RAIL_EASE = 'cubic-bezier(0.32, 0.72, 0, 1)';
function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Cross-fades a text node's content: fade out, swap, fade in. Skips the
 * dance entirely if the text isn't actually changing, or under
 * reduced-motion. Relies on the element already having an opacity
 * transition declared in CSS via `.is-swapping`. */
function crossfadeText(el, text) {
  if (!el || el.textContent === text) return;
  if (prefersReducedMotion()) { el.textContent = text; return; }
  el.classList.add('is-swapping');
  setTimeout(() => {
    el.textContent = text;
    el.classList.remove('is-swapping');
  }, 130);
}

export function initShareModal({ docTitle = 'this file', workspaceName: fallbackWorkspace = 'Workspace', owner, collaborators = [], directory = [] } = {}) {
  const shareBtn = document.querySelector('.doc-header__btn');
  if (!shareBtn || !owner) return;

  let nextId = 0;
  const people = collaborators.map((c) => ({ id: `p${nextId += 1}`, name: c.name, email: c.email, role: ROLES.includes(c.role) ? c.role : 'Can edit' }));
  let inviteRole = 'Can edit';
  let view = 'invite';

  const roster = () => [{ id: 'owner', name: owner.name, email: owner.email, role: 'Owner', owner: true }, ...people];
  const onFile = (email) => roster().some((p) => (p.email || '').toLowerCase() === String(email || '').toLowerCase());
  const total = () => roster().length;

  /* ── shell ──────────────────────────────────────────────────────────────── */
  const overlay = document.createElement('div');
  overlay.className = 'share-overlay';
  const modal = document.createElement('div');
  modal.className = 'share-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-label', 'Share this file');
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // Header is now a SINGLE shared element sitting above the two sliding
  // views (was duplicated per-view) so the close × truly never moves and
  // the title / back-chevron can cross-fade in place instead of being torn
  // down and rebuilt with the rest of the view. Each view keeps the exact
  // same resting header layout it always had (no back button in Invite,
  // back button reserved in Collaborators) — only the transition between
  // those two resting states is new.
  modal.innerHTML = `
    <header class="share-head">
      <button class="share-icon-btn share-back" type="button" aria-label="Back">${ICONS.back}</button>
      <h2 class="share-title"></h2>
      <button class="share-icon-btn share-close" type="button" aria-label="Close">${ICONS.close}</button>
    </header>
    <div class="share-views">
      <section class="share-view share-view--invite is-active">
        <div class="share-body">
          <div class="share-invite">
            <div class="share-invite__main">
              <div class="share-field">
                <input class="share-field__input" type="text" autocomplete="off" placeholder="Add people by name or email" aria-label="Add people by name or email" />
                <button class="share-role" type="button" aria-label="Choose permission"><span class="share-role__label">${inviteRole}</span><span class="share-role__caret">${ICONS.caret}</span></button>
              </div>
              <div class="share-results" role="listbox" hidden></div>
            </div>
          </div>
          <div class="share-toast" hidden></div>
          <button class="share-summary" type="button" aria-label="View collaborators">
            <span class="share-summary__lead">${ICONS.users}</span>
            <span class="share-summary__avatars"></span>
            <span class="share-summary__count"></span>
            <span class="share-summary__chev">${ICONS.chevron}</span>
          </button>
          <div class="share-summary share-workspace">
            <span class="share-summary__lead">${ICONS.publish}</span>
            <span class="share-workspace__text">
              <span class="share-workspace__name"></span>
              <span class="share-workspace__sub"></span>
            </span>
            <button class="share-workspace__btn" type="button">
              <span class="share-workspace__btn-icon" hidden></span>
              <span class="share-workspace__btn-label"></span>
            </button>
          </div>
        </div>
      </section>
      <section class="share-view share-view--collab">
        <div class="share-body">
          <p class="share-collab__label">Current collaborators</p>
          <ul class="share-collab__list"></ul>
          <p class="share-collab__label share-collab__label--pending" hidden>Pending invitation</p>
          <ul class="share-collab__list share-collab__list--pending"></ul>
        </div>
      </section>
    </div>`;

  const headEl = modal.querySelector('.share-head');
  const titleEl = modal.querySelector('.share-title');
  const backBtn = modal.querySelector('.share-back');
  const closeBtn = modal.querySelector('.share-close');
  const viewsWrap = modal.querySelector('.share-views');
  const input = modal.querySelector('.share-field__input');
  const results = modal.querySelector('.share-results');
  const roleBtn = modal.querySelector('.share-role');
  const roleLabel = modal.querySelector('.share-role__label');
  const toast = modal.querySelector('.share-toast');
  const summary = modal.querySelector('.share-summary');
  const summaryAvatars = modal.querySelector('.share-summary__avatars');
  const summaryCount = modal.querySelector('.share-summary__count');
  const collabList = modal.querySelector('.share-collab__list');
  const pendingLabel = modal.querySelector('.share-collab__label--pending');
  const pendingList = modal.querySelector('.share-collab__list--pending');
  const inviteView = modal.querySelector('.share-view--invite');
  const collabView = modal.querySelector('.share-view--collab');
  const wsName = modal.querySelector('.share-workspace__name');
  const wsSub = modal.querySelector('.share-workspace__sub');
  const wsBtn = modal.querySelector('.share-workspace__btn');
  const wsBtnIcon = modal.querySelector('.share-workspace__btn-icon');
  const wsBtnLabel = modal.querySelector('.share-workspace__btn-label');

  titleEl.textContent = `Share ${docTitle}`;

  /* ── workspace publish row ─────────────────────────────────────────────── */
  function workspaceName() { return (getActiveBrand() || {}).name || fallbackWorkspace; }

  let pubStatus = getPublishStatus();
  let pubHover = false;
  let sawFirstPublish = false;

  function paintWorkspaceText() {
    wsName.textContent = `${workspaceName()} workspace`;
    crossfadeText(wsSub, pubStatus === 'published'
      ? 'Anyone in the workspace can access this'
      : 'Publish so anyone in the workspace can access it');
  }

  function paintWorkspaceBtn() {
    wsBtn.disabled = pubStatus === 'busy';
    wsBtn.setAttribute('aria-busy', pubStatus === 'busy' ? 'true' : 'false');
    const wasDone = wsBtn.classList.contains('is-done');
    wsBtn.classList.toggle('is-done', pubStatus === 'published' && !pubHover);
    wsBtn.classList.toggle('is-busy', pubStatus === 'busy');

    let label = 'Publish';
    let showCheck = false;
    if (pubStatus === 'busy') label = 'Publishing…';
    else if (pubStatus === 'published') { label = pubHover ? 'Unpublish' : 'Published'; showCheck = !pubHover; }
    crossfadeText(wsBtnLabel, label);

    if (showCheck) {
      wsBtnIcon.hidden = false;
      wsBtnIcon.innerHTML = ICONS.check;
      const path = wsBtnIcon.querySelector('path');
      if (path && !wasDone && !prefersReducedMotion()) {
        // "Draws in" via stroke-dashoffset — the checkmark path is short
        // enough that 14 comfortably covers its full length.
        path.style.strokeDasharray = '14';
        path.style.strokeDashoffset = '14';
        // eslint-disable-next-line no-unused-expressions
        path.getBoundingClientRect();
        path.style.transition = 'stroke-dashoffset 320ms var(--omni-transition-easing-snap)';
        requestAnimationFrame(() => { path.style.strokeDashoffset = '0'; });
      }
    } else {
      wsBtnIcon.hidden = true;
      wsBtnIcon.innerHTML = '';
    }
  }

  document.addEventListener('theme:changed', paintWorkspaceText);

  wsBtn.addEventListener('mouseenter', () => { if (pubStatus === 'published') { pubHover = true; paintWorkspaceBtn(); } });
  wsBtn.addEventListener('mouseleave', () => { if (pubHover) { pubHover = false; paintWorkspaceBtn(); } });
  wsBtn.addEventListener('focus', () => { if (pubStatus === 'published') { pubHover = true; paintWorkspaceBtn(); } });
  wsBtn.addEventListener('blur', () => { if (pubHover) { pubHover = false; paintWorkspaceBtn(); } });
  wsBtn.addEventListener('click', () => {
    if (pubStatus === 'idle') publish();
    else if (pubStatus === 'published') unpublish();
  });

  onPublishChange((s) => {
    const prev = pubStatus;
    pubStatus = s;
    pubHover = false;
    paintWorkspaceText();
    paintWorkspaceBtn();
    if (!sawFirstPublish) { sawFirstPublish = true; return; }
    if (s === 'published' && prev === 'busy') flash(`Published to the ${workspaceName()} workspace`);
    else if (s === 'idle' && prev === 'published') flash(`Removed from the ${workspaceName()} workspace`);
  });

  /* ── open / close / view ────────────────────────────────────────────────── */
  function open() {
    paintSummary();
    overlay.classList.remove('is-closing');
    overlay.classList.add('is-open');
    document.addEventListener('keydown', onKey);
    setTimeout(() => input.focus(), 60);
  }
  function close() {
    if (!overlay.classList.contains('is-open')) return;
    overlay.classList.remove('is-open');
    overlay.classList.add('is-closing');
    document.removeEventListener('keydown', onKey);
    closeMenu();
    hideResults();
    const done = () => overlay.classList.remove('is-closing');
    setTimeout(done, prefersReducedMotion() ? 0 : 220);
  }
  function onKey(e) { if (e.key === 'Escape') { if (openMenu) { closeMenu(); return; } close(); } }

  let viewGen = 0;
  function setView(next) {
    if (next === view) return;
    const outgoingEl = view === 'invite' ? inviteView : collabView;
    const incomingEl = next === 'invite' ? inviteView : collabView;
    const forward = next === 'collab';
    view = next;

    crossfadeText(titleEl, next === 'collab'
      ? `${collabCurrentCount()} ${collabCurrentCount() === 1 ? 'Collaborator' : 'Collaborators'} in this file`
      : `Share ${docTitle}`);
    headEl.classList.toggle('is-collab', next === 'collab');

    if (next === 'collab') paintCollab({ entering: true });

    const gen = ++viewGen;
    const reduced = prefersReducedMotion();

    // Clear any leftover state from a switch that got interrupted mid-flight
    // (rapid clicking back and forth must never wedge or double-play).
    [inviteView, collabView].forEach((v) => {
      v.classList.remove('is-leaving', 'is-leaving-forward', 'is-leaving-back', 'is-entering', 'is-entering-forward', 'is-entering-back');
      v.style.position = '';
      v.style.top = '';
      v.style.left = '';
      v.style.width = '';
    });
    viewsWrap.style.transition = '';
    viewsWrap.style.height = '';
    viewsWrap.style.overflow = '';

    if (reduced) {
      outgoingEl.classList.remove('is-active');
      incomingEl.classList.add('is-active');
      return;
    }

    const beforeHeight = viewsWrap.getBoundingClientRect().height;

    outgoingEl.style.position = 'absolute';
    outgoingEl.style.top = '0';
    outgoingEl.style.left = '0';
    outgoingEl.style.width = '100%';
    outgoingEl.classList.add('is-leaving', forward ? 'is-leaving-forward' : 'is-leaving-back');

    incomingEl.classList.add('is-active', 'is-entering', forward ? 'is-entering-forward' : 'is-entering-back');

    const afterHeight = viewsWrap.getBoundingClientRect().height;

    viewsWrap.style.overflow = 'hidden';
    viewsWrap.style.height = `${beforeHeight}px`;
    // eslint-disable-next-line no-unused-expressions
    viewsWrap.getBoundingClientRect();
    viewsWrap.style.transition = `height 380ms ${RAIL_EASE}`;
    requestAnimationFrame(() => { if (gen === viewGen) viewsWrap.style.height = `${afterHeight}px`; });

    const cleanup = () => {
      if (gen !== viewGen) return;
      outgoingEl.classList.remove('is-active', 'is-leaving', 'is-leaving-forward', 'is-leaving-back');
      outgoingEl.style.position = '';
      outgoingEl.style.top = '';
      outgoingEl.style.left = '';
      outgoingEl.style.width = '';
      incomingEl.classList.remove('is-entering', 'is-entering-forward', 'is-entering-back');
      viewsWrap.style.transition = '';
      viewsWrap.style.height = '';
      viewsWrap.style.overflow = '';
    };
    setTimeout(cleanup, 460);
  }

  shareBtn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); open(); });
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  closeBtn.addEventListener('click', close);
  backBtn.addEventListener('click', () => setView('invite'));
  summary.addEventListener('click', () => setView('collab'));

  /* ── role dropdown menu (shared by invite field + each collaborator) ──────── */
  let openMenu = null;
  let openMenuAnchor = null;
  function closeMenu() {
    if (openMenuAnchor) { openMenuAnchor.classList.remove('is-menu-open'); openMenuAnchor = null; }
    if (!openMenu) return;
    const m = openMenu;
    openMenu = null;
    if (prefersReducedMotion()) { m.remove(); return; }
    m.classList.add('is-closing');
    setTimeout(() => m.remove(), 130);
  }
  document.addEventListener('click', (e) => { if (openMenu && !openMenu.contains(e.target)) closeMenu(); });

  function openRoleMenu(anchor, current, { onPick, onRemove, removeLabel = 'Remove access' } = {}) {
    if (openMenu && openMenu.dataset.owner === anchor.dataset.menuId) { closeMenu(); return; }
    closeMenu();
    const menu = document.createElement('div');
    menu.className = 'share-menu';
    menu.dataset.owner = anchor.dataset.menuId || '';
    menu.addEventListener('click', (e) => e.stopPropagation());
    ROLES.forEach((r) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = `share-menu__item${r === current ? ' is-active' : ''}`;
      b.innerHTML = `<span class="share-menu__check">${r === current ? ICONS.check : ''}</span><span>${r}</span>`;
      b.addEventListener('click', () => { closeMenu(); onPick && onPick(r); });
      menu.appendChild(b);
    });
    if (onRemove) {
      const div = document.createElement('div');
      div.className = 'share-menu__divider';
      menu.appendChild(div);
      const rm = document.createElement('button');
      rm.type = 'button';
      rm.className = 'share-menu__item share-menu__item--danger';
      rm.innerHTML = `<span class="share-menu__check">${ICONS.remove}</span><span>${removeLabel}</span>`;
      rm.addEventListener('click', () => { closeMenu(); onRemove(); });
      menu.appendChild(rm);
    }
    modal.appendChild(menu);
    const a = anchor.getBoundingClientRect();
    const m = modal.getBoundingClientRect();
    menu.style.top = `${a.bottom - m.top + 6}px`;
    // right-align the menu to the anchor, but keep it inside the modal
    const right = Math.max(12, m.right - a.right);
    menu.style.right = `${right}px`;
    openMenu = menu;
    openMenuAnchor = anchor;
    anchor.classList.add('is-menu-open');
  }

  roleBtn.dataset.menuId = 'invite-role';
  roleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    openRoleMenu(roleBtn, inviteRole, { onPick: (r) => { inviteRole = r; crossfadeText(roleLabel, r); } });
  });

  /* ── invite: chat-style, one person at a time ─────────────────────────────── */
  let activeIndex = -1;
  let resultsGen = 0;

  function hideResults() {
    const gen = ++resultsGen;
    const wasOpen = !results.hidden;
    results.classList.remove('is-open');
    activeIndex = -1;
    if (!wasOpen || prefersReducedMotion()) { results.hidden = true; results.innerHTML = ''; return; }
    setTimeout(() => { if (gen === resultsGen) { results.hidden = true; results.innerHTML = ''; } }, 200);
  }

  function resultRows() { return Array.from(results.querySelectorAll('.share-result')); }
  // `kbd` = the highlight was last moved by the keyboard (shows the ↵ keycap).
  function paintActiveRow(kbd = true) {
    results.classList.toggle('is-kbd', kbd);
    resultRows().forEach((r, i) => r.classList.toggle('is-active', i === activeIndex));
  }
  // Mouse takes over the SAME highlight (mousemove, not mouseenter, so rows
  // scrolling under a resting cursor during arrow-key nav don't steal it).
  results.addEventListener('mousemove', (e) => {
    const row = e.target.closest('.share-result');
    if (!row) return;
    const i = resultRows().indexOf(row);
    if (i === activeIndex && !results.classList.contains('is-kbd')) return;
    activeIndex = i;
    paintActiveRow(false);
  });

  function inviteAffordanceHtml() {
    return `<span class="share-result__invite"><span class="share-result__invite-label"><span class="share-result__invite-word">Invite</span></span></span>`;
  }

  function paintResults() {
    const q = input.value.trim().toLowerCase();
    if (!q) { hideResults(); return; }

    const gen = ++resultsGen;
    const firstOpen = results.hidden;

    const matches = directory
      .filter((p) => !onFile(p.email))
      .filter((p) => p.name.toLowerCase().includes(q) || (p.email || '').toLowerCase().includes(q))
      .slice(0, 6);

    results.innerHTML = '';
    activeIndex = -1;
    const looksEmail = EMAIL_RE.test(input.value.trim());
    if (!matches.length && !looksEmail) {
      results.innerHTML = `<div class="share-results__empty">No matches. Type a full email to invite someone new.</div>`;
      results.classList.toggle('is-first-open', firstOpen);
      results.hidden = false;
      requestAnimationFrame(() => { if (gen === resultsGen) results.classList.add('is-open'); });
      return;
    }
    matches.forEach((p) => {
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'share-result';
      row.innerHTML = `${avatarHtml(p.name, 'share-avatar--md')}<span class="share-result__text"><span class="share-result__name">${p.name}</span><span class="share-result__email">${p.email}</span></span>${inviteAffordanceHtml()}`;
      row.addEventListener('click', () => inviteNow({ name: p.name, email: p.email }));
      results.appendChild(row);
    });
    const email = input.value.trim();
    if (looksEmail && !directory.some((p) => (p.email || '').toLowerCase() === email.toLowerCase()) && !onFile(email)) {
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'share-result share-result--new';
      row.innerHTML = `${avatarHtml(email, 'share-avatar--md')}<span class="share-result__text"><span class="share-result__name">Invite ${email}</span><span class="share-result__email">Send an invitation by email</span></span>${inviteAffordanceHtml()}`;
      row.addEventListener('click', () => inviteNow({ name: nameFromEmail(email), email }));
      results.appendChild(row);
    }

    results.classList.toggle('is-first-open', firstOpen);
    if (firstOpen) {
      resultRows().forEach((row, i) => row.style.setProperty('--row-delay', `${Math.min(i, 6) * 22}ms`));
    }
    results.hidden = false;
    requestAnimationFrame(() => { if (gen === resultsGen) results.classList.add('is-open'); });
    // First row is active the moment results paint, so Return always has a target.
    if (resultRows().length) { activeIndex = 0; paintActiveRow(); }
  }

  function inviteNow(person) {
    if (onFile(person.email)) { flash(`${person.name} already has access`); input.value = ''; hideResults(); return; }
    const invited = { id: `p${nextId += 1}`, name: person.name, email: person.email, role: inviteRole, pending: true };
    people.unshift(invited);
    input.value = '';
    hideResults();
    paintSummary();
    if (view === 'collab') paintCollab();
    input.focus();
    flashInvited(invited);
  }

  /* ── toast (motion: expands/collapses its own height, blur-resolves) ──────── */
  let toastTimer = null;
  let toastGen = 0;

  function playToast(render) {
    clearTimeout(toastTimer);
    const gen = ++toastGen;
    const reduced = prefersReducedMotion();
    toast.style.cssText = '';
    render();
    toast.hidden = false;
    if (reduced) {
      toast.classList.add('is-show');
    } else {
      toast.style.height = '0px';
      toast.style.marginTop = '0px';
      toast.style.overflow = 'hidden';
      // eslint-disable-next-line no-unused-expressions
      toast.getBoundingClientRect();
      const targetH = toast.scrollHeight;
      toast.style.transition = `height 320ms ${RAIL_EASE}, margin-top 320ms ${RAIL_EASE}`;
      requestAnimationFrame(() => {
        if (gen !== toastGen) return;
        toast.style.height = `${targetH}px`;
        toast.style.marginTop = '12px';
        toast.classList.add('is-show');
      });
      setTimeout(() => { if (gen === toastGen) toast.style.cssText = ''; }, 380);
    }
    toastTimer = setTimeout(() => hideToast(gen), 2600);
  }

  function hideToast(gen) {
    if (gen !== toastGen) return; // superseded by a newer toast already
    toast.classList.remove('is-show');
    if (prefersReducedMotion()) { toast.hidden = true; toast.style.cssText = ''; return; }
    setTimeout(() => {
      if (gen !== toastGen) return;
      const h = toast.getBoundingClientRect().height;
      if (h < 1) { toast.hidden = true; toast.style.cssText = ''; return; }
      toast.style.height = `${h}px`;
      toast.style.marginTop = '12px';
      toast.style.overflow = 'hidden';
      // eslint-disable-next-line no-unused-expressions
      toast.getBoundingClientRect();
      toast.style.transition = `height 260ms ${RAIL_EASE}, margin-top 260ms ${RAIL_EASE}`;
      requestAnimationFrame(() => {
        if (gen !== toastGen) return;
        toast.style.height = '0px';
        toast.style.marginTop = '0px';
      });
      setTimeout(() => { if (gen === toastGen) { toast.hidden = true; toast.style.cssText = ''; } }, 300);
    }, 240);
  }

  function flash(msg) {
    playToast(() => {
      toast.classList.remove('share-toast--invite');
      toast.innerHTML = `<span class="share-toast__msg">${msg}</span>`;
    });
  }
  function flashInvited(person) {
    playToast(() => {
      toast.classList.add('share-toast--invite');
      toast.innerHTML = `<span class="share-toast__icon">${ICONS.check}</span><span class="share-toast__msg">Invited ${person.name}</span>`;
    });
  }

  input.addEventListener('input', paintResults);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      const rows = resultRows();
      if (!rows.length) return;
      e.preventDefault();
      activeIndex = e.key === 'ArrowDown' ? Math.min(activeIndex + 1, rows.length - 1) : Math.max(activeIndex - 1, 0);
      paintActiveRow();
      rows[activeIndex].scrollIntoView({ block: 'nearest' });
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      const rows = resultRows();
      if (rows.length) { (rows[activeIndex] || rows[0]).click(); return; }
      const v = input.value.trim();
      if (v && EMAIL_RE.test(v)) { inviteNow({ name: nameFromEmail(v), email: v }); return; }
      if (v) flash('Enter a full email, or pick someone from the list');
    }
  });
  document.addEventListener('click', (e) => { if (!modal.querySelector('.share-invite').contains(e.target)) hideResults(); });

  /* ── summary + collaborators list ─────────────────────────────────────────── */
  function paintSummary() {
    const list = roster().slice(0, 4);
    const reduced = prefersReducedMotion();
    const oldRects = new Map();
    if (!reduced) {
      summaryAvatars.querySelectorAll('.share-avatar[data-pid]').forEach((el) => oldRects.set(el.dataset.pid, el.getBoundingClientRect()));
    }

    summaryAvatars.innerHTML = list.map((p) => avatarHtml(p.name, 'share-avatar--sm share-avatar--ring', p.id)).join('');

    if (!reduced) {
      summaryAvatars.querySelectorAll('.share-avatar[data-pid]').forEach((el) => {
        const old = oldRects.get(el.dataset.pid);
        if (old) {
          // Existing avatar shifted position (a new one joined in front of
          // it) — FLIP: invert the delta, then release into the transition.
          const now = el.getBoundingClientRect();
          const dx = old.left - now.left;
          if (Math.abs(dx) > 0.5) {
            el.style.transition = 'none';
            el.style.transform = `translateX(${dx}px)`;
            // eslint-disable-next-line no-unused-expressions
            el.getBoundingClientRect();
            el.style.transition = `transform 380ms ${RAIL_EASE}`;
            requestAnimationFrame(() => { el.style.transform = ''; });
            el.addEventListener('transitionend', function onEnd(e) {
              if (e.propertyName !== 'transform') return;
              el.style.transition = '';
              el.removeEventListener('transitionend', onEnd);
            });
          }
        } else {
          // Brand-new avatar — scale/blur-resolve in from where it sits.
          el.classList.add('share-avatar--enter');
          el.addEventListener('animationend', function onA() {
            el.classList.remove('share-avatar--enter');
            el.removeEventListener('animationend', onA);
          }, { once: true });
        }
      });
    }

    const count = roster().length;
    crossfadeText(summaryCount, `${count} ${count === 1 ? 'person' : 'people'} with access`);
  }

  function collabCurrentCount() {
    return 1 + people.filter((p) => !p.pending).length; // owner + current collaborators
  }

  function collabRow(p, { pending = false } = {}) {
    const li = document.createElement('li');
    li.className = `share-collab__row${pending ? ' share-collab__row--pending' : ''}`;
    li.dataset.pid = p.id;
    li.innerHTML = `
      ${avatarHtml(p.name, 'share-avatar--md')}
      <span class="share-collab__who">
        <span class="share-collab__name">${p.name}${p.owner ? ' <span class="share-collab__you">(you)</span>' : ''}</span>
        <span class="share-collab__email">${p.email || ''}</span>
      </span>`;
    if (p.owner) {
      const tag = document.createElement('span');
      tag.className = 'share-collab__owner';
      tag.textContent = 'Owner';
      li.appendChild(tag);
    } else {
      if (pending) {
        const tag = document.createElement('span');
        tag.className = 'share-collab__pending-tag';
        tag.textContent = 'Pending';
        li.appendChild(tag);
      }
      const rb = document.createElement('button');
      rb.type = 'button';
      rb.className = 'share-collab__role';
      rb.dataset.menuId = p.id;
      rb.innerHTML = `<span>${p.role}</span><span class="share-role__caret">${ICONS.caret}</span>`;
      rb.addEventListener('click', (e) => {
        e.stopPropagation();
        openRoleMenu(rb, p.role, {
          onPick: (r) => {
            p.role = r;
            // Update the label in place (cross-fade) instead of a full
            // re-render, so the rest of the list never replays its stagger.
            const label = rb.querySelector('span:first-child');
            crossfadeText(label, r);
          },
          onRemove: () => removeCollabRow(li, p, pending),
          removeLabel: pending ? 'Cancel invitation' : 'Remove access',
        });
      });
      li.appendChild(rb);
    }
    return li;
  }

  function removeCollabRow(li, p, pending) {
    const commit = () => {
      const i = people.findIndex((x) => x.id === p.id);
      if (i >= 0) people.splice(i, 1);
      paintSummary();
      paintCollab();
      flash(pending ? `Invitation to ${p.name} cancelled` : `Removed ${p.name}`);
    };
    if (prefersReducedMotion() || !li.isConnected) { commit(); return; }
    const h = li.getBoundingClientRect().height;
    li.style.height = `${h}px`;
    li.style.overflow = 'hidden';
    // eslint-disable-next-line no-unused-expressions
    li.getBoundingClientRect();
    li.style.transition = `height 260ms ${RAIL_EASE}, opacity 220ms ease, padding-top 260ms ${RAIL_EASE}, padding-bottom 260ms ${RAIL_EASE}`;
    li.style.opacity = '0';
    requestAnimationFrame(() => {
      li.style.height = '0px';
      li.style.paddingTop = '0px';
      li.style.paddingBottom = '0px';
    });
    let done = false;
    const finish = () => { if (done) return; done = true; commit(); };
    li.addEventListener('transitionend', (e) => { if (e.propertyName === 'height') finish(); });
    setTimeout(finish, 320);
  }

  function paintCollab({ entering = false } = {}) {
    const current = [{ id: 'owner', name: owner.name, email: owner.email, role: 'Owner', owner: true }, ...people.filter((p) => !p.pending)];
    const pending = people.filter((p) => p.pending);
    crossfadeText(titleEl, `${current.length} ${current.length === 1 ? 'Collaborator' : 'Collaborators'} in this file`);
    collabList.innerHTML = '';
    current.forEach((p) => collabList.appendChild(collabRow(p)));
    pendingLabel.hidden = pending.length === 0;
    pendingList.hidden = pending.length === 0;
    pendingList.innerHTML = '';
    pending.forEach((p) => pendingList.appendChild(collabRow(p, { pending: true })));

    // Stagger rows in only on a fresh view entry, never on an in-view
    // re-render (role change, removal) — those already animate themselves.
    if (entering && !prefersReducedMotion()) {
      const rows = [...collabList.querySelectorAll('.share-collab__row'), ...pendingList.querySelectorAll('.share-collab__row')];
      rows.forEach((row, i) => {
        row.style.setProperty('--row-delay', `${Math.min(i, 8) * 22}ms`);
        row.classList.add('share-collab__row--enter');
        row.addEventListener('animationend', function onA() {
          row.classList.remove('share-collab__row--enter');
          row.removeEventListener('animationend', onA);
        }, { once: true });
      });
    }
  }

  paintSummary();
}
