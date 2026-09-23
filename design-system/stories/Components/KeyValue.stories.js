/*
 * KeyValue — verbatim extractions (persona-detail / fact cards).
 */
import '../_extract/projects.js';
import { storiesFor } from '../_extract/lib.js';
import md from '../_extract/snippets/media.js';
import br from '../_extract/snippets/lease-campaign-brief-handoff.js';

export default { title: 'Components/KeyValue', parameters: { layout: 'fullscreen' } };

const s = storiesFor("KeyValue");

export const Media = { ...s('media', md.keyvalue), name: "Media — key / value facts" };
export const Brief = { ...s('lease-campaign-brief-handoff', br.keyvalue), name: "Brief — key / value facts" };
