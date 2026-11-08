import { describe, expect, it } from "vitest"

import { LIMITS } from "@/lib/ask/messages"
import { buildCommands, filterCommands, groupCommands, searchCommands } from "@/lib/palette"

const commands = buildCommands({ askEnabled: true })
const labels = (list: { label: string }[]) => list.map((c) => c.label)

describe("buildCommands", () => {
  it("covers every section, the pages, and each case study", () => {
    const ids = commands.map((c) => c.id)
    for (const id of ["go-profile", "go-projects", "go-writing", "go-skills", "go-connect", "page-projects", "page-writing", "page-skills", "case-syncboard"]) {
      expect(ids).toContain(id)
    }
  })

  it("has unique ids", () => {
    expect(new Set(commands.map((c) => c.id)).size).toBe(commands.length)
  })

  it("only offers Ask when it is switched on", () => {
    expect(commands.some((c) => c.action.type === "ask")).toBe(true)
    expect(buildCommands({ askEnabled: false }).some((c) => c.action.type === "ask")).toBe(false)
  })

  it("has no theme switch", () => {
    expect(labels(commands).join(" ")).not.toMatch(/theme/i)
    expect(filterCommands(commands, "light")).toEqual([])
    expect(filterCommands(commands, "dark mode")).toEqual([])
  })

  it("links to profiles but never turns the mailto link into one", () => {
    const links = commands.filter((c) => c.group === "Links")
    expect(labels(links)).toEqual(expect.arrayContaining(["GitHub", "LinkedIn"]))
    for (const l of links) expect(l.action.type === "external" && l.action.href).not.toMatch(/^mailto:/)
  })

  it("leaves out projects that aren't on the site", () => {
    expect(JSON.stringify(commands)).not.toMatch(/educampus/i)
  })
})

describe("filterCommands", () => {
  it("returns everything, in order, for an empty query", () => {
    expect(filterCommands(commands, "")).toBe(commands)
    expect(filterCommands(commands, "   ")).toBe(commands)
  })

  it("matches by prefix and ranks the label match first", () => {
    const top = filterCommands(commands, "proj")
    expect(top.length).toBeGreaterThan(0)
    expect(labels(top.slice(0, 2))).toEqual(expect.arrayContaining(["Projects"]))
  })

  it("ignores case and accents: 'resume' finds 'Open résumé'", () => {
    expect(labels(filterCommands(commands, "RESUME"))).toContain("Open résumé")
  })

  it("finds a command through its keywords", () => {
    expect(labels(filterCommands(commands, "cv"))).toContain("Open résumé")
    expect(labels(filterCommands(commands, "hire"))).toContain("Contact")
    expect(labels(filterCommands(commands, "behind the code"))).toContain("Profile")
  })

  it("needs every word to match", () => {
    expect(labels(filterCommands(commands, "copy email"))[0]).toBe("Copy email address")
    expect(filterCommands(commands, "copy zebra")).toEqual([])
  })

  it("puts an exact name first", () => {
    expect(filterCommands(commands, "github")[0].label).toBe("GitHub")
  })

  it("tolerates a skipped letter on longer words, but not on two-letter ones", () => {
    expect(labels(filterCommands(commands, "lnkdin"))).toContain("LinkedIn")
    expect(filterCommands(commands, "zq")).toEqual([])
  })

  it("returns nothing for gibberish", () => {
    expect(filterCommands(commands, "xyzzy")).toEqual([])
  })

  it("finds the case study by what's in it", () => {
    expect(labels(filterCommands(commands, "syncboard"))).toContain("SyncBoard case study")
    expect(labels(filterCommands(commands, "architecture"))).toContain("SyncBoard case study")
  })
})

describe("searchCommands", () => {
  it("adds an 'Ask about' option last once the query is long enough", () => {
    const results = searchCommands(commands, "how is auth done", true)
    const last = results[results.length - 1]
    expect(last.action).toEqual({ type: "ask", question: "how is auth done" })
    expect(last.label).toContain("how is auth done")
  })

  it("is the only option when nothing else matches", () => {
    const results = searchCommands(commands, "qqqq wwww", true)
    expect(results).toHaveLength(1)
    expect(results[0].action.type).toBe("ask")
  })

  it("stays out of the way for short queries and when Ask is off", () => {
    expect(searchCommands(commands, "ab", true).some((c) => c.id === "ask-about")).toBe(false)
    expect(searchCommands(commands, "how is auth done", false).some((c) => c.id === "ask-about")).toBe(false)
    expect(searchCommands(commands, "", true)).toBe(commands)
  })

  it("caps the question at what the API accepts", () => {
    const results = searchCommands(commands, "q".repeat(LIMITS.user + 100), true)
    const action = results[results.length - 1].action
    expect(action.type === "ask" && action.question?.length).toBe(LIMITS.user)
  })
})

describe("groupCommands", () => {
  it("groups in order of first appearance without losing anything", () => {
    const groups = groupCommands(commands)
    expect(groups.map((g) => g.group)).toEqual(["Go to", "Pages", "Actions", "Links"])
    expect(groups.flatMap((g) => g.items)).toHaveLength(commands.length)
  })
})
