/* ------------------------------------------------------------------
   LAUNCHER — the intro before the Canvas flow.
   1. OMNI logo blur-fades in (held), then blurs out.
   2. CUT to a row of the older app tiles (Text, Graphics, Video,
      Audio); they spread apart and the new Canvas tile loads into the
      centre.
   3. The cursor hovers Canvas and clicks it.
   4. revealApp() hands off to the full-screen Canvas flow.
   The whole launcher lives on the clean stage wash (its own overlay
   layer), separate from the Canvas "world" the camera flies around.
------------------------------------------------------------------ */

import { CAMERA_SETTLE } from './camera.js';

const OMNI_LOGO = `
<svg class="launcher-logo" viewBox="-40 -30 476 143" preserveAspectRatio="xMidYMid meet" overflow="visible" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <g>
    <path d="M47 0L35.11 0.35C17.43 3.04 3.38 16.88 0.41 34.88L0 47C3.07 67 20.39 81.93 40.63 82.09C61.07 82.24 78.55 67.22 81.43 46.38C84.53 23.92 68.53 3.84 47 0ZM40.84 61.69C29.46 61.69 20.23 52.46 20.23 41.08C20.23 29.7 29.46 20.47 40.84 20.47C52.22 20.47 61.45 29.7 61.45 41.08C61.45 52.46 52.22 61.69 40.84 61.69Z" fill="#0a0a0a"/>
    <path d="M156.33 80.93L155.99 33.11L135.94 69.03L134.3 70.9C133.81 71.46 131.86 69.99 131.69 69.43L111.1 32.22L110.69 80.83L90.6701 80.93L90.6401 1.49001C98.2501 0.950013 105.62 0.950013 113.88 1.37001L133.77 37.06L153.52 1.46001C161.31 0.930014 168.66 0.940013 176.92 1.48001V80.78L156.34 80.93H156.33Z" fill="#0a0a0a"/>
    <path d="M260.86 80.75L235.94 80.98L210.48 35.3699L210.15 80.95L190.05 80.79L190.02 1.65995C197.26 0.929951 204.26 0.899951 211.79 1.37001L240.03 49.93L240.46 1.40995C247.38 0.999951 253.59 0.999951 260.84 1.47995L260.86 80.74V80.75Z" fill="#0a0a0a"/>
    <path d="M293.95 1H273.59V80.91H293.95V1Z" fill="#0a0a0a"/>
    <path d="M357.9 78.5401C354.7 65.6801 350.84 50.1601 337.75 46.2801L320.54 41.1801L332.68 37.6201C350.8 32.3101 353.63 21.1701 357.82 3.11011L364.09 23.7701C371.83 36.0101 381.99 37.1301 395.47 41.2301C379.11 45.0601 367.12 47.9901 361.76 64.7501L357.9 78.5501V78.5401Z" fill="#0a0a0a"/>
  </g>
</svg>`;

