#!/usr/bin/env python3
"""
gateway-v2 LLM sidecar — local-only, zero API keys.

Mirrors canvas-workflows' server/claude-dev-proxy.js contract (its PLAN.md
FQ-A "REAL ADAPTERS (local-only truth)"): shells out to the already-authed
`claude` CLI, so the HITL check-in chat gets REAL model replies with no key
anywhere. THIS NEVER SHIPS — it exists so the local demo at :8142 can talk
to a model; the page degrades gracefully (Pollinations, then canned) when
this isn't running.

Run:  python3 llm-sidecar.py        (listens on http://localhost:8143)

  GET  /__claude/health -> {"ok": true|false}   (caches `claude --version`)
  POST /__claude {"system": "...", "prompt": "..."} -> {"text": "..."}
"""
import json
import subprocess
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

PORT = 8143
CLI_TIMEOUT_S = 60
_health = {"checked": False, "ok": False}


def claude_ok():
    if not _health["checked"]:
        try:
            subprocess.run(["claude", "--version"], capture_output=True, timeout=10, check=True)
            _health["ok"] = True
        except Exception:
            _health["ok"] = False
        _health["checked"] = True
    return _health["ok"]


class Handler(BaseHTTPRequestHandler):
    def _send(self, code, payload):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(code)
        # the page lives on :8142 — cross-origin to this sidecar
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self._send(204, {})

    def do_GET(self):
        if self.path == "/__claude/health":
            self._send(200, {"ok": claude_ok()})
        else:
            self._send(404, {"error": "not found"})

    def do_POST(self):
        if self.path != "/__claude":
            self._send(404, {"error": "not found"})
            return
        try:
            n = int(self.headers.get("Content-Length", 0))
            req = json.loads(self.rfile.read(n).decode("utf-8"))
            system = str(req.get("system", ""))[:4000]
            prompt = str(req.get("prompt", ""))[:4000]
            if not prompt:
                self._send(400, {"error": "empty prompt"})
                return
            # arg-for-arg the canvas-workflows dev proxy contract
            # (claude-dev-proxy.js:172-189): keychain auth, no keys, no tools,
            # no session persistence.
            out = subprocess.run(
                ["claude", "-p", prompt, "--system-prompt", system,
                 "--model", "sonnet", "--output-format", "text",
                 "--tools", "", "--strict-mcp-config", "--no-session-persistence"],
                capture_output=True, timeout=CLI_TIMEOUT_S,
            )
            text = out.stdout.decode("utf-8", "replace").strip()
            if out.returncode != 0 or not text:
                self._send(502, {"error": out.stderr.decode("utf-8", "replace")[:400] or "empty"})
                return
            self._send(200, {"text": text})
        except Exception as e:  # timeout, bad json, anything — one shape out
            self._send(500, {"error": str(e)[:400]})

    def log_message(self, fmt, *args):  # quiet
        pass


if __name__ == "__main__":
    print(f"gwrun llm-sidecar on http://localhost:{PORT}  (claude CLI: {'ok' if claude_ok() else 'NOT FOUND'})")
    ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
