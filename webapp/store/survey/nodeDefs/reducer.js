import { SystemActions } from '@webapp/store/system'
import { exportReducer } from '@webapp/utils/reduxUtils'

import * as SurveyActions from '../actions'

import * as NodeDefsActions from './actions'
import * as NodeDefsState from './state'

const actionHandlers = {
  [SystemActions.SYSTEM_RESET]: () => ({}),

  // Reset state
  [SurveyActions.surveyCreate]: () => ({}),
  [SurveyActions.surveyUpdate]: () => ({}),
  [SurveyActions.surveyDelete]: () => ({}),

  [SurveyActions.surveyDefsReset]: () => ({}),

  [SurveyActions.surveyDefsLoad]: (_state, { nodeDefs }) => nodeDefs,

  // Single nodeDef actions
  [NodeDefsActions.nodeDefCreate]: (state, { nodeDef }) => NodeDefsState.assocNodeDef(nodeDef)(state),

  [NodeDefsActions.nodeDefDelete]: (state, { nodeDef }) => NodeDefsState.dissocNodeDef(nodeDef)(state),
  [NodeDefsActions.nodeDefsDelete]: (state, { nodeDefUuids }) => NodeDefsState.dissocNodeDefs(nodeDefUuids)(state),

  [NodeDefsActions.nodeDefUpdate]: (state, { nodeDef }) => NodeDefsState.assocNodeDef(nodeDef)(state),

  [NodeDefsActions.nodeDefSave]: (state, { nodeDef }) => NodeDefsState.assocNodeDef(nodeDef)(state),

  [NodeDefsActions.nodeDefsUpdate]: (state, { nodeDefs }) => NodeDefsState.mergeNodeDefs(nodeDefs)(state),

  [NodeDefsActions.nodeDefPropsUpdateCancel]: (state, { nodeDef, nodeDefOriginal, isNodeDefNew }) =>
    isNodeDefNew
      ? NodeDefsState.dissocNodeDef(nodeDef)(state) // Remove node def from state
      : NodeDefsState.assocNodeDef(nodeDefOriginal)(state), // Restore original version of node def
}

export default exportReducer(actionHandlers)
