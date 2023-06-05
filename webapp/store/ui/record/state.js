import * as R from 'ramda'

import * as Record from '@core/record/record'

import * as UiState from '../state'

export const stateKey = 'record'

const getState = R.pipe(UiState.getState, R.propOr({}, stateKey))

const keys = {
  recordEdit: 'recordEdit',
  recordLoadError: 'recordLoadError',
  recordPreviewUuid: 'recordPreviewUuid',
  noHeader: 'noHeader',
}

// ====== READ

export const getRecord = R.pipe(getState, R.prop(keys.recordEdit))

export const getRecordLoadError = R.pipe(getState, R.prop(keys.recordLoadError))

export const getRecordUuidPreview = R.pipe(getState, R.prop(keys.recordPreviewUuid))

export const hasNoHeader = R.pipe(getState, R.prop(keys.noHeader))

export const getRecordUuid = R.pipe(getRecord, Record.getUuid)

// ====== UPDATE

export const reset = () => ({})

export const assocRecord = R.assoc(keys.recordEdit)

export const assocRecordLoadError = R.assoc(keys.recordLoadError)

export const assocRecordUuidPreview = R.assoc(keys.recordPreviewUuid)

export const assocNoHeader = R.assoc(keys.noHeader)

const _updateRecord = (fn) => (recordState) =>
  R.pipe(R.prop(keys.recordEdit), fn, (record) => R.assoc(keys.recordEdit, record)(recordState))(recordState)

export const mergeRecordNodes = (nodes) => _updateRecord(Record.mergeNodes(nodes, true))

export const deleteRecordNode = (node) => _updateRecord(Record.deleteNode(node))

export const mergeRecordNodeValidations = (validations) => _updateRecord(Record.mergeNodeValidations(validations))
