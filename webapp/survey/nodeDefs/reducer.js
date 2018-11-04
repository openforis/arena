import * as R from 'ramda'

import { exportReducer } from '../../appUtils/reduxUtils'

import { surveyUpdate } from '../actions'
import { formReset } from '../../appModules/surveyForm/actions'

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
  // reset form
  [surveyUpdate]: () => null,
  [formReset]: () => null,

  [nodeDefsLoad]: (state = {}, {nodeDefs}) => nodeDefs,

  // single nodeDef actions
  [nodeDefCreate]: (state, {nodeDef}) => assocNodeDef(nodeDef)(state),

  [nodeDefUpdate]: (state, {nodeDef}) => assocNodeDef(nodeDef)(state),

  [nodeDefPropUpdate]: (state, {nodeDefUUID, key, value}) => assocNodeDefProp(nodeDefUUID, key, value)(state),

  [nodeDefDelete]: (state, {nodeDef}) => dissocNodeDef(nodeDef)(state),

}

export default exportReducer(actionHandlers)