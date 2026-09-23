/*
 * Reply — verbatim extraction (PDF Tables' drafted stakeholder-reply card).
 */
import '../_extract/projects.js';
import { storiesFor } from '../_extract/lib.js';
import cpt from '../_extract/snippets/canvas-pdf-tables.js';

export default { title: 'Components/Reply', parameters: { layout: 'fullscreen' } };

const s = storiesFor("Reply");

export const PdfTables = { ...s('canvas-pdf-tables', cpt.reply), name: "PDF Tables — drafted stakeholder reply" };
