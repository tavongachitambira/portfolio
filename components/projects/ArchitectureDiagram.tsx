import { describeDiagram, layoutDiagram, NODE_H, NODE_W, type DiagramSpec } from "@/lib/diagram"

/* Inline SVG, rendered on the server: no client JS, crisp at any size, and it follows the theme
   because every colour is a CSS variable. On narrow screens it scrolls sideways inside its card
   instead of shrinking the text to nothing. */
export function ArchitectureDiagram({ spec }: { spec: DiagramSpec }) {
  const { width, height, laneLabels, nodes, edges } = layoutDiagram(spec)
  const uid = spec.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")

  return (
    <div className="scrollbar-clay overflow-x-auto">
      <svg
        role="img"
        aria-labelledby={`${uid}-title ${uid}-desc`}
        viewBox={`0 0 ${width} ${height}`}
        className="mx-auto block h-auto w-full min-w-[640px]"
        style={{ maxWidth: width }}
      >
        <title id={`${uid}-title`}>{spec.title}</title>
        <desc id={`${uid}-desc`}>{describeDiagram(spec)}</desc>
        <defs>
          <marker id={`${uid}-arrow`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" style={{ fill: "var(--primary)" }} />
          </marker>
        </defs>

        {laneLabels.map((lane) => (
          <text
            key={lane.label}
            x={lane.x}
            y={22}
            textAnchor="middle"
            style={{ fill: "var(--muted-foreground)", fontFamily: "var(--font-geist-mono), monospace", fontSize: 11, letterSpacing: "0.14em" }}
          >
            {lane.label.toUpperCase()}
          </text>
        ))}

        {/* edges sit under the nodes so a curve never covers text */}
        {edges.map((edge) => (
          <path
            key={`${edge.from}-${edge.to}`}
            d={edge.path}
            fill="none"
            strokeWidth={1.75}
            strokeLinecap="round"
            markerEnd={`url(#${uid}-arrow)`}
            style={{ stroke: "var(--primary)", opacity: 0.75 }}
          />
        ))}

        {nodes.map((node) => (
          <g key={node.id} transform={`translate(${node.x} ${node.y})`}>
            <rect
              width={NODE_W}
              height={NODE_H}
              rx={14}
              strokeWidth={1}
              style={{ fill: "var(--card)", stroke: "var(--border)" }}
            />
            <text
              x={NODE_W / 2}
              y={node.sub ? 24 : NODE_H / 2 + 5}
              textAnchor="middle"
              style={{ fill: "var(--foreground)", fontSize: 14, fontWeight: 700 }}
            >
              {node.label}
            </text>
            {node.sub && (
              <text
                x={NODE_W / 2}
                y={42}
                textAnchor="middle"
                style={{ fill: "var(--muted-foreground)", fontSize: 10.5 }}
              >
                {node.sub}
              </text>
            )}
          </g>
        ))}

        {edges.map(
          (edge) =>
            edge.label && (
              <g key={`label-${edge.from}-${edge.to}`} transform={`translate(${edge.mid.x} ${edge.mid.y})`}>
                <rect
                  x={-(edge.label.length * 3.1 + 8)}
                  y={-9}
                  width={edge.label.length * 6.2 + 16}
                  height={18}
                  rx={9}
                  style={{ fill: "var(--background)", stroke: "var(--border)" }}
                />
                <text
                  y={4}
                  textAnchor="middle"
                  style={{ fill: "var(--foreground)", fontFamily: "var(--font-geist-mono), monospace", fontSize: 10 }}
                >
                  {edge.label}
                </text>
              </g>
            ),
        )}
      </svg>
    </div>
  )
}
