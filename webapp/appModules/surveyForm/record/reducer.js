import { exportReducer } from '../../../appUtils/reduxUtils'

import { assocNodes, deleteNode } from '../../../../common/record/record'

import { surveyUpdate } from '../../../survey/actions'
import { formReset } from '../actions'

import { nodeDelete, nodesUpdate, recordCreate } from './actions'

const actionHandlers = {
  // reset form
  [surveyUpdate]: () => ({}),
  [formReset]: () => ({}),

  [recordCreate]: (state, {record}) => record,

  [nodesUpdate]: (state, {nodes}) => assocNodes(nodes)(state),

  [nodeDelete]: (state, {node}) => deleteNode(node)(state),

}

export default exportReducer(actionHandlers)