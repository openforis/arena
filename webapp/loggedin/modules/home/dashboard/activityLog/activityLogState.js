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
export const getOffset = R.propOr(0, keys.offset)
export const getLimit = R.propOr(30, keys.limit)
export const getMessages = R.propOr([], keys.messages)
export const isLoadComplete = R.propOr(false, keys.loadComplete)

// ===== UPDATE
export const assocOffset = R.assoc(keys.offset)
export const assocLimit = R.assoc(keys.limit)
export const assocMessages = R.assoc(keys.messages)
export const assocLoadComplete = R.assoc(keys.loadComplete)
