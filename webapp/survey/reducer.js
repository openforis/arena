import { assocActionProps, exportReducer, } from '../appUtils/reduxUtils'
/**
 * survey actions
 */
import { surveyNewUpdate, } from './actions'
/**
 * nodeDef Actions
 */
import { nodeDefsFetch, nodeDefUpdate } from './nodeDefActions'
import { assocNodeDef, assocNodeDefs } from './surveyState'

const actionHandlers = {
  //survey
  [surveyNewUpdate]: assocActionProps,

  // nodeDef
  [nodeDefsFetch]: (state, {nodeDefs}) => assocNodeDefs(nodeDefs)(state),

  [nodeDefUpdate]: (state, {nodeDef}) => assocNodeDef(nodeDef)(state),

}

export default exportReducer(actionHandlers)