import { assocActionProps, dissocStateProps, exportReducer, } from '../appUtils/reduxUtils'
/**
 * survey actions
 */
import { surveyCurrentUpdate, surveyNewUpdate, } from './actions'
/**
 * nodeDef Actions
 */
import {
  nodeDefsUpdate,
  nodeDefUpdate,
  nodeDefPropUpdate,
} from './nodeDefActions'
import { assocNodeDef, assocNodeDefProp, assocNodeDefs } from './surveyState'
import * as R from 'ramda'

const actionHandlers = {
  //survey
  [surveyNewUpdate]: assocActionProps,

  //current survey update reset state
  [surveyCurrentUpdate]: (state, action) => ({}),

  // nodeDefs
  [nodeDefsUpdate]: (state, {nodeDefs}) => assocNodeDefs(nodeDefs)(state),

  [nodeDefUpdate]: (state, {nodeDef}) => assocNodeDef(nodeDef)(state),

  [nodeDefPropUpdate]: (state, {nodeDefUUID, key, value}) => assocNodeDefProp(nodeDefUUID, key, value)(state),

}

export default exportReducer(actionHandlers)