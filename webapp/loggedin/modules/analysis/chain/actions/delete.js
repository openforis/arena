import axios from 'axios'

import * as ProcessingChain from '@common/analysis/processingChain'

import { SurveyState } from '@webapp/store/survey'
import * as ChainState from '@webapp/loggedin/modules/analysis/chain/state'

import { NotificationActions } from '@webapp/store/ui'
import { AppSavingActions } from '@webapp/store/app'

import { navigateToChainsView } from './state'

export const chainDelete = 'analysis/chain/delete'

export const deleteChain = (history) => async (dispatch, getState) => {
  dispatch(AppSavingActions.showAppSaving())

  const state = getState()
  const surveyId = SurveyState.getSurveyId(state)
  const chain = ChainState.getProcessingChain(state)

  await axios.delete(`/api/survey/${surveyId}/processing-chain/${ProcessingChain.getUuid(chain)}`)

  dispatch({ type: chainDelete })
  dispatch(navigateToChainsView(history))
  dispatch(NotificationActions.notifyInfo({ key: 'processingChainView.deleteComplete' }))
  dispatch(AppSavingActions.hideAppSaving())
}
