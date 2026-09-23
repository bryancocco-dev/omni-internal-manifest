/**
 * Branded load-in orchestration. The cover (`.doc-intro`) is ideally already in
 * the page markup so it paints on the very first frame (no flash); if it isn't,
 * we build it. The cover composes the co-brand lockup (OMNI × active brand —
 * pulled from the live theme), holds a beat, then lifts away like a sheet with
 * an accent filament on its trailing edge while the page content materializes
 * beneath. The hero's own push-in + type stagger are paused (hero.css) until
 * `doc--intro-init` drops, so the reveal is the payoff.
 *
 * renderDoc adds `doc--intro-init` to the root before building content, so the
 * content starts hidden; this reveals it. A failsafe guarantees the page is
 * never left stuck behind the cover.
 */
import { getActiveBrand } from './themes.js';

const COVER_HTML = `
  <div class="doc-intro__lockup">
    <img class="doc-intro__mark" src="../../shared/assets/omni-logo.svg" alt="" />
    <span class="doc-intro__x" hidden aria-hidden="true">×</span>
    <span class="doc-intro__brandpair" hidden>
      <span class="doc-intro__brand"></span>
      <span class="doc-intro__name"></span>
    </span>
  </div>
  <div class="doc-intro__rule"></div>
  <div class="doc-intro__eyebrow">Shared Canvas · Read-Only</div>`;

export function initIntro(root) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let intro = document.querySelector('.doc-intro');
  if (!intro && !reduce) {
    intro = buildIntro();
    document.body.insertBefore(intro, document.body.firstChild);
  }

  // No animation (reduced-motion, or no cover): just show the content.
  if (reduce || !intro) {
    root.classList.remove('doc--intro-init');
    if (intro) intro.remove();
    return;
  }

  // Older static markup (bare mark or ungrouped brand pieces) → upgrade to
  // the composed cover.
  if (!intro.querySelector('.doc-intro__brandpair')) intro.innerHTML = COVER_HTML;

  // Brand half of the lockup — only on workspace themes. Mark + name live in
  // ONE wrapper animated as a single unit (same wipe grammar as the OMNI
  // side). This runs in the same tick as renderDoc (before the mark's first
  // animation frame), so the lockup never visibly re-flows.
  const brand = getActiveBrand();
  if (brand) {
    const x = intro.querySelector('.doc-intro__x');
    const pair = intro.querySelector('.doc-intro__brandpair');
    if (x && pair) {
      x.hidden = false;
      pair.hidden = false;
      pair.querySelector('.doc-intro__brand').style.setProperty('--m', `url('${brand.logoUrl}')`);
      // Real wordmark artwork where the brand has one (masked span, same ink);
      // text fallback for wordmark-less brands (Corvache).
      const nameEl = pair.querySelector('.doc-intro__name');
      if (brand.wordmarkUrl) {
        nameEl.classList.add('is-wm');
        nameEl.style.setProperty('--m', `url('${brand.wordmarkUrl}')`);
        nameEl.style.aspectRatio = brand.wmAr;
        nameEl.style.setProperty('--wm-scale', brand.wmScale);
        nameEl.setAttribute('role', 'img');
        nameEl.setAttribute('aria-label', brand.name);
        nameEl.textContent = '';
      } else {
        nameEl.textContent = brand.name;
      }
    }
  }

  const HOLD = 2350; // the composed cover holds until here, then lifts
  const OUT = 1000;  // curtain travel

  setTimeout(() => {
    intro.classList.add('is-leaving');
    root.classList.remove('doc--intro-init'); // releases the hero choreography
    root.classList.add('doc--revealed');
  }, HOLD);

  setTimeout(() => { intro.remove(); }, HOLD + OUT + 80);

  // Failsafe — never leave the page hidden if a timer or transition stalls.
  setTimeout(() => {
    root.classList.remove('doc--intro-init');
    document.querySelector('.doc-intro')?.remove();
  }, 5600);

  // Clean up the reveal class once its animation has run.
  root.addEventListener('animationend', function onEnd(e) {
    if (e.target === root && e.animationName === 'docContentIn') {
      root.classList.remove('doc--revealed');
      root.removeEventListener('animationend', onEnd);
    }
  });
}

function buildIntro() {
  const el = document.createElement('div');
  el.className = 'doc-intro';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = COVER_HTML;
  return el;
}
