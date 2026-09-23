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
      'WWW-Authenticate': 'Basic realm="canvas-pdf-tables"',
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}
