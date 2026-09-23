// AUTO-EXTRACTED verbatim markup from canvas-collab/demos/corvash-strategist/index.html — do not hand-edit.
// Each value is consumed by extracted() in ../lib.js: { note, minHeight, pad, bodyClass, html }.
// Source is a JS-rendered doc (renderer.js from ../../shared/content/*.json), so this markup was
// captured from the live DOM after interacting with each affordance, not read statically off the
// HTML file. Two verbatim-DOM adjustments were necessary for correct isolated rendering (both noted
// inline below): (1) [data-reveal] elements ship opacity:0 until reveal.js's IntersectionObserver
// adds .is-visible — that JS never runs in the extracted iframe, so .is-visible is added by hand to
// reproduce the settled/scrolled-into-view state. (2) .doc-edit-controls is position:absolute with
// top/left written by JS as page-scroll-relative pixels — those are meaningless outside the original
// scroll position, so they're replaced with wrapper-relative coordinates that reproduce the same
// "flush against the field's left edge, 8px below its bottom" placement the component's own
// positionControls() computes.
export default {
  ask_panel: {
    note: '.ask-side — Ask sidecar (ask-treatments.js): fixed right-hand panel, mid-conversation with one answered turn and its "Added to Questions from readers" jump chip; open to any reader, not edit-gated',
    minHeight: 560,
    pad: '0',
    html: `<aside class="ask-side is-open" aria-label="Ask about this report">
    <header class="ask-side__head">
      <span class="ask-side__title"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2 Q13.2 10.8 22 12 Q13.2 13.2 12 22 Q10.8 13.2 2 12 Q10.8 10.8 12 2 Z" transform="translate(-1.4 1.6) scale(0.86)"></path><path d="M12 2 Q13.2 10.8 22 12 Q13.2 13.2 12 22 Q10.8 13.2 2 12 Q10.8 10.8 12 2 Z" transform="translate(15.1 -0.6) scale(0.30)"></path></svg><span>Ask this report</span></span>
      <button class="ask-side__close" type="button" aria-label="Close"><svg viewBox="0 0 256 256" fill="currentColor"><path d="M204.24,195.76a6,6,0,1,1-8.48,8.48L128,136.49,60.24,204.24a6,6,0,0,1-8.48-8.48L119.51,128,51.76,60.24a6,6,0,0,1,8.48-8.48L128,119.51l67.76-67.75a6,6,0,0,1,8.48,8.48L136.49,128Z"></path></svg></button>
    </header>
    <div class="ask-side__scroll">
      <div class="ask-side__thread"><div class="ask-side__turn">
        <p class="ask-side__q">What drove configurator growth this year?</p>
        <div class="ask-side__stage"></div>
        <p class="ask-side__a"><span>Configurator sessions were 2.4× versus 2024 — the fastest-growing number in the review — though the brief argues the order book (retention), not the funnel, is now the bigger lever.</span></p>
        <div class="ask-side__committed"><button class="ask-jump" type="button">Added to Questions from readers ↓</button></div></div></div>
    </div>
    <footer class="ask-side__foot"><div class="ask-input">
    <input type="text" placeholder="Ask a question…" autocomplete="off" spellcheck="false" aria-label="Ask a question…">
    <button class="ask-input__send" type="button" aria-label="Ask"><svg viewBox="0 0 24 24" fill="none"><path d="M12 19V6M6 11l6-6 6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg></button></div></footer></aside>`
  },

  faq: {
    note: '.doc-faq-section — auto-FAQ board (ask-affordance.js): every answered question commits here under "Questions from readers", numbered, sourced "From the report"; materializes the first time anyone asks',
    minHeight: 240,
    html: `<section class="doc-section doc-faq-section doc-faq--arrive">
    <span class="doc-eyebrow is-visible" data-reveal style="--reveal-delay: 0ms;">Asked &amp; Answered</span>
    <h2 class="doc-heading doc-heading--sub is-visible" data-reveal style="--reveal-delay: 70ms;">Questions from readers</h2>
    <div class="doc-faq__list">
      <div class="doc-faq__item">
        <span class="doc-faq__n" aria-hidden="true">01</span>
        <div class="doc-faq__body">
          <p class="doc-faq__q">What drove configurator growth this year?</p>
          <div class="doc-faq__answer">
            <span class="doc-faq__by">From the report</span>
            <p class="doc-faq__a">Configurator sessions were 2.4× versus 2024 — the fastest-growing number in the review — though the brief argues the order book (retention), not the funnel, is now the bigger lever.</p>
          </div>
        </div>
      </div></div></section>`
  },

  editfield: {
    note: '.doc-edit-controls — inline text-fix affordance (edit-affordance.js): click any [data-edit-key] field to edit it in place, caret at the click point; the attached pill is Reset · Cancel · Confirm. Requires body.can-edit (permission-gated, not a mode toggle)',
    minHeight: 190,
    bodyClass: 'can-edit',
    html: `<div style="position:relative;max-width:640px">
  <p class="doc-body is-editing-field" data-edit-key="exec-summary::body::0" data-edit-original="2025 was less about a single breakout moment and more about steady, compounding gains across every channel we touch. Demand grew fastest at the top — configurator sessions more than doubled — but the more durable story is the order book: the deposit holders we earned in Q1 are still with us in Q4, and they're speccing richer builds each time they come back." contenteditable="true">2025 was less about a single breakout moment and more about steady, compounding gains across every channel we touch. Demand grew fastest at the top — configurator sessions more than doubled — but the more durable story is the order book: the deposit holders we earned in Q1 are still with us in Q4, and they're speccing richer builds each time they come back.</p>
  <span class="doc-edit-controls" style="top: calc(100% + 8px); left: 0px;">
    <span class="doc-edit-normal-inner">

      <button type="button" class="doc-edit-reset" aria-label="Reset to original"><svg viewBox="0 0 256 256" fill="currentColor"><path d="M222,128a94,94,0,0,1-92.74,94H128a93.43,93.43,0,0,1-64.5-25.65,6,6,0,1,1,8.24-8.72A82,82,0,1,0,70,70l-.19.19L39.44,98H72a6,6,0,0,1,0,12H24a6,6,0,0,1-6-6V56a6,6,0,0,1,12,0V90.34L61.63,61.4A94,94,0,0,1,222,128Z"></path></svg></button>
      <span class="doc-edit-controls__divider" aria-hidden="true"></span>
      <button type="button" class="doc-edit-cancel" aria-label="Cancel edit"><svg viewBox="0 0 256 256" fill="currentColor"><path d="M204.24,195.76a6,6,0,1,1-8.48,8.48L128,136.49,60.24,204.24a6,6,0,0,1-8.48-8.48L119.51,128,51.76,60.24a6,6,0,0,1,8.48-8.48L128,119.51l67.76-67.75a6,6,0,0,1,8.48,8.48L136.49,128Z"></path></svg></button>
      <button type="button" class="doc-edit-commit" aria-label="Save edit"><svg viewBox="0 0 256 256" fill="currentColor"><path d="M228.24,76.24l-128,128a6,6,0,0,1-8.48,0l-56-56a6,6,0,0,1,8.48-8.48L96,191.51,219.76,67.76a6,6,0,0,1,8.48,8.48Z"></path></svg></button>
    </span>
    <span class="doc-edit-confirmreset-inner">
      <span class="doc-edit-confirmreset__label">Reset to original?</span>
      <button type="button" class="doc-edit-confirmreset__no" aria-label="Keep editing"><svg viewBox="0 0 256 256" fill="currentColor"><path d="M204.24,195.76a6,6,0,1,1-8.48,8.48L128,136.49,60.24,204.24a6,6,0,0,1-8.48-8.48L119.51,128,51.76,60.24a6,6,0,0,1,8.48-8.48L128,119.51l67.76-67.75a6,6,0,0,1,8.48,8.48L136.49,128Z"></path></svg></button>
      <button type="button" class="doc-edit-confirmreset__yes" aria-label="Confirm reset"><svg viewBox="0 0 256 256" fill="currentColor"><path d="M228.24,76.24l-128,128a6,6,0,0,1-8.48,0l-56-56a6,6,0,0,1,8.48-8.48L96,191.51,219.76,67.76a6,6,0,0,1,8.48,8.48Z"></path></svg></button>
    </span></span>
</div>`
  },

  addsection: {
    note: '.doc-add-composer — add-a-section control (add-section-affordance.js), open state after clicking the "+ Add section" seam between boards: header/body/bullets fields + image-or-video media tabs, Cancel/Add row. Requires body.can-edit',
    minHeight: 620,
    bodyClass: 'can-edit',
    html: `<div class="doc-add-composer">
    <div class="doc-add-composer__head">
      <span class="doc-add-composer__eyebrow">New section</span>
    </div>

    <div class="doc-add-composer__field">
      <span class="doc-add-composer__lbl">
        Header
        <span class="doc-add-composer__hint">optional</span>
        <span class="doc-add-composer__count" data-count>0/64</span>
      </span>
      <input class="doc-add-composer__header" type="text" maxlength="64" placeholder="Name this section">
    </div>

    <div class="doc-add-composer__field">
      <span class="doc-add-composer__lbl">Body</span>
      <textarea class="doc-add-composer__body" placeholder="Write the section's copy…" rows="3"></textarea>
    </div>

    <div class="doc-add-composer__field">
      <span class="doc-add-composer__lbl">
        Bullets
        <span class="doc-add-composer__hint">optional · one per line</span>
      </span>
      <textarea class="doc-add-composer__bullets" placeholder="Supporting points…" rows="2"></textarea>
    </div>

    <div class="doc-add-composer__field doc-add-composer__field--media">
      <span class="doc-add-composer__lbl">Media <span class="doc-add-composer__hint">optional</span></span>
      <div class="doc-add-composer__media-tabs">
        <button type="button" class="doc-add-composer__media-tab" data-media="image"><svg viewBox="0 0 256 256" fill="currentColor"><path d="M216,42H40A14,14,0,0,0,26,56V200a14,14,0,0,0,14,14H216a14,14,0,0,0,14-14V56A14,14,0,0,0,216,42ZM40,54H216a2,2,0,0,1,2,2V163.57L188.53,134.1a14,14,0,0,0-19.8,0l-21.42,21.42L101.9,110.1a14,14,0,0,0-19.8,0L38,154.2V56A2,2,0,0,1,40,54ZM38,200V171.17l52.58-52.58a2,2,0,0,1,2.84,0L176.83,202H40A2,2,0,0,1,38,200Zm178,2H193.8l-38-38,21.41-21.42a2,2,0,0,1,2.83,0l38,38V200A2,2,0,0,1,216,202ZM146,100a10,10,0,1,1,10,10A10,10,0,0,1,146,100Z"></path></svg><span>Image</span></button>
        <button type="button" class="doc-add-composer__media-tab" data-media="video"><svg viewBox="0 0 256 256" fill="currentColor"><path d="M250.83,74.71a6,6,0,0,0-6.16.3L206,100.79V72a14,14,0,0,0-14-14H32A14,14,0,0,0,18,72V184a14,14,0,0,0,14,14H192a14,14,0,0,0,14-14V155.21L244.67,181a6,6,0,0,0,9.33-5V80A6,6,0,0,0,250.83,74.71ZM194,184a2,2,0,0,1-2,2H32a2,2,0,0,1-2-2V72a2,2,0,0,1,2-2H192a2,2,0,0,1,2,2Zm48-19.21-36-24V115.21l36-24Z"></path></svg><span>Video</span></button>
        <button type="button" class="doc-add-composer__media-clear" hidden><svg viewBox="0 0 256 256" fill="currentColor"><path d="M204.24,195.76a6,6,0,1,1-8.48,8.48L128,136.49,60.24,204.24a6,6,0,0,1-8.48-8.48L119.51,128,51.76,60.24a6,6,0,0,1,8.48-8.48L128,119.51l67.76-67.75a6,6,0,0,1,8.48,8.48L136.49,128Z"></path></svg><span>Remove media</span></button>
      </div>
      <div class="doc-add-composer__media-sources" hidden>
        <label class="doc-add-composer__src">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 10.5v-8m0 0L4.8 5.7M8 2.5l3.2 3.2M2.5 11.5v1a1.5 1.5 0 0 0 1.5 1.5h8a1.5 1.5 0 0 0 1.5-1.5v-1"></path></svg><span data-device-label>Upload from your device</span>
          <input type="file" hidden>
        </label>
        <button type="button" class="doc-add-composer__src" data-gallery>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><rect x="2" y="2" width="5" height="5" rx="1"></rect><rect x="9" y="2" width="5" height="5" rx="1"></rect><rect x="2" y="9" width="5" height="5" rx="1"></rect><rect x="9" y="9" width="5" height="5" rx="1"></rect></svg><span>Choose from your gallery</span>
        </button>
      </div>
      <div class="doc-add-composer__media-preview" hidden></div>
    </div>

    <div class="doc-add-composer__row">
      <button type="button" class="doc-add-composer__cancel">Cancel</button>
      <button type="button" class="doc-add-composer__insert">Add section</button>
    </div></div>`
  },
}
