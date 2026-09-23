/**
 * Interactive Scope Confirmation table — behavior ported from the OMNI+
 * Canvas data tables (lease-campaign 02 · Scope Confirmation):
 *
 *   - collapsible search filter with live match highlighting + row count
 *   - 3-state column sort (asc → desc → original order)
 *   - row select + select-all with indeterminate header state
 *   - 2-line cell clamp with measured smooth expand on row hover
 *   - expand-all toggle (per-cell measured max-height transitions)
 *   - kebab actions menu (Download CSV / Copy all rows / Reset)
 *   - per-row IntersectionObserver build-in on first scroll into view
 *
 * Differences from the source, deliberate: no pagination (all rows render),
 * queries are scoped to the section (no global ids, demo-safe), and the
 * observer root is the viewport (`null`) — this page scrolls the window,
 * not a canvas element.
 */

const STATUS_ORDER = { confirmed: 0, pending: 1, neutral: 2, open: 3 };

function getDataCells(row) {
  return Array.from(row.querySelectorAll('td:not(.scope-select):not(.scope-rownum)'));
}

function getCellSortValue(row, colIndex, type) {
  const cell = getDataCells(row)[colIndex];
  if (!cell) return type === 'number' ? 0 : '';
  if (cell.dataset && cell.dataset.sort != null && cell.dataset.sort !== '') {
    const n = parseFloat(cell.dataset.sort);
    if (!isNaN(n)) return n;
  }
  if (type === 'number') {
    const n = parseFloat(cell.textContent.trim().replace(/[^0-9.\-]/g, ''));
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

/* ── Filter: clear + collapse choreography, match highlighting ── */

function clearHighlights(row) {
  getDataCells(row).forEach((cell) => {
    cell.querySelectorAll('.filter-hit').forEach((span) => {
      span.replaceWith(document.createTextNode(span.textContent));
    });
    cell.normalize();
  });
}

function highlightRow(row, q) {
  if (!q) return;
  getDataCells(row).forEach((cell) => {
    const walker = document.createTreeWalker(cell, NodeFilter.SHOW_TEXT, null);
    const targets = [];
    let n;
    while ((n = walker.nextNode())) {
      if (n.nodeValue && n.nodeValue.toLowerCase().includes(q)) targets.push(n);
    }
    targets.forEach((textNode) => {
      const text = textNode.nodeValue;
      const lower = text.toLowerCase();
      const frag = document.createDocumentFragment();
      let lastIdx = 0;
      let idx;
      while ((idx = lower.indexOf(q, lastIdx)) !== -1) {
        if (idx > lastIdx) frag.appendChild(document.createTextNode(text.slice(lastIdx, idx)));
        const hit = document.createElement('span');
        hit.className = 'filter-hit';
        hit.textContent = text.slice(idx, idx + q.length);
        frag.appendChild(hit);
        lastIdx = idx + q.length;
      }
      if (lastIdx < text.length) frag.appendChild(document.createTextNode(text.slice(lastIdx)));
      textNode.parentNode.replaceChild(frag, textNode);
    });
  });
}

function setupFilter({ section, rows, countEl }) {
  const input = section.querySelector('.scope-search input');
  const searchWrap = section.querySelector('.scope-search');
  const clearBtn = section.querySelector('.scope-search-clear');
  if (!input || !searchWrap) return { reset: () => {} };
  const totalRows = rows.length;

  function setCount(visible) {
    if (!countEl) return;
    countEl.textContent = visible === totalRows ? `${totalRows} rows` : `${visible} of ${totalRows} rows`;
  }
  setCount(totalRows);

  function applyFilter() {
    const q = input.value.trim().toLowerCase();
    let visible = 0;
    rows.forEach((row) => {
      clearHighlights(row);
      const text = getDataCells(row).map((c) => c.textContent).join(' ').toLowerCase();
      const match = q === '' || text.includes(q);
      if (match) {
        row.style.display = '';
        visible++;
        if (q !== '') highlightRow(row, q);
      } else {
        row.style.display = 'none';
      }
    });
    setCount(visible);
  }
  input.addEventListener('input', applyFilter);

  /* Collapsed by default: 34×34 icon button. Click expands + focuses;
     blurring an empty input collapses back. */
  searchWrap.classList.add('collapsed');
  searchWrap.addEventListener('click', (e) => {
    if (e.target.closest('.scope-search-clear')) return;
    if (!searchWrap.classList.contains('collapsed')) return;
    searchWrap.classList.remove('collapsed');
    requestAnimationFrame(() => input.focus());
  });
  input.addEventListener('focus', () => searchWrap.classList.remove('collapsed'));
  input.addEventListener('blur', () => {
    if (input.value === '') searchWrap.classList.add('collapsed');
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      if (input.value !== '') {
        input.value = '';
        applyFilter();
      }
      input.blur();
    }
  });
  if (clearBtn) {
    clearBtn.addEventListener('click', (e) => {
      e.preventDefault();
      input.value = '';
      applyFilter();
      input.blur();
      /* mousedown on the × fires blur BEFORE click clears the value, so the
         blur handler sees stale text and skips the collapse — force it. */
      searchWrap.classList.add('collapsed');
    });
  }

  return {
    reset() {
      if (input.value !== '') {
        input.value = '';
        applyFilter();
      }
      searchWrap.classList.add('collapsed');
    },
  };
}

/* ── Sort: asc → desc → original order ── */

function setupSort({ table, tbody, rows, originalOrder }) {
  const sortButtons = table.querySelectorAll('thead .scope-sort-btn');
  sortButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const col = parseInt(btn.dataset.col, 10);
      const type = btn.dataset.type || 'text';
      const current = btn.classList.contains('sort-asc') ? 'asc'
        : btn.classList.contains('sort-desc') ? 'desc' : 'off';
      const next = current === 'off' ? 'asc' : current === 'asc' ? 'desc' : 'off';
      sortButtons.forEach((b) => b.classList.remove('sort-asc', 'sort-desc'));
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
          if (av > bv) return next === 'asc' ? 1 : -1;
          return 0;
        });
      }
      sorted.forEach((r) => tbody.appendChild(r));
    });
  });
  return {
    reset() {
      sortButtons.forEach((b) => b.classList.remove('sort-asc', 'sort-desc'));
      originalOrder.forEach((r) => tbody.appendChild(r));
    },
  };
}

