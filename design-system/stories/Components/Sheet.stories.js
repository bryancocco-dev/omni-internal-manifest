/*
 * Sheet — verbatim extractions (PDF Tables' miniature "printed page" mockups,
 * before/after the wide-table fit ladder is applied).
 */
import '../_extract/projects.js';
import { storiesFor } from '../_extract/lib.js';
import cpt from '../_extract/snippets/canvas-pdf-tables.js';

export default { title: 'Components/Sheet', parameters: { layout: 'fullscreen' } };

const s = storiesFor("Sheet");

export const Broken = { ...s('canvas-pdf-tables', cpt.sheet_broken, { name: 'PDF Tables — broken export (before)' }), name: "PDF Tables — broken export (before)" };
export const Fixed = { ...s('canvas-pdf-tables', cpt.sheet_fixed, { name: 'PDF Tables — fixed export (after)' }), name: "PDF Tables — fixed export (after)" };
