import * as A from '@core/arena'
import * as Record from '@core/record/record'

import * as UiState from '../state'

export const stateKey = 'record'

const getState = A.pipe(UiState.getState, A.propOr({}, stateKey))

const keys = {
  recordEdit: 'recordEdit',
  recordEditLocked: 'recordEditLocked',
  recordLoadError: 'recordLoadError',
  recordPreviewUuid: 'recordPreviewUuid',
  noHeader: 'noHeader',
}

// ====== READ

export const getRecord = A.pipe(getState, A.prop(keys.recordEdit))

export const isRecordEditLocked = A.pipe(
  getState,
  (recordState) => String(A.prop(keys.recordEditLocked)(recordState)) === 'true'
)

export const getRecordLoadError = A.pipe(getState, A.prop(keys.recordLoadError))

export const getRecordUuidPreview = A.pipe(getState, A.prop(keys.recordPreviewUuid))

export const hasNoHeader = A.pipe(getState, A.prop(keys.noHeader))

export const getRecordUuid = A.pipe(getRecord, Record.getUuid)

// ====== UPDATE

export const reset = () => ({})

export const assocRecord = A.assoc(keys.recordEdit)

export const assocRecordLoadError = A.assoc(keys.recordLoadError)

export const assocRecordUuidPreview = A.assoc(keys.recordPreviewUuid)

export const assocNoHeader = A.assoc(keys.noHeader)

export const assocRecordEditLocked = A.assoc(keys.recordEditLocked)

const _updateRecord = (fn) => (recordState) =>
  A.pipe(A.prop(keys.recordEdit), fn, (record) => A.assoc(keys.recordEdit, record)(recordState))(recordState)

export const mergeRecordNodes = (nodes) => _updateRecord(Record.mergeNodes(nodes, { removeFlags: true }))

export const deleteRecordNode = (node) => _updateRecord(Record.deleteNode(node))

export const mergeRecordNodeValidations = (validations) => _updateRecord(Record.mergeNodeValidations(validations))