const ICON_TEXT = `<svg viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="4.5" fill="#4AC9F1"/><path d="M8.5 10H9.5V9H11.126L9.84 15H8.5V16H12.5V15H11.374L12.66 9H14.5V10H15.5V8H8.5V10Z" fill="#2A2B32"/></svg>`;
const ICON_GRAPHICS = `<svg viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="4.5" fill="#87FFAF"/><path d="M15.5 7.5H8.5C7.9485 7.5 7.5 7.9485 7.5 8.5V15.5C7.5 16.0515 7.9485 16.5 8.5 16.5H15.5C16.0515 16.5 16.5 16.0515 16.5 15.5V8.5C16.5 7.9485 16.0515 7.5 15.5 7.5ZM8.5 15.5V8.5H15.5L15.501 15.5H8.5Z" fill="#2A2B32"/><path d="M11 13L10.5 12.5L9 14.5H15L12.5 11L11 13Z" fill="#2A2B32"/></svg>`;
const ICON_CANVAS = `<svg viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="4.5" fill="#3FCBC4"/><path d="M12.8166 6.22229C11.8548 6.09064 10.8753 6.19918 9.96563 6.53824C9.05596 6.87729 8.24439 7.4363 7.60336 8.16537C7.05474 8.79723 6.64768 9.53917 6.40952 10.3414C6.17137 11.1436 6.10764 11.9874 6.22261 12.8163C6.53178 15.0878 8.23978 17.0204 10.4722 17.6265C10.9699 17.7626 11.4834 17.8321 11.9994 17.833L12.0822 17.8324C12.3771 17.8286 12.6663 17.7503 12.9228 17.6049C13.1794 17.4595 13.3951 17.2516 13.5499 17.0005C13.7051 16.7508 13.7948 16.4659 13.8104 16.1723C13.826 15.8787 13.7671 15.5859 13.6391 15.3211L13.523 15.0785C13.4337 14.904 13.3918 14.7092 13.4014 14.5135C13.4111 14.3177 13.4719 14.128 13.5779 13.9631C13.7295 13.7168 13.967 13.5355 14.2446 13.4541C14.5221 13.3728 14.8199 13.3972 15.0805 13.5227L15.3209 13.6376C15.5612 13.7531 15.8167 13.812 16.0798 13.812C16.5402 13.8097 16.9814 13.6273 17.3091 13.3039C17.6368 12.9804 17.8249 12.5416 17.8333 12.0813C17.8405 11.5376 17.7712 10.9956 17.6274 10.4713C17.0207 8.23945 15.0881 6.53145 12.8166 6.22229ZM15.8254 12.5859L15.5851 12.471C14.5188 11.9588 13.2109 12.3555 12.5897 13.3425C12.1592 14.0285 12.1154 14.8451 12.4707 15.5836L12.5868 15.8263C12.6303 15.9144 12.6504 16.0123 12.6452 16.1105C12.64 16.2086 12.6096 16.3038 12.557 16.3869C12.5058 16.4717 12.4336 16.542 12.3474 16.5909C12.2612 16.6398 12.1638 16.6658 12.0647 16.6663H11.9994C11.5865 16.6651 11.1756 16.6096 10.7773 16.5012C8.99053 16.0165 7.62553 14.4718 7.37878 12.6594C7.19153 11.2856 7.58411 9.96262 8.48303 8.93245C8.99446 8.34575 9.64448 7.89625 10.3739 7.62484C11.1034 7.35343 11.8891 7.26874 12.6597 7.37845C14.4721 7.6252 16.0168 8.99079 16.5015 10.777C16.617 11.2028 16.6724 11.6368 16.666 12.0644C16.659 12.5351 16.1731 12.7545 15.8254 12.5859Z" fill="#1B1D21"/><path d="M9.37493 14.3329C9.85818 14.3329 10.2499 13.9412 10.2499 13.4579C10.2499 12.9747 9.85818 12.5829 9.37493 12.5829C8.89168 12.5829 8.49993 12.9747 8.49993 13.4579C8.49993 13.9412 8.89168 14.3329 9.37493 14.3329Z" fill="#1B1D21"/><path d="M9.37493 11.9996C9.85818 11.9996 10.2499 11.6078 10.2499 11.1246C10.2499 10.6413 9.85818 10.2496 9.37493 10.2496C8.89168 10.2496 8.49993 10.6413 8.49993 11.1246C8.49993 11.6078 8.89168 11.9996 9.37493 11.9996Z" fill="#1B1D21"/><path d="M11.1249 10.2496C11.6082 10.2496 11.9999 9.85784 11.9999 9.37459C11.9999 8.89134 11.6082 8.49959 11.1249 8.49959C10.6417 8.49959 10.2499 8.89134 10.2499 9.37459C10.2499 9.85784 10.6417 10.2496 11.1249 10.2496Z" fill="#1B1D21"/><path d="M13.4583 10.2496C13.9415 10.2496 14.3333 9.85784 14.3333 9.37459C14.3333 8.89134 13.9415 8.49959 13.4583 8.49959C12.975 8.49959 12.5833 8.89134 12.5833 9.37459C12.5833 9.85784 12.975 10.2496 13.4583 10.2496Z" fill="#1B1D21"/><defs><linearGradient id="lc_canvas_grad" x1="24" y1="24" x2="0" y2="0" gradientUnits="userSpaceOnUse"><stop stop-color="#2DE8AF"/><stop offset="1" stop-color="#27BAF9"/></linearGradient></defs></svg>`;
const ICON_VIDEO = `<svg viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="4.5" fill="#FF8787"/><path d="M15 11.5C15 11.0205 14.66 10.6195 14.2095 10.523C14.3895 10.2225 14.5 9.875 14.5 9.5C14.5 8.397 13.603 7.5 12.5 7.5C11.7415 7.5 11.0895 7.9285 10.75 8.552C10.4105 7.9285 9.7585 7.5 9 7.5C7.897 7.5 7 8.397 7 9.5C7 9.951 7.156 10.3635 7.4085 10.698C7.28229 10.7903 7.17956 10.911 7.1086 11.0503C7.03764 11.1896 7.00044 11.3437 7 11.5V15.5C7 16.0515 7.4485 16.5 8 16.5H14C14.5515 16.5 15 16.0515 15 15.5V14.181L17 15.181V11.681L15 12.681V11.5ZM12.5 8.5C13.0515 8.5 13.5 8.9485 13.5 9.5C13.5 10.0515 13.0515 10.5 12.5 10.5C11.9485 10.5 11.5 10.0515 11.5 9.5C11.5 8.9485 11.9485 8.5 12.5 8.5ZM9 8.5C9.5515 8.5 10 8.9485 10 9.5C10 10.0515 9.5515 10.5 9 10.5C8.4485 10.5 8 10.0515 8 9.5C8 8.9485 8.4485 8.5 9 8.5ZM8 15.5V11.5H14L14.001 15.5H8Z" fill="#2A2B32"/></svg>`;
const ICON_AUDIO = `<svg viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="4.5" fill="#7289EF"/><path d="M11.5 10.5H12.5V13.5H11.5V10.5ZM13.5 9H14.5V15H13.5V9ZM9.5 8H10.5V16H9.5V8ZM15.5 11.5H16.5V12.5H15.5V11.5ZM7.5 11H8.5V13H7.5V11Z" fill="#2A2B32"/></svg>`;

