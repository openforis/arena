import * as ObjectUtils from '@core/objectUtils'
import * as Category from '@core/survey/category'

import * as API from '@webapp/service/api'
import { LoaderActions } from '@webapp/store/ui/loader'

import * as SurveyState from '../state'
import * as SurveyStatusState from '../status/state'
import { surveyDefsLoad, surveyDefsReset } from './actionTypes'

export const initSurveyDefs =
  ({ draft = false, validate = false, includeAnalysis = true }) =>
  async (dispatch, getState) => {
    const state = getState()

    if (!SurveyStatusState.areDefsFetched(draft)(state)) {
      dispatch(LoaderActions.showLoader())

      const surveyId = SurveyState.getSurveyId(state)
      const params = { draft, validate, cycle: SurveyState.getSurveyCycleKey(state), includeAnalysis }

      const { nodeDefs, nodeDefsValidation } = await API.fetchNodeDefs({ surveyId, params })

      const itemsCountByCategoryUuid = await API.fetchItemsCountIndexedByCategoryUuid({ surveyId, draft })
      const categories = await API.fetchCategories({ surveyId, draft }).map((category) => {
        const itemsCount = itemsCountByCategoryUuid[Category.getUuid(category)]
        return Category.assocItemsCount(itemsCount)(category)
      })

      const taxonomies = await API.fetchTaxonomies({ surveyId, draft })

      dispatch({
        type: surveyDefsLoad,
        draft,
        categories: ObjectUtils.toUuidIndexedObj(categories),
        nodeDefs,
        nodeDefsValidation,
        taxonomies: ObjectUtils.toUuidIndexedObj(taxonomies),
      })
      dispatch(LoaderActions.hideLoader())
    }
  }

export const resetSurveyDefs = () => ({ type: surveyDefsReset })
