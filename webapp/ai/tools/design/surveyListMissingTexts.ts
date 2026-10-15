/**
 * survey_listMissingTexts: the work list of spec §3.6. Fixed hierarchy order, cursor = slot index (so texts that
 * become pending between two calls never shift the next page), pages cut at 50 items or at the JSON budget.
 */
import { z } from 'zod'

import * as NodeDef from '@core/survey/nodeDef'

import type { ChangeSet, LabelKind } from '@webapp/ai/changeSets/types'
import type { SuggestionScope } from '@webapp/ai/suggestions/types'

import { canViewCurrentSurvey } from '../common/toolPermissions'
import { TOOL_RESULT_BUDGET_CHARS } from '../common/toolResult'
import { AiToolFailure } from '../toolFailure'
import type { AiTool } from '../types'
import {
  TEXT_KINDS,
  getFilledLanguages,
  getMissingLanguages,
  getSurveyLanguages,
  getTextNodeDefs,
  toTextTargetKey,
} from './missingTexts'
import { requireSurvey } from './surveyLookup'

export const MISSING_TEXTS_PAGE_MAX = 50
// the wrapper cuts longer results into a non-JSON string: stay under the limit with some margin
// the longest text labels_proposeSet accepts
export const SOURCE_TEXT_MAX = 2000

export type MissingTextItem = {
  nodeDefName: string
  kind: LabelKind
  sourceLang: string | null
  sourceText: string
  sourceTextTruncated?: true
}

export type MissingTextsPage = {
  lang: string | null
  total: number
  items: MissingTextItem[]
  nextCursor: string | null
}

const inputSchema = z.object({
  lang: z.string().min(2).max(10).nullish().describe('A survey language; required unless onlyEmpty is true'),
  kind: z.enum(['labels', 'descriptions']).nullish(),
  onlyEmpty: z.boolean().nullish().describe('true: the texts that are empty in every language'),
  cursor: z
    .string()
    .regex(/^\d{1,6}$/)
    .nullish()
    .describe('nextCursor of the previous page'),
  limit: z.number().int().min(1).max(MISSING_TEXTS_PAGE_MAX).nullish(),
})

type MissingTextsInput = z.infer<typeof inputSchema>

type Slot = { index: number; nodeDef: any; kind: LabelKind }

type PendingTexts = { texts: Set<string>; slots: Set<string> }

type SlotFilter = {
  lang: string | null
  kind: LabelKind | null
  languages: string[]
  pending: PendingTexts
  inScope: ((slot: Slot) => boolean) | null
}

/**
 * Returns every text slot (node definition × kind) in hierarchy order; the index is the cursor.
 * @param {object} survey - Survey.
 * @returns {Slot[]} The slots.
 */
const getSlots = (survey: any): Slot[] =>
  getTextNodeDefs(survey)
    .flatMap((nodeDef) => TEXT_KINDS.map((kind) => ({ nodeDef, kind })))
    .map((slot, index) => ({ ...slot, index }))

/**
 * Returns the texts the pending cards already propose.
 * @param {ChangeSet[]} changeSets - Pending change sets.
 * @returns {PendingTexts} `<uuid>|<kind>|<lang>` keys, and `<uuid>|<kind>` keys for any language.
 */
const getPendingTexts = (changeSets: ChangeSet[]): PendingTexts => {
  const texts = new Set<string>()
  const slots = new Set<string>()
  for (const changeSet of changeSets) {
    for (const op of changeSet.operations) {
      if (op.type !== 'label.set') continue
      texts.add(`${op.nodeDefUuid}|${op.kind}|${op.lang}`)
      slots.add(`${op.nodeDefUuid}|${op.kind}`)
    }
  }
  return { texts, slots }
}

/**
 * Returns the filter of an accepted suggestion: only its targets are listed.
 * @param {SuggestionScope|null} scope - Scope of the conversation.
 * @returns {Function|null} The filter; null when the scope does not limit text lists.
 */
const getScopeFilter = (scope: SuggestionScope | null): ((slot: Slot) => boolean) | null => {
  if (!scope) return null
  const keys = new Set(scope.targetKeys)
  if (scope.kind === 'missingTranslations') {
    return (slot) => keys.has(toTextTargetKey(NodeDef.getUuid(slot.nodeDef), slot.kind))
  }
  if (scope.kind === 'newEntriesDescriptions') return (slot) => keys.has(NodeDef.getUuid(slot.nodeDef))
  return null
}

/**
 * Tells whether a slot is still to write: missing in the language (or empty everywhere), not pending, in scope.
 * @param {Slot} slot - Slot.
 * @param {SlotFilter} filter - Filter.
 * @returns {boolean} True when listed.
 */
const isWanted = (slot: Slot, filter: SlotFilter): boolean => {
  const { lang, kind, languages, pending, inScope } = filter
  if (kind && slot.kind !== kind) return false
  if (inScope && !inScope(slot)) return false
  const uuid = NodeDef.getUuid(slot.nodeDef)
  if (lang === null) {
    return (
      getFilledLanguages(slot.nodeDef, slot.kind, languages).length === 0 && !pending.slots.has(`${uuid}|${slot.kind}`)
    )
  }
  return (
    getMissingLanguages(slot.nodeDef, slot.kind, languages).includes(lang) &&
    !pending.texts.has(`${uuid}|${slot.kind}|${lang}`)
  )
}

