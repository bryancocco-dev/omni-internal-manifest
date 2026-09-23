/* ------------------------------------------------------------------
   VIGNETTE 4 — Model selector swap.
   Camera returns to the chat hat. The cursor clicks the model pill;
   the dropdown springs up from the bottom-right (exactly like
   chat-hat.vercel.app — opacity + translateY(6→0) + scale(0.97→1),
   transform-origin bottom-right, the pill warms + caret rotates).
   The cursor scans down to Claude Opus 4.8, the active check moves,
   the pill label swaps, and the menu collapses.
------------------------------------------------------------------ */

import { CAMERA_GLIDE } from './camera.js';

const CHECK_SVG = `<svg class="msm-check" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M3 7.5L6 10.5L11 4.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const MODELS = [
  'Claude Sonnet 4.6',
  'Claude Opus 4.8',
  'Claude Haiku 4.5',
  'GPT-5.5 (with Web Search)',
  'Gemini 3.1 Pro (Preview)',
];

const ACTIVE_START = 0; // Sonnet
const PICK = 1;         // Opus

let menuEl = null;

function ensureMenu(wrap) {
  if (menuEl && menuEl.isConnected) return menuEl;
  menuEl = document.createElement('div');
  menuEl.className = 'model-selector-menu';
  menuEl.innerHTML = MODELS.map((m, i) => `
    <button class="model-selector-menu-item ${i === ACTIVE_START ? 'active' : ''}" data-i="${i}" type="button">
      <span class="msm-label">${m}</span>
      ${CHECK_SVG}
    </button>
  `).join('');
  wrap.appendChild(menuEl);
  return menuEl;
}

export function featureFlexVignette(tl, ctx) {
  const { world, chatHat, modelPill, modelLabel, modelCaret, modelWrap } = ctx.canvas;
  const cursor = ctx.cursor;
  const ring   = cursor.querySelector('.cursor-ring');

  const menu  = ensureMenu(modelWrap);
  const rows  = Array.from(menu.querySelectorAll('.model-selector-menu-item'));
  const caretSvg = modelCaret.querySelector('svg');

  // ----- Camera: back to the chat-hat frame, biased to the composer -----
  const cam = ctx.cameraFor(chatHat, 0.95, { x: 0, y: -60 });
  tl.to(world, {
    x: cam.x, y: cam.y, scale: cam.scale,
    duration: 1.0, ease: CAMERA_GLIDE,
  }, 0);

  // ----- Pre-state (reset for clean loops) -----
  tl.set(menu, { opacity: 0, y: 6, scale: 0.97, transformOrigin: 'bottom right' }, 0);
  tl.set(caretSvg, { rotation: 0, transformOrigin: '50% 50%' }, 0);
  tl.set(cursor, { opacity: 0, scale: 1 }, 0);
  tl.set(ring, { opacity: 0, scale: 0.4 }, 0);
  tl.add(() => {
    modelLabel.textContent = MODELS[ACTIVE_START];
    modelPill.classList.remove('is-open');
    rows.forEach((r, i) => {
      r.classList.toggle('active', i === ACTIVE_START);
      r.classList.remove('is-hover');
    });
  }, 0);

  // ----- Cursor arrives at the model pill -----
  // Start the approach only after the camera settles (1.0s): the end
  // target is a function GSAP captures when the tween begins, so a
  // mid-fly start would aim at where the pill *was*, not where it lands.
  tl.to(cursor, { opacity: 1, duration: 0.25 }, 0.85);
  tl.to(cursor, {
    x: () => targetIn(modelPill, ctx.stage).x,
    y: () => targetIn(modelPill, ctx.stage).y,
    duration: 0.4, ease: 'power3.inOut',
  }, 1.05);

  // ----- Click → pill opens, menu springs up, caret rotates -----
  tl.fromTo(ring,
    { opacity: 0.9, scale: 0.4 },
    { opacity: 0, scale: 1.8, duration: 0.55, ease: 'power2.out' },
    1.45
  );
  tl.to(cursor, { scale: 0.92, duration: 0.08, ease: 'power2.in' }, 1.45);
  tl.to(cursor, { scale: 1,    duration: 0.20, ease: 'back.out(2.4)' }, 1.53);

  tl.add(() => modelPill.classList.add('is-open'), 1.5);
  tl.to(caretSvg, { rotation: 180, duration: 0.22, ease: 'power2.out' }, 1.5);
  // Menu open — the exact chat-hat.vercel.app spring (240ms, strong ease-out).
  tl.to(menu, {
    opacity: 1, y: 0, scale: 1,
    duration: 0.24, ease: 'power3.out',
  }, 1.5);

  // ----- Cursor scans down to Claude Opus 4.8; row highlights -----
  tl.to(cursor, {
    x: () => targetIn(rows[PICK], ctx.stage).x,
    y: () => targetIn(rows[PICK], ctx.stage).y,
    duration: 0.6, ease: 'power2.inOut',
  }, 2.0);
  tl.add(() => rows[PICK].classList.add('is-hover'), 2.25);

  // ----- Click Opus → active check moves, label swaps -----
  tl.fromTo(ring,
    { opacity: 0.9, scale: 0.4 },
    { opacity: 0, scale: 1.8, duration: 0.55, ease: 'power2.out' },
    2.5
  );
  tl.to(cursor, { scale: 0.92, duration: 0.08, ease: 'power2.in' }, 2.5);
  tl.to(cursor, { scale: 1,    duration: 0.20, ease: 'back.out(2.4)' }, 2.58);

  // Move the active state (checkmark fades in on Opus, out on Sonnet).
  tl.add(() => {
    rows.forEach((r, i) => r.classList.toggle('active', i === PICK));
    rows[PICK].classList.remove('is-hover');
  }, 2.62);
  // Label crossfades — the textContent swap + fade-in MUST carry explicit
  // positions, else GSAP appends them at the timeline's end and the new
  // model only appears in the final frame (reading as a late flicker).
  tl.to(modelLabel, { opacity: 0, duration: 0.16, ease: 'power2.in' }, 2.62);
  tl.add(() => { modelLabel.textContent = MODELS[PICK]; }, 2.78);
  tl.to(modelLabel, { opacity: 1, duration: 0.22, ease: 'power2.out' }, 2.78);

  // ----- Menu collapses (reverse of the spring), pill cools -----
  tl.to(menu, {
    opacity: 0, y: 6, scale: 0.97,
    duration: 0.20, ease: 'power2.in',
  }, 3.05);
  tl.to(caretSvg, { rotation: 0, duration: 0.22, ease: 'power2.out' }, 3.05);
  tl.add(() => modelPill.classList.remove('is-open'), 3.1);

  // ----- Cursor drifts off-frame -----
  tl.to(cursor, {
    opacity: 0, x: '+=120', y: '+=80',
    duration: 0.55, ease: 'power2.in',
  }, 3.3);

  // Settle gap before the close bookend. The pill is LEFT showing the
  // new model (Opus) — the reset back to Sonnet happens later, inside
  // the close bookend once the world has faded out (resetToWash), so
  // the switch never visibly flips back while the hat is on screen.
  tl.to({}, { duration: 0.4 });
}

function targetIn(el, stage) {
  const sr = stage.getBoundingClientRect();
  const r  = el.getBoundingClientRect();
  return {
    x: r.left - sr.left + r.width  / 2 - 5,
    y: r.top  - sr.top  + r.height / 2 - 3,
  };
}
