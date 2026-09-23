/* ------------------------------------------------------------------
   VIGNETTE — VIDEO zone ("Welcome to Canvas" default loop, Exec B).
   Runs after graphics-gen fills the IMAGES zone. The camera glides
   from IMAGES over to the VIDEO zone (x564 y40 w492 h430 on the
   1096×978 canvasStage, layer ctx.canvas.layerAgents). A 16:9 skeleton
   card shimmers ("generating"), then resolves into a graphics-card-
   chrome video card (bigsur.mp4) with a frosted play badge, meta row,
   and a decorative progress bar as playback kicks in. Content stays
   on screen at cue end — resetToWash clears the layer at loop end.
------------------------------------------------------------------ */

import { CAMERA_GLIDE } from './camera.js';
import { mountPromptBar, promptBeatPreState, promptBeat } from './prompt-beat.js';

// Same "Video" glyph vocabulary already used elsewhere in this canvas
// (canvas-shell.js chip icon) — duplicated here, not imported, since
// this module may only touch its own two files.
const GLYPH_VIDEO = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M15 11.5C15 11.0205 14.66 10.6195 14.2095 10.523C14.3895 10.2225 14.5 9.875 14.5 9.5C14.5 8.397 13.603 7.5 12.5 7.5C11.7415 7.5 11.0895 7.9285 10.75 8.552C10.4105 7.9285 9.7585 7.5 9 7.5C7.897 7.5 7 8.397 7 9.5C7 9.951 7.156 10.3635 7.4085 10.698C7.28229 10.7903 7.17956 10.911 7.1086 11.0503C7.03764 11.1896 7.00044 11.3437 7 11.5V15.5C7 16.0515 7.4485 16.5 8 16.5H14C14.5515 16.5 15 16.0515 15 15.5V14.181L17 15.181V11.681L15 12.681V11.5ZM12.5 8.5C13.0515 8.5 13.5 8.9485 13.5 9.5C13.5 10.0515 13.0515 10.5 12.5 10.5C11.9485 10.5 11.5 10.0515 11.5 9.5C11.5 8.9485 11.9485 8.5 12.5 8.5ZM9 8.5C9.5515 8.5 10 8.9485 10 9.5C10 10.0515 9.5515 10.5 9 10.5C8.4485 10.5 8 10.0515 8 9.5C8 8.9485 8.4485 8.5 9 8.5ZM8 15.5V11.5H14L14.001 15.5H8Z"/></svg>`;

const VIDEO_HTML = `
  <div class="xvg-zone" id="xvg-zone">
    <div class="xvg-eyebrow" id="xvg-eyebrow">Coastline Campaign — Video</div>

    <div class="xvg-media-outer">
      <div class="xvg-media-box" id="xvg-media-box">

        <div class="xvg-skeleton" id="xvg-skeleton">
          <span class="xvg-skel-glyph" id="xvg-skel-glyph">${GLYPH_VIDEO}</span>
          <div class="xvg-skel-band" id="xvg-skel-band"></div>
        </div>

        <figure class="xvg-card" id="xvg-card">
          <video class="xvg-video" id="xvg-video" src="/bigsur.mp4" poster="/bigsur-poster.png" muted loop playsinline preload="auto"></video>

          <div class="xvg-play-badge" id="xvg-play-badge">
            <span class="xvg-play-disc">
              <svg class="xvg-play-tri" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8.5 5.2v13.6c0 .9 1 1.44 1.75.95l10.7-6.8a1.1 1.1 0 0 0 0-1.9l-10.7-6.8c-.75-.49-1.75.05-1.75.95Z"/></svg>
            </span>
          </div>

          <figcaption class="xvg-meta">
            <span class="xvg-meta-row2" id="xvg-meta-row2">
              <span class="xvg-chip xvg-model-chip" id="xvg-model-chip">Veo 3</span>
              <span class="xvg-chip xvg-label-chip" id="xvg-label-chip">Coastline flyover — :10</span>
              <span class="xvg-chip xvg-time-chip" id="xvg-time-chip">Just now</span>
            </span>
          </figcaption>

        </figure>

      </div>
    </div>
  </div>
`;

