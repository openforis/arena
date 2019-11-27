import axios from 'axios'

import * as SurveyState from '@webapp/survey/surveyState'

import {hideAppLoader, showAppLoader} from '@webapp/app/actions'
import {analysisModules, appModuleUri} from '../../../appModules'

// ====== CREATE

export const navigateToProcessingChainView = (
  history,
  processingChainUuid,
) => () =>
  history.push(
    `${appModuleUri(analysisModules.processingChain)}${processingChainUuid}`,
  )

export const createProcessingChain = history => async (dispatch, getState) => {
  dispatch(showAppLoader())

  const state = getState()
  const surveyId = SurveyState.getSurveyId(state)
  const surveyCycleKey = SurveyState.getSurveyCycleKey(state)

  const {data: processingChainUuid} = await axios.post(
    `/api/survey/${surveyId}/processing-chain`,
    {
      surveyCycleKey,
    },
  )

  dispatch(hideAppLoader())
  dispatch(navigateToProcessingChainView(history, processingChainUuid))
}
