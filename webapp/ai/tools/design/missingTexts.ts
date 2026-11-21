/**
 * The missing-texts rule shared by the missing translations suggestion and survey_listMissingTexts: a text is
 * missing in a language when it is blank there and filled in another survey language.
 */
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import { getLabelValue } from '@webapp/ai/changeSets/operations'
import type { LabelKind } from '@webapp/ai/changeSets/types'

import { getDesignNodeDefsDepthFirst } from './surveyLookup'

export const TEXT_KINDS: readonly LabelKind[] = ['labels', 'descriptions']

/**
 * Returns the survey languages, default language first.
 * @param {object} survey - Survey.
 * @returns {string[]} The language codes.
 */
export const getSurveyLanguages = (survey: any): string[] =>
  Survey.getLanguages(Survey.getSurveyInfo(survey)) as unknown as string[]

/**
 * Tells whether a label or description is filled in a language (a blank text counts as missing).
 * @param {object} nodeDef - Node definition.
 * @param {LabelKind} kind - Labels or descriptions.
 * @param {string} lang - Language.
 * @returns {boolean} True when filled.
 */
export const isTextFilled = (nodeDef: any, kind: LabelKind, lang: string): boolean =>
  (getLabelValue(nodeDef, kind, lang) ?? '').trim().length > 0

/**
 * Returns the languages in which a text is filled, in survey order.
 * @param {object} nodeDef - Node definition.
 * @param {LabelKind} kind - Labels or descriptions.
 * @param {string[]} languages - Survey languages.
 * @returns {string[]} The languages.
 */
export const getFilledLanguages = (nodeDef: any, kind: LabelKind, languages: string[]): string[] =>
  languages.filter((lang) => isTextFilled(nodeDef, kind, lang))

/**
 * Returns the languages a text is missing in; none when it is filled in no language (nothing to translate from).
 * @param {object} nodeDef - Node definition.
 * @param {LabelKind} kind - Labels or descriptions.
 * @param {string[]} languages - Survey languages.
 * @returns {string[]} The languages.
 */
export const getMissingLanguages = (nodeDef: any, kind: LabelKind, languages: string[]): string[] => {
  const filled = getFilledLanguages(nodeDef, kind, languages)
  if (filled.length === 0) return []
  return languages.filter((lang) => !filled.includes(lang))
}

/**
 * Returns the saved design node definitions in survey hierarchy order (an unsaved one cannot take proposals yet).
 * @param {object} survey - Survey.
 * @returns {object[]} The node definitions.
 */
export const getTextNodeDefs = (survey: any): any[] =>
  getDesignNodeDefsDepthFirst(survey).filter((nodeDef) => !NodeDef.isTemporary(nodeDef))

/**
 * Returns the target key of a text of a node definition.
 * @param {string} nodeDefUuid - Node definition uuid.
 * @param {LabelKind} kind - Labels or descriptions.
 * @returns {string} `<uuid>:<kind>`.
 */
export const toTextTargetKey = (nodeDefUuid: string, kind: LabelKind): string => `${nodeDefUuid}:${kind}`
