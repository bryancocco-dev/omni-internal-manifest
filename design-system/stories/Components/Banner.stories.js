/*
 * Banner — verbatim extractions (inline intro / notice banners).
 */
import '../_extract/projects.js';
import { storiesFor } from '../_extract/lib.js';
import ch from '../_extract/snippets/chat-hat.js';
import cra from '../_extract/snippets/copy-request-access.js';

export default { title: 'Components/Banner', parameters: { layout: 'fullscreen' } };

const s = storiesFor("Banner");

export const ChatHat = { ...s('chat-hat', ch.banner), name: "Chat Hat — banner notice" };
export const AccessApproved = { ...s('copy-request-access', cra.banner_approved, { name: 'Access — request approved announcement' }), name: "Access — request approved announcement" };
