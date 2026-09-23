    /* ═══ FILES PANE — the Text/Canvas sibling of the gallery picker,
       behind the composer's "Choose ad copy from your files".

       Deliberately NOT a modal: it takes the same canvas-pane bounds
       the gallery overlay does (applyEnvPaneBounds' own measurement,
       repeated here against this element) and wears the same
       .pt-env-* chrome, so the two pickers are one surface with two
       bodies. The body is gateway-concourse's file-row list rather
       than a mosaic — icon tile, name, kind, date modified — and the
       search field filters across name and kind exactly as the
       gallery's does across its frames. ═══ */
    const FILES_ITEMS = [
      { id: 'f-headlines',   name: 'Coast Road — Headlines v4',        kind: 'text',   date: 'Sep 01, 2026' },
      { id: 'f-longcopy',    name: 'Corvache GT — Long Copy Master',   kind: 'text',   date: 'Aug 26, 2026' },
      { id: 'f-legal',       name: 'Corvache GT — Legal Disclaimers',  kind: 'text',   date: 'Aug 24, 2026' },
      { id: 'f-tov',         name: 'Corvache 2026 — Tone of Voice',    kind: 'text',   date: 'Aug 19, 2026' },
      { id: 'f-captions',    name: 'Golden Hour — Social Captions',    kind: 'text',   date: 'Aug 11, 2026' },
      { id: 'f-lease-copy',  name: 'Q3 Lease Offer — Approved Copy',   kind: 'text',   date: 'Jul 30, 2026' },
      { id: 'f-ev-lines',    name: 'EV Shoppers — Winning Lines',      kind: 'text',   date: 'Jul 19, 2026' },
      { id: 'f-coop',        name: 'Dealer Co-Op — Boilerplate Copy',  kind: 'text',   date: 'Jul 12, 2026' },
      { id: 'c-coastroad',   name: 'Coast Road — Concept Sheet',       kind: 'canvas', date: 'Sep 02, 2026' },
      { id: 'c-gtlaunch',    name: 'Corvache GT Launch — Working',     kind: 'canvas', date: 'Aug 29, 2026' },
      { id: 'c-brandrefresh',name: 'Q4 Brand Refresh — Working',       kind: 'canvas', date: 'Aug 21, 2026' },
      { id: 'c-goldenhour',  name: 'Golden Hour — Social Cutdowns',    kind: 'canvas', date: 'Aug 12, 2026' },
      { id: 'c-lease',       name: 'Q3 Lease Campaign',                kind: 'canvas', date: 'Jul 29, 2026' },
      { id: 'c-evregion',    name: 'SE Region EV Shoppers',            kind: 'canvas', date: 'Jul 21, 2026' }
    ];
    /* The same two glyphs the topnav's own Text and Canvas tabs use —
       gateway-concourse's NAV_SVG.text / NAV_SVG.canvas. */
    const FILES_GLYPH = {
      text: '<svg width="11.5" height="13" viewBox="0 0 7 8" fill="none"><path d="M0 2H1V1H2.626L1.34 7H0V8H4V7H2.874L4.16 1H6V2H7V0H0V2Z" fill="currentColor"/></svg>',
      canvas: '<svg width="16" height="16" viewBox="0 0 256 256" fill="none"><rect x="32" y="48" width="192" height="160" rx="14" fill="none" stroke="currentColor" stroke-width="20"/><rect x="38" y="100" width="180" height="16" fill="currentColor"/><rect x="100" y="114" width="16" height="88" fill="currentColor"/></svg>'
    };
    const FILES_KIND_LABEL = { text: 'Text', canvas: 'Canvas' };
    const FILES_BADGE = {
      text: { cls: 'ca-badge-doc', label: 'TEXT' },
      canvas: { cls: 'ca-badge-canvas', label: 'CNVS' }
    };
    const FILES_CHECK = '<svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2.5 6.2 4.8 8.5 9.5 3.8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';

    let filesOverlayEl = null;
    let filesPicked = [];
    let filesResolve = null;
    let filesQuery = '';
    let filesSearchInputEl = null;
    let filesExitSearchFn = null;

    function applyFilesPaneBounds() {
      const canvas = document.getElementById('canvas');
      if (!canvas || !filesOverlayEl) return;
      const rect = canvas.getBoundingClientRect();
      filesOverlayEl.style.top = rect.top + 'px';
      filesOverlayEl.style.left = rect.left + 'px';
      filesOverlayEl.style.width = rect.width + 'px';
      filesOverlayEl.style.height = rect.height + 'px';
    }
    window.addEventListener('resize', () => {
      if (filesOverlayEl && filesOverlayEl.classList.contains('is-open')) applyFilesPaneBounds();
    });
    /* Escape: collapse the search field if that is where focus is,
       otherwise close the pane. Capture phase for the same reason the
       gallery's own handler uses it — it must preempt the shell's
       global Escape. */
    function onFilesOverlayKeydown(e) {
      if (e.key !== 'Escape') return;
      if (filesSearchInputEl && document.activeElement === filesSearchInputEl) {
        e.preventDefault();
        e.stopPropagation();
        if (filesExitSearchFn) filesExitSearchFn();
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      closeFilesOverlay();
    }

    function filesMatching() {
      const q = filesQuery.trim().toLowerCase();
      if (!q) return FILES_ITEMS;
      return FILES_ITEMS.filter(f =>
        f.name.toLowerCase().indexOf(q) !== -1 ||
        FILES_KIND_LABEL[f.kind].toLowerCase().indexOf(q) !== -1);
    }
    function renderFilesRows() {
      const listEl = filesOverlayEl.querySelector('#ptFilesList');
      const headCountEl = filesOverlayEl.querySelector('#ptFilesHeadCount');
      const list = filesMatching();
      listEl.innerHTML = list.length
        ? list.map(f =>
            '<button class="ptf-row' + (filesPicked.indexOf(f.id) !== -1 ? ' is-picked' : '') + '" type="button" role="option"' +
              ' aria-selected="' + (filesPicked.indexOf(f.id) !== -1) + '" data-file-id="' + f.id + '">' +
              '<span class="ptf-name">' +
                '<span class="ptf-tile" aria-hidden="true">' + FILES_GLYPH[f.kind] + '</span>' +
                '<span class="ptf-nm">' + escape(f.name) + '</span>' +
              '</span>' +
              '<span class="ptf-kind">' + FILES_KIND_LABEL[f.kind] + '</span>' +
              '<span class="ptf-date">' + escape(f.date) + '</span>' +
              '<span class="ptf-check" aria-hidden="true">' + FILES_CHECK + '</span>' +
            '</button>').join('')
        : '<p class="ptf-empty">No matches for <strong>"' + escape(filesQuery) + '"</strong></p>';
      if (headCountEl) {
        headCountEl.textContent = filesQuery
          ? (list.length + ' of ' + FILES_ITEMS.length)
          : (FILES_ITEMS.length + ' items');
      }
    }
    function syncFilesFoot() {
      const countEl = filesOverlayEl.querySelector('#ptFilesCount');
      const confirmBtn = filesOverlayEl.querySelector('#ptFilesConfirmBtn');
      countEl.textContent = filesPicked.length + ' selected';
      confirmBtn.disabled = filesPicked.length === 0;
    }

    function buildFilesOverlay() {
      const overlay = document.createElement('div');
      overlay.className = 'pt-env-overlay';
      overlay.id = 'ptFilesOverlay';
      overlay.setAttribute('aria-hidden', 'true');
      overlay.innerHTML =
        '<div class="pt-env-head">' +
          '<button class="pt-editor-back" type="button" id="ptFilesBackBtn" aria-label="Back">' +
            '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M5 12l6-6M5 12l6 6"/></svg>' +
            'Back' +
          '</button>' +
          '<div class="pt-env-title-wrap">' +
            '<h2 class="pt-env-title">Your Files</h2>' +
            '<span class="pt-env-count-tag" id="ptFilesHeadCount">' + FILES_ITEMS.length + ' items</span>' +
          '</div>' +
          '<div class="pt-env-toolbar-right">' +
            '<div class="pt-env-search-wrap collapsed" id="ptFilesSearchWrap">' +
              '<button class="pt-env-search-icon-btn" type="button" id="ptFilesSearchBtn" aria-label="Open search" aria-expanded="false">' + ICONS.magnifyingGlass + '</button>' +
              '<input class="pt-env-search" type="search" id="ptFilesSearchInput" placeholder="Search files…" aria-label="Search files">' +
              '<button class="pt-env-search-close" type="button" id="ptFilesSearchClose" aria-label="Close search" tabindex="-1">' + ICONS.x + '</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<p class="pt-env-sub">Text &amp; canvas files — pick any number.</p>' +
        '<div class="pt-env-body">' +
          '<div class="ptf-head" aria-hidden="true">' +
            '<span class="ptf-th">Name</span>' +
            '<span class="ptf-th ptf-th-kind">Type</span>' +
            '<span class="ptf-th ptf-th-date">Date modified</span>' +
          '</div>' +
          '<div class="ptf-list" id="ptFilesList" role="listbox" aria-multiselectable="true" aria-label="Text and canvas files"></div>' +
        '</div>' +
        '<div class="pt-env-foot">' +
          '<span class="pt-env-count" id="ptFilesCount">0 selected</span>' +
          '<div class="pt-env-foot-actions">' +
            '<button class="share-btn pt-env-confirm" id="ptFilesConfirmBtn" type="button" disabled><span>Attach these files</span></button>' +
            '<button class="pt-env-clear" id="ptFilesClearBtn" type="button">Clear</button>' +
          '</div>' +
        '</div>';
      document.body.appendChild(overlay);
      filesOverlayEl = overlay;

      const listEl = overlay.querySelector('#ptFilesList');
      listEl.addEventListener('click', (e) => {
        const row = e.target.closest('.ptf-row');
        if (!row) return;
        const id = row.getAttribute('data-file-id');
        const at = filesPicked.indexOf(id);
        if (at === -1) filesPicked.push(id); else filesPicked.splice(at, 1);
        const picked = at === -1;
        row.classList.toggle('is-picked', picked);
        row.setAttribute('aria-selected', String(picked));
        syncFilesFoot();
      });

      overlay.querySelector('#ptFilesBackBtn').addEventListener('click', closeFilesOverlay);
      overlay.querySelector('#ptFilesClearBtn').addEventListener('click', () => {
        filesPicked = [];
        renderFilesRows();
        syncFilesFoot();
      });
      overlay.querySelector('#ptFilesConfirmBtn').addEventListener('click', () => {
        if (!filesPicked.length) return;
        const chosen = FILES_ITEMS.filter(f => filesPicked.indexOf(f.id) !== -1)
          .map(f => ({ name: f.name, kind: f.kind, badge: FILES_BADGE[f.kind] }));
        const cb = filesResolve;
        filesResolve = null;
        closeFilesOverlay();
        if (cb) cb(chosen);
      });

      /* Search — same collapse/expand contract as the gallery's field
         (the .collapsed class on the wrap is what the shared CSS
         animates), filtering rows instead of frames. */
      const searchWrap = overlay.querySelector('#ptFilesSearchWrap');
      const searchBtn = overlay.querySelector('#ptFilesSearchBtn');
      const searchInput = overlay.querySelector('#ptFilesSearchInput');
      const searchClose = overlay.querySelector('#ptFilesSearchClose');
      function expandSearch() {
        if (!searchWrap.classList.contains('collapsed')) return;
        searchWrap.classList.remove('collapsed');
        searchBtn.setAttribute('aria-expanded', 'true');
        requestAnimationFrame(() => searchInput.focus());
      }
      function collapseSearch() {
        searchWrap.classList.add('collapsed');
        searchBtn.setAttribute('aria-expanded', 'false');
      }
      function exitSearch() {
        searchInput.value = '';
        filesQuery = '';
        renderFilesRows();
        searchInput.blur();
        collapseSearch();
      }
      filesSearchInputEl = searchInput;
      filesExitSearchFn = exitSearch;
      searchWrap.addEventListener('click', (e) => {
        if (searchWrap.classList.contains('collapsed')) { e.stopPropagation(); expandSearch(); }
      });
      searchBtn.addEventListener('click', expandSearch);
      searchInput.addEventListener('input', (e) => { filesQuery = e.target.value; renderFilesRows(); });
      searchInput.addEventListener('keydown', (e) => { if (e.key === 'Escape') e.stopPropagation(); });
      searchInput.addEventListener('blur', () => {
        setTimeout(() => {
          if (document.activeElement === searchClose) return;
          if (!searchInput.value.trim()) collapseSearch();
        }, 0);
      });
      searchClose.addEventListener('mousedown', (e) => { e.preventDefault(); e.stopPropagation(); });
      searchClose.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); exitSearch(); });
    }

    function closeFilesOverlay() {
      if (!filesOverlayEl) return;
      filesOverlayEl.classList.add('is-leaving');
      filesOverlayEl.classList.remove('is-open');
      filesOverlayEl.setAttribute('aria-hidden', 'true');
      document.removeEventListener('keydown', onFilesOverlayKeydown, true);
      filesResolve = null; /* a dismissed picker resolves nothing */
      const dur = envReducedMotion() ? 0 : 260;
      setTimeout(() => { if (filesOverlayEl) filesOverlayEl.classList.remove('is-leaving'); }, dur);
    }

    window._ptOpenFilesPicker = function (onConfirm) {
      if (!filesOverlayEl) buildFilesOverlay();
      filesResolve = onConfirm;
      filesPicked = [];
      filesQuery = '';
      if (filesSearchInputEl) filesSearchInputEl.value = '';
      const wrap = filesOverlayEl.querySelector('#ptFilesSearchWrap');
      if (wrap) wrap.classList.add('collapsed');
      renderFilesRows();
      syncFilesFoot();
      applyFilesPaneBounds();
      filesOverlayEl.classList.remove('is-leaving');
      filesOverlayEl.setAttribute('aria-hidden', 'false');
      requestAnimationFrame(() => filesOverlayEl.classList.add('is-open'));
      document.addEventListener('keydown', onFilesOverlayKeydown, true);
    };

    function closeEnvOverlay() {
      if (!envOverlayEl) return;
      envOverlayEl.classList.add('is-leaving');
      envOverlayEl.classList.remove('is-open');
      envOverlayEl.setAttribute('aria-hidden', 'true');
      document.removeEventListener('keydown', onEnvOverlayKeydown, true);
      const dur = envReducedMotion() ? 0 : 260;
      setTimeout(() => { if (envOverlayEl) envOverlayEl.classList.remove('is-leaving'); }, dur);
    }

    // ═══ P8 — copy-field-row engine. One "model" shape —
    //     { headline, cta, subhead, body, disclaimer, custom: [...],
    //     order: [...] } — mounted by mountCopyRowsList() into a
    //     rows container. Guided's "I have copy" panel builds a
    //     throwaway model; Studio's Text drawer passes editorState
    //     itself (same shape, see blankEditorState) so the exact same
    //     functions run both surfaces — one component, two homes. ═══
    function copyRowUid(type, idx) { return type === 'custom' ? 'custom' + idx : type; }
    function copyModelUsedTypes(model) { return model.order.slice(); }
    function copyModelRowList(model) {
      const rows = model.order.map((t) => ({ type: t, idx: null }));
      model.custom.forEach((v, i) => rows.push({ type: 'custom', idx: i }));
      return rows;
    }
    function copyRowValue(model, type, idx) {
      if (type === 'custom') return model.custom[idx] || '';
      return model[type] || '';
    }
    function copyModelSetValue(model, type, idx, val) {
      if (type === 'custom') model.custom[idx] = val; else model[type] = val;
    }
    function copyModelRemoveRow(model, type, idx) {
      if (type === 'custom') { model.custom.splice(idx, 1); return; }
      const i = model.order.indexOf(type);
      if (i !== -1) model.order.splice(i, 1);
      model[type] = '';
    }
    // "+ Add text" — next unused type in the fixed sequence, else an
    // unlimited extra Custom row.
    function copyModelAddNext(model) {
      for (let i = 0; i < COPY_ADD_SEQUENCE.length; i++) {
        const t = COPY_ADD_SEQUENCE[i];
        if (model.order.indexOf(t) === -1) { model.order.push(t); model[t] = model[t] || ''; return { type: t, idx: null }; }
      }
      model.custom.push('');
      return { type: 'custom', idx: model.custom.length - 1 };
    }
    function copyModelChangeType(model, oldType, oldIdx, newType) {
      if (newType === oldType) return null;
      if (newType !== 'custom' && model.order.indexOf(newType) !== -1) return null; // combo already disables this
      const val = copyRowValue(model, oldType, oldIdx);
      copyModelRemoveRow(model, oldType, oldIdx);
      if (newType === 'custom') { model.custom.push(val); return { type: 'custom', idx: model.custom.length - 1 }; }
      model.order.push(newType);
      model[newType] = val;
      return { type: newType, idx: null };
    }
    function copyModelToPairFields(model) {
      const pair = {
        headline: (model.headline || '').trim().toUpperCase() || COPY_PAIRS[0].headline,
        cta: (model.cta || '').trim() || 'Learn more'
      };
      if (model.subhead && model.subhead.trim()) pair.subhead = model.subhead.trim();
      if (model.body && model.body.trim()) pair.body = model.body.trim();
      if (model.disclaimer && model.disclaimer.trim()) pair.disclaimer = model.disclaimer.trim();
      const customVals = model.custom.filter((v) => v && v.trim());
      if (customVals.length) pair.custom = customVals;
      return pair;
    }

    function copyFieldTypeOptionsHTML(model, currentType, query) {
      const q = (query || '').trim().toLowerCase();
      const used = copyModelUsedTypes(model);
      const items = COPY_FIELD_TYPES.filter((t) => !q || t.label.toLowerCase().indexOf(q) !== -1);
      if (!items.length) return '<div class="pt-font-combo-empty">No match</div>';
      return items.map((t) => {
        const isDisabled = t.id !== 'custom' && t.id !== currentType && used.indexOf(t.id) !== -1;
        return '<button type="button" class="pt-font-combo-item pt-copy-type-item' + (t.id === currentType ? ' is-active' : '') + (isDisabled ? ' is-disabled' : '') + '" data-type="' + t.id + '"' + (isDisabled ? ' disabled' : '') + ' role="option" aria-selected="' + (t.id === currentType) + '">' +
          '<span class="pt-font-combo-item-face">' + escape(t.label) + '</span>' +
          '<span class="pt-font-combo-item-check">' + ICONS.check + '</span>' +
        '</button>';
      }).join('');
    }
    function copyFieldTypeComboHTML(uid, model, type) {
      return (
        '<div class="pt-font-combo pt-copy-field-type" id="ptCopyType-' + uid + '">' +
          '<button class="pt-font-combo-btn pt-copy-field-type-btn" type="button" aria-haspopup="listbox" aria-expanded="false">' +
            '<span class="pt-font-combo-btn-label">' + escape(COPY_FIELD_LABEL[type]) + '</span>' +
            '<span class="pt-font-combo-caret">' + ICONS.caretDown + '</span>' +
          '</button>' +
          '<div class="pt-font-combo-menu pt-copy-type-menu" role="listbox" aria-label="Field type">' +
            '<input type="text" class="pt-font-combo-search" placeholder="Search…" autocomplete="off">' +
            '<div class="pt-copy-type-list">' + copyFieldTypeOptionsHTML(model, type, '') + '</div>' +
          '</div>' +
        '</div>'
      );
    }
    function copyFieldRowHTML(model, type, idx, extraHTML, quiet) {
      const uid = copyRowUid(type, idx);
      const val = copyRowValue(model, type, idx);
      const isBody = type === 'body';
      const fieldAttrs = 'data-field-type="' + type + '"' + (type === 'custom' ? ' data-field-idx="' + idx + '"' : '');
      const inputHTML = isBody
        ? '<textarea class="pt-copy-input pt-copy-input-body" rows="3" placeholder="' + COPY_FIELD_PLACEHOLDER.body + '" ' + fieldAttrs + '>' + escape(val) + '</textarea>'
        : '<input type="text" class="pt-copy-input" placeholder="' + COPY_FIELD_PLACEHOLDER[type] + '" value="' + escape(val) + '" ' + fieldAttrs + '>';
      // P10 — Studio's Text drawer passes quiet:true so the field-type
      // control renders as a bare text-button (no box) with the row's
      // × visible only on hover; the Guided "I have copy" panel omits
      // it and keeps the original boxed combo untouched.
      return (
        '<div class="pt-copy-field-row-wrap" data-row-uid="' + uid + '">' +
          '<div class="pt-copy-field-row" data-row-type="' + type + '"' + (type === 'custom' ? ' data-row-idx="' + idx + '"' : '') + '>' +
            '<div class="pt-copy-field-row-head' + (quiet ? ' pt-quiet-type' : '') + '">' +
              copyFieldTypeComboHTML(uid, model, type) +
              '<button class="pt-copy-field-remove" type="button" aria-label="Remove field">' + ICONS.x + '</button>' +
            '</div>' +
            '<div class="pt-copy-field-input-wrap">' + inputHTML + '</div>' +
            (extraHTML || '') +
          '</div>' +
        '</div>'
      );
    }
    // hooks: { onValueChange(model), onStructuralChange(model),
    //          onCommit(model), rowExtra(type, idx) -> html,
    //          onRowMounted(wrapEl, type, idx) } — rowExtra/onRowMounted
    //          are how Studio's Text drawer hangs the font combo off
    //          the shared Headline row without the Guided panel (which
    //          has no font picker) knowing anything about it.
    function mountCopyRowsList(listEl, model, hooks) {
      hooks = hooks || {};
      function reduced() { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); }

      function wireRowTypeCombo(wrapEl, type, idx) {
        const uid = copyRowUid(type, idx);
        const combo = wrapEl.querySelector('#ptCopyType-' + uid);
        if (!combo) return;
        const btn = combo.querySelector('.pt-copy-field-type-btn');
        const menu = combo.querySelector('.pt-copy-type-menu');
        const search = combo.querySelector('.pt-font-combo-search');
        const list = combo.querySelector('.pt-copy-type-list');
        function renderList(q) {
          list.innerHTML = copyFieldTypeOptionsHTML(model, type, q);
          Array.prototype.forEach.call(list.querySelectorAll('.pt-copy-type-item'), (item) => {
            item.addEventListener('click', () => {
              if (item.hasAttribute('disabled')) return;
              const newType = item.getAttribute('data-type');
              closeMenu();
              const res = copyModelChangeType(model, type, idx, newType);
              if (res) {
                rebuildAll();
                if (hooks.onStructuralChange) hooks.onStructuralChange(model);
                if (hooks.onCommit) hooks.onCommit(model);
              }
            });
          });
        }
        function openMenu() {
          renderList('');
          menu.classList.add('open');
          btn.setAttribute('aria-expanded', 'true');
          if (search) { search.value = ''; setTimeout(() => search.focus(), 10); }
        }
        function closeMenu() { menu.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); }
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (menu.classList.contains('open')) closeMenu(); else openMenu();
        });
        if (search) search.addEventListener('input', () => renderList(search.value));
      }

      function wireRow(wrapEl) {
        const rowEl = wrapEl.querySelector('.pt-copy-field-row');
        const type = rowEl.getAttribute('data-row-type');
        const idx = rowEl.hasAttribute('data-row-idx') ? parseInt(rowEl.getAttribute('data-row-idx'), 10) : null;
        const input = wrapEl.querySelector('[data-field-type]');
        if (input) {
          const autoGrow = () => { if (input.tagName === 'TEXTAREA') { input.style.height = 'auto'; input.style.height = input.scrollHeight + 'px'; } };
          autoGrow();
          input.addEventListener('input', () => {
            copyModelSetValue(model, type, idx, input.value);
            autoGrow();
            if (hooks.onValueChange) hooks.onValueChange(model);
          });
          input.addEventListener('change', () => { if (hooks.onCommit) hooks.onCommit(model); });
          input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && input.tagName !== 'TEXTAREA') { e.preventDefault(); input.blur(); }
          });
        }
        const removeBtn = wrapEl.querySelector('.pt-copy-field-remove');
        if (removeBtn) removeBtn.addEventListener('click', () => removeRowDOM(wrapEl, type, idx));
        wireRowTypeCombo(wrapEl, type, idx);
        if (hooks.onRowMounted) hooks.onRowMounted(wrapEl, type, idx);
      }

      function removeRowDOM(wrapEl, type, idx) {
        function commit() {
          copyModelRemoveRow(model, type, idx);
          rebuildAll();
          if (hooks.onStructuralChange) hooks.onStructuralChange(model);
          if (hooks.onCommit) hooks.onCommit(model);
        }
        if (reduced()) { commit(); return; }
        wrapEl.classList.add('pt-row-collapsed');
        setTimeout(commit, 190);
      }

      function rebuildAll() {
        listEl.innerHTML = copyModelRowList(model).map((r) =>
          copyFieldRowHTML(model, r.type, r.idx, hooks.rowExtra ? hooks.rowExtra(r.type, r.idx) : '', hooks.quietFieldType)
        ).join('');
        Array.prototype.forEach.call(listEl.querySelectorAll('.pt-copy-field-row-wrap'), wireRow);
      }

      function onDocClick(e) {
        Array.prototype.forEach.call(listEl.querySelectorAll('.pt-copy-type-menu.open'), (menu) => {
          const combo = menu.closest('.pt-copy-field-type');
          if (combo && !combo.contains(e.target)) {
            menu.classList.remove('open');
            const btn = combo.querySelector('.pt-copy-field-type-btn');
            if (btn) btn.setAttribute('aria-expanded', 'false');
          }
        });
      }
      document.addEventListener('click', onDocClick);

      // Appends ONE row for a type/idx the caller has already
      // reflected in the model — shared by "+ Add text" and the
      // deck-read landing beat, so both get the identical row-enter
      // motion.
      function appendRowDOM(type, idx) {
        listEl.insertAdjacentHTML('beforeend', copyFieldRowHTML(model, type, idx, hooks.rowExtra ? hooks.rowExtra(type, idx) : '', hooks.quietFieldType));
        const wrapEl = listEl.lastElementChild;
        wireRow(wrapEl);
        if (!reduced()) {
          wrapEl.classList.add('pt-row-collapsed');
          void wrapEl.offsetHeight;
          requestAnimationFrame(() => wrapEl.classList.remove('pt-row-collapsed'));
        }
        return wrapEl;
      }

      function addRow() {
        const added = copyModelAddNext(model);
        appendRowDOM(added.type, added.idx);
        if (hooks.onStructuralChange) hooks.onStructuralChange(model);
        if (hooks.onCommit) hooks.onCommit(model);
        return added;
      }

      // Pushes model values into already-mounted inputs without a
      // full rebuild (never steals focus, never restarts the row-
      // enter motion on unrelated rows). Skips the focused input by
      // default so live typing elsewhere is never clobbered — pass
      // force:true for a deliberate bulk replace (a landed deck),
      // which should always win even over an idle-focused field
      // (e.g. the headline input auto-focused when the panel opened).
      function syncValues(force) {
        Array.prototype.forEach.call(listEl.querySelectorAll('[data-field-type]'), (input) => {
          if (!force && document.activeElement === input) return;
          const type = input.getAttribute('data-field-type');
          const idx = input.hasAttribute('data-field-idx') ? parseInt(input.getAttribute('data-field-idx'), 10) : null;
          input.value = copyRowValue(model, type, idx);
          if (input.tagName === 'TEXTAREA') { input.style.height = 'auto'; input.style.height = input.scrollHeight + 'px'; }
        });
      }

      rebuildAll();
      return {
        rebuildAll, addRow, appendRowDOM, syncValues,
        destroy: () => document.removeEventListener('click', onDocClick)
      };
    }

    // Lands the deterministic CORVACHE_DECK payload onto a model +
    // its mounted rows list: headline/cta (always-present rows) get
    // their values synced instantly, then Subhead/Body/Disclaimer
    // rows land one at a time with the same row-enter motion "+ Add
    // text" uses (staggered 90ms, matching the sheet's own card
    // stagger convention).
    function landDeckOnRows(model, rowsApi, deck) {
      model.headline = deck.headline;
      model.cta = deck.cta;
      const toAdd = [];
      ['subhead', 'body', 'disclaimer'].forEach((t) => {
        if (model.order.indexOf(t) === -1) { model.order.push(t); toAdd.push(t); }
        model[t] = deck[t];
      });
      rowsApi.syncValues(true); // force — a landed deck always wins, even over an idle-focused input
      const reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
      const STAGGER = reduced ? 0 : 90;
      toAdd.forEach((t, i) => { setTimeout(() => rowsApi.appendRowDOM(t, null), i * STAGGER); });
    }

    // Shared "Upload a copy deck" row-tile markup + staged parse beat
    // (~1.2s "Reading deck…" shimmer, 0 under reduced-motion). One
    // module-level handler slot — set while a copy editor is mounted,
    // cleared on close — lets the shell's REAL paste/drop plumbing
    // (window._ptOnAnyFileAdded, wired from initChatAttachments)
    // feed the SAME deck-read beat as the row-tile's own picker.
    let activeDeckReadHandler = null;
    // chipId (P8 nit, 9/1) — the composer chip this SAME file just
    // landed as (addFile's own id); passed through so the deck-read
    // beat can remove it once the deck lands (see handleFile below).
    window._ptOnAnyFileAdded = function (file, chipId) {
      if (typeof activeDeckReadHandler === 'function') { activeDeckReadHandler(file, chipId); return; }
      // §BR.5 — no Guided copy editor mounted: the hat's NEW MEDIA
      // SETTINGS row (13-editor-studio-a-framing.js) gets the same
      // file next, if its own attach flow is the one currently up
      // (a no-op everywhere else — _ptFlowIntakeFile checks
      // settingsStepMounted itself).
      if (typeof window._ptFlowIntakeFile === 'function') window._ptFlowIntakeFile(file, chipId);
    };
    // AY.2 (was AX.4) — the house dashed tile row (the hat's Add-image
    // tile, the Add-a-size row): a dashed hairline, the upload glyph at
    // left, the label voice, one quiet sans sub — no mono, no middots.
    // Studio's COPY group and the Guided "I have copy" panel share it.
    function copyDeckRowHTML() {
      return (
        '<button class="pt-copy-deck-row" type="button">' +
          '<span class="pt-copy-deck-icon" aria-hidden="true">' + ICONS.fileArrowUp + '</span>' +
          '<span class="pt-copy-deck-text">' +
            '<span class="pt-copy-deck-title">Upload a copy deck</span>' +
            '<span class="pt-copy-deck-sub">docx, pdf, txt or csv — or paste it here</span>' +
          '</span>' +
        '</button>'
      );
    }
    function startDeckRead(rowEl, file, onDone) {
      if (!rowEl || rowEl.classList.contains('is-reading')) return;
      const subEl = rowEl.querySelector('.pt-copy-deck-sub');
      rowEl.classList.add('is-reading');
      if (subEl) subEl.innerHTML = '<span class="pt-copy-deck-shimmer" aria-hidden="true"></span><span>Reading deck…</span>';
      const reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
      setTimeout(() => {
        rowEl.classList.remove('is-reading');
        const fieldCount = Object.keys(CORVACHE_DECK).length;
        const name = (file && file.name) ? file.name : 'copy-deck.docx';
        if (subEl) subEl.innerHTML = '<span class="pt-copy-deck-file-chip">' + escape(name) + ' · ' + fieldCount + ' fields</span>';
        onDone(CORVACHE_DECK);
      }, reduced ? 0 : 1200);
    }
    // Wires the deck row-tile's own real file picker AND registers it
    // as the active paste/drop target for as long as the host editor
    // stays mounted. onLanded (optional) fires once the deck's values
    // are in the model — Studio passes its stage-refresh function so
    // a landed deck shows up live on the banner, not just the drawer.
    // Returns a cleanup function the host calls on close.
    function wireDeckUploadRow(deckRowEl, model, rowsApi, onLanded) {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.docx,.doc,.pdf,.txt,.csv';
      input.style.display = 'none';
      document.body.appendChild(input);
      function handleFile(file, chipId) {
        if (!file) return;
        startDeckRead(deckRowEl, file, (deck) => {
          landDeckOnRows(model, rowsApi, deck);
          // P8 nit (9/1) — a copy deck isn't a chat attachment; once
          // it lands, drop the composer chip it arrived as (paste/
          // drop/picker all funnel through addFile, which always
          // adds one) so the file shows exactly once, on this row.
          if (chipId && typeof window._caRemoveAttachment === 'function') window._caRemoveAttachment(chipId);
          if (onLanded) onLanded();
        });
      }
      input.addEventListener('change', () => {
        const file = input.files && input.files[0];
        if (file && typeof window._caAddFile === 'function') window._caAddFile(file);
        else handleFile(file);
        input.value = '';
      });
      deckRowEl.addEventListener('click', () => input.click());
      activeDeckReadHandler = handleFile;
      return function cleanup() {
        if (activeDeckReadHandler === handleFile) activeDeckReadHandler = null;
        if (input.parentNode) input.parentNode.removeChild(input);
      };
    }

    // ═══ STEP 2 — COPY (P8 redesign) ═══
    function renderCopyStep(container) {
      container.innerHTML =
        '<p class="pt-msg-lede">Now the copy.</p>' +
        '<div class="pt-tiles pt-tiles-copy" data-pt-step="copy">' +
          '<button class="pt-tile" type="button" data-pt-action="write-copy">' +
            '<span class="pt-tile-icon">' + ICONS.feather + '</span>' +
            '<span class="pt-tile-title">Write it for me</span>' +
            '<span class="pt-tile-desc">3 pairs, Corvache voice</span>' +
          '</button>' +
          '<button class="pt-tile" type="button" data-pt-action="own-copy">' +
            '<span class="pt-tile-icon">' + ICONS.chatText + '</span>' +
            '<span class="pt-tile-title">I have copy</span>' +
            '<span class="pt-tile-desc">Headline, body, CTA — your call</span>' +
          '</button>' +
        '</div>' +
        '<div class="pt-copy-input-row">' +
          copyDeckRowHTML() +
          '<div class="pt-copy-rows" id="ptCopyRowsList"></div>' +
          '<button class="pt-copy-addfield-row" type="button" id="ptCopyAddFieldBtn">' + ICONS.plus + '<span>Add text</span></button>' +
          '<div class="pt-copy-editor-footer">' +
            '<button class="share-btn pt-copy-use-btn" type="button" id="ptCopyUseBtn"><span>Use this copy</span></button>' +
            '<button class="pt-copy-skip" type="button" id="ptCopyClearBtn">Clear</button>' +
          '</div>' +
        '</div>';
      const tilesEl = container.querySelector('.pt-tiles-copy');
      const inputRow = container.querySelector('.pt-copy-input-row');
      const rowsListEl = container.querySelector('#ptCopyRowsList');
      const deckRowEl = container.querySelector('.pt-copy-deck-row');
      let copyModel = null;
      let rowsApi = null;
      let deckCleanup = null;

      function freshModel() { return { headline: '', cta: '', subhead: '', body: '', disclaimer: '', custom: [], order: ['headline', 'cta'] }; }

      function mountEditor() {
        copyModel = freshModel();
        rowsApi = mountCopyRowsList(rowsListEl, copyModel, {});
        deckCleanup = wireDeckUploadRow(deckRowEl, copyModel, rowsApi);
        // P8 nit (9/1) — the row-list editor needs a taller hat body
        // cap than the default step content; see the .pt-copy-editor-
        // open rule next to .pt-wizard-active's own max-height above.
        if (auxPanel) auxPanel.classList.add('pt-copy-editor-open');
      }
      function unmountEditor() {
        if (rowsApi) { rowsApi.destroy(); rowsApi = null; }
        if (deckCleanup) { deckCleanup(); deckCleanup = null; }
        if (auxPanel) auxPanel.classList.remove('pt-copy-editor-open');
      }

      tilesEl.querySelector('[data-pt-action="write-copy"]').addEventListener('click', () => {
        tilesEl.classList.add('is-answered');
        tilesEl.querySelector('[data-pt-action="write-copy"]').classList.add('is-picked');
        state.copy = { mode: 'written', pairs: COPY_PAIRS.slice() };
        setTimeout(() => renderHatStep(2), 480);
      });
      tilesEl.querySelector('[data-pt-action="own-copy"]').addEventListener('click', () => {
        tilesEl.classList.add('is-answered');
        tilesEl.querySelector('[data-pt-action="own-copy"]').classList.add('is-picked');
        inputRow.classList.add('is-open');
        mountEditor();
        const firstInput = rowsListEl.querySelector('.pt-copy-input');
        if (firstInput) firstInput.focus();
      });
      container.querySelector('#ptCopyAddFieldBtn').addEventListener('click', () => { if (rowsApi) rowsApi.addRow(); });
      container.querySelector('#ptCopyClearBtn').addEventListener('click', () => {
        if (!copyModel) return;
        unmountEditor();
        mountEditor();
      });
      container.querySelector('#ptCopyUseBtn').addEventListener('click', () => {
        if (!copyModel) return;
        const pair = copyModelToPairFields(copyModel);
        state.copy = { mode: 'own', pairs: [pair] };
        unmountEditor();
        inputRow.classList.remove('is-open');
        setTimeout(() => renderHatStep(2), 480);
      });
    }

    // ═══ STEP 3 — LAYOUT ═══
    function renderLayoutStep(container) {
      container.innerHTML =
        '<p class="pt-msg-lede">Pick a starting layout.</p>' +
        '<div class="pt-layout-grid" data-pt-step="layout">' +
          LAYOUTS.map(l =>
            '<button class="pt-layout-card" type="button" data-pt-layout="' + l.id + '">' +
              '<span class="pt-layout-thumb" data-thumb="' + l.id + '">' +
                '<span class="pt-lt-block pt-lt-img"></span><span class="pt-lt-block pt-lt-text"></span><span class="pt-lt-block pt-lt-cta"></span>' +
              '</span>' +
              '<span class="pt-layout-name">' + l.name + '</span>' +
            '</button>'
          ).join('') +
          '<button class="pt-layout-card pt-layout-card--generate" type="button" data-pt-layout="generate">' +
            '<span class="pt-layout-thumb" data-thumb="generate">' + ICONS.sparkle + '</span>' +
            '<span class="pt-layout-name">Generate a layout</span>' +
          '</button>' +
        '</div>';
      const grid = container.querySelector('.pt-layout-grid');
      Array.prototype.forEach.call(grid.querySelectorAll('.pt-layout-card'), (card) => {
        card.addEventListener('click', () => {
          const id = card.getAttribute('data-pt-layout');
          if (id === 'generate') {
            handleGenerateLayout(grid, card);
          } else {
            grid.classList.add('is-answered');
            card.classList.add('is-picked');
            state.layout = id;
            setTimeout(() => renderHatStep(3), 420);
          }
        });
      });
    }

    function handleGenerateLayout(grid, card) {
      grid.classList.add('is-answered');
      card.classList.add('is-picked');
      const thumb = card.querySelector('.pt-layout-thumb');
      thumb.innerHTML = '';
      thumb.classList.add('is-generating');
      setTimeout(() => {
        thumb.classList.remove('is-generating');
        thumb.setAttribute('data-thumb', 'diagonal');
        thumb.innerHTML = '<span class="pt-lt-block pt-lt-img"></span><span class="pt-lt-block pt-lt-text"></span><span class="pt-lt-block pt-lt-cta"></span>';
        state.layout = 'diagonal';
        setTimeout(() => renderHatStep(3), 420);
      }, 1500);
    }

    // ═══ STEP 4 — BOARD SIZE ═══
    // AO.2 — one board size, not the old multi-check ship-sizes set:
    // the pick writes brief.boardSize via setBoardSize (AJ.0 holds —
    // with a board already on the sheet this sets only the NEXT
    // generation), the same field the Size pill (openSizeSetMenu) and
    // the band's own "Board at" write. Ship sizes move to Package
    // (§AF), same as everywhere else. Radio chips off the Size
    // pill's own roster (SIZES_COMMON/IAB_FLAT): the common five
    // first (300×250 leading), the rest of the IAB roster behind
    // the house "+N more" disclosure (sizeGroupRowsHTML's own idiom,
    // reused verbatim via toggleSizesMore).
    function renderSizesStep(container) {
      const commonItems = SIZES_COMMON.map((id) => IAB_FLAT.filter((it) => it.id === id)[0]).filter(Boolean);
      const restItems = IAB_FLAT.filter((it) => SIZES_COMMON.indexOf(it.id) === -1);
      function chipHTML(it) {
        const on = brief.boardSize === it.id;
        return '<button class="pt-size-chip' + (on ? ' is-checked' : '') + '" type="button" role="radio" aria-checked="' + on + '" data-size="' + it.id + '">' +
            '<span class="pt-set-item-radio" aria-hidden="true"></span>' + it.id.replace('x', '\u00d7') +
          '</button>';
      }
      container.innerHTML =
        '<p class="pt-msg-lede">Which size?</p>' +
        '<div role="radiogroup" aria-label="Board size" data-pt-step="sizes">' +
          '<div class="pt-size-chips">' + commonItems.map(chipHTML).join('') + '</div>' +
          (restItems.length ?
            '<button class="pt-editor-swap-more pt-sizes-more" type="button" aria-expanded="false">' +
              '<span>+ ' + restItems.length + ' more</span>' +
              '<span class="pt-editor-swap-more-caret" aria-hidden="true"><svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 4l3 3 3-3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg></span>' +
            '</button>' +
            '<div class="pt-size-chips" hidden>' + restItems.map(chipHTML).join('') + '</div>'
          : '') +
        '</div>' +
        '<button class="pt-generate-btn" type="button">Generate Concepts</button>';
      const moreBtn = container.querySelector('.pt-sizes-more');
      if (moreBtn) moreBtn.addEventListener('click', () => toggleSizesMore(moreBtn));
      function paintChips() {
        Array.prototype.forEach.call(container.querySelectorAll('.pt-size-chip'), (c) => {
          const on = c.getAttribute('data-size') === brief.boardSize;
          c.classList.toggle('is-checked', on);
          c.setAttribute('aria-checked', String(on));
        });
      }
      Array.prototype.forEach.call(container.querySelectorAll('.pt-size-chip'), (chip) => {
        chip.addEventListener('click', () => {
          const id = chip.getAttribute('data-size');
          if (!id || id === brief.boardSize) return;
          setBoardSize(id, { fromHat: true }); // AJ.0 — with a board up, sets only the next generation
          paintChips();
          syncMediaModeStage(); // the viewfinder reshapes live, same door every pill uses
        });
      });
      const genBtn = container.querySelector('.pt-generate-btn');
      genBtn.addEventListener('click', () => {
        genBtn.disabled = true;
        Array.prototype.forEach.call(container.querySelectorAll('.pt-size-chip'), (c) => { c.disabled = true; });
        state.sizes = [brief.boardSize]; // AO.3 — the same state the pills' Send (_ptMediaSettingsSubmit) feeds runGenerateInHat
        runGenerateInHat(container, brief.concepts);
      });
    }

    const STEP_RENDERERS = [renderImageStep, renderCopyStep, renderLayoutStep, renderSizesStep];

    // ═══ GENERATE — staged progress lands INSIDE the hat (was a chat
    //     message before) → concept sheet lands on the canvas → the
    //     ONE chat line posts → the hat drops back to its plain
    //     default state (exitWizardToDefault, defined above). ═══
    // conceptCount is the settings row's own count pill; the Guided
    // path passes nothing and keeps its historical 3.
    // 9/10 — Bryan on the old in-hat progress block ("Building 3
    // concepts across 1 size…" over three shimmer bars): "I don't like
    // whatever this loading state is… instead a chat should be sent
    // into the message, and there should be an agent response saying
    // it's preparing your images, and the right side should get a sort
    // of skeleton loading view for the banners, and buttons." So: the
    // hat keeps whatever it shows (the settings pills, dimmed; or the
    // Guided sizes step) and does not narrate; the conversation carries
    // the beat — the user's brief was already posted by send(), and one
    // assistant line lands with a live dot, resolving in place to the
    // done line when the sheet arrives; the canvas shows a skeleton of
    // the sheet about to land (#ptSheetSkeleton — the Selects header,
    // each concept row, the door, the rail) on the persona skeleton's
    // own pulse. The container argument is kept for the callers;
    // nothing is written into it any more.
    // §BK (9/16, Bryan: "make the skeleton loader actually look like
    // the content that resolves") — the skeleton IS the resolved sheet
    // in ghost, block for block: the Selects header + subnote lead
    // (markup, 42-body-canvas-sheet.html), then skelConceptRowsHTML
    // below draws one row's rule + eyebrow + N CARD ghosts per
    // concept, shared by the full-canvas build overlay
    // (showSheetSkeleton) and the append beat's in-flow foot block
    // (showSheetSkelFoot) so the two skeletons draw from one recipe
    // and can't quietly drift apart, then the append door. Per-layout
    // wireframe: PT_SKEL_LAYOUT_BLOCKS below carries the same per-
    // layout knowledge vfRowLayoutWireframeHTML draws for the resting
    // viewfinder (13-editor-studio-a-framing.js ~1392 — which side is
    // copy, which is picture) filled out to the banner's own copy
    // stack (a logo dot, headline bar(s), a CTA pill) at the card's
    // own fitted size, in percentages measured off the landed banner
    // (.pt-banner-media/-logo/-headline/-cta's own rects per
    // data-layout) rather than that function's single 22×16 icon.
    // `variantsPerRow` replaces the old fixed 3 (brief.variants); `y0`
    // is the top the first row's rule sits at, so the overlay can
    // start it under its own Selects header while the foot block
    // starts at 0. `dealList`/`dealGenerated` are buildConceptSheetDOM's
    // own pair (liveBoard.layout / mediaSetup.templates, and
    // templatesIsGenerated on it) so a row's ghost carries the SAME
    // layout the row will actually land with — Generated deals
    // 'diagonal' uniformly (AW.1's own sentinel), never the per-unit
    // flat variety a Generated row gets card-by-card at resolve, since
    // there is no one layout to preview in that case either.
    // `rowIndexOffset` is the append beat's own running concept count
    // (buildConceptSheetDOM's conceptIdx), so an appended row deals
    // into dealList at the SAME index the real row will. Returns the
    // row/door markup plus the y the door leaves off at, which the
    // caller sizes its own container to.
    // media/panel are big structural regions (stretch correctly with
    // the frame at any aspect); logo/bars/cta are `[x%, y%(, w%)]`
    // positions only — see skelFrameGhostHTML for why their SIZE is a
    // fixed px clamp instead. Two headline bars per layout (the second,
    // shorter one is a wrapped second line — a real headline commonly
    // wraps at these widths, per the landed sheet: e.g. "THE COAST IS
    // CALLING").
    const PT_SKEL_LAYOUT_BLOCKS = {
      'type-top':      { media: [0, 60, 100, 40],  logo: [5, 6],  bars: [[5, 21, 60], [5, 28, 40]], cta: [5, 36, 32] },
      'type-bottom':   { media: [0, 0, 100, 39],   logo: [5, 45], bars: [[5, 59, 60], [5, 66, 40]], cta: [5, 76, 28] },
      'stacked':       { media: [-3, 36, 106, 30], logo: [45, 6], bars: [[20, 22, 60], [30, 29, 40]], cta: [30, 74, 40] },
      'split':         { media: [56, 0, 44, 100],  logo: [5, 25], bars: [[5, 38, 42], [5, 47, 26]], cta: [5, 57, 42] },
      'split-reverse': { media: [0, 0, 44, 100],   logo: [49, 23], bars: [[49, 36, 42], [49, 45, 26]], cta: [49, 55, 38] },
      'card':          { media: [0, 0, 100, 100], panel: [3, 28, 69, 60],  logo: [8, 32],  bars: [[8, 46, 50], [8, 53, 30]], cta: [8, 63, 26] },
      'full-bleed':    { media: [0, 0, 100, 100], panel: [0, 40, 100, 60], logo: [5, 44],  bars: [[5, 58, 60], [5, 65, 38]], cta: [5, 75, 32] },
      'type-only':     { media: null,                                     logo: [42, 18], bars: [[20, 40, 60], [30, 48, 40]], cta: [35, 62, 30] },
      'diagonal':      { media: [0, 0, 100, 100], panel: [0, 18, 52, 65], logo: [5, 22],  bars: [[5, 36, 36], [5, 44, 22]], cta: [5, 57, 34] },
      // 21-sheet-b.css's own TOWER size class (~1356: width ≤300px,
      // height ≥600px — 160×600/300×600) forces type-top/-bottom,
      // split, split-reverse and diagonal into ONE shared stack (media
      // 44% up top, copy below, full width) — there is no width to
      // spare for a side-by-side split on a 160px column. skelShapeLayoutId
      // below deals a tower row into this shared ghost instead of
      // those five's own (BOX-shaped) side-by-side/type geometry.
      'tower-stack':   { media: [0, 0, 100, 44], logo: [5, 49], bars: [[5, 62, 80], [5, 70, 55]], cta: [5, 80, 50] }
    };
    // The TOWER override above; 'card' widens to a bottom, full-width
    // overlay at TOWER width (its own CSS, same file ~1416) — close
    // enough to 'full-bleed's own ghost to reuse rather than a third
    // near-duplicate entry. stacked/full-bleed/type-only need no
    // remap: TOWER's CSS leaves each of those alone (stacked is
    // already a vertical stack; full-bleed is already a full-bleed
    // image + bottom overlay at any aspect; type-only has no media to
    // reposition).
    const PT_SKEL_TOWER_STACKED = ['type-top', 'type-bottom', 'split', 'split-reverse', 'diagonal'];
    function skelShapeLayoutId(layoutId, shape) {
      if (shape !== 'tower') return layoutId;
      if (PT_SKEL_TOWER_STACKED.indexOf(layoutId) !== -1) return 'tower-stack';
      if (layoutId === 'card') return 'full-bleed';
      return layoutId;
    }
    function skelFrameGhostHTML(layoutId, isStrip, scale) {
      const def = PT_SKEL_LAYOUT_BLOCKS[layoutId] || PT_SKEL_LAYOUT_BLOCKS.diagonal;
      const region = (cls, box) => '<i class="' + cls + '" style="left:' + box[0] + '%;top:' + box[1] + '%;width:' + box[2] + '%;height:' + box[3] + '%;"></i>';
      // BK.2 fix — the real .pt-banner-logo is a NATURAL-px clamp
      // (height: clamp(14px, 10cqh, 24px), 21-sheet-b.css ~697) read
      // off the banner's own unscaled box (a container-query height,
      // untouched by applyCardScale's outer transform:scale()), never
      // a flat percentage of that box's height — so it reads the same
      // size on a 300×250 box as on a 160×600 tower, not 2.4× taller.
      // A raw %-of-unitH ghost dot/bar did exactly that (an oval logo
      // on every tower/skyscraper row). Two floors instead of
      // simulating cqh's own clamp exactly: STRIP (≤120px tall, no
      // room for the 24px ceiling) and everything else — each times
      // this row's own fit scale (fitRowUniform), never the frame's
      // raw box.
      const logoD = Math.max(3, Math.round((isStrip ? 13 : 22) * scale));
      const barH = Math.max(2, Math.round((isStrip ? 8 : 13) * scale));
      const ctaH = Math.max(3, Math.round((isStrip ? 14 : 22) * scale));
      const fixedH = (cls, x, y, w, h) => '<i class="' + cls + '" style="left:' + x + '%;top:' + y + '%;width:' + w + '%;height:' + h + 'px;"></i>';
      const square = (cls, x, y, d) => '<i class="' + cls + '" style="left:' + x + '%;top:' + y + '%;width:' + d + 'px;height:' + d + 'px;"></i>';
      let html = '';
      if (def.media) html += region('pt-skel-frame-media', def.media);
      if (def.panel) html += region('pt-skel-frame-panel', def.panel);
      html += square('pt-skel-frame-logo', def.logo[0], def.logo[1], logoD);
      def.bars.forEach((bx) => { html += fixedH('pt-skel-frame-bar', bx[0], bx[1], bx[2], barH); });
      html += fixedH('pt-skel-frame-cta', def.cta[0], def.cta[1], def.cta[2], ctaH);
      // BK.2 — the legal line, never on STRIP (height ≤120px —
      // 21-sheet-b.css's own SIZE CLASS, "no reserved band at STRIP").
      if (!isStrip) html += '<i class="pt-skel-frame-legal" style="left:5%;bottom:7%;width:40%;height:4%;"></i>';
      return html;
    }
    function skelConceptRowsHTML(rows, variantsPerRow, y0, colW, sizeId, dealList, dealGenerated, rowIndexOffset) {
      // The sheet's own boxes (9/10, Bryan: "make sure the elements
      // positionally align with the resolved state"), measured off the
      // landed sheet: a row head is 41px, 14px over its cards; a card
      // head 20px, 8px over its frame; cards 16px apart; every further
      // row sits under a rule and the group's own 24px.
      // 9/18 — the even grid: cards 32px apart, rows 40px apart, no row
      // head, no rule (18-sheet-a.css's closing block).
      const GAP = 32, TAG = 20, TAGGAP = 8, ROWGAP = 40;
      // The plan is drawn at the test size and template the pills hold,
      // laid out exactly the way the sheet will lay its cards: a BOX or
      // TOWER row is variantsPerRow units side by side on one shared
      // scale (fitRowUniform's own rule — never wider than natural). A
      // WIDE row packs as many natural-width units as fit per line,
      // wrapping (X, PLAN.md §X — the same rule fitWideCard + the CSS's
      // flex-wrap now give the landed cards); a unit wider than the
      // column scales to it and stands alone, which the perLine math
      // below falls out of on its own (see fitWideCard: scale=1 when it
      // fits, shrink-to-column when it doesn't).
      const dims = bpDimsOf(sizeId);
      const shape = shapeClassFor(sizeId);
      const isStrip = dims.h <= 120; // 21-sheet-b.css's own STRIP size class (320×50, 728×90, 970×90)
      const n = Math.max(1, variantsPerRow);
      const list = (dealList && dealList.length) ? dealList : ['diagonal'];
      const generated = dealGenerated || !dealList || !dealList.length;
      // AE.3 fix — matches fitRowUniform's own fix: the (n-1) gaps are
      // fixed px, off the available width before dividing, not folded
      // into the scaled total (that understated the true scale at
      // scale<1, drifting the skeleton off its resolved row's width).
      const scale = shape === 'wide'
        ? Math.min(1, (colW - 2) / dims.w)
        : Math.min(1, (colW - 2 - GAP * (n - 1)) / (dims.w * n));
      const unitW = Math.round(dims.w * scale), unitH = Math.round(dims.h * scale);
      // How many of THIS row's units share a line: natural (or shrunk-
      // to-column) width repeats until the next one wouldn't fit, same
      // arithmetic a wrapping flex row does with fixed-width children.
      // Box/tower are already one shared line (fitRowUniform), so this
      // is 1:1 with n there — the formula below just reduces to that.
      const perLine = shape === 'wide' ? Math.max(1, Math.floor((colW + GAP) / (unitW + GAP))) : n;
      const lines = Math.ceil(n / perLine);
      // AE.3 — the row centres in the column, the same measure
      // centerCanvasSections gives the resolved rows (widest line's
      // content width, capped at colW): box/tower are one line of n;
      // a wide row's own first line is perLine units (itself capped
      // at n, for the common ≤perLine case). xOff is both the row
      // head's own left inset (eyebrow) and each unit's, so the
      // skeleton lands exactly where centerCanvasSections will put
      // the real row once it resolves — required for the ≤4px
      // skeleton-vs-resolved rect check (AE.3/BK.4's own contract).
      const lineCount = Math.min(perLine, n);
      const rowContentW = Math.min(colW, lineCount * unitW + (lineCount - 1) * GAP);
      const xOff = Math.max(0, (colW - rowContentW) / 2);
      const bar = (x, y, w, h) => '<div class="pt-skel pt-skel-abs" style="left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;height:' + h + 'px;"></div>';
      const rule = (y) => '<div class="pt-skel-rule" style="top:' + y + 'px;"></div>';
      let blocks = '', units = '';
      let y = y0;
      for (let ri = 0; ri < Math.max(1, rows); ri++) {
        const hy = y;
        // BK.2 — the eyebrow: the real "Concept X" text's own box (two
        // words, 13/600 sans — 65×14, measured off the landed row); no
        // ghostchip at the row's right end (V1 retired the "+ sizes"
        // chip long before this pass — nothing to mock there).
        const ty0 = hy;
        // BK.2/AW.6 — this row's own dealt layout: buildConceptSheetDOM's
        // exact rule (dealList[conceptIdx % dealList.length]), so the
        // frame ghost previews the SAME layout the row lands with.
        // Generated (nothing picked, or the sole 'diagonal' pick) is
        // the diagonal sentinel uniformly (AW.1) — there is no one
        // layout to preview when the model is the one choosing.
        const conceptIdx = (rowIndexOffset || 0) + ri;
        const rowLayoutId = generated ? 'diagonal' : templateLayoutId(list[conceptIdx % list.length]);
        const frameGhost = skelFrameGhostHTML(skelShapeLayoutId(rowLayoutId, shape), isStrip, scale);
        for (let ci = 0; ci < n; ci++) {
          const col = ci % perLine, lineIdx = (ci - col) / perLine;
          const x = xOff + col * (unitW + GAP);
          const ty = ty0 + lineIdx * (TAG + TAGGAP + unitH + GAP);
          const uy = ty + TAG + TAGGAP;
          // BK.2 — the card ghost: a head row (the lockup pill at the
          // left, the 20px shortlist circle at the right end — the
          // real head's own space-between, .pt-unit-shortlist's
          // margin-left:auto) 8px over a dark-ground FRAME carrying
          // this row's own layout blocks.
          units += '<div class="pt-skel-card-head" style="left:' + x + 'px;top:' + ty + 'px;width:' + unitW + 'px;">' +
                      '<div class="pt-skel-lockup"><i class="pt-skel"></i><i class="pt-skel"></i></div>' +
                      '<div class="pt-skel pt-skel-shortlist"></div>' +
                    '</div>' +
                    '<div class="pt-skel-frame" style="left:' + x + 'px;top:' + uy + 'px;width:' + unitW + 'px;height:' + unitH + 'px;">' + frameGhost + '</div>';
        }
        y = ty0 + lines * (TAG + TAGGAP + unitH) + (lines - 1) * GAP + ROWGAP; // as many stacked lines as this row packed, then one row gutter
      }
      // BK.3 — the append door's own ghost, after the last row: the
      // real .pt-concept-ghost box (a 26px badge + a label line, at
      // its own 48px top margin), centred WITH the last concept block
      // — same width/offset centerCanvasSections gives the real door,
      // since every row here shares one sizeId/variantsPerRow so
      // rowContentW/xOff never vary row to row. box-sizing is the
      // house-wide border-box (10-shell-a.css), so width:rowContentW
      // matches the real door's own placeBlock width with no further
      // adjustment, and the 26px badge growing past the 48 min-height
      // (51 total, with the 1.5px border) matches it too. `y` already
      // IS the last row's own group-bottom edge — .pt-concept-group's
      // padding is 24px TOP AND BOTTOM (not top alone), so the
      // trailing ROWPAD this loop just added for the last row (above)
      // is that row's own bottom padding, landing y exactly on the
      // real group's own bottom (measured: no further ROWPAD
      // subtraction needed — that would double-count it).
      const doorY = y - ROWGAP + 48; // 9/18 — rows carry no padding now; the door sits 48px under the last row's cards (its own margin-top)
      const doorH = 51;
      blocks += '<div class="pt-skel-door" style="left:' + xOff + 'px;top:' + doorY + 'px;width:' + rowContentW + 'px;">' +
                  '<i class="pt-skel pt-skel-door-badge"></i>' +
                  '<i class="pt-skel pt-skel-door-label"></i>' +
                '</div>';
      return { blocks: blocks, units: units, height: doorY + doorH };
    }
    let skelHideTimer = null;
    // §BK — a fresh/regenerated build hasn't reassigned liveBoard yet
    // (buildConceptSheetDOM does that at resolve, ~2.5s from now), so
    // the ghost can't read liveBoard.layout the way an append safely
    // does (showSheetSkelFoot, below) — it would still be the OUTGOING
    // board's own list. mediaSetup.templates is exactly what the
    // upcoming build deals instead (buildConceptSheetDOM sets
    // liveBoard.layout = mediaSetup.templates.slice() for a non-append
    // build), and the hat is dimmed/disabled for the whole 2.5s wait,
    // so it cannot change out from under the ghost.
    function showSheetSkeleton(conceptCount) {
      const skel = document.getElementById('ptSheetSkeleton');
      const main = document.getElementById('ptSkelMain');
      if (!skel || !main) return;
      clearTimeout(skelHideTimer);
      skel.classList.remove('is-leaving');
      skel.classList.add('is-active');
      main.style.marginTop = ''; // AL.11 — cleared before remeasuring below; stale from a previous call otherwise
      const colW = main.clientWidth || 700;
      const sizeId = (state.sizes && state.sizes[0]) || brief.boardSize || '300x250';
      // V2 (PLAN.md §V) — brief.concepts rows of brief.variants units,
      // not the old fixed rows-capped-at-4-of-3; the popovers that write
      // brief.concepts already cap it at 9, so 24 here is a defensive
      // ceiling only, matching the board's own row cap.
      const rows = Math.max(1, Math.min(24, conceptCount || brief.concepts));
      const y0 = 0; // the Selects ghost lives in #ptSkelSelects (markup, BK.1); main is rows + the door alone
      const plan = skelConceptRowsHTML(rows, brief.variants, y0, colW, sizeId, mediaSetup.templates, templatesIsGenerated(mediaSetup.templates), 0);
      main.innerHTML = '<div class="pt-skel-plan" style="position:relative;width:' + colW + 'px;height:' + plan.height + 'px;">' + plan.blocks + plan.units + '</div>';
      // AL.11 (Bryan: "make the wireframe actually match the content of
      // the page") — #ptSkelMain's own top can land short of where the
      // real Selects label sits at narrower widths even though
      // colW/xOff (fixed by AL.8's padding match above) are exact.
      // Nudge main to the real label's own top when it's actually
      // measurable — a FIRST build's sheet is still .painter-sheet-view
      // (display:none) at this point, offsetParent null, rect all
      // zero, so guard on that or this would shove the whole skeleton
      // off-screen chasing a (0,0) target; a rebuild/append onto an
      // already-resolved sheet (offsetParent present) is exactly when
      // the real label IS live underneath, and self-corrects for ANY
      // cause. */
      const realConcepts = document.getElementById('ptConceptSection'); // 9/15 — main is rows alone, so it lands on the concept section's own top
      if (realConcepts && realConcepts.offsetParent) {
        const nudge = realConcepts.getBoundingClientRect().top - main.getBoundingClientRect().top;
        if (Math.abs(nudge) > 0.5 && Math.abs(nudge) < 400) main.style.marginTop = nudge + 'px';
      }
      // the persona view's own cascade: each ghost starts its pulse
      // 40ms after the one above it — BK.2's frame-internal blocks
      // (picture/logo/headline/CTA) carry their own dark-ground
      // classes, not the shared .pt-skel one (their animation is
      // cps-shimmer-light, not cps-shimmer), so the stagger reaches
      // for them by name too.
      Array.prototype.forEach.call(skel.querySelectorAll('.pt-skel, .pt-skel-frame-media, .pt-skel-frame-logo, .pt-skel-frame-bar, .pt-skel-frame-cta'), (el, i) => { el.style.animationDelay = (i * 40) + 'ms'; });
      requestAnimationFrame(() => skel.classList.add('is-visible'));
    }
    function hideSheetSkeleton() {
      const skel = document.getElementById('ptSheetSkeleton');
      if (!skel) return;
      skel.classList.add('is-leaving');
      skel.classList.remove('is-visible');
      clearTimeout(skelHideTimer);
      skelHideTimer = setTimeout(() => {
        skel.classList.remove('is-active', 'is-leaving');
        const main = document.getElementById('ptSkelMain');
        if (main) main.innerHTML = '';
      }, 420);
    }
    // V2 (PLAN.md §V) — the append beat's own skeleton (appendConcepts-
    // WithBeat, below): the same row/card ghosts showSheetSkeleton
    // draws (BK), but only the NEW rows, sitting in flow under
    // #ptConcepts (a .pt-sheet-skel-foot block, static markup near
    // #ptConcepts) instead of covering the whole canvas — an append
    // doesn't replace the board, so it doesn't earn the full takeover,
    // and its own door ghost (BK.3, shared via skelConceptRowsHTML)
    // sits where the real door will once buildConceptSheetDOM re-pins
    // it past the newly appended rows. Same fade timings as the
    // overlay (420ms > the CSS's own 360ms transition, so the class
    // cleanup never races the opacity).
    let footSkelHideTimer = null;
    // `rowIndexOffset` is the existing concept-row count (appendConcepts-
    // WithBeat's own `used`) — buildConceptSheetDOM's own conceptIdx
    // for these new rows, so the ghost deals liveBoard.layout at the
    // SAME index the real append will (AW.6 — an append deals into the
    // board's OWN banked layout list, never today's hat pick).
    function showSheetSkelFoot(letters, rowIndexOffset) {
      const host = document.getElementById('ptSheetSkelFoot');
      const concepts = document.getElementById('ptConcepts');
      if (!host || !concepts) return;
      clearTimeout(footSkelHideTimer);
      host.classList.remove('is-leaving');
      const colW = concepts.clientWidth || 700;
      const sizeId = brief.boardSize;
      const dealList = (liveBoard && liveBoard.layout) ? liveBoard.layout : mediaSetup.templates;
      const plan = skelConceptRowsHTML(letters.length, brief.variants, 0, colW, sizeId, dealList, templatesIsGenerated(dealList), rowIndexOffset || 0);
      host.innerHTML = '<div class="pt-skel-plan" style="position:relative;width:' + colW + 'px;height:' + plan.height + 'px;">' + plan.blocks + plan.units + '</div>';
      Array.prototype.forEach.call(host.querySelectorAll('.pt-skel, .pt-skel-frame-media, .pt-skel-frame-logo, .pt-skel-frame-bar, .pt-skel-frame-cta'), (el, i) => { el.style.animationDelay = (i * 40) + 'ms'; });
      host.hidden = false;
      requestAnimationFrame(() => host.classList.add('is-visible'));
    }
    function hideSheetSkelFoot() {
      const host = document.getElementById('ptSheetSkelFoot');
      if (!host) return;
      host.classList.add('is-leaving');
      host.classList.remove('is-visible');
      clearTimeout(footSkelHideTimer);
      footSkelHideTimer = setTimeout(() => {
        host.classList.remove('is-leaving');
        host.hidden = true;
        host.innerHTML = '';
      }, 420);
    }
    // BF — the star thinking mark that leads the live build line, ported
    // (not reinvented) from canvas-attach/index.html's .thinking-mark
    // into this file's own pt-think-* namespace (PLAN.md §BF.1/§BF.2).
    // Markup only — the CSS (sizing, colour, the orbit/pulse keyframes,
    // the reduced-motion override) lives beside .pt-msg-live in
    // 21-sheet-b.css, that line's own home.
    const PT_THINK_MARK_HTML = '<span class="pt-think-mark" aria-hidden="true">'
      + '<span class="pt-think-track pt-think-track-1"><span class="pt-think-sat"><svg viewBox="0 0 12 12"><path d="M6 0 L6.9 5.1 L12 6 L6.9 6.9 L6 12 L5.1 6.9 L0 6 L5.1 5.1 Z" fill="currentColor"/></svg></span></span>'
      + '<span class="pt-think-track pt-think-track-2"><span class="pt-think-sat"><svg viewBox="0 0 12 12"><path d="M6 0 L6.9 5.1 L12 6 L6.9 6.9 L6 12 L5.1 6.9 L0 6 L5.1 5.1 Z" fill="currentColor"/></svg></span></span>'
      + '<span class="pt-think-core"><svg viewBox="0 0 24 24"><path d="M12 0 L13.6 10.4 L24 12 L13.6 13.6 L12 24 L10.4 13.6 L0 12 L10.4 10.4 Z" fill="currentColor"/></svg></span>'
      + '</span>';
    let buildLiveLine = null;
    function runGenerateInHat(container, conceptCount, message) {
      const n = conceptCount || 3;
      closeMediaMode(); // the takeover yields to the skeleton at once, not when the sheet lands
      document.body.classList.add('is-painter-building');
      showSheetSkeleton(n);
      if (auxPanel) auxPanel.classList.add('pt-generating');
      const sizeLabel = (state.sizes[0] || '300x250').replace('x', '\u00d7'); // the board is built at ONE size (V1); the ship sizes belong to the shortlist, not to this line
      const prev = boards[boardCur];
      buildLiveLine = ptBot('<span class="pt-msg-live">' + PT_THINK_MARK_HTML + 'Preparing your images \u2014 ' + n + ' concept' + (n === 1 ? '' : 's') + ' at ' + sizeLabel + (prev ? ' \u00b7 ' + escape(prev.name) + ' stays in the history' : '') + '\u2026</span>');
      const canvasEl = document.getElementById('canvas');
      if (canvasEl) canvasEl.scrollTop = 0;
      setTimeout(() => finishGenerate(n, message), 2500); // AR.1 — the message rides along to name the board it lands
    }
    // The live line resolves in place — one assistant line for the
    // whole build, never a second "done" bubble under a "preparing" one.
    function resolveBuildLine(text, isHtml) {
      const node = buildLiveLine;
      buildLiveLine = null;
      const body = node && node.isConnected ? node.querySelector('.body') : null;
      if (body) { if (isHtml) body.innerHTML = text; else body.textContent = text; }
      else ptBot(text);
    }
    // "D, E and F" — the append beat's own done line names what it
    // added; an Oxford-less list to match the file's plain prose voice
    // elsewhere (resolveBuildLine's own "Done — the concept sheet is on
    // the canvas.").
    function joinLettersHuman(letters) {
      if (letters.length < 2) return letters.join('');
      return letters.slice(0, -1).join(', ') + ' and ' + letters[letters.length - 1];
    }
    // V2 (PLAN.md §V) — the append beat: the ghost tile's click and the
    // Generate chip's "N more" row are the same door (control-by-
    // control: "the same beat the first generate has"), so they share
    // this one function rather than staging two versions of it. Mirrors
    // runGenerateInHat's own beat — a live chat line, a skeleton, a
    // landing — at the board's foot instead of the whole canvas: an
    // append doesn't replace the sheet, so it doesn't close media mode,
    // touch the hat, or run the 2500ms overlay beat; it runs the same
    // 1500ms the ghost tile always used.
    function appendConceptsWithBeat() {
      if (conceptGhostPending) return;
      const container = document.getElementById('ptConcepts');
      const used = container ? container.querySelectorAll('.pt-concept-group').length : 0;
      const letters = SET_LETTERS_EXT.slice(used, used + 1);
      if (!letters.length) return; // the 24-letter roster is spoken for — syncConceptGhostTile already retired the tile by then
      conceptGhostPending = true;
      closeAllPtSheetPopovers(); // harmless when called from the ghost tile; closes the Generate popover when called from its "N more" row
      syncConceptGhostTile(); // flips to "Generating…", disabled — same flag either door sets
      const sizeLabel = (state.sizes[0] || '300x250').replace('x', '\u00d7'); // the board is built at ONE size (V1); the ship sizes belong to the shortlist, not to this line
      buildLiveLine = ptBot('<span class="pt-msg-live">' + PT_THINK_MARK_HTML + 'Adding Concept ' + letters[0] + ' \u00b7 ' + liveBoardVol().variants + (liveBoardVol().variants === 1 ? ' unit' : ' units') + ' at ' + sizeLabel + '…</span>');
      showSheetSkelFoot(letters, used); // BK — deals this row's ghost layout at the same conceptIdx buildConceptSheetDOM will actually append it at
      // Scrolls to the foot skeleton's own top — "the first new row's
      // head" — the same -112px toolbar clearance the rail's own
      // per-concept scroll (initSheetRail) already uses.
      const canvasEl = document.getElementById('canvas');
      const footEl = document.getElementById('ptSheetSkelFoot');
      if (canvasEl && footEl) {
        const top = footEl.getBoundingClientRect().top - canvasEl.getBoundingClientRect().top + canvasEl.scrollTop;
        canvasEl.scrollTo({ top: Math.max(0, top - 112), behavior: envReducedMotion() ? 'auto' : 'smooth' });
      }
      setTimeout(() => {
        conceptGhostPending = false;
        hideSheetSkelFoot(); // fades out over the landing rows, whose cards rise on their own pt-card-rise animation
        buildConceptSheetDOM(letters, true);
        scheduleFitAllBannerScales();
        resolveBuildLine('Done — ' + joinLettersHuman(letters) + ' ' + (letters.length === 1 ? 'is' : 'are') + ' on the board.');
      }, 1500);
    }
    // Regenerate: "rebuilds every concept row from the brief; selects
    // survive since they are clones" (the plan's own words). They do
    // NOT survive for free, though — syncSelectsSection (run at the
    // end of every non-append buildConceptSheetDOM, this one
    // included) deliberately orphans any select whose data-select-id
    // no longer matches a card on the rebuilt board ("a regenerate
    // wipes #ptConcepts, so drop anything orphaned by it rather than
    // showing a shortlist of banners that no longer exist" — right,
    // for a brand NEW campaign from a fresh brief, where an old
    // shortlist would be stale. A reshuffle of the SAME campaign's
    // variety is a different action, and the plan says so survives.
    // So every existing select is marked standalone first — the same
    // exemption a duplicated select already carries ("cut loose…
    // deleting it would be silent data loss") — freezing it as a
    // snapshot instead of letting the cleanup remove it. Reuses
    // runGenerateInHat verbatim after that — the same overlay-
    // skeleton-then-landing beat the very first generate runs.
    function regenerateBoard() {
      closeAllPtSheetPopovers();
      Array.prototype.forEach.call(document.querySelectorAll('#ptSelects .pt-select-card'), (card) => {
        card.setAttribute('data-select-standalone', '1');
      });
      runGenerateInHat(null, brief.concepts);
    }

    function rotatedLayoutFor(index, primary) {
      const rest = ALL_LAYOUT_IDS.filter(id => id !== primary);
      const seq = [primary].concat(rest);
      return seq[index % seq.length];
    }
    function copyPairFor(index) {
      if (state.copy && state.copy.mode === 'own') return state.copy.pairs[0];
      return ALL_COPY_PAIRS[index % ALL_COPY_PAIRS.length];
    }
    function imageForConcept(index) {
      if (!state.images.length) return findFrame(GENERATE_IMAGE_ID);
      return state.images[index % state.images.length];
    }
    /* Three banners to a row on the concept sheet. */
    const VARIANTS_PER_ROW = 3;
    /* The sheet draws from whatever imagery the user actually picked in
       the Chat Hat — the gallery frames they attached to the brief, or
       the Guided image step's own picks — SHUFFLED, so a rebuild deals
       them out in a different order rather than marching down the list.
       Shuffled once per build (not per card) so every picked image gets
       used before any repeats, and so one render stays stable while the
       fit/scale passes re-measure it. Falls back to the single default
       frame when the user picked nothing. */
    function conceptImagePool() {
      const src = state.images.length ? state.images.slice() : [findFrame(GENERATE_IMAGE_ID)];
      for (let i = src.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const t = src[i]; src[i] = src[j]; src[j] = t;
      }
      return src;
    }
    var WIDE_SIZE_IDS = ['728x90', '970x90', '970x250'];

    // ── P12 — shape-grid classing. Every SIZES id funnels into one of
    //    the three shapes the spec-sheet grid lays out: BOX (row 1,
    //    left region, side by side 1:1), WIDE (row 2, left region,
    //    stacked full-width — STRIP + BILLBOARD, the same membership
    //    as WIDE_SIZE_IDS above), TOWER (right region, side by side,
    //    tops aligned with the BOX row). ──
    var PT_SHAPE_CLASS = {
      '300x250': 'box', '336x280': 'box', '250x250': 'box',
      '200x200': 'box', '180x150': 'box',
      '728x90': 'wide', '970x90': 'wide', '320x50': 'wide', '970x250': 'wide',
      '468x60': 'wide', '234x60': 'wide', '320x100': 'wide',
      '160x600': 'tower', '300x600': 'tower',
      '120x600': 'tower', '300x1050': 'tower'
    };
    function shapeClassFor(sizeId) { return PT_SHAPE_CLASS[sizeId] || 'box'; }
    function sizesOrderIndex(sizeId) {
      for (var i = 0; i < SIZES.length; i++) { if (SIZES[i].id === sizeId) return i; }
      return 999;
    }
    // Row-2 (wide) priority order per the P12 spec text — widest/
    // tallest first, then the narrower strips.
    var PT_WIDE_ORDER = ['970x90', '970x250', '728x90', '320x100', '320x50'];
    function wideOrderIndex(sizeId) {
      var i = PT_WIDE_ORDER.indexOf(sizeId);
      return i === -1 ? 999 : i;
    }
    // Builds one concept's full shape grid (both regions, every row)
    // from a flat list of size ids — the single source every builder
    // (buildConceptSheetDOM, handleStudioAddToCanvas) now calls
    // instead of hand-rolling a flat .pt-size-row.
    function shapeGridHTML(sizeIds, layoutId, copyPair, img, letter, colorway, font, customColor, guide) {
      var boxIds = sizeIds.filter(function (id) { return shapeClassFor(id) === 'box'; }).sort(function (a, b) { return sizesOrderIndex(a) - sizesOrderIndex(b); });
      var wideIds = sizeIds.filter(function (id) { return shapeClassFor(id) === 'wide'; }).sort(function (a, b) { return wideOrderIndex(a) - wideOrderIndex(b); });
      var towerIds = sizeIds.filter(function (id) { return shapeClassFor(id) === 'tower'; }).sort(function (a, b) { return sizesOrderIndex(a) - sizesOrderIndex(b); });
      var hasLeft = boxIds.length > 0 || wideIds.length > 0;
      var hasRight = towerIds.length > 0;
      var gridClass = 'pt-shape-grid';
      if (!hasRight) gridClass += ' pt-no-towers';
      if (!hasLeft && hasRight) gridClass += ' pt-only-towers';
      var card = function (sizeId) { return bannerCardHTML(sizeId, layoutId, copyPair, img, letter, colorway, font, customColor, guide); };
      var html = '<div class="' + gridClass + '">';
      if (hasLeft) {
        html += '<div class="pt-shape-left">';
        if (boxIds.length) html += '<div class="pt-shape-row pt-shape-row-box">' + boxIds.map(card).join('') + '</div>';
        if (wideIds.length) html += '<div class="pt-shape-row pt-shape-row-wide">' + wideIds.map(card).join('') + '</div>';
        html += '</div>';
      }
      if (hasRight) {
        html += '<div class="pt-shape-right"><div class="pt-shape-row pt-shape-row-tower">' + towerIds.map(card).join('') + '</div></div>';
      }
      html += '</div>';
      return html;
    }

    // ═══ P3 — scoring agent. Deterministic (a pure hash of concept
    //     letter + size + layout, no Math.random/timestamps) so the
    //     same card always carries the same score across reloads —
    //     "refresh-safe" per PLAN.md. FNV-1a style string hash. ═══
    function ptHash(str) {
      let h = 2166136261;
      for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 16777619);
      }
      return h >>> 0;
    }
    function ptSubScore(base, salt, lo, hi) {
      const v = (base ^ Math.imul(salt, 2654435761)) >>> 0;
      return lo + (v % (hi - lo + 1));
    }
    var SCORE_ADVICE = [
      'Strong headline contrast — try an action verb to lead the CTA.',
      'Clean brand read at every size; a bolder gold accent on the CTA would sharpen the click target.',
      'Copy lands the Corvache voice well — the leaderboard crop could take a shorter headline.',
      'Great brand consistency throughout; a tighter crop on the hero shot would lift attention further.',
      'CTA placement is doing the work here — the skyscraper headline wraps a touch early.',
      'Solid all-around read — the layout carries real visual energy without hurting clarity.'
    ];
    function scoreForCard(letter, sizeId, layoutId) {
      const base = ptHash(letter + '|' + sizeId + '|' + layoutId);
      const attention = ptSubScore(base, 11, 74, 98);
      const brandFit = ptSubScore(base, 23, 80, 99);
      const copyClarity = ptSubScore(base, 37, 72, 97);
      const ctaSalience = ptSubScore(base, 53, 70, 96);
      const total = Math.round((attention + brandFit + copyClarity + ctaSalience) / 4);
      const advice = SCORE_ADVICE[base % SCORE_ADVICE.length];
      return { total: total, attention: attention, brandFit: brandFit, copyClarity: copyClarity, ctaSalience: ctaSalience, advice: advice };
    }
    // AM.7 — a new version's score reads "in the house voice" (the
    // same four-part rubric, the same scoreBand thresholds) but lands
    // near the PARENT unit's own total rather than an independent
    // hash — the designer's "the parent's ± a few": always 1-3 points
    // off, never dead even, deterministic/refresh-safe like every
    // other score on the sheet.
    var VERSION_SCORE_DELTAS = [-3, -2, -1, 1, 2, 3];
    function scoreForVersion(parentTotal, letter, sizeId, layoutId) {
      const base = ptHash(letter + '|' + sizeId + '|' + layoutId + '|version');
      const delta = VERSION_SCORE_DELTAS[base % VERSION_SCORE_DELTAS.length];
      const total = Math.max(70, Math.min(99, parentTotal + delta));
      const spread = 6;
      const clampSub = (v) => Math.max(70, Math.min(99, v));
      const attention = clampSub(total + (ptSubScore(base, 11, 0, spread * 2) - spread));
      const brandFit = clampSub(total + (ptSubScore(base, 23, 0, spread * 2) - spread));
      const copyClarity = clampSub(total + (ptSubScore(base, 37, 0, spread * 2) - spread));
      const ctaSalience = clampSub(total + (ptSubScore(base, 53, 0, spread * 2) - spread));
      const advice = SCORE_ADVICE[base % SCORE_ADVICE.length];
      return { total: total, attention: attention, brandFit: brandFit, copyClarity: copyClarity, ctaSalience: ctaSalience, advice: advice };
    }
    function scoreBand(total) {
      return total >= 90 ? 'high' : total >= 80 ? 'mid' : 'low';
    }
    function scoreRowHTML(label, value) {
      return (
        '<div class="pt-score-row">' +
          '<span class="pt-score-row-label">' + label + '</span>' +
          '<div class="pt-score-bar"><div class="pt-score-bar-fill" style="width:' + value + '%"></div></div>' +
          '<span class="pt-score-row-val">' + value + '</span>' +
        '</div>'
      );
    }
    function scorePopHTML(s) {
      return (
        '<div class="pt-score-pop" aria-hidden="true">' +
          scoreRowHTML('Attention', s.attention) +
          scoreRowHTML('Brand fit', s.brandFit) +
          scoreRowHTML('Copy clarity', s.copyClarity) +
          scoreRowHTML('CTA salience', s.ctaSalience) +
          '<p class="pt-score-advice">' + escape(s.advice) + '</p>' +
        '</div>'
      );
    }
    /* §BO.1 (colleague feedback via Bryan, 9/18: "no doubt this will go
       to thousands" / "there should be no character in it, it should
       just be 3 numbers") — every display unit carries a unique NUMERIC
       id, minimum 3 digits, growing to 4+ naturally as more units are
       minted this session: what a trafficker actually quotes back when
       they mean one specific unit. Starts somewhere in the 100s (never
       below), then a small prime step so consecutive units don't read
       as 101/102 (which invites people to infer order from them) —
       strictly increasing, never wrapping, so it can never collide with
       an id already minted this session. Held on the element, so it
       survives every re-deal of template, colour and image the header
       can do to the card. */
    // Unit ids count 001, 002, 003 … — three digits minimum, growing to
    // four and beyond as the campaign does (Bryan, 9/18).
    let unitIdSeq = 0;
    function nextUnitId() {
      unitIdSeq += 1;
      return String(unitIdSeq).padStart(3, '0');
    }
    // parentScoreTotal (10th, AM.7) — only meaningful for a unit-mode
    // NEW VERSION card: every prior caller omits it, which resolves to
    // the existing independent-hash score (untouched). When a number,
    // the card's score reads scoreForVersion's own "parent's ± a few"
    // instead.
    function bannerCardHTML(sizeId, layoutId, copyPair, img, letter, colorway, font, customColor, guide, parentScoreTotal) {
      const sizeMeta = SIZES.filter(s => s.id === sizeId)[0];
      const wideClass = WIDE_SIZE_IDS.indexOf(sizeId) !== -1 ? ' pt-banner-card-wide' : '';
      const s = typeof parentScoreTotal === 'number'
        ? scoreForVersion(parentScoreTotal, letter || 'A', sizeId, layoutId)
        : scoreForCard(letter || 'A', sizeId, layoutId);
      // colorway is optional (5th positional arg added for P5's
      // Studio "Add to canvas" beat — every prior caller omits it,
      // which resolves to the exact original gold-on-dark look).
      // customColor (8th, P9) is only meaningful when colorway ===
      // 'custom' — every other caller omits both, untouched.
      const isCustomColor = colorway === 'custom' && customColor;
      const colorAttr = isCustomColor ? ' data-colorway="custom"' + customColorInlineStyleAttr(customColor)
        : (colorway && colorway !== 'gold-on-dark') ? ' data-colorway="' + colorway + '"' : '';
      // guide (9th, AA.2) — the brand a locked, brand-approved unit
      // came from (SET_BRAND_BY_ID[id].brand, via varietyFor); every
      // prior caller omits it, resolving to no data-guide at all,
      // same "omit = untouched" contract as every optional arg above.
      const guideAttr = guide ? ' data-guide="' + guide + '"' : '';
      const logoSrc = isCustomColor ? griffinForInk(customColor.ink) : (LOGO_FOR_COLORWAY[colorway] || 'brand/griffin-gold.png');
      // font is optional (6th positional arg, P6 — every prior caller
      // omits it, resolving to the default brand display face, same
      // "omit = untouched original look" contract as colorway above).
      const fontId = font || DEFAULT_FONT_ID;
      const fontFamily = fontMeta(fontId).family;
      const sizeLabel = sizeMeta ? sizeMeta.label : sizeId;
      const unitId = nextUnitId();
      const band = scoreBand(s.total);
      return (
        /* AQ (9/15) — the card, quiet. Three layers, each saying only
           what is true of the unit at rest:
             1. the head row holds ONE thing — the id lockup "A1 · 90":
                the variant in the sans, the score in its band colour
                and, once shortlisted, a ✓ cell in the accent at the tail;
             2. the artwork, clean — no pencil on it;
             3. over the artwork, revealed by hover / keyboard focus (CSS,
                21-sheet-b.css): the SELECT check at the top-left (the
                photo-picker circle) and one ACTION CLUSTER at the top-
                right (shortlist · edit · more — unitChromeHTML below).
           The chrome lives on .pt-banner-scale, the fitted footprint
           applyCardScale sizes, never inside the scaled .pt-banner-fit,
           so a 20px check is 20px and an 8px inset is 8px at every fit
           scale. The checked check and the accent ring persist without
           hover, so a selected card reads as selected. The five-digit
           unit id stays in the DOM (the package sheet quotes it) and out
           of view; the P12 "−" stays for the remove wiring the Selects
           clone recasts. The card is focusable — Space toggles select
           (initSelectionClicks), Tab reaches the check and the cluster.
           AQ.4 amendment: the cluster's pencil is THE door to Studio's
           unit mode — a click on the banner itself only focuses the card. */
        '<div class="pt-banner-card' + wideClass + '" data-size="' + sizeId + '" data-unit-id="' + unitId + '" tabindex="0" aria-label="Unit ' + unitId + '">' +
          '<div class="pt-banner-card-head">' +
            /* §BO.1 — the head lockup reads the unit's own numeric id
               now, not the concept letter (letter stays internal —
               conceptLetterOf reads the group's data-concept, never
               this span — so grouping/scoring/variety are untouched). */
            '<div class="pt-unit-lockup"><span class="pt-unit-var">' + unitId + '</span>' +
              '<div class="pt-score-wrap">' +
                '<button class="pt-score-chip" type="button" data-total="' + s.total + '" data-band="' + band + '" aria-label="Score ' + s.total + '" title="Brand fit ' + s.total + ' — see the rubric">' +
                  '<span class="pt-score-num">' + s.total + '</span>' +
                '</button>' +
                scorePopHTML(s) +
              '</div>' +
            '</div>' +
            '<span class="pt-unit-id">' + unitId + '</span>' +
            '<button class="pt-banner-remove-btn" type="button" aria-label="Remove ' + sizeLabel + '">' + ICONS.minus +
              '<span class="pt-select-label">Remove</span>' +
            '</button>' +
            // §BO.2 — the "Add to selects" shortlist "+" retires with the
            // Selects section it fed: Package now scopes off the sheet's
            // own selection (selectedUnitCards), not a separate shortlist.
          '</div>' +
          '<div class="pt-banner-scale">' +
            '<div class="pt-banner-fit">' +
              '<div class="pt-banner-frame">' +
                // §BV — data-layout-origin is written once, here, at
                // the ONE function that deals every real unit (fresh
                // generate, Generate more, add-sizes-to-row, Studio's
                // add-to-canvas, BR.5 flow combos — all funnel through
                // bannerCardHTML): "the layout it was generated with,"
                // fixed for the unit's life. A Layout/Style pick later
                // only ever touches data-layout, never this.
                '<div class="pt-banner" data-layout="' + layoutId + '" data-layout-origin="' + layoutId + '" data-size="' + sizeId + '"' + colorAttr + guideAttr + ' data-font="' + fontId + '">' +
                  '<div class="pt-banner-inner">' +
                    '<div class="pt-banner-media">' + mediaTagHTML(img.src) + '</div>' +
                    '<div class="pt-banner-copy">' +
                      '<img class="pt-banner-logo" src="' + logoSrc + '" alt="">' +
                      '<span class="pt-banner-headline" style="font-family:' + fontFamily + '">' + escape(copyPair.headline) + '</span>' +
                      (copyPair.subhead ? '<span class="pt-banner-subhead">' + escape(copyPair.subhead) + '</span>' : '') +
                      (copyPair.body ? '<span class="pt-banner-body">' + escape(copyPair.body) + '</span>' : '') +
                      '<span class="pt-banner-cta">' + escape(copyPair.cta) + '</span>' +
                    '</div>' +
                    (copyPair.disclaimer ? '<span class="pt-banner-disclaimer">' + escape(copyPair.disclaimer) + '</span>' : '') +
                  '</div>' +
                '</div>' +
              '</div>' +
            '</div>' +
            unitChromeHTML() +
          '</div>' +
        '</div>'
      );
    }
    /* AQ.2 — the chrome every unit card carries over its artwork: the
       action cluster (top-right — edit · more). One function, so the
       board, Studio's add-to-canvas and every Selects clone carry the
       same two buttons. §BE (9/16, Bryan: "remove the select checkbox,
       and make it so clicking on the banner selects it") — the check
       that used to lead the cluster is gone; a click on the card (or
       its artwork) IS the select gesture now (initSelectionClicks),
       and a selected card's own accent ring (.pt-banner-card.is-active,
       21-sheet-b.css) is the only "selected" signal. One glyph weight
       across the pill — the house Phosphor light set the sheet
       header's chips already use — plus the kebab's own dots. */
    function unitChromeHTML() {
      return (
        '<div class="pt-unit-tools" role="group" aria-label="Unit actions">' +
          /* Bryan, 9/15 ("add the plus button somewhere outside of the
             hover-state lockup, in the top"): the shortlist button lives
             in the card HEAD now (bannerCardHTML), always visible at the
             row's right end; the cluster keeps the pencil and ⋮. */
          '<button class="pt-unit-tool pt-unit-edit" type="button" data-unit-edit aria-label="Edit">' +
            ICONS.edit +
            '<span class="pt-set-tip" role="tooltip">Edit</span>' +
          '</button>' +
          '<button class="pt-unit-tool pt-unit-kebab" type="button" data-unit-menu aria-haspopup="menu" aria-label="More">' +
            '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="5" r="1.9"/><circle cx="12" cy="12" r="1.9"/><circle cx="12" cy="19" r="1.9"/></svg>' +
            '<span class="pt-set-tip" role="tooltip">More</span>' +
          '</button>' +
        '</div>'
      );
    }
    // Scale-to-fit for wide sizes (728×90, 970×250) — a banner must
    // NEVER clip past its region. P12 — the sheet is now a 12-col
    // shape grid (see shapeGridHTML above), so "available width" is
    // no longer one flat #ptConcepts column: the WIDE row (STRIP +
    // BILLBOARD, stacked full-width) fits each card against its OWN
    // .pt-shape-row-wide's clientWidth (unchanged one-card-per-line
    // behavior, just region-scoped now); the BOX row and TOWER row
    // sit multiple units side by side at 1:1, so those scale the
    // WHOLE row uniformly (one shared scale factor from the sum of
    // natural widths + gaps vs. the row's real width) — every card in
    // the row stays the same relative size and their tops still align
    // exactly the way flex align-items:flex-start already guarantees.
    // AZ.2 — "the reserve follows the slot": every :has(.pt-banner-
    // disclaimer) padding/margin reserve in 21-sheet-b.css now reads
    // var(--legal-h, 18px) instead of a flat 18px literal. This is
    // the shared measure-and-set: offsetHeight is the slot's own
    // untransformed box height, so applyCardScale's own transform:
    // scale() on .pt-banner-fit (below) never throws the number off
    // the way getBoundingClientRect() would — no divide-by-scale
    // needed. +2px mirrors this file's own original 16px-content/
    // 18px-reserve ratio (a hairline of breathing room, never a flush
    // touch). Written INLINE on .pt-banner itself (not a stylesheet
    // rule) so a History-picture cloneNode(true) snapshot carries the
    // same value for free, no measurement pass of its own. Called
    // from here (every card, after every fit — resize, board-size
    // change, a fresh build/append, Selects, Package preview) AND
    // directly from applyDisclaimerContent in 19-sheet-c-variety.js
    // (a legal pick, None, or the Inline/Scroll style toggle) so the
    // very next paint already has the right number, not just the one
    // after the next resize. A zero/absent slot (STRIP hides it
    // outright, AZ.3) leaves --legal-h unset — the 18px fallback is
    // moot there since the :has() it guards never matches.
    function measureLegalH(banner) {
      if (!banner) return;
      const discl = banner.querySelector('.pt-banner-disclaimer');
      const h = discl ? discl.offsetHeight : 0;
      if (h > 0) banner.style.setProperty('--legal-h', (h + 2) + 'px');
    }
    // .pt-size-label text always stays the true, un-scaled label —
    // never a fudged number, in either mode.
    function applyCardScale(cardEl, scale) {
      const wrap = cardEl.querySelector('.pt-banner-scale');
      const fit = cardEl.querySelector('.pt-banner-fit');
      const banner = cardEl.querySelector('.pt-banner');
      const head = cardEl.querySelector('.pt-banner-card-head');
      // AF.2 — the package stage's own filename caption is the same
      // class of wider-than-the-banner sibling the head comment above
      // already covers (a long filename's own max-content width, with
      // no other constraint on this shrink-to-fit column, otherwise
      // wins the card's width and shoves every later tile in the row
      // off past the panel).
      const unitName = cardEl.querySelector('.pt-package-unit-name');
      if (!wrap || !fit || !banner) return;
      const parts = (banner.getAttribute('data-size') || '').split('x');
      const naturalW = parseInt(parts[0], 10);
      const naturalH = parseInt(parts[1], 10);
      if (!naturalW || !naturalH) return;
      const renderedW = Math.round(naturalW * scale);
      const renderedH = Math.round(naturalH * scale);
      wrap.style.width = renderedW + 'px';
      wrap.style.height = renderedH + 'px';
      fit.style.transform = scale < 1 ? 'scale(' + scale + ')' : '';
      if (head) head.style.width = renderedW + 'px';
      if (unitName) unitName.style.width = renderedW + 'px';
      measureLegalH(banner); // AZ.2 — re-measured on every fit pass
    }
    // Wide row — each card is the row's only occupant on its own
    // line, so it fits (or doesn't) against the row's own width.
    function fitWideCard(cardEl, availableWidth) {
      const banner = cardEl.querySelector('.pt-banner');
      if (!banner) return;
      const naturalW = parseInt((banner.getAttribute('data-size') || '').split('x')[0], 10);
      if (!naturalW) return;
      const scale = availableWidth > 0 ? Math.min(1, (availableWidth - 2) / naturalW) : 1;
      applyCardScale(cardEl, scale);
    }
    // Box row / tower row — multiple units side by side at 1:1;
    // scale the whole row together (never per-card independently,
    // which would break the "tops aligned" / uniform-size read).
    function fitRowUniform(rowEl) {
      const cards = Array.prototype.slice.call(rowEl.children).filter((c) => c.classList.contains('pt-banner-card'));
      if (!cards.length) return;
      const GAP = parseFloat(getComputedStyle(rowEl).columnGap) || 16; // 9/18 — read the row's real gutter (32 on the sheet)
      let totalNatural = 0;
      cards.forEach((cardEl) => {
        const banner = cardEl.querySelector('.pt-banner');
        const w = banner ? parseInt((banner.getAttribute('data-size') || '').split('x')[0], 10) : 0;
        totalNatural += w || 0;
      });
      // AE.3 fix — the gap between cards is a fixed 16px (CSS `gap` on
      // .pt-shape-row, never itself scaled), so it has to come OFF the
      // available width BEFORE dividing, not ride along inside the
      // scaled total: folding it into totalNatural understated the
      // scale needed whenever this row actually shrinks (scale<1),
      // letting the last card overshoot the row's own right edge by
      // the gaps' own (1-scale) share — invisible while the row simply
      // spanned the full column, but a real overflow once AE.3's
      // centreBlock started sizing the block to the row's true fitted
      // content instead. slotRowScale (Selects, below) already does
      // it this way — this brings fitRowUniform in line with it.
      const gapsTotal = GAP * Math.max(0, cards.length - 1);
      const available = rowEl.clientWidth;
      const scale = available > 0 && totalNatural > 0 ? Math.min(1, (available - 2 - gapsTotal) / totalNatural) : 1;
      cards.forEach((cardEl) => applyCardScale(cardEl, scale));
    }
    // Z.2.3 — "tiles at ONE scale per row": scale = min(1, (colW −
    // 16·(n−1)) / (n · naturalW)); below 0.4, wrap to the largest
    // per-line count that still clears 0.4 (728×90 × 4 → two per
    // line) by dropping n one at a time until the floor clears (or
    // n hits 1). Towers are capped by HEIGHT instead (300px, 160×600
    // → 0.5) — comfortably wide at any realistic column width, so the
    // wrap branch never has to run for them.
    const PT_SLOT_GAP = 16;
    const PT_SLOT_TOWER_CAP = 300;
    function slotRowScale(sizeId, n, colW) {
      const parts = sizeId.split('x');
      const naturalW = parseInt(parts[0], 10) || 1;
      const naturalH = parseInt(parts[1], 10) || 1;
      if (shapeClassFor(sizeId) === 'tower') return Math.min(1, PT_SLOT_TOWER_CAP / naturalH);
      let k = Math.max(1, n);
      let scale = Math.min(1, (colW - PT_SLOT_GAP * (k - 1)) / (k * naturalW));
      while (scale < 0.4 && k > 1) {
        k -= 1;
        scale = Math.min(1, (colW - PT_SLOT_GAP * (k - 1)) / (k * naturalW));
      }
      return scale;
    }
    // Applied per .pt-slot-row (one plan size, every tile at the same
    // scale — filled tiles via the card's own applyCardScale, ghosts
    // sized to match so a row reads as one uniform rank of slots).
    function applySlotRowScale(rowEl, sizeId) {
      const tiles = Array.prototype.slice.call(rowEl.children);
      if (!tiles.length || !rowEl.clientWidth) return;
      const scale = slotRowScale(sizeId, tiles.length, rowEl.clientWidth);
      const parts = sizeId.split('x');
      const naturalW = parseInt(parts[0], 10) || 1;
      const naturalH = parseInt(parts[1], 10) || 1;
      const gw = Math.round(naturalW * scale), gh = Math.round(naturalH * scale);
      tiles.forEach((tile) => {
        // The TILE's own width is set explicitly here — a select
        // card's head/actions row (Locked, Preview sizes) can measure
        // wider than the scaled banner beneath it, and without a
        // definite width on the tile a flex column's stretch would
        // otherwise size to that widest child instead of gw, which is
        // exactly how a filled tile drifted off a ghost tile's own
        // width in the same row before this line existed.
        tile.style.width = gw + 'px';
        const card = tile.querySelector(':scope > .pt-select-card');
        if (card) { applyCardScale(card, scale); return; }
        const ghost = tile.querySelector('.pt-slot-ghost');
        if (ghost) { ghost.style.height = gh + 'px'; }
      });
    }
    function fitAllBannerScales() {
      resetCanvasSectionCentering(); // AE.3 fix — see its own comment: must run before any row is measured, not just before centerBlock re-applies
      Array.prototype.forEach.call(document.querySelectorAll('#ptConcepts .pt-shape-row-wide'), (row) => {
        Array.prototype.forEach.call(row.querySelectorAll(':scope > .pt-banner-card'), (cardEl) => fitWideCard(cardEl, row.clientWidth));
      });
      Array.prototype.forEach.call(document.querySelectorAll('#ptConcepts .pt-shape-row-box, #ptConcepts .pt-shape-row-tower'), fitRowUniform);
      const selGrid = document.getElementById('ptSelects');
      if (selGrid && mediaPlan) {
        /* Z.2.3 — one ruled row per plan size, one scale per row (see
           slotRowScale above); recomputed here so every existing hook
           into this function (resize, popover open/close, a build,
           a select) recomputes the slots too, same as everything
           else it already fits. */
        Array.prototype.forEach.call(selGrid.querySelectorAll(':scope > .pt-slot-group'), (group) => {
          const sizeId = group.getAttribute('data-slot-group');
          const row = group.querySelector(':scope > .pt-slot-row');
          if (!row) return;
          if (sizeId && sizeId !== 'extra') { applySlotRowScale(row, sizeId); return; }
          /* The extra row can mix sizes — no single uniform scale
             applies, so each tile falls back to the no-plan formula
             below (independent, against the row's own width). */
          const avail = row.clientWidth;
          Array.prototype.forEach.call(row.children, (tile) => {
            const card = tile.querySelector(':scope > .pt-select-card');
            const w = card ? parseInt((card.dataset.size || '').split('x')[0], 10) : 0;
            if (w && avail > 0) applyCardScale(card, Math.min(1, (Math.min(avail, PT_RAIL_CARD_MAX) - 2) / w));
          });
        });
      } else if (selGrid) {
        /* Selects above the board (9/10): each card takes the board's
           own card width, so the shortlist sits on the same columns as
           the units beneath it (natural size when there is no board). */
        const ref = document.querySelector('#ptConcepts .pt-shape-row-box .pt-banner-card');
        const refW = ref ? ref.getBoundingClientRect().width : 0;
        const avail = Math.min(selGrid.clientWidth, refW > 40 ? refW : PT_RAIL_CARD_MAX);
        Array.prototype.forEach.call(selGrid.querySelectorAll(':scope > .pt-select-card'), (cardEl) => {
          const banner = cardEl.querySelector('.pt-banner');
          const w = banner ? parseInt((banner.getAttribute('data-size') || '').split('x')[0], 10) : 0;
          if (w && avail > 0) applyCardScale(cardEl, Math.min(1, (avail - 2) / w));
        });
      }
      // AG.2 — the strip's own frames are sized purely from their
      // select's aspect (never from the available column width, so no
      // fit pass touches them); a resize can still change whether a
      // row overflows, so the edge fade is recomputed here alongside
      // every other hook into this function.
      Array.prototype.forEach.call(document.querySelectorAll('#ptSelectsStrip .pt-strip-row'), updateStripFade);
      centerCanvasSections(); // AE.3 — every section's own block re-centres on the widths this pass just fit
    }
    // AE.3 — the stage's sections read as centred blocks (Bryan: "let's
    // have the concepts be centered in the right side of the available
    // canvas space"): contentEl gets an explicit width — the widest of
    // rowEls' own FITTED content width, capped at its parent's inner
    // width — and margin:auto; labelEl (the section label, or a
    // concept's own row-head) is pinned to the same width and left
    // offset so it never floats away from the units under it. Always
    // clears its own prior run's inline sizing first, so a shrinking
    // row (fewer selects, a smaller board) re-measures the natural
    // width rather than ratcheting wider forever.
    //
    // A row's OWN box (.pt-shape-row-*, .pt-slot-row) is a block-level
    // flex container with no width rule of its own, so by default CSS
    // it fills its column — that's the dead space to the right this
    // whole workstream removes, which means the row's getBoundingClient
    // Rect() is exactly the wrong thing to measure. rowFittedWidth sums
    // each visual LINE's own children (+ gaps) and returns the widest
    // line's width — children are grouped by their own rendered top
    // (within 2px), not by the row's flex-wrap CSS value: a Selects
    // slot row always carries flex-wrap:wrap (Z.2.3's own wrap-to-
    // clear-0.4 rule) but usually packs several tiles — five 300×250,
    // two 728×90, three towers — onto ONE line; treating "wrap:wrap"
    // as "one child per line" (the fix's first pass) collapsed those
    // rows to a single narrow column. A true one-per-line row (a wide
    // concept row, or a slot row that genuinely can't fit two) falls
    // out of the same grouping on its own — every child lands in its
    // own line group.
    function rowFittedWidth(row) {
      const kids = Array.prototype.filter.call(row.children, (k) => getComputedStyle(k).display !== 'none');
      if (!kids.length) return row.getBoundingClientRect().width;
      const gap = parseFloat(getComputedStyle(row).columnGap) || 0;
      const lines = [];
      kids.forEach((k) => {
        const top = Math.round(k.getBoundingClientRect().top);
        let line = lines.find((l) => Math.abs(l.top - top) < 2);
        if (!line) { line = { top: top, kids: [] }; lines.push(line); }
        line.kids.push(k);
      });
      let maxW = 0;
      lines.forEach((line) => {
        let w = 0;
        // AQ — the MARGIN box, not the border box: a board card wears
        // 5px of padding for its hover wash and the same margin back,
        // so its footprint in the row is still the banner's own width.
        line.kids.forEach((k) => {
          const cs = getComputedStyle(k);
          w += k.getBoundingClientRect().width + (parseFloat(cs.marginLeft) || 0) + (parseFloat(cs.marginRight) || 0);
        });
        w += gap * Math.max(0, line.kids.length - 1);
        maxW = Math.max(maxW, w);
      });
      return maxW;
    }
    // AE.3 fix — every inline width/margin/display this workstream can
    // set, cleared BEFORE fitWideCard/fitRowUniform/applySlotRowScale
    // run (called first thing in fitAllBannerScales, not just inside
    // centerBlock's own re-measure): those size a row against its OWN
    // clientWidth, and centerBlock's width lands on the row's PARENT
    // (.pt-shape-grid) — left in place across a second call, the fit
    // pass would measure against its own prior, already-narrowed
    // output and shrink a little further every time it ran.
    function resetCanvasSectionCentering() {
      const label = document.getElementById('ptSelectsLabel');
      if (label) { label.style.width = ''; label.style.marginLeft = ''; }
      ['ptSelects', 'ptSelectsList', 'ptSelectsStrip', 'ptSelectsEmpty'].forEach((id) => {
        const contentEl = document.getElementById(id);
        if (!contentEl) return;
        contentEl.style.width = ''; contentEl.style.marginLeft = ''; contentEl.style.marginRight = ''; contentEl.style.display = '';
      });
      Array.prototype.forEach.call(document.querySelectorAll('#ptConcepts > .pt-concept-group'), (group) => {
        const head = group.querySelector(':scope > .pt-concept-head');
        const grid = group.querySelector(':scope > .pt-shape-grid');
        if (head) { head.style.width = ''; head.style.marginLeft = ''; }
        if (grid) { grid.style.width = ''; grid.style.marginLeft = ''; grid.style.marginRight = ''; }
      });
      const ghostTile = document.getElementById('ptConceptGhost');
      if (ghostTile) { ghostTile.style.width = ''; ghostTile.style.marginLeft = ''; ghostTile.style.marginRight = ''; }
    }
    function centerBlock(labelEl, contentEl, rowEls, forceWidth) {
      if (!contentEl || !contentEl.parentElement) return null;
      const parent = contentEl.parentElement;
      contentEl.style.width = '';
      contentEl.style.marginLeft = '';
      contentEl.style.marginRight = '';
      contentEl.style.display = '';
      if (labelEl) { labelEl.style.width = ''; labelEl.style.marginLeft = ''; }
      const cap = parent.clientWidth;
      let w = forceWidth;
      if (w == null) {
        const rows = (rowEls && rowEls.length) ? rowEls : [contentEl];
        w = 0;
        rows.forEach((row) => { w = Math.max(w, rowFittedWidth(row)); });
      }
      w = Math.min(w, cap);
      if (!(w > 0)) return null;
      // auto margins only centre a BLOCK-level box — the Selects ghost
      // slot is inline-flex (so it can sit inline in its own sentence
      // elsewhere), which margin:auto would silently no-op on.
      const disp = getComputedStyle(contentEl).display;
      if (disp === 'inline-flex') contentEl.style.display = 'flex';
      else if (disp === 'inline-block' || disp === 'inline') contentEl.style.display = 'block';
      contentEl.style.width = w + 'px';
      contentEl.style.marginLeft = 'auto';
      contentEl.style.marginRight = 'auto';
      if (labelEl) {
        const offset = Math.max(0, (cap - w) / 2);
        labelEl.style.width = w + 'px';
        labelEl.style.marginLeft = offset.toFixed(1) + 'px';
      }
      return w;
    }
    // Measures a block's fitted width (the widest fitted row, capped at
    // the parent) without placing it.
    function blockWidth(contentEl, rowEls, forceWidth) {
      if (!contentEl || !contentEl.parentElement) return null;
      const parent = contentEl.parentElement;
      contentEl.style.width = '';
      contentEl.style.marginLeft = '';
      contentEl.style.marginRight = '';
      contentEl.style.display = '';
      const cap = parent.clientWidth;
      let w = forceWidth;
      if (w == null) {
        const rows = (rowEls && rowEls.length) ? rowEls : [contentEl];
        w = 0;
        rows.forEach((row) => { w = Math.max(w, rowFittedWidth(row)); });
      }
      w = Math.min(w, cap);
      return (w > 0) ? { w: w, cap: cap } : null;
    }
    // Places a block at a left offset: the label and the content share
    // one left edge; the content takes its fitted width unless
    // `natural` (a max-content ghost keeps its own).
    function placeBlock(labelEl, contentEl, w, offset, natural) {
      if (!contentEl) return;
      const disp = getComputedStyle(contentEl).display;
      if (!natural) {
        if (disp === 'inline-flex') contentEl.style.display = 'flex';
        else if (disp === 'inline-block' || disp === 'inline') contentEl.style.display = 'block';
        contentEl.style.width = w + 'px';
      } else {
        contentEl.style.width = '';
        contentEl.style.display = '';
      }
      contentEl.style.marginLeft = offset.toFixed(1) + 'px';
      contentEl.style.marginRight = 'auto';
      if (labelEl) {
        labelEl.style.width = '';
        labelEl.style.marginLeft = offset.toFixed(1) + 'px';
      }
    }
    // AL.3 — one left edge down the whole sheet, equal to the bar's
    // own Back pill (both read var(--pt-stage-inset) — .pt-sheet-main's
    // own left padding is that same var, so offset 0 here IS that
    // edge): every block (Selects, each concept row, the append tile)
    // sits at its own fitted width, left-aligned, never centred. Name
    // kept (was the centering pass before this); widths/the fitting
    // math below are untouched.
    function centerCanvasSections() {
      const blocks = [];
      Array.prototype.forEach.call(document.querySelectorAll('#ptConcepts > .pt-concept-group'), (group) => {
        const head = group.querySelector(':scope > .pt-concept-head');
        const grid = group.querySelector(':scope > .pt-shape-grid');
        if (!grid) return;
        // BD.3 — a genuine two-region grid (a resized unit's own tower
        // sitting beside its row-mates' box/wide, shapeGridHTML's own
        // .pt-shape-left/.pt-shape-right split) keeps its natural
        // 12-column width: both regions share the SAME grid's `1fr`
        // column tracks, so shrinking the whole grid to one row's own
        // fitted content (below) would rescale the OTHER region's
        // tracks right along with it — 403px, not 628, is what an
        // 8-of-12 left region reads once the grid itself gets clamped
        // to the box row's un-shrunk 616px. resetCanvasSectionCentering
        // (this same pass's first beat) already left the grid at that
        // natural width; a real .pt-shape-right leaves it there.
        if (grid.querySelector(':scope > .pt-shape-right .pt-banner-card')) return;
        const rows = Array.prototype.slice.call(grid.querySelectorAll('.pt-shape-row-box, .pt-shape-row-tower, .pt-shape-row-wide'));
        const m = blockWidth(grid, rows.length ? rows : null);
        if (m) blocks.push({ label: head, content: grid, w: m.w, cap: m.cap, natural: false, concept: true });
      });
      const selSection = document.getElementById('ptSelectsSection');
      if (selSection) {
        const label = document.getElementById('ptSelectsLabel');
        const grid = document.getElementById('ptSelects');
        const list = document.getElementById('ptSelectsList');
        const strip = document.getElementById('ptSelectsStrip');
        const empty = document.getElementById('ptSelectsEmpty');
        let m = null;
        // AG — the strip takes part in the one-shared-left-edge pass
        // like any other Selects view; is-empty is checked first since
        // it hides the strip outright (a plan is never "empty", so
        // this never actually competes with the list/strip branches
        // below — only the no-plan case can be empty, and only the
        // no-plan case ever shows Cards' plain grid).
        if (selSection.classList.contains('is-empty')) {
          m = blockWidth(empty, null);
          if (m) blocks.push({ label: label, content: empty, w: m.w, cap: m.cap, natural: true });
        } else if (list && list.classList.contains('is-active')) {
          m = blockWidth(list, null);
          if (m) blocks.push({ label: label, content: list, w: m.w, cap: m.cap, natural: false });
        } else if (strip && strip.classList.contains('is-active')) {
          const rows = Array.prototype.slice.call(strip.querySelectorAll(':scope > .pt-strip-row, :scope > .pt-strip-group > .pt-strip-row'));
          m = blockWidth(strip, rows.length ? rows : null);
          if (m) blocks.push({ label: label, content: strip, w: m.w, cap: m.cap, natural: false });
        } else if (grid) {
          const rows = Array.prototype.slice.call(grid.querySelectorAll(':scope > .pt-slot-group > .pt-slot-row'));
          m = blockWidth(grid, rows.length ? rows : null);
          if (m) blocks.push({ label: label, content: grid, w: m.w, cap: m.cap, natural: false });
        }
      }
      if (!blocks.length) return;
      // AL.3 amendment (Bryan: banners centred again; Selects/the band
      // keep the Back left edge) — Selects stays at offset 0 (the
      // stage inset, same edge as the bar's Back pill); each concept
      // block centres in the column at its own fitted width, the
      // label riding the block's own left edge (placeBlock already
      // gives label and content the same offset — AE.3's original
      // rule, just fed a centred number now instead of a flat 0).
      let lastConceptWidth = null;
      let lastConceptOffset = 0;
      let lastConceptCap = 0;
      blocks.forEach((b) => {
        const offset = b.concept ? Math.max(0, (b.cap - b.w) / 2) : 0;
        placeBlock(b.label, b.content, b.w, offset, b.natural);
        if (b.concept) { lastConceptWidth = b.w; lastConceptOffset = offset; lastConceptCap = b.cap; }
      });
      // The append tile centres WITH the block — same width (and now
      // the same centred offset) as the last concept row rather than
      // its own natural 100%, so it visually continues the stack
      // instead of spanning the column.
      const ghostTile = document.getElementById('ptConceptGhost');
      if (ghostTile && lastConceptWidth) {
        placeBlock(null, ghostTile, lastConceptWidth, lastConceptOffset, false);
        // AL.8 — feed the ghost tile's own rule (.pt-concept-ghost
        // ::before) exactly how far THIS centred block sits from each
        // true column edge: 34/32 (the shared rule's own splitter/rail
        // reach for a full-width block) plus whatever this block gave
        // up to centre — recomputed on every call (resize, size/volume
        // change) so it never goes stale.
        ghostTile.style.setProperty('--pt-ghost-reach-left', (34 + lastConceptOffset) + 'px');
        ghostTile.style.setProperty('--pt-ghost-reach-right', (32 + Math.max(0, lastConceptCap - lastConceptOffset - lastConceptWidth)) + 'px');
      }
    }
    const PT_RAIL_CARD_MAX = 300; // the select card's width when there is no board to match
    // Reading clientWidth forces a synchronous layout, so the fit can
    // run immediately after a DOM mutation — no need to wait a frame.
    // (Deliberately NOT requestAnimationFrame: the Browser pane
    // suspends rAF/ResizeObserver callbacks while its tab is hidden,
    // which would silently drop the fit during scripted/background
    // verification.) Only the resize listener debounces, via
    // setTimeout, for the same reason.
    const scheduleFitAllBannerScales = fitAllBannerScales;
    let _fitResizeTimer = null;
    window.addEventListener('resize', () => {
      clearTimeout(_fitResizeTimer);
      _fitResizeTimer = setTimeout(fitAllBannerScales, 120);
    }, { passive: true });

    // ── Score chip lifecycle. Every card is built already carrying
    //    its final (deterministic) score in data-total — "pending"
    //    is a purely visual state (dashed chip, em-dash text) until
    //    scoreAllSweep()/landScoresInstant() reveals it, so newly
    //    appended cards (follow-ups, overnight batch) just need to
    //    ask "has scoring already run?" via syncScoreChips. ──
    function setScoreAllButtonDone() {
      const btn = document.getElementById('ptScoreAllBtn');
      if (!btn) return;
      btn.disabled = true;
      btn.classList.remove('is-scoring');
      btn.classList.add('is-done');
      const label = btn.querySelector('.pt-scoreall-label');
      if (label) label.textContent = 'Scored';
    }
    function landChipInstant(chip) {
      const total = parseInt(chip.getAttribute('data-total'), 10) || 0;
      chip.classList.remove('pt-score-pending');
      chip.setAttribute('data-band', scoreBand(total));
      const num = chip.querySelector('.pt-score-num');
      if (num) num.textContent = String(total);
    }
    function landScoresInstant() {
      Array.prototype.forEach.call(document.querySelectorAll('#ptConcepts .pt-score-chip'), landChipInstant);
      state.scored = true;
      setScoreAllButtonDone();
    }
    // Cards built AFTER a Score-all sweep (a follow-up chip, the
    // overnight batch) should just already read as scored — no
    // reason to replay the count-up for content that never had a
    // "pending" moment on screen. Idempotent on already-landed chips.
    /* Scores land at build now (bannerCardHTML stamps the total and
       band straight onto the chip), so there is no pending state left
       to resolve. Kept as a no-op-safe sweep for any chip an older
       path might still mint pending. */
    function syncScoreChips(root) {
      const scope = root || document;
      Array.prototype.forEach.call(scope.querySelectorAll('.pt-score-chip.pt-score-pending'), landChipInstant);
    }
    function animateScoreChip(chip, delayMs, onDone) {
      setTimeout(() => {
        const total = parseInt(chip.getAttribute('data-total'), 10) || 0;
        chip.classList.remove('pt-score-pending');
        chip.setAttribute('data-band', scoreBand(total));
        const num = chip.querySelector('.pt-score-num');
        const STEPS = 8, STEP_MS = 45;
        let i = 0;
        (function step() {
          i++;
          if (num) num.textContent = String(Math.round((total * i) / STEPS));
          if (i < STEPS) { setTimeout(step, STEP_MS); }
          else { if (num) num.textContent = String(total); if (onDone) onDone(); }
        })();
      }, delayMs);
    }
    function scoreAllSweep() {
      const chips = Array.prototype.slice.call(document.querySelectorAll('#ptConcepts .pt-score-chip.pt-score-pending'));
      if (!chips.length) { landScoresInstant(); return; }
      const STAGGER = 90, STEPS = 8, STEP_MS = 45;
      let remaining = chips.length;
      chips.forEach((chip, i) => {
        animateScoreChip(chip, i * STAGGER, () => {
          remaining--;
          if (remaining === 0) { state.scored = true; setScoreAllButtonDone(); }
        });
      });
    }
    // ── Every sheet-header popover/menu (style guide, score-chip
    //    rubrics, share flyout, comments, kebab) needs to close its
    //    SIBLINGS whenever one opens — each toggle button calls
    //    e.stopPropagation() (standard pattern, so its own opening
    //    click doesn't immediately bubble to the document listener
    //    and re-close itself), which means that same stopPropagation
    //    also blocks any OTHER popover's own document-click listener
    //    from ever seeing the click. One shared close-everything
    //    function + one shared document listener sidesteps that. ──
    function closeAllPtSheetPopovers() {
      Array.prototype.forEach.call(
        document.querySelectorAll('.pt-score-pop.is-open, .pt-styleguide-pop.is-open, .pt-share-pop.is-open, .pt-comments-pop.is-open, .pt-addsizes-pop.is-open'),
        (p) => { p.classList.remove('is-open'); p.setAttribute('aria-hidden', 'true'); }
      );
      /* The header chips share .pt-styleguide-pop's shell above, so
         their popovers are already closed by that sweep — this
         un-expands their buttons and returns any popover that
         positionSheetPop hoisted out to <body>. */
      Array.prototype.forEach.call(
        document.querySelectorAll('.pt-variety-chip[aria-expanded="true"]'),
        (b) => b.setAttribute('aria-expanded', 'false')
      );
      Array.prototype.forEach.call(document.querySelectorAll('.pt-variety-pop'), (pop) => {
        if (!pop._origParent) return;
        pop.removeAttribute('style');
        pop._origParent.appendChild(pop);
        delete pop._origParent;
      });
      const styleguideBtn = document.getElementById('ptStyleguideBtn');
      if (styleguideBtn) styleguideBtn.setAttribute('aria-expanded', 'false');
      // AM.6 — the Studio Brand drawer's own chip retired; its card
      // opens the roster through openStyleSetMenu/openSetMenu, which
      // already owns its anchor's aria-expanded + outside-click/Escape
      // close, so there is nothing left for this sweep to do.
      const shareBtn = document.getElementById('ptShareBtn');
      if (shareBtn) shareBtn.setAttribute('aria-expanded', 'false');
      const shareBtnMedia = document.getElementById('ptShareBtnMedia'); // AB.1 amendment — the Media bar's own copy
      if (shareBtnMedia) shareBtnMedia.setAttribute('aria-expanded', 'false');
      const commentsBtn = document.getElementById('ptCommentsBtn');
      if (commentsBtn) commentsBtn.setAttribute('aria-expanded', 'false');
      // Multiple concepts each carry their own +sizes chip — reset
      // every one, not a single #id (unlike the sheet-header actions
      // above, which are singletons).
      Array.prototype.forEach.call(
        document.querySelectorAll('.pt-addsizes-chip[aria-expanded="true"]'),
        (b) => b.setAttribute('aria-expanded', 'false')
      );
      const kebabMenu = document.getElementById('ptKebabMenu');
      const kebabBtn = document.getElementById('ptKebabBtn');
      if (kebabMenu && kebabMenu.classList.contains('open')) {
        kebabMenu.classList.remove('open');
        kebabMenu.setAttribute('aria-hidden', 'true');
        if (kebabBtn) { kebabBtn.classList.remove('open'); kebabBtn.setAttribute('aria-expanded', 'false'); }
      }
    }
    document.addEventListener('click', closeAllPtSheetPopovers);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeAllPtSheetPopovers(); } }); // AD.2 — the sheet's own drawer/closeSheetDrawer retired; its popovers close via closeSetMenu's own Escape handler above

    function initScoreChips() {
      const root = document.getElementById('ptConcepts');
      if (!root) return;
      root.addEventListener('click', (e) => {
        const chip = e.target.closest('.pt-score-chip');
        if (!chip) return;
        e.stopPropagation();
        if (chip.classList.contains('pt-score-pending')) return;
        const pop = chip.parentElement.querySelector('.pt-score-pop');
        if (!pop) return;
        const willOpen = !pop.classList.contains('is-open');
        closeAllPtSheetPopovers();
        if (willOpen) { pop.classList.add('is-open'); pop.setAttribute('aria-hidden', 'false'); animateScorePop(pop); }
      });
    }
    // 9/10 (Bryan: "when you open this can you have the lines animate
    // and numbers grow into their final number/position") — on open,
    // every bar starts empty and grows to its width on the house curve
    // (the CSS transition on .pt-score-bar-fill), and every number
    // counts up from 0 over the same 640ms, eased the same way, rows
    // 60ms apart. Reduced motion lands them at once.
    function animateScorePop(pop) {
      const rows = pop.querySelectorAll('.pt-score-row');
      const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      Array.prototype.forEach.call(rows, (row, i) => {
        const fill = row.querySelector('.pt-score-bar-fill');
        const val = row.querySelector('.pt-score-row-val');
        const target = parseInt((val && val.textContent) || (fill && fill.style.width) || '0', 10) || 0;
        if (reduced || !fill || !val) return;
        fill.style.transition = 'none';
        fill.style.width = '0%';
        val.textContent = '0';
        void fill.offsetWidth;
        const delay = i * 60, dur = 640, t0 = performance.now() + delay;
        setTimeout(() => { fill.style.transition = ''; fill.style.width = target + '%'; }, delay);
        (function tick(now) {
          const t = Math.max(0, Math.min(1, (now - t0) / dur));
          const e = 1 - Math.pow(1 - t, 3); // ease-out cubic, the bar's own feel
          val.textContent = String(Math.round(target * e));
          if (t < 1 && pop.classList.contains('is-open')) requestAnimationFrame(tick);
          else val.textContent = String(target);
        })(performance.now());
      });
    }
    function initScoreAllButton() {
      const btn = document.getElementById('ptScoreAllBtn');
      if (!btn) return;
      btn.addEventListener('click', () => {
        if (btn.disabled) return;
        btn.disabled = true;
        btn.classList.add('is-scoring');
        scoreAllSweep();
      });
    }

    // .pt-concept-ghost's (and the Generate chip's "N more" row's)
    // click is staged (V2, PLAN.md §V: appendConceptsWithBeat, 1500ms,
    // the same beat the ghost tile always used) — this flag blocks a
    // second click while that's in flight; the tile hides itself for
    // good the moment syncConceptGhostTile() next sees 24+ concept
    // groups (raised from 12 alongside brief.concepts' own ceiling of
    // nine a round — see SET_LETTERS_EXT above).
    let conceptGhostPending = false;

    // ═══ AJ.1/AJ.2 — SELECTION (Bryan, 9/14 night: the band's fields
    // "change a bunch of banners randomly and without logic"). A
    // per-board set of unit ids, kept with the board's banked state
    // (boardSnapshot/switchBoard below restore it on a switch);
    // buildConceptSheetDOM clears it on a fresh build/Regenerate. The
    // hat still MAKES (brief/pools/variety — untouched below), the
    // Editor still changes ONE; the band (wireSheetBand,
    // syncBandFieldsUI) is this Set's own editor and touches nothing
    // else, ever. ═══
    let sheetSelection = new Set();
    // The last unit plain/cmd-clicked, per AJ.1's "shift-click = range
    // within the concept" — a shift-click extends FROM this one, and
    // only within its own concept row.
    let selectionAnchorId = null;
    // §BN.1 — "zero selection = all": this is the band's ONE choke point
    // for "which units is an edit scoped to" (selectionSharedValue,
    // applyFieldValueToSelection, applyLegalStyleToSelection,
    // applyBodyFitToSelection all read/write through it), so making it
    // fall back to every unit on the board when nothing is picked is
    // enough to make every band field/edit operate on "all" for free —
    // nothing else downstream needs to know the difference.
    function selectedUnitCards() {
      const cards = Array.prototype.slice.call(document.querySelectorAll('#ptConcepts .pt-banner-card'));
      if (!cards.length) return [];
      if (!sheetSelection.size) return cards; // nothing picked = every unit on the board in view
      return cards.filter((c) => sheetSelection.has(c.dataset.unitId));
    }
    function cardBannerEl(card) { return card.querySelector('.pt-banner'); }
    function setCardSelected(card, on) {
      card.classList.toggle('is-active', on);
      // AL.7 — selection state lives on the checkbox now, not the lockup.
      const check = card.querySelector('.pt-unit-check');
      if (check) {
        check.setAttribute('aria-checked', String(on));
        // AQ — one tooltip, not two: the hoisted .pt-set-tip is the tip
        // you see, aria-label the one you hear; no native title beside them.
        check.setAttribute('aria-label', on ? 'Deselect' : 'Select');
        const tip = check.querySelector('.pt-set-tip');
        if (tip) tip.textContent = on ? 'Deselect' : 'Select';
      }
    }
    // Re-derives every visible trace of the selection from
    // sheetSelection — card outlines/checks, each row's own checkbox
    // state, and the band itself — so every caller below just mutates
    // the Set and calls this, rather than each having to remember
    // which bits of chrome to patch by hand.
    function syncSelectionUI() {
      // AL.16 addendum — every unchecked box's rest-vs-dim state reads
      // off this one class (#ptConcepts.has-selection): nothing
      // selected anywhere on the board = invisible, something selected
      // = a faint .35 (CSS next to .pt-unit-check; AQ.5 — the row's
      // own check is that same recipe now, scoped in 18-sheet-a.css).
      const conceptsEl = document.getElementById('ptConcepts');
      if (conceptsEl) conceptsEl.classList.toggle('has-selection', sheetSelection.size > 0);
      Array.prototype.forEach.call(document.querySelectorAll('#ptConcepts .pt-banner-card'), (card) => {
        setCardSelected(card, sheetSelection.has(card.dataset.unitId));
      });
      Array.prototype.forEach.call(document.querySelectorAll('#ptConcepts .pt-concept-group'), (group) => {
        const cards = group.querySelectorAll('.pt-banner-card');
        let n = 0;
        Array.prototype.forEach.call(cards, (c) => { if (sheetSelection.has(c.dataset.unitId)) n++; });
        // §BP folded-in (b) (coordinator, 9/18: "the stray '· 1
        // selected' line above the first row retires — the band's
        // APPLIES TO cell already says it") — [data-concept-selected]
        // stays as the stable hook (nothing else queries it, but it
        // costs nothing to keep for a future row-scoped readout); it
        // simply never gets written to again, so it stays empty and
        // CSS-hidden (.pt-concept-selected:empty, 18-sheet-a.css).
        // AL.7 — the row's own checkbox: on when every unit is selected,
        // indeterminate (a dash) when only some are, off when none are.
        const rowCheck = group.querySelector('[data-concept-check]');
        if (rowCheck) {
          const state = (n === 0) ? 'false' : (n === cards.length ? 'true' : 'mixed');
          rowCheck.setAttribute('aria-checked', state);
          rowCheck.title = (n === 0) ? 'Select row' : (n === cards.length ? 'Deselect row' : 'Select the rest of this row');
        }
      });
      syncBandFieldsUI();
      syncPackageButton(); // §BO.2 — Package's "N of M filled" hint scopes to the selection too
    }
    function toggleUnitSelection(unitId) {
      if (sheetSelection.has(unitId)) sheetSelection.delete(unitId); else sheetSelection.add(unitId);
      selectionAnchorId = unitId;
      syncSelectionUI();
    }
    // AJ.1 — shift-click: the anchor and this one must be the SAME
    // concept's own units (a range means nothing across rows); falls
    // back to a plain toggle otherwise.
    function selectConceptRangeTo(unitId) {
      const target = document.querySelector('#ptConcepts .pt-banner-card[data-unit-id="' + unitId + '"]');
      const anchor = selectionAnchorId && document.querySelector('#ptConcepts .pt-banner-card[data-unit-id="' + selectionAnchorId + '"]');
      const group = target && target.closest('.pt-concept-group');
      if (!target || !anchor || !group || anchor.closest('.pt-concept-group') !== group) {
        if (target) toggleUnitSelection(unitId);
        return;
      }
      const cards = Array.prototype.slice.call(group.querySelectorAll('.pt-banner-card'));
      const a = cards.indexOf(anchor), b = cards.indexOf(target);
      if (a === -1 || b === -1) { toggleUnitSelection(unitId); return; }
      for (let i = Math.min(a, b); i <= Math.max(a, b); i++) sheetSelection.add(cards[i].dataset.unitId);
      syncSelectionUI();
    }
    // AJ.1 (retargeted by AL.7 onto the row's own checkbox, not the
    // label) — toggles a whole row: on unless every unit in it is
    // already selected, in which case it clears just that row.
    function toggleConceptSelection(letter) {
      const group = document.querySelector('#ptConcepts .pt-concept-group[data-concept="' + letter + '"]');
      if (!group) return;
      const cards = Array.prototype.slice.call(group.querySelectorAll('.pt-banner-card'));
      const allOn = cards.length > 0 && cards.every((c) => sheetSelection.has(c.dataset.unitId));
      cards.forEach((c) => { if (allOn) sheetSelection.delete(c.dataset.unitId); else sheetSelection.add(c.dataset.unitId); });
      syncSelectionUI();
    }
    function clearSheetSelection() {
      if (!sheetSelection.size) return;
      sheetSelection.clear();
      selectionAnchorId = null;
      syncSelectionUI();
    }
    // Whether all selected units agree on one value (per the getter)
    // — the band's own "shows the CURRENT value when shared, 'Mixed'
    // when they differ" contract, generic across every field.
    function selectionSharedValue(getter) {
      const cards = selectedUnitCards();
      if (!cards.length) return { any: false, shared: false, value: null };
      let value, shared = true;
      cards.forEach((c, i) => {
        const v = getter(c);
        if (i === 0) value = v; else if (v !== value) shared = false;
      });
      return { any: true, shared: shared, value: value };
    }
    // The house blur-fade (.is-swapping, scoped to the frame — CSS
    // above), reduced-motion aware: fade out, mutate while hidden,
    // fade back in. mutate receives the card's own .pt-banner so
    // callers never re-query it.
    function swapCardContent(card, mutate) {
      const banner = cardBannerEl(card);
      if (!banner) return;
      const frame = card.querySelector('.pt-banner-frame');
      if (!frame || envReducedMotion()) { mutate(banner); return; }
      frame.classList.add('is-swapping');
      setTimeout(() => {
        mutate(banner);
        frame.classList.remove('is-swapping');
      }, 220);
    }
    // AJ.2 — one mutator per field kind, each touching only the exact
    // .pt-banner attributes/content the Editor's own commit path
    // (propagateEditsToGroup) and the old build-time dealer
    // (applySheetVariety, retired below) already used — never a fresh
    // bannerCardHTML render, so data-unit-id (and every OTHER card)
    // stays untouched. Layout/Color picks break a unit's brand-guide
    // lock (data-guide/-guide-id); a Style pick sets both — data-guide
    // stays the BRAND alone (the existing CSS hook, e.g.
    // .pt-banner[data-guide="atelier"]), data-guide-id is the band's
    // own addition carrying the SPECIFIC guide so syncBandFieldsUI can
    // read back which one is on (styleGuideLabel's own id, not just
    // its brand family).
    function fieldMutator(kind, value, poolKey) {
      switch (kind) {
        case 'layout':
          return (banner) => {
            banner.setAttribute('data-layout', value);
            banner.removeAttribute('data-guide');
            banner.removeAttribute('data-guide-id');
          };
        case 'style': {
          const guide = SET_BRAND_BY_ID[value];
          const layoutId = guide ? guide.layout : templateLayoutId(value);
          const colorway = guide ? guide.colorway : 'gold-on-dark';
          return (banner) => {
            banner.setAttribute('data-layout', layoutId);
            if (colorway && colorway !== 'gold-on-dark') banner.setAttribute('data-colorway', colorway);
            else banner.removeAttribute('data-colorway');
            if (guide) { banner.setAttribute('data-guide', guide.brand); banner.setAttribute('data-guide-id', value); }
            else { banner.removeAttribute('data-guide'); banner.removeAttribute('data-guide-id'); }
            const logo = banner.querySelector('.pt-banner-logo');
            if (logo) logo.src = LOGO_FOR_COLORWAY[colorway] || GRIFFIN_GOLD;
          };
        }
        // §BT — the 'colorOverride' mutator (a swatch-driven override
        // inside the Style menu) retired: colour comes from the style
        // guide only, set entirely by the 'style' case above.
        case 'imagery':
          return (banner) => {
            const media = banner.querySelector('.pt-banner-media');
            // §BR.2 — a band-wide Imagery pick is still a real image
            // swap, same as Studio's own (propagateEditsToGroup): the
            // reference has to move with it, or the reach line / shared-
            // crop lookups downstream would still be keyed off the OLD
            // picture. New picture, no crop of its own answered yet
            // (registerImageAsset only ensures the store entry exists);
            // it renders at the plain focal default unless some OTHER
            // unit already cropped this same image.
            if (media) media.innerHTML = mediaTagHTML(value, null, framingForSize({}, banner.getAttribute('data-size'), value));
            banner.setAttribute('data-image-ref', registerImageAsset(value));
          };
        // §BR.3 — a band pick is a REFERENCE change, not a text write:
        // poolKey is the pool slot the picked line came from
        // (sheetVariety.bodies/ctas' own index, or LEGAL_LINES' —
        // exactly registerLineAsset's own role+':'+poolIndex key, the
        // same id every OTHER unit already dealt that slot at
        // generation carries), so this unit joins THEIR reach line
        // rather than starting an unshared text-alike double of it.
        // registerLineAsset(role, poolKey, value) is a safe re-set even
        // when the id already exists (its own contract: "overwriting
        // .text on an existing id is safe and intended") — value here
        // is always that slot's own current text, so it never actually
        // changes anything the id already said. Any prior "Just this
        // one" override this unit had for the field is dropped: a
        // pick is a deliberate re-join, the same as Studio's own
        // Rejoin, just entered from the band instead of the stage.
        case 'headline':
          return (banner) => {
            const h = banner.querySelector('.pt-banner-headline');
            if (h) { h.textContent = value; applyHeadlineFit(h, banner.getAttribute('data-size'), value); }
            if (poolKey !== undefined && poolKey !== null) {
              banner.setAttribute('data-headline-id', registerLineAsset('headline', poolKey, value));
              const overrides = readBannerCopyOverrides(banner);
              if (overrides.headline !== undefined) { delete overrides.headline; writeBannerCopyOverrides(banner, overrides); }
              applyLineFit(banner, 'headline'); // §BR.4 — a re-pointed line reads ITS OWN size, not whatever the old one had
            }
          };
        case 'cta':
          return (banner) => {
            const c = banner.querySelector('.pt-banner-cta');
            if (c) c.textContent = value;
            if (poolKey !== undefined && poolKey !== null) {
              banner.setAttribute('data-cta-id', registerLineAsset('cta', poolKey, value));
              const overrides = readBannerCopyOverrides(banner);
              if (overrides.cta !== undefined) { delete overrides.cta; writeBannerCopyOverrides(banner, overrides); }
              applyLineFit(banner, 'cta'); // §BR.4
            }
          };
        case 'legal':
          // AT.2 — a legal chip fills the banner's designed-in
          // disclaimer slot (ensureDisclaimerSlot: the slot stays, empty
          // = the placeholder), through this same blur-fade apply path
          // as every other pick; '' is "None". §BR.3 — "None" has no
          // pool slot to reference (poolKey null) — it is this unit's
          // own choice to carry no legal line, so it writes a per-unit
          // override rather than a shared line, the same as any other
          // "Just this one": a later edit to whatever line this unit
          // used to share never silently un-clears it.
          return (banner) => {
            const inner = banner.querySelector('.pt-banner-inner');
            if (inner) ensureDisclaimerSlot(inner, value);
            const overrides = readBannerCopyOverrides(banner);
            if (poolKey !== undefined && poolKey !== null) {
              banner.setAttribute('data-legal-id', registerLineAsset('legal', poolKey, value));
              if (overrides.disclaimer !== undefined) { delete overrides.disclaimer; writeBannerCopyOverrides(banner, overrides); }
              applyLineFit(banner, 'disclaimer'); // §BR.4
            } else {
              overrides.disclaimer = value;
              writeBannerCopyOverrides(banner, overrides);
            }
          };
        default:
          return () => {};
      }
    }
    // The band's single apply path for Layout/Style/Color/Imagery/
    // Headline/CTA: "a pick applies that one value to every selected
    // unit immediately — each unit re-renders in place with the house
    // blur-fade… and the field reads the new value." Units outside
    // the selection are never even queried. poolKey (§BR.3) is the
    // pool slot Headline/CTA/Legal picks came from — see fieldMutator's
    // own comment; every other kind leaves it undefined.
    function applyFieldValueToSelection(kind, value, poolKey) {
      const cards = selectedUnitCards();
      if (!cards.length) return;
      if (kind === 'layout') pushBandLayoutUndo(cards); // §BV — the contract's one undoable field so far; Original's own call site (applyOriginalLayoutToSelection) pushes the same way
      const mutate = fieldMutator(kind, value, poolKey);
      let pending = cards.length;
      cards.forEach((card) => {
        swapCardContent(card, (banner) => {
          mutate(banner);
          pending--;
          if (!pending) {
            observeEnvVideoSrc(document.getElementById('ptConcepts')); // imagery can swap in a <video>
            syncBandFieldsUI();
          }
        });
      });
      // §BP — "picking a value applies it and closes": every pick
      // (Layout/Style/colorOverride/Imagery/Headline/CTA/Legal) funnels
      // through this one function, so closing the band lightbox here
      // covers all of them without a call at each of its call sites.
      // closeBandTray (19-sheet-c-variety.js) already no-ops when
      // nothing is open.
      closeBandTray();
    }
    // §BV — a small undo stack scoped to the band's Layout field (the
    // one field the contract asks to be undoable so far). A snapshot
    // is the scope's PRE-pick {unitId: {layout, guide, guideId}} —
    // guide/guide-id ride along since fieldMutator's own 'layout' case
    // clears them (a Layout pick breaks a brand-guide lock, AJ.2's own
    // comment above fieldMutator), so a straight undo has to put them
    // back too, not just the layout id. Never touches data-layout-
    // origin — that is fixed at generation, forever.
    let bandLayoutUndoStack = [];
    function snapshotLayoutForUndo(cards) {
      const map = {};
      cards.forEach((c) => {
        const b = cardBannerEl(c);
        map[c.dataset.unitId] = { layout: b.getAttribute('data-layout') || '', guide: b.getAttribute('data-guide'), guideId: b.getAttribute('data-guide-id') };
      });
      return map;
    }
    function pushBandLayoutUndo(cards) {
      bandLayoutUndoStack.push(snapshotLayoutForUndo(cards));
      if (bandLayoutUndoStack.length > 20) bandLayoutUndoStack.shift(); // a bound, not a real limit anyone should hit
    }
    function undoBandLayoutChange() {
      const snap = bandLayoutUndoStack.pop();
      if (!snap) return false;
      Object.keys(snap).forEach((unitId) => {
        const card = document.querySelector('#ptConcepts .pt-banner-card[data-unit-id="' + unitId + '"]');
        const banner = card && cardBannerEl(card);
        if (!banner) return;
        const rec = snap[unitId];
        banner.setAttribute('data-layout', rec.layout);
        if (rec.guide) banner.setAttribute('data-guide', rec.guide); else banner.removeAttribute('data-guide');
        if (rec.guideId) banner.setAttribute('data-guide-id', rec.guideId); else banner.removeAttribute('data-guide-id');
      });
      syncBandFieldsUI();
      return true;
    }
    // §BV — "the layout it was generated with," read off data-layout-
    // origin (bannerCardHTML writes it once, at generation); a unit
    // minted before this change carries none, so its CURRENT layout
    // counts as its origin (the decision's own "legacy" clause) —
    // reading it this way rather than backfilling the attribute keeps
    // "no origin recorded" and "origin equals today's layout" the same
    // case, which they are.
    function unitLayoutOrigin(banner) {
      return banner.getAttribute('data-layout-origin') || banner.getAttribute('data-layout') || '';
    }
    // Every unit in scope is already sitting on its own origin —
    // Original's own active-state test, reused by the Original pick's
    // no-op short-circuit isn't needed since re-writing the same value
    // is harmless, but syncBandFieldsUI (below) uses this to decide
    // whether the field reads "Original" instead of the shared-value/
    // Mixed rule every other field uses.
    function scopeIsAllOriginal(cards) {
      return cards.length > 0 && cards.every((c) => {
        const b = cardBannerEl(c);
        return b.getAttribute('data-layout') === unitLayoutOrigin(b);
      });
    }
    // §BV — Original can't reuse fieldMutator's "one value applies to
    // every card" shape (applyFieldValueToSelection): each unit reads
    // its OWN origin, which may differ unit to unit. Same blur-fade/
    // guide-clearing/undo/close-tray contract as a normal Layout pick.
    function applyOriginalLayoutToSelection() {
      const cards = selectedUnitCards();
      if (!cards.length) return;
      pushBandLayoutUndo(cards);
      let pending = cards.length;
      cards.forEach((card) => {
        swapCardContent(card, (banner) => {
          banner.setAttribute('data-layout', unitLayoutOrigin(banner));
          banner.removeAttribute('data-guide');
          banner.removeAttribute('data-guide-id');
          pending--;
          if (!pending) syncBandFieldsUI();
        });
      });
      closeBandTray();
    }
    // "Legal is on/off for the selection" (AJ.2): the Style radio
    // (Inline/Scroll) stays one sheet-wide display mode, same as Fit
    // below — re-applied to just the selection's own disclaimers
    // whenever it changes, never a full re-deal. (The legal TEXT is a
    // pick from the tray's chips since AT.2 — fieldMutator 'legal'.)
    function applyLegalStyleToSelection() {
      selectedUnitCards().forEach((card) => {
        const banner = cardBannerEl(card);
        const discl = banner && banner.querySelector('.pt-banner-disclaimer');
        if (discl) applyDisclaimerContent(discl, discl.textContent);
      });
      syncBandFieldsUI();
    }
    // Fit (Shrink to fit / Fixed size) is the same shape as Legal's
    // own Style radio — a sheet-wide display MODE, applied live to
    // just the selection's own headlines.
    function applyBodyFitToSelection() {
      selectedUnitCards().forEach((card) => {
        const banner = cardBannerEl(card);
        const h = banner && banner.querySelector('.pt-banner-headline');
        if (h) applyHeadlineFit(h, banner.getAttribute('data-size'), h.textContent);
      });
      syncBandFieldsUI();
    }
    function fieldLabelForLayout(id) { return LAYOUT_NAME[id] || id; }
    // §BT — fieldLabelForColor retired with the Colorway override group.
    function fieldLabelForImage(src) { const f = GALLERY_ITEMS.filter((g) => g.src === src)[0]; return f ? f.label : 'Photo'; }
    // "Every field shows the selection's CURRENT value when all
    // selected units share it… and 'Mixed' (subtle) when they
    // differ; no pool counts anywhere" — one writer for every count
    // slot, titled too since Headline/CTA can run long (AF's own
    // ellipsize-with-title precedent).
    function setFieldCount(id, sharedInfo, labelOf) {
      const el2 = document.getElementById(id);
      if (!el2) return;
      el2.textContent = !sharedInfo.any ? '' : sharedInfo.shared ? labelOf(sharedInfo.value) : 'Mixed';
      el2.title = el2.textContent;
      el2.classList.toggle('is-mixed', el2.textContent === 'Mixed'); // 9/15 — "Mixed" reads in the quiet voice
    }
    // Ticks only, never innerHTML — same reasoning as the old
    // syncVarietyActive (the image grid alone is 47 thumbs): a field
    // popover's rows are built once (renderBandFieldLists) and only
    // re-marked here, active on whichever row equals the selection's
    // shared value (never marked at all when Mixed).
    function syncFieldRowsActive(listEl, selector, sharedInfo, valueOf) {
      if (!listEl) return;
      Array.prototype.forEach.call(listEl.querySelectorAll(selector), (row) => {
        const on = sharedInfo.shared && valueOf(row) === sharedInfo.value;
        row.classList.toggle('is-active', on);
        row.setAttribute('aria-checked', String(on));
      });
    }
    // §BN.1 — the band itself: whenever a board is on the sheet DESIGN +
    // COPY show, selected or not — "operating on all" is the default now
    // (supersedes AJ.2/BH.2's "hidden entirely at zero selection"). Reads
    // every field's value straight off the SCOPED cards' own DOM
    // (selectedUnitCards — every unit when nothing is picked, else just
    // the selection) — never a stored pool — so it is always exactly
    // what is on the sheet right now, for whatever is in scope.
    // §BW — supersedes §BN.1's "the count lockup shows whenever a board
    // is on the sheet": the scope cell itself (ptBandScopeWrap, wrapping
    // ptBandCountGroup + ptBandSepA) now shows ONLY once 1+ units are
    // selected — collapsed via .is-collapsed (18-sheet-a.css's
    // grid-template-columns fr trick + blur-fade), never [hidden], so
    // Clear/deselect can transition it back out instead of just
    // vanishing. selectedUnitCards' own "zero selection = all" fallback
    // is unchanged — only this label's visibility moved.
    function syncBandFieldsUI() {
      const n = sheetSelection.size;
      const hasBoard = !!document.querySelector('#ptConcepts .pt-banner-card');
      const scopeWrap = document.getElementById('ptBandScopeWrap');
      const designGroup = document.getElementById('ptBandDesignGroup');
      const sepB = document.getElementById('ptBandSepB');
      const copyGroup = document.getElementById('ptBandCopyGroup');
      const sepC = document.getElementById('ptBandSepC'); // §BP folded-in (a) — the OUTPUT group's own separator; the two buttons' [hidden] rides syncPackageButton instead
      const bandEl = document.querySelector('.pt-sheet-band');
      if (bandEl) bandEl.hidden = !hasBoard; // §BN.1 — the band shows whenever a board is on the sheet, selection or not
      [designGroup, sepB, copyGroup, sepC].forEach((e) => { if (e) e.hidden = !hasBoard; });
      if (scopeWrap) scopeWrap.classList.toggle('is-collapsed', !hasBoard || n === 0); // §BW — reveals only once 1+ units are picked; collapses again at Clear, deselect-to-zero, or no board at all
      if (!hasBoard) { closeBandTray(); return; } // nothing on the sheet yet — no fields, no tray
      const scope = selectedUnitCards(); // §BN.1 — every unit when n === 0, else just the selection
      const countText = document.getElementById('ptBandCountText');
      const clearBtn = document.getElementById('ptBandClearBtn');
      if (countText) countText.textContent = (n === 0 ? 'All ' : '') + scope.length + (scope.length === 1 ? ' unit' : ' units'); // §BN.1 — "All 9 units" at zero, "N units" once 1+ are picked; kept computing even while §BW's is-collapsed hides the cell itself, since openBandTray (19-sheet-c-variety.js) reads this same node verbatim for the lightbox header's scope ("Layout · All 9 units" — §BW: "Lightbox headers keep naming scope")
      if (clearBtn) clearBtn.hidden = n === 0; // §BN.1 — no Clear link while the band is already at "all"

      // §BV — Original takes precedence over the shared-value/Mixed
      // rule every other field uses: "every unit in scope is on its
      // own origin" reads as "Original" even when those origins
      // happen to all be the same concrete layout (still Original,
      // not that layout's name) — Original owns the tile's active
      // ring in that case, never a concrete tile too.
      const layoutAllOriginal = scopeIsAllOriginal(scope);
      const layoutInfo = selectionSharedValue((c) => cardBannerEl(c).getAttribute('data-layout') || '');
      const templatesCountEl = document.getElementById('ptTemplatesCount');
      if (templatesCountEl) {
        templatesCountEl.textContent = !layoutInfo.any ? '' : layoutAllOriginal ? 'Original' : (layoutInfo.shared ? fieldLabelForLayout(layoutInfo.value) : 'Mixed');
        templatesCountEl.title = templatesCountEl.textContent;
        templatesCountEl.classList.toggle('is-mixed', templatesCountEl.textContent === 'Mixed');
      }
      syncFieldRowsActive(document.getElementById('ptTemplatesList'), '[data-variety-template]:not([data-variety-template="__original__"])', layoutAllOriginal ? { any: true, shared: false, value: null } : layoutInfo, (row) => row.dataset.varietyTemplate);
      const originalTileEl = document.querySelector('#ptTemplatesList [data-variety-template="__original__"]');
      if (originalTileEl) { originalTileEl.classList.toggle('is-active', layoutAllOriginal); originalTileEl.setAttribute('aria-checked', String(layoutAllOriginal)); }
      setTrayMixed('layouts', !layoutAllOriginal && !layoutInfo.shared);

      const styleInfo = selectionSharedValue((c) => cardBannerEl(c).getAttribute('data-guide-id') || '');
      const styleCountEl = document.getElementById('ptStyleCount');
      if (styleCountEl) {
        styleCountEl.textContent = !styleInfo.shared ? 'Mixed'
          : (styleInfo.value && SET_BRAND_BY_ID[styleInfo.value] ? (SET_BRAND_BY_ID[styleInfo.value].short || SET_BRAND_BY_ID[styleInfo.value].name) : 'None');
        styleCountEl.classList.toggle('is-mixed', styleCountEl.textContent === 'Mixed' || styleCountEl.textContent === 'None'); // 9/16 — both read in the quiet voice
      }
      syncFieldRowsActive(document.getElementById('ptStyleList'), '[data-variety-template]', styleInfo, (row) => row.dataset.varietyTemplate);
      setTrayMixed('style', !styleInfo.shared);
      // §BT — the Colorway swatch list, its "Mixed" note and the
      // STYLE field's colorway sub-value all retired: the field shows
      // the guide name (or "Mixed"/"None") only, set just above.

      const imageInfo = selectionSharedValue((c) => {
        const media = cardBannerEl(c).querySelector('.pt-banner-media img, .pt-banner-media video');
        return media ? (media.getAttribute('src') || media.getAttribute('data-src') || '') : '';
      });
      setFieldCount('ptImageSwapCount', imageInfo, fieldLabelForImage);
      syncFieldRowsActive(document.getElementById('ptImageSwapList'), '[data-variety-image]', imageInfo, (row) => row.dataset.varietyImage);
      setTrayMixed('imagery', !imageInfo.shared);

      const headlineInfo = selectionSharedValue((c) => { const h = cardBannerEl(c).querySelector('.pt-banner-headline'); return h ? h.textContent.trim() : ''; });
      setFieldCount('ptBodyCount', headlineInfo, (v) => v);
      // AL.4 — rows have no per-value data attribute (unlike Layout/
      // Color/Imagery's ids), so the match is the row's own printed
      // line, same text selectionSharedValue just read off the cards.
      syncFieldRowsActive(document.getElementById('ptBodyList'), '.pt-set-item', headlineInfo, (row) => (row.querySelector('.pt-set-item-name') || row).textContent.trim());
      setTrayMixed('headlines', !headlineInfo.shared); // AT.2 — "Mixed" leads the chips when no one line is shared (none checked)

      const ctaInfo = selectionSharedValue((c) => { const cta = cardBannerEl(c).querySelector('.pt-banner-cta'); return cta ? cta.textContent.trim() : ''; });
      setFieldCount('ptCtaCount', ctaInfo, (v) => v);
      syncFieldRowsActive(document.getElementById('ptCtaList'), '.pt-set-item', ctaInfo, (row) => (row.querySelector('.pt-set-item-name') || row).textContent.trim());
      setTrayMixed('cta', !ctaInfo.shared);

      // The dot says "a line is set on every selected unit"; the chips
      // (AT.2) mark the one line they all share — "None" when they all
      // share no line, nothing (and the Mixed note) when they differ.
      const legalOnInfo = selectionSharedValue((c) => { const d = cardBannerEl(c).querySelector('.pt-banner-disclaimer'); return !!(d && d.textContent.trim()); });
      const legalDot = document.getElementById('ptLegalCount');
      if (legalDot) { // 9/15 — a word, not a dot: the field's value voice like every other field
        legalDot.textContent = !legalOnInfo.any ? '' : legalOnInfo.shared ? (legalOnInfo.value ? 'On' : 'Off') : 'Mixed';
        legalDot.classList.toggle('is-mixed', legalDot.textContent === 'Mixed');
      }
      const legalInfo = selectionSharedValue((c) => { const d = cardBannerEl(c).querySelector('.pt-banner-disclaimer'); return d ? d.textContent.trim() : ''; });
      syncFieldRowsActive(document.getElementById('ptLegalList'), '[data-legal-i]', legalInfo, (row) => { const i = parseInt(row.dataset.legalI, 10); return i < 0 ? '' : LEGAL_LINES[i]; });
      setTrayMixed('legal', !legalInfo.shared);
    }
    // AT.2 — each tray pane's own "Mixed" note (the mono word leading
    // its row): shown when the selection doesn't share one value for
    // that field, which is exactly when none of its rows is checked.
    function setTrayMixed(tool, mixed) {
      const note = document.querySelector('#ptBandTray .pt-band-tray-pane[data-sheet-tool="' + tool + '"] [data-tray-mixed]');
      if (note) note.hidden = !mixed;
    }
    // Escape's own precedence (§AB): a popover, the Editor/Studio,
    // Package, the Selects viewer and the score rubric all close
    // themselves first (their own document keydown listeners below,
    // bubble phase) — this one runs in the CAPTURE phase so it always
    // sees the true pre-close state and only ever clears the selection
    // on a press that had nothing else to do.
    function anyPtOverlayOpen() {
      if (setOpenMenu) return true;
      if (bandTrayTool) return true; // AT.1 — the band's tray closes on Escape before the selection clears
      if (canvasOverlayOpen()) return true;
      if (document.querySelector('.pt-score-pop.is-open, .pt-styleguide-pop.is-open, .pt-share-pop.is-open, .pt-comments-pop.is-open, .pt-addsizes-pop.is-open')) return true;
      return ['ptPackage', 'ptSelectsViewer'].some((id) => {
        const el2 = document.getElementById(id);
        return el2 && el2.getAttribute('data-visible') === '1';
      });
    }
    // AJ.1 — the three ways IN: a unit's id half of its head lockup
    // (score chip excluded — it keeps its own rubric popover), a
    // concept's own label for its whole row, and the band's Select
    // all/Clear links. The banner itself still opens the Editor
    // (initPainterEditor's own handler already skips
    // .pt-banner-card-head entirely) and the shortlist "+" stays the
    // shortlist (initSelectButtons, untouched) — three different
    // clicks, three different meanings.
    function initSelectionClicks() {
      const root = document.getElementById('ptConcepts');
      if (root) {
        // §BE (9/16, Bryan: "remove the select checkbox... clicking on
        // the banner selects it") — the unit's own corner check is
        // gone; the card click below is the only way IN a unit now.
        // The row's own [data-concept-check] hook was already retired
        // 9/15 (no row checkbox renders) — its branch stays here,
        // guarded and inert, since nothing ever carries the attribute.
        root.addEventListener('click', (e) => {
          const rowCheck = e.target.closest('[data-concept-check]');
          if (rowCheck) {
            const group = rowCheck.closest('.pt-concept-group');
            if (group) { e.stopPropagation(); toggleConceptSelection(group.getAttribute('data-concept')); }
            return;
          }
          // Bryan, 9/15 ("clicking on a banner should select the check
          // box"), retargeted by §BE onto the banner alone (the check
          // is gone): a click on the unit itself — the artwork or the
          // card around it — toggles the unit (shift = the concept
          // range). The cluster's buttons, the head lockup (the
          // score's own door), the shortlist and anything editable
          // keep their own clicks.
          const card = e.target.closest('.pt-banner-card');
          if (card && card.dataset.unitId &&
              !e.target.closest('.pt-unit-tools, .pt-unit-tool, .pt-banner-card-head, .pt-select-btn, button, a, [contenteditable="true"]')) {
            if (e.shiftKey) selectConceptRangeTo(card.dataset.unitId);
            else toggleUnitSelection(card.dataset.unitId);
          }
        });
        root.addEventListener('keydown', (e) => {
          if (e.key !== 'Enter' && e.key !== ' ') return;
          // AQ.2 — the card itself is focusable: Space on it toggles its
          // selection (shift = the concept range, as a shift-click would).
          // §BE drops the checkbox's own key handling with the element.
          if (e.key === ' ' && e.target.classList && e.target.classList.contains('pt-banner-card') && e.target.dataset.unitId) {
            e.preventDefault();
            if (e.shiftKey) selectConceptRangeTo(e.target.dataset.unitId);
            else toggleUnitSelection(e.target.dataset.unitId);
            return;
          }
          const rowCheck = e.target.closest('[data-concept-check]');
          if (rowCheck) {
            const group = rowCheck.closest('.pt-concept-group');
            if (!group) return;
            e.preventDefault();
            toggleConceptSelection(group.getAttribute('data-concept'));
            return;
          }
        });
      }
      const clearBtn = document.getElementById('ptBandClearBtn');
      if (clearBtn) clearBtn.addEventListener('click', clearSheetSelection);
      document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape' || !sheetSelection.size) return;
        if (anyPtOverlayOpen()) return;
        clearSheetSelection();
      }, true);
      // §BV — ⌘Z / Ctrl+Z reverts the last band Layout pick (a concrete
      // layout or Original) when Studio isn't open — Studio's own ⌘Z
      // (20-editor-studio-b-framing2.js) already returns early off the
      // sheet, so the two never fight over the same keystroke. Same
      // "skip while typing" guard as Studio's binding.
      document.addEventListener('keydown', (e) => {
        if (inStudio) return;
        if (!(e.metaKey || e.ctrlKey) || e.shiftKey || e.key.toLowerCase() !== 'z') return;
        const active = document.activeElement;
        if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.getAttribute('contenteditable') === 'true')) return;
        if (undoBandLayoutChange()) e.preventDefault();
      });
    }

    // §BE.3 — the marquee (9/16, Bryan: "make it so I can drag and
    // multi select multiple banners at once"): a canvas-tool rubber
    // band, always crisp, never animated. A pointerdown on the
    // sheet's EMPTY space arms a drag; past 4px it becomes a marquee.
    // Candidate rings and the band's own count are a live PREVIEW
    // only — sheetSelection itself is never touched until release —
    // so Escape mid-drag just tears the preview down and
    // syncSelectionUI() repaints the truth; nothing to revert.
    // window-level listeners (not the section's own) so the gesture
    // survives the pointer leaving the section, like a real canvas
    // tool's band; setPointerCapture keeps it addressed to this
    // gesture even so.
    const MARQUEE_BLOCK_SEL = '.pt-banner-card, .pt-concept-row-head, button, a, input, textarea, select, [contenteditable="true"], .pt-sheet-band, .pt-band-tray, #ptSelectsSection, #ptSelects, #ptSelectsViewer';
    const MARQUEE_EDGE = 48; // px from the scroller's own edge that arms auto-scroll
    const MARQUEE_MAX_SPEED = 16; // px/frame at the deepest point of that margin
    let marqueeState = null;
    // Walks up from the section to whatever ancestor actually scrolls
    // it — PLAN: "#ptConceptSection is already position:relative"
    // but ".pt-sheet-main is overflow:clip — it is NOT the scroller."
    function closestScrollableAncestor(el) {
      let node = el.parentElement;
      while (node && node !== document.body) {
        const cs = getComputedStyle(node);
        if (cs.overflowY === 'auto' || cs.overflowY === 'scroll') return node;
        node = node.parentElement;
      }
      return document.scrollingElement || document.documentElement;
    }
    // The same visibility switch syncBandFieldsUI opens with, kept
    // separate from it: a drag preview only ever touches the count
    // (PLAN: "the band's count already reads the live total, so the
    // number climbs as you sweep") — never the Layout/Style/… fields
    // or the tray, which stay exactly what the last COMMITTED
    // selection set them to until the gesture actually lands.
    // §BN.1 — the band is already showing (a marquee only runs over a
    // board that's on the sheet, so hasBoard is a given here); a preview
    // of 0 candidates previews the state it would commit to (releasing
    // with nothing swept clears the selection, per BE.3's "a plain
    // marquee REPLACES the selection").
    // §BW — "marquee select triggers it too": the scope cell's own
    // reveal/collapse rides this same live candidate count, not just
    // the committed selection — sweeping past the first candidate
    // reveals it mid-drag, sweeping back down to none collapses it
    // again, exactly like syncBandFieldsUI does at commit.
    function previewBandCount(n) {
      const scopeWrap = document.getElementById('ptBandScopeWrap');
      const countText = document.getElementById('ptBandCountText');
      const clearBtn = document.getElementById('ptBandClearBtn');
      if (scopeWrap) scopeWrap.classList.toggle('is-collapsed', n === 0);
      if (countText) {
        const total = n === 0 ? document.querySelectorAll('#ptConcepts .pt-banner-card').length : n;
        countText.textContent = (n === 0 ? 'All ' : '') + total + (total === 1 ? ' unit' : ' units'); // BH.2 — matches syncBandFieldsUI's own value line; kept computing through the §BW collapse so a lightbox opened mid-drag (edge case, but cheap to keep correct) still reads a real scope
      }
      if (clearBtn) clearBtn.hidden = n === 0;
    }
    function clearMarqueeCandidateClasses() {
      Array.prototype.forEach.call(document.querySelectorAll('#ptConcepts .pt-banner-card.is-marquee-candidate'), (c) => c.classList.remove('is-marquee-candidate'));
    }
    // Recomputes the band's own rectangle AND which cards it
    // candidates — every pointermove past the 4px threshold, and
    // every auto-scroll tick. startLocal is fixed once, in the
    // section's own local coordinates (those don't shift when the
    // page scrolls — only the section's own layout would move them);
    // the CURRENT point is re-derived from the pointer's last known
    // viewport position against the section's FRESH rect each call,
    // which is what lets the band follow the content as auto-scroll
    // moves it, with no page-coordinate math needed. Clamped to the
    // section's own box (PLAN: "nothing draws outside #ptConceptSection").
    function updateMarqueeGeometry() {
      const st = marqueeState;
      if (!st || !st.armed) return;
      const rect = st.section.getBoundingClientRect();
      const curX = Math.max(0, Math.min(rect.width, st.lastClientX - rect.left));
      const curY = Math.max(0, Math.min(rect.height, st.lastClientY - rect.top));
      const x0 = Math.min(st.startLocal.x, curX), x1 = Math.max(st.startLocal.x, curX);
      const y0 = Math.min(st.startLocal.y, curY), y1 = Math.max(st.startLocal.y, curY);
      if (st.el) {
        st.el.style.left = x0 + 'px'; st.el.style.top = y0 + 'px';
        st.el.style.width = (x1 - x0) + 'px'; st.el.style.height = (y1 - y0) + 'px';
      }
      const bandLeft = rect.left + x0, bandTop = rect.top + y0, bandRight = rect.left + x1, bandBottom = rect.top + y1;
      const candidates = new Set();
      Array.prototype.forEach.call(document.querySelectorAll('#ptConcepts .pt-banner-card[data-unit-id]'), (card) => {
        const r = card.getBoundingClientRect();
        const hit = r.left < bandRight && r.right > bandLeft && r.top < bandBottom && r.bottom > bandTop; // any overlap, not containment
        card.classList.toggle('is-marquee-candidate', hit);
        if (hit) candidates.add(card.dataset.unitId);
      });
      st.candidates = candidates;
      let n = candidates.size;
      if (st.additive) st.baseSelection.forEach((id) => { if (!candidates.has(id)) n++; });
      previewBandCount(n);
    }
    function autoScrollTick() {
      const st = marqueeState;
      if (!st || !st.armed) { if (st) st.autoScrollRAF = null; return; }
      const scroller = st.scroller;
      if (scroller) {
        const r = scroller.getBoundingClientRect();
        const y = st.lastClientY;
        let dy = 0;
        if (y < r.top + MARQUEE_EDGE) dy = -MARQUEE_MAX_SPEED * ((r.top + MARQUEE_EDGE - y) / MARQUEE_EDGE);
        else if (y > r.bottom - MARQUEE_EDGE) dy = MARQUEE_MAX_SPEED * ((y - (r.bottom - MARQUEE_EDGE)) / MARQUEE_EDGE);
        if (dy) {
          const before = scroller.scrollTop;
          scroller.scrollTop = before + dy;
          if (scroller.scrollTop !== before) updateMarqueeGeometry();
        }
      }
      st.autoScrollRAF = requestAnimationFrame(autoScrollTick);
    }
    function armMarquee() {
      const st = marqueeState;
      st.armed = true;
      const el = document.createElement('div');
      el.className = 'pt-sheet-marquee';
      st.section.appendChild(el);
      st.el = el;
      st.section.style.userSelect = 'none'; // BE.3 — no accidental text selection while dragging
      st.autoScrollRAF = requestAnimationFrame(autoScrollTick);
    }
    function teardownMarqueeListeners() {
      window.removeEventListener('pointermove', onMarqueePointerMove);
      window.removeEventListener('pointerup', onMarqueePointerUp);
      window.removeEventListener('pointercancel', onMarqueePointerUp);
      window.removeEventListener('keydown', onMarqueeKeydown, true);
    }
    function endMarqueeVisuals(st) {
      if (st.autoScrollRAF) cancelAnimationFrame(st.autoScrollRAF);
      clearMarqueeCandidateClasses();
      if (st.el) st.el.remove();
      st.section.style.userSelect = '';
    }
    function onMarqueePointerMove(e) {
      const st = marqueeState;
      if (!st || e.pointerId !== st.pointerId) return;
      st.lastClientX = e.clientX; st.lastClientY = e.clientY;
      if (!st.armed) {
        if (Math.hypot(e.clientX - st.startClientX, e.clientY - st.startClientY) < 4) return;
        armMarquee();
      }
      updateMarqueeGeometry();
      e.preventDefault();
    }
    function onMarqueePointerUp(e) {
      const st = marqueeState;
      if (!st || e.pointerId !== st.pointerId) return;
      try { st.section.releasePointerCapture(e.pointerId); } catch (err) {}
      teardownMarqueeListeners();
      marqueeState = null;
      if (st.armed) {
        endMarqueeVisuals(st);
        // BE.3 — a plain marquee REPLACES the selection; shift/⌘/ctrl
        // ADDS to it (units the band swept stay selected either way —
        // this never TOGGLES an already-selected unit off).
        if (!st.additive) sheetSelection.clear();
        st.candidates.forEach((id) => sheetSelection.add(id));
        syncSelectionUI();
      } else {
        // Never passed 4px — a drag on empty space that never moved
        // is a click on nothing: it clears the selection.
        clearSheetSelection();
      }
    }
    function onMarqueeKeydown(e) {
      if (e.key !== 'Escape' || !marqueeState) return;
      e.preventDefault();
      e.stopPropagation(); // this gesture's own cancel — never reaches the document-level Escape-clears-selection listener
      const st = marqueeState;
      try { st.section.releasePointerCapture(st.pointerId); } catch (err) {}
      teardownMarqueeListeners();
      marqueeState = null;
      if (st.armed) endMarqueeVisuals(st);
      syncSelectionUI(); // repaints the true, untouched selection — the preview above never mutated sheetSelection
    }
    function initSheetMarquee() {
      const section = document.getElementById('ptConceptSection');
      if (!section) return;
      section.addEventListener('pointerdown', (e) => {
        if (document.body.classList.contains('is-painter-shared')) return; // BE.3 — off in the shared read-only view
        if (e.button !== 0) return;
        if (e.target.closest(MARQUEE_BLOCK_SEL)) return;
        // Coordinator fix (§BR.2 probe note) — the crop-pan and move-
        // parts drags on the Studio stage both already call this on
        // their own pointerdown ("no text selection… under the press",
        // 19-sheet-c-variety.js/20-editor-studio-b-framing2.js); this
        // one didn't, so a marquee drag that starts on empty sheet
        // space could still native-select whatever text the drag path
        // crossed (the BR.2 probe left the footer highlighted this
        // way) before `armed` ever turns the rubber-band on.
        e.preventDefault();
        const rect = section.getBoundingClientRect();
        marqueeState = {
          pointerId: e.pointerId,
          section,
          startClientX: e.clientX, startClientY: e.clientY,
          startLocal: {
            x: Math.max(0, Math.min(rect.width, e.clientX - rect.left)),
            y: Math.max(0, Math.min(rect.height, e.clientY - rect.top)),
          },
          lastClientX: e.clientX, lastClientY: e.clientY,
          armed: false,
          additive: !!(e.shiftKey || e.metaKey || e.ctrlKey),
          baseSelection: new Set(sheetSelection),
          scroller: closestScrollableAncestor(section),
          el: null,
          candidates: new Set(),
          autoScrollRAF: null,
        };
        try { section.setPointerCapture(e.pointerId); } catch (err) {}
        window.addEventListener('pointermove', onMarqueePointerMove);
        window.addEventListener('pointerup', onMarqueePointerUp);
        window.addEventListener('pointercancel', onMarqueePointerUp);
        window.addEventListener('keydown', onMarqueeKeydown, true);
      });
    }

    // §BO.5 — §BL's drag-select hint line (and its first-use "learned"
    // logic) retires entirely: the row head it rode on no longer names
    // its concept either (§BO.4), so a stray tip in the same slot would
    // be pointing at nothing.
    function buildConceptSheetDOM(letters, appendMode, message) {
      const container = document.getElementById('ptConcepts');
      if (!container) return;
      // AW.6 — liveBoard.layout banks the hat's Layouts pick AS BUILT
      // (mediaSetup.templates: an ORDERED LIST of up to brief.concepts
      // picks now — AW.1 — never null), so an append below deals into
      // what this board actually got, never whatever the pills hold by
      // then (the hat may have moved on to brief the NEXT board, per
      // AJ.0). .slice() — a board's own record must never alias the
      // live pills' array, or a later pick up there would silently
      // rewrite history.
      if (!appendMode) liveBoard = { boardSize: (state.sizes && state.sizes[0]) || brief.boardSize, concepts: letters.length, variants: brief.variants, layout: mediaSetup.templates.slice() };
      else if (liveBoard) liveBoard.concepts += letters.length;
      const perRow = (appendMode && liveBoard && liveBoard.variants) || brief.variants;
      // Non-append means "this is THE sheet" — clear whatever's there
      // first. Originally a no-op (every non-append caller only ever
      // ran once, against an empty container, on page load), but the
      // Media chip can now re-open the wizard after a sheet has
      // already resolved (see startFlow()); without this, a second
      // Generate would append a duplicate A/B/C underneath the first
      // instead of replacing it. Also resets the ghost tile's pending
      // flag — a fresh Generate replaces the whole sheet, so any
      // staged "3 more concepts" click from the OLD sheet is moot.
      if (!appendMode) {
        bankCurrentBoardOnce(); // 9/10 — the board being replaced stays in the sheet's history, at what it actually was, not a live preview left sitting on top of it
        assets.images = {}; assets.lines = {}; // §BR.1 — the board just banked keeps its own copy (boardSnapshot); this board starts with none referenced yet
        resetFlowCombosForGenerate(letters.length * perRow); // §BR.5 — a fresh board deals its own novel combos (or null, pools empty); an append keeps whatever the last fresh build set
        container.innerHTML = ''; conceptGhostPending = false;
        // AJ.3 — Regenerate clears the selection (a fresh board has no
        // units yet to point at); an append leaves it exactly as it was.
        sheetSelection.clear();
        selectionAnchorId = null;
      }
      const startIndex = appendMode ? container.querySelectorAll('.pt-concept-group').length : 0;
      /* 9/3 — the sheet is a grid of VARIANTS now, not one concept per
         size. Every banner on it shares ONE layout and ONE size; what
         differs down the grid is the copy and which of the user's own
         picked images the banner draws. brief.variants per row (V2,
         PLAN.md §V — was the fixed VARIANTS_PER_ROW; 3 by default, so
         an unchanged brief still reads as a 3x3 board), letters down
         the side. */
      /* A fresh generate re-seeds the header's variety sets from what
         the Chat Hat just sent; an append keeps whatever the user has
         since dialled in up there. */
      if (!appendMode) { seedSheetVariety(); renderBandFieldLists(); renderCtaList(); syncUnitCount(); }
      // AN.2/AW.6 — "Generate 3 more" deals into the board's OWN layout
      // record, not today's hat pick: explicit rather than trusting
      // sheetVariety.templates to still hold it untouched (it does, in
      // practice — nothing else re-deals it since AJ.2 — but the board
      // is the source of truth, not a side effect of what else hasn't
      // run). A Generated board (templatesIsGenerated(liveBoard.layout))
      // keeps varying, since templatesDealFor deals it the same nine
      // generics every time.
      if (appendMode && liveBoard && liveBoard.layout) sheetVariety.templates = templatesDealFor(liveBoard.layout);
      const sizeId = state.sizes[0] || '300x250';
      // AW.6 — the deal reaches the concept ROWS: every unit in a
      // concept shares that concept's own layout pick from the board's
      // banked list, repeating in order when there are more concepts
      // than picks (a 4th concept repeats from the top of a 2-pick
      // list, matching the panel's own letter badges, AW.2). Generated
      // (templatesIsGenerated — nothing picked, or the sole 'diagonal'
      // pick) keeps its existing per-UNIT flat variety instead:
      // sheetVariety.templates already holds ALL_LAYOUT_IDS for that
      // case (just above, or seedSheetVariety on a fresh build), and
      // varietyFor's own flat index drives it exactly as before.
      const dealList = (liveBoard && liveBoard.layout) ? liveBoard.layout : mediaSetup.templates;
      const dealGenerated = templatesIsGenerated(dealList);
      letters.forEach((letter, li) => {
        const group = document.createElement('div');
        group.className = 'pt-concept-group' + (appendMode ? ' pt-is-new' : '');
        const conceptIdx = startIndex + li;
        const rowLayoutId = dealGenerated ? null : templateLayoutId(dealList[conceptIdx % dealList.length]);
        const cards = [];
        for (let vi = 0; vi < perRow; vi++) {
          const flat = conceptIdx * perRow + vi;
          const v = varietyFor(flat);
          /* letter+variant is the score salt, so two cards that happen
             to share a size and layout still score independently. */
          cards.push(bannerCardHTML(sizeId, rowLayoutId !== null ? rowLayoutId : v.layout, copyPairFor(flat), { src: v.src }, letter + (vi + 1), v.colorway, null, null, v.guide));
        }
        /* 9/3 — no row header. With one layout per row it named itself
           ("A · Generated layout") three times over; now that templates
           and colorways vary WITHIN a row it would be lying, and the
           header chips say what the sheet is made of instead. */
        /* Q (9/10) — a header row is back, but a quiet one: the
           concept letter as an eyebrow, a mono meta line the rail keeps
           honest (variants · best score — see syncSheetRail). It names
           the row without describing the variants inside it. V1
           (PLAN.md §V) dropped the row's own "+ sizes" chip — Sizes'
           "Board at" now switches the whole board's size live instead
           of one row at a time (see restampBoardSize, below). */
        group.setAttribute('data-concept', letter);
        // §BO.4/.5 (colleague feedback via Bryan, 9/18) — the row's own
        // "Concept A/B/C" eyebrow retires (data-concept stays — every
        // other reader, conceptLetterOf included, keys off the group's
        // attribute, never this label) and §BL's drag-select hint line
        // retires with it; the row head stays so the row keeps its
        // spacing, and "N selected" still reads there once used.
        group.innerHTML =
          '<div class="pt-concept-head pt-concept-row-head">' +
            /* AL.7 — the row's own checkbox: on when every unit in it is
               selected, indeterminate (a dash, not a check) when only
               some are — the label itself is a plain eyebrow now, not a
               click target (see initSelectionClicks). AQ.5 — takes the
               unit corner check's own recipe (.pt-unit-check, one
               class, reused — 21-sheet-b.css scopes its position/
               visibility for this row-head context in 18-sheet-a.css);
               data-concept-check stays the stable hook initSelectionClicks/
               syncSelectionUI key off, independent of the class. */
            /* Bryan, 9/15 ("remove the checks next to the concepts"): no
               row checkbox — a row is selected unit by unit (a banner
               click, shift for a run) or with the band's Select all;
               syncSelectionUI's row-check writer and initSelectionClicks'
               data-concept-check branch stay guarded and inert. */
            '<span class="pt-concept-selected" data-concept-selected></span>' +
            '<span class="pt-concept-meta" data-concept-meta></span>' +
          '</div>' +
          /* V1 — the row's own shape follows the size actually being
             built rather than a hardcoded box, since Board at can now
             land a fresh generate at any shape in the roster. */
          '<div class="pt-shape-grid pt-no-towers"><div class="pt-shape-left">' +
            '<div class="pt-shape-row pt-shape-row-' + shapeClassFor(sizeId) + '">' + cards.join('') + '</div>' +
          '</div></div>';
        container.appendChild(group);
        Array.prototype.forEach.call(group.querySelectorAll('.pt-banner-frame'), (frame, fi) => {
          frame.style.animationDelay = (li * 90 + fi * 70) + 'ms';
        });
        syncRemoveButtons(group);
      });
      mountSelectButtons(container);
      /* The cards were built from copy pairs; a legal line or a CTA
         list set earlier in the session still applies to them. */
      Array.prototype.forEach.call(container.querySelectorAll('.pt-banner'), (b, i) => applyBannerCopyOverrides(b, i));
      syncScoreChips(container);
      syncConceptGhostTile();
      syncSelectsSection();
      syncPackageButton(); // §BO.2 — Package/Export to Figma follow the board now, not Selects
      if (!appendMode) boardsRecordNew(message); // 9/10 — the fresh board joins the history as the one on the canvas; AR.1 — named from it
      boardPreviewBanked = false; // this build (replace or append) IS the board's current truth now — the next preview edit banks fresh from here
      renderBoardsRail(); // W.1 — a build or append (its item's schematic grows a row) redraws the rail
      syncSelectionUI(); // AJ.1 — re-marks whichever cards are still selected (append) or none (a fresh build) and syncs the band
    }
