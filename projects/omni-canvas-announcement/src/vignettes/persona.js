/* ------------------------------------------------------------------
   VIGNETTE 2 — Persona generation.
   Flows from the user picking "Persona" in the chat hat. The camera
   pans to the canvas, where a full-bleed editorial PERSONA LIBRARY
   spread generates — mirroring lease-campaign canvas_3:
     • PERSONAS selector bar slides in
     • the duotone portrait hero resolves out of a generation sheen
     • the editorial headline + identity chip + mono meta tags reveal
     • a DEMOGRAPHICS hairline grid draws in card-by-card
   The "GENERATING PERSONA…" badge swaps to "PERSONA GENERATED".
------------------------------------------------------------------ */

import { CAMERA_GLIDE } from './camera.js';

const PERSONAS = [
  { name: 'The Pragmatist', sub: 'Mid Intent',  active: true  },
  { name: 'The Casual',     sub: 'Low Intent',  active: false },
  { name: 'The Enthusiast', sub: 'High Intent', active: false },
  { name: 'The Eco-First',  sub: 'EV Forward',  active: false },
];

const DEMOS = [
  { label: 'Age',          value: '30 – 44' },
  { label: 'Generation',   value: 'Millennial' },
  { label: 'Gender',       value: 'Female' },
  { label: 'Income',       value: '$90k – $140k' },
  { label: 'Education',    value: "Bachelor's +" },
  { label: 'Location',     value: 'Urban, US West' },
  { label: 'Household',    value: '2 – 3, partnered' },
  { label: 'Market',       value: 'United States' },
];

const PERSONA_HTML = `
  <div class="persona-spread" id="persona-spread">
    <nav class="ps-selector">
      <span class="psl-label">Personas</span>
      ${PERSONAS.map((p) => `
        <button class="psl-tab ${p.active ? 'is-active' : ''}" type="button">
          <span class="psl-name">${p.name}</span>
          <span class="psl-sub">${p.sub}</span>
        </button>
      `).join('')}
      <span class="psl-spacer"></span>
      <span class="psl-chat">Chat</span>
    </nav>

    <section class="ps-hero">
      <figure class="ph-portrait">
        <img src="/portrait-persona.png" alt="" />
      </figure>
      <div class="ph-skeleton"><div class="ph-skeleton-band"></div></div>
      <div class="ph-grid"></div>

      <div class="ph-tags ph-tags--top">
        <span>OMNI — Persona Library</span>
        <span>@omni.research</span>
        <span></span>
      </div>

      <div class="ph-badge">
        <span class="ph-badge-spark">✦</span>
        <span class="ph-badge-labels">
          <span class="ph-badge-lbl ph-badge-gen">Generating persona…</span>
          <span class="ph-badge-lbl ph-badge-done">Persona generated</span>
        </span>
      </div>

      <h1 class="ph-title">The <em>Pragmatic</em><br>Planner</h1>
      <div class="ph-chip">Maya, 34 — San Francisco, CA</div>

      <div class="ph-tags ph-tags--mid">
        <span>Mid Intent</span>
        <span>PR-002</span>
        <span>37.77° N · 122.41° W</span>
      </div>
    </section>

    <section class="ps-demos">
      <header class="pd-head">
        <span class="pd-num">01</span>
        <span class="pd-label">Demographics</span>
      </header>
      <div class="pd-grid">
        ${DEMOS.map((d) => `
          <div class="pd-card">
            <span class="pd-card-label">${d.label}</span>
            <span class="pd-card-value">${d.value}</span>
          </div>
        `).join('')}
      </div>
    </section>
  </div>
`;

