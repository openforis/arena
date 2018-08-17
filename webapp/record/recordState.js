import * as R from 'ramda'

const record = 'record'
const current = 'current'

/**
 * ======================
 * Record State
 * ======================
 */
export const getRecordState = R.prop(record)

export const getCurrentRecord = R.pipe(getRecordState, R.prop(current))

export const getCurrentRecordId = R.pipe(getCurrentRecord, R.prop('id'))

export const assocCurrentRecord = record => R.assoc(current, record)
