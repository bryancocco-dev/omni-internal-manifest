/**
 * Renders a read-only canvas document from a structured content object
 * (see shared/content/*.json for the schema). This is the reuse point for
 * every demo: a new example should only need new content + a 3-line entry
 * file, not new markup logic.
 */
import { initReveal } from './reveal.js';
import { initComments, setPeople, initials } from './comment-affordance.js';
import { initCommentsPanel, avatarColor } from './comments-panel.js';
import { triggerDownload } from './download-affordance.js';
import { renderBarChart } from './chart.js';
import { initSmoothScroll } from './smooth-scroll.js';
import { initColumnResize } from './column-resize.js';
import { initShareModal } from './share-modal.js';
import { initIntro } from './intro.js';
import { shouldGate, initGate } from './gate.js';
import { initTheme, initThemePicker, renderBrandLockup, getActiveBrand } from './themes.js';
import { initScopeTable } from './scope-table.js';
import { initToc } from './toc.js';
import { resolveCoverTemplate, applyGenerativeCover, updateGenCoverDimensions } from './cover-gen.js';
import { onPublishChange, publish } from './publish-state.js';

// Publish CTA icons — lifted verbatim (PLAN-PUBLISH.md), not redrawn. Check
// icon is the same mark used for the Download button's "done" state below.
const PUBLISH_ICON = `<svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M8 10.5v-8m0 0L4.5 6M8 2.5 11.5 6"/><path d="M2.5 10.5v2a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-2"/></svg>`;
const PUBLISH_CHECK_ICON = `<svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M3.5 8.5 6.5 11.5 12.5 5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

function el(tag, className, html) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (html !== undefined) node.innerHTML = html;
  return node;
}

/* Board-header affordance cluster (search + kebab), top-right of every board —
   verbatim icons from the established OMNI+ Canvas boards (lease-campaign /
   copy-request-access's .scope-table-search-icon + kebab), not reinvented.
   Decorative here. */
const BOARD_TOOLS_HTML = `
  <div class="doc-board-tools" aria-hidden="true">
    <span class="doc-board-tool doc-board-tool--search" title="Search this board">
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="5" stroke="currentColor" stroke-width="1.5"/><path d="M10.5 10.5L14 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
    </span>
    <span class="doc-board-tool doc-board-tool--kebab" title="More">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><circle cx="8" cy="3.5" r="1.4"/><circle cx="8" cy="8" r="1.4"/><circle cx="8" cy="12.5" r="1.4"/></svg>
    </span>
  </div>`;

function addBoardTools(section) {
  section.insertAdjacentHTML('afterbegin', BOARD_TOOLS_HTML);
}

/** Header "Publish to Workspace" CTA — mirrors the co-brand lockup's live
    binding to the active theme (re-reads getActiveBrand() on theme:changed)
    and subscribes to the shared publish-state module so this button and the
    Share modal's workspace row always agree. */
function initPublishButton(root, fallbackName = 'Workspace') {
  const btn = root.querySelector('.doc-header__publish');
  if (!btn) return;
  const iconSlot = btn.querySelector('.doc-header__publish-icon');
  const labelSlot = btn.querySelector('.doc-header__publish-label');
  const workspaceName = () => (getActiveBrand() || {}).name || fallbackName;

  let status = 'idle';
  const render = () => {
    const ws = workspaceName();
    btn.classList.toggle('is-done', status === 'published');
    if (status === 'idle') {
      btn.disabled = false;
      btn.removeAttribute('aria-busy');
      iconSlot.innerHTML = PUBLISH_ICON;
      labelSlot.textContent = 'Publish to Workspace';
      const label = `Publish to the ${ws} workspace`;
      btn.title = label;
      btn.setAttribute('aria-label', label);
    } else if (status === 'busy') {
      btn.disabled = true;
      btn.setAttribute('aria-busy', 'true');
      iconSlot.innerHTML = PUBLISH_ICON;
      labelSlot.textContent = 'Publishing…';
      const label = `Publishing to the ${ws} workspace…`;
      btn.title = label;
      btn.setAttribute('aria-label', label);
    } else {
      btn.disabled = false;
      btn.removeAttribute('aria-busy');
      iconSlot.innerHTML = PUBLISH_CHECK_ICON;
      labelSlot.textContent = 'Published';
      const label = `Live in the ${ws} workspace`;
      btn.title = label;
      btn.setAttribute('aria-label', label);
    }
  };

  onPublishChange((next) => { status = next; render(); });
  document.addEventListener('theme:changed', render);

  btn.addEventListener('click', () => {
    if (status === 'idle') publish();
  });
}

function renderHeader(meta) {
  const bar = el('div', 'doc-header');
  bar.innerHTML = `
    <div class="doc-header__inner">
      <span class="doc-header__brand">
        <img class="doc-header__logo" src="../../shared/assets/omni-logo.svg" alt="OMNI+" />
        <span class="doc-header__cobrand-slot"></span>
        <span class="doc-header__divider"></span>
        <span class="doc-header__context">
          <span class="doc-header__title">${meta.docTitle}</span>
          <span class="doc-header__status">Read-only</span>
        </span>
      </span>
      <span class="doc-header__actions">
        <button class="doc-header__download doc-header__publish" type="button">
          <span class="doc-header__publish-icon">${PUBLISH_ICON}</span>
          <span class="doc-header__publish-label">Publish to Workspace</span>
        </button>
        <button class="doc-header__download" type="button" title="Download full report">
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2.5v8m0 0L4.5 7m3.5 3.5L11.5 7M2.5 13.5h11"/></svg>
          Download
        </button>
        <button class="doc-header__btn" type="button">
          Share
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M11.5 5.5L6 8.5M11.5 10.5L6 7.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><circle cx="12.5" cy="4" r="1.6" stroke="currentColor" stroke-width="1.2"/><circle cx="3.5" cy="8" r="1.6" stroke="currentColor" stroke-width="1.2"/><circle cx="12.5" cy="12" r="1.6" stroke="currentColor" stroke-width="1.2"/></svg>
        </button>
      </span>
    </div>`;
  return bar;
}

// The blue "end-card": OMNI mark + eyebrow, the masked shape graphic as the
// hero (it spins — see footer.css). Credits live on their OWN board above
// this one (renderContributors).
function renderEndcard(content) {
  const { meta } = content;
  const endcard = el('section', 'doc-endcard');
  endcard.dataset.reveal = '';
  endcard.innerHTML = `
    <div class="doc-endcard__top">
      <img class="doc-endcard__mark" src="../../shared/assets/omni-logo.svg" alt="OMNI+" />
      <span class="doc-endcard__eyebrow">${meta.docTitle} · ${meta.clientName} · ${meta.date}</span>
    </div>
    <div class="doc-endcard__shape-row">
      <div class="doc-endcard__shape" aria-hidden="true"></div>
    </div>`;
  return endcard;
}

// Contributors — a standalone colophon board that closes the document stack,
// sitting above the end-card as its own component. Each contributor reuses
// the collaborator identity system (deterministic avatar colour + initials):
// avatar, name, and the mono ROLE · ORG tag — nothing more.
function renderContributors(content) {
  const credits = content.credits || [];
  if (!credits.length) return null;
  const section = el('section', 'doc-section doc-contributors');
  const cells = credits
    .map(
      (c) => `
      <div class="doc-contributor" data-reveal>
        <span class="doc-contributor__avatar" style="--av: ${avatarColor(c.name)}">${initials(c.name)}</span>
        <span class="doc-contributor__meta">
          <span class="doc-contributor__name">${c.name}</span>
          <span class="doc-contributor__tag">${c.role}${c.org ? ` · ${c.org}` : ''}</span>
          ${c.email ? `<a class="doc-contributor__contact" href="mailto:${c.email}">${c.email}</a>` : ''}
          ${c.phone ? `<span class="doc-contributor__contact">${c.phone}</span>` : ''}
        </span>
      </div>`
    )
    .join('');
  // No board tools here — this is the colophon, not a content board.
  section.innerHTML = `
    <span class="doc-eyebrow" data-reveal>Created By</span>
    <div class="doc-contributors__grid">${cells}</div>`;
  return section;
}

// Full-bleed OMNI footer bar: copyright left · centered OMNI logo · links right.
function renderColophon(content) {
  const { meta, footer = {} } = content;
  const links = (footer.links || ['FAQs', 'Code of Conduct', 'Acceptable Use Policy'])
    .map((l) => `<a href="#" onclick="return false">${l}</a>`).join('');
  const year = (meta.date.match(/\d{4}/) || [''])[0];
  const copyright = footer.copyright || meta.clientName;
  const colophon = el('footer', 'doc-colophon');
  colophon.innerHTML = `
    <div class="doc-colophon__inner">
      <span class="doc-colophon__left">
        <span class="doc-colophon__copy">© ${year} ${copyright}</span>
      </span>
      <span class="doc-colophon__lockup">
        <img class="doc-colophon__logo" src="../../shared/assets/omni-logo.svg" alt="OMNI+" />
        <span class="doc-colophon__cobrand-slot"></span>
      </span>
      <span class="doc-colophon__links">${links}</span>
    </div>`;
  // Same co-brand lockup as the header — the × + brand mark + name, live to
  // theme changes.
  renderBrandLockup(colophon.querySelector('.doc-colophon__cobrand-slot'));
  return colophon;
}

/**
 * Full-bleed 100vh hero. Replaces the old metadata-block + inset-image cover
 * (which read as a PDF): edge-to-edge cinematic image, type composed ON it,
 * choreographed load, parallax hand-off into the document below.
 *
 * Two art sources: a generative OMNI ring cover (PLAN-COVERS.md), chosen by
 * resolveCoverTemplate() from cover.template + the URL's ?cover/?tag/?gen
 * (see cover-gen.js) — or, when no template resolves, the original photo
 * <img>, byte-for-byte the same markup this always rendered.
 */
function renderHero(cover, meta) {
  const hero = el('section', 'doc-hero');
  const metaCells = (cover.meta || [])
    .map((m) => `<div class="doc-hero__cell"><span class="doc-hero__lbl">${m.label}</span><span class="doc-hero__val">${m.value}</span></div>`)
    .join('');
  const date = String(cover.date || meta.sentAt || meta.date).split(' · ')[0];
  const typeBlock = `
      <div class="doc-hero__type">
        <h1 class="doc-hero__title">${cover.title}</h1>
        <p class="doc-hero__subtitle">${cover.subtitle}</p>
      </div>`;
  const metaRail = `
      <div class="doc-hero__meta">
        ${metaCells}
        <div class="doc-hero__cell doc-hero__cell--date"><span class="doc-hero__lbl">Sent</span><span class="doc-hero__val">${date}</span></div>
      </div>`;
  /* The generative cover's tag slot lives INSIDE the meta rail, not as a
     sibling above it. As a sibling it was a flex item in .doc-hero__inner's
     column, so it occupied its own height plus the column `gap` (up to 44px)
     and shoved the title/subtitle block that much further off the hairline —
     with nothing on the left at that height, it read as a void. Bryan, on a
     1241px-tall viewport: "why is the headline and sub copy so far away from
     the hairline?" Absolutely positioned against the rail (which is already
     position:relative) it costs the column no height at all, and `bottom:100%`
     pins it to the rail's own top edge — which is exactly where the hairline
     is drawn (.doc-hero__meta::before, top:0). */
  const metaRailWithTag = metaRail.replace(
    '<div class="doc-hero__meta">',
    '<div class="doc-hero__meta"><div class="doc-hero__tag" aria-hidden="true"></div>'
  );
  const scrollAffordance = `
    <div class="doc-hero__scroll" aria-hidden="true">
      <span class="doc-hero__scroll-label">Scroll</span>
      <span class="doc-hero__scroll-line"></span>
    </div>`;

  const genTemplate = resolveCoverTemplate(cover, location.search);
  if (genTemplate) {
    hero.classList.add('doc-hero--gen');
    hero.innerHTML = `
    <div class="doc-hero__media"></div>
    <div class="doc-hero__scrim" aria-hidden="true"></div>
    <div class="doc-hero__inner">
      ${typeBlock}
      ${metaRailWithTag}
    </div>
    ${scrollAffordance}`;
    // Ring divs + the tag slot's contents (module-load-order guaranteed
    // synchronous — see cover-gen.js's top-of-file comment).
    // FIX 3 (PLAN-COVERS.md): the tag's SPEC/ORBIT lockups used to carry
    // book-ends' own hardcoded client + book-cover export size. Bind them
    // to THIS document instead — meta.clientName, and the hero's real
    // rendered pixel size. The hero is a 100vw × 100vh surface (hero.css),
    // so the live viewport IS that size; it can't be measured via
    // getBoundingClientRect() here because `hero` isn't attached to the
    // document yet at this point in renderDoc()'s build sequence.
    applyGenerativeCover(hero, {
      ...genTemplate,
      clientName: meta.clientName,
      dimensions: `${Math.round(window.innerWidth)} × ${Math.round(window.innerHeight)}`,
    });
    return hero;
  }

  // Resolution-aware cover: imageSet lets the browser pick by viewport × DPR
  // (a 2k display at DPR 2 genuinely consumes the 4k file).
  const srcset = (cover.imageSet || []).map((s) => `${s.src} ${s.w}w`).join(', ');
  hero.innerHTML = `
    <div class="doc-hero__media"><img class="doc-hero__img" src="${cover.image}"${srcset ? ` srcset="${srcset}" sizes="100vw"` : ''} alt="" /></div>
    <div class="doc-hero__scrim" aria-hidden="true"></div>
    <div class="doc-hero__inner">
      ${typeBlock}
      ${metaRail}
    </div>
    ${scrollAffordance}`;
  return hero;
}

/** Theme-driven hero backdrop: workspace brands carry their own 4k cover
    (themes.js getActiveBrand().heroUrl); everything else — Corvache, plain
    OMNI light/dark — keeps the document's own image + srcset. Swaps live on
    theme change with a soft dip-to-loaded crossfade. */
function initHeroTheming(hero) {
  // Generative covers have no <img> — the ring already reads --doc-accent
  // live (plain CSS var), so there's nothing for a theme change to swap.
  if (hero.classList.contains('doc-hero--gen')) return;
  const img = hero.querySelector('.doc-hero__img');
  if (!img) return;
  const original = {
    src: img.getAttribute('src'),
    srcset: img.getAttribute('srcset'),
    sizes: img.getAttribute('sizes'),
  };
  img.style.transition = 'opacity 420ms ease';
  const apply = () => {
    const brand = getActiveBrand();
    const nextSrc = brand && brand.heroUrl ? brand.heroUrl : original.src;
    if (img.getAttribute('src') === nextSrc) return;
    img.style.opacity = '0';
    const swap = () => {
      if (brand && brand.heroUrl) {
        img.removeAttribute('srcset');
        img.removeAttribute('sizes');
      } else if (original.srcset) {
        img.setAttribute('srcset', original.srcset);
        img.setAttribute('sizes', original.sizes || '100vw');
      }
      img.addEventListener('load', () => { img.style.opacity = ''; }, { once: true });
      img.src = nextSrc;
      // If the image is already cached, `load` may not fire — belt & braces.
      setTimeout(() => { img.style.opacity = ''; }, 900);
    };
    setTimeout(swap, 200);
  };
  apply();
  document.addEventListener('theme:changed', apply);
}

/** Parallax hand-off: the image drifts slower than the page and the type
    releases, so the hero → document transition reads designed, not abrupt. */
function initHeroParallax(hero) {
  // The right rail's hairline ARRIVES like the left TOC rail — same
  // past-the-cover threshold, same rise + focus-pull signature (CSS in
  // comments-panel.css). Under reduced motion the line is simply present.
  const rail = document.querySelector('.doc-rail');
  const syncRailShown = () => {
    if (rail) rail.classList.toggle('is-past-cover', window.scrollY > hero.offsetHeight * 0.72);
  };
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    rail?.classList.add('is-past-cover');
    return;
  }
  const media = hero.querySelector('.doc-hero__media');
  const inner = hero.querySelector('.doc-hero__inner');
  const scroll = hero.querySelector('.doc-hero__scroll');
  let ticking = false;
  const paint = () => {
    const y = window.scrollY;
    const h = hero.offsetHeight || 1;
    const p = Math.min(1, Math.max(0, y / h));
    media.style.transform = `translate3d(0, ${y * 0.34}px, 0) scale(${1 + p * 0.06})`;
    inner.style.transform = `translate3d(0, ${y * 0.14}px, 0)`;
    inner.style.opacity = String(Math.max(0, 1 - p * 1.5));
    if (scroll) scroll.style.opacity = String(Math.max(0, 1 - p * 3));
    ticking = false;
  };
  // The right rail's hairline starts where the cover ends and STOPS at the
  // colophon's top hairline (the vertical and horizontal lines meet, never
  // cross) — feed it both edges in viewport space. Deliberately OUTSIDE the
  // rAF/ticking guard: two cheap read+writes, and if a frame is ever starved
  // (background/throttled tab) `ticking` latches true and everything behind
  // it stops updating for good.
  const colophonEl = () => document.querySelector('.doc-colophon');
  const syncRail = () => {
    syncRailShown();
    document.documentElement.style.setProperty(
      '--rail-top', `${Math.max(0, hero.getBoundingClientRect().bottom)}px`
    );
    const colo = colophonEl();
    if (colo) {
      document.documentElement.style.setProperty(
        '--rail-bottom',
        `${Math.max(0, window.innerHeight - colo.getBoundingClientRect().top)}px`
      );
    }
  };
  window.addEventListener('scroll', () => {
    syncRail();
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(paint);
  }, { passive: true });
  window.addEventListener('resize', syncRail, { passive: true });
  syncRail();
  paint();
}

function renderCover(cover, meta) {
  const board = el('section', 'doc-cover');
  const metaRows = (cover.meta || [])
    .map((m) => `<div class="row"><span class="lbl">${m.label}</span><span class="val">${m.value}</span></div>`)
    .join('');
  // With a photo: a clean, unlabeled image. Without: the branded gradient.
  const art = cover.image
    ? `<div class="doc-cover__art doc-cover__art--photo" data-reveal>
        <img class="doc-cover__art-img" src="${cover.image}" alt="" loading="lazy" />
      </div>`
    : `<div class="doc-cover__art" data-reveal></div>`;
  // Clean date, upper-right of the cover (the send date, sans time/label).
  const coverDate = String(cover.date || meta.sentAt || meta.date).split(' · ')[0];
  board.innerHTML = `
    <div class="doc-cover__meta" data-reveal>
      <div class="doc-cover__meta-list">${metaRows}</div>
      <span class="doc-cover__meta-date">${coverDate}</span>
    </div>
    ${cover.kicker ? `<span class="doc-cover__kicker" data-reveal>${cover.kicker}</span>` : ''}
    <h1 class="doc-cover__title" data-reveal>${cover.title}</h1>
    <p class="doc-cover__subtitle" data-reveal>${cover.subtitle}</p>
    ${art}`;
  return board;
}

function renderProse(section) {
  return `
    <span class="doc-eyebrow" data-reveal>${section.eyebrow}</span>
    <h2 class="doc-heading doc-heading--sub" data-reveal>${section.heading}</h2>
    <div data-reveal>${section.body.map((p) => `<p class="doc-body">${p}</p>`).join('')}</div>`;
}

function renderStats(section) {
  const stats = section.stats
    .map(
      (s) => `
      <div class="doc-stat" data-reveal>
        <p class="doc-stat__value">${s.value}<span>${s.unit || ''}</span></p>
        <p class="doc-stat__label">${s.label}</p>
        ${s.tag ? `<span class="doc-chip doc-stat__tag">${s.tag}</span>` : ''}
      </div>`
    )
    .join('');
  return `
    <span class="doc-eyebrow" data-reveal>${section.eyebrow}</span>
    <h2 class="doc-heading doc-heading--sub" data-reveal>${section.heading}</h2>
    <div class="doc-stats">${stats}</div>`;
}

function renderChart(section, wrapper) {
  wrapper.innerHTML = `
    <span class="doc-eyebrow" data-reveal>${section.eyebrow}</span>
    <h2 class="doc-heading doc-heading--sub" data-reveal>${section.heading}</h2>`;
  const chartBox = el('div', 'doc-chart');
  chartBox.dataset.reveal = '';
  chartBox.appendChild(renderBarChart(section.chart));
  const caption = el('div', 'doc-chart__caption');
  caption.innerHTML = `<span>${section.chart.caption || ''}</span><span>${section.chart.source || ''}</span>`;
  chartBox.appendChild(caption);
  wrapper.appendChild(chartBox);
}

function renderFindings(section) {
  const items = section.items
    .map(
      (item, i) => `
      <li data-reveal>
        <span class="doc-findings__index">${String(i + 1).padStart(2, '0')}</span>
        <div class="doc-findings__text">
          <h3>${item.title}</h3>
          <p>${item.body}</p>
        </div>
      </li>`
    )
    .join('');
  return `
    <span class="doc-eyebrow" data-reveal>${section.eyebrow}</span>
    <h2 class="doc-heading doc-heading--sub" data-reveal>${section.heading}</h2>
    <ul class="doc-findings">${items}</ul>`;
}

function renderBrief(section) {
  return `
    <span class="doc-eyebrow" data-reveal>${section.eyebrow}</span>
    <h2 class="doc-heading doc-heading--sub" data-reveal>${section.heading}</h2>
    <div class="doc-brief" data-reveal>
      ${section.body.map((p) => `<p class="doc-body">${p}</p>`).join('')}
    </div>`;
}

/* ── Interactive scope table (behavior wired post-mount by initScopeTable) ── */

const SORT_ICONS = `
  <span class="scope-sort-icons" aria-hidden="true">
    <svg viewBox="0 0 8 5" width="8" height="5" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3.5L4 1.5L6 3.5"/></svg>
    <svg viewBox="0 0 8 5" width="8" height="5" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M2 1.5L4 3.5L6 1.5"/></svg>
  </span>`;

const SCOPE_CHECK = `<svg class="scope-check-icon" viewBox="0 0 16 16" fill="none"><path d="M3.5 8L6.5 11L12.5 5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const SCOPE_COLUMNS = [
  { label: 'Dimension', type: 'text' },
  { label: 'Working Assumption', type: 'text' },
  { label: 'Status', type: 'status' },
  { label: 'Owner', type: 'text' },
];

