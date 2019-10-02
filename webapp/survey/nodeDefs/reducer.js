import { exportReducer } from '../../utils/reduxUtils'

import { appUserLogout } from '../../app/actions'

import {
  surveyCreate,
  surveyDefsLoad,
  surveyDefsReset,
  surveyNodeDefsLoad,
  surveyDelete,
  surveyUpdate
} from '../actions'

import {
  nodeDefCreate,
  nodeDefPropsUpdate,
  nodeDefDelete,
  nodeDefsUpdate,
} from './actions'

import * as NodeDefsState from './nodeDefsState'

const actionHandlers = {
  [appUserLogout]: () => ({}),

  // reset state
  [surveyCreate]: () => ({}),
  [surveyUpdate]: () => ({}),
  [surveyDelete]: () => ({}),

  [surveyDefsReset]: () => ({}),

  [surveyDefsLoad]: (state = {}, { nodeDefs }) => nodeDefs,
  [surveyNodeDefsLoad]: (state = {}, { nodeDefs }) => nodeDefs,

  // single nodeDef actions
  [nodeDefCreate]: (state, { nodeDef }) => NodeDefsState.assocNodeDef(nodeDef)(state),

  [nodeDefPropsUpdate]: (state, { nodeDefUuid, props, propsAdvanced }) => NodeDefsState.assocNodeDefProps(nodeDefUuid, props, propsAdvanced)(state),

  [nodeDefDelete]: (state, { nodeDef }) => NodeDefsState.dissocNodeDef(nodeDef)(state),

  [nodeDefsUpdate]: (state, { nodeDefs }) => NodeDefsState.mergeNodeDefs(nodeDefs)(state),

}

export default exportReducer(actionHandlers)