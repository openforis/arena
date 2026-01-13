import { exportReducer } from '@webapp/utils/reduxUtils'

import { SystemActionTypes } from '@webapp/store/system/actionTypes'
import * as SurveyActions from '../actions'

import * as SurveyStatusState from './state'
import { NodeDefsActions } from '../nodeDefs'

const actionHandlers = {
  // Reset state
  [SystemActionTypes.SYSTEM_RESET]: () => ({}),

  [SurveyActions.surveyCreate]: () => ({}),
  [SurveyActions.surveyUpdate]: () => ({}),
  [SurveyActions.surveyDelete]: () => ({}),

  [SurveyActions.surveyDefsReset]: SurveyStatusState.resetDefsFetched,

  [SurveyActions.surveyDefsLoad]: (state, { draft, includeAnalysis, validate }) =>
    SurveyStatusState.assocDefsFetched({ draft, includeAnalysis, validate })(state),

  [NodeDefsActions.nodeDefUpdate]: (state, { dirty = false }) =>
    dirty ? SurveyStatusState.assocDirty(state) : SurveyStatusState.dissocDirty(state),

  [NodeDefsActions.nodeDefSave]: (state) => SurveyStatusState.dissocDirty(state),

  [NodeDefsActions.nodeDefPropsUpdateCancel]: (state) => SurveyStatusState.dissocDirty(state),
}

export default exportReducer(actionHandlers)
