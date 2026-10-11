/**
 * Suggestion 6 (category item labels missing in a survey language). The counts come from Arena's server; Task 10's
 * event detector fetches them, this file turns them into suggestions.
 */
import * as Survey from '@core/survey/survey'
import * as Category from '@core/survey/category'

import type { MissingLabelsCounts } from '@common/ai/categoryItemLabels'

import {
  fetchMissingLabelsCounts,
  type FetchMissingLabelsCounts,
} from '@webapp/ai/changeSets/categoryItemLabels/categoryItemLabelsApi'

import type { AssistantSuggestion, SuggestionTarget } from '../types'
import { getDesignDetectorScope, newDesignSuggestion } from './designTargets'
import type { DetectorContext, EventDetector, SuggestionEvent, TargetResolver } from './types'

export const CATEGORY_ITEM_TRANSLATIONS_KIND = 'categoryItemTranslations'

/**
 * Returns the categories with labels missing in a language, with their counts.
 * @param {MissingLabelsCounts} counts - Counts by category uuid and language.
 * @param {object[]} categories - Survey categories, in display order.
 * @param {string} lang - Language.
 * @returns {SuggestionTarget[]} The targets.
 */
const getLanguageTargets = (counts: MissingLabelsCounts, categories: any[], lang: string): SuggestionTarget[] =>
  categories.flatMap((category) => {
    const key = Category.getUuid(category)
    const count = counts[key]?.[lang] ?? 0
    return count > 0 ? [{ key, count }] : []
  })

/**
 * Builds one suggestion per survey language with missing category item labels.
 * @param {MissingLabelsCounts} counts - Server counts.
 * @param {object} survey - Survey (categories and languages; counts of anything else are ignored).
 * @param {object} params - Parameters.
 * @param {number} params.surveyId - Survey id.
 * @param {Date} params.now - Creation time.
 * @returns {AssistantSuggestion[]} The suggestions, in survey language order.
 */
export const detectCategoryItemTranslations = (
  counts: MissingLabelsCounts,
  survey: any,
  { surveyId, now }: { surveyId: number; now: Date }
): AssistantSuggestion[] => {
  const languages = Survey.getLanguages(Survey.getSurveyInfo(survey)) as unknown as string[]
  const categories = Survey.getCategoriesArray(survey)
  return languages.flatMap((lang) => {
    const targets = getLanguageTargets(counts, categories, lang)
    if (targets.length === 0) return []
    const suggestion = newDesignSuggestion({
      kind: CATEGORY_ITEM_TRANSLATIONS_KIND,
      scopeKey: lang,
      surveyId,
      targetKeys: [],
      now,
    })
    return [{ ...suggestion, targets }]
  })
}

// a deleted category drops its target; the counts are refreshed by the events of Task 10
export const categoryItemTranslationsResolver: TargetResolver = {
  kind: CATEGORY_ITEM_TRANSLATIONS_KIND,
  isResolved: (targetKey, survey) => !Survey.getCategoryByUuid(targetKey)(survey),
}

export const CATEGORY_COUNTS_THROTTLE_MS = 30000

// frequent triggers: a generation per cycle switch or defs reload, a survey info save
const THROTTLED_EVENTS: SuggestionEvent['type'][] = ['generationStarted', 'surveyInfoSaved']

/**
 * Returns the throttle key: user, survey and languages (a save that adds a language is never throttled).
 * @param {DetectorContext} ctx - Detector context.
 * @param {number} surveyId - Survey id.
 * @param {object} survey - Survey.
 * @returns {string} The key.
 */
const getThrottleKey = (ctx: DetectorContext, surveyId: number, survey: any): string => {
  const languages = Survey.getLanguages(Survey.getSurveyInfo(survey)) as unknown as string[]
  return `${ctx.userUuid}|${surveyId}|${languages.join(',')}`
}

/**
 * Creates the event detector of suggestion 6 (the fetcher and the throttle are injected in tests).
 * @param {object} [deps] - Dependencies.
 * @param {FetchMissingLabelsCounts} [deps.fetchCounts] - Counts fetcher.
 * @param {number} [deps.throttleMs] - Throttle of the frequent triggers.
 * @returns {EventDetector} The detector.
 */
export const createCategoryItemTranslationsDetector = ({
  fetchCounts = fetchMissingLabelsCounts,
  throttleMs = CATEGORY_COUNTS_THROTTLE_MS,
}: { fetchCounts?: FetchMissingLabelsCounts; throttleMs?: number } = {}): EventDetector => {
  const lastFetchAt = new Map<string, { time: number; request: number }>()
  // only the latest request may land (an older answer would overwrite a newer one)
  let latestRequest = 0

  /**
   * Tells whether a frequent trigger came too soon after the last fetch of the same key.
   * @param {SuggestionEvent} event - Event.
   * @param {string} key - Throttle key.
   * @param {number} time - Current time.
   * @returns {boolean} True when skipped.
   */
  const isThrottled = (event: SuggestionEvent, key: string, time: number): boolean => {
    if (!THROTTLED_EVENTS.includes(event.type)) return false
    const last = lastFetchAt.get(key)
    return last !== undefined && time - last.time < throttleMs
  }

  return {
    kind: CATEGORY_ITEM_TRANSLATIONS_KIND,
    area: 'design',
    needsDraft: true,
    on: ['generationStarted', 'surveyInfoSaved', 'categoryEditorLeft', 'categoryLabelsApplied', 'categoriesChanged'],
    handle: async (event, ctx) => {
      const scope = getDesignDetectorScope(ctx)
      const generation = ctx.generation
      if (!scope || !generation) return
      const { survey, surveyId } = scope
      const key = getThrottleKey(ctx, surveyId, survey)
      const time = ctx.now().getTime()
      if (isThrottled(event, key, time)) return
      latestRequest += 1
      const request = latestRequest
      lastFetchAt.set(key, { time, request })
      /**
       * Frees the throttle of this request (never a newer request's entry), as nothing landed.
       * @returns {void}
       */
      const release = (): void => {
        if (lastFetchAt.get(key)?.request === request) lastFetchAt.delete(key)
      }
      // a cancelled request (defs reload, survey switch, setting off) must not block the next run
      generation.signal.addEventListener('abort', release, { once: true })
      try {
        const counts = await fetchCounts({ surveyId, signal: generation.signal })
        // survey switch, defs reload or logout meanwhile, or a newer request: nothing lands
        // a failed newer request drops this older answer by design; the next trigger recovers
        if (generation.signal.aborted || request !== latestRequest) {
          release()
          return
        }
        const suggestions = detectCategoryItemTranslations(counts, survey, { surveyId, now: ctx.now() })
        ctx.store.setKind({ userUuid: ctx.userUuid, surveyId, kind: CATEGORY_ITEM_TRANSLATIONS_KIND, suggestions })
      } catch {
        // offline or aborted: the next trigger tries again
        release()
      } finally {
        // settled: a later abort of the generation must not free the throttle of a successful request
        generation.signal.removeEventListener('abort', release)
      }
    },
  }
}

export const categoryItemTranslationsDetector = createCategoryItemTranslationsDetector()
