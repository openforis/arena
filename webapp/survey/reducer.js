import { assocActionProps, exportReducer, } from '../appUtils/reduxUtils'
/**
 * survey actions
 */
import { surveyNewUpdate, } from './actions'
/**
 * nodeDef Actions
 */
import { nodeDefUpdate } from './nodeDefActions'
import { assocNodeDef } from './surveyState'

const actionHandlers = {
  //survey
  [surveyNewUpdate]: assocActionProps,

  // nodeDef
  [nodeDefUpdate]: (state, {nodeDef}) => assocNodeDef(nodeDef)(state)

}

export default exportReducer(actionHandlers)