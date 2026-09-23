/* ------------------------------------------------------------------
   VIGNETTE 3 — Required Agents overlay.
   The phantom user clicks the Agents tool (tooltip: "N of 68 workspace
   agents are available") to spawn the Required Agents overlay, then
   turns agents on / off via square checkboxes.

   The establishing shot shows the real left rail in context; this
   vignette frames a clean, self-contained rail tool + overlay so the
   click + toggle read clearly. GSAP-driven (scrub-safe for capture).
------------------------------------------------------------------ */

import { CAMERA_GLIDE } from './camera.js';

const CHECK_PATH = 'M5 9.5 L8.4 13 L14.5 6';

const AGENTS = [
  { name: 'General',         desc: 'A normal user',                                                          date: 'May 12, 2026', on: true  },
  { name: 'Copywriter',      desc: 'A creative copywriter crafts engaging, persuasive content across briefs.', date: 'May 10, 2026', on: false },
  { name: 'Strategist',      desc: 'A creative strategist develops innovative concepts and narratives.',       date: 'May 09, 2026', on: false },
  { name: 'Account',         desc: 'An account manager builds and maintains client relationships.',            date: 'May 07, 2026', on: false },
  { name: 'Prompt Engineer', desc: 'Structures prompts and chains for repeatable, brand-aligned output.',      date: 'May 04, 2026', on: false },
];

const TOTAL = 68;

const MODAL_HTML = `
  <div class="agents-modal" id="agents-modal">
    <div class="am-head">
      <span class="am-title">Required Agents</span>
      <span class="am-count" id="am-count"><b>1</b> of ${TOTAL} included</span>
      <span class="am-spacer"></span>
      <span class="am-close">
        <svg width="18" height="18" viewBox="0 0 14 14" fill="none"><path d="M1 1L13 13M13 1L1 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
      </span>
    </div>
    <div class="am-search">
      <svg width="18" height="18" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="5" stroke="currentColor" stroke-width="1.5"/><path d="M11 11l3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
      <span>Search</span>
    </div>
    <div class="am-body">
      <div class="am-sidebar">
        <div class="am-side-item"><span class="am-side-dot"></span>Excluded</div>
        <div class="am-side-item"><span class="am-side-dot"></span>Included</div>
        <div class="am-side-item active"><span class="am-side-dot"></span>My Agents</div>
      </div>
      <div class="am-table">
        <div class="am-thead">
          <span></span>
          <span class="am-th">Agent</span>
          <span class="am-th">Description</span>
          <span class="am-th">Date Modified</span>
        </div>
        <div class="am-tbody" id="am-tbody">
          ${AGENTS.map((a, i) => `
            <div class="am-row" data-i="${i}">
              <span class="am-check" data-check="${i}">
                <span class="am-check-fill"></span>
                <svg class="am-check-mark" viewBox="0 0 20 20"><path d="${CHECK_PATH}"/></svg>
              </span>
              <span class="am-row-name">${a.name}</span>
              <span class="am-row-desc">${a.desc}</span>
              <span class="am-row-date">${a.date}</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  </div>
