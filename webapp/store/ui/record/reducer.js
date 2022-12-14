import * as A from '@core/arena'

import { exportReducer } from '@webapp/utils/reduxUtils'

import { SystemActions } from '@webapp/store/system'

import { SurveyActions } from '@webapp/store/survey'
import { SurveyFormActions } from '@webapp/store/ui/surveyForm'

import * as RecordActions from './actions'
import * as RecordState from './state'

const actionHandlers = {
  // Reset form
  [SystemActions.SYSTEM_RESET]: () => ({}),

  [SurveyActions.surveyCreate]: () => ({}),
  [SurveyActions.surveyUpdate]: () => ({}),
  [SurveyActions.surveyDelete]: () => ({}),
  [SurveyFormActions.formReset]: () => ({}),

  // Record updates
  [RecordActions.recordCreate]: (state, { record }) => RecordState.assocRecord(record)(state),
  [RecordActions.recordLoad]: (state, { record, insideMap }) =>
    A.pipe(RecordState.assocRecord(record), RecordState.assocInsideMap(insideMap))(state),
  [RecordActions.recordLoadError]: (state, { error }) => RecordState.assocRecordLoadError(error)(state),
  [RecordActions.recordDelete]: (state) => RecordState.assocRecord(null)(state),
  [RecordActions.recordCheckedOut]: RecordState.reset,

  // Node updates
  [RecordActions.nodesUpdate]: (state, { nodes }) => RecordState.mergeRecordNodes(nodes)(state),
  [RecordActions.nodeDelete]: (state, { node }) => RecordState.deleteRecordNode(node)(state),

  // Validation updates
  [RecordActions.validationsUpdate]: (state, { validations }) =>
    RecordState.mergeRecordNodeValidations(validations)(state),

  // Record preview
  [RecordActions.recordUuidPreviewUpdate]: (state, { recordUuid }) =>
    recordUuid ? RecordState.assocRecordUuidPreview(recordUuid)(state) : RecordState.reset(state),
}

export default exportReducer(actionHandlers)
