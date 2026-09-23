/* ------------------------------------------------------------------
   VIGNETTE — persona-build ("pick Persona → the document appears").
   Real product flow (skill flows live in the hat): once the camera
   lands on the chat panel, the chat-aux panel pops open, a phantom
   cursor rises and clicks the "Persona" chip (brand-tint selected
   state), then exits and the panel collapses — THEN the story moves
   straight to the pane: the camera swings to the lockup and the
   persona document reveals (blur-in + the designed cover cascade
   alone carries the "it's being made" story — no generation badge,
   that was never part of the original designed cover; no composer
   typing, no chat Q&A beat).
   Prefix `xps-` throughout. Content stays on screen at cue end —
   persona-chat picks it up from here.
------------------------------------------------------------------ */

import { CAMERA_GLIDE, CAMERA_SETTLE } from './camera.js';

const PHONE_ICON = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4.2 2.4l2 1.4-.8 2a8 8 0 0 0 4.8 4.8l2-.8 1.4 2-1.6 1.6c-.5.5-1.3.7-2 .4C6.9 12.7 3.3 9.1 2.2 5.9c-.3-.7-.1-1.5.4-2z"/></svg>`;

const TABS = [
  { name: 'Mei T',   sub: 'Connected-Home Optimizer', active: true  },
  { name: 'Jamal R', sub: 'Road-Ready Family Planner', active: false },
  { name: 'Sofia K', sub: 'Values-Led Design Buyer',   active: false },
];

// Cribbed from persona.js's DEMOS, adjusted for this persona (affluent
// elder millennial, Mei T — Oakland).
const DEMOS = [
  { label: 'Age',        value: '35 – 44' },
  { label: 'Generation', value: 'Elder Millennial' },
  { label: 'Gender',     value: 'Female' },
  { label: 'Income',     value: '$150k – $220k' },
  { label: 'Education',  value: "Bachelor's +" },
  { label: 'Location',   value: 'Oakland, CA (Urban)' },
  { label: 'Household',  value: '2, partnered' },
  { label: 'Market',     value: 'United States' },
];

// ---- Chat conversation, mounted between the greeting and the spacer.
// Ported verbatim from the house chat anatomy (lease-campaign's
// .chat-stream / .msg.bot / .msg.user / .bubble / .body) — see
// persona-cut.css for the ported styles. Only the persona-chat cue's
// own exchange lives here — the composer-typing/Q&A beat (audience
// prompt → market question → "creating the document…") was cut
// earlier (Bryan: skip straight from the Persona chip click to the
// pane reveal).
const MESSAGES_HTML = `
  <div class="chat-stream xps-chat-stream" id="xps-messages" style="display:flex;flex-direction:column;gap:28px;padding:28px 36px 0;">
    <div class="msg bot" data-msg-mei-intro>
      <div class="msg-head">
        <div class="msg-avatar xps-av-mei"><img src="/persona-mei.webp" alt="Mei T" /></div>
        <div class="msg-meta">
          <span class="msg-name">Mei T — Fresh Chat</span>
          <span class="msg-dot"></span>
          <span class="msg-time">Today, 1:05 PM</span>
        </div>
      </div>
      <div class="body">Hi, I'm Mei. I'm evaluating a premium EV as part of a connected-home upgrade — happy to talk through what I'm looking for.</div>
    </div>

    <div class="msg user" data-msg-user2>
      <div class="bubble">
        <div class="msg-head">
          <div class="msg-avatar av-nick">BC</div>
          <div class="msg-meta">
            <span class="msg-name">Bryan Cocco</span>
            <span class="msg-dot"></span>
            <span class="msg-time">Today, 1:05 PM</span>
          </div>
        </div>
        <span data-msg-body-2></span>
      </div>
    </div>

    <div class="msg bot" data-msg-mei>
      <div class="msg-head">
        <div class="msg-avatar xps-av-mei"><img src="/persona-mei.webp" alt="Mei T" /></div>
        <div class="msg-meta">
          <span class="msg-name">Mei T — Fresh Chat</span>
          <span class="msg-dot"></span>
          <span class="msg-time">Today, 1:05 PM</span>
        </div>
      </div>
      <div class="body" data-typed-mei></div>
    </div>
  </div>
`;

