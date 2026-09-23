/* ------------------------------------------------------------------
   CANVAS SHELL — the big virtual world the camera flies around.
   Now a fuller app, matching chat-hat.vercel.app: top header with the
   workspace + coloured asset tabs, the left rail (CANVAS + tools), the
   chat panel (Canvas Assistant greeting + chat hat), and the canvas
   with the OMNI ✦ empty-state logo. The camera establishes the whole
   app, then flies in to each feature.
------------------------------------------------------------------ */

export const WORLD_W = 1880;
export const WORLD_H = 1150;

const LOGO_SVG = `
<svg class="cs-hero-logo" viewBox="-40 -30 476 143" preserveAspectRatio="xMidYMid meet" overflow="visible" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <g>
    <path d="M47 0L35.11 0.35C17.43 3.04 3.38 16.88 0.41 34.88L0 47C3.07 67 20.39 81.93 40.63 82.09C61.07 82.24 78.55 67.22 81.43 46.38C84.53 23.92 68.53 3.84 47 0ZM40.84 61.69C29.46 61.69 20.23 52.46 20.23 41.08C20.23 29.7 29.46 20.47 40.84 20.47C52.22 20.47 61.45 29.7 61.45 41.08C61.45 52.46 52.22 61.69 40.84 61.69Z" fill="#0a0a0a"/>
    <path d="M156.33 80.93L155.99 33.11L135.94 69.03L134.3 70.9C133.81 71.46 131.86 69.99 131.69 69.43L111.1 32.22L110.69 80.83L90.6701 80.93L90.6401 1.49001C98.2501 0.950013 105.62 0.950013 113.88 1.37001L133.77 37.06L153.52 1.46001C161.31 0.930014 168.66 0.940013 176.92 1.48001V80.78L156.34 80.93H156.33Z" fill="#0a0a0a"/>
    <path d="M260.86 80.75L235.94 80.98L210.48 35.3699L210.15 80.95L190.05 80.79L190.02 1.65995C197.26 0.929951 204.26 0.899951 211.79 1.37001L240.03 49.93L240.46 1.40995C247.38 0.999951 253.59 0.999951 260.84 1.47995L260.86 80.74V80.75Z" fill="#0a0a0a"/>
    <path d="M293.95 1H273.59V80.91H293.95V1Z" fill="#0a0a0a"/>
    <path d="M357.9 78.5401C354.7 65.6801 350.84 50.1601 337.75 46.2801L320.54 41.1801L332.68 37.6201C350.8 32.3101 353.63 21.1701 357.82 3.11011L364.09 23.7701C371.83 36.0101 381.99 37.1301 395.47 41.2301C379.11 45.0601 367.12 47.9901 361.76 64.7501L357.9 78.5501V78.5401Z" fill="#0a0a0a"/>
  </g>
</svg>`;