// Order in the FINAL row (Canvas in the centre).
const TILES = [
  { key: 'text',     label: 'Text',     icon: ICON_TEXT,     side: 'left'  },
  { key: 'graphics', label: 'Graphics', icon: ICON_GRAPHICS, side: 'left'  },
  { key: 'canvas',   label: 'Canvas',   icon: ICON_CANVAS,   side: 'center'},
  { key: 'video',    label: 'Video',    icon: ICON_VIDEO,    side: 'right' },
  { key: 'audio',    label: 'Audio',    icon: ICON_AUDIO,    side: 'right' },
];

export function mountLauncher(host) {
  host.innerHTML = `
    <div class="launcher" id="launcher">
      <div class="launcher-logo-wrap" id="launcher-logo-wrap">${OMNI_LOGO}</div>
      <div class="launcher-tiles" id="launcher-tiles">
        ${TILES.map(t => `
          <div class="app-tile" data-app="${t.key}">
            <span class="app-tile-icon">${t.icon}</span>
            <span class="app-tile-label">${t.label}</span>
          </div>`).join('')}
      </div>
    </div>`;
  const tiles = {};
  TILES.forEach(t => { tiles[t.key] = host.querySelector(`[data-app="${t.key}"]`); });
  return {
    root:    host.querySelector('#launcher'),
    logo:    host.querySelector('.launcher-logo'),
    logoWrap:host.querySelector('#launcher-logo-wrap'),
    tilesRow:host.querySelector('#launcher-tiles'),
    tiles,
  };
}

/** Phase 1 — OMNI logo blur-fades in, holds, blurs out. */
export function logoIntro(tl, ctx) {
  const L = ctx.launcher;
  tl.set(L.root, { opacity: 1 }, 0);
  tl.set(L.tilesRow, { opacity: 0 }, 0);
  tl.set(L.logoWrap, { opacity: 0, filter: 'blur(16px)' }, 0);

  tl.to(L.logoWrap, { opacity: 1, filter: 'blur(0px)', duration: 1.0, ease: 'power2.out' }, 0.2);
  tl.to({}, { duration: 0.7 });
  tl.to(L.logoWrap, { opacity: 0, filter: 'blur(16px)', duration: 0.8, ease: 'power2.in' });
}

