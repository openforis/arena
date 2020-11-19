import axios from 'axios'

import { LoaderActions } from '@webapp/store/ui/loader'

import * as SurveyState from '../state'
import * as SurveyStatusState from '../status/state'
import { surveyDefsLoad, surveyDefsReset } from './actionTypes'

export const initSurveyDefs = ({ draft = false, validate = false }) => async (dispatch, getState) => {
  const state = getState()

  if (!SurveyStatusState.areDefsFetched(draft)(state)) {
    dispatch(LoaderActions.showLoader())

    const surveyId = SurveyState.getSurveyId(state)
    const params = { draft, validate, cycle: SurveyState.getSurveyCycleKey(state) }

    const nodeDefsResp = await axios.get(`/api/survey/${surveyId}/nodeDefs`, { params })

    const { nodeDefs, nodeDefsValidation } = nodeDefsResp.data

    dispatch({
      type: surveyDefsLoad,
      nodeDefs,
      nodeDefsValidation,
      draft,
    })
    dispatch(LoaderActions.hideLoader())
  }
}

export const resetSurveyDefs = () => ({ type: surveyDefsReset })
