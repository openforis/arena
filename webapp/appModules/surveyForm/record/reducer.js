import { exportReducer } from '../../../appUtils/reduxUtils'

import { assocNodes, deleteNode } from '../../../../common/record/record'

import { surveyDelete, surveyUpdate } from '../../../survey/actions'
import { formReset } from '../actions'

import { nodeDelete, nodesUpdate, recordCreate, recordLoad } from './actions'

const actionHandlers = {
  // reset form
  [surveyUpdate]: () => ({}),
  [surveyDelete]: () => ({}),
  [formReset]: () => ({}),

  // adding record to form
  [recordCreate]: (state, {record}) => record,
  [recordLoad]: (state, {record}) => record,

  // node updates
  [nodesUpdate]: (state, {nodes}) => assocNodes(nodes)(state),
  [nodeDelete]: (state, {node}) => deleteNode(node)(state),
}

export default exportReducer(actionHandlers)