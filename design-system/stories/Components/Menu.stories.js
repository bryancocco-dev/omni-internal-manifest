/*
 * Menu — verbatim extractions (add menus, profile / workspace menus).
 */
import '../_extract/projects.js';
import { storiesFor, registerArchived } from '../_extract/lib.js';
import as from '../_extract/snippets/agents-store.js';
import ch from '../_extract/snippets/chat-hat.js';
import ab from '../_extract/snippets/omni-agent-builder.js';
import md from '../_extract/snippets/media.js';
import br from '../_extract/snippets/lease-campaign-brief-handoff.js';
import ptw from '../_extract/snippets/publish-to-workspace.js';
import th from '../_extract/snippets/themes.js';

export default { title: 'Components/Menu', parameters: { layout: 'fullscreen' } };

const s = storiesFor("Menu");

export const AgentsStore = { ...s('agents-store', as.menu), name: "Agents Store — popover menu" };
// ARCHIVED — see the Archive drawer on the primary story. Restore by uncommenting; entry in _extract/curation.js
// export const ChatHat = { ...s('chat-hat', ch.menu), name: "Chat Hat — popover menu" };
registerArchived('chat-hat', 'menu', ch.menu);
export const AgentBuilder = { ...s('omni-agent-builder', ab.menu), name: "Agent Builder — popover menu" };
// ARCHIVED — see the Archive drawer on the primary story. Restore by uncommenting; entry in _extract/curation.js
// export const Media = { ...s('media', md.menu), name: "Media — popover menu" };
registerArchived('media', 'menu', md.menu);
export const Brief = { ...s('lease-campaign-brief-handoff', br.menu), name: "Brief — popover menu" };
export const PublishMenu = { ...s('publish-to-workspace', ptw.menu_publish, { name: 'Publish — board kebab menu' }), name: "Publish — board kebab menu" };
export const ThemesMode = { ...s('themes', th.menu_thememode, { name: 'Themes — profile theme mode panel' }), name: "Themes — profile theme mode panel" };
