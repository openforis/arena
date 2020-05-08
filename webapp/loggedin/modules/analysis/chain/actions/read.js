import axios from 'axios'

import * as SurveyState from '@webapp/survey/surveyState'

import { hideAppSaving, showAppSaving } from '@webapp/app/actions'
import { initChain } from './state'

export const stepsLoad = 'analysis/chain/steps/load'

export const fetchChain = (chainUuid) => async (dispatch, getState) => {
  dispatch(showAppSaving())
  const surveyId = SurveyState.getSurveyId(getState())
  const { data: processingChain } = await axios.get(`/api/survey/${surveyId}/processing-chain/${chainUuid}`)

  dispatch(initChain(processingChain))
  dispatch(hideAppSaving())
}

export const fetchSteps = (chainUuid) => async (dispatch, getState) => {
  const surveyId = SurveyState.getSurveyId(getState())

  const { data: processingSteps } = await axios.get(
    `/api/survey/${surveyId}/processing-chain/${chainUuid}/processing-steps`
  )

  dispatch({ type: stepsLoad, processingSteps })
}
