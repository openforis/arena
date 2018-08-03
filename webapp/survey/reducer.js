import { assocActionProps, exportReducer, } from '../appUtils/reduxUtils'

import {
  assocNodeDef,
  assocNodeDefProp,
  assocNodeDefs,
  assocFormNodeDefEdit,
} from './surveyState'

/**
 * survey actions
 */
import { surveyCurrentUpdate, surveyNewUpdate, } from './actions'
/**
 * nodeDef Actions
 */
import {
  nodeDefPropUpdate,
  nodeDefsUpdate,
  nodeDefUpdate,

  //survey-form
  formNodeDefEditUpdate,
} from './nodeDefActions'

const actionHandlers = {
  //survey
  [surveyNewUpdate]: assocActionProps,

  //current survey update reset state
  [surveyCurrentUpdate]: (state, action) => ({}),

  // nodeDefs
  [nodeDefsUpdate]: (state, {nodeDefs}) => assocNodeDefs(nodeDefs)(state),

  [nodeDefUpdate]: (state, {nodeDef}) => assocNodeDef(nodeDef)(state),

  [nodeDefPropUpdate]: (state, {nodeDefUUID, key, value}) => assocNodeDefProp(nodeDefUUID, key, value)(state),

  //survey-form
  [formNodeDefEditUpdate]: (state, {nodeDef}) => assocFormNodeDefEdit(nodeDef)(state),
}

export default exportReducer(actionHandlers)