/* ── Row selection — reference semantics: select-all CLEARS whenever any
   row is selected (indeterminate included), otherwise selects all. ── */

function setupSelection({ table, tbody, rows }) {
  const headerBox = table.querySelector('.scope-checkbox--header');

  function syncHeader() {
    if (!headerBox) return;
    const selected = tbody.querySelectorAll('tr.row-selected').length;
    headerBox.classList.remove('checked', 'indeterminate');
    if (selected === 0) return;
    if (selected === rows.length) headerBox.classList.add('checked');
    else headerBox.classList.add('indeterminate');
  }
  tbody.querySelectorAll('.scope-checkbox').forEach((cb) => {
    cb.addEventListener('click', (e) => {
      e.stopPropagation();
      const row = cb.closest('tr');
      if (!row) return;
      const isChecked = cb.classList.toggle('checked');
      row.classList.toggle('row-selected', isChecked);
      syncHeader();
    });
  });
  if (headerBox) {
    headerBox.addEventListener('click', (e) => {
      e.stopPropagation();
      const anySelected = tbody.querySelectorAll('tr.row-selected').length > 0;
      const target = !anySelected;
      rows.forEach((row) => {
        row.classList.toggle('row-selected', target);
        const cb = row.querySelector('.scope-checkbox');
        if (cb) cb.classList.toggle('checked', target);
      });
      syncHeader();
    });
  }
}

/* ── Cell clamp: lazy overflow detection + measured hover expand ── */

const EXPAND_DURATION = 520;

