import * as R from 'ramda'

const record = 'record'
const current = 'current'

/**
 * ======================
 * Record State
 * ======================
 */
export const getRecordState = R.prop(record)

export const getCurrentRecord = R.prop(current)

export const getCurrentRecordId = R.pipe(getCurrentRecord, R.prop('id'))

export const getGlobalCurrentRecord = R.pipe(getRecordState, getCurrentRecord)

export const getGlobalCurrentRecordId = R.pipe(getGlobalCurrentRecord, R.prop('id'))

export const assocCurrentRecord = record => R.assoc(current, record)
