import axios from 'axios'

import * as ProcessUtils from '@core/processUtils'
import * as Chain from '@common/analysis/processingChain'

import { SurveyState } from '@webapp/store/survey'
import { LoaderActions } from '@webapp/store/ui'
import * as ChainState from '@webapp/loggedin/modules/analysis/chain/state'

const _getRStudioUrl = () => {
  if (ProcessUtils.ENV.rStudioServerURL) {
    return ProcessUtils.ENV.rStudioServerURL
  }
  if (ProcessUtils.isEnvDevelopment) {
    return 'http://localhost:8787'
  }
  return `${window.location.origin}/rstudio/`
}

export const openRChain = () => async (dispatch, getState) => {
  dispatch(LoaderActions.showLoader())

  const state = getState()
  const surveyId = SurveyState.getSurveyId(state)
  const surveyCycleKey = SurveyState.getSurveyCycleKey(state)
  const chain = ChainState.getProcessingChain(state)

  // Generate scripts
  const config = { params: { surveyCycleKey } }
  await axios.get(`/api/survey/${surveyId}/processing-chain/${Chain.getUuid(chain)}/script`, config)

  dispatch(LoaderActions.hideLoader())

  // Open RStudio in a new page
  window.open(_getRStudioUrl(), 'rstudio')
}
