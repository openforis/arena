import axios from 'axios'

import * as SurveyState from '@webapp/survey/surveyState'

import { hideAppSaving, showAppSaving } from '@webapp/app/actions'
import { initChain } from './state'

export const fetchChain = (chainUuid) => async (dispatch, getState) => {
  dispatch(showAppSaving())
  const surveyId = SurveyState.getSurveyId(getState())
  const { data: chain } = await axios.get(`/api/survey/${surveyId}/processing-chain/${chainUuid}`)

  dispatch(initChain(chain))
  dispatch(hideAppSaving())
}
