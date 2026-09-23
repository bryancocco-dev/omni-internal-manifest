// Omni AI <> Figma — plugin sandbox (main thread).
// Receives messages from the UI iframe and turns them into nodes on the canvas.
// No network here: the UI does all fetching, the sandbox does all node creation.

const UI = { width: 640, height: 900 };
figma.showUI(__html__, { width: UI.width, height: UI.height, themeColors: true });

const CONFIG_KEY = "omni-config";

async function loadConfig() {
  const cfg = await figma.clientStorage.getAsync(CONFIG_KEY);
  return cfg || { baseUrl: "", apiKey: "", workspaceId: "" };
}

async function saveConfig(cfg) {
  await figma.clientStorage.setAsync(CONFIG_KEY, cfg || {});
}

// Drop a freshly created node at the centre of the user's current viewport
// (plus an optional cascade offset), select it, and frame it.
function placeNode(node, offset) {
  const c = figma.viewport.center;
  const o = offset || 0;
  node.x = Math.round(c.x - (node.width || 0) / 2) + o;
  node.y = Math.round(c.y - (node.height || 0) / 2) + o;
  figma.currentPage.appendChild(node);
  figma.currentPage.selection = [node];
  figma.viewport.scrollAndZoomIntoView([node]);
}

// Create a brand-new canvas node for a resolved asset payload.
async function createAssetNode(it) {
  if (it.kind === "text") {
    await figma.loadFontAsync({ family: "Inter", style: "Regular" });
    const t = figma.createText();
    t.fontName = { family: "Inter", style: "Regular" };
    t.fontSize = 18;
    t.characters = it.text || "";
    t.textAutoResize = "HEIGHT";
    t.resize(it.w || 480, t.height);
    t.name = it.name || "Omni text";
    return t;
  }
  if (it.kind === "svg") {
    const n = figma.createNodeFromSvg(it.svg);
    n.name = it.name || "Omni graphic";
    return n;
  }
  if (it.kind === "image") {
    const image = figma.createImage(new Uint8Array(it.bytes));
    const rect = figma.createRectangle();
    rect.resize(it.w || 800, it.h || 600);
    rect.name = it.name || "Omni image";
    rect.fills = [{ type: "IMAGE", scaleMode: "FILL", imageHash: image.hash }];
    return rect;
  }
  if (it.kind === "video") {
    const video = await figma.createVideoAsync(new Uint8Array(it.bytes));
    const rect = figma.createRectangle();
    rect.resize(it.w || 960, it.h || 540);
    rect.name = it.name || "Omni video";
    rect.fills = [{ type: "VIDEO", scaleMode: "FILL", videoHash: video.hash }];
    return rect;
  }
  return null;
}

// Replace a selected node's content with a resolved asset (in place).
// Returns true if the node was compatible and updated.
async function applyAssetToNode(node, it) {
  try {
    if (it.kind === "text" && node.type === "TEXT") {
      let fn = node.fontName;
      if (fn === figma.mixed) { fn = { family: "Inter", style: "Regular" }; await figma.loadFontAsync(fn); node.fontName = fn; }
      else { await figma.loadFontAsync(fn); }
      node.characters = it.text || "";
      return true;
    }
    if (it.kind === "image" && "fills" in node) {
      const image = figma.createImage(new Uint8Array(it.bytes));
      node.fills = [{ type: "IMAGE", scaleMode: "FILL", imageHash: image.hash }];
      return true;
    }
    if (it.kind === "video" && "fills" in node) {
      const video = await figma.createVideoAsync(new Uint8Array(it.bytes));
      node.fills = [{ type: "VIDEO", scaleMode: "FILL", videoHash: video.hash }];
      return true;
    }
    if (it.kind === "svg" && node.parent) {
      // swap: drop the vector in at the same spot/size, remove the old node
      const n = figma.createNodeFromSvg(it.svg);
      n.name = it.name || node.name;
      n.x = node.x; n.y = node.y;
      try { if (node.width && node.height && "resize" in n) n.resize(node.width, node.height); } catch (e) {}
      node.parent.insertChild(node.parent.children.indexOf(node), n);
      node.remove();
      figma.currentPage.selection = [n];
      return true;
    }
  } catch (e) { /* incompatible — caller falls back to insert */ }
  return false;
}

function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.substring(0, 2), 16) / 255,
    g: parseInt(h.substring(2, 4), 16) / 255,
    b: parseInt(h.substring(4, 6), 16) / 255
  };
}

function summarizeNode(node) {
  const fills = node.fills && Array.isArray(node.fills) ? node.fills : [];
  const solidFill = fills.find(f => f.type === "SOLID" && f.visible !== false);
  let fillColor = null;
  if (solidFill) {
    const r = Math.round(solidFill.color.r * 255);
    const g = Math.round(solidFill.color.g * 255);
    const b = Math.round(solidFill.color.b * 255);
    fillColor = "#" + [r, g, b].map(v => v.toString(16).padStart(2, "0")).join("");
  }
  return {
    id: node.id,
    name: node.name,
    type: node.type,
    width: node.width,
    height: node.height,
    fillColor: fillColor,
    fontSize: (node.type === "TEXT" && node.fontSize !== figma.mixed) ? node.fontSize : null,
    opacity: node.opacity,
    cornerRadius: (node.cornerRadius !== undefined && node.cornerRadius !== figma.mixed) ? node.cornerRadius : null,
    hasAutoLayout: node.layoutMode && node.layoutMode !== "NONE",
    childCount: node.children ? node.children.length : 0
  };
}

