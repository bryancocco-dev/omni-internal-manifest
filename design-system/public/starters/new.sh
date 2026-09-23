#!/bin/sh
# OMNI+ Canvas — one-command scaffold.
#   curl -fsSL https://omni-system-hazel.vercel.app/starters/new.sh | sh -s my-canvas
# Creates the folder, unpacks the working canvas shell + CLAUDE.md into it,
# and prints the next step. Then: cd <folder> && claude
set -e

DIR="${1:-omni-canvas}"
BASE="https://omni-system-hazel.vercel.app/starters"
# GitHub mirror — raw.githubusercontent.com is pre-allowed in sandboxed
# environments (e.g. claude.ai/code cloud), so this works where BASE is blocked.
MIRROR="https://raw.githubusercontent.com/bryancocco-dev/omni-canvas-starter/main"

if [ -e "$DIR" ] && [ -n "$(ls -A "$DIR" 2>/dev/null)" ]; then
  echo "✗ './$DIR' already exists and isn't empty. Pick a fresh name:"
  echo "    curl -fsSL $BASE/new.sh | sh -s my-canvas"
  exit 1
fi

echo "→ Scaffolding the OMNI+ Canvas into ./$DIR …"
mkdir -p "$DIR"
cd "$DIR"
if ! curl -fsSL -o canvas-base.zip "$BASE/canvas-base.zip"; then
  echo "→ Primary host blocked — trying the GitHub mirror…"
  if ! curl -fsSL -o canvas-base.zip "$MIRROR/canvas-base.zip"; then
    echo "✗ Download blocked? Desktop/CLI: approve the sandbox domain prompt for omni-system-hazel.vercel.app (or add it via /sandbox), then re-run."
    echo "  claude.ai/code cloud: environment selector (cloud icon above the message box) → Default environment settings → Network access → Custom → add the domain, then retry in a new session."
    echo "  Last resort: download $BASE/canvas-base.zip in a browser and drag it into the chat."
    exit 1
  fi
fi
unzip -oq canvas-base.zip
cp -Rf canvas-base/. .
rm -rf canvas-base canvas-base.zip

echo ""
echo "✓ Ready. Your full-quality canvas is in ./$DIR"
echo ""
echo "  Next:"
echo "    cd $DIR && claude"
echo "  …then just describe what to build — e.g."
echo "    \"wire the Chat Hat's first chip to open a brief form\""
echo ""
echo "  (Or open ./$DIR/index.html in a browser to see the shell right now.)"
