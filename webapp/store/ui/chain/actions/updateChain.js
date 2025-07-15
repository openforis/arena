import axios from 'axios'

import * as Chain from '@common/analysis/chain'

import { AppSavingActions } from '@webapp/store/app'
import { SurveyActions, SurveyState } from '@webapp/store/survey'
import { ChainActionTypes } from '@webapp/store/ui/chain/actions/actionTypes'
import { debounceAction } from '@webapp/utils/reduxUtils'
import { ChainState } from '../state'

const action =
  ({ chain, lastUpdateTime }) =>
  async (dispatch, getState) => {
    const state = getState()
    const surveyId = SurveyState.getSurveyId(state)
    dispatch(AppSavingActions.showAppSaving())
    const { data: chainUpdated } = await axios.put(`/api/survey/${surveyId}/chain`, { chain })
    const lastUpdateTimeState = ChainState.getLastUpdateTime(state)
    if (lastUpdateTime === lastUpdateTimeState) {
      dispatch({ type: ChainActionTypes.chainUpdate, chain: chainUpdated })
    }
    dispatch(AppSavingActions.hideAppSaving())
  }

export const updateChain =
  ({ chain }) =>
  async (dispatch, getState) => {
    const state = getState()
    const chainPrev = ChainState.getChain(state)
    const lastUpdateTime = Date.now()
    dispatch({ type: ChainActionTypes.chainUpdate, chain, lastUpdateTime })

    if (Chain.checkChangeRequiresSurveyPublish({ chainPrev, chainNext: chain })) {
      dispatch(SurveyActions.metaUpdated())
    }
    const debounceKey = `chain_update_${chain.uuid}`
    const debouncedAction = debounceAction(action({ chain, lastUpdateTime }), debounceKey)
    dispatch(debouncedAction)
  }
