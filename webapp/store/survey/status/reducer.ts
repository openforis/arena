import { SystemActionTypes } from '@webapp/store/system/actionTypes'
import { exportReducer } from '@webapp/utils/reduxUtils'
import * as SurveyActions from '../actions'
import { NodeDefsActions } from '../nodeDefs'

import * as SurveyStatusState from './state'

const actionHandlers = {
  // Reset state
  [SystemActionTypes.SYSTEM_RESET]: () => ({}),

  // the load count stays: the next load is a new suggestion generation
  [SurveyActions.surveyCreate]: SurveyStatusState.resetDefsFetched,
  [SurveyActions.surveyUpdate]: SurveyStatusState.resetDefsFetched,
  [SurveyActions.surveyDelete]: SurveyStatusState.resetDefsFetched,

  [SurveyActions.surveyDefsReset]: SurveyStatusState.resetDefsFetched,

  [SurveyActions.surveyDefsLoad]: (state, { draft, includeAnalysis, validate }) =>
    SurveyStatusState.assocDefsFetched({ draft, includeAnalysis, validate })(state),

  [NodeDefsActions.nodeDefUpdate]: (state, { dirty = false }) =>
    dirty ? SurveyStatusState.assocDirty(state) : SurveyStatusState.dissocDirty(state),

  [NodeDefsActions.nodeDefSave]: (state) => SurveyStatusState.dissocDirty(state),

  [NodeDefsActions.nodeDefPropsUpdateCancel]: (state) => SurveyStatusState.dissocDirty(state),
}

export default exportReducer(actionHandlers)
