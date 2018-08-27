import { assocActionProps, exportReducer, } from '../appUtils/reduxUtils'

import {
  assocNodeDef,
  assocNodeDefProp,
  assocNodeDefs,
  assocFormNodeDefEdit,
  assocNodeDefValidation,
  assocNodeDefPropValidation,
  assocNodeDefFormUnlocked,
  assocFormNodeDefViewPage,
  //record
  assocRecord,
  updateRecordNodes,
  deleteRecordNodeAndChildren,
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
  nodeDefValidationUpdate,
  nodeDefPropValidationUpdate,

  //survey-form
  formNodeDefEditUpdate,
  formNodeDefUnlockedUpdate,
  formNodeDefViewPage,
} from './nodeDef/actions'

/**
 * record actions
 */
import {
  nodeDeleted,
  recordCreated,
  recordUpdated
} from '../record/actions'

const actionHandlers = {
  //survey
  [surveyNewUpdate]: assocActionProps,

  //on app current survey update, reset survey state
  [surveyCurrentUpdate]: (state, action) => ({}),

  // nodeDefs
  [nodeDefsUpdate]: (state, {nodeDefs}) => assocNodeDefs(nodeDefs)(state),

  [nodeDefUpdate]: (state, {nodeDef}) => assocNodeDef(nodeDef)(state),

  [nodeDefPropUpdate]: (state, {nodeDefUUID, key, value}) => assocNodeDefProp(nodeDefUUID, key, value)(state),

  [nodeDefValidationUpdate]: (state, {nodeDefUUID, validation}) => assocNodeDefValidation(nodeDefUUID, validation)(state),

  [nodeDefPropValidationUpdate]: (state, {nodeDefUUID, key, validation}) => assocNodeDefPropValidation(nodeDefUUID, key, validation)(state),

  //survey-form
  [formNodeDefEditUpdate]: (state, {nodeDef}) => assocFormNodeDefEdit(nodeDef)(state),

  [formNodeDefUnlockedUpdate]: (state, {nodeDef}) => assocNodeDefFormUnlocked(nodeDef)(state),

  [formNodeDefViewPage]: (state, {nodeDef}) => assocFormNodeDefViewPage(nodeDef)(state),

  //record
  [recordCreated]: (state, {record}) => assocRecord(record)(state),

  [recordUpdated]: (state, {updatedNodes}) => updateRecordNodes(updatedNodes)(state),

  [nodeDeleted]: (state, {node}) => deleteRecordNodeAndChildren(node)(state),

}

export default exportReducer(actionHandlers)