import { assocActionProps, exportReducer, } from '../appUtils/reduxUtils'

import {
  assocFieldValidation,
  assocNodeDef,
  assocNodeDefProp,
  assocNodeDefs,
  assocFormNodeDefEdit,
} from './surveyState'

/**
 * survey actions
 */
import { surveyCurrentUpdate, surveyCurrentFieldValidationUpdate, surveyNewUpdate, } from './actions'
/**
 * nodeDef Actions
 */
import {
  nodeDefPropUpdate,
  nodeDefsUpdate,
  nodeDefUpdate,
  nodeDefValidationUpdate,

  //survey-form
  formNodeDefEditUpdate,
} from './nodeDef/actions'

const actionHandlers = {
  //survey
  [surveyNewUpdate]: assocActionProps,

  //on app current survey update, reset survey state
  [surveyCurrentUpdate]: (state, action) => ({}),

  [surveyCurrentFieldValidationUpdate]: (state, {field, validation}) => assocFieldValidation(field, validation)(state),

  // nodeDefs
  [nodeDefsUpdate]: (state, {nodeDefs}) => assocNodeDefs(nodeDefs)(state),

  [nodeDefUpdate]: (state, {nodeDef}) => assocNodeDef(nodeDef)(state),

  [nodeDefPropUpdate]: (state, {nodeDefUUID, key, value}) => assocNodeDefProp(nodeDefUUID, key, value)(state),

  [nodeDefValidationUpdate]: (state, {nodeDefUUID, field, validation}) => assocNodeDefValidation(nodeDefUUID, field, validation)(state),

  //survey-form
  [formNodeDefEditUpdate]: (state, {nodeDef}) => assocFormNodeDefEdit(nodeDef)(state),
}

export default exportReducer(actionHandlers)