#!/usr/bin/env python3
"""No-cache static server for gateway-v2-twelve (this folder only).
python3 serve.py [port]   — default 8200
Every response carries Cache-Control: no-store so a plain reload always picks up edits."""
import sys, os
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
port = int(sys.argv[1]) if len(sys.argv) > 1 else 8200
root = os.path.dirname(os.path.abspath(__file__))
class H(SimpleHTTPRequestHandler):
    def __init__(self, *a, **k): super().__init__(*a, directory=root, **k)
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache'); self.send_header('Expires', '0')
        super().end_headers()
    def log_message(self, *a): pass
print(f"gateway-v2-twelve  http://localhost:{port}/")
ThreadingHTTPServer(('0.0.0.0', port), H).serve_forever()
