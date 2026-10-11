/**
 * CategoryLabelsApplierDeps on the app store: the request, the categories refresh and the suggestion event.
 */
import * as Survey from '@core/survey/survey'
import * as Category from '@core/survey/category'

import type { SuggestionEvent } from '@webapp/ai/suggestions/detectors/types'
import { notifySuggestionEvent } from '@webapp/ai/suggestions/suggestionEvents'
import { surveyCategoryUpdated } from '@webapp/store/survey/actions/category'
import { resetSurveyDefs } from '@webapp/store/survey/actions/defs'
import { metaUpdated } from '@webapp/store/survey/actions/metadata'

import type { CategoryLabelsApplierDeps } from './applyCategoryItemLabels'
import { putCategoryItemLabels, type PutCategoryItemLabels } from './categoryItemLabelsApi'

/**
 * Creates the category dependencies of Apply.
 * @param {object} params - Parameters.
 * @param {Function} params.dispatch - Redux dispatch.
 * @param {Function} params.getSurvey - Returns the survey in the store.
 * @param {PutCategoryItemLabels} [params.put] - Server call (default: the endpoint).
 * @param {Function} [params.notify] - Suggestion events (default: notifySuggestionEvent).
 * @returns {CategoryLabelsApplierDeps} The dependencies.
 */
export const createCategoryLabelsApplierDeps = ({
  dispatch,
  getSurvey,
  put = putCategoryItemLabels,
  notify = notifySuggestionEvent,
}: {
  dispatch: (action: any) => any
  getSurvey: () => any
  put?: PutCategoryItemLabels
  notify?: (event: SuggestionEvent) => void
}): CategoryLabelsApplierDeps => ({
  putCategoryItemLabels: put,
  onCategoriesUpdated: (categories) => {
    const survey = getSurvey()
    for (const category of categories) {
      const existing = Survey.getCategoryByUuid(Category.getUuid(category))(survey)
      // the endpoint does not count the items: keep the count loaded with the defs
      const updated = existing ? Category.assocItemsCount(Category.getItemsCount(existing))(category) : category
      dispatch(surveyCategoryUpdated(updated))
    }
    // the survey now has unpublished changes
    dispatch(metaUpdated())
    // the loaded node defs and the open category editor hold the old labels
    dispatch(resetSurveyDefs())
  },
  onCategoryLabelsApplied: () => notify({ type: 'categoryLabelsApplied' }),
})