// Read every selected node so the Agent can act on multi-selections.
function readSelection() {
  const sel = figma.currentPage.selection;
  if (!sel.length) return null;
  return { count: sel.length, nodes: sel.map(summarizeNode) };
}

// Apply a change bundle to a single node in place.
function applyChangesToNode(node, changes) {
  if (!changes) return;
  if (changes.fillColor && "fills" in node) {
    node.fills = [{ type: "SOLID", color: hexToRgb(changes.fillColor) }];
  }
  if (changes.resize) {
    const dims = {
      "Desktop 1440": [1440, null], "Tablet 768": [768, null],
      "Mobile 375": [375, null], "Square 1:1": [node.width, node.width]
    };
    const d = dims[changes.resize];
    if (d) {
      const w = d[0];
      const h = d[1] || Math.round(node.height * (w / node.width));
      node.resize(w, h);
    }
  }
}

figma.on("selectionchange", () => {
  figma.ui.postMessage({ type: "selection-change", selection: readSelection() });
});

figma.ui.onmessage = async (msg) => {
  try {
    switch (msg.type) {
      case "get-config": {
        figma.ui.postMessage({ type: "config", config: await loadConfig() });
        break;
      }

      // Library click / generated asset: replace the selected node's content
      // if something compatible is selected, otherwise drop in a new node.
      case "place-asset": {
        const sel = msg.insertOnly ? [] : figma.currentPage.selection.slice();
        let replaced = 0;
        for (const node of sel) { if (await applyAssetToNode(node, msg)) replaced++; }
        if (replaced) {
          figma.notify("Replaced " + replaced + " layer" + (replaced === 1 ? "" : "s"));
        } else {
          const node = await createAssetNode(msg);
          if (node) { placeNode(node, msg.offset || 0); figma.notify("Added “" + (msg.name || "asset") + "”"); }
        }
        figma.ui.postMessage({ type: "placed" });
        break;
      }

      case "get-selection": {
        figma.ui.postMessage({ type: "selection-change", selection: readSelection() });
        break;
      }

      case "agent-clear-selection": {
        figma.currentPage.selection = [];
        break;
      }

      case "agent-apply": {
        const sel = figma.currentPage.selection;
        if (!sel.length) { figma.notify("Nothing selected"); break; }
        for (const node of sel) applyChangesToNode(node, msg.changes);
        const n = sel.length;
        figma.notify(n === 1
          ? "Applied changes to “" + sel[0].name + "”"
          : "Applied changes to " + n + " layers");
        figma.ui.postMessage({ type: "selection-change", selection: readSelection() });
        break;
      }

      case "agent-clone-variation": {
        const sel = figma.currentPage.selection;
        if (!sel.length) { figma.notify("Nothing selected"); break; }
        // Offset the whole cloned set to the right of the selection's bounds.
        const maxRight = Math.max.apply(null, sel.map(nd => nd.x + nd.width));
        const minLeft = Math.min.apply(null, sel.map(nd => nd.x));
        const shift = (maxRight - minLeft) + 40;
        const clones = [];
        for (const original of sel) {
          const clone = original.clone();
          clone.name = original.name + " — variation";
          clone.x = original.x + shift;
          clone.y = original.y;
          applyChangesToNode(clone, msg.changes);
          figma.currentPage.appendChild(clone);
          clones.push(clone);
        }
        figma.currentPage.selection = clones;
        figma.viewport.scrollAndZoomIntoView(clones);
        figma.notify(clones.length === 1
          ? "Cloned “" + clones[0].name + "”"
          : "Cloned " + clones.length + " layers");
        break;
      }

      case "save-config": {
        await saveConfig(msg.config);
        figma.ui.postMessage({ type: "config-saved" });
        figma.notify("Omni connection saved");
        break;
      }

      case "insert-image": {
        const image = figma.createImage(new Uint8Array(msg.bytes));
        const rect = figma.createRectangle();
        rect.resize(msg.w || 800, msg.h || 600);
        rect.name = msg.name || "Omni image";
        rect.fills = [{ type: "IMAGE", scaleMode: "FILL", imageHash: image.hash }];
        placeNode(rect);
        figma.ui.postMessage({ type: "inserted", name: rect.name });
        figma.notify("Inserted “" + rect.name + "”");
        break;
      }

      case "insert-svg": {
        const node = figma.createNodeFromSvg(msg.svg);
        node.name = msg.name || "Omni graphic";
        placeNode(node);
        figma.ui.postMessage({ type: "inserted", name: node.name });
        figma.notify("Inserted “" + node.name + "”");
        break;
      }

      case "insert-video": {
        const video = await figma.createVideoAsync(new Uint8Array(msg.bytes));
        const rect = figma.createRectangle();
        rect.resize(msg.w || 960, msg.h || 540);
        rect.name = msg.name || "Omni video";
        rect.fills = [{ type: "VIDEO", scaleMode: "FILL", videoHash: video.hash }];
        placeNode(rect);
        figma.ui.postMessage({ type: "inserted", name: rect.name });
        figma.notify("Inserted “" + rect.name + "”");
        break;
      }

      case "insert-text": {
        await figma.loadFontAsync({ family: "Inter", style: "Regular" });
        const t = figma.createText();
        t.fontName = { family: "Inter", style: "Regular" };
        t.fontSize = msg.fontSize || 18;
        t.characters = msg.text || "";
        t.textAutoResize = "HEIGHT";
        t.resize(msg.w || 480, t.height);
        t.name = msg.name || "Omni text";
        placeNode(t);
        figma.ui.postMessage({ type: "inserted", name: t.name });
        figma.notify("Inserted “" + t.name + "”");
        break;
      }

      case "insert-batch": {
        // Tile selected library items onto the canvas in a row-by-row grid
        // centered at the current viewport. Each item keeps its intrinsic w/h.
        const items = Array.isArray(msg.items) ? msg.items : [];
        if (!items.length) break;

        const gap = 24;
        const perRow = items.length <= 2 ? items.length : items.length <= 6 ? 2 : 3;

        // First pass: compute (x, y) for each item, row-major, growing right then down.
        const positions = [];
        let cursorX = 0, rowY = 0, rowMaxH = 0;
        for (let i = 0; i < items.length; i++) {
          const w = items[i].w || 800;
          const h = items[i].h || 600;
          positions.push({ x: cursorX, y: rowY, w, h });
          cursorX += w + gap;
          if (h > rowMaxH) rowMaxH = h;
          if ((i + 1) % perRow === 0) { cursorX = 0; rowY += rowMaxH + gap; rowMaxH = 0; }
        }
        const minX = Math.min(...positions.map(p => p.x));
        const maxX = Math.max(...positions.map(p => p.x + p.w));
        const minY = Math.min(...positions.map(p => p.y));
        const maxY = Math.max(...positions.map(p => p.y + p.h));
        const center = figma.viewport.center;
        const ox = center.x - (minX + maxX) / 2;
        const oy = center.y - (minY + maxY) / 2;

        let fontLoaded = false;
        const created = [];
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          const p = positions[i];
          let node = null;
          try {
            if (item.kind === "text") {
              if (!fontLoaded) { await figma.loadFontAsync({ family: "Inter", style: "Regular" }); fontLoaded = true; }
              const t = figma.createText();
              t.fontName = { family: "Inter", style: "Regular" };
              t.fontSize = 18;
              t.characters = item.text || "";
              t.textAutoResize = "HEIGHT";
              t.resize(p.w, t.height);
              t.name = item.name || "Omni text";
              node = t;
            } else if (item.kind === "svg") {
              node = figma.createNodeFromSvg(item.svg);
              node.name = item.name || "Omni graphic";
            } else if (item.kind === "image") {
              const image = figma.createImage(new Uint8Array(item.bytes));
              const rect = figma.createRectangle();
              rect.resize(p.w, p.h);
              rect.name = item.name || "Omni image";
              rect.fills = [{ type: "IMAGE", scaleMode: "FILL", imageHash: image.hash }];
              node = rect;
            } else if (item.kind === "video") {
              const video = await figma.createVideoAsync(new Uint8Array(item.bytes));
              const rect = figma.createRectangle();
              rect.resize(p.w, p.h);
              rect.name = item.name || "Omni video";
              rect.fills = [{ type: "VIDEO", scaleMode: "FILL", videoHash: video.hash }];
              node = rect;
            }
          } catch (e) { /* skip this one, keep going */ }
          if (node) {
            node.x = Math.round(p.x + ox);
            node.y = Math.round(p.y + oy);
            figma.currentPage.appendChild(node);
            created.push(node);
          }
        }
        if (created.length) {
          figma.currentPage.selection = created;
          figma.viewport.scrollAndZoomIntoView(created);
        }
        figma.ui.postMessage({ type: "batch-inserted", count: created.length });
        figma.notify("Inserted " + created.length + " asset" + (created.length === 1 ? "" : "s"));
        break;
      }

      case "notify": {
        figma.notify(msg.message, msg.error ? { error: true } : undefined);
        break;
      }

      case "resize": {
        figma.ui.resize(
          Math.max(320, msg.w | 0) || UI.width,
          Math.max(420, msg.h | 0) || UI.height
        );
        break;
      }

      case "close": {
        figma.closePlugin();
        break;
      }
    }
  } catch (err) {
    const message = err && err.message ? err.message : String(err);
    figma.ui.postMessage({ type: "insert-error", message });
    figma.notify("Insert failed: " + message, { error: true });
  }
};
