import { exportReducer } from '../../../appUtils/reduxUtils'

import { assocNodes, deleteNode } from '../../../../common/record/record'
import { appUserLogout } from '../../../app/actions'

import { surveyDelete, surveyUpdate } from '../../../survey/actions'
import { formReset } from '../actions'

import { nodeDelete, nodesUpdate, recordCreate, recordDelete, recordLoad } from './actions'

const actionHandlers = {
  // reset form
  [appUserLogout]: () => ({}),

  [surveyUpdate]: () => ({}),
  [surveyDelete]: () => ({}),
  [formReset]: () => ({}),

  // record updates
  [recordCreate]: (state, { record }) => record,
  [recordLoad]: (state, { record }) => record,
  [recordDelete]: () => ({}),

  // node updates
  [nodesUpdate]: (state, { nodes }) => assocNodes(nodes)(state),
  [nodeDelete]: (state, { node }) => deleteNode(node)(state),
}

export default exportReducer(actionHandlers)