`;

export function agentsVignette(tl, ctx) {
  const { world, layerAgents, railAgents, railTip } = ctx.canvas;
  layerAgents.innerHTML = MODAL_HTML;

  const tool   = railAgents;        // the REAL tool in the app's bottom-left rail
  const tip    = railTip;
  const modal  = layerAgents.querySelector('#agents-modal');
  const rows   = Array.from(layerAgents.querySelectorAll('.am-row'));
  const countEl= layerAgents.querySelector('#am-count');
  const cursor = ctx.cursor;
  const ring   = cursor.querySelector('.cursor-ring');

  const checkParts = (i) => {
    const c = layerAgents.querySelector(`[data-check="${i}"]`);
    return { box: c, fill: c.querySelector('.am-check-fill'), mark: c.querySelector('.am-check-mark') };
  };

  const counter = { v: 1 };
  const writeCount = () => { countEl.innerHTML = `<b>${Math.round(counter.v)}</b> of ${TOTAL} included`; };

  // ----- Pre-state -----
  tl.set(layerAgents, { opacity: 1 }, 0);
  tl.set(tip,   { opacity: 0, x: -10 }, 0);
  tl.set(modal, { opacity: 0, scale: 0.92, y: 14, transformOrigin: '20% 30%' }, 0);
  tl.set(rows,  { opacity: 0, y: 10 }, 0);
  // Tool starts in its RESTING state — only highlights on hover.
  tl.set(tool,  { scale: 1, backgroundColor: 'rgba(24,88,238,0)', color: '#818ea6', transformOrigin: '50% 50%' }, 0);
  tl.set(cursor, { opacity: 0, scale: 1, x: 300, y: 760 }, 0);
  tl.set(ring,  { opacity: 0, scale: 0.4 }, 0);
  AGENTS.forEach((a, i) => {
    const { box, fill, mark } = checkParts(i);
    tl.set(box,  { borderColor: a.on ? '#1858ee' : '#818ea6' }, 0);
    tl.set(fill, { scale: a.on ? 1 : 0 }, 0);
    tl.set(mark, { opacity: a.on ? 1 : 0, scale: a.on ? 1 : 0.4, transformOrigin: '50% 50%' }, 0);
  });
  tl.set(counter, { v: 1 }, 0);
  tl.add(writeCount, 0);

  // ===== PHASE 1 — click the Agents tool in the app's bottom-left rail =====
  // Frame the real rail tools where they live (bottom-left of the app),
  // with the tool left-of-centre so the tooltip has room to its right.
  const camRail = ctx.cameraFor(tool, 1.15, { x: -150 });
  tl.to(world, { x: camRail.x, y: camRail.y, scale: camRail.scale, duration: 1.2, ease: CAMERA_GLIDE }, 0);

  // The cursor approach must start AFTER the camera settles (1.2s):
  // its end target is a function value GSAP evaluates when the tween
  // begins, so if it starts mid-fly it aims at where the tool *was*,
  // not where it lands. Begin the move once the rail is parked.
  tl.to(cursor, { opacity: 1, duration: 0.25 }, 0.95);
  tl.to(cursor, {
    x: () => targetIn(tool, ctx.stage).x,
    y: () => targetIn(tool, ctx.stage).y,
    duration: 0.7, ease: 'power3.inOut',
  }, 1.25);

  // Highlight the tool only as the cursor lands on it (hover/active state).
  tl.to(tool, { backgroundColor: 'rgba(24,88,238,0.08)', color: '#1858ee', duration: 0.2, ease: 'power2.out' }, 1.85);

  tl.to(tip, { opacity: 1, x: 0, duration: 0.4, ease: 'power2.out' }, 1.6);

  const Tc = 2.25;
  tl.fromTo(ring, { opacity: 0.9, scale: 0.4 }, { opacity: 0, scale: 1.7, duration: 0.5, ease: 'power2.out' }, Tc);
  tl.to(cursor, { scale: 0.9, duration: 0.08, ease: 'power2.in' }, Tc);
  tl.to(cursor, { scale: 1,   duration: 0.22, ease: 'power2.out' }, Tc + 0.08);
  tl.to(tool,   { scale: 0.9, duration: 0.09, ease: 'power2.in' }, Tc);
  tl.to(tool,   { scale: 1,   duration: 0.3,  ease: 'power2.out' }, Tc + 0.09);

  // ===== PHASE 2 — overlay spawns on the canvas, camera flies over =====
  tl.to(tip,  { opacity: 0, x: -8, duration: 0.3, ease: 'power2.in' }, Tc + 0.35);

  const camModal = ctx.cameraFor(modal, 0.95);
  tl.to(world, { x: camModal.x, y: camModal.y, scale: camModal.scale, duration: 1.0, ease: CAMERA_GLIDE }, Tc + 0.4);

  tl.to(modal, { opacity: 1, scale: 1, y: 0, duration: 0.5, ease: 'power3.out' }, Tc + 0.45);
  tl.to(rows,  { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out', stagger: 0.06 }, Tc + 0.8);

  // ===== PHASE 3 — toggle agents on / off =====
  const toggle = (i, on, t) => {
    const { box, fill, mark } = checkParts(i);
    if (on) {
      tl.to(fill, { scale: 1, duration: 0.26, ease: 'back.out(2)' }, t);
      tl.to(box,  { borderColor: '#1858ee', duration: 0.2, ease: 'power2.out' }, t);
      tl.fromTo(mark, { opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1, duration: 0.3, ease: 'back.out(2.4)' }, t + 0.04);
    } else {
      tl.to(mark, { opacity: 0, scale: 0.4, duration: 0.18, ease: 'power2.in' }, t);
      tl.to(fill, { scale: 0, duration: 0.24, ease: 'power2.in' }, t + 0.02);
      tl.to(box,  { borderColor: '#818ea6', duration: 0.24, ease: 'power2.out' }, t + 0.06);
    }
  };

  const clickRow = (i, on, t, toVal) => {
    tl.to(cursor, {
      x: () => targetIn(checkParts(i).box, ctx.stage).x,
      y: () => targetIn(checkParts(i).box, ctx.stage).y,
      duration: 0.55, ease: 'power3.inOut',
    }, t);
    tl.fromTo(ring, { opacity: 0.9, scale: 0.4 }, { opacity: 0, scale: 1.7, duration: 0.5, ease: 'power2.out' }, t + 0.6);
    tl.to(cursor, { scale: 0.92, duration: 0.08, ease: 'power2.in' }, t + 0.6);
    tl.to(cursor, { scale: 1, duration: 0.2, ease: 'power2.out' }, t + 0.68);
    toggle(i, on, t + 0.65);
    tl.to(counter, { v: toVal, duration: 0.01, onUpdate: writeCount }, t + 0.67);
  };

  const P = Tc + 1.7;
  clickRow(1, true,  P,        2);
  clickRow(2, true,  P + 0.95, 3);
  clickRow(0, false, P + 1.9,  2);

  tl.to({}, { duration: 0.5 });

  // ----- Exit -----
  tl.to(cursor, { opacity: 0, duration: 0.3, ease: 'power2.in' }, P + 2.9);
  tl.to(modal, { opacity: 0, scale: 0.99, y: -8, duration: 0.5, ease: 'power2.in' }, P + 3.0);
}

function targetIn(el, stage) {
  const sr = stage.getBoundingClientRect();
  const r  = el.getBoundingClientRect();
  return {
    x: r.left - sr.left + r.width  / 2 - 5,
    y: r.top  - sr.top  + r.height / 2 - 3,
  };
}
