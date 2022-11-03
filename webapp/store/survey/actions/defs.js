import * as ObjectUtils from '@core/objectUtils'
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

      const categories = ObjectUtils.toUuidIndexedObj(await API.fetchCategories({ surveyId, draft }))
      const taxonomies = ObjectUtils.toUuidIndexedObj(await API.fetchTaxonomies({ surveyId, draft }))

      dispatch({
        type: surveyDefsLoad,
        draft,
        categories,
        nodeDefs,
        nodeDefsValidation,
        taxonomies,
      })
      dispatch(LoaderActions.hideLoader())
    }
  }

export const resetSurveyDefs = () => ({ type: surveyDefsReset })
