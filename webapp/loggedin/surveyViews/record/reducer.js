import { exportReducer } from '../../../utils/reduxUtils'

import Record from '../../../../core/record/record'
import { appUserLogout } from '../../../app/actions'

import { surveyCreate, surveyDelete, surveyUpdate } from '../../../survey/actions'
import { formReset } from '../surveyForm/actions'

import { nodeDelete, nodesUpdate, recordCreate, recordDelete, recordLoad, validationsUpdate } from './actions'

const actionHandlers = {
  // reset form
  [appUserLogout]: () => ({}),

  [surveyCreate]: () => ({}),
  [surveyUpdate]: () => ({}),
  [surveyDelete]: () => ({}),
  [formReset]: () => ({}),

  // record updates
  [recordCreate]: (state, { record }) => record,
  [recordLoad]: (state, { record }) => record,
  [recordDelete]: () => ({}),

  // node updates
  [nodesUpdate]: (state, { nodes }) => Record.assocNodes(nodes)(state),
  [nodeDelete]: (state, { node }) => Record.deleteNode(node)(state),

  // validation updates
  [validationsUpdate]: (state, { validations }) => Record.mergeNodeValidations(validations)(state),
}

export default exportReducer(actionHandlers)