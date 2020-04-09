import * as R from 'ramda'

import * as HomeState from '../../homeState'

const keys = {
  initialized: 'initialized',
  messages: 'messages',
  loadComplete: 'loadComplete',
}

export const stateKey = 'activityLog'

export const getState = R.pipe(HomeState.getState, R.prop(stateKey))

// ===== READ
export const isInitialized = R.pipe(getState, R.propEq(keys.initialized, true))
export const getMessages = R.pipe(getState, R.propOr([], keys.messages))
export const isLoadComplete = R.pipe(getState, R.propOr(false, keys.loadComplete))

// ===== UPDATE
export const assocInitialized = R.assoc(keys.initialized, true)
export const assocMessages = R.assoc(keys.messages)
export const assocLoadComplete = R.assoc(keys.loadComplete)
