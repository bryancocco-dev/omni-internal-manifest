/*
 * NumberedList — verbatim extractions (numbered observation lists).
 */
import '../_extract/projects.js';
import { storiesFor } from '../_extract/lib.js';
import md from '../_extract/snippets/media.js';
import br from '../_extract/snippets/lease-campaign-brief-handoff.js';
import cpt from '../_extract/snippets/canvas-pdf-tables.js';

export default { title: 'Components/NumberedList', parameters: { layout: 'fullscreen' } };

const s = storiesFor("NumberedList");

export const Media = { ...s('media', md.numberedlist), name: "Media — numbered list" };
export const Brief = { ...s('lease-campaign-brief-handoff', br.numberedlist), name: "Brief — numbered list" };
export const PdfTablesFlagged = { ...s('canvas-pdf-tables', cpt.numberedlist_flagged, { name: 'PDF Tables — flagged failure legend' }), name: "PDF Tables — flagged failure legend" };
