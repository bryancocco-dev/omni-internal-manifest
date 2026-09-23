// AUTO-EXTRACTED verbatim markup from canvas-graphics/index.html — do not hand-edit.
// Each value is consumed by extracted() in ../lib.js: { note, minHeight, pad, html }.
export default {
  dropdown_stylepill: {
    note: '.image-style-btn — composer pill that opens the lookbook; crossfades from a swatches icon to a 16px cover thumb once a style is picked',
    minHeight: 70,
    html: `<div class="image-style-selector-wrap is-active" id="imageStyleSelectorWrap">
      <button class="image-style-btn has-style" id="imageStyleBtn" type="button" aria-haspopup="menu" aria-expanded="false" aria-controls="imageStyleMenu">
        <span class="image-style-thumb-wrap" aria-hidden="true">
          <span class="image-pill-icon image-style-icon">
            <svg viewBox="0 0 16 16" fill="none">
              <rect x="2" y="5" width="8" height="8" rx="1.2" stroke="currentColor" stroke-width="1.2"/>
              <rect x="6" y="2.5" width="8" height="8" rx="1.2" stroke="currentColor" stroke-width="1.2" opacity="0.55"/>
            </svg>
          </span>
          <img class="image-style-thumb" id="imageStyleThumb" alt="" src="https://images.unsplash.com/photo-1485291571150-772bcfc10da5?w=64&h=64&q=76&auto=format&fit=crop&fm=webp&cs=tinysrgb">
        </span>
        <span class="image-style-label" id="imageStyleLabel">2026 Corvache Precision</span>
        <svg class="image-style-caret" width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
          <path d="M2 4l3 3 3-3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>`
  },

  lookbook: {
    note: '.image-style-menu — the lookbook picker: search, New Style action, and a 3-up grid of portrait style cards (cover, name, refs, Style Guide link)',
    minHeight: 420,
    pad: '0',
    html: `<div class="image-style-menu open" id="imageStyleMenu" role="menu" style="position:static;opacity:1;transform:none;pointer-events:auto;">
      <div class="image-style-menu-head">
        <span class="image-style-menu-title">Styles</span>
        <button type="button" class="image-style-new-btn" id="imageStyleNewCardBtn" role="menuitem" title="Build a style from your own photos">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          <span>New style</span>
        </button>
        <button class="image-style-close-btn" id="imageStyleCloseBtn" type="button" aria-label="Close styles">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><line x1="6" y1="6" x2="18" y2="18"/><line x1="6" y1="18" x2="18" y2="6"/></svg>
        </button>
      </div>
      <div class="image-style-menu-body" id="imageStyleMenuBody">
        <div class="image-style-search-row"><div class="image-style-search-wrap">
          <svg class="image-style-search-icon" width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="7" cy="7" r="4.5" stroke="currentColor" stroke-width="1.3"/>
            <line x1="10.3" y1="10.3" x2="13.5" y2="13.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
          </svg>
          <input type="text" class="image-style-search" id="imageStyleSearch" placeholder="Search styles or brands…" autocomplete="off" aria-label="Search styles">
        </div></div>
        <div id="imageStyleMenuGroups">
          <div class="image-style-group"><div class="image-style-grid">
            <button type="button" class="image-style-card is-selected" data-style-id="corvache-2026-precision" role="menuitemradio" aria-checked="true">
              <span class="image-style-card-plate"><span class="image-style-card-mosaic">
                <img class="image-style-cover-img" src="https://images.unsplash.com/photo-1485291571150-772bcfc10da5?w=400&h=300&q=76&auto=format&fit=crop&fm=webp&cs=tinysrgb" alt="" loading="lazy" decoding="async">
                <span class="image-style-card-activeflag" aria-hidden="true">ACTIVE</span>
              </span></span>
              <span class="image-style-card-underrow">
                <span class="image-style-card-name">2026 Corvache Precision</span>
                <span class="image-style-card-foot">
                  <span class="image-style-card-meta"><span class="image-style-card-meta-text">2026 &middot; 54 refs</span></span>
                  <a class="image-style-card-cta" href="brand-book.html#style-2026-corvache-precision" target="_blank" rel="noopener" title="Style guide" aria-label="Style guide">
                    <span class="image-style-card-cta-word" aria-hidden="true">View</span>
                    <svg viewBox="0 0 10 10" fill="none" aria-hidden="true"><path d="M3 7L7 3M3.5 3H7V6.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  </a>
                </span>
              </span>
            </button>
            <button type="button" class="image-style-card" data-style-id="corvache-2024-brand" role="menuitemradio" aria-checked="false">
              <span class="image-style-card-plate"><span class="image-style-card-mosaic">
                <img class="image-style-cover-img" src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&h=300&q=76&auto=format&fit=crop&fm=webp&cs=tinysrgb" alt="" loading="lazy" decoding="async">
                <span class="image-style-card-activeflag" aria-hidden="true">ACTIVE</span>
              </span></span>
              <span class="image-style-card-underrow">
                <span class="image-style-card-name">2024 Corvache Brand</span>
                <span class="image-style-card-foot">
                  <span class="image-style-card-meta"><span class="image-style-card-meta-text">2024 &middot; 38 refs</span></span>
                  <a class="image-style-card-cta" href="brand-book.html#style-2024-corvache-brand" target="_blank" rel="noopener" title="Style guide" aria-label="Style guide">
                    <span class="image-style-card-cta-word" aria-hidden="true">View</span>
                    <svg viewBox="0 0 10 10" fill="none" aria-hidden="true"><path d="M3 7L7 3M3.5 3H7V6.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  </a>
                </span>
              </span>
            </button>
            <button type="button" class="image-style-card" data-style-id="corvache-blackout-editorial" role="menuitemradio" aria-checked="false">
              <span class="image-style-card-plate"><span class="image-style-card-mosaic">
                <img class="image-style-cover-img" src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400&h=300&q=76&auto=format&fit=crop&fm=webp&cs=tinysrgb" alt="" loading="lazy" decoding="async">
                <span class="image-style-card-activeflag" aria-hidden="true">ACTIVE</span>
              </span></span>
              <span class="image-style-card-underrow">
                <span class="image-style-card-name">Blackout Editorial</span>
                <span class="image-style-card-foot">
                  <span class="image-style-card-meta"><span class="image-style-card-meta-text">2025 &middot; 22 refs</span></span>
                  <a class="image-style-card-cta" href="brand-book.html#style-blackout-editorial" target="_blank" rel="noopener" title="Style guide" aria-label="Style guide">
                    <span class="image-style-card-cta-word" aria-hidden="true">View</span>
                    <svg viewBox="0 0 10 10" fill="none" aria-hidden="true"><path d="M3 7L7 3M3.5 3H7V6.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  </a>
                </span>
              </span>
            </button>
          </div></div>
        </div>
      </div>
    </div>`
  },

  button_magicprompt: {
    note: '#magicPromptBtn — sparkle "Enhance Prompt" composer button that rewrites the prompt in place (word-by-word reveal + a temporary Revert)',
    minHeight: 60,
    html: `<div class="magic-prompt-wrap">
      <button type="button" id="magicPromptBtn" aria-label="Enhance Prompt" disabled>
        <svg width="20" height="20" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
          <path d="M48,64a8,8,0,0,1,8-8H72V40a8,8,0,0,1,16,0V56h16a8,8,0,0,1,0,16H88V88a8,8,0,0,1-16,0V72H56A8,8,0,0,1,48,64ZM184,192h-8v-8a8,8,0,0,0-16,0v8h-8a8,8,0,0,0,0,16h8v8a8,8,0,0,0,16,0v-8h8a8,8,0,0,0,0-16Zm56-48H224V128a8,8,0,0,0-16,0v16H192a8,8,0,0,0,0,16h16v16a8,8,0,0,0,16,0V160h16a8,8,0,0,0,0-16ZM219.31,80,80,219.31a16,16,0,0,1-22.62,0L36.68,198.63a16,16,0,0,1,0-22.63L176,36.69a16,16,0,0,1,22.63,0l20.68,20.68A16,16,0,0,1,219.31,80Zm-54.63,32L144,91.31l-96,96L68.68,208ZM208,68.69,187.31,48l-32,32L176,100.69Z"/>
          <circle class="wand-spark wand-spark-1" cx="232" cy="36" r="8"/>
          <circle class="wand-spark wand-spark-2" cx="118" cy="16" r="6"/>
        </svg>
      </button>
      <button type="button" class="magic-prompt-revert" id="magicPromptRevertBtn">Revert</button>
      <span class="magic-tip" aria-hidden="true">Enhance Prompt</span>
    </div>`
  },

  card_photoshoot: {
    note: '.c4-shoot-group — Photo Shoot\'s resolved 5-frame set: group header (prompt + shot count/model) over a flex row of numbered shot cards',
    minHeight: 300,
    pad: '0',
    html: `<div class="graphics-grid" style="padding:20px;">
      <div class="c4-shoot-group">
        <div class="c4-shoot-set-header">
          <h3 class="c4-shoot-title">A black sports car, coastal highway, golden hour.</h3>
          <span class="c4-shoot-meta">5 shots &middot; Nano Banana 2</span>
        </div>
        <div class="c4-shoot-cards-row">
          <figure class="graphics-card" style="--card-ar: 420 / 280">
            <img src="/_assets/canvas-graphics/shoot-assets/shoot-03.webp" alt="She walks up to the car at the charger, golden hour." decoding="async">
            <figcaption class="gcard-rest">
              <p class="gcard-rest-prompt">She walks up to the car at the charger, golden hour.</p>
              <span class="gcard-rest-meta">Nano Banana 2 &middot; Just now</span>
            </figcaption>
            <div class="graphics-card-overlay"><div class="gco-glass">
              <span class="gco-shot-label">01</span>
              <p class="gco-prompt">She walks up to the car at the charger, golden hour.</p>
              <span class="gco-filetype">Graphics</span>
              <div class="gco-meta-row">
                <div class="gco-author">
                  <span class="gco-creator"><span class="gco-avatar" style="background:#3FCBC4;color:#064e3b;">BC</span><span class="gco-name">Bryan Cocco</span></span>
                  <span class="gco-model-chip">Nano Banana 2</span>
                  <span class="gco-time">Just now</span>
                </div>
                <div class="gco-actions">
                  <button class="gco-action" type="button" aria-label="Reply"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg></button>
                  <button class="gco-action" type="button" aria-label="Download"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.39 18.39A5 5 0 0 0 18 10h-1.26A8 8 0 1 0 3 16.3"/><path d="M8 14l4 4 4-4M12 18V9"/></svg></button>
                  <button class="gco-action gco-action-more" type="button" aria-label="More options" aria-haspopup="menu" aria-expanded="false"><svg class="gco-more-dots" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="12" cy="19" r="1.8"/></svg></button>
                </div>
              </div>
            </div></div>
          </figure>
          <figure class="graphics-card" style="--card-ar: 420 / 280">
            <img src="/_assets/canvas-graphics/shoot-assets/shoot-05.webp" alt="Behind the wheel, singing down the coast road." decoding="async">
            <figcaption class="gcard-rest">
              <p class="gcard-rest-prompt">Behind the wheel, singing down the coast road.</p>
              <span class="gcard-rest-meta">Nano Banana 2 &middot; Just now</span>
            </figcaption>
            <div class="graphics-card-overlay"><div class="gco-glass">
              <span class="gco-shot-label">03</span>
              <p class="gco-prompt">Behind the wheel, singing down the coast road.</p>
              <span class="gco-filetype">Graphics</span>
              <div class="gco-meta-row">
                <div class="gco-author">
                  <span class="gco-creator"><span class="gco-avatar" style="background:#3FCBC4;color:#064e3b;">BC</span><span class="gco-name">Bryan Cocco</span></span>
                  <span class="gco-model-chip">Nano Banana 2</span>
                  <span class="gco-time">Just now</span>
                </div>
                <div class="gco-actions">
                  <button class="gco-action" type="button" aria-label="Reply"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg></button>
                  <button class="gco-action" type="button" aria-label="Download"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.39 18.39A5 5 0 0 0 18 10h-1.26A8 8 0 1 0 3 16.3"/><path d="M8 14l4 4 4-4M12 18V9"/></svg></button>
                  <button class="gco-action gco-action-more" type="button" aria-label="More options" aria-haspopup="menu" aria-expanded="false"><svg class="gco-more-dots" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="12" cy="19" r="1.8"/></svg></button>
                </div>
              </div>
            </div></div>
          </figure>
          <figure class="graphics-card" style="--card-ar: 420 / 280">
            <img src="/_assets/canvas-graphics/shoot-assets/shoot-01.webp" alt="Rear three-quarter, sunset on the coastal highway." decoding="async">
            <figcaption class="gcard-rest">
              <p class="gcard-rest-prompt">Rear three-quarter, sunset on the coastal highway.</p>
              <span class="gcard-rest-meta">Nano Banana 2 &middot; Just now</span>
            </figcaption>
            <div class="graphics-card-overlay"><div class="gco-glass">
              <span class="gco-shot-label">05</span>
              <p class="gco-prompt">Rear three-quarter, sunset on the coastal highway.</p>
              <span class="gco-filetype">Graphics</span>
              <div class="gco-meta-row">
                <div class="gco-author">
                  <span class="gco-creator"><span class="gco-avatar" style="background:#3FCBC4;color:#064e3b;">BC</span><span class="gco-name">Bryan Cocco</span></span>
                  <span class="gco-model-chip">Nano Banana 2</span>
                  <span class="gco-time">Just now</span>
                </div>
                <div class="gco-actions">
                  <button class="gco-action" type="button" aria-label="Reply"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg></button>
                  <button class="gco-action" type="button" aria-label="Download"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.39 18.39A5 5 0 0 0 18 10h-1.26A8 8 0 1 0 3 16.3"/><path d="M8 14l4 4 4-4M12 18V9"/></svg></button>
                  <button class="gco-action gco-action-more" type="button" aria-label="More options" aria-haspopup="menu" aria-expanded="false"><svg class="gco-more-dots" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="12" cy="19" r="1.8"/></svg></button>
                </div>
              </div>
            </div></div>
          </figure>
        </div>
      </div>
    </div>`
  }
};