const ICON_AGENTS = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="7" width="16" height="12" rx="2.5"/><circle cx="9" cy="13" r="1.4" fill="currentColor" stroke="none"/><circle cx="15" cy="13" r="1.4" fill="currentColor" stroke="none"/><line x1="12" y1="3.5" x2="12" y2="7"/><circle cx="12" cy="3.5" r="1" fill="currentColor" stroke="none"/></svg>`;
const ICON_KB = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5.5" rx="8" ry="2.5"/><path d="M4 5.5v6c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5v-6"/><path d="M4 11.5v6c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5v-6"/></svg>`;
const ICON_TOOLS = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6.5V5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5v1.5"/><path d="M3 11.5 L3 8 A1.5 1.5 0 0 1 4.5 6.5 L19.5 6.5 A1.5 1.5 0 0 1 21 8 L21 11.5 Z"/><path d="M3 11.5 L21 11.5 L21 18 A1.5 1.5 0 0 1 19.5 19.5 L4.5 19.5 A1.5 1.5 0 0 1 3 18 Z"/><rect x="10" y="13.5" width="4" height="2.5" rx="0.5"/></svg>`;
const ICON_BOLT = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M13 3 5.6 13.4h4.9L11 21l7.4-10.4h-4.9L13 3z"/></svg>`;
const ICON_INS = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="12" height="17" rx="1.5"/><path d="M9 3.5h6v3H9z"/><line x1="9" y1="11" x2="15" y2="11"/><line x1="9" y1="14" x2="15" y2="14"/><line x1="9" y1="17" x2="13" y2="17"/></svg>`;
// Sparkles rail tool — same glyph as the composer send button (the
// product's existing sparkle asset), scaled slightly inward so its
// optical weight sits with the stroked neighbours.
const ICON_SPARKLES = `<svg viewBox="0 0 24 24" fill="currentColor"><g transform="translate(12 12) scale(0.88) translate(-12 -12)"><path d="M9 5 L10.6 11.4 L17 13 L10.6 14.6 L9 21 L7.4 14.6 L1 13 L7.4 11.4 Z"/><path d="M17 3 L17.7 5.3 L20 6 L17.7 6.7 L17 9 L16.3 6.7 L14 6 L16.3 5.3 Z"/></g></svg>`;

// Tab icon glyphs (dark, on the coloured square) — viewBox 0 0 24 24.
const GLYPH_GRAPHICS = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 7.5H8.5C7.9485 7.5 7.5 7.9485 7.5 8.5V15.5C7.5 16.0515 7.9485 16.5 8.5 16.5H15.5C16.0515 16.5 16.5 16.0515 16.5 15.5V8.5C16.5 7.9485 16.0515 7.5 15.5 7.5ZM8.5 15.5V8.5H15.5L15.501 15.5H8.5Z"/><path d="M11 13L10.5 12.5L9 14.5H15L12.5 11L11 13Z"/></svg>`;
const GLYPH_VIDEO = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M15 11.5C15 11.0205 14.66 10.6195 14.2095 10.523C14.3895 10.2225 14.5 9.875 14.5 9.5C14.5 8.397 13.603 7.5 12.5 7.5C11.7415 7.5 11.0895 7.9285 10.75 8.552C10.4105 7.9285 9.7585 7.5 9 7.5C7.897 7.5 7 8.397 7 9.5C7 9.951 7.156 10.3635 7.4085 10.698C7.28229 10.7903 7.17956 10.911 7.1086 11.0503C7.03764 11.1896 7.00044 11.3437 7 11.5V15.5C7 16.0515 7.4485 16.5 8 16.5H14C14.5515 16.5 15 16.0515 15 15.5V14.181L17 15.181V11.681L15 12.681V11.5ZM12.5 8.5C13.0515 8.5 13.5 8.9485 13.5 9.5C13.5 10.0515 13.0515 10.5 12.5 10.5C11.9485 10.5 11.5 10.0515 11.5 9.5C11.5 8.9485 11.9485 8.5 12.5 8.5ZM9 8.5C9.5515 8.5 10 8.9485 10 9.5C10 10.0515 9.5515 10.5 9 10.5C8.4485 10.5 8 10.0515 8 9.5C8 8.9485 8.4485 8.5 9 8.5ZM8 15.5V11.5H14L14.001 15.5H8Z"/></svg>`;
const GLYPH_AUDIO = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.5 10.5H12.5V13.5H11.5V10.5ZM13.5 9H14.5V15H13.5V9ZM9.5 8H10.5V16H9.5V8ZM15.5 11.5H16.5V12.5H15.5V11.5ZM7.5 11H8.5V13H7.5V11Z"/></svg>`;
const GLYPH_TEXT = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8.5 10H9.5V9H11.126L9.84 15H8.5V16H12.5V15H11.374L12.66 9H14.5V10H15.5V8H8.5V10Z"/></svg>`;
const GLYPH_CANVAS = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.82 6.22C11.85 6.09 10.88 6.2 9.97 6.54C9.06 6.88 8.24 7.44 7.6 8.17C7.05 8.8 6.65 9.54 6.41 10.34C6.17 11.14 6.11 11.99 6.22 12.82C6.53 15.09 8.24 17.02 10.47 17.63C10.97 17.76 11.48 17.83 12 17.83L12.08 17.83C12.38 17.83 12.67 17.75 12.92 17.6C13.18 17.46 13.4 17.25 13.55 17C13.71 16.75 13.79 16.47 13.81 16.17C13.83 15.88 13.77 15.59 13.64 15.32L13.52 15.08C13.43 14.9 13.39 14.71 13.4 14.51C13.41 14.32 13.47 14.13 13.58 13.96C13.73 13.72 13.97 13.54 14.24 13.45C14.52 13.37 14.82 13.4 15.08 13.52L15.32 13.64C15.56 13.75 15.82 13.81 16.08 13.81C16.54 13.81 16.98 13.63 17.31 13.3C17.64 12.98 17.82 12.54 17.83 12.08C17.84 11.54 17.77 11 17.63 10.47C17.02 8.24 15.09 6.53 12.82 6.22ZM15.83 12.59L15.59 12.47C14.52 11.96 13.21 12.36 12.59 13.34C12.16 14.03 12.12 14.85 12.47 15.58L12.59 15.83C12.63 15.91 12.65 16.01 12.65 16.11C12.64 16.21 12.61 16.3 12.56 16.39C12.51 16.47 12.43 16.54 12.35 16.59C12.26 16.64 12.16 16.67 12.06 16.67H12C11.59 16.67 11.18 16.61 10.78 16.5C8.99 16.02 7.63 14.47 7.38 12.66C7.19 11.29 7.58 9.96 8.48 8.93C8.99 8.35 9.64 7.9 10.37 7.62C11.1 7.35 11.89 7.27 12.66 7.38C14.47 7.63 16.02 8.99 16.5 10.78C16.62 11.2 16.67 11.64 16.67 12.06C16.66 12.54 16.17 12.75 15.83 12.59Z"/><circle cx="9.37" cy="13.46" r="0.88"/><circle cx="9.37" cy="11.12" r="0.88"/><circle cx="11.12" cy="9.37" r="0.88"/><circle cx="13.46" cy="9.37" r="0.88"/></svg>`;

