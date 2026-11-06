import { describe, expect, it } from "vitest"

import { caseStudies } from "@/lib/data/case-studies"
import { projectSlug, projects } from "@/lib/data/projects"
import { describeDiagram, layoutDiagram, NODE_H, NODE_W, type DiagramSpec } from "@/lib/diagram"

const spec: DiagramSpec = {
  title: "t",
  lanes: [
    { label: "A", nodes: [{ id: "a", label: "A" }] },
    { label: "B", nodes: [{ id: "b1", label: "B1" }, { id: "b2", label: "B2" }] },
  ],
  edges: [{ from: "a", to: "b1", label: "x" }, { from: "b1", to: "b2" }, { from: "b2", to: "a" }],
}

describe("layoutDiagram", () => {
  const l = layoutDiagram(spec)
  const at = (id: string) => l.nodes.find((n) => n.id === id)!

  it("puts lanes side by side and stacks nodes inside a lane", () => {
    expect(at("b1").x).toBeGreaterThan(at("a").x + NODE_W)
    expect(at("b2").y).toBeGreaterThan(at("b1").y + NODE_H)
  })

  it("centres a short lane against the tallest one", () => {
    const mid = (at("b1").y + at("b2").y + NODE_H) / 2
    expect(at("a").y + NODE_H / 2).toBeCloseTo(mid)
  })

  it("keeps every node inside the canvas", () => {
    for (const n of l.nodes) {
      expect(n.x + NODE_W).toBeLessThanOrEqual(l.width)
      expect(n.y + NODE_H).toBeLessThanOrEqual(l.height)
    }
  })

  it("draws forward, same-lane and backward edges", () => {
    expect(l.edges[0].path).toMatch(/^M .* C /)
    expect(l.edges[1].path).toMatch(/^M [\d.]+ [\d.]+ L /)
    expect(l.edges[2].path).toMatch(/^M .* C /)
  })

  it("rejects an edge that points at a missing node", () => {
    expect(() => layoutDiagram({ ...spec, edges: [{ from: "a", to: "nope" }] })).toThrow(/missing node/)
  })

  it("describes the flows in words", () => {
    expect(describeDiagram(spec)).toBe("A to B1 (x); B1 to B2; B2 to A")
  })
})

describe("case study data", () => {
  it("every case study belongs to a project, and slugs are unique", () => {
    const slugs = projects.map(projectSlug)
    expect(new Set(slugs).size).toBe(slugs.length)
    for (const slug of Object.keys(caseStudies)) expect(slugs).toContain(slug)
  })

  it("every diagram lays out without dangling edges", () => {
    for (const study of Object.values(caseStudies)) expect(() => layoutDiagram(study.diagram)).not.toThrow()
  })
})
