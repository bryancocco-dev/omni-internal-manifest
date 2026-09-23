/*
 * Markdown — verbatim extraction (Brief rendered section body).
 */
import '../_extract/projects.js';
import { storiesFor } from '../_extract/lib.js';
import br from '../_extract/snippets/lease-campaign-brief-handoff.js';

export default { title: 'Components/Markdown', parameters: { layout: 'fullscreen' } };

const s = storiesFor("Markdown");

export const Brief = { ...s('lease-campaign-brief-handoff', br.markdown), name: "Brief — markdown body" };
