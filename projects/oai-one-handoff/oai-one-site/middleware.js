/* Basic-Auth gate: any username, password ZARDOZ.
 *
 * IMPORTANT — the email assets are deliberately NOT gated. They are loaded by
 * email clients (Gmail's image proxy, Outlook, Apple Mail), none of which will
 * ever send Basic-Auth credentials. Gating them would return 401 and the
 * graphics would render broken for every recipient, which defeats the point of
 * hosting them here. The HTML previews are gated; the image assets stay public.
 *
 * Excluded: everything under /assets/ (sender avatar, canvas icon, tile
 * backing graphic) plus the
 * two root-level images. Any NEW image an email hotlinks must live in
 * /assets/ or be added here, or it will 401 in the inbox.
 */
export const config = {
  matcher: '/((?!_vercel|favicon\\.ico|assets/|persona-canvas\\.gif|brand-crop\\.png).*)',
};

const PASSWORD = 'ZARDOZ';

export default function middleware(request) {
  const auth = request.headers.get('authorization') || '';
  if (auth.startsWith('Basic ')) {
    try {
      const decoded = atob(auth.slice(6));
      const idx = decoded.indexOf(':');
      const pwd = idx >= 0 ? decoded.slice(idx + 1) : decoded;
      if (pwd === PASSWORD) return;
    } catch (_) {}
  }
  // Same-origin requests (this site's own assets and in-page navigation) pass
  // once the visitor has authenticated on any page here.
  const ref = request.headers.get('referer') || '';
  try {
    if (new URL(ref).origin === new URL(request.url).origin) return;
  } catch (_) {}
  return new Response('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="OAI"',
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}