function renderTable(section, wrapper) {
  wrapper.classList.add('doc-section--table');
  const t = section.table || {};
  const columns = t.columns || SCOPE_COLUMNS;
  const rows = t.rows || [];

  const ths = columns
    .map((c, i) => `<th><button class="scope-sort-btn" type="button" data-col="${i}" data-type="${c.type || 'text'}"><span>${c.label}</span>${SORT_ICONS}</button></th>`)
    .join('');
  const trs = rows
    .map((r, i) => `
      <tr>
        <td class="scope-rownum">${String(i + 1).padStart(2, '0')}</td>
        <td class="scope-select"><button class="scope-checkbox" type="button" aria-label="Select row">${SCOPE_CHECK}</button></td>
        <td>${r.dimension}</td>
        <td>${r.assumption}</td>
        <td><span class="scope-status ${r.status}">${r.status.charAt(0).toUpperCase() + r.status.slice(1)}</span></td>
        <td>${r.owner}</td>
      </tr>`)
    .join('');

  wrapper.innerHTML = `
    <span class="doc-eyebrow" data-reveal>${section.eyebrow}</span>
    <h2 class="doc-heading doc-heading--sub" data-reveal>${section.heading}</h2>
    ${section.intro ? `<p class="doc-body doc-scope-intro" data-reveal>${section.intro}</p>` : ''}
    <div class="scope-controls">
      <div class="scope-search">
        <svg class="scope-search-icon" width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="7" cy="7" r="5" stroke="currentColor" stroke-width="1.5"/><path d="M10.5 10.5L14 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        <input type="search" placeholder="Filter rows…" autocomplete="off" aria-label="Filter rows" />
        <div class="scope-search-affordances">
          <button class="scope-search-clear" type="button" aria-label="Clear filter">
            <svg viewBox="0 0 8 8" fill="none" aria-hidden="true"><path d="M1.5 1.5L6.5 6.5M6.5 1.5L1.5 6.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
          </button>
          <span class="scope-search-count">${rows.length} rows</span>
        </div>
      </div>
      <button class="scope-expand-toggle" type="button" aria-pressed="false" aria-label="Expand all rows" title="Expand all rows">
        <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <line class="scope-expand-line scope-expand-line--top" x1="3.5" y1="5.5" x2="12.5" y2="5.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
          <line class="scope-expand-line scope-expand-line--mid" x1="3.5" y1="8" x2="12.5" y2="8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
          <line class="scope-expand-line scope-expand-line--bot" x1="3.5" y1="10.5" x2="12.5" y2="10.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
        </svg>
      </button>
      <div class="scope-menu-wrap">
        <button class="scope-menu-btn" type="button" aria-label="More options" aria-haspopup="menu" aria-expanded="false">
          <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><circle cx="8" cy="3.5" r="1.4"/><circle cx="8" cy="8" r="1.4"/><circle cx="8" cy="12.5" r="1.4"/></svg>
        </button>
        <div class="scope-menu" role="menu">
          <button role="menuitem" class="scope-menu-item" data-action="download-csv">
            <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2.5v8m0 0L4.5 7m3.5 3.5L11.5 7M2.5 13.5h11"/></svg>
            <span>Download as CSV</span>
          </button>
          <button role="menuitem" class="scope-menu-item" data-action="copy-all">
            <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><rect x="4.5" y="4.5" width="8" height="9" rx="1.5"/><path d="M3 11.5V4a2 2 0 0 1 2-2h6.5"/></svg>
            <span>Copy all rows</span>
          </button>
          <div class="scope-menu-divider" role="separator"></div>
          <button role="menuitem" class="scope-menu-item" data-action="reset">
            <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M13 8a5 5 0 1 1-1.5-3.5"/><path d="M13 3v2.5h-2.5"/></svg>
            <span>Reset filters &amp; sort</span>
          </button>
        </div>
      </div>
    </div>
    <div class="scope-table-wrap">
      <table class="scope-table" aria-label="${t.ariaLabel || section.heading}">
        <thead>
          <tr>
            <th class="scope-rownum-th">#</th>
            <th class="scope-select-th">
              <button class="scope-checkbox scope-checkbox--header" type="button" aria-label="Select all rows">${SCOPE_CHECK}</button>
            </th>
            ${ths}
          </tr>
        </thead>
        <tbody>${trs}</tbody>
      </table>
    </div>`;
}

