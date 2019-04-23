import * as R from 'ramda'

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

import {
  assocNodeDef,
  assocNodeDefProps,
  dissocNodeDef,
} from './nodeDefsState'

const actionHandlers = {
  [appUserLogout]: () => ({}),

  // reset state
  [surveyCreate]: () => ({}),
  [surveyUpdate]: () => ({}),
  [surveyDelete]: () => ({}),

  [nodeDefsLoad]: (state = {}, { nodeDefs }) => nodeDefs,

  [surveyDefsLoad]: (state = {}, { nodeDefs }) => nodeDefs,

  // single nodeDef actions
  [nodeDefCreate]: (state, { nodeDef }) => assocNodeDef(nodeDef)(state),

  [nodeDefUpdate]: (state, { nodeDef }) => assocNodeDef(nodeDef)(state),

  [nodeDefPropsUpdate]: (state, { nodeDefUuid, props, propsAdvanced }) =>
    assocNodeDefProps(nodeDefUuid, props, propsAdvanced)(state),

  [nodeDefDelete]: (state, { nodeDef }) => dissocNodeDef(nodeDef)(state),

}

export default exportReducer(actionHandlers)