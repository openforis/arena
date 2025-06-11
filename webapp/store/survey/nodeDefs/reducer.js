import * as A from '@core/arena'

import { exportReducer } from '@webapp/utils/reduxUtils'

import { SystemActions } from '@webapp/store/system'

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

  [NodeDefsActions.nodeDefUpdate]: (state, { nodeDef, dirty = false }) => {
    let stateUpdated = NodeDefsState.assocNodeDef(nodeDef, dirty)(state)
    if (dirty) {
      stateUpdated = NodeDefsState.assocDirty(stateUpdated)
    } else {
      stateUpdated = NodeDefsState.dissocDirty(stateUpdated)
    }
    return stateUpdated
  },

  [NodeDefsActions.nodeDefSave]: (state, { nodeDef }) =>
    A.pipe(NodeDefsState.assocNodeDef(nodeDef), NodeDefsState.dissocDirty)(state),

  [NodeDefsActions.nodeDefsUpdate]: (state, { nodeDefs }) => NodeDefsState.mergeNodeDefs(nodeDefs)(state),

  [NodeDefsActions.nodeDefPropsUpdateCancel]: (state, { nodeDef, nodeDefOriginal, isNodeDefNew }) => {
    let stateUpdated = isNodeDefNew
      ? NodeDefsState.dissocNodeDef(nodeDef)(state) // Remove node def from state
      : NodeDefsState.assocNodeDef(nodeDefOriginal)(state) // Restore original version of node def
    stateUpdated = NodeDefsState.dissocDirty(stateUpdated)
    return stateUpdated
  },
}

export default exportReducer(actionHandlers)
