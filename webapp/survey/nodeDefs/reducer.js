import { exportReducer } from '../../utils/reduxUtils'

import { appUserLogout } from '../../app/actions'

import { surveyCreate, surveyDefsLoad, surveyDelete, surveyUpdate } from '../actions'

import {
  nodeDefsLoad,
  nodeDefCreate,
  nodeDefUpdate,
  nodeDefPropsUpdate,
  nodeDefDelete,
} from './actions'

import * as NodeDefsState from './nodeDefsState'

const actionHandlers = {
  [appUserLogout]: () => ({}),

  // reset state
  [surveyCreate]: () => ({}),
  [surveyUpdate]: () => ({}),
  [surveyDelete]: () => ({}),

  [nodeDefsLoad]: (state = {}, { nodeDefs }) => nodeDefs,

  [surveyDefsLoad]: (state = {}, { nodeDefs }) => nodeDefs,

  // single nodeDef actions
  [nodeDefCreate]: (state, { nodeDef }) => NodeDefsState.assocNodeDef(nodeDef)(state),

  [nodeDefUpdate]: (state, { nodeDef }) => NodeDefsState.assocNodeDef(nodeDef)(state),

  [nodeDefPropsUpdate]: (state, { nodeDefUuid, props, propsAdvanced }) => NodeDefsState.assocNodeDefProps(nodeDefUuid, props, propsAdvanced)(state),

  [nodeDefDelete]: (state, { nodeDef }) => NodeDefsState.dissocNodeDef(nodeDef)(state),

}

export default exportReducer(actionHandlers)