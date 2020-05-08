import axios from 'axios'

import * as Chain from '@common/analysis/processingChain'

import { analysisModules, appModuleUri } from '@webapp/app/appModules'

import * as SurveyState from '@webapp/survey/surveyState'

import { hideAppSaving, showAppSaving } from '@webapp/app/actions'

export const chainUpdate = 'analysis/chain/update'
export const chainReset = 'analysis/chain/reset'

export const initChain = (chain) => async (dispatch, getState) => {
  dispatch(showAppSaving())
  const surveyId = SurveyState.getSurveyId(getState())

  if (chain) {
    const processingChainUuid = Chain.getUuid(chain)

    // Fetch calculation attribute uuids
    const [{ data: attributeUuids }, { data: attributeUuidsOtherChains }] = await Promise.all([
      axios.get(`/api/survey/${surveyId}/processing-chain/${processingChainUuid}/calculation-attribute-uuids`),
      axios.get(`/api/survey/${surveyId}/processing-chain/${processingChainUuid}/attribute-uuids-other-chains`),
    ])

    dispatch({
      type: chainUpdate,
      processingChain: Chain.assocCalculationAttributeDefUuids(attributeUuids)(chain),
      attributeUuidsOtherChains,
    })
  }

  dispatch(hideAppSaving())
}

export const resetChain = () => (dispatch) => dispatch({ type: chainReset })

export const navigateToChainsView = (history) => (dispatch) => {
  dispatch(resetChain())
  // Navigate to processing chains view
  history.push(appModuleUri(analysisModules.processingChains))
}
