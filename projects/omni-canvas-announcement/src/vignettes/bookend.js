/* ------------------------------------------------------------------
   BOOKEND — the OMNI logo lives IN the canvas (empty-state hero). The
   loop opens tight on that logo (blur-fade in), then the camera zooms
   OUT to establish the whole app, before flying in to the chat hat.
   The close mirrors it: restore the empty canvas, fly back to the
   logo, blur-fade out — landing on the exact frame the open started
   from, for a seamless loop.
------------------------------------------------------------------ */

// Kept for compatibility with main.js's import; the logo now lives in
// the canvas shell, so the separate bookend layer is unused.
export function mountBookend(host) {
  host.innerHTML = '';
  return host;
}

/** OPEN — tight on the in-canvas logo → blur-fade in → zoom out to
 *  establish the full app. */
export function openBookend(tl, ctx) {
  const { world, hero, heroLogo, shell } = ctx.canvas;
  const stageBg = ctx.stageBg;

  const camLogo = ctx.cameraFor(hero, 1.85);          // tight on the logo
  const camApp  = ctx.cameraFor(shell, 0.5);          // the whole app

  // Frame 0 — camera tight on the logo; logo blurred + invisible.
  tl.set(stageBg, { opacity: 1 }, 0);
  tl.set(world, { opacity: 1, x: camLogo.x, y: camLogo.y, scale: camLogo.scale }, 0);
  tl.set(hero, { opacity: 1 }, 0);
  tl.set(heroLogo, { opacity: 0, filter: 'blur(16px)', transformOrigin: '50% 50%' }, 0);

  // Logo blur-fades in.
  tl.to(heroLogo, { opacity: 1, filter: 'blur(0px)', duration: 1.0, ease: 'power2.out' }, 0.2);

  // Hold the resolved logo.
  tl.to({}, { duration: 0.7 });

  // Zoom OUT to establish the full Canvas app.
  tl.to(world, {
    x: camApp.x, y: camApp.y, scale: camApp.scale,
    duration: 1.5, ease: 'power3.inOut',
  });

  // Hold the establishing shot so the viewer can read the layout.
  tl.to({}, { duration: 1.0 });
}

/** CLOSE — restore the empty canvas, fly back to the logo, blur-fade
 *  out. Ends on the exact Frame 0 of OPEN. */
export function closeBookend(tl, ctx) {
  const { world, hero, heroLogo, layerMulti, layerAgents, layerFeature } = ctx.canvas;

  const camLogo = ctx.cameraFor(hero, 1.85);

  // Clear any leftover vignette content; bring the empty-canvas logo back.
  tl.to([layerMulti, layerAgents, layerFeature], { opacity: 0, duration: 0.4, ease: 'power2.inOut' }, 0);
  tl.set(hero, { opacity: 1 }, 0);
  tl.to(heroLogo, { opacity: 1, filter: 'blur(0px)', duration: 0.5, ease: 'power2.out' }, 0.1);

  // Fly from the chat hat back to the canvas logo.
  tl.to(world, {
    x: camLogo.x, y: camLogo.y, scale: camLogo.scale,
    duration: 1.3, ease: 'power3.inOut',
  }, 0);

  // Blur-fade the logo out — matches OPEN's Frame 0 (invisible, blurred).
  tl.to(heroLogo, { opacity: 0, filter: 'blur(16px)', duration: 0.95, ease: 'power2.in' }, 1.15);

  // Tiny tail so the seam back to the loop start reads as intentional.
  tl.to({}, { duration: 0.4 });
}
