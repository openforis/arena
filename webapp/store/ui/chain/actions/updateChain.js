import axios from 'axios'

import { AppSavingActions } from '@webapp/store/app'
import { SurveyActions, SurveyState } from '@webapp/store/survey'
import { ChainActionTypes } from '@webapp/store/ui/chain/actions/actionTypes'
import { debounceAction } from '@webapp/utils/reduxUtils'

export const updateChain = ({ chain }) => async (dispatch, getState) => {
  const state = getState()
  const surveyId = SurveyState.getSurveyId(state)

  dispatch({ type: ChainActionTypes.chainUpdate, chain })

  const action = async () => {
    dispatch(AppSavingActions.showAppSaving())
    await axios.put(`/api/survey/${surveyId}/chain`, { chain })
    dispatch(AppSavingActions.hideAppSaving())
  }

  dispatch(SurveyActions.metaUpdated())
  dispatch(debounceAction(action, `chain_update_${chain.uuid}`))
}
