/**
 * Smooth wheel / trackpad scrolling — matches lease-campaign's
 * `smoothCanvasScroll` verbatim (the feel Bryan referenced): a slow 0.09 lerp
 * eased toward an accumulated target, with a 0.9 wheel multiplier. This long,
 * gliding ease is what gives that project its signature smooth scroll (a
 * faster damp like 0.22 feels snappy by comparison).
 *
 * Adapted from lease-campaign's `#canvas` element to the window scroller. Keeps
 * its internal current/target state (re-synced to any external scroll while the
 * lerp isn't driving), plus pass-throughs for pinch-zoom, horizontal wheel,
 * inner scrollers (comment thread / textarea / the comments panel), and native
 * keyboard scrolling. Disabled under prefers-reduced-motion.
 */
const LERP = 0.09;
const WHEEL_MULTIPLIER = 0.9;
const NAV_KEYS = new Set(['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ', 'Spacebar']);

export function initSmoothScroll() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const scroller = document.scrollingElement || document.documentElement;
  let target = scroller.scrollTop;
  let current = scroller.scrollTop;
  let rafId = null;
  let active = false;

  const maxScroll = () => scroller.scrollHeight - window.innerHeight;
  function clamp() {
    if (target < 0) target = 0;
    else if (target > maxScroll()) target = maxScroll();
  }

  function tick() {
    const diff = target - current;
    if (Math.abs(diff) < 0.4) {
      current = target;
      scroller.scrollTop = current;
      active = false;
      rafId = null;
      return;
    }
    current += diff * LERP;
    scroller.scrollTop = current;
    rafId = requestAnimationFrame(tick);
  }

  function stop() {
    active = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
  }

  window.addEventListener(
    'wheel',
    (e) => {
      if (e.ctrlKey) return; // pinch-zoom → native
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return; // horizontal → native
      // Let inner scrollers (comment thread, textarea, the comments panel)
      // scroll natively instead of driving the page lerp.
      if (e.target.closest && e.target.closest('.doc-comment-list, textarea, .comments-panel, .comments-menu')) return;

      e.preventDefault();
      if (!active) {
        current = scroller.scrollTop;
        target = current;
        active = true;
      }
      // Normalize delta unit (pixels default; lines → ~16px; pages → viewport).
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1;
      target += e.deltaY * unit * WHEEL_MULTIPLIER;
      clamp();
      if (!rafId) rafId = requestAnimationFrame(tick);
    },
    { passive: false }
  );

  // Re-sync to any external scroll (keyboard, anchor, resize) while the lerp
  // isn't the one driving, so it never fights native scrolling.
  window.addEventListener(
    'scroll',
    () => {
      if (!active) {
        target = scroller.scrollTop;
        current = scroller.scrollTop;
      }
    },
    { passive: true }
  );

  // Hand off to native keyboard scrolling.
  window.addEventListener('keydown', (e) => {
    const t = e.target;
    if (t && (t.tagName === 'TEXTAREA' || t.tagName === 'INPUT')) return;
    if (NAV_KEYS.has(e.key)) stop();
  });
}

/**
 * Scoped version of the same lerp for an internal overflow container (e.g. the
 * comments panel body), so it glides like the page instead of hard native
 * scrolling. Traps the wheel while there's room to scroll; releases at the
 * edges so the gesture isn't swallowed.
 */
export function smoothScrollElement(el, { lerp = 0.15, multiplier = 0.9 } = {}) {
  if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let target = el.scrollTop;
  let current = el.scrollTop;
  let rafId = null;
  let active = false;
  const max = () => el.scrollHeight - el.clientHeight;

  function tick() {
    const diff = target - current;
    if (Math.abs(diff) < 0.4) {
      current = target;
      el.scrollTop = current;
      active = false;
      rafId = null;
      return;
    }
    current += diff * lerp;
    el.scrollTop = current;
    rafId = requestAnimationFrame(tick);
  }

  el.addEventListener('wheel', (e) => {
    if (e.ctrlKey) return;
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    // Let nested scrollers (emoji picker list, @-mention list, the composer
    // input) scroll natively instead of driving this container.
    if (e.target.closest && e.target.closest('.emoji-scroll, .composer__mention-list, .composer__input')) return;
    const limit = max();
    if (limit <= 0) return;
    // At an edge and pushing further out → let it bubble (don't trap).
    const atTop = el.scrollTop <= 0 && e.deltaY < 0;
    const atEnd = el.scrollTop >= limit - 1 && e.deltaY > 0;
    if ((atTop || atEnd) && !active) return;
    e.preventDefault();
    e.stopPropagation();
    if (!active) { current = el.scrollTop; target = current; active = true; }
    const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? el.clientHeight : 1;
    target = Math.max(0, Math.min(limit, target + e.deltaY * unit * multiplier));
    if (!rafId) rafId = requestAnimationFrame(tick);
  }, { passive: false });

  el.addEventListener('scroll', () => {
    if (!active) { target = el.scrollTop; current = el.scrollTop; }
  }, { passive: true });
}
