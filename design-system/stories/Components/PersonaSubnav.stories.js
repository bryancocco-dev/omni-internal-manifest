/*
 * PersonaSubnav — verbatim extraction of the persona-subnav project's sticky
 * sub-navigation bar (React + Tailwind 4 + framer-motion). Captured from the
 * live build at rest; markup + the compiled Tailwind CSS are lifted byte-for-byte,
 * see _extract/snippets/persona-subnav.js. Two stories cover its two view modes.
 */
import '../_extract/projects.js';
import { storiesFor } from '../_extract/lib.js';
import ps from '../_extract/snippets/persona-subnav.js';

export default { title: 'Components/PersonaSubnav', parameters: { layout: 'fullscreen' } };

const s = storiesFor("PersonaSubnav");

export const Persona = { ...s('persona-subnav', ps.subnav), name: "Persona — persona sub-navigation bar (single view)" };
export const PersonaCompare = { ...s('persona-subnav', ps.subnavCompare), name: "Persona — persona sub-navigation bar (compare view)" };
