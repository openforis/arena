import { exportReducer } from '@webapp/utils/reduxUtils'

import { appUserLogout } from '@webapp/app/actions'

import { surveyCreate, surveyDefsLoad, surveyDefsReset, surveyDelete, surveyUpdate } from '../actions'

import {
  nodeDefCreate,
  nodeDefDelete,
  nodeDefUpdate,
  nodeDefsUpdate,
  nodeDefPropsUpdate,
  nodeDefPropsUpdateCancel,
} from './actions'

import * as NodeDefsState from './nodeDefsState'

const actionHandlers = {
  [appUserLogout]: () => ({}),

  // Reset state
  [surveyCreate]: () => ({}),
  [surveyUpdate]: () => ({}),
  [surveyDelete]: () => ({}),

  [surveyDefsReset]: () => ({}),

  [surveyDefsLoad]: (_state, { nodeDefs }) => nodeDefs,

  // Single nodeDef actions
  [nodeDefCreate]: (state, { nodeDef }) => NodeDefsState.assocNodeDef(nodeDef)(state),

  [nodeDefDelete]: (state, { nodeDef }) => NodeDefsState.dissocNodeDef(nodeDef)(state),

  [nodeDefUpdate]: (state, { nodeDef }) => NodeDefsState.assocNodeDef(nodeDef)(state),

  [nodeDefsUpdate]: (state, { nodeDefs }) => NodeDefsState.mergeNodeDefs(nodeDefs)(state),

  [nodeDefPropsUpdate]: (state, { nodeDef }) => NodeDefsState.assocNodeDef(nodeDef)(state),

  [nodeDefPropsUpdateCancel]: (state, { nodeDef, nodeDefOriginal, isNodeDefNew }) =>
    isNodeDefNew
      ? NodeDefsState.dissocNodeDef(nodeDef)(state) // Remove node def from state
      : NodeDefsState.assocNodeDef(nodeDefOriginal)(state), // Restore original version of node def
}

export default exportReducer(actionHandlers)
