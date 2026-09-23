/* ------------------------------------------------------------------
   VIGNETTE 2 — Multi-modal generation.
   Camera pans from chat-hat to a fixed cluster frame in the
   canvas-side area; tiles inside the frame land in parallel.
------------------------------------------------------------------ */

const TILE_HTML = `
  <div class="tiles-cluster" id="tiles-cluster">
    <div class="tile tile-image" data-tile="image" style="top: 0; left: 0; width: 320px; height: 340px;">
      <span class="tile-tag">Image</span>
      <span class="scan"></span>
    </div>
    <div class="tile tile-text" data-tile="text" style="top: 0; right: 0; width: 300px; height: 240px;">
      <span class="tile-tag">Text</span>
      <span class="line brand" style="width: 70%;"></span>
      <span class="line" style="width: 92%;"></span>
      <span class="line" style="width: 65%;"></span>
      <span class="line" style="width: 80%;"></span>
      <span class="line" style="width: 50%;"></span>
    </div>
    <div class="tile tile-chart" data-tile="chart" style="bottom: 0; left: 60px; width: 360px; height: 240px;">
      <span class="tile-tag">Chart</span>
      <div class="bars">
        <span class="bar" style="height: 60%;"></span>
        <span class="bar" style="height: 35%;"></span>
        <span class="bar" style="height: 78%;"></span>
        <span class="bar" style="height: 50%;"></span>
        <span class="bar" style="height: 90%;"></span>
        <span class="bar" style="height: 42%;"></span>
      </div>
    </div>
  </div>
`;

export function multimodalVignette(tl, ctx) {
  const { world, layerMulti } = ctx.canvas;
  layerMulti.innerHTML = TILE_HTML;

  const cluster = layerMulti.querySelector('#tiles-cluster');
  const tiles   = Array.from(layerMulti.querySelectorAll('.tile'));
  const scan    = layerMulti.querySelector('.tile-image .scan');
  const lines   = Array.from(layerMulti.querySelectorAll('.tile-text .line'));
  const bars    = Array.from(layerMulti.querySelectorAll('.tile-chart .bar'));

  // ----- Pre-state -----
  tl.set(layerMulti, { opacity: 1 }, 0);
  tl.set(tiles, { opacity: 0, y: 18, scale: 0.96 }, 0);

  // ----- Camera pan from chat-hat → tile cluster -----
  const cam = ctx.cameraFor(cluster, 0.95);
  tl.to(world, {
    x: cam.x, y: cam.y, scale: cam.scale,
    duration: 1.2,
    ease: 'power3.inOut',
  }, 0);

  // ----- Tiles land staggered as the camera arrives -----
  tl.to(tiles, {
    opacity: 1, y: 0, scale: 1,
    duration: 0.6,
    ease: 'power3.out',
    stagger: 0.14,
  }, 0.95);

  // Inside each tile: content materializes
  tl.fromTo(scan,
    { y: '-100%' },
    { y: '120%', duration: 1.3, ease: 'sine.inOut' },
    1.1
  );
  tl.to(lines, {
    scaleX: 1,
    duration: 0.5,
    ease: 'power2.out',
    stagger: 0.09,
  }, 1.15);
  tl.to(bars, {
    scaleY: 1,
    duration: 0.6,
    ease: 'back.out(1.4)',
    stagger: 0.07,
  }, 1.08);

  // Subtle drift — live canvas feel
  tl.to(layerMulti.querySelector('[data-tile="image"]'), { y: -5, duration: 1.4, ease: 'sine.inOut' }, 1.8);
  tl.to(layerMulti.querySelector('[data-tile="chart"]'), { y:  5, duration: 1.4, ease: 'sine.inOut' }, 1.8);

  // Hold so the viewer reads it
  tl.to({}, { duration: 0.6 });

  // ----- Exit — tiles dim before the camera pans away -----
  tl.to(tiles, {
    opacity: 0,
    scale: 0.99,
    duration: 0.5,
    ease: 'power2.in',
    stagger: 0.06,
  }, 3.4);
}
