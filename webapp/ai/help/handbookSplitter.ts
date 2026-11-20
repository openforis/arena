/**
 * Reads the Arena handbook from the XML of its Word file (word/document.xml) and splits it into sections at its
 * headings. No imports and erasable TypeScript only: scripts/ai/updateHandbook.ts runs it with node
 * --experimental-strip-types.
 */
// anchor: URL fragment of the section in the manual PDF ("nameddest=5Fs5o1khyfunlc"), null without a bookmark
export type HandbookSection = { id: string; title: string; path: string[]; text: string; anchor?: string | null }

// source: the Word file the sections were read from; pdf: the same manual, where a section can be opened
export type Handbook = { source: string; pdf: string; sections: HandbookSection[] }

// a paragraph or a table row; level (Heading1 = 1) and bookmark only for a heading
export type HandbookBlock = { text: string; level?: number; bookmark?: string }

export const HANDBOOK_LANGS = ['en', 'fr', 'es']

export const SECTION_MAX_CHARS = 4000

// fewer section ids than this means the headings of the Word file lost their styles
export const HANDBOOK_MIN_IDS = 50

type DocxState = {
  blocks: HandbookBlock[]
  paragraph: (HandbookBlock & { list?: boolean }) | null
  inText: boolean
  tableDepth: number
  row: string[]
  cell: string[]
}

const XML_ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" }

const decodeEntities = (text: string): string =>
  text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entity, name: string) => {
    if (name.startsWith('#x')) return String.fromCodePoint(Number.parseInt(name.slice(2), 16))
    if (name.startsWith('#')) return String.fromCodePoint(Number.parseInt(name.slice(1), 10))
    return XML_ENTITIES[name] ?? entity
  })

const readAttribute = (attributes: string, name: string): string | null =>
  new RegExp(`\\s${name}="([^"]*)"`).exec(attributes)?.[1] ?? null

const addSpace = (state: DocxState): void => {
  if (state.paragraph) state.paragraph.text += ' '
}

// a paragraph of a table goes to its cell: a table row is one block
const endParagraph = (state: DocxState): void => {
  const { paragraph } = state
  state.paragraph = null
  if (!paragraph) return
  const text = paragraph.text.replace(/\s+/g, ' ').trim()
  if (state.tableDepth > 0) {
    if (text) state.cell.push(text)
    return
  }
  const { list, ...block } = paragraph
  // shortcut: every list item gets a dash, read word/numbering.xml if the numbers of numbered lists are needed
  state.blocks.push({ ...block, text: list && text && !block.level ? `- ${text}` : text })
}

const endRow = (state: DocxState): void => {
  if (state.tableDepth !== 1) return
  state.blocks.push({ text: state.row.filter(Boolean).join(' | ') })
  state.row = []
}

// the tags that matter, by name ("/" first for a closing tag); the cells of a nested table stay in the outer cell
const TAG_HANDLERS: Record<string, (state: DocxState, attributes: string) => void> = {
  'w:p': (state) => {
    state.paragraph = { text: '' }
  },
  '/w:p': endParagraph,
  'w:pStyle': (state, attributes) => {
    const level = /^Heading(\d)$/.exec(readAttribute(attributes, 'w:val') ?? '')?.[1]
    if (level && state.paragraph) state.paragraph.level = Number(level)
  },
  'w:numPr': (state) => {
    if (state.paragraph) state.paragraph.list = true
  },
  'w:bookmarkStart': (state, attributes) => {
    const name = readAttribute(attributes, 'w:name')
    if (name && state.paragraph && !state.paragraph.bookmark) state.paragraph.bookmark = name
  },
  'w:t': (state, attributes) => {
    state.inText = !attributes.endsWith('/')
  },
  '/w:t': (state) => {
    state.inText = false
  },
  'w:tab': addSpace,
  'w:br': addSpace,
  'w:tbl': (state) => {
    state.tableDepth += 1
  },
  '/w:tbl': (state) => {
    state.tableDepth -= 1
  },
  'w:tc': (state) => {
    if (state.tableDepth === 1) state.cell = []
  },
  '/w:tc': (state) => {
    if (state.tableDepth === 1) state.row.push(state.cell.join(' '))
  },
  '/w:tr': endRow,
}

// a WordprocessingML tag (name and attributes), any other tag, or text
const TOKEN = /<(\/?w:[a-zA-Z]+)\b([^>]*)>|<[^>]*>|([^<]+)/g

