import axios from 'axios'

import { AppSavingActions } from '@webapp/store/app'
import { SurveyActions, SurveyState } from '@webapp/store/survey'
import { ChainActionTypes } from '@webapp/store/ui/chain/actions/actionTypes'
import { debounceAction } from '@webapp/utils/reduxUtils'

export const updateChainNodeDefIndex =
  ({ chainNodeDef, newIndex }) =>
  async (dispatch, getState) => {
    const state = getState()
    const surveyId = SurveyState.getSurveyId(state)
    const { chainUuid } = chainNodeDef

    dispatch({ type: ChainActionTypes.chainNodeDefUpdateIndex, chainNodeDef, newIndex })

    const action = async () => {
      dispatch(AppSavingActions.showAppSaving())
      await axios.put(`/api/survey/${surveyId}/chain/${chainUuid}/chain-node-def`, { chainNodeDef, newIndex })
      dispatch(AppSavingActions.hideAppSaving())
    }

    dispatch(SurveyActions.metaUpdated())
    dispatch(debounceAction(action, `chainNodeDef_update_index_${chainNodeDef.uuid}`))
  }
