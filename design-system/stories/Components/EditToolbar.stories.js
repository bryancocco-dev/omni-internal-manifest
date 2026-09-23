/*
 * EditToolbar — verbatim extraction (Brief canvas_4 edit-mode top toolbar).
 */
import '../_extract/projects.js';
import { storiesFor } from '../_extract/lib.js';
import br from '../_extract/snippets/lease-campaign-brief-handoff.js';
import admin from '../_extract/snippets/admin.js';
import cpt from '../_extract/snippets/canvas-pdf-tables.js';

export default { title: 'Components/EditToolbar', parameters: { layout: 'fullscreen' } };

const s = storiesFor("EditToolbar");

export const Brief = { ...s('lease-campaign-brief-handoff', br.editbar), name: "Brief — edit toolbar" };
export const AdminBulk = { ...s('admin', admin.editbar_bulk, { name: 'Admin — bulk-selection toolbar' }), name: "Admin — bulk-selection toolbar" };
export const PdfTablesExport = { ...s('canvas-pdf-tables', cpt.exportbar, { name: 'PDF Tables — export action bar' }), name: "PDF Tables — export action bar" };
