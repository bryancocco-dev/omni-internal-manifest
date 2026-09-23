/*
 * Editor — verbatim extraction (Admin live syntax-highlighted JSON editor panel).
 */
import '../_extract/projects.js';
import { storiesFor } from '../_extract/lib.js';
import admin from '../_extract/snippets/admin.js';

export default { title: 'Components/Editor', parameters: { layout: 'fullscreen' } };

const s = storiesFor("Editor");

export const Admin = { ...s('admin', admin.code_jsoneditor), name: "Admin — JSON editor panel" };
