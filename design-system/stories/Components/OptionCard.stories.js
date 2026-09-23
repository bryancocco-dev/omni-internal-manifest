/*
 * OptionCard — verbatim extractions (selectable option tiles).
 */
import '../_extract/projects.js';
import { storiesFor } from '../_extract/lib.js';
import as from '../_extract/snippets/agents-store.js';
import ch from '../_extract/snippets/chat-hat.js';
import om from '../_extract/snippets/omni-manifest.js';

export default { title: 'Components/OptionCard', parameters: { layout: 'fullscreen' } };

const s = storiesFor("OptionCard");

export const AgentsStore = { ...s('agents-store', as.optioncard), name: "Agents Store — option card" };
export const ChatHat = { ...s('chat-hat', ch.optioncard), name: "Chat Hat — option card" };
export const ManifestChooserTile = { ...s('omni-manifest', om.optioncard_tile, { name: 'Manifest — mode chooser tile' }), name: "Manifest — mode chooser tile" };