// ---- Persona document, mounted into the pane (same pattern as
//      ppt-board: on canvasSide, passing UNDER .cs-canvas-top). The
//      PERSONAS tab row + Chat pill are this cut's own chrome (matches
//      the live product); the cover + demographics REUSE the V1
//      persona spread's markup verbatim (.ps-hero / .ph-* / .ps-demos /
//      .pd-* — styles live in canvas-ui.css, untouched) rather than
//      forking a bespoke cover treatment.
const DOC_HTML = `
  <div class="xps-scroller" data-scroller>
    <div class="xps-doc">
      <nav class="xps-tabs" data-tabs>
        <span class="xps-tabs-label">Personas</span>
        ${TABS.map((t, i) => `
          <button class="xps-tab ${t.active ? 'is-active' : ''}" type="button" data-tab="${i}">
            <span class="xps-tab-name">${t.name}</span>
            <span class="xps-tab-sub">${t.sub}</span>
          </button>`).join('')}
        <span class="xps-tabs-spacer"></span>
        <button class="xps-chat-pill" type="button" data-chat-pill>
          <span class="xps-chat-pill-icon" data-pill-icon>${PHONE_ICON}</span>
          <span class="xps-chat-pill-label" data-pill-label>Chat</span>
        </button>
      </nav>

      <div class="xps-cover-wrap" data-cover>
        <section class="ps-hero">
          <figure class="ph-portrait">
            <img data-cover-img src="/persona-mei.webp" alt="Mei T persona portrait" />
          </figure>
          <div class="ph-skeleton" data-skeleton><div class="ph-skeleton-band" data-skel-band></div></div>
          <div class="ph-grid"></div>

          <div class="ph-tags ph-tags--top" data-tags-top>
            <span>OMNI — Persona Library</span>
            <span>@omni.research</span>
            <span>© 2026</span>
          </div>

          <h1 class="ph-title" data-title>The <em>Connected-Home</em><br>Optimizer</h1>
          <div class="ph-chip" data-chip-id>Mei T, 38 — Oakland, California</div>

          <div class="ph-tags ph-tags--mid" data-tags-mid>
            <span>High Intent</span>
            <span>PR-001</span>
            <span>37.80° N · 122.27° W</span>
          </div>
        </section>
      </div>

      <section class="ps-demos" data-demos>
        <header class="pd-head" data-demo-head>
          <span class="pd-num">01</span>
          <span class="pd-label">Demographics</span>
        </header>
        <div class="pd-grid" data-demo-grid>
          ${DEMOS.map((d) => `
            <div class="pd-card" data-demo-card>
              <span class="pd-card-label">${d.label}</span>
              <span class="pd-card-value">${d.value}</span>
            </div>
          `).join('')}
        </div>
      </section>
    </div>
  </div>
`;

/** Sets the canvas crumb's label for this cut, once, at build time —
 *  preserves the chevron element (brief: "keep the chevron element"). */
function setCrumbLabel(canvasSide, label) {
  const nameEl = canvasSide.querySelector('.cs-canvas-name');
  if (!nameEl) return;
  const caret = nameEl.querySelector('.cs-crumb-caret');
  nameEl.textContent = label + ' ';
  if (caret) nameEl.appendChild(caret);
}