// Tab icon colours/glyphs lifted verbatim from chat-hat.vercel.app.
const TABS = [
  { label: 'Canvas', bg: '#3FCBC4', fg: '#052723', glyph: GLYPH_CANVAS, active: true },
];

export const CANVAS_SHELL_HTML = `
<div class="canvas-world" id="canvas-world">
  <div class="canvas-shell" id="canvas-shell">

    <header class="cs-header">
      <span class="cs-menu-btn">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
      </span>
      <span class="cs-omni-cell"><span class="cs-logo">OMNI<i class="cs-logo-star">✦</i></span></span>
      <span class="cs-home-cell">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 11.5L12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1v-8.5z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>
      </span>
      <span class="cs-workspace">Omnicom Precision Marketing <i class="cs-caret">⌄</i></span>
      <div class="cs-tabs">
        ${TABS.map(t => `<span class="cs-tab ${t.active ? 'active' : ''}"><span class="cs-tab-dot" style="background:${t.bg};color:${t.fg}">${t.glyph}</span>${t.label}</span>`).join('')}
        <span class="cs-tab-add">+</span>
      </div>
      <span class="cs-spacer"></span>
      <span class="cs-avatar"><span class="pill">BC</span> Bryan <i class="cs-caret">⌄</i></span>
    </header>

    <aside class="cs-rail">
      <span class="cs-rail-collapse">‹</span>
      <span class="cs-rail-tag">CANVAS</span>
      <span class="cs-rail-spacer"></span>
      <div class="cs-rail-tools">
        <span class="cs-rail-tool" id="rail-tool-agents">${ICON_AGENTS}
          <span class="cs-rail-tip" id="rail-tip">
            <span class="cs-rail-tip-title">Agents</span>
            <span class="cs-rail-tip-body"><b>0</b> of <b>68</b> workspace agents are available in this Canvas</span>
          </span>
        </span>
        <span class="cs-rail-tool">${ICON_TOOLS}</span>
        <span class="cs-rail-tool">${ICON_KB}</span>
        <span class="cs-rail-tool">${ICON_BOLT}</span>
        <span class="cs-rail-tool">${ICON_SPARKLES}</span>
        <span class="cs-rail-tool">${ICON_INS}</span>
      </div>
    </aside>

    <section class="cs-main">
      <div class="cs-chat" id="cs-chat">
       <div class="cs-chat-group" id="cs-chat-group">

        <!-- Canvas Assistant greeting (top of the chat column) -->
        <div class="cs-greeting" id="cs-greeting">
          <div class="cs-greeting-head">
            <span class="cs-greeting-avatar"><svg width="20" height="20" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5.5" r="2.6" fill="currentColor"/><path d="M2.5 14c0-3 2.5-5 5.5-5s5.5 2 5.5 5" fill="currentColor"/></svg></span>
            <span class="cs-greeting-name">Canvas Assistant</span>
            <span class="cs-greeting-dot"></span>
            <span class="cs-greeting-time">Today, 5:39 PM</span>
          </div>
          <p class="cs-greeting-prompt">What can I help with?</p>
        </div>

        <div class="cs-chat-spacer"></div>

        <!-- Chat hat: chat-aux-panel + composer -->
        <div class="chat-hat-stack" id="chat-hat">
          <aside class="chat-aux-panel is-expanded">
            <header class="chat-aux-head">
              <span class="chat-aux-title">What would you like to create?</span>
              <button class="chat-aux-toggle" type="button" aria-label="Toggle">
                <svg viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d="M3 5l4 4 4-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
            </header>
            <div class="chat-aux-body">
              <div class="chat-aux-body-inner">
                <div class="chat-aux-chips" id="chat-hat-chips">
                  <button class="chat-aux-chip" data-chip type="button"><span>Creative Brief</span><span class="chat-aux-chip-caret">›</span></button>
                  <button class="chat-aux-chip" data-chip type="button"><span>Moodboard</span><span class="chat-aux-chip-caret">›</span></button>
                  <button class="chat-aux-chip" data-chip type="button"><span>Storyboard</span><span class="chat-aux-chip-caret">›</span></button>
                  <button class="chat-aux-chip" data-chip type="button"><span>Deep Research</span><span class="chat-aux-chip-caret">›</span></button>
                  <button class="chat-aux-chip" data-chip type="button"><span>Persona</span><span class="chat-aux-chip-caret">›</span></button>
                  <button class="chat-aux-chip" data-chip type="button"><span>Mockups</span><span class="chat-aux-chip-caret">›</span></button>
                  <button class="chat-aux-chip" data-chip type="button"><span>Project Plan</span><span class="chat-aux-chip-caret">›</span></button>
                  <button class="chat-aux-chip" data-chip type="button"><span>Instagram Post</span><span class="chat-aux-chip-caret">›</span></button>
                </div>
              </div>
            </div>
          </aside>

          <div class="composer-wrap">
            <div class="composer">
              <div class="composer-textarea" style="position:relative">
                <span class="xgg-composer-rest" data-composer-rest>Type your message…</span>
                <span class="xgg-composer-typed" data-typed-prompt aria-hidden="true"></span>
                <span class="xgg-composer-caret" data-composer-caret></span>
              </div>
              <div class="composer-actions">
                <button class="round-btn ghost composer-add" type="button" aria-label="Add">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
                </button>
                <div class="composer-right">
                  <div class="model-selector-wrap" id="model-wrap">
                    <button class="model-selector-pill" id="model-pill" type="button">
                      <span class="model-label" id="model-label">Claude Sonnet 4.6</span>
                      <span class="model-caret" aria-hidden="true">
                        <svg width="16" height="16" viewBox="0 0 10 10" fill="none"><path d="M2 4l3 3 3-3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
                      </span>
                    </button>
                  </div>
                  <button class="round-btn send" type="button" aria-label="Send">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M9 5 L10.6 11.4 L17 13 L10.6 14.6 L9 21 L7.4 14.6 L1 13 L7.4 11.4 Z"/>
                      <path d="M17 3 L17.7 5.3 L20 6 L17.7 6.7 L17 9 L16.3 6.7 L14 6 L16.3 5.3 Z"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
       </div>
      </div>

      <div class="cs-canvas-side" id="cs-canvas-side">
        <div class="cs-canvas-top">
          <div class="cs-canvas-crumb">
            <span class="cs-canvas-eyebrow">CORVACHE</span>
            <span class="cs-canvas-name">Coastline Launch Plan <i class="cs-caret cs-crumb-caret"><svg width="14" height="14" viewBox="0 0 10 10" fill="none" aria-hidden="true"><path d="M2 3.5l3 3 3-3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg></i></span>
          </div>
          <span class="cs-spacer"></span>
          <span class="cs-presence"><i class="cs-presence-dot"></i>3</span>
          <span class="cs-canvas-share">Share
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="4" cy="8" r="1.6" stroke="currentColor" stroke-width="1.3"/><circle cx="12" cy="4" r="1.6" stroke="currentColor" stroke-width="1.3"/><circle cx="12" cy="12" r="1.6" stroke="currentColor" stroke-width="1.3"/><path d="M5.4 7.1l5.2-2.6M5.4 8.9l5.2 2.6" stroke="currentColor" stroke-width="1.3"/></svg>
          </span>
        </div>

        <div class="cs-canvas-stage">
          <div class="cs-canvas-hero" id="canvas-hero">${LOGO_SVG}</div>
          <div class="vig-layer" id="vig-multimodal"></div>
          <div class="vig-layer" id="vig-agents"></div>
          <div class="vig-layer" id="vig-feature"></div>
        </div>
      </div>
    </section>

    <footer class="cs-footer">
      <span class="cs-footer-copy">© 2026 Omnicom Group Inc.</span>
      <span class="cs-footer-logo">OMNI<i class="cs-logo-star">✦</i></span>
      <span class="cs-footer-links">
        <a>FAQs</a><a>Code of Conduct</a><a>Acceptable Use Policy</a><a>Privacy Policy</a><a>Data Subject Access Request</a>
      </span>
    </footer>

  </div>

  <!-- SCROLL CANVAS — the flat, chrome-free surface the generation
       vignettes stack DOWN once the composer beat ends. A huge solid
       plane (covers every framing, no shell/footer ever visible) with
       a vertical stack of three sections the camera tracks down:
       S1 images → S2 video → S3 copy+insights → pull-back finale. -->
  <div class="scroll-canvas" id="scroll-canvas">
    <div class="scroll-abundance" id="scroll-abundance"></div>
    <div class="scroll-stack" id="scroll-stack">
      <section class="scroll-sec" id="scroll-s1"></section>
      <section class="scroll-sec" id="scroll-s2"></section>
      <section class="scroll-sec" id="scroll-s3"></section>
    </div>
  </div>
</div>
`;

