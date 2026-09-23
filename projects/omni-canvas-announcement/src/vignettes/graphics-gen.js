/* ------------------------------------------------------------------
   VIGNETTE — Graphics generation ("Welcome to Canvas" default loop).
   Picks up right after chat-hat.js clicks into the composer:
     • the composer caret blinks twice
     • the campaign prompt types itself into the composer, char by char
     • send button pulses
     • camera glides (CAMERA_GLIDE) from the chat hat to the IMAGES
       zone of the canvas board; the empty-canvas hero logo dissolves
     • 4 skeleton cards (aurora + breath, GSAP-driven — no CSS
       keyframes) stagger-resolve into the 4 generated shoot images
       with the buildGeneratedCard meta chrome (SPEC section 3).
   Content stays on screen at cue end — resetToWash clears it.
------------------------------------------------------------------ */

import { CAMERA_GLIDE } from './camera.js';

const PROMPT = 'Launch shoot — the coupe on the Pacific Coast Highway at golden hour';

const SHOOTS = [
  { src: '/shoot-01.webp' },
  { src: '/shoot-02.webp' },
  { src: '/shoot-03.webp' },
  { src: '/shoot-04.webp' },
];

const ZONE_HTML = `
  <div class="xgg-zone" data-images-zone>
    <div class="xgg-zone-eyebrow" data-zone-eyebrow>Coastline Campaign — Images · 4</div>
    <div class="xgg-grid" data-images-grid>
      ${SHOOTS.map((s, i) => `
        <figure class="xgg-card" data-card data-idx="${i}">
          <div class="xgg-card-skel" data-skel>
            <span class="xgg-card-skel-aurora" data-aurora></span>
            <span class="xgg-card-skel-breath" data-breath></span>
          </div>
          <img class="xgg-card-img" data-img src="${s.src}" alt="${PROMPT}" />
          <div class="xgg-card-glass" data-glass>
            <div class="xgg-card-meta-row">
              <span class="xgg-card-model">Imagen 4</span>
              <span class="xgg-card-time">Just now</span>
            </div>
          </div>
        </figure>
      `).join('')}
    </div>
  </div>
`;

