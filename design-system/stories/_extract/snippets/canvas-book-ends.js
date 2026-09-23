// AUTO-EXTRACTED verbatim markup from canvas-book-ends/index.html — do not hand-edit.
// Each value is consumed by extracted() in ../lib.js: { note, minHeight, pad, html }.
export default {
  modal_coverlab: {
    note: '.cbe-modal-card (#bookendsModal) — Book Ends cover-lab: symbol chip-grid + tag chip-grid picker modal, shown open with the real default selections (05 FIELD symbol · V2 SPEC tag)',
    minHeight: 420,
    html: `<div class="app-modal open" id="bookendsModal" role="dialog" aria-modal="true" aria-labelledby="bookendsModalTitle" style="position:static;opacity:1;visibility:visible">
  <div class="app-modal-card cbe-modal-card" role="document" style="position:static;top:auto;left:auto;max-height:none;transform:none;opacity:1">
    <header class="app-modal-head">
      <h2 class="app-modal-title" id="bookendsModalTitle">Book Ends — Choose a Cover</h2>
      <div class="app-modal-head-actions">
        <button class="app-modal-close" type="button" aria-label="Close" id="bookendsModalClose">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="6" y1="18" x2="18" y2="6"/></svg>
        </button>
      </div>
    </header>
    <div class="cbe-mod-body">
      <section>
        <h3 class="cbe-mod-lbl">Cover Treatment</h3>
        <div class="cbe-chips" id="cbeFrontChips">
          <button type="button" class="cbe-chip" data-id="a11"><b>01</b>RAYS</button>
          <button type="button" class="cbe-chip" data-id="a03"><b>02</b>TICK</button>
          <button type="button" class="cbe-chip" data-id="a06"><b>03</b>BUBBLE</button>
          <button type="button" class="cbe-chip" data-id="a07"><b>04</b>BURST</button>
          <button type="button" class="cbe-chip active" data-id="a19"><b>05</b>FIELD</button>
          <button type="button" class="cbe-chip" data-id="a21"><b>06</b>GRID</button>
        </div>
      </section>
      <section>
        <h3 class="cbe-mod-lbl">Tag</h3>
        <div class="cbe-chips" id="cbeTagChips">
          <button type="button" class="cbe-chip" data-tag="1"><b>V1</b>INSTRUMENT</button>
          <button type="button" class="cbe-chip active" data-tag="2"><b>V2</b>SPEC</button>
          <button type="button" class="cbe-chip" data-tag="3"><b>V3</b>ORBIT</button>
          <button type="button" class="cbe-chip" data-tag="4"><b>V4</b>SEAL</button>
          <button type="button" class="cbe-chip" data-tag="5"><b>V5</b>BARCODE</button>
          <button type="button" class="cbe-chip" data-tag="6"><b>V6</b>LEDGER</button>
          <button type="button" class="cbe-chip" data-tag="7"><b>V7</b>REGISTRY</button>
          <button type="button" class="cbe-chip" data-tag="8"><b>V8</b>MARK</button>
        </div>
      </section>
    </div>
  </div>
</div>`
  },

  chip_variantgrid: {
    note: '.cbe-chips / .cbe-chip — bare 6-col numbered variant-picker grid (tag set shown, 8 items wrap to 2 rows; the same component drives the 6-item symbol grid above)',
    minHeight: 110,
    html: `<div class="cbe-chips" id="cbeTagChips">
  <button type="button" class="cbe-chip" data-tag="1"><b>V1</b>INSTRUMENT</button>
  <button type="button" class="cbe-chip active" data-tag="2"><b>V2</b>SPEC</button>
  <button type="button" class="cbe-chip" data-tag="3"><b>V3</b>ORBIT</button>
  <button type="button" class="cbe-chip" data-tag="4"><b>V4</b>SEAL</button>
  <button type="button" class="cbe-chip" data-tag="5"><b>V5</b>BARCODE</button>
  <button type="button" class="cbe-chip" data-tag="6"><b>V6</b>LEDGER</button>
  <button type="button" class="cbe-chip" data-tag="7"><b>V7</b>REGISTRY</button>
  <button type="button" class="cbe-chip" data-tag="8"><b>V8</b>MARK</button>
</div>`
  },

  card_fanlight: {
    note: '.cbe-ff.cbe-f-39 (#cbeFrontBoard) — FANLIGHT concentric-ring cover: TICK symbol, 3 rings (base + outer 1.3x + inner 0.7x) sharing one center, all masked from a single ring SVG',
    minHeight: 860,
    html: `<div class="brief-stack" style="--stack-w:640px;padding:0">
  <article class="brief-board cbe-shell cbe-shell-front" id="cbeFrontBoard" data-section="cover" data-nav-section="overview">
    <div class="cbe-ff cbe-f-39">
      <div class="cbe-ff-meta">
        <div class="col">
          <p class="lb">Client</p>
          <p>BuildSubmarines.com</p>
          <p class="lb sp">Assignment</p>
          <p>Paint Scheme Design Contest</p>
          <p class="lb sp">Submission Window</p>
          <p>June 19 – July 20</p>
          <p class="lb sp">Status</p>
          <p>For Creative Team Distribution</p>
        </div>
        <div class="cbe-ff-date">04.28.2026</div>
      </div>
      <h1 class="cbe-ff-title">Roblox Racing Wrap Competition</h1>
      <div class="cbe-f39-frame cbe-photo-slot" data-slot="39">
        <div class="cbe-parallax" data-parallax>
          <div class="cbe-f39-sym" data-sym="a03" aria-hidden="true" style="-webkit-mask-image:url('brand-assets/p49-a03.ring.svg');mask-image:url('brand-assets/p49-a03.ring.svg')"></div>
          <div class="cbe-f39-sym cbe-f39-sym-outer" aria-hidden="true"></div>
          <div class="cbe-f39-sym cbe-f39-sym-inner" aria-hidden="true"></div>
          <div class="cbe-f39-sym cbe-f39-sym-outer-b06" aria-hidden="true"></div>
        </div>
        <input type="file" accept="image/*" class="cbe-photo-slot-file" hidden>
        <img class="cbe-photo-slot-img" alt="">
        <div class="cbe-photo-slot-hint" aria-hidden="true"><svg viewBox="0 0 256 256"><path d="M222,144v64a6,6,0,0,1-6,6H40a6,6,0,0,1-6-6V144a6,6,0,0,1,12,0v58H210V144a6,6,0,0,1,12,0ZM92.24,76.24,122,46.49V144a6,6,0,0,0,12,0V46.49l29.76,29.75a6,6,0,0,0,8.48-8.48l-40-40a6,6,0,0,0-8.48,0l-40,40a6,6,0,0,0,8.48,8.48Z"/></svg></div>
        <div class="cbe-photo-slot-remove" aria-hidden="true"><svg viewBox="0 0 256 256"><path d="M204.24,195.76a6,6,0,1,1-8.49,8.48L128,136.49,60.24,204.24a6,6,0,0,1-8.48-8.48L119.51,128,51.76,60.24a6,6,0,1,1,8.48-8.48L128,119.51l67.76-67.75a6,6,0,1,1,8.49,8.48L136.49,128Z"/></svg></div>
        <div class="cbe-photo-slot-cropborder" aria-hidden="true"></div>
        <div class="cbe-photo-slot-croplabel" aria-hidden="true">Drag to reposition</div>
        <button type="button" class="cbe-photo-slot-confirm" aria-label="Confirm crop"><svg viewBox="0 0 256 256" fill="currentColor"><path d="M232.49,80.49l-128,128a12,12,0,0,1-17,0l-56-56a12,12,0,1,1,17-17L96,183,215.51,63.51a12,12,0,0,1,17,17Z"/></svg></button>
      </div>
    </div>
  </article>
</div>`
  }
};
