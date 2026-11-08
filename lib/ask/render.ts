/* Turns a model answer into a small, safe tree. Only four things are recognised: paragraphs,
   "- " bullets, **bold**, `code`, and [n] citations. Everything else stays plain text and is
   escaped by React, and no links are ever built from the model's output (a [text](url) stays
   literal), so an answer can't smuggle in a link or markup. */

export type Inline =
  | { kind: "text"; text: string }
  | { kind: "strong"; text: string }
  | { kind: "code"; text: string }
  | { kind: "cite"; n: number }

export type Block = { kind: "p"; inline: Inline[] } | { kind: "ul"; items: Inline[][] }

const TOKEN = /(\*\*[^*\n]+\*\*|`[^`\n]+`|\[\d{1,2}(?:\s*,\s*\d{1,2})*\])/g

/** `maxCite` is how many sources exist: "[7]" with only three sources stays literal text. */
export function parseInline(text: string, maxCite: number): Inline[] {
  const out: Inline[] = []
  const push = (i: Inline) => {
    const last = out[out.length - 1]
    if (i.kind === "text" && last?.kind === "text") last.text += i.text
    else out.push(i)
  }

  for (const part of text.split(TOKEN)) {
    if (!part) continue
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) push({ kind: "strong", text: part.slice(2, -2) })
    else if (part.startsWith("`") && part.endsWith("`") && part.length > 2) push({ kind: "code", text: part.slice(1, -1) })
    else if (/^\[\d/.test(part) && part.endsWith("]")) {
      const nums = part.slice(1, -1).split(",").map((n) => Number(n.trim()))
      if (nums.every((n) => n >= 1 && n <= maxCite)) for (const n of nums) push({ kind: "cite", n })
      else push({ kind: "text", text: part })
    } else push({ kind: "text", text: part })
  }
  return out
}

const BULLET = /^\s*(?:[-*•])\s+(.*)$/
const HEADING = /^\s{0,3}#{1,6}\s+(.*)$/

export function parseAnswer(text: string, maxCite: number): Block[] {
  const blocks: Block[] = []
  let paragraph: string[] = []
  let list: Inline[][] | null = null

  const flushParagraph = () => {
    if (paragraph.length) blocks.push({ kind: "p", inline: parseInline(paragraph.join(" "), maxCite) })
    paragraph = []
  }
  const flushList = () => {
    if (list) blocks.push({ kind: "ul", items: list })
    list = null
  }

  for (const line of text.replace(/\r\n?/g, "\n").split("\n")) {
    const bullet = BULLET.exec(line)
    const heading = HEADING.exec(line)

    if (!line.trim()) {
      flushParagraph()
      flushList()
    } else if (bullet) {
      flushParagraph()
      ;(list ??= []).push(parseInline(bullet[1], maxCite))
    } else if (heading) {
      // headings aren't part of this UI: show the words in bold instead of a stray "##"
      flushParagraph()
      flushList()
      blocks.push({ kind: "p", inline: [{ kind: "strong", text: heading[1].replace(/\*\*/g, "") }] })
    } else {
      flushList()
      paragraph.push(line.trim())
    }
  }
  flushParagraph()
  flushList()
  return blocks
}

/** The sources an answer actually cites, in order of first mention. */
export function citedNumbers(blocks: Block[]): number[] {
  const seen: number[] = []
  const scan = (inline: Inline[]) => {
    for (const i of inline) if (i.kind === "cite" && !seen.includes(i.n)) seen.push(i.n)
  }
  for (const b of blocks) {
    if (b.kind === "p") scan(b.inline)
    else b.items.forEach(scan)
  }
  return seen
}