const SECTION_RENDERERS = {
  prose: renderProse,
  stats: renderStats,
  findings: renderFindings,
  brief: renderBrief,
};

function renderSection(section) {
  const wrapper = el('section', 'doc-section');
  wrapper.dataset.commentTarget = section.id;
  if (section.type === 'chart') {
    renderChart(section, wrapper);
  } else if (section.type === 'table') {
    // The table board carries its own FUNCTIONAL tool cluster (search /
    // expand-all / kebab) in the board-tools position — no decorative set.
    renderTable(section, wrapper);
    return wrapper;
  } else {
    wrapper.innerHTML = SECTION_RENDERERS[section.type](section);
  }
  addBoardTools(wrapper);
  return wrapper;
}

function renderSourcesBoard(sources) {
  const section = el('section', 'doc-section doc-sources-section');
  section.dataset.commentTarget = 'sources';
  const rows = (sources.rows || [])
    .map((r, i) => {
      const titleHtml = r.url ? `<a href="${r.url}" target="_blank" rel="noopener">${r.source}</a>` : r.source;
      return `
      <tr>
        <td class="doc-source-n">${String(i + 1).padStart(2, '0')}</td>
        <td class="doc-source-title">${titleHtml}</td>
        <td class="doc-source-tag">${r.type}</td>
        <td class="doc-source-rel ${r.relevance}"><span class="doc-source-rel-pip">${r.relevance}</span></td>
        <td class="doc-source-coverage">${r.coverage}</td>
      </tr>`;
    })
    .join('');
  section.innerHTML = `
    <h2 class="doc-sources-h" data-reveal>${sources.heading}</h2>
    <p class="doc-sources-summary" data-reveal>${sources.summary}</p>
    <div class="doc-sources-table-wrap" data-reveal>
      <table class="doc-sources-table" aria-label="Source inventory">
        <thead>
          <tr><th>#</th><th>Source</th><th>Type</th><th>Relevance</th><th>Key Coverage</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
  addBoardTools(section);
  return section;
}

function reportAsMarkdown(content) {
  const lines = [`# ${content.meta.docTitle}`, '', `_${content.meta.date} · prepared for ${content.meta.clientName}_`, ''];
  lines.push('## Note', '', content.sender.note, '', `— ${content.sender.name}, ${content.sender.role}`, '');
  content.sections.forEach((s) => {
    lines.push(`## ${s.heading}`, '');
    if (s.type === 'prose' || s.type === 'brief') lines.push(...s.body, '');
    if (s.type === 'stats') lines.push(...s.stats.map((st) => `- **${st.value}${st.unit || ''}** — ${st.label}`), '');
    if (s.type === 'chart') lines.push(...s.chart.labels.map((l, i) => `- ${l}: ${s.chart.values[i]}${s.chart.unit || ''}`), '');
    if (s.type === 'findings') lines.push(...s.items.map((it) => `- **${it.title}** — ${it.body}`), '');
    if (s.type === 'table') {
      if (s.intro) lines.push(s.intro, '');
      lines.push(...(s.table?.rows || []).map((r) => `- **${r.dimension}** — ${r.assumption} _(${r.status}, ${r.owner})_`), '');
    }
  });
  if (content.sources) {
    lines.push(`## ${content.sources.heading}`, '', content.sources.summary, '');
    lines.push(...content.sources.rows.map((r) => `- **${r.source}** (${r.type}, ${r.relevance}) — ${r.coverage}`), '');
  }
  if (content.credits && content.credits.length) {
    lines.push('---', '', `_Created by ${content.credits.map((c) => `${c.name} (${c.role})`).join(', ')}_`, '');
  }
  lines.push('---', '', content.cta.body);
  return lines.join('\n');
}

