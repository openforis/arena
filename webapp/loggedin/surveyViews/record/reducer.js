import { exportReducer } from '@webapp/utils/reduxUtils'

import { SystemActions } from '@webapp/store/system'

import { SurveyActions } from '@webapp/store/survey'
import { formReset } from '../surveyForm/actions'

import {
  nodeDelete,
  nodesUpdate,
  recordCreate,
  recordDelete,
  recordLoad,
  recordUuidPreviewUpdate,
  validationsUpdate,
} from './actions'

import * as RecordState from './recordState'

const actionHandlers = {
  // Reset form
  [SystemActions.SYSTEM_RESET]: () => ({}),

  [SurveyActions.surveyCreate]: () => ({}),
  [SurveyActions.surveyUpdate]: () => ({}),
  [SurveyActions.surveyDelete]: () => ({}),
  [formReset]: () => ({}),

  // Record updates
  [recordCreate]: (state, { record }) => RecordState.assocRecord(record)(state),
  [recordLoad]: (state, { record }) => RecordState.assocRecord(record)(state),
  [recordDelete]: (state) => RecordState.assocRecord(null)(state),

  // Node updates
  [nodesUpdate]: (state, { nodes }) => RecordState.mergeRecordNodes(nodes)(state),
  [nodeDelete]: (state, { node }) => RecordState.deleteRecordNode(node)(state),

  // Validation updates
  [validationsUpdate]: (state, { validations }) => RecordState.mergeRecordNodeValidations(validations)(state),

  // Record preview
  [recordUuidPreviewUpdate]: (state, { recordUuid }) => RecordState.assocRecordUuidPreview(recordUuid)(state),
}

export default exportReducer(actionHandlers)
