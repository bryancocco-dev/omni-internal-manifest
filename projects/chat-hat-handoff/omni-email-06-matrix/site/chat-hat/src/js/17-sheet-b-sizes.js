    /* ═══ PRODUCTION SIZES — the full IAB standard roster, which is a
       superset of the nine SIZES the concept sheet tests in. Concepting
       happens at one size; PRODUCTION is where a select gets built out
       to every placement it has to fill, so this list is separate from
       SIZES rather than an extension of it. Grouped the way the IAB
       itself groups them. ═══ */
    const IAB_SIZES = [
      { group: 'Rectangles & squares', items: [
        { id: '300x250', label: 'Medium rectangle' },
        { id: '336x280', label: 'Large rectangle' },
        { id: '250x250', label: 'Square' },
        { id: '200x200', label: 'Small square' },
        { id: '180x150', label: 'Rectangle' },
        { id: '300x600', label: 'Half page' }
      ]},
      { group: 'Leaderboards & banners', items: [
        { id: '728x90', label: 'Leaderboard' },
        { id: '970x90', label: 'Super leaderboard' },
        { id: '970x250', label: 'Billboard' },
        { id: '468x60', label: 'Full banner' },
        { id: '234x60', label: 'Half banner' },
        { id: '320x50', label: 'Mobile leaderboard' },
        { id: '320x100', label: 'Large mobile banner' }
      ]},
      { group: 'Skyscrapers', items: [
        { id: '160x600', label: 'Wide skyscraper' },
        { id: '120x600', label: 'Skyscraper' },
        { id: '300x1050', label: 'Portrait' }
      ]}
    ];
    const IAB_FLAT = IAB_SIZES.reduce((a, g) => a.concat(g.items), []);
    /* Seeded with the three placements almost every plan buys, so the
       preview is useful before the menu is ever opened. */
    let productionSizes = ['300x250', '728x90', '160x600'];
    // iabDims (proportional swatch math for the old .pt-prod-row shape)
    // is gone with that recipe — V3 (PLAN.md §V) draws Ships at rows on
    // setSizePreview like every other pick row, below.
    /* V3 (PLAN.md §V, from V1's review) — both Sizes sections now share
       ONE row recipe (.pt-set-item--pick, the same mono-value-then-name
       anatomy everywhere else on the page draws pick rows in) instead
       of Ships at wearing the old Ratios .pt-prod-row look while Board
       at wore this one. Shared here too: the roster is 16 rows across
       three IAB groups, which is a long wall for TWO sections in one
       popover — Rectangles & squares (6, every size a plan is likely to
       actually buy) and Leaderboards & banners' own first four stay
       visible; the rest (three more Leaderboards & banners, all of
       Skyscrapers) wait behind one '+ N more' disclosure per section,
       reusing the editor's own gallery-disclosure recipe (.pt-editor-
       swap-more) rather than inventing a second collapse idiom. PLAN.md's
       review note anticipated '+ 7 more' against a 23-size roster; the
       live roster here is 16, so the true hidden count is computed
       below rather than hand-typed to match a number that no longer
       applies. rowFn draws one row; sizeGroupRowsHTML is the shared
       shape both boardSizeRowsHTML and shipSizeRowsHTML build on. */
    const SIZES_MORE_LEAD = { 'Leaderboards & banners': 4, 'Skyscrapers': 0 };
    function sizeGroupRowsHTML(rowFn) {
      let shown = '', hidden = '', hiddenN = 0;
      IAB_SIZES.forEach((g) => {
        const lead = SIZES_MORE_LEAD.hasOwnProperty(g.group) ? SIZES_MORE_LEAD[g.group] : g.items.length;
        const head = '<div class="pt-prod-group">' + g.group + '</div>';
        if (lead > 0) shown += head + g.items.slice(0, lead).map(rowFn).join('');
        const rest = g.items.slice(lead);
        if (rest.length) {
          hidden += (lead === 0 ? head : '') + rest.map(rowFn).join('');
          hiddenN += rest.length;
        }
      });
      if (!hiddenN) return shown;
      // No stable id: this HTML can be built twice at once (the
      // toolbar's own persistent list plus a fresh copy inside the
      // hat's pill menu), so aria-controls would either collide or go
      // stale — the toggle below reaches the region as the button's own
      // next sibling instead.
      return shown +
        '<button class="pt-editor-swap-more pt-sizes-more" type="button" aria-expanded="false">' +
          '<span>+ ' + hiddenN + ' more</span>' +
          '<span class="pt-editor-swap-more-caret" aria-hidden="true"><svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 4l3 3 3-3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg></span>' +
        '</button>' +
        '<div class="pt-sizes-more-list" hidden>' + hidden + '</div>';
    }
    // Reveals/hides one Sizes '+ N more' region — shared by the toolbar
    // popover and the hat pill's menu, since both delegate clicks and
    // neither can rely on an id to find the region (see above).
    function toggleSizesMore(btn) {
      const open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      const region = btn.nextElementSibling;
      if (region) region.hidden = open;
    }
    // 9/10 (Bryan: "have this be searchable and have the entire set be
    // there at a glance, I don't want to have to click a plus to see
    // more") — ONE roster: every size once, with two marks on its row,
    // the board radio and the ships check, under two eyebrows; a search
    // field above filters by size or name; nothing folds. The row keeps
    // the pick-row recipe (glyph, mono size, name) — data-board-size
    // rides on the row, so clicking the size or its name picks the
    // board size; data-prod-size rides on the check mark alone.
    // Second pass (Bryan: "the board and ships thing makes no sense to
    // me — put a section of the 5 most common banner sizes right at the
    // top"). One check per row: a size is in the campaign or it is
    // not. Which size the board is SHOWN at is a strip of the checked
    // sizes above the list, one lit — a view, not a second decision.
    // COMMON leads: IAB's universal five, the ones nearly every plan
    // asks for; the rest of the roster follows in its groups without
    // repeating them.
    const SIZES_COMMON = ['300x250', '728x90', '160x600', '300x600', '320x50'];
    // Third pass (Bryan, 9/10: "this should not be multi select, there
    // is no reason to have the board shown at size, and make the radial
    // buttons ones we've already used") — ONE size, one radio, the
    // hat's own ring. The size picked here is the size the board is
    // built at and the size the package ships; Preview sizes on a
    // select shows the common five for reference.
    function sizeRowHTML(it) {
      const on = brief.boardSize === it.id;
      const q = (it.id + ' ' + it.id.replace('x', '\u00d7') + ' ' + it.label).toLowerCase();
      return '<div class="pt-set-item pt-set-item--pick pt-size-row' + (on ? ' is-active' : '') + '" role="radio" aria-checked="' + on + '" tabindex="0"' +
          ' data-board-size="' + it.id + '" data-set-value-mono data-q="' + escape(q) + '">' +
        '<span class="pt-set-item-icon" aria-hidden="true">' + setSizePreview(it.id) + '</span>' +
        '<span class="pt-set-item-labels">' +
          '<span class="pt-set-item-name">' + it.id.replace('x', '\u00d7') + '</span>' +
          '<span class="pt-set-item-sub">' + escape(it.label) + '</span>' +
        '</span>' +
        '<span class="pt-set-item-radio" aria-hidden="true"></span>' +
      '</div>';
    }
    function paintSizeViewStrips() {} // the "board shown at" strip is gone (third pass); callers stay harmless
    // Z.2.1 — same row, same click (still just sets brief.boardSize):
    // the sub line carries the plan's own count for that size instead
    // of the IAB descriptive label, so "300×250 · 5" reads as what the
    // plan is asking for, not what the rectangle is called.
    function planSizeRowHTML(it, count) {
      const on = brief.boardSize === it.id;
      const q = (it.id + ' ' + it.id.replace('x', '×') + ' ' + it.label).toLowerCase();
      return '<div class="pt-set-item pt-set-item--pick pt-size-row' + (on ? ' is-active' : '') + '" role="radio" aria-checked="' + on + '" tabindex="0"' +
          ' data-board-size="' + it.id + '" data-set-value-mono data-q="' + escape(q) + '">' +
        '<span class="pt-set-item-icon" aria-hidden="true">' + setSizePreview(it.id) + '</span>' +
        '<span class="pt-set-item-labels">' +
          '<span class="pt-set-item-name">' + it.id.replace('x', '×') + '</span>' +
          '<span class="pt-set-item-sub">' + count + (count === 1 ? ' space' : ' spaces') + '</span>' +
        '</span>' +
        '<span class="pt-set-item-radio" aria-hidden="true"></span>' +
      '</div>';
    }
    function sizesRosterHTML() {
      // Z.2.1 — "the hat's Sizes roster gains an IN PLAN group at the
      // top… before COMMON" once a plan exists.
      let rows = '';
      if (mediaPlan) {
        const planRows = mediaPlan.spaces.map((sp) => {
          const it = IAB_FLAT.filter((x) => x.id === sp.size)[0] || { id: sp.size, label: sp.size.replace('x', '×') };
          return planSizeRowHTML(it, sp.count);
        }).join('');
        rows += '<div class="pt-prod-group" data-group="In plan">In plan</div>' + planRows;
      }
      const common = SIZES_COMMON.map((id) => IAB_FLAT.filter((it) => it.id === id)[0]).filter(Boolean);
      rows += '<div class="pt-prod-group" data-group="Common">Common</div>' + common.map(sizeRowHTML).join('');
      IAB_SIZES.forEach((g) => {
        const items = g.items.filter((it) => SIZES_COMMON.indexOf(it.id) === -1);
        if (!items.length) return;
        rows += '<div class="pt-prod-group" data-group="' + escape(g.group) + '">' + escape(g.group) + '</div>' + items.map(sizeRowHTML).join('');
      });
      return '<div class="pt-sizes-search"><input class="pt-cta-input" type="search" placeholder="Search sizes\u2026" aria-label="Search sizes" autocomplete="off" data-sizes-search></div>' +
        '<div class="pt-sizes-list" role="radiogroup" aria-label="Size">' + rows + '</div>';
    }
    // The search: a size ("728", "300x", "300×250") or a name ("leader")
    // narrows the roster; a group head hides once none of its rows show.
    function wireSizesSearch(root) {
      const input = root.querySelector('[data-sizes-search]');
      if (!input) return;
      const apply = () => {
        const q = input.value.trim().toLowerCase().replace(/\u00d7/g, 'x');
        const alive = {};
        Array.prototype.forEach.call(root.querySelectorAll('.pt-size-row'), (row) => {
          const hit = !q || row.dataset.q.replace(/\u00d7/g, 'x').indexOf(q) !== -1;
          row.hidden = !hit;
          if (hit) alive[row.dataset.boardSize] = true;
        });
        Array.prototype.forEach.call(root.querySelectorAll('.pt-prod-group'), (head) => {
          let el = head.nextElementSibling, any = false;
          while (el && !el.classList.contains('pt-prod-group')) { if (!el.hidden) any = true; el = el.nextElementSibling; }
          head.hidden = !any;
        });
      };
      input.addEventListener('input', apply);
      input.addEventListener('keydown', (e) => { if (e.key === 'Escape' && input.value) { input.value = ''; apply(); e.stopPropagation(); } });
      input.addEventListener('click', (e) => e.stopPropagation());
    }
    function renderProdSizes() { syncSizesChip(); syncProdSizeTicks(); }
    function syncProdSizeTicks() {
      Array.prototype.forEach.call(document.querySelectorAll('[data-prod-size]'), (n) => {
        const on = productionSizes.indexOf(n.dataset.prodSize) !== -1;
        n.classList.toggle('is-active', on);
        n.setAttribute('aria-checked', String(on));
      });
      const countEl = document.getElementById('ptProdSizesCount');
      if (countEl) countEl.textContent = productionSizes.length ? String(productionSizes.length) : '';
      paintSizeViewStrips(); // the "board shown at" strip lists the checked sizes
    }

    /* ═══ V1 (PLAN.md §V) — Sizes: one roster, one brief ═══════════
       brief.boardSize / brief.shipSizes are the sheet's one source of
       truth for size, from here on. productionSizes, mediaSetup.sizes
       and state.sizes stay live aliases — every write to the brief
       re-syncs them in place, mutating rather than reassigning so
       anything holding the old array reference still sees the change
       — so every reader that predates this pass (Preview sizes,
       buildPackageStageData (AF, formerly renderTrafficking),
       buildConceptSheetDOM, the P11 harness)
       keeps seeing the right values without being
       rewritten one at a time. SIZES (the old 9-entry list) no longer
       feeds any popover row — the roster is IAB_FLAT/IAB_SIZES
       everywhere now — and stays on only to name boardSize's default
       and label the odd size that happens to be one of its 9. ═══ */
    const brief = {
      boardSize: '300x250',
      shipSizes: ['300x250'], // follows boardSize (setBoardSize) — one size, third pass
      /* V2 (PLAN.md §V) — the sheet's volume: concepts (rows) and
         variants (per row). SHEET_ROWS/VARIANTS_PER_ROW stay at their
         original 3 purely to NAME these defaults — mmVolume() already
         falls back to them for exactly that reason — every deal-time
         read below consults brief.concepts/brief.variants instead. */
      concepts: SHEET_ROWS,
      variants: VARIANTS_PER_ROW
    };
    function syncBriefAliases() {
      productionSizes.length = 0;
      Array.prototype.push.apply(productionSizes, brief.shipSizes);
      mediaSetup.sizes = [brief.boardSize];
      state.sizes = [brief.boardSize];
    }
    // Both surfaces (the toolbar chip, the hat pill's own label via
    // sizePillLabel) read brief directly; this is only the toolbar
    // chip's own live text — board size in mono, then the ship count.
    function syncSizesChip() {
      const boardEl = document.getElementById('ptProdSizesBoardLabel');
      // the band speaks for the board on the sheet, not the next brief
      const boardSizeId = liveBoardVol().boardSize;
      if (boardEl) boardEl.textContent = boardSizeId.replace('x', '×');
      const countEl = document.getElementById('ptProdSizesCount');
      if (countEl) countEl.textContent = String(brief.shipSizes.length);
    }
    // Board at — re-renders every card already on the board in place:
    // same letter/layout/colorway/font/copy/image, just re-cast at a
    // different shape. data-size on the card and its .pt-banner is
    // the frame size the banner engine's per-size CSS reads (copy fit,
    // font scale); the row's own box/wide/tower class follows the new
    // shape too, since that's what the fit pass below reads to choose
    // between a uniform side-by-side scale and a stacked full-width
    // one. Selects are a locked shortlist, not the board — this never
    // reaches #ptSelects.
    function restampBoardSize(sizeId) {
      if (liveBoard) liveBoard.boardSize = sizeId;
      const meta = SIZES.filter(s => s.id === sizeId)[0];
      const label = meta ? meta.label : sizeId.replace('x', '×');
      const shape = shapeClassFor(sizeId);
      Array.prototype.forEach.call(document.querySelectorAll('#ptConcepts .pt-shape-row'), (row) => {
        row.classList.remove('pt-shape-row-box', 'pt-shape-row-wide', 'pt-shape-row-tower');
        row.classList.add('pt-shape-row-' + shape);
        Array.prototype.forEach.call(row.querySelectorAll(':scope > .pt-banner-card'), (cardEl) => {
          cardEl.setAttribute('data-size', sizeId);
          const banner = cardEl.querySelector('.pt-banner');
          if (banner) banner.setAttribute('data-size', sizeId);
          const removeBtn = cardEl.querySelector('.pt-banner-remove-btn');
          if (removeBtn) removeBtn.setAttribute('aria-label', 'Remove ' + label);
        });
      });
      scheduleFitAllBannerScales();
    }
    function setBoardSize(id, opts) {
      if (!id || id === brief.boardSize) return;
      // AJ.0 — from the hat, with a board on the sheet, the pick sets
      // the NEXT generation only: no bank, no re-skin, the board and
      // its History untouched. The band's own "Board at" keeps both.
      const boardUp = !!document.querySelector('#ptConcepts > .pt-concept-group');
      if (opts && opts.fromHat && boardUp) {
        brief.boardSize = id;
        brief.shipSizes = [id];
        mediaSetup.sizes = [id]; // the hat's own mirror (its pill label); state.sizes stays the board's
        paintVolumeGrids();
        syncSizesChip();
        return;
      }
      bankCurrentBoardOnce(); // 9/10 — restampBoardSize below re-skins the board live; bank the truth before it does
      brief.boardSize = id;
      brief.shipSizes = [id]; // one size (third pass): the board's size is the size that ships
      syncBriefAliases();
      paintVolumeGrids(); // the volume cells take the new size's shape
      restampBoardSize(id);
      syncSizesChip();
    }
    // Floor of one — refuses to drop the last ship size. A refusal is
    // silent: nothing changed, so nothing re-ticks.
    function toggleShipSize(id) {
      const at = brief.shipSizes.indexOf(id);
      if (at !== -1) {
        if (brief.shipSizes.length === 1) return false;
        brief.shipSizes.splice(at, 1);
      } else {
        brief.shipSizes.push(id);
      }
      syncBriefAliases();
      syncSizesChip();
      return true;
    }
    function syncBoardSizeTicks() {
      Array.prototype.forEach.call(document.querySelectorAll('[data-board-size]'), (n) => {
        const on = n.dataset.boardSize === brief.boardSize;
        n.classList.toggle('is-active', on);
        n.setAttribute('aria-checked', String(on));
      });
      syncSizesChip();
    }
    // Board at — one radio over the full roster, the hat's own
    // .pt-set-item--pick recipe (this was the size pill's own pre-V1
    // markup — reused rather than invented twice, since Sizes is the
    // one control that now appears on both surfaces). Mono value +
    // Inter name on one baseline, same as every other pick row.
    function boardSizeRowsHTML() {
      return sizeGroupRowsHTML((it) => setPickItemHTML(
        setSizePreview(it.id), it.id.replace('x', '×'), it.label,
        brief.boardSize === it.id, null, true, 'data-board-size="' + it.id + '"'
      ));
    }
    // Toolbar-only: both sections into their own lazily-built lists
    // (ptBoardSizeList / ptProdSizesList), same lazy-build-once
    // contract renderProdSizes always kept, plus the chip's own text.
    function renderSizesPopover() {
      const host = document.getElementById('ptSizesRoster');
      if (host && !host.children.length) {
        host.innerHTML = sizesRosterHTML();
        wireSizesSearch(host);
      }
      syncBoardSizeTicks();
      renderProdSizes();
      const input = host && host.querySelector('[data-sizes-search]');
      if (input) setTimeout(() => input.focus(), 30);
    }
    // Size — the hat's own pill for the same control. wireSetPill's
    // one-flat-list-of-radios shape doesn't fit two different row
    // types (a radio section and a checkbox section) in one menu, so
    // this pill wires itself off the same two row-builders above
    // instead of going through it — same brief fields, same rows, a
    // different open/click door.
    function openSizeSetMenu(btn) {
      if (setOpenMenu && setOpenMenu.btn === btn) { closeSetMenu(); return; }
      const menu = el('<div class="pt-set-menu pt-set-menu--roster" role="menu" aria-hidden="true"></div>');
      menu.innerHTML = '<div class="pt-set-sec">Sizes</div>' + sizesRosterHTML();
      wireSizesSearch(menu);
      menu.addEventListener('click', (e) => {
        // the ships check sits INSIDE the board row, so it is asked first
        const boardRow = e.target.closest('[data-board-size]');
        if (boardRow) {
          setBoardSize(boardRow.dataset.boardSize, { fromHat: true });
          syncBoardSizeTicks();
          renderSettingsPillLabels(btn.closest('.pt-set-row'));
          syncMediaModeStage(); // stage behind the hat tracks the live pills, same as every other pill
        }
      });
      openSetMenu(btn, menu); // appends to <body> — only past this point does the menu's own subtree exist in the document
      syncProdSizeTicks();
    }

    /* ═══ V2 (PLAN.md §V) — Generate: the sheet's volume, one brief
       field pair (brief.concepts/brief.variants), two doors (the
       sheet toolbar's Generate chip, the hat's Volume pill) sharing
       one set of row-builders and writers — same pattern Sizes set
       above. Concepts to add stops at 9 (the ghost tile's own 24-row
       ceiling divides evenly by it); variants per concept stops at 5,
       "the board's own width for the next generate" per the plan. ═══ */
    // 9/10 (Bryan, on the two radio lists this replaced: "this is a
    // little confusing and the visuals aren't right") — the volume is
    // ONE grid: rows are concepts, columns are variants, and you pick
    // the rectangle the board will be, the way a table-size picker
    // works. Hovering previews the rectangle, clicking commits it, the
    // line beneath says the result in words. Any 1–9 × 1–5. Both
    // doors (the sheet's Generate menu, the hat's Volume pill) draw
    // the same grid and paint from the same brief.
    const VOL_MAX_CONCEPTS = 9, VOL_MAX_VARIANTS = 5;
    function volumeGridHTML() {
      let cols = '', rows = '', cells = '';
      for (let v = 1; v <= VOL_MAX_VARIANTS; v++) cols += '<span>' + v + '</span>';
      for (let c = 1; c <= VOL_MAX_CONCEPTS; c++) {
        rows += '<span>' + c + '</span>';
        for (let v = 1; v <= VOL_MAX_VARIANTS; v++) {
          cells += '<button class="pt-vol-cell" type="button" data-c="' + c + '" data-v="' + v + '" aria-label="' +
            c + (c === 1 ? ' concept' : ' concepts') + ' \u00d7 ' + v + (v === 1 ? ' variant' : ' variants') + '"></button>';
        }
      }
      // AC.1 — the axes + grid sit in a well (a light ground one step
      // under the menu's white); the summary line stays outside it,
      // centred underneath, so it can be the floor width the well
      // grows to fill rather than a caption trapped inside it.
      return '<div class="pt-vol" data-volume-grid>' +
        '<div class="pt-vol-well">' +
          '<div class="pt-vol-axis pt-vol-axis--cols" aria-hidden="true"><span class="pt-vol-axis-title" style="grid-column:1 / -1">variants</span><span></span><span></span>' + cols + '</div>' +
          '<div class="pt-vol-body">' +
            '<div class="pt-vol-axis-title pt-vol-axis-title--rows" aria-hidden="true">concepts</div>' +
            '<div class="pt-vol-axis pt-vol-axis--rows" aria-hidden="true">' + rows + '</div>' +
            '<div class="pt-vol-grid" role="group" aria-label="Concepts by variants">' + cells + '<span class="pt-vol-sel" aria-hidden="true"></span></div>' +
          '</div>' +
        '</div>' +
        // Bryan, 9/15 ("stays the same size no matter how the text
        // changes as you scroll over the concepts and variants rows"):
        // the summary line is the floor width the well fills, and its
        // plurals change width as the pointer moves ("1 concept × 1
        // variant · 1 unit" is narrower than "9 concepts × 5 variants ·
        // 45 units"). A hidden twin of the widest line shares the same
        // grid cell, so the floor is always the widest case and the
        // panel never moves.
        '<div class="pt-vol-read-box">' +
          '<div class="pt-vol-read" aria-live="polite"></div>' +
          '<div class="pt-vol-read pt-vol-read-sizer" aria-hidden="true"><b>9</b> concepts \u00d7 <b>5</b> variants <span class="pt-vol-units">\u00b7 45 units</span></div>' +
        '</div>' +
      '</div>';
    }
    // ONE visual for the committed pick and a hover preview alike: the
    // selection rectangle glides to the extent (a preview is the same
    // rectangle, moved), so the two never show at once (Bryan's 9/10
    // screenshot: a 9×1 preview lit over a 3×3 pick read as neither).
    // The cells take the chosen size's own shape (9/10, Bryan: "make
    // the cells match the banner sizes that have been chosen and make
    // the container flex to fit"): width and height from the board
    // size's aspect around a 20×16 base, held between 10 and 44 on the
    // long side and never under 12 tall so the row numbers stay legible.
    // Fix W.1 — the pure size math, pulled out of volumeCellVars so a
    // board rail item (a PAST board, not necessarily the live brief's
    // size) can size its cells the identical way without a DOM root.
    function volumeCellSize(sizeId) {
      const d = bpDimsOf(sizeId);
      const a = d.w / d.h;
      const cw = Math.round(Math.min(44, Math.max(10, 20 * Math.sqrt(a / 1.2))));
      const ch = Math.round(Math.min(30, Math.max(12, cw / a))); // 30 tall at most: nine rows of skyscrapers still fit the menu under the pill
      return { cw: cw, ch: ch };
    }
    function volumeCellVars(root, sizeId) {
      const s = volumeCellSize(sizeId || mmBoardSizeId());
      root.style.setProperty('--vol-cw', s.cw + 'px');
      root.style.setProperty('--vol-ch', s.ch + 'px');
    }
    function paintVolumeGrid(root, c, v, lit, instant) {
      volumeCellVars(root);
      const sel = root.querySelector('.pt-vol-sel');
      const first = root.querySelector('.pt-vol-cell');
      const corner = root.querySelector('.pt-vol-cell[data-c="' + c + '"][data-v="' + v + '"]');
      if (sel && instant) { // the first paint after an open lands at size — no 0×0 frame growing in (Bryan: "the little blue dot when I first open it")
        sel.style.transition = 'none';
        requestAnimationFrame(() => { sel.style.transition = ''; });
      }
      if (sel && first && corner) {
        // measured, not assumed: the cells share whatever width the
        // panel gives the grid (the hat's menu and the sheet's popover differ)
        sel.style.width = (corner.offsetLeft + corner.offsetWidth - first.offsetLeft) + 'px';
        sel.style.height = (corner.offsetTop + corner.offsetHeight - first.offsetTop) + 'px';
        sel.classList.toggle('is-preview', !!lit);
      }
      Array.prototype.forEach.call(root.querySelectorAll('.pt-vol-cell'), (cell) => {
        cell.classList.toggle('is-in', Number(cell.dataset.c) <= c && Number(cell.dataset.v) <= v);
      });
      Array.prototype.forEach.call(root.querySelectorAll('.pt-vol-axis--cols span'), (n, i) => { n.classList.toggle('is-in', i > 2 && i - 2 <= v); }); // spans 0–2 are the title and the two gutter cells
      Array.prototype.forEach.call(root.querySelectorAll('.pt-vol-axis--rows span'), (n, i) => { n.classList.toggle('is-in', i < c); });
      const read = root.querySelector('.pt-vol-read:not(.pt-vol-read-sizer)');
      if (read) read.innerHTML = '<b>' + c + '</b> ' + (c === 1 ? 'concept' : 'concepts') + ' \u00d7 <b>' + v + '</b> ' + (v === 1 ? 'variant' : 'variants') +
        '<span class="pt-vol-units">\u00b7 ' + (c * v) + (c * v === 1 ? ' unit' : ' units') + '</span>';
    }
    function paintVolumeGrids(instant) {
      Array.prototype.forEach.call(document.querySelectorAll('[data-volume-grid]'), (g) => paintVolumeGrid(g, brief.concepts, brief.variants, false, instant));
    }
    function wireVolumeGrid(root, onPick) {
      const grid = root.querySelector('[data-volume-grid]');
      if (!grid) return;
      paintVolumeGrid(grid, brief.concepts, brief.variants, false);
      grid.addEventListener('mouseover', (e) => {
        const cell = e.target.closest('.pt-vol-cell');
        if (cell) paintVolumeGrid(grid, Number(cell.dataset.c), Number(cell.dataset.v), true);
      });
      grid.addEventListener('mouseleave', () => paintVolumeGrid(grid, brief.concepts, brief.variants, false));
      grid.addEventListener('click', (e) => {
        const cell = e.target.closest('.pt-vol-cell');
        if (!cell) return;
        e.stopPropagation();
        setBriefConcepts(Number(cell.dataset.c));
        setBriefVariants(Number(cell.dataset.v));
        paintVolumeGrids();
        if (onPick) onPick();
      });
    }
    // Kept as the name every caller uses: repaints every grid from the brief.
    function syncGenerateTicks() { paintVolumeGrids(); }
    // The toolbar chip's own live text ("Generate 3") and the
    // popover's own "Generate N more" action row — both read
    // brief.concepts, so a Volume-pill pick (a different door) keeps
    // them honest too.
    function syncGenerateChip() {
      const countEl = document.getElementById('ptGenerateCount');
      if (countEl) countEl.textContent = String(brief.concepts);
      const moreEl = document.getElementById('ptGenerateMoreCount');
      if (moreEl) moreEl.textContent = String(liveBoardVol().variants);
    }
    function setBriefConcepts(n) {
      if (!n || n === brief.concepts) return;
      brief.concepts = n;
      // AW.3 — the Layouts pick list is capped at the concept count:
      // lowering trims it from the end (three picks, concepts to 2 →
      // the third drops); raising needs no action here — the deal's
      // own repeat-wrap (AW.1/AW.6) already covers the newly-added
      // concepts with whatever picks are still there. Every caller of
      // this door already re-reads the pill/panel right after.
      if (mediaSetup.templates.length > n) mediaSetup.templates.length = n;
      syncGenerateChip();
      syncConceptGhostTile(); // the ghost tile's own label tracks the brief live, same contract as everywhere else
    }
    function setBriefVariants(n) {
      if (!n || n === brief.variants) return;
      brief.variants = n;
      syncGenerateChip();
      syncConceptGhostTile(); // the tile's "N more" is one row of variants
    }
    function renderGeneratePopover() {
      const vol = document.getElementById('ptGenerateVolume');
      if (vol && !vol.children.length) {
        vol.innerHTML = volumeGridHTML();
        wireVolumeGrid(vol, () => { syncMediaModeStage(); }); // a volume change reshapes the resting cells live, as the size pill does
      }
      syncGenerateTicks();
      syncGenerateChip();
    }
    function initGenerateMenu() {
      const btn = document.getElementById('ptGenerateBtn');
      const pop = document.getElementById('ptGeneratePop');
      if (!btn || !pop) return;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const willOpen = !pop.classList.contains('is-open');
        closeAllPtSheetPopovers();
        if (willOpen) {
          renderGeneratePopover();
          pop.classList.add('is-open');
          pop.setAttribute('aria-hidden', 'false');
          btn.setAttribute('aria-expanded', 'true');
          positionSheetPop(btn, pop);
          paintVolumeGrids(); // the frame measures its cells — only once the popover is shown
        }
      });
      // Stays open across a Concepts/Variants pick, same as every
      // other toolbar popover — only the two action rows close it.
      pop.addEventListener('click', (e) => {
        e.stopPropagation();
        if (e.target.closest('#ptGenerateMoreBtn')) { appendConceptsWithBeat(); return; }
        if (e.target.closest('#ptRegenerateBtn')) { regenerateBoard(); }
      });
    }
    // §BM — openVolumeSetMenu (the hat pill's own door onto this same
    // grid) retired: the Volume pill is gone from NEW MEDIA SETTINGS,
    // every send is fixed at brief's own default (SHEET_ROWS ×
    // VARIANTS_PER_ROW = 3 × 3 = 9). volumeGridHTML/wireVolumeGrid stay
    // — renderGeneratePopover above still opens the identical grid from
    // the sheet's own (unrelated, post-generation) Generate chip.

    /* Renders one select at every production size. Clones the select's
       own banner per size and re-tags it, so the preview is the real
       component at each placement rather than a picture of one. */
    let previewSourceCard = null;
    function openProductionPreview(selectCard) {
      const overlay = document.getElementById('ptPreview');
      const body = document.getElementById('ptPreviewBody');
      const countEl = document.getElementById('ptPreviewCount');
      const source = selectCard && selectCard.querySelector('.pt-banner');
      if (!overlay || !body || !source) return;
      previewSourceCard = selectCard;
      const srcFramings = readBannerFramings(source);
      const srcOffsets = readBannerOffsets(source); // BA.2 — the clone carries the card's own size's vars; every other placement asks the map for ITS size
      const srcMedia = source.querySelector('.pt-banner-media img, .pt-banner-media video');
      const srcImg = srcMedia ? srcMedia.getAttribute('src') : '';
      /* The production set only — previewing sizes nobody is shipping
         buries the ones somebody has to check. */
      // Third pass: with one size on the brief, the preview shows the
      // select at the common five (plus the board's own size when it is
      // not one of them) — a reference for how the pick carries, not a
      // production set.
      const previewSet = SIZES_COMMON.indexOf(brief.boardSize) === -1 ? [brief.boardSize].concat(SIZES_COMMON) : SIZES_COMMON;
      const previewSizes = IAB_FLAT.filter(it => previewSet.indexOf(it.id) !== -1);
      body.innerHTML = previewSizes.length
        ? previewSizes.map(it => {
            const b = source.cloneNode(true);
            b.setAttribute('data-size', it.id);
            /* Each placement gets the crop chosen for ITS shape. A
               ratio the user never answered for falls back to the
               picture's own focal point rather than inheriting a crop
               composed for a different shape — a 300x250 decision on a
               728x90 is not a decision anyone made. */
            applyFramingToBanner(b, framingForSize(srcFramings, it.id, srcImg));
            applyOffsetsToBanner(b, offsetsForSize(srcOffsets, it.id)); // a 300x250 nudge says nothing about 728x90
            return '<div class="pt-preview-unit" data-preview-size="' + it.id + '">' +
              '<div class="pt-preview-unit-head">' + it.id.replace('x', '×') +
                '<span class="pt-preview-unit-name">' + escape(it.label) + '</span>' +
              '</div>' +
              '<div class="pt-banner-frame">' +
                '<span class="pt-banner-frame-edit" title="Edit">' + ICONS.edit + '</span>' +
                b.outerHTML +
              '</div>' +
            '</div>';
          }).join('')
        : '<p class="pt-preview-empty">No sizes to preview.</p>';
      if (countEl) countEl.textContent = previewSizes.length + (previewSizes.length === 1 ? ' size' : ' sizes');
      /* The CTA says what it would actually deliver — the production
         set, not "everything" — and goes dead when there is nothing to
         send, rather than offering an empty hand-off. */
      const figmaBtn = document.getElementById('ptPreviewFigmaBtn');
      const figmaSub = document.getElementById('ptPreviewFigmaSub');
      if (figmaBtn) figmaBtn.disabled = !previewSizes.length;
      if (figmaSub) figmaSub.textContent = previewSizes.length
        ? previewSizes.length + (previewSizes.length === 1 ? ' frame' : ' frames')
        : 'no sizes picked';
      observeEnvVideoSrc(body);
      overlay.setAttribute('data-visible', '1');
      overlay.setAttribute('aria-hidden', 'false');
      syncMediaTopbar(); // Y — another canvas takeover; the Media bar yields to its own topbar
      // The banners are real components, so they need the same
      // scale-to-fit pass every other surface gives them.
      scheduleFitAllBannerScales();
    }
    function closeProductionPreview() {
      const overlay = document.getElementById('ptPreview');
      if (!overlay) return;
      overlay.setAttribute('data-visible', '0');
      overlay.setAttribute('aria-hidden', 'true');
      syncMediaTopbar();
    }

    /* The select kebab's menu. Body-level and position:fixed for the
       same reason the settings pills' menus are: the card it hangs off
       sits inside surfaces that clip. */
    // §BO.7 (colleague feedback via Bryan, 9/18) — "Save as Template"
    // retires: Edit · Export to Figma · Copy as PNG. 'duplicate' stays
    // selectsOnly and inert (the Selects section it needed retired with
    // §BO.2, so inSelects below is never true any more) rather than
    // being torn out along with everything that once fed it.
    const SELECT_MENU_ITEMS = [
      { id: 'edit', label: 'Edit' },
      { id: 'duplicate', label: 'Duplicate', selectsOnly: true },
      { id: 'figma', label: 'Export to Figma' },
      { id: 'png', label: 'Copy as PNG' }
    ];
    let selectMenuEl = null;
    let selectMenuAnchor = null; // AQ — the kebab a menu is open on: aria-expanded keeps its card's cluster up (CSS) and its tip down (ptShowFloatingTip)
    function closeSelectMenu() {
      if (selectMenuAnchor) { selectMenuAnchor.removeAttribute('aria-expanded'); selectMenuAnchor = null; }
      if (!selectMenuEl) return;
      const m = selectMenuEl;
      selectMenuEl = null;
      m.classList.remove('open');
      setTimeout(() => { if (m.parentElement) m.remove(); }, 240);
    }
    function openSelectMenu(anchor, card) {
      closeSelectMenu();
      const menu = el('<div class="pt-set-menu pt-select-menu" role="menu" aria-hidden="false"></div>');
      const inSelects = !!(card && card.closest('#ptSelects'));
      menu.innerHTML = SELECT_MENU_ITEMS.filter(it => inSelects || !it.selectsOnly).map(it =>
        '<button class="pt-select-menu-item" type="button" role="menuitem" data-select-menu="' + it.id + '">' + it.label + '</button>'
      ).join('');
      document.body.appendChild(menu);
      const r = anchor.getBoundingClientRect();
      const mw = menu.offsetWidth, mh = menu.offsetHeight;
      // AQ — the kebab sits at the artwork's top-right now, so the menu
      // hangs from its RIGHT edge and stays over its own card rather
      // than the neighbour's (a left-aligned drop spilled 200px right).
      let left = Math.min(r.right - mw, window.innerWidth - mw - 12);
      let top = r.bottom + 6;
      if (top + mh > window.innerHeight - 12) top = Math.max(12, r.top - 6 - mh);
      menu.style.left = Math.max(12, left) + 'px';
      menu.style.top = top + 'px';
      menu.addEventListener('click', (e) => {
        e.stopPropagation();
        const hit = e.target.closest('[data-select-menu]');
        if (!hit) return;
        const action = hit.dataset.selectMenu;
        closeSelectMenu();
        if (action === 'edit') {
          /* Edits the unit it was opened on, in either section. It used
             to bounce a select to its source, because the editor could
             only be opened on a card sitting in a concept group and
             letting the two diverge silently was the worse of the two
             wrongs. Neither holds now: a select opens directly, and
             the commit mirrors back to the source while the select is
             unlocked — which is precisely what the lock decides. */
          const frame = card.querySelector('.pt-banner-frame');
          if (frame) openPainterEditor(frame);
          return;
        }
        if (action === 'duplicate') { duplicateSelectCard(card); return; }
        /* The other three are honest stubs: this prototype has no
           Figma bridge, no template store and no rasteriser behind it,
           and a silent no-op would read as a bug. */
        const said = {
          figma: 'Export to Figma isn\\u2019t wired into this prototype — the hand-off would land as a Figma frame per production size.',
          template: 'Save as Template isn\\u2019t wired into this prototype — it would add this unit to the Brand Approved list in the hat.',
          png: 'Copy as PNG isn\\u2019t wired into this prototype — it would rasterise the unit at each production size.'
        }[action];
        if (said) ptBot(said);
      });
      requestAnimationFrame(() => menu.classList.add('open'));
      selectMenuEl = menu;
      selectMenuAnchor = anchor;
      anchor.setAttribute('aria-expanded', 'true');
    }
    document.addEventListener('click', () => closeSelectMenu());

    /* Fixed popovers don't travel with their header, so a canvas
       scroll dismisses them rather than leaving one stranded. */
    function initSheetPopScrollDismiss() {
      const canvasEl = document.getElementById('canvas');
      if (!canvasEl) return;
      canvasEl.addEventListener('scroll', () => {
        if (document.querySelector('.pt-variety-pop.is-open')) closeAllPtSheetPopovers();
      }, { passive: true });
    }

