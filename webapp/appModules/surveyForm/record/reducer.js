import { exportReducer } from '../../../appUtils/reduxUtils'

import Record from '../../../../common/record/record'
import { appUserLogout } from '../../../app/actions'

import { surveyDelete, surveyUpdate } from '../../../survey/actions'
import { formReset } from '../actions'

import { nodeDelete, nodesUpdate, recordCreate, recordDelete, recordLoad, validationsUpdate } from './actions'

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
  [nodesUpdate]: (state,  { nodes }) => Record.assocNodes(nodes)(state),
  [nodeDelete]: (state, { node }) => Record.deleteNode(node)(state),

  // validation updates
  [validationsUpdate]: (state, {validations}) => Record.mergeNodeValidations(validations)(state),
}

export default exportReducer(actionHandlers)