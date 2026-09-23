/**
 * Access gate — the invitation ritual (the Figma-invite mental model: you got
 * an email, you click, you're in). No real auth: any well-formed email passes.
 * The point is the *moment*, not the security.
 *
 * Flow: frosted canvas + card → email → ~1.2s verify → gate dissolves and the
 * document resolves into focus.
 *
 * Unlock persists in sessionStorage so refreshes mid-demo don't re-gate;
 * `?gate=1` forces it back for presenting.
 */
const UNLOCK_KEY = 'canvas-share:unlocked';
const VERIFY_MS = 1200;   // the felt "verifying" beat
const REVEAL_MS = 1500;   // blur/scale resolve — must outlast the CSS transition

const GLYPH = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="3.5" width="17" height="17" rx="3"/><path d="M3.5 9h17M9 9v11.5"/></svg>`;

const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v).trim());

/** Should this load be gated? OPT-IN ONLY (`?gate=1`, for presenting the
    ritual). The default flow dropped the gate 2026-07-15: the share email
    already says "this link is your key", so a second email prompt after
    clicking Open told the same story twice — the branded intro is the
    entrance now. */
export function shouldGate() {
  try {
    return new URLSearchParams(location.search).get('gate') === '1';
  } catch { return false; }
}

/**
 * @param {HTMLElement} root   the .doc element (frosted while gated)
 * @param {{senderName:string, docTitle:string, subtitle?:string, onUnlock?:Function}} opts
 */
export function initGate(root, { senderName, docTitle, subtitle = 'Shared canvas · Read-only', onUnlock } = {}) {
  document.body.classList.add('is-gated');

  // The tease only works if the document is actually THERE behind the frost.
  // Its [data-reveal] entrances sit at opacity:0 until scrolled into view — and
  // nothing scrolls while gated — so the frost would blur an empty page into a
  // blank wall. Settle them to their resting state up front.
  root.querySelectorAll('[data-reveal]').forEach((el) => el.classList.add('is-visible'));

  const gate = document.createElement('div');
  gate.className = 'doc-gate';
  gate.innerHTML = `
    <div class="doc-gate__card">
      <img class="doc-gate__logo" src="../../shared/assets/omni-logo.svg" alt="OMNI+" />
      <p class="doc-gate__lede"><strong>${senderName}</strong> has shared a document with you</p>
      <div class="doc-gate__file">
        <span class="doc-gate__file-glyph">${GLYPH}</span>
        <span class="doc-gate__file-meta">
          <span class="doc-gate__file-title">${docTitle}</span>
          <span class="doc-gate__file-sub">${subtitle}</span>
        </span>
      </div>
      <form class="doc-gate__form" novalidate>
        <input class="doc-gate__input" type="email" autocomplete="email" placeholder="Enter your email" aria-label="Your email" />
        <button class="doc-gate__btn" type="submit">Continue</button>
      </form>
      <p class="doc-gate__foot">No password needed — this link is your key.</p>
      <div class="doc-gate__progress" aria-hidden="true"></div>
    </div>`;
  document.body.appendChild(gate);

  const card = gate.querySelector('.doc-gate__card');
  const form = gate.querySelector('.doc-gate__form');
  const input = gate.querySelector('.doc-gate__input');
  const btn = gate.querySelector('.doc-gate__btn');
  const foot = gate.querySelector('.doc-gate__foot');
  const footText = foot.textContent;

  setTimeout(() => input.focus(), 700);

  function unlock() {
    try { sessionStorage.setItem(UNLOCK_KEY, '1'); } catch { /* private mode */ }
    // Keep .is-gated on so the frost is the transition's START value; the
    // .is-unlocking rule (declared later, same specificity) overrides it and
    // interpolates blur/scale back to rest.
    document.body.classList.add('is-unlocking');
    gate.classList.add('is-leaving');
    setTimeout(() => {
      document.body.classList.remove('is-gated', 'is-unlocking');
      gate.remove();
      onUnlock?.();
    }, REVEAL_MS);
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (card.classList.contains('is-verifying')) return;
    if (!isEmail(input.value)) {
      foot.textContent = 'Enter a valid email address.';
      foot.classList.add('doc-gate__error');
      input.focus();
      return;
    }
    foot.textContent = footText;
    foot.classList.remove('doc-gate__error');
    card.classList.add('is-verifying');
    input.disabled = true;
    btn.disabled = true;
    btn.textContent = 'Verifying';
    setTimeout(unlock, VERIFY_MS);
  });

  // Failsafe: never trap the document behind the gate.
  setTimeout(() => {
    if (document.body.classList.contains('is-gated') && !card.classList.contains('is-verifying')) return;
  }, 0);

  return { unlock };
}