function applyCellClamp(table) {
  const cells = table.querySelectorAll('tbody td:not(.scope-select):not(.scope-rownum)');
  cells.forEach((td) => {
    if (td.querySelector('.scope-status, .scope-checkbox')) return;
    const text = td.textContent;
    if (!text || !text.trim()) return;
    td.textContent = '';
    const span = document.createElement('span');
    span.className = 'cell-clamp';
    span.textContent = text;
    td.appendChild(span);
  });

  table.querySelectorAll('tbody tr').forEach((row) => {
    let detected = false;
    let leaveTimer = null;
    row.addEventListener('mouseenter', () => {
      if (!detected) {
        detected = true;
        const allClamps = Array.from(row.querySelectorAll('.cell-clamp'));
        const overflowing = allClamps.filter((span) => span.scrollHeight > span.clientHeight + 1);
        overflowing.forEach((span) => span.classList.add('is-clamped'));
      }
      if (leaveTimer) { clearTimeout(leaveTimer); leaveTimer = null; }
      /* Batch: drop line-clamp (writes) → one reflow → read scrollHeights →
         write maxHeights, so a row never forces more than one reflow. */
      const clamped = Array.from(row.querySelectorAll('.cell-clamp.is-clamped'));
      if (clamped.length) {
        clamped.forEach((el) => {
          el.style.webkitLineClamp = 'unset';
          el.style.lineClamp = 'unset';
        });
        void row.offsetHeight;
        const targets = clamped.map((el) => el.scrollHeight);
        clamped.forEach((el, i) => { el.style.maxHeight = targets[i] + 'px'; });
      }
    });
    row.addEventListener('mouseleave', (e) => {
      /* Expand-all holds every row open — hover-out must not collapse it. */
      if (table.classList.contains('expand-all-rows')) return;
      /* Suppress collapse if the cursor is heading to the row-copy button.
         The button lives outside the row's DOM (child of the board), so
         moving onto it IS a true row.mouseleave — but UX-wise the user is
         still "with" the row, so keep it expanded. The button's own
         mouseleave collapses if the cursor genuinely leaves both. */
      const tableBoardEl = table.closest('.doc-section--table');
      const cBtn = tableBoardEl && tableBoardEl.querySelector('.row-copy-btn');
      if (cBtn && e && e.relatedTarget &&
          (e.relatedTarget === cBtn || cBtn.contains(e.relatedTarget))) {
        return;
      }
      /* Right-padding-gutter check — if the cursor sits in the board's
         right padding at this row's Y level, treat it as still hovering. */
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
      row.querySelectorAll('.cell-clamp.is-clamped').forEach((el) => { el.style.maxHeight = ''; });
      if (leaveTimer) clearTimeout(leaveTimer);
      leaveTimer = setTimeout(() => {
        row.querySelectorAll('.cell-clamp.is-clamped').forEach((el) => {
          el.style.webkitLineClamp = '';
          el.style.lineClamp = '';
        });
        leaveTimer = null;
      }, EXPAND_DURATION);
    });
  });
}

/* ── Expand-all toggle ── */

function setupExpandAll({ section, table }) {
  const expandBtn = section.querySelector('.scope-expand-toggle');
  if (!expandBtn) return;
  let shrinkTimer = null;
  let overflowDetected = false;

  function detectOverflowOnce() {
    if (overflowDetected) return;
    overflowDetected = true;
    Array.from(table.querySelectorAll('.cell-clamp'))
      .filter((span) => !span.classList.contains('is-clamped') && span.scrollHeight > span.clientHeight + 1)
      .forEach((span) => span.classList.add('is-clamped'));
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
      /* Measure each cell's natural height first, then transition from the
         3em base to that exact target — matched duration, no jump cut. */
      const clamped = Array.from(table.querySelectorAll('.cell-clamp.is-clamped'));
      clamped.forEach((el) => {
        el.style.webkitLineClamp = 'unset';
        el.style.lineClamp = 'unset';
        el.style.maxHeight = '';
      });
      void table.offsetHeight;
      const heights = clamped.map((el) => el.scrollHeight);
      table.classList.add('expand-all-rows');
      expandBtn.classList.add('active');
      expandBtn.setAttribute('aria-pressed', 'true');
      requestAnimationFrame(() => {
        clamped.forEach((el, i) => { el.style.maxHeight = heights[i] + 'px'; });
      });
    } else {
      table.classList.remove('expand-all-rows');
      table.classList.add('expand-all-rows-shrinking');
      table.querySelectorAll('.cell-clamp.is-clamped').forEach((el) => { el.style.maxHeight = ''; });
      expandBtn.classList.remove('active');
      expandBtn.setAttribute('aria-pressed', 'false');
      shrinkTimer = setTimeout(() => {
        table.classList.remove('expand-all-rows-shrinking');
        table.querySelectorAll('.cell-clamp.is-clamped').forEach((el) => {
          el.style.webkitLineClamp = '';
          el.style.lineClamp = '';
        });
        shrinkTimer = null;
      }, 360);
    }
  });
}

/* ── Kebab actions menu ── */

