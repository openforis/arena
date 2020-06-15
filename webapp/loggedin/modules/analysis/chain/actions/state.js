import axios from 'axios'

import * as Chain from '@common/analysis/processingChain'

import { analysisModules, appModuleUri } from '@webapp/app/appModules'

import { SurveyState } from '@webapp/store/survey'
import { AppSavingActions } from '@webapp/store/app'

export const chainUpdate = 'analysis/chain/update'
export const chainReset = 'analysis/chain/reset'

export const initChain = (chain) => async (dispatch, getState) => {
  dispatch(AppSavingActions.showAppSaving())
  const surveyId = SurveyState.getSurveyId(getState())

  if (chain) {
    // Fetch other chains attribute uuids
    const { data: attributeUuidsOtherChains } = await axios.get(
      `/api/survey/${surveyId}/processing-chain/${Chain.getUuid(chain)}/attribute-uuids-other-chains`
    )
    dispatch({ type: chainUpdate, chain, attributeUuidsOtherChains })
  }

  dispatch(AppSavingActions.hideAppSaving())
}

export const resetChain = () => (dispatch) => dispatch({ type: chainReset })

export const navigateToChainsView = (history) => (dispatch) => {
  dispatch(resetChain())
  // Navigate to processing chains view
  history.push(appModuleUri(analysisModules.processingChains))
}
