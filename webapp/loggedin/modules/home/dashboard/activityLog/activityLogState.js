import * as R from 'ramda'

import * as HomeState from '../../homeState'

const keys = {
  offset: 'offset',
  limit: 'limit',
  messages: 'messages',
  loadComplete: 'loadComplete',
}

export const stateKey = 'activityLog'

export const getState = R.pipe(HomeState.getState, R.prop(stateKey))

// ===== READ
export const getOffset = R.pipe(getState, R.propOr(0, keys.offset))
export const getLimit = R.pipe(getState, R.propOr(30, keys.limit))
export const getMessages = R.pipe(getState, R.propOr([], keys.messages))
export const isLoadComplete = R.pipe(getState, R.propOr(false, keys.loadComplete))

// ===== UPDATE
export const assocOffset = R.assoc(keys.offset)
export const assocLimit = R.assoc(keys.limit)
export const assocMessages = R.assoc(keys.messages)
export const assocLoadComplete = R.assoc(keys.loadComplete)
