/**
 * Turns the manual references of an assistant answer into links to the Google Doc: section citations ("§5.2 Publish
 * a survey") and the placeholders the model may use as link targets ("[user manual](manual)", "[text](§5.2)").
 * The links come from the handbook, never from the model, so a small model can't write a broken one.
 */
import type { Handbook } from './handbookSplitter'

type ManualSection = { title: string; url: string }

export type ManualLinks = { manualUrl: string; sections: Map<string, ManualSection> }

const PART_SUFFIX = / \(\d+\/\d+\)$/

// code blocks, inline code and Markdown links are copied as they are (links get their target resolved)
const PROTECTED = /(```[\s\S]*?(?:```|$)|`[^`\n]*`|\[[^\]\n]*\]\([^)\n]*\))/
const LINK = /^\[([^\]\n]*)\]\(([^)\n]*)\)$/
const CITATION = /§ ?(A\d+|\d+(?:\.\d+)*)(\.?)/g
const SECTION_TARGET = /^§ ?(A\d+|\d+(?:\.\d+)*)\.?$/

/**
 * Prepares the links of the manual sections (the first part of each section id).
 * @param {Handbook} handbook - Handbook.
 * @returns {ManualLinks} The manual URL and the section links by id.
 */
export const createManualLinks = (handbook: Handbook): ManualLinks => {
  const manualUrl = `${handbook.source}/edit`
  const sections = new Map<string, ManualSection>()
  for (const { id, title, anchor } of handbook.sections) {
    if (sections.has(id)) continue
    const url = anchor ? `${manualUrl}#heading=${anchor}` : manualUrl
    sections.set(id, { title: title.replace(PART_SUFFIX, ''), url })
  }
  return { manualUrl, sections }
}

// length of the section title at the start of rest (after one space), 0 when it isn't there
const titleLength = (rest: string, title: string): number => {
  const candidate = rest.slice(0, title.length + 1)
  return candidate.toLowerCase() === ` ${title.toLowerCase()}` && !/[[\]]/.test(title) ? candidate.length : 0
}

const linkCitations = (text: string, links: ManualLinks): string => {
  let result = ''
  let position = 0
  for (const match of text.matchAll(CITATION)) {
    const section = links.sections.get(match[1])
    const start = match.index ?? 0
    if (!section || start < position) continue
    // the dot after the id ("§9. Data export") is linked only with the title: else it ends the sentence
    const end = start + match[0].length
    const title = titleLength(text.slice(end), section.title)
    const linkEnd = title > 0 ? end + title : end - match[2].length
    result += `${text.slice(position, start)}[${text.slice(start, linkEnd)}](${section.url})`
    position = linkEnd
  }
  return result + text.slice(position)
}

const resolveLinkTarget = (segment: string, links: ManualLinks): string => {
  const link = LINK.exec(segment)
  if (!link) return segment
  const [, label, target] = link
  if (target.trim() === 'manual') return `[${label}](${links.manualUrl})`
  const sectionId = SECTION_TARGET.exec(target.trim())?.[1]
  const section = sectionId ? links.sections.get(sectionId) : undefined
  return section ? `[${label}](${section.url})` : segment
}

/**
 * Links the manual references of an answer.
 * @param {string} markdown - Answer text (Markdown).
 * @param {ManualLinks} links - Manual links.
 * @returns {string} The text with the known references linked.
 */
export const linkManualReferences = (markdown: string, links: ManualLinks): string =>
  markdown
    .split(PROTECTED)
    .map((segment, index) => (index % 2 === 1 ? resolveLinkTarget(segment, links) : linkCitations(segment, links)))
    .join('')

/**
 * Tells whether an answer may contain manual references (to load the handbook only when needed).
 * @param {string} markdown - Answer text.
 * @returns {boolean} True when the text cites a section or links to the manual.
 */
export const hasManualReferences = (markdown: string): boolean =>
  markdown.includes('§') || markdown.includes('](manual)')