/**
 * Returns the language to list, refusing a missing or foreign one.
 * @param {MissingTextsInput} input - Tool input.
 * @param {string[]} languages - Survey languages.
 * @returns {string|null} The language; null with onlyEmpty.
 */
const checkLanguage = (input: MissingTextsInput, languages: string[]): string | null => {
  if (input.onlyEmpty) return null
  const { lang } = input
  if (!lang) {
    throw new AiToolFailure(
      'invalidInput',
      `Pass lang (a survey language: ${languages.join(', ')}) or onlyEmpty: true.`
    )
  }
  if (!languages.includes(lang)) {
    throw new AiToolFailure(
      'invalidInput',
      `"${lang}" is not a survey language. Survey languages: ${languages.join(', ')}.`
    )
  }
  return lang
}

/**
 * Builds the item of a text missing in a language, with its source text.
 * @param {Slot} slot - Slot.
 * @param {string} lang - Missing language.
 * @param {string[]} languages - Survey languages.
 * @returns {MissingTextItem} The item.
 */
const toSourceItem = (slot: Slot, lang: string, languages: string[]): MissingTextItem => {
  const [sourceLang] = getFilledLanguages(slot.nodeDef, slot.kind, languages).filter((filled) => filled !== lang)
  const texts = slot.kind === 'labels' ? NodeDef.getLabels(slot.nodeDef) : NodeDef.getDescriptions(slot.nodeDef)
  const text: string = texts[sourceLang]
  const item: MissingTextItem = {
    nodeDefName: NodeDef.getName(slot.nodeDef),
    kind: slot.kind,
    sourceLang,
    sourceText: text.slice(0, SOURCE_TEXT_MAX),
  }
  if (text.length > SOURCE_TEXT_MAX) item.sourceTextTruncated = true
  return item
}

/**
 * Builds the item of a text empty in every language.
 * @param {Slot} slot - Slot.
 * @returns {MissingTextItem} The item.
 */
const toEmptyItem = (slot: Slot): MissingTextItem => ({
  nodeDefName: NodeDef.getName(slot.nodeDef),
  kind: slot.kind,
  sourceLang: null,
  sourceText: '',
})

/**
 * Lists one page of the texts still to write.
 * @param {object} params - Parameters.
 * @param {object} params.survey - Survey.
 * @param {MissingTextsInput} params.input - Tool input.
 * @param {SuggestionScope|null} params.scope - Scope of an accepted suggestion.
 * @param {ChangeSet[]} params.pendingChangeSets - Cards not applied yet.
 * @returns {MissingTextsPage} The page.
 */
export const listMissingTexts = ({
  survey,
  input,
  scope,
  pendingChangeSets,
}: {
  survey: any
  input: MissingTextsInput
  scope: SuggestionScope | null
  pendingChangeSets: ChangeSet[]
}): MissingTextsPage => {
  const languages = getSurveyLanguages(survey)
  const lang = checkLanguage(input, languages)
  const filter: SlotFilter = {
    lang,
    kind: input.kind ?? null,
    languages,
    pending: getPendingTexts(pendingChangeSets),
    inScope: getScopeFilter(scope),
  }
  const wanted = getSlots(survey).filter((slot) => isWanted(slot, filter))
  const start = Number(input.cursor ?? 0)
  const limit = input.limit ?? MISSING_TEXTS_PAGE_MAX
  const page: MissingTextsPage = { lang, total: wanted.length, items: [], nextCursor: null }
  // the longest cursor is counted up front, so setting it never overflows
  let size = JSON.stringify({ ...page, nextCursor: '999999' }).length
  for (const slot of wanted.filter((candidate) => candidate.index >= start)) {
    const item = lang === null ? toEmptyItem(slot) : toSourceItem(slot, lang, languages)
    size += JSON.stringify(item).length + 1
    // a page is cut only when it has items, so an oversized text still makes progress
    if (page.items.length > 0 && (page.items.length >= limit || size > TOOL_RESULT_BUDGET_CHARS)) {
      page.nextCursor = String(slot.index)
      break
    }
    page.items.push(item)
  }
  return page
}

export const surveyListMissingTextsTool: AiTool<MissingTextsInput, MissingTextsPage> = {
  name: 'survey_listMissingTexts',
  description:
    'Lists the labels and descriptions still to write, in survey order, one page at a time. With lang: the texts ' +
    'missing in that survey language and filled in another one, with the text to translate (sourceLang, ' +
    'sourceText; sourceTextTruncated when cut). With onlyEmpty: true: the texts empty in every language (lang is ' +
    'ignored). kind limits the list to labels or descriptions. Texts already proposed in an open card are left ' +
    'out. total = texts still to write; pass nextCursor as cursor for the next page (null: no more pages).',
  inputSchema,
  area: ['design'],
  dataClass: 'schema',
  requires: canViewCurrentSurvey,
  execute: async (input, ctx) =>
    listMissingTexts({
      survey: requireSurvey(ctx),
      input,
      scope: ctx.suggestionScope ?? null,
      pendingChangeSets: ctx.getPendingChangeSets?.() ?? [],
    }),
}
