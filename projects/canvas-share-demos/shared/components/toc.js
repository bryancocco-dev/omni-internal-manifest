/**
 * Contents rail — the chapter navigation on the page's left edge (toc.css).
 * Mechanism ported from the OMNI+ Canvas rail-handle + rail-panel (the
 * lease-campaign canvas_3 pattern): a full-height hairline with a chevron
 * pill straddling it; the pill toggles a chapters panel that slides out
 * from the page edge, the handle riding the panel's edge.
 *
 * - Chapter list built from the content sections (eyebrows as labels).
 * - Shows only past the cover; hides again over the end-card/colophon.
 * - Scroll-spies the active chapter (last chapter whose top crossed the
 *   upper third of the viewport).
 * - Collapsed rail idle-fades after a still moment (never while open),
 *   waking on scroll or the cursor reaching the left edge.
 * - Hides when the content column crowds the collapsed rail.
 * - Appended to <body>, NOT .doc: the doc animates transform/filter during
 *   entrances, which would break position:fixed inside it.
 *
 * NOTE: scroll listeners never fire in the automated preview tab — verify
 * the show/spy behavior in a real browser.
 */

const CLEARANCE = 80; // px of free space the collapsed rail needs
const IDLE_MS = 1600;

const CHEVRON = `<svg viewBox="0 0 10 10" fill="none" aria-hidden="true"><path d="M3.2 1.6 6.8 5 3.2 8.4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

export function initToc(root, content) {
  const chapters = content.sections.map((s) => ({ id: s.id, label: s.eyebrow || s.heading }));
  if (content.sources) chapters.push({ id: 'sources', label: content.sources.heading || 'Sources' });
  if (chapters.length < 2) return;

  // ONE container: the panel. Its right border IS the resting hairline, the
  // handle rides that edge as a child, and the chapter list already lives
  // inside — opening slides the whole container out, nothing slides over.
  const nav = document.createElement('nav');
  nav.className = 'doc-toc';
  nav.setAttribute('aria-label', 'Contents');
  nav.innerHTML = `
    <div class="doc-toc__panel" aria-hidden="true">
      <button class="doc-toc__handle" type="button" title="Open contents" aria-expanded="false">${CHEVRON}</button>
      <div class="doc-toc__list">
        <span class="doc-toc__label">Contents</span>
        ${chapters
          .map(
            (c, i) => `
          <button class="doc-toc__item" type="button" data-target="${c.id}">
            <span class="doc-toc__num">${String(i + 1).padStart(2, '0')}</span>
            <span class="doc-toc__text">${c.label}</span>
          </button>`
          )
          .join('')}
      </div>
    </div>`;
  document.body.appendChild(nav);

  const handle = nav.querySelector('.doc-toc__handle');
  const panel = nav.querySelector('.doc-toc__panel');
  const items = Array.from(nav.querySelectorAll('.doc-toc__item'));
  const targets = chapters
    .map((c) => root.querySelector(`[data-comment-target="${c.id}"]`))
    .filter(Boolean);
  const hero = root.querySelector('.doc-hero');
  const endcard = root.querySelector('.doc-endcard');

  /* ── open / close — the ported togglePanel ── */
  function togglePanel() {
    const open = nav.classList.toggle('is-open');
    handle.setAttribute('aria-expanded', open ? 'true' : 'false');
    handle.title = open ? 'Close contents' : 'Open contents';
    panel.setAttribute('aria-hidden', open ? 'false' : 'true');
    if (open) {
      nav.classList.remove('is-idle');
      if (idleTimer) clearTimeout(idleTimer);
    } else {
      wake();
    }
  }
  handle.addEventListener('click', togglePanel);

  // Click → glide to the chapter (panel stays open, like the reference).
  items.forEach((item) => {
    item.addEventListener('click', () => {
      const target = root.querySelector(`[data-comment-target="${item.dataset.target}"]`);
      if (!target) return;
      const top = target.getBoundingClientRect().top + window.scrollY - 84;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  /* ── idle fade (collapsed rail only) ── */
  let idleTimer = null;
  let hovered = false;
  function wake() {
    nav.classList.remove('is-idle');
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      if (!hovered && !nav.classList.contains('is-open')) nav.classList.add('is-idle');
    }, IDLE_MS);
  }
  nav.addEventListener('mouseenter', () => {
    hovered = true;
    nav.classList.remove('is-idle');
    if (idleTimer) clearTimeout(idleTimer);
  });
  nav.addEventListener('mouseleave', () => {
    hovered = false;
    wake();
  });
  window.addEventListener('mousemove', (e) => {
    if (e.clientX < 240 && nav.classList.contains('is-idle')) wake();
  }, { passive: true });

  /* ── visibility + scroll-spy ── */
  function sync() {
    const past = hero ? window.scrollY > hero.offsetHeight * 0.72 : window.scrollY > 300;
    const beforeEnd = !endcard || endcard.getBoundingClientRect().top > window.innerHeight * 0.5;
    nav.classList.toggle('is-shown', past && beforeEnd);
    if (past && beforeEnd) wake();

    const line = window.innerHeight * 0.34;
    let active = 0;
    targets.forEach((t, i) => {
      if (t.getBoundingClientRect().top <= line) active = i;
    });
    items.forEach((item, i) => item.classList.toggle('is-active', i === active));
  }

  /* ── crowding — the collapsed rail needs a sliver of free margin ── */
  const inner = root.querySelector('.doc-inner');
  function checkSpace() {
    if (!inner) return;
    nav.classList.toggle('is-crowded', inner.getBoundingClientRect().left < CLEARANCE);
  }
  if ('ResizeObserver' in window && inner) {
    new ResizeObserver(checkSpace).observe(root);
  }
  window.addEventListener('resize', checkSpace, { passive: true });

  window.addEventListener('scroll', sync, { passive: true });
  sync();
  checkSpace();
}