/**
 * Reads the paragraphs and table rows of a Word document, in document order.
 * shortcut: footnotes (word/footnotes.xml) and text boxes are not read, add them if the manual starts using them for content.
 * @param {string} xml - Content of word/document.xml.
 * @returns {HandbookBlock[]} The blocks.
 */
export const readDocxBlocks = (xml: string): HandbookBlock[] => {
  const state: DocxState = { blocks: [], paragraph: null, inText: false, tableDepth: 0, row: [], cell: [] }
  for (const [, tag, attributes, text] of xml.matchAll(TOKEN)) {
    if (tag) TAG_HANDLERS[tag]?.(state, attributes)
    else if (text && state.inText && state.paragraph) state.paragraph.text += decodeEntities(text)
  }
  return state.blocks
}

type Heading = { id: string; title: string; heading: string }

// "7.5.1. Title" (the space may be missing)
const NUMBERED_HEADING = /^((?:\d+\.)+)\s*(.*)$/
// "Annex 1. Title", "Annexe 1. Titre", "Anexo 1. Título"
const ANNEX_HEADING = /^\p{L}+ (\d+)\.\s*(.*)$/u

// the id is the section number ("A1" for an annex), or the title of an unnumbered heading (Acknowledgements)
const readHeading = (text: string): Heading => {
  const numbered = NUMBERED_HEADING.exec(text)
  if (numbered) return { id: numbered[1].slice(0, -1), title: numbered[2], heading: `${numbered[1]} ${numbered[2]}` }
  const annex = ANNEX_HEADING.exec(text)
  return annex ? { id: `A${annex[1]}`, title: annex[2], heading: text } : { id: text, title: text, heading: text }
}

// LibreOffice names the PDF destination of a bookmark after it, with the hex code of every character but letters,
// digits and "-" ("_Toc1" is "5FToc1")
const toAnchor = (bookmark: string): string =>
  `nameddest=${bookmark.replace(/[^0-9a-zA-Z-]/g, (char) => char.charCodeAt(0).toString(16).toUpperCase())}`

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

type OpenSection = Heading & { level: number; path: string[]; anchor: string | null; lines: string[] }

// a heading without a bookmark links to its parent section
const openSection = (stack: OpenSection[], block: HandbookBlock): OpenSection => {
  const level = block.level ?? 1
  while (stack.length > 0 && stack.at(-1).level >= level) stack.pop()
  const anchor = block.bookmark ? toAnchor(block.bookmark) : (stack.at(-1)?.anchor ?? null)
  const section = { ...readHeading(block.text), level, path: stack.map(({ heading }) => heading), anchor, lines: [] }
  stack.push(section)
  return section
}

const toSections = ({ id, title, path, anchor, lines }: OpenSection, maxChars: number): HandbookSection[] => {
  const parts = splitLongText(lines.filter(Boolean).join('\n'), maxChars)
  return parts.map((text, index) => {
    const suffix = parts.length > 1 ? ` (${index + 1}/${parts.length})` : ''
    return { id, title: `${title}${suffix}`, path, text, anchor }
  })
}

/**
 * Splits the blocks into sections at the headings (the text before the first heading is dropped).
 * @param {HandbookBlock[]} blocks - Paragraphs and table rows.
 * @param {number} [maxChars] - Longer sections are split into parts (" (2/3)" title suffix, same id).
 * @returns {HandbookSection[]} The sections, in document order.
 */
export const splitHandbook = (blocks: HandbookBlock[], maxChars: number = SECTION_MAX_CHARS): HandbookSection[] => {
  const opened: OpenSection[] = []
  const stack: OpenSection[] = []
  for (const block of blocks) {
    if (block.level && block.text) opened.push(openSection(stack, block))
    else opened.at(-1)?.lines.push(block.text)
  }
  return opened.flatMap((section) => toSections(section, maxChars))
}

/**
 * Builds the handbook file content of a language.
 * @param {object} params - Parameters.
 * @param {string} params.xml - Content of word/document.xml of the manual in that language.
 * @param {string} params.lang - Language of the manual (one of HANDBOOK_LANGS).
 * @returns {Handbook} The handbook.
 */
export const buildHandbook = ({ xml, lang }: { xml: string; lang: string }): Handbook => ({
  source: `https://github.com/openforis/arena/raw/master/docs/user-manual/arena-user-manual-${lang}.docx`,
  // GitHub Pages opens the PDF in the browser (a release asset is downloaded)
  pdf: `https://openforis.github.io/arena/arena-user-manual-${lang}.pdf`,
  sections: splitHandbook(readDocxBlocks(xml)),
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
    : `Only ${ids} handbook sections found (at least ${minIds} expected): did the heading styles change?`
}
