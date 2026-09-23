/*
 * Cards — verbatim extractions, grouped so the same component across projects
 * sits side by side. Each story is the REAL markup + REAL CSS from its source
 * project, rendered in an isolated iframe. See _extract/lib.js.
 */
import '../_extract/projects.js';
import { storiesFor, registerArchived } from '../_extract/lib.js';
import as from '../_extract/snippets/agents-store.js';
import ch from '../_extract/snippets/chat-hat.js';
import ab from '../_extract/snippets/omni-agent-builder.js';
import md from '../_extract/snippets/media.js';
import br from '../_extract/snippets/lease-campaign-brief-handoff.js';
import admin from '../_extract/snippets/admin.js';
import cbe from '../_extract/snippets/canvas-book-ends.js';
import cg from '../_extract/snippets/canvas-graphics.js';
import cqa from '../_extract/snippets/canvas-qa.js';
import ms from '../_extract/snippets/media-skills.js';
import gw from '../_extract/snippets/gateway-v2.js';
import ptw from '../_extract/snippets/publish-to-workspace.js';
import th from '../_extract/snippets/themes.js';

export default { title: 'Components/Cards', parameters: { layout: 'fullscreen' } };

const s = storiesFor("Cards");

export const AgentsStore = { ...s('agents-store', as.card), name: "Agents Store — content card" };
// ARCHIVED — see the Archive drawer on the primary story. Restore by uncommenting; entry in _extract/curation.js
// export const ChatHat = { ...s('chat-hat', ch.card), name: "Chat Hat — content card" };
registerArchived('chat-hat', 'card', ch.card);
export const AgentBuilder = { ...s('omni-agent-builder', ab.card), name: "Agent Builder — content card" };
export const Media = { ...s('media', md.card), name: "Media — content card" };
export const MediaPersona = { ...s('media', md.card_persona, { name: 'Media — persona hero' }), name: "Media — persona hero" };
export const MediaGraphics = { ...s('media', md.card_graphics, { name: 'Media — graphics card' }), name: "Media — graphics card" };
export const Brief = { ...s('lease-campaign-brief-handoff', br.card), name: "Brief — content card" };
export const AdminMosaic = { ...s('admin', admin.card_mosaic, { name: 'Admin — leadspace image mosaic' }), name: "Admin — leadspace image mosaic" };
export const BookEndsFanlight = { ...s('canvas-book-ends', cbe.card_fanlight, { name: 'Book Ends — FANLIGHT cover card' }), name: "Book Ends — FANLIGHT cover card" };
export const GraphicsPhotoShoot = { ...s('canvas-graphics', cg.card_photoshoot, { name: 'Graphics — photo shoot card' }), name: "Graphics — photo shoot card" };
export const QaAudience = { ...s('canvas-qa', cqa.audiencecard, { name: 'QA — audience list card' }), name: "QA — audience list card" };
export const MediaSkillsAudience = { ...s('media-skills', ms.card_audience, { name: 'Media Skills — audience list card' }), name: "Media Skills — audience list card" };
export const GatewayRanked = { ...s('gateway-v2', gw.card_ranked, { name: 'Gateway — ranked asset manifest card' }), name: "Gateway — ranked asset manifest card" };
export const GatewayVoice = { ...s('gateway-v2', gw.card_voice, { name: 'Gateway — testimonial voice card' }), name: "Gateway — testimonial voice card" };
export const PublishCard = { ...s('publish-to-workspace', ptw.card_published, { name: 'Publish — published gateway tile' }), name: "Publish — published gateway tile" };
export const PublishCardWide = { ...s('publish-to-workspace', ptw.card_published_wide, { name: 'Publish — published gateway tile (wide, live chart)' }), name: "Publish — published gateway tile (wide, live chart)" };
export const ThemesSwatch = { ...s('themes', th.card_themeswatch, { name: 'Themes — workspace swatch card' }), name: "Themes — workspace swatch card" };