/** Phase 2 — cut to the app tiles; spread + Canvas loads; click Canvas. */
export function tilesIntro(tl, ctx) {
  const L = ctx.launcher;
  const cursor = ctx.cursor;
  const ring = cursor.querySelector('.cursor-ring');
  const t = L.tiles;

  // How far the flanking tiles sit inward to close the Canvas gap.
  const gap = parseFloat(getComputedStyle(L.tilesRow).columnGap) || 16;
  const shift = (t.canvas.offsetWidth + gap) / 2;

  // ----- Pre-state: 4-tile layout, tiles hidden (below + small) -----
  tl.set(L.tilesRow, { opacity: 1 }, 0);
  tl.set([t.text, t.graphics], { x: shift, opacity: 0, y: 30, scale: 0.9 }, 0);
  tl.set([t.video, t.audio],   { x: -shift, opacity: 0, y: 30, scale: 0.9 }, 0);
  tl.set(t.canvas, { opacity: 0, scale: 0.6, y: 0, boxShadow: '0 10px 30px -12px rgba(24, 31, 64, 0.18)' }, 0);
  // Cursor parks fully BELOW the 800px frame so it slides up into view
  // (no mid-frame pop). It's opacity 1 but off-stage, so it's clipped
  // until the rise begins.
  tl.set(cursor, { opacity: 1, scale: 1, x: 470, y: 900 }, 0);
  tl.set(ring, { opacity: 0, scale: 0.4 }, 0);

  // ----- Entrance: the 4 tiles rise + fade in, staggered L→R -----
  [t.text, t.graphics, t.video, t.audio].forEach((tile, i) => {
    tl.to(tile, {
      opacity: 1, y: 0, scale: 1,
      duration: 0.55, ease: 'back.out(1.5)',
    }, 0.1 + i * 0.1);
  });

  // ----- Spread apart + Canvas loads into the centre -----
  tl.to([t.text, t.graphics, t.video, t.audio], {
    x: 0, duration: 0.7, ease: 'power3.inOut',
  }, 1.1);
  tl.to(t.canvas, {
    opacity: 1, scale: 1,
    duration: 0.6, ease: 'back.out(1.7)',
  }, 1.4);

  // ----- Cursor rises in from below the frame, up to Canvas (hover lifts) -----
  tl.to(cursor, {
    x: () => targetIn(t.canvas, ctx.stage).x,
    y: () => targetIn(t.canvas, ctx.stage).y,
    duration: 1.0, ease: 'power3.out',
  }, 2.2);
  tl.to(t.canvas, {
    y: -6,
    boxShadow: '0 22px 50px -16px rgba(24, 31, 64, 0.30)',
    duration: 0.3, ease: 'power2.out',
  }, 3.0);

  // ----- Click Canvas -----
  const Tc = 3.3;
  tl.fromTo(ring, { opacity: 0.9, scale: 0.4 }, { opacity: 0, scale: 1.8, duration: 0.6, ease: 'power2.out' }, Tc);
  tl.to(cursor, { scale: 0.9, duration: 0.08, ease: 'power2.in' }, Tc);
  tl.to(cursor, { scale: 1,   duration: 0.26, ease: 'power2.out' }, Tc + 0.08);
  tl.to(t.canvas, { y: -2, scale: 0.97, duration: 0.09, ease: 'power2.in' }, Tc);
  tl.to(t.canvas, { y: -6, scale: 1,    duration: 0.26, ease: 'power2.out' }, Tc + 0.09);

  tl.to(cursor, { opacity: 0, duration: 0.3, ease: 'power2.in' }, Tc + 0.45);
  tl.to({}, { duration: 0.3 });
}

/** Phase 3 — the click "launches" Canvas: the other tiles fly out, the
 *  Canvas tile zooms through the viewer, and the full app scales up into
 *  the (smaller, margined) establishing shot. Hands off to chat-hat. */
