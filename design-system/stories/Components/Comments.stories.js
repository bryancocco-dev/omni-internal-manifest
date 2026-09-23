/*
 * Comments — verbatim extractions (Canvas Share Demos' inline comment pin +
 * popover, and the aggregated comments sidebar, on a published read-only canvas).
 */
import '../_extract/projects.js';
import { storiesFor } from '../_extract/lib.js';
import csd from '../_extract/snippets/canvas-share-demos.js';

export default { title: 'Components/Comments', parameters: { layout: 'fullscreen' } };

const s = storiesFor("Comments");

export const Pin = { ...s('canvas-share-demos', csd.commentpin, { name: 'Share Demos — inline comment pin' }), name: "Share Demos — inline comment pin" };
export const Panel = { ...s('canvas-share-demos', csd.commentspanel, { name: 'Share Demos — comments sidebar' }), name: "Share Demos — comments sidebar" };
