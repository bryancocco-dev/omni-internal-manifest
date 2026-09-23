/*
 * Blockquote — verbatim extractions (audience quotes / core-insight statements).
 */
import '../_extract/projects.js';
import { storiesFor } from '../_extract/lib.js';
import md from '../_extract/snippets/media.js';
import br from '../_extract/snippets/lease-campaign-brief-handoff.js';

export default { title: 'Components/Blockquote', parameters: { layout: 'fullscreen' } };

const s = storiesFor("Blockquote");

export const Media = { ...s('media', md.blockquote), name: "Media — pull-quote" };
export const Brief = { ...s('lease-campaign-brief-handoff', br.blockquote), name: "Brief — pull-quote" };
export const BriefCoreInsight = { ...s('lease-campaign-brief-handoff', br.blockquote_ci, { name: 'Brief — core insight' }), name: "Brief — core insight" };
