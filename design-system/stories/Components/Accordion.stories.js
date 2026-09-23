/*
 * Accordion — verbatim extraction (Media Skills' collapsible parameter panel).
 */
import '../_extract/projects.js';
import { storiesFor } from '../_extract/lib.js';
import ms from '../_extract/snippets/media-skills.js';

export default { title: 'Components/Accordion', parameters: { layout: 'fullscreen' } };

const s = storiesFor("Accordion");

export const MediaSkills = { ...s('media-skills', ms.accordion), name: "Media Skills — parameter accordion" };
