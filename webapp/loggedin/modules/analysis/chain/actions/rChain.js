import axios from 'axios'

import * as ProcessUtils from '@core/processUtils'
import * as Chain from '@common/analysis/processingChain'

import * as SurveyState from '@webapp/survey/surveyState'
import * as ChainState from '@webapp/loggedin/modules/analysis/chain/state'

import { hideAppLoader, showAppLoader } from '@webapp/app/actions'

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
  dispatch(showAppLoader())

  const state = getState()
  const surveyId = SurveyState.getSurveyId(state)
  const surveyCycleKey = SurveyState.getSurveyCycleKey(state)
  const chain = ChainState.getProcessingChain(state)

  // Generate scripts
  const config = { params: { surveyCycleKey } }
  await axios.get(`/api/survey/${surveyId}/processing-chain/${Chain.getUuid(chain)}/script`, config)

  dispatch(hideAppLoader())

  // Open RStudio in a new page
  window.open(_getRStudioUrl(), 'rstudio')
}
