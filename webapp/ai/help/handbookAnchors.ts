/**
 * Reads the heading anchors ("h.xxxx" ids) of the handbook's HTML export, so the assistant can link to a section.
 * No imports and erasable TypeScript only: scripts/ai/updateHandbook.ts runs it with node --experimental-strip-types.
 */

// Google Docs writes every heading as <hN ... id="h.xxxx">...</hN>
const HEADING = /<h([1-6])\b[^>]*\bid="([^"]+)"[^>]*>([\s\S]*?)<\/h\1>/g

const NAMED_ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' }

const decodeEntities = (text: string): string =>
  text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entity, name: string) => {
    if (name.startsWith('#x') || name.startsWith('#X')) return String.fromCodePoint(Number.parseInt(name.slice(2), 16))
    if (name.startsWith('#')) return String.fromCodePoint(Number.parseInt(name.slice(1), 10))
    return NAMED_ENTITIES[name.toLowerCase()] ?? entity
  })

/**
 * Normalizes a heading for matching: spaces collapsed, trimmed.
 * @param {string} text - Heading text.
 * @returns {string} The normalized heading.
 */
export const normalizeHeading = (text: string): string => text.replace(/\s+/g, ' ').trim()

/**
 * Maps the text of each heading of the HTML export to its anchor id (the first one when a heading repeats).
 * @param {string} html - HTML export.
 * @returns {Record<string, string>} Anchor id by normalized heading text.
 */
export const readHeadingAnchors = (html: string): Record<string, string> => {
  const anchors: Record<string, string> = {}
  for (const [, , id, content] of html.matchAll(HEADING)) {
    const heading = normalizeHeading(decodeEntities(content.replace(/<[^>]*>/g, '')))
    if (heading && !(heading in anchors)) anchors[heading] = id
  }
  return anchors
}
