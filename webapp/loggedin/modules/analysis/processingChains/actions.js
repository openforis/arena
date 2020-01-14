import axios from 'axios'

import * as ProcessingChain from '@common/analysis/processingChain'

import * as SurveyState from '@webapp/survey/surveyState'

import { hideAppLoader, showAppLoader } from '@webapp/app/actions'
import { analysisModules, appModuleUri } from '@webapp/app/appModules'
import { processingChainUpdate } from '@webapp/loggedin/modules/analysis/processingChain/actions'

// ====== CREATE

export const createProcessingChain = history => async (dispatch, getState) => {
  const state = getState()
  const surveyCycleKey = SurveyState.getSurveyCycleKey(state)

  const processingChain = ProcessingChain.newProcessingChain(surveyCycleKey)
  dispatch({ type: processingChainUpdate, processingChain })

  dispatch(navigateToProcessingChainView(history, ProcessingChain.getUuid(processingChain)))
}

// ====== UTILS

export const navigateToProcessingChainView = (history, processingChainUuid) => () =>
  history.push(`${appModuleUri(analysisModules.processingChain)}${processingChainUuid}`)
