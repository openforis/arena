import * as R from 'ramda'

export const keys = {
  recordUuid: 'recordUuid',
}

export const getRecordUuid = R.prop(keys.recordUuid)