export function videoGenVignette(tl, ctx) {
  const { world, scrollS2 } = ctx.canvas;
  scrollS2.innerHTML = VIDEO_HTML;
  const layerAgents = scrollS2; // query root (section slot on the scroll canvas)
  const pb = mountPromptBar(scrollS2);

  const zone       = layerAgents.querySelector('#xvg-zone');
  const eyebrow    = layerAgents.querySelector('#xvg-eyebrow');
  const skeleton   = layerAgents.querySelector('#xvg-skeleton');
  const skelGlyph  = layerAgents.querySelector('#xvg-skel-glyph');
  const skelBand   = layerAgents.querySelector('#xvg-skel-band');
  const card       = layerAgents.querySelector('#xvg-card');
  const vid        = layerAgents.querySelector('#xvg-video');
  const playBadge  = layerAgents.querySelector('#xvg-play-badge');
  const modelChip  = layerAgents.querySelector('#xvg-model-chip');
  const labelChip  = layerAgents.querySelector('#xvg-label-chip');
  const timeChip   = layerAgents.querySelector('#xvg-time-chip');

  // ----- Pre-state (position 0): the whole section starts BELOW its
  //        resting spot (it rides up from the bottom of the frame as
  //        the camera tracks down the scroll canvas), video paused. -----
  tl.set(zone, { opacity: 0, y: 170 }, 0);
  tl.set(eyebrow, { opacity: 0, y: -6 }, 0);

  tl.set(skeleton, { opacity: 0 }, 0);
  tl.set(skelGlyph, { opacity: 0.5 }, 0);
  tl.set(skelBand, { xPercent: -130 }, 0);

  tl.set(card, { opacity: 0, scale: 0.98, filter: 'blur(6px)' }, 0);
  tl.set(playBadge, { opacity: 0, scale: 0.9 }, 0);
  tl.set([modelChip, labelChip, timeChip], { opacity: 0, y: 8 }, 0);
  tl.set(vid, { scale: 1, transformOrigin: '50% 50%' }, 0);

  tl.add(() => { vid.pause(); vid.currentTime = 0; }, 0);
  promptBeatPreState(tl, ctx, pb);

  // ----- Camera tracks DOWN the scroll canvas to S2 (images exit top) -----
  const cam = ctx.cameraFor(scrollS2, 0.84, { y: -6 });
  tl.to(world, { x: cam.x, y: cam.y, scale: cam.scale, duration: 1.2, ease: CAMERA_GLIDE }, 0);

  // ----- STORY BEAT: a lone caret blinks on the empty canvas, the
  //        prompt types, Generate is clicked — THEN the output rides in.
  promptBeat(tl, ctx, pb, { at: 0.9, text: 'Now turn the shoot into a :10 flyover' });

  // The section rides up into its slot from the bottom of the frame.
  tl.to(zone, { opacity: 1, y: 0, duration: 0.85, ease: 'power3.out' }, 4.5);

  // ----- Eyebrow -----
  tl.to(eyebrow, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, 4.6);

  // ----- Skeleton fades in, shimmer band sweeps ("generating") -----
  tl.to(skeleton, { opacity: 1, duration: 0.4, ease: 'power2.out' }, 4.65);
  tl.to(skelGlyph, { opacity: 0.9, duration: 0.55, ease: 'sine.inOut', yoyo: true, repeat: 3 }, 4.7);
  tl.to(skelBand, { xPercent: 130, duration: 0.7, ease: 'power1.inOut', repeat: 1 }, 4.85);

  // ----- Skeleton crossfades out as the resolved card fades/blurs in -----
  tl.to(skeleton, { opacity: 0, duration: 0.5, ease: 'power2.inOut' }, 6.05);
  tl.to(card, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 0.6, ease: 'power2.out' }, 6.1);

  // ----- Play badge appears paused; the cursor comes in and CLICKS it -----
  tl.to(playBadge, { opacity: 1, scale: 1, duration: 0.35, ease: 'power2.out' }, 6.25);

  const cursor = ctx.cursor;
  const ring   = cursor.querySelector('.cursor-ring');
  const disc   = layerAgents.querySelector('.xvg-play-disc');
  tl.set(cursor, { x: 470, y: 880, scale: 1 }, 6.4);
  tl.to(cursor, { opacity: 1, duration: 0.2 }, 6.5);
  tl.to(cursor, {
    x: () => vgTargetIn(disc, ctx.stage).x,
    y: () => vgTargetIn(disc, ctx.stage).y,
    duration: 0.6, ease: 'power3.inOut',
  }, 6.5);

  const T_PLAY = 7.3;
  tl.fromTo(ring, { opacity: 0.9, scale: 0.4 }, { opacity: 0, scale: 1.7, duration: 0.5, ease: 'power2.out' }, T_PLAY);
  tl.to(cursor, { scale: 0.9, duration: 0.08, ease: 'power2.in' }, T_PLAY);
  tl.to(cursor, { scale: 1,   duration: 0.22, ease: 'power2.out' }, T_PLAY + 0.08);
  tl.to(disc,   { scale: 0.88, duration: 0.1, ease: 'power2.in', transformOrigin: '50% 50%' }, T_PLAY);
  tl.to(disc,   { scale: 1,    duration: 0.2, ease: 'power2.out' }, T_PLAY + 0.1);

  tl.add(() => { vid.currentTime = 0; vid.play().catch(() => {}); }, T_PLAY + 0.18);
  tl.to(playBadge, { opacity: 0, scale: 0.9, duration: 0.4, ease: 'power2.in' }, T_PLAY + 0.22);
  tl.to(cursor, { opacity: 0, duration: 0.3, ease: 'power2.in' }, T_PLAY + 0.5);

  // ----- Micro Ken Burns on the playing video (ends within this cue) -----
  tl.to(vid, { scale: 1.035, duration: 2.0, ease: 'power1.out' }, T_PLAY + 0.25);

  // ----- Meta row reveals -----
  tl.to(modelChip, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }, 7.8);
  tl.to(labelChip, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }, 7.9);
  tl.to(timeChip,  { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }, 8.0);

  // ----- Hold — content stays on screen; resetToWash clears it later. -----
  tl.to({}, { duration: 0.85 }, 9.0);
}

/** Convert an element's center to coords inside the stage (cursor tip). */
function vgTargetIn(el, stage) {
  const sr = stage.getBoundingClientRect();
  const r  = el.getBoundingClientRect();
  return {
    x: r.left - sr.left + r.width  / 2 - 5,
    y: r.top  - sr.top  + r.height / 2 - 3,
  };
}
