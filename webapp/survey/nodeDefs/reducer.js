import { exportReducer } from '@webapp/utils/reduxUtils'

import { appUserLogout } from '@webapp/app/actions'

import { surveyCreate, surveyDefsLoad, surveyDefsReset, surveyDelete, surveyUpdate } from '../actions'

import { nodeDefCreate, nodeDefPropsUpdate, nodeDefDelete, nodeDefsUpdate } from './actions'

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

  [nodeDefPropsUpdate]: (state, { nodeDefUuid, props, propsAdvanced }) =>
    NodeDefsState.assocNodeDefProps(nodeDefUuid, props, propsAdvanced)(state),

  [nodeDefDelete]: (state, { nodeDef }) => NodeDefsState.dissocNodeDef(nodeDef)(state),

  [nodeDefsUpdate]: (state, { nodeDefs }) => NodeDefsState.mergeNodeDefs(nodeDefs)(state),
}

export default exportReducer(actionHandlers)
