export const config = {
  /* Auth-gate everything except the PUBLIC design-system hand-off surface so a
   * new prototype can consume it without a Basic-auth prompt: token files
   * (tokens.css/json/js), the component export (components.json), the
   * per-component permalink pages (/components/*.html + index.json), the
   * per-project component CSS (/library/*), and the starter doc (CLAUDE.md).
   * Plus the favicon and Vercel internals. The catalog UI stays gated. */
  matcher: '/((?!_vercel|favicon\\.ico|tokens\\.|components\\.json|components/|library/|starters/|CLAUDE\\.md).*)',
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
      'WWW-Authenticate': 'Basic realm="OMNI System"',
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}