/**
 * @param {HTMLElement} root - mount point (e.g. document.querySelector('.doc'))
 * @param {object} content - parsed content JSON
 * @param {string} pageSlug - unique id for this demo, used to namespace comment storage
 */
const DEFAULT_PEOPLE = [
  { name: 'Mara Lindqvist', email: 'mara.lindqvist@palomar.co' },
  { name: 'Nick Zinner', email: 'nick.zinner@palomar.co' },
  { name: 'Devon Reyes', email: 'devon.reyes@corvache.com' },
  { name: 'Priya Anand', email: 'priya.anand@corvache.com' },
  { name: 'Jessie Harte', email: 'jessie.harte@corvache.com' },
  { name: 'Ray Okafor', email: 'ray.okafor@palomar.co' },
];

export function renderDoc(root, content, pageSlug) {
  setPeople(content.people || DEFAULT_PEOPLE);

  // Theme first — everything below consumes its tokens. Applied before the
  // content paints so nothing flashes an unthemed frame.
  initTheme();

  // The gate and the branded intro are two competing entrances — only one runs.
  // Gated: the document must be VISIBLE (frosted) behind the card, so the
  // intro's hide-content state must NOT be applied.
  const gated = shouldGate();
  if (!gated) root.classList.add('doc--intro-init');

  // Header is full-bleed (direct child of the page container); the boards
  // and footer all live in the centered max-width column (.doc-inner).
  root.appendChild(renderHeader(content.meta));
  // The OMNI mark in the header is the Themes trigger.
  initThemePicker();
  // Co-brand lockup sits beside it — the theming's payoff in the nav.
  const cobrandSlot = root.querySelector('.doc-header__cobrand-slot');
  if (cobrandSlot) renderBrandLockup(cobrandSlot);
  // Publish CTA — first of the three header actions (Publish · Download · Share).
  initPublishButton(root, content.meta.clientName);

  // Hero is full-bleed → a direct child of the root, NOT the centred column.
  let hero = null;
  if (content.cover) {
    hero = renderHero(content.cover, content.meta);
    root.appendChild(hero);
    // FIX 3: only NOW does the hero have a real layout box to measure —
    // corrects the generative cover's DIMENSIONS slot from the
    // window-size-at-build-time guess renderHero() had to make. Also
    // re-run on resize: the viewport can still settle AFTER this point
    // (confirmed empirically — automation that sets the window size on
    // launch can resize again a beat later; a real browser hits the same
    // class of thing when e.g. a mobile address bar collapses post-load),
    // and 100vh tracks that live, so the printed size should too.
    updateGenCoverDimensions(hero);
    window.addEventListener('resize', () => updateGenCoverDimensions(hero), { passive: true });
  }

  const inner = el('div', 'doc-inner');
  content.sections.forEach((s) => inner.appendChild(renderSection(s)));
  if (content.sources) inner.appendChild(renderSourcesBoard(content.sources));
  const contributors = renderContributors(content);
  if (contributors) inner.appendChild(contributors);
  inner.appendChild(renderEndcard(content));
  root.appendChild(inner);

  // Table boards wire their behavior only once they're IN the document —
  // the clamp/expand logic measures rendered layout.
  inner.querySelectorAll('.doc-section--table').forEach((elm) => initScopeTable(elm));

  // Nav download button → generates + downloads the report (Markdown), with a
  // brief "done" state. Same content the CTA card used to produce.
  if (content.download) {
    const dlBtn = root.querySelector('.doc-header__download:not(.doc-header__publish)');
    if (dlBtn) {
      const dlDefault = dlBtn.innerHTML;
      const dlDone = `<svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M3.5 8.5 6.5 11.5 12.5 5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>Downloaded`;
      let resetT = null;
      dlBtn.addEventListener('click', () => {
        triggerDownload(content.download.filename, reportAsMarkdown(content));
        dlBtn.classList.add('is-done');
        dlBtn.innerHTML = dlDone;
        if (resetT) clearTimeout(resetT);
        resetT = setTimeout(() => { dlBtn.classList.remove('is-done'); dlBtn.innerHTML = dlDefault; }, 1800);
      });
    }
  }

  // The colophon runs the full page width (like the header), so it sits outside
  // the centered column as a direct child of the root.
  root.appendChild(renderColophon(content));

  // Canonical comment-target list: a stable id + human label + seed data per
  // commentable region. Pins attach to all of these except the CTA (which
  // owns the inline composer); the panel aggregates every one, CTA included.
  const seed = content.seedComments || {};
  const commentSections = [
    ...content.sections.map((s) => ({ id: s.id, label: s.eyebrow || s.heading, seedComments: seed[s.id] })),
  ];
  if (content.sources) commentSections.push({ id: 'sources', label: content.sources.heading || 'Sources', seedComments: seed.sources });

  // Every commentable region now carries a pin (the note + CTA composer are gone).
  initComments(root, pageSlug, commentSections);
  initCommentsPanel(document.body, { pageSlug, sections: commentSections, docRoot: root });

  // Share modal, wired to the header Share button. Owner defaults to the doc's
  // sender; collaborators + invite directory come from content.sharing.
  const sharing = content.sharing || {};
  const people = content.people || DEFAULT_PEOPLE;
  const senderEmail = (people.find((p) => p.name === content.sender?.name) || {}).email || '';
  initShareModal({
    docTitle: 'this file',
    workspaceName: content.meta.clientName,
    owner: sharing.owner || { name: content.sender.name, email: senderEmail },
    collaborators: sharing.collaborators || [],
    directory: sharing.directory || [],
  });
  initColumnResize(inner, { docRoot: root });
  initReveal(root);
  initSmoothScroll();
  if (hero) {
    initHeroParallax(hero);
    initHeroTheming(hero);
  } else {
    // No cover to scroll past — the rail hairline is simply present.
    document.querySelector('.doc-rail')?.classList.add('is-past-cover');
  }
  initToc(root, content);

  // Entrance. Gated visit → the access gate IS the entrance. Already unlocked
  // (refresh mid-demo) → the branded load-in plays as before.
  if (gated) {
    // The intro cover is STATIC markup in the page (it paints on frame 1 for a
    // flash-free load-in). initIntro() is what normally removes it — so when
    // the gate takes over as the entrance we must drop it ourselves, or it
    // sits at z-index 1000 on top of the gate forever.
    document.querySelector('.doc-intro')?.remove();
    // The gate's lede names the person SHARING the canvas (the OMNI-side owner
    // — same name the inbox email credits), falling back to the doc's author.
    initGate(root, {
      senderName: content.sharing?.sharedBy || content.sender?.name || content.meta.brand || content.meta.clientName,
      docTitle: content.meta.docTitle,
    });
  } else {
    initIntro(root);
  }
}