export function personaBuildVignette(tl, ctx) {
  const { world, canvasSide, chatGroup, greeting, hero, chatHat, chips } = ctx.canvas;
  const cursor = ctx.cursor;
  const ring = cursor.querySelector('.cursor-ring');

  setCrumbLabel(canvasSide, 'EV Persona Library');

  // ----- The chat-aux panel (chips) — collapsed by default (CSS:
  //        .chat-aux-body{max-height:0}); this cut never runs
  //        chat-hat.js, so we own the open+close animation here (same
  //        idiom chat-hat.js uses — no bespoke restyling, just the
  //        existing max-height pop-open played on this cue's own
  //        timeline). `scrollHeight` reads the natural content height
  //        regardless of the max-height clip. The panel is only open
  //        for this one beat — it closes again before the composer
  //        typing beat, matching the closed layout the camera (below)
  //        is framed for over the rest of the cue. -----
  const auxPanel = chatHat.querySelector('.chat-aux-panel');
  const auxBody = chatHat.querySelector('.chat-aux-body');
  const auxToggleSvg = chatHat.querySelector('.chat-aux-toggle svg');
  const bodyH = auxBody.scrollHeight || 260;
  const personaChip = chips.find((c) => (c.querySelector('span')?.textContent || '').trim() === 'Persona');

  // ----- Mount chat messages (hot-reload safe) between the greeting
  //        and the chat-hat spacer. -----
  let staleMsgs = chatGroup.querySelector('#xps-messages');
  if (staleMsgs) staleMsgs.remove();
  greeting.insertAdjacentHTML('afterend', MESSAGES_HTML);
  const messages   = chatGroup.querySelector('#xps-messages');
  const msgMeiIntro = messages.querySelector('[data-msg-mei-intro]');
  const msgUser2   = messages.querySelector('[data-msg-user2]');
  const msgMei     = messages.querySelector('[data-msg-mei]');

  // ----- Chat-panel camera — reuses chat-hat.js's EXACT camera
  //        (target chatHat, scale 1.0, offset {x:0,y:26}) so the hat
  //        renders at the SAME scale as the shared shell component
  //        shows it in the classic/welcome chat-hat beat (Bryan's
  //        audit: it must read as the identical component, not a
  //        bespoke tighter close-up). No custom anchor/scale here. --

  // ----- Mount the persona document into the pane (hot-reload safe). -
  const staleDoc = canvasSide.querySelector('[data-scroller]');
  if (staleDoc) staleDoc.remove();
  canvasSide.insertAdjacentHTML('beforeend', DOC_HTML);
  // Persona cut owns the composer's chat beat — scope the type-size
  // override statically (build-time class, loop-safe by construction).
  ctx.canvas.composer?.classList.add('xps-persona');

  const scroller   = canvasSide.querySelector('[data-scroller]');
  const tabsRow    = scroller.querySelector('[data-tabs]');
  const chatPill   = scroller.querySelector('[data-chat-pill]');

  // ---- Cover (verbatim V1 persona-spread markup — .ps-hero/.ph-*). --
  const cover       = scroller.querySelector('[data-cover]');
  const coverImg    = scroller.querySelector('[data-cover-img]');
  const skeleton    = scroller.querySelector('[data-skeleton]');
  const skelBand    = scroller.querySelector('[data-skel-band]');
  const tagsTop     = scroller.querySelector('[data-tags-top]');
  const tagsMid     = scroller.querySelector('[data-tags-mid]');
  const title       = scroller.querySelector('[data-title]');
  const chipId      = scroller.querySelector('[data-chip-id]');
  const tagSpans    = Array.from(scroller.querySelectorAll('.ph-tags span'));

  // ---- Demographics (verbatim .ps-demos/.pd-*). ---------------------
  const demoHead    = scroller.querySelector('[data-demo-head]');
  const demoCards   = Array.from(scroller.querySelectorAll('[data-demo-card]'));

  // ----- Camera-framing anchor for persona-chat's "tab row + upper
  //        cover" beat — positioned so the tab row's TOP EDGE lands
  //        at the frame's top edge at that beat's scale (1.15),
  //        letting the cover fill the rest of the frame below it. -----
  let staleAnchorTabs = scroller.querySelector('[data-cam-anchor-tabs]');
  if (staleAnchorTabs) staleAnchorTabs.remove();
  const camAnchorTabs = document.createElement('span');
  camAnchorTabs.className = 'xps-cam-anchor';
  camAnchorTabs.setAttribute('data-cam-anchor-tabs', '');
  scroller.appendChild(camAnchorTabs);
  const TABS_CAM_SCALE = 1.15;
  const tabsVisibleW = 938 / TABS_CAM_SCALE;
  camAnchorTabs.style.top = (tabsRow.offsetTop + (800 / TABS_CAM_SCALE) / 2) + 'px';
  // Bias the frame's horizontal window to the right edge of the doc
  // column so the Chat pill (flush right in the tab row) stays in
  // frame instead of being cropped off by a center-anchored window.
  // +30 slack so the pill's wider "End Chat" hover/click label (longer
  // than "Chat") never touches the frame's right edge.
  camAnchorTabs.style.left = (tabsRow.offsetLeft + tabsRow.offsetWidth - tabsVisibleW + 30) + 'px';
  camAnchorTabs.style.width = tabsVisibleW + 'px';

  // (No composer/typing beat in this cue anymore — the composer stays
  // untouched here; persona-chat.js owns its own typing beat later and
  // sets its own pre-state for those shared elements.)

  // ================================================================
  // PRE-STATE (position 0 of THIS cue) — idempotent every loop.
  // ================================================================
  tl.set(hero, { opacity: 0 }, 0);

  tl.set([msgMeiIntro, msgUser2, msgMei], { opacity: 0, y: 10 }, 0);

  // Pane doc: blur fade-in idiom (house rule) — the scroller sits
  // sharp-hidden through revealApp's establishing shot, then racks
  // into focus once the camera starts its push toward the pane.
  tl.set(scroller, { y: 0 }, 0);
  tl.set(scroller, { filter: 'blur(22px)', opacity: 0 }, 0);

  tl.set(tabsRow, { opacity: 0, y: 14 }, 0);
  tl.set(cover, { opacity: 0, y: 18, scale: 0.98 }, 0);

  // ---- Cover internals (verbatim persona.js pre-state) --------------
  tl.set(coverImg, { opacity: 0, filter: 'blur(26px) saturate(0.4)', scale: 1.08 }, 0);
  tl.set(skeleton, { opacity: 0 }, 0);
  tl.set(skelBand, { xPercent: -120 }, 0);
  tl.set([tagsTop, tagsMid], { opacity: 0 }, 0);
  tl.set(title, { opacity: 0, y: 22, filter: 'blur(10px)' }, 0);
  tl.set(chipId, { opacity: 0, y: 10 }, 0);

  tl.set(demoHead, { opacity: 0, y: 8 }, 0);
  tl.set(demoCards, { opacity: 0, y: 14 }, 0);

  tl.set(chatPill, { backgroundColor: '#22c55e' }, 0);
  tl.call(() => { chatPill.classList.remove('is-active'); }, null, 0);

  tl.set(auxPanel, { boxShadow: '0 0 0 0 rgba(24,88,238,0)' }, 0);
  tl.set(auxBody, { maxHeight: 0, overflow: 'hidden' }, 0);
  tl.set(auxToggleSvg, { rotation: 0, transformOrigin: '50% 50%' }, 0);
  tl.set(chips, { opacity: 0, y: 4 }, 0);
  tl.set(personaChip, { backgroundColor: 'rgba(255,255,255,1)', borderColor: 'rgba(15,23,42,0.12)', color: '#394457' }, 0);
  tl.set(cursor, { opacity: 0, scale: 1, x: 470, y: 900 }, 0);
  tl.set(ring, { opacity: 0, scale: 0.4 }, 0);

  // ================================================================
  // BEAT — camera glides from the establishing shot (revealApp, run
  //         by the caller on this same child timeline) to the CHAT
  //         panel: composer + greeting region in frame.
  // ================================================================
  const camChat = ctx.cameraFor(ctx.canvas.chatHat, 1.0, { x: 0, y: 26 });
  tl.to(world, {
    x: camChat.x, y: camChat.y, scale: camChat.scale,
    duration: 1.8, ease: CAMERA_GLIDE,
  }, 1.6);

  // ================================================================
  // BEAT — the real product flow: the user picks "Persona" from the
  //         chat hat. The aux panel pops open (chat-hat.js idiom,
  //         compressed) right as the camera lands, a phantom cursor
  //         rises from off-frame ONLY once the camera has settled,
  //         clicks Persona (ring pulse + selected brand-tint state),
  //         then exits before the composer typing beat picks up.
  // ================================================================
  const T_OPEN = 3.4; // camera glide above lands here (1.6 + 1.8)
  tl.to(auxBody, { maxHeight: bodyH, duration: 0.45, ease: 'power2.inOut' }, T_OPEN);
  tl.to(auxToggleSvg, { rotation: 180, duration: 0.45, ease: 'power2.inOut' }, T_OPEN);
  tl.to(auxPanel, {
    boxShadow: '0 0 30px 6px rgba(24,88,238,0.42), 0 0 74px 18px rgba(24,88,238,0.20)',
    duration: 0.22, ease: 'power2.out',
  }, T_OPEN);
  tl.to(auxPanel, {
    boxShadow: '0 0 0 0 rgba(24,88,238,0)',
    duration: 0.35, ease: 'power2.in',
  }, T_OPEN + 0.3);
  chips.forEach((chip, i) => {
    tl.to(chip, { opacity: 1, y: 0, duration: 0.32, ease: 'power2.out' }, T_OPEN + 0.15 + i * 0.045);
  });

  // The cursor's move-to-chip tween reads the chip's position via a
  // function value AT THE MOMENT THIS TWEEN STARTS PLAYING (the
  // project's documented function-value gotcha) — so it must not
  // start until the panel's max-height tween (ends T_OPEN+0.45=3.85)
  // AND the Persona chip's own cascade-in tween (ends ~4.05, index 4
  // of 8) have BOTH fully landed. Starting any earlier bakes in a
  // mid-expansion layout (the chip visibly lower, still animating),
  // which is exactly why the cursor previously arrived short of the
  // chip. 4.1 gives a small settle margin past both.
  const Tcursor = 4.1;
  tl.to(cursor, { opacity: 1, duration: 0.18 }, Tcursor);
  tl.to(cursor, {
    x: () => targetIn(personaChip, ctx.stage).x,
    y: () => targetIn(personaChip, ctx.stage).y,
    duration: 0.5, ease: 'power3.out',
  }, Tcursor);

  const Thover = 4.65;
  tl.to(personaChip, { backgroundColor: 'rgba(15,23,42,0.05)', duration: 0.12, ease: 'power2.out' }, Thover);

  const Tclick = 4.85;
  tl.fromTo(ring, { opacity: 0.9, scale: 0.4 }, { opacity: 0, scale: 1.8, duration: 0.45, ease: 'power2.out' }, Tclick);
  tl.to(cursor, { scale: 0.9, duration: 0.08, ease: 'power2.in' }, Tclick);
  tl.to(cursor, { scale: 1,   duration: 0.18, ease: 'back.out(2.4)' }, Tclick + 0.08);
  tl.to(personaChip, {
    backgroundColor: 'rgba(24,88,238,0.08)', borderColor: 'rgba(24,88,238,0.55)', color: '#1858ee',
    duration: 0.22, ease: 'power2.out',
  }, Tclick);

  // Hold ~0.25s with the click landed and the cursor still resting ON
  // the chip (selected + cursor-on-chip both visible together) before
  // anything starts moving again — the exit and the panel collapse
  // begin together, right at that hold's end.
  const T_AFTER_CLICK = Tclick + 0.25;

  // Cursor exits (fade + drift DOWN, never up/sideways) before typing.
  tl.to(cursor, { opacity: 0, y: '+=40', duration: 0.35, ease: 'power2.in' }, T_AFTER_CLICK);

  // The hat collapses back down once the flow is picked (matches the
  // real product — selecting a chip hands off to composing, it
  // doesn't sit open forever) — also keeps the chat column's height
  // stable for the rest of the cue, matching the camera anchor above.
  const T_CLOSE = T_AFTER_CLICK;
  tl.to(auxBody, { maxHeight: 0, duration: 0.4, ease: 'power2.inOut' }, T_CLOSE);
  tl.to(auxToggleSvg, { rotation: 0, duration: 0.4, ease: 'power2.inOut' }, T_CLOSE);

  // ================================================================
  // BEAT — THE SWING: straight from the chip click to the pane —
  //         camera glides to the lockup (identical framing math to
  //         ppt-board) while the persona document blur-fades in and
  //         cascades module by module. No composer/typing/Q&A beat.
  // ================================================================
  const camPane = ctx.cameraFor(canvasSide, 0.88, { x: 5, y: 57 });
  tl.to(world, {
    x: camPane.x, y: camPane.y, scale: camPane.scale,
    duration: 1.6, ease: CAMERA_GLIDE,
  }, 5.65);

  tl.to(scroller, { filter: 'blur(0px)', opacity: 1, duration: 0.75, ease: 'power2.out' }, 5.81);

  // The tab row now takes the banner's old slot (banner removed —
  // Bryan's call) so the doc's vertical rhythm has no orphaned gap.
  tl.to(tabsRow, { opacity: 1, y: 0, duration: 0.6, ease: CAMERA_SETTLE }, 6.05);
  tl.to(cover, { opacity: 1, y: 0, scale: 1, duration: 0.65, ease: CAMERA_SETTLE }, 6.20);

  // ----- Cover internals — the designed persona.js sequence
  //        (skeleton shimmer → portrait resolves → tags/title/chip),
  //        compressed to fit this cut's own pacing but otherwise the
  //        same story beats in the same order. No generation badge —
  //        that was never part of the original designed cover (Bryan
  //        verified against the source design); the blur-in + cascade
  //        alone carries the reveal, per house idiom. -------------- -
  tl.to(skeleton, { opacity: 1, duration: 0.5, ease: 'power2.out' }, 6.31);
  tl.to(skelBand, { xPercent: 120, duration: 0.55, ease: 'power1.inOut', repeat: 1 }, 6.41);

  tl.to(coverImg, {
    opacity: 1, filter: 'blur(0px) saturate(0.85)', scale: 1,
    duration: 0.75, ease: 'power2.out',
  }, 6.71);
  tl.to(skeleton, { opacity: 0, duration: 0.55, ease: 'power2.inOut' }, 6.91);

  tl.to(tagsTop, { opacity: 1, duration: 0.4, ease: 'power2.out' }, 7.31);
  tl.to(tagsMid, { opacity: 1, duration: 0.4, ease: 'power2.out' }, 7.41);
  tl.to(title, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.55, ease: 'power3.out' }, 7.31);
  tl.to(chipId, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, 7.56);

  // Demographics — the designed pd-head + pd-grid of pd-cards.
  tl.to(demoHead, { opacity: 1, y: 0, duration: 0.45, ease: CAMERA_SETTLE }, 7.91);
  tl.to(demoCards, {
    opacity: 1, y: 0, duration: 0.4, ease: 'power3.out', stagger: 0.06,
  }, 8.06);

  // Ken Burns on the cover — slow drift through the rest of the cue,
  // completing before cue end so nothing is still moving at the cut.
  const CUE_END = 9.11;
  tl.to(coverImg, {
    scale: 1.06, duration: CUE_END - 6.71 - 0.1, ease: 'sine.out',
  }, 6.71);

  // ----- Hold to cue end. -----
  tl.to({}, { duration: 0.1 }, CUE_END - 0.1);
}

function targetIn(el, stage) {
  const sr = stage.getBoundingClientRect();
  const r  = el.getBoundingClientRect();
  return {
    x: r.left - sr.left + r.width  / 2 - 5,
    y: r.top  - sr.top  + r.height / 2 - 3,
  };
}
