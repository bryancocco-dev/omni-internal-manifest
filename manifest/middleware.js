/* Basic auth gate for omni-dashboard. Any username, password = ZARDOZ.
   Skips Vercel internals + favicon so the auth challenge doesn't fire
   on those paths and break the browser's cached credential handshake. */
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
  return new Response('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Internal Manifest"',
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}
