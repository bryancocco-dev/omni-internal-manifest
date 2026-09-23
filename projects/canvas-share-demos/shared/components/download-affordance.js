/**
 * Download affordance — a file-card control that looks like every other
 * "grab the doc" button in a shared-doc product. Functionally real: clicking
 * it generates the report as a Markdown file client-side and downloads it,
 * so the control isn't just decorative.
 */
export function triggerDownload(filename, text) {
  const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * @param {HTMLElement} mount
 * @param {{label:string, filename:string, filesize:string, format?:string}} meta
 * @param {() => string} buildText - lazily builds the file contents on click
 */
export function renderDownloadAffordance(mount, meta, buildText) {
  const card = document.createElement('button');
  card.type = 'button';
  card.className = 'doc-download';
  card.innerHTML = `
    <span class="doc-download__icon">
      <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2.5v8m0 0L4.5 7m3.5 3.5L11.5 7M2.5 13.5h11"/></svg>
    </span>
    <span class="doc-download__text">
      <span class="doc-download__label">${meta.label}</span>
      <span class="doc-download__meta">${meta.format || 'Markdown'} · ${meta.filesize}</span>
    </span>
    <span class="doc-download__state"></span>`;

  const stateEl = card.querySelector('.doc-download__state');

  card.addEventListener('click', () => {
    card.classList.add('is-busy');
    stateEl.textContent = 'Preparing…';
    setTimeout(() => {
      triggerDownload(meta.filename, buildText());
      card.classList.remove('is-busy');
      card.classList.add('is-done');
      stateEl.textContent = 'Downloaded';
      setTimeout(() => {
        card.classList.remove('is-done');
        stateEl.textContent = '';
      }, 2200);
    }, 500);
  });

  mount.appendChild(card);
  return card;
}
