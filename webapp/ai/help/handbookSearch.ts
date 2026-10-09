/**
 * BM25 search over the handbook sections (title and text) and the outline for the Help system prompt. No
 * embeddings, no server: the handbook is small (about 130 sections).
 */
import { AiLimits } from '@common/ai/limits'

import type { Handbook, HandbookSection } from './handbookSplitter'

const STOP_WORDS = new Set(
  (
    'a about above after again all also am an and any are as at be because been before being below between both but by ' +
    'can could did do does doing down during each few for from further had has have having he her here hers him his how ' +
    'i if in into is it its itself just me more most my no nor not now of off on once only or other our ours out over ' +
    'own same she should so some such than that the their theirs them then there these they this those through to too ' +
    'under until up very was we were what when where which while who whom why will with would you your yours'
  ).split(' ')
)

const TITLE_WEIGHT = 3
const K1 = 1.2
const B = 0.75

/**
 * Folds a plural term to its singular (crude, enough for "categories" / "category" and "surveys" / "survey").
 * @param {string} token - Term.
 * @returns {string} The singular term.
 */
const toSingular = (token: string): string => {
  if (token.length > 4 && token.endsWith('ies')) return `${token.slice(0, -3)}y`
  if (token.length > 3 && token.endsWith('s') && !token.endsWith('ss')) return token.slice(0, -1)
  return token
}

/**
 * Splits a text into search terms.
 * @param {string} text - Text.
 * @returns {string[]} The terms (lowercase, no accents, no stop words, singular).
 */
export const tokenize = (text: string): string[] =>
  text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token))
    .map(toSingular)

type IndexedSection = { section: HandbookSection; termCounts: Map<string, number>; length: number }

export type HandbookIndex = {
  sections: IndexedSection[]
  documentFrequency: Map<string, number>
  averageLength: number
}

export type HandbookSearchResult = HandbookSection & { truncated?: true }

/**
 * Counts the terms of a section (title terms weigh more).
 * @param {HandbookSection} section - Section.
 * @returns {object} The term counts and the weighted length.
 */
const countTerms = (section: HandbookSection): { termCounts: Map<string, number>; length: number } => {
  const termCounts = new Map<string, number>()
  let length = 0
  const add = (tokens: string[], weight: number) => {
    for (const token of tokens) {
      termCounts.set(token, (termCounts.get(token) ?? 0) + weight)
      length += weight
    }
  }
  add(tokenize(section.title), TITLE_WEIGHT)
  add(tokenize(section.text), 1)
  return { termCounts, length }
}

/**
 * Builds the search index of the handbook.
 * @param {Handbook} handbook - Handbook.
 * @returns {HandbookIndex} The index.
 */
export const buildHandbookIndex = (handbook: Handbook): HandbookIndex => {
  const sections = handbook.sections.map((section) => ({ section, ...countTerms(section) }))
  const documentFrequency = new Map<string, number>()
  for (const { termCounts } of sections) {
    for (const term of termCounts.keys()) documentFrequency.set(term, (documentFrequency.get(term) ?? 0) + 1)
  }
  const totalLength = sections.reduce((sum, { length }) => sum + length, 0)
  return { sections, documentFrequency, averageLength: sections.length > 0 ? totalLength / sections.length : 0 }
}

/**
 * Computes the BM25 score of a section for the query terms.
 * @param {HandbookIndex} index - Index.
 * @param {IndexedSection} indexed - Section.
 * @param {string[]} terms - Query terms.
 * @returns {number} The score.
 */
const scoreSection = (index: HandbookIndex, indexed: IndexedSection, terms: string[]): number => {
  const count = index.sections.length
  const lengthNorm = K1 * (1 - B + (B * indexed.length) / (index.averageLength || 1))
  let score = 0
  for (const term of terms) {
    const frequency = indexed.termCounts.get(term) ?? 0
    if (frequency === 0) continue
    const df = index.documentFrequency.get(term) ?? 0
    const idf = Math.log(1 + (count - df + 0.5) / (df + 0.5))
    score += (idf * frequency * (K1 + 1)) / (frequency + lengthNorm)
  }
  return score
}

/**
 * Returns the sections that best match the query.
 * @param {HandbookIndex} index - Index.
 * @param {string} query - Query.
 * @param {object} [options] - Options.
 * @param {number} [options.limit] - Maximum number of sections.
 * @param {number} [options.maxChars] - Maximum text length per section.
 * @returns {HandbookSearchResult[]} The sections, best first.
 */
export const searchHandbook = (
  index: HandbookIndex,
  query: string,
  { limit = 3, maxChars = AiLimits.handbookResultMaxChars }: { limit?: number; maxChars?: number } = {}
): HandbookSearchResult[] => {
  const terms = [...new Set(tokenize(query))]
  if (terms.length === 0) return []
  return (
    index.sections
      .map((indexed, position) => ({ indexed, position, score: scoreSection(index, indexed, terms) }))
      // empty parent sections only exist for the outline: they must not take a result slot
      .filter(({ indexed, score }) => score > 0 && indexed.section.text.trim() !== '')
      .sort((a, b) => b.score - a.score || a.position - b.position)
      .slice(0, limit)
      .map(({ indexed: { section } }) =>
        section.text.length > maxChars
          ? { ...section, text: section.text.slice(0, maxChars), truncated: true }
          : section
      )
  )
}

const PART_SUFFIX = / \(\d+\/\d+\)$/

/**
 * Returns the outline of the handbook ("<id> <title>" per line, parts merged). When it is too long, the deepest
 * levels are dropped.
 * @param {Handbook} handbook - Handbook.
 * @param {number} [maxChars] - Maximum length.
 * @returns {string} The outline.
 */
export const getHandbookOutline = (handbook: Handbook, maxChars: number = AiLimits.handbookOutlineMaxChars): string => {
  const entries: { depth: number; line: string }[] = []
  const seen = new Set<string>()
  for (const { id, title } of handbook.sections) {
    if (seen.has(id)) continue
    seen.add(id)
    entries.push({ depth: id.split('.').length, line: `${id} ${title.replace(PART_SUFFIX, '')}` })
  }
  const deepest = Math.max(1, ...entries.map(({ depth }) => depth))
  for (let maxDepth = deepest; maxDepth >= 1; maxDepth -= 1) {
    const outline = entries
      .filter(({ depth }) => depth <= maxDepth)
      .map(({ line }) => line)
      .join('\n')
    if (outline.length <= maxChars) return outline
  }
  return ''
}