function setupMenu({ section, table, tbody, onReset }) {
  const wrap = section.querySelector('.scope-menu-wrap');
  if (!wrap) return;
  const menuBtn = wrap.querySelector('.scope-menu-btn');
  const menu = wrap.querySelector('.scope-menu');

  function setMenuOpen(open) {
    menu.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
  }
  menuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    setMenuOpen(!menu.classList.contains('open'));
  });
  document.addEventListener('click', (e) => {
    if (!wrap.contains(e.target) && menu.classList.contains('open')) setMenuOpen(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.classList.contains('open')) {
      setMenuOpen(false);
      menuBtn.focus();
    }
  });

  function getHeaders() {
    return Array.from(table.querySelectorAll('thead th'))
      .filter((th) => !th.classList.contains('scope-rownum-th') && !th.classList.contains('scope-select-th'))
      .map((th) => th.textContent.trim().replace(/\s+/g, ' '));
  }
  function getVisibleRows() {
    return Array.from(tbody.querySelectorAll('tr'))
      .filter((r) => r.style.display !== 'none')
      .map((row) => getDataCells(row).map((td) => td.textContent.trim().replace(/\s+/g, ' ')));
  }
  function downloadCSV() {
    const all = [getHeaders()].concat(getVisibleRows());
    const csv = all.map((row) => row.map((cell) => '"' + String(cell).replace(/"/g, '""') + '"').join(',')).join('\n');
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
    const text = getVisibleRows().map((r) => r.filter(Boolean).join('  ·  ')).join('\n');
    try {
      await navigator.clipboard.writeText(text);
    } catch (_) {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch (__) { /* no-op */ }
      document.body.removeChild(ta);
    }
  }

  wrap.querySelectorAll('.scope-menu-item').forEach((item) => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      const action = item.dataset.action;
      if (action === 'download-csv') downloadCSV();
      else if (action === 'copy-all') copyAll();
      else if (action === 'reset') onReset();
      setMenuOpen(false);
    });
  });
}

/* ── Row-hover copy affordance — one floating button per board, riding the
   right padding gutter. Ported whole from the reference: predictive
   positioning (the button slides to where the row's center WILL be after
   its cell-clamp expansion), an expanding-slide easing that matches the
   520ms clamp curve for big expansions, invisible row extenders that make
   the gutter part of each row's DOM, and selection-aware multi-copy. ── */

const COPY_ICON_SVG = '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true">'
  + '<rect x="4.5" y="4.5" width="8" height="9" rx="1.5" stroke="currentColor" stroke-width="1.4"/>'
  + '<path d="M3 11.5V4a2 2 0 0 1 2-2h6.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>'
  + '</svg>';
const CHECK_ICON_SVG = '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true">'
  + '<path d="M3.5 8L6.5 11L12.5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
  + '</svg>';

