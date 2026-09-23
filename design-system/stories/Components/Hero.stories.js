/*
 * Hero — verbatim extractions (landing / brief-cover heroes, finale end-cards).
 */
import '../_extract/projects.js';
import { storiesFor, registerArchived } from '../_extract/lib.js';
import as from '../_extract/snippets/agents-store.js';
import md from '../_extract/snippets/media.js';
import br from '../_extract/snippets/lease-campaign-brief-handoff.js';
import cpt from '../_extract/snippets/canvas-pdf-tables.js';
import cqa from '../_extract/snippets/canvas-qa.js';
import gw from '../_extract/snippets/gateway-v2.js';

export default { title: 'Components/Hero', parameters: { layout: 'fullscreen' } };

const s = storiesFor("Hero");

export const AgentsStore = { ...s('agents-store', as.hero), name: "Agents Store — hero / cover board" };
// ARCHIVED — see the Archive drawer on the primary story. Restore by uncommenting; entry in _extract/curation.js
// export const Media = { ...s('media', md.hero), name: "Media — hero / cover board" };
registerArchived('media', 'hero', md.hero);
export const Brief = { ...s('lease-campaign-brief-handoff', br.hero), name: "Brief — hero / cover board" };
export const BriefEndCard = { ...s('lease-campaign-brief-handoff', br.endcard, { name: 'Brief — finale end-card' }), name: "Brief — finale end-card" };
export const PdfTablesMasthead = { ...s('canvas-pdf-tables', cpt.masthead, { name: 'PDF Tables — spec-doc masthead' }), name: "PDF Tables — spec-doc masthead" };
export const QaMoodboard = { ...s('canvas-qa', cqa.moodboard, { name: 'QA — creative moodboard' }), name: "QA — creative moodboard" };
export const GatewayHero = { ...s('gateway-v2', gw.hero, { name: 'Gateway — two-up gateway hero' }), name: "Gateway — two-up gateway hero" };
