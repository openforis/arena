import * as R from 'ramda'

import * as Record from '@core/record/record'

import * as SurveyViewsState from '../../../loggedin/surveyViews/surveyViewsState'

export const stateKey = 'record'

const getState = R.pipe(SurveyViewsState.getState, R.prop(stateKey))

const keys = {
  recordEdit: 'recordEdit',
  recordPreviewUuid: 'recordPreviewUuid',
}

// ====== READ

export const getRecord = R.pipe(getState, R.prop(keys.recordEdit))

export const getRecordUuid = R.pipe(getRecord, Record.getUuid)

export const getRecordUuidPreview = R.pipe(getState, R.prop(keys.recordPreviewUuid))

// ====== UPDATE

export const assocRecord = R.assoc(keys.recordEdit)

export const assocRecordUuidPreview = R.assoc(keys.recordPreviewUuid)

const _updateRecord = fn => recordState =>
  R.pipe(R.prop(keys.recordEdit), fn, record => R.assoc(keys.recordEdit, record)(recordState))(recordState)

export const mergeRecordNodes = nodes => _updateRecord(Record.mergeNodes(nodes))

export const deleteRecordNode = node => _updateRecord(Record.deleteNode(node))

export const mergeRecordNodeValidations = validations => _updateRecord(Record.mergeNodeValidations(validations))
