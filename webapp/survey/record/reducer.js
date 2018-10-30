import { exportReducer } from '../../appUtils/reduxUtils'

import { assocNodes, deleteNode } from '../../../common/record/record'

import { surveyCurrentUpdate } from '../actions'
import { formReset } from '../form/actions'

import { nodeDelete, nodesUpdate, recordCreate } from './actions'



const actionHandlers = {
  // reset form
  [surveyCurrentUpdate]: () => null,
  [formReset]: () => null,

  [recordCreate]: (state, {record}) => record,

  [nodesUpdate]: (state, {nodes}) => assocNodes(nodes)(state),

  [nodeDelete]: (state, {node}) => deleteNode(node)(state),

}

export default exportReducer(actionHandlers)