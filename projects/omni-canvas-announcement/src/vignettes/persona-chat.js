/* ------------------------------------------------------------------
   VIGNETTE — persona-chat ("sit down and talk with them"). Picks up
   right where persona-build left off: the persona document is on
   screen in the pane. The camera drops down to the tab row, a phantom
   cursor clicks the pane's green Chat pill (which flips to a red "End
   Chat" state), the camera glides back to the chat panel where the
   composer swaps to a Mei-T agent bar (the chat-aux header hides at
   the same beat — no floating "WHAT WOULD YOU LIKE TO CREATE?" bar
   while a persona chat is active), and a quick three-beat exchange
   plays out — Mei posts a brief opener, the user asks what would make
   her hesitate, and Mei's reply types in. No menu to close — the
   reset wash handles the out. Prefix `xps-` throughout (shared with
   persona-build.js).
------------------------------------------------------------------ */

import { CAMERA_GLIDE } from './camera.js';

const USER_LINE = 'what would make you hesitate?';
const MEI_REPLY = "Honestly? Charging. If the app, the wall unit, and the car don't agree with each other, the premium promise falls apart for me.";

const END_ICON = `<svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 4.6c-2.4 0-4.6.8-6.3 2.1-.4.3-.4.9-.1 1.3l1.5 1.8c.3.4.9.4 1.3.1.5-.4 1.1-.7 1.7-.9.4-.1.6-.5.6-.9v-1c.7-.2 1.5-.3 2.3-.3s1.6.1 2.3.3v1c0 .4.2.8.6.9.6.2 1.2.5 1.7.9.4.3 1 .3 1.3-.1l1.5-1.8c.3-.4.3-1-.1-1.3C12.6 5.4 10.4 4.6 8 4.6z"/></svg>`;

const AGENT_BAR_HTML = `
  <div class="xps-agent-bar" data-agent-bar>
    <span class="xps-av-mei"><img src="/persona-mei.webp" alt="Mei T" /></span>
    <div class="xps-agent-info">
      <span class="xps-agent-name">Mei T</span>
      <span class="xps-agent-sub">OMNI Persona Mimicking Agent</span>
    </div>
    <span class="xps-agent-spacer"></span>
    <button class="xps-agent-end" type="button" aria-label="End chat">${END_ICON}</button>
  </div>
`;

