import type { CSSProperties } from "react"

import { cn } from "@/lib/utils"

/* A decorative miniature of a web-dev workspace: browser chrome, code editor, live
   preview and a network waterfall. It is drawn in `em`, so the parent scales it with
   font-size. It is aria-hidden: it illustrates, it never informs. */
const CORAL = "var(--glaze-rose)"
const AMBER = "var(--glaze-apricot)"
const AQUA = "var(--glaze-peach)"
const VIOLET = "var(--glaze-plum)"
const SOFT = "var(--ink-soft)"
const MUTE = "var(--ink-mute)"

const TRAFFIC = [CORAL, AMBER, AQUA]

/* editor lines: indent level, then syntax tokens as [color, width in em] */
type Token = [color: string, width: number]
const CODE: { indent: number; tokens: Token[] }[] = [
  { indent: 0, tokens: [[VIOLET, 2.2], [SOFT, 3.4], [AQUA, 1.6]] },
  { indent: 1, tokens: [[VIOLET, 1.8], [SOFT, 2.6], [MUTE, 1.2]] },
  { indent: 1, tokens: [[AMBER, 2.4], [MUTE, 0.8], [AQUA, 3.2]] },
  { indent: 2, tokens: [[AQUA, 1.4], [SOFT, 4.2]] },
  { indent: 2, tokens: [[CORAL, 2], [SOFT, 2.8], [VIOLET, 1.6]] },
  { indent: 1, tokens: [[MUTE, 1.2]] },
  { indent: 0, tokens: [[VIOLET, 1.4]] },
]

/* network waterfall: mostly fast, one heavy bundle and one slow API call */
const REQUESTS = [
  { left: 0, width: 14, color: AQUA },
  { left: 14, width: 20, color: AQUA },
  { left: 14, width: 44, color: CORAL },
  { left: 38, width: 16, color: AQUA },
  { left: 58, width: 30, color: AMBER },
  { left: 60, width: 12, color: AQUA },
]

export function BoardMock({
  className,
  size = "sm",
}: {
  className?: string
  /** "sm" = editor + preview (hero), "lg" = adds feature cards and the network waterfall (project cover) */
  size?: "sm" | "lg"
}) {
  const lg = size === "lg"
  const code = lg ? CODE : CODE.slice(0, 5)

  return (
    <div
      aria-hidden
      className={cn(
        "clay-well flex flex-col gap-[0.85em] p-[2.5em] [--clay-radius:1.2em]",
        className
      )}
    >
      {/* browser chrome */}
      <div className="flex items-center gap-[0.45e  m]">
        {TRAFFIC.map((c) => (
          <span
            key={c}
            className="bulb text-[0.7em]"
            style={{ "--bulb-color": c } as CSSProperties }
          />
        ))}
        <span className="ml-[0.5em] flex h-[1.4em] flex-1 items-center gap-[0.6em] rounded-full bg-foreground/10 px-[0.7em]">
          <span className="relative grid place-items-center">
            <span
              className="absolute inset-0 rounded-full animate-[ping-ring_2s_ease-out_infinite]"
              style={{ background: AQUA }}
            />
            <span
              className="bulb relative text-[0.55em]"
              style={{ "--bulb-color": AQUA } as CSSProperties }
            />
          </span>
          <span className="h-[0.5em] w-[45%] rounded-full bg-foreground/15" />
        </span>
      </div>

      {/* editor + live preview */}
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-[0.9em]">
        <div className="flex min-w-0 flex-col gap-[0.5em] overflow-hidden rounded-[0.8em] bg-foreground/5 p-[0.8em]">
          {code.map((line, i) => (
            <div
              key={i}
              className="flex items-center gap-[0.35em]"
              style={{ paddingLeft: `${line.indent * 1.1}em` }}
            >
              {line.indent === 0 && (
                <span className="h-[0.5em] w-[0.6em] shrink-0 rounded-full bg-foreground/10" />
              )}
              {line.tokens.map(([color, w], j) => (
                <span
                  key={j}
                  className="h-[0.6em] shrink-0 rounded-full"
                  style={{ width: `${w}em`, background: color, opacity: 0.8 }}
                />
              ))}
            </div>
          ))}
        </div>

        <div className="flex min-w-0 flex-col gap-[0.8em] overflow-hidden rounded-[0.8em] bg-foreground/5 p-[0.8em]">
          {/* nav */}
          <div className="flex items-center gap-[0.5em]">
            <span
              className="bulb text-[0.8em]"
              style={{ "--bulb-color": VIOLET } as CSSProperties }
            />
            <span className="ml-auto h-[0.5em] w-[1.6em] rounded-full bg-foreground/15" />
            <span className="h-[0.5em] w-[1.6em] rounded-full bg-foreground/15" />
            <span className="h-[0.5em] w-[1.6em] rounded-full bg-foreground/15" />
          </div>
          {/* hero copy */}
          <div className="flex flex-col gap-[0.45em]">
            <span className="block h-[0.9em] w-[85%] rounded-full bg-foreground/20" />
            <span className="block h-[0.9em] w-[60%] rounded-full bg-foreground/20" />
            <span className="mt-[0.2em] block h-[0.5em] w-[75%] rounded-full bg-foreground/10" />
          </div>
          {/* call to action */}
          <span
            className="clay clay-xs h-[1.5em] w-[4em] rounded-full"
            style={{ "--clay-surface": "var(--tone-peach)" } as CSSProperties }
          />
          {/* feature cards */}
          {lg && (
            <div className="mt-[0.2em] grid grid-cols-3 gap-[0.5em]">
              {[VIOLET, AQUA, AMBER].map((c) => (
                <span
                  key={c}
                  className="clay clay-xs flex h-[2.6em] items-start p-[0.4em]"
                  style={{ "--clay-radius": "0.6em" } as CSSProperties }
                >
                  <span
                    className="h-[0.7em] w-[0.7em] rounded-full"
                    style={{ background: c }}
                  />
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* network waterfall */}
      {lg && (
        <div className="mt-[0.3em] flex flex-col gap-[0.4em]">
          {REQUESTS.map((r, i) => (
            <div key={i} className="flex items-center gap-[0.6em]">
              <span className="h-[0.5em] w-[2.2em] shrink-0 rounded-full bg-foreground/10" />
              <span className="block h-[0.55em] flex-1 rounded-full bg-foreground/5">
                <span
                  className="block h-full rounded-full"
                  style={{
                    marginLeft: `${r.left}%`,
                    width: `${r.width}%`,
                    background: r.color,
                    opacity: r.color === AQUA ? 0.55 : 1,
                  }}
                />
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}