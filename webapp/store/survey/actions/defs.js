import * as Survey from '@core/survey/survey'
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
      const params = { surveyId, draft, validate, cycle: SurveyState.getSurveyCycleKey(state), includeAnalysis }

      const survey = await API.fetchSurveyFull(params)

      const itemsCountByCategoryUuid = await API.fetchItemsCountIndexedByCategoryUuid({ surveyId, draft })
      Survey.getCategoriesArray(survey).forEach((category) => {
        const itemsCount = itemsCountByCategoryUuid[Category.getUuid(category)]
        Category.setItemsCount(itemsCount)(category)
      })

      dispatch({
        ...survey,
        type: surveyDefsLoad,
        draft,
      })
      dispatch(LoaderActions.hideLoader())
    }
  }

export const resetSurveyDefs = () => ({ type: surveyDefsReset })
