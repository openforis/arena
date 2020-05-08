import axios from 'axios'

import * as ProcessUtils from '@core/processUtils'
import * as Chain from '@common/analysis/processingChain'

import { analysisModules, appModuleUri } from '@webapp/app/appModules'
import * as SurveyState from '@webapp/survey/surveyState'
import * as ChainState from '@webapp/loggedin/modules/analysis/chain/state'

import { hideAppLoader, showAppLoader } from '@webapp/app/actions'

export const openRChain = (history) => async (dispatch, getState) => {
  dispatch(showAppLoader())

  const state = getState()
  const surveyId = SurveyState.getSurveyId(state)
  const surveyCycleKey = SurveyState.getSurveyCycleKey(state)
  const chain = ChainState.getProcessingChain(state)

  // Generate scripts
  const config = { params: { surveyCycleKey } }
  await axios.get(`/api/survey/${surveyId}/processing-chain/${Chain.getUuid(chain)}/script`, config)

  dispatch(hideAppLoader())

  // Navigate to RStudio module
  if (ProcessUtils.isEnvDevelopment) {
    // Open in a new page
    window.open(ProcessUtils.ENV.rStudioServerURL, 'rstudio')
  } else {
    // Open inside Arena
    history.push(appModuleUri(analysisModules.rStudio))
  }
}
