/* Layout for the architecture diagrams: pure maths, no React, so it's easy to test.

   A diagram is a few lanes (columns, left to right). Nodes stack inside a lane and are centred
   against the tallest one. Edges join the facing sides of two nodes with a gentle curve. */

export interface DiagramNode {
  id: string
  label: string
  sub?: string
}
export interface DiagramLane {
  label: string
  nodes: DiagramNode[]
}
export interface DiagramEdge {
  from: string
  to: string
  label?: string
}
export interface DiagramSpec {
  title: string
  lanes: DiagramLane[]
  edges: DiagramEdge[]
}

export const NODE_W = 172
export const NODE_H = 58
const LANE_GAP = 72
const ROW_GAP = 30
const PAD_X = 24
const PAD_TOP = 48
const PAD_BOTTOM = 24

export interface PlacedNode extends DiagramNode {
  x: number
  y: number
  lane: number
}
export interface PlacedEdge extends DiagramEdge {
  path: string
  /** midpoint, where the label sits */
  mid: { x: number; y: number }
}
export interface Layout {
  width: number
  height: number
  laneLabels: { label: string; x: number }[]
  nodes: PlacedNode[]
  edges: PlacedEdge[]
}

export function layoutDiagram(spec: DiagramSpec): Layout {
  const rows = Math.max(1, ...spec.lanes.map((l) => l.nodes.length))
  const innerH = rows * NODE_H + (rows - 1) * ROW_GAP
  const width = PAD_X * 2 + spec.lanes.length * NODE_W + (spec.lanes.length - 1) * LANE_GAP
  const height = PAD_TOP + innerH + PAD_BOTTOM

  const nodes: PlacedNode[] = []
  const laneLabels = spec.lanes.map((lane, i) => ({ label: lane.label, x: PAD_X + i * (NODE_W + LANE_GAP) + NODE_W / 2 }))

  spec.lanes.forEach((lane, laneIndex) => {
    const laneH = lane.nodes.length * NODE_H + (lane.nodes.length - 1) * ROW_GAP
    const top = PAD_TOP + (innerH - laneH) / 2
    lane.nodes.forEach((node, row) => {
      nodes.push({ ...node, lane: laneIndex, x: PAD_X + laneIndex * (NODE_W + LANE_GAP), y: top + row * (NODE_H + ROW_GAP) })
    })
  })

  const byId = new Map(nodes.map((n) => [n.id, n]))
  const edges = spec.edges.map((edge): PlacedEdge => {
    const a = byId.get(edge.from)
    const b = byId.get(edge.to)
    if (!a || !b) throw new Error(`Diagram edge ${edge.from} -> ${edge.to} points at a missing node`)

    let x1: number, y1: number, x2: number, y2: number
    let path: string
    if (a.lane === b.lane) {
      // same lane: straight down (or up) between the facing edges
      const down = b.y > a.y
      x1 = x2 = a.x + NODE_W / 2
      y1 = down ? a.y + NODE_H : a.y
      y2 = down ? b.y : b.y + NODE_H
      path = `M ${x1} ${y1} L ${x2} ${y2}`
    } else {
      const forward = b.lane > a.lane
      x1 = forward ? a.x + NODE_W : a.x
      x2 = forward ? b.x : b.x + NODE_W
      y1 = a.y + NODE_H / 2
      y2 = b.y + NODE_H / 2
      const dx = (x2 - x1) / 2
      path = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`
    }
    return { ...edge, path, mid: { x: (x1 + x2) / 2, y: (y1 + y2) / 2 } }
  })

  return { width, height, laneLabels, nodes, edges }
}

/** One plain-text sentence per edge, for the diagram's accessible description. */
export function describeDiagram(spec: DiagramSpec): string {
  const name = new Map(spec.lanes.flatMap((l) => l.nodes).map((n) => [n.id, n.label]))
  return spec.edges
    .map((e) => `${name.get(e.from)} to ${name.get(e.to)}${e.label ? ` (${e.label})` : ""}`)
    .join("; ")
}
