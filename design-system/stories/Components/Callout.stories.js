/*
 * Callout — verbatim extraction (Brief root-cause callout).
 */
import '../_extract/projects.js';
import { storiesFor } from '../_extract/lib.js';
import br from '../_extract/snippets/lease-campaign-brief-handoff.js';
import cqa from '../_extract/snippets/canvas-qa.js';
import ms from '../_extract/snippets/media-skills.js';

export default { title: 'Components/Callout', parameters: { layout: 'fullscreen' } };

const s = storiesFor("Callout");

export const Brief = { ...s('lease-campaign-brief-handoff', br.callout), name: "Brief — callout" };
export const QaSpine = { ...s('canvas-qa', cqa.callout_spine, { name: 'QA — strategic spine callout' }), name: "QA — strategic spine callout" };
export const MediaSkillsAi = { ...s('media-skills', ms.callout_ai, { name: 'Media Skills — AI-generated insight callout' }), name: "Media Skills — AI-generated insight callout" };