export function revealApp(tl, ctx) {
  const L = ctx.launcher;
  const { world, shell, hero, heroLogo, railAgents } = ctx.canvas;
  const t = L.tiles;

  // Reset the rail Agents tool to its resting (un-highlighted) state so
  // the establishing shot never shows it pre-selected (the agents
  // vignette later highlights it on hover).
  tl.set(railAgents, { backgroundColor: 'rgba(24,88,238,0)', color: '#818ea6' }, 0);

  // Establishing camera — 0.46 leaves a clear margin so the app card
  // doesn't touch the frame edges. It scales in from a touch smaller.
  const camApp   = ctx.cameraFor(shell, 0.46);
  const camStart = ctx.cameraFor(shell, 0.46 * 0.94);

  // Restore the empty-canvas hero logo (in case a prior loop dissolved it).
  tl.set(hero, { opacity: 1 }, 0);
  tl.set(heroLogo, { opacity: 1, filter: 'blur(0px)' }, 0);

  // The flanking tiles fly outward + fade.
  tl.to([t.text, t.graphics], { x: '-=150', opacity: 0, duration: 0.45, ease: 'power2.in' }, 0);
  tl.to([t.video, t.audio],   { x: '+=150', opacity: 0, duration: 0.45, ease: 'power2.in' }, 0);

  // The clicked Canvas tile zooms toward the viewer + fades — the app
  // "launches" through it.
  tl.to(t.canvas, { scale: 1.85, y: -6, opacity: 0, duration: 0.55, ease: 'power2.in' }, 0.05);

  // Launcher overlay clears.
  tl.to(L.root, { opacity: 0, duration: 0.45, ease: 'power2.in' }, 0.3);

  // The full Canvas app scales up (centred) + fades in behind it.
  tl.set(world, { x: camStart.x, y: camStart.y, scale: camStart.scale, opacity: 0 }, 0);
  tl.to(world, {
    x: camApp.x, y: camApp.y, scale: camApp.scale, opacity: 1,
    duration: 0.8, ease: CAMERA_SETTLE,
  }, 0.25);

  // Settle on the establishing shot.
  tl.to({}, { duration: 0.9 });
}

/** Final — clear the canvas content + fade the app back out to the
 *  clean wash, so the loop returns to the OMNI logo. */
export function resetToWash(tl, ctx) {
  const { world, layerMulti, layerAgents, layerFeature, modelLabel, modelWrap } = ctx.canvas;
  tl.to([layerMulti, layerAgents, layerFeature], { opacity: 0, duration: 0.3, ease: 'power2.inOut' }, 0);
  tl.to(world, { opacity: 0, duration: 0.55, ease: 'power2.inOut' }, 0.15);

  // Once the world is fully faded (≥1.1s), reset one-way state for the
  // next loop. Doing it here — while nothing is visible — means none of
  // it ever visibly flips back on screen. This covers the model pill
  // (classic loop) AND the graphics-gen composer state (welcome loop):
  // without the latter, loop 2's chat-hat would open showing last
  // loop's typed prompt superimposed on the placeholder.
  tl.add(() => {
    if (modelLabel) {
      modelLabel.textContent = 'Claude Sonnet 4.6';
      modelLabel.style.opacity = '1';
    }
    if (modelWrap) {
      modelWrap.querySelectorAll('.model-selector-menu-item')
        .forEach((r, i) => r.classList.toggle('active', i === 0));
    }
    const hat = ctx.canvas.chatHat;
    if (hat) {
      const rest   = hat.querySelector('[data-composer-rest]');
      const caret  = hat.querySelector('[data-composer-caret]');
      const typed  = hat.querySelector('[data-typed-prompt]');
      if (rest)  { rest.style.opacity = '1'; }
      if (caret) { caret.style.opacity = '0'; }
      if (typed) { typed.textContent = ''; }
      // Clear the chips' exit transforms so chat-hat's reveal starts
      // from identity next loop (its pre-state only sets opacity/y).
      hat.querySelectorAll('.chat-aux-chip').forEach((el) => {
        el.style.transform = '';
      });
    }
    // Scroll canvas must be hidden again before loop 2's establishing
    // shot — it sits z-above the shell and would otherwise cover the
    // whole app from the first frame of the next pass. The S2/S3
    // section roots also drop their inline opacity so their CSS
    // default (hidden) governs again until their cues re-reveal them.
    if (ctx.canvas.scrollCanvas) ctx.canvas.scrollCanvas.style.opacity = '0';
    const s2zone = ctx.canvas.scrollS2 && ctx.canvas.scrollS2.querySelector('.xvg-zone');
    const s3wrap = ctx.canvas.scrollS3 && ctx.canvas.scrollS3.querySelector('.xtg-wrap');
    if (s2zone) s2zone.style.opacity = '';
    if (s3wrap) s3wrap.style.opacity = '';
  }, 0.75);

  tl.to({}, { duration: 0.05 });
}

function targetIn(el, stage) {
  const sr = stage.getBoundingClientRect();
  const r  = el.getBoundingClientRect();
  return {
    x: r.left - sr.left + r.width  / 2 - 5,
    y: r.top  - sr.top  + r.height / 2 - 3,
  };
}