export function mountCanvasShell(host) {
  host.innerHTML = CANVAS_SHELL_HTML;
  return {
    world:       host.querySelector('#canvas-world'),
    shell:       host.querySelector('#canvas-shell'),
    chat:        host.querySelector('#cs-chat'),
    chatGroup:   host.querySelector('#cs-chat-group'),
    greeting:    host.querySelector('#cs-greeting'),
    chatHat:     host.querySelector('#chat-hat'),
    chips:       Array.from(host.querySelectorAll('[data-chip]')),
    chipsHost:   host.querySelector('#chat-hat-chips'),
    modelPill:   host.querySelector('#model-pill'),
    modelLabel:  host.querySelector('#model-label'),
    modelCaret:  host.querySelector('#model-pill .model-caret'),
    modelWrap:   host.querySelector('#model-wrap'),
    composer:    host.querySelector('.composer'),
    canvasSide:  host.querySelector('#cs-canvas-side'),
    canvasStage: host.querySelector('.cs-canvas-stage'),
    hero:        host.querySelector('#canvas-hero'),
    heroLogo:    host.querySelector('#canvas-hero .cs-hero-logo'),
    railAgents:  host.querySelector('#rail-tool-agents'),
    railTip:     host.querySelector('#rail-tip'),
    layerMulti:  host.querySelector('#vig-multimodal'),
    layerAgents: host.querySelector('#vig-agents'),
    layerFeature:host.querySelector('#vig-feature'),
    scrollCanvas: host.querySelector('#scroll-canvas'),
    scrollAbundance: host.querySelector('#scroll-abundance'),
    scrollStack:  host.querySelector('#scroll-stack'),
    scrollS1:     host.querySelector('#scroll-s1'),
    scrollS2:     host.querySelector('#scroll-s2'),
    scrollS3:     host.querySelector('#scroll-s3'),
  };
}

/* ---- Camera helper ----------------------------------------- */
const VIEWPORT_W = 938;
const VIEWPORT_H = 800;

export function cameraFor(target, scale, offset = {}) {
  // Default x/y individually so a partial offset like {x:-150} doesn't
  // leave offset.y undefined → NaN camera y.
  const offX = offset.x || 0;
  const offY = offset.y || 0;
  let ox = 0, oy = 0;
  let el = target;
  while (el && !el.classList.contains('canvas-world')) {
    ox += el.offsetLeft;
    oy += el.offsetTop;
    el = el.offsetParent;
  }
  const cx = ox + target.offsetWidth  / 2;
  const cy = oy + target.offsetHeight / 2;
  return {
    x: VIEWPORT_W / 2 - scale * cx + offX,
    y: VIEWPORT_H / 2 - scale * cy + offY,
    scale,
  };
}
