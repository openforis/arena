import * as R from 'ramda'

import * as Record from '@core/record/record'

import * as UiState from '../state'

export const stateKey = 'record'

const getState = R.pipe(UiState.getState, R.propOr({}, stateKey))

const keys = {
  recordEdit: 'recordEdit',
  recordPreviewUuid: 'recordPreviewUuid',
  insideMap: 'insideMap',
}

// ====== READ

export const getRecord = R.pipe(getState, R.prop(keys.recordEdit))

export const getRecordUuid = R.pipe(getRecord, Record.getUuid)

export const getRecordUuidPreview = R.pipe(getState, R.prop(keys.recordPreviewUuid))

export const isInsideMap = R.pipe(getState, R.prop(keys.insideMap))

// ====== UPDATE

export const reset = () => ({})

export const assocRecord = R.assoc(keys.recordEdit)

export const assocRecordUuidPreview = R.assoc(keys.recordPreviewUuid)

export const assocInsideMap = R.assoc(keys.insideMap)

const _updateRecord = (fn) => (recordState) =>
  R.pipe(R.prop(keys.recordEdit), fn, (record) => R.assoc(keys.recordEdit, record)(recordState))(recordState)

export const mergeRecordNodes = (nodes) => _updateRecord(Record.mergeNodes(nodes, true))

export const deleteRecordNode = (node) => _updateRecord(Record.deleteNode(node))

export const mergeRecordNodeValidations = (validations) => _updateRecord(Record.mergeNodeValidations(validations))
