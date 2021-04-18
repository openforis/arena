import axios from 'axios'

import { analysisModules, appModuleUri } from '@webapp/app/appModules'
import { SurveyState } from '@webapp/store/survey'

import { ChainActionTypes } from './actionTypes'

export const create = (history) => async (dispatch, getState) => {
  const state = getState()
  const surveyId = SurveyState.getSurveyId(state)
  const cycle = SurveyState.getSurveyCycleKey(state)
  const { data: chain } = await axios.post(`/api/survey/${surveyId}/chain`, { cycle })
  await dispatch({ type: ChainActionTypes.chainLoad, chain })
  history.push(`${appModuleUri(analysisModules.processingChain)}${chain.uuid}/`)
}
