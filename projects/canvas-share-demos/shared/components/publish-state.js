/**
 * Publish state — the one source of truth for "is this canvas published to the
 * workspace". Two surfaces read it (the header button next to Download, and
 * the workspace row in the Share modal), so publishing from either lights the
 * other. In-memory only: a refresh resets to unpublished, like every other
 * demo state on this page. No backend — publish() just takes a beat.
 *
 * status: 'idle' | 'busy' | 'published'
 */
const PUBLISH_MS = 900;

let status = 'idle';
const listeners = new Set();

function set(next) {
  if (next === status) return;
  status = next;
  listeners.forEach((cb) => cb(status));
}

export function getPublishStatus() { return status; }

/** Subscribe; fires immediately with the current status. Returns unsubscribe. */
export function onPublishChange(cb) {
  listeners.add(cb);
  cb(status);
  return () => listeners.delete(cb);
}

export function publish() {
  if (status !== 'idle') return;
  set('busy');
  setTimeout(() => set('published'), PUBLISH_MS);
}

export function unpublish() {
  if (status !== 'published') return;
  set('idle');
}
