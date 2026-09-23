/*
 * Chip — verbatim extractions. Several projects share the .chat-aux-chip pill
 * plus table status / metric-delta variants; all are kept as sibling stories.
 */
import '../_extract/projects.js';
import { storiesFor, registerArchived } from '../_extract/lib.js';
import as from '../_extract/snippets/agents-store.js';
import ch from '../_extract/snippets/chat-hat.js';
import ab from '../_extract/snippets/omni-agent-builder.js';
import md from '../_extract/snippets/media.js';
import br from '../_extract/snippets/lease-campaign-brief-handoff.js';
import cbe from '../_extract/snippets/canvas-book-ends.js';
import ptw from '../_extract/snippets/publish-to-workspace.js';

export default { title: 'Components/Chip', parameters: { layout: 'fullscreen' } };

const s = storiesFor("Chip");

export const AgentsStore = { ...s('agents-store', as.chip), name: "Agents Store — chip / pill" };
export const ChatHat = { ...s('chat-hat', ch.chip), name: "Chat Hat — chip / pill" };
export const ChatHatStatus = { ...s('chat-hat', ch.chip_scopestatus, { name: 'Chat Hat — status pills' }), name: "Chat Hat — status pills" };
export const ChatHatDelta = { ...s('chat-hat', ch.chip_metricdelta, { name: 'Chat Hat — metric delta' }), name: "Chat Hat — metric delta" };
export const AgentBuilder = { ...s('omni-agent-builder', ab.chip), name: "Agent Builder — chip / pill" };
// ARCHIVED — see the Archive drawer on the primary story. Restore by uncommenting; entry in _extract/curation.js
// export const Media = { ...s('media', md.chip), name: "Media — chip / pill" };
registerArchived('media', 'chip', md.chip);
// ARCHIVED — see the Archive drawer on the primary story. Restore by uncommenting; entry in _extract/curation.js
// export const MediaStatus = { ...s('media', md.chip_scopestatus, { name: 'Media — status pills' }), name: "Media — status pills" };
registerArchived('media', 'chip_scopestatus', md.chip_scopestatus);
// ARCHIVED — see the Archive drawer on the primary story. Restore by uncommenting; entry in _extract/curation.js
// export const MediaDelta = { ...s('media', md.chip_metricdelta, { name: 'Media — metric delta' }), name: "Media — metric delta" };
registerArchived('media', 'chip_metricdelta', md.chip_metricdelta);
// ARCHIVED — see the Archive drawer on the primary story. Restore by uncommenting; entry in _extract/curation.js
// export const Brief = { ...s('lease-campaign-brief-handoff', br.chip), name: "Brief — chip / pill" };
registerArchived('lease-campaign-brief-handoff', 'chip', br.chip);
export const BookEndsVariantGrid = { ...s('canvas-book-ends', cbe.chip_variantgrid, { name: 'Book Ends — variant-picker chip grid' }), name: "Book Ends — variant-picker chip grid" };
export const PublishPublished = { ...s('publish-to-workspace', ptw.chip_published, { name: 'Publish — published receipt chip' }), name: "Publish — published receipt chip" };
