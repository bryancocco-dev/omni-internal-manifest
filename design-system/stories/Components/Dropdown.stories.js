/*
 * Dropdown — verbatim extractions (model / image-model selectors, overflow menus).
 */
import '../_extract/projects.js';
import { storiesFor } from '../_extract/lib.js';
import as from '../_extract/snippets/agents-store.js';
import ch from '../_extract/snippets/chat-hat.js';
import md from '../_extract/snippets/media.js';
import br from '../_extract/snippets/lease-campaign-brief-handoff.js';
import ce from '../_extract/snippets/canvas-exports.js';
import cg from '../_extract/snippets/canvas-graphics.js';
import tr from '../_extract/snippets/translations.js';

export default { title: 'Components/Dropdown', parameters: { layout: 'fullscreen' } };

const s = storiesFor("Dropdown");

export const AgentsStore = { ...s('agents-store', as.dropdown), name: "Agents Store — dropdown selector" };
export const ChatHat = { ...s('chat-hat', ch.dropdown), name: "Chat Hat — dropdown selector" };
export const Media = { ...s('media', md.dropdown), name: "Media — dropdown selector" };
export const Brief = { ...s('lease-campaign-brief-handoff', br.dropdown), name: "Brief — dropdown selector" };
export const ExportsTitleExport = { ...s('canvas-exports', ce.dropdown_titleexport, { name: 'Exports — title-bar export menu' }), name: "Exports — title-bar export menu" };
export const ExportsTitleExportGenerating = { ...s('canvas-exports', ce.dropdown_titleexport_generating, { name: 'Exports — export in progress' }), name: "Exports — export in progress" };
export const ExportsTitleExportDone = { ...s('canvas-exports', ce.dropdown_titleexport_done, { name: 'Exports — export done' }), name: "Exports — export done" };
export const GraphicsStylePill = { ...s('canvas-graphics', cg.dropdown_stylepill, { name: 'Graphics — style pill selector' }), name: "Graphics — style pill selector" };
export const TranslationsLanguage = { ...s('translations', tr.dropdown_language, { name: 'Translations — language picker' }), name: "Translations — language picker" };
