import axios from 'axios'

import * as Chain from '@common/analysis/chain'

import { AppSavingActions } from '@webapp/store/app'
import { SurveyActions, SurveyState } from '@webapp/store/survey'
import { ChainActionTypes } from '@webapp/store/ui/chain/actions/actionTypes'
import { debounceAction } from '@webapp/utils/reduxUtils'
import { ChainState } from '../state'

export const updateChain =
  ({ chain }) =>
  async (dispatch, getState) => {
    const state = getState()
    const chainPrev = ChainState.getChain(state)
    const surveyId = SurveyState.getSurveyId(state)

    dispatch({ type: ChainActionTypes.chainUpdate, chain })

    const action = async () => {
      dispatch(AppSavingActions.showAppSaving())
      const { data: chainUpdated } = await axios.put(`/api/survey/${surveyId}/chain`, { chain })
      dispatch({ type: ChainActionTypes.chainUpdate, chain: chainUpdated })
      dispatch(AppSavingActions.hideAppSaving())
    }

    if (Chain.checkChangeRequiresSurveyPublish({ chainPrev, chainNext: chain })) {
      dispatch(SurveyActions.metaUpdated())
    }
    dispatch(debounceAction(action, `chain_update_${chain.uuid}`))
  }
