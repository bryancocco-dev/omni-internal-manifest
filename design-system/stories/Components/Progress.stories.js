/*
 * Progress — verbatim extractions (version-history timeline / progress rails).
 */
import '../_extract/projects.js';
import { storiesFor } from '../_extract/lib.js';
import ab from '../_extract/snippets/omni-agent-builder.js';
import md from '../_extract/snippets/media.js';

export default { title: 'Components/Progress', parameters: { layout: 'fullscreen' } };

const s = storiesFor("Progress");

export const AgentBuilder = { ...s('omni-agent-builder', ab.progress), name: "Agent Builder — progress bar" };
export const Media = { ...s('media', md.progress), name: "Media — progress bar" };