function attachRowCopy(board, table, tbody) {
  if (!tbody.querySelector('tr')) return;
  const hasSelection = board.querySelector('.scope-checkbox') !== null;

  /* Extenders: project each row's DOM 48px into the right gutter so
     tr:hover / mouseenter / mouseleave fire naturally as the cursor moves
     through it — no hit-testing, no mousemove handler. */
  tbody.querySelectorAll('tr').forEach((row) => {
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

  /* predict=true (hover, user intent): slide UPFRONT to the row's post-
     expansion center. predict=false (ResizeObserver, layout tracking):
     current measurements only — during a collapse the cellDelta still reads
     positive, and predicting would pin the button to the stale expanded
     center while the row shrinks under it. */
  function positionToRow(row, predict) {
    const boardRect = board.getBoundingClientRect();
    const rowRect = row.getBoundingClientRect();
    let height = rowRect.height;
    let willExpand = false;
    let maxCellDelta = 0;
    if (predict) {
      row.querySelectorAll('.cell-clamp').forEach((el) => {
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
    /* The slow matched slide only for single big expansions (≥80px); rapid
       row hops keep the snappy 260ms default. */
    btn.classList.toggle('expanding-slide', willExpand && maxCellDelta >= 80);
    const top = rowRect.top + height / 2 - boardRect.top;
    btn.style.top = `${top}px`;
  }
  function selectedCount() {
    return hasSelection ? tbody.querySelectorAll('tr.row-selected').length : 0;
  }
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

  /* Selection changes while visible → live count update. */
  if (hasSelection && 'MutationObserver' in window) {
    const mo = new MutationObserver(() => {
      if (!btn.classList.contains('copied')) renderBtn();
    });
    mo.observe(tbody, { attributes: true, subtree: true, attributeFilter: ['class'] });
  }

  /* mouseover bubbles — one board-level listener catches row transitions. */
  board.addEventListener('mouseover', (e) => {
    if (e.target === btn || btn.contains(e.target)) return;
    const row = e.target.closest('tbody tr');
    if (!row || !board.contains(row)) {
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
  /* Another row mid-collapse shifts the active row's top — follow it.
     Skips while the active row itself is mid-expansion so the initial
     predicted slide isn't fought by intermediate frames. */
  if ('ResizeObserver' in window) {
    let pendingFrame = null;
    const ro = new ResizeObserver(() => {
      if (!activeRow || !btn.classList.contains('visible')) return;
      const midExpansion = Array.from(activeRow.querySelectorAll('.cell-clamp')).some((el) =>
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
    activeRow = null;
    btn.classList.remove('visible');
    resetCopyIcon();
  });

  /* Row → button hop: re-fire mouseenter so an in-flight collapse cancels
     and the row eases back open. */
  btn.addEventListener('mouseenter', () => {
    if (!activeRow) return;
    activeRow.dispatchEvent(new MouseEvent('mouseenter', { bubbles: false }));
  });
  /* Leaving the button anywhere but back into the row collapses it. */
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
    let rowsToCopy;
    if (hasSelection && selectedCount() > 0) {
      rowsToCopy = Array.from(tbody.querySelectorAll('tr.row-selected'));
    } else if (activeRow) {
      rowsToCopy = [activeRow];
    } else {
      return;
    }
    const lines = rowsToCopy.map((row) => {
      const cells = Array.from(row.querySelectorAll('td:not(.scope-select):not(.scope-rownum)'));
      return cells.map((c) => c.textContent.trim().replace(/\s+/g, ' ')).filter(Boolean).join('  ·  ');
    });
    const text = lines.join('\n');
    try {
      await navigator.clipboard.writeText(text);
    } catch (_) {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch (__) { /* no-op */ }
      document.body.removeChild(ta);
    }
    renderBtn({ copied: true });
    if (copiedTimer) clearTimeout(copiedTimer);
    copiedTimer = setTimeout(resetCopyIcon, 1200);
  });
}

/* ── Row build-in — per-row IO against the VIEWPORT (root: null; this page
   scrolls the window). Rows entering in the same batch stagger 80ms apart
   so a fully-visible table still builds as a cascade. ── */

function initRowBuildIn(section, rows) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || !('IntersectionObserver' in window)) return;
  /* Arm AFTER we know the observer will run — an unarmed board renders its
     rows visible, so a JS failure can never strand an invisible table. */
  section.classList.add('doc-scope--armed');
  const io = new IntersectionObserver((entries) => {
    const entering = entries.filter((e) => e.isIntersecting);
    entering.forEach((entry, i) => {
      io.unobserve(entry.target);
      /* Defer at least one frame so the preanimate state paints; batch-mates
         cascade 80ms apart. */
      setTimeout(() => {
        requestAnimationFrame(() => entry.target.classList.add('row-anim-in'));
      }, i * 80);
    });
  }, {
    root: null,
    rootMargin: '0px 0px -6% 0px',
    threshold: 0.18,
  });
  rows.forEach((r) => io.observe(r));
}

/**
 * @param {HTMLElement} section - the rendered `.doc-section--table` board
 */
export function initScopeTable(section) {
  const table = section.querySelector('.scope-table');
  const tbody = table && table.querySelector('tbody');
  if (!table || !tbody) return;
  const rows = Array.from(tbody.querySelectorAll('tr'));
  const originalOrder = rows.slice();
  const countEl = section.querySelector('.scope-search-count');

  const filter = setupFilter({ section, rows, countEl });
  const sort = setupSort({ table, tbody, rows, originalOrder });
  setupSelection({ table, tbody, rows });
  applyCellClamp(table);
  setupExpandAll({ section, table });
  attachRowCopy(section, table, tbody);
  setupMenu({
    section, table, tbody,
    onReset() {
      filter.reset();
      sort.reset();
      rows.forEach((r) => { r.style.display = ''; });
    },
  });
  initRowBuildIn(section, rows);
}
