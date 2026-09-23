/**
 * On-scroll entrance effect. Tag any element with [data-reveal] and it
 * fades/slides up into place the first time it crosses the viewport.
 * Siblings sharing a parent stagger automatically via DOM order.
 */
const REVEAL_SELECTOR = '[data-reveal]';
const STAGGER_MS = 70;

export function initReveal(root = document) {
  const targets = Array.from(root.querySelectorAll(REVEAL_SELECTOR));
  if (!targets.length) return;

  if (!('IntersectionObserver' in window)) {
    targets.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const groups = new Map();
  targets.forEach((el) => {
    const parent = el.parentElement;
    const index = groups.has(parent) ? groups.get(parent) : 0;
    groups.set(parent, index + 1);
    el.style.setProperty('--reveal-delay', `${Math.min(index, 5) * STAGGER_MS}ms`);
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
  );

  targets.forEach((el) => observer.observe(el));
}
