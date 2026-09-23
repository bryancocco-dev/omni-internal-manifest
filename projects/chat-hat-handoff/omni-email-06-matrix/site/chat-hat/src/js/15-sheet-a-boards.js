    /* ═══ 9/10 — BOARDS (Bryan: "if somebody wants to generate an
       entirely new set of banners with new settings, how would they do
       it, and get back to the original banners?"). A board is one
       replace-generate: its rows, the brief it was built from and the
       copy pools it holds. Every send that replaces the board starts a
       new one and keeps the old; appends stay on the current board.
       The sheet's title is the switcher; the chat line for each build
       links back; selects are shared across boards (a select remembers
       nothing about boards — the shortlist is the shortlist). The last
       ten are kept. ═══ */
    const boards = [];
    let boardCur = -1;
    const BOARDS_MAX = 10;
    function boardSnapshot() {
      const container = document.getElementById('ptConcepts');
      return {
        html: container ? container.innerHTML : '',
        brief: liveBoardVol(),
        layout: liveBoard ? liveBoard.layout : null, // AN.2 — this board's own Layouts pick, so switching back restores what "Generate 3 more" should keep dealing
        variety: JSON.parse(JSON.stringify(sheetVariety)),
        assets: JSON.parse(JSON.stringify(assets)), // §BR.1 — banked alongside variety; ids are pool-index keys reused by every board, so this must travel with it or a switch would leave cards pointing at the wrong board's text
        st: { layout: state.layout, sizes: state.sizes.slice(), images: state.images.slice() },
        selection: Array.from(sheetSelection) // AJ.1 — the selection is part of the board's own banked state
      };
    }
    function boardsKeepCurrent() {
      const container = document.getElementById('ptConcepts');
      if (boardCur < 0 || !boards[boardCur] || !container || !container.querySelector('.pt-concept-group')) return;
      Object.assign(boards[boardCur], boardSnapshot());
    }
    /* "Board at" and Volume (setBoardSize/setBriefConcepts/setBriefVariants,
       PLAN.md §V) preview live against the CURRENT board's shared brief/DOM
       before any Send commits them — restampBoardSize re-skins every card
       on the spot. boardsKeepCurrent() called AFTER that preview would bank
       the preview's numbers as if they were this board's own, so switching
       back later would show what you were about to try, not what you
       actually generated. The first preview edit since a board became
       current banks the truth first; further edits before the next Send,
       switch or append are previews of that SAME still-uncommitted board,
       not a second one, so only the first counts. */
    let boardPreviewBanked = false;
    // AJ.0 — the board on the sheet keeps its own record; the brief is
    // the NEXT generation's. Set at build, updated by an append or the
    // band's "Board at", restored on a switch — never by the hat.
    let liveBoard = null;
    /* ═══ §BR.1 — ASSETS, the campaign-level store beside liveBoard.
       Today (pre-BR) every edit lives ON the unit: data-framings per
       ratio, data-offsets per size, copy text and fit on the card
       itself. §BR moves that so edits belong to the ASSET (an image or
       a line of copy), not the banner instance — one crop lands on
       every unit sharing that image at that ratio, one copy edit lands
       on every unit sharing that line. BR.1 only introduces the store
       and wires units to REFERENCE it (data-image-ref / data-headline-
       id / data-cta-id / data-legal-id, written at generation in
       applyBannerCopyOverrides, 19-sheet-c-variety.js) — no control
       writes an edit into it yet, so nothing renders differently.

       images: { [src]: { framings: { [ratioKey]: {x,y,s} } } } — keyed
       by the image's own src (already a stable, unique handle — see
       GALLERY_ITEMS/focalForSrc in 12-shell-c-chat.js), so an uploaded
       image works the same as a gallery one with no separate id
       minting. framings starts empty and stays empty until a BR.2
       Studio crop writes into it; an empty ratio bucket already means
       "never touched" everywhere framings are read (readBannerFramings
       et al, 13-editor-studio-a-framing.js), so an untouched image is
       byte-identical to today's default-focal render.

       lines: { [role + ':' + poolIndex]: { role, text, fit } } — one
       entry per pool SLOT (headline/cta/legal dealt by index from
       sheetVariety.bodies/ctas/LEGAL_LINES), so two units dealt the
       same slot naturally reference the same line, which is exactly
       the sharing §BR wants once BR.3 lets an edit write here. fit
       starts empty (per-ratio scale a BR.4 control will add); until
       then every ratio keeps computing its own fit live, same as
       today.

       Board-scoped like sheetVariety, not campaign-persistent past a
       session: boardSnapshot/switchBoard below bank and restore it
       per board (a pool-index id like "headline:0" is reused by every
       board, so switching boards without restoring this would show
       one board's cards pointing at another's text) and a fresh
       (non-append) generate starts it empty in buildConceptSheetDOM
       (14-hat-a-files.js), the same moment sheetVariety's own pools
       get reseeded. window._ptAssetsDebug (19-sheet-c-variety.js) is
       the QA read hook — a fresh plain object per call, per the
       _ptStudioDebug/_ptImageryDebug convention. ═══ */
    let assets = { images: {}, lines: {} };
    function liveBoardVol() {
      const liveRows = document.querySelectorAll('#ptConcepts .pt-concept-group').length;
      return {
        boardSize: (liveBoard && liveBoard.boardSize) || brief.boardSize,
        concepts: liveRows || (liveBoard && liveBoard.concepts) || brief.concepts,
        variants: (liveBoard && liveBoard.variants) || brief.variants
      };
    }
    function bankCurrentBoardOnce() {
      if (boardPreviewBanked) return;
      boardsKeepCurrent();
      boardPreviewBanked = true;
    }
    // AR.1 — board names: a usable phrase lifted from the build
    // message (title case, two or three words — "Make a Coast Road
    // campaign" -> "Coast Road", "golden hour launch" -> "Golden
    // Hour"), else the next Corvache name in order; the number stays
    // the id (board1, deep links, the harness) but never shows.
    const CORVACHE_NAME_POOL = ['Coast Road', 'Golden Hour', 'Open Road', 'First Light', 'Quiet Power', 'Night Run', 'The Long Way', 'Precision Series', 'Track Day', 'Atelier', 'Certified', 'Headland', 'Switchback', 'Tidewater', 'Ember'];
    const BOARD_NAME_NUMERALS = ['II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
    let corvacheNamePoolIdx = 0;
    // Leading asks ("make a", "build me", "let's") and trailing filler
    // ("campaign", "launch", "banners") strip away, leaving the
    // phrase the message is actually about — demoware-simple, not a
    // real NLP parser (matches this file's own contract elsewhere).
    const BOARD_NAME_LEADING_RE = /^(please|thanks|thank you|can you|could you|would you|i want to|i need to|i'd like to|id like to|lets|let's|make|build|create|generate|start|design|draft|write|put together|whip up|craft|a|an|the|new|some|another)\s+/i;
    const BOARD_NAME_TRAILING_RE = /\s+(campaign|launch|banners?|ads?|adverts?|set|concepts?|creative|please|now|today|asap|batch)$/i;
    function boardNamePhraseFrom(message) {
      let s = String(message || '').trim();
      if (!s) return null;
      s = s.replace(/[^\w\s'-]/g, ' ').replace(/\s+/g, ' ').trim();
      let prev;
      do { prev = s; s = s.replace(BOARD_NAME_LEADING_RE, '').trim(); } while (s && s !== prev);
      do { prev = s; s = s.replace(BOARD_NAME_TRAILING_RE, '').trim(); } while (s && s !== prev);
      if (!s) return null;
      const words = s.split(' ').filter(Boolean);
      // Not a short, pithy phrase — either nothing usable is left, too
      // many words survived to read as a name, or (single leftover
      // word) it reads more like filler/gibberish than a name ("asdf").
      if (!words.length || words.length > 4) return null;
      if (words.length === 1 && !/^[a-z]{5,}$/i.test(words[0])) return null;
      return words.slice(0, 3).map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    }
    // A repeat — either door landing on a name already banked this
    // session — takes a roman numeral ("Coast Road II").
    function boardNameDedupe(name) {
      const used = boards.map((b) => b.name).filter(Boolean);
      if (used.indexOf(name) === -1) return name;
      for (let i = 0; i < BOARD_NAME_NUMERALS.length; i++) {
        const candidate = name + ' ' + BOARD_NAME_NUMERALS[i];
        if (used.indexOf(candidate) === -1) return candidate;
      }
      return name + ' ' + (used.length + 1);
    }
    function boardNameFor(message) {
      const phrase = boardNamePhraseFrom(message);
      let base = phrase;
      if (!base) {
        const used = boards.map((b) => (b.name || '').replace(/ [IVX]+$/, ''));
        base = CORVACHE_NAME_POOL.filter((n) => used.indexOf(n) === -1)[0] || CORVACHE_NAME_POOL[corvacheNamePoolIdx++ % CORVACHE_NAME_POOL.length];
      }
      return boardNameDedupe(base);
    }
    function boardsRecordNew(message) {
      const num = boards.length ? boards[boards.length - 1].num + 1 : 1;
      const b = boardSnapshot();
      b.id = 'board' + num; b.num = num; b.at = timeNow();
      b.name = boardNameFor(message); // AR.1
      boards.push(b);
      while (boards.length > BOARDS_MAX) boards.shift();
      boardCur = boards.length - 1;
    }
    function boardLabel(b) {
      return boardVolLabel(b.brief);
    }
    // W.1 \u2014 same "size \u00b7 c \u00d7 v" text, from an explicit {boardSize,
    // concepts, variants} rather than a banked board \u2014 the rail's
    // active item reads live brief this way instead of the (possibly
    // stale, per bankCurrentBoardOnce's own note above) snapshot.
    function boardVolLabel(vol) {
      return vol.boardSize.replace('x', '\u00d7') + ' \u00b7 ' + vol.concepts + ' \u00d7 ' + vol.variants;
    }
    // The board's pluses answer to the shortlist: lit where a select
    // with that id exists, dark where none does — the truth after a
    // switch, a remove or a build.
    function relatchSelectButtons() {
      Array.prototype.forEach.call(document.querySelectorAll('#ptConcepts .pt-banner-card'), (card) => {
        const btn = card.querySelector('.pt-select-btn');
        if (!btn) return;
        const on = !!document.querySelector('#ptSelects .pt-select-card[data-select-id="' + card.dataset.selectId + '"]');
        setSelectBtnState(btn, on); // AQ — one writer for the button's state (16-selects-a.js)
      });
    }
    function switchBoard(idx) {
      if (idx < 0 || idx >= boards.length || idx === boardCur) return;
      bankCurrentBoardOnce(); // the board being left keeps its true state, not a live preview sitting on top of it
      const b = boards[idx];
      const container = document.getElementById('ptConcepts');
      if (!container) return;
      closeAllPtSheetPopovers();
      brief.boardSize = b.brief.boardSize; brief.shipSizes = [b.brief.boardSize];
      brief.concepts = b.brief.concepts; brief.variants = b.brief.variants;
      liveBoard = { boardSize: b.brief.boardSize, concepts: b.brief.concepts, variants: b.brief.variants, layout: b.layout }; // AN.2 — restores this board's own Layouts pick, not the live pills'
      syncBriefAliases();
      state.layout = b.st.layout; state.sizes = b.st.sizes.slice(); state.images = b.st.images.slice();
      Object.keys(b.variety).forEach((k) => { sheetVariety[k] = JSON.parse(JSON.stringify(b.variety[k])); });
      const bAssets = b.assets || { images: {}, lines: {} }; // §BR.1 — older-session boards banked before assets existed fall back to empty rather than throwing
      assets.images = JSON.parse(JSON.stringify(bAssets.images || {}));
      assets.lines = JSON.parse(JSON.stringify(bAssets.lines || {}));
      container.innerHTML = b.html;
      boardCur = idx;
      boardPreviewBanked = false; // this board is now current and untouched — nothing to bank yet
      conceptGhostPending = false;
      // AJ.1 — "a board switch restores its own selection": banked
      // alongside brief/variety/st above, restored the same way.
      sheetSelection = new Set(b.selection || []);
      selectionAnchorId = null;
      relatchSelectButtons();
      syncScoreChips(container);
      syncConceptGhostTile();
      syncSelectsSection();
      syncPackageButton(); // §BO.2 — Package/Export to Figma follow the board now, not Selects
      syncUnitCount();
      renderCopyList('bodies'); renderCopyList('ctas');
      syncGenerateChip(); paintVolumeGrids();
      renderSettingsPillLabels(document.querySelector('.pt-set-row'));
      if (typeof syncSheetRail === 'function') syncSheetRail();
      renderBoardsRail(); // W.1 \u2014 the active item flips, both mounts
      scheduleFitAllBannerScales();
      syncSelectionUI(); // AJ.1 \u2014 re-marks the restored cards/concepts and syncs the band to match
      const canvasEl = document.getElementById('canvas');
      if (canvasEl) canvasEl.scrollTop = 0;
    }
    // AE.5 (Bryan: "let's simplify this greatly" — supersedes AB.4's
    // six-up grid + "+N") — a History item is exactly three things:
    // the board's FIRST unit alone, one real .pt-banner clone at its
    // size's own aspect on the tile's ground (box fills the tile's
    // width; a wide strip centres in the shorter tile that falls out
    // of the same math; a tower is scaled to a 120px-tall tile); the
    // "Board N" label chip (c4-edit-rail-label, bottom-left); one mono
    // meta line underneath (boardItemHTML). root is the live
    // #ptConcepts for the board actually on the canvas, or a detached
    // parse of the banked board's own HTML for every other one.
    function boardPictureHTML(root) {
      const banner = root ? root.querySelector('.pt-concept-group .pt-banner') : null;
      if (!banner) return '<div class="pt-board-item-tile"></div>'; // AL.17 — no banner yet, no label chip to fall back to either (the name lives in the meta line below now)
      const parts = (banner.getAttribute('data-size') || '300x250').split('x');
      const w = parseInt(parts[0], 10) || 300, h = parseInt(parts[1], 10) || 250;
      const TILE_PAD = 8, INNER_W = 220 - 16 * 2 - TILE_PAD * 2; // rail width, less the rail's own padding, less the tile's
      let cw, ch;
      if (shapeClassFor(w + 'x' + h) === 'tower') {
        ch = 120 - TILE_PAD * 2; // the tile is 120 tall; the tower fills its inner height
        cw = Math.round(ch * (w / h));
      } else {
        cw = INNER_W; // box fills the tile's width; a wide strip falls out of the same formula, just short
        ch = Math.round(cw * (h / w));
      }
      const clone = banner.cloneNode(true);
      clone.removeAttribute('id');
      Array.prototype.forEach.call(clone.querySelectorAll('[id]'), (n) => n.removeAttribute('id'));
      const scale = cw / w;
      clone.style.transform = 'scale(' + scale + ')';
      clone.style.transformOrigin = 'top left';
      // AL.5 (1, ACCURATE) — the empirically-confirmed root cause of
      // "the griffin mark renders several times too large": nothing to
      // do with container-query CONTEXT (.pt-banner already carries its
      // own container-type:size — a real .pt-banner-card wrapper was
      // never load-bearing for that). The actual culprit was a
      // specificity collision — .c4-edit-rail-item img (a generic
      // "fill the rail thumbnail" rule, class+type, 0-1-1) silently
      // outranks .pt-banner-logo's own rule (one class, 0-1-0) the
      // instant this clone lands inside a rail item, stretching the
      // corner mark to width:100% of its column. Fixed at the source
      // (see .pt-board-item-pic .pt-board-item-banner .pt-banner-logo,
      // CSS). This wrapper is a plain, purpose-built shell now — NOT
      // .pt-banner-card, on purpose: this tile is a static preview (no
      // head, no checkbox, no remove control), and wearing the same
      // class as a real selectable unit was itself part of the
      // original confusion (and tripped the P11 harness's own
      // unscoped "every .pt-banner-card has a remove button" check).
      const cardWrap = '<div class="pt-board-item-banner" data-size="' + w + 'x' + h + '">' + clone.outerHTML + '</div>';
      // AL.17 (Bryan) — the accent "Board N" chip that used to overlay
      // the picture is gone; the name moved to the meta line below
      // (boardItemHTML), so this tile is just the picture now.
      return '<div class="pt-board-item-tile">' +
        '<span class="pt-board-item-pic" style="width:' + cw + 'px;height:' + ch + 'px">' + cardWrap + '</span>' +
      '</div>';
    }
    function boardItemHTML(b, i, isActive) {
      // the active board's own row count can already be ahead of its
      // banked brief (an append that hasn't switched away since) — the
      // live DOM is the truth for "how many," brief for "what shape."
      let root;
      if (isActive) {
        root = document.getElementById('ptConcepts');
      } else {
        const tpl = document.createElement('template');
        tpl.innerHTML = b.html;
        root = tpl.content;
      }
      const liveRows = isActive && root ? root.querySelectorAll('.pt-concept-group').length : 0;
      const vol = isActive
        ? liveBoardVol()
        : b.brief;
      // AL.17 (Bryan) — accurate + simple, round 2: the micro volume
      // grid and the timestamp are gone (the picture + this one line
      // is the whole item now); liveUnits still counts real
      // .pt-banner-card elements so an appended/uneven board reads
      // its true count, not the nominal concepts×variants product.
      const liveUnits = root ? root.querySelectorAll('.pt-banner-card').length : 0;
      return '<li class="c4-edit-rail-item pt-board-item' + (isActive ? ' is-active' : '') + '" data-board-idx="' + i + '">' +
        boardPictureHTML(root) +
        '<span class="pt-board-item-meta">' +
          // 9/16 (Bryan: "remove this text") — the item's own "Board N" label is gone; the picture identifies the generation and the line below it carries the only words. The board's Corvache name still rides the bar, the chat lines and Package.
          '<span class="pt-board-item-count">' + liveUnits + ' unit' + (liveUnits === 1 ? '' : 's') + ' · ' + vol.boardSize.replace('x', '×') + '</span>' +
        '</span>' +
      '</li>';
    }
    // Rebuilds every mount at once ([data-boards-rail] \u2014 the sheet and
    // media-mode-at-rest both carry it) so a build, append or switch
    // never has to know which surfaces are currently in the DOM.
    function renderBoardsRail() {
      const n = boards.length;
      const itemsHTML = boards.map((b, i) => boardItemHTML(b, i, i === boardCur)).reverse().join('');
      Array.prototype.forEach.call(document.querySelectorAll('[data-boards-rail]'), (rail) => {
        rail.classList.toggle('has-items', n > 0);
        const countEl = rail.querySelector('[data-boards-rail-count]');
        if (countEl) countEl.textContent = String(n);
        const pluralEl = rail.querySelector('[data-boards-rail-plural]');
        if (pluralEl) pluralEl.textContent = n === 1 ? '' : 's';
        const list = rail.querySelector('[data-boards-rail-list]');
        if (list) list.innerHTML = itemsHTML;
      });
      syncMediaTopbar(); // Fix Y — the board-render path: a build, append or switch renames the bar too
    }
    // The sheet may be hidden (backed out to the blank canvas) or
    // covered by the resting viewfinder; a History pick shows it.
    function revealBoardSheet() {
      if (!document.querySelector('#ptConcepts .pt-concept-group')) return;
      const hidden = !document.body.classList.contains('is-painter-resolved');
      const resting = (typeof mmOpen !== 'undefined') && mmOpen;
      if (!hidden && !resting) return;
      if (resting) closeMediaMode();
      document.body.classList.add('is-painter-resolved');
      syncMediaTopbar();
    }
    function initBoardsRail() {
      document.addEventListener('click', (e) => {
        const item = e.target.closest('.pt-board-item[data-board-idx]');
        if (item) { revealBoardSheet(); switchBoard(parseInt(item.dataset.boardIdx, 10)); return; }
        // Z.2.1 — the plan-arrived line's own trail: a .pt-msg-board-
        // link-style button that jumps to a rail-nav section instead
        // of a board, e.g. "Plan received…" → Selects. Reuses
        // initPainterRailNav's own click (same scroll math, same
        // active-item bookkeeping) rather than a second scroll path.
        const jump = e.target.closest('[data-pt-nav-jump]');
        if (jump) {
          const navItem = document.querySelector('.rail-nav-painter li[data-pt-nav="' + jump.dataset.ptNavJump + '"]');
          if (navItem) navItem.click();
          return;
        }
        // AM.7 — "A2.1 is on the board." links back to the new card
        // itself (same recipe, a unit rather than a board or section).
        const unitJump = e.target.closest('[data-pt-unit-jump]');
        if (unitJump) {
          const card = document.querySelector('#ptConcepts .pt-banner-card[data-unit-id="' + unitJump.dataset.ptUnitJump + '"]');
          if (card) {
            card.scrollIntoView({ block: 'center', behavior: envReducedMotion() ? 'auto' : 'smooth' });
            card.focus({ preventScroll: true });
          }
          return;
        }
        // the chat's own trail: "Coast Road is on the canvas" links back to it
        const link = e.target.closest('.pt-msg-board-link');
        if (!link) return;
        // AF.3 — "Package ready — N units…" carries the same link
        // recipe; its destination is the overlay it just closed
        // rather than a board.
        if (link.hasAttribute('data-open-package')) { openPackageOverlay(); return; }
        const idx = boards.findIndex((b) => b.id === link.dataset.board);
        if (idx !== -1) switchBoard(idx);
      });
    }
    // P8 — reads a live banner's optional copy fields straight off its
    // DOM (the authoritative source once edits have landed) — shared
    // by appendSizesToConcept (new sizes carry the same fields) and
    // openPainterEditor (reopening the editor seeds subhead/body/
    // disclaimer from what's actually on the card).
    function readBannerCopyFields(banner) {
      const out = {};
      const subEl = banner.querySelector('.pt-banner-subhead');
      const bodyEl = banner.querySelector('.pt-banner-body');
      const discEl = banner.querySelector('.pt-banner-disclaimer');
      if (subEl) out.subhead = subEl.textContent.trim();
      if (bodyEl) out.body = bodyEl.textContent.trim();
      if (discEl) out.disclaimer = discEl.textContent.trim();
      return out;
    }
    // ── P12 shape-grid mutators — ensure*() lazily grows whatever
    //    region/row a concept doesn't have yet (e.g. its first tower,
    //    added via "+ Add sizes" to a concept that started box-only),
    //    always in the spec's fixed order (grid → left/right region →
    //    box row before wide row). syncShapeGridClasses() re-derives
    //    the grid's pt-no-towers/pt-only-towers modifiers from what's
    //    actually left in the DOM after an add or a remove — never
    //    hand-toggled, so it can't drift from reality. ──
    function ensureShapeGrid(group) {
      let grid = group.querySelector('.pt-shape-grid');
      if (!grid) {
        grid = document.createElement('div');
        grid.className = 'pt-shape-grid pt-no-towers';
        group.appendChild(grid);
      }
      return grid;
    }
    function ensureShapeRegion(grid, side) {
      let region = grid.querySelector('.pt-shape-' + side);
      if (!region) {
        region = document.createElement('div');
        region.className = 'pt-shape-' + side;
        if (side === 'right') grid.appendChild(region); else grid.insertBefore(region, grid.firstChild);
      }
      return region;
    }
    function ensureShapeRow(group, shapeClass) {
      const grid = ensureShapeGrid(group);
      if (shapeClass === 'tower') {
        const region = ensureShapeRegion(grid, 'right');
        let row = region.querySelector('.pt-shape-row-tower');
        if (!row) { row = document.createElement('div'); row.className = 'pt-shape-row pt-shape-row-tower'; region.appendChild(row); }
        return row;
      }
      const region = ensureShapeRegion(grid, 'left');
      const rowCls = shapeClass === 'wide' ? 'pt-shape-row-wide' : 'pt-shape-row-box';
      let row = region.querySelector('.' + rowCls);
      if (!row) {
        row = document.createElement('div');
        row.className = 'pt-shape-row ' + rowCls;
        if (shapeClass === 'box') region.insertBefore(row, region.firstChild); else region.appendChild(row);
      }
      return row;
    }
    function syncShapeGridClasses(group) {
      const grid = group.querySelector('.pt-shape-grid');
      if (!grid) return;
      const hasLeft = !!grid.querySelector('.pt-shape-left .pt-banner-card');
      const hasRight = !!grid.querySelector('.pt-shape-right .pt-banner-card');
      grid.classList.toggle('pt-no-towers', !hasRight);
      grid.classList.toggle('pt-only-towers', !hasLeft && hasRight);
    }
    // A concept can never go to zero sizes — the remove control
    // disables itself once only one unit is left anywhere in the
    // concept (across every row/region).
