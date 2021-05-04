import axios from 'axios'

import { AppSavingActions } from '@webapp/store/app'
import { SurveyActions, SurveyState } from '@webapp/store/survey'
import { ChainActionTypes } from '@webapp/store/ui/chain/actions/actionTypes'
import { debounceAction } from '@webapp/utils/reduxUtils'

export const updateChainNodeDef = ({ chainNodeDef, chainUuid }) => async (dispatch, getState) => {
  const state = getState()
  const surveyId = SurveyState.getSurveyId(state)

  dispatch({ type: ChainActionTypes.chainNodeDefUpdate, chainNodeDef })

  const action = async () => {
    dispatch(AppSavingActions.showAppSaving())
    await axios.put(`/api/survey/${surveyId}/chain/${chainUuid}/chain-node-def`, { chainNodeDef })
    dispatch(AppSavingActions.hideAppSaving())
  }

  dispatch(SurveyActions.metaUpdated())
  dispatch(debounceAction(action, `chainNodeDef_update_${chainNodeDef.uuid}`))
}
