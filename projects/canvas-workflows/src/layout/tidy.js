// Seam D — Edges/layout/flow-theme
//
// Auto-arranges the graph left-to-right with dagre. Pure function: takes the
// current nodes/edges and returns a NEW nodes array with updated `position`s
// (edges are read-only here — dagre only needs them to know which nodes are
// connected so it can rank them). Node sizes come from React Flow's own
// `measured` field (the actual rendered box) so cards of different heights
// (e.g. a Task with an Agent sub-card vs a bare Wait node) tidy up without
// overlapping; before a node has ever been measured we fall back to the
// 320/180 default called out in the plan.

import dagre from '@dagrejs/dagre'

const FALLBACK_WIDTH = 320
const FALLBACK_HEIGHT = 180

function sizeOf(node) {
  return {
    width: node.measured?.width ?? FALLBACK_WIDTH,
    height: node.measured?.height ?? FALLBACK_HEIGHT,
  }
}

export function tidyLayout(nodes = [], edges = []) {
  if (!nodes.length) return nodes

  // VARIANT STUDIO (PLAN.md "### 4 — integration": "tidy must not scatter
  // grid children — dagre on parents only — exclude children with parentId
  // from tidy, keep their relative layout"). A variant card's `position` is
  // RELATIVE to its frame (React Flow's own parentId semantics), so handing
  // one to dagre would both be meaningless (it isn't part of the flow graph
  // — it carries no edges) and actively wrong (dagre would treat a small
  // relative offset like {x:20,y:48} as an absolute canvas position). The
  // frame itself stays a normal top-level node here — dagre positions it
  // like any other card, and since children are never touched, the whole
  // grid's internal layout rides along with the frame's new spot for free.
  const topLevel = nodes.filter((node) => !node.parentId)
  if (!topLevel.length) return nodes

  const graph = new dagre.graphlib.Graph()
  graph.setDefaultEdgeLabel(() => ({}))
  graph.setGraph({ rankdir: 'LR', ranksep: 80, nodesep: 48 })

  for (const node of topLevel) {
    graph.setNode(node.id, sizeOf(node))
  }

  for (const edge of edges) {
    // Guard against edges pointing at a node id that isn't in this batch
    // (e.g. a stale edge mid-delete, or a grid child — which never has
    // edges to begin with) — dagre throws on unknown node ids.
    if (graph.hasNode(edge.source) && graph.hasNode(edge.target)) {
      graph.setEdge(edge.source, edge.target)
    }
  }

  dagre.layout(graph)

  const positioned = new Map(
    topLevel.map((node) => {
      // CONTEXT & CLIPBOARD (PLAN.md item 2, "Pin") — "tidy EXCLUDES pinned
      // nodes (they're anchors)". A pinned node still took part in the dagre
      // graph above (so anything wired to/from it still ranks sensibly
      // relative to its real spot instead of the edge just being dropped),
      // but it keeps its OWN current position rather than dagre's computed
      // one — the anchor doesn't move, only what's tied to it reflows.
      if (node.data?.pinned) return [node.id, node]
      const { width, height } = sizeOf(node)
      const { x, y } = graph.node(node.id)
      // dagre positions by center; React Flow positions by top-left.
      return [node.id, { ...node, position: { x: x - width / 2, y: y - height / 2 } }]
    }),
  )

  return nodes.map((node) => positioned.get(node.id) ?? node)
}
