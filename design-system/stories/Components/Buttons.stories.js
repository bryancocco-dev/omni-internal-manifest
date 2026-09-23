/*
 * Buttons — verbatim extractions, one export per source project.
 */
import '../_extract/projects.js';
import { storiesFor, registerArchived } from '../_extract/lib.js';
import as from '../_extract/snippets/agents-store.js';
import ch from '../_extract/snippets/chat-hat.js';
import ab from '../_extract/snippets/omni-agent-builder.js';
import md from '../_extract/snippets/media.js';
import br from '../_extract/snippets/lease-campaign-brief-handoff.js';
import cg from '../_extract/snippets/canvas-graphics.js';
import om from '../_extract/snippets/omni-manifest.js';

export default { title: 'Components/Buttons', parameters: { layout: 'fullscreen' } };

const s = storiesFor("Buttons");

export const AgentsStore = { ...s('agents-store', as.button), name: "Agents Store — buttons" };
export const ChatHat = { ...s('chat-hat', ch.button), name: "Chat Hat — buttons" };
export const AgentBuilder = { ...s('omni-agent-builder', ab.button), name: "Agent Builder — buttons" };
export const Media = { ...s('media', md.button), name: "Media — buttons" };
// ARCHIVED — see the Archive drawer on the primary story. Restore by uncommenting; entry in _extract/curation.js
// export const Brief = { ...s('lease-campaign-brief-handoff', br.button), name: "Brief — buttons" };
registerArchived('lease-campaign-brief-handoff', 'button', br.button);
export const GraphicsMagicPrompt = { ...s('canvas-graphics', cg.button_magicprompt, { name: 'Graphics — enhance prompt button' }), name: "Graphics — enhance prompt button" };
export const ManifestCanvasSwitch = { ...s('omni-manifest', om.button_canvasswitch, { name: 'Manifest — canvas switch rail button' }), name: "Manifest — canvas switch rail button" };
export const ManifestEdgeHandle = { ...s('omni-manifest', om.button_edgehandle, { name: 'Manifest — canvas edge-handle tab' }), name: "Manifest — canvas edge-handle tab" };
