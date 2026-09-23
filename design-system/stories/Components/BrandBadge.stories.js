/*
 * BrandBadge — verbatim extractions (the OMNI brief badge).
 */
import '../_extract/projects.js';
import { storiesFor, registerArchived } from '../_extract/lib.js';
import md from '../_extract/snippets/media.js';
import br from '../_extract/snippets/lease-campaign-brief-handoff.js';

export default { title: 'Components/BrandBadge', parameters: { layout: 'fullscreen' } };

const s = storiesFor("BrandBadge");

// ARCHIVED — see the Archive drawer on the primary story. Restore by uncommenting; entry in _extract/curation.js
// export const Media = { ...s('media', md.brandbadge), name: "Media — OMNI+ brand badge" };
registerArchived('media', 'brandbadge', md.brandbadge);
export const Brief = { ...s('lease-campaign-brief-handoff', br.brandbadge), name: "Brief — OMNI+ brand badge" };
