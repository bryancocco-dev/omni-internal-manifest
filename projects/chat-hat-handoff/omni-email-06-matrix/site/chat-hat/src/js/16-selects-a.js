    /* ═══ SELECTS — every banner on the concept sheet carries a + that
       adds it to the Selects section below (and a second press takes it
       back out; a shortlist you can't un-pick is a trap). AQ (9/15): the
       button is baked into every card's action cluster (unitChromeHTML,
       next to bannerCardHTML) — it used to be injected here after the
       build; mountSelectButtons now only mints the select id each card
       needs, and initSelectButtons mints one lazily for a card built
       outside buildConceptSheetDOM (Studio's add-to-canvas). ═══ */
    let selectSeq = 0;
    // Z.2.3 — "a select fills the first open space of its size, in the
    // order added": a monotonic stamp on every select (initial or
    // duplicated), independent of DOM position, so grouping by size
    // in syncSelectsSection can sort a size's own selects back into
    // true chronological order regardless of where the plan's rows
    // later move them.
    let selectOrderSeq = 0;
    function mountSelectButtons(root) {
      Array.prototype.forEach.call(root.querySelectorAll('.pt-banner-card'), (card) => {
        if (!card.dataset.selectId) card.dataset.selectId = 'sel' + (++selectSeq);
      });
    }
    /* AQ — one writer for the shortlist button's state wherever it
       flips (a click, a board switch's relatch, the strip's remove):
       the glyph swap rides .is-selected (CSS), the lockup's ✓ tail
       reads it too (:has), and the tip says what a click will DO —
       the only tooltip the button has (no native title beside the
       hoisted .pt-set-tip). */
    function setSelectBtnState(btn, on) {
      if (!btn) return;
      btn.classList.toggle('is-selected', on);
      btn.setAttribute('aria-pressed', String(on));
      btn.setAttribute('aria-label', on ? 'Remove from selects' : 'Add to selects');
      btn.removeAttribute('title');
      const label = btn.querySelector('.pt-select-label');
      if (label) label.textContent = on ? 'Remove from selects' : 'Add to selects';
    }
    /* A select is a deep clone of the card with its authoring chrome
       (the select button itself, the remove "−") stripped — the Selects
       band is a shortlist to look at, not a second place to edit. */
    function selectCardClone(card) {
      const clone = card.cloneNode(true);
      clone.classList.add('pt-select-card');
      clone.dataset.selectOrder = String(++selectOrderSeq);
      /* The "+" has no meaning here (it is already in Selects), but the
         "−" stays exactly where it is on the concept sheet — same
         slot, same look, same "Remove" tooltip — because it means the
         same thing to the user: take this unit away. Only what it
         removes differs, and that is the container's business, not the
         button's. Re-enabled because syncRemoveButtons may have
         disabled the original as a last-of-row. */
      /* 9/10 (Bryan: "no need to ever show the minus icon on the
         generated banners; it should only be on the one added to
         selects, visible in the same spot the + icon would be —
         clicking it removes the banner from selects") — the board's
         own "−" (a unit-remove) never renders anywhere now (CSS); on a
         select the "+" becomes the "−": same button, same slot, same
         look, a minus for the glyph, wired to the selects' own remove. */
      Array.prototype.forEach.call(clone.querySelectorAll('.pt-banner-remove-btn'), (n) => n.remove());
      // AQ — a select is not "selected" on the board: the source card's
      // accent ring and checked corner never ride along into Selects.
      clone.classList.remove('is-active');
      Array.prototype.forEach.call(clone.querySelectorAll('.pt-unit-check'), (n) => { n.setAttribute('aria-checked', 'false'); });
      Array.prototype.forEach.call(clone.querySelectorAll('.pt-select-btn'), (n) => {
        n.classList.remove('is-selected');
        n.classList.add('pt-select-btn--remove');
        n.setAttribute('data-select-remove', '');
        n.removeAttribute('aria-pressed');
        n.removeAttribute('title');
        n.setAttribute('aria-label', 'Remove from selects');
        const icon = n.querySelector('.pt-select-icon');
        if (icon) icon.innerHTML = ICONS.minus.replace('<svg ', '<svg class="pt-select-minus" '); // AQ — the cluster's one glyph weight
        const label = n.querySelector('.pt-select-label');
        if (label) label.textContent = 'Remove from selects';
      });
      Array.prototype.forEach.call(clone.querySelectorAll('.pt-banner-frame'), (f) => { f.style.animationDelay = '0ms'; });
      /* The hover pencil stays. It went away when a select was a thing
         to look at and nothing more; a select is directly editable
         now, so it carries the same affordance the concept sheet
         does — same glyph, same corner, same meaning. */
      /* Locked from birth. A select is a decision — a shortlist entry
         someone is going to act on — so the top menus must not quietly
         restyle it out from under them. 9/16 (Bryan: "remove this from
         selects"): the Locked / Preview sizes chip row is gone — the lock
         is the model, not a control now (every select stays locked;
         refreshUnlockedSelects / mirrorSelectEditToSource keep their
         guards and simply never fire), and the production preview's
         door with it (openProductionPreview stays, parked). */
      clone.classList.add('is-locked');
      return clone;
    }
    /* A duplicate is a new unit that starts out looking like its
       source — but V3 (PLAN.md §V) now has it KEEP the source's own
       data-select-id, rather than shedding it, so unlocking one can
       catch up to a variety pick like any other select
       (refreshUnlockedSelects walks that link by id and does not care
       how many cards answer to it). data-dup marks it as the extra
       rider on that id, so anything that would otherwise treat the id
       as one-per-card knows this one is not THE view of the concept,
       just a second look at it. It still carries data-select-standalone
       — unrelated to the id now, that flag alone is what keeps the
       orphan sweep (syncSelectsSection) and mirrorSelectEditToSource
       from treating it as reachable, so it still survives a regenerate
       and still never writes an edit back to the board, exactly as
       before.

       It takes a fresh unit id for the same reason the board mints one
       per card — two units in the same trafficking folder cannot share
       a name — and it is locked from birth like every other select. */
    function duplicateSelectCard(card) {
      if (!card) return null;
      const copy = card.cloneNode(true);
      copy.setAttribute('data-dup', '1');
      copy.setAttribute('data-select-standalone', '1');
      copy.dataset.selectOrder = String(++selectOrderSeq); // Z.2.3 — a fresh chronological stamp; cloneNode carried the source's own
      const id = nextUnitId();
      copy.setAttribute('data-unit-id', id);
      const idEl = copy.querySelector('.pt-unit-id');
      if (idEl) idEl.textContent = id;
      copy.classList.add('is-locked');
      // Next to what it came from, so the pair reads as a pair.
      card.insertAdjacentElement('afterend', copy);
      copy.classList.add('pt-select-is-new');
      setTimeout(() => copy.classList.remove('pt-select-is-new'), 700);
      observeEnvVideoSrc(copy);
      syncSelectsSection();
      scheduleFitAllBannerScales();
      return copy;
    }

    /* Pulls unlocked selects back into step with their source unit on
       the concept board. Locked ones are left exactly as they were —
       that is the whole point of the lock. Only the banner and its
       score are replaced; the card's own chrome (kebab, lock, preview,
       remove) is the Selects section's, not the concept's. */
    function refreshUnlockedSelects() {
      Array.prototype.forEach.call(document.querySelectorAll('#ptSelects .pt-select-card:not(.is-locked)'), (card) => {
        const src = document.querySelector('#ptConcepts .pt-banner-card[data-select-id="' + card.dataset.selectId + '"]');
        if (!src) return;
        const srcBanner = src.querySelector('.pt-banner');
        const banner = card.querySelector('.pt-banner');
        if (srcBanner && banner) banner.replaceWith(srcBanner.cloneNode(true));
        const srcChip = src.querySelector('.pt-score-chip');
        const chip = card.querySelector('.pt-score-chip');
        if (srcChip && chip) {
          chip.setAttribute('data-total', srcChip.getAttribute('data-total'));
          chip.setAttribute('data-band', srcChip.getAttribute('data-band'));
          const n = chip.querySelector('.pt-score-num');
          if (n) n.textContent = srcChip.querySelector('.pt-score-num').textContent;
        }
      });
      observeEnvVideoSrc(document.getElementById('ptSelects'));
      scheduleFitAllBannerScales();
    }

    // ═══ Q (9/10) — the sheet RAIL: counts, a concept index that scrolls
    //     to its row, and each row's own meta line. Derived from the
    //     board's DOM rather than tracked, and re-derived on a debounced
    //     MutationObserver — scores land as text/attribute changes, rows
    //     come and go on append/remove — so nothing has to remember to
    //     call it. ═══
    function syncSheetRail() {
      const concepts = document.getElementById('ptConcepts');
      if (!concepts) return;
      const setText = (id, v) => { const e = document.getElementById(id); if (e && e.textContent !== v) e.textContent = v; };
      const groups = Array.prototype.slice.call(concepts.querySelectorAll('.pt-concept-group'));
      setText('ptRailUnits', String(concepts.querySelectorAll('.pt-banner-card').length));
      setText('ptRailConcepts', String(groups.length));
      setText('ptRailSize', (state.sizes[0] || '300x250').replace('x', '\u00d7'));
      let best = null, idxHtml = '';
      groups.forEach((g, gi) => {
        const letter = g.getAttribute('data-concept') || String.fromCharCode(65 + gi);
        let gBest = null, n = 0;
        Array.prototype.forEach.call(g.querySelectorAll('.pt-score-chip'), (chip, ci) => {
          n++;
          if (chip.classList.contains('pt-score-pending')) return;
          const t = parseInt(chip.getAttribute('data-total'), 10) || 0;
          if (gBest === null || t > gBest.t) gBest = { t: t, v: ci + 1 };
        });
        if (gBest && (best === null || gBest.t > best.t)) best = { t: gBest.t, label: letter + gBest.v };
        const meta = g.querySelector('[data-concept-meta]');
        if (meta) {
          const txt = n + ' variant' + (n === 1 ? '' : 's') + (gBest ? ' \u00b7 best ' + gBest.t : '');
          if (meta.textContent !== txt) meta.textContent = txt;
        }
        idxHtml += '<button type="button" class="pt-rail-idx-row" data-rail-concept="' + letter + '">' +
          '<span>Concept ' + letter + '</span><span class="pt-rail-idx-n">' + (gBest ? gBest.t : '\u2014') + '</span></button>';
      });
      const idx = document.getElementById('ptRailIndex');
      if (idx && idx.innerHTML !== idxHtml) idx.innerHTML = idxHtml;
      setText('ptRailBest', best ? best.t + ' \u00b7 ' + best.label : '\u2014');
    }
    (function initSheetRail() {
      const concepts = document.getElementById('ptConcepts');
      const idx = document.getElementById('ptRailIndex');
      if (!concepts) return;
      let timer = null;
      new MutationObserver(() => { clearTimeout(timer); timer = setTimeout(syncSheetRail, 60); })
        .observe(concepts, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['data-band'] });
      if (idx) idx.addEventListener('click', (e) => {
        const row = e.target.closest('[data-rail-concept]');
        if (!row) return;
        const g = concepts.querySelector('.pt-concept-group[data-concept="' + row.getAttribute('data-rail-concept') + '"]');
        const canvasEl = document.getElementById('canvas');
        if (!g || !canvasEl) return;
        const top = g.getBoundingClientRect().top - canvasEl.getBoundingClientRect().top + canvasEl.scrollTop;
        canvasEl.scrollTo({ top: Math.max(0, top - 112), behavior: envReducedMotion() ? 'auto' : 'smooth' });
      });
      syncSheetRail();
    })();
    // ═══ Z — SELECTS FILL THE PLAN (PLAN.md §Z; built Z.2) ═════════
    // plan = { name, source, spaces: [{ size, count }] }, null by
    // default. Every read below is guarded on mediaPlan, so with no
    // plan syncSelectsSection's original body (today's free
    // shortlist, unbounded) runs untouched — "no plan → nothing
    // changes anywhere".
    let mediaPlan = null;
    // AG.1 — the view toggle's own state: 'strip' (default) · 'cards'
    // (Z.2's old "slots" — today's full-size view, renamed) · 'list'
    // (plan only). Session-only, never persisted (refresh-resets rule:
    // it always reopens on Strip); it does survive a board switch
    // (nothing in switchBoard touches it), per AG.1's "persists per
    // board for the session".
    let selectsView = 'strip';
    // AG.4 — true while #ptSelectsViewer holds the live select cards
    // (moved there from #ptSelects, the same "real node into a
    // placeholder" technique the plan's own Slots view already uses
    // for its tiles) — syncSelectsSection reads this to decide which
    // container the cards belong in right now.
    let selectsViewerOpen = false;
    const PLAN_FIXTURE = {
      name: 'Coast Road Q4 display',
      source: 'Coast Road Q4 display.xlsx',
      spaces: [
        { size: '300x250', count: 5 },
        { size: '728x90', count: 4 },
        { size: '160x600', count: 3 },
        { size: '320x50', count: 3 }
      ]
    };
    function clonePlanFixture() { return JSON.parse(JSON.stringify(PLAN_FIXTURE)); }
    function planTotalSpaces(plan) { return plan.spaces.reduce((a, sp) => a + sp.count, 0); }
    // BJ.1 — the campaign's own flight plan, always: mediaPlan once
    // Z.2's beat has fired, otherwise the campaign's default
    // (PLAN_FIXTURE, cloned so the fixture itself is never mutated by
    // a caller). Package (18-package-a.js) lays out against this in
    // every case; the board's Selects section and the Media bar keep
    // reading the bare mediaPlan they always have — a plan still
    // "arrives" there through Z.2, unaffected by this getter existing.
    function campaignFlightPlan() { return mediaPlan || clonePlanFixture(); }
    // Regroups the live .pt-select-card nodes against the plan: each
    // size's own selects (oldest data-select-order first — Z.2.3's
    // "first open space… in the order added") fill that size's spaces
    // in the plan's own order; anything left over (a size the plan
    // never asked for, or past its count) is EXTRA, oldest first.
    // Pure — reads the DOM, returns data, mutates nothing — so it is
    // safe to call on every render.
    function groupSelectsForPlan(plan, cards) {
      const bySize = {};
      cards.forEach((c) => { (bySize[c.dataset.size] || (bySize[c.dataset.size] = [])).push(c); });
      const byOrder = (a, b) => (parseInt(a.dataset.selectOrder, 10) || 0) - (parseInt(b.dataset.selectOrder, 10) || 0);
      Object.keys(bySize).forEach((sz) => bySize[sz].sort(byOrder));
      const claimed = {};
      const groups = plan.spaces.map((sp) => {
        const pool = bySize[sp.size] || [];
        const filled = pool.slice(0, sp.count);
        claimed[sp.size] = filled.length;
        return { size: sp.size, count: sp.count, filled: filled };
      });
      const extra = [];
      Object.keys(bySize).forEach((sz) => { extra.push.apply(extra, bySize[sz].slice(claimed[sz] || 0)); });
      extra.sort(byOrder);
      return { groups: groups, extra: extra };
    }
    // A placeholder, swapped for the real (still-live) card node right
    // after this HTML lands — never the card's own outerHTML, since a
    // select card is live DOM whose listeners are delegated on
    // #ptSelects itself, unaffected by where inside it the node sits.
    function slotTileHTML(card) {
      return '<div class="pt-slot-tile" data-slot-card="' + card.dataset.selectOrder + '"></div>';
    }
    function slotGhostHTML() {
      // The spacer matches a filled tile's own head lockup (20px) +
      // its 8px gap to the banner beneath it (.pt-banner-card-head /
      // .pt-banner-card, both above) — same reasoning as the comp's
      // own slot-ghost-spacer: an open tile has no head row, but the
      // dashed box still lands where the MEDIA starts, not the tile's
      // outer top, so a row of mixed filled/open tiles reads as one
      // aligned rank rather than open ones floating high.
      return '<div class="pt-slot-tile"><div class="pt-slot-ghost-spacer"></div><div class="pt-slot-ghost">open</div></div>';
    }
    function slotGroupHTML(group) {
      const isExtra = group.size === '__extra__';
      const head = isExtra
        ? 'Not in the plan <span>· ' + group.filled.length + '</span>'
        : group.size.replace('x', '×') + ' <span>· ' + group.filled.length + ' of ' + group.count + '</span>';
      let tiles = group.filled.map(slotTileHTML).join('');
      if (!isExtra) { for (let i = group.filled.length; i < group.count; i++) tiles += slotGhostHTML(); }
      return '<div class="pt-slot-group' + (isExtra ? ' pt-slot-extra' : '') + '" data-slot-group="' + (isExtra ? 'extra' : group.size) + '">' +
        '<div class="pt-slot-row-head">' + head + '</div>' +
        '<div class="pt-slot-row">' + tiles + '</div>' +
      '</div>';
    }
    // AG.2 — the strip frame: the History tile's own clone-and-scale
    // recipe (boardPictureHTML), 64px tall, width = 64 × the select's
    // own aspect clamped 40–180. A clone (read-only, like the List
    // row) rather than the live node — only "remove" and "open the
    // viewer" happen from here, both resolved back to the real card
    // by data-select-order.
    const PT_STRIP_H = 64, PT_STRIP_W_MIN = 40, PT_STRIP_W_MAX = 180;
    function stripFrameWidth(sizeId) {
      const parts = (sizeId || '300x250').split('x');
      const w = parseInt(parts[0], 10) || 300, h = parseInt(parts[1], 10) || 250;
      return Math.round(Math.min(PT_STRIP_W_MAX, Math.max(PT_STRIP_W_MIN, PT_STRIP_H * (w / h))));
    }
    function stripFrameHTML(card) {
      const banner = card.querySelector('.pt-banner');
      if (!banner) return '';
      const sizeId = card.dataset.size || banner.getAttribute('data-size') || '300x250';
      const w = parseInt(sizeId.split('x')[0], 10) || 300;
      const h = parseInt(sizeId.split('x')[1], 10) || 250;
      const cw = stripFrameWidth(sizeId);
      const clone = banner.cloneNode(true);
      clone.removeAttribute('id');
      Array.prototype.forEach.call(clone.querySelectorAll('[id]'), (n) => n.removeAttribute('id'));
      // Fit inside the frame on both axes and centre: a wide banner sits
      // mid-frame as a bar, a tower as a slim column, a box fills it.
      const scale = Math.min(cw / w, PT_STRIP_H / h);
      clone.style.transform = 'scale(' + scale + ')';
      clone.style.transformOrigin = 'top left';
      clone.style.position = 'absolute';
      clone.style.left = ((cw - w * scale) / 2).toFixed(1) + 'px';
      clone.style.top = ((PT_STRIP_H - h * scale) / 2).toFixed(1) + 'px';
      const idEl = card.querySelector('.pt-unit-var');
      const idLabel = idEl ? idEl.textContent : '';
      return '<div class="pt-strip-frame" data-select-order="' + card.dataset.selectOrder + '" style="width:' + cw + 'px">' +
        '<span class="pt-strip-frame-pic" style="width:' + cw + 'px;height:' + PT_STRIP_H + 'px">' + clone.outerHTML + '</span>' +
        '<button class="pt-select-btn pt-select-btn--remove pt-strip-frame-remove" type="button" data-select-remove aria-label="Remove from selects" title="Remove from selects">' +
          '<span class="pt-select-icon"><svg class="pt-select-minus" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M5 12h14"/></svg></span>' +
        '</button>' +
        '<span class="pt-strip-frame-id">' + escape(idLabel) + '</span>' +
      '</div>';
    }
    function stripGhostHTML(sizeId) {
      const cw = stripFrameWidth(sizeId);
      return '<div class="pt-strip-frame pt-strip-frame--ghost" style="width:' + cw + 'px">' +
        '<div class="pt-slot-ghost" style="width:' + cw + 'px;height:' + PT_STRIP_H + 'px">open</div>' +
        '<span class="pt-strip-frame-id">&nbsp;</span>' +
      '</div>';
    }
    function stripGroupHTML(group) {
      const isExtra = group.size === '__extra__';
      const head = isExtra
        ? 'Not in the plan <span>· ' + group.filled.length + '</span>'
        : group.size.replace('x', '×') + ' <span>· ' + group.filled.length + ' of ' + group.count + '</span>';
      let frames = group.filled.map(stripFrameHTML).join('');
      if (!isExtra) { for (let i = group.filled.length; i < group.count; i++) frames += stripGhostHTML(group.size); }
      return '<div class="pt-strip-group" data-strip-group="' + (isExtra ? 'extra' : group.size) + '">' +
        '<div class="pt-slot-row-head">' + head + '</div>' +
        '<div class="pt-strip-row">' + frames + '</div>' +
      '</div>';
    }
    // Reads what a List row needs straight off the live card — never
    // re-derived data, so it can never drift from what the unit
    // actually shows (headline edits, a rescored chip, a swapped image).
    function selectCardMeta(card) {
      const scoreChip = card.querySelector('.pt-score-chip');
      const varEl = card.querySelector('.pt-unit-var');
      const headlineEl = card.querySelector('.pt-banner-headline');
      const mediaEl = card.querySelector('.pt-banner-media img, .pt-banner-media video');
      let image = '–';
      if (mediaEl) { const src = mediaEl.getAttribute('src') || ''; if (src) image = src.split('/').pop(); }
      return {
        unitVar: varEl ? varEl.textContent : '',
        score: scoreChip ? (scoreChip.getAttribute('data-total') || '') : '',
        headline: headlineEl ? headlineEl.textContent.trim() : '',
        image: image,
        mediaSrc: mediaEl ? mediaEl.getAttribute('src') : ''
      };
    }
    function slistRowHTML(n, sizeId, card) {
      const sizeLabel = sizeId.replace('x', '×');
      if (!card) {
        return '<div class="pt-slist-row" data-slist-num="' + n + '">' +
          '<span class="pt-slist-num">' + n + '</span><span class="pt-slist-size">' + sizeLabel + '</span>' +
          '<span class="pt-slist-thumb is-open"></span>' +
          '<span class="pt-slist-headline is-open">—</span>' +
          '<span class="pt-slist-image">–</span>' +
          '<span class="pt-slist-status is-open">Open</span>' +
        '</div>';
      }
      const meta = selectCardMeta(card);
      const thumbHTML = meta.mediaSrc ? '<img src="' + meta.mediaSrc + '" alt="">' : '';
      // Clicking a filled row scrolls to the unit on the board (Z.2.4)
      // — the same nav-jump seam the plan-arrived chat line uses.
      return '<div class="pt-slist-row is-filled" data-slist-num="' + n + '" data-select-order="' + card.dataset.selectOrder + '">' +
        '<span class="pt-slist-num">' + n + '</span><span class="pt-slist-size">' + sizeLabel + '</span>' +
        '<span class="pt-slist-thumb">' + thumbHTML + '</span>' +
        '<span class="pt-slist-headline">' + escape(meta.headline || '—') + '</span>' +
        '<span class="pt-slist-image">' + escape(meta.image) + '</span>' +
        '<span class="pt-slist-status is-filled">Filled · ' + escape(meta.unitVar) + (meta.score ? ' ' + escape(meta.score) : '') + '</span>' +
      '</div>';
    }
    function slistGroupHTML(group, startNum) {
      const isExtra = group.size === '__extra__';
      const head = isExtra
        ? 'Not in the plan <span>· ' + group.filled.length + '</span>'
        : group.size.replace('x', '×') + ' <span>· ' + group.filled.length + ' of ' + group.count + '</span>';
      let rows = '', n = startNum;
      if (isExtra) {
        group.filled.forEach((card) => { rows += slistRowHTML(n, card.dataset.size || '', card); n++; });
      } else {
        for (let i = 0; i < group.count; i++) { rows += slistRowHTML(n, group.size, group.filled[i] || null); n++; }
      }
      return { html: '<div class="pt-slist-group">' + head + '</div>' + rows, next: n };
    }
    // AG.4 — every live .pt-select-card, wherever it currently sits:
    // #ptSelects (Cards/Slots), or #ptSelectsViewer while the viewer
    // has it (the strip and the list never hold the real node, so
    // they're never part of this union).
    function getAllSelectCards() {
      return Array.prototype.slice.call(document.querySelectorAll('#ptSelects .pt-select-card, #ptSelectsViewer .pt-select-card'));
    }
    // Undoes applyCardScale's inline sizing so a card reads at its
    // true natural size once it lands in the viewer ("no fit" — AG.4).
    function clearCardScale(card) {
      const wrap = card.querySelector('.pt-banner-scale');
      const fit = card.querySelector('.pt-banner-fit');
      const head = card.querySelector('.pt-banner-card-head');
      if (wrap) { wrap.style.width = ''; wrap.style.height = ''; }
      if (fit) fit.style.transform = '';
      if (head) head.style.width = '';
    }
    // AG.4 — the viewer's own ghost tile: the plan's open spaces,
    // reusing the slot recipe's spacer + dashed box verbatim, sized to
    // the size's TRUE pixels (no fit pass here) instead of a scale.
    function viewerGhostHTML(sizeId) {
      const parts = sizeId.split('x');
      const w = parseInt(parts[0], 10) || 300, h = parseInt(parts[1], 10) || 250;
      return '<div class="pt-viewer-tile pt-viewer-tile--ghost">' +
        '<div class="pt-slot-ghost-spacer"></div>' +
        '<div class="pt-slot-ghost" style="width:' + w + 'px;height:' + h + 'px">open</div>' +
      '</div>';
    }
    function selectsViewerGroupHTML(group) {
      const isExtra = group.size === '__extra__';
      const head = isExtra
        ? 'Not in the plan <span>· ' + group.filled.length + '</span>'
        : group.size.replace('x', '×') + ' <span>· ' + group.filled.length + ' of ' + group.count + '</span>';
      let tiles = group.filled.map((card) => '<div class="pt-viewer-tile" data-viewer-card="' + card.dataset.selectOrder + '"></div>').join('');
      if (!isExtra) { for (let i = group.filled.length; i < group.count; i++) tiles += viewerGhostHTML(group.size); }
      return '<div class="pt-viewer-group" data-viewer-group="' + (isExtra ? 'extra' : group.size) + '">' +
        '<div class="pt-slot-row-head">' + head + '</div>' +
        '<div class="pt-viewer-row">' + tiles + '</div>' +
      '</div>';
    }
    // Replays a moved card's own entrance (pt-card-rise, already on
    // .pt-banner-frame) staggered 60ms apart — moving a node doesn't
    // restart a CSS animation that already finished on it, so this
    // forces one: none → reflow → the base rule's own animation again.
    function replayCardRise(card, i) {
      const frame = card.querySelector('.pt-banner-frame');
      if (!frame) return;
      frame.style.animation = 'none';
      void frame.offsetWidth;
      frame.style.animation = '';
      frame.style.animationDelay = (i * 60) + 'ms';
    }
    function staggerViewerEntrance(cardsAll) {
      if (envReducedMotion()) return;
      cardsAll.forEach((card, i) => replayCardRise(card, i));
    }
    // AG.4 — moves the live cards into the viewer's own grouped rows
    // (mediaPlan) or one flat row (no plan); the mirror of
    // syncSelectsSection's own #ptSelects placeholder-fill, targeting
    // #ptSelectsViewerBody instead while selectsViewerOpen is true.
    function renderSelectsViewerGroups(allGroups, cardsAll) {
      const body = document.getElementById('ptSelectsViewerBody');
      if (!body) return;
      body.innerHTML = allGroups.map(selectsViewerGroupHTML).join('');
      cardsAll.forEach((card) => {
        const ph = body.querySelector('[data-viewer-card="' + card.dataset.selectOrder + '"]');
        if (ph) { clearCardScale(card); ph.appendChild(card); }
      });
      staggerViewerEntrance(cardsAll);
    }
    function renderSelectsViewerFlat(cardsAll) {
      const body = document.getElementById('ptSelectsViewerBody');
      if (!body) return;
      body.innerHTML = '<div class="pt-viewer-row"></div>';
      const row = body.querySelector('.pt-viewer-row');
      cardsAll.forEach((card) => {
        clearCardScale(card);
        const tile = el('<div class="pt-viewer-tile"></div>');
        row.appendChild(tile);
        tile.appendChild(card);
      });
      staggerViewerEntrance(cardsAll);
    }
    function syncSelectsSection() {
      const section = document.getElementById('ptSelectsSection');
      const grid = document.getElementById('ptSelects');
      const listEl = document.getElementById('ptSelectsList');
      const stripEl = document.getElementById('ptSelectsStrip');
      const countEl = document.getElementById('ptSelectsCount');
      const labelEl = document.getElementById('ptSelectsLabel');
      if (!section || !grid) return;
      /* Selects only ever holds clones of cards still on the sheet — a
         regenerate wipes #ptConcepts, so drop anything orphaned by it
         rather than showing a shortlist of banners that no longer exist. */
      /* 9/10 — BOARDS: the sweep that dropped a select whose source
         card had left the board is gone. A board that was replaced
         is kept in the history now, so its selects are still real —
         the shortlist spans boards. (The board's own unit-remove no
         longer renders either, so nothing else orphans a select.) */
      // AG.4 — cards can currently live in #ptSelects OR the open
      // viewer (getAllSelectCards' own union) — never both.
      const cards = getAllSelectCards();
      const n = cards.length;
      if (labelEl) {
        labelEl.classList.toggle('has-toggle', n > 0); // AG.1 — Strip/Cards show for any select count; List needs a plan too (below)
        labelEl.classList.toggle('has-plan', !!mediaPlan);
      }

      if (mediaPlan) {
        // Z.2.3/.4 — regroup and rebuild every view fresh every sync;
        // cheap at ~15 tiles, and it's the only way a remove, a lock,
        // a board switch or a resize can never leave any view stale.
        const grouped = groupSelectsForPlan(mediaPlan, cards);
        const total = planTotalSpaces(mediaPlan);
        const extraN = grouped.extra.length;
        if (countEl) countEl.textContent = n + ' / ' + total + (extraN ? ' · ' + extraN + ' extra' : '');
        section.classList.remove('is-empty');

        const allGroups = grouped.groups.slice();
        if (extraN) allGroups.push({ size: '__extra__', count: extraN, filled: grouped.extra });

        if (selectsViewerOpen) {
          renderSelectsViewerGroups(allGroups, cards);
        } else {
          grid.className = 'pt-selects-grid pt-selects-grid--slots';
          grid.innerHTML = allGroups.map(slotGroupHTML).join('');
          // Into the placeholder, not replacing it — .pt-slot-tile stays
          // the uniform wrapper applySlotRowScale expects on every tile,
          // filled or ghost alike (":scope > .pt-select-card" below).
          cards.forEach((card) => {
            const ph = grid.querySelector('[data-slot-card="' + card.dataset.selectOrder + '"]');
            if (ph) ph.appendChild(card);
          });
        }

        if (listEl) {
          let num = 1, html = '';
          allGroups.forEach((g) => { const r = slistGroupHTML(g, num); html += r.html; num = r.next; });
          listEl.innerHTML = '<div class="pt-slist-header">' +
            '<span class="pt-slist-cell">#</span><span class="pt-slist-cell">Size</span><span class="pt-slist-cell">Unit</span>' +
            '<span class="pt-slist-cell">Headline</span><span class="pt-slist-cell">Image</span><span class="pt-slist-cell">Status</span>' +
          '</div>' + html;
        }
        // AG.2 — the strip groups by size exactly like Cards/List do.
        if (stripEl) stripEl.innerHTML = allGroups.map(stripGroupHTML).join('');
      } else {
        // No plan — today's free shortlist, exactly as it always was.
        if (selectsViewerOpen) {
          renderSelectsViewerFlat(cards);
        } else {
          // Anything the viewer was holding (it just closed) comes
          // straight back — #ptSelects is the only home a card has in
          // the no-plan case, so this is a no-op for cards already
          // there and a plain reparent for the rest.
          cards.forEach((card) => { if (card.parentElement !== grid) grid.appendChild(card); });
        }
        grid.className = 'pt-selects-grid';
        if (listEl) listEl.innerHTML = '';
        if (countEl) countEl.textContent = String(n);
        section.classList.toggle('is-empty', n === 0);
        // AG.2 — one flat scrolling row, no size groups.
        if (stripEl) stripEl.innerHTML = cards.length ? '<div class="pt-strip-row">' + cards.map(stripFrameHTML).join('') + '</div>' : '';
      }
      Array.prototype.forEach.call(document.querySelectorAll('#ptSelectsStrip .pt-strip-row'), updateStripFade);
      syncSelectsViewVisibility();

      const railCount = document.querySelector('.rail-nav-painter [data-rail-selects-count]');
      if (railCount) railCount.textContent = n ? String(n) : '';
      syncPackageButton();
      scheduleFitAllBannerScales();
    }
    // Shows Strip, Cards or List per selectsView, and syncs the toggle
    // buttons' own active/aria-pressed — split out from the rebuild
    // above so a plain view-toggle click (no data change) never has
    // to re-group or touch a single select card.
    function syncSelectsViewVisibility() {
      const section = document.getElementById('ptSelectsSection');
      const listEl = document.getElementById('ptSelectsList');
      const stripEl = document.getElementById('ptSelectsStrip');
      const toggle = document.getElementById('ptSelectsViewToggle');
      const showList = !!mediaPlan && selectsView === 'list';
      const showStrip = !showList && selectsView !== 'cards';
      // AG — driven by a data attribute on the SECTION, not an inline
      // style on each view's own root: resetCanvasSectionCentering
      // (fitAllBannerScales' first step, run on every select add/
      // remove/resize) blanks #ptSelects/#ptSelectsStrip's own inline
      // display back to '' so it can re-measure them, which used to
      // silently re-reveal whichever view had just been hidden that
      // way. #ptSelectsSection[data-select-view] outranks every plain
      // class rule on those ids (.pt-selects-grid, .pt-selects-grid
      // --slots, .pt-selects-strip) by specificity, so the reset can
      // never uncover the wrong view again.
      section && section.setAttribute('data-select-view', showList ? 'list' : (showStrip ? 'strip' : 'cards'));
      if (stripEl) stripEl.classList.toggle('is-active', showStrip);
      if (listEl) listEl.classList.toggle('is-active', showList);
      if (toggle) {
        Array.prototype.forEach.call(toggle.querySelectorAll('[data-select-view]'), (btn) => {
          const on = btn.dataset.selectView === selectsView;
          btn.classList.toggle('active', on);
          btn.setAttribute('aria-pressed', String(on));
        });
      }
    }
    function initSelectsViewToggle() {
      const toggle = document.getElementById('ptSelectsViewToggle');
      if (!toggle) return;
      // Direct listeners on each button, not one delegated on the
      // group: these buttons share the shell's own .graphics-view-btn
      // class for the "verbatim" reuse Z.2.2 asks for, and the shell's
      // OWN gallery toggle (canvas_3, ~L36663) already binds a global
      // document.querySelectorAll('.graphics-view-btn') click handler
      // that opens with e.stopPropagation() — a delegated listener up
      // on #ptSelectsViewToggle would never see the bubbled event.
      // Direct listeners fire in the target phase alongside it either
      // way, so registration order doesn't matter here.
      Array.prototype.forEach.call(toggle.querySelectorAll('[data-select-view]'), (btn) => {
        btn.addEventListener('click', () => {
          const v = btn.dataset.selectView;
          switchSelectsView(v === 'list' ? 'list' : (v === 'cards' ? 'cards' : 'strip'));
        });
      });
      // Z.2.4 — clicking a filled List row scrolls to that unit: the
      // live source card on the CURRENT board when it's there (the
      // rail nav's own canvas.scrollTo recipe, §Q); a select made on
      // a different board has no source in #ptConcepts right now
      // (boards swap that container's whole content), so it falls
      // back to scrolling its own tile in Cards — always resolvable,
      // since Selects is shared across boards and this node always
      // lives there.
      const listEl = document.getElementById('ptSelectsList');
      if (listEl) {
        listEl.addEventListener('click', (e) => {
          const row = e.target.closest('.pt-slist-row.is-filled');
          if (!row) return;
          const canvasEl = document.getElementById('canvas');
          const card = document.querySelector('#ptSelects [data-select-order="' + row.dataset.selectOrder + '"]');
          if (!canvasEl || !card) return;
          const id = card.dataset.selectId;
          const source = id && document.querySelector('#ptConcepts .pt-banner-card[data-select-id="' + id + '"]');
          const target = source || card;
          if (!source && selectsView !== 'cards') { switchSelectsView('cards'); }
          const top = target.getBoundingClientRect().top - canvasEl.getBoundingClientRect().top + canvasEl.scrollTop;
          canvasEl.scrollTo({ top: Math.max(0, top - 96), behavior: envReducedMotion() ? 'auto' : 'smooth' });
        });
      }
    }
    // AG.2 — the fade lives at whichever edge still has more content:
    // sharp where the row starts/ends, 24px where it doesn't. Run
    // after every strip rebuild and on resize (fitAllBannerScales).
    function updateStripFade(row) {
      const max = row.scrollWidth - row.clientWidth;
      const canScroll = max > 2;
      const atStart = row.scrollLeft <= 2;
      const atEnd = row.scrollLeft >= max - 2;
      row.style.setProperty('--fade-l', (canScroll && !atStart) ? '24px' : '0px');
      row.style.setProperty('--fade-r', (canScroll && !atEnd) ? '24px' : '0px');
    }
    // AG.2 — "the row never wraps: it scrolls horizontally… wheel +
    // drag". Wired ONCE on the stable #ptSelectsStrip container
    // (delegation — its rows are rebuilt wholesale on every
    // syncSelectsSection, so per-row listeners would leak).
    function initSelectsStrip() {
      const stripEl = document.getElementById('ptSelectsStrip');
      if (!stripEl || stripEl._wired) return;
      stripEl._wired = true;
      stripEl.addEventListener('wheel', (e) => {
        const row = e.target.closest('.pt-strip-row');
        if (!row || Math.abs(e.deltaY) <= Math.abs(e.deltaX) || row.scrollWidth <= row.clientWidth) return;
        e.preventDefault();
        row.scrollLeft += e.deltaY;
        updateStripFade(row);
      }, { passive: false });
      // 'scroll' doesn't bubble — capture phase still sees it fire on
      // a descendant row.
      stripEl.addEventListener('scroll', (e) => {
        const row = e.target.closest && e.target.closest('.pt-strip-row');
        if (row) updateStripFade(row);
      }, true);
      let dragRow = null, dragging = false, moved = false, startX = 0, startLeft = 0;
      stripEl.addEventListener('mousedown', (e) => {
        const row = e.target.closest('.pt-strip-row');
        if (!row || e.button !== 0 || e.target.closest('.pt-strip-frame-remove')) return;
        dragRow = row; dragging = true; moved = false;
        startX = e.clientX; startLeft = row.scrollLeft;
        row.classList.add('is-dragging');
      });
      document.addEventListener('mousemove', (e) => {
        if (!dragging || !dragRow) return;
        const dx = e.clientX - startX;
        if (Math.abs(dx) > 4) moved = true;
        dragRow.scrollLeft = startLeft - dx;
        updateStripFade(dragRow);
      });
      document.addEventListener('mouseup', () => {
        if (!dragging) return;
        dragging = false;
        if (dragRow) {
          dragRow.classList.remove('is-dragging');
          if (moved) {
            // a real drag shouldn't also fire the frame's own click
            // (open the viewer) the instant the mouse lets go.
            const row = dragRow;
            row.addEventListener('click', (e) => e.stopPropagation(), { capture: true, once: true });
          }
        }
        dragRow = null;
      });
      stripEl.addEventListener('click', (e) => {
        const frame = e.target.closest('.pt-strip-frame');
        if (!frame || frame.classList.contains('pt-strip-frame--ghost')) return;
        const order = frame.dataset.selectOrder;
        if (e.target.closest('.pt-strip-frame-remove')) {
          const card = document.querySelector('#ptSelects [data-select-order="' + order + '"], #ptSelectsViewer [data-select-order="' + order + '"]');
          if (card) removeSelectCard(card);
          return;
        }
        openSelectsViewer(order); // AG.2 — "clicking a frame opens the viewer scrolled to that select"
      });
    }
    // Shared by #ptSelects' own remove control and the strip's
    // (AG.4 — "selecting/removing inside the viewer updates the strip
    // live" needs one door regardless of where the click started).
    function removeSelectCard(card) {
      if (!card) return;
      const id = card.dataset.selectId;
      const order = card.dataset.selectOrder;
      const finish = () => {
        card.remove();
        const stillSelected = id && document.querySelector('#ptSelects .pt-select-card[data-select-id="' + id + '"], #ptSelectsViewer .pt-select-card[data-select-id="' + id + '"]');
        if (!stillSelected) {
          const src = document.querySelector('#ptConcepts .pt-banner-card[data-select-id="' + id + '"] .pt-select-btn');
          if (src) setSelectBtnState(src, false);
        }
        syncSelectsSection();
      };
      // AG.3 — "removing: it shrinks the same way [as adding]" — while
      // the strip is the visible view, its frame collapses to width 0
      // first; the card (and the clone) drop once that beat finishes.
      const stripFrame = order && document.querySelector('#ptSelectsStrip [data-select-order="' + order + '"]');
      if (stripFrame && selectsView === 'strip' && !envReducedMotion()) {
        stripFrame.classList.add('pt-strip-frame--exit');
        setTimeout(finish, 220);
      } else {
        finish();
      }
    }
    // The select card's own actions — remove / open the editor (the
    // lock and preview chips retired 9/16) — bound identically wherever a live card can sit
    // (#ptSelects, #ptSelectsViewer): AG.4's "selecting/removing inside
    // the viewer updates the strip live" falls out for free since both
    // hosts call the same removeSelectCard → syncSelectsSection.
    function handleSelectsCardClick(e) {
      const card = e.target.closest('.pt-select-card');
      if (!card) return;
      if (e.target.closest('[data-select-remove], .pt-banner-remove-btn')) {
        removeSelectCard(card);
        return;
      }
      if (document.body.classList.contains('is-painter-shared')) return; // read-only
      if (e.target.closest('.pt-banner-card-head')) return; // own handlers
      // AQ.4 amendment — the banner click no longer opens the editor here
      // either; the cluster's pencil (initUnitEditButtons) is the door.
      const frame = e.target.closest('.pt-banner-frame');
      if (frame) { const card = frame.closest('.pt-banner-card'); if (card && typeof card.focus === 'function') card.focus({ preventScroll: true }); }
    }
    // AG.3 — Strip ↔ Cards animates as one shared-element move: measure
    // the outgoing geometry keyed by data-select-order, let the
    // incoming view lay out for real (scheduleFitAllBannerScales), then
    // invert each incoming element back to where its counterpart just
    // was and ease it home — the two views never share a DOM node, so
    // this is what "the same elements" becomes across a real layout
    // change (a grid of natural-ish cards vs. a 64px horizontal strip).
    // List has no shared geometry with either (a table row), so a
    // switch into/out of List is a plain crossfade (syncSelectsViewVisibility
    // alone) — nothing here measures against it.
    function switchSelectsView(newView) {
      if (newView === selectsView) return;
      const outgoing = selectsView;
      if (envReducedMotion()) {
        selectsView = newView;
        syncSelectsViewVisibility();
        scheduleFitAllBannerScales();
        return;
      }
      const before = {};
      if (outgoing === 'strip') {
        Array.prototype.forEach.call(document.querySelectorAll('#ptSelectsStrip .pt-strip-frame:not(.pt-strip-frame--ghost)'), (f) => {
          const pic = f.querySelector('.pt-strip-frame-pic');
          if (pic) before[f.dataset.selectOrder] = pic.getBoundingClientRect();
        });
      } else if (outgoing === 'cards') {
        Array.prototype.forEach.call(document.querySelectorAll('#ptSelects .pt-select-card'), (c) => {
          const b = c.querySelector('.pt-banner');
          if (b) before[c.dataset.selectOrder] = b.getBoundingClientRect();
        });
      }
      const section = document.getElementById('ptSelectsSection');
      const beforeH = section ? section.getBoundingClientRect().height : 0;

      selectsView = newView;
      syncSelectsViewVisibility();
      scheduleFitAllBannerScales(); // lays the incoming view out at its real size/position

      if (section && beforeH) {
        section.style.height = beforeH + 'px';
        section.style.overflow = 'hidden';
      }
      requestAnimationFrame(() => {
        const items = [];
        if (newView === 'strip') {
          Array.prototype.forEach.call(document.querySelectorAll('#ptSelectsStrip .pt-strip-frame:not(.pt-strip-frame--ghost)'), (f) => {
            const b0 = before[f.dataset.selectOrder];
            const pic = f.querySelector('.pt-strip-frame-pic');
            if (b0 && pic) items.push({ el: pic, b0: b0 });
          });
        } else if (newView === 'cards') {
          Array.prototype.forEach.call(document.querySelectorAll('#ptSelects .pt-select-card'), (c) => {
            const b0 = before[c.dataset.selectOrder];
            const b = c.querySelector('.pt-banner');
            if (b0 && b) items.push({ el: b, b0: b0 });
          });
        }
        items.forEach((it, i) => {
          const b1 = it.el.getBoundingClientRect();
          if (!b1.width || !b1.height) return;
          const dx = it.b0.left - b1.left, dy = it.b0.top - b1.top;
          const sx = it.b0.width / b1.width, sy = it.b0.height / b1.height;
          it.el.style.transition = 'none';
          it.el.style.transformOrigin = 'top left';
          it.el.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(' + sx + ',' + sy + ')';
          it.el.style.opacity = '0.5';
          void it.el.offsetWidth; // commit the inverted start before transitioning off it
          const stagger = i * 20;
          it.el.style.transition = 'transform 320ms cubic-bezier(0.22,1,0.36,1) ' + stagger + 'ms, opacity 320ms cubic-bezier(0.22,1,0.36,1) ' + stagger + 'ms';
          it.el.style.transform = '';
          it.el.style.opacity = '';
          setTimeout(() => { it.el.style.transition = ''; }, 340 + stagger);
        });
        // Chrome that only exists in Cards (score chip, Locked/Preview
        // sizes, the plan's size-group heads) fades in rather than
        // popping once the incoming view is Cards.
        if (newView === 'cards') {
          const grid = document.getElementById('ptSelects');
          if (grid) {
            grid.classList.add('pt-view-crossfade');
            setTimeout(() => grid.classList.remove('pt-view-crossfade'), 400);
          }
        }
        if (section) {
          const afterH = section.scrollHeight;
          section.style.transition = 'height 320ms cubic-bezier(0.22,1,0.36,1)';
          section.style.height = afterH + 'px';
          setTimeout(() => {
            section.style.transition = '';
            section.style.height = '';
            section.style.overflow = '';
          }, 340);
        }
      });
    }
    // AG.4 — "View all": moves the live cards into #ptSelectsViewer at
    // natural size (the same placeholder-fill technique the plan's
    // Slots view uses), in the Editor's own frame/entrance. Closing
    // hands them straight back — syncSelectsSection is the one place
    // that reconciles where a card currently lives.
    function openSelectsViewer(scrollToOrder) {
      const overlay = document.getElementById('ptSelectsViewer');
      const body = document.getElementById('ptSelectsViewerBody');
      if (!overlay || !body) return;
      selectsViewerOpen = true;
      syncSelectsSection();
      overlay.setAttribute('data-visible', '1');
      overlay.setAttribute('aria-hidden', 'false');
      syncMediaTopbar(); // AG.4 special-cases this id, same contract as #ptPackage
      if (scrollToOrder) {
        const tile = body.querySelector('.pt-select-card[data-select-order="' + scrollToOrder + '"]');
        if (tile) setTimeout(() => tile.scrollIntoView({ block: 'center', behavior: envReducedMotion() ? 'auto' : 'smooth' }), 80);
      }
    }
    function closeSelectsViewer() {
      const overlay = document.getElementById('ptSelectsViewer');
      if (!overlay || overlay.getAttribute('data-visible') !== '1') return;
      selectsViewerOpen = false;
      overlay.setAttribute('data-visible', '0');
      overlay.setAttribute('aria-hidden', 'true');
      syncSelectsSection(); // hands the live cards back to #ptSelects/the strip, untouched
      syncMediaTopbar();
    }
    function initSelectsViewer() {
      const viewAllBtn = document.getElementById('ptSelectsViewAllBtn');
      if (viewAllBtn) viewAllBtn.addEventListener('click', () => openSelectsViewer());
      const closeBtn = document.getElementById('ptSelectsViewerCloseBtn');
      if (closeBtn) closeBtn.addEventListener('click', closeSelectsViewer);
      // Escape — mirrors #ptPreview/#ptPackage's own dedicated capture-
      // phase listener: #ptMediaMode's own visibility is already '0' by
      // the time a resolved sheet (and this viewer) is reachable.
      document.addEventListener('keydown', (e) => {
        const overlay = document.getElementById('ptSelectsViewer');
        if (e.key === 'Escape' && overlay && overlay.getAttribute('data-visible') === '1') {
          if (setOpenMenu) return; // a combo popover owns the first Escape, same as Package
          e.stopPropagation();
          closeSelectsViewer();
        }
      }, true);
      const viewerBody = document.getElementById('ptSelectsViewerBody');
      if (viewerBody) viewerBody.addEventListener('click', handleSelectsCardClick);
      initSelectsStrip();
    }
