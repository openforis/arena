/**
 * Splits the text of the Arena handbook PDF (pdftotext -layout) into sections, using its numbered table of contents.
 * No imports and erasable TypeScript only: scripts/ai/updateHandbook.ts runs it with node --experimental-strip-types.
 */
// anchor: URL fragment of the section in the PDF ("page=33")
export type HandbookSection = { id: string; title: string; path: string[]; text: string; anchor?: string | null }

export type Handbook = { source: string; version: string | null; fetchedAt: string; sections: HandbookSection[] }

type TocEntry = { id: string; heading: string; title: string; level: number }

export const SECTION_MAX_CHARS = 4000

// fewer section ids than this means the export format changed
export const HANDBOOK_MIN_IDS = 50

// "6.1.2. Branding.........18", "Annex 1. System architecture.........150"
const TOC_NUMBER = /^((?:\d+\.)+|Annex \d+\.)\s/
const UNNUMBERED_TOC_LINE = /^(Acknowledgements)[\s.]{2,}\d+\s*$/
// header and page number of each PDF page
// shortcut: a body line with only digits is dropped too, tell the footer by its position if that loses content
const PAGE_NOISE = /^\s*(?:Open Foris Arena - Handbook|\d+)\s*$/

/**
 * Normalizes the export: no BOM, LF line ends.
 * @param {string} raw - Export text.
 * @returns {string[]} The lines.
 */
export const toLines = (raw: string): string[] =>
  raw
    .replace(/^\uFEFF/, '')
    .replace(/\r\n?/g, '\n')
    .split('\n')

/**
 * Returns the title of a table of contents entry without the page number: the dot leader and the digits at its end.
 * @param {string} text - The entry after its number.
 * @returns {string|null} The title, or null when the entry has no page number.
 */
const readTocTitle = (text: string): string | null => {
  let digitsStart = text.length
  while (digitsStart > 0 && text[digitsStart - 1] >= '0' && text[digitsStart - 1] <= '9') digitsStart -= 1
  if (digitsStart === text.length) return null
  let titleEnd = digitsStart
  while (titleEnd > 0 && /[\s.]/.test(text[titleEnd - 1])) titleEnd -= 1
  return titleEnd > 0 && digitsStart - titleEnd >= 2 ? text.slice(0, titleEnd) : null
}

const toTocEntry = (line: string): TocEntry | null => {
  const trimmed = line.trim()
  const numbered = TOC_NUMBER.exec(trimmed)
  const title = numbered ? readTocTitle(trimmed.slice(numbered[0].length).trimStart()) : null
  if (numbered && title !== null) {
    const number = numbered[1]
    const annex = /^Annex (\d+)\.$/.exec(number)
    const id = annex ? `A${annex[1]}` : number.slice(0, -1)
    const level = annex ? 1 : id.split('.').length
    return { id, heading: `${number} ${title}`, title, level }
  }
  const unnumbered = UNNUMBERED_TOC_LINE.exec(trimmed)
  return unnumbered ? { id: unnumbered[1], heading: unnumbered[1], title: unnumbered[1], level: 1 } : null
}

/**
 * Reads the table of contents (the lines after "Content" up to the first text line that is not an entry).
 * @param {string[]} lines - Export lines.
 * @returns {{entries: TocEntry[], end: number}} The entries and the index of the first line after the table.
 */
export const readToc = (lines: string[]): { entries: TocEntry[]; end: number } => {
  const start = lines.findIndex((line) => line.trim() === 'Content')
  const entries: TocEntry[] = []
  let index = start + 1
  while (start >= 0 && index < lines.length) {
    const entry = toTocEntry(lines[index])
    if (entry) entries.push(entry)
    else if (lines[index].trim() && !PAGE_NOISE.test(lines[index])) break
    index += 1
  }
  return { entries, end: index }
}

type Heading = { entry: TocEntry; line: number; textLine: number }

// the layout export pads with spaces and wraps long headings: headings are compared without white space
const squash = (text: string): string => text.replace(/\s+/g, '')

// lines the heading takes at index (a long one wraps onto a second line), 0 when it isn't there
const countHeadingLines = (lines: string[], index: number, heading: string): number => {
  const first = squash(lines[index])
  if (first === heading) return 1
  return first && first + squash(lines[index + 1] ?? '') === heading ? 2 : 0
}

// body line of each entry's heading, searched forward; an entry without a body heading is dropped (its text stays
// in the previous section)
const findHeadings = (lines: string[], entries: TocEntry[], from: number): Heading[] => {
  const found: Heading[] = []
  let position = from
  for (const entry of entries) {
    const heading = squash(entry.heading)
    let index = position
    while (index < lines.length && countHeadingLines(lines, index, heading) === 0) index += 1
    if (index < lines.length) {
      const textLine = index + countHeadingLines(lines, index, heading)
      found.push({ entry, line: index, textLine })
      position = textLine
    }
  }
  return found
}

