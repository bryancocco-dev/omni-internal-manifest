#!/usr/bin/env python3
"""
gateway-v2 demo stack — every server the gateway demo needs, one process.

  8142  gateway-v2        (the app)
  8174  canvas-graphics   (Graphics/Video overlay tabs)
  8185  tabula            (the + Create overlay)
  8189  persona-v2        (Personas overlay tab)
  8131  canvas-qa         (Canvas rows overlay tab — primary)
  8156  canvas-share-demos (Canvas rows overlay tab — variety)

The LLM sidecar (8143) is deliberately NOT started — Bryan 2026-08-26: "we can kill
the LLM sidecar, I just need this to work as a demo." The HITL chats degrade
gracefully to their canned in-character replies (the page health-probes 8143 once and
moves on). To bring live replies back: python3 llm-sidecar.py

canvas-workflows (8182) is NOT here — it's a Vite dev server, start it in its own
project as usual. Run:  python3 demo-stack.py   (Ctrl-C stops everything)
"""
import functools
import os
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

BASE = os.path.dirname(os.path.abspath(__file__))          # …/TINKER/gateway-v2
TINKER = os.path.dirname(BASE)                              # …/TINKER

STATIC = [
    (8142, os.path.join(TINKER, "gateway-v2")),
    (8174, os.path.join(TINKER, "canvas-graphics")),
    (8185, os.path.join(TINKER, "tabula")),
    (8189, os.path.join(TINKER, "persona-v2")),
    # Phase N (PLAN.md "GATEWAY RUN" Phase N — "ongoing full canvases in
    # the file lists"): the Canvas rows' iframe destinations.
    (8131, os.path.join(TINKER, "canvas-qa")),
    (8156, os.path.join(TINKER, "canvas-share-demos")),
    # R.21 — Text rows' interior is the real Canvas Lite/Full app now.
    (8180, os.path.join(TINKER, "omni-manifest")),
]


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, fmt, *args):
        pass


def serve_static(port, directory):
    handler = functools.partial(QuietHandler, directory=directory)
    ThreadingHTTPServer(("0.0.0.0", port), handler).serve_forever()


if __name__ == "__main__":
    for port, directory in STATIC:
        threading.Thread(target=serve_static, args=(port, directory), daemon=True).start()
        print(f"  :{port}  ->  {os.path.basename(directory)}")
    print("demo stack up (no LLM sidecar — canned HITL replies) — Ctrl-C stops everything")
    threading.Event().wait()
