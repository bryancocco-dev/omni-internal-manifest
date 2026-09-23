/*
 * Ladder — verbatim extractions (PDF Tables' 4-step wide-table fit ladder and
 * its paired rung picker + live measurement readout).
 */
import '../_extract/projects.js';
import { storiesFor } from '../_extract/lib.js';
import cpt from '../_extract/snippets/canvas-pdf-tables.js';

export default { title: 'Components/Ladder', parameters: { layout: 'fullscreen' } };

const s = storiesFor("Ladder");

export const Steps = { ...s('canvas-pdf-tables', cpt.ladder), name: "PDF Tables — fit ladder" };
export const RungControls = { ...s('canvas-pdf-tables', cpt.rung_controls, { name: 'PDF Tables — rung picker + readout' }), name: "PDF Tables — rung picker + readout" };