export function personaVignette(tl, ctx) {
  const { world, layerMulti, hero, canvasStage } = ctx.canvas;
  layerMulti.innerHTML = PERSONA_HTML;

  const spread   = layerMulti.querySelector('#persona-spread');
  const selector = layerMulti.querySelector('.ps-selector');
  const tabs     = Array.from(layerMulti.querySelectorAll('.psl-tab'));
  const chatBtn  = layerMulti.querySelector('.psl-chat');
  const portrait = layerMulti.querySelector('.ph-portrait');
  const skeleton = layerMulti.querySelector('.ph-skeleton');
  const skelBand = layerMulti.querySelector('.ph-skeleton-band');
  const tagsTop  = layerMulti.querySelector('.ph-tags--top');
  const tagsMid  = layerMulti.querySelector('.ph-tags--mid');
  const badge    = layerMulti.querySelector('.ph-badge');
  const badgeSpark = layerMulti.querySelector('.ph-badge-spark');
  const lblGen   = layerMulti.querySelector('.ph-badge-gen');
  const lblDone  = layerMulti.querySelector('.ph-badge-done');
  const title    = layerMulti.querySelector('.ph-title');
  const chip     = layerMulti.querySelector('.ph-chip');
  const cards    = Array.from(layerMulti.querySelectorAll('.pd-card'));
  const pdHead   = layerMulti.querySelector('.pd-head');

  // ----- Pre-state -----
  tl.set(layerMulti, { opacity: 1 }, 0);
  tl.set(spread, { opacity: 0 }, 0);
  tl.set(selector, { opacity: 0, y: -14 }, 0);
  tl.set(tabs, { opacity: 0, y: -6 }, 0);
  tl.set(chatBtn, { opacity: 0 }, 0);
  tl.set(portrait, { opacity: 0, filter: 'blur(26px) saturate(0.4)', scale: 1.08 }, 0);
  tl.set(skeleton, { opacity: 0 }, 0);
  tl.set(skelBand, { xPercent: -120 }, 0);
  tl.set([tagsTop, tagsMid], { opacity: 0 }, 0);
  tl.set(badge, { opacity: 0, y: -6 }, 0);
  tl.set(title, { opacity: 0, y: 22, filter: 'blur(10px)' }, 0);
  tl.set(chip, { opacity: 0, y: 10 }, 0);
  tl.set(pdHead, { opacity: 0, y: 8 }, 0);
  tl.set(cards, { opacity: 0, y: 14 }, 0);
  tl.set(badgeSpark, { rotation: 0, color: '#8fb4ff', transformOrigin: '50% 50%' }, 0);
  tl.set(lblGen,  { opacity: 1 }, 0);
  tl.set(lblDone, { opacity: 0 }, 0);

  // ----- Camera pan: chat hat → the canvas-side, filling the frame -----
  const cam = ctx.cameraFor(canvasStage, 0.82, { y: -8 });
  tl.to(world, {
    x: cam.x, y: cam.y, scale: cam.scale,
    duration: 1.2, ease: CAMERA_GLIDE,
  }, 0);

  // The empty-canvas OMNI logo dissolves as the spread generates in.
  tl.to(hero, { opacity: 0, duration: 0.5, ease: 'power2.inOut' }, 0.4);

  // ----- Spread + selector slide in -----
  tl.to(spread, { opacity: 1, duration: 0.4, ease: 'power2.out' }, 0.7);
  tl.to(selector, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }, 0.8);
  tl.to(tabs, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out', stagger: 0.06 }, 0.95);
  tl.to(chatBtn, { opacity: 1, duration: 0.4, ease: 'power2.out' }, 1.15);

  // ----- Generation badge appears, spark spins while it works -----
  tl.to(badge, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, 1.2);
  tl.to(badgeSpark, { rotation: 360, duration: 1.6, ease: 'none' }, 1.2);

  // ----- Skeleton loader: the navy placeholder FADES IN, then a shimmer
  //        band sweeps across it repeatedly while it "generates".
  //        (GSAP-driven repeat → deterministic under MP4 scrub.) -----
  tl.to(skeleton, { opacity: 1, duration: 0.5, ease: 'power2.out' }, 0.95);
  tl.to(skelBand, {
    xPercent: 120, duration: 0.85, ease: 'power1.inOut', repeat: 1,
  }, 1.1);

  // ----- Portrait resolves smoothly out of the skeleton; the skeleton
  //        crossfades out as the blur clears (no hard cut). -----
  tl.to(portrait, {
    opacity: 1, filter: 'blur(0px) saturate(0.85)', scale: 1,
    duration: 1.15, ease: 'power2.out',
  }, 1.75);
  tl.to(skeleton, { opacity: 0, duration: 0.7, ease: 'power2.inOut' }, 2.05);

  // ----- Meta tags fade in once the photo has resolved over the skeleton -----
  tl.to(tagsTop, { opacity: 1, duration: 0.5, ease: 'power2.out' }, 2.45);
  tl.to(tagsMid, { opacity: 1, duration: 0.5, ease: 'power2.out' }, 2.6);

  // ----- Editorial headline blurs up, then the identity chip -----
  tl.to(title, {
    opacity: 1, y: 0, filter: 'blur(0px)',
    duration: 0.7, ease: 'power3.out',
  }, 2.6);
  tl.to(chip, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, 3.0);

  // ----- DEMOGRAPHICS draws in card-by-card -----
  tl.to(pdHead, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, 2.9);
  tl.to(cards, {
    opacity: 1, y: 0,
    duration: 0.45, ease: 'power3.out', stagger: 0.07,
  }, 3.1);

  // ----- Badge swaps "Generating…" → "Persona generated".
  //        Sequential (out fully, then in) so the two labels never
  //        overlap into garble. Spark warms blue → green. -----
  tl.to(lblGen,  { opacity: 0, duration: 0.22, ease: 'power2.in' }, 3.9);
  tl.to(lblDone, { opacity: 1, duration: 0.28, ease: 'power2.out' }, 4.16);
  tl.to(badgeSpark, { color: '#2de8af', duration: 0.3, ease: 'power2.out' }, 4.05);

  // Hold to read.
  tl.to({}, { duration: 0.6 });

  // ----- Exit before the camera pans on -----
  tl.to(spread, { opacity: 0, duration: 0.5, ease: 'power2.in' }, 5.1);
}