export function graphicsGenVignette(tl, ctx) {
  const { world, chatHat, hero, scrollCanvas, scrollS1 } = ctx.canvas;

  // Mount into the scroll-canvas' first section — the flat surface
  // the whole generation stack lives on (no shell chrome from here).
  scrollS1.innerHTML = ZONE_HTML;

  const zone       = scrollS1.querySelector('[data-images-zone]');
  const zoneEyebrow= scrollS1.querySelector('[data-zone-eyebrow]');
  const cards      = Array.from(scrollS1.querySelectorAll('[data-card]'));
  const skels      = Array.from(scrollS1.querySelectorAll('[data-skel]'));
  const auroras    = Array.from(scrollS1.querySelectorAll('[data-aurora]'));
  const breaths    = Array.from(scrollS1.querySelectorAll('[data-breath]'));
  const imgs       = Array.from(scrollS1.querySelectorAll('[data-img]'));
  const glasses    = Array.from(scrollS1.querySelectorAll('[data-glass]'));

  const composerRest   = chatHat.querySelector('[data-composer-rest]');
  const composerCaret  = chatHat.querySelector('[data-composer-caret]');
  const typedEl        = chatHat.querySelector('[data-typed-prompt]');
  const sendBtn        = chatHat.querySelector('.round-btn.send');

  // ----- Pre-state (pinned to 0) -----
  tl.set(scrollCanvas, { opacity: 0 }, 0);
  tl.set(zone, { opacity: 1 }, 0);
  tl.set(hero, { opacity: 1 }, 0);

  tl.set(composerRest, { opacity: 1 }, 0);
  tl.set(composerCaret, { opacity: 0 }, 0);
  tl.set(typedEl, { opacity: 1 }, 0);
  tl.call(() => { typedEl.textContent = ''; }, null, 0);

  tl.set(sendBtn, { scale: 1, boxShadow: '0 0 0 0 rgba(24,88,238,0)' }, 0);

  tl.set(zoneEyebrow, { opacity: 0, y: 8 }, 0);
  tl.set(cards, { opacity: 0 }, 0);
  tl.set(skels, { opacity: 1 }, 0);
  tl.set(auroras, { opacity: 0 }, 0);
  tl.set(breaths, { opacity: 0 }, 0);
  tl.set(imgs, { opacity: 0, scale: 1.04, filter: 'blur(14px)' }, 0);
  tl.set(glasses, { opacity: 0, y: 6 }, 0);

  // ===== Composer caret blinks twice, prompt types straight in =====
  tl.set(composerCaret, { opacity: 1 }, 0.15);
  tl.set(composerCaret, { opacity: 0 }, 0.33);
  tl.set(composerCaret, { opacity: 1 }, 0.51);
  tl.set(composerCaret, { opacity: 0 }, 0.69);
  tl.to(composerRest, { opacity: 0, duration: 0.2, ease: 'power2.in' }, 0.50);

  const typeState = { n: 0 };
  tl.to(typeState, {
    n: PROMPT.length, duration: 1.35, ease: 'none',
    onUpdate: () => { typedEl.textContent = PROMPT.slice(0, Math.round(typeState.n)); },
  }, 0.75);

  // ----- Send button pulse -----
  tl.to(sendBtn, { scale: 1.12, duration: 0.12, ease: 'power2.out' }, 2.35);
  tl.to(sendBtn, { scale: 1,    duration: 0.22, ease: 'power2.out' }, 2.47);
  tl.to(sendBtn, {
    boxShadow: '0 0 0 10px rgba(24,88,238,0.22)',
    duration: 0.25, ease: 'power2.out',
  }, 2.35);
  tl.to(sendBtn, {
    boxShadow: '0 0 0 0 rgba(24,88,238,0)',
    duration: 0.35, ease: 'power2.in',
  }, 2.60);

  // ----- Camera glides onto the scroll canvas (S1); the flat plane
  //        fades in under the flight so the shell chrome hands off to
  //        a clean solid surface by the time the camera lands. -----
  const cam = ctx.cameraFor(scrollS1, 0.84, { x: 0, y: -6 });
  tl.to(world, {
    x: cam.x, y: cam.y, scale: cam.scale,
    duration: 1.1, ease: CAMERA_GLIDE,
  }, 2.35);
  tl.to(scrollCanvas, { opacity: 1, duration: 0.55, ease: 'power2.inOut' }, 2.50);
  tl.to(hero, { opacity: 0, duration: 0.5, ease: 'power2.inOut' }, 2.35);

  // ----- The board comes into view: eyebrow + 4 skeleton cards -----
  tl.to(cards, { opacity: 1, duration: 0.35, ease: 'power2.out' }, 3.20);
  tl.to(zoneEyebrow, { opacity: 1, y: 0, duration: 0.40, ease: 'power2.out' }, 3.30);

  // ----- Skeleton "aurora + breath" shimmer (GSAP-driven, no CSS
  //        keyframes), sized per-card so each finishes exactly as its
  //        own resolve begins — no overlapping tweens fighting on the
  //        same property. -----
  const SHIMMER_START = 2.60;
  const RESOLVE_START = [3.00, 3.23, 3.46, 3.69];

  cards.forEach((_, i) => {
    const auroraDur = (RESOLVE_START[i] - SHIMMER_START) / 2;
    const breathDur = auroraDur * 0.82;
    tl.to(auroras[i], {
      opacity: 0.6, duration: auroraDur, repeat: 1, yoyo: true, ease: 'sine.inOut',
    }, SHIMMER_START);
    tl.to(breaths[i], {
      opacity: 0.45, duration: breathDur, repeat: 1, yoyo: true, ease: 'sine.inOut',
    }, SHIMMER_START + 0.08);
  });

  // ----- Stagger-resolve into image cards (blur-up + meta row fade) -----
  RESOLVE_START.forEach((start, i) => {
    tl.to(skels[i], { opacity: 0, duration: 0.25, ease: 'power2.inOut' }, start);
    tl.to(imgs[i], {
      opacity: 1, scale: 1, filter: 'blur(0px)',
      duration: 0.55, ease: 'power2.out',
    }, start);
    tl.to(glasses[i], {
      opacity: 1, y: 0, duration: 0.35, ease: 'power2.out',
    }, start + 0.22);
  });

  // ----- Ken Burns: each resolved image drifts a breath deeper into
  //        its frame while the camera lingers — the drift completes
  //        before this cue ends, so nothing is still zooming by the
  //        time the finale wide shot arrives. -----
  const CUE_END = 5.6;
  RESOLVE_START.forEach((start, i) => {
    const kbStart = start + 0.58;
    tl.to(imgs[i], {
      scale: 1.06, duration: CUE_END - kbStart - 0.05, ease: 'power1.out',
    }, kbStart);
  });

  // ----- Hold on the resolved board before the next cue takes the camera -----
  const lastEnd = RESOLVE_START[RESOLVE_START.length - 1] + 0.55;
  tl.to({}, { duration: Math.max(CUE_END - lastEnd, 0.1) }, lastEnd);
}
