import { exportReducer } from '../../appUtils/reduxUtils'

import { surveyCreate, surveyDefsLoad, surveyDelete, surveyUpdate } from '../actions'

import {
  nodeDefsLoad,

  nodeDefCreate,
  nodeDefUpdate,
  nodeDefPropUpdate,
  nodeDefDelete,
} from './actions'

import {
  assocNodeDef,
  assocNodeDefProp,
  dissocNodeDef,
} from './nodeDefsState'

const actionHandlers = {
  // reset state
  [surveyCreate]: () => ({}),
  [surveyUpdate]: () => ({}),
  [surveyDelete]: () => ({}),

  [nodeDefsLoad]: (state = {}, {nodeDefs}) => nodeDefs,
  [surveyDefsLoad]: (state = {}, {nodeDefs}) => nodeDefs,

  // single nodeDef actions
  [nodeDefCreate]: (state, {nodeDef}) => assocNodeDef(nodeDef)(state),

  [nodeDefUpdate]: (state, {nodeDef}) => assocNodeDef(nodeDef)(state),

  [nodeDefPropUpdate]: (state, {nodeDefUUID, key, value}) => assocNodeDefProp(nodeDefUUID, key, value)(state),

  [nodeDefDelete]: (state, {nodeDef}) => dissocNodeDef(nodeDef)(state),

}

export default exportReducer(actionHandlers)