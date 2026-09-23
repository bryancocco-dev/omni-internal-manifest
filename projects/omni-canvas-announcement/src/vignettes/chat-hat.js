/* ------------------------------------------------------------------
   VIGNETTE 1 — Chat Hat opening with the authentic chat-hat.vercel.app
   "ch-first-reveal" intro:
     • header stays put (title + breath-dot + chevron from first paint)
     • the BODY pops open (max-height 0 → full)
     • an accent halo blooms around the panel as it lights up
     • a diagonal sheen sweeps across the surface
     • chips fade + 4px-lift in, tightly staggered
   Then the phantom cursor lands on Creative Brief and clicks.

   Reproduced as GSAP tweens (not CSS @keyframes) so the whole reveal
   lives on the scrubbable master timeline — deterministic + loopable
   for MP4 capture.
------------------------------------------------------------------ */

import { CAMERA_GLIDE } from './camera.js';

export function chatHatVignette(tl, ctx) {
  const { world, chatHat, chips } = ctx.canvas;
  const cursor = ctx.cursor;
  const ring = cursor.querySelector('.cursor-ring');

  const panel     = chatHat.querySelector('.chat-aux-panel');
  const body      = chatHat.querySelector('.chat-aux-body');
  const toggleSvg = chatHat.querySelector('.chat-aux-toggle svg');
  const composerTextarea = chatHat.querySelector('.composer-textarea');

  // Natural open height of the body, measured from the build-time
  // (open) layout so the pop-open tween has a real px target.
  const bodyH = body.scrollHeight || 260;

  // Diagonal sheen overlay — injected once, clipped to the panel.
  let sheen = panel.querySelector('.ch-fr-sheen');
  if (!sheen) {
    sheen = document.createElement('span');
    sheen.className = 'ch-fr-sheen';
    panel.appendChild(sheen);
  }

  // Camera framing — fly from the establishing shot IN to the chat hat,
  // centered in the frame on its open-state layout.
  // Tighter zoom now that the hat chrome runs lighter/smaller — the
  // panel should command the frame during its beats.
  const cam = ctx.cameraFor(chatHat, 1.0, { x: 0, y: 26 });

  // ----- Pre-state (pinned to 0) — the hat starts collapsed -----
  tl.set(panel, { boxShadow: '0 0 0 0 rgba(24,88,238,0)' }, 0);
  tl.set(body,  { maxHeight: 0, overflow: 'hidden' }, 0);
  tl.set(toggleSvg, { rotation: 0, transformOrigin: '50% 50%' }, 0);
  tl.set(chips, { opacity: 0, y: 4 }, 0);
  tl.set(sheen, { opacity: 0, backgroundPosition: '130% 0' }, 0);
  tl.set(cursor, { opacity: 0, scale: 1, x: 720, y: 760 }, 0);
  tl.set(ring,   { opacity: 0, scale: 0.4 }, 0);

  // ----- Camera flies from the establishing shot to the chat hat -----
  tl.to(world, { x: cam.x, y: cam.y, scale: cam.scale, duration: 1.3, ease: CAMERA_GLIDE }, 0);

  // ===== ch-first-reveal — the pop-open (starts as the camera lands) =====
  const T = 1.15;

  // Body grows 0 → full (the core "pop open" gesture).
  tl.to(body,      { maxHeight: bodyH, duration: 0.7, ease: 'power2.inOut' }, T + 0.06);
  tl.to(toggleSvg, { rotation: 180,    duration: 0.7, ease: 'power2.inOut' }, T + 0.06);

  // Accent halo bloom — panel briefly "lit" as it opens (box-shadow,
  // so it reads outside the panel and doesn't shift layout).
  tl.to(panel, {
    boxShadow: '0 0 30px 6px rgba(24,88,238,0.42), 0 0 74px 18px rgba(24,88,238,0.20)',
    duration: 0.30, ease: 'power2.out',
  }, T + 0.06);
  tl.to(panel, {
    boxShadow: '0 0 0 0 rgba(24,88,238,0)',
    duration: 0.50, ease: 'power2.in',
  }, T + 0.36);

  // Diagonal sheen sweep across the surface.
  tl.to(sheen, { opacity: 1, duration: 0.18, ease: 'power1.out' }, T + 0.10);
  tl.to(sheen, { backgroundPosition: '-30% 0', duration: 0.80, ease: 'power2.inOut' }, T + 0.10);
  tl.to(sheen, { opacity: 0, duration: 0.25, ease: 'power1.in' }, T + 0.72);

  // Chips fade + 4px lift, tight 40ms stagger.
  chips.forEach((chip, i) => {
    tl.to(chip, {
      opacity: 1, y: 0,
      duration: 0.45, ease: 'power2.out',
    }, T + 0.46 + i * 0.04);
  });

  // Release the body clamp so nothing crops if layout reflows.
  tl.set(body, { maxHeight: 'none' }, T + 0.95);

  // ===== Cursor interaction — the phantom user clicks into the composer =====
  const C = T + 1.25; // after the reveal lands

  tl.to(cursor, { opacity: 1, duration: 0.25 }, C);
  tl.to(cursor, {
    x: () => targetIn(composerTextarea, ctx.stage).x,
    y: () => targetIn(composerTextarea, ctx.stage).y,
    duration: 0.9, ease: 'power3.inOut',
  }, C);

  // ----- ONE clean click -----
  // Everything lands on the same beat (Tc), after the cursor has
  // arrived and held briefly. No bounce on the release (an overshoot
  // pop reads as a second tap).
  const Tc = C + 1.15;

  // Cursor dip + click ring, same beat. Smooth return (no overshoot).
  tl.fromTo(ring,
    { opacity: 0.9, scale: 0.4 },
    { opacity: 0, scale: 1.7, duration: 0.55, ease: 'power2.out' },
    Tc
  );
  tl.to(cursor, { scale: 0.9, duration: 0.08, ease: 'power2.in' }, Tc);
  tl.to(cursor, { scale: 1,   duration: 0.26, ease: 'power2.out' }, Tc + 0.08);

  // Cursor lifts away and fades as the camera pans to the generation
  // beat (graphics-gen picks up from here with the composer caret).
  tl.to(cursor, { opacity: 0, duration: 0.3, ease: 'power2.in' }, Tc + 0.5);
}

/** Convert an element's center to coords inside the stage. */
function targetIn(el, stage) {
  const sr = stage.getBoundingClientRect();
  const r  = el.getBoundingClientRect();
  return {
    x: r.left - sr.left + r.width  / 2 - 5,
    y: r.top  - sr.top  + r.height / 2 - 3,
  };
}
