import * as R from 'ramda'

import * as DateState from '../dataState'

const keys = {
  list: 'list',
  nodeDefKeys: 'nodeDefKeys',
  count: 'count',
  limit: 'limit',
  offset: 'offset',
}

const getState = R.pipe(DateState.getState, R.prop('records'))

const getStateProp = (prop, defaultValue = null) => R.pipe(getState, R.propOr(defaultValue, prop))

export const getRecordsList = getStateProp(keys.list, [])

export const getRecordsNodeDefKeys = getStateProp(keys.nodeDefKeys, [])

export const getRecordsCount = getStateProp(keys.count)

export const getRecordsLimit = getStateProp(keys.limit)

export const getRecordsOffset = getStateProp(keys.offset)