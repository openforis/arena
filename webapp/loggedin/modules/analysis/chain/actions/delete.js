import axios from 'axios'

import * as ProcessingChain from '@common/analysis/processingChain'

import * as SurveyState from '@webapp/survey/surveyState'
import * as ChainState from '@webapp/loggedin/modules/analysis/chain/state'

import { hideAppSaving, showAppSaving } from '@webapp/app/actions'
import { showNotification } from '@webapp/app/appNotification/actions'
import { onNodeDefsDelete } from '@webapp/survey/nodeDefs/actions'

import { navigateToChainsView } from './state'

export const chainDelete = 'analysis/chain/delete'

export const deleteChain = (history) => async (dispatch, getState) => {
  dispatch(showAppSaving())

  const state = getState()
  const surveyId = SurveyState.getSurveyId(state)
  const processingChain = ChainState.getProcessingChain(state)

  const url = `/api/survey/${surveyId}/processing-chain/${ProcessingChain.getUuid(processingChain)}`
  const { data: nodeDefUnusedDeletedUuids = [] } = await axios.delete(url)

  // Dissoc deleted node def analysis
  dispatch(onNodeDefsDelete(nodeDefUnusedDeletedUuids))
  dispatch({ type: chainDelete })

  dispatch(navigateToChainsView(history))
  dispatch(showNotification('processingChainView.deleteComplete'))
  dispatch(hideAppSaving())
}
