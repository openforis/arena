import axios from 'axios'

import * as ProcessingChain from '@common/analysis/processingChain'

import * as SurveyState from '@webapp/survey/surveyState'
import * as ChainState from '@webapp/loggedin/modules/analysis/chain/state'

import { hideAppSaving, showAppSaving } from '@webapp/app/actions'
import { showNotification } from '@webapp/app/appNotification/actions'

import { navigateToChainsView } from './state'

export const chainDelete = 'analysis/chain/delete'

export const deleteChain = (history) => async (dispatch, getState) => {
  dispatch(showAppSaving())

  const state = getState()
  const surveyId = SurveyState.getSurveyId(state)
  const chain = ChainState.getProcessingChain(state)

  await axios.delete(`/api/survey/${surveyId}/processing-chain/${ProcessingChain.getUuid(chain)}`)

  dispatch({ type: chainDelete })
  dispatch(navigateToChainsView(history))
  dispatch(showNotification('processingChainView.deleteComplete'))
  dispatch(hideAppSaving())
}
