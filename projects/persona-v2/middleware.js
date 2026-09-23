export const config = {
  matcher: '/((?!_vercel|favicon\\.ico).*)',
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
  /* Embed allowlist (2026-08-26, gateway-v2 "push live"): Chrome never
     shows Basic-Auth dialogs for cross-origin IFRAMES, so the OMNI
     gateway's overlay tabs rendered this app as a dead 401 frame for any
     viewer who hadn't pre-authed here directly. Requests arriving FROM
     the gateway (or from this app's own pages - its assets and in-app
     navigation) pass without the dialog; direct visits still get the
     ZARDOZ gate. */
  const ref = request.headers.get('referer') || '';
  try {
    const refOrigin = new URL(ref).origin;
    const selfOrigin = new URL(request.url).origin;
    if (refOrigin === selfOrigin ||
        refOrigin === 'https://gateway-v2-chi.vercel.app' ||
        refOrigin === 'https://gateway-v2-twelve.vercel.app' ||
        refOrigin === 'http://localhost:8142') return;
  } catch (_) {}
  return new Response('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Canvas"',
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}
