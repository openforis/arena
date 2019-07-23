import * as R from 'ramda'

const keys = {
  list: 'list',
  count: 'count',
  limit: 'limit',
  offset: 'offset',
}

const getState = R.prop('users')

const getStateProp = (prop, defaultValue = null) => R.pipe(getState, R.propOr(defaultValue, prop))

export const getList = getStateProp(keys.list, [])

export const getCount = getStateProp(keys.count)

export const getLimit = getStateProp(keys.limit)

export const getOffset = getStateProp(keys.offset)
