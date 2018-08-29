import { assocActionProps, exportReducer, } from '../appUtils/reduxUtils'

/**
 * survey state
 */
import {
  assocNodeDef,
  assocNodeDefProp,
  assocNodeDefs,
  assocFormNodeDefEdit,
  assocNodeDefValidation,
  assocNodeDefPropValidation,
  assocNodeDefFormUnlocked,
  assocFormNodeDefViewPage,
} from './surveyState'

/**
 * record state
 */
import {
  //record
  assocNodes,
} from './record/recordState'

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
  recordUpdate,
  nodesUpdate,
} from './record/actions'

const actionHandlers = {
  //SURVEY
  [surveyNewUpdate]: assocActionProps,

  //on app current survey update, reset survey state
  [surveyCurrentUpdate]: (state, action) => ({}),

  // NODE-DEFS
  [nodeDefsUpdate]: (state, {nodeDefs}) => assocNodeDefs(nodeDefs)(state),

  [nodeDefUpdate]: (state, {nodeDef}) => assocNodeDef(nodeDef)(state),

  [nodeDefPropUpdate]: (state, {nodeDefUUID, key, value}) => assocNodeDefProp(nodeDefUUID, key, value)(state),

  [nodeDefValidationUpdate]: (state, {nodeDefUUID, validation}) => assocNodeDefValidation(nodeDefUUID, validation)(state),

  [nodeDefPropValidationUpdate]: (state, {nodeDefUUID, key, validation}) => assocNodeDefPropValidation(nodeDefUUID, key, validation)(state),

  //SURVEY-FORM
  [formNodeDefEditUpdate]: (state, {nodeDef}) => assocFormNodeDefEdit(nodeDef)(state),

  [formNodeDefUnlockedUpdate]: (state, {nodeDef}) => assocNodeDefFormUnlocked(nodeDef)(state),

  [formNodeDefViewPage]: (state, {nodeDef}) => assocFormNodeDefViewPage(nodeDef)(state),

  //RECORD
  [recordUpdate]: assocActionProps,

  [nodesUpdate]: (state, {nodes}) => assocNodes(nodes)(state),

  // [nodeDeleted]: (state, {node}) => deleteRecordNodeAndChildren(node)(state),

}

export default exportReducer(actionHandlers)