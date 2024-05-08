import * as Survey from '@core/survey/survey'
import * as Category from '@core/survey/category'

import * as API from '@webapp/service/api'
import { LoaderActions } from '@webapp/store/ui/loader'

import * as SurveyState from '../state'
import * as SurveyStatusState from '../status/state'
import { surveyDefsLoad, surveyDefsReset } from './actionTypes'

const loadSurveyDefs =
  ({ draft, includeAnalysis, validate, showLoader = true }) =>
  async (dispatch, getState) => {
    if (showLoader) {
      dispatch(LoaderActions.showLoader())
    }
    const state = getState()
    const surveyId = SurveyState.getSurveyId(state)
    const cycle = SurveyState.getSurveyCycleKey(state)

    const survey = await API.fetchSurveyFull({ surveyId, draft, advanced: true, validate, cycle, includeAnalysis })

    const surveyUpdated = await fetchAndAssocCategoryItemsCounts({ survey, draft })

    dispatch({ type: surveyDefsLoad, ...surveyUpdated, draft, includeAnalysis, validate })

    if (showLoader) {
      dispatch(LoaderActions.hideLoader())
    }
  }

export const initSurveyDefs =
  ({ draft = false, includeAnalysis = true, validate = false }) =>
  async (dispatch, getState) => {
    const state = getState()

    if (!SurveyStatusState.isFetchedWithSameParams({ draft, includeAnalysis, validate })(state)) {
      dispatch(loadSurveyDefs({ draft, includeAnalysis, validate }))
    }
  }

const fetchAndAssocCategoryItemsCounts = async ({ survey, draft }) => {
  const surveyId = Survey.getId(survey)
  const itemsCountByCategoryUuid = await API.fetchItemsCountIndexedByCategoryUuid({ surveyId, draft })

  const categories = Survey.getCategoriesArray(survey)
  const categoriesUpdated = categories.reduce((acc, category) => {
    const categoryUuid = Category.getUuid(category)
    const itemsCount = itemsCountByCategoryUuid[categoryUuid]
    acc[categoryUuid] = Category.assocItemsCount(itemsCount)(category)
    return acc
  }, {})
  return Survey.assocCategories(categoriesUpdated)(survey)
}

export const refreshSurveyDefs = async (dispatch, getState) => {
  const state = getState()
  if (SurveyStatusState.isFetched(state)) {
    const draft = SurveyStatusState.isDraft(state)
    const includeAnalysis = SurveyStatusState.isIncludeAnalysis(state)
    const validate = SurveyStatusState.isValidate(state)
    dispatch(loadSurveyDefs({ draft, includeAnalysis, validate, showLoader: false }))
  }
}

export const resetSurveyDefs = () => ({ type: surveyDefsReset })
