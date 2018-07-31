import { assocActionProps, exportReducer, } from '../appUtils/reduxUtils'
/**
 * survey actions
 */
import { surveyNewUpdate, } from './actions'
/**
 * nodeDef Actions
 */
import { nodeDefFetch } from './nodeDefActions'
import { assocNodeDef } from './surveyState'

const actionHandlers = {
  //survey
  [surveyNewUpdate]: assocActionProps,

  // nodeDef
  [nodeDefFetch]: (state, {nodeDef}) => assocNodeDef(nodeDef)(state)

}

export default exportReducer(actionHandlers)