export function personaChatVignette(tl, ctx) {
  const { world, canvasSide, chatGroup, chatHat } = ctx.canvas;
  const cursor = ctx.cursor;
  const ring = cursor.querySelector('.cursor-ring');

  // Elements mounted by persona-build.js (runs first in the cue list,
  // same load — safe to query straight off the live DOM it built).
  const camAnchorTabs = canvasSide.querySelector('[data-cam-anchor-tabs]');
  const chatPill   = canvasSide.querySelector('[data-chat-pill]');
  const pillIcon   = canvasSide.querySelector('[data-pill-icon]');
  const pillLabel  = canvasSide.querySelector('[data-pill-label]');
  const msgMeiIntro = chatGroup.querySelector('[data-msg-mei-intro]');
  const msgUser2   = chatGroup.querySelector('[data-msg-user2]');
  const msgUser2Body = chatGroup.querySelector('[data-msg-body-2]');
  const msgMei     = chatGroup.querySelector('[data-msg-mei]');
  const typedMei   = chatGroup.querySelector('[data-typed-mei]');

  // The chat-aux header ("WHAT WOULD YOU LIKE TO CREATE?") must not
  // float above the composer while a persona chat is active — it
  // hides as part of the agent-bar swap so the column reads
  // greeting/thread → Mei T agent bar → composer, nothing else.
  const auxPanel = chatHat.querySelector('.chat-aux-panel');

  // ----- Camera anchor for the "back to the chat panel" beat. Unlike
  //        persona-build's chip-click camera (which only needs to
  //        frame the composer, so it reuses chat-hat.js's camera
  //        verbatim), THIS beat needs the actual exchange (Mei's
  //        opener, the user's line, Mei's reply) to read on screen
  //        too. That thread sits right under the greeting, well above
  //        the composer (a large flex spacer separates them) — at
  //        chat-hat.js's own scale (1.0) there isn't enough vertical
  //        room to show both ends, so this pulls back to 0.9 (looser
  //        than classic, never tighter — same spirit as the hat-scale
  //        fix) and centers on the span between the thread's top and
  //        the composer's bottom, measured live so it holds regardless
  //        of exchange length. -----
  let staleAnchorChat = chatGroup.querySelector('[data-cam-anchor-chat]');
  if (staleAnchorChat) staleAnchorChat.remove();
  const camAnchorChat = document.createElement('span');
  camAnchorChat.className = 'xps-cam-anchor';
  camAnchorChat.setAttribute('data-cam-anchor-chat', '');
  chatGroup.appendChild(camAnchorChat);
  const messagesEl = chatGroup.querySelector('#xps-messages');
  const CHAT_CAM_SCALE = 0.9;
  const anchorTop = messagesEl.offsetTop;
  const anchorBottom = chatHat.offsetTop + chatHat.offsetHeight;
  camAnchorChat.style.top = ((anchorTop + anchorBottom) / 2) + 'px';

  // ----- Composer swap overlay (hot-reload safe). Mounted as an
  //        absolutely-positioned strip on the composer — the textarea
  //        + send button keep working underneath/below it. -----
  const composer = chatHat.querySelector('.composer');
  let stale = composer.querySelector('[data-agent-bar]');
  if (stale) stale.remove();
  composer.insertAdjacentHTML('afterbegin', AGENT_BAR_HTML);
  const agentBar = composer.querySelector('[data-agent-bar]');

  const composerRest  = chatHat.querySelector('[data-composer-rest]');
  const composerCaret = chatHat.querySelector('[data-composer-caret]');
  const typedEl       = chatHat.querySelector('[data-typed-prompt]');
  const sendBtn       = chatHat.querySelector('.round-btn.send');
  const composerTextarea = chatHat.querySelector('.composer-textarea');

  // ----- Derive the textarea push-down from REAL measurements, not a
  //        guess. A translateY shifts the text's rendered position but
  //        NOT the actions row (send/plus/model-pill stay pinned at
  //        their resting bottom position — verified below) or the
  //        composer's own flex box, so the push amount must leave
  //        comfortable air on BOTH sides: below the bar's hairline,
  //        and above the actions row. Pushing by the bar's full height
  //        alone (tried first) ate almost the entire natural gap to
  //        the actions row, since that gap doesn't shrink or grow to
  //        compensate — it just crowds. So: measure the bar height,
  //        the textarea's natural (pre-transform) top, the actions
  //        row's fixed top, and one line's height, then split the
  //        leftover slack evenly between "under the bar" and "above
  //        the actions row". -----
  const barH = agentBar.offsetHeight;
  const composerRect0 = composer.getBoundingClientRect();
  const textareaNaturalTop = composerTextarea.getBoundingClientRect().top - composerRect0.top;
  const sendBtnTop = sendBtn.getBoundingClientRect().top - composerRect0.top;
  const lineHeight = parseFloat(getComputedStyle(composerTextarea).lineHeight) || 26;
  const slack = Math.max(sendBtnTop - barH - lineHeight, 0);
  const gapBelowBar = slack / 2;
  const AGENT_BAR_PUSH = (barH + gapBelowBar) - textareaNaturalTop;

  // ================================================================
  // PRE-STATE (position 0 of THIS cue) — idempotent every loop.
  // ================================================================
  tl.set(agentBar, { opacity: 0, y: -10 }, 0);
  // Composer starts at its normal geometry (rounded bottom only, per
  // canvas-ui.css — the aux header sits above it the rest of the
  // time) and only rounds fully while the agent bar is the sole thing
  // above the input.
  tl.set(composer, { borderRadius: '0px 0px 24px 24px', overflow: 'visible' }, 0);
  // The agent bar (62px, opaque) sits on top of the composer — without
  // this, the textarea's own top padding (24px) isn't enough clearance
  // and typed text renders hidden underneath the bar.
  // A transform (not margin) — margin would add real layout height and
  // grow the composer past its resting 185px min-height; a translateY
  // shifts the rendered text without touching the box model, so the
  // composer's total height stays identical to the resting state.
  tl.set(composerTextarea, { y: 0 }, 0);
  tl.set(chatPill, { backgroundColor: '#22c55e' }, 0);
  tl.call(() => { chatPill.classList.remove('is-active'); pillLabel.textContent = 'Chat'; }, null, 0);

  tl.set(composerRest, { opacity: 1 }, 0);
  tl.set(composerCaret, { opacity: 0 }, 0);
  tl.set(typedEl, { opacity: 1 }, 0);
  tl.call(() => { typedEl.textContent = ''; }, null, 0);
  tl.set(sendBtn, { scale: 1, boxShadow: '0 0 0 0 rgba(24,88,238,0)' }, 0);

  tl.set([msgMeiIntro, msgUser2, msgMei], { opacity: 0, y: 10 }, 0);
  tl.call(() => { typedMei.textContent = ''; msgUser2Body.textContent = ''; }, null, 0);

  // Aux header starts NORMAL (visible, natural height) — persona-build
  // left it that way; this cue owns hiding it partway through.
  tl.set(auxPanel, { height: 'auto', opacity: 1, overflow: 'visible' }, 0);

  tl.set(cursor, { opacity: 0, scale: 1, x: 470, y: 900 }, 0);
  tl.set(ring, { opacity: 0, scale: 0.4 }, 0);

  // ================================================================
  // BEAT — camera eases down from the pane lockup to frame the TAB
  //         ROW + upper cover (Chat pill clearly in frame).
  // ================================================================
  const camTabs = ctx.cameraFor(camAnchorTabs, 1.15);
  tl.to(world, {
    x: camTabs.x, y: camTabs.y, scale: camTabs.scale,
    duration: 1.1, ease: CAMERA_GLIDE,
  }, 0);

  // ================================================================
  // BEAT — cursor rises from off-frame bottom to the Chat pill,
  //         hovers, clicks — flips to the red End Chat state.
  // ================================================================
  tl.to(cursor, { opacity: 1, duration: 0.2 }, 1.2);
  tl.to(cursor, {
    x: () => targetIn(chatPill, ctx.stage).x,
    y: () => targetIn(chatPill, ctx.stage).y,
    duration: 0.5, ease: 'power3.out',
  }, 1.2);

  tl.to(chatPill, { scale: 1.05, duration: 0.15, ease: 'power2.out' }, 1.7);

  const Tclick = 1.95;
  tl.fromTo(ring, { opacity: 0.9, scale: 0.4 }, { opacity: 0, scale: 1.8, duration: 0.5, ease: 'power2.out' }, Tclick);
  tl.to(cursor, { scale: 0.92, duration: 0.08, ease: 'power2.in' }, Tclick);
  tl.to(cursor, { scale: 1,    duration: 0.20, ease: 'back.out(2.4)' }, Tclick + 0.08);
  tl.to(chatPill, { scale: 1, backgroundColor: '#ef4444', duration: 0.22, ease: 'power2.out' }, Tclick);
  tl.call(() => { chatPill.classList.add('is-active'); pillLabel.textContent = 'End Chat'; }, null, Tclick + 0.05);

  tl.to(cursor, { opacity: 0, duration: 0.3, ease: 'power2.in' }, Tclick + 0.35);

  // ================================================================
  // BEAT — camera glides back to the chat panel; the composer swaps
  //         to Mei's persona-agent bar.
  // ================================================================
  const camChat = ctx.cameraFor(camAnchorChat, CHAT_CAM_SCALE);
  tl.to(world, {
    x: camChat.x, y: camChat.y, scale: camChat.scale,
    duration: 1.0, ease: CAMERA_GLIDE,
  }, 2.3);
  tl.to(agentBar, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, 2.6);
  tl.to(composerTextarea, { y: AGENT_BAR_PUSH, duration: 0.4, ease: 'power2.out' }, 2.6);
  // Composer rounds fully to match — no square corner poking past the
  // bar's own rounded top once the aux header is gone.
  tl.set(composer, { overflow: 'hidden' }, 2.6);
  tl.to(composer, { borderRadius: '24px 24px 24px 24px', duration: 0.4, ease: 'power2.out' }, 2.6);
  // The aux header collapses out of the way at the same beat — while
  // a persona chat is active the column is greeting/thread → agent
  // bar → composer, nothing floating above it.
  tl.to(auxPanel, { height: 0, opacity: 0, duration: 0.35, ease: 'power2.inOut' }, 2.6);

  // ================================================================
  // BEAT — Mei posts a brief opener (quick reveal, not typed — this
  //         is the live product's chat-open pattern, kept snappy).
  // ================================================================
  tl.to(msgMeiIntro, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }, 2.75);

  // ================================================================
  // BEAT — the user types + sends "what would make you hesitate?".
  // ================================================================
  tl.set(composerCaret, { opacity: 1 }, 3.0);
  tl.set(composerCaret, { opacity: 0 }, 3.12);
  tl.set(composerCaret, { opacity: 1 }, 3.24);
  tl.set(composerCaret, { opacity: 0 }, 3.36);
  tl.to(composerRest, { opacity: 0, duration: 0.14, ease: 'power2.in' }, 3.1);

  const typeState = { n: 0 };
  const TYPE_DUR = USER_LINE.length / 78;
  tl.to(typeState, {
    n: USER_LINE.length, duration: TYPE_DUR, ease: 'none',
    onUpdate: () => { typedEl.textContent = USER_LINE.slice(0, Math.round(typeState.n)); },
  }, 3.3);
  const typeEnd = 3.3 + TYPE_DUR;

  tl.to(sendBtn, { scale: 1.12, duration: 0.12, ease: 'power2.out' }, typeEnd + 0.1);
  tl.to(sendBtn, { scale: 1,    duration: 0.22, ease: 'power2.out' }, typeEnd + 0.22);
  tl.to(sendBtn, { boxShadow: '0 0 0 10px rgba(24,88,238,0.22)', duration: 0.25, ease: 'power2.out' }, typeEnd + 0.1);
  tl.to(sendBtn, { boxShadow: '0 0 0 0 rgba(24,88,238,0)', duration: 0.35, ease: 'power2.in' }, typeEnd + 0.35);

  // ----- 4.2 the user bubble appears; composer clears. -----
  tl.call(() => { msgUser2Body.textContent = USER_LINE; }, null, 4.2);
  tl.to(msgUser2, { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out' }, 4.2);
  tl.to(typedEl, { opacity: 0, duration: 0.12, ease: 'power2.in' }, 4.2);
  tl.call(() => { typedEl.textContent = ''; }, null, 4.32);
  tl.to(composerRest, { opacity: 1, duration: 0.2, ease: 'power2.out' }, 4.32);
  tl.to(typedEl, { opacity: 1, duration: 0.01 }, 4.4);

  // ================================================================
  // BEAT — 4.6 Mei's reply streams in as a typing beat.
  // ================================================================
  tl.to(msgMei, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, 4.6);
  const meiState = { n: 0 };
  const MEI_DUR = MEI_REPLY.length / 85;
  tl.to(meiState, {
    n: MEI_REPLY.length, duration: MEI_DUR, ease: 'none',
    onUpdate: () => { typedMei.textContent = MEI_REPLY.slice(0, Math.round(meiState.n)); },
  }, 4.75);
  const meiEnd = 4.75 + MEI_DUR;

  // ----- Hold briefly on the finished exchange; tight out (no menu to
  //        close — the reset wash dissolves the whole scene). -----
  const CUE_END = 7.5;
  tl.to({}, { duration: Math.max(CUE_END - meiEnd, 0.1) }, meiEnd);
}

function targetIn(el, stage) {
  const sr = stage.getBoundingClientRect();
  const r  = el.getBoundingClientRect();
  return {
    x: r.left - sr.left + r.width  / 2 - 5,
    y: r.top  - sr.top  + r.height / 2 - 3,
  };
}
