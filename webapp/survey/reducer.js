import { assocActionProps, exportReducer, } from '../appUtils/reduxUtils'

import {
  assocNodeDef,
  assocNodeDefProp,
  assocNodeDefs,
  assocFormNodeDefEdit,
  assocNodeDefPropValidation,
} from './surveyState'

/**
 * survey actions
 */
import {
  surveyCurrentUpdate,
  surveyNewUpdate,
} from './actions'
/**
 * nodeDef Actions
 */
import {
  nodeDefPropUpdate,
  nodeDefsUpdate,
  nodeDefUpdate,
  nodeDefPropValidationUpdate,

  //survey-form
  formNodeDefEditUpdate,
} from './nodeDef/actions'

const actionHandlers = {
  //survey
  [surveyNewUpdate]: assocActionProps,

  //on app current survey update, reset survey state
  [surveyCurrentUpdate]: (state, action) => ({}),

  // nodeDefs
  [nodeDefsUpdate]: (state, {nodeDefs}) => assocNodeDefs(nodeDefs)(state),

  [nodeDefUpdate]: (state, {nodeDef}) => assocNodeDef(nodeDef)(state),

  [nodeDefPropUpdate]: (state, {nodeDefUUID, key, value}) => assocNodeDefProp(nodeDefUUID, key, value)(state),

  [nodeDefPropValidationUpdate]: (state, {nodeDefUUID, key, validation}) => assocNodeDefPropValidation(nodeDefUUID, key, validation)(state),

  //survey-form
  [formNodeDefEditUpdate]: (state, {nodeDef}) => assocFormNodeDefEdit(nodeDef)(state),
}

export default exportReducer(actionHandlers)