/*
 * ChapterNav — verbatim extractions (scroll-chapter pager).
 */
import '../_extract/projects.js';
import { storiesFor, registerArchived } from '../_extract/lib.js';
import md from '../_extract/snippets/media.js';
import br from '../_extract/snippets/lease-campaign-brief-handoff.js';

export default { title: 'Components/ChapterNav', parameters: { layout: 'fullscreen' } };

const s = storiesFor("ChapterNav");

// ARCHIVED — see the Archive drawer on the primary story. Restore by uncommenting; entry in _extract/curation.js
// export const Media = { ...s('media', md.chapternav), name: "Media — chapter pager" };
registerArchived('media', 'chapternav', md.chapternav);
export const Brief = { ...s('lease-campaign-brief-handoff', br.chapternav), name: "Brief — chapter pager" };
