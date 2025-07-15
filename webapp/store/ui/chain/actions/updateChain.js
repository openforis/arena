import axios from 'axios'

import { Objects } from '@openforis/arena-core'

import * as Chain from '@common/analysis/chain'

import { AppSavingActions } from '@webapp/store/app'
import { SurveyActions, SurveyState } from '@webapp/store/survey'
import { ChainActionTypes } from '@webapp/store/ui/chain/actions/actionTypes'
import { cancelDebouncedAction, debounceAction } from '@webapp/utils/reduxUtils'
import { ChainState } from '../state'

const action =
  ({ chain }) =>
  async (dispatch, getState) => {
    const state = getState()
    const surveyId = SurveyState.getSurveyId(state)
    dispatch(AppSavingActions.showAppSaving())
    const { data: chainUpdated } = await axios.put(`/api/survey/${surveyId}/chain`, { chain })
    const chainPrev = ChainState.getChain(state)
    const dirtyNext = !Objects.isEqual(chainPrev, chainUpdated)
    console.log('===chain', Chain.getLabel('en')(chain))
    console.log('===chain prev', Chain.getLabel('en')(chainPrev))
    console.log('===chain updated', Chain.getLabel('en')(chainUpdated))
    if (!dirtyNext) {
      dispatch({ type: ChainActionTypes.chainUpdate, chain: chainUpdated })
    }
    dispatch(AppSavingActions.hideAppSaving())
  }

export const updateChain =
  ({ chain }) =>
  async (dispatch, getState) => {
    const state = getState()
    const chainPrev = ChainState.getChain(state)

    await dispatch({ type: ChainActionTypes.chainUpdate, chain, dirty: true })

    if (Chain.checkChangeRequiresSurveyPublish({ chainPrev, chainNext: chain })) {
      dispatch(SurveyActions.metaUpdated())
    }
    const debounceKey = `chain_update_${chain.uuid}`
    const debouncedAction = debounceAction(action({ chain }), debounceKey)
    dispatch(debouncedAction)
  }
