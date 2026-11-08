import { describe, expect, it } from "vitest"

import { citedNumbers, parseAnswer, parseInline } from "@/lib/ask/render"

describe("parseInline", () => {
  it("recognises bold, code and citations", () => {
    expect(parseInline("A **bold** word, `code` and a cite [1].", 3)).toEqual([
      { kind: "text", text: "A " },
      { kind: "strong", text: "bold" },
      { kind: "text", text: " word, " },
      { kind: "code", text: "code" },
      { kind: "text", text: " and a cite " },
      { kind: "cite", n: 1 },
      { kind: "text", text: "." },
    ])
  })

  it("expands [1, 2] into two citations", () => {
    expect(parseInline("Both [1, 2].", 3).filter((i) => i.kind === "cite")).toEqual([
      { kind: "cite", n: 1 },
      { kind: "cite", n: 2 },
    ])
  })

  it("leaves a citation to a source that doesn't exist as plain text", () => {
    expect(parseInline("See [7].", 3)).toEqual([{ kind: "text", text: "See [7]." }])
    expect(parseInline("See [0].", 3)).toEqual([{ kind: "text", text: "See [0]." }])
    expect(parseInline("See [1, 9].", 3)).toEqual([{ kind: "text", text: "See [1, 9]." }])
  })

  it("never builds a link: markdown links and raw HTML stay literal text", () => {
    const md = parseInline("[click](javascript:alert(1))", 3)
    expect(md.every((i) => i.kind === "text")).toBe(true)
    expect(md.map((i) => (i as { text: string }).text).join("")).toBe("[click](javascript:alert(1))")

    const html = parseInline('<img src=x onerror="alert(1)"> <a href="https://evil.example">x</a>', 3)
    expect(html).toEqual([{ kind: "text", text: '<img src=x onerror="alert(1)"> <a href="https://evil.example">x</a>' }])
  })

  it("doesn't treat unfinished markup (mid-stream) as formatting", () => {
    expect(parseInline("half **bold", 3)).toEqual([{ kind: "text", text: "half **bold" }])
    expect(parseInline("half `code", 3)).toEqual([{ kind: "text", text: "half `code" }])
    expect(parseInline("cite [1", 3)).toEqual([{ kind: "text", text: "cite [1" }])
  })
})

describe("parseAnswer", () => {
  it("splits paragraphs on blank lines and joins soft line breaks", () => {
    const blocks = parseAnswer("First line\nsame paragraph.\n\nSecond paragraph.", 0)
    expect(blocks).toHaveLength(2)
    expect(blocks[0]).toEqual({ kind: "p", inline: [{ kind: "text", text: "First line same paragraph." }] })
  })

  it("groups bullets into one list, whichever marker they use", () => {
    const blocks = parseAnswer("Intro:\n- one [1]\n* two\n• three\n\nOutro.", 2)
    expect(blocks.map((b) => b.kind)).toEqual(["p", "ul", "p"])
    const list = blocks[1]
    expect(list.kind === "ul" && list.items).toHaveLength(3)
  })

  it("shows a markdown heading as bold text instead of a stray #", () => {
    expect(parseAnswer("## The stack", 0)).toEqual([{ kind: "p", inline: [{ kind: "strong", text: "The stack" }] }])
  })

  it("handles CRLF and empty input", () => {
    expect(parseAnswer("a\r\n\r\nb", 0)).toHaveLength(2)
    expect(parseAnswer("", 0)).toEqual([])
    expect(parseAnswer("   \n\n  ", 0)).toEqual([])
  })

  it("lists cited sources once each, in order of first mention", () => {
    const blocks = parseAnswer("Uses Redis [2]. Also Yjs [1][2].\n- bullet [3]", 3)
    expect(citedNumbers(blocks)).toEqual([2, 1, 3])
  })
})