// pdftotext starts every page after the first with a form feed
const getPage = (lines: string[], index: number): number =>
  lines.slice(0, index + 1).filter((line) => line.includes('\f')).length + 1

const cleanText = (lines: string[]): string =>
  lines
    .filter((line) => !PAGE_NOISE.test(line))
    .map((line) => line.trim().replace(/\s{2,}/g, '  '))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

// splits at line ends; a single line longer than maxChars is cut
const splitLongText = (text: string, maxChars: number): string[] => {
  if (text.length <= maxChars) return [text]
  const parts: string[] = []
  let current = ''
  for (const paragraph of text.split('\n')) {
    if (current && current.length + paragraph.length + 1 > maxChars) {
      parts.push(current)
      current = ''
    }
    current = current ? `${current}\n${paragraph}` : paragraph
    while (current.length > maxChars) {
      parts.push(current.slice(0, maxChars))
      current = current.slice(maxChars)
    }
  }
  if (current) parts.push(current)
  return parts
}

const buildPath = (stack: TocEntry[], entry: TocEntry): string[] => {
  while (stack.length > 0 && stack.at(-1).level >= entry.level) stack.pop()
  const path = stack.map((ancestor) => ancestor.heading)
  stack.push(entry)
  return path
}

/**
 * Splits the export into sections.
 * @param {string} raw - Export text.
 * @param {number} [maxChars] - Longer sections are split into parts (" (2/3)" title suffix, same id).
 * @returns {HandbookSection[]} The sections, in document order.
 */
export const splitHandbook = (raw: string, maxChars: number = SECTION_MAX_CHARS): HandbookSection[] => {
  const lines = toLines(raw)
  const { entries, end } = readToc(lines)
  const headings = findHeadings(lines, entries, end)
  const sections: HandbookSection[] = []
  const stack: TocEntry[] = []
  for (const [index, { entry, line, textLine }] of headings.entries()) {
    const nextLine = index + 1 < headings.length ? headings[index + 1].line : lines.length
    const path = buildPath(stack, entry)
    const parts = splitLongText(cleanText(lines.slice(textLine, nextLine)), maxChars)
    const anchor = `page=${getPage(lines, line)}`
    for (const [partIndex, text] of parts.entries()) {
      const suffix = parts.length > 1 ? ` (${partIndex + 1}/${parts.length})` : ''
      sections.push({ id: entry.id, title: `${entry.title}${suffix}`, path, text, anchor })
    }
  }
  return sections
}

/**
 * Returns the handbook version (the "ver. x.y" line of the title page), or null.
 * @param {string} raw - Export text.
 * @returns {string|null} The version.
 */
export const readHandbookVersion = (raw: string): string | null => {
  const match = /^[ \t\f]*ver\.\s*(\S+)\s*$/m.exec(raw.replaceAll('\r', ''))
  return match ? match[1] : null
}

/**
 * Counts the table-of-contents entries and the ones found in the body (for the update script's report).
 * @param {string} raw - Export text.
 * @returns {{toc: number, found: number}} The counts.
 */
export const countHeadings = (raw: string): { toc: number; found: number } => {
  const lines = toLines(raw)
  const { entries, end } = readToc(lines)
  return { toc: entries.length, found: findHeadings(lines, entries, end).length }
}

/**
 * Builds the handbook file content.
 * @param {object} params - Parameters.
 * @param {string} params.raw - Export text.
 * @param {string} params.source - URL of the document.
 * @param {string} params.fetchedAt - Download date (ISO).
 * @returns {Handbook} The handbook.
 */
export const buildHandbook = ({
  raw,
  source,
  fetchedAt,
}: {
  raw: string
  source: string
  fetchedAt: string
}): Handbook => ({
  source,
  version: readHandbookVersion(raw),
  fetchedAt,
  sections: splitHandbook(raw),
})

/**
 * Checks that the handbook looks complete.
 * @param {Handbook} handbook - Handbook.
 * @param {number} [minIds] - Minimum number of distinct section ids.
 * @returns {string|null} The problem, or null when it looks complete.
 */
export const checkHandbook = (handbook: Handbook, minIds: number = HANDBOOK_MIN_IDS): string | null => {
  const ids = new Set(handbook.sections.map((section) => section.id)).size
  return ids >= minIds
    ? null
    : `Only ${ids} handbook sections found (at least ${minIds} expected): did the export format change?`
}
