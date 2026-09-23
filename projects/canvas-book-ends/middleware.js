const PASSWORD = 'ZARDOZ';

export const config = {
  matcher: '/((?!_vercel|favicon\\.ico).*)',
};

export default function middleware(request) {
  const auth = request.headers.get('authorization') || '';
  let authed = false;
  if (auth.startsWith('Basic ')) {
    try {
      const decoded = atob(auth.slice(6));
      const idx = decoded.indexOf(':');
      const pwd = idx >= 0 ? decoded.slice(idx + 1) : decoded;
      if (pwd === PASSWORD) authed = true;
    } catch (_) {}
  }
  if (!authed) {
    return new Response('Authentication required', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Canvas Book Ends"',
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  }
  // Round 63 — Bryan: the treatment sheet was the early-options
  // review surface; it's no longer relevant, and the root link
  // should land straight on the canvas tool now. Root rewrite to
  // review.html removed — "/" falls through to the normal static
  // default (index.html). review.html itself is untouched and still
  // reachable directly at /review.html if ever needed.
}
