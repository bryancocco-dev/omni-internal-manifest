/* ------------------------------------------------------------------
   PROMPT BEAT — the story interstitial between generations on the
   scroll canvas: the familiar composer, floating alone on the flat
   surface as a standalone card — no shell chrome, no hat. The
   composer's caret blinks, the prompt types, the cursor clicks the
   sparkle send — the card slips away and the output generates.

   Fully scrub-safe: caret blinks are discrete tl.set()s, typing is a
   tweened counter, every tween carries an explicit position.
------------------------------------------------------------------ */

const SPARKLE = `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M9 5 L10.6 11.4 L17 13 L10.6 14.6 L9 21 L7.4 14.6 L1 13 L7.4 11.4 Z"/><path d="M17 3 L17.7 5.3 L20 6 L17.7 6.7 L17 9 L16.3 6.7 L14 6 L16.3 5.3 Z"/></svg>`;
const CARET_SVG = `<svg width="14" height="14" viewBox="0 0 10 10" fill="none"><path d="M2 4l3 3 3-3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

/** Mount the floating composer-only card. */
export function mountPromptBar(host) {
  const el = document.createElement('div');
  el.className = 'xpb-box';
  el.innerHTML = `
    <div class="xpb-comp">
      <div class="xpb-ta"><span class="xpb-text"></span><span class="xpb-caret"></span></div>
      <div class="xpb-row">
        <span class="xpb-add"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></span>
        <span class="xpb-spacer"></span>
        <span class="xpb-model">Claude Sonnet 4.6 ${CARET_SVG}</span>
        <button class="xpb-send" type="button">${SPARKLE}</button>
      </div>
    </div>
  `;
  host.appendChild(el);
  return {
    bar:    el,
    textEl: el.querySelector('.xpb-text'),
    caret:  el.querySelector('.xpb-caret'),
    btn:    el.querySelector('.xpb-send'),
  };
}

/** Pin the beat's pre-state at the cue's position 0. */
export function promptBeatPreState(tl, ctx, els) {
  const ring = ctx.cursor.querySelector('.cursor-ring');
  tl.set(els.bar,   { opacity: 0, y: 46, scale: 0.985, transformOrigin: '50% 60%' }, 0);
  tl.set(els.caret, { opacity: 0 }, 0);
  tl.set(els.btn,   { scale: 1, boxShadow: '0 0 0 0 rgba(24,88,238,0)' }, 0);
  tl.call(() => { els.textEl.textContent = ''; }, null, 0);
  tl.set(ctx.cursor, { opacity: 0, scale: 1, x: 470, y: 880 }, 0);
  tl.set(ring, { opacity: 0, scale: 0.4 }, 0);
}

/** Run the beat starting at `at`. Returns the time the box has fully
 *  exited (schedule the generation reveal from there). */
export function promptBeat(tl, ctx, els, { at, text }) {
  const cursor = ctx.cursor;
  const ring   = cursor.querySelector('.cursor-ring');

  // The composer card rides up onto the empty canvas.
  tl.to(els.bar, { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: 'power3.out' }, at);

  // The composer caret blinks alone — "somebody is about to type".
  tl.set(els.caret, { opacity: 1 }, at + 0.25);
  tl.set(els.caret, { opacity: 0 }, at + 0.60);
  tl.set(els.caret, { opacity: 1 }, at + 0.95);

  // The prompt types (caret rides the end of the text — DOM order).
  const T_TYPE = at + 1.15;
  const typeDur = text.length / 34;
  const proxy = { n: 0 };
  tl.to(proxy, {
    n: text.length, duration: typeDur, ease: 'none',
    onUpdate: () => { els.textEl.textContent = text.slice(0, Math.round(proxy.n)); },
  }, T_TYPE);

  // Cursor rises from below and clicks the sparkle send.
  const T_CUR = T_TYPE + typeDur + 0.12;
  tl.to(cursor, { opacity: 1, duration: 0.2 }, T_CUR);
  tl.to(cursor, {
    x: () => targetIn(els.btn, ctx.stage).x,
    y: () => targetIn(els.btn, ctx.stage).y,
    duration: 0.55, ease: 'power3.inOut',
  }, T_CUR);

  const T_CLICK = T_CUR + 0.7;
  tl.fromTo(ring, { opacity: 0.9, scale: 0.4 }, { opacity: 0, scale: 1.7, duration: 0.5, ease: 'power2.out' }, T_CLICK);
  tl.to(cursor, { scale: 0.9, duration: 0.08, ease: 'power2.in' }, T_CLICK);
  tl.to(cursor, { scale: 1,   duration: 0.22, ease: 'power2.out' }, T_CLICK + 0.08);
  tl.to(els.btn, { scale: 1.1, duration: 0.1, ease: 'power2.in' }, T_CLICK);
  tl.to(els.btn, { scale: 1,   duration: 0.2, ease: 'power2.out' }, T_CLICK + 0.1);
  tl.to(els.btn, { boxShadow: '0 0 0 9px rgba(24,88,238,0.20)', duration: 0.22, ease: 'power2.out' }, T_CLICK);
  tl.to(els.btn, { boxShadow: '0 0 0 0 rgba(24,88,238,0)',      duration: 0.3,  ease: 'power2.in'  }, T_CLICK + 0.24);

  // Box slips up and away; cursor fades.
  const T_EXIT = T_CLICK + 0.4;
  tl.set(els.caret, { opacity: 0 }, T_EXIT);
  tl.to(els.bar, { opacity: 0, y: -36, duration: 0.32, ease: 'power2.in' }, T_EXIT);
  tl.to(cursor, { opacity: 0, duration: 0.28, ease: 'power2.in' }, T_EXIT + 0.05);

  return T_EXIT + 0.35;
}

function targetIn(el, stage) {
  const sr = stage.getBoundingClientRect();
  const r  = el.getBoundingClientRect();
  return {
    x: r.left - sr.left + r.width  / 2 - 5,
    y: r.top  - sr.top  + r.height / 2 - 3,
  };
}
