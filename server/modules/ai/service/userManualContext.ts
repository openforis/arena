/**
 * Plain text of the English user manual (docs/user-manual), used as context by the documentation chatbot.
 *
 * The English manual is used for every UI language: the model answers in the user language anyway, and
 * a single (stable) text keeps the provider prompt cache effective.
 */
import { promises as fs } from 'node:fs'
import path from 'node:path'

import JSZip from 'jszip'

import { ENV } from '@core/processUtils'

import * as Log from '@server/log/log'

const logger = Log.getLogger('UserManualContext')

const USER_MANUAL_RELATIVE_PATH = path.join('docs', 'user-manual', 'arena-user-manual-en.docx')

const XML_ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" }

const decodeXmlEntities = (text: string): string =>
  text.replaceAll(/&(amp|lt|gt|quot|apos|#\d+|#x[\da-f]+);/gi, (match, entity: string) => {
    const named = XML_ENTITIES[entity.toLowerCase()]
    if (named) return named
    const codePoint =
      entity[1].toLowerCase() === 'x' ? Number.parseInt(entity.slice(2), 16) : Number.parseInt(entity.slice(1), 10)
    return Number.isNaN(codePoint) ? match : String.fromCodePoint(codePoint)
  })

const extractParagraphText = (paragraphXml: string): string => {
  const parts: string[] = []
  for (const [, tag, text] of paragraphXml.matchAll(/<w:(t|tab|br|cr)\b[^>]*?(?:\/>|>([^<]*)<\/w:t>)/g)) {
    if (tag === 't') parts.push(text ?? '')
    else if (tag === 'tab') parts.push('\t')
    else parts.push('\n')
  }
  return decodeXmlEntities(parts.join('')).trim()
}

const getHeadingLevel = (paragraphXml: string): number | null => {
  const match = /<w:pStyle w:val="Heading(\d)"/.exec(paragraphXml)
  return match ? Number(match[1]) : null
}

/**
 * Converts the main document part of a .docx file (word/document.xml) into Markdown-like plain text:
 * headings are prefixed with '#', the table of contents is skipped (it only repeats the headings).
 * @param {string} documentXml - The content of word/document.xml.
 * @returns {string} The text of the document.
 */
export const docxDocumentXmlToText = (documentXml: string): string => {
  const withoutToc = documentXml.replaceAll(/<w:sdt>(?:(?!<\/w:sdt>)[\s\S])*?Table of Contents[\s\S]*?<\/w:sdt>/g, '')
  const lines: string[] = []
  for (const [paragraphXml] of withoutToc.matchAll(/<w:p\b[^>]*?(?:\/>|>[\s\S]*?<\/w:p>)/g)) {
    const text = extractParagraphText(paragraphXml)
    if (!text) continue
    const headingLevel = getHeadingLevel(paragraphXml)
    lines.push(headingLevel ? `\n${'#'.repeat(headingLevel)} ${text}` : text)
  }
  return lines.join('\n').trim()
}

const loadUserManualText = async (): Promise<string | null> => {
  const filePath = path.join(ENV.arenaRoot ?? process.cwd(), USER_MANUAL_RELATIVE_PATH)
  try {
    const zip = await JSZip.loadAsync(await fs.readFile(filePath))
    const documentXml = await zip.file('word/document.xml')?.async('string')
    if (!documentXml) throw new Error('word/document.xml not found')
    const fullText = docxDocumentXmlToText(documentXml)
    // Skip the cover page (title, version and date placeholders): start from the first chapter.
    const firstHeadingIndex = fullText.indexOf('# ')
    const text = firstHeadingIndex > 0 ? fullText.slice(firstHeadingIndex) : fullText
    logger.info(`user manual loaded as chatbot context (${text.length} characters)`)
    return text
  } catch (error) {
    logger.warn(`cannot load the user manual (${filePath}), the chatbot will answer without it: ${error}`)
    return null
  }
}

let userManualTextPromise: Promise<string | null> | null = null

/**
 * Returns the text of the English user manual (loaded once, then cached), or null if it is disabled or not available.
 * @returns {Promise<string|null>} The text of the user manual.
 */
export const getUserManualText = async (): Promise<string | null> => {
  if (!ENV.aiChatbotUserManualEnabled) return null
  userManualTextPromise ??= loadUserManualText()
  return userManualTextPromise
}
