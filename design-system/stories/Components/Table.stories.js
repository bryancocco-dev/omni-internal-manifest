/*
 * Table — verbatim extractions (metrics / scope / roadmap / source tables).
 */
import '../_extract/projects.js';
import { storiesFor, registerArchived } from '../_extract/lib.js';
import ch from '../_extract/snippets/chat-hat.js';
import ab from '../_extract/snippets/omni-agent-builder.js';
import md from '../_extract/snippets/media.js';
import br from '../_extract/snippets/lease-campaign-brief-handoff.js';
import admin from '../_extract/snippets/admin.js';
import cpt from '../_extract/snippets/canvas-pdf-tables.js';
import gw from '../_extract/snippets/gateway-v2.js';
import ms from '../_extract/snippets/media-skills.js';
import tr from '../_extract/snippets/translations.js';

export default { title: 'Components/Table', parameters: { layout: 'fullscreen' } };

const s = storiesFor("Table");

// ARCHIVED — see the Archive drawer on the primary story. Restore by uncommenting; entry in _extract/curation.js
// export const ChatHat = { ...s('chat-hat', ch.table), name: "Chat Hat — data table" };
registerArchived('chat-hat', 'table', ch.table);
export const AgentBuilder = { ...s('omni-agent-builder', ab.table), name: "Agent Builder — data table" };
export const Media = { ...s('media', md.table), name: "Media — data table" };
export const MediaScope = { ...s('media', md.table_scope, { name: 'Media — scope table' }), name: "Media — scope table" };
export const MediaBib = { ...s('media', md.table_bib, { name: 'Media — roadmap table' }), name: "Media — roadmap table" };
export const Brief = { ...s('lease-campaign-brief-handoff', br.table), name: "Brief — data table" };
export const BriefBib = { ...s('lease-campaign-brief-handoff', br.table_bib, { name: 'Brief — source table' }), name: "Brief — source table" };
export const Admin = { ...s('admin', admin.table_users, { name: 'Admin — users table' }), name: "Admin — users table" };
export const PdfTablesContinuation = { ...s('canvas-pdf-tables', cpt.table_continuation, { name: 'PDF Tables — column-group continuation' }), name: "PDF Tables — column-group continuation" };
export const GatewayAlloc = { ...s('gateway-v2', gw.table_alloc, { name: 'Gateway — allocation table' }), name: "Gateway — allocation table" };
export const MediaSkillsSource = { ...s('media-skills', ms.table_source, { name: 'Media Skills — source inventory table' }), name: "Media Skills — source inventory table" };
export const TranslationsRtl = { ...s('translations', tr.table_rtl, { name: 'Translations — RTL table' }), name: "Translations — RTL table" };
export const TranslationsNumerals = { ...s('translations', tr.table_numerals, { name: 'Translations — localized numerals' }), name: "Translations — localized numerals" };
