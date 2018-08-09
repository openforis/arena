import { assocActionProps, exportReducer, } from '../appUtils/reduxUtils'

import {
  assocNodeDef,
  assocNodeDefProp,
  assocNodeDefs,
  assocFormNodeDefEdit,
  assocNodeDefFormUnlocked,
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
  formNodeDefUnlockedUpdate,
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

  //survey-form
  [formNodeDefEditUpdate]: (state, {nodeDef}) => assocFormNodeDefEdit(nodeDef)(state),

  [formNodeDefUnlockedUpdate]: (state, {nodeDef}) => assocNodeDefFormUnlocked(nodeDef)(state),
}

export default exportReducer(actionHandlers)