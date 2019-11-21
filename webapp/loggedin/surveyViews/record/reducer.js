import { exportReducer } from '@webapp/utils/reduxUtils'

import { appUserLogout } from '@webapp/app/actions'

import { surveyCreate, surveyDelete, surveyUpdate } from '@webapp/survey/actions'
import { formReset } from '../surveyForm/actions'

import {
  nodeDelete,
  nodesUpdate,
  recordCreate,
  recordDelete,
  recordLoad,
  recordUuidPreviewUpdate,
  validationsUpdate
} from './actions'

import * as RecordState from './recordState'

const actionHandlers = {
  // reset form
  [appUserLogout]: () => ({}),

  [surveyCreate]: () => ({}),
  [surveyUpdate]: () => ({}),
  [surveyDelete]: () => ({}),
  [formReset]: () => ({}),

  // record updates
  [recordCreate]: (state, { record }) => RecordState.assocRecord(record)(state),
  [recordLoad]: (state, { record }) => RecordState.assocRecord(record)(state),
  [recordDelete]: (state) => RecordState.assocRecord(null)(state),

  // node updates
  [nodesUpdate]: (state, { nodes }) => RecordState.mergeRecordNodes(nodes)(state),
  [nodeDelete]: (state, { node }) => RecordState.deleteRecordNode(node)(state),

  // validation updates
  [validationsUpdate]: (state, { validations }) => RecordState.mergeRecordNodeValidations(validations)(state),

  // record preview
  [recordUuidPreviewUpdate]: (state, { recordUuid }) => RecordState.assocRecordUuidPreview(recordUuid)(state)
}

export default exportReducer(actionHandlers)