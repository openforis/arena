import { exportReducer } from '@webapp/utils/reduxUtils'

import * as Record from '@core/record/record'
import { appUserLogout } from '@webapp/app/actions'

import { surveyCreate, surveyDelete, surveyUpdate } from '@webapp/survey/actions'
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
  [nodesUpdate]: (state, { nodes }) => Record.mergeNodes(nodes)(state),
  [nodeDelete]: (state, { node }) => Record.deleteNode(node)(state),

  // validation updates
  [validationsUpdate]: (state, { validations }) => Record.mergeNodeValidations(validations)(state),
}

export default exportReducer(actionHandlers)