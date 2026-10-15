/**
 * Missing translations suggestion: texts missing in a survey language (state detector, recomputed on every survey change).
 */
import * as NodeDef from '@core/survey/nodeDef'

import {
  TEXT_KINDS,
  getMissingLanguages,
  getSurveyLanguages,
  getTextNodeDefs,
  toTextTargetKey,
} from '@webapp/ai/tools/design/missingTexts'

import type { AssistantSuggestion } from '../types'
import { getDesignDetectorScope, newDesignSuggestion } from './designTargets'
import type { DetectorContext, StateDetector } from './types'

/**
 * Groups the missing texts by language, in survey hierarchy order.
 * @param {object} survey - Survey.
 * @returns {Map<string, string[]>} Target keys (`<uuid>:<kind>`) per missing language.
 */
export const collectMissingTextKeys = (survey: any): Map<string, string[]> => {
  const keysByLang = new Map<string, string[]>()
  const languages = getSurveyLanguages(survey)
  if (languages.length < 2) return keysByLang
  for (const nodeDef of getTextNodeDefs(survey)) {
    for (const kind of TEXT_KINDS) {
      for (const lang of getMissingLanguages(nodeDef, kind, languages)) {
        const keys = keysByLang.get(lang) ?? []
        keys.push(toTextTargetKey(NodeDef.getUuid(nodeDef), kind))
        keysByLang.set(lang, keys)
      }
    }
  }
  return keysByLang
}

/**
 * Detects the missing translations: one suggestion per language.
 * @param {DetectorContext} ctx - Detector context.
 * @returns {AssistantSuggestion[]} The suggestions (empty: nothing missing, or detectors must not run).
 */
export const detectMissingTranslations = (ctx: DetectorContext): AssistantSuggestion[] => {
  const scope = getDesignDetectorScope(ctx)
  if (!scope) return []
  const now = ctx.now()
  return [...collectMissingTextKeys(scope.survey)].map(([lang, targetKeys]) =>
    newDesignSuggestion({ kind: 'missingTranslations', scopeKey: lang, surveyId: scope.surveyId, targetKeys, now })
  )
}

export const missingTranslationsDetector: StateDetector = {
  kind: 'missingTranslations',
  area: 'design',
  needsDraft: true,
  detect: detectMissingTranslations,
}
