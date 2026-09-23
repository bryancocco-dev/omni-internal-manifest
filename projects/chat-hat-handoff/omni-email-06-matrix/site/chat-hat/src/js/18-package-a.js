    /* ═══ TRAFFICKING — turns the shortlist into a delivery: the
       metadata sheet a trafficker works from, and the folder tree that
       ships beside it. Built from the SELECTS (what was actually
       chosen) crossed with the production sizes (where it has to
       run) — never from the concept board, which is exploration. ═══ */
    const TRAFFIC = {
      brand: 'Corvache',
      campaign: 'CoastRoad',
      audience: 'Prospecting',
      version: 'v03',
      flight: '15 Sep 2026 – 31 Oct 2026',
      clickUrl: 'https://corvache.com/gt?utm_source=display&utm_medium=programmatic',
      utm: 'utm_source=display&utm_medium=programmatic&utm_campaign=coast_road_fall26&utm_content={creative_id}',
      tracker: 'CM360 click + IAS impression tracker',
      rotation: 'Equal rotation across creatives in each placement',
      approval: 'Brand approved · Legal approved',
      notes: 'Animation ends on CTA; no audio; click entire unit'
    };
    const ICON_FOLDER = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>';
    const ICON_FILE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>';

    /* Brand_Campaign_Audience_Size_Version, plus the unit id. The id is
       not decoration: two selects can share a placement size, and
       without it their zips would collide in the same folder — the one
       naming collision a trafficker cannot recover from. */
    function trafficBaseName(sizeId, unitId) {
      return [TRAFFIC.brand, TRAFFIC.campaign, TRAFFIC.audience, sizeId.replace('x', 'x'), unitId, TRAFFIC.version].join('_');
    }
    // §BO.2 — Package (and the traffic sheet it prints) reads straight
    // off the board's own scope now (selectedUnitCards — the current
    // selection, or every unit when nothing is picked), not a separate
    // Selects shortlist (retired).
    function traffickingSelects() {
      return selectedUnitCards().map((card) => ({
        unitId: (card.querySelector('.pt-unit-id') || {}).textContent || '000',
        headline: (card.querySelector('.pt-banner-headline') || {}).textContent || ''
      }));
    }
    function treeRow(depth, name, isDir, meta) {
      return '<div class="pt-tree-row' + (isDir ? ' is-dir' : '') + '" data-depth="' + depth + '">' +
        '<span class="pt-tree-icon" aria-hidden="true">' + (isDir ? ICON_FOLDER : ICON_FILE) + '</span>' +
        '<span class="pt-tree-name" title="' + escape(name) + '">' + escape(name) + '</span>' +
        (meta ? '<span class="pt-tree-meta">' + escape(meta) + '</span>' : '') +
      '</div>';
    }
    // AF.3 retired the old flat field/value sheet this built
    // (.pt-traffic-sheet/-row) — the same TRAFFIC data now renders as
    // real editable controls in the Package overlay's panel (see
    // buildPackagePanelHTML, below); the folder tree stays.
    function traffickingTreeHTML(units, sizes) {
      let html = treeRow(0, TRAFFIC.brand + '_' + TRAFFIC.campaign + '/', true);
      html += treeRow(1, '01_Final_Creative/', true);
      sizes.forEach((sz) => {
        html += treeRow(2, sz + '/', true);
        units.forEach((u) => {
          const base = trafficBaseName(sz, u.unitId);
          html += treeRow(3, base + '.zip', false, 'HTML5');
          html += treeRow(3, base + '_fallback.jpg', false, 'fallback');
        });
      });
      html += treeRow(1, '02_Trafficking_Sheet/', true);
      html += treeRow(2, 'creative-matrix.xlsx', false, String(units.length * sizes.length) + ' rows');
      html += treeRow(1, '03_Reference/', true);
      html += treeRow(2, 'approved-copy.pdf', false);
      html += treeRow(2, 'source-assets/', true);
      html += treeRow(2, 'motion-spec.pdf', false);
      return '<div class="pt-tree">' + html + '</div>';
    }
    /* ═══ AF — PACKAGE OVERLAY: the trafficking desk. Package (band,
       OUTPUT) opens #ptPackage over the stage column instead of
       appending the old in-flow Trafficking section; the TRAFFIC data
       and tree helpers above stay the source of truth, now feeding
       real editable controls (the old renderTrafficking()/
       traffickingSheetHTML() retired with that section). ═══ */
    // Session-only panel state — never persisted (refresh-resets
    // rule), reset fresh every open (openPackageOverlay) so a stale
    // edit from a prior look at the package never survives a reopen.
    let packageApproval = { brand: true, legal: true };
    // AH.2 — the modal's own focus contract: whatever had focus when
    // Download opened it (the Selects strip's Package button, or the
    // chat's own "Package ready" link) gets it back on close.
    let packageTriggerEl = null;
    const PACKAGE_COMBO_OPTIONS = {
      audience: ['Prospecting', 'Retargeting', 'Loyalty'],
      language: ['English', 'Spanish', 'French'],
      version: ['v03', 'v02', 'v01'],
      format: ['HTML5 ZIP + JPG fallback', 'HTML5 only', 'JPG only'],
      tracker: ['CM360 click + IAS impression tracker', 'CM360 only', 'None'],
      rotation: ['Equal rotation across creatives in each placement', 'Weighted rotation']
    };
    let packageCombo = {
      audience: TRAFFIC.audience, language: 'English', version: TRAFFIC.version,
      format: 'HTML5 ZIP + JPG fallback', tracker: TRAFFIC.tracker, rotation: TRAFFIC.rotation
    };
    // The {size}/{id} TEMPLATE (not trafficBaseName's own join) — the
    // editable pattern the panel's own input carries; the live
    // example line substitutes a real size/id into it as it's edited.
    function packageIdPattern() {
      return [TRAFFIC.brand, TRAFFIC.campaign, TRAFFIC.audience, '{size}', '{id}', TRAFFIC.version].join('_');
    }
    function packageExampleFilename(pattern, sizeId, unitId) {
      return (pattern || '').replace(/\{size\}/g, sizeId.replace('x', '×')).replace(/\{id\}/g, unitId) + '.zip';
    }
    // Fix round (Fable, defect 2) — shared by the build and the
    // pattern input's own live update, so both ever write the exact
    // same markup: a fixed "e.g." label, then the value in a <bdi>
    // (the .pt-package-example-tail CSS above does the RTL/ellipsis
    // truncate-from-the-start trick; <bdi> keeps its digits/
    // punctuation reading left-to-right inside that RTL flow), title
    // carrying the untruncated string.
    function packageExampleInnerHTML(pattern, sizeId, unitId) {
      const value = packageExampleFilename(pattern, sizeId, unitId);
      return '<span class="pt-package-example-label">e.g.&nbsp;</span>' +
        '<bdi class="pt-package-example-tail" title="' + escape(value) + '">' + escape(value) + '</bdi>';
    }
    // AF.2 — one real unit tile: a clone of the select's own banner,
    // reframed at the row's size exactly like openProductionPreview's
    // own recipe (readBannerFramings/framingForSize/applyFramingToBanner,
    // reused verbatim), riding the .pt-banner-scale/-fit shell so
    // applyCardScale sizes it exactly as it sizes a concept row's
    // cards. BC.2 — the tile is the clone in a 1px frame with the
    // unit's id alone beneath it (the Selects strip's own
    // .pt-strip-frame-id voice, reading .pt-unit-var the way the strip
    // does); the full filename rides the tile's title and lives in
    // CONTENTS — no caption.
    function packageUnitTileHTML(card, sizeId) {
      const source = card.querySelector('.pt-banner');
      if (!source) return '';
      const unitId = (card.querySelector('.pt-unit-id') || {}).textContent || '00000';
      const unitVar = (card.querySelector('.pt-unit-var') || {}).textContent || '';
      const srcFramings = readBannerFramings(source);
      const srcMedia = source.querySelector('.pt-banner-media img, .pt-banner-media video');
      const srcImg = srcMedia ? srcMedia.getAttribute('src') : '';
      const b = source.cloneNode(true);
      b.removeAttribute('id');
      b.setAttribute('data-size', sizeId);
      applyFramingToBanner(b, framingForSize(srcFramings, sizeId, srcImg));
      applyOffsetsToBanner(b, offsetsForSize(readBannerOffsets(source), sizeId)); // BA.2 — the row's size takes ITS moves (the clone already carries the card's own size's vars)
      const filename = trafficBaseName(sizeId, unitId) + '.zip';
      return '<div class="pt-package-unit" title="' + escape(filename) + '">' +
          '<div class="pt-package-unit-frame"><div class="pt-banner-scale"><div class="pt-banner-fit"><div class="pt-banner-frame">' + b.outerHTML + '</div></div></div></div>' +
          '<span class="pt-package-unit-id pt-strip-frame-id">' + escape(unitVar) + '</span>' +
        '</div>';
    }
    // The open (unfilled plan space) tile — .pt-slot-ghost's dashed-
    // tile language, riding the SAME shell so it fits at the row's own
    // scale: .pt-banner[data-size] already carries the real
    // width/height (attribute-selector rules above), so the dashed
    // box lands at the exact natural size before fitRowUniform scales
    // the whole row down together with its real neighbors.
    function packageOpenTileHTML(sizeId) {
      return '<div class="pt-package-unit pt-package-unit--open">' +
          '<div class="pt-package-unit-frame"><div class="pt-banner-scale"><div class="pt-banner-fit"><div class="pt-banner-frame">' +
            '<div class="pt-banner pt-package-open-tile" data-size="' + sizeId + '">open</div>' +
          '</div></div></div></div>' +
        '</div>';
    }
    // BC.2 — a size GROUP: the head is the size (sans 13/600) and the
    // count (sans 13 subtle) on one line, 12px above its tiles, which
    // wrap with 16px gaps; a planned group counts its fill ("2 of 5
    // filled" — the header's own plan vocabulary) instead of a flat
    // "5 units".
    function packageSizeRowHTML(sizeId, cards, openCount, planned) {
      const sizeMeta = SIZES.filter((s) => s.id === sizeId)[0];
      const label = sizeMeta ? sizeMeta.label : sizeId.replace('x', '×');
      const n = cards.length + (openCount || 0);
      // BJ.2 — planned rows always read fill progress ("3 of 3
      // filled"); an unplanned row is now always the EXTRA case (the
      // no-plan "every select at every size" row is retired — see
      // buildPackageStageData), so it reads "N extra" (e.g. "160×600
      // · 1 extra"), never "N units".
      const count = planned ? cards.length + ' of ' + n + ' filled' : n + ' extra';
      return '<div class="pt-package-group" data-package-size="' + sizeId + '">' +
        '<div class="pt-package-group-head"><span class="pt-package-group-size">' + label + '</span>' +
          '<span class="pt-package-group-count">' + count + '</span></div>' +
        '<div class="pt-package-group-tiles">' +
          cards.map((c) => packageUnitTileHTML(c, sizeId)).join('') +
          (openCount ? new Array(openCount).fill(0).map(() => packageOpenTileHTML(sizeId)).join('') : '') +
        '</div>' +
      '</div>';
    }
    // BJ.1 — a trafficking package IS the plan with the fills in it,
    // so this lays out against campaignFlightPlan() in EVERY case now
    // (mediaPlan set, or the campaign's own default fixture): rows
    // follow the plan's own sizes in the plan's own order, a select
    // fills only the slot matching its own size (groupSelectsForPlan
    // — the exact grouping Selects' own Slots view uses), unfilled
    // spaces are dashed "open" tiles at the row's end, and a select at
    // a size the plan never asked for (or past its count) lands in its
    // own EXTRA row after the plan's rows. The old no-plan "every
    // select ships at every checked production size" branch is gone —
    // there is no more no-plan case inside Package.
    function buildPackageStageData() {
      const cards = selectedUnitCards(); // §BO.2 — the sheet's own scope: the selection, or every board unit
      const grouped = groupSelectsForPlan(campaignFlightPlan(), cards);
      const rows = grouped.groups.filter((g) => g.count > 0).map((g) => ({ sizeId: g.size, cards: g.filled, open: g.count - g.filled.length, planned: true }));
      if (grouped.extra.length) {
        const bySize = {};
        grouped.extra.forEach((c) => { (bySize[c.dataset.size] || (bySize[c.dataset.size] = [])).push(c); });
        Object.keys(bySize).forEach((sz) => rows.push({ sizeId: sz, cards: bySize[sz], open: 0, planned: false }));
      }
      const totalUnits = grouped.groups.reduce((a, g) => a + g.filled.length, 0) + grouped.extra.length;
      return { rows: rows, totalUnits: totalUnits, totalSizes: rows.length, totalSelects: cards.length };
    }
    // BC.4 / BJ.2 — the foot's delivery line, HTML: the sheet's
    // filename is the one mono piece (data), the rest sans. Read with
    // innerHTML. Always the plan's own fill copy now — "N of M spaces
    // filled" (N = totalUnits, M = the plan's total, the same pair the
    // header reads) — never a flat unit count.
    function packageStageFootText(totalUnits) {
      var total = planTotalSpaces(campaignFlightPlan());
      return totalUnits + ' of ' + total + ' spaces filled · ' + escape(packageCombo.format) +
        ' · <span class="pt-package-foot-file">creative-matrix.xlsx</span>';
    }
    // BC.1 / BJ.1 — the header's counts as ONE quiet line, always the
    // fill against the campaign's own flight plan now: "3 of 15
    // filled · 4 sizes" (a select fills only its own size's slot
    // there, so selects × sizes would read as broken arithmetic — the
    // old "× =" product is retired from Package entirely). The
    // board's name is its own header piece (#ptPackageBoard).
    function packageHeaderCountsText(data) {
      const sizes = data.totalSizes + (data.totalSizes === 1 ? ' size' : ' sizes');
      return data.totalUnits + ' of ' + planTotalSpaces(campaignFlightPlan()) + ' filled \u00b7 ' + sizes;
    }
    // BC.4 / BJ.2 — the foot's status, now THREE states: approvals
    // pending still win (amber, naming the one missing — Download
    // disabled); both approvals on but the plan has open spaces reads
    // amber "M − N spaces open" and Download stays ENABLED (a partial
    // delivery still ships — the status only says so); green "Ready
    // to ship" only once every plan space is filled AND both
    // approvals are on. openSpaces is the same M − N the header's "N
    // of M filled" already reads, so the two can never disagree.
    function packageStatusText(openSpaces) {
      const b = packageApproval.brand, l = packageApproval.legal;
      if (b && l) {
        if (openSpaces > 0) return openSpaces + (openSpaces === 1 ? ' space open' : ' spaces open');
        return 'Ready to ship';
      }
      if (!b && !l) return 'Awaiting approvals';
      return b ? 'Awaiting legal approval' : 'Awaiting brand approval';
    }
    function syncPackageStatus() {
      const data = buildPackageStageData();
      const openSpaces = Math.max(0, planTotalSpaces(campaignFlightPlan()) - data.totalUnits);
      const ready = !!(packageApproval.brand && packageApproval.legal && openSpaces === 0);
      const status = document.getElementById('ptPackageStatus');
      if (status) {
        status.classList.toggle('pt-traffic-ok', ready);
        status.classList.toggle('pt-traffic-pending', !ready);
      }
      const text = document.getElementById('ptPackageStatusText');
      if (text) text.textContent = packageStatusText(openSpaces);
      // BJ.2 — Download is gated on approvals ALONE now: a partial
      // delivery (spaces still open) still ships once brand + legal
      // are both on; only the approvals ever disable it.
      const dl = document.getElementById('ptPackageDownloadBtn');
      if (dl) dl.disabled = !(packageApproval.brand && packageApproval.legal);
    }
    // BC.3 — the URL, the UTM, the pattern and the notes are auto-height
    // textareas (wrapping anywhere, never scrolling on their own) so
    // nothing truncates: height follows scrollHeight (+2 for the quiet
    // field's own 1px borders under border-box). Run after the panel
    // lands, on every input, and when the column resizes.
    function packageAutosizeTextareas() {
      Array.prototype.forEach.call(document.querySelectorAll('#ptPackagePanel .pt-package-textarea'), (ta) => {
        ta.style.height = 'auto';
        ta.style.height = (ta.scrollHeight + 2) + 'px';
      });
    }
    // AH.2 — the foot line moved out of the stage into the card's own
    // page-wide FOOTER (static markup, #ptPackageStageFoot lives
    // there now); openPackageOverlay fills it from stage.data instead
    // of it being built into this HTML.
    function buildPackageStageHTML() {
      const data = buildPackageStageData();
      const rowsHtml = data.rows.map((r) => packageSizeRowHTML(r.sizeId, r.cards, r.open, r.planned)).join('');
      return { html: rowsHtml, data: data };
    }
    // BC.2 — ONE scale for the whole sheet: the largest s (capped at
    // 0.6, floored at 0.3) at which the WIDEST size on the sheet fits
    // two per line in the stage's inner width — every size renders at
    // that same s, so a 728×90 sits beside a 300×250 at true relative
    // size, the set as it ships. Computed once per fit (open, and the
    // column's own ResizeObserver) and applied to every tile, filled
    // or open (the plan's open tiles ride the same scale); Z.2.3's
    // per-row packing (slotRowScale) retired here. Two of the widest
    // per line means 2 × (round(w·s) + the frame's 2px) + the 16px gap
    // ≤ the inner width; the −1 absorbs Math.round's half-pixel.
    const PKG_STAGE_PAD = 32;   // .pt-package-stage's own padding
    const PKG_TILE_GAP = 16;    // .pt-package-group-tiles' gap
    const PKG_TILE_FRAME = 1;   // .pt-package-unit-frame's border
    const PKG_SCALE_MAX = 0.6, PKG_SCALE_MIN = 0.3;
    function fitPackageStage() {
      const root = document.getElementById('ptPackageStage');
      if (!root || !root.clientWidth) return;
      const groups = Array.prototype.slice.call(root.querySelectorAll('.pt-package-group'));
      if (!groups.length) return;
      let widest = 0;
      groups.forEach((g) => {
        const w = parseInt((g.getAttribute('data-package-size') || '').split('x')[0], 10) || 0;
        if (w > widest) widest = w;
      });
      if (!widest) return;
      const pass = () => {
        const innerW = root.clientWidth - PKG_STAGE_PAD * 2;
        if (innerW <= 0) return 0;
        let scale = (innerW - PKG_TILE_GAP - 4 * PKG_TILE_FRAME - 1) / (2 * widest);
        scale = Math.max(PKG_SCALE_MIN, Math.min(PKG_SCALE_MAX, scale));
        root.style.setProperty('--pkg-scale', String(scale)); // the open tile's dash/label counter-scale reads this
        Array.prototype.forEach.call(root.querySelectorAll('.pt-package-unit'), (tile) => {
          const banner = tile.querySelector('.pt-banner');
          const naturalW = banner ? parseInt((banner.getAttribute('data-size') || '').split('x')[0], 10) : 0;
          if (!naturalW) return;
          tile.style.width = (Math.round(naturalW * scale) + 2 * PKG_TILE_FRAME) + 'px';
          applyCardScale(tile, scale);
        });
        return root.clientWidth;
      };
      // Two passes at most: the first is measured before the sheet's
      // own height is known, so a classic (non-overlay) scrollbar can
      // appear under it and narrow clientWidth; the second fits the
      // width the sheet actually has. Overlay scrollbars (the Mac
      // default) never change clientWidth, so the second pass is a
      // no-op there.
      const w1 = pass();
      if (w1 && root.clientWidth !== w1) pass();
    }
    // BC.3 — a combo is the same quiet row as every other value, with
    // a caret at the value's end; it opens the house .pt-set-menu
    // exactly as before (wirePackagePanel → openSetMenu), never a
    // native select. One recipe for Format / Tracker profile /
    // Rotation and for Version's three (laid inline by
    // .pt-package-combo-row with middle dots between).
    const PACKAGE_CARET = '<svg class="pt-package-caret" viewBox="0 0 8 8" width="8" height="8" fill="none" aria-hidden="true"><path d="M1.5 3l2.5 2.5L6.5 3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    function packageComboBtnHTML(key) {
      return '<button class="pt-package-combo" type="button" data-package-combo="' + key + '" aria-haspopup="menu" aria-expanded="false" title="' + escape(packageCombo[key]) + '">' +
          '<span class="pt-package-combo-label">' + escape(packageCombo[key]) + '</span>' + PACKAGE_CARET +
        '</button>';
    }
    // A key · value row: the key in sans 12.5/500 subtle at a fixed
    // 112px, the value filling the rest.
    function packageFieldRowHTML(key, valueHtml) {
      return '<div class="pt-package-row"><span class="pt-package-key">' + escape(key) + '</span><div class="pt-package-val">' + valueHtml + '</div></div>';
    }
    // A quiet text field — a textarea (auto-height, wrapping anywhere)
    // for anything that can run long, an input for the dates.
    function packageTextareaHTML(id, value, mono) {
      return '<textarea class="pt-package-field pt-package-textarea' + (mono ? ' pt-package-field--mono' : '') + '" id="' + id + '" rows="1"' + (mono ? ' spellcheck="false"' : '') + '>' + escape(value) + '</textarea>';
    }
    // APPROVAL — the whole row is the switch (role=switch, aria-checked;
    // setItemChecked flips the dip with its own bloom): key "Brand" /
    // "Legal", the value a status lockup — a 6px dot + "Approved"
    // (.pt-traffic-ok) / "Pending" (.pt-traffic-pending) — and the
    // house .dip-switch at the row's right end.
    function packageApprovalRowHTML(key, label, isOn) {
      return '<button class="pt-package-row pt-package-row--switch" type="button" data-package-approval="' + key + '" role="switch" aria-checked="' + (isOn ? 'true' : 'false') + '">' +
          '<span class="pt-package-key">' + escape(label) + '</span>' +
          '<span class="pt-package-val pt-package-approval-status ' + (isOn ? 'pt-traffic-ok' : 'pt-traffic-pending') + '">' +
            '<span class="pt-package-status-dot" aria-hidden="true"></span>' +
            '<span class="pt-package-approval-text">' + (isOn ? 'Approved' : 'Pending') + '</span>' +
          '</span>' +
          '<span class="dip-switch' + (isOn ? ' is-on' : '') + '" data-on="' + (isOn ? '1' : '0') + '" aria-hidden="true"></span>' +
        '</button>';
    }
    // BC.3 — the SPEC SHEET: the Editor's own .pt-editor-drawer-section/
    // -eyebrow rhythm (the eyebrow the only caps on the sheet), and
    // under each eyebrow key · value rows. Sections in this order:
    // DELIVERY (Format · Creative ID pattern · Version), TRACKING
    // (Click-through URL · UTM · Tracker profile), FLIGHT (Start / End
    // · Rotation), APPROVAL, NOTES, CONTENTS. Every id the wiring reads
    // (ptPackageIdPattern, ptPackageClickUrl, ptPackageUtm,
    // ptPackageFlightStart/End, ptPackageNotes,
    // ptPackageContentsToggle/Body, data-package-combo,
    // data-package-approval) is unchanged, so wirePackagePanel and
    // packageSheetSummaryText keep working as they were.
    function buildPackagePanelHTML(stageData) {
      const pattern = packageIdPattern();
      const firstCard = selectedUnitCards()[0];
      const firstUnitId = firstCard ? (firstCard.querySelector('.pt-unit-id') || {}).textContent || '000' : '000';
      const firstSize = (stageData.rows[0] && stageData.rows[0].sizeId) || productionSizes[0] || '300x250';
      const flightParts = TRAFFIC.flight.split(' – ');
      const tree = traffickingTreeHTML(traffickingSelects(), productionSizes.slice());
      const fileCount = (traffickingSelects().length * productionSizes.length * 2) + 3;
      const dot = '<span class="pt-package-combo-dot" aria-hidden="true">\u00b7</span>';
      const plan = campaignFlightPlan(); // BJ.3 \u2014 DELIVERY's first row: the plan itself, a plain value
      return (
        '<div class="pt-editor-drawer-section">' +
          '<div class="pt-editor-drawer-eyebrow">Delivery</div>' +
          packageFieldRowHTML('Flight plan',
            '<div class="pt-package-plan-row">' +
              '<span class="pt-package-plan-source">' + escape(plan.source) + '</span>' +
              '<span class="pt-package-plan-meta">' + planTotalSpaces(plan) + ' spaces \u00b7 ' + plan.spaces.length + ' sizes</span>' +
            '</div>') +
          packageFieldRowHTML('Format', packageComboBtnHTML('format')) +
          packageFieldRowHTML('Creative ID pattern',
            packageTextareaHTML('ptPackageIdPattern', pattern, true) +
            '<span class="pt-package-example" id="ptPackageIdExample">' + packageExampleInnerHTML(pattern, firstSize, firstUnitId) + '</span>') +
          packageFieldRowHTML('Version',
            '<div class="pt-package-combo-row">' + packageComboBtnHTML('audience') + dot + packageComboBtnHTML('language') + dot + packageComboBtnHTML('version') + '</div>') +
        '</div>' +
        '<div class="pt-editor-drawer-section">' +
          '<div class="pt-editor-drawer-eyebrow">Tracking</div>' +
          packageFieldRowHTML('Click-through URL', packageTextareaHTML('ptPackageClickUrl', TRAFFIC.clickUrl, true)) +
          packageFieldRowHTML('UTM', packageTextareaHTML('ptPackageUtm', TRAFFIC.utm, true)) +
          packageFieldRowHTML('Tracker profile', packageComboBtnHTML('tracker')) +
        '</div>' +
        '<div class="pt-editor-drawer-section">' +
          '<div class="pt-editor-drawer-eyebrow">Flight</div>' +
          packageFieldRowHTML('Start / End',
            '<div class="pt-package-daterow">' +
              '<input class="pt-package-field pt-package-field--mono" type="text" id="ptPackageFlightStart" value="' + escape((flightParts[0] || '').trim()) + '" spellcheck="false">' +
              '<span class="pt-package-daterow-sep" aria-hidden="true">\u2013</span>' +
              '<input class="pt-package-field pt-package-field--mono" type="text" id="ptPackageFlightEnd" value="' + escape((flightParts[1] || '').trim()) + '" spellcheck="false">' +
            '</div>') +
          packageFieldRowHTML('Rotation', packageComboBtnHTML('rotation')) +
        '</div>' +
        '<div class="pt-editor-drawer-section">' +
          '<div class="pt-editor-drawer-eyebrow">Approval</div>' +
          packageApprovalRowHTML('brand', 'Brand', packageApproval.brand) +
          packageApprovalRowHTML('legal', 'Legal', packageApproval.legal) +
        '</div>' +
        '<div class="pt-editor-drawer-section">' +
          '<div class="pt-editor-drawer-eyebrow">Notes</div>' +
          packageTextareaHTML('ptPackageNotes', TRAFFIC.notes, false) +
        '</div>' +
        '<div class="pt-editor-drawer-section">' +
          '<div class="pt-editor-drawer-eyebrow">Contents</div>' +
          '<button class="pt-set-roster-footer" type="button" id="ptPackageContentsToggle" aria-expanded="false">' +
            '<span>Package contents \u00b7 ' + fileCount + ' files</span>' + SET_ICONS.caret +
          '</button>' +
          '<div class="pt-package-contents-body" id="ptPackageContentsBody" hidden>' + tree + '</div>' +
        '</div>'
      );
    }
    // The Media bar's own AF.1 lockup sub-line while Package is open —
    // syncMediaTopbar reads this (special-cased there). BJ.1 retired
    // AF.1's old "2 selects × 3 sizes = 6 units" no-plan formula: a
    // select fills only its own size's slot against the campaign's
    // flight plan now, so that product would read as broken
    // arithmetic — this always reads as fill progress instead, the
    // same "N of M filled" vocabulary syncPackageButton's own tooltip
    // already uses.
    function packageBarLockupText() {
      const data = buildPackageStageData();
      const total = planTotalSpaces(campaignFlightPlan());
      return data.totalUnits + ' of ' + total + ' filled · ' + data.totalSizes + ' size' + (data.totalSizes === 1 ? '' : 's');
    }
    // AG.4 — the Media bar's own lockup sub-line while the Selects
    // viewer is open ("2 selects · 300×250"): one size reads as
    // itself, several (selects span boards of different sizes, §W)
    // fall back to a count, same "N sizes" vocabulary Package uses.
    function selectsViewerLockupText() {
      const cards = getAllSelectCards();
      const sizes = {};
      cards.forEach((c) => { if (c.dataset.size) sizes[c.dataset.size] = true; });
      const sizeIds = Object.keys(sizes);
      const sizeText = sizeIds.length === 1 ? sizeIds[0].replace('x', '×') : (sizeIds.length ? sizeIds.length + ' size' + (sizeIds.length === 1 ? '' : 's') : '');
      return cards.length + ' select' + (cards.length === 1 ? '' : 's') + (sizeText ? ' · ' + sizeText : '');
    }
    // "Copy sheet" — reads the panel's own live field values (an edit
    // since open is real, not just a display), so this is never stale
    // against what's on screen. BJ.3 — gains a Flight plan line right
    // after the title (twelve lines now, was eleven).
    function packageSheetSummaryText() {
      const val = (id) => { const field = document.getElementById(id); return field ? field.value : ''; };
      const data = buildPackageStageData();
      const plan = campaignFlightPlan();
      return [
        'Trafficking sheet — ' + data.totalUnits + (data.totalUnits === 1 ? ' unit' : ' units'),
        'Flight plan: ' + plan.source + ' — ' + data.totalUnits + ' of ' + planTotalSpaces(plan) + ' spaces filled',
        'Creative ID pattern: ' + val('ptPackageIdPattern'),
        'Version: ' + packageCombo.audience + ' / ' + packageCombo.language + ' / ' + packageCombo.version,
        'Format: ' + packageCombo.format,
        'Click-through URL: ' + val('ptPackageClickUrl'),
        'UTM: ' + val('ptPackageUtm'),
        'Tracker profile: ' + packageCombo.tracker,
        'Rotation: ' + packageCombo.rotation,
        'Start/End: ' + val('ptPackageFlightStart') + ' – ' + val('ptPackageFlightEnd'),
        'Approval: Brand ' + (packageApproval.brand ? 'approved' : 'pending') + ' · Legal ' + (packageApproval.legal ? 'approved' : 'pending'),
        'Notes: ' + val('ptPackageNotes')
      ].join('\n');
    }
    function openPackageOverlay() {
      const overlay = document.getElementById('ptPackage');
      const stageEl = document.getElementById('ptPackageStage');
      const panelEl = document.getElementById('ptPackagePanel');
      if (!overlay || !stageEl || !panelEl) return;
      packageTriggerEl = document.activeElement; // AH.2 — focus returns here on close
      packageApproval = { brand: true, legal: true }; // AD.2 rule — nothing persists across opens
      const stage = buildPackageStageHTML();
      stageEl.innerHTML = stage.html;
      panelEl.innerHTML = buildPackagePanelHTML(stage.data);
      observeEnvVideoSrc(stageEl);
      // AH.2 — the card's own HEADER lockup + FOOTER summary (static
      // markup; buildPackageStageHTML/buildPackagePanelHTML no longer
      // carry these — see their own AH.2 notes) and Download's initial
      // disabled state, read fresh every open same as the rest.
      const titleMainEl = document.getElementById('ptPackageTitleMain');
      if (titleMainEl) titleMainEl.textContent = 'Package'; // AL.6 — the main title is "Package" alone
      const board = boards[boardCur];
      const boardEl = document.getElementById('ptPackageBoard');
      if (boardEl) boardEl.textContent = board ? board.name : ''; // AR.2 / BC.1 — the board's name, its own piece
      const countsEl = document.getElementById('ptPackageCounts');
      if (countsEl) countsEl.textContent = packageHeaderCountsText(stage.data); // BC.1 — one quiet line, middle dots
      const footEl = document.getElementById('ptPackageStageFoot');
      if (footEl) footEl.innerHTML = packageStageFootText(stage.data.totalUnits);
      syncPackageStatus(); // BC.4 — the foot's status lockup + Download's disabled state
      overlay.setAttribute('data-visible', '1');
      overlay.setAttribute('aria-hidden', 'false');
      wirePackagePanel();
      syncMediaTopbar(); // AH.2 — no longer special-cased: just re-syncs the bar to whatever it already read
      fitPackageStage();
      packageAutosizeTextareas();
      // AH.2 — focus moves into the card; Tab is trapped there while
      // open (the keydown listener in initPackageOverlay). BC.1 — it
      // lands on the CARD itself (tabindex=-1, no ring of its own), so
      // nothing opens haloed; the first Tab reaches the close X.
      const card = document.getElementById('ptPackageCard');
      if (card) requestAnimationFrame(() => card.focus({ preventScroll: true }));
    }
    function closePackageOverlay() {
      const overlay = document.getElementById('ptPackage');
      if (!overlay || overlay.getAttribute('data-visible') !== '1') return;
      overlay.setAttribute('data-visible', '0');
      overlay.setAttribute('aria-hidden', 'true');
      syncMediaTopbar();
      // AH.2 — the trigger (the Package chip, or the chat's own
      // "Package ready" link) gets focus back.
      if (packageTriggerEl && document.contains(packageTriggerEl)) packageTriggerEl.focus();
      packageTriggerEl = null;
    }
    // this delegation is wired ONCE and reads the DOM fresh on every
    // click — the same _wired guard wireSheetBand uses for its own
    // persisted popovers.
    function wirePackagePanel() {
      const panel = document.getElementById('ptPackagePanel');
      if (!panel || panel._wired) return;
      panel._wired = true;
      panel.addEventListener('input', (e) => {
        if (e.target.classList && e.target.classList.contains('pt-package-textarea')) packageAutosizeTextareas(); // BC.3 — the quiet textareas follow their value
        if (e.target.id !== 'ptPackageIdPattern') return;
        const ex = document.getElementById('ptPackageIdExample');
        const firstCard = selectedUnitCards()[0];
        const firstUnitId = firstCard ? (firstCard.querySelector('.pt-unit-id') || {}).textContent || '000' : '000';
        const firstGroup = document.querySelector('#ptPackageStage [data-package-size]');
        const firstSize = firstGroup ? firstGroup.getAttribute('data-package-size') : (productionSizes[0] || '300x250');
        if (ex) ex.innerHTML = packageExampleInnerHTML(e.target.value, firstSize, firstUnitId);
      });
      panel.addEventListener('click', (e) => {
        const comboBtn = e.target.closest('[data-package-combo]');
        if (comboBtn) {
          e.stopPropagation();
          const key = comboBtn.dataset.packageCombo;
          const opts = PACKAGE_COMBO_OPTIONS[key];
          if (!opts) return;
          if (setOpenMenu && setOpenMenu.btn === comboBtn) { closeSetMenu(); return; }
          const menu = el('<div class="pt-set-menu" role="menu" aria-hidden="true"></div>');
          menu.innerHTML = opts.map((opt) => setPickItemHTML('', opt, null, opt === packageCombo[key], null, false, 'data-package-combo-value="' + escape(opt) + '"')).join('');
          openSetMenu(comboBtn, menu, true);
          menu.addEventListener('click', (ev) => {
            const row = ev.target.closest('[data-package-combo-value]');
            if (!row) return;
            packageCombo[key] = row.getAttribute('data-package-combo-value');
            closeSetMenu();
            const label = comboBtn.querySelector('.pt-package-combo-label');
            if (label) label.textContent = packageCombo[key];
            comboBtn.title = packageCombo[key];
            if (key === 'format') {
              const footEl = document.getElementById('ptPackageStageFoot');
              if (footEl) footEl.innerHTML = packageStageFootText(buildPackageStageData().totalUnits);
            }
          });
          return;
        }
        const approvalBtn = e.target.closest('[data-package-approval]');
        if (approvalBtn) {
          const key = approvalBtn.dataset.packageApproval;
          packageApproval[key] = !packageApproval[key];
          const isOn = packageApproval[key];
          const status = approvalBtn.querySelector('.pt-package-approval-status');
          if (status) {
            status.classList.toggle('pt-traffic-ok', isOn);
            status.classList.toggle('pt-traffic-pending', !isOn);
            const text = status.querySelector('.pt-package-approval-text');
            if (text) text.textContent = isOn ? 'Approved' : 'Pending';
          }
          setItemChecked(approvalBtn, isOn); // aria-checked + the dip-switch's own flip/bloom
          syncPackageStatus(); // BC.4 — the foot's status + Download's disabled state follow
          return;
        }
        const contentsToggle = e.target.closest('#ptPackageContentsToggle');
        if (contentsToggle) {
          const expanded = contentsToggle.getAttribute('aria-expanded') === 'true';
          contentsToggle.setAttribute('aria-expanded', String(!expanded));
          const body = document.getElementById('ptPackageContentsBody');
          if (body) body.hidden = expanded;
          return;
        }
        // AH.2 — Download package / Copy sheet moved to the card's own
        // FOOTER, static markup outside this panel now (never rebuilt
        // per open) — wired once in initPackageOverlay instead.
      });
    }
    (function syncMainHeight() {
      var main = document.querySelector('.main');
      if (!main) return;
      var root = document.documentElement;
      var write = function () { root.style.setProperty('--main-h', main.clientHeight + 'px'); };
      write();
      if (window.ResizeObserver) new ResizeObserver(write).observe(main);
      else window.addEventListener('resize', write);
    })();

    function initPackageOverlay() {
      const stageCol = document.querySelector('#ptPackage .pt-editor-stage-col');
      if (stageCol && window.ResizeObserver) new ResizeObserver(() => { fitPackageStage(); packageAutosizeTextareas(); }).observe(stageCol);
      // AH.2 — the scrim click: only a click landing on the scrim
      // itself (never a bubbled click from the card) closes it.
      const overlayEl = document.getElementById('ptPackage');
      if (overlayEl) {
        overlayEl.addEventListener('click', (e) => {
          if (e.target === overlayEl) closePackageOverlay();
        });
      }
      const closeBtnEl = document.getElementById('ptPackageCloseBtn');
      if (closeBtnEl) closeBtnEl.addEventListener('click', closePackageOverlay);
      // AH.2 — Download package / Copy sheet: the card's own static
      // FOOTER now (never rebuilt per open — see openPackageOverlay's
      // own note), so this is wired once here instead of living in
      // wirePackagePanel's rebuilt-every-open delegation.
      const footEl = document.getElementById('ptPackageFoot');
      if (footEl) {
        footEl.addEventListener('click', (e) => {
          const dlBtn = e.target.closest('#ptPackageDownloadBtn');
          if (dlBtn) {
            if (dlBtn.disabled) return;
            const label = dlBtn.textContent;
            dlBtn.textContent = 'Package ready';
            const n = buildPackageStageData().totalUnits;
            // AH.2 — "the done flash then the modal closes and the
            // chat line posts": both now wait for the flash instead
            // of firing immediately.
            setTimeout(() => {
              dlBtn.textContent = label;
              closePackageOverlay();
              ptBot('<button class="pt-msg-board-link" type="button" data-open-package="1">Package ready</button> — ' + n + (n === 1 ? ' unit' : ' units') + ' for Coast Road.');
            }, 2200);
            return;
          }
          const copyBtn = e.target.closest('#ptPackageCopyBtn');
          if (copyBtn) {
            // Same clipboard-write + fallback as the Share popover's own
            // Copy link (initSharePopover) — a real copy, not just the flash.
            const flash = () => { copyBtn.classList.add('is-copied'); setTimeout(() => copyBtn.classList.remove('is-copied'), 2200); };
            const text = packageSheetSummaryText();
            if (navigator.clipboard && navigator.clipboard.writeText) {
              navigator.clipboard.writeText(text).then(flash, flash);
            } else {
              const ta = document.createElement('textarea');
              ta.value = text;
              ta.style.position = 'fixed';
              ta.style.opacity = '0';
              document.body.appendChild(ta);
              ta.select();
              try { document.execCommand('copy'); } catch (err) {}
              document.body.removeChild(ta);
              flash();
            }
          }
        });
      }
      // AF.1 — Escape closes it (the bar's own Back is handled inside
      // handleWizardBack, which is unconditional; this mirrors
      // #ptPreview's own dedicated capture-phase listener so Escape
      // works here too regardless of #ptMediaMode's own visibility,
      // which is already '0' by the time the resolved sheet — and
      // Package — can be reached). AH.2 — the same listener also traps
      // Tab inside the card while it's open (focus never escapes to
      // the rest of the page).
      document.addEventListener('keydown', (e) => {
        const overlay = document.getElementById('ptPackage');
        if (!overlay || overlay.getAttribute('data-visible') !== '1') return;
        if (e.key === 'Escape') {
          // A combo popover open inside the panel owns the first
          // Escape (closeSetMenu's own capture-phase handler, wired
          // earlier — both listeners fire on this same keydown since
          // stopPropagation there doesn't stop a sibling document
          // listener, so this one has to stand down itself): press it
          // again once the popover is gone to close the overlay.
          if (setOpenMenu) return;
          e.stopPropagation();
          closePackageOverlay();
          return;
        }
        if (e.key === 'Tab') {
          const card = document.getElementById('ptPackageCard');
          if (!card) return;
          const focusables = Array.prototype.filter.call(
            card.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'),
            (n) => n.offsetParent !== null
          );
          if (!focusables.length) return;
          const first = focusables[0], last = focusables[focusables.length - 1];
          // BC.1 — the card itself holds focus at open (it is not in
          // the focusables): the first Tab goes to the first control,
          // Shift+Tab to the last, so focus never leaves the dialog.
          if (focusables.indexOf(document.activeElement) === -1) { e.preventDefault(); (e.shiftKey ? last : first).focus(); return; }
          if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
          else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
      }, true);
    }
    function initPackageButton() {
      const btn = document.getElementById('ptPackageBtn');
      if (!btn) return;
      btn.addEventListener('click', () => {
        if (btn.disabled) return;
        openPackageOverlay();
      });
    }
    // §BO.6 — a prototype stub, the same honest-no-op voice every other
    // unwired Figma door in this sheet already uses (the unit kebab's
    // own entry, the sheet-level kebab's #ptExportFigmaItem, Preview's
    // "Send to Figma"): names the scope it would carry, does nothing
    // behind it.
    function initExportFigmaButton() {
      const btn = document.getElementById('ptExportFigmaBtn');
      if (!btn) return;
      btn.addEventListener('click', () => {
        if (btn.disabled) return;
        const n = selectedUnitCards().length;
        ptUser('<span class="pt-echo-pill">Export to Figma · ' + n + (n === 1 ? ' unit' : ' units') + '</span>');
        setTimeout(() => {
          ptBot('Export to Figma isn’t wired into this prototype — it would land ' + n + (n === 1 ? ' unit' : ' units') + ' as frames on one Figma page, the same scope Package uses (the current selection, or every unit on the board).');
        }, 700);
      });
    }
    /* The button just follows the shortlist — the overlay it opens is
       rebuilt fresh every time (openPackageOverlay), so there is
       nothing here to keep in sync with a live package the way the
       old in-flow section had to. */
    // §BO.2/.6 — Package (and the new Export to Figma beside it) follow
    // the board itself now, not a separate Selects shortlist: both show
    // once a board exists, whether or not anything is selected (the
    // same §BN.1 "zero selection = all" rule the band already lives by).
    function syncPackageButton() {
      const btn = document.getElementById('ptPackageBtn');
      const figmaBtn = document.getElementById('ptExportFigmaBtn');
      const hasBoard = document.querySelectorAll('#ptConcepts .pt-banner-card').length > 0;
      if (figmaBtn) { figmaBtn.disabled = !hasBoard; figmaBtn.hidden = !hasBoard; }
      if (!btn) return;
      btn.disabled = !hasBoard;
      btn.hidden = !hasBoard;
      // Z.2.2 — "its popover lists the filled spaces by size and the
      // open count": Package has no popover (its click still only
      // opens the overlay), so the summary rides its existing tooltip.
      const hint = document.getElementById('ptPackageHint');
      if (hint) {
        if (hasBoard) {
          const cards = selectedUnitCards();
          const plan = campaignFlightPlan(); // BJ.1 — the flight plan, always
          const filled = groupSelectsForPlan(plan, cards).groups.reduce((a, g) => a + g.filled.length, 0);
          const total = planTotalSpaces(plan);
          hint.textContent = filled + ' of ' + total + ' filled · ' + (total - filled) + ' open';
        } else {
          hint.textContent = 'for Trafficking';
        }
      }
    }

    function initProductionSizes() {
      const btn = document.getElementById('ptProdSizesBtn');
      const pop = document.getElementById('ptProdSizesPop');
      if (btn && pop) {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const willOpen = !pop.classList.contains('is-open');
          closeAllPtSheetPopovers();
          if (willOpen) {
            renderSizesPopover();
            pop.classList.add('is-open');
            pop.setAttribute('aria-hidden', 'false');
            btn.setAttribute('aria-expanded', 'true');
            positionSheetPop(btn, pop);
          }
        });
        pop.addEventListener('click', (e) => {
          e.stopPropagation();
          // V1 (PLAN.md §V) — two sections, two row shapes: Board at
          // (data-board-size, one radio) re-renders the board live;
          // Ships at (data-prod-size, checks, floor of one) is the old
          // Ratios control, renamed and now brief-backed.
          // V3 — each section's own '+ N more' disclosure (see
          // sizeGroupRowsHTML) checked before either row shape below.
          // 9/10 — the ships check sits INSIDE the board row (one roster,
          // two marks), so it is asked first; the row itself is the board pick.
          const row = e.target.closest('[data-prod-size]');
          if (row) {
            if (!toggleShipSize(row.dataset.prodSize)) return; // floor of one — refused
            if (productionSizes.indexOf(brief.boardSize) === -1) { setBoardSize(productionSizes[0]); syncBoardSizeTicks(); } // the board follows the set
            syncProdSizeTicks();
          } else {
            const boardRow = e.target.closest('[data-board-size]');
            if (!boardRow) return;
            setBoardSize(boardRow.dataset.boardSize);
            syncBoardSizeTicks();
            return;
          }
          // AF — no live re-render to chase here any more: the
          // Package overlay covers this very popover's own band field
          // while it's open (so a size change can't happen while it's
          // showing), and it rebuilds itself fresh from productionSizes
          // every time it opens (buildPackageStageData).
        });
      }
      const back = document.getElementById('ptPreviewBack');
      if (back) back.addEventListener('click', closeProductionPreview);
      /* No Figma bridge behind this prototype, so it says so and names
         what the hand-off would carry — a silent no-op on the view's
         primary button would read as a broken button. Closes the
         preview first: the answer lands in the chat behind it. */
      /* A preview tile is a throwaway clone at one placement size, so
         the edit commits to the SELECT it was rendered from while the
         stage opens at the size that was clicked — you edit what you
         were looking at, and it lands on the real unit. */
      const previewBody = document.getElementById('ptPreviewBody');
      if (previewBody) previewBody.addEventListener('click', (e) => {
        if (document.body.classList.contains('is-painter-shared')) return;
        const frame = e.target.closest('.pt-banner-frame');
        if (!frame || !previewSourceCard || !previewSourceCard.isConnected) return;
        const unit = frame.closest('.pt-preview-unit');
        const card = previewSourceCard;
        closeProductionPreview();
        setTimeout(() => openPainterEditor(null, {
          card: card,
          sizeId: unit ? unit.getAttribute('data-preview-size') : null,
          returnTo: card
        }), 200);
      });
      const previewFigma = document.getElementById('ptPreviewFigmaBtn');
      if (previewFigma) previewFigma.addEventListener('click', () => {
        const n = document.querySelectorAll('#ptPreviewBody .pt-preview-unit').length;
        closeProductionPreview();
        ptUser('<span class="pt-echo-pill">Send to Figma · ' + n + (n === 1 ? ' size' : ' sizes') + '</span>');
        setTimeout(() => {
          ptBot('Send to Figma isn\u2019t wired into this prototype — it would land these ' + n + ' production sizes as one frame each, on a single page named for the concept.');
        }, 700);
      });
      document.addEventListener('keydown', (e) => {
        const overlay = document.getElementById('ptPreview');
        if (e.key === 'Escape' && overlay && overlay.getAttribute('data-visible') === '1') {
          e.stopPropagation();
          closeProductionPreview();
        }
      }, true);
      // Per-select actions live on the Selects grid, delegated — the
      // shared handler (removeSelectCard's own animation door included)
      // also binds to #ptSelectsViewer (initSelectsViewer), so AG.4's
      // "selecting/removing inside the viewer updates the strip live"
      // is the same code path regardless of which host a card is in.
      const grid = document.getElementById('ptSelects');
      if (grid) grid.addEventListener('click', handleSelectsCardClick);
      renderSizesPopover(); // eager, so the chip reads correctly before it's ever opened
    }

    /* One delegated handler for both sections — the kebab does the
       same four things wherever the unit lives. */
    function initUnitMenus() {
      ['ptConcepts', 'ptSelects'].forEach((id) => {
        const root = document.getElementById(id);
        if (!root) return;
        root.addEventListener('click', (e) => {
          const kebab = e.target.closest('[data-unit-menu]');
          if (!kebab) return;
          e.stopPropagation();
          openSelectMenu(kebab, kebab.closest('.pt-banner-card'));
        });
      });
    }

    /* AQ.2 / AQ.4 amendment — the cluster's pencil is THE door into
       Studio's unit mode (a banner click only focuses its card now),
       wherever the unit lives. */
    function initUnitEditButtons() {
      ['ptConcepts', 'ptSelects', 'ptSelectsViewer'].forEach((id) => {
        const root = document.getElementById(id);
        if (!root) return;
        root.addEventListener('click', (e) => {
          const pencil = e.target.closest('[data-unit-edit]');
          if (!pencil) return;
          e.stopPropagation();
          if (document.body.classList.contains('is-painter-shared')) return; // read-only
          const card = pencil.closest('.pt-banner-card');
          const frame = card && card.querySelector('.pt-banner-frame');
          if (frame) openPainterEditor(frame);
        });
      });
    }

    function initSelectButtons() {
      const root = document.getElementById('ptConcepts');
      if (!root) return;
      root.addEventListener('click', (e) => {
        const btn = e.target.closest('.pt-select-btn');
        if (!btn) return;
        e.stopPropagation(); // the card itself opens the editor on click
        const card = btn.closest('.pt-banner-card');
        const grid = document.getElementById('ptSelects');
        if (!card || !grid) return;
        // AQ — the "+" is baked into every card (unitChromeHTML), so a card
        // built outside buildConceptSheetDOM mints its select id here.
        if (!card.dataset.selectId) card.dataset.selectId = 'sel' + (++selectSeq);
        const id = card.dataset.selectId;
        const existing = grid.querySelector('.pt-select-card[data-select-id="' + id + '"]');
        if (existing) {
          existing.remove();
          setSelectBtnState(btn, false);
        } else {
          grid.appendChild(selectCardClone(card));
          setSelectBtnState(btn, true);
        }
        syncSelectsSection();
      });
    }

