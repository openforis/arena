import axios from 'axios'

import { SurveyState } from '@webapp/store/survey'
import { ChainActionTypes } from '@webapp/store/ui/chain/actions/actionTypes'
import { debounceAction } from '@webapp/utils/reduxUtils'

import { LoaderActions } from '../../loader'

export const fetchAndValidateChain =
  ({ chainUuid }) =>
  async (dispatch, getState) => {
    const state = getState()
    const surveyId = SurveyState.getSurveyId(state)

    const action = async () => {
      dispatch(LoaderActions.showLoader())
      const { data: chainValidated } = await axios.put(`/api/survey/${surveyId}/chain/validate`, { chainUuid })
      dispatch({ type: ChainActionTypes.chainUpdate, chain: chainValidated })
      dispatch(LoaderActions.hideLoader())
    }
    dispatch(debounceAction(action, `chain_validate_${chainUuid}`))
  }
