/**
 * Column resizer — drag either vertical edge of the content column to make it
 * wider or narrower, exactly like the OMNI+ Canvas board stack's
 * `.stack-resizer` handles (canvas-qa / lease-campaign). The column is
 * centered, so a drag is symmetric (×2 so the grabbed edge tracks the cursor).
 * The width is session-only — it is NOT persisted, so every refresh returns
 * the column to its default width. Pointer events → works with mouse,
 * trackpad, and touch. Disabled on narrow viewports (the column fills width).
 */
/* Floor is set by the boards, not the viewport: below ~880px the scope
   table's tool cluster crowds its heading, the stat grid pinches, and the
   comment popover clips — the column must never be pinched past the point
   where components start optically breaking. */
const MIN_W = 880;
const EDGE_BUFFER = 48; // keep at least this much gutter at max width

export function initColumnResize(inner, { docRoot }) {
  const scope = () => docRoot || inner.parentElement || document.documentElement;
  const maxW = () => Math.max(MIN_W, scope().clientWidth - EDGE_BUFFER);
  const apply = (px) => inner.style.setProperty('--doc-inner-w', `${Math.round(px)}px`);

  ['left', 'right'].forEach((side) => {
    const handle = document.createElement('div');
    handle.className = `doc-resizer doc-resizer--${side}`;
    handle.dataset.side = side;
    handle.setAttribute('aria-hidden', 'true');
    handle.title = 'Drag to resize';

    let startX = 0;
    let startW = 0;
    let dragging = false;

    handle.addEventListener('pointerdown', (e) => {
      dragging = true;
      startX = e.clientX;
      startW = inner.getBoundingClientRect().width;
      handle.setPointerCapture(e.pointerId);
      document.body.classList.add('col-resizing');
      e.preventDefault();
    });

    handle.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      const sign = side === 'right' ? 1 : -1;
      apply(Math.max(MIN_W, Math.min(maxW(), startW + sign * dx * 2)));
    });

    const end = (e) => {
      if (!dragging) return;
      dragging = false;
      document.body.classList.remove('col-resizing');
      try { handle.releasePointerCapture(e.pointerId); } catch { /* ignore */ }
    };
    handle.addEventListener('pointerup', end);
    handle.addEventListener('pointercancel', end);
    // Double-click an edge to snap back to the default reading width.
    handle.addEventListener('dblclick', () => {
      inner.style.removeProperty('--doc-inner-w');
    });

    inner.appendChild(handle);
  });

  // If the viewport shrinks below the current width, ease it back in.
  window.addEventListener('resize', () => {
    const raw = Number((inner.style.getPropertyValue('--doc-inner-w') || '').replace('px', ''));
    if (raw && raw > maxW()) apply(maxW());
  });
}
