/*
 * Drawer — verbatim extraction (Admin right-edge bulk-edit panel).
 */
import '../_extract/projects.js';
import { storiesFor } from '../_extract/lib.js';
import admin from '../_extract/snippets/admin.js';

export default { title: 'Components/Drawer', parameters: { layout: 'fullscreen' } };

const s = storiesFor("Drawer");

export const Admin = { ...s('admin', admin.drawer), name: "Admin — bulk-edit drawer" };
