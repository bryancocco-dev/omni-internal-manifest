    /* --- Init --------------------------------------------------- */

    const mediaRail   = view.querySelector('.c4-ad-rail[data-grid="media"]');
    const displayRail = view.querySelector('.c4-ad-rail[data-grid="display"]');
    const imagesGrid  = view.querySelector('.c4-graphics-grid[data-grid="images"]');
    const videoGrid   = view.querySelector('.c4-graphics-grid[data-grid="video"]');
    const audioGrid   = view.querySelector('.c4-grid[data-grid="audio"]');

    if (mediaRail)   renderMedia(mediaRail, adUnits);
    if (displayRail) renderDisplay(displayRail, displayUnits);
    if (imagesGrid)  renderGraphicsCards(imagesGrid, photos, false);
    if (videoGrid)   renderGraphicsCards(videoGrid, videoSources, true);
    if (audioGrid)   renderAudio(audioGrid, audioAssets);

    /* Initial last-row tagging + retag on window resize (breakpoint
       changes column count, which moves which cells are "last
       row"). Debounced so rapid drags don't thrash. */
    if (mediaRail) {
      markLastRowCells(mediaRail);
      let _lastRowResizeT;
      window.addEventListener('resize', () => {
        clearTimeout(_lastRowResizeT);
        _lastRowResizeT = setTimeout(() => {
          markLastRowCells(mediaRail);
        }, 80);
      });
    }
    /* displayRail is a stack of size-grouped bands with their own
       intra-band gap-driven hairlines; no row-tagging needed. */

    /* View-mode toggle — scoped per section. Grid view shrinks each
       tile, so triple the page size while in grid view so the
       tighter layout still fills a meaningful chunk of the page.
       Switching back to mosaic / list restores the section's base
       size. */
    const SECTION_BASE_PAGE = { media: 15, images: 20, video: 20, audio: 5 };
    view.querySelectorAll('.c4-section').forEach(sec => {
      const btns = sec.querySelectorAll('.c4-view-btn');
      const grid = sec.querySelector('.c4-graphics-grid, .c4-grid');
      if (!btns.length || !grid) return;
      const gridKey = grid.dataset.grid;
      btns.forEach(btn => {
        btn.addEventListener('click', () => {
          const v = btn.dataset.c4view;
          btns.forEach(b => b.classList.toggle('active', b === btn));
          grid.dataset.view = v;
          if (paginations[gridKey] && SECTION_BASE_PAGE[gridKey]) {
            const base = SECTION_BASE_PAGE[gridKey];
            paginations[gridKey].setPageSize(v === 'grid' ? base * 3 : base);
          }
        });
      });
    });

    /* === Pagination — reuses canvas_2 scope-pagination chrome ===
       Operates on the grid's children directly (no <table> assumption).
       Search tags items with data-search-hidden so pagination can skip
       them when slicing pages. */

    function pageList(page, total) {
      if (total <= 7) {
        const out = [];
        for (let i = 1; i <= total; i++) out.push(i);
        return out;
      }
      const out = [1];
      if (page > 3) out.push('ellipsis');
      const lo = Math.max(2, page - 1);
      const hi = Math.min(total - 1, page + 1);
      for (let p = lo; p <= hi; p++) out.push(p);
      if (page < total - 2) out.push('ellipsis');
      out.push(total);
      return out;
    }

    function makeBtn(label, opts) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'scope-pagination-btn';
      if (opts.step) btn.classList.add('scope-pagination-btn--step');
      if (opts.active) btn.classList.add('active');
      if (opts.disabled) btn.disabled = true;
      const txt = document.createTextNode(label);
      if (opts.leftIcon) {
        const ic = document.createElement('span');
        ic.textContent = opts.leftIcon;
        ic.setAttribute('aria-hidden', 'true');
        btn.appendChild(ic);
      }
      btn.appendChild(txt);
      if (opts.rightIcon) {
        const ic = document.createElement('span');
        ic.textContent = opts.rightIcon;
        ic.setAttribute('aria-hidden', 'true');
        btn.appendChild(ic);
      }
      if (!opts.disabled && opts.onClick) btn.addEventListener('click', opts.onClick);
      return btn;
    }

    function setupGridPagination(grid, container, initialPageSize, itemLabel) {
      if (!grid || !container) return null;
      let currentPage = 1;
      let pageSize = initialPageSize;

      function getAllItems() {
        return Array.from(grid.children);
      }
      function getVisibleByFilter() {
        return getAllItems().filter(c => !c.dataset.searchHidden);
      }

      function refresh() {
        const items = getVisibleByFilter();
        const total = items.length;
        const totalPages = Math.max(1, Math.ceil(total / pageSize));
        if (currentPage > totalPages) currentPage = totalPages;

        const start = (currentPage - 1) * pageSize;
        const end = start + pageSize;

        /* Hide all eligible items first; then reveal the current page
           slice. Search-hidden items stay display:none either way. */
        getAllItems().forEach(item => {
          if (item.dataset.searchHidden) {
            item.style.display = 'none';
          } else {
            item.style.display = 'none';
          }
        });
        for (let i = start; i < end && i < items.length; i++) {
          items[i].style.display = '';
        }

        renderUI(total, totalPages);
        /* Re-tag last-row cells after this page slice resolves so
           the bottom-edge hairline stays clean as the user pages. */
        if (grid.classList.contains('c4-ad-rail')) markLastRowCells(grid);
      }

      function renderUI(totalItems, totalPages) {
        container.innerHTML = '';
        if (totalItems === 0 && getAllItems().length === 0) return;

        const summary = document.createElement('span');
        summary.className = 'scope-pagination-summary';
        if (totalItems === 0) {
          summary.textContent = 'No matching ' + (itemLabel || 'items');
        } else {
          const start = (currentPage - 1) * pageSize + 1;
          const end = Math.min(currentPage * pageSize, totalItems);
          summary.innerHTML = 'Showing <strong>' + start + '–' + end +
            '</strong> of <strong>' + totalItems + '</strong> ' + (itemLabel || 'items');
        }
        container.appendChild(summary);

        const ctrls = document.createElement('div');
        ctrls.className = 'scope-pagination-controls';

        ctrls.appendChild(makeBtn('Previous', {
          disabled: currentPage === 1 || totalItems === 0,
          leftIcon: '‹',
          step: true,
          onClick: () => { currentPage--; refresh(); },
        }));

        pageList(currentPage, totalPages).forEach(p => {
          if (p === 'ellipsis') {
            const ell = document.createElement('span');
            ell.className = 'scope-pagination-ellipsis';
            ell.textContent = '…';
            ctrls.appendChild(ell);
          } else {
            ctrls.appendChild(makeBtn(String(p), {
              active: p === currentPage,
              onClick: () => { currentPage = p; refresh(); },
            }));
          }
        });

        ctrls.appendChild(makeBtn('Next', {
          disabled: currentPage === totalPages || totalItems === 0,
          rightIcon: '›',
          step: true,
          onClick: () => { currentPage++; refresh(); },
        }));

        container.appendChild(ctrls);
      }

      refresh();
      return {
        refresh,
        goToPage: (p) => { currentPage = p; refresh(); },
        reset: () => { currentPage = 1; refresh(); },
        setPageSize: (n) => { pageSize = n; currentPage = 1; refresh(); },
      };
    }

    /* Wire pagination per section with appropriate page sizes:
       - Media: 6 phones per page (8 total → 2 pages)
       - Images: 20 cards per page (~60 total → 3 pages)
       - Video: 20 cards per page (~58 total → 3 pages)
       - Audio: 6 tiles per page (8 total → 2 pages) */
    const paginations = {};
    /* Page sizes — multiples of the default 5-column grid so every
       page except the last fills its grid rows completely. Empty
       trailing cells are only ever on the final (partial) page.
       Social Media + Display cap at 3 rows per page (15 each) for
       a tighter vertical footprint; longer sections (Images, Video)
       stay at 4 rows.
       media:   58 units →  4 pages (15+15+15+13)
       display: rendered as 7 size-banded grids, no pagination
       images:  ~60 cards → 3 pages (20+20+~20)
       video:   ~58 clips → 3 pages (20+20+~18)
       audio:    8 tiles → 2 pages (5+3) */
    const pageSizes = { media: 15, images: 20, video: 20, audio: 5 };
    const itemLabels = { media: 'units', images: 'images', video: 'clips', audio: 'tracks' };
    ['media', 'images', 'video', 'audio'].forEach(key => {
      const grid = view.querySelector('[data-grid="' + key + '"]');
      const cont = view.querySelector('.c4-pagination[data-pagination-for="' + key + '"]');
      if (grid && cont) {
        paginations[key] = setupGridPagination(grid, cont, pageSizes[key], itemLabels[key]);
      }
    });

    /* Search — scoped per c4-section AND per c4-subsec so the
       Social Media and Display sub-blocks each get their own
       search input wired to their own grid + pagination. */
    view.querySelectorAll('.c4-section, .c4-subsec').forEach(sec => {
      const input = sec.querySelector('.c4-search');
      const grid = sec.querySelector('.c4-graphics-grid, .c4-grid, .c4-ad-rail');
      if (!input || !grid) return;
      const gridKey = grid.dataset.grid;
      input.addEventListener('input', () => {
        const q = input.value.toLowerCase().trim();
        grid.querySelectorAll('.graphics-card, .c4-audio-tile, .c4-ad-unit').forEach(card => {
          const text = card.dataset.search || '';
          if (!q || text.includes(q)) {
            delete card.dataset.searchHidden;
          } else {
            card.dataset.searchHidden = '1';
          }
        });
        if (paginations[gridKey]) paginations[gridKey].reset();
      });
    });

    /* Collapsible search expander — canvas_2 pattern. Default state
       is a 36×36 icon; clicking the wrap expands to 240px and
       focuses the input. Blurring an empty input collapses back.
       Esc clears the query and collapses. Explicit × close button
       inside the expanded wrap also clears + collapses. */
    view.querySelectorAll('.c4-search-wrap').forEach(wrap => {
      const input = wrap.querySelector('input.c4-search');
      const btn = wrap.querySelector('.c4-search-icon-btn');
      const closeBtn = wrap.querySelector('.c4-search-close');
      if (!input) return;
      function expand() {
        if (wrap.classList.contains('collapsed')) {
          wrap.classList.remove('collapsed');
          if (btn) btn.setAttribute('aria-expanded', 'true');
          /* Defer focus a tick so the width transition starts on
             the same frame the input becomes interactive — feels
             snappy without a visible focus-flash before the
             expand animation kicks in. */
          requestAnimationFrame(() => input.focus());
        }
      }
      function collapse() {
        wrap.classList.add('collapsed');
        if (btn) btn.setAttribute('aria-expanded', 'false');
      }
      function clearAndCollapse() {
        input.value = '';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        collapse();
      }
      wrap.addEventListener('click', (e) => {
        if (wrap.classList.contains('collapsed')) {
          e.stopPropagation();
          expand();
        }
      });
      input.addEventListener('blur', () => {
        /* Only collapse if blur target isn't the close button
           (otherwise the close button click never fires). */
        setTimeout(() => {
          if (document.activeElement === closeBtn) return;
          if (!input.value.trim()) collapse();
        }, 0);
      });
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          clearAndCollapse();
          input.blur();
        }
      });
      if (closeBtn) {
        /* mousedown ONLY prevents focus shift so the input stays
           focused (and the blur-collapse fallback doesn't fire).
           DO NOT collapse here — collapsing on mousedown sets
           pointer-events: none on the close button before mouseup,
           so the click event re-targets to the wrap underneath
           and the wrap's click handler sees .collapsed and
           immediately re-expands. */
        closeBtn.addEventListener('mousedown', (e) => {
          e.preventDefault();
          e.stopPropagation();
        });
        /* click fires while close button is still pointer-events:
           auto, so the click target is the close button itself.
           stopPropagation prevents the wrap's click handler from
           seeing this and re-expanding. */
        closeBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          clearAndCollapse();
        });
      }
    });

    /* Media filters — Platform pills + Type dropdown (multi-select
       checkboxes). The Type dropdown's options are derived from the
       currently-selected platform's available types, so users only
       see types that actually exist for the active platform. */
    const mediaSec = view.querySelector('.c4-section[data-section="ca-media-social"]');
    if (mediaSec) {
      const rail = mediaSec.querySelector('.c4-ad-rail');
      const searchInput = mediaSec.querySelector('.c4-search');
      const platformPills = mediaSec.querySelectorAll('.c4-filter-pill[data-c4platform]');
      const typeDropdown = mediaSec.querySelector('.c4-type-dropdown');
      const typeTrigger = mediaSec.querySelector('.c4-type-trigger');
      const typePanel = mediaSec.querySelector('.c4-type-panel');
      const typeSummary = mediaSec.querySelector('.c4-type-summary');
      let activePlatform = 'all';
      let selectedTypes = new Set();   // empty Set === "All types"

      /* Stable display order for type labels — ad-execution types
         first, then basic / organic post types at the bottom so the
         dropdown reads ad-formats → native-formats. */
      const TYPE_ORDER = [
        'image', 'video', 'slideshow', 'carousel', 'story', 'reel',
        'explore', 'shopping', 'event', 'document', 'conversation',
        'thought-lead', 'spotlight', 'follower', 'branded',
        'collection', 'instant', 'lead-gen', 'free-form',
        // Basic / organic post types
        'text', 'link', 'live', 'album', 'poll', 'article',
        'newsletter', 'celebrate', 'gallery',
      ];
      const TYPE_LABEL = {
        'image': 'Image',
        'video': 'Video',
        'slideshow': 'Slideshow',
        'carousel': 'Carousel',
        'story': 'Story',
        'reel': 'Reel',
        'explore': 'Explore',
        'shopping': 'Shopping',
        'event': 'Event',
        'document': 'Document',
        'conversation': 'Conversation',
        'thought-lead': 'Thought Leadership',
        'spotlight': 'Spotlight',
        'follower': 'Follower',
        'branded': 'Branded',
        'collection': 'Collection',
        'instant': 'Instant',
        'lead-gen': 'Lead Gen',
        'free-form': 'Free Form',
        // Basic / organic
        'text': 'Text Post',
        'link': 'Link Post',
        'live': 'Live',
        'album': 'Photo Album',
        'poll': 'Poll',
        'article': 'Article',
        'newsletter': 'Newsletter',
        'celebrate': 'Celebrate',
        'gallery': 'Gallery',
      };

      function getAvailableTypes() {
        const set = new Set();
        adUnits.forEach(u => {
          if (activePlatform === 'all' || u.platform === activePlatform) {
            set.add(u.type);
          }
        });
        return TYPE_ORDER.filter(t => set.has(t));
      }

      function updateTypeSummary() {
        if (selectedTypes.size === 0) {
          typeSummary.textContent = 'All';
        } else if (selectedTypes.size === 1) {
          const only = [...selectedTypes][0];
          typeSummary.textContent = TYPE_LABEL[only] || only;
        } else {
          typeSummary.textContent = selectedTypes.size + ' selected';
        }
      }

      function renderTypeDropdown() {
        typePanel.innerHTML = '';
        const types = getAvailableTypes();

        /* Pinned search header — filters the visible options list
           without affecting the underlying selectedTypes set. */
        const searchWrap = document.createElement('div');
        searchWrap.className = 'c4-type-search-wrap';
        searchWrap.innerHTML =
          '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>' +
          '<input type="text" placeholder="Search types…" aria-label="Search types">';
        typePanel.appendChild(searchWrap);

        /* Scrollable list — capped by the panel's max-height so
           items beyond the cap scroll instead of overflowing the
           viewport. */
        const list = document.createElement('div');
        list.className = 'c4-type-list';
        typePanel.appendChild(list);

        /* "All" checkbox — when checked, no specific types are
           selected (selectedTypes is empty). Checking it clears any
           individual selections; unchecking it from this state is
           prevented (need to select at least one type to depart). */
        const allLabel = document.createElement('label');
        allLabel.className = 'c4-type-item c4-type-item-all';
        allLabel.dataset.label = 'all types';
        allLabel.innerHTML =
          '<input type="checkbox" data-type="all"' +
          (selectedTypes.size === 0 ? ' checked' : '') + '>' +
          '<span>All types</span>';
        list.appendChild(allLabel);

        types.forEach(t => {
          const lbl = document.createElement('label');
          lbl.className = 'c4-type-item';
          lbl.dataset.label = (TYPE_LABEL[t] || t).toLowerCase();
          lbl.innerHTML =
            '<input type="checkbox" data-type="' + t + '"' +
            (selectedTypes.has(t) ? ' checked' : '') + '>' +
            '<span>' + TYPE_LABEL[t] + '</span>';
          list.appendChild(lbl);
        });

        list.querySelectorAll('input[type="checkbox"]').forEach(input => {
          input.addEventListener('change', () => {
            const type = input.dataset.type;
            if (type === 'all') {
              if (input.checked) {
                selectedTypes.clear();
                list.querySelectorAll('input[data-type]:not([data-type="all"])').forEach(i => { i.checked = false; });
              } else {
                /* Can't uncheck "All" without picking a specific type;
                   reverting to the previous state keeps the filter
                   sane (a fully-empty filter would hide everything). */
                input.checked = true;
              }
            } else {
              if (input.checked) {
                selectedTypes.add(type);
              } else {
                selectedTypes.delete(type);
              }
              const allInput = list.querySelector('input[data-type="all"]');
              if (allInput) allInput.checked = selectedTypes.size === 0;
            }
            updateTypeSummary();
            applyMediaFilters();
          });
        });

        /* Search filter — hide non-matching items. The "All" entry
           stays visible only when the query is empty so the user
           always has a quick reset path. */
        const searchInput = searchWrap.querySelector('input');
        searchInput.addEventListener('input', () => {
          const q = searchInput.value.toLowerCase().trim();
          let anyVisible = false;
          list.querySelectorAll('.c4-type-item').forEach(item => {
            if (item.classList.contains('c4-type-item-all')) {
              item.style.display = q ? 'none' : '';
              if (!q) anyVisible = true;
            } else {
              const matches = !q || (item.dataset.label || '').includes(q);
              item.style.display = matches ? '' : 'none';
              if (matches) anyVisible = true;
            }
          });
          /* Empty-state message when nothing matches. */
          let empty = list.querySelector('.c4-type-list-empty');
          if (!anyVisible) {
            if (!empty) {
              empty = document.createElement('div');
              empty.className = 'c4-type-list-empty';
              empty.textContent = 'No matches';
              list.appendChild(empty);
            }
          } else if (empty) {
            empty.remove();
          }
        });

        updateTypeSummary();
      }

      function applyMediaFilters() {
        const q = (searchInput && searchInput.value || '').toLowerCase().trim();
        rail.querySelectorAll('.c4-ad-unit').forEach(card => {
          const matchPlatform = activePlatform === 'all' || card.dataset.platform === activePlatform;
          const matchType = selectedTypes.size === 0 || selectedTypes.has(card.dataset.type);
          const matchSearch = !q || (card.dataset.search || '').includes(q);
          if (matchPlatform && matchType && matchSearch) {
            delete card.dataset.searchHidden;
          } else {
            card.dataset.searchHidden = '1';
          }
        });
        if (paginations.media) paginations.media.reset();
      }

      /* Platform pill click — switch active platform, prune any
         selectedTypes that are no longer available, rebuild the
         dropdown options, and re-apply filters. */
      platformPills.forEach(pill => {
        pill.addEventListener('click', () => {
          platformPills.forEach(p => p.classList.toggle('active', p === pill));
          activePlatform = pill.dataset.c4platform;
          const available = new Set(getAvailableTypes());
          selectedTypes = new Set([...selectedTypes].filter(t => available.has(t)));
          renderTypeDropdown();
          applyMediaFilters();
        });
      });

      /* Dropdown open/close — toggle on trigger click; outside-click
         closes the panel; Esc also closes. */
      typeTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        const open = typeDropdown.classList.toggle('open');
        typeTrigger.setAttribute('aria-expanded', open ? 'true' : 'false');
        typePanel.setAttribute('aria-hidden', open ? 'false' : 'true');
      });
      typePanel.addEventListener('click', (e) => { e.stopPropagation(); });
      document.addEventListener('click', () => {
        if (typeDropdown.classList.contains('open')) {
          typeDropdown.classList.remove('open');
          typeTrigger.setAttribute('aria-expanded', 'false');
          typePanel.setAttribute('aria-hidden', 'true');
        }
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && typeDropdown.classList.contains('open')) {
          typeDropdown.classList.remove('open');
          typeTrigger.setAttribute('aria-expanded', 'false');
          typePanel.setAttribute('aria-hidden', 'true');
        }
      });

      /* Search wires into the combined filter so platform + types +
         query intersect correctly. The generic .c4-search listener
         above also fires; this one runs last and wins. */
      if (searchInput) {
        searchInput.addEventListener('input', applyMediaFilters);
      }

      /* Initial render. */
      renderTypeDropdown();
    }

    /* === Display filter init — single-band view ================
       Size pills sit on the right side of the toolbar (matching
       the Social Media platform-pill pattern). They are single-
       select: clicking a pill flips its .active state and sets
       the matching band to data-band-active="1"; non-active
       bands are hidden by CSS. Layout dropdown + search filter
       the cells inside the active band. */
    const displaySec = view.querySelector('.c4-section[data-section="ca-media-display"]');
    if (displaySec) {
      const rail = displaySec.querySelector('.c4-ad-rail');
      const searchInput = displaySec.querySelector('.c4-search');
      const sizePills = displaySec.querySelectorAll('.c4-filter-pill[data-c4size]');
      const variantTrigger = displaySec.querySelector('.c4-variant-trigger');
      const variantPanel = displaySec.querySelector('.c4-variant-panel');
      const variantSummary = displaySec.querySelector('.c4-variant-summary');
      const railHeadName = displaySec.querySelector('[data-rail-name]');
      const railHeadDims = displaySec.querySelector('[data-rail-dims]');
      /* Initial active size = whichever pill carries .active in
         the markup (currently Medium Rectangle). */
      const initialActivePill = displaySec.querySelector('.c4-filter-pill.c4-display-size.active');
      let activeSize = initialActivePill ? initialActivePill.dataset.c4size : 'med-rect';
      let selectedVariants = new Set();

      /* Band name + dim copy mirrored into the persistent rail-head
         when the active size changes. Keyed by data-c4size / data-band. */
      const BAND_META = {
        'billboard':     { name: 'Billboard',          dims: '970 × 250 · 8 variants' },
        'leaderboard':   { name: 'Leaderboard',        dims: '728 × 90 · 8 variants' },
        'half-page':     { name: 'Half Page',          dims: '300 × 600 · 8 variants' },
        'med-rect':      { name: 'Medium Rectangle',   dims: '300 × 250 · 8 variants' },
        'mobile-banner': { name: 'Mobile Banner',      dims: '320 × 50 · 8 variants' },
        'mobile-lead':   { name: 'Mobile Leaderboard', dims: '320 × 100 · 8 variants' },
        'skyscraper':    { name: 'Skyscraper',         dims: '160 × 600 · 8 variants' },
      };

      const VARIANT_LABELS = {
        v1: 'Split Zone', v2: 'Image Hero', v3: 'Product Focus',
        v4: 'Hero Top',   v6: 'Split Horizontal', v7: 'Copy First',
        v8: 'Full Bleed Overlay', v9: 'Centered',
      };
      const VARIANT_ORDER = ['v1','v2','v3','v4','v6','v7','v8','v9'];

      function updateVariantSummary() {
        if (selectedVariants.size === 0) {
          variantSummary.textContent = 'All';
        } else if (selectedVariants.size === 1) {
          variantSummary.textContent = VARIANT_LABELS[[...selectedVariants][0]];
        } else {
          variantSummary.textContent = selectedVariants.size + ' selected';
        }
      }

      function renderVariantDropdown() {
        if (!variantPanel) return;
        variantPanel.innerHTML = '';

        /* Pinned search header — same pattern as the social Type
           dropdown. Filters visible layout options without touching
           the selectedVariants state. */
        const searchWrap = document.createElement('div');
        searchWrap.className = 'c4-type-search-wrap';
        searchWrap.innerHTML =
          '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>' +
          '<input type="text" placeholder="Search layouts…" aria-label="Search layouts">';
        variantPanel.appendChild(searchWrap);

        const list = document.createElement('div');
        list.className = 'c4-type-list';
        variantPanel.appendChild(list);

        const allLabel = document.createElement('label');
        allLabel.className = 'c4-type-item c4-type-item-all';
        allLabel.dataset.label = 'all layouts';
        allLabel.innerHTML =
          '<input type="checkbox" data-variant="all"' + (selectedVariants.size === 0 ? ' checked' : '') + '>' +
          '<span>All layouts</span>';
        list.appendChild(allLabel);

        VARIANT_ORDER.forEach(v => {
          const lbl = document.createElement('label');
          lbl.className = 'c4-type-item';
          lbl.dataset.label = (VARIANT_LABELS[v] || v).toLowerCase();
          lbl.innerHTML =
            '<input type="checkbox" data-variant="' + v + '"' + (selectedVariants.has(v) ? ' checked' : '') + '>' +
            '<span>' + VARIANT_LABELS[v] + '</span>';
          list.appendChild(lbl);
        });

        list.querySelectorAll('input[type="checkbox"]').forEach(input => {
          input.addEventListener('change', () => {
            const v = input.dataset.variant;
            if (v === 'all') {
              if (input.checked) {
                selectedVariants.clear();
                list.querySelectorAll('input[data-variant]:not([data-variant="all"])').forEach(i => { i.checked = false; });
              } else {
                input.checked = true;
              }
            } else {
              if (input.checked) selectedVariants.add(v); else selectedVariants.delete(v);
              const allInput = list.querySelector('input[data-variant="all"]');
              if (allInput) allInput.checked = selectedVariants.size === 0;
            }
            updateVariantSummary();
            applyDisplayFilters();
          });
        });

        const searchInput = searchWrap.querySelector('input');
        searchInput.addEventListener('input', () => {
          const q = searchInput.value.toLowerCase().trim();
          let anyVisible = false;
          list.querySelectorAll('.c4-type-item').forEach(item => {
            if (item.classList.contains('c4-type-item-all')) {
              item.style.display = q ? 'none' : '';
              if (!q) anyVisible = true;
            } else {
              const matches = !q || (item.dataset.label || '').includes(q);
              item.style.display = matches ? '' : 'none';
              if (matches) anyVisible = true;
            }
          });
          let empty = list.querySelector('.c4-type-list-empty');
          if (!anyVisible) {
            if (!empty) {
              empty = document.createElement('div');
              empty.className = 'c4-type-list-empty';
              empty.textContent = 'No matches';
              list.appendChild(empty);
            }
          } else if (empty) {
            empty.remove();
          }
        });

        updateVariantSummary();
      }

      function applyDisplayFilters() {
        const q = (searchInput && searchInput.value || '').toLowerCase().trim();
        /* Toggle which band is the visible one. Non-active bands
           are display:none via CSS, so only the active band's cells
           are visible at all. */
        rail.querySelectorAll('.c4-display-band').forEach(band => {
          if (band.dataset.band === activeSize) {
            band.dataset.bandActive = '1';
          } else {
            delete band.dataset.bandActive;
          }
        });
        /* Mirror the active band's name + dims into the persistent
           rail-head on the left. The rail-head's right cluster (search
           + size pills) is shared across bands. */
        const meta = BAND_META[activeSize];
        if (meta) {
          if (railHeadName) railHeadName.textContent = meta.name;
          if (railHeadDims) railHeadDims.textContent = meta.dims;
        }
        /* Filter cells by variant + search. Size match is implicit
           — non-active bands aren't visible. */
        rail.querySelectorAll('.c4-ad-unit').forEach(card => {
          const matchVariant = selectedVariants.size === 0 || selectedVariants.has(card.dataset.variant);
          const matchSearch = !q || (card.dataset.search || '').includes(q);
          if (matchVariant && matchSearch) {
            delete card.dataset.searchHidden;
          } else {
            card.dataset.searchHidden = '1';
          }
        });
      }

      sizePills.forEach(pill => {
        pill.addEventListener('click', () => {
          sizePills.forEach(p => p.classList.toggle('active', p === pill));
          activeSize = pill.dataset.c4size;
          applyDisplayFilters();
        });
      });

      if (variantTrigger && variantPanel) {
        variantTrigger.addEventListener('click', (e) => {
          e.stopPropagation();
          const open = variantPanel.classList.toggle('open');
          variantPanel.setAttribute('aria-hidden', open ? 'false' : 'true');
          variantTrigger.setAttribute('aria-expanded', open ? 'true' : 'false');
        });
        document.addEventListener('click', (e) => {
          if (!variantPanel.contains(e.target) && !variantTrigger.contains(e.target)) {
            variantPanel.classList.remove('open');
            variantPanel.setAttribute('aria-hidden', 'true');
            variantTrigger.setAttribute('aria-expanded', 'false');
          }
        });
        document.addEventListener('keydown', (e) => {
          if (e.key === 'Escape') {
            variantPanel.classList.remove('open');
            variantPanel.setAttribute('aria-hidden', 'true');
            variantTrigger.setAttribute('aria-expanded', 'false');
          }
        });
      }

      if (searchInput) {
        searchInput.addEventListener('input', applyDisplayFilters);
      }

      renderVariantDropdown();
    }

    /* === Per-card 3-dot menu + edit mode =========================
       Every Social Media / Display card foot carries the shared
       CARD_MENU_HTML on its right side. A single delegated click
       handler on `view` toggles the panel, dispatches menu items,
       and powers the in-card Cancel / Confirm controls. Edit puts
       a known set of text nodes into contentEditable and appends
       an action bar at the bottom of the card. Cancel restores the
       original innerHTML from a snapshot taken on enter; Confirm
       commits the live edits as the new card state. */
    /* Editable text lives INSIDE the post/ad chrome only — never the
       foot lockup (catalog metadata is fixed). Selectors cover every
       visible text node the chrome functions emit across all four
       social platforms, plus Stories / Reels and Display chrome. */
    const EDIT_TARGETS = [
      /* Shared ad-frame chrome */
      '.c4-ad-name', '.c4-ad-sub',
      '.c4-ad-meta-livetext', '.c4-ad-meta-live-tag',
      '.c4-ad-meta-partnership',
      '.c4-ad-caption',
      '.c4-ad-meta-text-body', '.c4-ad-meta-text-card',
      '.c4-ad-cta-btn',
      '.c4-ad-link-host', '.c4-ad-link-title', '.c4-ad-link-desc',
      /* Reactions counts (likes / comments / shares) and the
         Like/Comment/Share button labels are intentionally locked
         out of edit mode — they're functional chrome, not copy. */
      '.c4-ad-more',
      /* Meta Event */
      '.c4-ad-event-pin-dow', '.c4-ad-event-pin-month', '.c4-ad-event-pin-day',
      '.c4-ad-event-date-line', '.c4-ad-event-title', '.c4-ad-event-sub',
      /* Instagram */
      '.c4-ig-username', '.c4-ig-sponsored',
      '.c4-ad-ig-time', '.c4-ad-ig-caption',
      /* Instagram likes + comments counts are functional, not copy
         — locked out of edit alongside the shared reactions. */
      '.c4-ad-ig-sponsored', '.c4-ad-ig-sponsored-cta', '.c4-ad-ig-sponsored-from',
      '.c4-ad-ig-live-msg', '.c4-ad-ig-live-viewers', '.c4-ad-ig-live-input',
      '.c4-ad-ig-live-badge', '.c4-ad-ig-live-stream',
      /* LinkedIn */
      '.c4-ad-li-poll-text', '.c4-ad-li-poll-pct', '.c4-ad-li-poll-meta',
      '.c4-ad-li-article-label', '.c4-ad-li-article-byline',
      '.c4-ad-li-article-title', '.c4-ad-li-article-text',
      '.c4-ad-li-celebrate-title', '.c4-ad-li-celebrate-body',
      '.c4-ad-li-celebrate-sub', '.c4-ad-li-celebrate-label',
      '.c4-ad-li-newsletter-title', '.c4-ad-li-newsletter-name',
      '.c4-ad-li-newsletter-sub', '.c4-ad-li-newsletter-snippet',
      '.c4-ad-li-newsletter-meta',
      '.c4-ad-spotlight-promoted', '.c4-ad-spotlight-title', '.c4-ad-spotlight-sub',
      '.c4-ad-follower-name', '.c4-ad-follower-sub',
      '.c4-ad-follower-body', '.c4-ad-follower-stats',
      '.c4-ad-inmail-headtext', '.c4-ad-inmail-name', '.c4-ad-inmail-role',
      '.c4-ad-inmail-meta', '.c4-ad-inmail-bubble', '.c4-ad-inmail-opt',
      '.c4-ad-inmail-footer',
      /* Reddit */
      '.c4-ad-reddit-sub-name', '.c4-ad-reddit-promoted',
      '.c4-ad-reddit-meta-pill', '.c4-ad-reddit-title', '.c4-ad-reddit-body',
      '.c4-ad-reddit-votes',
      '.c4-ad-reddit-quoted-author', '.c4-ad-reddit-quoted-body',
      '.c4-ad-reddit-quoted-foot', '.c4-ad-reddit-quoted-meta',
      '.c4-ad-reddit-linkcard-host', '.c4-ad-reddit-linkcard-title',
      '.c4-ad-reddit-poll-text', '.c4-ad-reddit-poll-pct', '.c4-ad-reddit-poll-meta',
      '.c4-ad-reddit-join',
      /* Story */
      '.c4-ad-story-cta', '.c4-ad-story-header',
      /* Reel */
      '.c4-ad-reel-cap', '.c4-ad-reel-cta',
      '.c4-ad-reel-music', '.c4-ad-reel-music-line',
      '.c4-ad-reel-footer',
      /* Display chrome */
      '.c4-display-heading', '.c4-display-body', '.c4-display-cta',
      '.c4-display-logo-text', '.c4-display-legal',
    ].join(',');

    /* Canvas_4 graphics-card menu wiring — canvas_3's wireOverlayMenus
       is scoped to canvas_3's grid only, so we duplicate the open/close
       toggle here for the c4-graphics-grids. Mirrors canvas_3: hoist
       the menu to <body> before positioning so its position:fixed
       coords are truly viewport-relative (the card has will-change:
       transform, filter which would otherwise make it the containing
       block). On close we put the menu back next to its button so
       nextElementSibling keeps resolving on the next open. */
    function positionGraphicsMenuC4(btn, menu) {
      if (menu.parentElement !== document.body) {
        menu._origParent = menu.parentElement;
        /* Stash the card too — once the menu is in body the menu
           items can't .closest('.graphics-card') back to it, so any
           handler that needs the card has to read from here. */
        menu._origCard = btn.closest('.graphics-card');
        document.body.appendChild(menu);
      }
      const rect = btn.getBoundingClientRect();
      const margin = 8;
      menu.style.visibility = 'hidden';
      menu.classList.add('open');
      const mw = menu.offsetWidth;
      const mh = menu.offsetHeight;
      menu.classList.remove('open');
      menu.style.visibility = '';
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      /* Default: right of button, aligned to button's top. */
      let left = rect.right + margin;
      let top = rect.top;
      if (left + mw > vw - 12) left = rect.left - mw - margin;
      if (left < 12) left = Math.max(12, vw - mw - 12);
      if (top + mh > vh - 12) top = Math.max(12, rect.bottom - mh);
      menu.style.left = left + 'px';
      menu.style.top = top + 'px';
    }
    function closeAllGraphicsMenusC4() {
      /* Menus may have been hoisted to <body> — look document-wide
         and return each to its original parent so the next click on
         the same button still finds it via nextElementSibling. */
      document.querySelectorAll('.gco-menu.open').forEach(m => {
        if (!m._origParent) return; /* canvas_3 menus are handled by canvas_3's closer */
        m.classList.remove('open');
        m.setAttribute('aria-hidden', 'true');
        m._origParent.appendChild(m);
        delete m._origParent;
        delete m._origCard;
        m.style.left = '';
        m.style.top = '';
      });
      view.querySelectorAll('.c4-graphics-grid .gco-action-more[aria-expanded="true"]').forEach(b => {
        b.setAttribute('aria-expanded', 'false');
      });
      view.querySelectorAll('.c4-graphics-grid .graphics-card.has-open-menu').forEach(c => {
        c.classList.remove('has-open-menu');
      });
    }
    view.addEventListener('click', (e) => {
      const moreBtn = e.target.closest('.c4-graphics-grid .gco-action-more');
      if (moreBtn) {
        e.stopPropagation();
        /* If this button's menu is already open, treat the click on
           the now-X icon as a close. nextElementSibling can't find
           the menu after it's been hoisted to <body>, so check
           aria-expanded directly. */
        if (moreBtn.getAttribute('aria-expanded') === 'true') {
          closeAllGraphicsMenusC4();
          return;
        }
        const menu = moreBtn.nextElementSibling;
        if (!menu || !menu.classList.contains('gco-menu')) return;
        closeAllGraphicsMenusC4();
        positionGraphicsMenuC4(moreBtn, menu);
        menu.classList.add('open');
        menu.setAttribute('aria-hidden', 'false');
        moreBtn.setAttribute('aria-expanded', 'true');
        const card = moreBtn.closest('.graphics-card');
        if (card) card.classList.add('has-open-menu');
        return;
      }
      const c4Delete = e.target.closest('.c4-graphics-grid .gco-action-delete');
      if (c4Delete) {
        e.stopPropagation();
        const card = c4Delete.closest('.graphics-card');
        const dm = document.getElementById('deleteModal');
        if (card && dm && typeof dm._openWith === 'function') dm._openWith(card);
        return;
      }
      /* Click anywhere on a graphics card (except action buttons,
         the hoisted menu, or the revisions badge) → enter edit
         mode for that asset. The hover actions still work for
         their specific behaviors (Reply, Download, Delete, More);
         the card body itself is the primary affordance to edit. */
      const c4Card = e.target.closest('.c4-graphics-grid .graphics-card');
      if (c4Card && !e.target.closest('.gco-actions, .gco-menu, .gco-rev-badge, .gco-action')) {
        e.stopPropagation();
        if (typeof window._c4EnterEditMode === 'function') {
          window._c4EnterEditMode(c4Card);
        }
        return;
      }
    });
    /* Outside click closes any open canvas_4 graphics menu. Scroll /
       resize also invalidate the cached coords so just close on those
       too. */
    document.addEventListener('click', (e) => {
      if (e.target.closest('.gco-menu') || e.target.closest('.c4-graphics-grid .gco-action-more')) return;
      closeAllGraphicsMenusC4();
    });
    /* Menu item clicks at document level — the menu has been hoisted
       to <body> by positionGraphicsMenuC4, so a view-scoped listener
       wouldn't catch them. Only handle items whose menu carries an
       _origCard (canvas_4 menus stash that; canvas_3 menus don't), so
       canvas_3's own per-item listeners stay authoritative for its
       cards. */
    document.addEventListener('click', (e) => {
      const item = e.target.closest('.gco-menu-item');
      if (!item) return;
      const menu = item.closest('.gco-menu');
      if (!menu || !menu._origCard) return; /* canvas_3 menu — skip */
      e.stopPropagation();
      const card = menu._origCard;
      const isDelete = item.classList.contains('gco-menu-item-delete');
      const isEdit = (item.textContent || '').trim() === 'Edit';
      closeAllGraphicsMenusC4();
      if (isDelete && card) {
        const dm = document.getElementById('deleteModal');
        if (dm && typeof dm._openWith === 'function') dm._openWith(card);
      } else if (isEdit && card) {
        enterGraphicsEditMode(card);
      }
    });
    window.addEventListener('resize', closeAllGraphicsMenusC4);
    window.addEventListener('scroll', closeAllGraphicsMenusC4, true);

    /* === Image edit mode ============================================
       Spawned by clicking "Edit" from a graphics-card 3-dot menu.
       Hijacks the canvas right-side area with a full-takeover overlay:
       white-mat photo frame center stage, revision history rail right,
       chat (untouched) on the left where dialogue drives edits. */
    const editModeEl = document.getElementById('c4EditMode');
    if (editModeEl) {
      const editImgCurrent = editModeEl.querySelector('.c4-edit-img-current');
      const editImgPrev = editModeEl.querySelector('.c4-edit-img-prev');
      const editFrame = editModeEl.querySelector('.c4-edit-frame');
      const editPinsEl = editModeEl.querySelector('[data-edit-pins]');
      const editRailList = editModeEl.querySelector('[data-edit-rail-list]');
      const editRevCurrent = editModeEl.querySelector('[data-edit-rev-current]');
      const editRevTotal = editModeEl.querySelector('[data-edit-rev-total]');
      const editRailCount = editModeEl.querySelector('[data-edit-rail-count]');
      const editRailPlural = editModeEl.querySelector('[data-edit-rail-plural]');
      const editPromptMini = editModeEl.querySelector('[data-edit-prompt-mini]');
      const editBackBtn = editModeEl.querySelector('.c4-edit-back');
      const editCompareBtn = editModeEl.querySelector('[data-edit-action="compare"]');
      const editFitBtn = editModeEl.querySelector('[data-edit-action="fit"]');
      const editFullscreenBtn = editModeEl.querySelector('[data-edit-action="fullscreen"]');
      const editDownloadBtn = editModeEl.querySelector('[data-edit-action="download"]');
      const editRevertBtn = editModeEl.querySelector('[data-edit-action="revert"]');
      const editSplitHandle = editModeEl.querySelector('.c4-edit-split-handle');
      const editCursorDot = editModeEl.querySelector('[data-edit-cursor]');
      const editRail = editModeEl.querySelector('.c4-edit-rail');
      const editRailResize = editModeEl.querySelector('[data-edit-rail-resize]');
      const editSkeleton = editModeEl.querySelector('[data-edit-skeleton]');

      /* Skeleton loader — covers the image area while a new revision
         loads. Hides the image (opacity 0 + blur 14px via is-loaded
         removal) so the user never sees the partial img while the
         skeleton plays. After the MIN duration AND the load event
         fire, the skeleton dissolves WHILE the image rack-focuses
         in — single coordinated reveal. */
      let editSkeletonTimer = null;
      let editSkeletonLoadHandler = null;
      function showEditSkeleton(minMs) {
        if (!editSkeleton) return;
        const MIN = typeof minMs === 'number' ? minMs : 1500;
        /* Hide the image FIRST so even if the new src is cached and
           the browser renders it instantly, the user sees the
           skeleton — not the image — until we explicitly reveal it. */
        if (editImgCurrent) editImgCurrent.classList.remove('is-loaded');
        editSkeleton.classList.add('is-visible');
        if (editSkeletonTimer) {
          clearTimeout(editSkeletonTimer);
          editSkeletonTimer = null;
        }
        if (editSkeletonLoadHandler && editImgCurrent) {
          editImgCurrent.removeEventListener('load', editSkeletonLoadHandler);
          editSkeletonLoadHandler = null;
        }
        function hideNow() {
          editSkeleton.classList.remove('is-visible');
          /* Reveal the image WITH the skeleton's fade-out — the
             skeleton's opacity transition runs 380ms, the image's
             blur/opacity runs 600-700ms, so the focus pull
             outlasts the dissolve and feels deliberate. */
          if (editImgCurrent) editImgCurrent.classList.add('is-loaded');
          editSkeletonTimer = null;
          if (editSkeletonLoadHandler && editImgCurrent) {
            editImgCurrent.removeEventListener('load', editSkeletonLoadHandler);
            editSkeletonLoadHandler = null;
          }
        }
        /* Always wait the full MIN first, then verify the image is
           done. This guarantees the skeleton is on screen long
           enough to read as a real loading moment. */
        editSkeletonTimer = setTimeout(() => {
          if (!editImgCurrent || (editImgCurrent.complete && editImgCurrent.naturalWidth > 0)) {
            hideNow();
            return;
          }
          /* Image still loading — wait for it, then hide. Hard
             cap at 2400ms after MIN as a safety net. */
          editSkeletonLoadHandler = () => hideNow();
          editImgCurrent.addEventListener('load', editSkeletonLoadHandler, { once: true });
          editSkeletonTimer = setTimeout(hideNow, 2400);
        }, MIN);
      }

      let editState = null; /* { card, revisions, activeIdx, isVideo } */

      /* Rail pinch / resize ===========================================
         The rail width is driven by the --rail-width custom property
         on .c4-edit-mode (default 280px). User drags the handle on
         the rail's left edge to compress to as little as 70px (~1/4
         of the default) or extend back to 280px (the cap). Below the
         130px threshold we mark the rail .is-collapsed so the head
         text hides and the padding tightens. */
      const RAIL_MAX = 280;
      const RAIL_MIN = 70;
      const RAIL_COLLAPSE_AT = 130;
      let editRailWidth = RAIL_MAX;
      function applyEditRailWidth(px) {
        const clamped = Math.max(RAIL_MIN, Math.min(RAIL_MAX, px));
        editRailWidth = clamped;
        editModeEl.style.setProperty('--rail-width', clamped + 'px');
        if (editRail) editRail.classList.toggle('is-collapsed', clamped < RAIL_COLLAPSE_AT);
      }
      if (editRailResize) {
        editRailResize.addEventListener('mousedown', (e) => {
          e.preventDefault();
          const startX = e.clientX;
          const startWidth = editRailWidth;
          editModeEl.classList.add('is-rail-resizing');
          /* Cursor stays ew-resize even as it leaves the handle's
             8px hit area during drag — body-level override. */
          const prevCursor = document.body.style.cursor;
          document.body.style.cursor = 'ew-resize';
          function onMove(ev) {
            /* Rail lives on the right edge, so dragging LEFT grows
               the rail (cursor moves left → startX - clientX > 0). */
            const delta = startX - ev.clientX;
            applyEditRailWidth(startWidth + delta);
          }
          function onUp() {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
            editModeEl.classList.remove('is-rail-resizing');
            document.body.style.cursor = prevCursor;
          }
          document.addEventListener('mousemove', onMove);
          document.addEventListener('mouseup', onUp);
        });
        /* Double-click the handle toggles between collapsed (70) and
           full (280) with the grid-template-columns transition
           providing the snap animation. */
        editRailResize.addEventListener('dblclick', (e) => {
          e.preventDefault();
          applyEditRailWidth(editRailWidth < RAIL_COLLAPSE_AT ? RAIL_MAX : RAIL_MIN);
        });
        /* Keyboard a11y — arrow left/right while the handle is
           focused nudges the width by 16px steps. */
        editRailResize.addEventListener('keydown', (e) => {
          if (e.key === 'ArrowLeft')  { e.preventDefault(); applyEditRailWidth(editRailWidth + 16); }
          if (e.key === 'ArrowRight') { e.preventDefault(); applyEditRailWidth(editRailWidth - 16); }
          if (e.key === 'Home')       { e.preventDefault(); applyEditRailWidth(RAIL_MAX); }
          if (e.key === 'End')        { e.preventDefault(); applyEditRailWidth(RAIL_MIN); }
        });
      }

      /* Position the fixed overlay to cover exactly the canvas right
         side (everything below the canvas-header, right of the chat
         + splitter). Called on enter + on resize. */
      function applyEditBounds() {
        const canvas = document.getElementById('canvas');
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        editModeEl.style.top = rect.top + 'px';
        editModeEl.style.left = rect.left + 'px';
        editModeEl.style.width = rect.width + 'px';
        editModeEl.style.height = rect.height + 'px';
        /* Reset inset since we're setting explicit top/left/width/h. */
        editModeEl.style.right = 'auto';
        editModeEl.style.bottom = 'auto';
      }

      function renderEditRail() {
        if (!editState) return;
        const { revisions, activeIdx } = editState;
        editRailList.innerHTML = '';
        /* Newest at the top — reverse the index order for display. */
        revisions.slice().reverse().forEach((rev, displayIdx) => {
          const realIdx = revisions.length - 1 - displayIdx;
          const li = document.createElement('li');
          li.className = 'c4-edit-rail-item';
          if (realIdx === activeIdx) li.classList.add('is-active');
          li.dataset.revIdx = String(realIdx);
          if (editState.isVideo) {
            /* For video revisions, render an <img> placeholder since
               we don't have poster frames per revision. */
            li.innerHTML =
              '<div style="aspect-ratio:16/9;background:#1a1a1a;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,0.4);font-size:11px;">Video</div>' +
              '<span class="c4-edit-rail-label">' + rev.label + '</span>';
          } else {
            li.innerHTML =
              '<img src="' + rev.src + '" alt="" loading="lazy">' +
              '<span class="c4-edit-rail-label">' + rev.label + '</span>';
          }
          li.addEventListener('click', () => switchRevision(realIdx));
          editRailList.appendChild(li);
        });
      }

      function switchRevision(idx) {
        if (!editState) return;
        const { revisions } = editState;
        if (idx < 0 || idx >= revisions.length) return;
        editState.activeIdx = idx;
        showEditSkeleton(1400);
        editImgCurrent.src = upscaleEditSrc(revisions[idx].src);
        editPrevSwap();
        editRevCurrent.textContent = idx + 1;
        editRailList.querySelectorAll('.c4-edit-rail-item').forEach(item => {
          item.classList.toggle('is-active', Number(item.dataset.revIdx) === idx);
        });
        /* Drop any pins from the previous revision — pins are
           per-revision context. */
        editPinsEl.innerHTML = '';
        /* Update compare toggle availability — there's only a prev
           revision if activeIdx > 0. */
        if (editCompareBtn) {
          editCompareBtn.disabled = idx === 0;
          if (idx === 0) {
            editCompareBtn.classList.remove('is-on');
            editFrame.dataset.mode = 'single';
          }
        }
      }

      /* Upscale Unsplash thumbnail params (e.g., w=420&h=315) to a
         high-res variant for edit mode so the image stays crisp at
         full-frame size. Bumps quality from 75 → 88 and width to at
         least the target (height scales to preserve aspect). DPR
         multiplier on top so retina displays get even more pixels.
         Non-Unsplash URLs (videos, local files) pass through. */
      function upscaleEditSrc(src) {
        if (!src || typeof src !== 'string') return src;
        if (src.indexOf('images.unsplash.com') === -1) return src;
        const m = src.match(/w=(\d+)&h=(\d+)/);
        if (!m) return src;
        const oldW = parseInt(m[1], 10);
        const oldH = parseInt(m[2], 10);
        if (!oldW || !oldH) return src;
        const aspect = oldW / oldH;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        /* Bias well over the displayed frame size — 2400 base × 2
           DPR = 4800 wide on retina. Covers any reasonable stage
           width with margin so the image stays crisp even when
           the rail collapses and the frame fills the canvas. */
        const targetW = Math.max(oldW, Math.round(2400 * dpr));
        const targetH = Math.round(targetW / aspect);
        return src
          .replace(/w=\d+/, 'w=' + targetW)
          .replace(/h=\d+/, 'h=' + targetH)
          .replace(/[?&]q=\d+/, function (s) { return s[0] + 'q=90'; });
      }

      function editPrevSwap() {
        if (!editState) return;
        const { revisions, activeIdx } = editState;
        if (activeIdx > 0) {
          editImgPrev.src = upscaleEditSrc(revisions[activeIdx - 1].src);
        }
      }

      /* Explicitly size the frame from the image's natural aspect
         ratio so portrait + square images don't stay at their
         small intrinsic width. Targets 92% of the binding stage
         dimension; the other axis follows the aspect. Re-runs on
         image load, window resize, and rail-width changes. */
      const editStageEl = editModeEl.querySelector('.c4-edit-stage');
      /* Compute target frame size for a given aspect — extracted
         from sizeEditFrame so the entry path can call it BEFORE
         the new image has loaded (using the card's stored aspect)
         so the skeleton starts at the right dimensions instead of
         snapping to size when the image finishes loading. */
      function sizeEditFrameForAspect(aspect) {
        if (!editStageEl || !editFrame || !aspect || !isFinite(aspect)) return;
        const rect = editStageEl.getBoundingClientRect();
        /* Stage horizontal padding 16, vertical 14, plus the
           hint sits below the frame so reserve ~26px for it. */
        const availW = rect.width - 32;
        const availH = rect.height - 28 - 26;
        if (availW <= 0 || availH <= 0) return;
        const targetW = Math.min(availW * 0.92, availH * 0.92 * aspect);
        const targetH = targetW / aspect;
        editFrame.style.width  = (targetW + 12) + 'px';
        editFrame.style.height = (targetH + 12) + 'px';
      }
      function sizeEditFrame() {
        if (editImgCurrent && editImgCurrent.naturalWidth) {
          const aspect = editImgCurrent.naturalWidth / editImgCurrent.naturalHeight;
          sizeEditFrameForAspect(aspect);
        }
      }
      window._c4SizeEditFrame = sizeEditFrame;
      window._c4SizeEditFrameForAspect = sizeEditFrameForAspect;
      editImgCurrent.addEventListener('load', sizeEditFrame);
      if (editImgCurrent.complete) sizeEditFrame();
      /* Re-size when the window changes or the user drags the
         rail-resize handle (both reflow the stage). */
      window.addEventListener('resize', sizeEditFrame);
      if (typeof ResizeObserver === 'function' && editStageEl) {
        new ResizeObserver(sizeEditFrame).observe(editStageEl);
      }

      function enterGraphicsEditMode(card) {
        if (!card) return;
        const img = card.querySelector('img');
        const vid = card.querySelector('video');
        const isVideo = !!vid && !img;
        const baseSrc = img ? (img.currentSrc || img.src) : (vid ? (vid.currentSrc || vid.src) : '');
        const promptText = (card.querySelector('.gco-prompt')?.textContent || '').trim();

        /* Pull pre-baked revisions off the card, or synthesize a
           single-revision list from the current asset. */
        let revisions = [];
        try { revisions = JSON.parse(card.dataset.revisions || '[]'); } catch (_) { revisions = []; }
        if (revisions.length === 0) {
          revisions = [{ src: baseSrc, label: 'v1' }];
        }

        editState = {
          card,
          revisions,
          activeIdx: revisions.length - 1,
          isVideo,
        };

        /* Pre-size the frame to match the image's eventual rendered
           size BEFORE setting the new src — otherwise the skeleton
           starts at the previous frame's dimensions and snaps when
           the new image loads. Card carries style.aspectRatio
           ("420 / 560" etc.) set in renderGraphicsCards, which
           matches the source image's aspect. */
        const aspectStr = card.style.aspectRatio || '';
        const parts = aspectStr.split('/').map(p => parseFloat(p.trim()));
        if (parts.length === 2 && parts[0] > 0 && parts[1] > 0) {
          sizeEditFrameForAspect(parts[0] / parts[1]);
        }

        /* Skeleton goes up FIRST so the user sees a loading state
           while the new image fetches. Longer minimum on the
           initial entry than on revision swaps to sell the entry
           moment — intentionally a hair slow, reads as deliberate. */
        showEditSkeleton(1800);
        editImgCurrent.src = upscaleEditSrc(revisions[editState.activeIdx].src);
        editPrevSwap();

        editRevCurrent.textContent = editState.activeIdx + 1;
        editRevTotal.textContent = revisions.length;
        editRailCount.textContent = revisions.length;
        editRailPlural.textContent = revisions.length === 1 ? '' : 's';
        editPromptMini.textContent = promptText;

        /* Drop the source prompt into the composer textarea so the
           user can refine instead of retyping. autoSizeComposer
           grows the input box to fit the prompt height, pushing
           the chat-hat + stream upward as needed. */
        const composerInput = document.getElementById('composerInput');
        if (composerInput && promptText) {
          composerInput.value = promptText;
          if (typeof window._c4AutoSizeComposer === 'function') {
            window._c4AutoSizeComposer();
          }
        }

        editFrame.dataset.mode = 'single';
        editPinsEl.innerHTML = '';
        editFrame.style.setProperty('--split-frac', '0.5');
        if (editCompareBtn) {
          editCompareBtn.disabled = revisions.length < 2 || editState.activeIdx === 0;
          editCompareBtn.classList.remove('is-on');
        }
        if (editFitBtn) editFitBtn.classList.remove('is-on');
        editFrame.classList.remove('is-fit-fill');

        renderEditRail();

        /* Set bounds first, then animate in on the next frame. */
        applyEditBounds();
        requestAnimationFrame(() => requestAnimationFrame(() => {
          editModeEl.setAttribute('aria-hidden', 'false');
          editModeEl.dataset.visible = '1';
          /* Slide in the image-model pill + drop a bot greeting into
             the chat stream. Both helpers are exposed at the bottom
             of this script block; they no-op if the elements aren't
             present so the order of init isn't load-bearing. */
          if (typeof window._c4ShowImageModelPill === 'function') {
            window._c4ShowImageModelPill();
          }
          if (typeof window._c4InjectEditGreeting === 'function') {
            window._c4InjectEditGreeting(promptText);
          }
        }));
        /* Lock #canvas (the right-side scroll container) AND body
           so the user is pinned in the edit mode viewport until they
           explicitly exit. Either could be the active scroller
           depending on layout. */
        const canvasEl = document.getElementById('canvas');
        if (canvasEl) {
          canvasEl._prevOverflow = canvasEl.style.overflow;
          canvasEl.style.overflow = 'hidden';
        }
        document.body.style.overflow = 'hidden';
      }

      function exitGraphicsEditMode() {
        editModeEl.dataset.visible = '0';
        /* Slide the image-model pill back out alongside the overlay
           fade. Greeting message stays in the chat stream as part of
           the conversation history — Bryan's intent is a dialogue, so
           the agent's line shouldn't vanish when the user exits. */
        if (typeof window._c4HideImageModelPill === 'function') {
          window._c4HideImageModelPill();
        }
        /* Clear the pre-filled prompt + collapse the composer so the
           chat returns to its non-edit baseline. */
        const composerInput = document.getElementById('composerInput');
        if (composerInput) {
          composerInput.value = '';
          if (typeof window._c4AutoSizeComposer === 'function') {
            window._c4AutoSizeComposer();
          }
        }
        /* aria-hidden flips after the fade-out completes so AT focus
           management has a chance to step out of the overlay. */
        setTimeout(() => {
          editModeEl.setAttribute('aria-hidden', 'true');
          editPinsEl.innerHTML = '';
          editFrame.dataset.mode = 'single';
          editFrame.classList.remove('is-fit-fill');
          editImgCurrent.removeAttribute('src');
          editImgPrev.removeAttribute('src');
          editState = null;
        }, 380);
        const canvasEl = document.getElementById('canvas');
        if (canvasEl) {
          canvasEl.style.overflow = canvasEl._prevOverflow || '';
        }
        document.body.style.overflow = '';
      }

      editBackBtn.addEventListener('click', exitGraphicsEditMode);
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && editModeEl.dataset.visible === '1') exitGraphicsEditMode();
      });
      window.addEventListener('resize', () => {
        if (editModeEl.dataset.visible === '1') applyEditBounds();
      });

      /* Cursor dot — tracks the mouse across the image so the user
         sees a theme-colored crosshair instead of the OS cursor. The
         dot is positioned in frame-relative coords; visibility is
         gated on the pointer being inside the image rect (pins
         coord space). Hidden in compare mode so the ew-resize
         affordance reads cleanly. */
      function moveEditCursorDot(e) {
        if (!editCursorDot) return;
        if (editFrame.dataset.mode === 'compare') {
          editCursorDot.classList.remove('is-visible');
          return;
        }
        const frameRect = editFrame.getBoundingClientRect();
        const pinsRect = editPinsEl.getBoundingClientRect();
        const ix = e.clientX - pinsRect.left;
        const iy = e.clientY - pinsRect.top;
        if (ix < 0 || ix > pinsRect.width || iy < 0 || iy > pinsRect.height) {
          editCursorDot.classList.remove('is-visible');
          return;
        }
        editCursorDot.style.left = (e.clientX - frameRect.left) + 'px';
        editCursorDot.style.top = (e.clientY - frameRect.top) + 'px';
        editCursorDot.classList.add('is-visible');
      }
      editFrame.addEventListener('mousemove', moveEditCursorDot);
      editFrame.addEventListener('mouseleave', () => {
        if (editCursorDot) editCursorDot.classList.remove('is-visible');
      });

      /* Click-to-pin — click anywhere on the frame to drop a numbered
         pin at that location. Pin coordinates are stored as % so the
         pin stays anchored if the frame resizes. */
      editFrame.addEventListener('click', (e) => {
        /* Don't drop a pin if the user clicked an existing pin or the
           compare slider handle. */
        if (e.target.closest('.c4-edit-pin') || e.target.closest('.c4-edit-split-handle')) return;
        /* Skip drops in compare mode — the slider needs the click
           surface. */
        if (editFrame.dataset.mode === 'compare') return;
        const rect = editPinsEl.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        if (x < 0 || x > 100 || y < 0 || y > 100) return;
        /* Burst the cursor dot — flares out + fades. The pin's own
           ring-ripple keyframe handles the rest of the choreography
           so the two animations layer instead of stacking. */
        if (editCursorDot) {
          editCursorDot.classList.add('is-bursting');
          setTimeout(() => {
            editCursorDot.classList.remove('is-bursting');
          }, 340);
        }
        const pin = document.createElement('button');
        pin.type = 'button';
        pin.className = 'c4-edit-pin';
        pin.style.left = x + '%';
        pin.style.top = y + '%';
        const count = editPinsEl.querySelectorAll('.c4-edit-pin').length + 1;
        pin.textContent = String(count);
        pin.setAttribute('aria-label', 'Edit pin ' + count + ' — click to remove');
        pin.addEventListener('click', (ev) => {
          ev.stopPropagation();
          pin.remove();
          /* Renumber remaining pins so the count stays continuous. */
          editPinsEl.querySelectorAll('.c4-edit-pin').forEach((p, i) => {
            p.textContent = String(i + 1);
          });
        });
        editPinsEl.appendChild(pin);
      });

      /* Compare / before-after slider drag — only active when frame's
         data-mode is 'compare'. Drag horizontally to wipe between the
         current and previous revisions. */
      let editDragging = false;
      function updateSplit(clientX) {
        const rect = editPinsEl.getBoundingClientRect();
        let frac = (clientX - rect.left) / rect.width;
        frac = Math.max(0, Math.min(1, frac));
        editFrame.style.setProperty('--split', (frac * 100) + '%');
        editFrame.style.setProperty('--split-frac', String(frac));
      }
      editSplitHandle.addEventListener('mousedown', (e) => {
        if (editFrame.dataset.mode !== 'compare') return;
        editDragging = true;
        e.preventDefault();
        updateSplit(e.clientX);
      });
      document.addEventListener('mousemove', (e) => {
        if (!editDragging) return;
        updateSplit(e.clientX);
      });
      document.addEventListener('mouseup', () => { editDragging = false; });

      /* Toolbar actions — most are visual-only placeholders for now;
         the chat dialogue is where real edit generation will happen. */
      if (editCompareBtn) {
        editCompareBtn.addEventListener('click', () => {
          if (editCompareBtn.disabled) return;
          const on = editFrame.dataset.mode === 'compare';
          editFrame.dataset.mode = on ? 'single' : 'compare';
          editCompareBtn.classList.toggle('is-on', !on);
          if (!on) {
            /* Default the split to the middle each time compare flips
               on so the user sees both halves before dragging. */
            editFrame.style.setProperty('--split', '50%');
            editFrame.style.setProperty('--split-frac', '0.5');
          }
        });
      }
      if (editFitBtn) {
        editFitBtn.addEventListener('click', () => {
          const fill = editFrame.classList.toggle('is-fit-fill');
          editFitBtn.classList.toggle('is-on', fill);
          if (fill) {
            /* "Fill" — zoom the image so it covers the frame. Uses
               object-fit: cover behavior via JS-applied inline style
               (CSS class would compound with the base). */
            editImgCurrent.style.objectFit = 'cover';
            editImgPrev.style.objectFit = 'cover';
          } else {
            editImgCurrent.style.objectFit = '';
            editImgPrev.style.objectFit = '';
          }
        });
      }
      if (editFullscreenBtn) {
        editFullscreenBtn.addEventListener('click', () => {
          const fs = document.fullscreenElement;
          if (fs) {
            document.exitFullscreen && document.exitFullscreen();
          } else {
            const target = editFrame || editModeEl;
            if (target.requestFullscreen) target.requestFullscreen().catch(() => {});
          }
        });
      }
      if (editDownloadBtn) {
        editDownloadBtn.addEventListener('click', () => {
          if (!editState) return;
          const rev = editState.revisions[editState.activeIdx];
          if (!rev) return;
          const a = document.createElement('a');
          a.href = rev.src;
          a.download = 'revision-' + rev.label + (editState.isVideo ? '.mp4' : '.jpg');
          a.target = '_blank';
          a.rel = 'noopener';
          document.body.appendChild(a);
          a.click();
          a.remove();
        });
      }
      if (editRevertBtn) {
        editRevertBtn.addEventListener('click', () => {
          if (!editState) return;
          /* Revert = jump to the original (first) revision. */
          switchRevision(0);
          editPinsEl.innerHTML = '';
        });
      }

      /* Expose the entry function up to the canvas_4 IIFE scope so
         the menu-item click handler can call it. */
      window._c4EnterEditMode = enterGraphicsEditMode;
      /* Expose exit so tab-switches can close edit mode before
         flipping to another canvas. */
      window._c4ExitEditMode = function () {
        if (editModeEl && editModeEl.dataset.visible === '1') {
          exitGraphicsEditMode();
        }
      };
    }
    /* Bridge the menu-item handler defined above to the edit-mode
       entry — covers both the c4-graphics-grid context AND a plain
       call from somewhere else if needed. */
    function enterGraphicsEditMode(card) {
      if (typeof window._c4EnterEditMode === 'function') {
        window._c4EnterEditMode(card);
      }
    }

    function closeAllUnitMenus(except) {
      view.querySelectorAll('.c4-unit-menu-panel.open').forEach(panel => {
        if (panel === except) return;
        panel.classList.remove('open');
        panel.setAttribute('aria-hidden', 'true');
        const wrap = panel.parentElement;
        const btn = wrap && wrap.querySelector('.c4-unit-menu-btn');
        if (btn) btn.setAttribute('aria-expanded', 'false');
      });
    }

    /* Eased enter/exit: on enter we tag elements with c4-edit-target
       (transitionable rules) then add .is-active on the next animation
       frame so the transition actually fires. On exit we strip
       .is-active to trigger the fade-out, then defer the contenteditable
       + class teardown until the 260ms transition completes. */
    const EDIT_ANIM_MS = 260;

    function enterCardEdit(card) {
      /* Only one card in edit mode at a time. Cancel any other. */
      view.querySelectorAll('.c4-ad-unit[data-editing="1"]').forEach(c => {
        if (c !== card) exitCardEdit(c, false);
      });
      /* If a prior exit on this card is still mid-teardown, kill the
         pending timer so we don't clobber the fresh edit state. */
      if (card._editExitTimer) {
        clearTimeout(card._editExitTimer);
        card._editExitTimer = null;
      }
      card.dataset.editing = '1';
      const snap = new Map();
      const targets = card.querySelectorAll(EDIT_TARGETS);
      targets.forEach(el => {
        snap.set(el, el.innerHTML);
        el.setAttribute('contenteditable', 'true');
        el.setAttribute('spellcheck', 'true');
        el.classList.add('c4-edit-target');
      });
      card._editSnap = snap;

      let bar = card.querySelector(':scope > .c4-ad-unit-edit-bar');
      if (!bar) {
        bar = document.createElement('div');
        bar.className = 'c4-ad-unit-edit-bar';
        bar.innerHTML =
          '<button class="c4-edit-cancel" type="button">Cancel</button>' +
          '<button class="c4-edit-confirm" type="button">Confirm</button>';
        card.appendChild(bar);
      }

      /* Double rAF: first frame paints the initial (transparent / off-
         screen) state, second frame flips to active. Without this the
         browser collapses both states into a single paint and no
         transition runs. */
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          targets.forEach(el => el.classList.add('is-active'));
          if (bar) bar.classList.add('c4-ad-unit-edit-bar--open');
        });
      });
    }

    function exitCardEdit(card, commit) {
      const snap = card._editSnap;
      const targets = Array.from(card.querySelectorAll('.c4-edit-target'));
      const bar = card.querySelector(':scope > .c4-ad-unit-edit-bar');

      /* Logical state flips immediately so the "is another card in
         edit mode?" check sees this card as out-of-edit. Visual state
         lingers ~260ms while the fade-out plays. */
      delete card.dataset.editing;
      targets.forEach(el => el.classList.remove('is-active'));
      if (bar) bar.classList.remove('c4-ad-unit-edit-bar--open');

      /* Wait for the fade-out transition before tearing down the
         contenteditable surfaces + removing the action bar. */
      card._editExitTimer = setTimeout(() => {
        targets.forEach(el => {
          if (!commit && snap && snap.has(el)) {
            el.innerHTML = snap.get(el);
          }
          el.removeAttribute('contenteditable');
          el.removeAttribute('spellcheck');
          el.classList.remove('c4-edit-target');
        });
        if (bar) bar.remove();
        card._editSnap = null;
        card._editExitTimer = null;
      }, EDIT_ANIM_MS + 20);
    }

    view.addEventListener('click', (e) => {
      const menuBtn = e.target.closest('.c4-unit-menu-btn');
      if (menuBtn && view.contains(menuBtn)) {
        e.stopPropagation();
        const panel = menuBtn.parentElement.querySelector('.c4-unit-menu-panel');
        if (!panel) return;
        const willOpen = !panel.classList.contains('open');
        closeAllUnitMenus(willOpen ? panel : null);
        panel.classList.toggle('open', willOpen);
        panel.setAttribute('aria-hidden', willOpen ? 'false' : 'true');
        menuBtn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
        return;
      }
      const item = e.target.closest('.c4-unit-menu-item');
      if (item && view.contains(item)) {
        e.stopPropagation();
        const card = item.closest('.c4-ad-unit');
        const action = item.dataset.action;
        const panel = item.closest('.c4-unit-menu-panel');
        if (panel) {
          panel.classList.remove('open');
          panel.setAttribute('aria-hidden', 'true');
          const b = panel.parentElement && panel.parentElement.querySelector('.c4-unit-menu-btn');
          if (b) b.setAttribute('aria-expanded', 'false');
        }
        if (action === 'edit' && card) enterCardEdit(card);
        /* Duplicate / Download / Copy link / Delete are placeholders.
           Items still close the menu so the chrome feels real. */
        return;
      }
      const cancelBtn = e.target.closest('.c4-edit-cancel');
      if (cancelBtn && view.contains(cancelBtn)) {
        const card = cancelBtn.closest('.c4-ad-unit');
        if (card) exitCardEdit(card, false);
        return;
      }
      const confirmBtn = e.target.closest('.c4-edit-confirm');
      if (confirmBtn && view.contains(confirmBtn)) {
        const card = confirmBtn.closest('.c4-ad-unit');
        if (card) exitCardEdit(card, true);
        return;
      }
    });

    /* Outside-click closes any open menu. Edit mode stays — the user
       has to hit Cancel or Confirm explicitly. */
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.c4-ad-unit-menu')) {
        closeAllUnitMenus(null);
      }
    });

    /* Esc closes menus only — does NOT exit edit mode, so the user
       can press Esc to deselect text inside a contenteditable without
       losing their in-progress edits. */
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeAllUnitMenus(null);
    });
  })();

  // --- Generic table features: filter + per-column sort + per-row copy ---
  // Works for any table whose headers wrap in .scope-sort-btn (data-col, data-type)
  // and whose rows include .scope-copy-btn cells inside .scope-row-actions.
  // Skips .scope-select cells when computing data-column index, so the same
  // data-col="0" indexing works whether or not the table has a select column.
  const STATUS_ORDER = { confirmed: 0, pending: 1, neutral: 2, open: 3 };
  function getDataCells(row) {
    return Array.from(row.querySelectorAll('td:not(.scope-select):not(.scope-row-actions):not(.scope-rownum)'));
  }
  function getCellSortValue(row, colIndex, type) {
    const cell = getDataCells(row)[colIndex];
    if (!cell) return type === 'number' ? 0 : '';
    if (cell.dataset && cell.dataset.sort != null && cell.dataset.sort !== '') {
      const n = parseFloat(cell.dataset.sort);
      if (!isNaN(n)) return n;
    }
    if (type === 'number') {
      const t = cell.textContent.trim().replace(/[^0-9.\-]/g, '');
      const n = parseFloat(t);
      return isNaN(n) ? 0 : n;
    }
    if (type === 'status') {
      const pill = cell.querySelector('.scope-status');
      if (!pill) return 99;
      for (const k in STATUS_ORDER) {
        if (pill.classList.contains(k)) return STATUS_ORDER[k];
      }
      return 99;
    }
    return cell.textContent.trim().toLowerCase();
  }

  /* --- Pagination ---
     Owns row visibility for every canvas_2 table. After filter and sort
     have done their work (filter sets dataset.filterHidden; sort
     reorders the DOM), pagination.refresh() walks current DOM order,
     filters out hidden rows, and slices the eligible set to the current
     page — only rows in that slice get display:''. If a container is
     passed, it also renders the pagination chrome (summary + prev/page-
     numbers/next). Tables without a container still get the row cap
     (effectively a "show first 10" slice with no UI). */
  function setupPagination(table, options) {
    options = options || {};
    const pageSize = options.pageSize || 10;
    const container = options.container || null;
    const tbody = table.querySelector('tbody');
    if (!tbody) return null;
    let currentPage = 1;
    /* Phantom spacer rows fill out partial pages, but row heights
       still vary by content (1-line vs 2-line cells). Add a min-height
       lock on the wrap, captured AFTER the first refresh has rendered
       phantoms in place, so partial pages with shorter content can't
       shrink the container. ResizeObserver handles the case where
       canvas_2 starts hidden and offsetHeight reads 0 at first paint —
       it fires on the first non-zero size and we lock + disconnect. */
    const wrap = table.parentElement;
    let heightLocked = false;
    let lockObserver = null;
    let isFirstRefresh = true;
    function tryLock() {
      if (heightLocked || !wrap) return;
      const h = wrap.offsetHeight;
      if (h > 0) {
        wrap.style.minHeight = h + 'px';
        /* Stash baseline so the expand-all toggle can restore it on
           collapse (it temporarily raises min-height to the expanded
           page-1 height while the table is in expand-all-rows mode). */
        table.dataset.baseMinHeight = h + 'px';
        heightLocked = true;
        if (lockObserver) {
          lockObserver.disconnect();
          lockObserver = null;
        }
      }
    }
    function startLockWatch() {
      if (heightLocked || lockObserver) return;
      requestAnimationFrame(tryLock);
      if (!heightLocked && 'ResizeObserver' in window) {
        lockObserver = new ResizeObserver(tryLock);
        lockObserver.observe(wrap);
      }
    }

    function getEligibleRows() {
      /* Re-query each refresh — sort reorders the DOM and we need the
         current order to slice correctly. Excludes phantom spacers. */
      return Array.from(tbody.querySelectorAll('tr:not(.scope-pagination-spacer)'))
        .filter(r => !r.dataset.filterHidden);
    }

    /* Look up the visible column count once per refresh. Spacers need a
       single <td colspan="N"> matching the table's column total. */
    function colCount() {
      const headRow = table.querySelector('thead tr');
      return headRow ? headRow.querySelectorAll('th').length : 1;
    }

    /* When expand-all is active and pagination shows rows that weren't
       visible at toggle time, mark their .cell-clamp cells as is-clamped
       (lazy detection), lift line-clamp inline, and apply maxHeight =
       scrollHeight so the cells animate from 3em to full content height
       in step with the page-transition opacity fade. Re-applying on
       already-expanded cells (user navigates back to page 1) is a no-op
       because their inline maxHeight is already correct. */
    function expandCellsOnRows(rows) {
      const cells = [];
      rows.forEach(row => {
        row.querySelectorAll('.cell-clamp').forEach(cell => {
          if (!cell.classList.contains('is-clamped')) {
            if (cell.scrollHeight > cell.clientHeight + 1) {
              cell.classList.add('is-clamped');
              cells.push(cell);
            }
          } else {
            cells.push(cell);
          }
        });
      });
      if (cells.length === 0) return;
      cells.forEach(cell => {
        cell.style.webkitLineClamp = 'unset';
        cell.style.lineClamp = 'unset';
        cell.style.maxHeight = '';
      });
      void table.offsetHeight;
      const heights = cells.map(cell => cell.scrollHeight);
      cells.forEach((cell, i) => {
        cell.style.maxHeight = heights[i] + 'px';
      });
    }

    function refresh() {
      const eligible = getEligibleRows();
      const totalPages = Math.max(1, Math.ceil(eligible.length / pageSize));
      if (currentPage > totalPages) currentPage = totalPages;
      if (currentPage < 1) currentPage = 1;
      const start = (currentPage - 1) * pageSize;
      const end = start + pageSize;

      /* Wipe any phantom spacers from the previous refresh before we
         re-evaluate. Real rows never get this class. */
      tbody.querySelectorAll('tr.scope-pagination-spacer').forEach(r => r.remove());

      /* Two-pass: hide everything, then show the page slice. Filter-hidden
         rows stay hidden either way. Force row-anim-in on rows becoming
         visible so paged-in rows don't flash without the entrance fade
         (the IntersectionObserver doesn't fire on display:none rows, so
         pages 2+ would otherwise lack the class). */
      Array.from(tbody.querySelectorAll('tr')).forEach(r => {
        r.style.display = 'none';
      });
      const slice = eligible.slice(start, end);
      slice.forEach(r => {
        r.style.display = '';
        /* On first refresh, leave row-anim-in OFF so the IntersectionObserver
           scroll-trigger handles the initial entrance fade. On subsequent
           refreshes (page changes), force the class on — IO doesn't fire on
           rows that were display:none, so rows on pages 2+ would otherwise
           render in the pre-animate state and never reveal. */
        if (!isFirstRefresh) {
          r.classList.add('row-anim-in');
        }
      });

      /* If expand-all is active, expand the cells on the newly-visible
         rows so they don't appear in their 2-line clamped state on the
         new page. detectOverflowOnce in setupExpandAllToggle only ever
         marked cells that were rendered at toggle-time, so rows hidden
         by pagination back then need lazy detection now. */
      if (table.classList.contains('expand-all-rows') && slice.length > 0) {
        expandCellsOnRows(slice);
      }

      /* Page-transition: on every refresh AFTER the first (page change,
         filter, sort), fade in the visible slice with a small per-row
         stagger so the new page "lands" rather than snaps into place.
         Skipped on the first refresh — the IntersectionObserver-driven
         row-anim-in handles the initial reveal. */
      if (!isFirstRefresh && slice.length > 0) {
        slice.forEach((r, i) => {
          r.style.opacity = '0';
          r.style.transition =
            'opacity 280ms cubic-bezier(0.22, 1, 0.36, 1) ' + (i * 18) + 'ms';
        });
        /* Force one reflow so the opacity:0 is committed before we
           release it — otherwise the browser collapses both into a
           single render frame and the transition never fires. */
        void tbody.offsetHeight;
        slice.forEach(r => { r.style.opacity = ''; });
        const totalDuration = 280 + slice.length * 18 + 60;
        setTimeout(() => {
          slice.forEach(r => { r.style.transition = ''; });
        }, totalDuration);
      }
      isFirstRefresh = false;

      /* Pad partial pages with phantom rows so the table is always
         pageSize rows tall. Only relevant when pagination chrome is
         present (scope). Other tables either fit in one page or are
         silently capped — adding phantoms there would inflate every
         table to 10 rows tall with no payoff. */
      const gap = pageSize - slice.length;
      if (gap > 0 && container) {
        const cols = colCount();
        for (let i = 0; i < gap; i++) {
          const tr = document.createElement('tr');
          tr.className = 'scope-pagination-spacer';
          tr.setAttribute('aria-hidden', 'true');
          const td = document.createElement('td');
          td.colSpan = cols;
          tr.appendChild(td);
          tbody.appendChild(tr);
        }
      }

      if (container) renderUI(eligible.length, totalPages);
      /* Once page 1 has rendered with its phantom complement, capture
         the wrap height as the floor for every subsequent page. */
      startLockWatch();
    }

    function pageList(page, total) {
      /* Compact page list: [1, …, p-1, p, p+1, …, total]. With ≤ 7 pages
         show every number; otherwise cluster around the current page. */
      if (total <= 7) {
        const out = [];
        for (let i = 1; i <= total; i++) out.push(i);
        return out;
      }
      const out = [1];
      if (page > 3) out.push('ellipsis');
      const lo = Math.max(2, page - 1);
      const hi = Math.min(total - 1, page + 1);
      for (let p = lo; p <= hi; p++) out.push(p);
      if (page < total - 2) out.push('ellipsis');
      out.push(total);
      return out;
    }

    function renderUI(totalRows, totalPages) {
      container.innerHTML = '';
      if (totalRows === 0 && (!table.querySelector('tbody tr')) ) return;

      const summary = document.createElement('span');
      summary.className = 'scope-pagination-summary';
      if (totalRows === 0) {
        summary.textContent = 'No matching rows';
      } else {
        const start = (currentPage - 1) * pageSize + 1;
        const end = Math.min(currentPage * pageSize, totalRows);
        summary.innerHTML = 'Showing <strong>' + start + '–' + end + '</strong> of <strong>' + totalRows + '</strong> rows';
      }
      container.appendChild(summary);

      const ctrls = document.createElement('div');
      ctrls.className = 'scope-pagination-controls';

      const prev = makeBtn('Previous', {
        disabled: currentPage === 1 || totalRows === 0,
        leftIcon: '‹',
        step: true,
        onClick: () => goToPage(currentPage - 1),
      });
      ctrls.appendChild(prev);

      pageList(currentPage, totalPages).forEach(p => {
        if (p === 'ellipsis') {
          const ell = document.createElement('span');
          ell.className = 'scope-pagination-ellipsis';
          ell.textContent = '…';
          ctrls.appendChild(ell);
        } else {
          const btn = makeBtn(String(p), {
            active: p === currentPage,
            onClick: () => goToPage(p),
          });
          ctrls.appendChild(btn);
        }
      });

      const next = makeBtn('Next', {
        disabled: currentPage === totalPages || totalRows === 0,
        rightIcon: '›',
        step: true,
        onClick: () => goToPage(currentPage + 1),
      });
      ctrls.appendChild(next);

      container.appendChild(ctrls);
    }

    function makeBtn(label, opts) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'scope-pagination-btn';
      if (opts.step) btn.classList.add('scope-pagination-btn--step');
      if (opts.active) btn.classList.add('active');
      if (opts.disabled) btn.disabled = true;
      const txt = document.createTextNode(label);
      if (opts.leftIcon) {
        const ic = document.createElement('span');
        ic.textContent = opts.leftIcon;
        ic.setAttribute('aria-hidden', 'true');
        btn.appendChild(ic);
      }
      btn.appendChild(txt);
      if (opts.rightIcon) {
        const ic = document.createElement('span');
        ic.textContent = opts.rightIcon;
        ic.setAttribute('aria-hidden', 'true');
        btn.appendChild(ic);
      }
      if (!opts.disabled && opts.onClick) btn.addEventListener('click', opts.onClick);
      return btn;
    }

    function goToPage(p) {
      currentPage = p;
      refresh();
    }

    refresh();
    return { refresh, goToPage };
  }

  function attachTableFeatures({ table, filterInput, countDisplay, paginationContainerId, pageSize }) {
    if (!table) return;
    const tbody = table.querySelector('tbody');
    if (!tbody) return;
    const rows = Array.from(tbody.querySelectorAll('tr'));
    const totalRows = rows.length;
    const originalOrder = rows.slice();
    /* Pagination: every canvas_2 table caps visible rows to pageSize
       (default 10). Tables that pass paginationContainerId render the
       full pagination chrome below the table; the rest just silently
       clip to the first page. */
    const paginationContainer = paginationContainerId ? document.getElementById(paginationContainerId) : null;
    const pagination = setupPagination(table, {
      container: paginationContainer,
      pageSize: pageSize || 10,
    });

    // Filter
    function setCount(visible) {
      if (!countDisplay) return;
      countDisplay.textContent = (visible === totalRows)
        ? `${totalRows} rows`
        : `${visible} of ${totalRows} rows`;
    }
    /* Clear button (× chip) sits inside the affordances wrapper next to
       the count. Always visible when the wrapper is expanded — doubles
       as a "close" affordance for the collapsible search. Click clears
       any typed query and blurs the input, which the wrapper's blur
       handler treats as a collapse trigger. */
    const clearBtn = filterInput && filterInput.parentElement.querySelector('.scope-table-clear');
    if (filterInput) {
      filterInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          if (filterInput.value !== '') {
            filterInput.value = '';
            filterInput.dispatchEvent(new Event('input', { bubbles: true }));
          }
          /* Always blur on ESC so the wrapper collapses (the blur
             handler below re-applies .collapsed when the value is
             empty). */
          filterInput.blur();
        }
      });
    }
    /* --- Collapsible search ---
       Default state: 38×38 icon-only button (just the magnifying glass).
       Click anywhere on the wrapper expands it to a full pill and
       focuses the input. Blurring an empty input collapses back. The
       adjacent expand-all button slides smoothly because the wrapper's
       flex-grow + flex-basis + max-width all transition. */
    if (filterInput) {
      const searchWrap = filterInput.closest('.scope-table-search');
      if (searchWrap) {
        searchWrap.classList.add('collapsed');
        searchWrap.addEventListener('click', (e) => {
          /* Don't intercept clicks on the clear button — it has its own
             handler that clears + blurs and we want the blur to land on
             a still-collapsed wrapper. */
          if (e.target.closest('.scope-table-clear')) return;
          if (!searchWrap.classList.contains('collapsed')) return;
          searchWrap.classList.remove('collapsed');
          requestAnimationFrame(() => filterInput.focus());
        });
        filterInput.addEventListener('blur', () => {
          if (filterInput.value === '') {
            searchWrap.classList.add('collapsed');
          }
        });
        /* Keyboard focus (tab key, programmatic focus, etc.) lands on
           the input directly. If the wrap is still collapsed at that
           moment, expand it so the user never sees a focused-collapsed
           state. */
        filterInput.addEventListener('focus', () => {
          if (searchWrap.classList.contains('collapsed')) {
            searchWrap.classList.remove('collapsed');
          }
        });
      }
    }
    if (clearBtn && filterInput) {
      clearBtn.addEventListener('click', (e) => {
        e.preventDefault();
        filterInput.value = '';
        filterInput.dispatchEvent(new Event('input', { bubbles: true }));
        /* Fully deselect — blur the input AND drop focus on the page so
           the pill doesn't keep its hover/focus state lingering after
           the click. */
        filterInput.blur();
        if (document.activeElement && document.activeElement.blur) {
          document.activeElement.blur();
        }
        /* Click X = exit the search entirely, not just clear. The blur
           handler above only collapses if value is empty AT BLUR TIME,
           but mousedown on the X fires blur BEFORE the click handler
           clears the value, so blur sees the stale value and skips the
           collapse. Force it here. */
        const searchWrap = filterInput.closest('.scope-table-search');
        if (searchWrap) searchWrap.classList.add('collapsed');
      });
    }
    if (filterInput && countDisplay) {
      setCount(totalRows);
      /* Strip any existing .filter-hit spans from a row's data cells and
         normalize text nodes back into one. Safe to call when there are
         no highlights — the querySelectorAll list is just empty. */
      function clearHighlights(row) {
        getDataCells(row).forEach(cell => {
          cell.querySelectorAll('.filter-hit').forEach(span => {
            span.replaceWith(document.createTextNode(span.textContent));
          });
          cell.normalize();
        });
      }
      /* Walk every text node inside a row's data cells and wrap each
         occurrence of `q` (case-insensitive) in a .filter-hit span.
         Skips text nodes that don't contain the query so untouched
         cells keep their original DOM untouched. */
      function highlightRow(row, q) {
        if (!q) return;
        getDataCells(row).forEach(cell => {
          const walker = document.createTreeWalker(cell, NodeFilter.SHOW_TEXT, null);
          const targets = [];
          let n;
          while ((n = walker.nextNode())) {
            if (n.nodeValue && n.nodeValue.toLowerCase().includes(q)) targets.push(n);
          }
          targets.forEach(textNode => {
            const text = textNode.nodeValue;
            const lower = text.toLowerCase();
            const frag = document.createDocumentFragment();
            const qLen = q.length;
            let lastIdx = 0;
            let idx;
            while ((idx = lower.indexOf(q, lastIdx)) !== -1) {
              if (idx > lastIdx) frag.appendChild(document.createTextNode(text.slice(lastIdx, idx)));
              const hit = document.createElement('span');
              hit.className = 'filter-hit';
              hit.textContent = text.slice(idx, idx + qLen);
              frag.appendChild(hit);
              lastIdx = idx + qLen;
            }
            if (lastIdx < text.length) frag.appendChild(document.createTextNode(text.slice(lastIdx)));
            textNode.parentNode.replaceChild(frag, textNode);
          });
        });
      }
      filterInput.addEventListener('input', () => {
        const q = filterInput.value.trim().toLowerCase();
        let visible = 0;
        rows.forEach(row => {
          /* Always clear first — handles the case where a previous query
             left highlights and the user just edited their query. */
          clearHighlights(row);
          const text = getDataCells(row).map(c => c.textContent).join(' ').toLowerCase();
          const match = q === '' || text.includes(q);
          /* dataset.filterHidden is the source of truth for filter
             state; pagination.refresh() reads it to decide which rows
             are eligible for the current page. */
          if (match) {
            delete row.dataset.filterHidden;
            visible++;
            if (q !== '') highlightRow(row, q);
          } else {
            row.dataset.filterHidden = 'true';
          }
        });
        setCount(visible);
        /* Reset to page 1 on filter change so the user always sees the
           top of the matching set rather than whatever page they were
           on before. */
        if (pagination) pagination.goToPage(1);
      });
    }

    // Sort
    const sortButtons = table.querySelectorAll('thead .scope-sort-btn');
    sortButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const col = parseInt(btn.dataset.col, 10);
        const type = btn.dataset.type || 'text';
        const current = btn.classList.contains('sort-asc') ? 'asc'
                      : btn.classList.contains('sort-desc') ? 'desc' : 'off';
        const next = current === 'off' ? 'asc' : current === 'asc' ? 'desc' : 'off';
        sortButtons.forEach(b => b.classList.remove('sort-asc', 'sort-desc'));
        if (next !== 'off') btn.classList.add('sort-' + next);
        let sorted;
        if (next === 'off') {
          sorted = originalOrder.slice();
        } else {
          sorted = rows.slice().sort((a, b) => {
            const av = getCellSortValue(a, col, type);
            const bv = getCellSortValue(b, col, type);
            if (typeof av === 'number' && typeof bv === 'number') {
              return next === 'asc' ? av - bv : bv - av;
            }
            if (av < bv) return next === 'asc' ? -1 : 1;
            if (av > bv) return next === 'asc' ?  1 : -1;
            return 0;
          });
        }
        sorted.forEach(r => tbody.appendChild(r));
        /* Sort reorders the DOM; pagination needs to recompute which
           rows fall on the current page. Reset to page 1 so the user
           sees the top of the new ordering rather than rows that are
           now somewhere in the middle. */
        if (pagination) pagination.goToPage(1);
      });
    });

    /* --- Kebab menu (Download CSV / Copy all rows / Print / Reset) ---
       Injected into the controls cluster, right-most so it stays
       pinned at the header's right edge while search expands leftward.
       Closure access here gives us originalOrder + sortButtons +
       filterInput + pagination for the action handlers. */
    const board = table.closest('.table-board');
    const controls = board && board.querySelector('.scope-table-controls');
    if (controls && !controls.querySelector('.scope-table-menu-wrap')) {
      const wrap = document.createElement('div');
      wrap.className = 'scope-table-menu-wrap';
      wrap.innerHTML =
        '<button class="scope-table-menu-btn" type="button" aria-label="More options" aria-haspopup="menu" aria-expanded="false">' +
          '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">' +
            '<circle cx="8" cy="3.5" r="1.4"/>' +
            '<circle cx="8" cy="8" r="1.4"/>' +
            '<circle cx="8" cy="12.5" r="1.4"/>' +
          '</svg>' +
        '</button>' +
        '<div class="scope-table-menu" role="menu" aria-hidden="true">' +
          '<button role="menuitem" class="scope-table-menu-item" data-action="download-csv">' +
            '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">' +
              '<path d="M8 2.5v8m0 0L4.5 7m3.5 3.5L11.5 7M2.5 13.5h11"/>' +
            '</svg>' +
            '<span>Download as CSV</span>' +
          '</button>' +
          '<button role="menuitem" class="scope-table-menu-item" data-action="copy-all">' +
            '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">' +
              '<rect x="4.5" y="4.5" width="8" height="9" rx="1.5"/>' +
              '<path d="M3 11.5V4a2 2 0 0 1 2-2h6.5"/>' +
            '</svg>' +
            '<span>Copy all rows</span>' +
          '</button>' +
          '<button role="menuitem" class="scope-table-menu-item" data-action="print">' +
            '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">' +
              '<path d="M4 5.5V2.5h8v3"/>' +
              '<rect x="2.5" y="5.5" width="11" height="6" rx="1"/>' +
              '<path d="M4 11V13.5h8V11"/>' +
            '</svg>' +
            '<span>Print</span>' +
          '</button>' +
          '<div class="scope-table-menu-divider" role="separator"></div>' +
          '<button role="menuitem" class="scope-table-menu-item" data-action="reset">' +
            '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">' +
              '<path d="M13 8a5 5 0 1 1-1.5-3.5"/>' +
              '<path d="M13 3v2.5h-2.5"/>' +
            '</svg>' +
            '<span>Reset filters &amp; sort</span>' +
          '</button>' +
        '</div>';
      controls.appendChild(wrap);

      const menuBtn = wrap.querySelector('.scope-table-menu-btn');
      const menu = wrap.querySelector('.scope-table-menu');

      function setMenuOpen(open) {
        menu.classList.toggle('open', open);
        menuBtn.setAttribute('aria-expanded', String(open));
        menu.setAttribute('aria-hidden', String(!open));
      }

      menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        setMenuOpen(!menu.classList.contains('open'));
      });
      document.addEventListener('click', (e) => {
        if (!wrap.contains(e.target) && menu.classList.contains('open')) {
          setMenuOpen(false);
        }
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && menu.classList.contains('open')) {
          setMenuOpen(false);
          menuBtn.focus();
        }
      });

      function getHeaders() {
        return Array.from(table.querySelectorAll('thead th'))
          .filter(th => !th.classList.contains('scope-rownum-th') && !th.classList.contains('scope-select-th'))
          .map(th => th.textContent.trim().replace(/\s+/g, ' '));
      }
      function getDataRows() {
        return Array.from(tbody.querySelectorAll('tr:not(.scope-pagination-spacer)'))
          .filter(r => !r.dataset.filterHidden)
          .map(row =>
            Array.from(row.querySelectorAll('td:not(.scope-select):not(.scope-row-actions):not(.scope-rownum)'))
              .map(td => td.textContent.trim().replace(/\s+/g, ' '))
          );
      }
      function downloadCSV() {
        const headers = getHeaders();
        const data = getDataRows();
        const all = [headers].concat(data);
        const csv = all.map(row =>
          row.map(cell => '"' + String(cell).replace(/"/g, '""') + '"').join(',')
        ).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const name = (table.getAttribute('aria-label') || 'table')
          .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        a.download = name + '.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
      async function copyAll() {
        const data = getDataRows();
        const text = data.map(r => r.filter(Boolean).join('  ·  ')).join('\n');
        try {
          await navigator.clipboard.writeText(text);
        } catch (_) {
          const ta = document.createElement('textarea');
          ta.value = text;
          ta.style.position = 'fixed';
          ta.style.opacity = '0';
          document.body.appendChild(ta);
          ta.select();
          try { document.execCommand('copy'); } catch (__) {}
          document.body.removeChild(ta);
        }
      }
      function resetAll() {
        /* Clear filter input + drop highlights / filter-hidden flags. */
        if (filterInput && filterInput.value !== '') {
          filterInput.value = '';
          filterInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
        rows.forEach(r => { delete r.dataset.filterHidden; });
        /* Drop sort-direction class from every header sort button. */
        sortButtons.forEach(b => b.classList.remove('sort-asc', 'sort-desc'));
        /* Restore original DOM order (the captured slice in attachTableFeatures). */
        originalOrder.forEach(r => tbody.appendChild(r));
        if (pagination) pagination.goToPage(1);
      }

      wrap.querySelectorAll('.scope-table-menu-item').forEach(item => {
        item.addEventListener('click', (e) => {
          e.stopPropagation();
          const action = item.dataset.action;
          if (action === 'download-csv') downloadCSV();
          else if (action === 'copy-all') copyAll();
          else if (action === 'print') window.print();
          else if (action === 'reset') resetAll();
          setMenuOpen(false);
        });
      });
    }
  }

  /* Inject a stable row-number column at the far left of every canvas_2
     table. Numbers are assigned in original DOM order and ride along
     with rows during sort, so "row 7" always points at the same data.
     Done in JS so the 100+ rows across six tables don't need manual
     markup edits. Runs before attachTableFeatures so the new column is
     in place before sort/filter wire up. */
  function applyRowNumbering(table) {
    if (!table) return;
    const headRow = table.querySelector('thead tr');
    const tbody = table.querySelector('tbody');
    if (!headRow || !tbody) return;
    if (headRow.querySelector('.scope-rownum-th')) return;
    const headerCell = document.createElement('th');
    headerCell.className = 'scope-rownum-th';
    headerCell.textContent = '#';
    headRow.insertBefore(headerCell, headRow.firstChild);
    Array.from(tbody.querySelectorAll('tr')).forEach((row, i) => {
      const td = document.createElement('td');
      td.className = 'scope-rownum';
      td.textContent = String(i + 1);
      row.insertBefore(td, row.firstChild);
    });
  }
  ['.assume-table', '.scope-table', '.roadmap-table', '.compare-table', '.metrics-table', '.dense-table', '.campaign-table'].forEach(sel => {
    applyRowNumbering(document.querySelector(sel));
  });

  /* Lift each .scope-table-controls block into its sibling
     .table-board-head so the search + expand-all icons read as part of
     the section header, anchored to the top-right corner. CSS targets
     `.table-board-head .scope-table-controls` for the absolute-position
     placement and the 32×32 icon-only sizing. */
  document.querySelectorAll('.table-view .table-board').forEach(board => {
    const head = board.querySelector('.table-board-head');
    const controls = board.querySelector(':scope > .scope-table-controls');
    if (head && controls) head.appendChild(controls);
  });

  // Wire each table on canvas_2
  attachTableFeatures({
    table: document.querySelector('.assume-table'),
    filterInput: document.getElementById('assumeFilter'),
    countDisplay: document.getElementById('assumeCount'),
  });
  attachTableFeatures({
    table: document.querySelector('.scope-table'),
    filterInput: document.getElementById('scopeTableFilter'),
    countDisplay: document.getElementById('scopeTableCount'),
    paginationContainerId: 'scopePagination',
  });
  attachTableFeatures({
    table: document.querySelector('.roadmap-table'),
    filterInput: document.getElementById('roadmapFilter'),
    countDisplay: document.getElementById('roadmapCount'),
  });
  attachTableFeatures({
    table: document.querySelector('.compare-table'),
    filterInput: document.getElementById('compareFilter'),
    countDisplay: document.getElementById('compareCount'),
  });
  attachTableFeatures({
    table: document.querySelector('.metrics-table'),
    filterInput: document.getElementById('metricsFilter'),
    countDisplay: document.getElementById('metricsCount'),
  });
  attachTableFeatures({
    table: document.querySelector('.dense-table'),
    filterInput: document.getElementById('denseFilter'),
    countDisplay: document.getElementById('denseCount'),
    paginationContainerId: 'densePagination',
  });
  attachTableFeatures({
    table: document.querySelector('.campaign-table'),
    filterInput: document.getElementById('campaignFilter'),
    countDisplay: document.getElementById('campaignCount'),
  });

  // Wrap text-only cell content in .cell-clamp spans so it can truncate
  // to 2 lines. The full text is mirrored into a data-full attribute so the
  // CSS overlay (.cell-clamp.is-clamped::after) can render it on row hover.
  // We mark a cell as .is-clamped only when its text actually overflows —
  // detected lazily on first row hover (canvas_2 may be hidden initially,
  // making layout measurements unreliable at page load).
  function applyCellClamp(table) {
    if (!table) return;
    const cells = table.querySelectorAll('tbody td:not(.scope-select):not(.scope-row-actions):not(.scope-rownum)');
    cells.forEach(td => {
      if (td.querySelector('.scope-status, .scope-checkbox, .roadmap-progress, .roadmap-owner, .compare-check, .sparkline, .metric-delta')) return;
      if (td.firstElementChild && td.firstElementChild.classList && td.firstElementChild.classList.contains('cell-clamp')) return;
      const text = td.textContent;
      if (!text || !text.trim()) return;
      td.textContent = '';
      const span = document.createElement('span');
      span.className = 'cell-clamp';
      span.textContent = text;
      span.setAttribute('data-full', text);
      td.appendChild(span);
    });
    /* Lazy detection + smooth row expansion on hover.
       On first hover, we tag overflowed cells with .is-clamped. On every
       hover, we drop line-clamp inline and animate max-height up to the
       cell's exact scrollHeight — so the transition lasts the full
       duration from clamped (3em) to the natural content height, ending
       cleanly instead of overshooting past content.
       On mouseleave, we clear the inline max-height (which transitions
       back to the CSS default 3em) and delay re-applying line-clamp until
       AFTER the transition so the shrink doesn't snap-clip mid-flight. */
    const EXPAND_DURATION = 520;
    table.querySelectorAll('tbody tr').forEach(row => {
      let detected = false;
      let leaveTimer = null;
      row.addEventListener('mouseenter', () => {
        if (!detected) {
          detected = true;
          /* Batch detection: read all scrollHeights first, then mark
             overflowing cells. Avoids interleaving reads + class writes
             and the forced-reflow chain that came with it. */
          const allClamps = Array.from(row.querySelectorAll('.cell-clamp'));
          const overflowing = allClamps.filter(span => span.scrollHeight > span.clientHeight + 1);
          overflowing.forEach(span => span.classList.add('is-clamped'));
        }
        if (leaveTimer) { clearTimeout(leaveTimer); leaveTimer = null; }
        /* Batch the cell-clamp release: 1) drop line-clamp on every
           clamped cell (writes only), 2) ONE forced reflow, 3) read
           every scrollHeight (cached layout), 4) apply maxHeight on
           every cell (writes only). For dense-table rows with up to
           10 cell-clamps this collapses ~10 forced reflows into 1,
           cutting the click→slide-start delay from ~80ms to ~5ms so
           the copy button slide kicks off in lockstep with the cell
           expansion instead of trailing it. */
        const clamped = Array.from(row.querySelectorAll('.cell-clamp.is-clamped'));
        if (clamped.length) {
          clamped.forEach(el => {
            el.style.webkitLineClamp = 'unset';
            el.style.lineClamp = 'unset';
          });
          void row.offsetHeight; // single forced reflow for the whole row
          const targets = clamped.map(el => el.scrollHeight);
          clamped.forEach((el, i) => {
            el.style.maxHeight = targets[i] + 'px';
          });
        }
      });
      row.addEventListener('mouseleave', (e) => {
        /* Expand-all override: when the toggle is on, every row is
           already at full height and must stay there. Mouseleave would
           otherwise clear the inline maxHeight and let the base CSS
           snap the cell back to 3em. */
        if (table.classList.contains('expand-all-rows')) return;
        /* Suppress collapse if the cursor is heading to the row-copy
           button. The button lives outside the row's DOM (it's a child
           of the table-board), so the cursor moving onto it from the
           row IS a true row.mouseleave — but UX-wise the user is still
           "with" the row, so we keep it expanded. The button's own
           mouseleave fires collapse if the cursor genuinely leaves both. */
        const tableBoardEl = table.closest('.table-board');
        const cBtn = tableBoardEl && tableBoardEl.querySelector('.row-copy-btn');
        if (cBtn && e && e.relatedTarget &&
            (e.relatedTarget === cBtn || cBtn.contains(e.relatedTarget))) {
          return;
        }
        /* Right-padding-gutter check — for tables with horizontal
           overflow (the dense matrix), the row-extender lives inside
           the wrap's scroll area and may not reach the visible board
           gutter. So if the cursor is in the board's right padding at
           this row's Y level, treat it as still hovering the row.
           Uses the WRAP's right edge (not the table's) because the
           wrap fills the board's content area regardless of whether
           the table itself extends further right. */
        if (tableBoardEl && e) {
          const bR = tableBoardEl.getBoundingClientRect();
          const wrap = table.parentElement;
          if (wrap) {
            const wR = wrap.getBoundingClientRect();
            const rR = row.getBoundingClientRect();
            if (e.clientX > wR.right && e.clientX < bR.right &&
                e.clientY >= rR.top && e.clientY < rR.bottom) {
              return;
            }
          }
        }
        row.querySelectorAll('.cell-clamp.is-clamped').forEach(el => {
          el.style.maxHeight = '';
        });
        if (leaveTimer) clearTimeout(leaveTimer);
        leaveTimer = setTimeout(() => {
          row.querySelectorAll('.cell-clamp.is-clamped').forEach(el => {
            el.style.webkitLineClamp = '';
            el.style.lineClamp = '';
          });
          leaveTimer = null;
        }, EXPAND_DURATION);
      });
    });
  }
  ['.assume-table', '.scope-table', '.roadmap-table', '.compare-table', '.metrics-table', '.dense-table', '.campaign-table'].forEach(sel => {
    applyCellClamp(document.querySelector(sel));
  });

  /* --- Universal row-hover copy affordance for canvas_2 table-boards.
     One floating button per board, positioned absolutely in the right
     padding gutter. JS slides it vertically to align with whichever row
     the cursor is over. Click copies that row's text to clipboard and
     flashes a 'copied' confirmation. No markup added inside cells →
     zero layout impact. --- */
  const COPY_ICON_SVG = '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true">'
    + '<rect x="4.5" y="4.5" width="8" height="9" rx="1.5" stroke="currentColor" stroke-width="1.4"/>'
    + '<path d="M3 11.5V4a2 2 0 0 1 2-2h6.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>'
    + '</svg>';
  const CHECK_ICON_SVG = '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true">'
    + '<path d="M3.5 8L6.5 11L12.5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
    + '</svg>';
  function attachRowCopy(board) {
    const tbody = board.querySelector('tbody');
    if (!tbody || !tbody.querySelector('tr')) return;
    /* Boards with .scope-checkbox-equipped rows (currently scope-table only)
       support multi-select copy — the button shows a count and copies all
       selected rows on click. Other tables behave row-at-a-time. */
    const hasSelection = board.querySelector('.scope-checkbox') !== null;

    /* Inject an invisible .row-extender into each row's last <td>. It
       projects 48px right to cover the table-board's right padding
       gutter at this row's Y range, making the gutter part of the row's
       DOM. tr:hover, row.mouseenter, and row.mouseleave fire naturally
       as the cursor moves through the gutter — no separate hit-testing
       or mousemove handler required, and no race conditions. */
    tbody.querySelectorAll('tr').forEach(row => {
      const lastTd = row.querySelector('td:last-child');
      if (!lastTd || lastTd.querySelector('.row-extender')) return;
      const ext = document.createElement('span');
      ext.className = 'row-extender';
      ext.setAttribute('aria-hidden', 'true');
      lastTd.appendChild(ext);
    });

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'row-copy-btn';
    btn.setAttribute('aria-label', 'Copy row');
    btn.innerHTML = COPY_ICON_SVG;
    board.appendChild(btn);

    let activeRow = null;
    let copiedTimer = null;

    /* positionToRow accepts a `predict` flag:
       - `true` (mouseover-driven, user intent): predicts the row's
         expanded height via scrollHeight−offsetHeight cellDelta, so
         the button slides UPFRONT to where the row will end up after
         expansion. Used for first-hover and cross-row jumps.
       - `false` (ResizeObserver-driven, layout shift tracking): uses
         the row's CURRENT measurements only. Required because during
         a collapse the cellDelta still reads positive (scrollHeight is
         still the natural full height) — predicting would lock the
         button at the expanded center even as the row visibly shrinks
         underneath it, leaving it stuck at the bottom of the collapsed
         frame. */
    function positionToRow(row, predict) {
      const boardRect = board.getBoundingClientRect();
      const rowRect = row.getBoundingClientRect();
      let height = rowRect.height;
      let willExpand = false;
      let maxCellDelta = 0;
      if (predict) {
        row.querySelectorAll('.cell-clamp').forEach(el => {
          const td = el.closest('td');
          if (!td) return;
          const cellDelta = el.scrollHeight - el.offsetHeight;
          if (cellDelta <= 0) return;
          if (cellDelta > maxCellDelta) maxCellDelta = cellDelta;
          const tdFinal = td.offsetHeight + cellDelta;
          if (tdFinal > height) {
            height = tdFinal;
            willExpand = true;
          }
        });
      }
      /* `expanding-slide` (520ms) only applies when ONE cell is
         expanding by a substantial amount — the case where the button
         really needs to ride alongside the cell-clamp's growth. For
         dense tables where every row has small per-cell expansions
         summed across many columns, that slow slide accumulates and
         feels laggy on rapid row hops, so we keep the snappy 260ms
         default. Threshold of 80px favors single-row big-expansion
         cases (long methodology row) over many-small-expansion cases
         (every dense row). */
      btn.classList.toggle('expanding-slide', willExpand && maxCellDelta >= 80);
      const top = rowRect.top + height / 2 - boardRect.top;
      btn.style.top = `${top}px`;
    }
    function selectedCount() {
      return hasSelection ? tbody.querySelectorAll('tr.row-selected').length : 0;
    }
    /* Single render entry point — paints the button based on whether
       there's an active selection and whether we're in copied state.
       Called on hover, on selection change, and on copy success. */
    function renderBtn({ copied = false } = {}) {
      const n = selectedCount();
      const icon = copied ? CHECK_ICON_SVG : COPY_ICON_SVG;
      if (n > 0 && hasSelection) {
        btn.classList.add('with-count');
        btn.innerHTML = icon + '<span class="row-copy-count">' + n + '</span>';
        btn.setAttribute('aria-label', `Copy ${n} selected row${n !== 1 ? 's' : ''}`);
      } else {
        btn.classList.remove('with-count');
        btn.innerHTML = icon;
        btn.setAttribute('aria-label', 'Copy row');
      }
      btn.classList.toggle('copied', copied);
    }
    function resetCopyIcon() {
      if (copiedTimer) { clearTimeout(copiedTimer); copiedTimer = null; }
      renderBtn({ copied: false });
    }

    /* If selection changes while the button is visible, re-render so the
       count chip updates live. Watching tr class changes is the lightest
       way to catch row-selected toggles without coupling to the checkbox
       click handlers. */
    if (hasSelection) {
      const mo = new MutationObserver(() => {
        if (!btn.classList.contains('copied')) renderBtn();
      });
      mo.observe(tbody, { attributes: true, subtree: true, attributeFilter: ['class'] });
    }

    /* mouseover bubbles, so a single listener at board level catches
       transitions between rows. closest('tbody tr') filters out hover
       on header / table padding / the button itself.
       positionToRow predicts the row's expanded height upfront, so we
       only set top once on row change — the button's `top` transition
       matches the cell-clamp's transition curve and they slide in
       lockstep. No re-measure timer needed. */
    board.addEventListener('mouseover', (e) => {
      /* Cursor over the copy button itself — keep current activeRow
         and let btn.mouseenter re-pin the row. */
      if (e.target === btn || btn.contains(e.target)) return;
      /* Real rows only — phantom pagination spacers carry no data so
         hovering them shouldn't pin the button. */
      const row = e.target.closest('tbody tr:not(.scope-pagination-spacer)');
      if (!row || !board.contains(row)) {
        /* Cursor is inside the board but off any row (header,
           controls, table padding, pagination chrome). Hide the
           button so it doesn't stay pinned to a row the user has
           moved away from. */
        if (activeRow) {
          activeRow = null;
          btn.classList.remove('visible');
          resetCopyIcon();
        }
        return;
      }
      if (row !== activeRow) {
        activeRow = row;
        resetCopyIcon();
        positionToRow(row, true);
        btn.classList.add('visible');
      }
    });
    /* ResizeObserver on tbody catches the case where ANOTHER row is
       mid-collapse / mid-expansion while the cursor is on the active
       row — the active row's getBoundingClientRect().top shifts as
       other rows resize, so the button needs to follow.
       Skips while the active row itself is mid-expansion (its own
       cell-clamp's offsetHeight still trails scrollHeight), so the
       initial predicted slide isn't fought by intermediate frames.
       During collapse and once expansion settles, runs in
       no-prediction mode using current measurements — so as a row
       shrinks back, the button tracks the row's actual current center
       instead of staying locked to the (now-stale) expanded center. */
    if ('ResizeObserver' in window) {
      let pendingFrame = null;
      const ro = new ResizeObserver(() => {
        if (!activeRow || !btn.classList.contains('visible')) return;
        const midExpansion = Array.from(activeRow.querySelectorAll('.cell-clamp')).some(el =>
          el.style.maxHeight !== '' && el.offsetHeight < el.scrollHeight - 0.5
        );
        if (midExpansion) return;
        if (pendingFrame) return;
        pendingFrame = requestAnimationFrame(() => {
          pendingFrame = null;
          if (activeRow) positionToRow(activeRow, false);
        });
      });
      ro.observe(tbody);
    }
    board.addEventListener('mouseleave', () => {
      /* Native row.mouseleave fires when the cursor leaves the row's
         DOM — and the row's DOM now extends through the right padding
         gutter via .row-extender, so cursor leaving the board exits the
         row's DOM at the same time. No need to dispatch a synthetic
         mouseleave; the natural one already collapses the row. */
      activeRow = null;
      btn.classList.remove('visible');
      resetCopyIcon();
    });

    /* Cursor entering the button — re-fire the active row's mouseenter
       so its expansion logic re-engages. Required when the cursor
       transits row → empty padding → button: the row.mouseleave fires
       with relatedTarget = table-board (not the button itself) so the
       suppression check doesn't catch it, and the collapse begins.
       This handler cancels that in-flight collapse the moment the
       cursor lands on the button — clears the leaveTimer and re-sets
       maxHeight to scrollHeight, so the row eases back to expanded. */
    btn.addEventListener('mouseenter', () => {
      if (!activeRow) return;
      activeRow.dispatchEvent(new MouseEvent('mouseenter', { bubbles: false }));
    });
    /* Cursor leaving the button — if it's NOT going back into the row,
       fire a synthetic mouseleave on the active row so its expansion
       logic collapses the cell-clamp. Pairs with the row.mouseleave
       suppression on cursor-going-to-button: the row stays expanded
       across the row→button hop and only collapses when the cursor
       genuinely leaves the row+button pair. */
    btn.addEventListener('mouseleave', (e) => {
      if (!activeRow) return;
      const rt = e.relatedTarget;
      if (rt && (rt === activeRow || activeRow.contains(rt))) return;
      activeRow.dispatchEvent(new MouseEvent('mouseleave', {
        bubbles: false,
        relatedTarget: rt,
      }));
    });

    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      /* Pick the source rows: if the table supports selection AND there
         are selected rows, copy all of them (rows joined with newlines).
         Otherwise fall back to the currently hovered row. */
      let rowsToCopy;
      if (hasSelection && selectedCount() > 0) {
        rowsToCopy = Array.from(tbody.querySelectorAll('tr.row-selected'));
      } else if (activeRow) {
        rowsToCopy = [activeRow];
      } else {
        return;
      }
      const lines = rowsToCopy.map(row => {
        const cells = Array.from(row.querySelectorAll('td:not(.scope-select):not(.scope-row-actions):not(.scope-rownum)'));
        return cells.map(c => c.textContent.trim().replace(/\s+/g, ' ')).filter(Boolean).join('  ·  ');
      });
      const text = lines.join('\n');
      try {
        await navigator.clipboard.writeText(text);
      } catch (_) {
        /* Fallback for browsers without async clipboard API */
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); } catch (__) {}
        document.body.removeChild(ta);
      }
      renderBtn({ copied: true });
      if (copiedTimer) clearTimeout(copiedTimer);
      copiedTimer = setTimeout(resetCopyIcon, 1200);
    });
  }
  document.querySelectorAll('.table-view .table-board:not(.table-finale-board)').forEach(attachRowCopy);

  /* --- Selection (single + select-all + indeterminate state) ---
     Wired generically against any (tbody, header-checkbox) pair so scope
     and dense both get identical behavior. */
  function setupTableSelection(tbodySelector, selectAllId) {
    const tbody = document.querySelector(tbodySelector);
    const selectAll = document.getElementById(selectAllId);
    if (!tbody) return;
    function syncSelectAllState() {
      if (!selectAll) return;
      const rows = tbody.querySelectorAll('tr');
      const selected = tbody.querySelectorAll('tr.row-selected').length;
      selectAll.classList.remove('checked', 'indeterminate');
      if (selected === 0) return;
      if (selected === rows.length) selectAll.classList.add('checked');
      else selectAll.classList.add('indeterminate');
    }
    tbody.querySelectorAll('.scope-checkbox').forEach(cb => {
      cb.addEventListener('click', (e) => {
        e.stopPropagation();
        const row = cb.closest('tr');
        if (!row) return;
        const isChecked = cb.classList.toggle('checked');
        row.classList.toggle('row-selected', isChecked);
        syncSelectAllState();
      });
    });
    if (selectAll) {
      selectAll.addEventListener('click', (e) => {
        e.stopPropagation();
        const anySelected = tbody.querySelectorAll('tr.row-selected').length > 0;
        const target = !anySelected;
        tbody.querySelectorAll('tr').forEach(row => {
          row.classList.toggle('row-selected', target);
          const cb = row.querySelector('.scope-checkbox');
          if (cb) cb.classList.toggle('checked', target);
        });
        syncSelectAllState();
      });
    }
  }
  setupTableSelection('.scope-table tbody', 'scopeSelectAll');
  setupTableSelection('.dense-table tbody', 'denseSelectAll');
  setupTableSelection('.campaign-table tbody', 'campaignSelectAll');

  /* --- Generic expand-all toggle wired to (button, table) pairs.
     Drops the 2-line clamp on every overflowing cell at once and lifts
     max-height to a tall ceiling. Toggle uses a 340ms ease-out
     transition so the click feels immediately responsive. Eager
     overflow detection runs once per table and caches the result so
     subsequent toggles skip the work. */
  function setupExpandAllToggle(btnId, tableSelector) {
    const expandBtn = document.getElementById(btnId);
    const table = document.querySelector(tableSelector);
    if (!expandBtn || !table) return;
    const expandLabel = expandBtn.querySelector('.scope-expand-label');
    let shrinkTimer = null;
    let overflowDetected = false;
    function detectOverflowOnce() {
      if (overflowDetected) return;
      overflowDetected = true;
      const cells = Array.from(table.querySelectorAll('.cell-clamp'));
      const overflowing = cells.filter(span =>
        !span.classList.contains('is-clamped') &&
        span.scrollHeight > span.clientHeight + 1
      );
      overflowing.forEach(span => span.classList.add('is-clamped'));
    }
    expandBtn.addEventListener('click', () => {
      const turnOn = !expandBtn.classList.contains('active');
      if (shrinkTimer) {
        clearTimeout(shrinkTimer);
        shrinkTimer = null;
        table.classList.remove('expand-all-rows-shrinking');
      }
      if (turnOn) {
        detectOverflowOnce();
        /* Per-cell measured expand:
           1. Lift line-clamp inline so the browser can lay out each
              cell at its full natural height.
           2. Force one reflow so the new layout is committed.
           3. Read each cell's scrollHeight — that's the target.
           4. Add the .expand-all-rows class (CSS removes line-clamp
              there too, but doesn't set a max-height — leaves the base
              3em from .cell-clamp.is-clamped in place as the start).
           5. In a RAF, write the measured maxHeight inline so the
              transition runs from 3em → exact-content-height. A fixed
              2000px ceiling made the visible reveal finish in the
              first ~5% of the animation; this matches transition
              duration to actual reveal duration. */
        const clamped = Array.from(table.querySelectorAll('.cell-clamp.is-clamped'));
        clamped.forEach(el => {
          el.style.webkitLineClamp = 'unset';
          el.style.lineClamp = 'unset';
          el.style.maxHeight = '';
        });
        void table.offsetHeight;
        const heights = clamped.map(el => el.scrollHeight);
        table.classList.add('expand-all-rows');
        expandBtn.classList.add('active');
        expandBtn.setAttribute('aria-pressed', 'true');
        if (expandLabel) expandLabel.textContent = 'Collapse all';
        requestAnimationFrame(() => {
          clamped.forEach((el, i) => {
            el.style.maxHeight = heights[i] + 'px';
          });
          /* After the per-cell max-height transition lands (~340ms),
             capture the wrap's expanded height as the new floor so
             paginated subsequent pages "open to the height of the first
             expanded page" — pagination's expandCellsOnRows handles the
             row content; this min-height keeps the container from
             shrinking on partial / shorter pages. */
          setTimeout(() => {
            const wrap = table.parentElement;
            if (wrap) {
              const expandedH = wrap.offsetHeight;
              const currentMin = parseFloat(wrap.style.minHeight) || 0;
              if (expandedH > currentMin) {
                wrap.style.minHeight = expandedH + 'px';
              }
            }
          }, 380);
        });
      } else {
        table.classList.remove('expand-all-rows');
        table.classList.add('expand-all-rows-shrinking');
        table.querySelectorAll('.cell-clamp.is-clamped').forEach(el => {
          el.style.maxHeight = '';
        });
        expandBtn.classList.remove('active');
        expandBtn.setAttribute('aria-pressed', 'false');
        if (expandLabel) expandLabel.textContent = 'Expand all';
        shrinkTimer = setTimeout(() => {
          table.classList.remove('expand-all-rows-shrinking');
          table.querySelectorAll('.cell-clamp.is-clamped').forEach(el => {
            el.style.webkitLineClamp = '';
            el.style.lineClamp = '';
          });
          /* Restore the baseline min-height that pagination's lock set
             on the wrap so the container snaps back to its unexpanded
             page-1 height (rather than staying tall after collapse). */
          const wrap = table.parentElement;
          if (wrap && table.dataset.baseMinHeight) {
            wrap.style.minHeight = table.dataset.baseMinHeight;
          }
          shrinkTimer = null;
        }, 360);
      }
    });
  }
  setupExpandAllToggle('scopeExpandAll', '.scope-table');
  setupExpandAllToggle('denseExpandAll', '.dense-table');
  setupExpandAllToggle('campaignExpandAll', '.campaign-table');

  /* --- Composer resize handle ---
     Pointer-drag the grip at the composer's top to grow it. Min height
     is the original 130px (set in CSS) — drag down past the start
     position just clamps. Max is 70vh so the composer never eats the
     whole viewport. */
  (function () {
    const composer = document.querySelector('.composer');
    const handle = document.getElementById('composerResizeHandle');
    if (!composer || !handle) return;
    const MIN_HEIGHT = 130;
    let startY = 0;
    let startHeight = 0;
    let dragging = false;

    function onMove(e) {
      if (!dragging) return;
      const delta = startY - e.clientY; // up = positive = grow
      const maxHeight = Math.max(MIN_HEIGHT, Math.round(window.innerHeight * 0.7));
      const next = Math.max(MIN_HEIGHT, Math.min(maxHeight, startHeight + delta));
      composer.style.height = next + 'px';
    }
    function onUp() {
      if (!dragging) return;
      dragging = false;
      handle.classList.remove('dragging');
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      document.removeEventListener('pointercancel', onUp);
    }
    handle.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      dragging = true;
      startY = e.clientY;
      startHeight = composer.offsetHeight;
      handle.classList.add('dragging');
      /* Lock cursor + disable text selection so dragging over the
         page doesn't snag on text or flip the cursor mid-drag. */
      document.body.style.cursor = 'ns-resize';
      document.body.style.userSelect = 'none';
      document.addEventListener('pointermove', onMove);
      document.addEventListener('pointerup', onUp);
      document.addEventListener('pointercancel', onUp);
    });
  })();

  /* --- Model selector dropdown ---
     Lives in the composer's action row. Click chip → toggle menu;
     clicking an item updates the chip label, marks that row active,
     closes the menu. Outside-click + ESC also close. Selection lives
     in memory only for now; can wire to localStorage once a backend
     handler exists for it. */
  /* Single-menu rule for the chat composer — opening any one of the
     five chat-bar menus (add, chat-model, image-model, aspect, count)
     closes the other four. Helper lives on window so each menu's
     individual set*Open function can call it without juggling
     closure references. */
  window._closeOtherChatMenus = function (exceptMenuId) {
    const menus = [
      { btn: 'addBtn',           menu: 'addMenu' },
      { btn: 'modelSelectorBtn', menu: 'modelSelectorMenu' },
      { btn: 'imageModelBtn',    menu: 'imageModelMenu',    wrap: 'imageModelSelectorWrap' },
      { btn: 'imageAspectBtn',   menu: 'imageAspectMenu' },
      { btn: 'imageCountBtn',    menu: 'imageCountMenu' },
    ];
    menus.forEach(({ btn, menu, wrap }) => {
      if (menu === exceptMenuId) return;
      const btnEl  = document.getElementById(btn);
      const menuEl = document.getElementById(menu);
      if (menuEl) {
        menuEl.classList.remove('open');
        menuEl.setAttribute('aria-hidden', 'true');
      }
      if (btnEl) {
        btnEl.classList.remove('open');
        btnEl.setAttribute('aria-expanded', 'false');
      }
      if (wrap) {
        const wrapEl = document.getElementById(wrap);
        if (wrapEl) wrapEl.style.width = '';
      }
    });
  };

  const modelBtn = document.getElementById('modelSelectorBtn');
  const modelMenu = document.getElementById('modelSelectorMenu');
  const modelLabel = document.getElementById('modelSelectorLabel');
  if (modelBtn && modelMenu) {
    function setModelMenuOpen(open) {
      if (open) window._closeOtherChatMenus('modelSelectorMenu');
      modelMenu.classList.toggle('open', open);
      modelBtn.setAttribute('aria-expanded', String(open));
      modelMenu.setAttribute('aria-hidden', String(!open));
    }
    modelBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      setModelMenuOpen(!modelMenu.classList.contains('open'));
    });
    document.addEventListener('click', (e) => {
      if (!modelMenu.classList.contains('open')) return;
      if (modelBtn.contains(e.target) || modelMenu.contains(e.target)) return;
      setModelMenuOpen(false);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modelMenu.classList.contains('open')) {
        setModelMenuOpen(false);
        modelBtn.focus();
      }
    });
    modelMenu.querySelectorAll('.model-selector-menu-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const prev = modelLabel ? modelLabel.textContent : '';
        const next = item.dataset.model;
        modelMenu.querySelectorAll('.model-selector-menu-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        if (modelLabel) modelLabel.textContent = next;
        setModelMenuOpen(false);
        /* Only fire the energy burst when the user actually changed
           model — clicking the already-active row is a no-op. */
        if (prev !== next) triggerChatEnergyBurst();
      });
    });
  }

  /* --- Image-model selector ---
     Sibling pill to the chat-model selector. Hidden until image edit
     mode opens (window._c4ShowImageModelPill / _c4HideImageModelPill
     are exposed for the edit-mode init to call). Menu items use
     dip-switches for selection; single-select behavior — flipping one
     on flips the others off. */
  const imageModelWrap  = document.getElementById('imageModelSelectorWrap');
  const imageModelBtn   = document.getElementById('imageModelBtn');
  const imageModelMenu  = document.getElementById('imageModelMenu');
  const imageModelLabel = document.getElementById('imageModelLabel');
  if (imageModelWrap && imageModelBtn && imageModelMenu) {
    function positionImageModelMenu() {
      /* Place the menu centered horizontally on the button, with
         its bottom edge 8px above the button's top. position:fixed
         + viewport coords so the menu lives on top of every layer
         and isn't clipped by composer / chat-panel overflow. Width
         and height are read from layout (offset*) — the menu is
         opacity:0 not display:none when closed, so those return
         real values. Edges are clamped 8px in from the viewport
         so the card never paints off-screen. */
      const btnRect = imageModelBtn.getBoundingClientRect();
      const menuW = imageModelMenu.offsetWidth || 320;
      const menuH = imageModelMenu.offsetHeight || 200;
      let left = btnRect.left + btnRect.width / 2 - menuW / 2;
      let top  = btnRect.top - menuH - 8;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      if (left < 8) left = 8;
      if (left + menuW > vw - 8) left = vw - menuW - 8;
      if (top < 8) top = 8;
      if (top + menuH > vh - 8) top = vh - menuH - 8;
      imageModelMenu.style.left = left + 'px';
      imageModelMenu.style.top  = top  + 'px';
    }
    function setImageModelMenuOpen(open) {
      if (open) {
        window._closeOtherChatMenus('imageModelMenu');
        /* Lock the wrap width so selecting different model rows
           (which changes the pill label and would otherwise reflow
           the button) doesn't shift the centered anchor under the
           open menu. */
        imageModelWrap.style.width = imageModelWrap.offsetWidth + 'px';
        /* Reveal first (so offsetWidth/Height read correctly),
           position next, then play the entrance transition. */
        imageModelMenu.classList.add('open');
        positionImageModelMenu();
      } else {
        imageModelMenu.classList.remove('open');
        imageModelWrap.style.width = '';
      }
      imageModelBtn.setAttribute('aria-expanded', String(open));
      imageModelMenu.setAttribute('aria-hidden', String(!open));
    }
    /* Re-anchor when the viewport changes size — the chat splitter
       drag and window resize both fire this. */
    window.addEventListener('resize', () => {
      if (imageModelMenu.classList.contains('open')) positionImageModelMenu();
    });
    imageModelBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      setImageModelMenuOpen(!imageModelMenu.classList.contains('open'));
    });
    document.addEventListener('click', (e) => {
      if (!imageModelMenu.classList.contains('open')) return;
      if (imageModelBtn.contains(e.target) || imageModelMenu.contains(e.target)) return;
      setImageModelMenuOpen(false);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && imageModelMenu.classList.contains('open')) {
        setImageModelMenuOpen(false);
        imageModelBtn.focus();
      }
    });

    /* Selection logic — single-select. The dip-switch on the clicked
       row flips on; all others flip off. Menu stays open after click
       so the user can browse models without re-opening (closes on
       outside click). The just-toggled / just-toggled-off classes
       fire one-shot keyframes for the bloom + settle micro-anims. */
    function selectImageModel(item) {
      const items = imageModelMenu.querySelectorAll('.image-model-item');
      const prevLabel = imageModelLabel ? imageModelLabel.textContent : '';
      const nextLabel = item.dataset.imageModel;
      items.forEach(other => {
        const sw = other.querySelector('.dip-switch');
        if (other === item) {
          if (other.classList.contains('is-active')) return; /* no-op */
          other.classList.add('is-active');
          other.setAttribute('aria-checked', 'true');
          if (sw) {
            sw.classList.add('is-on');
            sw.dataset.on = '1';
            sw.classList.remove('just-toggled');
            void sw.offsetWidth;
            sw.classList.add('just-toggled');
            setTimeout(() => sw.classList.remove('just-toggled'), 600);
          }
        } else if (other.classList.contains('is-active')) {
          other.classList.remove('is-active');
          other.setAttribute('aria-checked', 'false');
          if (sw) {
            sw.classList.remove('is-on');
            sw.dataset.on = '0';
            sw.classList.remove('just-toggled-off');
            void sw.offsetWidth;
            sw.classList.add('just-toggled-off');
            setTimeout(() => sw.classList.remove('just-toggled-off'), 360);
          }
        }
      });
      if (imageModelLabel) imageModelLabel.textContent = nextLabel;
      if (prevLabel !== nextLabel) triggerChatEnergyBurst();
    }
    imageModelMenu.querySelectorAll('.image-model-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        selectImageModel(item);
      });
    });

    /* Show / hide the pill — called by the edit-mode controller.
       Toggles the image-model wrap PLUS the sibling aspect + count
       wraps so all three edit-mode pills slide in together (with the
       stagger handled in CSS). */
    function toggleEditPills(active) {
      [
        imageModelWrap,
        document.getElementById('imageAspectSelectorWrap'),
        document.getElementById('imageCountSelectorWrap'),
      ].forEach(el => {
        if (!el) return;
        el.classList.toggle('is-active', active);
        el.setAttribute('aria-hidden', String(!active));
      });
      /* Chat-model wrap collapses out when edit mode is active —
         the image-model pill takes its slot so the composer
         routes prompts to the image model instead of the chat
         model. Same transition timing as the edit-pills slide in
         keeps the swap feeling like a single coordinated motion. */
      const chatModelWrap = document.getElementById('modelSelectorWrap');
      if (chatModelWrap) {
        chatModelWrap.classList.toggle('is-edit-hidden', active);
      }
    }
    window._c4ShowImageModelPill = function () {
      toggleEditPills(true);
      /* Light up the aux panel and auto-expand it so the user lands
         straight into the generation controls. */
      if (typeof window._c4ActivateAuxPanel === 'function') {
        window._c4ActivateAuxPanel();
      }
    };
    window._c4HideImageModelPill = function () {
      toggleEditPills(false);
      setImageModelMenuOpen(false);
      /* Collapse + deactivate the aux panel alongside the pill
         slide-out so the chat returns to its non-edit state. */
      if (typeof window._c4DeactivateAuxPanel === 'function') {
        window._c4DeactivateAuxPanel();
      }
      /* Close the sibling menus too in case they were open. */
      const am = document.getElementById('imageAspectMenu');
      const cm = document.getElementById('imageCountMenu');
      const ab = document.getElementById('imageAspectBtn');
      const cb = document.getElementById('imageCountBtn');
      if (am) { am.classList.remove('open'); am.setAttribute('aria-hidden', 'true'); }
      if (ab) ab.setAttribute('aria-expanded', 'false');
      if (cm) { cm.classList.remove('open'); cm.setAttribute('aria-hidden', 'true'); }
      if (cb) cb.setAttribute('aria-expanded', 'false');
    };
  }

  /* --- Image aspect-ratio selector ---
     Same dropdown choreography as the image-model selector. Single-
     select via dip-switches. The pill button label shows just the
     ratio token (e.g., "1:1") so the pill stays compact. */
  const imageAspectWrap  = document.getElementById('imageAspectSelectorWrap');
  const imageAspectBtn   = document.getElementById('imageAspectBtn');
  const imageAspectMenu  = document.getElementById('imageAspectMenu');
  const imageAspectLabel = document.getElementById('imageAspectLabel');
  if (imageAspectWrap && imageAspectBtn && imageAspectMenu) {
    function positionImageAspectMenu() {
      /* position:fixed escape — anchor menu above the button,
         centered horizontally. Same clamping as the image-model
         menu so it never paints past the viewport edge. */
      const btnRect = imageAspectBtn.getBoundingClientRect();
      const menuW = imageAspectMenu.offsetWidth || 240;
      const menuH = imageAspectMenu.offsetHeight || 200;
      let left = btnRect.left + btnRect.width / 2 - menuW / 2;
      let top  = btnRect.top - menuH - 8;
      const vw = window.innerWidth, vh = window.innerHeight;
      if (left < 8) left = 8;
      if (left + menuW > vw - 8) left = vw - menuW - 8;
      if (top < 8) top = 8;
      if (top + menuH > vh - 8) top = vh - menuH - 8;
      imageAspectMenu.style.left = left + 'px';
      imageAspectMenu.style.top  = top  + 'px';
    }
    function setImageAspectMenuOpen(open) {
      if (open) {
        window._closeOtherChatMenus('imageAspectMenu');
        imageAspectMenu.classList.add('open');
        positionImageAspectMenu();
      } else {
        imageAspectMenu.classList.remove('open');
      }
      imageAspectBtn.setAttribute('aria-expanded', String(open));
      imageAspectMenu.setAttribute('aria-hidden', String(!open));
    }
    window.addEventListener('resize', () => {
      if (imageAspectMenu.classList.contains('open')) positionImageAspectMenu();
    });
    imageAspectBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      setImageAspectMenuOpen(!imageAspectMenu.classList.contains('open'));
    });
    document.addEventListener('click', (e) => {
      if (!imageAspectMenu.classList.contains('open')) return;
      if (imageAspectBtn.contains(e.target) || imageAspectMenu.contains(e.target)) return;
      setImageAspectMenuOpen(false);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && imageAspectMenu.classList.contains('open')) {
        setImageAspectMenuOpen(false);
        imageAspectBtn.focus();
      }
    });
    function selectAspect(item) {
      const items = imageAspectMenu.querySelectorAll('.image-aspect-item');
      const nextRatio = item.dataset.aspect;
      items.forEach(other => {
        const sw = other.querySelector('.dip-switch');
        if (other === item) {
          if (other.classList.contains('is-active')) return;
          other.classList.add('is-active');
          other.setAttribute('aria-checked', 'true');
          if (sw) {
            sw.classList.add('is-on');
            sw.dataset.on = '1';
            sw.classList.remove('just-toggled');
            void sw.offsetWidth;
            sw.classList.add('just-toggled');
            setTimeout(() => sw.classList.remove('just-toggled'), 600);
          }
        } else if (other.classList.contains('is-active')) {
          other.classList.remove('is-active');
          other.setAttribute('aria-checked', 'false');
          if (sw) {
            sw.classList.remove('is-on');
            sw.dataset.on = '0';
            sw.classList.remove('just-toggled-off');
            void sw.offsetWidth;
            sw.classList.add('just-toggled-off');
            setTimeout(() => sw.classList.remove('just-toggled-off'), 360);
          }
        }
      });
      if (imageAspectLabel) imageAspectLabel.textContent = nextRatio;
    }
    imageAspectMenu.querySelectorAll('.image-aspect-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        selectAspect(item);
      });
    });
  }

  /* --- Image count selector ---
     1-5 options. Each row shows a stack-icon visualizing the count
     (1 rect → 2 rects → 3 → 2x2 → 3+2). Dip-switch toggle, single-
     select. Pill button shows just the number. */
  const imageCountWrap  = document.getElementById('imageCountSelectorWrap');
  const imageCountBtn   = document.getElementById('imageCountBtn');
  const imageCountMenu  = document.getElementById('imageCountMenu');
  const imageCountLabel = document.getElementById('imageCountLabel');
  if (imageCountWrap && imageCountBtn && imageCountMenu) {
    function positionImageCountMenu() {
      const btnRect = imageCountBtn.getBoundingClientRect();
      const menuW = imageCountMenu.offsetWidth || 220;
      const menuH = imageCountMenu.offsetHeight || 200;
      let left = btnRect.left + btnRect.width / 2 - menuW / 2;
      let top  = btnRect.top - menuH - 8;
      const vw = window.innerWidth, vh = window.innerHeight;
      if (left < 8) left = 8;
      if (left + menuW > vw - 8) left = vw - menuW - 8;
      if (top < 8) top = 8;
      if (top + menuH > vh - 8) top = vh - menuH - 8;
      imageCountMenu.style.left = left + 'px';
      imageCountMenu.style.top  = top  + 'px';
    }
    function setImageCountMenuOpen(open) {
      if (open) {
        window._closeOtherChatMenus('imageCountMenu');
        imageCountMenu.classList.add('open');
        positionImageCountMenu();
      } else {
        imageCountMenu.classList.remove('open');
      }
      imageCountBtn.setAttribute('aria-expanded', String(open));
      imageCountMenu.setAttribute('aria-hidden', String(!open));
    }
    window.addEventListener('resize', () => {
      if (imageCountMenu.classList.contains('open')) positionImageCountMenu();
    });
    imageCountBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      setImageCountMenuOpen(!imageCountMenu.classList.contains('open'));
    });
    document.addEventListener('click', (e) => {
      if (!imageCountMenu.classList.contains('open')) return;
      if (imageCountBtn.contains(e.target) || imageCountMenu.contains(e.target)) return;
      setImageCountMenuOpen(false);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && imageCountMenu.classList.contains('open')) {
        setImageCountMenuOpen(false);
        imageCountBtn.focus();
      }
    });
    function selectCount(item) {
      const items = imageCountMenu.querySelectorAll('.image-count-item');
      const nextCount = item.dataset.count;
      items.forEach(other => {
        const sw = other.querySelector('.dip-switch');
        if (other === item) {
          if (other.classList.contains('is-active')) return;
          other.classList.add('is-active');
          other.setAttribute('aria-checked', 'true');
          if (sw) {
            sw.classList.add('is-on');
            sw.dataset.on = '1';
            sw.classList.remove('just-toggled');
            void sw.offsetWidth;
            sw.classList.add('just-toggled');
            setTimeout(() => sw.classList.remove('just-toggled'), 600);
          }
        } else if (other.classList.contains('is-active')) {
          other.classList.remove('is-active');
          other.setAttribute('aria-checked', 'false');
          if (sw) {
            sw.classList.remove('is-on');
            sw.dataset.on = '0';
            sw.classList.remove('just-toggled-off');
            void sw.offsetWidth;
            sw.classList.add('just-toggled-off');
            setTimeout(() => sw.classList.remove('just-toggled-off'), 360);
          }
        }
      });
      if (imageCountLabel) imageCountLabel.textContent = nextCount;
    }
    imageCountMenu.querySelectorAll('.image-count-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        selectCount(item);
      });
    });
  }

  /* --- Chat aux panel ---
     Secondary panel above the composer. Relocates the aspect +
     count wraps into its body on init so the same DOM nodes (and
     all existing event handlers) work in their new home. Outside
     edit mode the panel sits collapsed and inert. On edit-mode
     enter the panel becomes interactive + auto-expands; clicking
     the caret toggles it freely thereafter. */
  const chatAuxPanel = document.getElementById('chatAuxPanel');
  const chatAuxBodyInner = document.getElementById('chatAuxBodyInner');
  if (chatAuxPanel && chatAuxBodyInner) {
    const chatAuxToggle = chatAuxPanel.querySelector('.chat-aux-toggle');
    const chatAuxHead = chatAuxPanel.querySelector('.chat-aux-head');
    const aspectWrapNode = document.getElementById('imageAspectSelectorWrap');
    const countWrapNode  = document.getElementById('imageCountSelectorWrap');
    /* Relocate — appendChild on an existing node just moves it, no
       clone, so event listeners attached to its children stay
       wired. The wraps' .is-active toggling by the existing edit
       helpers is harmless here (CSS overrides neutralize it). */
    if (aspectWrapNode) chatAuxBodyInner.appendChild(aspectWrapNode);
    if (countWrapNode)  chatAuxBodyInner.appendChild(countWrapNode);

    /* Hoist the position:fixed menus to <body> so they live outside
       the chat panel's stacking context (z-index:1 on .chat caps
       descendant layers regardless of their own z-index). At body
       level, z-index:9999 truly overlays every other surface in
       the app. Listeners are bound by ID so the relocation
       doesn't break click/keyboard wiring. */
    ['imageAspectMenu', 'imageCountMenu', 'imageModelMenu'].forEach(id => {
      const m = document.getElementById(id);
      if (m && m.parentElement !== document.body) {
        document.body.appendChild(m);
      }
    });

    let auxFullyOpenTimer = null;
    function setChatAuxExpanded(expanded) {
      chatAuxPanel.classList.toggle('is-expanded', expanded);
      if (chatAuxToggle) chatAuxToggle.setAttribute('aria-expanded', String(expanded));
      if (auxFullyOpenTimer) clearTimeout(auxFullyOpenTimer);
      if (expanded) {
        /* Wait for the max-height transition to finish, then bump
           overflow to visible so any pill dropdowns can paint past
           the body's clip rect. */
        auxFullyOpenTimer = setTimeout(() => {
          chatAuxPanel.classList.add('is-fully-open');
        }, 380);
      } else {
        chatAuxPanel.classList.remove('is-fully-open');
      }
    }
    if (chatAuxHead) {
      chatAuxHead.addEventListener('click', () => {
        setChatAuxExpanded(!chatAuxPanel.classList.contains('is-expanded'));
      });
    }
    /* Title swap helper — different wording in edit mode vs. the
       default chat-hat state. Cached titles so we don't re-write
       on every toggle. */
    const chatAuxTitleEl = chatAuxPanel.querySelector('.chat-aux-title');
    const CHAT_AUX_TITLE_DEFAULT = 'What would you like to create?';
    const CHAT_AUX_TITLE_EDIT = 'Edit image settings';
    function setChatAuxTitle(editMode) {
      if (!chatAuxTitleEl) return;
      chatAuxTitleEl.textContent = editMode ? CHAT_AUX_TITLE_EDIT : CHAT_AUX_TITLE_DEFAULT;
    }
    /* Lifecycle hooks fired from edit-mode enter/exit. */
    window._c4ActivateAuxPanel = function () {
      chatAuxPanel.classList.add('is-edit-active');
      setChatAuxTitle(true);
      setChatAuxExpanded(true);
    };
    window._c4DeactivateAuxPanel = function () {
      setChatAuxExpanded(false);
      chatAuxPanel.classList.remove('is-edit-active');
      setChatAuxTitle(false);
    };
  }

  /* --- Edit-mode chat greeting ---
     When image edit mode opens, inject a bot message into the
     existing chat-stream announcing the new context. Removes any
     prior greeting so re-entering doesn't stack duplicates. The
     stream auto-scrolls to keep the message visible. */
  window._c4InjectEditGreeting = function (promptText) {
    const stream = document.getElementById('chatStream');
    if (!stream) return;
    stream.querySelectorAll('.c4-edit-greeting').forEach(n => n.remove());
    const now = new Date();
    const hh = now.getHours();
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ampm = hh >= 12 ? 'PM' : 'AM';
    const h12 = ((hh + 11) % 12) + 1;
    const timeStr = 'Today, ' + h12 + ':' + mm + ' ' + ampm;
    const msg = document.createElement('div');
    msg.className = 'msg bot c4-edit-greeting';
    const teaser = promptText
      ? ' Working on “' + promptText.slice(0, 60) + (promptText.length > 60 ? '…' : '') + '”.'
      : '';
    msg.innerHTML =
      '<div class="msg-head">' +
        '<div class="msg-avatar av-corv">⌬</div>' +
        '<div class="msg-meta">' +
          '<span class="msg-name">Acme</span>' +
          '<span class="msg-dot"></span>' +
          '<span class="msg-time">' + timeStr + '</span>' +
        '</div>' +
      '</div>' +
      '<div class="body">You’re now editing this image.' + teaser +
        ' Drop pins on areas you want to change, or just describe the edit and I’ll generate the next revision.</div>';
    stream.appendChild(msg);
    /* Scroll to the new message — rAF lets layout settle first. */
    requestAnimationFrame(() => {
      _autoScrollToBottom();
    });
  };

