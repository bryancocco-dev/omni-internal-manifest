/*
 * Collab — verbatim extractions (Canvas Collab's audience-facing affordances:
 * ask sidecar, auto-FAQ board, inline edit-in-place, add-a-section composer).
 */
import '../_extract/projects.js';
import { storiesFor } from '../_extract/lib.js';
import cc from '../_extract/snippets/canvas-collab.js';

export default { title: 'Components/Collab', parameters: { layout: 'fullscreen' } };

const s = storiesFor("Collab");

export const AskPanel = { ...s('canvas-collab', cc.ask_panel, { name: 'Collab — Ask sidecar panel' }), name: "Collab — Ask sidecar panel" };
export const Faq = { ...s('canvas-collab', cc.faq, { name: 'Collab — auto-FAQ board' }), name: "Collab — auto-FAQ board" };
export const EditField = { ...s('canvas-collab', cc.editfield, { name: 'Collab — inline edit-in-place' }), name: "Collab — inline edit-in-place" };
export const AddSection = { ...s('canvas-collab', cc.addsection, { name: 'Collab — add-a-section composer' }), name: "Collab — add-a-section composer" };
