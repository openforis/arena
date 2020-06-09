import axios from 'axios'

import { SurveyState } from '@webapp/store/survey'
import { AppSavingActions } from '@webapp/store/app'

import { initChain } from './state'

export const fetchChain = (chainUuid) => async (dispatch, getState) => {
  dispatch(AppSavingActions.showAppSaving())
  const surveyId = SurveyState.getSurveyId(getState())
  const { data: chain } = await axios.get(`/api/survey/${surveyId}/processing-chain/${chainUuid}`)

  dispatch(initChain(chain))
  dispatch(AppSavingActions.hideAppSaving())
}
