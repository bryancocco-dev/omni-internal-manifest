// FILES ON THE CANVAS (Bryan: "i think files was supposed to be for files
// added to the canvas not recent projects") — the session store behind the
// palette's Files tab, redefined: one entry per FILE the user has actually
// added to this canvas through the chat composer's + attach menu
// (nodes/shared.jsx's AttachMenu `pick()` is the single registration seam —
// it covers run-asset picks and real external uploads alike, so the tab
// reflects every attach gesture with no second wiring point).
//
// Same singleton external-store shape files.js's own runtime-saves store
// (and Palette.jsx's bookmark sets) already established: module-scope array
// + subscribe/notify, read through useSyncExternalStore. Module-scope, not
// localStorage — a refresh empties it like every other session store here
// ("refresh resets", standing doctrine).
import { useSyncExternalStore } from 'react'

let canvasFiles = []
let seq = 0
const listeners = new Set()

function emit() {
  listeners.forEach((fn) => fn())
}

function subscribe(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

function getSnapshot() {
  return canvasFiles
}

// Re-attaching the same thing (same run node, or the same-named upload)
// REFRESHES its entry to the top rather than stacking duplicates — the tab
// is "what's on this canvas," a set, not an event log.
function identityKey(att) {
  return att.kind === 'run' ? `run:${att.nodeId}` : `upload:${att.subKind}:${att.name}`
}

// Called by AttachMenu's pick() with the attachment object verbatim
// ({kind:'run', nodeId, number, format, isBatch, imageUrl, poster, seed} or
// {kind:'upload', subKind, name, imageUrl?}) — stored as-is; the Files tab
// derives its own display label/thumb locally (Palette.jsx), per the app's
// duplicate-small-pieces-locally precedent.
export function addCanvasFile(attachment) {
  if (!attachment) return
  const key = identityKey(attachment)
  seq += 1
  canvasFiles = [{ id: `canvas-file-${seq}`, key, attachment }, ...canvasFiles.filter((f) => f.key !== key)]
  emit()
}

export function useCanvasFiles() {
  return useSyncExternalStore(subscribe, getSnapshot)
}
