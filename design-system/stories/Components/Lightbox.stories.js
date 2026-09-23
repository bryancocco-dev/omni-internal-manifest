/*
 * Lightbox — verbatim extraction (Media canvas_4 edit-mode lightbox).
 */
import '../_extract/projects.js';
import { storiesFor } from '../_extract/lib.js';
import md from '../_extract/snippets/media.js';

export default { title: 'Components/Lightbox', parameters: { layout: 'fullscreen' } };

const s = storiesFor("Lightbox");

export const Media = { ...s('media', md.lightbox), name: "Media — edit-mode lightbox" };
