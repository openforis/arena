import * as R from 'ramda'

import * as DataState from '../dataState'

const keys = {
  list: 'list',
  nodeDefKeys: 'nodeDefKeys',
  count: 'count',
  limit: 'limit',
  offset: 'offset',
}

const getState = R.pipe(DataState.getState, R.prop('records'))

const getStateProp = (prop, defaultValue = null) => R.pipe(getState, R.propOr(defaultValue, prop))

export const getList = getStateProp(keys.list, [])

export const getNodeDefKeys = getStateProp(keys.nodeDefKeys, [])

export const getCount = getStateProp(keys.count)

export const getLimit = getStateProp(keys.limit)

export const getOffset = getStateProp(keys.offset)