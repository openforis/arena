import * as R from 'ramda'

const record = 'record'
const current = 'current'

/**
 * ======================
 * Survey State
 * ======================
 */
export const getRecordState = R.prop(record)

export const getCurrentRecord = R.pipe(getRecordState, R.prop(current))

export const assocCurrentRecord = record => R.assoc(current, record)