/* Decorative neural net + sigmoid formula + loss curve + training log + single output value, in the clay palette.
   Server component, no hooks. Connections draw once, the output layer pulses. */
const LAYERS = [5, 6, 6, 6, 3]
const GAPS = [13, 13, 13, 13, 17]
const LAYER_X = [32, 72, 112, 152, 192]
const LAYER_LABELS = ["hidden layer 1", "hidden layer 2", "hidden layer 3", "output layer"]
const CY = 50
const LAST = LAYERS.length - 1

const OUTPUT_VALUE = "0.86"

const nodeYs = (n: number, gap: number) =>
  Array.from({ length: n }, (_, i) => CY + (i - (n - 1) / 2) * gap)

const LOG = [
  "epoch 10/10",
  "54000/54000 [=====] - 9s",
  "loss: 0.4075 - acc: 0.8598",
  "val_loss: 0.4305",
  "val_acc: 0.8522",
]

export function NeuralViz() {
  const ys = LAYERS.map((n, l) => nodeYs(n, GAPS[l]))

  return (
    <svg viewBox="0 0 320 168" fill="none" className="block w-full" aria-hidden>
      <defs>
        <linearGradient id="loss-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" style={{ stopColor: "var(--glaze-plum)" }} />
          <stop offset="1" style={{ stopColor: "var(--glaze-peach)" }} />
        </linearGradient>

        <pattern id="plus-grid" width="9" height="9" patternUnits="userSpaceOnUse">
          <path
            d="M4.5 2.5v4M2.5 4.5h4"
            strokeWidth="0.8"
            strokeLinecap="round"
            style={{ stroke: "var(--ink-mute)" }}
          />
        </pattern>
        <mask id="curve-reveal" maskUnits="userSpaceOnUse" x="0" y="80" width="200" height="80">
          <path
            d="M48 94 C 54 128, 76 140, 150 143"
            stroke="#fff"
            strokeWidth="6"
            pathLength={1}
            strokeDasharray="1"
            style={{ animation: "draw 1.6s var(--ease-out) 0.9s backwards" }}
          />
        </mask>
      </defs>

      {/* layer labels */}
      <g
        style={{ fill: "var(--ink-mute)", fontSize: 4, fontFamily: "ui-monospace, monospace" }}
        textAnchor="middle"
      >
        {LAYER_LABELS.map((name, i) => (
          <text key={name} x={LAYER_X[i + 1]} y="9">
            {name}
          </text>
        ))}
      </g>

      {/* connections: every node to every node in the next layer */}
      <g stroke="currentColor" strokeWidth="0.6" opacity="0.22">
        {LAYERS.slice(0, -1).flatMap((_, l) =>
          ys[l].flatMap((y1, i) =>
            ys[l + 1].map((y2, j) => (
              <line
                key={`${l}-${i}-${j}`}
                x1={LAYER_X[l]}
                y1={y1}
                x2={LAYER_X[l + 1]}
                y2={y2}
                pathLength={1}
                strokeDasharray="1"
                style={{ animation: `draw 0.9s var(--ease-out) ${0.4 + l * 0.22}s backwards` }}
              />
            ))
          )
        )}
      </g>

      {/* output arrows */}
      <g
        style={{ stroke: "var(--glaze-peach)" }}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {ys[LAST].map((y) => (
          <g key={y}>
            <line x1={LAYER_X[LAST] + 7} x2="222" y1={y} y2={y} />
            <path d={`M218.5 ${y - 2.2} L222 ${y} L218.5 ${y + 2.2}`} />
          </g>
        ))}
      </g>

      {/* nodes */}
      {LAYERS.map((_, l) =>
        ys[l].map((y, i) => (
          <circle
            key={`n-${l}-${i}`}
            cx={LAYER_X[l]}
            cy={y}
            r="3.4"
            style={{
              fill:
                l === 0
                  ? "var(--ink-soft)"
                  : l === LAST
                    ? "var(--glaze-peach)"
                    : "var(--glaze-plum)",
            }}
          />
        ))
      )}

      {/* one output node pulses: the "prediction" */}
      <circle
        cx={LAYER_X[LAST]}
        cy={ys[LAST][1]}
        r="7"
        style={{
          fill: "var(--glaze-peach)",
          opacity: 0.3,
          transformBox: "fill-box",
          transformOrigin: "center",
          animation: "halo-pulse 2.4s ease-in-out 2s infinite",
        }}
      />

      {/* single numerical output (replaces the dotted head profile) */}
      <rect x="176" y="98" width="126" height="52" fill="url(#plus-grid)" opacity="0.45" />
      <text
        x="230"
        y={CY}
        fontSize="34"
        fontWeight="700"
        dominantBaseline="central"
        fill="url(#loss-grad)"
        style={{ fontFamily: "ui-monospace, monospace", letterSpacing: "-0.04em" }}
      >
        {OUTPUT_VALUE}
      </text>

      {/* sigmoid: f(x) = L / (1 + e^(-k(x - x0))) */}
      <g
        style={{ fill: "var(--ink-soft)", fontFamily: "ui-serif, Georgia, serif", fontStyle: "italic" }}
      >
        <text x="112" y="96" fontSize="8" textAnchor="end">
          f(x) =
        </text>
        <text x="148" y="91" fontSize="8" textAnchor="middle">
          L
        </text>
        <text x="148" y="102.5" fontSize="8" textAnchor="middle">
          1 + e
          <tspan dy="-3" fontSize="5">
            -k(x-x₀)
          </tspan>
        </text>
      </g>
      <line x1="116" x2="180" y1="93.5" y2="93.5" stroke="currentColor" strokeWidth="0.7" opacity="0.6" />

      {/* loss axes + ticks */}
      <g stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" opacity="0.35">
        <line x1="46" x2="46" y1="92" y2="146" />
        <line x1="46" x2="150" y1="146" y2="146" />
        {[104, 118, 132].map((y) => (
          <line key={y} x1="44" x2="46" y1={y} y2={y} />
        ))}
        {[70, 94, 118].map((x) => (
          <line key={x} x1={x} x2={x} y1="146" y2="148" />
        ))}
      </g>
      <g
        style={{ fill: "var(--ink-mute)", fontSize: 5, fontFamily: "ui-monospace, monospace" }}
        textAnchor="end"
      >
        <text x="41" y="105.7">3</text>
        <text x="41" y="119.7">2</text>
        <text x="41" y="133.7">1</text>
      </g>
      <g
        style={{ fill: "var(--ink-mute)", fontSize: 5, fontFamily: "ui-monospace, monospace" }}
        textAnchor="middle"
      >
        <text x="70" y="154">1</text>
        <text x="94" y="154">2</text>
        <text x="118" y="154">3</text>
        <text
          x="111"
          y="163"
          style={{ fontFamily: "ui-serif, Georgia, serif", fontStyle: "italic", fontSize: 7 }}
        >
          e
        </text>
      </g>

      {/* dashed guides */}
      <g stroke="currentColor" strokeWidth="0.6" strokeDasharray="1.5 1.5" opacity="0.35">
        <line x1="70" x2="70" y1="146" y2="128" />
        <line x1="111" x2="111" y1="146" y2="139" />
      </g>

      {/* dashed loss curve, revealed once */}
      <path
        d="M48 94 C 54 128, 76 140, 150 143"
        stroke="url(#loss-grad)"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeDasharray="2.5 2.5"
        mask="url(#curve-reveal)"
      />
      <circle cx="150" cy="143" r="2.2" style={{ fill: "var(--glaze-peach)" }} />

      {/* training log */}
      <g style={{ fill: "var(--ink-soft)", fontSize: 5, fontFamily: "ui-monospace, monospace" }}>
        {LOG.map((line, i) => (
          <text key={line} x="54" y={111 + i * 6.4}>
            {line}
          </text>
        ))}
      </g>
    </svg>
  )
}