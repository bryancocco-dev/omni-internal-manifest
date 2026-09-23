  /* ──────────────────────────────────────────────────────────────────
     window.showWIPOverlay — reusable "Work in progress" overlay.

     Usage:
       showWIPOverlay()                        // mount on body, default copy
       showWIPOverlay({ mount: '#personaView' })  // inherit a canvas's --stack-w
       showWIPOverlay({ label: 'Coming soon', sub: 'Persona module is still cooking.' })
       const wip = showWIPOverlay(); wip.dismiss(); wip.remove();

     Or auto-mount via URL: append ?wip=1 to any canvas to drop it on load.
     Returns { el, dismiss(), remove() }.
     ────────────────────────────────────────────────────────────────── */
  window.showWIPOverlay = function showWIPOverlay(opts = {}) {
    const mount = (() => {
      if (!opts.mount) return document.body;
      if (typeof opts.mount === 'string') return document.querySelector(opts.mount) || document.body;
      return opts.mount;
    })();
    const label = opts.label || 'Work in progress';
    const sub = opts.sub || 'This section is still under construction. Dismiss to preview the page behind.';
    const dismissible = opts.dismissible !== false;
    const overlay = document.createElement('aside');
    overlay.className = 'wip-overlay';
    overlay.setAttribute('aria-label', label);
    overlay.innerHTML = `
      <div class="wip-overlay-content">
        <span class="wip-overlay-dot" aria-hidden="true"></span>
        <span class="wip-overlay-label"></span>
        <p class="wip-overlay-sub"></p>
        ${dismissible ? `
        <button class="wip-overlay-close" type="button" aria-label="Dismiss work-in-progress notice">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <line x1="3.5" y1="3.5" x2="10.5" y2="10.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
            <line x1="10.5" y1="3.5" x2="3.5" y2="10.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
          </svg>
          <span>Dismiss</span>
        </button>` : ''}
      </div>`;
    overlay.querySelector('.wip-overlay-label').textContent = label;
    overlay.querySelector('.wip-overlay-sub').textContent = sub;
    mount.appendChild(overlay);
    const api = {
      el: overlay,
      dismiss() { overlay.classList.add('is-dismissed'); },
      remove() { overlay.remove(); }
    };
    if (dismissible) {
      overlay.querySelector('.wip-overlay-close').addEventListener('click', () => {
        api.dismiss();
        if (typeof opts.onDismiss === 'function') opts.onDismiss(api);
      });
    }
    return api;
  };
  // Auto-mount via ?wip=1 (or ?wip=Some+label) — handy for sharing a
  // canvas with a WIP note pinned without editing the markup.
  (function autoMountWIP() {
    try {
      const params = new URLSearchParams(window.location.search);
      if (!params.has('wip')) return;
      const raw = params.get('wip');
      const opts = {};
      if (raw && raw !== '1' && raw !== 'true') opts.label = raw;
      const fire = () => window.showWIPOverlay(opts);
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', fire, { once: true });
      } else {
        fire();
      }
    } catch (e) { /* no-op */ }
  })();

  /* ──────────────────────────────────────────────────────────────────
     Smooth wheel scrolling for #canvas — CSS `scroll-behavior: smooth`
     only affects programmatic scrolls; wheel/trackpad is OS-controlled
     and lands hard. This IIFE intercepts wheel events, accumulates the
     target scrollTop, and lerps the actual scrollTop toward target each
     frame so the scene glides instead of jumping per delta.
     ────────────────────────────────────────────────────────────────── */
  (function smoothWheelCanvas() {
    const el = document.getElementById('canvas');
    if (!el) return;
    let target = null;
    let raf = null;
    let lastWheelMs = 0;
    // Single uniform damping. The previous two-mode setup (gentle 0.22
    // while wheeling, aggressive 0.55 after a 60ms quiet) produced a
    // visible pace change at the end of every scroll — the "extra
    // vertical jump" Bryan didn't want. A single rate decays smoothly
    // with no perceptible mode shift.
    const DAMP = 0.22;
    function animate() {
      // Yield to an in-flight programmatic scroll (arrow keys / rail-nav
      // clicks). Otherwise this lerp keeps overwriting scrollTop each
      // frame and the user-driven navigation never lands.
      if (typeof programmaticScroll !== 'undefined' && programmaticScroll) {
        el.style.scrollBehavior = '';
        target = null;
        raf = null;
        return;
      }
      const current = el.scrollTop;
      const remaining = target - current;
      if (Math.abs(remaining) < 0.4) {
        el.scrollTop = target;
        el.style.scrollBehavior = '';   // restore CSS smooth for anchor jumps
        target = null;
        raf = null;
        return;
      }
      el.scrollTop = current + remaining * DAMP;
      raf = requestAnimationFrame(animate);
    }
    el.addEventListener('wheel', (e) => {
      // Pass through pinch-zoom (ctrl+wheel) so the page can zoom natively.
      if (e.ctrlKey) return;
      // Pass through purely-horizontal wheel (trackpad two-finger horizontal).
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      e.preventDefault();
      lastWheelMs = performance.now();
      // Normalize delta unit: pixels (0) by default, lines (1) → ~16px,
      // pages (2) → one viewport. Most browsers use pixels.
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? el.clientHeight : 1;
      // 0.9 multiplier matches the wheelMultiplier in smoothCanvasScroll
      // (IIFE at end of script). Without this, the two lerps target
      // different end positions and after the slower lerp settles, this
      // one tugs scrollTop the final 10% forward — visible as an
      // unprompted post-ease jump.
      const delta = e.deltaY * unit * 0.9;
      const maxScroll = el.scrollHeight - el.clientHeight;
      if (target === null) target = el.scrollTop;
      target = Math.max(0, Math.min(maxScroll, target + delta));
      if (!raf) {
        el.style.scrollBehavior = 'auto';   // avoid double-smoothing during my lerp
        raf = requestAnimationFrame(animate);
      }
    }, { passive: false });
    // Reset target if anything else changes scrollTop programmatically
    // (chapter-nav buttons, arrow keys, anchor jumps) so my lerp doesn't
    // fight them.
    el.addEventListener('scroll', () => {
      if (raf === null) target = null;
    }, { passive: true });
  })();

  /* Sibling wheel-lerp for the LEFT chat-stream — same canonical
     Bryan-approved config as smoothWheelCanvas above (DAMP 0.22,
     0.9 multiplier, single uniform damping, no settle/quiet modes).
     Paired with smoothChatStreamScroll (lerp 0.09, mult 0.9) further
     down to give the chat panel the exact "smooth like the brief
     project" feel Bryan asked for. */
  (function smoothWheelChatStream() {
    const el = document.getElementById('chatStream');
    if (!el) return;
    let target = null;
    let raf = null;
    const DAMP = 0.22;
    function animate() {
      if (typeof programmaticScroll !== 'undefined' && programmaticScroll) {
        el.style.scrollBehavior = '';
        target = null;
        raf = null;
        return;
      }
      const current = el.scrollTop;
      const remaining = target - current;
      if (Math.abs(remaining) < 0.4) {
        el.scrollTop = target;
        el.style.scrollBehavior = '';
        target = null;
        raf = null;
        return;
      }
      el.scrollTop = current + remaining * DAMP;
      raf = requestAnimationFrame(animate);
    }
    el.addEventListener('wheel', (e) => {
      if (e.ctrlKey) return;
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      e.preventDefault();
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? el.clientHeight : 1;
      const delta = e.deltaY * unit * 0.9;
      const maxScroll = el.scrollHeight - el.clientHeight;
      if (target === null) target = el.scrollTop;
      target = Math.max(0, Math.min(maxScroll, target + delta));
      if (!raf) {
        el.style.scrollBehavior = 'auto';
        raf = requestAnimationFrame(animate);
      }
    }, { passive: false });
    el.addEventListener('scroll', () => {
      if (raf === null) target = null;
    }, { passive: true });
  })();

  /* Global error capture — stashes the first thrown error so we can
     see where this 470KB script is silently aborting. Inspect via
     window.__capturedError in DevTools console. */
  window.__capturedErrors = [];
  window.addEventListener('error', (ev) => {
    window.__capturedErrors.push({
      msg: ev.message,
      file: ev.filename,
      line: ev.lineno,
      col: ev.colno,
      stack: ev.error && ev.error.stack ? ev.error.stack.split('\n').slice(0, 5).join(' | ') : null,
    });
  });

  /* Back-to-hub — the rail-back arrow in the top-left of every product
     page routes to the Internal Manifest dashboard. Document-level click
     delegation so the binding survives any exception thrown later in
     this 470KB inline script. Hostname check keeps localhost dev pointed
     at the local hub on :8083 with ?local=1 (so the hub's tiles continue
     to route back to local servers); anywhere else falls through to the
     production hub at omni-dashboard-kappa.vercel.app. */
  document.addEventListener('click', (e) => {
    const btn = e.target && e.target.closest && e.target.closest('#backToHub');
    if (!btn) return;
    e.preventDefault();
    const isLocal = (location.hostname === 'localhost' || location.hostname === '127.0.0.1');
    location.href = isLocal
      ? 'http://localhost:8083/?local=1&dashboard'
      : 'https://omni-dashboard-kappa.vercel.app/?dashboard';
  });

  /* ──────────────────────────────────────────────────────────────────
     Rail-nav accordion — DOCUMENT-LEVEL CLICK DELEGATION registered
     FIRST so it survives any exception thrown later in this 470KB
     inline script. Previously the registration lived ~9000 lines down
     and a silent throw above it left the accordion dead. By hoisting
     it here we guarantee the handler attaches before anything else
     can fail. scrollToChapter is a hoisted function declaration so
     it's callable even if execution never reaches its definition;
     wrapped in try/catch in case its closure-captured canvasEl is in
     TDZ (would throw ReferenceError).
     ────────────────────────────────────────────────────────────────── */
  document.addEventListener('click', (e) => {
    const safeScrollToChapter = (ch) => {
      try { if (typeof scrollToChapter === 'function') scrollToChapter(ch); } catch (_) {}
    };
    const subItem = e.target.closest('.rail-subnav > li[data-chapter]');
    if (subItem) {
      safeScrollToChapter(subItem.dataset.chapter);
      return;
    }
    const navRow = e.target.closest('.nav-row');
    if (!navRow) return;
    const li = navRow.parentElement;
    if (!li || !li.matches('.rail-nav > li')) return;
    if (li.classList.contains('has-children')) {
      const wasExpanded = li.classList.contains('expanded');
      document.querySelectorAll('.rail-nav > li.expanded').forEach(other => {
        if (other !== li) other.classList.remove('expanded');
      });
      li.classList.toggle('expanded', !wasExpanded);
      if (!wasExpanded) {
        const firstSub = li.querySelector('.rail-subnav > li[data-chapter]');
        if (firstSub) safeScrollToChapter(firstSub.dataset.chapter);
      }
    } else {
      const navList = li.parentElement;
      if (navList) {
        navList.querySelectorAll(':scope > li.expanded').forEach(other => {
          if (other !== li) other.classList.remove('expanded');
        });
      }
      const target = li.dataset.target;
      if (target) safeScrollToChapter(target);
    }
  });

  /* --- Cover video play/pause toggle. Native `loop` attribute on the
     <video> handles the infinite loop; this IIFE just wires the
     frosted-glass play/pause button so the icon, visibility, and
     screen-reader state stay in sync with playback. */
  (function coverVideoToggle() {
    const video = document.getElementById('coverTableVideo');
    const toggle = document.getElementById('coverTableVideoToggle');
    if (!video || !toggle) return;
    function sync() {
      const paused = video.paused;
      toggle.classList.toggle('is-paused', paused);
      toggle.setAttribute('aria-pressed', paused ? 'false' : 'true');
      toggle.setAttribute('aria-label', paused ? 'Play cover video' : 'Pause cover video');
    }
    toggle.addEventListener('click', () => {
      if (video.paused) video.play();
      else video.pause();
    });
    video.addEventListener('play', sync);
    video.addEventListener('pause', sync);
    sync();
  })();

  /* --- Live cover date — replaces the hardcoded MM.DD.YYYY in both
     canvas_1 and canvas_2 cover meta blocks with today's date so the
     brief always reads as freshly delivered. */
  (function liveCoverDate() {
    const dates = document.querySelectorAll('.brief-board .brief-meta .date');
    if (!dates.length) return;
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const today = `${pad(now.getMonth() + 1)}.${pad(now.getDate())}.${now.getFullYear()}`;
    dates.forEach(el => { el.textContent = today; });
  })();

  // --- rail panel toggle ---
  const mainEl = document.getElementById('main');
  const railHandle = document.getElementById('railHandle');
  const railPanel = document.getElementById('railPanel');
  function togglePanel() {
    const open = mainEl.classList.toggle('panel-open');
    railHandle.setAttribute('aria-expanded', open ? 'true' : 'false');
    railPanel.setAttribute('aria-hidden', open ? 'false' : 'true');
    if (typeof syncPills === 'function') syncPills();
    const navMenuBtn = document.getElementById('navMenuBtn');
    if (navMenuBtn) navMenuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  railHandle.addEventListener('click', togglePanel);

  // Topnav hamburgers are intentionally visual only. The rail nav panel opens
  // via the .rail-handle chevron tab on desktop/tablet, and via the Menu pill
  // in the segmented panel-switch on mobile.

  // --- Topnav tab switching: Canvas <-> Table ---
  // Other tabs (Graphics/Video/Audio/Text) have no data-tab attr and stay non-functional.
  // Table view replaces the brief-stack on the right; canvas-header, side-rail,
  // chat panel all stay put. Rail-handle / chapter-nav are hidden on Table since
  // there are no chapters within it.
  /* Production-default landing tab is canvas_1 (the original brief
     stack). canvas_2 and canvas_3 are both gated behind URL params
     below — bare URLs only show canvas_1. */
  mainEl.dataset.tab = mainEl.dataset.tab || 'canvas';
  const _params = new URLSearchParams(location.search);
  // The "lease-campaign-canvas3.*" stable-alias hostname acts as the
  // share-everything-new URL — exposes canvas_2, canvas_3, AND canvas_4
  // by default so Bryan can share one link without needing query params.
  // The bare lease-campaign.vercel.app hostname stays gated.
  const _isCanvas3Alias = /(^|\.)lease-campaign-canvas3(\.|$)/i.test(location.hostname);
  if (_isCanvas3Alias) {
    document.body.classList.add('canvas2-visible');
    document.body.classList.add('canvas3-visible');
    document.body.classList.add('canvas4-visible');
    /* Land on canvas_4 by default — that's where active iteration
       work is happening; canvas_3 remains the frozen reference. */
    mainEl.dataset.tab = 'canvas4';
  }
  // ?canvas2=1 is the "share everything new" URL — exposes canvas_2,
  // canvas_3, and canvas_4, and lands on canvas_4 (the active sandbox).
  if (_params.get('canvas2') === '1') {
    document.body.classList.add('canvas2-visible');
    document.body.classList.add('canvas3-visible');
    document.body.classList.add('canvas4-visible');
    mainEl.dataset.tab = 'canvas4';
  }
  // ?canvas3=1 exposes canvas_3 only and lands on it. canvas_2 +
  // canvas_4 stay hidden under this URL.
  if (_params.get('canvas3') === '1') {
    document.body.classList.add('canvas3-visible');
    mainEl.dataset.tab = 'graphics';
  }
  // ?canvas4=1 exposes canvas_4 only and lands on it — Bryan's
  // iteration sandbox for the lightbox + derivative-grid flow.
  if (_params.get('canvas4') === '1') {
    document.body.classList.add('canvas4-visible');
    mainEl.dataset.tab = 'canvas4';
  }
  // ?table=1 exposes canvas_2 only and lands directly on the GAWDTABLE
  // table view — used by the omni-dashboard "GAWDTABLE" tile to deep-link
  // past the canvas_4 default landing.
  if (_params.get('table') === '1') {
    document.body.classList.add('canvas2-visible');
    mainEl.dataset.tab = 'table';
  }
  /* Browser-tab title that follows the active view so the OS tab strip
     names what's actually displayed instead of a generic "Canvas". */
  const TAB_TITLES = {
    canvas:   'Chat Hat — OMNI+',
    table:    'Chat Hat — OMNI+',
    canvas4:  'Chat Hat — OMNI+',
    graphics: 'Chat Hat — OMNI+',
  };
  function setTabTitle() {
    const t = TAB_TITLES[mainEl.dataset.tab] || TAB_TITLES.canvas;
    if (document.title !== t) document.title = t;
  }
  setTabTitle();
  /* Left nav always starts collapsed on page load for every canvas
     tab — the user expands it manually via the rail handle when
     they want chapter navigation. */
  /* Sync aria-hidden on the active view so screen readers + CSS
     selectors that key off it match reality on first paint. */
  if (mainEl.dataset.tab === 'graphics') {
    const personaView = document.getElementById('personaView');
    if (personaView) personaView.setAttribute('aria-hidden', 'false');
  } else if (mainEl.dataset.tab === 'canvas4') {
    const graphicsView = document.getElementById('graphicsView');
    if (graphicsView) graphicsView.setAttribute('aria-hidden', 'false');
  }
  /* WIP overlay is now a reusable component — see window.showWIPOverlay
     defined later in this file. Call from the console or from any
     view's init code to drop it on a page. */
  /* Sync the topnav's .active class with whatever tab actually opens
     (the static markup may have a different default). */
  document.querySelectorAll('.topnav .tab[data-tab]').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === mainEl.dataset.tab);
  });
  const switchableTabs = document.querySelectorAll('.topnav .tab[data-tab]');
  /* canvas_3 now renders .persona-view (the Persona Library magazine).
     canvas_4 keeps its own .canvas4-view. The old .graphics-view DOM
     stays in the file as inert markup that no tab renders. */
  const ACTIVE_TAB_TARGETS = ['canvas', 'table', 'graphics', 'canvas4'];
  switchableTabs.forEach(tab => {
    const activate = () => {
      const target = tab.dataset.tab;
      if (!ACTIVE_TAB_TARGETS.includes(target)) return;
      const prevTab = mainEl.dataset.tab;
      /* Close edit mode (if active) before switching tabs — otherwise
         the overlay stays mounted over the new canvas. */
      if (typeof window._c4ExitEditMode === 'function') {
        window._c4ExitEditMode();
      }
      switchableTabs.forEach(t => t.classList.toggle('active', t === tab));
      mainEl.dataset.tab = target;
      setTabTitle();
      const tableView = document.getElementById('tableView');
      const graphicsView = document.getElementById('graphicsView');
      const personaView = document.getElementById('personaView');
      if (tableView) tableView.setAttribute('aria-hidden', target === 'table' ? 'false' : 'true');
      if (graphicsView) graphicsView.setAttribute('aria-hidden', target === 'canvas4' ? 'false' : 'true');
      if (personaView) personaView.setAttribute('aria-hidden', target === 'graphics' ? 'false' : 'true');
      /* Rail panel does not auto-open on tab switch — user toggles
         it via the rail handle. Keeps state consistent with the
         page-load behaviour (always collapsed unless the user
         explicitly opens it). */
      /* Refresh the rail nav's active/expanded state for the newly-active tab.
         The two .rail-nav lists swap visibility via CSS; the spy re-evaluates
         which parent + chapter to highlight based on current scroll. */
      if (typeof updateActiveNav === 'function') updateActiveNav();
      /* On tab switches to canvas_3, skip the per-card cascade — all
         cards appear at once with the view-level fade-up animation
         (.graphics-view's graphics-view-rise keyframe). The cascade
         only fires on initial page load and on Images↔Videos swaps. */
    };
    tab.addEventListener('click', activate);
    tab.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        activate();
      }
    });
  });

  /* --- canvas_3 (Graphics) — inject curated Unsplash tech photos into
     the masonry grid. Loaded with lazy decoding so the page paints fast
     even when the user lands directly on canvas_3 via ?canvas3=1. */
  (function () {
    const grid = document.getElementById('graphicsGrid');
    if (!grid) return;
    // Diverse curated Unsplash photo IDs — portraits, nature, art,
    // architecture, animals, food, tech. The mix gives the grid a
    // proper "generated image library" feel rather than a single-topic
    // strip. Each ID maps to a stable photo at images.unsplash.com.
    const photos = [
      // portraits / people
      '1494790108377-be9c29b29330',
      '1500648767791-00dcc994a43e',
      '1438761681033-6461ffad8d80',
      '1507003211169-0a1dd7228f2d',
      '1573497019418-b400bb3ab074',
      '1488161628813-04466f872be2',
      '1568602471122-7832951cc4c5',
      '1531746020798-e6953c6e8e04',
      // nature / landscape
      '1506905925346-21bda4d32df4',
      '1469474968028-56623f02e42e',
      '1518173946687-a4c8892bbd9f',
      '1470770841072-f978cf4d019e',
      '1473773508845-188df298d2d1',
      '1501785888041-af3ef285b470',
      // abstract / art
      '1557672172-298e090bd0f1',
      '1541961017774-22349e4a1262',
      '1502082553048-f009c37129b9',
      '1545239351-1141bd47b8f5',
      // animals
      '1574144611937-0df059b5ef3e',
      '1518791841217-8f162f1e1131',
      // architecture
      '1481026469463-66327c86e544',
      '1486325212027-8081e485255e',
      '1497366216548-37526070297c',
      // tech / AI
      '1518770660439-4636190af475',
      '1581090464777-f3220bbe1b8b',
      '1535303311164-664fc9ec6532',
      '1542751371-adc38448a05e',
      // food
      '1490645935967-10de6ba17061',
      '1546069901-ba9599a7e63c',
      // fashion / lifestyle
      '1490481651871-ab68de25d43d',
    ];
    /* Separate curated set for the Videos filter so toggling between
       Images and Videos actually swaps content (not just visual state).
       Cards in video mode get a play-badge overlay so they read as
       video thumbnails rather than stills. */
    const videoPhotos = [
      // cinematic stills / motion-flavored
      '1485846234645-a62644f84728', // film projector
      '1478720568477-152d9b164e26', // film clapboard
      '1574267432553-4b4628081c31', // movie scene blur
      '1535016120720-40c646be5580', // camera setup
      '1517604931442-7e0c8ed2963c', // film reels
      '1492144534655-ae79c964c9d7', // city motion
      '1542204165-65bf26472b9b',    // light streaks
      '1532634726-8b9fb99825f1',    // neon arcade
      '1492684223066-81342ee5ff30', // concert lights
      '1518929458119-e5bf444c30f4', // film grain
      '1554131333-4b5d8b3a13b5',    // VHS noise
      '1517604931442-7e0c8ed2963c', // movie reel
      '1485846234645-a62644f84728', // theater
      '1551269901-5c5e14c25df7',    // neon street
      '1502920917128-1aa500764cbd', // sunrise drone
    ];
    /* Aspect-ratio variety — Unsplash returns native aspect by default,
       so we force a mix of portrait / landscape / square via ?h=. A
       stride of 3 across 5 aspects guarantees adjacent cards never
       share a shape (yields the index sequence 0,3,1,4,2,0,3,1,...). */
    /* Smaller image dimensions (420px wide vs 600) and explicit webp
       format keep file sizes uniform and load times tight, so the
       outliers (heavier original photos like animals / abstract art)
       don't visibly trail the rest of the cascade. */
    const aspects = [
      { w: 420, h: 560 },   // 3:4 portrait
      { w: 420, h: 315 },   // 4:3 landscape
      { w: 420, h: 420 },   // 1:1 square
      { w: 420, h: 630 },   // 2:3 tall portrait
      { w: 420, h: 280 },   // 3:2 wide landscape
    ];

    /* Stock video sources for the Videos filter — Google's GTV sample
       library, reliable + small enough to stream from CDN. Cycled by
       card index so the gallery has visual variety. */
    /* OpenAI Sora landing-page samples — transcoded down from the
       original cdn.openai.com clips (16–60 MB each at 1080p) to ~540p
       H.264 / CRF 30 / audio-stripped / fast-start MP4s. Total bundle
       ~54 MB across 29 clips (10–20× smaller than originals), served
       directly from the Vercel deployment under /videos. Each entry
       carries the original native pixel dimensions so the card
       reserves the right aspect-ratio box before metadata loads (no
       reflow). The mix intentionally varies between 16:9, 9:16, and
       1:1 to give the Midjourney-style mosaic feel. */
    const videoSources = [
      { src: 'videos/monster-with-melting-candle.mp4', w: 1920, h: 1088 },
      { src: 'videos/victoria-crowned-pigeon.mp4',     w:  720, h: 1280 },
      { src: 'videos/origami-undersea.mp4',            w: 1920, h: 1080 },
      { src: 'videos/octopus-and-crab.mp4',            w:  512, h:  512 },
      { src: 'videos/big-sur.mp4',                     w: 1920, h: 1088 },
      { src: 'videos/chameleon.mp4',                   w:  720, h: 1280 },
      { src: 'videos/santorini.mp4',                   w: 1920, h: 1080 },
      { src: 'videos/happy-cat.mp4',                   w:  720, h:  720 },
      { src: 'videos/ships-in-coffee.mp4',             w: 1920, h: 1080 },
      { src: 'videos/mitten-astronaut.mp4',            w: 1920, h: 1080 },
      { src: 'videos/closeup-of-womans-eye.mp4',       w: 1920, h: 1080 },
      { src: 'videos/big-eyed-fluff-ball.mp4',         w: 1920, h: 1088 },
      { src: 'videos/petri-dish-pandas.mp4',           w: 1280, h:  720 },
      { src: 'videos/flower-blooming.mp4',             w: 1280, h:  720 },
      { src: 'videos/stack-of-tvs.mp4',                w: 1280, h:  720 },
      { src: 'videos/cat-on-bed.mp4',                  w: 1920, h: 1088 },
      { src: 'videos/amalfi-coast.mp4',                w: 1280, h:  720 },
      { src: 'videos/photoreal-train.mp4',             w: 1920, h: 1080 },
      { src: 'videos/art-museum.mp4',                  w: 1280, h:  720 },
      { src: 'videos/dancing-kangaroo.mp4',            w: 1280, h:  720 },
      { src: 'videos/gold-rush.mp4',                   w: 1280, h:  720 },
      { src: 'videos/zen-garden-gnome.mp4',            w: 1280, h:  720 },
      { src: 'videos/birds-over-river.mp4',            w: 1920, h: 1088 },
      { src: 'videos/lagos.mp4',                       w: 1280, h:  720 },
      { src: 'videos/cloud-man.mp4',                   w: 1920, h: 1080 },
      { src: 'videos/tiny-construction.mp4',           w: 1920, h: 1080 },
      { src: 'videos/wooly-mammoth.mp4',               w: 1920, h: 1080 },
      { src: 'videos/paper-airplanes.mp4',             w: 1280, h:  720 },
      { src: 'videos/dogs-downtown.mp4',               w: 1920, h: 1080 },
    ];

    /* Hover-overlay content — author, prompt, model line, action row,
       and a More dropdown. Prompts + models cycle through curated
       arrays so each card reads as a distinct generated item. */
    /* Prompt set includes deliberate worst-case strings: a 350+ char
       sentence (clamps to 2 lines with ellipsis), an unbreakable
       snake_case token (forced to wrap mid-word), an ALL-CAPS run, and
       an emoji-heavy entry. If any of these visibly break the card,
       the CSS regressed. */
    const prompts = [
      'A dramatic, hyper-realistic Warhammer 40K space marine in full ceramite power armor stands heroically atop a battle-scarred alien plateau at dusk, the chapter heraldry on his pauldron weathered by acid rain and ash, twin chainswords mag-locked to his thigh, plasma pistol resting against his hip, in the middle distance the wreckage of a Titan-class war engine smolders on the horizon while three drop pods arc down through ochre clouds trailing fire, anamorphic 2.39:1 framing with deep volumetric haze, low-key teal-and-amber color grade, inspired by the painting style of John Blanche meets Roger Deakins cinematography.',
      'Editorial portrait of a 24-year-old subject caught in the last 11 minutes of golden hour beside a salt-bleached fence in coastal Cornwall, freckles softened by warm side-light, fine cashmere knit pulled slightly off one shoulder, hair lifted by an offshore breeze, eyes downcast and contemplative, captured on a Mamiya 7 II with 80mm lens at f/4, Kodak Portra 400 pushed to ISO 800 for richer skin grain, scanned wet on a Hasselblad Flextight, retouched only to remove a stray hair across the cheek — the imperfections kept, no skin smoothing, no liquify, the whole frame intentionally exposed +1/3 to bloom the highlights into the sky like an old Bruce Weber editorial.',
      'A sweeping cinematic establishing shot of a forgotten lighthouse perched on a black-basalt cliff above a churning storm-grey sea, lashed by rain at twilight, while a single solitary figure in a long oilskin coat walks slowly toward the door carrying a lantern that casts a tiny warm pool of amber light against the overwhelming cold blue of the scene, shot on anamorphic 35mm with subtle film grain and a shallow depth of field.',
      'Abstract liquid mercury swirling into floral shapes, iridescent rainbow refractions, studio lighting.',
      'Macro photograph of dewdrops clinging to the serrated edge of a half-decayed oak leaf in mid-October, every droplet refracting a different inverted micro-world inside it — a glimpse of the entire forest canopy upside down — shot on a Laowa 100mm 2x ultra-macro at f/4.5, focus stacked from 14 separate frames in Helicon, lit by a single CRI-95 LED panel diffused through silk to mimic 7am east light just after fog burn-off.',
      'photoreal_underwater_kelp_forest_with_god_rays_volumetric_lighting_anamorphic_lens_flares_REDKomodo_RAW_color_grade_arri_alexa_filmic_LUT',
      'A cheetah mid-stride across a savanna, motion-blur tail, late afternoon golden light.',
      'Low-angle hero shot of a brutalist 1972 concrete civic building completely overtaken by a lattice of living vines, jasmine and ivy spilling out of every window opening, raw board-formed concrete softened by 50 years of weather staining, shot from ankle height with a 14mm tilt-shift to keep verticals razor-straight against a flat cyan summer sky, Hasselblad H6D-100c medium format detail, midday light shaped by a circular polarizer to deepen the sky two stops, deliberate empty foreground asphalt to honor the scale of the structure.',
      'EDITORIAL FASHION COVER — OVERSIZED LINEN BLAZER, TERRACOTTA WALLS, SOFT NATURAL LIGHT, VOGUE PARIS, AUGUST 2026, SHOT ON CONTAX T2 WITH KODAK PORTRA 800',
      'Vintage stamp design illustration in indigo ink, Moroccan architecture motif, decorative border.',
      'A robot waiter on quiet servo-wheels delivers a single demitasse of espresso to a salaryman seated at the corner of a ten-stool Tokyo izakaya in Shinjuku golden-gai, warm sodium-vapor and red paper-lantern backlighting reflecting off the polished cypress bar, steam rising visibly from the cup, the patron looking up from a paperback novel with mild curiosity but no surprise, cinematic still framed 1.85:1, shot on Arri Alexa 35 with Cooke S4 Mini 32mm at T2.0, Kodak 2383 print emulation LUT, atmospheric haze pumped to 18%.',
      '🌊 surreal dreamscape 🏝️ floating islands 🌅 golden hour 🦋 iridescent butterflies 🌸 cherry blossoms drifting through warm honey light 🪞 mirror lake reflections ✨ soft volumetric god-rays 🎞️ shot on Kodak Ektar 100',
      'Cyberpunk samurai sitting on a glowing neon ring throne, red and white armor, atmospheric mist.',
      'Vintage 1920s American traveling circus poster — central tiger illustration in tight black linework and dense crosshatch shading, the tiger leaping through a flaming hoop while a ringmaster in tails gestures upstage, art-nouveau decorative border with stylized rope-work and stars, hand-set wood-type display headlines reading ROYAL BENGAL TIGER and ONE NIGHT ONLY, two-color screenprint registration deliberately misaligned by 1mm for authentic period feel, paper texture muted ochre with foxing along the edges.',
      'Concert photography — silhouettes of fans illuminated by stage lasers, prismatic light bloom.',
      'A surfer holding a board, beach palm trees behind, oversized white tee, soft pastel film tones.',
      'Architectural visualization of a cantilevered glass-and-blackened-steel cabin perched at the lip of a Norwegian fjord 800m above the waterline, three exposed faces of floor-to-ceiling triple-glazed glass, interior warm-lit at blue hour with a wood-burning stove visible through the corner pane, the fjord below mirror-still reflecting the cliff faces in inverted symmetry, single thin ribbon of footpath visible cutting back across the moss to a distant gravel turnaround, rendered in Lumion 2026 with raytraced reflections, 32-bit EXR output for downstream comp.',
      'Stop-motion-style frog character holding a tiny mug of coffee, illustrated minimal flat style.',
      'Underwater photograph of a kelp forest, sun rays piercing the surface, schools of small fish.',
    ];
    /* Author set mixes short, very long, hyphenated, single-word ALL-CAPS,
       and Unicode entries — same worst-case coverage as the prompt set.
       Each entry is either { photo } for a real portrait avatar or
       { bg, fg } for a colored-initials avatar. Most authors use photos
       so the gallery feels like a real activity feed; the remaining
       initials avatars borrow the brand tile palette (teal / coral /
       lavender) so colors stay coherent with the topnav tab icons. */
    const authors = [
      { name: 'Bryan Cocco',                                        initials: 'BC', bg: '#3FCBC4', fg: '#064e3b' },
      { name: 'Maximilian Constantine Featherbottom-Whitfield III', initials: 'MF', photo: 'https://randomuser.me/api/portraits/men/22.jpg' },
      { name: 'Léa Tremblay-Søndergaard',                           initials: 'LT', photo: 'https://randomuser.me/api/portraits/women/44.jpg' },
      { name: 'ZAPHODBEEBLEBROXOFFICIAL',                           initials: 'ZB', bg: '#FF7B6E', fg: '#7c2d12' },
      { name: 'Nick Z.',                                            initials: 'NZ', photo: 'https://randomuser.me/api/portraits/men/67.jpg' },
      { name: 'Anastasia Vasiliou-Papandreou',                      initials: 'AV', photo: 'https://randomuser.me/api/portraits/women/15.jpg' },
      { name: 'Kira P.',                                            initials: 'KP', bg: '#9B8AFB', fg: '#312e81' },
    ];
    /* Model set includes a deliberately oversized identifier so the
       chip's ellipsis path is exercised at narrow card widths. */
    const models = [
      'gemini-3-1-flash',
      'claude-sonnet-4-6',
      'gpt-5-5-vision',
      'nova-premier',
      'o3',
      'claude-haiku-4-5',
      'claude-opus-experimental-vision-instruct-2026-05-12-final',
    ];
    /* Relative timestamps used in the list-view row. Cycled by card
     index so the gallery reads like a real activity feed with recent
     items at the top and older items further down. */
    const timestamps = [
      'Just now', '4m ago', '12m ago', '38m ago', '1h ago', '2h ago',
      '4h ago', '6h ago', '11h ago', 'Yesterday', '2d ago', '4d ago',
      '6d ago', '1w ago', '2w ago', '3w ago', '1mo ago', '2mo ago',
    ];
    /* Absolute dates parallel to timestamps[] for the Finder-style
       list view's Date Modified column. Anchored to 2026-05-12. */
    const dates = [
      'May 12, 2026', 'May 12, 2026', 'May 12, 2026', 'May 12, 2026',
      'May 12, 2026', 'May 12, 2026', 'May 12, 2026', 'May 12, 2026',
      'May 12, 2026', 'May 11, 2026', 'May 10, 2026', 'May 8, 2026',
      'May 6, 2026',  'May 5, 2026',  'Apr 28, 2026', 'Apr 21, 2026',
      'Apr 12, 2026', 'Mar 12, 2026',
    ];

    const replyIconSVG =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
        '<polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/>' +
      '</svg>';
    const downloadIconSVG =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M20.39 18.39A5 5 0 0 0 18 10h-1.26A8 8 0 1 0 3 16.3"/>' +
        '<path d="M8 14l4 4 4-4M12 18V9"/>' +
      '</svg>';
    const trashIconSVG =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
        '<polyline points="3 6 5 6 21 6"/>' +
        '<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>' +
        '<line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>' +
      '</svg>';
    /* Two stacked SVGs — the dots and an X close. CSS toggles their
       opacity + rotation based on the button's aria-expanded so the
       icon morphs to an X when its menu opens. */
    const moreIconSVG =
      '<svg class="gco-more-dots" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="12" cy="19" r="1.8"/></svg>' +
      '<svg class="gco-more-close" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="7" y1="7" x2="17" y2="17"/><line x1="7" y1="17" x2="17" y2="7"/></svg>';

    /* Image cards get the full set of content-creation actions; video
       cards stay trimmed to the destructive triad to keep the moment
       focused. The divider in the image menu separates "this prompt's
       data" actions (Copy) from the "this asset's lifecycle" actions
       (Share / Send / Export / etc.). */
    const menuItemsImage =
      '<button class="gco-menu-item" role="menuitem">Edit</button>' +
      '<button class="gco-menu-item" role="menuitem">Copy Prompt</button>' +
      '<button class="gco-menu-item" role="menuitem">Copy as PNG</button>' +
      '<div class="gco-menu-divider" role="separator"></div>' +
      '<button class="gco-menu-item" role="menuitem">Share</button>' +
      '<button class="gco-menu-item" role="menuitem">Send to Video</button>' +
      '<button class="gco-menu-item" role="menuitem">Export Image</button>' +
      '<button class="gco-menu-item" role="menuitem">Expand</button>' +
      '<button class="gco-menu-item" role="menuitem">Download</button>' +
      '<button class="gco-menu-item gco-menu-item-delete" role="menuitem">Delete</button>';
    const menuItemsVideo =
      '<button class="gco-menu-item" role="menuitem">Edit</button>' +
      '<button class="gco-menu-item" role="menuitem">Copy Prompt</button>' +
      '<button class="gco-menu-item" role="menuitem">Download</button>' +
      '<button class="gco-menu-item gco-menu-item-delete" role="menuitem">Delete</button>';

    function makeOverlay(promptIdx, modelIdx, filter) {
      const overlay = document.createElement('div');
      overlay.className = 'graphics-card-overlay';
      const author = authors[promptIdx % authors.length];
      const menuItems = filter === 'videos' ? menuItemsVideo : menuItemsImage;
      const fileType = filter === 'videos' ? 'Video' : 'Graphics';
      /* Photo authors render an <img> inside the circle; initials
         authors render their colored chip with the brand-tile bg/fg. */
      /* Avatar imgs are tiny (28×28 list, 20×20 mosaic) so loading="lazy"
         was pointless — it just produced blank-circle flashes while
         rows scrolled in. Loading="eager" + decoding="async" makes
         every photo paint as soon as the card lands. */
      const avatarHTML = author.photo
        ? '<span class="gco-avatar gco-avatar-photo"><img src="' + author.photo + '" alt="" loading="eager" decoding="async"></span>'
        : '<span class="gco-avatar" style="background:' + author.bg + ';color:' + author.fg + ';">' + author.initials + '</span>';
      overlay.innerHTML =
        /* Frosted-glass info card anchored to the bottom of the image.
           Holds prompt + author + model chip + an icon-only action
           cluster. The card slides up + fades in on hover. */
        '<div class="gco-glass">' +
          '<p class="gco-prompt">' + prompts[promptIdx % prompts.length] + '</p>' +
          '<span class="gco-filetype">' + fileType + '</span>' +
          '<div class="gco-meta-row">' +
            '<div class="gco-author">' +
              '<span class="gco-creator">' +
                avatarHTML +
                '<span class="gco-name">' + author.name + '</span>' +
              '</span>' +
              '<span class="gco-model-chip">' + models[modelIdx % models.length] + '</span>' +
              '<span class="gco-time">' + dates[promptIdx % dates.length] + '</span>' +
            '</div>' +
            '<div class="gco-actions">' +
              '<button class="gco-action" type="button" aria-label="Reply">' + replyIconSVG + '</button>' +
              '<button class="gco-action" type="button" aria-label="Download">' + downloadIconSVG + '</button>' +
              '<button class="gco-action gco-action-delete" type="button" aria-label="Delete">' + trashIconSVG + '</button>' +
              '<button class="gco-action gco-action-more" type="button" aria-label="More options" aria-haspopup="menu" aria-expanded="false">' + moreIconSVG + '</button>' +
              '<div class="gco-menu" role="menu" aria-hidden="true">' +
                menuItems +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>';
      return overlay;
    }

    /* IntersectionObserver — fades each card in as it enters the
       scroll viewport. Every initially-visible card flips to .in-view
       on the same animation frame, so the whole gallery rack-focuses
       in one coordinated moment (no per-row stagger). Scroll-in cards
       still reveal individually as they enter view. */
    let cardObs = null;
    function setupCardReveal() {
      if (cardObs) cardObs.disconnect();
      if (!('IntersectionObserver' in window)) {
        grid.querySelectorAll('.graphics-card').forEach(c => c.classList.add('in-view'));
        return;
      }
      cardObs = new IntersectionObserver((entries) => {
        const intersecting = entries.filter(e => e.isIntersecting);
        if (!intersecting.length) return;
        /* Promote any deferred video src so metadata + first-frame
           start loading as the card enters the pre-fetch margin. The
           skeleton shimmer + opacity-0 video keeps showing until
           `loadeddata` flips `.loaded`. */
        intersecting.forEach(entry => {
          entry.target.querySelectorAll('video[data-src]').forEach(v => {
            v.src = v.dataset.src;
            delete v.dataset.src;
          });
        });
        /* Defer to a single requestAnimationFrame so all intersecting
           cards from this callback paint together — one synchronized
           reveal, no row-stagger drift. */
        requestAnimationFrame(() => {
          intersecting.forEach(entry => entry.target.classList.add('in-view'));
        });
        intersecting.forEach(entry => cardObs.unobserve(entry.target));
      }, {
        root: grid,
        rootMargin: '0px 0px 600px 0px',
        threshold: 0.01,
      });
      grid.querySelectorAll('.graphics-card').forEach(card => {
        cardObs.observe(card);
      });
    }

    /* Re-cascade hook — called by the tab switcher when canvas_3 becomes
       active again from another canvas. Wipes .in-view, scrolls back to
       the top, and re-observes so the cards rise in fresh. Mirrors
       canvas_2's brief-rise behavior, which re-fires whenever the tab
       becomes active. Attached to the graphics-view element so the
       outer tab activator can find it. */
    const graphicsView = document.getElementById('graphicsView');
    if (graphicsView) {
      graphicsView.__recascadeGrid = function () {
        grid.querySelectorAll('.graphics-card').forEach(c => {
          c.classList.remove('in-view');
          c.style.transitionDelay = '';
        });
        grid.scrollTop = 0;
        // Force layout flush so the .in-view removal commits before re-observation.
        void grid.offsetHeight;
        setupCardReveal();
      };
    }

    /* Deterministic seeded shuffle — gives a stable but varied order
       on every page load so the column-flow masonry doesn't stack the
       same image / aspect-ratio diagonally across columns. Without this,
       the tripled source produces a tetris-like repeating pattern. */
    function shuffleSeeded(arr, seed) {
      const out = arr.slice();
      let s = seed | 0;
      const rnd = () => {
        s = (s * 9301 + 49297) | 0;
        return ((s % 233280) + 233280) % 233280 / 233280;
      };
      for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(rnd() * (i + 1));
        const tmp = out[i]; out[i] = out[j]; out[j] = tmp;
      }
      return out;
    }

    function buildListHeader() {
      const header = document.createElement('div');
      header.className = 'list-header';
      header.setAttribute('role', 'row');
      header.innerHTML =
        '<div class="lh-cell lh-name lh-sortable" data-col="name" role="columnheader" tabindex="0">Name<span class="lh-chev"></span></div>' +
        '<div class="lh-cell lh-date-h lh-sortable" data-col="date" role="columnheader" tabindex="0">Date Modified<span class="lh-chev"></span></div>' +
        '<div class="lh-cell lh-system-h" role="columnheader">System</div>';
      return header;
    }
    function renderGrid(filter) {
      grid.innerHTML = '';
      grid.appendChild(buildListHeader());
      const source = filter === 'videos' ? videoPhotos : photos;
      /* Triple for scroll length, then deterministically shuffle so
         duplicates (and similar aspect ratios) spread out instead of
         lining up. Browsers cache by URL so the duplicates within a
         page only fetch once. */
      const all = shuffleSeeded(
        [...source, ...source, ...source],
        filter === 'videos' ? 7919 : 1429
      );
      /* Videos don't use the photo `id` — their content + AR comes
         from videoSources. Shuffle that sequence (twice the length
         covers the tripled card count) so 16:9 / 9:16 / 1:1 clips
         don't cluster together in the dense grid. */
      const videoSeq = filter === 'videos'
        ? shuffleSeeded([...videoSources, ...videoSources], 5471)
        : null;
      /* Aspect-ratio shuffle for images — the previous `i * 3 % 5`
         cycle put the same AR on the same row across every column
         (column-flow masonry distributes positions [0..colSize) into
         col 1, [colSize..2*colSize) into col 2, etc., so all the
         "row N" entries share the same AR index). Build a balanced
         list with each AR slot appearing equally, then shuffle it so
         adjacency is randomized but the AR mix stays even. */
      let aspectOrder = null;
      if (filter !== 'videos') {
        const N = all.length;
        const balanced = [];
        for (let k = 0; k < N; k++) balanced.push(k % aspects.length);
        aspectOrder = shuffleSeeded(balanced, 3947);
      }
      const frag = document.createDocumentFragment();
      all.forEach((id, i) => {
        const fig = document.createElement('figure');
        fig.className = 'graphics-card' + (filter === 'videos' ? ' is-video' : '');
        const { w, h } = aspects[aspectOrder ? aspectOrder[i] : (i * 3) % aspects.length];
        const posterUrl = 'https://images.unsplash.com/photo-' + id +
          '?w=' + w + '&h=' + h + '&q=75&auto=format&fit=crop&fm=webp&cs=tinysrgb';

        if (filter === 'videos') {
          /* Video card — idle state is the video's own first frame
             (no separate poster image), so hover playback is a true
             continuation of what the user sees at rest. The clip's
             native pixel dimensions (from videoSources) are set as
             width/height attributes so the card reserves the correct
             aspect-ratio box before the video metadata loads. Mix of
             16:9, 9:16, and 1:1 clips reproduces the Midjourney
             explore-page mosaic feel. preload="metadata" decodes
             frame 0 without streaming the full clip. */
          const vs = videoSeq[i % videoSeq.length];
          const video = document.createElement('video');
          /* Lazy-load the src — kicking off metadata fetch for all 45
             cards at once would stampede the network on a Videos filter
             swap (Sora clips run 16–60 MB). The IntersectionObserver
             below promotes data-src → src as each card scrolls within
             rootMargin of the viewport, so loads queue with scroll. */
          video.dataset.src = vs.src;
          video.width = vs.w;
          video.height = vs.h;
          video.muted = true;
          video.loop = true;
          video.playsInline = true;
          video.preload = 'metadata';
          video.setAttribute('disablepictureinpicture', '');
          /* Some browsers won't paint frame 0 until a seek occurs —
             nudge currentTime to 0.001 on `loadedmetadata` to force
             first-frame decode, then reset to 0 once it's painted. */
          video.addEventListener('loadedmetadata', () => {
            try { video.currentTime = 0.001; } catch (_) {}
          }, { once: true });
          video.addEventListener('loadeddata', () => {
            video.classList.add('loaded');
            try { video.currentTime = 0; } catch (_) {}
          }, { once: true });
          fig.appendChild(video);
          /* Play on hover; reset to frame 0 on leave so the next hover
             starts fresh. Catch + swallow the play() promise rejection
             that fires if the user un-hovers before play() resolves. */
          fig.addEventListener('mouseenter', () => {
            const p = video.play();
            if (p && typeof p.catch === 'function') p.catch(() => {});
          });
          fig.addEventListener('mouseleave', () => {
            video.pause();
            try { video.currentTime = 0; } catch (_) {}
          });
        } else {
          const img = document.createElement('img');
          img.src = posterUrl;
          img.alt = '';
          img.loading = 'lazy';
          img.decoding = 'async';
          /* Mark the image as loaded so its opacity transition kicks in.
             Handles cached images (which fire complete synchronously) by
             also checking img.complete on next frame. */
          img.addEventListener('load', () => img.classList.add('loaded'));
          if (img.complete) requestAnimationFrame(() => img.classList.add('loaded'));
          fig.appendChild(img);
        }
        /* Stash the searchable strings on the card so the search box
           can match without walking the overlay DOM (which is cheap
           per card but adds up at 90 cards). All-lowercased once here. */
        const promptIdx = i * 5 + 2;
        const modelIdx = i * 3 + 1;
        const promptText = prompts[promptIdx % prompts.length];
        const modelText = models[modelIdx % models.length];
        const authorText = authors[promptIdx % authors.length].name;
        const timeIdx = promptIdx % timestamps.length;
        fig.dataset.search = (promptText + ' ' + authorText + ' ' + modelText).toLowerCase();
        /* Sort keys for the Finder-style list view. Date stored as a
           recency score — higher = newer — so DESC reads "newest first"
           the way macOS Finder does. */
        fig.dataset.listName = promptText.toLowerCase();
        fig.dataset.listType = filter === 'videos' ? 'video' : 'graphics';
        fig.dataset.listDate = String(timestamps.length - 1 - timeIdx);
        fig.dataset.listUsers = authorText.toLowerCase();
        fig.appendChild(makeOverlay(promptIdx, modelIdx, filter));
        frag.appendChild(fig);
      });
      grid.appendChild(frag);
      wireOverlayMenus();
      setupCardReveal();
      /* Re-apply any active search query against the freshly-rendered
         set so filter switches (Images ↔ Videos) preserve the user's
         search context. */
      applySearchFilter();
      /* Re-wire sort header + re-apply any active sort so it survives
         filter switches (Images ↔ Videos). */
      wireListSort();
      if (listSort.col) applyListSort(listSort.col, listSort.dir, true);
      /* Mirror canvas_2's cell-clamp: in list view, the prompt is a
         1-line clamp by default and smoothly expands to its full
         multi-line height on row hover. Gated to list view inside the
         handler so mosaic + dense grid keep their own prompt behavior. */
      setupListPromptExpand();
      /* Floating asset-preview popover that opens to the right of the
         white card on row hover, sized so it stays clear of the prompt. */
      setupListPreview();
    }

    /* List-view asset preview — singleton popover anchored to the
       grid's right edge, vertically aligned to the hovered row.
       Images render static; videos auto-play muted+looped while open.
       Gated to list view inside the handler so mosaic + dense grid
       (which already have their own glass overlay on the card) aren't
       affected. The mouseleave bind lives on the GRID (not the card)
       so moving the cursor between rows just re-positions instead of
       flickering hide→show between transitions. */
    function setupListPreview() {
      let preview = document.getElementById('listPreview');
      if (!preview) {
        preview = document.createElement('div');
        preview.id = 'listPreview';
        preview.className = 'list-preview';
        preview.setAttribute('aria-hidden', 'true');
        preview.innerHTML =
          '<img class="list-preview-media list-preview-img" alt="">' +
          '<video class="list-preview-media list-preview-video" muted loop playsinline preload="metadata"></video>';
        document.body.appendChild(preview);
      }
      const previewImg = preview.querySelector('.list-preview-img');
      const previewVideo = preview.querySelector('.list-preview-video');

      function hide() {
        preview.classList.remove('open');
        try { previewVideo.pause(); previewVideo.currentTime = 0; } catch (_) {}
      }

      function show(card) {
        if (grid.dataset.view !== 'list') return;

        /* Reset video so a previous row's frame doesn't ghost into
           the new row's preview during the fade-in. */
        try { previewVideo.pause(); previewVideo.currentTime = 0; } catch (_) {}

        /* Reflect the asset's native aspect ratio so the popover
           reserves the right amount of vertical space before any
           image bytes arrive. */
        const ar = card.style.aspectRatio || '1 / 1';
        preview.style.aspectRatio = ar;

        const isVideo = card.dataset.listType === 'video';
        if (isVideo) {
          previewImg.style.display = 'none';
          previewVideo.style.display = 'block';
          const cardVid = card.querySelector('video');
          if (cardVid) {
            /* The IntersectionObserver promotes data-src → src as
               cards enter view, so fall back to data-src for rows
               that the user hovered before they fully scrolled in. */
            const src = cardVid.src || cardVid.dataset.src || '';
            if (src && previewVideo.src !== src) previewVideo.src = src;
            const p = previewVideo.play();
            if (p && typeof p.catch === 'function') p.catch(() => {});
          }
        } else {
          previewVideo.style.display = 'none';
          previewVideo.removeAttribute('src');
          previewImg.style.display = 'block';
          const cardImg = card.querySelector('img');
          if (cardImg && previewImg.src !== cardImg.src) {
            previewImg.src = cardImg.src;
          }
        }

        /* Position in the next frame so offsetHeight reflects the
           newly-applied aspect-ratio + content swap. */
        requestAnimationFrame(() => {
          const PREVIEW_W = 280;
          const GAP = 24;
          const VIEWPORT_PAD = 16;
          const gridRect = grid.getBoundingClientRect();
          const rowRect = card.getBoundingClientRect();
          const previewH = preview.offsetHeight || PREVIEW_W;

          /* Default: anchor to the card's LEFT edge — popover sits
             in the whitespace to the left of the white card. Flips
             to the right side only if clipped (narrow viewport). */
          let left = gridRect.left - PREVIEW_W - GAP;
          if (left < VIEWPORT_PAD) {
            left = gridRect.right + GAP;
          }
          /* If the flipped (right) position would clip the right
             edge, clamp against the viewport's right padding so it
             stays visible at all costs. */
          if (left + PREVIEW_W > window.innerWidth - VIEWPORT_PAD) {
            left = Math.max(VIEWPORT_PAD, window.innerWidth - PREVIEW_W - VIEWPORT_PAD);
          }

          /* Vertically center the popover on the hovered row, then
             clamp inside the viewport. */
          let top = rowRect.top + (rowRect.height / 2) - (previewH / 2);
          top = Math.max(VIEWPORT_PAD, Math.min(top, window.innerHeight - previewH - VIEWPORT_PAD));

          preview.style.left = left + 'px';
          preview.style.top = top + 'px';
          preview.classList.add('open');
        });
      }

      /* Per-row mouseenter swaps the preview's content + position.
         Cards are recreated on every render so handlers must be
         re-attached each call. The grid-level mouseleave only needs
         to bind once, so we guard with a sentinel. */
      grid.querySelectorAll('.graphics-card').forEach(card => {
        card.addEventListener('mouseenter', () => show(card));
      });
      if (!grid._listPreviewLeaveAttached) {
        grid._listPreviewLeaveAttached = true;
        grid.addEventListener('mouseleave', hide);
      }
    }

    /* List-view row expansion — mirrors canvas_2's cell-clamp pattern.
       On row mouseenter (in list view only), if the prompt is overflowing
       its 1-line clamp, drop the line-clamp inline + animate max-height
       up to the cell's exact scrollHeight (520ms ease in/out). On
       mouseleave, clear inline max-height (CSS animates back to 1.4em),
       then re-apply line-clamp after the transition finishes so the
       collapse doesn't snap-clip mid-flight. */
    const LIST_EXPAND_DURATION = 520;
    function setupListPromptExpand() {
      grid.querySelectorAll('.graphics-card').forEach(card => {
        const prompt = card.querySelector('.gco-prompt');
        if (!prompt) return;
        let detected = false;
        let leaveTimer = null;
        card.addEventListener('mouseenter', () => {
          if (grid.dataset.view !== 'list') return;
          if (!detected) {
            detected = true;
            /* Briefly drop line-clamp + max-height to read the prompt's
               natural unconstrained height. If it exceeds the clamped
               height, tag the prompt as expandable. */
            prompt.style.webkitLineClamp = 'unset';
            prompt.style.lineClamp = 'unset';
            prompt.style.maxHeight = 'none';
            const fullH = prompt.scrollHeight;
            prompt.style.webkitLineClamp = '';
            prompt.style.lineClamp = '';
            prompt.style.maxHeight = '';
            const clampedH = prompt.clientHeight;
            if (fullH > clampedH + 1) {
              prompt.classList.add('is-overflow');
            }
          }
          if (!prompt.classList.contains('is-overflow')) return;
          if (leaveTimer) { clearTimeout(leaveTimer); leaveTimer = null; }
          prompt.style.webkitLineClamp = 'unset';
          prompt.style.lineClamp = 'unset';
          /* Single forced reflow so the next scrollHeight read is
             accurate against the unclamped layout. */
          void prompt.offsetHeight;
          prompt.style.maxHeight = prompt.scrollHeight + 'px';
          card.classList.add('is-row-expanded');
        });
        card.addEventListener('mouseleave', () => {
          if (grid.dataset.view !== 'list') return;
          if (!prompt.classList.contains('is-overflow')) return;
          /* Clearing inline max-height lets the CSS rule (1.4em)
             take over — the same property animates back. */
          prompt.style.maxHeight = '';
          card.classList.remove('is-row-expanded');
          if (leaveTimer) clearTimeout(leaveTimer);
          leaveTimer = setTimeout(() => {
            prompt.style.webkitLineClamp = '';
            prompt.style.lineClamp = '';
            leaveTimer = null;
          }, LIST_EXPAND_DURATION);
        });
      });
    }

    /* Sort state persists across renders. col=null means default order. */
    const listSort = { col: null, dir: null };
    function applyListSort(col, dir, skipStateMutation) {
      if (!skipStateMutation) { listSort.col = col; listSort.dir = dir; }
      const cards = Array.from(grid.querySelectorAll('.graphics-card'));
      cards.sort((a, b) => {
        const va = a.dataset['list' + col.charAt(0).toUpperCase() + col.slice(1)] || '';
        const vb = b.dataset['list' + col.charAt(0).toUpperCase() + col.slice(1)] || '';
        let cmp;
        if (col === 'date') cmp = parseFloat(va) - parseFloat(vb);
        else cmp = va.localeCompare(vb);
        return dir === 'asc' ? cmp : -cmp;
      });
      /* Re-append in sorted order. The list-header stays at index 0
         because it's a <div>, and appendChild on existing nodes just
         moves them — it doesn't clone. */
      const frag = document.createDocumentFragment();
      cards.forEach(c => frag.appendChild(c));
      grid.appendChild(frag);
      /* Update header chevron + active class. */
      const header = grid.querySelector('.list-header');
      if (!header) return;
      header.querySelectorAll('.lh-sortable').forEach(c => {
        c.classList.remove('is-sorted', 'asc', 'desc');
      });
      const activeCell = header.querySelector('.lh-sortable[data-col="' + col + '"]');
      if (activeCell) activeCell.classList.add('is-sorted', dir);
    }
    function wireListSort() {
      const header = grid.querySelector('.list-header');
      if (!header) return;
      header.querySelectorAll('.lh-sortable').forEach(cell => {
        cell.addEventListener('click', () => {
          const col = cell.dataset.col;
          let dir;
          if (listSort.col === col) {
            /* Same column — flip direction. */
            dir = listSort.dir === 'asc' ? 'desc' : 'asc';
          } else {
            /* New column — default direction depends on data type. Date
               feels right starting newest-first; Name + Users start A-Z. */
            dir = col === 'date' ? 'desc' : 'asc';
          }
          applyListSort(col, dir);
        });
        cell.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            cell.click();
          }
        });
      });
    }

    /* Position the menu in viewport coordinates so it can render above
       every overflow-clipped ancestor. Flips to the left side of the
       button if there isn't horizontal room on the right; flips up if
       the menu would go off the bottom edge. */
    function positionMenu(btn, menu) {
      /* Cards run a rack-focus reveal that leaves transform / filter /
         will-change on the card. Per the CSS containing-block spec,
         any of those promote the card to a containing block for its
         position:fixed descendants — so the menu's viewport-coord math
         below would actually render relative to the card. Hoist the
         menu into <body> before positioning so the rect math is truly
         viewport-relative; closeAllMenus puts it back so the button's
         nextElementSibling lookup keeps working on subsequent clicks. */
      if (menu.parentElement !== document.body) {
        menu._origParent = menu.parentElement;
        document.body.appendChild(menu);
      }
      const rect = btn.getBoundingClientRect();
      const margin = 8;
      // Render off-screen first to measure
      menu.style.visibility = 'hidden';
      menu.classList.add('open');
      const mw = menu.offsetWidth;
      const mh = menu.offsetHeight;
      menu.classList.remove('open');
      menu.style.visibility = '';
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      // Default: right of button, aligned to button's top
      let left = rect.right + margin;
      let top = rect.top;
      if (left + mw > vw - 12) left = rect.left - mw - margin;          // flip horizontally
      if (left < 12) left = Math.max(12, vw - mw - 12);                  // last resort
      if (top + mh > vh - 12) top = Math.max(12, rect.bottom - mh);      // flip vertically
      menu.style.left = left + 'px';
      menu.style.top = top + 'px';
    }

    function closeAllMenus() {
      /* Menus may have been hoisted to <body> by positionMenu, so look
         them up document-wide here. After closing, return each menu to
         its original parent next to its button so nextElementSibling
         continues to find it on the next click. */
      document.querySelectorAll('.gco-menu.open').forEach(m => {
        m.classList.remove('open');
        m.setAttribute('aria-hidden', 'true');
        if (m._origParent) {
          m._origParent.appendChild(m);
          delete m._origParent;
        }
      });
      grid.querySelectorAll('.gco-action-more[aria-expanded="true"]').forEach(b => {
        b.setAttribute('aria-expanded', 'false');
      });
      /* Drop the .has-open-menu pin so the card returns to its
         normal hover-tracking visibility. */
      grid.querySelectorAll('.graphics-card.has-open-menu').forEach(c => {
        c.classList.remove('has-open-menu');
      });
    }

    function wireOverlayMenus() {
      const moreBtns = grid.querySelectorAll('.gco-action-more');
      moreBtns.forEach(btn => {
        /* Capture the menu reference at wire time. After the first open,
           positionMenu hoists the menu into <body> so btn.nextElementSibling
           no longer resolves — looking it up on every click would silently
           fail toggling closed. The closure pins it. */
        const menu = btn.nextElementSibling;
        if (!menu) return;
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const wasOpen = menu.classList.contains('open');
          closeAllMenus();
          if (!wasOpen) {
            positionMenu(btn, menu);
            menu.classList.add('open');
            menu.setAttribute('aria-hidden', 'false');
            btn.setAttribute('aria-expanded', 'true');
            /* Pin the parent card as "hover-active" so the overlay
               doesn't flip to visibility:hidden the moment the cursor
               moves off the card to reach the position:fixed menu —
               which was making the menu disappear before any item
               could be clicked. */
            const card = btn.closest('.graphics-card');
            if (card) card.classList.add('has-open-menu');
          }
        });
        /* Clicking any menu item dismisses the menu — the item's
           "action" is a no-op in this demo, but the close behavior
           shouldn't depend on that. The Delete entry chains into the
           confirmation modal. */
        menu.querySelectorAll('.gco-menu-item').forEach(item => {
          item.addEventListener('click', (e) => {
            e.stopPropagation();
            const isDelete = item.classList.contains('gco-menu-item-delete');
            closeAllMenus();
            if (isDelete) {
              const card = btn.closest('.graphics-card');
              if (card) openDeleteModal(card);
            }
          });
        });
      });
      /* Wire each card's trash icon directly to the same modal. */
      grid.querySelectorAll('.gco-action-delete').forEach(deleteBtn => {
        deleteBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const card = deleteBtn.closest('.graphics-card');
          if (card) openDeleteModal(card);
        });
      });
      /* Truncation tooltips on the author name + model chip — only
         actually render when the trigger is ellipsized. */
      grid.querySelectorAll('.gco-name, .gco-model-chip').forEach(el => {
        el.addEventListener('mouseenter', () => showTruncTooltip(el));
        el.addEventListener('mouseleave', hideTruncTooltip);
      });
    }

    /* === Truncation tooltip ===
       Shows the full text when a .gco-name or .gco-model-chip is
       ellipsized. Singleton element in <body> repositioned per hover
       so we don't carry 90+ tooltip nodes in the DOM. */
    const truncTooltip = document.getElementById('truncTooltip');
    function showTruncTooltip(el) {
      if (!truncTooltip || !el) return;
      const isTruncated = el.scrollWidth > el.clientWidth + 1;
      if (!isTruncated) return;
      const text = (el.textContent || '').trim();
      if (!text) return;
      truncTooltip.textContent = text;
      truncTooltip.classList.toggle('is-mono', el.classList.contains('gco-model-chip'));
      /* Measure off-screen first, then place. */
      truncTooltip.style.maxWidth = Math.min(360, window.innerWidth - 24) + 'px';
      truncTooltip.style.left = '-9999px';
      truncTooltip.style.top = '-9999px';
      truncTooltip.classList.add('open');
      const tt = truncTooltip.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      const gap = 8;
      let placement = 'top';
      let top = r.top - tt.height - gap;
      if (top < 8) {
        placement = 'bottom';
        top = r.bottom + gap;
      }
      let left = r.left + r.width / 2 - tt.width / 2;
      left = Math.max(8, Math.min(left, window.innerWidth - tt.width - 8));
      truncTooltip.dataset.placement = placement;
      truncTooltip.style.left = left + 'px';
      truncTooltip.style.top = top + 'px';
      truncTooltip.setAttribute('aria-hidden', 'false');
    }
    function hideTruncTooltip() {
      if (!truncTooltip) return;
      truncTooltip.classList.remove('open');
      truncTooltip.setAttribute('aria-hidden', 'true');
    }
    /* Any scroll / resize invalidates the cached coords — just hide. */
    window.addEventListener('scroll', hideTruncTooltip, true);
    window.addEventListener('resize', hideTruncTooltip);
    /* Expose on the tooltip element so canvas_4 (or other IIFEs) can
     reuse the singleton tooltip without duplicating the placement
     math. */
    truncTooltip._show = showTruncTooltip;
    truncTooltip._hide = hideTruncTooltip;

    /* === Search ===
       Collapsed pill expands inline on click/focus and filters cards
       live against the lower-cased data-search string each card stashes
       at render time. Empty-state element appears when zero matches. */
    const searchWrap = document.getElementById('graphicsSearch');
    const searchBtn = document.getElementById('graphicsSearchBtn');
    const searchInput = document.getElementById('graphicsSearchInput');
    const searchClear = document.getElementById('graphicsSearchClear');
    const searchCount = document.getElementById('graphicsSearchCount');
    let searchQuery = '';
    let emptyEl = null;

    function applySearchFilter() {
      const cards = grid.querySelectorAll('.graphics-card');
      const q = searchQuery.trim().toLowerCase();
      let matched = 0;
      cards.forEach(card => {
        if (!q) {
          card.classList.remove('search-hidden');
          matched += 1;
          return;
        }
        const hay = card.dataset.search || '';
        const hit = hay.indexOf(q) !== -1;
        card.classList.toggle('search-hidden', !hit);
        if (hit) matched += 1;
      });
      /* Empty-state node — only mount it when needed, so the grid's
         column-count masonry doesn't have a perma-stranded child. */
      if (q && matched === 0) {
        if (!emptyEl) {
          emptyEl = document.createElement('div');
          emptyEl.className = 'graphics-empty';
          grid.appendChild(emptyEl);
        }
        emptyEl.innerHTML = 'No matches for <strong>"' + q.replace(/[<>&]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;'}[c])) + '"</strong>';
      } else if (emptyEl) {
        emptyEl.remove();
        emptyEl = null;
      }
      if (searchCount) {
        searchCount.textContent = q ? matched + (matched === 1 ? ' match' : ' matches') : '';
      }
      if (searchWrap) {
        searchWrap.classList.toggle('has-query', !!q);
      }
    }
    function openSearch() {
      if (!searchWrap) return;
      searchWrap.classList.add('is-open');
      searchBtn.setAttribute('aria-expanded', 'true');
      /* Wait one frame so the width transition has a starting layout. */
      requestAnimationFrame(() => searchInput && searchInput.focus());
    }
    function closeSearch() {
      if (!searchWrap) return;
      /* Only collapse when there's no active query — sticky pill while
         search is "in use" keeps the user's filter visible. */
      if (searchQuery) return;
      searchWrap.classList.remove('is-open');
      searchBtn.setAttribute('aria-expanded', 'false');
    }
    if (searchWrap) {
      searchBtn.addEventListener('click', openSearch);
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        applySearchFilter();
      });
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          if (searchQuery) {
            searchInput.value = '';
            searchQuery = '';
            applySearchFilter();
          } else {
            searchInput.blur();
            closeSearch();
          }
        }
      });
      searchInput.addEventListener('blur', () => {
        /* Defer so a click on the clear button gets a chance to fire
           before we evaluate whether to collapse. */
        setTimeout(closeSearch, 120);
      });
      searchClear.addEventListener('mousedown', (e) => {
        /* X explicitly means "close the search" — clear any active
           query AND collapse the pill back to the icon. mousedown so
           the input doesn't blur first and trigger the deferred
           collapse setTimeout above. */
        e.preventDefault();
        searchInput.value = '';
        searchQuery = '';
        applySearchFilter();
        searchInput.blur();
        searchWrap.classList.remove('is-open');
        searchBtn.setAttribute('aria-expanded', 'false');
      });
      /* Outside-click closes when empty. */
      document.addEventListener('mousedown', (e) => {
        if (!searchWrap.contains(e.target)) closeSearch();
      });
    }

    /* === Delete confirmation modal ===
       Body-level overlay that blurs the app and asks for confirmation
       before any destructive action. Thumbnail clones the card's media
       (image src or video src + poster frame) so the user has a visual
       anchor for what they're about to nuke. */
    const deleteModal = document.getElementById('deleteModal');
    const deleteModalThumb = document.getElementById('deleteModalThumb');
    const deleteModalKind = document.getElementById('deleteModalKind');
    const deleteModalCancel = document.getElementById('deleteModalCancel');
    const deleteModalConfirm = document.getElementById('deleteModalConfirm');

    function openDeleteModal(card) {
      if (!deleteModal) return;
      /* Populate the thumb from whichever media element the card carries.
         Cloning preserves the loaded video frame (we set currentTime on
         the original, the clone inherits frame state via the same src
         + preload metadata). */
      deleteModalThumb.innerHTML = '';
      const srcImg = card.querySelector('img');
      const srcVid = card.querySelector('video');
      let kind = 'Item';
      if (srcVid) {
        const v = document.createElement('video');
        v.src = srcVid.currentSrc || srcVid.src || srcVid.dataset.src || '';
        v.muted = true;
        v.loop = true;
        v.autoplay = true;
        v.playsInline = true;
        /* The modal is a focused destructive moment — preload eagerly
           so the loop fires immediately when the user opens it. The
           clip already lives in the local /videos bundle and the card
           that triggered this modal almost certainly hovered it at
           least once, so the file is warm in the HTTP cache too. */
        v.preload = 'auto';
        v.setAttribute('disablepictureinpicture', '');
        deleteModalThumb.appendChild(v);
        /* Explicit play() guards against autoplay attribute being
           ignored when JS-inserted post-load. Swallow the rejection
           that fires if the modal closes before play() resolves. */
        const p = v.play();
        if (p && typeof p.catch === 'function') p.catch(() => {});
        kind = 'Video';
      } else if (srcImg) {
        const i = document.createElement('img');
        i.src = srcImg.currentSrc || srcImg.src;
        i.alt = '';
        deleteModalThumb.appendChild(i);
        kind = 'Image';
      }
      deleteModalKind.textContent = kind;
      deleteModal.setAttribute('aria-hidden', 'false');
      requestAnimationFrame(() => deleteModal.classList.add('open'));
    }
    function closeDeleteModal() {
      if (!deleteModal) return;
      deleteModal.classList.remove('open');
      deleteModal.setAttribute('aria-hidden', 'true');
      /* Drop the cloned media after the close transition so paused
         video frames don't linger in memory. */
      setTimeout(() => { if (deleteModalThumb) deleteModalThumb.innerHTML = ''; }, 320);
    }
    if (deleteModal) {
      deleteModalCancel.addEventListener('click', closeDeleteModal);
      deleteModalConfirm.addEventListener('click', closeDeleteModal);
      /* Backdrop click — only when target is the modal itself, not the
         card. */
      deleteModal.addEventListener('click', (e) => {
        if (e.target === deleteModal) closeDeleteModal();
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && deleteModal.classList.contains('open')) {
          closeDeleteModal();
        }
      });
      /* Expose the opener on the modal element itself so canvas_4's
         IIFE (or anything else with a card reference) can spawn the
         same confirmation flow without duplicating its scope. */
      deleteModal._openWith = openDeleteModal;
    }

    /* Shared page-swap helper for all .app-modal-tbody paginated
       lists. Mirrors canvas_3's smoothSwap: fade tbody out, swap
       content, fade back in. 200ms each side reads as deliberate
       page change. _swapBusy on the tbody itself guards against
       double-clicks before the in-out completes. */
    window._appModalSwap = function (rowsEl, action) {
      if (!rowsEl || rowsEl._swapBusy) return;
      rowsEl._swapBusy = true;
      rowsEl.classList.add('is-swapping');
      setTimeout(() => {
        action();
        requestAnimationFrame(() => {
          rowsEl.classList.remove('is-swapping');
          setTimeout(() => { rowsEl._swapBusy = false; }, 220);
        });
      }, 200);
    };

    /* === Agents picker modal — opens from the rail Agents button.
       Backdrop-blurs the whole app, lifts a centered card with a
       searchable + paginated list of selectable agents. Reuses
       the .app-modal generic chrome (also wired for Knowledge /
       Instructions when those are added). */
    (function initAgentsModal() {
      const modal = document.getElementById('agentsModal');
      const closeBtn = document.getElementById('agentsModalClose');
      const rowsEl  = document.getElementById('agentsModalRows');
      const pagerEl = document.getElementById('agentsModalPagination');
      const searchInput = modal && modal.querySelector('.app-modal-search input');
      const sidebarLis  = modal && modal.querySelectorAll('.app-modal-sidebar li');
      const triggers = document.querySelectorAll('.rail-tool-agents');
      if (!modal || !rowsEl || !pagerEl || !triggers.length) return;

      const AGENTS = [
        { name: 'General',           desc: 'A normal user',                                                                              date: 'May 12, 2026' },
        { name: 'Copywriter',        desc: 'A creative copywriter crafts engaging, persuasive content across briefs and channels.',     date: 'May 10, 2026' },
        { name: 'Strategist',        desc: 'A creative strategist develops innovative concepts and platform-spanning narratives.',      date: 'May 09, 2026' },
        { name: 'Account',           desc: 'An account manager builds and maintains client relationships day-to-day.',                  date: 'May 07, 2026' },
        { name: 'Prompt Engineer',   desc: 'Structures prompts and chains for repeatable, brand-aligned model output.',                 date: 'May 04, 2026' },
        { name: 'Audience Segments', desc: 'Slices first-party data into addressable audiences for media targeting.',                   date: 'May 02, 2026' },
        { name: 'Boolean Generator', desc: 'Generates boolean search strings for research, sourcing and ad targeting.',                 date: 'Apr 29, 2026' },
        { name: 'Brand Snapshot',    desc: 'Compresses a brand into a one-page snapshot — positioning, audience, proof.',               date: 'Apr 27, 2026' },
        { name: 'Brand Architect',   desc: 'Designs and codifies brand systems — voice, visual, behaviour.',                            date: 'Apr 24, 2026' },
        { name: 'Brief Builder',     desc: 'Translates a kick-off conversation into a tight creative brief.',                           date: 'Apr 22, 2026' },
        { name: 'Campaign Mapper',   desc: 'Plots a campaign across channels, phases and milestones.',                                  date: 'Apr 19, 2026' },
        { name: 'Channel Planner',   desc: 'Maps creative + media against funnel stages and channel mix.',                              date: 'Apr 16, 2026' },
        { name: 'Competitive Lens',  desc: 'Sweeps competitor activity across paid, owned and earned.',                                 date: 'Apr 14, 2026' },
        { name: 'Content Auditor',   desc: 'Sweeps existing content for gaps, duplicates and stale assets.',                            date: 'Apr 11, 2026' },
        { name: 'Creative Director', desc: 'Sets and defends the visual + verbal direction for an idea.',                               date: 'Apr 08, 2026' },
        { name: 'Cultural Pulse',    desc: 'Surfaces trending signals from culture, subculture and memes.',                             date: 'Apr 05, 2026' },
        { name: 'Data Storyteller',  desc: 'Turns BI dashboards into narrative slides that hold for a room.',                           date: 'Apr 02, 2026' },
        { name: 'Deck Generator',    desc: 'Builds first-pass pitch decks from a prompt and brand kit.',                                date: 'Mar 30, 2026' },
        { name: 'Editor',            desc: 'Tightens copy, kills filler, holds tone across long-form drafts.',                          date: 'Mar 27, 2026' },
        { name: 'Email Sequence',    desc: 'Drafts multi-touch email sequences with subject + body variants.',                          date: 'Mar 24, 2026' },
        { name: 'Experience Mapper', desc: 'Charts user journeys, touchpoints and friction points.',                                    date: 'Mar 21, 2026' },
        { name: 'Fact Checker',      desc: 'Cross-references factual claims against source documents.',                                 date: 'Mar 18, 2026' },
        { name: 'Headline Hammer',   desc: 'Iterates headline candidates fast — tone, length, hook variations.',                        date: 'Mar 15, 2026' },
        { name: 'Hook Generator',    desc: 'Generates first-three-seconds video hooks for paid social.',                                date: 'Mar 12, 2026' },
        { name: 'Influencer Match',  desc: 'Matches creators against brand briefs by affinity, audience and tone.',                     date: 'Mar 09, 2026' },
        { name: 'Insight Miner',     desc: 'Pulls verbatim quotes from research transcripts to seed briefs.',                           date: 'Mar 06, 2026' },
        { name: 'KPI Definer',       desc: 'Frames measurable success criteria for a campaign or initiative.',                          date: 'Mar 03, 2026' },
        { name: 'Localizer',         desc: 'Adapts copy and references for non-US English-language markets.',                           date: 'Feb 28, 2026' },
        { name: 'Manifesto Writer',  desc: 'Drafts brand manifestos with rhythm and a clear point of view.',                            date: 'Feb 25, 2026' },
        { name: 'Media Mix Modeler', desc: 'Recommends paid / earned / owned splits given budget + objective.',                         date: 'Feb 22, 2026' },
        { name: 'Microcopy Crafter', desc: 'UI copy, error states, empty states, success confirmations.',                               date: 'Feb 19, 2026' },
        { name: 'Moodboard Curator', desc: 'Sources reference imagery and motion by mood, tone, palette.',                              date: 'Feb 16, 2026' },
        { name: 'Naming',            desc: 'Generates name candidates with rationale and trademark check.',                             date: 'Feb 13, 2026' },
        { name: 'Naming Lab',        desc: 'Multi-variant naming exercise with rationale per candidate.',                               date: 'Feb 10, 2026' },
        { name: 'Narrative Designer',desc: 'Multi-act story arcs for brand worlds and integrated launches.',                            date: 'Feb 07, 2026' },
        { name: 'Newsroom Trends',   desc: 'Real-time culture + news signal feed surfaced as briefable insights.',                      date: 'Feb 04, 2026' },
        { name: 'One-Liner',         desc: 'Compresses a brief into a single tagline with three alternates.',                           date: 'Feb 01, 2026' },
        { name: 'Persona Builder',   desc: 'Synthesizes demographic + behavioural data into rich personas.',                            date: 'Jan 29, 2026' },
        { name: 'Pitch Doctor',      desc: 'Pressure-tests pitch logic + flow before the live read-out.',                               date: 'Jan 26, 2026' },
        { name: 'Plan-of-Work',      desc: 'Generates project plans + RACI from a scope and team list.',                                date: 'Jan 23, 2026' },
        { name: 'PR Pulse',          desc: 'Drafts press releases + boilerplate in client-approved tone.',                              date: 'Jan 20, 2026' },
        { name: 'Premise Builder',   desc: 'Tests core concept premises against category truths.',                                      date: 'Jan 17, 2026' },
        { name: 'Production Estimator', desc: 'Rough order-of-magnitude budgets for film and photo shoots.',                            date: 'Jan 14, 2026' },
        { name: 'Project Brief',     desc: 'Internal project brief generator — scope, goal, deliverables, dates.',                      date: 'Jan 11, 2026' },
        { name: 'QA Reviewer',       desc: 'Spell, grammar, brand-tone and legal-flag pass on any draft.',                              date: 'Jan 08, 2026' },
        { name: 'Reach Estimator',   desc: 'Audience reach projections per channel given a budget.',                                    date: 'Jan 05, 2026' },
        { name: 'Research Synthesizer', desc: 'Compresses interview transcripts to actionable themes.',                                 date: 'Jan 02, 2026' },
        { name: 'Retro Generator',   desc: 'Drafts post-launch retrospective decks from project artefacts.',                            date: 'Dec 28, 2025' },
        { name: 'Scriptwriter',      desc: 'Long + short-form video scripts in brand voice.',                                           date: 'Dec 23, 2025' },
        { name: 'SEO Architect',     desc: 'On-page SEO strategy + keyword maps for content programs.',                                 date: 'Dec 18, 2025' },
        { name: 'Shot List',         desc: 'Production shot lists from a script or treatment.',                                         date: 'Dec 13, 2025' },
        { name: 'Slide Beautifier',  desc: 'Polishes raw slides to brand spec — type, spacing, hierarchy.',                             date: 'Dec 10, 2025' },
        { name: 'Social Calendar',   desc: '30 / 60 / 90-day social schedules across owned channels.',                                  date: 'Dec 05, 2025' },
        { name: 'Sound Director',    desc: 'Audio + music briefs for video projects.',                                                  date: 'Nov 30, 2025' },
        { name: 'Storyboard',        desc: 'Frame-by-frame storyboards generated from scripts.',                                        date: 'Nov 25, 2025' },
        { name: 'Style Guide',       desc: 'Generates voice + tone style guides from sample content.',                                  date: 'Nov 20, 2025' },
        { name: 'Tagline Lab',       desc: 'Multi-variant tagline iteration with rationale per candidate.',                             date: 'Nov 15, 2025' },
        { name: 'Test Reader',       desc: 'Reviews drafts in-character as a target persona would.',                                    date: 'Nov 10, 2025' },
        { name: 'Tone Adapter',      desc: 'Re-tones a draft for different audiences without losing meaning.',                          date: 'Nov 05, 2025' },
        { name: 'Tone Calibrator',   desc: 'Drift-checks copy against the brand\'s defined voice profile.',                             date: 'Oct 31, 2025' },
        { name: 'Treatment Writer',  desc: 'Director treatments for film pitch decks.',                                                 date: 'Oct 26, 2025' },
        { name: 'Trend Forecast',    desc: 'Twelve-month outlook for category-relevant trends + signals.',                              date: 'Oct 21, 2025' },
        { name: 'UTM Builder',       desc: 'Tagging schemes for campaign tracking across paid channels.',                               date: 'Oct 16, 2025' },
        { name: 'Variant Lab',       desc: 'Generates 12+ creative variants of an ad given the brief.',                                 date: 'Oct 11, 2025' },
        { name: 'Versionist',        desc: 'Splits master assets into per-channel cuts and crops.',                                     date: 'Oct 06, 2025' },
        { name: 'Visual Director',   desc: 'Art-direction guidance: palette, type, photography, motion.',                               date: 'Oct 01, 2025' },
        { name: 'Visual Tester',     desc: 'Reviews visual deliverables against brand visual spec.',                                    date: 'Sep 26, 2025' },
        { name: 'Voice Caster',      desc: 'Voice talent recommendations for voice-over briefs.',                                       date: 'Sep 21, 2025' },
      ];

      const PAGE_SIZE = 8;
      let currentPage = 1;
      let query = '';
      const selected = new Set();
      /* Sidebar scope — "all" = My Agents, "included" = currently
         selected, "excluded" = unselected. Fake-filter logic that
         picks up the right item set from the `selected` Set. */
      let scope = 'all';

      function filtered() {
        let list;
        if (scope === 'included')      list = AGENTS.filter(a => selected.has(a.name));
        else if (scope === 'excluded') list = AGENTS.filter(a => !selected.has(a.name));
        else                            list = AGENTS;
        if (!query) return list;
        const q = query.toLowerCase();
        return list.filter(a =>
          a.name.toLowerCase().includes(q) ||
          (a.desc || '').toLowerCase().includes(q)
        );
      }

      function escapeHtml(s) {
        return String(s)
          .replace(/&/g, '&amp;').replace(/</g, '&lt;')
          .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
      }

      /* Update the rail-tool tooltip with "X of Y" counts. Called on
         init + after every selection change so the hover hint is
         always in sync with what's been picked in this modal. */
      const tipEl = document.getElementById('agentsRailTip');
      function updateTip() {
        if (!tipEl) return;
        const x = tipEl.querySelector('[data-tip-x]');
        const y = tipEl.querySelector('[data-tip-y]');
        if (x) x.textContent = String(selected.size);
        if (y) y.textContent = String(AGENTS.length);
      }
      updateTip();

      function renderRows() {
        const list = filtered();
        const total = list.length;
        const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
        if (currentPage > totalPages) currentPage = totalPages;

        const start = (currentPage - 1) * PAGE_SIZE;
        const slice = list.slice(start, start + PAGE_SIZE);

        rowsEl.innerHTML = slice.map(a => {
          const isSelected = selected.has(a.name);
          const descCls = a.desc ? '' : ' app-modal-row-desc-empty';
          const descTxt = a.desc ? escapeHtml(a.desc) : '—';
          return '<div class="app-modal-row" data-name="' + escapeHtml(a.name) + '">' +
            '<span class="app-modal-check">' +
              '<input type="checkbox" aria-label="Select ' + escapeHtml(a.name) + '"' + (isSelected ? ' checked' : '') + '>' +
            '</span>' +
            '<span class="app-modal-row-name">' + escapeHtml(a.name) + '</span>' +
            '<span class="app-modal-row-desc' + descCls + '">' + descTxt + '</span>' +
            '<span class="app-modal-row-date">' + escapeHtml(a.date) + '</span>' +
          '</div>';
        }).join('');

        renderPager(totalPages);
      }

      function renderPager(totalPages) {
        if (totalPages <= 1) { pagerEl.innerHTML = ''; return; }
        pagerEl.innerHTML =
          '<button class="app-modal-page-btn" type="button" aria-label="Previous"' + (currentPage === 1 ? ' disabled' : '') + '>' +
            '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>' +
          '</button>' +
          '<span class="app-modal-page-meta">' + currentPage + '/' + totalPages + '</span>' +
          '<button class="app-modal-page-btn" type="button" aria-label="Next"' + (currentPage === totalPages ? ' disabled' : '') + '>' +
            '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>' +
          '</button>';
        const [prev, next] = pagerEl.querySelectorAll('.app-modal-page-btn');
        prev && prev.addEventListener('click', () => {
          if (currentPage > 1) window._appModalSwap(rowsEl, () => { currentPage--; renderRows(); });
        });
        next && next.addEventListener('click', () => {
          if (currentPage < totalPages) window._appModalSwap(rowsEl, () => { currentPage++; renderRows(); });
        });
      }

      function openModal() {
        modal.classList.add('open');
        modal.setAttribute('aria-hidden', 'false');
        triggers.forEach(t => t.classList.add('active'));
        currentPage = 1;
        query = '';
        if (searchInput) searchInput.value = '';
        renderRows();
        setTimeout(() => searchInput && searchInput.focus(), 80);
      }
      function closeModal() {
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden', 'true');
        triggers.forEach(t => t.classList.remove('active'));
      }

      triggers.forEach(t => t.addEventListener('click', (e) => {
        e.preventDefault();
        openModal();
      }));
      closeBtn && closeBtn.addEventListener('click', closeModal);
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
      });
      if (searchInput) {
        searchInput.addEventListener('input', () => {
          query = searchInput.value.trim();
          currentPage = 1;
          renderRows();
        });
      }
      /* Row checkbox toggles + clicking anywhere on the row also
         toggles, mirroring native multi-select list behaviour. */
      rowsEl.addEventListener('click', (e) => {
        const row = e.target.closest('.app-modal-row');
        if (!row) return;
        const name = row.dataset.name;
        if (!name) return;
        const cb = row.querySelector('input[type="checkbox"]');
        if (e.target.tagName !== 'INPUT') {
          cb.checked = !cb.checked;
        }
        if (cb.checked) selected.add(name); else selected.delete(name);
        updateTip();
      });
      /* Sidebar tabs — flip active state, set the scope, then
         swap-fade the row list to its filtered slice. Fake logic
         (filters off the `selected` Set) reads as real selection-
         scoped views. */
      sidebarLis && sidebarLis.forEach(li => {
        li.addEventListener('click', () => {
          const label = (li.querySelector('.app-modal-sidebar-label')?.textContent || '').trim();
          const next = label === 'Excluded' ? 'excluded'
                      : label === 'Included' ? 'included'
                      : 'all';
          if (next === scope && li.classList.contains('active')) return;
          scope = next;
          sidebarLis.forEach(x => {
            x.classList.toggle('active', x === li);
            x.setAttribute('aria-selected', x === li ? 'true' : 'false');
          });
          currentPage = 1;
          if (typeof window._appModalSwap === 'function') {
            window._appModalSwap(rowsEl, renderRows);
          } else {
            renderRows();
          }
        });
      });

      /* Pre-render so the first open is instant. */
      renderRows();
    })();

    /* === Knowledge Bases picker modal — opens from the rail
       Knowledge button. Mirrors the Agents modal architecture
       with knowledge-base-specific data. */
    (function initKnowledgeModal() {
      const modal = document.getElementById('knowledgeModal');
      const closeBtn = document.getElementById('knowledgeModalClose');
      const rowsEl  = document.getElementById('knowledgeModalRows');
      const pagerEl = document.getElementById('knowledgeModalPagination');
      const searchInput = modal && modal.querySelector('.app-modal-search input');
      const sidebarLis  = modal && modal.querySelectorAll('.app-modal-sidebar li');
      const triggers = document.querySelectorAll('.rail-tool-knowledge');
      if (!modal || !rowsEl || !pagerEl || !triggers.length) return;

      const KB = [
        { name: 'OPMG Creds',                   desc: 'Omnicom Precision Marketing', date: 'May 12, 2026' },
        { name: 'OPMG Responses',               desc: 'Omnicom Precision Marketing', date: 'May 10, 2026' },
        { name: 'work in progress',             desc: 'Omnicom Precision Marketing', date: 'May 09, 2026' },
        { name: 'OPMG Brand Guidelines',        desc: 'Omnicom Precision Marketing', date: 'May 05, 2026' },
        { name: 'OPMG Case Studies — Auto',     desc: 'Omnicom Precision Marketing', date: 'May 02, 2026' },
        { name: 'OPMG Case Studies — CPG',      desc: 'Omnicom Precision Marketing', date: 'Apr 29, 2026' },
        { name: 'OPMG Case Studies — Finance',  desc: 'Omnicom Precision Marketing', date: 'Apr 26, 2026' },
        { name: 'OPMG Case Studies — Gaming',   desc: 'Omnicom Precision Marketing', date: 'Apr 23, 2026' },
        { name: 'OPMG Case Studies — Healthcare', desc: 'Omnicom Precision Marketing', date: 'Apr 20, 2026' },
        { name: 'OPMG Case Studies — Hospitality', desc: 'Omnicom Precision Marketing', date: 'Apr 17, 2026' },
        { name: 'OPMG Case Studies — Retail',   desc: 'Omnicom Precision Marketing', date: 'Apr 14, 2026' },
        { name: 'OPMG Case Studies — Tech',     desc: 'Omnicom Precision Marketing', date: 'Apr 11, 2026' },
        { name: 'OPMG Channel Plays — Display', desc: 'Omnicom Precision Marketing', date: 'Apr 08, 2026' },
        { name: 'OPMG Channel Plays — Email',   desc: 'Omnicom Precision Marketing', date: 'Apr 05, 2026' },
        { name: 'OPMG Channel Plays — OOH',     desc: 'Omnicom Precision Marketing', date: 'Apr 02, 2026' },
        { name: 'OPMG Channel Plays — Paid Social', desc: 'Omnicom Precision Marketing', date: 'Mar 30, 2026' },
        { name: 'OPMG Channel Plays — Programmatic', desc: 'Omnicom Precision Marketing', date: 'Mar 27, 2026' },
        { name: 'OPMG Channel Plays — Search',  desc: 'Omnicom Precision Marketing', date: 'Mar 24, 2026' },
        { name: 'OPMG Channel Plays — Video',   desc: 'Omnicom Precision Marketing', date: 'Mar 21, 2026' },
        { name: 'OPMG Creative Strategy 2026',  desc: 'Omnicom Precision Marketing', date: 'Mar 18, 2026' },
        { name: 'OPMG Data Stack Reference',    desc: 'Omnicom Precision Marketing', date: 'Mar 15, 2026' },
        { name: 'OPMG Decks — 2024 Library',    desc: 'Omnicom Precision Marketing', date: 'Mar 12, 2026' },
        { name: 'OPMG Decks — 2025 Library',    desc: 'Omnicom Precision Marketing', date: 'Mar 09, 2026' },
        { name: 'OPMG First Party Data',        desc: 'Omnicom Precision Marketing', date: 'Mar 06, 2026' },
        { name: 'OPMG Industry Reports',        desc: 'Omnicom Precision Marketing', date: 'Mar 03, 2026' },
        { name: 'OPMG Insight Library',         desc: 'Omnicom Precision Marketing', date: 'Feb 28, 2026' },
        { name: 'OPMG Internal Glossary',       desc: 'Omnicom Precision Marketing', date: 'Feb 25, 2026' },
        { name: 'OPMG Naming Conventions',      desc: 'Omnicom Precision Marketing', date: 'Feb 22, 2026' },
        { name: 'OPMG Personas Library',        desc: 'Omnicom Precision Marketing', date: 'Feb 19, 2026' },
        { name: 'OPMG Process Library',         desc: 'Omnicom Precision Marketing', date: 'Feb 16, 2026' },
        { name: 'OPMG Production Standards',    desc: 'Omnicom Precision Marketing', date: 'Feb 13, 2026' },
        { name: 'OPMG QBR Templates',           desc: 'Omnicom Precision Marketing', date: 'Feb 10, 2026' },
        { name: 'OPMG RFP Library',             desc: 'Omnicom Precision Marketing', date: 'Feb 07, 2026' },
        { name: 'OPMG Sales Playbook',          desc: 'Omnicom Precision Marketing', date: 'Feb 04, 2026' },
        { name: 'OPMG Strategy Frameworks',     desc: 'Omnicom Precision Marketing', date: 'Feb 01, 2026' },
        { name: 'OPMG Tracking Standards',      desc: 'Omnicom Precision Marketing', date: 'Jan 29, 2026' },
        { name: 'OPMG Training — New Hire',     desc: 'Omnicom Precision Marketing', date: 'Jan 26, 2026' },
        { name: 'OPMG Verticals — Auto',        desc: 'Omnicom Precision Marketing', date: 'Jan 23, 2026' },
        { name: 'OPMG Verticals — CPG',         desc: 'Omnicom Precision Marketing', date: 'Jan 20, 2026' },
        { name: 'OPMG Voice & Tone',            desc: 'Omnicom Precision Marketing', date: 'Jan 17, 2026' },
        { name: 'Acme Brand Bible', desc: 'Acme',            date: 'Jan 14, 2026' },
        { name: 'Acme Press Kit',   desc: 'Acme',            date: 'Jan 11, 2026' },
        { name: 'Acme Visual Library', desc: 'Acme',         date: 'Jan 08, 2026' },
        { name: 'Acme Voice Guide', desc: 'Acme',            date: 'Jan 05, 2026' },
        { name: 'Sample Campaign 2026 Briefs', desc: 'Sample Campaign',            date: 'Jan 02, 2026' },
        { name: 'Sample Campaign Asset Library', desc: 'Sample Campaign',          date: 'Dec 29, 2025' },
        { name: 'Sample Campaign FAQ',         desc: 'Sample Campaign',            date: 'Dec 24, 2025' },
        { name: 'Sample Campaign Legal',       desc: 'Sample Campaign',            date: 'Dec 19, 2025' },
        { name: 'Sample Campaign Past Submissions', desc: 'Sample Campaign',       date: 'Dec 14, 2025' },
        { name: 'Sample Campaign Prize Schedule', desc: 'Sample Campaign',         date: 'Dec 09, 2025' },
        { name: 'Roblox Studio Catalog',        desc: 'Roblox',                      date: 'Dec 04, 2025' },
        { name: 'Roblox UGC Standards',         desc: 'Roblox',                      date: 'Nov 29, 2025' },
        { name: 'Roblox Designer Network',      desc: 'Roblox',                      date: 'Nov 24, 2025' },
        { name: 'Driving Empire Game Manual',   desc: 'Driving Empire',              date: 'Nov 19, 2025' },
        { name: 'Driving Empire Player Personas', desc: 'Driving Empire',            date: 'Nov 14, 2025' },
        { name: 'Driving Empire Press Coverage', desc: 'Driving Empire',             date: 'Nov 09, 2025' },
        { name: 'Omnicom Network Directory',    desc: 'Omnicom Group',               date: 'Nov 04, 2025' },
        { name: 'Omnicom Diversity Standards',  desc: 'Omnicom Group',               date: 'Oct 30, 2025' },
        { name: 'Omnicom Procurement Standards',desc: 'Omnicom Group',               date: 'Oct 25, 2025' },
        { name: 'Omnicom Brand Safety Rules',   desc: 'Omnicom Group',               date: 'Oct 20, 2025' },
        { name: 'Omnicom Privacy Framework',    desc: 'Omnicom Group',               date: 'Oct 15, 2025' },
        { name: 'OMNI+ Platform Glossary',      desc: 'OMNI+',                       date: 'Oct 10, 2025' },
        { name: 'OMNI+ Release Notes',          desc: 'OMNI+',                       date: 'Oct 05, 2025' },
        { name: 'OMNI+ Integration Catalog',    desc: 'OMNI+',                       date: 'Sep 30, 2025' },
      ];

      const PAGE_SIZE = 8;
      let currentPage = 1;
      let query = '';
      const selected = new Set();
      /* Sidebar scope — "all" = My Knowledge Bases, "included" =
         currently selected, "excluded" = unselected. */
      let scope = 'all';

      function filtered() {
        let list;
        if (scope === 'included')      list = KB.filter(k => selected.has(k.name));
        else if (scope === 'excluded') list = KB.filter(k => !selected.has(k.name));
        else                            list = KB;
        if (!query) return list;
        const q = query.toLowerCase();
        return list.filter(k =>
          k.name.toLowerCase().includes(q) ||
          (k.desc || '').toLowerCase().includes(q)
        );
      }

      function escapeHtml(s) {
        return String(s)
          .replace(/&/g, '&amp;').replace(/</g, '&lt;')
          .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
      }

      /* Update the Knowledge rail-tool tooltip with X / Y counts. */
      const tipEl = document.getElementById('knowledgeRailTip');
      function updateTip() {
        if (!tipEl) return;
        const x = tipEl.querySelector('[data-tip-x]');
        const y = tipEl.querySelector('[data-tip-y]');
        if (x) x.textContent = String(selected.size);
        if (y) y.textContent = String(KB.length);
      }
      updateTip();

      function renderRows() {
        const list = filtered();
        const total = list.length;
        const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
        if (currentPage > totalPages) currentPage = totalPages;

        const start = (currentPage - 1) * PAGE_SIZE;
        const slice = list.slice(start, start + PAGE_SIZE);

        rowsEl.innerHTML = slice.map(k => {
          const isSelected = selected.has(k.name);
          const descCls = k.desc ? '' : ' app-modal-row-desc-empty';
          const descTxt = k.desc ? escapeHtml(k.desc) : '—';
          return '<div class="app-modal-row" data-name="' + escapeHtml(k.name) + '">' +
            '<span class="app-modal-check">' +
              '<input type="checkbox" aria-label="Select ' + escapeHtml(k.name) + '"' + (isSelected ? ' checked' : '') + '>' +
            '</span>' +
            '<span class="app-modal-row-name">' + escapeHtml(k.name) + '</span>' +
            '<span class="app-modal-row-desc' + descCls + '">' + descTxt + '</span>' +
            '<span class="app-modal-row-date">' + escapeHtml(k.date) + '</span>' +
          '</div>';
        }).join('');

        renderPager(totalPages);
      }

      function renderPager(totalPages) {
        if (totalPages <= 1) { pagerEl.innerHTML = ''; return; }
        pagerEl.innerHTML =
          '<button class="app-modal-page-btn" type="button" aria-label="Previous"' + (currentPage === 1 ? ' disabled' : '') + '>' +
            '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>' +
          '</button>' +
          '<span class="app-modal-page-meta">' + currentPage + '/' + totalPages + '</span>' +
          '<button class="app-modal-page-btn" type="button" aria-label="Next"' + (currentPage === totalPages ? ' disabled' : '') + '>' +
            '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>' +
          '</button>';
        const [prev, next] = pagerEl.querySelectorAll('.app-modal-page-btn');
        prev && prev.addEventListener('click', () => {
          if (currentPage > 1) window._appModalSwap(rowsEl, () => { currentPage--; renderRows(); });
        });
        next && next.addEventListener('click', () => {
          if (currentPage < totalPages) window._appModalSwap(rowsEl, () => { currentPage++; renderRows(); });
        });
      }

      function openModal() {
        modal.classList.add('open');
        modal.setAttribute('aria-hidden', 'false');
        triggers.forEach(t => t.classList.add('active'));
        currentPage = 1;
        query = '';
        if (searchInput) searchInput.value = '';
        renderRows();
        setTimeout(() => searchInput && searchInput.focus(), 80);
      }
      function closeModal() {
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden', 'true');
        triggers.forEach(t => t.classList.remove('active'));
      }

      triggers.forEach(t => t.addEventListener('click', (e) => {
        e.preventDefault();
        openModal();
      }));
      closeBtn && closeBtn.addEventListener('click', closeModal);
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
      });
      if (searchInput) {
        searchInput.addEventListener('input', () => {
          query = searchInput.value.trim();
          currentPage = 1;
          renderRows();
        });
      }
      rowsEl.addEventListener('click', (e) => {
        const row = e.target.closest('.app-modal-row');
        if (!row) return;
        const name = row.dataset.name;
        if (!name) return;
        const cb = row.querySelector('input[type="checkbox"]');
        if (e.target.tagName !== 'INPUT') {
          cb.checked = !cb.checked;
        }
        if (cb.checked) selected.add(name); else selected.delete(name);
        updateTip();
      });
      /* Sidebar scope swap — fake-filter rows by selection membership. */
      sidebarLis && sidebarLis.forEach(li => {
        li.addEventListener('click', () => {
          const label = (li.querySelector('.app-modal-sidebar-label')?.textContent || '').trim();
          const next = label === 'Excluded' ? 'excluded'
                      : label === 'Included' ? 'included'
                      : 'all';
          if (next === scope && li.classList.contains('active')) return;
          scope = next;
          sidebarLis.forEach(x => {
            x.classList.toggle('active', x === li);
            x.setAttribute('aria-selected', x === li ? 'true' : 'false');
          });
          currentPage = 1;
          if (typeof window._appModalSwap === 'function') {
            window._appModalSwap(rowsEl, renderRows);
          } else {
            renderRows();
          }
        });
      });

      renderRows();
    })();

    /* === Tools picker modal — opens from the rail Tools button.
       Mirrors the Agents / Knowledge modal architecture with a
       tools-specific dataset (workflow integrations + AI services
       the assistant can call). */
    (function initToolsModal() {
      const modal = document.getElementById('toolsModal');
      const closeBtn = document.getElementById('toolsModalClose');
      const rowsEl  = document.getElementById('toolsModalRows');
      const pagerEl = document.getElementById('toolsModalPagination');
      const searchInput = modal && modal.querySelector('.app-modal-search input');
      const sidebarLis  = modal && modal.querySelectorAll('.app-modal-sidebar li');
      const triggers = document.querySelectorAll('.rail-tool-tools');
      if (!modal || !rowsEl || !pagerEl || !triggers.length) return;

      const TOOLS = [
        { name: 'Web Browsing' },
        { name: 'File Export' },
        { name: 'Generate Image' },
        { name: 'Generate Video' },
        { name: 'Generate Audio' },
        { name: 'Generate Music' },
        { name: 'Voice Synthesis' },
        { name: 'Speech to Text' },
        { name: 'Translation' },
        { name: 'Summarize' },
        { name: 'Code Execution' },
        { name: 'Math Solver' },
        { name: 'Image Editing' },
        { name: 'Background Remove' },
        { name: 'Image Upscale' },
        { name: 'Color Picker' },
        { name: 'Font Match' },
        { name: 'Style Transfer' },
        { name: 'Reverse Image Search' },
        { name: 'Text Recognition (OCR)' },
        { name: 'PDF Parser' },
        { name: 'Spreadsheet Tools' },
        { name: 'Slide Composer' },
        { name: 'Brand Guidelines Lookup' },
        { name: 'Asset Library Search' },
        { name: 'Stock Photo Search' },
        { name: 'Stock Video Search' },
        { name: 'Icon Library' },
        { name: 'Color Palette Generator' },
        { name: 'Type Specimen Generator' },
        { name: 'Layout Generator' },
        { name: 'Wireframe Builder' },
        { name: 'Prototype Compiler' },
        { name: 'Animation Composer' },
        { name: 'Motion Capture' },
        { name: 'AR Preview' },
        { name: '3D Renderer' },
        { name: 'Mesh Generator' },
        { name: 'Texture Synthesis' },
        { name: 'Photo Compositor' },
      ];

      const PAGE_SIZE = 8;
      let currentPage = 1;
      let query = '';
      /* Pre-select the tools that ship enabled by default — matches
         the Required Tools mock where Web Browsing + Generate Image
         are checked at first paint. */
      const selected = new Set(['Web Browsing', 'Generate Image']);
      /* Sidebar scope — "all" = My Tools, "included" = enabled,
         "excluded" = disabled. */
      let scope = 'all';

      function filtered() {
        let list;
        if (scope === 'included')      list = TOOLS.filter(t => selected.has(t.name));
        else if (scope === 'excluded') list = TOOLS.filter(t => !selected.has(t.name));
        else                            list = TOOLS;
        if (!query) return list;
        const q = query.toLowerCase();
        return list.filter(t =>
          t.name.toLowerCase().includes(q) ||
          (t.desc || '').toLowerCase().includes(q)
        );
      }

      /* Update the Tools rail-tool tooltip with X / Y counts. */
      const tipEl = document.getElementById('toolsRailTip');
      function updateTip() {
        if (!tipEl) return;
        const x = tipEl.querySelector('[data-tip-x]');
        const y = tipEl.querySelector('[data-tip-y]');
        if (x) x.textContent = String(selected.size);
        if (y) y.textContent = String(TOOLS.length);
      }
      updateTip();

      function escapeHtml(s) {
        return String(s)
          .replace(/&/g, '&amp;').replace(/</g, '&lt;')
          .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
      }

      function renderRows() {
        const list = filtered();
        const total = list.length;
        const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
        if (currentPage > totalPages) currentPage = totalPages;

        const start = (currentPage - 1) * PAGE_SIZE;
        const slice = list.slice(start, start + PAGE_SIZE);

        rowsEl.innerHTML = slice.map(t => {
          const isSelected = selected.has(t.name);
          const descCls = t.desc ? '' : ' app-modal-row-desc-empty';
          const descTxt = t.desc ? escapeHtml(t.desc) : '—';
          return '<div class="app-modal-row" data-name="' + escapeHtml(t.name) + '">' +
            '<span class="app-modal-check">' +
              '<input type="checkbox" aria-label="Select ' + escapeHtml(t.name) + '"' + (isSelected ? ' checked' : '') + '>' +
            '</span>' +
            '<span class="app-modal-row-name">' + escapeHtml(t.name) + '</span>' +
            '<span class="app-modal-row-desc' + descCls + '">' + descTxt + '</span>' +
            '<span class="app-modal-row-date">' + escapeHtml(t.date) + '</span>' +
          '</div>';
        }).join('');

        renderPager(totalPages);
      }

      function renderPager(totalPages) {
        if (totalPages <= 1) { pagerEl.innerHTML = ''; return; }
        pagerEl.innerHTML =
          '<button class="app-modal-page-btn" type="button" aria-label="Previous"' + (currentPage === 1 ? ' disabled' : '') + '>' +
            '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>' +
          '</button>' +
          '<span class="app-modal-page-meta">' + currentPage + '/' + totalPages + '</span>' +
          '<button class="app-modal-page-btn" type="button" aria-label="Next"' + (currentPage === totalPages ? ' disabled' : '') + '>' +
            '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>' +
          '</button>';
        const [prev, next] = pagerEl.querySelectorAll('.app-modal-page-btn');
        prev && prev.addEventListener('click', () => {
          if (currentPage > 1) window._appModalSwap(rowsEl, () => { currentPage--; renderRows(); });
        });
        next && next.addEventListener('click', () => {
          if (currentPage < totalPages) window._appModalSwap(rowsEl, () => { currentPage++; renderRows(); });
        });
      }

      function openModal() {
        modal.classList.add('open');
        modal.setAttribute('aria-hidden', 'false');
        triggers.forEach(t => t.classList.add('active'));
        currentPage = 1;
        query = '';
        if (searchInput) searchInput.value = '';
        renderRows();
        setTimeout(() => searchInput && searchInput.focus(), 80);
      }
      function closeModal() {
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden', 'true');
        triggers.forEach(t => t.classList.remove('active'));
      }

      triggers.forEach(t => t.addEventListener('click', (e) => {
        e.preventDefault();
        openModal();
      }));
      closeBtn && closeBtn.addEventListener('click', closeModal);
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
      });
      if (searchInput) {
        searchInput.addEventListener('input', () => {
          query = searchInput.value.trim();
          currentPage = 1;
          renderRows();
        });
      }
      rowsEl.addEventListener('click', (e) => {
        const row = e.target.closest('.app-modal-row');
        if (!row) return;
        const name = row.dataset.name;
        if (!name) return;
        const cb = row.querySelector('input[type="checkbox"]');
        if (e.target.tagName !== 'INPUT') {
          cb.checked = !cb.checked;
        }
        if (cb.checked) selected.add(name); else selected.delete(name);
        updateTip();
      });
      /* Sidebar scope swap — fake-filter rows by selection membership. */
      sidebarLis && sidebarLis.forEach(li => {
        li.addEventListener('click', () => {
          const label = (li.querySelector('.app-modal-sidebar-label')?.textContent || '').trim();
          const next = label === 'Excluded' ? 'excluded'
                      : label === 'Included' ? 'included'
                      : 'all';
          if (next === scope && li.classList.contains('active')) return;
          scope = next;
          sidebarLis.forEach(x => {
            x.classList.toggle('active', x === li);
            x.setAttribute('aria-selected', x === li ? 'true' : 'false');
          });
          currentPage = 1;
          if (typeof window._appModalSwap === 'function') {
            window._appModalSwap(rowsEl, renderRows);
          } else {
            renderRows();
          }
        });
      });

      renderRows();
    })();

    /* === Shared sidebar tab swap — Agents + Knowledge modals (and
       any future .app-modal-sidebar UI). Single delegated click
       handler keeps it agnostic of which modal is open: it operates
       on the clicked li's parent sidebar, toggling .active and
       aria-selected across siblings. The CSS-hidden dot on each li
       reveals once .active lands, so the blue square moves to the
       clicked item. */
    (function initAppModalSidebarTabs() {
      document.addEventListener('click', (e) => {
        const li = e.target.closest('.app-modal-sidebar li');
        if (!li) return;
        const sidebar = li.parentElement;
        if (!sidebar) return;
        sidebar.querySelectorAll('li').forEach(item => {
          const isActive = item === li;
          item.classList.toggle('active', isActive);
          item.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });
      });
    })();

    /* === Instructions modal — opens from the rail Instructions
       button. Single-input layout: large textarea with an italic
       placeholder describing the field. Persists the entered value
       across opens within the session. */
    (function initInstructionsModal() {
      const modal = document.getElementById('instructionsModal');
      const closeBtn = document.getElementById('instructionsModalClose');
      const input = document.getElementById('instructionsModalInput');
      const gutter = document.getElementById('instructionsModalGutter');
      const triggers = document.querySelectorAll('.rail-tool-instructions');
      if (!modal || !triggers.length) return;

      /* Re-render the gutter to match the textarea's current visual
         line count. Measures via a hidden mirror div with the same
         font / padding / width / line-height as the textarea so
         BOTH logical newlines AND visual word-wraps get counted.
         Splitting by '\n' alone misses wrapped lines and the gutter
         appeared "stuck at 1" while text wrapped invisibly. */
      function updateGutter() {
        if (!gutter || !input) return;
        const cs = getComputedStyle(input);
        const lineHeight = parseFloat(cs.lineHeight) || 22;
        const width = input.clientWidth;
        /* If the textarea isn't laid out yet (modal not opened
           before), bail to 1 row rather than measuring against a
           0-width mirror that would wrap every character. */
        if (width <= 0) {
          gutter.innerHTML = '<span>01</span>';
          return;
        }
        let mirror = input._gutterMirror;
        if (!mirror) {
          mirror = document.createElement('div');
          mirror.style.cssText =
            'position:absolute;visibility:hidden;left:-9999px;top:-9999px;' +
            'white-space:pre-wrap;word-wrap:break-word;overflow-wrap:break-word;' +
            'box-sizing:border-box;';
          document.body.appendChild(mirror);
          input._gutterMirror = mirror;
        }
        mirror.style.font = cs.font;
        mirror.style.letterSpacing = cs.letterSpacing;
        mirror.style.padding = cs.padding;
        mirror.style.border = cs.border;
        mirror.style.lineHeight = cs.lineHeight;
        mirror.style.width = width + 'px';
        /* Trailing newline (or empty value) — append a sentinel so
           the empty final line takes a row of vertical space and
           the gutter doesn't lag behind by one. */
        const text = input.value;
        mirror.textContent = (text === '' || text.endsWith('\n')) ? text + '_' : text;
        const padTop = parseFloat(cs.paddingTop) || 0;
        const padBottom = parseFloat(cs.paddingBottom) || 0;
        const contentHeight = mirror.scrollHeight - padTop - padBottom;
        const lines = Math.max(1, Math.round(contentHeight / lineHeight));
        let html = '';
        for (let i = 1; i <= lines; i++) {
          html += '<span>' + String(i).padStart(2, '0') + '</span>';
        }
        gutter.innerHTML = html;
      }
      function syncScroll() {
        if (!gutter || !input) return;
        gutter.scrollTop = input.scrollTop;
      }
      if (input) {
        input.addEventListener('input', updateGutter);
        input.addEventListener('scroll', syncScroll);
      }
      updateGutter();

      /* === Drag / resize / maximize ===============================
         The card is now position:fixed. On first open, center it in
         the viewport. Header drag moves it; edge / corner handles
         resize it; the maximize button toggles a fullscreen-ish pose
         and remembers the previous geometry so toggling back
         restores the user's last manual size. */
      const card = modal.querySelector('.app-modal-card-instructions');
      const dragHandle = card && card.querySelector('[data-drag-handle]');
      const maxBtn = document.getElementById('instructionsModalMaximize');
      const resizeHandles = card ? card.querySelectorAll('.app-modal-resize') : [];

      function centerCard() {
        if (!card) return;
        const w = card.offsetWidth;
        const h = card.offsetHeight;
        const left = Math.max(16, (window.innerWidth - w) / 2);
        const top = Math.max(16, (window.innerHeight - h) / 2);
        card.style.left = left + 'px';
        card.style.top = top + 'px';
      }

      function clampWithinViewport() {
        if (!card) return;
        const w = card.offsetWidth;
        const h = card.offsetHeight;
        const left = parseFloat(card.style.left) || 0;
        const top = parseFloat(card.style.top) || 0;
        const maxLeft = Math.max(0, window.innerWidth - w);
        const maxTop = Math.max(0, window.innerHeight - h);
        card.style.left = Math.max(0, Math.min(left, maxLeft)) + 'px';
        card.style.top = Math.max(0, Math.min(top, maxTop)) + 'px';
      }

      let dragging = false;
      let dragStart = null;
      if (dragHandle) {
        dragHandle.addEventListener('mousedown', (e) => {
          if (e.target.closest('button')) return;
          if (card.classList.contains('is-maximized')) return;
          dragging = true;
          dragStart = {
            x: e.clientX, y: e.clientY,
            left: parseFloat(card.style.left) || 0,
            top: parseFloat(card.style.top) || 0,
          };
          e.preventDefault();
        });
      }

      let resizing = false;
      let resizeStart = null;
      resizeHandles.forEach(h => {
        h.addEventListener('mousedown', (e) => {
          if (card.classList.contains('is-maximized')) return;
          resizing = true;
          resizeStart = {
            dir: h.dataset.resize,
            x: e.clientX, y: e.clientY,
            left: parseFloat(card.style.left) || 0,
            top: parseFloat(card.style.top) || 0,
            width: card.offsetWidth,
            height: card.offsetHeight,
          };
          e.preventDefault();
          e.stopPropagation();
        });
      });

      document.addEventListener('mousemove', (e) => {
        if (dragging && dragStart) {
          const dx = e.clientX - dragStart.x;
          const dy = e.clientY - dragStart.y;
          card.style.left = (dragStart.left + dx) + 'px';
          card.style.top = (dragStart.top + dy) + 'px';
          return;
        }
        if (resizing && resizeStart) {
          const dx = e.clientX - resizeStart.x;
          const dy = e.clientY - resizeStart.y;
          const minW = 420;
          const minH = 320;
          let newW = resizeStart.width;
          let newH = resizeStart.height;
          let newL = resizeStart.left;
          let newT = resizeStart.top;
          if (resizeStart.dir.includes('e')) newW = Math.max(minW, resizeStart.width + dx);
          if (resizeStart.dir.includes('w')) {
            const w = Math.max(minW, resizeStart.width - dx);
            newL = resizeStart.left + (resizeStart.width - w);
            newW = w;
          }
          if (resizeStart.dir.includes('s')) newH = Math.max(minH, resizeStart.height + dy);
          if (resizeStart.dir.includes('n')) {
            const h = Math.max(minH, resizeStart.height - dy);
            newT = resizeStart.top + (resizeStart.height - h);
            newH = h;
          }
          card.style.width = newW + 'px';
          card.style.height = newH + 'px';
          card.style.left = newL + 'px';
          card.style.top = newT + 'px';
          /* Re-render the gutter as the textarea width changes so
             wrapped-line counts stay in sync. */
          updateGutter();
        }
      });

      document.addEventListener('mouseup', () => {
        if (dragging) { dragging = false; clampWithinViewport(); }
        if (resizing) { resizing = false; clampWithinViewport(); }
      });

      function toggleMaximize() {
        if (!card) return;
        if (card.classList.contains('is-maximized')) {
          card.classList.remove('is-maximized');
          if (card._savedGeom) {
            card.style.left = card._savedGeom.left;
            card.style.top = card._savedGeom.top;
            card.style.width = card._savedGeom.width;
            card.style.height = card._savedGeom.height;
          }
          if (maxBtn) maxBtn.setAttribute('aria-label', 'Maximize');
        } else {
          card._savedGeom = {
            left: card.style.left,
            top: card.style.top,
            width: card.style.width,
            height: card.style.height,
          };
          card.classList.add('is-maximized');
          if (maxBtn) maxBtn.setAttribute('aria-label', 'Restore');
        }
        /* Gutter visual line count depends on width — re-render after
           the dimensions change. */
        requestAnimationFrame(updateGutter);
      }
      if (maxBtn) maxBtn.addEventListener('click', toggleMaximize);

      window.addEventListener('resize', () => {
        if (!card) return;
        if (card.classList.contains('is-maximized')) return;
        clampWithinViewport();
      });

      function openModal() {
        modal.classList.add('open');
        modal.setAttribute('aria-hidden', 'false');
        triggers.forEach(t => t.classList.add('active'));
        /* Center on every open unless the user has explicitly
           positioned it during the current session. */
        if (!card._userPositioned) centerCard();
        updateGutter();
        setTimeout(() => input && input.focus(), 80);
      }
      function closeModal() {
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden', 'true');
        triggers.forEach(t => t.classList.remove('active'));
      }
      /* Mark the card as user-positioned after any manual interaction
         so we don't re-center on subsequent opens. */
      if (dragHandle) {
        dragHandle.addEventListener('mousedown', (e) => {
          if (e.target.closest('button')) return;
          if (card) card._userPositioned = true;
        });
      }
      resizeHandles.forEach(h => {
        h.addEventListener('mousedown', () => { if (card) card._userPositioned = true; });
      });

      triggers.forEach(t => t.addEventListener('click', (e) => {
        e.preventDefault();
        openModal();
      }));
      closeBtn && closeBtn.addEventListener('click', closeModal);
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
      });
    })();
    document.addEventListener('click', (e) => {
      if (e.target.closest('.gco-menu') || e.target.closest('.gco-action-more')) return;
      closeAllMenus();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeAllMenus();
    });
    /* Any scroll / resize invalidates the cached menu coords, so just
       close. Cheaper and less jarring than re-positioning. */
    window.addEventListener('resize', closeAllMenus);
    window.addEventListener('scroll', closeAllMenus, true);

    // First paint = images.
    renderGrid('images');

    /* Premium swap — fade the grid out (opacity + subtle scale-down),
       perform the action while it's invisible, then fade back in. For
       content swaps (Images/Videos) the new cards re-cascade via the
       IntersectionObserver, layering a second wave of motion on top. */
    let swapping = false;
    function smoothSwap(action, dur) {
      if (swapping) return;
      dur = dur || 200;
      swapping = true;
      closeAllMenus();
      grid.classList.add('graphics-grid-swapping');
      setTimeout(() => {
        action();
        requestAnimationFrame(() => {
          grid.classList.remove('graphics-grid-swapping');
          setTimeout(() => { swapping = false; }, dur);
        });
      }, dur);
    }

    /* Sort pills (Top Day / Likes) — visual state only for now. */
    function wireToolbarGroup(selector, onSelect) {
      const pills = document.querySelectorAll(selector);
      pills.forEach(pill => {
        pill.addEventListener('click', (e) => {
          e.stopPropagation();
          pills.forEach(p => p.classList.remove('active'));
          pill.classList.add('active');
          if (typeof onSelect === 'function') onSelect(pill);
        });
      });
    }
    /* Content-type filter pills — fade out, re-render with the matching
       photo set + class (cards in Videos mode show the play badge),
       fade back in. Cards then cascade via IntersectionObserver. */
    wireToolbarGroup('.graphics-filter-pill', (pill) => {
      smoothSwap(() => {
        renderGrid(pill.dataset.filter);
      });
    });

    /* View-mode toggles — fade out, flip data-view on the grid (CSS
       handles layout swap: mosaic / grid / list), fade back in. */
    const viewBtns = document.querySelectorAll('.graphics-view-btn');
    viewBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        viewBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        smoothSwap(() => {
          grid.dataset.view = btn.dataset.view;
        });
      });
    });
  })();

  /* === canvas_4 — Creative Assets multi-section view ===
     Renders Media (social/display ad mockups) / Images / Video / Audio
     sections from inline data arrays. Lightweight by design — no
     shared state with canvas_3's gallery JS so canvas_3 stays frozen
     while canvas_4 evolves. Images + Video sections reuse the
     canvas_3 .graphics-card markup so their visual treatment is
     identical (mosaic / dense grid / list views all work). */
  (function initCanvas4Sections() {
    const view = document.getElementById('canvas4View');
    if (!view) return;

    function escapeHTML(s) {
      return String(s).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
      });
    }

    /* Shared 3-dot menu HTML baked into every Social Media + Display
       card's foot lockup. The button toggles the panel; menu items
       dispatch by data-action via a delegated click handler at the
       bottom of this IIFE. Edit is the only wired action so far;
       Duplicate / Download / Copy link / Delete are placeholders. */
    /* Render the 3-dot card menu. `infoHtml` is optional; when
       present it's tucked into a non-interactive header row at the
       top of the dropdown so the card foot can stay minimal (just
       number + name) while the platform / dims / ratio details move
       inside the menu as "more information". */
    function cardMenuHTML(infoHtml) {
      const infoBlock = infoHtml ?
        '<div class="c4-unit-menu-info">' + infoHtml + '</div>' +
        '<div class="c4-unit-menu-divider" aria-hidden="true"></div>' : '';
      return '<div class="c4-ad-unit-menu">' +
        '<button class="c4-unit-menu-btn" type="button" aria-label="Card options" aria-haspopup="menu" aria-expanded="false">' +
          '<svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">' +
            '<circle cx="8" cy="3.5" r="1.3" fill="currentColor"/>' +
            '<circle cx="8" cy="8" r="1.3" fill="currentColor"/>' +
            '<circle cx="8" cy="12.5" r="1.3" fill="currentColor"/>' +
          '</svg>' +
        '</button>' +
        '<div class="c4-unit-menu-panel" role="menu" aria-hidden="true">' +
          infoBlock +
          '<button class="c4-unit-menu-item" type="button" role="menuitem" data-action="edit">' +
            '<span class="tmi-icon"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 2l3 3-8 8H3v-3z"/></svg></span>' +
            '<span class="tmi-label">Edit text</span>' +
            '<span class="tmi-shortcut">⌘E</span>' +
          '</button>' +
          '<button class="c4-unit-menu-item" type="button" role="menuitem" data-action="duplicate">' +
            '<span class="tmi-icon"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="5" width="9" height="9" rx="1.5"/><path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2H3.5A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5"/></svg></span>' +
            '<span class="tmi-label">Duplicate</span>' +
            '<span class="tmi-shortcut">⌘D</span>' +
          '</button>' +
          '<button class="c4-unit-menu-item" type="button" role="menuitem" data-action="download">' +
            '<span class="tmi-icon"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v9M4 7l4 4 4-4M3 14h10"/></svg></span>' +
            '<span class="tmi-label">Download</span>' +
            '<span class="tmi-shortcut">⌘⇧D</span>' +
          '</button>' +
          '<button class="c4-unit-menu-item" type="button" role="menuitem" data-action="copy-link">' +
            '<span class="tmi-icon"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 10l4-4M9.5 4.5l1.5-1.5a2.5 2.5 0 1 1 3.5 3.5L13 8M7 11.5L5.5 13a2.5 2.5 0 1 1-3.5-3.5L3.5 8"/></svg></span>' +
            '<span class="tmi-label">Copy link</span>' +
            '<span class="tmi-shortcut">⌘⇧L</span>' +
          '</button>' +
          '<div class="c4-unit-menu-divider" aria-hidden="true"></div>' +
          '<button class="c4-unit-menu-item c4-unit-menu-item--muted" type="button" role="menuitem" data-action="delete">' +
            '<span class="tmi-icon"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 5h10M6 5V3.5A1.5 1.5 0 0 1 7.5 2h1A1.5 1.5 0 0 1 10 3.5V5M4.5 5l.5 8.5A1 1 0 0 0 6 14.5h4a1 1 0 0 0 1-.93L11.5 5"/></svg></span>' +
            '<span class="tmi-label">Delete</span>' +
          '</button>' +
        '</div>' +
      '</div>';
    }

    /* --- Media (35 social + display ad units) ------------------
       Pulled from the Canvas Enhancements Figma social media library
       (node 2397:15017): 13 Meta + 7 Reddit + 9 LinkedIn units, plus
       6 Instagram units added per Bryan's request (the IG group was
       missing from the Figma board). Each entry carries its platform,
       type, aspect ratio, native dimensions, display name, and an
       Unsplash creative ID cycled from a small automotive/lifestyle
       pool that fits the Acme / Roblox Racing context. */
    const adImagePool = [
      '1502920917128-1aa500764cbd', // sunrise drone
      '1469854523086-cc02fe5d8800', // mountain road
      '1485291571150-772bcfc10da5', // car interior
      '1493238792000-8113da705763', // urban driving
      '1494976388531-d1058494cdd8', // open road
      '1542362567-b07e54358753',    // city evening
      '1503376780353-7e6692767b70', // road trip
      '1583121274602-3e2820c69888', // car closeup
      '1492144534655-ae79c964c9d7', // city street
      '1469474968028-56623f02e42e', // surfer
      '1551836022-deb4988cc6c0',    // car key
      '1502685104226-ee32379fefbe', // editorial
    ];
    function adImg(i, ratio) {
      const id = adImagePool[i % adImagePool.length];
      const ar = ratio.split(':').map(Number);
      const w = 600;
      const h = Math.round(w * (ar[1] / ar[0]));
      return 'https://images.unsplash.com/photo-' + id +
        '?w=' + w + '&h=' + h + '&q=75&auto=format&fit=crop&fm=webp&cs=tinysrgb';
    }
    /* Type-glyph SVG used in the top-right corner of non-image cards
       so the format reads at a glance. */
    const TYPE_GLYPH = {
      video: '<svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><polygon points="3,2 3,10 10,6"/></svg>',
      reel:  '<svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><polygon points="3,2 3,10 10,6"/></svg>',
      carousel: '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="3.5" y="2.5" width="6" height="7" rx="0.8"/><line x1="1" y1="4" x2="1" y2="8"/><line x1="11" y1="4" x2="11" y2="8"/></svg>',
      story: '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="6" cy="6" r="4.5"/></svg>',
      event: '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.2"><rect x="1.5" y="2.5" width="9" height="8" rx="1"/><line x1="3.5" y1="1" x2="3.5" y2="4"/><line x1="8.5" y1="1" x2="8.5" y2="4"/><line x1="1.5" y1="5" x2="10.5" y2="5"/></svg>',
      document: '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M3 1.5h4l2 2V10.5H3z"/><line x1="4.5" y1="5.5" x2="7.5" y2="5.5"/><line x1="4.5" y1="7.5" x2="7.5" y2="7.5"/></svg>',
      conversation: '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M1.5 3.5C1.5 2.7 2.2 2 3 2h6c0.8 0 1.5 0.7 1.5 1.5v4c0 0.8-0.7 1.5-1.5 1.5H5l-2.5 2v-2H3c-0.8 0-1.5-0.7-1.5-1.5z"/></svg>',
      'thought-lead': '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M6 1.5v0.8M2 6h0.8M9.2 6h0.8M3.2 3.2l0.6 0.6M8.8 3.2l-0.6 0.6"/><circle cx="6" cy="6.5" r="2.5"/><line x1="5" y1="10.5" x2="7" y2="10.5"/></svg>',
      branded: '<svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><path d="M6 1.5l1.5 3 3.3 0.4-2.4 2.3 0.6 3.3L6 9 3 10.5l0.6-3.3-2.4-2.3 3.3-0.4z"/></svg>',
      collection: '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.2"><rect x="1.5" y="1.5" width="4" height="4"/><rect x="6.5" y="1.5" width="4" height="4"/><rect x="1.5" y="6.5" width="4" height="4"/><rect x="6.5" y="6.5" width="4" height="4"/></svg>',
      instant: '<svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><polygon points="6,1 4,7 6,7 5,11 9,5 7,5 8,1"/></svg>',
      'lead-gen': '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M2 2h8v6H7l-2 2v-2H2z"/><line x1="4" y1="4.5" x2="8" y2="4.5"/><line x1="4" y1="6" x2="6.5" y2="6"/></svg>',
      'slideshow': '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.2"><rect x="1.5" y="2.5" width="7" height="5" rx="0.6"/><rect x="3.5" y="4.5" width="7" height="5" rx="0.6"/></svg>',
      'shopping': '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M2.5 4h7l-0.8 6h-5.4z"/><path d="M4.5 4V3a1.5 1.5 0 0 1 3 0v1"/></svg>',
      'explore': '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.2"><circle cx="6" cy="6" r="4"/><path d="M6 3.5l1.2 1L8 6l-1 1.2L6 8.5 5 7.2 4 6l0.8-1.5z" fill="currentColor" stroke="none"/></svg>',
      'spotlight': '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.2"><circle cx="6" cy="4" r="1.8"/><path d="M2 10.5c0-2 2-3.5 4-3.5s4 1.5 4 3.5"/></svg>',
      'follower': '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.2"><circle cx="5" cy="4" r="1.6"/><path d="M2 10c0-1.7 1.5-3 3-3s3 1.3 3 3"/><line x1="9.5" y1="3" x2="9.5" y2="6"/><line x1="8" y1="4.5" x2="11" y2="4.5"/></svg>',
      'free-form': '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.2"><rect x="2" y="2" width="8" height="8" rx="0.8"/><line x1="3.5" y1="4.5" x2="8.5" y2="4.5"/><line x1="3.5" y1="6.5" x2="7.5" y2="6.5"/><line x1="3.5" y1="8.5" x2="8.5" y2="8.5"/></svg>',
    };
    const PLATFORM_LABEL = { meta: 'Meta', instagram: 'Instagram', linkedin: 'LinkedIn', reddit: 'Reddit' };
    const adUnits = [
      // === Meta (13) ===
      { platform: 'meta',      type: 'image',        ratio: '1.91:1', name: 'FB Post / Landscape',    dims: '1200×628'  },
      { platform: 'meta',      type: 'image',        ratio: '1:1',    name: 'FB Post / Square',       dims: '1080×1080' },
      { platform: 'meta',      type: 'image',        ratio: '4:5',    name: 'FB Post / Portrait',     dims: '1080×1350' },
      { platform: 'meta',      type: 'branded',      ratio: '1:1',    name: 'Meta / Branded Content', dims: '1080×1080' },
      { platform: 'meta',      type: 'carousel',     ratio: '1:1',    name: 'Meta / Carousel',        dims: '1080×1080' },
      { platform: 'meta',      type: 'collection',   ratio: '1:1',    name: 'Meta / Collection',      dims: '1080×1080' },
      { platform: 'meta',      type: 'event',        ratio: '1.91:1', name: 'Meta / Event',           dims: '1200×628'  },
      { platform: 'meta',      type: 'instant',      ratio: '1:1',    name: 'Meta / Instant',         dims: '1080×1080' },
      { platform: 'meta',      type: 'lead-gen',     ratio: '1:1',    name: 'Meta / Lead Gen',        dims: '1080×1080' },
      { platform: 'meta',      type: 'reel',         ratio: '9:16',   name: 'Meta / Reels',           dims: '1080×1920' },
      { platform: 'meta',      type: 'story',        ratio: '9:16',   name: 'Meta / Story (Standard)',dims: '1080×1920' },
      { platform: 'meta',      type: 'video',        ratio: '1:1',    name: 'Meta / Video',           dims: '1080×1080' },
      { platform: 'meta',      type: 'story',        ratio: '9:16',   name: 'Meta / Story (Light)',   dims: '1080×1920' },
      { platform: 'meta',      type: 'slideshow',    ratio: '1:1',    name: 'Meta / Slideshow',       dims: '1080×1080' },
      // === Instagram (9 — added per Bryan's note that IG was missing; Explore/Collection/Shopping added in the platform audit) ===
      { platform: 'instagram', type: 'image',        ratio: '1:1',    name: 'IG Feed / Square',       dims: '1080×1080' },
      { platform: 'instagram', type: 'image',        ratio: '4:5',    name: 'IG Feed / Portrait',     dims: '1080×1350' },
      { platform: 'instagram', type: 'image',        ratio: '1.91:1', name: 'IG Feed / Landscape',    dims: '1200×628'  },
      { platform: 'instagram', type: 'story',        ratio: '9:16',   name: 'IG / Story',             dims: '1080×1920' },
      { platform: 'instagram', type: 'reel',         ratio: '9:16',   name: 'IG / Reels',             dims: '1080×1920' },
      { platform: 'instagram', type: 'carousel',     ratio: '1:1',    name: 'IG / Carousel',          dims: '1080×1080' },
      { platform: 'instagram', type: 'explore',      ratio: '1:1',    name: 'IG / Explore',           dims: '1080×1080' },
      { platform: 'instagram', type: 'collection',   ratio: '1:1',    name: 'IG / Collection',        dims: '1080×1080' },
      { platform: 'instagram', type: 'shopping',     ratio: '1:1',    name: 'IG / Shopping',          dims: '1080×1080' },
      // === Reddit (8) ===
      { platform: 'reddit',    type: 'image',        ratio: '1.91:1', name: 'Reddit / Landscape',     dims: '1200×628'  },
      { platform: 'reddit',    type: 'image',        ratio: '1:1',    name: 'Reddit / Square',        dims: '1080×1080' },
      { platform: 'reddit',    type: 'image',        ratio: '4:5',    name: 'Reddit / Portrait',      dims: '1080×1350' },
      { platform: 'reddit',    type: 'carousel',     ratio: '1:1',    name: 'Reddit / Carousel',      dims: '1080×1080' },
      { platform: 'reddit',    type: 'conversation', ratio: '1.91:1', name: 'Reddit / Conversation',  dims: '1200×628'  },
      { platform: 'reddit',    type: 'video',        ratio: '9:16',   name: 'Reddit / Vertical Video',dims: '1080×1920' },
      { platform: 'reddit',    type: 'video',        ratio: '1:1',    name: 'Reddit / Video',         dims: '1080×1080' },
      { platform: 'reddit',    type: 'free-form',    ratio: '1.91:1', name: 'Reddit / Free Form',     dims: '1200×628'  },
      // === LinkedIn (12) ===
      { platform: 'linkedin',  type: 'image',        ratio: '1.91:1', name: 'LinkedIn / Landscape',   dims: '1200×628'  },
      { platform: 'linkedin',  type: 'image',        ratio: '1:1',    name: 'LinkedIn / Square',      dims: '1080×1080' },
      { platform: 'linkedin',  type: 'image',        ratio: '4:5',    name: 'LinkedIn / Portrait',    dims: '1080×1350' },
      { platform: 'linkedin',  type: 'carousel',     ratio: '1:1',    name: 'LinkedIn / Carousel',    dims: '1080×1080' },
      { platform: 'linkedin',  type: 'document',     ratio: '1:1',    name: 'LinkedIn / Document',    dims: '1080×1080' },
      { platform: 'linkedin',  type: 'event',        ratio: '1.91:1', name: 'LinkedIn / Event',       dims: '1200×628'  },
      { platform: 'linkedin',  type: 'thought-lead', ratio: '1:1',    name: 'LinkedIn / Thought Lead',dims: '1080×1080' },
      { platform: 'linkedin',  type: 'video',        ratio: '1:1',    name: 'LinkedIn / Video',       dims: '1080×1080' },
      { platform: 'linkedin',  type: 'video',        ratio: '9:16',   name: 'LinkedIn / Video 9:16',  dims: '1080×1920' },
      { platform: 'linkedin',  type: 'conversation', ratio: '1.91:1', name: 'LinkedIn / Conversation',dims: '1200×628'  },
      { platform: 'linkedin',  type: 'spotlight',    ratio: '1:1',    name: 'LinkedIn / Spotlight',   dims: '1080×1080' },
      { platform: 'linkedin',  type: 'follower',     ratio: '1:1',    name: 'LinkedIn / Follower',    dims: '1080×1080' },

      // ====== Basic / organic post types (non-sponsored) ======
      // These are the foundational post formats every platform
      // supports outside the ad ecosystem. Same rail, separate
      // chrome — no "Sponsored / Promoted" labels.

      // === Meta basic post types (4) ===
      { platform: 'meta',      type: 'text',         ratio: '1.91:1', name: 'FB Post / Text Only',    dims: 'Text post'  },
      { platform: 'meta',      type: 'link',         ratio: '1.91:1', name: 'FB Post / Link Share',   dims: '1200×628'   },
      { platform: 'meta',      type: 'live',         ratio: '16:9',   name: 'FB Live',                dims: '1920×1080'  },
      { platform: 'meta',      type: 'album',        ratio: '1:1',    name: 'FB Photo Album',         dims: '1080×1080'  },

      // === Instagram basic post types (2) ===
      { platform: 'instagram', type: 'live',         ratio: '9:16',   name: 'IG Live',                dims: '1080×1920'  },
      { platform: 'instagram', type: 'video',        ratio: '1:1',    name: 'IG Feed / Video',        dims: '1080×1080'  },

      // === LinkedIn basic post types (5) ===
      { platform: 'linkedin',  type: 'text',         ratio: '1.91:1', name: 'LinkedIn / Text Post',   dims: 'Text post'  },
      { platform: 'linkedin',  type: 'poll',         ratio: '1.91:1', name: 'LinkedIn / Poll',        dims: 'Poll post'  },
      { platform: 'linkedin',  type: 'article',      ratio: '1.91:1', name: 'LinkedIn / Article',     dims: '1200×628'   },
      { platform: 'linkedin',  type: 'newsletter',   ratio: '1.91:1', name: 'LinkedIn / Newsletter',  dims: 'Newsletter' },
      { platform: 'linkedin',  type: 'celebrate',    ratio: '1:1',    name: 'LinkedIn / Celebrate',   dims: '1080×1080'  },

      // === Reddit basic post types (4) ===
      { platform: 'reddit',    type: 'text',         ratio: '1.91:1', name: 'Reddit / Text Post',     dims: 'Text post'  },
      { platform: 'reddit',    type: 'link',         ratio: '1.91:1', name: 'Reddit / Link Post',     dims: 'Link post'  },
      { platform: 'reddit',    type: 'poll',         ratio: '1.91:1', name: 'Reddit / Poll',          dims: 'Poll post'  },
      { platform: 'reddit',    type: 'gallery',      ratio: '1:1',    name: 'Reddit / Gallery',       dims: '1080×1080'  },
    ];

    /* --- Images / Video — canvas_3-style cards ------------------ */

    /* Curated photo IDs — duplicated from canvas_3's verified pool of
       30, then tripled with index variance so the same Unsplash photo
       doesn't show next to itself. ~50 cards total fills the section
       properly without the masonry feeling sparse. */
    const photosBase = [
      // portraits / people
      '1494790108377-be9c29b29330',
      '1500648767791-00dcc994a43e',
      '1438761681033-6461ffad8d80',
      '1507003211169-0a1dd7228f2d',
      '1573497019418-b400bb3ab074',
      '1488161628813-04466f872be2',
      '1568602471122-7832951cc4c5',
      '1531746020798-e6953c6e8e04',
      // nature / landscape
      '1506905925346-21bda4d32df4',
      '1469474968028-56623f02e42e',
      '1518173946687-a4c8892bbd9f',
      '1470770841072-f978cf4d019e',
      '1473773508845-188df298d2d1',
      '1501785888041-af3ef285b470',
      // abstract / art
      '1557672172-298e090bd0f1',
      '1541961017774-22349e4a1262',
      '1502082553048-f009c37129b9',
      '1545239351-1141bd47b8f5',
      // animals
      '1574144611937-0df059b5ef3e',
      '1518791841217-8f162f1e1131',
      // architecture
      '1481026469463-66327c86e544',
      '1486325212027-8081e485255e',
      '1497366216548-37526070297c',
      // tech / AI
      '1518770660439-4636190af475',
      '1581090464777-f3220bbe1b8b',
      '1535303311164-664fc9ec6532',
      '1542751371-adc38448a05e',
      // food
      '1490645935967-10de6ba17061',
      '1546069901-ba9599a7e63c',
      // fashion / lifestyle
      '1490481651871-ab68de25d43d',
    ];
    /* Tile-shuffle: photosBase shuffled with two different seeds and
       concatenated so the full set is ~60 cards but adjacent cards
       are never the same image. */
    function shuffleSeeded(arr, seed) {
      const out = arr.slice();
      let s = seed | 0;
      const rnd = () => { s = (s * 9301 + 49297) | 0; return ((s % 233280) + 233280) % 233280 / 233280; };
      for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(rnd() * (i + 1));
        const tmp = out[i]; out[i] = out[j]; out[j] = tmp;
      }
      return out;
    }
    /* Quadrupled — four seeded shuffles concatenated so the base
       set fans out across many pages. */
    const photos = shuffleSeeded(photosBase, 1429)
      .concat(shuffleSeeded(photosBase, 7919))
      .concat(shuffleSeeded(photosBase, 3833))
      .concat(shuffleSeeded(photosBase, 6311));
    const aspects = [
      [420, 560], [420, 315], [420, 420], [420, 630], [420, 280],
    ];

    /* Videos — 29 OpenAI Sora landing-page samples, transcoded down
       to ~540p H.264 and served from /videos in the deployment. Same
       filenames + native dimensions used in canvas_3, so the cards
       reserve the right aspect-ratio box before metadata loads. The
       mix intentionally spans 16:9, 9:16, and 1:1 for visual variety
       in the mosaic. */
    const videoSourcesBase = [
      { src: 'videos/monster-with-melting-candle.mp4', w: 1920, h: 1088 },
      { src: 'videos/victoria-crowned-pigeon.mp4',     w:  720, h: 1280 },
      { src: 'videos/origami-undersea.mp4',            w: 1920, h: 1080 },
      { src: 'videos/octopus-and-crab.mp4',            w:  512, h:  512 },
      { src: 'videos/big-sur.mp4',                     w: 1920, h: 1088 },
      { src: 'videos/chameleon.mp4',                   w:  720, h: 1280 },
      { src: 'videos/santorini.mp4',                   w: 1920, h: 1080 },
      { src: 'videos/happy-cat.mp4',                   w:  720, h:  720 },
      { src: 'videos/ships-in-coffee.mp4',             w: 1920, h: 1080 },
      { src: 'videos/mitten-astronaut.mp4',            w: 1920, h: 1080 },
      { src: 'videos/closeup-of-womans-eye.mp4',       w: 1920, h: 1080 },
      { src: 'videos/big-eyed-fluff-ball.mp4',         w: 1920, h: 1088 },
      { src: 'videos/petri-dish-pandas.mp4',           w: 1280, h:  720 },
      { src: 'videos/flower-blooming.mp4',             w: 1280, h:  720 },
      { src: 'videos/stack-of-tvs.mp4',                w: 1280, h:  720 },
      { src: 'videos/cat-on-bed.mp4',                  w: 1920, h: 1088 },
      { src: 'videos/amalfi-coast.mp4',                w: 1280, h:  720 },
      { src: 'videos/photoreal-train.mp4',             w: 1920, h: 1080 },
      { src: 'videos/art-museum.mp4',                  w: 1280, h:  720 },
      { src: 'videos/dancing-kangaroo.mp4',            w: 1280, h:  720 },
      { src: 'videos/gold-rush.mp4',                   w: 1280, h:  720 },
      { src: 'videos/zen-garden-gnome.mp4',            w: 1280, h:  720 },
      { src: 'videos/birds-over-river.mp4',            w: 1920, h: 1088 },
      { src: 'videos/lagos.mp4',                       w: 1280, h:  720 },
      { src: 'videos/cloud-man.mp4',                   w: 1920, h: 1080 },
      { src: 'videos/tiny-construction.mp4',           w: 1920, h: 1080 },
      { src: 'videos/wooly-mammoth.mp4',               w: 1920, h: 1080 },
      { src: 'videos/paper-airplanes.mp4',             w: 1280, h:  720 },
      { src: 'videos/dogs-downtown.mp4',               w: 1920, h: 1080 },
    ];
    /* Quadrupled — four seeded shuffles concatenated so the 29
       sources produce ~116 cards across deeper pagination. */
    const videoSources = shuffleSeeded(videoSourcesBase, 5471)
      .concat(shuffleSeeded(videoSourcesBase, 9133))
      .concat(shuffleSeeded(videoSourcesBase, 2207))
      .concat(shuffleSeeded(videoSourcesBase, 8053));

    const prompts = [
      'Editorial portrait of a young subject caught in golden-hour sunlight, soft film grain, shot on Kodak Portra 400.',
      'Cinematic establishing shot of a forgotten lighthouse perched on a black-basalt cliff above a churning storm-grey sea. The light is heavy and overcast with a single warm shaft breaking through the clouds and catching the lantern room glass. Foreground shows wind-bent sea grass; midground a narrow gravel path winding up the cliff face. Slate-grey tonal palette overall with a small accent of warm amber at the lamp. Shot on 65mm anamorphic, 4K, color graded with a subtle teal lift in shadows and warm rolloff in highlights. Mood is reverent and slightly melancholy.',
      'A cheetah mid-stride across a savanna, motion-blur tail, late afternoon golden light.',
      'Brutalist concrete building wrapped in living vines, low-angle shot against a clear blue sky.',
      'Macro photograph of dewdrops on an autumn leaf, shallow depth of field, morning light. The leaf is a sugar maple in mid-October colour shift — half emerald-green at the stem fading to a brick-orange at the tip. Each dewdrop acts as a small lens magnifying the veins behind it. Soft window light from camera-left at a low 15-degree angle picks up tiny rainbow refractions on the water surface. Background falls off to a creamy out-of-focus brown.',
      'EDITORIAL FASHION COVER — oversized linen blazer, terracotta walls, Vogue Paris.',
      'A robot waiter delivering espresso in a Tokyo izakaya, warm neon backlighting. The robot is matte-white with brass joints and visible servo cabling, holding a vintage demitasse on a small lacquered tray. Behind it: bamboo-slatted seating, hand-painted kanji signage in red and pink neon, low ceiling fans, a wall of small sake bottles. Camera at human seated eye-level, 35mm equivalent, f/1.8 with the robot in tack focus and a row of izakaya patrons softly blurred behind. Atmosphere is warm, slightly humid, faintly nostalgic.',
      'Cyberpunk samurai sitting on a glowing neon ring throne, red and white armor.',
      'Underwater photograph of a kelp forest, sun rays piercing the surface, schools of fish.',
      'Architectural visualization of a glass cabin perched on a Norwegian fjord, golden-hour reflections off the still water below. The cabin is 14m long, fully glazed on the south wall with steel mullions. A single occupant stands at the window holding a coffee mug. The fjord stretches deep into the frame past two layers of mountain silhouettes. Sky is a gradient from coral pink at the horizon to a deep cobalt at zenith. Cinematic 2.39:1 aspect, shot from a slight aerial angle as if hovering 20m above and 30m out from the cabin.',
      'Vintage stamp design illustration in indigo ink, Moroccan architecture motif.',
      'Concert photography — silhouettes of fans illuminated by stage lasers.',
      'A surfer holding a board, beach palm trees behind, oversized white tee, pastel film tones. Sun is high but the shot is taken from a low angle so the surfer cuts cleanly against the sky. Hawaiian shorts in faded coral. Skin tones warm and slightly desaturated, channeling 90s analog beach catalog photography. Soft contrast, gentle vignette, a hint of grain. The surfer is mid-walk, not posed — caught in a natural moment of squinting against the brightness.',
      'Stop-motion-style frog character holding a tiny mug of coffee, illustrated flat style.',
      'Liquid mercury swirling into floral shapes, iridescent rainbow refractions, studio lighting. Macro lens, extreme shallow depth of field — only the front face of the bloom is in focus, with the petals rapidly falling out of focus toward the back. Black velvet backdrop. Light source is a single ringlight from camera position, producing a perfect circular catchlight in every reflective surface. The mercury is photographed at 1/8000s shutter so the swirl appears frozen in motion. The whole image reads as both alien and organic.',
      'Abstract painting · oil on linen · cyan and bone color study.',
    ];

    const authors = [
      { name: 'Bryan Cocco',                                        initials: 'BC', bg: '#3FCBC4', fg: '#064e3b' },
      { name: 'Maximilian Constantine Featherbottom-Whitfield III', initials: 'MF', photo: 'https://randomuser.me/api/portraits/men/22.jpg' },
      { name: 'Léa Tremblay-Søndergaard',                           initials: 'LT', photo: 'https://randomuser.me/api/portraits/women/44.jpg' },
      { name: 'ZAPHODBEEBLEBROXOFFICIAL',                           initials: 'ZB', bg: '#FF7B6E', fg: '#7c2d12' },
      { name: 'Nick Z.',                                            initials: 'NZ', photo: 'https://randomuser.me/api/portraits/men/67.jpg' },
      { name: 'Anastasia Vasiliou-Papandreou',                      initials: 'AV', photo: 'https://randomuser.me/api/portraits/women/15.jpg' },
      { name: 'Kira P.',                                            initials: 'KP', bg: '#9B8AFB', fg: '#312e81' },
    ];

    const models = [
      'gemini-3-1-flash',
      'claude-sonnet-4-6',
      'gpt-5-5-vision',
      'nova-premier',
      'o3',
      'claude-haiku-4-5',
    ];

    const timestamps = [
      'Just now', '4m ago', '12m ago', '38m ago', '1h ago', '2h ago',
      '4h ago', '6h ago', '11h ago', 'Yesterday', '2d ago', '4d ago',
      '6d ago', '1w ago', '2w ago', '3w ago',
    ];

    /* --- Audio data (unchanged from prior pass) ---------------- */
    const audioAssets = [
      { title: 'Misty Lake Theme',           dur: '2:14', bpm: 92,  key: 'Amin', style: 'Ambient' },
      { title: 'Skyline at Dusk',            dur: '3:42', bpm: 110, key: 'Dmaj', style: 'Cinematic' },
      { title: 'Cyberpunk Pulse',            dur: '2:48', bpm: 128, key: 'F#min', style: 'Electronic' },
      { title: 'Quiet Rooms',                dur: '4:21', bpm: 78,  key: 'Cmaj', style: 'Ambient' },
      { title: 'Driving North',              dur: '3:16', bpm: 120, key: 'Emin', style: 'Synthwave' },
      { title: 'Voice Over · Calm Narrator', dur: '0:48', bpm: '—', key: '—',    style: 'Voice' },
      { title: 'Heavy Glass',                dur: '2:55', bpm: 140, key: 'Gmin', style: 'Industrial' },
      { title: 'Sunday Morning',             dur: '3:32', bpm: 84,  key: 'Cmaj', style: 'Folk' },
    ];

    /* --- Helpers ------------------------------------------------- */

    function avatarHTML(author) {
      if (author.photo) {
        return '<span class="gco-avatar gco-avatar-photo"><img src="' + author.photo + '" alt="" loading="eager" decoding="async"></span>';
      }
      return '<span class="gco-avatar" style="background:' + author.bg + ';color:' + author.fg + ';">' + author.initials + '</span>';
    }
    function buildPhotoSrc(id, w, h) {
      /* Pass both w + h with fit=crop so Unsplash crops server-side
         with its content-aware/face-aware algorithm. Without h, the
         server returns the natural aspect and the browser's
         object-fit: cover crops blindly from center — which is what
         was producing the bad crops (heads cut off, faces clipped). */
      return 'https://images.unsplash.com/photo-' + id +
        '?w=' + w + '&h=' + h +
        '&q=75&auto=format&fit=crop&fm=webp&cs=tinysrgb';
    }
    function hashStr(s) {
      let h = 0;
      for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
      return h;
    }
    function waveformSVG(seed) {
      const N = 200;
      let s = hashStr(seed) | 0;
      const rnd = () => { s = (s * 9301 + 49297) | 0; return ((s % 233280) + 233280) % 233280 / 233280; };
      let path = '';
      for (let i = 0; i < N; i++) {
        const t = i / (N - 1);
        const env = Math.sin(Math.PI * t);
        const h = 0.15 + (env * 0.55 + rnd() * 0.45) * 0.85;
        const x = (i / (N - 1)) * 100;
        const y = h * 45;
        path += 'M' + x.toFixed(2) + ' ' + (50 - y).toFixed(2) +
                'L' + x.toFixed(2) + ' ' + (50 + y).toFixed(2) + ' ';
      }
      return '<svg viewBox="0 0 100 100" preserveAspectRatio="none">' +
             '<path d="' + path + '" stroke="currentColor" stroke-width="0.5" stroke-linecap="butt" fill="none" vector-effect="non-scaling-stroke"/>' +
             '</svg>';
    }

    /* --- Render: Instagram phone mockups ----------------------- */

    const STATUS_BAR_HTML =
      '<div class="c4-phone-status">' +
        '<span>9:41</span>' +
        '<span class="c4-phone-icons">' +
          '<svg width="14" height="10" viewBox="0 0 14 10" fill="currentColor"><rect x="0" y="6" width="2" height="4" rx="0.5"/><rect x="3" y="4" width="2" height="6" rx="0.5"/><rect x="6" y="2" width="2" height="8" rx="0.5"/><rect x="9" y="0" width="2" height="10" rx="0.5"/></svg>' +
          '<svg width="14" height="10" viewBox="0 0 14 10" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"><path d="M1 4.2 Q 7 -0.5 13 4.2"/><path d="M3 6 Q 7 3 11 6"/><circle cx="7" cy="8.5" r="0.7" fill="currentColor" stroke="none"/></svg>' +
          '<svg width="24" height="11" viewBox="0 0 24 11" fill="none"><rect x="0.5" y="0.5" width="20" height="10" rx="2.5" stroke="currentColor"/><rect x="2" y="2" width="17" height="7" rx="1.4" fill="currentColor"/><rect x="21.2" y="3.5" width="1.6" height="4" rx="0.5" fill="currentColor"/></svg>' +
        '</span>' +
      '</div>';

    function igHeaderHTML(ad) {
      return '<div class="c4-ig-header">' +
        '<span class="c4-ig-avatar"><span>' + (ad.avatar ? '<img src="' + ad.avatar + '" alt="">' : '') + '</span></span>' +
        '<div class="c4-ig-user">' +
          '<span class="c4-ig-username">' + escapeHTML(ad.brand) + '</span>' +
          '<span class="c4-ig-sponsored">' + escapeHTML(ad.sponsored) + '</span>' +
        '</div>' +
        '<svg class="c4-ig-more" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg>' +
      '</div>';
    }

    /* --- Platform-specific chrome templates ---
       Each variant emits the post wrapper that surrounds the media
       at the unit's aspect ratio. The media itself is injected via
       a placeholder string so the same chrome can host an image,
       video, or other creative without forking templates. */

    const PLACEHOLDER_BRAND_NAME = 'Acme';
    const PLACEHOLDER_BRAND_HANDLE = 'acme';
    const PLACEHOLDER_BRAND_LOGO = 'omni-logo.png';
    const PLACEHOLDER_AD_CAPTION = 'Race the wrap you designed. The Roblox Racing Sample Campaign is live inside Driving Empire.';
    const PLACEHOLDER_AD_TITLE = 'Sample Campaign · Up to $50K';
    const PLACEHOLDER_AD_HOST = 'ACME.COM';
    const PLACEHOLDER_AD_CTA = 'Enter Now';
    const PLACEHOLDER_REDDIT_SUB = 'r/Acme';
    const PLACEHOLDER_REDDIT_USER = 'u/acme';
    const PLACEHOLDER_LI_FOLLOWERS = '45,548 followers';
    const PLACEHOLDER_IG_LIKES = '2,847';
    const PLACEHOLDER_EMPLOYEE = {
      name: 'Bryan Cocco',
      role: 'Creative Director at Acme',
      photo: 'https://randomuser.me/api/portraits/men/52.jpg',
    };
    const PRODUCT_THUMBS = [
      'https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=200&h=200&q=75&auto=format&fit=crop&fm=webp',
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=200&h=200&q=75&auto=format&fit=crop&fm=webp',
      'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=200&h=200&q=75&auto=format&fit=crop&fm=webp',
      'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=200&h=200&q=75&auto=format&fit=crop&fm=webp',
    ];

    /* === Shared chrome helpers ============================== */

    /* mediaInner now accepts an `overlay` HTML string for in-image
       overlays (carousel dots, video play button, shopping tags,
       event date pin, etc.). The old corner type-glyph has been
       retired — every type either gets a proper overlay or its
       own bespoke chrome. */
    function mediaInner(u, i, overlay) {
      const ar = u.ratio.split(':').join(' / ');
      const src = adImg(i, u.ratio);
      return '<div class="c4-ad-media" style="aspect-ratio:' + ar + ';">' +
        '<img src="' + src + '" alt="" loading="lazy" decoding="async">' +
        (overlay || '') +
      '</div>';
    }

    /* Carousel pagination dots — translucent pill at the bottom
       center of the media. Active dot is white, others 45%. */
    function carouselDotsHTML(active, total) {
      let html = '';
      for (let k = 0; k < total; k++) {
        html += '<span class="c4-ad-dot' + (k === active ? ' is-active' : '') + '"></span>';
      }
      return '<div class="c4-ad-carousel-dots">' + html + '</div>';
    }

    /* Video play button + duration overlay. Centered play disc +
       a small black pill bottom-right with mm:ss. */
    function videoOverlayHTML(duration) {
      return '<div class="c4-ad-video-overlay">' +
        '<span class="c4-ad-video-play">' +
          '<svg width="42" height="42" viewBox="0 0 42 42">' +
            '<circle cx="21" cy="21" r="20" fill="rgba(0,0,0,0.55)"/>' +
            '<polygon points="17,12 17,30 31,21" fill="#fff"/>' +
          '</svg>' +
        '</span>' +
        (duration ? '<span class="c4-ad-video-duration">' + duration + '</span>' : '') +
      '</div>';
    }

    /* IG product-tag overlay — two product price pills with dots.
       Real IG behavior: tags anchored on the LEFT half of the image
       extend the pill to the right of the dot; tags on the RIGHT
       half flip — pill extends LEFT of the dot — so they never
       overflow the image bounds. The `c4-ad-shop-tag-right`
       modifier reverses the DOM order so the dot stays the anchor
       on the image while the pill grows inward.
       The shopping-bag icon sits in the TOP-LEFT corner of the
       image (matches real IG Shopping placement, not bottom-left). */
    function shoppingTagsHTML() {
      return '<div class="c4-ad-shop-tags">' +
        '<span class="c4-ad-shop-bag">' +
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 7h12l-1 13H7L6 7z"/><path d="M9 7V5a3 3 0 0 1 6 0v2"/></svg>' +
        '</span>' +
        '<span class="c4-ad-shop-tag" style="top:42%;left:18%;">' +
          '<span class="c4-ad-shop-tag-dot"></span>' +
          '<span class="c4-ad-shop-tag-pill">Race Wrap Kit · $24</span>' +
        '</span>' +
        '<span class="c4-ad-shop-tag c4-ad-shop-tag-right" style="top:70%;right:16%;">' +
          '<span class="c4-ad-shop-tag-pill">Pro Decal Set · $12</span>' +
          '<span class="c4-ad-shop-tag-dot"></span>' +
        '</span>' +
      '</div>';
    }

    /* Acme logo wrappers used as platform avatars. */
    const BRAND_AVATAR_META     = '<span class="c4-ad-avatar"><img src="' + PLACEHOLDER_BRAND_LOGO + '" alt=""></span>';
    const BRAND_AVATAR_LINKEDIN = '<span class="c4-ad-avatar c4-ad-avatar-sq"><img src="' + PLACEHOLDER_BRAND_LOGO + '" alt=""></span>';
    const BRAND_AVATAR_REDDIT   = '<span class="c4-ad-avatar c4-ad-avatar-reddit"><img src="' + PLACEHOLDER_BRAND_LOGO + '" alt=""></span>';
    const BRAND_AVATAR_IG       = '<span class="c4-ad-avatar c4-ad-avatar-ig"><span><img src="' + PLACEHOLDER_BRAND_LOGO + '" alt=""></span></span>';

    /* IG sponsored CTA bar — actual IG ad format: handle on the left
       (grey, small) + CTA chevron on the right (black, semibold).
       Sits directly below the image and above the action icons. */
    function igSponsoredBarHTML(ctaLabel) {
      return '<div class="c4-ad-ig-sponsored">' +
        '<span class="c4-ad-ig-sponsored-from">' + PLACEHOLDER_BRAND_HANDLE + '</span>' +
        '<span class="c4-ad-ig-sponsored-cta">' + escapeHTML(ctaLabel || 'Learn more') +
          '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 6 15 12 9 18"/></svg>' +
        '</span>' +
      '</div>';
    }

    /* IG icon-only action row (heart/comment/send + bookmark). */
    function igActionsHTML() {
      return '<div class="c4-ad-ig-actions">' +
        '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0a0a0a" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/></svg>' +
        '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0a0a0a" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>' +
        '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0a0a0a" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>' +
        '<svg class="c4-ad-ig-bookmark" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0a0a0a" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>' +
      '</div>';
    }

    /* === Meta (Facebook) ============================== */

    /* Inline globe SVG for the Meta header sub-line. Replaces the
       prior 🌐 emoji which rendered inconsistently across systems
       and didn't match the actual FB chrome glyph. */
    const META_GLOBE_SVG =
      '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="vertical-align:-1px;margin-left:2px;"><circle cx="12" cy="12" r="9.5"/><line x1="2.5" y1="12" x2="21.5" y2="12"/><path d="M12 2.5a14 14 0 0 1 4 9.5 14 14 0 0 1-4 9.5 14 14 0 0 1-4-9.5 14 14 0 0 1 4-9.5z"/></svg>';

    /* Standard FB feed-post chrome. Accepts opts:
       - partnership: render "Paid partnership with" tag above header
       - partnershipCreator: also overlay a creator avatar on the
         brand avatar (Branded Content ads)
       - live: render "[Brand] is live" header instead of standard
       - mediaOverlay: overlay HTML to inject inside the media
       - beforeLink: extra HTML inserted between media and link card
       - skipLink: omit the standard link card entirely
       - linkTitle / linkDesc / cta: override link card content */
    function chromeMetaFeed(u, i, opts) {
      opts = opts || {};
      const subInner = opts.live
        ? '<span class="c4-ad-meta-live-tag"><span class="c4-ad-live-dot"></span>LIVE</span> · ' + META_GLOBE_SVG
        : (opts.sub || 'Sponsored') + ' · ' + META_GLOBE_SVG;
      const avatarHTML = opts.partnershipCreator
        ? '<span class="c4-ad-meta-avstack">' +
            '<span class="c4-ad-avatar"><img src="' + PLACEHOLDER_EMPLOYEE.photo + '" alt=""></span>' +
            '<span class="c4-ad-avatar c4-ad-meta-avstack-back"><img src="' + PLACEHOLDER_BRAND_LOGO + '" alt=""></span>' +
          '</span>'
        : BRAND_AVATAR_META;
      const headerName = opts.live
        ? PLACEHOLDER_BRAND_NAME + ' <span class="c4-ad-meta-livetext">is live</span>'
        : PLACEHOLDER_BRAND_NAME;
      return '<div class="c4-ad-frame" data-platform="meta">' +
        (opts.partnership ?
          '<div class="c4-ad-meta-partnership">Paid partnership with <strong>' + PLACEHOLDER_BRAND_HANDLE + '</strong></div>' : '') +
        '<div class="c4-ad-header">' +
          avatarHTML +
          '<div class="c4-ad-handle">' +
            '<div class="c4-ad-name">' + headerName + '</div>' +
            '<div class="c4-ad-sub">' + subInner + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="c4-ad-caption">' + escapeHTML(PLACEHOLDER_AD_CAPTION) + '</div>' +
        mediaInner(u, i, opts.mediaOverlay || '') +
        (opts.beforeLink || '') +
        (opts.skipLink ? '' :
          '<div class="c4-ad-link c4-ad-link-meta">' +
            '<div class="c4-ad-link-text">' +
              '<div class="c4-ad-link-host">' + PLACEHOLDER_AD_HOST + '</div>' +
              '<div class="c4-ad-link-title">' + escapeHTML(opts.linkTitle || PLACEHOLDER_AD_TITLE) + '</div>' +
              (opts.linkDesc ? '<div class="c4-ad-link-desc">' + escapeHTML(opts.linkDesc) + '</div>' : '') +
            '</div>' +
            '<button class="c4-ad-cta-btn c4-ad-cta-meta" type="button">' + escapeHTML(opts.cta || PLACEHOLDER_AD_CTA) + '</button>' +
          '</div>') +
        '<div class="c4-ad-reactions">' +
          '<span class="c4-ad-reactions-emoji">' +
            '<span class="c4-ad-reactions-emoji-dot" style="background:#1877F2;">👍</span>' +
            '<span class="c4-ad-reactions-emoji-dot" style="background:#F33E58;">❤</span>' +
          '</span>' +
          '<span class="c4-ad-reactions-count">1.2K</span>' +
          '<span class="c4-ad-reactions-meta"><span class="c4-ad-reactions-link">97 comments</span><span class="c4-ad-reactions-link">39 shares</span></span>' +
        '</div>' +
        '<div class="c4-ad-actions">' +
          '<span class="c4-ad-action"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 22h10V11l-5-7-2.5 3.5L7 11v11z"/></svg>Like</span>' +
          '<span class="c4-ad-action"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>Comment</span>' +
          '<span class="c4-ad-action"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>Share</span>' +
        '</div>' +
      '</div>';
    }

    /* Meta Collection — hero image + 4-thumbnail product strip BELOW
       the hero, before the link card. CTA is "Shop Now" (FB's
       actual Collection ad CTA label). */
    function chromeMetaCollection(u, i) {
      const thumbs = '<div class="c4-ad-collection-strip">' +
        PRODUCT_THUMBS.map(t => '<span class="c4-ad-collection-thumb"><img src="' + t + '" alt=""></span>').join('') +
      '</div>';
      return chromeMetaFeed(u, i, {
        beforeLink: thumbs,
        cta: 'Shop Now',
        linkTitle: 'Featured · 24 items',
      });
    }

    /* Meta Event — event date pin in the bottom-left of the media
       (FRI / NOV / 12 stacked layout matching real FB Event chrome)
       + dual "Interested" + "Going" CTA buttons. Real FB Events
       show both buttons side-by-side, not just one. */
    function chromeMetaEvent(u, i) {
      const datePin =
        '<div class="c4-ad-event-pin">' +
          '<div class="c4-ad-event-pin-dow">FRI</div>' +
          '<div class="c4-ad-event-pin-month">NOV</div>' +
          '<div class="c4-ad-event-pin-day">12</div>' +
        '</div>';
      return chromeMetaFeed(u, i, {
        mediaOverlay: datePin,
        skipLink: true,
        beforeLink:
          '<div class="c4-ad-event-card">' +
            '<div class="c4-ad-event-meta">' +
              '<div class="c4-ad-event-date-line">Fri, Nov 12 · 7:00 PM EST</div>' +
              '<div class="c4-ad-event-title">Sample Campaign Launch</div>' +
              '<div class="c4-ad-event-sub">Online · Free</div>' +
            '</div>' +
            '<div class="c4-ad-event-actions">' +
              '<button class="c4-ad-cta-btn c4-ad-cta-meta" type="button"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" style="margin-right:4px;"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="9"/></svg>Interested</button>' +
              '<button class="c4-ad-cta-btn c4-ad-cta-meta-outlined" type="button">Going</button>' +
            '</div>' +
          '</div>',
      });
    }

    /* Meta Lead Gen — real FB Lead Gen ads in the feed look like
       standard feed ads with a "Sign Up" CTA. The form opens as a
       modal sheet when the user taps the CTA — it is never inline
       in the feed. The prior inline-form rendering was fabricated. */
    function chromeMetaLeadGen(u, i) {
      return chromeMetaFeed(u, i, {
        cta: 'Sign Up',
        linkTitle: 'Sign up to enter the competition',
        linkDesc: 'Pre-filled form · Submit in seconds',
      });
    }

    /* === Instagram ==================================== */

    /* Standard IG feed chrome — accurate IG ad rendering:
       - Round avatar (with IG gradient ring), handle in semibold,
         "Sponsored" sub-line in grey, ⋯ on right
       - Media at native AR
       - Sponsored CTA strip: handle (grey, light) | CTA › (black, semibold)
       - Action icons row: heart / comment / send · save (right-aligned)
       - Likes count (semibold)
       - Caption: handle (semibold) + caption text + " more" (grey, lowercase)
       - "View all 142 comments" link (grey)
       - Timestamp (small caps grey, e.g. "4 HOURS AGO") */
    function chromeIgFeed(u, i, opts) {
      opts = opts || {};
      return '<div class="c4-ad-frame" data-platform="instagram">' +
        '<div class="c4-ad-header">' +
          BRAND_AVATAR_IG +
          '<div class="c4-ad-handle">' +
            '<div class="c4-ad-name">' + PLACEHOLDER_BRAND_HANDLE + '</div>' +
            '<div class="c4-ad-sub">Sponsored</div>' +
          '</div>' +
        '</div>' +
        mediaInner(u, i, opts.mediaOverlay || '') +
        (opts.belowMedia || '') +
        (opts.skipSponsoredBar ? '' : igSponsoredBarHTML(opts.ctaLabel)) +
        igActionsHTML() +
        '<div class="c4-ad-ig-likes">' + PLACEHOLDER_IG_LIKES + ' likes</div>' +
        '<div class="c4-ad-ig-caption"><strong>' + PLACEHOLDER_BRAND_HANDLE + '</strong> ' + escapeHTML(PLACEHOLDER_AD_CAPTION) + '<span class="c4-ad-ig-more">more</span></div>' +
        '<div class="c4-ad-ig-comments">View all 142 comments</div>' +
        '<div class="c4-ad-ig-time">4 HOURS AGO</div>' +
      '</div>';
    }

    /* IG Shopping — product price tags overlaid on media + shop bag
       icon. CTA label specific to shopping ("View shop"). */
    function chromeIgShopping(u, i) {
      return chromeIgFeed(u, i, {
        mediaOverlay: shoppingTagsHTML(),
        ctaLabel: 'View shop',
      });
    }

    /* IG Collection — 4-product thumbnail strip beneath the hero,
       "Shop now" CTA label specific to Collection format. */
    function chromeIgCollection(u, i) {
      const thumbs = '<div class="c4-ad-collection-strip c4-ad-collection-strip-ig">' +
        PRODUCT_THUMBS.map(t => '<span class="c4-ad-collection-thumb"><img src="' + t + '" alt=""></span>').join('') +
      '</div>';
      return chromeIgFeed(u, i, { belowMedia: thumbs, ctaLabel: 'Shop now' });
    }

    /* IG Explore — 3-column grid with a 2×2 feature tile occupying
       the top-left quadrant and five 1×1 tiles wrapping around it.
       Real IG Explore mixes tile sizes like this. The sponsored ad
       lives in the feature 2×2 slot (high-impact Explore placement)
       and reads as a regular tile aside from the small bottom-left
       "Sponsored" label — no outline, no color highlight, identical
       chrome to the organic tiles. */
    function chromeIgExplore(u, i) {
      const cell = (idx, ar) => '<div class="c4-ad-explore-cell"><img src="' + adImg(idx, ar || '1:1') + '" alt="" loading="lazy"></div>';
      return '<div class="c4-ad-frame c4-ad-frame-explore" data-platform="instagram">' +
        '<div class="c4-ad-explore-grid">' +
          '<div class="c4-ad-explore-cell c4-ad-explore-cell-feature c4-ad-explore-cell-main">' +
            '<img src="' + adImg(i, '1:1') + '" alt="" loading="lazy">' +
            '<span class="c4-ad-explore-sponsored">Sponsored</span>' +
          '</div>' +
          cell(i + 3) +
          cell(i + 5) +
          cell(i + 9) +
          cell(i + 13) +
          cell(i + 17) +
        '</div>' +
      '</div>';
    }

    /* === LinkedIn ===================================== */

    function chromeLinkedinFeed(u, i, opts) {
      opts = opts || {};
      return '<div class="c4-ad-frame" data-platform="linkedin">' +
        '<div class="c4-ad-header">' +
          (opts.avatar || BRAND_AVATAR_LINKEDIN) +
          '<div class="c4-ad-handle">' +
            '<div class="c4-ad-name">' + escapeHTML(opts.name || PLACEHOLDER_BRAND_NAME) + '</div>' +
            '<div class="c4-ad-sub">' + escapeHTML(opts.sub || (PLACEHOLDER_LI_FOLLOWERS + ' · Promoted')) + '</div>' +
            (opts.subline2 ? '<div class="c4-ad-sub" style="margin-top:1px;">' + escapeHTML(opts.subline2) + '</div>' : '') +
          '</div>' +
        '</div>' +
        (opts.promotedBy ? '<div class="c4-ad-li-promoted">Promoted by <strong>' + escapeHTML(opts.promotedBy) + '</strong></div>' : '') +
        '<div class="c4-ad-caption">' + escapeHTML(opts.caption || PLACEHOLDER_AD_CAPTION) + '</div>' +
        mediaInner(u, i, opts.mediaOverlay || '') +
        (opts.skipLink ? '' :
          '<div class="c4-ad-link">' +
            '<div class="c4-ad-link-text">' +
              '<div class="c4-ad-link-title">' + escapeHTML(opts.linkTitle || PLACEHOLDER_AD_TITLE) + '</div>' +
              '<div class="c4-ad-link-host" style="text-transform:lowercase;letter-spacing:0;">acme.com</div>' +
            '</div>' +
            '<button class="c4-ad-cta-btn" type="button">' + escapeHTML(opts.cta || PLACEHOLDER_AD_CTA) + '</button>' +
          '</div>') +
        '<div class="c4-ad-reactions">' +
          '<span class="c4-ad-reactions-emoji">' +
            '<span class="c4-ad-reactions-emoji-dot" style="background:#0A66C2;">👍</span>' +
            '<span class="c4-ad-reactions-emoji-dot" style="background:#F5B800;">❤</span>' +
            '<span class="c4-ad-reactions-emoji-dot" style="background:#F33E58;">💡</span>' +
          '</span>' +
          '<span class="c4-ad-reactions-count">1,025</span>' +
          '<span class="c4-ad-reactions-meta"><span class="c4-ad-reactions-link">753 comments</span><span class="c4-ad-reactions-link">234 reposts</span></span>' +
        '</div>' +
        '<div class="c4-ad-actions">' +
          '<span class="c4-ad-action"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 22h10V11l-5-7-2.5 3.5L7 11v11z"/></svg>Like</span>' +
          '<span class="c4-ad-action"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>Comment</span>' +
          '<span class="c4-ad-action"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>Repost</span>' +
          '<span class="c4-ad-action"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>Send</span>' +
        '</div>' +
      '</div>';
    }

    /* LinkedIn Document — multi-page document preview with "1 / 12"
       page indicator pill and arrow chrome. */
    function chromeLinkedinDocument(u, i) {
      const docOverlay =
        '<div class="c4-ad-doc-pager">' +
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>' +
          '<span>1 / 12</span>' +
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>' +
        '</div>';
      return chromeLinkedinFeed(u, i, {
        mediaOverlay: docOverlay,
        linkTitle: 'Sample Campaign · 12-page brief',
        cta: 'Download',
      });
    }

    /* LinkedIn Event — event date pin overlay + Attend CTA. */
    function chromeLinkedinEvent(u, i) {
      const datePin = '<div class="c4-ad-event-pin">' +
        '<div class="c4-ad-event-pin-month">NOV</div>' +
        '<div class="c4-ad-event-pin-day">12</div>' +
      '</div>';
      return chromeLinkedinFeed(u, i, {
        mediaOverlay: datePin,
        linkTitle: 'Sample Campaign Launch · LinkedIn Live',
        cta: 'Attend',
      });
    }

    /* LinkedIn Thought Leader — employee profile in header,
       "Promoted by Acme" badge underneath. */
    function chromeLinkedinThoughtLead(u, i) {
      const personAvatar =
        '<span class="c4-ad-avatar c4-ad-avatar-person"><img src="' + PLACEHOLDER_EMPLOYEE.photo + '" alt=""></span>';
      return chromeLinkedinFeed(u, i, {
        avatar: personAvatar,
        name: PLACEHOLDER_EMPLOYEE.name,
        sub: PLACEHOLDER_EMPLOYEE.role,
        subline2: '2d · Edited',
        promotedBy: PLACEHOLDER_BRAND_NAME,
        skipLink: true,
      });
    }

    /* LinkedIn Conversation — InMail-style sponsored chat with three
       option buttons. Completely different chrome from feed. */
    function chromeLinkedinConversation(u, i) {
      return '<div class="c4-ad-frame c4-ad-frame-inmail" data-platform="linkedin">' +
        '<div class="c4-ad-inmail-head">' +
          '<span class="c4-ad-avatar c4-ad-avatar-person c4-ad-avatar-md"><img src="' + PLACEHOLDER_EMPLOYEE.photo + '" alt=""></span>' +
          '<div class="c4-ad-inmail-headtext">' +
            '<div class="c4-ad-inmail-name">' + PLACEHOLDER_EMPLOYEE.name + '</div>' +
            '<div class="c4-ad-inmail-role">' + PLACEHOLDER_EMPLOYEE.role + '</div>' +
            '<div class="c4-ad-inmail-meta">Sponsored Message · Now</div>' +
          '</div>' +
        '</div>' +
        '<div class="c4-ad-inmail-bubble">' +
          'Quick note from the Acme team — we just launched the Roblox Racing Sample Campaign inside Driving Empire and the top wraps are getting cash prizes up to $50K. Take a look?' +
        '</div>' +
        '<div class="c4-ad-inmail-options">' +
          '<button class="c4-ad-inmail-opt" type="button">See the competition →</button>' +
          '<button class="c4-ad-inmail-opt" type="button">Show me prize details →</button>' +
          '<button class="c4-ad-inmail-opt" type="button">Not now</button>' +
        '</div>' +
        '<div class="c4-ad-inmail-footer">' +
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>' +
          ' Reply to this message' +
        '</div>' +
      '</div>';
    }

    /* LinkedIn Spotlight — personalized dynamic ad. Real Spotlight
       Ads display in the right rail with a soft brand-color
       background banner behind the viewer's headshot. Headline is
       auto-personalized with the viewer's first name. */
    function chromeLinkedinSpotlight(u, i) {
      return '<div class="c4-ad-frame c4-ad-frame-spotlight" data-platform="linkedin">' +
        '<div class="c4-ad-spotlight-banner"></div>' +
        '<div class="c4-ad-spotlight-head">' +
          '<span class="c4-ad-avatar c4-ad-avatar-person c4-ad-avatar-md c4-ad-spotlight-headshot"><img src="' + PLACEHOLDER_EMPLOYEE.photo + '" alt=""></span>' +
        '</div>' +
        '<div class="c4-ad-spotlight-title">Bryan, take the next step at Acme</div>' +
        '<div class="c4-ad-spotlight-sub">Open roles · Roblox · Remote</div>' +
        '<button class="c4-ad-cta-btn c4-ad-spotlight-cta" type="button">View jobs</button>' +
        '<div class="c4-ad-spotlight-promoted">Promoted by ' + PLACEHOLDER_BRAND_NAME + '</div>' +
      '</div>';
    }

    /* LinkedIn Follower — "+ Follow Company" card with banner +
       follower stats + single Follow CTA. */
    function chromeLinkedinFollower(u, i) {
      return '<div class="c4-ad-frame c4-ad-frame-follower" data-platform="linkedin">' +
        '<div class="c4-ad-follower-banner"><img src="' + adImg(i, '4:1') + '" alt=""></div>' +
        '<div class="c4-ad-follower-body">' +
          '<span class="c4-ad-avatar c4-ad-avatar-sq c4-ad-avatar-lg c4-ad-follower-logo"><img src="' + PLACEHOLDER_BRAND_LOGO + '" alt=""></span>' +
          '<div class="c4-ad-follower-name">' + PLACEHOLDER_BRAND_NAME + '</div>' +
          '<div class="c4-ad-follower-sub">Roblox studio · Driving Empire · Racing wraps</div>' +
          '<div class="c4-ad-follower-stats">' + PLACEHOLDER_LI_FOLLOWERS + '</div>' +
          '<button class="c4-ad-cta-btn c4-ad-follower-cta" type="button">+ Follow</button>' +
        '</div>' +
        '<div class="c4-ad-spotlight-promoted c4-ad-follower-promoted">Promoted</div>' +
      '</div>';
    }

    /* === Reddit ====================================== */

    /* Standard Reddit feed chrome — modern subreddit header with
       community icon + r/Community + a "Promoted" pill that's
       visually prominent (green text). No organic-style timestamp:
       real Reddit Promoted posts don't carry a "Posted X hours ago"
       since they're paid placements, not user posts. The second
       header line shows the Promoted indicator + brand attribution. */
    function chromeRedditFeed(u, i, opts) {
      opts = opts || {};
      const upArrow = '<svg class="c4-ad-reddit-arrow" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 14 12 8 18 14"/></svg>';
      const downArrow = '<svg class="c4-ad-reddit-arrow" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 10 12 16 18 10"/></svg>';
      return '<div class="c4-ad-frame" data-platform="reddit">' +
        '<div class="c4-ad-reddit-head">' +
          '<span class="c4-ad-reddit-sub-icon"><img src="' + PLACEHOLDER_BRAND_LOGO + '" alt=""></span>' +
          '<div class="c4-ad-reddit-head-text">' +
            '<div class="c4-ad-reddit-sub-name">' + PLACEHOLDER_REDDIT_SUB + '</div>' +
            '<div class="c4-ad-reddit-meta-line"><span class="c4-ad-reddit-promoted">Promoted</span> · ' + PLACEHOLDER_REDDIT_USER + '</div>' +
          '</div>' +
          '<button class="c4-ad-reddit-join" type="button">Join</button>' +
        '</div>' +
        '<div class="c4-ad-reddit-title">' + escapeHTML(opts.title || PLACEHOLDER_AD_TITLE) + '</div>' +
        (opts.body ? '<div class="c4-ad-reddit-body">' + escapeHTML(opts.body) + '</div>' : '') +
        (opts.skipMedia ? '' : mediaInner(u, i, opts.mediaOverlay || '')) +
        (opts.afterMedia || '') +
        (opts.skipLink ? '' :
          '<div class="c4-ad-link">' +
            '<div class="c4-ad-link-host">' + PLACEHOLDER_AD_HOST + '</div>' +
            '<button class="c4-ad-cta-btn" type="button">' + escapeHTML(opts.cta || PLACEHOLDER_AD_CTA) + '</button>' +
          '</div>') +
        '<div class="c4-ad-reddit-votes">' +
          '<span class="c4-ad-reddit-votes-pill">' +
            upArrow + '<span>1.2k</span>' + downArrow +
          '</span>' +
          '<span class="c4-ad-reddit-meta-pill">' +
            '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>' +
            ' 142' +
          '</span>' +
          '<span class="c4-ad-reddit-meta-pill">' +
            '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/><path d="M20 17v3a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-3"/></svg>' +
            ' Share' +
          '</span>' +
        '</div>' +
      '</div>';
    }

    /* Reddit Conversation — Promoted Conversation Ad: standard
       Reddit post body with a quoted top comment + Reply CTA. */
    function chromeRedditConversation(u, i) {
      const quotedReply =
        '<div class="c4-ad-reddit-quoted">' +
          '<div class="c4-ad-reddit-quoted-head">' +
            '<span class="c4-ad-reddit-quoted-avatar"></span>' +
            '<span class="c4-ad-reddit-quoted-author">u/race_dev_42</span>' +
            '<span class="c4-ad-reddit-quoted-meta">· 1h</span>' +
          '</div>' +
          '<div class="c4-ad-reddit-quoted-body">finally a competition the design crowd can actually win — submitting tonight</div>' +
          '<div class="c4-ad-reddit-quoted-foot">▲ 124 · Reply</div>' +
        '</div>';
      return chromeRedditFeed(u, i, { afterMedia: quotedReply });
    }

    /* Reddit Free Form — text-style post (no link card / CTA).
       Body text inline beneath the title with media optional. */
    function chromeRedditFreeForm(u, i) {
      return chromeRedditFeed(u, i, {
        body: PLACEHOLDER_AD_CAPTION,
        skipLink: true,
      });
    }

    /* === Story / Reel chrome (cross-platform) ============== */

    function chromeStory(u, i, kind, brandText) {
      const isReel = kind === 'reel';
      const platform = u.platform;
      const isIg = platform === 'instagram';
      const avatar = isIg ? BRAND_AVATAR_IG
        : platform === 'reddit'   ? BRAND_AVATAR_REDDIT
        : platform === 'linkedin' ? BRAND_AVATAR_LINKEDIN
        : BRAND_AVATAR_META;

      const progress = !isReel ?
        '<div class="c4-ad-story-progress">' +
          '<span class="fill"></span><span></span><span></span><span></span><span></span>' +
        '</div>' : '';

      /* Story → centered Link Sticker pill at bottom.
         Reel → wide CTA pill above the footer, full-width minus side rail. */
      const cta = !isReel ?
        '<div class="c4-ad-story-cta">' + PLACEHOLDER_AD_CTA + '</div>' :
        '<div class="c4-ad-reel-cta">' + PLACEHOLDER_AD_CTA +
          '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" style="margin-left:6px;"><polyline points="9 6 15 12 9 18"/></svg>' +
        '</div>';

      const reelSide = isReel ?
        '<div class="c4-ad-reel-side">' +
          '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/></svg><span>2.8K</span>' +
          '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg><span>97</span>' +
          '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg><span>Share</span>' +
          (isIg ? '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="1.4"/><circle cx="5" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/></svg>' +
                  '<span class="c4-ad-reel-music"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="18" cy="16" r="3" stroke="currentColor" stroke-width="2" fill="none"/></svg></span>' : '') +
        '</div>' : '';

      const reelFooter = isReel ?
        '<div class="c4-ad-reel-footer">' +
          '<div class="c4-ad-name">' + escapeHTML(brandText || PLACEHOLDER_BRAND_NAME) + '</div>' +
          '<div class="c4-ad-reel-cap">' + escapeHTML(PLACEHOLDER_AD_CAPTION) + '</div>' +
          (isIg ? '<div class="c4-ad-reel-music-line"><svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M9 18V5l12-2v13"/></svg> ' + escapeHTML(PLACEHOLDER_BRAND_NAME) + ' · Original audio</div>' : '') +
        '</div>' : '';

      const chromeKind = isReel ? 'reel' : 'story';

      /* Sub-line: "Sponsored" is the IG/Meta pattern; LinkedIn shows
         followers + Promoted; Reddit promoted timestamp. */
      const subLine = (platform === 'linkedin')
        ? PLACEHOLDER_LI_FOLLOWERS + ' · Promoted'
        : (platform === 'reddit')
          ? PLACEHOLDER_REDDIT_SUB + ' · Promoted'
          : 'Sponsored';

      return '<div class="c4-ad-frame" data-platform="' + platform + '" data-chrome="' + chromeKind + '">' +
        mediaInner(u, i) +
        progress +
        '<div class="c4-ad-story-header">' +
          avatar +
          '<div class="c4-ad-handle">' +
            '<div class="c4-ad-name">' + escapeHTML(brandText || PLACEHOLDER_BRAND_NAME) + '</div>' +
            '<div class="c4-ad-sub">' + subLine + '</div>' +
          '</div>' +
          '<div class="c4-ad-more">✕</div>' +
        '</div>' +
        reelSide +
        reelFooter +
        cta +
      '</div>';
    }

    /* === Basic / organic post-type chromes ====================== */

    /* Reused Meta reaction + action bar — text/link/live/album posts
       all share the same engagement chrome (different counts but
       same DOM structure). Inline so the per-type chromes stay
       readable. */
    const META_FOOT_REACT_HTML =
      '<div class="c4-ad-reactions">' +
        '<span class="c4-ad-reactions-emoji">' +
          '<span class="c4-ad-reactions-emoji-dot" style="background:#1877F2;">👍</span>' +
          '<span class="c4-ad-reactions-emoji-dot" style="background:#F33E58;">❤</span>' +
        '</span>' +
        '<span class="c4-ad-reactions-count">428</span>' +
        '<span class="c4-ad-reactions-meta"><span class="c4-ad-reactions-link">62 comments</span><span class="c4-ad-reactions-link">14 shares</span></span>' +
      '</div>' +
      '<div class="c4-ad-actions">' +
        '<span class="c4-ad-action"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 22h10V11l-5-7-2.5 3.5L7 11v11z"/></svg>Like</span>' +
        '<span class="c4-ad-action"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>Comment</span>' +
        '<span class="c4-ad-action"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>Share</span>' +
      '</div>';

    function metaHeaderHTML(subText) {
      return '<div class="c4-ad-header">' +
        BRAND_AVATAR_META +
        '<div class="c4-ad-handle">' +
          '<div class="c4-ad-name">' + PLACEHOLDER_BRAND_NAME + '</div>' +
          '<div class="c4-ad-sub">' + escapeHTML(subText) + ' · ' + META_GLOBE_SVG + '</div>' +
        '</div>' +
      '</div>';
    }

    /* Meta Text Post — status-only post with no media. Real FB
       "background-colors" text posts use a vivid gradient panel
       with very large text (18-22px). */
    function chromeMetaText(u, i) {
      return '<div class="c4-ad-frame" data-platform="meta">' +
        metaHeaderHTML('2h') +
        '<div class="c4-ad-meta-text-card">' +
          '<div class="c4-ad-meta-text-body">Big news — the Roblox Racing Sample Campaign is officially live in Driving Empire. Top wraps win cash prizes up to $50K.</div>' +
        '</div>' +
        META_FOOT_REACT_HTML +
      '</div>';
    }

    /* Meta Link Share — caption + tall link preview card with image
       on top, host + title + description, and a full-width "Learn
       More" CTA button at the bottom of the card. Real FB link
       cards always include the CTA as a footer button inside the
       card boundary, not as a side button. */
    function chromeMetaLink(u, i) {
      return '<div class="c4-ad-frame" data-platform="meta">' +
        metaHeaderHTML('4h') +
        '<div class="c4-ad-caption">' + escapeHTML(PLACEHOLDER_AD_CAPTION) + '</div>' +
        '<div class="c4-ad-link-large">' +
          '<div class="c4-ad-link-large-img"><img src="' + adImg(i, '1.91:1') + '" alt="" loading="lazy"></div>' +
          '<div class="c4-ad-link-large-text">' +
            '<div class="c4-ad-link-host">' + PLACEHOLDER_AD_HOST + '</div>' +
            '<div class="c4-ad-link-large-title">' + escapeHTML(PLACEHOLDER_AD_TITLE) + '</div>' +
            '<div class="c4-ad-link-large-desc">Driving Empire teams up with Acme for the biggest player-created design competition of 2026.</div>' +
          '</div>' +
          '<button class="c4-ad-cta-btn c4-ad-cta-meta c4-ad-link-large-cta" type="button">Learn More</button>' +
        '</div>' +
        META_FOOT_REACT_HTML +
      '</div>';
    }

    /* Meta Live — "[Brand] is live" header pattern + LIVE pill and
       viewer count overlaid on the media. Real FB Live posts use
       the "is live" header treatment, not a "Live now" sub-line,
       and the visual indicator sits ON the video. */
    function chromeMetaLive(u, i) {
      const liveOverlay =
        '<div class="c4-ad-live-badge"><span class="c4-ad-live-dot"></span>LIVE</div>' +
        '<div class="c4-ad-live-views">' +
          '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>' +
          ' 12,438 watching' +
        '</div>';
      return chromeMetaFeed(u, i, {
        live: true,
        sub: '2m',
        mediaOverlay: liveOverlay,
        skipLink: true,
      });
    }

    /* Meta Album — real FB albums use varied layouts. For a 4+
       photo set, the canonical "1 large + 3 stacked" layout is
       most common, with a "+N more" overlay on the last tile when
       the album exceeds 4 photos. */
    function chromeMetaAlbum(u, i) {
      const photos = [
        adImg(i, '1.91:1'),
        adImg(i + 2, '1:1'),
        adImg(i + 4, '1:1'),
        adImg(i + 6, '1:1'),
      ];
      const cells =
        '<span class="c4-ad-meta-album-cell c4-ad-meta-album-cell-hero">' +
          '<img src="' + photos[0] + '" alt="" loading="lazy">' +
        '</span>' +
        '<span class="c4-ad-meta-album-cell">' +
          '<img src="' + photos[1] + '" alt="" loading="lazy">' +
        '</span>' +
        '<span class="c4-ad-meta-album-cell">' +
          '<img src="' + photos[2] + '" alt="" loading="lazy">' +
        '</span>' +
        '<span class="c4-ad-meta-album-cell c4-ad-meta-album-cell-more">' +
          '<img src="' + photos[3] + '" alt="" loading="lazy">' +
          '<span class="c4-ad-meta-album-overlay">+8</span>' +
        '</span>';
      return '<div class="c4-ad-frame" data-platform="meta">' +
        metaHeaderHTML('6h') +
        '<div class="c4-ad-caption">' + escapeHTML(PLACEHOLDER_AD_CAPTION) + '</div>' +
        '<div class="c4-ad-meta-album">' + cells + '</div>' +
        META_FOOT_REACT_HTML +
      '</div>';
    }

    /* IG Live — full-bleed 9:16 dark frame. Real IG Live places the
       red LIVE badge and viewer-count chip directly ON the video
       (top-left + adjacent), not in the header sub-line. Header
       shows the broadcaster's handle and an ✕ to close. Bottom is
       a scrolling comment stream + comment input. */
    function chromeIgLive(u, i) {
      const liveOverlay =
        '<div class="c4-ad-ig-live-badge"><span class="c4-ad-live-dot"></span>LIVE</div>' +
        '<div class="c4-ad-ig-live-viewers">' +
          '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>' +
          ' 12.4K' +
        '</div>';
      return '<div class="c4-ad-frame" data-platform="instagram" data-chrome="story">' +
        mediaInner(u, i, liveOverlay) +
        '<div class="c4-ad-story-header c4-ad-ig-live-header">' +
          BRAND_AVATAR_IG +
          '<div class="c4-ad-handle">' +
            '<div class="c4-ad-name">' + PLACEHOLDER_BRAND_HANDLE + '</div>' +
            '<div class="c4-ad-sub">12,438 watching</div>' +
          '</div>' +
          '<div class="c4-ad-more">✕</div>' +
        '</div>' +
        '<div class="c4-ad-ig-live-stream">' +
          '<div class="c4-ad-ig-live-msg"><strong>race_dev_42</strong> Submitting tonight 🔥</div>' +
          '<div class="c4-ad-ig-live-msg"><strong>kira_p</strong> Where do you submit?</div>' +
          '<div class="c4-ad-ig-live-msg"><strong>maxon_design</strong> ANY wrap or just supplied?</div>' +
        '</div>' +
        '<div class="c4-ad-ig-live-input">Add a comment…</div>' +
      '</div>';
    }

    /* IG Feed Video — feed chrome with centered play disc + duration
       pill overlay on the media. */
    function chromeIgVideo(u, i) {
      return chromeIgFeed(u, i, { mediaOverlay: videoOverlayHTML('0:38') });
    }

    /* === LinkedIn basic post types ============================ */

    function linkedinHeaderHTML(subText) {
      return '<div class="c4-ad-header">' +
        BRAND_AVATAR_LINKEDIN +
        '<div class="c4-ad-handle">' +
          '<div class="c4-ad-name">' + PLACEHOLDER_BRAND_NAME + '</div>' +
          '<div class="c4-ad-sub">' + escapeHTML(subText) + '</div>' +
        '</div>' +
      '</div>';
    }

    const LI_FOOT_REACT_HTML =
      '<div class="c4-ad-reactions">' +
        '<span class="c4-ad-reactions-emoji">' +
          '<span class="c4-ad-reactions-emoji-dot" style="background:#0A66C2;">👍</span>' +
          '<span class="c4-ad-reactions-emoji-dot" style="background:#F5B800;">❤</span>' +
          '<span class="c4-ad-reactions-emoji-dot" style="background:#F33E58;">💡</span>' +
        '</span>' +
        '<span class="c4-ad-reactions-count">512</span>' +
        '<span class="c4-ad-reactions-meta"><span class="c4-ad-reactions-link">86 comments</span><span class="c4-ad-reactions-link">32 reposts</span></span>' +
      '</div>' +
      '<div class="c4-ad-actions">' +
        '<span class="c4-ad-action"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 22h10V11l-5-7-2.5 3.5L7 11v11z"/></svg>Like</span>' +
        '<span class="c4-ad-action"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>Comment</span>' +
        '<span class="c4-ad-action"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>Repost</span>' +
        '<span class="c4-ad-action"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>Send</span>' +
      '</div>';

    /* LinkedIn Text Post — no media, just multi-paragraph body in
       the larger LI post text style. */
    function chromeLinkedinText(u, i) {
      return '<div class="c4-ad-frame" data-platform="linkedin">' +
        linkedinHeaderHTML(PLACEHOLDER_LI_FOLLOWERS + ' · 2d') +
        '<div class="c4-ad-li-text-body">' +
          'Quick update from the team: the Roblox Racing Sample Campaign is now live.<br><br>' +
          'We\'re calling it the biggest player-created design competition of 2026 inside Driving Empire. Top wraps are getting cash prizes — up to $50K for the grand prize. Submissions open through end of month.<br><br>' +
          'Tag the designers in your network who should see this.' +
        '</div>' +
        LI_FOOT_REACT_HTML +
      '</div>';
    }

    /* LinkedIn Poll — question + 3 option bars with vote percentages
       + total votes + time-remaining meta line. */
    function chromeLinkedinPoll(u, i) {
      const row = (label, pct) =>
        '<div class="c4-ad-li-poll-row">' +
          '<div class="c4-ad-li-poll-bar" style="--w:' + pct + '%;"></div>' +
          '<div class="c4-ad-li-poll-text"><span>' + escapeHTML(label) + '</span><span class="c4-ad-li-poll-pct">' + pct + '%</span></div>' +
        '</div>';
      return '<div class="c4-ad-frame" data-platform="linkedin">' +
        linkedinHeaderHTML(PLACEHOLDER_LI_FOLLOWERS + ' · 1d') +
        '<div class="c4-ad-caption">What\'s the hardest part of designing wraps for Roblox?</div>' +
        '<div class="c4-ad-li-poll">' +
          row('Texturing', 64) +
          row('Geometry', 24) +
          row('Lighting', 12) +
          '<div class="c4-ad-li-poll-meta">1,245 votes · 4d left</div>' +
        '</div>' +
        LI_FOOT_REACT_HTML +
      '</div>';
    }

    /* LinkedIn Article — caption + tall article cover card (image
       on top, "Article" label, large title, byline + read time). */
    function chromeLinkedinArticle(u, i) {
      return '<div class="c4-ad-frame" data-platform="linkedin">' +
        linkedinHeaderHTML(PLACEHOLDER_LI_FOLLOWERS + ' · 3d') +
        '<div class="c4-ad-caption">New article — what the Roblox Racing Sample Campaign tells us about the future of player-created content.</div>' +
        '<div class="c4-ad-li-article">' +
          '<div class="c4-ad-li-article-img"><img src="' + adImg(i, '1.91:1') + '" alt="" loading="lazy"></div>' +
          '<div class="c4-ad-li-article-text">' +
            '<div class="c4-ad-li-article-label">Article</div>' +
            '<div class="c4-ad-li-article-title">The Future of Player-Created Content in Roblox</div>' +
            '<div class="c4-ad-li-article-byline">Acme · 5 min read</div>' +
          '</div>' +
        '</div>' +
        LI_FOOT_REACT_HTML +
      '</div>';
    }

    /* LinkedIn Newsletter — newsletter card with icon, name + sub,
       Subscribe button, edition title + snippet. */
    function chromeLinkedinNewsletter(u, i) {
      return '<div class="c4-ad-frame" data-platform="linkedin">' +
        linkedinHeaderHTML('Newsletter · 2d') +
        '<div class="c4-ad-caption">Edition 14 of our weekly newsletter — out now.</div>' +
        '<div class="c4-ad-li-newsletter">' +
          '<div class="c4-ad-li-newsletter-head">' +
            '<span class="c4-ad-li-newsletter-icon">' +
              '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0A66C2" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="1"/><line x1="3" y1="9" x2="21" y2="9"/></svg>' +
            '</span>' +
            '<div class="c4-ad-li-newsletter-meta">' +
              '<div class="c4-ad-li-newsletter-name">Driving Empire Briefing</div>' +
              '<div class="c4-ad-li-newsletter-sub">Weekly · 12,420 subscribers</div>' +
            '</div>' +
            '<button class="c4-ad-cta-btn c4-ad-li-newsletter-cta" type="button">Subscribe</button>' +
          '</div>' +
          '<div class="c4-ad-li-newsletter-title">Sample Campaign · Edition 14</div>' +
          '<div class="c4-ad-li-newsletter-snippet">This week: $50K grand prize, 38 community submissions and the wraps that almost broke physics.</div>' +
        '</div>' +
        LI_FOOT_REACT_HTML +
      '</div>';
    }

    /* LinkedIn Celebrate — real LinkedIn celebrate posts use a
       branded template panel (brand-blue gradient background with
       layered balloon + streamer illustrations) and frame the
       milestone with a centered "Celebrating..." treatment + a
       Congratulate button positioned in the action bar below. The
       prior confetti-dots pattern was a fabrication. */
    function chromeLinkedinCelebrate(u, i) {
      const balloons =
        '<svg class="c4-ad-li-celebrate-art" viewBox="0 0 280 280" preserveAspectRatio="xMidYMid slice" fill="none">' +
          // Streamers
          '<path d="M0 240 Q70 200 140 240 T280 240" stroke="rgba(255,255,255,0.45)" stroke-width="2" fill="none"/>' +
          '<path d="M0 250 Q60 220 140 250 T280 250" stroke="rgba(255,255,255,0.30)" stroke-width="2" fill="none"/>' +
          // Balloons
          '<g transform="translate(56 70)"><ellipse cx="0" cy="0" rx="22" ry="26" fill="#FFD45A"/><path d="M0 26 L-2 36 L2 36 Z" fill="#FFD45A"/><path d="M0 36 Q-6 60 -3 90" stroke="rgba(255,255,255,0.55)" stroke-width="1.2" fill="none"/></g>' +
          '<g transform="translate(130 50)"><ellipse cx="0" cy="0" rx="26" ry="30" fill="#FF7B6E"/><path d="M0 30 L-2 42 L2 42 Z" fill="#FF7B6E"/><path d="M0 42 Q4 70 0 110" stroke="rgba(255,255,255,0.55)" stroke-width="1.2" fill="none"/></g>' +
          '<g transform="translate(210 80)"><ellipse cx="0" cy="0" rx="22" ry="26" fill="#9B8AFB"/><path d="M0 26 L-2 36 L2 36 Z" fill="#9B8AFB"/><path d="M0 36 Q-3 60 -2 100" stroke="rgba(255,255,255,0.55)" stroke-width="1.2" fill="none"/></g>' +
          // Sparkles
          '<g fill="rgba(255,255,255,0.85)"><circle cx="40" cy="40" r="2"/><circle cx="245" cy="40" r="1.5"/><circle cx="90" cy="180" r="2"/><circle cx="200" cy="180" r="1.8"/><circle cx="170" cy="30" r="1.5"/></g>' +
        '</svg>';
      return '<div class="c4-ad-frame" data-platform="linkedin">' +
        linkedinHeaderHTML(PLACEHOLDER_LI_FOLLOWERS + ' · 5h') +
        '<div class="c4-ad-caption">Excited to share — we just launched the Roblox Racing Sample Campaign!</div>' +
        '<div class="c4-ad-li-celebrate">' +
          balloons +
          '<div class="c4-ad-li-celebrate-body">' +
            '<div class="c4-ad-li-celebrate-label">Celebrating a project launch</div>' +
            '<div class="c4-ad-li-celebrate-title">Roblox Racing Sample Campaign</div>' +
            '<div class="c4-ad-li-celebrate-sub">Driving Empire · Live now</div>' +
          '</div>' +
        '</div>' +
        LI_FOOT_REACT_HTML +
      '</div>';
    }

    /* === Reddit basic post types ============================== */

    function redditHeaderHTML() {
      return '<div class="c4-ad-reddit-head">' +
        '<span class="c4-ad-reddit-sub-icon"><img src="' + PLACEHOLDER_BRAND_LOGO + '" alt=""></span>' +
        '<div class="c4-ad-reddit-head-text">' +
          '<div class="c4-ad-reddit-sub-name">' + PLACEHOLDER_REDDIT_SUB + '</div>' +
          '<div class="c4-ad-reddit-meta-line">Posted by ' + PLACEHOLDER_REDDIT_USER + ' · 2h</div>' +
        '</div>' +
        '<button class="c4-ad-reddit-join" type="button">Join</button>' +
      '</div>';
    }

    function redditFootHTML(voteCount, comments) {
      return '<div class="c4-ad-reddit-votes">' +
        '<span class="c4-ad-reddit-votes-pill">' +
          '<svg class="c4-ad-reddit-arrow" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 14 12 8 18 14"/></svg>' +
          '<span>' + voteCount + '</span>' +
          '<svg class="c4-ad-reddit-arrow" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 10 12 16 18 10"/></svg>' +
        '</span>' +
        '<span class="c4-ad-reddit-meta-pill">' +
          '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>' +
          ' ' + comments +
        '</span>' +
        '<span class="c4-ad-reddit-meta-pill">' +
          '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/><path d="M20 17v3a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-3"/></svg>' +
          ' Share' +
        '</span>' +
      '</div>';
    }

    /* Reddit Text Post — title + body paragraphs, no media. */
    function chromeRedditText(u, i) {
      return '<div class="c4-ad-frame" data-platform="reddit">' +
        redditHeaderHTML() +
        '<div class="c4-ad-reddit-title">$50K up for grabs — Sample Campaign is officially live</div>' +
        '<div class="c4-ad-reddit-body">' +
          'TL;DR — the Roblox Racing Sample Campaign is now open inside Driving Empire. Submit your wrap by end of month, top entries get cash prizes.<br><br>' +
          'Full rules and submission process in the subreddit wiki. AMA below — I\'m on the dev team.' +
        '</div>' +
        redditFootHTML('892', '142') +
      '</div>';
    }

    /* Reddit Link Post — title + horizontal link card (thumbnail
       left, host + title right with external-link icon). */
    function chromeRedditLink(u, i) {
      return '<div class="c4-ad-frame" data-platform="reddit">' +
        redditHeaderHTML() +
        '<div class="c4-ad-reddit-title">Sample Campaign Launch — full details inside Driving Empire</div>' +
        '<div class="c4-ad-reddit-linkcard">' +
          '<div class="c4-ad-reddit-linkcard-img"><img src="' + adImg(i, '1.91:1') + '" alt="" loading="lazy"></div>' +
          '<div class="c4-ad-reddit-linkcard-text">' +
            '<div class="c4-ad-reddit-linkcard-host">' +
              '<span>acme.com</span>' +
              '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>' +
            '</div>' +
            '<div class="c4-ad-reddit-linkcard-title">Sample Campaign · Up to $50K</div>' +
          '</div>' +
        '</div>' +
        redditFootHTML('1.4k', '208') +
      '</div>';
    }

    /* Reddit Poll — options as bars with vote counts + percentage;
       total votes + time-remaining meta line. */
    function chromeRedditPoll(u, i) {
      const row = (label, votes, pct) =>
        '<div class="c4-ad-reddit-poll-row">' +
          '<div class="c4-ad-reddit-poll-bar" style="--w:' + pct + '%;"></div>' +
          '<div class="c4-ad-reddit-poll-text"><span>' + escapeHTML(label) + '</span><span class="c4-ad-reddit-poll-pct">' + votes + ' · ' + pct + '%</span></div>' +
        '</div>';
      return '<div class="c4-ad-frame" data-platform="reddit">' +
        redditHeaderHTML() +
        '<div class="c4-ad-reddit-title">What\'s the hardest part of designing a Roblox racing wrap?</div>' +
        '<div class="c4-ad-reddit-poll">' +
          row('Texturing', '348', 62) +
          row('UV unwrapping', '129', 23) +
          row('Submission flow', '84', 15) +
          '<div class="c4-ad-reddit-poll-meta">561 votes · 4 days left</div>' +
        '</div>' +
        redditFootHTML('732', '94') +
      '</div>';
    }

    /* Reddit Gallery — single hero image with "1 / 8" pager pill
       overlay marking it as a multi-image gallery post. */
    function chromeRedditGallery(u, i) {
      const galleryOverlay =
        '<div class="c4-ad-reddit-gallery-indicator">' +
          '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>' +
          '<span>1 / 8</span>' +
        '</div>';
      return '<div class="c4-ad-frame" data-platform="reddit">' +
        redditHeaderHTML() +
        '<div class="c4-ad-reddit-title">Top 8 wrap submissions so far — gallery</div>' +
        mediaInner(u, i, galleryOverlay) +
        redditFootHTML('2.1k', '186') +
      '</div>';
    }

    /* === Dispatcher: route to the right chrome by type+platform. ====
       Type-first routing for bespoke chrome (Conversation, Document,
       Event, Spotlight, Follower, Free Form, Shopping, Explore,
       Collection, Lead Gen, Thought Leader). Generic feed extras
       (Carousel dots, Video play overlay, Branded partnership tag,
       Slideshow stack badge, Instant Experience tag) are layered as
       opts on the base platform chrome. */
    function chromeFor(u, i) {
      const p = u.platform;
      const t = u.type;

      // === Basic / organic post types (non-sponsored) ===
      if (t === 'text') {
        if (p === 'meta')     return chromeMetaText(u, i);
        if (p === 'linkedin') return chromeLinkedinText(u, i);
        if (p === 'reddit')   return chromeRedditText(u, i);
      }
      if (t === 'link') {
        if (p === 'meta')   return chromeMetaLink(u, i);
        if (p === 'reddit') return chromeRedditLink(u, i);
      }
      if (t === 'live') {
        if (p === 'meta')      return chromeMetaLive(u, i);
        if (p === 'instagram') return chromeIgLive(u, i);
      }
      if (t === 'album' && p === 'meta')       return chromeMetaAlbum(u, i);
      if (t === 'poll') {
        if (p === 'linkedin') return chromeLinkedinPoll(u, i);
        if (p === 'reddit')   return chromeRedditPoll(u, i);
      }
      if (t === 'article'    && p === 'linkedin') return chromeLinkedinArticle(u, i);
      if (t === 'newsletter' && p === 'linkedin') return chromeLinkedinNewsletter(u, i);
      if (t === 'celebrate'  && p === 'linkedin') return chromeLinkedinCelebrate(u, i);
      if (t === 'gallery'    && p === 'reddit')   return chromeRedditGallery(u, i);
      if (t === 'video'      && p === 'instagram' && u.ratio !== '9:16') return chromeIgVideo(u, i);

      // Full-bleed dark frames
      if (t === 'story') return chromeStory(u, i, 'story');
      if (t === 'reel')  return chromeStory(u, i, 'reel');
      if (t === 'video' && u.ratio === '9:16') return chromeStory(u, i, 'reel');

      // Bespoke per type+platform
      if (t === 'conversation') {
        if (p === 'linkedin') return chromeLinkedinConversation(u, i);
        if (p === 'reddit')   return chromeRedditConversation(u, i);
      }
      if (t === 'collection') {
        if (p === 'meta')      return chromeMetaCollection(u, i);
        if (p === 'instagram') return chromeIgCollection(u, i);
      }
      if (t === 'event') {
        if (p === 'meta')     return chromeMetaEvent(u, i);
        if (p === 'linkedin') return chromeLinkedinEvent(u, i);
      }
      if (t === 'lead-gen' && p === 'meta')         return chromeMetaLeadGen(u, i);
      if (t === 'shopping' && p === 'instagram')    return chromeIgShopping(u, i);
      if (t === 'explore'  && p === 'instagram')    return chromeIgExplore(u, i);
      if (t === 'document' && p === 'linkedin')     return chromeLinkedinDocument(u, i);
      if (t === 'thought-lead' && p === 'linkedin') return chromeLinkedinThoughtLead(u, i);
      if (t === 'spotlight' && p === 'linkedin')    return chromeLinkedinSpotlight(u, i);
      if (t === 'follower'  && p === 'linkedin')    return chromeLinkedinFollower(u, i);
      if (t === 'free-form' && p === 'reddit')      return chromeRedditFreeForm(u, i);
      /* Branded Content — partnership tag PLUS dual avatar (creator
         + brand). Real FB Branded Content shows both, not just the
         brand. */
      if (t === 'branded'  && p === 'meta')         return chromeMetaFeed(u, i, { partnership: true, partnershipCreator: true });

      // Generic overlays applied over base feed chrome
      if (t === 'carousel') {
        const dots = carouselDotsHTML(0, 5);
        if (p === 'instagram') return chromeIgFeed(u, i, { mediaOverlay: dots });
        if (p === 'linkedin')  return chromeLinkedinFeed(u, i, { mediaOverlay: dots });
        if (p === 'reddit')    return chromeRedditFeed(u, i, { mediaOverlay: dots });
        return chromeMetaFeed(u, i, { mediaOverlay: dots });
      }
      if (t === 'video') {
        const overlay = videoOverlayHTML('0:38');
        if (p === 'linkedin') return chromeLinkedinFeed(u, i, { mediaOverlay: overlay });
        if (p === 'reddit')   return chromeRedditFeed(u, i, { mediaOverlay: overlay });
        return chromeMetaFeed(u, i, { mediaOverlay: overlay });
      }
      /* Slideshow — real FB Slideshow ads in the feed look like
         silent autoplay videos. No "Slideshow · 1/5" badge exists
         on the actual platform. Render as a video-styled unit. */
      if (t === 'slideshow' && p === 'meta') {
        return chromeMetaFeed(u, i, { mediaOverlay: videoOverlayHTML('0:08') });
      }
      /* Instant Experience — real FB Instant Experience ads in the
         feed are visually identical to regular feed ads with a
         "Get Offer" / "Learn More" CTA. The Instant Experience
         opens as a fullscreen modal when the user taps. No tag
         overlay exists on the feed unit itself. */
      if (t === 'instant' && p === 'meta') {
        return chromeMetaFeed(u, i, { cta: 'Get Offer' });
      }

      // Default platform feed chrome
      if (p === 'instagram') return chromeIgFeed(u, i);
      if (p === 'linkedin')  return chromeLinkedinFeed(u, i);
      if (p === 'reddit')    return chromeRedditFeed(u, i);
      return chromeMetaFeed(u, i);
    }

    /* Tiny platform icons used in the foot meta-line. Each is a
       14×14 SVG using the platform's brand color. IG uses an
       inline linear gradient with a per-instance unique ID so
       multiple icons on the same page don't clash. */
    function platformIconHTML(platform, uniqueIdx) {
      if (platform === 'meta') {
        return '<svg class="c4-ad-unit-platform-icon" width="14" height="14" viewBox="0 0 24 24" aria-label="Meta">' +
          '<circle cx="12" cy="12" r="12" fill="#1877F2"/>' +
          '<path d="M14.2 13.4h-2.4V20h-2.9v-6.6H7.2v-2.6h1.7V9c0-2 1.2-3.2 3-3.2.9 0 1.8.2 1.8.2v2.4h-1.1c-.8 0-1 .5-1 1V11h2.1l-.5 2.4z" fill="#fff"/>' +
        '</svg>';
      }
      if (platform === 'instagram') {
        const gid = 'ig-grad-' + uniqueIdx;
        return '<svg class="c4-ad-unit-platform-icon" width="14" height="14" viewBox="0 0 24 24" aria-label="Instagram">' +
          '<defs><linearGradient id="' + gid + '" x1="0" y1="100%" x2="100%" y2="0">' +
            '<stop offset="0" stop-color="#FCAF45"/>' +
            '<stop offset=".5" stop-color="#E1306C"/>' +
            '<stop offset="1" stop-color="#833AB4"/>' +
          '</linearGradient></defs>' +
          '<rect x="2" y="2" width="20" height="20" rx="5" fill="url(#' + gid + ')"/>' +
          '<circle cx="12" cy="12" r="4.2" fill="none" stroke="#fff" stroke-width="1.7"/>' +
          '<circle cx="17" cy="7" r="1.1" fill="#fff"/>' +
        '</svg>';
      }
      if (platform === 'linkedin') {
        return '<svg class="c4-ad-unit-platform-icon" width="14" height="14" viewBox="0 0 24 24" aria-label="LinkedIn">' +
          '<rect x="2" y="2" width="20" height="20" rx="3" fill="#0A66C2"/>' +
          '<rect x="6" y="10" width="2.4" height="8" fill="#fff"/>' +
          '<circle cx="7.2" cy="7.2" r="1.4" fill="#fff"/>' +
          '<path d="M10.5 10h2.3v1.1c.5-.8 1.4-1.3 2.5-1.3 1.9 0 3 1.3 3 3.6V18h-2.4v-4.1c0-1.1-.4-1.8-1.4-1.8s-1.6.7-1.6 1.8V18h-2.4v-8z" fill="#fff"/>' +
        '</svg>';
      }
      if (platform === 'reddit') {
        return '<svg class="c4-ad-unit-platform-icon" width="14" height="14" viewBox="0 0 24 24" aria-label="Reddit">' +
          '<circle cx="12" cy="12" r="12" fill="#FF4500"/>' +
          '<circle cx="12" cy="13.5" r="6" fill="#fff"/>' +
          '<circle cx="9.8" cy="13" r="1.1" fill="#FF4500"/>' +
          '<circle cx="14.2" cy="13" r="1.1" fill="#FF4500"/>' +
          '<path d="M9.5 15.5c.6.6 1.5 1 2.5 1s1.9-.4 2.5-1" stroke="#FF4500" stroke-width="1" fill="none" stroke-linecap="round"/>' +
          '<circle cx="12" cy="6.5" r="1.4" fill="#fff"/>' +
        '</svg>';
      }
      /* Display fallback — generic banner glyph (graphite). */
      return '<svg class="c4-ad-unit-platform-icon" width="14" height="14" viewBox="0 0 24 24" aria-label="Display ad">' +
        '<rect x="2" y="6" width="20" height="12" rx="1.5" fill="#1F2937"/>' +
        '<rect x="5" y="9.2" width="14" height="1.8" rx="0.6" fill="#fff"/>' +
        '<rect x="5" y="12.5" width="9"  height="1.8" rx="0.6" fill="#fff"/>' +
      '</svg>';
    }

    /* Deep-link map — every {platform, type} pair points to the
       platform's most direct spec page for that unit. Where the
       platform exposes per-format pages (Meta's ads-guide, IG help
       articles, LinkedIn product pages, Reddit help center entries)
       we use those; where no per-format page exists, fallback to
       the platform's general ad-specs page. The Specs link in the
       foot opens in a new tab. */
    const SPECS_URLS = {
      'meta:image':         'https://www.facebook.com/business/ads-guide/image',
      'meta:video':         'https://www.facebook.com/business/ads-guide/video',
      'meta:carousel':      'https://www.facebook.com/business/ads-guide/carousel',
      'meta:collection':    'https://www.facebook.com/business/ads-guide/collection',
      'meta:slideshow':     'https://www.facebook.com/business/ads-guide/slideshow',
      'meta:story':         'https://www.facebook.com/business/ads-guide/stories',
      'meta:reel':          'https://www.facebook.com/business/help/1499068817404488',
      'meta:lead-gen':      'https://www.facebook.com/business/help/313625950375892',
      'meta:event':         'https://www.facebook.com/business/help/213269141881259',
      'meta:branded':       'https://www.facebook.com/business/help/703183560468081',
      'meta:instant':       'https://www.facebook.com/business/help/2068227412910132',
      'meta:text':          'https://www.facebook.com/help/333140160100643',
      'meta:link':          'https://www.facebook.com/help/473058376519061',
      'meta:live':          'https://www.facebook.com/business/help/1656527826325521',
      'meta:album':         'https://www.facebook.com/help/180148542644275',
      'instagram:image':    'https://help.instagram.com/1631821640426723',
      'instagram:video':    'https://help.instagram.com/270447560766967',
      'instagram:story':    'https://business.instagram.com/advertising/stories',
      'instagram:reel':     'https://help.instagram.com/258462174251315',
      'instagram:carousel': 'https://help.instagram.com/261362388193993',
      'instagram:shopping': 'https://business.instagram.com/shopping',
      'instagram:explore':  'https://business.instagram.com/advertising/explore',
      'instagram:collection':'https://www.facebook.com/business/ads-guide/collection',
      'instagram:live':     'https://help.instagram.com/292478487812558',
      'linkedin:image':     'https://www.linkedin.com/help/lms/answer/a426702',
      'linkedin:video':     'https://business.linkedin.com/marketing-solutions/ads/video-ads',
      'linkedin:carousel':  'https://business.linkedin.com/marketing-solutions/ads/sponsored-content/carousel',
      'linkedin:document':  'https://business.linkedin.com/marketing-solutions/ads/document-ads',
      'linkedin:event':     'https://business.linkedin.com/marketing-solutions/ads/event-ads',
      'linkedin:thought-lead':'https://business.linkedin.com/marketing-solutions/ads/thought-leader-ads',
      'linkedin:conversation':'https://business.linkedin.com/marketing-solutions/ads/conversation-ads',
      'linkedin:spotlight': 'https://business.linkedin.com/marketing-solutions/ads/dynamic-ads',
      'linkedin:follower':  'https://business.linkedin.com/marketing-solutions/ads/dynamic-ads',
      'linkedin:text':      'https://www.linkedin.com/help/linkedin/answer/a522272',
      'linkedin:poll':      'https://www.linkedin.com/help/linkedin/answer/a522515',
      'linkedin:article':   'https://www.linkedin.com/help/linkedin/answer/a528188',
      'linkedin:newsletter':'https://www.linkedin.com/help/linkedin/answer/a522517',
      'linkedin:celebrate': 'https://www.linkedin.com/help/linkedin/answer/a521748',
      'linkedin:live':      'https://www.linkedin.com/help/linkedin/answer/a527039',
      'reddit:image':       'https://business.reddithelp.com/s/article/Promoted-Post-Specifications',
      'reddit:video':       'https://business.reddithelp.com/s/article/Video-Ads-Specifications',
      'reddit:carousel':    'https://business.reddithelp.com/s/article/Carousel-Ads-Specifications',
      'reddit:conversation':'https://business.reddithelp.com/s/article/conversation-ads',
      'reddit:free-form':   'https://business.reddithelp.com/s/article/Promoted-Free-Form-Ads',
      'reddit:text':        'https://www.reddithelp.com/hc/en-us/articles/204535809',
      'reddit:link':        'https://www.reddithelp.com/hc/en-us/articles/206026059',
      'reddit:poll':        'https://www.reddithelp.com/hc/en-us/articles/360023230091',
      'reddit:gallery':     'https://www.reddithelp.com/hc/en-us/articles/360037547851',
    };
    const PLATFORM_DEFAULT_SPECS = {
      meta:      'https://www.facebook.com/business/ads-guide',
      instagram: 'https://business.instagram.com/advertising',
      linkedin:  'https://www.linkedin.com/help/lms/answer/a426702',
      reddit:    'https://business.reddithelp.com/s/article/Reddit-Ads-Specifications',
    };
    function specsUrl(platform, type) {
      return SPECS_URLS[platform + ':' + type] || PLATFORM_DEFAULT_SPECS[platform] || '#';
    }

    function renderMedia(rail, units) {
      rail.innerHTML = '';
      const frag = document.createDocumentFragment();
      units.forEach((u, i) => {
        const card = document.createElement('div');
        card.className = 'c4-ad-unit';
        card.dataset.platform = u.platform;
        card.dataset.type = u.type;
        card.dataset.ratio = u.ratio;
        card.dataset.search = (u.platform + ' ' + u.type + ' ' + u.name + ' ' + u.dims).toLowerCase();
        const numStr = String(i + 1).padStart(2, '0');
        /* Meta info migrated from the foot into the 3-dot menu's
           info header. Platform icon + "Specs" deep-link + dims +
           ratio. Foot below now just carries number + name. */
        const socialInfoHtml =
          platformIconHTML(u.platform, i) +
          '<a class="c4-ad-unit-specs" href="' + specsUrl(u.platform, u.type) + '" target="_blank" rel="noopener noreferrer" title="Open platform specs in a new tab">Specs</a>' +
          '<span class="c4-ad-unit-meta-sep">·</span>' +
          '<span class="c4-ad-unit-dims">' + u.dims + ' · ' + u.ratio + '</span>';
        /* Foot lockup sits ABOVE the chrome, not below — number +
           name + 3-dot menu as a label row over the asset. */
        card.innerHTML =
          '<div class="c4-ad-unit-foot">' +
            '<div class="c4-ad-unit-foot-text">' +
              '<div class="c4-ad-unit-name-line">' +
                '<span class="c4-ad-unit-num">' + numStr + '</span>' +
                '<span class="c4-ad-unit-name">' + escapeHTML(u.name) + '</span>' +
              '</div>' +
            '</div>' +
            cardMenuHTML(socialInfoHtml) +
          '</div>' +
          chromeFor(u, i);

        /* Wire image-loaded fade after innerHTML is set. */
        const img = card.querySelector('.c4-ad-media img');
        if (img) {
          img.addEventListener('load', () => img.classList.add('loaded'));
          if (img.complete) requestAnimationFrame(() => img.classList.add('loaded'));
        }

        frag.appendChild(card);
      });
      rail.appendChild(frag);
    }

    /* === Display Ads ============================================
       7 IAB standard sizes × 8 layout variants = 56 templates. The
       LLM is expected to populate each instance with an image,
       headline, body, and CTA derived from the brief + ongoing
       conversation context. Placeholder content here uses the
       Acme / Sample Campaign campaign data so each
       template reads like a real served creative. */
    const DISPLAY_SIZES = [
      { id: 'billboard',     name: 'Billboard',          w: 970, h: 250 },
      { id: 'half-page',     name: 'Half Page',          w: 300, h: 600 },
      { id: 'leaderboard',   name: 'Leaderboard',        w: 728, h:  90 },
      { id: 'med-rect',      name: 'Medium Rectangle',   w: 300, h: 250 },
      { id: 'mobile-banner', name: 'Mobile Banner',      w: 320, h:  50 },
      { id: 'mobile-lead',   name: 'Mobile Leaderboard', w: 320, h: 100 },
      { id: 'skyscraper',    name: 'Skyscraper',         w: 160, h: 600 },
    ];
    const DISPLAY_VARIANTS = [
      { id: 'v1', name: 'Split Zone' },
      { id: 'v2', name: 'Image Hero' },
      { id: 'v3', name: 'Product Focus' },
      { id: 'v4', name: 'Hero Top' },
      { id: 'v6', name: 'Split Horizontal' },
      { id: 'v7', name: 'Copy First' },
      { id: 'v8', name: 'Full Bleed Overlay' },
      { id: 'v9', name: 'Centered' },
    ];
    const displayUnits = [];
    DISPLAY_SIZES.forEach(s => {
      DISPLAY_VARIANTS.forEach(v => {
        displayUnits.push({
          size: s.id, sizeName: s.name,
          variant: v.id, variantName: v.name,
          w: s.w, h: s.h,
          name: s.name + ' / ' + v.name,
          dims: s.w + '×' + s.h,
        });
      });
    });

    /* === Display ad chrome — 1:1 Figma replica ====================
       Frames render at NATIVE pixel dimensions (e.g., Billboard
       970×250 is literally 970×250 in the DOM). The wrapping cell
       applies CSS transform: scale() to fit the band container.
       This way every padding, font, and stroke from the Figma
       board renders verbatim — no proportional interpretation.

       Variant layouts derived from Figma node design contexts:
       - V1 Split Zone        — image top 60% / dark content 40%
       - V2 Image Hero        — full image + bottom dark band (55% opacity)
       - V3 Product Focus     — image top 80% / slim dark bar bottom
       - V4 Hero Top          — full image + top dark band + bottom CTA
       - V6 Split Horizontal  — image left ~49% / dark content right ~51%
       - V7 Copy First        — full image + 75% dark wash + content
       - V8 Full Bleed Overlay — full image + gradient scrim + CTA bottom-right
       - V9 Centered          — full image + gradient scrim + content centered

       Frame content tokens (universal):
         Heading: Inter Bold, white, 14px (16/22 for V2/V4 hero / V7/V8/V9 big)
         Body:    Inter Regular, 11px, white α 0.75 (V2/V4 0.85; V8/V9 0.92)
         Logo:    36×36, dashed rgba(255,255,255,0.65), 4px radius, "LOGO" Inter Bold 9px
         CTA:     white pill, Inter SemiBold, black/#1f1f1f text
         Dark bg: #1f1f1f (solid panels) | rgba(0,0,0,0.55) (overlays) | rgba(0,0,0,0.75) (V7 wash) */
    function chromeDisplayAd(u, i) {
      const src  = adImg(i, u.w + ':' + u.h);
      const HEAD = 'Discover our new flagship';
      const BODY = 'Premium quality with limited-time savings, free shipping included';
      const CTA  = 'Get Started Now';
      /* Per-Figma every V1 template carries a tiny legal disclaimer
         line at the frame's bottom edge. Text varies per size:
         Billboard / Half Page / Leaderboard use the longer
         "promotional offers..." form, Mobile / Mobile Lead /
         Skyscraper / Med Rect use the shorter "subject to terms..."
         form. Per-size CSS handles position + color (light on dark
         surfaces, dark on light). */
      const LEGAL_BY_SIZE = {
        'billboard':     'Promotional offers subject to availability and applicable terms; visit acmecorp.com for details',
        'half-page':     'Promotional offers subject to availability and applicable terms; visit acmecorp.com for details',
        'leaderboard':   'Promotional offers subject to availability and applicable terms; full details on website',
        'med-rect':      'Subject to terms and conditions; full details on acmecorp.com',
        'mobile-banner': 'Subject to terms and conditions; details on acmecorp.com',
        'mobile-lead':   'Subject to terms and conditions; full details on acmecorp.com',
        'skyscraper':    'Subject to terms and conditions; full details on acmecorp.com',
      };
      const legalText = LEGAL_BY_SIZE[u.size] || LEGAL_BY_SIZE['med-rect'];

      const logoHTML =
        '<div class="c4-display-logo">' +
          '<span class="c4-display-logo-text">LOGO</span>' +
        '</div>';
      const headingHTML =
        '<p class="c4-display-heading">' + escapeHTML(HEAD) + '</p>';
      const bodyHTML =
        '<p class="c4-display-body">' + escapeHTML(BODY) + '</p>';
      const ctaHTML =
        '<button class="c4-display-cta" type="button">' + escapeHTML(CTA) + '</button>';
      const imgHTML =
        '<div class="c4-display-img">' +
          '<img src="' + src + '" alt="" loading="lazy">' +
        '</div>';
      const legalHTML =
        '<p class="c4-display-legal">' + escapeHTML(legalText) + '</p>';

      /* Build the inner content per variant. The OUTER frame is
         constant; only the interior composition + scrim placement
         differs across V1–V9. */
      let inner = '';
      switch (u.variant) {
        case 'v1': // Split Zone
          inner =
            imgHTML +
            '<div class="c4-display-content c4-display-content-bottom">' +
              '<div class="c4-display-top-group">' +
                logoHTML +
                '<div class="c4-display-text-group">' + headingHTML + bodyHTML + '</div>' +
              '</div>' +
              '<div class="c4-display-cta-row">' + ctaHTML + '</div>' +
            '</div>';
          break;
        case 'v2': // Image Hero
          /* CTA is a SIBLING of text-group inside content-overlay-
             bottom so per-size CSS can lay them out either as a
             flex column (Med Rect canonical: text then CTA stacked
             vertically) or as a flex row (Billboard / wide formats:
             text + CTA side-by-side at center axis). */
          inner =
            imgHTML +
            '<div class="c4-display-scrim-top"></div>' +
            '<div class="c4-display-content c4-display-content-overlay-bottom">' +
              '<div class="c4-display-text-group">' + headingHTML + bodyHTML + '</div>' +
              '<div class="c4-display-cta-row">' + ctaHTML + '</div>' +
            '</div>' +
            '<div class="c4-display-logo-floating">' +
              '<div class="c4-display-logo"><span class="c4-display-logo-text">LOGO</span></div>' +
            '</div>';
          break;
        case 'v3': // Product Focus
          inner =
            imgHTML +
            '<div class="c4-display-scrim-top"></div>' +
            '<div class="c4-display-content c4-display-content-slim">' +
              '<p class="c4-display-heading">' + escapeHTML(HEAD) + '</p>' +
              ctaHTML +
            '</div>' +
            '<div class="c4-display-logo-floating">' +
              '<div class="c4-display-logo"><span class="c4-display-logo-text">LOGO</span></div>' +
            '</div>';
          break;
        case 'v4': // Hero Top
          /* CTA-row sits OUTSIDE content-overlay-top so its
             position: absolute resolves to the FRAME (not to
             content-overlay-top, which only covers the top portion
             of the frame). Per-size CSS positions the cta-row at
             the right frame coordinate: Med Rect bottom-right,
             Half Page / Skyscraper bottom-center, Leaderboard
             right-center, Billboard top-right, etc. */
          inner =
            imgHTML +
            '<div class="c4-display-scrim-bottom"></div>' +
            '<div class="c4-display-content c4-display-content-overlay-top">' +
              logoHTML +
              '<div class="c4-display-text-group">' + headingHTML + bodyHTML + '</div>' +
            '</div>' +
            '<div class="c4-display-cta-row">' + ctaHTML + '</div>';
          break;
        case 'v6': // Split Horizontal — image left / dark content right
          inner =
            imgHTML +
            '<div class="c4-display-content c4-display-content-right">' +
              '<div class="c4-display-top-group c4-display-top-group-stacked">' +
                logoHTML +
                '<div class="c4-display-text-group">' + headingHTML + bodyHTML + '</div>' +
              '</div>' +
              ctaHTML +
            '</div>';
          break;
        case 'v7': // Copy First
          inner =
            imgHTML +
            '<div class="c4-display-wash-heavy"></div>' +
            '<div class="c4-display-content c4-display-content-fill">' +
              '<div class="c4-display-top-group c4-display-top-group-stacked">' +
                logoHTML +
                '<div class="c4-display-text-group">' +
                  '<p class="c4-display-heading c4-display-heading-large">' + escapeHTML(HEAD) + '</p>' +
                  bodyHTML +
                '</div>' +
              '</div>' +
              ctaHTML +
            '</div>';
          break;
        case 'v8': // Full Bleed Overlay
          inner =
            imgHTML +
            '<div class="c4-display-scrim-bottom-heavy"></div>' +
            '<div class="c4-display-scrim-top"></div>' +
            '<div class="c4-display-content c4-display-content-fill">' +
              '<div class="c4-display-top-group c4-display-top-group-stacked">' +
                logoHTML +
                '<div class="c4-display-text-group">' +
                  '<p class="c4-display-heading c4-display-heading-large">' + escapeHTML(HEAD) + '</p>' +
                  bodyHTML +
                '</div>' +
              '</div>' +
              '<div class="c4-display-cta-row c4-display-cta-row-right">' + ctaHTML + '</div>' +
            '</div>';
          break;
        case 'v9': // Centered
          inner =
            imgHTML +
            '<div class="c4-display-scrim-bottom-heavy"></div>' +
            '<div class="c4-display-scrim-top"></div>' +
            '<div class="c4-display-content c4-display-content-centered">' +
              '<div class="c4-display-top-group c4-display-top-group-stacked c4-display-top-group-centered">' +
                logoHTML +
                '<div class="c4-display-text-group c4-display-text-group-centered">' +
                  '<p class="c4-display-heading c4-display-heading-large">' + escapeHTML(HEAD) + '</p>' +
                  bodyHTML +
                '</div>' +
              '</div>' +
              '<div class="c4-display-cta-row c4-display-cta-row-centered">' + ctaHTML + '</div>' +
            '</div>';
          break;
      }

      return '<div class="c4-display-frame ' + u.variant + '" data-size="' + u.size + '" style="width:' + u.w + 'px;height:' + u.h + 'px;">' +
        inner +
        legalHTML +
      '</div>';
    }

    function renderDisplay(rail, units) {
      /* The rail wraps 7 size-bands (Billboard / Leaderboard /
         Half Page / Med Rect / Mobile Banner / Mobile Lead /
         Skyscraper). Each unit's size slug matches a band's
         data-band attribute. Fan units into their target band's
         grid; leave the band-head + grid scaffold in place. */
      rail.querySelectorAll('.c4-display-band-grid').forEach(g => { g.innerHTML = ''; });
      const bandGrids = {};
      rail.querySelectorAll('.c4-display-band').forEach(b => {
        bandGrids[b.dataset.band] = b.querySelector('.c4-display-band-grid');
      });
      units.forEach((u, i) => {
        const grid = bandGrids[u.size];
        if (!grid) return;
        const card = document.createElement('div');
        card.className = 'c4-ad-unit c4-ad-unit-display';
        card.dataset.size = u.size;
        card.dataset.variant = u.variant;
        card.dataset.search = (u.size + ' ' + u.variant + ' ' + u.name + ' ' + u.sizeName + ' ' + u.variantName + ' ' + u.dims).toLowerCase();
        /* Number 01–08 within the size band (each band has 8
           variants V1–V9 minus V5). Computed from variant id
           order so the count stays stable regardless of how the
           units array is assembled. */
        const variantOrder = ['v1','v2','v3','v4','v6','v7','v8','v9'];
        const numStr = String(variantOrder.indexOf(u.variant) + 1).padStart(2, '0');
        /* Meta info (size name + dims) moves into the 3-dot menu's
           info header; foot stays minimal with number + name. */
        const displayInfoHtml =
          platformIconHTML('display', 'd' + i) +
          '<span class="c4-ad-unit-platform-name">' + escapeHTML(u.sizeName) + '</span>' +
          '<span class="c4-ad-unit-meta-sep">·</span>' +
          '<span class="c4-ad-unit-dims">' + u.dims + '</span>';
        /* Foot lockup sits ABOVE the chrome — label row first, then
           the ad asset below. */
        card.innerHTML =
          '<div class="c4-ad-unit-foot">' +
            '<div class="c4-ad-unit-foot-text">' +
              '<div class="c4-ad-unit-name-line">' +
                '<span class="c4-ad-unit-num">' + numStr + '</span>' +
                '<span class="c4-ad-unit-name">' + escapeHTML(u.variantName) + '</span>' +
              '</div>' +
            '</div>' +
            cardMenuHTML(displayInfoHtml) +
          '</div>' +
          '<div class="c4-display-center">' + chromeDisplayAd(u, i) + '</div>';

        const img = card.querySelector('.c4-display-img img');
        if (img) {
          img.addEventListener('load', () => img.classList.add('loaded'));
          if (img.complete) requestAnimationFrame(() => img.classList.add('loaded'));
        }

        grid.appendChild(card);
      });
    }

    /* Tag the currently-visible last row's cells so they can skip
       their border-bottom (the rail draws the bottom edge). Needs
       to be called whenever the visible set changes: initial
       render, pagination page change, search/filter change, AND on
       window resize (breakpoint changes column count). Without
       this, partial last rows leave a missing-hairline gap above
       the empty trailing positions of the second-to-last row. */
    function markLastRowCells(rail) {
      if (!rail) return;
      const all = Array.from(rail.querySelectorAll('.c4-ad-unit'));
      const visible = all.filter(c =>
        !c.dataset.searchHidden &&
        c.style.display !== 'none' &&
        c.offsetParent !== null
      );
      // Early-out when no cells are visible (canvas_4 hidden behind a
      // non-canvas_4 tab on init, search filtered everything, etc).
      // Without this guard, (0 % cols) || cols evaluates to cols and
      // startIdx becomes negative, crashing the loop on visible[-N].
      // That uncaught throw was aborting the rest of the script —
      // rail-nav accordion, chapter-nav reveal, arrow keys, all dead.
      all.forEach(c => c.classList.remove('is-last-row'));
      if (visible.length === 0) return;
      const cols = getComputedStyle(rail).gridTemplateColumns.split(/\s+/).filter(Boolean).length || 5;
      const lastRowCount = (visible.length % cols) || cols;
      const startIdx = Math.max(0, visible.length - lastRowCount);
      for (let i = startIdx; i < visible.length; i++) {
        if (visible[i]) visible[i].classList.add('is-last-row');
      }
    }

    /* --- Render: Images + Video (canvas_3-style cards) --------- */

    function renderGraphicsCards(grid, sources, isVideo) {
      grid.innerHTML = '';
      const frag = document.createDocumentFragment();
      sources.forEach((src, i) => {
        const fig = document.createElement('figure');
        fig.className = 'graphics-card';

        const promptIdx = i * 5 + 2;
        const modelIdx = i * 3 + 1;
        const prompt = prompts[promptIdx % prompts.length];
        const author = authors[promptIdx % authors.length];
        const model = models[modelIdx % models.length];
        const ts = timestamps[promptIdx % timestamps.length];

        fig.dataset.search = (prompt + ' ' + author.name + ' ' + model).toLowerCase();
        fig.dataset.listType = isVideo ? 'video' : 'graphics';
        fig.dataset.listName = prompt.toLowerCase();
        fig.dataset.listDate = String(timestamps.length - 1 - (promptIdx % timestamps.length));
        fig.dataset.listUsers = author.name.toLowerCase();

        /* Fake revisions — every nth card gets 2-5 historical revisions
           so the edit-mode rail has something to show. Distribution is
           deterministic from i so the same cards always carry history. */
        const revCountByMod = [0, 0, 2, 0, 3, 0, 4, 0, 2, 5, 0, 3];
        const revCount = revCountByMod[i % revCountByMod.length];
        const revisions = [];
        if (revCount > 0) {
          const ar = aspects[i % aspects.length];
          for (let r = 0; r < revCount; r++) {
            /* Pull a different asset from the pool for each prior
               revision — deterministic by (i, r). */
            let revSrc;
            if (isVideo) {
              const vidSrc = videoSourcesBase[(i * 7 + r * 11 + 3) % videoSourcesBase.length];
              revSrc = vidSrc.src;
            } else {
              const photoId = photosBase[(i * 7 + r * 11 + 3) % photosBase.length];
              revSrc = buildPhotoSrc(photoId, ar[0], ar[1]);
            }
            revisions.push({ src: revSrc, label: 'v' + (r + 1) });
          }
          /* Current asset is the LAST revision. */
          const currentSrc = isVideo ? src.src : buildPhotoSrc(src, ar[0], ar[1]);
          revisions.push({ src: currentSrc, label: 'v' + (revCount + 1) });
          fig.dataset.revisions = JSON.stringify(revisions);
          fig.dataset.revIsVideo = isVideo ? '1' : '0';
        }

        if (isVideo) {
          fig.style.aspectRatio = src.w + ' / ' + src.h;
          const vid = document.createElement('video');
          vid.src = src.src;
          vid.muted = true;
          vid.loop = true;
          vid.playsInline = true;
          vid.preload = 'metadata';
          vid.setAttribute('disablepictureinpicture', '');
          vid.addEventListener('loadeddata', () => vid.classList.add('loaded'), { once: true });
          fig.appendChild(vid);
          fig.addEventListener('mouseenter', () => {
            const p = vid.play();
            if (p && typeof p.catch === 'function') p.catch(() => {});
          });
          fig.addEventListener('mouseleave', () => {
            vid.pause();
            try { vid.currentTime = 0; } catch (_) {}
          });
        } else {
          const ar = aspects[i % aspects.length];
          fig.style.aspectRatio = ar[0] + ' / ' + ar[1];
          const img = document.createElement('img');
          img.src = buildPhotoSrc(src, ar[0], ar[1]);
          img.alt = prompt;
          img.loading = 'lazy';
          img.decoding = 'async';
          img.addEventListener('load', () => img.classList.add('loaded'));
          if (img.complete) requestAnimationFrame(() => img.classList.add('loaded'));
          fig.appendChild(img);
        }

        /* Hover overlay — mirrors canvas_3's makeOverlay structure
           1:1 so the .gco-* CSS styles it identically, including the
           full action cluster (Reply / Download / Delete / More) and
           the dropdown menu. SVG icons + menu items are duplicated
           here because canvas_3's constants live in a separate IIFE
           scope. Edit is the new top entry. */
        const c4MenuItems = isVideo
          ? '<button class="gco-menu-item" role="menuitem">Edit</button>' +
            '<button class="gco-menu-item" role="menuitem">Copy Prompt</button>' +
            '<button class="gco-menu-item" role="menuitem">Download</button>' +
            '<button class="gco-menu-item gco-menu-item-delete" role="menuitem">Delete</button>'
          : '<button class="gco-menu-item" role="menuitem">Edit</button>' +
            '<button class="gco-menu-item" role="menuitem">Copy Prompt</button>' +
            '<button class="gco-menu-item" role="menuitem">Copy as PNG</button>' +
            '<div class="gco-menu-divider" role="separator"></div>' +
            '<button class="gco-menu-item" role="menuitem">Share</button>' +
            '<button class="gco-menu-item" role="menuitem">Send to Video</button>' +
            '<button class="gco-menu-item" role="menuitem">Export Image</button>' +
            '<button class="gco-menu-item" role="menuitem">Expand</button>' +
            '<button class="gco-menu-item" role="menuitem">Download</button>' +
            '<button class="gco-menu-item gco-menu-item-delete" role="menuitem">Delete</button>';
        const c4ReplySvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg>';
        const c4DownloadSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.39 18.39A5 5 0 0 0 18 10h-1.26A8 8 0 1 0 3 16.3"/><path d="M8 14l4 4 4-4M12 18V9"/></svg>';
        const c4TrashSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>';
        const c4MoreSvg =
          '<svg class="gco-more-dots" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="12" cy="19" r="1.8"/></svg>' +
          '<svg class="gco-more-close" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="7" y1="7" x2="17" y2="17"/><line x1="7" y1="17" x2="17" y2="7"/></svg>';

        const overlay = document.createElement('div');
        overlay.className = 'graphics-card-overlay';
        overlay.innerHTML =
          '<div class="gco-glass">' +
            '<p class="gco-prompt">' + escapeHTML(prompt) + '</p>' +
            '<span class="gco-filetype">' + (isVideo ? 'Video' : 'Graphics') + '</span>' +
            '<div class="gco-meta-row">' +
              '<div class="gco-author">' +
                '<span class="gco-creator">' +
                  avatarHTML(author) +
                  '<span class="gco-name">' + escapeHTML(author.name) + '</span>' +
                '</span>' +
                '<span class="gco-model-chip">' + escapeHTML(model) + '</span>' +
                '<span class="gco-time">' + ts + '</span>' +
              '</div>' +
              '<div class="gco-actions">' +
                '<button class="gco-action" type="button" aria-label="Reply">' + c4ReplySvg + '</button>' +
                '<button class="gco-action" type="button" aria-label="Download">' + c4DownloadSvg + '</button>' +
                '<button class="gco-action gco-action-delete" type="button" aria-label="Delete">' + c4TrashSvg + '</button>' +
                '<button class="gco-action gco-action-more" type="button" aria-label="More options" aria-haspopup="menu" aria-expanded="false">' + c4MoreSvg + '</button>' +
                '<div class="gco-menu" role="menu" aria-hidden="true">' + c4MenuItems + '</div>' +
              '</div>' +
            '</div>' +
          '</div>';
        fig.appendChild(overlay);

        /* Revisions badge — only present on cards with edit history.
           Pill anchored top-left, fades in on card hover. Reads as a
           small "this asset has prior edits" affordance without
           requiring the user to enter edit mode. */
        if (revisions.length > 1) {
          const badge = document.createElement('span');
          badge.className = 'gco-rev-badge';
          badge.innerHTML =
            '<svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 5h10"/><path d="M3 8h10"/><path d="M3 11h10"/></svg>' +
            '<span>' + revisions.length + ' revisions</span>';
          fig.appendChild(badge);
        }

        /* IntersectionObserver-style in-view flip — without the full
           cardReveal infrastructure, just stamp .in-view immediately
           so the canvas_3 fade-in CSS doesn't keep cards invisible. */
        requestAnimationFrame(() => fig.classList.add('in-view'));

        frag.appendChild(fig);
      });
      grid.appendChild(frag);

      /* Truncation tooltip — when the .gco-name or .gco-model-chip
         is ellipsized, hovering shows the full text. Reuses the
         singleton tooltip canvas_3 already manages by calling the
         _show / _hide helpers it exposed on the tooltip element. */
      grid.querySelectorAll('.gco-name, .gco-model-chip').forEach(el => {
        el.addEventListener('mouseenter', () => {
          const tt = document.getElementById('truncTooltip');
          if (tt && typeof tt._show === 'function') tt._show(el);
        });
        el.addEventListener('mouseleave', () => {
          const tt = document.getElementById('truncTooltip');
          if (tt && typeof tt._hide === 'function') tt._hide();
        });
      });
    }

    /* --- Render: Audio (unchanged) ----------------------------- */

    function renderAudio(grid, assets) {
      grid.innerHTML = '';
      const frag = document.createDocumentFragment();
      assets.forEach((asset, i) => {
        const tile = document.createElement('div');
        tile.className = 'c4-audio-tile';
        tile.dataset.search = (asset.title + ' ' + asset.style + ' ' + asset.key).toLowerCase();
        /* TE-style head — mono caps title + mono tabular duration. */
        tile.innerHTML =
          '<div class="c4-audio-tile-head">' +
            '<span class="c4-audio-title">' + escapeHTML(asset.title) + '</span>' +
            '<span class="c4-audio-stats">' + escapeHTML(asset.dur) + '</span>' +
          '</div>' +
          '<div class="c4-audio-waves">' +
            '<div class="c4-audio-wave-row">' +
              '<span class="c4-audio-wave">' + waveformSVG(asset.title + '/mic1') + '</span>' +
            '</div>' +
          '</div>' +
          '<div class="c4-audio-foot">' +
            '<button class="c4-audio-play" type="button" aria-label="Play ' + escapeHTML(asset.title) + '" data-playing="0">' +
              '<svg class="c4-audio-play-icon" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true"><path d="M3 1.5l7.5 4.5-7.5 4.5V1.5z"/></svg>' +
              '<svg class="c4-audio-pause-icon" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true" style="display:none"><rect x="3" y="2" width="2.2" height="8"/><rect x="6.8" y="2" width="2.2" height="8"/></svg>' +
            '</button>' +
            '<div class="c4-audio-volume">' +
              '<svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 4.5h2L7 2.5v7L4 7.5H2z" fill="currentColor"/><path d="M9 4.5c.6.6.6 2.4 0 3"/></svg>' +
              '<input type="range" min="0" max="100" value="70" aria-label="Volume">' +
            '</div>' +
          '</div>';
        frag.appendChild(tile);
      });
      grid.appendChild(frag);

      /* Wire play/pause toggle — visual only; no <audio> playback
         yet, just swaps the play icon for the pause icon and locks
         the button to a white "playing" treatment. */
      grid.querySelectorAll('.c4-audio-play').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const playing = btn.dataset.playing === '1';
          btn.dataset.playing = playing ? '0' : '1';
          btn.querySelector('.c4-audio-play-icon').style.display = playing ? '' : 'none';
          btn.querySelector('.c4-audio-pause-icon').style.display = playing ? 'none' : '';
        });
      });
      /* Don't let slider interaction bubble up to tile-level clicks. */
      grid.querySelectorAll('.c4-audio-volume input').forEach(inp => {
        inp.addEventListener('click', (e) => e.stopPropagation());
        inp.addEventListener('mousedown', (e) => e.stopPropagation());
      });
    }

